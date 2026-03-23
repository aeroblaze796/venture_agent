import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfileModal from '../components/UserProfileModal';
import { 
  Table, Tag, Badge, Progress, Card, Button, 
  Statistic, Empty, Spin, message as antMessage,
  Tabs, Input, Modal, Descriptions, List, Avatar
} from 'antd';
import {
  DashboardOutlined,
  WarningOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  SearchOutlined,
  LogoutOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SendOutlined,
  AuditOutlined,
  LineChartOutlined,
  ProjectOutlined,
  UserOutlined,
  BookOutlined,
  SyncOutlined,
  EditOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;

const RadarChart = ({ data }) => {
  if (!data) return null;
  const scores = [
    data.r1_score || data.r1 || 0, data.r2_score || data.r2 || 0, 
    data.r3_score || data.r3 || 0, data.r4_score || data.r4 || 0, 
    data.r5_score || data.r5 || 0, data.r6_score || data.r6 || 0,
    data.r7_score || data.r7 || 0, data.r8_score || data.r8 || 0,
    data.r9_score || data.r9 || 0
  ];
  const labels = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"];
  const centerX = 100, centerY = 100, radius = 70;
  const points = scores.map((s, i) => {
    const angle = (Math.PI * 2 * i) / 9 - Math.PI / 2;
    const r = (s / 5) * radius;
    return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto overflow-visible">
      {/* 网格线 */}
      {[1, 2, 3, 4, 5].map(tick => (
        <polygon 
          key={tick}
          points={labels.map((_, i) => {
            const angle = (Math.PI * 2 * i) / 9 - Math.PI / 2;
            const r = (tick / 5) * radius;
            return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none" stroke="#e2e8f0" strokeWidth="1"
        />
      ))}
      <polygon points={points} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" />
      {labels.map((l, i) => {
        const angle = (Math.PI * 2 * i) / 9 - Math.PI / 2;
        const x = centerX + (radius + 15) * Math.cos(angle);
        const y = centerY + (radius + 15) * Math.sin(angle);
        return <text key={l} x={x} y={y} fontSize="10" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fill="#94a3b8">{l}</text>;
      })}
    </svg>
  );
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('overview'); // 'overview' 或 项目ID
  const [teacherName, setTeacherName] = useState(() => {
    const name = localStorage.getItem('va_realname');
    const id = localStorage.getItem('va_username');
    if (name && name !== 'null' && name !== 'undefined') return name;
    if (id && id !== 'null' && id !== 'undefined') return id;
    return 'Unknown Instructor';
  });
  const [teacherId, setTeacherId] = useState(localStorage.getItem('va_username'));
  const [loading, setLoading] = useState(false);
  
  // 数据状态
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ student_count: 0, project_count: 0, high_risk_count: 0 });
  const [coverage, setCoverage] = useState({});
  const [topMistakes, setTopMistakes] = useState([]);
  const [projectDetail, setProjectDetail] = useState(null);
  const [interventionText, setInterventionText] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(teacherName);
  const [editId, setEditId] = useState(teacherId);

  useEffect(() => {
    if (!teacherName) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [teacherName, teacherId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/teacher/dashboard?teacher_id=${encodeURIComponent(teacherId)}`);
      const data = await res.json();
      setProjects(data.projects || []);
      setStats(data.stats || { student_count: 0, project_count: 0, high_risk_count: 0 });
      setTopMistakes(data.top_mistakes || []);
      
      // 如果当前正在查看某个项目详情，同步刷新详情
      if (activeMenu !== 'overview') {
        await selectProject(parseInt(activeMenu));
      }
    } catch (e) {
      antMessage.error("获取大盘数据失败");
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/teacher/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetail(data);
        setActiveMenu(id.toString());
      }
    } catch (e) {
      antMessage.error("获取项目详情失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSendIntervention = async () => {
    if (!interventionText.trim() || !projectDetail) return;
    try {
      const res = await fetch(`http://localhost:8000/api/teacher/interventions?project_id=${projectDetail.project.id}&teacher_name=${encodeURIComponent(teacherName)}&content=${encodeURIComponent(interventionText)}`, {
        method: 'POST'
      });
      if (res.ok) {
        antMessage.success("干预锦囊已成功下发");
        setInterventionText('');
      }
    } catch (e) {
      antMessage.error("下发失败");
    }
  };

  const triggerAudit = async () => {
    if (!projectDetail) return;
    setAuditLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/teacher/projects/${projectDetail.project.id}/audit`, { method: 'POST' });
      if (res.ok) {
        antMessage.success("AI 深度审计完成");
        // 重新获取详情
        await selectProject(projectDetail.project.id);
        await fetchDashboardData();
      }
    } catch (e) {
      antMessage.error("审计触发失败");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // 表格定义
  const columns = [
    { 
      title: '项目名称', 
      dataIndex: 'name', 
      key: 'name', 
      className: 'font-bold text-slate-800',
      render: (text) => <span className="text-slate-900">{text}</span>
    },
    { 
      title: '负责人', 
      dataIndex: 'owner_id', 
      key: 'owner_id',
      render: (id) => <Tag icon={<UserOutlined />}>{id}</Tag>
    },
    { 
      title: '风险等级', 
      dataIndex: 'risk_level', 
      render: (lv) => (
        <Badge status={lv === 'High' ? 'error' : lv === 'Medium' ? 'warning' : 'success'} text={lv === 'High' ? '高风险' : lv === 'Medium' ? '中风险' : '正常'} />
      )
    },
    { 
      title: '操作', 
      render: (_, record) => (
        <Button type="primary" size="small" shape="round" onClick={() => selectProject(record.id)}>
          进入辅导
        </Button>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans overflow-hidden">
      
      {/* 侧边导航 - 项目选择器 */}
      <aside className="w-72 bg-[#1e293b] flex flex-col border-r border-white/5 shadow-2xl z-20">
        <div className="p-6">
          <h1 className="text-xl font-black text-white tracking-widest flex items-center gap-2">
            <RobotOutlined className="text-emerald-400" />
            VentureAdmin
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Instructor Hub</p>
        </div>
        
        <div className="px-4 mb-4">
          <div 
            onClick={() => setActiveMenu('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${activeMenu === 'overview' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <DashboardOutlined /> 全量项目大盘
          </div>
        </div>

        <div className="px-6 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">辅导项目列表</p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar space-y-1">
          {projects.length > 0 ? projects.map(p => (
            <div 
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border border-transparent ${activeMenu === p.id.toString() ? 'bg-slate-800 border-emerald-500/50 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ProjectOutlined className={activeMenu === p.id.toString() ? 'text-emerald-400' : 'text-slate-600'} />
                <span className="text-sm truncate">{p.name}</span>
              </div>
              {p.risk_level === 'High' && <Badge dot status="error" />}
            </div>
          )) : <div className="p-4 text-center text-slate-600 text-xs text-italic">暂无待辅导项目</div>}
        </nav>

        <div className="p-4 border-t border-white/5 m-4 text-center mt-auto">
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-slate-800 p-2 rounded-lg" onClick={() => setShowProfileModal(true)}>
            <Avatar size="large" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherName}`} border="2px solid #10b981" />
            <div className="overflow-hidden text-left">
              <p className="text-sm font-bold truncate text-white">{teacherName}</p>
              <p className="text-[10px] text-slate-500">指导教师</p>
            </div>
          </div>
          <div 
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-white/5 cursor-pointer transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <LogoutOutlined /> 安全退出系统
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto pb-20 bg-[#f1f5f9] relative">
        
        {/* Header Bar */}
        <header className="sticky top-0 h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {activeMenu === 'overview' ? "辅导项目全景大盘" : (
              <>
                <BookOutlined className="text-emerald-500" />
                辅导中: <span className="text-emerald-600">{projectDetail?.project?.name}</span>
              </>
            )}
          </h2>
          <div className="flex gap-4 items-center">
             <Button 
               type="text" 
               icon={<SyncOutlined spin={loading} />} 
               onClick={fetchDashboardData}
               title="同步最新数据"
             />
             {activeMenu !== 'overview' && (
               <Button loading={auditLoading} type="primary" onClick={triggerAudit} icon={<RobotOutlined />} className="bg-indigo-600 border-none">
                  AI 重新审计
               </Button>
             )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeMenu === 'overview' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* 数据统计网格 */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: "辅导学生数", value: stats.student_count, unit: "人", color: "text-slate-900" },
                  { label: "在孵项目", value: stats.project_count, unit: "个", color: "text-slate-900" },
                  { label: "核心风险项", value: stats.high_risk_count, unit: "项", color: "text-rose-600" },
                  { label: "平均评估率", value: "92%", unit: "", color: "text-emerald-600" }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl">
                    <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-bold">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.color}`}>
                      {stat.value}<span className="text-xs ml-1 font-normal opacity-40">{stat.unit}</span>
                    </p>
                  </Card>
                ))}
              </div>

              {/* 核心洞察卡片 */}
              <Card 
                title={<span><WarningOutlined className="mr-2 text-rose-500" /> Top 商业逻辑盲区 (H原则冲突)</span>} 
                className="border-none shadow-md rounded-3xl bg-white"
              >
                <div className="grid grid-cols-3 gap-6">
                  {topMistakes.length > 0 ? topMistakes.map((m, i) => (
                    <div key={i} className="p-6 bg-rose-50/50 rounded-[24px] border border-rose-100/50 transition-all hover:bg-rose-100/50">
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 bg-rose-200 text-rose-700 text-[10px] font-black rounded-full uppercase">{m.name.split(' ')[0]}</span>
                        <span className="text-rose-300 font-black text-2xl">0{i+1}</span>
                      </div>
                      <p className="text-sm font-black text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed h-12 overflow-hidden">{m.desc}</p>
                      <div className="mt-4 pt-4 border-t border-rose-200/30 flex items-center justify-between text-[10px] font-black text-rose-600 uppercase tracking-widest">
                        <span>波及范围</span>
                        <span>{m.count} PROJECTS</span>
                      </div>
                    </div>
                  )) : <Empty description="暂无共性风险点" />}
                </div>
              </Card>

              {/* 项目清单 */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-2">
                <div className="px-6 py-4 border-slate-50 flex justify-between items-center">
                  <h3 className="text-slate-800 font-black m-0 uppercase tracking-tighter">Monitoring Inventory</h3>
                  <Tag color="blue" className="rounded-full border-none px-3 font-bold">{projects.length} ACTIVE</Tag>
                </div>
                <Table 
                  dataSource={projects} 
                  columns={columns} 
                  pagination={false} 
                  rowKey="id"
                  loading={loading}
                />
              </div>

            </div>
          ) : (
            /* 项目详情辅导视角 */
            <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-8">
              <div className="grid grid-cols-12 gap-8">
                
                {/* 核心整合：全景评估中心 */}
                <div className="col-span-12">
                  <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-white p-2">
                    <div className="grid grid-cols-12 gap-0">
                      {/* 左侧：多维雷达与风险定级 */}
                      <div className="col-span-4 border-r border-slate-100 p-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-l-[32px]">
                        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Matrix Analysis</h4>
                        <div className="relative">
                           <RadarChart data={projectDetail?.assessment} />
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <div className="mt-32">
                                <Tag color={projectDetail?.assessment?.overall_risk === 'High' ? 'red' : 'orange'} className="px-6 py-2 text-sm font-black rounded-full border-none shadow-xl scale-110">
                                  {projectDetail?.assessment?.overall_risk || 'PENDING'} RISK
                                </Tag>
                              </div>
                           </div>
                        </div>
                        <p className="mt-12 text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">R1-R9 Structural Model</p>
                      </div>

                      {/* 中间：细分维度评分 */}
                      <div className="col-span-3 p-10 flex flex-col justify-center border-r border-slate-100">
                        <h4 className="text-slate-800 text-sm font-black mb-8 flex items-center gap-2">
                          <LineChartOutlined className="text-emerald-500" /> 维度透视
                        </h4>
                        <div className="space-y-6">
                          {[
                            { label: 'R1 创新性', key: 'r1_score' },
                            { label: 'R2 可靠度', key: 'r2_score' },
                            { label: 'R8 盈利力', key: 'r8_score' },
                            { label: 'R9 团队力', key: 'r9_score' }
                          ].map((r, i) => {
                            const val = projectDetail?.assessment?.[r.key] || 0;
                            return (
                              <div key={i} className="flex flex-col">
                                <div className="flex justify-between text-[11px] mb-2 font-black text-slate-500 uppercase tracking-tighter">
                                  <span>{r.label}</span>
                                  <span className="text-slate-900">{val.toFixed(1)}</span>
                                </div>
                                <Progress percent={val * 20} strokeColor={val >= 4 ? '#10b981' : val >= 2.5 ? '#f59e0b' : '#ef4444'} showInfo={false} strokeWidth={8} className="rounded-full" />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 右侧：导师专线审计报告 */}
                      <div className="col-span-5 p-10 bg-slate-900 text-white rounded-r-[32px] relative overflow-hidden flex flex-col">
                        <RobotOutlined className="absolute -right-10 -bottom-10 text-white/5 text-[240px] transform rotate-12" />
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-8">
                            <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                              <AuditOutlined /> Instructor-Only Expert Audit
                            </h4>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-400">DeepSeek Core</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm relative mb-6">
                             <div className="text-lg leading-relaxed font-semibold text-slate-100 italic">
                               "{projectDetail?.assessment?.audit_summary || '暂无深度审计报告。作为指导老师，您可以点击下方按钮启动 Agent 对项目底层逻辑的穿透式审计。评分与报告将基于 H 原则与 R 体系自动生成。'}"
                             </div>
                             {projectDetail?.assessment?.evidence_trace && (
                               <div className="mt-6 pt-6 border-t border-white/10 z-20 relative">
                                 <p className="text-xs text-emerald-400 font-bold mb-3 flex items-center gap-2 uppercase tracking-widest"><FileSearchOutlined /> 漏洞原文溯源 (Evidence Trace)</p>
                                 <div className="text-sm text-slate-300 bg-black/30 p-5 rounded-2xl font-mono leading-relaxed border border-white/5 shadow-inner">
                                   {projectDetail.assessment.evidence_trace}
                                 </div>
                               </div>
                             )}
                             <div className="absolute top-4 right-6 text-4xl text-white/10 opacity-50 font-serif z-0">“</div>
                          </div>

                          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest m-0">Generated by Venture Agent V4.9</p>
                            <Button type="primary" size="large" onClick={triggerAudit} loading={auditLoading} className="bg-emerald-600 hover:bg-emerald-500 border-none font-black text-xs h-12 px-8 rounded-2xl shadow-xl shadow-emerald-500/20">
                              EXECUTE RE-AUDIT
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 辅导互动区 */}
                <div className="col-span-12 grid grid-cols-12 gap-8 mt-8">
                  <div className="col-span-7">
                    <Card title={<span className="text-slate-800 font-black uppercase tracking-tight"><ThunderboltOutlined className="mr-2 text-indigo-500" /> Historical Battle Logs</span>} className="border-none shadow-xl rounded-[40px] h-full p-2">
                       <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                          {projectDetail?.battle_logs?.length > 0 ? projectDetail.battle_logs.map((log, idx) => (
                            <div key={idx} className={`p-6 rounded-[24px] text-sm relative overflow-hidden ${log.role === 'user' ? 'bg-slate-50 border border-slate-100' : 'bg-emerald-50/30 border border-emerald-100/50'}`}>
                               <div className="relative z-10">
                                 <p className="text-[9px] font-black uppercase opacity-40 mb-3 tracking-[0.2em]">{log.role === 'user' ? 'Student Inquiry' : 'Agent Diagnosis'}</p>
                                 <div className="text-slate-800 leading-relaxed font-bold text-base">{log.text}</div>
                               </div>
                            </div>
                          )) : <Empty className="py-20" description="暂无对话博弈记录" />}
                       </div>
                    </Card>
                  </div>
                  
                  <div className="col-span-5">
                    <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-2xl h-full flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-1000"></div>
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center">
                            <EditOutlined className="text-indigo-600 text-2xl" />
                         </div>
                         <div>
                            <h3 className="text-slate-900 font-black m-0 text-2xl uppercase tracking-tighter">Teaching Intervention</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">下发指令同步至学生端 Agent</p>
                         </div>
                      </div>
                      <TextArea 
                        rows={8} 
                        value={interventionText}
                        onChange={e => setInterventionText(e.target.value)}
                        placeholder="请输入您的指导建议。例如：强制要求项目组在本周内完成目标用户的访谈，并提交 H 原则下的价值主张偏差报告..."
                        className="bg-slate-50/50 border-none text-slate-900 rounded-[32px] focus:ring-emerald-500 text-lg p-8 flex-1 placeholder:text-slate-300 shadow-inner"
                      />
                      <div className="mt-10">
                        <Button type="primary" size="large" block icon={<SendOutlined />} onClick={handleSendIntervention} className="bg-slate-900 hover:bg-emerald-600 border-none rounded-[24px] h-20 font-black text-lg shadow-2xl shadow-indigo-500/20 transition-all active:scale-95">
                          ACTIVATE INSTRUCTION
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <UserProfileModal 
        visible={showProfileModal} 
        onCancel={() => setShowProfileModal(false)} 
        username={localStorage.getItem('va_username') || 'teacher'} 
      />

      <style dangerouslySetInnerHTML={{__html: `
        .ant-card-head { border-bottom: 1px solid #f1f5f9 !important; min-height: 56px; }
        .ant-card-head-title { font-weight: 800; color: #1e293b; font-size: 15px; }
        .ant-progress-inner { background-color: #f1f5f9 !important; }
      `}} />

    </div>
  );
}
