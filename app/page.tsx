"use client"

import { useState, useCallback } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { InferenceDashboard } from "@/components/inference-dashboard"
import { BEndDashboard } from "@/components/b-end-dashboard"
import { Layers, MonitorSmartphone, LineChart } from "lucide-react"
import { VisionBlueprint } from "@/components/vision-blueprint"

export type SystemStep = 0 | 1 | 2 | 3 | 4 | 5
type ActiveTab = "VISION" | "C_END" | "B_END"

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://jiuyue-ai-beauty-advisor.onrender.com' 
  : 'http://localhost:8000';
  
export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("C_END")
  
  const [step, setStep] = useState<SystemStep>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [realData, setRealData] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  // 🚀 核心“点火引擎”
  const triggerWorkflow = useCallback(
    async (query: string, childInviteCode?: string) => {
      if (isProcessing) return
      setErrorMsg("") 

      if (!childInviteCode?.trim()) {
        setErrorMsg("⚠️ 请输入邀请码解锁引擎")
        setTimeout(() => setErrorMsg(""), 3000) 
        return
      }

      setIsProcessing(true)
      setRealData(null)
      
      // 触发这行，左侧气泡出来，右侧面板发光！
      setStep(1)
      
      try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            query: query,             // 👈 核心修复 1：把 message 改成了 query，对接后端！
            invite_code: childInviteCode // 👈 核心修复 2：确保密码被完整打包发送
          }),
        })

        const data = await response.json()
        console.log("后端返回数据:", data)

        // 🌟 拦截后端的错误信息并弹窗
        if (data.error) {
          setErrorMsg(`❌ ${data.error}`)
          setIsProcessing(false)
          setStep(0) 
          return
        }

        setRealData(data)

        // 定时器推动工业流水线动画
        setTimeout(() => setStep(2), 1500)
        setTimeout(() => setStep(3), 3000)
        setTimeout(() => setStep(4), 4500)
        setTimeout(() => {
          setStep(5)
          setIsProcessing(false)
        }, 6000)
      } catch (error) {
        console.error("请求后端失败:", error)
        setErrorMsg("❌ 网络请求失败，请检查后端是否启动")
        setIsProcessing(false)
        setStep(0)
      }
    },
    [isProcessing]
  )

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#08080c] text-white">
      
      {/* 🚀 顶层全局导航栏 */}
      <header className="h-14 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-rose-500 flex items-center justify-center font-bold">J</div>
          <span className="font-semibold tracking-wide text-sm">AI 智能美妆双轨系统</span>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab("VISION")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-md transition-all ${activeTab === "VISION" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
          >
            <Layers className="w-4 h-4" /> 战略蓝图
          </button>
          <button 
            onClick={() => setActiveTab("C_END")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-md transition-all ${activeTab === "C_END" ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-gray-400 hover:text-white"}`}
          >
            <MonitorSmartphone className="w-4 h-4" /> C端导购展厅
          </button>
          <button 
            onClick={() => setActiveTab("B_END")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-md transition-all ${activeTab === "B_END" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-gray-400 hover:text-white"}`}
          >
            <LineChart className="w-4 h-4" /> B端数据大盘
          </button>
        </div>
      </header>

      {/* 💡 核心展示区 */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* 1. 战略蓝图页 */}
        {activeTab === "VISION" && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4">
            <VisionBlueprint />
          </div>
        )}

        {/* 2. C端 + 引擎监控页 */}
        {activeTab === "C_END" && (
          <div className="absolute inset-0 flex animate-in fade-in slide-in-from-bottom-4">
            <div className="w-1/2 h-full border-r border-white/10 relative">
              <ChatInterface 
                step={step} 
                onTrigger={triggerWorkflow}
                isProcessing={isProcessing}
                realData={realData}
              />
              {/* 报错小弹窗 */}
              {errorMsg && (
                <div className="absolute bottom-20 left-6 z-50 px-4 py-2 text-sm font-bold text-red-400 bg-red-950/80 border border-red-900/50 rounded-lg shadow-2xl backdrop-blur-md">
                  {errorMsg}
                </div>
              )}
            </div>
            <div className="w-1/2 h-full bg-[#08080c]">
              <InferenceDashboard step={step} realData={realData} />
            </div>
          </div>
        )}

        {/* 3. B端数据看板页 */}
        {activeTab === "B_END" && (
          <div className="absolute inset-0">
            <BEndDashboard />
          </div>
        )}

      </main>
    </div>
  )
}