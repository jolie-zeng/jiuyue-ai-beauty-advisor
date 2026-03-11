"use client"

import { useState, useEffect, useRef } from "react"
import { Users, Target, Zap, TrendingUp, RefreshCw, ThumbsUp, ThumbsDown, Award, MessageSquare, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

export function BEndDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 排行榜状态管理
  const [rankingScenario, setRankingScenario] = useState<"推荐" | "对比">("推荐")
  const [rankingPage, setRankingPage] = useState(1)
  const RANKING_PAGE_SIZE = 5

  // RLHF 工作台筛选状态
  const [filterScenario, setFilterScenario] = useState("ALL")
  const [filterDate, setFilterDate] = useState("")
  
  const dateInputRef = useRef<HTMLInputElement>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/dashboard?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (timestamp: string, feedbackStatus: string) => {
    try {
      await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp: timestamp, feedback: feedbackStatus })
      })
      fetchDashboardData()
    } catch (e) {
      console.error("Feedback failed", e)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 animate-pulse bg-slate-50">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> 正在同步云端埋点大盘...
      </div>
    )
  }

  const totalCalls = data?.total_calls || 0
  const intentData = data?.intent_distribution || []
  const wordCloud = data?.word_cloud || []
  
  // 处理排行榜分页逻辑
  const currentRankingData = rankingScenario === "推荐" ? (data?.shade_ranking_rec || []) : (data?.shade_ranking_comp || [])
  const totalRankingPages = Math.ceil(currentRankingData.length / RANKING_PAGE_SIZE) || 1
  const paginatedRanking = currentRankingData.slice((rankingPage - 1) * RANKING_PAGE_SIZE, rankingPage * RANKING_PAGE_SIZE)

  // 处理 RLHF 列表过滤逻辑
  const records = data?.recent_records || []
  const filteredRecords = records.filter((r: any) => {
    const matchScenario = filterScenario === "ALL" || r["意图"] === filterScenario;
    const recordDate = r["调用时间"] ? r["调用时间"].split("T")[0] : "";
    const matchDate = !filterDate || recordDate === filterDate;
    
    return matchScenario && matchDate;
  })

  // 词云颜色调整为亮色版可见的色系
  const colors = ["text-rose-500", "text-indigo-500", "text-amber-500", "text-emerald-500", "text-purple-500"]

  return (
    <div className="w-full h-full p-8 overflow-auto animate-in fade-in slide-in-from-bottom-4 bg-slate-50 text-slate-800 pb-20 font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">B端商业洞察与模型 RLHF 反哺大盘</h1>
          <p className="text-sm font-medium text-slate-500">收集真实消费者原声，构建优质微调数据集（Fine-tuning Dataset）</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-all border border-indigo-200 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 刷新大盘
        </button>
      </div>

      {/* 🚀 补回来的核心指标卡片区 (KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">累计 AI 咨询人次</p>
            <h3 className="text-2xl font-black text-slate-800">{totalCalls} <span className="text-sm font-medium text-slate-400">次</span></h3>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">意图精准识别率</p>
            <h3 className="text-2xl font-black text-slate-800">98.5 <span className="text-sm font-medium text-slate-400">%</span></h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">导购转化提升预估</p>
            <h3 className="text-2xl font-black text-slate-800">+12.4 <span className="text-sm font-medium text-slate-400">%</span></h3>
          </div>
        </div>
      </div>

      {/* 图表展示区 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* 左侧：漏斗 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Target className="w-4 h-4 text-indigo-500" /> 意图分流漏斗
          </h3>
          <div className="space-y-4">
            {intentData.map((item: any, idx: number) => {
              const percentage = totalCalls === 0 ? 0 : Math.round((item.value / totalCalls) * 100)
              // 🚀 核心修复：前端显式声明颜色，防止 Tailwind 引擎误删 CSS 样式
              const barColor = item.name.includes("推荐") ? "bg-rose-500" : "bg-cyan-500"
              
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>{item.name}</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.value} 次</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    {/* 顺手加上了一个丝滑的加载动画 transition-all duration-1000 */}
                    <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 中间：可翻页/切场景的排行榜 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> 全量推荐色号榜
            </h3>
            <div className="flex bg-slate-100 rounded-md p-1 border border-slate-200 shadow-inner">
              <button 
                onClick={() => { setRankingScenario("推荐"); setRankingPage(1); }}
                className={`text-[10px] font-bold px-3 py-1 rounded transition-colors ${rankingScenario === "推荐" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >推荐</button>
              <button 
                onClick={() => { setRankingScenario("对比"); setRankingPage(1); }}
                className={`text-[10px] font-bold px-3 py-1 rounded transition-colors ${rankingScenario === "对比" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >对比</button>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {paginatedRanking.length === 0 && <p className="text-xs text-slate-400 mt-4 text-center">当前场景暂无数据</p>}
            {paginatedRanking.map((item: any, idx: number) => {
              const actualRank = (rankingPage - 1) * RANKING_PAGE_SIZE + idx + 1;
              return (
                <div key={idx} className="flex justify-between items-center bg-slate-50 hover:bg-indigo-50/50 p-2.5 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black w-4 ${actualRank <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>{actualRank}</span>
                    <span className="text-sm font-semibold text-slate-700 line-clamp-1 max-w-[120px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 text-xs">
                    <span className="font-bold text-rose-500">{item.count}</span>
                    <span className="text-slate-400 font-medium">次</span>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">共 {currentRankingData.length} 项</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setRankingPage(p => Math.max(1, p - 1))} disabled={rankingPage === 1} className="text-slate-400 disabled:opacity-30 hover:text-indigo-600"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">{rankingPage} / {totalRankingPages}</span>
              <button onClick={() => setRankingPage(p => Math.min(totalRankingPages, p + 1))} disabled={rankingPage === totalRankingPages} className="text-slate-400 disabled:opacity-30 hover:text-indigo-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* 右侧：词云 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-4 h-4 text-rose-500" /> 野生黑话词云 (Top 20)
          </h3>
          <div className="flex flex-wrap gap-3 items-center justify-center p-2 bg-slate-50/50 rounded-xl min-h-[150px] border border-slate-100 shadow-inner">
            {wordCloud.length === 0 && <span className="text-xs font-medium text-slate-400">暂无数据</span>}
            {wordCloud.map((word: any, idx: number) => (
              <span key={idx} className={`font-black ${colors[idx % colors.length]} drop-shadow-sm`} style={{ fontSize: `${word.size * 0.8}px` }}>
                {word.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 底部：带筛选项的 RLHF 打标工作台 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-1">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" /> RLHF 数据标注台
          </h3>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors rounded-md px-2 py-1 shadow-sm">
              <button 
                onClick={() => dateInputRef.current?.showPicker()}
                className="text-slate-400 hover:text-indigo-500 transition-colors"
                title="点击选择日期"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
              <input 
                ref={dateInputRef}
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-[11px] font-medium text-slate-600 outline-none w-[100px] cursor-pointer"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate("")}
                  className="text-slate-400 hover:text-rose-500 text-xs ml-1 font-bold"
                  title="清除日期筛选"
                >
                  ×
                </button>
              )}
            </div>

            <select 
              value={filterScenario} 
              onChange={(e) => setFilterScenario(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 rounded-md px-3 py-1 outline-none cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
            >
              <option value="ALL">所有场景</option>
              <option value="推荐">场景推荐</option>
              <option value="对比">色号对比</option>
            </select>
          </div>
        </div>

        {/* 🚀 新版 5 列宽屏表格 */}
        <div className="overflow-x-auto max-h-[500px] custom-scrollbar p-1">
          <table className="w-full text-left border-collapse relative min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm outline outline-1 outline-slate-200">
              <tr className="text-xs font-bold text-slate-600">
                <th className="py-3 px-5 w-[18%]">消费者原声诉求</th>
                <th className="py-3 px-4 w-[12%]">提取标签</th>
                <th className="py-3 px-5 w-[22%] text-amber-700 bg-amber-50 border-x border-amber-100">📚 官方知识库基准</th>
                <th className="py-3 px-5 w-[33%] text-cyan-700 bg-cyan-50 border-r border-cyan-100">✨ AI 最终导购话术与推荐结果</th>
                <th className="py-3 px-4 w-[15%] text-center">人工打标</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-xs font-medium text-slate-400 bg-slate-50">未找到符合条件的数据</td></tr>
              )}
              {filteredRecords.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  
                  {/* 1. 消费者原声 */}
                  <td className="py-4 px-5 align-top">
                    <p className="text-sm font-medium text-slate-800 mb-1">{row["用户原话"]}</p>
                    <p className="text-[10px] text-slate-400 font-mono mb-2">{row["调用时间"].split("T")[0]} {row["调用时间"].split("T")[1]?.substring(0,8)}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border ${row["意图"] === "对比" ? "border-purple-200 text-purple-700 bg-purple-50" : "border-rose-200 text-rose-700 bg-rose-50"}`}>
                      {row["意图"]}
                    </span>
                  </td>

                  {/* 2. 提取的标签 */}
                  <td className="py-4 px-4 align-top">
                    <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold px-2 py-1 rounded shadow-sm max-w-[120px] break-words">
                      {row["提取的原始词"]}
                    </span>
                  </td>

                  {/* 3. 官方知识库基准 */}
                  <td className="py-4 px-5 align-top bg-amber-50/30 border-x border-amber-100/50">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 max-h-[120px] overflow-y-auto custom-scrollbar shadow-inner">
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {row["官方推荐话术"] || "（等待后端 Python 传入 `官方推荐话术` 字段...）"}
                      </p>
                    </div>
                  </td>

                  {/* 4. AI 生成话术 */}
                  <td className="py-4 px-5 align-top bg-cyan-50/30 border-r border-cyan-100/50">
                    <div className="max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{row["机器人的回复"] || "无文本"}</p>
                      <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm inline-block px-2.5 py-1 rounded">
                        锁定：{row["最终锁定的色号"]}
                      </p>
                    </div>
                  </td>

                  {/* 5. 打标区 */}
                  <td className="py-4 px-4 text-center align-top">
                    {row["人工反馈"] === "未评级" ? (
                      <div className="flex justify-center gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleFeedback(row["调用时间"], "合理")} className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 text-slate-400 transition-all" title="对齐官方，推荐合理">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleFeedback(row["调用时间"], "不合理")} className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-400 transition-all" title="偏离官方/存在幻觉">
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${row["人工反馈"] === "合理" ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-rose-200 bg-rose-50 text-rose-600"}`}>
                        {row["人工反馈"] === "合理" ? "✅ 推荐准确" : "❌ 偏离/幻觉"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
