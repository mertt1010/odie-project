from ldap3 import MODIFY_REPLACE
from ldap_handler import get_ldap_connection_by_domain_id
from db_ops import get_db_connection
import psycopg2
import time
from enum import Enum

# Kullanıcı durumu enum tanımı
class UserStatus(str, Enum):
    ACTIVE = "devrede"
    DISABLED = "devre dışı"

# Kullanıcı rolü enum tanımı
class UserRole(int, Enum):
    ADMIN = 1
    USER = 2
    GUEST = 3

def add_user_to_admin_group(conn_ldap, username, base_dn):
    user_dn = f"CN={username},CN=Users,{base_dn}"
    admin_group_dn = f"CN=Domain Admins,CN=Users,{base_dn}"

    if conn_ldap.modify(admin_group_dn, {'member': [(MODIFY_REPLACE, [user_dn])]}):
        print(f"✅ {username} kullanıcısı Domain Admins grubuna eklendi.")
    else:
        print(f"❌ {username} kullanıcısı Domain Admins grubuna eklenemedi: {conn_ldap.result}")

def add_user(domain_id, username, first_name, last_name, password, role_id=2, department_id=None):
    conn_ldap, base_dn = get_ldap_connection_by_domain_id(domain_id)
    user_dn = f"CN={username},CN=Users,{base_dn}"

    conn_ldap.search(base_dn, f'(sAMAccountName={username})', attributes=['distinguishedName'])
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
            print("⚠️ Şifre atanamadı, kullanıcı devre dışı kaldı.")
            status = 'devre dışı'

        if role_id == 1:
            add_user_to_admin_group(conn_ldap, username, base_dn)

        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            insert_query = """
                INSERT INTO users (username, password, first_name, last_name, role_id, department_id, status, domain_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO UPDATE
                SET password = EXCLUDED.password,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role_id = EXCLUDED.role_id,
                    department_id = EXCLUDED.department_id,
                    status = EXCLUDED.status,
                    domain_id = EXCLUDED.domain_id
            """
            cursor.execute(insert_query, (username, password, first_name, last_name, role_id, department_id, status, domain_id))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'e eklendi: {username}")
        except Exception as e:
            print(f"❌ Supabase'e eklenemedi: {e}")

        return True, status
    else:
        print(f"❌ LDAP'e eklenemedi: {conn_ldap.result}")
        return False, "devre dışı"

def disable_user(domain_id, username, enable=False):
    conn_ldap, base_dn = get_ldap_connection_by_domain_id(domain_id)
    conn_ldap.search(base_dn, f'(sAMAccountName={username})', attributes=['distinguishedName', 'userAccountControl'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False, None

    user_dn = conn_ldap.entries[0].distinguishedName.value
    current_status = int(conn_ldap.entries[0].userAccountControl.value)
    new_status = 512 if enable else 514
    status_text = "devrede" if enable else "devre dışı"
    action = "aktifleştirildi" if enable else "devre dışı bırakıldı"

    if current_status == new_status:
        print(f"⚠️ Kullanıcı zaten {status_text}: {username}")
        return False, status_text

    if conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [new_status])]}):
        print(f"✅ LDAP'te kullanıcı {action}: {username}")
        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            cursor.execute("UPDATE users SET status = %s WHERE username = %s AND domain_id = %s", (status_text, username, domain_id))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'de de status güncellendi: {status_text}")
        except Exception as e:
            print(f"❌ Supabase güncelleme hatası: {e}")
        return True, status_text
    else:
        print(f"❌ LDAP değiştirilemedi: {conn_ldap.result}")
        return False, status_text

def delete_user(domain_id, username):
    conn_ldap, base_dn = get_ldap_connection_by_domain_id(domain_id)
    conn_ldap.search(base_dn, f'(sAMAccountName={username})', attributes=['distinguishedName'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False

    user_dn = conn_ldap.entries[0].distinguishedName.value

    if conn_ldap.delete(user_dn):
        print(f"✅ LDAP'ten silindi: {username}")
        try:
            conn_db = get_db_connection()
            cursor = conn_db.cursor()
            cursor.execute("DELETE FROM users WHERE username = %s AND domain_id = %s", (username, domain_id))
            conn_db.commit()
            conn_db.close()
            print(f"✅ Supabase'den de silindi: {username}")
        except Exception as e:
            print(f"❌ Supabase silme hatası: {e}")
        return True
    else:
        print(f"❌ LDAP'ten silinemedi: {conn_ldap.result}")
        return False

def get_users_by_domain(domain_id, status=None):
    """
    Belirli bir domain'deki kullanıcıları listeler.
    
    Args:
        domain_id (int): Domain ID
        status (str veya UserStatus, optional): Sadece belirli bir duruma sahip kullanıcıları getirmek için. 
                               "devrede" veya "devre dışı" olabilir.
                               
    Returns:
        list: Kullanıcı bilgilerini içeren sözlük listesi
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        status_value = None
        if isinstance(status, UserStatus):
            status_value = status.value
        elif status in [UserStatus.ACTIVE.value, UserStatus.DISABLED.value]:
            status_value = status
            
        if status_value:
            cursor.execute("""
                SELECT id, username, first_name, last_name, role_id, department_id, status
                FROM users 
                WHERE domain_id = %s AND status = %s
                ORDER BY username
            """, (domain_id, status_value))
        else:
            cursor.execute("""
                SELECT id, username, first_name, last_name, role_id, department_id, status
                FROM users 
                WHERE domain_id = %s
                ORDER BY username
            """, (domain_id,))
            
        users = cursor.fetchall()
        conn.close()
        
        user_list = []
        for u in users:
            user_list.append({
                "id": u[0],
                "username": u[1],
                "first_name": u[2],
                "last_name": u[3],
                "role_id": u[4],
                "department_id": u[5],
                "status": u[6]
            })
        
        return user_list
    except Exception as e:
        print(f"❌ Kullanıcı listeleme hatası: {e}")
        return []
