import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import ReactMarkdown from "react-markdown";
import { Calendar, Timeline, Badge, Tooltip, Avatar, ConfigProvider, Modal, Button, Select, Popover, List, Steps, message, Input, Space, Divider, Empty, Popconfirm } from "antd";
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
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  MessageOutlined,
  CloudUploadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined as CommitIcon,
  GlobalOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  AudioOutlined,
  HourglassOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  WarningOutlined,
  FolderOpenOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileSearchOutlined
} from "@ant-design/icons";
import "./VentureDashboard.css";

// --- 微型 SVG 雷达图组件 ---
const RadarChart = ({ data, size = 180 }) => {
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const r = (d.value / 100) * (size / 2);
    return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`;
  }).join(" ");

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {gridLevels.map((lvl, idx) => (
        <circle key={idx} cx={size / 2} cy={size / 2} r={(size / 2) * lvl} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
      ))}
      {[0, 60, 120, 180, 240, 300].map(angle => (
        <line key={angle} x1={size / 2} x2={size / 2 + (size / 2) * Math.cos((angle * Math.PI) / 180)} y1={size / 2} y2={size / 2 + (size / 2) * Math.sin((angle * Math.PI) / 180)} stroke="#e2e8f0" />
      ))}
      <polygon points={points} fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const x = size / 2 + (size / 2 + 15) * Math.cos(angle);
        const y = size / 2 + (size / 2 + 15) * Math.sin(angle);
        return <text key={i} x={x} y={y} textAnchor="middle" className="text-[9px] font-black fill-slate-400 uppercase tracking-tighter">{d.label}</text>;
      })}
    </svg>
  );
};

const StudentWorkspace = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activePage, setActivePage] = useState("chat");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [syncData, setSyncData] = useState({
    projects: [], deadlines: [], evolution_logs: [], members: [], commits: []
  });

  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [chatLog, setChatLog] = useState([]);

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [showLogModal, setShowLogModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeReview, setActiveReview] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [newLogContent, setNewLogContent] = useState("");

  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showReviewSettingsModal, setShowReviewSettingsModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState("互联网+");
  
  const [activeFileUrl, setActiveFileUrl] = useState(null);
  
  const [financeForm, setFinanceForm] = useState({ cac: 50, price: 99, fixed: 10000 });
  const [pitchTime, setPitchTime] = useState(300);
  const [isPitching, setIsPitching] = useState(false);
  
  useEffect(() => {
    let timer;
    if (isPitching && pitchTime > 0) {
      timer = setInterval(() => setPitchTime(t => t - 1), 1000);
    } else if (pitchTime === 0) {
      setIsPitching(false);
    }
    return () => clearInterval(timer);
  }, [isPitching, pitchTime]);

  const currentBEP = financeForm.price > financeForm.cac 
    ? Math.ceil(financeForm.fixed / (financeForm.price - financeForm.cac)) 
    : "无法盈利";

  const [currentStep, setCurrentStep] = useState(0);
  const [formError, setFormError] = useState("");
  const [projectForm, setProjectForm] = useState({
    name: '', competition: '互联网+', track: '高教主赛道', college: '', advisorName: '', advisorInfo: '', members: []
  });

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectTitle, setEditProjectTitle] = useState("");

  const radarData = [
    { label: '创新性', value: 85 }, { label: '落地性', value: 70 }, { label: '技术力', value: 90 },
    { label: '团队契合', value: 75 }, { label: '市场潜力', value: 80 }, { label: '合规性', value: 95 }
  ];

  const fetchDashboardData = async () => {
    const username = localStorage.getItem("va_username") || "1120230571";
    try {
      const res = await fetch(`http://localhost:8000/api/sync/dashboard?user_id=${username}`);
      const data = await res.json();
      setSyncData(data);
      if (activeProjectId) {
        const curProj = data.projects.find(p => p.id === activeProjectId);
        if (curProj) setEditorContent(curProj.content || "");
        
        const curFiles = data.project_files ? data.project_files.filter(f => f.project_id === activeProjectId) : [];
        if (curFiles.length > 0) setActiveFileUrl(curFiles[0].file_url);
        else setActiveFileUrl(null);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const initData = async () => {
      const username = localStorage.getItem("va_username") || "1120230571";
      await fetchDashboardData();
      try {
        const res = await fetch(`http://localhost:8000/api/conversations?user_id=${username}`);
        const convs = await res.json();
        if (convs.length > 0) {
          setHistory(convs);
          handleSessionSwitch(convs[0].id);
        } else { handleNewChat(); }
      } catch (e) { console.error(e); }
    };
    initData();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      const proj = syncData.projects.find(p => p.id === activeProjectId);
      setEditorContent(proj?.content || "");
    }
  }, [activeProjectId]);

  const handleNewChat = async () => {
    const username = localStorage.getItem("va_username") || "1120230571";
    const newId = `va_session_${username}_${Date.now()}`;
    const greeting = '你好！我是你的项目助手。今天有什么新灵感或者进展想聊聊吗？';
    try {
      await fetch("http://localhost:8000/api/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, user_id: username, title: '新灵感会话', greeting })
      });
      setHistory(prev => [{ id: newId, title: '新灵感会话' }, ...prev]);
      setActiveSessionId(newId);
      setChatLog([{ role: 'coach', agent: '系统助手', text: greeting }]);
    } catch (e) { console.error(e); }
  };

  const handleSessionSwitch = async (id) => {
    setActiveSessionId(id);
    try {
      const res = await fetch(`http://localhost:8000/api/conversations/${id}/messages`);
      const msgs = await res.json();
      setChatLog(msgs);
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const userMsg = { role: 'user', text: inputValue };
    setChatLog(prev => [...prev, userMsg]);
    setInputValue("");
    setIsSending(true);
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue, session_id: activeSessionId })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { role: 'coach', agent: data.agent, text: data.reply }]);
    } catch (e) {
      setChatLog(prev => [...prev, { role: 'coach', agent: '系统助手', text: '抱歉，导师暂时连不上线。' }]);
    } finally { setIsSending(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const saveContent = async (content) => {
    if (!activeProjectId) return;
    setIsSaving(true);
    try {
      await fetch(`http://localhost:8000/api/projects/${activeProjectId}/content`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      setSyncData(prev => ({
        ...prev, projects: prev.projects.map(p => p.id === activeProjectId ? { ...p, content } : p)
      }));
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    if (activeProjectId) formData.append("project_id", activeProjectId);
    const hide = message.loading('解析中...', 0);
    try {
      const res = await fetch("http://localhost:8000/api/projects/import", { method: "POST", body: formData });
      const data = await res.json();
      hide();
      if (data.text) {
        setEditorContent(data.text);
        setActiveFileUrl(data.file_url);
        if (activeProjectId) {
           await saveContent(data.text);
           await fetchDashboardData();
        }
        setActivePage('editor');
        setShowImportModal(false);
        message.success(`解析原件并保留: ${data.filename}`);
      } else { message.error(data.error || "解析失败"); }
    } catch (err) { hide(); message.error("文件上传失败"); }
  };

  const isNumeric = (str) => /^\d+$/.test(str.trim());
  const isValidStr = (str) => str.trim().length >= 2 && !isNumeric(str);

  const validateCurrentStep = () => {
    setFormError("");
    if (currentStep === 0) {
      if (!projectForm.name.trim()) return "项目名称不能为空";
      if (!isValidStr(projectForm.name)) return "项目名称无效（须不少于2个字且不能纯数字）";
    }
    if (currentStep === 1) {
      if (!projectForm.college.trim()) return "学院/书院不能为空";
      if (!isValidStr(projectForm.college)) return "学院名称无效（例如不能只填'1'，须不少于2个字）";
      if (!projectForm.advisorName.trim()) return "指导老师不能为空";
      if (!isValidStr(projectForm.advisorName)) return "老师姓名无效";
    }
    if (currentStep === 2) {
      for (let m of projectForm.members) {
        if (!m.name.trim()) return "团队成员姓名不能为空";
        if (!isValidStr(m.name)) return `成员姓名无效`;
        if (m.student_id && isNumeric(m.student_id) && m.student_id.length < 5) return `学号 [${m.student_id}] 格式不正确`;
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateCurrentStep();
    if (err) { setFormError(err); return; }
    setCurrentStep(currentStep + 1);
  };

  const handleCreateProject = async () => {
    const err = validateCurrentStep();
    if (err) { setFormError(err); return; }

    setIsSaving(true);
    try {
      const resp = await fetch('http://localhost:8000/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...projectForm, content: editorContent, owner_id: localStorage.getItem('va_username') || '1120230571' })
      });
      if (resp.ok) {
        const result = await resp.json();
        message.success('项目申报成功！');
        setShowNewProjectModal(false);
        setCurrentStep(0);
        await fetchDashboardData();
        if (result.project_id) { setActiveProjectId(result.project_id); setActivePage('editor'); }
      } else {
        const data = await resp.json();
        setFormError(data.detail || "后端服务响应错误，请检查输入任务进展同步");
      }
    } catch (err) {
      console.error(err);
      setFormError("网络连接失败，请确保后台 API 服务已启动任务进展同步");
    } finally { setIsSaving(false); }
  };

  const handleRenameProject = async () => {
    if (!editProjectTitle.trim() || !editingProjectId) return;
    try {
      await fetch(`http://localhost:8000/api/projects/${editingProjectId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editProjectTitle })
      });
      setSyncData(prev => ({
        ...prev, projects: prev.projects.map(p => p.id === editingProjectId ? { ...p, name: editProjectTitle } : p)
      }));
      setEditingProjectId(null);
      message.success("重命名成功。");
    } catch (e) { console.error(e); }
  };

  const handleDeleteProject = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/projects/${id}`, { method: 'DELETE' });
      if (activeProjectId === id) { setActiveProjectId(null); setEditorContent(""); }
      await fetchDashboardData();
      message.success("项目已删除。");
    } catch (e) { console.error(e); }
  };

  const handleEditMembers = () => {
    if (!activeProjectId) return;
    const proj = syncData.projects.find(p => p.id === activeProjectId);
    const members = syncData.members.filter(m => m.project_id === activeProjectId && m.role !== 'Advisor');
    setProjectForm({
      id: proj.id,
      name: proj.name,
      competition: proj.competition,
      track: proj.track,
      college: proj.college,
      advisorName: proj.advisor_name,
      advisorInfo: proj.advisor_info,
      members: members.map(m => ({ ...m, student_id: m.student_id || '' }))
    });
    setCurrentStep(2); // 直接跳转到核心团队录入
    setShowNewProjectModal(true);
  };

  const handleAddLog = async () => {
    if (!newLogContent.trim() || !activeProjectId) return;
    try {
      await fetch(`http://localhost:8000/api/projects/${activeProjectId}/commits`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newLogContent, author: localStorage.getItem('va_username') || 'Student' })
      });
      setNewLogContent("");
      message.success("提交成功。");
      await fetchDashboardData();
    } catch (e) { console.error(e); }
  };

  const handleRequestReview = async () => {
    if (!activeProjectId) return;
    setIsReviewing(true);
    setShowReviewModal(true);
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${activeProjectId}/review`, { method: 'POST' });
      const data = await res.json();
      setActiveReview(data.review);
    } catch (e) { console.error(e); } finally { setIsReviewing(false); }
  };

  const addMember = () => { setProjectForm({ ...projectForm, members: [...projectForm.members, { name: '', student_id: '', role: 'Member', position: '队员', college: '', major: '', grade: '', info: '' }] }); };
  const updateMember = (idx, field, val) => {
    const newMembers = [...projectForm.members];
    newMembers[idx][field] = val;
    setProjectForm({ ...projectForm, members: newMembers });
  };

  const handleExportFile = () => {
    if (!editorContent) {
      message.warning("当前编辑器没有内容可供导出");
      return;
    }
    Modal.confirm({
      title: '导出前请确认保存',
      description: '导出前，请确保您在编辑器内的修改已经手动点击“手动保存”按钮。',
      okText: '已确认保存，导出预览',
      cancelText: '取消并去保存',
      centered: true,
      okButtonProps: { className: "bg-indigo-600 border-none font-bold" },
      onOk: () => {
        const element = document.createElement("a");
        const file = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        const activeProject = syncData.projects.find(p => p.id === activeProjectId);
        element.download = activeProject ? `${activeProject.name}_导出文本.txt` : "未命名项目草稿_导出文本.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        message.success("项目文档导出成功！");
      }
    });
  };

  const highlightKeyword = (text) => {
    if (!text) return "";
    return text.toString().split(/(立项|截止)/g).map((part, i) =>
      (part === '立项' || part === '截止') ? <b key={i} className="text-blue-600 underline underline-offset-4 decoration-2 decoration-blue-200">{part}</b> : part
    );
  };

  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

  const notificationContent = (
    <div className="w-80">
      <List size="small" dataSource={[{ title: '项目初审结果已出', time: '2小时前' }, { title: '您的指导老师修改了计划书', time: '5小时前' }]} renderItem={item => (
        <List.Item className="cursor-pointer hover:bg-slate-50 border-none px-4 py-3 rounded-xl">
          <div className="flex flex-col gap-1 w-full"><div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-800">{item.title}</span><Badge status="processing" size="small" /></div><span className="text-[10px] text-slate-400 font-bold">{item.time}</span></div>
        </List.Item>
      )} />
      <Divider className="my-2" />
      <Button type="link" block size="small" className="text-[10px] font-black">查看全部系统消息</Button>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { primaryColor: '#2563eb', borderRadius: 16 } }}>
      <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden font-['Inter', 'Outfit', sans-serif]">

        {/* Sidebar Nav */}
        <nav className="nav-rail flex-none z-50">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 cursor-pointer hover:scale-105 transition-transform"><RocketOutlined className="text-white text-2xl" /></div>
          <div className="flex flex-col gap-6 flex-1 w-full px-2">
            <div onClick={() => setActivePage('chat')} className={`nav-item ${activePage === 'chat' ? 'active' : ''}`}>
              <MessageOutlined className="text-xl" /><div className="nav-label"><span>灵感空间</span><span className="en">COACH</span></div>
            </div>
            <div onClick={() => setActivePage('editor')} className={`nav-item ${activePage === 'editor' ? 'active' : ''}`}>
              <FileTextOutlined className="text-xl" /><div className="nav-label"><span>项目管理</span><span className="en">PROJECT</span></div>
            </div>
            <div onClick={() => setActivePage('collab')} className={`nav-item ${activePage === 'collab' ? 'active' : ''}`}>
              <TeamOutlined className="text-xl" /><div className="nav-label"><span>协作中心</span><span className="en">COLLAB</span></div>
            </div>
          </div>
          <Avatar onClick={() => setShowProfileModal(true)} size={44} className="cursor-pointer border-2 border-slate-700 hover:border-blue-400 transition-all shadow-md mb-2" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
        </nav>

        {/* List Sidebar */}
        <aside className="w-72 h-full bg-[#fcfcfd] border-r border-[#f1f3f5] flex flex-col flex-none">
          <div className="p-6">
            {activePage === 'chat' ? (
              <div className="flex flex-col gap-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><HistoryOutlined /> Talk History</h2>
                <Button onClick={handleNewChat} type="primary" block shape="round" icon={<PlusOutlined />} className="h-10 text-[11px] font-black bg-blue-600 border-none shadow-lg shadow-blue-500/20">新建对话</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileTextOutlined /> Project Center</h2>
                <div className="flex flex-col gap-3 w-full">
                  <Button onClick={() => setShowNewProjectModal(true)} block shape="round" className="btn-new-chat h-11">发起项目</Button>
                  <Button onClick={() => setShowImportModal(true)} block shape="round" className="btn-import-project h-11">导入项目</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar space-y-1.5">
            {activePage === 'chat' ? (
              history.map(s => (
                <div key={s.id} onClick={() => handleSessionSwitch(s.id)} className={`group p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${activeSessionId === s.id ? 'bg-white shadow-xl shadow-slate-200/50 border-blue-50' : 'hover:bg-slate-50 border-transparent'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageOutlined className={activeSessionId === s.id ? 'text-blue-500' : 'text-slate-300'} />
                    <span className={`text-[11px] font-bold truncate ${activeSessionId === s.id ? 'text-slate-900' : 'text-slate-500'}`}>{s.title}</span>
                  </div>
                </div>
              ))
            ) : (
              (syncData.projects || []).map(p => (
                <div key={p.id} onClick={() => { if (editingProjectId !== p.id) setActiveProjectId(p.id); }} className={`p-4 group rounded-3xl cursor-pointer transition-all border flex flex-col gap-1 ${activeProjectId === p.id ? 'bg-white shadow-xl shadow-indigo-200/30 border-2 border-indigo-50 border-l-4 border-l-indigo-600' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    {editingProjectId === p.id ? (
                      <Input autoFocus size="small" value={editProjectTitle} onChange={e => setEditProjectTitle(e.target.value)} onBlur={handleRenameProject} onPressEnter={handleRenameProject} className="text-[11px] font-black h-6 p-1 border-none bg-indigo-50/50 rounded" />
                    ) : (
                      <span className={`text-[11px] font-black truncate flex-1 ${activeProjectId === p.id ? 'text-indigo-950' : 'text-slate-500'}`}>{p.name}</span>
                    )}
                    <div className={`flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${editingProjectId === p.id ? 'hidden' : ''}`}>
                      <EditOutlined onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setEditProjectTitle(p.name); }} className="text-slate-300 hover:text-indigo-500 transition-colors text-xs" />
                      <Popconfirm title="确定删除该项目吗？" description="关联的成员与日志将永久移除。" onConfirm={() => handleDeleteProject(p.id)} okText="确定" cancelText="取消">
                        <DeleteOutlined onClick={(e) => e.stopPropagation()} className="text-slate-300 hover:text-rose-500 transition-colors text-xs" />
                      </Popconfirm>
                    </div>
                    {!editingProjectId && <Badge dot color={p.status === 'active' ? '#10b981' : '#fbbf24'} className={activeProjectId === p.id ? 'ml-2' : 'hidden group-hover:hidden'} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <header className="h-16 border-b border-[#f1f3f5] px-8 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex flex-col"><span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">{activePage === 'chat' ? 'Venture Agent AI' : activePage === 'editor' ? 'Venture Dashboard' : 'Team Hub'}</span><span className="text-xs font-bold text-slate-400">{activePage === 'chat' ? '灵感辅导中' : activePage === 'editor' ? '项目管控中' : '跨界协作中'}</span></div>
            <Popover content={notificationContent} title={<span className="font-black text-sm">通知中心</span>} trigger="click" placement="bottomRight">
              <Badge count={2} size="small" offset={[-2, 6]}><Button type="text" icon={<BellOutlined className="text-slate-400 text-lg" />} /></Badge>
            </Popover>
          </header>
          {activePage === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar"><div className="max-w-3xl mx-auto space-y-10">{chatLog.map((m, i) => (<div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`flex gap-4 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}><Avatar className="shadow-sm" style={{ backgroundColor: m.role === 'coach' ? '#2563eb' : '#f4f4f5' }} icon={m.role === 'coach' ? <RocketOutlined /> : <UserOutlined />} /><div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>{m.role === 'coach' && <span className="text-[10px] font-black text-blue-500 px-2 bg-blue-50 rounded-lg">{m.agent}</span>}<div className={`message-bubble ${m.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>{m.role === 'coach' ? <ReactMarkdown>{m.text}</ReactMarkdown> : <p className="m-0 font-medium">{m.text}</p>}</div></div></div></div>))}{isSending && <div className="text-[10px] text-slate-400 animate-pulse ml-12">导师正在深度解析中...</div>}<div ref={messagesEndRef} /></div></div>
              <div className="p-8 h-[140px] flex items-center"><div className="max-w-3xl mx-auto w-full relative"><div className="bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden focus-within:shadow-xl transition-all"><textarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent border-none p-5 outline-none resize-none text-sm" placeholder="输入想法..." rows={1} /><div className="absolute right-4 bottom-4"><Button onClick={handleSend} disabled={isSending || !inputValue.trim()} type="primary" shape="circle" icon={<SendOutlined />} /></div></div></div></div>
            </>
          ) : activePage === 'editor' ? (
            <div className="flex-1 flex flex-col bg-[#fcfcfd] overflow-y-auto custom-scrollbar">
              <header className="h-20 border-b border-gray-100 px-8 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                <div className="flex flex-col"><h2 className="text-[14px] font-black text-indigo-500 uppercase tracking-[0.2em] m-0">Venture Editor</h2><span className="text-[9px] text-slate-300 font-bold uppercase">{activeProjectId ? 'Project Editing' : 'Draft Preparation'}</span></div>
                <div className="flex gap-3">
                  <Button onClick={handleExportFile} type="primary" shape="round" className="h-10 px-10 font-black bg-indigo-600 border-none shadow-lg shadow-indigo-200">导出预览</Button>
                </div>
              </header>
              <div className="flex-1 p-10">
                {(activeProjectId || editorContent) ? (
                  <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
                    <div className="grid grid-cols-4 gap-4">
                      <div onClick={() => setShowLogModal(true)} className="group p-6 rounded-[32px] bg-white border-2 border-transparent hover:border-purple-200 shadow-xl shadow-slate-200/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center h-36">
                        <div className="w-12 h-12 rounded-[20px] bg-purple-50 text-purple-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform"><CommitIcon /></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[13px] font-black text-slate-800">项目进度日志</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Commit Logs</span></div>
                      </div>
                      <div onClick={() => setShowReviewSettingsModal(true)} className="group p-6 rounded-[32px] bg-white border-2 border-transparent hover:border-amber-200 shadow-xl shadow-slate-200/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center h-36">
                        <div className="w-12 h-12 rounded-[20px] bg-amber-50 text-amber-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform"><BulbOutlined /></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[13px] font-black text-slate-800">深度诊断评估</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">AI Review</span></div>
                      </div>
                      <div onClick={() => setShowFinanceModal(true)} className="group p-6 rounded-[32px] bg-white border-2 border-transparent hover:border-emerald-200 shadow-xl shadow-slate-200/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center h-36">
                        <div className="w-12 h-12 rounded-[20px] bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform"><LineChartOutlined /></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[13px] font-black text-slate-800">简易财务推演</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Finance Calc</span></div>
                      </div>
                      <div onClick={() => { setPitchTime(300); setIsPitching(false); setShowPitchModal(true); }} className="group p-6 rounded-[32px] bg-white border-2 border-transparent hover:border-rose-200 shadow-xl shadow-slate-200/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center h-36">
                        <div className="w-12 h-12 rounded-[20px] bg-rose-50 text-rose-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform"><AudioOutlined /></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[13px] font-black text-slate-800">全真路演模拟</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Pitch Mock</span></div>
                      </div>
                    </div>

                    <div className="flex h-full min-h-[700px] gap-6 editor-surface bg-transparent border-none shadow-none">
                      {/* Left: Editor */}
                      <div className="flex-1 bg-white border border-slate-100 rounded-[40px] shadow-sm relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/10 z-0"></div>
                        <div className="flex-1 p-10 z-10 flex flex-col">
                          {editorContent ? (
                            <div className="prose prose-slate max-w-none flex-1 flex flex-col h-full">
                              <div className="flex justify-between items-center mb-6 shrink-0">
                                <h1 className="text-2xl font-black m-0 text-slate-800 flex items-center gap-3"><FileTextOutlined className="text-indigo-600" /> 项目计划书正文</h1>
                                <div className="flex items-center gap-2">
                                  {isSaving && <span className="text-[10px] text-indigo-400 font-black animate-pulse uppercase">Cloud Saving...</span>}
                                  <Button onClick={() => saveContent(editorContent)} icon={<CloudUploadOutlined />} shape="round" type="text" className="text-[11px] font-black text-slate-400">手动保存</Button>
                                </div>
                              </div>
                              <textarea
                                className="w-full flex-1 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 text-sm leading-relaxed text-slate-600 font-medium resize-none outline-none focus:border-indigo-300 transition-all custom-scrollbar min-h-[500px]"
                                value={editorContent} onChange={e => setEditorContent(e.target.value)} placeholder="在此编辑您的项目计划书..."
                              />
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-8">
                              <div className="w-24 h-24 bg-slate-50 rounded-[35%] flex items-center justify-center text-slate-200 text-5xl animate-pulse shadow-inner"><FileTextOutlined /></div>
                              <div className="space-y-3"><h3 className="text-2xl font-black text-slate-800 tracking-tight">Venture Editor - 创作空间</h3><p className="max-w-md text-sm font-bold text-slate-400 leading-relaxed mx-auto">请在左侧选择对应项目，或直接导入 PDF/DOCX 文件。我们将为您保留每个项目的专属创作状态。</p></div>
                              <Button onClick={() => fileInputRef.current?.click()} size="large" shape="round" className="h-14 px-10 font-black border-2 border-indigo-100 text-indigo-600 bg-white hover:shadow-xl transition-all">快速导入解析</Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: File Viewer */}
                      {(activeProjectId || editorContent) && (
                        <div className="w-[450px] bg-slate-50 border border-slate-200 rounded-[40px] shadow-inner flex flex-col overflow-hidden shrink-0">
                          <div className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
                            <span className="text-xs font-black text-slate-700 flex items-center gap-2"><FolderOpenOutlined className="text-indigo-500 text-lg" /> 远端归档附录</span>
                            <Button onClick={() => fileInputRef.current?.click()} size="small" type="dashed" shape="round" icon={<CloudUploadOutlined className="text-indigo-500" />} className="text-[10px] font-bold text-slate-500 border-indigo-200 hover:border-indigo-400 bg-slate-50">新增附件</Button>
                          </div>
                          <div className="bg-white p-3 border-b border-slate-100 flex gap-3 overflow-x-auto custom-scrollbar shrink-0 h-[60px] items-center">
                            {(!activeProjectId && activeFileUrl) && (
                              <div className="shrink-0 max-w-[120px] px-4 py-1.5 bg-indigo-50 border border-indigo-200 rounded-2xl cursor-pointer flex items-center gap-2 shadow-sm">
                                <FilePdfOutlined className="text-indigo-600 text-[12px]" />
                                <span className="text-[10px] font-bold text-indigo-700 truncate">当前草稿附件</span>
                              </div>
                            )}
                            {activeProjectId && (syncData.project_files || []).filter(f => f.project_id === activeProjectId).map((f, i) => (
                              <div key={i} onClick={() => setActiveFileUrl(f.file_url)} className={`shrink-0 max-w-[150px] px-3 py-1.5 border rounded-2xl cursor-pointer flex flex-col gap-0.5 transition-all ${activeFileUrl === f.file_url ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  {f.filename.endsWith('.pdf') ? <FilePdfOutlined className={activeFileUrl === f.file_url ? 'text-indigo-600 text-[12px]' : 'text-slate-400 text-[12px]'} /> : <FileWordOutlined className={activeFileUrl === f.file_url ? 'text-blue-500 text-[12px]' : 'text-slate-400 text-[12px]'} />}
                                  <span className={`text-[10px] font-bold truncate flex-1 ${activeFileUrl === f.file_url ? 'text-indigo-700' : 'text-slate-500'}`} title={f.filename}>{f.filename}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 bg-slate-100 relative">
                            {activeFileUrl ? (
                              <iframe src={activeFileUrl} className="w-full h-full border-none" title="Document Preview" />
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                                <FileSearchOutlined className="text-5xl" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-center px-8">选择上方附件原档以开启高保真预览</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6 py-20 px-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl text-slate-300"><RocketOutlined /></div>
                  <p className="font-black text-slate-400 uppercase tracking-widest text-[11px]">Select or Create a Project to Start</p>
                </div>}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-[#fcfcfd] overflow-y-auto custom-scrollbar p-10 gap-8">
              {/* Top Metrics Area */}
              <div className="grid grid-cols-3 gap-6 animate-slide-up">
                <div className="bg-gradient-to-br from-indigo-500 justify-between to-blue-600 p-6 rounded-[32px] text-white flex flex-col gap-4 shadow-xl shadow-indigo-200">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl"><TeamOutlined /></div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                  </div>
                  <div><h3 className="text-3xl font-black m-0">{(syncData.members || []).filter(m => !activeProjectId || m.project_id === activeProjectId).length || 3}</h3><p className="text-blue-100 text-xs font-bold uppercase tracking-widest m-0">Team Members</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 shadow-sm group hover:shadow-xl hover:shadow-emerald-100 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"><CheckCircleOutlined /></div>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Done</span>
                  </div>
                  <div><h3 className="text-3xl font-black text-slate-800 m-0">12</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest m-0">Completed Tasks</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 shadow-sm group hover:shadow-xl hover:shadow-rose-100 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"><ClockCircleOutlined /></div>
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Impending</span>
                  </div>
                  <div><h3 className="text-3xl font-black text-slate-800 m-0">3</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest m-0">Upcoming DDLs</p></div>
                </div>
              </div>

              {/* Kanban Board Area */}
              <div className="flex-1 min-h-[500px] flex gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {/* To-Do */}
                <div className="flex-1 bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-center"><h4 className="text-[13px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div>待办计划</h4><span className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-xs font-black shadow-sm text-slate-500">2</span></div>
                  <div className="space-y-3">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-grab">
                      <p className="font-bold text-slate-800 text-sm mb-3">完善商业模式画布 (BMC)</p>
                      <div className="flex justify-between items-center"><Avatar.Group size="small"><Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" /><Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" /></Avatar.Group><span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">High</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-grab">
                      <p className="font-bold text-slate-800 text-sm mb-3">调研竞品分析数据</p>
                      <div className="flex justify-between items-center"><Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" size="small" /><span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Medium</span></div>
                    </div>
                  </div>
                  <Button type="dashed" className="w-full h-12 rounded-2xl text-slate-400 font-bold border-slate-200 mt-2 bg-transparent hover:bg-slate-50">添加新任务</Button>
                </div>
                {/* In Progress */}
                <div className="flex-1 bg-indigo-50/30 rounded-[32px] p-6 border border-indigo-100/50 flex flex-col gap-4">
                  <div className="flex justify-between items-center"><h4 className="text-[13px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>研发推进中</h4><span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-600">1</span></div>
                  <div className="space-y-3">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-300 transition-shadow cursor-grab relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                      <p className="font-bold text-slate-800 text-sm mb-3 mt-1">结合 AI 诊断修改计划书中“市场痛点”章节</p>
                      <div className="flex justify-between items-center"><Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" size="small" /><span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1"><ClockCircleOutlined /> 今天截止</span></div>
                    </div>
                  </div>
                </div>
                {/* Done */}
                <div className="flex-1 bg-emerald-50/30 rounded-[32px] p-6 border border-emerald-100/50 flex flex-col gap-4">
                  <div className="flex justify-between items-center"><h4 className="text-[13px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>已归档节点</h4><span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-600">3</span></div>
                  <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="bg-white p-5 rounded-3xl border border-emerald-100 cursor-default">
                      <p className="font-bold text-slate-500 text-sm mb-3 line-through decoration-slate-300">完成第一版初稿导入解析</p>
                      <div className="flex justify-between items-center text-emerald-500 text-sm"><CheckCircleOutlined /> <span className="text-[10px] font-black text-slate-400">昨天完成</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-emerald-100 cursor-default">
                      <p className="font-bold text-slate-500 text-sm mb-3 line-through decoration-slate-300">确立项目指导导师信息</p>
                      <div className="flex justify-between items-center text-emerald-500 text-sm"><CheckCircleOutlined /> <span className="text-[10px] font-black text-slate-400">2天前</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Console Column - Context Aware */}
        <section className="w-[360px] bg-[#fcfcfd] border-l border-gray-100 p-8 flex flex-col gap-8 flex-none overflow-y-auto custom-scrollbar">
          {activePage === 'chat' ? (
            <>
              <div className="console-card animate-slide-in">
                <h3 className="text-[12px] font-black text-slate-700 uppercase mb-5 tracking-widest flex items-center gap-2"><CalendarOutlined className="text-blue-500" /> 全局项目 DDL</h3>
                <div className="space-y-3">
                  {(syncData.deadlines || []).slice(0, 4).map((d, i) => (
                    <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all cursor-default">
                      <div className={`w-1.5 h-12 rounded-full ${d.title?.includes('立项') ? 'bg-blue-400' : d.title?.includes('截止') ? 'bg-rose-400' : 'bg-amber-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5"><p className="text-[11px] font-black text-slate-800 m-0 truncate leading-none">{highlightKeyword(d.title)}</p></div>
                        <div className="flex flex-col gap-0.5"><div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold"><EnvironmentOutlined className="text-[8px]" /> {d.project_name || '未归类项目'}</div><p className="text-[10px] text-slate-400 font-black m-0">{d.due_date}</p></div>
                      </div>
                    </div>
                  ))}
                  {(!syncData.deadlines || syncData.deadlines.length === 0) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No DDL Found</span>} />}
                </div>
              </div>
              <div className="console-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-[12px] font-black text-slate-700 uppercase mb-7 tracking-widest flex items-center gap-2"><RadarChartOutlined className="text-indigo-500" /> 灵感能力画像</h3>
                <div className="flex justify-center py-4"><RadarChart data={radarData} /></div>
              </div>
              <div className="console-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-[12px] font-black text-slate-700 uppercase mb-4 tracking-widest flex items-center gap-2"><HistoryOutlined className="text-purple-500" /> 最近演进记录</h3>
                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <Timeline size="small" className="tiny-timeline antique-timeline">
                    {[...(syncData.evolution_logs || []), ...(syncData.commits || []).map(c => ({ event: `提交更新: ${c.content?.slice(0, 15)}...`, timestamp: c.timestamp }))]
                      .sort((a, b) => dayjs(b.timestamp).unix() - dayjs(a.timestamp).unix()).slice(0, 10).map((l, i) => (
                        <Timeline.Item key={i} color={l.event?.includes('提交') ? 'purple' : 'blue'}><div className="flex flex-col gap-0.5"><span className="text-[10px] text-slate-500 font-bold leading-tight">{l.event}</span><span className="text-[8px] text-slate-300 font-black">{dayjs(l.timestamp).format('MM-DD HH:mm')}</span></div></Timeline.Item>
                      ))}
                  </Timeline>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="console-card animate-slide-in">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><TeamOutlined className="text-indigo-500" /> 项目人员管理</h3>
                  <Button onClick={handleEditMembers} size="small" type="text" icon={<EditOutlined className="text-indigo-600" />} className="bg-indigo-50/50 hover:bg-indigo-100 rounded-lg text-[10px] font-black">管理</Button>
                </div>
                <div className="space-y-3.5">
                  {(syncData.members || []).filter(m => !activeProjectId || m.project_id === activeProjectId).map((member, idx) => (
                    <Popover key={idx} trigger="click" placement="left" title={<span className="font-black text-sm">组织架构深度透视</span>} content={<div className="w-72 space-y-4 p-2"><div className="flex flex-col gap-2 p-4 bg-indigo-50/50 rounded-[24px] border border-indigo-100/50"><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">学号 / 代码</span><span className="text-[11px] font-bold text-indigo-600">{member.student_id || '---'}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">所属组织</span><span className="text-[11px] font-bold text-indigo-600">{member.college || '---'}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">专业 Major</span><span className="text-[11px] font-bold text-indigo-600">{member.major || '---'}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">年级 Grade</span><span className="text-[11px] font-bold text-indigo-600">{member.grade || '---'}</span></div></div><div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">核心职责 Position</p><p className="text-[12px] text-slate-600 font-bold m-0">{member.position || '暂未分配具体任务'}</p></div></div>}>
                      <div className={`flex items-center gap-4 p-4 rounded-[28px] border transition-all cursor-pointer group ${member.role === 'Advisor' ? 'bg-indigo-900 border-indigo-950 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'}`}>
                        <Avatar size={48} className={`shadow-sm group-hover:scale-105 transition-transform ${member.role === 'Advisor' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300'}`} icon={member.role === 'Advisor' ? <RobotOutlined /> : <UserOutlined />} />
                        <div className="flex-1 min-w-0"><p className={`text-[14px] font-black truncate mb-0.5 ${member.role === 'Advisor' ? 'text-indigo-50' : 'text-slate-800'}`}>{member.name}</p><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${member.role === 'Leader' ? 'bg-amber-50 text-amber-600 shadow-sm shadow-amber-100/50' : member.role === 'Advisor' ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-50 text-slate-400'}`}>{member.role === 'Leader' ? '项目总负责人' : member.role === 'Advisor' ? '官方指导教师' : '核心执行成员'}</span></div>
                      </div>
                    </Popover>
                  ))}
                  {(syncData.members || []).filter(m => !activeProjectId || m.project_id === activeProjectId).length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[10px] text-slate-300 font-bold">No Members</span>} />}
                </div>
              </div>
              <div className="console-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-[12px] font-black text-slate-700 uppercase mb-5 tracking-widest flex items-center gap-2"><GlobalOutlined className="text-emerald-500" /> 指导导师寄语</h3>
                {activeProjectId && syncData.projects.find(p => p.id === activeProjectId) ? (
                  <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-white rounded-[32px] border border-emerald-100 flex flex-col gap-2 shadow-sm">
                    <p className="text-[18px] font-black text-slate-800 mb-0">{syncData.projects.find(p => p.id === activeProjectId)?.advisor_name}</p>
                    <p className="text-[10px] text-emerald-600 font-black mb-3 uppercase tracking-[0.2em] bg-emerald-100/30 w-fit px-2 rounded-lg">Official Mentor</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-emerald-200 pl-3">"{syncData.projects.find(p => p.id === activeProjectId)?.advisor_info}"</p>
                  </div>
                ) : (<div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center"><span className="text-slate-200 font-black text-[10px] uppercase tracking-[0.3em]">Pending Advisor</span></div>)}
              </div>
            </>
          )}
        </section>

        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileImport} />

        {/* --- 大气版项目日志已 Modal --- */}
        <Modal title={null} open={showLogModal} onCancel={() => setShowLogModal(false)} footer={null} centered width={800} className="lofty-modal no-border-modal">
          <div className="p-10 space-y-8">
            <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-3xl bg-purple-600 flex items-center justify-center text-white text-3xl shadow-xl shadow-purple-200"><CommitIcon /></div><div><h2 className="text-2xl font-black text-slate-800 m-0">项目进度日志</h2><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Commit History & Progress Tracking</p></div></div>
            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col gap-4">
              <Input.TextArea autoSize={{ minRows: 3 }} placeholder="记录下本次迭代的核心变动或获得的突破性进展..." value={newLogContent} onChange={e => setNewLogContent(e.target.value)} className="rounded-3xl p-6 text-sm border-none shadow-inner bg-white" />
              <Button onClick={handleAddLog} type="primary" size="large" shape="round" className="w-fit self-end bg-purple-600 border-none px-10 font-black h-12 shadow-lg shadow-purple-100">提交当前进度 (Commit)</Button>
            </div>
            <Divider className="border-slate-100" />
            <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              <Timeline mode="left" className="commit-timeline-large">
                {(syncData.commits || []).filter(c => c.project_id === activeProjectId).map((c, i) => (
                  <Timeline.Item key={i} color="purple">
                    <div className="flex flex-col bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-3"><span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full">@{c.author}</span><span className="text-[10px] text-slate-300 font-bold">{dayjs(c.timestamp).format('YYYY-MM-DD HH:mm:ss')}</span></div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed m-0">{c.content}</p>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        </Modal>

        {/* --- 大气版质量评审 Modal --- */}
        <Modal title={null} open={showReviewModal} onCancel={() => setShowReviewModal(false)} footer={null} centered width={800} className="lofty-modal no-border-modal">
          <div className="p-10 space-y-8">
            <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-3xl bg-amber-500 flex items-center justify-center text-white text-3xl shadow-xl shadow-amber-200"><BulbOutlined /></div><div><h2 className="text-2xl font-black text-slate-800 m-0">Venture AI 项目深度诊断与改写建议</h2><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">AI Diagnosis & Suggestions Report</p></div></div>
            <div className="bg-slate-900 rounded-[40px] p-10 relative overflow-hidden min-h-[500px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
              {isReviewing ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-6">
                  <RobotOutlined spin className="text-6xl text-amber-500" />
                  <p className="text-amber-100/50 font-black tracking-[0.2em] animate-pulse">正在利用大模型计算多维逻辑回路...</p>
                </div>
              ) : (
                <div className="review-content text-amber-50/90 leading-relaxed font-medium">
                  <ReactMarkdown>{activeReview}</ReactMarkdown>
                  <Divider className="border-white/10 my-8" />
                  <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-900/50 mb-6 flex items-start gap-3">
                    <span className="text-amber-500 mt-0.5">⚠️</span>
                    <span className="text-[11px] text-amber-200/70 font-medium leading-relaxed">以上评估大票由 Venture Agent AI 采用所选赛道（{selectedCompetition}）的底层逻辑模型自动推演生成。内容仅作为实战演练与逻辑排缺启发参考，不代表真实的官方赛事成绩承诺与最终裁判标准。</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-500 font-black uppercase">Insights powered by VentureAgent AI</span>
                    <Button onClick={() => { setShowReviewModal(false); setShowReviewSettingsModal(true); }} ghost shape="round" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">切换赛道重新诊断</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* --- 诊断赛道设置 Modal --- */}
        <Modal title={null} open={showReviewSettingsModal} onCancel={() => setShowReviewSettingsModal(false)} footer={null} centered width={500} className="premium-modal no-border-modal">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-[20px] bg-amber-50 flex items-center justify-center text-amber-500 text-2xl shadow-sm"><RobotOutlined /></div><div><h3 className="text-xl font-black text-slate-800 m-0">选择 AI 评估标准</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest m-0">Select Rubric Standard</p></div></div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">评级标准 (Competition Track)</label>
                <div className="flex flex-col gap-3 mt-2">
                  <div onClick={() => setSelectedCompetition("互联网+")} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedCompetition === "互联网+" ? "border-amber-400 bg-amber-50" : "border-slate-100 bg-white hover:border-slate-300"}`}>
                    <div className="flex justify-between items-center"><span className="text-sm font-black text-slate-800">🎖️ 中国国际大学生创新大赛 (原互联网+)</span>{selectedCompetition === "互联网+" && <CheckCircleOutlined className="text-amber-500" />}</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 mb-0">侧重：商业模式闭环、带动就业、财务营收真实性</p>
                  </div>
                  <div onClick={() => setSelectedCompetition("挑战杯")} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedCompetition === "挑战杯" ? "border-amber-400 bg-amber-50" : "border-slate-100 bg-white hover:border-slate-300"}`}>
                    <div className="flex justify-between items-center"><span className="text-sm font-black text-slate-800">🏆 挑战杯 全国大学生课外学术科技比赛</span>{selectedCompetition === "挑战杯" && <CheckCircleOutlined className="text-amber-500" />}</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 mb-0">侧重：学术深度、技术创新壁垒、社会调查严谨性</p>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={() => { setShowReviewSettingsModal(false); handleRequestReview(); }} type="primary" block shape="round" className="h-12 text-sm font-black bg-amber-500 text-white border-none shadow-lg shadow-amber-200 mt-4">注入所选规则并开始全面诊断</Button>
          </div>
        </Modal>

        {/* --- 简易财务推演 Modal --- */}
        <Modal title={null} open={showFinanceModal} onCancel={() => setShowFinanceModal(false)} footer={null} centered width={600} className="premium-modal no-border-modal">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-[20px] bg-emerald-50 flex items-center justify-center text-emerald-500 text-2xl shadow-sm"><LineChartOutlined /></div><div><h3 className="text-xl font-black text-slate-800 m-0">简易财务生存推演</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest m-0">Breakeven Point Calculator</p></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">月度固定成本 (Fixed Cost)</label><Input type="number" prefix="¥" value={financeForm.fixed} onChange={e => setFinanceForm({ ...financeForm, fixed: Number(e.target.value) })} className="border-none bg-white shadow-sm font-black" /></div>
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">单用户获客成本 (CAC)</label><Input type="number" prefix="¥" value={financeForm.cac} onChange={e => setFinanceForm({ ...financeForm, cac: Number(e.target.value) })} className="border-none bg-white shadow-sm font-black text-rose-500" /></div>
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">预期单用户客单价 (Price)</label><Input type="number" prefix="¥" value={financeForm.price} onChange={e => setFinanceForm({ ...financeForm, price: Number(e.target.value) })} className="border-none bg-white shadow-sm font-black text-blue-500" /></div>
            </div>
            <div className={`p-6 rounded-[32px] flex items-center justify-between text-white shadow-xl ${currentBEP === '无法盈利' ? 'bg-gradient-to-tr from-rose-500 to-red-400 shadow-rose-200' : 'bg-gradient-to-tr from-emerald-500 to-green-400 shadow-emerald-200'}`}>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-black uppercase tracking-widest bg-white/20 w-fit px-2 rounded-lg">推演结果：盈亏平衡点 (BEP)</span>
                <span className="text-3xl font-black mt-2">{currentBEP} <span className="text-sm font-bold opacity-80">{currentBEP === '无法盈利' ? '请调整结构' : '用户 / 月'}</span></span>
              </div>
              <RadarChartOutlined className="text-6xl opacity-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">⚠️ AI 简易推演引擎，仅用于快速检验团队单位经济 (Unit Economics) 合理性</p>
          </div>
        </Modal>

        {/* --- 全真路演模拟 Modal --- */}
        <Modal title={null} open={showPitchModal} onCancel={() => { setShowPitchModal(false); setIsPitching(false); }} footer={null} centered width={800} className="lofty-modal no-border-modal overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-slate-100"><div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${((300 - pitchTime) / 300) * 100}%` }}></div></div>
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
            <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-5xl shadow-inner"><HourglassOutlined className={isPitching ? "animate-spin" : ""} /></div>
            <div className="space-y-2">
              <h2 className="text-6xl font-black text-slate-800 m-0 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.floor(pitchTime / 60).toString().padStart(2, '0')}:{(pitchTime % 60).toString().padStart(2, '0')}
              </h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Pitch Deck Roadshow Countdown</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setIsPitching(!isPitching)} size="large" shape="round" className={`h-14 px-10 font-black border-none text-white shadow-lg ${isPitching ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-200' : 'bg-rose-500 hover:bg-rose-400 shadow-rose-200'}`} icon={isPitching ? <PauseCircleOutlined /> : <PlayCircleOutlined />}>
                {isPitching ? '暂停路演' : '开始路演'}
              </Button>
              <Button onClick={() => setPitchTime(300)} size="large" shape="round" className="h-14 px-8 font-black border-2 border-slate-100 text-slate-500 hover:bg-slate-50">重置时间</Button>
            </div>
            {isPitching && pitchTime < 280 && (
              <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg animate-slide-up text-left relative">
                <span className="absolute -top-3 left-6 bg-rose-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">评委 AI 随机打断追问机制</span>
                <p className="text-slate-200 font-medium text-sm leading-relaxed mb-0 mt-2">“同学请暂停一下我想问个问题... 你这里提到的获客成本是 0，这个数据有经过市场实际验证吗？据我所知同类产品的获客成本都在几十元以上。”</p>
              </div>
            )}
          </div>
        </Modal>

        {/* 申报新项目 Modal */}
        <Modal title={<div className="flex items-center gap-3 pt-4"><div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><RocketOutlined /></div><span className="text-lg font-black text-slate-800">立项申报 / 核心档案管理</span></div>} open={showNewProjectModal} onCancel={() => { setShowNewProjectModal(false); setCurrentStep(0); }} footer={null} centered width={700} className="premium-modal no-border-modal">
          <div className="py-6 px-1">
            <Steps current={currentStep} size="small" className="mb-8 px-4"><Steps.Step title={<span className="text-[10px] font-black uppercase">基础信息</span>} /><Steps.Step title={<span className="text-[10px] font-black uppercase">组织结构</span>} /><Steps.Step title={<span className="text-[10px] font-black uppercase">核心团队</span>} /></Steps>
            <div className="min-h-[400px]">
              {currentStep === 0 && (<div className="space-y-6 animate-slide-up"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">项目名称 (必填)</label><Input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="h-12 rounded-2xl shadow-sm border-slate-100" placeholder="AI 驱动的..." /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">所属比赛</label><Select value={projectForm.competition} onChange={v => setProjectForm({ ...projectForm, competition: v })} options={[{ value: '互联网+', label: '互联网+' }, { value: '挑战杯', label: '挑战杯' }, { value: '其他', label: '其他项目' }]} className="w-full h-12" /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">主攻赛道</label><Input value={projectForm.track} onChange={e => setProjectForm({ ...projectForm, track: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="高教主赛道" /></div></div></div>)}
              {currentStep === 1 && (<div className="space-y-6 animate-slide-up"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">所属学院/书院 (必填)</label><Input value={projectForm.college} onChange={e => setProjectForm({ ...projectForm, college: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="徐特立书院" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">第一指导老师 (必填)</label><Input value={projectForm.advisorName} onChange={e => setProjectForm({ ...projectForm, advisorName: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="张三 教授" /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">指导导师简介 (将同步至人员库)</label><Input value={projectForm.advisorInfo} onChange={e => setProjectForm({ ...projectForm, advisorInfo: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="研究方向、核心专长等" /></div></div></div>)}
              {currentStep === 2 && (<div className="space-y-4 animate-slide-up">
                <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">核心团队录入 (包含专业等深度字段)</label><Button onClick={addMember} size="small" shape="round" className="text-[10px] font-black px-4 bg-indigo-50 text-indigo-600 border-none">添加成员</Button></div>
                <div className="max-h-[340px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {projectForm.members.map((m, idx) => (
                    <div key={idx} className="p-5 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-4 relative transition-all hover:bg-white hover:shadow-md">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 ml-1 uppercase">姓名 Name</label><Input placeholder="姓名" value={m.name} onChange={e => updateMember(idx, 'name', e.target.value)} className="h-10 rounded-xl" /></div>
                        <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 ml-1 uppercase">学号 ID</label><Input placeholder="学号" value={m.student_id} onChange={e => updateMember(idx, 'student_id', e.target.value)} className="h-10 rounded-xl" /></div>
                        <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 ml-1 uppercase">身份 Role</label><Select value={m.role} onChange={v => updateMember(idx, 'role', v)} options={[{ value: 'Leader', label: '队长' }, { value: 'Member', label: '队员' }]} className="h-10 w-full" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 ml-1 uppercase">学院 College</label><Input placeholder="所属书院" value={m.college} onChange={e => updateMember(idx, 'college', e.target.value)} className="h-10 rounded-xl" /></div>
                        <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 ml-1 uppercase">专业 Major</label><Input placeholder="主修专业" value={m.major} onChange={e => updateMember(idx, 'major', e.target.value)} className="h-10 rounded-xl" /></div>
                        <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 ml-1 uppercase">年级 Grade</label><Input placeholder="年级" value={m.grade} onChange={e => updateMember(idx, 'grade', e.target.value)} className="h-10 rounded-xl" /></div>
                      </div>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => { const nm = [...projectForm.members]; nm.splice(idx, 1); setProjectForm({ ...projectForm, members: nm }); }} className="mt-2 text-[9px] font-bold">移除该成员档案</Button>
                    </div>
                  ))}
                  {projectForm.members.length === 0 && <div className="py-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[32px]">Click 'Add Member' to input team data</div>}
                </div>
              </div>)}
            </div>

            {/* Error Feedback Area */}
            {formError && (
              <div className="mt-4 px-6 py-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <CloseOutlined className="text-red-500 font-bold" />
                <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">{formError}</span>
              </div>
            )}

            <div className="mt-8 flex justify-between items-center bg-slate-50 p-4 rounded-3xl">
              <Button disabled={currentStep === 0} onClick={() => { setCurrentStep(s => s - 1); setFormError(""); }} shape="round" className="font-black border-none text-slate-500 bg-white shadow-sm">上一步</Button>
              <div className="flex gap-2">
                <Button onClick={() => { setShowNewProjectModal(false); setFormError(""); }} type="text" className="font-black text-slate-400">取消</Button>
                {currentStep < 2 ? (
                  <Button onClick={handleNext} type="primary" shape="round" className="px-8 font-black bg-indigo-600 border-none shadow-lg shadow-indigo-100 flex items-center gap-2">下一步<ArrowRightOutlined /></Button>
                ) : (
                  <Button onClick={handleCreateProject} loading={isSaving} type="primary" shape="round" className="px-8 font-black bg-emerald-600 border-none shadow-lg shadow-emerald-100">保存申报信息</Button>
                )}
              </div>
            </div>
          </div>
        </Modal>

        <Modal title={<span className="font-black">导入项目文档 (PDF/Docx)</span>} open={showImportModal} onCancel={() => setShowImportModal(false)} footer={null} centered className="premium-modal no-border-modal">
          <div onClick={() => fileInputRef.current?.click()} className="group p-12 border-2 border-dashed border-slate-100 rounded-[40px] text-center hover:border-indigo-400 transition-all cursor-pointer bg-slate-50/30 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1">
            <CloudUploadOutlined className="text-6xl text-slate-200 group-hover:text-indigo-400 transition-colors mb-6" />
            <div className="space-y-1"><p className="text-slate-700 font-black text-sm">点击或拖拽文件到此处</p><p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">支持 PDF, DOCX (Max 10MB)</p></div>
          </div>
        </Modal>

        <Modal title={<span className="font-black">个人中心</span>} open={showProfileModal} onCancel={() => setShowProfileModal(false)} footer={null} centered width={400} className="premium-modal no-border-modal">
          <div className="flex flex-col items-center py-6"><Avatar size={80} className="mb-4 shadow-xl border-4 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" /><h3>{localStorage.getItem('va_username') || '王小明'}</h3><p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{localStorage.getItem('va_school') || '创新实验班'}</p><Button danger block className="mt-8 h-12 rounded-2xl font-black shadow-lg shadow-red-50" onClick={() => { localStorage.clear(); window.location.reload(); }}>安全退出</Button></div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default StudentWorkspace;
