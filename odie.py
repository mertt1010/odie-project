from ldap3 import Server, Connection, ALL, MODIFY_REPLACE
import psycopg2



# Diğer işlemleri yapmaya devam edebilir
print("Web uygulaması başlatılıyor...")
# ==========================
# PostgreSQL Bağlantısı
# ==========================
conn = psycopg2.connect(
    dbname="odiedeneme",  # PostgreSQL veritabanı adı
    user="postgres",      # PostgreSQL kullanıcı adı
    password="fenerbahce34",  # PostgreSQL şifresi
    host="localhost",     # PostgreSQL host adresi
    port="5432"           # PostgreSQL portu
)
cursor = conn.cursor()

# ==========================
# LDAP Bağlantısı
# ==========================
ldap_server = 'ldap://192.168.1.10'  # ADDC sunucu IP adresi
ldap_user = 'CN=Administrator,CN=Users,DC=odieproje,DC=local'  # LDAP Kullanıcı Bilgileri
ldap_password = 'changeme'  # LDAP Şifresi

# LDAP Sunucusuna Bağlan
server = Server(ldap_server, get_info=ALL)
conn_ldap = Connection(server, user=ldap_user, password=ldap_password, auto_bind=True)

# ==========================
# 1️⃣ LDAP ve PostgreSQL’i Otomatik Senkronize Etme
# ==========================
def sync_ldap_to_postgres():
    # Bilgisayarları Senkronize Et
    conn_ldap.search('DC=odieproje,DC=local', '(objectClass=computer)', attributes=['cn', 'operatingSystem'])
    for entry in conn_ldap.entries:
        computer_name = entry.cn.value
        operating_system = entry.operatingSystem.value if 'operatingSystem' in entry else 'Bilinmiyor'

        # Eğer işletim sistemi bilgisi boşsa 'Bilinmiyor' yap
        if not operating_system:
            operating_system = 'Bilinmiyor'

        # PostgreSQL'e veriyi ekle veya güncelle
        insert_query = """
            INSERT INTO computers (name, operating_system)
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE
            SET operating_system = EXCLUDED.operating_system
        """
        cursor.execute(insert_query, (computer_name, operating_system))

    # Kullanıcıları Senkronize Et
    conn_ldap.search('DC=odieproje,DC=local', '(objectClass=user)', attributes=['sAMAccountName', 'userAccountControl'])
    for entry in conn_ldap.entries:
        username = entry.sAMAccountName.value
        account_control = int(entry.userAccountControl.value) if 'userAccountControl' in entry else 512

        # 514: Devre dışı, 512: Aktif kullanıcı
        status = 'devre dışı' if account_control == 514 else 'devrede'

        # PostgreSQL'e veriyi ekle veya güncelle
        insert_query = """
            INSERT INTO usernames (username, status)
            VALUES (%s, %s)
            ON CONFLICT (username) DO UPDATE
            SET status = EXCLUDED.status
        """
        cursor.execute(insert_query, (username, status))

    # Değişiklikleri kaydet
    conn.commit()
    print(" LDAP ile PostgreSQL başarıyla senkronize edildi.")

# ==========================
# 2️⃣ Kullanıcıyı Devre Dışı Bırakma ve Devreye Alma Fonksiyonu
# ==========================
def disable_user(username, enable=False):
    # Kullanıcının DN'sini ve bilgilerini getir
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])

    if conn_ldap.entries:
        user_dn = conn_ldap.entries[0].distinguishedName.value
        print(f"✅ Kullanıcı bulundu: {user_dn}")
        
        # Eğer enable=True ise aktif yap, aksi halde devre dışı bırak
        user_status = 512 if enable else 514
        disable_value = {'userAccountControl': [(MODIFY_REPLACE, [user_status])]}

        # LDAP üzerinde değişikliği uygula
        if conn_ldap.modify(user_dn, disable_value):
            action = "aktifleştirildi" if enable else "devre dışı bırakıldı"
            print(f"✅ Kullanıcı {action}: {username}")

            # PostgreSQL'de kullanıcı durumunu güncelle
            new_status = "devrede" if enable else "devre dışı"
            update_query = """
                UPDATE usernames
                SET status = %s
                WHERE username = %s
            """
            cursor.execute(update_query, (new_status, username))
            conn.commit()
            print(f"✅ PostgreSQL'de kullanıcı durumu güncellendi: {username} -> {new_status}")
        else:
            print(f"❌ Kullanıcı {action} başarısız: {conn_ldap.result}")
    else:
        print(f"❌ Kullanıcı bulunamadı: {username}")

# ==========================
# 3️⃣ Kullanıcıyı Silme Fonksiyonu
# ==========================
def delete_user(username):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])

    if conn_ldap.entries:
        user_dn = conn_ldap.entries[0].distinguishedName.value
        print(f"✅ Kullanıcı bulundu: {user_dn}")

        # LDAP'ten kullanıcıyı sil
        if conn_ldap.delete(user_dn):
            print(f"✅ Kullanıcı başarıyla silindi: {username}")

            # PostgreSQL'den de kullanıcıyı sil
            delete_query = "DELETE FROM usernames WHERE username = %s"
            cursor.execute(delete_query, (username,))
            conn.commit()
            print(f"✅ PostgreSQL veritabanından kullanıcı silindi: {username}")
        else:
            print(f"❌ LDAP'ten kullanıcı silme başarısız: {conn_ldap.result}")
    else:
        print(f"❌ Kullanıcı bulunamadı: {username}")

# ==========================
# 4️⃣ Kullanıcıyı Ekleme Fonksiyonu
# ==========================
def add_user(username, first_name, last_name, password):
    user_dn = f"CN={username},CN=Users,DC=odieproje,DC=local"

    # Kullanıcı özellikleri
    user_attributes = {
        'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
        'cn': username,
        'sAMAccountName': username,
        'givenName': first_name,
        'sn': last_name,
        'userAccountControl': 512,  # Aktif hesap
    }

    # LDAP'e kullanıcıyı ekle
    if conn_ldap.add(user_dn, attributes=user_attributes):
        print(f"✅ Kullanıcı başarıyla eklendi: {username}")

        # Şifreyi ayarla
        password_value = ('"%s"' % password).encode('utf-16-le')
        if conn_ldap.modify(user_dn, {'unicodePwd': [(MODIFY_REPLACE, [password_value])]}):
            conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [512])]})

            # PostgreSQL'e kullanıcıyı ekle
            insert_query = """
                INSERT INTO usernames (username, status)
                VALUES (%s, %s)
                ON CONFLICT (username) DO UPDATE
                SET status = EXCLUDED.status
            """
            cursor.execute(insert_query, (username, 'devrede'))
            conn.commit()
            print(f"✅ Kullanıcı PostgreSQL'e eklendi: {username}")
        else:
            print(f"❌ Şifre ayarlanırken hata oluştu: {conn_ldap.result}")
    else:
        print(f"❌ Kullanıcı eklenemedi: {conn_ldap.result}")

# ==========================
# 5️⃣ Komut Satırından Seçim Yapma
# ==========================
print("Hangi işlemi yapmak istersiniz?")
print("1) Kullanıcı devre dışı bırakma")
print("2) Kullanıcıyı devreye alma")
print("3) Kullanıcı silme")
print("4) Kullanıcı ekleme")

# Kullanıcıdan giriş al
secim = input("Seçiminizi yapın (1, 2, 3 veya 4): ")

# LDAP ve PostgreSQL'i otomatik senkronize et
sync_ldap_to_postgres()

if secim == "1":
    username = input("Devre dışı bırakmak istediğiniz kullanıcı adını girin: ")
    disable_user(username)

elif secim == "2":
    username = input("Devreye almak istediğiniz kullanıcı adını girin: ")
    disable_user(username, enable=True)

elif secim == "3":
    username = input("Silmek istediğiniz kullanıcı adını girin: ")
    delete_user(username)

elif secim == "4":
    username = input("Eklemek istediğiniz kullanıcı adını girin: ")
    first_name = input("Kullanıcının adını girin: ")
    last_name = input("Kullanıcının soyadını girin: ")
    password = input("Kullanıcının şifresini girin: ")
    add_user(username, first_name, last_name, password)

else:
    print("❌ Geçersiz seçim! Lütfen 1, 2, 3 veya 4 girin.")

# ==========================
# 📝 Değişiklikleri Kaydet ve Bağlantıyı Kapat
# ==========================
cursor.close()
conn.close()
conn_ldap.unbind()
