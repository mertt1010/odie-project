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

# 📌 Yeni domain ekleme
@router.post("/add_domain")
def add_domain(domain: DomainCreateRequest):
    try:        # LDAP bağlantısını test et
        if domain.domain_type == DomainType.SAMBA:
            # Samba için TLS kullan
            server = Server(domain.domain_ip, use_ssl=False)
            conn = Connection(server, user=domain.ldap_user, password=domain.ldap_password)
            conn.open()
            conn.start_tls()
            conn.bind()
        else:
            # Windows için
            server = Server(domain.domain_ip, use_ssl=False)  
            conn = Connection(server, user=domain.ldap_user, password=domain.ldap_password, auto_bind=True)
        conn.unbind()

        # Veritabanına kaydet
        conn_db = get_db_connection()
        cursor = conn_db.cursor()
        cursor.execute("""
            INSERT INTO domains (domain_name, domain_ip, domain_component, ldap_user, ldap_password, domain_type, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            domain.domain_name,
            domain.domain_ip,
            domain.domain_component,
            domain.ldap_user,
            domain.ldap_password,
            domain.domain_type.value,  # Enum değerini kullan
            "devrede"
        ))      
        conn_db.commit()
        conn_db.close()

        return {"success": True, "message": "✅ Domain başarıyla eklendi"}
    except Exception as e:
            print(f"❌ Hata: {e}")  # 👈 bu satırı ekle!
            return {"success": False, "message": f"❌ Hata: {e}"}

# 📌 Domainleri listeleme
@router.get("/list_domains")
def list_domains():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, domain_name, domain_type, status FROM domains")
    domains = cursor.fetchall()
    conn.close()

    domain_list = [
        {
            "id": d[0],
            "domain_name": d[1],
            "domain_type": d[2],
            "status": d[3]
        }
        for d in domains
    ]
    return {"domains": domain_list}

# 📌 Domain silme
@router.delete("/delete_domain/{domain_id}")
def delete_domain(domain_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
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
                SELECT id, username, first_name, last_name, role_id, department_id, status
                FROM users 
                WHERE domain_id = %s AND status = %s
                ORDER BY username
            """, (domain_id, status.value))
        else:
            # Tüm kullanıcıları getir
            cursor.execute("""
                SELECT id, username, first_name, last_name, role_id, department_id, status
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
                "last_name": u[3],
                "role_id": u[4],
                "department_id": u[5],
                "status": u[6]
            }
            for u in users
        ]
        return {"users": user_list}
    except Exception as e:
        return {"success": False, "message": f"❌ Kullanıcı listeleme hatası: {e}"}

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
