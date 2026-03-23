# VentureAgent 功能补齐与测试规约实现计划

经过对测试验收文档 [test_doc.txt](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/test_doc.txt) 与现有 `venture_agent` 代码库（`backend` 与 `frontend`）的细致对比，发现系统已经搭建了较好的基础架构（如 Router, A1/A2 Agent 雏形，基础的教师/学生/管理员前端视图等），但距离端到端严格测试标准的**结构化、图谱联动、防幻觉、以及多视角洞察**等要求仍有部分功能缺失。

以下是排查出的未实现功能映射以及逐步完成的开发计划清单。

## 🔍 当前未实现或需重点重构的功能点说明

1. **A1-3 知识图谱检索校验 (KG Baseline Retrieval)**: 当前 [learning_tutor_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#122-182) 完全依靠大模型通用知识回答，**缺失**连接 Neo4j 提取概念实体及打印 `retrieved_kg_nodes` 日志的能力。
2. **A2-1 结构化任务分配**: [project_coach_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#183-248) 当前直接输出非结构化文本，**缺少**严格的 `Pydantic` 结构化输出（必须包含 Project Stage, Diagnosis, Evidence Used, Impact, ONLY ONE Next Task 等字段）。
3. **A3 超图压力测试回路**: 当前 [tools.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/tools.py) 的检索过于扁平（单纯的 keyword 匹配）。**缺失**动态谬误识别（Fallacy Label）-> 异构超边筛选（Value_Loop_Edge / Risk_Pattern_Edge）-> 追问策略选择（selected_strategy）的闭环与底层日志打印。
4. **A4 规则诊断器增强**: [constraints.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/constraints.py) 当前仅有简单的正则关键字拦截。**缺失**系统的多维数据一致性推演（需准确捕获 D001 渠道错位、D002 合规缺口）。且输出结构**缺失** `rule_id`, `trigger_message` (要求原文引用 Quote), `impact`, `fix_task` 必填字段。
5. **A5 竞赛顾问智能体 (Competition Advisor)**: 代码中**目前完全缺失该 Agent**。当前的 [review_project](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py#443-465) 接口仅是一个简单的 Prompt 跑马观花。需要实现全 Rubric 覆盖打分（Estimated Score, Missing Evidence, Minimal Fix 24h/72h）以及赛事标准动态物理切换（A5-2）。
6. **A6-1 单项目详细批改**: [trigger_ai_audit](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py#604-674) 返回数据过于简单，**缺少** Evidence Trace 溯源证据链（引用原文）和长文本修订建议。
7. **A6-2 班级洞察视图动态化**: 目前 [get_teacher_dashboard](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py#531-603) 返回的 `top_mistakes` (如 H8) 和干预建议是**Hardcoded (硬编码)** 的。需要根据真实评估数据动态聚合。
8. **A6-4 对话历史能力画像评估**: **完全缺失**。需要新增接口，抓取特定学生最近 3 轮对话日志 (Battle Logs)，按五个维度打分并生成带原文证据的具体表现诊断。
9. **A7 安全兜底机制**: 缺乏专门检测乱码、越界输入与情绪化试探并在节点前置拦截拉回主题的逻辑。

---

## 🚀 逐步完成的开发计划清单 (Step-by-Step Checklist)

为了保证开发的高效性并降低系统回归风险，建议按以下四阶段开展补齐开发工作：

### 第一阶段：底层引擎与结构化输出重构 (Day 1-2)
*目标：满足 A1, A2, A4 的单点核心硬性约束*

- [ ] **Task 1.1 升级 A1 (Learning Tutor)**: 
  - 编写 `query_concept_from_neo4j` 工具函数，连接知识图谱提取概念实体。
  - 在 [learning_tutor_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#122-182) 中集成该工具，强制附带知识背景作答并使用 `print()` 打印 `retrieved_kg_nodes` 以满足测试可观测性要求。
- [ ] **Task 1.2 升级 A2 (Project Coach)**: 
  - 引入 `CoachResponse(BaseModel)`，强制定义 Project Stage, Current Diagnosis, Evidence Used, Impact, Next Task (包含 description/template/criteria)。
  - 修改 [project_coach_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#183-248) 使用 `with_structured_output`。
- [ ] **Task 1.3 强化 A4 规则引擎 ([constraints.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/constraints.py))**: 
  - 扩充并细化检查类（如 `CheckChannelMismatch`, `CheckCompliance`, `CheckUnitEcon`）。
  - 修改 [ConsistencyChecker](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/constraints.py#3-20) 的返回结构为 `[{"rule_id": "...", "trigger_message": "...(quote)...", "impact": "...", "fix_task": "..."}]`。

### 第二阶段：高级图谱与竞赛顾问研发 (Day 3-4)
*目标：攻克最复杂的 A3 超图链路与 A5 动态评分机制*

- [ ] **Task 2.1 打造 A3 超图压力链路 ([tools.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/tools.py) 重构)**: 
  - 实现一个智能分类器 `identify_fallacy`，识别出文本中的具体谬误（如”大数幻觉”、”隐形竞争缺失”）。
  - 根据谬误类型动态构造不同的 Cypher 查询语句向 Neo4j 请求指定的超边（Value Loop / Risk Pattern）。
  - 在终端明确打印 `fallacy_label`, `retrieved_heterogeneous_subgraph`, `selected_strategy`。
- [ ] **Task 2.2 新增 A5 Agent (Competition Advisor)**: 
  - 定义独立的 `CompetitionRubric` 评分结构。
  - 在 [main.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py) 的 `/api/projects/{project_id}/review` 接口下引入专门的 LangChain Agent 逻辑。
  - 编写根据传入字眼（如 "互联网+" / "挑战杯"）动态加载完全不同 Prompt 权重和 Rubric 评价维度的逻辑（A5-2）。
  - 确保返回中必须存在 Missing Evidence 与 Minimal Fix。

### 第三阶段：教师端洞察与教学自动化能力开发 (Day 5)
*目标：实现 A6 系列中真正依赖 AI 归纳统计的能力*

- [x] **Task 3.1 A6-1 后台批改能力扩展**: 
  - 修改 [trigger_ai_audit](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py#604-674)，要求 LLM 一并提取能够证明该项目低分的原始句子 (`Evidence Trace`)。
- [x] **Task 3.2 A6-2 班级洞察动态化 ([main.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py))**: 
  - 编写接口脚本梳理该老师名下所有 `project_assessments` 数据，动态统计最高频报错 Rule，动态生成 `top_mistakes` 及全局 `Suggested Teaching Interventions`。
  - 清理硬编码。
- [x] **Task 3.3 新增 A6-4 三轮对话画像生成接口**: 
  - 新建接口 `/api/teacher/projects/{project_id}/capability_profile`。
  - 读取 SQLite 表中最新的 3 轮交互 [messages](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/main.py#204-207)。
  - 发送给 LLM 进行按段剖析，归纳出5项维度得分以及第一、二、三轮的具体表现诊断（必须含对学生回答的 Quote 原话）。

### 第四阶段：稳健性与前端最终联调 (Day 6)
*目标：处理异常分支，完成盲测准备*

- [ ] **Task 4.1 引入 A7 安全路由策略**: 
  - 在 [router_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#64-89) 前或内设一道语义分类栏，判断是否属于情绪发泄、毫无建树的乱语（11111）或越狱命令。
  - 如果命中异常，直接降级走 fallback 回复（如：“未检测到有效的项目信息，请详细描述…”），保护核心 Graph 引擎防止 Crash。
- [ ] **Task 4.2 前后端全链路联调**: 
  - 使用预埋的 D001, D002, D003, D004 文本进行完整流程联调，确认前端日志展示正常。
  - 清理未完成的 UI TODO (如 [task_front.md](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/task_front.md) 中的 1.3 / 1.4 / 2.2 小节前端联动)。
