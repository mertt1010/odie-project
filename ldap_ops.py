from ldap3 import Server, Connection, MODIFY_REPLACE
from config import LDAP_SERVER, LDAP_USER, LDAP_PASSWORD
import psycopg2
from config import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
import time

def get_ldap_connection():
    server = Server(LDAP_SERVER)
    conn = Connection(server, user=LDAP_USER, password=LDAP_PASSWORD, auto_bind=True)
    return conn

def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )

def add_user(conn_ldap, username, first_name, last_name, password, role_id=2, department_id=None):
    """
    LDAP'e kullanıcı ekler ve Supabase veritabanındaki users tablosuna kayıt yapar.
    """
    user_dn = f"CN={username},CN=Users,DC=odieproje,DC=local"

    # LDAP'te kullanıcı var mı?
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])
    if conn_ldap.entries:
        print(f"❌ Bu kullanıcı adı LDAP'te zaten var: {username}")
        return False, 'devre dışı'

    # LDAP'e kullanıcıyı ekle (önce devre dışı)
    user_attributes = {
        'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
        'cn': username,
        'sAMAccountName': username,
        'givenName': first_name,
        'sn': last_name,
        'userAccountControl': 514
    }

    if conn_ldap.add(user_dn, attributes=user_attributes):
        print(f"✅ Kullanıcı LDAP'e eklendi (devre dışı): {username}")
        time.sleep(1)

        # Şifre ata
        password_value = ('"%s"' % password).encode('utf-16-le')
        if conn_ldap.modify(user_dn, {'unicodePwd': [(MODIFY_REPLACE, [password_value])]}):
            conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [512])]})
            print("✅ Şifre atandı ve kullanıcı aktifleştirildi.")
            ldap_status = 'devrede'
        else:
            print("⚠️ Şifre atanamadı ama kullanıcı LDAP'e eklendi.")
            ldap_status = 'devre dışı'

        # Supabase veritabanına da ekle
        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            insert_query = """
                INSERT INTO users (username, password, first_name, last_name, role_id, department_id, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO UPDATE
                SET password = EXCLUDED.password,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role_id = EXCLUDED.role_id,
                    department_id = EXCLUDED.department_id,
                    status = EXCLUDED.status
            """
            cursor.execute(insert_query, (
                username, password, first_name, last_name, role_id, department_id, ldap_status
            ))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Kullanıcı Supabase'e eklendi: {username}")
        except Exception as e:
            print(f"❌ Supabase veritabanına ekleme hatası: {e}")
        return True, ldap_status
    else:
        print(f"❌ LDAP kullanıcı ekleme hatası: {conn_ldap.result}")
        return False, 'devre dışı'

def disable_user(conn_ldap, username, enable=False):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName', 'userAccountControl'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False, None

    user_dn = conn_ldap.entries[0].distinguishedName.value
    current_status = int(conn_ldap.entries[0].userAccountControl.value)
    target_status = 512 if enable else 514
    action = "aktifleştirildi" if enable else "devre dışı bırakıldı"
    new_status = 'devrede' if enable else 'devre dışı'

    if current_status == target_status:
        print(f"⚠️ Kullanıcı zaten {action}: {username}")
        return False, action

    if conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [target_status])]}):
        print(f"✅ Kullanıcı {action}: {username}")

        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            cursor.execute("UPDATE users SET status = %s WHERE username = %s", (new_status, username))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'te de status güncellendi: {new_status}")
        except Exception as e:
            print(f"❌ Supabase güncelleme hatası: {e}")

        return True, action
    else:
        print(f"❌ LDAP'te işlem başarısız: {conn_ldap.result}")
        return False, action

def delete_user(conn_ldap, username):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])
    if conn_ldap.entries:
        user_dn = conn_ldap.entries[0].distinguishedName.value
        if conn_ldap.delete(user_dn):
            print(f"✅ Kullanıcı LDAP'ten silindi: {username}")

            try:
                conn_db = get_db_connection()
                cursor = conn_db.cursor()
                cursor.execute("DELETE FROM users WHERE username = %s", (username,))
                conn_db.commit()
                conn_db.close()
                print(f"✅ Kullanıcı Supabase'den de silindi: {username}")
            except Exception as e:
                print(f"❌ Supabase silme hatası: {e}")

            return True
        else:
            print(f"❌ LDAP'ten kullanıcı silinemedi: {conn_ldap.result}")
    else:
        print(f"❌ Kullanıcı bulunamadı: {username}")
    return False
