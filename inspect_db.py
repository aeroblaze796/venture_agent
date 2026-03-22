import sqlite3
import os

db_path = r"c:\Users\86185\Desktop\test\venture_agent\backend\app\venture.db"

if not os.path.exists(db_path):
    print(f"ERROR: Database file not found at {db_path}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables in database: {[t[0] for t in tables]}")
        
        if ('projects',) in tables:
            cursor.execute("SELECT COUNT(*) FROM projects")
            count = cursor.fetchone()[0]
            print(f"Total projects in 'projects' table: {count}")
            
            cursor.execute("SELECT id, name, owner_id FROM projects LIMIT 5")
            rows = cursor.fetchall()
            for r in rows:
                print(f"Project: ID={r[0]}, Name={r[1]}, Owner={r[2]}")
        else:
            print("ERROR: 'projects' table not found!")
            
        conn.close()
    except Exception as e:
        print(f"Error reading database: {e}")
