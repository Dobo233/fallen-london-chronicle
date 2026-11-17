// ==UserScript==
// @name         沦敦故事回顾 Fallen London Chronicle
// @namespace    fl-chronicle
// @version      1.5.0
// @description  自动完整记录沦敦（Fallen London）里每一次选择的故事、选项与结果原文，可搜索、星标、笔记、导出，不丢一个字。
// @author       Dobo233
// @homepageURL  https://github.com/Dobo233/fallen-london-chronicle
// @supportURL   https://github.com/Dobo233/fallen-london-chronicle/issues
// @downloadURL  https://raw.githubusercontent.com/Dobo233/fallen-london-chronicle/main/dist/fallen-london-chronicle.user.js
// @updateURL    https://raw.githubusercontent.com/Dobo233/fallen-london-chronicle/main/dist/fallen-london-chronicle.user.js
// @license      MIT
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-start
// @grant        none
// @inject-into  page
// @noframes
// ==/UserScript==
(function () {
var FLC_CSS = ":host { all: initial; }\n* { box-sizing: border-box; }\n.root {\n  --bg: #1d1d1d; --panel: #222222; --card: #2a2825; --line: #444037;\n  --ink: rgb(189, 178, 158); --muted: rgb(140, 130, 112); --accent: rgb(252, 172, 0); --accent2: rgb(146, 209, 213); --danger: rgb(177, 24, 24);\n  font-family: Roboto, Helvetica, Arial, \"Noto Sans SC\", \"Microsoft YaHei\", \"PingFang SC\", sans-serif;\n  color: var(--ink); font-size: 15px; line-height: 1.65;\n}\n.fabbar { position: fixed; right: 18px; bottom: 18px; z-index: 2147483000; display: flex; align-items: stretch; gap: 6px; }\n.fab {\n  min-width: 52px; height: 46px; padding: 0 16px; border-radius: 0;\n  background: rgb(66, 104, 107); color: rgb(185, 225, 228); border: 1px solid rgb(45, 82, 86);\n  box-shadow: 0 4px 16px rgba(0,0,0,.45); cursor: pointer;\n  font: 700 14px/46px \"Roboto Slab\", Georgia, \"Noto Serif SC\", serif; letter-spacing: .05em; box-shadow: inset 0 0 0 1px rgb(95,149,155), rgba(0,0,0,.5) 0 3px 6px;\n  display: flex; align-items: center; gap: 6px; user-select: none;\n}\n.fab:hover { background: rgb(82, 128, 132); }\n.fab .badge { font: 600 11px/18px system-ui, sans-serif; background: var(--accent2); color: #10201c; border-radius: 9px; padding: 0 6px; }\n.fab .badge:empty { display: none; }\n.fab.flash { animation: flash .9s ease; }\n.fab.warn { border-color: var(--danger); }\n@keyframes flash { 0% { box-shadow: 0 0 0 0 rgba(201,164,90,.9);} 100% { box-shadow: 0 0 0 16px rgba(201,164,90,0);} }\n\n.overlay { position: fixed; inset: 0; z-index: 2147483001; background: rgba(8,6,4,.72); display: flex; justify-content: center; }\n.overlay.hidden, .hidden { display: none !important; }\n.viewer .overlay { position: static; background: none; min-height: 100vh; }\n.panel { width: min(1080px, 100%); height: 100%; background: var(--bg); display: flex; flex-direction: column; border-left: 1px solid var(--line); border-right: 1px solid var(--line); }\n.viewer .panel { height: auto; min-height: 100vh; }\nheader { position: sticky; top: 0; z-index: 2; background: var(--panel); border-bottom: 1px solid #303030; padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }\nheader .title { font: 700 19px \"Roboto Slab\", Georgia, \"Noto Serif SC\", serif; color: rgb(237, 227, 210); margin-right: 6px; white-space: nowrap; }\nheader .count { font-size: 12px; color: var(--muted); margin-left: 6px; }\nheader .grow { flex: 1 1 180px; min-width: 140px; }\ninput[type=search], select, textarea {\n  background: #161616; color: rgb(237, 227, 210); border: 1px solid #444037; border-radius: 0;\n  font: inherit; font-size: 14px; padding: 5px 9px;\n}\ninput[type=search] { width: 100%; }\nselect { max-width: 190px; }\nbutton {\n  background: rgb(66, 104, 107); color: rgb(185, 225, 228); border: 1px solid rgb(45, 82, 86); border-radius: 0;\n  font: 700 12.5px \"Roboto Slab\", Georgia, \"Noto Serif SC\", serif; letter-spacing: .05em; padding: 6px 12px; cursor: pointer; white-space: nowrap;\n  box-shadow: inset 0 0 0 1px rgb(95, 149, 155);\n}\nbutton:hover { background: rgb(82, 128, 132); border-color: rgb(63, 114, 119); color: rgb(185, 225, 228); }\nbutton.primary { background: rgb(66, 104, 107); border-color: rgb(45, 82, 86); color: rgb(185, 225, 228); }\nbutton.danger:hover { border-color: var(--danger); color: #f2b0a4; }\nlabel.chk { font-size: 13px; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; cursor: pointer; }\n.drop { position: relative; }\n.menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 5; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 6px; min-width: 260px; box-shadow: 0 8px 24px rgba(0,0,0,.5); }\n.menu button { display: block; width: 100%; text-align: left; border: none; background: none; padding: 7px 10px; }\n.menu button:hover { background: #2f281d; }\n.menu .sep { border-top: 1px solid var(--line); margin: 5px 0; }\n.menu .hint { font-size: 12px; color: var(--muted); padding: 2px 10px 6px; }\n\n.settings { background: var(--panel); border-bottom: 1px solid var(--line); padding: 12px 18px; font-size: 14px; }\n.settings label { display: block; margin: 6px 0; cursor: pointer; }\n.settings .note { color: var(--muted); font-size: 12.5px; margin: 8px 0; }\n.settings .row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }\n\n.list { flex: 1; overflow-y: auto; padding: 8px 18px 60px; }\n.viewer .list { overflow: visible; }\n.day { font-size: 13px; color: var(--accent); letter-spacing: .1em; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1px dashed var(--line); font-weight: normal; }\n.empty { text-align: center; color: var(--muted); padding: 60px 20px; }\n.empty .big { font-size: 18px; color: var(--ink); margin-bottom: 8px; }\n.dropzone { border: 2px dashed var(--line); border-radius: 12px; padding: 40px 20px; margin: 30px auto; max-width: 560px; }\n.dropzone.over { border-color: var(--accent); background: #221d14; }\n\n.rec { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px 14px; margin: 10px 0; }\n.rec.starred { border-color: #8a6f3c; box-shadow: inset 3px 0 0 var(--accent); }\n.rec .meta { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; font-size: 12px; color: var(--muted); font-family: system-ui, \"Microsoft YaHei\", sans-serif; }\n.rec .meta .sp { flex: 1; }\n.rec .meta button { font-size: 12px; padding: 2px 8px; }\n.rec .meta button.on { color: #f0d79c; border-color: var(--accent); }\n.rec .crumb { margin-top: 6px; font-size: 14px; color: var(--accent2); }\n.rec .crumb .br { color: var(--ink); }\n.rec .crumb .arrow { color: var(--muted); margin: 0 4px; }\n.rec h3 { margin: 8px 0 4px; font-size: 18px; font-weight: 600; color: #f0d79c; }\n.rec h3 .tag { font-size: 11px; font-weight: normal; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 0 5px; margin-left: 8px; vertical-align: middle; }\n.rec .tabs { display: flex; gap: 6px; margin: 6px 0 2px; }\n.rec .tabs button { font-size: 12px; padding: 2px 9px; }\n.rec .tabs button.on { background: #4a3a1c; color: #f0d79c; border-color: #8a6f3c; }\n.rec .body { white-space: normal; overflow-wrap: anywhere; }\n.rec .body p { margin: .5em 0; }\n.rec .body.pre { white-space: pre-wrap; }\n.rec details { margin-top: 6px; font-size: 14px; }\n.rec details summary { cursor: pointer; color: var(--muted); font-size: 13px; }\n.rec details .sub { border-left: 2px solid var(--line); padding: 2px 0 2px 12px; margin: 6px 0; color: #d4c8ae; }\n.rec details .sub b { color: var(--accent2); font-weight: normal; }\n.rec .msgs { margin: 8px 0 0; padding: 8px 12px; list-style: none; background: #1d1913; border-radius: 6px; font-size: 13.5px; color: #d4c8ae; }\n.rec .msgs li { padding: 2px 0; }\n.rec .msgs li + li { border-top: 1px dotted #3a3226; }\n.rec textarea.note { width: 100%; min-height: 54px; margin-top: 8px; resize: vertical; }\n.rec .notetext { margin-top: 8px; padding: 6px 10px; border-left: 3px solid var(--accent2); background: #1d1913; font-size: 13.5px; white-space: pre-wrap; }\n.rec pre.raw { max-height: 360px; overflow: auto; background: #0e0c09; color: #b9d1c8; font: 12px/1.45 Consolas, monospace; padding: 10px; border-radius: 6px; white-space: pre-wrap; word-break: break-all; }\nmark { background: #6b5320; color: #fff2cc; border-radius: 2px; }\n.more { display: block; margin: 16px auto; }\n.toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 2147483002; background: #2f281d; color: #f0d79c; border: 1px solid #8a6f3c; padding: 8px 16px; border-radius: 8px; font: 14px system-ui, \"Microsoft YaHei\", sans-serif; box-shadow: 0 6px 18px rgba(0,0,0,.5); }\n@media (max-width: 640px) {\n  header { padding: 8px 10px; }\n  .list { padding: 6px 10px 60px; }\n  select { max-width: 46vw; }\n}\n\n/* ================= 沦敦风格视图（按 fallenlondon.com 登录后页面的实测样式） ================= */\n.list.flview {\n  --fl-paper: rgb(237, 227, 210); --fl-tab: rgb(189, 178, 158); --fl-frame: rgb(137, 125, 103);\n  --fl-ink: rgb(40, 37, 32); --fl-muted: rgb(117, 107, 90); --fl-shadow: rgb(145, 133, 110) 0 2px 3px 0;\n  --fl-teal: rgb(66, 104, 107); --fl-teal-b: rgb(45, 82, 86); --fl-teal-t: rgb(185, 225, 228); --fl-link: rgb(63, 114, 119);\n  --fl-slab: \"Roboto Slab\", Georgia, Times, \"Noto Serif SC\", \"Source Han Serif SC\", \"SimSun\", serif;\n  --fl-sans: Roboto, Helvetica, Arial, \"Noto Sans SC\", \"Microsoft YaHei\", \"PingFang SC\", sans-serif;\n  background: #1d1d1d; color: var(--fl-ink);\n  font-family: var(--fl-sans); font-size: 14px; line-height: 1.45;\n  padding: 16px 12px 80px;\n}\n/* .tab-content + .tab-content__bordered-container */\n.flview .fl-tab { position: relative; z-index: 0; max-width: 750px; margin: 0 auto; padding: 16px; }\n.flview .fl-tab::before {\n  content: \"\"; position: absolute; inset: 0; z-index: -2; filter: brightness(.95);\n  background: var(--fl-tab) url(\"https://images.fallenlondon.com/static/bg-paper-dark.png\");\n}\n.flview .fl-tab::after { content: \" \"; position: absolute; inset: 4px; z-index: -1; border: 2px solid var(--fl-frame); pointer-events: none; }\n/* .heading--3.heading--hr */\n.flview .day {\n  font: 700 16.8px/1.45 var(--fl-slab); color: var(--fl-ink); letter-spacing: 0; text-align: left;\n  border: none; border-bottom: 2px solid var(--fl-muted); padding-bottom: .25em; margin: 1.5em 0 1em;\n}\n.flview .day:first-child { margin-top: 0; }\n.flview .empty { color: var(--fl-ink); }\n.flview .more { display: block; margin: 20px auto 0; }\n\n/* 记录之间：游戏的 hr */\n.flview .rec.fl { background: none; border: none; border-radius: 0; padding: 0; margin: 0; box-shadow: none; }\n.flview .rec.fl + .rec.fl { margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--fl-tab); box-shadow: inset 0 1px 0 rgb(43, 43, 43); }\n.flview .rec .meta { color: var(--fl-muted); font: 12.5px var(--fl-sans); padding: 0 0 8px; }\n\n/* .button：Roboto Slab 700 13px 大写 */\n.flview button, .fl-btn {\n  display: inline-block; font: 700 12px/1.38 var(--fl-slab); letter-spacing: .05em; text-transform: uppercase;\n  padding: 4px 11px; border-radius: 0; border: 1px solid var(--fl-teal-b); cursor: pointer;\n  color: var(--fl-link); background: transparent; box-shadow: none;\n}\n.flview button:hover { color: #000; }\n.flview .rec .meta button { font-size: 11.5px; padding: 3px 9px; }\n.flview .rec .meta button.on { color: rgb(29, 29, 29); background: rgb(252, 172, 0); border-color: rgb(186, 127, 0); box-shadow: inset 0 0 0 1px rgb(255, 197, 74); }\n.flview .rec .meta button.danger:hover { color: rgb(236, 161, 161); background: rgb(177, 24, 24); border-color: rgb(90, 15, 15); }\n/* .button--primary */\n.flview .more, .fl-btn {\n  color: var(--fl-teal-t); background: var(--fl-teal); border: 1px solid var(--fl-teal-b);\n  box-shadow: inset 0 0 0 1px rgb(95, 149, 155), rgba(0, 0, 0, .5) 0 1px 2px 0;\n  padding: 10px 20px; font-size: 13px; line-height: normal;\n}\n.flview .more:hover { color: var(--fl-teal-t); background: rgb(82, 128, 132); border-color: var(--fl-link); }\n.fl-btn { cursor: default; }\n\n/* .media--root */\n.fl-root {\n  display: flex; position: relative; padding: 8px; color: var(--fl-ink);\n  background-color: var(--fl-paper);\n  background-image: url(\"https://images.fallenlondon.com/static/bg-paper-watermark.png\"), url(\"https://www.fallenlondon.com/img/bg-paper.png\");\n  background-position: 0 100%, 0 100%; background-repeat: no-repeat, repeat;\n  box-shadow: var(--fl-shadow);\n}\n.fl-storylet { margin-bottom: 0; }\n.fl-left { flex: none; padding: 0 10px 10px 0; }\n.fl-left:has(> .noimg) { display: none; }\n.fl-rootimg img { display: block; width: 93px; height: auto; }\n.fl-body { flex: 1 1 0%; min-width: 0; }\n.fl-h2 { margin: 0 40px 0 0; font: 700 20.16px/1.45 var(--fl-slab); color: var(--fl-ink); hyphens: auto; }\n.fl-h3 { margin: 0 40px 0 0; font: 700 16.8px/1.45 var(--fl-slab); color: var(--fl-ink); }\n.fl-desc { overflow-wrap: anywhere; hyphens: auto; }\n.fl-desc p { margin: 0 0 7px; text-align: justify; }\n.fl-desc p:last-child { margin-bottom: 0; }\n.fl-desc a { color: var(--fl-link); }\n.fl-desc.clamp { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }\n.flview .fl-link { border: none; padding: 4px 0 0; color: var(--fl-link); text-transform: none; letter-spacing: 0; font: 700 13px var(--fl-sans); }\n.flview .fl-link:hover { color: rgb(37, 66, 69); }\n.flview .rec.fl.starred .fl-root { box-shadow: var(--fl-shadow), inset 0 0 0 2px rgb(252, 172, 0); }\n\n/* .branch.media--branch：缩进 8px，图在小卡片里 */\n.fl-branch {\n  display: flex; margin: 16px 0 0 8px; padding: 8px; color: var(--fl-ink);\n  background: var(--fl-paper) url(\"https://images.fallenlondon.com/static/bg-paper.png\");\n  box-shadow: var(--fl-shadow);\n}\n.fl-branch .fl-left { padding: 0 10px 0 0; }\n.fl-card { box-shadow: rgba(0, 0, 0, .12) 0 1px 3px, rgba(0, 0, 0, .24) 0 1px 2px; }\n.fl-card img { display: block; width: 76px; height: 99px; }\n.fl-branch .fl-desc p, .fl-branch .fl-desc { margin-top: 0; }\n.fl-buttons { display: flex; justify-content: flex-end; padding-top: 8px; }\n\n/* 结果 */\n.fl-outcome { margin-top: 16px; }\n.fl-outcome .tabs { margin: 4px 0 6px; }\n.flview .rec .tabs button { font-size: 11px; padding: 2px 9px; }\n.flview .rec .tabs button.on { color: var(--fl-teal-t); background: var(--fl-teal); border-color: var(--fl-teal-b); }\n.fl-pt { padding-top: 6px; }\n.fl-pt summary { cursor: pointer; color: var(--fl-muted); font-size: 13px; }\n\n/* .branch.media--quality-updates / .quality-update */\n.fl-qu {\n  display: flex; flex-direction: column; margin: 16px 0 0 8px; padding: 8px; color: var(--fl-ink); word-break: break-word;\n  background: var(--fl-paper) url(\"https://images.fallenlondon.com/static/bg-paper.png\");\n  box-shadow: var(--fl-shadow);\n}\n.fl-q { display: flex; margin-bottom: 16px; }\n.fl-q:last-child { margin-bottom: 0; }\n.fl-qleft { flex: none; margin-right: 8px; width: 36px; }\n.fl-qicon { line-height: 1px; box-shadow: rgba(0, 0, 0, .6) 0 1px 2px; }\n.fl-qicon img { display: block; width: 36px; height: 36px; }\n.fl-qicon.noimg { width: 36px; height: 36px; box-shadow: none; background: rgba(117, 107, 90, .2); }\n.fl-qtext { flex: 1; min-width: 0; }\n\n.flview .notetext { background: var(--fl-paper); border-left: 3px solid var(--fl-teal); color: var(--fl-ink); margin: 12px 0 0 8px; box-shadow: var(--fl-shadow); }\n.flview .rec textarea.note { background: #fffaf0; color: var(--fl-ink); border: 1px solid var(--fl-frame); border-radius: 0; font-family: var(--fl-sans); }\n.flview .rec pre.raw { margin-top: 12px; border-radius: 0; }\n.flview mark { background: rgb(255, 218, 138); color: #000; }\n.fl-doc-head { max-width: 750px; margin: 0 auto 14px; color: rgb(189, 178, 158); }\n.fl-doc-title { font: 700 24.19px \"Roboto Slab\", Georgia, \"Noto Serif SC\", serif; color: rgb(237, 227, 210); margin: 10px 0 2px; }\n.fl-doc-sub { color: rgb(117, 107, 90); margin: 0; }\n\n@media (max-width: 640px) {\n  .list.flview { padding: 8px 0 60px; }\n  .flview .fl-tab { padding: 12px; }\n  .fl-rootimg img { width: 62px; }\n  .fl-card img { width: 52px; height: 68px; }\n  .fl-h2, .fl-h3 { margin-right: 0; }\n}\n.flview > .empty, .flview > .empty .big { color: rgb(189, 178, 158); }\n.flview .dropzone { border-color: #444037; }\n\n.status { background: rgb(66, 104, 107); color: rgb(185, 225, 228); font-size: 13px; padding: 7px 16px; border-bottom: 1px solid rgb(45, 82, 86); }\n.rec .meta .jtag { font: 700 11px \"Roboto Slab\", Georgia, serif; letter-spacing: .05em; color: rgb(185, 225, 228); background: rgb(66, 104, 107); padding: 1px 7px; }\n.fl-journal { margin-top: 0; }\n.rec.fl .fl-jdate { font-size: 14px; margin: 2px 0 8px; color: var(--fl-muted); }\n.fl-jmsg, .fl-jmeta { margin-top: 8px; }\n.fl-jmeta { color: var(--fl-muted, #756b5a); font-size: 12.5px; }\n.fl-jmsg { font-style: italic; white-space: pre-wrap; }\n.rec.fl .fl-h3 { color: var(--fl-ink); margin: 0 40px 0 0; font: 700 16.8px/1.45 var(--fl-slab); }\n.rec.fl .fl-h2 { color: var(--fl-ink); }\n\n/* 全部选项：所选高亮，其余淡化（与游戏 .media--semi-transparent 类似） */\n.fl-branches .fl-branch.other { display: none; opacity: .55; }\n.fl-branches.show-all .fl-branch.other { display: flex; }\n.fl-branch.chosen { box-shadow: var(--fl-shadow), inset 3px 0 0 var(--fl-teal); }\n.fl-branch.locked { background-color: rgb(187, 187, 187); background-image: none; }\n.flview .fl-others-toggle { display: block; margin: 8px 0 0 8px; }\n.fl-btn.fl-btn--off { color: rgb(29, 29, 29); background: rgb(102, 102, 102); border-color: rgb(77, 77, 77); box-shadow: none; }\n/* 挑战说明：游戏的 .media--challenge */\n.fl-challenge { display: flex; gap: 8px; background: rgb(189, 178, 158); padding: 5px 8px 8px; margin: 8px 0 2px; }\n.fl-cicon { flex: none; line-height: 1px; box-shadow: rgba(0,0,0,.6) 0 1px 2px; border-radius: 5px; overflow: hidden; align-self: flex-start; margin-top: 3px; }\n.fl-cicon img { display: block; width: 36px; height: 36px; }\n.fl-cicon.noimg { display: none; }\n.fl-h4 { font: 700 14px/1.45 var(--fl-slab, Georgia), serif; color: var(--fl-ink, #282520); }\n.fl-cdesc { font-size: 13.5px; }\n.fl-req { font-size: 12.5px; color: rgb(80, 80, 80); margin-top: 6px; }\n.fl-jbox { border-left: 3px solid var(--fl-teal); }\n.fl-jlabel { font: 700 11px \"Roboto Slab\", Georgia, serif; letter-spacing: .08em; color: var(--fl-teal, #42686b); margin-bottom: 2px; }\n.rec.fl .fl-jbox .fl-h3 { margin: 0; }\n\n/* 同一故事的多次选择合并成一张故事卡 */\n.flview .fl-tab > .fl-group + .rec.fl, .flview .fl-tab > .rec.fl + .fl-group, .flview .fl-tab > .fl-group + .fl-group {\n  margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--fl-tab); box-shadow: inset 0 1px 0 rgb(43, 43, 43);\n}\n.fl-group .fl-gmeta { color: var(--fl-muted); font: 12.5px var(--fl-sans); padding: 0 0 8px; }\n.fl-gmeta .gcount { font: 700 11px \"Roboto Slab\", Georgia, serif; color: rgb(185, 225, 228); background: rgb(66, 104, 107); padding: 1px 7px; }\n.flview .fl-group .rec.fl.sub { margin: 22px 0 0; padding: 0; border: none; box-shadow: none; }\n.fl-pick { font: 700 15px/1.4 var(--fl-slab); color: var(--fl-ink); border-bottom: 2px solid var(--fl-muted); padding-bottom: 3px; margin-bottom: 6px; }\n.fl-pick-n { display: inline-block; font-size: 11.5px; letter-spacing: .05em; color: rgb(185, 225, 228); background: rgb(66, 104, 107); padding: 1px 8px; margin-right: 8px; vertical-align: 2px; }\n.fl-group .rec.sub .meta { padding-bottom: 6px; }\n.fl-group .rec.sub .fl-outcome { margin-top: 0; }\n\n/* 记录开关 */\nheader .recbtn { min-width: 86px; }\nheader .recbtn.paused { background: rgb(102, 102, 102); border-color: rgb(77, 77, 77); color: rgb(29, 29, 29); box-shadow: none; }\n/* 右下角的记录开关 */\n.fabrec {\n  height: 46px; padding: 0 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; border-radius: 0;\n  font: 700 13px \"Roboto Slab\", Georgia, \"Noto Serif SC\", serif; letter-spacing: .03em;\n  background: rgb(40, 37, 32); color: rgb(237, 227, 210); border: 1px solid rgb(117, 107, 90);\n  box-shadow: inset 0 0 0 1px rgba(237, 227, 210, .12), rgba(0, 0, 0, .5) 0 3px 6px;\n}\n.fabrec:hover { background: rgb(58, 54, 47); color: rgb(237, 227, 210); border-color: rgb(137, 125, 103); }\n.fabrec .dot { width: 10px; height: 10px; border-radius: 50%; background: rgb(226, 54, 54); box-shadow: 0 0 0 3px rgba(226, 54, 54, .25); animation: recpulse 1.8s ease-in-out infinite; }\n.fabrec .bars { font-size: 11px; letter-spacing: -1px; }\n.fabrec.paused { background: rgb(102, 102, 102); color: rgb(29, 29, 29); border-color: rgb(77, 77, 77); box-shadow: rgba(0, 0, 0, .5) 0 3px 6px; }\n.fabrec.paused:hover { background: rgb(120, 120, 120); color: rgb(29, 29, 29); }\n.fabrec:focus-visible, .fab:focus-visible { outline: 2px solid rgb(146, 209, 213); outline-offset: 2px; }\n@keyframes recpulse { 50% { box-shadow: 0 0 0 5px rgba(226, 54, 54, .08); } }\n@media (prefers-reduced-motion: reduce) { .fabrec .dot { animation: none; } }\n\n/* ================= 日志本 ================= */\nheader .bookbtn.on { background: rgb(252, 172, 0); border-color: rgb(186, 127, 0); color: rgb(29, 29, 29); box-shadow: inset 0 0 0 1px rgb(255, 197, 74); }\nheader.booksmode .grow, header.booksmode .f-char, header.booksmode .f-story, header.booksmode .chk,\nheader.booksmode .view, header.booksmode .sort, header.booksmode .drop { display: none; }\n.books { flex: 1; min-height: 0; display: flex; }\n.viewer .books { min-height: calc(100vh - 60px); }\n.bside { width: 240px; flex: none; overflow-y: auto; background: #222; border-right: 1px solid #303030; padding: 8px 8px 40px; }\n.bside-h { font: 700 11px \"Roboto Slab\", Georgia, serif; letter-spacing: .12em; color: rgb(117, 107, 90); margin: 14px 8px 6px; }\n.bside-h:first-child { margin-top: 6px; }\n.bitem, .bnew {\n  display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; margin: 2px 0; padding: 6px 8px;\n  background: transparent; border: none; border-left: 3px solid transparent; box-shadow: none; border-radius: 0;\n  color: rgb(189, 178, 158); font: 14px/1.3 Roboto, \"Noto Sans SC\", \"Microsoft YaHei\", sans-serif; letter-spacing: 0; white-space: normal;\n}\n.bitem:hover, .bnew:hover { background: #2c2a26; color: rgb(237, 227, 210); border-color: transparent; }\n.bitem.on { background: #2f2c27; color: rgb(237, 227, 210); border-left-color: rgb(95, 149, 155); }\n.bcover { flex: none; width: 26px; height: 26px; object-fit: cover; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: rgba(0,0,0,.6) 0 1px 2px; background: #1d1d1d; }\n.bname { flex: 1; min-width: 0; overflow-wrap: anywhere; }\n.bnum { font-size: 12px; color: rgb(117, 107, 90); }\n.bnew { color: rgb(146, 209, 213); font-weight: 700; }\n.bmain { flex: 1; min-width: 0; }\n.bhead { margin-bottom: 18px; }\n.flview .btitle { display: block; width: 100%; background: transparent; border: none; border-bottom: 2px solid transparent; border-radius: 0; padding: 2px 0;\n  font: 700 24.19px/1.3 var(--fl-slab); color: var(--fl-ink); }\n.flview input.btitle:hover { border-bottom-color: rgba(117, 107, 90, .4); }\n.flview input.btitle:focus { outline: none; border-bottom-color: var(--fl-teal); }\n.flview .bdesc { display: block; width: 100%; margin-top: 6px; background: rgba(237, 227, 210, .55); color: var(--fl-ink); border: 1px solid rgba(137, 125, 103, .5); border-radius: 0; font: 14px/1.45 var(--fl-sans); resize: vertical; }\n.btools { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 8px; }\n.btools .sp { flex: 1; }\n.bstat { color: var(--fl-muted); font-size: 13px; }\n.flview .btools button.danger:hover { color: rgb(236, 161, 161); background: rgb(177, 24, 24); border-color: rgb(90, 15, 15); }\n.chap { margin-bottom: 30px; }\n.flview .chap-h { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin-top: 0; }\n.chap-n { font: 700 12px var(--fl-slab); letter-spacing: .06em; color: rgb(185, 225, 228); background: rgb(66, 104, 107); padding: 2px 9px; align-self: center; }\n.chap-name { flex: 1; min-width: 0; }\n.chap-tools { display: flex; gap: 4px; }\n.flview .chap-tools button { font-size: 11.5px; padding: 2px 8px; }\n.flview .chap-tools button:disabled { opacity: .35; cursor: default; }\n.bsugg, .bline { background: var(--fl-paper) url(\"https://images.fallenlondon.com/static/bg-paper.png\"); box-shadow: var(--fl-shadow); padding: 10px 12px; margin: 16px 0 0; border-left: 3px solid var(--fl-teal); }\n.rec.fl .bsugg .fl-h3, .bsugg .fl-h3 { margin: 0; }\n.brow { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px dotted rgba(117, 107, 90, .5); }\n.bsugg .brow:first-of-type, .fl-tab > .brow:first-of-type { border-top: none; }\n.fl-tab > .brow { background: var(--fl-paper); padding: 8px 10px; margin-top: 6px; box-shadow: var(--fl-shadow); border-top: none; }\n.brow-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.brow-t b { font: 700 15px/1.35 var(--fl-slab); color: var(--fl-ink); }\n.brow-t span { font-size: 12.5px; color: var(--fl-muted); }\n.bline-steps { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }\n.bstep { display: inline-flex; align-items: center; gap: 6px; background: rgba(189, 178, 158, .45); padding: 4px 8px 4px 4px; }\n.bstep > span { display: flex; flex-direction: column; font: 700 13.5px/1.3 var(--fl-slab); color: var(--fl-ink); }\n.bstep small { font: 12px var(--fl-sans); color: var(--fl-muted); }\n.bline .arrow { color: var(--fl-muted); font-size: 18px; }\n.flview .btitle.static { cursor: default; }\n/* 卡片上的日志本标记与菜单 */\n.bchips { display: inline-flex; flex-wrap: wrap; gap: 4px; }\n.bchip { font: 700 11px/1.6 \"Roboto Slab\", Georgia, \"Noto Serif SC\", serif; color: rgb(40, 37, 32); background: rgb(237, 227, 210); border: 1px solid rgb(137, 125, 103); padding: 0 6px; }\n.fl-gmeta { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; }\n.fl-gmeta .sp { flex: 1; }\n.flview .fl-gmeta button { font-size: 11.5px; padding: 3px 9px; }\n.bmenu { position: fixed; z-index: 2147483003; min-width: 230px; max-width: 320px; max-height: 60vh; overflow-y: auto; padding: 6px;\n  background: rgb(237, 227, 210); color: rgb(40, 37, 32); border: 1px solid rgb(137, 125, 103); box-shadow: rgba(0, 0, 0, .5) 0 6px 18px;\n  font: 14px/1.4 Roboto, \"Noto Sans SC\", \"Microsoft YaHei\", sans-serif; }\n.bmenu-h { font: 700 12px \"Roboto Slab\", Georgia, serif; letter-spacing: .08em; color: rgb(117, 107, 90); padding: 4px 6px 6px; }\n.bmenu label { display: flex; gap: 8px; align-items: center; padding: 5px 6px; cursor: pointer; }\n.bmenu label:hover { background: rgba(189, 178, 158, .5); }\n.bmenu-empty { color: rgb(117, 107, 90); padding: 4px 6px 8px; font-size: 13px; }\n.bmenu button { display: block; width: 100%; margin-top: 4px; text-align: left; }\n@media (max-width: 720px) {\n  .books { flex-direction: column; }\n  .bside { width: auto; max-height: 34vh; border-right: none; border-bottom: 1px solid #303030; padding-bottom: 8px; }\n}\n\n/* ================= 译文与重复合并 ================= */\n.trtext { white-space: normal; }\n.trdual { margin-top: 6px; padding: 6px 10px; border-left: 3px solid rgb(66, 104, 107); background: rgba(66, 104, 107, .09); color: rgb(40, 37, 32); white-space: normal; }\n.trsub { display: block; font-size: .78em; font-weight: 700; color: rgb(66, 104, 107); margin-top: 1px; }\n.fl-qtext .trdual { margin-top: 3px; padding: 3px 8px; }\n.fl-pick-x { display: inline-block; margin-left: 8px; font: 700 11.5px var(--fl-sans, sans-serif); color: rgb(117, 107, 90); vertical-align: 1px; }\n.fl-block { margin-top: 22px; }\n.fl-block > .fl-pick { margin-top: 0; }\n.flview .fl-group .fl-block .rec.fl.sub { margin-top: 0; }\n.fl-rep-note { margin: 8px 0 0 8px; font-size: 12.5px; color: rgb(117, 107, 90); font-style: italic; }\n.flview .fl-group .rec.fl.sub.mini { margin: 10px 0 0 8px; padding: 6px 0 0 10px; border-left: 2px solid rgba(117, 107, 90, .45); }\n.fl-rep-h { font: 700 13px var(--fl-slab, Georgia), serif; color: rgb(66, 104, 107); }\n.rec.mini .fl-qu { margin-top: 6px; }\nheader select.lang { max-width: 90px; }\n.fl-pick .trsub { display: inline; margin-left: 6px; font-size: .85em; }\n\n/* 解锁条件（游戏的 .quality-requirement） */\n.fl-buttons { align-items: center; gap: 6px; flex-wrap: wrap; }\n.fl-reqicons { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-right: 4px; }\n.fl-reqicon { display: inline-block; line-height: 1px; border-radius: 5px; box-shadow: rgba(0,0,0,.6) 0 1px 2px; cursor: help; }\n.fl-reqicon img { display: block; width: 32px; height: 32px; border-radius: 5px; }\n.fl-reqicon.locked { box-shadow: 0 0 0 2px rgb(206, 28, 28), rgba(0,0,0,.6) 0 1px 2px; }\n.fl-reqicon.locked img { opacity: .55; }\n.fl-reqdot { display: block; width: 32px; height: 32px; border-radius: 5px; background: rgba(117, 107, 90, .35); }\n.fl-reqlist { list-style: none; margin: 6px 0 0; padding: 0; font-size: 12.5px; color: rgb(85, 78, 66); }\n.fl-reqlist li { padding: 1px 0; }\n.fl-reqlist li.locked { color: rgb(160, 30, 30); }\n.fl-reqlist .quality-name { font-weight: 700; }\n.fl-streq { clear: both; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 6px; margin-top: 6px; }\n.fl-streq .fl-reqlist { margin: 0; }\n.fl-segnote { margin: 26px 0 12px; padding: 4px 10px; font: 700 12.5px var(--fl-slab, Georgia), \"Noto Serif SC\", serif; color: rgb(185, 225, 228); background: rgb(66, 104, 107); display: inline-block; }\n";
/* 沦敦故事回顾 —— 共享界面与工具（油猴脚本和离线查看器共用） */
var FLC = (function () {
  'use strict';

  var FONT_LINK = '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Slab:400,700|Roboto:400,400i,700,700i&display=swap">';

  /* ---------- 译文显示：原文 / 译文 / 对照 ---------- */
  var LANG = 'orig';
  function setLang(v) { LANG = (v === 'tr' || v === 'dual') ? v : 'orig'; }
  function trHtml(t) { return esc(t).replace(/\n/g, '<br>'); }
  /** 正文类：按当前模式返回原文、译文，或原文下面跟着译文 */
  function TB(orig, tr) {
    if (!tr || LANG === 'orig') return toSafeHtml(orig);
    if (LANG === 'tr') return '<div class="trtext">' + trHtml(tr) + '</div>';
    return toSafeHtml(orig) + '<div class="trdual">' + trHtml(tr) + '</div>';
  }
  /** 标题类 */
  function TT(orig, tr) {
    if (!tr || LANG === 'orig') return toSafeHtml(orig);
    if (LANG === 'tr') return esc(tr);
    return toSafeHtml(orig) + '<span class="trsub">' + esc(tr) + '</span>';
  }
  /** 导出纯文本用 */
  function PT(orig, tr) {
    var o = htmlToText(orig);
    if (!tr || LANG === 'orig') return o;
    if (LANG === 'tr') return tr;
    return o + '\n' + tr;
  }
  function trOf(r, key) { return (r && r.tr && r.tr[key]) || null; }
  /** 一条记录的变化消息译文（只有条数对得上才逐条对应） */
  function msgTr(r, i) {
    var o = trOf(r, 'outcome'); if (!o || !o.messages || !r.messages) return '';
    if (o.aligned) return o.messages[i] || '';
    // 旧记录：译文是按页面顺序存的，和服务器顺序不一定一样 —— 按数字和英文词重新配对
    if (!r._mt) r._mt = alignTr(r.messages.map(function (m) { return m.text; }), o.messages);
    return r._mt[i] || '';
  }
  /** 把一组原文和一组（顺序可能不同的）译文配对：先按共同的数字、英文单词打分配对，剩下的按顺序 */
  function alignTr(orig, trs) {
    function toks(s) {
      var t = {}, plain = htmlToText(s).toLowerCase();
      (plain.match(/\d+/g) || []).forEach(function (n) { t['#' + n] = 2; });
      (plain.match(/[a-z][a-z'-]{2,}/g) || []).forEach(function (w) { if (!/^(the|and|you|your|has|have|not|from|with|now|this|that|are|was|new|total|been|for|its|it's|gained|lost)$/.test(w)) t[w] = 1; });
      return t;
    }
    var A = orig.map(toks), B = trs.map(toks), pairs = [];
    A.forEach(function (a, i) { B.forEach(function (b, j) {
      var sc = 0; Object.keys(a).forEach(function (k) { if (b[k]) sc += a[k]; });
      if (sc > 0) pairs.push([sc, i, j]);
    }); });
    pairs.sort(function (x, y) { return y[0] - x[0] || x[1] - y[1]; });
    var out = orig.map(function () { return null; }), usedB = {};
    pairs.forEach(function (p) { if (out[p[1]] === null && !usedB[p[2]]) { out[p[1]] = trs[p[2]]; usedB[p[2]] = 1; } });
    var rest = trs.filter(function (t, j) { return !usedB[j]; }), left = out.filter(function (v) { return v === null; }).length;
    // 剩下的只有数量正好一致时才按顺序补齐；否则宁可不配，也不配错
    var fill = rest.length === left;
    return out.map(function (v) { return v !== null ? v : (fill && rest.length ? rest.shift() : ''); });
  }

  /* ---------- 文本工具 ---------- */
  var ALLOWED = new Set(['B','I','EM','STRONG','BR','P','SPAN','DIV','U','S','SMALL','SUP','SUB','UL','OL','LI',
    'BLOCKQUOTE','HR','H1','H2','H3','H4','H5','H6','A','FONT','CENTER','TABLE','TBODY','TR','TD','TH']);
  var DROP = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','IMG','LINK','META','SVG','VIDEO','AUDIO','FORM','INPUT','BUTTON']);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var HAS_ENTITY = /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]{1,31});/i;
  function looksHtml(s) { return /<\s*\/?\s*[a-z][^>]*>/i.test(s || ''); }
  function parse(html) {
    var doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    return doc.body.firstChild;
  }
  function clean(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 1) {
        if (DROP.has(n.tagName)) { n.remove(); return; }
        clean(n);
        if (!ALLOWED.has(n.tagName)) {
          var frag = n.ownerDocument.createDocumentFragment();
          while (n.firstChild) frag.appendChild(n.firstChild);
          n.replaceWith(frag);
          return;
        }
        Array.prototype.slice.call(n.attributes).forEach(function (a) { n.removeAttribute(a.name); });
      } else if (n.nodeType !== 3) {
        n.remove();
      }
    });
  }
  /** 把游戏给的描述（可能是 HTML，也可能是纯文本）转成安全可显示的 HTML，不丢任何文字 */
  function toSafeHtml(s) {
    s = s == null ? '' : String(s);
    if (!looksHtml(s)) {
      if (!HAS_ENTITY.test(s)) return esc(s).replace(/\r?\n/g, '<br>');
      // 纯文本里带了 &ndash; 之类的实体：只转义尖括号，让实体正常解码
      s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>');
    }
    var root = parse(s);
    clean(root);
    return root.innerHTML;
  }
  /** HTML → 纯文本（保留段落换行） */
  function htmlToText(s) {
    s = s == null ? '' : String(s);
    if (!looksHtml(s)) {
      if (!HAS_ENTITY.test(s)) return s.trim();
      var ta = document.createElement('textarea'); ta.innerHTML = s; return ta.value.trim();
    }
    var root = parse(s);
    root.querySelectorAll('br').forEach(function (b) { b.replaceWith('\n'); });
    root.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,blockquote,tr').forEach(function (b) { b.append('\n\n'); });
    return root.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function dayLabel(r) { return (r.kind === 'journal' && !(r.journal && r.journal.date)) ? '游戏日志（游戏内日期）' : fmtDay(r.t); }
  function fmtDay(t) { var d = new Date(t); return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日'; }
  function stamp() { var d = new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()); }

  function journalBlock(r) {
    var j = r.journal || {}, parts = [];
    if (j.flDate) parts.push(j.flDate);
    if (j.tags && j.tags.length) parts.push('标签：' + j.tags.join('、'));
    return parts;
  }
  function storyName(r) {
    if (r.kind === 'raw') return '（接口原始记录）';
    if (r.kind === 'journal') return '游戏日志';
    return (r.storylet && r.storylet.name) || (r.outcome && r.outcome.name) || '（未知故事）';
  }
  function searchText(r) {
    if (r._s) return r._s;
    var parts = [r.char, r.area, r.note];
    if (r.storylet) parts.push(r.storylet.name, htmlToText(r.storylet.description));
    if (r.branch) parts.push(r.branch.name, htmlToText(r.branch.description));
    if (r.storylet && r.storylet.requirements) r.storylet.requirements.forEach(function (q) { parts.push(htmlToText(q.tooltip || q.name)); });
    if (r.storylet && r.storylet.branches) r.storylet.branches.forEach(function (b) { (b.requirements || []).forEach(function (q) { parts.push(htmlToText(q.tooltip || q.name)); }); parts.push(htmlToText(b.name), htmlToText(b.description)); (b.challenges || []).forEach(function (c) { parts.push(htmlToText(c.name), htmlToText(c.description)); }); });
    if (r.journalEntry) parts.push(htmlToText(r.journalEntry.title), htmlToText(r.journalEntry.playerMessage), r.journalEntry.flDate);
    if (r.journaled) parts.push(r.journaled.message);
    if (r.tr) (function walk(x) { if (typeof x === 'string') parts.push(x); else if (x && typeof x === 'object') Object.keys(x).forEach(function (k) { walk(x[k]); }); })(r.tr);
    if (r.outcome) parts.push(r.outcome.name, htmlToText(r.outcome.description));
    (r.messages || []).forEach(function (m) { parts.push(htmlToText(m.text)); });
    parts.push(r.pageText);
    if (r.kind === 'raw' && r.raw) parts.push(r.raw.url, r.raw.res);
    if (r.journal) parts.push(r.journal.playerMessage, r.journal.flDate, (r.journal.tags || []).join(' '));
    r._s = parts.filter(Boolean).join('\n').toLowerCase();
    return r._s;
  }
  function strip(r) { var o = {}; for (var k in r) if (k.charAt(0) !== '_') o[k] = r[k]; return o; }

  /* ---------- 存储 ---------- */
  function makeIDBStore(name) {
    var STORE = 'records', dbp = null;
    function db() {
      if (!dbp) dbp = new Promise(function (res, rej) {
        var r = indexedDB.open(name, 1);
        r.onupgradeneeded = function () {
          var d = r.result;
          if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' }).createIndex('t', 't');
        };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
      return dbp;
    }
    function tx(mode, fn) {
      return db().then(function (d) {
        return new Promise(function (res, rej) {
          var t = d.transaction(STORE, mode), req = fn(t.objectStore(STORE));
          t.oncomplete = function () { res(req ? req.result : undefined); };
          t.onerror = function () { rej(t.error); };
          t.onabort = function () { rej(t.error || new Error('事务中止')); };
        });
      });
    }
    return {
      kind: 'idb',
      all: function () { return tx('readonly', function (s) { return s.getAll(); }); },
      put: function (r) { return tx('readwrite', function (s) { s.put(strip(r)); }); },
      bulkPut: function (rs) { return tx('readwrite', function (s) { rs.forEach(function (r) { s.put(strip(r)); }); }); },
      remove: function (id) { return tx('readwrite', function (s) { s.delete(id); }); },
      clear: function () { return tx('readwrite', function (s) { s.clear(); }); }
    };
  }
  function makeMemoryStore() {
    var m = new Map();
    return {
      kind: 'memory',
      all: function () { return Promise.resolve(Array.from(m.values())); },
      put: function (r) { m.set(r.id, r); return Promise.resolve(); },
      bulkPut: function (rs) { rs.forEach(function (r) { m.set(r.id, r); }); return Promise.resolve(); },
      remove: function (id) { m.delete(id); return Promise.resolve(); },
      clear: function () { m.clear(); return Promise.resolve(); }
    };
  }
  /** 先试 IndexedDB，不可用就退回内存 */
  function makeStore(name) {
    var idb = null;
    try { if (window.indexedDB) idb = makeIDBStore(name); } catch (e) { idb = null; }
    if (!idb) return Promise.resolve(makeMemoryStore());
    return idb.all().then(function () { return idb; }, function () { return makeMemoryStore(); });
  }

  /* ---------- 导出 ---------- */
  /** 选项列表（纯文本 / Markdown 共用） */
  function optionLines(opts, labels, trB, md) {
    var L = [];
    opts.forEach(function (b) {
      var lab = labels[String(b.id)], tb = (trB || {})[String(b.id)] || {};
      var nm = PT(b.name, tb.name).replace(/\n/g, ' / '), ds = b.description ? PT(b.description, tb.description) : '';
      var mark = lab ? '（' + lab + '）' : b.isLocked ? '（未解锁）' : '';
      if (md) {
        L.push('- ' + (lab ? '**▶ ' + nm + mark + '**' : nm + mark) + (ds ? ' — ' + ds.replace(/\n+/g, ' ') : ''));
        L.push.apply(L, reqText(b.requirements, '  - 条件：'));
        (b.challenges || []).forEach(function (c, i) { var tc = (tb.challenges || [])[i] || {}; L.push('  - ' + PT(c.name, tc.name).replace(/\n/g, ' / ') + '：' + PT(c.description, tc.description).replace(/\n+/g, ' ')); });
      } else {
        L.push((lab ? '  ▶ ' : '  · ') + nm + mark);
        if (ds) L.push('      ' + ds.replace(/\n/g, '\n      '));
        L.push.apply(L, reqText(b.requirements, '      条件：'));
        (b.challenges || []).forEach(function (c, i) { var tc = (tb.challenges || [])[i] || {}; L.push('      〔' + PT(c.name, tc.name).replace(/\n/g, ' / ') + '〕' + PT(c.description, tc.description).replace(/\n/g, ' ')); });
      }
    });
    return L;
  }
  function msgLines(r, prefix) {
    return (r.messages || []).map(function (m, i) { return prefix + PT(m.text, msgTr(r, i)).replace(/\n/g, ' / '); });
  }
  function journalLine(r) {
    if (r.journalEntry) return '游戏日志：' + htmlToText(r.journalEntry.title) + (r.journalEntry.flDate ? '（' + r.journalEntry.flDate + '）' : '');
    if (r.journaled) return '已存入游戏日志：' + r.journaled.message;
    return '';
  }
  function recToText(r) {
    var L = [];
    L.push('【' + fmtTime(r.t) + '】' + (r.char ? '  角色：' + r.char : '') + (r.area ? '  地点：' + r.area : ''));
    if (r.kind === 'raw') {
      L.push('接口：' + (r.raw && r.raw.url));
      L.push(r.raw && r.raw.res || '');
      return L.join('\n');
    }
    var ts = trOf(r, 'storylet') || {}, to = trOf(r, 'outcome') || {};
    if (r.storylet) {
      L.push('故事：' + PT(r.storylet.name || '', ts.name).replace(/\n/g, ' / '));
      if (r.storylet.description) L.push(PT(r.storylet.description, ts.description));
      L.push.apply(L, reqText(r.storylet.requirements, '解锁条件：'));
    }
    var bl = branchList(r), labels = {};
    bl.forEach(function (b) { if (b._chosen) labels[String(b.id)] = '已选择'; });
    if (bl.length) { L.push('', bl.length > 1 ? '当时的选项：' : '选择：'); L.push.apply(L, optionLines(bl, labels, trOf(r, 'branches'))); }
    if (journalLine(r)) L.push('', journalLine(r));
    if (r.kind === 'journal') {
      L.push('〔游戏日志〕' + journalBlock(r).join(' · '));
      if (r.journal && r.journal.playerMessage) L.push('我的留言：' + r.journal.playerMessage);
    }
    if (r.outcome) {
      L.push('', '结果：' + PT(r.outcome.name || '', to.name).replace(/\n/g, ' / '));
      if (r.outcome.description) L.push(PT(r.outcome.description, to.description));
    }
    if (r.messages && r.messages.length) { L.push('', '变化：'); L.push.apply(L, msgLines(r, '  · ')); }
    if (r.note) L.push('', '笔记：' + r.note);
    return L.join('\n');
  }
  function exportTXT(recs) {
    return '沦敦故事回顾  导出于 ' + fmtTime(Date.now()) + '  共 ' + recs.length + ' 条\n\n' +
      buildGroups(recs).map(function (g) { return g.length > 1 ? groupToText(g) : recToText(g[0]); }).join('\n\n' + '─'.repeat(40) + '\n\n') + '\n';
  }
  /** 同一故事的多次选择：故事和选项只写一遍；同一选项、同一结果的重复只写一次 */
  function groupToText(recs) {
    var g = groupOptions(recs), first = g.chron[0], last = g.chron[g.chron.length - 1], L = [];
    var st = last.storylet && last.storylet.description ? last.storylet : first.storylet, ts = g.trSt || {};
    L.push('【' + fmtTime(first.t) + ' – ' + fmtTime(last.t).slice(11) + '】' + (last.char ? '  角色：' + last.char : '') + (last.area ? '  地点：' + last.area : '') + '  同一故事 ' + recs.length + ' 次选择');
    storySegments(g.chron).forEach(function (seg, si) {
      var sg = groupOptions(seg.recs, seg.ns), sst = (seg.ref.storylet && seg.ref.storylet.description) ? seg.ref.storylet : st, sts = sg.trSt || ts;
      if (si > 0) L.push('', '〔故事页的文字变了（随进度变化）· 从第 ' + seg.ns[0] + ' 次选择起〕');
      L.push((si ? '' : '故事：') + PT(sst.name, sts.name).replace(/\n/g, ' / '));
      if (sst.description) L.push(PT(sst.description, sts.description));
      L.push.apply(L, reqText(sst.requirements, '解锁条件：'));
      L.push('', '当时的选项：');
      L.push.apply(L, optionLines(sg.opts, sg.labels, sg.trB));
      groupBlocks(sg.chron, seg.ns).forEach(function (blk) {
        var r = blk.recs[0], tb = sg.trB[r.branch ? String(r.branch.id) : ''] || {}, to = trOf(r, 'outcome') || {};
        L.push('', '—— 第 ' + blk.ns.join('、') + ' 次：选择了「' + (r.branch ? PT(r.branch.name, tb.name).replace(/\n/g, ' / ') : '（未选择）') + '」' + (blk.recs.length > 1 ? '（×' + blk.recs.length + '，结果相同）' : '  ' + fmtTime(r.t).slice(11)) + ' ——');
        if (r.outcome) { L.push('结果：' + PT(r.outcome.name, to.name).replace(/\n/g, ' / ')); if (r.outcome.description) L.push(PT(r.outcome.description, to.description)); }
        if (blk.msgsDiffer) blk.recs.forEach(function (x, i) { L.push('变化（第 ' + blk.ns[i] + ' 次）：'); L.push.apply(L, msgLines(x, '  · ')); });
        else if (r.messages && r.messages.length) { L.push('变化：'); L.push.apply(L, msgLines(r, '  · ')); }
        blk.recs.forEach(function (x, i) {
          var jl = journalLine(x); if (jl) L.push(jl);
          if (x.note) L.push('笔记' + (blk.recs.length > 1 ? '（第 ' + blk.ns[i] + ' 次）' : '') + '：' + x.note);
        });
      });
    });
    return L.join('\n');
  }
  function mdQuote(s) { return String(s || '').split('\n').map(function (l) { return '> ' + l; }).join('\n'); }
  function exportMD(recs) {
    var out = ['# 沦敦故事回顾', '', '导出于 ' + fmtTime(Date.now()) + '，共 ' + recs.length + ' 条。', ''];
    var day = '';
    buildGroups(recs).forEach(function (grp) {
      var r = grp[0];
      var d = dayLabel(r);
      if (d !== day) { day = d; out.push('## ' + d, ''); }
      if (grp.length > 1) {
        var g = groupOptions(grp), last = g.chron[g.chron.length - 1], st = last.storylet && last.storylet.description ? last.storylet : g.chron[0].storylet, ts = g.trSt || {};
        out.push('### ' + PT(st.name, ts.name).replace(/\n/g, ' / ') + '（' + grp.length + ' 次选择）', '');
        out.push('*' + fmtTime(g.chron[0].t) + ' – ' + fmtTime(last.t).slice(11) + (last.char ? ' · ' + last.char : '') + (last.area ? ' · ' + last.area : '') + '*', '');
        storySegments(g.chron).forEach(function (seg, si) {
          var sg = groupOptions(seg.recs, seg.ns), sst = (seg.ref.storylet && seg.ref.storylet.description) ? seg.ref.storylet : st, sts = sg.trSt || ts;
          if (si > 0) out.push('*〔故事页的文字变了（随进度变化）· 从第 ' + seg.ns[0] + ' 次选择起〕*', '');
          if (sst.description) out.push(mdQuote(PT(sst.description, sts.description)), '');
          out.push('**当时的选项：**', '');
          out.push.apply(out, optionLines(sg.opts, sg.labels, sg.trB, true));
          out.push('');
          groupBlocks(sg.chron, seg.ns).forEach(function (blk) {
            var x = blk.recs[0], tb = sg.trB[x.branch ? String(x.branch.id) : ''] || {}, to = trOf(x, 'outcome') || {};
            out.push('#### 第 ' + blk.ns.join('、') + ' 次：选择了「' + (x.branch ? PT(x.branch.name, tb.name).replace(/\n/g, ' / ') : '（未选择）') + '」' + (blk.recs.length > 1 ? '（×' + blk.recs.length + '，结果相同）' : '') + (blk.recs.some(function (y) { return y.starred; }) ? ' ★' : ''), '');
            blk.recs.forEach(function (y) { if (y.journalEntry) out.push('*游戏日志：' + htmlToText(y.journalEntry.title) + (y.journalEntry.flDate ? '（' + y.journalEntry.flDate + '）' : '') + '*', ''); });
            if (x.outcome) out.push('**' + PT(x.outcome.name || '结果', to.name).replace(/\n/g, ' / ') + '**', '', PT(x.outcome.description, to.description), '');
            if (blk.msgsDiffer) blk.recs.forEach(function (y, i) { out.push('*第 ' + blk.ns[i] + ' 次的变化：*'); out.push.apply(out, msgLines(y, '- ')); out.push(''); });
            else if (x.messages && x.messages.length) { out.push.apply(out, msgLines(x, '- ')); out.push(''); }
            blk.recs.forEach(function (y) { if (y.note) out.push('> 📝 ' + y.note.replace(/\n/g, '\n> '), ''); });
          });
        });
        return;
      }
      if (r.kind === 'raw') { out.push('### ' + fmtTime(r.t) + ' 接口记录', '', '`' + (r.raw && r.raw.url) + '`', '', '```json', r.raw && r.raw.res || '', '```', ''); return; }
      if (r.kind === 'journal') {
        out.push('### ' + ((r.outcome && r.outcome.name) || '游戏日志'), '', '*游戏日志' + (r.area ? ' · ' + r.area : '') + (journalBlock(r).length ? ' · ' + journalBlock(r).join(' · ') : '') + '*', '');
        if (r.journal && r.journal.playerMessage) out.push('> ' + r.journal.playerMessage, '');
        if (r.outcome && r.outcome.description) out.push(htmlToText(r.outcome.description), '');
        if (r.note) out.push('> 📝 ' + r.note.replace(/\n/g, '\n> '), '');
        return;
      }
      var ts1 = trOf(r, 'storylet') || {}, to1 = trOf(r, 'outcome') || {}, tb1 = (trOf(r, 'branches') || {})[r.branch ? String(r.branch.id) : ''] || {};
      out.push('### ' + PT(r.storylet ? r.storylet.name : storyName(r), ts1.name).replace(/\n/g, ' / ') + (r.branch && r.branch.name ? ' › ' + PT(r.branch.name, tb1.name).replace(/\n/g, ' / ') : ''), '');
      out.push('*' + fmtTime(r.t) + (r.char ? ' · ' + r.char : '') + (r.area ? ' · ' + r.area : '') + (r.starred ? ' · ★' : '') + '*', '');
      if (r.storylet && r.storylet.description) out.push(mdQuote(PT(r.storylet.description, ts1.description)), '');
      var bl2 = branchList(r), lab2 = {};
      bl2.forEach(function (b) { if (b._chosen) lab2[String(b.id)] = '已选择'; });
      if (bl2.length > 1) { out.push('**当时的选项：**', ''); out.push.apply(out, optionLines(bl2, lab2, trOf(r, 'branches'), true)); out.push(''); }
      else if (r.branch && r.branch.description) out.push('**选择：' + PT(r.branch.name || '', tb1.name).replace(/\n/g, ' / ') + '**', '', mdQuote(PT(r.branch.description, tb1.description)), '');
      if (r.journalEntry) out.push('*游戏日志：' + htmlToText(r.journalEntry.title) + (r.journalEntry.flDate ? '（' + r.journalEntry.flDate + '）' : '') + '*', '');
      if (r.outcome) out.push('**' + PT(r.outcome.name || '结果', to1.name).replace(/\n/g, ' / ') + '**', '', PT(r.outcome.description, to1.description), '');
      if (r.messages && r.messages.length) { out.push.apply(out, msgLines(r, '- ')); out.push(''); }
      if (r.note) out.push('> 📝 ' + r.note.replace(/\n/g, '\n> '), '');
    });
    return out.join('\n');
  }
  function exportHTML(recs, css) {
    var day = '', parts = [];
    buildGroups(recs).forEach(function (g) {
      var d = dayLabel(g[0]);
      if (d !== day) { day = d; parts.push('<h2 class="day"><span>' + d + '</span></h2>'); }
      parts.push(renderGroup(g, { static: true }));
    });
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>沦敦故事回顾</title>' + FONT_LINK + '<style>' + css + '\nbody{margin:0;background:#1d1d1d}.root{display:block}.list{max-width:1000px;margin:0 auto;overflow:visible}' +
      '.rec .meta button,.rec .tabs{display:none}.flview{min-height:100vh}</style></head><body><div class="root"><div class="list flview">' +
      '<div class="fl-doc-head"><h1 class="fl-doc-title">沦敦故事回顾</h1><p class="fl-doc-sub">导出于 ' + fmtTime(Date.now()) + '，共 ' + recs.length + ' 条</p></div><div class="fl-tab">' +
      parts.join('\n') + '</div></div></div><script>document.addEventListener("error",function(e){var t=e.target;if(!t||t.tagName!=="IMG")return;var f=t.getAttribute("data-fb");if(f&&t.src!==f){t.removeAttribute("data-fb");t.src=f;return;}t.parentNode.classList.add("noimg");t.remove();},true);<\/script></body></html>';
  }
  function exportJSON(recs) {
    return JSON.stringify({ format: 'fl-chronicle', version: 1, exportedAt: new Date().toISOString(), count: recs.length, records: recs.map(strip) }, null, 1);
  }
  function download(name, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    (document.body || document.documentElement).appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  /** 解析导入文件（本工具的备份，或纯记录数组） */
  function parseImport(text) {
    var data = JSON.parse(text);
    var arr = Array.isArray(data) ? data : (data && Array.isArray(data.records) ? data.records : null);
    if (!arr) throw new Error('不是沦敦故事回顾的备份文件');
    return arr.filter(function (r) { return r && r.id && r.t; });
  }

  /* ---------- 单条记录渲染 ---------- */
  function renderRec(r, opt) {
    opt = opt || {};
    var h = [];
    h.push('<article class="rec' + (r.starred ? ' starred' : '') + '" data-id="' + esc(r.id) + '">');
    h.push('<div class="meta"><time>' + fmtTime(r.t) + '</time>' +
      (r.char ? '<span>· ' + esc(r.char) + '</span>' : '') +
      (r.area ? '<span>· ' + esc(r.area) + '</span>' : '') + journalTag(r) +
      (opt.static && r.starred ? '<span>★</span>' : '') + '<span class="sp"></span>' +
      '<button data-a="star" class="' + (r.starred ? 'on' : '') + '" title="星标">' + (r.starred ? '★' : '☆') + '</button>' +
      '<button data-a="note">笔记</button><button data-a="copy">复制</button>' +
      (r.raw ? '<button data-a="raw">原始数据</button>' : '') +
      '<button data-a="del" class="danger">删除</button></div>');

    if (r.kind === 'raw') {
      h.push('<div class="crumb">接口记录 <span class="br">' + esc(r.raw && r.raw.url) + '</span></div>');
      h.push('<pre class="raw">' + esc(r.raw && r.raw.res) + '</pre></article>');
      return h.join('');
    }

    h.push('<div class="crumb"><span class="st">' + esc(storyName(r)) + '</span>' +
      (r.branch ? '<span class="arrow">›</span><span class="br">' + esc(r.branch.name || '（选项 #' + r.branch.id + '）') + '</span>' : '') + '</div>');

    var ctx = [];
    if (r.storylet && r.storylet.description) ctx.push('<div class="sub"><b>' + esc(r.storylet.name) + '</b><div class="body">' + toSafeHtml(r.storylet.description) + '</div></div>');
    if (r.branch && r.branch.description) ctx.push('<div class="sub"><b>选择：' + esc(r.branch.name) + '</b><div class="body">' + toSafeHtml(r.branch.description) + '</div></div>');
    if (ctx.length) h.push('<details' + (opt.openCtx ? ' open' : '') + '><summary>故事开头与所选选项原文</summary>' + ctx.join('') + '</details>');

    if (r.outcome) h.push('<h3>' + esc(r.outcome.name || '结果') + (r.outcome.linked ? '<span class="tag">接续故事</span>' : '') + '</h3>');
    if (r.pageText && !opt.static) h.push('<div class="tabs"><button data-a="tab" data-v="orig" class="on">游戏原文</button><button data-a="tab" data-v="page">页面显示文本</button></div>');
    h.push('<div class="body orig">' + (r.outcome ? toSafeHtml(r.outcome.description) : '<i>（这次请求没有解析出结果正文，请查看“原始数据”。）</i>') + '</div>');
    if (r.pageText) {
      if (opt.static) h.push('<details><summary>页面显示文本</summary><div class="body pre">' + esc(r.pageText) + '</div></details>');
      else h.push('<div class="body pre page hidden">' + esc(r.pageText) + '</div>');
    }
    if (r.messages && r.messages.length) {
      h.push('<ul class="msgs">' + r.messages.map(function (m) { return '<li>' + toSafeHtml(m.text) + '</li>'; }).join('') + '</ul>');
    }
    if (r.note) h.push('<div class="notetext">' + esc(r.note) + '</div>');
    h.push('</article>');
    return h.join('');
  }


  /* ---------- 沦敦风格渲染 ---------- */
  var IMG_BASE = 'https://images.fallenlondon.com/icons/';
  function iconUrl(name, small) {
    if (!name) return '';
    if (/^(https?:)?\/\//.test(name)) return name;
    return IMG_BASE + encodeURIComponent(String(name).replace(/\.png$/i, '')) + (small ? 'small' : '') + '.png';
  }
  function icon(name, cls, small) {
    if (!name) return '<div class="' + cls + ' noimg"></div>';
    return '<div class="' + cls + '"><img loading="lazy" alt="" src="' + esc(iconUrl(name, small)) + '" data-fb="' + esc(iconUrl(name, !small)) + '"></div>';
  }
  /** 旧记录没有单独存图片名：从原始数据里补出来（只在显示时用，不改存档） */
  function enrich(r) {
    if (r._en || !r.raw || !r.raw.res) return r;
    r._en = true;
    try {
      var res = JSON.parse(r.raw.res), end = res.endStorylet, ev = end && (end.event || end);
      if (r.outcome && !r.outcome.image) {
        var src = (ev && ev.image) ? ev : (res.storylet || null);
        if (src && src.image) r.outcome.image = src.image;
      }
      if (r.outcome && r.outcome.linking == null && end) r.outcome.linking = !!(end.isLinkingEvent || end.isDirectLinkingEvent);
      if (r.outcome && !r.outcome.linked) {
        var roll = (Array.isArray(res.messages) ? res.messages : []).map(function (m) { return m && m.type || ''; }).join(' ');
        r.outcome.success = /DifficultyRollFailure/.test(roll) ? false : /DifficultyRollSuccess/.test(roll) ? true : null;
      }
      if (r.messages && r.messages.length && r.messages.every(function (m) { return !m.image; })) {
        var imgs = [];
        (function walk(x) {
          if (!x) return;
          if (Array.isArray(x)) { x.forEach(walk); return; }
          if (typeof x === 'object') {
            if (typeof x.message === 'string') imgs.push(x.image || (x.possession && x.possession.image) || (x.quality && x.quality.image) || '');
            else Object.keys(x).forEach(function (k) { if (x[k] && typeof x[k] === 'object') walk(x[k]); });
          }
        })(res.messages);
        if (imgs.length === r.messages.length) r.messages.forEach(function (m, i) { m.image = imgs[i]; });
      }
    } catch (e) {}
    return r;
  }
  function metaBar(r, opt) {
    var sub = opt && opt.sub;
    return '<div class="meta">' + (r.kind === 'journal' ? '<span class="jtag">游戏日志</span>' + (r.journal && r.journal.date ? '<time>' + fmtTime(r.t) + '</time>' : '') : '<time>' + fmtTime(r.t) + '</time>') +
      (r.char ? '<span>· ' + esc(r.char) + '</span>' : '') +
      (r.area ? '<span>· ' + esc(r.area) + '</span>' : '') + journalTag(r) + (sub ? '' : bookChips(storyKey(r))) +
      (opt.static && r.starred ? '<span>★</span>' : '') + '<span class="sp"></span>' +
      (sub || !storyKey(r) ? '' : '<button data-a="book" title="收入日志本">📖 日志本</button>') +
      '<button data-a="star" class="' + (r.starred ? 'on' : '') + '" title="星标">' + (r.starred ? '★' : '☆') + '</button>' +
      '<button data-a="note">笔记</button><button data-a="copy">复制</button>' +
      (r.raw ? '<button data-a="raw">原始数据</button>' : '') +
      '<button data-a="del" class="danger">删除</button></div>';
  }

  /* ---------- 日志本（把故事分门别类、按顺序串起来） ---------- */
  /** 一个“故事”的标识：同一个游戏故事（storylet）；只有游戏日志内容的条目各自算一个 */
  function storyKey(r) {
    if (!r) return null;
    if (r.storylet && r.storylet.id != null && (r.kind === 'choice' || r.kind === 'storylet')) return 's:' + r.storylet.id;
    if (r.kind === 'journal') return 'j:' + r.id;
    return null;
  }
  function storyInfo(recs) {
    var last = recs[recs.length - 1] || {}, img = '', name = '';
    for (var i = recs.length - 1; i >= 0 && !(name && img); i--) {
      var r = recs[i];
      if (!name) name = r.kind === 'journal' ? htmlToText((r.outcome || {}).name) : htmlToText((r.storylet || {}).name);
      if (!img) img = r.kind === 'journal' ? (r.outcome || {}).image : (r.storylet || {}).image;
    }
    return { name: name || '（未命名故事）', image: img || '', char: last.char || '' };
  }
  /** 当前所有日志本：故事 → 所在日志本 */
  var BOOK_INDEX = {};
  function setBookIndex(books) {
    BOOK_INDEX = {};
    books.forEach(function (b) { (b.chapters || []).forEach(function (c) { (BOOK_INDEX[c.key] = BOOK_INDEX[c.key] || []).push({ id: b.id, name: b.name }); }); });
  }
  function bookChips(key) {
    if (!key) return '';
    return '<span class="bchips" data-key="' + esc(key) + '">' + (BOOK_INDEX[key] || []).map(function (b) { return '<span class="bchip">📖 ' + esc(b.name) + '</span>'; }).join('') + '</span>';
  }
  /** 根据游戏里“一个选择直接接到下一个故事”的情况，找出故事之间的连接 */
  function linkGraph(recs) {
    var adj = {}, list = recs.filter(function (r) { return storyKey(r); }).sort(function (a, b) { return a.t - b.t; });
    function edge(a, b) { if (!a || !b || a === b) return; (adj[a] = adj[a] || {})[b] = 1; (adj[b] = adj[b] || {})[a] = 1; }
    list.forEach(function (r, i) {
      enrich(r);
      var k = storyKey(r), o = r.outcome;
      if (!o) return;
      if (o.linked && o.id != null) edge(k, 's:' + o.id);
      if (o.linking || o.linked) {
        for (var j = i + 1; j < list.length && list[j].t - r.t < 20 * 60 * 1000; j++) {
          if (list[j].char !== r.char) continue;
          edge(k, storyKey(list[j])); break;
        }
      }
    });
    return adj;
  }
  /** 连在一起的故事群（自动发现的故事线），按第一次出现的时间排序 */
  function storyLines(recs) {
    var adj = linkGraph(recs), seen = {}, first = {}, lines = [];
    recs.forEach(function (r) { var k = storyKey(r); if (k && (first[k] == null || r.t < first[k])) first[k] = r.t; });
    Object.keys(adj).forEach(function (k) {
      if (seen[k]) return;
      var comp = [], stack = [k]; seen[k] = 1;
      while (stack.length) { var x = stack.pop(); comp.push(x); Object.keys(adj[x] || {}).forEach(function (y) { if (!seen[y]) { seen[y] = 1; stack.push(y); } }); }
      if (comp.length > 1) lines.push(comp.sort(function (a, b) { return (first[a] || 0) - (first[b] || 0); }));
    });
    return lines;
  }
  function newBookId() { return 'book-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  /** 导出一本日志：网页 / Markdown / 纯文本 */
  function exportBook(book, byKey, fmt, css) {
    var chs = (book.chapters || []).map(function (c, i) {
      var recs = (byKey[c.key] || []).slice().sort(function (a, b) { return a.t - b.t; });
      return { n: i + 1, name: recs.length ? storyInfo(recs).name : c.name, recs: recs };
    });
    if (fmt === 'html') {
      var body = chs.map(function (c) {
        return '<h2 class="day chap-h"><span>第 ' + c.n + ' 章 · ' + esc(c.name) + '</span></h2>' +
          (c.recs.length ? renderGroup(c.recs, { static: true }) : '<p class="fl-jmeta">（这一章暂时没有记录）</p>');
      }).join('\n');
      return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>' + esc(book.name) + ' · 沦敦故事回顾</title>' + FONT_LINK + '<style>' + css +
        '\nbody{margin:0;background:#1d1d1d}.root{display:block}.list{overflow:visible}.rec .meta button,.fl-gmeta button,.tabs{display:none}.flview{min-height:100vh}</style></head><body><div class="root"><div class="list flview">' +
        '<div class="fl-doc-head"><h1 class="fl-doc-title">📖 ' + esc(book.name) + '</h1><p class="fl-doc-sub">' + (book.desc ? esc(book.desc) + ' · ' : '') + chs.length + ' 章 · 导出于 ' + fmtTime(Date.now()) + '</p></div>' +
        '<div class="fl-tab">' + body + '</div></div></div><script>document.addEventListener("error",function(e){var t=e.target;if(!t||t.tagName!=="IMG")return;var f=t.getAttribute("data-fb");if(f&&t.src!==f){t.removeAttribute("data-fb");t.src=f;return;}t.parentNode.classList.add("noimg");t.remove();},true);<\/script></body></html>';
    }
    if (fmt === 'md') {
      var out = ['# 📖 ' + book.name, ''];
      if (book.desc) out.push(book.desc, '');
      out.push('*' + chs.length + ' 章 · 导出于 ' + fmtTime(Date.now()) + '*', '');
      chs.forEach(function (c) {
        out.push('## 第 ' + c.n + ' 章 · ' + c.name, '');
        if (!c.recs.length) { out.push('（这一章暂时没有记录）', ''); return; }
        var md = exportMD(c.recs), at = md.indexOf('\n## ');
        out.push(md.slice(at + 1).replace(/^(#{2,5}) /gm, '#$1 '), '');
      });
      return out.join('\n');
    }
    return '📖 ' + book.name + '\n' + (book.desc ? book.desc + '\n' : '') + '导出于 ' + fmtTime(Date.now()) + '\n\n' + chs.map(function (c) {
      var t = c.recs.length ? exportTXT(c.recs) : '（这一章暂时没有记录）\n';
      return '════ 第 ' + c.n + ' 章 · ' + c.name + ' ════\n\n' + t.slice(t.indexOf('\n') + 1).replace(/^\n+/, '');
    }).join('\n\n');
  }
  /** 记录里的全部选项（老记录只有所选的那一个） */
  function branchList(r) {
    var chosenId = r.branch ? String(r.branch.id) : null;
    var list = (r.storylet && Array.isArray(r.storylet.branches) && r.storylet.branches.length) ? r.storylet.branches.slice() : [];
    if (!list.length && r.branch) list = [r.branch];
    var found = false;
    list = list.map(function (b) { var c = chosenId !== null && String(b.id) === chosenId; if (c) found = true; return Object.assign({}, b, { _chosen: c }); });
    if (r.branch && !found) list.push(Object.assign({}, r.branch, { _chosen: true }));
    return list;
  }
  /* 解锁条件：游戏里选项/故事右下角的小图标（悬停显示说明） */
  function reqLocked(q) { return /lock/i.test(q.status || '') && !/unlock/i.test(q.status || ''); }
  function reqIcons(reqs) {
    if (!reqs || !reqs.length) return '';
    return '<span class="fl-reqicons">' + reqs.map(function (q) {
      return '<span class="fl-reqicon' + (reqLocked(q) ? ' locked' : '') + '" title="' + esc(htmlToText(q.tooltip || q.name)) + '">' +
        (q.image ? '<img alt="" src="' + esc(iconUrl(q.image, true)) + '">' : '<span class="fl-reqdot"></span>') + '</span>';
    }).join('') + '</span>';
  }
  function reqList(reqs) {
    if (!reqs || !reqs.length) return '';
    return '<ul class="fl-reqlist">' + reqs.map(function (q) {
      return '<li class="' + (reqLocked(q) ? 'locked' : '') + '">' + (reqLocked(q) ? '✗ ' : '✓ ') + toSafeHtml(q.tooltip || q.name) + '</li>';
    }).join('') + '</ul>';
  }
  function reqText(reqs, indent) {
    return (reqs || []).map(function (q) { return indent + (reqLocked(q) ? '✗ ' : '✓ ') + htmlToText(q.tooltip || q.name); });
  }
  function renderBranch(b, chosen, label, tb) {
    tb = tb || {};
    var ch = (b.challenges || []).map(function (c, i) {
      var tc = (tb.challenges || [])[i] || {};
      return '<div class="fl-challenge">' + icon(c.image, 'fl-cicon', true) + '<div><div class="fl-h4">' + TT(c.name || '挑战', tc.name) + '</div>' +
        (c.description ? '<div class="fl-cdesc">' + TB(c.description, tc.description) + '</div>' : '') + '</div></div>';
    }).join('');
    var req = reqList(b.requirements);
    return '<section class="fl-branch' + (chosen ? ' chosen' : ' other') + (b.isLocked ? ' locked' : '') + '"><div class="fl-left">' + icon(b.image, 'fl-card') + '</div><div class="fl-body">' +
      '<h3 class="fl-h3">' + TT(b.name || '（选项 #' + b.id + '）', tb.name) + '</h3>' +
      (b.description ? '<div class="fl-desc">' + TB(b.description, tb.description) + '</div>' : '') + ch + req +
      '<div class="fl-buttons">' + reqIcons(b.requirements) + (chosen ? '<span class="fl-btn">' + esc(label || '已选择') + '</span>' : '<span class="fl-btn fl-btn--off">' + (b.isLocked ? '未解锁' : '未选择') + '</span>') + '</div></div></section>';
  }
  function journalTag(r) {
    if (r.journalEntry) return '<span class="jtag" title="已和游戏日志条目合并">日志 · ' + esc(plainShort(r.journalEntry.title || '')) + '</span>';
    if (r.journaled) return '<span class="jtag" title="你在游戏里把它存入了日志">已存入日志</span>';
    return '';
  }
  function plainShort(h) { return htmlToText(h).replace(/\s+/g, ' ').slice(0, 40); }
  function flRoot(cls, img, title, inner, titleHtml) {
    return '<section class="fl-root ' + cls + '"><div class="fl-left">' + icon(img, 'fl-rootimg') + '</div>' +
      '<div class="fl-body"><h2 class="fl-h2">' + (titleHtml != null ? titleHtml : esc(title || '')) + '</h2>' + inner + '</div></section>';
  }
  // 故事开头 —— 游戏里的 .media--root
  function storyletPart(st, opt, tr) {
    if (!st || !(st.name || st.description)) return '';
    tr = tr || {};
    var long = htmlToText(st.description).length > 120;
    return flRoot('fl-storylet', st.image, st.name,
      '<div class="fl-desc' + (long && !opt.static ? ' clamp' : '') + '">' + TB(st.description, tr.description) + '</div>' +
      (long && !opt.static ? '<button data-a="expand" class="fl-link">展开全文</button>' : '') +
      (st.requirements && st.requirements.length ? '<div class="fl-streq">' + reqList(st.requirements) + reqIcons(st.requirements) + '</div>' : ''), TT(st.name, tr.name));
  }
  // 故事下的选项 —— 游戏里的 .branch；按原顺序排列，选过的高亮（带“第几次选择”），其余变淡
  function optionsPart(opts, labels, opt, trB) {
    trB = trB || {};
    if (!opts.length) return '';
    var others = opts.filter(function (b) { return !labels[String(b.id)]; }).length, h = [];
    h.push('<div class="fl-branches' + (opt.static ? ' show-all' : '') + '">');
    opts.forEach(function (b) { var l = labels[String(b.id)]; h.push(renderBranch(b, !!l, l, trB[String(b.id)])); });
    if (others && !opt.static) h.push('<button data-a="others" class="fl-link fl-others-toggle">显示当时其他 ' + others + ' 个选项</button>');
    h.push('</div>');
    return h.join('');
  }
  // 一次选择的结果：结果正文 + 变化 + 日志 + 笔记
  function msgsPart(r) {
    if (!r.messages || !r.messages.length) return '';
    return '<section class="fl-qu">' + r.messages.map(function (m, i) {
      return '<div class="fl-q"><div class="fl-qleft">' + icon(m.image, 'fl-qicon', true) + '</div><div class="fl-qtext">' + TB(m.text, msgTr(r, i)) + '</div></div>';
    }).join('') + '</section>';
  }
  // mini：同一选项、同一结果的重复：不再重复结果正文，只列这一次的变化（若与第一次不同）
  function resultPart(r, opt, mini, showMsgs) {
    var h = [], o = r.outcome, to = trOf(r, 'outcome') || {};
    // 旧版“页面显示文本”常抓错位置，只在没有逐项译文时才保留它的切换按钮
    var oldPt = r.pageText && !r.tr;
    var inner = (oldPt && !opt.static ? '<div class="tabs"><button data-a="tab" data-v="orig" class="on">游戏原文</button><button data-a="tab" data-v="page" title="旧版抓取的页面文字，可能对不上">旧版页面文本</button></div>' : '') +
      '<div class="body orig fl-desc">' + (o ? TB(o.description, to.description) : '<i>（这次没有解析出结果正文，请查看“原始数据”。）</i>') + '</div>' +
      (oldPt && !opt.static ? '<div class="body pre page fl-desc hidden">' + esc(r.pageText) + '</div>' : '');
    if (r.kind !== 'storylet' && !mini) h.push(flRoot('fl-outcome', o && o.image, o ? o.name : '结果', inner, o ? TT(o.name, to.name) : null));
    // 变化 —— 游戏里的 .branch.media--quality-updates
    if (!mini || showMsgs) h.push(msgsPart(r));
    var je = r.journalEntry || (r.journaled && { title: r.journaled.message });
    if (je) {
      var sub2 = ((je.flDate || '') + (je.area ? ' (' + je.area + ')' : '')).trim();
      h.push('<section class="fl-qu fl-jbox"><div class="fl-jlabel">游戏日志中的这一条</div><div class="fl-h3">' + toSafeHtml(je.title || '') + '</div>' +
        (sub2 ? '<div class="fl-jmeta">' + esc(sub2) + '</div>' : '') +
        (je.playerMessage && plainShort(je.playerMessage) !== plainShort(je.title || '') ? '<div class="fl-jmsg">' + toSafeHtml(je.playerMessage) + '</div>' : '') + '</section>');
    }
    if (r.note) h.push('<div class="notetext">' + esc(r.note) + '</div>');
    return h.join('');
  }
  function renderFL(r, opt) {
    opt = opt || {};
    if (r.kind === 'raw') return renderRec(r, opt);
    enrich(r);
    var h = ['<article class="rec fl' + (r.starred ? ' starred' : '') + '" data-id="' + esc(r.id) + '">', metaBar(r, opt)];
    // 游戏日志条目 —— 按游戏日志页的样子：标题 / 游戏内日期（地点）/ 正文
    if (r.kind === 'journal') {
      var j = r.journal || {}, jo = r.outcome || {}, pm = j.playerMessage;
      var sub = ((j.flDate || '') + (r.area ? ' (' + r.area + ')' : '')).trim();
      h.push(flRoot('fl-outcome fl-journal', jo.image, '',
        (sub ? '<h3 class="fl-h3 fl-jdate">' + esc(sub) + '</h3>' : '') +
        '<div class="body orig fl-desc">' + toSafeHtml(jo.description || pm || '') + '</div>' +
        (pm && jo.description && jo.description !== pm ? '<div class="fl-jmsg">' + toSafeHtml(pm) + '</div>' : '') +
        (j.tags && j.tags.length ? '<div class="fl-jmeta">标签：' + esc(j.tags.join('、')) + '</div>' : ''), toSafeHtml(jo.name || '')));
      if (r.note) h.push('<div class="notetext">' + esc(r.note) + '</div>');
      h.push('</article>');
      return h.join('');
    }
    h.push(storyletPart(r.storylet, opt, trOf(r, 'storylet')));
    var labels = {}; if (r.branch) labels[String(r.branch.id)] = '已选择';
    h.push(optionsPart(branchList(r), labels, opt, trOf(r, 'branches')));
    h.push(resultPart(r, opt));
    h.push('</article>');
    return h.join('');
  }

  /* ---------- 同一个故事里的多次选择合并成一张故事卡 ---------- */
  function groupKey(r) {
    if ((r.kind !== 'choice' && r.kind !== 'storylet') || !r.storylet || r.storylet.id == null) return null;
    return [r.char || '', r.storylet.id, dayLabel(r)].join('|');
  }
  /** 把（当前排序下）相邻、同一故事的记录合并成一组 */
  function buildGroups(list) {
    var groups = [], cur = null, curKey = null;
    list.forEach(function (r) {
      var k = groupKey(r);
      if (k && k === curKey) cur.push(r);
      else { cur = [r]; groups.push(cur); curKey = k; }
    });
    return groups;
  }
  /** 这一组里出现过的全部选项（以最新一次为准，按游戏里的顺序），并标出第几次选了哪个 */
  function groupOptions(recs, nums) {
    var chron = recs.slice().sort(function (a, b) { return a.t - b.t; });
    var opts = [], seen = {}, labels = {}, picks = {};
    chron.slice().reverse().forEach(function (r) {
      branchList(r).forEach(function (b) { var k = String(b.id); if (!seen[k]) { seen[k] = 1; opts.push(Object.assign({}, b)); } });
    });
    // 以最新那次的选项顺序为主
    chron.forEach(function (r, i) { if (r.branch) { var k = String(r.branch.id); (picks[k] = picks[k] || []).push(nums ? nums[i] : i + 1); } });
    Object.keys(picks).forEach(function (k) { labels[k] = '第 ' + picks[k].join('、') + ' 次选择'; });
    var trSt = null, trB = {};
    chron.forEach(function (r) {
      if (r.tr && r.tr.storylet) trSt = r.tr.storylet;
      if (r.tr && r.tr.branches) Object.keys(r.tr.branches).forEach(function (k) { trB[k] = r.tr.branches[k]; });
    });
    return { chron: chron, opts: opts, labels: labels, trSt: trSt, trB: trB };
  }
  function renderGroup(recs, opt) {
    opt = opt || {};
    if (recs.length === 1) return renderFL(recs[0], opt);
    recs.forEach(enrich);
    var g = groupOptions(recs), first = g.chron[0], last = g.chron[g.chron.length - 1];
    var st = last.storylet && last.storylet.description ? last.storylet : first.storylet;
    var h = ['<div class="fl-group">'];
    var gk = storyKey(last), sameDay = fmtTime(first.t).slice(0, 10) === fmtTime(last.t).slice(0, 10);
    h.push('<div class="meta fl-gmeta"><time>' + fmtTime(first.t) + ' – ' + (sameDay ? fmtTime(last.t).slice(11) : fmtTime(last.t)) + '</time>' +
      (last.char ? '<span>· ' + esc(last.char) + '</span>' : '') + (last.area ? '<span>· ' + esc(last.area) + '</span>' : '') +
      '<span class="gcount">同一故事 · ' + recs.length + ' 次选择</span>' + bookChips(gk) + '<span class="sp"></span>' +
      (gk && !opt.static ? '<button data-a="book" data-key="' + esc(gk) + '" title="收入日志本">📖 日志本</button>' : '') + '</div>');
    var subOpt = Object.assign({}, opt, { sub: true }), segs = storySegments(g.chron);
    segs.forEach(function (seg, si) {
      var sg = groupOptions(seg.recs, seg.ns);
      if (si > 0) h.push('<div class="fl-segnote">故事页的文字变了（随进度变化）· 从第 ' + seg.ns[0] + ' 次选择起</div>');
      h.push(storyletPart(segs.length > 1 ? (seg.ref.storylet || st) : st, opt, sg.trSt || g.trSt));
      h.push(optionsPart(sg.opts, sg.labels, opt, sg.trB));
      // 同一个选项、同一个结果的多次重复：合并成一块，只列出每次不同的变化
      groupBlocks(sg.chron, seg.ns).forEach(function (blk) {
        var r0 = blk.recs[0], tb = sg.trB[r0.branch ? String(r0.branch.id) : ''] || {};
        var bn = r0.branch ? TT(r0.branch.name || '选项 #' + r0.branch.id, tb.name) : (r0.kind === 'storylet' ? '（存入日志时尚未选择）' : '（未知选项）');
        var n = blk.recs.length;
        h.push('<div class="fl-block">');
        h.push('<div class="fl-pick"><span class="fl-pick-n">第 ' + blk.ns.join('、') + ' 次</span>选择了「' + bn + '」' + (n > 1 ? '<span class="fl-pick-x">×' + n + '（结果相同）</span>' : '') + '</div>');
        h.push('<article class="rec fl sub' + (r0.starred ? ' starred' : '') + '" data-id="' + esc(r0.id) + '">' + metaBar(r0, subOpt) + resultPart(r0, opt) + '</article>');
        if (n > 1) {
          if (!blk.msgsDiffer) h.push('<div class="fl-rep-note">这 ' + n + ' 次的结果和变化完全相同。</div>');
          blk.recs.slice(1).forEach(function (r, j) {
            h.push('<article class="rec fl sub mini' + (r.starred ? ' starred' : '') + '" data-id="' + esc(r.id) + '">' +
              '<div class="fl-rep-h">第 ' + blk.ns[j + 1] + ' 次' + (blk.msgsDiffer ? '：变化' : '') + '</div>' + metaBar(r, subOpt) + resultPart(r, opt, true, blk.msgsDiffer) + '</article>');
          });
        }
        h.push('</div>');
      });
    });
    h.push('</div>');
    return h.join('');
  }
  /** 故事页文字会随进度变化：故事开头变了、或已有选项的文字变了，就分成新的一段（新解锁的选项不算） */
  function storySegments(chron) {
    var segs = [], cur = null;
    chron.forEach(function (r, i) {
      var st = r.storylet || {}, changed = !cur;
      if (cur) {
        var ref = cur.ref.storylet || {};
        if ((st.description || '') && (ref.description || '') && st.description !== ref.description) changed = true;
        else {
          var old = {}; (ref.branches || []).forEach(function (b) { old[String(b.id)] = b; });
          (st.branches || []).forEach(function (b) { var o = old[String(b.id)]; if (o && (o.name !== b.name || o.description !== b.description)) changed = true; });
        }
      }
      if (changed) { cur = { recs: [], ns: [], ref: r }; segs.push(cur); }
      cur.recs.push(r); cur.ns.push(i + 1);
      if ((st.branches || []).length >= ((cur.ref.storylet || {}).branches || []).length) cur.ref = r; // 以这一段里选项最全的一次为准
    });
    return segs;
  }
  /** 把一组记录按“同一选项 + 同一结果”分块，保持第一次出现的顺序 */
  function groupBlocks(chron, nums) {
    var blocks = [], by = {};
    chron.forEach(function (r, i) {
      var k = r.kind === 'storylet' ? 'st:' + r.id : [r.branch && r.branch.id, r.outcome && r.outcome.id, r.outcome && r.outcome.name, r.outcome && r.outcome.description].join('|');
      if (!by[k]) { by[k] = { recs: [], ns: [] }; blocks.push(by[k]); }
      by[k].recs.push(r); by[k].ns.push(nums ? nums[i] : i + 1);
    });
    blocks.forEach(function (b) {
      var m0 = JSON.stringify((b.recs[0].messages || []).map(function (m) { return m.text; }));
      b.msgsDiffer = b.recs.some(function (r) { return JSON.stringify((r.messages || []).map(function (m) { return m.text; })) !== m0; });
    });
    return blocks;
  }
  /** 图片加载失败：先换大/小图再试一次，还不行就隐藏 */
  function imgFallback(e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    var fb = t.getAttribute('data-fb');
    if (fb && t.src !== fb) { t.removeAttribute('data-fb'); t.src = fb; return; }
    if (t.parentNode) t.parentNode.classList.add('noimg');
    t.remove();
  }

  function highlight(el, q) {
    if (!q) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) {
      if (n.parentNode && /^(BUTTON|TEXTAREA|TIME)$/.test(n.parentNode.nodeName)) continue;
      if (n.nodeValue.toLowerCase().indexOf(q) >= 0) nodes.push(n);
    }
    nodes.forEach(function (t) {
      var s = t.nodeValue, low = s.toLowerCase(), i = 0, j, frag = document.createDocumentFragment();
      while ((j = low.indexOf(q, i)) >= 0) {
        frag.appendChild(document.createTextNode(s.slice(i, j)));
        var m = document.createElement('mark'); m.textContent = s.slice(j, j + q.length); frag.appendChild(m);
        i = j + q.length;
      }
      frag.appendChild(document.createTextNode(s.slice(i)));
      t.parentNode.replaceChild(frag, t);
    });
  }

  /* ---------- 主界面 ---------- */
  function mountUI(cfg) {
    // cfg: { store, mode: 'userscript'|'viewer', css, settings, saveSettings }
    var mode = cfg.mode, store = cfg.store, css = cfg.css;
    var host = document.createElement('div');
    host.id = 'flc-host';
    var shadow = host.attachShadow({ mode: 'open' });
    try {
      var sheet = new CSSStyleSheet(); sheet.replaceSync(css); shadow.adoptedStyleSheets = [sheet];
    } catch (e) {
      var st = document.createElement('style'); st.textContent = css; shadow.appendChild(st);
    }
    var root = document.createElement('div');
    root.className = 'root' + (mode === 'viewer' ? ' viewer' : '');
    shadow.appendChild(root);
    root.addEventListener('error', imgFallback, true);

    var userscript = mode === 'userscript';
    root.innerHTML =
      (userscript ? '<div class="fabbar"><button type="button" class="fabrec" aria-pressed="true"></button>' +
        '<div class="fab" title="沦敦故事回顾（Alt+J）">📜 回顾<span class="badge"></span></div></div>' : '') +
      '<div class="overlay' + (userscript ? ' hidden' : '') + '"><div class="panel">' +
      '<header>' +
      '<div class="title">沦敦故事回顾<span class="count"></span></div>' +
      '<div class="grow"><input type="search" class="q" placeholder="搜索全部文本：故事、选项、结果、笔记…"></div>' +
      '<select class="f-char"></select><select class="f-story"></select>' +
      '<label class="chk"><input type="checkbox" class="f-star">仅星标</label>' +
      '<label class="chk" title="只看存入过游戏日志、或从游戏日志导入的记录"><input type="checkbox" class="f-journal">仅日志</label>' +
      '<select class="lang" title="翻译：原文 / 译文 / 原文与译文对照（需要先开着网页翻译玩过）"><option value="orig">原文</option><option value="tr">译文</option><option value="dual">对照</option></select>' +
      '<select class="view" title="显示样式"><option value="fl">沦敦风格</option><option value="compact">紧凑</option></select>' +
      '<select class="sort"><option value="desc">新 → 旧</option><option value="asc">旧 → 新</option></select>' +
      '<button data-h="books" class="bookbtn" title="按日志本整理、阅读故事">📖 日志本</button>' +
      '<div class="drop"><button data-h="export">导出 ▾</button><div class="menu hidden export-menu">' +
      '<div class="hint">导出当前筛选出的 <b class="n"></b> 条</div>' +
      '<button data-x="html">网页 HTML（适合阅读、打印）</button>' +
      '<button data-x="md">Markdown</button><button data-x="txt">纯文本 TXT</button>' +
      '<div class="sep"></div>' +
      '<button data-x="json-all">完整备份 JSON（全部记录，含原始数据）</button>' +
      '<button data-x="json">当前筛选 JSON</button></div></div>' +
      (userscript ? '<button data-h="rec" class="recbtn" title="开关记录（暂停时不会记录任何选择）"></button>' : '') +
      (userscript && cfg.importJournal ? '<button data-h="journal" title="把游戏里“保存到日志”的条目全部读进来">游戏日志</button>' : '') +
      '<button data-h="import">' + (userscript ? '导入' : '打开备份') + '</button>' +
      '<button data-h="settings">' + (userscript ? '设置' : '说明') + '</button>' +
      (userscript ? '<button data-h="close" title="关闭（Esc）">✕</button>' : '') +
      '<input type="file" class="file hidden" accept=".json,application/json" multiple>' +
      '</header>' +
      '<div class="status hidden"></div>' +
      '<div class="settings hidden"></div>' +
      '<main class="list"></main>' +
      '<div class="books hidden"><aside class="bside"></aside><main class="bmain list flview"></main></div>' +
      '</div></div>';

    var $ = function (s) { return root.querySelector(s); };
    var list = $('.list'), q = $('.q'), fChar = $('.f-char'), fStory = $('.f-story'), fStar = $('.f-star'), fJournal = $('.f-journal'), sortSel = $('.sort');
    var langSel = $('.lang');
    try { langSel.value = localStorage.getItem('flc-lang') || 'orig'; } catch (e) { langSel.value = 'orig'; }
    setLang(langSel.value);
    langSel.addEventListener('change', function () {
      setLang(langSel.value); try { localStorage.setItem('flc-lang', langSel.value); } catch (e) {}
      apply(); if (booksMode) renderBooks();
    });
    var viewSel = $('.view');
    try { viewSel.value = localStorage.getItem('flc-view') || 'fl'; } catch (e) { viewSel.value = 'fl'; }
    function isFL() { return viewSel.value === 'fl'; }
    viewSel.addEventListener('change', function () { try { localStorage.setItem('flc-view', viewSel.value); } catch (e) {} apply(); });
    var overlay = $('.overlay'), fab = $('.fab'), settingsBox = $('.settings'), menu = $('.export-menu'), fileInput = $('.file');

    var all = [], filtered = [], shown = 0, PAGE = 40, loaded = false, sessionNew = 0;

    function toast(msg) {
      var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; root.appendChild(t);
      setTimeout(function () { t.remove(); }, 2600);
    }

    function load() {
      return store.all().then(function (rs) {
        rs = rs || [];
        books = rs.filter(function (r) { return r.kind === 'book'; }).sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
        all = rs.filter(function (r) { return r.kind !== 'book'; });
        setBookIndex(books);
        loaded = true; refreshFilters(); apply();
        if (booksMode) renderBooks();
      }).catch(function (e) { toast('读取记录失败：' + e.message); });
    }

    function refreshFilters() {
      var chars = {}, stories = {};
      all.forEach(function (r) { if (r.char) chars[r.char] = (chars[r.char] || 0) + 1; var s = storyName(r); stories[s] = (stories[s] || 0) + 1; });
      var cv = fChar.value, sv = fStory.value;
      fChar.innerHTML = '<option value="">全部角色</option>' + Object.keys(chars).sort().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '（' + chars[c] + '）</option>'; }).join('');
      fStory.innerHTML = '<option value="">全部故事（' + all.length + '）</option>' + Object.keys(stories).sort(function (a, b) { return a.localeCompare(b, 'zh'); }).map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '（' + stories[s] + '）</option>'; }).join('');
      fChar.value = chars[cv] ? cv : ''; fStory.value = stories[sv] ? sv : '';
      fChar.classList.toggle('hidden', Object.keys(chars).length < 2);
    }

    function apply() {
      var needle = q.value.trim().toLowerCase(), c = fChar.value, s = fStory.value, star = fStar.checked;
      filtered = all.filter(function (r) {
        if (c && r.char !== c) return false;
        if (s && storyName(r) !== s) return false;
        if (star && !r.starred) return false;
        if (fJournal.checked && !(r.journaled || r.journalEntry || r.kind === 'journal')) return false;
        if (needle && searchText(r).indexOf(needle) < 0) return false;
        return true;
      });
      var asc = sortSel.value === 'asc';
      filtered.sort(function (a, b) { return asc ? a.t - b.t : b.t - a.t; });
      $('.count').textContent = filtered.length === all.length ? all.length + ' 条' : filtered.length + ' / ' + all.length + ' 条';
      list.innerHTML = ''; shown = 0; lastDay = '';
      list.classList.toggle('flview', isFL());
      box = list;
      if (!all.length) {
        list.innerHTML = userscript
          ? '<div class="empty"><div class="big">还没有记录</div>在游戏里做出一个选择，结果就会自动完整保存到这里。<br>也可以点“导入”恢复以前的备份。</div>'
          : '<div class="empty"><div class="dropzone"><div class="big">打开备份文件</div>把在游戏里导出的“完整备份 JSON”拖到这里，<br>或点右上角“打开备份”。可同时打开多个文件，会自动去重合并。</div></div>';
        bindDrop();
        return;
      }
      if (!filtered.length) { list.innerHTML = '<div class="empty">没有符合条件的记录</div>'; return; }
      if (isFL()) { box = document.createElement('div'); box.className = 'fl-tab'; list.appendChild(box); }
      groups = isFL() ? buildGroups(filtered) : filtered.map(function (r) { return [r]; });
      gShown = 0;
      more();
    }

    var lastDay = '', box = null, groups = [], gShown = 0;
    function more() {
      box = box || list;
      var old = box.querySelector('.more'); if (old) old.remove();
      var gEnd = gShown, cnt = 0, html = [];
      while (gEnd < groups.length && cnt < PAGE) { cnt += groups[gEnd].length; gEnd++; }
      for (var gi = gShown; gi < gEnd; gi++) {
        var grp = groups[gi], d = dayLabel(grp[0]);
        if (d !== lastDay) { lastDay = d; html.push('<h2 class="day"><span>' + d + '</span></h2>'); }
        html.push(isFL() ? renderGroup(grp) : renderRec(grp[0]));
      }
      gShown = gEnd;
      var end = shown + cnt;
      var tmp = document.createElement('div'); tmp.innerHTML = html.join('');
      var needle = q.value.trim().toLowerCase();
      if (needle) highlight(tmp, needle);
      while (tmp.firstChild) box.appendChild(tmp.firstChild);
      shown = end;
      requestAnimationFrame(function () {
        list.querySelectorAll('.fl-desc.clamp').forEach(function (d) {
          if (d.scrollHeight <= d.clientHeight + 2) {
            d.classList.remove('clamp');
            var b = d.nextElementSibling; if (b && b.getAttribute('data-a') === 'expand') b.remove();
          }
        });
      });
      if (gShown < groups.length) {
        var b = document.createElement('button'); b.className = 'more'; b.textContent = '继续加载（还有 ' + (filtered.length - shown) + ' 条）';
        b.onclick = more; box.appendChild(b);
      }
    }
    list.addEventListener('scroll', function () {
      if (gShown < groups.length && list.scrollTop + list.clientHeight > list.scrollHeight - 600) more();
    });
    if (!userscript) window.addEventListener('scroll', function () {
      if (gShown < groups.length && window.innerHeight + window.scrollY > document.body.scrollHeight - 600) more();
    });

    var timer = null;
    q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 180); });
    [fChar, fStory, fStar, fJournal, sortSel].forEach(function (el) { el.addEventListener('change', apply); });

    function byId(id) { for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }

    function onRecClick(ev) {
      var btn = ev.target.closest('button[data-a]'); if (!btn) return;
      var a = btn.getAttribute('data-a');
      if (a === 'book') {
        var art0 = btn.closest('.rec'), key0 = btn.getAttribute('data-key') || storyKey(art0 && byId(art0.getAttribute('data-id')));
        if (!key0) { toast('这条记录不属于某个故事，无法收入日志本'); return; }
        openBookMenu(btn, key0); return;
      }
      if (a === 'others' || a === 'expand') {
        if (a === 'expand') { var dsc0 = btn.previousElementSibling; var c0 = dsc0.classList.toggle('clamp'); btn.textContent = c0 ? '展开全文' : '收起'; return; }
        var wrap0 = btn.closest('.fl-branches'), on0 = wrap0.classList.toggle('show-all');
        btn.textContent = on0 ? '收起其他选项' : '显示当时其他 ' + wrap0.querySelectorAll('.fl-branch.other').length + ' 个选项';
        return;
      }
      var art = btn.closest('.rec'), r = art && byId(art.getAttribute('data-id')); if (!r) return;
      if (a === 'others') {
        var wrap = btn.closest('.fl-branches'), on = wrap.classList.toggle('show-all');
        var n = wrap.querySelectorAll('.fl-branch.other').length;
        btn.textContent = on ? '收起其他选项' : '显示当时其他 ' + n + ' 个选项';
        return;
      }
      if (a === 'expand') {
        var dsc = btn.previousElementSibling; var c = dsc.classList.toggle('clamp'); btn.textContent = c ? '展开全文' : '收起'; return;
      }
      if (a === 'star') {
        r.starred = !r.starred; store.put(r);
        art.classList.toggle('starred', r.starred); btn.classList.toggle('on', r.starred); btn.textContent = r.starred ? '★' : '☆';
      } else if (a === 'tab') {
        var v = btn.getAttribute('data-v');
        art.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b === btn); });
        art.querySelector('.body.orig').classList.toggle('hidden', v !== 'orig');
        var pg = art.querySelector('.body.page'); if (pg) pg.classList.toggle('hidden', v !== 'page');
      } else if (a === 'copy') {
        var txt = recToText(r);
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('已复制这一条的全部文本'); }, function () {
          var ta = document.createElement('textarea'); ta.value = txt; root.appendChild(ta); ta.select();
          try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('复制失败'); } ta.remove();
        });
      } else if (a === 'raw') {
        var pre = art.querySelector('pre.raw');
        if (pre) { pre.remove(); return; }
        pre = document.createElement('pre'); pre.className = 'raw';
        var raw = r.raw || {}, body = raw.res;
        try { body = JSON.stringify(JSON.parse(raw.res), null, 2); } catch (e) {}
        pre.textContent = '请求：' + (raw.method || '') + ' ' + (raw.url || '') + '\n' + (raw.req || '') + '\n\n响应：\n' + body;
        art.appendChild(pre);
      } else if (a === 'note') {
        var ta2 = art.querySelector('textarea.note');
        if (ta2) { ta2.blur(); return; }
        ta2 = document.createElement('textarea'); ta2.className = 'note'; ta2.placeholder = '写点笔记…（失焦后自动保存）'; ta2.value = r.note || '';
        var nt = art.querySelector('.notetext'); if (nt) nt.remove();
        art.appendChild(ta2); ta2.focus();
        ta2.addEventListener('blur', function () {
          r.note = ta2.value.trim(); r._s = null; store.put(r); ta2.remove();
          if (r.note) { var d = document.createElement('div'); d.className = 'notetext'; d.textContent = r.note; art.appendChild(d); }
        });
      } else if (a === 'del') {
        if (!confirm('确定删除这一条记录？此操作无法撤销（除非你有备份）。')) return;
        store.remove(r.id).then(function () {
          all = all.filter(function (x) { return x !== r; }); filtered = filtered.filter(function (x) { return x !== r; });
          shown = Math.max(0, shown - 1);
          var grpEl = art.closest('.fl-group'); art.remove();
          if (grpEl && !grpEl.querySelector('.rec')) grpEl.remove();
          refreshFilters();
          $('.count').textContent = filtered.length + ' / ' + all.length + ' 条';
        });
      }
    }
    list.addEventListener('click', onRecClick);

    /* ---------- 日志本 ---------- */
    var books = [], booksMode = false, curBook = null, bmenu = null;
    var bookWrap = $('.books'), bside = $('.bside'), bmain = $('.bmain'), bookBtn = $('[data-h="books"]'), header = $('header');
    bmain.addEventListener('click', onRecClick);
    function recsByKey() { var m = {}; all.forEach(function (r) { var k = storyKey(r); if (k) (m[k] = m[k] || []).push(r); }); return m; }
    function saveBook(b) { b.updated = Date.now(); setBookIndex(books); return store.put(b); }
    function refreshChips(key) {
      root.querySelectorAll('.bchips').forEach(function (el) {
        var k = el.getAttribute('data-key'); if (key && k !== key) return;
        var t = document.createElement('span'); t.innerHTML = bookChips(k); el.replaceWith(t.firstChild);
      });
    }
    function addChapter(b, key, m, at) {
      if (b.chapters.some(function (c) { return c.key === key; })) return false;
      var info = storyInfo((m || recsByKey())[key] || []), c = { key: key, name: info.name, image: info.image };
      if (at == null || at >= b.chapters.length) b.chapters.push(c); else b.chapters.splice(at, 0, c);
      return true;
    }
    function createBook(name, keys) {
      var m = recsByKey(), b = { id: newBookId(), kind: 'book', t: Date.now(), updated: Date.now(), name: name, desc: '', chapters: [] };
      (keys || []).forEach(function (k) { addChapter(b, k, m); });
      books.push(b);
      return saveBook(b).then(function () { return b; });
    }
    function afterBookChange(key) { refreshChips(key); if (booksMode) renderBooks(); }

    /* 卡片上的“📖 日志本”菜单：勾选要收入哪几本，或新建一本 */
    function closeBookMenu() { if (bmenu) { bmenu.remove(); bmenu = null; } }
    function openBookMenu(btn, key) {
      closeBookMenu();
      bmenu = document.createElement('div'); bmenu.className = 'bmenu';
      bmenu.innerHTML = '<div class="bmenu-h">收入日志本</div>' +
        (books.length ? books.map(function (b) {
          return '<label><input type="checkbox" data-bid="' + esc(b.id) + '"' + (b.chapters.some(function (c) { return c.key === key; }) ? ' checked' : '') + '> 📖 ' + esc(b.name) + '</label>';
        }).join('') : '<div class="bmenu-empty">还没有日志本</div>') +
        '<button data-bm="new">＋ 新建日志本…</button>';
      root.appendChild(bmenu);
      var rc = btn.getBoundingClientRect(), w = bmenu.offsetWidth, hgt = bmenu.offsetHeight;
      bmenu.style.left = Math.max(8, Math.min(rc.right - w, window.innerWidth - w - 8)) + 'px';
      bmenu.style.top = (rc.bottom + 4 + hgt > window.innerHeight - 8 ? Math.max(8, rc.top - hgt - 4) : rc.bottom + 4) + 'px';
      bmenu.addEventListener('change', function (e) {
        var b = books.find(function (x) { return x.id === e.target.getAttribute('data-bid'); }); if (!b) return;
        var on = e.target.checked;
        if (on) addChapter(b, key); else b.chapters = b.chapters.filter(function (c) { return c.key !== key; });
        saveBook(b).then(function () { afterBookChange(key); toast(on ? '已收入《' + b.name + '》' : '已从《' + b.name + '》移出'); });
      });
      bmenu.addEventListener('click', function (e) {
        if (!e.target.closest('[data-bm="new"]')) return;
        var name = prompt('新日志本的名字：', storyInfo(recsByKey()[key] || []).name);
        if (!name || !name.trim()) return;
        createBook(name.trim(), [key]).then(function (b) { closeBookMenu(); afterBookChange(key); toast('已新建日志本《' + b.name + '》并收入这个故事'); });
      });
    }
    shadow.addEventListener('mousedown', function (e) {
      if (bmenu && !bmenu.contains(e.target) && !(e.target.closest && e.target.closest('[data-a="book"]'))) closeBookMenu();
    });

    function setBooksMode(on) {
      booksMode = on; closeBookMenu();
      list.classList.toggle('hidden', on); bookWrap.classList.toggle('hidden', !on);
      bookBtn.classList.toggle('on', on); header.classList.toggle('booksmode', on);
      if (on) (loaded ? Promise.resolve() : load()).then(renderBooks);
    }
    bookBtn.addEventListener('click', function () { setBooksMode(!booksMode); });

    function suggestedLines() {
      return storyLines(all).filter(function (line) {
        return !books.some(function (b) { return line.every(function (k) { return b.chapters.some(function (c) { return c.key === k; }); }); });
      });
    }
    function sideItem(id, cover, name, num) {
      return '<button class="bitem' + (curBook === id ? ' on' : '') + '" data-bk="' + esc(id) + '">' + cover + '<span class="bname">' + esc(name) + '</span><span class="bnum">' + num + '</span></button>';
    }
    function renderBooks() {
      setBookIndex(books);
      var m = recsByKey(), lines = suggestedLines(), unfiled = Object.keys(m).filter(function (k) { return !BOOK_INDEX[k]; });
      var valid = curBook === 'sugg' || curBook === 'unfiled' || books.some(function (b) { return b.id === curBook; });
      if (!curBook || !valid) curBook = books.length ? books[0].id : (lines.length ? 'sugg' : 'unfiled');
      bside.innerHTML = '<div class="bside-h">我的日志本</div>' +
        books.map(function (b) {
          var img = (b.chapters[0] || {}).image;
          return sideItem(b.id, img ? '<img class="bcover" src="' + esc(iconUrl(img, true)) + '" alt="">' : '<span class="bcover">📖</span>', b.name, b.chapters.length);
        }).join('') +
        '<button class="bnew" data-bk="new">＋ 新建日志本</button>' +
        '<div class="bside-h">整理</div>' +
        sideItem('sugg', '<span class="bcover">🔗</span>', '自动发现的故事线', lines.length) +
        sideItem('unfiled', '<span class="bcover">🗂</span>', '未归类的故事', unfiled.length);
      if (curBook === 'sugg') renderSuggestions(m, lines);
      else if (curBook === 'unfiled') renderUnfiled(m, unfiled);
      else renderBook(books.find(function (b) { return b.id === curBook; }), m);
      bmain.scrollTop = 0;
      fixClamps(bmain);
    }
    function renderBook(b, m) {
      var adj = linkGraph(all), inBook = {}, total = 0;
      b.chapters.forEach(function (c) { inBook[c.key] = 1; total += (m[c.key] || []).length; });
      var h = ['<div class="fl-tab">'];
      h.push('<div class="bhead"><input class="btitle" value="' + esc(b.name) + '" aria-label="日志本名称" title="点击修改名称">' +
        '<textarea class="bdesc" rows="2" placeholder="写点介绍：这本日志记的是哪条故事线……">' + esc(b.desc || '') + '</textarea>' +
        '<div class="btools"><span class="bstat">' + b.chapters.length + ' 章 · ' + total + ' 条记录</span><span class="sp"></span>' +
        '<button data-b="exp" data-f="html">导出网页</button><button data-b="exp" data-f="md">Markdown</button><button data-b="exp" data-f="txt">TXT</button>' +
        '<button data-b="delbook" class="danger">删除日志本</button></div></div>');
      if (!b.chapters.length) h.push('<div class="empty">这本日志还是空的。<br>在任意故事卡片上点“📖 日志本”，就能把故事收进来；也可以看看左边“未归类的故事”。</div>');
      b.chapters.forEach(function (c, i) {
        var recs = (m[c.key] || []).slice().sort(function (x, y) { return x.t - y.t; }), name = recs.length ? storyInfo(recs).name : c.name;
        h.push('<section class="chap" data-key="' + esc(c.key) + '"><h2 class="day chap-h"><span class="chap-n">第 ' + (i + 1) + ' 章</span><span class="chap-name">' + esc(name) + '</span>' +
          '<span class="chap-tools"><button data-b="up" title="上移"' + (i === 0 ? ' disabled' : '') + '>↑</button><button data-b="down" title="下移"' + (i === b.chapters.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button data-b="remove" title="从这本日志移出（记录本身不会被删除）">移出</button></span></h2>' +
          (recs.length ? renderGroup(recs) : '<p class="fl-jmeta">（这一章暂时没有记录。）</p>') + '</section>');
      });
      var sugg = {};
      b.chapters.forEach(function (c, i) { Object.keys(adj[c.key] || {}).forEach(function (k) { if (!inBook[k] && m[k] && sugg[k] == null) sugg[k] = i; }); });
      var sk = Object.keys(sugg);
      if (sk.length) {
        h.push('<section class="bsugg"><div class="fl-jlabel">自动建议</div><h3 class="fl-h3">可能属于这本日志的故事</h3><p class="fl-jmeta">在游戏里，这些故事和本书的章节是直接接续的。</p>' +
          sk.map(function (k) {
            var info = storyInfo(m[k]), after = b.chapters[sugg[k]];
            return '<div class="brow">' + icon(info.image, 'fl-qicon', true) + '<div class="brow-t"><b>' + esc(info.name) + '</b><span>与第 ' + (sugg[k] + 1) + ' 章「' + esc(after.name) + '」相连 · ' + m[k].length + ' 条记录</span></div>' +
              '<button data-b="addsugg" data-key="' + esc(k) + '" data-at="' + (sugg[k] + 1) + '">加入为第 ' + (sugg[k] + 2) + ' 章</button></div>';
          }).join('') + '</section>');
      }
      h.push('</div>');
      bmain.innerHTML = h.join('');
    }
    function renderSuggestions(m, lines) {
      var h = ['<div class="fl-tab"><div class="bhead"><div class="btitle static">🔗 自动发现的故事线</div>' +
        '<p class="fl-jmeta">游戏里一个选择直接进入下一个故事时，插件会把它们连起来。下面这些是还没整理进日志本的故事线，可以一键建成日志本，之后再自己调整。</p></div>'];
      if (!lines.length) h.push('<div class="empty">暂时没有发现新的故事线。<br>多玩一些连续的剧情后再来看看。</div>');
      lines.forEach(function (line, i) {
        h.push('<section class="bline"><div class="bline-steps">' + line.map(function (k, j) {
          var info = storyInfo(m[k] || []);
          return (j ? '<span class="arrow">→</span>' : '') + '<span class="bstep">' + icon(info.image, 'fl-qicon', true) + '<span>' + esc(info.name) + '<small>' + (m[k] || []).length + ' 条</small></span></span>';
        }).join('') + '</div><div class="btools"><span class="sp"></span><button data-b="mkline" data-i="' + i + '">建成日志本</button></div></section>');
      });
      h.push('</div>');
      bmain.innerHTML = h.join('');
      bmain._lines = lines;
    }
    function renderUnfiled(m, keys) {
      keys.sort(function (a, b) { return lastT(m[b]) - lastT(m[a]); });
      var h = ['<div class="fl-tab"><div class="bhead"><div class="btitle static">🗂 未归类的故事</div>' +
        '<p class="fl-jmeta">还没有收入任何日志本的故事（最近玩过的在前）。点“📖 日志本”收入，点“查看”在记录里看这个故事。</p></div>'];
      if (!keys.length) h.push('<div class="empty">所有故事都已经归类了。</div>');
      keys.forEach(function (k) {
        var info = storyInfo(m[k]);
        h.push('<div class="brow">' + icon(info.image, 'fl-qicon', true) + '<div class="brow-t"><b>' + esc(info.name) + '</b><span>' + m[k].length + ' 条记录 · 最近 ' + fmtTime(lastT(m[k])).slice(0, 16) + (info.char ? ' · ' + esc(info.char) : '') + '</span></div>' +
          '<button data-b="view" data-key="' + esc(k) + '">查看</button><button data-a="book" data-key="' + esc(k) + '">📖 日志本</button></div>');
      });
      h.push('</div>');
      bmain.innerHTML = h.join('');
    }
    function lastT(rs) { return (rs || []).reduce(function (x, r) { return Math.max(x, r.t); }, 0); }
    function fixClamps(el) {
      requestAnimationFrame(function () {
        el.querySelectorAll('.fl-desc.clamp').forEach(function (d) {
          if (d.scrollHeight <= d.clientHeight + 2) { d.classList.remove('clamp'); var b = d.nextElementSibling; if (b && b.getAttribute('data-a') === 'expand') b.remove(); }
        });
      });
    }

    bside.addEventListener('click', function (e) {
      var it = e.target.closest('[data-bk]'); if (!it) return;
      var id = it.getAttribute('data-bk');
      if (id === 'new') {
        var name = prompt('新日志本的名字：', '新的日志本'); if (!name || !name.trim()) return;
        createBook(name.trim(), []).then(function (b) { curBook = b.id; renderBooks(); });
        return;
      }
      curBook = id; renderBooks();
    });
    bmain.addEventListener('change', function (e) {
      var b = books.find(function (x) { return x.id === curBook; }); if (!b) return;
      if (e.target.classList.contains('btitle')) {
        var v = e.target.value.trim(); if (!v) { e.target.value = b.name; return; }
        b.name = v; saveBook(b).then(function () { refreshChips(); renderBooks(); toast('已改名为《' + v + '》'); });
      } else if (e.target.classList.contains('bdesc')) {
        b.desc = e.target.value.trim(); saveBook(b);
      }
    });
    bmain.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-b]'); if (!btn) return;
      var act = btn.getAttribute('data-b'), b = books.find(function (x) { return x.id === curBook; }), m = recsByKey();
      if (act === 'mkline') {
        var line = (bmain._lines || [])[+btn.getAttribute('data-i')]; if (!line) return;
        var name = prompt('新日志本的名字：', storyInfo(m[line[0]] || []).name); if (!name || !name.trim()) return;
        createBook(name.trim(), line).then(function (nb) { curBook = nb.id; refreshChips(); renderBooks(); toast('已建成日志本《' + nb.name + '》，共 ' + nb.chapters.length + ' 章'); });
        return;
      }
      if (act === 'view') {
        var rs = m[btn.getAttribute('data-key')] || []; if (!rs.length) return;
        setBooksMode(false); fStory.value = storyName(rs[0]); sortSel.value = 'asc'; apply();
        return;
      }
      if (!b) return;
      var chap = btn.closest('.chap'), key = chap && chap.getAttribute('data-key');
      var idx = b.chapters.findIndex(function (c) { return c.key === key; });
      if (act === 'up' && idx > 0) { b.chapters.splice(idx - 1, 0, b.chapters.splice(idx, 1)[0]); }
      else if (act === 'down' && idx >= 0 && idx < b.chapters.length - 1) { b.chapters.splice(idx + 1, 0, b.chapters.splice(idx, 1)[0]); }
      else if (act === 'remove') { b.chapters.splice(idx, 1); }
      else if (act === 'addsugg') { addChapter(b, btn.getAttribute('data-key'), m, +btn.getAttribute('data-at')); key = btn.getAttribute('data-key'); }
      else if (act === 'delbook') {
        if (!confirm('删除日志本《' + b.name + '》？\n只删除这本日志的目录，里面的故事记录都会保留。')) return;
        books = books.filter(function (x) { return x !== b; });
        store.remove(b.id).then(function () { setBookIndex(books); curBook = null; refreshChips(); renderBooks(); toast('已删除日志本'); });
        return;
      }
      else if (act === 'exp') {
        var f = btn.getAttribute('data-f'), mime = { html: 'text/html', md: 'text/markdown', txt: 'text/plain' }[f];
        download(b.name.replace(/[\\/:*?"<>|]/g, '_') + '-' + stamp() + '.' + f, exportBook(b, m, f, css), mime);
        return;
      } else return;
      var y = bmain.scrollTop;
      saveBook(b).then(function () { refreshChips(key); renderBooks(); bmain.scrollTop = act === 'remove' || act === 'addsugg' ? y : y; });
    });

    /* 导出菜单 */
    root.querySelector('[data-h="export"]').addEventListener('click', function (e) {
      e.stopPropagation(); menu.querySelector('.n').textContent = filtered.length; menu.classList.toggle('hidden');
    });
    shadow.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.drop')) menu.classList.add('hidden'); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-x]'); if (!b) return;
      menu.classList.add('hidden');
      var x = b.getAttribute('data-x'), name = '沦敦故事回顾-' + stamp();
      var recs = filtered.slice().sort(function (a, b2) { return a.t - b2.t; });
      if (x === 'json-all') download(name + '-完整备份.json', exportJSON(all.concat(books).sort(function (a, b2) { return a.t - b2.t; })), 'application/json');
      else if (x === 'json') download(name + '.json', exportJSON(recs), 'application/json');
      else if (x === 'html') download(name + '.html', exportHTML(recs, css), 'text/html');
      else if (x === 'md') download(name + '.md', exportMD(recs), 'text/markdown');
      else if (x === 'txt') download(name + '.txt', exportTXT(recs), 'text/plain');
      if (userscript && x === 'json-all') { try { localStorage.setItem('flc-last-backup', String(Date.now())); } catch (e2) {} }
    });

    /* 导入 */
    root.querySelector('[data-h="import"]').addEventListener('click', function () { fileInput.click(); });
    var jBtn = root.querySelector('[data-h="journal"]');
    if (jBtn) jBtn.addEventListener('click', function () {
      if (!confirm('从游戏读取你所有“保存到日志”的条目，并加入回顾记录？\n（只读取，不会改动游戏里的任何内容；重复导入会自动去重。）')) return;
      jBtn.disabled = true;
      Promise.resolve(cfg.importJournal()).catch(function () {}).then(function () { jBtn.disabled = false; });
    });
    var statusBox = root.querySelector('.status');
    function setStatus(m) { statusBox.textContent = m || ''; statusBox.classList.toggle('hidden', !m); }
    fileInput.addEventListener('change', function () { importFiles(fileInput.files); fileInput.value = ''; });
    function importFiles(files) {
      var arr = Array.prototype.slice.call(files || []);
      if (!arr.length) return;
      Promise.all(arr.map(function (f) { return f.text().then(parseImport); })).then(function (lists) {
        var map = new Map(all.concat(books).map(function (r) { return [r.id, r]; })), added = 0, merged = [];
        lists.forEach(function (l) {
          l.forEach(function (r) {
            var ex = map.get(r.id);
            if (!ex) { map.set(r.id, r); merged.push(r); added++; }
            else if (r.kind === 'book') { if ((r.updated || 0) > (ex.updated || 0)) { map.set(r.id, r); merged.push(r); } }
            else {
              var changed = false;
              if (r.starred && !ex.starred) { ex.starred = true; changed = true; }
              if (r.note && r.note !== ex.note) { ex.note = ex.note ? ex.note + '\n' + r.note : r.note; ex._s = null; changed = true; }
              if (r.pageText && !ex.pageText) { ex.pageText = r.pageText; ex._s = null; changed = true; }
              if (changed) merged.push(ex);
            }
          });
        });
        return store.bulkPut(merged).then(function () { toast('导入完成：新增 ' + added + ' 条' + (merged.length > added ? '，合并 ' + (merged.length - added) + ' 条' : '')); return load(); });
      }).catch(function (e) { toast('导入失败：' + e.message); });
    }
    var dropBound = false;
    function bindDrop() {
      var z = list.querySelector('.dropzone');
      if (z) {
        z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
        z.addEventListener('dragleave', function () { z.classList.remove('over'); });
      }
      if (dropBound || userscript) return; dropBound = true;
      document.addEventListener('dragover', function (e) { e.preventDefault(); });
      document.addEventListener('drop', function (e) { e.preventDefault(); importFiles(e.dataTransfer.files); });
    }

    /* 设置 / 说明 */
    root.querySelector('[data-h="settings"]').addEventListener('click', function () {
      if (!settingsBox.classList.contains('hidden')) { settingsBox.classList.add('hidden'); return; }
      renderSettings(); settingsBox.classList.remove('hidden');
    });
    function renderSettings() {
      if (!userscript) {
        settingsBox.innerHTML = '<div class="note">这是离线查看器：它只读取你导入的备份文件，不连网。打开的记录会暂存在本浏览器里，下次打开这个文件仍在。' +
          '星标和笔记的修改，请用“导出 → 完整备份 JSON”另存，再在游戏里“导入”即可同步回去。</div>' +
          '<div class="row"><button class="danger" data-s="clear">清空查看器里的记录</button></div>';
      } else {
        var s = cfg.settings, last = 0;
        try { last = +localStorage.getItem('flc-last-backup') || 0; } catch (e) {}
        settingsBox.innerHTML =
          '<label><input type="checkbox" data-k="recording"' + (s.recording !== false ? ' checked' : '') + '> <b>记录游戏中的选择</b>（关闭后暂停记录，随时可以再打开）</label>' +
          '<label><input type="checkbox" data-k="pageText"' + (s.pageText ? ' checked' : '') + '> 同时保存翻译后的文字（开着 Chrome 翻译、沉浸式翻译等玩游戏时，逐项保存译文；用顶部的“原文 / 译文 / 对照”切换显示）</label>' +
          '<label><input type="checkbox" data-k="raw"' + (s.raw ? ' checked' : '') + '> 保存服务器原始响应（推荐：保证任何文字都不会丢失）</label>' +
          '<label><input type="checkbox" data-k="debugAll"' + (s.debugAll ? ' checked' : '') + '> 调试：把所有接口响应都单独记一条（会产生大量记录，排查问题时再开）</label>' +
          '<div class="note">存储方式：' + (store.kind === 'idb' ? '浏览器 IndexedDB（本机，容量充足）' : '<b style="color:#f2b0a4">内存（浏览器禁止了本地存储，关闭页面就会丢失，请及时导出！）</b>') +
          '。共 ' + all.length + ' 条。上次完整备份：' + (last ? fmtTime(last) : '从未') + '。<br>' +
          '记录保存在这个浏览器里。清除浏览器的网站数据、换电脑、换浏览器都会让记录不可见，请定期“导出 → 完整备份 JSON”。</div>' +
          '<div class="row"><button class="primary" data-s="backup">立即完整备份</button><button class="danger" data-s="clear">清空所有记录</button></div>';
      }
    }
    settingsBox.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      cfg.settings[k] = e.target.checked; cfg.saveSettings && cfg.saveSettings();
      if (k === 'recording') syncRecording();
    });
    settingsBox.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-s]'); if (!b) return;
      var s = b.getAttribute('data-s');
      if (s === 'backup') menu.querySelector('[data-x="json-all"]').click();
      if (s === 'clear') {
        if (!confirm('确定清空全部 ' + all.length + ' 条记录吗？建议先导出完整备份。')) return;
        store.clear().then(function () { all = []; refreshFilters(); apply(); renderSettings(); toast('已清空'); });
      }
    });

    /* 记录开关 */
    var recBtn = root.querySelector('[data-h="rec"]');
    function syncRecording() {
      if (!userscript) return;
      var on = cfg.settings.recording !== false;
      recBtn.textContent = on ? '● 记录中' : '❚❚ 已暂停';
      recBtn.classList.toggle('paused', !on);
      fabRec.innerHTML = on ? '<span class="dot"></span>记录中' : '<span class="bars">❚❚</span>已暂停';
      fabRec.classList.toggle('paused', !on);
      fabRec.setAttribute('aria-pressed', on ? 'true' : 'false');
      fabRec.title = on ? '正在记录 —— 点击暂停（Alt+K）' : '记录已暂停 —— 点击恢复（Alt+K）';
      var cb = settingsBox.querySelector('[data-k="recording"]'); if (cb) cb.checked = on;
    }
    var fabRec = root.querySelector('.fabrec');
    function toggleRecording() {
      cfg.settings.recording = cfg.settings.recording === false; cfg.saveSettings && cfg.saveSettings();
      syncRecording(); toast(cfg.settings.recording ? '已恢复记录' : '已暂停记录：在你重新打开之前，选择不会被记下');
    }
    if (recBtn) recBtn.addEventListener('click', toggleRecording);
    if (fabRec) fabRec.addEventListener('click', toggleRecording);
    syncRecording();

    /* 打开 / 关闭（游戏内） */
    function open() { overlay.classList.remove('hidden'); if (fab) { fab.querySelector('.badge').textContent = ''; sessionNew = 0; } load().then(function () { q.focus(); }); }
    function close() { overlay.classList.add('hidden'); settingsBox.classList.add('hidden'); }
    if (userscript) {
      fab.addEventListener('click', open);
      root.querySelector('[data-h="close"]').addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', function (e) {
        if (e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); toggleRecording(); return; }
        if (e.altKey && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); overlay.classList.contains('hidden') ? open() : close(); }
        else if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close();
      }, true);
      // 阻止面板里的按键传给游戏（避免误触游戏快捷键）
      ['keydown', 'keyup', 'keypress'].forEach(function (t) { root.addEventListener(t, function (e) { if (e.key !== 'Escape') e.stopPropagation(); }); });
    }

    (document.body || document.documentElement).appendChild(host);
    if (!userscript) load();

    return {
      host: host,
      notifyNew: function (rec) {
        sessionNew++;
        if (fab) {
          fab.querySelector('.badge').textContent = overlay.classList.contains('hidden') ? '+' + sessionNew : '';
          fab.classList.remove('flash'); void fab.offsetWidth; fab.classList.add('flash');
        }
        if (!overlay.classList.contains('hidden') && loaded) {
          var i = all.findIndex(function (x) { return x.id === rec.id; });
          if (i >= 0) all[i] = rec; else all.push(rec);
          refreshFilters(); apply();
        }
      },
      updated: function (rec) {
        var i = all.findIndex(function (x) { return x.id === rec.id; });
        if (i >= 0) { all[i] = rec; rec._s = null; }
      },
      warn: function (msg) { if (fab) { fab.classList.add('warn'); fab.title = msg; } toast(msg); },
      open: open, close: close,
      toast: toast, setStatus: setStatus, syncRecording: syncRecording,
      reload: function () { if (!overlay.classList.contains('hidden') || !userscript) load(); },
      backup: function () { load().then(function () { menu.querySelector('[data-x="json-all"]').click(); }); }
    };
  }

  return {
    esc: esc, toSafeHtml: toSafeHtml, htmlToText: htmlToText, fmtTime: fmtTime,
    makeStore: makeStore, makeMemoryStore: makeMemoryStore, makeIDBStore: makeIDBStore,
    exportJSON: exportJSON, exportMD: exportMD, exportTXT: exportTXT, exportHTML: exportHTML,
    recToText: recToText, parseImport: parseImport, mountUI: mountUI, _alignTr: alignTr
  };
})();

/* 沦敦故事回顾 —— 抓取部分：拦截游戏与服务器之间的数据，完整保存 */
(function () {
  'use strict';
  if (window.__FLC_LOADED__) return;
  window.__FLC_LOADED__ = true;

  var API_RE = /fallenlondon\.com\/api\//i;
  var SETTINGS_KEY = 'flc-settings';
  var DEFAULTS = { recording: true, pageText: true, raw: true, debugAll: false };
  var settings = (function () {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  })();
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {} }

  var ui = null, storeP = FLC.makeStore('fl-chronicle'), pendingNotify = [];

  /* ---------- 上下文：记住当前正在看的故事和它的所有选项 ---------- */
  var ctx = { current: null, byId: new Map(), character: '', area: '' };
  function rememberStorylet(s) {
    if (!s || typeof s !== 'object' || s.id == null) return;
    ctx.byId.set(String(s.id), s);
    ctx.current = s;
    try { sessionStorage.setItem('flc-current', JSON.stringify(s)); } catch (e) {}
  }
  try { var cur = sessionStorage.getItem('flc-current'); if (cur) rememberStorylet(JSON.parse(cur)); } catch (e) {}

  function scanContext(res) {
    if (!res || typeof res !== 'object') return;
    if (res.character && typeof res.character.name === 'string') ctx.character = res.character.name;
    if (res.currentArea && res.currentArea.name) ctx.area = res.currentArea.name;
    else if (res.area && res.area.name) ctx.area = res.area.name;
    else if (res.setting && res.setting.name) ctx.area = res.setting.name;
    if (res.storylet && typeof res.storylet === 'object') rememberStorylet(res.storylet);
    if (res.phase === 'Available' || (Array.isArray(res.storylets) && !res.storylet)) ctx.current = null;
  }

  /* 把 messages（不论是数组还是嵌套对象）里所有的 message 文本按顺序收集出来 */
  function extractMessages(m) {
    var out = [];
    (function walk(x) {
      if (!x) return;
      if (Array.isArray(x)) { x.forEach(walk); return; }
      if (typeof x === 'object') {
        if (typeof x.message === 'string') out.push({ type: x.type || '', text: x.message, image: x.image || (x.possession && x.possession.image) || (x.quality && x.quality.image) || '' });
        else Object.keys(x).forEach(function (k) { if (x[k] && typeof x[k] === 'object') walk(x[k]); });
      }
    })(m);
    return out;
  }
  function pickText(o, keys) { for (var i = 0; i < keys.length; i++) if (o && typeof o[keys[i]] === 'string') return o[keys[i]]; return ''; }
  function newId() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }

  /* ---------- 记录 ---------- */
  function save(rec) {
    storeP.then(function (store) {
      return store.put(rec).then(function () {
        if (store.kind !== 'idb' && ui) ui.warn('浏览器不允许本地存储，记录只在内存中，请尽快导出备份！');
        if (ui) ui.notifyNew(rec); else pendingNotify.push(rec);
      });
    }).catch(function (e) {
      console.error('[沦敦故事回顾] 保存失败', e, rec);
      try { // 兜底：塞进 localStorage，下次加载时补存
        var q = JSON.parse(localStorage.getItem('flc-rescue') || '[]'); q.push(rec);
        localStorage.setItem('flc-rescue', JSON.stringify(q));
      } catch (e2) {}
      if (ui) ui.warn('保存失败：' + (e && e.message));
    });
  }
  // 补存上次失败的记录
  storeP.then(function (store) {
    try {
      var q = JSON.parse(localStorage.getItem('flc-rescue') || '[]');
      if (q.length) store.bulkPut(q).then(function () { localStorage.removeItem('flc-rescue'); });
    } catch (e) {}
  });

  /* 把一个选项（branch）完整地抄下来：标题、描述、挑战说明、解锁条件 */
  function copyBranch(b) {
    if (!b) return null;
    return {
      id: b.id, name: pickText(b, ['name']), description: pickText(b, ['description']), image: pickText(b, ['image']),
      buttonText: pickText(b, ['buttonText']), actionCost: b.actionCost, isLocked: !!b.isLocked,
      challenges: (Array.isArray(b.challenges) ? b.challenges : []).map(function (c) {
        return { name: pickText(c, ['name']), description: pickText(c, ['description']), image: pickText(c, ['image']),
          category: pickText(c, ['category']), type: pickText(c, ['type']), targetNumber: c.targetNumber };
      }),
      requirements: (Array.isArray(b.qualityRequirements) ? b.qualityRequirements : []).map(function (q) {
        return { name: pickText(q, ['qualityName']), tooltip: pickText(q, ['tooltip']), image: pickText(q, ['image']), status: pickText(q, ['status']) };
      })
    };
  }
  function copyStorylet(st) {
    if (!st) return null;
    return { id: st.id, name: pickText(st, ['name']), description: pickText(st, ['description']), teaser: pickText(st, ['teaser']),
      image: pickText(st, ['image']),
      requirements: (Array.isArray(st.qualityRequirements) ? st.qualityRequirements : []).map(function (q) {
        return { name: pickText(q, ['qualityName']), tooltip: pickText(q, ['tooltip']), image: pickText(q, ['image']), status: pickText(q, ['status']) };
      }),
      branches: (Array.isArray(st.childBranches) ? st.childBranches : []).map(copyBranch) };
  }

  function recordChoice(url, method, reqText, req, res, resText, st) {
    if (res.setting && res.setting.name) ctx.area = res.setting.name;
    var branchId = req && typeof req === 'object' ? (req.branchId != null ? req.branchId : (req.branchid != null ? req.branchid : req.BranchId)) : null;
    var branch = null;
    if (branchId != null) {
      var b = null;
      if (st && Array.isArray(st.childBranches)) b = st.childBranches.find(function (x) { return String(x.id) === String(branchId); });
      if (!b) ctx.byId.forEach(function (s) { if (!b && Array.isArray(s.childBranches)) b = s.childBranches.find(function (x) { return String(x.id) === String(branchId); }); });
      branch = b ? copyBranch(b) : { id: branchId, name: '', description: '', image: '' };
    }
    var outcome = null, end = res.endStorylet, ev = end && (end.event || end);
    if (ev && (ev.description || ev.name)) {
      outcome = { id: ev.id, name: pickText(ev, ['name']), description: pickText(ev, ['description']), image: pickText(ev, ['image']), linked: false,
        linking: !!(end && (end.isLinkingEvent || end.isDirectLinkingEvent)) };
      // 注意：顶层 isSuccess 只表示请求成功；挑战成败要看消息类型
      var roll = (Array.isArray(res.messages) ? res.messages : []).map(function (m) { return m && m.type || ''; }).join(' ');
      if (/DifficultyRollFailure/.test(roll)) outcome.success = false;
      else if (/DifficultyRollSuccess/.test(roll)) outcome.success = true;
    } else if (res.storylet && (res.storylet.description || res.storylet.name)) {
      outcome = { id: res.storylet.id, name: pickText(res.storylet, ['name']), description: pickText(res.storylet, ['description']), image: pickText(res.storylet, ['image']), linked: true };
    }
    var rec = {
      id: newId(), t: Date.now(), v: 1, kind: 'choice',
      char: ctx.character, area: ctx.area,
      storylet: copyStorylet(st),
      branch: branch, outcome: outcome,
      messages: extractMessages(res.messages),
      pageText: '', starred: false, note: '',
      raw: settings.raw ? { url: url, method: method, req: reqText || '', res: resText } : null
    };
    if (st && stTr && stTr.sid === String(st.id)) rec.tr = { storylet: stTr.storylet, branches: stTr.branches };
    trRec = rec; trUntil = Date.now() + 5 * 60 * 1000;
    save(rec);
    return rec;
  }

  function recordRaw(url, method, reqText, resText) {
    save({ id: newId(), t: Date.now(), v: 1, kind: 'raw', char: ctx.character, area: ctx.area,
      raw: { url: url, method: method, req: reqText || '', res: resText }, starred: false, note: '' });
  }

  var ACTION_RE = /\/storylet\/(choosebranch|renamequality|sendinternalsocialact)\b/i;
  /* 一次性清理：删掉以前因后台刷新而产生的重复记录（保留星标、笔记、日志标记等，合并进真正那条） */
  function cleanupDuplicates() {
    try { if (localStorage.getItem('flc-dedupe-v1')) return; } catch (e) { return; }
    storeP.then(function (store) {
      return store.all().then(function (rs) {
        var choices = rs.filter(function (r) { return r.kind === 'choice'; });
        var real = choices.filter(function (r) { return !r.raw || ACTION_RE.test(r.raw.url || ''); });
        var dups = choices.filter(function (r) {
          if (r.raw && r.raw.url) return !ACTION_RE.test(r.raw.url);
          // 没有原始数据的老记录：没有所选选项、且附近有同一结果的正常记录，才算重复
          return !r.branch && real.some(function (x) { return x !== r && x.branch && x.outcome && r.outcome && String(x.outcome.id) === String(r.outcome.id) && Math.abs(x.t - r.t) < 30 * 60 * 1000; });
        });
        if (!dups.length) return 0;
        var changed = [], gone = [];
        dups.forEach(function (d) {
          var best = null;
          real.forEach(function (x) {
            if (x === d || !x.outcome || !d.outcome || String(x.outcome.id) !== String(d.outcome.id)) return;
            if (!best || Math.abs(x.t - d.t) < Math.abs(best.t - d.t)) best = x;
          });
          if (!best) return; // 找不到对应的正常记录就不删，免得丢内容
          gone.push(d);
          var c = false;
          if (d.starred && !best.starred) { best.starred = true; c = true; }
          if (d.note && d.note !== best.note) { best.note = best.note ? best.note + '\n' + d.note : d.note; c = true; }
          if (d.journaled && !best.journaled) { best.journaled = d.journaled; c = true; }
          if (d.journalEntry && !best.journalEntry) { best.journalEntry = d.journalEntry; c = true; }
          if (d.pageText && !best.pageText) { best.pageText = d.pageText; c = true; }
          if (c && changed.indexOf(best) < 0) changed.push(best);
        });
        return store.bulkPut(changed).then(function () {
          return Promise.all(gone.map(function (d) { return store.remove(d.id); }));
        }).then(function () { return gone.length; });
      });
    }).then(function (n) {
      try { localStorage.setItem('flc-dedupe-v1', String(Date.now())); } catch (e) {}
      if (n) { console.info('[沦敦故事回顾] 已清理重复记录 ' + n + ' 条'); var tell = function () { if (ui) { ui.toast('已自动清理之前的重复记录 ' + n + ' 条'); ui.reload(); } else setTimeout(tell, 1000); }; tell(); }
    }).catch(function (e) { console.warn('[沦敦故事回顾] 清理重复失败', e); });
  }
  cleanupDuplicates();

  /* 你在游戏里按“保存到日志”时：把对应的记录标记为“已存入日志” */
  function onJournalShare(req, resText) {
    if (!settings.recording) return;
    if (!req || typeof req !== 'object') return;
    var key = String(req.contentKey == null ? '' : req.contentKey), info = {
      t: Date.now(), message: String(req.message || ''), contentClass: String(req.contentClass || ''), contentKey: key };
    storeP.then(function (store) {
      return store.all().then(function (rs) {
        rs.sort(function (a, b) { return b.t - a.t; });
        var hit = rs.find(function (r) { return r.kind === 'choice' && r.outcome && String(r.outcome.id) === key; }) ||
          rs.find(function (r) { return (r.kind === 'choice' || r.kind === 'storylet') && r.storylet && String(r.storylet.id) === key; });
        if (!hit && ctx.current && String(ctx.current.id) === key) {
          // 在故事页（还没做选择）就存了日志：把这一页的故事和全部选项单独存一条
          hit = { id: newId(), t: Date.now(), v: 1, kind: 'storylet', char: ctx.character, area: ctx.area,
            storylet: copyStorylet(ctx.current), branch: null, outcome: null, messages: [], pageText: '', starred: false, note: '', raw: null };
        }
        if (!hit) return;
        hit.journaled = info; hit._s = null;
        return store.put(hit).then(function () { if (ui) { ui.notifyNew(hit); ui.toast('已把这条记录标记为“已存入游戏日志”'); } });
      });
    }).catch(function (e) { console.warn('[沦敦故事回顾]', e); });
  }

  function handle(url, method, reqBody, resText, cap) {
    if (!API_RE.test(url) || !resText) { if (cap) cap.fail(); return; }
    var res;
    try { res = JSON.parse(resText); } catch (e) { if (cap) cap.fail(); return; }
    if (!res || typeof res !== 'object') { if (cap) cap.fail(); return; }
    var reqText = typeof reqBody === 'string' ? reqBody : '', req = null;
    try { req = reqText ? JSON.parse(reqText) : null; } catch (e) { req = null; }
    var before = ctx.current;
    if (res.phase && /\/storylet/i.test(url)) phase = res.phase;
    // 暂停记录时：不记任何东西，但继续跟踪当前所在的故事，恢复后下一次选择仍能带上完整的故事和选项
    if (!settings.recording) { if (cap) cap.fail(); scanContext(res); return; }
    try {
      if (/\/profile\/share/i.test(url)) onJournalShare(req, resText);
      // 只有真正的行动才产生新记录。游戏会在结果页后台重新拉取 /api/storylet，
      // 那份响应里也带着同一个结果——以前会被当成第二次选择记下来（重复记录的原因）。
      else if (ACTION_RE.test(url) && (res.endStorylet || res.storylet || res.messages)) {
        var rec = recordChoice(url, method, reqText, req, res, resText, before);
        if (cap) cap.attach(rec);
      } else if (settings.debugAll) recordRaw(url, method, reqText, resText);
    } catch (e) {
      console.error('[沦敦故事回顾] 解析失败，改存原始数据', e);
      recordRaw(url, method, reqText, resText);
      if (cap) cap.fail();
    }
    scanContext(res);
  }

  /* ---------- 翻译后的文字：按游戏页面的结构逐项读取 ----------
     以前是“抓结果出现后新增文字最多的一块”，实测常常抓到侧边栏或下一页。
     现在直接读游戏页面里对应的元素：故事标题/开头、每个选项（按选项编号）、结果标题/正文、每条变化，
     与原文一一对应地存进记录的 tr 字段；Chrome 翻译是慢慢替换文字的，所以会持续更新，直到你离开这一页。 */
  var phase = '', stTr = null, trRec = null, trUntil = 0, trSaveTimer = null, trTimer = null;
  function startCapture() { return null; } // 旧的整页抓取已停用
  function txt(el) { return el ? String(el.innerText || el.textContent || '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim() : ''; }
  function looksTranslated(s) {
    return /translated-(ltr|rtl)/.test(document.documentElement.className) || /[぀-ヿ㐀-鿿가-힯]/.test(s || '');
  }
  function readRoot() {
    var root = document.querySelector('.media--root'); if (!root) return null;
    return { name: txt(root.querySelector('.storylet-root__heading') || root.querySelector('.media__heading')),
      description: txt(root.querySelector('.storylet-root__description-container')) };
  }
  function readBranches() {
    var out = {}, n = 0;
    document.querySelectorAll('[data-branch-id]').forEach(function (b) {
      var desc = null;
      b.querySelectorAll('.branch__body p, p').forEach(function (p) { if (!desc && !p.closest('.challenge')) desc = p; });
      out[b.getAttribute('data-branch-id')] = { name: txt(b.querySelector('.branch__title')), description: txt(desc),
        challenges: Array.prototype.map.call(b.querySelectorAll('.challenge'), function (c) {
          return { name: txt(c.querySelector('.challenge__heading')), description: txt(c.querySelector('.challenge__description')) };
        }) };
      n++;
    });
    return n ? out : null;
  }
  /** 结果页的每条变化：译文 + 旁边小图标的名字（翻译不会改图片，用它来和服务器原文配对） */
  function readMessages() {
    return Array.prototype.map.call(document.querySelectorAll('.media--quality-updates .quality-update'), function (q) {
      var body = q.querySelector('.quality-update__body') || q, img = q.querySelector('.quality-update__left img');
      var m = img && /\/icons\/([^\/?#]+?)(small)?\.png/i.exec(img.getAttribute('src') || '');
      return { text: txt(body.firstElementChild || body), img: m ? m[1].toLowerCase() : '' };
    });
  }
  /** 按图标把页面上的译文对到服务器原文的每一条；对不上的留空 */
  function alignByImage(apiMsgs, dom) {
    var out = (apiMsgs || []).map(function () { return ''; }), used = [];
    (apiMsgs || []).forEach(function (m, i) {
      var want = String(m.image || '').toLowerCase().replace(/small$/, '');
      if (!want) return;
      for (var j = 0; j < dom.length; j++) if (!used[j] && dom[j].img === want) { out[i] = dom[j].text; used[j] = 1; return; }
    });
    // 图标对不上的：剩下的再按共同的数字、英文词配对（数量一致时才按顺序补齐）
    var ri = [], rt = [];
    out.forEach(function (v, i) { if (!v) ri.push(i); });
    dom.forEach(function (d, j) { if (!used[j]) rt.push(d.text); });
    if (ri.length && rt.length) {
      var al = FLC._alignTr(ri.map(function (i) { return apiMsgs[i].text; }), rt);
      ri.forEach(function (i, k) { out[i] = al[k] || ''; });
    }
    return out;
  }
  function setTr(rec, key, val) {
    rec.tr = rec.tr || {};
    if (JSON.stringify(rec.tr[key]) === JSON.stringify(val)) return;
    rec.tr[key] = val; rec._s = null;
    clearTimeout(trSaveTimer);
    trSaveTimer = setTimeout(function () { storeP.then(function (s) { return s.put(rec); }).then(function () { if (ui) ui.updated(rec); }); }, 800);
  }
  function syncTranslation() {
    trTimer = null;
    if (!settings.recording || settings.pageText === false) return;
    var root = readRoot(); if (!root || !root.name) return;
    if (phase === 'In' && ctx.current) {
      var br = readBranches(); if (!br) return;
      if (!looksTranslated(root.name + root.description + JSON.stringify(br))) return;
      stTr = { sid: String(ctx.current.id), storylet: root, branches: br };
      // 直接接续的故事：上一次选择的“结果”就是这个故事
      if (trRec && trRec.outcome && trRec.outcome.linked && String(trRec.outcome.id) === String(ctx.current.id) && Date.now() < trUntil)
        setTr(trRec, 'outcome', { name: root.name, description: root.description, messages: [] });
    } else if (phase === 'End' && trRec && Date.now() < trUntil) {
      if (document.querySelector('[data-branch-id]')) return; // 还是旧的故事页，结果页还没出来
      var dom = readMessages();
      if (!looksTranslated(root.name + root.description + dom.map(function (d) { return d.text; }).join(''))) return;
      setTr(trRec, 'outcome', { name: root.name, description: root.description, messages: alignByImage(trRec.messages, dom), aligned: true });
    }
  }
  function watchTranslation() {
    if (!window.MutationObserver || !document.body) return;
    new MutationObserver(function (muts) {
      if (ui && muts.every(function (m) { return ui.host.contains(m.target); })) return;
      if (!trTimer) trTimer = setTimeout(syncTranslation, 600);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) watchTranslation(); else document.addEventListener('DOMContentLoaded', watchTranslation);

  /* ---------- 拦截 XHR 与 fetch（只读，不修改游戏的任何请求） ---------- */
  var CHOOSE_RE = /choosebranch/i;
  function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return String(u || ''); } }

  var XP = XMLHttpRequest.prototype, xOpen = XP.open, xSend = XP.send;
  XP.open = function (method, url) {
    this.__flc = { m: String(method || 'GET').toUpperCase(), u: abs(url) };
    return xOpen.apply(this, arguments);
  };
  XP.send = function (body) {
    var info = this.__flc, xhr = this;
    if (info && API_RE.test(info.u)) {
      info.b = typeof body === 'string' ? body : '';
      var cap = CHOOSE_RE.test(info.u) ? startCapture() : null;
      xhr.addEventListener('loadend', function () {
        try {
          if (xhr.status < 200 || xhr.status >= 300) { if (cap) cap.fail(); return; }
          var txt;
          if (xhr.responseType === '' || xhr.responseType === 'text') txt = xhr.responseText;
          else if (xhr.responseType === 'json') txt = JSON.stringify(xhr.response);
          else { if (cap) cap.fail(); return; }
          handle(info.u, info.m, info.b, txt, cap);
        } catch (e) { console.warn('[沦敦故事回顾]', e); }
      });
    }
    return xSend.apply(this, arguments);
  };

  if (typeof window.fetch === 'function') {
    var oFetch = window.fetch;
    window.fetch = function (input, init) {
      var url = '', cap = null;
      try {
        url = abs(typeof input === 'string' ? input : (input && input.url) || String(input));
        if (API_RE.test(url) && CHOOSE_RE.test(url)) cap = startCapture();
      } catch (e) {}
      var p = oFetch.apply(this, arguments);
      try {
        if (API_RE.test(url)) {
          var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
          var bodyP = init && typeof init.body === 'string' ? Promise.resolve(init.body)
            : (input && typeof input.clone === 'function' && !(init && init.body) && method !== 'GET') ? input.clone().text().catch(function () { return ''; })
            : Promise.resolve('');
          p.then(function (r) {
            if (!r || !r.ok) { if (cap) cap.fail(); return; }
            return Promise.all([bodyP, r.clone().text()]).then(function (v) { handle(url, method, v[0], v[1], cap); });
          }).catch(function () { if (cap) cap.fail(); });
        }
      } catch (e) { console.warn('[沦敦故事回顾]', e); }
      return p;
    };
  }

  /* ---------- 导入游戏自带日志（Journal） ----------
     只读：用游戏自己的登录凭证调用 GET /api/journal，逐页读取，转换成本工具的记录。 */
  var API_BASE = 'https://api.fallenlondon.com/api';
  function authToken() {
    var t = '';
    try { t = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || ''; } catch (e) {}
    return String(t).replace(/"/g, '');
  }
  function apiGet(path) {
    var token = authToken();
    if (!token) return Promise.reject(new Error('没有找到登录状态，请先登录沦敦'));
    return fetch(API_BASE + path, {
      method: 'GET', credentials: 'include',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json, *.*', 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error('登录已过期，请刷新页面重新登录');
      if (!r.ok) throw new Error('服务器返回 ' + r.status);
      return r.text().then(function (t) { return { text: t, json: JSON.parse(t) }; });
    });
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function firstStr(o, keys) { for (var i = 0; i < keys.length; i++) { var v = o && o[keys[i]]; if (typeof v === 'string' && v) return v; } return ''; }
  function shareToRecord(s, charName, order) {
    var dateStr = firstStr(s, ['creationDate', 'createdAt', 'dateCreated', 'date', 'createdDate', 'timestamp', 'created']);
    var t = Date.parse(dateStr);
    return {
      id: 'journal-' + s.id, t: isNaN(t) ? order : t, v: 1, kind: 'journal',
      char: charName || '', area: firstStr(s, ['areaName']),
      storylet: null, branch: null,
      outcome: {
        id: s.id, name: firstStr(s, ['eventName', 'title', 'name']),
        // 游戏日志页面把 playerMessage 当正文显示；若接口另有更完整的描述字段就优先用它
        description: firstStr(s, ['eventDescription', 'description', 'content', 'text', 'body']) || firstStr(s, ['playerMessage']),
        image: firstStr(s, ['image', 'eventImage', 'imageName'])
      },
      journal: {
        playerMessage: firstStr(s, ['playerMessage', 'message']),
        flDate: firstStr(s, ['fallenLondonDateTime']),
        date: dateStr,
        tags: Array.isArray(s.tags) ? s.tags.map(function (x) { return x && (x.name || x.label) || String(x); }) : []
      },
      messages: [], pageText: '', starred: false, note: '',
      raw: { url: API_BASE + '/journal', method: 'GET', req: '', res: JSON.stringify(s) }
    };
  }
  var journalRunning = false;
  function importJournal() {
    if (journalRunning) return Promise.resolve(null);
    journalRunning = true;
    var status = function (m) { if (ui) ui.setStatus(m); };
    var charName = ctx.character, all = [], page = 1, pages = 0, base = Date.now() - 1e9;
    status('正在读取游戏日志…');
    var nameP = charName ? Promise.resolve(charName) : apiGet('/character/myself').then(function (r) {
      var c = r.json && (r.json.character || r.json); return (c && c.name) || '';
    });
    return nameP.then(function (name) {
      charName = name; if (name) ctx.character = name;
      function next() {
        var q = '/journal?page=' + page + (charName ? '&characterName=' + encodeURIComponent(charName) : '');
        return apiGet(q).then(function (r) {
          var d = r.json || {}, shares = Array.isArray(d.shares) ? d.shares : [];
          pages = d.pageCount || pages;
          shares.forEach(function (s) { all.push(shareToRecord(s, charName, base - all.length * 1000)); });
          status('正在读取游戏日志：第 ' + page + (pages ? ' / ' + pages : '') + ' 页，已读到 ' + all.length + ' 条…');
          if (d.hasNext && shares.length && page < 2000) { page++; return sleep(350).then(next); }
        });
      }
      return next();
    }).then(function () {
      return storeP.then(function (store) {
        return store.all().then(function (existing) {
          var have = new Map(existing.map(function (r) { return [r.id, r]; })), fresh = [], updated = 0, linked = 0, drop = [];
          var plain = function (h) { return FLC.htmlToText(h || '').replace(/\s+/g, ' ').trim().toLowerCase(); };
          var full = existing.filter(function (r) { return r.kind === 'choice' || r.kind === 'storylet'; }).sort(function (a, b) { return b.t - a.t; });
          var used = {};
          all = all.filter(function (r) {
            // 先找“已存入日志”且标题一致的完整记录，找不到再按结果标题找最近一条
            var name = plain(r.outcome.name), sid = String(r.outcome.id);
            var match = function (x) {
              if (used[x.id]) return false;
              if (x.journalEntry && String(x.journalEntry.id) !== sid) return false;
              return (x.outcome && plain(x.outcome.name) === name) || (x.kind === 'storylet' && x.storylet && plain(x.storylet.name) === name);
            };
            var hit = full.find(function (x) { return (x.journaled || (x.journalEntry && String(x.journalEntry.id) === sid)) && match(x); }) || full.find(match);
            if (!name || !hit) return true;
            used[hit.id] = 1; linked++;
            hit.journalEntry = { id: r.outcome.id, title: r.outcome.name, playerMessage: r.journal.playerMessage, flDate: r.journal.flDate, area: r.area, tags: r.journal.tags };
            hit._s = null; fresh.push(hit);
            if (have.has(r.id)) drop.push(r.id);
            return false;
          });
          all.forEach(function (r) {
            var ex = have.get(r.id);
            if (!ex) { fresh.push(r); return; }
            // 已导入过：保留你的星标和笔记，只刷新日志内容
            r.starred = ex.starred; r.note = ex.note; fresh.push(r); updated++;
          });
          return store.bulkPut(fresh).then(function () {
            return Promise.all(drop.map(function (id) { return store.remove(id); }));
          }).then(function () {
            var msg = '游戏日志导入完成：' + (linked ? linked + ' 条已和完整记录合并；' : '') + '另有 ' + all.length + ' 条只有日志内容（新增 ' + (all.length - updated) + '，更新 ' + updated + '）';
            status(''); if (ui) { ui.toast(msg); ui.reload(); }
            return { total: all.length + linked, linked: linked, added: all.length - updated, updated: updated };
          });
        });
      });
    }).catch(function (e) {
      status(''); if (ui) ui.toast('导入游戏日志失败：' + e.message);
      throw e;
    }).finally(function () { journalRunning = false; });
  }

  /* ---------- 给浏览器插件弹窗用的小接口 ---------- */
  window.__FLC_API = {
    version: 2,
    open: function () { if (ui) ui.open(); return !!ui; },
    isRecording: function () { return !!settings.recording; },
    setRecording: function (on) { settings.recording = !!on; saveSettings(); if (ui) ui.syncRecording(); return settings.recording; },
    importJournal: function () { if (ui) ui.open(); return importJournal(); },
    backup: function () { if (ui) ui.backup(); return !!ui; },
    stats: function () { return storeP.then(function (s) { return s.all(); }).then(function (rs) { var nb = rs.filter(function (r) { return r.kind === 'book'; }).length; rs = rs.filter(function (r) { return r.kind !== 'book'; }); return { count: rs.length, books: nb, journal: rs.filter(function (r) { return r.kind === 'journal'; }).length, storage: 'ok', character: ctx.character, recording: !!settings.recording }; }); },
    all: function () { return storeP.then(function (s) { return s.all(); }); }
  };

  /* ---------- 挂载界面 ---------- */
  function mount() {
    storeP.then(function (store) {
      ui = FLC.mountUI({ store: store, mode: 'userscript', css: FLC_CSS, settings: settings, saveSettings: saveSettings, importJournal: importJournal });
      pendingNotify.splice(0).forEach(function (r) { ui.notifyNew(r); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

})();
