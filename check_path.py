import sys
import os

# 将 backend 路径添加到 python 路径
backend_path = r"c:\Users\86185\Desktop\test\venture_agent\backend"
sys.path.append(backend_path)

try:
    from app.database import DB_PATH
    print(f"DB_PATH resolved as: {DB_PATH}")
    print(f"Absolute path: {os.path.abspath(DB_PATH)}")
    print(f"File exists: {os.path.exists(DB_PATH)}")
    
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM projects")
    print(f"Projects count in this file: {cursor.fetchone()[0]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
