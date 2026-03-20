import React, { useState, useRef, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import ReactMarkdown from "react-markdown";
import { Calendar, Timeline, Badge, Tooltip, Avatar, ConfigProvider, Modal, Button, Select, Popover, List } from "antd";
import { 
  RocketOutlined, 
  FileTextOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  RadarChartOutlined, 
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  SendOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined
} from "@ant-design/icons";
import "./VentureDashboard.css";

const StudentWorkspace = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activePage, setActivePage] = useState("chat"); // 'chat', 'editor', 'collab'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [syncData, setSyncData] = useState({
    projects: [],
    deadlines: [],
    evolution_logs: []
  });
  const [calendarValue, setCalendarValue] = useState(dayjs());

  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  
  const [chatLog, setChatLog] = useState([]);

  const handleNewChat = async () => {
    const username = localStorage.getItem("va_username") || "1120230571";
    const newId = `va_session_${username}_${Date.now()}`;
    const greeting = '新对话已开启。请告诉我你现在的创业想法或遇到的困难。';
    
    // 立即持久化初始欢迎语
    try {
      await fetch("http://localhost:8000/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          user_id: username,
          title: '新灵感会话 ' + new Date().toLocaleTimeString(),
          greeting: greeting
        })
      });
    } catch (e) { console.error("Persistence failed:", e); }

    const newSession = { id: newId, title: '新灵感会话 ' + new Date().toLocaleTimeString(), active: true };
    setHistory(prev => [newSession, ...prev.map(item => ({ ...item, active: false }))]);
    setActiveSessionId(newId);
    setChatLog([
      { 
        role: 'coach', 
        agent: '系统助手',
        text: greeting
      }
    ]);
  };

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  useEffect(() => {
    const initData = async () => {
      const username = localStorage.getItem("va_username") || "1120230571";
      
      // 1. 同步看板数据
      try {
        const res = await fetch(`http://localhost:8000/api/sync/dashboard?user_id=${username}`);
        const data = await res.json();
        setSyncData(data);
      } catch (e) { console.error(e); }

      // 2. 加载会话历史
      try {
        const res = await fetch(`http://localhost:8000/api/conversations?user_id=${username}`);
        const convs = await res.json();
        if (convs.length > 0) {
          const formatted = convs.map((c, idx) => ({ ...c, active: idx === 0 }));
          setHistory(formatted);
          handleSessionSwitch(formatted[0].id);
        } else {
          handleNewChat();
        }
      } catch (e) { console.error(e); }
    };
    initData();
  }, []);

  const handleSessionSwitch = async (id) => {
    setHistory(prev => prev.map(h => ({ ...h, active: h.id === id })));
    setActiveSessionId(id);
    try {
      const res = await fetch(`http://localhost:8000/api/conversations/${id}/messages`);
      const msgs = await res.json();
      setChatLog(msgs);
    } catch (err) { console.error(err); }
  };

  const handleRename = async (id, title) => {
    try {
      await fetch(`http://localhost:8000/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      setHistory(prev => prev.map(h => h.id === id ? { ...h, title } : h));
      setEditingId(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/conversations/${id}`, { method: 'DELETE' });
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      if (activeSessionId === id && newHistory.length > 0) {
        handleSessionSwitch(newHistory[0].id);
      } else if (newHistory.length === 0) {
        handleNewChat();
      }
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const userMessage = inputValue;
    const currentSessionId = activeSessionId;
    
    setChatLog(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          session_id: currentSessionId
        }),
      });
      const data = await response.json();
      setChatLog(prev => [...prev, { 
        role: 'coach', 
        agent: data.agent || '项目教练 Agent (A2)', 
        text: data.reply 
      }]);
    } catch (error) {
      setChatLog(prev => [...prev, { role: 'coach', agent: '系统错误', text: '连接后端失败，请重试。' }]);
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

  // --- 动态 DDL 逻辑 (来自数据库) ---
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayDeadlines = (syncData.deadlines || []).filter(item => item.due_date === dateStr);
    
    if (dayDeadlines.length > 0) {
      return (
        <div className="deadline-highlight-node">
          {dayDeadlines.map((item, idx) => (
            <Tooltip key={idx} title={`【项目节点】${item.title}`}>
              <div className="h-1 shadow-sm rounded-full bg-amber-400 mt-0.5"></div>
            </Tooltip>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ConfigProvider theme={{ token: { primaryColor: '#2563eb' } }}>
      <div className="workspace-container">
        
        <nav className="nav-rail flex-none h-full">
          <div className={`nav-item ${activePage === 'chat' ? 'active' : ''}`} onClick={() => setActivePage('chat')}>
            <RocketOutlined style={{ fontSize: '20px' }} />
            <div className="nav-label">
              <span>灵感空间</span>
              <span className="en">HOME</span>
            </div>
          </div>
          <div className={`nav-item ${activePage === 'editor' ? 'active' : ''}`} onClick={() => setActivePage('editor')}>
            <FileTextOutlined style={{ fontSize: '20px' }} />
            <div className="nav-label">
              <span>计 划 书</span>
              <span className="en">EDITOR</span>
            </div>
          </div>
          <div className={`nav-item ${activePage === 'collab' ? 'active' : ''}`} onClick={() => setActivePage('collab')}>
            <TeamOutlined style={{ fontSize: '20px' }} />
            <div className="nav-label">
              <span>协作中心</span>
              <span className="en">TEAM</span>
            </div>
          </div>
          
          <div className="mt-auto mb-6 flex flex-col gap-6 items-center">
             <div className="nav-item">
               <Tooltip title="系统设置" placement="right"><SettingOutlined style={{ fontSize: '22px' }} /></Tooltip>
             </div>
             <Avatar 
               size={44} 
               style={{ backgroundColor: '#2563eb', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' }}
               icon={<UserOutlined />}
               onClick={() => setShowProfileModal(true)}
             />
          </div>
        </nav>

        <aside className="w-[260px] bg-[#f9f9fb] border-r border-[#f1f3f5] flex flex-col flex-none">
          <div className="p-5 border-b border-[#f1f3f5] bg-white/50 backdrop-blur-sm">
            <button className="btn-new-chat mb-5" onClick={handleNewChat}>
               <PlusOutlined /> 新建对话
            </button>
            <h2 className="text-[11px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
              <HistoryOutlined /> Talk History
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-2">
            {history.map(item => (
              <div 
                key={item.id}
                className={`group px-4 py-3 rounded-2xl text-[13px] truncate cursor-pointer transition-all border flex items-center justify-between
                  ${item.active 
                    ? 'bg-white shadow-sm border-blue-100 font-bold text-blue-600 border-l-4 border-l-blue-600' 
                    : 'text-slate-500 border-transparent hover:bg-white hover:border-gray-100'}`}
                onClick={() => handleSessionSwitch(item.id)}
              >
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      className="bg-transparent border-none outline-none text-blue-600 w-full"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(item.id, editTitle)}
                    />
                    <CheckOutlined className="text-emerald-500" onClick={() => handleRename(item.id, editTitle)} />
                    <CloseOutlined className="text-red-400" onClick={() => setEditingId(null)} />
                  </div>
                ) : (
                  <>
                    <span className="truncate flex-1">{item.title}</span>
                    <div className="hidden group-hover:flex items-center gap-2 ml-2">
                       <EditOutlined className="text-slate-300 hover:text-blue-500" onClick={(e) => {
                         e.stopPropagation();
                         setEditingId(item.id);
                         setEditTitle(item.title);
                       }} />
                       <DeleteOutlined className="text-slate-300 hover:text-red-500" onClick={(e) => {
                         e.stopPropagation();
                         handleDelete(item.id);
                       }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* 用户缩略卡片 */}
          <div className="p-4 bg-white border-t border-[#f1f3f5]">
             <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowProfileModal(true)}>
                <Avatar size={36} style={{ backgroundColor: '#e2e8f0' }} icon={<UserOutlined />} />
                <div className="min-w-0">
                   <p className="text-xs font-black text-slate-800 truncate">{localStorage.getItem('va_username') || '创业者'}</p>
                   <p className="text-[10px] text-slate-400 truncate font-medium">{localStorage.getItem('va_school') || '创新实验班'}</p>
                </div>
             </div>
          </div>
        </aside>

        {/* 3. 中间对话主区 (Main Chat) */}
        <section className="flex-1 flex flex-col bg-white relative overflow-hidden">
          {activePage === 'chat' ? (
            <>
               <header className="h-16 border-b border-[#f1f3f5] px-8 flex items-center justify-between z-10 bg-white/80 backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase">Venture Agent AI</span>
                  <span className="text-xs font-bold text-slate-400">灵感与逻辑的碰撞空间</span>
                </div>
                <div className="flex gap-4">
                   <Popover 
                     placement="bottomRight" 
                     title={<span className="text-xs font-black text-slate-800">消息通知中心</span>}
                     content={
                       <List
                         size="small"
                         className="w-64"
                         dataSource={[
                           { title: '项目已成功立项', time: '刚刚' },
                           { title: '蘑菇基项目 DDL 临近', time: '2小时前' },
                           { title: '导师回复了你的提问', time: '昨天' }
                         ]}
                         renderItem={item => (
                           <List.Item>
                             <div className="flex flex-col">
                               <span className="text-[11px] font-bold text-slate-700">{item.title}</span>
                               <span className="text-[10px] text-slate-400">{item.time}</span>
                             </div>
                           </List.Item>
                         )}
                       />
                     }
                   >
                     <Badge count={3} size="small" offset={[2, 0]}>
                       <Button type="text" shape="circle" icon={<BellOutlined className="text-slate-400" />} />
                     </Badge>
                   </Popover>
                </div>
              </header>

              {/* 对话内容容器 */}
              <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-12">
                  {chatLog.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-5 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar 
                          size={36} 
                          className="flex-none shadow-sm"
                          style={{ backgroundColor: msg.role === 'coach' ? '#2563eb' : '#f4f4f5', color: msg.role === 'coach' ? '#fff' : '#8e8e93' }}
                          icon={msg.role === 'coach' ? <RocketOutlined /> : <UserOutlined />}
                        />
                        <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.role === 'coach' && (
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[11px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50 uppercase tracking-tighter">{msg.agent}</span>
                            </div>
                          )}
                          <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                             {msg.role === 'coach' ? (
                               <div className="prose prose-slate prose-sm max-w-none">
                                 <ReactMarkdown>{msg.text}</ReactMarkdown>
                               </div>
                             ) : (
                               <p className="m-0 leading-relaxed font-medium">{msg.text}</p>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="text-[11px] text-slate-400 animate-pulse italic ml-14 flex items-center gap-2">
                       <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                       导师正在根据双创评估标准深度解析中...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 底部输入区 (DeepSeek Style) */}
              <div className="p-8 bg-white border-t border-gray-50 h-[140px] flex flex-col justify-center">
                <div className="max-w-3xl mx-auto w-full relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-40 transition duration-500"></div>
                  <div className="relative bg-gray-50 border border-gray-100 rounded-[2rem] overflow-hidden focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-2xl focus-within:shadow-blue-500/5 transition-all duration-300">
                    <textarea 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="写下你的创业想法，或者向导师寻求建议..."
                      className="w-full bg-transparent border-none py-5 pl-8 pr-20 outline-none resize-none min-h-[70px] max-h-48 text-[15px] text-slate-700 placeholder-slate-300 transition-all font-medium"
                      rows={1}
                    />
                    <div className="absolute right-4 bottom-4">
                       <Button 
                         onClick={handleSend}
                         disabled={isSending || !inputValue.trim()}
                         type="primary"
                         shape="circle"
                         size="large"
                         icon={<SendOutlined />}
                         className={`flex items-center justify-center border-none shadow-lg ${isSending || !inputValue.trim() ? 'opacity-30' : 'bg-slate-900 hover:bg-slate-800'}`}
                       />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-center text-slate-300 mt-4 tracking-wider">
                  VentureAgent AI v3.0 | 专注于双创逻辑校验与深度辅导
                </p>
              </div>
            </>
          ) : (
            /* 模块待开发状态 */
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30">
               <div className="w-24 h-24 bg-white rounded-full shadow-2xl shadow-blue-500/5 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-blue-100">architecture</span>
               </div>
               <h2 className="text-xl font-black text-slate-800 mb-2">该模块正在施工中</h2>
               <p className="text-slate-400 text-sm font-medium mb-8">我们将按照“七阶段开发计划”逐步解锁核心功能</p>
               <Button type="primary" shape="round" size="large" onClick={() => setActivePage('chat')}>返回 AI 灵感空间</Button>
            </div>
          )}
        </section>

        {/* 4. 右侧控制台 (Monitor Console) */}
        <section className="w-[340px] bg-[#fcfcfd] border-l border-[#f1f3f5] flex flex-col p-8 overflow-y-auto custom-scrollbar gap-8 flex-none">
           
           {/* DDL 日历 */}
           <div className="console-card">
              <div className="flex justify-between items-center mb-4">
                <h3><CalendarOutlined className="text-amber-500" /> 全量项目 DDL </h3>
                <Tooltip title="跨项目聚合所有关键节点"><span className="material-symbols-outlined text-sm text-slate-300">info</span></Tooltip>
              </div>
              <div className="bg-[#fafafa] rounded-3xl p-3 border border-gray-100 scale-95 origin-top">
                 <Calendar 
                   fullscreen={false} 
                   value={calendarValue}
                   onChange={(v) => setCalendarValue(v)}
                   headerRender={({ value, type, onChange, onTypeChange }) => {
                     const monthOptions = [];
                     const months = [];
                     for (let i = 0; i < 12; i++) {
                       months.push(value.clone().month(i).format('MMM'));
                     }
                     for (let index = 0; index < 12; index++) {
                       monthOptions.push(
                         <Select.Option className="month-item" key={index} value={index}>
                           {months[index]}
                         </Select.Option>
                       );
                     }
                     const year = value.year();
                     const month = value.month();
                     const options = [];
                     for (let i = year - 10; i < year + 10; i += 1) {
                       options.push(
                         <Select.Option key={i} value={i} className="year-item">
                           {i}
                         </Select.Option>
                       );
                     }
                     return (
                       <div className="flex gap-2 p-2 justify-center items-center">
                         <Select
                           size="small"
                           dropdownMatchSelectWidth={false}
                           className="my-year-select"
                           onChange={(newYear) => {
                             const now = value.clone().year(newYear);
                             onChange(now);
                             setCalendarValue(now);
                           }}
                           value={year}
                         >
                           {options}
                         </Select>
                         <Select
                           size="small"
                           dropdownMatchSelectWidth={false}
                           value={month}
                           onChange={(selectedMonth) => {
                             const now = value.clone().month(selectedMonth);
                             onChange(now);
                             setCalendarValue(now);
                           }}
                         >
                           {monthOptions}
                         </Select>
                       </div>
                     );
                   }}
                   fullCellRender={(date) => {
                     const currentMonth = calendarValue.month();
                     const isCurrentMonth = date.month() === currentMonth;
                     const hasDDL = (syncData.deadlines || []).some(d => d.due_date === date.format('YYYY-MM-DD'));
                     return (
                       <div className={`h-9 flex flex-col items-center justify-center text-[11px] font-bold rounded-xl transition-all relative
                         ${!isCurrentMonth ? 'bg-gray-50/50 text-slate-300 opacity-50' : 'text-slate-500 hover:bg-gray-100'}
                         ${isCurrentMonth && hasDDL ? 'bg-amber-100/60 text-amber-700 shadow-inner' : ''}`}>
                          <span>{date.date()}</span>
                          {isCurrentMonth && dateCellRender(date)}
                       </div>
                     );
                   }}
                 />
              </div>
              <div className="mt-4 space-y-3">
                 {syncData.deadlines.slice(0, 3).map((ddl, idx) => (
                   <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-2xl text-[10px] text-amber-600 font-bold border border-amber-100/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                      <span className="flex-1 truncate">{ddl.due_date.split('-').slice(1).join('-')}：{ddl.title}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* 能力雷达图 (Static SVG) */}
           <div className="console-card">
              <h3><RadarChartOutlined className="text-blue-500" /> 核心创业能力画像</h3>
              <div className="aspect-square bg-gradient-to-br from-blue-50/20 to-indigo-50/20 rounded-3xl border border-blue-50 flex items-center justify-center relative overflow-hidden group mt-2">
                 <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] animate-pulse duration-[3s]">
                    {/* 背景网点 */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="1" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="1" />
                    {/* 雷达轴 */}
                    <line x1="50" y1="10" x2="50" y2="90" stroke="#e2e8f0" strokeWidth="0.3" />
                    <line x1="10" y1="50" x2="90" y2="50" stroke="#e2e8f0" strokeWidth="0.3" />
                    {/* 数据区域 */}
                    <polygon points="50,20 85,50 65,80 35,80 15,50" fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
                 </svg>
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-blue-600 font-black tracking-widest">商业逻辑</div>
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold">落地估值</div>
                 <div className="absolute top-1/2 -right-2 -translate-y-1/2 -rotate-90 text-[10px] text-emerald-500 font-black">技术壁垒</div>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">数据基于最近 50 次 AI 交互分析</p>
           </div>

           {/* 项目时间线 */}
           <div className="console-card">
              <h3><HistoryOutlined className="text-orange-400" /> 项目演进轨迹</h3>
              <div className="mt-4 px-2">
                 <Timeline 
                    mode="left"
                    items={syncData.evolution_logs.slice(0, 3).map(log => ({
                      children: <span className="text-xs font-bold text-slate-700">{log.event}</span>,
                      color: log.event.includes('风险') ? 'red' : 'blue',
                      label: <span className="text-[10px] text-slate-400">{log.timestamp.split(' ')[0].split('-').slice(1).join('-')}</span>
                    }))}
                 />
                 {syncData.evolution_logs.length === 0 && (
                    <div className="text-center text-[10px] text-slate-300 mt-2">尚无演进记录</div>
                 )}
              </div>
           </div>
        </section>

        {/* 个人中心 Modal */}
        <Modal
          title={null}
          footer={null}
          open={showProfileModal}
          onCancel={() => setShowProfileModal(false)}
          width={440}
          centered
          className="profile-modal"
          bodyStyle={{ padding: 0 }}
        >
           <div className="h-28 bg-gradient-to-r from-blue-700 to-indigo-700 p-8 relative">
              <Avatar size={72} className="absolute -bottom-9 left-10 border-4 border-white shadow-xl bg-gray-100 text-blue-600 font-black" icon={<UserOutlined />} />
           </div>
           <div className="p-10 pt-14">
              <div className="flex flex-col mb-8">
                 <h2 className="text-2xl font-black text-slate-800">{localStorage.getItem('va_username') || '访客开发者'}</h2>
                 <p className="text-xs font-bold text-blue-500 mt-1 uppercase tracking-widest">Student Entrepreneur | ID: 2026-X11</p>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-[#f1f3f5]">
                    <span className="text-[11px] font-black text-slate-400 uppercase">所属机构</span>
                    <span className="text-sm font-bold text-slate-700">{localStorage.getItem('va_school') || '大数据特色课程班'}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-[#f1f3f5]">
                    <span className="text-[11px] font-black text-slate-400 uppercase">当前焦点项目</span>
                    <span className="text-sm font-bold text-blue-600">蘑菇基环保包装盒</span>
                 </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col gap-3">
                 <Button type="default" block shape="round" size="large" className="font-bold text-xs" icon={<SettingOutlined />}>个人账户设置</Button>
                 <Button danger block type="text" shape="round" size="large" className="font-black text-xs" icon={<LogoutOutlined />} onClick={() => {localStorage.clear(); window.location.href='/';}}>安全退出登录</Button>
              </div>
           </div>
        </Modal>

      </div>
    </ConfigProvider>
  );
};

export default StudentWorkspace;
