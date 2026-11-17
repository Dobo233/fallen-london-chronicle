const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const EXT = path.join(__dirname, '..', 'dist', 'chrome-extension');
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body><main id="main"></main><script>
function xhr(u, body){ return new Promise(r=>{ const x=new XMLHttpRequest(); x.open('POST',u); x.onload=()=>r(JSON.parse(x.responseText)); x.send(JSON.stringify(body)); }); }
window.pick = async function(bid){
  await xhr('https://api.fallenlondon.com/api/storylet/begin', {eventId:18146});
  await xhr('https://api.fallenlondon.com/api/storylet/choosebranch', {branchId:bid, secondChanceIds:[]});
  await xhr('https://api.fallenlondon.com/api/storylet', {});
};
window.other = async function(){
  await xhr('https://api.fallenlondon.com/api/storylet/begin', {eventId:500});
  await xhr('https://api.fallenlondon.com/api/storylet/choosebranch', {branchId:501, secondChanceIds:[]});
};
</script></body></html>`;
const branches = [
  { name: 'Diligent research', description: 'Read until the candles gutter.', image: 'eyebrow', id: 7988, challenges: [{ name: 'A <em>straightforward</em> challenge', description: 'Your Watchful quality gives you a 100% chance of success.', image: 'owl' }], qualityRequirements: [] },
  { name: 'Skim the marginalia', description: 'Someone has written in the margins.', image: 'book', id: 7989, challenges: [], qualityRequirements: [] },
  { name: 'Consult the forbidden index', description: 'You would need a Key.', image: 'key', id: 7990, isLocked: true, challenges: [], qualityRequirements: [{ qualityName: 'Archive Key', tooltip: 'You need at least 1 Archive Key (you have 0)' }] }];
const lib = { phase: 'In', storylet: { name: 'A library of your own', description: 'Your shelves groan under the weight of acquired knowledge.', image: 'library', id: 18146, childBranches: branches } };
const other = { phase: 'In', storylet: { name: 'Another story', description: 'Elsewhere.', image: 'well', id: 500, childBranches: [{ id: 501, name: 'Do it', description: 'x', challenges: [] }] } };
const out = { 7988: ['An unpleasant dream', 'flames', 'You dreamt of fire.'], 7989: ['A curious note', 'letter', 'In the margin: a name you know.'], 501: ['Done', 'well', 'Done.'] };
(async () => {
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'g-')), { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`], acceptDownloads: true });
  let lastBegin = lib;
  await ctx.route(/^https?:/, async route => {
    const u = route.request().url(), h = { 'access-control-allow-origin': '*' };
    if (u.startsWith('https://www.fallenlondon.com')) return route.fulfill({ contentType: 'text/html', body: page });
    if (u.startsWith('https://images.fallenlondon.com')) return route.fulfill({ contentType: 'image/svg+xml', body: "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='130'><rect width='100' height='130' fill='#6b4a3a'/><circle cx='50' cy='65' r='26' fill='#c9a080'/></svg>" });
    let j = {};
    if (u.includes('/storylet/begin')) { const body = JSON.parse(route.request().postData()); lastBegin = body.eventId === 500 ? other : lib; j = lastBegin; }
    else if (u.includes('/choosebranch')) { const b = JSON.parse(route.request().postData()).branchId; const o = out[b]; j = { phase: 'End', isSuccess: true, endStorylet: { event: { id: 9000 + b, name: o[0], image: o[1], description: o[2] } }, messages: [{ type: 'X', message: 'Change after option ' + b, image: 'owl' }] }; }
    else if (/\/api\/storylet$/.test(u)) j = { phase: 'Available', storylets: [] };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(j), headers: h });
  });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.setViewportSize({ width: 1100, height: 1500 });
  await p.goto('https://www.fallenlondon.com/'); await p.waitForTimeout(400);
  await p.evaluate(() => window.pick(7988)); await p.waitForTimeout(300);
  await p.evaluate(() => window.pick(7989)); await p.waitForTimeout(300);
  await p.evaluate(() => window.other()); await p.waitForTimeout(300);
  await p.evaluate(() => window.pick(7988)); await p.waitForTimeout(2500);
  const recs = await p.evaluate(() => window.__FLC_API.all());
  console.log('records stored separately:', recs.length);
  await p.evaluate(() => window.__FLC_API.open()); await p.waitForTimeout(500);
  await p.locator('#flc-host >> select.sort').selectOption('asc'); await p.waitForTimeout(400);
  const info = await p.evaluate(() => { const r = document.getElementById('flc-host').shadowRoot; return { groups: [...r.querySelectorAll('.fl-group')].map(g => g.querySelectorAll('.rec.sub').length), singles: r.querySelectorAll('.fl-tab > .rec').length, labels: [...r.querySelectorAll('.fl-group .fl-branch.chosen .fl-btn')].map(x => x.textContent) }; });
  console.log('panel (old→new): story cards with multiple choices:', JSON.stringify(info.groups), '| single cards:', info.singles, '| option labels:', JSON.stringify(info.labels));
  await p.screenshot({ path: path.join(__dirname, 'group.png') });
  // 导出 Markdown 检查
  await p.locator('#flc-host >> button[data-h="export"]').click();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('#flc-host >> button[data-x="md"]').click()]);
  const f = path.join(__dirname, 'group.md'); await dl.saveAs(f);
  const md = fs.readFileSync(f, 'utf8');
  console.log('markdown: grouped header:', /A library of your own（2 次选择）/.test(md), '| 第 2 次 section:', md.includes('#### 第 2 次：选择了「Skim the marginalia」'));
  // 删除组内一条后，组变成单条显示
  p.on('dialog', d => d.accept());
  await p.locator('#flc-host >> .fl-group .rec.sub button[data-a="del"]').first().click(); await p.waitForTimeout(500);
  console.log('after deleting one choice in the group, remaining group sub-records:', await p.evaluate(() => [...document.getElementById('flc-host').shadowRoot.querySelectorAll('.fl-group')].map(g => g.querySelectorAll('.rec.sub').length)));
  await ctx.close();
})();
