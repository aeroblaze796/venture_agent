from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pypdf
import docx
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
async def import_project_file(file: UploadFile = File(...)):
    content = ""
    filename = file.filename
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
    
    return {"text": content, "filename": filename}

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
    # 此处未来可接入真正的 AI 评审逻辑
    review_text = """【VentureAgent AI 深度评审报告】

## 一、 核心价值评估 (Score: 88/100)
- **创新性 (优)**: 项目利用真菌菌丝体替代传统塑料，具有极强的环保属性和市场差异化。
- **商业模式 (良)**: 闭环逻辑清晰，但初期 B 端客户的获取成本 (CAC) 需进一步调研。

## 二、 赛道对齐建议
- **互联网+ 赛道**: 建议强化“科技成果转化”背景，突出实验室专利授权。
- **挑战杯 赛道**: 需增加更多的社会价值调研数据（如碳中和贡献度）。

## 三、 团队背景画像
- 成员涵盖算法、生物材料与市场策划，结构合理。建议增加一名财务背景成员负责投融资模型。

## 四、 综合改进指导
1. **风险控制**: 细化真菌培养过程中对温湿度的敏感性控制方案。
2. **市场推广**: 建议从高端化妆品外包装切入，利用长尾效应建立品牌认知。
"""
    return {"review": review_text}

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
