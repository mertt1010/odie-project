from user_ops import add_user, disable_user, delete_user
from db_ops import get_db_connection
from ldap_handler import get_ldap_connection_by_domain_id
import requests
import json

# API endpoint sabitleri
API_BASE_URL = "http://localhost:8000"  # API sunucu adresi

def list_domains(current_user_id):
    try:
        response = requests.get(f"{API_BASE_URL}/list_domains", params={"user_id": current_user_id})
        if response.status_code == 200:
            data = response.json()
            domains = [(d["id"], d["domain_name"]) for d in data["domains"]]
            return domains
        else:
            print(f"❌ API Hatası: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Bağlantı hatası: {e}")
        return []

def select_domain(current_user_id):
    print("🌐 Kullanılabilir Domainler:")
    domains = list_domains(current_user_id)
    if not domains:
        print("❌ Listelenecek domain bulunamadı.")
        return None
        
    for d in domains:
        print(f"{d[0]}) {d[1]}")
    domain_id = int(input("🆔 Domain ID seçin: "))
    return domain_id

def add_domain_api(current_user_id):
    print("\n🏢 Yeni Domain Ekleme")
    domain_name = input("Domain Adı: ")
    domain_ip = input("Domain IP Adresi: ")
    domain_component = input("Domain Component (örn: dc=example,dc=com): ")
    ldap_user = input("LDAP Kullanıcı Adı: ")
    ldap_password = input("LDAP Şifresi: ")
    
    domain_type = ""
    while domain_type not in ["ms", "samba"]:
        domain_type = input("Domain Tipi (ms/samba): ").lower()
        if domain_type not in ["ms", "samba"]:
            print("❌ Geçersiz tip. 'ms' veya 'samba' giriniz.")
    
    try:
        # API'ye domain bilgilerini gönder
        domain_data = {
            "domain_name": domain_name,
            "domain_ip": domain_ip,
            "domain_component": domain_component,
            "ldap_user": ldap_user,
            "ldap_password": ldap_password,
            "domain_type": domain_type,
            "created_by": current_user_id
        }
        
        response = requests.post(
            f"{API_BASE_URL}/add_domain", 
            data=json.dumps(domain_data),
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ {result.get('message', 'Domain başarıyla eklendi')}")
            else:
                print(f"❌ {result.get('message', 'Domain eklenirken bir hata oluştu')}")
        else:
            print(f"❌ API Hatası: {response.status_code}")
    
    except Exception as e:
        print(f"❌ Hata: {e}")

def delete_domain_api(current_user_id):
    print("\n🗑️ Domain Silme")
    domains = list_domains(current_user_id)
    
    if not domains:
        print("❌ Silinecek domain bulunamadı.")
        return
    
    print("🌐 Silmek istediğiniz domain'i seçin:")
    for d in domains:
        print(f"{d[0]}) {d[1]}")
    
    try:
        domain_id = int(input("🆔 Silinecek Domain ID: "))
        
        # Silmeden önce kullanıcı onayı al
        confirm = input(f"⚠️ Domain ID {domain_id} silinecek. Onaylıyor musunuz? (e/h): ")
        if confirm.lower() != 'e':
            print("❓ Silme işlemi iptal edildi.")
            return
            
        # API'den domain'i sil
        response = requests.delete(f"{API_BASE_URL}/delete_domain/{domain_id}", params={"user_id": current_user_id})
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ {result.get('message', 'Domain başarıyla silindi')}")
            else:
                print(f"❌ {result.get('message', 'Domain silinirken bir hata oluştu')}")
        else:
            print(f"❌ API Hatası: {response.status_code}")
        
    except ValueError:
        print("❌ Geçersiz ID. Sayısal bir değer giriniz.")
    except Exception as e:
        print(f"❌ Silme hatası: {e}")

def domain_menu(current_user_id):
    while True:
        print("\n🏢 Domain İşlemleri Menüsü")
        print("1) Domain listele")
        print("2) Domain ekle")
        print("3) Domain sil")
        print("4) Ana menüye dön")
        
        secim = input("Seçiminizi yapın (1-4): ")
        
        if secim == "1":
            print("\n🌐 Domain Listesi:")
            domains = list_domains(current_user_id)
            if domains:
                for d in domains:
                    print(f"ID: {d[0]} - Domain: {d[1]}")
            else:
                print("❌ Listelenecek domain bulunamadı.")
        
        elif secim == "2":
            add_domain_api(current_user_id)
        
        elif secim == "3":
            delete_domain_api(current_user_id)
        
        elif secim == "4":
            print("📋 Ana menüye dönülüyor...")
            break
        
        else:
            print("❌ Geçersiz seçim. Lütfen 1-4 arasında bir değer girin.")

def main():
    current_user_id = input("Kullanıcı UUID'nizi girin (frontend'den alınan): ")
    while True:
        print("\n🔧 Ana Menü")
        print("1) Domain işlemleri")
        print("2) Kullanıcı işlemleri")
        print("3) Departman işlemleri")
        print("4) Çıkış")
        
        secim = input("Seçiminizi yapın (1-4): ")
        
        if secim == "1":
            domain_menu(current_user_id)
            
        elif secim == "2":
            domain_id = select_domain(current_user_id)
            kullanici_menu(domain_id, current_user_id)
            
        elif secim == "3":
            domain_id = select_domain(current_user_id)
            if domain_id:
                department_menu(domain_id, current_user_id)
            
        elif secim == "4":
            print("👋 Programdan çıkılıyor...")
            break
            
        else:
            print("❌ Geçersiz seçim. Lütfen 1-4 arasında bir değer girin.")

def kullanici_menu(domain_id, current_user_id):
    while True:
        print("\n👤 Kullanıcı İşlemleri Menüsü")
        print("1) Kullanıcı devre dışı bırak")
        print("2) Kullanıcıyı devreye al")
        print("3) Kullanıcı sil")
        print("4) Kullanıcı ekle")
        print("5) Ana menüye dön")

        alt_secim = input("Seçiminizi yapın (1-5): ")
        
        if alt_secim == "1":
            username = input("Kullanıcı adı: ")
            disable_user(domain_id, username, current_user_id)

        elif alt_secim == "2":
            username = input("Kullanıcı adı: ")
            disable_user(domain_id, username, current_user_id, enable=True)

        elif alt_secim == "3":
            username = input("Kullanıcı adı: ")
            delete_user(domain_id, username, current_user_id)
            
        elif alt_secim == "4":
            username = input("Kullanıcı adı: ")
            first = input("Ad: ")
            last = input("Soyad: ")
            password = input("Şifre: ")
            role_id = int(input("Rol ID (1=admin, 2=user, 3=guest): "))
            
            # Domain'e ait departmanları listele
            try:
                response = requests.get(
                    f"{API_BASE_URL}/list_departments_by_domain/{domain_id}", 
                    params={"user_id": current_user_id}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        departments = result.get("departments", [])
                        if departments:
                            print("\n📋 Mevcut Departmanlar:")
                            for d in departments:
                                print(f"ID: {d['id']} - Departman: {d['name']}")
                            
                            dept_input = input("\nDepartman ID (Boş bırakılabilir): ")
                            department_id = int(dept_input) if dept_input.strip() else None
                        else:
                            print("❌ Bu domain'e ait departman bulunamadı. Departman atanmayacak.")
                            department_id = None
                    else:
                        print(f"❌ {result.get('message', 'Departmanlar listelenirken hata oluştu.')}")
                        department_id = None
                else:
                    print(f"❌ API Hatası: {response.status_code}")
                    department_id = None
            except Exception as e:
                print(f"❌ Hata: {e}")
                department_id = None

            add_user(domain_id, username, first, last, password, role_id, department_id, current_user_id)

        elif alt_secim == "5":
            print("📋 Ana menüye dönülüyor...")
            break

        else:
            print("❌ Geçersiz seçim. Lütfen 1-5 arasında bir değer girin.")

def department_menu(domain_id, current_user_id):
    while True:
        print("\n👥 Departman İşlemleri Menüsü")
        print("1) Departmanları listele")
        print("2) Departman ekle")
        print("3) Departman güncelle")
        print("4) Departman sil")
        print("5) Ana menüye dön")
        
        secim = input("Seçiminizi yapın (1-5): ")
        
        if secim == "1":
            print("\n📋 Departman Listesi:")
            try:
                # API'den departmanları getir
                response = requests.get(
                    f"{API_BASE_URL}/list_departments_by_domain/{domain_id}", 
                    params={"user_id": current_user_id}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        departments = result.get("departments", [])
                        if departments:
                            for d in departments:
                                print(f"ID: {d['id']} - Departman: {d['name']}")
                        else:
                            print("❌ Bu domain'e ait departman bulunamadı.")
                    else:
                        print(f"❌ {result.get('message', 'Departmanlar listelenirken hata oluştu.')}")
                else:
                    print(f"❌ API Hatası: {response.status_code}")
            except Exception as e:
                print(f"❌ Hata: {e}")
        
        elif secim == "2":
            print("\n➕ Yeni Departman Ekleme")
            department_name = input("Departman Adı: ")
            
            try:
                # API'ye departman ekle
                department_data = {
                    "department_name": department_name,
                    "domain_id": domain_id,
                    "created_by": current_user_id
                }
                
                response = requests.post(
                    f"{API_BASE_URL}/add_department", 
                    json=department_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        print(f"✅ {result.get('message', 'Departman başarıyla eklendi')}")
                    else:
                        print(f"❌ {result.get('message', 'Departman eklenirken hata oluştu')}")
                else:
                    print(f"❌ API Hatası: {response.status_code}")
            except Exception as e:
                print(f"❌ Hata: {e}")
        
        elif secim == "3":
            print("\n✏️ Departman Güncelleme")
            
            # Önce departmanları listele
            try:
                response = requests.get(
                    f"{API_BASE_URL}/list_departments_by_domain/{domain_id}", 
                    params={"user_id": current_user_id}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        departments = result.get("departments", [])
                        if departments:
                            for d in departments:
                                print(f"ID: {d['id']} - Departman: {d['name']}")
                                
                            # Departman seç ve güncelle
                            department_id = int(input("🆔 Güncellenecek Departman ID: "))
                            new_name = input("Yeni Departman Adı: ")
                            
                            update_data = {
                                "department_name": new_name
                            }
                            
                            update_response = requests.put(
                                f"{API_BASE_URL}/update_department/{domain_id}/{department_id}", 
                                json=update_data,
                                params={"user_id": current_user_id}
                            )
                            
                            if update_response.status_code == 200:
                                update_result = update_response.json()
                                if update_result.get("success"):
                                    print(f"✅ {update_result.get('message', 'Departman başarıyla güncellendi')}")
                                else:
                                    print(f"❌ {update_result.get('message', 'Departman güncellenirken hata oluştu')}")
                            else:
                                print(f"❌ API Hatası: {update_response.status_code}")
                        else:
                            print("❌ Bu domain'e ait departman bulunamadı.")
                    else:
                        print(f"❌ {result.get('message', 'Departmanlar listelenirken hata oluştu.')}")
                else:
                    print(f"❌ API Hatası: {response.status_code}")
            except Exception as e:
                print(f"❌ Hata: {e}")
        
        elif secim == "4":
            print("\n🗑️ Departman Silme")
            
            # Önce departmanları listele
            try:
                response = requests.get(
                    f"{API_BASE_URL}/list_departments_by_domain/{domain_id}", 
                    params={"user_id": current_user_id}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        departments = result.get("departments", [])
                        if departments:
                            for d in departments:
                                print(f"ID: {d['id']} - Departman: {d['name']}")
                                
                            # Departman seç ve sil
                            department_id = int(input("🆔 Silinecek Departman ID: "))
                            
                            # Silmeden önce kullanıcı onayı al
                            confirm = input(f"⚠️ Departman ID {department_id} silinecek. Bu departmana bağlı kullanıcıların departman bilgisi silinecek. Onaylıyor musunuz? (e/h): ")
                            if confirm.lower() != 'e':
                                print("❓ Silme işlemi iptal edildi.")
                                continue
                                
                            delete_response = requests.delete(
                                f"{API_BASE_URL}/delete_department/{domain_id}/{department_id}", 
                                params={"user_id": current_user_id}
                            )
                            
                            if delete_response.status_code == 200:
                                delete_result = delete_response.json()
                                if delete_result.get("success"):
                                    print(f"✅ {delete_result.get('message', 'Departman başarıyla silindi')}")
                                else:
                                    print(f"❌ {delete_result.get('message', 'Departman silinirken hata oluştu')}")
                            else:
                                print(f"❌ API Hatası: {delete_response.status_code}")
                        else:
                            print("❌ Bu domain'e ait departman bulunamadı.")
                    else:
                        print(f"❌ {result.get('message', 'Departmanlar listelenirken hata oluştu.')}")
                else:
                    print(f"❌ API Hatası: {response.status_code}")
            except Exception as e:
                print(f"❌ Hata: {e}")
        
        elif secim == "5":
            print("📋 Ana menüye dönülüyor...")
            break
        
        else:
            print("❌ Geçersiz seçim. Lütfen 1-5 arasında bir değer girin.")
            
if __name__ == "__main__":
    main()
