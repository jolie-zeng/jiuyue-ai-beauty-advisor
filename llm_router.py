import pandas as pd
import json
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv() # 自动读取 .env 文件里的密码

client = OpenAI(
    api_key=os.environ.get("ALIYUN_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

def extract_user_intent(user_text, aliases_file="product_aliases.xlsx"):
    print("\n🏭 第一车间启动：智能大脑正在判断用户意图...")
    
    # 1. 尝试读取产品花名册 (用于推荐场景的实体对齐)
    aliases_text = ""
    try:
        df_aliases = pd.read_excel(aliases_file)
        for _, row in df_aliases.iterrows():
            official = row['标准产品词']
            slangs = row['民间黑话']
            aliases_text += f"- 官方: {official} | 黑话: {slangs}\n"
    except Exception as e:
        print(f"⚠️ 未找到或无法读取 {aliases_file}，将不使用产品黑话字典。报错: {e}")

    # 2. 🌟 核心升级：增加双路意图分流提示词
    system_prompt = f"""
    你是一个专业的智能美妆客服大脑。你需要判断用户的【真实意图】并提取关键信息。

    用户的意图只有两种：
    1. 【推荐】(RECOMMEND)：用户没有明确指定2个具体的色号，而是描述自己的肤色、场景或模糊需求（例如：“黄黑皮求推荐”，“素颜涂什么好”，“有没有小银管”）。
    2. 【对比】(COMPARE)：用户明确提到了2个（或以上）特定的色号、昵称或别名，想要对比它们（例如：“SPEAK TO ME和TAUPE哪个显白？”，“枣泥豆沙和另外那个干枯玫瑰有什么区别？”）。

    根据判断结果，严格按以下 JSON 格式输出：
    
    如果意图是【推荐】：
    {{
        "意图": "推荐", 
        "产品词": "提取到的官方大类/品类/系列(参考下方词典，若无明确指向则填null)", 
        "场景标签": ["提取出的场景词1", "提取出的场景词2"]
    }}

    如果意图是【对比】：
    {{
        "意图": "对比", 
        "提及色号": ["用户说的原词1", "用户说的原词2"]
    }}

    ⚠️ 注意：在【对比】模式下，用户可能使用的是错别字或别名（如"早泥豆沙"、"speaktme"），你**不需要纠正它**，直接原封不动地提取用户原话中的提及词即可！（我们的下游系统会负责精准纠正）。

    【推荐模式参考词典】：
    {aliases_text}
    """

    try:
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            response_format={"type": "json_object"}
        )
        
        intent_dict = json.loads(response.choices[0].message.content)
        
        # 打印一下大模型判断的结果
        print(f"🧠 大模型判定意图为：【{intent_dict.get('意图', '未知')}】")
        print(f"📦 提取到的核心数据包：{intent_dict}")
        
        return intent_dict

    except Exception as e:
        print(f"❌ 第一车间意图提取失败: {e}")
        return None

if __name__ == "__main__":
    # 🧪 测试路线 A：推荐导向
    test_query_1 = "我黄黑皮，想找个素颜能涂的小银管"
    print("\n--- 测试 1：推荐诉求 ---")
    extract_user_intent(test_query_1)
    
    # 🧪 测试路线 B：对比导向 (带有错别字和黑话)
    test_query_2 = "请问早泥豆沙和那个 speaktme 哪个更适合上班涂呀？"
    print("\n--- 测试 2：对比诉求 ---")
    extract_user_intent(test_query_2)