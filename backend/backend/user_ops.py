from ldap3 import MODIFY_REPLACE
from ldap_handler import get_ldap_connection_by_domain_id
from db_ops import get_db_connection
import psycopg2
import time
from enum import Enum
import bcrypt  # Bcrypt kütüphanesini ekliyoruz

# Kullanıcı durumu enum tanımı
class UserStatus(str, Enum):
    ACTIVE = "devrede"
    DISABLED = "devre dışı"

# Kullanıcı rolü enum tanımı
class UserRole(int, Enum):
    ADMIN = 1
    USER = 2
    GUEST = 3

# Şifre hashleme fonksiyonu
def hash_password(plain_password):
    """
    Şifreyi güvenli bir şekilde hashler
    
    Args:
        plain_password (str): Hashlenecek düz metin şifre
        
    Returns:
        str: Hashlenmiş şifre (salt değeri ile birlikte)
    """
    # Şifreyi bytes'a çevir
    password_bytes = plain_password.encode('utf-8')
    # Salt üret ve şifreyi hashle (gensalt(12) = 2^12 rounds)
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(12))
    # Hash'i string olarak döndür
    return hashed.decode('utf-8')

# Şifre doğrulama fonksiyonu
def verify_password(plain_password, hashed_password):
    """
    Verilen şifrenin hash ile eşleşip eşleşmediğini kontrol eder
    
    Args:
        plain_password (str): Kontrol edilecek düz metin şifre
        hashed_password (str): Veritabanında saklanan hash
        
    Returns:
        bool: Şifre eşleşiyorsa True, aksi halde False
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"❌ Şifre doğrulama hatası: {e}")
        return False

def add_user_to_admin_group(conn_ldap, username, base_dn):
    user_dn = f"CN={username},CN=Users,{base_dn}"
    admin_group_dn = f"CN=Domain Admins,CN=Users,{base_dn}"

    if conn_ldap.modify(admin_group_dn, {'member': [(MODIFY_REPLACE, [user_dn])]}):
        print(f"✅ {username} kullanıcısı Domain Admins grubuna eklendi.")
    else:
        print(f"❌ {username} kullanıcısı Domain Admins grubuna eklenemedi: {conn_ldap.result}")

def add_user(domain_id, username, first_name, last_name, password, role_id=2, department_id=None , created_by=None):
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
            
            # Şifreyi güvenli bir şekilde hashle
            hashed_password = hash_password(password)
            
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
            cursor.execute(insert_query, (username, hashed_password, first_name, last_name, role_id, department_id, status, domain_id))
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
            if not conn_db:
                print(f"❌ Veritabanı bağlantısı kurulamadı!")
                return True
                
            cursor = conn_db.cursor()
              # Önce kullanıcının veritabanında var olup olmadığını kontrol et (case-insensitive)
            cursor.execute("SELECT id, username, domain_id FROM users WHERE LOWER(username) = LOWER(%s) AND domain_id = %s", (username, domain_id))
            user_exists = cursor.fetchone()
            
            if user_exists:
                actual_username = user_exists[1]  # Veritabanındaki gerçek kullanıcı adı
                print(f"🔍 Kullanıcı veritabanında bulundu: ID={user_exists[0]}, Username={actual_username}, Domain_ID={user_exists[2]}")
                
                # Silme işlemini gerçekleştir (gerçek kullanıcı adını kullan)
                cursor.execute("DELETE FROM users WHERE LOWER(username) = LOWER(%s) AND domain_id = %s", (username, domain_id))
                affected_rows = cursor.rowcount
                conn_db.commit()
                
                print(f"✅ Supabase'den silindi: {username} (Etkilenen satır sayısı: {affected_rows})")
                
                # Silme işlemini doğrula
                cursor.execute("SELECT COUNT(*) FROM users WHERE username = %s AND domain_id = %s", (username, domain_id))
                remaining_count = cursor.fetchone()[0]
                
                if remaining_count == 0:
                    print(f"✅ Silme doğrulandı: {username} artık veritabanında yok")
                else:
                    print(f"⚠️ Silme başarısız: {username} hala veritabanında ({remaining_count} kayıt)")
            else:
                print(f"⚠️ Kullanıcı Supabase'de bulunamadı: {username} (domain_id: {domain_id})")
                
            conn_db.close()
        except Exception as e:
            print(f"❌ Supabase silme hatası: {e}")
        return True
    else:
        print(f"❌ LDAP'ten silinemedi: {conn_ldap.result}")
        return False

def update_user(domain_id, username, first_name=None, last_name=None, password=None, role_id=None, department_id=None):
    """
    Mevcut bir kullanıcının bilgilerini günceller.
    
    Args:
        domain_id (int): Domain ID
        username (str): Kullanıcı adı
        first_name (str, optional): Kullanıcının yeni adı
        last_name (str, optional): Kullanıcının yeni soyadı
        password (str, optional): Kullanıcının yeni şifresi
        role_id (int, optional): Kullanıcının yeni rol ID'si
        department_id (int, optional): Kullanıcının yeni departman ID'si
    
    Returns:
        tuple: (bool, str) - İşlem başarılı mı, durum mesajı
    """
    try:
        conn_ldap, base_dn = get_ldap_connection_by_domain_id(domain_id)
        conn_ldap.search(base_dn, f'(sAMAccountName={username})', attributes=['distinguishedName'])
        
        if not conn_ldap.entries:
            print(f"❌ Kullanıcı bulunamadı: {username}")
            return False, "Kullanıcı bulunamadı"
        
        user_dn = conn_ldap.entries[0].distinguishedName.value
        ldap_changes = {}
        
        # LDAP'de güncellenecek alanlar
        if first_name:
            ldap_changes['givenName'] = [(MODIFY_REPLACE, [first_name])]
        
        if last_name:
            ldap_changes['sn'] = [(MODIFY_REPLACE, [last_name])]
        
        # Şifre değişikliği varsa
        if password:
            password_value = ('"%s"' % password).encode('utf-16-le')
            ldap_changes['unicodePwd'] = [(MODIFY_REPLACE, [password_value])]
        
        # LDAP güncellemesi
        if ldap_changes and not conn_ldap.modify(user_dn, ldap_changes):
            print(f"❌ LDAP güncellemesi başarısız: {conn_ldap.result}")
            return False, "LDAP güncellemesi başarısız"
        
        # Veritabanı güncellemesi
        conn_db = get_db_connection()
        cursor = conn_db.cursor()
        
        db_changes = []
        params = []
        
        if first_name:
            db_changes.append("first_name = %s")
            params.append(first_name)
        
        if last_name:
            db_changes.append("last_name = %s")
            params.append(last_name)
        if password:
            db_changes.append("password = %s")
            # Şifreyi güvenli bir şekilde hashle
            hashed_password = hash_password(password)
            params.append(hashed_password)
        
        if role_id:
            db_changes.append("role_id = %s")
            params.append(role_id)
        
        if department_id:
            db_changes.append("department_id = %s")
            params.append(department_id)
        
        if db_changes:
            query = f"UPDATE users SET {', '.join(db_changes)} WHERE username = %s AND domain_id = %s"
            params.extend([username, domain_id])
            cursor.execute(query, params)
            conn_db.commit()
        
        conn_db.close()
        
        return True, "✅ Kullanıcı bilgileri güncellendi"
    except Exception as e:
        print(f"❌ Kullanıcı güncelleme hatası: {e}")
        return False, f"Güncelleme hatası: {e}"

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

def authenticate_user(username, password, domain_id):
    """
    Kullanıcı girişini doğrular
    
    Args:
        username (str): Kullanıcı adı
        password (str): Şifre
        domain_id (int): Domain ID
        
    Returns:
        tuple: (bool, str) - Giriş başarılı mı, durum mesajı
    """
    try:
        conn_db = get_db_connection()
        cursor = conn_db.cursor()
        
        # Kullanıcıyı veritabanından bul
        cursor.execute("""
            SELECT id, username, password, status 
            FROM users 
            WHERE username = %s AND domain_id = %s
        """, (username, domain_id))
        
        user = cursor.fetchone()
        conn_db.close()
        
        if not user:
            return False, "Kullanıcı bulunamadı"
            
        user_id = user[0]
        stored_username = user[1]
        stored_password_hash = user[2]
        status = user[3]
        
        # Kullanıcı devre dışı ise giriş yapılamaz
        if status == UserStatus.DISABLED.value:
            return False, "Kullanıcı devre dışı"
        
        # Şifre doğrulama
        if verify_password(password, stored_password_hash):
            return True, f"Hoş geldiniz, {stored_username}!"
        else:
            return False, "Şifre hatalı"
            
    except Exception as e:
        print(f"❌ Kullanıcı doğrulama hatası: {e}")
        return False, f"Doğrulama hatası: {e}"

def migrate_passwords_to_hash():
    """
    Veritabanındaki tüm şifreleri hashlere dönüştürür
    """
    try:
        conn_db = get_db_connection()
        cursor = conn_db.cursor()
        
        # Tüm kullanıcıları getir
        cursor.execute("SELECT id, password FROM users")
        users = cursor.fetchall()
        
        update_count = 0
        
        for user in users:
            user_id = user[0]
            plain_password = user[1]
            
            # Eğer şifre zaten hash değilse
            try:
                # Hash formatında şifre genellikle $2b$ ile başlar
                if not plain_password.startswith('$2b$'):
                    # Hashle
                    hashed_password = hash_password(plain_password)
                    
                    # Veritabanına kaydet
                    cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, user_id))
                    update_count += 1
            except Exception as e:
                print(f"❌ ID {user_id} için şifre dönüştürme hatası: {e}")
        
        conn_db.commit()
        conn_db.close()
        
        print(f"✅ {update_count} kullanıcının şifresi güvenli hale getirildi")
        return True, f"{update_count} şifre güncellendi"
    except Exception as e:
        print(f"❌ Şifre geçiş hatası: {e}")
        return False, f"Geçiş hatası: {e}"
