from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, validator, Field, IPvAnyAddress
from db_ops import get_db_connection
from ldap3 import Server, Connection
from enum import Enum
from typing import Optional
import re

router = APIRouter()

# 📌 Status enum tanımı
class UserStatus(str, Enum):
    ACTIVE = "devrede"
    DISABLED = "devre dışı"

# 📌 Domain tipi enum tanımı
class DomainType(str, Enum):
    MS = "ms"
    SAMBA = "samba"

# 📌 Domain veri modeli
class DomainCreateRequest(BaseModel):
    domain_name: str
    domain_ip: str
    domain_component: str
    ldap_user: str
    ldap_password: str
    domain_type: DomainType = DomainType.MS  # ms veya samba
    created_by: Optional[str] = None  # Kullanıcı UUID bilgisi

# 📌 Domain güncelleme modeli
class DomainUpdateRequest(BaseModel):
    domain_name: Optional[str] = None
    domain_ip: Optional[str] = None
    domain_component: Optional[str] = None
    ldap_user: Optional[str] = None
    ldap_password: Optional[str] = None
    domain_type: Optional[DomainType] = None
    status: Optional[str] = None

# 📌 Yeni domain ekleme
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from enum import Enum
from db_ops import get_db_connection
from ldap3 import Server, Connection
from typing import Optional

router = APIRouter()

class UserStatus(str, Enum):
    ACTIVE = "devrede"
    DISABLED = "devre dışı"

class DomainType(str, Enum):
    MS = "ms"
    SAMBA = "samba"

# ✅ domain_port alanı eklendi
class DomainCreateRequest(BaseModel):
    domain_name: str
    domain_ip: str
    domain_port: Optional[int] = 389  # varsayılan: 389
    domain_component: str
    ldap_user: str
    ldap_password: str
    domain_type: DomainType = DomainType.MS
    created_by: str
@router.post("/add_domain")
def add_domain(domain: DomainCreateRequest):
    try:
        # 🧠 LDAP bağlantısı kur
        if domain.domain_type == DomainType.SAMBA:
            server = Server(domain.domain_ip, port=int(domain.domain_port), use_ssl=False)  # 👈 BURASI
            conn = Connection(server, user=domain.ldap_user, password=domain.ldap_password)
            conn.open()
            conn.start_tls()
            conn.bind()
        else:
            server = Server(domain.domain_ip, port=int(domain.domain_port), use_ssl=False)  # 👈 BURASI
            conn = Connection(server, user=domain.ldap_user, password=domain.ldap_password, auto_bind=True)

        conn.unbind()


        # ✅ Veritabanına kaydet
        conn_db = get_db_connection()
        cursor = conn_db.cursor()
        cursor.execute("""
            INSERT INTO domains (domain_name, domain_ip, domain_port, domain_component, ldap_user, ldap_password, domain_type, status, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            domain.domain_name,
            domain.domain_ip,
            domain.domain_port,
            domain.domain_component,
            domain.ldap_user,
            domain.ldap_password,
            domain.domain_type.value,
            "devrede",
            domain.created_by
        ))
        conn_db.commit()
        conn_db.close()

        return {"success": True, "message": "✅ Domain başarıyla eklendi"}
    except Exception as e:
        print(f"❌ Hata: {e}")
        return {"success": False, "message": f"❌ Hata: {e}"}

# 📌 Domain güncelleme
@router.put("/update_domain/{domain_id}")
def update_domain(domain_id: int, domain: DomainUpdateRequest, user_id: Optional[str] = Query(None)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Önce domainin kullanıcıya ait olup olmadığını kontrol et
        if user_id:
            cursor.execute("SELECT COUNT(*) FROM domains WHERE id = %s AND created_by = %s", (domain_id, user_id))
            count = cursor.fetchone()[0]
            if count == 0:
                return {"success": False, "message": "❌ Bu domain sizin hesabınıza ait değil veya bulunamadı."}
        
        # Güncellenecek alanları belirle
        update_fields = []
        params = []
        
        if domain.domain_name is not None:
            update_fields.append("domain_name = %s")
            params.append(domain.domain_name)
            
        if domain.domain_ip is not None:
            update_fields.append("domain_ip = %s")
            params.append(domain.domain_ip)
            
        if domain.domain_component is not None:
            update_fields.append("domain_component = %s")
            params.append(domain.domain_component)
            
        if domain.ldap_user is not None:
            update_fields.append("ldap_user = %s")
            params.append(domain.ldap_user)
            
        if domain.ldap_password is not None:
            update_fields.append("ldap_password = %s")
            params.append(domain.ldap_password)
            
        if domain.domain_type is not None:
            update_fields.append("domain_type = %s")
            params.append(domain.domain_type.value)
            
        if domain.status is not None:
            update_fields.append("status = %s")
            params.append(domain.status)
        
        # Eğer güncellenecek alan yoksa hata döndür
        if not update_fields:
            return {"success": False, "message": "❌ Güncellenecek alan belirtilmedi."}
        
        # Update sorgusu oluştur
        query = f"UPDATE domains SET {', '.join(update_fields)} WHERE id = %s"
        params.append(domain_id)
        
        cursor.execute(query, params)
        conn.commit()
        
        # Güncellenen domain bilgilerini al
        cursor.execute("""
            SELECT id, domain_name, domain_type, status, domain_ip, domain_component, ldap_user, ldap_password
            FROM domains WHERE id = %s
        """, (domain_id,))
        updated_domain = cursor.fetchone()
        conn.close()
        
        if updated_domain:
            return {
                "success": True, 
                "message": "✅ Domain başarıyla güncellendi",
                "domain": {
                    "id": updated_domain[0],
                    "domain_name": updated_domain[1],
                    "domain_type": updated_domain[2],
                    "status": updated_domain[3],
                    "domain_ip": updated_domain[4],
                    "domain_component": updated_domain[5],
                    "ldap_user": updated_domain[6],
                    "ldap_password": updated_domain[7]
                }
            }
        else:
            return {"success": False, "message": "❌ Domain güncellenemedi."}
    except Exception as e:
        print(f"❌ Güncelleme hatası: {e}")
        return {"success": False, "message": f"❌ Güncelleme hatası: {e}"}

# 📌 Domainleri listeleme
@router.get("/list_domains")
def list_domains(user_id: Optional[str] = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        # Kullanıcıya ait domainleri filtrele
        cursor.execute("""
            SELECT id, domain_name, domain_type, status, domain_ip, domain_component, ldap_user, ldap_password
            FROM domains 
            WHERE created_by = %s
        """, (user_id,))
    else:
        # Admin için tüm domainleri listele
        cursor.execute("SELECT id, domain_name, domain_type, status, domain_ip, domain_component, ldap_user, ldap_password FROM domains")
        
    domains = cursor.fetchall()
    conn.close()

    domain_list = [
        {
            "id": d[0],
            "domain_name": d[1],
            "domain_type": d[2],
            "status": d[3],
            "domain_ip": d[4],
            "domain_component": d[5],
            "ldap_user": d[6],
            "ldap_password": d[7]
        }
        for d in domains
    ]
    return {"domains": domain_list}

# 📌 Domain silme
@router.delete("/delete_domain/{domain_id}")
def delete_domain(domain_id: int, user_id: Optional[str] = Query(None)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Önce domainin kullanıcıya ait olup olmadığını kontrol et
        if user_id:
            cursor.execute("SELECT COUNT(*) FROM domains WHERE id = %s AND created_by = %s", (domain_id, user_id))
            count = cursor.fetchone()[0]
            if count == 0:
                return {"success": False, "message": "❌ Bu domain sizin hesabınıza ait değil veya bulunamadı."}
        
        # Domain kullanıcıya aitse veya admin ise silme işlemi yap
        cursor.execute("DELETE FROM domains WHERE id = %s", (domain_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "✅ Domain silindi"}
    except Exception as e:
        return {"success": False, "message": f"❌ Silme hatası: {e}"}

# 📌 Domain'deki kullanıcıları listeleme
@router.get("/list_users_by_domain/{domain_id}")
def list_users_by_domain(domain_id: int, status: Optional[UserStatus] = None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if status:
            # Belirli bir duruma sahip kullanıcıları getir
            cursor.execute("""
                SELECT id, username, first_name, password, last_name, role_id, department_id, status
                FROM users 
                WHERE domain_id = %s AND status = %s
                ORDER BY username
            """, (domain_id, status.value))
        else:
            # Tüm kullanıcıları getir
            cursor.execute("""
                SELECT id, username, first_name, password, last_name, role_id, department_id, status
                FROM users 
                WHERE domain_id = %s
                ORDER BY username
            """, (domain_id,))
            
        users = cursor.fetchall()
        conn.close()
        
        user_list = [
            {
                "id": u[0],
                "username": u[1],
                "first_name": u[2],
                "password": u[3],
                "last_name": u[4],
                "role_id": u[5],
                "department_id": u[6],
                "status": u[7]
            }
            for u in users
        ]
        return {"users": user_list}
    except Exception as e:
        return {"success": False, "message": f"❌ Kullanıcı listeleme hatası: {e}"}

# 📌 Kullanıcı güncelleme modeli
class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None

# 📌 Kullanıcı güncelleme
@router.put("/update_user/{domain_id}/{username}")
def update_user_endpoint(domain_id: int, username: str, user_data: UserUpdateRequest):
    try:
        from user_ops import update_user
        
        success, message = update_user(
            domain_id=domain_id,
            username=username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            password=user_data.password,
            role_id=user_data.role_id,
            department_id=user_data.department_id
        )
        
        if success:
            # Güncellenen kullanıcı bilgilerini getir
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, username, first_name, last_name, role_id, department_id, status
                FROM users 
                WHERE username = %s AND domain_id = %s
            """, (username, domain_id))
            
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return {
                    "success": True,
                    "message": message,
                    "user": {
                        "id": user[0],
                        "username": user[1],
                        "first_name": user[2],
                        "last_name": user[3],
                        "role_id": user[4],
                        "department_id": user[5],
                        "status": user[6]
                    }
                }
            else:
                return {"success": True, "message": message}
        else:
            return {"success": False, "message": message}
    except Exception as e:
        print(f"❌ Güncelleme hatası: {e}")
        return {"success": False, "message": f"❌ Güncelleme hatası: {e}"}

# 📌 Departmanları listeleme
@router.get("/list_departments")
def list_departments():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM departments ORDER BY name")
        departments = cursor.fetchall()
        conn.close()
        
        department_list = [
            {
                "id": d[0],
                "name": d[1]
            }
            for d in departments
        ]
        
        return {"departments": department_list}
    except Exception as e:
        return {"success": False, "message": f"❌ Departman listeleme hatası: {e}"}
