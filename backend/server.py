from fastapi import FastAPI
from pydantic import BaseModel
from user_ops import add_user, disable_user, delete_user, UserStatus, UserRole
from domain_api import router as domain_router
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
    success, status = add_user(
        domain_id=user.domain_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        password=user.password,
        role_id=user.role_id.value,  # Enum değerini tamsayıya dönüştür
        department_id=user.department_id
    )
    return {"success": success, "status": status}

# 👇 Kullanıcı Devre Dışı Bırak
@app.post("/disable_user")
def api_disable_user(user: UserDisableRequest):
    success, status_text = disable_user(user.domain_id, user.username, enable=False)
    return {"success": success, "status": status_text}

# 👇 Kullanıcı Devreye Al
@app.post("/enable_user")
def api_enable_user(user: UserDisableRequest):
    success, status_text = disable_user(user.domain_id, user.username, enable=True)
    return {"success": success, "status": status_text}

# 👇 Kullanıcı Sil
@app.delete("/delete_user")
def api_delete_user(user: UserDeleteRequest):
    success = delete_user(user.domain_id, user.username)
    return {"success": success}

from fastapi import Body
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

        return {
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
    except Exception as e:
        return {"success": False, "message": f"Hata: {e}"}
