from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, validator, Field, IPvAnyAddress
from db_ops import get_db_connection
from ldap3 import Server, Connection
from enum import Enum
from typing import Optional
import re
import psycopg2
from log_system import APILogger

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
    domain_name: Optional[str] = Field(None, description="Domain adı (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    domain_ip: Optional[str] = Field(None, description="Domain IP adresi (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    domain_component: Optional[str] = Field(None, description="Domain component (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    ldap_user: Optional[str] = Field(None, description="LDAP kullanıcı adı (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    ldap_password: Optional[str] = Field(None, description="LDAP şifresi (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    domain_type: Optional[DomainType] = Field(None, description="Domain tipi: ms veya samba (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    status: Optional[str] = Field(None, description="Domain durumu: devrede veya devre dışı (opsiyonel - sadece değiştirmek istiyorsanız girin)", example=None)
    
    class Config:
        json_schema_extra = {
            "example": {
                "domain_name": None,
                "domain_ip": None,
                "domain_component": None,
                "ldap_user": None,
                "ldap_password": None,
                "domain_type": None,
                "status": None
            }
        }

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
        # 🔍 IP benzersizlik kontrolü (uygulama seviyesi)
        if check_user_ip_exists(domain.domain_ip, domain.created_by):
            return {
                "success": False,
                "message": f"❌ Bu IP adresi ({domain.domain_ip}) ile zaten bir domain'iniz bulunmaktadır. Aynı kullanıcı aynı IP ile birden fazla domain oluşturamaz."
            }
        
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

        response = {"success": True, "message": "✅ Domain başarıyla eklendi"}
        
        # Log kaydet
        APILogger.log_operation(
            endpoint="/add_domain",
            method="POST",
            operation_type="domain",
            user_id=domain.created_by,
            request_data=domain.dict(),
            response_data=response,
            success=True
        )

        return response
    except psycopg2.IntegrityError as e:
        # 🛡️ Veritabanı constraint violation yakalandı
        if "unique_ip_per_user" in str(e):
            error_response = {
                "success": False,
                "message": f"❌ Bu IP adresi ({domain.domain_ip}) ile zaten bir domain'iniz bulunmaktadır. Aynı kullanıcı aynı IP ile birden fazla domain oluşturamaz."
            }
        else:
            print(f"❌ Veritabanı bütünlük hatası: {e}")
            error_response = {"success": False, "message": f"❌ Veritabanı hatası: Domain eklenemedi"}
        
        # Hata log'u kaydet
        APILogger.log_operation(
            endpoint="/add_domain",
            method="POST",
            operation_type="domain",
            user_id=domain.created_by,
            request_data=domain.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response
    except Exception as e:
        print(f"❌ Hata: {e}")
        error_response = {"success": False, "message": f"❌ Hata: {e}"}
        
        # Hata log'u kaydet
        APILogger.log_operation(
            endpoint="/add_domain",
            method="POST",
            operation_type="domain",
            user_id=domain.created_by,
            request_data=domain.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📌 Domain güncelleme
@router.put("/update_domain/{domain_id}", 
           summary="Domain Güncelle",
           description="""
           Domain bilgilerini günceller. 
           
           **Önemli:** Sadece değiştirmek istediğiniz alanları gönderin!
           - Boş (null) bırakılan alanlar güncellenmez
           - Sadece gönderilen alanlar değiştirilir
           
           **Örnek kullanım:**
           - Sadece Domain Component'ı değiştirmek için: {"domain_component": "new_component"}
           - Sadece LDAP kullanıcı adını değiştirmek için: {"ldap_user": "new_ldap_user"}
           - Sadece LDAP şifresini değiştirmek için: {"ldap_password": "new_ldap_password"}
           - Sadece Domain tipi değiştirmek için: {"domain_type": "samba"}
           - Sadece Domain durumunu değiştirmek için: {"status": "devre dışı"}
           - Sadece IP değiştirmek için: {"domain_ip": "192.168.1.100"}
           - Sadece isim değiştirmek için: {"domain_name": "yeni-domain"}
           """)
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
        
        # 🔍 IP güncellemesi yapılıyorsa benzersizlik kontrolü
        if domain.domain_ip is not None and user_id:
            # Mevcut domain'in IP'si ile aynı değilse kontrol et
            cursor.execute("SELECT domain_ip FROM domains WHERE id = %s", (domain_id,))
            current_ip = cursor.fetchone()[0]
            
            if current_ip != domain.domain_ip:
                # Yeni IP ile kullanıcının başka domain'i var mı kontrol et
                if check_user_ip_exists(domain.domain_ip, user_id):
                    conn.close()
                    return {
                        "success": False,
                        "message": f"❌ Bu IP adresi ({domain.domain_ip}) ile zaten bir domain'iniz bulunmaktadır. Aynı kullanıcı aynı IP ile birden fazla domain oluşturamaz."
                    }
          # Güncellenecek alanları belirle
        update_fields = []
        params = []
        
        # domain_name kontrolü (None ve boş string değilse)
        if domain.domain_name is not None and domain.domain_name.strip() != "":
            update_fields.append("domain_name = %s")
            params.append(domain.domain_name)
            
        # domain_ip kontrolü (None ve boş string değilse)
        if domain.domain_ip is not None and domain.domain_ip.strip() != "":
            update_fields.append("domain_ip = %s")
            params.append(domain.domain_ip)
            
        # domain_component kontrolü (None ve boş string değilse)
        if domain.domain_component is not None and domain.domain_component.strip() != "":
            update_fields.append("domain_component = %s")
            params.append(domain.domain_component)
            
        # ldap_user kontrolü (None ve boş string değilse) - ✅ Düzeltildi
        if domain.ldap_user is not None and domain.ldap_user.strip() != "":
            update_fields.append("ldap_user = %s")
            params.append(domain.ldap_user)
            
        # ldap_password kontrolü (None ve boş string değilse)
        if domain.ldap_password is not None and domain.ldap_password.strip() != "":
            update_fields.append("ldap_password = %s")
            params.append(domain.ldap_password)
            
        # domain_type kontrolü (None değilse)
        if domain.domain_type is not None:
            update_fields.append("domain_type = %s")
            params.append(domain.domain_type.value)
            
        # status kontrolü (None ve boş string değilse)
        if domain.status is not None and domain.status.strip() != "":
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
            response = {
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
            
            # Log kaydet
            APILogger.log_operation(
                endpoint="/update_domain",
                method="PUT",
                operation_type="domain",
                user_id=user_id,
                request_data=domain.dict(),
                response_data=response,
                success=True
            )
            
            return response
        else:
            error_response = {"success": False, "message": "❌ Domain güncellenemedi."}
            
            # Hata log'u kaydet
            APILogger.log_operation(
                endpoint="/update_domain",
                method="PUT",
                operation_type="domain",
                user_id=user_id,
                request_data=domain.dict(),
                response_data=error_response,
                success=False,
                error_message="Domain güncellenemedi"
            )
            
            return error_response
    except psycopg2.IntegrityError as e:
        # 🛡️ Veritabanı constraint violation yakalandı
        if "unique_ip_per_user" in str(e):
            error_response = {
                "success": False,
                "message": f"❌ Bu IP adresi ile zaten bir domain'iniz bulunmaktadır. Aynı kullanıcı aynı IP ile birden fazla domain oluşturamaz."
            }
        else:
            print(f"❌ Veritabanı bütünlük hatası: {e}")
            error_response = {"success": False, "message": f"❌ Veritabanı hatası: Domain güncellenemedi"}
        
        # Integrity error log'u kaydet
        APILogger.log_operation(
            endpoint="/update_domain",
            method="PUT",
            operation_type="domain",
            user_id=user_id,
            request_data=domain.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response
    except Exception as e:
        print(f"❌ Güncelleme hatası: {e}")
        error_response = {"success": False, "message": f"❌ Güncelleme hatası: {e}"}
        
        # Exception log'u kaydet
        APILogger.log_operation(
            endpoint="/update_domain",
            method="PUT",
            operation_type="domain",
            user_id=user_id,
            request_data=domain.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📌 Domainleri listeleme
@router.get("/list_domains")
def list_domains(user_id: Optional[str] = Query(None)):
    try:
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
        
        response = {"domains": domain_list}
        
        # GET işlemi olduğu için log kaydı yapılmıyor
        return response
        
    except Exception as e:
        error_response = {"success": False, "message": f"Domain listeleme hatası: {e}"}
        
        # GET işlemi olduğu için hata durumunda da log kaydı yapılmıyor
        return error_response

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
                error_response = {"success": False, "message": "❌ Bu domain sizin hesabınıza ait değil veya bulunamadı."}
                
                # Log kaydet
                APILogger.log_operation(
                    endpoint="/delete_domain",
                    method="DELETE",
                    operation_type="domain",
                    user_id=user_id,
                    domain_id=domain_id,
                    response_data=error_response,
                    success=False,
                    error_message="Domain erişim yetkisi yok"
                )
                
                return error_response
        
        # Domain kullanıcıya aitse veya admin ise silme işlemi yap
        cursor.execute("DELETE FROM domains WHERE id = %s", (domain_id,))
        conn.commit()
        conn.close()
        
        response = {"success": True, "message": "✅ Domain silindi"}
        
        # Başarılı log kaydet
        APILogger.log_operation(
            endpoint="/delete_domain",
            method="DELETE",
            operation_type="domain",
            user_id=user_id,
            domain_id=domain_id,
            response_data=response,
            success=True
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "message": f"❌ Silme hatası: {e}"}
        
        # Hata log'u kaydet
        APILogger.log_operation(
            endpoint="/delete_domain",
            method="DELETE",
            operation_type="domain",
            user_id=user_id,
            domain_id=domain_id,
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

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
def update_user_endpoint(domain_id: int, username: str, user_data: UserUpdateRequest, user_id: Optional[str] = Query(None)):
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
                response = {
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
                response = {"success": True, "message": message}
            
            # Log kaydet
            APILogger.log_operation(
                endpoint="/update_user",
                method="PUT",
                operation_type="user",
                user_id=user_id,
                domain_id=domain_id,
                request_data=user_data.dict(),
                response_data=response,
                success=True
            )
            
            return response
        else:
            error_response = {"success": False, "message": message}
            
            # Hata log'u kaydet
            APILogger.log_operation(
                endpoint="/update_user",
                method="PUT",
                operation_type="user",
                user_id=user_id,
                domain_id=domain_id,
                request_data=user_data.dict(),
                response_data=error_response,
                success=False,
                error_message=message
            )
            
            return error_response
    except Exception as e:
        print(f"❌ Güncelleme hatası: {e}")
        error_response = {"success": False, "message": f"❌ Güncelleme hatası: {e}"}
        
        # Exception log'u kaydet
        APILogger.log_operation(
            endpoint="/update_user",
            method="PUT",
            operation_type="user",
            user_id=user_id,
            domain_id=domain_id,
            request_data=user_data.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📌 Departmanları listeleme
@router.get("/list_departments")
def list_departments():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, department_name FROM departments ORDER BY department_name")
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

# 📌 Departman veri modeli
class DepartmentCreateRequest(BaseModel):
    department_name: str
    domain_id: int
    created_by: str

class DepartmentUpdateRequest(BaseModel):
    department_name: str

# 📌 Domain'e ait departmanları listeleme
@router.get("/list_departments_by_domain/{domain_id}", 
            summary="Domain'e Ait Departmanları Listele", 
            description="Belirli bir domain'e ait departmanları listeler")
def list_departments_by_domain(domain_id: int, user_id: Optional[str] = Query(None)):
    try:
        # Kullanıcının bu domain'e erişim yetkisi var mı kontrol et
        if user_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM domains WHERE id = %s AND created_by = %s",
                (domain_id, user_id)
            )
            count = cursor.fetchone()[0]
            conn.close()
            
            if count == 0:
                return {"success": False, "message": "❌ Bu domain'e erişim yetkiniz yok veya domain bulunamadı."}
        
        # Departmanları getir
        from db_ops import get_departments_by_domain
        
        departments = get_departments_by_domain(domain_id)
        
        department_list = [
            {
                "id": d[0],
                "name": d[1]
            }
            for d in departments
        ]
        
        return {"success": True, "departments": department_list}
    except Exception as e:
        print(f"❌ Departman listeleme hatası: {e}")
        return {"success": False, "message": f"❌ Departman listeleme hatası: {e}"}

# 📌 Departman ekleme
@router.post("/add_department", 
             summary="Yeni Departman Ekle",
             description="Belirli bir domain'e yeni departman ekler")
def add_department_endpoint(department: DepartmentCreateRequest):
    try:
        # Domain kontrolü
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM domains WHERE id = %s AND created_by = %s",
            (department.domain_id, department.created_by)
        )
        count = cursor.fetchone()[0]
        conn.close()
        
        if count == 0:
            return {"success": False, "message": "❌ Bu domain'e erişim yetkiniz yok veya domain bulunamadı."}
        
        # Departman ekleme
        from db_ops import add_department
        
        success, message, department_id = add_department(
            domain_id=department.domain_id,
            department_name=department.department_name,
            created_by=department.created_by
        )
        
        if success:
            response = {
                "success": True, 
                "message": message,
                "department": {
                    "id": department_id,
                    "name": department.department_name,
                    "domain_id": department.domain_id
                }
            }
            
            # Log kaydet
            APILogger.log_operation(
                endpoint="/add_department",
                method="POST",
                user_id=department.created_by,
                request_data=department.dict(),
                response_data=response,
                success=True
            )
            
            return response
        else:
            error_response = {"success": False, "message": message}
            
            # Hata log'u kaydet
            APILogger.log_operation(
                endpoint="/add_department",
                method="POST",
                user_id=department.created_by,
                request_data=department.dict(),
                response_data=error_response,
                success=False,
                error_message=message
            )
            
            return error_response
    except Exception as e:
        print(f"❌ Departman ekleme hatası: {e}")
        error_response = {"success": False, "message": f"❌ Departman ekleme hatası: {e}"}
        
        # Exception log'u kaydet
        APILogger.log_operation(
            endpoint="/add_department",
            method="POST",
            user_id=department.created_by,
            request_data=department.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📌 Departman güncelleme
@router.put("/update_department/{domain_id}/{department_id}", 
            summary="Departman Güncelle", 
            description="Belirli bir departmanın bilgilerini günceller")
def update_department_endpoint(domain_id: int, department_id: int, department: DepartmentUpdateRequest, 
                              user_id: Optional[str] = Query(None)):
    try:
        # Kullanıcının bu domain'e erişim yetkisi var mı kontrol et
        if user_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM domains WHERE id = %s AND created_by = %s",
                (domain_id, user_id)
            )
            count = cursor.fetchone()[0]
            conn.close()
            
            if count == 0:
                return {"success": False, "message": "❌ Bu domain'e erişim yetkiniz yok veya domain bulunamadı."}
        
        # Departman güncelleme
        from db_ops import update_department
        
        success, message = update_department(
            department_id=department_id,
            department_name=department.department_name,
            domain_id=domain_id
        )
        
        if success:
            response = {
                "success": True, 
                "message": message,
                "department": {
                    "id": department_id,
                    "name": department.department_name,
                    "domain_id": domain_id
                }
            }
            
            # Log kaydet
            APILogger.log_operation(
                endpoint="/update_department",
                method="PUT",
                user_id=user_id,
                request_data=department.dict(),
                response_data=response,
                success=True
            )
            
            return response
        else:
            error_response = {"success": False, "message": message}
            
            # Hata log'u kaydet
            APILogger.log_operation(
                endpoint="/update_department",
                method="PUT",
                user_id=user_id,
                request_data=department.dict(),
                response_data=error_response,
                success=False,
                error_message=message
            )
            
            return error_response
    except Exception as e:
        print(f"❌ Departman güncelleme hatası: {e}")
        error_response = {"success": False, "message": f"❌ Departman güncelleme hatası: {e}"}
        
        # Exception log'u kaydet
        APILogger.log_operation(
            endpoint="/update_department",
            method="PUT",
            user_id=user_id,
            request_data=department.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📌 Departman silme
@router.delete("/delete_department/{domain_id}/{department_id}", 
              summary="Departman Sil", 
              description="Belirli bir departmanı siler ve bağlı kullanıcıların departman bilgisini null yapar")
def delete_department_endpoint(domain_id: int, department_id: int, 
                             user_id: Optional[str] = Query(None)):
    try:
        # Kullanıcının bu domain'e erişim yetkisi var mı kontrol et
        if user_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM domains WHERE id = %s AND created_by = %s",
                (domain_id, user_id)
            )
            count = cursor.fetchone()[0]
            conn.close()
            
            if count == 0:
                return {"success": False, "message": "❌ Bu domain'e erişim yetkiniz yok veya domain bulunamadı."}
        
        # Departman silme
        from db_ops import delete_department
        
        success, message = delete_department(
            department_id=department_id,
            domain_id=domain_id
        )
        
        if success:
            response = {"success": True, "message": message}
            
            # Log kaydet
            APILogger.log_operation(
                endpoint="/delete_department",
                method="DELETE",
                user_id=user_id,
                request_data={"domain_id": domain_id, "department_id": department_id},
                response_data=response,
                success=True
            )
            
            return response
        else:
            error_response = {"success": False, "message": message}
            
            # Hata log'u kaydet
            APILogger.log_operation(
                endpoint="/delete_department",
                method="DELETE",
                user_id=user_id,
                request_data={"domain_id": domain_id, "department_id": department_id},
                response_data=error_response,
                success=False,
                error_message=message
            )
            
            return error_response
    except Exception as e:
        print(f"❌ Departman silme hatası: {e}")
        error_response = {"success": False, "message": f"❌ Departman silme hatası: {e}"}
        
        # Exception log'u kaydet
        APILogger.log_operation(
            endpoint="/delete_department",
            method="DELETE",
            user_id=user_id,
            request_data={"domain_id": domain_id, "department_id": department_id},
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📌 IP benzersizlik kontrol fonksiyonu
def check_user_ip_exists(domain_ip: str, created_by: str):
    """
    Belirli bir kullanıcının aynı IP ile domain'i olup olmadığını kontrol eder
    
    Args:
        domain_ip (str): Kontrol edilecek IP adresi
        created_by (str): Kullanıcı UUID'si
    
    Returns:
        bool: Aynı kullanıcının bu IP ile domain'i varsa True, yoksa False
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM domains WHERE domain_ip = %s AND created_by = %s",
            (domain_ip, created_by)
        )
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0
    except Exception as e:
        print(f"❌ IP kontrol hatası: {e}")
        return False
