/* Module A: workspace tabs "Recording" (segments, EEG viewer, excerpts for the report) and "Cleaning"
   (ICA review per recording: eyes open, eyes closed, VCPT). Every signal on these tabs is generated here
   from a seeded PRNG, so it is deterministic and clearly synthetic (mockup assumption M22): it is not
   the report data. The viewer background follows the spectrum of the current measurement per electrode
   (M44, review A6); the ICA of eyes open follows the proposal in the data, those of eyes closed and VCPT
   are made here by the same rule (review B3). Every clinical action needs APP.can('review') and is
   logged with the account that made it. */
const A = window.APP, T = A.t;
A.addI18n({
  en: {
    'a.r.blink': 'Blink', 'a.r.muscle': 'Muscle', 'a.r.electrode': 'Electrode', 'a.r.movement': 'Movement', 'a.r.drowsy': 'Drowsiness', 'a.r.drowsyShort': 'Drowsy',
    'a.r.manual': 'Excluded manually', 'a.r.manualShort': 'Manual',
    'a.det.blink': 'blink detector', 'a.det.muscle': 'muscle detector', 'a.det.electrode': 'electrode detector', 'a.det.movement': 'movement detector',
    'a.byDet': '{s} s · {d}', 'a.byYou': '{s} s · excluded by the clinician', 'a.propEx2': 'Proposed: exclude, {d}', 'a.propIn2': 'Proposed: include',
    'a.included': 'Included', 'a.changed': 'changed', 'a.settling': 'Settling', 'a.settlingLong': 'Settling, not analysed', 'a.stim': 'Stim', 'a.all': 'All',
    'a.stat.page': '{a} to {b} of {c} · page {p} of {n}', 'a.stat.help': 'Click or drag over segments to include or exclude · ← → page · ↑ ↓ gain', 'a.stat.ro': '← → page · ↑ ↓ gain · read only',
    'a.seg': 'Segment {i}', 'a.stat.excl': 'excluded ({r})', 'a.stat.incl': 'included', 'a.stat.propEx': ' · proposed: exclude ({r})', 'a.stat.propIn': ' · proposed: include',
    'a.stat.clickIn': 'Click to include', 'a.stat.clickEx': 'Click to exclude',
    'a.segments': 'Segments', 'a.chgMan': 'Changed manually', 'a.chgManN': 'Changed manually · {n}', 'a.asProp': 'As proposed', 'a.min': 'Min',
    'a.aboveMin': 'Above the minimum', 'a.belowMin': 'Below the minimum', 'a.short': 'short', 'a.excludedH': '{cond}: excluded', 'a.nOfSegs': '{n} of {m} segments',
    'a.include': 'Include', 'a.exclude': 'Exclude', 'a.noExcl': 'No excluded segments', 'a.exAs': 'New exclusions as',
    'a.confirmed': 'Confirmed', 'a.confBy': (p) => `by ${p.who}${p.at ? ' at ' + p.at : ''}${p.n ? `, ${p.n} manual change${p.n > 1 ? 's' : ''}` : ''}`,
    'a.belowMinBan': 'Below the minimum analysed time. Include segments or reject the recording.', 'a.belowMinSome': '{list}: below the minimum analysed time, so no results for it. Include segments, or confirm without it.', 'a.reset': 'Reset to proposal', 'a.reviewCln': 'Review cleaning ›',
    'a.confirmSegs': 'Confirm segments',
    'a.log.excl': 'Excluded segment {i} ({a} to {b}) of {cond}', 'a.log.incl': 'Included segment {i} ({a} to {b}) of {cond}',
    'a.log.exclN': 'Excluded segments {i} to {j} ({a} to {b}) of {cond}', 'a.log.inclN': 'Included segments {i} to {j} ({a} to {b}) of {cond}',
    'a.log.exclR': 'Excluded segment {i} ({a} to {b}) of {cond}: {r}', 'a.log.exclNR': 'Excluded segments {i} to {j} ({a} to {b}) of {cond}: {r}',
    'a.log.reset': 'Reset segments to the automatic proposal', 'a.toast.reset': 'Segments reset to the proposal',
    'a.log.confirm': (p) => `Confirmed segments: eyes open ${p.eo} s, eyes closed ${p.ec} s, VCPT ${p.v} s analysed; ${p.n ? `${p.n} manual change${p.n > 1 ? 's' : ''}` : 'as proposed'}`,
    'a.toast.confChg': 'Segments confirmed with your changes. In the mockup the results keep the proposed segments.', 'a.toast.conf': 'Segments confirmed as proposed',
    'a.toast.segAgain': 'Segments changed after confirmation: confirm them again',
    'a.viewer': 'EEG viewer', 'a.montage': 'Montage', 'a.mont.avg': 'Average reference', 'a.mont.long': 'Bipolar longitudinal', 'a.mont.trans': 'Bipolar transverse',
    'a.anaRef': 'Analysis: average reference', 'a.gain': 'Gain', 'a.timebase': 'Timebase', 'a.pol': 'Polarity', 'a.negUp': 'Negative up', 'a.posUp': 'Positive up',
    'a.hp': 'HP', 'a.lp': 'LP', 'a.off': 'Off', 'a.notch': 'Notch 50 Hz', 'a.dispOnly': 'display only', 'a.dispOnlyT': 'Montage, polarity, filters and the cleaned view change the display only, not the analysis',
    'a.raw': 'Raw', 'a.cleaned': 'Cleaned', 'a.sigAria': 'Signal shown', 'a.cleanedN': 'Cleaned view: {n} components of {cond} taken out', 'a.cleanedT': 'The components set for removal on the Cleaning tab are taken out of the signal shown',
    'a.prev': 'Previous page', 'a.next': 'Next page', 'a.tracesAria': 'EEG traces', 'a.stripAria': 'Whole recording overview: segments and current page',
    'a.exAdd': '+ Excerpt {a} to {b} for the report', 'a.exTitle': 'Excerpts for the report', 'a.exNone': 'None chosen: the report leaves the raw EEG block out.',
    'a.exNote': '{s} s each, cleaned, average reference, negative up', 'a.exRm': 'Remove', 'a.exMax': 'At most {n} excerpts per report', 'a.exDup': 'This excerpt is already in the report',
    'a.exExcl': 'includes excluded segments', 'a.exMark': 'Excerpt {n}', 'a.exCount': '{n} of {m}', 'a.toast.exAdd': 'Excerpt added to the report',
    'a.log.exAdd': 'Added a raw EEG excerpt to the report: {cond}, {a} to {b}', 'a.log.exRm': 'Removed the raw EEG excerpt of {cond}, {a} to {b}, from the report',
    'a.exCap': 'Raw EEG, {cond}, {a} to {b}, after artefact removal · average reference · negative up · 0.5 to 35 Hz, notch 50 Hz · 50 µV between traces',
    'a.lockT': 'Read only', 'a.lockIss': 'Report v{v} is issued, so the segments are read only. A correction on the Issued tab reopens them.',
    'a.lockIssC': 'Report v{v} is issued, so the cleaning is read only. A correction on the Issued tab reopens it.',
    'a.openIssued': 'Open Issued', 'a.toast.locked': 'Read only: {why}', 'a.why.issued': 'the report is issued', 'a.why.rejected': 'the recording is rejected',
    'a.roToast': 'Read only: only a clinician can change this',
    'a.tpl.blink': 'Blink', 'a.tpl.hem': 'Horizontal eye movement', 'a.tpl.emgL': 'Muscle, left temporal', 'a.tpl.emgR': 'Muscle, right temporal', 'a.tpl.emgF': 'Muscle, frontal', 'a.tpl.amp': 'Amplifier',
    'a.noMatch': 'No reference map matches', 'a.tplMatch': 'Match with reference maps, |r|', 'a.tplRule': 'removed from r = {r}', 'a.method': 'ICA, reference maps',
    'a.icl.blink': 'Eye blinks', 'a.icl.hem': 'Horizontal eye movements', 'a.icl.alpha': 'Posterior alpha', 'a.icl.poR': 'Parieto-occipital right', 'a.icl.fmid': 'Frontal midline',
    'a.icl.musL': 'Muscle, left temporal', 'a.icl.musR': 'Muscle, right temporal', 'a.icl.muL': 'Central left', 'a.icl.muR': 'Central right', 'a.icl.pop': 'Single channel, F4',
    'a.icl.occL': 'Occipital left', 'a.icl.parM': 'Parietal midline', 'a.icl.tempR': 'Temporal right', 'a.icl.frL': 'Frontal left', 'a.icl.none': 'No clear pattern',
    'a.icl.cenM': 'Central midline', 'a.icl.frR': 'Frontal right',
    'a.icAria': 'Component {ic}, {label}', 'a.proposed': 'proposed', 'a.propT': 'The automatic cleaning proposes removing it', 'a.remove': 'Remove', 'a.keep': 'Keep',
    'a.isRm': 'removed', 'a.isKept': 'kept',
    'a.icaTitle': 'Artefact correction', 'a.icaSum': '{n} of {N} components removed ({v}% of variance) · proposal: {list} · rule: |r| ≥ {r} with a reference map', 'a.icRm': 'IC {ic} removed', 'a.icKept': 'IC {ic} kept',
    'a.accepted': 'Accepted', 'a.acceptedBy': '✓ Accepted by {who}', 'a.reject': 'Reject recording…', 'a.rejectT': 'Reject recording', 'a.accept': 'Accept cleaning · {cond}', 'a.confFirst': 'Confirm the segments first',
    'a.nextRec': 'Next: {cond} ›', 'a.toResults': 'Results ›', 'a.notAcc': 'Not accepted', 'a.sent': 'Fixed sentence',
    'a.recNoRes': '{cond} gives no results, so its cleaning is not needed for the report.', 'a.statusSpec': 'Core, or at the latest the first module after it (3.4)',
    'a.log.icaReset': 'Reset the ICA cleaning of {cond} to the automatic proposal',
    'a.log.icRm': 'Removed component {ic} ({kind}) of {cond} although the automatic cleaning proposed keeping it',
    'a.log.icKept': 'Kept component {ic} ({kind}) of {cond} although the automatic cleaning proposed removing it',
    'a.log.accept': 'Accepted the ICA cleaning of {cond}: {n} of {N} components removed, {how}', 'a.how.chg': 'changed manually', 'a.how.prop': 'as proposed',
    'a.toast.accChg': 'Cleaning accepted with your changes; the report states them', 'a.toast.acc': 'Cleaning accepted as proposed', 'a.toast.next': 'Cleaning of {a} accepted. Next: {b}',
    'a.reason': 'Reason', 'a.rj.many': 'Too many artefacts', 'a.rj.elec': 'Electrode problem', 'a.rj.proto': 'Protocol not followed', 'a.rj.coop': 'Patient could not cooperate',
    'a.rj.drowsy': 'Drowsiness', 'a.rj.other': 'Other', 'a.note': 'Note (optional)', 'a.notePh': 'Visible to the clinic only',
    'a.rjInfo': 'A rejected recording produces no results and no report. The patient can be recorded again.',
    'a.log.reject': 'Rejected the recording of {d}: {why}{note}',
    'a.toast.reject': 'Recording rejected. It gives no results and no report; the rejection can be undone.',
    'a.toast.clnAgain': 'Cleaning changed after acceptance: accept it again', 'a.toast.clnAgainR': 'Cleaning of {cond} changed after acceptance: accept it again', 'a.mapUnit': 'a.u., normalised; sign arbitrary',
    'a.keepComp': 'Keep component', 'a.rmComp': 'Remove component', 'a.expVar': 'Explained variance', 'a.rank': 'rank {r} of {n}', 'a.proposal': 'Proposal',
    'a.yourChoice': 'Choice', 'a.strongest': 'Strongest at', 'a.activation': 'Activation, {cond}, {a} to {b} (a.u.)', 'a.stimKey': 'A, P, H: pictures · R: response',
    'a.psd': 'Power spectrum at {ch}, {cond}, 1 to 45 Hz (dB re 1 µV²/Hz)', 'a.alphaBand': '8 to 12 Hz',
    'a.segNot': 'Segments not confirmed', 'a.segNotText': 'Confirm the segments on the Recording tab before accepting the cleaning.', 'a.openRec': 'Open Recording',
    'a.components': 'Components · {cond}', 'a.compSub': 'Sorted by explained variance · map in a.u.', 'a.ba': 'Signal before and after removal', 'a.before': 'Before',
    'a.after': 'After', 'a.overlay': 'Overlay', 'a.baAria': 'Frontal and temporal channels before and after removing the selected components',
  },
  de: {
    'a.r.blink': 'Lidschlag', 'a.r.muscle': 'Muskel', 'a.r.electrode': 'Elektrode', 'a.r.movement': 'Bewegung', 'a.r.drowsy': 'Müdigkeit', 'a.r.drowsyShort': 'Müdigkeit',
    'a.r.manual': 'Manuell ausgeschlossen', 'a.r.manualShort': 'Manuell',
    'a.det.blink': 'Lidschlagdetektor', 'a.det.muscle': 'Muskeldetektor', 'a.det.electrode': 'Elektrodendetektor', 'a.det.movement': 'Bewegungsdetektor',
    'a.byDet': '{s} s · {d}', 'a.byYou': '{s} s · von der Untersucherin oder dem Untersucher ausgeschlossen', 'a.propEx2': 'Vorschlag: ausschließen, {d}', 'a.propIn2': 'Vorschlag: einschließen',
    'a.included': 'Eingeschlossen', 'a.changed': 'geändert', 'a.settling': 'Einschwingen', 'a.settlingLong': 'Einschwingen, nicht ausgewertet', 'a.stim': 'Reiz', 'a.all': 'Alle',
    'a.stat.page': '{a} bis {b} von {c} · Seite {p} von {n}', 'a.stat.help': 'Segmente anklicken oder überstreichen, um sie ein- oder auszuschließen · ← → Seite · ↑ ↓ Verstärkung', 'a.stat.ro': '← → Seite · ↑ ↓ Verstärkung · schreibgeschützt',
    'a.seg': 'Segment {i}', 'a.stat.excl': 'ausgeschlossen ({r})', 'a.stat.incl': 'eingeschlossen', 'a.stat.propEx': ' · Vorschlag: ausschließen ({r})', 'a.stat.propIn': ' · Vorschlag: einschließen',
    'a.stat.clickIn': 'Klicken zum Einschließen', 'a.stat.clickEx': 'Klicken zum Ausschließen',
    'a.segments': 'Segmente', 'a.chgMan': 'Manuell geändert', 'a.chgManN': 'Manuell geändert · {n}', 'a.asProp': 'Wie vorgeschlagen', 'a.min': 'Min.',
    'a.aboveMin': 'Über dem Minimum', 'a.belowMin': 'Unter dem Minimum', 'a.short': 'zu kurz', 'a.excludedH': '{cond}: ausgeschlossen', 'a.nOfSegs': '{n} von {m} Segmenten',
    'a.include': 'Einschließen', 'a.exclude': 'Ausschließen', 'a.noExcl': 'Keine ausgeschlossenen Segmente', 'a.exAs': 'Neue Ausschlüsse als',
    'a.confirmed': 'Bestätigt', 'a.confBy': (p) => `von ${p.who}${p.at ? ' um ' + p.at : ''}${p.n ? `, ${p.n} manuelle Änderung${p.n > 1 ? 'en' : ''}` : ''}`,
    'a.belowMinBan': 'Unter der minimalen Auswertungszeit. Segmente einschließen oder die Aufnahme ablehnen.', 'a.belowMinSome': '{list}: unter der minimalen Auswertungszeit, daher keine Ergebnisse dafür. Segmente einschließen oder ohne diese Bedingung bestätigen.', 'a.reset': 'Auf Vorschlag zurücksetzen', 'a.reviewCln': 'Bereinigung prüfen ›',
    'a.confirmSegs': 'Segmente bestätigen',
    'a.log.excl': 'Segment {i} ({a} bis {b}) von {cond} ausgeschlossen', 'a.log.incl': 'Segment {i} ({a} bis {b}) von {cond} eingeschlossen',
    'a.log.exclN': 'Segmente {i} bis {j} ({a} bis {b}) von {cond} ausgeschlossen', 'a.log.inclN': 'Segmente {i} bis {j} ({a} bis {b}) von {cond} eingeschlossen',
    'a.log.exclR': 'Segment {i} ({a} bis {b}) von {cond} ausgeschlossen: {r}', 'a.log.exclNR': 'Segmente {i} bis {j} ({a} bis {b}) von {cond} ausgeschlossen: {r}',
    'a.log.reset': 'Segmente auf den automatischen Vorschlag zurückgesetzt', 'a.toast.reset': 'Segmente auf den Vorschlag zurückgesetzt',
    'a.log.confirm': (p) => `Segmente bestätigt: Augen offen ${p.eo} s, Augen geschlossen ${p.ec} s, VCPT ${p.v} s ausgewertet; ${p.n ? `${p.n} manuelle Änderung${p.n > 1 ? 'en' : ''}` : 'wie vorgeschlagen'}`,
    'a.toast.confChg': 'Segmente mit Ihren Änderungen bestätigt. Im Mockup behalten die Ergebnisse die vorgeschlagenen Segmente.', 'a.toast.conf': 'Segmente wie vorgeschlagen bestätigt',
    'a.toast.segAgain': 'Segmente nach der Bestätigung geändert: bitte erneut bestätigen',
    'a.viewer': 'EEG-Anzeige', 'a.montage': 'Montage', 'a.mont.avg': 'Durchschnittsreferenz', 'a.mont.long': 'Bipolare Längsreihe', 'a.mont.trans': 'Bipolare Querreihe',
    'a.anaRef': 'Auswertung: Durchschnittsreferenz', 'a.gain': 'Verstärkung', 'a.timebase': 'Zeitbasis', 'a.pol': 'Polarität', 'a.negUp': 'Negativ nach oben', 'a.posUp': 'Positiv nach oben',
    'a.hp': 'Hochpass', 'a.lp': 'Tiefpass', 'a.off': 'Aus', 'a.notch': 'Notch-Filter 50 Hz', 'a.dispOnly': 'nur Anzeige', 'a.dispOnlyT': 'Montage, Polarität, Filter und die bereinigte Ansicht ändern nur die Anzeige, nicht die Auswertung',
    'a.raw': 'Roh', 'a.cleaned': 'Bereinigt', 'a.sigAria': 'Angezeigtes Signal', 'a.cleanedN': 'Bereinigte Ansicht: {n} Komponenten von {cond} herausgenommen', 'a.cleanedT': 'Die im Tab Bereinigung zur Entfernung gewählten Komponenten werden aus dem angezeigten Signal herausgenommen',
    'a.prev': 'Vorherige Seite', 'a.next': 'Nächste Seite', 'a.tracesAria': 'EEG-Kurven', 'a.stripAria': 'Übersicht der gesamten Aufnahme: Segmente und aktuelle Seite',
    'a.exAdd': '+ Ausschnitt {a} bis {b} für den Bericht', 'a.exTitle': 'Ausschnitte für den Bericht', 'a.exNone': 'Keiner gewählt: Der Bericht lässt den Block Roh-EEG weg.',
    'a.exNote': 'je {s} s, bereinigt, Durchschnittsreferenz, negativ nach oben', 'a.exRm': 'Entfernen', 'a.exMax': 'Höchstens {n} Ausschnitte je Bericht', 'a.exDup': 'Dieser Ausschnitt ist schon im Bericht',
    'a.exExcl': 'enthält ausgeschlossene Segmente', 'a.exMark': 'Ausschnitt {n}', 'a.exCount': '{n} von {m}', 'a.toast.exAdd': 'Ausschnitt zum Bericht hinzugefügt',
    'a.log.exAdd': 'Roh-EEG-Ausschnitt zum Bericht hinzugefügt: {cond}, {a} bis {b}', 'a.log.exRm': 'Roh-EEG-Ausschnitt von {cond}, {a} bis {b}, aus dem Bericht entfernt',
    'a.exCap': 'Roh-EEG, {cond}, {a} bis {b}, nach der Artefaktentfernung · Durchschnittsreferenz · negativ nach oben · 0,5 bis 35 Hz, Notch-Filter 50 Hz · 50 µV zwischen den Kurven',
    'a.lockT': 'Schreibgeschützt', 'a.lockIss': 'Bericht v{v} ist freigegeben, daher sind die Segmente schreibgeschützt. Eine Korrektur im Tab Freigegeben öffnet sie wieder.',
    'a.lockIssC': 'Bericht v{v} ist freigegeben, daher ist die Bereinigung schreibgeschützt. Eine Korrektur im Tab Freigegeben öffnet sie wieder.',
    'a.openIssued': 'Freigegeben öffnen', 'a.toast.locked': 'Schreibgeschützt: {why}', 'a.why.issued': 'der Bericht ist freigegeben', 'a.why.rejected': 'die Aufnahme ist abgelehnt',
    'a.roToast': 'Schreibgeschützt: Nur Untersucherinnen und Untersucher können dies ändern',
    'a.tpl.blink': 'Lidschlag', 'a.tpl.hem': 'Horizontale Augenbewegung', 'a.tpl.emgL': 'Muskel, links temporal', 'a.tpl.emgR': 'Muskel, rechts temporal', 'a.tpl.emgF': 'Muskel, frontal', 'a.tpl.amp': 'Verstärker',
    'a.noMatch': 'Keine Referenzkarte passt', 'a.tplMatch': 'Übereinstimmung mit Referenzkarten, |r|', 'a.tplRule': 'entfernt ab r = {r}', 'a.method': 'ICA, Referenzkarten',
    'a.icl.blink': 'Lidschläge', 'a.icl.hem': 'Horizontale Augenbewegungen', 'a.icl.alpha': 'Posteriores Alpha', 'a.icl.poR': 'Parieto-okzipital rechts', 'a.icl.fmid': 'Frontal, Mittellinie',
    'a.icl.musL': 'Muskel, links temporal', 'a.icl.musR': 'Muskel, rechts temporal', 'a.icl.muL': 'Zentral links', 'a.icl.muR': 'Zentral rechts', 'a.icl.pop': 'Einzelkanal, F4',
    'a.icl.occL': 'Okzipital links', 'a.icl.parM': 'Parietal, Mittellinie', 'a.icl.tempR': 'Temporal rechts', 'a.icl.frL': 'Frontal links', 'a.icl.none': 'Kein klares Muster',
    'a.icl.cenM': 'Zentral, Mittellinie', 'a.icl.frR': 'Frontal rechts',
    'a.icAria': 'Komponente {ic}, {label}', 'a.proposed': 'Vorschlag', 'a.propT': 'Die automatische Bereinigung schlägt die Entfernung vor', 'a.remove': 'Entfernen', 'a.keep': 'Beibehalten',
    'a.isRm': 'entfernt', 'a.isKept': 'beibehalten',
    'a.icaTitle': 'Artefaktkorrektur', 'a.icaSum': '{n} von {N} Komponenten entfernt ({v} % der Varianz) · Vorschlag: {list} · Regel: |r| ≥ {r} mit einer Referenzkarte', 'a.icRm': 'IC {ic} entfernt', 'a.icKept': 'IC {ic} beibehalten',
    'a.accepted': 'Übernommen', 'a.acceptedBy': '✓ Übernommen von {who}', 'a.reject': 'Aufnahme ablehnen…', 'a.rejectT': 'Aufnahme ablehnen', 'a.accept': 'Bereinigung übernehmen · {cond}', 'a.confFirst': 'Zuerst die Segmente bestätigen',
    'a.nextRec': 'Weiter: {cond} ›', 'a.toResults': 'Ergebnisse ›', 'a.notAcc': 'Nicht übernommen', 'a.sent': 'Fester Satz',
    'a.recNoRes': '{cond} ergibt keine Ergebnisse, daher wird die Bereinigung für den Bericht nicht gebraucht.', 'a.statusSpec': 'Kern, spätestens das erste Modul danach (3.4)',
    'a.log.icaReset': 'ICA-Bereinigung von {cond} auf den automatischen Vorschlag zurückgesetzt',
    'a.log.icRm': 'Komponente {ic} ({kind}) von {cond} entfernt, obwohl die automatische Bereinigung ihre Beibehaltung vorschlug',
    'a.log.icKept': 'Komponente {ic} ({kind}) von {cond} beibehalten, obwohl die automatische Bereinigung ihre Entfernung vorschlug',
    'a.log.accept': 'ICA-Bereinigung von {cond} übernommen: {n} von {N} Komponenten entfernt, {how}', 'a.how.chg': 'manuell geändert', 'a.how.prop': 'wie vorgeschlagen',
    'a.toast.accChg': 'Bereinigung mit Ihren Änderungen übernommen; der Bericht nennt sie', 'a.toast.acc': 'Bereinigung wie vorgeschlagen übernommen', 'a.toast.next': 'Bereinigung von {a} übernommen. Weiter: {b}',
    'a.reason': 'Grund', 'a.rj.many': 'Zu viele Artefakte', 'a.rj.elec': 'Elektrodenproblem', 'a.rj.proto': 'Protokoll nicht eingehalten', 'a.rj.coop': 'Mitarbeit nicht möglich',
    'a.rj.drowsy': 'Müdigkeit', 'a.rj.other': 'Sonstiges', 'a.note': 'Notiz (optional)', 'a.notePh': 'Nur für die Klinik sichtbar',
    'a.rjInfo': 'Eine abgelehnte Aufnahme ergibt keine Ergebnisse und keinen Bericht. Die Patientin oder der Patient kann erneut aufgenommen werden.',
    'a.log.reject': 'Aufnahme vom {d} abgelehnt: {why}{note}',
    'a.toast.reject': 'Aufnahme abgelehnt. Sie ergibt keine Ergebnisse und keinen Bericht; die Ablehnung kann aufgehoben werden.',
    'a.toast.clnAgain': 'Bereinigung nach der Übernahme geändert: bitte erneut übernehmen', 'a.toast.clnAgainR': 'Bereinigung von {cond} nach der Übernahme geändert: bitte erneut übernehmen', 'a.mapUnit': 'relative Einheiten, normiert; Vorzeichen beliebig',
    'a.keepComp': 'Komponente beibehalten', 'a.rmComp': 'Komponente entfernen', 'a.expVar': 'Erklärte Varianz', 'a.rank': 'Rang {r} von {n}', 'a.proposal': 'Vorschlag',
    'a.yourChoice': 'Auswahl', 'a.strongest': 'Am stärksten an', 'a.activation': 'Aktivierung, {cond}, {a} bis {b} (relative Einheiten)', 'a.stimKey': 'A, P, H: Bilder · R: Reaktion',
    'a.psd': 'Leistungsspektrum an {ch}, {cond}, 1 bis 45 Hz (dB bezogen auf 1 µV²/Hz)', 'a.alphaBand': '8 bis 12 Hz',
    'a.segNot': 'Segmente nicht bestätigt', 'a.segNotText': 'Bestätigen Sie die Segmente im Tab Aufnahme, bevor Sie die Bereinigung übernehmen.', 'a.openRec': 'Aufnahme öffnen',
    'a.components': 'Komponenten · {cond}', 'a.compSub': 'Nach erklärter Varianz sortiert · Karte in relativen Einheiten', 'a.ba': 'Signal vor und nach der Entfernung', 'a.before': 'Vorher',
    'a.after': 'Nachher', 'a.overlay': 'Überlagert', 'a.baAria': 'Frontale und temporale Kanäle vor und nach dem Entfernen der gewählten Komponenten',
  },
});
const FS = 128, SEGLEN = 4, PX_MM = 96 / 25.4, EXS = 8, EX_MAX = 4;
const CH = A.channels, NCH = CH.length, CI = Object.fromEntries(CH.map((c, i) => [c, i]));
const RECS = ['EO', 'EC', 'VCPT'];
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const INK = '#1c2a36', GRID = '#e6e8ea', MUTED = '#6b7279';
const REASON = {
  blink: { col: '#3d6fd1', det: true }, muscle: { col: '#c2452d', det: true }, electrode: { col: '#8a4fc7', det: true }, movement: { col: '#b07a12', det: true },
  drowsy: { col: '#2f7f73', short: 'a.r.drowsyShort' }, manual: { col: '#5a6670', short: 'a.r.manualShort' },
};
const rLabel = (k) => T('a.r.' + k), rShort = (k) => T(REASON[k].short || 'a.r.' + k);
const INCL_COL = '#9fcfb0', TRIM_COL = '#d9dcdf';
/* who may act (verify blocking 2): every clinical action needs the review permission; actions are hidden for other roles */
const canRev = () => !A.can || A.can('review');
const whoKey = () => (A.state.staffView ? 'support' : (A.role || 'c1'));
const who = (by) => T('who.' + (by || 'c1'));
const roToast = () => { const k = A.state.staffView ? 'ro.toast' : 'ro.asstToast', d = (A.i18n || {})[A.lang] || {}; A.toast(d[k] ? T(k) : T('a.roToast')); };
/* read only after issue or rejection (shell APP.stageLocked; review C3) */
const locked = () => (A.stageLocked ? A.stageLocked() : '');
const ro = () => !!locked() || !canRev();
const lastV = () => { const r = A.state.report; return r.issued.length ? r.issued[r.issued.length - 1].v : r.version; };
/* after issue a banner here; a rejection has its banner with the undo action in the workspace header */
const lockBanner = (kind) => locked() !== 'issued' ? '' : `<div class="banner ok a-lock a-ban"><b>${T('a.lockT')}</b><span class="a-bmsg">${A.esc(T(kind === 'cleaning' ? 'a.lockIssC' : 'a.lockIss', { v: lastV() }))}</span><button class="btn sm" data-nav data-a-go="issued">${T('a.openIssued')}</button></div>`;
const lockToast = () => A.toast(T('a.toast.locked', { why: T('a.why.' + locked()) }));
const blocked = () => { if (!canRev()) { roToast(); return true; } if (locked()) { lockToast(); return true; } return false; };
const wireLock = (el) => { $$('[data-a-go]', el).forEach(b => b.onclick = () => A.go(b.dataset.aGo)); };
const MIN_S = { EO: 120, EC: 120, VCPT: 900 }; /* mockup assumption M25: minimum analysed seconds */

/* ---------------- deterministic random numbers ---------------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
const U = (r, lo, hi) => lo + (hi - lo) * r();
/* pink-ish noise: three normalised one-pole low-pass noises plus a little white noise, std about 1 */
function pink(r, w = [1, 0.55, 0.3]) {
  const k = [1, 4, 12].map(f => Math.exp(-2 * Math.PI * f / FS)), nr = k.map(v => Math.sqrt((1 + v) / (1 - v))), y = [0, 0, 0];
  return () => { let o = 0.15 * gauss(r); for (let j = 0; j < 3; j++) { y[j] = k[j] * y[j] + (1 - k[j]) * gauss(r); o += w[j] * y[j] * nr[j]; } return o / 1.2; };
}
function slow(r, fc) { const k = Math.exp(-2 * Math.PI * fc / FS), nr = Math.sqrt((1 + k) / (1 - k)); let y = 0; return () => (y = k * y + (1 - k) * gauss(r)) * nr; }
const fmt = (t) => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

/* ---------------- recordings: artefact plan and proposed segments ---------------- */
const COND0 = {
  EO: { dur: 180, trim: 0, seed: 1101, blinks: [2.4, 5.2], hem: 22,
    art: [[7, 'blink'], [18, 'muscle'], [29, 'electrode'], [38, 'movement']] },
  EC: { dur: 180, trim: 1, seed: 2203, blinks: null, hem: 45,
    art: [[12, 'muscle'], [33, 'electrode']] },
  VCPT: { dur: 1220, trim: 0, seed: 3307, blinks: [3, 7], hem: 40, art: null },
};
/* the stretch of each recording the Cleaning tab shows (its components' activations): 20 s from OFF */
const CW = 20, CN = CW * FS, OFF = { EO: 0, EC: 0, VCPT: 10 };
/* per case and measurement (APP.openCase): the plan above for MOCK-042, otherwise one derived from the data, so the
   proposed segments give exactly the analysed seconds of the case (the trim of the first seconds chosen to fit; eyes open
   of MOCK-057 lands below the minimum, M58); signals, segment choices, ICA models and the cleaning view are kept per case */
let COND = COND0, GEN = {}, SEG = {}, C = null;
const PER = {};
function deriveCond() {
  const rec = A.m2.quality.recordings || {}, salt = (parseInt(String(A.case.case_code).replace(/\D/g, ''), 10) || 7) * 31;
  const KINDS = { EO: ['movement', 'muscle', 'blink', 'movement', 'electrode', 'muscle'], EC: ['muscle', 'electrode', 'movement'], VCPT: ['blink', 'muscle', 'movement', 'blink', 'electrode'] };
  return Object.fromEntries(Object.keys(COND0).map(k => { const { _plan, ...b } = COND0[k], r = rec[k] || {}, dur = r.recorded_s || b.dur, an = r.analysed_s ?? dur;
    const trim = (k === 'EC' ? [1, 2, 3, 0] : [0, 1, 2, 3]).find(t => dur - t - an >= 0 && (dur - t - an) % 4 === 0) ?? b.trim;
    const nFull = Math.floor((dur - trim) / SEGLEN), nEx = Math.max(0, Math.min(nFull - 2, Math.round((dur - trim - an) / SEGLEN)));
    const rr = rng(b.seed + salt), pick = new Set(); while (pick.size < nEx) pick.add(1 + Math.floor(rr() * (nFull - 2)));
    return [k, { ...b, dur, trim, seed: b.seed + salt, art: [...pick].sort((x, y) => x - y).map((s, i) => [s, KINDS[k][i % KINDS[k].length]]) }]; }));
}
function syncCase() {
  const k = A.case.case_code + '|' + A.m2.id; if (PER._k === k) return;
  if (!PER[k]) PER[k] = { COND: k === 'MOCK-042|M-M2' ? COND0 : deriveCond(), GEN: {}, SEG: {}, ICM: {},
    C: { rec: null, sel: {}, removed: {}, ba: 'overlay', win: 0, spec: {} } };
  const p = PER[k]; PER._k = k; COND = p.COND; GEN = p.GEN; SEG = p.SEG; C = p.C;
  if (!COND[V.cond]) V.cond = 'EO'; V.start = 0; V.hover = null;
}
const PC = () => { syncCase(); return PER[PER._k]; };

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
  pop: CH.map(c => (c === 'F4' ? 1 : 0)), /* a loose electrode at F4; no reference map is a single F4 map */
  alpha: bm(0, -0.86, 0.6, [0, -0.6, 0.2]),
  muL: bm(-0.5, 0.02, 0.58, [0, 0.6, 0], 0.36), muR: bm(0.5, 0.02, 0.58, [0, 0.55, 0.1], 0.36),
  poR: bm(0.4, -0.75, 0.6, [0.2, -0.3, 0]), fmid: bm(0, 0.42, 0.45, [0, 0.2, 0], 0.42), occL: bm(-0.35, -0.85, 0.6, [-0.6, 0, 0], 0.38),
  parM: bm(0, -0.45, 0.6), tempR: bm(0.9, -0.2, 0.62, [0, 0, 0.2]), frL: bm(-0.45, 0.6, 0.6), cenM: bm(0, 0.05, 0.6, [0, 0, 0], 0.42), frR: bm(0.5, 0.55, 0.62, [0.2, 0, 0]),
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
/* the component kind that carries an artefact event (removing that component takes the event out) */
const artOf = (e) => e.k === 'blink' ? 'blink' : e.k === 'hem' ? 'hem' : e.k === 'muscle' ? (e.side === 'R' ? 'musR' : 'musL') : e.k === 'pop' ? 'pop' : null;

/* events that make sure each recording's Cleaning view (OFF to OFF + 20 s) shows its artefact components */
const SURE = {
  EO: [['hem', 3.3, -24, 1.0], ['hem', 8.3, 22, 0.7], ['hem', 16.4, -22, 1.1], ['muscle', 3.9, 38, 1.6], ['muscle', 11.6, 28, 1.2], ['pop', 7.5, 60], ['pop', 17.2, -45]],
  EC: [['muscle', 5.2, 12, 1.2], ['muscle', 14.8, 9, 0.8], ['pop', 9.3, 55], ['hem', 6.6, 14, 2.6], ['hem', 15.1, -12, 3.2]],
  VCPT: [['hem', 13.4, 26, 0.6], ['hem', 22.8, -30, 0.8], ['muscle', 15.6, 30, 1.3, 'R'], ['muscle', 26.2, 24, 1.0, 'R'], ['pop', 19.4, 50]],
};
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
  if (cfg.blinks) for (let t = 1 + r() * 2; t < cfg.dur - 1; t += U(r, cfg.blinks[0], cfg.blinks[1])) ev.push({ k: 'blink', t, a: U(r, 130, 190) });
  for (let t = 8 + r() * 10; t < cfg.dur - 3; t += U(r, cfg.hem * 0.6, cfg.hem * 1.4)) ev.push({ k: 'hem', t, d: U(r, 0.5, 1.4), a: (r() < 0.5 ? -1 : 1) * U(r, 25, 50) });
  art.forEach(([s, kind]) => {
    prop[s] = kind; const t0 = segs[s].t0;
    for (let i = ev.length - 1; i >= 0; i--) if (ev[i].k === 'blink' && ev[i].t > t0 - 0.5 && ev[i].t < t0 + SEGLEN) ev.splice(i, 1);
    if (kind === 'blink') { [0.35, 1.25, 2.15, 3.0].forEach((o, j) => ev.push({ k: 'blink', t: t0 + o, a: [230, 270, 210, 180][j] })); ev.push({ k: 'move', t: t0 + 0.2, d: 3.5, a: 45 }); }
    if (kind === 'muscle') ev.push({ k: 'muscle', t: t0 + U(r, 0.3, 0.8), d: U(r, 2.4, 3), a: 26, side: 'L' });
    if (kind === 'electrode') [[0.7, 230], [2.0, -170], [3.0, 130]].forEach(([o, a]) => ev.push({ k: 'pop', t: t0 + o, a }));
    if (kind === 'movement') ev.push({ k: 'move', t: t0 + 0.25, d: 3.4, a: 150 });
  });
  (SURE[key] || []).forEach(([k, t, a, d, side]) => ev.push({ k, t, a, d, side: side || 'L' }));
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

/* ---------------- synthetic 19-channel signal, average reference (review A6, M44) ----------------
   The background is drawn from the spectrum of the current measurement at every electrode (log power
   per 0.5 Hz bin, 1 to 30 Hz; eyes open or closed, VCPT uses eyes open), as mockup/synth.py raw_excerpt
   does for the report: random phases that are correlated between neighbouring sites (spatial kernel
   0.42), average referenced and scaled to each site's power. So with eyes closed the posterior alpha is
   about twice the frontal amplitude and blocked with the eyes open, slow activity is irregular and fast
   activity a few uV, as in the results. Flat below 1 Hz, falling steeply above 30 Hz, 0.3 to 45 Hz. One
   inverse FFT of 256 s, repeated. Artefacts are added on top, average referenced as well. */
const NB = 32768, DF = FS / NB, KMAX = Math.ceil(45 / DF);
const KER = (() => { const s = 0.42, K = CH.map(a => CH.map(b => { const p = A.pos[a], q = A.pos[b]; return Math.exp(-((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2) / (2 * s * s)); }));
  return K.map(r => { const q = Math.sqrt(r.reduce((x, v) => x + v * v, 0)); return r.map(v => v / q); }); })();
function ifft(re, im) { /* in-place radix-2 inverse FFT without scaling */
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const a = 2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const p = i + k, q = p + len / 2, tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
      re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
/* power spectral density (uV^2/Hz) per channel at the FFT bins 0..KMAX; a condition without results (below
   the minimum, M58) borrows eyes closed with the alpha around its peak at 40 percent */
function psdRows(key) {
  const S = A.m2.spectra.conditions, w = key === 'EC' ? 'EC' : 'EO', Cd = S[w] || S.EC || S.EO, lend = !S[w];
  const fr = A.m2.spectra.freqs, f0 = fr[0], f1 = fr[fr.length - 1], step = fr[1] - fr[0], apf = (Cd.alpha_peak || {}).hz || 10;
  return CH.map((c, i) => { const lp = Cd.log_power[i], out = new Float32Array(KMAX + 1);
    for (let k = 1; k <= KMAX; k++) { const f = k * DF; if (f < 0.3) continue;
      let l; if (f <= f0) l = lp[0]; else if (f >= f1) l = lp[lp.length - 1] - 2 * (Math.log10(f) - Math.log10(f1));
      else { const x = (f - f0) / step, j = Math.floor(x), t = x - j; l = lp[j] * (1 - t) + lp[Math.min(lp.length - 1, j + 1)] * t; }
      const g = Math.min(1, Math.max(0, (f - 0.3) / 0.4)) * Math.min(1, Math.max(0, (45 - f) / 10));
      out[k] = 10 ** l * g * g * (lend ? 1 - 0.6 * Math.exp(-((f - apf) ** 2) / (2 * 1.5 * 1.5)) : 1); }
    return out; });
}
function background(key, r) {
  const psd = psdRows(key), spec = CH.map(() => ({ re: new Float32Array(KMAX + 1), im: new Float32Array(KMAX + 1) })), wr = new Float64Array(NCH), wi = new Float64Array(NCH);
  for (let k = 1; k <= KMAX; k++) {
    for (let j = 0; j < NCH; j++) { wr[j] = gauss(r); wi[j] = gauss(r); }
    for (let c = 0; c < NCH; c++) { const K = KER[c], m = Math.sqrt(psd[c][k]); if (!m) continue; let a = 0, b = 0; for (let j = 0; j < NCH; j++) { a += K[j] * wr[j]; b += K[j] * wi[j]; } spec[c].re[k] = m * a; spec[c].im[k] = m * b; }
  }
  /* two channels per inverse FFT: the real and imaginary parts of two Hermitian spectra */
  const x = CH.map(() => null), re = new Float64Array(NB), im = new Float64Array(NB);
  for (let c = 0; c < NCH; c += 2) {
    re.fill(0); im.fill(0); const P = spec[c], Q = spec[c + 1] || { re: new Float32Array(KMAX + 1), im: new Float32Array(KMAX + 1) };
    for (let k = 1; k <= KMAX; k++) { const c1 = P.re[k], s1 = P.im[k], c2 = Q.re[k], s2 = Q.im[k]; re[k] = c1 - s2; im[k] = s1 + c2; re[NB - k] = c1 + s2; im[NB - k] = c2 - s1; }
    ifft(re, im); x[c] = Float32Array.from(re); if (c + 1 < NCH) x[c + 1] = Float32Array.from(im);
  }
  for (let i = 0; i < NB; i++) { let m = 0; for (let c = 0; c < NCH; c++) m += x[c][i]; m /= NCH; for (let c = 0; c < NCH; c++) x[c][i] -= m; }
  CH.forEach((ch, c) => { let tgt = 0; for (let k = 1; k <= KMAX; k++) tgt += psd[c][k] * DF; let v = 0; const s = x[c]; for (let i = 0; i < NB; i++) v += s[i] * s[i];
    const g = Math.sqrt(tgt / (v / NB || 1)); for (let i = 0; i < NB; i++) s[i] *= g; });
  return x;
}
function gen(key) {
  if (GEN[key]) return GEN[key];
  const cfg = COND[key], P = plan(key), r = rng(cfg.seed * 7 + 1), n = cfg.dur * FS, nb = NB;
  const bg = background(key, r);
  const x = bg.map(v => { if (n <= nb) return v.slice(0, n); const o = new Float32Array(n); for (let i = 0; i < n; i += nb) o.set(v.subarray(0, Math.min(nb, n - i)), i); return o; });
  /* artefacts and mains, re-referenced to the average (the background already is) */
  const ar = CH.map(() => new Float32Array(n));
  for (let i = 0; i < n; i++) { const mains = Math.sin(2 * Math.PI * 50 * i / FS); for (let c = 0; c < NCH; c++) ar[c][i] = mains * (c === CI.F4 ? 5 : 1.2); }
  for (const e of P.ev) {
    const i0 = Math.max(0, Math.floor((e.t - 0.05) * FS)), wv = wave(e);
    if (wv) { const { w, v } = wv; for (let i = 0; i < v.length && i0 + i < n; i++) for (let c = 0; c < NCH; c++) ar[c][i0 + i] += v[i] * w[c]; }
    if (e.k === 'move') { const L = e.d * FS, w = CH.map(() => U(r, 0.4, 1)); for (let i = 0; i < L && i0 + i < n; i++) { const t = i / FS, v = e.a * Math.sin(2 * Math.PI * 0.55 * t + 0.4) * Math.sin(Math.PI * i / L); for (let c = 0; c < NCH; c++) ar[c][i0 + i] += v * w[c] + (e.a > 100 ? 6 * gauss(r) : 0); } }
  }
  for (let i = 0; i < n; i++) { let m = 0; for (let c = 0; c < NCH; c++) m += ar[c][i]; m /= NCH; for (let c = 0; c < NCH; c++) x[c][i] += ar[c][i] - m; }
  return (GEN[key] = { x, n });
}
/* the cleaned signal: the events of every artefact component set for removal are taken out again (average
   referenced, as they went in); a removed brain component changes the Cleaning tab view only (mockup assumption) */
function subtractArts(key, out, n0, n1, arts) {
  if (!arts || !arts.size) return;
  plan(key).ev.forEach(e => { const a = artOf(e); if (!a || !arts.has(a)) return; const wv = wave(e); if (!wv) return; const { w, i0, v } = wv;
    if (i0 >= n1 || i0 + v.length <= n0) return; const wm = w.reduce((s, q) => s + q, 0) / NCH;
    for (let i = Math.max(0, n0 - i0); i < v.length && i0 + i < n1; i++) { const j = i0 + i - n0; for (let c = 0; c < NCH; c++) out[c][j] -= v[i] * (w[c] - wm); } });
}

/* ---------------- display: filters, montage, polarity (display only) ---------------- */
function biquad(x, [b0, b1, b2, a1, a2]) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; } }
function lpCoef(fc) { const w = 2 * Math.PI * fc / FS, c = Math.cos(w), al = Math.sin(w) / Math.SQRT2, a0 = 1 + al; return [(1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0, -2 * c / a0, (1 - al) / a0]; }
function notchCoef(f0, Q = 25) { const w = 2 * Math.PI * f0 / FS, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; return [1 / a0, -2 * c / a0, 1 / a0, -2 * c / a0, (1 - al) / a0]; }
function hp1(x, fc) { const rc = 1 / (2 * Math.PI * fc), a = rc / (rc + 1 / FS); let y = 0, xp = x[0]; for (let i = 0; i < x.length; i++) { const v = x[i]; y = a * (y + v - xp); xp = v; x[i] = y; } }
/* bipolar montages for display (review C14); the analysis reference stays the average of 19 channels */
const MONT = {
  long: [['Fp1', 'F7'], ['F7', 'T3'], ['T3', 'T5'], ['T5', 'O1'], ['Fp2', 'F8'], ['F8', 'T4'], ['T4', 'T6'], ['T6', 'O2'], ['Fp1', 'F3'], ['F3', 'C3'], ['C3', 'P3'], ['P3', 'O1'],
    ['Fp2', 'F4'], ['F4', 'C4'], ['C4', 'P4'], ['P4', 'O2'], ['Fz', 'Cz'], ['Cz', 'Pz']],
  trans: [['Fp1', 'Fp2'], ['F7', 'F3'], ['F3', 'Fz'], ['Fz', 'F4'], ['F4', 'F8'], ['T3', 'C3'], ['C3', 'Cz'], ['Cz', 'C4'], ['C4', 'T4'], ['T5', 'P3'], ['P3', 'Pz'], ['Pz', 'P4'], ['P4', 'T6'], ['O1', 'O2']],
};
const montRows = (m) => m === 'avg' || !MONT[m] ? CH.map(c => [c]) : MONT[m];
const rowLabel = (r) => r.length > 1 ? r[0] + '-' + r[1] : r[0];
/* one page of channels [t0, t0 + tb): raw or cleaned, filtered with a pre-roll of up to 4 s */
function pageData(key, t0, tb, o = {}) {
  const G = gen(key), n0 = Math.round(t0 * FS), n1 = Math.min(G.n, n0 + Math.round(tb * FS)), pre = Math.min(n0, 4 * FS);
  const f = { hp: o.hp ?? V.hp, lp: o.lp ?? V.lp, notch: o.notch ?? V.notch }, arts = (o.clean ?? V.clean) ? removedArts(key, o.removed) : null;
  const sl = G.x.map(ch => ch.slice(n0 - pre, n1)); subtractArts(key, sl, n0 - pre, n1, arts);
  return sl.map(s => { if (f.hp) hp1(s, f.hp); if (f.notch) biquad(s, notchCoef(50)); if (f.lp) biquad(s, lpCoef(f.lp)); return s.subarray(pre); });
}
const derive = (data, rows) => rows.map(r => { if (r.length === 1) return data[CI[r[0]]]; const a = data[CI[r[0]]], b = data[CI[r[1]]], o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; });
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
/* display state: polarity negative up by default (clinical convention, review C13) */
const V = { cond: 'EO', start: 0, tb: 10, gain: 10, hp: 0.5, lp: 35, notch: true, hover: null, mont: 'avg', neg: true, clean: false, exR: 'manual' };
const ySign = () => (V.neg ? 1 : -1);
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
  syncCase();
  const s = A.state.segments, keys = Object.keys(COND);
  if (!s.confirmed) s.changes = allChanges();
  s.analysed = Object.fromEntries(keys.map(k => [k, totals(k).an]));
  s.proposed = Object.fromEntries(keys.map(k => { const P = plan(k); return [k, Math.round(P.segs.reduce((a, g, i) => a + (P.prop[i] == null ? g.t1 - g.t0 : 0), 0))]; }));
}
/* excerpts the clinician adds to the report (review C12): A.state.excerpts = [{id, cond, start_s, seconds, at, by}] */
const exList = () => (A.state.excerpts = A.state.excerpts || []);
const exStart = () => Math.max(COND[V.cond].trim || 0, Math.min(V.start, COND[V.cond].dur - EXS));
const exHasExcl = (ex) => { const P = plan(ex.cond), S = segState(ex.cond); return P.segs.some((s, i) => S.cur[i] && s.t1 > ex.start_s && s.t0 < ex.start_s + ex.seconds); };

let L = null, drag = null, ro0 = null, keyH = null;

function drawTraces() {
  const cv = $('#aTr'); if (!cv) return;
  const box = cv.parentElement, W = Math.max(640, box.clientWidth - 24), key = V.cond, cfg = COND[key], P = plan(key), S = segState(key), rows = montRows(V.mont);
  const vc = key === 'VCPT', RUL = 18, BAND = 14, ML = vc ? 20 : 0, TOP = RUL + BAND + ML, ROW = 27, H = TOP + rows.length * ROW + 22, GUT = V.mont === 'avg' ? 44 : 66, PW = W - GUT - 56;
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
  /* excerpts chosen for the report: a lime bar under the ruler, brackets and a label at the bottom */
  exList().forEach((ex, j) => { if (ex.cond !== key || ex.start_s + ex.seconds <= t0 || ex.start_s >= t0 + tb) return;
    const xa = Math.max(GUT, x(ex.start_s)), xb = Math.min(GUT + PW, x(ex.start_s + ex.seconds)); g.fillStyle = '#96c11f'; g.fillRect(xa, RUL - 4, xb - xa, 4);
    g.fillStyle = 'rgba(150,193,31,0.08)'; g.fillRect(xa, TOP, xb - xa, H - TOP - 18);
    g.strokeStyle = '#7a9e12'; g.lineWidth = 1.2; [[ex.start_s, xa], [ex.start_s + ex.seconds, xb]].forEach(([t, xx]) => { if (t < t0 || t > t0 + tb) return; g.beginPath(); g.moveTo(crisp(xx), RUL - 4); g.lineTo(crisp(xx), H - 18); g.stroke(); }); g.lineWidth = 1;
    g.fillStyle = '#4d6409'; g.font = '600 10px IBM Plex Sans, sans-serif'; g.fillText(T('a.exMark', { n: j + 1 }), xa + 4, H - 6); });
  /* time ruler: 1 s grid */
  const lstep = tb <= 10 ? 1 : (tb <= 20 ? 2 : 5);
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.textAlign = 'center';
  for (let t = Math.ceil(t0); t <= t0 + tb + 1e-6; t++) {
    const xx = crisp(x(t)); g.strokeStyle = GRID; g.beginPath(); g.moveTo(xx, TOP); g.lineTo(xx, H); g.stroke();
    g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(xx, RUL - (t % lstep ? 3 : 6)); g.lineTo(xx, RUL); g.stroke();
    if (t % lstep === 0) { g.fillStyle = MUTED; g.fillText(fmt(t), Math.min(W - 18, Math.max(GUT + 14, xx)), 10); }
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
  /* traces: negative up by default (C13) */
  const data = derive(pageData(key, t0, tb), rows), k = PX_MM / V.gain * ySign(), n = data[0].length, dx = PW / (tb * FS);
  g.save(); g.beginPath(); g.rect(GUT, TOP, PW, H - TOP); g.clip();
  g.strokeStyle = INK; g.lineWidth = 0.9; g.lineJoin = 'round';
  data.forEach((s, c) => {
    const y0 = TOP + ROW * (c + 0.5); g.beginPath();
    for (let i = 0; i < n; i++) { const xx = GUT + i * dx, yy = y0 + s[i] * k; if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
    g.stroke();
  });
  g.restore();
  g.font = '500 11px IBM Plex Mono, monospace'; g.fillStyle = INK; g.textAlign = 'right';
  rows.forEach((r, i) => g.fillText(rowLabel(r), GUT - 8, TOP + ROW * (i + 0.5) + 4)); g.textAlign = 'left';
  g.strokeStyle = '#9aa2a9'; g.beginPath(); g.moveTo(crisp(GUT), RUL); g.lineTo(crisp(GUT), H); g.stroke();
  /* scale bar: 100 uV vertical, 1 s horizontal */
  calib(g, GUT + PW + 10, H - 13, 100 * Math.abs(k), PW / tb);
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
  exList().forEach(ex => { if (ex.cond !== key) return; g.fillStyle = '#96c11f'; g.fillRect(x(ex.start_s), 1, Math.max(2, x(ex.start_s + ex.seconds) - x(ex.start_s)), 4); });
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
function setExcl(i, ex) { const S = segState(V.cond), P = plan(V.cond); S.cur[i] = ex ? (P.prop[i] || V.exR || 'manual') : null; }
function status() {
  const el = $('#aStat'); if (!el) return;
  const P = plan(V.cond), i = V.hover, help = ro() ? T('a.stat.ro') : null;
  if (i == null) { el.innerHTML = `<span>${T('a.stat.page', { a: fmt(V.start), b: fmt(Math.min(COND[V.cond].dur, V.start + V.tb)), c: fmt(COND[V.cond].dur), p: Math.floor(V.start / V.tb) + 1, n: Math.ceil(COND[V.cond].dur / V.tb) })}</span><span>${help || T('a.stat.help')}</span>`; return; }
  const s = P.segs[i], rs = segState(V.cond).cur[i];
  el.innerHTML = `<span><b>${T('a.seg', { i: i + 1 })}</b> · ${fmt(s.t0)} ${T('to')} ${fmt(s.t1)} · ${rs ? T('a.stat.excl', { r: A.lc(rShort(rs)) }) : T('a.stat.incl')}${P.prop[i] ? T('a.stat.propEx', { r: A.lc(rLabel(P.prop[i])) }) : T('a.stat.propIn')}</span><span>${help || T(rs ? 'a.stat.clickIn' : 'a.stat.clickEx')}</span>`;
}
/* the bar below the viewer: analysis reference with a bipolar montage, cleaned view, the excerpt action */
function exBar() {
  const el = $('#aExBar'); if (!el) return;
  const n = removedSet(V.cond).size, s = exStart(), can = canRev() && !locked(), full = exList().length >= EX_MAX, dup = exList().some(e => e.cond === V.cond && e.start_s === s);
  el.innerHTML = `${V.mont !== 'avg' ? `<span class="chip device">${T('a.anaRef')}</span>` : ''}${V.clean ? `<span class="chip clinician" title="${A.esc(T('a.cleanedT'))}">${A.esc(T('a.cleanedN', { n, cond: T('condl.' + V.cond) }))}</span>` : ''}
    <span class="a-sp"></span>${can ? `<button class="btn sm" id="aExAdd" ${full || dup ? `disabled title="${A.esc(T(full ? 'a.exMax' : 'a.exDup', { n: EX_MAX }))}"` : ''}>${A.esc(T('a.exAdd', { a: fmt(s), b: fmt(s + EXS) }))}</button>${A.ann('Review C12: the clinician chooses the raw EEG excerpts of the report (8 s, cleaned, logged); none chosen leaves the block out (mockup assumption M42, at most 4)')}` : ''}`;
  const b = $('#aExAdd', el); if (b) b.onclick = () => addExcerpt();
}
function redraw() { drawTraces(); drawStrip(); status(); exBar(); }

function addExcerpt() {
  if (blocked()) return; const s = exStart(), list = exList();
  if (list.length >= EX_MAX) return A.toast(T('a.exMax', { n: EX_MAX }));
  if (list.some(e => e.cond === V.cond && e.start_s === s)) return A.toast(T('a.exDup'));
  const id = (list.reduce((m, e) => Math.max(m, e.id || 0), 0)) + 1;
  list.push({ id, cond: V.cond, start_s: s, seconds: EXS, at: A.time(), by: whoKey() });
  list.sort((a, b) => RECS.indexOf(a.cond) - RECS.indexOf(b.cond) || a.start_s - b.start_s);
  A.addLog('who.c1', 'a.log.exAdd', { cond: A.tk('condl.' + V.cond), a: fmt(s), b: fmt(s + EXS) }); A.toast(T('a.toast.exAdd'));
  redraw(); side();
}
function rmExcerpt(id) {
  if (blocked()) return; const list = exList(), ex = list.find(e => e.id === id); if (!ex) return;
  A.state.excerpts = list.filter(e => e.id !== id);
  A.addLog('who.c1', 'a.log.exRm', { cond: A.tk('condl.' + ex.cond), a: fmt(ex.start_s), b: fmt(ex.start_s + ex.seconds) }); redraw(); side();
}

function side() {
  exportSeg();
  const el = $('#aSide'); if (!el) return;
  const st = A.state.segments, ch = allChanges(), key = V.cond, P = plan(key), S = segState(key), cr = canRev(), lk = locked(), act = cr && !lk;
  const rows = Object.keys(COND).map(k => { const t = totals(k), ok = t.an >= MIN_S[k];
    return `<tr class="link" data-cond="${k}"><td>${T('cond.' + k)}${t.ch ? ` <span class="chip amber" title="${T('a.chgMan')}">${t.ch}</span>` : ''}</td><td class="num"><b>${t.an}</b> / ${t.rec} s</td><td class="num muted">${MIN_S[k]} s</td><td style="color:var(${ok ? '--ok' : '--warn'})" title="${T(ok ? 'a.aboveMin' : 'a.belowMin')}">${ok ? '✓' : T('a.short')}</td></tr>`; }).join('');
  const shortK = Object.keys(COND).filter(k => totals(k).an < MIN_S[k]), short = shortK.length > 0, allShort = shortK.length === Object.keys(COND).length;
  const ex = P.segs.map((s, i) => ({ s, i, rs: S.cur[i], pr: P.prop[i] })).filter(o => o.rs || o.pr);
  /* how each listed segment came about: "4 s · blink detector", "excluded by the clinician" or the proposal it differs from (C6) */
  const how = (o) => { const sec = Math.round(o.s.t1 - o.s.t0);
    if (o.rs && o.rs === o.pr) return T('a.byDet', { s: sec, d: T('a.det.' + o.pr) });
    if (o.rs && !o.pr) return T('a.byYou', { s: sec });
    return o.pr ? T('a.propEx2', { d: T('a.det.' + o.pr) }) : T('a.propIn2'); };
  const exs = exList();
  el.innerHTML = `${lockBanner('segments')}
    <div class="card"><div class="hd"><h2>${T('a.segments')} ${A.ann('3.4 Clinician in control, Working')}</h2>${ch ? `<span class="chip amber"><span class="d"></span>${T('a.chgManN', { n: ch })}</span>` : `<span class="chip device">${T('a.asProp')}</span>`}</div>
      <div class="scroll-x"><table class="tbl a-tot"><tr><th>${T('th.condition')}</th><th class="num">${T('th.analysed')}</th><th class="num">${T('a.min')} ${A.ann('Mockup assumption M25')}</th><th></th></tr>${rows}</table></div>
      <div class="bd" style="display:grid;gap:10px">
        <div class="row between"><h3>${T('a.excludedH', { cond: T('cond.' + key) })}</h3><span class="xs muted">${T('a.nOfSegs', { n: totals(key).ex, m: P.segs.length })}</span></div>
        ${act ? `<label class="small a-exr">${T('a.exAs')} <select id="aExR">${['manual', 'drowsy'].map(k => `<option value="${k}" ${V.exR === k ? 'selected' : ''}>${A.esc(rLabel(k))}</option>`).join('')}</select>${A.ann('Review C14: drowsiness as an exclusion reason; the detectors never propose it')}</label>` : ''}
        <div class="a-xl">${ex.length ? `<table class="tbl">${ex.map(o => `<tr class="link" data-jump="${o.i}"><td class="mono small">${fmt(o.s.t0)}</td><td><span class="a-sw" style="background:${o.rs ? REASON[o.rs].col : INCL_COL}"></span>${o.rs ? rLabel(o.rs) : T('a.included')}${(o.rs == null) !== (o.pr == null) ? ` <span class="chip amber">${T('a.changed')}</span>` : ''}<div class="xs muted">${A.esc(how(o))}</div></td>${act ? `<td class="num"><button class="btn sm" data-tog="${o.i}">${T(o.rs ? 'a.include' : 'a.exclude')}</button></td>` : ''}</tr>`).join('')}</table>` : `<div class="empty small">${T('a.noExcl')}</div>`}</div>
        <div class="a-legend">${Object.keys(REASON).map(k => `<span><i style="background:${REASON[k].col}"></i>${rLabel(k)}</span>`).join('')}<span><i style="background:${INCL_COL}"></i>${T('a.included')}</span></div>
        ${st.confirmed ? `<div class="banner ok a-ban"><b>${T('a.confirmed')}</b><span class="a-bmsg">${A.esc(T('a.confBy', { who: who(st.by), at: st.at, n: st.changes }))}</span></div>` : ''}
        ${short ? `<div class="banner warn small a-ban"><span class="a-bmsg">${allShort ? T('a.belowMinBan') : A.esc(T('a.belowMinSome', { list: shortK.map(k => T('cond.' + k)).join(', ') }))}</span>${A.ann('Mockup assumption: a condition below the minimum gives no results; the segments can be confirmed while at least one condition reaches its minimum (M25, M58)')}</div>` : ''}
        ${act ? `<div class="row between"><button class="btn" id="aReset" ${ch ? '' : 'disabled'}>${T('a.reset')}</button>
          ${st.confirmed ? `<button class="btn primary" id="aNext" data-nav>${T('a.reviewCln')}</button>` : `<button class="btn primary" id="aOk" ${allShort ? 'disabled' : ''}>${T('a.confirmSegs')}</button>`}</div>`
        : st.confirmed ? `<div class="row" style="justify-content:flex-end"><button class="btn" id="aNext" data-nav>${T('a.reviewCln')}</button></div>` : ''}
      </div></div>
    <div class="card"><div class="hd"><h3>${T('a.exTitle')}</h3><span class="xs muted">${T('a.exCount', { n: exs.length, m: EX_MAX })}</span></div>
      <div class="bd" style="display:grid;gap:8px">${exs.length ? `<table class="tbl a-ext">${exs.map(e => `<tr class="link" data-exj="${e.id}"><td>${T('cond.' + e.cond)}</td><td class="mono small">${fmt(e.start_s)} ${T('to')} ${fmt(e.start_s + e.seconds)}${exHasExcl(e) ? ` <span class="chip amber">${T('a.exExcl')}</span>` : ''}</td>${act ? `<td class="num"><button class="btn sm ghost" data-exrm="${e.id}">${T('a.exRm')}</button></td>` : ''}</tr>`).join('')}</table>` : `<div class="empty small">${T('a.exNone')}</div>`}
        <div class="xs muted">${A.esc(T('a.exNote', { s: EXS }))}</div></div></div>`;
  wireLock(el);
  $$('[data-cond]', el).forEach(r => r.onclick = () => selectCond(r.dataset.cond));
  $$('[data-jump]', el).forEach(r => r.onclick = (e) => { if (e.target.closest('[data-tog]')) return; const s = P.segs[+r.dataset.jump]; V.start = clampStart(Math.floor(s.t0 / V.tb) * V.tb); V.hover = +r.dataset.jump; redraw(); syncPager(); });
  $$('[data-exj]', el).forEach(r => r.onclick = (e) => { if (e.target.closest('[data-exrm]')) return; const x = exList().find(q => q.id === +r.dataset.exj); if (!x) return; if (x.cond !== V.cond) selectCond(x.cond); V.start = clampStart(Math.floor(x.start_s / V.tb) * V.tb); redraw(); syncPager(); });
  $$('[data-exrm]', el).forEach(b => b.onclick = () => rmExcerpt(+b.dataset.exrm));
  const xr = $('#aExR', el); if (xr) xr.onchange = () => { V.exR = xr.value; };
  $$('[data-tog]', el).forEach(b => b.onclick = () => { if (blocked()) return; const i = +b.dataset.tog, ex = !S.cur[i]; setExcl(i, ex);
    const r = ex && !P.prop[i] && S.cur[i] !== 'manual' ? S.cur[i] : null;
    A.addLog('who.c1', ex ? (r ? 'a.log.exclR' : 'a.log.excl') : 'a.log.incl', { i: i + 1, a: fmt(P.segs[i].t0), b: fmt(P.segs[i].t1), cond: A.tk('condl.' + key), r: r ? A.tk('a.r.' + r, null, { lc: true }) : '' }); afterEdit(); });
  const rs = $('#aReset', el); if (rs) rs.onclick = () => { if (blocked()) return; Object.keys(COND).forEach(k => { SEG[k] = { cur: plan(k).prop.slice() }; }); A.addLog('who.c1', 'a.log.reset'); A.toast(T('a.toast.reset')); afterEdit(); };
  const ok = $('#aOk', el); if (ok) ok.onclick = () => {
    if (blocked()) return;
    const analysed = Object.fromEntries(Object.keys(COND).map(k => [k, totals(k).an]));
    A.state.segments = Object.assign(A.state.segments, { confirmed: true, changes: ch, analysed, at: A.time(), by: whoKey() });
    A.addLog('who.c1', 'a.log.confirm', { eo: analysed.EO, ec: analysed.EC, v: analysed.VCPT, n: ch });
    A.toast(T(ch ? 'a.toast.confChg' : 'a.toast.conf'));
    A.refresh();
  };
  const nx = $('#aNext', el); if (nx) nx.onclick = () => A.go('cleaning');
}
function afterEdit() {
  const re = A.reopenAfter ? A.reopenAfter('segments') : [];
  /* a segment change refits the ICA of every recording: each recording's acceptance is open again */
  const c = cs(); let anyRec = false; RECS.forEach(r => { if (c.rec[r].confirmed) { c.rec[r].confirmed = false; anyRec = true; } });
  if (anyRec) { c.confirmed = false; pushState(); }
  if (A.state.segments.confirmed) { A.state.segments.confirmed = false; A.toast(T('a.toast.segAgain')); A.refresh(); return; }
  if (re.length || anyRec) { A.refresh(); return; }
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
.a-side { display: grid; gap: 14px; min-width: 0; }
.a-pg { margin-left: auto; display: inline-flex; gap: 4px; align-items: center; }
.a-box { overflow-x: auto; padding: 10px 12px 0; }
.a-box canvas { display: block; border-radius: 4px; touch-action: none; }
#aTr { cursor: pointer; } .a-ro #aTr { cursor: default; }
.a-lock { margin-bottom: 12px; flex-wrap: wrap; }
.a-ban { flex-wrap: wrap; } .banner .a-bmsg { flex: 1 1 220px; min-width: 0; }
#aStrip { cursor: ew-resize; }
.a-stat { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding: 6px 12px 2px; font-size: 12px; color: var(--muted); }
.a-stat b { color: var(--ink); font-weight: 600; }
.a-exbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; padding: 4px 12px 10px; min-height: 30px; }
.a-exbar .btn { white-space: normal; text-align: left; } .a-sp { flex: 1; }
.a-exr { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; color: var(--muted); } .a-exr select { font-size: 12px; }
.a-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 11.5px; color: var(--muted); }
.a-legend i, .a-sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; }
.a-xl { max-height: 300px; overflow: auto; border: 1px solid var(--line); border-radius: 6px; }
.a-xl .tbl td { padding: 5px 8px; } .a-xl .tbl tr:last-child td { border-bottom: 0; }
.a-ext td { padding: 5px 8px; } .a-ext tr:last-child td { border-bottom: 0; }
.a-tot td, .a-tot th { padding: 6px 8px; white-space: nowrap; }
.a-ttl { display: flex; align-items: baseline; gap: 8px 10px; flex-wrap: wrap; }
.a-ttl h2 { margin: 0; }
.a-spec { background: transparent; border: 1px dashed var(--line-2); color: var(--ink-2); }
.a-todo { background: transparent; border: 1px solid var(--amber); color: var(--ink); } .a-clk { color: var(--amber); margin-right: 4px; }
.a-chd .hd { flex-wrap: wrap; gap: 8px; }
.a-rtb { flex-wrap: wrap; border-radius: 0; border-left: 0; border-right: 0; }
.a-rtb .seg button small { font-size: 11px; }
.a-cbd { display: grid; gap: 10px; }
.a-acts { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.a-acts .a-sp { flex: 1 1 20px; }
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
.a-ic label, .a-ic .st { font-size: 11.5px; display: flex; gap: 5px; align-items: center; cursor: pointer; }
.a-ic .st { cursor: default; color: var(--muted); }
.a-ic.rm label, .a-ic.rm .st { color: var(--warn); font-weight: 600; }
.a-ic .chg { font-size: 11px; font-weight: 600; color: var(--amber); font-family: var(--f-ui); }
.a-det { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: start; }
@media (max-width: 560px) { .a-det { grid-template-columns: minmax(0, 1fr); } }
.a-fig { padding: 8px; }
.a-fig h4 { font-size: 12px; color: #55554f; font-weight: 600; margin: 0 0 4px; }
.a-pbs { display: grid; gap: 3px; max-width: 360px; }
.a-pb { display: grid; grid-template-columns: 150px minmax(0, 1fr) 36px; gap: 8px; align-items: center; font-size: 11.5px; color: var(--muted); }
.a-pb i { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; display: block; position: relative; }
.a-pb i u { position: absolute; left: 90%; top: -1px; bottom: -1px; width: 1.5px; background: var(--ink-2); }
.a-pb b { display: block; height: 100%; background: var(--muted); border-radius: 3px; }
.a-pb.top { color: var(--ink); font-weight: 600; } .a-pb.top b { background: var(--accent); }
.a-pb .num { text-align: right; }
.a-tcs button { padding: 2px 8px; font-size: 11.5px; }
.a-ba-leg { display: inline-flex; gap: 12px; font-size: 12px; color: var(--muted); align-items: center; flex-wrap: wrap; }
.a-ba-leg i { display: inline-block; width: 16px; height: 2px; vertical-align: 3px; margin-right: 5px; }
`);

window.Modules.segments = {
  render(root) {
    syncCase();
    if (!A.state.segments.confirmed) A.state.segments.changes = allChanges();
    const opt = (v, cur, l) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`;
    root.innerHTML = `<div class="a-seg${ro() ? ' a-ro' : ''}">
      <div class="card">
        <div class="toolbar" role="toolbar" aria-label="${T('a.viewer')}">
          <div class="seg" id="aCond">${Object.keys(COND).map(k => `<button data-k="${k}" class="${V.cond === k ? 'on' : ''}">${T('cond.' + k)}</button>`).join('')}</div>
          <span class="sep"></span>
          <label>${T('a.montage')} <select id="aMont">${['avg', 'long', 'trans'].map(k => opt(k, V.mont, T('a.mont.' + k))).join('')}</select></label>
          <label>${T('a.pol')} <select id="aPol">${opt('neg', V.neg ? 'neg' : 'pos', T('a.negUp'))}${opt('pos', V.neg ? 'neg' : 'pos', T('a.posUp'))}</select></label>
          <label>${T('a.gain')} <select id="aGain">${[3, 5, 7, 10, 15, 20, 30, 50].map(v => `<option value="${v}" ${v === V.gain ? 'selected' : ''}>${v} µV/mm</option>`).join('')}</select></label>
          <div class="seg" id="aTb" aria-label="${T('a.timebase')}">${[10, 20, 30].map(v => `<button data-v="${v}" class="${V.tb === v ? 'on' : ''}">${v} s</button>`).join('')}</div>
          <span class="sep"></span>
          <label>${T('a.hp')} <select id="aHp">${[[0, T('a.off')], [0.5, A.nf(0.5) + ' Hz'], [1, '1 Hz'], [1.6, A.nf(1.6) + ' Hz']].map(([v, l]) => opt(v, V.hp, l)).join('')}</select></label>
          <label>${T('a.lp')} <select id="aLp">${[[0, T('a.off')], [15, '15 Hz'], [30, '30 Hz'], [35, '35 Hz'], [45, '45 Hz']].map(([v, l]) => opt(v, V.lp, l)).join('')}</select></label>
          <label><input type="checkbox" id="aNotch" ${V.notch ? 'checked' : ''}> ${T('a.notch')}</label>
          <div class="seg" id="aSig" role="group" aria-label="${T('a.sigAria')}" title="${A.esc(T('a.cleanedT'))}"><button data-s="raw" class="${V.clean ? '' : 'on'}">${T('a.raw')}</button><button data-s="clean" class="${V.clean ? 'on' : ''}">${T('a.cleaned')}</button></div>
          <span class="xs muted" title="${T('a.dispOnlyT')}">${T('a.dispOnly')}</span>${A.ann('Review C13: negative up by default, as in clinical EEG; C14: bipolar montages for display only; B3: raw or cleaned signal of the whole recording')}
          <span class="a-pg"><button class="btn sm" id="aPrev" aria-label="${T('a.prev')}">◀</button><button class="btn sm" id="aNextP" aria-label="${T('a.next')}">▶</button></span>
        </div>
        <div class="a-box paper" style="border:0;border-radius:0;background:var(--paper)"><canvas id="aTr" aria-label="${T('a.tracesAria')}"></canvas><canvas id="aStrip" data-nav style="margin-top:6px" aria-label="${T('a.stripAria')}"></canvas></div>
        <div class="a-stat" id="aStat"></div>
        <div class="a-exbar" id="aExBar"></div>
      </div>
      <div id="aSide" class="a-side"></div>
    </div>`;
    $$('#aCond button', root).forEach(b => b.onclick = () => selectCond(b.dataset.k));
    $('#aMont', root).onchange = e => { V.mont = e.target.value; redraw(); };
    $('#aPol', root).onchange = e => { V.neg = e.target.value === 'neg'; drawTraces(); };
    $('#aGain', root).onchange = e => { V.gain = +e.target.value; drawTraces(); };
    $$('#aTb button', root).forEach(b => b.onclick = () => { V.tb = +b.dataset.v; V.start = clampStart(Math.floor(V.start / V.tb) * V.tb); $$('#aTb button').forEach(x => x.classList.toggle('on', x === b)); redraw(); syncPager(); });
    $('#aHp', root).onchange = e => { V.hp = +e.target.value; drawTraces(); };
    $('#aLp', root).onchange = e => { V.lp = +e.target.value; drawTraces(); };
    $('#aNotch', root).onchange = e => { V.notch = e.target.checked; drawTraces(); };
    $$('#aSig button', root).forEach(b => b.onclick = () => { V.clean = b.dataset.s === 'clean'; $$('#aSig button').forEach(x => x.classList.toggle('on', x === b)); redraw(); });
    $('#aPrev', root).onclick = () => page(-1); $('#aNextP', root).onclick = () => page(1);
    const tr = $('#aTr', root), strip = $('#aStrip', root);
    tr.onpointerdown = e => {
      const i = segAt(e.offsetX); if (i == null) return;
      if (blocked()) return;
      const ex = !segState(V.cond).cur[i]; drag = { ex, seen: new Set([i]) }; setExcl(i, ex); tr.setPointerCapture(e.pointerId); redraw();
    };
    tr.onpointermove = e => {
      const i = segAt(e.offsetX);
      if (drag && i != null && !drag.seen.has(i)) { drag.seen.add(i); setExcl(i, drag.ex); V.hover = i; redraw(); return; }
      if (i !== V.hover) { V.hover = i; drawTraces(); status(); }
    };
    tr.onpointerup = () => {
      if (!drag) return; const ids = [...drag.seen].sort((a, b) => a - b), P = plan(V.cond), r = drag.ex ? V.exR : null, rn = r && r !== 'manual' && ids.every(i => !P.prop[i]);
      A.addLog('who.c1', (drag.ex ? 'a.log.excl' : 'a.log.incl') + (ids.length > 1 ? 'N' : '') + (rn ? 'R' : ''), { i: ids[0] + 1, j: ids[ids.length - 1] + 1, a: fmt(P.segs[ids[0]].t0), b: fmt(P.segs[ids[ids.length - 1]].t1), cond: A.tk('condl.' + V.cond), r: rn ? A.tk('a.r.' + r, null, { lc: true }) : '' });
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
    ro0 = new ResizeObserver(() => redraw()); ro0.observe($('.a-box', root));
    side(); redraw(); syncPager();
  },
  destroy() { if (keyH) window.removeEventListener('keydown', keyH); keyH = null; if (ro0) ro0.disconnect(); ro0 = null; drag = null; L = null; },
};

/* ================================ Cleaning tab ================================ */
/* the proposal of eyes open comes from the data: {ic, kind, ref_map, corr} (ref_map: the reference map the
   component matches, corr: its r); the older shape {ic, kind, confidence} is tolerated, then the page
   computes the match itself. Eyes closed and VCPT: the same rule applied here to their own components. */
const REF = { blink: 'blink', eye_h: 'hem', muscle_l: 'emgL', muscle_r: 'emgR', muscle_f: 'emgF', amplifier: 'amp' };
const REFK = Object.fromEntries(Object.entries(REF).map(([a, b]) => [b, a]));
/* Legacy artefact correction (ACM), kept by proposed ADR 0003: infomax ICA, then the map of every
   component is correlated with six average-reference reference maps and removed when r reaches 0.9
   (audit 41, steps C17 to C19; values from TopoInitFunction.m as printed there, channel order Fp1 to O2
   as CH). The absolute r is shown and tested, because ICA polarity is arbitrary, as in the fixed legacy
   reference build (L9). 19 channels under the average reference have rank 18, so there are 18 components. */
const TPL = [
  ['blink', [-1.182095, -1.277981, -0.225844, -0.12106, -0.081556, -0.091781, -0.166208, 0.119132, 0.169698, 0.26221, 0.223327, 0.167408, 0.245917, 0.280757, 0.302997, 0.329003, 0.30547, 0.355383, 0.38487]],
  ['hem', [0.362474, -0.430956, 1.293173, 0.32436, -0.039138, -0.321833, -1.26953, 0.456407, 0.183937, 0.048133, -0.163055, -0.457207, 0.124449, 0.063163, -0.021049, -0.049999, -0.12562, 0.013985, 0.00826]],
  ['emgL', [0.056904, 0.040172, 0.074026, -0.106101, -0.215082, -0.169056, -0.015198, 2.08411, -0.128434, -0.261222, -0.212915, 0.018141, -0.055733, -0.186, -0.275969, -0.221394, -0.109775, -0.161796, -0.15488]],
  ['emgR', [0.079445, 0.122302, 0.016304, -0.195592, -0.208694, -0.125629, 0.110543, 0.034944, -0.24626, -0.323969, -0.146037, 2.043434, -0.12373, -0.242321, -0.262249, -0.212634, 0.012778, -0.163416, -0.16929]],
  ['emgF', [1.430344, -1.495044, -0.1139, -0.088871, -0.181333, -0.135207, -0.20483, 0.024464, 0.042871, 0.186607, 0.077214, -0.015057, 0.067687, 0.072701, 0.066808, 0.105824, 0.045391, 0.053659, 0.060397]],
  ['amp', [-0.457547, 0.237412, -0.371757, -0.479052, -0.529151, 0.37329, 0.343588, -0.384897, -0.365014, 0.772469, 0.632341, 0.479499, -0.392552, -0.48905, -0.564778, 0.608813, 0.560077, -0.405489, 0.431894]],
];
const R_MIN = 0.9;
const corr = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let s = 0, sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
const om = (seed) => { const r = rng(seed * 131); const a = bm(U(r, -0.8, 0.8), U(r, -0.8, 0.8), U(r, 0.5, 0.8), [U(r, -1, 1), U(r, -1, 1), 0], 0.35), b = bm(U(r, -0.8, 0.8), U(r, -0.8, 0.8), 0.7, [0, 0, 0], 0.3);
  return n1(a.map((v, i) => v - 0.7 * b[i] + 0.28 * gauss(r))); };
/* components per recording: [ic, label key, activation type, forward map, target % of variance, artefact kind].
   Eyes open keeps its order (the proposal in the data names its numbers); eyes closed and VCPT are numbered
   by the explained variance of their activations. Eyes open lists 19, the data say how many there are (18). */
const SPEC = {
  EO: [[1, 'blink', 'blink', FW.blink, 36.8, 'blink'], [2, 'hem', 'hem', FW.hem, 13.1, 'hem'], [3, 'alpha', 'alpha', FW.alpha, 9.4], [4, 'poR', 'alpha', FW.poR, 6.2],
    [5, 'fmid', 'theta', FW.fmid, 4.6], [6, 'musL', 'muscle', FW.musL, 4.1, 'musL'], [7, 'muL', 'mu', FW.muL, 3.6], [8, 'muR', 'mu', FW.muR, 3.2], [9, 'pop', 'pop', FW.pop, 2.8, 'pop'],
    [10, 'occL', 'alpha2', FW.occL, 2.5], [11, 'parM', 'brain', FW.parM, 2.2], [12, 'tempR', 'brain', FW.tempR, 2.0], [13, 'frL', 'brain', FW.frL, 1.8], [14, 'none', 'other', om(14), 1.6],
    [15, 'cenM', 'brain', FW.cenM, 1.5], [16, 'none', 'other', om(16), 1.4], [17, 'frR', 'brain', FW.frR, 1.2], [18, 'none', 'other', om(18), 1.1], [19, 'none', 'other', om(19), 0.9]],
  EC: [[1, 'alpha', 'alpha', FW.alpha, 22], [2, 'poR', 'alpha', FW.poR, 11], [3, 'hem', 'hem', FW.hem, 9.5, 'hem'], [4, 'occL', 'alpha2', FW.occL, 7], [5, 'fmid', 'theta', FW.fmid, 5.5],
    [6, 'muL', 'mu', FW.muL, 4.8], [7, 'musL', 'muscle', FW.musL, 4.4, 'musL'], [8, 'muR', 'mu', FW.muR, 4.0], [9, 'pop', 'pop', FW.pop, 3.4, 'pop'], [10, 'parM', 'brain', FW.parM, 3.0],
    [11, 'tempR', 'brain', FW.tempR, 2.6], [12, 'frL', 'brain', FW.frL, 2.3], [13, 'none', 'other', om(33), 2.0], [14, 'cenM', 'brain', FW.cenM, 1.9], [15, 'none', 'other', om(35), 1.7],
    [16, 'frR', 'brain', FW.frR, 1.5], [17, 'none', 'other', om(37), 1.3], [18, 'none', 'other', om(38), 1.1]],
  VCPT: [[1, 'blink', 'blink', FW.blink, 30, 'blink'], [2, 'hem', 'hem', FW.hem, 11, 'hem'], [3, 'alpha', 'alpha', FW.alpha, 8], [4, 'fmid', 'theta', FW.fmid, 6.5],
    [5, 'musR', 'muscle', FW.musR, 5, 'musR'], [6, 'muL', 'mu', FW.muL, 4.5], [7, 'poR', 'alpha', FW.poR, 4], [8, 'muR', 'mu', FW.muR, 3.8], [9, 'pop', 'pop', FW.pop, 3.0, 'pop'],
    [10, 'occL', 'alpha2', FW.occL, 2.6], [11, 'parM', 'brain', FW.parM, 2.4], [12, 'tempR', 'brain', FW.tempR, 2.1], [13, 'frL', 'brain', FW.frL, 1.9], [14, 'none', 'other', om(54), 1.7],
    [15, 'cenM', 'brain', FW.cenM, 1.5], [16, 'none', 'other', om(56), 1.3], [17, 'frR', 'brain', FW.frR, 1.2], [18, 'none', 'other', om(58), 1.0]],
};
const dataIca = () => ((A.m2.quality || {}).ica || {});
const nComp = (rec) => rec === 'EO' ? Math.min(SPEC.EO.length, dataIca().n_components || 18) : 18;
const variance = (s) => { let m = 0, q = 0; for (let i = 0; i < s.length; i++) m += s[i]; m /= s.length; for (let i = 0; i < s.length; i++) q += (s[i] - m) ** 2; return q / s.length; };
/* the ICA model of one recording: components with maps, template matches, proposal and 20 s of activation */
function model(rec) {
  const PCc = PC(); if (PCc.ICM[rec]) return PCc.ICM[rec];
  const ri = RECS.indexOf(rec), r = rng(6060 + 101 * ri), off = OFF[rec], EC = rec === 'EC', o0 = off * FS;
  const evs = plan(rec).ev.filter(e => e.t >= off - 1 && e.t < off + CW);
  const dprop = rec === 'EO' ? (dataIca().proposed_removed || []) : null;
  /* artefact activations (uV at the map maximum): the same events as in the raw recording;
     blinks at 62.5 percent: the component view keeps its variance shares while the raw view shows blinks of 130 to 190 uV */
  const fromEv = (art) => { const s = new Float32Array(CN), g = art === 'blink' ? 0.625 : 1;
    evs.forEach(e => { if (artOf(e) !== art) return; const wv = wave(e); for (let i = 0; i < wv.v.length; i++) { const j = wv.i0 - o0 + i; if (j >= 0 && j < CN) s[j] += g * wv.v[i]; } }); return s; };
  const add = (s, f, k) => { for (let i = 0; i < CN; i++) s[i] += k * f(i); return s; };
  /* brain activations with unit scale; oscillations wax and wane in spindles */
  const osc = (f, base, harm) => { const s = new Float32Array(CN), env = slow(r, 0.35), jit = slow(r, 0.3), pk = pink(r); let ph = U(r, 0, 6);
    for (let i = 0; i < CN; i++) { ph += 2 * Math.PI * (f + 0.25 * jit()) / FS; const e = Math.max(0, base + 0.6 * env()) ** 1.6; s[i] = e * (Math.sin(ph) + harm * Math.sin(2 * ph + 0.6)) + 0.2 * pk(); } return s; };
  const act = (d) => {
    switch (d.type) {
      case 'blink': { const s = EC ? new Float32Array(CN) : fromEv('blink'), dr = slow(r, 0.4); return add(s, () => dr(), EC ? 4 : 2); }
      case 'hem': { const s = fromEv('hem'), dr = slow(r, 0.2); return add(s, () => dr(), 1.5); }
      case 'muscle': { const s = fromEv(d.art), w = new Float32Array(CN); const pk = pink(r); for (let i = 0; i < CN; i++) w[i] = gauss(r); biquad(w, hpCoef(26)); biquad(w, hpCoef(26)); return add(s, (i) => 3 * w[i] + 0.8 * pk(), 1); }
      case 'pop': { const s = fromEv('pop'), dr = slow(r, 0.08); return add(s, (i) => 3.1 * gauss(r) + 2 * dr(), 1); }
      case 'alpha': return osc(9 + U(r, -0.2, 0.2), EC ? 0.75 : 0.3, 0.08).map(v => v * (EC ? 1.8 : 1));
      case 'alpha2': return osc(9.6, EC ? 0.6 : 0.1, 0.05).map(v => v * (EC ? 1.6 : 1));
      case 'theta': return osc(6.1, rec === 'VCPT' ? 0.1 : -0.05, 0);
      case 'mu': return osc(10.6, 0.25, 0.38);
      case 'other': { const s = new Float32Array(CN), pk = pink(r); for (let i = 0; i < CN; i++) s[i] = 0.7 * gauss(r) + 0.6 * pk(); return s; }
      default: { const s = new Float32Array(CN), pk = pink(r), b = osc(U(r, 15, 22), -0.1, 0); for (let i = 0; i < CN; i++) s[i] = pk() + 0.35 * b[i]; return s; }
    }
  };
  let comps = SPEC[rec].slice(0, nComp(rec)).map(([ic, lk, type, fw, target, art]) => { const w = avgref(fw), ss = w.reduce((a, v) => a + v * v, 0); return { ic, lk, type, fw, target, art: art || null, w, ss }; });
  comps.forEach(c => { c.s = act(c); });
  /* artefacts carry their own amplitude (uV); brain and other components are scaled to their share */
  const arts = comps.filter(c => ['blink', 'hem', 'muscle', 'pop'].includes(c.type));
  const VV = arts.reduce((a, c) => a + variance(c.s) * c.ss, 0) / arts.reduce((a, c) => a + c.target / 100, 0);
  comps.forEach(c => { if (arts.includes(c)) return; const k = Math.sqrt(c.target / 100 * VV / (variance(c.s) * c.ss)); c.s = c.s.map(v => v * k); });
  /* explained variance from the activations, rounded to 0.1 with the largest remainder so the column sums to 100 */
  const pv = comps.map(c => variance(c.s) * c.ss), tot = pv.reduce((a, b) => a + b, 0), raw = pv.map(v => v / tot * 1000), fl = raw.map(Math.floor);
  let left = 1000 - fl.reduce((a, b) => a + b, 0); raw.map((v, j) => [v - fl[j], j]).sort((a, b) => b[0] - a[0]).forEach(([, j]) => { if (left > 0) { fl[j]++; left--; } });
  comps.forEach((c, j) => { c.var = fl[j] / 10; c.pv = pv[j]; });
  if (rec !== 'EO') { comps = comps.slice().sort((a, b) => b.pv - a.pv); comps.forEach((c, j) => { c.ic = j + 1; }); }
  comps.forEach(c => {
    /* map shown normalised, largest value positive (polarity is arbitrary in ICA) */
    const mx = c.w.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0); c.map = c.w.map(v => v / mx); c.peak = Math.abs(mx); c.sign = Math.sign(mx);
    const pr = dprop && dprop.find(x => x.ic === c.ic), ref = pr && REF[pr.ref_map];
    c.rs = TPL.map(([k, t]) => ({ k, r: ref === k && typeof pr.corr === 'number' ? Math.abs(pr.corr) : Math.abs(corr(c.w, t)) }));
    c.best = c.rs.reduce((a, b) => (b.r > a.r ? b : a));
    c.prop = dprop ? !!pr : c.best.r >= R_MIN;
    c.ref_map = pr && pr.ref_map ? pr.ref_map : (c.prop && c.best.r >= R_MIN ? REFK[c.best.k] : 'none');
    c.kind = T('a.icl.' + c.lk, null, 'en').toLowerCase();
  });
  return (PCc.ICM[rec] = { comps, off });
}
const comp = (rec, ic) => model(rec).comps.find(c => c.ic === ic);
const propSet = (rec) => new Set(model(rec).comps.filter(c => c.prop).map(c => c.ic));
/* the components set for removal, per recording: the clinician's choice, kept in APP.state.cleaning.rec */
function removedSet(rec) {
  const PCc = PC(), Cc = PCc.C; if (Cc.removed[rec]) return Cc.removed[rec];
  const st = ((A.state.cleaning || {}).rec || {})[rec];
  return (Cc.removed[rec] = new Set(st && Array.isArray(st.removed) ? st.removed : [...propSet(rec)]));
}
const removedArts = (rec, list) => { const set = list ? new Set(list) : removedSet(rec); return new Set(model(rec).comps.filter(c => set.has(c.ic) && c.art).map(c => c.art)); };
const changes = (rec) => { const P = propSet(rec), S = removedSet(rec); return model(rec).comps.filter(c => S.has(c.ic) !== P.has(c.ic)).map(c => ({ rec, ic: c.ic, kind: c.kind, ref_map: S.has(c.ic) ? 'none' : c.ref_map, removed: S.has(c.ic) })); };
/* the recordings whose cleaning the report needs: those with results (a condition below the minimum gives none, B6) */
const reqRecs = () => RECS.filter(r => ((A.m2.quality || {}).recordings || {})[r] && !(A.m2.results_missing || {})[r]);
/* the cleaning state, kept compatible: confirmed = every needed recording accepted; rec[EO|EC|VCPT] =
   {confirmed, at, by, removed, changed, k, n}; changed = the changes of every recording (each with rec);
   removedCount, pendingK and setForRemoval = eyes open, whose proposal is in the data */
function cs() {
  const c = A.state.cleaning || (A.state.cleaning = { confirmed: false, changed: [] }), req = reqRecs();
  if (!c.rec) c.rec = {};
  RECS.forEach(r => { if (!c.rec[r]) c.rec[r] = { confirmed: !!c.confirmed, at: c.at || null, by: c.by || null }; });
  /* the shell reset the cleaning (a segment change, an undone rejection): every recording is open again */
  if (!c.confirmed && req.length && req.every(r => c.rec[r].confirmed)) req.forEach(r => { c.rec[r].confirmed = false; });
  /* set as confirmed from outside: every recording counts as accepted */
  if (c.confirmed && req.some(r => !c.rec[r].confirmed)) req.forEach(r => { c.rec[r].confirmed = true; });
  return c;
}
function pushState() {
  const c = cs();
  RECS.forEach(r => { const st = c.rec[r], set = removedSet(r); st.removed = [...set].sort((a, b) => a - b); st.k = set.size; st.n = nComp(r); st.changed = changes(r); });
  c.changed = reqRecs().flatMap(r => c.rec[r].changed);
  c.removedCount = c.pendingK = c.setForRemoval = c.rec.EO.k;
}
/* ---------------- cleaning sentences (textlib.ica_sentence), one per recording ----------------
   Q-ICA-AUTO-1, Q-ICA-MAN-1 (kept against the proposal), Q-ICA-MAN-2 (removed against it), Q-ICA-MAN-3 (a list),
   Q-ICA-PEND-1 while the recording is not accepted. When the library has the recording-named variants (Q-ICA-AUTO-2,
   MAN-4, MAN-5, MAN-6, PEND-2 with {cond}) they are used; otherwise the plain ids, each after its recording's duration sentence */
const tplOf = (k, L, id) => { const d = A.data[k] || {}; return (d[L] || {})[id] ?? (d.en || {})[id] ?? null; };
const fillT = (t, p) => String(t).replace(/\{(\w+)\}/g, (m, k) => (p && p[k] != null ? p[k] : m));
const part = (L, id, p) => fillT(tplOf('choice_parts', L, id) ?? id, p);
const say = (L, id, p) => { const t = tplOf('choice_sentences', L, id) ?? id, x = fillT(t, p); return { id, text: t[0] === '{' ? x.charAt(0).toUpperCase() + x.slice(1) : x }; };
const VAR = { 'Q-ICA-AUTO-1': 'Q-ICA-AUTO-2', 'Q-ICA-MAN-1': 'Q-ICA-MAN-4', 'Q-ICA-MAN-2': 'Q-ICA-MAN-5', 'Q-ICA-MAN-3': 'Q-ICA-MAN-6', 'Q-ICA-PEND-1': 'Q-ICA-PEND-2' };
const named = (L) => tplOf('choice_sentences', L, 'Q-ICA-AUTO-2') != null;
function icaSentence(L, rec) {
  L = L || A.lang; const c = cs(), st = c.rec[rec], ch = changes(rec), k = removedSet(rec).size, n = nComp(rec), nm = named(L);
  const id = (b) => (nm ? VAR[b] : b), P = (p) => (nm ? { cond: T('condl.' + rec, null, L), ...p } : p);
  const kind = (x) => tplOf('choice_parts', L, 'ica.kind.' + x.ref_map) != null ? part(L, 'ica.kind.' + x.ref_map) : part(L, 'ica.kind.none');
  let s;
  if (!st.confirmed) s = say(L, id('Q-ICA-PEND-1'), P({ k, n }));
  else if (!ch.length) s = say(L, id('Q-ICA-AUTO-1'), P({ k, n }));
  else if (ch.length === 1) s = say(L, id(ch[0].removed ? 'Q-ICA-MAN-2' : 'Q-ICA-MAN-1'), P({ ic: ch[0].ic, kind: kind(ch[0]), k, n }));
  else s = say(L, id('Q-ICA-MAN-3'), P({ list: ch.slice().sort((a, b) => a.ic - b.ic).map(x => part(L, x.removed ? 'ica.removed' : 'ica.kept', { ic: x.ic, kind: kind(x) })).join(part(L, 'ica_sep')), k, n }));
  return { ...s, cond: rec };
}
const cleaningSentences = (L) => { syncCase(); return reqRecs().map(r => icaSentence(L || A.lang, r)); };
/* the quality sentences with the cleaning sentences in place: after each recording's duration sentence
   (Q-DUR-1 or Q-MIN-1, in the order of quality.recordings), or at the end when they name their recording */
function withCleaning(base, L) {
  const ica = cleaningSentences(L), list = (base || []).filter(s => !/^Q-ICA/.test(s.id));
  if (named(L || A.lang)) return list.concat(ica);
  const order = Object.keys(A.m2.quality.recordings || {}), out = []; let i = 0;
  list.forEach(s => { out.push(s); if (s.id === 'Q-DUR-1' || s.id === 'Q-MIN-1' || s.id === 'Q-SEG-MAN-1') { const r = order[i++], x = ica.find(q => q.cond === r); if (x) out.push(x); } });
  ica.forEach(x => { if (!out.includes(x)) out.push(x); });
  return out;
}

/* ---------------- excerpts for the report (review C12): cleaned, average reference, negative up ---------------- */
function excerptSVG(ex, o = {}) {
  syncCase(); const W = o.w || 680, rows = CH.map(c => [c]), RH = o.rowH || 16, top = 6, GUT = 34, PW = W - GUT - 44, H = top + rows.length * RH + 24, sp = 50;
  const d = pageData(ex.cond, ex.start_s, ex.seconds, { hp: 0.5, lp: 35, notch: true, clean: true, removed: o.removed }), n = d[0].length, dec = Math.max(1, Math.round(n / PW / 0.75));
  const k = RH / sp, x = (i) => GUT + i / n * PW;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="IBM Plex Sans, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#fff"/>`;
  for (let t = 0; t <= ex.seconds; t++) { const xx = (GUT + t / ex.seconds * PW).toFixed(1); s += `<line x1="${xx}" y1="${top}" x2="${xx}" y2="${H - 18}" stroke="#e6e8ea" stroke-width="0.6"/><text x="${xx}" y="${H - 6}" font-size="9" fill="#55554f" text-anchor="middle">${fmt(ex.start_s + t)}</text>`; }
  d.forEach((ch, c) => { const y0 = top + RH * (c + 0.5); let pts = ''; for (let i = 0; i < n; i += dec) pts += x(i).toFixed(1) + ',' + (y0 + ch[i] * k).toFixed(1) + ' ';
    s += `<text x="${GUT - 5}" y="${(y0 + 3).toFixed(1)}" font-size="9" fill="#1c2a36" text-anchor="end">${rowLabel(rows[c])}</text><polyline points="${pts.trim()}" fill="none" stroke="#1c2a36" stroke-width="0.7" stroke-linejoin="round"/>`; });
  const bx = GUT + PW + 12, by = H - 20, bh = 100 * k, bw = PW / ex.seconds;
  s += `<path d="M${bx} ${(by - bh).toFixed(1)} L${bx} ${by} L${(bx - bw).toFixed(1)} ${by}" fill="none" stroke="#1c2a36" stroke-width="1.2"/><text x="${bx + 3}" y="${(by - bh + 8).toFixed(1)}" font-size="9" fill="#1c2a36">100 µV</text><text x="${(bx - bw / 2).toFixed(1)}" y="${by - 3}" font-size="9" fill="#1c2a36" text-anchor="middle">1 s</text>`;
  return s + `</svg>`;
}
const excerptCaption = (ex, L) => T('a.exCap', { cond: T('condl.' + ex.cond, null, L), a: fmt(ex.start_s), b: fmt(ex.start_s + ex.seconds) }, L);

/* shared with the shell, the results and the report modules (see CONTRACT.md) */
A.ax = Object.assign(A.ax || {}, {
  recs: () => { syncCase(); return reqRecs(); },
  cleaningSentences, cleaningSentence: (L, rec) => { syncCase(); return icaSentence(L || A.lang, rec || 'EO'); },
  qualityWithCleaning: (base, L) => { syncCase(); return withCleaning(base, L); },
  cleaning: () => { syncCase(); pushState(); return A.state.cleaning; },
  excerpts: () => (A.state.excerpts || []).slice(), excerptSVG, excerptCaption,
  removed: (rec) => { syncCase(); return [...removedSet(rec)].sort((a, b) => a - b); },
});
/* the shell's single cleaning sentence and its quality list follow the per-recording cleaning */
if (!A._axWrap) {
  const oq = A.qualitySentences;
  A.cleaningSentence = (lang) => { syncCase(); const rs = reqRecs(); return icaSentence(lang || A.lang, rs.includes('EO') ? 'EO' : (rs[0] || 'EO')); };
  A.qualitySentences = (lang) => { syncCase(); return withCleaning(oq ? oq(lang) : [], lang); };
  A._axWrap = true;
}

/* ================================ Cleaning tab view ================================ */
const icl = (c) => T('a.icl.' + c.lk);
const curRec = () => { if (!C.rec || !RECS.includes(C.rec) || !(A.m2.quality.recordings || {})[C.rec]) { const c = cs(), req = reqRecs(); C.rec = req.find(r => !c.rec[r].confirmed) || req[0] || 'EO'; } return C.rec; };
const selOf = (rec) => { if (!C.sel[rec] || !comp(rec, C.sel[rec])) C.sel[rec] = 1; return C.sel[rec]; };
const clock = '<span class="a-clk" aria-hidden="true">◷</span>';

function icCard(c, rec) {
  const S = removedSet(rec), P = propSet(rec), rm = S.has(c.ic), chg = rm !== P.has(c.ic), act = !ro();
  return `<div class="a-ic ${rm ? 'rm' : ''} ${selOf(rec) === c.ic ? 'sel' : ''}" data-ic="${c.ic}" tabindex="0" role="button" aria-pressed="${selOf(rec) === c.ic}" aria-label="${A.esc(T('a.icAria', { ic: c.ic, label: icl(c) }))}">
    <div class="n"><span>IC ${c.ic}</span>${chg ? `<span class="chg" title="${T('a.chgMan')}">● ${T('a.changed')}</span>` : (P.has(c.ic) ? `<span title="${T('a.propT')}">${T('a.proposed')}</span>` : '')}</div>
    <div class="a-map"><canvas data-map="${c.ic}"></canvas></div>
    <div class="lb">${A.esc(icl(c))}</div>
    <div class="pr">${c.best.r >= R_MIN ? A.esc(T('a.tpl.' + c.best.k)) : T('a.noMatch')} · r ${A.nf(c.best.r, 2)} · ${A.pct(c.var, 1)}</div>
    ${act ? `<label><input type="checkbox" data-rm="${c.ic}" ${rm ? 'checked' : ''}> ${T('a.remove')}</label>` : `<span class="st">${T(rm ? 'a.isRm' : 'a.isKept')}</span>`}
  </div>`;
}
function head() {
  const el = $('#aCHead'); if (!el) return;
  const rec = curRec(), c = cs(), st = c.rec[rec], req = reqRecs(), ch = changes(rec), S = removedSet(rec), N = model(rec).comps.length, segOk = A.state.segments.confirmed, lk = locked(), act = !ro();
  const recBtn = (r) => { const has = (A.m2.quality.recordings || {})[r]; return has ? `<button data-rec="${r}" class="${r === rec ? 'on' : ''}">${T('cond.' + r)}${req.includes(r) && c.rec[r].confirmed ? ' ✓' : ''}</button>` : ''; };
  const next = req.find(r => !c.rec[r].confirmed && r !== rec);
  const accBtn = !act ? '' : st.confirmed ? (next ? `<button class="btn" id="aNextR" data-nav>${T('a.nextRec', { cond: T('condl.' + next) })}</button>` : (c.confirmed ? `<button class="btn" id="aToRes" data-nav>${T('a.toResults')}</button>` : ''))
    : `<button class="btn primary" id="aAcc" ${segOk ? '' : `disabled title="${T('a.confFirst')}"`}>${A.esc(T('a.accept', { cond: T('condl.' + rec) }))}</button>`;
  el.innerHTML = `<div class="hd"><div class="a-ttl"><h2>${T('a.icaTitle')}</h2><span class="chip device">${T('a.method')}</span><span class="chip a-spec">${A.esc(T('a.statusSpec'))}</span>${A.ann('3.4 Clinician in control: the manual change of artefact components is in the core, at the latest in the first module after it (open question I8, product owner 23 October)')}${A.ann('ADR 0003 (proposed): replica of the legacy artefact correction ACM, ICA maps matched to 6 reference maps (audit 41 C17 to C19); V3 runs ICA separately per task file (audit 41 step C, review B3)')}${A.ann('A10: 19 channels under the average reference have rank 18, so the data are reduced to the true rank before ICA and give 18 components')}${A.ann('Mockup assumption: the ICA of eyes open follows the proposal in the data; eyes closed and VCPT have components made in the page by the same rule')}</div>
      <span class="row">${ch.length ? `<span class="chip amber"><span class="d"></span>${T('a.chgManN', { n: ch.map(x => T(x.removed ? 'a.icRm' : 'a.icKept', { ic: x.ic })).join(', ') })}</span>` : `<span class="chip device">${T('a.asProp')}</span>`}
      ${st.confirmed ? `<span class="chip ok">${A.esc(T('a.acceptedBy', { who: who(st.by) }))}</span>` : req.includes(rec) ? `<span class="chip a-todo">${clock}${T('a.notAcc')}</span>` : ''}</span></div>
    <div class="toolbar a-rtb"><div class="seg" id="aRec">${RECS.map(recBtn).join('')}</div>
      <span class="small muted">${A.esc(T('a.icaSum', { n: S.size, N, v: A.nf(model(rec).comps.filter(x => S.has(x.ic)).reduce((a, x) => a + x.var, 0), 1), list: [...propSet(rec)].join(', ') || '-', r: A.nf(R_MIN, 2) }))}</span></div>
    <div class="bd a-cbd">
      ${req.includes(rec) ? `<div><div class="xs muted" style="margin-bottom:4px">${T('a.sent')}</div>${A.sys([icaSentence(A.lang, rec)])}</div>` : `<div class="banner small a-ban"><span class="a-bmsg">${A.esc(T('a.recNoRes', { cond: T('cond.' + rec) }))}</span></div>`}
      ${act ? `<div class="a-acts">${lk ? '' : `<button class="btn ghost danger sm" id="aRej">${T('a.reject')}</button>`}<span class="a-sp"></span>${ch.length ? `<button class="btn ghost sm" id="aCReset">${T('a.reset')}</button>` : ''}${accBtn}</div>` : ''}
    </div>`;
  $$('#aRec [data-rec]', el).forEach(b => b.onclick = () => { C.rec = b.dataset.rec; renderCleaning(); });
  const rs = $('#aCReset', el); if (rs) rs.onclick = () => { if (blocked()) return; C.removed[rec] = new Set(propSet(rec)); A.addLog('who.c1', 'a.log.icaReset', { cond: A.tk('condl.' + rec) }); afterClean(rec); };
  const rj = $('#aRej', el); if (rj) rj.onclick = reject;
  const ac = $('#aAcc', el); if (ac) ac.onclick = accept;
  const nx = $('#aNextR', el); if (nx) nx.onclick = () => { C.rec = next; renderCleaning(); };
  const tr = $('#aToRes', el); if (tr) tr.onclick = () => A.go('results');
}
function accept() {
  if (blocked()) return; if (!A.state.segments.confirmed) return A.toast(T('a.confFirst'));
  const rec = curRec(), c = cs(), st = c.rec[rec], ch = changes(rec), n = nComp(rec), k = removedSet(rec).size;
  ch.forEach(x => A.addLog('who.c1', x.removed ? 'a.log.icRm' : 'a.log.icKept', { ic: x.ic, kind: A.tk('a.icl.' + comp(rec, x.ic).lk, null, { lc: true }), cond: A.tk('condl.' + rec) }));
  Object.assign(st, { confirmed: true, at: A.time(), by: whoKey() });
  A.addLog('who.c1', 'a.log.accept', { cond: A.tk('condl.' + rec), n: k, N: n, how: A.tk(ch.length ? 'a.how.chg' : 'a.how.prop') });
  const req = reqRecs(), next = req.find(r => !c.rec[r].confirmed);
  c.confirmed = !next && req.length > 0; pushState();
  if (next) { C.rec = next; A.toast(T('a.toast.next', { a: T('condl.' + rec), b: T('condl.' + next) })); A.refresh(); return; }
  A.toast(T(c.changed.length ? 'a.toast.accChg' : 'a.toast.acc'));
  A.go('results');
}
function reject() {
  if (blocked()) return;
  A.dialog({ title: T('a.rejectT'), ok: T('a.rejectT'), body: `
    <div class="field"><span>${T('a.reason')}</span><select id="aRjR">${['many', 'elec', 'proto', 'coop', 'drowsy', 'other'].map(k => `<option value="${k}">${T('a.rj.' + k)}</option>`).join('')}</select></div>
    <div class="field"><span>${T('a.note')}</span><textarea id="aRjN" rows="3" placeholder="${T('a.notePh')}"></textarea></div>
    <p class="xs muted" style="margin:0">${T('a.rjInfo')}</p>`,
    onOk: (back) => {
      if (!canRev()) return;
      const why = $('#aRjR', back).value, note = $('#aRjN', back).value.trim();
      A.state.rejected = { why: 'a.rj.' + why, note, at: A.now(), by: whoKey() }; A.state.cleaning.confirmed = false;
      A.addLog('who.c1', 'a.log.reject', { d: { $d: A.m2.date }, why: A.tk('a.rj.' + why), note: note ? ' (' + note + ')' : '' });
      A.toast(T('a.toast.reject')); A.refresh();
    } });
}
function grid() {
  const el = $('#aGrid'); if (!el) return; const rec = curRec(), M = model(rec);
  el.innerHTML = M.comps.map(c => icCard(c, rec)).join('');
  M.comps.forEach(c => A.topo($(`[data-map="${c.ic}"]`, el), c.map, { size: 76, lim: 1 }));
  $$('.a-ic', el).forEach(card => {
    const pick = () => { C.sel[rec] = +card.dataset.ic; $$('.a-ic', el).forEach(x => { x.classList.toggle('sel', x === card); x.setAttribute('aria-pressed', x === card); }); detail(); };
    card.onclick = (e) => { if (e.target.closest('label')) return; pick(); };
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
  });
  $$('[data-rm]', el).forEach(cb => cb.onchange = () => toggle(+cb.dataset.rm, cb.checked));
  const ttl = $('#aCompT'); if (ttl) ttl.textContent = T('a.components', { cond: T('cond.' + rec) });
}
function toggle(ic, rm) {
  const rec = curRec();
  if (blocked()) { refreshAll(); return; }
  const s = removedSet(rec); if (rm) s.add(ic); else s.delete(ic);
  C.sel[rec] = ic; afterClean(rec);
}
/* a cleaning change after acceptance reopens that recording and the later confirmations (markers, peaks) */
function afterClean(rec) {
  const c = cs(), st = c.rec[rec], wasRec = st.confirmed, wasAll = c.confirmed;
  if (wasRec) st.confirmed = false;
  if (wasAll) c.confirmed = false;
  pushState();
  const re = A.reopenAfter ? A.reopenAfter('cleaning') : [];
  if (wasAll) { A.toast(T('a.toast.clnAgain')); A.refresh(); return; }
  if (wasRec) { A.toast(T('a.toast.clnAgainR', { cond: T('condl.' + rec) })); A.refresh(); return; }
  if (re.length) { A.refresh(); return; }
  refreshAll();
}
function refreshAll() { pushState(); head(); grid(); detail(); before(); }

const mapBar = () => `<div style="display:grid;gap:2px;width:170px;margin-top:4px">
  <div style="height:8px;border-radius:2px;background:linear-gradient(90deg,${[-3, -2, -1, 0, 1, 2, 3].map(z => A.zColor(z)).join(',')})"></div>
  <div class="mono xs" style="display:flex;justify-content:space-between;color:#55554f"><span>-1</span><span>0</span><span>+1</span></div>
  <div class="xs" style="color:#55554f">${T('a.mapUnit')}</div></div>`;
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
function detail() {
  const el = $('#aDet'); if (!el) return;
  const rec = curRec(), c = comp(rec, selOf(rec)), rm = removedSet(rec).has(c.ic), pr = propSet(rec).has(c.ic), act = !ro(), N = model(rec).comps.length;
  const pk = CH[c.map.indexOf(1)], off = OFF[rec], ws = off + C.win * 10;
  const bars = c.rs.slice().sort((a, b) => b.r - a.r).map(({ k, r }) => `<div class="a-pb${r >= R_MIN ? ' top' : ''}"><span>${T('a.tpl.' + k)}</span><i><b style="width:${Math.max(1, r * 100).toFixed(1)}%"></b><u></u></i><span class="num">${A.nf(r, 2)}</span></div>`).join('');
  el.innerHTML = `<div class="hd"><h2>IC ${c.ic} · ${A.esc(icl(c))} ${A.ann('Maps shown only to choose artefact components (3.4); the ICA component view as a result (table 3.3 Open, Q8) is not in the core')}</h2><div class="row">${rm !== pr ? `<span class="chip amber">${T('a.chgMan')}</span>` : ''}${act ? `<button class="btn sm ${rm ? '' : 'danger'}" id="aDetT">${T(rm ? 'a.keepComp' : 'a.rmComp')}</button>` : ''}</div></div>
    <div class="bd" style="display:grid;gap:12px">
      <div class="a-det"><div class="paper a-fig"><canvas id="aDetMap"></canvas>${mapBar()}</div>
        <div style="display:grid;gap:10px;align-content:start"><dl class="kv"><dt>${T('a.expVar')}</dt><dd class="num">${A.pct(c.var, 1)} <span class="muted small">${T('a.rank', { r: c.ic, n: N })}</span></dd>
          <dt>${T('a.proposal')}</dt><dd><span class="chip device">${T(pr ? 'a.remove' : 'a.keep')}</span></dd><dt>${T('a.yourChoice')}</dt><dd>${rm ? `<span class="chip warn">${T('a.remove')}</span>` : `<span class="chip clinician">${T('a.keep')}</span>`}</dd>
          <dt>${T('a.strongest')}</dt><dd class="mono">${CH.map((ch, i) => [ch, c.map[i]]).filter(x => x[1] >= 0.5).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).join(', ')}</dd></dl>
          <div><div class="xs muted" style="margin-bottom:4px">${T('a.tplMatch')} · ${T('a.tplRule', { r: A.nf(R_MIN, 2) })} ${A.ann('Legacy ACM reference maps (audit 41 C18); absolute r, as in the fixed legacy reference build (L9)')}</div><div class="a-pbs">${bars}</div></div></div></div>
      <div class="paper a-fig"><div class="row between" style="margin-bottom:2px;flex-wrap:wrap;gap:4px"><h4 style="margin:0">${T('a.activation', { cond: T('condl.' + rec), a: fmt(ws), b: fmt(ws + 10) })}</h4>
        <div class="seg a-tcs" id="aTcW">${[0, 1].map(w => `<button data-w="${w}" class="${C.win === w ? 'on' : ''}">${fmt(off + w * 10)} ${T('to')} ${fmt(off + w * 10 + 10)}</button>`).join('')}</div></div><canvas id="aDetTc"></canvas>${rec === 'VCPT' ? `<div class="xs" style="color:#55554f">${T('a.stimKey')}</div>` : ''}</div>
      <div class="paper a-fig"><h4>${T('a.psd', { ch: pk, cond: T('condl.' + rec) })}</h4><canvas id="aDetSp"></canvas></div>
    </div>`;
  A.topo($('#aDetMap', el), c.map, { size: 170, names: true, lim: 1 });
  const dt = $('#aDetT', el); if (dt) dt.onclick = () => toggle(c.ic, !rm);
  $$('#aTcW button', el).forEach(b => b.onclick = () => { C.win = +b.dataset.w; detail(); before(); });
  const wTc = Math.max(300, $('#aDetTc', el).parentElement.clientWidth - 16);
  /* activation of the component in its recording; VCPT with the stimulus markers */
  { const vc = rec === 'VCPT', TOPm = vc ? 14 : 0, cv = $('#aDetTc', el), H = 96 + TOPm, g = setupCanvas(cv, wTc, H), n = 10 * FS, s = c.s, o = C.win * n, sg = c.sign;
    let mx = 1e-6; for (let i = 0; i < CN; i++) mx = Math.max(mx, Math.abs(s[i]));
    const X = (t) => 8 + t / 10 * (wTc - 16);
    g.strokeStyle = GRID; g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED;
    for (let t = 0; t <= 10; t++) { const x = crisp(X(t)); g.beginPath(); g.moveTo(x, 4 + TOPm); g.lineTo(x, H - 14); g.stroke(); if (t % 2 === 0) g.fillText(fmt(ws + t), Math.min(wTc - 30, Math.max(0, x - 12)), H - 2); }
    if (vc) plan('VCPT').marks.forEach(m => { const t = m.t - ws; if (t < 0 || t > 10) return; const x = crisp(X(t)), col = m.s === 'R' ? '#217a45' : (m.s === 'H' ? '#a04a12' : '#135e7d');
      g.strokeStyle = col; g.globalAlpha = 0.3; g.beginPath(); g.moveTo(x, TOPm); g.lineTo(x, H - 14); g.stroke(); g.globalAlpha = 1; g.fillStyle = col; g.font = (m.ty ? '600 ' : '') + '9.5px IBM Plex Mono, monospace'; g.fillText(m.s + (m.ty ? ' ' + m.ty : ''), x + 2, 10); });
    g.save(); g.beginPath(); g.rect(0, 2 + TOPm, wTc, H - 16 - TOPm); g.clip(); g.strokeStyle = INK; g.lineWidth = 0.9; g.beginPath();
    for (let i = 0; i < n; i++) { const x = X(i / FS), y = (H - 14 + TOPm) / 2 + 2 - sg * s[o + i] / mx * ((H - 22 - TOPm) / 2); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); g.restore(); }
  /* spectrum of the component projected to its strongest channel */
  { const cv = $('#aDetSp', el), H = 130, g = setupCanvas(cv, wTc, H), key = rec + c.ic, sp = C.spec[key] || (C.spec[key] = spectrum(c.s.map(v => v * c.peak)));
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
const BA_CH = ['Fp1', 'Fp2', 'F7', 'F4', 'F8', 'T3'];
/* the component mixture of the recording's stretch, without the removed components */
function mix(rec, chans, removed, from, len) {
  const { comps } = model(rec);
  return chans.map(ch => { const c = CI[ch], out = new Float32Array(len); comps.forEach(k => { if (removed && removed.has(k.ic)) return; const w = k.w[c]; for (let i = 0; i < len; i++) out[i] += w * k.s[from + i]; }); return out; });
}
function before() {
  const el = $('#aBA'); if (!el) return; const rec = curRec(), off = OFF[rec];
  const cv = $('#aBAc', el), W = Math.max(640, cv.parentElement.clientWidth - 2), ROW = 46, TOP = 6, H = TOP + ROW * BA_CH.length + 20, GUT = 44, PW = W - GUT - 56, len = 10 * FS, from = C.win * len;
  const g = setupCanvas(cv, W, H), b = mix(rec, BA_CH, null, from, len), a = mix(rec, BA_CH, removedSet(rec), from, len), k = PX_MM / 15 * ySign();
  g.font = '10px IBM Plex Mono, monospace'; g.fillStyle = MUTED; g.strokeStyle = GRID;
  for (let t = 0; t <= 10; t++) { const x = crisp(GUT + t / 10 * PW); g.beginPath(); g.moveTo(x, TOP); g.lineTo(x, H - 16); g.stroke(); g.fillText(fmt(off + C.win * 10 + t), Math.min(W - 26, x - 10), H - 4); }
  const line = (s, y0, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i < len; i++) { const x = GUT + i / len * PW, y = y0 + s[i] * k; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); };
  g.save(); g.beginPath(); g.rect(GUT, 0, PW, H - 16); g.clip();
  BA_CH.forEach((ch, j) => { const y0 = TOP + ROW * (j + 0.5);
    if (C.ba !== 'after') line(b[j], y0, C.ba === 'overlay' ? 'rgba(196,62,48,0.75)' : INK, 0.9);
    if (C.ba !== 'before') line(a[j], y0, INK, 1); });
  g.restore(); g.lineWidth = 1;
  g.font = '500 11px IBM Plex Mono, monospace'; g.fillStyle = INK; g.textAlign = 'right'; BA_CH.forEach((ch, j) => g.fillText(ch, GUT - 8, TOP + ROW * (j + 0.5) + 4)); g.textAlign = 'left';
  calib(g, GUT + PW + 10, H - 18, 100 * Math.abs(k), 0);
  const lab = $('#aBaL', el); if (lab) lab.textContent = `${T('cond.' + rec)} · 15 µV/mm · ${T(V.neg ? 'a.negUp' : 'a.posUp')}`;
}
let CR = null;
function renderCleaning() {
  const root = CR; if (!root || !root.isConnected) return;
  syncCase(); cs(); const rec = curRec(); removedSet(rec); pushState();
  const segOk = A.state.segments.confirmed;
  root.innerHTML = `<div class="grid" style="gap:14px">
    ${lockBanner('cleaning')}${segOk || locked() || !canRev() ? '' : `<div class="banner amber a-ban"><b>${T('a.segNot')}</b><span class="a-bmsg">${T('a.segNotText')}</span><button class="btn sm" id="aGoSeg" data-nav>${T('a.openRec')}</button></div>`}
    <div class="card a-chd" id="aCHead"></div>
    <div class="a-cl">
      <div class="card"><div class="hd"><h3 id="aCompT">${T('a.components', { cond: T('cond.' + rec) })}</h3><span class="xs muted">${T('a.compSub')}</span></div><div class="bd"><div class="a-icg" id="aGrid"></div></div></div>
      <div class="card" id="aDet"></div>
    </div>
    <div class="card" id="aBA"><div class="hd"><h3>${T('a.ba')}</h3>
      <div class="row" style="flex-wrap:wrap"><span class="a-ba-leg"><span><i style="background:rgba(196,62,48,0.75)"></i>${T('a.before')}</span><span><i style="background:${INK};outline:1px solid var(--line-2)"></i>${T('a.after')}</span></span>
        <div class="seg" id="aBaM">${[['overlay', 'a.overlay'], ['before', 'a.before'], ['after', 'a.after']].map(([k, l]) => `<button data-k="${k}" class="${C.ba === k ? 'on' : ''}">${T(l)}</button>`).join('')}</div>
        <span class="xs muted" id="aBaL"></span></div></div>
      <div class="paper scroll-x" style="margin:10px 12px 12px;padding:4px 0"><canvas id="aBAc" aria-label="${T('a.baAria')}"></canvas></div></div>
  </div>`;
  const gs = $('#aGoSeg', root); if (gs) gs.onclick = () => A.go('segments'); wireLock(root);
  $$('#aBaM button', root).forEach(b => b.onclick = () => { C.ba = b.dataset.k; $$('#aBaM button').forEach(x => x.classList.toggle('on', x === b)); before(); });
  refreshAll();
}
window.Modules.cleaning = {
  render(root) {
    CR = root; renderCleaning();
    let last = 0;
    ro0 = new ResizeObserver(() => { const w = root.clientWidth; if (Math.abs(w - last) > 4) { last = w; detail(); before(); } }); ro0.observe(root);
  },
  destroy() { if (ro0) ro0.disconnect(); ro0 = null; CR = null; },
};
exportSeg();
