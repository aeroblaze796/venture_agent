# VentureAgent MVP 开发任务清单

- [x] 后端基础框架搭建 (FastAPI)
  - [x] 编写 [requirements.txt](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/requirements.txt) 并安装依赖
  - [x] 创建 [backend/app/main.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py) 入口文件
  - [x] 实现跨域请求 (CORS) 与基础路由
- [ ] 核心智能体编排 (LangGraph)
  - [ ] 创建简易 Router 逻辑
  - [ ] 实现基础对话节点 (Mock 学习辅导 Agent)
  - [ ] 将 LangGraph 集成至 FastAPI 接口
- [ ] 前端基础页面搭建 (React + Ant Design)
  - [ ] 初始化 React 工程
  - [ ] 配置 Ant Design
  - [ ] 实现简易聊天交互界面 (聊天框、消息历史)
  - [ ] 对接后端聊天 API
- [ ] 运行与调试
  - [ ] 确保前后端可以顺畅连通并进行基础对话
