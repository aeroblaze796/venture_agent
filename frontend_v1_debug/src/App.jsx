import React from 'react';
import VentureDashboard from './VentureDashboard';
import TeacherDashboard from './TeacherDashboard';

function App() {
  const currentPath = window.location.pathname;

  // 1. 学生端路由
  if (currentPath === '/student') {
    return <VentureDashboard />;
  }

  // 2. 教师端路由
  if (currentPath === '/teacher') {
    return <TeacherDashboard />;
  }

  // 3. 商业级 SaaS 启动页 (Portal)
  return (
    <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center relative overflow-hidden font-['Inter']">
      
      {/* 背景光效动画 (氛围感拉满) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]"></div>

      <div className="z-10 flex flex-col items-center max-w-5xl w-full px-6">
        
        {/* 头部标题区 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            VentureAgent v1.0
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            创新创业<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">智能体系统</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            基于多智能体协同与知识图谱技术，打造全链路的大学生双创赛事陪跑与测评平台。请选择您的专属工作台。
          </p>
        </div>

        {/* 核心卡片入口 */}
        <div className="grid md:grid-cols-2 gap-12 w-full max-w-6xl">
          
          {/* 🎓 学生端卡片 */}
          <a href="/student" className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl hover:bg-white/10 hover:border-blue-500/50 transition-all duration-500 overflow-hidden flex flex-col items-center text-center cursor-pointer shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-24 h-24 rounded-3xl bg-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all duration-500">
              <span className="text-6xl">🎓</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">学生端 AI 教练</h3>
            <p className="text-slate-400 text-base lg:text-lg leading-relaxed">
              沉浸式商业计划书打磨、逻辑健康度自测、能力雷达评估与 24/7 个性化辅导。
            </p>
            <div className="mt-10 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white text-base font-medium group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
              进入工作台 →
            </div>
          </a>

          {/* 👨‍🏫 教师端卡片 */}
          <a href="/teacher" className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden flex flex-col items-center text-center cursor-pointer shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all duration-500">
              <span className="text-6xl">👨‍🏫</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">教师端 评测中心</h3>
            <p className="text-slate-400 text-base lg:text-lg leading-relaxed">
              全局项目进度监控、智能图谱预警、证据溯源工作台与自动化教学策略下发。
            </p>
            <div className="mt-10 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white text-base font-medium group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all">
              进入工作台 →
            </div>
          </a>

        </div>
      </div>
    </div>
  );
}

export default App;