

🧠 ODIE - LDAP ve Supabase Kullanıcı Yönetimi Aracı
==============================================

Bu proje, Active Directory (LDAP) ortamındaki kullanıcıların yönetilmesini ve bu kullanıcıların Supabase veritabanıyla senkronize edilmesini sağlayan bir Python uygulamasıdır. API ve CLI arayüzleri ile çalışabilir.

## 🎯 Amaç

ODIE, sistem yöneticilerine aşağıdaki işlevleri sağlar:

- LDAP üzerinde domain, kullanıcı ekleme, silme, devre dışı bırakma, aktifleştirme işlemleri yapma
- LDAP üzerindeki kullanıcıları Supabase PostgreSQL veritabanı ile senkronize etme
- Birden fazla domain ve LDAP sunucu bağlantısı yönetme
- Rol ve departman bazlı kullanıcı kategorilendirme

Tüm işlemler bir terminal menüsü veya API ile kolayca yönetilebilir.

## ⚙️ Özellikler

### 🔒 Domain Yönetimi

- ✅ Çoklu domain desteği (Microsoft AD ve Samba)
- ✅ Domain ekleme, silme ve listeleme
- ✅ Domain-kullanıcı ilişkisi

### 👤 Kullanıcı Yönetimi

- ✅ LDAP → Supabase Senkronizasyonu
  - LDAP'te bulunan tüm kullanıcılar alınır
  - Supabase üzerindeki users tablosu ile eşitlenir (ekleme/güncelleme)

- ✅ Kullanıcı Ekleme
  - LDAP üzerine yeni kullanıcı eklenir (önce devre dışı olarak)
  - Şifre ataması yapılır ve kullanıcı aktif hale getirilir
  - Supabase veritabanına da kullanıcı bilgisi kaydedilir

- ✅ Kullanıcı Devre Dışı Bırakma / Aktifleştirme
  - LDAP üzerindeki kullanıcı durumu değiştirilir
  - Aynı işlem Supabase üzerinde de güncellenir

- ✅ Kullanıcı Silme
  - LDAP'ten kullanıcı silinir
  - Supabase veritabanından da ilgili kayıt temizlenir

### 🌐 Ek Özellikler

- ✅ Terminal Üzerinden Menü
  - Basit ve kullanıcı dostu bir terminal menüsü ile tüm işlemler
  
- ✅ REST API
  - FastAPI kullanılarak oluşturulmuş RESTful API
  - Aynı işlemler HTTP istekleri ile gerçekleştirilebilir

- ✅ Veri Doğrulama (Validation)
  - API üzerinden gelen tüm girdiler doğrulanır
  - Enum kullanarak sabit değerler güvence altında

## 🗃️ Dosya Yapısı

```plaintext
OdieProject/
├── main.py              # CLI arayüzü ve ana program
├── server.py            # FastAPI sunucusu ve endpoint tanımları
├── domain_api.py        # Domain işlemleri için API rotaları
├── ldap_handler.py      # LDAP bağlantı işleyicisi
├── user_ops.py          # Kullanıcı işlemleri (ekle, sil, devre dışı, etkinleştir)
├── db_ops.py            # Veritabanı bağlantı ve işlemleri
└── README.md            # Proje dokümantasyonu
```

## 🔧 Kullanılan Teknolojiler

- **Python 3.10+**: Ana programlama dili
- **ldap3**: LDAP bağlantıları için Python kütüphanesi
- **FastAPI**: API sunucusu için modern web framework
- **psycopg2**: PostgreSQL veritabanı bağlantısı için
- **Supabase**: PostgreSQL veritabanı hizmeti
- **Pydantic**: Veri doğrulama ve model tanımları için

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

```bash
pip install ldap3 fastapi uvicorn psycopg2 requests
```

### CLI Uygulamasını Çalıştırma

```bash
python main.py
```

### API Sunucusunu Çalıştırma

```bash
uvicorn server:app --reload
```

## 📝 API Endpointleri

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| /list_domains | GET | Tüm domainleri listeler |
| /add_domain | POST | Yeni domain ekler |
| /delete_domain/{domain_id} | DELETE | Domain siler |
| /list_users_by_domain/{domain_id} | GET | Domain'deki kullanıcıları listeler |
| /add_user | POST | Yeni kullanıcı ekler |
| /disable_user | POST | Kullanıcıyı devre dışı bırakır |
| /enable_user | POST | Kullanıcıyı etkinleştirir |
| /delete_user | DELETE | Kullanıcıyı siler |
| /list_departments | GET | Departmanları listeler |

## 👨‍💻 Örnek Kullanım

### API ile Domain Ekleme

```python
import requests
import json

domain_data = {
    "domain_name": "example.com",
    "domain_ip": "192.168.1.10",
    "domain_component": "dc=example,dc=com",
    "ldap_user": "admin@example.com",
    "ldap_password": "SecurePassword123",
    "domain_type": "ms"  # "ms" veya "samba"
}

response = requests.post(
    "http://localhost:8000/add_domain", 
    data=json.dumps(domain_data),
    headers={"Content-Type": "application/json"}
)

print(response.json())
```

### API ile Kullanıcı Listeleme

```python
response = requests.get(
    "http://localhost:8000/list_users_by_domain/1?status=devrede"
)

print(response.json())
```

## 🔮 Gelecek Özellikler

- AD gruplarının yönetimi
- Gelişmiş arama özellikleri
- Kullanıcı rollerinin yetkilendirme sistemi
- Web arayüzü
- Toplu (batch) işlemler

## 🛡️ Güvenlik Notları

- LDAP şifreleri ve bağlantı bilgileri güvenli şekilde saklanmalıdır
- Veritabanı bağlantı bilgileri çevresel değişkenler (environment variables) olarak kullanılabilir
