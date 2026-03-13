import os
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO

# 🌟 终极防弹锁 1：强制把工作目录绑定到这个代码文件所在的真实文件夹
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

def create_adaptive_poster(shade1_input, shade2_input, 
                           csv_path="lips_colors_match.csv", 
                           output_dir="final_posters"):
    
    # 标准化输入
    shade1_key = shade1_input.strip().upper().replace(' ', '_').replace('-', '_')
    shade2_key = shade2_input.strip().upper().replace(' ', '_').replace('-', '_')
    shade1_display = shade1_key.replace('_', ' ')
    shade2_display = shade2_key.replace('_', ' ')
    
    print(f"🎨 正在为你生成自适应推荐对比图: {shade1_display} vs {shade2_display}...")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # --- 1. 读取表格获取昵称 和 阿里云 OSS 链接 (🌟 新增逻辑) ---
    nicknames = {shade1_key: "", shade2_key: ""}
    image_urls = {shade1_key: "", shade2_key: ""}  # 专门用来存抓取到的图片链接
    
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path, encoding='utf-8-sig')
            for index, row in df.iterrows():
                raw_eng_name = str(row.get('英文色号', '')).strip().upper()
                eng_name_key = raw_eng_name.replace(' ', '_').replace('-', '_')
                
                if eng_name_key in nicknames:
                    # 获取中文昵称
                    nickname = str(row.get('昵称', '')).strip()
                    if nickname and nickname != 'nan':
                        nicknames[eng_name_key] = nickname
                    
                    # 获取新增的云端图片链接
                    img_url = str(row.get('image_url', '')).strip()
                    if img_url and img_url != 'nan':
                        image_urls[eng_name_key] = img_url
                        
        except Exception as e:
            print(f"⚠️ 读取 CSV 失败，将只显示英文名。错误: {e}")
    else:
        print(f"⚠️ 找不到表格文件: {csv_path}。请检查是否和本代码在同一文件夹。")

    # --- 2. 内存流抓取云端图片 (🌟 大厂架构：彻底摒弃本地图片) ---
    def download_and_load_image(url):
        if not url or not str(url).startswith('http'):
            print(f"⚠️ 无效的图片链接: {url}")
            return None
        try:
            print(f"🌐 正在极速拉取云端图片: {url}")
            # 发起网络请求，设置超时防止卡死
            response = requests.get(url, timeout=10)
            response.raise_for_status() # 检查链接是否 404
            # 将二进制流直接喂给 Pillow 并在内存中转为 RGB
            return Image.open(BytesIO(response.content)).convert("RGB")
        except Exception as e:
            print(f"❌ 云端图下载失败: {e}")
            return None

    img1 = download_and_load_image(image_urls.get(shade1_key))
    img2 = download_and_load_image(image_urls.get(shade2_key))

    if not img1 or not img2:
        print(f"⚠️ 云端图素材缺失，跳过海报合成，交由前端卡片兜底。")
        return None  # 👈 明确返回 None，让系统知道没图

    w1, h1 = img1.size
    w2, h2 = img2.size
    max_h = max(h1, h2)

    try:
        # --- 3. 美学布局参数配置 ---
        padding_top = 10        
        padding_bottom = 80     
        padding_side = 10       
        gap = 10                
        bg_color = "#E8F1F5"    
        
        text_color_eng = "#3E2723"  
        text_color_chn = "#795548"  

        # --- 4. 计算画布大小 ---
        canvas_width = padding_side + w1 + gap + w2 + padding_side
        canvas_height = padding_top + max_h + padding_bottom
        
        canvas = Image.new('RGB', (canvas_width, canvas_height), color=bg_color)
        draw = ImageDraw.Draw(canvas)

        # --- 5. 粘贴图片 ---
        x1, y1 = padding_side, padding_top
        canvas.paste(img1, (x1, y1))
        
        x2, y2 = padding_side + w1 + gap, padding_top
        canvas.paste(img2, (x2, y2))

        # --- 6. 排版文字 ---
        try:
            # 兼容 Mac 的字体路径，如果线上找不到会用默认字体兜底
            font_path = "/System/Library/Fonts/PingFang.ttc"
            font_eng = ImageFont.truetype(font_path, 25) 
            font_chn = ImageFont.truetype(font_path, 20) 
        except:
            font_eng = font_chn = ImageFont.load_default()

        def draw_centered_text(text, center_x, start_y, font, fill_color):
            if hasattr(font, 'getbbox'):
                text_width = font.getbbox(text)[2] - font.getbbox(text)[0]
            else:
                text_width = font.getsize(text)[0]
            text_x = center_x - text_width // 2
            draw.text((text_x, start_y), text, font=font, fill=fill_color)

        text_start_y = padding_top + max_h + 15
        text_gap_y = 35 

        # 图 1 文字 
        center_x1 = x1 + w1 // 2 
        draw_centered_text(f"#{shade1_display}", center_x1, text_start_y, font_eng, text_color_eng)
        if nicknames[shade1_key]:
            draw_centered_text(f"「{nicknames[shade1_key]}」", center_x1, text_start_y + text_gap_y, font_chn, text_color_chn)

        # 图 2 文字 
        center_x2 = x2 + w2 // 2 
        draw_centered_text(f"#{shade2_display}", center_x2, text_start_y, font_eng, text_color_eng)
        if nicknames[shade2_key]:
            draw_centered_text(f"「{nicknames[shade2_key]}」", center_x2, text_start_y + text_gap_y, font_chn, text_color_chn)

        # --- 7. 保存最终海报 ---
        output_name = f"ADAPTIVE_POSTER_{shade1_key}_vs_{shade2_key}.jpg"
        output_path = os.path.join(output_dir, output_name)
        canvas.save(output_path, quality=95)
        print(f"✅ 云端海报合成成功！快去看看成品: {output_name}")
        
        return output_path # 加上 return 确保路由能拿到文件路径

    except Exception as e:
        print(f"❌ 生成过程中报错了: {e}")
        return None

if __name__ == "__main__":
    # 本地跑一下测试看看！把你表格里实际有图的两个色号填进来测试
    create_adaptive_poster("VINTAGE BOUQUET", "TAUPE")