# VentureAgent 创新创业智能体完善与补全计划 (Phase 3)

## 目标概述
经过对比《创新创业智能体测试文档.docx》与当前 `venture_agent` 代码库的实现情况，目前系统已实现 **Phase 2** 的基础多智能体通信框架（Router）以及 A1 (Learning Tutor) 和 A2 (Project Coach) 的初步逻辑，并接入了初步的约束引擎和 Neo4j 图查询（GraphRAG）。但距离测试文档的验收标准，仍缺失诸多高级智能体、教师端统计以及结构化输出要求。

本计划将拆解所有未实现或未达标的功能，并提供逐步完成的 Roadmap。

---

## 1. 已实现与未实现功能对比清单

### ✅ 已实现或初步实现
- **A1 学习辅导智能体 (Learning Tutor)**: 基础路由和问答已跑通。
- **A2 项目教练智能体 (Project Coach)**: 已支持防代写、苏格拉底式发问、接入Neo4j查询。
- **基础通信中枢 (Router & Graph)**: LangGraph 主流程建立，支持意图分发。
- **Neo4j/知识图谱基础 (GraphRAG)**: 已能提取关键词并在Neo4j检索（对应A3的部分底层能力）。
- **规则诊断器初版 (Constraints Engine)**: 已有 [constraints.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/constraints.py) 能做简单的规则拦截（对应A4基础）。

### ❌ 尚未实现或未达标 (Unimplemented / Incomplete)
1. **A1-1 结构化输出强校验**: A1输出必须严格包含 6 大字段（Definition, Example, Common Mistakes, Practice Task等），且任务必须为1个。
2. **A3 谬误识别与超图关联日志**: 现有RAG查询较为简单，未实现对超边（Value_Loop_Edge / Risk_Pattern_Edge）的准确结构化调用与策略库选取生成（需在日志强打印）。
3. **A4 规则诊断器深度对齐**: 需将 [constraints.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/constraints.py) 补充完整以覆盖测试画像中的漏洞（如 ChannelMismatch, UnitEconFail），严格输出 `rule_id, trigger_message, impact, fix_task`。
4. **A5 竞赛顾问智能体 (Competition Advisor)**: 完全未开发。包括结构化 Rubric 逐项评分（A5-1）以及依据赛事命令动态切换权重与侧重点（A5-2）。此节点需加入 LangGraph 路由。
5. **A6 教师批改与助手端 (Assessment & Instructor Assistant)**: 完全未开发。包括单项目批改（A6-1）、班级数据汇总洞察（A6-2）、教师反向干预规则配置（A6-3）、多轮对话日志画像提取打分（A6-4）以及系统管理员越权拦截与大盘（A6-5）。
6. **A7 安全与兜底测试**: 应对乱码、越狱Prompt的情绪化安抚与拉回。

---

## 2. 逐步完成计划清单 (Step-by-Step Implementation Plan)

为了稳步通过所有测试用例（A1.1验收标准），建议按以下 **4个冲刺阶段 (Sprints)** 逐步推进：

### 阶段一：完善学生端核心体验及诊断 (A1, A3, A4 对齐)
> **目标**：让单点对话体验无懈可击，诊断精准且不产生幻觉（能完美通过 D001-D004 画像对话）。
- **步骤 1.1 (已完成)**: 更新 [learning_tutor_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#93-126) 提示词，通过结构化输出（Structured Output）强制保障输出 6 大字段，并在逻辑层 `count("Practice Task") == 1`。
- **步骤 1.2**: 升级 [constraints.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/constraints.py) (A4 Rule Checker)，增加针对 D001（无人机农村配送：渠道错位、单位经济差）、D002（木雕盲盒出海：合规缺口、资源脱节）的特定规则匹配逻辑，规范输出为 JSON 格式 `[rule_id, trigger_message, impact, fix_task]`。
- **步骤 1.3**: 重构 [tools.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/tools.py) 的图谱查询能力 (A3)。在查询 Neo4j 时，支持异构检索并在 `print()` 日志中显示 `retrieved_heterogeneous_subgraph`，建立多套压测策略问答模版。

### 阶段二：开发竞赛顾问与动态评分 (A5)
> **目标**：实现严厉的虚拟评委打分制，并支持基于赛事类型（互联网+ vs 挑战杯）动态切换视角。
- **步骤 2.1**: 在 [agent/graph.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py) 中新注册 `competition_advisor_node`，并在 Router 中增加判别此意图的逻辑。
- **步骤 2.2**: 建立 `rubrics.py`，内置 10+ 项底层评分维度标准。
- **步骤 2.3**: 研发 **赛事动态权重切换引擎**，通过识别用户指令中的赛事关键字，为 LLM 注入不同的 Weight 配置与系统提示词组合。
- **步骤 2.4**: 通过 Pydantic 约束 `competition_advisor_node` 的返回结构，确保每个指标项都有 `Estimated Score`, `Missing Evidence`, `24h Fix` 和 `72h Fix`。

### 阶段三：开发教师端统计与管理功能 (A6 后台建设)
> **目标**：走出单体对话，赋能教师管控与大班级数据洞察视角。
- **步骤 3.1**: 构建 `/api/instructor/evaluate` 接口 (A6-1)，利用已有的 A5 评分逻辑，生成面向老师的评审附注（Review Notes）及证据链（Evidence Trace）。
- **步骤 3.2**: 构建班级图谱统计接口 `/api/instructor/class_insight` (A6-2)，将收集的各项目 JSON 数据做聚合，计算 Top 5 Mistakes 及点亮率。
- **步骤 3.3**: 在后端鉴权模块（如 [auth.py](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/auth.py)）增加 RBAC 权限系统 (A6-5)，区分 `student`, `instructor`, `admin`。编写拦截中间件，提供全局统计 Dashboard API。
- **步骤 3.4**: 建立并打通 **动态对话能力画像分析逻辑 (A6-4)**，通过拉取 Checkpointer（Sqlite/Memory）中的最近 N 轮历史记录，交由 LLM 生成五维雷达图数据与具体引用的溯源评价。
- **步骤 3.5**: 增加教师端动态规则配置表，支持将干预逻辑下发，合并至 A2 发问的 Context 中 (A6-3)。

### 阶段四：安全兜底护栏与端到端闭环测试 (A7, A8)
> **目标**：查漏补缺，防御恶意注入，跑通整体验收。
- **步骤 4.1**: 在 LangGraph [router_node](file:///e:/%E5%A4%A7%E4%B8%89%E4%B8%8B/%E5%A4%A7%E6%95%B0%E6%8D%AE%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%E6%A8%A1%E5%9D%97/venture_agent/backend/app/agent/graph.py#64-89) 的前端或入口处，增加 `input_sanitization`。应对恶意越狱指令与纯乱码，强制输出兜底话术 (A7)。
- **步骤 4.2**: 对整个链路生成的所有涉及策略、预测的信息结果自动在末尾拼接：“AI生成，仅供参考”免责条款。
- **步骤 4.3**: 使用 D001-D005 测试库进行全自动化冒烟脚本测试，验证 100% 满足测试用例文档的验收要求。准备好迎接 D006/D007 盲测。

---

## 接下来该做什么？
你可以根据这份计划清单，告诉我先从哪一步开始实施。推荐从 **阶段一（A1, A3, A4 对齐）** 开始，对现有逻辑进行强化和改造！
