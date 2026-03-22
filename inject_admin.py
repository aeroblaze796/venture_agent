import sys
import os

# 将 backend 路径添加到 python 路径
backend_path = r"c:\Users\86185\Desktop\test\venture_agent\backend"
sys.path.append(backend_path)

try:
    from app.ingestion.db_config import db
    
    # 注入账号
    query = "MERGE (u:User {username: '001'}) SET u.password = '123456', u.role = 'admin', u.real_name = '管理员001', u.college = '系统维护部' RETURN u.username"
    result = db.execute_query(query)
    
    if result:
        print(f"Successfully injected admin user: {result[0]['u.username']}")
    else:
        print("Injection failed or user already exists with different properties.")
        
except Exception as e:
    print(f"Error during injection: {e}")
