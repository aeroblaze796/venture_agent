# VentureAgent Phase 2: Agent 逻辑开发 实施计划

## 产品目标
在 Phase 1 (知识底座与数据抽取) 成功落盘后，我们需要进入系统最核心的大脑层建设——**Phase 2: Agent 逻辑开发**。
本阶段目标是基于 **LangGraph** 框架搭建多智能体协同网络，实现一个精确状态控制的路由中枢（Router）及数个专精的教育 Agent，彻底告别单体大模型的黑盒问答，提供具备记忆、路由流转与规范约束的专业双创教学体验。

## Proposed Changes (拟议变更)

### 1. LangGraph 基础通信框架搭建 (Graph State)
- **状态树设计 (State Management)**: 在 `backend/app/agent/` 中定义一套全局的数据结构（如 `AgentState`），用于在不同的节点间传递消息历史、当前节点定位、用户能力图谱评分以及从 Neo4j 检索出的关键依据。
- **持久化配置 (Checkpointer)**: 初期使用本地 Sqlite (在开发测试时) 或内存保存会话 Checkpoint，确保单次交互的时序控制流不被丢弃。

### 2. 构建核心智能体节点 (Agent Nodes)
根据 PRD 定义，我们将实现以下核心处理节点：
- **Router 路由中枢**: 负责接收用户的输入，根据意图 (判别是提问知识、需要商业模式压测、还是索取打分) 将交互引流至下方特定的 Agent。
- **A1 学习辅导 Agent (Tutor)**: 提供基础商业概念解释，并能下达具体的微任务指引。
- **A2 项目教练 Agent (Coach)**: 核心“毒舌”节点，结合 Neo4j 中查到的 `Risk_Pattern` 与 `Value_Loop`，执行苏格拉底式发问（不直接给答案而是追问缺陷）。

### 3. 数据层接入与安全护栏 (RAG & Constraints)
- **GraphRAG 接入**: 将我们在 Phase 1 中封装的 `db_config.py` 和抽取代码编排为 LangGraph 的工具节点（Tool Node），使得 Agent 可以在需要时去 Neo4j 中验证信息。
- **硬编码约束 (Constraints Engine)**: 尝试构建 `constraints.py` 将部分商业基础逻辑（如 H4 市场规模定律）硬编码为前置或后置校验器，拦截 LLM 的幻觉。

## Verification Plan (验证计划)

### 自动化/脚本验证
- 编写一小段模拟对话脚本，向系统的入口 Graph 发送连续三条对话，验证 `Router` 能否根据上下文正确切换至 `A1` 和 `A2`。

### 手动验证
- 使用 FastAPI 暴漏一个 `/api/chat` 的调试接口。
- 发送一条极具破绽的商业计划信息（例如“我们的产品没有竞争对手”），验证 `A2` 是否能顺利调取知识底层信息并进行压力测试反驳反馈。
