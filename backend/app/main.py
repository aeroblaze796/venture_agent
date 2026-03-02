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

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.get("/")
def read_root():
    return {"message": "Welcome to VentureAgent API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# 预留给后续 LangGraph 对接的简易聊天接口
@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    # 此处暂作 Mock 返回，后续将接入 LangGraph Router
    mock_reply = f"Mock Agent 收到你的消息: '{request.message}'。我目前还在搭建中。"
    return ChatResponse(reply=mock_reply)

if __name__ == "__main__":
    import uvicorn
    # 为了兼容本地直接运行 python main.py
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
