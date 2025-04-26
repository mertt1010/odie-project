from ldap3 import MODIFY_REPLACE
from config import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
import psycopg2
import time
from ldap3 import Server, Connection
from config import LDAP_SERVER, LDAP_USER, LDAP_PASSWORD

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

def add_user_to_admin_group(conn_ldap, username):
    user_dn = f"CN={username},CN=Users,DC=odieproje,DC=local"
    admin_group_dn = "CN=Domain Admins,CN=Users,DC=odieproje,DC=local"

    if conn_ldap.modify(admin_group_dn, {'member': [(MODIFY_REPLACE, [user_dn])]}):
        print(f"✅ {username} kullanıcısı Domain Admins grubuna eklendi.")
    else:
        print(f"❌ {username} kullanıcısı Domain Admins grubuna eklenemedi: {conn_ldap.result}")

# Kullanıcı ekleme fonksiyonu
def add_user(conn_ldap, username, first_name, last_name, password, role_id=2, department_id=None):
    user_dn = f"CN={username},CN=Users,DC=odieproje,DC=local"

    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])
    if conn_ldap.entries:
        print(f"❌ Kullanıcı zaten var: {username}")
        return False, "devre dışı"

    user_attributes = {
        'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
        'cn': username,
        'sAMAccountName': username,
        'givenName': first_name,
        'sn': last_name,
        'userAccountControl': 514
    }

    if conn_ldap.add(user_dn, attributes=user_attributes):
        print(f"✅ LDAP'e eklendi (devre dışı): {username}")
        time.sleep(1)

        password_value = ('"%s"' % password).encode('utf-16-le')
        if conn_ldap.modify(user_dn, {'unicodePwd': [(MODIFY_REPLACE, [password_value])]}):
            conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [512])]})
            print(f"✅ Şifre ayarlandı, kullanıcı devrede: {username}")
            status = 'devrede'
        else:
            print(f"⚠️ Şifre atanamadı, kullanıcı devre dışı kaldı.")
            status = 'devre dışı'

        # Adminse Domain Admins grubuna ekle
        if role_id == 1:
            add_user_to_admin_group(conn_ldap, username)

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
            cursor.execute(insert_query, (username, password, first_name, last_name, role_id, department_id, status))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'e de eklendi: {username}")
        except Exception as e:
            print(f"❌ Supabase'e eklenemedi: {e}")

        return True, status
    else:
        print(f"❌ LDAP'e eklenemedi: {conn_ldap.result}")
        return False, "devre dışı"

# Devre dışı bırak / devreye alma
def disable_user(conn_ldap, username, enable=False):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName', 'userAccountControl'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False, None

    user_dn = conn_ldap.entries[0].distinguishedName.value
    current_status = int(conn_ldap.entries[0].userAccountControl.value)
    new_status = 512 if enable else 514
    action = "aktifleştirildi" if enable else "devre dışı bırakıldı"
    status_text = "devrede" if enable else "devre dışı"

    if current_status == new_status:
        print(f"⚠️ Kullanıcı zaten {status_text}: {username}")
        return False, status_text

    if conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [new_status])]}):
        print(f"✅ LDAP'te kullanıcı {action}: {username}")
        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            cursor.execute("UPDATE users SET status = %s WHERE username = %s", (status_text, username))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'de de status güncellendi: {status_text}")
        except Exception as e:
            print(f"❌ Supabase güncelleme hatası: {e}")
        return True, status_text
    else:
        print(f"❌ LDAP değiştirilemedi: {conn_ldap.result}")
        return False, status_text

# Kullanıcı silme
def delete_user(conn_ldap, username):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False

    user_dn = conn_ldap.entries[0].distinguishedName.value

    if conn_ldap.delete(user_dn):
        print(f"✅ LDAP'ten silindi: {username}")
        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            cursor.execute("DELETE FROM users WHERE username = %s", (username,))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'den de silindi: {username}")
        except Exception as e:
            print(f"❌ Supabase silme hatası: {e}")
        return True
    else:
        print(f"❌ LDAP'ten silinemedi: {conn_ldap.result}")
        return False
