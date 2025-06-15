import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Fetch variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")


def get_db_connection():
    try:
        conn = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        print("✅ Supabase veritabanına bağlanıldı.")
        return conn
    except Exception as e:
        print("❌ Veritabanı bağlantı hatası:", e)
        return None

def sync_ldap_users_to_supabase(conn_db, conn_ldap):
    try:
        cursor = conn_db.cursor()

        # LDAP'ten user'ları al
        conn_ldap.search('DC=odieproje,DC=local', '(objectClass=user)', attributes=[
            'sAMAccountName', 'givenName', 'sn', 'userAccountControl'
        ])

        for entry in conn_ldap.entries:
            username = entry.sAMAccountName.value

            # givenName ve sn hem varsa hem boş değilse kullan
            first_name = entry.givenName.value if 'givenName' in entry and entry.givenName.value else ''
            last_name = entry.sn.value if 'sn' in entry and entry.sn.value else ''

            user_control = int(entry.userAccountControl.value) if 'userAccountControl' in entry else 512
            status = 'devre dışı' if user_control == 514 else 'devrede'

            password = 'default123'  # Supabase'e eklemeden önce hashleyebilirsin
            role_id = 2  # varsayılan: user
            department_id = None  # departman eşleşmesi yapılmadıysa boş bırak

            insert_query = """
                INSERT INTO users (username, password, first_name, last_name, role_id, department_id, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO UPDATE
                SET first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    password = EXCLUDED.password,
                    role_id = EXCLUDED.role_id,
                    status = EXCLUDED.status
            """
            cursor.execute(insert_query, (username, password, first_name, last_name, role_id, department_id, status))

        conn_db.commit()
        print("✅ LDAP kullanıcıları Supabase'deki `users` tablosuna başarıyla senkronize edildi.")
    except Exception as e:
        print("❌ Senkronizasyon hatası:", e)
        conn_db.rollback()

def get_users_by_department(department_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, first_name, last_name, role_id, department_id, status
        FROM users
        WHERE department_id = %s
    """, (department_id,))
    users = cursor.fetchall()
    conn.close()
    return users

def get_users_by_role(role_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, first_name, last_name, role_id, department_id, status
        FROM users
        WHERE role_id = %s
    """, (role_id,))
    users = cursor.fetchall()
    conn.close()
    return users

def get_departments_by_domain(domain_id):
    """
    Bir domain'e ait departmanları listeler
    
    Args:
        domain_id (int): Domain ID
        
    Returns:
        list: (id, department_name) tuplelarından oluşan liste
    """
    try:
        conn = get_db_connection()
        if not conn:
            return []
            
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, department_name FROM departments WHERE domain_id = %s ORDER BY department_name",
            (domain_id,)
        )
        departments = cursor.fetchall()
        conn.close()
        return departments
    except Exception as e:
        print(f"❌ Departman listeleme hatası: {e}")
        return []

def add_department(domain_id, department_name, created_by):
    """
    Yeni bir departman ekler
    
    Args:
        domain_id (int): Domain ID
        department_name (str): Departman adı
        created_by (str): Oluşturan kullanıcının UUID'si
        
    Returns:
        tuple: (bool, str, int) - İşlem başarılı mı, mesaj, departman ID'si (başarılıysa)
    """
    try:
        conn = get_db_connection()
        if not conn:
            return False, "Veritabanı bağlantısı kurulamadı", None
            
        cursor = conn.cursor()
        
        # Aynı domain'de aynı isimle departman var mı kontrol et
        cursor.execute(
            "SELECT COUNT(*) FROM departments WHERE domain_id = %s AND LOWER(department_name) = LOWER(%s)",
            (domain_id, department_name)
        )
        count = cursor.fetchone()[0]
        
        if count > 0:
            conn.close()
            return False, f"❌ '{department_name}' departmanı bu domain'de zaten mevcut", None
        
        # Yeni departman ekle
        cursor.execute(
            """
            INSERT INTO departments (department_name, domain_id, created_by) 
            VALUES (%s, %s, %s) RETURNING id
            """,
            (department_name, domain_id, created_by)
        )
        department_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        
        return True, f"✅ '{department_name}' departmanı başarıyla eklendi", department_id
    except Exception as e:
        print(f"❌ Departman ekleme hatası: {e}")
        return False, f"❌ Departman eklenirken hata oluştu: {e}", None

def update_department(department_id, department_name, domain_id=None):
    """
    Departman bilgilerini günceller
    
    Args:
        department_id (int): Departman ID
        department_name (str): Yeni departman adı
        domain_id (int, optional): Domain ID kontrolü için
        
    Returns:
        tuple: (bool, str) - İşlem başarılı mı, mesaj
    """
    try:
        conn = get_db_connection()
        if not conn:
            return False, "Veritabanı bağlantısı kurulamadı"
            
        cursor = conn.cursor()
        
        # Departman var mı ve domain'e ait mi kontrol et
        if domain_id:
            cursor.execute(
                "SELECT COUNT(*) FROM departments WHERE id = %s AND domain_id = %s",
                (department_id, domain_id)
            )
            count = cursor.fetchone()[0]
            
            if count == 0:
                conn.close()
                return False, "❌ Bu departman bulunamadı veya bu domain'e ait değil"
        
        # Aynı isimli başka departman var mı kontrol et (aynı id hariç)
        cursor.execute(
            """
            SELECT COUNT(*) FROM departments 
            WHERE id != %s AND domain_id = (SELECT domain_id FROM departments WHERE id = %s)
            AND LOWER(department_name) = LOWER(%s)
            """,
            (department_id, department_id, department_name)
        )
        count = cursor.fetchone()[0]
        
        if count > 0:
            conn.close()
            return False, f"❌ '{department_name}' isimli başka bir departman zaten mevcut"
        
        # Departmanı güncelle
        cursor.execute(
            "UPDATE departments SET department_name = %s WHERE id = %s",
            (department_name, department_id)
        )
        conn.commit()
        conn.close()
        
        return True, f"✅ Departman başarıyla güncellendi: '{department_name}'"
    except Exception as e:
        print(f"❌ Departman güncelleme hatası: {e}")
        return False, f"❌ Departman güncellenirken hata oluştu: {e}"

def delete_department(department_id, domain_id=None):
    """
    Departmanı siler ve bağlı kullanıcıların departman bilgisini null yapar
    
    Args:
        department_id (int): Departman ID
        domain_id (int, optional): Domain ID kontrolü için
        
    Returns:
        tuple: (bool, str) - İşlem başarılı mı, mesaj
    """
    try:
        conn = get_db_connection()
        if not conn:
            return False, "Veritabanı bağlantısı kurulamadı"
            
        cursor = conn.cursor()
        
        # Departman var mı ve domain'e ait mi kontrol et
        if domain_id:
            cursor.execute(
                "SELECT COUNT(*), (SELECT department_name FROM departments WHERE id = %s) FROM departments WHERE id = %s AND domain_id = %s",
                (department_id, department_id, domain_id)
            )
            result = cursor.fetchone()
            
            if result[0] == 0:
                conn.close()
                return False, "❌ Bu departman bulunamadı veya bu domain'e ait değil"
                
            department_name = result[1]
        else:
            cursor.execute(
                "SELECT department_name FROM departments WHERE id = %s",
                (department_id,)
            )
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                return False, "❌ Bu departman bulunamadı"
                
            department_name = result[0]
        
        # Önce bu departmana bağlı kullanıcıların departman_id'sini null yap
        cursor.execute(
            "UPDATE users SET department_id = NULL WHERE department_id = %s",
            (department_id,)
        )
        
        # Sonra departmanı sil
        cursor.execute(
            "DELETE FROM departments WHERE id = %s",
            (department_id,)
        )
        
        conn.commit()
        conn.close()
        
        return True, f"✅ '{department_name}' departmanı başarıyla silindi"
    except Exception as e:
        print(f"❌ Departman silme hatası: {e}")
        return False, f"❌ Departman silinirken hata oluştu: {e}"
