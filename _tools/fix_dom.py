import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The text wrapper
text_wrapper_start = r'<div style="position: absolute; width: 100%; bottom: [^"]+; color: white; display: flex; flex-direction: column; align-items: center; z-index: 100;">'
text_wrapper_match = re.search(text_wrapper_start, html)

if text_wrapper_match:
    # We want to insert </div> right before the text wrapper to close the SVG container
    # And we'll also replace whatever bottom value with bottom: 100px; to place it safely.
    original_start = text_wrapper_match.group(0)
    new_start = '</div>\n                    <div style="position: absolute; width: 100%; bottom: 100px; color: white; display: flex; flex-direction: column; align-items: center; z-index: 100;">'
    html = html.replace(original_start, new_start)

# Now we need to add a closing div for .page-4-content since we added an extra </div>
# Currently it has:
#                     </div>
#                 </div>
#             </div>
#         </section>
# We can just look for </section> of page 4 and ensure there are three </div>s before it.
# Actually, the browser handles missing </div>s, but let's just do a clean replace at the end of page-4.

page_4_end = r'(\s*</div>\s*</div>\s*</section>)'
html = re.sub(page_4_end, r'\n                    </div>\n                </div>\n            </div>\n        </section>', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
