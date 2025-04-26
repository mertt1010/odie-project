from fastapi import FastAPI
from pydantic import BaseModel
from user_ops import add_user, disable_user, delete_user, get_ldap_connection
from db_ops import get_db_connection

app = FastAPI()

class UserCreateRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str
    role_id: int
    department_id: int | None = None

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


class UserDisableRequest(BaseModel):
    username: str

@app.post("/disable_user")
def api_disable_user(user: UserDisableRequest):
    conn_ldap = get_ldap_connection()
    success, status_text = disable_user(conn_ldap, user.username, enable=False)
    conn_ldap.unbind()
    return {"success": success, "status": status_text}

