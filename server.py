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

from db_ops import get_users_by_department, get_users_by_role

class DepartmentFilterRequest(BaseModel):
    department_id: int

class RoleFilterRequest(BaseModel):
    role_id: int

@app.post("/list_users_by_department")
def api_list_users_by_department(filter: DepartmentFilterRequest):
    users = get_users_by_department(filter.department_id)
    user_list = []
    for user in users:
        user_list.append({
            "id": user[0],
            "username": user[1],
            "first_name": user[2],
            "last_name": user[3],
            "role_id": user[4],
            "department_id": user[5],
            "status": user[6]
        })
    return {"users": user_list}

@app.post("/list_users_by_role")
def api_list_users_by_role(filter: RoleFilterRequest):
    users = get_users_by_role(filter.role_id)
    user_list = []
    for user in users:
        user_list.append({
            "id": user[0],
            "username": user[1],
            "first_name": user[2],
            "last_name": user[3],
            "role_id": user[4],
            "department_id": user[5],
            "status": user[6]
        })
    return {"users": user_list}
