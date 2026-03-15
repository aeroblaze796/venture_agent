import React from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  return (
    <div className="teacher-dashboard-container h-screen w-full flex flex-col overflow-hidden text-[14px]">
      <header className="h-[64px] bg-white border-b border-[#f0f0f0] flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg">
            创
          </div>
          <div>
            <h1 className="font-semibold text-[16px] leading-tight text-[var(--text-main)]">创新创业智能体训练项目</h1>
            <span className="text-[12px] text-[var(--text-secondary)]">教师端智能测评与分析工作台</span>
          </div>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="font-medium">班级：大数据创新实验班</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-[var(--text-secondary)]">全班平均分</span>
              <div className="flex items-center gap-1 text-[var(--primary)] font-semibold text-[16px]">
                82.4 <span className="material-symbols-outlined text-[16px] text-[var(--success)]">trending_up</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-[var(--text-secondary)]">高风险项目数</span>
              <div className="flex items-center gap-1 text-[var(--error)] font-semibold text-[16px]">
                3 <span className="material-symbols-outlined text-[16px]">warning</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-[var(--text-secondary)]">核心知识点覆盖率</span>
              <div className="flex items-center gap-1 font-semibold text-[16px]">
                94%
              </div>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          <div className="flex items-center gap-4">
            <button className="relative text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--error)] border border-white"></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <img alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhpfllztZ_8RiwzFeQetJ3pkMTHVtv_C7HFpqk569E0-fvf4Gd5kB66naD6m-b9IxGUOqCdcJ_dgLbZ-og65qgxhVHeaUBFn1GjyYoB4iolB4OzFCujK7Tp-LWdbs9STMlymzNaqalS0_cm2NKd1UNKENJ2N8vcIs3ta0Jt0K7B4atRCQNlp8rgepyphr5eHdmvxrJCJf8in03pcNa8K6jGYTonnobpzcslxl0BeH4a7Bvx1bf2yJjEzDqtSeoDNyuD9nL4AgOKAxx" />
              <span className="font-medium text-[14px]">陈教授</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <aside className="w-[300px] bg-white border-r border-[#f0f0f0] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#f0f0f0] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[16px]">学生项目列表 (24)</h2>
              <button className="text-[var(--primary)] hover:bg-blue-50 p-1 rounded transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-[#d9d9d9] rounded hover:border-[var(--primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all" placeholder="搜索项目或团队..." type="text" />
            </div>
            <div className="flex gap-2 text-[12px]">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200 cursor-pointer">全部</span>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded border border-red-200 cursor-pointer font-medium">高风险预警 (3)</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            
            <div className="p-3 mb-2 rounded bg-blue-50 border border-blue-200 cursor-pointer relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]"></div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[14px] text-gray-900">绿源环保包装</h3>
                <span className="text-[12px] font-bold text-[var(--error)]">68 分</span>
              </div>
              <p className="text-[12px] text-gray-500 mb-2">组长：王明</p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-800 border border-red-200">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">error</span> 盈利逻辑欠缺
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  市场规模存疑
                </span>
              </div>
            </div>

            <div className="p-3 mb-2 rounded border border-transparent hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[14px] text-gray-900">智学AI助手</h3>
                <span className="text-[12px] font-semibold text-[var(--success)]">92 分</span>
              </div>
              <p className="text-[12px] text-gray-500 mb-2">组长：李华</p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800 border border-green-200">
                  进展顺利
                </span>
              </div>
            </div>

            <div className="p-3 mb-2 rounded border border-transparent hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[14px] text-gray-900">量子物流调度</h3>
                <span className="text-[12px] font-semibold text-[var(--warning)]">75 分</span>
              </div>
              <p className="text-[12px] text-gray-500 mb-2">组长：张伟</p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  竞品分析缺失
                </span>
              </div>
            </div>

            <div className="p-3 mb-2 rounded border border-transparent hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[14px] text-gray-900">芯镜医疗影像</h3>
                <span className="text-[12px] font-semibold text-[var(--success)]">88 分</span>
              </div>
              <p className="text-[12px] text-gray-500 mb-2">组长：陈林</p>
            </div>
          </div>
        </aside>

        {/* 中间主区域 */}
        <section className="flex-1 flex flex-col min-w-0 bg-[var(--bg-layout)] p-6 gap-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0 mb-4">
            <h2 className="text-[20px] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)] text-[24px]">troubleshoot</span>
              证据溯源工作台：绿源环保包装
            </h2>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 border border-[#d9d9d9] bg-white rounded text-[14px] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span> 导出诊断报告
              </button>
              <button className="px-4 py-1.5 border border-[#d9d9d9] bg-white rounded text-[14px] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">history</span> 历史版本
              </button>
            </div>
          </div>

          <div className="ant-tabs-nav">
            <div className="ant-tab-btn ant-tab-btn-active">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">document_scanner</span>文档溯源</span>
            </div>
            <div className="ant-tab-btn">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">fact_check</span>智能评分细则</span>
            </div>
            <div className="ant-tab-btn">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schema</span>逻辑画布</span>
            </div>
          </div>

          <div className="flex-1 flex gap-6 min-h-0">
            {/* 文档区域 */}
            <div className="flex-[2] ant-card flex flex-col min-w-0 relative">
              <div className="px-4 py-3 border-b border-[#f0f0f0] flex justify-between items-center bg-[#fafafa] rounded-t-lg shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500 text-[20px]">description</span>
                  <span className="font-medium text-[14px]">商业计划书 v2.pdf</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <button className="hover:text-gray-800 flex items-center"><span className="material-symbols-outlined text-[20px]">zoom_out</span></button>
                  <span className="text-[13px] w-12 text-center">100%</span>
                  <button className="hover:text-gray-800 flex items-center"><span className="material-symbols-outlined text-[20px]">zoom_in</span></button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <span className="text-[13px]">第 4 / 15 页</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-100 p-6 flex justify-center relative">
                <div className="absolute left-4 top-4 w-48 bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow-sm p-3 z-10">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <span className="font-medium text-[13px] text-gray-700">文档目录</span>
                    <button className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined text-[16px]">close</span></button>
                  </div>
                  <ul className="text-[12px] space-y-1 text-gray-600">
                    <li className="py-1 px-2 hover:bg-blue-50 hover:text-[var(--primary)] rounded cursor-pointer transition-colors">1. 执行摘要</li>
                    <li className="py-1 px-2 hover:bg-blue-50 hover:text-[var(--primary)] rounded cursor-pointer transition-colors">2. 痛点分析</li>
                    <li className="py-1 px-2 hover:bg-blue-50 hover:text-[var(--primary)] rounded cursor-pointer transition-colors">3. 市场规模</li>
                    <li className="py-1 px-2 bg-blue-50 text-[var(--primary)] font-medium rounded cursor-pointer transition-colors">4. 财务预测</li>
                    <li className="py-1 px-2 hover:bg-blue-50 hover:text-[var(--primary)] rounded cursor-pointer transition-colors pl-4">4.1 成本结构</li>
                    <li className="py-1 px-2 hover:bg-blue-50 hover:text-[var(--primary)] rounded cursor-pointer transition-colors pl-4">4.2 单位经济</li>
                    <li className="py-1 px-2 hover:bg-blue-50 hover:text-[var(--primary)] rounded cursor-pointer transition-colors">5. 团队介绍</li>
                  </ul>
                </div>
                
                <div className="bg-white shadow-md w-full max-w-[800px] h-fit min-h-[1000px] p-12 text-[14px] leading-relaxed text-gray-800">
                  <h2 className="text-xl font-bold mb-4">4. 财务预测与单位经济模型</h2>
                  <p className="mb-4">我们的收入模式主要基于向中型电商企业提供可降解包装材料的B2B销售。由于塑料使用的监管压力增加，我们预计采用率将快速上升。</p>
                  
                  <h3 className="text-lg font-semibold mb-2 mt-6">4.1 成本结构</h3>
                  <p className="mb-2">制造过程涉及几种关键原材料。目前，我们每单位的成本明细如下：</p>
                  <ul className="list-disc pl-5 mb-4">
                    <li>原始生物树脂：$0.15/件</li>
                    <li>制造管理费用：$0.08/件</li>
                    <li>物流与运输：$0.05/件</li>
                  </ul>
                  
                  <div className="pdf-highlight-active p-1.5 rounded -mx-1.5 transition-all">
                    <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900">4.2 单位经济效益（第一年）</h3>
                    <p>我们计划以 <span className="font-bold text-red-600">$0.25/件</span> 的价格销售标准包装盒，以保持对传统塑料替代品（平均 $0.20/件）的高度竞争力。获取每个B2B客户的成本（CAC）估计为$500，预期终身价值（LTV）为$4,000。</p>
                    <p className="mt-2 text-sm text-[var(--primary)] font-medium bg-blue-50/50 p-2 rounded border border-blue-100"><span className="material-symbols-outlined text-[16px] align-middle mr-1">auto_awesome</span>智能体批注：高亮显示违反盈利逻辑的证据溯源。</p>
                  </div>
                  
                  <p className="mt-6 mb-4">虽然初期利润微薄，但我们期望规模经济在第三年能使制造管理费用降低30%。</p>

                  <div className="pdf-highlight p-1.5 rounded -mx-1.5 mt-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">3.2 目标市场规模</h3>
                    <p>我们将全球包装行业定义为总可用市场（TAM），价值1.2万亿美元。我们期望通过积极的B2B推广，在5年内占据该市场1%的份额。</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 评分细则面板 */}
            <div className="flex-1 ant-card flex flex-col min-w-0">
              <div className="px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa] rounded-t-lg shrink-0 flex justify-between items-center">
                <span className="font-medium text-[14px] flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">summarize</span>评分摘要</span>
                <span className="font-bold text-[18px] text-[var(--error)]">68分</span>
              </div>
              <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
                
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors border-l-4 border-l-[var(--error)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-[13px] text-red-700">R4: 财务可行性</span>
                    <span className="font-bold text-[14px] text-red-600">2/10</span>
                  </div>
                  <p className="text-[12px] text-gray-800 font-medium mb-1">单位经济效益毛利为负</p>
                  <p className="text-[11px] text-gray-600 mb-2">总成本($0.28) &gt; 建议售价($0.25)</p>
                  <div className="flex justify-end">
                    <span className="text-[11px] text-[var(--primary)] flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">my_location</span> 高亮于左侧
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors border-l-4 border-l-[var(--warning)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-[13px] text-orange-700">R2: 目标市场</span>
                    <span className="font-bold text-[14px] text-orange-600">4/10</span>
                  </div>
                  <p className="text-[12px] text-gray-800 font-medium mb-1">市场定位匹配度低</p>
                  <p className="text-[11px] text-gray-600 mb-2">TAM定义过于宽泛（全球包装），与企业定位不符。</p>
                  <div className="flex justify-end">
                    <span className="text-[11px] text-gray-500 hover:text-[var(--primary)] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">my_location</span> 第 4 页
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-2"></div>

                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-[13px] text-gray-700">R1: 问题痛点</span>
                    <span className="font-bold text-[14px] text-[var(--success)]">9/10</span>
                  </div>
                  <p className="text-[12px] text-gray-600 line-clamp-2">清晰指出了塑料废弃物带来的监管合规痛点。</p>
                </div>

                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-[13px] text-gray-700">R6: 团队配置</span>
                    <span className="font-bold text-[14px] text-[var(--success)]">8/10</span>
                  </div>
                  <p className="text-[12px] text-gray-600 line-clamp-2">技术研发与商业运营背景搭配均衡。</p>
                </div>

                <button className="mt-2 py-2 w-full text-center text-[13px] text-[var(--primary)] border border-dashed border-[var(--primary)] rounded hover:bg-blue-50 transition-colors">
                  查看完整智能评分细则 (R1-R9)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 右侧边栏：教学建议 */}
        <aside className="w-[320px] bg-white border-l border-[#f0f0f0] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#f0f0f0] bg-[#fafafa]">
            <h2 className="font-semibold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">lightbulb</span>
              智能教学干预建议
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">基于全班知识图谱分析自动生成的教学策略。</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-3 py-2 border-b border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[18px]">campaign</span>
                <span className="font-medium text-red-800 text-[13px]">班级级教学预警</span>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-[14px] mb-1">大面积盈利逻辑错误</h4>
                <p className="text-[12px] text-gray-600 mb-3">
                  <strong className="text-red-600">40%的学生团队 (10组)</strong> 在最新提交中未通过单位经济效益(H8)约束检查。常见错误：混淆加价率与毛利率。
                </p>
                <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-3">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-1">建议干预措施</span>
                  <p className="text-[13px] text-gray-800">安排30分钟专项辅导：“初创企业财务基础：成本与定价逻辑”。</p>
                </div>
                <button className="w-full py-1.5 bg-white border border-[var(--primary)] text-[var(--primary)] rounded text-[13px] hover:bg-blue-50 transition-colors font-medium">
                  生成教案草稿
                </button>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[18px]">person</span>
                <span className="font-medium text-blue-800 text-[13px]">项目级个性化辅导：绿源环保</span>
              </div>
              <div className="p-3">
                <p className="text-[12px] text-gray-600 mb-3">
                  该团队具有很强的环保立意，但严重缺乏基础成本核算概念。
                </p>
                <ul className="text-[12px] text-gray-700 space-y-2 mb-3 pl-4 list-disc marker:text-blue-500">
                  <li>推送预读材料：通过学生端AI教练发送《单店模型与单位经济学》。</li>
                  <li>设置引导任务：要求团队重新计算规模化后的物流成本模型。</li>
                </ul>
                <button className="w-full py-1.5 bg-[var(--primary)] text-white rounded text-[13px] hover:bg-blue-600 transition-colors font-medium shadow-sm flex justify-center items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">send</span> 派发给学生端AI教练
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-[13px] font-semibold text-gray-800 mb-3">即将到来的教学里程碑</h3>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                <div>
                  <p className="text-[13px] font-medium">MVP 原型评审</p>
                  <p className="text-[11px] text-gray-500">3天后 • 侧重 R7 核心验证</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5"></div>
                <div>
                  <p className="text-[13px] font-medium text-gray-500">最终路演BP提交</p>
                  <p className="text-[11px] text-gray-400">14天后 • 全量知识点审核</p>
                </div>
              </div>
            </div>
            
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TeacherDashboard;
