const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os');
const EXT = path.join(__dirname, '..', 'dist', 'chrome-extension');
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<aside class="snippet"><p id="snip">A fog is rolling in from the river. The lamplighters are late tonight.</p></aside>
<div id="app" class="tab-content__bordered-container"></div>
<script>
const API='https://api.fallenlondon.com/api/storylet/';
function xhr(u,b){return new Promise(r=>{const x=new XMLHttpRequest();x.open('POST',u);x.onload=()=>r(JSON.parse(x.responseText));x.send(JSON.stringify(b));});}
const app=()=>document.getElementById('app');
function renderStorylet(s){ app().innerHTML='<div class="media media--root"><div class="media__body"><h1 class="media__heading heading heading--2 storylet-root__heading">'+s.name+'</h1><div class="storylet-root__description-container"><p>'+s.description+'</p></div></div></div>'+
  s.childBranches.map(b=>'<div class="media branch media--branch" data-branch-id="'+b.id+'"><div class="media__body branch__body"><div><h2 class="branch__title">'+b.name+'</h2><p>'+b.description+'</p></div>'+
  (b.challenges||[]).map(c=>'<div class="challenges"><div class="challenge"><div class="challenge__body"><h3 class="challenge__heading">'+c.name+'</h3><p class="challenge__description">'+c.description+'</p></div></div></div>').join('')+'</div></div>').join(''); }
function renderOutcome(r){ const e=r.endStorylet.event; app().innerHTML='<div class="media media--root"><div class="media__body"><h1 class="media__heading heading heading--2 storylet-root__heading">'+e.name+'</h1><div class="storylet-root__description-container"><p>'+e.description+'</p></div></div></div>'+
  '<div class="branch media--quality-updates">'+r.messages.slice().reverse().map(m=>'<div class="quality-update"><div class="quality-update__left"><div class="icon"><img src="//images.fallenlondon.com/icons/'+m.image+'small.png" width="40"></div></div><div class="quality-update__body"><div>'+m.message+'</div><div class="progress"><div class="progress__current">1</div><div class="progress__current">2</div></div></div></div>').join('')+'</div>'; }
// 模拟 Chrome 翻译：给 <html> 加 translated-ltr，并分批把文字换成译文（包在 <font> 里）
function tr(sel, delay){ setTimeout(()=>{ document.documentElement.classList.add('translated-ltr');
  document.querySelectorAll(sel).forEach(el=>{ const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); const ns=[]; let n; while((n=w.nextNode())) if(n.nodeValue.trim() && !n.parentElement.closest('font')) ns.push(n);
    ns.forEach(t=>{ const f=document.createElement('font'); f.style.verticalAlign='inherit'; f.textContent='【译】'+t.nodeValue.trim().replace(/[A-Za-z]+/g, w=>'译'.repeat(Math.min(w.length,4))); t.replaceWith(f); }); }); }, delay); }
function translatePage(){ tr('.media--root',300); tr('.branch__title, .branch__body > div > p',1200); tr('.challenge',1800); tr('.media--quality-updates',2200); tr('#snip',2400); }
window.begin=async()=>{ const r=await xhr(API+'begin',{eventId:700}); renderStorylet(r.storylet); translatePage(); };
window.choose=async(id)=>{ const r=await xhr(API+'choosebranch',{branchId:id}); renderOutcome(r); document.getElementById('snip').textContent='A completely different long sidebar snippet about a parade of umbrellas in the rain, which used to be grabbed by mistake.'; translatePage(); };
window.onwards=async()=>{ await xhr(API,{}); app().innerHTML='<div class="storylets">list</div>'; };
</script></body></html>`;
const ST = { id: 700, name: 'The Lantern in the Cellar', description: 'A lamp burns low in a cellar nobody remembers.', childBranches: [
  { id: 71, name: 'Trim the wick', description: 'A small, careful task.', challenges: [{ name: 'A straightforward challenge', description: 'Your Watchful quality gives you a 100% chance of success.' }] },
  { id: 72, name: 'Open the shutters', description: 'Let some air in.', challenges: [] }] };
let n = 0;
(async () => {
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 't-')), { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  await ctx.route(/^https?:/, async route => {
    const u = route.request().url();
    if (u.startsWith('https://www.fallenlondon.com')) return route.fulfill({ contentType: 'text/html', body: page });
    if (!u.startsWith('https://api')) return route.fulfill({ status: 404, body: '' });
    let j;
    if (u.includes('/begin')) j = { phase: 'In', storylet: ST };
    else if (u.includes('/choosebranch')) { n++; j = { phase: 'End', endStorylet: { event: { id: 7101, name: 'A steadier flame', description: 'The flame steadies, and the shadows settle back into the corners.' } },
      messages: n === 1 ? [{ type: 'X', message: 'The flame grows brighter.', image: 'heart' }, { type: 'Y', message: 'Your maximum Lamp Oil is now 1.', image: 'bones' }, { type: 'W', message: 'You feel strangely calm.', image: 'candle' }] : [{ type: 'Z', message: "Lamp Oil has not changed from 1.", image: 'heart' }] }; }
    else j = { phase: 'Available', storylets: [] };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(j), headers: { 'access-control-allow-origin': '*' } });
  });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.setViewportSize({ width: 1100, height: 1200 });
  await p.goto('https://www.fallenlondon.com/'); await p.waitForTimeout(400);
  await p.evaluate(() => window.begin()); await p.waitForTimeout(3000);
  await p.evaluate(() => window.choose(71)); await p.waitForTimeout(4500);
  await p.evaluate(() => window.onwards()); await p.waitForTimeout(800);
  await p.evaluate(() => window.begin()); await p.waitForTimeout(3000);
  await p.evaluate(() => window.choose(71)); await p.waitForTimeout(4500);
  const recs = (await p.evaluate(() => window.__FLC_API.all())).sort((a, b) => a.t - b.t);
  const t = recs[0].tr || {};
  console.log('records:', recs.length);
  console.log('storylet tr:', JSON.stringify(t.storylet));
  console.log('branch 71 tr:', JSON.stringify((t.branches || {})['71']));
  console.log('branch 72 tr name:', JSON.stringify(((t.branches || {})['72'] || {}).name));
  console.log('outcome tr:', JSON.stringify(t.outcome));
  const api = recs[0].messages.map(m => m.text), trm = (t.outcome || {}).messages || [];
  console.log('pairing (API order → captured translation):'); api.forEach((m, i) => console.log('   ', m.padEnd(45), '→', trm[i]));
  console.log('2nd outcome messages tr:', JSON.stringify((recs[1].tr || {}).outcome && recs[1].tr.outcome.messages));
  console.log('snippet leaked into any tr?', JSON.stringify(recs.map(r => r.tr)).includes('umbrellas'));
  // 面板：对照模式
  await p.evaluate(() => window.__FLC_API.open()); await p.waitForTimeout(400);
  const H = s => p.locator('#flc-host >> ' + s);
  await H('select.lang').selectOption('dual'); await p.waitForTimeout(400);
  console.log('dual mode: translated blocks shown:', await H('.trdual').count(), '| title subs:', await H('.trsub').count(), '| merged block label:', (await H('.fl-block .fl-pick').first().textContent()).replace(/\s+/g, ' '));
  await p.screenshot({ path: path.join(__dirname, 'tr-dual.png') });
  await H('select.lang').selectOption('tr'); await p.waitForTimeout(300);
  console.log('tr mode, storylet title shows:', await H('.fl-storylet .fl-h2').first().textContent());
  await p.screenshot({ path: path.join(__dirname, 'tr-only.png') });
  await ctx.close();
})();
