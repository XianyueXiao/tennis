with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()
with open('page4.html', 'r', encoding='utf-8') as f:
    p4 = f.read()

idx = idx.replace('</section>\n        </div>', '</section>\n\n        <!-- 第 4 页 -->\n        <section class="page page-4" id="page-4">\n' + p4 + '\n        </section>\n        </div>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx)
