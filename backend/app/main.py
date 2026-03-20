import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

from typing import Optional

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
    get_dashboard_data, 
    get_conversations, 
    get_conversation_messages, 
    save_message,
    create_conversation,
    rename_conversation,
    delete_conversation
)

@app.get("/api/sync/dashboard")
def sync_dashboard(user_id: str):
    data = get_dashboard_data(user_id)
    if not data:
        return {"project": None, "deadlines": [], "evolution_logs": []}
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

if __name__ == "__main__":
    import uvicorn
    # 确保从 backend 根目录启动时能正确加载模块
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
