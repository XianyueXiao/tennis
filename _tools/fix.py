import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Path in index.html
old_path = 'M 1100 150 Q 220 50 -670 180 Q 220 90 1100 210 Q 220 130 -670 240 Q 220 170 1100 270 Q 350 200 -400 290 Q -180 350 50 610 Q 75 580 100 618 Q 117 598 135 624 Q 145 612 155 628 Q 161 620 167 630 Q 170 626 173 632'
new_path = 'M 1100 350 Q 220 250 -670 380 Q 220 290 1100 410 Q 220 330 -670 440 Q 220 370 1100 470 Q 350 400 -400 490 Q -180 550 50 610 Q 75 580 100 618 Q 117 598 135 624 Q 145 612 155 628 Q 161 620 167 630 Q 170 626 173 632'

html = html.replace(old_path, new_path)

# 2. Add the missing blue court rectangle to Page 4
scenery_insertion = '''<!-- 绿色墙壁块 -->
                    <div style="position: absolute; background-color: #2ca867; height: 84px; left: 0; top: 339px; width: 440px"></div>
                    <!-- 蓝色球场块 -->
                    <div style="position: absolute; background: linear-gradient(180deg, #0073d1, #004bb4); height: 533px; left: 0; top: 423px; width: 440px"></div>'''

html = re.sub(r'<!-- 绿色墙壁块 -->\s*<div[^>]+></div>', scenery_insertion, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
