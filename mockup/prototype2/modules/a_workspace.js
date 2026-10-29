/* Module A: workspace tabs "Recording" (segments) and "Cleaning" (ICA review).
   Every signal on these tabs is generated here from a seeded PRNG, so it is deterministic and
   clearly synthetic (mockup assumption M22): it is not the report data. */
const A = window.APP, T = A.t;
A.addI18n({
  en: {
    'a.r.blink': 'Blink', 'a.r.muscle': 'Muscle', 'a.r.electrode': 'Electrode', 'a.r.movement': 'Movement', 'a.r.manual': 'Excluded manually', 'a.r.manualShort': 'Manual',
    'a.included': 'Included', 'a.changed': 'changed', 'a.settling': 'Settling', 'a.settlingLong': 'Settling, not analysed', 'a.stim': 'Stim', 'a.all': 'All',
    'a.stat.page': '{a} to {b} of {c} · page {p} of {n}', 'a.stat.help': 'Click or drag over segments to include or exclude · ← → page · ↑ ↓ gain',
    'a.seg': 'Segment {i}', 'a.stat.excl': 'excluded ({r})', 'a.stat.incl': 'included', 'a.stat.propEx': ' · proposed: exclude ({r})', 'a.stat.propIn': ' · proposed: include',
    'a.stat.clickIn': 'Click to include', 'a.stat.clickEx': 'Click to exclude',
    'a.segments': 'Segments', 'a.chgMan': 'Changed manually', 'a.chgManN': 'Changed manually · {n}', 'a.asProp': 'As proposed', 'a.min': 'Min',
    'a.aboveMin': 'Above the minimum', 'a.belowMin': 'Below the minimum', 'a.short': 'short', 'a.excludedH': '{cond}: excluded', 'a.nOfSegs': '{n} of {m} segments',
    'a.proposedR': 'Proposed: {r}', 'a.proposedInc': 'Proposed: include', 'a.include': 'Include', 'a.exclude': 'Exclude', 'a.noExcl': 'No excluded segments',
    'a.confirmed': 'Confirmed', 'a.confBy': (p) => `by Clinician 1${p.at ? ' at ' + p.at : ''}${p.n ? `, ${p.n} manual change${p.n > 1 ? 's' : ''}` : ''}`,
    'a.belowMinBan': 'Below the minimum analysed time. Include segments or reject the recording.', 'a.reset': 'Reset to proposal', 'a.reviewCln': 'Review cleaning ›',
    'a.confirmSegs': 'Confirm segments',
    'a.log.excl': 'Excluded segment {i} ({a} to {b}) of {cond}', 'a.log.incl': 'Included segment {i} ({a} to {b}) of {cond}',
    'a.log.exclN': 'Excluded segments {i} to {j} ({a} to {b}) of {cond}', 'a.log.inclN': 'Included segments {i} to {j} ({a} to {b}) of {cond}',
    'a.log.reset': 'Reset segments to the automatic proposal', 'a.toast.reset': 'Segments reset to the proposal',
    'a.log.confirm': (p) => `Confirmed segments: eyes open ${p.eo} s, eyes closed ${p.ec} s, VCPT ${p.v} s analysed; ${p.n ? `${p.n} manual change${p.n > 1 ? 's' : ''}` : 'as proposed'}`,
    'a.toast.confChg': 'Segments confirmed with your changes. In the mockup the results keep the proposed segments.', 'a.toast.conf': 'Segments confirmed as proposed',
    'a.toast.segAgain': 'Segments changed after confirmation: confirm them again',
    'a.viewer': 'EEG viewer', 'a.montage': 'Montage', 'a.avgRef': 'Average reference', 'a.bipolar': 'Bipolar longitudinal', 'a.gain': 'Gain', 'a.timebase': 'Timebase',
    'a.hp': 'HP', 'a.lp': 'LP', 'a.off': 'Off', 'a.notch': 'Notch 50 Hz', 'a.dispOnly': 'display only', 'a.dispOnlyT': 'Filters change the display only, not the analysis',
    'a.prev': 'Previous page', 'a.next': 'Next page', 'a.tracesAria': 'EEG traces, 19 channels', 'a.stripAria': 'Whole recording overview: segments and current page',
    'a.cls.Brain': 'Brain', 'a.cls.Muscle': 'Muscle', 'a.cls.Eye': 'Eye', 'a.cls.Line noise': 'Line noise', 'a.cls.Channel noise': 'Channel noise', 'a.cls.Other': 'Other',
    'a.ic.1': 'Eye blinks', 'a.ic.2': 'Horizontal eye movements', 'a.ic.3': 'Posterior alpha', 'a.ic.4': 'Parieto-occipital right', 'a.ic.5': 'Frontal midline',
    'a.ic.6': 'Muscle, left temporal', 'a.ic.7': 'Central left', 'a.ic.8': 'Central right', 'a.ic.9': 'Electrode noise, T4', 'a.ic.10': 'Occipital left',
    'a.ic.11': 'Parietal midline', 'a.ic.12': 'Temporal right', 'a.ic.13': 'Frontal left', 'a.ic.14': 'Unclassified', 'a.ic.15': 'Central midline',
    'a.ic.16': 'Unclassified', 'a.ic.17': 'Frontal right', 'a.ic.18': 'Unclassified', 'a.ic.19': 'Unclassified',
    'a.icAria': 'Component {ic}, {label}', 'a.proposed': 'proposed', 'a.propT': 'The automatic cleaning proposes removing it', 'a.remove': 'Remove', 'a.keep': 'Keep',
    'a.icaTitle': 'Artefact removal, ICA', 'a.icaSum': '{n} of 19 components removed ({v}% of variance) · proposal: {list}', 'a.icRm': 'IC {ic} removed', 'a.icKept': 'IC {ic} kept',
    'a.accepted': 'Accepted', 'a.reject': 'Reject recording', 'a.accAgain': 'Accept again', 'a.accept': 'Accept cleaning', 'a.confFirst': 'Confirm the segments first',
    'a.log.icaReset': 'Reset ICA cleaning to the automatic proposal',
    'a.log.icRm': 'Removed component {ic} ({kind}) although the automatic cleaning proposed keeping it',
    'a.log.icKept': 'Kept component {ic} ({kind}) although the automatic cleaning proposed removing it',
    'a.log.accept': (p) => `Accepted the ICA cleaning: ${p.n} of 19 components removed${p.chg ? ', changed manually' : ', as proposed'}`,
    'a.toast.accChg': 'Cleaning accepted with your changes; the report states them', 'a.toast.acc': 'Cleaning accepted as proposed',
    'a.reason': 'Reason', 'a.rj.many': 'Too many artefacts', 'a.rj.elec': 'Electrode problem', 'a.rj.proto': 'Protocol not followed', 'a.rj.coop': 'Patient could not cooperate',
    'a.rj.other': 'Other', 'a.note': 'Note (optional)', 'a.notePh': 'Visible to the clinic only',
    'a.rjInfo': 'A rejected recording produces no results and no report. The patient can be recorded again.',
    'a.log.reject': 'Rejected the recording of {d}: {why}{note}. Mockup: the case stays accepted',
    'a.toast.reject': 'Rejection logged. In the mockup the case stays accepted so the walkthrough can go on.',
    'a.toast.clnAgain': 'Cleaning changed after acceptance: accept it again', 'a.mapUnit': 'a.u., normalised; sign arbitrary',
    'a.keepComp': 'Keep component', 'a.rmComp': 'Remove component', 'a.expVar': 'Explained variance', 'a.rank': 'rank {r} of 19', 'a.proposal': 'Proposal',
    'a.yourChoice': 'Your choice', 'a.strongest': 'Strongest at', 'a.classifier': 'Classifier', 'a.activation': 'Activation, {cond}, {a} to {b} (a.u.)',
    'a.psd': 'Power spectrum at {ch}, eyes open, 1 to 45 Hz (dB re 1 µV²/Hz)', 'a.alphaBand': '8 to 12 Hz',
    'a.segNot': 'Segments not confirmed', 'a.segNotText': 'Confirm the segments on the Recording tab before accepting the cleaning.', 'a.openRec': 'Open Recording',
    'a.components': 'Components', 'a.compSub': 'Sorted by explained variance · map in a.u.', 'a.ba': 'Signal before and after removal', 'a.before': 'Before',
    'a.after': 'After', 'a.overlay': 'Overlay', 'a.baAria': 'Frontal and temporal channels before and after removing the selected components',
  },
  de: {
    'a.r.blink': 'Lidschlag', 'a.r.muscle': 'Muskel', 'a.r.electrode': 'Elektrode', 'a.r.movement': 'Bewegung', 'a.r.manual': 'Manuell ausgeschlossen', 'a.r.manualShort': 'Manuell',
    'a.included': 'Eingeschlossen', 'a.changed': 'geändert', 'a.settling': 'Einschwingen', 'a.settlingLong': 'Einschwingen, nicht ausgewertet', 'a.stim': 'Reiz', 'a.all': 'Alle',
    'a.stat.page': '{a} bis {b} von {c} · Seite {p} von {n}', 'a.stat.help': 'Segmente anklicken oder überstreichen, um sie ein- oder auszuschließen · ← → Seite · ↑ ↓ Verstärkung',
    'a.seg': 'Segment {i}', 'a.stat.excl': 'ausgeschlossen ({r})', 'a.stat.incl': 'eingeschlossen', 'a.stat.propEx': ' · Vorschlag: ausschließen ({r})', 'a.stat.propIn': ' · Vorschlag: einschließen',
    'a.stat.clickIn': 'Klicken zum Einschließen', 'a.stat.clickEx': 'Klicken zum Ausschließen',
    'a.segments': 'Segmente', 'a.chgMan': 'Manuell geändert', 'a.chgManN': 'Manuell geändert · {n}', 'a.asProp': 'Wie vorgeschlagen', 'a.min': 'Min.',
    'a.aboveMin': 'Über dem Minimum', 'a.belowMin': 'Unter dem Minimum', 'a.short': 'zu kurz', 'a.excludedH': '{cond}: ausgeschlossen', 'a.nOfSegs': '{n} von {m} Segmenten',
    'a.proposedR': 'Vorschlag: {r}', 'a.proposedInc': 'Vorschlag: einschließen', 'a.include': 'Einschließen', 'a.exclude': 'Ausschließen', 'a.noExcl': 'Keine ausgeschlossenen Segmente',
    'a.confirmed': 'Bestätigt', 'a.confBy': (p) => `von Kliniker 1${p.at ? ' um ' + p.at : ''}${p.n ? `, ${p.n} manuelle Änderung${p.n > 1 ? 'en' : ''}` : ''}`,
    'a.belowMinBan': 'Unter der minimalen Auswertungszeit. Segmente einschließen oder die Aufnahme ablehnen.', 'a.reset': 'Auf Vorschlag zurücksetzen', 'a.reviewCln': 'Bereinigung prüfen ›',
    'a.confirmSegs': 'Segmente bestätigen',
    'a.log.excl': 'Segment {i} ({a} bis {b}) von {cond} ausgeschlossen', 'a.log.incl': 'Segment {i} ({a} bis {b}) von {cond} eingeschlossen',
    'a.log.exclN': 'Segmente {i} bis {j} ({a} bis {b}) von {cond} ausgeschlossen', 'a.log.inclN': 'Segmente {i} bis {j} ({a} bis {b}) von {cond} eingeschlossen',
    'a.log.reset': 'Segmente auf den automatischen Vorschlag zurückgesetzt', 'a.toast.reset': 'Segmente auf den Vorschlag zurückgesetzt',
    'a.log.confirm': (p) => `Segmente bestätigt: Augen offen ${p.eo} s, Augen geschlossen ${p.ec} s, VCPT ${p.v} s ausgewertet; ${p.n ? `${p.n} manuelle Änderung${p.n > 1 ? 'en' : ''}` : 'wie vorgeschlagen'}`,
    'a.toast.confChg': 'Segmente mit Ihren Änderungen bestätigt. Im Mockup behalten die Ergebnisse die vorgeschlagenen Segmente.', 'a.toast.conf': 'Segmente wie vorgeschlagen bestätigt',
    'a.toast.segAgain': 'Segmente nach der Bestätigung geändert: bitte erneut bestätigen',
    'a.viewer': 'EEG-Anzeige', 'a.montage': 'Montage', 'a.avgRef': 'Durchschnittsreferenz', 'a.bipolar': 'Bipolar längs', 'a.gain': 'Verstärkung', 'a.timebase': 'Zeitbasis',
    'a.hp': 'Hochpass', 'a.lp': 'Tiefpass', 'a.off': 'Aus', 'a.notch': 'Kerbfilter 50 Hz', 'a.dispOnly': 'nur Anzeige', 'a.dispOnlyT': 'Filter ändern nur die Anzeige, nicht die Auswertung',
    'a.prev': 'Vorherige Seite', 'a.next': 'Nächste Seite', 'a.tracesAria': 'EEG-Kurven, 19 Kanäle', 'a.stripAria': 'Übersicht der gesamten Aufnahme: Segmente und aktuelle Seite',
    'a.cls.Brain': 'Gehirn', 'a.cls.Muscle': 'Muskel', 'a.cls.Eye': 'Auge', 'a.cls.Line noise': 'Netzbrummen', 'a.cls.Channel noise': 'Kanalrauschen', 'a.cls.Other': 'Sonstige',
    'a.ic.1': 'Lidschläge', 'a.ic.2': 'Horizontale Augenbewegungen', 'a.ic.3': 'Posteriores Alpha', 'a.ic.4': 'Parieto-okzipital rechts', 'a.ic.5': 'Frontal, Mittellinie',
    'a.ic.6': 'Muskel, links temporal', 'a.ic.7': 'Zentral links', 'a.ic.8': 'Zentral rechts', 'a.ic.9': 'Elektrodenrauschen, T4', 'a.ic.10': 'Okzipital links',
    'a.ic.11': 'Parietal, Mittellinie', 'a.ic.12': 'Temporal rechts', 'a.ic.13': 'Frontal links', 'a.ic.14': 'Nicht klassifiziert', 'a.ic.15': 'Zentral, Mittellinie',
    'a.ic.16': 'Nicht klassifiziert', 'a.ic.17': 'Frontal rechts', 'a.ic.18': 'Nicht klassifiziert', 'a.ic.19': 'Nicht klassifiziert',
    'a.icAria': 'Komponente {ic}, {label}', 'a.proposed': 'Vorschlag', 'a.propT': 'Die automatische Bereinigung schlägt die Entfernung vor', 'a.remove': 'Entfernen', 'a.keep': 'Beibehalten',
    'a.icaTitle': 'Artefaktbereinigung, ICA', 'a.icaSum': '{n} von 19 Komponenten entfernt ({v} % der Varianz) · Vorschlag: {list}', 'a.icRm': 'IC {ic} entfernt', 'a.icKept': 'IC {ic} beibehalten',
    'a.accepted': 'Übernommen', 'a.reject': 'Aufnahme ablehnen', 'a.accAgain': 'Erneut übernehmen', 'a.accept': 'Bereinigung übernehmen', 'a.confFirst': 'Zuerst die Segmente bestätigen',
    'a.log.icaReset': 'ICA-Bereinigung auf den automatischen Vorschlag zurückgesetzt',
    'a.log.icRm': 'Komponente {ic} ({kind}) entfernt, obwohl die automatische Bereinigung ihre Beibehaltung vorschlug',
    'a.log.icKept': 'Komponente {ic} ({kind}) beibehalten, obwohl die automatische Bereinigung ihre Entfernung vorschlug',
    'a.log.accept': (p) => `ICA-Bereinigung übernommen: ${p.n} von 19 Komponenten entfernt${p.chg ? ', manuell geändert' : ', wie vorgeschlagen'}`,
    'a.toast.accChg': 'Bereinigung mit Ihren Änderungen übernommen; der Bericht nennt sie', 'a.toast.acc': 'Bereinigung wie vorgeschlagen übernommen',
    'a.reason': 'Grund', 'a.rj.many': 'Zu viele Artefakte', 'a.rj.elec': 'Elektrodenproblem', 'a.rj.proto': 'Protokoll nicht eingehalten', 'a.rj.coop': 'Mitarbeit nicht möglich',
    'a.rj.other': 'Sonstiges', 'a.note': 'Notiz (optional)', 'a.notePh': 'Nur für die Klinik sichtbar',
    'a.rjInfo': 'Eine abgelehnte Aufnahme ergibt keine Ergebnisse und keinen Bericht. Die Patientin oder der Patient kann erneut aufgenommen werden.',
    'a.log.reject': 'Aufnahme vom {d} abgelehnt: {why}{note}. Mockup: Der Fall bleibt angenommen',
    'a.toast.reject': 'Ablehnung protokolliert. Im Mockup bleibt der Fall angenommen, damit der Ablauf weitergehen kann.',
    'a.toast.clnAgain': 'Bereinigung nach der Übernahme geändert: bitte erneut übernehmen', 'a.mapUnit': 'relative Einheiten, normiert; Vorzeichen beliebig',
    'a.keepComp': 'Komponente beibehalten', 'a.rmComp': 'Komponente entfernen', 'a.expVar': 'Erklärte Varianz', 'a.rank': 'Rang {r} von 19', 'a.proposal': 'Vorschlag',
    'a.yourChoice': 'Ihre Wahl', 'a.strongest': 'Am stärksten an', 'a.classifier': 'Klassifikator', 'a.activation': 'Aktivierung, {cond}, {a} bis {b} (relative Einheiten)',
    'a.psd': 'Leistungsspektrum an {ch}, Augen offen, 1 bis 45 Hz (dB bezogen auf 1 µV²/Hz)', 'a.alphaBand': '8 bis 12 Hz',
    'a.segNot': 'Segmente nicht bestätigt', 'a.segNotText': 'Bestätigen Sie die Segmente im Tab Aufnahme, bevor Sie die Bereinigung übernehmen.', 'a.openRec': 'Aufnahme öffnen',
    'a.components': 'Komponenten', 'a.compSub': 'Nach erklärter Varianz sortiert · Karte in relativen Einheiten', 'a.ba': 'Signal vor und nach der Entfernung', 'a.before': 'Vorher',
    'a.after': 'Nachher', 'a.overlay': 'Überlagert', 'a.baAria': 'Frontale und temporale Kanäle vor und nach dem Entfernen der gewählten Komponenten',
  },
});
const FS = 128, SEGLEN = 4, PX_MM = 96 / 25.4;
const CH = A.channels, NCH = CH.length, CI = Object.fromEntries(CH.map((c, i) => [c, i]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const INK = '#1c2a36', GRID = '#e6e8ea', MUTED = '#6b7279';
const REASON = {
  blink: { col: '#3d6fd1' }, muscle: { col: '#c2452d' }, electrode: { col: '#8a4fc7' }, movement: { col: '#b07a12' }, manual: { col: '#5a6670', short: true },
};
const rLabel = (k) => T('a.r.' + k), rShort = (k) => T(REASON[k].short ? 'a.r.manualShort' : 'a.r.' + k);
const INCL_COL = '#9fcfb0', TRIM_COL = '#d9dcdf';
const MIN_S = { EO: 120, EC: 120, VCPT: 900 }; /* mockup assumption: minimum analysed seconds */

/* ---------------- deterministic random numbers ---------------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
const U = (r, lo, hi) => lo + (hi - lo) * r();
const near = (c, x, y, s) => { const p = A.pos[c]; return Math.exp(-((p[0] - x) ** 2 + (p[1] - y) ** 2) / (2 * s * s)); };
/* pink-ish noise: three normalised one-pole low-pass noises plus a little white noise, std about 1 */
function pink(r, w = [1, 0.55, 0.3]) {
  const k = [1, 4, 12].map(f => Math.exp(-2 * Math.PI * f / FS)), nr = k.map(v => Math.sqrt((1 + v) / (1 - v))), y = [0, 0, 0];
  return () => { let o = 0.15 * gauss(r); for (let j = 0; j < 3; j++) { y[j] = k[j] * y[j] + (1 - k[j]) * gauss(r); o += w[j] * y[j] * nr[j]; } return o / 1.2; };
}
function slow(r, fc) { const k = Math.exp(-2 * Math.PI * fc / FS), nr = Math.sqrt((1 + k) / (1 - k)); let y = 0; return () => (y = k * y + (1 - k) * gauss(r)) * nr; }
const fmt = (t) => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

/* ---------------- recordings: artefact plan and proposed segments ---------------- */
const COND = {
  EO: { dur: 180, trim: 0, seed: 1101, alpha: 9, blinks: [2.4, 5.2], hem: 22,
    art: [[7, 'blink'], [18, 'muscle'], [29, 'electrode'], [38, 'movement']] },
  EC: { dur: 180, trim: 1, seed: 2203, alpha: 32, blinks: null, hem: 45,
    art: [[12, 'muscle'], [33, 'electrode']] },
  VCPT: { dur: 1220, trim: 0, seed: 3307, alpha: 9, blinks: [3, 7], hem: 40, art: null },
};
/* ---------------- forward maps: smoothed current dipoles in a unit sphere ----------------
   Electrodes sit on the sphere (azimuthal 2D positions, radius 1 = 90 degrees from the vertex).
   One set of maps feeds both the raw signal on the Recording tab and the ICA components, so
   removing a component removes exactly what it put into the channels. */
const E3 = CH.map(c => { const [x, y] = A.pos[c], r = Math.hypot(x, y), th = r * Math.PI / 2, ph = Math.atan2(y, x); return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; });
const under = (x, y, rad) => { const r = Math.hypot(x, y), th = r * Math.PI / 2, ph = Math.atan2(y, x); return [rad * Math.sin(th) * Math.cos(ph), rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(th)]; };
const dipole = (p, m, s) => E3.map(e => { const d = [e[0] - p[0], e[1] - p[1], e[2] - p[2]], q = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + s * s; return (m[0] * d[0] + m[1] * d[1] + m[2] * d[2]) / q ** 1.5; });
const n1 = (w) => { const mx = Math.max(...w.map(Math.abs)) || 1; return w.map(v => v / mx); };
const avgref = (w) => { const m = w.reduce((a, b) => a + b, 0) / w.length; return w.map(v => v - m); };
const addw = (a, b, k = 1) => a.map((v, i) => v + k * b[i]);
/* brain source under scalp point (x, y) at radius rad, radial moment plus a tangential tilt */
const bm = (x, y, rad, tilt = [0, 0, 0], s = 0.4) => { const p = under(x, y, rad), r = Math.hypot(...p); return n1(dipole(p, p.map((v, i) => v / r + tilt[i]), s)); };
const EYE = [[-0.3, 0.72, -0.5], [0.3, 0.72, -0.5]];
const eyes = (m) => addw(dipole(EYE[0], m, 0.35), dipole(EYE[1], m, 0.35));
const temporal = (sx) => n1(addw(bm(sx * 1.0, 0.15, 0.9, [0, 0.15, 0], 0.42), bm(sx * 0.93, -0.38, 0.9, [0, 0, 0], 0.35), 0.6));
const FW = {
  blink: n1(n1(eyes([0, 0.3, 1])).map(v => Math.sign(v) * Math.abs(v) ** 0.9)), /* skull smearing: shallower fall-off */
  hem: n1(eyes([1, 0, 0])),
  musL: temporal(-1), musR: temporal(1),
  pop: CH.map(c => (c === 'T4' ? 1 : 0)),
  alpha: bm(0, -0.86, 0.6, [0, -0.6, 0.2]),
  muL: bm(-0.5, 0.02, 0.58, [0, 0.6, 0], 0.36), muR: bm(0.5, 0.02, 0.58, [0, 0.55, 0.1], 0.36),
};
/* high-pass biquad coefficients (muscle noise) */
function hpCoef(fc) { const w = 2 * Math.PI * fc / FS, c = Math.cos(w), al = Math.sin(w) / Math.SQRT2, a0 = 1 + al; return [(1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0, -2 * c / a0, (1 - al) / a0]; }
/* artefact event -> forward map, first sample and waveform in uV at the map maximum */
function wave(e) {
  const i0 = Math.max(0, Math.floor((e.t - 0.05) * FS));
  if (e.k === 'blink') { const L = Math.round((e.d || 0.42) * FS), v = new Float32Array(L); for (let i = 0; i < L; i++) v[i] = e.a * Math.sin(Math.PI * Math.pow(i / L, 0.65)) ** 2; return { w: FW.blink, i0, v }; }
  if (e.k === 'hem') { const L = Math.round((e.d + 0.4) * FS), v = new Float32Array(L); for (let i = 0; i < L; i++) { const t = i / FS; v[i] = e.a * (1 / (1 + Math.exp(-(t - 0.1) / 0.025)) - 1 / (1 + Math.exp(-(t - 0.1 - e.d) / 0.025))); } return { w: FW.hem, i0, v }; }
  if (e.k === 'muscle') { const r = rng(Math.round(e.t * 1000) + 17), L = Math.round(e.d * FS), v = new Float32Array(L); for (let i = 0; i < L; i++) v[i] = gauss(r); biquad(v, hpCoef(26)); biquad(v, hpCoef(26));
    for (let i = 0; i < L; i++) v[i] *= e.a * Math.sqrt(Math.sin(Math.PI * i / L)) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 3.1 * i / FS)); return { w: e.side === 'R' ? FW.musR : FW.musL, i0, v }; }
  if (e.k === 'pop') { const L = Math.round(1.6 * FS), v = new Float32Array(L); for (let i = 0; i < L; i++) v[i] = e.a * Math.min(1, i / 2) * Math.exp(-i / FS / 0.3); return { w: FW.pop, i0, v }; }
  return null;
}

function plan(key) {
  const cfg = COND[key];
  if (cfg._plan) return cfg._plan;
  const r = rng(cfg.seed), segs = [];
  for (let t = cfg.trim; t < cfg.dur - 1e-6; t += SEGLEN) segs.push({ t0: t, t1: Math.min(cfg.dur, t + SEGLEN) });
  let art = cfg.art;
  if (!art) { /* VCPT: 13 proposed exclusions spread over the task */
    const kinds = ['blink', 'blink', 'blink', 'blink', 'blink', 'muscle', 'muscle', 'muscle', 'movement', 'movement', 'movement', 'electrode', 'electrode'];
    const pick = new Set(); while (pick.size < kinds.length) pick.add(3 + Math.floor(r() * (segs.length - 6)));
    art = [...pick].sort((a, b) => a - b).map((s, i) => [s, kinds[(i * 5) % kinds.length]]);
  }
  const ev = [], prop = segs.map(() => null);
  if (cfg.blinks) for (let t = 1 + r() * 2; t < cfg.dur - 1; t += U(r, cfg.blinks[0], cfg.blinks[1])) ev.push({ k: 'blink', t, a: U(r, 75, 125) });
  for (let t = 8 + r() * 10; t < cfg.dur - 3; t += U(r, cfg.hem * 0.6, cfg.hem * 1.4)) ev.push({ k: 'hem', t, d: U(r, 0.5, 1.4), a: (r() < 0.5 ? -1 : 1) * U(r, 25, 50) });
  art.forEach(([s, kind]) => {
    prop[s] = kind; const t0 = segs[s].t0;
    for (let i = ev.length - 1; i >= 0; i--) if (ev[i].k === 'blink' && ev[i].t > t0 - 0.5 && ev[i].t < t0 + SEGLEN) ev.splice(i, 1);
    if (kind === 'blink') { [0.35, 1.25, 2.15, 3.0].forEach((o, j) => ev.push({ k: 'blink', t: t0 + o, a: [230, 270, 210, 180][j] })); ev.push({ k: 'move', t: t0 + 0.2, d: 3.5, a: 45 }); }
    if (kind === 'muscle') ev.push({ k: 'muscle', t: t0 + U(r, 0.3, 0.8), d: U(r, 2.4, 3), a: 26, side: 'L' });
    if (kind === 'electrode') [[0.7, 230], [2.0, -170], [3.0, 130]].forEach(([o, a]) => ev.push({ k: 'pop', t: t0 + o, a }));
    if (kind === 'movement') ev.push({ k: 'move', t: t0 + 0.25, d: 3.4, a: 150 });
  });
  if (key === 'EO') /* the first 20 s also feed the ICA review on the Cleaning tab */
    [['hem', 3.3, -24, 1.0], ['hem', 8.3, 22, 0.7], ['hem', 16.4, -22, 1.1], ['muscle', 3.9, 38, 1.6], ['muscle', 11.6, 28, 1.2], ['pop', 7.5, 60], ['pop', 17.2, -45]]
      .forEach(([k, t, a, d]) => ev.push({ k, t, a, d, side: 'L' }));
  for (let n = 0; n < (key === 'VCPT' ? 14 : 3); n++) ev.push({ k: 'muscle', t: U(r, 5, cfg.dur - 5), d: U(r, 0.3, 0.7), a: U(r, 6, 10), side: r() < 0.6 ? 'L' : 'R' });
  let marks = [];
  if (key === 'VCPT') {
    const types = []; ['Go', 'NoGo', 'Ignore', 'Novelty'].forEach(t => { for (let i = 0; i < 100; i++) types.push(t); });
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    const S = { Go: ['A', 'A'], NoGo: ['A', 'P'], Ignore: ['P', 'P'], Novelty: ['P', 'H'] };
    const goIdx = types.map((t, i) => t === 'Go' ? i : -1).filter(i => i >= 0), ngIdx = types.map((t, i) => t === 'NoGo' ? i : -1).filter(i => i >= 0);
    const om = new Set(goIdx.filter((_, i) => i % 20 === 7)), cm = new Set(ngIdx.filter((_, i) => i % 33 === 11));
    types.forEach((ty, i) => {
      const T0 = 10 + i * 3; marks.push({ t: T0, s: S[ty][0] }, { t: T0 + 1.1, s: S[ty][1], ty });
      if ((ty === 'Go' && !om.has(i)) || cm.has(i)) marks.push({ t: T0 + 1.1 + Math.max(0.22, 0.452 + 0.117 * gauss(r)), s: 'R' });
    });
  }
  return (cfg._plan = { segs, prop, ev: ev.sort((a, b) => a.t - b.t), marks });
}

/* ---------------- synthetic 19-channel signal, average reference ---------------- */
const GEN = {};
function gen(key) {
  if (GEN[key]) return GEN[key];
  const cfg = COND[key], P = plan(key), r = rng(cfg.seed * 7 + 1), n = cfg.dur * FS;
  const x = CH.map(() => new Float32Array(n));
  const src = [[0, 0.75, 0.45, 13], [0, 0, 0.45, 10], [-0.85, 0, 0.4, 8.5], [0.85, 0, 0.4, 8.5], [0, -0.5, 0.45, 10], [-0.4, 0.4, 0.35, 6], [0.4, -0.3, 0.35, 6]]
    .map(([sx, sy, s, g]) => ({ f: pink(r), w: CH.map(c => g * near(c, sx, sy, s)) }));
  const own = CH.map(() => pink(r, [0.6, 0.5, 0.4]));
  const aw = FW.alpha, mw = FW.muR.map(v => 0.6 * v);
  const envA = slow(r, 0.35), jit = slow(r, 0.2), envM = slow(r, 0.3);
  let ph = 0, phm = 0;
  for (let i = 0; i < n; i++) {
    const t = i / FS;
    ph += 2 * Math.PI * (9.0 + 0.25 * jit()) / FS; phm += 2 * Math.PI * 10.6 / FS;
    const av = cfg.alpha * Math.max(0.08, 0.72 + 0.42 * envA()) * Math.sin(ph);
    const mu = 3 * Math.max(0, 0.4 + 0.5 * envM()) * (Math.sin(phm) + 0.3 * Math.sin(2 * phm + 0.6));
    const sv = src.map(s => s.f()), mains = Math.sin(2 * Math.PI * 50 * t);
    for (let c = 0; c < NCH; c++) {
      let v = 3.2 * own[c]() + av * aw[c] + mu * mw[c] + mains * (c === CI.T4 ? 5 : 1.2);
      for (let k = 0; k < sv.length; k++) v += src[k].w[c] * sv[k];
      x[c][i] = v;
    }
  }
  for (const e of P.ev) { /* artefacts */
    const i0 = Math.max(0, Math.floor((e.t - 0.05) * FS)), wv = wave(e);
    if (wv) { const { w, v } = wv; for (let i = 0; i < v.length && i0 + i < n; i++) for (let c = 0; c < NCH; c++) x[c][i0 + i] += v[i] * w[c]; }
    if (e.k === 'move') { const L = e.d * FS, w = CH.map(() => U(r, 0.4, 1)); for (let i = 0; i < L && i0 + i < n; i++) { const t = i / FS, v = e.a * Math.sin(2 * Math.PI * 0.55 * t + 0.4) * Math.sin(Math.PI * i / L); for (let c = 0; c < NCH; c++) x[c][i0 + i] += v * w[c] + (e.a > 100 ? 6 * gauss(r) : 0); } }
  }
  for (let i = 0; i < n; i++) { let m = 0; for (let c = 0; c < NCH; c++) m += x[c][i]; m /= NCH; for (let c = 0; c < NCH; c++) x[c][i] -= m; }
  return (GEN[key] = { x, n });
}

/* ---------------- display filters (display only) ---------------- */
function biquad(x, [b0, b1, b2, a1, a2]) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; } }
function lpCoef(fc) { const w = 2 * Math.PI * fc / FS, c = Math.cos(w), al = Math.sin(w) / Math.SQRT2, a0 = 1 + al; return [(1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0, -2 * c / a0, (1 - al) / a0]; }
function notchCoef(f0, Q = 25) { const w = 2 * Math.PI * f0 / FS, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return [1 / a0, -2 * c / a0, 1 / a0, -2 * c / a0, (1 - al) / a0]; }
function hp1(x, fc) { const rc = 1 / (2 * Math.PI * fc), a = rc / (rc + 1 / FS); let y = 0, xp = x[0]; for (let i = 0; i < x.length; i++) { const v = x[i]; y = a * (y + v - xp); xp = v; x[i] = y; } }
function pageData(key, t0, tb) {
  const G = gen(key), n0 = Math.round(t0 * FS), n1 = Math.min(G.n, n0 + Math.round(tb * FS)), pre = Math.min(n0, 4 * FS);
  return G.x.map(ch => {
    const s = ch.slice(n0 - pre, n1);
    if (V.hp) hp1(s, V.hp);
    if (V.notch) biquad(s, notchCoef(50));
    if (V.lp) { const k = lpCoef(V.lp); biquad(s, k); }
    return s.subarray(pre);
  });
}
function setupCanvas(cv, W, H) {
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = A.css_var('--paper') || '#fff'; g.fillRect(0, 0, W, H); return g;
}
const crisp = (v) => Math.round(v) + 0.5;
/* calibration mark in the right margin: vertical 100 uV bar, optional 1 s bar */
function calib(g, x, y, h, w1s) {
  g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y); if (w1s) g.lineTo(x - w1s, y); g.stroke(); g.lineWidth = 1;
  g.fillStyle = INK; g.font = '10px IBM Plex Mono, monospace'; g.fillText('100', x + 4, y - h + 8); g.fillText('µV', x + 4, y - h + 19);
  if (w1s) { g.textAlign = 'center'; g.fillText('1 s', x - w1s / 2, y + 11); g.textAlign = 'left'; }
}

/* ================================ Recording tab ================================ */
const V = { cond: 'EO', start: 0, tb: 10, gain: 10, hp: 0.5, lp: 35, notch: true, hover: null };
const SEG = {};
function segState(key) {
  if (!SEG[key]) { const P = plan(key); SEG[key] = { cur: P.prop.slice() }; }
  return SEG[key];
}
const isChanged = (key, i) => (plan(key).prop[i] == null) !== (segState(key).cur[i] == null);
function totals(key) {
  const P = plan(key), S = segState(key);
  let an = 0, ch = 0, ex = 0;
  P.segs.forEach((s, i) => { if (S.cur[i] == null) an += s.t1 - s.t0; else ex++; if (isChanged(key, i)) ch++; });
  return { an: Math.round(an), ch, ex, rec: COND[key].dur };
}
const allChanges = () => Object.keys(COND).reduce((a, k) => a + totals(k).ch, 0);
/* exported for the report: analysed seconds per condition, as chosen now and as proposed */
function exportSeg() {
  const s = A.state.segments, keys = Object.keys(COND);
  s.analysed = Object.fromEntries(keys.map(k => [k, totals(k).an]));
  s.proposed = Object.fromEntries(keys.map(k => { const P = plan(k); return [k, Math.round(P.segs.reduce((a, g, i) => a + (P.prop[i] == null ? g.t1 - g.t0 : 0), 0))]; }));
}

let L = null, drag = null, ro = null, keyH = null;

function drawTraces() {
  const cv = $('#aTr'); if (!cv) return;
  const box = cv.parentElement, W = Math.max(640, box.clientWidth - 24), key = V.cond, cfg = COND[key], P = plan(key), S = segState(key);
  const vc = key === 'VCPT', RUL = 18, BAND = 14, ML = vc ? 20 : 0, TOP = RUL + BAND + ML, ROW = 27, H = TOP + NCH * ROW + 22, GUT = 44, PW = W - GUT - 56;
  const t0 = V.start, tb = V.tb, x = (t) => GUT + (t - t0) / tb * PW;
  L = { GUT, PW, TOP, H, t0, tb, W };
  const g = setupCanvas(cv, W, H);
  /* segments: shading, bands, boundaries */
  if (cfg.trim && t0 < cfg.trim) { g.fillStyle = 'rgba(120,128,136,0.13)'; g.fillRect(x(t0), RUL, x(cfg.trim) - x(t0), H - RUL); g.fillStyle = MUTED; g.font = '10px IBM Plex Sans, sans-serif'; g.fillText(x(cfg.trim) - x(t0) > 110 ? T('a.settlingLong') : T('a.settling'), x(t0) + 4, RUL + 10); }
  P.segs.forEach((s, i) => {
    if (s.t1 <= t0 || s.t0 >= t0 + tb) return;
    const xa = Math.max(GUT, x(s.t0)), xb = Math.min(GUT + PW, x(s.t1)), rs = S.cur[i], chg = isChanged(key, i);
    if (rs) { g.fillStyle = 'rgba(200,64,50,0.07)'; g.fillRect(xa, RUL + BAND, xb - xa, H - RUL - BAND); }
    if (V.hover === i) { g.fillStyle = 'rgba(19,94,125,0.07)'; g.fillRect(xa, RUL + BAND, xb - xa, H - RUL - BAND); }
    g.fillStyle = rs ? REASON[rs].col : (chg ? '#d9a32b' : '#cfe6d7'); g.globalAlpha = rs ? 0.85 : 1; g.fillRect(xa, RUL + 1, xb - xa, BAND - 2); g.globalAlpha = 1;
    g.font = '600 10px IBM Plex Sans, sans-serif'; g.fillStyle = rs ? '#fff' : (chg ? '#3b2a00' : '#24553a');
    const lab = (rs ? rShort(rs) : T('a.included')) + (chg && xb - xa > 110 ? ' · ' + T('a.changed') : '');
    g.save(); g.beginPath(); g.rect(xa, RUL, xb - xa, BAND); g.clip(); g.fillText(`${i + 1}  ${lab}`, xa + 4, RUL + 10); g.restore();
    if (s.t0 >= t0) { g.strokeStyle = '#b9c0c6'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(crisp(x(s.t0)), RUL); g.lineTo(crisp(x(s.t0)), H); g.stroke(); g.setLineDash([]); }
  });
  /* time ruler: 1 s grid */
  const lstep = tb <= 10 ? 1 : (tb <= 20 ? 2 : 5);
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.textAlign = 'center';
  for (let t = Math.ceil(t0); t <= t0 + tb + 1e-6; t++) {
    const xx = crisp(x(t)); g.strokeStyle = GRID; g.beginPath(); g.moveTo(xx, TOP); g.lineTo(xx, H); g.stroke();
    g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(xx, RUL - (t % lstep ? 3 : 6)); g.lineTo(xx, RUL); g.stroke();
    if (t % lstep === 0) g.fillText(fmt(t), Math.min(W - 18, Math.max(GUT + 14, xx)), 10);
  }
  g.textAlign = 'left'; g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(GUT, crisp(RUL)); g.lineTo(GUT + PW, crisp(RUL)); g.stroke();
  /* VCPT stimulus markers */
  if (vc) {
    const y0 = RUL + BAND;
    g.fillStyle = '#f3f5f6'; g.fillRect(GUT, y0, PW, ML); g.fillStyle = MUTED; g.font = '10px IBM Plex Mono, monospace'; g.fillText(T('a.stim'), 6, y0 + 13);
    P.marks.forEach(m => {
      if (m.t < t0 || m.t > t0 + tb) return;
      const xx = crisp(x(m.t)), col = m.s === 'R' ? '#217a45' : (m.s === 'H' ? '#a04a12' : '#135e7d');
      g.strokeStyle = col; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(xx, y0 + ML); g.lineTo(xx, H); g.stroke(); g.globalAlpha = 1;
      g.beginPath(); g.moveTo(xx, y0 + ML - 7); g.lineTo(xx, y0 + ML); g.stroke();
      g.fillStyle = col; g.font = (m.ty ? '600 ' : '') + '9.5px IBM Plex Mono, monospace';
      if (m.s === 'R') { g.font = '8.5px IBM Plex Mono, monospace'; g.fillText('R', xx + 2, y0 + ML - 2); } else g.fillText(m.s + (m.ty && tb <= 20 ? ' ' + m.ty : ''), xx + 2, y0 + 9);
    });
  }
  /* traces */
  const data = pageData(key, t0, tb), k = PX_MM / V.gain, n = data[0].length, dx = PW / (tb * FS);
  g.save(); g.beginPath(); g.rect(GUT, TOP, PW, H - TOP); g.clip();
  g.strokeStyle = INK; g.lineWidth = 0.9; g.lineJoin = 'round';
  data.forEach((s, c) => {
    const y0 = TOP + ROW * (c + 0.5); g.beginPath();
    for (let i = 0; i < n; i++) { const xx = GUT + i * dx, yy = y0 - s[i] * k; if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
    g.stroke();
  });
  g.restore();
  g.font = '500 11px IBM Plex Mono, monospace'; g.fillStyle = INK; g.textAlign = 'right';
  CH.forEach((c, i) => g.fillText(c, GUT - 8, TOP + ROW * (i + 0.5) + 4)); g.textAlign = 'left';
  g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(crisp(GUT), RUL); g.lineTo(crisp(GUT), H); g.stroke();
  /* scale bar: 100 uV vertical, 1 s horizontal */
  calib(g, GUT + PW + 10, H - 13, 100 * k, PW / tb);
}

function drawStrip() {
  const cv = $('#aStrip'); if (!cv) return;
  const W = Math.max(640, cv.parentElement.clientWidth - 24), H = 44, key = V.cond, cfg = COND[key], P = plan(key), S = segState(key);
  const X0 = 44, PW = W - X0 - 10, x = (t) => X0 + t / cfg.dur * PW;
  const g = setupCanvas(cv, W, H);
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.fillText(T('a.all'), 8, 17);
  if (cfg.trim) { g.fillStyle = TRIM_COL; g.fillRect(x(0), 6, x(cfg.trim) - x(0), 16); }
  P.segs.forEach((s, i) => {
    const rs = S.cur[i]; g.fillStyle = rs ? REASON[rs].col : INCL_COL; g.fillRect(x(s.t0), 6, Math.max(1, x(s.t1) - x(s.t0) - (PW / P.segs.length > 4 ? 1 : 0)), 16);
    if (isChanged(key, i)) { g.fillStyle = '#d9a32b'; g.fillRect(x(s.t0), 22, Math.max(1.5, x(s.t1) - x(s.t0) - 1), 3); }
  });
  g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x(V.start), 3.5, Math.max(3, x(V.start + V.tb) - x(V.start)), 22); g.lineWidth = 1;
  const step = cfg.dur > 600 ? 120 : 30; g.fillStyle = MUTED; g.textAlign = 'center';
  for (let t = 0; t <= cfg.dur; t += step) { g.fillRect(Math.round(x(t)), 27, 1, 4); g.fillText(fmt(t), Math.min(W - 16, x(t)), 41); }
  g.textAlign = 'left';
}

function segAt(px) {
  if (!L || px < L.GUT || px > L.GUT + L.PW) return null;
  const t = L.t0 + (px - L.GUT) / L.PW * L.tb, P = plan(V.cond);
  const i = P.segs.findIndex(s => t >= s.t0 && t < s.t1); return i < 0 ? null : i;
}
function setExcl(i, ex) { const S = segState(V.cond), P = plan(V.cond); S.cur[i] = ex ? (P.prop[i] || 'manual') : null; }
function status() {
  const el = $('#aStat'); if (!el) return;
  const P = plan(V.cond), i = V.hover;
  if (i == null) { el.innerHTML = `<span>${T('a.stat.page', { a: fmt(V.start), b: fmt(Math.min(COND[V.cond].dur, V.start + V.tb)), c: fmt(COND[V.cond].dur), p: Math.floor(V.start / V.tb) + 1, n: Math.ceil(COND[V.cond].dur / V.tb) })}</span><span>${T('a.stat.help')}</span>`; return; }
  const s = P.segs[i], rs = segState(V.cond).cur[i];
  el.innerHTML = `<span><b>${T('a.seg', { i: i + 1 })}</b> · ${fmt(s.t0)} ${T('to')} ${fmt(s.t1)} · ${rs ? T('a.stat.excl', { r: A.lc(rShort(rs)) }) : T('a.stat.incl')}${P.prop[i] ? T('a.stat.propEx', { r: A.lc(rLabel(P.prop[i])) }) : T('a.stat.propIn')}</span><span>${T(rs ? 'a.stat.clickIn' : 'a.stat.clickEx')}</span>`;
}
function redraw() { drawTraces(); drawStrip(); status(); }

function side() {
  exportSeg();
  const el = $('#aSide'); if (!el) return;
  const st = A.state.segments, ch = allChanges(), key = V.cond, P = plan(key), S = segState(key);
  const rows = Object.keys(COND).map(k => { const t = totals(k), ok = t.an >= MIN_S[k];
    return `<tr class="link" data-cond="${k}"><td>${T('cond.' + k)}${t.ch ? ` <span class="chip amber" title="${T('a.chgMan')}">${t.ch}</span>` : ''}</td><td class="num"><b>${t.an}</b> / ${t.rec} s</td><td class="num muted">${MIN_S[k]} s</td><td style="color:var(${ok ? '--ok' : '--warn'})" title="${T(ok ? 'a.aboveMin' : 'a.belowMin')}">${ok ? '✓' : T('a.short')}</td></tr>`; }).join('');
  const short = Object.keys(COND).some(k => totals(k).an < MIN_S[k]);
  const ex = P.segs.map((s, i) => ({ s, i, rs: S.cur[i], pr: P.prop[i] })).filter(o => o.rs || o.pr);
  el.innerHTML = `
    <div class="card"><div class="hd"><h2>${T('a.segments')} ${A.ann('3.4 Clinician in control, Working')}</h2>${ch ? `<span class="chip amber"><span class="d"></span>${T('a.chgManN', { n: ch })}</span>` : `<span class="chip device">${T('a.asProp')}</span>`}</div>
      <div class="scroll-x"><table class="tbl a-tot"><tr><th>${T('th.condition')}</th><th class="num">${T('th.analysed')}</th><th class="num">${T('a.min')}</th><th></th></tr>${rows}</table></div>
      <div class="bd" style="display:grid;gap:10px">
        <div class="row between"><h3>${T('a.excludedH', { cond: T('cond.' + key) })}</h3><span class="xs muted">${T('a.nOfSegs', { n: totals(key).ex, m: P.segs.length })}</span></div>
        <div class="a-xl">${ex.length ? `<table class="tbl">${ex.map(o => `<tr class="link" data-jump="${o.i}"><td class="mono small">${fmt(o.s.t0)}</td><td><span class="a-sw" style="background:${o.rs ? REASON[o.rs].col : INCL_COL}"></span>${o.rs ? rLabel(o.rs) : T('a.included')}${o.rs !== o.pr && (o.rs == null) !== (o.pr == null) ? ` <span class="chip amber">${T('a.changed')}</span>` : ''}<div class="xs muted">${o.pr ? T('a.proposedR', { r: A.lc(rLabel(o.pr)) }) : T('a.proposedInc')}</div></td><td class="num"><button class="btn sm" data-tog="${o.i}">${T(o.rs ? 'a.include' : 'a.exclude')}</button></td></tr>`).join('')}</table>` : `<div class="empty small">${T('a.noExcl')}</div>`}</div>
        <div class="a-legend">${Object.keys(REASON).map(k => `<span><i style="background:${REASON[k].col}"></i>${rLabel(k)}</span>`).join('')}<span><i style="background:${INCL_COL}"></i>${T('a.included')}</span></div>
        ${st.confirmed ? `<div class="banner ok"><b>${T('a.confirmed')}</b><span style="flex:1">${T('a.confBy', { at: st.at, n: st.changes })}</span></div>` : ''}
        ${short ? `<div class="banner warn small"><span>${T('a.belowMinBan')}</span></div>` : ''}
        <div class="row between"><button class="btn" id="aReset" ${ch ? '' : 'disabled'}>${T('a.reset')}</button>
          ${st.confirmed ? `<button class="btn primary" id="aNext">${T('a.reviewCln')}</button>` : `<button class="btn primary" id="aOk" ${short ? 'disabled' : ''}>${T('a.confirmSegs')}</button>`}</div>
      </div></div>`;
  $$('[data-cond]', el).forEach(r => r.onclick = () => selectCond(r.dataset.cond));
  $$('[data-jump]', el).forEach(r => r.onclick = (e) => { if (e.target.closest('[data-tog]')) return; const s = P.segs[+r.dataset.jump]; V.start = clampStart(Math.floor(s.t0 / V.tb) * V.tb); V.hover = +r.dataset.jump; redraw(); });
  $$('[data-tog]', el).forEach(b => b.onclick = () => { const i = +b.dataset.tog, ex = !S.cur[i]; setExcl(i, ex);
    A.addLog('who.c1', ex ? 'a.log.excl' : 'a.log.incl', { i: i + 1, a: fmt(P.segs[i].t0), b: fmt(P.segs[i].t1), cond: A.tk('condl.' + key) }); afterEdit(); });
  const rs = $('#aReset', el); if (rs) rs.onclick = () => { Object.keys(COND).forEach(k => { SEG[k] = { cur: plan(k).prop.slice() }; }); A.addLog('who.c1', 'a.log.reset'); A.toast(T('a.toast.reset')); afterEdit(); };
  const ok = $('#aOk', el); if (ok) ok.onclick = () => {
    const analysed = Object.fromEntries(Object.keys(COND).map(k => [k, totals(k).an]));
    A.state.segments = Object.assign(A.state.segments, { confirmed: true, changes: ch, analysed, at: A.time() });
    A.addLog('who.c1', 'a.log.confirm', { eo: analysed.EO, ec: analysed.EC, v: analysed.VCPT, n: ch });
    A.toast(T(ch ? 'a.toast.confChg' : 'a.toast.conf'));
    A.refresh();
  };
  const nx = $('#aNext', el); if (nx) nx.onclick = () => A.go('cleaning');
}
function afterEdit() {
  if (A.state.segments.confirmed) { A.state.segments.confirmed = false; A.toast(T('a.toast.segAgain')); A.refresh(); return; }
  redraw(); side();
}
const clampStart = (s) => Math.max(0, Math.min(Math.ceil(COND[V.cond].dur / V.tb) * V.tb - V.tb, s));
function page(d) { V.start = clampStart(V.start + d * V.tb); V.hover = null; redraw(); syncPager(); }
function syncPager() { const p = $('#aPrev'), n = $('#aNextP'); if (p) p.disabled = V.start <= 0; if (n) n.disabled = V.start + V.tb >= COND[V.cond].dur; }
function selectCond(k) { V.cond = k; V.start = 0; V.hover = null; $$('#aCond button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); redraw(); side(); syncPager(); }

A.css('a-workspace', `
.a-seg { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
@media (max-width: 1180px) { .a-seg { grid-template-columns: minmax(0, 1fr); } }
.a-seg .toolbar { border-radius: var(--r) var(--r) 0 0; }
.a-seg .toolbar select { max-width: 172px; }
.a-pg { margin-left: auto; display: inline-flex; gap: 4px; align-items: center; }
.a-box { overflow-x: auto; padding: 10px 12px 0; }
.a-box canvas { display: block; border-radius: 4px; touch-action: none; }
#aTr { cursor: pointer; }
#aStrip { cursor: ew-resize; }
.a-stat { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding: 6px 12px 8px; font-size: 12px; color: var(--muted); }
.a-stat b { color: var(--ink); font-weight: 600; }
.a-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 11.5px; color: var(--muted); }
.a-legend i, .a-sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; }
.a-xl { max-height: 300px; overflow: auto; border: 1px solid var(--line); border-radius: 6px; }
.a-xl .tbl td { padding: 5px 8px; } .a-xl .tbl tr:last-child td { border-bottom: 0; }
.a-tot td, .a-tot th { padding: 6px 8px; white-space: nowrap; }
.a-ttl { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.a-cl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 16px; align-items: start; }
@media (max-width: 1100px) { .a-cl { grid-template-columns: minmax(0, 1fr); } }
.a-icg { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
.a-ic { border: 1px solid var(--line); border-radius: 7px; background: var(--surface); padding: 6px 6px 5px; display: grid; gap: 2px; cursor: pointer; position: relative; min-width: 0; }
.a-ic:hover { border-color: var(--accent); }
.a-ic.sel { box-shadow: 0 0 0 2px var(--accent); border-color: var(--accent); }
.a-ic.rm { background: var(--warn-soft); border-color: transparent; }
.a-ic.rm .a-map { opacity: 0.72; }
.a-ic .a-map { background: var(--paper); border-radius: 5px; display: grid; place-items: center; padding: 2px 0; }
.a-ic .n { font-family: var(--f-mono); font-size: 11px; color: var(--muted); display: flex; justify-content: space-between; gap: 4px; white-space: nowrap; }
.a-ic .n > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.a-ic .lb { font-size: 12px; font-weight: 500; line-height: 1.25; min-height: 30px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.a-ic .pr { font-size: 11px; color: var(--muted); }
.a-ic label { font-size: 11.5px; display: flex; gap: 5px; align-items: center; cursor: pointer; }
.a-ic.rm label { color: var(--warn); font-weight: 600; }
.a-ic .chg { font-size: 10px; font-weight: 600; color: var(--amber); font-family: var(--f-ui); }
.a-det { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: start; }
@media (max-width: 560px) { .a-det { grid-template-columns: minmax(0, 1fr); } }
.a-fig { padding: 8px; }
.a-fig h4 { font-size: 12px; color: #55554f; font-weight: 600; margin: 0 0 4px; }
.a-pbs { display: grid; gap: 3px; max-width: 300px; }
.a-pb { display: grid; grid-template-columns: 96px minmax(0, 1fr) 36px; gap: 8px; align-items: center; font-size: 11.5px; color: var(--muted); }
.a-pb i { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; display: block; }
.a-pb b { display: block; height: 100%; background: var(--muted); border-radius: 3px; }
.a-pb.top { color: var(--ink); font-weight: 600; } .a-pb.top b { background: var(--accent); }
.a-pb .num { text-align: right; }
.a-tcs button { padding: 2px 8px; font-size: 11.5px; }
.a-ba-leg { display: inline-flex; gap: 12px; font-size: 12px; color: var(--muted); align-items: center; }
.a-ba-leg i { display: inline-block; width: 16px; height: 2px; vertical-align: 3px; margin-right: 5px; }
`);

window.Modules.segments = {
  render(root) {
    if (!A.state.segments.confirmed) A.state.segments.changes = allChanges();
    root.innerHTML = `<div class="a-seg">
      <div class="card">
        <div class="toolbar" role="toolbar" aria-label="${T('a.viewer')}">
          <div class="seg" id="aCond">${Object.keys(COND).map(k => `<button data-k="${k}" class="${V.cond === k ? 'on' : ''}">${T('cond.' + k)}</button>`).join('')}</div>
          <span class="sep"></span>
          <label>${T('a.montage')} <select id="aMont"><option>${T('a.avgRef')}</option><option disabled>${T('a.bipolar')}</option></select></label>
          <label>${T('a.gain')} <select id="aGain">${[3, 5, 7, 10, 15, 20, 30, 50].map(v => `<option value="${v}" ${v === V.gain ? 'selected' : ''}>${v} µV/mm</option>`).join('')}</select></label>
          <div class="seg" id="aTb" aria-label="${T('a.timebase')}">${[10, 20, 30].map(v => `<button data-v="${v}" class="${V.tb === v ? 'on' : ''}">${v} s</button>`).join('')}</div>
          <span class="sep"></span>
          <label>${T('a.hp')} <select id="aHp">${[[0, T('a.off')], [0.5, A.nf(0.5) + ' Hz'], [1, '1 Hz'], [1.6, A.nf(1.6) + ' Hz']].map(([v, l]) => `<option value="${v}" ${v === V.hp ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label>${T('a.lp')} <select id="aLp">${[[0, T('a.off')], [15, '15 Hz'], [30, '30 Hz'], [35, '35 Hz'], [45, '45 Hz']].map(([v, l]) => `<option value="${v}" ${v === V.lp ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label><input type="checkbox" id="aNotch" ${V.notch ? 'checked' : ''}> ${T('a.notch')}</label>
          <span class="xs muted" title="${T('a.dispOnlyT')}">${T('a.dispOnly')}</span>
          <span class="a-pg"><button class="btn sm" id="aPrev" aria-label="${T('a.prev')}">◀</button><button class="btn sm" id="aNextP" aria-label="${T('a.next')}">▶</button></span>
        </div>
        <div class="a-box paper" style="border:0;border-radius:0;background:var(--paper)"><canvas id="aTr" aria-label="${T('a.tracesAria')}"></canvas><canvas id="aStrip" style="margin-top:6px" aria-label="${T('a.stripAria')}"></canvas></div>
        <div class="a-stat" id="aStat"></div>
      </div>
      <div id="aSide"></div>
    </div>`;
    $$('#aCond button', root).forEach(b => b.onclick = () => selectCond(b.dataset.k));
    $('#aGain', root).onchange = e => { V.gain = +e.target.value; drawTraces(); };
    $$('#aTb button', root).forEach(b => b.onclick = () => { V.tb = +b.dataset.v; V.start = clampStart(Math.floor(V.start / V.tb) * V.tb); $$('#aTb button').forEach(x => x.classList.toggle('on', x === b)); redraw(); syncPager(); });
    $('#aHp', root).onchange = e => { V.hp = +e.target.value; drawTraces(); };
    $('#aLp', root).onchange = e => { V.lp = +e.target.value; drawTraces(); };
    $('#aNotch', root).onchange = e => { V.notch = e.target.checked; drawTraces(); };
    $('#aPrev', root).onclick = () => page(-1); $('#aNextP', root).onclick = () => page(1);
    const tr = $('#aTr', root), strip = $('#aStrip', root);
    tr.onpointerdown = e => {
      const i = segAt(e.offsetX); if (i == null) return;
      const ex = !segState(V.cond).cur[i]; drag = { ex, seen: new Set([i]) }; setExcl(i, ex); tr.setPointerCapture(e.pointerId); redraw();
    };
    tr.onpointermove = e => {
      const i = segAt(e.offsetX);
      if (drag && i != null && !drag.seen.has(i)) { drag.seen.add(i); setExcl(i, drag.ex); V.hover = i; redraw(); return; }
      if (i !== V.hover) { V.hover = i; drawTraces(); status(); }
    };
    tr.onpointerup = () => {
      if (!drag) return; const ids = [...drag.seen].sort((a, b) => a - b), P = plan(V.cond);
      A.addLog('who.c1', (drag.ex ? 'a.log.excl' : 'a.log.incl') + (ids.length > 1 ? 'N' : ''), { i: ids[0] + 1, j: ids[ids.length - 1] + 1, a: fmt(P.segs[ids[0]].t0), b: fmt(P.segs[ids[ids.length - 1]].t1), cond: A.tk('condl.' + V.cond) });
      drag = null; afterEdit();
    };
    tr.onpointerleave = () => { if (!drag && V.hover != null) { V.hover = null; drawTraces(); status(); } };
    let scrub = false;
    const jump = (e) => { const W = strip.clientWidth, t = (e.offsetX - 44) / (W - 54) * COND[V.cond].dur; V.start = clampStart(Math.floor(t / V.tb) * V.tb); redraw(); syncPager(); };
    strip.onpointerdown = e => { scrub = true; strip.setPointerCapture(e.pointerId); jump(e); };
    strip.onpointermove = e => { if (scrub) jump(e); };
    strip.onpointerup = () => { scrub = false; };
    keyH = e => {
      if (e.target.closest && e.target.closest('input, select, textarea, .dlg-back') || $('.dlg-back')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); page(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); page(-1); }
      else if (e.key === 'Home') { V.start = 0; redraw(); syncPager(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const o = [3, 5, 7, 10, 15, 20, 30, 50], j = o.indexOf(V.gain) + (e.key === 'ArrowUp' ? -1 : 1); if (o[j]) { V.gain = o[j]; $('#aGain').value = V.gain; drawTraces(); } }
    };
    window.addEventListener('keydown', keyH);
    ro = new ResizeObserver(() => redraw()); ro.observe($('.a-box', root));
    side(); redraw(); syncPager();
  },
  destroy() { if (keyH) window.removeEventListener('keydown', keyH); keyH = null; if (ro) ro.disconnect(); ro = null; drag = null; L = null; },
};

/* ================================ Cleaning tab ================================ */
const PROP = A.m2.quality.ica.proposed_removed;
const PROPSET = new Set(PROP.map(p => p.ic));
/* Classes as in ICLabel-style classifiers; proposal rule (mockup assumption): remove a component
   when its top class is eye, muscle, line noise or channel noise with 60 percent or more. */
const KL = ['Brain', 'Muscle', 'Eye', 'Line noise', 'Channel noise', 'Other'];
const KW = { Brain: 3, Muscle: 2, Eye: 1.5, 'Line noise': 0.6, 'Channel noise': 1, Other: 3 };
const om = (seed) => { const r = rng(seed * 131); const a = bm(U(r, -0.8, 0.8), U(r, -0.8, 0.8), U(r, 0.5, 0.8), [U(r, -1, 1), U(r, -1, 1), 0], 0.35), b = bm(U(r, -0.8, 0.8), U(r, -0.8, 0.8), 0.7, [0, 0, 0], 0.3);
  return n1(a.map((v, i) => v - 0.7 * b[i] + 0.28 * gauss(r))); };
/* 19 components in ICA order: explained variance (eyes open), largest first.
   [ic, label, type, forward map, target % of variance, class, p, second class, p2] */
const IC_DEF = [
  [1, 'Eye blinks', 'blink', FW.blink, 36.8, 'Eye', 0.97, 'Brain', 0.01],
  [2, 'Horizontal eye movements', 'hem', FW.hem, 13.1, 'Eye', 0.91, 'Brain', 0.04],
  [3, 'Posterior alpha', 'alpha', FW.alpha, 9.4, 'Brain', 0.94, 'Other', 0.03],
  [4, 'Parieto-occipital right', 'alpha', bm(0.4, -0.75, 0.6, [0.2, -0.3, 0]), 6.2, 'Brain', 0.9, 'Other', 0.05],
  [5, 'Frontal midline', 'theta', bm(0, 0.42, 0.45, [0, 0.2, 0], 0.42), 4.6, 'Brain', 0.84, 'Eye', 0.07],
  [6, 'Muscle, left temporal', 'muscle', FW.musL, 4.1, 'Muscle', 0.64, 'Brain', 0.19],
  [7, 'Central left', 'mu', FW.muL, 3.6, 'Brain', 0.82, 'Other', 0.08],
  [8, 'Central right', 'mu', FW.muR, 3.2, 'Brain', 0.79, 'Muscle', 0.09],
  [9, 'Electrode noise, T4', 'pop', FW.pop, 2.8, 'Channel noise', 0.46, 'Other', 0.27],
  [10, 'Occipital left', 'alpha2', bm(-0.35, -0.85, 0.6, [-0.6, 0, 0], 0.38), 2.5, 'Brain', 0.74, 'Other', 0.14],
  [11, 'Parietal midline', 'brain', bm(0, -0.45, 0.6), 2.2, 'Brain', 0.7, 'Other', 0.17],
  [12, 'Temporal right', 'brain', bm(0.9, -0.2, 0.62, [0, 0, 0.2]), 2.0, 'Brain', 0.58, 'Muscle', 0.24],
  [13, 'Frontal left', 'brain', bm(-0.45, 0.6, 0.6), 1.8, 'Brain', 0.56, 'Eye', 0.18],
  [14, 'Unclassified', 'other', om(14), 1.6, 'Other', 0.49, 'Brain', 0.3],
  [15, 'Central midline', 'brain', bm(0, 0.05, 0.6, [0, 0, 0], 0.42), 1.5, 'Brain', 0.53, 'Other', 0.29],
  [16, 'Unclassified', 'other', om(16), 1.4, 'Other', 0.52, 'Muscle', 0.2],
  [17, 'Frontal right', 'brain', bm(0.5, 0.55, 0.62, [0.2, 0, 0]), 1.2, 'Brain', 0.47, 'Other', 0.33],
  [18, 'Unclassified', 'other', om(18), 1.1, 'Other', 0.58, 'Line noise', 0.21],
  [19, 'Unclassified', 'other', om(19), 0.9, 'Other', 0.61, 'Channel noise', 0.19],
].map(([ic, label, type, fw, target, cls, p, c2, p2]) => {
  const pr = PROP.find(x => x.ic === ic); if (pr) p = pr.confidence;
  const rest = KL.filter(k => k !== cls && k !== c2), ws = rest.reduce((a, k) => a + KW[k], 0), probs = { [cls]: p, [c2]: p2 };
  rest.forEach(k => { probs[k] = (1 - p - p2) * KW[k] / ws; });
  return { ic, label: pr ? pr.kind.charAt(0).toUpperCase() + pr.kind.slice(1) : label, kind: pr ? pr.kind : label.toLowerCase(), cls, p, probs, type, fw, target };
});
const CW = 20, CN = CW * FS; /* 20 s of each resting condition for the component view */
let ICM = null;
const variance = (s) => { let m = 0, q = 0; for (let i = 0; i < s.length; i++) m += s[i]; m /= s.length; for (let i = 0; i < s.length; i++) q += (s[i] - m) ** 2; return q / s.length; };
function icModel() {
  if (ICM) return ICM;
  const r = rng(6060), EOev = plan('EO').ev.filter(e => e.t < CW);
  const ECev = [['muscle', 5.2, 12, 1.2], ['muscle', 14.8, 9, 0.8], ['pop', 9.3, 55], ['hem', 6.6, 14, 2.6], ['hem', 15.1, -12, 3.2]].map(([k, t, a, d]) => ({ k, t, a, d, side: 'L' }));
  /* artefact activations (uV at the map maximum): the same events as in the raw recording */
  const fromEv = (evs, type) => { const s = new Float32Array(CN), kind = { blink: 'blink', hem: 'hem', muscle: 'muscle', pop: 'pop' }[type];
    evs.forEach(e => { if (e.k !== kind || (kind === 'muscle' && e.side !== 'L')) return; const wv = wave(e); for (let i = 0; i < wv.v.length && wv.i0 + i < CN; i++) s[wv.i0 + i] += wv.v[i]; }); return s; };
  const add = (s, f, k) => { for (let i = 0; i < CN; i++) s[i] += k * f(i); return s; };
  /* brain activations with unit scale; oscillations wax and wane in spindles */
  const osc = (f, base, harm, cond) => { const s = new Float32Array(CN), env = slow(r, 0.35), jit = slow(r, 0.3), pk = pink(r); let ph = U(r, 0, 6);
    for (let i = 0; i < CN; i++) { ph += 2 * Math.PI * (f + 0.25 * jit()) / FS; const e = Math.max(0, base + 0.6 * env()) ** 1.6; s[i] = e * (Math.sin(ph) + harm * Math.sin(2 * ph + 0.6)) + 0.2 * pk(); } return s; };
  const act = (d, cond) => {
    const EC = cond === 'EC';
    switch (d.type) {
      case 'blink': { const s = EC ? new Float32Array(CN) : fromEv(EOev, 'blink'), dr = slow(r, 0.4); return add(s, () => dr(), EC ? 4 : 2); }
      case 'hem': { const s = fromEv(EC ? ECev : EOev, 'hem'), dr = slow(r, 0.2); return add(s, () => dr(), 1.5); }
      case 'muscle': { const s = fromEv(EC ? ECev : EOev, 'muscle'), w = new Float32Array(CN); const pk = pink(r); for (let i = 0; i < CN; i++) w[i] = gauss(r); biquad(w, hpCoef(26)); biquad(w, hpCoef(26)); return add(s, (i) => 3 * w[i] + 0.8 * pk(), 1); }
      case 'pop': { const s = fromEv(EC ? ECev : EOev, 'pop'), dr = slow(r, 0.08); return add(s, (i) => 3.1 * gauss(r) + 2 * dr(), 1); }
      case 'alpha': return osc(9 + U(r, -0.2, 0.2), EC ? 0.75 : 0.3, 0.08, cond).map(v => v * (EC ? 1.8 : 1));
      case 'alpha2': return osc(9.6, EC ? 0.6 : 0.1, 0.05, cond).map(v => v * (EC ? 1.6 : 1));
      case 'theta': return osc(6.1, -0.05, 0, cond);
      case 'mu': return osc(10.6, 0.25, 0.38, cond);
      case 'other': { const s = new Float32Array(CN), pk = pink(r); for (let i = 0; i < CN; i++) s[i] = 0.7 * gauss(r) + 0.6 * pk(); return s; }
      default: { const s = new Float32Array(CN), pk = pink(r), b = osc(U(r, 15, 22), -0.1, 0, cond); for (let i = 0; i < CN; i++) s[i] = pk() + 0.35 * b[i]; return s; }
    }
  };
  const comps = IC_DEF.map(d => { const w = avgref(d.fw), ss = w.reduce((a, v) => a + v * v, 0); return { ...d, w, ss, s: act(d, 'EO'), sEC: act(d, 'EC') }; });
  /* artefacts carry their own amplitude (uV); brain and other components are scaled to their share */
  const art = comps.filter(c => ['blink', 'hem', 'muscle', 'pop'].includes(c.type));
  const V = art.reduce((a, c) => a + variance(c.s) * c.ss, 0) / art.reduce((a, c) => a + c.target / 100, 0);
  comps.forEach(c => { if (art.includes(c)) return; const k = Math.sqrt(c.target / 100 * V / (variance(c.s) * c.ss)); c.s = c.s.map(v => v * k); c.sEC = c.sEC.map(v => v * k); });
  /* explained variance from the activations, rounded to 0.1 with the largest remainder so the column sums to 100 */
  const pv = comps.map(c => variance(c.s) * c.ss), tot = pv.reduce((a, b) => a + b, 0), raw = pv.map(v => v / tot * 1000), fl = raw.map(Math.floor);
  let left = 1000 - fl.reduce((a, b) => a + b, 0); raw.map((v, j) => [v - fl[j], j]).sort((a, b) => b[0] - a[0]).forEach(([, j]) => { if (left > 0) { fl[j]++; left--; } });
  comps.forEach((c, j) => {
    c.var = fl[j] / 10;
    /* map shown normalised, largest value positive (polarity is arbitrary in ICA) */
    const mx = c.w.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0); c.map = c.w.map(v => v / mx); c.peak = Math.abs(mx); c.sign = Math.sign(mx);
  });
  return (ICM = { comps });
}
function mix(chans, removed, from, len) {
  const { comps } = icModel();
  return chans.map(ch => { const c = CI[ch], out = new Float32Array(len); comps.forEach(k => { if (removed && removed.has(k.ic)) return; const w = k.w[c]; for (let i = 0; i < len; i++) out[i] += w * k.s[from + i]; }); return out; });
}
/* Welch power spectral density, Hann windows of 2 s, 50 percent overlap, in uV^2/Hz */
function spectrum(s) {
  const N = 256, hop = 128, F = []; for (let f = 1; f <= 45; f += 0.5) F.push(f);
  const P = F.map(() => 0), win = Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))), U2 = win.reduce((a, v) => a + v * v, 0);
  let nw = 0;
  for (let o = 0; o + N <= s.length; o += hop, nw++) {
    let m = 0; for (let i = 0; i < N; i++) m += s[o + i]; m /= N;
    F.forEach((f, j) => { const b = f * N / FS; let re = 0, im = 0; for (let i = 0; i < N; i++) { const v = (s[o + i] - m) * win[i], a = 2 * Math.PI * b * i / N; re += v * Math.cos(a); im -= v * Math.sin(a); } P[j] += 2 * (re * re + im * im) / (FS * U2); });
  }
  return { F, P: P.map(v => v / nw) };
}

const C = { sel: 1, removed: null, ba: 'overlay', win: 0, tc: 'EO', spec: {} };
const removedSet = () => { if (!C.removed) C.removed = new Set(PROPSET); return C.removed; };
const changes = () => icModel().comps.filter(c => removedSet().has(c.ic) !== PROPSET.has(c.ic)).map(c => ({ ic: c.ic, kind: c.kind, removed: removedSet().has(c.ic) }));
const pct = (p) => A.pct(p * 100, 0);
const icl = (c) => T('a.ic.' + c.ic);

function icCard(c) {
  const rm = removedSet().has(c.ic), chg = rm !== PROPSET.has(c.ic);
  return `<div class="a-ic ${rm ? 'rm' : ''} ${C.sel === c.ic ? 'sel' : ''}" data-ic="${c.ic}" tabindex="0" role="button" aria-pressed="${C.sel === c.ic}" aria-label="${A.esc(T('a.icAria', { ic: c.ic, label: icl(c) }))}">
    <div class="n"><span>IC ${c.ic}</span>${chg ? `<span class="chg" title="${T('a.chgMan')}">● ${T('a.changed')}</span>` : (PROPSET.has(c.ic) ? `<span title="${T('a.propT')}">${T('a.proposed')}</span>` : '')}</div>
    <div class="a-map"><canvas data-map="${c.ic}"></canvas></div>
    <div class="lb">${A.esc(icl(c))}</div>
    <div class="pr">${A.esc(T('a.cls.' + c.cls))} ${pct(c.p)} · ${A.pct(c.var, 1)}</div>
    <label><input type="checkbox" data-rm="${c.ic}" ${rm ? 'checked' : ''}> ${T('a.remove')}</label>
  </div>`;
}
function head() {
  const el = $('#aCHead'); if (!el) return;
  const ch = changes(), n = removedSet().size, st = A.state.cleaning, segOk = A.state.segments.confirmed;
  el.innerHTML = `<div class="a-ttl"><h2>${T('a.icaTitle')} ${A.ann('3.4 Clinician in control, Working')}${A.ann('I8')}</h2>
      <span class="small muted">${T('a.icaSum', { n, v: A.nf(icModel().comps.filter(c => removedSet().has(c.ic)).reduce((a, c) => a + c.var, 0), 1), list: [...PROPSET].join(', ') })}</span>
      ${ch.length ? `<span class="chip amber"><span class="d"></span>${T('a.chgManN', { n: ch.map(c => T(c.removed ? 'a.icRm' : 'a.icKept', { ic: c.ic })).join(', ') })}</span>` : `<span class="chip device">${T('a.asProp')}</span>`}
      ${st.confirmed ? `<span class="chip ok">${T('a.accepted')}</span>` : ''}</div>
    <div class="row">${ch.length ? `<button class="btn ghost sm" id="aCReset">${T('a.reset')}</button>` : ''}<button class="btn danger" id="aRej">${T('a.reject')}</button>
      <button class="btn primary" id="aAcc" ${segOk ? '' : `disabled title="${T('a.confFirst')}"`}>${T(st.confirmed ? 'a.accAgain' : 'a.accept')}</button></div>`;
  const rs = $('#aCReset'); if (rs) rs.onclick = () => { C.removed = new Set(PROPSET); A.addLog('who.c1', 'a.log.icaReset'); refreshAll(); };
  $('#aRej').onclick = reject;
  $('#aAcc').onclick = accept;
}
function accept() {
  const ch = changes(), n = removedSet().size;
  ch.forEach(c => A.addLog('who.c1', c.removed ? 'a.log.icRm' : 'a.log.icKept', { ic: c.ic, kind: A.tk('a.ic.' + c.ic, null, { lc: true }) }));
  A.state.cleaning = { confirmed: true, changed: ch, removedCount: n };
  A.addLog('who.c1', 'a.log.accept', { n, chg: ch.length });
  A.toast(T(ch.length ? 'a.toast.accChg' : 'a.toast.acc'));
  A.go('results');
}
function reject() {
  A.dialog({ title: T('a.reject'), ok: T('a.reject'), body: `
    <div class="field"><span>${T('a.reason')}</span><select id="aRjR">${['many', 'elec', 'proto', 'coop', 'other'].map(k => `<option value="${k}">${T('a.rj.' + k)}</option>`).join('')}</select></div>
    <div class="field"><span>${T('a.note')}</span><textarea id="aRjN" rows="3" placeholder="${T('a.notePh')}"></textarea></div>
    <p class="xs muted" style="margin:0">${T('a.rjInfo')}</p>`,
    onOk: (back) => {
      const why = $('#aRjR', back).value, note = $('#aRjN', back).value.trim();
      A.addLog('who.c1', 'a.log.reject', { d: { $d: A.m2.date }, why: A.tk('a.rj.' + why), note: note ? ' (' + note + ')' : '' });
      A.toast(T('a.toast.reject'));
    } });
}
function grid() {
  const el = $('#aGrid'); if (!el) return;
  el.innerHTML = icModel().comps.map(icCard).join('');
  icModel().comps.forEach(c => A.topo($(`[data-map="${c.ic}"]`, el), c.map, { size: 76, lim: 1 }));
  $$('.a-ic', el).forEach(card => {
    const pick = () => { C.sel = +card.dataset.ic; $$('.a-ic', el).forEach(x => { x.classList.toggle('sel', x === card); x.setAttribute('aria-pressed', x === card); }); detail(); };
    card.onclick = (e) => { if (e.target.closest('label')) return; pick(); };
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
  });
  $$('[data-rm]', el).forEach(cb => cb.onchange = () => toggle(+cb.dataset.rm, cb.checked));
}
function toggle(ic, rm) {
  const s = removedSet(); if (rm) s.add(ic); else s.delete(ic);
  if (A.state.cleaning.confirmed) { A.state.cleaning.confirmed = false; A.toast(T('a.toast.clnAgain')); C.sel = ic; A.refresh(); return; }
  C.sel = ic; refreshAll();
}
function refreshAll() { head(); grid(); detail(); before(); }

const mapBar = () => `<div style="display:grid;gap:2px;width:170px;margin-top:4px">
  <div style="height:8px;border-radius:2px;background:linear-gradient(90deg,${[-3, -2, -1, 0, 1, 2, 3].map(z => A.zColor(z)).join(',')})"></div>
  <div class="mono xs" style="display:flex;justify-content:space-between;color:#55554f"><span>-1</span><span>0</span><span>+1</span></div>
  <div class="xs" style="color:#55554f">${T('a.mapUnit')}</div></div>`;
function detail() {
  const el = $('#aDet'); if (!el) return;
  const c = icModel().comps.find(k => k.ic === C.sel), rm = removedSet().has(c.ic), pr = PROPSET.has(c.ic);
  const pk = CH[c.map.indexOf(1)], cond = C.tc, ws = C.win * 10;
  const bars = KL.map(k => [k, c.probs[k]]).sort((a, b) => b[1] - a[1]).map(([k, p]) => `<div class="a-pb${k === c.cls ? ' top' : ''}"><span>${T('a.cls.' + k)}</span><i><b style="width:${Math.max(1, p * 100).toFixed(1)}%"></b></i><span class="num">${pct(p)}</span></div>`).join('');
  el.innerHTML = `<div class="hd"><h2>IC ${c.ic} · ${A.esc(icl(c))}</h2><div class="row">${rm !== pr ? `<span class="chip amber">${T('a.chgMan')}</span>` : ''}<button class="btn sm ${rm ? '' : 'danger'}" id="aDetT">${T(rm ? 'a.keepComp' : 'a.rmComp')}</button></div></div>
    <div class="bd" style="display:grid;gap:12px">
      <div class="a-det"><div class="paper a-fig"><canvas id="aDetMap"></canvas>${mapBar()}</div>
        <div style="display:grid;gap:10px;align-content:start"><dl class="kv"><dt>${T('a.expVar')}</dt><dd class="num">${A.pct(c.var, 1)} <span class="muted small">${T('a.rank', { r: c.ic })}</span></dd>
          <dt>${T('a.proposal')}</dt><dd><span class="chip device">${T(pr ? 'a.remove' : 'a.keep')}</span></dd><dt>${T('a.yourChoice')}</dt><dd>${rm ? `<span class="chip warn">${T('a.remove')}</span>` : `<span class="chip clinician">${T('a.keep')}</span>`}</dd>
          <dt>${T('a.strongest')}</dt><dd class="mono">${CH.map((ch, i) => [ch, c.map[i]]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).join(', ')}</dd></dl>
          <div><div class="xs muted" style="margin-bottom:4px">${T('a.classifier')} ${A.ann('Mockup assumption: ICLabel-style classes; the proposal removes a component whose top class is eye, muscle, line noise or channel noise at 60 percent or more')}</div><div class="a-pbs">${bars}</div></div></div></div>
      <div class="paper a-fig"><div class="row between" style="margin-bottom:2px"><h4 style="margin:0">${T('a.activation', { cond: T('condl.' + cond), a: fmt(ws), b: fmt(ws + 10) })}</h4>
        <div class="seg a-tcs" id="aTcC">${['EO', 'EC'].map(k => `<button data-k="${k}" class="${cond === k ? 'on' : ''}">${T('cond.' + k)}</button>`).join('')}</div></div><canvas id="aDetTc"></canvas></div>
      <div class="paper a-fig"><h4>${T('a.psd', { ch: pk })}</h4><canvas id="aDetSp"></canvas></div>
    </div>`;
  A.topo($('#aDetMap', el), c.map, { size: 170, names: true, lim: 1 });
  $('#aDetT', el).onclick = () => toggle(c.ic, !rm);
  $$('#aTcC button', el).forEach(b => b.onclick = () => { C.tc = b.dataset.k; detail(); });
  const wTc = Math.max(300, $('#aDetTc', el).parentElement.clientWidth - 16);
  /* activation: same scale for both conditions so eyes closed alpha shows as larger */
  { const cv = $('#aDetTc', el), H = 96, g = setupCanvas(cv, wTc, H), n = 10 * FS, s = cond === 'EO' ? c.s : c.sEC, o = C.win * n, sg = c.sign;
    const am = (q) => { let m = 1e-6; for (let i = 0; i < CN; i++) m = Math.max(m, Math.abs(q[i])); return m; }, mx = Math.max(am(c.s), 0.75 * am(c.sEC));
    g.strokeStyle = GRID; g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED;
    for (let t = 0; t <= 10; t++) { const x = crisp(8 + t / 10 * (wTc - 16)); g.beginPath(); g.moveTo(x, 4); g.lineTo(x, H - 14); g.stroke(); if (t % 2 === 0) g.fillText(fmt(ws + t), Math.min(wTc - 30, Math.max(0, x - 12)), H - 2); }
    g.save(); g.beginPath(); g.rect(0, 2, wTc, H - 16); g.clip(); g.strokeStyle = INK; g.lineWidth = 0.9; g.beginPath();
    for (let i = 0; i < n; i++) { const x = 8 + i / n * (wTc - 16), y = (H - 14) / 2 + 2 - sg * s[o + i] / mx * ((H - 22) / 2); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); g.restore(); }
  /* spectrum of the component projected to its strongest channel */
  { const cv = $('#aDetSp', el), H = 130, g = setupCanvas(cv, wTc, H), sp = C.spec[c.ic] || (C.spec[c.ic] = spectrum(c.s.map(v => v * c.peak)));
    const db = sp.P.map(v => 10 * Math.log10(v + 1e-6)), hi = Math.ceil(Math.max(...db) / 10) * 10, lo = Math.min(hi - 30, Math.floor(Math.min(...db) / 10) * 10);
    const X0 = 34, PW = wTc - X0 - 8, PH = H - 28, x = (f) => X0 + (f - 1) / 44 * PW, y = (d) => 6 + (hi - d) / (hi - lo) * PH;
    g.fillStyle = 'rgba(19,94,125,0.06)'; g.fillRect(x(8), 6, x(12) - x(8), PH);
    g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.strokeStyle = GRID;
    for (let d = lo; d <= hi; d += 10) { g.beginPath(); g.moveTo(X0, crisp(y(d))); g.lineTo(X0 + PW, crisp(y(d))); g.stroke(); g.fillText(String(d), 4, y(d) + 3); }
    [1, 10, 20, 30, 40].forEach(f => { g.fillText(f + (f === 40 ? ' Hz' : ''), x(f) - 4, H - 8); });
    g.fillText(T('a.alphaBand'), x(8) + 3, 16);
    g.beginPath(); sp.F.forEach((f, j) => { if (j) g.lineTo(x(f), y(db[j])); else g.moveTo(x(f), y(db[j])); });
    g.strokeStyle = '#135e7d'; g.lineWidth = 1.6; g.stroke(); g.lineWidth = 1; }
}

const BA_CH = ['Fp1', 'Fp2', 'F7', 'F8', 'T3', 'T4'];
function before() {
  const el = $('#aBA'); if (!el) return;
  const cv = $('#aBAc', el), W = Math.max(640, cv.parentElement.clientWidth - 2), ROW = 46, TOP = 6, H = TOP + ROW * BA_CH.length + 20, GUT = 44, PW = W - GUT - 56, len = 10 * FS, from = C.win * len;
  const g = setupCanvas(cv, W, H), b = mix(BA_CH, null, from, len), a = mix(BA_CH, removedSet(), from, len), k = PX_MM / 15;
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.strokeStyle = GRID;
  for (let t = 0; t <= 10; t++) { const x = crisp(GUT + t / 10 * PW); g.beginPath(); g.moveTo(x, TOP); g.lineTo(x, H - 16); g.stroke(); g.fillText(fmt(C.win * 10 + t), Math.min(W - 26, x - 10), H - 4); }
  const line = (s, y0, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i < len; i++) { const x = GUT + i / len * PW, y = y0 - s[i] * k; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); };
  g.save(); g.beginPath(); g.rect(GUT, 0, PW, H - 16); g.clip();
  BA_CH.forEach((ch, j) => { const y0 = TOP + ROW * (j + 0.5);
    if (C.ba !== 'after') line(b[j], y0, C.ba === 'overlay' ? 'rgba(196,62,48,0.75)' : INK, 0.9);
    if (C.ba !== 'before') line(a[j], y0, INK, 1); });
  g.restore(); g.lineWidth = 1;
  g.font = '500 11px IBM Plex Mono, monospace'; g.fillStyle = INK; g.textAlign = 'right'; BA_CH.forEach((ch, j) => g.fillText(ch, GUT - 8, TOP + ROW * (j + 0.5) + 4)); g.textAlign = 'left';
  calib(g, GUT + PW + 10, H - 18, 100 * k, 0);
}

window.Modules.cleaning = {
  render(root) {
    removedSet();
    const segOk = A.state.segments.confirmed;
    root.innerHTML = `<div class="grid" style="gap:14px">
      ${segOk ? '' : `<div class="banner amber"><b>${T('a.segNot')}</b><span style="flex:1">${T('a.segNotText')}</span><button class="btn sm" id="aGoSeg">${T('a.openRec')}</button></div>`}
      <div class="row between" id="aCHead"></div>
      <div class="a-cl">
        <div class="card"><div class="hd"><h3>${T('a.components')}</h3><span class="xs muted">${T('a.compSub')}</span></div><div class="bd"><div class="a-icg" id="aGrid"></div></div></div>
        <div class="card" id="aDet"></div>
      </div>
      <div class="card" id="aBA"><div class="hd"><h3>${T('a.ba')}</h3>
        <div class="row"><span class="a-ba-leg"><span><i style="background:rgba(196,62,48,0.75)"></i>${T('a.before')}</span><span><i style="background:${INK};outline:1px solid var(--line-2)"></i>${T('a.after')}</span></span>
          <div class="seg" id="aBaM">${[['overlay', 'a.overlay'], ['before', 'a.before'], ['after', 'a.after']].map(([k, l]) => `<button data-k="${k}" class="${C.ba === k ? 'on' : ''}">${T(l)}</button>`).join('')}</div>
          <div class="seg" id="aBaW"><button data-w="0" class="${C.win === 0 ? 'on' : ''}">0:00 ${T('to')} 0:10</button><button data-w="1" class="${C.win === 1 ? 'on' : ''}">0:10 ${T('to')} 0:20</button></div>
          <span class="xs muted">${T('cond.EO')} · 15 µV/mm</span></div></div>
        <div class="paper scroll-x" style="margin:10px 12px 12px;padding:4px 0"><canvas id="aBAc" aria-label="${T('a.baAria')}"></canvas></div></div>
    </div>`;
    const gs = $('#aGoSeg', root); if (gs) gs.onclick = () => A.go('segments');
    $$('#aBaM button', root).forEach(b => b.onclick = () => { C.ba = b.dataset.k; $$('#aBaM button').forEach(x => x.classList.toggle('on', x === b)); before(); });
    $$('#aBaW button', root).forEach(b => b.onclick = () => { C.win = +b.dataset.w; $$('#aBaW button').forEach(x => x.classList.toggle('on', x === b)); before(); detail(); });
    refreshAll();
    let last = 0;
    ro = new ResizeObserver(() => { const w = root.clientWidth; if (Math.abs(w - last) > 4) { last = w; detail(); before(); } }); ro.observe(root);
  },
  destroy() { if (ro) ro.disconnect(); ro = null; },
};
exportSeg();
