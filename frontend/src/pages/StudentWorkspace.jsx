import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./VentureDashboard.css";

const StudentWorkspace = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeSession, setActiveSession] = useState("current");
  const [sessions, setSessions] = useState([
    { id: "current", title: "蘑菇基包装盒项目压测", active: true },
    { id: "s1", title: "校园外卖零垃圾方案", active: false },
    { id: "s2", title: "大学生创业补贴咨询", active: false },
  ]);

  const [chatLog, setChatLog] = useState([
    { 
      role: 'coach', 
      agent: '项目教练 Agent',
      text: '发现痛点做得很好！外卖塑料垃圾确实是一个巨大的社会问题。🌍\n\n我在你的计划书草案中看到你的解决方案是**“可降解的蘑菇基包装盒”**。但是，要让这成为一个可行的商业项目，我们需要将解决方案与客户的利益联系起来。\n\n### 🤔 启发提问：\n> "为什么餐厅老板要花钱买你的蘑菇包装盒，而不是便宜的塑料盒？这能帮他们省钱，还是帮他们卖出更多的食物？"' 
    }
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
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      
      // 简单模拟判断 Agent 身份（实际可由后端返回）
      const agentLabel = userMessage.includes("怎么做") || userMessage.length < 5 ? "学习辅导 Agent" : "项目教练 Agent";
      
      setChatLog(prev => [...prev, { role: 'coach', agent: agentLabel, text: data.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatLog(prev => [...prev, { role: 'coach', agent: '系统错误', text: '网络连接失败，请检查后端服务是否启动。' }]);
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

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 用户数据状态
  const [userName, setUserName] = useState(localStorage.getItem('va_username') || '访客');
  const [userSchool, setUserSchool] = useState(localStorage.getItem('va_school') || '未录入院校');
  const [userMajor, setUserMajor] = useState(localStorage.getItem('va_major') || '未录入专业');
  const [userGrade, setUserGrade] = useState(localStorage.getItem('va_grade') || '未录入年级');

  // 编辑表单状态
  const [editName, setEditName] = useState(userName);
  const [editSchool, setEditSchool] = useState(userSchool);
  const [editMajor, setEditMajor] = useState(userMajor);
  const [editGrade, setEditGrade] = useState(userGrade);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('va_username', editName);
    localStorage.setItem('va_school', editSchool);
    localStorage.setItem('va_major', editMajor);
    localStorage.setItem('va_grade', editGrade);
    
    setUserName(editName);
    setUserSchool(editSchool);
    setUserMajor(editMajor);
    setUserGrade(editGrade);
    
    setShowProfileModal(false);
    setShowProfileMenu(false);
  };

  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white text-slate-800 font-['Inter'] selection:bg-blue-100">
      
      {/* 1. 左侧边栏 - 历史记录区 (260px) */}
      <aside className="w-[260px] shrink-0 bg-[#f9f9f9] border-r border-gray-200 flex flex-col transition-all duration-300">
        <div className="p-4">
          <button className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 group">
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">add</span>
            新建对话
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2 custom-scrollbar">
          <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">最近</div>
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={`px-4 py-3 rounded-xl cursor-pointer text-sm truncate transition-all ${s.active ? 'bg-white shadow-sm text-blue-600 font-medium border border-gray-100' : 'text-slate-500 hover:bg-gray-200/50'}`}
              onClick={() => setActiveSession(s.id)}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] opacity-60">chat_bubble</span>
                {s.title}
              </div>
            </div>
          ))}
        </div>

        {/* 个人信息栏 - 带下拉菜单 */}
        <div className="p-4 border-t border-gray-200/60 bg-white/50 backdrop-blur-sm relative" ref={menuRef}>
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 mb-2 w-[220px] bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="px-3 py-2 border-b border-gray-50 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">账号管理</p>
              </div>
              <button 
                onClick={() => {setShowProfileModal(true); setShowProfileMenu(false);}}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 text-slate-600 text-xs flex items-center gap-3 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                个人资料设置
              </button>
              <button 
                onClick={() => {setShowSettingsModal(true); setShowProfileMenu(false);}}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 text-slate-600 text-xs flex items-center gap-3 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                偏好设置
              </button>
              <div className="h-px bg-gray-50 my-1 mx-2" />
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 text-xs flex items-center gap-3 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                退出登录
              </button>
            </div>
          )}

          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${showProfileMenu ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 uppercase">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-800 truncate">{userName}</p>
                <span className={`material-symbols-outlined text-[14px] text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`}>expand_less</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate font-medium">{userSchool}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. 中间主对话区 - 核心沉浸区 */}
      <section className="flex-1 flex flex-col bg-white relative overflow-hidden">
        {/* 顶部状态栏 */}
        <header className="h-14 border-b border-gray-100/60 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">当前对话：蘑菇基包装盒项目压测</span>
          </div>
          <div className="flex gap-4">
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">share</span></button>
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">more_horiz</span></button>
          </div>
        </header>

        {/* 聊天内容展示 - 限宽居中 */}
        <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-12">
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* 头像 */}
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm shadow-sm ${msg.role === 'coach' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-500'}`}>
                    {msg.role === 'coach' ? 'V' : 'Me'}
                  </div>
                  
                  {/* 消息体 */}
                  <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end text-right' : 'items-start text-left'}`}>
                    {msg.role === 'coach' && (
                      <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md tracking-wider uppercase">
                        {msg.agent || 'AI Coach'}
                      </span>
                    )}
                    <div className={`p-1 leading-relaxed text-[16px] prose prose-slate max-w-none ${msg.role === 'user' ? 'bg-gray-100 text-slate-800 rounded-2xl px-5 py-3 rounded-tr-sm' : 'text-slate-800'}`}>
                      {msg.role === 'coach' ? (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      ) : (
                        <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">V</div>
                  <div className="flex gap-1.5 p-3 px-4 bg-gray-50 rounded-2xl rounded-tl-sm">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium italic">Agent 正在深度解析你的商业逻辑...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* 底部输入框 - ChatGPT 风格限宽居中 */}
        <div className="p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto relative px-2">
            <div className="relative group transition-all duration-300">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition"></div>
              <div className="relative bg-white border border-gray-200 rounded-3xl shadow-[0_5px_30px_-10px_rgba(0,0,0,0.06)] overflow-hidden focus-within:border-blue-300 focus-within:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all">
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  rows={1}
                  className="w-full bg-transparent border-none py-5 pl-7 pr-20 resize-none min-h-[70px] max-h-48 text-[15px] focus:ring-0 outline-none text-slate-700 placeholder-slate-400 font-normal leading-relaxed custom-scrollbar"
                  placeholder="有什么想要交流的创业想法吗？"
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-3">
                   <button className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${inputValue.trim() ? 'bg-slate-900 text-white shadow-xl hover:bg-slate-800' : 'bg-gray-50 text-slate-300 cursor-not-allowed'}`} onClick={handleSend} disabled={isSending}>
                      <span className="material-symbols-outlined text-[20px]">{isSending ? 'hourglass_bottom' : 'arrow_upward'}</span>
                   </button>
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-slate-300 pointer-events-none group-focus-within:opacity-0 transition-opacity">
                   {/* 左侧占位图标 */}
                </div>
              </div>
            </div>
            <p className="text-center mt-3 text-[10px] text-slate-400">
               深度导师由 VentureAgent & DeepSeek 联合驱动 · 思考商业的本质
            </p>
          </div>
        </div>
      </section>

      {/* 3. 右侧边栏 - 数据与功能区 (320px) */}
      <section className="w-[320px] shrink-0 bg-[#f9f9f9] border-l border-gray-200 flex flex-col p-6 overflow-y-auto custom-scrollbar gap-6">
        
        {/* 指标卡片 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] group hover:shadow-lg transition-shadow">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <span className="material-symbols-outlined text-[16px] text-blue-500">monitoring</span>
             能力雷达
          </h3>
          <div className="aspect-square w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
             {/* 占位雷达图背景 */}
             <div className="absolute inset-4 rounded-full border border-blue-100/30 flex items-center justify-center">
                <div className="w-2/3 h-2/3 rounded-full border border-blue-100/50 flex items-center justify-center">
                   <div className="w-1/3 h-1/3 rounded-full border border-blue-100"></div>
                </div>
             </div>
             <span className="text-[10px] text-slate-400 font-medium italic z-10">ECharts 图表加载中...</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
             <div className="p-2 rounded-lg bg-blue-50/50">
                <p className="text-[10px] text-slate-400">商业落地</p>
                <p className="text-sm font-black text-blue-600">82%</p>
             </div>
             <div className="p-2 rounded-lg bg-emerald-50/50">
                <p className="text-[10px] text-slate-400">技术壁垒</p>
                <p className="text-sm font-black text-emerald-600">65%</p>
             </div>
          </div>
        </div>

        {/* 待办事项卡片 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-orange-500">
             <span className="material-symbols-outlined text-[16px]">rule</span>
             待办项
          </h3>
          <div className="space-y-3">
             {[
               { t: "完成市场容量测算", d: "需给出具体的 SAM/SOM 数据" },
               { t: "细化蘑菇基材成本", d: "对比传统塑料的单价差异" }
             ].map((item, i) => (
               <div key={i} className="p-3 rounded-xl bg-orange-50/30 border border-orange-100/50 hover:bg-orange-50 transition-colors cursor-pointer group">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-orange-700">{item.t}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{item.d}</p>
               </div>
             ))}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="mt-auto pt-4 flex flex-col gap-2">
           <button className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs font-bold hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[16px]">download</span>
              导出商业计划书草案
           </button>
        </div>

      </section>

      {/* 个人资料 Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">个人资料设置</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">用户姓名</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">就读学校</label>
                <input 
                  type="text" 
                  value={editSchool}
                  onChange={e => setEditSchool(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">所属专业</label>
                  <input 
                    type="text" 
                    value={editMajor}
                    onChange={e => setEditMajor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">年级</label>
                  <select 
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                  >
                    <option value="大一">大一</option>
                    <option value="大二">大二</option>
                    <option value="大三">大三</option>
                    <option value="大四">大四</option>
                    <option value="研究生">研究生</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 mt-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm tracking-wide"
              >
                保存修改
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 偏好设置 Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">账号与系统设置</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">系统偏好</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">dark_mode</span>
                      <span className="text-sm font-medium text-slate-700">深色模式</span>
                    </div>
                    <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-not-allowed opacity-50">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">notifications</span>
                      <span className="text-sm font-medium text-slate-700">消息通知</span>
                    </div>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full transition-all" />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">账号安全</h4>
                <button className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-blue-600">lock</span>
                    <span className="text-sm font-medium text-slate-700">修改登录密码</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </button>
              </section>

              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">数据管理</h4>
                <button className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-red-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-400">delete_forever</span>
                    <span className="text-sm font-medium text-red-500">注销账号并清空数据</span>
                  </div>
                </button>
              </section>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWorkspace;
