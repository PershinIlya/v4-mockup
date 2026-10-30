/* Module G: the Results section "Source regions" (round of 30 October, SA2): source power per brain region and band
   (sLORETA region values, table 3.3 Core, proposed) as a region by band table of z on the fixed scale, its sentences
   and the fixed limits sentence SRC-LIM-1. Module B lists the section in its rail and calls APP.bres.source(body, R)
   (modules load in name order, so module B's helpers in APP.bx exist when the section is drawn). */
const A = window.APP, T = A.t, esc = A.esc;
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
A.addI18n({
  en: {
    'g.srcT': 'Source power per brain region · {cond}', 'g.zView': 'z', 'g.vView': 'Values', 'g.view': 'View', 'g.region': 'Region',
    'g.nMk': '{n} of {m} values marked', 'g.unitV': 'log10 of the estimated source power, arbitrary units (synthetic)', 'g.limits': 'Limits of the method',
    'g.cellT': '{r} · {b}: {v} (z {z})', 'g.cellV': '{r} · {b}: {v}',
  },
  de: {
    'g.srcT': 'Quellenleistung je Hirnregion · {cond}', 'g.zView': 'z', 'g.vView': 'Werte', 'g.view': 'Ansicht', 'g.region': 'Region',
    'g.nMk': '{n} von {m} Werten markiert', 'g.unitV': 'log10 der geschätzten Quellenleistung, willkürliche Einheiten (synthetisch)', 'g.limits': 'Grenzen der Methode',
    'g.cellT': '{r} · {b}: {v} (z {z})', 'g.cellV': '{r} · {b}: {v}',
  },
});
const G = { view: 'z' };
const pick = (o) => (o && (o[A.lang] || o.en)) || '';
function source(body, R) {
  const B = A.bx, cond = R.cond;
  if (B.MISS(cond)) return B.missing(body, cond, 'source');
  const D = (A.m2.source_regions || {})[cond], def = A.data.source_regions || {}, nn = B.NN(), bands = (D && D.bands) || A.bands.map(b => b.name);
  if (!D) { body.innerHTML = `<div class="card"><div class="empty">${esc(T('b.missEmpty', { cond: B.cll(cond) }))}</div></div>`; return; }
  const lab = (r) => (pick(def.labels) || {})[r] || r, cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const view = nn ? 'v' : G.view, cells = D.regions.flatMap(r => bands.map(b => D.values[r][b])), nMk = cells.filter(x => x.marked).length;
  const td = (r, b) => { const o = D.values[r][b], v = B.n1(o.value, 2);
    if (view === 'v' || o.z == null) return `<td class="num" title="${esc(T('g.cellV', { r: lab(r), b: B.BL[b], v }))}">${v}</td>`;
    return B.zc(o.z, null, '', o.marked).replace('<td ', `<td title="${esc(T('g.cellT', { r: lab(r), b: B.BL[b], v, z: B.fz(o.z) }))}" `); };
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${esc(T('g.srcT', { cond: B.cll(cond) }))}</h3><span class="row" style="gap:4px">${B.propChip()}${B.newV4()}${A.ann("Table 3.3 Core, proposed (new; needs the clinical lead's agreement); L7, Q7")}${B.annW('src')}</span></div>
      <div class="toolbar b-tl"><span class="small muted">${esc(pick(def.title))}</span><span class="b-sp"></span>${nn ? '' : `<span class="xs muted">${esc(T('g.nMk', { n: nMk, m: cells.length }))}</span><div class="seg" id="gSv" aria-label="${esc(T('g.view'))}">${[['z', 'g.zView'], ['v', 'g.vView']].map(([k, l]) => `<button data-v="${k}" class="${view === k ? 'on' : ''}">${esc(T(l))}</button>`).join('')}</div>`}</div>
      <div class="scroll-x"><table class="tbl b-zt g-srt"><tr><th>${esc(T('g.region'))}</th>${bands.map(b => `<th class="num">${esc(B.BL[b])}</th>`).join('')}</tr>
        ${D.regions.map(r => `<tr><td>${esc(cap(lab(r)))}</td>${bands.map(b => td(r, b)).join('')}</tr>`).join('')}</table></div>
      <div class="bd" style="padding-top:8px">${view === 'z' ? `<div class="paper" style="padding:6px 8px;display:inline-block">${A.zScale()}</div><div style="margin-top:6px">${B.mkLeg()}</div>` : ''}
        <p class="xs muted" style="margin:6px 0 0">${esc(view === 'z' ? pick(def.legend) : T('g.unitV'))} ${A.ann('Mockup assumption: 10 anatomical regions (left and right frontal, central, temporal, parietal, occipital), bands as for the spectra; region names anatomical only')}</p></div></div>
    ${B.sents(T('b.sentsCond', { cond: B.cll(cond) }), B.SM()['source_' + cond] || [], T('b.nnNoSent'))}
    ${B.sents(T('g.limits'), B.SM().source_limits || [])}
  </div>`;
  $$('#gSv button', body).forEach(b => b.onclick = () => { G.view = b.dataset.v; source(body, R); });
}
A.css('g-sources', `.g-srt td:first-child { white-space: nowrap; }`);
A.bres = Object.assign(A.bres || {}, { source });
