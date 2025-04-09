from ldap_ops import get_ldap_connection, add_user, disable_user, delete_user
from db_ops import get_db_connection, sync_ldap_to_postgres
from computer_ops import assign_computer_to_department, list_computers_by_department

# LDAP ve PostgreSQL bağlantılarını başlat
conn_ldap = get_ldap_connection()
conn_db = get_db_connection()

# Başlangıçta LDAP'i PostgreSQL ile senkronize et
sync_ldap_to_postgres(conn_db, conn_ldap)

print("Kullanıcı işlemleri menüsüne hoş geldiniz!")
print("Hangi işlemi yapmak istersiniz?")
print("1) Kullanıcı devre dışı bırakma")
print("2) Kullanıcıyı devreye alma")
print("3) Kullanıcı silme")
print("4) Kullanıcı ekleme")
print("5) Bilgisayar işlemleri")

# Seçimi al
secim = input("Seçiminizi yapın (1, 2, 3, 4 veya 5): ")

# Kullanıcıyı devre dışı bırak
if secim == "1":
    username = input("Kullanıcı adı: ")
    success, action = disable_user(conn_ldap, username)
    if success:
        cursor = conn_db.cursor()
        cursor.execute("UPDATE usernames SET status = %s WHERE username = %s", ("devre dışı", username))
        conn_db.commit()

# Kullanıcıyı devreye al
elif secim == "2":
    username = input("Kullanıcı adı: ")
    success, action = disable_user(conn_ldap, username, enable=True)
    if success:
        cursor = conn_db.cursor()
        cursor.execute("UPDATE usernames SET status = %s WHERE username = %s", ("devrede", username))
        conn_db.commit()

# Kullanıcıyı sil
elif secim == "3":
    username = input("Kullanıcı adı: ")
    if delete_user(conn_ldap, username):
        cursor = conn_db.cursor()
        cursor.execute("DELETE FROM usernames WHERE username = %s", (username,))
        conn_db.commit()
        print(f"✅ PostgreSQL'den de silindi: {username}")

# Kullanıcı ekle
elif secim == "4":
    username = input("Kullanıcı adı: ")
    first = input("Ad: ")
    last = input("Soyad: ")
    password = input("Şifre: ")
    success, status = add_user(conn_ldap, username, first, last, password)
    if success:
        cursor = conn_db.cursor()
        cursor.execute("""
            INSERT INTO usernames (username, status)
            VALUES (%s, %s)
            ON CONFLICT (username) DO UPDATE SET status = EXCLUDED.status
        """, (username, status))
        conn_db.commit()
        print(f"✅ Kullanıcı PostgreSQL'e eklendi: {username} ({status})")

# Bilgisayar işlemleri alt menüsü
elif secim == "5":
    while True:
        print("\n📁 Bilgisayar İşlemleri Menüsü")
        print("1) Bilgisayarı departmana ata")
        print("2) Belirli bir departmandaki bilgisayarları listele")
        print("3) Geri dön")

        alt_secim = input("Seçiminizi yapın: ")

        if alt_secim == "1":
            computer_name = input("Bilgisayarın adını girin: ")
            print("Departmanlar: muhasebe, IT, İK, yönetim, idari işler")
            department = input("Bilgisayarı atamak istediğiniz departmanı girin: ")
            assign_computer_to_department(conn_db, computer_name, department)

        elif alt_secim == "2":
            print("Departmanlar: muhasebe, IT, İK, yönetim, idari işler")
            department = input("Listelemek istediğiniz departmanı girin: ")
            list_computers_by_department(conn_db, department)

        elif alt_secim == "3":
            break

        else:
            print("❌ Geçersiz seçim. Lütfen 1, 2 ya da 3 girin.")

# Geçersiz seçim
else:
    print("❌ Geçersiz seçim.")

# Bağlantıları kapat
conn_ldap.unbind()
conn_db.close()
