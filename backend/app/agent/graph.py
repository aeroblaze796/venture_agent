import os
from typing import Annotated, TypedDict, Any, Literal, cast
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, SecretStr
from app.agent.constraints import constraints_engine
from app.agent.tools import query_neo4j_for_projects

# 读取环境变量
load_dotenv()

# -----------------------------------------------------------------------------
# 1. 定义全局状态数据结构 (AgentState)
# -----------------------------------------------------------------------------
class AgentState(TypedDict, total=False):
    # messages 列表中保存对话历史，add_messages 会自动追加新消息而不是覆盖
    messages: Annotated[list[BaseMessage], add_messages]
    # 当前激活的专业 Agent（用于跨节点传递状态）
    next_agent: str
    # 前端显式指定的目标 Agent；若存在则跳过自动意图识别
    forced_agent: str
    # 额外存储的上下文或能力评分缓存
    context: dict[str, Any]

# -----------------------------------------------------------------------------
# 辅助函数：获取统一的 DeepSeek 大模型实例
# -----------------------------------------------------------------------------
def get_llm():
    import httpx
    raw_api_key = os.getenv("DEEPSEEK_API_KEY")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    if not raw_api_key or raw_api_key == "your_key_here":
        raise ValueError("请在 backend/.env 中配置有效的 DEEPSEEK_API_KEY")
    
    # 获取环境变量中的代理（考虑到部分用户不用 TUN 模式而是系统代理）
    proxy_url = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY") or os.getenv("https_proxy") or os.getenv("http_proxy")
    
    # 兼容 TUN 模式：TUN 模式在网卡层接管流量，为防止 urllib/httpx 误读残留的失效 proxy 变量
    # 如果代理变量为空，设置 trust_env=False 强制走直连网卡（即被 TUN 接管）
    if proxy_url:
        http_client = httpx.Client(proxy=proxy_url)
    else:
        http_client = httpx.Client(trust_env=False)
    
    return ChatOpenAI(
        model="deepseek-chat",
        api_key=SecretStr(raw_api_key),
        base_url=base_url,
        temperature=0, # 路由等任务需要确定性
        http_client=http_client,
    )

# -----------------------------------------------------------------------------
# 2. 构建负责意图分发的 Router Node
# -----------------------------------------------------------------------------
class RouteDecision(BaseModel):
    next_agent: Literal["learning_tutor", "project_coach"] = Field(
        description="决定下一个处理用户消息的专业导师。'learning_tutor' 负责基础知识解答和概念指导；'project_coach' 负责对具体的商业计划或项目想法进行挑刺、逻辑压测和深入分析。"
    )

def router_node(state: AgentState) -> dict[str, Any]:
    print("🚦 [Router Node] 正在分析用户意图...")
    messages = state.get("messages", [])
    forced_agent = state.get("forced_agent")

    if forced_agent in {"learning_tutor", "project_coach"}:
        print(f"🚦 [Router Node] 检测到前端显式指定 Agent，直接分发给: {forced_agent}")
        return {"next_agent": forced_agent}
    
    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(RouteDecision)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个VentureAgent双创教育系统的核心路由中枢。请根据用户的输入意图将其分配给合适的专业导师处理。\n"
                       "- learning_tutor (学习辅导Agent): 适合处理关于商业概念、理论、方法论的提问，或处于非常早期的迷茫阶段。\n"
                       "- project_coach (项目教练Agent): 适合处理用户提出了具体的项目想法、商业模式、寻求压测、找缺点或询问护城河的场景。"),
            ("placeholder", "{messages}")
        ])
        
        chain = prompt | structured_llm
        decision = cast(RouteDecision, chain.invoke({"messages": messages}))
        next_agent = decision.next_agent
        print(f"🚦 [Router Node] 意图识别完成，即将分发给: {next_agent}")
        
    except Exception as e:
        print(f"⚠️ Router调用模型失败: {e}，默认降级给 learning_tutor")
        next_agent = "learning_tutor"
        
    return {"next_agent": next_agent}

# -----------------------------------------------------------------------------
# 3. 核心互动节点开发 (A1: Tutor & A2: Coach)
# -----------------------------------------------------------------------------
class TutorResponse(BaseModel):
    is_refusal: bool = Field(
        description="是否发现用户提出了代写请求？如果用户的输入包含“直接写”、“帮我写完整”、“生成可直接提交的文本”、“帮我写一份800字”、“帮我把这部分写完”等直接索取完整文字的意图，请判定为代写请求（True）。"
    )
    refusal_reason: str | None = Field(
        description="(仅代写请求时提供) 明确拒绝直接代写请求，并基于启发式教学原则解释原因。"
    )
    socratic_questions: list[str] | None = Field(
        description="(仅代写请求时提供) 提供 >= 3个苏格拉底式的启发式引导问题，让学生自己思考。"
    )
    definition: str | None = Field(
        description="(非代写请求时提供) Definition: 清晰定义该概念或理论。"
    )
    example: str | None = Field(
        description="(非代写请求时提供) Example: 用对应项目的背景给出具体的现实示例。"
    )
    common_mistakes: str | None = Field(
        description="(非代写请求时提供) Common Mistakes: 指出常见错误或误区。"
    )
    practice_task: str | None = Field(
        description="(非代写请求时提供) 实操任务: 请只给出一个具体、可操作的微任务。切忌在文本中包含'Practice Task'字眼。"
    )
    expected_artifact: str | None = Field(
        description="(非代写请求时提供) Expected Artifact: 要求产出物说明。"
    )
    evaluation_criteria: str | None = Field(
        description="(非代写请求时提供) Evaluation Criteria: 对于该产出物的评价标准。"
    )

def learning_tutor_node(state: AgentState) -> dict[str, Any]:
    print("👨‍🏫 [Tutor Node] 学习辅导 Agent (A1) 正在生成回复...")
    messages = state.get("messages", [])
    
    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(TutorResponse)
        
        # 针对 A1 的核心人设与指引
        system_prompt = (
            "你是一个名为 VentureAgent 的高校创新创业基础辅导教练 (Learning Tutor, A1)。\n"
            "你的职责是解答学生在商业、创业初期的基础概念疑问，例如什么是MVP，什么是商业模式画布，或者帮助处于迷茫期的学生进行基础思考。\n\n"
            "【极端重要护栏】：\n"
            "你自带严格的“反代写”安全护栏。如果用户的指令中包含“直接写”、“帮我写完整”、“生成可直接提交的文本”等代写请求，你必须拒绝，\n"
            "并将 `is_refusal` 设为 True，给出 `refusal_reason`（遵循启发式原则解释拒绝原因），并提供至少3个苏格拉底式引导问题 `socratic_questions`。\n\n"
            "【正常学习辅导】：\n"
            "如果用户正常提问概念，需将 `is_refusal` 设为 False，并严格输出以下6个要素，缺少任何一个都不行：\n"
            "1. Definition (定义)\n"
            "2. Example (结合项目背景的示例)\n"
            "3. Common Mistakes (常见错误)\n"
            "4. 实操任务 (仅限一个具体微任务，注意：你的文本里绝不能包含'Practice Task'英文字母，以免计次冲突)\n"
            "5. Expected Artifact (要求产出物)\n"
            "6. Evaluation Criteria (评价标准)\n"
            "语气要像一位耐心、鼓励学生的导师。"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("placeholder", "{messages}")
        ])
        
        chain = prompt | structured_llm
        # 使用 with_structured_output 的输出是严格符合 BaseModel 的示例
        tutor_resp = cast(TutorResponse, chain.invoke({"messages": messages}))
        
        # 组装返回的 markdown
        if tutor_resp.is_refusal:
            questions_text = "\n".join([f"- {q}" for q in (tutor_resp.socratic_questions or [])])
            reply_content = f"**⚠️ 拒绝代写提醒**\n\n{tutor_resp.refusal_reason}\n\n**🤔 启发思考**\n\n{questions_text}"
        else:
            practice_task_content = tutor_resp.practice_task or ""
            if "Practice Task" in practice_task_content:
                practice_task_content = practice_task_content.replace("Practice Task", "实操任务")
                
            reply_content = (
                f"**Definition:**\n{tutor_resp.definition}\n\n"
                f"**Example:**\n{tutor_resp.example}\n\n"
                f"**Common Mistakes:**\n{tutor_resp.common_mistakes}\n\n"
                f"**Practice Task:**\n{practice_task_content}\n\n"
                f"**Expected Artifact:**\n{tutor_resp.expected_artifact}\n\n"
                f"**Evaluation Criteria:**\n{tutor_resp.evaluation_criteria}"
            )
        
        response_msg = AIMessage(content=reply_content)
        return {"messages": [response_msg]}
        
    except Exception as e:
        print(f"⚠️ Tutor 生成回复失败: {e}")
        error_msg = AIMessage(content="【学习辅导 Agent (A1)】抱歉，我目前的大脑线路遇到了一点小的干扰，你可以稍后再试。")
        return {"messages": [error_msg]}

def project_coach_node(state: AgentState) -> dict[str, Any]:
    print("🧠 [Coach Node] 项目教练 Agent (A2) 正在进行逻辑压测...")
    messages = state.get("messages", [])
    raw_content = messages[-1].content if messages else ""
    last_message = raw_content if isinstance(raw_content, str) else str(raw_content)
    
    try:
        llm = get_llm()
        
        # 1. 运行前置安全护栏 (Constraints Engine)
        warnings = constraints_engine.run_audit(last_message)
        warning_text = "\n".join(warnings) if warnings else "无预警项"
        if warnings:
            print(f"⚠️ [护栏拦截触发] 共 {len(warnings)} 项商业规则违背")
            
        # 2. 从图数据库检索相似案例 (GraphRAG)
        # MVP 阶段使用大模型快速提取短小的核心业务关键词，替代粗暴文本切片
        class KeywordExtraction(BaseModel):
            keyword: str = Field(description="从学生的输入中提取最核心的【项目产品名词】或【业务方向】（如'数据湖'，'外卖代拿'）。不得超过8个字，如果有多个词，只选最核心的一个词。")
            
        extractor = llm.with_structured_output(KeywordExtraction)
        extraction = cast(KeywordExtraction, extractor.invoke([
            ("system", "你负责从学生的话语中提取核心商业实体以供Neo4j查询。"),
            ("human", f"句子：{last_message}")
        ]))
        keyword = extraction.keyword
        
        rag_context = query_neo4j_for_projects(keyword)
        print(f"🔍 [GraphRAG 检索完成] 提取关键词: {keyword}")
        print(f"   [检索内容]:\n{rag_context}\n")
        
        # 针对 A2 的核心人设与指引 (毒舌、苏格拉底式发问)
        system_prompt = (
            "你是一个名为 VentureAgent 的高级项目教练 (Project Coach, A2)。\n"
            "来找你的通常是带着具体项目想法的学生创业团队。\n"
            "你的核心职责是对他们的商业模式或项目想法进行【深度防御性压测】，找出致命逻辑漏洞。\n"
            "你的工作准则：\n"
            "1. 【绝不直接给答案】：使用苏格拉底式提问，引导他们自己发现问题。\n"
            "2. 【一针见血】：每次回复只指出1个（最多2个）最核心的痛点或逻辑伪命题。\n"
            "3. 引入竞争残酷性，比如假设巨头入场、或者资金链断裂的压力测试。\n"
            "4. 语气可以带有威严，甚至有些“毒舌”，像是参加严厉的风险投资路演环节。\n"
            "5. 在提问的最后，要求对方针对你提出的漏洞给出具体的防御方案或数据证明。\n\n"
            "【以下是系统后台传递给你的诊断信息，请作为你压测的重点依据（不要直接暴露给学生这是系统提示的）】:\n"
            "护栏规则预警: {warning_text}\n"
            "图数据库检索出的对标项目与价值闭环: {rag_context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("placeholder", "{messages}")
        ])
        
        chain = prompt | llm
        response_msg = chain.invoke({
            "messages": messages,
            "warning_text": warning_text,
            "rag_context": rag_context
        })
        
        return {"messages": [response_msg]}
        
    except Exception as e:
        print(f"⚠️ Coach 生成回复失败: {e}")
        error_msg = AIMessage(content="【项目教练 Agent (A2)】你们的项目逻辑让我暂时无法解析，待我重连后再来拷问你。")
        return {"messages": [error_msg]}

# -----------------------------------------------------------------------------
# 图的路由条件函数
# -----------------------------------------------------------------------------
def route_to_agent(state: AgentState) -> str:
    """根据 Router 的决策返回下一个要执行的节点名称"""
    return state.get("next_agent", "learning_tutor")

# -----------------------------------------------------------------------------
# 4. 组装 LangGraph 并接入内存 Checkpointer
# -----------------------------------------------------------------------------
def build_graph() -> Any:
    # 初始化状态图
    workflow_graph = StateGraph(AgentState)
    
    # 添加所有节点
    workflow_graph.add_node("router", router_node)
    workflow_graph.add_node("learning_tutor", learning_tutor_node)
    workflow_graph.add_node("project_coach", project_coach_node)
    
    # 定义边与控制流
    workflow_graph.set_entry_point("router")
    
    workflow_graph.add_conditional_edges(
        "router",
        route_to_agent,
        {
            "learning_tutor": "learning_tutor",
            "project_coach": "project_coach"
        }
    )
    
    workflow_graph.add_edge("learning_tutor", END)
    workflow_graph.add_edge("project_coach", END)
    
    # 接入内存 Checkpointer 实现短时记忆持久化 (State checkpointer)
    memory = MemorySaver()
    
    # 编译图生成可执行对象
    return workflow_graph.compile(checkpointer=memory)

# 提供一个全局可用的 compiled graph 实例
app_graph = build_graph()
