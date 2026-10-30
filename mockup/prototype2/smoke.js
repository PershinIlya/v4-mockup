// Smoke test: node mockup/prototype2/smoke.js [route ...] -> loads the built page, visits routes,
// prints page errors and saves screenshots to $SHOTS (default: no screenshots) as <route>.png (with
// <lang>_<width>_ in front for another language or width).
// A route 'MOCK-057/overview' opens that case first (saved as MOCK-057_overview.png). A route may add
// steps after '~': 'results~source' opens the Results section "source" (a [data-sec] button), and a
// named step from STEPS clicks that control ('results~coh~lagged'); a step that cannot be clicked
// counts as an error. Environment: SMOKE_LANG=de for the German interface, SMOKE_W=400 for the width
// (default 1360). Each line shows the heading and the scroll width; a width above the viewport is
// printed as OVERFLOW and counted as an error. The run ends with APP.i18nClashes (must be empty).
const { chromium } = require('playwright');
const path = require('path');
// named steps (round of 30 October: coherence type switch of SA1)
const STEPS = { lagged: '#bCty [data-t="lagged"]', msc: '#bCty [data-t="msc"]' };
(async () => {
  const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['worklist','patients','patient','overview','segments','cleaning','results','report','issued','templates','compare','upload','activity','settings',
    'MOCK-057/patient','MOCK-057/overview','MOCK-057/results','MOCK-057/report','MOCK-061/patient','MOCK-061/overview','MOCK-061/results','MOCK-061/report','MOCK-042/overview',
    // sections of the round of 30 October: coherence (both types), source regions, ratios and indices, ERP peak review
    'MOCK-042/results~ratios','results~coh','results~coh~lagged','results~source','results~review','MOCK-057/results~source','MOCK-057/results~review','MOCK-061/results~ratios','MOCK-061/results~review'];
  const shots = process.env.SHOTS, lang = process.env.SMOKE_LANG || 'en', width = +(process.env.SMOKE_W || 1360);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const file = path.resolve(__dirname, '../../outputs/prototype/v4-clinic-workspace.html');
  const html = require('fs').readFileSync(file, 'utf8');
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>', { waitUntil: 'load' });
  if (lang !== 'en') await p.evaluate(l => APP.setLang(l), lang);
  for (const r of routes) {
    const [hash, ...steps] = r.split('~');
    await p.evaluate(h => { if (location.hash === '#' + h && window.APP && APP.refresh) APP.refresh(); else location.hash = h; }, hash); await p.waitForTimeout(400);
    for (const s of steps) {
      const sel = STEPS[s] || `[data-sec="${s}"]`;
      try { await p.click(sel, { timeout: 2500 }); await p.waitForTimeout(300); } catch (e) { errs.push('step ' + r + ': cannot click ' + sel); }
    }
    const h = await p.evaluate(() => (document.querySelector('#main h1, #main .who, #main h2') || {}).textContent || '(no heading)');
    const sw = await p.evaluate(() => document.documentElement.scrollWidth), vw = await p.evaluate(() => document.documentElement.clientWidth);
    console.log(r.padEnd(26), '|', h.trim().slice(0, 60), '| scrollWidth', sw);
    if (sw > vw) errs.push('OVERFLOW ' + r + ': scrollWidth ' + sw + ' > ' + vw);
    if (shots) await p.screenshot({ path: path.join(shots, (lang === 'en' && width === 1360 ? '' : lang + '_' + width + '_') + r.replace(/[/~]/g, '_') + '.png') });
  }
  console.log('CLASHES', JSON.stringify(await p.evaluate(() => APP.i18nClashes)));
  console.log('ERRORS', errs.length); errs.slice(0, 20).forEach(e => console.log(' ', e));
  await b.close();
})();
