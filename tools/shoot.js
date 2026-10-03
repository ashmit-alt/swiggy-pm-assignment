// Screenshot index.html at chosen steps of one tab, and report text that spills out of the
// revised-architecture focus card.
//
// Usage: node tools/shoot.js <architecture|research|revised> <out-dir> [step ...] [--dark] [--phone]
//   A step is the number of → presses from the tab's first state.
//   Revised tab: 0 = the full map; each → opens the next part (1-37 = C1 to C10 parts, 38 = back to the map).
//   With no steps, the revised tab checks every step and screenshots only the ones listed.
//
// Needs Playwright with Chromium. In Claude Code cloud containers it lives in /opt/node-tools,
// and Google Fonts are fetched through curl because Chromium does not trust the proxy's certificate.
const path = require('path');
const { execFileSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }

const args = process.argv.slice(2);
const tab = args[0] || 'revised';
const out = args[1] || '/tmp/shots';
const steps = args.slice(2).filter(a => /^\d+$/.test(a)).map(Number);
const dark = args.includes('--dark'), phone = args.includes('--phone');
const file = 'file://' + path.resolve(__dirname, '..', 'index.html') + '#' + tab;

(async () => {
  execFileSync('mkdir', ['-p', out]);
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({
    viewport: phone ? { width: 400, height: 860 } : { width: 1440, height: 900 },
    deviceScaleFactor: phone ? 2 : 1, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async route => {
    const url = route.request().url();
    try {
      const body = execFileSync('curl', ['-sS', '-m', '20', '-A', 'Mozilla/5.0 Chrome/140.0', url]);
      await route.fulfill({ body, contentType: url.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } });
    } catch (e) { await route.abort(); }
  });
  await page.goto(file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const last = tab === 'revised' && !steps.length ? 38 : Math.max(0, ...steps);
  const suffix = (dark ? '-dark' : '') + (phone ? '-phone' : '');
  for (let n = 0, at = 0; n <= last; n++) {
    while (at < n) { await page.keyboard.press('ArrowRight'); at++; }
    await page.waitForTimeout(450);
    const report = await page.evaluate(() => {
      const bad = [], fk = document.getElementById('fk');
      if (fk && !fk.classList.contains('off') && document.getElementById('view-revised').offsetParent) {
        const bottom = fk.getBoundingClientRect().bottom;
        fk.querySelectorAll('.sv-col').forEach((c, i) => {
          const end = c.lastElementChild ? c.lastElementChild.getBoundingClientRect().bottom : 0;
          if (c.scrollHeight > c.clientHeight + 1 || end > bottom - 10) bad.push(`column ${i + 1} too tall`);
        });
        fk.querySelectorAll('.tbw, .fx, .stabs').forEach(t => { if (t.scrollWidth > t.clientWidth + 1) bad.push(`${t.className} too wide`); });
      }
      return document.getElementById('now').textContent + (bad.length ? '  !! ' + bad.join(', ') : '');
    });
    console.log(n, report);
    if (!steps.length || steps.includes(n)) await page.screenshot({ path: `${out}/${tab}-${n}${suffix}.png`, fullPage: phone });
  }
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('horizontal overflow:', overflowX, '| console errors:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
