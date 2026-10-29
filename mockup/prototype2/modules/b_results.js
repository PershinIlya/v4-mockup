/* Module B: workspace tab "Results" (analysis sections) and the page "Compare measurements".
   All figures draw from the synthetic case in APP.m2 / APP.m1 on light .paper surfaces with the
   fixed z scale. Screen text is product copy; system text comes only from APP.sentences. */
const A = window.APP, T = A.t;
A.addI18n({
  en: {
    'b.logScale': 'µV²/Hz, log scale', 'b.patient': 'Patient', 'b.normBand': 'Norm mean ± 2 SD',
    'b.s.summary': 'Summary', 'b.s.spectra': 'Spectra and maps', 'b.s.ratios': 'Ratios and indices', 'b.s.asym': 'Asymmetry', 'b.s.coh': 'Coherence',
    'b.s.erp': 'Channel ERPs', 'b.s.vcpt': 'VCPT behaviour', 'b.s.markers': 'Frequency markers',
    'b.o.ai': 'AI interpretation', 'b.o.quest': 'Questionnaires', 'b.o.sloreta': 'sLORETA source maps', 'b.o.icaerp': 'ICA component ERPs, ERPC2',
    'b.o.micro': 'Microstates, vigilance, foundation indices', 'b.o.clf': 'Classifier (legacy)', 'b.o.spike': 'Spike detection',
    'b.o.later': 'Later module', 'b.o.q4': 'Open question Q4', 'b.o.open': 'Open', 'b.o.licence': 'Later modules, under licence',
    'b.toConfirm': 'to confirm', 'b.beyond2': 'Values beyond 2 z', 'b.results': 'Results', 'b.notRelease': 'Not in this release',
    'b.condAria': 'Condition', 'b.measAria': 'Measure', 'b.abs': 'Absolute', 'b.rel': 'Relative', 'b.meta': '{sw} · {norms} · age {a} y',
    'b.fixed': 'Fixed sentences', 'b.offOpen': 'Not decided yet: core or a later module.', 'b.offStudy': 'Available only within a clinical study until certified.',
    'b.studyAccess': 'Request study access',
    'b.r.spectra': 'Band power (absolute and relative)', 'b.r.erp': 'Channel ERP peaks', 'b.largest': 'Largest deviations from the age norm',
    'b.compared': 'Values compared with the norm', 'b.both': 'both conditions', 'b.section': 'Section', 'b.values': 'Values', 'b.openArrow': 'Open ›',
    'b.quality': 'Signal quality', 'b.cleaning': 'Cleaning', 'b.limits': 'Limits', 'b.absPow': 'absolute power', 'b.relPow': 'relative power',
    'b.bandMaps': 'Band maps · {m} · {cond}', 'b.clickMap': 'Click a map or electrode to select a channel', 'b.mapAria': '{b} map',
    'b.specAria': 'Power spectrum of the selected channel', 'b.readHelp': 'Move over the curve to read values · click to select a 1 Hz bin',
    'b.zByCh': 'z by channel and band', 'b.hzMaps': '1 Hz maps · absolute power, z', 'b.hzHelp': 'Click a map to mark its bin on the spectrum',
    'b.rangeHz': '{a} to {b} Hz', 'b.sentsCond': 'Sentences · {cond}', 'b.sents': 'Sentences', 'b.ch': 'Ch', 'b.atCh': '{b} at {c}: {v}',
    'b.specT': 'Spectrum · {ch} · {cond}', 'b.selHz': 'Selected {a} to {b} Hz',
    'b.readSpec': '{ch} · {f} Hz · patient {p} µV²/Hz · norm mean {m} · z {z}',
    'b.tbr': 'Theta/beta ratio', 'b.faa': 'Frontal alpha asymmetry index', 'b.apf': 'Alpha peak frequency', 'b.sd': '(SD {v})', 'b.table': 'Table',
    'b.measure': 'Measure', 'b.site': 'Site', 'b.condition': 'Condition', 'b.value': 'Value', 'b.normMean': 'Norm mean',
    'b.asymPairs': 'Left and right pairs by band · {cond}', 'b.asymHelp': 'Line colour: z of the pair · click a head to select a band', 'b.asymAria': '{b} asymmetry',
    'b.zByPair': 'z by pair and band', 'b.pair': 'Pair', 'b.idxT': '{b} {p}: index {v}', 'b.nOf48': '{n} of 48 values with |z| ≥ 2', 'b.asymIdx': 'Asymmetry index',
    'b.asymNone': 'No sentence: no pair deviates by 2 z or more in this condition.',
    'b.onlyBeyond': 'Table: beyond threshold only', 'b.global': 'Global coherence', 'b.coreConf': 'Core, to confirm', 'b.cohAria': 'Coherence pairs beyond the threshold',
    'b.aboveNorm': 'above norm', 'b.belowNorm': 'below norm', 'b.width': 'width: |z|', 'b.cohCount': '{n} coherence values: 171 pairs × 6 bands × 2 conditions.',
    'b.cohN': '{n} of 171 pairs with |z| ≥ {t} · {b} · {cond}', 'b.clickEl': 'Click an electrode to filter', 'b.coherence': 'Coherence', 'b.noPair': 'No pair at this threshold',
    'b.trialsAcc': '{a} of {n} trials accepted', 'b.scale': 'Scale ±{s} µV · -200 to 800 ms', 'b.peakZ': 'peak |z| ≥ 2', 'b.erpAria': 'Enlarged channel ERP',
    'b.component': 'Component', 'b.amplitude': 'Amplitude', 'b.latency': 'Latency', 'b.noComp': 'No components scored for this trial type',
    'b.msFrom': 'ms from the second picture', 'b.uvUp': 'µV, positive up', 'b.readErp': '{t} ms · patient {p} µV · norm {m} ± {s}',
    'b.om': 'Omission errors', 'b.cm': 'Commission errors', 'b.rt': 'Mean reaction time', 'b.rtsd': 'Reaction time variability (SD)', 'b.ofGo': 'of {n} Go',
    'b.ofNoGo': 'of {n} NoGo', 'b.goTrials': 'Go trials', 'b.percentile': 'Percentile', 'b.percT': 'Percentile {p}', 'b.epb': 'Errors per block',
    'b.epbSub': '10 blocks of 40 trials · omission and commission errors', 'b.block': 'block',
    'b.apTitle': 'Alpha peak · eyes closed · posterior mean ({list})', 'b.mkAria': 'Posterior spectrum with the alpha peak marker; arrow keys move the marker',
    'b.mkDown': 'Move marker down {v} Hz', 'b.mkUp': 'Move marker up {v} Hz', 'b.mkReset': 'Reset to suggestion', 'b.mkHelp': 'Drag the marker or use the arrow keys.',
    'b.suggested': 'Suggested', 'b.marker': 'Marker', 'b.confirmedL': 'Confirmed', 'b.norm': 'Norm', 'b.mkNorm': '{m} Hz, SD {s}',
    'b.mkConfBy': '✓ Confirmed by Clinician 1 · {hz} Hz', 'b.change': 'Change', 'b.confirmHz': 'Confirm {hz} Hz',
    'b.log.mkMoved': 'Moved the alpha peak marker (eyes closed) from the suggested {a} Hz to {b} Hz and confirmed it',
    'b.log.mkConf': 'Confirmed the suggested alpha peak marker (eyes closed) at {a} Hz', 'b.toast.mk': 'Alpha peak marker confirmed at {a} Hz',
    'b.log.mkOpen': 'Reopened the alpha peak marker for changes',
    'b.railAria': 'Result sections', 'b.prelim': 'Preliminary', 'b.prelimText': 'Cleaning not accepted yet.', 'b.openCln': 'Open Cleaning', 'b.viewAria': 'Result view',
    'c.g.band': 'Band power at {ch} · {m} · {cond}', 'c.absolute': 'absolute', 'c.relative': 'relative', 'c.tbr': 'Theta/beta ratio, Cz · {cond}',
    'c.faa': 'Frontal alpha asymmetry index · {cond}', 'c.apf': 'Alpha peak frequency · {cond}',
    'c.g.coh': 'Coherence · {cond} · pairs with |z| ≥ 3 in either measurement · global coherence: core, to confirm', 'c.glob': '{b} global coherence',
    'c.amp': '{c} amplitude, {site} · {trial}', 'c.headMeta': 'Age {a} y · {sw} · {norms}', 'c.reproc': 'Reprocessed {d}', 'c.current': 'Current',
    'c.title': 'Compare measurements', 'c.sub': 'each measurement against its own age norm', 'c.reprocB': 'Reprocessed',
    'c.reprocText': 'The recording of {d} was processed again with the current software and norms. Differences between the two measurements are not tested.',
    'c.channel': 'Channel', 'c.clickBoth': 'Click a map to select a channel in both', 'c.mapAria': '{b} map {d}', 'c.selected': 'Selected measures',
    'c.selSub': 'Value and z, each against its own norm', 'c.comparison': 'Comparison',
  },
  de: {
    'b.logScale': 'µV²/Hz, logarithmisch', 'b.patient': 'Patient', 'b.normBand': 'Normmittelwert ± 2 SD',
    'b.s.summary': 'Zusammenfassung', 'b.s.spectra': 'Spektren und Karten', 'b.s.ratios': 'Quotienten und Indizes', 'b.s.asym': 'Asymmetrie', 'b.s.coh': 'Kohärenz',
    'b.s.erp': 'Kanal-ERPs', 'b.s.vcpt': 'VCPT-Aufgabenleistung', 'b.s.markers': 'Frequenzmarker',
    'b.o.ai': 'KI-Interpretation', 'b.o.quest': 'Fragebögen', 'b.o.sloreta': 'sLORETA-Quellenkarten', 'b.o.icaerp': 'ERPs der ICA-Komponenten, ERPC2',
    'b.o.micro': 'Mikrozustände, Vigilanz, Basisindizes', 'b.o.clf': 'Klassifikator (Altsystem)', 'b.o.spike': 'Spike-Erkennung',
    'b.o.later': 'Späteres Modul', 'b.o.q4': 'Offene Frage Q4', 'b.o.open': 'Offen', 'b.o.licence': 'Spätere Module, unter Lizenz',
    'b.toConfirm': 'zu bestätigen', 'b.beyond2': 'Werte jenseits von 2 z', 'b.results': 'Ergebnisse', 'b.notRelease': 'Nicht in dieser Version',
    'b.condAria': 'Bedingung', 'b.measAria': 'Messgröße', 'b.abs': 'Absolut', 'b.rel': 'Relativ', 'b.meta': '{sw} · {norms} · Alter {a} J.',
    'b.fixed': 'Feste Sätze', 'b.offOpen': 'Noch nicht entschieden: Kern oder späteres Modul.', 'b.offStudy': 'Bis zur Zertifizierung nur im Rahmen einer klinischen Studie verfügbar.',
    'b.studyAccess': 'Studienzugang anfragen',
    'b.r.spectra': 'Bandleistung (absolut und relativ)', 'b.r.erp': 'Kanal-ERP-Peaks', 'b.largest': 'Größte Abweichungen von der Altersnorm',
    'b.compared': 'Mit der Norm verglichene Werte', 'b.both': 'beide Bedingungen', 'b.section': 'Abschnitt', 'b.values': 'Werte', 'b.openArrow': 'Öffnen ›',
    'b.quality': 'Signalqualität', 'b.cleaning': 'Bereinigung', 'b.limits': 'Hinweise', 'b.absPow': 'absolute Leistung', 'b.relPow': 'relative Leistung',
    'b.bandMaps': 'Bandkarten · {m} · {cond}', 'b.clickMap': 'Karte oder Elektrode anklicken, um einen Kanal zu wählen', 'b.mapAria': '{b}-Karte',
    'b.specAria': 'Leistungsspektrum des gewählten Kanals', 'b.readHelp': 'Über die Kurve fahren, um Werte abzulesen · klicken, um ein 1-Hz-Intervall zu wählen',
    'b.zByCh': 'z nach Kanal und Band', 'b.hzMaps': '1-Hz-Karten · absolute Leistung, z', 'b.hzHelp': 'Karte anklicken, um ihr Intervall im Spektrum zu markieren',
    'b.rangeHz': '{a} bis {b} Hz', 'b.sentsCond': 'Sätze · {cond}', 'b.sents': 'Sätze', 'b.ch': 'Kanal', 'b.atCh': '{b} an {c}: {v}',
    'b.specT': 'Spektrum · {ch} · {cond}', 'b.selHz': 'Ausgewählt: {a} bis {b} Hz',
    'b.readSpec': '{ch} · {f} Hz · Patient {p} µV²/Hz · Normmittelwert {m} · z {z}',
    'b.tbr': 'Theta/Beta-Quotient', 'b.faa': 'Frontaler Alpha-Asymmetrieindex', 'b.apf': 'Alpha-Peak-Frequenz', 'b.sd': '(SD {v})', 'b.table': 'Tabelle',
    'b.measure': 'Messgröße', 'b.site': 'Ort', 'b.condition': 'Bedingung', 'b.value': 'Wert', 'b.normMean': 'Normmittelwert',
    'b.asymPairs': 'Linke und rechte Paare nach Band · {cond}', 'b.asymHelp': 'Linienfarbe: z des Paars · Kopf anklicken, um ein Band zu wählen', 'b.asymAria': '{b}-Asymmetrie',
    'b.zByPair': 'z nach Paar und Band', 'b.pair': 'Paar', 'b.idxT': '{b} {p}: Index {v}', 'b.nOf48': '{n} von 48 Werten mit |z| ≥ 2', 'b.asymIdx': 'Asymmetrieindex',
    'b.asymNone': 'Kein Satz: In dieser Bedingung weicht kein Paar um 2 z oder mehr ab.',
    'b.onlyBeyond': 'Tabelle: nur jenseits der Schwelle', 'b.global': 'Globale Kohärenz', 'b.coreConf': 'Kern, zu bestätigen', 'b.cohAria': 'Kohärenzpaare jenseits der Schwelle',
    'b.aboveNorm': 'über der Norm', 'b.belowNorm': 'unter der Norm', 'b.width': 'Breite: |z|', 'b.cohCount': '{n} Kohärenzwerte: 171 Paare × 6 Bänder × 2 Bedingungen.',
    'b.cohN': '{n} von 171 Paaren mit |z| ≥ {t} · {b} · {cond}', 'b.clickEl': 'Elektrode anklicken, um zu filtern', 'b.coherence': 'Kohärenz', 'b.noPair': 'Kein Paar bei dieser Schwelle',
    'b.trialsAcc': '{a} von {n} Durchgängen akzeptiert', 'b.scale': 'Skala ±{s} µV · -200 bis 800 ms', 'b.peakZ': 'Peak |z| ≥ 2', 'b.erpAria': 'Vergrößertes Kanal-ERP',
    'b.component': 'Komponente', 'b.amplitude': 'Amplitude', 'b.latency': 'Latenz', 'b.noComp': 'Für diesen Durchgangstyp keine Komponenten ausgewertet',
    'b.msFrom': 'ms ab dem zweiten Bild', 'b.uvUp': 'µV, positiv nach oben', 'b.readErp': '{t} ms · Patient {p} µV · Norm {m} ± {s}',
    'b.om': 'Auslassungsfehler', 'b.cm': 'Fehlreaktionen (Kommissionsfehler)', 'b.rt': 'Mittlere Reaktionszeit', 'b.rtsd': 'Variabilität der Reaktionszeit (SD)', 'b.ofGo': 'von {n} Go',
    'b.ofNoGo': 'von {n} NoGo', 'b.goTrials': 'Go-Durchgänge', 'b.percentile': 'Perzentil', 'b.percT': 'Perzentil {p}', 'b.epb': 'Fehler je Block',
    'b.epbSub': '10 Blöcke zu je 40 Durchgängen · Auslassungsfehler und Fehlreaktionen', 'b.block': 'Block',
    'b.apTitle': 'Alpha-Peak · Augen geschlossen · posteriorer Mittelwert ({list})', 'b.mkAria': 'Posteriores Spektrum mit dem Alpha-Peak-Marker; die Pfeiltasten verschieben den Marker',
    'b.mkDown': 'Marker um {v} Hz nach unten', 'b.mkUp': 'Marker um {v} Hz nach oben', 'b.mkReset': 'Auf Vorschlag zurücksetzen', 'b.mkHelp': 'Marker ziehen oder die Pfeiltasten verwenden.',
    'b.suggested': 'Vorschlag', 'b.marker': 'Marker', 'b.confirmedL': 'Bestätigt', 'b.norm': 'Norm', 'b.mkNorm': '{m} Hz, SD {s}',
    'b.mkConfBy': '✓ Bestätigt von Kliniker 1 · {hz} Hz', 'b.change': 'Ändern', 'b.confirmHz': '{hz} Hz bestätigen',
    'b.log.mkMoved': 'Alpha-Peak-Marker (Augen geschlossen) vom Vorschlag {a} Hz auf {b} Hz verschoben und bestätigt',
    'b.log.mkConf': 'Vorgeschlagenen Alpha-Peak-Marker (Augen geschlossen) bei {a} Hz bestätigt', 'b.toast.mk': 'Alpha-Peak-Marker bei {a} Hz bestätigt',
    'b.log.mkOpen': 'Alpha-Peak-Marker für Änderungen wieder geöffnet',
    'b.railAria': 'Ergebnisabschnitte', 'b.prelim': 'Vorläufig', 'b.prelimText': 'Bereinigung noch nicht übernommen.', 'b.openCln': 'Bereinigung öffnen', 'b.viewAria': 'Ergebnisansicht',
    'c.g.band': 'Bandleistung an {ch} · {m} · {cond}', 'c.absolute': 'absolut', 'c.relative': 'relativ', 'c.tbr': 'Theta/Beta-Quotient, Cz · {cond}',
    'c.faa': 'Frontaler Alpha-Asymmetrieindex · {cond}', 'c.apf': 'Alpha-Peak-Frequenz · {cond}',
    'c.g.coh': 'Kohärenz · {cond} · Paare mit |z| ≥ 3 in einer der Messungen · globale Kohärenz: Kern, zu bestätigen', 'c.glob': 'Globale {b}-Kohärenz',
    'c.amp': '{c}-Amplitude, {site} · {trial}', 'c.headMeta': 'Alter {a} J. · {sw} · {norms}', 'c.reproc': 'Neu verarbeitet am {d}', 'c.current': 'Aktuell',
    'c.title': 'Messungen vergleichen', 'c.sub': 'jede Messung gegen ihre eigene Altersnorm', 'c.reprocB': 'Neu verarbeitet',
    'c.reprocText': 'Die Aufnahme vom {d} wurde mit der aktuellen Software und den aktuellen Normen erneut verarbeitet. Unterschiede zwischen den beiden Messungen werden nicht statistisch geprüft.',
    'c.channel': 'Kanal', 'c.clickBoth': 'Karte anklicken, um in beiden Messungen einen Kanal zu wählen', 'c.mapAria': '{b}-Karte {d}', 'c.selected': 'Ausgewählte Messgrößen',
    'c.selSub': 'Wert und z, jeweils gegen die eigene Norm', 'c.comparison': 'Vergleich',
  },
});
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
const CH = A.channels, BANDS = A.bands, BN = BANDS.map(b => b.name);
const BL = { delta: 'Delta', theta: 'Theta', alpha: 'Alpha', smr: 'SMR', beta1: 'Beta1', beta2: 'Beta2' };
const cl = (k) => T('cond.' + k), cll = (k) => T('condl.' + k);
const INK = '#1c2a36', GRID = '#e4e5e1', MUTED = '#6b7279', NORMF = 'rgba(112,122,132,0.20)', NORML = '#7b858d', MARK = '#135e7d';
const POST = ['P3', 'Pz', 'P4', 'O1', 'O2'];
const fz = (z) => z == null ? '' : A.nf(Math.abs(z) < 0.05 ? 0 : z, 1);
const zc = (z, txt, cls = '') => z == null ? `<td class="num muted">${T('n/a')}</td>` : `<td class="num b-zc ${cls}" style="background:${A.zColor(z)};color:${A.zInk(z)}">${txt ?? fz(z)}</td>`;
const n1 = (v, d = 1) => v == null ? '' : A.nf(v, d);
const isOut = (z) => z != null && Math.abs(z) >= 2;

function cvs(cv, W, H) {
  const d = window.devicePixelRatio || 1;
  cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
  g.fillStyle = A.css_var('--paper') || '#fff'; g.fillRect(0, 0, W, H); return g;
}
const font = (g, px, w = 400, mono) => { g.font = `${w} ${px}px ${mono ? 'IBM Plex Mono, monospace' : 'IBM Plex Sans, sans-serif'}`; };

/* head outline with electrodes; draw(g, pt) paints lines before the electrodes */
function headFig(cv, S, draw, opts = {}) {
  const pad = opts.title ? 16 : 0, g = cvs(cv, S, S + pad);
  const cx = S / 2, cy = pad + S / 2 + 2, R = S / 2 - 12;
  const pt = (c) => [cx + A.pos[c][0] * R / 1.08, cy - A.pos[c][1] * R / 1.08];
  g.strokeStyle = '#2b2b2b'; g.lineWidth = 1.1;
  g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
  g.beginPath(); g.moveTo(cx - 7, cy - R + 1); g.lineTo(cx, cy - R - 8); g.lineTo(cx + 7, cy - R + 1); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * (R + 3), cy, 3, 9, 0, 0, 2 * Math.PI); g.stroke(); }
  draw(g, pt);
  CH.forEach(c => {
    const [x, y] = pt(c), on = opts.sel === c, dim = opts.dim && !opts.dim.has(c);
    g.fillStyle = on ? MARK : (dim ? '#a7abaf' : '#2b2b2b'); g.beginPath(); g.arc(x, y, on ? 4 : 2, 0, 2 * Math.PI); g.fill();
    if (on) { g.strokeStyle = MARK; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, 7.5, 0, 2 * Math.PI); g.stroke(); }
    if (opts.names) { font(g, S > 200 ? 10 : 8.5, on ? 600 : 400, true); g.fillStyle = dim ? '#9a9ea2' : '#33373a'; g.textAlign = 'center'; g.fillText(c, x, y - 6); g.textAlign = 'left'; }
  });
  if (opts.title) { font(g, 11, 600); g.fillStyle = '#1f1f1e'; g.textAlign = 'center'; g.fillText(opts.title, cx, 11); g.textAlign = 'left'; }
  return (x, y) => { let best = null, bd = 1e9; CH.forEach(c => { const [px, py] = pt(c), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = c; } }); return bd < 160 ? best : null; };
}
const zLine = (z, a = 0.95) => { const c = A.zRGB(Math.sign(z) * Math.max(2.2, Math.abs(z))); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

/* spectrum on a log power axis: o = {f, lp, mu, sd, z, f0, f1, H, sel:[lo,hi], hover, marks:[{hz, kind}], bands} */
function drawSpec(cv, W, o) {
  const H = o.H || 250, ml = 46, mr = 12, mt = 24, mb = 30, pw = W - ml - mr, ph = H - mt - mb, g = cvs(cv, W, H);
  const idx = o.f.map((f, i) => i).filter(i => o.f[i] >= o.f0 && o.f[i] <= o.f1);
  let lo = 1e9, hi = -1e9; idx.forEach(i => { lo = Math.min(lo, o.lp[i], o.mu[i] - 2 * o.sd[i]); hi = Math.max(hi, o.lp[i], o.mu[i] + 2 * o.sd[i]); });
  lo = Math.floor(lo * 2 - 0.2) / 2; hi = Math.ceil(hi * 2 + 0.2) / 2;
  const x = (f) => ml + (f - o.f0) / (o.f1 - o.f0) * pw, y = (v) => mt + (hi - v) / (hi - lo) * ph;
  if (o.bands !== false) BANDS.forEach((b, k) => {
    const a = Math.max(o.f0, b.lo), e = Math.min(o.f1, b.hi); if (e <= a) return;
    g.fillStyle = k % 2 ? 'rgba(20,40,60,0.045)' : 'rgba(20,40,60,0.0)'; g.fillRect(x(a), mt, x(e) - x(a), ph);
    font(g, 9.5, 500); g.fillStyle = MUTED; g.textAlign = 'center'; if (x(e) - x(a) > 24) g.fillText(BL[b.name], (x(a) + x(e)) / 2, mt - 7); g.textAlign = 'left';
  });
  if (o.sel) { g.fillStyle = 'rgba(19,94,125,0.13)'; g.fillRect(x(o.sel[0]), mt, x(o.sel[1]) - x(o.sel[0]), ph); }
  /* log grid: decades labelled, 2 and 5 as minor lines */
  font(g, 10, 400, true);
  for (let d = Math.floor(lo); d <= Math.ceil(hi); d++) for (const m of [1, 2, 5]) {
    const v = d + Math.log10(m); if (v < lo || v > hi) continue;
    g.strokeStyle = m === 1 ? '#d6d7d2' : GRID; g.lineWidth = 1; g.beginPath(); g.moveTo(ml, Math.round(y(v)) + 0.5); g.lineTo(ml + pw, Math.round(y(v)) + 0.5); g.stroke();
    if (m === 1 || hi - lo < 1.6) { g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(A.nx(+(10 ** v).toPrecision(2)), ml - 5, y(v) + 3); g.textAlign = 'left'; }
  }
  const step = o.f1 - o.f0 > 15 ? 5 : 2;
  for (let f = Math.ceil(o.f0 / step) * step; f <= o.f1; f += step) { g.fillStyle = MUTED; g.textAlign = 'center'; g.fillText(String(f), x(f), mt + ph + 14); g.strokeStyle = GRID; g.beginPath(); g.moveTo(Math.round(x(f)) + 0.5, mt + ph); g.lineTo(Math.round(x(f)) + 0.5, mt + ph + 4); g.stroke(); }
  g.textAlign = 'left'; font(g, 10); g.fillStyle = MUTED; g.fillText('Hz', ml + pw - 12, mt + ph + 26); g.save(); g.translate(11, mt + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText(T('b.logScale'), 0, 0); g.restore();
  /* norm band, mean, patient */
  g.beginPath(); idx.forEach((i, k) => { const p = [x(o.f[i]), y(o.mu[i] + 2 * o.sd[i])]; k ? g.lineTo(...p) : g.moveTo(...p); });
  idx.slice().reverse().forEach(i => g.lineTo(x(o.f[i]), y(o.mu[i] - 2 * o.sd[i]))); g.closePath(); g.fillStyle = NORMF; g.fill();
  g.setLineDash([4, 3]); g.strokeStyle = NORML; g.lineWidth = 1.2; g.beginPath(); idx.forEach((i, k) => k ? g.lineTo(x(o.f[i]), y(o.mu[i])) : g.moveTo(x(o.f[i]), y(o.mu[i]))); g.stroke(); g.setLineDash([]);
  g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); idx.forEach((i, k) => k ? g.lineTo(x(o.f[i]), y(o.lp[i])) : g.moveTo(x(o.f[i]), y(o.lp[i]))); g.stroke();
  if (o.z) idx.forEach(i => { if (isOut(o.z[i])) { g.fillStyle = A.zColor(o.z[i] * 1.2); g.beginPath(); g.arc(x(o.f[i]), y(o.lp[i]), 3.2, 0, 2 * Math.PI); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 0.8; g.stroke(); } });
  (o.marks || []).forEach(m => {
    const X = x(m.hz); g.strokeStyle = m.kind === 'sys' ? '#6a7580' : MARK; g.lineWidth = m.kind === 'sys' ? 1.2 : 2; g.setLineDash(m.kind === 'sys' ? [5, 4] : []);
    g.beginPath(); g.moveTo(X, mt); g.lineTo(X, mt + ph); g.stroke(); g.setLineDash([]);
    font(g, 10, 600, true); g.fillStyle = g.strokeStyle; const t = (m.label || '') + A.nf(m.hz, 1) + ' Hz'; const tw = g.measureText(t).width;
    const tx = Math.min(ml + pw - tw - 2, Math.max(ml + 2, X + (m.kind === 'sys' ? -tw - 5 : 5))); g.fillText(t, tx, mt + (m.kind === 'sys' ? 12 : 26));
    if (m.kind !== 'sys') { g.beginPath(); g.moveTo(X - 6, mt + ph); g.lineTo(X + 6, mt + ph); g.lineTo(X, mt + ph - 9); g.closePath(); g.fill(); }
  });
  if (o.hover != null) { const i = o.hover; g.strokeStyle = 'rgba(28,42,54,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(x(o.f[i])) + 0.5, mt); g.lineTo(Math.round(x(o.f[i])) + 0.5, mt + ph); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x(o.f[i]), y(o.lp[i]), 3, 0, 2 * Math.PI); g.fill(); }
  g.strokeStyle = '#b9bbb6'; g.lineWidth = 1; g.strokeRect(ml + 0.5, mt + 0.5, pw, ph);
  return { fAt: (px) => o.f0 + (px - ml) / pw * (o.f1 - o.f0), inside: (px) => px >= ml && px <= ml + pw, near: (px) => { const f = o.f0 + (px - ml) / pw * (o.f1 - o.f0); let b = idx[0]; idx.forEach(i => { if (Math.abs(o.f[i] - f) < Math.abs(o.f[b] - f)) b = i; }); return b; } };
}
const specLegend = (zl = '|z| ≥ 2') => `<span class="b-leg"><span><i style="background:var(--ink);height:2px"></i>${T('b.patient')}</span><span><i style="background:${NORMF};outline:1px dashed ${NORML}"></i>${T('b.normBand')}</span><span><i style="background:${A.zColor(2.6)};border-radius:50%;width:8px;height:8px"></i>${zl}</span></span>`;

/* ================================ Results tab ================================ */
const R = { sec: 'summary', cond: 'EC', meas: 'abs', ch: 'Fz', bin: null, hov: null, cohBand: 'theta', thr: 2, cohOnly: true, cohSort: ['z', -1], cohCh: null, cohHov: null,
  erpT: 'nogo', erpCh: 'Cz', erpHov: null, asymBand: 'alpha', off: null, mk: null };
const SECS = ['summary', 'spectra', 'ratios', 'asym', 'coh', 'erp', 'vcpt', 'markers'].map(k => [k, 'b.s.' + k]);
/* [id, label key, status key]; status 'b.o.q4' and 'b.o.open' mean not decided yet */
const OFF = [['ai', 'b.o.ai', 'b.o.later'], ['quest', 'b.o.quest', 'b.o.q4'], ['sloreta', 'b.o.sloreta', 'b.o.open'],
  ['icaerp', 'b.o.icaerp', 'b.o.open'], ['micro', 'b.o.micro', 'b.o.licence'], ['clf', 'b.o.clf', 'b.o.later'], ['spike', 'b.o.spike', 'b.o.later']];
const USES = { spectra: ['cond', 'meas'], asym: ['cond'], coh: ['cond'] };
const ERPT = [['go', 'Go'], ['nogo', 'NoGo'], ['ignore', 'Ignore'], ['novelty', 'Novelty']];
const LAYOUT = [[null, 'Fp1', null, 'Fp2', null], ['F7', 'F3', 'Fz', 'F4', 'F8'], ['T3', 'C3', 'Cz', 'C4', 'T4'], ['T5', 'P3', 'Pz', 'P4', 'T6'], [null, 'O1', null, 'O2', null]];

/* counts of values compared with a norm, and of values beyond 2 z, per section */
function counts(m = A.m2) {
  const S = m.spectra.conditions, c = { spectra: [0, 0], ratios: [0, 0], asym: [0, 0], coh: [0, 0], erp: [0, 0], vcpt: [0, 0] };
  const add = (k, z) => { if (z == null) return; c[k][0]++; if (isOut(z)) c[k][1]++; };
  ['EO', 'EC'].forEach(k => {
    BN.forEach(b => { S[k].bands[b].abs_z.forEach(z => add('spectra', z)); S[k].bands[b].rel_z.forEach(z => add('spectra', z)); S[k].asymmetry[b].forEach(p => add('asym', p.z)); m.coherence[k][b].pairs.forEach(p => add('coh', p.z)); });
    ['tbr', 'faa', 'alpha_peak'].forEach(r => add('ratios', S[k][r].z));
  });
  m.erp.peaks.forEach(p => { add('erp', p.amplitude_z); add('erp', p.latency_z); });
  ['omissions', 'commissions', 'rt_mean_ms', 'rt_sd_ms'].forEach(k => add('vcpt', m.vcpt[k].z));
  return c;
}
let CNT = null, root0 = null, ro = null, redraw = null;

function rail() {
  const mk = A.state.markers;
  const badge = (k) => k === 'markers' ? (mk.confirmed ? '<span class="chip ok">✓</span>' : `<span class="chip amber">${T('b.toConfirm')}</span>`) : (CNT[k] && CNT[k][1] ? `<span class="b-cnt" title="${T('b.beyond2')}">${CNT[k][1]}</span>` : '');
  return `<div class="b-rgrp">${T('b.results')}</div>${SECS.map(([k, l]) => `<button class="b-ri ${R.sec === k && !R.off ? 'on' : ''}" data-sec="${k}"><span>${T(l)}</span>${badge(k)}</button>`).join('')}
    <div class="b-rgrp">${T('b.notRelease')} ${A.ann('Table 3.3')}</div>${OFF.map(([k, l, s]) => `<button class="b-ri off ${R.off === k ? 'on' : ''}" data-off="${k}"><span>${esc(T(l))}<small>${esc(T(s))}</small></span></button>`).join('')}`;
}
function toolbar() {
  const u = R.off ? [] : (USES[R.sec] || []), title = T(R.off ? OFF.find(o => o[0] === R.off)[1] : SECS.find(s => s[0] === R.sec)[1]);
  return `<h2 class="b-tt">${esc(title)}</h2>
    ${u.includes('cond') ? `<span class="sep"></span><div class="seg" id="bCond" aria-label="${T('b.condAria')}">${['EO', 'EC'].map(k => `<button data-k="${k}" class="${R.cond === k ? 'on' : ''}">${cl(k)}</button>`).join('')}</div>` : ''}
    ${u.includes('meas') ? `<div class="seg" id="bMeas" aria-label="${T('b.measAria')}">${[['abs', 'b.abs'], ['rel', 'b.rel']].map(([k, l]) => `<button data-k="${k}" class="${R.meas === k ? 'on' : ''}">${T(l)}</button>`).join('')}</div>` : ''}
    <span class="b-sp"></span><span class="xs muted b-meta">${esc(T('b.meta', { sw: A.m2.processed_with.software, norms: A.dv(A.m2.processed_with.norms), a: A.nx(A.m2.age_years) }))}</span>`;
}

function show(root) {
  CNT = CNT || counts();
  $('#bRail', root).innerHTML = rail();
  $('#bTb', root).innerHTML = toolbar();
  const body = $('#bBody', root); redraw = null;
  if (R.off) body.innerHTML = offPanel();
  else ({ summary, spectra, ratios, asym, coh, erp, vcpt, markers })[R.sec](body);
  $$('[data-sec]', root).forEach(b => b.onclick = () => { R.sec = b.dataset.sec; R.off = null; show(root); });
  $$('[data-off]', root).forEach(b => b.onclick = () => { R.off = b.dataset.off; show(root); });
  $$('#bCond button', root).forEach(b => b.onclick = () => { R.cond = b.dataset.k; R.bin = null; show(root); });
  $$('#bMeas button', root).forEach(b => b.onclick = () => { R.meas = b.dataset.k; show(root); });
  $$('[data-jump]', root).forEach(b => b.onclick = () => { R.sec = b.dataset.jump; R.off = null; show(root); window.scrollTo({ top: 0 }); });
}
const sents = (title, list, empty) => `<div class="card"><div class="hd"><h3>${title}</h3><span class="xs muted">${T('b.fixed')} ${A.ann('Text library, kinds (a) and (b1)')}</span></div><div class="bd b-sys">${list && list.length ? A.sys(list) : `<p class="muted small" style="margin:0">${empty}</p>`}</div></div>`;

function offPanel() {
  const o = OFF.find(x => x[0] === R.off);
  return `<div class="card"><div class="bd b-off"><div class="b-offic">⊘</div><div><h3>${esc(T(o[1]))}</h3><p class="small" style="margin:6px 0">${T(['b.o.q4', 'b.o.open'].includes(o[2]) ? 'b.offOpen' : 'b.offStudy')}</p>
    <div class="row"><span class="chip">${esc(T(o[2]))}</span>${A.ann('Table 3.3, ADR 0003 and 0005 (proposed)')}<button class="btn sm" disabled>${T('b.studyAccess')}</button></div></div></div></div>`;
}

/* ---------------- Summary ---------------- */
function summary(body) {
  const lim = A.sentences.m2.limits.filter(s => ['L-AID-1', 'L-Z-1', 'L-CHANCE-1'].includes(s.id));
  const rows = [['spectra', 'b.r.spectra'], ['ratios', 'b.s.ratios'], ['asym', 'b.s.asym'], ['coh', 'b.s.coh'], ['erp', 'b.r.erp'], ['vcpt', 'b.s.vcpt']];
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T('b.largest')}</h3>${A.ann('3.5 Summary rule')}</div><div class="bd b-sys">${A.sys(A.sentences.m2.summary)}</div></div>
    <div class="grid g2">
      <div class="card"><div class="hd"><h3>${T('b.compared')}</h3><span class="xs muted">${T('b.both')}</span></div><div class="scroll-x"><table class="tbl">
        <tr><th>${T('b.section')}</th><th class="num">${T('b.values')}</th><th class="num">|z| ≥ 2</th><th></th></tr>
        ${rows.map(([k, l]) => `<tr class="link" data-jump="${k}" tabindex="0"><td>${T(l)}</td><td class="num">${A.int(CNT[k][0])}</td><td class="num"><b>${CNT[k][1]}</b></td><td class="num"><span class="btn sm ghost">${T('b.openArrow')}</span></td></tr>`).join('')}
      </table></div></div>
      <div class="card"><div class="hd"><h3>${T('b.quality')}</h3><a class="small" href="#cleaning">${T('b.cleaning')}</a></div><div class="bd b-sys">${A.sys(A.qualitySentences())}</div></div>
    </div>
    ${sents(T('b.limits'), lim)}
  </div>`;
  $$('[data-jump]', body).forEach(r => r.onkeydown = e => { if (e.key === 'Enter') r.click(); });
}

/* ---------------- Spectra and maps ---------------- */
function spectra(body) {
  const C = A.m2.spectra.conditions[R.cond], key = R.meas === 'abs' ? 'abs_z' : 'rel_z';
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T('b.bandMaps', { m: T(R.meas === 'abs' ? 'b.absPow' : 'b.relPow'), cond: cll(R.cond) })}</h3><span class="xs muted">${T('b.clickMap')}</span></div>
      <div class="bd"><div class="paper"><div class="b-maps" id="bMaps">${BN.map(b => `<canvas data-b="${b}" aria-label="${T('b.mapAria', { b: BL[b] })}"></canvas>`).join('')}</div><div class="b-zs">${A.zScale()}</div></div></div></div>
    <div class="b-two">
      <div class="card"><div class="hd"><h3 id="bSpT"></h3>${specLegend()}</div><div class="bd"><div class="paper b-fig"><canvas id="bSpec" aria-label="${T('b.specAria')}"></canvas></div><div class="b-read mono xs" id="bSpR">${T('b.readHelp')}</div><div class="scroll-x" id="bChv" style="margin-top:8px"></div></div></div>
      <div class="card"><div class="hd"><h3>${T('b.zByCh')}</h3><span class="xs muted">${T(R.meas === 'abs' ? 'b.absPow' : 'b.relPow')}</span></div><div class="scroll-x b-ztw" id="bZt"></div></div>
    </div>
    <div class="card"><div class="hd"><h3>${T('b.hzMaps')}</h3><span class="xs muted" id="bBinL">${T('b.hzHelp')}</span></div><div class="bd"><div class="paper b-hz" id="bHz">${A.m2.spectra.conditions[R.cond].maps_1hz_z.map((_, i) => `<canvas data-i="${i}" tabindex="0" aria-label="${T('b.rangeHz', { a: i + 1, b: i + 2 })}"></canvas>`).join('')}</div></div></div>
    ${sents(T('b.sentsCond', { cond: cll(R.cond) }), A.sentences.m2['spectra_' + R.cond])}
  </div>`;
  const hits = {};
  const maps = () => $$('#bMaps canvas', body).forEach(cv => { const b = cv.dataset.b, bd = BANDS.find(x => x.name === b);
    hits[b] = A.topo(cv, C.bands[b][key], { size: 120, title: `${BL[b]} ${T('b.rangeHz', { a: A.nx(bd.lo), b: A.nx(bd.hi) })}`, highlight: R.ch, marks: [R.ch] }); });
  const table = () => {
    $('#bZt', body).innerHTML = `<table class="tbl b-zt"><tr><th>${T('b.ch')}</th>${BN.map(b => `<th class="num">${BL[b]}</th>`).join('')}</tr>${CH.map((c, i) => `<tr class="link ${c === R.ch ? 'sel' : ''}" data-ch="${c}" tabindex="0"><td class="mono">${c}</td>${BN.map(b => {
      const v = R.meas === 'abs' ? `${n1(C.bands[b].abs_uv2[i])} µV²` : `${n1(C.bands[b].rel_pct[i])} %`; return zc(C.bands[b][key][i]).replace('<td ', `<td title="${T('b.atCh', { b: BL[b], c, v })}" `); }).join('')}</tr>`).join('')}</table>`;
    $$('#bZt tr[data-ch]', body).forEach(r => { r.onclick = () => pick(r.dataset.ch); r.onkeydown = e => { if (e.key === 'Enter') pick(r.dataset.ch); }; });
  };
  let sp = null;
  const spec = () => {
    const i = CH.indexOf(R.ch), cv = $('#bSpec', body), W = Math.max(300, cv.parentElement.clientWidth - 2);
    $('#bSpT', body).textContent = T('b.specT', { ch: R.ch, cond: cll(R.cond) });
    $('#bChv', body).innerHTML = `<table class="tbl b-zt"><tr><th>${R.ch}</th>${BN.map(b => `<th class="num">${BL[b]}</th>`).join('')}</tr>
      <tr><td class="muted">µV²</td>${BN.map(b => `<td class="num">${n1(C.bands[b].abs_uv2[i])}</td>`).join('')}</tr><tr><td class="muted">z</td>${BN.map(b => zc(C.bands[b].abs_z[i])).join('')}</tr>
      <tr><td class="muted">%</td>${BN.map(b => `<td class="num">${n1(C.bands[b].rel_pct[i])}</td>`).join('')}</tr><tr><td class="muted">z</td>${BN.map(b => zc(C.bands[b].rel_z[i])).join('')}</tr></table>`;
    sp = drawSpec(cv, W, { f: A.m2.spectra.freqs, lp: C.log_power[i], mu: C.norm_log_mean[i], sd: C.norm_log_sd[i], z: C.z[i], f0: 1, f1: 30, H: 260, hover: R.hov, sel: R.bin != null ? [R.bin + 1, R.bin + 2] : null });
  };
  const hz = () => $$('#bHz canvas', body).forEach(cv => { const k = +cv.dataset.i; A.topo(cv, C.maps_1hz_z[k], { size: 70, title: `${k + 1}-${k + 2} Hz`, highlight: R.ch }); cv.classList.toggle('on', k === R.bin); });
  const pick = (c) => { if (!c) return; R.ch = c; maps(); table(); spec(); hz(); };
  const bin = (k) => { R.bin = R.bin === k ? null : k; $('#bBinL', body).textContent = R.bin == null ? T('b.hzHelp') : T('b.selHz', { a: R.bin + 1, b: R.bin + 2 }); $$('#bHz canvas', body).forEach(cv => cv.classList.toggle('on', +cv.dataset.i === R.bin)); spec(); };
  $$('#bMaps canvas', body).forEach(cv => cv.onclick = e => { const r = cv.getBoundingClientRect(); pick(hits[cv.dataset.b](e.clientX - r.left, e.clientY - r.top)); });
  $$('#bHz canvas', body).forEach(cv => { cv.onclick = () => bin(+cv.dataset.i); cv.onkeydown = e => { if (e.key === 'Enter') bin(+cv.dataset.i); }; });
  const sc = $('#bSpec', body);
  sc.onpointermove = e => { const r = sc.getBoundingClientRect(), px = e.clientX - r.left; if (!sp || !sp.inside(px)) return; const k = sp.near(px); if (k === R.hov) return; R.hov = k; spec();
    const i = CH.indexOf(R.ch), f = A.m2.spectra.freqs[k]; $('#bSpR', body).textContent = T('b.readSpec', { ch: R.ch, f: A.nf(f, 1), p: A.nf(10 ** C.log_power[i][k], 2), m: A.nf(10 ** C.norm_log_mean[i][k], 2), z: fz(C.z[i][k]) }); };
  sc.onpointerleave = () => { R.hov = null; spec(); };
  sc.onclick = e => { const r = sc.getBoundingClientRect(), f = sp.fAt(e.clientX - r.left); if (f >= 1 && f < 30) bin(Math.floor(f) - 1); };
  maps(); table(); spec(); hz();
  redraw = spec;
}

/* ---------------- Ratios and indices ---------------- */
function gauge(z) {
  const p = (Math.max(-3, Math.min(3, z)) + 3) / 6 * 100;
  return `<span class="paper b-gauge" title="z ${fz(z)}"><i class="b-g2" style="left:${100 / 6}%;width:${400 / 6}%"></i><i class="b-g0"></i><b style="left:${p}%;background:${A.zColor(z)}"></b></span>`;
}
function ratios(body) {
  const S = A.m2.spectra.conditions;
  const rows = [
    [T('b.tbr'), 'Cz', (k) => S[k].tbr, (v) => n1(v.value, 2), (v) => n1(v.norm_mean, 2)],
    [T('b.faa'), 'ln F4 minus ln F3', (k) => S[k].faa, (v) => n1(v.value, 2), (v) => `${n1(v.norm_mean, 2)} ${T('b.sd', { v: n1(v.norm_sd, 2) })}`],
    [T('b.apf'), 'P3, Pz, P4, O1, O2', (k) => S[k].alpha_peak, (v) => n1(v.hz) + ' Hz', (v) => `${n1(v.norm_mean, 2)} Hz ${T('b.sd', { v: n1(v.norm_sd, 2) })}`],
  ];
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="grid g3">${rows.map(([l, site, get, val]) => `<div class="card"><div class="bd"><div class="xs muted">${l} · ${site}</div>
      ${['EO', 'EC'].map(k => { const v = get(k); return `<div class="b-rat"><span class="xs muted">${cl(k)}</span><b class="num">${val(v)}</b><span class="num xs">z ${fz(v.z)}</span>${gauge(v.z)}</div>`; }).join('')}</div></div>`).join('')}</div>
    <div class="card"><div class="hd"><h3>${T('b.table')}</h3>${A.ann('3.5 Ratios: numbers only')}</div><div class="scroll-x"><table class="tbl">
      <tr><th>${T('b.measure')}</th><th>${T('b.site')}</th><th>${T('b.condition')}</th><th class="num">${T('b.value')}</th><th class="num">${T('b.normMean')}</th><th class="num">z</th></tr>
      ${rows.map(([l, site, get, val, nm]) => ['EO', 'EC'].map((k, j) => { const v = get(k); return `<tr><td>${j ? '' : l}</td><td class="small">${j ? '' : site}</td><td>${cl(k)}</td><td class="num">${val(v)}</td><td class="num">${nm(v)}</td>${zc(v.z)}</tr>`; }).join('')).join('')}
    </table></div></div>
    ${sents(T('b.sents'), A.sentences.m2.ratios)}
  </div>`;
}

/* ---------------- Asymmetry ---------------- */
function asym(body) {
  const S = A.m2.spectra.conditions[R.cond], pairs = A.case.asym_pairs;
  const out = BN.reduce((n, b) => n + S.asymmetry[b].filter(p => isOut(p.z)).length, 0);
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T('b.asymPairs', { cond: cll(R.cond) })}</h3><span class="xs muted">${T('b.asymHelp')}</span></div>
      <div class="bd"><div class="paper"><div class="b-maps" id="bAh">${BN.map(b => `<canvas data-b="${b}" tabindex="0" class="${b === R.asymBand ? 'on' : ''}" aria-label="${T('b.asymAria', { b: BL[b] })}"></canvas>`).join('')}</div><div class="b-zs">${A.zScale()}</div></div></div></div>
    <div class="b-two">
      <div class="card"><div class="hd"><h3>${T('b.zByPair')}</h3>${A.ann('Index definition: mockup assumption')}</div><div class="scroll-x"><table class="tbl b-zt"><tr><th>${T('b.pair')}</th>${BN.map(b => `<th class="num ${b === R.asymBand ? 'b-colon' : ''}">${BL[b]}</th>`).join('')}</tr>
        ${pairs.map((p, i) => `<tr><td class="mono">${p}</td>${BN.map(b => zc(S.asymmetry[b][i].z, null, b === R.asymBand ? 'b-colsel' : '').replace('<td ', `<td title="${T('b.idxT', { b: BL[b], p, v: n1(S.asymmetry[b][i].value, 3) })}" `)).join('')}</tr>`).join('')}</table></div></div>
      <div class="card"><div class="hd"><h3>${BL[R.asymBand]} · ${cll(R.cond)}</h3><span class="xs muted">${T('b.nOf48', { n: out })}</span></div><div class="scroll-x"><table class="tbl">
        <tr><th>${T('b.pair')}</th><th class="num">${T('b.asymIdx')}</th><th class="num">z</th></tr>
        ${S.asymmetry[R.asymBand].map(p => `<tr><td class="mono">${p.pair}</td><td class="num">${n1(p.value, 3)}</td>${zc(p.z)}</tr>`).join('')}</table></div></div>
    </div>
    ${sents(T('b.sentsCond', { cond: cll(R.cond) }), A.sentences.m2['asymmetry_' + R.cond], T('b.asymNone'))}
  </div>`;
  $$('#bAh canvas', body).forEach(cv => {
    const b = cv.dataset.b, bd = BANDS.find(x => x.name === b);
    headFig(cv, 120, (g, pt) => S.asymmetry[b].forEach(p => { const [l, r] = p.pair.split('-'), [x1, y1] = pt(l), [x2, y2] = pt(r);
      g.strokeStyle = A.zColor(p.z * 1.15); g.lineWidth = 2.5 + Math.min(3, Math.abs(p.z)) * 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }), { title: `${BL[b]} ${T('b.rangeHz', { a: A.nx(bd.lo), b: A.nx(bd.hi) })}` });
    cv.onclick = () => { R.asymBand = b; asym(body); }; cv.onkeydown = e => { if (e.key === 'Enter') cv.onclick(); };
  });
}

/* ---------------- Coherence ---------------- */
function coh(body) {
  const D = A.m2.coherence[R.cond][R.cohBand];
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="toolbar b-tl">
      <div class="seg" id="bCb">${BN.map(b => `<button data-b="${b}" class="${b === R.cohBand ? 'on' : ''}">${BL[b]}</button>`).join('')}</div><span class="sep"></span>
      <label for="bThr">|z| ≥ <input type="range" id="bThr" min="1.5" max="3" step="0.1" value="${R.thr}"><b class="mono" id="bThrV">${A.nf(R.thr, 1)}</b></label>
      <label><input type="checkbox" id="bOnly" ${R.cohOnly ? 'checked' : ''}> ${T('b.onlyBeyond')}</label>
      <span class="b-sp"></span><span class="small"><span class="muted">${T('b.global')}</span> <b class="num">${n1(D.global.value, 3)}</b> <span class="num xs">z ${fz(D.global.z)}</span> <span class="chip amber">${T('b.coreConf')}</span>${A.ann('Q5')}</span>
    </div>
    <div class="b-coh"><div class="paper b-fig b-cohf"><canvas id="bCh" aria-label="${T('b.cohAria')}"></canvas><div class="b-leg" style="padding:0 8px 6px;color:#55554f"><span><i style="background:${A.zColor(2.6)}"></i>${T('b.aboveNorm')}</span><span><i style="background:${A.zColor(-2.6)}"></i>${T('b.belowNorm')}</span><span>${T('b.width')}</span></div></div>
      <div class="b-cohr"><div class="row between small" style="padding:2px 0 8px"><span id="bCn"></span><span id="bCf"></span></div><div class="b-ctw" id="bCt"></div>
        <p class="xs muted" style="margin:8px 0 0">${T('b.cohCount', { n: A.int(171 * 6 * 2) })} ${A.ann('Q10 Multiple comparisons')}</p>${A.sys(A.sentences.m2.limits.filter(s => s.id === 'L-CHANCE-1'))}</div></div></div>
    ${sents(T('b.sentsCond', { cond: cll(R.cond) }), A.sentences.m2['coherence_' + R.cond])}
  </div>`;
  let hit = null;
  const shown = () => D.pairs.filter(p => Math.abs(p.z) >= R.thr);
  const fig = () => {
    const cv = $('#bCh', body), S = Math.min(380, Math.max(260, cv.parentElement.clientWidth - 4)), hs = shown(), hv = R.cohHov;
    const inv = R.cohCh ? new Set([R.cohCh, ...hs.filter(p => p.pair.split('-').includes(R.cohCh)).flatMap(p => p.pair.split('-'))]) : null;
    hit = headFig(cv, S, (g, pt) => hs.slice().sort((a, b) => Math.abs(a.z) - Math.abs(b.z)).forEach(p => {
      const [a, b] = p.pair.split('-'), on = !R.cohCh || a === R.cohCh || b === R.cohCh; const [x1, y1] = pt(a), [x2, y2] = pt(b);
      g.strokeStyle = zLine(p.z, on ? 0.9 : 0.12); g.lineWidth = (hv === p.pair ? 2.5 : 0) + 1.2 + (Math.abs(p.z) - 1.5) * 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }), { names: true, sel: R.cohCh, dim: inv });
  };
  const tab = () => {
    let rows = (R.cohOnly ? shown() : D.pairs.slice()); if (R.cohCh) rows = rows.filter(p => p.pair.split('-').includes(R.cohCh));
    const [k, d] = R.cohSort; rows.sort((a, b) => k === 'pair' ? d * a.pair.localeCompare(b.pair) : k === 'value' ? d * (a.value - b.value) : d * (Math.abs(a.z) - Math.abs(b.z)));
    $('#bCn', body).innerHTML = T('b.cohN', { n: `<b>${shown().length}</b>`, t: A.nf(R.thr, 1), b: BL[R.cohBand], cond: cll(R.cond) });
    $('#bCf', body).innerHTML = R.cohCh ? `<button class="btn sm" id="bCx">${R.cohCh} ✕</button>` : `<span class="xs muted">${T('b.clickEl')}</span>`;
    const ar = (c) => R.cohSort[0] === c ? (R.cohSort[1] > 0 ? ' ▲' : ' ▼') : '';
    $('#bCt', body).innerHTML = `<table class="tbl"><thead><tr><th><button class="b-th" data-s="pair">${T('b.pair')}${ar('pair')}</button></th><th class="num"><button class="b-th" data-s="value">${T('b.coherence')}${ar('value')}</button></th><th class="num"><button class="b-th" data-s="z">z${ar('z')}</button></th></tr></thead>
      <tbody>${rows.length ? rows.map(p => `<tr data-p="${p.pair}"><td class="mono">${p.pair}</td><td class="num">${n1(p.value, 3)}</td>${zc(p.z)}</tr>`).join('') : `<tr><td colspan="3" class="empty">${T('b.noPair')}</td></tr>`}</tbody></table>`;
    $$('.b-th', body).forEach(b => b.onclick = () => { R.cohSort = [b.dataset.s, R.cohSort[0] === b.dataset.s ? -R.cohSort[1] : (b.dataset.s === 'pair' ? 1 : -1)]; tab(); });
    $$('#bCt tr[data-p]', body).forEach(r => { r.onmouseenter = () => { R.cohHov = r.dataset.p; fig(); }; r.onmouseleave = () => { R.cohHov = null; fig(); }; });
    const x = $('#bCx', body); if (x) x.onclick = () => { R.cohCh = null; fig(); tab(); };
  };
  $$('#bCb button', body).forEach(b => b.onclick = () => { R.cohBand = b.dataset.b; coh(body); });
  $('#bThr', body).oninput = e => { R.thr = +e.target.value; $('#bThrV', body).textContent = A.nf(R.thr, 1); fig(); tab(); };
  $('#bOnly', body).onchange = e => { R.cohOnly = e.target.checked; tab(); };
  $('#bCh', body).onclick = e => { const r = e.target.getBoundingClientRect(), c = hit(e.clientX - r.left, e.clientY - r.top); R.cohCh = c && c !== R.cohCh ? c : null; fig(); tab(); };
  fig(); tab(); redraw = fig;
}

/* ---------------- Channel ERPs ---------------- */
function erpScale(t) { const chs = A.m2.erp.conditions[t].channels; let m = 0; CH.forEach(c => { const d = chs[c]; d.patient_uv.forEach((v, i) => { m = Math.max(m, Math.abs(v), Math.abs(d.norm_mean_uv[i]) + 2 * d.norm_sd_uv[i]); }); }); return Math.ceil(m / 5) * 5; }
function erpPlot(cv, W, H, t, ch, big) {
  const E = A.m2.erp, d = E.conditions[t].channels[ch], TM = E.times_ms, lim = erpScale(t), g = cvs(cv, W, H);
  const ml = big ? 42 : 3, mr = big ? 18 : 3, mt = big ? 14 : 3, mb = big ? 26 : 3, pw = W - ml - mr, ph = H - mt - mb;
  const x = (ms) => ml + (ms + 200) / 1000 * pw, y = (v) => mt + (lim - v) / (2 * lim) * ph;
  if (big) {
    font(g, 10, 400, true); g.fillStyle = MUTED;
    for (let ms = -200; ms <= 800; ms += 100) { g.strokeStyle = GRID; g.beginPath(); g.moveTo(Math.round(x(ms)) + 0.5, mt); g.lineTo(Math.round(x(ms)) + 0.5, mt + ph); g.stroke(); g.textAlign = 'center'; g.fillText(String(ms), x(ms), mt + ph + 13); }
    for (let v = -lim; v <= lim; v += 5) { g.strokeStyle = GRID; g.beginPath(); g.moveTo(ml, Math.round(y(v)) + 0.5); g.lineTo(ml + pw, Math.round(y(v)) + 0.5); g.stroke(); g.textAlign = 'right'; g.fillText(String(v), ml - 5, y(v) + 3); }
    font(g, 10); g.textAlign = 'right'; g.fillText(T('b.msFrom'), ml + pw, mt + ph + 24); g.textAlign = 'left'; g.fillText(T('b.uvUp'), ml + 4, mt + 10);
  }
  g.strokeStyle = '#a9aca7'; g.lineWidth = 1; g.beginPath(); g.moveTo(ml, Math.round(y(0)) + 0.5); g.lineTo(ml + pw, Math.round(y(0)) + 0.5); g.stroke();
  g.strokeStyle = '#8b9096'; g.beginPath(); g.moveTo(Math.round(x(0)) + 0.5, mt); g.lineTo(Math.round(x(0)) + 0.5, mt + ph); g.stroke();
  g.beginPath(); TM.forEach((ms, i) => { const p = [x(ms), y(d.norm_mean_uv[i] + 2 * d.norm_sd_uv[i])]; i ? g.lineTo(...p) : g.moveTo(...p); });
  for (let i = TM.length - 1; i >= 0; i--) g.lineTo(x(TM[i]), y(d.norm_mean_uv[i] - 2 * d.norm_sd_uv[i])); g.closePath(); g.fillStyle = NORMF; g.fill();
  if (big) { g.setLineDash([4, 3]); g.strokeStyle = NORML; g.lineWidth = 1.1; g.beginPath(); TM.forEach((ms, i) => i ? g.lineTo(x(ms), y(d.norm_mean_uv[i])) : g.moveTo(x(ms), y(d.norm_mean_uv[i]))); g.stroke(); g.setLineDash([]); }
  g.strokeStyle = INK; g.lineWidth = big ? 1.8 : 1.2; g.beginPath(); TM.forEach((ms, i) => i ? g.lineTo(x(ms), y(d.patient_uv[i])) : g.moveTo(x(ms), y(d.patient_uv[i]))); g.stroke();
  if (big) {
    E.peaks.filter(p => p.condition === t && p.site === ch).forEach(p => {
      g.fillStyle = isOut(p.amplitude_z) ? A.zColor(p.amplitude_z * 1.2) : MARK; font(g, 10.5, 600, true);
      if (p.latency_ms == null) { g.fillStyle = 'rgba(19,94,125,0.10)'; g.fillRect(x(-200), mt, x(0) - x(-200), ph); g.fillStyle = MARK; g.fillText(`${p.component} ${n1(p.amplitude_uv)} µV`, x(-190), mt + ph - 8); return; }
      const X = x(p.latency_ms), Y = y(p.amplitude_uv), up = p.amplitude_uv >= 0;
      g.beginPath(); g.moveTo(X, Y + (up ? -4 : 4)); g.lineTo(X - 5, Y + (up ? -13 : 13)); g.lineTo(X + 5, Y + (up ? -13 : 13)); g.closePath(); g.fill();
      g.textAlign = 'center'; g.fillText(`${p.component} ${p.latency_ms}`, X, Y + (up ? -17 : 25)); g.textAlign = 'left';
    });
    if (R.erpHov != null) { const i = R.erpHov; g.strokeStyle = 'rgba(28,42,54,0.45)'; g.beginPath(); g.moveTo(Math.round(x(TM[i])) + 0.5, mt); g.lineTo(Math.round(x(TM[i])) + 0.5, mt + ph); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x(TM[i]), y(d.patient_uv[i]), 3, 0, 2 * Math.PI); g.fill(); }
    g.strokeStyle = '#b9bbb6'; g.strokeRect(ml + 0.5, mt + 0.5, pw, ph);
  }
  return (px) => Math.max(0, Math.min(TM.length - 1, Math.round(((px - ml) / pw * 1000) / 4)));
}
function erp(body) {
  const acc = A.m2.quality.accepted_trials[R.erpT], pk = A.m2.erp.peaks.filter(p => p.condition === R.erpT);
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="toolbar b-tl"><div class="seg" id="bEt">${ERPT.map(([k, l]) => `<button data-k="${k}" class="${k === R.erpT ? 'on' : ''}">${l}</button>`).join('')}</div>
      <span class="chip">${T('b.trialsAcc', { a: acc, n: A.m2.vcpt.trials[R.erpT] })}</span><span class="xs muted">${T('b.scale', { s: erpScale(R.erpT) })}</span><span class="b-sp"></span>${specLegend(T('b.peakZ'))}</div>
      <div class="b-erp"><div class="scroll-x" style="padding:12px"><div class="paper b-eg" id="bEg">${LAYOUT.flat().map(c => c ? `<button class="b-ec ${c === R.erpCh ? 'on' : ''}" data-ch="${c}"><span>${c}</span><canvas></canvas></button>` : '<span></span>').join('')}</div></div>
        <div class="b-erpd"><div class="row between"><h3 id="bEh"></h3><span class="b-read mono xs" id="bEr" style="padding:0"></span></div><div class="paper b-fig" style="margin-top:6px"><canvas id="bEb" aria-label="${T('b.erpAria')}"></canvas></div>
          <div class="scroll-x" style="margin-top:10px"><table class="tbl"><tr><th>${T('b.component')}</th><th>${T('b.site')}</th><th class="num">${T('b.amplitude')}</th><th class="num">z</th><th class="num">${T('b.latency')}</th><th class="num">z</th></tr>
          ${pk.length ? pk.map(p => `<tr class="link ${p.site === R.erpCh ? 'sel' : ''}" data-ch="${p.site}" tabindex="0"><td><b>${p.component}</b></td><td class="mono">${p.site}</td><td class="num">${n1(p.amplitude_uv)} µV</td>${zc(p.amplitude_z)}<td class="num" style="white-space:nowrap">${p.latency_ms == null ? esc(String(p.window_ms).replace(' to ', ' ' + T('to') + ' ')) + ' ms' : p.latency_ms + ' ms'}</td>${p.latency_z == null ? zc(null) : zc(p.latency_z)}</tr>`).join('') : `<tr><td colspan="6" class="empty">${T('b.noComp')}</td></tr>`}</table></div></div></div></div>
    ${sents(T('b.sents'), A.sentences.m2.erp)}
  </div>`;
  let inv = null;
  const small = () => $$('#bEg .b-ec', body).forEach(b => { const cv = $('canvas', b), W = Math.max(70, b.clientWidth - 8); erpPlot(cv, W, Math.round(W * 0.8), R.erpT, b.dataset.ch, false); b.classList.toggle('on', b.dataset.ch === R.erpCh); });
  const big = () => { const cv = $('#bEb', body), W = Math.max(300, cv.parentElement.clientWidth - 2); $('#bEh', body).textContent = `${R.erpCh} · ${ERPT.find(e => e[0] === R.erpT)[1]}`; inv = erpPlot(cv, W, 250, R.erpT, R.erpCh, true); };
  const pick = (c) => { R.erpCh = c; R.erpHov = null; small(); big(); $$('tr[data-ch]', body).forEach(r => r.classList.toggle('sel', r.dataset.ch === c)); $('#bEr', body).textContent = ''; };
  $$('#bEt button', body).forEach(b => b.onclick = () => { R.erpT = b.dataset.k; erp(body); });
  $$('#bEg .b-ec', body).forEach(b => b.onclick = () => pick(b.dataset.ch));
  $$('tr[data-ch]', body).forEach(r => { r.onclick = () => pick(r.dataset.ch); r.onkeydown = e => { if (e.key === 'Enter') pick(r.dataset.ch); }; });
  const eb = $('#bEb', body);
  eb.onpointermove = e => { const r = eb.getBoundingClientRect(), i = inv(e.clientX - r.left), d = A.m2.erp.conditions[R.erpT].channels[R.erpCh]; R.erpHov = i; big();
    $('#bEr', body).textContent = T('b.readErp', { t: A.m2.erp.times_ms[i], p: n1(d.patient_uv[i]), m: n1(d.norm_mean_uv[i]), s: n1(2 * d.norm_sd_uv[i]) }); };
  eb.onpointerleave = () => { R.erpHov = null; big(); };
  small(); big(); redraw = () => { small(); big(); };
}

/* ---------------- VCPT behaviour ---------------- */
function vcpt(body) {
  const V = A.m2.vcpt, M = [['omissions', T('b.om'), '', T('b.ofGo', { n: V.trials.go })], ['commissions', T('b.cm'), '', T('b.ofNoGo', { n: V.trials.nogo })], ['rt_mean_ms', T('b.rt'), ' ms', T('b.goTrials')], ['rt_sd_ms', T('b.rtsd'), ' ms', T('b.goTrials')]];
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="grid b-tiles">${M.map(([k, l, u, s]) => { const v = V[k]; return `<div class="card"><div class="bd"><div class="xs muted">${l}</div>
      <div class="row" style="gap:8px;align-items:baseline"><b class="num" style="font-size:22px">${v.value}${u}</b><span class="xs muted">${s}</span></div>
      <div class="row between xs"><span>${T('b.percentile')} <b class="num">${Math.round(v.percentile)}</b></span><span class="num">z ${fz(v.z)}</span></div>
      <div class="paper b-pbar" title="${T('b.percT', { p: Math.round(v.percentile) })}"><i class="b-pr"></i><i class="b-pm" style="left:50%"></i><b style="left:${v.percentile}%;background:${A.zColor(v.z)}"></b></div>
      <div class="mono xs muted row between" style="margin-top:2px"><span>0</span><span>50</span><span>100</span></div></div></div>`; }).join('')}</div>
    <div class="card"><div class="hd"><h3>${T('b.epb')}</h3><span class="xs muted">${T('b.epbSub')}</span></div><div class="bd"><div class="paper b-fig"><canvas id="bVb" aria-label="${T('b.epb')}"></canvas></div></div></div>
    ${sents(T('b.sents'), A.sentences.m2.behaviour)}
  </div>`;
  const draw = () => {
    const cv = $('#bVb', body), W = Math.max(300, Math.min(760, cv.parentElement.clientWidth - 2)), H = 170, e = V.errors_per_block, mx = Math.max(3, ...e), g = cvs(cv, W, H);
    const ml = 34, mb = 24, mt = 10, pw = W - ml - 10, ph = H - mt - mb, bw = pw / e.length;
    font(g, 10, 400, true);
    for (let v = 0; v <= mx; v++) { const Y = mt + ph - v / mx * ph; g.strokeStyle = GRID; g.beginPath(); g.moveTo(ml, Math.round(Y) + 0.5); g.lineTo(ml + pw, Math.round(Y) + 0.5); g.stroke(); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(String(v), ml - 6, Y + 3); }
    e.forEach((v, i) => { const X = ml + i * bw + bw * 0.2, h = v / mx * ph; g.fillStyle = '#4d6a80'; g.fillRect(X, mt + ph - h, bw * 0.6, h); g.fillStyle = MUTED; g.textAlign = 'center'; g.fillText(String(i + 1), X + bw * 0.3, mt + ph + 14); });
    g.textAlign = 'left'; g.fillText(T('b.block'), ml + pw - 30, H - 1);
  };
  draw(); redraw = draw;
}

/* ---------------- Frequency markers ---------------- */
function postSpec() {
  const C = A.m2.spectra.conditions.EC, ix = POST.map(c => CH.indexOf(c)), avg = (k) => A.m2.spectra.freqs.map((_, j) => ix.reduce((s, i) => s + C[k][i][j], 0) / ix.length);
  return { f: A.m2.spectra.freqs, lp: avg('log_power'), mu: avg('norm_log_mean'), sd: avg('norm_log_sd'), ap: C.alpha_peak };
}
function markers(body) {
  const P = postSpec(), st = A.state.markers, sys = P.ap.hz;
  if (R.mk == null) R.mk = st.hz ?? sys;
  const zOf = (hz) => (hz - P.ap.norm_mean) / P.ap.norm_sd;
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T('b.apTitle', { list: POST.join(', ') })}</h3><span class="row"><span class="chip amber">${T('b.coreConf')}</span>${A.ann('Table 3.3: frequency markers with automatic peak suggestion')}</span></div>
      <div class="bd"><div class="paper b-fig"><canvas id="bMk" tabindex="0" aria-label="${T('b.mkAria')}"></canvas></div>
        <div class="b-mkbar"><div class="row"><button class="btn sm" id="bMl" aria-label="${T('b.mkDown', { v: A.nf(0.1, 1) })}">◀ ${A.nf(0.1, 1)} Hz</button><button class="btn sm" id="bMr" aria-label="${T('b.mkUp', { v: A.nf(0.1, 1) })}">${A.nf(0.1, 1)} Hz ▶</button><button class="btn sm ghost" id="bM0">${T('b.mkReset')}</button></div>
          <dl class="kv b-mkkv" id="bMkv"></dl><div class="row" id="bMa"></div></div>
        <div class="xs muted">${T('b.mkHelp')}</div></div></div>
  </div>`;
  const cv = $('#bMk', body); let sp = null, drag = false;
  const draw = () => { sp = drawSpec(cv, Math.max(300, cv.parentElement.clientWidth - 2), { f: P.f, lp: P.lp, mu: P.mu, sd: P.sd, f0: 2, f1: 20, H: 280, marks: [{ hz: sys, kind: 'sys', label: T('b.suggested') + ' ' }, { hz: R.mk, kind: 'user', label: T(st.confirmed ? 'b.confirmedL' : 'b.marker') + ' ' }] }); };
  const info = () => {
    $('#bMkv', body).innerHTML = `<dt>${T('b.suggested')}</dt><dd class="num">${A.nf(sys, 1)} Hz</dd><dt>${T('b.marker')}</dt><dd class="num"><b>${A.nf(R.mk, 1)} Hz</b> · z ${fz(zOf(R.mk))}</dd><dt>${T('b.norm')}</dt><dd class="num">${T('b.mkNorm', { m: A.nf(P.ap.norm_mean, 2), s: A.nf(P.ap.norm_sd, 2) })}</dd>`;
    $('#bMa', body).innerHTML = st.confirmed && st.hz === R.mk ? `<span class="chip ok">${T('b.mkConfBy', { hz: A.nf(st.hz, 1) })}</span><button class="btn sm" id="bMc">${T('b.change')}</button>` : `<button class="btn primary" id="bMok">${T('b.confirmHz', { hz: A.nf(R.mk, 1) })}</button>`;
    const ok = $('#bMok', body); if (ok) ok.onclick = () => {
      const moved = Math.abs(R.mk - sys) > 1e-6; st.confirmed = true; st.hz = R.mk;
      A.addLog('who.c1', moved ? 'b.log.mkMoved' : 'b.log.mkConf', { a: { $n: sys, d: 1 }, b: { $n: R.mk, d: 1 } });
      A.toast(T('b.toast.mk', { a: A.nf(R.mk, 1) })); $('#bRail', root0).innerHTML = rail(); wireRail(); draw(); info(); };
    const ch = $('#bMc', body); if (ch) ch.onclick = () => { st.confirmed = false; A.addLog('who.c1', 'b.log.mkOpen'); $('#bRail', root0).innerHTML = rail(); wireRail(); draw(); info(); };
  };
  const set = (hz) => { R.mk = Math.round(Math.max(6, Math.min(14, hz)) * 10) / 10; draw(); info(); };
  cv.onpointerdown = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; if (!sp.inside(px)) return; drag = true; cv.setPointerCapture(e.pointerId); set(sp.fAt(px)); };
  cv.onpointermove = e => { if (!drag) return; const r = cv.getBoundingClientRect(); set(sp.fAt(e.clientX - r.left)); };
  cv.onpointerup = () => { drag = false; };
  cv.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); set(R.mk + (e.key === 'ArrowLeft' ? -0.1 : 0.1)); } };
  $('#bMl', body).onclick = () => set(R.mk - 0.1); $('#bMr', body).onclick = () => set(R.mk + 0.1); $('#bM0', body).onclick = () => set(sys);
  draw(); info(); redraw = draw;
}
function wireRail() {
  $$('[data-sec]', root0).forEach(b => b.onclick = () => { R.sec = b.dataset.sec; R.off = null; show(root0); });
  $$('[data-off]', root0).forEach(b => b.onclick = () => { R.off = b.dataset.off; show(root0); });
}

A.css('b-results', `
.b-wrap { display: grid; grid-template-columns: 216px minmax(0, 1fr); gap: 16px; align-items: start; }
.b-rail { position: sticky; top: 64px; display: grid; gap: 1px; align-content: start; }
.b-rgrp { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding: 10px 10px 4px; }
.b-rgrp:first-child { padding-top: 0; }
.b-ri { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; border: 0; background: none; padding: 7px 10px; border-radius: 6px; font-size: 13.5px; color: var(--ink-2); }
.b-ri:hover { background: var(--surface); color: var(--ink); }
.b-ri.on { background: var(--surface); color: var(--ink); font-weight: 600; box-shadow: inset 3px 0 0 var(--accent), var(--shadow); }
.b-ri.off { color: var(--muted); font-size: 12.5px; }
.b-ri.off small { display: block; font-size: 11px; opacity: 0.85; font-weight: 400; }
.b-ri .chip { font-size: 10.5px; padding: 0 6px; }
.b-cnt { font-family: var(--f-mono); font-size: 11px; color: var(--muted); background: var(--surface-2); border: 1px solid var(--line); border-radius: 99px; padding: 0 6px; }
.b-main { display: grid; gap: 12px; min-width: 0; }
.b-tb { position: sticky; top: 52px; z-index: 6; border: 1px solid var(--line); border-radius: var(--r); box-shadow: var(--shadow); }
.b-tt { font-size: 15px; margin-right: 4px; }
.b-sp { flex: 1; }
.b-pre { padding: 6px 12px; align-items: center; }
.b-two { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 14px; align-items: start; }
@media (max-width: 1240px) { .b-two { grid-template-columns: minmax(0, 1fr); } }
.b-maps { display: flex; flex-wrap: wrap; gap: 4px 6px; padding: 8px; align-items: flex-end; }
.b-maps canvas { cursor: pointer; border-radius: 4px; }
.b-maps canvas.on { outline: 2px solid ${MARK}; }
.b-zs { padding: 8px 8px 0; }
.b-fig { padding: 6px; overflow: hidden; } .b-fig canvas { display: block; touch-action: none; }
#bSpec { cursor: crosshair; } #bMk { cursor: ew-resize; } #bCh { cursor: pointer; margin: 0 auto; } #bEb { cursor: crosshair; }
.b-read { padding-top: 6px; color: var(--muted); min-height: 18px; }
.b-leg { display: inline-flex; flex-wrap: wrap; gap: 4px 12px; font-size: 11.5px; color: var(--muted); align-items: center; }
.b-leg i { display: inline-block; width: 14px; height: 9px; border-radius: 2px; margin-right: 5px; vertical-align: 0; }
.b-ztw { max-height: 560px; overflow: auto; }
.tbl.b-zt td, .tbl.b-zt th { padding: 4px 8px; font-size: 12px; }
.b-zt tr.sel td:first-child, .tbl tr.sel td:first-child { box-shadow: inset 3px 0 0 var(--accent); font-weight: 600; }
.tbl tr.sel td { border-bottom-color: var(--accent); }
.b-zc { font-family: var(--f-mono); font-variant-numeric: tabular-nums; }
.b-colsel { outline: 2px solid ${MARK}; outline-offset: -2px; } th.b-colon { color: var(--ink); }
.b-hz { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 2px; padding: 6px; justify-items: center; }
.b-hz canvas { cursor: pointer; border-radius: 4px; } .b-hz canvas.on { outline: 2px solid ${MARK}; }
.b-sys .sys:first-child { margin-top: 0; } .b-sys .sys:last-child { margin-bottom: 0; }
.b-rat { display: grid; grid-template-columns: 82px auto 1fr; gap: 2px 10px; align-items: center; padding-top: 8px; }
.b-rat b { font-size: 19px; font-weight: 600; } .b-rat .b-gauge { grid-column: 1 / -1; }
.b-gauge { position: relative; display: block; height: 10px; border-radius: 99px; background: #eceeea; }
.b-gauge .b-g2 { position: absolute; top: 0; bottom: 0; background: #dfe2dc; }
.b-gauge .b-g0 { position: absolute; left: 50%; top: -2px; bottom: -2px; width: 1px; background: #9aa09a; }
.b-gauge b { position: absolute; top: -3px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #8b9096; }
.b-tl { border-radius: var(--r) var(--r) 0 0; }
.b-tl input[type=range] { width: 120px; vertical-align: middle; }
.b-coh { display: grid; grid-template-columns: minmax(260px, 400px) minmax(0, 1fr); gap: 14px; padding: 12px; align-items: start; }
@media (max-width: 1000px) { .b-coh { grid-template-columns: minmax(0, 1fr); } }
.b-cohf { display: grid; justify-items: center; }
.b-ctw { max-height: 380px; overflow: auto; border: 1px solid var(--line); border-radius: 6px; }
.b-ctw .tbl td, .b-ctw .tbl th { padding: 4px 10px; } .b-ctw thead th { position: sticky; top: 0; z-index: 1; }
.b-ctw tr[data-p]:hover td { background: var(--accent-soft); }
.b-th { border: 0; background: none; padding: 0; font: inherit; color: inherit; } .b-th:hover { color: var(--accent); }
.b-erp { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px; align-items: start; }
@media (max-width: 1240px) { .b-erp { grid-template-columns: minmax(0, 1fr); } }
.b-eg { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; padding: 8px; min-width: 400px; }
.b-ec { border: 1px solid transparent; background: none; padding: 2px 3px 3px; border-radius: 5px; display: grid; gap: 1px; text-align: left; color: #33373a; }
.b-ec span { font-family: var(--f-mono); font-size: 10.5px; } .b-ec canvas { display: block; }
.b-ec:hover { border-color: #b9bbb6; } .b-ec.on { border-color: ${MARK}; box-shadow: 0 0 0 1px ${MARK}; } .b-ec.on span { font-weight: 600; color: ${MARK}; }
.b-erpd { padding: 12px; min-width: 0; }
.b-tiles { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.b-pbar { position: relative; height: 12px; margin-top: 8px; border-radius: 99px; background: #eceeea; }
.b-pbar .b-pr { position: absolute; left: 2.3%; right: 2.3%; top: 0; bottom: 0; background: #e1e4de; }
.b-pbar .b-pm { position: absolute; top: -2px; bottom: -2px; width: 1px; background: #9aa09a; }
.b-pbar b { position: absolute; top: -3px; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #8b9096; }
.b-mkbar { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; padding: 10px 0 8px; }
.b-mkkv { grid-template-columns: auto auto; gap: 2px 10px; font-size: 12.5px; }
.b-off { display: flex; gap: 16px; align-items: flex-start; padding: 22px; }
.b-offic { font-size: 26px; color: var(--muted); line-height: 1; }
.c-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 14px; }
.c-maps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow-x: auto; gap: 2px; padding: 6px; justify-items: center; }
.c-maps canvas { cursor: pointer; }
.c-tbl td.c-g { color: var(--muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; background: var(--surface-2); }
@media (max-width: 900px) {
  .b-wrap { grid-template-columns: minmax(0, 1fr); }
  .b-rail { position: static; display: flex; overflow-x: auto; gap: 4px; padding-bottom: 4px; }
  .b-rgrp { display: none; } .b-ri { white-space: nowrap; flex: none; } .b-ri.off small { display: none; }
  .b-meta { display: none; } .c-maps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}`);

window.Modules.results = {
  render(root) {
    root0 = root; R.mk = null;
    const pre = !A.state.cleaning.confirmed;
    root.innerHTML = `<div class="b-wrap"><nav class="b-rail" id="bRail" aria-label="${T('b.railAria')}"></nav>
      <div class="b-main">${pre ? `<div class="banner amber b-pre"><b>${T('b.prelim')}</b><span style="flex:1">${T('b.prelimText')}</span><button class="btn sm" id="bGoCl">${T('b.openCln')}</button></div>` : ''}
        <div class="toolbar b-tb" id="bTb" role="toolbar" aria-label="${T('b.viewAria')}"></div><div id="bBody"></div></div></div>`;
    const gc = $('#bGoCl', root); if (gc) gc.onclick = () => A.go('cleaning');
    show(root);
    let last = root.clientWidth;
    ro = new ResizeObserver(() => { const w = root.clientWidth; if (Math.abs(w - last) > 4) { last = w; if (R.sec === 'spectra' || R.sec === 'erp' || R.sec === 'asym') show(root); else if (redraw) redraw(); } });
    ro.observe(root);
  },
  destroy() { if (ro) ro.disconnect(); ro = null; },
};

/* ================================ Compare page ================================ */
const CMP = { cond: 'EC', meas: 'abs', ch: 'Fz' };
let cro = null;
function cmpRows() {
  const M = [A.m1, A.m2], S = (m, k) => m.spectra.conditions[k], key = CMP.meas === 'abs' ? 'abs_z' : 'rel_z', i = CH.indexOf(CMP.ch);
  const rows = [];
  rows.push({ g: T('c.g.band', { ch: CMP.ch, m: T(CMP.meas === 'abs' ? 'c.absolute' : 'c.relative'), cond: cll(CMP.cond) }) });
  BN.forEach(b => rows.push({ l: BL[b], v: M.map(m => { const B = S(m, CMP.cond).bands[b]; return [CMP.meas === 'abs' ? n1(B.abs_uv2[i]) + ' µV²' : n1(B.rel_pct[i]) + ' %', B[key][i]]; }) }));
  rows.push({ g: T('b.s.ratios') });
  ['EO', 'EC'].forEach(k => rows.push({ l: T('c.tbr', { cond: cll(k) }), v: M.map(m => [n1(S(m, k).tbr.value, 2), S(m, k).tbr.z]) }));
  ['EO', 'EC'].forEach(k => rows.push({ l: T('c.faa', { cond: cll(k) }), v: M.map(m => [n1(S(m, k).faa.value, 2), S(m, k).faa.z]) }));
  ['EO', 'EC'].forEach(k => rows.push({ l: T('c.apf', { cond: cll(k) }), v: M.map(m => [n1(S(m, k).alpha_peak.hz) + ' Hz', S(m, k).alpha_peak.z]) }));
  rows.push({ g: T('c.g.coh', { cond: cll(CMP.cond) }) });
  BN.forEach(b => { const p1 = A.m1.coherence[CMP.cond][b].pairs, p2 = A.m2.coherence[CMP.cond][b].pairs;
    p2.forEach((p, j) => { if (Math.abs(p.z) >= 2.95 || Math.abs(p1[j].z) >= 2.95) rows.push({ l: `${BL[b]} ${p.pair}`, v: [[n1(p1[j].value, 3), p1[j].z], [n1(p.value, 3), p.z]] }); });
    rows.push({ l: T('c.glob', { b: BL[b] }), v: [[n1(A.m1.coherence[CMP.cond][b].global.value, 3), A.m1.coherence[CMP.cond][b].global.z], [n1(A.m2.coherence[CMP.cond][b].global.value, 3), A.m2.coherence[CMP.cond][b].global.z]] }); });
  rows.push({ g: T('b.r.erp') });
  A.m2.erp.peaks.forEach(p => { const q = A.m1.erp.peaks.find(x => x.component === p.component && x.condition === p.condition && x.site === p.site);
    rows.push({ l: T('c.amp', { c: p.component, site: p.site, trial: ERPT.find(e => e[0] === p.condition)[1] }), v: [q ? [n1(q.amplitude_uv) + ' µV', q.amplitude_z] : ['', null], [n1(p.amplitude_uv) + ' µV', p.amplitude_z]] }); });
  rows.push({ g: T('b.s.vcpt') });
  [['omissions', T('b.om'), ''], ['commissions', T('b.cm'), ''], ['rt_mean_ms', T('b.rt'), ' ms'], ['rt_sd_ms', T('b.rtsd'), ' ms']]
    .forEach(([k, l, u]) => rows.push({ l, v: M.map(m => [m.vcpt[k].value + u + ` · P${Math.round(m.vcpt[k].percentile)}`, m.vcpt[k].z]) }));
  return rows;
}
function cmpDraw(root) {
  const key = CMP.meas === 'abs' ? 'abs_z' : 'rel_z';
  [A.m1, A.m2].forEach((m, j) => $$(`#cM${j} canvas`, root).forEach(cv => { const b = cv.dataset.b, bd = BANDS.find(x => x.name === b);
    cv._hit = A.topo(cv, m.spectra.conditions[CMP.cond].bands[b][key], { size: 108, title: `${BL[b]} ${T('b.rangeHz', { a: A.nx(bd.lo), b: A.nx(bd.hi) })}`, highlight: CMP.ch, marks: [CMP.ch] }); }));
  const rows = cmpRows();
  $('#cT', root).innerHTML = `<table class="tbl c-tbl"><tr><th>${T('b.measure')}</th><th class="num">${A.fmtDate(A.m1.date)}</th><th class="num">z</th><th class="num">${A.fmtDate(A.m2.date)}</th><th class="num">z</th></tr>
    ${rows.map(r => r.g ? `<tr><td colspan="5" class="c-g">${esc(r.g)}</td></tr>` : `<tr><td>${esc(r.l)}${r.tag ? ` <span class="chip amber">${r.tag}</span>` : ''}</td><td class="num">${esc(r.v[0][0])}</td>${zc(r.v[0][1])}<td class="num">${esc(r.v[1][0])}</td>${zc(r.v[1][1])}</tr>`).join('')}</table>`;
}
window.Modules.compare = {
  render(root) {
    const lim = A.sentences.m2.limits.filter(s => s.id === 'L-REPROC-1' || s.id === 'L-SIDE-1');
    const head = (m, j) => `<div class="hd"><div><h3>${A.fmtDate(m.date)}</h3><div class="xs muted">${esc(T('c.headMeta', { a: A.nx(m.age_years), sw: m.processed_with.software, norms: A.dv(m.processed_with.norms) }))}</div></div>${m.processed_with.reprocessed ? `<span class="chip info">${T('c.reproc', { d: A.fmtDate('2026-10-29') })}</span>` : `<span class="chip">${T('c.current')}</span>`}</div>`;
    root.innerHTML = `<div class="grid" style="gap:14px">
      <div class="pagehead"><div><h1>${T('c.title')}</h1><div class="muted small"><span class="mono">MOCK-042</span> · ${esc(A.name())} · ${T('c.sub')} ${A.ann('3.4 Earlier recordings')}</div></div></div>
      <div class="banner"><b>${T('c.reprocB')}</b><span style="flex:1">${T('c.reprocText', { d: A.fmtDate(A.m1.date) })}</span></div>
      <div class="card"><div class="toolbar b-tl"><div class="seg" id="cCond">${['EO', 'EC'].map(k => `<button data-k="${k}" class="${CMP.cond === k ? 'on' : ''}">${cl(k)}</button>`).join('')}</div>
        <div class="seg" id="cMeas">${[['abs', 'b.abs'], ['rel', 'b.rel']].map(([k, l]) => `<button data-k="${k}" class="${CMP.meas === k ? 'on' : ''}">${T(l)}</button>`).join('')}</div>
        <span class="sep"></span><label>${T('c.channel')} <select id="cCh">${CH.map(c => `<option ${c === CMP.ch ? 'selected' : ''}>${c}</option>`).join('')}</select></label><span class="xs muted">${T('c.clickBoth')}</span></div>
        <div class="c-two" style="padding:12px">${[A.m1, A.m2].map((m, j) => `<div class="card">${head(m, j)}<div class="bd"><div class="paper c-maps" id="cM${j}">${BN.map(b => `<canvas data-b="${b}" aria-label="${T('c.mapAria', { b: BL[b], d: A.fmtDate(m.date) })}"></canvas>`).join('')}</div></div></div>`).join('')}</div>
        <div style="padding:0 12px 12px"><div class="paper" style="padding:8px;display:inline-block">${A.zScale()}</div></div></div>
      <div class="card"><div class="hd"><h3>${T('c.selected')}</h3><span class="xs muted">${T('c.selSub')}</span></div><div class="scroll-x" id="cT"></div></div>
      ${sents(T('c.comparison'), A.sentences.m2.comparison)}
      ${sents(T('b.limits'), lim)}
    </div>`;
    const sel = (c) => { if (!c) return; CMP.ch = c; $('#cCh', root).value = c; cmpDraw(root); };
    $$('#cCond button', root).forEach(b => b.onclick = () => { CMP.cond = b.dataset.k; $$('#cCond button', root).forEach(x => x.classList.toggle('on', x === b)); cmpDraw(root); });
    $$('#cMeas button', root).forEach(b => b.onclick = () => { CMP.meas = b.dataset.k; $$('#cMeas button', root).forEach(x => x.classList.toggle('on', x === b)); cmpDraw(root); });
    $('#cCh', root).onchange = e => sel(e.target.value);
    $$('.c-maps canvas', root).forEach(cv => cv.onclick = e => { const r = cv.getBoundingClientRect(); sel(cv._hit(e.clientX - r.left, e.clientY - r.top)); });
    cmpDraw(root);
  },
  destroy() { if (cro) cro.disconnect(); cro = null; },
};
