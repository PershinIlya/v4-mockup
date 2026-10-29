/* Module F (agent J1): the V3 template mapping page (review D2, route "mapping").
   One pseudonymised legacy template (data.json legacy_map, built from coverage/models/T06.json) next to
   the V4 core report of the same clinic (CT-C): every element of the legacy template is coloured by its
   status and points to the V4 block that takes it, or says why nothing does. The element descriptions
   and section names are the model's neutral English paraphrases, never legacy template text; they name
   legacy functions outside the core as scope labels, so they appear only here, as analysis text. */
const A = window.APP, T = A.t, esc = A.esc;
const q1 = (s, el = document) => el.querySelector(s), qa = (s, el = document) => [...el.querySelectorAll(s)];
A.addI18n({
  en: {
    'f.title': 'V3 template mapping', 'f.crumb': 'Report templates', 'f.model': 'pseudonymised model',
    'f.sub': '{clinic} · {lang} · {n} elements · about {rpy} reports a year · next to the V4 core report CT-C',
    'f.lang.EN': 'English', 'f.lang.DE': 'German', 'f.lang.JA': 'Japanese',
    'f.about': 'About this template (model summary, English)', 'f.all': 'All', 'f.filter': 'Status', 'f.search': 'Filter elements', 'f.shown': '{n} of {m} shown',
    'f.left': 'V3 template {t}', 'f.leftS': "{clinic} · elements in document order · the model's neutral paraphrases, in English", 'f.right': 'V4 core report CT-C', 'f.rightS': 'Blocks that take the elements',
    'f.g.device': 'Device blocks (results made by the system, locked)', 'f.g.clinician': 'Clinician blocks', 'f.g.clinic': 'Clinic layout and texts', 'f.g.none': 'Not carried into V4',
    'f.kind.device': 'device', 'f.kind.clinician': 'clinician', 'f.kind.clinic': 'clinic', 'f.kind.option': 'option',
    'f.none': 'not in T06', 'f.noneT': 'No element of this template maps to this block',
    'f.to': 'In V4', 'f.toNone': 'Not carried over', 'f.why': 'Why', 'f.gap': 'Template gap', 'f.row': 'Row of table 3.3', 'f.sugg': 'Model suggestion (English)', 'f.class': 'Class',
    'f.selEl': 'Element {id}', 'f.selBlk': '{n} elements of T06 go here', 'f.clear': 'Clear selection', 'f.hint': 'Click an element or a block to see where it goes.',
    'f.bar': 'Share of the {n} elements by status',
    'f.s.core': 'core', 'f.s.coreTc': 'core, to confirm', 'f.s.clinic': 'clinic', 'f.s.clinician': 'clinician', 'f.s.gap': 'schema gap', 'f.s.leftout': 'left out',
    'f.s.later': 'later module', 'f.s.research': 'research only', 'f.s.dropped': 'dropped', 'f.s.open': 'open',
    'f.d.core': 'a device block of the V4 core', 'f.d.coreTc': 'a core function still to be confirmed (table 3.3)', 'f.d.clinic': "the clinic's own neutral content, set up in its template",
    'f.d.clinician': 'written by the clinician in the V4 report editor', 'f.d.gap': 'the template needs something the V4 template model lacks; the mockup answer is shown',
    'f.d.leftout': 'not carried over; the reason is given per element', 'f.d.later': 'outside the core, a later validated module', 'f.d.research': 'offered only within studies',
    'f.d.dropped': 'not in V4', 'f.d.open': 'decision open',
    'f.b.versions': 'Software and norms', 'f.b.summary': 'Summary', 'f.b.quality': 'Signal quality and processing', 'f.b.raw.excerpt': 'Raw EEG excerpt',
    'f.b.spectra.maps': 'Spectra and maps', 'f.b.spectra.maps1hz': 'Maps per 1 Hz band', 'f.b.spectra.grid': 'Absolute spectra per electrode', 'f.b.freq.markers': 'Frequency markers',
    'f.b.ratios': 'Band ratios and indices', 'f.b.asymmetry': 'Asymmetry', 'f.b.coherence': 'Coherence', 'f.b.erp.channel': 'Event-related potentials at the electrodes (channel ERPs)',
    'f.b.erp.checklist': 'Checklist over channel ERPs', 'f.b.vcpt.behaviour': 'VCPT task performance', 'f.b.comparison': 'Comparison of measurements', 'f.b.limits': 'Notes on the results',
    'f.b.method': 'Method and norms', 'f.b.issued': 'Issued by',
    'f.b.clinician text': 'Clinician text: anamnesis, comments, interpretation, conclusion', 'f.b.clinician form': 'Clinician form (in the Clinic B sample)',
    'f.b.theme: running header and footer': 'Running header and footer', 'f.b.clinic header with placeholders': 'Clinic header with placeholders',
    'f.b.clinic image (placeholder)': 'Clinic image (placeholder)', 'f.b.clinic text': 'Clinic text', 'f.b.table of contents': 'Table of contents (template option, Clinic B sample)',
    'f.empty': 'No element with this status.',
  },
  de: {
    'f.title': 'Abgleich der V3-Vorlage', 'f.crumb': 'Berichtsvorlagen', 'f.model': 'pseudonymisiertes Modell',
    'f.sub': '{clinic} · {lang} · {n} Elemente · etwa {rpy} Berichte im Jahr · neben dem V4-Kernbericht CT-C',
    'f.lang.EN': 'Englisch', 'f.lang.DE': 'Deutsch', 'f.lang.JA': 'Japanisch',
    'f.about': 'Über diese Vorlage (Zusammenfassung des Modells, Englisch)', 'f.all': 'Alle', 'f.filter': 'Status', 'f.search': 'Elemente filtern', 'f.shown': '{n} von {m} angezeigt',
    'f.left': 'V3-Vorlage {t}', 'f.leftS': '{clinic} · Elemente in der Reihenfolge des Dokuments · neutrale Umschreibungen des Modells, auf Englisch', 'f.right': 'V4-Kernbericht CT-C', 'f.rightS': 'Blöcke, die die Elemente aufnehmen',
    'f.g.device': 'Geräteblöcke (vom System erzeugte Ergebnisse, gesperrt)', 'f.g.clinician': 'Blöcke der Klinikerin oder des Klinikers', 'f.g.clinic': 'Layout und Texte der Klinik', 'f.g.none': 'Nicht in V4 übernommen',
    'f.kind.device': 'Gerät', 'f.kind.clinician': 'Kliniker', 'f.kind.clinic': 'Klinik', 'f.kind.option': 'Option',
    'f.none': 'nicht in T06', 'f.noneT': 'Kein Element dieser Vorlage gehört zu diesem Block',
    'f.to': 'In V4', 'f.toNone': 'Nicht übernommen', 'f.why': 'Grund', 'f.gap': 'Vorlagenlücke', 'f.row': 'Zeile der Tabelle 3.3', 'f.sugg': 'Vorschlag des Modells (Englisch)', 'f.class': 'Klasse',
    'f.selEl': 'Element {id}', 'f.selBlk': '{n} Elemente von T06 gehören hierher', 'f.clear': 'Auswahl aufheben', 'f.hint': 'Klicken Sie auf ein Element oder einen Block, um die Zuordnung zu sehen.',
    'f.bar': 'Anteil der {n} Elemente nach Status',
    'f.s.core': 'Kern', 'f.s.coreTc': 'Kern, zu bestätigen', 'f.s.clinic': 'Klinik', 'f.s.clinician': 'Kliniker', 'f.s.gap': 'Schemalücke', 'f.s.leftout': 'entfällt',
    'f.s.later': 'späteres Modul', 'f.s.research': 'nur Forschung', 'f.s.dropped': 'gestrichen', 'f.s.open': 'offen',
    'f.d.core': 'ein Geräteblock des V4-Kerns', 'f.d.coreTc': 'eine Kernfunktion, noch zu bestätigen (Tabelle 3.3)', 'f.d.clinic': 'eigener neutraler Inhalt der Klinik, in ihrer Vorlage eingerichtet',
    'f.d.clinician': 'von der Klinikerin oder dem Kliniker im V4-Berichtseditor geschrieben', 'f.d.gap': 'die Vorlage braucht etwas, das dem V4-Vorlagenmodell fehlt; die Antwort des Mockups ist angegeben',
    'f.d.leftout': 'nicht übernommen; der Grund steht beim Element', 'f.d.later': 'außerhalb des Kerns, ein späteres validiertes Modul', 'f.d.research': 'nur im Rahmen von Studien angeboten',
    'f.d.dropped': 'nicht in V4', 'f.d.open': 'Entscheidung offen',
    'f.b.versions': 'Software und Normen', 'f.b.summary': 'Zusammenfassung', 'f.b.quality': 'Signalqualität und Verarbeitung', 'f.b.raw.excerpt': 'Roh-EEG-Ausschnitt',
    'f.b.spectra.maps': 'Spektren und Karten', 'f.b.spectra.maps1hz': 'Karten je 1-Hz-Band', 'f.b.spectra.grid': 'Absolute Spektren je Elektrode', 'f.b.freq.markers': 'Frequenzmarker',
    'f.b.ratios': 'Bandquotienten und Indizes', 'f.b.asymmetry': 'Asymmetrie', 'f.b.coherence': 'Kohärenz', 'f.b.erp.channel': 'Ereigniskorrelierte Potenziale an den Elektroden (Kanal-ERPs)',
    'f.b.erp.checklist': 'Checkliste über die Kanal-ERPs', 'f.b.vcpt.behaviour': 'VCPT-Aufgabenleistung', 'f.b.comparison': 'Vergleich der Messungen', 'f.b.limits': 'Hinweise zu den Ergebnissen',
    'f.b.method': 'Methode und Normen', 'f.b.issued': 'Freigabe',
    'f.b.clinician text': 'Text der Klinikerin oder des Klinikers: Anamnese, Kommentare, Interpretation, Schlussfolgerung', 'f.b.clinician form': 'Formular der Klinikerin oder des Klinikers (im Beispiel von Klinik B)',
    'f.b.theme: running header and footer': 'Laufende Kopf- und Fußzeile', 'f.b.clinic header with placeholders': 'Klinikkopf mit Platzhaltern',
    'f.b.clinic image (placeholder)': 'Klinikbild (Platzhalter)', 'f.b.clinic text': 'Kliniktext', 'f.b.table of contents': 'Inhaltsverzeichnis (Vorlagenoption, Beispiel Klinik B)',
    'f.empty': 'Kein Element mit diesem Status.',
  },
});
/* status of the model -> key, in the order of the legend (into V4 first, then not carried over) */
const ST = [['core', 'core'], ['core, to confirm', 'coreTc'], ['clinic', 'clinic'], ['clinician', 'clinician'], ['schema gap', 'gap'],
  ['left out', 'leftout'], ['later module', 'later'], ['research only', 'research'], ['dropped', 'dropped'], ['open', 'open']];
const SK = Object.fromEntries(ST);
/* the blocks of the V4 core report of Clinic C (CT-C, as in mockup/clinic_templates/clinic_c_en.json), grouped */
const GROUPS = [
  ['device', ['versions', 'summary', 'quality', 'raw.excerpt', 'spectra.maps', 'spectra.maps1hz', 'spectra.grid', 'freq.markers', 'ratios', 'asymmetry', 'coherence', 'erp.channel', 'erp.checklist', 'vcpt.behaviour', 'comparison', 'limits', 'method', 'issued']],
  ['clinician', ['clinician text', 'clinician form']],
  ['clinic', ['theme: running header and footer', 'clinic header with placeholders', 'clinic image (placeholder)', 'clinic text', 'table of contents']],
];
const KIND = (blk, g) => blk === 'table of contents' ? 'option' : g;
const S = { status: null, q: '', sel: null };
A.css('f-map', `
.f-page { display: grid; gap: 16px; }
:root { --f-core: #dcf1e4; --f-core-i: #165c3c; --f-core-b: #2e9a63; --f-clinic-b: #c46a2b; --f-clin-b: #86ad16; --f-gap: #fcefd2; --f-gap-i: #744a00; --f-gap-b: #d39a1c;
  --f-later: #ebe5fb; --f-later-i: #4a3494; --f-later-b: #7c5fd6; --f-res: #f5e3f2; --f-res-i: #7a296c; --f-res-b: #b54aa3; --f-out: #eceef1; --f-out-i: #4d5562; --f-out-b: #8a93a1;
  --f-drop: #e2e2e2; --f-drop-i: #2f2f2f; --f-drop-b: #4a4a4a; --f-open: #fff3c2; --f-open-i: #645200; --f-open-b: #c9a900; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --f-core: #173528; --f-core-i: #8fdcb2; --f-gap: #352a12; --f-gap-i: #f1c36d; --f-later: #251f3d; --f-later-i: #c4b5f5;
  --f-res: #33192f; --f-res-i: #eab0e0; --f-out: #22272f; --f-out-i: #b5bcc7; --f-drop: #2a2a2a; --f-drop-i: #d6d6d6; --f-drop-b: #9a9a9a; --f-open: #332d10; --f-open-i: #ecd76a; } }
:root[data-theme="dark"] { --f-core: #173528; --f-core-i: #8fdcb2; --f-gap: #352a12; --f-gap-i: #f1c36d; --f-later: #251f3d; --f-later-i: #c4b5f5;
  --f-res: #33192f; --f-res-i: #eab0e0; --f-out: #22272f; --f-out-i: #b5bcc7; --f-drop: #2a2a2a; --f-drop-i: #d6d6d6; --f-drop-b: #9a9a9a; --f-open: #332d10; --f-open-i: #ecd76a; }
.f-st { border: 1px solid transparent; }
.f-st.core { background: var(--f-core); color: var(--f-core-i); --b: var(--f-core-b); }
.f-st.coreTc { background: transparent; color: var(--f-core-i); border: 1px dashed var(--f-core-b); --b: var(--f-core-b); }
.f-st.clinic { background: var(--clinic); color: var(--clinic-ink); --b: var(--f-clinic-b); }
.f-st.clinician { background: var(--clinician); color: var(--clinician-ink); --b: var(--f-clin-b); }
.f-st.gap { background: var(--f-gap); color: var(--f-gap-i); --b: var(--f-gap-b); }
.f-st.leftout { background: var(--f-out); color: var(--f-out-i); --b: var(--f-out-b); }
.f-st.later { background: var(--f-later); color: var(--f-later-i); --b: var(--f-later-b); }
.f-st.research { background: var(--f-res); color: var(--f-res-i); --b: var(--f-res-b); }
.f-st.dropped { background: var(--f-drop); color: var(--f-drop-i); --b: var(--f-drop-b); text-decoration: line-through; }
.f-st.open { background: repeating-linear-gradient(135deg, var(--f-open) 0 6px, transparent 6px 10px); color: var(--f-open-i); border: 1px solid var(--f-open-b); --b: var(--f-open-b); }
.f-bar { display: flex; height: 14px; border-radius: 4px; overflow: hidden; border: 1px solid var(--line); }
.f-bar span.f-st { display: block; height: 100%; background: var(--b); border: 0; border-radius: 0; cursor: pointer; text-decoration: none; }
.f-bar span.f-st.coreTc { background: repeating-linear-gradient(135deg, var(--f-core-b) 0 4px, transparent 4px 7px); }
.f-bar span.f-st.open { background: repeating-linear-gradient(135deg, var(--f-open-b) 0 4px, transparent 4px 7px); }
.f-bar span.f-st + span.f-st { box-shadow: inset 1px 0 0 var(--surface); }
.f-bar span.dim { opacity: 0.25; }
.f-legend { display: flex; flex-wrap: wrap; gap: 6px; }
.f-legend button { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; padding: 3px 9px; border-radius: 99px; }
.f-legend button.on { outline: 2px solid var(--accent); outline-offset: 1px; } .f-legend button b { font-family: var(--f-mono); font-weight: 500; }
.f-legend button.dim { opacity: 0.45; }
.f-cols { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.f-scroll { max-height: calc(100vh - 230px); min-height: 360px; overflow: auto; overscroll-behavior: contain; }
.f-sec { padding: 8px 14px 4px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); position: sticky; top: 0; background: var(--surface); z-index: 1; border-bottom: 1px solid var(--line); }
.f-el { display: grid; grid-template-columns: 4px 38px minmax(0, 1fr); gap: 2px 10px; width: 100%; text-align: left; border-bottom: 1px solid var(--line); padding: 8px 14px 8px 0; font-size: 13px; color: var(--ink); cursor: pointer; }
.f-el:hover { background: var(--surface-2); } .f-el.hl { background: var(--accent-soft); } .f-el.sel { background: var(--accent-soft); box-shadow: inset 0 0 0 2px var(--accent); }
.f-el .bar { grid-row: 1 / span 3; background: var(--b); border-radius: 0 3px 3px 0; }
.f-el .bar.coreTc, .f-el .bar.open { background: repeating-linear-gradient(180deg, var(--b) 0 5px, transparent 5px 8px); }
.f-el .id { grid-row: 1 / span 2; font-family: var(--f-mono); font-size: 11.5px; color: var(--muted); padding-top: 1px; }
.f-el .what { overflow-wrap: anywhere; } .f-el .meta { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; font-size: 12px; color: var(--ink-2); }
.f-el .det { grid-column: 3; display: grid; gap: 4px; font-size: 12.5px; padding: 6px 0 2px; } .f-el .det dt { color: var(--muted); font-size: 11.5px; } .f-el .det dd { margin: 0 0 2px; }
.f-blk { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; align-items: center; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--line); background: none; padding: 8px 14px; font-size: 13px; color: var(--ink); }
.f-blk:hover { background: var(--surface-2); } .f-blk.hl { background: var(--accent-soft); } .f-blk.sel { background: var(--accent-soft); box-shadow: inset 0 0 0 2px var(--accent); }
.f-blk .lbl { display: flex; gap: 8px; align-items: baseline; min-width: 0; } .f-blk .lbl span:last-child { overflow-wrap: anywhere; }
.f-blk .cnts { display: flex; flex-wrap: wrap; gap: 3px; justify-content: flex-end; }
.f-blk .cnts .chip { padding: 0 6px; font-family: var(--f-mono); }
.f-blk.none .lbl { color: var(--muted); }
.f-selbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-height: 28px; font-size: 12.5px; }
@media (max-width: 900px) { .f-cols { grid-template-columns: minmax(0, 1fr); } .f-scroll { max-height: none; min-height: 0; } }
`);
const LM = () => A.data.legacy_map;
const stKey = (st) => SK[st] || 'open';
const blkLabel = (b) => b ? T('f.b.' + b) : '';
const matches = (e) => (!S.status || stKey(e.status) === S.status) && (!S.q || (e.id + ' ' + e.what + ' ' + e.section).toLowerCase().includes(S.q));
function elHtml(e) {
  const k = stKey(e.status), sel = S.sel && S.sel.t === 'el' && S.sel.id === e.id, hl = S.sel && S.sel.t === 'blk' && e.v4.block === S.sel.id;
  const L = A.lang, r = e.reason || {}, to = e.v4.block ? (e.v4_label ? e.v4_label[L] || e.v4_label.en : blkLabel(e.v4.block)) : T('f.toNone');
  const det = sel ? `<dl class="det"><dt>${esc(T('f.why'))}</dt><dd>${esc(r[L] || r.en || '')}</dd>
    ${e.gap ? `<dt>${esc(T('f.gap'))}</dt><dd class="mono">${esc(e.gap)}</dd>` : ''}${e.analysis_row ? `<dt>${esc(T('f.row'))}</dt><dd lang="en">${esc(e.analysis_row)}</dd>` : ''}
    ${r.model_suggestion ? `<dt>${esc(T('f.sugg'))}</dt><dd lang="en">${esc(r.model_suggestion)}</dd>` : ''}</dl>` : '';
  return `<div class="f-el ${sel ? 'sel' : hl ? 'hl' : ''}" data-fel="${esc(e.id)}" role="button" tabindex="0" aria-expanded="${sel}"><span class="bar f-st ${k}"></span><span class="id">${esc(e.id)}</span><span class="what" lang="en">${esc(e.what)}</span>
    <span class="meta"><span class="chip f-st ${k}">${esc(T('f.s.' + k))}</span><span>${e.v4.block ? '→ ' : ''}${esc(to)}</span></span>${det}</div>`;
}
function leftHtml() {
  const els = LM().elements, shown = els.filter(matches); let sec = null, h = '';
  shown.forEach(e => { if (e.section !== sec) { sec = e.section; h += `<div class="f-sec" lang="en">${esc(sec)}</div>`; } h += elHtml(e); });
  return { h: h || `<div class="empty">${esc(T('f.empty'))}</div>`, n: shown.length };
}
function rightHtml() {
  const els = LM().elements, by = {};
  els.forEach(e => { const b = e.v4.block; if (b) (by[b] = by[b] || []).push(e); });
  const cnt = (list) => { const c = {}; list.forEach(e => { const k = stKey(e.status); c[k] = (c[k] || 0) + 1; }); return ST.map(([, k]) => c[k] ? `<span class="chip f-st ${k}" title="${esc(T('f.s.' + k))}">${c[k]}</span>` : '').join(''); };
  const blk = (b, g) => { const list = by[b] || [], sel = S.sel && S.sel.t === 'blk' && S.sel.id === b, hl = S.sel && S.sel.t === 'el' && (els.find(e => e.id === S.sel.id) || {}).v4 && els.find(e => e.id === S.sel.id).v4.block === b;
    const dim = S.status && !list.some(e => stKey(e.status) === S.status);
    return `<button class="f-blk ${list.length ? '' : 'none'} ${sel ? 'sel' : hl ? 'hl' : ''}" data-fblk="${esc(b)}" ${list.length ? '' : `title="${esc(T('f.noneT'))}"`} style="${dim ? 'opacity:.45' : ''}"><span class="lbl"><span class="chip ${KIND(b, g) === 'option' ? '' : KIND(b, g)}">${esc(T('f.kind.' + KIND(b, g)))}</span><span>${esc(blkLabel(b))}</span></span><span class="cnts">${list.length ? cnt(list) : `<span class="xs muted">${esc(T('f.none'))}</span>`}</span></button>`; };
  const none = ST.filter(([s]) => els.some(e => !e.v4.block && e.status === s)).map(([s, k]) => { const n = els.filter(e => !e.v4.block && e.status === s).length;
    return `<button class="f-blk ${S.status === k ? 'sel' : ''}" data-fnone="${k}"><span class="lbl"><span class="chip f-st ${k}">${esc(T('f.s.' + k))}</span><span class="small muted">${esc(T('f.d.' + k))}</span></span><span class="cnts"><span class="chip f-st ${k}">${n}</span></span></button>`; }).join('');
  return GROUPS.map(([g, list]) => `<div class="f-sec">${esc(T('f.g.' + g))}</div>${list.map(b => blk(b, g)).join('')}`).join('') + `<div class="f-sec">${esc(T('f.g.none'))}</div>${none}`;
}
function selBar() {
  const els = LM().elements;
  if (!S.sel) return `<span class="muted">${esc(T('f.hint'))}</span>`;
  const txt = S.sel.t === 'el' ? T('f.selEl', { id: S.sel.id }) + ' · ' + (() => { const e = els.find(x => x.id === S.sel.id); return e && e.v4.block ? blkLabel(e.v4.block) : T('f.toNone'); })()
    : blkLabel(S.sel.id) + ' · ' + T('f.selBlk', { n: els.filter(e => e.v4.block === S.sel.id).length });
  return `<b>${esc(txt)}</b><button class="btn sm ghost" id="fClear">${esc(T('f.clear'))}</button>`;
}
function render(root) {
  const lm = LM();
  if (!lm) { root.innerHTML = `<div class="card"><div class="empty">${esc(T('mod.none'))}</div></div>`; return; }
  const n = lm.elements.length, counts = {}; lm.elements.forEach(e => { const k = stKey(e.status); counts[k] = (counts[k] || 0) + 1; });
  const clinic = lm.clinic === 'Clinic C' ? T('clinicC') : lm.clinic, left = leftHtml();
  root.innerHTML = `<div class="f-page">
    <div class="crumbs"><a href="#templates">${esc(T('f.crumb'))}</a><span>/</span><span>${esc(T('f.title'))}</span></div>
    <div class="pagehead"><div><h1>${esc(T('f.title'))} <span class="mono muted" style="font-size:15px">${esc(lm.template)}</span> <span class="chip">${esc(T('f.model'))}</span>${A.ann('Review D2; mockup assumption M64: pseudonymised model coverage/models/T06.json, neutral paraphrases, never template text')}</h1>
      <div class="muted small">${esc(T('f.sub', { clinic, lang: T('f.lang.' + lm.language), n, rpy: lm.reports_per_year }))}</div></div></div>
    <div class="card"><div class="bd grid" style="gap:10px">
      <div class="f-bar" role="img" aria-label="${esc(T('f.bar', { n }))}">${ST.filter(([, k]) => counts[k]).map(([, k]) => `<span class="f-st ${k}${S.status && S.status !== k ? ' dim' : ''}" data-fst="${k}" style="flex:${counts[k]}" title="${esc(T('f.s.' + k))}: ${counts[k]}"></span>`).join('')}</div>
      <div class="f-legend" role="group" aria-label="${esc(T('f.filter'))}"><button class="chip ${S.status ? 'dim' : 'on'}" data-fst="">${esc(T('f.all'))} <b>${n}</b></button>${ST.filter(([, k]) => counts[k]).map(([, k]) => `<button class="chip f-st ${k} ${S.status === k ? 'on' : S.status ? 'dim' : ''}" data-fst="${k}" title="${esc(T('f.d.' + k))}">${esc(T('f.s.' + k))} <b>${counts[k]}</b></button>`).join('')}</div>
      <details class="small"><summary>${esc(T('f.about'))}</summary><p lang="en" style="margin:6px 0 0">${esc(lm.summary)}</p></details>
    </div></div>
    <div class="f-cols">
      <div class="card"><div class="hd"><div><h2>${esc(T('f.left', { t: lm.template }))}</h2><div class="xs muted">${esc(T('f.leftS', { clinic }))}</div></div><div class="row"><input id="fQ" value="${esc(S.q)}" placeholder="${esc(T('f.search'))}" aria-label="${esc(T('f.search'))}" style="border:1px solid var(--line-2);border-radius:5px;padding:4px 8px;width:170px;max-width:100%"><span class="xs muted" id="fShown">${esc(T('f.shown', { n: left.n, m: n }))}</span></div></div>
        <div class="f-scroll" id="fLeft">${left.h}</div></div>
      <div class="card"><div class="hd"><div><h2>${esc(T('f.right'))}</h2><div class="xs muted">${esc(T('f.rightS'))}</div></div>${A.ann('3.5 Blocks: device blocks belong to the company; clinic layout and texts; clinician text')}</div>
        <div class="bd f-selbar" id="fSel">${selBar()}</div><div class="f-scroll" id="fRight">${rightHtml()}</div></div>
    </div></div>`;
  wire(root);
}
function wire(root) {
  const redraw = (scroll) => { const l = leftHtml(); q1('#fLeft', root).innerHTML = l.h; q1('#fShown', root).textContent = T('f.shown', { n: l.n, m: LM().elements.length }); q1('#fRight', root).innerHTML = rightHtml(); q1('#fSel', root).innerHTML = selBar(); wireDyn(root); if (scroll) scroll(); };
  qa('[data-fst]', root).forEach(b => b.onclick = () => { const k = b.dataset.fst || null; S.status = S.status === k ? null : k; S.sel = null; render(root); });
  const qi = q1('#fQ', root); if (qi) qi.oninput = () => { S.q = qi.value.trim().toLowerCase(); redraw(); };
  root._fRedraw = redraw; wireDyn(root);
}
function wireDyn(root) {
  const redraw = root._fRedraw;
  const into = (box, sel) => { const b = q1(box, root), t = b && q1(sel, b); if (!b || !t) return; const top = t.offsetTop - b.offsetTop - 40; if (top < b.scrollTop || top > b.scrollTop + b.clientHeight - 60) b.scrollTop = Math.max(0, top); };
  qa('[data-fel]', root).forEach(b => { b.onclick = (ev) => { if (ev.target.closest('.det')) return; const id = b.dataset.fel; S.sel = S.sel && S.sel.t === 'el' && S.sel.id === id ? null : { t: 'el', id };
    redraw(() => { if (S.sel) { into('#fRight', '.f-blk.hl'); const f = q1(`[data-fel="${id}"]`, root); if (f) f.focus({ preventScroll: true }); } }); };
    b.onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.onclick(ev); } }; });
  qa('[data-fblk]', root).forEach(b => b.onclick = () => { const id = b.dataset.fblk; S.sel = S.sel && S.sel.t === 'blk' && S.sel.id === id ? null : { t: 'blk', id };
    if (S.sel && S.status) S.status = null; redraw(() => { if (S.sel) into('#fLeft', '.f-el.hl'); }); });
  qa('[data-fnone]', root).forEach(b => b.onclick = () => { const k = b.dataset.fnone; S.status = S.status === k ? null : k; S.sel = null; render(root); });
  const c = q1('#fClear', root); if (c) c.onclick = () => { S.sel = null; redraw(); };
}
window.Modules.mapping = { render };
