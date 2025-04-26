from user_ops import get_ldap_connection, add_user, disable_user, delete_user
from db_ops import get_db_connection, sync_ldap_users_to_supabase

# LDAP ve Supabase bağlantılarını başlat
conn_ldap = get_ldap_connection()
conn_db = get_db_connection()

# Başlangıçta LDAP kullanıcılarını Supabase'e senkronize et
sync_ldap_users_to_supabase(conn_db, conn_ldap)

while True:
    print("\n👤 Kullanıcı İşlemleri Menüsü")
    print("1) Kullanıcı devre dışı bırak")
    print("2) Kullanıcıyı devreye al")
    print("3) Kullanıcı sil")
    print("4) Kullanıcı ekle")
    print("5) Çıkış")

    alt_secim = input("Seçiminizi yapın (1-5): ")

    if alt_secim == "1":
        username = input("Kullanıcı adı: ")
        disable_user(conn_ldap, username)

    elif alt_secim == "2":
        username = input("Kullanıcı adı: ")
        disable_user(conn_ldap, username, enable=True)

    elif alt_secim == "3":
        username = input("Kullanıcı adı: ")
        delete_user(conn_ldap, username)

    elif alt_secim == "4":
        username = input("Kullanıcı adı: ")
        first = input("Ad: ")
        last = input("Soyad: ")
        password = input("Şifre: ")
        role_id = int(input("Rol ID (1=admin, 2=user, 3=guest): "))
        dept_input = input("Departman ID (1-MUHASEBE 2-İK 3-IT 4-İDARİ İŞLER 5-TEKNİK EKİPLER 6-YÖNETİM): ")
        department_id = int(dept_input) if dept_input.strip() else None

        add_user(conn_ldap, username, first, last, password, role_id, department_id)

    elif alt_secim == "5":
        print("👋 Programdan çıkılıyor...")
        break

    else:
        print("❌ Geçersiz seçim. Lütfen 1-5 arasında bir değer girin.")

# Bağlantıları kapat
conn_ldap.unbind()
conn_db.close()
