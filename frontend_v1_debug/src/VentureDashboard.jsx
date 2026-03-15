import React, { useState, useRef, useEffect } from "react";
import "./VentureDashboard.css";

const VentureDashboard = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatLog, setChatLog] = useState([
    { role: 'coach', text: '发现痛点做得很好！外卖塑料垃圾确实是一个巨大的社会问题。🌍\n\n我在你的计划书草案中看到你的解决方案是“可降解的蘑菇基包装盒”。但是，要让这成为一个可行的商业项目，我们需要将解决方案与客户的利益联系起来。\n\n🤔 启发提问：\n"为什么餐厅老板要花钱买你的蘑菇包装盒，而不是便宜的塑料盒？这能帮他们省钱，还是帮他们卖出更多的食物？"' }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const userMessage = inputValue;
    setChatLog(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      setChatLog(prev => [...prev, { role: 'coach', text: data.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatLog(prev => [...prev, { role: 'coach', text: '网络连接失败，请检查后端服务是否启动。' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden text-sm bg-[var(--bg-color)] text-[var(--text-main)] font-['Inter']">
      {/* Header */}
      <header className="h-14 bg-white border-b border-[var(--border-color)] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            创
          </div>
          <h1 className="font-semibold text-lg tracking-tight">创新创业智能体 <span className="text-blue-600">学生端AI教练</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
            <span className="material-symbols-outlined text-[16px]">school</span>
            当前项目：环保包装解决方案
          </div>
          <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium shadow-sm cursor-pointer ring-2 ring-white">
            李明
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Aside */}
        <aside className="w-[280px] bg-white border-r border-[var(--border-color)] flex flex-col overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-5 border-b border-[var(--border-color)]">
            <h2 className="text-xs font-semibold text-slate-500 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">radar</span> 能力雷达图
            </h2>
            <div className="aspect-square bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative p-4">
              <div className="w-full h-full relative rounded-full border-2 border-slate-200 flex items-center justify-center">
                <div className="w-2/3 h-2/3 absolute rounded-full border border-slate-200"></div>
                <div className="w-1/3 h-1/3 absolute rounded-full border border-slate-200"></div>
                <div className="absolute w-full h-[1px] bg-slate-200 rotate-0"></div>
                <div className="absolute w-full h-[1px] bg-slate-200 rotate-[72deg]"></div>
                <div className="absolute w-full h-[1px] bg-slate-200 rotate-[144deg]"></div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <polygon fill="rgba(37, 99, 235, 0.2)" points="50,15 80,40 65,85 35,70 20,45" stroke="#2563eb" strokeLinejoin="round" strokeWidth="2"></polygon>
                  <circle cx="50" cy="15" fill="#2563eb" r="3"></circle>
                  <circle cx="80" cy="40" fill="#2563eb" r="3"></circle>
                  <circle cx="65" cy="85" fill="#2563eb" r="3"></circle>
                  <circle cx="35" cy="70" fill="#2563eb" r="3"></circle>
                  <circle cx="20" cy="45" fill="#2563eb" r="3"></circle>
                </svg>
                <div className="absolute top-0 text-[10px] text-slate-600 -mt-2 bg-white px-1">痛点</div>
                <div className="absolute right-0 top-1/3 text-[10px] text-slate-600 -mr-4 bg-white px-1">方案</div>
                <div className="absolute right-1/4 bottom-0 text-[10px] text-slate-600 -mb-2 bg-white px-1">商业</div>
                <div className="absolute left-1/4 bottom-0 text-[10px] text-slate-600 -mb-2 bg-white px-1">团队</div>
                <div className="absolute left-0 top-1/3 text-[10px] text-slate-600 -ml-4 bg-white px-1">表达</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-blue-700 font-medium"><div className="w-2 h-2 rounded-full bg-blue-600"></div>痛点挖掘: 8.5</div>
              <div className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-slate-300"></div>解决方案: 6.0</div>
              <div className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-slate-300"></div>商业模式: 4.5</div>
              <div className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-slate-300"></div>团队构建: 7.0</div>
              <div className="flex items-center gap-1.5 text-slate-600 col-span-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div>项目路演: 5.5</div>
            </div>
          </div>
          <div className="p-5 flex-1 bg-slate-50/50">
            <h2 className="text-xs font-semibold text-slate-500 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">monitor_heart</span> 项目逻辑健康度
            </h2>
            <div className="mb-5">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-700">整体逻辑连贯性</span>
                <span className="text-lg font-bold text-amber-500">62%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500 w-[40%]"></div>
                <div className="h-full bg-yellow-400 w-[22%]"></div>
                <div className="h-full bg-orange-400 w-[0%]"></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">在推进路演之前，需要完善产品与市场的契合度（Solution-Market fit）。</p>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                  <span className="text-xs font-medium text-slate-700">节点1：痛点已明确</span>
                </div>
              </div>
              <div className="bg-blue-50 p-2.5 rounded border border-blue-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div className="flex items-center gap-2 ml-1">
                  <span className="material-symbols-outlined text-blue-500 text-[16px] animate-spin">sync</span>
                  <span className="text-xs font-medium text-blue-800">节点2：方案价值验证</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm flex items-center justify-between opacity-60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">pending</span>
                  <span className="text-xs font-medium text-slate-600">节点8：单位经济效益</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Chat Section */}
        <section className="flex-1 flex flex-col bg-[var(--bg-color)] relative">
          <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex justify-between items-center absolute top-0 w-full z-10">
            <div>
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                AI教练
              </h2>
              <p className="text-xs text-slate-500">当前重点：解决方案逻辑验证</p>
            </div>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md">
              <span className="material-symbols-outlined text-[16px]">history</span> 历史对话
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-24 pb-32 space-y-6">
            <div className="flex justify-center">
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full tracking-wider">今天, 10:23 AM</span>
            </div>
            
            {chatLog.map((msg, idx) => {
              if (msg.role === 'coach') {
                return (
                  <div key={idx} className="flex gap-4 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">smart_toy</span>
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-xs font-medium text-slate-500 ml-1">AI教练</span>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm text-slate-700 leading-relaxed relative">
                        <span className="absolute -left-2 top-3 w-4 h-4 bg-white rotate-45 border-l border-b border-slate-200"></span>
                        <p className="whitespace-pre-wrap relative z-10">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white text-xs font-bold border border-blue-700 shadow-sm">
                      李明
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-xs font-medium text-slate-500 mr-1">我</span>
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm leading-relaxed relative">
                        <span className="absolute -right-2 top-3 w-4 h-4 bg-blue-600 rotate-45"></span>
                        <p className="whitespace-pre-wrap relative z-10">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            
            {isSending && (
              <div className="flex gap-4 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">smart_toy</span>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs font-medium text-slate-500 ml-1">AI教练</span>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm text-slate-700 leading-relaxed flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-blue-500">progress_activity</span>
                    <span className="text-sm text-slate-500">正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)] to-transparent pt-10">
            <div className="max-w-4xl mx-auto relative">
              <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                className="w-full bg-white border border-slate-300 rounded-xl py-4 pl-4 pr-14 shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-[80px] text-sm" 
                placeholder="输入你的回复... (勇敢说出你不确定的地方！)"
              ></textarea>
              <button 
                onClick={handleSend}
                disabled={isSending}
                className={`absolute right-3 bottom-3 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm ${isSending?'opacity-50 cursor-not-allowed':''}`}
              >
                <span className="material-symbols-outlined text-[20px]">{isSending ? 'hourglass_empty' : 'send'}</span>
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-slate-400">
              教练回复由AI生成，用于引导思考，并非标准答案。
            </div>
          </div>
        </section>

        {/* Right Aside */}
        <aside className="w-[300px] bg-white border-l border-[var(--border-color)] flex flex-col overflow-y-auto custom-scrollbar shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.03)] z-10">
          <div className="p-5 border-b border-[var(--border-color)]">
            <h2 className="text-xs font-semibold text-slate-500 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">task_alt</span> 待办事项
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors">
                <input checked readOnly className="mt-0.5 rounded text-emerald-500 border-emerald-300 focus:ring-emerald-500 bg-white" type="checkbox" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 line-through">🎯 明确核心痛点</p>
                  <p className="text-xs text-emerald-600 mt-0.5">已识别外卖塑料垃圾问题。</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 shadow-sm cursor-pointer ring-1 ring-blue-500">
                <input className="mt-0.5 rounded text-blue-600 border-blue-300 focus:ring-blue-500 bg-white" type="checkbox" />
                <div>
                  <p className="text-sm font-medium text-blue-900">💡 澄清价值主张</p>
                  <p className="text-xs text-blue-700 mt-0.5">你的包装如何为客户降本增效？</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input disabled className="mt-0.5 rounded text-slate-400 border-slate-300 bg-slate-100" type="checkbox" />
                <div>
                  <p className="text-sm font-medium text-slate-600">💰 规划盈利模式</p>
                  <p className="text-xs text-slate-400 mt-0.5">需等待价值主张明确后进行。</p>
                </div>
              </label>
            </div>
          </div>
          <div className="p-5 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">folder_open</span> 项目文档
              </h2>
              <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="group flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer bg-white shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-100 transform rotate-45 translate-x-4 -translate-y-4"></div>
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center shrink-0 text-red-600 z-10">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <p className="text-xs font-medium text-slate-800 truncate">商业计划书_草案_v2.pdf</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">更新于2天前 • 2.4 MB</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 z-10">
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 mb-2">已提取的核心实体</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] border border-rose-200">痛点: 外卖垃圾</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] border border-emerald-200">技术: 蘑菇菌丝体</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] border border-amber-200 border-dashed">市场: 待确认</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
      </main>
    </div>
  );
};

export default VentureDashboard;
