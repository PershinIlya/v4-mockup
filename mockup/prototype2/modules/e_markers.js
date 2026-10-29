/* Module E: frequency markers per electrode (review B3) and the checklist over channel ERPs, both
   "Core, to confirm" in table 3.3 (shared document Q6). Both render inside the Results tab (sections
   "Frequency markers" and "Checklist over channel ERPs", through APP.ex); the report module states
   the clinician's choices with the fixed sentences built here (FM-*, ERPCL-*), following the rules of
   mockup/textlib.py (freq_marker_rows, freq_marker_sentences, checklist_sentences). Suggested markers
   and the checklist rows come from the data (freq_markers, erp_checklist); the clinician confirms,
   moves, removes or adds markers and ticks the checklist; every choice is logged. Read only while
   APP.stageLocked(). */
const A = window.APP, T = A.t;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
A.addI18n({
  en: {
    'e.fmTitle': 'Frequency markers per electrode', 'e.coreConf': 'Core, to confirm', 'e.noRes': 'no results',
    'e.mapZ': 'z at {hz} Hz', 'e.mapAbs': 'Absolute power at {hz} Hz', 'e.specT': 'Absolute power · {ch} · {cond}', 'e.win': 'Marker window {a} to {b} Hz',
    'e.noWin': 'No marker window at {ch}', 'e.read': '{ch} · {f} Hz · {p} µV²/Hz · z {z}', 'e.readNN': '{ch} · {f} Hz · {p} µV²/Hz',
    'e.help': 'Click the spectrum to set the cursor · drag a marker line to move it · arrow keys move the selected marker by 0.5 Hz',
    'e.addAt': '+ Add marker at {ch} {hz} Hz', 'e.moveTo': 'Move marker {k} to {ch} {hz} Hz', 'e.no': 'No.', 'e.site': 'Electrode', 'e.freq': 'Frequency',
    'e.question': 'Question', 'e.choice': 'Choice', 'e.src.suggested': 'suggested', 'e.src.moved': 'moved', 'e.src.added': 'placed by you', 'e.src.removed': 'removed',
    'e.from': 'suggested {s} {h} Hz', 'e.q.mu': 'Mu rhythm?', 'e.q.beta_spindle': 'Beta spindles?', 'e.ans.none': 'Not answered', 'e.ans.yes': 'Yes', 'e.ans.no': 'No',
    'e.rm': 'Remove', 'e.restore': 'Restore', 'e.reset': 'Reset to suggestions', 'e.confirm': 'Confirm markers · {cond}', 'e.confBy': '✓ Confirmed by Clinician 1 · {cond}',
    'e.change': 'Change', 'e.pend': (p) => p.n ? (p.n === 1 ? '1 change pending' : `${p.n} changes pending`) : 'Suggested, not confirmed', 'e.none': 'No marker suggested',
    'e.noneT': 'Nothing suggested for {cond}. Place a marker if the spectrum shows a peak.', 'e.condMiss': '{cond}: no results, no markers',
    'e.nnNote': 'No age norm: markers are not suggested and cannot be placed.', 'e.locked': 'Read only · {why}', 'e.why.issued': 'the report is issued', 'e.why.rejected': 'the recording is rejected',
    'e.lockedConf': 'Confirmed markers are locked; choose Change to edit them.', 'e.sq': 'Square: marker electrode', 'e.sents': 'Fixed sentences', 'e.valScale': 'low to high, this map only',
    'e.toast.conf': 'Frequency markers confirmed · {cond}', 'e.toast.dup': 'A marker already sits at {ch} {hz} Hz', 'e.toast.win': 'Outside the marker window of {ch}',
    'e.log.move': 'Moved frequency marker {k} ({cond}) from {s1} {h1} Hz to {s2} {h2} Hz', 'e.log.add': 'Placed a frequency marker ({cond}) at {s} {h} Hz',
    'e.log.rm': 'Removed the suggested frequency marker at {s} {h} Hz ({cond})', 'e.log.rmAdded': 'Removed the frequency marker placed at {s} {h} Hz ({cond})',
    'e.log.restore': 'Restored the suggested frequency marker at {s} {h} Hz ({cond})', 'e.log.answer': 'Answered "{q}" for frequency marker {k} ({cond}, {s} {h} Hz): {a}',
    'e.log.confS': 'Confirmed the suggested frequency markers ({cond}) unchanged', 'e.log.confM': 'Confirmed the frequency markers ({cond}) with {n} changes',
    'e.log.open': 'Reopened the frequency markers ({cond}) for changes', 'e.log.reset': 'Reset the frequency markers ({cond}) to the suggestions',
    'e.log.reopen': '{from} changed after confirmation: reopened the frequency markers per electrode and the checklist over channel ERPs',
    'e.clTitle': 'Checklist over channel ERPs', 'e.clHelp': 'Tick what each curve shows against its norm band. The system computes nothing from the ticks.',
    'e.clNeg': 'N1, N2 and CNV: larger means more negative.', 'e.component': 'Component', 'e.trial': 'Trial', 'e.window': 'Window', 'e.curve': 'Curve',
    'e.notOffered': 'not offered for this row', 'e.clDone': 'Mark as completed', 'e.clDoneBy': '✓ Completed by Clinician 1', 'e.clTicks': (p) => p.n === 1 ? '1 tick' : `${p.n} ticks`,
    'e.clOpen': 'Not completed', 'e.clNN': 'No norm curves for this age: the checklist is not used.', 'e.clCurveT': 'Open {comp} at {site} in Channel ERPs',
    'e.log.tick': 'Ticked "{item}" for {comp} at {site} ({trial}) in the checklist over channel ERPs', 'e.log.untick': 'Removed the tick "{item}" for {comp} at {site} ({trial})',
    'e.log.clDone': 'Completed the checklist over channel ERPs ({n} ticks)', 'e.log.clOpen': 'Reopened the checklist over channel ERPs for changes',
    'e.toast.cl': 'Checklist completed', 'e.lockedCl': 'The completed checklist is locked; choose Change to edit it.',
  },
  de: {
    'e.fmTitle': 'Frequenzmarker je Elektrode', 'e.coreConf': 'Kern, zu bestätigen', 'e.noRes': 'keine Ergebnisse',
    'e.mapZ': 'z bei {hz} Hz', 'e.mapAbs': 'Absolute Leistung bei {hz} Hz', 'e.specT': 'Absolute Leistung · {ch} · {cond}', 'e.win': 'Markerfenster {a} bis {b} Hz',
    'e.noWin': 'Kein Markerfenster an {ch}', 'e.read': '{ch} · {f} Hz · {p} µV²/Hz · z {z}', 'e.readNN': '{ch} · {f} Hz · {p} µV²/Hz',
    'e.help': 'Spektrum anklicken, um den Cursor zu setzen · Markerlinie ziehen, um sie zu verschieben · die Pfeiltasten verschieben den gewählten Marker um 0,5 Hz',
    'e.addAt': '+ Marker bei {ch} {hz} Hz setzen', 'e.moveTo': 'Marker {k} auf {ch} {hz} Hz verschieben', 'e.no': 'Nr.', 'e.site': 'Elektrode', 'e.freq': 'Frequenz',
    'e.question': 'Frage', 'e.choice': 'Auswahl', 'e.src.suggested': 'vorgeschlagen', 'e.src.moved': 'verschoben', 'e.src.added': 'von Ihnen gesetzt', 'e.src.removed': 'entfernt',
    'e.from': 'Vorschlag {s} {h} Hz', 'e.q.mu': 'My-Rhythmus?', 'e.q.beta_spindle': 'Beta-Spindeln?', 'e.ans.none': 'Nicht beantwortet', 'e.ans.yes': 'Ja', 'e.ans.no': 'Nein',
    'e.rm': 'Entfernen', 'e.restore': 'Wiederherstellen', 'e.reset': 'Auf Vorschläge zurücksetzen', 'e.confirm': 'Marker bestätigen · {cond}', 'e.confBy': '✓ Bestätigt von Kliniker 1 · {cond}',
    'e.change': 'Ändern', 'e.pend': (p) => p.n ? (p.n === 1 ? '1 Änderung ausstehend' : `${p.n} Änderungen ausstehend`) : 'Vorgeschlagen, nicht bestätigt', 'e.none': 'Kein Marker vorgeschlagen',
    'e.noneT': 'Für {cond} nichts vorgeschlagen. Setzen Sie einen Marker, wenn das Spektrum einen Peak zeigt.', 'e.condMiss': '{cond}: keine Ergebnisse, keine Marker',
    'e.nnNote': 'Keine Altersnorm: Marker werden nicht vorgeschlagen und können nicht gesetzt werden.', 'e.locked': 'Schreibgeschützt · {why}', 'e.why.issued': 'der Bericht ist freigegeben', 'e.why.rejected': 'die Aufnahme ist abgelehnt',
    'e.lockedConf': 'Bestätigte Marker sind gesperrt; zum Bearbeiten „Ändern“ wählen.', 'e.sq': 'Quadrat: Elektrode des Markers', 'e.sents': 'Feste Sätze', 'e.valScale': 'niedrig bis hoch, nur diese Karte',
    'e.toast.conf': 'Frequenzmarker bestätigt · {cond}', 'e.toast.dup': 'Bei {ch} {hz} Hz liegt schon ein Marker', 'e.toast.win': 'Außerhalb des Markerfensters von {ch}',
    'e.log.move': 'Frequenzmarker {k} ({cond}) von {s1} {h1} Hz auf {s2} {h2} Hz verschoben', 'e.log.add': 'Frequenzmarker ({cond}) bei {s} {h} Hz gesetzt',
    'e.log.rm': 'Vorgeschlagenen Frequenzmarker bei {s} {h} Hz ({cond}) entfernt', 'e.log.rmAdded': 'Gesetzten Frequenzmarker bei {s} {h} Hz ({cond}) entfernt',
    'e.log.restore': 'Vorgeschlagenen Frequenzmarker bei {s} {h} Hz ({cond}) wiederhergestellt', 'e.log.answer': '„{q}“ für Frequenzmarker {k} ({cond}, {s} {h} Hz) beantwortet: {a}',
    'e.log.confS': 'Vorgeschlagene Frequenzmarker ({cond}) unverändert bestätigt', 'e.log.confM': 'Frequenzmarker ({cond}) mit {n} Änderungen bestätigt',
    'e.log.open': 'Frequenzmarker ({cond}) für Änderungen wieder geöffnet', 'e.log.reset': 'Frequenzmarker ({cond}) auf die Vorschläge zurückgesetzt',
    'e.log.reopen': '{from} nach der Bestätigung geändert: Frequenzmarker je Elektrode und Checkliste über die Kanal-ERPs wieder geöffnet',
    'e.clTitle': 'Checkliste über die Kanal-ERPs', 'e.clHelp': 'Kreuzen Sie an, was jede Kurve gegenüber ihrem Normband zeigt. Das System berechnet aus den Kreuzen nichts.',
    'e.clNeg': 'N1, N2 und CNV: größer bedeutet negativer.', 'e.component': 'Komponente', 'e.trial': 'Durchgang', 'e.window': 'Fenster', 'e.curve': 'Kurve',
    'e.notOffered': 'für diese Zeile nicht angeboten', 'e.clDone': 'Als ausgefüllt markieren', 'e.clDoneBy': '✓ Ausgefüllt von Kliniker 1', 'e.clTicks': (p) => p.n === 1 ? '1 Kreuz' : `${p.n} Kreuze`,
    'e.clOpen': 'Nicht ausgefüllt', 'e.clNN': 'Keine Normkurven für dieses Alter: Die Checkliste wird nicht verwendet.', 'e.clCurveT': '{comp} an {site} in Kanal-ERPs öffnen',
    'e.log.tick': '„{item}“ für {comp} an {site} ({trial}) in der Checkliste über die Kanal-ERPs angekreuzt', 'e.log.untick': 'Kreuz „{item}“ für {comp} an {site} ({trial}) entfernt',
    'e.log.clDone': 'Checkliste über die Kanal-ERPs ausgefüllt ({n} Kreuze)', 'e.log.clOpen': 'Checkliste über die Kanal-ERPs für Änderungen wieder geöffnet',
    'e.toast.cl': 'Checkliste ausgefüllt', 'e.lockedCl': 'Die ausgefüllte Checkliste ist gesperrt; zum Bearbeiten „Ändern“ wählen.',
  },
});

const CONDS = ['EO', 'EC'];
const M = () => A.m2;
const CH = () => A.channels;
const FMD = () => M().freq_markers || {};
const NN = () => !!M().no_norm;
const key = () => A.case.case_code + '|' + M().id;
const locked = () => (A.stageLocked ? A.stageLocked() : '');
const condL = (c, L) => T('condl.' + c, null, L);
const nf = (v, L) => A.nf(v, 1, L);
/* ---------------- fixed sentences (data.json choice_sentences, choice_parts) ---------------- */
const tplOf = (k, L, id) => { const d = A.data[k] || {}; return (d[L] || {})[id] ?? (d.en || {})[id] ?? id; };
const fillT = (t, p) => String(t).replace(/\{(\w+)\}/g, (m, k) => (p && p[k] != null ? p[k] : m));
const part = (L, id, p) => fillT(tplOf('choice_parts', L, id), p);
const say = (L, id, p) => { const t = tplOf('choice_sentences', L, id), x = fillT(t, p); return { id, text: t[0] === '{' ? x.charAt(0).toUpperCase() + x.slice(1) : x }; };
const zState = (L, z, mk) => part(L, 'state_z', { state: part(L, 'state.' + (!mk ? 'not' : z > 0 ? 'above' : 'below')), z: A.nf(z, 1, L) });

/* ---------------- frequency marker state, per case and measurement ----------------
   per condition {confirmed, at, moves: {n: {site, hz}}, removed: [n], added: [{id, site, hz}], answers: {"EC|C4|10": "yes"}} */
const blank = () => ({ confirmed: false, at: null, moves: {}, removed: [], added: [], answers: {}, seq: 0 });
function fmState() { const s = A.state; s.fm = s.fm || {}; const k = key(); if (!s.fm[k]) s.fm[k] = { EO: blank(), EC: blank() }; return s.fm[k]; }
function clState() { const s = A.state; s.ercl = s.ercl || {}; const k = key(); if (!s.ercl[k]) s.ercl[k] = { completed: false, at: null, ticks: {} }; return s.ercl[k]; }
const sugg = (cond) => { const S = (FMD().suggested || {})[cond]; return S === undefined ? null : S; };
const freqs = () => M().spectra.freqs;
const binOf = (hz) => Math.round((hz - freqs()[0]) / 0.5);
const zAt = (cond, site, hz) => { const C = M().spectra.conditions[cond]; if (!C || !C.z) return { z: null, marked: false }; const i = CH().indexOf(site), k = binOf(hz); return { z: C.z[i][k], marked: !!(C.z_marked && C.z_marked[i][k]) }; };
const question = (site, hz) => { const Q = FMD().questions || {}; return Object.keys(Q).find(q => Q[q].sites.includes(site) && Q[q].lo <= hz && hz < Q[q].hi) || null; };
const ansKey = (cond, site, hz) => `${cond}|${site}|${+hz}`;
/* marker window of an electrode within the analysed range (1 to 30 Hz); null: no window (Fp1, Fp2) */
const winOf = (site) => { const w = (FMD().windows || {})[site]; if (!w) return null; const f = freqs(); return [Math.max(f[0], w[0]), Math.min(f[f.length - 1], w[1])]; };
/* markers as they stand (applied) or as suggested: {key, n|id, k, cond, site, hz, z, marked, question, answer, source, from_site, from_hz} */
function rows(st, cond, applied = true) {
  const S = sugg(cond); if (S == null) return null;
  const s = st[cond], out = [];
  S.forEach(m => { if (applied && s.removed.includes(m.n)) return; const mv = applied && s.moves[m.n];
    const r = { key: 's' + m.n, n: m.n, cond, site: m.site, hz: m.hz, z: m.z, marked: !!m.marked, source: 'suggested' };
    if (mv) Object.assign(r, { from_site: m.site, from_hz: m.hz, site: mv.site, hz: mv.hz, source: 'moved' }, zAt(cond, mv.site, mv.hz));
    out.push(r); });
  if (applied) s.added.forEach(a => out.push({ key: 'a' + a.id, id: a.id, cond, site: a.site, hz: a.hz, source: 'added', ...zAt(cond, a.site, a.hz) }));
  out.forEach((r, i) => { r.k = i + 1; r.question = question(r.site, r.hz); r.answer = applied ? s.answers[ansKey(cond, r.site, r.hz)] || null : null; });
  return out;
}
const nChanges = (st, cond) => { const s = st[cond], rs = rows(st, cond) || []; return Object.keys(s.moves).length + s.removed.length + s.added.length + rs.filter(r => r.question && r.answer).length; };
/* a condition needs confirmation when it has results and something to confirm (a suggestion or a placed marker) */
const needs = (st, cond) => { const S = sugg(cond); if (S == null) return false; const s = st[cond]; return !s.confirmed && (S.length > 0 || s.added.length > 0); };
/* FM sentences in the order the PDF prints them (textlib.freq_marker_sentences); before confirmation FM-PEND-1 or FM-PEND-0 */
function fmSentences(L, st, conds = CONDS) {
  const out = [];
  conds.forEach(cond => {
    const S = sugg(cond); if (S == null) return; const s = st[cond], cl = condL(cond, L);
    if (!s.confirmed && needs(st, cond)) { const n = nChanges(st, cond); out.push(say(L, n ? 'FM-PEND-1' : 'FM-PEND-0', { cond: cl, n })); return; }
    const rs = rows(st, cond), changed = rs.filter(r => r.source !== 'suggested'), removed = s.confirmed ? s.removed : [];
    if (!rs.length && !removed.length) { out.push(say(L, 'FM-NONE-1', { cond: cl })); return; }
    if (!changed.length && !removed.length) out.push(say(L, 'FM-AUTO-1', { cond: cl, n: rs.length }));
    changed.forEach(r => { const state = zState(L, r.z, r.marked);
      out.push(r.source === 'moved' ? say(L, 'FM-MOVED-1', { k: r.k, cond: cl, from_site: r.from_site, from_hz: nf(r.from_hz, L), site: r.site, hz: nf(r.hz, L), state })
        : say(L, 'FM-ADDED-1', { k: r.k, cond: cl, site: r.site, hz: nf(r.hz, L), state })); });
    removed.forEach(n => { const m = S.find(x => x.n === n); if (m) out.push(say(L, 'FM-REMOVED-1', { site: m.site, hz: nf(m.hz, L), cond: cl })); });
    rs.forEach(r => { if (r.question && (r.answer === 'yes' || r.answer === 'no')) out.push(say(L, 'FM-Q-1', { k: r.k, cond: cl, site: r.site, hz: nf(r.hz, L), question: part(L, 'q.' + r.question), answer: part(L, 'answer.' + r.answer) })); });
  });
  out.push(say(L, 'FM-RULE-1'));
  return out;
}
/* ---------------- checklist over channel ERPs ---------------- */
const CL = () => A.data.erp_checklist || { rows: [], items: [], item_heads: {} };
const clApplicable = () => !NN() && CL().rows.length > 0;
const clItem = (L, item, neg) => part(L, neg && (item === 'larger' || item === 'smaller') ? (item === 'larger' ? 'cl.more_negative' : 'cl.less_negative') : 'cl.' + item);
const trialName = { go: 'Go', nogo: 'NoGo', ignore: 'Ignore', novelty: 'Novelty' };
function clSentences(L, c) {
  if (!c.completed) return [say(L, 'ERPCL-PEND-1'), say(L, 'ERPCL-RULE-1')];
  const rs = CL().rows, tk = c.ticks || {}, out = [];
  rs.forEach(r => { const items = r.items.filter(i => (tk[r.id] || []).includes(i));
    if (items.length) out.push(say(L, 'ERPCL-TICK-1', { comp: r.component, site: r.site, trial: trialName[r.trial], lo: r.window_ms[0], hi: r.window_ms[1], items: items.map(i => clItem(L, i, r.negative)).join(part(L, 'cl_sep')) })); });
  if (!out.length) out.push(say(L, 'ERPCL-EMPTY-1'));
  else { const rest = rs.filter(r => !r.items.some(i => (tk[r.id] || []).includes(i))).length; if (rest) out.push(say(L, 'ERPCL-REST-1', { n: rest })); }
  out.push(say(L, 'ERPCL-RULE-1'));
  return out;
}
const nTicks = (c) => Object.values(c.ticks || {}).reduce((a, v) => a + v.length, 0);

/* ---------------- shared with the report and the Results rail ---------------- */
const clone = (o) => JSON.parse(JSON.stringify(o));
A.ex = Object.assign(A.ex || {}, {
  snap: () => ({ fm: clone(fmState()), cl: clone(clState()) }),
  fmRows: (st, cond) => rows(st || fmState(), cond, !!(st || fmState())[cond].confirmed),
  fmSentences: (L, st, conds) => fmSentences(L || A.lang, st || fmState(), conds),
  fmOpen: () => CONDS.filter(c => needs(fmState(), c)),
  fmConds: () => CONDS.filter(c => sugg(c) != null),
  clSentences: (L, c) => clSentences(L || A.lang, c || clState()),
  clApplicable, clOpen: () => clApplicable() && !clState().completed, clRows: () => CL().rows, clItems: () => CL().items,
  clHead: (item, L) => ((CL().item_heads || {})[L] || (CL().item_heads || {}).en || {})[item] || item,
  qPart: (L, q) => part(L, 'q.' + q), aPart: (L, a) => part(L, 'answer.' + a),
});
/* an upstream change (segments, cleaning) reopens these confirmations too, as the shell does for the
   alpha peak marker and the ERP peaks (mockup assumption, M45) */
if (A.reopenAfter && !A.reopenAfter._e) {
  const orig = A.reopenAfter;
  A.reopenAfter = function (from) {
    const items = orig.apply(this, arguments), st = fmState(), cl = clState(); let any = false;
    CONDS.forEach(c => { if (st[c].confirmed) { st[c].confirmed = false; any = true; } });
    if (cl.completed) { cl.completed = false; any = true; }
    if (any) A.addLog('who.system', 'e.log.reopen', { from: A.tk('rop.from.' + from) });
    return items;
  };
  A.reopenAfter._e = true;
}

/* ================================ marker tool ================================ */
const E = { k: null, cond: 'EC', ch: null, sel: null, cur: null, hov: null, drag: null, body: null, sp: null, hit: null };
const bx = () => A.bx || {};
function sync() {
  if (E.k === key()) return;
  E.k = key(); E.drag = null; E.hov = null;
  E.cond = CONDS.find(c => (sugg(c) || []).length) || CONDS.find(c => sugg(c) != null) || 'EC';
  const r = (rows(fmState(), E.cond) || [])[0]; E.sel = r ? r.key : null; E.ch = r ? r.site : 'Cz'; E.cur = r ? r.hz : 10;
}
const st = () => fmState()[E.cond];
const rowOf = (k) => (rows(fmState(), E.cond) || []).find(r => r.key === k) || null;
const ro = () => !!locked() || st().confirmed;
const snapHz = (f) => Math.round(f * 2) / 2;
const clampWin = (site, hz) => { const w = winOf(site); return w ? Math.max(w[0], Math.min(w[1], snapHz(hz))) : null; };
const lockMsg = () => A.toast(locked() ? T('e.locked', { why: T('e.why.' + locked()) }) : T('e.lockedConf'));
const condP = (c) => A.tk('condl.' + (c || E.cond));
const hzP = (v) => ({ $n: v, d: 1 });
function occupied(site, hz, except) { return (rows(fmState(), E.cond) || []).some(r => r.key !== except && r.site === site && r.hz === hz); }

function fmRender(body) {
  sync(); E.body = body;
  const s = st(), S = sugg(E.cond), lk = locked();
  const condBtn = (c) => { const miss = sugg(c) == null; return `<button data-ec="${c}" class="${E.cond === c ? 'on' : ''}" ${miss ? `disabled title="${esc(T('e.noRes'))}"` : ''}>${esc(T('cond.' + c))}${miss ? ` <small>· ${esc(T('e.noRes'))}</small>` : ''}${!miss && fmState()[c].confirmed ? ' ✓' : ''}</button>`; };
  const n = nChanges(fmState(), E.cond), need = needs(fmState(), E.cond);
  const stChip = S == null ? '' : s.confirmed ? `<span class="chip ok">${esc(T('e.confBy', { cond: T('condl.' + E.cond) }))}</span>` : need ? `<span class="chip amber">${esc(T('e.pend', { n }))}</span>` : `<span class="chip">${esc(T('e.none'))}</span>`;
  body.innerHTML = `<div class="card e-fm"><div class="hd"><h3>${esc(T('e.fmTitle'))}</h3><span class="row"><span class="chip amber">${esc(T('e.coreConf'))}</span>${A.ann('Table 3.3 Frequency markers and automatic peak suggestions, Core, to confirm (Q6); 3.4 Clinician in control')}${A.ann('M57: legacy AutoPeak windows, top 3 by positive z without the uncorrected 2 z threshold')}</span></div>
    <div class="toolbar e-tl"><div class="seg" id="eCond">${CONDS.map(condBtn).join('')}</div><span class="sep"></span>${stChip}<span class="e-sp"></span><span class="xs muted e-help">${esc(lk ? T('e.locked', { why: T('e.why.' + lk) }) : T('e.help'))}</span></div>
    ${S == null ? `<div class="empty">${esc(T('e.condMiss', { cond: T('cond.' + E.cond) }))}</div>` : `
    <div class="e-grid"><div class="paper e-map"><canvas id="eMap" aria-label="${esc(T('e.mapZ', { hz: nf(E.cur) }))}"></canvas><div id="eMapLeg"></div></div>
      <div class="e-specw"><div class="row between"><h4 class="e-h4" id="eSpT"></h4><span class="xs muted" id="eWin"></span></div>
        <div class="paper e-fig"><canvas id="eSpec" tabindex="0" aria-label="${esc(T('e.specT', { ch: E.ch, cond: T('condl.' + E.cond) }))}"></canvas></div>
        <div class="e-read mono xs" id="eRead"></div><div class="row e-acts" id="eActs"></div></div></div>
    ${NN() ? `<div class="banner small e-nn"><span>${esc(T('e.nnNote'))}</span>${A.ann('Mockup assumption: every marker sentence states the z of its bin, so without an age norm no marker is suggested or placed')}</div>` : ''}
    <div class="scroll-x" id="eTab"></div>
    <div class="row e-foot" id="eFoot"></div>`}</div>
    <div class="card"><div class="hd"><h3>${esc(T('e.sents'))}</h3><span class="xs muted">${esc(T('condl.' + E.cond))}</span></div><div class="bd b-sys">${A.sys(fmSentences(A.lang, fmState(), [E.cond]))}</div></div>`;
  $$('#eCond [data-ec]', body).forEach(b => b.onclick = () => { if (b.disabled) return; E.cond = b.dataset.ec; const r = (rows(fmState(), E.cond) || [])[0]; E.sel = r ? r.key : null; if (r) { E.ch = r.site; E.cur = r.hz; } fmRender(body); });
  if (S == null) return;
  table(); foot(); draw(); wire();
}
function selRow() { return E.sel ? rowOf(E.sel) : null; }
function draw() {
  const b = E.body; if (!b || !b.isConnected) return;
  const C = M().spectra.conditions[E.cond], i = CH().indexOf(E.ch), f = freqs(), w = winOf(E.ch), sel = selRow(), X = bx();
  const cur = E.cur != null ? E.cur : 10, bin = binOf(cur);
  /* head map: z at the cursor bin (absolute power without a norm), square on the marker electrode */
  const mc = $('#eMap', b);
  if (NN() || !C.z) { E.hit = X.topoSeq ? X.topoSeq(mc, C.log_power.map(r => 10 ** r[bin]), { size: 176, title: T('e.mapAbs', { hz: nf(cur) }), names: true, highlight: E.ch }) : null;
    $('#eMapLeg', b).innerHTML = X.seqBar ? X.seqBar(T('e.valScale')) : ''; }
  else { E.hit = A.topo(mc, C.z.map(r => r[bin]), { size: 176, title: T('e.mapZ', { hz: nf(cur) }), names: true, highlight: E.ch });
    if (X.topoDots) X.topoDots(mc, 176, true, C.z_marked.map(r => r[bin]));
    $('#eMapLeg', b).innerHTML = A.zScale() + `<div class="xs" style="color:#55554f;margin-top:4px"><i class="e-sqk"></i>${esc(T('e.sq'))}</div>`; }
  if (sel) { const g = mc.getContext('2d'), S = 176, pad = 16, cx = S / 2, cy = pad + S / 2 - 2, R = S / 2 - 10, p = A.pos[sel.site];
    g.strokeStyle = '#135e7d'; g.lineWidth = 2; g.strokeRect(cx + p[0] * R / 1.08 - 6, cy - p[1] * R / 1.08 - 6, 12, 12); }
  /* spectrum of the selected electrode with its markers */
  $('#eSpT', b).textContent = T('e.specT', { ch: E.ch, cond: T('condl.' + E.cond) });
  $('#eWin', b).textContent = w ? T('e.win', { a: A.nx(w[0]), b: A.nx(w[1]) }) : T('e.noWin', { ch: E.ch });
  const here = (rows(fmState(), E.cond) || []).filter(r => r.site === E.ch);
  const marks = here.map(r => ({ hz: E.drag && E.drag.key === r.key ? E.drag.hz : r.hz, kind: 'fm', on: r.key === E.sel, label: r.k + ' · ' }));
  if (E.cur != null) marks.unshift({ hz: E.cur, kind: 'cur', label: '' });
  const cv = $('#eSpec', b), W = Math.max(300, cv.parentElement.clientWidth - 2);
  E.sp = X.drawSpec ? X.drawSpec(cv, W, { f, lp: C.log_power[i], mu: C.norm_log_mean ? C.norm_log_mean[i] : null, sd: C.norm_log_sd ? C.norm_log_sd[i] : null, mk: C.z_marked ? C.z_marked[i] : null, f0: 1, f1: 30, H: 250, hover: E.hov, marks, win: w || [0, 0] }) : null;
  acts();
}
function read(k) {
  const C = M().spectra.conditions[E.cond], i = CH().indexOf(E.ch), f = freqs()[k], p = A.nf(10 ** C.log_power[i][k], 2);
  $('#eRead', E.body).textContent = NN() || !C.z ? T('e.readNN', { ch: E.ch, f: nf(f), p }) : T('e.read', { ch: E.ch, f: nf(f), p, z: A.nf(C.z[i][k], 1) });
}
function acts() {
  const b = E.body, el = $('#eActs', b); if (!el) return;
  const sel = selRow(), w = winOf(E.ch), ok = !ro() && !NN() && w && E.cur != null && E.cur >= w[0] && E.cur <= w[1];
  const canAdd = ok && !occupied(E.ch, E.cur), canMove = ok && sel && (sel.site !== E.ch || sel.hz !== E.cur) && !occupied(E.ch, E.cur, sel.key);
  el.innerHTML = `<button class="btn sm" id="eAdd" ${canAdd ? '' : 'disabled'}>${esc(T('e.addAt', { ch: E.ch, hz: nf(E.cur ?? 10) }))}</button>${sel ? `<button class="btn sm" id="eMove" ${canMove ? '' : 'disabled'}>${esc(T('e.moveTo', { k: sel.k, ch: E.ch, hz: nf(E.cur ?? 10) }))}</button>` : ''}`;
  const ad = $('#eAdd', el); if (ad) ad.onclick = () => add(E.ch, E.cur);
  const mv = $('#eMove', el); if (mv) mv.onclick = () => move(sel.key, E.ch, E.cur);
}
function table() {
  const b = E.body, rs = rows(fmState(), E.cond) || [], s = st(), S = sugg(E.cond) || [], dis = ro() ? 'disabled' : '';
  const rem = S.filter(m => s.removed.includes(m.n));
  const zcell = (r) => r.z == null ? '<td class="num muted">-</td>' : (bx().zc ? bx().zc(r.z, null, '', r.marked) : `<td class="num">${A.nf(r.z, 1)}</td>`);
  $('#eTab', b).innerHTML = `<table class="tbl e-t"><tr><th class="num">${esc(T('e.no'))}</th><th>${esc(T('e.site'))}</th><th class="num">${esc(T('e.freq'))}</th>${NN() ? '' : '<th class="num">z</th>'}<th>${esc(T('e.question'))}</th><th>${esc(T('e.choice'))}</th><th></th></tr>
    ${rs.map(r => `<tr class="link ${r.key === E.sel ? 'sel' : ''}" data-ek="${r.key}" tabindex="0"><td class="num"><b>${r.k}</b></td><td class="mono">${r.site}</td><td class="num">${nf(r.hz)} Hz</td>${NN() ? '' : zcell(r)}
      <td>${r.question ? `<label class="e-q"><span>${esc(T('e.q.' + r.question))}</span><select data-eq="${r.key}" ${dis}>${[['', 'e.ans.none'], ['yes', 'e.ans.yes'], ['no', 'e.ans.no']].map(([v, l]) => `<option value="${v}" ${(r.answer || '') === v ? 'selected' : ''}>${esc(T(l))}</option>`).join('')}</select></label>` : '<span class="muted">-</span>'}</td>
      <td><span class="chip ${r.source === 'suggested' ? 'device' : 'clinician'}">${esc(T('e.src.' + r.source))}</span>${r.source === 'moved' ? `<div class="xs muted">${esc(T('e.from', { s: r.from_site, h: nf(r.from_hz) }))}</div>` : ''}</td>
      <td class="num"><button class="btn sm ghost" data-erm="${r.key}" ${dis}>${esc(T('e.rm'))}</button></td></tr>`).join('')}
    ${rem.map(m => `<tr class="e-rmd"><td class="num muted">-</td><td class="mono">${m.site}</td><td class="num">${nf(m.hz)} Hz</td>${NN() ? '' : `<td class="num muted">${A.nf(m.z, 1)}</td>`}<td></td><td><span class="chip">${esc(T('e.src.removed'))}</span></td><td class="num"><button class="btn sm ghost" data-ers="${m.n}" ${dis}>${esc(T('e.restore'))}</button></td></tr>`).join('')}
    ${!rs.length && !rem.length ? `<tr><td colspan="7" class="empty">${esc(NN() ? T('e.none') : T('e.noneT', { cond: T('condl.' + E.cond) }))}</td></tr>` : ''}</table>${NN() || !rs.length || !bx().mkLeg ? '' : `<div class="e-leg">${bx().mkLeg()}</div>`}`;
  $$('#eTab tr[data-ek]', b).forEach(tr => { const go = (e) => { if (e.target.closest('select, button')) return; const r = rowOf(tr.dataset.ek); if (!r) return; E.sel = r.key; E.ch = r.site; E.cur = r.hz; table(); draw(); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter') go(e); }; });
  $$('[data-eq]', b).forEach(se => se.onchange = () => answer(se.dataset.eq, se.value));
  $$('[data-erm]', b).forEach(bt => bt.onclick = () => remove(bt.dataset.erm));
  $$('[data-ers]', b).forEach(bt => bt.onclick = () => restore(+bt.dataset.ers));
}
function foot() {
  const b = E.body, el = $('#eFoot', b); if (!el) return; const s = st(), lk = locked(), n = nChanges(fmState(), E.cond), need = needs(fmState(), E.cond);
  el.innerHTML = lk ? (s.confirmed ? `<span class="chip ok">${esc(T('e.confBy', { cond: T('condl.' + E.cond) }))}</span>` : '') + `<span class="e-sp"></span><span class="xs muted">${esc(T('e.locked', { why: T('e.why.' + lk) }))}</span>`
    : s.confirmed ? `<span class="chip ok">${esc(T('e.confBy', { cond: T('condl.' + E.cond) }))}</span><span class="e-sp"></span><button class="btn sm" id="eChg">${esc(T('e.change'))}</button>`
    : `<span class="e-sp"></span>${n ? `<button class="btn sm ghost" id="eReset">${esc(T('e.reset'))}</button>` : ''}${need ? `<button class="btn primary sm" id="eOk">${esc(T('e.confirm', { cond: T('condl.' + E.cond) }))}</button>` : ''}`;
  const ok = $('#eOk', el); if (ok) ok.onclick = () => { const s2 = st(); s2.confirmed = true; s2.at = A.time(); A.addLog('who.c1', n ? 'e.log.confM' : 'e.log.confS', { cond: condP(), n }); A.toast(T('e.toast.conf', { cond: T('condl.' + E.cond) })); after(); };
  const ch = $('#eChg', el); if (ch) ch.onclick = () => { st().confirmed = false; A.addLog('who.c1', 'e.log.open', { cond: condP() }); after(); };
  const rs = $('#eReset', el); if (rs) rs.onclick = () => { Object.assign(st(), { moves: {}, removed: [], added: [], answers: {} }); A.addLog('who.c1', 'e.log.reset', { cond: condP() }); const r = (rows(fmState(), E.cond) || [])[0]; E.sel = r ? r.key : null; after(); };
}
/* after a change: redraw the tool and the Results rail (its "to confirm" badges) */
function after() { if (A.bx && A.bx.railUp) A.bx.railUp(); if (E.body && E.body.isConnected) fmRender(E.body); }
function guard() { if (NN()) return false; if (ro()) { lockMsg(); return false; } return true; }
function add(site, hz) {
  if (!guard()) return; const h = clampWin(site, hz); if (h == null) return A.toast(T('e.toast.win', { ch: site }));
  if (occupied(site, h)) return A.toast(T('e.toast.dup', { ch: site, hz: nf(h) }));
  const s = st(); s.seq = (s.seq || 0) + 1; s.added.push({ id: s.seq, site, hz: h }); E.sel = 'a' + s.seq;
  A.addLog('who.c1', 'e.log.add', { cond: condP(), s: site, h: hzP(h) }); after();
}
function move(k, site, hz) {
  if (!guard()) return; const r = rowOf(k); if (!r) return; const h = clampWin(site, hz);
  if (h == null) return A.toast(T('e.toast.win', { ch: site })); if (r.site === site && r.hz === h) return;
  if (occupied(site, h, k)) return A.toast(T('e.toast.dup', { ch: site, hz: nf(h) }));
  const s = st();
  if (r.source === 'added') { const a = s.added.find(x => 'a' + x.id === k); a.site = site; a.hz = h; }
  else { const o = sugg(E.cond).find(m => m.n === r.n); if (o.site === site && o.hz === h) delete s.moves[r.n]; else s.moves[r.n] = { site, hz: h }; }
  A.addLog('who.c1', 'e.log.move', { k: r.k, cond: condP(), s1: r.site, h1: hzP(r.hz), s2: site, h2: hzP(h) }); E.cur = h; after();
}
function remove(k) {
  if (!guard()) return; const r = rowOf(k); if (!r) return; const s = st();
  if (r.source === 'added') { s.added = s.added.filter(x => 'a' + x.id !== k); A.addLog('who.c1', 'e.log.rmAdded', { cond: condP(), s: r.site, h: hzP(r.hz) }); }
  else { delete s.moves[r.n]; s.removed.push(r.n); const o = sugg(E.cond).find(m => m.n === r.n); A.addLog('who.c1', 'e.log.rm', { cond: condP(), s: o.site, h: hzP(o.hz) }); }
  if (E.sel === k) E.sel = null; after();
}
function restore(n) {
  if (!guard()) return; const s = st(); s.removed = s.removed.filter(x => x !== n); const o = sugg(E.cond).find(m => m.n === n);
  A.addLog('who.c1', 'e.log.restore', { cond: condP(), s: o.site, h: hzP(o.hz) }); E.sel = 's' + n; after();
}
function answer(k, v) {
  if (!guard()) { after(); return; } const r = rowOf(k); if (!r) return; const s = st(), ak = ansKey(E.cond, r.site, r.hz);
  if (v) s.answers[ak] = v; else delete s.answers[ak];
  if (v) A.addLog('who.c1', 'e.log.answer', { q: A.tk('e.q.' + r.question), k: r.k, cond: condP(), s: r.site, h: hzP(r.hz), a: A.tk('e.ans.' + v) });
  after();
}
function wire() {
  const b = E.body, cv = $('#eSpec', b), mc = $('#eMap', b);
  mc.onclick = e => { const r = mc.getBoundingClientRect(), c = E.hit && E.hit(e.clientX - r.left, e.clientY - r.top); if (!c) return; E.ch = c; const w = winOf(c); if (w && E.cur != null) E.cur = Math.max(w[0], Math.min(w[1], E.cur)); draw(); };
  const near = (px) => { if (!E.sp) return null; const sel = (rows(fmState(), E.cond) || []).filter(r => r.site === E.ch); let best = null, bd = 7; sel.forEach(r => { const d = Math.abs(E.sp.x(r.hz) - px); if (d < bd) { bd = d; best = r; } }); return best; };
  cv.onpointerdown = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; if (!E.sp || !E.sp.inside(px)) return; const q = near(px);
    if (q) { E.sel = q.key; if (ro() || NN()) { if (!NN()) lockMsg(); draw(); table(); return; } E.drag = { key: q.key, hz: q.hz }; cv.setPointerCapture(e.pointerId); table(); draw(); return; }
    E.cur = snapHz(E.sp.fAt(px)); draw(); };
  cv.onpointermove = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; if (!E.sp) return;
    if (E.drag) { const h = clampWin(E.ch, E.sp.fAt(px)); if (h != null && h !== E.drag.hz) { E.drag.hz = h; draw(); } return; }
    if (!E.sp.inside(px)) return; const k = E.sp.near(px); cv.style.cursor = near(px) ? (ro() || NN() ? 'not-allowed' : 'ew-resize') : 'crosshair'; if (k !== E.hov) { E.hov = k; draw(); read(k); } };
  cv.onpointerup = () => { if (!E.drag) return; const d = E.drag; E.drag = null; const r = rowOf(d.key); if (r && d.hz !== r.hz) move(d.key, E.ch, d.hz); else draw(); };
  cv.onpointerleave = () => { if (E.drag) return; E.hov = null; draw(); };
  cv.onkeydown = e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const d = e.key === 'ArrowLeft' ? -0.5 : 0.5, sel = selRow();
    if (sel && sel.site === E.ch && !ro() && !NN()) { const base = E.drag ? E.drag.hz : sel.hz, h = clampWin(E.ch, base + d); if (h != null) { E.drag = { key: sel.key, hz: h }; draw(); } return; }
    const f = freqs(); E.cur = Math.max(f[0], Math.min(f[f.length - 1], (E.cur ?? 10) + d)); draw(); read(binOf(E.cur)); };
  cv.onkeyup = e => { if (!E.drag || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return; const d = E.drag; E.drag = null; move(d.key, E.ch, d.hz); };
}

/* ================================ checklist over channel ERPs ================================ */
let CLB = null;
function clRender(body) {
  CLB = body; const c = clState(), lk = locked(), L = A.lang, items = CL().items, ed = !lk && !c.completed;
  if (!clApplicable()) { body.innerHTML = `<div class="card"><div class="hd"><h3>${esc(T('e.clTitle'))}</h3><span class="chip amber">${esc(T('e.coreConf'))}</span></div><div class="empty">${esc(T('e.clNN'))}</div></div>`; return; }
  const head = (i) => A.ex.clHead(i, L);
  body.innerHTML = `<div class="card e-cl"><div class="hd"><h3>${esc(T('e.clTitle'))}</h3><span class="row"><span class="chip amber">${esc(T('e.coreConf'))}</span>${A.ann('Table 3.3 Checklist over channel ERPs, Core, to confirm: like ERPC2, over the channel ERPs; a proposal for the clinical lead (Q6, Q8)')}${A.ann('M61: one row per scored peak, items after the legacy ERPC2 checklist (audit 14e); nothing is pre-ticked or computed')}</span></div>
    <div class="toolbar e-tl"><span class="small">${esc(T('e.clHelp'))}</span><span class="e-sp"></span><span class="xs muted">${esc(T('e.clNeg'))}</span></div>
    <div class="scroll-x"><table class="tbl e-clt"><tr><th>${esc(T('e.component'))}</th><th>${esc(T('e.trial'))}</th><th>${esc(T('e.site'))}</th><th class="num">${esc(T('e.window'))}</th><th>${esc(T('e.curve'))}</th>${items.map(i => `<th class="e-tc">${esc(head(i))}</th>`).join('')}</tr>
      ${CL().rows.map(r => `<tr><td><b>${r.component}</b></td><td>${trialName[r.trial]}</td><td class="mono">${r.site}</td><td class="num" style="white-space:nowrap">${r.window_ms[0]} ${esc(T('to'))} ${r.window_ms[1]} ms</td>
        <td><button class="e-cv paper" data-ecv="${r.trial}|${r.site}" title="${esc(T('e.clCurveT', { comp: r.component, site: r.site }))}"><canvas data-ecr="${r.id}"></canvas></button></td>
        ${items.map(i => r.items.includes(i) ? `<td class="e-tc"><input type="checkbox" data-etk="${r.id}|${i}" aria-label="${esc(r.component + ' ' + r.site + ' ' + trialName[r.trial] + ': ' + head(i))}" ${(c.ticks[r.id] || []).includes(i) ? 'checked' : ''} ${ed ? '' : 'disabled'}></td>` : `<td class="e-tc muted" title="${esc(T('e.notOffered'))}">-</td>`).join('')}</tr>`).join('')}</table></div>
    <div class="row e-foot">${c.completed ? `<span class="chip ok">${esc(T('e.clDoneBy'))}</span>` : `<span class="chip amber">${esc(T('e.clOpen'))}</span>`}<span class="xs muted">${esc(T('e.clTicks', { n: nTicks(c) }))}</span><span class="e-sp"></span>
      ${lk ? `<span class="xs muted">${esc(T('e.locked', { why: T('e.why.' + lk) }))}</span>` : c.completed ? `<button class="btn sm" id="eClChg">${esc(T('e.change'))}</button>` : `<button class="btn primary sm" id="eClOk">${esc(T('e.clDone'))}</button>`}</div></div>
    <div class="card"><div class="hd"><h3>${esc(T('e.sents'))}</h3></div><div class="bd b-sys">${A.sys(clSentences(L, c))}</div></div>`;
  curves();
  $$('[data-etk]', body).forEach(cb => cb.onchange = () => {
    const [id, item] = cb.dataset.etk.split('|'), r = CL().rows.find(x => x.id === id), cc = clState();
    if (locked() || cc.completed) { cb.checked = !cb.checked; return A.toast(locked() ? T('e.locked', { why: T('e.why.' + locked()) }) : T('e.lockedCl')); }
    const l = cc.ticks[id] = cc.ticks[id] || [];
    if (cb.checked) { if (!l.includes(item)) l.push(item); } else cc.ticks[id] = l.filter(x => x !== item);
    if (!cc.ticks[id].length) delete cc.ticks[id];
    A.addLog('who.c1', cb.checked ? 'e.log.tick' : 'e.log.untick', { item: A.tk('e.ih.' + item + (r.negative && (item === 'larger' || item === 'smaller') ? 'N' : '')), comp: r.component, site: r.site, trial: trialName[r.trial] });
    clRender(body);
  });
  $$('[data-ecv]', body).forEach(b => b.onclick = () => { const [t, ch] = b.dataset.ecv.split('|'); if (A.bx && A.bx.openErp) A.bx.openErp(t, ch); });
  const ok = $('#eClOk', body); if (ok) ok.onclick = () => { const cc = clState(); cc.completed = true; cc.at = A.time(); A.addLog('who.c1', 'e.log.clDone', { n: nTicks(cc) }); A.toast(T('e.toast.cl')); if (A.bx && A.bx.railUp) A.bx.railUp(); clRender(body); };
  const chg = $('#eClChg', body); if (chg) chg.onclick = () => { clState().completed = false; A.addLog('who.c1', 'e.log.clOpen'); if (A.bx && A.bx.railUp) A.bx.railUp(); clRender(body); };
}
/* small curve per row: patient and norm band from -200 to 800 ms, the row's window shaded */
function curves() {
  const E2 = M().erp, tm = E2.times_ms;
  $$('[data-ecr]', CLB).forEach(cv => {
    const r = CL().rows.find(x => x.id === cv.dataset.ecr), d = E2.conditions[r.trial].channels[r.site], W = 150, H = 42, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    let m = 1; d.patient_uv.forEach((v, j) => { m = Math.max(m, Math.abs(v), d.norm_mean_uv ? Math.abs(d.norm_mean_uv[j]) + 2 * d.norm_sd_uv[j] : 0); });
    const X = (ms) => 2 + (ms + 200) / 1000 * (W - 4), Y = (v) => H / 2 - v / m * (H / 2 - 3);
    g.fillStyle = 'rgba(19,94,125,0.12)'; g.fillRect(X(r.window_ms[0]), 1, X(r.window_ms[1]) - X(r.window_ms[0]), H - 2);
    g.strokeStyle = '#c9cbc6'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(2, Y(0)); g.lineTo(W - 2, Y(0)); g.moveTo(X(0), 2); g.lineTo(X(0), H - 2); g.stroke();
    if (d.norm_mean_uv) { g.fillStyle = 'rgba(112,122,132,0.22)'; g.beginPath(); tm.forEach((t, j) => g[j ? 'lineTo' : 'moveTo'](X(t), Y(d.norm_mean_uv[j] + 2 * d.norm_sd_uv[j]))); for (let j = tm.length - 1; j >= 0; j--) g.lineTo(X(tm[j]), Y(d.norm_mean_uv[j] - 2 * d.norm_sd_uv[j])); g.closePath(); g.fill(); }
    g.strokeStyle = '#1c2a36'; g.lineWidth = 1.1; g.beginPath(); tm.forEach((t, j) => g[j ? 'lineTo' : 'moveTo'](X(t), Y(d.patient_uv[j]))); g.stroke();
  });
}
A.addI18n({
  en: { 'e.ih.earlier': 'latency earlier', 'e.ih.later': 'latency later', 'e.ih.larger': 'amplitude larger', 'e.ih.smaller': 'amplitude smaller', 'e.ih.largerN': 'more negative', 'e.ih.smallerN': 'less negative', 'e.ih.shape': 'shape differs' },
  de: { 'e.ih.earlier': 'Latenz früher', 'e.ih.later': 'Latenz später', 'e.ih.larger': 'Amplitude größer', 'e.ih.smaller': 'Amplitude kleiner', 'e.ih.largerN': 'negativer', 'e.ih.smallerN': 'weniger negativ', 'e.ih.shape': 'Form abweichend' },
});
A.ex.fm = (body) => fmRender(body);
A.ex.fmRedraw = () => { if (E.body && E.body.isConnected && $('#eSpec', E.body)) draw(); };
A.ex.cl = (body) => clRender(body);
A.ex.clRedraw = () => { if (CLB && CLB.isConnected) curves(); };

A.css('e-markers', `
.e-tl { border-radius: 0; border-left: 0; border-right: 0; flex-wrap: wrap; }
.e-tl .seg small { font-size: 10.5px; opacity: 0.8; } .e-sp { flex: 1; } .e-help { flex: 1 1 260px; text-align: right; }
.e-grid { display: grid; grid-template-columns: 196px minmax(0, 1fr); gap: 14px; padding: 12px; align-items: start; }
@media (max-width: 760px) { .e-grid { grid-template-columns: minmax(0, 1fr); } .e-help { text-align: left; } }
.e-map { padding: 8px; display: grid; justify-items: center; gap: 6px; } .e-map canvas { cursor: pointer; }
.e-sqk { display: inline-block; width: 9px; height: 9px; border: 2px solid #135e7d; margin-right: 6px; vertical-align: -1px; }
.e-specw { min-width: 0; display: grid; gap: 4px; } .e-h4 { margin: 0; font-size: 13px; } .e-fig { padding: 6px; overflow: hidden; } .e-fig canvas { display: block; touch-action: none; }
#eSpec { cursor: crosshair; outline-offset: 2px; } .e-read { color: var(--muted); min-height: 18px; }
.e-acts { gap: 6px; flex-wrap: wrap; } .e-acts .btn { white-space: normal; text-align: left; }
.e-t td, .e-t th { padding: 5px 10px; } .e-t .chip { font-size: 10.5px; } .e-rmd td { color: var(--muted); text-decoration: line-through; } .e-rmd td:last-child, .e-rmd td .chip { text-decoration: none; }
.e-q { display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; } .e-q select { font-size: 12px; }
.e-leg { padding: 6px 12px 0; } .e-nn { margin: 0 12px 10px; }
.e-foot { padding: 10px 12px 12px; gap: 8px; flex-wrap: wrap; align-items: center; }
.e-clt td, .e-clt th { padding: 4px 8px; } .e-clt th.e-tc { white-space: normal; min-width: 64px; font-size: 11.5px; line-height: 1.25; text-align: center; } .e-clt td.e-tc { text-align: center; }
.e-clt input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; } .e-clt input[disabled] { cursor: default; }
.e-cv { border: 1px solid var(--line); border-radius: 4px; padding: 0; display: block; cursor: pointer; } .e-cv:hover { border-color: var(--accent); } .e-cv canvas { display: block; }
`);
