// System sentences as the built prototype prints them (used by rounding_parity.py, probe 7).
// node mockup/checks/page_sentences.js <built page> [route ...] -> prints JSON
// {"en": [[id, text, route]], "de": [...], "errors": [...]}: every p.sys with its id (.sid),
// in English and German, on the routes given (default: the routes that print sentences).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [file, ...rest] = process.argv.slice(2);
  const routes = rest.length ? rest : ['overview', 'cleaning', 'results', 'report', 'compare',
    'MOCK-057/results', 'MOCK-057/report', 'MOCK-061/results', 'MOCK-061/report', 'MOCK-042/overview'];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  const html = fs.readFileSync(file, 'utf8');
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>', { waitUntil: 'load' });
  const out = { en: [], de: [], errors };
  for (const lang of ['en', 'de']) {
    await p.evaluate(l => APP.setLang(l), lang); await p.waitForTimeout(200);
    for (const r of routes) {
      await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(350);
      // every section of the results page
      const secs = await p.evaluate(() => [...document.querySelectorAll('#main [data-sec]')].map(x => x.getAttribute('data-sec')));
      const grab = () => p.evaluate(() => [...document.querySelectorAll('p.sys')].map(el => {
        const c = el.cloneNode(true); const sid = c.querySelector('.sid'); const id = sid ? sid.textContent.trim() : '';
        if (sid) sid.remove(); return [id, c.textContent.replace(/\s+/g, ' ').trim()]; }));
      (await grab()).forEach(([id, t]) => out[lang].push([id, t, r]));
      for (const s of [...new Set(secs)].slice(0, 20)) {
        try { await p.click(`#main [data-sec="${s}"]`, { timeout: 500 }); await p.waitForTimeout(120); } catch (e) { continue; }
        (await grab()).forEach(([id, t]) => out[lang].push([id, t, r + '#' + s]));
      }
    }
  }
  // the cleaning sentence the page builds for the clinician's changes (review A5): one
  // component kept, one removed, both; the state is restored afterwards
  const cl = await p.evaluate(() => {
    const st = APP.state.cleaning || {}; const save = JSON.stringify(st); const res = [];
    const kept = { ic: 6, kind: 'muscle, left temporal', removed: false }, rm = { ic: 9, kind: 'single channel, F4', removed: true };
    for (const ch of [[kept], [rm], [kept, rm]]) {
      Object.assign(st, { confirmed: true, changed: ch, removedCount: 3 - ch.filter(c => !c.removed).length + ch.filter(c => c.removed).length });
      for (const L of ['en', 'de']) { try { const s = APP.cleaningSentence(L); res.push([L, s.id, s.text]); } catch (e) { res.push([L, 'ERROR', String(e)]); } }
    }
    Object.keys(st).forEach(k => delete st[k]); Object.assign(st, JSON.parse(save)); return res; });
  cl.forEach(([L, id, t]) => out[L].push([id, t, 'APP.cleaningSentence']));
  console.log(JSON.stringify(out));
  await b.close();
})();
