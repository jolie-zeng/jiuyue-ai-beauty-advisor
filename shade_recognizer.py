import pandas as pd
import os
import json
from thefuzz import process
from pypinyin import lazy_pinyin
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv() # 自动读取 .env 文件里的密码

class ShadeRecognizer:
    def __init__(self, csv_path="lips_colors_match.csv"):
        self.client = OpenAI(
            api_key=os.environ.get("ALIYUN_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        self.csv_path = csv_path
        self.shade_dict = self._build_dynamic_dict()

    def _build_dynamic_dict(self):
        print("📚 正在构建动态色号词典...")
        shade_dict = {}
        if not os.path.exists(self.csv_path):
            print(f"❌ 找不到文件 {self.csv_path}")
            return shade_dict
            
        try:
            df = pd.read_csv(self.csv_path, encoding='utf-8-sig')
            if '英文色号' not in df.columns:
                df = pd.read_csv(self.csv_path, header=1, encoding='utf-8-sig')

            for _, row in df.iterrows():
                eng_name = str(row.get('英文色号', '')).strip().upper()
                if not eng_name or eng_name == 'NAN': continue
                
                aliases = []
                nickname = str(row.get('昵称', '')).strip()
                pkg_name = str(row.get('包装名称', '')).strip()
                
                if nickname and nickname != 'nan': aliases.append(nickname)
                if pkg_name and pkg_name != 'nan': aliases.append(pkg_name)
                
                shade_dict[eng_name] = {
                    "英文名": eng_name,
                    "中文别名": aliases,
                    "中文别名拼音": [''.join(lazy_pinyin(alias)) for alias in aliases]
                }
            print(f"✅ 动态词典构建完成！共收录 {len(shade_dict)} 支色号。\n")
            return shade_dict
        except Exception as e:
            print(f"❌ 词典构建失败: {e}")
            return {}

    def extract_shade(self, user_input_shade):
        user_input_shade = str(user_input_shade).strip().upper()
        print(f"▶️ 开始解析目标词汇: 【{user_input_shade}】")
        
        # ---------------------------------------------------------
        # 🗡️ 武器一：英文模糊匹配
        # ---------------------------------------------------------
        all_eng_names = list(self.shade_dict.keys())
        best_match, score = process.extractOne(user_input_shade, all_eng_names)
        
        print(f"  ├─ [武器1侦测] 模糊匹配最高分: #{best_match} (相似度: {score}%)")
        
        if score >= 85: 
            print(f"  └─ 🎯 [武器1-命中] 相似度达标，直接纠正为: #{best_match}\n")
            return best_match
        else:
            print(f"  ├─ ❌ 相似度低于 85%，放弃武器 1。")

        # ---------------------------------------------------------
        # 🗡️ 武器二：中文拼音匹配
        # ---------------------------------------------------------
        input_pinyin = ''.join(lazy_pinyin(user_input_shade))
        print(f"  ├─ [武器2侦测] 提取输入拼音: '{input_pinyin}'")
        
        for eng_name, info in self.shade_dict.items():
            for idx, alias_pinyin in enumerate(info["中文别名拼音"]):
                if input_pinyin == alias_pinyin:
                    matched_alias = info['中文别名'][idx]
                    print(f"  └─ 🎯 [武器2-命中] 拼音完美匹配！对应的官方别名是 '{matched_alias}'，识别为: #{eng_name}\n")
                    return eng_name
        print(f"  ├─ ❌ 拼音库未找到匹配项，放弃武器 2。")

        # ---------------------------------------------------------
        # 🗡️ 武器三：LLM 上下文推理
        # ---------------------------------------------------------
        print(f"  ├─ ⚠️ 启动 [武器3-LLM推理]...")
        
        reference_list = ""
        for eng_name, info in self.shade_dict.items():
            if info['中文别名']: # 只把有别名的发给大模型，节省 token 和时间
                reference_list += f"- 官方英文: {eng_name}, 官方别名: {info['中文别名']}\n"
            
        system_prompt = f"""
        你是一个拥有超强推理能力的美妆色号解码器。
        用户输入了一个极其模糊的色号黑话或描述："{user_input_shade}"。
        
        请参考以下【品牌色号全家桶名单】，推理出用户大概率指的是哪一支色号：
        {reference_list}
        
        要求：
        1. 你必须给出推理过程，解释你是如何根据别名或语境对应上的。
        2. 严格输出 JSON 格式，包含 "推理过程" 和 "官方英文" 两个字段。
        3. 如果实在离谱，"官方英文" 输出 "null"。
        例如：{{"推理过程": "名单中 SMOKED ROSE 的别名是干枯玫瑰色，与用户输入高度吻合。", "官方英文": "SMOKED ROSE"}}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="qwen-plus",
                messages=[{"role": "system", "content": system_prompt}],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            
            # 💡 提取大模型的思考过程
            reasoning = result.get("推理过程", "未提供推理过程")
            inferred_shade = result.get("官方英文")
            
            print(f"  ├─ 🧠 [LLM 思考日志]: {reasoning}")
            
            if inferred_shade and inferred_shade != "null" and inferred_shade in all_eng_names:
                print(f"  └─ 🎯 [武器3-命中] 大模型推理成功，最终锁定为: #{inferred_shade}\n")
                return inferred_shade
            else:
                print(f"  └─ ❌ [武器3] 尽力了，无法识别该色号。\n")
                return None
        except Exception as e:
            print(f"  └─ ❌ LLM 调用失败: {e}\n")
            return None

if __name__ == "__main__":
    recognizer = ShadeRecognizer()
    
    print("--- 开始透明化极限测试 ---")
    
    # 1. 英文手误测试
    recognizer.extract_shade("speaktme") 
    
    # 2. 中文同音错别字测试
    recognizer.extract_shade("早泥豆沙") 
    
    # 3. 模糊描述测试
    recognizer.extract_shade("那个什么干枯玫瑰色")