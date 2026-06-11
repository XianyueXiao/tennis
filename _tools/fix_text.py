import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace Top Text
old_top_text = '''<!-- 顶部文本层 -->
                <div class="p4-top-text">
                    <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 75px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 117px; letter-spacing: -0.2px; white-space: nowrap">你用</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 302px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 117px; letter-spacing: -0.2px; white-space: nowrap">的时间经历</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 64px; left: 139.5px; font-style: normal; font-size: 64px; color: black; text-align: center; top: 83px; letter-spacing: -0.64px; white-space: nowrap">66</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 1; left: 214px; font-style: normal; font-size: 32px; color: black; text-align: center; top: 107px; letter-spacing: -0.32px; white-space: nowrap">分钟</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 20px; left: 220.5px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 153px; letter-spacing: -0.2px; white-space: nowrap">热身/截击练习/高压球/综合应用/冷却</p>
                    <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 356px; font-style: normal; font-size: 20px; color: black; text-align: center; top: 185px; letter-spacing: -0.2px; white-space: nowrap">等阶段</p>
                </div>'''

new_top_text = '''<!-- 顶部文本层 -->
                <div class="p4-top-text" style="position: absolute; width: 100%; top: 80px; text-align: center; color: black;">
                    <div style="font-size: 20px; display: flex; justify-content: center; align-items: baseline; gap: 8px; margin-bottom: 16px;">
                        <span>你用</span>
                        <span style="font-size: 64px; font-weight: bold; line-height: 1;">66</span>
                        <span style="font-size: 32px; font-weight: bold; line-height: 1;">分钟</span>
                        <span>的时间经历</span>
                    </div>
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">
                        热身/截击练习/高压球/综合应用/冷却
                    </div>
                    <div style="font-size: 20px;">
                        等阶段
                    </div>
                </div>'''

html = html.replace(old_top_text, new_top_text)

# Replace Bottom Text
old_bottom_text = '''<div style="position: absolute; display: contents; left: 55px; font-style: normal; text-align: center; color: white; top: 808px; white-space: nowrap">
                        <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 114.5px; font-size: 20px; top: 818px; letter-spacing: -0.2px">最擅长的仍是</p>
                        <p style="transform: translateX(-50%); position: absolute; font-weight: normal; line-height: 20px; left: 243px; font-size: 20px; top: 866px; letter-spacing: -0.2px">和</p>
                        <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 32px; left: 323px; font-size: 32px; top: 856px; letter-spacing: -0.32px">反手捡球</p>
                        <p style="transform: translateX(-50%); position: absolute; font-weight: bold; line-height: 32px; left: 244px; font-size: 32px; top: 808px; letter-spacing: -0.32px">正手捡球</p>
                    </div>'''

new_bottom_text = '''<div style="position: absolute; width: 100%; top: 760px; text-align: center; color: white;">
                        <div style="font-size: 20px; margin-bottom: 12px;">最擅长的仍是</div>
                        <div style="display: flex; justify-content: center; align-items: baseline; gap: 16px; font-size: 32px; font-weight: bold;">
                            <span>正手捡球</span>
                            <span style="font-size: 20px; font-weight: normal;">和</span>
                            <span>反手捡球</span>
                        </div>
                    </div>'''

html = html.replace(old_bottom_text, new_bottom_text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
