// Smoke test: node mockup/prototype2/smoke.js [route ...] -> loads the built page, visits routes,
// prints page errors and saves screenshots to $SHOTS (default: /tmp) as <route>.png; a route 'MOCK-057/overview'
// opens that case first (saved as MOCK-057_overview.png)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['worklist','patients','patient','overview','segments','cleaning','results','report','issued','templates','mapping','compare','upload','activity','settings',
    'MOCK-057/patient','MOCK-057/overview','MOCK-057/results','MOCK-057/report','MOCK-061/patient','MOCK-061/overview','MOCK-061/results','MOCK-061/report','MOCK-042/overview'];
  const shots = process.env.SHOTS || '/tmp';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const file = path.resolve(__dirname, '../../outputs/prototype/v4-clinic-workspace.html');
  const html = require('fs').readFileSync(file, 'utf8');
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body>' + html + '</body></html>', { waitUntil: 'load' });
  for (const r of routes) {
    await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(400);
    const h = await p.evaluate(() => (document.querySelector('#main h1, #main .who, #main h2') || {}).textContent || '(no heading)');
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(r.padEnd(18), '|', h.trim().slice(0, 60), '| scrollWidth', sw);
    if (process.env.SHOTS) await p.screenshot({ path: path.join(shots, r.replace(/\//g, '_') + '.png') });
  }
  console.log('ERRORS', errs.length); errs.slice(0, 10).forEach(e => console.log(' ', e));
  await b.close();
})();
