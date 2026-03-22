import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import StudentWorkspace from './pages/StudentWorkspace';
import TeacherDashboard from './pages/TeacherDashboard';
import './index.css';

function Portal() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalType, setModalType] = useState('login'); // 'login' or 'register'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [targetRole, setTargetRole] = useState('/student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCardClick = (path) => {
    setTargetRole(path);
    setShowLoginModal(true);
    setModalType('login');
  };

  const handleAuthTextToggle = (show) => {
    setShowPassword(show);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('用户名或密码不能为空');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (modalType === 'register') {
        // 注册流：先显示完善信息界面
        setShowOnboarding(true);
      } else {
        // 登录流：调用后端接口
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('va_username', data.username);
          localStorage.setItem('va_token', data.token);
          localStorage.setItem('va_role', targetRole === '/teacher' ? 'teacher' : 'student');
          navigate(targetRole);
        } else {
          setErrorMsg(data.detail || '登录失败，请检查用户名或密码');
        }
      }
    } catch (err) {
      setErrorMsg('认证失败，请检查网络或尝试重新登录');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!school || !major || !grade) {
      setErrorMsg('请填写完整的参赛信息');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          school,
          major,
          grade
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('va_username', username);
        localStorage.setItem('va_school', school);
        localStorage.setItem('va_major', major);
        localStorage.setItem('va_grade', grade);
        localStorage.setItem('va_token', username); // 使用用户名作为 mock token
        localStorage.setItem('va_role', targetRole === '/teacher' ? 'teacher' : 'student');
        setShowLoginModal(false);
        setShowOnboarding(false);
        navigate(targetRole);
      } else {
        setErrorMsg(data.detail || '注册失败，请稍后重试');
        // 如果注册失败，可能由于用户名冲突等，返回登录/注册初始态
        if (data.detail && data.detail.includes('注册')) {
             setShowOnboarding(false);
        }
      }
    } catch (err) {
      setErrorMsg('提交失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] flex flex-col items-center py-20 px-6 font-['Inter'] selection:bg-blue-100">
      
      {/* 顶部标题区 */}
      <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/5 ring-4 ring-blue-50/50 group hover:scale-110 transition-transform duration-500">
            <span className="text-blue-600 text-4xl font-black">V</span>
          </div>
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-6">
          VentureAgent
          <span className="font-thin text-slate-300 mx-3">/</span>
          <span className="font-medium text-slate-500 text-4xl tracking-tight">智能体驱动</span>
        </h1>
        <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
          您的全天候商业逻辑教练。极简、智能、专业。
        </p>
      </div>

      <div className="w-full max-w-7xl px-4 mb-24">
        {/* 卡片区 */}
        <div className="grid md:grid-cols-3 gap-10">
          
          {/* 学生卡片 */}
          <div 
            onClick={() => handleCardClick('/student')} 
            className="group relative bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center text-center cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-blue-50/50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <span className="text-5xl">🎯</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">学生端 Coach</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-10 px-4 group-hover:text-slate-500 transition-colors">
                沉浸式打磨商业逻辑，实时获取 AI 导师的反馈与改进建议。
              </p>
              <div className="mt-auto inline-flex py-3 px-8 rounded-full bg-slate-50 text-slate-500 text-sm font-semibold group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-300 transform group-hover:translate-x-1">
                开启训练
                <span className="ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">→</span>
              </div>
            </div>
          </div>

          {/* 教师卡片 */}
          <div 
            onClick={() => handleCardClick('/teacher')} 
            className="group relative bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center text-center cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50/50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <span className="text-5xl">📊</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-emerald-600 transition-colors">教师端 Admin</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-10 px-4 group-hover:text-slate-500 transition-colors">
                全局监控项目进度，通过数据图谱识别潜在商业风险。
              </p>
              <div className="mt-auto inline-flex py-3 px-8 rounded-full bg-slate-50 text-slate-500 text-sm font-semibold group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-200 transition-all duration-300 transform group-hover:translate-x-1">
                管理中心
                <span className="ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">→</span>
              </div>
            </div>
          </div>

          {/* 旧版本联调 */}
          <a 
            href="http://localhost:3000" 
            target="_blank" 
            rel="noreferrer" 
            className="group relative bg-slate-50/30 border border-dashed border-gray-200 p-12 rounded-[3.5rem] hover:bg-white hover:border-solid hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col items-center text-center no-underline overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500 shadow-sm">
                <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-orange-400">history</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4 tracking-tight italic opacity-80 group-hover:opacity-100">Legacy UI</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-10 px-4">
                跳转至 `old-version` 路径下的原始界面，用于最早期逻辑追溯。
              </p>
              <div className="mt-auto inline-flex py-2.5 px-6 rounded-full border border-gray-200 text-slate-400 text-xs font-medium group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all flex items-center gap-2">
                访问旧版基地 <span className="material-symbols-outlined text-[14px]">output</span>
              </div>
            </div>
          </a>

        </div>
      </div>

      {/* 登录/注册 Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <button 
              onClick={() => {setShowLoginModal(false); setShowOnboarding(false);}}
              className="absolute top-6 right-8 text-slate-300 hover:text-slate-600 transition-colors text-2xl"
            >
              ×
            </button>
            
            {!showOnboarding ? (
              <>
                <div className="text-center mb-10">
                  <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-sm ${targetRole === '/student' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <span className="text-3xl">{targetRole === '/student' ? '🎓' : '👨‍🏫'}</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">
                    {modalType === 'login' ? '欢迎回来' : '开启新征程'}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium">
                    {modalType === 'login' ? '请登录以访问您的智能体助手' : '创建一个账号以获取 AI 导师指导'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">用户名</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all placeholder-slate-300 shadow-inner"
                      placeholder="账号 / 学号"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">密码</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all pr-12 placeholder-slate-300 shadow-inner"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onMouseDown={() => handleAuthTextToggle(true)}
                        onMouseUp={() => handleAuthTextToggle(false)}
                        onMouseLeave={() => handleAuthTextToggle(false)}
                        onTouchStart={() => handleAuthTextToggle(true)}
                        onTouchEnd={() => handleAuthTextToggle(false)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 focus:outline-none transition-colors"
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 mt-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : (targetRole === '/student' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200')}`}
                  >
                    {isLoading ? '验证中...' : (modalType === 'login' ? '登 录' : '注 册')}
                  </button>
                </form>

                <div className="mt-8 text-center text-[13px] text-slate-400 font-medium">
                  {modalType === 'login' ? (
                    <span>还没有账号？ <button type="button" onClick={() => {setModalType('register'); setErrorMsg('');}} className="text-blue-600 font-bold hover:underline">立即注册</button></span>
                  ) : (
                    <span>已有账号？ <button type="button" onClick={() => {setModalType('login'); setErrorMsg('');}} className="text-blue-600 font-bold hover:underline">返回登录</button></span>
                  )}
                </div>
              </>
            ) : (
              // Onboarding 表单
              <div className="animate-in slide-in-from-right-10 duration-500">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
                    <span className="material-symbols-outlined text-3xl">edit_note</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">完善参赛资料</h2>
                  <p className="text-xs text-slate-400">我们需要这些信息来为您匹配合适的商业分析模块</p>
                </div>

                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">就读学校</label>
                    <input 
                      type="text" 
                      value={school}
                      onChange={e => setSchool(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all"
                      placeholder="例如：北京大学"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">所属专业</label>
                    <input 
                      type="text" 
                      value={major}
                      onChange={e => setMajor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all"
                      placeholder="例如：计算机科学与技术"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">当前年级</label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all appearance-none"
                    >
                      <option value="">请选择年级...</option>
                      <option value="大一">大一</option>
                      <option value="大二">大二</option>
                      <option value="大三">大三</option>
                      <option value="大四">大四</option>
                      <option value="研一">研一</option>
                      <option value="研二">研二</option>
                      <option value="研三">研三</option>
                    </select>
                  </div>

                  {errorMsg && (
                    <div className="text-red-500 text-[11px] font-bold animate-pulse text-center">{errorMsg}</div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-4 mt-6 rounded-2xl bg-slate-900 text-white font-black text-sm tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                  >
                    开 始 体 验
                  </button>
                </form>
              </div>
            )}

            {/* 这里的冗余跳转已移除，统一使用表单下方的切换逻辑 */}
          </div>
        </div>
      )}

    </div>
  );
}

// 简单的路由守卫组件
function RoleGuard({ children, requiredRole }) {
  const username = localStorage.getItem('va_username');
  const role = localStorage.getItem('va_role');
  
  if (!username) return <Navigate to="/" replace />;
  
  // 如果请求的是教师端，但当前角色不是老师，则重定向
  if (requiredRole === 'teacher' && role !== 'teacher') {
    return <Navigate to="/student" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route 
          path="/student" 
          element={
            <RoleGuard requiredRole="student">
              <StudentWorkspace />
            </RoleGuard>
          } 
        />
        <Route 
          path="/teacher" 
          element={
            <RoleGuard requiredRole="teacher">
              <TeacherDashboard />
            </RoleGuard>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
