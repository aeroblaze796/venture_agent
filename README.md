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

注意：当前已接入DeepSeek，但是目前对模拟数据进行抽取入库，还未使用真实数据！