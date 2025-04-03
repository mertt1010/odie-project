from ldap3 import Server, Connection, MODIFY_REPLACE
from config import LDAP_SERVER, LDAP_USER, LDAP_PASSWORD
import time

def get_ldap_connection():
    server = Server(LDAP_SERVER)
    conn = Connection(server, user=LDAP_USER, password=LDAP_PASSWORD, auto_bind=True)
    return conn

def add_user(conn, username, first_name, last_name, password):
    """
    LDAP'e kullanıcı ekler. Aynı kullanıcı adı varsa eklemez.
    Şifre atanamazsa yine de devre dışı olarak PostgreSQL'e kaydeder.
    """
    user_dn = f"CN={username},CN=Users,DC=odieproje,DC=local"

    # Kullanıcı adı zaten kullanılıyor mu kontrol et
    conn.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])
    if conn.entries:
        print(f"❌ Bu kullanıcı adı zaten kullanımda: {username}")
        return False, 'devre dışı'

    # LDAP'e devre dışı bir kullanıcı olarak ekle
    user_attributes = {
        'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
        'cn': username,
        'sAMAccountName': username,
        'givenName': first_name,
        'sn': last_name,
        'userAccountControl': 514
    }

    if conn.add(user_dn, attributes=user_attributes):
        print(f"✅ Kullanıcı LDAP'e eklendi (devre dışı): {username}")
        time.sleep(1)

        # Şifre ayarla (UTF-16-LE encode ve çift tırnaklı)
        password_value = ('"%s"' % password).encode('utf-16-le')
        if conn.modify(user_dn, {'unicodePwd': [(MODIFY_REPLACE, [password_value])]}):
            # Başarıyla şifre atandıysa, kullanıcıyı aktifleştir
            conn.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [512])]})
            print(f"✅ Şifre atandı ve kullanıcı aktifleştirildi.")
            return True, 'devrede'
        else:
            print(f"⚠️ Şifre atanamadı ama kullanıcı LDAP'e eklendi.")
            return True, 'devre dışı'
    else:
        print(f"❌ LDAP kullanıcı ekleme hatası: {conn.result}")
        return False, 'devre dışı'


def disable_user(conn, username, enable=False):
    """
    LDAP'te kullanıcıyı devre dışı bırakır ya da devreye alır.
    Zaten aynı durumda olan kullanıcı için işlem yapılmaz.
    """
    conn.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName', 'userAccountControl'])
    
    if not conn.entries:
        print(f"❌ Kullanıcı bulunamadı: {username}")
        return False, None

    user_dn = conn.entries[0].distinguishedName.value
    current_status = int(conn.entries[0].userAccountControl.value)

    # Hedef durum ile karşılaştır
    target_status = 512 if enable else 514
    action = "aktifleştirildi" if enable else "devre dışı bırakıldı"

    if current_status == target_status:
        print(f"⚠️ Kullanıcı zaten {action}: {username}")
        return False, action

    # LDAP durumunu güncelle
    if conn.modify(user_dn, {'userAccountControl': [(MODIFY_REPLACE, [target_status])]}):
        print(f"✅ Kullanıcı {action}: {username}")
        return True, action
    else:
        print(f"❌ Kullanıcı {action} başarısız: {conn.result}")
        return False, action

def delete_user(conn, username):
    conn.search('DC=odieproje,DC=local', f'(sAMAccountName={username})', attributes=['distinguishedName'])
    if conn.entries:
        user_dn = conn.entries[0].distinguishedName.value
        if conn.delete(user_dn):
            print(f"✅ Kullanıcı LDAP'ten silindi: {username}")
            return True
        else:
            print(f"❌ LDAP'ten kullanıcı silme başarısız: {conn.result}")
    else:
        print(f"❌ Kullanıcı bulunamadı: {username}")
    return False