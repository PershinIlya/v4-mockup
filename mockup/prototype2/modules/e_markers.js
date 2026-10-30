/* Module E: frequency markers per electrode (review B3; table 3.3 "Frequency markers on the spectra",
   Core) and the ERP peak review (table 3.3 "ERP peak values (P1/N1, N2, P3, CNV) against norms, with
   the clinician's review", Core, proposed; repository IU9 working decision), which replaces the retired
   checklist over channel ERPs. Both render inside the Results tab (through APP.ex); the report module
   states the clinician's choices with the fixed sentences built here (FM-*, ERPREV-*), following the
   rules of mockup/textlib.py (freq_marker_sentences, review_rows, review_final, review_sentences).
   Suggested markers come from the data (freq_markers); the review rows from the data (erp_review) and
   the peaks as they stand (APP.peaksNow, so a confirmed peak move updates its proposal). The clinician
   confirms, moves, removes or adds markers and confirms or changes the proposed review ticks; every
   choice is logged with the account that made it. Read only while APP.stageLocked() and for every role
   without the review permission (APP.can('review'): the assistant, company support). */
const A = window.APP, T = A.t;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
A.addI18n({
  en: {
    'e.fmTitle': 'Frequency markers per electrode', 'e.noRes': 'no results',
    'e.mapZ': 'z at {hz} Hz', 'e.mapAbs': 'Absolute power at {hz} Hz', 'e.specT': 'Absolute power · {ch} · {cond}', 'e.win': 'Marker window {a} to {b} Hz',
    'e.noWin': 'No marker window at {ch}', 'e.read': '{ch} · {f} Hz · {p} µV²/Hz · z {z}', 'e.readNN': '{ch} · {f} Hz · {p} µV²/Hz',
    'e.help': 'Click the spectrum to set the cursor · drag a marker line to move it · arrow keys move the selected marker by 0.5 Hz',
    'e.roHelp': 'Click the spectrum to set the cursor · read only for your role',
    'e.addAt': '+ Add marker at {ch} {hz} Hz', 'e.moveTo': 'Move marker {k} to {ch} {hz} Hz', 'e.no': 'No.', 'e.site': 'Electrode', 'e.freq': 'Frequency',
    'e.question': 'Question', 'e.choice': 'Choice', 'e.src.suggested': 'suggested', 'e.src.moved': 'moved', 'e.src.added': 'placed by the clinician', 'e.src.removed': 'removed',
    'e.from': 'suggested {s} {h} Hz', 'e.q.mu': 'Mu rhythm?', 'e.q.beta_spindle': 'Beta spindles?', 'e.ans.none': 'Not answered', 'e.ans.yes': 'Yes', 'e.ans.no': 'No',
    'e.rm': 'Remove', 'e.restore': 'Restore', 'e.reset': 'Reset to suggestions', 'e.confirm': 'Confirm markers · {cond}', 'e.confBy': '✓ Confirmed by {who} · {cond}',
    'e.change': 'Change', 'e.notConf': 'Not confirmed', 'e.pendN': (p) => p.n === 1 ? '1 change pending' : `${p.n} changes pending`, 'e.none': 'No marker suggested',
    'e.noneT': 'Nothing suggested for {cond}. Place a marker if the spectrum shows a peak.', 'e.condMiss': '{cond}: no results, no markers',
    'e.nnNote': 'No age norm: markers are not suggested and cannot be placed.', 'e.locked': 'Read only · {why}', 'e.why.issued': 'the report is issued', 'e.why.rejected': 'the recording is rejected',
    'e.why.role': 'your role cannot review', 'e.roToast': 'Read only: only a clinician can change this',
    'e.lockedConf': 'Confirmed markers are locked; choose Change to edit them.', 'e.sq': 'Square: marker electrode', 'e.sents': 'Fixed sentences', 'e.valScale': 'low to high, this map only',
    'e.toast.conf': 'Frequency markers confirmed · {cond}', 'e.toast.dup': 'A marker already sits at {ch} {hz} Hz', 'e.toast.win': 'Outside the marker window of {ch}',
    'e.log.move': 'Moved frequency marker {k} ({cond}) from {s1} {h1} Hz to {s2} {h2} Hz', 'e.log.add': 'Placed a frequency marker ({cond}) at {s} {h} Hz',
    'e.log.rm': 'Removed the suggested frequency marker at {s} {h} Hz ({cond})', 'e.log.rmAdded': 'Removed the frequency marker placed at {s} {h} Hz ({cond})',
    'e.log.restore': 'Restored the suggested frequency marker at {s} {h} Hz ({cond})', 'e.log.answer': 'Answered "{q}" for frequency marker {k} ({cond}, {s} {h} Hz): {a}',
    'e.log.unanswer': 'Cleared the answer to "{q}" for frequency marker {k} ({cond}, {s} {h} Hz)',
    'e.log.confS': 'Confirmed the suggested frequency markers ({cond}) unchanged', 'e.log.confM': 'Confirmed the frequency markers ({cond}) with {n} changes',
    'e.log.open': 'Reopened the frequency markers ({cond}) for changes', 'e.log.reset': 'Reset the frequency markers ({cond}) to the suggestions',
    'e.log.reopen': '{from} changed after confirmation: reopened the frequency markers per electrode and the ERP peak review',
    'e.rvTitle': 'ERP peak review', 'e.coreProp': 'Core, proposed', 'e.component': 'Component · electrode', 'e.curve': 'Curve',
    'e.rvHelp': 'The system proposes a tick where the peak is clear and its value is marked. Confirm the review, or change ticks first; only you mark an unusual curve shape.',
    'e.clKey': 'Curve: patient, grey band: age norm ± 2 SD, shaded: window, bar: norm latency ± 2 SD, tick: patient peak.',
    'e.rvNN': 'No norm for this age: the ERP peak review is not used.', 'e.clCurveT': 'Open {comp} at {site} in Channel ERPs',
    'e.rvNone': 'no tick', 'e.marked': 'marked', 'e.rvProp': 'proposed by the system', 'e.rvPropS': 'proposed', 'e.rvPropOf': 'proposed: {v}', 'e.rvNoProp': 'nothing proposed', 'e.rvMark': 'Mark', 'e.rvMoved': 'yes · peak moved by the clinician',
    'e.rvNoLat': 'no latency for this row', 'e.rvConfirm': 'Confirm review', 'e.rvConfBy': '✓ Confirmed by {who}', 'e.rvReset': 'Reset to proposals',
    'e.rvCount': (p) => `${p.p === 1 ? '1 tick' : p.p + ' ticks'} proposed · ${p.c === 1 ? '1 row' : p.c + ' rows'} changed`,
    'e.rvPend': (p) => p.n === 1 ? '1 row changed' : `${p.n} rows changed`,
    'e.rv.col.amp': 'amplitude', 'e.rv.col.lat': 'latency',
    'e.rv.v.larger': 'larger', 'e.rv.v.smaller': 'smaller', 'e.rv.v.more_negative': 'more negative', 'e.rv.v.less_negative': 'less negative', 'e.rv.v.longer': 'longer', 'e.rv.v.shorter': 'shorter',
    'e.log.rvSet': 'ERP peak review, {comp} at {site} ({trial}): {col} ticked "{val}"', 'e.log.rvClr': 'ERP peak review, {comp} at {site} ({trial}): {col} left without a tick',
    'e.log.rvShape': 'ERP peak review, {comp} at {site} ({trial}): marked an unusual curve shape', 'e.log.rvShapeRm': 'ERP peak review, {comp} at {site} ({trial}): removed the unusual curve shape mark',
    'e.log.rvConfS': 'Confirmed the ERP peak review as proposed', 'e.log.rvConfM': 'Confirmed the ERP peak review with {n} rows changed',
    'e.log.rvOpen': 'Reopened the ERP peak review for changes', 'e.log.rvReset': 'Reset the ERP peak review to the proposals',
    'e.log.rvPeaks': 'ERP peaks changed after confirmation: reopened the ERP peak review; {n} rows proposed again from the peaks as they stand',
    'e.log.rvPeaksU': 'ERP peaks changed: {n} rows of the ERP peak review proposed again from the peaks as they stand',
    'e.toast.rv': 'ERP peak review confirmed', 'e.lockedRv': 'The confirmed review is locked; choose Change to edit it.',
  },
  de: {
    'e.fmTitle': 'Frequenzmarker je Elektrode', 'e.noRes': 'keine Ergebnisse',
    'e.mapZ': 'z bei {hz} Hz', 'e.mapAbs': 'Absolute Leistung bei {hz} Hz', 'e.specT': 'Absolute Leistung · {ch} · {cond}', 'e.win': 'Markerfenster {a} bis {b} Hz',
    'e.noWin': 'Kein Markerfenster an {ch}', 'e.read': '{ch} · {f} Hz · {p} µV²/Hz · z {z}', 'e.readNN': '{ch} · {f} Hz · {p} µV²/Hz',
    'e.help': 'Spektrum anklicken, um den Cursor zu setzen · Markerlinie ziehen, um sie zu verschieben · die Pfeiltasten verschieben den gewählten Marker um 0,5 Hz',
    'e.roHelp': 'Spektrum anklicken, um den Cursor zu setzen · für Ihre Rolle schreibgeschützt',
    'e.addAt': '+ Marker bei {ch} {hz} Hz setzen', 'e.moveTo': 'Marker {k} auf {ch} {hz} Hz verschieben', 'e.no': 'Nr.', 'e.site': 'Elektrode', 'e.freq': 'Frequenz',
    'e.question': 'Frage', 'e.choice': 'Auswahl', 'e.src.suggested': 'vorgeschlagen', 'e.src.moved': 'verschoben', 'e.src.added': 'von der Untersucherin oder dem Untersucher gesetzt', 'e.src.removed': 'entfernt',
    'e.from': 'Vorschlag {s} {h} Hz', 'e.q.mu': 'My-Rhythmus?', 'e.q.beta_spindle': 'Beta-Spindeln?', 'e.ans.none': 'Nicht beantwortet', 'e.ans.yes': 'Ja', 'e.ans.no': 'Nein',
    'e.rm': 'Entfernen', 'e.restore': 'Wiederherstellen', 'e.reset': 'Auf Vorschläge zurücksetzen', 'e.confirm': 'Marker bestätigen · {cond}', 'e.confBy': '✓ Bestätigt von {who} · {cond}',
    'e.change': 'Ändern', 'e.notConf': 'Nicht bestätigt', 'e.pendN': (p) => p.n === 1 ? '1 Änderung ausstehend' : `${p.n} Änderungen ausstehend`, 'e.none': 'Kein Marker vorgeschlagen',
    'e.noneT': 'Für {cond} nichts vorgeschlagen. Setzen Sie einen Marker, wenn das Spektrum einen Peak zeigt.', 'e.condMiss': '{cond}: keine Ergebnisse, keine Marker',
    'e.nnNote': 'Keine Altersnorm: Marker werden nicht vorgeschlagen und können nicht gesetzt werden.', 'e.locked': 'Schreibgeschützt · {why}', 'e.why.issued': 'der Bericht ist freigegeben', 'e.why.rejected': 'die Aufnahme ist abgelehnt',
    'e.why.role': 'Ihre Rolle kann nicht prüfen', 'e.roToast': 'Schreibgeschützt: Nur Untersucherinnen und Untersucher können dies ändern',
    'e.lockedConf': 'Bestätigte Marker sind gesperrt; zum Bearbeiten „Ändern“ wählen.', 'e.sq': 'Quadrat: Elektrode des Markers', 'e.sents': 'Feste Sätze', 'e.valScale': 'niedrig bis hoch, nur diese Karte',
    'e.toast.conf': 'Frequenzmarker bestätigt · {cond}', 'e.toast.dup': 'Bei {ch} {hz} Hz liegt schon ein Marker', 'e.toast.win': 'Außerhalb des Markerfensters von {ch}',
    'e.log.move': 'Frequenzmarker {k} ({cond}) von {s1} {h1} Hz auf {s2} {h2} Hz verschoben', 'e.log.add': 'Frequenzmarker ({cond}) bei {s} {h} Hz gesetzt',
    'e.log.rm': 'Vorgeschlagenen Frequenzmarker bei {s} {h} Hz ({cond}) entfernt', 'e.log.rmAdded': 'Gesetzten Frequenzmarker bei {s} {h} Hz ({cond}) entfernt',
    'e.log.restore': 'Vorgeschlagenen Frequenzmarker bei {s} {h} Hz ({cond}) wiederhergestellt', 'e.log.answer': '„{q}“ für Frequenzmarker {k} ({cond}, {s} {h} Hz) beantwortet: {a}',
    'e.log.unanswer': 'Antwort auf „{q}“ für Frequenzmarker {k} ({cond}, {s} {h} Hz) gelöscht',
    'e.log.confS': 'Vorgeschlagene Frequenzmarker ({cond}) unverändert bestätigt', 'e.log.confM': 'Frequenzmarker ({cond}) mit {n} Änderungen bestätigt',
    'e.log.open': 'Frequenzmarker ({cond}) für Änderungen wieder geöffnet', 'e.log.reset': 'Frequenzmarker ({cond}) auf die Vorschläge zurückgesetzt',
    'e.log.reopen': '{from} nach der Bestätigung geändert: Frequenzmarker je Elektrode und ERP-Peak-Prüfung wieder geöffnet',
    'e.rvTitle': 'ERP-Peak-Prüfung', 'e.coreProp': 'Kern, vorgeschlagen', 'e.component': 'Komponente · Elektrode', 'e.curve': 'Kurve',
    'e.rvHelp': 'Das System schlägt ein Kreuz vor, wo der Peak eindeutig und sein Wert markiert ist. Bestätigen Sie die Prüfung oder ändern Sie zuerst Kreuze; eine ungewöhnliche Kurvenform markieren nur Sie.',
    'e.clKey': 'Kurve: Patient, graues Band: Altersnorm ± 2 SD, schattiert: Fenster, Balken: Normlatenz ± 2 SD, Strich: Peak des Patienten.',
    'e.rvNN': 'Keine Norm für dieses Alter: Die ERP-Peak-Prüfung wird nicht verwendet.', 'e.clCurveT': '{comp} an {site} in Kanal-ERPs öffnen',
    'e.rvNone': 'kein Kreuz', 'e.marked': 'markiert', 'e.rvProp': 'vom System vorgeschlagen', 'e.rvPropS': 'vorgeschlagen', 'e.rvPropOf': 'Vorschlag: {v}', 'e.rvNoProp': 'nichts vorgeschlagen', 'e.rvMark': 'Markieren', 'e.rvMoved': 'ja · Peak von der Untersucherin oder dem Untersucher verschoben',
    'e.rvNoLat': 'keine Latenz für diese Zeile', 'e.rvConfirm': 'Prüfung bestätigen', 'e.rvConfBy': '✓ Bestätigt von {who}', 'e.rvReset': 'Auf Vorschläge zurücksetzen',
    'e.rvCount': (p) => `${p.p === 1 ? '1 Kreuz' : p.p + ' Kreuze'} vorgeschlagen · ${p.c === 1 ? '1 Zeile' : p.c + ' Zeilen'} geändert`,
    'e.rvPend': (p) => p.n === 1 ? '1 Zeile geändert' : `${p.n} Zeilen geändert`,
    'e.rv.col.amp': 'Amplitude', 'e.rv.col.lat': 'Latenz',
    'e.rv.v.larger': 'größer', 'e.rv.v.smaller': 'kleiner', 'e.rv.v.more_negative': 'negativer', 'e.rv.v.less_negative': 'weniger negativ', 'e.rv.v.longer': 'länger', 'e.rv.v.shorter': 'kürzer',
    'e.log.rvSet': 'ERP-Peak-Prüfung, {comp} an {site} ({trial}): {col} angekreuzt „{val}“', 'e.log.rvClr': 'ERP-Peak-Prüfung, {comp} an {site} ({trial}): {col} ohne Kreuz',
    'e.log.rvShape': 'ERP-Peak-Prüfung, {comp} an {site} ({trial}): ungewöhnliche Kurvenform markiert', 'e.log.rvShapeRm': 'ERP-Peak-Prüfung, {comp} an {site} ({trial}): Markierung der ungewöhnlichen Kurvenform entfernt',
    'e.log.rvConfS': 'ERP-Peak-Prüfung wie vorgeschlagen bestätigt', 'e.log.rvConfM': 'ERP-Peak-Prüfung mit {n} geänderten Zeilen bestätigt',
    'e.log.rvOpen': 'ERP-Peak-Prüfung für Änderungen wieder geöffnet', 'e.log.rvReset': 'ERP-Peak-Prüfung auf die Vorschläge zurückgesetzt',
    'e.log.rvPeaks': 'ERP-Peaks nach der Bestätigung geändert: ERP-Peak-Prüfung wieder geöffnet; {n} Zeilen neu aus den aktuellen Peaks vorgeschlagen',
    'e.log.rvPeaksU': 'ERP-Peaks geändert: {n} Zeilen der ERP-Peak-Prüfung neu aus den aktuellen Peaks vorgeschlagen',
    'e.toast.rv': 'ERP-Peak-Prüfung bestätigt', 'e.lockedRv': 'Die bestätigte Prüfung ist gesperrt; zum Bearbeiten „Ändern“ wählen.',
  },
});

const CONDS = ['EO', 'EC'];
const M = () => A.m2;
const CH = () => A.channels;
const FMD = () => M().freq_markers || {};
const NN = () => !!M().no_norm;
const key = () => A.case.case_code + '|' + M().id;
const locked = () => (A.stageLocked ? A.stageLocked() : '');
/* review permission of the signed-in role (verify blocking 2): without it every control is hidden */
const canRev = () => !A.can || A.can('review');
const whoKey = () => (A.state.staffView ? 'support' : (A.role || 'c1'));
const who = (by) => T('who.' + (by || 'c1'));
const roToast = () => { const k = A.state.staffView ? 'ro.toast' : 'ro.asstToast', d = (A.i18n || {})[A.lang] || {}; A.toast(d[k] ? T(k) : T('e.roToast')); };
const condL = (c, L) => T('condl.' + c, null, L);
const nf = (v, L) => A.nf(v, 1, L);
/* ---------------- fixed sentences (data.json choice_sentences, choice_parts) ---------------- */
const tplOf = (k, L, id) => { const d = A.data[k] || {}; return (d[L] || {})[id] ?? (d.en || {})[id] ?? id; };
const fillT = (t, p) => String(t).replace(/\{(\w+)\}/g, (m, k) => (p && p[k] != null ? p[k] : m));
const part = (L, id, p) => fillT(tplOf('choice_parts', L, id), p);
const say = (L, id, p) => { const t = tplOf('choice_sentences', L, id), x = fillT(t, p); return { id, text: t[0] === '{' ? x.charAt(0).toUpperCase() + x.slice(1) : x }; };
const zState = (L, z, mk) => part(L, 'state_z', { state: part(L, 'state.' + (!mk ? 'not' : z > 0 ? 'above' : 'below')), z: A.nf(z, 1, L) });

/* ---------------- frequency marker state, per case and measurement ----------------
   per condition {confirmed, at, by, moves: {n: {site, hz}}, removed: [n], added: [{id, site, hz}],
   answers: {marker key: {q, a}}}; an answer belongs to its marker (s1, a2), so it moves with the marker
   and counts only while the marker's place still asks that question (verify should-fix 1) */
const blank = () => ({ confirmed: false, at: null, by: null, moves: {}, removed: [], added: [], answers: {}, seq: 0 });
function fmState() { const s = A.state; s.fm = s.fm || {}; const k = key(); if (!s.fm[k]) s.fm[k] = { EO: blank(), EC: blank() }; return s.fm[k]; }
const sugg = (cond) => { const S = (FMD().suggested || {})[cond]; return S === undefined ? null : S; };
const freqs = () => M().spectra.freqs;
const binOf = (hz) => Math.round((hz - freqs()[0]) / 0.5);
const zAt = (cond, site, hz) => { const C = M().spectra.conditions[cond]; if (!C || !C.z) return { z: null, marked: false }; const i = CH().indexOf(site), k = binOf(hz); return { z: C.z[i][k], marked: !!(C.z_marked && C.z_marked[i][k]) }; };
const question = (site, hz) => { const Q = FMD().questions || {}; return Object.keys(Q).find(q => Q[q].sites.includes(site) && Q[q].lo <= hz && hz < Q[q].hi) || null; };
/* the answer of a marker: keyed by marker (current), or by place (an older state) */
const answerOf = (s, r) => { const a = s.answers[r.key]; if (a && typeof a === 'object') return a.q === r.question ? a.a : null;
  const old = s.answers[`${r.cond}|${r.site}|${+r.hz}`]; return typeof old === 'string' ? old : null; };
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
  out.forEach((r, i) => { r.k = i + 1; r.question = question(r.site, r.hz); r.answer = applied && r.question ? answerOf(s, r) : null; });
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
  /* without an age norm no marker is suggested or placed, so the rule sentence about z does not apply (round 1 should-fix 11) */
  if (!NN()) out.push(say(L, 'FM-RULE-1'));
  return out;
}
/* ---------------- ERP peak review (table 3.3 Core, proposed; repository IU9) ----------------
   rows from the definition erp_review (the scored peaks of M5); per row the system's "peak clear"
   (erp.peaks[].clear, mockup rule) and a proposed deviation tick only where the peak is clear and the
   value is marked: amplitude larger or smaller (N1, N2, CNV: more or less negative), latency longer or
   shorter; the unusual curve shape only the clinician marks. A peak moved and confirmed in Channel ERPs
   (APP.peaksNow) counts as clear and its proposal follows its new z and mark. Review state per case and
   measurement: erev {confirmed, at, by, changes: {row id: {amp?, lat?, shape?}}, fp}; a key present in
   a change replaces the proposal (null removes a proposed tick), as report_inputs.erp_review. fp holds
   the peak values the proposal was made from: a later peak change proposes those rows again (their
   changes are dropped) and reopens a confirmed review (mockup assumption, extends M99). */
const RVD = () => A.data.erp_review || { rows: [] };
const RVROWS = () => RVD().rows || [];
const rvApplicable = () => !NN() && RVROWS().length > 0;
const rvHeadOf = (k, L) => { const h = RVD().heads || {}; return (h[L] || {})[k] || (h.en || {})[k] || k; };
const rvValOf = (v, L) => { const h = RVD().value_labels || {}; return (h[L] || {})[v] || (h.en || {})[v] || v; };
const rvLegend = (L) => { const g = RVD().legend || {}; return g[L] || g.en || ''; };
const trialName = { go: 'Go', nogo: 'NoGo', ignore: 'Ignore', novelty: 'Novelty' };
const hasLat = (r) => r.latency != null ? r.latency !== false : r.component !== 'CNV';
/* textlib.review_code: amplitude by the sign of z (negative component: a negative z is more negative), latency longer for z above 0 */
const rvCode = (kind, z, neg) => kind === 'lat' ? (z > 0 ? 'longer' : 'shorter') : neg ? (z < 0 ? 'more_negative' : 'less_negative') : (z > 0 ? 'larger' : 'smaller');
const rvOpts = (r, kind) => kind === 'lat' ? ['longer', 'shorter'] : r.negative ? ['more_negative', 'less_negative'] : ['larger', 'smaller'];
const rvBlank = () => ({ confirmed: false, at: null, by: null, changes: {}, fp: null });
function rvRaw() { const s = A.state; s.erev = s.erev || {}; const k = key(); if (!s.erev[k]) s.erev[k] = rvBlank(); const r = s.erev[k]; if (!r.changes) r.changes = {}; return r; }
const peaksCur = () => (A.peaksNow ? A.peaksNow() : (M().erp.peaks || []));
/* rows as they stand: definition, the peak (as it stands, or from the given list of an issued copy), the proposal and the final ticks */
function rvRows(rv, peaks) {
  rv = rv || rvRaw(); peaks = peaks || peaksCur();
  const nn = NN(), ch = rv.changes || {}, mr = (M().erp_review || {}).rows || [];
  return RVROWS().map(d => {
    const p = peaks.find(x => x.component === d.component && x.condition === d.trial && x.site === d.site) || {}, q = mr.find(x => x.id === d.id) || {};
    const moved = !!p.moved, clear = moved || (p.clear != null ? p.clear !== false : q.clear !== false), lat = hasLat(d);
    const prop = { amp: null, lat: null };
    if (clear && !nn) {
      if (p.amplitude_marked && p.amplitude_z != null) prop.amp = rvCode('amp', p.amplitude_z, d.negative);
      if (lat && p.latency_marked && p.latency_z != null) prop.lat = rvCode('lat', p.latency_z, d.negative);
    }
    const c = ch[d.id] || {}, fin = { amp: 'amp' in c ? c.amp : prop.amp, lat: lat ? ('lat' in c ? c.lat : prop.lat) : null, shape: !!c.shape };
    return { ...d, latency: lat, clear, moved, prominence_snr: p.prominence_snr ?? q.prominence_snr ?? null,
      amplitude_z: p.amplitude_z ?? null, amplitude_marked: !!p.amplitude_marked, latency_z: p.latency_z ?? null, latency_marked: !!p.latency_marked,
      latency_ms: p.latency_ms ?? null, amplitude_uv: p.amplitude_uv ?? null, proposed: prop, final: fin, changed: Object.keys(c).length > 0 };
  });
}
const rvFpOf = (rs) => Object.fromEntries(rs.map(r => [r.id, [r.amplitude_z, r.latency_z, r.amplitude_marked, r.latency_marked, r.clear, r.moved ? r.latency_ms : ''].join('/')]));
/* the review state, kept in step with the peaks: rows whose peak values changed are proposed again */
function rvState() {
  const rv = rvRaw(); if (!rvApplicable()) return rv;
  const now = rvFpOf(rvRows(rv)); if (!rv.fp) { rv.fp = now; return rv; }
  const diff = Object.keys(now).filter(id => rv.fp[id] !== now[id]); rv.fp = now; if (!diff.length) return rv;
  const dropped = diff.filter(id => rv.changes[id]); dropped.forEach(id => { delete rv.changes[id]; });
  if (rv.confirmed) { rv.confirmed = false; A.addLog('who.system', 'e.log.rvPeaks', { n: diff.length }); }
  else if (dropped.length) A.addLog('who.system', 'e.log.rvPeaksU', { n: dropped.length });
  return rv;
}
const rvNChanged = (rv) => Object.keys(rv.changes || {}).filter(k => Object.keys(rv.changes[k] || {}).length).length;
/* ERPREV sentences in the order the PDF prints them (textlib.review_sentences) */
function rvSentences(L, rv, peaks) {
  if (NN()) return [say(L, 'ERPREV-NONORM-1')];
  rv = rv || rvState();
  if (!rv.confirmed) { const n = rvNChanged(rv); return [say(L, n ? 'ERPREV-PEND-1' : 'ERPREV-PEND-0', { n }), say(L, 'ERPREV-RULE-1')]; }
  const out = []; let rest = 0; const rs = rvRows(rv, peaks);
  rs.forEach(r => {
    const f = r.final, slots = { comp: r.component, site: r.site, trial: trialName[r.trial] || r.trial };
    [['amp', 'amplitude_z'], ['lat', 'latency_z']].forEach(([kind, zk]) => {
      const p = r.proposed[kind], v = f[kind], z = r[zk] != null ? A.nf(r[zk], 1, L) : '-';
      if (p && v === p) { out.push(say(L, 'ERPREV-SUG-1', { ...slots, dev: part(L, `rev.${kind}.${p}`), z })); return; }
      if (p) out.push(say(L, 'ERPREV-RM-1', { ...slots, dev: part(L, `rev.${kind}.${p}`), z }));
      if (v) out.push(say(L, 'ERPREV-ADD-1', { ...slots, dev: part(L, `rev.${kind}.${v}`), z }));
    });
    if (f.shape) out.push(say(L, 'ERPREV-SHAPE-1', slots));
    if (!r.clear) out.push(say(L, 'ERPREV-UNCLEAR-1', { ...slots, z: r.amplitude_z != null ? A.nf(r.amplitude_z, 1, L) : '-' }));
    if (!(f.amp || f.lat || f.shape)) rest++;
  });
  out.push(say(L, 'ERPREV-REST-1', { n: rest, total: rs.length }));
  out.push(say(L, 'ERPREV-RULE-1'));
  return out;
}

/* ---------------- shared with the report, the Results rail and the shell's task list ---------------- */
const clone = (o) => JSON.parse(JSON.stringify(o));
const rvSnap = () => { const r = clone(rvState()); r.completed = !!r.confirmed; return r; };
A.ex = Object.assign(A.ex || {}, {
  /* cl: the review under its retired name, kept until every caller reads rv */
  snap: () => { const rv = rvSnap(); return { fm: clone(fmState()), rv, cl: rv }; },
  fmRows: (st, cond) => rows(st || fmState(), cond, !!(st || fmState())[cond].confirmed),
  fmSentences: (L, st, conds) => fmSentences(L || A.lang, st || fmState(), conds),
  fmOpen: () => CONDS.filter(c => needs(fmState(), c)), fmOpenOf: (st) => CONDS.filter(c => needs(st, c)),
  fmConds: () => CONDS.filter(c => sugg(c) != null),
  fmBy: (cond, st) => who(((st || fmState())[cond] || {}).by),
  /* ERP peak review: rows (rv, peaks optional: an issued copy passes its snapshot and APP.peaksNow(sn.peaks)) */
  rvApplicable, rvOpen: () => rvApplicable() && !rvState().confirmed, rvState: () => rvState(),
  rvRows: (rv, peaks) => rvRows(rv || rvState(), peaks), rvSentences: (L, rv, peaks) => rvSentences(L || A.lang, rv, peaks),
  rvHeadOf: (k, L) => rvHeadOf(k, L || A.lang), rvValueOf: (v, L) => rvValOf(v, L || A.lang), rvLegend: (L) => rvLegend(L || A.lang),
  rvBy: (rv) => who((rv || rvState()).by), rvNChanged: (rv) => rvNChanged(rv || rvState()), rvStatus: () => RVD().status || 'core, proposed',
  /* retired checklist names, now the review (shell task list, Results rail, older report code) */
  clApplicable: rvApplicable, clOpen: () => rvApplicable() && !rvState().confirmed,
  clSentences: (L, c) => rvSentences(L || A.lang, c && c.changes ? c : undefined), clBy: (c) => who((c || rvState()).by),
  qPart: (L, q) => part(L, 'q.' + q), aPart: (L, a) => part(L, 'answer.' + a),
});
/* an upstream change (segments, cleaning) reopens these confirmations too, as the shell does for the
   alpha peak marker and the ERP peaks (mockup assumption, M45) */
if (A.reopenAfter && !A.reopenAfter._e) {
  const orig = A.reopenAfter;
  A.reopenAfter = function (from) {
    const items = orig.apply(this, arguments), st = fmState(), rv = rvRaw(); let any = false;
    CONDS.forEach(c => { if (st[c].confirmed) { st[c].confirmed = false; any = true; } });
    if (rv.confirmed) { rv.confirmed = false; any = true; }
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
const ro = () => !!locked() || st().confirmed || !canRev();
const snapHz = (f) => Math.round(f * 2) / 2;
const clampWin = (site, hz) => { const w = winOf(site); return w ? Math.max(w[0], Math.min(w[1], snapHz(hz))) : null; };
const lockMsg = () => { if (!canRev()) return roToast(); A.toast(locked() ? T('e.locked', { why: T('e.why.' + locked()) }) : T('e.lockedConf')); };
const condP = (c) => A.tk('condl.' + (c || E.cond));
const hzP = (v) => ({ $n: v, d: 1 });
function occupied(site, hz, except) { return (rows(fmState(), E.cond) || []).some(r => r.key !== except && r.site === site && r.hz === hz); }
const clock = '<span class="e-clk" aria-hidden="true">◷</span>';
const todo = (txt) => `<span class="chip e-todo">${clock}${esc(txt)}</span>`;

function fmRender(body) {
  sync(); E.body = body;
  const s = st(), S = sugg(E.cond), lk = locked(), cr = canRev();
  const condBtn = (c) => { const miss = sugg(c) == null; return `<button data-ec="${c}" class="${E.cond === c ? 'on' : ''}" ${miss ? `disabled title="${esc(T('e.noRes'))}"` : ''}>${esc(T('cond.' + c))}${miss ? ` <small>· ${esc(T('e.noRes'))}</small>` : ''}${!miss && fmState()[c].confirmed ? ' ✓' : ''}</button>`; };
  const n = nChanges(fmState(), E.cond), need = needs(fmState(), E.cond);
  const stChip = S == null ? '' : s.confirmed ? `<span class="chip ok">${esc(T('e.confBy', { who: who(s.by), cond: T('condl.' + E.cond) }))}</span>` : need ? todo(T('e.notConf') + (n ? ' · ' + T('e.pendN', { n }) : '')) : `<span class="chip">${esc(T('e.none'))}</span>`;
  const help = lk ? T('e.locked', { why: T('e.why.' + lk) }) : cr ? T('e.help') : T('e.roHelp');
  body.innerHTML = `<div class="card e-fm"><div class="hd"><h3>${esc(T('e.fmTitle'))}</h3><span class="row">${A.ann('Table 3.3 Frequency markers on the spectra, Core; 3.4 Clinician in control')}${A.ann('M57: legacy AutoPeak windows, top 3 by positive z without the uncorrected 2 z threshold')}</span></div>
    <div class="toolbar e-tl"><div class="seg" id="eCond">${CONDS.map(condBtn).join('')}</div><span class="sep"></span>${stChip}<span class="e-sp"></span><span class="xs muted e-help">${esc(help)}</span></div>
    ${S == null ? `<div class="empty">${esc(T('e.condMiss', { cond: T('cond.' + E.cond) }))}</div>` : `
    <div class="e-grid"><div class="paper e-map"><canvas id="eMap" data-nav aria-label="${esc(T('e.mapZ', { hz: nf(E.cur) }))}"></canvas><div id="eMapLeg"></div></div>
      <div class="e-specw"><div class="row between"><h4 class="e-h4" id="eSpT"></h4><span class="xs muted" id="eWin"></span></div>
        <div class="paper e-fig"><canvas id="eSpec" data-nav tabindex="0" aria-label="${esc(T('e.specT', { ch: E.ch, cond: T('condl.' + E.cond) }))}"></canvas></div>
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
  /* actions are hidden, not disabled, for a role without the review permission and in a read-only state */
  if (!canRev() || locked() || NN()) { el.innerHTML = ''; return; }
  const sel = selRow(), w = winOf(E.ch), ok = !ro() && w && E.cur != null && E.cur >= w[0] && E.cur <= w[1];
  const canAdd = ok && !occupied(E.ch, E.cur), canMove = ok && sel && (sel.site !== E.ch || sel.hz !== E.cur) && !occupied(E.ch, E.cur, sel.key);
  el.innerHTML = `<button class="btn sm" id="eAdd" ${canAdd ? '' : 'disabled'}>${esc(T('e.addAt', { ch: E.ch, hz: nf(E.cur ?? 10) }))}</button>${sel ? `<button class="btn sm" id="eMove" ${canMove ? '' : 'disabled'}>${esc(T('e.moveTo', { k: sel.k, ch: E.ch, hz: nf(E.cur ?? 10) }))}</button>` : ''}`;
  const ad = $('#eAdd', el); if (ad) ad.onclick = () => add(E.ch, E.cur);
  const mv = $('#eMove', el); if (mv) mv.onclick = () => move(sel.key, E.ch, E.cur);
}
function table() {
  const b = E.body, rs = rows(fmState(), E.cond) || [], s = st(), S = sugg(E.cond) || [], dis = ro() ? 'disabled' : '', cr = canRev() && !locked();
  const rem = S.filter(m => s.removed.includes(m.n));
  const zcell = (r) => r.z == null ? '<td class="num muted">-</td>' : (bx().zc ? bx().zc(r.z, null, '', r.marked) : `<td class="num">${A.nf(r.z, 1)}</td>`);
  const qcell = (r) => !r.question ? '<span class="muted">-</span>' : !cr ? `<span class="e-q"><span>${esc(T('e.q.' + r.question))}</span><b>${esc(T(r.answer ? 'e.ans.' + r.answer : 'e.ans.none'))}</b></span>`
    : `<label class="e-q"><span>${esc(T('e.q.' + r.question))}</span><select data-eq="${r.key}" ${dis}>${[['', 'e.ans.none'], ['yes', 'e.ans.yes'], ['no', 'e.ans.no']].map(([v, l]) => `<option value="${v}" ${(r.answer || '') === v ? 'selected' : ''}>${esc(T(l))}</option>`).join('')}</select></label>`;
  $('#eTab', b).innerHTML = `<table class="tbl e-t"><tr><th class="num">${esc(T('e.no'))}</th><th>${esc(T('e.site'))}</th><th class="num">${esc(T('e.freq'))}</th>${NN() ? '' : '<th class="num">z</th>'}<th>${esc(T('e.question'))}</th><th>${esc(T('e.choice'))}</th>${cr ? '<th></th>' : ''}</tr>
    ${rs.map(r => `<tr class="link ${r.key === E.sel ? 'sel' : ''}" data-ek="${r.key}" tabindex="0"><td class="num"><b>${r.k}</b></td><td class="mono">${r.site}</td><td class="num">${nf(r.hz)} Hz</td>${NN() ? '' : zcell(r)}
      <td>${qcell(r)}</td>
      <td><span class="chip ${r.source === 'suggested' ? 'device' : 'clinician'}">${esc(T('e.src.' + r.source))}</span>${r.source === 'moved' ? `<div class="xs muted">${esc(T('e.from', { s: r.from_site, h: nf(r.from_hz) }))}</div>` : ''}</td>
      ${cr ? `<td class="num"><button class="btn sm ghost" data-erm="${r.key}" ${dis}>${esc(T('e.rm'))}</button></td>` : ''}</tr>`).join('')}
    ${rem.map(m => `<tr class="e-rmd"><td class="num muted">-</td><td class="mono">${m.site}</td><td class="num">${nf(m.hz)} Hz</td>${NN() ? '' : `<td class="num muted">${A.nf(m.z, 1)}</td>`}<td></td><td><span class="chip">${esc(T('e.src.removed'))}</span></td>${cr ? `<td class="num"><button class="btn sm ghost" data-ers="${m.n}" ${dis}>${esc(T('e.restore'))}</button></td>` : ''}</tr>`).join('')}
    ${!rs.length && !rem.length ? `<tr><td colspan="7" class="empty">${esc(NN() ? T('e.none') : T('e.noneT', { cond: T('condl.' + E.cond) }))}</td></tr>` : ''}</table>${NN() || !rs.length || !bx().mkLeg ? '' : `<div class="e-leg">${bx().mkLeg()}</div>`}`;
  $$('#eTab tr[data-ek]', b).forEach(tr => { const go = (e) => { if (e.target.closest('select, button')) return; const r = rowOf(tr.dataset.ek); if (!r) return; E.sel = r.key; E.ch = r.site; E.cur = r.hz; table(); draw(); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter') go(e); }; });
  $$('[data-eq]', b).forEach(se => se.onchange = () => answer(se.dataset.eq, se.value));
  $$('[data-erm]', b).forEach(bt => bt.onclick = () => remove(bt.dataset.erm));
  $$('[data-ers]', b).forEach(bt => bt.onclick = () => restore(+bt.dataset.ers));
}
function foot() {
  const b = E.body, el = $('#eFoot', b); if (!el) return; const s = st(), lk = locked(), n = nChanges(fmState(), E.cond), need = needs(fmState(), E.cond);
  const conf = s.confirmed ? `<span class="chip ok">${esc(T('e.confBy', { who: who(s.by), cond: T('condl.' + E.cond) }))}</span>` : '';
  el.innerHTML = lk ? conf + `<span class="e-sp"></span><span class="xs muted">${esc(T('e.locked', { why: T('e.why.' + lk) }))}</span>`
    : !canRev() ? (conf || (need ? todo(T('e.notConf')) : '')) + `<span class="e-sp"></span><span class="xs muted">${esc(T('e.locked', { why: T('e.why.role') }))}</span>`
    : s.confirmed ? `${conf}<span class="e-sp"></span><button class="btn sm" id="eChg">${esc(T('e.change'))}</button>`
    : `<span class="e-sp"></span>${n ? `<button class="btn sm ghost" id="eReset">${esc(T('e.reset'))}</button>` : ''}${need ? `<button class="btn primary sm" id="eOk">${esc(T('e.confirm', { cond: T('condl.' + E.cond) }))}</button>` : ''}`;
  const ok = $('#eOk', el); if (ok) ok.onclick = () => { if (!guardRole()) return; const s2 = st(); s2.confirmed = true; s2.at = A.time(); s2.by = whoKey(); A.addLog('who.c1', n ? 'e.log.confM' : 'e.log.confS', { cond: condP(), n }); A.toast(T('e.toast.conf', { cond: T('condl.' + E.cond) })); after(); };
  const ch = $('#eChg', el); if (ch) ch.onclick = () => { if (!guardRole() || locked()) return; st().confirmed = false; A.addLog('who.c1', 'e.log.open', { cond: condP() }); after(); };
  const rs = $('#eReset', el); if (rs) rs.onclick = () => { if (!guard()) return; Object.assign(st(), { moves: {}, removed: [], added: [], answers: {} }); A.addLog('who.c1', 'e.log.reset', { cond: condP() }); const r = (rows(fmState(), E.cond) || [])[0]; E.sel = r ? r.key : null; after(); };
}
/* after a change: redraw the tool and the Results rail (its "not confirmed" badges); keyboard focus
   stays on the spectrum, so the arrow keys keep moving the marker (verify should-fix 2) */
function after() {
  const ae = document.activeElement, foc = ae && ae.id === 'eSpec' ? 'eSpec' : (ae && ae.dataset && ae.dataset.ek ? 'ek:' + ae.dataset.ek : null);
  if (A.bx && A.bx.railUp) A.bx.railUp();
  if (E.body && E.body.isConnected) fmRender(E.body);
  if (foc === 'eSpec') { const c = $('#eSpec', E.body); if (c) c.focus({ preventScroll: true }); }
  else if (foc) { const tr = E.body && $(`#eTab tr[data-ek="${foc.slice(3)}"]`, E.body); if (tr) tr.focus({ preventScroll: true }); }
}
function guardRole() { if (!canRev()) { roToast(); return false; } return true; }
function guard() { if (NN()) return false; if (!guardRole()) return false; if (ro()) { lockMsg(); return false; } return true; }
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
  if (!guard()) return; const r = rowOf(k); if (!r) return; const s = st(); delete s.answers[k];
  if (r.source === 'added') { s.added = s.added.filter(x => 'a' + x.id !== k); A.addLog('who.c1', 'e.log.rmAdded', { cond: condP(), s: r.site, h: hzP(r.hz) }); }
  else { delete s.moves[r.n]; s.removed.push(r.n); const o = sugg(E.cond).find(m => m.n === r.n); A.addLog('who.c1', 'e.log.rm', { cond: condP(), s: o.site, h: hzP(o.hz) }); }
  if (E.sel === k) E.sel = null; after();
}
function restore(n) {
  if (!guard()) return; const s = st(); s.removed = s.removed.filter(x => x !== n); const o = sugg(E.cond).find(m => m.n === n);
  A.addLog('who.c1', 'e.log.restore', { cond: condP(), s: o.site, h: hzP(o.hz) }); E.sel = 's' + n; after();
}
function answer(k, v) {
  if (!guard()) { after(); return; } const r = rowOf(k); if (!r || !r.question) return; const s = st();
  delete s.answers[`${r.cond}|${r.site}|${+r.hz}`];
  if (v) s.answers[k] = { q: r.question, a: v }; else delete s.answers[k];
  A.addLog('who.c1', v ? 'e.log.answer' : 'e.log.unanswer', { q: A.tk('e.q.' + r.question), k: r.k, cond: condP(), s: r.site, h: hzP(r.hz), a: v ? A.tk('e.ans.' + v) : '' });
  after();
}
function wire() {
  const b = E.body, cv = $('#eSpec', b), mc = $('#eMap', b);
  mc.onclick = e => { const r = mc.getBoundingClientRect(), c = E.hit && E.hit(e.clientX - r.left, e.clientY - r.top); if (!c) return; E.ch = c; const w = winOf(c); if (w && E.cur != null) E.cur = Math.max(w[0], Math.min(w[1], E.cur)); draw(); };
  const near = (px) => { if (!E.sp) return null; const sel = (rows(fmState(), E.cond) || []).filter(r => r.site === E.ch); let best = null, bd = 7; sel.forEach(r => { const d = Math.abs(E.sp.x(r.hz) - px); if (d < bd) { bd = d; best = r; } }); return best; };
  cv.onpointerdown = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; if (!E.sp || !E.sp.inside(px)) return; const q = near(px);
    if (q) { E.sel = q.key; if (ro() || NN()) { if (!NN() && canRev()) lockMsg(); draw(); table(); return; } E.drag = { key: q.key, hz: q.hz }; cv.setPointerCapture(e.pointerId); table(); draw(); return; }
    E.cur = snapHz(E.sp.fAt(px)); draw(); };
  cv.onpointermove = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; if (!E.sp) return;
    if (E.drag) { const h = clampWin(E.ch, E.sp.fAt(px)); if (h != null && h !== E.drag.hz) { E.drag.hz = h; draw(); } return; }
    if (!E.sp.inside(px)) return; const k = E.sp.near(px); cv.style.cursor = near(px) ? (ro() || NN() ? 'not-allowed' : 'ew-resize') : 'crosshair'; if (k !== E.hov) { E.hov = k; draw(); read(k); } };
  cv.onpointerup = () => { if (!E.drag) return; const d = E.drag; E.drag = null; const r = rowOf(d.key); if (r && d.hz !== r.hz) move(d.key, E.ch, d.hz); else draw(); };
  cv.onpointerleave = () => { if (E.drag) return; E.hov = null; draw(); };
  /* arrow keys: move the selected marker of this electrode (review permission, not locked), else the cursor */
  cv.onkeydown = e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const d = e.key === 'ArrowLeft' ? -0.5 : 0.5, sel = selRow();
    if (sel && sel.site === E.ch && !ro() && !NN()) { const base = E.drag ? E.drag.hz : sel.hz, h = clampWin(E.ch, base + d); if (h != null) { E.drag = { key: sel.key, hz: h }; draw(); } return; }
    const f = freqs(); E.cur = Math.max(f[0], Math.min(f[f.length - 1], (E.cur ?? 10) + d)); draw(); read(binOf(E.cur)); };
  cv.onkeyup = e => { if (!E.drag || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return; const d = E.drag; E.drag = null; move(d.key, E.ch, d.hz); };
}

/* ================================ ERP peak review ================================ */
let RVB = null;
const rvSpec = () => `<span class="chip e-spec">${esc(T('e.coreProp'))}</span>${A.ann('Table 3.3, 30 October: Core, proposed (new; beyond the clinical lead\'s list of 5 October; needs his agreement); repository IU9 working decision: deviation ticks pre-filled from the peak values, confirmed or changed by the clinician')}`;
const zv = (z, mk) => z == null ? '<span class="muted">-</span>' : `<span class="e-zv${mk ? ' mk' : ''}" style="background:${A.zColor(z)};color:${A.zInk(z)}"${mk ? ` title="${esc(T('e.marked'))}"` : ''}>${A.nf(z, 1)}</span>`;
function rvRender(body) {
  RVB = body; const rv = rvState(), lk = locked(), L = A.lang, cr = canRev(), ed = cr && !lk && !rv.confirmed;
  const sents = `<div class="card"><div class="hd"><h3>${esc(T('e.sents'))}</h3></div><div class="bd b-sys">${A.sys(rvSentences(L, rv))}</div></div>`;
  if (!rvApplicable()) { body.innerHTML = `<div class="card"><div class="hd"><h3>${esc(T('e.rvTitle'))}</h3><span class="row">${rvSpec()}</span></div><div class="empty">${esc(T('e.rvNN'))}</div></div>${NN() ? sents : ''}`; return; }
  const rs = rvRows(rv), lab = (v) => esc(rvValOf(v, L));
  /* peak clear: yes or no with the prominence over the residual noise SD; CNV a window mean; a confirmed move counts as clear */
  const clearCell = (r) => r.moved ? `<span class="e-val">${esc(T('e.rvMoved'))}</span>`
    : !r.latency ? `<span class="e-val">${lab('mean')}</span>${r.prominence_snr != null ? ` <span class="xs muted">(${A.nf(r.prominence_snr, 1)})</span>` : ''}`
    : `<span class="e-val ${r.clear ? '' : 'e-unclear'}">${lab(r.clear ? 'clear_yes' : 'clear_no')}</span>${r.prominence_snr != null ? ` <span class="xs muted">(${A.nf(r.prominence_snr, 1)})</span>` : ''}`;
  const aria = (r, kind) => `${r.component} ${r.site} ${trialName[r.trial] || r.trial}: ${rvHeadOf(kind, L)}`;
  /* a tick cell: z on the fixed scale, then the tick; editable: none or one of the two codes, the proposed one outlined */
  const tickCell = (r, kind) => {
    if (kind === 'lat' && !r.latency) return `<td class="e-tc muted e-nolat" title="${esc(T('e.rvNoLat'))}">-</td>`;
    const z = kind === 'amp' ? r.amplitude_z : r.latency_z, mk = kind === 'amp' ? r.amplitude_marked : r.latency_marked, p = r.proposed[kind], v = r.final[kind];
    let ctl;
    if (ed) {
      ctl = `<select class="e-sel${p !== v ? ' e-diff' : ''}" data-erv="${r.id}|${kind}" aria-label="${esc(aria(r, kind))}">${[null, ...rvOpts(r, kind)].map(x => `<option value="${x || ''}" ${v === x ? 'selected' : ''}>${x ? lab(x) : esc(T('e.rvNone'))}${x && x === p ? ' · ' + esc(T('e.rvPropS')) : ''}</option>`).join('')}</select>`
        + (p && v !== p ? `<div class="xs muted">${esc(T('e.rvPropOf', { v: rvValOf(p, L) }))}</div>` : !p && v ? `<div class="xs muted">${lab('added')}</div>` : '');
    } else {
      ctl = v && v === p ? `<span class="chip device">${lab(v)}</span>`
        : v ? `<span class="chip clinician">${lab(v)}</span><div class="xs muted">${p ? esc(T('e.rvPropOf', { v: rvValOf(p, L) })) : lab('added')}</div>`
        : p ? `<span class="e-struck">${lab(p)}</span><div class="xs muted">${lab('removed')}</div>` : '<span class="muted">-</span>';
    }
    return `<td class="e-tc e-tk" data-h="${esc(rvHeadOf(kind, L))}"><div class="e-zt">${zv(z, mk)}<div>${ctl}</div></div></td>`;
  };
  const shapeCell = (r) => ed ? `<td class="e-tc" data-h="${esc(rvHeadOf('shape', L))}"><label class="e-chk"><input type="checkbox" data-ersh="${r.id}" ${r.final.shape ? 'checked' : ''} aria-label="${esc(aria(r, 'shape'))}"><span>${esc(T('e.rvMark'))}</span></label></td>`
    : `<td class="e-tc" data-h="${esc(rvHeadOf('shape', L))}">${r.final.shape ? `<span class="chip clinician">${lab('shape_set')}</span>` : '<span class="muted">-</span>'}</td>`;
  const nProp = rs.reduce((n, r) => n + (r.proposed.amp ? 1 : 0) + (r.proposed.lat ? 1 : 0), 0), nCh = rvNChanged(rv);
  const footAct = lk ? `<span class="xs muted">${esc(T('e.locked', { why: T('e.why.' + lk) }))}</span>` : !cr ? `<span class="xs muted">${esc(T('e.locked', { why: T('e.why.role') }))}</span>`
    : rv.confirmed ? `<button class="btn sm" id="eClChg">${esc(T('e.change'))}</button>` : `${nCh ? `<button class="btn sm ghost" id="eRvReset">${esc(T('e.rvReset'))}</button>` : ''}<button class="btn primary sm" id="eClOk">${esc(T('e.rvConfirm'))}</button>`;
  const stChip = rv.confirmed ? `<span class="chip ok">${esc(T('e.rvConfBy', { who: who(rv.by) }))}</span>` : todo(T('e.notConf') + (nCh ? ' · ' + T('e.rvPend', { n: nCh }) : ''));
  body.innerHTML = `<div class="card e-rv"><div class="hd"><h3>${esc(T('e.rvTitle'))}</h3><span class="row">${rvSpec()}${A.ann('Mockup assumption: peak clear means a local extremum of the expected polarity inside the window, not at its edge, with a prominence of at least 2 times the residual noise SD (in brackets); the CNV is a window mean. A peak moved and confirmed in Channel ERPs counts as clear and its proposal follows its new z and mark')}${A.ann('M33: a tick is proposed only for a marked value (false discovery rate correction, 3.2); MOCK-061 without a norm: not used')}</span></div>
    <div class="toolbar e-tl"><span class="small e-rvh">${esc(T('e.rvHelp'))}</span><span class="e-sp"></span><span class="xs muted">${esc(T('e.clKey'))}</span></div>
    <div class="scroll-x"><table class="tbl e-clt e-rvt"><tr class="e-rvhd"><th>${esc(T('e.component'))}</th><th>${esc(T('e.curve'))}</th><th class="e-tc">${esc(rvHeadOf('clear', L))}</th><th class="e-tc">${esc(rvHeadOf('amp', L))}</th><th class="e-tc">${esc(rvHeadOf('lat', L))}</th><th class="e-tc">${esc(rvHeadOf('shape', L))}</th></tr>
      ${rs.map(r => `<tr class="${r.changed ? 'e-chg' : ''}"><td class="e-cc"><b>${r.component}</b> <span class="mono">${r.site}</span><div class="xs muted">${trialName[r.trial] || r.trial} · ${r.window_ms[0]} ${esc(T('to'))} ${r.window_ms[1]} ms</div></td>
        <td><button class="e-cv paper" data-nav data-ecv="${r.trial}|${r.site}" title="${esc(T('e.clCurveT', { comp: r.component, site: r.site }))}" aria-label="${esc(T('e.clCurveT', { comp: r.component, site: r.site }))}"><canvas data-ecr="${r.id}"></canvas></button></td>
        <td class="e-tc" data-h="${esc(rvHeadOf('clear', L))}">${clearCell(r)}</td>${tickCell(r, 'amp')}${tickCell(r, 'lat')}${shapeCell(r)}</tr>`).join('')}</table></div>
    <div class="xs muted e-rvleg">${esc(rvLegend(L))}</div>
    <div class="row e-foot">${stChip}<span class="xs muted">${esc(T('e.rvCount', { p: nProp, c: nCh }))}</span><span class="e-sp"></span>${footAct}</div></div>${sents}`;
  curves();
  const lbl = (r) => ({ comp: r.component, site: r.site, trial: trialName[r.trial] || r.trial });
  const editable = () => { if (!guardRole()) return false; if (locked() || rvState().confirmed) { A.toast(locked() ? T('e.locked', { why: T('e.why.' + locked()) }) : T('e.lockedRv')); return false; } return true; };
  const tidy = (cc, id) => { if (cc.changes[id] && !Object.keys(cc.changes[id]).length) delete cc.changes[id]; };
  $$('[data-erv]', body).forEach(se => se.onchange = () => {
    if (!editable()) return rvRender(body);
    const q = se.dataset.erv.split('|'), val = se.value, kind = q.pop(), id = q.join('|'), cc = rvState(), r = rvRows(cc).find(x => x.id === id); if (!r) return;
    const v = val || null; if (r.final[kind] === v) return;
    const c = cc.changes[id] = cc.changes[id] || {};
    if (v === r.proposed[kind]) delete c[kind]; else c[kind] = v;
    tidy(cc, id);
    A.addLog('who.c1', v ? 'e.log.rvSet' : 'e.log.rvClr', { ...lbl(r), col: A.tk('e.rv.col.' + kind), val: v ? A.tk('e.rv.v.' + v) : '' });
    if (A.bx && A.bx.railUp) A.bx.railUp();
    rvRender(body); const again = $(`[data-erv="${id}|${kind}"]`, body); if (again) again.focus({ preventScroll: true });
  });
  $$('[data-ersh]', body).forEach(bt => bt.onchange = () => {
    if (!editable()) return rvRender(body);
    const id = bt.dataset.ersh, cc = rvState(), r = rvRows(cc).find(x => x.id === id); if (!r) return;
    const c = cc.changes[id] = cc.changes[id] || {}, on = !c.shape; if (on) c.shape = true; else delete c.shape;
    tidy(cc, id); A.addLog('who.c1', on ? 'e.log.rvShape' : 'e.log.rvShapeRm', lbl(r));
    if (A.bx && A.bx.railUp) A.bx.railUp();
    rvRender(body); const again = $(`[data-ersh="${id}"]`, body); if (again) again.focus({ preventScroll: true });
  });
  $$('[data-ecv]', body).forEach(b => b.onclick = () => { const [t, ch] = b.dataset.ecv.split('|'); if (A.bx && A.bx.openErp) A.bx.openErp(t, ch); });
  const ok = $('#eClOk', body); if (ok) ok.onclick = () => { if (!editable()) return; const cc = rvState(), n = rvNChanged(cc); cc.confirmed = true; cc.at = A.time(); cc.by = whoKey();
    A.addLog('who.c1', n ? 'e.log.rvConfM' : 'e.log.rvConfS', { n }); A.toast(T('e.toast.rv')); if (A.bx && A.bx.railUp) A.bx.railUp(); rvRender(body); };
  const chg = $('#eClChg', body); if (chg) chg.onclick = () => { if (!guardRole() || locked()) return; rvState().confirmed = false; A.addLog('who.c1', 'e.log.rvOpen'); if (A.bx && A.bx.railUp) A.bx.railUp(); rvRender(body); };
  const rsb = $('#eRvReset', body); if (rsb) rsb.onclick = () => { if (!editable()) return; rvState().changes = {}; A.addLog('who.c1', 'e.log.rvReset'); if (A.bx && A.bx.railUp) A.bx.railUp(); rvRender(body); };
}
/* small curve per row: patient and norm band from -200 to 800 ms, the row's window shaded; below it the
   norm latency of the scored peak plus or minus 2 SD as a bar and the patient's peak latency (as it stands) as a tick */
function curves() {
  const E2 = M().erp, tm = E2.times_ms, peaks = peaksCur();
  $$('[data-ecr]', RVB).forEach(cv => {
    const r = RVROWS().find(x => x.id === cv.dataset.ecr); if (!r) return;
    const d = E2.conditions[r.trial].channels[r.site], W = 150, H = 46, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    let m = 1; d.patient_uv.forEach((v, j) => { m = Math.max(m, Math.abs(v), d.norm_mean_uv ? Math.abs(d.norm_mean_uv[j]) + 2 * d.norm_sd_uv[j] : 0); });
    const HC = H - 6, X = (ms) => 2 + (ms + 200) / 1000 * (W - 4), Y = (v) => HC / 2 - v / m * (HC / 2 - 3);
    g.fillStyle = 'rgba(19,94,125,0.12)'; g.fillRect(X(r.window_ms[0]), 1, X(r.window_ms[1]) - X(r.window_ms[0]), HC - 2);
    g.strokeStyle = '#c9cbc6'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(2, Y(0)); g.lineTo(W - 2, Y(0)); g.moveTo(X(0), 2); g.lineTo(X(0), HC - 2); g.stroke();
    if (d.norm_mean_uv) { g.fillStyle = 'rgba(112,122,132,0.22)'; g.beginPath(); tm.forEach((t, j) => g[j ? 'lineTo' : 'moveTo'](X(t), Y(d.norm_mean_uv[j] + 2 * d.norm_sd_uv[j]))); for (let j = tm.length - 1; j >= 0; j--) g.lineTo(X(tm[j]), Y(d.norm_mean_uv[j] - 2 * d.norm_sd_uv[j])); g.closePath(); g.fill(); }
    g.strokeStyle = '#1c2a36'; g.lineWidth = 1.1; g.beginPath(); tm.forEach((t, j) => g[j ? 'lineTo' : 'moveTo'](X(t), Y(d.patient_uv[j]))); g.stroke();
    const p = hasLat(r) && peaks.find(x => x.component === r.component && x.condition === r.trial && x.site === r.site);
    if (p && p.latency_ms != null) {
      if (p.norm_latency_ms != null) { const sd = p.norm_latency_sd ?? (2 + 0.05 * p.norm_latency_ms); g.fillStyle = 'rgba(112,122,132,0.45)'; g.fillRect(X(p.norm_latency_ms - 2 * sd), H - 4, X(p.norm_latency_ms + 2 * sd) - X(p.norm_latency_ms - 2 * sd), 3); }
      g.fillStyle = '#1c2a36'; g.fillRect(Math.round(X(p.latency_ms)) - 0.75, H - 6, 1.5, 6);
    }
  });
}
A.ex.fm = (body) => fmRender(body);
A.ex.fmRedraw = () => { if (E.body && E.body.isConnected && $('#eSpec', E.body)) draw(); };
A.ex.rv = (body) => rvRender(body);
A.ex.rvRedraw = () => { if (RVB && RVB.isConnected) curves(); };
/* retired names (Results section "checklist" of module B) */
A.ex.cl = A.ex.rv; A.ex.clRedraw = A.ex.rvRedraw;

A.css('e-markers', `
.e-tl { border-radius: 0; border-left: 0; border-right: 0; flex-wrap: wrap; }
.e-tl .seg small { font-size: 11px; opacity: 0.8; } .e-sp { flex: 1; } .e-help { flex: 1 1 260px; text-align: right; }
.e-spec { background: transparent; border: 1px dashed var(--line-2); color: var(--ink-2); }
.e-todo { background: transparent; border: 1px solid var(--amber); color: var(--ink); } .e-clk { color: var(--amber); margin-right: 4px; font-size: 12px; line-height: 1; }
.e-grid { display: grid; grid-template-columns: 196px minmax(0, 1fr); gap: 14px; padding: 12px; align-items: start; }
@media (max-width: 760px) { .e-grid { grid-template-columns: minmax(0, 1fr); } .e-help { text-align: left; } }
.e-map { padding: 8px; display: grid; justify-items: center; gap: 6px; } .e-map canvas { cursor: pointer; }
.e-sqk { display: inline-block; width: 9px; height: 9px; border: 2px solid #135e7d; margin-right: 6px; vertical-align: -1px; }
.e-specw { min-width: 0; display: grid; gap: 4px; } .e-h4 { margin: 0; font-size: 13px; } .e-fig { padding: 6px; overflow: hidden; } .e-fig canvas { display: block; touch-action: none; }
#eSpec { cursor: crosshair; outline-offset: 2px; } .e-read { color: var(--muted); min-height: 18px; }
.e-acts { gap: 6px; flex-wrap: wrap; } .e-acts .btn { white-space: normal; text-align: left; }
.e-t td, .e-t th { padding: 5px 10px; } .e-t .chip { font-size: 11px; } .e-rmd td { color: var(--muted); text-decoration: line-through; } .e-rmd td:last-child, .e-rmd td .chip { text-decoration: none; }
.e-q { display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; } .e-q select { font-size: 12px; }
.e-leg { padding: 6px 12px 0; } .e-nn { margin: 0 12px 10px; }
.e-foot { padding: 10px 12px 12px; gap: 8px; flex-wrap: wrap; align-items: center; }
.e-clt td, .e-clt th { padding: 4px 8px; vertical-align: middle; } .e-clt th.e-tc { white-space: normal; min-width: 76px; font-size: 11.5px; line-height: 1.25; text-align: center; } .e-clt td.e-tc { text-align: center; }
.e-val { font-size: 12px; font-weight: 600; } .e-unclear { color: var(--ink); text-decoration: underline dotted; }
.e-cc { white-space: nowrap; }
.e-sel { font: inherit; font-size: 12px; padding: 2px 4px; border: 1px solid var(--line-2); border-radius: 5px; background: var(--surface); color: var(--ink); max-width: 210px; }
.e-sel.e-diff { border-color: var(--amber); box-shadow: inset 0 0 0 1px var(--amber); }
.e-chk { display: inline-flex; gap: 5px; align-items: center; font-size: 12px; cursor: pointer; white-space: nowrap; }
.e-zt { display: flex; gap: 8px; align-items: center; justify-content: flex-start; text-align: left; }
.e-zv { display: inline-block; min-width: 34px; padding: 1px 5px; border-radius: 4px; font-size: 12px; font-variant-numeric: tabular-nums; text-align: center; }
.e-zv.mk { box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px #1f1f1e; }
.e-struck { text-decoration: line-through; color: var(--muted); font-size: 12px; } .e-chg td:first-child { box-shadow: inset 3px 0 0 var(--amber); }
@media (max-width: 760px) {
  .e-rvt, .e-rvt tbody { display: block; } .e-rvt tr.e-rvhd { display: none; }
  .e-rvt tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; padding: 8px 10px; border-bottom: 1px solid var(--line); }
  .tbl.e-rvt td { display: block; border: 0; padding: 0; text-align: left; } .tbl.e-rvt td.e-nolat { display: none; }
  .tbl.e-rvt td[data-h] { grid-column: 1 / -1; display: flex; gap: 8px; align-items: center; }
  .tbl.e-rvt td[data-h]::before { content: attr(data-h); flex: 0 0 92px; font-size: 11.5px; line-height: 1.25; color: var(--muted); text-align: left; }
  .e-rvt .e-zt { flex-wrap: wrap; min-width: 0; } .e-rvt .e-sel { max-width: 180px; }
}
.e-rvleg { padding: 8px 12px 0; max-width: 980px; line-height: 1.45; } .e-rvh { flex: 1 1 320px; }
.e-cv { border: 1px solid var(--line); border-radius: 4px; padding: 0; display: block; cursor: pointer; } .e-cv:hover { border-color: var(--accent); } .e-cv canvas { display: block; }
`);
