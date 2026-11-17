const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const us = fs.readFileSync(path.join(dist, 'fallen-london-chronicle.user.js'), 'utf8');
const LONG = Array.from({length: 12}, (_, i) => `第${i}句：雨落在沦敦的黑色屋顶上，<i>灯火</i>摇晃。`).join('<br/>') + '【结尾标记END】';
const storylet = { id: 111, name: 'A Visit to the Bazaar', image: 'bazaar', description: 'The <em>Bazaar</em> hums with the trade of ten thousand voices. Merchants of the Masters call their wares beneath the false-stars, and somewhere a devil is haggling over a soul at a very reasonable rate. You have come for something in particular — or perhaps you have come to be found. The lamps gutter. A clerk looks up. The Bazaar does not sleep, and neither, tonight, shall you.', teaser: 't',
  childBranches: [{ id: 501, name: 'Haggle', image: 'coin', description: 'Try your luck against a Master\'s clerk. A Persuasive challenge.' }, { id: 502, name: 'Leave', description: 'Go.' }] };
const choose1 = { phase: 'End', actions: 19,
  isSuccess: true, setting: { name: 'The Fifth City', id: 2 }, endStorylet: { isLinkingEvent: false, event: { id: 9001, name: 'A triumph of commerce', description: LONG, image: 'jade' }, rootEventId: 111 },
  messages: [{ type: 'DifficultyRollFailureMessage', message: 'You failed a Persuasive challenge!', image: 'cardfan', tooltip: 'x' }, { type: 'StandardQualityChangeMessage', message: 'You now have <b>3</b> x Jade Fragment.', image: 'jade' }, { type: 'X', message: 'Your Watchful is increasing...', possession: { image: 'eye' } }] };
const linked = { phase: 'In', storylet: { id: 222, name: 'Deeper In', description: 'A linked storylet appears.', childBranches: [{ id: 601, name: 'Go on', description: 'Onward' }] }, messages: [] };
const choose3 = { phase: 'End', endStorylet: { event: { id: 9003, name: 'The End', description: 'Fin.' } }, messages: { defaultMessages: [{ message: 'nested msg' }] } };
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="app"><header id="hdr">Actions: <span id="act">20</span></header><main id="main"></main></div>
<script>
function xhr(u, body){ return new Promise(r=>{ const x=new XMLHttpRequest(); x.open('POST',u); x.setRequestHeader('Content-Type','application/json'); x.onload=()=>r(JSON.parse(x.responseText)); x.send(JSON.stringify(body)); }); }
window.play = async function(){
  await xhr('https://api.fallenlondon.com/api/character/myself', {});
  const b = await xhr('https://api.fallenlondon.com/api/storylet/begin', {eventId:111});
  const r = await xhr('https://api.fallenlondon.com/api/storylet/choosebranch', {branchId:501, secondChanceIds:[]});
  document.getElementById('act').textContent='19';
  const d=document.createElement('div'); d.className='outcome'; d.innerHTML='<h2>'+r.endStorylet.event.name+'</h2><p>'+r.endStorylet.event.description+'</p><ul>'+r.messages.map(m=>'<li>'+m.message+'</li>').join('')+'</ul>';
  document.getElementById('main').replaceChildren(d);
  setTimeout(()=>{ d.querySelector('h2').textContent='商业的胜利（译）'; }, 700); // 模拟汉化插件
};
window.play2 = async function(){
  const l = await xhr('https://api.fallenlondon.com/api/storylet/choosebranch', {branchId:502, secondChanceIds:[]});
  const res = await fetch('https://api.fallenlondon.com/api/storylet/choosebranch', {method:'POST', body: JSON.stringify({branchId:601})});
  return res.json();
};
</script></body></html>`;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  let chooseCount = 0;
  await ctx.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith('https://images.fallenlondon.com')) { if (u.includes('small')) return route.fulfill({status:404, body:''}); const hue = [...u].reduce((a,c)=>a+c.charCodeAt(0),0)%360; return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns='http://www.w3.org/2000/svg' width='130' height='100'><rect x='2' y='2' width='126' height='96' rx='8' fill='hsl(${hue},35%,35%)' stroke='#d9c48a' stroke-width='4'/><circle cx='65' cy='50' r='26' fill='hsl(${hue},45%,70%)'/></svg>` }); }
    if (u.startsWith('https://www.fallenlondon.com')) return route.fulfill({ contentType: 'text/html', body: page });
    let j = {};
    if (u.endsWith('/character/myself')) j = { character: { name: 'Mr Tester' } };
    else if (u.endsWith('/storylet/begin')) j = { phase: 'In', storylet };
    else if (u.endsWith('/choosebranch')) { chooseCount++; j = chooseCount === 1 ? choose1 : chooseCount === 2 ? linked : choose3; }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(j), headers: { 'access-control-allow-origin': '*' } });
  });
  await ctx.addInitScript({ content: us });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') console.log('CONSOLE', m.text()); });
  await p.goto('https://www.fallenlondon.com/');
  await p.evaluate(() => window.play());
  await p.waitForTimeout(3500);
  await p.evaluate(() => window.play2());
  await p.waitForTimeout(3000);
  const recs = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('fl-chronicle'); r.onsuccess = () => { const g = r.result.transaction('records').objectStore('records').getAll(); g.onsuccess = () => res(g.result); }; }));
  recs.sort((a,b)=>a.t-b.t);
  console.log('records:', recs.length);
  const r0 = recs[0];
  console.log('char', r0.char, '| storylet', r0.storylet.name, '| branch', r0.branch.name, '| outcome', r0.outcome.name);
  console.log('full long text kept:', r0.outcome.description === LONG, r0.outcome.description.length, 'imgs', r0.storylet.image, r0.branch.image, r0.outcome.image, r0.outcome.success, r0.messages.map(m=>m.image), 'area', recs[1].area);
  console.log('messages', JSON.stringify(r0.messages.map(m=>m.text)));
  console.log('pageText has translation:', r0.pageText.includes('商业的胜利（译）'), 'has END:', r0.pageText.includes('结尾标记END'), 'len', r0.pageText.length, '| has header noise:', r0.pageText.includes('Actions'));
  console.log('raw kept:', !!r0.raw && r0.raw.res.length);
  console.log('rec2', recs[1].branch.name, '->', recs[1].outcome.name, 'linked', recs[1].outcome.linked);
  console.log('rec3 (fetch)', recs[2].storylet && recs[2].storylet.name, '›', recs[2].branch.name, '->', recs[2].outcome.name, JSON.stringify(recs[2].messages));
  // UI
  await p.keyboard.press('Alt+j');
  await p.waitForTimeout(500);
  await p.locator('#flc-host >> .list').evaluate(el => el.scrollTop = 560); await p.waitForTimeout(300); await p.screenshot({ path: path.join(__dirname, 'panel.png') }); await p.locator('#flc-host >> .list').evaluate(el => el.scrollTop = 0);
  await p.locator('#flc-host >> input.q').fill('jade');
  await p.waitForTimeout(400);
  console.log('search count:', await p.locator('#flc-host >> .count').textContent());
  await p.locator('#flc-host >> input.q').fill('');
  await p.waitForTimeout(400);
  await p.locator('#flc-host >> button[data-a="star"]').first().click();
  // export html & json
  for (const x of ['html', 'json-all', 'md']) {
    await p.locator('#flc-host >> button[data-h="export"]').click();
    const [dl] = await Promise.all([p.waitForEvent('download'), p.locator(`#flc-host >> button[data-x="${x}"]`).click()]);
    const f = path.join(__dirname, 'out-' + x + (x==='html'?'.html':x==='md'?'.md':'.json'));
    await dl.saveAs(f);
    const t = fs.readFileSync(f, 'utf8');
    console.log('export', x, dl.suggestedFilename(), t.length, 'has END:', t.includes('结尾标记END'), 'has 第399句:', t.includes('第399句'));
  }
  await p.screenshot({ path: path.join(__dirname, 'panel2.png') });
  const ctx3 = await browser.newContext(); await ctx3.route('https://images.fallenlondon.com/**', r => r.fulfill({ contentType: 'image/svg+xml', body: "<svg xmlns='http://www.w3.org/2000/svg' width='130' height='100'><rect x='2' y='2' width='126' height='96' rx='8' fill='#6b4a3a' stroke='#d9c48a' stroke-width='4'/><circle cx='65' cy='50' r='26' fill='#c9a080'/></svg>" })); const ex = await ctx3.newPage(); await ex.goto('file://' + path.join(__dirname, 'out-html.html')); await ex.setViewportSize({width:1000,height:1400}); await ex.waitForTimeout(500); await ex.screenshot({ path: path.join(__dirname, 'export.png') });
  // viewer
  const ctx2 = await browser.newContext(); const v = await ctx2.newPage();
  v.on('pageerror', e => console.log('VIEWER PAGEERROR', e.message));
  await v.goto('file://' + path.join(dist, 'fallen-london-chronicle-viewer.html'));
  await v.waitForTimeout(500);
  await v.locator('#flc-host >> input.file').setInputFiles(path.join(__dirname, 'out-json-all.json'));
  await v.waitForTimeout(800);
  console.log('viewer count:', await v.locator('#flc-host >> .count').textContent());
  await v.setViewportSize({ width: 1100, height: 900 });
  await v.screenshot({ path: path.join(__dirname, 'viewer.png') });
  await v.setViewportSize({ width: 390, height: 800 }); await v.waitForTimeout(300); await v.evaluate(()=>window.scrollTo(0, 1500));
  await v.screenshot({ path: path.join(__dirname, 'viewer-mobile.png') });
  await browser.close();
})();
