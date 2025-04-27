from fastapi import FastAPI
from pydantic import BaseModel
from user_ops import add_user, disable_user, delete_user, get_ldap_connection
from db_ops import get_db_connection
import psycopg2

app = FastAPI()

class UserCreateRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str
    role_id: int
    department_id: int | None = None

class UserDisableRequest(BaseModel):
    username: str

class UserDeleteRequest(BaseModel):
    username: str

@app.post("/add_user")
def api_add_user(user: UserCreateRequest):
    conn_ldap = get_ldap_connection()
    success, status = add_user(
        conn_ldap,
        user.username,
        user.first_name,
        user.last_name,
        user.password,
        user.role_id,
        user.department_id
    )
    conn_ldap.unbind()
    return {"success": success, "status": status}

@app.post("/disable_user")
def api_disable_user(user: UserDisableRequest):
    conn_ldap = get_ldap_connection()
    success, status_text = disable_user(conn_ldap, user.username, enable=False)
    conn_ldap.unbind()
    return {"success": success, "status": status_text}

@app.post("/enable_user")
def api_enable_user(user: UserDisableRequest):
    conn_ldap = get_ldap_connection()
    success, status_text = disable_user(conn_ldap, user.username, enable=True)
    conn_ldap.unbind()
    return {"success": success, "status": status_text}

@app.delete("/delete_user")
def api_delete_user(user: UserDeleteRequest):
    conn_ldap = get_ldap_connection()
    success = delete_user(conn_ldap, user.username)
    conn_ldap.unbind()
    return {"success": success}