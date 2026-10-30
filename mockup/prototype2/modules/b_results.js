/* Module B: workspace tab "Results" (analysis sections) and the page "Compare measurements".
   All figures draw from the synthetic case in APP.m2 / APP.m1 on light .paper surfaces with the
   fixed z scale. Screen text is product copy; system text comes only from APP.sentences. */
const A = window.APP, T = A.t;
A.addI18n({
  en: {
    'b.logScale': 'µV²/Hz, log scale', 'b.patient': 'Patient', 'b.normBand': 'Norm mean ± 2 SD',
    'b.s.summary': 'Summary', 'b.s.spectra': 'Spectra and maps', 'b.s.ratios': 'Ratios and indices', 'b.s.asym': 'Asymmetry', 'b.s.coh': 'Coherence',
    'b.s.erp': 'Channel ERPs', 'b.s.vcpt': 'VCPT behaviour', 'b.s.markers': 'Frequency markers',
    'b.o.ai': 'AI interpretation', 'b.o.quest': 'Questionnaires', 'b.o.sloreta': 'sLORETA source maps', 'b.o.icaerp': 'ICA component ERPs, ERPC2 checklist',
    'b.o.micro': 'Microstates, vigilance model', 'b.o.clf': 'Classifier (legacy)', 'b.o.spike': 'Spike detection', 'b.o.workload': 'Workload index (frontal theta / parietal alpha)',
    'b.o.arousal': 'Arousal index, central sensitivity index (CSI)', 'b.o.lagged': 'Lagged, instantaneous and total coherence', 'b.o.icamaps': 'ICA component maps and spectra as a result view',
    'b.o.rtfig': 'Reaction time over trials and reaction time histogram', 'b.n.decide': 'status to decide: a difference from V3 for the clinical lead',
    'b.o.subtype': 'Subtype and response classifiers (legacy)', 'b.o.recom': 'Recommendation texts (legacy)', 'b.o.grouped': 'Grouped summary table (legacy, one template)',
    'b.o.bio': 'Bio signals, heart rate variability, external ERP program', 'b.o.change': 'Test whether a change between measurements is significant',
    'b.st.later': 'Later module', 'b.st.open': 'Open', 'b.st.research': 'Research only', 'b.st.dropped': 'Dropped or not planned',
    'b.stx.later': 'Certified separately as a later module. Until then available only within a clinical study.', 'b.stx.open': 'Not decided yet: core or a later module.',
    'b.stx.research': 'Used only in research; no certification planned.', 'b.stx.dropped': 'Not in V4.', 'b.v3': 'In V3', 'b.v3.yes': 'yes, clinics keep using it while V3 runs', 'b.v3.no': 'no, not in V3 either',
    'b.n.licence': 'under licence', 'b.n.licFirst': 'needs a licence from its owner first', 
    'b.nFunc': (p) => p.n === 1 ? '1 function' : `${p.n} functions`, 'b.function': 'Function', 'b.note': 'Note',
    'b.toConfirm': 'not confirmed', 'b.beyond2': 'Marked values', 'b.markedH': 'Marked', 'b.marked': 'marked',
    'b.mkLeg': 'Marked: differs from the norm after correction for multiple comparisons (method to be chosen)',
    'b.f.spectrum': 'Spectrum per 0.5 Hz bin', 'b.f.abs': 'Absolute band power', 'b.f.rel': 'Relative band power', 'b.f.maps1hz': 'Maps per 1 Hz band',
    'b.f.indices': 'Alpha peak, theta/beta ratio, frontal alpha asymmetry', 'b.f.asym': 'Asymmetry map', 'b.f.coh': 'Coherence per electrode pair',
    'b.f.cohglobal': 'Global coherence', 'b.f.erp_amp': 'ERP peak amplitude', 'b.f.erp_lat': 'ERP peak latency', 'b.f.vcpt': 'VCPT task results', 'b.family': 'Family',
    'b.d1': 'uncorrected beyond 2 z: {n}; expected by chance: {m}; marked after correction: {k}', 'b.d1T': 'Correction per block, for review only',
    'b.d1u': 'Beyond 2 z, uncorrected', 'b.d1e': 'Expected by chance', 'b.d1k': 'Marked after correction',
    'b.cohMarked': 'Marked pairs', 'b.cohAll': 'All pairs beyond 2 z (uncorrected)', 'b.cohNall': '{n} of 171 pairs beyond 2 z, uncorrected · {b} · {cond}',
    'b.pkHelp': 'Drag a peak marker: it snaps to the nearest peak of its polarity in the window; hold Shift to place it freely · arrow keys: next peak, with Shift 4 ms', 'b.pkConfirm': 'Confirm peaks · {t}',
    'b.pkConfBy': '✓ Peaks confirmed by {who} · {t}', 'b.pkSug': 'suggested {v} ms', 'b.pkMoved': 'moved', 'b.pkReset': 'Reset to suggestions',
    'b.pkLocked': 'Confirmed peaks are locked; choose Change to move them.', 'b.zLater': 'pending', 'b.zLaterT': 'z and marking of a moved peak are recomputed when the peaks are confirmed',
    'b.window': 'Window', 'b.pkNone': 'No peaks scored for this trial type; nothing to confirm.', 'b.pkState': (p) => p.m ? `${p.m} of ${p.n} moved` : `${p.n} as suggested`,
    'b.log.pkMoved': 'Moved the {c} peak at {site} ({t}) from the suggested {a} ms to {b} ms ({v} µV)', 'b.log.pkBack': 'Returned the {c} peak at {site} ({t}) to the suggested {a} ms',
    'b.log.pkConfS': 'Confirmed the suggested {t} peaks unchanged', 'b.log.pkConfM': 'Confirmed the {t} peaks with {m} of {n} moved', 'b.log.pkOpen': 'Reopened the {t} peaks for changes',
    'b.log.pkReset': 'Reset the {t} peaks to the suggestions', 'b.toast.pk': '{t} peaks confirmed', 'b.results': 'Results', 'b.notRelease': 'Outside the core (table 3.3)',
    'b.condAria': 'Condition', 'b.measAria': 'Measure', 'b.abs': 'Absolute', 'b.rel': 'Relative', 'b.meta': '{sw} · {norms} · age {a} y',
    'b.fixed': 'Fixed sentences',
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
    'b.zByPair': 'z by pair and band', 'b.pair': 'Pair', 'b.idxT': '{b} {p}: index {v}', 'b.nOf48': '{n} of 48 values marked', 'b.asymIdx': 'Asymmetry index',
    'b.asymNone': 'No sentence: no pair is marked in this condition.',
    'b.onlyBeyond': 'Table: shown pairs only', 'b.global': 'Global coherence', 'b.coreConf': 'Core, to confirm', 'b.cohAria': 'Coherence pairs shown',
    'b.aboveNorm': 'above norm', 'b.belowNorm': 'below norm', 'b.width': 'width: |z|', 'b.cohCount': '{n} coherence values: 171 pairs × 6 bands × 2 conditions.',
    'b.cohN': '{n} of 171 pairs marked · {b} · {cond}', 'b.clickEl': 'Click an electrode to filter', 'b.coherence': 'Coherence', 'b.noPair': 'No pair shown',
    'b.trialsAcc': '{a} of {n} trials accepted', 'b.scale': 'Scale ±{s} µV · -200 to 800 ms', 'b.peakZ': 'marked peak', 'b.erpAria': 'Enlarged channel ERP',
    'b.component': 'Component', 'b.amplitude': 'Amplitude', 'b.latency': 'Latency', 'b.noComp': 'No components scored for this trial type',
    'b.msFrom': 'ms from the second picture', 'b.uvUp': 'µV, positive up', 'b.readErp': '{t} ms · patient {p} µV · norm {m} ± {s}',
    'b.om': 'Omission errors', 'b.cm': 'Commission errors', 'b.rt': 'Mean reaction time', 'b.rtsd': 'Reaction time variability (SD)', 'b.ofGo': 'of {n} Go',
    'b.ofNoGo': 'of {n} NoGo', 'b.goTrials': 'Go trials', 'b.percentile': 'Percentile', 'b.percT': 'Percentile {p}', 'b.epb': 'Errors per block',
    'b.epbSub': '10 blocks of 40 trials · omission and commission errors', 'b.block': 'block',
    'b.apTitle': 'Alpha peak · eyes closed · posterior mean ({list})', 'b.mkAria': 'Posterior spectrum with the alpha peak marker; arrow keys move the marker',
    'b.mkDown': 'Move marker down {v} Hz', 'b.mkUp': 'Move marker up {v} Hz', 'b.mkReset': 'Reset to suggestion', 'b.mkHelp': 'Drag the marker or use the arrow keys.',
    'b.suggested': 'Suggested', 'b.marker': 'Marker', 'b.confirmedL': 'Confirmed', 'b.norm': 'Norm', 'b.mkNorm': '{m} Hz, SD {s}',
    'b.mkConfBy': '✓ Confirmed by {who} · {hz} Hz', 'b.change': 'Change', 'b.confirmHz': 'Confirm {hz} Hz',
    'b.log.mkMoved': 'Moved the alpha peak marker (eyes closed) from the suggested {a} Hz to {b} Hz and confirmed it',
    'b.log.mkConf': 'Confirmed the suggested alpha peak marker (eyes closed) at {a} Hz', 'b.toast.mk': 'Alpha peak marker confirmed at {a} Hz',
    'b.log.mkOpen': 'Reopened the alpha peak marker for changes',
    'b.lockT': 'Read only', 'b.lockMk': 'Report v{v} is issued, so the frequency markers are read only. A correction on the Issued tab reopens them.',
    'b.lockPk': 'Report v{v} is issued, so the ERP peaks are read only. A correction on the Issued tab reopens them.', 'b.openIssued': 'Open Issued',
    'b.toast.locked': 'Read only: {why}', 'b.why.issued': 'the report is issued', 'b.why.rejected': 'the recording is rejected', 'b.rejEmpty': 'Recording rejected: no results',
    'b.railAria': 'Result sections', 'b.prelim': 'Preliminary', 'b.prelimText': 'Cleaning not accepted yet.', 'b.openCln': 'Open Cleaning', 'b.viewAria': 'Result view',
    'bc.g.band': 'Band power at {ch} · {m} · {cond}', 'bc.absolute': 'absolute', 'bc.relative': 'relative', 'bc.tbr': 'Theta/beta ratio, Cz · {cond}',
    'bc.faa': 'Frontal alpha asymmetry index · {cond}', 'bc.apf': 'Alpha peak frequency · {cond}',
    'bc.g.coh': 'Coherence · {cond} · pairs marked in either measurement', 'bc.g.cohN': 'Coherence · {cond} · pairs marked in any of the measurements', 'bc.glob': '{b} global coherence',
    'bc.amp': '{c} amplitude, {site} · {trial}', 'bc.lat': '{c} latency, {site} · {trial}', 'bc.g.asym': 'Asymmetry index · {cond} · pairs marked in any measurement shown', 'bc.headMeta': 'Age {a} y · {sw} · {norms}', 'bc.reproc': 'Reprocessed {d}', 'bc.current': 'Current',
    'bc.title': 'Compare measurements', 'bc.sub': 'each measurement against its own age norm', 'bc.reprocB': 'Reprocessed',
    'bc.reprocText': 'The recording of {d} was processed again with the current software and norms. Differences between the two measurements are not tested.',
    'bc.channel': 'Channel', 'bc.clickBoth': 'Click a map to select a channel in both', 'bc.mapAria': '{b} map {d}', 'bc.selected': 'Selected measures',
    'bc.selSub': 'Value and z, each against its own norm', 'bc.comparison': 'Comparison',
    'b.s.checklist': 'Checklist over channel ERPs', 'b.noRes': 'no results',
    'b.nnT': 'No age norm', 'b.nnText': 'Age {a} years is outside the norm range of {lo} to {hi} years. Values are shown without z, percentile or marks, and nothing is compared with a norm.',
    'b.missT': '{cond}: no results', 'b.missText': '{a} of {r} s analysed, below the minimum of {m} s. The other conditions are complete.', 'b.openRec': 'Open Recording',
    'b.missEmpty': 'No results for {cond}', 'b.missSub': 'Analysed {a} of {r} s · minimum {m} s', 'b.valByCh': 'Values by channel and band',
    'b.valMaps': 'Band maps · {m} · {cond} · values', 'b.hzMapsV': '1 Hz maps · absolute power, µV²', 'b.seqScale': 'Colour: low to high value within each map, not a z scale',
    'b.low': 'low', 'b.high': 'high', 'b.nnNoCmp': 'No value is compared with a norm', 'b.nnNoSent': 'No sentence: no value is compared with a norm.',
    'b.nnNoMove': 'Peaks cannot be moved without an age norm', 'b.mkNoNorm': 'No age norm: the alpha peak frequency is shown as a value; nothing to confirm.',
    'b.cohSel': 'Pairs of {ch} · {b} · {cond}', 'b.cohScale': 'Colour: coherence value, 0 to 1', 'b.lineW': 'Line width: size of the index', 'b.idxByPair': 'Index by pair and band',
    'b.readSpecV': '{ch} · {f} Hz · patient {p} µV²/Hz', 'b.readErpV': '{t} ms · patient {p} µV',
    'bc.one': 'Only one measurement of this patient', 'bc.oneSub': 'Upload an earlier recording to compare. V4 processes it again; reports and numbers of earlier software are not imported.',
    'bc.upload': 'Add earlier recording', 'bc.earlier': 'Earlier', 'bc.later': 'Later', 'bc.pair': 'Two measurements', 'bc.allN': 'All {n}', 'bc.showing': 'Showing',
    'bc.uplLater': 'uploaded later', 'bc.uplLaterB': 'Uploaded later', 'bc.procNow': 'Processing again', 'bc.queued': 'Queued',
    'bc.procText': 'The recording of {d} is being processed with the current software and norms; it can be compared when processing is done.',
    'bc.reprocN': 'Processed again with the current software and norms: {list}. Differences between measurements are not tested.',
    'bc.import': '{d}: processed from its recording; the V3 report and its numbers are not imported.', 'bc.laterVs': 'later against earlier, each against its own age norm',
    'bc.clickAll': 'Click a map to select a channel in every measurement', 'bc.step': 'Step {s} of 9.', 'bc.pickAria': 'Measurements to compare',
    'b.sumAnalysis': 'Analysis and condition', 'b.sumValues': 'Electrodes, pairs or values, z', 'b.asPrinted': 'As printed in the report', 'b.key': 'Reading key',
    'b.keyRing': 'Ring and dot: marked value', 'b.sumOpen': 'Open {s}', 'b.normTick': 'norm', 'b.roRole': 'View only: your role does not confirm results',
    'b.relScale': '% of total power, log scale', 'b.hzMapsRel': '1 Hz maps · relative power, z', 'b.readSpecRel': '{ch} · {f} Hz · patient {p} % · norm mean {m} % · z {z}',
    'b.cohHeads': 'Marked pairs by band · {cond}', 'b.cohHeadsHelp': 'Click a head to select a band', 'b.sentsBand': 'Sentences · {cond} · {b}', 'b.allBands': 'All bands',
    'b.oneBand': 'Selected band', 'b.noBandSent': 'No sentence for {b}: no pair is marked in this band.', 'b.epbSub2': '10 blocks of 40 trials · counts per block, without norms',
    'b.lowTrials': 'few trials', 'b.rsRec': 'Recomputing', 'b.rsRecText': 'Your confirmed change gives a new result set ({id}): step {s} of 9. Until it is done, the values of {prev} are shown.',
    'b.rsChip': 'Result set {n} · after your change', 'b.log.rsStart': 'Started recomputing the results after a confirmed change: result set {n} ({id})', 'b.log.rsDone': 'Result set {id} computed',
  },
  de: {
    'b.logScale': 'µV²/Hz, logarithmisch', 'b.patient': 'Patient', 'b.normBand': 'Normmittelwert ± 2 SD',
    'b.s.summary': 'Zusammenfassung', 'b.s.spectra': 'Spektren und Karten', 'b.s.ratios': 'Quotienten und Indizes', 'b.s.asym': 'Asymmetrie', 'b.s.coh': 'Kohärenz',
    'b.s.erp': 'Kanal-ERPs', 'b.s.vcpt': 'VCPT-Aufgabenleistung', 'b.s.markers': 'Frequenzmarker',
    'b.o.ai': 'KI-Interpretation', 'b.o.quest': 'Fragebögen', 'b.o.sloreta': 'sLORETA-Quellenkarten', 'b.o.icaerp': 'ERPs der ICA-Komponenten, ERPC2-Checkliste',
    'b.o.micro': 'Mikrozustände, Vigilanzmodell', 'b.o.clf': 'Klassifikator (Altsystem)', 'b.o.spike': 'Spike-Erkennung', 'b.o.workload': 'Belastungsindex (frontales Theta / parietales Alpha)',
    'b.o.arousal': 'Arousal-Index, zentraler Sensitivitätsindex (CSI)', 'b.o.lagged': 'Verzögerte, instantane und totale Kohärenz', 'b.o.icamaps': 'Karten und Spektren der ICA-Komponenten als Ergebnisansicht',
    'b.o.rtfig': 'Reaktionszeit über die Durchgänge und Histogramm der Reaktionszeiten', 'b.n.decide': 'Status offen: ein Unterschied zu V3 für die klinische Leitung',
    'b.o.subtype': 'Subtyp- und Ansprechklassifikatoren (Altsystem)', 'b.o.recom': 'Empfehlungstexte (Altsystem)', 'b.o.grouped': 'Gruppierte Übersichtstabelle (Altsystem, eine Vorlage)',
    'b.o.bio': 'Biosignale, Herzratenvariabilität, externes ERP-Programm', 'b.o.change': 'Test, ob eine Veränderung zwischen Messungen signifikant ist',
    'b.st.later': 'Späteres Modul', 'b.st.open': 'Offen', 'b.st.research': 'Nur Forschung', 'b.st.dropped': 'Entfällt oder nicht geplant',
    'b.stx.later': 'Wird später als eigenes Modul zertifiziert. Bis dahin nur im Rahmen einer klinischen Studie verfügbar.', 'b.stx.open': 'Noch nicht entschieden: Kern oder späteres Modul.',
    'b.stx.research': 'Nur in der Forschung genutzt; keine Zertifizierung geplant.', 'b.stx.dropped': 'Nicht in V4.', 'b.v3': 'In V3', 'b.v3.yes': 'ja, Kliniken nutzen sie weiter, solange V3 läuft', 'b.v3.no': 'nein, auch nicht in V3',
    'b.n.licence': 'unter Lizenz', 'b.n.licFirst': 'braucht zuerst eine Lizenz des Eigentümers', 
    'b.nFunc': (p) => p.n === 1 ? '1 Funktion' : `${p.n} Funktionen`, 'b.function': 'Funktion', 'b.note': 'Hinweis',
    'b.toConfirm': 'nicht bestätigt', 'b.beyond2': 'Markierte Werte', 'b.markedH': 'Markiert', 'b.marked': 'markiert',
    'b.mkLeg': 'Markiert: weicht nach Korrektur für multiple Vergleiche von der Norm ab (Methode noch zu wählen)',
    'b.f.spectrum': 'Spektrum je 0,5-Hz-Schritt', 'b.f.abs': 'Absolute Bandleistung', 'b.f.rel': 'Relative Bandleistung', 'b.f.maps1hz': 'Karten je 1-Hz-Band',
    'b.f.indices': 'Alpha-Peak, Theta/Beta-Quotient, frontale Alpha-Asymmetrie', 'b.f.asym': 'Asymmetriekarte', 'b.f.coh': 'Kohärenz je Elektrodenpaar',
    'b.f.cohglobal': 'Globale Kohärenz', 'b.f.erp_amp': 'ERP-Peak-Amplitude', 'b.f.erp_lat': 'ERP-Peak-Latenz', 'b.f.vcpt': 'VCPT-Ergebnisse', 'b.family': 'Familie',
    'b.d1': 'unkorrigiert jenseits von 2 z: {n}; zufällig erwartet: {m}; nach Korrektur markiert: {k}', 'b.d1T': 'Korrektur je Block, nur zur Prüfung',
    'b.d1u': 'Jenseits von 2 z, unkorrigiert', 'b.d1e': 'Zufällig erwartet', 'b.d1k': 'Nach Korrektur markiert',
    'b.cohMarked': 'Markierte Paare', 'b.cohAll': 'Alle Paare jenseits von 2 z (unkorrigiert)', 'b.cohNall': '{n} von 171 Paaren jenseits von 2 z, unkorrigiert · {b} · {cond}',
    'b.pkHelp': 'Peak-Marker ziehen: Er rastet am nächsten Peak seiner Polarität im Fenster ein; mit gedrückter Umschalttaste frei setzen · Pfeiltasten: nächster Peak, mit Umschalttaste 4 ms', 'b.pkConfirm': 'Peaks bestätigen · {t}',
    'b.pkConfBy': '✓ Peaks bestätigt von {who} · {t}', 'b.pkSug': 'Vorschlag {v} ms', 'b.pkMoved': 'verschoben', 'b.pkReset': 'Auf Vorschläge zurücksetzen',
    'b.pkLocked': 'Bestätigte Peaks sind gesperrt; zum Verschieben „Ändern“ wählen.', 'b.zLater': 'ausstehend', 'b.zLaterT': 'z und Markierung eines verschobenen Peaks werden bei der Bestätigung der Peaks neu berechnet',
    'b.window': 'Fenster', 'b.pkNone': 'Für diesen Durchgangstyp sind keine Peaks ausgewertet; nichts zu bestätigen.', 'b.pkState': (p) => p.m ? `${p.m} von ${p.n} verschoben` : `${p.n} wie vorgeschlagen`,
    'b.log.pkMoved': '{c}-Peak an {site} ({t}) vom Vorschlag {a} ms auf {b} ms verschoben ({v} µV)', 'b.log.pkBack': '{c}-Peak an {site} ({t}) auf den Vorschlag {a} ms zurückgesetzt',
    'b.log.pkConfS': 'Vorgeschlagene {t}-Peaks unverändert bestätigt', 'b.log.pkConfM': '{t}-Peaks bestätigt, {m} von {n} verschoben', 'b.log.pkOpen': '{t}-Peaks für Änderungen wieder geöffnet',
    'b.log.pkReset': '{t}-Peaks auf die Vorschläge zurückgesetzt', 'b.toast.pk': '{t}-Peaks bestätigt', 'b.results': 'Ergebnisse', 'b.notRelease': 'Außerhalb des Kerns (Tabelle 3.3)',
    'b.condAria': 'Bedingung', 'b.measAria': 'Messgröße', 'b.abs': 'Absolut', 'b.rel': 'Relativ', 'b.meta': '{sw} · {norms} · Alter {a} J.',
    'b.fixed': 'Feste Sätze',
    'b.r.spectra': 'Bandleistung (absolut und relativ)', 'b.r.erp': 'Kanal-ERP-Peaks', 'b.largest': 'Größte Abweichungen von der Altersnorm',
    'b.compared': 'Mit der Norm verglichene Werte', 'b.both': 'beide Bedingungen', 'b.section': 'Abschnitt', 'b.values': 'Werte', 'b.openArrow': 'Öffnen ›',
    'b.quality': 'Signalqualität', 'b.cleaning': 'Bereinigung', 'b.limits': 'Hinweise', 'b.absPow': 'absolute Leistung', 'b.relPow': 'relative Leistung',
    'b.bandMaps': 'Bandkarten · {m} · {cond}', 'b.clickMap': 'Karte oder Elektrode anklicken, um einen Kanal zu wählen', 'b.mapAria': '{b}-Karte',
    'b.specAria': 'Leistungsspektrum des gewählten Kanals', 'b.readHelp': 'Über die Kurve fahren, um Werte abzulesen · klicken, um ein 1-Hz-Band zu wählen',
    'b.zByCh': 'z nach Kanal und Band', 'b.hzMaps': '1-Hz-Karten · absolute Leistung, z', 'b.hzHelp': 'Karte anklicken, um ihr Band im Spektrum zu markieren',
    'b.rangeHz': '{a} bis {b} Hz', 'b.sentsCond': 'Sätze · {cond}', 'b.sents': 'Sätze', 'b.ch': 'Kanal', 'b.atCh': '{b} an {c}: {v}',
    'b.specT': 'Spektrum · {ch} · {cond}', 'b.selHz': 'Ausgewählt: {a} bis {b} Hz',
    'b.readSpec': '{ch} · {f} Hz · Patient {p} µV²/Hz · Normmittelwert {m} · z {z}',
    'b.tbr': 'Theta/Beta-Quotient', 'b.faa': 'Frontaler Alpha-Asymmetrieindex', 'b.apf': 'Alpha-Peak-Frequenz', 'b.sd': '(SD {v})', 'b.table': 'Tabelle',
    'b.measure': 'Messgröße', 'b.site': 'Ort', 'b.condition': 'Bedingung', 'b.value': 'Wert', 'b.normMean': 'Normmittelwert',
    'b.asymPairs': 'Linke und rechte Paare nach Band · {cond}', 'b.asymHelp': 'Linienfarbe: z des Paars · Kopf anklicken, um ein Band zu wählen', 'b.asymAria': '{b}-Asymmetrie',
    'b.zByPair': 'z nach Paar und Band', 'b.pair': 'Paar', 'b.idxT': '{b} {p}: Index {v}', 'b.nOf48': '{n} von 48 Werten markiert', 'b.asymIdx': 'Asymmetrieindex',
    'b.asymNone': 'Kein Satz: In dieser Bedingung ist kein Paar markiert.',
    'b.onlyBeyond': 'Tabelle: nur gezeigte Paare', 'b.global': 'Globale Kohärenz', 'b.coreConf': 'Kern, zu bestätigen', 'b.cohAria': 'Gezeigte Kohärenzpaare',
    'b.aboveNorm': 'über der Norm', 'b.belowNorm': 'unter der Norm', 'b.width': 'Breite: |z|', 'b.cohCount': '{n} Kohärenzwerte: 171 Paare × 6 Bänder × 2 Bedingungen.',
    'b.cohN': '{n} von 171 Paaren markiert · {b} · {cond}', 'b.clickEl': 'Elektrode anklicken, um zu filtern', 'b.coherence': 'Kohärenz', 'b.noPair': 'Kein Paar gezeigt',
    'b.trialsAcc': '{a} von {n} Durchgängen akzeptiert', 'b.scale': 'Skala ±{s} µV · -200 bis 800 ms', 'b.peakZ': 'markierter Peak', 'b.erpAria': 'Vergrößertes Kanal-ERP',
    'b.component': 'Komponente', 'b.amplitude': 'Amplitude', 'b.latency': 'Latenz', 'b.noComp': 'Für diesen Durchgangstyp keine Komponenten ausgewertet',
    'b.msFrom': 'ms ab dem zweiten Bild', 'b.uvUp': 'µV, positiv nach oben', 'b.readErp': '{t} ms · Patient {p} µV · Norm {m} ± {s}',
    'b.om': 'Auslassungsfehler', 'b.cm': 'Fehlreaktionen (Kommissionsfehler)', 'b.rt': 'Mittlere Reaktionszeit', 'b.rtsd': 'Variabilität der Reaktionszeit (SD)', 'b.ofGo': 'von {n} Go',
    'b.ofNoGo': 'von {n} NoGo', 'b.goTrials': 'Go-Durchgänge', 'b.percentile': 'Perzentil', 'b.percT': 'Perzentil {p}', 'b.epb': 'Fehler je Block',
    'b.epbSub': '10 Blöcke zu je 40 Durchgängen · Auslassungsfehler und Fehlreaktionen', 'b.block': 'Block',
    'b.apTitle': 'Alpha-Peak · Augen geschlossen · posteriorer Mittelwert ({list})', 'b.mkAria': 'Posteriores Spektrum mit dem Alpha-Peak-Marker; die Pfeiltasten verschieben den Marker',
    'b.mkDown': 'Marker um {v} Hz nach unten', 'b.mkUp': 'Marker um {v} Hz nach oben', 'b.mkReset': 'Auf Vorschlag zurücksetzen', 'b.mkHelp': 'Marker ziehen oder die Pfeiltasten verwenden.',
    'b.suggested': 'Vorschlag', 'b.marker': 'Marker', 'b.confirmedL': 'Bestätigt', 'b.norm': 'Norm', 'b.mkNorm': '{m} Hz, SD {s}',
    'b.mkConfBy': '✓ Bestätigt von {who} · {hz} Hz', 'b.change': 'Ändern', 'b.confirmHz': '{hz} Hz bestätigen',
    'b.log.mkMoved': 'Alpha-Peak-Marker (Augen geschlossen) vom Vorschlag {a} Hz auf {b} Hz verschoben und bestätigt',
    'b.log.mkConf': 'Vorgeschlagenen Alpha-Peak-Marker (Augen geschlossen) bei {a} Hz bestätigt', 'b.toast.mk': 'Alpha-Peak-Marker bei {a} Hz bestätigt',
    'b.log.mkOpen': 'Alpha-Peak-Marker für Änderungen wieder geöffnet',
    'b.lockT': 'Schreibgeschützt', 'b.lockMk': 'Bericht v{v} ist freigegeben, daher sind die Frequenzmarker schreibgeschützt. Eine Korrektur im Tab Freigegeben öffnet sie wieder.',
    'b.lockPk': 'Bericht v{v} ist freigegeben, daher sind die ERP-Peaks schreibgeschützt. Eine Korrektur im Tab Freigegeben öffnet sie wieder.', 'b.openIssued': 'Freigegeben öffnen',
    'b.toast.locked': 'Schreibgeschützt: {why}', 'b.why.issued': 'der Bericht ist freigegeben', 'b.why.rejected': 'die Aufnahme ist abgelehnt', 'b.rejEmpty': 'Aufnahme abgelehnt: keine Ergebnisse',
    'b.railAria': 'Ergebnisabschnitte', 'b.prelim': 'Vorläufig', 'b.prelimText': 'Bereinigung noch nicht übernommen.', 'b.openCln': 'Bereinigung öffnen', 'b.viewAria': 'Ergebnisansicht',
    'bc.g.band': 'Bandleistung an {ch} · {m} · {cond}', 'bc.absolute': 'absolut', 'bc.relative': 'relativ', 'bc.tbr': 'Theta/Beta-Quotient, Cz · {cond}',
    'bc.faa': 'Frontaler Alpha-Asymmetrieindex · {cond}', 'bc.apf': 'Alpha-Peak-Frequenz · {cond}',
    'bc.g.coh': 'Kohärenz · {cond} · Paare, die in einer der beiden Messungen markiert sind', 'bc.g.cohN': 'Kohärenz · {cond} · Paare, die in mindestens einer der Messungen markiert sind', 'bc.glob': 'Globale {b}-Kohärenz',
    'bc.amp': '{c}-Amplitude, {site} · {trial}', 'bc.lat': '{c}-Latenz, {site} · {trial}', 'bc.g.asym': 'Asymmetrieindex · {cond} · Paare, die in einer der gezeigten Messungen markiert sind', 'bc.headMeta': 'Alter {a} J. · {sw} · {norms}', 'bc.reproc': 'Neu verarbeitet am {d}', 'bc.current': 'Aktuell',
    'bc.title': 'Messungen vergleichen', 'bc.sub': 'jede Messung gegen ihre eigene Altersnorm', 'bc.reprocB': 'Neu verarbeitet',
    'bc.reprocText': 'Die Aufnahme vom {d} wurde mit der aktuellen Software und den aktuellen Normdaten erneut verarbeitet. Unterschiede zwischen den beiden Messungen werden nicht statistisch geprüft.',
    'bc.channel': 'Kanal', 'bc.clickBoth': 'Karte anklicken, um in beiden Messungen einen Kanal zu wählen', 'bc.mapAria': '{b}-Karte {d}', 'bc.selected': 'Ausgewählte Messgrößen',
    'bc.selSub': 'Wert und z, jeweils gegen die eigene Norm', 'bc.comparison': 'Vergleich',
    'b.s.checklist': 'Checkliste über die Kanal-ERPs', 'b.noRes': 'keine Ergebnisse',
    'b.nnT': 'Keine Altersnorm', 'b.nnText': 'Das Alter von {a} Jahren liegt außerhalb des Normbereichs von {lo} bis {hi} Jahren. Die Werte werden ohne z, Perzentil oder Markierung gezeigt; nichts wird mit einer Norm verglichen.',
    'b.missT': '{cond}: keine Ergebnisse', 'b.missText': '{a} von {r} s ausgewertet, unter dem Minimum von {m} s. Die anderen Bedingungen sind vollständig.', 'b.openRec': 'Aufnahme öffnen',
    'b.missEmpty': 'Keine Ergebnisse für {cond}', 'b.missSub': 'Ausgewertet {a} von {r} s · Minimum {m} s', 'b.valByCh': 'Werte nach Kanal und Band',
    'b.valMaps': 'Bandkarten · {m} · {cond} · Werte', 'b.hzMapsV': '1-Hz-Karten · absolute Leistung, µV²', 'b.seqScale': 'Farbe: niedriger bis hoher Wert innerhalb jeder Karte, keine z-Skala',
    'b.low': 'niedrig', 'b.high': 'hoch', 'b.nnNoCmp': 'Kein Wert wird mit einer Norm verglichen', 'b.nnNoSent': 'Kein Satz: Kein Wert wird mit einer Norm verglichen.',
    'b.nnNoMove': 'Ohne Altersnorm können Peaks nicht verschoben werden', 'b.mkNoNorm': 'Keine Altersnorm: Die Alpha-Peak-Frequenz wird als Wert gezeigt; nichts zu bestätigen.',
    'b.cohSel': 'Paare von {ch} · {b} · {cond}', 'b.cohScale': 'Farbe: Kohärenzwert, 0 bis 1', 'b.lineW': 'Linienbreite: Größe des Index', 'b.idxByPair': 'Index nach Paar und Band',
    'b.readSpecV': '{ch} · {f} Hz · Patient {p} µV²/Hz', 'b.readErpV': '{t} ms · Patient {p} µV',
    'bc.one': 'Nur eine Messung dieser Person', 'bc.oneSub': 'Laden Sie eine frühere Aufnahme hoch, um zu vergleichen. V4 verarbeitet sie neu; Berichte und Zahlen früherer Software werden nicht übernommen.',
    'bc.upload': 'Frühere Aufnahme hinzufügen', 'bc.earlier': 'Früher', 'bc.later': 'Später', 'bc.pair': 'Zwei Messungen', 'bc.allN': 'Alle {n}', 'bc.showing': 'Gezeigt',
    'bc.uplLater': 'später hochgeladen', 'bc.uplLaterB': 'Später hochgeladen', 'bc.procNow': 'Wird neu verarbeitet', 'bc.queued': 'In der Warteschlange',
    'bc.procText': 'Die Aufnahme vom {d} wird mit der aktuellen Software und den aktuellen Normdaten verarbeitet; sie kann verglichen werden, sobald die Verarbeitung fertig ist.',
    'bc.reprocN': 'Mit der aktuellen Software und den aktuellen Normdaten erneut verarbeitet: {list}. Unterschiede zwischen den Messungen werden nicht statistisch geprüft.',
    'bc.import': '{d}: aus der Aufnahme verarbeitet; der V3-Bericht und seine Zahlen werden nicht übernommen.', 'bc.laterVs': 'später gegen früher, jede gegen ihre eigene Altersnorm',
    'bc.clickAll': 'Karte anklicken, um in jeder Messung einen Kanal zu wählen', 'bc.step': 'Schritt {s} von 9.', 'bc.pickAria': 'Zu vergleichende Messungen',
    'b.sumAnalysis': 'Analyse und Bedingung', 'b.sumValues': 'Elektroden, Paare oder Werte, z', 'b.asPrinted': 'Wie im Bericht gedruckt', 'b.key': 'Lesehilfe',
    'b.keyRing': 'Ring und Punkt: markierter Wert', 'b.sumOpen': '{s} öffnen', 'b.normTick': 'Norm', 'b.roRole': 'Nur Ansicht: Ihre Rolle bestätigt keine Ergebnisse',
    'b.relScale': '% der Gesamtleistung, logarithmisch', 'b.hzMapsRel': '1-Hz-Karten · relative Leistung, z', 'b.readSpecRel': '{ch} · {f} Hz · Patient {p} % · Normmittelwert {m} % · z {z}',
    'b.cohHeads': 'Markierte Paare nach Band · {cond}', 'b.cohHeadsHelp': 'Kopf anklicken, um ein Band zu wählen', 'b.sentsBand': 'Sätze · {cond} · {b}', 'b.allBands': 'Alle Bänder',
    'b.oneBand': 'Gewähltes Band', 'b.noBandSent': 'Kein Satz für {b}: In diesem Band ist kein Paar markiert.', 'b.epbSub2': '10 Blöcke zu je 40 Durchgängen · Anzahl je Block, ohne Normdaten',
    'b.lowTrials': 'wenige Durchgänge', 'b.rsRec': 'Neuberechnung', 'b.rsRecText': 'Ihre bestätigte Änderung ergibt einen neuen Ergebnissatz ({id}): Schritt {s} von 9. Bis dahin werden die Werte von {prev} gezeigt.',
    'b.rsChip': 'Ergebnissatz {n} · nach Ihrer Änderung', 'b.log.rsStart': 'Neuberechnung der Ergebnisse nach einer bestätigten Änderung begonnen: Ergebnissatz {n} ({id})', 'b.log.rsDone': 'Ergebnissatz {id} berechnet',
  },
});
/* differences from V3 (review C1: each one a deliberate difference for the clinical lead to decide, 3.1 Roles) and mockup
   assumptions, each with its source as the evening review and the legacy audit give it; shared with the report module
   (template builder) through A.v4new */
A.v4new = {
  asym: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): asymmetry per pair and band against an age norm. The V3 asymmetry map has no norm (audit 14a A6, 94b row 9); V3 compares only the frontal alpha asymmetry index with a norm (14a A11.5). Needs new norms (intended-use notes 4)',
  base: 'Mockup assumption (M5): ERP baseline before the cue. V3 subtracts the mean of the first 50 ms after each picture, for display only, and compares the uncorrected curves with the norm (audit 14b B.3)',
  nov: 'Mockup assumption: a Novelty ERP norm. The canonical legacy norm file holds no Novelty (PH) ERPs (audit 32, norm file versions; intended-use notes 4)',
  peaks: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): ERP peak amplitudes and latencies with z against the norm (table 3.3 Core). The V3 report prints no ERP component numbers, only waveforms with a significance strip (audit 14b B.3; intended-use notes 4). Needs new norms',
  p3a: 'Beyond table 3.3, for the clinical lead: P3a at Cz (Novelty); table 3.3 lists P1, N1, N2, P3 and CNV (M40). Its confirmation gates issue like the other trial types (M52)',
  tbr: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): the theta/beta ratio at Cz only. V3 prints it at Fz, Cz and Pz with percentile rank and Stanine, plus three maps (audit 14a A7)',
  apf: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): the alpha peak frequency as a posterior mean only. V3 gives it per channel and as a 7-channel average that includes F3 and F4 (audit 14a A8)',
  rtsd: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): reaction time variability as the standard deviation (here about 86 ms). V3 prints the standard error, labelled Var(RT), about 9 ms here (audit 14b B.2), so a V3 reader sees a tenfold rise',
  zonly: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): values against the norm as z only, without percentile rank or Stanine (evening review C1 (d))',
  rel: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): relative power as a percentage of 1.5 to 30 Hz; V3 uses 3 to 30 Hz (evening review C1 (f))',
  cohg: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): global coherence on a 0 to 1 scale (mean over the pairs); V3 prints the exponential of a band sum, values like 7.8 (evening review C1 (g))',
  rtfig: 'Deliberate difference from V3, for the clinical lead to decide (3.1 Roles): the V3 reaction time over trials figure and reaction time histogram (audit 14b B.5) are neither in table 3.3 nor in this list; their status is to decide',
};
const annW = (...k) => `<span class="b-annw">${k.map(x => A.ann(A.v4new[x])).join('')}</span>`;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
const CH = A.channels, BANDS = A.bands, BN = BANDS.map(b => b.name);
const BL = { delta: 'Delta', theta: 'Theta', alpha: 'Alpha', smr: 'SMR', beta1: 'Beta1', beta2: 'Beta2' };
const cl = (k) => T('cond.' + k), cll = (k) => T('condl.' + k);
const INK = '#1c2a36', GRID = '#e4e5e1', MUTED = '#6b7279', NORMF = 'rgba(112,122,132,0.20)', NORML = '#7b858d', MARK = '#135e7d';
const POST = ['P3', 'Pz', 'P4', 'O1', 'O2'];
const fz = (z) => z == null ? '' : A.nf(Math.abs(z) < 0.05 ? 0 : z, 1);
/* z cell: colour follows z continuously; a marked value (correction for multiple comparisons, M33) gets a ring and a dot */
const zc = (z, txt, cls = '', mk = false) => z == null ? `<td class="num muted">${T('n/a')}</td>` : `<td class="num b-zc ${cls}${mk ? ' b-mk' : ''}" style="background:${A.zColor(z)};color:${A.zInk(z)}"${mk ? ` data-mk="1"` : ''}>${txt ?? fz(z)}</td>`;
const n1 = (v, d = 1) => v == null ? '' : A.nf(v, d);
/* the current case and measurement, whatever case the shell has open (APP.openCase): no age norm (M58), a condition
   below the minimum analysed time (M25); sentences of the case, also for the extra cases of data.json */
const NN = () => !!A.m2.no_norm;
const MISS = (c) => (A.m2.results_missing || {})[c] || null;
const XC = () => (A.data.extra_cases || {})[A.case.case_code];
const SL = (L) => { const l = L || A.lang, x = XC(), S = x ? x.sentences : A.data.sentences; return S[l] || S.en; };
const SM = (L) => SL(L).m2;
const ANN = () => document.body.classList.contains('annotate');
/* who confirmed (blocking 1 of the verification): the signed-in role stored with each confirmation */
const whoKey = () => (A.state.staffView ? 'support' : (A.role || 'c1'));
const who = (by) => T('who.' + (by || 'c1'));
/* review blocking 2: only roles with the review permission confirm or move anything; others see the controls hidden */
const canRev = () => !A.can || A.can('review');
const roNote = () => `<span class="xs muted">${esc(T('b.roRole'))}</span>`;
/* review A4: a pending clinician task is an outline chip with a clock; "Core, to confirm" stays a spec status (dashed, or an annotation) */
const todo = (t) => `<span class="chip b-todo"><span class="b-clk" aria-hidden="true">◷</span>${esc(t)}</span>`;
const cap1 = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
/* ---------------- result sets of the current measurement (review A9, B7) ----------------
   The data hold the stored sets (result_sets, the last is current). A confirmed change of the segments or the cleaning (both
   confirmed, a choice that differs from the proposal) starts a recomputation (9 steps of 0.6 s) and gives the next set; a
   choice made before uses its stored set again, the proposal uses the set of the data. Mockup assumption: a new set holds the
   values of set 1 (in V4 every feature is computed again and marks can move). APP.rs is shared with the report and the shell. */
const RSTEP = 600, RSN = 9;
const rsState = () => A.state.rs || (A.state.rs = { made: [], cur: null });
const rsSig = () => { const s = A.state, sg = s.segments || {}, c = s.cleaning || {};
  if (!sg.confirmed || !c.confirmed) return null;
  const nseg = typeof sg.changes === 'number' ? sg.changes : (sg.changes || []).length;
  const seg = nseg ? JSON.stringify(sg.analysed || {}) : '';
  const cl = (c.changed || []).map(x => (x.rec || 'EO') + x.ic + (x.removed ? 'r' : 'k')).sort().join('.');
  return seg + '#' + cl; };
function rsNow() {
  const st = rsState(), base = (A.m2 && A.m2.result_sets) || [], last = base[base.length - 1] || null, m = st.cur != null ? st.made.find(x => x.n === st.cur) : null;
  if (!m) return last ? { id: last.id, n: last.n, after: false, step: RSN, done: true, prev: null, sets: base.concat(st.made) } : null;
  const el = Date.now() - m.t0, done = m.done || el >= RSN * RSTEP, step = done ? RSN : Math.min(RSN, Math.floor(el / RSTEP) + 1);
  if (done && !m.done) { m.done = true; A.addLog('who.system', 'b.log.rsDone', { id: m.id }); }
  return { id: m.id, n: m.n, after: true, step, done, prev: last && last.id, left: done ? 0 : RSN * RSTEP - el, sets: base.concat(st.made) };
}
function rsSync() {
  if (!A.m2 || !A.state) return null;
  const st = rsState(), base = A.m2.result_sets || [], last = base[base.length - 1], sig = rsSig(); if (!last || sig == null) return rsNow();
  if (sig === '#') { st.cur = null; return rsNow(); }
  const hit = st.made.find(x => x.sig === sig); if (hit) { st.cur = hit.n; return rsNow(); }
  const n = last.n + st.made.length + 1, id = String(last.id).replace(/-\d+$/, '-' + n);
  st.made.push({ n, id, sig, at: A.now(), t0: Date.now(), by: whoKey(), basis: last.id, pipeline: (A.m2.processed_with || {}).pipeline, software: last.software, norms: last.norms }); st.cur = n;
  A.addLog('who.system', 'b.log.rsStart', { id, n });
  return rsNow();
}
A.rs = { sync: rsSync, now: () => rsSync(), finish: () => { const st = rsState(); st.made.forEach(m => { m.t0 = 0; }); return rsSync(); } };
window.addEventListener('hashchange', () => { try { rsSync(); } catch (e) { /* no case yet */ } });
/* read only after issue or rejection (shell APP.stageLocked), as on the Recording tab: a banner after issue;
   a rejection has its banner with the undo action in the workspace header */
const locked = () => (A.stageLocked ? A.stageLocked() : '');
const lastV = () => { const r = A.state.report; return r.issued.length ? r.issued[r.issued.length - 1].v : r.version; };
const lockBanner = (key) => locked() !== 'issued' ? '' : `<div class="banner ok b-lock"><b>${T('b.lockT')}</b><span style="flex:1">${esc(T(key, { v: lastV() }))}</span><button class="btn sm" data-b-go="issued">${T('b.openIssued')}</button></div>`;
const lockToast = () => A.toast(T('b.toast.locked', { why: T('b.why.' + locked()) }));
const lockNote = () => `<span class="xs muted">${T('b.lockT')} · ${T('b.why.' + locked())}</span>`;
const wireLock = (el) => $$('[data-b-go]', el).forEach(b => { b.onclick = () => A.go(b.dataset.bGo); });
/* marked-value legend, shared by every section */
const mkLeg = () => `<span class="b-leg b-mkleg"><span><i class="b-dot"></i>${T('b.mkLeg')}</span>${A.ann('3.2 Multiple comparison correction, Working; M33')}</span>`;
/* dots for marked channels on an APP.topo map (same geometry as APP.topo) */
function topoDots(cv, size, titled, flags) {
  const g = cv.getContext('2d'), pad = titled ? 16 : 4, cx = size / 2, cy = pad + size / 2 - 2, R = size / 2 - 10;
  CH.forEach((c, i) => { if (!flags || !flags[i]) return; const x = cx + A.pos[c][0] * R / 1.08, y = cy - A.pos[c][1] * R / 1.08;
    g.fillStyle = '#111'; g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, size > 100 ? 4 : 3, 0, 2 * Math.PI); g.fill(); g.stroke(); });
}

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
  let lo = 1e9, hi = -1e9; idx.forEach(i => { lo = Math.min(lo, o.lp[i], o.mu ? o.mu[i] - 2 * o.sd[i] : 1e9); hi = Math.max(hi, o.lp[i], o.mu ? o.mu[i] + 2 * o.sd[i] : -1e9); });
  lo = Math.floor(lo * 2 - 0.2) / 2; hi = Math.ceil(hi * 2 + 0.2) / 2;
  const x = (f) => ml + (f - o.f0) / (o.f1 - o.f0) * pw, y = (v) => mt + (hi - v) / (hi - lo) * ph;
  if (o.bands !== false) BANDS.forEach((b, k) => {
    const a = Math.max(o.f0, b.lo), e = Math.min(o.f1, b.hi); if (e <= a) return;
    g.fillStyle = k % 2 ? 'rgba(20,40,60,0.045)' : 'rgba(20,40,60,0.0)'; g.fillRect(x(a), mt, x(e) - x(a), ph);
    font(g, 9.5, 500); g.fillStyle = MUTED; g.textAlign = 'center'; if (x(e) - x(a) > 24) g.fillText(BL[b.name], (x(a) + x(e)) / 2, mt - 7); g.textAlign = 'left';
  });
  /* marker window: outside it no marker can sit (module E) */
  if (o.win) { const [a, b] = o.win; g.fillStyle = 'rgba(120,128,136,0.17)'; if (b <= a) g.fillRect(ml, mt, pw, ph); else { if (a > o.f0) g.fillRect(ml, mt, x(a) - ml, ph); if (b < o.f1) g.fillRect(x(b), mt, ml + pw - x(b), ph); } }
  if (o.sel) { g.fillStyle = 'rgba(19,94,125,0.13)'; g.fillRect(x(o.sel[0]), mt, x(o.sel[1]) - x(o.sel[0]), ph); }
  /* log grid: decades labelled, 2 and 5 as minor lines */
  font(g, 10, 400, true);
  for (let d = Math.floor(lo); d <= Math.ceil(hi); d++) for (const m of [1, 2, 5]) {
    const v = d + Math.log10(m); if (v < lo || v > hi) continue;
    g.strokeStyle = m === 1 ? '#d6d7d2' : GRID; g.lineWidth = 1; g.beginPath(); g.moveTo(ml, Math.round(y(v)) + 0.5); g.lineTo(ml + pw, Math.round(y(v)) + 0.5); g.stroke();
    if (m === 1 || hi - lo < 1.6) { g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(A.nx(+((o.pct ? 100 : 1) * 10 ** v).toPrecision(2)), ml - 5, y(v) + 3); g.textAlign = 'left'; }
  }
  const step = o.f1 - o.f0 > 15 ? 5 : 2;
  for (let f = Math.ceil(o.f0 / step) * step; f <= o.f1; f += step) { g.fillStyle = MUTED; g.textAlign = 'center'; g.fillText(String(f), x(f), mt + ph + 14); g.strokeStyle = GRID; g.beginPath(); g.moveTo(Math.round(x(f)) + 0.5, mt + ph); g.lineTo(Math.round(x(f)) + 0.5, mt + ph + 4); g.stroke(); }
  g.textAlign = 'left'; font(g, 10); g.fillStyle = MUTED; g.fillText('Hz', ml + pw - 12, mt + ph + 26); g.save(); g.translate(11, mt + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText(T(o.pct ? 'b.relScale' : 'b.logScale'), 0, 0); g.restore();
  /* norm band, mean, patient */
  if (o.mu) { g.beginPath(); idx.forEach((i, k) => { const p = [x(o.f[i]), y(o.mu[i] + 2 * o.sd[i])]; k ? g.lineTo(...p) : g.moveTo(...p); });
  idx.slice().reverse().forEach(i => g.lineTo(x(o.f[i]), y(o.mu[i] - 2 * o.sd[i]))); g.closePath(); g.fillStyle = NORMF; g.fill();
  g.setLineDash([4, 3]); g.strokeStyle = NORML; g.lineWidth = 1.2; g.beginPath(); idx.forEach((i, k) => k ? g.lineTo(x(o.f[i]), y(o.mu[i])) : g.moveTo(x(o.f[i]), y(o.mu[i]))); g.stroke(); g.setLineDash([]); }
  g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); idx.forEach((i, k) => k ? g.lineTo(x(o.f[i]), y(o.lp[i])) : g.moveTo(x(o.f[i]), y(o.lp[i]))); g.stroke();
  if (o.mk) idx.forEach(i => { if (o.mk[i]) { g.fillStyle = '#111'; g.beginPath(); g.arc(x(o.f[i]), y(o.lp[i]), 3.4, 0, 2 * Math.PI); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke(); } });
  /* marks: 'sys' suggestion (dashed), 'user' the marker, 'fm' a marker per electrode (on: selected), 'cur' the cursor */
  (o.marks || []).forEach((m, j) => {
    const X = x(m.hz), sys = m.kind === 'sys', cur = m.kind === 'cur', fm = m.kind === 'fm';
    g.strokeStyle = sys ? '#6a7580' : cur ? 'rgba(19,94,125,0.6)' : fm && !m.on ? '#3a4650' : MARK; g.lineWidth = sys || cur ? 1.2 : fm && !m.on ? 1.5 : 2; g.setLineDash(sys ? [5, 4] : cur ? [2, 3] : []);
    g.beginPath(); g.moveTo(X, mt); g.lineTo(X, mt + ph); g.stroke(); g.setLineDash([]);
    if (cur) return;
    font(g, 10, 600, true); g.fillStyle = g.strokeStyle; const t = (m.label || '') + A.nf(m.hz, 1) + ' Hz'; const tw = g.measureText(t).width;
    const tx = Math.min(ml + pw - tw - 2, Math.max(ml + 2, X + (sys ? -tw - 5 : 5))); g.fillText(t, tx, mt + (sys ? 12 : fm ? 12 + (j % 2) * 13 : 26));
    if (m.kind !== 'sys') { g.beginPath(); g.moveTo(X - 6, mt + ph); g.lineTo(X + 6, mt + ph); g.lineTo(X, mt + ph - 9); g.closePath(); g.fill(); }
  });
  if (o.hover != null) { const i = o.hover; g.strokeStyle = 'rgba(28,42,54,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(x(o.f[i])) + 0.5, mt); g.lineTo(Math.round(x(o.f[i])) + 0.5, mt + ph); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x(o.f[i]), y(o.lp[i]), 3, 0, 2 * Math.PI); g.fill(); }
  g.strokeStyle = '#b9bbb6'; g.lineWidth = 1; g.strokeRect(ml + 0.5, mt + 0.5, pw, ph);
  return { x, fAt: (px) => o.f0 + (px - ml) / pw * (o.f1 - o.f0), inside: (px) => px >= ml && px <= ml + pw, near: (px) => { const f = o.f0 + (px - ml) / pw * (o.f1 - o.f0); let b = idx[0]; idx.forEach(i => { if (Math.abs(o.f[i] - f) < Math.abs(o.f[b] - f)) b = i; }); return b; } };
}
const specLegend = (zl, nn) => `<span class="b-leg"><span><i style="background:var(--ink);height:2px"></i>${T('b.patient')}</span>${nn ? '' : `<span><i style="background:${NORMF};outline:1px dashed ${NORML}"></i>${T('b.normBand')}</span><span><i class="b-dot"></i>${zl || T('b.marked')}</span>`}</span>`;
/* values without a norm (M58): maps on their own sequential scale (yellow to green, never the blue-grey-red z scale) */
const SEQ = [[255, 255, 229], [217, 240, 163], [173, 221, 142], [120, 198, 121], [65, 171, 93], [35, 132, 67], [0, 90, 50]];
const seqRGB = (t) => { t = Math.max(0, Math.min(1, +t || 0)) * (SEQ.length - 1); const i = Math.min(SEQ.length - 2, Math.floor(t)), f = t - i; return SEQ[i].map((v, k) => Math.round(v + (SEQ[i + 1][k] - v) * f)); };
const seqBar = (label, lo, hi) => `<div class="zscale" style="display:grid;gap:2px;max-width:260px"><div style="height:10px;border-radius:2px;background:linear-gradient(90deg,${[0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1].map(t => `rgb(${seqRGB(t)})`).join(',')})"></div>
  <div class="mono xs" style="display:flex;justify-content:space-between;color:#55554f"><span>${esc(lo ?? T('b.low'))}</span><span>${esc(hi ?? T('b.high'))}</span></div><div class="xs" style="color:#55554f">${esc(label)}</div></div>`;
const vfmt = (v) => A.nf(v, Math.abs(v) < 1 ? 2 : Math.abs(v) < 10 ? 1 : 0);
/* head map of values (same geometry and hit test as APP.topo); opts {size, title, names, highlight, marks, unit}: unit prints the range under the map */
function topoSeq(canvas, values, opts = {}) {
  const S = opts.size || 140, dpr = window.devicePixelRatio || 1, pad = opts.title ? 16 : 4, foot = opts.unit != null ? 12 : 0, H = S + pad + foot;
  canvas.width = S * dpr; canvas.height = H * dpr; canvas.style.width = S + 'px'; canvas.style.height = H + 'px';
  const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, H);
  const cx = S / 2, cy = pad + S / 2 - 2, R = S / 2 - 10, P = CH.map(c => A.pos[c]);
  let lo = Math.min(...values), hi = Math.max(...values); if (!(hi - lo > 1e-9)) hi = lo + 1;
  const img = g.createImageData(Math.ceil(2 * R * dpr), Math.ceil(2 * R * dpr)), W = img.width;
  for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
    const x = (px / dpr - R) / R * 1.08, y = -(py / dpr - R) / R * 1.08; if (x * x + y * y > 1.08 * 1.08) continue;
    let num = 0, den = 0; for (let k = 0; k < P.length; k++) { const d = (P[k][0] - x) ** 2 + (P[k][1] - y) ** 2 + 0.004, w = 1 / (d * d); num += values[k] * w; den += w; }
    const c = seqRGB((num / den - lo) / (hi - lo)), o = (py * W + px) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, Math.round((cx - R) * dpr), Math.round((cy - R) * dpr)); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.strokeStyle = '#2b2b2b'; g.lineWidth = 1.1; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
  g.beginPath(); g.moveTo(cx - 7, cy - R + 1); g.lineTo(cx, cy - R - 8); g.lineTo(cx + 7, cy - R + 1); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * (R + 3), cy, 3, 9, 0, 0, 2 * Math.PI); g.stroke(); }
  const pt = (c) => [cx + A.pos[c][0] * R / 1.08, cy - A.pos[c][1] * R / 1.08];
  CH.forEach(c => { const [x, y] = pt(c); g.fillStyle = '#2b2b2b'; g.beginPath(); g.arc(x, y, opts.highlight === c ? 3.4 : 1.6, 0, 2 * Math.PI); g.fill(); if (opts.names) { g.font = '9px IBM Plex Mono, monospace'; g.fillText(c, x - 7, y - 4); } });
  (opts.marks || []).forEach(c => { const [x, y] = pt(c); g.strokeStyle = '#111'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 6, 0, 2 * Math.PI); g.stroke(); });
  g.fillStyle = '#1f1f1e'; g.textAlign = 'center';
  if (opts.title) { g.font = '600 11px IBM Plex Sans, sans-serif'; g.fillText(opts.title, cx, 11); }
  if (foot) { g.font = '9.5px IBM Plex Mono, monospace'; g.fillStyle = '#55554f'; g.fillText(`${vfmt(lo)} ${T('to')} ${vfmt(hi)}${opts.unit}`, cx, H - 2); }
  g.textAlign = 'left';
  return (x, y) => { let best = null, bd = 1e9; CH.forEach(c => { const [px, py] = pt(c), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = c; } }); return bd < 140 ? best : null; };
}


/* ================================ Results tab ================================ */
const R = { sec: 'summary', cond: 'EC', meas: 'abs', ch: 'Fz', bin: null, hov: null, cohBand: 'theta', cohAll: false, cohOnly: true, cohSort: ['z', -1], cohCh: null, cohHov: null,
  erpT: 'nogo', erpCh: 'Cz', erpHov: null, erpAct: null, asymBand: 'alpha', off: null, mk: null };
const SECS = ['summary', 'spectra', 'ratios', 'asym', 'coh', 'erp', 'checklist', 'vcpt', 'markers'].map(k => [k, 'b.s.' + k]);
/* functions outside the core, grouped by their status in table 3.3 (shared document, 29 October): [label key, note key] */
const OFF = [
  ['later', [['b.o.quest'], ['b.o.ai', 'b.n.licFirst'], ['b.o.workload'], ['b.o.arousal', 'b.n.licence'], ['b.o.micro', 'b.n.licence'], ['b.o.spike'], ['b.o.clf']]],
  ['open', [['b.o.lagged'], ['b.o.icamaps'], ['b.o.icaerp'], ['b.o.sloreta'], ['b.o.rtfig', 'b.n.decide']]],
  ['research', [['b.o.subtype'], ['b.o.recom']]],
  ['dropped', [['b.o.grouped'], ['b.o.bio'], ['b.o.change', null, false]]],
];
const USES = { spectra: ['cond', 'meas'], asym: ['cond'], coh: ['cond'] };
const ERPT = [['go', 'Go'], ['nogo', 'NoGo'], ['ignore', 'Ignore'], ['novelty', 'Novelty']];
const LAYOUT = [[null, 'Fp1', null, 'Fp2', null], ['F7', 'F3', 'Fz', 'F4', 'F8'], ['T3', 'C3', 'Cz', 'C4', 'T4'], ['T5', 'P3', 'Pz', 'P4', 'T6'], [null, 'O1', null, 'O2', null]];

/* marking blocks (one analysis family in one condition) and the result section that shows each family */
const FAM = [['spectrum', 'spectra'], ['abs', 'spectra'], ['rel', 'spectra'], ['maps1hz', 'spectra'], ['indices', 'ratios'], ['asym', 'asym'], ['coh', 'coh'], ['cohglobal', 'coh'], ['erp_amp', 'erp'], ['erp_lat', 'erp'], ['vcpt', 'vcpt']];
const famOf = (id) => id.replace(/_(EO|EC)$/, ''), condOf = (id) => (id.match(/_(EO|EC)$/) || [])[1] || null;
const secOf = (id) => (FAM.find(f => f[0] === famOf(id)) || [])[1];
/* counts of values compared with a norm, and of marked values, per section (from the marking blocks) */
function counts(m = A.m2) {
  const c = {}; ((m.marking || {}).blocks || []).forEach(b => { const k = secOf(b.id); if (!k) return; c[k] = c[k] || [0, 0]; c[k][0] += b.n; c[k][1] += b.marked; });
  return c;
}
/* review D1, Annotations only: per block uncorrected n, expected by chance m, marked k */
function d1(sec, cond) {
  if (!A.m2.marking) return '';
  const bl = A.m2.marking.blocks.filter(b => secOf(b.id) === sec && (!cond || !condOf(b.id) || condOf(b.id) === cond));
  if (!bl.length) return '';
  return `<div class="b-d1"><div class="b-d1h">${T('b.d1T')} · ${esc(A.m2.marking.method)}</div>${bl.map(b => `<div><b>${T('b.f.' + famOf(b.id))}${condOf(b.id) ? ' · ' + cl(condOf(b.id)) : ''}</b>: ${T('b.d1', { n: A.int(b.beyond2_uncorrected), m: A.nf(b.expected_by_chance, 1), k: A.int(b.marked) })}</div>`).join('')}</div>`;
}
/* peak confirmation state (shared document 3.4): APP.state.peaks[trial] = {confirmed, moved: [{component, site, from_ms, to_ms, amplitude_uv}]} */
const PK = () => { const s = A.state; s.peaks = s.peaks || {}; ['go', 'nogo', 'ignore', 'novelty'].forEach(t => { s.peaks[t] = s.peaks[t] || { confirmed: false, moved: [] }; }); return s.peaks; };
PK();
/* latency windows of the automatic peak search (synth.py ERP_PEAKS, M5) */
const PKWIN = { 'P1:go': [70, 170], 'N1:go': [140, 250], 'N2:nogo': [210, 330], 'P3:go': [280, 560], 'P3:nogo': [300, 600], 'P3a:novelty': [250, 420] };
const pkScored = (t) => A.m2.erp.peaks.filter(p => p.condition === t && p.latency_ms != null);
const pkMove = (t, p) => PK()[t].moved.find(m => m.component === p.component && m.site === p.site);
/* the peak as it stands now (APP.peaksNow, shared with the report): recomputed z and marking once a move is confirmed */
const pkNow = (p) => (A.peaksNow ? A.peaksNow() : A.m2.erp.peaks).find(q => q.condition === p.condition && q.component === p.component && q.site === p.site) || p;
const pkNeeds = () => ERPT.some(([t]) => pkScored(t).length && !PK()[t].confirmed);
/* the alpha peak marker needs confirmation unless there is no norm or no eyes closed result; markers per electrode: module E */
const alphaNeeds = () => !NN() && !MISS('EC') && !(A.state.markers || {}).confirmed;
const mkOK = () => !alphaNeeds() && !(A.ex && A.ex.fmOpen().length);
let CNT = null, root0 = null, ro = null, mo = null, redraw = null, cohSync = null;

function rail() {
  const cnt = (k) => CNT[k] && CNT[k][1] ? `<span class="b-cnt" title="${T('b.beyond2')}">${CNT[k][1]}</span>` : '';
  const conf = (ok) => ok ? '<span class="chip ok">✓</span>' : todo(T('b.toConfirm'));
  const badge = (k) => k === 'markers' ? conf(mkOK()) : k === 'checklist' ? (A.ex && A.ex.clApplicable() ? conf(!A.ex.clOpen()) : '') : k === 'erp' ? `<span class="row" style="gap:4px">${cnt(k)}${conf(!pkNeeds())}</span>` : cnt(k);
  return `<div class="b-rgrp">${T('b.results')}</div>${SECS.map(([k, l]) => `<button class="b-ri ${R.sec === k && !R.off ? 'on' : ''}" data-sec="${k}"><span>${T(l)}</span>${badge(k)}</button>`).join('')}
    <div class="b-rgrp">${T('b.notRelease')} ${A.ann('Table 3.3; 3.1 Modules and functions outside the core (Decided): later modules are separate certified devices; ADR 0005 (proposed): studies run in a separate research workspace with no path into reports')}</div>${OFF.map(([k, it]) => `<button class="b-ri off ${R.off === k ? 'on' : ''}" data-off="${k}"><span>${esc(T('b.st.' + k))}<small>${esc(T('b.nFunc', { n: it.length }))}</small></span></button>`).join('')}`;
}
function toolbar() {
  const u = R.off ? [] : (USES[R.sec] || []), title = R.off ? T('b.notRelease') + ' · ' + T('b.st.' + R.off) : T(SECS.find(s => s[0] === R.sec)[1]);
  return `<h2 class="b-tt">${esc(title)}</h2>
    ${u.includes('cond') ? `<span class="sep"></span><div class="seg" id="bCond" aria-label="${T('b.condAria')}">${['EO', 'EC'].map(k => `<button data-k="${k}" class="${R.cond === k ? 'on' : ''}">${cl(k)}${MISS(k) ? ` <small class="b-nores">· ${T('b.noRes')}</small>` : ''}</button>`).join('')}</div>` : ''}
    ${u.includes('meas') ? `<div class="seg" id="bMeas" aria-label="${T('b.measAria')}">${[['abs', 'b.abs'], ['rel', 'b.rel']].map(([k, l]) => `<button data-k="${k}" class="${R.meas === k ? 'on' : ''}">${T(l)}</button>`).join('')}</div>` : ''}
    <span class="b-sp"></span>${(() => { const r = rsSync(); return r && r.after && r.done ? `<span class="chip info" title="${esc(r.id)}">${esc(T('b.rsChip', { n: r.n }))}</span>${A.ann('Mockup assumption (A9): result set ' + r.n + ' has the values of set 1; in V4 every feature is computed again and marks can move')}` : ''; })()}<span class="xs muted b-meta">${esc(T('b.meta', { sw: A.m2.processed_with.software, norms: A.dv(A.m2.processed_with.norms), a: A.nx(A.m2.age_years) }))}</span>`;
}

function show(root) {
  CNT = counts();
  $('#bRail', root).innerHTML = rail();
  $('#bTb', root).innerHTML = toolbar();
  const body = $('#bBody', root); redraw = null; cohSync = null;
  if (R.off) body.innerHTML = offPanel();
  else ({ summary, spectra, ratios, asym, coh, erp, checklist, vcpt, markers })[R.sec](body);
  $('#bD1', root).innerHTML = R.off || R.sec === 'summary' ? '' : d1(R.sec, (USES[R.sec] || []).includes('cond') ? R.cond : null);
  $$('[data-sec]', root).forEach(b => b.onclick = () => { R.sec = b.dataset.sec; R.off = null; show(root); });
  $$('[data-off]', root).forEach(b => b.onclick = () => { R.off = b.dataset.off; show(root); });
  $$('#bCond button', root).forEach(b => b.onclick = () => { R.cond = b.dataset.k; R.bin = null; show(root); });
  $$('#bMeas button', root).forEach(b => b.onclick = () => { R.meas = b.dataset.k; show(root); });
  $$('[data-jump]', root).forEach(b => b.onclick = () => { R.sec = b.dataset.jump; R.off = null; show(root); window.scrollTo({ top: 0 }); });
}
const sents = (title, list, empty) => `<div class="card"><div class="hd"><h3>${title}</h3><span class="xs muted">${T('b.fixed')} ${A.ann('Text library, kinds (a) and (b1)')}</span></div><div class="bd b-sys">${list && list.length ? A.sys(list) : `<p class="muted small" style="margin:0">${empty}</p>`}</div></div>`;

function checklist(body) { if (A.ex && A.ex.cl) { A.ex.cl(body); redraw = A.ex.clRedraw; } else body.innerHTML = ''; }
function offPanel() {
  const [k, items] = OFF.find(x => x[0] === R.off), hasN = items.some(x => x[1]);
  return `<div class="card"><div class="bd b-off"><div class="b-offic">⊘</div><div style="min-width:0;flex:1"><h3>${esc(T('b.st.' + k))}</h3>
    <p class="small" style="margin:6px 0 10px">${esc(T('b.stx.' + k))} ${A.ann('3.1 Functions outside the core, Decided: clinics keep using the V3 functions while V3 runs')}</p>
    <div class="scroll-x"><table class="tbl"><tr><th>${T('b.function')}</th><th>${T('b.v3')}</th>${hasN ? `<th>${T('b.note')}</th>` : ''}</tr>${items.map(([l, n, v3]) => `<tr><td>${esc(T(l))}</td><td class="small">${esc(T(v3 === false ? 'b.v3.no' : 'b.v3.yes'))}</td>${hasN ? `<td class="small muted">${n ? esc(T(n)) : ''}</td>` : ''}</tr>`).join('')}</table></div>
    <div class="row" style="margin-top:10px"><span class="chip">${esc(T('b.st.' + k))}</span>${A.ann('Table 3.3, shared document of 29 October')}${k === 'open' ? annW('rtfig') : ''}</div></div></div></div>`;
}

/* ---------------- Summary ---------------- */
/* review C3: the ranked entries of SUM-2 as a table (sentences.<lang>.<mk>.summary_groups, every item marked) with a reading
   key; SUM-2 itself below it, collapsed, as printed in the report. Each row opens the section that shows its values. */
const FAMSEC = { coh: 'coh', asym: 'asym', erp: 'erp', band: 'spectra', spectrum: 'spectra', maps1hz: 'spectra', indices: 'ratios', vcpt: 'vcpt', cohglobal: 'coh' };
const sumGroups = (L) => SL(L).m2.summary_groups || [];
/* the section and its presets, read from the English stem of the entry (band, condition, trial type, relative) */
function sumTarget(i) {
  const g = sumGroups('en')[i] || {}, st = String(g.stem || '').toLowerCase(), o = { sec: FAMSEC[g.family] || 'summary' };
  const b = BN.find(x => new RegExp('\\b' + x + '\\b').test(st)); if (b) o.band = b;
  if (/eyes open/.test(st)) o.cond = 'EO'; else if (/eyes closed/.test(st)) o.cond = 'EC';
  if (/relative/.test(st)) o.meas = 'rel'; else if (/absolute/.test(st)) o.meas = 'abs';
  const t = ERPT.find(([, l]) => new RegExp('\\b' + l.toLowerCase() + '\\b').test(st)); if (t) o.trial = t[0];
  const it = (g.items || [])[0]; if (it && CH.includes(it.where)) o.ch = it.where;
  return o;
}
function sumJump(i) {
  const o = sumTarget(i); R.sec = o.sec; R.off = null; if (o.cond) R.cond = o.cond; if (o.meas) R.meas = o.meas;
  if (o.sec === 'coh' && o.band) { R.cohBand = o.band; R.cohUser = true; }
  if (o.sec === 'asym' && o.band) { R.asymBand = o.band; R.asymUser = true; }
  if (o.sec === 'erp') { if (o.trial) R.erpT = o.trial; if (o.ch) R.erpCh = o.ch; R.erpAct = null; }
  if (o.sec === 'spectra' && o.ch) R.ch = o.ch;
}
const zchip = (z, where) => `<span class="b-zchip">${where ? `<span class="w mono">${esc(where)}</span>` : ''}<span class="zv" style="background:${A.zColor(z)};color:${A.zInk(z)}">${fz(z)}</span></span>`;
const sumKey = () => `<div class="b-key"><b class="xs">${T('b.key')}</b><div class="paper b-keyz">${A.zScale()}</div><span class="b-leg"><span>${zchip(3.1)} ${T('b.keyRing')}</span></span>${A.sys(SM().limits.filter(s => s.id === 'L-Z-1'))}</div>`;
function sumTable() {
  const G = sumGroups(); if (!G.length) return '';
  return `<div class="scroll-x"><table class="tbl b-sumt"><tr><th>${T('b.sumAnalysis')}</th><th>${T('b.sumValues')}</th><th></th></tr>${G.map((g, i) => { const sec = T('b.s.' + sumTarget(i).sec);
    return `<tr class="link" data-sum="${i}" tabindex="0" title="${esc(T('b.sumOpen', { s: sec }))}"><td>${esc(cap1(g.stem))}</td><td><span class="b-zchips">${g.items.map(x => zchip(x.z, x.where)).join('')}</span></td><td class="num"><span class="btn sm ghost">${T('b.openArrow')}</span></td></tr>`; }).join('')}</table></div>`;
}
function summary(body) {
  const nn = NN(), lim = SM().limits.filter(s => ['L-AID-1', 'L-Z-1', 'L-MC-1', 'L-NONORM-1'].includes(s.id)), blocks = (A.m2.marking || {}).blocks || [];
  const rows = FAM.map(([f, sec]) => { const bl = blocks.filter(b => famOf(b.id) === f), sum = (k) => bl.reduce((a, b) => a + b[k], 0);
    return { f, sec, n: sum('n'), u: sum('beyond2_uncorrected'), e: sum('expected_by_chance'), k: sum('marked') }; }).filter(r => r.n);
  const present = ['EO', 'EC'].filter(k => !MISS(k)), sub = present.length === 2 ? T('b.both') : present.map(cll).join(', ');
  const sl = A.summaryNow ? A.summaryNow() : SM().summary, tb = nn ? '' : sumTable();
  const sum = tb ? `${tb}<div class="bd b-sys" style="padding-top:8px">${A.sys(sl.filter(s => s.id !== 'SUM-2'))}<details class="b-asp"><summary>${T('b.asPrinted')}</summary>${A.sys(sl.filter(s => s.id === 'SUM-2'))}</details>${sumKey()}</div>`
    : `<div class="bd b-sys">${A.sys(sl)}</div>`;
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T(nn ? 'b.s.summary' : 'b.largest')}</h3>${A.ann('3.2 No interpretation: summary by fixed rule; review C3: the ranked entries of SUM-2 as a table, SUM-2 collapsed below')}</div>${sum}</div>
    <div class="card"><div class="hd"><h3>${T('b.compared')}</h3><span class="xs muted">${esc(nn ? '' : sub)}</span>${nn ? '' : annW('zonly')}</div>${nn ? `<div class="empty">${esc(T('b.nnNoCmp'))}</div>` : `<div class="scroll-x"><table class="tbl">
        <tr><th>${T('b.family')}</th><th class="num">${T('b.values')}</th><th class="num b-ac">${T('b.d1u')}</th><th class="num b-ac">${T('b.d1e')}</th><th class="num">${T('b.markedH')}</th><th></th></tr>
        ${rows.map(r => `<tr class="link" data-jump="${r.sec}" tabindex="0"><td>${T('b.f.' + r.f)}</td><td class="num">${A.int(r.n)}</td><td class="num b-ac">${A.int(r.u)}</td><td class="num b-ac">${A.nf(r.e, 1)}</td><td class="num"><b>${r.k}</b></td><td class="num"><span class="btn sm ghost">${T('b.openArrow')}</span></td></tr>`).join('')}
      </table></div><div class="bd" style="padding-top:8px">${mkLeg()}</div>`}</div>
    <div class="grid g2">
      <div class="card"><div class="hd"><h3>${T('b.quality')}</h3><a class="small" href="#cleaning">${T('b.cleaning')}</a></div><div class="bd b-sys">${A.sys(A.qualityNow ? A.qualityNow() : A.qualitySentences())}</div></div>
      ${sents(T('b.limits'), lim)}
    </div>
  </div>`;
  $$('[data-jump]', body).forEach(r => r.onkeydown = e => { if (e.key === 'Enter') r.click(); });
  $$('[data-sum]', body).forEach(r => { r.onclick = () => { sumJump(+r.dataset.sum); show(root0); window.scrollTo({ top: 0 }); }; r.onkeydown = e => { if (e.key === 'Enter') r.click(); }; });
}
/* a condition below the minimum analysed time gives no results (M25, M58): an empty state and its sentence */
function missing(body, cond, key) {
  const v = MISS(cond), rec = (A.m2.quality.recordings[cond] || {}).recorded_s;
  body.innerHTML = `<div class="grid" style="gap:14px"><div class="card"><div class="empty b-miss"><b>${esc(T('b.missEmpty', { cond: cll(cond) }))}</b>
    <div class="small" style="margin-top:6px">${esc(T('b.missSub', { a: v.analysed_s, r: rec, m: v.minimum_s }))}</div><div style="margin-top:10px"><button class="btn sm" data-b-go="segments">${T('b.openRec')}</button></div></div></div>
    ${sents(T('b.sentsCond', { cond: cll(cond) }), SM()[key + '_' + cond] || [])}</div>`;
  wireLock(body);
}

/* ---------------- Spectra and maps ---------------- */
function spectra(body) {
  if (MISS(R.cond)) return missing(body, R.cond, 'spectra');
  const nn = NN(), C = A.m2.spectra.conditions[R.cond], abs = R.meas === 'abs', key = abs ? 'abs_z' : 'rel_z', mkey = abs ? 'abs_marked' : 'rel_marked', vkey = abs ? 'abs_uv2' : 'rel_pct';
  /* review B1: relative spectra (share of total power 1.5 to 30 Hz per 0.5 Hz bin) and relative 1 Hz maps; a stand-in norm
     while the synthetic data do not carry their own (relative_derived) */
  const rel = !abs && !nn && !!C.rel_log_power, LP = rel ? C.rel_log_power : C.log_power, MU = rel ? C.norm_rel_log_mean : C.norm_log_mean, SDV = rel ? C.norm_rel_log_sd : C.norm_log_sd, ZZ = rel ? C.rel_z : C.z;
  const M1Z = rel && C.maps_1hz_rel_z ? C.maps_1hz_rel_z : C.maps_1hz_z, M1M = rel && C.maps_1hz_rel_marked ? C.maps_1hz_rel_marked : C.maps_1hz_marked;
  const relAnn = rel ? annW('rel') + (C.relative_derived ? A.ann('Mockup assumption (B1): the relative norm band and the relative 1 Hz z use a stand-in norm derived from the absolute norm, with the Benjamini-Hochberg stand-in marks, until the synthetic data carry their own; no marked bins are drawn on the relative spectrum') : '') : '';
  const m1hz = nn ? C.maps_1hz_uv2 : M1Z;
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T(nn ? 'b.valMaps' : 'b.bandMaps', { m: T(abs ? 'b.absPow' : 'b.relPow'), cond: cll(R.cond) })}</h3><span class="xs muted">${T('b.clickMap')}</span></div>
      <div class="bd"><div class="paper"><div class="b-maps" id="bMaps">${BN.map(b => `<canvas data-b="${b}" aria-label="${T('b.mapAria', { b: BL[b] })}"></canvas>`).join('')}</div><div class="b-zs">${nn ? seqBar(T('b.seqScale')) : A.zScale()}</div><div class="b-zs" style="padding-bottom:8px">${nn ? '' : mkLeg()}</div></div></div></div>
    <div class="b-two">
      <div class="card"><div class="hd"><h3 id="bSpT"></h3>${specLegend(null, nn)}${relAnn}</div><div class="bd"><div class="paper b-fig"><canvas id="bSpec" aria-label="${T('b.specAria')}"></canvas></div><div class="b-read mono xs" id="bSpR">${T('b.readHelp')}</div><div class="scroll-x" id="bChv" style="margin-top:8px"></div></div></div>
      <div class="card"><div class="hd"><h3>${T(nn ? 'b.valByCh' : 'b.zByCh')}</h3><span class="xs muted">${T(abs ? 'b.absPow' : 'b.relPow')}${nn ? (abs ? ', µV²' : ', %') : ''}</span></div><div class="scroll-x b-ztw" id="bZt"></div></div>
    </div>
    <div class="card"><div class="hd"><h3>${T(nn ? 'b.hzMapsV' : rel ? 'b.hzMapsRel' : 'b.hzMaps')}</h3><span class="xs muted" id="bBinL">${T('b.hzHelp')}</span></div><div class="bd"><div class="paper b-hz" id="bHz">${m1hz.map((_, i) => `<canvas data-i="${i}" tabindex="0" aria-label="${T('b.rangeHz', { a: i + 1, b: i + 2 })}"></canvas>`).join('')}</div>${nn ? `<div class="b-zs">${seqBar(T('b.seqScale'))}</div>` : ''}</div></div>
    ${sents(T('b.sentsCond', { cond: cll(R.cond) }), SM()['spectra_' + R.cond])}
  </div>`;
  const hits = {};
  const maps = () => $$('#bMaps canvas', body).forEach(cv => { const b = cv.dataset.b, bd = BANDS.find(x => x.name === b), title = `${BL[b]} ${T('b.rangeHz', { a: A.nx(bd.lo), b: A.nx(bd.hi) })}`;
    if (nn) { hits[b] = topoSeq(cv, C.bands[b][vkey], { size: 120, title, highlight: R.ch, marks: [R.ch], unit: abs ? ' µV²' : ' %' }); return; }
    hits[b] = A.topo(cv, C.bands[b][key], { size: 120, title, highlight: R.ch, marks: [R.ch] }); topoDots(cv, 120, true, C.bands[b][mkey]); });
  const table = () => {
    $('#bZt', body).innerHTML = `<table class="tbl b-zt"><tr><th>${T('b.ch')}</th>${BN.map(b => `<th class="num">${BL[b]}</th>`).join('')}</tr>${CH.map((c, i) => `<tr class="link ${c === R.ch ? 'sel' : ''}" data-ch="${c}" tabindex="0"><td class="mono">${c}</td>${BN.map(b => {
      if (nn) return `<td class="num">${n1(C.bands[b][vkey][i])}</td>`;
      const v = abs ? `${n1(C.bands[b].abs_uv2[i])} µV²` : `${n1(C.bands[b].rel_pct[i])} %`; return zc(C.bands[b][key][i], null, '', C.bands[b][mkey][i]).replace('<td ', `<td title="${T('b.atCh', { b: BL[b], c, v })}${C.bands[b][mkey][i] ? ' · ' + T('b.marked') : ''}" `); }).join('')}</tr>`).join('')}</table>`;
    $$('#bZt tr[data-ch]', body).forEach(r => { r.onclick = () => pick(r.dataset.ch); r.onkeydown = e => { if (e.key === 'Enter') pick(r.dataset.ch); }; });
  };
  let sp = null;
  const spec = () => {
    const i = CH.indexOf(R.ch), cv = $('#bSpec', body), W = Math.max(300, cv.parentElement.clientWidth - 2);
    $('#bSpT', body).textContent = T('b.specT', { ch: R.ch, cond: cll(R.cond) });
    $('#bChv', body).innerHTML = `<table class="tbl b-zt"><tr><th>${R.ch}</th>${BN.map(b => `<th class="num">${BL[b]}</th>`).join('')}</tr>
      <tr><td class="muted">µV²</td>${BN.map(b => `<td class="num">${n1(C.bands[b].abs_uv2[i])}</td>`).join('')}</tr>${nn ? '' : `<tr><td class="muted">z</td>${BN.map(b => zc(C.bands[b].abs_z[i], null, '', C.bands[b].abs_marked[i])).join('')}</tr>`}
      <tr><td class="muted">%</td>${BN.map(b => `<td class="num">${n1(C.bands[b].rel_pct[i])}</td>`).join('')}</tr>${nn ? '' : `<tr><td class="muted">z</td>${BN.map(b => zc(C.bands[b].rel_z[i], null, '', C.bands[b].rel_marked[i])).join('')}</tr>`}</table>`;
    sp = drawSpec(cv, W, { f: A.m2.spectra.freqs, lp: LP[i], mu: nn ? null : MU[i], sd: nn ? null : SDV[i], mk: nn || rel ? null : C.z_marked[i], pct: rel, f0: 1, f1: 30, H: 260, hover: R.hov, sel: R.bin != null ? [R.bin + 1, R.bin + 2] : null });
  };
  const hz = () => $$('#bHz canvas', body).forEach(cv => { const k = +cv.dataset.i;
    if (nn) topoSeq(cv, C.maps_1hz_uv2[k], { size: 70, title: `${k + 1}-${k + 2} Hz`, highlight: R.ch });
    else { A.topo(cv, M1Z[k], { size: 70, title: `${k + 1}-${k + 2} Hz`, highlight: R.ch }); topoDots(cv, 70, true, M1M && M1M[k]); }
    cv.classList.toggle('on', k === R.bin); });
  const pick = (c) => { if (!c) return; R.ch = c; maps(); table(); spec(); hz(); };
  const bin = (k) => { R.bin = R.bin === k ? null : k; $('#bBinL', body).textContent = R.bin == null ? T('b.hzHelp') : T('b.selHz', { a: R.bin + 1, b: R.bin + 2 }); $$('#bHz canvas', body).forEach(cv => cv.classList.toggle('on', +cv.dataset.i === R.bin)); spec(); };
  $$('#bMaps canvas', body).forEach(cv => cv.onclick = e => { const r = cv.getBoundingClientRect(); pick(hits[cv.dataset.b](e.clientX - r.left, e.clientY - r.top)); });
  $$('#bHz canvas', body).forEach(cv => { cv.onclick = () => bin(+cv.dataset.i); cv.onkeydown = e => { if (e.key === 'Enter') bin(+cv.dataset.i); }; });
  const sc = $('#bSpec', body);
  sc.onpointermove = e => { const r = sc.getBoundingClientRect(), px = e.clientX - r.left; if (!sp || !sp.inside(px)) return; const k = sp.near(px); if (k === R.hov) return; R.hov = k; spec();
    const i = CH.indexOf(R.ch), f = A.m2.spectra.freqs[k], p = A.nf((rel ? 100 : 1) * 10 ** LP[i][k], 2);
    $('#bSpR', body).textContent = nn ? T('b.readSpecV', { ch: R.ch, f: A.nf(f, 1), p }) : T(rel ? 'b.readSpecRel' : 'b.readSpec', { ch: R.ch, f: A.nf(f, 1), p, m: A.nf((rel ? 100 : 1) * 10 ** MU[i][k], 2), z: fz(ZZ[i][k]) }); };
  sc.onpointerleave = () => { R.hov = null; spec(); };
  sc.onclick = e => { const r = sc.getBoundingClientRect(), f = sp.fAt(e.clientX - r.left); if (f >= 1 && f < 30) bin(Math.floor(f) - 1); };
  maps(); table(); spec(); hz();
  redraw = spec;
}

/* ---------------- Ratios and indices ---------------- */
/* review C8: a scale, not a slider: the band from -2 to 2 shaded, a thin tick at z, the scale labels under it */
function gauge(z) {
  const p = (Math.max(-3, Math.min(3, z)) + 3) / 6 * 100;
  return `<span class="paper b-gauge" role="img" aria-label="z ${fz(z)}"><span class="b-gtr"><i class="b-g2"></i><i class="b-g0"></i><b class="b-gt" style="left:${p}%;background:${A.zColor(z)}"></b></span><span class="b-gs">${[-3, -2, 0, 2, 3].map(v => `<span style="left:${(v + 3) / 6 * 100}%">${v}</span>`).join('')}</span></span>`;
}
function ratios(body) {
  const S = A.m2.spectra.conditions, nn = NN();
  const rows = [
    [T('b.tbr'), 'Cz', (k) => S[k].tbr, (v) => n1(v.value, 2), (v) => n1(v.norm_mean, 2), 'tbr'],
    [T('b.faa'), 'ln F4 minus ln F3', (k) => S[k].faa, (v) => n1(v.value, 2), (v) => `${n1(v.norm_mean, 2)} ${T('b.sd', { v: n1(v.norm_sd, 2) })}`, null],
    [T('b.apf'), 'P3, Pz, P4, O1, O2', (k) => S[k].alpha_peak, (v) => n1(v.hz) + ' Hz', (v) => `${n1(v.norm_mean, 1)} Hz ${T('b.sd', { v: n1(v.norm_sd, 2) })}`, 'apf'],
  ];
  const tile = (get, val) => ['EO', 'EC'].map(k => { if (MISS(k)) return `<div class="b-rat"><span class="xs muted">${cl(k)}</span><b class="num muted">-</b><span class="xs muted">${T('b.noRes')}</span></div>`;
    const v = get(k); return `<div class="b-rat"><span class="xs muted">${cl(k)}</span><b class="num">${val(v)}</b>${nn ? '<span></span>' : `<span class="num xs ${v.marked ? 'b-mkt' : ''}">z ${fz(v.z)}${v.marked ? ' · ' + T('b.marked') : ''}</span>${gauge(v.z)}`}</div>`; }).join('');
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="grid g3">${rows.map(([l, site, get, val, , dk]) => `<div class="card"><div class="bd"><div class="xs muted">${l} · ${site}${dk === 'apf' ? A.ann('Table 3.3: alpha peak frequency is Core, an automatic value with z; only its marker tool (Frequency markers) is "Core, to confirm" (Q6), review A12') : ''}</div>${tile(get, val)}${dk ? annW(dk) : ''}</div></div>`).join('')}</div>
    <div class="card"><div class="hd"><h3>${T('b.table')}</h3>${A.ann('3.2 No ADHD wording: ratios as numbers')}</div><div class="scroll-x"><table class="tbl">
      <tr><th>${T('b.measure')}</th><th>${T('b.site')}</th><th>${T('b.condition')}</th><th class="num">${T('b.value')}</th>${nn ? '' : `<th class="num">${T('b.normMean')}</th><th class="num">z</th>`}</tr>
      ${rows.map(([l, site, get, val, nm]) => ['EO', 'EC'].map((k, j) => { const lead = `<td>${j ? '' : l}</td><td class="small">${j ? '' : site}</td><td>${cl(k)}</td>`;
        if (MISS(k)) return `<tr>${lead}<td class="num muted" colspan="${nn ? 1 : 3}">${T('b.noRes')}</td></tr>`;
        const v = get(k); return `<tr>${lead}<td class="num">${val(v)}</td>${nn ? '' : `<td class="num">${nm(v)}</td>${zc(v.z, null, '', v.marked)}`}</tr>`; }).join('')).join('')}
    </table></div>${nn ? '' : `<div class="bd" style="padding-top:8px">${mkLeg()}</div>`}</div>
    ${sents(T('b.sents'), SM().ratios)}
  </div>`;
}

/* ---------------- Asymmetry ---------------- */
function asym(body) {
  if (MISS(R.cond)) return missing(body, R.cond, 'asymmetry');
  const nn = NN(), S = A.m2.spectra.conditions[R.cond], pairs = A.case.asym_pairs;
  /* review C24: open on the band with the most marked pairs, until the clinician picks one */
  if (!R.asymUser && !nn) R.asymBand = BN.reduce((best, b) => S.asymmetry[b].filter(p => p.marked).length > S.asymmetry[best].filter(p => p.marked).length ? b : best, 'alpha');
  const out = nn ? 0 : BN.reduce((n, b) => n + S.asymmetry[b].filter(p => p.marked).length, 0);
  const mx = nn ? Math.max(1e-6, ...BN.flatMap(b => S.asymmetry[b].map(p => Math.abs(p.value)))) : 1;
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T('b.asymPairs', { cond: cll(R.cond) })}${annW('asym')}</h3><span class="xs muted">${T(nn ? 'b.lineW' : 'b.asymHelp')}</span></div>
      <div class="bd"><div class="paper"><div class="b-maps" id="bAh">${BN.map(b => `<canvas data-b="${b}" tabindex="0" class="${b === R.asymBand ? 'on' : ''}" aria-label="${T('b.asymAria', { b: BL[b] })}"></canvas>`).join('')}</div>${nn ? '' : `<div class="b-zs">${A.zScale()}</div><div class="b-zs" style="padding-bottom:8px">${mkLeg()}</div>`}</div></div></div>
    <div class="b-two">
      <div class="card"><div class="hd"><h3>${T(nn ? 'b.idxByPair' : 'b.zByPair')}</h3>${A.ann('Index definition: mockup assumption')}</div><div class="scroll-x"><table class="tbl b-zt"><tr><th>${T('b.pair')}</th>${BN.map(b => `<th class="num ${b === R.asymBand ? 'b-colon' : ''}">${BL[b]}</th>`).join('')}</tr>
        ${pairs.map((p, i) => `<tr><td class="mono">${p}</td>${BN.map(b => nn ? `<td class="num ${b === R.asymBand ? 'b-colsel' : ''}">${n1(S.asymmetry[b][i].value, 3)}</td>` : zc(S.asymmetry[b][i].z, null, b === R.asymBand ? 'b-colsel' : '', S.asymmetry[b][i].marked).replace('<td ', `<td title="${T('b.idxT', { b: BL[b], p, v: n1(S.asymmetry[b][i].value, 3) })}" `)).join('')}</tr>`).join('')}</table></div></div>
      <div class="card"><div class="hd"><h3>${BL[R.asymBand]} · ${cll(R.cond)}</h3><span class="xs muted">${nn ? '' : T('b.nOf48', { n: out })}</span></div><div class="scroll-x"><table class="tbl">
        <tr><th>${T('b.pair')}</th><th class="num">${T('b.asymIdx')}</th>${nn ? '' : '<th class="num">z</th>'}</tr>
        ${S.asymmetry[R.asymBand].map(p => `<tr><td class="mono">${p.pair}</td><td class="num">${n1(p.value, 3)}</td>${nn ? '' : zc(p.z, null, '', p.marked)}</tr>`).join('')}</table></div></div>
    </div>
    ${sents(T('b.sentsCond', { cond: cll(R.cond) }), SM()['asymmetry_' + R.cond], T(nn ? 'b.nnNoSent' : 'b.asymNone'))}
  </div>`;
  $$('#bAh canvas', body).forEach(cv => {
    const b = cv.dataset.b, bd = BANDS.find(x => x.name === b);
    headFig(cv, 120, (g, pt) => S.asymmetry[b].forEach(p => { const [l, r] = p.pair.split('-'), [x1, y1] = pt(l), [x2, y2] = pt(r);
      g.strokeStyle = nn ? 'rgba(58,70,80,0.75)' : A.zColor(p.z * 1.15); g.lineWidth = nn ? 1 + Math.abs(p.value) / mx * 6 : 2.5 + Math.min(3, Math.abs(p.z)) * 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      if (p.marked) { g.fillStyle = '#111'; g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.beginPath(); g.arc((x1 + x2) / 2, (y1 + y2) / 2, 4, 0, 2 * Math.PI); g.fill(); g.stroke(); } }), { title: `${BL[b]} ${T('b.rangeHz', { a: A.nx(bd.lo), b: A.nx(bd.hi) })}` });
    cv.onclick = () => { R.asymBand = b; R.asymUser = true; asym(body); }; cv.onkeydown = e => { if (e.key === 'Enter') cv.onclick(); };
  });
}

/* ---------------- Coherence ---------------- */
function coh(body) {
  if (MISS(R.cond)) return missing(body, R.cond, 'coherence');
  if (NN()) return cohNN(body);
  const CO = A.m2.coherence[R.cond], nMk = (b) => CO[b].pairs.filter(p => p.marked).length;
  if (!R.cohUser) R.cohBand = BN.reduce((best, b) => nMk(b) > nMk(best) ? b : best, 'alpha');
  const D = CO[R.cohBand], bl = BL[R.cohBand], rxB = new RegExp('\\b' + bl + '\\b', 'i'), sAll = SM()['coherence_' + R.cond] || [];
  /* the sentence card follows the selected band; a sentence that names no band stays */
  const sBand = R.cohSentAll ? sAll : sAll.filter(s => rxB.test(s.text) || !BN.some(b => new RegExp('\\b' + BL[b] + '\\b', 'i').test(s.text)));
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="hd"><h3>${T('b.cohHeads', { cond: cll(R.cond) })}</h3><span class="xs muted">${T('b.cohHeadsHelp')}</span></div>
      <div class="bd"><div class="paper"><div class="b-maps" id="bCo6">${BN.map(b => `<canvas data-b="${b}" tabindex="0" class="${b === R.cohBand ? 'on' : ''}" aria-label="${esc(BL[b])} · ${nMk(b)}"></canvas>`).join('')}</div></div></div></div>
    <div class="card"><div class="toolbar b-tl">
      <b class="small">${esc(bl)}</b><span class="sep"></span>
      <span class="b-annonly"><span class="seg" id="bCm">${[[false, 'b.cohMarked'], [true, 'b.cohAll']].map(([v, l]) => `<button data-v="${v ? 1 : 0}" class="${R.cohAll === v ? 'on' : ''}">${T(l)}</button>`).join('')}</span>${A.ann('Review D1: uncorrected view only under Annotations')}</span>
      <label><input type="checkbox" id="bOnly" ${R.cohOnly ? 'checked' : ''}> ${T('b.onlyBeyond')}</label>
      <span class="b-sp"></span><span class="small"><span class="muted">${T('b.global')}</span> <b class="num">${n1(D.global.value, 2)}</b> <span class="num xs ${D.global.marked ? 'b-mkt' : ''}">z ${fz(D.global.z)}${D.global.marked ? ' · ' + T('b.marked') : ''}</span>${A.ann('Table 3.3: global coherence, Core, to confirm (Q6); review A3: the status shows in annotations only')}${annW('cohg')}</span>
    </div>
    <div class="b-coh"><div class="paper b-fig b-cohf"><canvas id="bCh" aria-label="${T('b.cohAria')}"></canvas><div class="b-leg" style="padding:0 8px 6px;color:#55554f"><span><i style="background:${A.zColor(2.6)}"></i>${T('b.aboveNorm')}</span><span><i style="background:${A.zColor(-2.6)}"></i>${T('b.belowNorm')}</span><span>${T('b.width')}</span><span id="bCl"></span></div></div>
      <div class="b-cohr"><div class="row between small" style="padding:2px 0 8px"><span id="bCn"></span><span id="bCf"></span></div><div class="b-ctw" id="bCt"></div>
        <p class="xs muted" style="margin:8px 0 0">${T('b.cohCount', { n: A.int(171 * 6 * 2) })} ${A.ann('3.2 Multiple comparison correction, Working')}</p><div style="margin-top:6px">${mkLeg()}</div>${A.sys(SM().limits.filter(s => s.id === 'L-MC-1'))}</div></div></div>
    <div class="card"><div class="hd"><h3>${T('b.sentsBand', { cond: cll(R.cond), b: R.cohSentAll ? T('b.allBands') : bl })}</h3><span class="row" style="gap:6px"><span class="seg" id="bCsa"><button data-v="0" class="${R.cohSentAll ? '' : 'on'}">${T('b.oneBand')}</button><button data-v="1" class="${R.cohSentAll ? 'on' : ''}">${T('b.allBands')}</button></span><span class="xs muted">${T('b.fixed')}</span></span></div>
      <div class="bd b-sys">${sBand.length ? A.sys(sBand) : `<p class="muted small" style="margin:0">${esc(T('b.noBandSent', { b: bl }))}</p>`}</div></div>
  </div>`;
  let hit = null;
  /* six small heads: the marked pairs of each band, the picker of the band (review C24, as Asymmetry does) */
  $$('#bCo6 canvas', body).forEach(cv => { const b = cv.dataset.b, bd = BANDS.find(x => x.name === b), mk = CO[b].pairs.filter(p => p.marked);
    headFig(cv, 120, (g, pt) => mk.slice().sort((x, y) => Math.abs(x.z) - Math.abs(y.z)).forEach(p => { const [a, c] = p.pair.split('-'), [x1, y1] = pt(a), [x2, y2] = pt(c);
      g.strokeStyle = zLine(p.z); g.lineWidth = 1.2 + Math.max(0, Math.abs(p.z) - 1.5) * 0.9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }),
      { title: `${BL[b]} ${A.nx(bd.lo)}-${A.nx(bd.hi)} Hz · ${mk.length}` });
    cv.onclick = () => { R.cohBand = b; R.cohUser = true; R.cohCh = null; coh(body); }; cv.onkeydown = e => { if (e.key === 'Enter') cv.onclick(); }; });
  $$('#bCsa button', body).forEach(b => b.onclick = () => { R.cohSentAll = b.dataset.v === '1'; coh(body); });
  /* the product shows marked pairs; all pairs beyond 2 z (uncorrected) only for review under Annotations */
  const all = () => R.cohAll && ANN();
  const shown = () => D.pairs.filter(p => all() ? Math.abs(p.z) >= 2 : p.marked);
  const fig = () => {
    $('#bCl', body).innerHTML = all() ? `<i style="background:none;border-top:2px dashed #6b7279;height:0"></i>${T('b.d1u')}` : '';
    const cv = $('#bCh', body), S = Math.min(380, Math.max(260, cv.parentElement.clientWidth - 4)), hs = shown(), hv = R.cohHov;
    const inv = R.cohCh ? new Set([R.cohCh, ...hs.filter(p => p.pair.split('-').includes(R.cohCh)).flatMap(p => p.pair.split('-'))]) : null;
    hit = headFig(cv, S, (g, pt) => hs.slice().sort((a, b) => Math.abs(a.z) - Math.abs(b.z)).forEach(p => {
      const [a, b] = p.pair.split('-'), on = !R.cohCh || a === R.cohCh || b === R.cohCh; const [x1, y1] = pt(a), [x2, y2] = pt(b);
      g.strokeStyle = zLine(p.z, on ? (p.marked ? 0.9 : 0.6) : 0.12); g.lineWidth = (hv === p.pair ? 2.5 : 0) + (p.marked ? 1.2 + Math.max(0, Math.abs(p.z) - 1.5) * 1.6 : 1.4); g.lineCap = 'round';
      g.setLineDash(p.marked ? [] : [5, 4]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]); }), { names: true, sel: R.cohCh, dim: inv });
  };
  const tab = () => {
    let rows = (R.cohOnly ? shown() : D.pairs.slice()); if (R.cohCh) rows = rows.filter(p => p.pair.split('-').includes(R.cohCh));
    const [k, d] = R.cohSort; rows.sort((a, b) => k === 'pair' ? d * a.pair.localeCompare(b.pair) : k === 'value' ? d * (a.value - b.value) : d * (Math.abs(a.z) - Math.abs(b.z)));
    $('#bCn', body).innerHTML = T(all() ? 'b.cohNall' : 'b.cohN', { n: `<b>${shown().length}</b>`, b: BL[R.cohBand], cond: cll(R.cond) });
    $('#bCf', body).innerHTML = R.cohCh ? `<button class="btn sm" id="bCx">${R.cohCh} ✕</button>` : `<span class="xs muted">${T('b.clickEl')}</span>`;
    const ar = (c) => R.cohSort[0] === c ? (R.cohSort[1] > 0 ? ' ▲' : ' ▼') : '';
    $('#bCt', body).innerHTML = `<table class="tbl"><thead><tr><th><button class="b-th" data-s="pair">${T('b.pair')}${ar('pair')}</button></th><th class="num"><button class="b-th" data-s="value">${T('b.coherence')}${ar('value')}</button></th><th class="num"><button class="b-th" data-s="z">z${ar('z')}</button></th></tr></thead>
      <tbody>${rows.length ? rows.map(p => `<tr data-p="${p.pair}"><td class="mono">${p.pair}</td><td class="num">${n1(p.value, 2)}</td>${zc(p.z, null, '', p.marked)}</tr>`).join('') : `<tr><td colspan="3" class="empty">${T('b.noPair')}</td></tr>`}</tbody></table>`;
    $$('.b-th', body).forEach(b => b.onclick = () => { R.cohSort = [b.dataset.s, R.cohSort[0] === b.dataset.s ? -R.cohSort[1] : (b.dataset.s === 'pair' ? 1 : -1)]; tab(); });
    $$('#bCt tr[data-p]', body).forEach(r => { r.onmouseenter = () => { R.cohHov = r.dataset.p; fig(); }; r.onmouseleave = () => { R.cohHov = null; fig(); }; });
    const x = $('#bCx', body); if (x) x.onclick = () => { R.cohCh = null; fig(); tab(); };
  };
  $$('#bCm button', body).forEach(b => b.onclick = () => { R.cohAll = b.dataset.v === '1'; $$('#bCm button', body).forEach(x => x.classList.toggle('on', x === b)); fig(); tab(); });
  cohSync = () => { $$('#bCm button', body).forEach(x => x.classList.toggle('on', (x.dataset.v === '1') === R.cohAll)); fig(); tab(); };
  $('#bOnly', body).onchange = e => { R.cohOnly = e.target.checked; tab(); };
  $('#bCh', body).onclick = e => { const r = e.target.getBoundingClientRect(), c = hit(e.clientX - r.left, e.clientY - r.top); R.cohCh = c && c !== R.cohCh ? c : null; fig(); tab(); };
  fig(); tab(); redraw = fig;
}
/* coherence without an age norm (M58): the pairs of one electrode coloured by their value on a fixed 0 to 1 scale */
function cohNN(body) {
  const D = A.m2.coherence[R.cond][R.cohBand], ch = R.cohCh || 'Fz';
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="card"><div class="toolbar b-tl"><div class="seg" id="bCb">${BN.map(b => `<button data-b="${b}" class="${b === R.cohBand ? 'on' : ''}">${BL[b]}</button>`).join('')}</div>
      <span class="b-sp"></span><span class="small"><span class="muted">${T('b.global')}</span> <b class="num">${n1(D.global.value, 2)}</b>${A.ann('Table 3.3: global coherence, Core, to confirm (Q6)')}</span></div>
    <div class="b-coh"><div class="paper b-fig b-cohf"><canvas id="bCh" aria-label="${T('b.cohAria')}"></canvas><div style="padding:0 8px 8px">${seqBar(T('b.cohScale'), '0', '1')}</div></div>
      <div class="b-cohr"><div class="row between small" style="padding:2px 0 8px"><span>${esc(T('b.cohSel', { ch, b: BL[R.cohBand], cond: cll(R.cond) }))}</span><span class="xs muted">${T('b.clickEl')}</span></div><div class="b-ctw" id="bCt"></div></div></div></div>
    ${sents(T('b.sentsCond', { cond: cll(R.cond) }), SM()['coherence_' + R.cond], T('b.nnNoSent'))}
  </div>`;
  const mine = D.pairs.filter(p => p.pair.split('-').includes(ch)).sort((a, b) => b.value - a.value);
  let hit = null;
  const fig = () => { const cv = $('#bCh', body), S = Math.min(380, Math.max(260, cv.parentElement.clientWidth - 4));
    hit = headFig(cv, S, (g, pt) => mine.slice().reverse().forEach(p => { const [a, b] = p.pair.split('-'), [x1, y1] = pt(a), [x2, y2] = pt(b), c = seqRGB(p.value);
      g.strokeStyle = `rgb(${c})`; g.lineWidth = 2 + p.value * 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }), { names: true, sel: ch }); };
  $('#bCt', body).innerHTML = `<table class="tbl"><tr><th>${T('b.pair')}</th><th class="num">${T('b.coherence')}</th></tr>${mine.map(p => `<tr><td class="mono">${p.pair}</td><td class="num">${n1(p.value, 2)}</td></tr>`).join('')}</table>`;
  $$('#bCb button', body).forEach(b => b.onclick = () => { R.cohBand = b.dataset.b; coh(body); });
  $('#bCh', body).onclick = e => { const r = e.target.getBoundingClientRect(), c = hit(e.clientX - r.left, e.clientY - r.top); if (c) { R.cohCh = c; coh(body); } };
  fig(); redraw = fig;
}

/* ---------------- Channel ERPs ---------------- */
function erpScale(t) { const chs = A.m2.erp.conditions[t].channels; let m = 0; CH.forEach(c => { const d = chs[c]; d.patient_uv.forEach((v, i) => { m = Math.max(m, Math.abs(v), d.norm_mean_uv ? Math.abs(d.norm_mean_uv[i]) + 2 * d.norm_sd_uv[i] : 0); }); }); return Math.ceil(m / 5) * 5; }
/* effective peak after the clinician's corrections: {lat, amp, moved} */
const pkEff = (t, p, drag) => {
  const k = p.component + ':' + p.site;
  if (drag && drag.k === k) return { lat: drag.ms, amp: A.m2.erp.conditions[t].channels[p.site].patient_uv[(drag.ms + 200) / 4], moved: drag.ms !== p.latency_ms };
  const m = p.latency_ms != null && pkMove(t, p); return m ? { lat: m.to_ms, amp: m.amplitude_uv, moved: true } : { lat: p.latency_ms, amp: p.amplitude_uv, moved: false };
};
function erpPlot(cv, W, H, t, ch, big, drag) {
  const E = A.m2.erp, d = E.conditions[t].channels[ch], TM = E.times_ms, lim = erpScale(t), g = cvs(cv, W, H);
  const ml = big ? 42 : 3, mr = big ? 18 : 3, mt = big ? 14 : 3, mb = big ? 26 : 3, pw = W - ml - mr, ph = H - mt - mb;
  const x = (ms) => ml + (ms + 200) / 1000 * pw, y = (v) => mt + (lim - v) / (2 * lim) * ph, pks = [];
  if (big) {
    font(g, 10, 400, true); g.fillStyle = MUTED;
    for (let ms = -200; ms <= 800; ms += 100) { g.strokeStyle = GRID; g.beginPath(); g.moveTo(Math.round(x(ms)) + 0.5, mt); g.lineTo(Math.round(x(ms)) + 0.5, mt + ph); g.stroke(); g.textAlign = 'center'; g.fillText(String(ms), x(ms), mt + ph + 13); }
    for (let v = -lim; v <= lim; v += 5) { g.strokeStyle = GRID; g.beginPath(); g.moveTo(ml, Math.round(y(v)) + 0.5); g.lineTo(ml + pw, Math.round(y(v)) + 0.5); g.stroke(); g.textAlign = 'right'; g.fillText(String(v), ml - 5, y(v) + 3); }
    font(g, 10); g.textAlign = 'right'; g.fillText(T('b.msFrom'), ml + pw, mt + ph + 24); g.textAlign = 'left'; g.fillText(T('b.uvUp'), ml + 4, mt + 10);
  }
  const st = PK()[t], here = big ? E.peaks.filter(p => p.condition === t && p.site === ch) : [];
  /* latency windows of the peaks on this channel: the range a marker can be moved in */
  here.forEach(p => { const w = PKWIN[p.component + ':' + t]; if (!w) return; const on = R.erpAct === p.component + ':' + p.site;
    g.fillStyle = on ? 'rgba(19,94,125,0.11)' : 'rgba(19,94,125,0.045)'; g.fillRect(x(w[0]), mt, x(w[1]) - x(w[0]), ph);
    g.strokeStyle = on ? MARK : 'rgba(19,94,125,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x(w[0]), mt + ph - 4); g.lineTo(x(w[0]), mt + ph); g.lineTo(x(w[1]), mt + ph); g.lineTo(x(w[1]), mt + ph - 4); g.stroke();
    /* the norm peak latency as a tick (review D6) */
    if (p.norm_latency_ms != null) { const X = Math.round(x(p.norm_latency_ms)) + 0.5; g.strokeStyle = on ? '#3a4650' : '#8b9096'; g.lineWidth = on ? 1.6 : 1.1; g.setLineDash([]);
      g.beginPath(); g.moveTo(X, mt + ph - 11); g.lineTo(X, mt + ph); g.stroke(); if (on) { font(g, 9.5, 500); g.fillStyle = '#3a4650'; g.textAlign = 'center'; g.fillText(T('b.normTick'), X, mt + ph - 14); g.textAlign = 'left'; } } });
  g.strokeStyle = '#a9aca7'; g.lineWidth = 1; g.beginPath(); g.moveTo(ml, Math.round(y(0)) + 0.5); g.lineTo(ml + pw, Math.round(y(0)) + 0.5); g.stroke();
  g.strokeStyle = '#8b9096'; g.beginPath(); g.moveTo(Math.round(x(0)) + 0.5, mt); g.lineTo(Math.round(x(0)) + 0.5, mt + ph); g.stroke();
  if (d.norm_mean_uv) { g.beginPath(); TM.forEach((ms, i) => { const p = [x(ms), y(d.norm_mean_uv[i] + 2 * d.norm_sd_uv[i])]; i ? g.lineTo(...p) : g.moveTo(...p); });
  for (let i = TM.length - 1; i >= 0; i--) g.lineTo(x(TM[i]), y(d.norm_mean_uv[i] - 2 * d.norm_sd_uv[i])); g.closePath(); g.fillStyle = NORMF; g.fill(); }
  if (big && d.norm_mean_uv) { g.setLineDash([4, 3]); g.strokeStyle = NORML; g.lineWidth = 1.1; g.beginPath(); TM.forEach((ms, i) => i ? g.lineTo(x(ms), y(d.norm_mean_uv[i])) : g.moveTo(x(ms), y(d.norm_mean_uv[i]))); g.stroke(); g.setLineDash([]); }
  g.strokeStyle = INK; g.lineWidth = big ? 1.8 : 1.2; g.beginPath(); TM.forEach((ms, i) => i ? g.lineTo(x(ms), y(d.patient_uv[i])) : g.moveTo(x(ms), y(d.patient_uv[i]))); g.stroke();
  if (big) {
    here.forEach(p => {
      font(g, 10.5, 600, true);
      if (p.latency_ms == null) { g.fillStyle = 'rgba(19,94,125,0.10)'; g.fillRect(x(-200), mt, x(0) - x(-200), ph); g.fillStyle = p.amplitude_marked ? '#111' : MARK; g.fillText(`${p.component} ${n1(p.amplitude_uv)} µV`, x(-190), mt + ph - 8); return; }
      const e = pkEff(t, p, drag), k = p.component + ':' + p.site, on = R.erpAct === k, nw = pkNow(p), mk = (!e.moved || (nw.moved && !drag)) && (nw.amplitude_marked || nw.latency_marked);
      const X = x(e.lat), Y = y(e.amp), up = e.amp >= 0, s = up ? -1 : 1, sz = on ? 1.3 : 1;
      if (e.moved) { g.strokeStyle = '#6a7580'; g.setLineDash([2, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(x(p.latency_ms), y(p.amplitude_uv)); g.lineTo(X, Y); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.arc(x(p.latency_ms), y(p.amplitude_uv), 2.5, 0, 2 * Math.PI); g.stroke(); }
      g.fillStyle = mk ? '#111' : MARK; g.beginPath(); g.moveTo(X, Y + s * 4); g.lineTo(X - 5 * sz, Y + s * 13 * sz); g.lineTo(X + 5 * sz, Y + s * 13 * sz); g.closePath(); g.fill();
      if (on) { g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); g.strokeStyle = MARK; g.lineWidth = 1.5; g.beginPath(); g.arc(X, Y, 5, 0, 2 * Math.PI); g.stroke(); }
      g.textAlign = 'center'; g.fillText(`${p.component} ${e.lat}${st.confirmed ? ' ✓' : ''}`, X, Y + (up ? -17 : 25) * (on ? 1.1 : 1)); g.textAlign = 'left';
      pks.push({ p, k, X, Y });
    });
    if (R.erpHov != null) { const i = R.erpHov; g.strokeStyle = 'rgba(28,42,54,0.45)'; g.beginPath(); g.moveTo(Math.round(x(TM[i])) + 0.5, mt); g.lineTo(Math.round(x(TM[i])) + 0.5, mt + ph); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x(TM[i]), y(d.patient_uv[i]), 3, 0, 2 * Math.PI); g.fill(); }
    g.strokeStyle = '#b9bbb6'; g.strokeRect(ml + 0.5, mt + 0.5, pw, ph);
  }
  const inv = (px) => Math.max(0, Math.min(TM.length - 1, Math.round(((px - ml) / pw * 1000) / 4)));
  inv.peaks = pks; return inv;
}
function erp(body) {
  const t = R.erpT, TN = ERPT.find(e => e[0] === t)[1], acc = A.m2.quality.accepted_trials[t], pk = A.m2.erp.peaks.filter(p => p.condition === t), st = PK()[t], sc = pkScored(t);
  const lk = locked(), rv = canRev();
  const nn = NN(), zCell = (z, mk, moved) => nn ? '' : moved ? `<td class="num muted xs" title="${T('b.zLaterT')}">${T('b.zLater')}</td>` : zc(z, null, '', mk);
  /* a move pending confirmation shows "pending"; a confirmed move shows the recomputed z and marking */
  body.innerHTML = `<div class="grid" style="gap:14px">${lockBanner('b.lockPk')}
    <div class="card"><div class="toolbar b-tl"><div class="seg" id="bEt">${ERPT.map(([k, l]) => `<button data-k="${k}" class="${k === t ? 'on' : ''}">${l}${pkScored(k).length && PK()[k].confirmed ? ' ✓' : ''}</button>`).join('')}</div>
      <span class="chip${acc < 50 ? ' amber' : ''}">${T('b.trialsAcc', { a: acc, n: A.m2.vcpt.trials[t] })}${acc < 50 ? ' · ' + esc(T('b.lowTrials')) : ''}</span>${A.ann('Mockup assumption M8: a warning below 50 accepted trials (the legacy warns below 30 or 50, audit 14b)')}<span class="xs muted">${T('b.scale', { s: erpScale(t) })}</span>${annW(...(t === 'novelty' ? ['base', 'nov'] : ['base']))}<span class="b-sp"></span>${specLegend(T('b.peakZ'), nn)}</div>
      <div class="b-erp"><div class="scroll-x" style="padding:12px"><div class="paper b-eg" id="bEg">${LAYOUT.flat().map(c => c ? `<button class="b-ec ${c === R.erpCh ? 'on' : ''}" data-ch="${c}"><span>${c}</span><canvas></canvas></button>` : '<span></span>').join('')}</div></div>
        <div class="b-erpd"><div class="row between"><h3 id="bEh"></h3><span class="b-read mono xs" id="bEr" style="padding:0"></span></div><div class="paper b-fig" style="margin-top:6px"><canvas id="bEb" tabindex="0" aria-label="${T('b.erpAria')}"></canvas></div>
          <div class="b-pkbar" id="bPk"></div></div></div>
      <div class="b-pkw"><div class="scroll-x" id="bPt"></div><div style="margin-top:8px">${nn ? '' : mkLeg()}${annW(...(t === 'novelty' ? ['peaks', 'p3a'] : ['peaks']))}</div></div></div>
    ${sents(T('b.sents'), A.erpNow ? A.erpNow() : SM().erp)}
  </div>`;
  let inv = null, drag = null;
  const table = () => { $('#bPt', body).innerHTML = `<table class="tbl b-pkt"><tr><th>${T('b.component')}</th><th>${T('b.site')}</th><th class="num">${T('b.amplitude')}</th>${nn ? '' : '<th class="num">z</th>'}<th class="num">${T('b.latency')}</th>${nn ? '' : '<th class="num">z</th>'}</tr>
    ${pk.length ? pk.map(p => { const e = pkEff(t, p), w = PKWIN[p.component + ':' + t], nw = pkNow(p), pend = e.moved && !nw.moved;
      return `<tr class="link ${p.site === R.erpCh ? 'sel' : ''}" data-ch="${p.site}" data-k="${p.latency_ms == null ? '' : p.component + ':' + p.site}" tabindex="0"><td><b>${p.component}</b>${e.moved ? ` <span class="chip info">${T('b.pkMoved')}</span>` : ''}</td><td class="mono">${p.site}</td><td class="num">${n1(e.amp)} µV</td>${zCell(nw.amplitude_z, nw.amplitude_marked, pend)}
      <td class="num" style="white-space:nowrap"${w ? ` title="${T('b.window')} ${w[0]} ${T('to')} ${w[1]} ms"` : ''}>${p.latency_ms == null ? esc(String(p.window_ms).replace(' to ', ' ' + T('to') + ' ')) + ' ms' : `${e.moved ? '<b>' : ''}${e.lat} ms${e.moved ? `</b><div class="xs muted">${T('b.pkSug', { v: p.latency_ms })}</div>` : ''}`}</td>${nn ? '' : p.latency_z == null ? zc(null) : zCell(nw.latency_z, nw.latency_marked, pend)}</tr>`; }).join('') : `<tr><td colspan="6" class="empty">${T('b.noComp')}</td></tr>`}</table>`;
    $$('#bPt tr[data-ch]', body).forEach(r => { const go = () => { if (r.dataset.k) R.erpAct = r.dataset.k; pick(r.dataset.ch); }; r.onclick = go; r.onkeydown = e => { if (e.key === 'Enter') go(); }; });
  };
  const bar = () => {
    const m = st.moved.length;
    const cb = st.confirmed ? `<span class="chip ok">${esc(T('b.pkConfBy', { t: TN, who: who(st.by) }))}</span>` : '';
    /* without an age norm the peaks cannot be moved (M58): no drag help, nothing to confirm (should-fix 11) */
    $('#bPk', body).innerHTML = !sc.length ? `<span class="xs muted">${T('b.pkNone')}</span>` : nn ? `<span class="xs muted">${esc(T('b.nnNoMove'))}</span>` : lk
      ? `${cb}<span class="xs muted">${T('b.pkState', { n: sc.length, m })}</span><span class="b-sp"></span>${lockNote()}`
      : !rv ? `${cb || todo(T('b.toConfirm'))}<span class="xs muted">${T('b.pkState', { n: sc.length, m })}</span><span class="b-sp"></span>${roNote()}`
      : st.confirmed
      ? `${cb}<span class="xs muted">${T('b.pkState', { n: sc.length, m })}</span><span class="b-sp"></span><button class="btn sm" id="bPc">${T('b.change')}</button>`
      : `<span class="xs muted b-pkh">${T('b.pkHelp')} ${A.ann('3.4 Clinician in control; review D6: a moved peak snaps to the nearest local extremum of its polarity, Shift places it on any sample of the window (mockup assumption)')}</span><span class="b-sp"></span>${m ? `<button class="btn sm ghost" id="bP0">${T('b.pkReset')}</button>` : ''}<button class="btn primary sm" id="bPok">${T('b.pkConfirm', { t: TN })}</button>`;
    const ok = $('#bPok', body); if (ok) ok.onclick = () => { if (!canRev()) return; st.confirmed = true; st.by = whoKey(); st.at = A.time(); R.erpAct = null;
      A.addLog('who.c1', m ? 'b.log.pkConfM' : 'b.log.pkConfS', { t: TN, n: sc.length, m }); A.toast(T('b.toast.pk', { t: TN })); erp(body); railUp(); };
    const ch = $('#bPc', body); if (ch) ch.onclick = () => { if (!canRev()) return; st.confirmed = false; A.addLog('who.c1', 'b.log.pkOpen', { t: TN }); erp(body); railUp(); };
    const r0 = $('#bP0', body); if (r0) r0.onclick = () => { st.moved = []; A.addLog('who.c1', 'b.log.pkReset', { t: TN }); all(); };
  };
  /* commit a moved peak: one log line per change */
  const commit = (p, ms) => {
    const prev = pkEff(t, p).lat; if (ms === prev) return;
    st.moved = st.moved.filter(m => !(m.component === p.component && m.site === p.site));
    if (ms === p.latency_ms) A.addLog('who.c1', 'b.log.pkBack', { c: p.component, site: p.site, t: TN, a: p.latency_ms });
    else { const amp = Math.round(A.m2.erp.conditions[t].channels[p.site].patient_uv[(ms + 200) / 4] * 100) / 100;
      st.moved.push({ component: p.component, site: p.site, from_ms: p.latency_ms, to_ms: ms, amplitude_uv: amp });
      A.addLog('who.c1', 'b.log.pkMoved', { c: p.component, site: p.site, t: TN, a: p.latency_ms, b: ms, v: { $n: amp, d: 1 } }); }
  };
  const clampMs = (p, ms) => { const w = PKWIN[p.component + ':' + t]; return Math.max(Math.ceil(w[0] / 4) * 4, Math.min(Math.floor(w[1] / 4) * 4, Math.round(ms / 4) * 4)); };
  /* review D6: the local extrema of the right polarity in the peak's window (maxima for P1, P3, P3a; minima for N1, N2) */
  const extrema = (p) => { const w = PKWIN[p.component + ':' + t], d = A.m2.erp.conditions[t].channels[p.site].patient_uv, neg = /^N/.test(p.component), out = [];
    const i0 = Math.max(1, Math.ceil((w[0] + 200) / 4)), i1 = Math.min(d.length - 2, Math.floor((w[1] + 200) / 4));
    for (let i = i0; i <= i1; i++) { const a = d[i - 1], b = d[i], c = d[i + 1]; if (neg ? (b <= a && b < c) : (b >= a && b > c)) out.push(i * 4 - 200); }
    if (!out.length) { let bi = i0; for (let i = i0; i <= i1; i++) if (neg ? d[i] < d[bi] : d[i] > d[bi]) bi = i; out.push(bi * 4 - 200); }
    return out; };
  const snap = (p, ms, free) => { const c = clampMs(p, ms); if (free) return c; return extrema(p).reduce((m, x) => Math.abs(x - c) < Math.abs(m - c) ? x : m); };
  const small = () => $$('#bEg .b-ec', body).forEach(b => { const cv = $('canvas', b), W = Math.max(70, b.clientWidth - 8); erpPlot(cv, W, Math.round(W * 0.8), t, b.dataset.ch, false); b.classList.toggle('on', b.dataset.ch === R.erpCh); });
  const big = () => { const cv = $('#bEb', body), W = Math.max(300, cv.parentElement.clientWidth - 2); $('#bEh', body).textContent = `${R.erpCh} · ${TN}`; inv = erpPlot(cv, W, 250, t, R.erpCh, true, drag); };
  const all = () => { big(); table(); bar(); };
  const pick = (c) => { if (c !== R.erpCh) { R.erpCh = c; if (R.erpAct && !R.erpAct.endsWith(':' + c)) R.erpAct = null; } R.erpHov = null; small(); big(); table(); $('#bEr', body).textContent = ''; };
  $$('#bEt button', body).forEach(b => b.onclick = () => { R.erpT = b.dataset.k; R.erpAct = null; erp(body); });
  $$('#bEg .b-ec', body).forEach(b => b.onclick = () => pick(b.dataset.ch));
  const eb = $('#bEb', body), peakOf = (k) => pk.find(p => p.component + ':' + p.site === k);
  const near = (e) => { const r = eb.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let best = null, bd = 26 * 26;
    (inv.peaks || []).forEach(q => { const dd = (q.X - px) ** 2 + (q.Y - py) ** 2 * 0.5; if (dd < bd) { bd = dd; best = q; } }); return best; };
  eb.onpointerdown = e => { const q = near(e); if (!q) return; R.erpAct = q.k;
    if (lk) { lockToast(); big(); return; }
    if (nn) { A.toast(T('b.nnNoMove')); big(); return; }
    if (!rv) { A.toast(T('b.roRole')); big(); return; }
    if (st.confirmed) { A.toast(T('b.pkLocked')); big(); return; }
    drag = { k: q.k, ms: pkEff(t, q.p).lat }; eb.setPointerCapture(e.pointerId); big(); };
  eb.onpointermove = e => { const r = eb.getBoundingClientRect(), i = inv(e.clientX - r.left), d = A.m2.erp.conditions[t].channels[R.erpCh];
    if (drag) { const p = peakOf(drag.k), ms = snap(p, A.m2.erp.times_ms[i], e.shiftKey); if (ms !== drag.ms) { drag.ms = ms; big(); } $('#bEr', body).textContent = `${p.component} ${p.site} · ${ms} ms · ${n1(d.patient_uv[(ms + 200) / 4])} µV`; return; }
    eb.style.cursor = near(e) ? (st.confirmed || lk || nn || !rv ? 'not-allowed' : 'ew-resize') : 'crosshair';
    R.erpHov = i; big(); $('#bEr', body).textContent = d.norm_mean_uv ? T('b.readErp', { t: A.m2.erp.times_ms[i], p: n1(d.patient_uv[i]), m: n1(d.norm_mean_uv[i]), s: n1(2 * d.norm_sd_uv[i]) }) : T('b.readErpV', { t: A.m2.erp.times_ms[i], p: n1(d.patient_uv[i]) }); };
  eb.onpointerup = () => { if (!drag) return; const p = peakOf(drag.k), ms = drag.ms; drag = null; commit(p, ms); all(); };
  eb.onpointerleave = () => { if (drag) return; R.erpHov = null; big(); };
  /* keyboard: arrow keys move the selected peak by one sample (4 ms); the change is logged when the key is released */
  eb.onkeydown = e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; const p = R.erpAct && peakOf(R.erpAct); if (!p || !p.site || p.site !== R.erpCh) return; e.preventDefault();
    if (lk) { lockToast(); return; }
    if (nn) { A.toast(T('b.nnNoMove')); return; }
    if (!rv) { A.toast(T('b.roRole')); return; }
    if (st.confirmed) { A.toast(T('b.pkLocked')); return; }
    /* arrow keys: the next extremum in that direction; with Shift one sample (4 ms) */
    const cur = drag ? drag.ms : pkEff(t, p).lat, dir = e.key === 'ArrowLeft' ? -1 : 1, ex = extrema(p).filter(x => dir < 0 ? x < cur : x > cur);
    const to = e.shiftKey || !ex.length ? clampMs(p, cur + dir * 4) : (dir < 0 ? ex[ex.length - 1] : ex[0]);
    drag = { k: R.erpAct, ms: e.shiftKey || ex.length ? to : cur }; big(); };
  eb.onkeyup = e => { if (!drag || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return; const p = peakOf(drag.k), ms = drag.ms; drag = null; commit(p, ms); all(); };
  eb.onfocus = () => { if (!R.erpAct) { const p = sc.find(q => q.site === R.erpCh); if (p) { R.erpAct = p.component + ':' + p.site; big(); } } };
  wireLock(body); small(); all(); redraw = () => { small(); big(); };
}
const railUp = () => { $('#bRail', root0).innerHTML = rail(); wireRail(); };

/* ---------------- VCPT behaviour ---------------- */
function vcpt(body) {
  const V = A.m2.vcpt, nn = NN(), M = [['omissions', T('b.om'), '', T('b.ofGo', { n: V.trials.go })], ['commissions', T('b.cm'), '', T('b.ofNoGo', { n: V.trials.nogo })], ['rt_mean_ms', T('b.rt'), ' ms', T('b.goTrials')], ['rt_sd_ms', T('b.rtsd'), ' ms', T('b.goTrials')]];
  /* review C8: omissions and commissions as two series per block, with counts and a legend (one series when the data have only the sum) */
  const two = V.omissions_per_block && V.commissions_per_block, SER = two ? [[V.omissions_per_block, '#2f4254', T('b.om')], [V.commissions_per_block, '#a7b1bb', T('b.cm')]] : [[V.errors_per_block, '#4d6a80', T('b.epb')]];
  body.innerHTML = `<div class="grid" style="gap:14px">
    <div class="grid b-tiles">${M.map(([k, l, u, s]) => { const v = V[k]; return `<div class="card"><div class="bd"><div class="xs muted">${l}${k === 'rt_sd_ms' ? annW('rtsd') : ''}</div>
      <div class="row" style="gap:8px;align-items:baseline"><b class="num" style="font-size:22px">${v.value}${u}</b><span class="xs muted">${s}</span></div>
      ${nn ? `<div class="xs muted">${T('b.nnNoCmp')}</div>` : `<div class="row between xs"><span>${T('b.percentile')} <b class="num">${Math.round(v.percentile)}</b></span><span class="num">z ${fz(v.z)}</span></div>
      <div class="paper b-pbar" role="img" aria-label="${T('b.percT', { p: Math.round(v.percentile) })}"><i class="b-pr"></i><i class="b-pm" style="left:50%"></i><b class="b-gt" style="left:${v.percentile}%;background:${A.zColor(v.z)}"></b></div>
      <div class="mono xs muted row between" style="margin-top:2px"><span>0</span><span>50</span><span>100</span></div>`}</div></div>`; }).join('')}</div>
    <div class="card"><div class="hd"><h3>${T('b.epb')}</h3><span class="xs muted">${T(two ? 'b.epbSub2' : 'b.epbSub')}</span>${A.ann('Table 3.3: errors per block of 40 trials, Core, a figure without norms; V3 shows omissions and NoGo commissions as separate bars with counts (audit 14b B.5)')}</div><div class="bd"><div class="b-leg" style="margin-bottom:6px">${SER.map(([, c, l]) => `<span><i style="background:${c}"></i>${esc(l)}</span>`).join('')}</div><div class="paper b-fig"><canvas id="bVb" aria-label="${T('b.epb')}"></canvas></div></div></div>
    ${sents(T('b.sents'), SM().behaviour)}
  </div>`;
  const draw = () => {
    const cv = $('#bVb', body), W = Math.max(300, Math.min(760, cv.parentElement.clientWidth - 2)), H = 180, nb = SER[0][0].length, mx = Math.max(3, ...SER.flatMap(s => s[0])), g = cvs(cv, W, H);
    const ml = 34, mb = 24, mt = 16, pw = W - ml - 10, ph = H - mt - mb, bw = pw / nb, sw = bw * 0.72 / SER.length;
    font(g, 10, 400, true);
    for (let v = 0; v <= mx; v++) { const Y = mt + ph - v / mx * ph; g.strokeStyle = GRID; g.beginPath(); g.moveTo(ml, Math.round(Y) + 0.5); g.lineTo(ml + pw, Math.round(Y) + 0.5); g.stroke(); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(String(v), ml - 6, Y + 3); }
    for (let i = 0; i < nb; i++) { const X0 = ml + i * bw + bw * 0.14;
      SER.forEach(([s, col], j) => { const v = s[i], h = v / mx * ph, X = X0 + j * sw; g.fillStyle = col; g.fillRect(X, mt + ph - h, sw - 1, h); if (v) { g.fillStyle = INK; g.textAlign = 'center'; g.fillText(String(v), X + sw / 2 - 0.5, mt + ph - h - 3); } });
      g.fillStyle = MUTED; g.textAlign = 'center'; g.fillText(String(i + 1), ml + i * bw + bw / 2, mt + ph + 14); }
    g.textAlign = 'right'; g.fillText(T('b.block'), ml - 6, mt + ph + 14); g.textAlign = 'left';
  };
  draw(); redraw = draw;
}

/* ---------------- Frequency markers: markers per electrode (module E) and the alpha peak marker ---------------- */
function postSpec() {
  const C = A.m2.spectra.conditions.EC, nn = NN(), ix = POST.map(c => CH.indexOf(c)), avg = (k) => A.m2.spectra.freqs.map((_, j) => ix.reduce((s, i) => s + C[k][i][j], 0) / ix.length);
  return { f: A.m2.spectra.freqs, lp: avg('log_power'), mu: nn ? null : avg('norm_log_mean'), sd: nn ? null : avg('norm_log_sd'), ap: C.alpha_peak };
}
let apDraw = null;
function markers(body) {
  body.innerHTML = `<div class="grid" style="gap:14px">${lockBanner('b.lockMk')}<div id="bFm" class="grid" style="gap:14px"></div><div id="bAp"></div></div>`;
  wireLock(body);
  if (A.ex && A.ex.fm) A.ex.fm($('#bFm', body));
  alphaCard($('#bAp', body));
  redraw = () => { if (A.ex && A.ex.fmRedraw) A.ex.fmRedraw(); if (apDraw) apDraw(); };
}
/* the alpha peak marker, eyes closed, posterior mean (M28): suggested, moved and confirmed by the clinician;
   without an age norm it shows the value only and needs no confirmation (mockup assumption) */
function alphaCard(el) {
  apDraw = null;
  if (MISS('EC')) { el.innerHTML = `<div class="card"><div class="empty">${esc(T('b.missEmpty', { cond: cll('EC') }))}</div></div>`; return; }
  const P = postSpec(), st = A.state.markers, sys = P.ap.hz, lk = locked(), nn = NN(), rv = canRev(), ro = lk || nn || !rv, dis = ro ? ' disabled' : '';
  if (R.mk == null || ro) R.mk = nn ? sys : (st.hz ?? sys);
  const zOf = (hz) => (hz - P.ap.norm_mean) / P.ap.norm_sd;
  el.innerHTML = `<div class="card"><div class="hd"><h3>${T('b.apTitle', { list: POST.join(', ') })}</h3><span class="row">${A.ann('Table 3.3: alpha peak frequency is Core (its value with z is under Ratios and indices); M28 the alpha peak marker; M52: its confirmation gates issue, a mockup assumption that holds only if Q6 puts frequency markers in the core (review A12)')}</span></div>
      <div class="bd"><div class="paper b-fig"><canvas id="bMk" tabindex="0" aria-label="${T('b.mkAria')}"></canvas></div>
        <div class="b-mkbar">${rv ? `<div class="row"><button class="btn sm" id="bMl"${dis} aria-label="${T('b.mkDown', { v: A.nf(0.1, 1) })}">◀ ${A.nf(0.1, 1)} Hz</button><button class="btn sm" id="bMr"${dis} aria-label="${T('b.mkUp', { v: A.nf(0.1, 1) })}">${A.nf(0.1, 1)} Hz ▶</button><button class="btn sm ghost" id="bM0"${dis}>${T('b.mkReset')}</button></div>` : ''}
          <dl class="kv b-mkkv" id="bMkv"></dl><div class="row" id="bMa"></div></div>
        <div class="xs muted">${nn ? T('b.mkNoNorm') : lk ? T('b.lockT') + ' · ' + T('b.why.' + lk) : !rv ? esc(T('b.roRole')) : T('b.mkHelp')}</div></div></div>`;
  const cv = $('#bMk', el); let sp = null, drag = false; if (ro) cv.style.cursor = 'default';
  const draw = () => { sp = drawSpec(cv, Math.max(300, cv.parentElement.clientWidth - 2), { f: P.f, lp: P.lp, mu: P.mu, sd: P.sd, f0: 2, f1: 20, H: 280, marks: [{ hz: sys, kind: 'sys', label: T('b.suggested') + ' ' }, ...(nn ? [] : [{ hz: R.mk, kind: 'user', label: T(st.confirmed ? 'b.confirmedL' : 'b.marker') + ' ' }])] }); };
  const info = () => {
    $('#bMkv', el).innerHTML = nn ? `<dt>${T('b.apf')}</dt><dd class="num"><b>${A.nf(sys, 1)} Hz</b></dd>` : `<dt>${T('b.suggested')}</dt><dd class="num">${A.nf(sys, 1)} Hz</dd><dt>${T('b.marker')}</dt><dd class="num"><b>${A.nf(R.mk, 1)} Hz</b> · z ${fz(zOf(R.mk))}</dd><dt>${T('b.norm')}</dt><dd class="num">${T('b.mkNorm', { m: A.nf(P.ap.norm_mean, 1), s: A.nf(P.ap.norm_sd, 2) })}</dd>`;
    const cb = st.confirmed ? `<span class="chip ok">${esc(T('b.mkConfBy', { hz: A.nf(st.hz, 1), who: who(st.by) }))}</span>` : '';
    $('#bMa', el).innerHTML = nn ? '' : lk ? (cb || lockNote()) : !rv ? (cb || todo(T('b.toConfirm'))) : st.confirmed && st.hz === R.mk ? `${cb}<button class="btn sm" id="bMc">${T('b.change')}</button>` : `<button class="btn primary" id="bMok">${T('b.confirmHz', { hz: A.nf(R.mk, 1) })}</button>`;
    const ok = $('#bMok', el); if (ok) ok.onclick = () => { if (!canRev()) return;
      const moved = Math.abs(R.mk - sys) > 1e-6; st.confirmed = true; st.hz = R.mk; st.by = whoKey(); st.at = A.time();
      A.addLog('who.c1', moved ? 'b.log.mkMoved' : 'b.log.mkConf', { a: { $n: sys, d: 1 }, b: { $n: R.mk, d: 1 } });
      A.toast(T('b.toast.mk', { a: A.nf(R.mk, 1) })); railUp(); draw(); info(); };
    const ch = $('#bMc', el); if (ch) ch.onclick = () => { st.confirmed = false; A.addLog('who.c1', 'b.log.mkOpen'); railUp(); draw(); info(); };
  };
  const set = (hz) => { if (nn || !rv) return; if (lk) { lockToast(); return; } R.mk = Math.round(Math.max(6, Math.min(14, hz)) * 10) / 10; draw(); info(); };
  cv.onpointerdown = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; if (!sp.inside(px) || nn || !rv) return; if (lk) { lockToast(); return; } drag = true; cv.setPointerCapture(e.pointerId); set(sp.fAt(px)); };
  cv.onpointermove = e => { if (!drag) return; const r = cv.getBoundingClientRect(); set(sp.fAt(e.clientX - r.left)); };
  cv.onpointerup = () => { drag = false; };
  cv.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); set(R.mk + (e.key === 'ArrowLeft' ? -0.1 : 0.1)); } };
  if (rv) { $('#bMl', el).onclick = () => set(R.mk - 0.1); $('#bMr', el).onclick = () => set(R.mk + 0.1); $('#bM0', el).onclick = () => set(sys); }
  draw(); info(); apDraw = draw;
}
function wireRail() {
  $$('[data-sec]', root0).forEach(b => b.onclick = () => { R.sec = b.dataset.sec; R.off = null; show(root0); });
  $$('[data-off]', root0).forEach(b => b.onclick = () => { R.off = b.dataset.off; show(root0); });
}

A.css('b-results', `
.b-annw .ann { white-space: normal; max-width: 100%; text-align: left; font-size: 11px; line-height: 1.35; }
.b-wrap { display: grid; grid-template-columns: 216px minmax(0, 1fr); gap: 16px; align-items: start; }
.b-rail { position: sticky; top: 64px; display: grid; gap: 1px; align-content: start; }
.b-rgrp { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding: 10px 10px 4px; }
.b-rgrp:first-child { padding-top: 0; }
.b-ri { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; border: 0; background: none; padding: 7px 10px; border-radius: 6px; font-size: 13.5px; color: var(--ink-2); }
.b-ri:hover { background: var(--surface); color: var(--ink); }
.b-ri.on { background: var(--surface); color: var(--ink); font-weight: 600; box-shadow: inset 3px 0 0 var(--accent), var(--shadow); }
.b-ri.off { color: var(--muted); font-size: 12.5px; }
.b-ri.off small { display: block; font-size: 11px; opacity: 0.85; font-weight: 400; }
.b-ri .chip { font-size: 11px; padding: 0 6px; white-space: nowrap; flex: none; } .b-ri > span:first-child { min-width: 0; }
.chip.b-todo { background: transparent; border: 1px solid var(--amber); color: var(--ink); } .b-clk { color: var(--amber); margin-right: 1px; line-height: 1; }
.b-cnt { font-family: var(--f-mono); font-size: 11px; color: var(--muted); background: var(--surface-2); border: 1px solid var(--line); border-radius: 99px; padding: 0 6px; }
.b-main { display: grid; gap: 12px; min-width: 0; } #bBody { min-width: 0; display: grid; gap: 14px; }
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
#bSpec { cursor: crosshair; } #bMk { cursor: ew-resize; } #bCh { cursor: pointer; margin: 0 auto; } #bEb { cursor: crosshair; outline-offset: 2px; }
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
.b-gauge { display: block; padding: 6px 8px 2px; border-radius: 4px; cursor: default; }
.b-gtr { position: relative; display: block; height: 8px; background: #fff; border: 1px solid #c9ccc7; }
.b-gtr .b-g2 { position: absolute; top: 0; bottom: 0; left: 16.667%; width: 66.667%; background: #e3e6e1; }
.b-gtr .b-g0 { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: #9aa09a; }
.b-gt { position: absolute; top: -4px; bottom: -4px; width: 2px; margin-left: -1px; background: #1f1f1e !important; }
.b-gs { position: relative; display: block; height: 16px; font-family: var(--f-mono); font-size: 11px; color: #55554f; } .b-gs span { position: absolute; transform: translateX(-50%); top: 4px; }
.b-gs span:first-child { transform: none; } .b-gs span:last-child { transform: translateX(-100%); }
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
.b-ec span { font-family: var(--f-mono); font-size: 11px; } .b-ec canvas { display: block; }
.b-ec:hover { border-color: #b9bbb6; } .b-ec.on { border-color: ${MARK}; box-shadow: 0 0 0 1px ${MARK}; } .b-ec.on span { font-weight: 600; color: ${MARK}; }
.b-erpd { padding: 12px; min-width: 0; }
.b-tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (max-width: 1100px) { .b-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .b-tiles { grid-template-columns: minmax(0, 1fr); } }
.b-pbar { position: relative; height: 8px; margin-top: 10px; background: #fff; border: 1px solid #c9ccc7; cursor: default; }
.b-pbar .b-pr { position: absolute; left: 2.3%; right: 2.3%; top: 0; bottom: 0; background: #e3e6e1; }
.b-pbar .b-pm { position: absolute; top: 0; bottom: 0; width: 1px; background: #9aa09a; }
.b-lock { flex-wrap: wrap; } .b-lock > span { min-width: 200px; }
.b-mkbar { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; padding: 10px 0 8px; }
.b-mkkv { grid-template-columns: auto auto; gap: 2px 10px; font-size: 12.5px; }
.b-zc.b-mk { box-shadow: inset 0 0 0 2px #111; font-weight: 700; }
.b-zc.b-mk::after { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #111; margin-left: 4px; vertical-align: 2px; }
.b-leg i.b-dot, i.b-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #111; box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.5px #8b9096; margin-right: 6px; vertical-align: 0; }
.b-mkleg { white-space: normal; } .b-mkt { font-weight: 700; }
.b-d1 { display: none; margin-top: 12px; border: 1px dashed var(--accent); background: var(--accent-soft); color: var(--ink-2); border-radius: var(--r); padding: 8px 12px; font-size: 12px; line-height: 1.55; }
body.annotate .b-d1 { display: block; } .b-d1h { font-family: var(--f-mono); font-size: 11px; color: var(--accent); margin-bottom: 2px; }
.b-annonly { display: none; align-items: center; gap: 4px; flex-wrap: wrap; max-width: 100%; } body.annotate .b-annonly { display: inline-flex; }
.b-main .ann { white-space: normal; max-width: 100%; }
@media (max-width: 600px) { .b-annonly .seg { flex-wrap: wrap; } .b-annonly .seg button { white-space: normal; } }
.b-ac { display: none; } body.annotate .b-ac { display: table-cell; }
.b-segn { font-family: var(--f-mono); font-size: 11px; opacity: 0.75; }
.b-pkbar { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; padding: 8px 0 2px; }
.b-pkh { flex: 1 1 220px; }
.b-pkw { padding: 0 12px 12px; }
.b-off { display: flex; gap: 16px; align-items: flex-start; padding: 22px; }
.b-sumt td { vertical-align: middle; } .b-zchips { display: flex; flex-wrap: wrap; gap: 4px 6px; }
.b-zchip { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; } .b-zchip .w { font-size: 11.5px; color: var(--ink-2); }
.b-zchip .zv { font-family: var(--f-mono); font-variant-numeric: tabular-nums; font-weight: 700; font-size: 12px; padding: 1px 6px; border-radius: 3px; box-shadow: inset 0 0 0 2px #111; }
.b-zchip .zv::after { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: currentColor; margin-left: 4px; vertical-align: 2px; }
.b-asp { margin: 6px 0 2px; } .b-asp > summary { cursor: pointer; font-size: 12px; color: var(--muted); } .b-asp[open] > summary { margin-bottom: 4px; }
.b-key { display: grid; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--line); } .b-keyz { padding: 6px 8px; justify-self: start; max-width: 100%; }
.b-offic { font-size: 26px; color: var(--muted); line-height: 1; }
.c-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 14px; }
.bc-maps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow-x: auto; gap: 2px; padding: 6px; justify-items: center; }
.bc-maps canvas { cursor: pointer; }
.b-nores { font-size: 11px; opacity: 0.8; } .b-miss { padding: 34px 20px; } .c-pick label { white-space: nowrap; } .c-pick select { max-width: 220px; }
.c-tbl td.c-g { color: var(--muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; background: var(--surface-2); }
@media (max-width: 900px) {
  .b-wrap { grid-template-columns: minmax(0, 1fr); }
  .b-rail { position: static; display: flex; overflow-x: auto; gap: 4px; padding-bottom: 4px; }
  .b-rgrp { display: none; } .b-ri { white-space: nowrap; flex: none; } .b-ri.off small { display: none; }
  .b-meta { display: none; } .bc-maps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}`);

window.Modules.results = {
  render(root) {
    root0 = root; R.mk = null;
    if (A.state.rejected) { root.innerHTML = `<div class="card">${rejEmpty('bUnrej')}</div>`; $('#bUnrej', root).onclick = () => A.undoReject(); return; }
    const pre = !A.state.cleaning.confirmed;
    root.innerHTML = `<div class="b-wrap"><nav class="b-rail" id="bRail" aria-label="${T('b.railAria')}"></nav>
      <div class="b-main">${pre ? `<div class="banner amber b-pre"><b>${T('b.prelim')}</b><span style="flex:1">${T('b.prelimText')}</span><button class="btn sm" id="bGoCl">${T('b.openCln')}</button></div>` : ''}
        <div id="bRs"></div>${stateBanners()}<div class="toolbar b-tb" id="bTb" role="toolbar" aria-label="${T('b.viewAria')}"></div><div id="bBody"></div><div id="bD1"></div></div></div>`;
    const gc = $('#bGoCl', root); if (gc) gc.onclick = () => A.go('cleaning');
    rsBanner(root); wireLock(root); show(root);
    let last = root.clientWidth;
    ro = new ResizeObserver(() => { const w = root.clientWidth; if (Math.abs(w - last) > 4) { last = w; if (R.sec === 'spectra' || R.sec === 'erp' || R.sec === 'asym') show(root); else if (redraw) redraw(); } });
    ro.observe(root);
    /* Annotations switched on or off: the uncorrected coherence view exists only under Annotations */
    mo = new MutationObserver(() => { if (cohSync && R.cohAll) cohSync(); });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  },
  destroy() { if (ro) ro.disconnect(); ro = null; if (mo) mo.disconnect(); mo = null; clearInterval(rsT); rsT = null; },
};
/* review A9: while a new result set is computed the page says so and counts the steps; when it is done the toolbar names it */
let rsT = null;
function rsBanner(root) {
  clearInterval(rsT); rsT = null;
  const draw = () => { const el = $('#bRs', root); if (!el || !el.isConnected) { clearInterval(rsT); rsT = null; return; }
    const r = rsSync(); if (!r || !r.after || r.done) { el.innerHTML = ''; return false; }
    el.innerHTML = `<div class="banner b-pre"><b>${esc(T('b.rsRec'))}</b><span style="flex:1">${esc(T('b.rsRecText', { id: r.id, s: r.step, prev: r.prev }))}</span><span class="chip info"><span class="d"></span>${esc(T('bc.step', { s: r.step }))}</span>${A.ann('Review A9: a confirmed change of the segments or the cleaning gives a new result set; mockup assumption: its values equal set 1')}</div>`; return true; };
  if (draw()) rsT = setInterval(() => { if (draw() === false) { clearInterval(rsT); rsT = null; if (root.isConnected) show(root); } }, RSTEP);
}

/* B6 states of the current measurement: no age norm (M58) and conditions below the minimum analysed time (M25) */
function stateBanners() {
  const m = A.m2, nn = m.no_norm, out = [];
  if (nn) out.push(`<div class="banner warn b-pre"><b>${esc(T('b.nnT'))}</b><span style="flex:1">${esc(T('b.nnText', { a: A.nx(nn.age_years), lo: nn.norm_age_range_years[0], hi: nn.norm_age_range_years[1] }))}</span>${A.ann('Intended use section 5: no comparison outside the age range of the norms; M58')}${A.ann('Lead decision 2: no report can be issued (ISSUE-NONORM-1); open for the clinical lead: block as the mockup does, or allow the report with a mark')}</div>`);
  Object.entries(m.results_missing || {}).forEach(([k, v]) => out.push(`<div class="banner amber b-pre"><b>${esc(T('b.missT', { cond: cl(k) }))}</b><span style="flex:1">${esc(T('b.missText', { a: v.analysed_s, r: (m.quality.recordings[k] || {}).recorded_s, m: v.minimum_s }))}</span>${A.ann('M25 minimum analysed time; M58')}<button class="btn sm" data-b-go="segments">${T('b.openRec')}</button></div>`));
  return out.join('');
}
/* a rejected recording gives no results (M45): the Results tab and its Compare column show this instead */
const rejEmpty = (id) => `<div class="empty b-rej"><b>${esc(T('b.rejEmpty'))}</b><div style="margin-top:10px"><button class="btn sm" id="${id}">${esc(T('rej.undo'))}</button></div></div>`;
/* ================================ Compare page ================================ */
/* any two measurements, later against earlier, or all of them side by side (3.4, review B5): each against
   its own age norm; sentences from the pair keys "M2|M1", "M2|M0", "M1|M0" or comparisons_all */
const CMP = { cond: 'EC', meas: 'abs', ch: 'Fz', a: null, b: null, all: false, k: null };
const byDate = (x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
const mkKey = (m) => m.id.split('-').pop().toUpperCase();
/* processing state of a measurement: an earlier recording uploaded later is 'none', 'queued', 'processing' or 'done'
   (shell APP.state.earlier); every other measurement is 'done' */
const procOf = (m) => (m.uploaded_later && A.state.earlier ? A.state.earlier.status || 'none' : 'done');
/* the measurements of the current case to list: those available for comparison (shell APP.measurements()) and an
   earlier recording still being processed, oldest first */
const measList = () => { const all = A.case.measurements || [], av = typeof A.measurements === 'function' ? A.measurements() : all.filter(m => procOf(m) === 'done');
  return av.concat(all.filter(m => !av.includes(m) && (procOf(m) === 'queued' || procOf(m) === 'processing'))).sort(byDate); };
let cro = null;
function cmpPick(done) {
  if (CMP.k !== A.case.case_code) { CMP.k = A.case.case_code; CMP.a = CMP.b = null; CMP.all = false; }
  const ids = done.map(m => m.id);
  if (!ids.includes(CMP.b)) CMP.b = ids.includes(A.m2.id) ? A.m2.id : ids[ids.length - 1];
  if (!ids.includes(CMP.a) || CMP.a === CMP.b) { const bi = ids.indexOf(CMP.b); CMP.a = ids[bi > 0 ? bi - 1 : (bi + 1) % ids.length]; }
  let a = done.find(m => m.id === CMP.a), b = done.find(m => m.id === CMP.b);
  if (byDate(a, b) > 0) { [a, b] = [b, a]; CMP.a = a.id; CMP.b = b.id; }
  if (done.length < 3) CMP.all = false;
  return CMP.all ? done : [a, b];
}
function cmpRows(Ms) {
  const S = (m, k) => m.spectra.conditions[k], key = CMP.meas === 'abs' ? 'abs_z' : 'rel_z', mkey = CMP.meas === 'abs' ? 'abs_marked' : 'rel_marked', i = CH.indexOf(CMP.ch), none = ['', null], last = Ms[Ms.length - 1];
  const rows = [];
  rows.push({ g: T('bc.g.band', { ch: CMP.ch, m: T(CMP.meas === 'abs' ? 'bc.absolute' : 'bc.relative'), cond: cll(CMP.cond) }) });
  BN.forEach(b => rows.push({ l: BL[b], v: Ms.map(m => { const C = S(m, CMP.cond); if (!C) return none; const B = C.bands[b]; return [CMP.meas === 'abs' ? n1(B.abs_uv2[i]) + ' µV²' : n1(B.rel_pct[i]) + ' %', B[key][i], (B[mkey] || [])[i]]; }) }));
  rows.push({ g: T('b.s.ratios') });
  const idx = (k, get, fmt) => Ms.map(m => { const C = S(m, k); if (!C) return none; const v = get(C); return [fmt(v), v.z, v.marked]; });
  ['EO', 'EC'].forEach(k => rows.push({ l: T('bc.tbr', { cond: cll(k) }), v: idx(k, C => C.tbr, v => n1(v.value, 2)) }));
  ['EO', 'EC'].forEach(k => rows.push({ l: T('bc.faa', { cond: cll(k) }), v: idx(k, C => C.faa, v => n1(v.value, 2)) }));
  ['EO', 'EC'].forEach(k => rows.push({ l: T('bc.apf', { cond: cll(k) }), v: idx(k, C => C.alpha_peak, v => n1(v.hz) + ' Hz') }));
  rows.push({ g: T(Ms.length > 2 ? 'bc.g.cohN' : 'bc.g.coh', { cond: cll(CMP.cond) }) });
  const coh = (m, b) => (m.coherence[CMP.cond] || {})[b];
  BN.forEach(b => { const ref = coh(last, b); if (!ref) return;
    ref.pairs.forEach((p, j) => { if (Ms.some(m => coh(m, b) && coh(m, b).pairs[j].marked)) rows.push({ l: `${BL[b]} ${p.pair}`, v: Ms.map(m => { const q = coh(m, b); return q ? [n1(q.pairs[j].value, 2), q.pairs[j].z, q.pairs[j].marked] : none; }) }); });
    rows.push({ l: T('bc.glob', { b: BL[b] }), v: Ms.map(m => { const q = coh(m, b); return q ? [n1(q.global.value, 2), q.global.z, q.global.marked] : none; }) }); });
  rows.push({ g: T('b.r.erp') });
  const pkOf = (m, p) => m.erp.peaks.find(x => x.component === p.component && x.condition === p.condition && x.site === p.site), trN = (p) => ERPT.find(e => e[0] === p.condition)[1];
  last.erp.peaks.forEach(p => rows.push({ l: T('bc.amp', { c: p.component, site: p.site, trial: trN(p) }), v: Ms.map(m => { const q = pkOf(m, p); return q ? [n1(q.amplitude_uv) + ' µV', q.amplitude_z, q.amplitude_marked] : none; }) }));
  last.erp.peaks.filter(p => p.latency_ms != null).forEach(p => rows.push({ l: T('bc.lat', { c: p.component, site: p.site, trial: trN(p) }), v: Ms.map(m => { const q = pkOf(m, p); return q && q.latency_ms != null ? [q.latency_ms + ' ms', q.latency_z, q.latency_marked] : none; }) }));
  /* asymmetry: the pairs marked in any of the measurements shown, every band, the selected condition (review C2) */
  const asy = (m, b) => (S(m, CMP.cond) || {}).asymmetry && S(m, CMP.cond).asymmetry[b];
  const arows = []; BN.forEach(b => { const ref = asy(last, b); if (!ref) return; ref.forEach((p, j) => { if (Ms.some(m => asy(m, b) && asy(m, b)[j].marked)) arows.push({ l: `${BL[b]} ${p.pair}`, v: Ms.map(m => { const q = asy(m, b); return q ? [n1(q[j].value, 2), q[j].z, q[j].marked] : none; }) }); }); });
  if (arows.length) { rows.push({ g: T('bc.g.asym', { cond: cll(CMP.cond) }) }); rows.push(...arows); }
  rows.push({ g: T('b.s.vcpt') });
  [['omissions', T('b.om'), ''], ['commissions', T('b.cm'), ''], ['rt_mean_ms', T('b.rt'), ' ms'], ['rt_sd_ms', T('b.rtsd'), ' ms']]
    .forEach(([k, l, u]) => rows.push({ l, v: Ms.map(m => [m.vcpt[k].value + u + (m.vcpt[k].percentile != null ? ` · P${Math.round(m.vcpt[k].percentile)}` : ''), m.vcpt[k].z, m.vcpt[k].marked]) }));
  return rows;
}
function cmpDraw(root, Ms) {
  const key = CMP.meas === 'abs' ? 'abs_z' : 'rel_z', rej = !!A.state.rejected, vis = Ms.filter(m => !(rej && m === A.m2));
  Ms.forEach((m, j) => $$(`#cM${j} canvas`, root).forEach(cv => { const b = cv.dataset.b, bd = BANDS.find(x => x.name === b), C = m.spectra.conditions[CMP.cond], title = `${BL[b]} ${T('b.rangeHz', { a: A.nx(bd.lo), b: A.nx(bd.hi) })}`;
    if (!C) { cv._hit = () => null; const g = cvs(cv, 108, 124); font(g, 10); g.fillStyle = MUTED; g.textAlign = 'center'; g.fillText(T('b.noRes'), 54, 62); return; }
    cv._hit = A.topo(cv, C.bands[b][key], { size: 108, title, highlight: CMP.ch, marks: [CMP.ch] }); }));
  const rows = cmpRows(vis), cell = (v) => `<td class="num">${esc(v[0])}</td>${zc(v[1], null, '', v[2])}`;
  $('#cT', root).innerHTML = `<table class="tbl c-tbl"><tr><th>${T('b.measure')}</th>${vis.map(m => `<th class="num">${A.fmtDate(m.date)}</th><th class="num">z</th>`).join('')}</tr>
    ${rows.map(r => r.g ? `<tr><td colspan="${1 + 2 * vis.length}" class="c-g">${esc(r.g)}</td></tr>` : `<tr><td>${esc(r.l)}</td>${r.v.map(cell).join('')}</tr>`).join('')}</table><div style="padding:8px 12px">${mkLeg()}</div>`;
}
/* sentences of the measurements shown: CMP-1 for a pair (later|earlier), CMP-N-1 for all of them; limits L-REPROC-1, L-SIDE-1, L-IMPORT-1 */
function cmpSents(Ms, all, L) {
  const S = SL(L), keyOf = (a, b) => `${mkKey(b)}|${mkKey(a)}`;
  if (!all) { const k = keyOf(Ms[0], Ms[1]); return { cmp: (S.comparisons || {})[k] || [], lim: (S.comparison_limits || {})[k] || [] }; }
  const last = Ms[Ms.length - 1], seen = new Set(), rep = [], side = [], imp = [];
  Ms.slice(0, -1).forEach(m => ((S.comparison_limits || {})[keyOf(m, last)] || []).forEach(s => { if (seen.has(s.text)) return; seen.add(s.text); (s.id === 'L-REPROC-1' ? rep : s.id === 'L-SIDE-1' ? side : imp).push(s); }));
  const when = (s) => { const m = Ms.find(x => s.text.includes(A.fmtDate(x.date, L)) || s.text.includes(A.fmtDate(x.date, 'en'))); return m ? m.date : ''; };
  return { cmp: S.comparisons_all || [], lim: rep.sort((a, b) => (when(a) < when(b) ? -1 : 1)).concat(side.slice(0, 1), imp.slice(0, 1)) };
}
window.Modules.compare = {
  render(root) {
    const list = measList(), done = list.filter(m => procOf(m) === 'done'), busy = list.filter(m => procOf(m) !== 'done');
    const head0 = `<div class="pagehead"><div><h1>${T('bc.title')}</h1><div class="muted small"><span class="mono">${esc(A.case.case_code)}</span> · ${esc(A.name())} · ${T('bc.sub')} ${A.ann('3.4 Earlier recordings; Comparison of measurements, Working')}</div></div></div>`;
    const busyBan = busy.map(m => `<div class="banner"><b>${esc(T(procOf(m) === 'queued' ? 'bc.queued' : 'bc.procNow'))}</b><span style="flex:1">${esc(T('bc.procText', { d: A.fmtDate(m.date) }))}${procOf(m) === 'processing' && A.state.earlier.step ? ' ' + esc(T('bc.step', { s: A.state.earlier.step })) : ''}</span><span class="chip info"><span class="d"></span>${esc(T(procOf(m) === 'queued' ? 'bc.queued' : 'bc.procNow'))}</span></div>`).join('');
    if (done.length < 2) {
      root.innerHTML = `<div class="grid" style="gap:14px">${head0}${busyBan}<div class="card"><div class="empty"><div style="font-size:28px">⇄</div><b>${esc(T('bc.one'))}</b><div class="small" style="margin-top:6px">${esc(T('bc.oneSub'))}</div>
        <a class="btn primary" href="#upload" style="margin-top:12px">${esc(T('bc.upload'))}</a></div></div></div>`;
      return;
    }
    const Ms = cmpPick(done), rej = !!A.state.rejected, cur = (m) => m === A.m2, { cmp, lim } = cmpSents(Ms, CMP.all), showCmp = !(rej && Ms.includes(A.m2));
    const opt = (m) => `${A.fmtDate(m.date)}${cur(m) ? ' · ' + T('bc.current') : ''}${m.uploaded_later ? ' · ' + T('bc.uplLater') : ''}`;
    const sel = (id, v) => `<select id="${id}">${list.map(m => `<option value="${m.id}" ${m.id === v ? 'selected' : ''} ${procOf(m) === 'done' ? '' : 'disabled'}>${esc(opt(m))}${procOf(m) === 'done' ? '' : ' · ' + esc(T('bc.procNow'))}</option>`).join('')}</select>`;
    const rep = Ms.filter(m => m.processed_with.reprocessed), upl = Ms.filter(m => m.uploaded_later);
    const head = (m) => `<div class="hd"><div><h3>${A.fmtDate(m.date)}</h3><div class="xs muted">${esc(T('bc.headMeta', { a: A.nx(m.age_years), sw: m.processed_with.software, norms: A.dv(m.processed_with.norms) }))}</div></div><span class="row" style="gap:4px">${m.uploaded_later ? `<span class="chip">${T('bc.uplLater')}</span>` : ''}${m.processed_with.reprocessed ? `<span class="chip info">${T('bc.reproc', { d: A.fmtDate(String(m.processed_with.processed_at || '2026-10-29').slice(0, 10)) })}</span>` : `<span class="chip">${T('bc.current')}</span>`}</span></div>`;
    root.innerHTML = `<div class="grid" style="gap:14px">${head0}
      <div class="card"><div class="toolbar b-tl c-pick" role="toolbar" aria-label="${esc(T('bc.pickAria'))}"><span class="small muted">${T('bc.showing')}</span>
        ${CMP.all ? `<b class="small">${esc(T('bc.allN', { n: done.length }))}</b>` : `<label>${T('bc.earlier')} ${sel('cA', CMP.a)}</label><span class="muted">›</span><label>${T('bc.later')} ${sel('cB', CMP.b)}</label>`}
        <span class="sep"></span>${done.length > 2 ? `<div class="seg" id="cAll"><button data-all="0" class="${CMP.all ? '' : 'on'}">${T('bc.pair')}</button><button data-all="1" class="${CMP.all ? 'on' : ''}">${esc(T('bc.allN', { n: done.length }))}</button></div>` : ''}
        <span class="b-sp"></span><span class="xs muted">${T('bc.laterVs')}</span>${A.ann('Mockup assumption: a pair is always shown older first and stated later against earlier, as the sentence keys are')}</div></div>
      ${busyBan}
      ${rep.length ? `<div class="banner"><b>${T('bc.reprocB')}</b><span style="flex:1">${esc(T('bc.reprocN', { list: rep.map(m => A.fmtDate(m.date)).join(', ') }))}</span></div>` : ''}
      ${upl.length ? `<div class="banner"><b>${T('bc.uplLaterB')}</b><span style="flex:1">${esc(T('bc.import', { d: upl.map(m => A.fmtDate(m.date)).join(', ') }))}</span>${A.ann('3.4 Earlier recordings, Working: nothing is moved over from V3; V3 numbers are never shown in V4')}</div>` : ''}
      <div class="card"><div class="toolbar b-tl"><div class="seg" id="cCond">${['EO', 'EC'].map(k => `<button data-k="${k}" class="${CMP.cond === k ? 'on' : ''}">${cl(k)}</button>`).join('')}</div>
        <div class="seg" id="cMeas">${[['abs', 'b.abs'], ['rel', 'b.rel']].map(([k, l]) => `<button data-k="${k}" class="${CMP.meas === k ? 'on' : ''}">${T(l)}</button>`).join('')}</div>
        <span class="sep"></span><label>${T('bc.channel')} <select id="cCh">${CH.map(c => `<option ${c === CMP.ch ? 'selected' : ''}>${c}</option>`).join('')}</select></label><span class="xs muted">${T('bc.clickAll')}</span></div>
        <div class="c-two" style="padding:12px">${Ms.map((m, j) => `<div class="card">${head(m)}${rej && cur(m) ? rejEmpty('cUnrej') : `<div class="bd"><div class="paper bc-maps" id="cM${j}">${BN.map(b => `<canvas data-b="${b}" aria-label="${T('bc.mapAria', { b: BL[b], d: A.fmtDate(m.date) })}"></canvas>`).join('')}</div></div>`}</div>`).join('')}</div>
        <div style="padding:0 12px 12px"><div class="paper" style="padding:8px;display:inline-block">${A.zScale()}</div></div></div>
      <div class="card"><div class="hd"><h3>${T('bc.selected')}</h3><span class="xs muted">${T('bc.selSub')}</span></div><div class="scroll-x" id="cT"></div></div>
      ${showCmp ? sents(T('bc.comparison'), cmp) : ''}
      ${sents(T('b.limits'), lim.filter(s => showCmp || s.id !== 'L-SIDE-1'))}
    </div>`;
    const redo = () => window.Modules.compare.render(root);
    const pickCh = (c) => { if (!c) return; CMP.ch = c; $('#cCh', root).value = c; cmpDraw(root, Ms); };
    const ca = $('#cA', root), cb = $('#cB', root);
    if (ca) ca.onchange = () => { CMP.a = ca.value; if (CMP.a === CMP.b) CMP.b = done.find(m => m.id !== CMP.a).id; redo(); };
    if (cb) cb.onchange = () => { CMP.b = cb.value; if (CMP.a === CMP.b) CMP.a = done.find(m => m.id !== CMP.b).id; redo(); };
    $$('#cAll button', root).forEach(b => b.onclick = () => { CMP.all = b.dataset.all === '1'; redo(); });
    $$('#cCond button', root).forEach(b => b.onclick = () => { CMP.cond = b.dataset.k; $$('#cCond button', root).forEach(x => x.classList.toggle('on', x === b)); cmpDraw(root, Ms); });
    $$('#cMeas button', root).forEach(b => b.onclick = () => { CMP.meas = b.dataset.k; $$('#cMeas button', root).forEach(x => x.classList.toggle('on', x === b)); cmpDraw(root, Ms); });
    $('#cCh', root).onchange = e => pickCh(e.target.value);
    $$('.bc-maps canvas', root).forEach(cv => cv.onclick = e => { const r = cv.getBoundingClientRect(); pickCh(cv._hit(e.clientX - r.left, e.clientY - r.top)); });
    const un = $('#cUnrej', root); if (un) un.onclick = () => A.undoReject();
    cmpDraw(root, Ms);
  },
  destroy() { if (cro) cro.disconnect(); cro = null; },
};

/* shared with module E (markers per electrode, checklist) and the report module */
A.bx = { drawSpec, cvs, font, headFig, topoSeq, seqRGB, seqBar, zc, fz, mkLeg, topoDots, measList, procOf, mkKey, byDate, cmpSents, todo, who, whoKey, zchip,
  /* review C3: the summary table and its reading key, for the Overview (shell) and the report */
  sumTable: () => sumTable(), sumKey: () => sumKey(), sumGroups,
  railUp: () => { if (root0 && root0.isConnected && $('#bRail', root0)) railUp(); },
  openErp: (t, ch) => { R.sec = 'erp'; R.off = null; R.erpT = t; R.erpCh = ch; R.erpAct = null; if (root0 && root0.isConnected) { show(root0); window.scrollTo({ top: 0 }); } } };
