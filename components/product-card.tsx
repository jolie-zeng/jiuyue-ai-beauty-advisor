"use client"

import { Button } from "@/components/ui/button"
import { ShoppingBag, Sparkles } from "lucide-react"

// 🚀 修复点 1：把 imageUrl 的类型放宽，允许它接收 undefined 或是 null
interface ProductCardProps {
  imageUrl?: string | any 
  colorNameEn: string
  colorNameCn: string
  shade: string
  price: string
  matchScore?: number
  isNew?: boolean
}

export function ProductCard({
  imageUrl,
  colorNameEn,
  colorNameCn,
  shade,
  price,
  matchScore,
  isNew,
}: ProductCardProps) {
  
  // 🚀 修复点 2：建立极其严格的安全判断。只有真实存在的字符串链接，才被认为是有效图片
  const hasValidImage = imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== ""

  return (
    // 🚀 注入全新的浅色白昼主题，增加 hover 时上浮的精致交互
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
      
      {/* 顶部：图片或占位色块区 */}
      <div className="relative aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
        
        {hasValidImage ? (
          // 🚀 修复点 3：放弃娇贵的 Next.js <Image>，改用原生 <img>，避免域名校验报错
          <img
            src={imageUrl}
            alt={colorNameCn || colorNameEn}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // 🚀 修复点 4：当没有图片时，展示极其优雅的“无图占位符”
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div 
              className="w-12 h-12 rounded-full mb-2 shadow-inner border-2 border-white/80"
              style={{ backgroundColor: shade || "#e2e8f0" }} // 提取商品底色作为占位色
            />
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">官方色号</span>
          </div>
        )}
        
        {/* 左上角角标 */}
        {isNew ? (
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> 新品
          </div>
        ) : matchScore ? (
          <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            匹配度 {matchScore}%
          </div>
        ) : null}
      </div>
      
      {/* 底部：商品信息区 */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center gap-2.5">
          {/* 小巧的颜色指示点 */}
          <div 
            className="w-4 h-4 rounded-full border border-slate-200 shadow-sm shrink-0"
            style={{ backgroundColor: shade || "#e2e8f0" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{colorNameEn}</p>
            <p className="text-[10px] font-medium text-slate-500 truncate leading-none">{colorNameCn}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* 价格展示 */}
          <span className="text-sm font-black text-rose-600">
            {price && price !== "nan" && price !== "NaN" ? `¥${price}` : "官网同款"}
          </span>
          <Button size="sm" className="h-7 text-[11px] px-3 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-sm transition-all">
            <ShoppingBag className="w-3 h-3" />
            购买
          </Button>
        </div>
      </div>
    </div>
  )
}