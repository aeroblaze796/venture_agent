from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from app.ingestion.db_config import db

auth_router = APIRouter()

class UserAuth(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    password: str
    school: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None

@auth_router.post("/register")
def register(user: UserRegister):
    if not user.username or not user.password:
        raise HTTPException(status_code=400, detail="用户名或密码不能为空")
    
    # 检查用户是否已存在
    check_query = "MATCH (u:User {username: $username}) RETURN u"
    existing_user = db.execute_query(check_query, {"username": user.username})
    
    if existing_user:
        raise HTTPException(status_code=400, detail="该用户名已被注册")
    
    # 创建新用户节点
    create_query = """
    CREATE (u:User {
        username: $username, 
        password: $password,
        school: $school,
        major: $major,
        grade: $grade,
        role: 'student',
        created_at: timestamp()
    })
    RETURN u.username AS username
    """
    params = {
        "username": user.username,
        "password": user.password,
        "school": user.school,
        "major": user.major,
        "grade": user.grade
    }
    
    try:
        db.execute_query(create_query, params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据库写入失败: {str(e)}")
        
    return {"message": "注册成功", "username": user.username}

@auth_router.post("/login")
def login(user: UserAuth):
    query = "MATCH (u:User {username: $username, password: $password}) RETURN u.username AS username, u.teacher_id AS teacher_id, u.role AS role"
    result = db.execute_query(query, {"username": user.username, "password": user.password})
    
    if not result:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    user_data = result[0]
    # MVP 直接将用户名作为 token
    return {
        "message": "登录成功", 
        "token": user_data["username"], 
        "username": user_data["username"],
        "teacher_id": user_data.get("teacher_id"),
        "role": user_data.get("role")
    }
