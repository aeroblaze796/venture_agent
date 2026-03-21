from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pypdf
import docx
from pydantic import BaseModel
from app.auth import auth_router
from fastapi.staticfiles import StaticFiles
import os
import uuid
import shutil

app = FastAPI(
    title="VentureAgent API",
    description="VentureAgent MVP Backend API",
    version="0.1.0",
)

os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

# 配置 CORS，允许前端应用跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在 MVP 阶段为了方便本地调试允许所有 origin，生产环境需收紧
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

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
async def import_project_file(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None)
):
    content = ""
    filename = file.filename
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    upload_path = os.path.join("uploads", unique_filename)
    
    try:
        # 保存物理文件
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 重新打开提取文本
        if filename.endswith(".pdf"):
            with open(upload_path, "rb") as pdf_file:
                pdf_reader = pypdf.PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        content += text + "\n"
        elif filename.endswith(".docx"):
            with open(upload_path, "rb") as doc_file:
                doc = docx.Document(doc_file)
                for para in doc.paragraphs:
                    content += para.text + "\n"
        else:
            return {"error": "Unsupported file format. Please upload PDF or DOCX."}
            
        file_url = f"http://localhost:8000/api/uploads/{unique_filename}"
        
        # 如果携带了 project_id，自动绑定附件
        if project_id is not None:
            import sqlite3
            from app.database import DB_PATH
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("INSERT INTO project_files (project_id, filename, file_url) VALUES (?, ?, ?)",
                        (project_id, filename, file_url))
            conn.commit()
            conn.close()
            
    except Exception as e:
        return {"error": f"Failed to parse file: {str(e)}"}
    
    return {"text": content, "filename": filename, "file_url": file_url}

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

@app.post("/api/projects/{project_id}/review")
def review_project(project_id: int):
    import sqlite3
    from app.database import DB_PATH
    from app.agent.graph import get_llm
    from langchain_core.prompts import ChatPromptTemplate
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name, content, competition, track FROM projects WHERE id=?", (project_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {"review": "❌ 未找到对应项目，请确认项目是否已成功创建。"}
            
        proj_name, proj_content, competition, track = row
        content_preview = proj_content[:15000] if proj_content else "暂无正文内容"
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个资深的双创（创新创业）评委和导师。请你根据学生提交的项目内容，给出【真实、犀利、结构化】的深度评审与文案修改建议。\n\n"
                       "你的报告需要包括（必须使用标题分点）：\n"
                       "1. **核心逻辑评判**：评估想法的落地性和痛点真实性\n"
                       "2. **赛道与合规评估**：针对于比赛要求找寻盲点\n"
                       "3. **痛点与风险预警**：寻找可能存在的竞争风险与技术护城河缺陷\n"
                       "4. **AI 文案修改建议**：摘录部分原文，直接给出详细的「修改建议文案」\n\n"
                       "请使用 Markdown 格式输出，排版清晰大气，语气专业犀利，给出切实的指导意见。"),
            ("human", "项目名称：{proj_name}\n目标赛事：{competition} - {track}\n\n=== 计划书正文片段 ===\n{content_preview}\n====================\n\n请输出你的深度诊断评估与改写建议：")
        ])
        
        llm = get_llm()
        chain = prompt | llm
        result = chain.invoke({
            "proj_name": proj_name,
            "competition": competition,
            "track": track,
            "content_preview": content_preview
        })
        return {"review": result.content}
        
    except Exception as e:
        print(f"DeepSeek review failed: {e}")
        return {"review": f"⚠️ 诊断请求失败，请检查网络或 API_KEY 配置。详细错误：{str(e)}"}

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
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
