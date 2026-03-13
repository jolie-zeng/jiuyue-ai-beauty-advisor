import os
# 🌟 引入咱们最开始修好的底层拼图引擎
from auto_stitch_v2 import create_adaptive_poster
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv() # 自动读取 .env 文件里的密码

client = OpenAI(
    api_key=os.environ.get("ALIYUN_API_KEY"), 
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

def generate_final_response(user_input, recommended_shades, output_dir="final_posters"):
    print("\n💄 第三车间启动：开始生成高情商话术与双拼海报...")
    
    if not recommended_shades or len(recommended_shades) < 2:
        print("⚠️ 警告：接收到的推荐色号不足 2 支，无法执行完美的对比流转。")
        return "不好意思，没能为您找到合适的色号呢。", None

    shade1_info = recommended_shades[0]
    shade2_info = recommended_shades[1]

    shade1_name = shade1_info['色号']
    shade2_name = shade2_info['色号']
    
    # ---------------------------------------------------------
    # 环节 1：大模型化身“金牌柜姐”，润色最终话术
    # ---------------------------------------------------------
    def format_shade_material(shade_info):
        """将冰冷的数据转化为大模型容易理解的素材格式"""
        new_tag = "【NEW 新品】" if shade_info.get('是否新品') else ""
        return f"- {new_tag} #{shade_info['色号']} ({shade_info.get('系列', '未知')})：{shade_info.get('官方话术', '')}"

    materials = f"{format_shade_material(shade1_info)}\n{format_shade_material(shade2_info)}"
    
    system_prompt = f"""
    你是一个拥有极高审美、极具亲和力的美妆品牌金牌客服。你需要用“小红书爆款风格”来回复消费者。
    用户刚才的需求是："{user_input}"
    
    我们的系统为她匹配了以下 2 支色号的【官方档案】：
    {materials}
    
    【你的绝对底线与规则】：
    1. 【称呼红线】：必须用“哈喽～”或“亲爱的～”开头，绝不能使用“姐妹”这个词！语气要保持和蔼可亲。
    2. 【字数红线】：所有回复加起来必须严格控制在 120 字以内！极其简明扼要，绝不废话！
    3. 【内容红线】：请精准提炼官方话术中最核心的卖点。绝对不能瞎编资料里没有的功效或质地，绝口不提任何折扣/促销活动信息。
    4. 【排版红线】：绝对不能把所有字挤成一段！必须严格按照下方模版分行排版，让消费者一眼看清。
    
    请严格参考以下模版结构进行回复（替换括号内内容）：
    
    亲爱的～ (结合她需求的一句贴心回应)
    ✨ [若为新品请加上【NEW】] #色号名 (产品系列)：(15字提炼核心卖点)
    💄 [若为新品请加上【NEW】] #色号名 (产品系列)：(15字提炼核心卖点)
    
    💡 选购小贴士：(1句话精准建议)
    5. 结尾不需要引导语，系统会自动配图。
    """

    try:
        print("🧠 大模型正在疯狂码字、注入情绪价值...")
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": system_prompt}
            ]
        )
        final_text = response.choices[0].message.content
        print("\n💬 最终生成话术：\n", final_text)
    except Exception as e:
        print(f"❌ 话术生成失败: {e}")
        final_text = "这是为您推荐的绝美色号，请参考下方的对比图哦～👇"

    # ---------------------------------------------------------
    # 环节 2：唤醒海报工厂，自动生成双拼图
    # ---------------------------------------------------------
    print(f"\n🖼️ 正在呼叫底层拼图引擎生成海报: {shade1_name} vs {shade2_name} ...")
    
    s1_clean = shade1_name.strip().upper().replace(' ', '_').replace('-', '_')
    s2_clean = shade2_name.strip().upper().replace(' ', '_').replace('-', '_')
    poster_name = f"ADAPTIVE_POSTER_{s1_clean}_vs_{s2_clean}.jpg"
    poster_path = os.path.join(output_dir, poster_name)
    
    try:
        # 🌟 修复核心：彻底移除 img_dir 参数，只保留需要的！
        create_adaptive_poster(shade1_name, shade2_name, output_dir=output_dir)
        if os.path.exists(poster_path):
            print(f"✅ 海报合成大功告成！文件路径: {poster_path}")
        else:
            print(f"⚠️ 拼图代码已执行，但似乎没有生成文件。")
            poster_path = None
    except Exception as e:
        print(f"❌ 拼图引擎调用失败: {e}")
        poster_path = None

    return final_text, poster_path

def generate_comparison_response(user_input, shade1_info, shade2_info, output_dir="final_posters"):
    print("\n⚖️ 第三车间(对比模式)启动：开始生成客观对比评测与双拼海报...")
    
    shade1_name = shade1_info['色号']
    shade2_name = shade2_info['色号']
    
    materials = f"""
    - #{shade1_name} ({shade1_info.get('系列', '未知')}): {shade1_info.get('官方话术', '')}
    - #{shade2_name} ({shade2_info.get('系列', '未知')}): {shade2_info.get('官方话术', '')}
    """
    
    system_prompt = f"""
    你是一个拥有极高审美、极具亲和力的美妆品牌金牌客服。
    用户正在纠结两支色号，她的原话是："{user_input}"
    请根据以下两支色号的【官方档案】，为她做一个客观、专业的对比评测，并直接回答她的疑问（例如谁更显白、谁适合上班等）：
    {materials}
    本次对比的标准色号为：#{shade1_name} 和 #{shade2_name}
    
    【核心任务】：基于档案做客观对比，直接回答她的疑问。
    
    【排版与内容强制要求】（必须严格套用以下格式）：
    亲爱的～ (结合她需求的一句贴心回应，例如：#{shade1_name} 更显白哦！)。
    💄 #{shade1_name}：(提炼它的核心氛围/卖点，限 20 个字内)
    💄 #{shade2_name}：(提炼它的核心氛围/卖点，限 20 个字内)
    💡 选购建议：(结合用户的语境给出最终建议，限 40 个字内)
    
    【你的绝对底线（违规将被系统判定失败）】：
    1. 【正名红线】：绝不能重复用户原话里的错别字或野生黑话！回答时必须且只能使用官方标准色号名（即 #{shade1_name} 或 #{shade2_name}）！
    2. 称呼只能用“哈喽～”或“亲爱的～”，绝禁使用“姐妹”！
    3. 绝不瞎编档案外的信息，绝不提折扣。结尾不需要任何引导语。
    4. ！！！最高字数红线！！！必须极致压缩修饰词，保持像电报一样精简！总体输出绝对不允许超过 4 行！
    """

    try:
        print("🧠 大模型正在撰写对比评测...")
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[{"role": "system", "content": system_prompt}]
        )
        final_text = response.choices[0].message.content
        print("\n💬 最终生成话术：\n", final_text)
    except Exception as e:
        print(f"❌ 话术生成失败: {e}")
        final_text = "这是为您生成的色号对比，请参考下方的图片哦～👇"

    # --- 呼叫底层拼图引擎生成海报 ---
    print(f"\n🖼️ 正在呼叫底层拼图引擎生成海报: {shade1_name} vs {shade2_name} ...")
    
    s1_clean = shade1_name.strip().upper().replace(' ', '_').replace('-', '_')
    s2_clean = shade2_name.strip().upper().replace(' ', '_').replace('-', '_')
    poster_name = f"ADAPTIVE_POSTER_{s1_clean}_vs_{s2_clean}.jpg"
    poster_path = os.path.join(output_dir, poster_name)
    
    try:
        # 🌟 修复核心：彻底移除 img_dir 参数！
        create_adaptive_poster(shade1_name, shade2_name, output_dir=output_dir)
        if not os.path.exists(poster_path):
            poster_path = None
    except Exception as e:
        print(f"❌ 拼图引擎调用失败: {e}")
        poster_path = None

    return final_text, poster_path