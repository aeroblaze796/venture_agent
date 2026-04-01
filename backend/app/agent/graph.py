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

class ProjectCoachResponse(BaseModel):
    project_stage: str = Field(
        description="Project Stage: 用2到3句话判断项目所处阶段，例如'idea stage'、'problem validation stage'、'early solution stage'。要说明项目为什么还停留在这个阶段。"
    )
    diagnosis: str = Field(
        description="Diagnosis: 只指出当前最核心的一个逻辑问题，展开写成较完整的一段。语气要凌厉，尽量多用反问句推进学生思考，但不要扩展成多个并列问题。"
    )
    evidence_used: str = Field(
        description="Evidence Used: 只引用或转述用户输入中的2到3处关键信息，说明你为什么得出这个判断。可以逐点拆开，但不得使用外部信息。"
    )
    impact: str = Field(
        description="Impact: 说明这个核心问题如果不解决，会带来什么后果。写得更具体一些，点出路演、验证、获客、交付或生存层面的风险。"
    )
    next_task: str = Field(
        description="ONLY ONE Next Task: 只能给一个、且可以立刻执行的下一步任务，不能给任务清单。任务描述可以稍微详细，但必须仍然只有一个动作目标。"
    )

def _get_recent_user_context(messages: list[BaseMessage], limit: int = 3) -> tuple[list[str], str]:
    """
    仅提取最近几轮用户消息，避免项目教练被 Tutor 或既有 AI 回复的格式污染。
    返回 (历史用户消息列表, 当前用户消息)。
    """
    human_messages = [
        msg.content if isinstance(msg.content, str) else str(msg.content)
        for msg in messages
        if isinstance(msg, HumanMessage)
    ]

    if not human_messages:
        return [], ""

    latest_message = human_messages[-1].strip()
    prior_messages = [msg.strip() for msg in human_messages[:-1] if str(msg).strip()]
    if limit > 0:
        prior_messages = prior_messages[-limit:]
    return prior_messages, latest_message

def project_coach_node(state: AgentState) -> dict[str, Any]:
    print("🧠 [Coach Node] 项目教练 Agent (A2) 正在进行逻辑压测...")
    messages = state.get("messages", [])
    prior_user_messages, latest_user_message = _get_recent_user_context(messages)
    
    try:
        llm = get_llm()
        structured_llm = llm.with_structured_output(ProjectCoachResponse)

        prior_context_text = "\n".join(
            f"- 历史用户消息 {index + 1}: {content}"
            for index, content in enumerate(prior_user_messages)
        ) or "无"

        system_prompt = (
            "你是一个名为 VentureAgent 的高级项目教练 (Project Coach, A2)。\n"
            "来找你的通常是带着具体项目想法的学生创业团队。\n"
            "你的任务是对项目进行一针见血的诊断，但不能直接代替学生完成商业方案。\n"
            "你的说话风格必须像一个严厉、老练、几乎不留情面的投资人或答辩评委：凌厉、压迫感强、善于反问。\n"
            "你应该尽量使用苏格拉底式追问来逼学生自己看见漏洞，而不是温和解释或直接替他补方案。\n\n"
            "严格要求：\n"
            "1. 你必须只输出 5 个字段对应的内容：Project Stage、Diagnosis、Evidence Used、Impact、ONLY ONE Next Task。\n"
            "2. 你一次只能指出 1 个最核心的问题，不能扩展成多个并列问题。\n"
            "3. Evidence Used 只能基于用户输入，不得编造外部案例、图谱信息或数据库内容。\n"
            "4. ONLY ONE Next Task 必须严格只有 1 个可执行任务，不能再附加第二个动作。\n"
            "5. 保持专业、直接、克制，不要输出 Definition、Example、Common Mistakes、Practice Task 等其他字段。\n"
            "6. 如果历史消息与当前消息冲突，以当前消息为准。\n"
            "7. 在不改变五字段结构的前提下，内容要比简短点评更充实，整体篇幅要接近学习辅导 Agent 的常规回答长度。\n"
            "8. Diagnosis、Impact、ONLY ONE Next Task 这三段里，优先使用反问句或带追问感的句式，但仍要让学生明确知道你在质疑什么。\n"
            "9. 你不能给现成答案，不能替学生完成商业判断，只能指出漏洞、压测假设、逼他回去验证。\n"
            "10. ONLY ONE Next Task 结尾最好形成一个明确的追问闭环，让学生带着数据或证据回来回答你。"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "最近历史用户消息（仅供补充上下文，不代表最终结论）：\n{prior_context}"),
            ("human", "当前用户消息：\n{latest_message}")
        ])

        chain = prompt | structured_llm
        coach_resp = cast(ProjectCoachResponse, chain.invoke({
            "prior_context": prior_context_text,
            "latest_message": latest_user_message or "用户暂未提供有效项目描述"
        }))

        reply_content = (
            f"**Project Stage:**\n{coach_resp.project_stage}\n\n"
            f"**Diagnosis:**\n{coach_resp.diagnosis}\n\n"
            f"**Evidence Used:**\n{coach_resp.evidence_used}\n\n"
            f"**Impact:**\n{coach_resp.impact}\n\n"
            f"**ONLY ONE Next Task:**\n{coach_resp.next_task}"
        )

        return {"messages": [AIMessage(content=reply_content)]}
        
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
