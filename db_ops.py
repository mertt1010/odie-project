import psycopg2
from config import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
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
