import sqlite3
import os

DB_PATH = "c:\\Users\\86185\\Desktop\\test\\venture_agent\\backend\\app\\venture.db"

def check():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Members Table ---")
    cursor.execute("SELECT id, project_id, name, student_id FROM members")
    for row in cursor.fetchall():
        print(dict(row))
    
    conn.close()

if __name__ == "__main__":
    check()
