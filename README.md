# 🧠 ODIE - LDAP ve PostgreSQL Senkronizasyon ve Kullanıcı Yönetimi Aracı

Bu proje, bir Active Directory (LDAP) ortamındaki kullanıcı ve bilgisayar verilerini PostgreSQL veritabanı ile senkronize eden ve temel kullanıcı işlemlerini gerçekleştirebilen bir Python uygulamasıdır.

## 🎯 Amaç

ODIE, sistem yöneticilerinin:
- LDAP (Active Directory) üzerinden kullanıcı **ekleme**, **silme**, **devre dışı bırakma**, **aktif etme**
- LDAP'teki kullanıcı ve bilgisayar listesini **PostgreSQL veritabanı ile senkronize etme**

gibi işlemleri terminal arayüzü üzerinden hızlıca yapmasını sağlar.

---

## ⚙️ Özellikler

✅ **LDAP → PostgreSQL Senkronizasyonu**  
- Tüm kullanıcılar (`objectClass=user`) ve bilgisayarlar (`objectClass=computer`) alınır  
- PostgreSQL'deki `usernames` ve `computers` tablolarına kaydedilir  
- Veriler güncel tutulur

✅ **Kullanıcı Ekleme**  
- Yeni kullanıcıyı önce devre dışı olarak LDAP’e ekler  
- Şifre atanabilirse hesabı aktif hale getirir  
- Hangi durumda olursa olsun PostgreSQL'e statüsüyle birlikte ekler

✅ **Kullanıcıyı Devre Dışı Bırakma / Aktif Etme**  
- LDAP'te `userAccountControl` alanı güncellenir  
- PostgreSQL'deki karşılığı da senkronize edilir  
- Zaten devre dışıysa/aktifse tekrar işlem yapmaz

✅ **Kullanıcı Silme**  
- LDAP üzerinden kullanıcıyı siler  
- Eş zamanlı olarak PostgreSQL'deki kaydı da temizler

---

## 🗃️ Dosya Yapısı

```plaintext
odie-project/
├── main.py              # Ana program arayüzü
├── config.py            # Bağlantı ayarları
├── ldap_ops.py          # LDAP işlemleri (ekle, sil, devre dışı bırak vb.)
├── db_ops.py            # PostgreSQL işlemleri ve senkronizasyon
