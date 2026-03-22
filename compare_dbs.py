import sqlite3
import os

paths = [
    r"c:\Users\86185\Desktop\test\venture_agent\backend\app\venture.db",
    r"c:\Users\86185\Desktop\test\venture_agent\backend\venture.db"
]

for p in paths:
    print(f"\n--- Checking {p} ---")
    if not os.path.exists(p):
        print("Does not exist.")
        continue
    try:
        conn = sqlite3.connect(p)
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) FROM projects")
        print(f"Projects: {cursor.fetchone()[0]}")
        cursor.execute("SELECT id, name FROM projects LIMIT 3")
        for r in cursor.fetchall():
            print(f" - {r}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
