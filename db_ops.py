import psycopg2
from config import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

def get_db_connection():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn

def sync_ldap_to_postgres(conn_db, conn_ldap):
    cursor = conn_db.cursor()
    conn_ldap.search('DC=odieproje,DC=local', '(objectClass=computer)', attributes=['cn', 'operatingSystem'])
    for entry in conn_ldap.entries:
        name = entry.cn.value
        os = entry.operatingSystem.value if 'operatingSystem' in entry else 'Bilinmiyor'
        insert_query = """
            INSERT INTO computers (name, operating_system)
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE
            SET operating_system = EXCLUDED.operating_system
        """
        cursor.execute(insert_query, (name, os or 'Bilinmiyor'))

    conn_ldap.search('DC=odieproje,DC=local', '(objectClass=user)', attributes=['sAMAccountName', 'userAccountControl'])
    for entry in conn_ldap.entries:
        username = entry.sAMAccountName.value
        status = int(entry.userAccountControl.value) if 'userAccountControl' in entry else 512
        durum = 'devre dışı' if status == 514 else 'devrede'
        insert_query = """
            INSERT INTO usernames (username, status)
            VALUES (%s, %s)
            ON CONFLICT (username) DO UPDATE
            SET status = EXCLUDED.status
        """
        cursor.execute(insert_query, (username, durum))

    conn_db.commit()
    print("✅ LDAP ile PostgreSQL başarıyla senkronize edildi.")