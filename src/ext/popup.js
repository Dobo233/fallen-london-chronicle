(function () {
  'use strict';
  // Firefox 用 browser 接口（返回 Promise），Chrome / Edge 用 chrome 接口
  var api = (typeof browser !== 'undefined' && browser.tabs) ? browser : chrome;
  var FL_RE = /^https:\/\/(www\.)?fallenlondon\.com\//;
  var $ = function (id) { return document.getElementById(id); };
  var tab = null;

  function msg(t, err) { var m = $('msg'); m.textContent = t || ''; m.className = 'msg' + (err ? ' err' : ''); }
  function show(id) { ['on-fl', 'need-reload', 'off-fl'].forEach(function (x) { $(x).hidden = x !== id; }); }
  function inPage(fn, args) {
    return api.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: fn, args: args || [] })
      .then(function (res) { return res && res[0] ? res[0].result : undefined; });
  }

  function refresh() {
    return inPage(function () {
      if (window.__FLC_API && window.__FLC_API.isRecording) return window.__FLC_API.stats();
      return { missing: true, legacy: !!window.__FLC_LOADED__ };
    }).then(function (st) {
      if (!st || st.missing) {
        show('need-reload');
        $('sub').textContent = '未在此页面运行';
        if (st && st.legacy) $('reload-msg').textContent = '检测到旧版 Tampermonkey 脚本正在运行。请在 Tampermonkey 里停用“沦敦故事回顾”脚本，再刷新页面。';
        return;
      }
      show('on-fl');
      charName = st.character || '';
      $('rec').checked = st.recording !== false; recLabel();
      $('stats').innerHTML = '已保存 <b>' + st.count + '</b> 条记录' + (st.journal ? '（其中游戏日志 ' + st.journal + ' 条）' : '');
    }).catch(function (e) { show('need-reload'); msg(e.message, true); });
  }

  var charName = '';
  function recLabel() {
    var on = $('rec').checked;
    $('rec-label').textContent = on ? '记录中' : '已暂停记录';
    $('sub').textContent = (charName ? '角色：' + charName + ' · ' : '') + (on ? '正在记录' : '记录已暂停');
  }
  $('rec').onchange = function () {
    var on = $('rec').checked; recLabel();
    inPage(function (v) { return window.__FLC_API.setRecording(v); }, [on])
      .then(function () { msg(on ? '已恢复记录。' : '已暂停：在你重新打开之前，选择不会被记下。'); })
      .catch(function (e) { msg(e.message, true); });
  };

  function openReader() { return api.tabs.create({ url: api.runtime.getURL('reader.html') }); }

  api.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
    tab = tabs[0];
    if (!tab || !FL_RE.test(tab.url || '')) { show('off-fl'); $('sub').textContent = '当前不是沦敦页面'; return; }
    return refresh();
  });

  $('goto').onclick = function () { api.tabs.create({ url: 'https://www.fallenlondon.com/' }); window.close(); };
  $('reload').onclick = function () { api.tabs.reload(tab.id); window.close(); };
  $('reader-only').onclick = function () { openReader(); window.close(); };

  $('open').onclick = function () { inPage(function () { return window.__FLC_API.open(); }).then(function () { window.close(); }); };
  $('backup').onclick = function () { inPage(function () { return window.__FLC_API.backup(); }).then(function () { msg('备份文件已开始下载。'); }); };

  $('journal').onclick = function () {
    var b = $('journal'); b.disabled = true; msg('正在读取游戏日志，进度显示在页面的回顾面板里…');
    inPage(function () {
      return window.__FLC_API.importJournal().then(function (r) { return r; }, function (e) { return { error: e.message }; });
    }).then(function (r) {
      b.disabled = false;
      if (!r) msg('已经在导入中。');
      else if (r.error) msg('导入失败：' + r.error, true);
      else { msg('完成：日志共 ' + r.total + ' 条' + (r.linked ? '，其中 ' + r.linked + ' 条已和完整记录（含选项与后果）合并' : '') + '；只有日志内容的新增 ' + r.added + ' 条。' + (r.total === 0 ? '（这个角色的游戏日志是空的）' : '')); refresh(); }
    }).catch(function (e) { b.disabled = false; msg(e.message, true); });
  };

  $('reader').onclick = function () {
    var b = $('reader'); b.disabled = true; msg('正在复制记录到阅读器…');
    inPage(function () { return window.__FLC_API.all(); }).then(function (recs) {
      recs = recs || [];
      var store = FLC.makeIDBStore('fl-chronicle-viewer');
      return store.bulkPut(recs).then(function () { return openReader(); });
    }).then(function () { window.close(); })
      .catch(function (e) { b.disabled = false; msg('失败：' + e.message, true); });
  };
})();
