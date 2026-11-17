const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const EXT = path.join(__dirname, '..', 'dist', 'chrome-extension');
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body><main id="main" style="height:1500px;background:#1d1d1d"></main><script>
function xhr(u, body){ return new Promise(r=>{ const x=new XMLHttpRequest(); x.open('POST',u); x.onload=()=>r(JSON.parse(x.responseText)); x.send(JSON.stringify(body)); }); }
const A='https://api.fallenlondon.com/api/storylet/';
window.flow = async function(){
  await xhr(A+'begin', {eventId:100});                 // 故事 A
  await xhr(A+'choosebranch', {branchId:101});          // A 的选择直接进入故事 B（linked）
  await xhr(A+'choosebranch', {branchId:201});          // 在 B 里选择：结果是 linking event
  await xhr(A+'begin', {eventId:300});                  // 游戏随即打开故事 C
  await xhr(A+'choosebranch', {branchId:301});
  await xhr(A+'begin', {eventId:400});                  // 无关的故事 D
  await xhr(A+'choosebranch', {branchId:401});
};
</script></body></html>`;
const st = (id, name, img, bids) => ({ id, name, image: img, description: name + ' — the opening text of this storylet.', childBranches: bids.map(b => ({ id: b, name: 'Option ' + b, description: 'Do option ' + b + '.', challenges: [] })) });
const S = { 100: st(100, 'The Velvet Letter', 'letter', [101, 102]), 200: st(200, 'A Meeting at Midnight', 'candle', [201, 202]), 300: st(300, 'The Velvet Conclusion', 'rose', [301]), 400: st(400, 'Count the Pigeons on the Roof', 'beetle', [401]) };
(async () => {
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'b-')), { channel: 'chromium', headless: true, acceptDownloads: true, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  await ctx.route(/^https?:/, async route => {
    const u = route.request().url();
    if (u.startsWith('https://www.fallenlondon.com')) return route.fulfill({ contentType: 'text/html', body: page });
    if (u.startsWith('https://images.fallenlondon.com')) { const h = [...u].reduce((a, c) => a + c.charCodeAt(0), 0) % 360; return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='130'><rect width='100' height='130' fill='hsl(${h},30%,32%)'/><circle cx='50' cy='65' r='28' fill='hsl(${h},45%,68%)'/></svg>` }); }
    if (u.startsWith('https://fonts')) return route.fulfill({ status: 404, body: '' });
    let j = {}; const body = JSON.parse(route.request().postData() || '{}');
    if (u.includes('/begin')) j = { phase: 'In', storylet: S[body.eventId] };
    else if (u.includes('/choosebranch')) {
      const b = body.branchId;
      if (b === 101) j = { phase: 'In', storylet: S[200], messages: [] };   // 直接接续到 B
      else j = { phase: 'End', endStorylet: { event: { id: 9000 + b, name: 'Outcome of ' + b, description: 'What happened after option ' + b + '.', image: 'well' }, isLinkingEvent: b === 201 }, messages: [{ type: 'X', message: 'A change from ' + b, image: 'owl' }] };
    } else j = { phase: 'Available', storylets: [] };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(j), headers: { 'access-control-allow-origin': '*' } });
  });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('dialog', d => d.type() === 'prompt' ? d.accept(d.message().includes('名字') ? '天鹅绒信件（长篇）' : '') : d.accept());
  await p.setViewportSize({ width: 1200, height: 900 });
  await p.goto('https://www.fallenlondon.com/'); await p.waitForTimeout(400);
  await p.evaluate(() => window.flow()); await p.waitForTimeout(2500);
  console.log('records:', (await p.evaluate(() => window.__FLC_API.all())).length);
  const H = s => p.locator('#flc-host >> ' + s);
  await p.evaluate(() => window.__FLC_API.open()); await p.waitForTimeout(400);
  await H('button[data-h="books"]').click(); await p.waitForTimeout(400);
  console.log('sidebar:', (await H('.bside').innerText()).replace(/\s+/g, ' '));
  console.log('suggested line:', (await H('.bline-steps').innerText()).replace(/\s+/g, ' '));
  await p.screenshot({ path: path.join(__dirname, 'books-sugg.png') });
  await H('button[data-b="mkline"]').click(); await p.waitForTimeout(500);
  console.log('book chapters:', JSON.stringify(await H('.chap-name').allInnerTexts()));
  // 回到记录列表，把故事 D 手动收进这本日志
  await H('button[data-h="books"]').click(); await p.waitForTimeout(300);
  const dCard = H('.rec.fl:has(.fl-h2:text("Count the Pigeons on the Roof"))').first();
  await dCard.locator('button[data-a="book"]').click(); await p.waitForTimeout(200);
  await H('.bmenu input[type=checkbox]').first().check(); await p.waitForTimeout(400);
  console.log('chip on D card:', await dCard.locator('.bchip').allInnerTexts());
  await H('.title').click(); await p.waitForTimeout(100);
  console.log('menu closed by clicking elsewhere in the panel:', await H('.bmenu').count() === 0);
  // 日志本里：把第 4 章上移、改名、写介绍
  await H('button[data-h="books"]').click(); await p.waitForTimeout(400);
  await H('.chap').nth(3).locator('button[data-b="up"]').click(); await p.waitForTimeout(400);
  console.log('after moving ch.4 up:', JSON.stringify(await H('.chap-name').allInnerTexts()));
  await H('input.btitle').fill('天鹅绒之夜'); await H('input.btitle').press('Enter'); await H('textarea.bdesc').click(); await p.waitForTimeout(400);
  await H('textarea.bdesc').fill('一封信引出的整夜奇遇。'); await H('input.btitle').click(); await p.waitForTimeout(300);
  console.log('sidebar after rename:', (await H('.bitem.on').innerText()).replace(/\s+/g, ' '));
  await p.screenshot({ path: path.join(__dirname, 'books-book.png') });
  await H('.chap').nth(0).scrollIntoViewIfNeeded();
  // 导出这本日志
  for (const f of ['md', 'html']) {
    const [dl] = await Promise.all([p.waitForEvent('download'), H(`button[data-b="exp"][data-f="${f}"]`).click()]);
    const fp = path.join(__dirname, 'book.' + f); await dl.saveAs(fp); const t = fs.readFileSync(fp, 'utf8');
    console.log('export', f, dl.suggestedFilename(), '| chapters:', (t.match(/第 \d 章/g) || []).length, '| has outcome text:', t.includes('What happened after option 201'));
  }
  // 完整备份里有日志本，并能在阅读器里打开
  await H('button[data-h="books"]').click(); await p.waitForTimeout(200);
  await H('button[data-h="export"]').click();
  const [bk] = await Promise.all([p.waitForEvent('download'), H('button[data-x="json-all"]').click()]);
  const bf = path.join(__dirname, 'books-backup.json'); await bk.saveAs(bf);
  const data = JSON.parse(fs.readFileSync(bf, 'utf8'));
  console.log('backup contains book:', data.records.filter(r => r.kind === 'book').map(b => b.name + ' / ' + b.chapters.length + ' 章 / ' + b.desc));
  const v = await ctx.newPage(); v.on('pageerror', e => console.log('VIEWER PAGEERROR', e.message));
  await v.setViewportSize({ width: 1200, height: 900 });
  await v.goto('file://' + path.join(__dirname, '..', 'dist', 'fallen-london-chronicle-viewer.html'));
  await v.locator('#flc-host >> input.file').setInputFiles(bf); await v.waitForTimeout(600);
  await v.locator('#flc-host >> button[data-h="books"]').click(); await v.waitForTimeout(400);
  console.log('viewer book chapters:', JSON.stringify(await v.locator('#flc-host >> .chap-name').allInnerTexts()));
  await v.screenshot({ path: path.join(__dirname, 'books-viewer.png') });
  await v.setViewportSize({ width: 390, height: 800 }); await v.waitForTimeout(300);
  await v.screenshot({ path: path.join(__dirname, 'books-mobile.png') });
  await ctx.close();
})();
