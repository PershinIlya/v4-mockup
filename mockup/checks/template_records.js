// Template records of the built prototype (used by template_parity.py, review A8).
// node mockup/checks/template_records.js <built page> -> prints JSON {"CT-C": {version, blocks},
// "CT-STD": {version, blocks}, "errors": [...]} after opening the page "Report templates".
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  const html = fs.readFileSync(process.argv[2], 'utf8');
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>', { waitUntil: 'load' });
  await p.evaluate(() => { location.hash = 'templates'; }); await p.waitForTimeout(500);
  const t = await p.evaluate(() => { const t = APP.state.template || {};
    return { 'CT-C': t.cfg ? { version: t.version, blocks: t.cfg.blocks } : null,
             'CT-STD': t.std ? { version: t.std.version, blocks: t.std.cfg.blocks } : null }; });
  t.errors = errors; console.log(JSON.stringify(t)); await b.close();
})();
