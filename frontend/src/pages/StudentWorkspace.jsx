import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import ReactMarkdown from "react-markdown";
import { Calendar, Timeline, Badge, Tooltip, Avatar, ConfigProvider, Modal, Button, Select, Popover, List, Steps, message, Input, Space, Divider, Empty, Popconfirm, Progress } from "antd";
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
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  FileSearchOutlined,
  SyncOutlined
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
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionTitle, setEditSessionTitle] = useState("");

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFileUrl, setActiveFileUrl] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const prevProjectIdRef = useRef(null);

  const [showLogModal, setShowLogModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewResult, setReviewResult] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  
  // Custom modals state
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState("互联网+");
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);

  // Aliases for JSX compatibility
  const isReviewing = reviewLoading;
  const activeReview = reviewResult;
  const [newLogContent, setNewLogContent] = useState("");
  
  const [financeData, setFinanceData] = useState({ users: 1000, cac: 50, arpu: 200, fixedCost: 50000 });
  const [pitchTime, setPitchTime] = useState(300);
  const [isPitching, setIsPitching] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [formError, setFormError] = useState("");
  const [projectForm, setProjectForm] = useState({
    name: '', competition: '互联网+', track: '高教主赛道', college: '', advisorName: '', advisorId: '', advisorInfo: '', members: []
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const radarData = [
    { label: '创新性', value: 85 }, { label: '落地性', value: 70 }, { label: '技术力', value: 90 },
    { label: '团队契合', value: 75 }, { label: '市场潜力', value: 80 }, { label: '合规性', value: 95 }
  ];

  const handleOpenNewProject = () => {
    setProjectForm({
      name: '', competition: '互联网+', track: '高教主赛道', college: '', advisorName: '', advisorId: '', advisorInfo: '', members: []
    });
    setCurrentStep(0);
    setFormError("");
    setEditorContent("");
    setActiveFileId(null);
    setActiveFileUrl(null);
    setProjectFiles([]);
    setShowNewProjectModal(true);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const username = localStorage.getItem("va_username") || "1120230571";
    try {
      const res = await fetch(`http://localhost:8000/api/sync/dashboard?user_id=${username}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data && data.projects) {
        setSyncData(data);
        if (activeProjectId) {
          await fetchProjectFiles(activeProjectId);
          const curProj = (data.projects || []).find(p => p.id === activeProjectId);
          if (curProj && !activeFileId) setEditorContent(curProj.content || "");
        }
      }
    } catch (e) {
      console.error("fetchDashboardData failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      const username = localStorage.getItem("va_username") || "1120230571";
      try {
        await fetchDashboardData();
        const res = await fetch(`http://localhost:8000/api/conversations?user_id=${username}`);
        if (res.ok) {
          const convs = await res.json();
          if (Array.isArray(convs) && convs.length > 0) {
            setHistory(convs);
            handleSessionSwitch(convs[0].id);
          } else { handleNewChat(); }
        }
      } catch (e) {
        console.error("initData failed:", e);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      const isProjectChanged = prevProjectIdRef.current !== activeProjectId;
      const proj = (syncData.projects || []).find(p => p.id === activeProjectId);
      
      if (isProjectChanged) {
        // 仅在切换项目时重置
        setEditorContent(proj?.content || "");
        setActiveFileId(null);
        setActiveFileUrl(null);
        setProjectFiles([]);
        fetchProjectFiles(activeProjectId);
        prevProjectIdRef.current = activeProjectId;
      } else if (!activeFileId) {
        // 同一项目内刷新，且未在预览文件时，更新编辑器内容
        if (proj) setEditorContent(proj.content || "");
      }
    } else {
      prevProjectIdRef.current = null;
    }
  }, [activeProjectId, syncData.projects, activeFileId]);

  useEffect(() => {
    let interval;
    if (isPitching && pitchTime > 0) {
      interval = setInterval(() => {
        setPitchTime(prev => prev - 1);
      }, 1000);
    } else if (pitchTime === 0 && isPitching) {
      setIsPitching(false);
      message.info('路演时间已到！请停止答辩。');
    }
    return () => clearInterval(interval);
  }, [isPitching, pitchTime]);

  // --- 自动保存逻辑 ---
  useEffect(() => {
    if (!activeProjectId || !editorContent) return;
    const timer = setTimeout(() => {
      saveContent(editorContent);
    }, 2000); // 2秒防抖
    return () => clearTimeout(timer);
  }, [editorContent, activeProjectId]);

  const fetchProjectFiles = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${id}/files`);
      if (res.ok) {
        const files = await res.json();
        setProjectFiles(files);
      }
    } catch (e) { console.error("Fetch files failed:", e); }
  };

  const handleFileTabChange = async (fileId) => {
    if (fileId === null) {
      const proj = (syncData.projects || []).find(p => p.id === activeProjectId);
      setEditorContent(proj?.content || "");
      setActiveFileId(null);
    } else {
      try {
        const res = await fetch(`http://localhost:8000/api/projects/${activeProjectId}/files/${fileId}`);
        if (res.ok) {
          const data = await res.json();
          setEditorContent(data.content);
          setActiveFileId(fileId);
        }
      } catch (e) { message.error("获取文件内容失败"); }
    }
  };

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
    if (!id) return;
    setActiveSessionId(id);
    try {
      const res = await fetch(`http://localhost:8000/api/conversations/${id}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setChatLog(Array.isArray(msgs) ? msgs : []);
      }
    } catch (err) {
      console.error(err);
      message.error("获取会话消息失败");
    }
  };

  const handleRenameSession = async () => {
    if (!editSessionTitle.trim() || !editingSessionId) return;
    try {
      await fetch(`http://localhost:8000/api/conversations/${editingSessionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editSessionTitle })
      });
      setHistory(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editSessionTitle } : s));
      setEditingSessionId(null);
      message.success("会话重命名成功。");
    } catch (e) { console.error(e); }
  };

  const handleDeleteSession = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/conversations/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) { setChatLog([]); setActiveSessionId(null); }
      message.success("会话已删除。");
    } catch (e) { console.error(e); }
  };

  const handleDeleteFile = async (fileId, fileUrl) => {
    try {
      await fetch(`http://localhost:8000/api/project-files/${fileId}`, { method: 'DELETE' });
      const wasActive = activeFileId === fileId;
      if (wasActive) {
        setActiveFileId(null);
        setActiveFileUrl(null);
      } else if (activeFileUrl === fileUrl) {
        setActiveFileUrl(null);
      }
      // 先拉取最新文件列表，再刷大盘同步内容
      if (activeProjectId) await fetchProjectFiles(activeProjectId);
      await fetchDashboardData();
      
      if (wasActive) {
        const proj = (syncData.projects || []).find(p => p.id === activeProjectId);
        setEditorContent(proj?.content || "");
      }
      await fetchDashboardData();
      message.success('附件已删除');
    } catch (_e) { message.error('删除失败'); }
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
        body: JSON.stringify({ message: inputValue, session_id: activeSessionId, project_id: activeProjectId })
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
      const res = await fetch(`http://localhost:8000/api/projects/${activeProjectId}/content`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setSyncData(prev => ({
          ...prev, projects: (prev.projects || []).map(p => p.id === activeProjectId ? { ...p, content } : p)
        }));
      }
    } catch (e) {
      console.error("Save content failed:", e);
    } finally { setIsSaving(false); }
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
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      hide();
      if (data.text) {
        // 先设 ID 防止 Effect 误覆盖内容
        if (activeProjectId) {
          setActiveFileId(data.file_id || null);
          await fetchProjectFiles(activeProjectId);
          await fetchDashboardData();
        }
        setEditorContent(data.text);
        if (data.file_url) setActiveFileUrl(data.file_url);
        setActivePage('editor');
        setShowImportModal(false);
        message.success(`解析并导入成功: ${data.filename}`);
      } else { message.error(data.error || "解析失败"); }
    } catch (err) {
      hide();
      console.error(err);
      message.error("文件上传解析失败，请检查后端 PDF 解析模块。");
    }
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
      if (!projectForm.advisorName.trim()) return "指导老师姓名不能为空";
      if (!isValidStr(projectForm.advisorName)) return "老师姓名无效";
      if (!projectForm.advisorId.trim()) return "指导老师 ID 不能为空 (例如 T001)";
    }
    if (currentStep === 2) {
      if (projectForm.members.length === 0) return "至少需要添加一名成员";
      let hasLeader = projectForm.members.some(m => m.role === 'Leader' || m.role === '组长');
      if (!hasLeader) return "本项目尚未指派负责人（组长），请在身份中选择'队长'或'组长'";
      
      for (let m of projectForm.members) {
        if (!m.name.trim()) return "团队成员姓名不能为空";
        if (!isValidStr(m.name)) return `成员姓名 [${m.name}] 无效`;
        if (m.student_id && isNumeric(m.student_id) && m.student_id.length < 5) return `学号 [${m.student_id}] 格式不正确`;
        if (!m.college?.trim()) return `成员 [${m.name}] 的学院信息不能为空`;
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
        message.success('项目申报成功！实名校验已通过。');
        setShowNewProjectModal(false);
        setCurrentStep(0);
        await fetchDashboardData();
        if (result.project_id) { setActiveProjectId(result.project_id); setActivePage('editor'); }
      } else {
        const data = await resp.json();
        setFormError(data.detail || "后端核验逻辑异常，请检查成员学号与姓名是否准确");
      }
    } catch (err) {
      console.error(err);
      setFormError("网络连接失败，请确保后台 API 服务已启动任务进展同步");
    } finally { setIsSaving(false); }
  };

  const handleRenameProject = async () => {
    if (!editProjectTitle.trim() || !editingProjectId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${editingProjectId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editProjectTitle })
      });
      if (res.ok) {
        setSyncData(prev => ({
          ...prev, projects: (prev.projects || []).map(p => p.id === editingProjectId ? { ...p, name: editProjectTitle } : p)
        }));
        setEditingProjectId(null);
        message.success("重命名成功。");
      }
    } catch (e) {
      console.error(e);
      message.error("重命名失败");
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeProjectId === id) { setActiveProjectId(null); setEditorContent(""); }
        await fetchDashboardData();
        message.success("项目已删除。");
      }
    } catch (e) {
      console.error(e);
      message.error("删除项目失败");
    }
  };

  const handleEditMembers = () => {
    if (!activeProjectId || !syncData.projects) return;
    const proj = (syncData.projects || []).find(p => p.id === activeProjectId);
    if (!proj) return;
    const members = (syncData.members || []).filter(m => m.project_id === activeProjectId && m.role !== 'Advisor');
    setProjectForm({
      id: proj.id,
      name: proj.name,
      competition: proj.competition || '互联网+',
      track: proj.track || '',
      college: proj.college || '',
      advisorName: proj.advisor_name || '',
      advisorId: proj.advisor_id || '',
      advisorInfo: proj.advisor_info || '',
      members: (members || []).map(m => ({ ...m, student_id: m.student_id || '' }))
    });
    setCurrentStep(2);
    setShowNewProjectModal(true);
  };

  const handleAddLog = async () => {
    if (!newLogContent.trim() || !activeProjectId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${activeProjectId}/commits`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newLogContent, author: localStorage.getItem('va_username') || 'Student' })
      });
      if (res.ok) {
        setNewLogContent("");
        message.success("提交成功。");
        await fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
      message.error("日志提交失败");
    }
  };

  const handleRequestReview = async () => {
    if (!activeProjectId) return;
    setShowRubricModal(false);
    setReviewLoading(true);
    setReviewResult("");
    setShowReviewModal(true);
    try {
      const rubricValue = selectedRubric === "互联网+" ? "internet_plus" : "challenge_cup";
      const res = await fetch(`http://localhost:8000/api/projects/${activeProjectId}/review`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubric: rubricValue })
      });
      const data = await res.json();
      setReviewResult(data.review || data.message || "AI 分析完成。");
    } catch (e) {
      console.error(e);
      setReviewResult("AI 诊断服务连接失败，请检查后端 API 是否启动。");
    } finally {
      setReviewLoading(false);
    }
  };

  const addMember = () => { setProjectForm({ ...projectForm, members: [...projectForm.members, { name: '', student_id: '', role: 'Member', position: '队员', college: '', major: '', grade: '', info: '' }] }); };
  const updateMember = (idx, field, val) => {
    const newMembers = [...projectForm.members];
    newMembers[idx][field] = val;
    setProjectForm({ ...projectForm, members: newMembers });
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
                  <Button onClick={handleOpenNewProject} block shape="round" className="btn-new-chat h-11">发起项目</Button>
                  <Button onClick={() => setShowImportModal(true)} block shape="round" className="btn-import-project h-11">导入项目</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar space-y-1.5">
            {activePage === 'chat' ? (
              history.map(s => (
                <div key={s.id} onClick={() => { if (editingSessionId !== s.id) handleSessionSwitch(s.id); }} className={`group p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${activeSessionId === s.id ? 'bg-white shadow-xl shadow-slate-200/50 border-blue-50' : 'hover:bg-slate-50 border-transparent'}`}>
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <MessageOutlined className={activeSessionId === s.id ? 'text-blue-500' : 'text-slate-300'} />
                    {editingSessionId === s.id ? (
                      <input autoFocus className="text-[11px] font-bold flex-1 bg-blue-50 border-none outline-none rounded px-1 h-6" value={editSessionTitle} onChange={e => setEditSessionTitle(e.target.value)} onBlur={handleRenameSession} onKeyDown={e => e.key === 'Enter' && handleRenameSession()} />
                    ) : (
                      <span className={`text-[11px] font-bold truncate ${activeSessionId === s.id ? 'text-slate-900' : 'text-slate-500'}`}>{s.title}</span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${editingSessionId === s.id ? 'hidden' : ''}`}>
                    <EditOutlined onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setEditSessionTitle(s.title); }} className="text-slate-300 hover:text-blue-500 transition-colors text-xs" />
                    <Popconfirm title="确定删除该会话吗？" onConfirm={(e) => { e && e.stopPropagation(); handleDeleteSession(s.id); }} okText="确定" cancelText="取消">
                      <DeleteOutlined onClick={(e) => e.stopPropagation()} className="text-slate-300 hover:text-rose-500 transition-colors text-xs" />
                    </Popconfirm>
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
            <div className="flex flex-col"><span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">{activePage === 'chat' ? 'Venture Agent AI' : 'Venture Dashboard'}</span><span className="text-xs font-bold text-slate-400">{activePage === 'chat' ? '灵感辅导中' : '项目管控中'}</span></div>
            <div className="flex gap-4 items-center">
              <Button 
                type="text" 
                icon={<SyncOutlined className={loading ? 'animate-spin' : ''} />} 
                onClick={fetchDashboardData}
                title="同步最新数据"
              />
              <Popover content={notificationContent} title={<span className="font-black text-sm">通知中心</span>} trigger="click" placement="bottomRight">
                <Badge count={2} size="small" offset={[-2, 6]}><Button type="text" icon={<BellOutlined className="text-slate-400 text-lg" />} /></Badge>
              </Popover>
            </div>
          </header>

          {activePage === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-10">
                  {chatLog.map((m, i) => (
                    <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-4 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="shadow-sm" style={{ backgroundColor: m.role === 'coach' ? '#2563eb' : '#f4f4f5' }} icon={m.role === 'coach' ? <RocketOutlined /> : <UserOutlined />} />
                        <div className="flex flex-col gap-1">
                          {m.role === 'coach' && <span className="text-[10px] font-black text-blue-500 px-2 bg-blue-50 rounded-lg">{m.agent}</span>}
                          <div className={`message-bubble ${m.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                            {m.role === 'coach' ? <ReactMarkdown>{m.text}</ReactMarkdown> : <p className="m-0 font-medium">{m.text}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSending && <div className="text-[10px] text-slate-400 animate-pulse ml-12">导师正在深度解析中...</div>}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="p-8 h-[140px] flex items-center">
                <div className="max-w-3xl mx-auto w-full relative">
                  <div className="bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden focus-within:shadow-xl transition-all">
                    <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent border-none p-5 outline-none resize-none text-sm" placeholder="输入想法..." rows={1} />
                    <div className="absolute right-4 bottom-4"><Button onClick={handleSend} disabled={isSending || !inputValue.trim()} type="primary" shape="circle" icon={<SendOutlined />} /></div>
                  </div>
                </div>
              </div>
            </>
          ) : activePage === 'editor' ? (
            <div className="flex-1 flex flex-col bg-[#fcfcfd] overflow-y-auto custom-scrollbar">
              <header className="h-20 border-b border-gray-100 px-8 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                <div className="flex flex-col"><h2 className="text-[14px] font-black text-indigo-500 uppercase tracking-[0.2em] m-0">Venture Editor</h2><span className="text-[9px] text-slate-300 font-bold uppercase">{activeProjectId ? 'Project Editing' : 'Draft Preparation'}</span></div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => saveContent(editorContent)} 
                    loading={isSaving}
                    type="primary" 
                    shape="round" 
                    className="h-10 px-10 font-black bg-indigo-600 border-none shadow-lg shadow-indigo-200"
                  >
                    保存项目
                  </Button>
                </div>
              </header>
              <div className="flex-1 p-10">
                {activeProjectId ? (
                  <div className={`mx-auto space-y-8 animate-slide-up transition-all ${activeFileUrl ? 'max-w-[1600px] w-full px-2' : 'max-w-5xl'}`}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div onClick={() => setShowLogModal(true)} className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all cursor-pointer flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"><CommitIcon /></div>
                        <div><span className="block text-sm font-black text-slate-800">项目进度日志</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Commit History</span></div>
                      </div>
                      <div onClick={() => setShowRubricModal(true)} className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm hover:shadow-xl hover:shadow-blue-100 transition-all cursor-pointer flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"><BulbOutlined /></div>
                        <div><span className="block text-sm font-black text-slate-800">深度诊断评估</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Assessment</span></div>
                      </div>
                      <div onClick={() => setShowFinanceModal(true)} className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 shadow-sm hover:shadow-xl hover:shadow-emerald-100 transition-all cursor-pointer flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"><RadarChartOutlined /></div>
                        <div><span className="block text-sm font-black text-slate-800">简易财务推演</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Financial Model</span></div>
                      </div>
                      <div onClick={() => setShowPitchModal(true)} className="group p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 border border-transparent shadow-md hover:shadow-xl hover:shadow-blue-200 transition-all cursor-pointer flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"><TeamOutlined /></div>
                        <div><span className="block text-sm font-black text-white">全真路演模拟</span><span className="text-[10px] text-white/60 font-bold uppercase tracking-widest text-amber-300">Live Pitch Mode</span></div>
                      </div>
                    </div>
                    <div className="min-h-[700px] editor-surface relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/10 z-0"></div>
                      <div className="flex-1 p-12 z-10 flex flex-col">
                        {editorContent ? (
                          <div className="prose prose-slate max-w-none flex-1 flex flex-col">
                            {/* 工具栏与多文件标签 */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                  <span className="text-xl font-black text-slate-800 tracking-tight">项目归档附录</span>
                                  <span className="text-xs text-slate-400 font-bold mt-1">云端附件列表 (PDF/Docx)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isSaving && <span className="text-[10px] text-indigo-400 font-black animate-pulse uppercase">Saving...</span>}
                                  <Button icon={<CloudUploadOutlined />} onClick={() => setShowImportModal(true)} shape="round" className="bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-300 font-bold shadow-sm">追加附件文档</Button>
                                </div>
                              </div>

                              {/* 横向附件 Chips 列表 */}
                              <div className="w-full overflow-x-auto pb-4 no-scrollbar border-b border-indigo-50 flex gap-3 items-center min-h-[50px]">
                                {projectFiles.length > 0 ? projectFiles.map(file => (
                                  <div
                                    key={file.id}
                                    onClick={() => { 
                                      setActiveFileUrl(file.file_url); 
                                      handleFileTabChange(file.id); 
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 max-w-[160px] ${activeFileId === file.id ? 'bg-indigo-600 border-indigo-700 shadow-md scale-105' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                                  >
                                    {file.file_type === 'pdf' || file.filename.toLowerCase().endsWith('.pdf') ? <FilePdfOutlined className={activeFileId === file.id ? 'text-white' : 'text-rose-500'} /> : <FileWordOutlined className={activeFileId === file.id ? 'text-white' : 'text-blue-500'} />}
                                    <Tooltip title={file.filename}><span className={`text-[11px] font-black truncate w-full ${activeFileId === file.id ? 'text-white' : 'text-slate-600'}`}>{file.filename}</span></Tooltip>
                                    <Popconfirm title="确定删除该附件？" onConfirm={(e) => { e.stopPropagation(); handleDeleteFile(file.id, file.file_url); }} okText="删除" cancelText="取消">
                                      <CloseOutlined onClick={e => e.stopPropagation()} className={`text-[9px] ml-1 font-bold ${activeFileId === file.id ? 'text-indigo-200 hover:text-white' : 'text-slate-300 hover:text-rose-500'}`} />
                                    </Popconfirm>
                                  </div>
                                )) : <span className="text-[11px] text-slate-400 font-bold italic w-full text-center">系统检测到暂无关联原始附件</span>}
                              </div>

                              {/* 内容预览或编辑区 - 响应式分栏布局 */}
                              <div className="flex-1 mt-6 relative flex gap-6 min-h-[600px]">
                                {/* 左栏：项目正文编辑区 */}
                                <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-inner group flex flex-col">
                                  <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 shrink-0 shadow-sm z-10 justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">编辑工作区 (Editor)</span>
                                  </div>
                                  <textarea className="w-full flex-1 bg-slate-50/50 p-8 text-sm leading-relaxed text-slate-600 font-medium resize-none outline-none focus:bg-white focus:border-indigo-300 transition-all custom-scrollbar" value={editorContent} onChange={e => setEditorContent(e.target.value)} placeholder="所选文档的内容草稿将在此显示，您可以手动合并或润色..." />
                                </div>
                                
                                {/* 右栏：原文件参照预览 (PDF/Docx) */}
                                {activeFileUrl && (
                                  <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 flex-none w-1/2 animate-slide-in">
                                    <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 shrink-0 shadow-sm z-10 justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${activeFileUrl.toLowerCase().endsWith('.pdf') ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                          {activeFileUrl.toLowerCase().endsWith('.pdf') ? 'PDF Source Reference (Read-only)' : 'Docx Content Preview'}
                                        </span>
                                      </div>
                                      <a href={activeFileUrl.startsWith('http') ? activeFileUrl : `http://localhost:8000${activeFileUrl}`} download className="text-[9px] font-black text-indigo-500 hover:text-indigo-700">下载原件</a>
                                    </div>
                                    {activeFileUrl.toLowerCase().endsWith('.pdf') ? (
                                      <iframe src={activeFileUrl.startsWith('http') ? activeFileUrl : `http://localhost:8000${activeFileUrl}`} className="w-full flex-1 border-none" title="PDF Preview" />
                                    ) : (
                                      <div className="w-full flex-1 bg-white p-10 overflow-y-auto custom-scrollbar shadow-inner">
                                        <div className="max-w-2xl mx-auto py-8 text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
                                          {editorContent || "正在尝试加载高清预览内容..."}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-8">
                            <div className="w-24 h-24 bg-slate-50 rounded-[35%] flex items-center justify-center text-slate-200 text-5xl animate-pulse shadow-inner"><FileTextOutlined /></div>
                            <div className="space-y-3"><h3 className="text-2xl font-black text-slate-800 tracking-tight">Venture Editor - 创作空间</h3><p className="max-w-md text-sm font-bold text-slate-400 leading-relaxed mx-auto">请在左侧选择对应项目，或直接导入 PDF/DOCX 文件。</p></div>
                            <Button onClick={() => fileInputRef.current?.click()} size="large" shape="round" className="h-14 px-10 font-black border-2 border-indigo-100 text-indigo-600 bg-white hover:shadow-xl transition-all">快速导入解析</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6 py-20 px-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl text-slate-300"><RocketOutlined /></div>
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[11px]">Select or Create a Project to Start</p>
                  </div>
                )}
              </div>
            </div>
          ) : activePage === 'collab' ? (
            <div className="flex-1 flex flex-col bg-[#fcfcfd] overflow-y-auto custom-scrollbar p-10">
              <div className="max-w-5xl mx-auto w-full space-y-10">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-black text-slate-800 m-0 flex items-center gap-3"><TeamOutlined className="text-blue-600" /> 协作中心 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 border-l border-slate-200">Team Collaboration</span></h2></div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 space-y-6">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-4"><GlobalOutlined className="text-blue-500" /> 团队核心名片墙</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {(syncData.members || []).filter(m => activeProjectId && m.project_id === activeProjectId).map((member, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-5 rounded-[32px] border transition-all ${member.role === 'Advisor' ? 'bg-slate-900 border-slate-950 text-white shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-white'}`}>
                          <Avatar size={50} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} className="shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-black truncate mb-0.5 ${member.role === 'Advisor' ? 'text-white' : 'text-slate-800'}`}>{member.name}</p>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${member.role === 'Leader' ? 'bg-amber-100 text-amber-700' : member.role === 'Advisor' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-400'}`}>{member.role === 'Leader' ? '项目总负责人' : member.role === 'Advisor' ? '指导教师' : '执行成员'}</span>
                          </div>
                        </div>
                      ))}
                      {(syncData.members || []).filter(m => activeProjectId && m.project_id === activeProjectId).length === 0 && <div className="col-span-2 py-10 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">暂无团队成员数据</div>}
                    </div>
                  </div>

                  <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col gap-6 text-center justify-center border-l-4 border-l-blue-500">
                    <div className="text-4xl font-black text-blue-600">{Math.round(((syncData.deadlines || []).filter(d => d.status === 'completed').length || 0) / ((syncData.deadlines || []).length || 1) * 100)}%</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">当前项目整体进度周期<br />Milestone Completion Ratio</div>
                    <Progress percent={Math.round(((syncData.deadlines || []).filter(d => d.status === 'completed').length || 0) / ((syncData.deadlines || []).length || 1) * 100)} showInfo={false} strokeColor="#2563eb" trailColor="#f1f5f9" strokeWidth={12} className="mt-2" />
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/20">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-8"><CalendarOutlined className="text-emerald-500" /> 项目里程碑演进 (Synced History)</h3>
                  <Timeline className="collab-timeline antique-timeline">
                    {(syncData.deadlines || []).filter(d => !activeProjectId || d.project_name === (syncData.projects || []).find(p => p.id === activeProjectId)?.name).map((d, i) => (
                      <Timeline.Item key={i} color={d.status === 'completed' ? 'green' : 'blue'} dot={d.status === 'completed' ? <CheckCircleOutlined className="text-lg" /> : <ClockCircleOutlined className="text-lg" />}>
                        <div className="flex flex-col gap-1 ml-4 py-2">
                          <div className="flex justify-between items-center"><span className="text-[14px] font-black text-slate-800">{d.title}</span><span className="text-[11px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{d.due_date}</span></div>
                          <p className="text-[11px] text-slate-400 font-medium m-0">于 {d.due_date} 之前需达成该阶段性业务目标。</p>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center font-black text-slate-300 text-2xl animate-pulse">未知页面状态</div>
          )}
        </section>

        {/* Console Column - Context Aware */}
        <section className="w-[360px] bg-[#fcfcfd] border-l border-gray-100 p-8 flex flex-col gap-8 flex-none overflow-y-auto custom-scrollbar">
          {activePage === 'chat' ? (
            <>
              <div className="console-card animate-slide-in">
                <h3 className="text-[12px] font-black text-slate-700 uppercase mb-5 tracking-widest flex items-center gap-2"><CalendarOutlined className="text-blue-500" /> 全局项目 DDL</h3>
                <div className="space-y-3">
                  {(syncData.deadlines || []).filter(d => activeProjectId && (d.project_id === activeProjectId)).slice(0, 4).map((d, i) => (
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
                    {[...(syncData.evolution_logs || []).filter(l => activeProjectId && l.project_id === activeProjectId), ...(syncData.commits || []).filter(c => activeProjectId && c.project_id === activeProjectId).map(c => ({ event: `提交更新: ${c.content?.slice(0, 15)}...`, timestamp: c.timestamp }))]
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
                  {(syncData.members || []).filter(m => activeProjectId && m.project_id === activeProjectId).map((member, idx) => (
                    <Popover key={idx} trigger="click" placement="left" title={<span className="font-black text-sm">组织架构深度透视</span>} content={<div className="w-72 space-y-4 p-2"><div className="flex flex-col gap-2 p-4 bg-indigo-50/50 rounded-[24px] border border-indigo-100/50"><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">学号 / 代码</span><span className="text-[11px] font-bold text-indigo-600">{member.student_id || '---'}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">所属组织</span><span className="text-[11px] font-bold text-indigo-600">{member.college || '---'}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">专业 Major</span><span className="text-[11px] font-bold text-indigo-600">{member.major || '---'}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">年级 Grade</span><span className="text-[11px] font-bold text-indigo-600">{member.grade || '---'}</span></div></div><div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">核心职责 Position</p><p className="text-[12px] text-slate-600 font-bold m-0">{member.position || '暂未分配具体任务'}</p></div></div>}>
                      <div className={`flex items-center gap-4 p-4 rounded-[28px] border transition-all cursor-pointer group ${member.role === 'Advisor' ? 'bg-indigo-900 border-indigo-950 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'}`}>
                        <Avatar size={48} className={`shadow-sm group-hover:scale-105 transition-transform ${member.role === 'Advisor' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300'}`} icon={member.role === 'Advisor' ? <RobotOutlined /> : <UserOutlined />} />
                        <div className="flex-1 min-w-0"><p className={`text-[14px] font-black truncate mb-0.5 ${member.role === 'Advisor' ? 'text-indigo-50' : 'text-slate-800'}`}>{member.name}</p><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${member.role === 'Leader' ? 'bg-amber-50 text-amber-600 shadow-sm shadow-amber-100/50' : member.role === 'Advisor' ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-50 text-slate-400'}`}>{member.role === 'Leader' ? '项目总负责人' : member.role === 'Advisor' ? '官方指导教师' : '核心执行成员'}</span></div>
                      </div>
                    </Popover>
                  ))}
                  {(syncData.members || []).filter(m => activeProjectId && m.project_id === activeProjectId).length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[10px] text-slate-300 font-bold">No Members</span>} />}
                </div>
              </div>
              <div className="console-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-[12px] font-black text-slate-700 uppercase mb-5 tracking-widest flex items-center gap-2"><GlobalOutlined className="text-emerald-500" /> 指导导师寄语</h3>
                {activeProjectId && (syncData.projects || []).find(p => p.id === activeProjectId) ? (
                  <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-white rounded-[32px] border border-emerald-100 flex flex-col gap-2 shadow-sm">
                    <p className="text-[18px] font-black text-slate-800 mb-0">{(syncData.projects || []).find(p => p.id === activeProjectId)?.advisor_name}</p>
                    <p className="text-[10px] text-emerald-600 font-black mb-3 uppercase tracking-[0.2em] bg-emerald-100/30 w-fit px-2 rounded-lg">Official Mentor</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-emerald-200 pl-3">"{(syncData.projects || []).find(p => p.id === activeProjectId)?.advisor_info}"</p>
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
            <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-3xl bg-amber-500 flex items-center justify-center text-white text-3xl shadow-xl shadow-amber-200"><BulbOutlined /></div><div><h2 className="text-2xl font-black text-slate-800 m-0">Venture AI 灵感深度启发</h2><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Deep Brainstorming Analysis Report</p></div></div>
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
                  
                  {/* 合规免责预警标识 */}
                  <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                    <SafetyCertificateOutlined className="text-amber-400 text-lg mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">⚠️ 免责预警标识 (Disclaimer)</span>
                      <span className="text-[10px] text-amber-100/60 leading-tight">本评估报告由 AI 基于大语言模型自动生成，结果受模型知识库限制，仅供参考。请结合实际业务情况与相关指导老师意见进行二次核实，不可直接作为赛事评审依据。</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-6">
                    <span className="text-[10px] text-slate-500 font-black uppercase">Insights powered by VentureAgent AI</span>
                    <Button onClick={() => setShowRubricModal(true)} ghost shape="round" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">重新发起深度启发</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* --- 选择 AI 评估标准配置台 (Rubric Selector) --- */}
        <Modal open={showRubricModal} onCancel={() => setShowRubricModal(false)} footer={null} centered width={500} className="premium-modal no-border-modal">
          <div className="p-8 pb-4 space-y-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-3xl mb-2"><FileSearchOutlined /></div>
            <div>
              <h2 className="text-xl font-black text-slate-800 m-0 mb-2">选择 AI 评估标准配置台</h2>
              <p className="text-sm font-bold text-slate-400">请选择目标赛事的诊断模型，<br/>以便大语言模型进行精准对齐分析。</p>
            </div>
            
            <div className="flex gap-4 w-full">
              <div 
                onClick={() => setSelectedRubric("互联网+")} 
                className={`flex-1 p-6 rounded-[24px] border-2 cursor-pointer transition-all ${selectedRubric === "互联网+" ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-slate-100 hover:border-blue-200'}`}
              >
                <div className="text-lg font-black text-slate-700 mb-1">互联网+</div>
                <div className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">侧重商业模式</div>
              </div>
              <div 
                onClick={() => setSelectedRubric("挑战杯")} 
                className={`flex-1 p-6 rounded-[24px] border-2 cursor-pointer transition-all ${selectedRubric === "挑战杯" ? 'border-purple-500 bg-purple-50/50 shadow-lg shadow-purple-100' : 'border-slate-100 hover:border-purple-200'}`}
              >
                <div className="text-lg font-black text-slate-700 mb-1">挑战杯</div>
                <div className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">侧重学术深度</div>
              </div>
            </div>

            <Button onClick={handleRequestReview} loading={isReviewing} type="primary" size="large" shape="round" className="w-full bg-slate-900 border-none h-14 font-black mt-2 shadow-xl shadow-slate-200">
              开始执行 AI 深度诊断
            </Button>
          </div>
        </Modal>

        {/* --- 简易财务推演 --- */}
        <Modal open={showFinanceModal} onCancel={() => setShowFinanceModal(false)} footer={null} centered width={800} className="premium-modal no-border-modal">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3"><div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl"><RadarChartOutlined /></div><div><h3 className="text-xl font-black text-slate-800 mb-0">盈亏平衡分析模型</h3><span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Financial Breakeven Point</span></div></div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预估核心用户基数 / 月</label><Input type="number" value={financeData.users} onChange={e => setFinanceData({...financeData, users: Number(e.target.value)})} className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black text-slate-700" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">获客成本 (CAC) / 人</label><Input type="number" value={financeData.cac} onChange={e => setFinanceData({...financeData, cac: Number(e.target.value)})} prefix="¥" className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ARPU 单客收入 / 月</label><Input type="number" value={financeData.arpu} onChange={e => setFinanceData({...financeData, arpu: Number(e.target.value)})} prefix="¥" className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">硬性固定成本 / 月</label><Input type="number" value={financeData.fixedCost} onChange={e => setFinanceData({...financeData, fixedCost: Number(e.target.value)})} prefix="¥" className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black" /></div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-center">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[50px] rounded-full"></div>
                 <h4 className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-black mb-6">AI 测算结果洞察</h4>
                 
                 <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-slate-400 text-sm font-bold">月度总营收</span>
                      <span className="text-2xl font-black">¥ {(financeData.users * financeData.arpu).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-slate-400 text-sm font-bold">月度总成本</span>
                      <span className="text-2xl font-black">¥ {(financeData.fixedCost + (financeData.users * financeData.cac)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                       <span className="text-slate-400 text-sm font-bold">净利润 (Net Profit)</span>
                       <div className="text-right">
                         <span className={`text-4xl font-black ${(financeData.users * financeData.arpu) - (financeData.fixedCost + (financeData.users * financeData.cac)) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>¥ {((financeData.users * financeData.arpu) - (financeData.fixedCost + (financeData.users * financeData.cac))).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-8 text-[10px] text-slate-400 leading-relaxed font-bold bg-white/5 p-4 rounded-xl">
                   💡 {((financeData.users * financeData.arpu) - (financeData.fixedCost + (financeData.users * financeData.cac))) > 0 ? '商业模式已达到初步模型测算的盈亏平衡点，具有较强的长效可持续性。建议进一步考虑规模效应带来的边际成本递减规律，优化上游供应链。' : '目前该商业模型处于亏损区间。在参加互联网+等侧重商业落地的赛事中，极易受到评委质疑。建议进一步降低 CAC 获取高净值用户，或探索跨界 IP 等多元化营收路径提升 ARPU 空间。'}
                 </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* --- 全真路演模拟 --- */}
        <Modal open={showPitchModal} onCancel={() => { setShowPitchModal(false); setIsPitching(false); setPitchTime(300); }} footer={null} centered width={1000} className="premium-modal no-border-modal bg-transparent shadow-none" modalRender={(node) => (<div className="modal-content-wrapper">{node}</div>)}>
          <div className="bg-slate-950 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative text-white flex flex-col h-[650px] shadow-indigo-900/40">
             {/* 顶部横幅 */}
             <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 shrink-0">
               <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${isPitching ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`}></div><span className={`font-black tracking-[0.2em] text-[11px] uppercase ${isPitching ? 'text-rose-500' : 'text-slate-500'}`}>Live Pitch Mode</span></div>
               <div className="font-mono text-3xl font-black text-white tracking-widest">{Math.floor(pitchTime / 60).toString().padStart(2, '0')}:{(pitchTime % 60).toString().padStart(2, '0')}</div>
               <Button onClick={() => { setIsPitching(!isPitching); if (!isPitching) message.info('路演计时开始！深呼吸，准备迎接提问。'); }} shape="round" className={`border-none font-black px-6 shadow-lg ${isPitching ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>{isPitching ? '中止路演' : '进入备赛计时状态'}</Button>
             </div>
             
             {/* 主视野 */}
             <div className="flex-1 flex">
               <div className="flex-[2] border-r border-white/10 p-10 flex flex-col justify-between relative bg-gradient-to-br from-slate-900 to-black overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 
                 {/* Virtual Stage View */}
                 <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-900 flex flex-col items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
                      <TeamOutlined className="text-4xl text-slate-600 mb-2" />
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Presenter</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white mb-4">{(syncData.projects || []).find(p => p.id === activeProjectId)?.name || '未命名演示项目剧场'}</h2>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">全息路演极压模拟环境已开启，大赛 AI 智库评委已落座核心席位。您有 5 分钟时间，请在限时内完成对商业模式闭环的现场讲演。</p>
                 </div>
               </div>
               
               {/* 评委聊天框 */}
               <div className="flex-[1.2] bg-slate-950 flex flex-col relative z-20">
                 <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-black/40">
                   <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Investor" className="bg-amber-100" />
                   <div>
                     <p className="text-sm font-black m-0 text-white tracking-widest">VentureCapital AI</p>
                     <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest m-0">虚拟主评委 (评委席一栏)</p>
                   </div>
                 </div>
                 <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-slate-900/60">
                    {isPitching ? (
                      <div className="flex flex-col gap-6 animate-fade-in">
                        {pitchTime <= 270 && (
                          <div className="flex flex-col items-start gap-2 max-w-[95%] animate-slide-in">
                            <span className="text-[10px] text-slate-500 font-bold ml-1">答辩环节 00:30 (基于您的项目文档)</span>
                            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed border border-slate-700 shadow-md">您好，请开始您的路演。我们更想听听，相比于已经在市场上拿到份额的巨头，你们项目最重要的壁垒和护城河究竟是什么？</div>
                          </div>
                        )}
                        {pitchTime <= 195 && (
                          <div className="flex flex-col items-start gap-2 max-w-[95%] animate-slide-in">
                            <span className="text-[10px] text-slate-500 font-bold ml-1">压力追问 02:15</span>
                            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed border border-rose-900/50 shadow-md shadow-rose-900/10">刚才提到的获客渠道似乎过于理想化。如果在早期缺乏流量杠杆的情况下，你们预期的冷启动 CAC (获客成本) 如果翻了一倍，你们的现金流还能不能运转？</div>
                          </div>
                        )}
                        {pitchTime <= 80 && (
                          <div className="flex flex-col items-start gap-2 max-w-[95%] animate-slide-in">
                            <span className="text-[10px] text-slate-500 font-bold ml-1">技术复核 03:40</span>
                            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed border border-slate-700 shadow-md">技术方案中的某些参数没有第三方权威检测报告。在省赛、国赛阶段，专家们不会只听描述，你们团队有什么核心背书来证明技术成熟度？</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center flex-col gap-4">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 text-2xl shadow-inner"><MessageOutlined /></div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 max-w-[200px]">点击顶部【进入备赛计时状态】按钮以激活 AI 毒舌评委席的现场随机追问</span>
                      </div>
                    )}
                 </div>
               </div>
             </div>
          </div>
        </Modal>

        {/* 申报新项目 Modal */}
        <Modal title={<div className="flex items-center gap-3 pt-4"><div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><RocketOutlined /></div><span className="text-lg font-black text-slate-800">立项申报 / 核心档案管理</span></div>} open={showNewProjectModal} onCancel={() => { setShowNewProjectModal(false); setCurrentStep(0); }} footer={null} centered width={700} className="premium-modal no-border-modal">
          <div className="py-6 px-1">
            <Steps current={currentStep} size="small" className="mb-8 px-4"><Steps.Step title={<span className="text-[10px] font-black uppercase">基础信息</span>} /><Steps.Step title={<span className="text-[10px] font-black uppercase">组织结构</span>} /><Steps.Step title={<span className="text-[10px] font-black uppercase">核心团队</span>} /></Steps>
            <div className="min-h-[400px]">
              {currentStep === 0 && (<div className="space-y-6 animate-slide-up"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">项目名称 (必填)</label><Input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="h-12 rounded-2xl shadow-sm border-slate-100" placeholder="AI 驱动的..." /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">所属比赛</label><Select value={projectForm.competition} onChange={v => setProjectForm({ ...projectForm, competition: v })} options={[{ value: '互联网+', label: '互联网+' }, { value: '挑战杯', label: '挑战杯' }, { value: '其他', label: '其他项目' }]} className="w-full h-12" /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">主攻赛道</label><Input value={projectForm.track} onChange={e => setProjectForm({ ...projectForm, track: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="高教主赛道" /></div></div></div>)}
              {currentStep === 1 && (<div className="space-y-6 animate-slide-up"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">所属学院/书院 (必填)</label><Input value={projectForm.college} onChange={e => setProjectForm({ ...projectForm, college: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="徐特立书院" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">第一指导老师 (必填)</label><Input value={projectForm.advisorName} onChange={e => setProjectForm({ ...projectForm, advisorName: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="张三 教授" /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">老师 ID (用于同步, 如 T001)</label><Input value={projectForm.advisorId} onChange={e => setProjectForm({ ...projectForm, advisorId: e.target.value })} className="h-12 rounded-2xl border-slate-100 font-bold" placeholder="输入老师工号" /></div></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase">指导导师简介 (将同步至人员库)</label><Input value={projectForm.advisorInfo} onChange={e => setProjectForm({ ...projectForm, advisorInfo: e.target.value })} className="h-12 rounded-2xl border-slate-100" placeholder="研究方向、核心专长等" /></div></div>)}
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
          <div className="flex flex-col items-center py-6">
            <Avatar size={80} className="mb-4 shadow-xl border-4 border-white" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem('va_realname') || 'User'}`} />
            <h3 className="mb-0">{localStorage.getItem('va_realname') || '访客'}</h3>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">ID: {localStorage.getItem('va_username') || 'Unidentified'}</p>
            <p className="text-slate-500 font-bold text-xs">{localStorage.getItem('va_school') || '所属机构/学院'}</p>
            <Button danger block className="mt-8 h-12 rounded-2xl font-black shadow-lg shadow-red-50" onClick={() => { localStorage.clear(); window.location.reload(); }}>安全退出</Button>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default StudentWorkspace;
