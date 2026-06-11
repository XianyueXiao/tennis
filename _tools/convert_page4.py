import re
import os

input_file = r"C:\Users\32229\.gemini\antigravity\brain\1c9bd68a-a057-4489-8f4d-2de40cec3ca7\.system_generated\steps\433\output.txt"

with open(input_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Parse image mappings
img_map = {}
for line in text.split('\n'):
    m = re.match(r'const\s+(\w+)\s*=\s*"http://localhost:3845/assets/([a-f0-9]+\.svg)";', line)
    if m:
        img_map[m.group(1)] = "assets/page4/" + m.group(2)

# Extract JSX
start = text.find("export default function")
jsx = text[start:]

# Remove function wrapper
start_return = jsx.find("return (") + 8
end_return = jsx.rfind(");")
jsx = jsx[start_return:end_return].strip()

# Replace className with class
jsx = jsx.replace("className=", "class=")

# Replace {imgX} with "assets/page4/..."
for key, val in sorted(img_map.items(), key=lambda x: -len(x[0])):
    jsx = jsx.replace(f"src={{{key}}}", f'src="{val}"')

def tailwind_to_style(classes):
    styles = []
    cls_list = classes.split()
    for c in cls_list:
        if c == 'absolute':
            styles.append('position: absolute')
        elif c == 'relative':
            styles.append('position: relative')
        elif c == 'block':
            styles.append('display: block')
        elif c == 'flex':
            styles.append('display: flex')
        elif c == 'flex-none':
            styles.append('flex: none')
        elif c == 'items-center':
            styles.append('align-items: center')
        elif c == 'justify-center':
            styles.append('justify-content: center')
        elif c == 'contents':
            styles.append('display: contents')
        elif c == 'size-full':
            styles.append('width: 100%; height: 100%')
        elif c == 'inset-0':
            styles.append('top: 0; right: 0; bottom: 0; left: 0')
        elif c == 'max-w-none':
            styles.append('max-width: none')
        elif c == 'bg-white':
            styles.append('background-color: white')
        elif c == 'text-white':
            styles.append('color: white')
        elif c == 'text-black':
            styles.append('color: black')
        elif c == 'text-center':
            styles.append('text-align: center')
        elif c == 'overflow-clip':
            styles.append('overflow: clip')
        elif c == 'whitespace-nowrap':
            styles.append('white-space: nowrap')
        elif c == '-translate-x-1/2':
            styles.append('transform: translateX(-50%)')
        elif c == 'not-italic':
            styles.append('font-style: normal')
        elif c == 'leading-none':
            styles.append('line-height: 1')
        elif c.startswith('bg-['):
            val = c[4:-1]
            styles.append(f'background-color: {val}')
        elif c.startswith('w-['):
            styles.append(f'width: {c[3:-1]}')
        elif c.startswith('h-['):
            styles.append(f'height: {c[3:-1]}')
        elif c.startswith('left-['):
            styles.append(f'left: {c[6:-1]}')
        elif c == 'left-0':
            styles.append('left: 0')
        elif c.startswith('top-['):
            styles.append(f'top: {c[5:-1]}')
        elif c.startswith('text-['):
            styles.append(f'font-size: {c[6:-1]}')
        elif c.startswith('leading-['):
            styles.append(f'line-height: {c[9:-1]}')
        elif c.startswith('tracking-['):
            styles.append(f'letter-spacing: {c[10:-1]}')
        elif c.startswith('inset-['):
            # inset-[top_right_bottom_left]
            val = c[7:-1].replace('_', ' ')
            vals = val.split()
            if len(vals) == 4:
                styles.append(f'top: {vals[0]}; right: {vals[1]}; bottom: {vals[2]}; left: {vals[3]}')
            elif len(vals) == 2:
                styles.append(f'top: {vals[0]}; right: {vals[1]}; bottom: {vals[0]}; left: {vals[1]}')
            elif len(vals) == 1:
                styles.append(f'top: {vals[0]}; right: {vals[0]}; bottom: {vals[0]}; left: {vals[0]}')
        elif c.startswith('rotate-['):
            styles.append(f'transform: rotate({c[8:-1]})')
        elif c.startswith('skew-x-['):
            styles.append(f'transform: skewX({c[8:-1]})')
        elif c.startswith('mask-image:'): # handled inline later
            pass
        elif c == 'mask-alpha' or c == 'mask-intersect' or c == 'mask-no-clip' or c == 'mask-no-repeat':
            pass
        elif c.startswith('mask-position-['):
            styles.append(f'mask-position: {c[15:-1].replace("_", " ")}')
        elif c.startswith('mask-size-['):
            styles.append(f'mask-size: {c[11:-1].replace("_", " ")}')
        elif c.startswith('from-['):
            styles.append(f'--tw-gradient-from: {c[6:-1]}')
            styles.append(f'--tw-gradient-to: transparent')
            styles.append(f'--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)')
            styles.append(f'background-image: linear-gradient(to bottom, var(--tw-gradient-stops))')
        elif c.startswith('to-['):
            val = c[4:-1]
            if ',' in val:
                val = val.split(',')[1]
            styles.append(f'--tw-gradient-to: {val}')
        elif c.startswith('font-['):
            val = c[6:-1]
            if 'Regular' in val:
                styles.append("font-weight: normal")
            elif 'Bold' in val:
                styles.append("font-weight: bold")
    
    return "; ".join(styles)

# Replace class="..." with style="..."
def replacer(match):
    classes = match.group(1)
    # Extract existing styles if any
    inline_style = ""
    return f'style="{tailwind_to_style(classes)}"'

import re
# We need to merge class styles with existing inline styles
# A bit tricky, let's just do a simple pass
lines = jsx.split('\n')
out_lines = []
for line in lines:
    m = re.search(r'class="([^"]+)"', line)
    if m:
        classes = m.group(1)
        styles = tailwind_to_style(classes)
        # Check if there's an existing style
        s_match = re.search(r'style=\{\{\s*([^}]+)\s*\}\}', line)
        if s_match:
            ex_style = s_match.group(1).replace('maskImage', 'mask-image').replace('containerType', 'container-type').replace('`url("${imgGroup1}")`', f'url("{img_map["imgGroup1"]}")').replace('"', '')
            styles += "; " + ex_style
            line = re.sub(r'style=\{\{[^}]+\}\}', '', line)
        
        line = line.replace(f'class="{classes}"', f'style="{styles}"')
    
    # Remove data-node-id and data-name
    line = re.sub(r'\s*data-node-id="[^"]+"', '', line)
    line = re.sub(r'\s*data-name="[^"]+"', '', line)
    out_lines.append(line)

final_html = "\n".join(out_lines)

with open(r"e:\设计技术4\Final Project\webapp\page4.html", "w", encoding="utf-8") as f:
    f.write(final_html)
