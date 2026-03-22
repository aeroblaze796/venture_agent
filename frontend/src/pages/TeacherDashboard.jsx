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
  SyncOutlined
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
  const [teacherName, setTeacherName] = useState(localStorage.getItem('va_realname'));
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

        <div className="p-4 bg-slate-900/50 mt-auto">
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-slate-800 p-2 rounded-lg" onClick={() => setShowProfileModal(true)}>
            <Avatar size="large" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherName}`} border="2px solid #10b981" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{teacherName}</p>
              <p className="text-[10px] text-slate-500">指导教师</p>
            </div>
          </div>
          <Button block type="text" icon={<LogoutOutlined />} onClick={handleLogout} className="text-slate-500 hover:text-rose-400">退出系统</Button>
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
               <>
                 <Button loading={auditLoading} type="primary" onClick={triggerAudit} icon={<RobotOutlined />} className="bg-indigo-600 border-none">
                    AI 深度审计
                 </Button>
                 <Button type="primary" ghost icon={<SendOutlined />} onClick={() => setActiveMenu('intervention')} className="border-emerald-500 text-emerald-600">
                   下发干预锦囊
                 </Button>
               </>
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

              {/* 核心洞察卡片 (高对比度容器测试) */}
              <div className="grid grid-cols-3 gap-8">
                <Card 
                  title={<span className="text-slate-800"><WarningOutlined className="mr-2 text-rose-500" /> Top 商业逻辑盲区 (H原则冲突)</span>} 
                  className="col-span-3 border-none shadow-md rounded-2xl bg-white"
                >
                  <div className="grid grid-cols-3 gap-4">
                    {topMistakes.length > 0 ? topMistakes.map((m, i) => (
                      <div key={i} className="p-5 bg-rose-50 rounded-2xl border border-rose-100 transition-all hover:bg-rose-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-bold rounded-full">{m.name.split(' ')[0]}</span>
                          <span className="text-rose-400 font-black text-xl">#{i+1}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-1">{m.name}</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{m.desc}</p>
                        <div className="mt-4 pt-4 border-t border-rose-200/50 flex items-center justify-between text-[11px] font-bold text-rose-600 uppercase">
                          <span>波及范围</span>
                          <span>{m.count} 个项目单元</span>
                        </div>
                      </div>
                    )) : <Empty description="暂无共性风险点" />}
                  </div>
                </Card>
              </div>

              <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-slate-800 font-bold m-0">当前名下项目监控清单</h3>
                  <Button type="link" size="small">刷新数据</Button>
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
                
                {/* 评分看板 */}
                <div className="col-span-4 space-y-6">
                  <Card title="R1-R9 专业打分分布" className="border-none shadow-sm rounded-2xl">
                    <div className="mb-6 pt-2">
                       <RadarChart data={projectDetail?.assessment} />
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'R1 创新性', score: projectDetail?.assessment?.r1_score },
                        { label: 'R2 证据可靠度', score: projectDetail?.assessment?.r2_score },
                        { label: 'R8 盈利能力', score: projectDetail?.assessment?.r8_score },
                        { label: 'R9 团队背景', score: projectDetail?.assessment?.r9_score }
                      ].map((r, i) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex justify-between text-xs mb-1 font-bold text-slate-500">
                            <span>{r.label}</span>
                            <span className="text-slate-900">{r.score?.toFixed(1) || '0.0'}</span>
                          </div>
                          <Progress percent={(r.score || 0) * 20} strokeColor={r.score >= 4 ? '#10b981' : r.score >= 2 ? '#f59e0b' : '#ef4444'} showInfo={false} />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="项目核心风险画像 (R1-R9 评估)" className="border-none shadow-sm rounded-2xl overflow-hidden">
                     <div className="flex flex-col items-center justify-center p-4">
                        <RadarChart data={{
                          r1: projectDetail?.assessment?.r1_score,
                          r2: projectDetail?.assessment?.r2_score,
                          r3: projectDetail?.assessment?.r3_score,
                          r4: projectDetail?.assessment?.r4_score,
                          r5: projectDetail?.assessment?.r5_score,
                          r6: projectDetail?.assessment?.r6_score,
                          r7: projectDetail?.assessment?.r7_score,
                          r8: projectDetail?.assessment?.r8_score,
                          r9: projectDetail?.assessment?.r9_score
                        }} />
                        <div className="mt-6">
                          <Tag color="red" className="px-6 py-2 text-xl font-bold rounded-2xl border-none shadow-lg">
                            {projectDetail?.assessment?.overall_risk || '评估中'} 风险
                          </Tag>
                        </div>
                     </div>
                     <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">AI 自动定级结论</p>
                  </Card>
                </div>

                {/* 辅导建议与干预 */}
                <div className="col-span-8 space-y-6">
                  <div className="bg-slate-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                    <RobotOutlined className="absolute -right-4 -bottom-4 text-white/5 text-9xl transform -rotate-12" />
                    <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 text-lg">
                       <ThunderboltOutlined /> 当前项目底层审计报告 (H原则检索)
                    </h3>
                    <div className="text-lg leading-relaxed font-medium italic text-slate-100">
                      "{projectDetail?.assessment?.audit_summary || '暂无详细审计报告，请引导学生完善文档。'}"
                    </div>
                  </div>

                  <Card title="指导师博弈追踪 (最近互动)" className="border-none shadow-sm rounded-2xl">
                     <div className="space-y-4">
                        {projectDetail?.battle_logs?.length > 0 ? projectDetail.battle_logs.map((log, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl text-sm ${log.role === 'user' ? 'bg-slate-100 border border-slate-200' : 'bg-emerald-50 border border-emerald-100'}`}>
                             <p className="text-[10px] font-bold uppercase opacity-50 mb-1">{log.role === 'user' ? '学生提问' : 'Agent 诊断'}</p>
                             <div className="text-slate-800 leading-relaxed font-semibold">{log.text}</div>
                          </div>
                        )) : <Empty description="暂无对话记录" />}
                     </div>
                  </Card>

                  {/* 干预快捷入口 */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                       <Avatar src={`https://api.dicebear.com/7.x/identicon/svg?seed=admin`} />
                       <h3 className="text-slate-900 font-black m-0 text-xl uppercase tracking-tighter">Teaching Intervention Center</h3>
                    </div>
                    <TextArea 
                      rows={4} 
                      value={interventionText}
                      onChange={e => setInterventionText(e.target.value)}
                      placeholder="点此输入辅导指令。例如：要求项目组针对本月竞品融资情况补充防御策略..."
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-2xl focus:ring-emerald-500 text-base"
                    />
                    <div className="mt-6 flex justify-between items-center">
                      <p className="text-xs text-slate-400 max-w-md">
                        * 锦囊说明：内容将被即时注入学生端的 System Prompt。Agent 将会在下一次对话中以隐性方式引导学生思考。
                      </p>
                      <Button type="primary" size="large" icon={<SendOutlined />} onClick={handleSendIntervention} className="bg-emerald-600 border-none rounded-2xl h-12 px-10 font-bold shadow-lg shadow-emerald-500/20">
                        下发锦囊
                      </Button>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .ant-table { background: white !important; }
        .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b !important; border-bottom: 2px solid #f1f5f9 !important; text-transform: uppercase; font-size: 11px; }
        .ant-table-tbody > tr > td { border-bottom: 1px solid #f1f5f9 !important; transition: all 0.3s; }
        .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
        .ant-card-head { border-bottom: 1px solid #f1f5f9 !important; min-height: 56px; }
        .ant-card-head-title { font-weight: 800; color: #1e293b; font-size: 15px; }
        .ant-progress-inner { background-color: #f1f5f9 !important; }
      `}} />

    </div>
  );
}
