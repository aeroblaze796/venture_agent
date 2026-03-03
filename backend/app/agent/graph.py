from typing import Annotated, TypedDict, Any
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

# 定义图的状态 (State)
class AgentState(TypedDict, total=False):
    # messages 列表中保存对话历史，add_messages 会自动追加新消息而不是覆盖
    messages: Annotated[list[BaseMessage], add_messages]
    # 当前激活的专业 Agent（用于跨节点传递状态）
    next_agent: str

# 1. 定义 Router 节点：负责判断意图并分发给专业 Agent
def router_node(state: dict[str, Any]) -> dict[str, Any]:
    messages = state.get("messages", [])
    last_message = messages[-1].content if messages else ""
    
    # 极简意图识别逻辑 (MVP 阶段使用规则匹配代替 LLM 判断)
    # 如果用户提到"做项目"、"缺点"、"商业计划书"、"BP"，或"创业想法"，交给项目教练；否则默认交给学习辅导 Agent
    keywords_for_coach = ["我的项目", "创业想法", "缺点", "商业计划书", "BP", "校园外卖"]
    if any(keyword in last_message for keyword in keywords_for_coach):
        next_agent = "project_coach"
    else:
        next_agent = "learning_tutor"
        
    return {"next_agent": next_agent}

# 2. 定义 Mock 的专业 Agent 节点
def learning_tutor_node(state: dict[str, Any]) -> dict[str, Any]:
    messages = state.get("messages", [])
    last_message = messages[-1].content if messages else ""
    
    reply_content = f"【学习辅导 Agent (A1)】我收到了你的消息：'{last_message}'。作为MVP版本，我建议你可以先去街头访谈5个潜在用户了解需求哦！"
    return {"messages": [AIMessage(content=reply_content)]}

def project_coach_node(state: dict[str, Any]) -> dict[str, Any]:
    messages = state.get("messages", [])
    last_message = messages[-1].content if messages else ""
    
    reply_content = f"【项目教练 Agent (A2)】关于你的项目想法：'{last_message}'。请问如果字节跳动明天做了一模一样的功能，你的护城河在哪里？"
    return {"messages": [AIMessage(content=reply_content)]}

# 3. 定义图的路由条件函数
def route_to_agent(state: dict[str, Any]) -> str:
    """根据 Router 的决策返回下一个要执行的节点名称"""
    return state.get("next_agent", "learning_tutor")

# 4. 组装 LangGraph
def build_graph() -> Any:
    # 初始化状态图
    workflow_graph = StateGraph(AgentState)
    
    # 添加所有节点
    workflow_graph.add_node("router", router_node)
    workflow_graph.add_node("learning_tutor", learning_tutor_node)
    workflow_graph.add_node("project_coach", project_coach_node)
    
    # 定义边与控制流
    # 所有的对话首先进入 Router
    workflow_graph.set_entry_point("router")
    
    # Router 之后，通过条件路由边 (Conditional Edge) 决定发给哪个专业 Agent
    workflow_graph.add_conditional_edges(
        "router",
        route_to_agent,
        {
            "learning_tutor": "learning_tutor",
            "project_coach": "project_coach"
        }
    )
    
    # 专业 Agent 处理完毕后结束本次流转 (在真实的聊天系统中也是一问一答，结束后等待下次 HumanMessage)
    workflow_graph.add_edge("learning_tutor", END)
    workflow_graph.add_edge("project_coach", END)
    
    # 编译图生成可执行对象
    return workflow_graph.compile()

# 提供一个全局可用的 compiled graph 实例
app_graph = build_graph()
