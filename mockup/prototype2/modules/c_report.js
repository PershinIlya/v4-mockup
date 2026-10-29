/* Module C: workspace tabs "Report" (document editor) and "Issued" (PDF-like viewer with the
   version history), and the page "Report templates" (template builder for CT-C-EN, the clinic's
   own blue style, and CT-STD-EN, the company standard with the navy and lime heritage look).
   The report is assembled from the saved clinic template: device blocks (fixed sentences and
   figures, locked), clinic blocks (from the template) and clinician blocks (free text). */
const A = window.APP;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
const M2 = A.m2, SP = M2.spectra.conditions;
const PW = 794, PH = 1123, PAD = [50, 56, 64, 56], BODY_H = PH - PAD[0] - PAD[2];
const TODAY = '29 Oct 2026';
const clone = (o) => JSON.parse(JSON.stringify(o));
const fx = (v, d = 1) => (v == null || isNaN(v) ? '' : (+v).toFixed(d));
const FONTS = {
  'Liberation Sans': "'Liberation Sans', Arial, Helvetica, sans-serif", 'Liberation Serif': "'Liberation Serif', 'Times New Roman', Times, serif",
  'DejaVu Sans': "'DejaVu Sans', Verdana, sans-serif", 'DejaVu Serif': "'DejaVu Serif', Georgia, serif",
  'IPAGothic': "IPAGothic, 'Noto Sans JP', sans-serif", 'IPAPGothic': "IPAPGothic, 'Noto Sans JP', sans-serif",
  'Carlito': "Carlito, Calibri, 'Segoe UI', 'Liberation Sans', Arial, sans-serif",
  'Fira Sans': "'Fira Sans', 'Trebuchet MS', 'Lucida Grande', Ubuntu, 'DejaVu Sans', sans-serif",
};
const ACCENTS = ['#1c5cab', '#135e7d', '#2a2e47', '#2f6b3a', '#6b3f8f', '#9a3b1f', '#3a3f46'];
const NAVY = '#2a2e47', LIME = '#96c11f';
const TPLS = { 'CT-C-EN': { name: 'Clinic C, English', owner: 'clinic', logo: 'CLINIC C', short: 'Clinic C' }, 'CT-STD-EN': { name: 'Company standard, English', owner: 'company', logo: 'LOGO', short: 'Company standard' } };
const ROMAN = (n) => [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((o, [v, r]) => { while (n >= v) { o += r; n -= v; } return o; }, '');
const CLAIM = /\b(adhd|attention\w*|impulsiv\w*|diagnos\w*|therap\w*|treatment\w*|medicat\w*|neurofeedback\w*|recommend\w*|normal\w*)\b/gi;
const BANDL = { delta: 'Delta', theta: 'Theta', alpha: 'Alpha', smr: 'SMR', beta1: 'Beta 1', beta2: 'Beta 2' };
const CONDL = { EO: 'eyes open', EC: 'eyes closed' };

/* ---------------- block catalogue ---------------- */
const CAT = {
  intro: { kind: 'clinic', label: 'Introduction text' },
  versions: { kind: 'device', label: 'Versions', req: true },
  summary: { kind: 'device', label: 'Summary of deviations', result: true },
  quality: { kind: 'device', label: 'Signal quality', req: true },
  spectra_EO: { kind: 'device', label: 'Band power, eyes open', result: true },
  spectra_EC: { kind: 'device', label: 'Band power, eyes closed', result: true },
  ratios: { kind: 'device', label: 'Ratios and alpha peak', result: true },
  coherence: { kind: 'device', label: 'Coherence', result: true },
  erp: { kind: 'device', label: 'Event-related potentials', result: true },
  behaviour: { kind: 'device', label: 'VCPT task performance', result: true },
  comparison: { kind: 'device', label: 'Comparison with 12 Mar 2026', result: true },
  limits: { kind: 'device', label: 'Notes on the results', req: true },
  anamnesis: { kind: 'clinician', label: 'Anamnesis' },
  interpretation: { kind: 'clinician', label: 'Interpretation' },
  conclusion: { kind: 'clinician', label: 'Conclusion' },
};
const PHOLD = { anamnesis: 'Reason for the measurement, history and current situation.', interpretation: 'Your interpretation of the results.',
  conclusion: 'Your conclusion.', comment: 'Comment on this section.' };
const DE = { title: 'EEG- und EKP-Bericht', patient: 'Patient', code: 'Fallnummer', born: 'Geboren', recorded: 'Aufzeichnung', age: 'Alter', sex: 'Geschlecht',
  years: 'Jahre', female: 'weiblich', page: 'Seite', of: 'von', comment: 'Kommentar', none: 'Kein Eintrag.',
  versions: 'Versionen', summary: 'Zusammenfassung der Abweichungen', quality: 'Signalqualität', spectra_EO: 'Bandleistung, Augen offen',
  spectra_EC: 'Bandleistung, Augen geschlossen', ratios: 'Quotienten und Alpha-Peak', coherence: 'Kohärenz', erp: 'Ereigniskorrelierte Potentiale',
  behaviour: 'VCPT-Leistung', comparison: 'Vergleich mit 12. März 2026', limits: 'Hinweise zu den Ergebnissen', anamnesis: 'Anamnese',
  interpretation: 'Interpretation', conclusion: 'Schlussfolgerung' };
const EN = { title: 'EEG and ERP report', patient: 'Patient', code: 'Case code', born: 'Born', recorded: 'Recorded', age: 'Age', sex: 'Sex',
  years: 'years', female: 'female', page: 'page', of: 'of', comment: 'Comment', none: 'No entry.' };
const Lx = (lang) => lang === 'de' ? DE : EN;
const title = (id, lang) => (lang === 'de' && DE[id]) || (CAT[id] && CAT[id].label) || id;
const label = (k) => k.startsWith('comment.') ? 'comment after ' + CAT[k.slice(8)].label.toLowerCase() : CAT[k].label.toLowerCase();

function ensure() {
  const t = A.state.template;
  if (!t.cfg) {
    t.cfg = { blocks: ['intro', 'versions', 'summary', 'quality', 'anamnesis', 'spectra_EO', 'spectra_EC', 'ratios', 'coherence', 'erp', 'behaviour', 'comparison', 'interpretation', 'conclusion', 'limits'],
      theme: { font: 'Liberation Sans', accent: '#1c5cab', logo: 'left', addr: true, pageOf: false },
      texts: { intro: 'This report presents the EEG, ERP and VCPT measurements of {name}, aged {age}, recorded on {recording_date} at Clinic C. Each value is compared with the age norm.',
        addr1: '[Clinic address placeholder]', addr2: '[Phone and e-mail placeholder]' },
      comments: true };
    t.history = [{ v: 1, at: '12 Jan 2026', by: 'Company (on request)', change: 'Created from the company default template' },
      { v: 2, at: '3 Mar 2026', by: 'Company (on request)', change: 'Logo placeholder, accent colour' },
      { v: 3, at: '2 Sep 2026', by: 'Company (on request)', change: 'Added comparison with the earlier measurement' }];
  }
  if (!t.std) t.std = { version: 2, cfg: { style: 'std', blocks: ['intro', 'versions', 'summary', 'quality', 'anamnesis', 'spectra_EO', 'spectra_EC', 'ratios', 'coherence', 'erp', 'behaviour', 'comparison', 'interpretation', 'conclusion', 'limits'],
      theme: { font: 'Carlito', hfont: 'Fira Sans', accent: NAVY, logo: 'left', addr: true, pageOf: true },
      texts: { intro: 'This report presents the EEG, ERP and VCPT measurements of {name}, aged {age}, recorded on {recording_date}. Each value is compared with the age norm.',
        addr1: '[Clinic address placeholder]', addr2: '[Phone and e-mail placeholder]' }, comments: true },
    history: [{ v: 1, at: '5 Jan 2026', by: 'Company admin', change: 'Company standard layout: cover band, numbered sections, running header' },
      { v: 2, at: '1 Sep 2026', by: 'Company admin', change: 'Added comparison with the earlier measurement' }] };
  const r = A.state.report; if (!r.lang) r.lang = 'en'; if (!r.texts) r.texts = {}; if (!r.tpl) r.tpl = 'CT-C-EN';
  return t;
}
const tpl = (id) => { const t = ensure(); return id === 'CT-STD-EN' ? t.std : t; };
const tname = (id) => (TPLS[id] || TPLS['CT-C-EN']).name;
const fill = (s) => String(s || '').replace(/\{name\}/g, A.name()).replace(/\{age\}/g, '10 years').replace(/\{recording_date\}/g, A.fmtDate(M2.date));
const claimHits = (s) => { const o = []; String(s || '').replace(CLAIM, m => { o.push(m); return m; }); return o; };

/* choices the clinician made upstream, stated in the report */
function choices() {
  const s = A.state, k = s.cleaning.removedCount ?? 3, apf = SP.EO.alpha_peak.hz;
  const nch = typeof s.segments.changes === 'number' ? s.segments.changes : (s.segments.changes || []).length || 0;
  const mk = s.markers || {};
  return [
    { k: 'Segments', ok: s.segments.confirmed, v: s.segments.confirmed ? (nch ? `Confirmed by the clinician, ${nch} change${nch > 1 ? 's' : ''} to the proposal` : 'Confirmed by the clinician as proposed') : 'Automatic proposal, not confirmed' },
    { k: 'Artefact removal', ok: s.cleaning.confirmed, v: s.cleaning.confirmed ? `${(s.cleaning.changed || []).length ? 'Changed by the clinician' : 'Accepted as proposed'}, ${k} of 19 components removed` : `Automatic proposal, ${k} of 19 components removed, not confirmed` },
    { k: 'Frequency marker', ok: !!mk.confirmed, v: mk.hz != null ? `${fx(mk.hz)} Hz, ${mk.confirmed ? 'set by the clinician' : 'not confirmed'}` : `Alpha peak ${apf} Hz (automatic)${mk.confirmed ? ', confirmed by the clinician' : ', not confirmed'}` },
  ];
}

/* ---------------- figures ---------------- */
const MAPS = {};
function mapURL(cond, band) {
  const key = cond + band; if (MAPS[key]) return MAPS[key];
  const cv = document.createElement('canvas'); A.topo(cv, SP[cond].bands[band].abs_z, { size: 96 });
  return (MAPS[key] = cv.toDataURL('image/png'));
}
const zc = (z) => `<td class="z" style="background:${A.zColor(z)};color:${A.zInk(z)}">${fx(z)}</td>`;
const tbl = (head, rows) => `<table class="c-t"><tr>${head.map(h => `<th${h.endsWith(' ') ? ' class="n"' : ''}>${h.trim()}</th>`).join('')}</tr>${rows.join('')}</table>`;

/* ---------------- device blocks: fixed sentences, tables and maps ---------------- */
const DEV = {
  versions: (c) => `<table class="c-kv">${[['Report', `R-MOCK-042 v${c.v}, ${stLabel(c)}`], ['Template', `${c.tid} v${c.tv}, ${(TPLS[c.tid] || TPLS['CT-C-EN']).short}, ${c.lang === 'de' ? 'German' : 'English'}`],
    ['Software', M2.processed_with.software], ['Norms', M2.processed_with.norms], ['Recording system', M2.recording_system],
    ['Measurement', `${A.fmtDate(M2.date)} · eyes open 180 s · eyes closed 180 s · VCPT ${Math.round(M2.quality.recordings.VCPT.recorded_s / 60)} min`]]
    .map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>`,
  summary: () => A.sys(A.sentences.m2.summary),
  quality: (c) => { const q = M2.quality;
    return `<div class="c-2c">${tbl(['Recording', 'Recorded ', 'Analysed '], Object.entries(q.recordings).map(([k, v]) => `<tr><td>${{ EO: 'Eyes open', EC: 'Eyes closed', VCPT: 'VCPT' }[k]}</td><td class="n">${v.recorded_s} s</td><td class="n">${v.analysed_s} s</td></tr>`))}
      <table class="c-kv">${c.choices.map(x => `<tr><th>${x.k}</th><td>${esc(x.v)}</td></tr>`).join('')}</table></div>${A.sys(c.quality)}`; },
  spectra_EO: (c) => spectra('EO'), spectra_EC: (c) => spectra('EC'),
  ratios: () => { const r = [['Theta/beta ratio at Cz', 'EO', SP.EO.tbr.value, SP.EO.tbr.norm_mean, SP.EO.tbr.z, 2], ['Theta/beta ratio at Cz', 'EC', SP.EC.tbr.value, SP.EC.tbr.norm_mean, SP.EC.tbr.z, 2],
      ['Frontal alpha asymmetry', 'EO', SP.EO.faa.value, SP.EO.faa.norm_mean, SP.EO.faa.z, 2], ['Frontal alpha asymmetry', 'EC', SP.EC.faa.value, SP.EC.faa.norm_mean, SP.EC.faa.z, 2],
      ['Alpha peak frequency, Hz', 'EO', SP.EO.alpha_peak.hz, SP.EO.alpha_peak.norm_mean, SP.EO.alpha_peak.z, 1], ['Alpha peak frequency, Hz', 'EC', SP.EC.alpha_peak.hz, SP.EC.alpha_peak.norm_mean, SP.EC.alpha_peak.z, 1]];
    return tbl(['Measure', 'Condition', 'Value ', 'Norm mean ', 'z'], r.map(x => `<tr><td>${x[0]}</td><td>${CONDL[x[1]]}</td><td class="n">${fx(x[2], x[5])}</td><td class="n">${fx(x[3], x[5])}</td>${zc(x[4])}</tr>`)) + A.sys(A.sentences.m2.ratios); },
  coherence: () => { const all = [];
    ['EO', 'EC'].forEach(cd => Object.entries(M2.coherence[cd]).forEach(([b, o]) => o.pairs.forEach(p => { if (Math.abs(+fx(p.z)) >= 2) all.push({ ...p, b, cd }); })));
    all.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    return A.sys(A.sentences.m2.coherence_EO) + A.sys(A.sentences.m2.coherence_EC) + `<div class="c-cap">Electrode pairs with |z| of 2 or more</div>` +
      tbl(['Pair', 'Band', 'Condition', 'Coherence ', 'z'], all.map(p => `<tr><td>${p.pair}</td><td>${BANDL[p.b]}</td><td>${CONDL[p.cd]}</td><td class="n">${fx(p.value, 3)}</td>${zc(p.z)}</tr>`)); },
  erp: () => tbl(['Component', 'Trials', 'Site', 'Amplitude, µV ', 'z', 'Latency, ms ', 'z'], M2.erp.peaks.map(p => `<tr><td>${p.component}</td><td>${{ go: 'Go', nogo: 'NoGo', ignore: 'Ignore', novelty: 'Novelty' }[p.condition]}</td><td>${p.site}</td><td class="n">${fx(p.amplitude_uv)}</td>${zc(p.amplitude_z)}<td class="n">${p.latency_ms}</td>${zc(p.latency_z)}</tr>`)) + A.sys(A.sentences.m2.erp),
  behaviour: () => { const v = M2.vcpt;
    return tbl(['VCPT measure', 'Value ', 'z', 'Percentile '], [['Omission errors', v.omissions, 0], ['Commission errors', v.commissions, 0], ['Reaction time, mean, ms', v.rt_mean_ms, 0], ['Reaction time variability (SD), ms', v.rt_sd_ms, 0]]
      .map(([k, o]) => `<tr><td>${k}</td><td class="n">${o.value}</td>${zc(o.z)}<td class="n">${fx(o.percentile, 0)}</td></tr>`)) + A.sys(A.sentences.m2.behaviour); },
  comparison: () => A.sys(A.sentences.m2.comparison),
  limits: () => A.sys(A.sentences.m2.limits),
};
function spectra(cond) {
  const C = SP[cond];
  return `<div class="c-maps">${A.bands.map(b => `<figure class="c-map"><img src="${mapURL(cond, b.name)}" width="96" height="100" alt="${BANDL[b.name]} absolute power, ${CONDL[cond]}, z map"><figcaption><b>${BANDL[b.name]}</b> ${b.lo}-${b.hi} Hz</figcaption></figure>`).join('')}</div>
    <div class="c-scl"><span class="c-cap">Maps: absolute power against the age norm. Table: absolute (abs) and relative (rel) power, z per electrode.</span>${A.zScale()}</div>
    <table class="c-t c-zt"><tr><th></th>${A.channels.map(ch => `<th>${ch}</th>`).join('')}</tr>${A.bands.map(b => ['abs', 'rel'].map(k => `<tr><th>${BANDL[b.name]} ${k}</th>${C.bands[b.name][k + '_z'].map(zc).join('')}</tr>`).join('')).join('')}</table>
    ${A.sys(A.sentences.m2['spectra_' + cond])}`;
}
const stLabel = (c) => c.status === 'replaced' ? 'issued, replaced' : c.status;

/* ---------------- document assembly and pagination ---------------- */
const born = () => A.state.staffView ? 'hidden' : '1 Jan 2016';
const BAND_H = 136;
function headerHTML(c) {
  const th = c.cfg.theme, L = Lx(c.lang), std = c.cfg.style === 'std';
  const id = [[L.patient, A.name()], [L.code, 'MOCK-042'], [L.born, born()], [L.recorded, A.fmtDate(M2.date)], [L.age, '10 ' + L.years], [L.sex, L.female]];
  const hdr = `<div class="c-hdr${th.logo === 'right' ? ' rev' : ''}"><div class="c-logo">${std ? 'LOGO' : 'CLINIC C'}</div>
    <div class="c-hdrtx"><div class="c-cn">Clinic C</div>${th.addr ? `<div>${esc(c.cfg.texts.addr1)}</div><div>${esc(c.cfg.texts.addr2)}</div>` : ''}</div></div>`;
  return `<section class="c-blk c-clc" data-blk="header" data-kind="clinic">${std ? `<div class="c-bandsp" style="height:${BAND_H - PAD[0] + 12}px"></div>${hdr}` : `${hdr}<h1 class="c-title">${L.title}</h1>`}
    <div class="c-id">${id.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div></section>`;
}
/* company standard: page decorations outside the body (cover band, running header, lime footer band) */
function stdDeco(c, i) {
  const L = Lx(c.lang);
  if (!i) return `<div class="c-band"><div class="c-bt"><h1 class="c-title">${L.title}</h1><div class="c-bsub">${L.recorded} ${A.fmtDate(M2.date)} · MOCK-042</div></div>${A.trace(520, 64, 11)}</div><div class="c-fband"></div>`;
  return `<div class="c-rh"><i>${L.title} · ${esc(A.name())} · ${L.born} ${born()}</i><i>${L.page} ${i + 1}</i></div><div class="c-fband"></div>`;
}
const hnum = (n) => n ? `<b class="c-rn">${ROMAN(n)}.</b> ` : '';
function clinHTML(key, c, n) {
  const isC = key.startsWith('comment.'), L = Lx(c.lang), t = c.texts[key] || '', ed = c.editable, ttl = isC ? L.comment : title(key, c.lang);
  const sig = key === 'conclusion' ? `<div class="c-sig">${c.issued ? `Issued by Clinician 1, licensed psychologist, on ${esc(c.issued.at)}` : 'Clinician 1, licensed psychologist · signature added on issue'}</div>` : '';
  return `<section class="c-blk c-cln" data-blk="${key}" data-kind="clinician"><h2 class="c-h c-hc"><span>${hnum(n)}${esc(ttl)}</span>${isC && ed ? `<button class="c-rmc" data-rmc="${key}" title="Remove this comment">Remove</button>` : ''}</h2>
    <div class="c-txt${!ed && !t.trim() ? ' c-none' : ''}" data-key="${key}" data-ph="${PHOLD[isC ? 'comment' : key]}"${ed ? ` contenteditable="plaintext-only" role="textbox" aria-multiline="true" aria-label="${esc(ttl)}" spellcheck="true"` : ''}>${ed ? esc(t) : esc(t.trim() || L.none)}</div>${sig}</section>`;
}
function items(c) {
  const out = [{ id: 'header', kind: 'clinic', label: 'Clinic header', html: headerHTML(c) }], std = c.cfg.style === 'std'; let sec = 0;
  c.cfg.blocks.forEach(id => {
    const d = CAT[id]; if (!d) return;
    let html; const n = std && d.kind !== 'clinic' ? ++sec : 0;
    if (d.kind === 'device') html = `<section class="c-blk c-dev" data-blk="${id}" data-kind="device" title="Locked: company-verified block"><h2 class="c-h"><span>${hnum(n)}${esc(title(id, c.lang))}</span></h2>${DEV[id](c)}${c.editable && c.cfg.comments && d.result && !(('comment.' + id) in c.texts) ? `<button class="c-addc" data-addc="${id}" title="Add a clinician comment after this section">+ Comment</button>` : ''}</section>`;
    else if (d.kind === 'clinic') html = `<section class="c-blk c-clc c-intro" data-blk="${id}" data-kind="clinic"><p>${esc(fill(c.cfg.texts.intro))}</p></section>`;
    else html = clinHTML(id, c, n);
    out.push({ id, kind: d.kind, label: d.label, html });
    const ck = 'comment.' + id;
    if (d.result && ck in c.texts && (c.editable || (c.texts[ck] || '').trim())) out.push({ id: ck, kind: 'clinician', label: 'Comment: ' + d.label, html: clinHTML(ck, c) });
  });
  return out;
}
const themeStyle = (cfg) => `--c-font:${FONTS[cfg.theme.font] || FONTS['Liberation Sans']};--c-hfont:${FONTS[cfg.theme.hfont || cfg.theme.font] || FONTS['Liberation Sans']};--c-acc:${cfg.theme.accent}`;
const styleCls = (cfg) => cfg.style === 'std' ? ' c-std' : '';
function paginate(its, cfg) {
  const m = document.createElement('div'); m.className = 'c-doc' + styleCls(cfg);
  m.style.cssText = themeStyle(cfg) + `;position:absolute;left:-10000px;top:0;width:${PW - PAD[1] - PAD[3]}px;visibility:hidden`;
  m.innerHTML = its.map(i => i.html).join(''); document.body.append(m);
  const hs = [...m.children].map(e => e.offsetHeight); m.remove();
  const pages = [[]]; let used = 0;
  its.forEach((it, i) => { if (used + hs[i] > BODY_H && pages[pages.length - 1].length) { pages.push([]); used = 0; } pages[pages.length - 1].push(it); used += hs[i]; });
  return pages;
}
function buildPages(c, upto) {
  const its = items(c), pages = paginate(its, c.cfg), N = pages.length, L = Lx(c.lang), std = c.cfg.style === 'std';
  const stamp = c.status === 'draft' ? '<div class="c-stamp">DRAFT</div>' : c.status === 'replaced' ? `<div class="c-stamp rep">REPLACED BY v${c.replacedBy}</div>` : '';
  const html = (upto ? pages.slice(0, upto) : pages).map((p, i) => `<div class="c-pg c-doc paper${styleCls(c.cfg)}" data-page="${i + 1}" style="${themeStyle(c.cfg)}">${std ? stdDeco(c, i) : ''}<div class="c-body">${p.map(x => x.html).join('')}</div>${stamp}
    <div class="c-foot">Mockup, synthetic data${std ? ' · [Company line placeholder]' : ''} · V4 mockup 0.1 · Mock norms 2026.1 · R-MOCK-042 v${c.v} ${stLabel(c)} · ${L.page} ${i + 1}${c.cfg.theme.pageOf ? ` ${L.of} ${N}` : ''}</div></div>`);
  return { pages: html, html: html.join(''), N, items: its, sig: pages.map(p => p.map(x => x.id).join()).join('|') };
}
/* context of the document shown: an issued entry, or the live draft */
function ctxEntry(e, list) {
  const next = list.find(x => x.v > e.v);
  return { cfg: e.cfg, texts: e.texts, v: e.v, status: next ? 'replaced' : 'issued', replacedBy: next && next.v, lang: e.lang, tv: e.tv, tid: e.tid || 'CT-C-EN', editable: false, issued: e, quality: e.quality, choices: e.choices };
}
function docCtx() {
  const r = A.state.report; ensure(); const t = tpl(r.tpl), last = r.issued[r.issued.length - 1];
  if (r.status === 'issued' && last) return ctxEntry(last, r.issued);
  return { cfg: t.cfg, texts: r.texts, v: r.version, status: 'draft', lang: r.lang, tv: t.version, tid: r.tpl, editable: true, quality: A.qualitySentences(), choices: choices() };
}
function checks(c) {
  const s = A.state, w = [], ok = [];
  [['segments', 'Segments', 'segments'], ['cleaning', 'Cleaning', 'cleaning'], ['markers', 'Frequency marker', 'results']].forEach(([k, l, go]) => {
    if (!(s[k] || {}).confirmed) w.push({ t: `${l} not confirmed`, go }); else ok.push(`${l} confirmed`); });
  c.cfg.blocks.filter(id => CAT[id] && CAT[id].kind === 'clinician').forEach(id => { if (!(c.texts[id] || '').trim()) w.push({ t: `${CAT[id].label} is empty`, blk: id }); else ok.push(`${CAT[id].label} written`); });
  Object.keys(c.texts).filter(k => k.startsWith('comment.') && CAT[k.slice(8)] && c.cfg.blocks.includes(k.slice(8)) && !(c.texts[k] || '').trim()).forEach(k => w.push({ t: `Empty ${label(k)}`, blk: k }));
  return { w, ok };
}
const hash = (s) => { let h1 = 0x811c9dc5, h2 = 0x1234567; for (let i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822519); }
  return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).replace(/(.{4})/g, '$1 ').trim(); };

/* ---------------- CSS ---------------- */
A.css('c-report', `
.c-ed { display: grid; grid-template-columns: 214px minmax(0, 1fr) 292px; grid-template-areas: "out mid side"; gap: 14px; align-items: start; }
.c-out { grid-area: out; position: sticky; top: 64px; } .c-mid { grid-area: mid; display: grid; gap: 10px; min-width: 0; } .c-side { grid-area: side; display: grid; gap: 12px; position: sticky; top: 64px; }
.c-olist { display: grid; padding: 6px; max-height: calc(100vh - 150px); overflow: auto; }
.c-oi { display: flex; min-width: 0; width: 100%; align-items: center; gap: 7px; text-align: left; border: 0; background: none; padding: 5px 6px; border-radius: 5px; font-size: 12.5px; color: var(--ink-2); }
.c-oi:hover { background: var(--accent-soft); color: var(--ink); } .c-oi .chip { font-size: 10px; padding: 0 5px; flex: none; width: 56px; justify-content: center; }
.c-oi .c-ol { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .c-oi .c-em { color: var(--amber); font-size: 11px; }
.c-oi.sub { padding-left: 16px; }
.c-canvas { background: color-mix(in srgb, var(--ink) 11%, var(--bg)); overflow: auto; padding: 20px 14px; height: calc(100vh - 236px); min-height: 520px; border-radius: 0 0 var(--r) var(--r); }
.c-zoom { width: ${PW}px; margin: 0 auto; }
.c-doc { font-family: var(--c-font); font-size: 12px; line-height: 1.42; color: #1f1f1e; }
.c-pg { width: ${PW}px; height: ${PH}px; position: relative; margin: 0 auto 20px; padding: ${PAD.join('px ')}px; border: 0; border-radius: 1px; box-shadow: 0 1px 3px rgba(0,0,0,0.22), 0 8px 22px rgba(0,0,0,0.12); overflow: hidden; background: #fff; }
.c-body { height: 100%; overflow: hidden; position: relative; z-index: 1; }
.c-foot { position: absolute; left: ${PAD[3]}px; right: ${PAD[1]}px; bottom: 28px; font-size: 9.5px; color: #77766f; border-top: 0.5px solid #d6d5cf; padding-top: 5px; font-family: var(--c-font); }
.c-stamp { position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font: 700 110px var(--f-ui); color: rgba(120,120,120,0.08); letter-spacing: 0.12em; pointer-events: none; white-space: nowrap; }
.c-stamp.rep { color: rgba(179,38,30,0.16); font-size: 64px; border: 6px solid rgba(179,38,30,0.16); padding: 6px 22px; }
.c-blk { position: relative; padding-bottom: 12px; display: flow-root; }
.c-doc .c-h { font: 600 13px/1.3 var(--c-font); background: var(--c-acc); color: #fff; padding: 3px 8px; margin: 0 0 6px; display: flex; justify-content: space-between; align-items: center; }
.c-doc .c-hc { background: none; color: var(--c-acc); border-bottom: 1px solid var(--c-acc); padding: 2px 0; }
.c-doc p.sys { margin: 2px 0; } .c-doc p.sys .sid { white-space: nowrap; font-size: 8px; color: #a5a49f; font-family: var(--f-mono); }
.c-hdr { display: flex; gap: 18px; align-items: center; border-bottom: 1.5px solid var(--c-acc); padding-bottom: 9px; } .c-hdr.rev { flex-direction: row-reverse; }
.c-logo { width: 128px; height: 52px; border: 1px dashed var(--c-acc); color: var(--c-acc); display: grid; place-items: center; font: 700 11px var(--f-ui); letter-spacing: 0.12em; flex: none; }
.c-hdrtx { flex: 1; text-align: right; color: #6b6b66; font-size: 11px; } .c-hdr.rev .c-hdrtx { text-align: left; } .c-cn { font-size: 16px; font-weight: 700; color: #1f1f1e; }
.c-doc .c-title { font: 700 21px var(--c-font); color: var(--c-acc); margin: 12px 0 7px; }
.c-id { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px 14px; padding: 7px 10px; background: #f2f5fa; font-size: 11.5px; } .c-id span { color: #6b6b66; margin-right: 7px; }
.c-intro p { margin: 0; }
.c-t { border-collapse: collapse; width: 100%; font-size: 11px; margin: 2px 0 5px; } .c-t th { background: #e9edf3; text-align: left; font-weight: 600; padding: 2px 6px; white-space: nowrap; }
.c-t td { padding: 2px 6px; border-bottom: 0.5px solid #dcdbd6; } .c-t .n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; } .c-t td.z { text-align: center; width: 44px; font-variant-numeric: tabular-nums; }
.c-zt th, .c-zt td, .c-zt td.z { padding: 1px 0; text-align: center; font-size: 9px; width: auto; } .c-zt tr > th:first-child { text-align: left; padding: 1px 5px; background: #f2f4f7; }
.c-kv { font-size: 11px; border-collapse: collapse; } .c-kv th { text-align: left; font-weight: 400; color: #6b6b66; padding: 1px 14px 1px 0; vertical-align: top; white-space: nowrap; } .c-kv td { padding: 1px 0; }
.c-2c { display: grid; grid-template-columns: 260px 1fr; gap: 18px; align-items: start; margin-bottom: 4px; }
.c-maps { display: flex; justify-content: space-between; } .c-map { margin: 0; text-align: center; font-size: 10px; color: #55554f; } .c-map img { display: block; }
.c-scl { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin: 4px 0 4px; } .c-cap { font-size: 10px; color: #6b6b66; margin: 2px 0; }
.c-txt { white-space: pre-wrap; min-height: 34px; padding: 5px 8px; border-left: 3px solid var(--c-acc); background: #fafbfd; outline: none; }
.c-txt.c-none { color: #8a8984; font-style: italic; min-height: 0; }
.c-sig { margin-top: 8px; font-size: 10.5px; color: #55554f; border-top: 0.5px solid #cfcec8; padding-top: 4px; width: 60%; }
.c-marks .c-txt[contenteditable] { box-shadow: inset 0 0 0 1px #b9cce6; cursor: text; } .c-marks .c-txt[contenteditable]:hover { background: #f3f7fc; }
.c-txt[contenteditable]:focus { box-shadow: inset 0 0 0 2px var(--c-acc); background: #fff; }
.c-marks .c-txt[contenteditable]:empty::before { content: attr(data-ph); color: #9a9993; font-style: italic; }
.c-marks .c-dev:hover, .c-marks .c-clc:hover { outline: 1px dashed #9db4d6; outline-offset: 3px; cursor: not-allowed; }
.c-marks .c-dev:hover::after { content: '🔒 Locked'; position: absolute; top: 2px; right: 4px; font: 600 10px var(--f-ui); background: #fff; color: #1d4f8f; padding: 1px 6px; border-radius: 99px; z-index: 2; }
.c-addc, .c-rmc { font: 500 11px var(--f-ui); border: 1px solid #9db4d6; background: #fff; color: #1d4f8f; border-radius: 99px; padding: 1px 9px; cursor: pointer; }
.c-addc { position: absolute; right: 0; bottom: -3px; opacity: 0; z-index: 3; } .c-marks .c-dev:hover .c-addc, .c-addc:focus-visible { opacity: 1; }
.c-rmc { padding: 0 8px; } .c-zoom:not(.c-marks) .c-addc, .c-zoom:not(.c-marks) .c-rmc { display: none; }
.c-flash { animation: cflash 1.2s ease-out; } @keyframes cflash { 0% { box-shadow: 0 0 0 4px rgba(28,92,171,0.35); } 100% { box-shadow: 0 0 0 4px rgba(28,92,171,0); } }
.c-deny { animation: cdeny 0.3s; } @keyframes cdeny { 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.c-tip { position: fixed; z-index: 60; background: var(--ink); color: var(--surface); font-size: 12px; padding: 5px 9px; border-radius: 5px; pointer-events: none; box-shadow: var(--shadow); }
.c-side .card > .bd { display: grid; gap: 8px; } .c-side .kv { font-size: 12.5px; }
.c-ck { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; } .c-ck li { display: flex; gap: 7px; align-items: baseline; font-size: 12.5px; padding: 3px 4px; border-radius: 4px; }
.c-ck li.w { color: var(--amber); cursor: pointer; } .c-ck li.w:hover { background: var(--amber-soft); } .c-ck li.k { color: var(--muted); } .c-ck li b { width: 14px; flex: none; text-align: center; }
.c-zl { font-size: 12px; min-width: 42px; text-align: center; }
.c-iv { display: grid; gap: 14px; }
.c-ivbody { display: grid; grid-template-columns: 168px minmax(0, 1fr); }
.c-thumbs { border-right: 1px solid var(--line); background: var(--surface-2); padding: 12px; display: grid; gap: 12px; align-content: start; overflow: auto; height: calc(100vh - 290px); min-height: 480px; }
.c-th { border: 0; background: none; padding: 0; display: grid; gap: 4px; justify-items: center; font-size: 11.5px; color: var(--muted); }
.c-th .c-thz { width: ${Math.round(PW * 0.17)}px; height: ${Math.round(PH * 0.17)}px; overflow: hidden; outline: 1px solid var(--line-2); } .c-th .c-thz > div { zoom: 0.17; pointer-events: none; }
.c-th .c-thz .c-pg { margin: 0; box-shadow: none; } .c-th.on .c-thz { outline: 2px solid var(--accent); } .c-th.on { color: var(--accent); font-weight: 600; } .c-th:hover .c-thz { outline-color: var(--accent); }
.c-ivbody .c-canvas { height: calc(100vh - 290px); border-radius: 0; }
.c-ivfoot { padding: 8px 14px; border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; gap: 4px 16px; }
.c-tb { display: grid; grid-template-columns: 340px minmax(0, 1fr) 272px; gap: 14px; align-items: start; }
.c-tbl, .c-tbr { display: grid; gap: 12px; min-width: 0; }
.c-list { list-style: none; margin: 0; padding: 6px; display: grid; gap: 2px; }
.c-row { display: flex; min-width: 0; align-items: center; gap: 5px; padding: 4px 6px; border-radius: 5px; border: 1px solid transparent; font-size: 12.5px; background: var(--surface); }
.c-row:hover { background: var(--surface-2); border-color: var(--line); } .c-row.drag { opacity: 0.4; } .c-row.over { box-shadow: 0 -2px 0 var(--accent); }
.c-row .c-grip { cursor: grab; color: var(--muted); user-select: none; width: 12px; } .c-row .chip { font-size: 10px; padding: 0 6px; width: 62px; justify-content: center; flex: none; }
.c-row .c-rl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-ib { width: 22px; height: 22px; padding: 0; border: 1px solid transparent; background: none; border-radius: 4px; color: var(--ink-2); font-size: 13px; line-height: 1; flex: none; }
.c-ib:hover:not([disabled]) { border-color: var(--line-2); background: var(--surface); color: var(--accent); } .c-ib[disabled] { opacity: 0.3; cursor: default; }
.c-row.fixed { color: var(--muted); } .c-req { font-size: 11px; color: var(--muted); flex: none; }
.c-ch { display: grid; gap: 7px; font-size: 12.5px; } .c-ch .lbl { display: block; font-size: 11.5px; color: var(--muted); }
.c-hist { display: grid; } .c-hist > div { padding: 7px 14px; border-bottom: 1px solid var(--line); font-size: 12.5px; } .c-hist > div:last-child { border-bottom: 0; }
.c-add { display: grid; gap: 4px; } .c-add h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 6px 0 2px; }
.c-add > div.row { justify-content: space-between; font-size: 12.5px; }
.c-mirror { font-size: 12.5px; line-height: 1.5; padding: 7px 9px; border: 1px dashed var(--line-2); border-radius: 5px; background: var(--surface-2); white-space: pre-wrap; }
.c-mirror mark, .c-hit { background: var(--warn-soft); color: var(--warn); font-weight: 600; border-bottom: 2px solid var(--warn); padding: 0 1px; }
.c-phc { color: var(--clinic-ink); background: var(--clinic); border-radius: 3px; padding: 0 3px; font-family: var(--f-mono); font-size: 11.5px; }
.c-tbl textarea { width: 100%; min-height: 104px; resize: vertical; line-height: 1.45; } .c-tbl input.bad { border-color: var(--warn); }
.c-sw { display: flex; gap: 6px; flex-wrap: wrap; } .c-sw button { width: 28px; height: 28px; border-radius: 6px; border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--line-2); }
.c-sw button.on { box-shadow: 0 0 0 2px var(--ink); }
.c-pv { background: color-mix(in srgb, var(--ink) 11%, var(--bg)); padding: 16px; overflow: auto; border-radius: 0 0 var(--r) var(--r); }
.c-pv .c-pg { margin: 0 auto; } .c-pv .c-pg + .c-pg { margin-top: 16px; }
/* company standard (CT-STD-EN): navy cover band with a lime trace, Roman-numbered sections, italic running header, lime footer band */
.c-std .c-band { position: absolute; left: 0; right: 0; top: 0; height: ${BAND_H}px; background: ${NAVY}; overflow: hidden; z-index: 0; }
.c-std .c-bt { position: absolute; left: ${PAD[3]}px; top: 40px; max-width: 46%; }
.c-std .c-band .c-title { font: 700 27px/1.15 var(--c-hfont); color: #fff; margin: 0; letter-spacing: 0.005em; }
.c-std .c-bsub { font: 11px var(--c-hfont); color: #c3c9dc; margin-top: 7px; letter-spacing: 0.02em; }
.c-std .c-band svg.trace { position: absolute; right: 0; top: 34px; width: 50%; height: 64px; }
.c-std .c-rh { position: absolute; left: ${PAD[3]}px; right: ${PAD[1]}px; top: 20px; display: flex; justify-content: space-between; gap: 12px; font: italic 9.5px var(--c-font); color: #5d6170; border-bottom: 0.5px solid #b9bcc8; padding-bottom: 3px; z-index: 2; }
.c-std .c-rh i:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-std .c-fband { position: absolute; left: 0; right: 0; bottom: 34px; height: 7px; background: ${LIME}; }
.c-std .c-foot { border-top: 0; bottom: 14px; color: #5d6170; }
.c-std .c-hdr { border-bottom: 0.5px solid #d9d9d9; } .c-std .c-logo { border-color: ${NAVY}; color: ${NAVY}; } .c-std .c-cn { font-family: var(--c-hfont); color: ${NAVY}; }
.c-std .c-id { background: #f0f8dc; margin-top: 8px; }
.c-doc.c-std .c-h, .c-doc.c-std .c-hc { font: 700 14px/1.3 var(--c-hfont); background: none; color: var(--c-acc); padding: 2px 0 3px; border-bottom: 1.5px solid ${LIME}; margin: 2px 0 7px; }
.c-std .c-rn { font-weight: 700; color: var(--c-acc); min-width: 1.6em; display: inline-block; }
.c-std .c-t th { background: #f0f8dc; color: #1f1f1e; } .c-std .c-zt tr > th:first-child { background: #d9d9d9; } .c-std .c-zt tr:first-child th { background: #f0f8dc; }
.c-std .c-kv th { color: #4a4d5c; }
.c-std .c-txt { border-left-color: ${LIME}; background: #fbfcf6; }
.c-tls { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px; }
.c-tl { display: flex; align-items: center; gap: 10px; text-align: left; min-width: 0; flex: 0 1 270px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); }
.c-tl:hover:not([disabled]) { border-color: var(--line-2); background: var(--surface-2); } .c-tl.on { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); } .c-tl[disabled] { opacity: 0.55; cursor: default; }
.c-tl > span:last-child { display: grid; min-width: 0; } .c-tl b { font-size: 13px; } .c-tlsw { width: 34px; height: 26px; border-radius: 4px; flex: none; border: 1px solid var(--line-2); }
@media (max-width: 1180px) { .c-ed { grid-template-columns: minmax(0, 1fr) 280px; grid-template-areas: "mid side" "mid out"; } .c-out, .c-side { position: static; } .c-tb { grid-template-columns: 330px minmax(0, 1fr); } .c-tbr { grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); } }
@media (max-width: 760px) { .c-ed { grid-template-columns: minmax(0, 1fr); grid-template-areas: "mid" "side" "out"; } .c-canvas { height: auto; min-height: 0; max-height: 80vh; }
  .c-ivbody { grid-template-columns: minmax(0, 1fr); } .c-thumbs { display: flex; height: auto; min-height: 0; border-right: 0; border-bottom: 1px solid var(--line); } .c-ivbody .c-canvas { height: auto; max-height: 75vh; }
  .c-tb { grid-template-columns: minmax(0, 1fr); } }
`);

/* ---------------- shared: tooltips, dialogs ---------------- */
function tip(e, text) {
  $$('.c-tip').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'c-tip'; t.textContent = text;
  t.style.left = Math.min(innerWidth - 240, e.clientX + 12) + 'px'; t.style.top = (e.clientY + 14) + 'px';
  document.body.append(t); setTimeout(() => t.remove(), 1600);
}
function correctDialog() {
  const r = A.state.report, n = r.issued.length ? r.issued[r.issued.length - 1].v : r.version;
  const back = A.dialog({ title: `Correct report v${n}`, ok: `Start version ${n + 1}`, body: `
    <div class="field"><span>Reason for the correction (kept in the version history)</span><textarea id="cReason" rows="3" placeholder="For example: typing error in the anamnesis"></textarea></div>
    <div class="xs muted">Version ${n} stays issued until version ${n + 1} is issued. Both versions are kept. ${A.ann('Corrections as new versions')}</div><div id="cRErr" class="xs" style="color:var(--warn)"></div>`,
    onOk: (b) => { const v = $('#cReason', b).value.trim(); if (!v) { $('#cRErr', b).textContent = 'Enter a reason.'; $('#cReason', b).focus(); return false; }
      r.status = 'draft'; r.version = n + 1; r.pendingReason = v; r.texts = clone(r.issued[r.issued.length - 1].texts);
      A.addLog('Clinician 1', `Started correction v${n + 1} of report R-MOCK-042: ${v}`); A.toast(`Draft v${n + 1} started. v${n} stays issued.`); A.go('report'); } });
  setTimeout(() => { const t = $('#cReason', back); if (t) t.focus(); }, 30);
}
function issueDialog() {
  const r = A.state.report, c = docCtx(), { w } = checks(c), N = RV.N || 1;
  const back = A.dialog({ title: `Issue report v${r.version}`, ok: `Issue v${r.version}`, body: `
    <dl class="kv"><dt>Report</dt><dd class="mono">R-MOCK-042 v${r.version}</dd><dt>Template</dt><dd>${c.tid} v${c.tv} · ${esc((TPLS[c.tid] || TPLS["CT-C-EN"]).short)} · ${r.lang === "de" ? "German" : "English"} · ${N} pages</dd><dt>Signed by</dt><dd>Clinician 1, licensed psychologist</dd></dl>
    ${w.length ? `<div class="banner amber"><div><b>${w.length} warning${w.length > 1 ? 's' : ''}</b><ul style="margin:4px 0 0;padding-left:18px">${w.map(x => `<li>${esc(x.t)}</li>`).join('')}</ul></div></div>` : '<div class="banner ok"><b>No warnings</b></div>'}
    <label class="row small" style="align-items:flex-start;flex-wrap:nowrap"><input type="checkbox" id="cConf" style="margin-top:3px"> <span>I reviewed the raw EEG, the analysed segments and the full results</span></label>
    <div class="xs muted">An issued version cannot be edited. A correction creates a new version. ${A.ann('M24 one confirmation')}</div>`,
    onOk: (b) => { if (!$('#cConf', b).checked) return false; doIssue(N); } });
  const ok = $('[data-ok]', back); ok.disabled = true; $('#cConf', back).onchange = e => { ok.disabled = !e.target.checked; };
}
function doIssue(N) {
  const r = A.state.report; ensure(); const t = tpl(r.tpl), v = r.version;
  r.issued.push({ v, at: `${TODAY}, ${A.time()}`, reason: r.pendingReason || 'First issue', texts: clone(r.texts), cfg: clone(t.cfg), tv: t.version, tid: r.tpl, lang: r.lang, pages: N, quality: A.qualitySentences(), choices: choices() });
  r.status = 'issued'; r.pendingReason = null; IV.sel = null;
  A.addLog('Clinician 1', `Issued report R-MOCK-042 v${v} (template ${r.tpl} v${t.version}) after confirming review of the raw EEG, segments and results`);
  A.toast(`Report v${v} issued`); A.go('issued');
}

/* ================================ Report editor ================================ */
const RV = { zoom: 'fit', marks: true, root: null, ro: null, N: 0, sig: '', changed: new Set(), savedAt: null };
function edRender(root) {
  ensure(); RV.root = root;
  root.innerHTML = `<div class="c-ed">
    <aside class="card c-out" aria-label="Outline"><div class="hd"><h3>Outline</h3><span class="xs muted" id="cOutN"></span></div><div class="c-olist" id="cOut"></div></aside>
    <div class="c-mid"><div id="cBan" class="grid" style="gap:8px"></div>
      <div class="card"><div class="toolbar" role="toolbar" aria-label="Document">
        <div class="seg" id="cZm">${[['fit', 'Fit'], [0.75, '75%'], [1, '100%']].map(([v, l]) => `<button data-zoom="${v}" class="${String(RV.zoom) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>
        <span class="xs muted" id="cPages"></span><span class="sep"></span>
        <label><input type="checkbox" id="cMarks" ${RV.marks ? 'checked' : ''}> Editing marks</label>
        <span style="flex:1"></span><span class="xs muted" id="cSaved"></span></div>
        <div class="c-canvas" id="cCanvas"><div class="c-zoom" id="cZoom"></div></div></div></div>
    <aside class="c-side" id="cSide"></aside></div>`;
  const cv = $('#cCanvas', root);
  root.onclick = (e) => {
    const t = e.target;
    const o = t.closest('[data-out]'); if (o) return scrollBlk(o.dataset.out);
    const z = t.closest('[data-zoom]'); if (z) { RV.zoom = z.dataset.zoom === 'fit' ? 'fit' : +z.dataset.zoom; $$('#cZm button', root).forEach(b => b.classList.toggle('on', b === z)); return applyZoom(); }
    const ad = t.closest('[data-addc]'); if (ad) { const k = 'comment.' + ad.dataset.addc; A.state.report.texts[k] = ''; A.addLog('Clinician 1', `Added a ${label(k)}`); drawDoc(); return focusKey(k, true); }
    const rm = t.closest('[data-rmc]'); if (rm) { const k = rm.dataset.rmc; delete A.state.report.texts[k]; A.addLog('Clinician 1', `Removed the ${label(k)}`); return drawDoc(); }
    if (t.closest('[data-correct]')) return correctDialog();
    const g = t.closest('[data-go2]'); if (g) return A.go(g.dataset.go2);
    const te = t.closest('[data-tedit]'); if (te) { TB.id = te.dataset.tedit; TB.draft = null; }
    const ck = t.closest('[data-ck]'); if (ck) { const [k, v] = ck.dataset.ck.split(':'); return k === 'go' ? A.go(v) : (scrollBlk(v), focusKey(v)); }
    if (t.closest('#cIssue')) return issueDialog();
    const lk = t.closest('.c-dev, .c-clc'); if (lk && docCtx().editable) { lk.classList.remove('c-deny'); void lk.offsetWidth; lk.classList.add('c-deny');
      tip(e, lk.dataset.kind === 'device' ? 'Locked: company-verified block' : 'Clinic block: change it in the report template'); }
  };
  root.oninput = (e) => {
    const el = e.target.closest && e.target.closest('.c-txt[contenteditable]'); if (!el) return;
    let v = el.innerText.replace(/\n$/, ''); if (!v.trim()) { v = ''; if (el.innerHTML && !el.textContent) el.innerHTML = ''; }
    A.state.report.texts[el.dataset.key] = v; RV.changed.add(el.dataset.key); RV.savedAt = A.time(); $('#cSaved', root).textContent = `Draft saved ${RV.savedAt}`;
    const body = el.closest('.c-body');
    if (body && body.scrollHeight > body.clientHeight + 1) { drawDoc(); focusKey(el.dataset.key); } else { drawOutline(); drawSide(); }
  };
  root.onchange = (e) => {
    if (e.target.id === 'cMarks') { RV.marks = e.target.checked; $('#cZoom', root).classList.toggle('c-marks', RV.marks); }
    if (e.target.id === 'cTpl') { const r = A.state.report, from = r.tpl; r.tpl = e.target.value; const t = tpl(r.tpl);
      A.addLog('Clinician 1', `Changed the template of report draft v${r.version} from ${from} to ${r.tpl} v${t.version} (${tname(r.tpl)})`); A.toast(`Template ${tname(r.tpl)} applied. Device blocks and figures are unchanged.`); drawDoc(); }
    if (e.target.id === 'cLang') { const r = A.state.report; r.lang = e.target.value; A.addLog('Clinician 1', `Set the report language to ${r.lang === 'de' ? 'German' : 'English'}`); drawDoc(); }
  };
  root.addEventListener('focusout', (e) => {
    const el = e.target.closest && e.target.closest('.c-txt[contenteditable]'); if (!el || !RV.changed.has(el.dataset.key)) return;
    const k = el.dataset.key, n = (A.state.report.texts[k] || '').length; RV.changed.delete(k);
    A.addLog('Clinician 1', `Edited the ${label(k)} in report draft v${A.state.report.version} (${n} characters)`);
    if (buildPages(docCtx()).sig !== RV.sig) setTimeout(drawDoc, 120);
  });
  RV.ro = new ResizeObserver(() => applyZoom()); RV.ro.observe(cv);
  drawDoc();
}
function drawDoc() {
  const root = RV.root; if (!root || !root.isConnected) return;
  const c = docCtx(), cv = $('#cCanvas', root), st = cv.scrollTop, b = buildPages(c);
  RV.N = b.N; RV.items = b.items; RV.sig = b.sig;
  const z = $('#cZoom', root); z.innerHTML = b.html; z.classList.toggle('c-marks', RV.marks && c.editable);
  $('#cMarks', root).disabled = !c.editable;
  $('#cPages', root).textContent = `${b.N} pages · A4`;
  applyZoom(); cv.scrollTop = st; drawBanner(c); drawOutline(); drawSide();
}
function applyZoom() {
  const root = RV.root; if (!root || !root.isConnected) return;
  const cv = $('#cCanvas', root), z = RV.zoom === 'fit' ? Math.min(1, (cv.clientWidth - 30) / PW) : RV.zoom;
  $('#cZoom', root).style.zoom = Math.max(0.2, z).toFixed(3);
}
function drawBanner(c) {
  const r = A.state.report, last = r.issued[r.issued.length - 1], el = $('#cBan', RV.root); let h = '';
  if (r.status === 'issued' && last) h += `<div class="banner ok"><b>Issued v${last.v}</b><span style="flex:1">${esc(last.at)} by Clinician 1. Read only.</span><button class="btn sm" data-go2="issued">Open issued</button><button class="btn sm primary" data-correct>Correct</button></div>`;
  else if (last) h += `<div class="banner amber"><b>Correction v${r.version}</b><span style="flex:1">Version ${last.v} stays issued until version ${r.version} is issued. Reason: ${esc(r.pendingReason || '')}</span><button class="btn sm" data-go2="issued">View v${last.v}</button></div>`;
  if (c.lang === 'de') h += `<div class="banner"><b>German</b><span style="flex:1">Headings and labels in German; the German sentence library is not loaded in the mockup, sentences show in English.</span>${A.ann('M10')}</div>`;
  el.innerHTML = h; el.hidden = !h;
}
function drawOutline() {
  const c = docCtx(), its = RV.items || [];
  $('#cOutN', RV.root).textContent = `${its.length} blocks`;
  $('#cOut', RV.root).innerHTML = its.map(i => `<button class="c-oi${i.id.startsWith('comment.') ? ' sub' : ''}" data-out="${i.id}" title="${esc(i.label)}"><span class="chip ${i.kind}">${i.kind}</span><span class="c-ol">${esc(i.id.startsWith('comment.') ? 'Comment' : i.label)}</span>${i.kind === 'clinician' && !(c.texts[i.id] || '').trim() ? '<span class="c-em" title="Empty">empty</span>' : ''}</button>`).join('');
}
function drawSide() {
  const r = A.state.report, t = ensure(), c = docCtx(), { w, ok } = checks(c), ed = c.editable;
  $('#cSide', RV.root).innerHTML = `
    <div class="card"><div class="hd"><h3>Report</h3>${ed ? `<span class="chip info"><span class="d"></span>Draft</span>` : '<span class="chip ok"><span class="d"></span>Issued</span>'}</div><div class="bd"><dl class="kv">
      <dt>Report</dt><dd class="mono">R-MOCK-042 v${c.v}</dd><dt>Template</dt><dd><span class="mono">${c.tid}</span> v${c.tv} <a class="xs" href="#templates" data-tedit="${c.tid}">Edit</a></dd>
      <dt>Pages</dt><dd>${RV.N}</dd><dt>Author</dt><dd>Clinician 1</dd></dl>
      <div class="field"><span>Template for this report ${A.ann('Clinic templates: style and clinic texts change; device blocks and figures stay fixed')}</span><select id="cTpl" ${ed ? '' : 'disabled'}>${Object.entries(TPLS).map(([id, x]) => `<option value="${id}" ${c.tid === id ? 'selected' : ''}>${esc(x.name)} · ${id} v${tpl(id).version}</option>`).join('')}</select></div>
      <div class="field"><span>Language ${A.ann('M18 language per template')}</span><select id="cLang" ${ed ? '' : 'disabled'}><option value="en" ${c.lang === 'en' ? 'selected' : ''}>English</option><option value="de" ${c.lang === 'de' ? 'selected' : ''}>German</option><option value="ja" disabled>Japanese (later market)</option></select></div></div></div>
    <div class="card"><div class="hd"><h3>Choices shown in the report</h3></div><div class="bd c-ch">${c.choices.map(x => `<div><span class="lbl">${x.k}</span>${esc(x.v)} ${x.ok ? '<span class="chip ok">✓</span>' : '<span class="chip amber">open</span>'}</div>`).join('')}</div></div>
    <div class="card"><div class="hd"><h3>${ed ? 'Before issuing' : 'Checks at issue'}</h3>${w.length ? `<span class="chip amber">${w.length} warning${w.length > 1 ? 's' : ''}</span>` : '<span class="chip ok">ready</span>'}</div><div class="bd">
      <ul class="c-ck">${w.map(x => `<li class="w" data-ck="${x.go ? 'go:' + x.go : 'blk:' + x.blk}" tabindex="0"><b>⚠</b><span>${esc(x.t)}</span></li>`).join('')}${ok.map(x => `<li class="k"><b>✓</b><span>${esc(x)}</span></li>`).join('')}
      <li class="k"><b>🔒</b><span>${c.cfg.blocks.filter(id => CAT[id] && CAT[id].kind === 'device').length} device blocks locked</span></li></ul>
      ${ed ? ((A.state.segments.confirmed && A.state.cleaning.confirmed) ? `<button class="btn primary" id="cIssue" style="justify-content:center">Issue v${c.v}…</button>` : `<button class="btn primary" disabled style="justify-content:center" title="Confirm segments and cleaning first">Issue v${c.v}…</button><span class="xs muted">Confirm the segments and the cleaning before issuing.</span>`) : `<button class="btn" data-correct style="justify-content:center">Correct this report</button>`}</div></div>`;
}
function scrollBlk(id) {
  const el = $(`#cZoom [data-blk="${CSS.escape(id)}"]`, RV.root); if (!el) return;
  const cv = $('#cCanvas', RV.root), d = el.getBoundingClientRect().top - cv.getBoundingClientRect().top;
  cv.scrollTo({ top: cv.scrollTop + d - 16, behavior: 'smooth' });
  el.classList.remove('c-flash'); void el.offsetWidth; el.classList.add('c-flash');
}
function focusKey(k, scroll) {
  const el = $(`#cZoom [data-key="${CSS.escape(k)}"]`, RV.root); if (!el || !el.isContentEditable) return;
  if (scroll) scrollBlk(k);
  el.focus({ preventScroll: true }); const rg = document.createRange(); rg.selectNodeContents(el); rg.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
}
window.Modules.report = { render: edRender, destroy() { if (RV.ro) RV.ro.disconnect(); RV.ro = null; RV.root = null; $$('.c-tip').forEach(x => x.remove()); } };

/* ================================ Issued viewer ================================ */
const IV = { sel: null, zoom: 'fit', root: null, ro: null };
const ZSTEPS = [0.5, 0.6, 0.75, 0.9, 1, 1.25];
function ivRender(root) {
  ensure(); IV.root = root;
  const r = A.state.report, list = r.issued;
  if (!list.length) {
    root.innerHTML = `<div class="card"><div class="empty"><div style="font-size:30px">▤</div><b>No issued report yet</b><br><span class="small">The report for this measurement is a draft (v${r.version}).</span><br><button class="btn primary" data-go2="report" style="margin-top:12px">Open the report draft</button></div></div>`;
    root.onclick = e => { if (e.target.closest('[data-go2]')) A.go('report'); }; return;
  }
  const last = list[list.length - 1], e = list.find(x => x.v === IV.sel) || last, c = ctxEntry(e, list), b = buildPages(c);
  const drafting = r.status === 'draft';
  root.innerHTML = `<div class="c-iv">
    ${drafting ? `<div class="banner amber"><b>Correction v${r.version} in progress</b><span style="flex:1">Version ${last.v} stays issued until version ${r.version} is issued.</span><button class="btn sm primary" data-go2="report">Open draft v${r.version}</button></div>` : ''}
    <div class="card"><div class="toolbar" role="toolbar" aria-label="Issued report">
      <b class="mono small">R-MOCK-042 v${e.v}</b><span class="chip clinic" title="Template used for this version">${esc(tname(c.tid))} · ${c.tid} v${e.tv}</span>${c.status === 'replaced' ? `<span class="chip">Replaced by v${c.replacedBy}</span>` : '<span class="chip ok"><span class="d"></span>Issued</span>'}
      <label>Version <select id="cVer">${list.slice().reverse().map(x => `<option value="${x.v}" ${x.v === e.v ? 'selected' : ''}>v${x.v} · ${esc(x.at)}</option>`).join('')}</select></label><span class="sep"></span>
      <button class="btn sm" data-z="-1" aria-label="Zoom out">−</button><span class="c-zl mono" id="cZl"></span><button class="btn sm" data-z="1" aria-label="Zoom in">+</button><button class="btn sm ghost" data-z="fit">Fit width</button>
      <span class="sep"></span><button class="btn sm" id="cDl">⤓ Download PDF</button><span style="flex:1"></span>
      ${!drafting && e.v === last.v ? '<button class="btn sm primary" data-correct>Correct this report</button>' : ''}</div>
      <div class="c-ivbody"><div class="c-thumbs" id="cThumbs">${b.pages.map((p, i) => `<button class="c-th${i ? '' : ' on'}" data-pg="${i + 1}" aria-label="Page ${i + 1}"><div class="c-thz"><div>${p}</div></div><span>${i + 1}</span></button>`).join('')}</div>
        <div class="c-canvas" id="cIvC"><div class="c-zoom" id="cIvZ">${b.html}</div></div></div>
      <div class="c-ivfoot xs muted"><span>Issued ${esc(e.at)} by Clinician 1</span><span>${esc(M2.processed_with.software)}</span><span>${esc(M2.processed_with.norms)}</span><span>Template ${c.tid} v${e.tv} · ${esc((TPLS[c.tid] || TPLS["CT-C-EN"]).short)}</span><span>${e.lang === "de" ? "German" : "English"} · ${b.N} pages</span><span class="mono">Checksum ${hash(JSON.stringify([e.v, e.texts, e.tv, e.at]))}</span></div></div>
    <div class="card"><div class="hd"><h2>Version history</h2><span class="xs muted">Every issued version is kept ${A.ann('Corrections as new versions')}</span></div><div class="scroll-x"><table class="tbl">
      <tr><th>Version</th><th>Status</th><th>Issued</th><th>By</th><th>Reason</th><th>Template</th><th class="num">Pages</th></tr>
      ${drafting ? `<tr class="link" data-go2="report"><td class="mono">v${r.version}</td><td><span class="chip info">Draft</span></td><td class="muted">not issued</td><td>Clinician 1</td><td>${esc(r.pendingReason || '')}</td><td>${r.tpl} v${tpl(r.tpl).version}</td><td></td></tr>` : ''}
      ${list.slice().reverse().map(x => { const nx = list.find(y => y.v > x.v); return `<tr class="link${x.v === e.v ? ' on' : ''}" data-ver="${x.v}"><td class="mono">${x.v === e.v ? '▸ ' : ''}v${x.v}</td><td>${nx ? `<span class="chip">Replaced by v${nx.v}</span>` : '<span class="chip ok">Issued, current</span>'}</td><td>${esc(x.at)}</td><td>Clinician 1</td><td>${esc(x.reason)}</td><td>${x.tid || 'CT-C-EN'} v${x.tv}</td><td class="num">${x.pages || ''}</td></tr>`; }).join('')}
    </table></div></div></div>`;
  const cv = $('#cIvC', root);
  const zoomNow = () => IV.zoom === 'fit' ? Math.min(1.25, (cv.clientWidth - 30) / PW) : IV.zoom;
  const applyZ = () => { const z = Math.max(0.2, zoomNow()); $('#cIvZ', root).style.zoom = z.toFixed(3); $('#cZl', root).textContent = Math.round(z * 100) + '%'; };
  root.onclick = (ev) => {
    const t = ev.target;
    const zb = t.closest('[data-z]'); if (zb) { const cur = zoomNow(); if (zb.dataset.z === 'fit') IV.zoom = 'fit'; else { const d = +zb.dataset.z; IV.zoom = d > 0 ? (ZSTEPS.find(s => s > cur + 0.01) || 1.25) : ([...ZSTEPS].reverse().find(s => s < cur - 0.01) || 0.5); } return applyZ(); }
    const pg = t.closest('[data-pg]'); if (pg) { const p = $(`#cIvZ [data-page="${pg.dataset.pg}"]`, root); cv.scrollTo({ top: cv.scrollTop + p.getBoundingClientRect().top - cv.getBoundingClientRect().top - 12, behavior: 'smooth' }); return; }
    const vr = t.closest('[data-ver]'); if (vr) { IV.sel = +vr.dataset.ver; A.addLog('Clinician 1', `Viewed issued report R-MOCK-042 v${IV.sel}`); return ivRender(root); }
    if (t.closest('[data-correct]')) return correctDialog();
    if (t.closest('[data-go2]')) return A.go('report');
    if (t.closest('#cDl')) { A.addLog('Clinician 1', `Downloaded R-MOCK-042 v${e.v} as PDF`); A.toast(`R-MOCK-042-v${e.v}.pdf downloaded (mockup: no file is created)`); }
  };
  $('#cVer', root).onchange = (ev) => { IV.sel = +ev.target.value; ivRender(root); };
  cv.onscroll = () => { const top = cv.getBoundingClientRect().top + 60; let cur = 1;
    $$('#cIvZ .c-pg', root).forEach(p => { if (p.getBoundingClientRect().top <= top) cur = +p.dataset.page; });
    $$('#cThumbs .c-th', root).forEach(x => x.classList.toggle('on', +x.dataset.pg === cur)); };
  if (IV.ro) IV.ro.disconnect(); IV.ro = new ResizeObserver(applyZ); IV.ro.observe(cv); applyZ();
}
window.Modules.issued = { render: ivRender, destroy() { if (IV.ro) IV.ro.disconnect(); IV.ro = null; } };

/* ================================ Template builder ================================ */
const TB = { id: 'CT-C-EN', draft: null, dragI: null, root: null, ro: null, pvT: null };
const tplTexts = (d) => [d.texts.intro, d.texts.addr1, d.texts.addr2].join('\n');
const dirty = () => JSON.stringify(TB.draft) !== JSON.stringify(tpl(TB.id).cfg);
const swatch = (id) => { const c = tpl(id).cfg.theme.accent; return id === 'CT-STD-EN' ? `background:linear-gradient(${NAVY} 0 62%, #fff 62% 78%, ${LIME} 78%)` : `background:linear-gradient(#fff 0 30%, ${c} 30% 52%, #fff 52%)`; };
function diffSum(a, b) {
  const ch = [], lb = (x) => CAT[x].label.toLowerCase();
  if (a.blocks.join() !== b.blocks.join()) { const add = b.blocks.filter(x => !a.blocks.includes(x)), rem = a.blocks.filter(x => !b.blocks.includes(x));
    if (add.length) ch.push('added ' + add.map(lb).join(', ')); if (rem.length) ch.push('removed ' + rem.map(lb).join(', ')); if (!add.length && !rem.length) ch.push('block order'); }
  if (a.texts.intro !== b.texts.intro) ch.push('introduction text'); if (a.texts.addr1 !== b.texts.addr1 || a.texts.addr2 !== b.texts.addr2) ch.push('header lines');
  if (a.theme.font !== b.theme.font) ch.push('font ' + b.theme.font); if (a.theme.hfont !== b.theme.hfont) ch.push('heading font ' + b.theme.hfont); if (a.theme.accent !== b.theme.accent) ch.push('accent colour');
  if (a.theme.logo !== b.theme.logo) ch.push('logo position'); if (a.theme.addr !== b.theme.addr) ch.push('address lines ' + (b.theme.addr ? 'shown' : 'hidden'));
  if (a.theme.pageOf !== b.theme.pageOf) ch.push('page numbering'); if (a.comments !== b.comments) ch.push('clinician comments ' + (b.comments ? 'allowed' : 'off'));
  const s = ch.join(', '); return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
function tplRender(root) {
  ensure(); const t = tpl(TB.id), meta = TPLS[TB.id], std = TB.id === 'CT-STD-EN'; TB.root = root; if (!TB.draft) TB.draft = clone(t.cfg);
  const d = TB.draft, th = d.theme, inUse = A.state.report.tpl === TB.id;
  root.innerHTML = `
    <div class="crumbs"><span>Clinic C</span><span>/</span><span>Report templates</span></div>
    <div class="c-tls" role="tablist" aria-label="Templates">${Object.entries(TPLS).map(([id, x]) => `<button class="c-tl${id === TB.id ? ' on' : ''}" role="tab" aria-selected="${id === TB.id}" data-tpl="${id}"><span class="c-tlsw" style="${swatch(id)}"></span><span><b>${esc(x.name)}</b><span class="xs muted"><span class="mono">${id}</span> · v${tpl(id).version} · ${x.owner === 'company' ? 'company template' : 'clinic template'}${A.state.report.tpl === id ? ' · used by MOCK-042' : ''}</span></span></button>`).join('')}
      <button class="c-tl" disabled><span class="c-tlsw"></span><span><b>Clinic C, German</b><span class="xs muted"><span class="mono">CT-C-DE</span> · not set up</span></span></button></div>
    <div class="pagehead"><div><h1>${esc(meta.name)} <span class="mono muted" style="font-size:14px;font-weight:500">${TB.id}</span> <span class="chip ${std ? 'device' : 'clinic'}">${std ? 'company' : 'clinic'}</span></h1>
      <div class="muted small">v${t.version} ${inUse ? 'in use by the MOCK-042 report draft' : 'available to draft reports'} · issued reports keep the version they were issued with ${std ? A.ann('Mockup assumption: the company standard keeps the heritage look of the current company report') : ''}</div></div>
      <div class="row"><span id="cDirty"></span><button class="btn" id="cDisc">Discard</button><button class="btn primary" id="cSave">Save as ${TB.id} v${t.version + 1}</button></div></div>
    <div id="cSaveWhy"></div>
    <div class="c-tb">
      <div class="c-tbl">
        <div class="card"><div class="hd"><h3>Blocks in this template</h3><span class="xs muted">drag to reorder ${A.ann('M23 required blocks')}</span></div><ul class="c-list" id="cList"></ul></div>
        <div class="card"><div class="hd"><h3>Add blocks</h3></div><div class="bd c-add" id="cAdd"></div></div>
        <div class="card"><div class="hd"><h3>Clinic texts</h3><span class="chip clinic">clinic</span></div><div class="bd grid" style="gap:10px">
          <div class="field"><span>Introduction text</span><textarea id="cIntro" aria-label="Introduction text">${esc(d.texts.intro)}</textarea></div>
          <div class="row xs"><span class="muted">Insert</span>${['name', 'age', 'recording_date'].map(p => `<button class="btn sm" data-ins="{${p}}">{${p}}</button>`).join('')}</div>
          <div class="c-mirror" id="cMirror" aria-live="polite"></div>
          <div class="field"><span>Header line 1</span><input id="cA1" value="${esc(d.texts.addr1)}"></div><div class="field"><span>Header line 2</span><input id="cA2" value="${esc(d.texts.addr2)}"></div>
          <div id="cHits"></div></div></div>
      </div>
      <div class="card"><div class="hd"><h3>Preview, pages 1 and 2</h3><span class="xs muted">MOCK-042 · synthetic data</span></div><div class="c-pv" id="cPv"><div class="c-zoom" id="cPvZ"></div></div></div>
      <div class="c-tbr">
        <div class="card"><div class="hd"><h3>Theme</h3></div><div class="bd grid" style="gap:12px">
          <div class="field"><span>Font ${A.ann('M11 approved fonts')}</span><select id="cFont">${Object.keys(FONTS).map(f => `<option ${f === th.font ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
          ${th.hfont ? `<div class="field"><span>Heading font ${A.ann('Mockup assumption: Carlito and Fira Sans stand in for the Calibri and Trebuchet style of the current company report')}</span><select id="cHFont">${Object.keys(FONTS).map(f => `<option ${f === th.hfont ? 'selected' : ''}>${f}</option>`).join('')}</select></div>` : ''}
          <div class="field"><span>Accent colour</span><div class="c-sw" id="cSw">${ACCENTS.map(a => `<button data-acc="${a}" class="${a === th.accent ? 'on' : ''}" style="background:${a}" aria-label="Accent ${a}"></button>`).join('')}</div></div>
          <div class="field"><span>Logo</span><div class="row"><span class="paper xs" style="border:1px dashed ${th.accent};color:${th.accent};padding:4px 10px;font-weight:700;letter-spacing:.1em">${meta.logo}</span><button class="btn sm" id="cLogo">Replace…</button></div>
            <div class="seg" id="cLogoPos">${[['left', 'Logo left'], ['right', 'Logo right']].map(([v, l]) => `<button data-lp="${v}" class="${th.logo === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <div class="field"><span>Header</span><label class="row small"><input type="checkbox" id="cAddr" ${th.addr ? 'checked' : ''}> Show header lines</label></div>
          <div class="field"><span>Footer</span><label class="row small"><input type="checkbox" id="cPageOf" ${th.pageOf ? 'checked' : ''}> Page n of N</label><span class="xs muted">Always printed: mockup notice, versions, report id and status.${std ? ' Company style: cover band, Roman section numbers, italic running header from page 2, lime footer band.' : ''}</span></div>
          <div class="banner" style="display:grid;gap:6px"><span class="small"><b>Figure colours are fixed.</b> The z scale is the same in every clinic style. ${A.ann('M12')}</span><div class="paper" style="padding:6px 8px">${A.zScale()}</div></div>
        </div></div>
        <div class="card"><div class="hd"><h3>Template versions</h3></div><div class="scroll-x" id="cHist"></div></div>
      </div></div>`;
  const ta = $('#cIntro', root);
  root.onclick = (e) => {
    const t = e.target, dd = TB.draft;
    const tp = t.closest('[data-tpl]'); if (tp) { if (tp.dataset.tpl === TB.id) return; if (dirty()) return A.toast(`Save or discard the changes to ${TB.id} first`);
      TB.id = tp.dataset.tpl; TB.draft = null; A.addLog('Clinician 1', `Opened report template ${TB.id} (${tname(TB.id)})`); return tplRender(root); }
    const mv = t.closest('[data-mv]'); if (mv) { const [i, s] = mv.dataset.mv.split(':').map(Number); move(i, i + s); return; }
    const rm = t.closest('[data-rmb]'); if (rm) { dd.blocks.splice(+rm.dataset.rmb, 1); return changed(true); }
    const ad = t.closest('[data-addb]'); if (ad) { const li = dd.blocks.indexOf('limits'); dd.blocks.splice(li < 0 ? dd.blocks.length : li, 0, ad.dataset.addb); return changed(true); }
    const ac = t.closest('[data-acc]'); if (ac) { dd.theme.accent = ac.dataset.acc; $$('#cSw button', root).forEach(b => b.classList.toggle('on', b === ac)); return changed(); }
    const lp = t.closest('[data-lp]'); if (lp) { dd.theme.logo = lp.dataset.lp; $$('#cLogoPos button', root).forEach(b => b.classList.toggle('on', b === lp)); return changed(); }
    const ins = t.closest('[data-ins]'); if (ins) { const s = ta.selectionStart, en = ta.selectionEnd; ta.setRangeText(ins.dataset.ins, s, en, 'end'); ta.focus(); dd.texts.intro = ta.value; return changed(); }
    if (t.closest('#cLogo')) return A.toast('Logo files are not used in the mockup; the placeholder box stays');
    if (t.closest('#cRev')) { A.addLog('Clinician 1', `Sent clinic texts of ${TB.id} to company review: ` + claimHits(tplTexts(dd)).join(', ')); return A.toast('Sent to company review. You can save once the words are removed or approved.'); }
    if (t.closest('#cDisc')) { if (!dirty()) return A.toast('No unsaved changes'); TB.draft = clone(tpl(TB.id).cfg); A.toast('Changes discarded'); return tplRender(root); }
    if (t.closest('#cSave')) return save();
  };
  root.oninput = (e) => {
    const id = e.target.id, dd = TB.draft;
    if (id === 'cIntro') dd.texts.intro = e.target.value; else if (id === 'cA1') dd.texts.addr1 = e.target.value; else if (id === 'cA2') dd.texts.addr2 = e.target.value; else return;
    changed();
  };
  root.onchange = (e) => {
    const id = e.target.id, dd = TB.draft;
    if (id === 'cFont') dd.theme.font = e.target.value; else if (id === 'cHFont') dd.theme.hfont = e.target.value; else if (id === 'cAddr') dd.theme.addr = e.target.checked; else if (id === 'cPageOf') dd.theme.pageOf = e.target.checked;
    else if (id === 'cCom') dd.comments = e.target.checked; else return;
    changed();
  };
  if (TB.ro) TB.ro.disconnect(); TB.ro = new ResizeObserver(pvZoom); TB.ro.observe($('#cPv', root));
  drawList(); drawAdd(); drawHits(); drawPreview(); drawHist(); drawSave();
}
function move(i, j) { const b = TB.draft.blocks; if (j < 0 || j >= b.length || i === j) return; const [x] = b.splice(i, 1); b.splice(j, 0, x); changed(true); }
function changed(lists) { if (lists) { drawList(); drawAdd(); } drawHits(); drawSave(); clearTimeout(TB.pvT); TB.pvT = setTimeout(drawPreview, 120); }
function drawList() {
  const root = TB.root, b = TB.draft.blocks, ul = $('#cList', root);
  ul.innerHTML = `<li class="c-row fixed"><span class="c-grip"></span><span class="chip clinic">clinic</span><span class="c-rl">${TB.id === 'CT-STD-EN' ? 'Cover band, logo and patient identity' : 'Clinic header and patient identity'}</span><span class="c-req" title="Fixed at the top of page 1">fixed</span></li>` +
    b.map((id, i) => { const d = CAT[id]; return `<li class="c-row" draggable="true" data-i="${i}"><span class="c-grip" aria-hidden="true">⠿</span><span class="chip ${d.kind}">${d.kind}</span><span class="c-rl">${esc(d.label)}</span>
      ${d.req ? '<span class="c-req" title="Required in every template: cannot be removed">🔒</span>' : ''}<button class="c-ib" data-mv="${i}:-1" aria-label="Move up" title="Move up" ${i ? '' : 'disabled'}>↑</button><button class="c-ib" data-mv="${i}:1" aria-label="Move down" title="Move down" ${i < b.length - 1 ? '' : 'disabled'}>↓</button>
      <button class="c-ib" data-rmb="${i}" aria-label="Remove" ${d.req ? 'disabled title="Required block"' : 'title="Remove"'}>×</button></li>`; }).join('');
  $$('.c-row[draggable]', ul).forEach(li => {
    li.ondragstart = (e) => { TB.dragI = +li.dataset.i; li.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', li.dataset.i); };
    li.ondragend = () => { li.classList.remove('drag'); $$('.c-row', ul).forEach(x => x.classList.remove('over')); };
    li.ondragover = (e) => { e.preventDefault(); $$('.c-row', ul).forEach(x => x.classList.toggle('over', x === li)); };
    li.ondrop = (e) => { e.preventDefault(); const from = TB.dragI ?? +e.dataTransfer.getData('text/plain'); const to = +li.dataset.i; TB.dragI = null; move(from, from < to ? to : to); };
  });
}
function drawAdd() {
  const d = TB.draft, grp = (kind, h) => { const free = Object.entries(CAT).filter(([id, v]) => v.kind === kind && !d.blocks.includes(id));
    return `<h4>${h}</h4>${free.map(([id, v]) => `<div class="row"><span>${esc(v.label)}</span><button class="btn sm" data-addb="${id}">+ Add</button></div>`).join('') || '<div class="xs muted">All in the template</div>'}`; };
  $('#cAdd', TB.root).innerHTML = grp('device', 'Device blocks') + grp('clinic', 'Clinic blocks') + grp('clinician', 'Clinician blocks') +
    `<label class="row small" style="margin-top:6px"><input type="checkbox" id="cCom" ${d.comments ? 'checked' : ''}> Clinician comments after result sections</label>`;
}
function drawHits() {
  const root = TB.root, d = TB.draft, hits = claimHits(tplTexts(d));
  $('#cMirror', root).innerHTML = esc(d.texts.intro).replace(CLAIM, m => `<mark>${m}</mark>`).replace(/\{(name|age|recording_date)\}/g, '<span class="c-phc">{$1}</span>') || '<span class="muted">Empty</span>';
  ['cA1', 'cA2'].forEach(id => { const el = $('#' + id, root); el.classList.toggle('bad', claimHits(el.value).length > 0); });
  $('#cHits', root).innerHTML = hits.length ? `<div class="banner warn" style="display:grid;gap:6px"><span><b>Needs company review.</b> Claim word${hits.length > 1 ? 's' : ''} in clinic texts: ${[...new Set(hits.map(h => h.toLowerCase()))].map(h => `<span class="c-hit">${esc(h)}</span>`).join(' ')} ${A.ann('I6 open question')}</span><span class="row"><button class="btn sm" id="cRev">Send to company review</button></span></div>`
    : '<div class="xs" style="color:var(--ok)">✓ No claim words in clinic texts</div>';
}
function drawSave() {
  const root = TB.root, hits = claimHits(tplTexts(TB.draft)), dt = dirty(), btn = $('#cSave', root);
  btn.disabled = !!hits.length || !dt; btn.title = hits.length ? 'Needs company review' : (dt ? '' : 'No changes');
  $('#cDirty', root).innerHTML = dt ? '<span class="chip amber">Unsaved changes</span>' : '<span class="chip ok">Saved</span>';
  $('#cSaveWhy', root).innerHTML = hits.length && dt ? `<div class="banner warn"><b>Save blocked</b><span style="flex:1">Needs company review: remove ${[...new Set(hits.map(h => h.toLowerCase()))].map(h => `"${esc(h)}"`).join(', ')} from the clinic texts.</span>${A.ann('I6 open question')}</div>` : '';
}
function drawPreview() {
  const root = TB.root; if (!root || !root.isConnected) return; const t = tpl(TB.id), r = A.state.report;
  const b = buildPages({ cfg: TB.draft, texts: r.texts, v: r.version, status: 'draft', lang: 'en', tv: t.version + (dirty() ? 1 : 0), tid: TB.id, editable: false, quality: A.qualitySentences(), choices: choices() }, 2);
  $('#cPvZ', root).innerHTML = b.html; pvZoom();
}
function pvZoom() { const root = TB.root; if (!root || !root.isConnected) return; const pv = $('#cPv', root); $('#cPvZ', root).style.zoom = Math.max(0.25, Math.min(1, (pv.clientWidth - 34) / PW)).toFixed(3); }
function drawHist() {
  const t = tpl(TB.id);
  $('#cHist', TB.root).innerHTML = `<div class="c-hist">${t.history.slice().reverse().map(h => `<div><div class="row between"><b class="mono">v${h.v}</b>${h.v === t.version ? '<span class="chip ok">in use</span>' : ''}</div><div>${esc(h.change)}</div><div class="xs muted">${esc(h.at)} · ${esc(h.by)}</div></div>`).join('')}</div>`;
}
function save() {
  const t = tpl(TB.id), d = TB.draft;
  if (claimHits(tplTexts(d)).length || !dirty()) return;
  const change = diffSum(t.cfg, d); t.version += 1; t.cfg = clone(d); t.history.push({ v: t.version, at: `${TODAY}, ${A.time()}`, by: 'Clinician 1', change });
  A.addLog('Clinician 1', `Saved report template ${TB.id} as version ${t.version}: ${change}`);
  A.toast(`Template ${TB.id} v${t.version} saved. Draft reports use it now; issued reports keep their version.`);
  tplRender(TB.root);
}
window.Modules.template = { render: tplRender, destroy() { if (TB.ro) TB.ro.disconnect(); TB.ro = null; clearTimeout(TB.pvT); } };
