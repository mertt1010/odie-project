from ldap3 import Server, Connection, ALL
import psycopg2

# PostgreSQL Bağlantısı
conn = psycopg2.connect(
    dbname="odiedeneme",  # PostgreSQL veritabanı adı
    user="postgres",      # PostgreSQL kullanıcı adı
    password="fenerbahce34",     # PostgreSQL şifresi
    host="localhost",     # PostgreSQL host adresi
    port="5432"           # PostgreSQL portu
)
cursor = conn.cursor()

# LDAP Bağlantısı
ldap_server = 'ldap://192.168.1.10'  # ADDC sunucu IP adresi (yerel ağda 192.168.1.10 gibi bir IP olabilir)
ldap_user = 'CN=vboxuser,CN=Users,DC=odieproje,DC=local'  # LDAP kullanıcı bilgileri (vboxuser ve odieproje.local domaini)
ldap_password = 'changeme'  # LDAP şifresi (vboxuser hesabının şifresi)

# LDAP sunucusuna bağlan
server = Server(ldap_server, get_info=ALL)
conn_ldap = Connection(server, user=ldap_user, password=ldap_password, auto_bind=True)

# ADDC'deki bilgisayar bilgilerini çekme
conn_ldap.search('DC=odieproje,DC=local', '(objectClass=computer)', attributes=['cn', 'operatingSystem'])

# Bilgileri PostgreSQL veritabanına ekleme
for entry in conn_ldap.entries:
    computer_name = entry.cn.value  # Bilgisayar adı
    operating_system = entry.operatingSystem.value  # İşletim sistemi bilgisi
    print(f'Computer Name: {computer_name}, OS: {operating_system}')

    # PostgreSQL veritabanına veri ekleme
    insert_query = "INSERT INTO computers (name, operating_system) VALUES (%s, %s)"
    cursor.execute(insert_query, (computer_name, operating_system))

# Değişiklikleri kaydet
conn.commit()

# Bağlantıyı kapatma
cursor.close()
conn.close()
conn_ldap.unbind()
