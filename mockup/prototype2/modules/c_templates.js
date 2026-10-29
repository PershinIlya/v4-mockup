/* Module C, part 2: the page "Report templates" (template builder for CT-C, the clinic's own blue style, and CT-STD,
   the company standard). Split from c_report.js to keep each file under about 1,200 lines; it uses the report module's
   catalogue, pagination and text checks through APP.cx (c_report.js is concatenated before this file). */
const A = window.APP, T = A.t;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
const { ACCENTS, CAT, LIME, NAVY, PW, TL, TPLS, blkLabel, buildPages, changeText, choices, claimHits, claimMark, clone, ensure, fontOpts, histAt, qualityList, snapNow, tname, tpl } = A.cx;
/* ================================ Template builder ================================ */
/* tl: the language of the clinic texts being edited (and of the preview) */
/* as: who is looking. 'clinic' (Clinician 1, clinic admin): read only with "Request a change";
   'company': company staff edit and save (3.5: the company sets up templates on request in the first release) */
const TB = { id: 'CT-C', draft: null, dragI: null, root: null, ro: null, pvT: null, tl: null, as: 'clinic' };
const RO = () => TB.as !== 'company';
const tbActor = () => RO() ? 'who.c1' : 'c.who.staff';
function lockRO() {
  if (!RO() || !TB.root) return; const root = TB.root;
  $$('#cList button, #cAdd button, #cSw button, #cLogoPos button, [data-ins], #cLogo, #cFont, #cHFont, #cAddr, #cPageOf', root).forEach(e => { e.disabled = true; });
  ['cIntro', 'cA1', 'cA2'].forEach(id => { const e = $('#' + id, root); if (e) e.readOnly = true; });
  $$('.c-row[draggable]', root).forEach(li => { li.draggable = false; li.classList.add('ro'); });
}
function reqDialog() {
  const id = TB.id, back = A.dialog({ title: T('c.reqTitle', { id }), ok: T('c.reqOk'), body: `
    <div class="field"><span>${esc(T('c.reqWhat'))}</span><textarea id="cReqT" rows="4" placeholder="${esc(T('c.reqPh'))}"></textarea></div>
    <div class="xs muted">${esc(T('c.reqInfo'))} ${A.ann('3.5 Clinic templates (Working): the company sets up templates on request in the first release')}</div><div id="cReqE" class="xs" style="color:var(--warn)"></div>`,
    onOk: (b) => { const v = $('#cReqT', b).value.trim(); if (!v) { $('#cReqE', b).textContent = T('c.reqErr'); $('#cReqT', b).focus(); return false; }
      tpl(id).requests.push({ at: A.now(), by: 'who.c1', text: v }); A.addLog('who.c1', 'c.log.req', { id, txt: v }); A.toast(T('c.toast.req'));
      if (TB.root && TB.root.isConnected) drawHist(); } });
  setTimeout(() => { const t = $('#cReqT', back); if (t) t.focus(); }, 30);
}
const tplTexts = (d) => TL.map(l => [d.texts[l].intro, d.texts[l].addr1, d.texts[l].addr2].join('\n')).join('\n');
const uniqHits = (hits) => { const seen = new Set(); return hits.filter(h => !seen.has(h.toLowerCase()) && seen.add(h.toLowerCase())); };
const dirty = () => JSON.stringify(TB.draft) !== JSON.stringify(tpl(TB.id).cfg);
const swatch = (id) => { const c = tpl(id).cfg.theme.accent; return id === 'CT-STD' ? `background:linear-gradient(${NAVY} 0 62%, #fff 62% 78%, ${LIME} 78%)` : `background:linear-gradient(#fff 0 30%, ${c} 30% 52%, #fff 52%)`; };
/* what changed between two template versions, as lazy i18n parts (shown in the language active when read) */
function diffSum(a, b) {
  const ch = [], tk = A.tk, refs = (ids) => ids.map(x => A.tk('c.blkRef', { k: x }));
  if (a.blocks.join() !== b.blocks.join()) { const add = b.blocks.filter(x => !a.blocks.includes(x)), rem = a.blocks.filter(x => !b.blocks.includes(x));
    if (add.length) ch.push(tk('c.d.added', { l: refs(add) })); if (rem.length) ch.push(tk('c.d.removed', { l: refs(rem) })); if (!add.length && !rem.length) ch.push(tk('c.d.order')); }
  TL.forEach(l => { const x = a.texts[l], y = b.texts[l];
    if (x.intro !== y.intro) ch.push(tk('c.d.intro', { lang: tk('lang.' + l) })); if (x.addr1 !== y.addr1 || x.addr2 !== y.addr2) ch.push(tk('c.d.header', { lang: tk('lang.' + l) })); });
  if (a.theme.font !== b.theme.font) ch.push(tk('c.d.font', { f: b.theme.font })); if (a.theme.hfont !== b.theme.hfont) ch.push(tk('c.d.hfont', { f: b.theme.hfont })); if (a.theme.accent !== b.theme.accent) ch.push(tk('c.d.accent'));
  if (a.theme.logo !== b.theme.logo) ch.push(tk('c.d.logo')); if (a.theme.addr !== b.theme.addr) ch.push(tk(b.theme.addr ? 'c.d.addrOn' : 'c.d.addrOff'));
  if (a.theme.pageOf !== b.theme.pageOf) ch.push(tk('c.d.pageOf')); if (a.comments !== b.comments) ch.push(tk(b.comments ? 'c.d.comOn' : 'c.d.comOff'));
  return ch;
}
function tplRender(root) {
  ensure(); const t = tpl(TB.id), std = TB.id === 'CT-STD'; TB.root = root; if (!TB.draft) TB.draft = clone(t.cfg); if (!TB.tl) TB.tl = TL.includes(A.lang) ? A.lang : 'en';
  const d = TB.draft, th = d.theme, inUse = A.state.report.tpl === TB.id, tx = d.texts[TB.tl];
  const ro = RO();
  root.innerHTML = `
    <div class="crumbs"><span>${esc(T('clinicC'))}</span><span>/</span><span>${esc(T('c.crumbTpl'))}</span></div>
    <div class="card c-as"><div class="toolbar" role="toolbar" aria-label="${esc(T('c.viewAs'))}"><span class="small muted">${esc(T('c.viewAs'))}</span>
      <div class="seg" id="cAs">${[['clinic', 'c.asClinic'], ['company', 'c.asCompany']].map(([v, l]) => `<button data-as="${v}" class="${TB.as === v ? 'on' : ''}" aria-pressed="${TB.as === v}">${esc(T(l))}</button>`).join('')}</div>
      <span class="xs muted">${esc(T('c.relNote'))}</span>${A.ann('3.5 Clinic templates (Working): the company sets up templates on request in the first release; clinics edit their own later')}</div></div>
    <div class="c-tls" role="tablist" aria-label="${esc(T('c.tplAria'))}">${Object.entries(TPLS).map(([id, x]) => `<button class="c-tl${id === TB.id ? ' on' : ''}" role="tab" aria-selected="${id === TB.id}" data-tpl="${id}"><span class="c-tlsw" style="${swatch(id)}"></span><span><b>${esc(tname(id))}</b><span class="xs muted"><span class="mono">${id}</span> · v${tpl(id).version} · ${esc(T(x.owner === 'company' ? 'c.companyTpl' : 'c.clinicTpl'))}${A.state.report.tpl === id ? esc(T('c.usedBy', { code: A.case.case_code })) : ''}</span></span></button>`).join('')}</div>
    <div class="pagehead"><div><h1>${esc(tname(TB.id))} <span class="mono muted" style="font-size:14px;font-weight:500">${TB.id}</span> <span class="chip ${std ? 'device' : 'clinic'}">${esc(T(std ? 'c.chipCompany' : 'c.chipClinic'))}</span></h1>
      <div class="muted small">${esc(T(inUse ? 'c.inUse' : 'c.avail', { v: t.version, code: A.case.case_code }) + T('c.keepVer'))} ${std ? `<span class="c-annw">${A.ann('Mockup assumption: the company standard keeps the heritage look of the current company report')}</span>` : ''}</div></div>
      ${ro ? `<div class="row"><span class="chip">${esc(T('c.roChip'))}</span><button class="btn primary" id="cReq">${esc(T('c.reqBtn'))}</button></div></div>
    <div class="banner"><span class="small">${esc(T('c.roBan'))}</span></div>` : `<div class="row"><span id="cDirty"></span><button class="btn" id="cDisc">${esc(T('c.discard'))}</button><button class="btn primary" id="cSave">${esc(T('c.saveAs', { id: TB.id, v: t.version + 1 }))}</button></div></div>`}
    <div id="cSaveWhy"></div>
    <div class="c-tb">
      <div class="c-tbl">
        <div class="card"><div class="hd"><h3>${esc(T('c.blocksIn'))}</h3><span class="xs muted">${ro ? '' : esc(T('c.dragHint'))} ${A.ann('M23 required blocks')}</span></div><ul class="c-list" id="cList"></ul></div>
        <div class="card"><div class="hd"><h3>${esc(T('c.addBlocks'))}</h3></div><div class="bd c-add" id="cAdd"></div></div>
        <div class="card"><div class="hd"><h3>${esc(T('c.clinicTexts'))}</h3><span class="chip clinic">${esc(T('c.kind.clinic'))}</span></div><div class="bd grid" style="gap:10px">
          <div class="row between"><span class="xs muted">${esc(T('c.textLang'))} ${A.ann('M32 clinic texts per report language')}</span><div class="seg" id="cTL">${TL.map(l => `<button data-tl="${l}" class="${TB.tl === l ? 'on' : ''}">${esc(T('lang.' + l))}</button>`).join('')}</div></div>
          <div class="field"><span>${esc(blkLabel('intro'))}</span><textarea id="cIntro" lang="${TB.tl}" aria-label="${esc(blkLabel('intro'))}">${esc(tx.intro)}</textarea></div>
          <div class="row xs"><span class="muted">${esc(T('c.insert'))}</span>${['name', 'age', 'recording_date'].map(p => `<button class="btn sm" data-ins="{${p}}">{${p}}</button>`).join('')}</div>
          <div class="c-mirror" id="cMirror" aria-live="polite"></div>
          <div class="field"><span>${esc(T('c.hdr1'))}</span><input id="cA1" lang="${TB.tl}" value="${esc(tx.addr1)}"></div><div class="field"><span>${esc(T('c.hdr2'))}</span><input id="cA2" lang="${TB.tl}" value="${esc(tx.addr2)}"></div>
          <div id="cHits"></div></div></div>
      </div>
      <div class="card"><div class="hd"><h3>${esc(T('c.preview'))}</h3><span class="xs muted">${esc(T('c.pvSub', { lang: T('lang.' + TB.tl), code: A.case.case_code }))}</span></div><div class="c-pv" id="cPv"><div class="c-zoom" id="cPvZ"></div></div></div>
      <div class="c-tbr">
        <div class="card"><div class="hd"><h3>${esc(T('c.theme'))}</h3></div><div class="bd grid" style="gap:12px">
          <div class="field"><span>${esc(T('c.font'))} ${A.ann('M11 approved fonts: the list render.py accepts')}</span><select id="cFont">${fontOpts(th.font)}</select></div>
          ${th.hfont ? `<div class="field"><span>${esc(T('c.hfont'))} ${A.ann('M30 mockup assumption: Carlito and Fira Sans stand in for the fonts of the current company report; render.py does not accept them, so they are not offered')}</span><select id="cHFont">${fontOpts(th.hfont)}</select></div>` : ''}
          <div class="field"><span>${esc(T('c.accent'))}</span><div class="c-sw" id="cSw">${ACCENTS.map(a => `<button data-acc="${a}" class="${a === th.accent ? 'on' : ''}" style="background:${a}" aria-label="${esc(T('c.accentA', { a }))}"></button>`).join('')}</div></div>
          <div class="field"><span>${esc(T('c.logo'))}</span><div class="row"><span class="paper xs" style="border:1px dashed ${th.accent};color:${th.accent};padding:4px 10px;font-weight:700;letter-spacing:.1em">${std ? 'LOGO' : esc(T('c.logoC'))}</span><button class="btn sm" id="cLogo">${esc(T('c.replace'))}</button></div>
            <div class="seg" id="cLogoPos">${[['left', 'c.logoL'], ['right', 'c.logoR']].map(([v, l]) => `<button data-lp="${v}" class="${th.logo === v ? 'on' : ''}">${esc(T(l))}</button>`).join('')}</div></div>
          <div class="field"><span>${esc(T('c.header'))}</span><label class="row small"><input type="checkbox" id="cAddr" ${th.addr ? 'checked' : ''}> ${esc(T('c.showHdr'))}</label></div>
          <div class="field"><span>${esc(T('c.footer'))}</span><label class="row small"><input type="checkbox" id="cPageOf" ${th.pageOf ? 'checked' : ''}> ${esc(T('c.pageOf'))}</label><span class="xs muted">${esc(T('c.always') + (std ? T('c.stdStyle') : ''))}</span></div>
          <div class="banner" style="display:grid;gap:6px"><span class="small"><b>${esc(T('c.figFixed'))}</b> ${esc(T('c.figSame'))} ${A.ann('M12')}</span><div class="paper" style="padding:6px 8px">${A.zScale()}</div></div>
        </div></div>
        <div class="card"><div class="hd"><h3>${esc(T('c.tplVersions'))}</h3></div><div class="scroll-x" id="cHist"></div></div>
      </div></div>`;
  const ta = $('#cIntro', root);
  root.onclick = (e) => {
    const t = e.target, dd = TB.draft;
    const as = t.closest('[data-as]'); if (as) { if (as.dataset.as === TB.as) return; if (!RO() && dirty()) return A.toast(T('c.toast.saveFirst', { id: TB.id }));
      TB.as = as.dataset.as; TB.draft = null; return tplRender(root); }
    const tp = t.closest('[data-tpl]'); if (tp) { if (tp.dataset.tpl === TB.id) return; if (!RO() && dirty()) return A.toast(T('c.toast.saveFirst', { id: TB.id }));
      TB.id = tp.dataset.tpl; TB.draft = null; A.addLog(tbActor(), 'c.log.openTpl', { id: TB.id, name: A.tk('c.tpl.' + TB.id) }); return tplRender(root); }
    const tl = t.closest('[data-tl]'); if (tl) { if (tl.dataset.tl !== TB.tl) { TB.tl = tl.dataset.tl; tplRender(root); } return; }
    if (t.closest('#cReq')) return reqDialog();
    if (RO()) return;
    const mv = t.closest('[data-mv]'); if (mv) { const [i, s] = mv.dataset.mv.split(':').map(Number); move(i, i + s); return; }
    const rm = t.closest('[data-rmb]'); if (rm) { dd.blocks.splice(+rm.dataset.rmb, 1); return changed(true); }
    const ad = t.closest('[data-addb]'); if (ad) { const li = dd.blocks.indexOf('limits'); dd.blocks.splice(li < 0 ? dd.blocks.length : li, 0, ad.dataset.addb); return changed(true); }
    const ac = t.closest('[data-acc]'); if (ac) { dd.theme.accent = ac.dataset.acc; $$('#cSw button', root).forEach(b => b.classList.toggle('on', b === ac)); return changed(); }
    const lp = t.closest('[data-lp]'); if (lp) { dd.theme.logo = lp.dataset.lp; $$('#cLogoPos button', root).forEach(b => b.classList.toggle('on', b === lp)); return changed(); }
    const ins = t.closest('[data-ins]'); if (ins) { const s = ta.selectionStart, en = ta.selectionEnd; ta.setRangeText(ins.dataset.ins, s, en, 'end'); ta.focus(); dd.texts[TB.tl].intro = ta.value; return changed(); }
    if (t.closest('#cLogo')) return A.toast(T('c.toast.logo'));
    if (t.closest('#cRev')) { A.addLog(tbActor(), 'c.log.review', { id: TB.id, w: claimHits(tplTexts(dd)).join(', ') }); return A.toast(T('c.toast.review')); }
    if (t.closest('#cDisc')) { if (!dirty()) return A.toast(T('c.toast.noChg')); TB.draft = clone(tpl(TB.id).cfg); A.toast(T('c.toast.disc')); return tplRender(root); }
    if (t.closest('#cSave')) return save();
  };
  root.oninput = (e) => {
    if (RO()) return;
    const id = e.target.id, dd = TB.draft, x = dd.texts[TB.tl];
    if (id === 'cIntro') x.intro = e.target.value; else if (id === 'cA1') x.addr1 = e.target.value; else if (id === 'cA2') x.addr2 = e.target.value; else return;
    changed();
  };
  root.onchange = (e) => {
    if (RO()) return;
    const id = e.target.id, dd = TB.draft;
    if (id === 'cFont') dd.theme.font = e.target.value; else if (id === 'cHFont') dd.theme.hfont = e.target.value; else if (id === 'cAddr') dd.theme.addr = e.target.checked; else if (id === 'cPageOf') dd.theme.pageOf = e.target.checked;
    else return;
    changed();
  };
  if (TB.ro) TB.ro.disconnect(); TB.ro = new ResizeObserver(pvZoom); TB.ro.observe($('#cPv', root));
  drawList(); drawAdd(); drawHits(); drawPreview(); drawHist(); drawSave(); lockRO();
}
function move(i, j) { if (RO()) return; const b = TB.draft.blocks; if (j < 0 || j >= b.length || i === j) return; const [x] = b.splice(i, 1); b.splice(j, 0, x); changed(true); }
function changed(lists) { if (lists) { drawList(); drawAdd(); lockRO(); } drawHits(); drawSave(); clearTimeout(TB.pvT); TB.pvT = setTimeout(drawPreview, 120); }
function drawList() {
  const root = TB.root, b = TB.draft.blocks, ul = $('#cList', root);
  ul.innerHTML = `<li class="c-row fixed"><span class="c-grip"></span><span class="chip clinic">${esc(T('c.kind.clinic'))}</span><span class="c-rl">${esc(T(TB.id === 'CT-STD' ? 'c.fixedStd' : 'c.fixedC'))}</span><span class="c-req" title="${esc(T('c.fixedT'))}">${esc(T('c.fixed'))}</span></li>` +
    b.map((id, i) => { const d = CAT[id]; return `<li class="c-row" draggable="true" data-i="${i}"><span class="c-grip" aria-hidden="true">⠿</span><span class="chip ${d.kind}">${esc(T('c.kind.' + d.kind))}</span><span class="c-rl">${esc(blkLabel(id))}${v4ann(id)}</span>
      ${d.req ? `<span class="c-req" title="${esc(T('c.reqT'))}">🔒</span>` : ''}<button class="c-ib" data-mv="${i}:-1" aria-label="${esc(T('c.up'))}" title="${esc(T('c.up'))}" ${i ? '' : 'disabled'}>↑</button><button class="c-ib" data-mv="${i}:1" aria-label="${esc(T('c.down'))}" title="${esc(T('c.down'))}" ${i < b.length - 1 ? '' : 'disabled'}>↓</button>
      <button class="c-ib" data-rmb="${i}" aria-label="${esc(T('c.remove'))}" ${d.req ? `disabled title="${esc(T('c.reqBlock'))}"` : `title="${esc(T('c.remove'))}"`}>×</button></li>`; }).join('');
  $$('.c-row[draggable]', ul).forEach(li => {
    li.ondragstart = (e) => { TB.dragI = +li.dataset.i; li.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', li.dataset.i); };
    li.ondragend = () => { li.classList.remove('drag'); $$('.c-row', ul).forEach(x => x.classList.remove('over')); };
    li.ondragover = (e) => { e.preventDefault(); $$('.c-row', ul).forEach(x => x.classList.toggle('over', x === li)); };
    li.ondrop = (e) => { e.preventDefault(); const from = TB.dragI ?? +e.dataTransfer.getData('text/plain'); const to = +li.dataset.i; TB.dragI = null; move(from, from < to ? to : to); };
  });
}
/* C8: blocks whose content is new in V4 or a mockup assumption (texts and sources in A.v4new, results module) */
const V4B = { asymmetry: ['asym'], erp: ['peaks', 'p3a', 'nov'], erp_waves: ['base'] };
const v4ann = (id) => A.v4new && V4B[id] ? `<span class="c-annw">${V4B[id].map(k => A.ann(A.v4new[k])).join('')}</span>` : '';
function drawAdd() {
  const d = TB.draft, grp = (kind) => { const free = Object.entries(CAT).filter(([id, v]) => v.kind === kind && !d.blocks.includes(id));
    return `<h4>${esc(T('c.add.' + kind))}</h4>${free.map(([id]) => `<div class="row"><span>${esc(blkLabel(id))}${v4ann(id)}${A.i18n.en['c.cat.' + id] ? ` <span class="chip">${esc(T('c.cat.' + id))}</span>` : ''}</span><button class="btn sm" data-addb="${id}">${esc(T('c.addBtn'))}</button></div>`).join('') || `<div class="xs muted">${esc(T('c.allIn'))}</div>`}`; };
  $('#cAdd', TB.root).innerHTML = grp('device') + grp('clinic') + grp('clinician') +
    `<div class="xs muted" style="margin-top:6px">✓ ${esc(T('c.comments'))} ${A.ann('C4: comments cannot be switched off; summary, signal quality, notes, versions and Issued by are required')}</div>`;
}
function drawHits() {
  const root = TB.root, d = TB.draft, hits = claimHits(tplTexts(d)), uniq = uniqHits(hits);
  $('#cMirror', root).innerHTML = claimMark(d.texts[TB.tl].intro).replace(/\{(name|age|recording_date)\}/g, '<span class="c-phc">{$1}</span>') || `<span class="muted">${esc(T('c.emptyT'))}</span>`;
  ['cA1', 'cA2'].forEach(id => { const el = $('#' + id, root); el.classList.toggle('bad', claimHits(el.value).length > 0); });
  $('#cHits', root).innerHTML = hits.length ? `<div class="banner warn" style="display:grid;gap:6px"><span><b>${esc(T('c.needsRev'))}</b> ${esc(T('c.claimWords', { n: uniq.length }))} ${uniq.map(h => `<span class="c-hit">${esc(h)}</span>`).join(' ')} ${A.ann('I6 open question')}</span><span class="row"><button class="btn sm" id="cRev">${esc(T('c.sendRev'))}</button></span></div>`
    : `<div class="xs" style="color:var(--ok)">${esc(T('c.noClaims'))}</div>`;
}
function drawSave() {
  if (RO()) { $('#cSaveWhy', TB.root).innerHTML = ''; return; }
  const root = TB.root, hits = claimHits(tplTexts(TB.draft)), dt = dirty(), btn = $('#cSave', root);
  btn.disabled = !!hits.length || !dt; btn.title = hits.length ? T('c.needsRevT') : (dt ? '' : T('c.noChanges'));
  $('#cDirty', root).innerHTML = dt ? `<span class="chip amber">${esc(T('c.unsaved'))}</span>` : `<span class="chip ok">${esc(T('c.savedChip'))}</span>`;
  $('#cSaveWhy', root).innerHTML = hits.length && dt ? `<div class="banner warn"><b>${esc(T('c.saveBlocked'))}</b><span style="flex:1">${esc(T('c.saveBlockedT', { w: uniqHits(hits).map(h => `"${h}"`).join(', ') }))}</span>${A.ann('I6 open question')}</div>` : '';
}
function drawPreview() {
  const root = TB.root; if (!root || !root.isConnected) return; const t = tpl(TB.id), r = A.state.report;
  const sn = snapNow();
  const b = buildPages({ cfg: TB.draft, texts: r.texts, v: r.version, status: 'draft', lang: TB.tl, tv: t.version + (dirty() ? 1 : 0), tid: TB.id, editable: false, quality: qualityList(TB.tl, sn), choices: choices(TB.tl, sn, TB.draft), snap: sn }, 2);
  $('#cPvZ', root).innerHTML = b.html; pvZoom();
}
function pvZoom() { const root = TB.root; if (!root || !root.isConnected) return; const pv = $('#cPv', root); $('#cPvZ', root).style.zoom = Math.max(0.25, Math.min(1, (pv.clientWidth - 34) / PW)).toFixed(3); }
function drawHist() {
  const t = tpl(TB.id);
  $('#cHist', TB.root).innerHTML = `<div class="c-hist">${t.history.slice().reverse().map(h => `<div><div class="row between"><b class="mono">v${h.v}</b>${h.v === t.version ? `<span class="chip ok">${esc(T('c.inUseChip'))}</span>` : ''}</div><div>${esc(changeText(h.change))}</div><div class="xs muted">${esc(histAt(h))} · ${esc(T(h.by))}</div></div>`).join('')}</div>` +
    (t.requests.length ? `<div class="hd"><h3>${esc(T('c.reqs'))}</h3></div><div class="c-hist">${t.requests.slice().reverse().map(q => `<div><div>${esc(q.text)}</div><div class="xs muted">${esc(histAt(q))} · ${esc(T(q.by))} · ${esc(T('c.reqSent'))}</div></div>`).join('')}</div>` : '');
}
function save() {
  const t = tpl(TB.id), d = TB.draft;
  if (RO() || claimHits(tplTexts(d)).length || !dirty()) return;
  const change = diffSum(t.cfg, d); t.version += 1; t.cfg = clone(d); t.history.push({ v: t.version, at: A.now(), by: 'c.who.staff', change });
  A.addLog('c.who.staff', 'c.log.saveTpl', { id: TB.id, v: t.version, change });
  A.toast(T('c.toast.saved', { id: TB.id, v: t.version }));
  tplRender(TB.root);
}
window.Modules.template = { render: tplRender, destroy() { if (TB.ro) TB.ro.disconnect(); TB.ro = null; clearTimeout(TB.pvT); } };

A.cx.tbSet = (id) => { TB.id = id; TB.draft = null; };
