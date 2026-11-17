const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const EXT = path.join(__dirname, '..', 'dist', 'chrome-extension');
const src = fs.readFileSync(path.join(__dirname, 'group-test.js'), 'utf8');
// 复用 group-test 里的模拟页面和数据
const page = eval(src.match(/const page = (`[\s\S]*?`);/)[1]);
eval(src.match(/const branches = [\s\S]*?const out = .*?;\n/)[0].replace(/const /g, 'global.'));
(async () => {
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'r-')), { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  await ctx.route(/^https?:/, async route => {
    const u = route.request().url();
    if (u.startsWith('https://www.fallenlondon.com')) return route.fulfill({ contentType: 'text/html', body: page });
    if (u.startsWith('https://images.fallenlondon.com')) return route.fulfill({ status: 404, body: '' });
    let j = {};
    if (u.includes('/storylet/begin')) j = JSON.parse(route.request().postData()).eventId === 500 ? global.other : global.lib;
    else if (u.includes('/choosebranch')) { const b = JSON.parse(route.request().postData()).branchId; const o = global.out[b]; j = { phase: 'End', endStorylet: { event: { id: 9000 + b, name: o[0], image: o[1], description: o[2] } }, messages: [] }; }
    else if (/\/api\/storylet$/.test(u)) j = { phase: 'Available', storylets: [] };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(j), headers: { 'access-control-allow-origin': '*' } });
  });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('https://www.fallenlondon.com/'); await p.waitForTimeout(400);
  const count = () => p.evaluate(() => window.__FLC_API.all().then(a => a.length));
  // 1) 面板按钮暂停
  await p.evaluate(() => window.__FLC_API.open()); await p.waitForTimeout(300);
  await p.locator('#flc-host >> button[data-h="rec"]').click(); await p.waitForTimeout(200);
  console.log('button after click:', await p.locator('#flc-host >> button[data-h="rec"]').textContent(), '| api says recording:', await p.evaluate(() => window.__FLC_API.isRecording()));
  await p.evaluate(() => window.__FLC_API.close ? 0 : 0);
  await p.keyboard.press('Escape');
  await p.evaluate(() => window.pick(7988)); await p.waitForTimeout(400);
  console.log('records after a choice while paused:', await count());
  await p.screenshot({ path: path.join(__dirname, 'rec-paused.png'), clip: { x: 1000, y: 600, width: 280, height: 120 } });
  // 2) 刷新后仍保持暂停
  await p.reload(); await p.waitForTimeout(400);
  console.log('after reload still paused:', !(await p.evaluate(() => window.__FLC_API.isRecording())));
  // 3) 用插件弹窗的开关恢复（把弹窗的“当前标签页”指向游戏页）
  const pg = await ctx.newPage(); await pg.goto('chrome://extensions'); await pg.waitForTimeout(300);
  const id = await pg.evaluate(() => new Promise(r => chrome.management.getAll(a => r(a.find(x => x.name.includes('沦敦')).id)))); await pg.close();
  const pop = await ctx.newPage(); pop.on('pageerror', e => console.log('POPUP ERROR', e.message));
  await pop.addInitScript(() => { const q = chrome.tabs.query.bind(chrome.tabs); chrome.tabs.query = (o) => (o && o.active) ? q({ url: 'https://www.fallenlondon.com/*' }) : q(o); });
  await pop.setViewportSize({ width: 300, height: 330 });
  await pop.goto(`chrome-extension://${id}/popup.html`); await pop.waitForTimeout(700);
  console.log('popup switch shows:', await pop.textContent('#rec-label'));
  await pop.screenshot({ path: path.join(__dirname, 'rec-popup-paused.png') });
  await pop.click('label.switch'); await pop.waitForTimeout(400);
  console.log('popup switch now:', await pop.textContent('#rec-label'), '| page recording:', await p.evaluate(() => window.__FLC_API.isRecording()));
  await pop.screenshot({ path: path.join(__dirname, 'rec-popup-on.png') });
  // 4) 恢复后（暂停期间进入的故事）仍能完整记录
  await p.evaluate(() => window.pick(7989)); await p.waitForTimeout(400);
  const recs = await p.evaluate(() => window.__FLC_API.all());
  console.log('records after resuming + a choice:', recs.length, '| has story & all options:', recs[0] && recs[0].storylet && recs[0].storylet.name, recs[0] && recs[0].storylet.branches.length, '| chosen:', recs[0] && recs[0].branch.name);
  await p.evaluate(() => window.__FLC_API.open()); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'rec-panel.png'), clip: { x: 100, y: 0, width: 1080, height: 110 } });
  await ctx.close();
})();
