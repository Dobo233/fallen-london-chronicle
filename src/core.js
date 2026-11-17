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
