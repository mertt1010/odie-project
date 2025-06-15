from ldap3 import Server, Connection
from db_ops import get_db_connection
from enum import Enum

# Domain tipi enum tanımı
class DomainType(str, Enum):
    MS = "ms"
    SAMBA = "samba"

def get_ldap_connection_by_domain_id(domain_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT domain_ip, ldap_user, ldap_password, domain_component, domain_type
        FROM domains WHERE id = %s
    """, (domain_id,))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        raise Exception("❌ Domain bulunamadı")

    domain_ip, ldap_user, ldap_password, domain_component, domain_type = result
    
    try:
        server = Server(domain_ip, use_ssl=False)

        if domain_type == "ms":
            # Microsoft için: basit bind yeterli
            conn_ldap = Connection(server, user=ldap_user, password=ldap_password, auto_bind=True)

        elif domain_type == "samba":
            # Samba için: önce TLS başlat, sonra bind
            conn_ldap = Connection(server, user=ldap_user, password=ldap_password)
            conn_ldap.open()
            conn_ldap.start_tls()
            conn_ldap.bind()

        else:
            raise Exception("❌ Bilinmeyen domain_type")

        return conn_ldap, domain_component

    except Exception as e:
        raise Exception(f"❌ LDAP bağlantı hatası: {e}")
