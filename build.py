import json, pathlib
src = pathlib.Path(__file__).parent / 'src'
dist = pathlib.Path(__file__).parent / 'dist'
dist.mkdir(exist_ok=True)
css = (src/'ui.css').read_text(encoding='utf-8')
ui = (src/'ui.js').read_text(encoding='utf-8')
core = (src/'core.js').read_text(encoding='utf-8')
viewer = (src/'viewer.js').read_text(encoding='utf-8')
VERSION = '1.6.0'
REPO = 'Dobo233/fallen-london-chronicle'
header = f"""// ==UserScript==
// @name         沦敦故事回顾 Fallen London Chronicle
// @namespace    fl-chronicle
// @version      {VERSION}
// @description  自动完整记录沦敦（Fallen London）里每一次选择的故事、选项与结果原文，可搜索、星标、笔记、导出，不丢一个字。
// @author       Dobo233
// @homepageURL  https://github.com/{REPO}
// @supportURL   https://github.com/{REPO}/issues
// @downloadURL  https://raw.githubusercontent.com/{REPO}/main/dist/fallen-london-chronicle.user.js
// @updateURL    https://raw.githubusercontent.com/{REPO}/main/dist/fallen-london-chronicle.user.js
// @license      MIT
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-start
// @grant        none
// @inject-into  page
// @noframes
// ==/UserScript==
"""
css_js = 'var FLC_CSS = ' + json.dumps(css, ensure_ascii=False) + ';\n'
(dist/'fallen-london-chronicle.user.js').write_text(header + '(function () {\n' + css_js + ui + '\n' + core + '\n})();\n', encoding='utf-8')
html = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>沦敦故事回顾 · 离线查看器</title>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Slab:400,700|Roboto:400,400i,700,700i&display=swap">'
        '<style>html,body{margin:0;background:#1d1d1d;color:#bdb29e}</style></head><body>'
        '<script>\n' + css_js + ui + '\n' + viewer + '\n</script></body></html>')
(dist/'fallen-london-chronicle-viewer.html').write_text(html, encoding='utf-8')

# ---------- Chrome 插件 ----------
import shutil, subprocess, sys
ext_src = src/'ext'
ext = dist/'chrome-extension'
if ext.exists(): shutil.rmtree(ext)
ext.mkdir(parents=True)
(ext/'manifest.json').write_text((ext_src/'manifest.json').read_text(encoding='utf-8').replace('__VERSION__', VERSION), encoding='utf-8')
# 运行在游戏页面里的部分：和油猴脚本完全同一份代码
(ext/'page.js').write_text('(function () {\n' + css_js + ui + '\n' + core + '\n})();\n', encoding='utf-8')
(ext/'ui.js').write_text(ui, encoding='utf-8')
(ext/'css.js').write_text(css_js, encoding='utf-8')
(ext/'reader.js').write_text(viewer, encoding='utf-8')
for f in ('popup.html', 'popup.css', 'popup.js', 'reader.html'):
    shutil.copy(ext_src/f, ext/f)
subprocess.run([sys.executable, str(ext_src/'make_icons.py'), str(ext/'icons')], check=True)
(ext/'icons'/'icon512.png').unlink()
zp = dist/'fallen-london-chronicle-chrome.zip'
if zp.exists(): zp.unlink()
shutil.make_archive(str(zp.with_suffix('')), 'zip', ext)

# ---------- Firefox 插件（电脑版 / 安卓版 128+）----------
# 代码和 Chrome 版完全相同，只是清单多了 Firefox 要求的 ID 和数据收集声明，去掉 Chrome 专用字段
import json as _json
ff = dist/'firefox-extension'
if ff.exists(): shutil.rmtree(ff)
shutil.copytree(ext, ff)
man = _json.loads((ext/'manifest.json').read_text(encoding='utf-8'))
man.pop('minimum_chrome_version', None)
man['browser_specific_settings'] = {
    'gecko': {'id': 'fallen-london-chronicle@dobo233', 'strict_min_version': '128.0',
              'data_collection_permissions': {'required': ['none']}},
    'gecko_android': {'strict_min_version': '128.0'}
}
(ff/'manifest.json').write_text(_json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
fz = dist/'fallen-london-chronicle-firefox.zip'
if fz.exists(): fz.unlink()
shutil.make_archive(str(fz.with_suffix('')), 'zip', ff)
print('ok')
