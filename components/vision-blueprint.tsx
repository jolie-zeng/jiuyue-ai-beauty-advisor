"use client";

import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  Network,
  Brain,
  BrainCircuit,
  Code2,
  Palette,
  ArrowRight,
  ArrowDown,
  X,
  Database,
  GitBranch,
  Cpu,
  Eye,
  Users,
  ImageIcon,
  MessageCircle,
  Cog,
  Wand2,
  Store,
  Lightbulb,
  Zap,
  Github,
  BookOpen,
  User,
  Quote,
  Layers,
  Combine,
  LineChart,
  Maximize2,
  Target
} from 'lucide-react';

export function VisionBlueprint() {
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  return (
    <div className="w-full h-full overflow-y-auto pb-24 bg-slate-50 text-slate-800 font-sans relative">
      {/* 🚀 调整1：将 py-16 改为 pt-8 pb-16，缩小顶部初始留白 */}
      <div className="max-w-6xl mx-auto space-y-16 pt-8 pb-16 px-6">
        
        {/* ================= 1. 头部 & 个人复盘元信息 (Hero & Meta) ================= */}
        {/* 🚀 调整1：将 py-12 改为 pt-8 pb-10，进一步收缩卡片内部顶部留白 */}
        <section className="relative px-6 pt-8 pb-10 text-center bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {/* 背景纹理 */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {/* 光晕点缀 */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-6 shadow-sm">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Project Portfolio & Case Study</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI 智能美妆导购引擎蓝图
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 tracking-wide mb-10">
              从 0 到 1 构建大模型双轨制驱动的次世代电商客服架构
            </p>

            {/* 个人能力与技术栈展示面板 */}
            <div className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 md:p-8 text-left grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner mb-10">
              
              {/* 左侧：角色与开发模式 */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Role / 角色定位</span>
                  </div>
                  <p className="text-slate-800 font-semibold">AI 产品架构师 & 独立开发者 </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Methodology / 研发模式</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI-Empowered Full-Stack (AI 赋能全栈开发)
                  </div>
                </div>
              </div>

              {/* 右侧：技术栈矩阵 */}
              <div>
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <Code2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tech Stack / 架构选型</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-16 pt-0.5">Frontend</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <TechBadge text="Next.js" />
                      <TechBadge text="React" />
                      <TechBadge text="Tailwind CSS" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-16 pt-0.5">Backend</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <TechBadge text="Python" />
                      <TechBadge text="FastAPI" />
                      <TechBadge text="Pandas" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-16 pt-0.5">AI Engine</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <TechBadge text="LLM Prompt Engineering" />
                      <TechBadge text="RAG Design" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 外链行动按钮：展示源码与文档 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg">
                <Github className="w-5 h-5" />
                <span>查看完整源码 (GitHub)</span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-indigo-300 transition-colors shadow-sm hover:shadow-md">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>阅读《从 0 到 1 架构日记》</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= 2. 模块一：业务痛点 (🚀 调整3：三栏对比布局) ================= */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">1. 商业嗅觉：传统规则客服为什么失效？</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {[
              { title: "01 语义鸿沟 (NLU 失效)", desc: "消费者使用“早泥豆沙”、“红利色”、“speaktm”等非标黑话或错别字时，传统正则匹配直接导致转人工，流失率极高。" },
              { title: "02 长尾场景盲区", desc: "诸如“前男友结婚砸场子妆”、“白开水妆”等情绪化长尾诉求，静态知识图谱永远无法穷举，造成潜在的高转化机会白白流失。" },
              { title: "03 缺乏 Zero-shot 推理", desc: "面对多色号优劣势对比时，机器人只能抛出机械式固定模板，无法回应个性化关切，极大降低信任感。" },
              { title: "04 物料组合爆炸与冗余", desc: "美妆店铺色号巨多，任意两款对比需制作海量海报与话术。不仅人工制作成本极高，且永远无法涵盖所有组合。" }
            ].map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow items-center">
                
                {/* 1. 左栏：Before (反面教材截图区) */}
                {/* 🚀 删除了 aspect-[9/16]，加上了 p-2 给图片留点优雅的内边距 */}
                <div className="w-full bg-rose-50/50 border-2 border-rose-100 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-rose-300 transition-colors shadow-sm p-2">
                  <span className="absolute top-3 left-3 bg-rose-100/90 backdrop-blur-sm text-rose-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm z-20">
                    BEFORE / 传统客服
                  </span>
                  
                  {/* 🚀 核心魔法：w-full 撑满宽度，h-auto 高度自适应！干掉了 absolute 强制拉伸 */}
                  <img 
                    src={`/before-${idx + 1}.png`} 
                    alt="Before" 
                    className="w-full h-auto block rounded-lg object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                  />
                </div>

                {/* 2. 中栏：痛点文案区 (保持不变) */}
                <div className="w-full flex flex-col justify-center px-2 text-center lg:text-left">
                  <h3 className="text-lg font-bold text-slate-800 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>

                {/* 3. 右栏：After (惊艳回复截图区) */}
                {/* 🚀 删除了 aspect-[9/16]，加上了 p-2 */}
                <div className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-300 transition-colors shadow-sm p-2">
                  <span className="absolute top-3 left-3 bg-emerald-100/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm z-20">
                    AFTER / 本系统
                  </span>
                  
                  {/* 🚀 核心魔法：w-full h-auto block */}
                  <img 
                    src={`/after-${idx + 1}.png`} 
                    alt="After" 
                    className="w-full h-auto block rounded-lg object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                  />
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* ================= 3. 模块二：核心架构与深潜 ================= */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
              <Network className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">2. 技术攻坚：好钢用在刀刃上的“工程化 AI”</h2>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 via-blue-50 to-white border-l-4 border-indigo-500 rounded-r-2xl p-6 md:p-8 shadow-sm">
            <Quote className="absolute top-4 left-4 w-16 h-16 text-indigo-500/10 -rotate-6" />
            <p className="relative z-10 text-lg md:text-xl font-medium text-slate-700 leading-relaxed tracking-wide">
              我们绝不把 LLM 当做不可控的“全能神”。而是将其精密剥离为纯粹的 NLU（理解）与 NLG（生成）组件。中间最核心的商品召回与资产匹配，全部通过 Python 代码强控商业逻辑，实现 <span className="text-indigo-600 font-extrabold px-1 bg-indigo-100/50 rounded">0 幻觉</span> 的精准交付。
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden flex flex-col gap-10">
            <div className="flex flex-col md:flex-row items-center justify-between w-full relative z-10">
              <FlowNode icon={<MessageCircle/>} title="C端原声输入" subtitle="用户原始语言" color="bg-slate-50 text-slate-700 border-slate-200" />
              <ArrowRight className="w-5 h-5 text-slate-300 hidden md:block" />
              <ArrowDown className="w-5 h-5 text-slate-300 block md:hidden my-2" />
              
              <FlowNode icon={<BrainCircuit/>} title="LLM 意图路由" subtitle="语义理解层" color="bg-indigo-50 text-indigo-700 border-indigo-200" />
              <ArrowRight className="w-5 h-5 text-slate-300 hidden md:block" />
              <ArrowDown className="w-5 h-5 text-slate-300 block md:hidden my-2" />
              
              <FlowNode icon={<Database/>} title="Python 物理拦截" subtitle="业务强控层" color="bg-teal-50 text-teal-700 border-teal-200" />
              <ArrowRight className="w-5 h-5 text-slate-300 hidden md:block" />
              <ArrowDown className="w-5 h-5 text-slate-300 block md:hidden my-2" />
              
              <FlowNode icon={<Combine/>} title="LLM+CV 合成" subtitle="内容生成层" color="bg-rose-50 text-rose-700 border-rose-200" />
              <ArrowRight className="w-5 h-5 text-slate-300 hidden md:block" />
              <ArrowDown className="w-5 h-5 text-slate-300 block md:hidden my-2" />
              
              <FlowNode icon={<LineChart/>} title="B端商业反哺" subtitle="数据回流层" color="bg-emerald-50 text-emerald-700 border-emerald-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              <LightWorkshopCard 
                step="01" title="第一车间：意图路由"
                desc="利用大模型强大的泛化能力清洗用户口语，精准萃取意图及场景标签，只需一份基础色号库即可极速冷启动。"
                tag="LLM 强介入" theme="indigo"
              />
              {/* 🚀 调整2：修改第二车间文案，不强调价格库存，强调“官方推荐话术” */}
              <LightWorkshopCard 
                step="02" title="第二车间：物理拦截"
                desc="坚决掐断大模型。由 Python 铁面无私执行相交匹配，强控官方推荐话术，保证吐出的 100% 是真实存在的商品。"
                tag="纯代码控盘" theme="teal"
              />
              <LightWorkshopCard 
                step="03" title="第三车间：动态合成"
                desc="大模型根据痛点动态撰写 1v1 对比评测。同步拉起底层画图引擎，实时拼接海报，消灭物料制作成本。"
                tag="LLM + CV" theme="rose"
              />
            </div>

            <div className="flex justify-center pt-4">
              <button onClick={() => setShowArchitectureModal(true)} className="group flex items-center gap-2 px-6 py-3 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-full shadow-sm hover:shadow-md transition-all">
                <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                <span className="text-sm font-semibold tracking-wide">展开详尽系统全链路架构图 (Mermaid)</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= 4. 模块三：未来演进 Roadmap ================= */}
        <section className="space-y-8">
          <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shadow-sm shrink-0 mt-1">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-slate-800">3. 架构前瞻：通往 Agentic 的技术演进</h2>
              
              {/* 🚀 核心补充：MVP 状态与未来场景扩充声明 */}
              <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-4 text-sm leading-relaxed max-w-4xl">
                <p className="text-slate-600 mb-1.5">
                  <span className="font-bold text-amber-600 mr-2">📍 当前进度 (MVP V1.0)：</span>
                  系统已完美跑通基础双轨制，全面支持高频的 <span className="font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded shadow-sm mx-1">场景推荐</span> 与 <span className="font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded shadow-sm mx-1">色号对比</span> 链路。
                </p>
                <p className="text-slate-600">
                  <span className="font-bold text-indigo-600 mr-2">🚀 场景拓建 (V2.0+)：</span>
                  底层架构已实现高度解耦，后续将通过追加 Prompt 模板与知识库，无缝接入「全妆搭配」、「色号介绍」、「成分排雷」等更多长尾细分场景。
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <LightRoadmapCard icon={<Database/>} title="O(1) 边际扩展 (知识解耦)" desc="底层业务逻辑轻微修改即可实现跨品类（如粉底、眼影）泛化，无需海量铺设话术。" theme="blue" />
            <LightRoadmapCard icon={<BrainCircuit/>} title="RAG 高维向量检索" desc="向量化品牌《导购手册》与爆款笔记，让大模型“开卷考试”，深度学习专属 Tone of Voice。" theme="purple" />
            <LightRoadmapCard icon={<Network/>} title="LangGraph 多智能体" desc="从线性流水线升级为有环状态机，赋予系统多轮议价、自我纠错及复杂任务动态分发能力。" theme="indigo" />
            <LightRoadmapCard icon={<Target/>} title="SFT 小模型私有化" desc="基于 RLHF 优质对话数据，监督微调垂类开源小模型。摆脱 API 依赖，推理成本直降 90%。" theme="emerald" />
            <LightRoadmapCard icon={<ImageIcon/>} title="多模态 CV 视觉试妆" desc="接入 Vision 模型，解析用户自拍照面部色彩 RGB，进行跨模态色号精准匹配。" theme="rose" />
            <LightRoadmapCard icon={<Users/>} title="全渠道 CRM 主动营销" desc="打通店铺用户中台，调取老客购买历史，化“被动解答”为“主动连带推销”，拉升客单价。" theme="teal" />
          </div>
        </section>
      </div>

     {/* ================= 弹窗：全链路架构图 ================= */}
     {showArchitectureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowArchitectureModal(false)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* 弹窗顶部标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-indigo-600"/>
                <h3 className="text-lg font-bold text-slate-800 tracking-wide">系统全链路可视化架构图</h3>
                {/* 🚀 加了一个贴心的小提示 */}
                <span className="hidden sm:inline-block text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                  ⬇️ 鼠标滚轮向下滚动查看全貌
                </span>
              </div>
              <button onClick={() => setShowArchitectureModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            {/* 👇👇👇 核心修改区：释放高度限制，开启垂直滚动 👇👇👇 */}
            <div className="flex-1 overflow-y-auto bg-slate-200/50 p-2 sm:p-6 custom-scrollbar">
              <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mx-auto">
                
                {/* 🚀 核心修改：w-full 撑满全宽保证清晰度，h-auto 释放高度让图片自然拉长！ */}
                <img 
                  src="/architecture.png" 
                  alt="架构大图" 
                  className="w-full h-auto block" 
                />

              </div>
            </div>
            {/* 👆👆👆 替换结束 👆👆👆 */}

          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- UI 辅助组件 ----------------

function TechBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-bold text-slate-600 shadow-sm">
      {text}
    </span>
  );
}

function FlowNode({ icon, title, subtitle, color }: { icon: any, title: string, subtitle: string, color: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 ${color} w-full md:w-44 text-center transition-transform hover:-translate-y-1 hover:shadow-md cursor-default`}>
      <div className="mb-2 opacity-80">{icon}</div>
      <span className="text-sm font-bold block mb-1">{title}</span>
      <span className="text-[10px] font-medium opacity-70 tracking-wider uppercase">{subtitle}</span>
    </div>
  )
}

function LightWorkshopCard({ step, title, desc, tag, theme }: any) {
  const themes: any = {
    indigo: "border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-100",
    teal: "border-teal-100 hover:border-teal-300 hover:shadow-teal-100",
    rose: "border-rose-100 hover:border-rose-300 hover:shadow-rose-100"
  }
  const tagStyles: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200"
  }
  return (
    <div className={`bg-white border-2 p-6 rounded-2xl relative transition-all hover:shadow-lg ${themes[theme]}`}>
      <div className={`absolute top-4 right-4 text-[10px] px-2.5 py-1 rounded-full border font-bold ${tagStyles[theme]}`}>{tag}</div>
      <div className="text-3xl font-black text-slate-100 mb-3">{step}</div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}

function LightRoadmapCard({ icon, title, desc, theme }: any) {
  const iconColors: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    teal: "bg-teal-50 text-teal-600",
  }
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-md hover:border-slate-300 transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform ${iconColors[theme]}`}>{icon}</div>
      <h4 className="text-base font-bold text-slate-800 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}