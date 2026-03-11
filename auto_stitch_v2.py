import os
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

# 🌟 终极防弹锁 1：强制把工作目录绑定到这个代码文件所在的真实文件夹！
# 这样无论你的终端在哪，它都能精准找到同级别的表格和图片！
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

def create_adaptive_poster(shade1_input, shade2_input, 
                           img_dir="standard_lips", 
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

    # --- 1. 读取表格获取昵称 ---
    nicknames = {shade1_key: "", shade2_key: ""}
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path, encoding='utf-8-sig')
            for index, row in df.iterrows():
                raw_eng_name = str(row.get('英文色号', '')).strip().upper()
                eng_name_key = raw_eng_name.replace(' ', '_').replace('-', '_')
                
                if eng_name_key in nicknames:
                    nickname = str(row.get('昵称', '')).strip()
                    if nickname and nickname != 'nan':
                        nicknames[eng_name_key] = nickname
        except Exception as e:
            print(f"⚠️ 读取 CSV 失败，将只显示英文名。错误: {e}")
    else:
        print(f"⚠️ 找不到表格文件: {csv_path}。请检查是否和本代码在同一文件夹。")

    # --- 2. 寻找并读取图片原始尺寸 (🌟 终极防弹锁 2：全能无视大小写雷达) ---
    def find_and_load_image(shade_key):
        if not os.path.exists(img_dir):
            print(f"⚠️ 找不到图片文件夹: {img_dir}")
            return None
            
        valid_exts = ['.jpg', '.png', '.jpeg']
        # 扫描文件夹里的所有文件
        for file in os.listdir(img_dir):
            name, ext = os.path.splitext(file)
            # 无视所有大小写差异！
            if name.upper() == shade_key.upper() and ext.lower() in valid_exts:
                target_path = os.path.join(img_dir, file)
                return Image.open(target_path).convert("RGB")
        return None

    img1 = find_and_load_image(shade1_key)
    img2 = find_and_load_image(shade2_key)

    if not img1 or not img2:
        print(f"⚠️ 找不到对应的原图素材，跳过海报合成，交由前端卡片兜底。")
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
        print(f"✅ 自适应拼接成功！快去看看成品: {output_name}")

    except Exception as e:
        print(f"❌ 生成过程中报错了: {e}")

if __name__ == "__main__":
    create_adaptive_poster("VINTAGE BOUQUET", "TAUPE")