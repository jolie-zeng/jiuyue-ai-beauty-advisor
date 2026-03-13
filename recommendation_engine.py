import pandas as pd
import random
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv() # 自动读取 .env 文件里的密码

# 🌟 初始化大模型（用于标签全部失效时的兜底阅读理解）
client = OpenAI(
    api_key=os.environ.get("ALIYUN_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)


def llm_fallback_selector(user_input, candidate_df):
    """当标签漏斗失效时，让大模型直接阅读官方话术来挑色号"""
    print("\n🔀 触发 AI 兜底机制：标签未命中，正在阅读官方话术进行语义匹配...")
    
    candidates_info = ""
    for _, row in candidate_df.iterrows():
        shade = str(row['英文色号'])
        desc = str(row['官方推荐话术'])
        candidates_info += f"- 色号: {shade}, 官方介绍: {desc}\n"
        
    system_prompt = f"""
    你是一个专业的美妆导购。用户的提问比较特殊，未命中预设标签。
    请阅读以下【候选商品池】的官方介绍，选出最符合用户需求的 2 支色号。
    
    【候选商品池】：
    {candidates_info}
    
    输出要求：
    严格输出 JSON 格式，包含一个键 "推荐色号"，值为一个列表。
    例如：{{"推荐色号": ["SPEAK UP", "TAUPE"]}}
    """
    
    try:
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"用户提问：{user_input}"}
            ],
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        picked_shades = result.get("推荐色号", [])
        print(f"🧠 AI 兜底匹配成功，选择了: {picked_shades}")
        return picked_shades
    except Exception as e:
        print(f"❌ 兜底机制报错: {e}")
        return []

def get_best_shades(intent_dict, user_input, csv_path="lips_colors_match.csv"):
    print("\n⚙️ 第二车间启动：开始执行全栈推荐漏斗...")
    
    if not os.path.exists(csv_path):
        print(f"❌ 找不到主数据表格: {csv_path}")
        return []

    try:
        df = pd.read_csv(csv_path, encoding='utf-8-sig')
        
        # ---------------------------------------------------------
        # 漏斗 1：物理隔离 (排除断货和无正装)
        # ---------------------------------------------------------
        df['已断货'] = df['已断货'].fillna(0)
        df['无正装售卖'] = df['无正装售卖'].fillna(0)
        df = df[(df['已断货'] != 1) & (df['无正装售卖'] != 1)]
        
        if df.empty:
            return [{"错误": "所有商品已断货"}]

        # ---------------------------------------------------------
        # 漏斗 2：产品词精准框定
        # ---------------------------------------------------------
        prod_word = intent_dict.get('产品词')
        if prod_word and prod_word != 'null' and prod_word is not None:
            mask = (df['产品大类'] == prod_word) | \
                   (df['产品品类'] == prod_word) | \
                   (df['产品系列'] == prod_word)
            
            filtered_df = df[mask]
            if not filtered_df.empty:
                df = filtered_df
        # 💡 如果为空或未找到，代码不做任何过滤，直接进入下方算分（全盘放行）

        # ---------------------------------------------------------
        # 漏斗 3：计算场景标签命中率
        # ---------------------------------------------------------
        tags_list = intent_dict.get('场景标签', [])
        
        def count_tag_hits(row_tags):
            if pd.isna(row_tags): return 0
            row_tags_str = str(row_tags)
            return sum(1 for tag in tags_list if tag in row_tags_str)
            
        df['命中次数'] = df['场景标签'].apply(count_tag_hits)
        
        # ---------------------------------------------------------
        # 漏斗 4：智能分流 (AI 兜底评分)
        # ---------------------------------------------------------
        df['AI兜底得分'] = 0 
        if df['命中次数'].max() == 0 and len(df) > 0:
            fallback_shades = llm_fallback_selector(user_input, df)
            def assign_fallback_score(shade):
                if shade in fallback_shades:
                    return 2 if fallback_shades.index(shade) == 0 else 1 
                return 0
            df['AI兜底得分'] = df['英文色号'].apply(assign_fallback_score)

        # ---------------------------------------------------------
        # 🌟 漏斗 5：大一统排序（加入产品系列优先级）
        # ---------------------------------------------------------
        # 定义品牌品类战略优先级映射字典 (得分越高优先级越大)
        series_priority_map = {
            '丝绒唇釉': 9,
            '水雾唇釉': 8, '水雾唇露': 8, '水雾唇泥': 8, # 兼容可能的别名写法
            '云朵唇釉': 7,
            '慕斯唇釉': 6,
            '水光唇釉': 5,
            '透明口红': 4,
            '水唇釉': 3,
            '哑光口红': 2,
            '烟管口红': 1
        }
        df['系列优先级得分'] = df['产品系列'].map(series_priority_map).fillna(0)

        weight_map = {'高': 3, '中': 2, '低': 1}
        df['新色号得分'] = df.get('新色号', pd.Series()).map(weight_map).fillna(0) 
        df['随机种子'] = [random.random() for _ in range(len(df))]
        
        # 🏆 终极排序优先级：AI兜底 > 命中次数 > 系列优先级(破局者) > 随机数
        df = df.sort_values(
            by=['AI兜底得分', '命中次数', '系列优先级得分', '随机种子'], 
            ascending=[False, False, False, False]
        )

        # ---------------------------------------------------------
        # 漏斗 6：强制推新机制 (提取最终 2 支色号)
        # ---------------------------------------------------------
        final_shades = []
        
        # 新品排序时，同样遵循同分看优先级的策略
        new_items = df[df['新色号得分'] > 0].sort_values(
            by=['新色号得分', 'AI兜底得分', '命中次数', '系列优先级得分', '随机种子'], 
            ascending=[False, False, False, False, False]
        )
        regular_items = df[df['新色号得分'] == 0]
        
        if not new_items.empty:
            top_new = new_items.iloc[0].copy()
            top_new['是否强制推新'] = True
            final_shades.append(top_new)
            
            if not regular_items.empty:
                final_shades.append(regular_items.iloc[0].copy())
        else:
            if len(df) >= 2:
                final_shades.append(df.iloc[0].copy())
                final_shades.append(df.iloc[1].copy())
            elif len(df) == 1:
                final_shades.append(df.iloc[0].copy())

        # ---------------------------------------------------------
        # 组装交付数据
        # ---------------------------------------------------------
        result_list = []
        for index, item in enumerate(final_shades):
            shade_eng = str(item.get('英文色号', ''))
            series_name = str(item.get('产品系列', '未知系列'))
            is_new = item.get('是否强制推新', False)
            copywriting = str(item.get('官方推荐话术', '（暂无官方推荐话术）'))
            hit_score = item['命中次数'] if item['AI兜底得分'] == 0 else "AI语义匹配"
            
            img_url = str(item.get('image_url', ''))
            if img_url == 'nan' or pd.isna(item.get('image_url')):
                img_url = ""
                
            # 🚀 修复核心：从 df 提取时，彻底补齐遗漏的“昵称”、“价格”、“购买链接”！
            chinese_name = str(item.get('昵称', ''))
            if chinese_name == 'nan' or pd.isna(item.get('昵称')): chinese_name = ''
            
            price = item.get('价格', 270)
            buy_link = str(item.get('购买链接', '#'))
            if buy_link == 'nan' or pd.isna(item.get('购买链接')): buy_link = '#'
            
            result_list.append({
                "色号": shade_eng,
                "昵称": chinese_name,    # 👈 补装上车：中文昵称
                "产品系列": series_name,     # 👈 补装上车：产品系列
                "价格": price,           # 👈 补装上车：商品价格
                "购买链接": buy_link,     # 👈 补装上车：购买链接
                "是否新品": is_new,
                "命中状态": hit_score,
                "官方话术": copywriting,
                "image_url": img_url     
            })
            
            print(f"🎯 选定 No.{index+1}: #{shade_eng} [{series_name}] (图片: {'✅' if img_url else '❌'})")

        return result_list

    except Exception as e:
        print(f"❌ 第二车间严重报错: {e}")
        return []

if __name__ == "__main__":
    # 测试一下这种极限情况：只给了场景，不给产品，全场同分时看系列优先级
    user_query = "适合温柔知性，推荐哪个"
    mock_intent = {
    "产品词": "null", 
    "场景标签": ["温柔","知性"] 
    }
    results = get_best_shades(mock_intent, user_query)
    print("返回结果：", json.dumps(results, indent=2, ensure_ascii=False))