from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pypdf
import docx
import os
import shutil
import uuid
import sqlite3
import datetime
import asyncio
from typing import Optional, List
from pydantic import BaseModel

# 导入本地模块
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

from app.auth import auth_router
from app.database import (
    DB_PATH,
    init_db,
    migrate_db,
    get_dashboard_data, 
    get_conversations, 
    get_conversation_messages, 
    save_message,
    create_conversation,
    rename_conversation,
    delete_conversation
)
from langchain_core.messages import HumanMessage
from app.agent.graph import app_graph
from app.ingestion.db_config import db

app = FastAPI(
    title="VentureAgent API",
    description="VentureAgent MVP Backend API",
    version="0.1.0",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Models ---

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session_123"
    project_id: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    agent: str

class CreateConvRequest(BaseModel):
    id: str
    user_id: str
    title: str
    greeting: str

class RenameRequest(BaseModel):
    title: str

class MemberInfo(BaseModel):
    name: str
    student_id: Optional[str] = None
    role: str = "Member"
    position: Optional[str] = "队员"
    college: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None
    info: Optional[str] = None

class ProjectCreateRequest(BaseModel):
    name: str
    owner_id: str
    competition: Optional[str] = "互联网+"
    track: Optional[str] = None
    college: Optional[str] = None
    advisorName: Optional[str] = None
    advisorId: Optional[str] = None
    advisorInfo: Optional[str] = None
    content: Optional[str] = ""
    members: List[MemberInfo] = []

class CommitRequest(BaseModel):
    content: str
    author: Optional[str] = "System"

class ReviewRequest(BaseModel):
    rubric: str = "internet_plus"

class UpdateContentRequest(BaseModel):
    content: str

# --- Endpoints ---

@app.on_event("startup")
def on_startup():
    init_db()
    migrate_db()
    
    # 注入 Mock 教师用户到账户库 (方便用户直接登录测试)
    from app.ingestion.db_config import db
    try:
        # 使用 MERGE 确认 Mock 教师 ID
        db.execute_query("MERGE (u:User {username: '张老师'}) SET u.password = '123456', u.role = 'teacher', u.teacher_id = 'T001'")
        db.execute_query("MERGE (u:User {username: '王老师'}) SET u.password = '123456', u.role = 'teacher', u.teacher_id = 'T002'")
    except Exception as e:
        print(f"Mock Teacher Injection failed (Neo4j possibly down): {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to VentureAgent API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/sync/dashboard")
def sync_dashboard(user_id: str):
    data = get_dashboard_data(user_id)
    return data if data else {"projects": [], "deadlines": [], "evolution_logs": [], "members": []}

@app.get("/api/conversations")
def list_conversations(user_id: str):
    return get_conversations(user_id)

@app.get("/api/conversations/{conv_id}/messages")
def list_messages(conv_id: str):
    return get_conversation_messages(conv_id)

@app.post("/api/conversations")
def create_conv(request: CreateConvRequest):
    create_conversation(request.id, request.user_id, request.title, request.greeting)
    return {"status": "ok"}

@app.patch("/api/conversations/{conv_id}")
def rename_conv(conv_id: str, request: RenameRequest):
    rename_conversation(conv_id, request.title)
    return {"status": "ok"}

@app.delete("/api/conversations/{conv_id}")
def delete_conv(conv_id: str):
    delete_conversation(conv_id)
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    # --- 教师干预逻辑注入 ---
    final_input_content = request.message
    if request.project_id:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT content FROM teacher_interventions WHERE project_id = ? AND is_active = 1", (request.project_id,))
        interventions = cursor.fetchall()
        conn.close()
        if interventions:
            rules_text = " | ".join([row['content'] for row in interventions])
            # 将干预指令作为系统提示注入 (此处简单包裹在 HumanMessage 前面)
            final_input_content = f"【教师干预约束：{rules_text}】\n用户的实际消息：{request.message}"

    input_message = HumanMessage(content=final_input_content)
    initial_state = {"messages": [input_message], "next_agent": ""}
    config = {"configurable": {"thread_id": request.session_id}}
    
    save_message(request.session_id, "user", request.message)
    final_state = app_graph.invoke(initial_state, config=config)
    
    messages = final_state.get("messages", [])
    final_reply = messages[-1].content if messages else "抱歉，系统内部状态流转异常，未返回消息。"
    
    agent_id = final_state.get("next_agent", "unknown")
    agent_map = {
        "learning_tutor": "学习辅导 Agent (A1)",
        "project_coach": "项目教练 Agent (A2)",
        "unknown": "系统导师"
    }
    display_name = agent_map.get(agent_id, "系统导师")
    save_message(request.session_id, "coach", final_reply, display_name)
    return ChatResponse(reply=final_reply, agent=display_name)

@app.post("/api/projects")
def create_project_endpoint(project: ProjectCreateRequest):
    # 1. 组长必填性核验
    has_leader = any(m.role in ["Leader", "组长"] for m in project.members)
    if not has_leader:
        raise HTTPException(status_code=400, detail="项目必须包含至少一名组长（Leader/组长）")

    # 2. 指导老师实名核验 (Neo4j)
    if project.advisorName:
        # 判断真实姓名、工号、学院是否匹配
        verify_advisor_q = """
            MATCH (u:User {role: 'teacher', real_name: $name, username: $id, college: $college}) 
            RETURN u
        """
        advisor_res = db.execute_query(verify_advisor_q, {
            "name": project.advisorName, 
            "id": project.advisorId, 
            "college": project.college
        })
        if not advisor_res:
            raise HTTPException(status_code=400, detail=f"指导老师校验失败：无法在系统中找到名为 {project.advisorName}、工号为 {project.advisorId} 且属于 {project.college} 的已注册教师。")

    # 3. 团队成员实名核验 (Neo4j)
    for m in project.members:
        # 判断真实姓名、学号、学院、专业、年级是否匹配
        # 这里允许 m.college 为空则回退到项目所属学院
        verify_member_q = """
            MATCH (u:User {role: 'student', real_name: $name, username: $id, college: $college, major: $major, grade: $grade}) 
            RETURN u
        """
        member_res = db.execute_query(verify_member_q, {
            "name": m.name,
            "id": m.student_id,
            "college": m.college or project.college,
            "major": m.major,
            "grade": m.grade
        })
        if not member_res:
            raise HTTPException(status_code=400, detail=f"成员校验失败：名为 {m.name}、学号为 {m.student_id} 的同学未注册或填写的学院专业年级信息有误。")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projects (name, owner_id, competition, track, college, advisor_name, advisor_id, advisor_info, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (project.name, project.owner_id, project.competition, project.track, project.college, project.advisorName, project.advisorId, project.advisorInfo, project.content))
    project_id = cursor.lastrowid
    
    today = datetime.date.today()
    ddls = []
    if project.competition == "互联网+":
        ddls = [
            ("项目立项", today.strftime("%Y-%m-%d")),
            ("计划书初稿截止", (today + datetime.timedelta(days=14)).strftime("%Y-%m-%d")),
            ("商业模式深度复核", (today + datetime.timedelta(days=28)).strftime("%Y-%m-%d")),
            ("国赛/省赛网评截止", "2026-06-30")
        ]
    elif project.competition == "挑战杯":
        ddls = [
            ("技术方案定稿", (today + datetime.timedelta(days=10)).strftime("%Y-%m-%d")),
            ("实物模型演示", (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")),
            ("省赛申报截止", "2026-04-15")
        ]
    else:
        ddls = [
            ("项目启动", today.strftime("%Y-%m-%d")),
            ("中期进度汇报", (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")),
            ("结项验收", (today + datetime.timedelta(days=60)).strftime("%Y-%m-%d"))
        ]

    for title, d_date in ddls:
        cursor.execute("INSERT INTO deadlines (project_id, title, due_date) VALUES (?, ?, ?)", (project_id, title, d_date))
    
    cursor.execute("INSERT INTO evolution_logs (project_id, event) VALUES (?, ?)", (project_id, f"完成《{project.name}》初步申报入库"))
    
    if project.advisorName:
        cursor.execute("""
            INSERT INTO members (project_id, name, student_id, role, position, info, college)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (project_id, project.advisorName, project.advisorId, "Advisor", "指导老师", project.advisorInfo, project.college))

    for m in project.members:
        cursor.execute("""
            INSERT INTO members (project_id, name, student_id, college, major, grade, role, position, info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, m.name, m.student_id, m.college or project.college, m.major, m.grade, m.role, m.position, m.info))

    conn.commit()
    conn.close()
    return {"status": "ok", "project_id": project_id}

@app.post("/api/projects/import")
async def import_project_file(file: UploadFile = File(...), project_id: Optional[int] = Form(None)):
    content = ""
    filename = file.filename
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    upload_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file.file.seek(0)
    file_url = f"/api/uploads/{unique_filename}"
    try:
        if filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(file.file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text: content += text + "\n"
        elif filename.endswith(".docx"):
            from io import BytesIO
            doc = docx.Document(BytesIO(await file.read()))
            for para in doc.paragraphs: content += para.text + "\n"
        else:
            return {"error": "Unsupported file format. Please upload PDF or DOCX."}
    except Exception as e:
        return {"error": f"Failed to parse file: {str(e)}"}
    
    if project_id is not None:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("INSERT INTO project_files (project_id, filename, file_url) VALUES (?, ?, ?)", (project_id, filename, file_url))
        file_id = cur.lastrowid
        conn.commit()
        conn.close()
        # 自动触发一次后台审计 (异步化非阻塞)
        if project_id:
            try:
                import threading
                threading.Thread(target=lambda: asyncio.run(trigger_ai_audit(project_id)), daemon=True).start()
            except: pass

        return {"status": "ok", "text": content, "filename": filename, "file_id": file_id, "file_url": f"/api/uploads/{unique_filename}"}

@app.get("/api/projects/{project_id}/files")
def get_project_files(project_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, file_url FROM project_files WHERE project_id = ?", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/projects/{project_id}/files/{file_id}")
async def get_project_file_content(project_id: int, file_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, file_url FROM project_files WHERE id = ? AND project_id = ?", (file_id, project_id))
    row = cursor.fetchone()
    conn.close()
    if not row: return {"error": "File not found"}
    
    file_url = row["file_url"]
    filename = row["filename"]
    content = ""
    try:
        filename_part = file_url.split("/api/uploads/")[-1]
        physical_path = os.path.join(UPLOAD_DIR, filename_part)
        if filename.endswith(".pdf"):
            with open(physical_path, "rb") as f:
                pdf_reader = pypdf.PdfReader(f)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text: content += text + "\n"
        elif filename.endswith(".docx"):
            doc = docx.Document(physical_path)
            for para in doc.paragraphs: content += para.text + "\n"
        else:
            content = "Non-previewable file type."
    except Exception as e:
        content = f"Error reading file: {str(e)}"
    return {"id": file_id, "filename": filename, "content": content}

@app.delete("/api/project-files/{file_id}")
def delete_project_file(file_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM project_files WHERE id = ?", (file_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"error": "File not found"}
    file_url = row["file_url"]
    try:
        filename_part = file_url.split("/api/uploads/")[-1]
        physical_path = os.path.join(UPLOAD_DIR, filename_part)
        if os.path.exists(physical_path): os.remove(physical_path)
    except Exception: pass
    cursor.execute("DELETE FROM project_files WHERE id = ?", (file_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.post("/api/projects/{project_id}/commits")
def create_commit(project_id: int, request: CommitRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO project_commits (project_id, content, author) VALUES (?, ?, ?)", 
                   (project_id, request.content, request.author))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.post("/api/projects/{project_id}/review")
def review_project(project_id: int, request: ReviewRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, content FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if not row: return {"review": "项目未找到或正文为空。"}
    project_name, project_content = row
    if not project_content or len(project_content.strip()) < 10:
        return {"review": "项目正文内容太少，AI 无法进行深度评估。请先在编辑器中补充内容。"}

    try:
        from app.agent.graph import get_llm
        llm = get_llm()
        rubric_name = "互联网+ (中国国际大学生创新大赛)" if request.rubric == "internet_plus" else "挑战杯 (全国大学生课外学术科技作品竞赛)"
        system_prompt = f"""你是一个资深的创业项目评审专家，正在为参加“{rubric_name}”的学生提供深度点评。
        请针对以下项目计划书正文进行多维度的客观评价..."""
        response = llm.invoke([("system", system_prompt), ("human", f"项目：{project_name}\n内容：{project_content}")])
        return {"review": response.content}
    except Exception as e:
        return {"review": f"AI 评审服务暂时不可用 ({str(e)})。"}

@app.put("/api/projects/{project_id}/content")
def update_project_content(project_id: int, request: UpdateContentRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET content = ? WHERE id = ?", (request.content, project_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/projects/{project_id}")
def rename_project(project_id: int, request: RenameRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET name = ? WHERE id = ?", (request.title, project_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.delete("/api/projects/{project_id}")
def delete_project_endpoint(project_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM members WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM deadlines WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM evolution_logs WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM project_commits WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}

# --- 教师端 API 接口 ---

@app.get("/api/teacher/dashboard")
async def get_teacher_dashboard(teacher_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 获取名下所有项目及基础评估 (按 advisor_id 过滤)
    cursor.execute("""
        SELECT p.id, p.name as name, p.owner_id as leader, p.college, p.competition,
               pa.overall_risk as risk_level, pa.audit_summary
        FROM projects p
        LEFT JOIN project_assessments pa ON p.id = pa.project_id
        WHERE p.advisor_id = ?
    """, (teacher_id,))
    projects_rows = cursor.fetchall()
    projects = [dict(row) for row in projects_rows]
    
    # 统计辅导学生总数
    cursor.execute("""
        SELECT COUNT(DISTINCT m.student_id) as student_count
        FROM members m
        JOIN projects p ON m.project_id = p.id
        WHERE p.advisor_id = ? AND m.role != 'Advisor'
    """, (teacher_id,))
    student_count = cursor.fetchone()['student_count'] or 0
    
    # 统计高频错误 (基于 H 原则)
    # 此处为简化逻辑：从所有的总结中提取带有 H 的标签，或基于 mock
    top_mistakes = [
        {"name": "H8 单位经济不成立", "count": 2, "desc": "盈利预期缺乏数据支撑"},
        {"name": "H1 价值主张错位", "count": 1, "desc": "用户痛点定义过于模糊"},
        {"name": "H6 竞争壁垒薄弱", "count": 1, "desc": "容易被大厂快速复制"}
    ]
    
    conn.close()
    return {
        "projects": projects, 
        "stats": {
            "student_count": student_count,
            "project_count": len(projects),
            "high_risk_count": len([p for p in projects if p.get('risk_level') == 'High'])
        },
        "top_mistakes": top_mistakes
    }

@app.post("/api/teacher/projects/{project_id}/audit")
async def trigger_ai_audit(project_id: int):
    """
    触发 DeepSeek 深度审计：读取项目内容，生成 R1-R9 评分及 H 原则审计
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT name, content, competition FROM projects WHERE id = ?", (project_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        return {"error": "项目不存在"}
    
    try:
        from app.agent.graph import get_llm
        llm = get_llm()
        
        prompt = f"""你是一个资深的创业导师。请对以下项目进行深度评审。
        项目名称：{proj['name']}
        项目背景内容：{proj['content']}
        
        请严格按以下 JSON 格式输出评估结果（不要有其他文字）：
        {{
            "r1": 评分1-5, "r2": 评分1-5, "r3": 评分1-5, "r4": 评分1-5, "r5": 评分1-5,
            "r6": 评分1-5, "r7": 评分1-5, "r8": 评分1-5, "r9": 评分1-5,
            "overall_risk": "High"/"Medium"/"Low",
            "audit_summary": "一段100字以内的专业审计结论，包含 H 条义原则的冲突指出，例如 H8 或 H1"
        }}
        """
        
        response = llm.invoke(prompt)
        import json
        # 尝试解析 JSON
        raw_text = response.content.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        
        res_data = json.loads(raw_text)
        
        # 保存到数据库
        cursor.execute("""
            INSERT INTO project_assessments (project_id, r1_score, r2_score, r3_score, r4_score, r5_score, r6_score, r7_score, r8_score, r9_score, overall_risk, audit_summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(project_id) DO UPDATE SET
                r1_score=excluded.r1_score, r2_score=excluded.r2_score, 
                r3_score=excluded.r3_score, r4_score=excluded.r4_score,
                r5_score=excluded.r5_score, r6_score=excluded.r6_score,
                r7_score=excluded.r7_score, r8_score=excluded.r8_score,
                r9_score=excluded.r9_score, overall_risk=excluded.overall_risk,
                audit_summary=excluded.audit_summary
        """, (
            project_id, res_data.get('r1', 0), res_data.get('r2', 0), 
            res_data.get('r3', 0), res_data.get('r4', 0), res_data.get('r5', 0),
            res_data.get('r6', 0), res_data.get('r7', 0),
            res_data.get('r8', 0), res_data.get('r9', 0),
            res_data.get('overall_risk', 'Medium'), res_data.get('audit_summary', '')
        ))
        conn.commit()
    except Exception as e:
        print(f"Audit failed: {e}")
        return {"error": f"AI 审计失败: {str(e)}"}
    finally:
        conn.close()
    
    return {"status": "ok", "data": res_data}

@app.get("/api/teacher/projects/{project_id}")
async def get_teacher_project_detail(project_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if not row: return {"error": "Project not found"}
    project = dict(row)
    
    cursor.execute("SELECT * FROM project_assessments WHERE project_id = ?", (project_id,))
    pa_row = cursor.fetchone()
    assessment = dict(pa_row) if pa_row else {}
    
    cursor.execute("""
        SELECT role, agent, content as text, timestamp 
        FROM messages 
        WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)
        ORDER BY timestamp DESC LIMIT 6
    """, (project['owner_id'],))
    battle_logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"project": project, "assessment": assessment, "battle_logs": list(reversed(battle_logs))}

@app.post("/api/teacher/interventions")
async def create_teacher_intervention(project_id: int, teacher_name: str, content: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO teacher_interventions (project_id, teacher_name, content) VALUES (?, ?, ?)", (project_id, teacher_name, content))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "干预锦囊已下发"}

@app.get("/api/teacher/intervention-generator")
async def generate_teaching_plan(teacher_name: str):
    return {"plan": f"建议针对您名下的项目开展一次【商业模式一致性】专项辅导。"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
