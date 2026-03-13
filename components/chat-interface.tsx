"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Lock, Sparkles, ShoppingBag, Lightbulb, RefreshCw, Server, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// 🚀 核心修复 1：将环境变量判断提到最外层，让所有 fetch 都能共用！
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://jiuyue-ai-beauty-advisor.onrender.com' 
  : 'http://localhost:8000';

export function ChatInterface({ step, onTrigger, isProcessing, realData }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const [testCode, setTestCode] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminCodes, setAdminCodes] = useState<Record<string, number>>({})
  const [isAdminLoading, setIsAdminLoading] = useState(false)
  
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

  const [randomPrompts, setRandomPrompts] = useState<string[]>(["正在加载专属知识库...", "...", "..."])

  // 🚀 核心修复 2：补全了丢失的 fetch 请求，并使用动态 URL
  const fetchDynamicPrompts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/random-prompts?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRandomPrompts(data.prompts);
      } else {
        throw new Error("网络请求失败");
      }
    } catch (error) {
      console.error("Failed to fetch dynamic prompts:", error);
      setRandomPrompts(["早泥豆沙和奶油砖橘哪个好？", "适合素颜的唇釉推荐", "黄黑皮显白色号有哪些？"]); 
    }
  }

  useEffect(() => {
    fetchDynamicPrompts()
  }, [])

  const handleRefreshPrompts = () => {
    setRandomPrompts(["重新生成中...", "正在提取知识库...", "分析商品特征中..."]);
    fetchDynamicPrompts();
  }

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

  const handleUnlock = async () => {
    const code = testCode.trim().toUpperCase();
    if (code === "ADMIN999") {
      setIsAdmin(true); 
      setIsUnlocked(true);
      return;
    }
    if (code) {
      setIsUnlocked(true);
    }
  }

  // 🚀 核心修复 3：后台管理接口使用动态 URL
  const fetchAdminCodes = async () => {
    setIsAdminLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/codes`);
      if (res.ok) {
        const data = await res.json();
        setAdminCodes(data);
      }
    } catch (e) {
      console.error("拉取密码本失败", e);
    }
    setIsAdminLoading(false);
  }

  // 🚀 核心修复 4：生成密码接口使用动态 URL
  const handleGenerateCodes = async () => {
    setIsAdminLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAdminCodes(data.codes); 
        alert("✅ 成功生成 20 个新体验密码！");
      }
    } catch (e) {
      console.error("生成失败", e);
    }
    setIsAdminLoading(false);
  }

  const quotaLeft = realData?.quota_left

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans relative">
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

      <div className="p-4 border-t border-slate-200 bg-white/80 backdrop-blur-md space-y-3 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        
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

          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => {
                setShowAdminPanel(true);
                fetchAdminCodes(); 
              }}
              className="px-3 bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm animate-in zoom-in duration-300"
              title="打开后台密码控制台"
            >
              <Server className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showAdminPanel && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Server className="w-5 h-5 text-indigo-600" />
                后台测试码总控台
              </div>
              <button onClick={() => setShowAdminPanel(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                关闭
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
              {isAdminLoading ? (
                <div className="text-center text-slate-400 text-sm py-10 animate-pulse">正在读取数据库...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(adminCodes).reverse().map(([code, quota]) => (
                    <div key={code} className={`p-3 rounded-xl border ${quota > 0 ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'} flex flex-col gap-1`}>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">CODE</span>
                      
                      <div 
                        className="font-black text-slate-800 tracking-widest cursor-pointer hover:text-indigo-600 flex items-center justify-between group"
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          alert(`✅ 已复制测试码: ${code}`);
                        }}
                        title="点击复制"
                      >
                        {code}
                        <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">剩余次数</span>
                        <span className={`text-sm font-bold ${quota > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {quota}/{code === 'ADMIN999' ? '100' : '10'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-white">
              <Button 
                onClick={handleGenerateCodes}
                disabled={isAdminLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold"
              >
                <Sparkles className="w-4 h-4 mr-2" /> 
                一键补充 20 个新密码
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message, realData }: { message: Message, realData: any }) {
  const isUser = message.type === "user"
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
        
        {message.showProducts && recommendations.length > 0 && (
          <div className="mt-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex flex-row gap-4 overflow-x-auto py-2 w-full custom-scrollbar pr-4">
              
              {recommendations.map((item: any, idx: number) => {
                const imgUrl = item.image_url || item.imageUrl;
                
                // 🌟 修复 5：补回终极安检机，防止出现 undefined 和 nan 报错
                const getValidData = (primary: any, secondary: any, fallback: string) => {
                  const val = primary || secondary;
                  if (!val || String(val).toLowerCase() === "nan" || String(val).trim() === "") {
                    return fallback;
                  }
                  return val;
                };

                const colorName = getValidData(item.name_en, item.色号, "未知色号");
                const name_cn = getValidData(item.name_cn, item.昵称, "暂无昵称");
                const series = getValidData(item.series, item.系列, "经典系列");
                const itemLink = getValidData(item.buy_link, item.购买链接, "#");

                return (
                  <div key={idx} className="flex-shrink-0 w-[200px] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 bg-white flex flex-col hover:shadow-lg transition-shadow duration-300 relative">
                    
                    {(item.是否新品 || item.is_new) && (
                      <div className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> NEW
                      </div>
                    )}

                    <div className="relative bg-[#F8F9FA] pt-3 pb-2 flex flex-col items-center">
                      <div className="w-[120px] h-24 rounded-xl border-[4px] border-white shadow-sm overflow-hidden flex items-center justify-center bg-white">
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={colorName} 
                            className="w-full h-full object-cover block"
                            onLoad={handleImageLoad}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#A05252]"></div> 
                        )}
                      </div>
                    </div>

                    <div className="p-3 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col overflow-hidden w-full">
                          <span className="text-base font-black text-slate-800 truncate">
                            {colorName}
                          </span>
                          <span className="text-sm text-slate-500 truncate mt-0.5">
                            {name_cn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[#E11D48] font-bold text-sm tracking-wider truncate max-w-[120px]">
                          {series}
                        </span>
                        <Button 
                          onClick={() => window.open(itemLink, "_blank")}
                          className="bg-[#0F172A] text-white h-8 px-5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-colors flex-shrink-0"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          购买
                        </Button>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}