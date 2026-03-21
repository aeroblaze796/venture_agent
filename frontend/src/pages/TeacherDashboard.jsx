import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Badge } from 'antd';
import {
  DashboardOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  SearchOutlined,
  LogoutOutlined
} from '@ant-design/icons';

// ========================
// MOCK DATA
// ========================
const warningProjectsData = [
  {
    key: '1',
    projectName: '二手课本交易平台',
    leader: '张伟',
    stage: '验证阶段',
    fatalRule: 'H8 财务模型崩塌',
    aiConclusion: '单位经济不成立，获客成本高于生命周期价值。',
  },
  {
    key: '2',
    projectName: '校园外卖代拿',
    leader: '李娜',
    stage: '探索阶段',
    fatalRule: 'H1 价值主张错位',
    aiConclusion: '未触及真实痛点，需求为伪需求。',
  },
  {
    key: '3',
    projectName: 'AI 面试辅助',
    leader: '王强',
    stage: '打磨阶段',
    fatalRule: 'H3 竞品分析缺失',
    aiConclusion: '未提及市面上已有的同类垄断产品。',
  },
];

const rubricScores = [
  { code: 'R1', name: '痛点真实性', score: '2.5 / 5', status: 'warning' },
  { code: 'R2', name: '用户证据强度', score: '1.0 / 5', status: 'error' },
  { code: 'R3', name: '解决方案匹配度', score: '3.5 / 5', status: 'success' },
  { code: 'R4', name: '商业可行性', score: '1.5 / 5', status: 'error' },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('2');
  const [currentUser, setCurrentUser] = useState('老师');
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('va_username');
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/teacher/dashboard');
      const data = await res.json();
      setProjectsData(data);
    } catch (e) {
      console.error("Failed to fetch teacher dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('va_token');
    localStorage.removeItem('va_username');
    navigate('/');
  };

  const tableColumns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName', className: 'font-medium' },
    { title: '负责人', dataIndex: 'leader', key: 'leader' },
    { title: '当前阶段', dataIndex: 'stage', key: 'stage' },
    { 
      title: 'AI 风险等级', 
      dataIndex: 'risk_level', 
      key: 'risk_level',
      render: (level) => (
        <Tag color={level==='High'?'red':level==='Medium'?'orange':'green'}>
          {level === 'High' ? '高危预警' : level === 'Medium' ? '中度风险' : '运行良好'}
        </Tag>
      )
    },
    { title: 'AI 自动诊断结论', dataIndex: 'audit_summary', key: 'audit_summary', className: 'text-slate-500 text-sm' },
    { 
      title: '操作', 
      key: 'action',
      render: () => <button className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded shadow-sm text-xs font-medium transition">调阅详情</button>
    },
  ];

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const menuRef = React.useRef(null);

  // 教师资料状态
  const [userSchool, setUserSchool] = useState(localStorage.getItem('va_school') || '智慧双创学院');
  
  // 编辑状态
  const [editName, setEditName] = useState(currentUser);
  const [editSchool, setEditSchool] = useState(userSchool);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('va_username', editName);
    localStorage.setItem('va_school', editSchool);
    setCurrentUser(editName);
    setUserSchool(editSchool);
    setShowProfileModal(false);
    setShowProfileMenu(false);
  };

  // 点击外部关闭菜单
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
    // 最外层容器约束
    <div className="w-full h-screen flex flex-col overflow-hidden bg-slate-100 font-sans text-slate-800">
      
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= 1. 侧边导航栏 (Aside) ================= */}
        <aside className="w-[280px] shrink-0 bg-slate-900 text-slate-300 flex flex-col z-20 shadow-xl">
          <div className="h-[64px] shrink-0 flex items-center justify-center font-bold text-lg tracking-wider text-white border-b border-slate-800 bg-slate-950">
            教务后台 <span className="text-emerald-500 ml-1">ADMIN</span>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
            {[
              { id: '1', icon: <DashboardOutlined />, label: '班级大盘' },
              { id: '2', icon: <WarningOutlined />, label: '项目预警中心' },
              { id: '3', icon: <ExperimentOutlined />, label: '自动化批改台' },
              { id: '4', icon: <FileSearchOutlined />, label: '知识图谱干预' },
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${activeMenu === item.id ? 'bg-emerald-600 text-white font-medium shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* ================= 2. 中间核心内容区 (Main) ================= */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-50 relative">
          
          {/* Header */}
          <header className="h-[72px] shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
            <div>
              <h1 className="text-xl font-bold text-slate-800">高危项目预警与干预平台</h1>
              <p className="text-xs text-slate-500 mt-0.5">System Administration & AI Intervention Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="全局搜索学生项目..." className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white w-64 transition-all" />
              </div>

              {/* 用户头像与下拉菜单 */}
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2 relative" ref={menuRef}>
                <div 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md cursor-pointer border-2 border-white hover:scale-105 transition-transform"
                >
                  {currentUser.charAt(0).toUpperCase()}
                </div>
                <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex flex-col cursor-pointer select-none">
                  <span className="text-sm font-bold text-slate-800">{currentUser}</span>
                  <span className="text-[10px] text-slate-400">高级管理权限</span>
                </div>

                {showProfileMenu && (
                  <div className="absolute top-[120%] right-0 w-[200px] bg-white border border-slate-100 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => {setShowProfileModal(true); setShowProfileMenu(false);}}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-2 transition-colors"
                    >
                      <DashboardOutlined /> 个人资料
                    </button>
                    <button 
                      onClick={() => {setShowSettingsModal(true); setShowProfileMenu(false);}}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-2 transition-colors"
                    >
                       <LogoutOutlined /> 账号设置
                    </button>
                    <div className="h-px bg-slate-50 my-1 mx-2" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 text-xs flex items-center gap-2 transition-colors font-bold"
                    >
                      <LogoutOutlined /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* 滚动工作区 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="w-full mx-auto flex flex-col gap-6">

              {/* 核心指标卡片 (Stats Row) */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-sm text-slate-500 mb-2">当前辅导项目总数</span>
                  <span className="text-3xl font-bold text-slate-800">{projectsData.length}<span className="text-sm text-slate-400 font-normal ml-2">个</span></span>
                </div>
                <div className="bg-white p-6 rounded-2xl border-b-4 border-b-red-500 shadow-sm flex flex-col relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-red-100 text-6xl opacity-30"><WarningOutlined /></div>
                  <span className="text-sm text-slate-500 mb-2 flex items-center gap-1.5">
                    <WarningOutlined className="text-red-500" /> 高危预警项目
                  </span>
                  <span className="text-3xl font-bold text-red-600">{projectsData.filter(p=>p.risk_level==='High').length}<span className="text-sm text-red-400 font-normal ml-2">项待处理</span></span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-sm text-slate-500 mb-2">平均自动诊断深度</span>
                  <div className="flex items-end gap-3 mt-1">
                    <span className="text-3xl font-bold text-slate-800">100%</span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[100%] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <span className="text-sm text-slate-500 mb-2">AI 生成建议覆盖率</span>
                  <span className="text-lg font-bold text-slate-800 truncate">全量覆盖</span>
                  <span className="text-xs text-orange-500 mt-1 bg-orange-50 w-fit px-2 py-0.5 rounded">Real-time Auditing</span>
                </div>
              </div>

              {/* 区域 A：预警清单 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <Badge status="error" />
                  <h2 className="text-base font-semibold text-slate-800">区域 A：风险项目预警清单</h2>
                </div>
                <div className="p-0">
                  <Table 
                    columns={tableColumns} 
                    dataSource={projectsData} 
                    pagination={false}
                    size="middle"
                    loading={loading}
                    className="border-none"
                    rowKey="id"
                  />
                </div>
              </div>

              {/* 区域 B：证据链工作台 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-12">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-emerald-500" />
                    <h2 className="text-base font-semibold text-slate-800">区域 B：Evidence-Trace 批改工作台 (当前选中: 二手课本交易平台)</h2>
                  </div>
                  <button className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 font-medium">
                    生成批改报告
                  </button>
                </div>
                
                {/* 左右拆分区域 */}
                <div className="flex p-6 gap-8">
                  
                  {/* 左半边评分表 */}
                  <div className="w-[350px] shrink-0 border-r border-slate-100 pr-8 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Rubric R1-R9 量表校验</h3>
                    {rubricScores.map(item => (
                      <div key={item.code} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Badge status={item.status} />
                          <span className="font-bold text-slate-500">[{item.code}]</span>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${item.status === 'error' ? 'text-red-500' : 'text-slate-700'}`}>{item.score}</span>
                          <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded">追溯</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 右半边原始材料 */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">原始商业计划书提取层 (AI Evidence Highlight)</h3>
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-inner text-slate-700 leading-loose min-h-[300px] text-[15px]">
                      <p className="mb-4">
                        本项目致力于解决大学生群体中普遍存在的教材浪费问题。每学期末，大量旧书被当做废纸处理，而新生开学时又要花费大量金钱购买新书。
                      </p>
                      <p className="mb-4">
                        我们的目标群体非常明确。<span className="bg-yellow-200/80 border-b-2 border-yellow-400 px-1 py-0.5 rounded-sm relative cursor-pointer group">
                          经过我们对身边舍友的询问，大家一致认为去跳蚤市场卖书太麻烦了，如果有一个专门的小程序会很方便。
                          {/* 悬浮气泡 */}
                          <span className="absolute left-0 bottom-full mb-2 w-72 bg-slate-900 text-slate-200 text-sm p-4 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 before:absolute before:-bottom-2 before:left-6 before:border-8 before:border-transparent before:border-t-slate-900 leading-normal">
                            <strong className="text-white block mb-1">🚨 诊断触发：[R2: 用户证据强度]</strong>
                            在此处匹配到团队支撑论点。<br/>
                            <span className="text-orange-400 font-medium">弱证据：仅“询问舍友”样本量极小且存在严重幸存者偏差，判定为【伪需求风险】。</span>
                          </span>
                        </span> 这证明了我们的项目拥有巨大的市场潜力。
                      </p>
                      <p>
                        因此，我们计划开发一款校园二手书交易小程序，收取 5% 的交易手续费作为主要盈利来源，前期通过地推方式在各大高校进行铺开...
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* 教师个人资料 Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">教务人员资料修改</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">教师姓名</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">所属学院/机构</label>
                <input 
                  type="text" 
                  value={editSchool}
                  onChange={e => setEditSchool(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-bold mr-1">提示:</span> 
                  修改后的信息将同步至全校看板及学生端的“辅导老师”名片，请确保信息的准确性。
                </p>
              </div>
              <button 
                type="submit"
                className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all text-sm"
              >
                更新管理员信息
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 教师设置 Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">控制面板设置</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-emerald-600 uppercase mb-4">预警系统配置</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">开启实时风险推送</span>
                    <div className="w-10 h-5 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">自动生成周报报告</span>
                    <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">界面显示</h4>
                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                  <span className="text-sm text-slate-600">数据图谱显示深度</span>
                  <select className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer">
                    <option>2层级 (推荐)</option>
                    <option>3层级 (详细)</option>
                    <option>全面展示</option>
                  </select>
                </div>
              </section>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowSettingsModal(false)} className="px-5 py-2 text-slate-500 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors">取消</button>
                <button onClick={() => setShowSettingsModal(false)} className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors shadow-lg">保存配置</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
