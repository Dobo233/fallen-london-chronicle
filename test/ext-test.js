const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const EXT = path.join(__dirname, '..', 'dist', 'chrome-extension');
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body><main id="main"></main><script>
sessionStorage.setItem('access_token','"tok123"');
function xhr(u, body){ return new Promise(r=>{ const x=new XMLHttpRequest(); x.open('POST',u); x.onload=()=>r(JSON.parse(x.responseText)); x.send(JSON.stringify(body)); }); }
window.share = (body) => xhr('https://api.fallenlondon.com/api/profile/share', body);
window.play = async function(){
  await xhr('https://api.fallenlondon.com/api/storylet/begin', {eventId:18146});
  const r = await xhr('https://api.fallenlondon.com/api/storylet/choosebranch', {branchId:7988, secondChanceIds:[]});
  await xhr('https://api.fallenlondon.com/api/storylet', {});   // 游戏在结果页后台重新拉取
  const d=document.createElement('div'); d.innerHTML='<h1>'+r.endStorylet.event.name+'</h1><p>'+r.endStorylet.event.description+'</p>'; document.getElementById('main').replaceChildren(d);
};
</script></body></html>`;
const LONG = 'A'.repeat(20) + Array.from({length: 300}, (_, i) => ' sentence ' + i + '.').join('') + ' END-MARK';
const begin = { phase: 'In', storylet: { name: 'A Shelf of Old Ledgers', description: 'Books.', image: 'library', id: 18146,
  childBranches: [
    { name: 'Read the ledgers carefully', description: 'Read until the candles gutter.', image: 'eyebrow', id: 7988, actionCost: 1, buttonText: 'Go', isLocked: false,
      challenges: [{ name: 'A <em class="diff0">straightforward</em> challenge', description: 'Your Watchful quality gives you a 100% chance of success.', image: 'owl', category: 'Watchful', type: 'Skill', targetNumber: 50 }], qualityRequirements: [] },
    { name: 'Skim the marginalia', description: 'Someone has written in the margins.', image: 'book', id: 7989, isLocked: false, challenges: [], qualityRequirements: [] },
    { name: 'Consult the forbidden index', description: 'You would need a Key.', image: 'key', id: 7990, isLocked: true, challenges: [],
      qualityRequirements: [{ qualityName: 'Archive Key', tooltip: 'You need at least 1 Archive Key (you have 0)', image: 'key', status: 'Locked' }] }
  ] }, isSuccess: true };
const choose = { phase: 'End', isSuccess: true, setting: { name: 'The Fifth City', id: 2 },
  endStorylet: { rootEventId: 18146, event: { name: 'A puzzling entry', description: LONG, image: 'flames', id: 18153 }, isLinkingEvent: false },
  messages: [{ type: 'DifficultyRollFailureMessage', message: 'You failed a Watchful challenge!', image: 'cardfan' }, { type: 'X', message: 'Watchful is increasing...', image: 'owl' }] };
const share = (id, n) => ({ id, eventName: 'Journal event ' + n, areaName: 'Veilgarden', fallenLondonDateTime: n + 'th Jun 1897', playerMessage: 'Saved text number ' + n + ' <i>with markup</i>', tags: [] });
let authSeen = [];
(async () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flc-ext-'));
  const ctx = await chromium.launchPersistentContext(userDir, { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`], acceptDownloads: true });
  await ctx.route(/^https?:/, async route => {
    const u = route.request().url();
    if (u.startsWith('https://www.fallenlondon.com')) return route.fulfill({ contentType: 'text/html', body: page });
    if (u.startsWith('https://api.fallenlondon.com')) {
      const h = { 'access-control-allow-origin': 'https://www.fallenlondon.com', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
      let j = {};
      if (u.includes('/storylet/begin')) j = begin;
      else if (/\/api\/storylet$/.test(u)) j = Object.assign({}, choose, { phase: 'End' });
      else if (u.includes('/choosebranch')) j = choose;
      else if (u.includes('/character/myself')) j = { character: { name: 'Mr Tester' } };
      else if (u.includes('/profile/share')) j = { isSuccess: true, message: 'Saved to your journal' };
      else if (u.includes('/journal')) {
        authSeen.push(route.request().headers()['authorization']);
        const p = +new URL(u).searchParams.get('page');
        j = p === 1 ? { shares: [{ id: 12, eventName: 'A puzzling entry', areaName: 'The Fifth City', fallenLondonDateTime: '27th Oct 1897', playerMessage: 'A puzzling entry', tags: [] }, share(11, 3), share(10, 2)], page: 1, pageCount: 2, hasPrevious: false, hasNext: true }
                    : { shares: [share(9, 1)], page: 2, pageCount: 2, hasPrevious: true, hasNext: false };
      }
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(j), headers: h });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  // 找到插件 ID
  let sw = ctx.serviceWorkers()[0];
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('https://www.fallenlondon.com/');
  await p.waitForTimeout(500);
  console.log('API present:', await p.evaluate(() => !!window.__FLC_API && window.__FLC_API.version));
  await p.evaluate(() => window.play());
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.share({ contentClass: 'EventConclusion', contentKey: '18153', image: 'flames', message: 'A puzzling entry' }));
  await p.waitForTimeout(800);
  const r1 = await p.evaluate(() => window.__FLC_API.importJournal());
  console.log('journal import:', JSON.stringify(r1), 'auth header:', authSeen[0]);
  const r2 = await p.evaluate(() => window.__FLC_API.importJournal());
  console.log('re-import (dedupe):', JSON.stringify(r2));
  const recs = await p.evaluate(() => window.__FLC_API.all());
  console.log('choice records after one choice + background refetch:', recs.filter(r => r.kind === 'choice').length);
  recs.sort((a, b) => b.t - a.t);
  const choice = recs.find(r => r.kind === 'choice');
  console.log('options kept:', choice.storylet.branches.length, '| challenge:', choice.branch.challenges[0].description, '| locked req:', choice.storylet.branches[2].requirements[0].tooltip);
  console.log('journaled:', JSON.stringify(choice.journaled && choice.journaled.message), '| merged journal entry:', JSON.stringify(choice.journalEntry));
  console.log('records', recs.length, '| choice full text:', choice.outcome.description === LONG, 'success:', choice.outcome.success, 'area:', choice.area, 'branch:', choice.branch.name);
  console.log('journal order (newest first):', recs.filter(r => r.kind === 'journal').map(r => r.outcome.name + ' / ' + r.outcome.description.slice(0, 20)).join(' | '));
  await p.screenshot({ path: path.join(__dirname, 'ext-page.png') });
  // 模拟旧版本留下的重复记录，然后刷新页面看是否被自动清理
  await p.evaluate(async () => {
    const all = await window.__FLC_API.all(); const c = all.find(r => r.kind === 'choice');
    const dup = JSON.parse(JSON.stringify(c)); dup.id = 'legacy-dup'; dup.branch = null; dup.t += 500; dup.note = '重复那条上的笔记'; dup.raw.url = 'https://api.fallenlondon.com/api/storylet';
    const req = indexedDB.open('fl-chronicle'); await new Promise(r => req.onsuccess = r);
    await new Promise(r => { const tx = req.result.transaction('records', 'readwrite'); tx.objectStore('records').put(dup); tx.oncomplete = r; });
    localStorage.removeItem('flc-dedupe-v1');
  });
  console.log('before reload:', (await p.evaluate(() => window.__FLC_API.all())).filter(r => r.kind === 'choice').length, 'choice records (1 real + 1 seeded legacy duplicate)');
  await p.reload(); await p.waitForTimeout(1500);
  const after = (await p.evaluate(() => window.__FLC_API.all())).filter(r => r.kind === 'choice');
  console.log('after reload cleanup:', after.length, 'choice record(s); note merged:', JSON.stringify(after[0] && after[0].note));
  await p.evaluate(() => window.__FLC_API.open());
  await p.waitForTimeout(600);
  await p.locator('#flc-host >> button[data-a="others"]').first().click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'ext-panel.png') });
  // 扩展页面：popup 与阅读器
  // 找扩展 id
  const extId = await (async () => {
    const pg = await ctx.newPage(); await pg.goto('chrome://extensions'); await pg.waitForTimeout(500);
    const id = await pg.evaluate(() => chrome.management ? new Promise(r => chrome.management.getAll(a => r(a.find(x => x.name.includes('沦敦')).id))) : null).catch(() => null);
    await pg.close(); return id;
  })();
  console.log('extension id:', extId);
  const pop = await ctx.newPage();
  pop.on('pageerror', e => console.log('POPUP PAGEERROR', e.message));
  await pop.goto(`chrome-extension://${extId}/popup.html`);
  await pop.waitForTimeout(800);
  // popup 自己是活动标签，所以会显示“当前不是沦敦页面”——这里直接测试脚本注入 + 复制到阅读器的流程
  const copied = await pop.evaluate(async () => {
    const [t] = await chrome.tabs.query({ url: 'https://www.fallenlondon.com/*' });
    const res = await chrome.scripting.executeScript({ target: { tabId: t.id }, world: 'MAIN', func: () => window.__FLC_API.all() });
    const recs = res[0].result; await FLC.makeIDBStore('fl-chronicle-viewer').bulkPut(recs); return recs.length;
  });
  console.log('popup->reader copied:', copied, '| popup off-fl visible:', await pop.isVisible('#off-fl'));
  await pop.setViewportSize({ width: 300, height: 360 });
  await pop.screenshot({ path: path.join(__dirname, 'ext-popup.png') });
  const rd = await ctx.newPage();
  rd.on('pageerror', e => console.log('READER PAGEERROR', e.message));
  await rd.setViewportSize({ width: 1000, height: 1100 });
  await rd.goto(`chrome-extension://${extId}/reader.html`);
  await rd.waitForTimeout(1200);
  console.log('reader count:', await rd.locator('#flc-host >> .count').textContent());
  await rd.screenshot({ path: path.join(__dirname, 'ext-reader.png') });
  await rd.locator('#flc-host >> select.f-story').selectOption('游戏日志');
  await rd.waitForTimeout(500);
  await rd.screenshot({ path: path.join(__dirname, 'ext-reader-journal.png') });
  await ctx.close();
})();
