import os
from fastapi import FastAPI
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

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session_123"

class ChatResponse(BaseModel):
    reply: str

@app.get("/")
def read_root():
    return {"message": "Welcome to VentureAgent API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

from langchain_core.messages import HumanMessage
from app.agent.graph import app_graph

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    # 将用户的输入封装成 LangChain 认识的 Message
    input_message = HumanMessage(content=request.message)
    
    # 构造初始状态
    initial_state = {"messages": [input_message], "next_agent": ""}
    
    # 因为 LangGraph 配置了 checkpointer，必须携带 thread_id (对应该 session)
    config = {"configurable": {"thread_id": request.session_id}}
    
    # 执行图流转
    final_state = app_graph.invoke(initial_state, config=config)
    
    # 获取最后一条输出的消息
    messages = final_state.get("messages", [])
    if messages:
        # LangGraph 执行完成后，最后一条消息通常也就是 Agent 返回的回复
        final_reply = messages[-1].content
    else:
        final_reply = "抱歉，系统内部状态流转异常，未返回消息。"
        
    return ChatResponse(reply=final_reply)

if __name__ == "__main__":
    import uvicorn
    # 为了兼容本地直接运行 python main.py
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
