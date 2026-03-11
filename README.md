# VentureAgent Phase 1 知识底座建设 (Neo4j 与 数据萃取)

- [x] 环境搭建与拓展
  - [x] 在 [requirements.txt](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/requirements.txt) 中添加 Neo4j 和 LLM 提取所需的依赖包
  - [x] 在本地或 Docker 中启动 Neo4j 数据库实例
- [x] 数据本体定义 (Ontology Schema)
  - [x] 定义核心节点 (Project, Technology, Market 等) 模型
  - [x] 定义高阶超边 (Hyperedges) 数据结构与存储模式 (Hyperedge-as-a-Node)
- [x] 构建数据萃取脚本 (Data Ingestion)
  - [x] 编写 Python 脚本解析样本预料/案例
  - [x] 结合 LLM 实现结构化数据提取
- [x] Neo4j 数据库写入与测试
  - [x] 编写 Cypher 语句将萃取的数据成功导入图数据库
  - [x] 测试基础图查询连通性

# VentureAgent 补充任务：接入真实 LLM (DeepSeek)
- [x] 切换大语言模型架构
  - [x] 在 [backend/.env](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/.env) 中配置 DeepSeek API Key
  - [x] 修改 [extract.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/ingestion/extract.py)，将 Mock/OpenAI 逻辑替换为基于 DeepSeek API 的真实结构化提取
  - [x] 测试真实的案例抽取能力
- [x] 构建批量 PDF 商业计划书数据管道
  - [x] 引入 `pypdf` 依赖
  - [x] 编写 [extract_from_ppt.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/ingestion/extract_from_ppt.py)，实现真实 PDF 目录的遍历、文本加载与结构化抽取入库

# VentureAgent Phase 2: Agent 逻辑开发 任务清单
- [x] LangGraph 基础通信框架搭建 (Router)
  - [x] 定义全局状态数据结构 [AgentState](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#20-27)
  - [x] 构建负责意图分发的 `Router Node`
  - [x] 接入内存 Checkpointer 实现短时记忆持久化
- [x] 核心互动节点开发 (A1 & A2)
  - [x] 构建 `Tutor Node` (A1 学习辅导 Agent)
  - [x] 构建 `Coach Node` (A2 项目教练 Agent - 毒舌与逻辑粉碎机制)
- [x] RAG 与图谱安全护栏集成
  - [x] 将 Neo4j 图谱查询逻辑封装为 Langchain Tool
  - [x] 编写前置硬编码约束 (如 H4/H8 商业定律探测策略)
  - [x] 通过终端或 `/api/chat` 完成一次完整的带状态的长程对话测试

注意：目前暂时将记忆存入内存。每一次运行test_graph.py开启一个新的记忆，运行结束后自动释放；或者每一次通过终端开启后端，对应一个新的记忆，终止终端则释放。此外，neo4j中的数据能够检索到，但貌似没有融入LLM的回答中？