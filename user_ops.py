from ldap3 import MODIFY_REPLACE
import time

# Kullanıcı ekleme fonksiyonu
def add_user(conn_ldap, username, first_name, last_name, password):
    user_dn = f"CN={username},CN=Users,DC=odieproje,DC=local"

    # Kullanıcı zaten var mı kontrol et
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])
    if conn_ldap.entries:
        print(f"❌ Kullanıcı zaten var: {username}")
        return False, None

    # İlk olarak kullanıcıyı devre dışı olarak oluştur
    user_attributes = {
        'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
        'cn': username,
        'sAMAccountName': username,
        'givenName': first_name,
        'sn': last_name,
        'userAccountControl': 514  # Devre dışı kullanıcı
    }

    if conn_ldap.add(user_dn, attributes=user_attributes):
        print(f"✅ Kullanıcı LDAP'e eklendi (başlangıçta devre dışı): {username}")
        time.sleep(1)  # LDAP gecikmesi

        # Şifreyi ayarla
        password_value = ('"%s"' % password).encode('utf-16-le')
        if conn_ldap.modify(user_dn, {'unicodePwd': [(MODIFY_REPLACE, [password_value])]}):

            # Kullanıcıyı aktifleştir
            if conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [512])]}):
                print(f"✅ Kullanıcı aktif hale getirildi: {username}")
                return True, "devrede"
            else:
                print(f"❌ Kullanıcı aktifleştirilemedi: {conn_ldap.result}")
                return True, "devre dışı"
        else:
            print(f"❌ Şifre ayarlanamadı: {conn_ldap.result}")
            return True, "devre dışı"
    else:
        print(f"❌ Kullanıcı eklenemedi: {conn_ldap.result}")
        return False, None


# Kullanıcıyı devre dışı bırakma veya devreye alma fonksiyonu
def disable_user(conn_ldap, username, enable=False):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName', 'userAccountControl'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False, None

    user_dn = conn_ldap.entries[0].distinguishedName.value
    current_status = int(conn_ldap.entries[0].userAccountControl.value)
    user_status = 512 if enable else 514
    action = "aktifleştirildi" if enable else "devre dışı bırakıldı"

    if current_status == user_status:
        durum = "zaten devrede" if enable else "zaten devre dışı"
        print(f"⚠️ Kullanıcı {durum}: {username}")
        return False, None

    if conn_ldap.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [user_status])]}):
        print(f"✅ Kullanıcı {action}: {username}")
        return True, action
    else:
        print(f"❌ Kullanıcı {action} başarısız: {conn_ldap.result}")
        return False, action


# Kullanıcı silme fonksiyonu
def delete_user(conn_ldap, username):
    conn_ldap.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])

    if not conn_ldap.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False

    user_dn = conn_ldap.entries[0].distinguishedName.value

    if conn_ldap.delete(user_dn):
        print(f"✅ Kullanıcı LDAP'ten silindi: {username}")
        return True
    else:
        print(f"❌ LDAP'ten kullanıcı silme başarısız: {conn_ldap.result}")
        return False
