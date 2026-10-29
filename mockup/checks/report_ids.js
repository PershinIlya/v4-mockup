// Report ids as the built prototype shows them (used by rounding_parity.py, probe 5).
// node mockup/checks/report_ids.js <built page> [route ...] -> prints JSON {"ids": [...], "errors": [...]}
// Loads the page like prototype2/smoke.js, visits the routes and collects every "R-... vN" text.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [file, ...rest] = process.argv.slice(2);
  const routes = rest.length ? rest : ['worklist', 'patient', 'overview', 'report', 'issued', 'activity'];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  const html = fs.readFileSync(file, 'utf8');
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>', { waitUntil: 'load' });
  const ids = {};
  for (const r of routes) {
    await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(300);
    const txt = await p.evaluate(() => document.body.innerText);
    (txt.match(/R-[A-Z]+-\d+[-A-Z0-9]* v\d+/g) || []).forEach(x => { (ids[x] = ids[x] || []).includes(r) || ids[x].push(r); });
  }
  console.log(JSON.stringify({ ids, errors }));
  await b.close();
})();
