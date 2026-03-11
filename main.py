from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import os
import csv
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel

from llm_router import extract_user_intent
from recommendation_engine import get_best_shades
from response_generator import generate_final_response, generate_comparison_response
from shade_recognizer import ShadeRecognizer

load_dotenv()

app = FastAPI()

# 1. 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 挂载海报目录
POSTER_DIR = "final_posters"
if not os.path.exists(POSTER_DIR):
    os.makedirs(POSTER_DIR)
app.mount("/posters", StaticFiles(directory=POSTER_DIR), name="posters")

# 3. 数据预加载 (双轨读取逻辑：开源保护机制)
if os.path.exists("lips_colors_match.csv"):
    CSV_PATH = "lips_colors_match.csv"
    print("✅ 检测到商业知识库，启动完整模式")
else:
    CSV_PATH = "sample_knowledge.csv"
    print("⚠️ 未检测到商业知识库，启动开源体验模式 (读取 sample_knowledge.csv)")

try:
    df_main = pd.read_csv(CSV_PATH, encoding='utf-8-sig')
    if '英文色号' not in df_main.columns:
        df_main = pd.read_csv(CSV_PATH, header=1, encoding='utf-8-sig')
    total_sku_count = len(df_main)
except Exception as e:
    print(f"⚠️ 数据加载失败，请检查 {CSV_PATH} 文件是否存在: {e}")
    df_main = pd.DataFrame()
    total_sku_count = 0

# 让你的识别器也动态读取当前决定的 CSV 路径
recognizer = ShadeRecognizer(csv_path=CSV_PATH)

# 模块零：PLG 门禁 - 全局配额池
global_quota = {
    "INVITE-ALPHA": {"limit": 10, "used": 0},
    "INVITE-BETA": {"limit": 10, "used": 0},
    "INVITE-GAMMA": {"limit": 10, "used": 0},
    "ADMIN-JOLIE": {"limit": 100, "used": 0},
}

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_input = data.get("message", "")
    print(f"\n📥 收到请求: {user_input}")

    # === 模块零：PLG 门禁 ===
    invite_code = data.get("invite_code", "") or data.get("inviteCode", "")
    quota_info = global_quota.get(invite_code)
    if not quota_info or quota_info["used"] >= quota_info["limit"]:
        return {"error": "邀请码无效或额度耗尽"}

    # ==========================================
    # 初始化兜底的安全返回数据格式（保证前端绝不报错）
    # ==========================================
    response_data = {
        "workshop1": {
            "scene_words": ["解析中..."],
            "product_word": "未指定",
            "corrected_word": "无",
            "track": "🔴 场景A：颜色推荐"
        },
        "workshop2": {
            "total_sku": total_sku_count,
            "filtered_stock": "物理拦截无库存",
            "top_matches": []
        },
        "workshop3": {
            "promoted": "常规召回",
            "final_recommendations": [],
            "reply_text": "抱歉，系统暂时开小差了，请稍后再试。",
            "poster_url": None
        }
    }

    # === 第一车间 ===
    intent_dict = extract_user_intent(user_input)
    if not intent_dict:
        return response_data

    intent_type = intent_dict.get('意图', '推荐')
    response_data["workshop1"] = {
        "scene_words": intent_dict.get("场景标签", []),
        "product_word": intent_dict.get("产品词", "未指定"),
        "corrected_word": " / ".join(intent_dict.get("提及色号", [])) if intent_type == '对比' else "无",
        "track": "🔵 场景B：色号对比" if intent_type == '对比' else "🔴 场景A：颜色推荐"
    }

    # 为 CSV 埋点准备原始词与最终锁定色号
    raw_terms = " / ".join(intent_dict.get("提及色号", [])) or intent_dict.get("产品词", "")
    final_shades_str = ""

   # === 路由分发 ===
    poster_path = None
    official_pitch = "暂未提取到官方推荐话术"  # 🚀 1. 新增一个全局变量用来存话术

    if intent_type == '对比':
        mentioned_shades = intent_dict.get('提及色号', [])
        official_shade1 = recognizer.extract_shade(mentioned_shades[0]) if len(mentioned_shades) > 0 else "未知色号"
        official_shade2 = recognizer.extract_shade(mentioned_shades[1]) if len(mentioned_shades) > 1 else "未知色号"

        final_shades_str = " / ".join([str(official_shade1), str(official_shade2)])

        cn1 = df_main[df_main['英文色号'] == official_shade1]['昵称'].values[0] if official_shade1 in df_main['英文色号'].values else official_shade1
        cn2 = df_main[df_main['英文色号'] == official_shade2]['昵称'].values[0] if official_shade2 in df_main['英文色号'].values else official_shade2

        is_new1 = df_main[df_main['英文色号'] == official_shade1]['是否新品'].values[0] if (official_shade1 in df_main['英文色号'].values and '是否新品' in df_main.columns) else False
        is_new2 = df_main[df_main['英文色号'] == official_shade2]['是否新品'].values[0] if (official_shade2 in df_main['英文色号'].values and '是否新品' in df_main.columns) else False

        price1 = df_main[df_main['英文色号'] == official_shade1]['价格'].values[0] if (official_shade1 in df_main['英文色号'].values and '价格' in df_main.columns) else 270
        link1 = df_main[df_main['英文色号'] == official_shade1]['购买链接'].values[0] if (official_shade1 in df_main['英文色号'].values and '购买链接' in df_main.columns) else "#"
        price2 = df_main[df_main['英文色号'] == official_shade2]['价格'].values[0] if (official_shade2 in df_main['英文色号'].values and '价格' in df_main.columns) else 270
        link2 = df_main[df_main['英文色号'] == official_shade2]['购买链接'].values[0] if (official_shade2 in df_main['英文色号'].values and '购买链接' in df_main.columns) else "#"

        # 🚀 2. 动态从 Pandas 里提取这两支色号的官方话术！
        pitch1 = str(df_main[df_main['英文色号'] == official_shade1]['官方推荐话术'].values[0]) if (official_shade1 in df_main['英文色号'].values and '官方推荐话术' in df_main.columns) else "暂无官方档案"
        pitch2 = str(df_main[df_main['英文色号'] == official_shade2]['官方推荐话术'].values[0]) if (official_shade2 in df_main['英文色号'].values and '官方推荐话术' in df_main.columns) else "暂无官方档案"
        
        # 将两支色号的话术拼在一起，准备存入日志
        official_pitch = f"✨ #{official_shade1}：{pitch1}\n💄 #{official_shade2}：{pitch2}"

        # 🚀 把提取出的话术传给大模型生成函数
        shade1_info = {"色号": str(official_shade1), "系列": "对比系", "官方推荐话术": pitch1}
        shade2_info = {"色号": str(official_shade2), "系列": "对比系", "官方推荐话术": pitch2}
        final_text, poster_path = generate_comparison_response(user_input, shade1_info, shade2_info)

        response_data["workshop2"]["filtered_stock"] = "已跳过物理拦截"
        response_data["workshop2"]["top_matches"] = [
            {"name": f"#{official_shade1}", "score": 99},
            {"name": f"#{official_shade2}", "score": 99}
        ]
        response_data["workshop3"]["promoted"] = "对比模式无提权"
        
        response_data["workshop3"]["final_recommendations"] = [
            {"name_en": f"#{official_shade1}", "name_cn": str(cn1), "price": str(price1), "buy_link": str(link1), "is_new": bool(is_new1 == True or str(is_new1) == '是')},
            {"name_en": f"#{official_shade2}", "name_cn": str(cn2), "price": str(price2), "buy_link": str(link2), "is_new": bool(is_new2 == True or str(is_new2) == '是')}
        ]
        response_data["workshop3"]["reply_text"] = final_text

    else:
        recommended_shades = get_best_shades(intent_dict, user_input, csv_path=CSV_PATH)
        final_text, poster_path = generate_final_response(user_input, recommended_shades)
        top2 = recommended_shades[:2] if recommended_shades else []

        if top2:
            # 🚀 3. 推荐模式下，循环提取 top2 的官方话术
            official_pitch = "\n".join([f"✨ #{s['色号']}：{str(s.get('官方推荐话术', '暂无官方档案'))}" for s in top2])

            response_data["workshop2"]["top_matches"] = [{"name": f"#{s['色号']}", "score": 98 if i==0 else 85} for i, s in enumerate(top2)]
            response_data["workshop3"]["promoted"] = str(top2[0]['色号']) if top2[0].get('是否新品') else "常规召回"
            
            response_data["workshop3"]["final_recommendations"] = [
                {
                    "name_en": f"#{s['色号']}", 
                    "name_cn": str(s.get('系列', '')), 
                    "price": str(s.get('价格', 270)), 
                    "buy_link": str(s.get('购买链接', '#')), 
                    "is_new": bool(s.get('是否新品') == True or str(s.get('是否新品')).strip() == '是')
                } for s in top2
            ]
            response_data["workshop3"]["reply_text"] = final_text
            final_shades_str = " / ".join(str(s["色号"]) for s in top2)

    if poster_path and os.path.exists(poster_path):
        filename = os.path.basename(poster_path)
        response_data["workshop3"]["poster_url"] = f"http://localhost:8000/posters/{filename}"
    # ==========================================
    # # ==========================================
    # 终极闭环：带 RLHF 反哺的隐形埋点
    # ==========================================
    try:
        history_path = "history_log.csv"
        file_exists = os.path.exists(history_path)
        
        safe_raw_terms = " / ".join(intent_dict.get("提及色号", [])) or intent_dict.get("产品词", "未提取到")
        recs = response_data.get("workshop3", {}).get("final_recommendations", [])
        safe_final_shades = " / ".join([str(r.get("name_en", "")) for r in recs]) if recs else "无推荐"
        ai_reply = response_data.get("workshop3", {}).get("reply_text", "")

        with open(history_path, mode="a", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            if not file_exists:
                # 🚀 新增一列：官方推荐话术
                writer.writerow(["调用时间", "用户原话", "意图", "提取的原始词", "最终锁定的色号", "官方推荐话术", "机器人的回复", "人工反馈", "消耗的邀请码"])
            
            writer.writerow([
                datetime.now().isoformat(), 
                user_input, 
                intent_type, 
                safe_raw_terms, 
                safe_final_shades, 
                official_pitch,  # 🚀 把提取到的官方话术写进 CSV 对应位置
                ai_reply,
                "未评级", 
                invite_code
            ])
            print("✅ 隐形埋点写入成功！")
            
    except Exception as e:
        print(f"⚠️ 写入埋点失败: {e}")

    quota_info["used"] += 1
    response_data["quota_left"] = quota_info["limit"] - quota_info["used"]

    return response_data

import random

@app.get("/api/random-prompts")
async def get_random_prompts():
    """动态读取 CSV，生成带有真实商品数据和错别字的随机测试题（严格剔除已断货商品）"""
    try:
        if df_main.empty:
            return {"prompts": ["早泥豆沙和奶油砖橘哪个显白？", "适合早八通勤的口红推荐", "推荐一支适合黄皮的唇釉"]}

        # =====================================================================
        # 🚀 核心新增：数据清洗，严格拦截并剔除【已断货=1】的商品
        # =====================================================================
        if '已断货' in df_main.columns:
            # 兼容处理：防患 CSV 里的 1 被读成数字、字符串 '1' 或是 '1.0'
            df_active = df_main[~df_main['已断货'].astype(str).isin(['1', '1.0'])]
        else:
            df_active = df_main
            
        # 如果过滤完发现全断货了（极端情况兜底）
        if df_active.empty:
            return {"prompts": ["早泥豆沙和奶油砖橘哪个好？", "适合伪素颜的唇釉", "黄黑皮显白色号推荐"]}

        # =====================================================================
        # 接下来所有的提取，都基于干净的、全部在售的 df_active 数据集
        # =====================================================================
        
        # 1. 提取所有不为空的场景标签
        all_scenes = []
        if '场景标签' in df_active.columns:
            for tags in df_active['场景标签'].dropna():
                all_scenes.extend([t.strip() for t in str(tags).split('/') if t.strip()])
        all_scenes = list(set(all_scenes)) # 去重

        # 2. 提取在售色号信息
        shades_data = df_active.to_dict(orient="records")
        
        prompts = []

        # === 生成 1 题：场景推荐 ===
        if all_scenes:
            scene = random.choice(all_scenes)
            scene_templates = [
                f"我想要那种适合{scene}的口红，有推荐的吗？",
                f"有没有什么色号能打造{scene}的感觉？",
                f"救命，明天要{scene}，涂什么颜色的唇釉好？"
            ]
            prompts.append(random.choice(scene_templates))

        # === 生成 2 题：色号对比 (混入错别字和黑话) ===
        if len(shades_data) >= 2:
            # 随机抽两个不同的在售商品
            sample_shades = random.sample(shades_data, 2)
            shade1, shade2 = sample_shades[0], sample_shades[1]
            
            # 准备它们的各种叫法（如果有的字段为空，get() 会返回空字符串）
            name1_en = str(shade1.get('英文色号', ''))
            name1_cn = str(shade1.get('昵称', '')) or str(shade1.get('包装名称', ''))
            name2_en = str(shade2.get('英文色号', ''))
            name2_cn = str(shade2.get('昵称', '')) or str(shade2.get('包装名称', ''))
            
            # 故意制造错别字的黑魔法
            def make_typo(name):
                if not name or name.lower() == 'nan': return ""
                typos = {"枣": "早", "泥": "泥巴", "橘": "桔", "红": "宏", "粉": "分"}
                typo_name = name
                for k, v in typos.items():
                    if k in typo_name and random.random() > 0.5: # 50%概率产生错别字
                        typo_name = typo_name.replace(k, v)
                return typo_name

            # 组装 C 端对比提问
            comp_templates = [
                f"{make_typo(name1_cn)} 和 {make_typo(name2_cn)} 哪个更显白？",
                f"{name1_en} 和 {name2_cn} 我黄皮买哪个好？",
                f"想买 {name1_cn}，但又纠结 {name2_en}，有什么区别？"
            ]
            prompts.extend(random.sample(comp_templates, 2))

        # 如果数据不够，用兜底数据补齐 3 个
        while len(prompts) < 3:
            prompts.append("黄黑皮适合什么色号？")

        # 打乱顺序返回
        random.shuffle(prompts)
        return {"prompts": prompts[:3]}

    except Exception as e:
        print(f"⚠️ 动态提示词生成失败: {e}")
        return {"prompts": ["系统推荐引擎测试中", "请对比两款产品", "场景推荐链路测试"]}

from collections import Counter

@app.get("/api/dashboard")
async def get_dashboard_data():
    """B端数据大盘接口：带分类色号全量榜单与对话复盘"""
    history_path = "history_log.csv"
    if not os.path.exists(history_path):
        return {"total_calls": 0, "intent_distribution": [], "word_cloud": [], "shade_ranking_rec": [], "shade_ranking_comp": [], "recent_records": []}

    try:
        df = pd.read_csv(history_path, encoding="utf-8-sig").fillna("无")
        total_calls = len(df)

        # 🚀 兼容防崩处理：如果 CSV 里没这列，自动填上
        if "官方推荐话术" not in df.columns:
            df["官方推荐话术"] = "缺失基准数据"

        # 1. 意图漏斗
        intent_counts = df["意图"].value_counts().to_dict()
        intent_distribution = [
            {"name": "场景A：颜色推荐", "value": intent_counts.get("推荐", 0), "color": "bg-rose-500"},
            {"name": "场景B：色号对比", "value": intent_counts.get("对比", 0), "color": "bg-cyan-500"}
        ]

        # 2. 词云
        words = []
        for terms in df["提取的原始词"]:
            for word in str(terms).split("/"):
                w = word.strip()
                if w and w not in ["无", "未指定", "nan"]: words.append(w)
        
        word_counts = Counter(words).most_common(20)
        max_count = word_counts[0][1] if word_counts else 1
        word_cloud = [{"text": w, "count": c, "size": 12 + (c / max_count) * 20} for w, c in word_counts]

        # 3. 🚀 全量色号排行榜 (按场景拆分)
        rec_list = []
        comp_list = []
        for _, row in df.iterrows():
            shades = row["最终锁定的色号"]
            intent = row["意图"]
            if shades and shades != "无推荐" and shades != "无":
                for s in str(shades).split("/"):
                    s = s.strip()
                    if s:
                        if intent == "推荐": rec_list.append(s)
                        else: comp_list.append(s)
        
        # 返回按次数从高到低排序的全量数据
        shade_ranking_rec = [{"name": w, "count": c} for w, c in Counter(rec_list).most_common()]
        shade_ranking_comp = [{"name": w, "count": c} for w, c in Counter(comp_list).most_common()]

        # 4. 提取原声问答 (扩大到 100 条)
        recent_records = df.tail(100).iloc[::-1].to_dict(orient="records")

        return {
            "total_calls": total_calls,
            "intent_distribution": intent_distribution,
            "word_cloud": word_cloud,
            "shade_ranking_rec": shade_ranking_rec, # 推荐榜单
            "shade_ranking_comp": shade_ranking_comp, # 对比榜单
            "recent_records": recent_records
        }
    except Exception as e:
        return {"error": str(e)}

# 🚀 接收大盘传来的人工打分
class FeedbackRequest(BaseModel):
    timestamp: str
    feedback: str

@app.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest):
    history_path = "history_log.csv"
    try:
        df = pd.read_csv(history_path, encoding="utf-8-sig")
        # 匹配时间戳，修改打标状态
        df.loc[df['调用时间'] == req.timestamp, '人工反馈'] = req.feedback
        df.to_csv(history_path, index=False, encoding="utf-8-sig")
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}