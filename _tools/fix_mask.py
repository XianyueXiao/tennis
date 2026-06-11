import urllib.parse
import re

svg_content = '<svg width="100%" height="100%" viewBox="0 0 137.702 149.429" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M112.039 95.0519C126.213 65.0199 118.366 31.569 94.5141 20.3371C70.6619 9.10523 39.8362 24.3457 25.6629 54.3776C11.4897 84.4095 19.336 117.86 43.1882 129.092C67.0404 140.324 97.8661 125.084 112.039 95.0519Z" fill="black"/></svg>'

encoded = urllib.parse.quote(svg_content)
data_uri = f"data:image/svg+xml;charset=utf-8,{encoded}"

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace both occurrences of the file URL with the data URI
html = html.replace("url('assets/page4/f66dd9c6c94001b965f8a399387f5e29d345fd77.svg')", f"url('{data_uri}')")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Mask replaced with Data URI successfully.")
