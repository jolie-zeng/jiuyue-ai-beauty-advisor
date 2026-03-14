from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import os
import csv
from datetime import datetime
from dotenv import load_dotenv
from pydantic import BaseModel
import json
import random
import string
from collections import Counter

from llm_router import extract_user_intent
from recommendation_engine import get_best_shades
from response_generator import generate_final_response, generate_comparison_response
from shade_recognizer import ShadeRecognizer
from sqlalchemy import create_engine, text
import os
# ... (保留你原来的其他 import)

# 🚀 数据库连接引擎初始化
# 会优先读取环境变量 DATABASE_URL，如果在本地没有配，就 fallback 到 None（继续用本地文件）
DB_URL = os.environ.get("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

# 创建 SQLAlchemy 引擎
engine = create_engine(DB_URL) if DB_URL else None

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

recognizer = ShadeRecognizer(csv_path=CSV_PATH)

# ==========================================
# 🌟 微型数据库设置 (取代了原本的 global_quota)
# ==========================================
CODES_FILE = "invite_codes.json"

def get_codes():
    """读取密码本：优先读云端数据库，没有就读本地"""
    if engine:
        try:
            df_codes = pd.read_sql("invite_codes", engine)
            return dict(zip(df_codes['code'], df_codes['quota']))
        except Exception:
            # 如果云端还没建表，先初始化并保存到云端
            initial_codes = {"ADMIN999": 100, "JIUYUE2026": 10}
            save_codes(initial_codes)
            return initial_codes
            
    # 如果没连数据库，退回到以前的本地 JSON 逻辑
    if not os.path.exists(CODES_FILE):
        initial_codes = {"ADMIN999": 100, "JIUYUE2026": 10}
        save_codes(initial_codes)
        return initial_codes
    with open(CODES_FILE, "r", encoding="utf-8") as f:
        codes = json.load(f)
    if "ADMIN999" not in codes:
        codes["ADMIN999"] = 100
        save_codes(codes)
    return codes

def save_codes(codes):
    """保存密码本：优先写云端数据库"""
    if engine:
        try:
            df_codes = pd.DataFrame(list(codes.items()), columns=['code', 'quota'])
            # 🚀 if_exists='replace' 会自动建表并覆盖更新
            df_codes.to_sql('invite_codes', engine, if_exists='replace', index=False)
            return
        except Exception as e:
            print(f"⚠️ 云端密码本保存失败: {e}")
            
    # 退回本地逻辑
    with open(CODES_FILE, "w", encoding="utf-8") as f:
        json.dump(codes, f, ensure_ascii=False, indent=2)

# ==========================================
# 🚀 唯一且核心的聊天接口
# ==========================================
@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    
    # 兼容前端发来的字段，防抖
    user_input = data.get("query", "") or data.get("message", "")
    print(f"\n📥 收到请求: {user_input}")

    # === 模块零：JSON 数据库门禁拦截 ===
    invite_code = data.get("invite_code", "").strip().upper() 
    codes = get_codes()
    
    if invite_code not in codes:
        return {"error": f"测试码无效！找不到 {invite_code}"}
    if codes[invite_code] <= 0:
        return {"error": "该测试码额度已耗尽，请联系管理员获取新码！"}

    # ==========================================
    # 初始化兜底的安全返回数据格式
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

    # === 第一车间：意图识别 ===
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

    # 为 CSV 埋点准备原始词
    raw_terms = " / ".join(intent_dict.get("提及色号", [])) or intent_dict.get("产品词", "")
    final_shades_str = ""
    poster_path = None
    official_pitch = "暂未提取到官方推荐话术"  
    safe_raw_terms = "未提取到"  

    # === 路由分发 (对比 vs 推荐) ===
    if intent_type == '对比':
        safe_raw_terms = " / ".join(intent_dict.get("提及色号", [])) or intent_dict.get("产品词", "未提取到")
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

        pitch1 = str(df_main[df_main['英文色号'] == official_shade1]['官方推荐话术'].values[0]) if (official_shade1 in df_main['英文色号'].values and '官方推荐话术' in df_main.columns) else "暂无官方档案"
        pitch2 = str(df_main[df_main['英文色号'] == official_shade2]['官方推荐话术'].values[0]) if (official_shade2 in df_main['英文色号'].values and '官方推荐话术' in df_main.columns) else "暂无官方档案"
        
        official_pitch = f"✨ #{official_shade1}：{pitch1}\n💄 #{official_shade2}：{pitch2}"

        # 🚀 读取对应的 image_url 给前端
        img_url1 = str(df_main[df_main['英文色号'] == official_shade1]['image_url'].values[0]) if (official_shade1 in df_main['英文色号'].values and 'image_url' in df_main.columns) else ""
        img_url2 = str(df_main[df_main['英文色号'] == official_shade2]['image_url'].values[0]) if (official_shade2 in df_main['英文色号'].values and 'image_url' in df_main.columns) else ""

        # 🚀 新增：从表格里把“系列”也抓出来
        series1 = df_main[df_main['英文色号'] == official_shade1]['产品系列'].values[0] if (official_shade1 in df_main['英文色号'].values and '产品系列' in df_main.columns) else "经典系列"
        series2 = df_main[df_main['英文色号'] == official_shade2]['产品系列'].values[0] if (official_shade2 in df_main['英文色号'].values and '产品系列' in df_main.columns) else "经典系列"

        shade1_info = {"色号": str(official_shade1), "产品系列": "对比系", "官方推荐话术": pitch1}
        shade2_info = {"色号": str(official_shade2), "产品系列": "对比系", "官方推荐话术": pitch2}
        final_text, poster_path = generate_comparison_response(user_input, shade1_info, shade2_info)

        response_data["workshop2"]["filtered_stock"] = "已跳过物理拦截"
        response_data["workshop2"]["top_matches"] = [
            {"name": f"#{official_shade1}", "score": 99},
            {"name": f"#{official_shade2}", "score": 99}
        ]
        response_data["workshop3"]["promoted"] = "对比模式无提权"
        
        # 🚀 修复：把 series 字段正式打包发给前端
        response_data["workshop3"]["final_recommendations"] = [
            {"name_en": f"#{official_shade1}", "name_cn": str(cn1), "series": str(series1), "price": str(price1), "buy_link": str(link1), "is_new": bool(is_new1 == True or str(is_new1) == '是'), "image_url": img_url1 if img_url1 != 'nan' else ""},
            {"name_en": f"#{official_shade2}", "name_cn": str(cn2), "series": str(series2), "price": str(price2), "buy_link": str(link2), "is_new": bool(is_new2 == True or str(is_new2) == '是'), "image_url": img_url2 if img_url2 != 'nan' else ""}
        ]
        response_data["workshop3"]["reply_text"] = final_text

    else:
        scene_tags = intent_dict.get("场景标签", [])
        if scene_tags:
            safe_raw_terms = " / ".join(scene_tags)
        else:
            safe_raw_terms = intent_dict.get("产品词", "未提取到")

        recommended_shades = get_best_shades(intent_dict, user_input, csv_path=CSV_PATH)
        final_text, poster_path = generate_final_response(user_input, recommended_shades)
        top2 = recommended_shades[:2] if recommended_shades else []

        if top2:
            official_pitch_lines = []
            for s in top2:
                shade_code = s.get('色号')
                match_row = df_main[df_main['英文色号'] == shade_code]
                if not match_row.empty and '官方推荐话术' in df_main.columns:
                    pitch = str(match_row['官方推荐话术'].values[0])
                else:
                    pitch = "暂无官方档案"
                official_pitch_lines.append(f"✨ #{shade_code}：{pitch}")
            
            official_pitch = "\n".join(official_pitch_lines)

            response_data["workshop2"]["top_matches"] = [{"name": f"#{s['色号']}", "score": 98 if i==0 else 85} for i, s in enumerate(top2)]
            response_data["workshop3"]["promoted"] = str(top2[0]['色号']) if top2[0].get('是否新品') else "常规召回"
            
            # 🚀 修复：精准区分 name_cn(昵称) 和 series(系列)
            response_data["workshop3"]["final_recommendations"] = [
                {
                    "name_en": f"#{s['色号']}", 
                    "name_cn": str(s.get('昵称', '暂无昵称')), # 🚀 修改为读取昵称
                    "series": str(s.get('产品系列', '经典系列')),   # 🚀 新增系列字段
                    "price": str(s.get('价格', 270)), 
                    "buy_link": str(s.get('购买链接', '#')), 
                    "is_new": bool(s.get('是否新品') == True or str(s.get('是否新品')).strip() == '是'),
                    "image_url": s.get('image_url', '') 
                } for s in top2
            ]
            response_data["workshop3"]["reply_text"] = final_text
            final_shades_str = " / ".join(str(s["色号"]) for s in top2)

    if poster_path and os.path.exists(poster_path):
        filename = os.path.basename(poster_path)
        
        # 🚀 新增：从环境变量读取当前地址，如果没有配置，则默认使用 localhost
        # 这样在本地跑不会报错，在线上跑也能动态替换
        base_url = os.environ.get("API_BASE_URL", "http://localhost:8000")
        
        # 🚀 修改：用动态的 {base_url} 拼接海报的完整链接
        response_data["workshop3"]["poster_url"] = f"{base_url}/posters/{filename}"

    # ==========================================
    # 终极闭环：云端/本地 隐形埋点
    # ==========================================
    # ==========================================
    # 终极闭环：云端/本地 隐形埋点
    # ==========================================
    try:
        # 🚀 补回这三行：从 response_data 中提取最终结果
        recs = response_data.get("workshop3", {}).get("final_recommendations", [])
        safe_final_shades = " / ".join([str(r.get("name_en", "")) for r in recs]) if recs else "无推荐"
        ai_reply = response_data.get("workshop3", {}).get("reply_text", "")

        new_row = pd.DataFrame([{
            "调用时间": datetime.now().isoformat(), 
            "用户原话": user_input, 
            "意图": intent_type, 
            "提取的原始词": safe_raw_terms, 
            "最终锁定的色号": safe_final_shades, 
            "官方推荐话术": official_pitch,  
            "机器人的回复": ai_reply,
            "人工反馈": "未评级", 
            "消耗的邀请码": invite_code
        }])
        
        if engine:
            new_row.to_sql('history_log', engine, if_exists='append', index=False)
            print("✅ 云数据库埋点写入成功！")
        else:
            history_path = "history_log.csv"
            file_exists = os.path.exists(history_path)
            new_row.to_csv(history_path, mode="a", header=not file_exists, index=False, encoding="utf-8-sig")
            print("✅ 本地 CSV 埋点写入成功！")
    except Exception as e:
        print(f"⚠️ 写入埋点失败: {e}")

    # ==========================================
    # 🌟 业务全部成功跑完，正式扣费并返回！
    # ==========================================
    codes[invite_code] -= 1
    save_codes(codes)
    
    response_data["quota_left"] = codes[invite_code]

    return response_data

# ==========================================
# 其他路由接口 (随机词、Dashboard)
# ==========================================

@app.get("/api/random-prompts")
async def get_random_prompts():
    """动态读取 CSV，生成带有真实商品数据和错别字的随机测试题"""
    try:
        if df_main.empty:
            return {"prompts": ["早泥豆沙和奶油砖橘哪个显白？", "适合早八通勤的口红推荐", "推荐一支适合黄皮的唇釉"]}

        if '已断货' in df_main.columns:
            df_active = df_main[~df_main['已断货'].astype(str).isin(['1', '1.0'])]
        else:
            df_active = df_main
            
        if df_active.empty:
            return {"prompts": ["早泥豆沙和奶油砖橘哪个好？", "适合伪素颜的唇釉", "黄黑皮显白色号推荐"]}
        
        all_scenes = []
        if '场景标签' in df_active.columns:
            for tags in df_active['场景标签'].dropna():
                all_scenes.extend([t.strip() for t in str(tags).split('/') if t.strip()])
        all_scenes = list(set(all_scenes))

        shades_data = df_active.to_dict(orient="records")
        prompts = []

        if all_scenes:
            scene = random.choice(all_scenes)
            scene_templates = [
                f"我想要那种适合{scene}的口红，有推荐的吗？",
                f"有没有什么色号能打造{scene}的感觉？",
                f"救命，明天要{scene}，涂什么颜色的唇釉好？"
            ]
            prompts.append(random.choice(scene_templates))

        if len(shades_data) >= 2:
            sample_shades = random.sample(shades_data, 2)
            shade1, shade2 = sample_shades[0], sample_shades[1]
            name1_en = str(shade1.get('英文色号', ''))
            name1_cn = str(shade1.get('昵称', '')) or str(shade1.get('包装名称', ''))
            name2_en = str(shade2.get('英文色号', ''))
            name2_cn = str(shade2.get('昵称', '')) or str(shade2.get('包装名称', ''))
            
            def make_typo(name):
                if not name or name.lower() == 'nan': return ""
                typos = {"枣": "早", "泥": "泥巴", "橘": "桔", "红": "宏", "粉": "分"}
                typo_name = name
                for k, v in typos.items():
                    if k in typo_name and random.random() > 0.5:
                        typo_name = typo_name.replace(k, v)
                return typo_name

            comp_templates = [
                f"{make_typo(name1_cn)} 和 {make_typo(name2_cn)} 哪个更显白？",
                f"{name1_en} 和 {name2_cn} 我黄皮买哪个好？",
                f"想买 {name1_cn}，但又纠结 {name2_en}，有什么区别？"
            ]
            prompts.extend(random.sample(comp_templates, 2))

        while len(prompts) < 3:
            prompts.append("黄黑皮适合什么色号？")

        random.shuffle(prompts)
        return {"prompts": prompts[:3]}

    except Exception as e:
        print(f"⚠️ 动态提示词生成失败: {e}")
        return {"prompts": ["系统推荐引擎测试中", "请对比两款产品", "场景推荐链路测试"]}


@app.get("/api/dashboard")
async def get_dashboard_data():
    """B端数据大盘接口：带分类色号全量榜单与对话复盘"""
    try:
        # 🚀 1. 优先尝试从云端数据库读取数据
        if engine:
            try:
                df = pd.read_sql("history_log", engine).fillna("无")
            except Exception:
                # 如果连上了数据库，但还没人聊过天（表还不存在），就返回空数据
                return {"total_calls": 0, "intent_distribution": [], "word_cloud": [], "shade_ranking_rec": [], "shade_ranking_comp": [], "recent_records": []}
        
        # 🚀 2. 如果没有配置数据库，退回到读本地 CSV 的逻辑
        else:
            history_path = "history_log.csv"
            if not os.path.exists(history_path):
                return {"total_calls": 0, "intent_distribution": [], "word_cloud": [], "shade_ranking_rec": [], "shade_ranking_comp": [], "recent_records": []}
            df = pd.read_csv(history_path, encoding="utf-8-sig").fillna("无")

        total_calls = len(df)

        # 👇 -------- 下面的数据统计逻辑完全不需要动！照常运行 -------- 👇
        if "官方推荐话术" not in df.columns:
            df["官方推荐话术"] = "缺失基准数据"

        intent_counts = df["意图"].value_counts().to_dict()
        intent_distribution = [
            {"name": "场景A：颜色推荐", "value": intent_counts.get("推荐", 0), "color": "bg-rose-500"},
            {"name": "场景B：色号对比", "value": intent_counts.get("对比", 0), "color": "bg-cyan-500"}
        ]

        words = []
        for terms in df["提取的原始词"]:
            for word in str(terms).split("/"):
                w = word.strip()
                if w and w not in ["无", "未指定", "nan"]: words.append(w)
        
        word_counts = Counter(words).most_common(20)
        max_count = word_counts[0][1] if word_counts else 1
        word_cloud = [{"text": w, "count": c, "size": 12 + (c / max_count) * 20} for w, c in word_counts]

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
        
        shade_ranking_rec = [{"name": w, "count": c} for w, c in Counter(rec_list).most_common()]
        shade_ranking_comp = [{"name": w, "count": c} for w, c in Counter(comp_list).most_common()]

        recent_records = df.tail(100).iloc[::-1].to_dict(orient="records")

        return {
            "total_calls": total_calls,
            "intent_distribution": intent_distribution,
            "word_cloud": word_cloud,
            "shade_ranking_rec": shade_ranking_rec, 
            "shade_ranking_comp": shade_ranking_comp, 
            "recent_records": recent_records
        }
    except Exception as e:
        return {"error": str(e)}

class FeedbackRequest(BaseModel):
    timestamp: str
    feedback: str

@app.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest):
    """B端人工打标接口"""
    try:
        # 🚀 1. 优先尝试写入云端数据库
        if engine:
            # 使用 SQL 语句精准更新那一条记录的“人工反馈”状态
            with engine.begin() as conn:
                conn.execute(
                    text("UPDATE history_log SET 人工反馈 = :fb WHERE 调用时间 = :ts"), 
                    {"fb": req.feedback, "ts": req.timestamp}
                )
            return {"success": True}
            
        # 🚀 2. 退回到写本地 CSV 的逻辑
        else:
            history_path = "history_log.csv"
            df = pd.read_csv(history_path, encoding="utf-8-sig")
            df.loc[df['调用时间'] == req.timestamp, '人工反馈'] = req.feedback
            df.to_csv(history_path, index=False, encoding="utf-8-sig")
            return {"success": True}
    except Exception as e:
        return {"error": str(e)}

# 🌟 后台接口 1：查看所有密码
@app.get("/api/admin/codes")
async def get_all_codes():
    return get_codes()

# 🌟 后台接口 2：生成新密码
@app.post("/api/admin/generate")
async def generate_new_codes():
    codes = get_codes()
    for _ in range(20):
        new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        codes[new_code] = 10
    save_codes(codes)
    return {"message": "成功生成 20 个新密码！", "codes": codes}