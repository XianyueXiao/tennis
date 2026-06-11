import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace Bottom Text
old_bottom_text = '''<div style="position: absolute; width: 100%; top: 760px; text-align: center; color: white;">
                        <div style="font-size: 20px; margin-bottom: 12px;">最擅长的仍是</div>
                        <div style="display: flex; justify-content: center; align-items: baseline; gap: 16px; font-size: 32px; font-weight: bold;">
                            <span>正手捡球</span>
                            <span style="font-size: 20px; font-weight: normal;">和</span>
                            <span>反手捡球</span>
                        </div>
                    </div>'''

new_bottom_text = '''<div class="p4-bottom-text" style="position: absolute; top: 730px; left: 0; width: 100%; color: white; display: flex; flex-direction: column; align-items: center;">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 12px;">
                            <div style="display: flex; align-items: baseline; gap: 12px;">
                                <span style="font-size: 20px; font-weight: 400; opacity: 0.95;">最擅长的仍是</span>
                                <span style="font-size: 38px; font-weight: bold; line-height: 1;">正手捡球</span>
                            </div>
                            <div style="display: flex; align-items: baseline; gap: 12px;">
                                <span style="font-size: 20px; font-weight: 400; opacity: 0.95;">和</span>
                                <span style="font-size: 38px; font-weight: bold; line-height: 1;">反手捡球</span>
                            </div>
                        </div>
                    </div>'''

html = html.replace(old_bottom_text, new_bottom_text)

# Also ensure p4-person-and-text has absolute positioning to prevent clipping bugs
html = html.replace('<div class="p4-person-and-text">', '<div class="p4-person-and-text" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
