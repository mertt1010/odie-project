🧠 ODIE - LDAP ve Supabase Kullanıcı Yönetimi Aracı (📊 Log Sistemi Dahil)
==================================================================================

Bu proje, Active Directory (LDAP) ortamındaki kullanıcıların yönetilmesini ve bu kullanıcıların Supabase veritabanıyla senkronize edilmesini sağlayan bir Python uygulamasıdır. API ve CLI arayüzleri ile çalışabilir. **Tüm API işlemleri otomatik olarak log sistemi ile kayıt altına alınır.**

## 🎯 Amaç

ODIE, sistem yöneticilerine aşağıdaki işlevleri sağlar:

- LDAP üzerinde domain, kullanıcı ekleme, silme, devre dışı bırakma, aktifleştirme işlemleri yapma
- LDAP üzerindeki kullanıcıları Supabase PostgreSQL veritabanı ile senkronize etme
- Birden fazla domain ve LDAP sunucu bağlantısı yönetme
- Rol ve departman bazlı kullanıcı kategorilendirme
- **📊 Tüm API işlemlerinin otomatik log kaydı ve görüntüleme**

Tüm işlemler bir terminal menüsü veya API ile kolayca yönetilebilir.

## ⚙️ Özellikler

### 📊 Log Sistemi (YENİ!)

- ✅ **Otomatik API Log Kayıtları**
  - Tüm endpoint çağrıları otomatik kaydedilir
  - Request/Response verileri, başarı durumu, hata mesajları
  - Kullanıcı ve domain bazlı filtreleme
  
- ✅ **Basit Log Görüntüleme**
  - `GET /api/logs` endpoint'i ile tüm logları görüntüleme
  - Kullanıcı, endpoint, limit/offset filtreleme desteği

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
| /api/logs | GET | Log kayıtlarını listeler |

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

### API ile Log Kayıtlarını Görüntüleme

```python
response = requests.get(
    "http://localhost:8000/api/logs?limit=10&offset=0"
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

## 📊 Log Sistemi Kurulumu

### 1. Supabase'de Log Tablosu Oluşturma

Supabase SQL Editor'de aşağıdaki SQL komutunu çalıştırın:

```sql
-- API işlemlerini kaydetmek için basit log tablosu
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,                    -- Hangi endpoint çağrıldı
    method VARCHAR(10) NOT NULL,                       -- HTTP method (GET, POST, PUT, DELETE)
    user_id VARCHAR(255),                              -- İşlemi yapan kullanıcı ID'si
    domain_id INTEGER,                                 -- İlgili domain ID'si (varsa)
    request_data JSONB,                                -- Gönderilen request verisi
    response_data JSONB,                               -- Dönen response verisi
    success BOOLEAN DEFAULT true,                      -- İşlem başarılı mı
    error_message TEXT,                                -- Hata mesajı (varsa)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- İşlem zamanı
);

-- Performans için indeksler
CREATE INDEX idx_api_logs_created_at ON api_logs (created_at DESC);
CREATE INDEX idx_api_logs_user_id ON api_logs (user_id);
CREATE INDEX idx_api_logs_endpoint ON api_logs (endpoint);
CREATE INDEX idx_api_logs_success ON api_logs (success);
```

### 2. Log Görüntüleme API'si

Log kayıtlarını görüntülemek için aşağıdaki endpoint'i kullanın:

```bash
# Tüm logları getir
GET /api/logs

# Parametreli kullanım
GET /api/logs?user_id=USER_UUID&endpoint=add_user&limit=50&offset=0
```

#### Örnek Response:

```json
{
  "success": true,
  "logs": [
    {
      "id": 123,
      "endpoint": "/add_user",
      "method": "POST",
      "user_id": "user-uuid-123",
      "domain_id": 1,
      "request_data": {
        "username": "john.doe",
        "first_name": "John",
        "last_name": "Doe"
      },
      "response_data": {
        "success": true,
        "status": "Kullanıcı başarıyla eklendi"
      },
      "success": true,
      "error_message": null,
      "created_at": "2024-12-26T10:30:00Z"
    }
  ],
  "total_count": 1,
  "limit": 50,
  "offset": 0
}
```

### 3. Log Sistemi Test

Log sistemini test etmek için:

```bash
# Test dosyasını çalıştır
python test_log_system.py

# Veya manuel test
curl "http://localhost:8000/api/logs?limit=5"
```

### 4. Loglanacak İşlemler

Aşağıdaki API endpoint'leri otomatik olarak loglanır:

- ✅ `POST /add_user` - Kullanıcı ekleme
- ✅ `POST /disable_user` - Kullanıcı devre dışı bırakma  
- ✅ `POST /enable_user` - Kullanıcı devreye alma
- ✅ `DELETE /delete_user` - Kullanıcı silme
- ✅ `POST /list_users_by_department` - Departman kullanıcıları listeleme
- ✅ `POST /add_domain` - Domain ekleme
- ✅ `GET /list_domains` - Domain listeleme
- ✅ `DELETE /delete_domain/{id}` - Domain silme

### 5. Log Kayıt Formatı

Her log kaydı şu bilgileri içerir:

- **endpoint**: Çağrılan API yolu
- **method**: HTTP method (GET, POST, PUT, DELETE)
- **user_id**: İşlemi yapan kullanıcı ID'si
- **domain_id**: İlgili domain ID'si (varsa)
- **request_data**: Gönderilen request verisi
- **response_data**: Dönen response verisi
- **success**: İşlem başarılı mı (true/false)
- **error_message**: Hata mesajı (varsa)
- **created_at**: İşlem zamanı

## 🚀 Hızlı Başlangıç (Log Sistemi Dahil)

1. **Supabase'de tabloları oluşturun** (yukarıdaki SQL)
2. **Server'ı başlatın:**
   ```bash
   uvicorn server:app --reload --port 8000
   ```
3. **API'yi test edin:**
   ```bash
   python test_log_system.py
   ```
4. **Log kayıtlarını görüntüleyin:**
   ```bash
   curl "http://localhost:8000/api/logs?limit=10"
   ```
