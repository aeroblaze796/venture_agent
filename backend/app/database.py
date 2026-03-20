import sqlite3
import os
from datetime import datetime

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), "venture.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. 项目表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. 截止日期 (DDL) 表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deadlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL, -- 格式: YYYY-MM-DD
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)
    
    # 3. 演进日志表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evolution_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        event TEXT NOT NULL,
        log_level TEXT DEFAULT 'info',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # 4. 会话 (Conversations) 表 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 5. 消息 (Messages) 表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL, -- 'user' or 'coach'
        agent TEXT,        -- Agent 名称 (如 项目教练)
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
    """)

    # 插入一些初始 Mock 数据
    cursor.execute("SELECT COUNT(*) FROM projects")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)", 
                       ("蘑菇基环保包装盒", "利用真菌菌丝体制作的生物可降解包装材料", "1120230571"))
        project_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO deadlines (project_id, title, due_date) VALUES (?, ?, ?)", 
                       (project_id, "完成项目立项", "2026-03-25"))
        cursor.execute("INSERT INTO deadlines (project_id, title, due_date) VALUES (?, ?, ?)", 
                       (project_id, "计划书初稿截止", "2026-03-31"))
        
        cursor.execute("INSERT INTO evolution_logs (project_id, event) VALUES (?, ?)", 
                       (project_id, "完成项目启动与初步调研"))
        
        # 初始会话数据
        conversation_id = "va_session_1120230571"
        cursor.execute("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)",
                       (conversation_id, "1120230571", "蘑菇基包装盒项目压测"))
        
        cursor.execute("INSERT INTO messages (conversation_id, role, agent, content) VALUES (?, ?, ?, ?)",
                       (conversation_id, "coach", "项目教练 Agent (A2)", "你好！我是你的项目教练。针对蘑菇基项目，我准备好了。"))

    conn.commit()
    conn.close()

def get_dashboard_data(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. 获取用户所有的项目
    cursor.execute("SELECT * FROM projects WHERE owner_id = ?", (user_id,))
    projects_rows = cursor.fetchall()
    
    if not projects_rows:
        conn.close()
        return None
    
    projects = [dict(p) for p in projects_rows]
    project_ids = [p['id'] for p in projects]
    placeholders = ','.join(['?'] * len(project_ids))
    
    # 2. 聚合这些项目下的所有 DDL
    cursor.execute(f"SELECT title, due_date FROM deadlines WHERE project_id IN ({placeholders})", project_ids)
    ddls = [dict(row) for row in cursor.fetchall()]
    
    # 3. 获取所有项目的演进日志
    cursor.execute(f"SELECT event, timestamp FROM evolution_logs WHERE project_id IN ({placeholders}) ORDER BY timestamp DESC", project_ids)
    logs = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return {
        "projects": projects,
        "deadlines": ddls,
        "evolution_logs": logs
    }

# --- 会话管理函数 ---

def get_conversations(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM conversations WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_conversation_messages(conv_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT role, agent, content as text FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC", (conv_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_message(conv_id: str, role: str, content: str, agent: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # 自动创建不存在的会话 (简单逻辑)
    cursor.execute("SELECT COUNT(*) FROM conversations WHERE id = ?", (conv_id,))
    exists = cursor.fetchone()[0] > 0
    
    if not exists:
        title = f"新对话 {datetime.now().strftime('%H:%M:%S')}"
        cursor.execute("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)",
                       (conv_id, "1120230571", title))
    
    cursor.execute("INSERT INTO messages (conversation_id, role, content, agent) VALUES (?, ?, ?, ?)",
                   (conv_id, role, content, agent))
    conn.commit()
    conn.close()

def create_conversation(conv_id: str, user_id: str, title: str, greeting: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)",
                   (conv_id, user_id, title))
    cursor.execute("INSERT INTO messages (conversation_id, role, content, agent) VALUES (?, ?, ?, ?)",
                   (conv_id, "coach", greeting, "系统助手"))
    conn.commit()
    conn.close()

def rename_conversation(conv_id: str, new_title: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE conversations SET title = ? WHERE id = ?", (new_title, conv_id))
    conn.commit()
    conn.close()

def delete_conversation(conv_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
