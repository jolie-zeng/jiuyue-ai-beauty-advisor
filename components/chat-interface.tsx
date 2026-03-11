"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Lock, Sparkles, ShoppingBag, Lightbulb, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "./product-card"
import type { SystemStep } from "@/app/page"

interface Message {
  id: number
  type: "user" | "ai"
  content: string
  showProducts?: boolean
}

interface ChatInterfaceProps {
  step: SystemStep
  onTrigger: (query: string, inviteCode?: string) => void 
  isProcessing: boolean
  realData: any | null
}

export function ChatInterface({ step, onTrigger, isProcessing, realData }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const [testCode, setTestCode] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  
  // 🚀 AI 自我介绍更新：高情商限定 玖月 和 2 大场景
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: "Hi，我是 玖月 专属 AI 美妆顾问✨\n\n为了给您最专业的体验，本期测试版已开放【场景推荐】与【色号对比】两大核心引擎。请尽情围绕 玖月 的爆款唇釉、口红向我提问吧～",
    },
  ])
  const [showUserMessage, setShowUserMessage] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const [showFinalResponse, setShowFinalResponse] = useState(false)
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ================= 🚀 修复核心：将所有 API 相关的状态和函数移入组件内部 =================
  
  // 🚀 随机提示词状态
  const [randomPrompts, setRandomPrompts] = useState<string[]>(["正在加载专属知识库...", "...", "..."])

  // 🚀 真正的 Fetch 接口调用
  const fetchDynamicPrompts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/random-prompts?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRandomPrompts(data.prompts);
      }
    } catch (error) {
      console.error("Failed to fetch dynamic prompts:", error);
      setRandomPrompts(["早泥豆沙和奶油砖橘哪个好？", "适合素颜的唇釉推荐", "黄黑皮显白色号有哪些？"]); // 失败时的兜底
    }
  }

  // 组件挂载时拉取一次
  useEffect(() => {
    fetchDynamicPrompts()
  }, [])

  // 刷新提示词
  const handleRefreshPrompts = () => {
    // 点击换一批时，呈现一个极短的骨架屏状态，然后重新请求后端
    setRandomPrompts(["重新生成中...", "正在提取知识库...", "分析商品特征中..."]);
    fetchDynamicPrompts();
  }
  // =========================================================================================

  useEffect(() => {
    if (step >= 1 && !showUserMessage) {
      setShowUserMessage(true)
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          type: "user",
          content: lastQuery ?? "我想要那种温柔的早泥豆沙色，适合秋冬的",
        }
      ])
      setShowLoading(true)
    }
    
    const replyText = realData?.workshop3?.reply_text

    if (step >= 4 && !showFinalResponse && replyText) {
      setShowLoading(false)
      setShowFinalResponse(true)
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          type: "ai",
          content: replyText,
          showProducts: true,
        }
      ])
    }
  }, [step, showUserMessage, showFinalResponse, lastQuery, realData])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, showLoading])

  const handleSend = () => {
    if (!inputValue.trim() || !isUnlocked || isProcessing ) return
    const currentQuery = inputValue
    setLastQuery(currentQuery)
    setShowUserMessage(false)
    setShowFinalResponse(false)
    setShowLoading(false)
    setInputValue("")
    onTrigger(currentQuery, testCode) 
  }

  const handleUnlock = () => {
    if (testCode.trim()) {
      setIsUnlocked(true)
    }
  }

  const quotaLeft = realData?.quota_left

  return (
    // 🚀 清洗为明亮模式
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm z-10">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">AI 美妆智能推荐</h2>
          <p className="text-xs font-medium text-slate-500">玖月 专属 C 端导购演示</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6 custom-scrollbar" ref={scrollRef} id="chat-scroll-container">
        <div className="space-y-6 max-w-2xl mx-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} realData={realData} />
          ))}
          
          {showLoading && (
            <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white/80 backdrop-blur-md space-y-3 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        
        {/* 🚀 AI 随机提示词胶囊组 */}
        <div className="max-w-2xl mx-auto mb-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> AI 随机测试题库
            </span>
            <button 
              onClick={handleRefreshPrompts} 
              className="text-[11px] font-medium text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> 换一批
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {randomPrompts.map((prompt, idx) => (
              <button 
                key={idx}
                onClick={() => setInputValue(prompt)}
                className="text-[12px] bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm text-left line-clamp-1"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* 聊天输入框 */}
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            placeholder="描述您想要的妆容或色号..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!isUnlocked || isProcessing }
            className="flex-1 bg-slate-50/50 border-slate-200 focus:border-indigo-400 text-slate-800 transition-all duration-200 shadow-inner"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isUnlocked || isProcessing}
            className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Test Code Input */}
        <div className="flex gap-2 items-center max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="password"
              placeholder="为保护AI算力资产，执行大模型深层推理需输入测试码"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              disabled={isUnlocked}
              className="pl-10 bg-slate-50/50 border-slate-200 text-sm text-slate-600 focus:border-indigo-400"
            />
          </div>
          <Button
            variant={isUnlocked ? "outline" : "default"}
            onClick={handleUnlock}
            disabled={!testCode.trim() || isUnlocked}
            className={`whitespace-nowrap transition-all duration-200 ${!isUnlocked ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm' : 'text-slate-600 border-slate-300'}`}
          >
            {isUnlocked ? (quotaLeft !== undefined ? `已解锁 (剩 ${quotaLeft} 次)` : "已解锁") : "解锁引擎"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, realData }: { message: Message, realData: any }) {
  const isUser = message.type === "user"
  const posterUrl = realData?.workshop3?.poster_url
  const recommendations = realData?.workshop3?.final_recommendations || []
  

  const handleImageLoad = () => {
    const container = document.getElementById("chat-scroll-container")
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      })
    }
  }

  const isValidPoster = posterUrl && typeof posterUrl === "string" && posterUrl.trim() !== ""

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] ${isUser ? "order-1" : ""}`}>
        <div className={`
          px-5 py-3.5 rounded-2xl shadow-sm
          ${isUser 
            ? "bg-indigo-600 text-white rounded-br-sm" 
            : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"
          }
        `}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.showProducts && (
          <div className="mt-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
            {isValidPoster ? (
              <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white relative group">
                
              {/* 🚀 1. 左侧商品的新品角标 (固定在整张图的最左上角) */}
              {recommendations[0]?.is_new && (
                <div className="absolute top-3 left-3 z-10 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  新品
                </div>
              )}

              {/* 🚀 2. 右侧商品的新品角标 (利用 CSS 计算，精准定位到右半张图的左上角) */}
              {recommendations[1]?.is_new && (
                <div className="absolute top-3 left-[calc(50%+12px)] z-10 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  新品
                </div>
              )}

              <img 
                src={posterUrl} 
                alt="智能生成色号海报" 
                className="w-full h-auto object-cover block"
                onLoad={handleImageLoad} 
              />

                <div className="bg-slate-50/90 backdrop-blur-md p-3 grid grid-cols-2 gap-3 border-t border-slate-200">
                  {recommendations.map((item: any, idx: number) => {
                    const itemLink = (item.buy_link && String(item.buy_link).toLowerCase() !== "nan") ? item.buy_link : "#";

                    return (
                      <div key={idx} className="flex justify-center items-center">
                        <Button 
                          onClick={() => window.open(itemLink, "_blank")}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white h-8 px-4 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="font-bold text-[11px]">立即购买</span>
                        </Button>
                      </div>
                    )
                  })}
                </div>

              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recommendations.map((item: any, idx: number) => {
                  return (
                    <ProductCard
                      key={idx}
                      imageUrl={undefined as any}
                      colorNameEn={item.name_en}
                      colorNameCn={item.name_cn || ""}
                      shade={idx === 0 ? "#A65D57" : "#8B5A47"} 
                      price="" 
                      matchScore={idx === 0 ? 98 : 85}
                      isNew={item.is_new}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}