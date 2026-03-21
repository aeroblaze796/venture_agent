from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pypdf
import docx
import os
import shutil
import uuid
from pydantic import BaseModel
from app.auth import auth_router
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="VentureAgent API",
    description="VentureAgent MVP Backend API",
    version="0.1.0",
)

# 配置 CORS，允许前端应用跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在 MVP 阶段为了方便本地调试允许所有 origin，生产环境需收紧
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session_123"

class ChatResponse(BaseModel):
    reply: str
    agent: str

@app.get("/")
def read_root():
    return {"message": "Welcome to VentureAgent API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

from langchain_core.messages import HumanMessage
from app.agent.graph import app_graph
from app.database import (
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

@app.on_event("startup")
def on_startup():
    init_db()     # 确保基础表存在
    migrate_db()  # 执行字段平滑迁移

@app.get("/api/sync/dashboard")
def sync_dashboard(user_id: str):
    data = get_dashboard_data(user_id)
    if not data:
        return {
            "projects": [],
            "deadlines": [],
            "evolution_logs": [],
            "members": []
        }
    return data

@app.get("/api/conversations")
def list_conversations(user_id: str):
    return get_conversations(user_id)

@app.get("/api/conversations/{conv_id}/messages")
def list_messages(conv_id: str):
    return get_conversation_messages(conv_id)

class CreateConvRequest(BaseModel):
    id: str
    user_id: str
    title: str
    greeting: str

@app.post("/api/conversations")
def create_conv(request: CreateConvRequest):
    create_conversation(request.id, request.user_id, request.title, request.greeting)
    return {"status": "ok"}

class RenameRequest(BaseModel):
    title: str

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
    # 将用户的输入封装成 LangChain 认识的 Message
    input_message = HumanMessage(content=request.message)
    
    # 构造初始状态
    initial_state = {"messages": [input_message], "next_agent": ""}
    
    # 因为 LangGraph 配置了 checkpointer，必须携带 thread_id (对应该 session)
    config = {"configurable": {"thread_id": request.session_id}}
    
    # 保存用户消息
    save_message(request.session_id, "user", request.message)
    
    # 执行图流转
    final_state = app_graph.invoke(initial_state, config=config)
    
    # 获取最后一条输出的消息
    messages = final_state.get("messages", [])
    if messages:
        # LangGraph 执行完成后，最后一条消息通常也就是 Agent 返回的回复
        final_reply = messages[-1].content
    else:
        final_reply = "抱歉，系统内部状态流转异常，未返回消息。"
    
    # 提取实际执行的 Agent 名称 (在 MVP 逻辑中，next_agent 在 router 节点后被设置)
    # 我们映射一下友好名称
    agent_id = final_state.get("next_agent", "unknown")
    agent_map = {
        "learning_tutor": "学习辅导 Agent (A1)",
        "project_coach": "项目教练 Agent (A2)",
        "unknown": "系统导师"
    }
    display_name = agent_map.get(agent_id, "系统导师")
    
    # 保存 AI 消息
    save_message(request.session_id, "coach", final_reply, display_name)
        
    return ChatResponse(reply=final_reply, agent=display_name)

# --- 项目管理 API (Phase 4 & 5) ---

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
    advisorInfo: Optional[str] = None
    content: Optional[str] = ""
    members: List[MemberInfo] = []

@app.post("/api/projects")
def create_project_endpoint(project: ProjectCreateRequest):
    from app.database import DB_PATH
    import sqlite3
    import datetime
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. 插入项目
    cursor.execute("""
        INSERT INTO projects (name, owner_id, competition, track, college, advisor_name, advisor_info, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (project.name, project.owner_id, project.competition, project.track, project.college, project.advisorName, project.advisorInfo, project.content))
    
    project_id = cursor.lastrowid
    
    # 2. 自动生成一些 DDL (根据比赛类型)
    today = datetime.date.today()
    ddls = []
    if project.competition == "互联网+":
        ddls = [
            ("项目立项", (today + datetime.timedelta(days=0)).strftime("%Y-%m-%d")),
            ("计划书初稿截止", (today + datetime.timedelta(days=14)).strftime("%Y-%m-%d")),
            ("商业模式深度复核", (today + datetime.timedelta(days=28)).strftime("%Y-%m-%d")),
            ("国赛/省赛网评截止", "2026-06-30") # 假设固定时间
        ]
    elif project.competition == "挑战杯":
        ddls = [
            ("技术方案定稿", (today + datetime.timedelta(days=10)).strftime("%Y-%m-%d")),
            ("实物模型演示", (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")),
            ("省赛申报截止", "2026-04-15") # 假设固定时间
        ]
    else:
        ddls = [
            ("项目启动", (today + datetime.timedelta(days=0)).strftime("%Y-%m-%d")),
            ("中期进度汇报", (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")),
            ("结项验收", (today + datetime.timedelta(days=60)).strftime("%Y-%m-%d"))
        ]

    for title, d_date in ddls:
        cursor.execute("INSERT INTO deadlines (project_id, title, due_date) VALUES (?, ?, ?)",
                       (project_id, title, d_date))
    
    # 3. 记录演进日志
    cursor.execute("INSERT INTO evolution_logs (project_id, event) VALUES (?, ?)",
                   (project_id, f"完成《{project.name}》初步申报入库"))
    
    # 4. 插入成员 (同时自动插入指导老师作为特殊成员以便同步显示)
    if project.advisorName:
        cursor.execute("""
            INSERT INTO members (project_id, name, role, position, info, college)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (project_id, project.advisorName, "Advisor", "指导老师", project.advisorInfo, project.college))

    for m in project.members:
        cursor.execute("""
            INSERT INTO members (project_id, name, student_id, college, major, grade, role, position, info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, m.name, m.student_id, m.college, m.major, m.grade, m.role, m.position, m.info))

    conn.commit()
    conn.close()
    return {"status": "ok", "project_id": project_id}

@app.post("/api/projects/import")
async def import_project_file(file: UploadFile = File(...), project_id: Optional[int] = Form(None)):
    content = ""
    filename = file.filename
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    upload_path = os.path.join("uploads", unique_filename)
    
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file.file.seek(0)
    
    file_url = f"http://localhost:8000/api/uploads/{unique_filename}"
    try:
        if filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(file.file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n"
        elif filename.endswith(".docx"):
            from io import BytesIO
            doc = docx.Document(BytesIO(await file.read()))
            for para in doc.paragraphs:
                content += para.text + "\n"
        else:
            return {"error": "Unsupported file format. Please upload PDF or DOCX."}
    except Exception as e:
        return {"error": f"Failed to parse file: {str(e)}"}
    
    if project_id is not None:
        import sqlite3
        from app.database import DB_PATH
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("INSERT INTO project_files (project_id, filename, file_url) VALUES (?, ?, ?)",
                    (project_id, filename, file_url))
        conn.commit()
        conn.close()
        
    return {"text": content, "filename": filename, "file_url": file_url}

@app.delete("/api/project-files/{file_id}")
def delete_project_file(file_id: int):
    import sqlite3
    from app.database import DB_PATH
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
        physical_path = os.path.join("uploads", filename_part)
        if os.path.exists(physical_path):
            os.remove(physical_path)
    except Exception:
        pass
    
    cursor.execute("DELETE FROM project_files WHERE id = ?", (file_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

class CommitRequest(BaseModel):
    content: str
    author: Optional[str] = "System"

@app.post("/api/projects/{project_id}/commits")
def create_commit(project_id: int, request: CommitRequest):
    from app.database import DB_PATH
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO project_commits (project_id, content, author) VALUES (?, ?, ?)", 
                   (project_id, request.content, request.author))
    conn.commit()
    conn.close()
    return {"status": "ok"}

class ReviewRequest(BaseModel):
    rubric: str = "internet_plus"


@app.post("/api/projects/{project_id}/review")
def review_project(project_id: int, request: ReviewRequest):
    from app.database import DB_PATH
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, content FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"review": "项目未找到或正文为空。"}
    
    project_name, project_content = row
    if not project_content or len(project_content.strip()) < 10:
        return {"review": "项目正文内容太少，AI 无法进行深度评估。请先在编辑器中补充内容。"}

    try:
        from app.agent.graph import get_llm
        llm = get_llm()
        
        rubric_name = "互联网+ (中国国际大学生创新大赛)" if request.rubric == "internet_plus" else "挑战杯 (全国大学生课外学术科技作品竞赛)"
        
        system_prompt = f"""你是一个资深的创业项目评审专家，正在为参加“{rubric_name}”的学生提供深度点评。
        请针对以下项目计划书正文进行多维度的客观评价，并给出改进建议。
        要求：
        1. 语言专业、犀利且富有启发性。
        2. 使用 Markdown 格式输出。
        3. 必须包含：## 一、核心价值评估（带评分）、## 二、赛道对齐建议、## 三、风险与改进提示。
        4. 输出内容应真实、具体，不要只说空话。
        5. 在报告最后，换行后强制附带以下文案：
        ---
        ⚠️ **免责标识**：以上内容由 Venture Agent AI 自动生成，仅供启发与参考，不代表官方赛事评审结果或录取承诺。
        """
        user_prompt = f"项目名称：{project_name}\n\n项目正文：\n{project_content}"
        
        response = llm.invoke([
            ("system", system_prompt),
            ("human", user_prompt)
        ])
        return {"review": response.content}
    except Exception as e:
        print(f"AI Review Error: {e}")
        return {"review": f"AI 评审服务暂时不可用 ({str(e)})。请确保后台 .env 中已配置 DEEPSEEK_API_KEY。"}

class UpdateContentRequest(BaseModel):
    content: str

@app.put("/api/projects/{project_id}/content")
def update_project_content(project_id: int, request: UpdateContentRequest):
    from app.database import DB_PATH
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET content = ? WHERE id = ?", (request.content, project_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/projects/{project_id}")
def rename_project(project_id: int, request: RenameRequest):
    from app.database import DB_PATH
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET name = ? WHERE id = ?", (request.title, project_id))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.delete("/api/projects/{project_id}")
def delete_project_endpoint(project_id: int):
    from app.database import DB_PATH
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # 级联删除所有关联数据
    cursor.execute("DELETE FROM members WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM deadlines WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM evolution_logs WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM project_commits WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # 确保从 backend 根目录启动时能正确加载模块
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
