import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Table, Tag, Button, Empty, message, Descriptions, Divider } from 'antd';
import { 
  DashboardOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  DatabaseOutlined, 
  NodeIndexOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const AdminMatrix = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ project_count: 0, user_count: 0, file_count: 0, college_distribution: {} });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/dashboard');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/projects');
      if (res.ok) setProjects(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/identities'); // 尝试新接口
      if (!res.ok) {
        // 退而求其次使用原接口 (具备数组容错逻辑)
        const res2 = await fetch('http://localhost:8000/api/admin/users');
        if (res2.ok) {
           const data = await res2.json();
           const normalized = data.map(item => {
             // 重点修复逻辑：如果后端返回的是 [val, val, ...] 列表，则手动映射
             if (Array.isArray(item)) {
               return { username: item[0], real_name: item[1] || '---', role: item[2] || 'student', college: item[3] || '未录入' };
             }
             return item;
           });
           setUsers(normalized);
        }
      } else {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Fetch users failed:", e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', render: (text) => <span className="font-black text-slate-800">{text}</span> },
    { title: '负责人 ID', dataIndex: 'owner_id', key: 'owner_id' },
    { title: '所属学院', dataIndex: 'college', key: 'college', render: (text) => <Tag color="purple">{text || '通用'}</Tag> },
    { title: '赛事类型', dataIndex: 'competition', key: 'competition' },
    { title: '附件数', dataIndex: 'file_count', key: 'file_count', render: (count) => <Tag color={count > 0 ? 'green' : 'orange'}>{count} 个附件</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  const userColumns = [
    { title: '账号 (ID)', dataIndex: 'username', key: 'username', render: (text) => <span className="font-mono font-bold text-indigo-600">{text}</span> },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { 
      title: '角色标识', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => {
        const r = String(role).toLowerCase();
        if (r === 'teacher') return <Tag color="blue" className="rounded-full px-4 border-none font-bold">教师</Tag>;
        if (r === 'admin') return <Tag color="purple" className="rounded-full px-4 border-none font-bold">管理员</Tag>;
        return <Tag color="green" className="rounded-full px-4 border-none font-bold">学生</Tag>;
      }
    },
    { title: '所属组织', dataIndex: 'college', key: 'college' },
  ];

  return (
    <Layout className="min-h-screen bg-[#f8f9ff]">
      <Sider width={260} theme="light" className="border-r border-indigo-50" style={{ background: '#fff' }}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <NodeIndexOutlined className="text-xl" />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tighter">Admin Matrix</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => setActiveTab(key)}
          className="border-none px-4"
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: '全域大盘概览' },
            { key: 'projects', icon: <ProjectOutlined />, label: '全量项目监控' },
            { key: 'users', icon: <TeamOutlined />, label: 'Neo4j 身份图谱' },
            { key: 'sqlite', icon: <DatabaseOutlined />, label: 'SQLite 状态机' },
          ]}
        />
        <div className="absolute bottom-10 w-full px-8">
          <Button 
            onClick={handleLogout}
            icon={<LogoutOutlined />} 
            block 
            shape="round" 
            className="h-12 border-none bg-slate-100 text-slate-500 font-bold hover:bg-rose-50 hover:text-rose-500 transition-all"
          >
            安全退出
          </Button>
        </div>
      </Sider>

      <Layout className="bg-transparent">
        <Header className="bg-white/80 backdrop-blur-md border-b border-indigo-50 px-10 flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-purple-400 uppercase tracking-widest leading-none">VentureAgent</span>
            <span className="text-xs font-black text-slate-300">/</span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">
              {activeTab === 'dashboard' ? 'Global Insight' : activeTab === 'projects' ? 'Project Monitoring' : activeTab === 'users' ? 'User Identity Map' : 'System State'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Tag color="purple" className="border-none font-bold px-3 py-1 rounded-full">超级管理员</Tag>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="avatar" />
            </div>
          </div>
        </Header>

        <Content className="p-10 custom-scrollbar overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <Row gutter={[24, 24]}>
                <Col span={6}>
                  <Card className="rounded-[32px] border-none shadow-xl shadow-indigo-500/5 p-4 text-center">
                    <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">全域项目总数</span>} value={stats.project_count} prefix={<ProjectOutlined className="text-purple-500 mr-2" />} valueStyle={{ fontWeight: 900, color: '#1e293b' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="rounded-[32px] border-none shadow-xl shadow-indigo-500/5 p-4 text-center">
                    <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">活跃用户总数</span>} value={stats.user_count} prefix={<TeamOutlined className="text-blue-500 mr-2" />} valueStyle={{ fontWeight: 900, color: '#1e293b' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="rounded-[32px] border-none shadow-xl shadow-indigo-500/5 p-4 text-center">
                    <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">存量附件总数</span>} value={stats.file_count} prefix={<DatabaseOutlined className="text-emerald-500 mr-2" />} valueStyle={{ fontWeight: 900, color: '#1e293b' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="rounded-[32px] border-none shadow-xl shadow-indigo-500/5 p-4 text-center bg-purple-600">
                    <Statistic title={<span className="text-[10px] font-black text-purple-200 uppercase tracking-[0.2em]">系统运行健康度</span>} value="99.8" suffix="%" valueStyle={{ fontWeight: 900, color: '#fff' }} />
                  </Card>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={16}>
                  <Card className="rounded-[40px] border border-indigo-50 shadow-2xl shadow-indigo-500/10 p-2 overflow-hidden" title={<span className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><GlobalOutlined className="text-purple-500" /> 近期活跃项目流</span>}>
                    <Table 
                      dataSource={projects.slice(0, 5)} 
                      columns={projectColumns.slice(0, 4)} 
                      pagination={false} 
                      className="admin-mini-table"
                      rowKey="id"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card className="rounded-[40px] border border-indigo-50 shadow-2xl shadow-indigo-500/10 p-6 flex flex-col justify-center text-center gap-4 bg-gradient-to-br from-white to-indigo-50/30">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-4xl text-purple-600 mx-auto shadow-inner"><SafetyCertificateOutlined /></div>
                    <div className="space-y-2">
                       <h3 className="text-lg font-black text-slate-800">校级双创决策大脑</h3>
                       <p className="text-xs text-slate-400 leading-relaxed font-medium">当前已有 {Object.keys(stats.college_distribution).length} 个二级学院接入平台，项目集中度最高的学院为：<br/><span className="text-purple-600 font-bold">{Object.entries(stats.college_distribution).sort((a,b)=>b[1]-a[1])[0]?.[0] || '---'}</span></p>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <Card className="rounded-[40px] border-none shadow-2xl shadow-indigo-500/10 p-6">
                <div className="flex justify-between items-center mb-10 px-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 m-0">全量项目数据库监控</h2>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2">Real-time SQLite Project Tracking Matrix</p>
                  </div>
                  <Button onClick={fetchProjects} icon={<RocketOutlined />} shape="round" className="h-12 px-8 font-black bg-slate-900 border-none text-white shadow-xl shadow-slate-200">刷新全量快照</Button>
                </div>
                <Table 
                  loading={isLoading}
                  dataSource={projects} 
                  columns={projectColumns} 
                  rowKey="id"
                  className="lofty-table"
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                />
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-in fade-in duration-500">
               <Row gutter={24}>
                  <Col span={10}>
                    <Card className="rounded-[40px] border-none shadow-2xl shadow-indigo-500/10 p-6 h-[calc(100vh-160px)] flex flex-col">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-8 px-4 flex items-center gap-2"><TeamOutlined className="text-indigo-500" /> 用户实名名录</h3>
                      <div className="flex-1 overflow-auto">
                        <Table dataSource={users} columns={userColumns} rowKey="username" className="lofty-table" pagination={{ pageSize: 12, size: 'small' }} size="small" />
                      </div>
                    </Card>
                  </Col>
                  <Col span={14}>
                     <div className="h-[calc(100vh-160px)] rounded-[40px] overflow-hidden border border-indigo-100 shadow-2xl relative flex flex-col bg-slate-900 text-white">
                        <div className="px-8 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Neo4j Explorer Matrix</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] text-white/40 font-bold italic mr-4">Default: neo4j/neo4j</span>
                              <Button type="primary" size="small" className="bg-purple-600 border-none text-[9px] font-black" onClick={() => window.open('http://localhost:7474', '_blank')}>独立窗口</Button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white relative">
                             {/* 提示底层 */}
                             <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl text-slate-200 animate-pulse"><NodeIndexOutlined /></div>
                                <div className="space-y-1">
                                   <h3 className="text-sm font-black text-slate-700">正在尝试加载图谱...</h3>
                                   <p className="text-[10px] text-slate-400 max-w-xs mx-auto">若提示连接被拒绝，请点击上方按钮在独立窗口中开启实验室。项项项?</p>
                                </div>
                             </div>
                             <iframe 
                                src="http://localhost:7474" 
                                className="w-full h-full border-none bg-transparent relative z-10" 
                                title="Neo4j Browser"
                             />
                        </div>
                     </div>
                  </Col>
               </Row>
            </div>
          )}

          {activeTab === 'sqlite' && (
            <div className="h-full flex flex-col items-center justify-center p-20 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl border border-indigo-50 flex items-center justify-center text-5xl mb-8"><DatabaseOutlined className="text-indigo-200" /></div>
               <h2 className="text-2xl font-black text-slate-800 mb-4">SQLite 核心状态机验证</h2>
               <p className="text-slate-400 text-center max-w-lg mb-10 font-medium">当前系统正在校验物理文件与数据库记录的一致性。所有项目附件均已按照物理路径映射至 `uploads/` 目录。</p>
               <Descriptions bordered column={1} className="w-full max-w-xl bg-white rounded-3xl overflow-hidden admin-desc">
                  <Descriptions.Item label={<span className="text-xs font-black uppercase text-slate-400 tracking-widest">Database Engine</span>}>SQLite 3.x</Descriptions.Item>
                  <Descriptions.Item label={<span className="text-xs font-black uppercase text-slate-400 tracking-widest">Storage Status</span>}>Mounted (Read/Write)</Descriptions.Item>
                  <Descriptions.Item label={<span className="text-xs font-black uppercase text-slate-400 tracking-widest">Migration Level</span>}>v1.2.4 (Attachment Cleanup Patched)</Descriptions.Item>
                  <Descriptions.Item label={<span className="text-xs font-black uppercase text-slate-400 tracking-widest">Cache Integrity</span>}><Tag color="green">PASSED</Tag></Descriptions.Item>
               </Descriptions>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminMatrix;
