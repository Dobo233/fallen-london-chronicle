# 沦敦故事回顾 · Fallen London Chronicle

把《沦敦》（[Fallen London](https://www.fallenlondon.com/)）里你做过的**每一次选择**完整记下来：故事开头、当时的**全部选项**、你选了哪个、结果正文、所有属性和物品的变化——一个字都不丢。然后按游戏本身的样式回顾、整理成一本本“日志本”、导出成网页或文档。

> 非官方的玩家自制工具，与 Failbetter Games 没有任何关联。

[English summary below](#english)

## 为什么做这个

游戏自带的日志（Journal）每条只保存标题、游戏内日期、地点和你填的一句话：**故事下的选项、你的选择、行动的后果都不会被记录**。这个工具直接保存游戏从服务器收到的完整数据，再整理成可读的样子；原始数据也一并保留，所以就算整理时漏了什么，原文也还在。

## 功能

- **完整记录**：故事开头、全部选项（含挑战说明、解锁条件）、你的选择、结果正文、全部变化；同一选项在不同进度下的不同文字都会分别保存。
- **沦敦风格的回顾面板**：字体、配色、纸张纹理、图标与游戏一致；全文搜索、按角色/故事筛选、星标、笔记。
- **自动整理**：同一个故事里的多次选择合并成一张故事卡；选项和结果完全相同的重复只显示一次；故事页文字随进度变化时自动分段。
- **📖 日志本**：把属于同一条大故事的事件收进一本本日志，按章节排序；游戏里直接接续的故事会被自动发现，一键建成日志本。
- **翻译**：开着 Chrome 自带翻译（或沉浸式翻译等）玩时，逐项保存译文，可切换“原文 / 译文 / 对照”。
- **游戏日志联动**：在游戏里“保存到日志”的条目会被标记；导入游戏日志时会和完整记录合并。
- **随时暂停**：右下角的记录开关（快捷键 Alt+K）。
- **导出**：网页、Markdown、TXT、完整备份 JSON；附带离线阅读器，不开游戏也能读。

## 安装

### 方式一：Chrome 插件（推荐，Chrome / Edge 111+）

1. 下载 [`fallen-london-chronicle-chrome.zip`](https://github.com/Dobo233/fallen-london-chronicle/raw/main/dist/fallen-london-chronicle-chrome.zip)，解压到一个**固定的文件夹**（之后不要删除或移动它）。
2. 打开 `chrome://extensions`（Edge：`edge://extensions`），打开右上角的 **开发者模式**。
3. 点 **加载已解压的扩展程序**，选择刚才解压出的文件夹（里面直接有 `manifest.json` 的那一层）。
4. 刷新 fallenlondon.com，右下角出现 **📜 回顾** 就装好了。

更新：下载新的 zip 覆盖到同一个文件夹，然后在 `chrome://extensions` 里点插件的刷新按钮。

### 方式二：Tampermonkey 脚本

装好 [Tampermonkey](https://www.tampermonkey.net/) 后，打开 **[安装链接](https://raw.githubusercontent.com/Dobo233/fallen-london-chronicle/main/dist/fallen-london-chronicle.user.js)** 点“安装”。之后会自动更新。
（新版 Chrome 需要在 Tampermonkey 的扩展详情里打开“允许运行用户脚本”。插件和脚本二选一即可，两者的记录存在同一个地方。）

### 离线阅读器

下载 [`fallen-london-chronicle-viewer.html`](https://github.com/Dobo233/fallen-london-chronicle/raw/main/dist/fallen-london-chronicle-viewer.html)，双击打开，把导出的“完整备份 JSON”拖进去即可。

详细用法见 [docs/使用说明.md](docs/使用说明.md)。

## 数据与隐私

- 所有记录**只保存在你自己的浏览器里**（IndexedDB），不会上传到任何地方。清除浏览器数据会删除它们——请定期“导出 → 完整备份 JSON”。
- 工具只**旁听**游戏收到的数据，不修改、也不额外发送游戏请求。唯一的主动请求，是你点“导入游戏日志”时，用你当前的登录状态**只读地**读取你自己的日志。
- 仓库里不包含任何游戏文字或图片。图标和纸张纹理在显示时直接从游戏官方服务器加载。

## 开发

```
python build.py        # 从 src/ 生成 dist/（插件文件夹与 zip、Tampermonkey 脚本、离线阅读器）
```

- `src/core.js`：在游戏页面里运行，拦截游戏收到的数据并保存；读取翻译后的文字。
- `src/ui.js` / `src/ui.css`：回顾面板、日志本、导出（插件、脚本、离线阅读器共用）。
- `src/ext/`：Chrome 插件的清单、工具栏弹窗、插件自带阅读器、图标生成脚本。
- `test/`：用模拟游戏服务器的端到端测试（需要 `npm i playwright`，然后 `node test/ext-test.js` 等）。

欢迎提 Issue：如果游戏改版后某些内容记录不全，把那条记录的“原始数据”贴上来最有帮助（注意删掉你不想公开的内容）。

## 许可

[MIT](LICENSE)。Fallen London 及其内容版权归 Failbetter Games 所有；本项目不包含任何游戏内容。

---

## English

**Fallen London Chronicle** is an unofficial, fan-made browser extension (and Tampermonkey userscript) for [Fallen London](https://www.fallenlondon.com/). The game's own journal only keeps a title and a short line of text; this tool records **everything** about every choice you make — the storylet text, all the branches that were on offer (with challenges and unlock requirements), the branch you chose, the full outcome text and every quality change — losslessly, from the data the game client receives.

- Review panel styled like the game itself, with search, filters, stars and notes
- Repeated choices in one storylet merged into a single story card; identical outcomes shown once; text that changes with your progress shown in stages
- "Journals" (📖 日志本): organise storylets into chapters of a larger story, with automatic suggestions for directly linked storylets
- Per-element capture of page translations (e.g. Chrome's built-in translate), switchable original / translation / side-by-side
- Import the in-game journal and merge it with full records
- Export to HTML, Markdown, TXT and JSON backup; offline reader included
- All data stays in your own browser. The tool never alters or sends game requests (except a read-only fetch of your own journal when you ask for it)

The interface is in Chinese. Install: download [`fallen-london-chronicle-chrome.zip`](https://github.com/Dobo233/fallen-london-chronicle/raw/main/dist/fallen-london-chronicle-chrome.zip), unzip it, then load it via `chrome://extensions` → Developer mode → *Load unpacked*; or install the [userscript](https://raw.githubusercontent.com/Dobo233/fallen-london-chronicle/main/dist/fallen-london-chronicle.user.js) with Tampermonkey.

Not affiliated with Failbetter Games. Fallen London is © Failbetter Games. MIT licensed.
