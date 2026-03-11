"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Factory, 
  Cpu, 
  Settings2, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  Terminal,
  Lightbulb,
  Zap,
  Search
} from "lucide-react"
import type { SystemStep } from "@/app/page"

interface InferenceDashboardProps {
  step: SystemStep
  realData: any | null
}

export function InferenceDashboard({ step, realData }: InferenceDashboardProps) {
  return (
    <div className="flex flex-col h-full text-gray-100 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">智能推荐引擎看板</h2>
            <p className="text-[10px] text-gray-500 font-mono">三车间全链路架构</p>
          </div>
        </div>
        <StatusIndicator step={step} />
      </div>

      {/* Workshops */}
      <div className="flex-1 space-y-3 overflow-auto pr-1">
        <Workshop1 step={step} realData={realData} />
        <Workshop2 step={step} realData={realData} />
        <Workshop3 step={step} realData={realData} />
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-mono text-gray-500">
              推理延迟: <span className="text-gray-300">{step >= 5 ? "127ms" : "—"}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border-rose-500/30">
            场景 A：颜色推荐
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            色号对比
          </Badge>
        </div>
      </div>
    </div>
  )
}

function StatusIndicator({ step }: { step: SystemStep }) {
  if (step === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
        <span className="w-2 h-2 rounded-full bg-gray-500" />
        <span className="text-[10px] text-gray-500 font-mono">休眠中</span>
      </div>
    )
  }
  
  if (step < 5) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <span className="text-[10px] text-rose-400 font-mono">引擎全速运转中 (Processing...)</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-[10px] text-emerald-400 font-mono">推理完成</span>
    </div>
  )
}

function WorkshopCard({ 
  icon, 
  title, 
  number, 
  isActive, 
  isDormant,
  children 
}: { 
  icon: React.ReactNode
  title: string
  number: string
  isActive: boolean
  isDormant: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl border transition-all duration-500
      ${isDormant 
        ? "border-white/5 bg-white/[0.02] opacity-40" 
        : isActive 
          ? "border-rose-500/30 bg-white/[0.04] shadow-lg shadow-rose-500/5" 
          : "border-white/10 bg-white/[0.03]"
      }
      backdrop-blur-md
    `}>
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
      
      <div className="relative p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300
              ${isActive ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-gray-500"}
            `}>
              {icon}
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{number}</p>
              <h3 className="text-sm font-medium text-white">{title}</h3>
            </div>
          </div>
          {isActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
            </span>
          )}
        </div>
        {!isDormant && children}
      </div>
    </div>
  )
}

// 第一车间：LLM 意图解析中心
function Workshop1({ step, realData }: { step: SystemStep; realData: any | null }) {
  // 根据要求：step >= 2 才点亮
  const isActive = step >= 2 && step < 3
  const isDormant = step < 2
  
  const [typedText, setTypedText] = useState("")
  const [showCorrection, setShowCorrection] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  
  // 提取真实数据，提供默认值防空指针
  const workshop1 = realData?.workshop1 || {}
  const track = workshop1.track || "等待解析..."
  const sceneWords = Array.isArray(workshop1.scene_words) ? workshop1.scene_words : []
  const productWord = workshop1.product_word || "未指定"
  const correctedWord = workshop1.corrected_word || "无"
  const originalText = ">> 接收到新指令，Qwen语义网络正在剥离关键特征..."

  useEffect(() => {
    if (step >= 2) {
      // 打字机效果
      let index = 0
      const timer = setInterval(() => {
        setTypedText(originalText.slice(0, index + 1))
        index++
        if (index >= originalText.length) {
          clearInterval(timer)
          setTimeout(() => setShowCorrection(true), 150)
          setTimeout(() => setShowTags(true), 300)
          setTimeout(() => setShowRoute(true), 450)
        }
      }, 30)
      return () => clearInterval(timer)
    } else {
      // 状态重置
      setTypedText("")
      setShowCorrection(false)
      setShowTags(false)
      setShowRoute(false)
    }
  }, [step])

  return (
    <WorkshopCard
      icon={<Factory className="w-5 h-5" />}
      title="LLM 意图解析中心"
      number="第一车间"
      isActive={isActive}
      isDormant={isDormant}
    >
      <div className="space-y-3">
        {/* 原文/指令捕捉 */}
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 font-mono mb-1.5">【意图嗅探】</p>
          <p className="text-xs text-gray-300 font-mono">
            {typedText}
            {typedText.length < originalText.length && (
              <span className="inline-block w-0.5 h-3.5 bg-rose-400 ml-0.5 animate-pulse" />
            )}
          </p>
        </div>

        {/* 容错纠偏 (有纠正词时才高亮显示) */}
        {showCorrection && (
          <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <p className="text-[10px] text-amber-400/80 font-mono mb-1.5">【黑话/容错提取】</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">检测及纠偏实体:</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">
                {correctedWord}
              </Badge>
              {correctedWord !== "无" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
          </div>
        )}

        {/* 标签提取 (渲染真实的 scene_words) */}
        {showTags && (
          <div className="bg-black/30 rounded-lg p-3 border border-white/5 animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <p className="text-[10px] text-gray-500 font-mono mb-2">【标签提取】</p>
            <div className="flex flex-wrap gap-2 text-[10px] items-center">
              <span className="text-gray-400">🎭 场景/需求库:</span>
              {sceneWords.length > 0 ? (
                sceneWords.map((word: string, idx: number) => (
                  <Badge key={idx} className="bg-purple-500/20 text-purple-300 border-0">
                    [{word}]
                  </Badge>
                ))
              ) : (
                <span className="text-gray-600">无提取</span>
              )}
              
              <span className="text-gray-400 ml-2">📦 产品指定:</span>
              <Badge className="bg-gray-500/20 text-gray-400 border-0">
                [{productWord}]
              </Badge>
            </div>
          </div>
        )}

        {/* 路由分发 (真实的 track) */}
        {showRoute && (
          <div className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <span className="text-[10px] text-gray-500 font-mono">【路由分发】</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              命中 {track}
            </Badge>
          </div>
        )}
      </div>
    </WorkshopCard>
  )
}

// 第二车间：核心数据处理中枢
function Workshop2({ step, realData }: { step: SystemStep; realData: any | null }) {
  // 根据要求：step >= 3 才点亮
  const isActive = step >= 3 && step < 4
  const isDormant = step < 3
  
  const [isSearching, setIsSearching] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  
  // 提取真实数据
  const workshop2 = realData?.workshop2 || {}
  const totalSku = workshop2.total_sku || 0
  const filteredStock = workshop2.filtered_stock || "等待执行..."
  const topMatches = Array.isArray(workshop2.top_matches) ? workshop2.top_matches : []

  useEffect(() => {
    if (step >= 3) {
      setIsSearching(true)
      setTimeout(() => {
        setIsSearching(false)
        setSearchDone(true)
      }, 600)
      setTimeout(() => setShowMatch(true), 1000)
    } else {
      setIsSearching(false)
      setSearchDone(false)
      setShowMatch(false)
    }
  }, [step])

  return (
    <WorkshopCard
      icon={<Settings2 className={`w-5 h-5 ${isSearching ? "animate-spin" : ""}`} />}
      title="核心数据处理中枢"
      number="第二车间"
      isActive={isActive}
      isDormant={isDormant}
    >
      <div className="space-y-3">
        {/* 全量 SKU 与拦截策略 */}
        <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] text-gray-400 font-mono">数据库总承载 SKU：</span>
            <span className="text-[10px] text-cyan-400 font-bold">{totalSku}</span>
          </div>
          <div className="flex items-center gap-2">
            {isSearching ? (
              <>
                <Settings2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-[10px] text-amber-400 font-mono">执行物理拦截...</span>
              </>
            ) : searchDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-mono">
                  拦截策略执行：{filteredStock}
                </span>
              </>
            ) : (
              <>
                <Settings2 className="w-4 h-4 text-gray-600" />
                <span className="text-[10px] text-gray-600 font-mono">待执行拦截策略...</span>
              </>
            )}
          </div>
        </div>

        {/* 召回 Top SKU 列表 */}
        {showMatch && (
          <div className="bg-black/30 rounded-lg p-3 border border-white/5 animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[10px] text-gray-400 font-mono">匹配/纠错 召回池：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topMatches.length > 0 ? (
                topMatches.map((match: any, idx: number) => (
                  <Badge key={idx} className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px]">
                    {match.name} <span className="text-gray-500 ml-1">({match.score}分)</span>
                  </Badge>
                ))
              ) : (
                <span className="text-[10px] text-gray-600">未召回任何商品</span>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkshopCard>
  )
}

// 第三车间：自动化交付与交割
function Workshop3({ step, realData }: { step: SystemStep; realData: any | null }) {
  // 根据要求：step >= 4 才点亮
  const isActive = step >= 4
  const isDormant = step < 4
  
  const [showLogic, setShowLogic] = useState(false)
  const [showFinal, setShowFinal] = useState(false)

  // 提取真实数据
  const workshop3 = realData?.workshop3 || {}
  const promoted = workshop3.promoted || "常规召回"
  const finalRecs = Array.isArray(workshop3.final_recommendations) ? workshop3.final_recommendations : []

  useEffect(() => {
    if (step >= 4) {
      setTimeout(() => setShowLogic(true), 300)
      setTimeout(() => setShowFinal(true), 800)
    } else {
      setShowLogic(false)
      setShowFinal(false)
    }
  }, [step])

  return (
    <WorkshopCard
      icon={<Scale className="w-5 h-5" />}
      title="自动化交付与渲染"
      number="第三车间"
      isActive={isActive}
      isDormant={isDormant}
    >
      <div className="space-y-3">
        {/* 提权/主推策略 */}
        {showLogic && (
          <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20 animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-gray-400 font-mono">B端干预/提权策略:</span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">
                {promoted}
              </Badge>
            </div>
          </div>
        )}

        {/* 最终锁定商品 */}
        {showFinal && (
          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono">交割锁定商品：</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {finalRecs.length > 0 ? (
                finalRecs.map((rec: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
                      {rec.name_en} {rec.name_cn && `(${rec.name_cn})`}
                    </Badge>
                    {idx < finalRecs.length - 1 && <span className="text-gray-500">&</span>}
                  </div>
                ))
              ) : (
                <span className="text-[10px] text-gray-500">空</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1">
               <ArrowRight className="w-3 h-3 text-gray-500" />
               <span className="text-[10px] text-emerald-400">调用底层 Pillow 引擎执行海报合并渲染...</span>
            </div>
          </div>
        )}

        {/* 隐形数据埋点提醒 */}
        {showFinal && (
          <Alert className="bg-cyan-500/10 border-cyan-500/20 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 mt-2">
            <Lightbulb className="h-4 w-4 text-cyan-400" />
            <AlertDescription className="text-[11px] text-gray-300">
              <span className="font-medium text-cyan-300">数据闭环已触发: </span>
              本次交互意图及商品关联已静默写入 `history_log.csv`，反哺 B 端商业大盘。
            </AlertDescription>
          </Alert>
        )}
      </div>
    </WorkshopCard>
  )
}