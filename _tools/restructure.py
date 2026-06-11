import re

with open('e:/设计技术4/Final Project/webapp/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Page 3 Path & viewBox
new_path = "M 1100 150 Q 220 50 -670 180 Q 220 90 1100 210 Q 220 130 -670 240 Q 220 170 1100 270 Q 350 200 -400 290 Q -180 350 50 610 Q 75 580 100 618 Q 117 598 135 624 Q 145 612 155 628 Q 161 620 167 630 Q 170 626 173 632"

html = re.sub(r'viewBox="0 0 430 300"', 'viewBox="0 0 440 852"', html)
html = re.sub(r'd="M 1100 50 Q 215 -50[^"]+"', f'd="{new_path}"', html)

# 2. Page 4 Restructuring
# Let's extract the page-4-content innerHTML to manipulate it carefully
p4_start = html.find('<div class="page-4-content">')
p4_end = html.find('</section>\n        </div>\n    </div>')

if p4_start != -1 and p4_end != -1:
    p4_content = html[p4_start + len('<div class="page-4-content">'):p4_end]
    
    # We will build the new structured p4_content
    # The pure blue background is actually the "sky" or missing?
    # User said "绿色、白色色块从上方降落...形成第四页中的网球场"
    # Actually, Page 4 originally had a `<div style="background-color: white; position: relative; width: 100%; height: 100%">` wrapper!
    # If the white block drops down, it should just be `<div style="position: absolute; background-color: white; width: 440px; height: 339px; top: 0; left: 0;"></div>`
    
    # Let's manually write the structured Page 4
    # The Person SVG group is huge, so let's extract it from the string
    person_start = p4_content.find('<div style="position: absolute; height: 415px; left: 62px; overflow: clip; top: 285px; width: 409px">')
    person_end = p4_content.find('</div>\n      </div>', person_start) + 6
    person_html = p4_content[person_start:person_end]
    
    # Hide the ball from the person HTML
    person_html = person_html.replace('src="assets/page4/ca98e33b952b4a10286112f1205cc241145cc14a.svg"', 'src="assets/page4/ca98e33b952b4a10286112f1205cc241145cc14a.svg" style="display: none;"')
    
    new_p4 = f"""
            <div class="page-4-content">
                <!-- 场景层 -->
                <div class="p4-scenery">
                    <!-- 白色天空块 (0 到 339) -->
                    <div style="position: absolute; background-color: white; width: 440px; height: 339px; left: 0; top: 0;"></div>
                    <!-- 绿色墙壁块 -->
                    <div style="position: absolute; background-color: #2ca867; height: 84px; left: 0; top: 339px; width: 440px"></div>
                    <!-- 球场线 -->
                    <div style="position: absolute; height: 221.65px; left: -30px; top: 421px; width: 500.7px">
                        <img alt="" style="position: absolute; display: block; top: 0; right: 0; bottom: 0; left: 0; max-width: none; width: 100%; height: 100%" src="assets/page4/984db6f96a2d256fa3b36ff3c73c8cf08d2f3ed2.svg" />
                    </div>
                </div>

                <!-- 顶部文本层 -->
                <div class="p4-top-text">
                    <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 75px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 117px; letter-spacing: -0.2px; white-space: nowrap">你用</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 302px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 117px; letter-spacing: -0.2px; white-space: nowrap">的时间经历</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 64px; left: 139.5px; font-style: normal; font-size: 64px; color: black; text-align: center; top: 83px; letter-spacing: -0.64px; white-space: nowrap">66</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 1; left: 214px; font-style: normal; font-size: 32px; color: black; text-align: center; top: 107px; letter-spacing: -0.32px; white-space: nowrap">分钟</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 20px; left: 220.5px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 153px; letter-spacing: -0.2px; white-space: nowrap">热身/截击练习/高压球/综合应用/冷却</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 356px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 185px; letter-spacing: -0.2px; white-space: nowrap">等阶段</p>
                </div>

                <!-- 人物与底部文本层 -->
                <div class="p4-person-and-text">
                    {person_html}
                    
                    <div style="position: absolute; display: contents; left: 55px; font-style: normal; text-align: center; color: white; top: 808px; white-space: nowrap">
                        <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 114.5px; font-size: 20px; top: 818px; letter-spacing: -0.2px">最擅长的仍是</p>
                        <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 243px; font-size: 20px; top: 866px; letter-spacing: -0.2px">和</p>
                        <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 32px; left: 323px; font-size: 32px; top: 856px; letter-spacing: -0.32px">反手捡球</p>
                        <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 32px; left: 244px; font-size: 32px; top: 808px; letter-spacing: -0.32px">正手捡球</p>
                    </div>
                </div>
            </div>
"""
    
    html = html[:p4_start] + new_p4 + html[p4_end:]

with open('e:/设计技术4/Final Project/webapp/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
