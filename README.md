

🧠 ODIE - LDAP ve Supabase Kullanıcı Yönetimi Aracı
Bu proje, bir Active Directory (LDAP) ortamındaki kullanıcıların yönetilmesini ve bu kullanıcıların Supabase veritabanıyla senkronize edilmesini sağlayan bir Python uygulamasıdır.

🎯 Amaç
ODIE, sistem yöneticilerine:

LDAP üzerinde kullanıcı ekleme, silme, devre dışı bırakma, aktifleştirme işlemleri yapma,

LDAP üzerindeki kullanıcıları Supabase PostgreSQL veritabanı ile senkronize etme

imkanı sunar. Tüm işlemler bir terminal menüsü üzerinden kolayca yönetilir.

⚙️ Özellikler
✅ LDAP → Supabase Senkronizasyonu

LDAP'te bulunan tüm kullanıcılar alınır.

Supabase üzerindeki users tablosu ile eşitlenir (ekleme/güncelleme).

✅ Kullanıcı Ekleme

LDAP üzerine yeni kullanıcı eklenir (önce devre dışı olarak).

Şifre ataması yapılır ve kullanıcı aktif hale getirilir.

Supabase veritabanına da kullanıcı bilgisi kaydedilir.

✅ Kullanıcı Devre Dışı Bırakma / Aktifleştirme

LDAP üzerindeki kullanıcı durumu değiştirilir.

Aynı işlem Supabase üzerinde de güncellenir.

✅ Kullanıcı Silme

LDAP'ten kullanıcı silinir.

Supabase veritabanından da ilgili kayıt temizlenir.

✅ Terminal Üzerinden Menü

Basit ve kullanıcı dostu bir terminal menüsü ile tüm işlemler yönetilir.

## 🗃️ Dosya Yapısı

```plaintext
odie-project/
├── main.py              # Ana program arayüzü
├── config.py            # Bağlantı ayarları
├── ldap_ops.py          # LDAP işlemleri (ekle, sil, devre dışı bırak vb.)
├── db_ops.py
├── user_ops.py
