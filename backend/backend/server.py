from fastapi import FastAPI
from pydantic import BaseModel
from user_ops import add_user, disable_user, delete_user, UserStatus, UserRole
from domain_api import router as domain_router
from log_system import APILogger
from typing import Optional

app = FastAPI()
app.include_router(domain_router)

# 👤 Kullanıcı oluşturma için gelen veri
class UserCreateRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str
    role_id: UserRole
    department_id: Optional[int] = None
    domain_id: int

class UserDisableRequest(BaseModel):
    username: str
    domain_id: int

class UserDeleteRequest(BaseModel):
    username: str
    domain_id: int

# 👇 Kullanıcı Ekleme
@app.post("/add_user")
def api_add_user(user: UserCreateRequest):
    try:
        success, status = add_user(
            domain_id=user.domain_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            password=user.password,
            role_id=user.role_id.value,  # Enum değerini tamsayıya dönüştür
            department_id=user.department_id
        )
        
        response = {"success": success, "status": status}
        
        # Log kaydet
        APILogger.log_operation(
            endpoint="/add_user",
            method="POST",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=response,
            success=success,
            error_message=None if success else status
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "status": f"Hata: {str(e)}"}
        
        # Hata log'u kaydet
        APILogger.log_operation(
            endpoint="/add_user",
            method="POST",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 👇 Kullanıcı Devre Dışı Bırak
@app.post("/disable_user")
def api_disable_user(user: UserDisableRequest):
    try:
        success, status_text = disable_user(user.domain_id, user.username, enable=False)
        response = {"success": success, "status": status_text}
        
        # Log kaydet
        APILogger.log_operation(
            endpoint="/disable_user",
            method="POST",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=response,
            success=success,
            error_message=None if success else status_text
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "status": f"Hata: {str(e)}"}
        
        APILogger.log_operation(
            endpoint="/disable_user",
            method="POST",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 👇 Kullanıcı Devreye Al
@app.post("/enable_user")
def api_enable_user(user: UserDisableRequest):
    try:
        success, status_text = disable_user(user.domain_id, user.username, enable=True)
        response = {"success": success, "status": status_text}
        
        # Log kaydet
        APILogger.log_operation(
            endpoint="/enable_user",
            method="POST",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=response,
            success=success,
            error_message=None if success else status_text
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "status": f"Hata: {str(e)}"}
        
        APILogger.log_operation(
            endpoint="/enable_user",
            method="POST",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 👇 Kullanıcı Sil
@app.delete("/delete_user")
def api_delete_user(user: UserDeleteRequest):
    try:
        success = delete_user(user.domain_id, user.username)
        response = {"success": success}
        
        # Log kaydet
        APILogger.log_operation(
            endpoint="/delete_user",
            method="DELETE",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=response,
            success=success,
            error_message=None if success else "Kullanıcı silinirken hata oluştu"
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "error": str(e)}
        
        APILogger.log_operation(
            endpoint="/delete_user",
            method="DELETE",
            operation_type="user",
            domain_id=user.domain_id,
            request_data=user.dict(),
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

from fastapi import Body, Query
from db_ops import get_db_connection

@app.post("/list_users_by_department")
def list_users_by_department(department: dict = Body(...)):
    try:
        department_id = department["department_id"]
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, first_name, last_name FROM users WHERE department_id = %s", (department_id,))
        users = cursor.fetchall()
        conn.close()

        response = {
            "success": True,
            "users": [
                {
                    "id": u[0],
                    "username": u[1],
                    "first_name": u[2],
                    "last_name": u[3]
                }
                for u in users
            ]
        }
        
        # Log kaydet
        APILogger.log_operation(
            endpoint="/list_users_by_department",
            method="POST",
            operation_type="user",
            request_data=department,
            response_data={"user_count": len(response["users"])},  # Sadece sayıyı logla
            success=True
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "message": f"Hata: {e}"}
        
        APILogger.log_operation(
            endpoint="/list_users_by_department",
            method="POST",
            operation_type="user",
            request_data=department,
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response

# 📊 Log görüntüleme endpoint'i (GET işlemi - loglanmaz)
@app.get("/api/logs")
def get_api_logs(
    user_id: Optional[str] = Query(None, description="Kullanıcı ID'si filtresi"),
    endpoint: Optional[str] = Query(None, description="Endpoint filtresi"),
    operation_type: Optional[str] = Query(None, description="İşlem türü filtresi (domain, user, department, login, other)"),
    limit: Optional[int] = Query(50, description="Maksimum kayıt sayısı"),
    offset: Optional[int] = Query(0, description="Kayıt başlangıç pozisyonu")
):
    """API log kayıtlarını getirir - Bu endpoint loglanmaz (GET işlemi)"""
    try:
        result = APILogger.get_logs(
            user_id=user_id,
            endpoint=endpoint,
            operation_type=operation_type,
            limit=limit,
            offset=offset
        )
        
        if result["success"]:
            return {
                "success": True,
                "logs": result["logs"],
                "total_count": result["total_count"],
                "limit": result["limit"],
                "offset": result["offset"]
            }
        else:
            return {"success": False, "message": result["message"]}
            
    except Exception as e:
        return {"success": False, "message": f"Log getirme hatası: {e}"}

# 🧪 Test endpoint'i (POST işlemi - loglanır)
@app.post("/api/test-log")
def test_log_endpoint():
    """Test amaçlı basit endpoint - log sistemi test için"""
    try:
        response = {
            "success": True,
            "message": "Test log kaydı oluşturuldu",
            "info": "Log kayıtlarını görmek için: GET /api/logs"
        }
        
        # Test log kaydı oluştur (POST işlemi olduğu için loglanır)
        APILogger.log_operation(
            endpoint="/api/test-log",
            method="POST",
            operation_type="other",
            user_id="test-user-123",
            request_data={"test": "Bu bir test kaydıdır"},
            response_data=response,
            success=True
        )
        
        return response
        
    except Exception as e:
        error_response = {"success": False, "message": f"Test hatası: {e}"}
        
        # Hata durumunda da logla
        APILogger.log_operation(
            endpoint="/api/test-log",
            method="POST",
            operation_type="other",
            user_id="test-user-123",
            response_data=error_response,
            success=False,
            error_message=str(e)
        )
        
        return error_response
