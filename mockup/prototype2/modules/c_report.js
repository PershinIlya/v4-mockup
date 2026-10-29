/* Module C: workspace tabs "Report" (document editor) and "Issued" (PDF-like viewer with the
   version history), and the page "Report templates" (template builder for CT-C, the clinic's
   own blue style, and CT-STD, the company standard with the navy and lime heritage look).
   The report is assembled from the saved clinic template: device blocks (fixed sentences and
   figures, locked), clinic blocks (from the template) and clinician blocks (free text).
   The report language (r.lang) is independent of the interface language (APP.lang): everything
   inside a report page is drawn with the report language; editing chrome uses the interface. */
const A = window.APP, T = A.t;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = A.esc;
const M2 = A.m2, SP = M2.spectra.conditions;
const PW = 794, PH = 1123, PAD = [50, 56, 64, 56], BODY_H = PH - PAD[0] - PAD[2];
const TODAY = '2026-10-29';
const clone = (o) => JSON.parse(JSON.stringify(o));
const fx = (v, d = 1, L) => (v == null || isNaN(v) ? '' : A.nf(v, d, L));
const FONTS = {
  'Liberation Sans': "'Liberation Sans', Arial, Helvetica, sans-serif", 'Liberation Serif': "'Liberation Serif', 'Times New Roman', Times, serif",
  'DejaVu Sans': "'DejaVu Sans', Verdana, sans-serif", 'DejaVu Serif': "'DejaVu Serif', Georgia, serif",
  'IPAGothic': "IPAGothic, 'Noto Sans JP', sans-serif", 'IPAPGothic': "IPAPGothic, 'Noto Sans JP', sans-serif",
  'Carlito': "Carlito, Calibri, 'Segoe UI', 'Liberation Sans', Arial, sans-serif",
  'Fira Sans': "'Fira Sans', 'Trebuchet MS', 'Lucida Grande', Ubuntu, 'DejaVu Sans', sans-serif",
};
/* fonts the template builder offers: exactly the approved list of render.py (README M11); the company
   standard's Carlito and Fira Sans (M30 stand-ins) show as its current value but are not offered */
const M11F = ['DejaVu Sans', 'DejaVu Serif', 'Liberation Sans', 'Liberation Serif', 'IPAGothic', 'IPAPGothic'];
const fontOpts = (cur) => (M11F.includes(cur) ? '' : `<option selected disabled>${esc(T('c.fontStandin', { f: cur }))}</option>`) + M11F.map(f => `<option ${f === cur ? 'selected' : ''}>${f}</option>`).join('');
const ACCENTS = ['#1c5cab', '#135e7d', '#2a2e47', '#2f6b3a', '#6b3f8f', '#9a3b1f', '#3a3f46'];
const NAVY = '#2a2e47', LIME = '#96c11f';
const TPLS = { 'CT-C': { owner: 'clinic' }, 'CT-STD': { owner: 'company' } };
const TL = ['en', 'de']; /* languages a template carries clinic texts for; Japanese is a later market */
const ROMAN = (n) => [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((o, [v, r]) => { while (n >= v) { o += r; n -= v; } return o; }, '');
/* claim words in clinic texts, English and German, matched at the start of a word (M29) */
const CLAIM = /(?<![\p{L}\p{N}_])(adhd|adhs|attention|aufmerksamkeit|impulsiv|diagnos|therap|treatment|behandl|medicat|medikat|neurofeedback|recommend|empfehl|normal|auffällig|unauffällig)[\p{L}\p{N}_]*/giu;
const BANDL = { delta: 'Delta', theta: 'Theta', alpha: 'Alpha', smr: 'SMR', beta1: 'Beta 1', beta2: 'Beta 2' };

A.addI18n({
  en: {
    'c.tpl.CT-C': 'Clinic C', 'c.tpl.CT-STD': 'Company standard', 'c.logoC': 'CLINIC C',
    'c.blk.intro': 'Introduction text', 'c.blk.versions': 'Versions', 'c.blk.summary': 'Summary of deviations', 'c.blk.quality': 'Signal quality',
    'c.blk.spectra_EO': 'Band power, eyes open', 'c.blk.spectra_EC': 'Band power, eyes closed', 'c.blk.ratios': 'Ratios and alpha peak', 'c.blk.coherence': 'Coherence',
    'c.blk.erp': 'Event-related potentials', 'c.blk.behaviour': 'VCPT task performance', 'c.blk.comparison': 'Comparison with {d}', 'c.blk.limits': 'Notes on the results',
    'c.blk.anamnesis': 'Anamnesis', 'c.blk.interpretation': 'Interpretation', 'c.blk.conclusion': 'Conclusion',
    'c.lab.comment': (p, L) => 'comment after ' + A.lc(p.b, L), 'c.blkRef': (p, L) => labelOf(p.k, L),
    'rep.title': 'EEG and ERP report', 'rep.patient': 'Patient', 'rep.code': 'Case code', 'rep.born': 'Born', 'rep.recorded': 'Recorded', 'rep.age': 'Age', 'rep.sex': 'Sex',
    'rep.page': 'page', 'rep.of': 'of', 'rep.comment': 'Comment', 'rep.none': 'No entry.',
    'rep.ph.anamnesis': 'Reason for the measurement, history and current situation.', 'rep.ph.interpretation': 'Your interpretation of the results.',
    'rep.ph.conclusion': 'Your conclusion.', 'rep.ph.comment': 'Comment on this section.',
    'rep.report': 'Report', 'rep.template': 'Template', 'rep.software': 'Software', 'rep.norms': 'Norms', 'rep.system': 'Recording system', 'rep.measurement': 'Measurement',
    'rep.measV': '{d} · eyes open 180 s · eyes closed 180 s · VCPT {m} min', 'rep.st.draft': 'draft', 'rep.st.issued': 'issued', 'rep.st.replaced': 'issued, replaced',
    'rep.recording': 'Recording', 'rep.recordedS': 'Recorded', 'rep.analysed': 'Analysed', 'rep.measure': 'Measure', 'rep.condition': 'Condition', 'rep.value': 'Value',
    'rep.normMean': 'Norm mean', 'rep.tbrCz': 'Theta/beta ratio at Cz', 'rep.faa': 'Frontal alpha asymmetry', 'rep.apfHz': 'Alpha peak frequency, Hz',
    'rep.cohCap': 'Electrode pairs with |z| of 2 or more', 'rep.pair': 'Pair', 'rep.band': 'Band', 'rep.coherence': 'Coherence', 'rep.component': 'Component',
    'rep.trials': 'Trials', 'rep.site': 'Site', 'rep.ampUv': 'Amplitude, µV', 'rep.latMs': 'Latency, ms', 'rep.mean': 'mean', 'rep.vcptMeasure': 'VCPT measure',
    'rep.percentile': 'Percentile', 'rep.om': 'Omission errors', 'rep.cm': 'Commission errors', 'rep.rtMean': 'Reaction time, mean, ms',
    'rep.rtSd': 'Reaction time variability (SD), ms', 'rep.mapAlt': '{b} absolute power, {cond}, z map',
    'rep.mapsCap': 'Maps: absolute power against the age norm. Table: absolute (abs) and relative (rel) power, z per electrode.',
    'rep.sigIssued': 'Issued by Clinician 1, licensed psychologist, on {at}', 'rep.sigDraft': 'Clinician 1, licensed psychologist · signature added on issue',
    'rep.stampDraft': 'DRAFT', 'rep.stampRep': 'REPLACED BY v{v}', 'rep.companyLine': '[Company line placeholder]',
    'rep.ch.segments': 'Segments', 'rep.ch.cleaning': 'Artefact removal', 'rep.ch.marker': 'Frequency marker',
    'rep.ch.segConfN': (p) => `Confirmed by the clinician, ${p.n} change${p.n > 1 ? 's' : ''} to the proposal`, 'rep.ch.segConf': 'Confirmed by the clinician as proposed',
    'rep.ch.auto': 'Automatic proposal, not confirmed', 'rep.ch.clnConf': '{how}, {k} of 19 components removed', 'rep.ch.changed': 'Changed by the clinician',
    'rep.ch.asProp': 'Accepted as proposed', 'rep.ch.clnAuto': 'Automatic proposal, {k} of 19 components removed, not confirmed',
    'rep.ch.mkSet': '{hz} Hz, set by the clinician', 'rep.ch.mkNot': '{hz} Hz, not confirmed', 'rep.ch.apfConf': 'Alpha peak {hz} Hz (automatic), confirmed by the clinician',
    'rep.ch.apfNot': 'Alpha peak {hz} Hz (automatic), not confirmed',
    'c.intro': 'This report presents the EEG, ERP and VCPT measurements of {name}, aged {age}, recorded on {recording_date} at Clinic C. Each value is compared with the age norm.',
    'c.introStd': 'This report presents the EEG, ERP and VCPT measurements of {name}, aged {age}, recorded on {recording_date}. Each value is compared with the age norm.',
    'c.addr1': '[Clinic address placeholder]', 'c.addr2': '[Phone and e-mail placeholder]',
    'c.by.company': 'Company (on request)', 'c.by.admin': 'Company admin', 'c.h.created': 'Created from the company default template',
    'c.h.logo': 'Logo placeholder, accent colour', 'c.h.cmp': 'Added comparison with the earlier measurement', 'c.h.std': 'Company standard layout: cover band, numbered sections, running header',
    'c.ck.segments': 'Segments', 'c.ck.cleaning': 'Cleaning', 'c.ck.marker': 'Frequency marker', 'c.ck.notConf': '{l} not confirmed', 'c.ck.pend': (p) => `${p.l}: ${p.n} change${p.n === 1 ? '' : 's'} pending confirmation`, 'c.ck.conf': '{l} confirmed',
    'c.ck.empty': '{l} is empty', 'c.ck.written': '{l} written', 'c.ck.emptyC': (p, L) => 'Empty ' + p.l,
    'c.nPages': (p) => `${p.n} page${p.n === 1 ? '' : 's'}`, 'c.nWarn': (p) => `${p.n} warning${p.n > 1 ? 's' : ''}`, 'c.nBlocks': '{n} blocks',
    'c.corrTitle': 'Correct report v{n}', 'c.corrOk': 'Start version {m}', 'c.corrReason': 'Reason for the correction (kept in the version history)',
    'c.corrPh': 'For example: typing error in the anamnesis', 'c.corrInfo': 'Version {n} stays issued until version {m} is issued. Both versions are kept.',
    'c.corrErr': 'Enter a reason.', 'c.log.corr': 'Started correction v{m} of report R-MOCK-042: {why}', 'c.toast.corr': 'Draft v{m} started. v{n} stays issued.',
    'c.issueTitle': 'Issue report v{v}', 'c.issueOk': 'Issue v{v}', 'c.report': 'Report', 'c.template': 'Template', 'c.signedBy': 'Signed by', 'c.noWarn': 'No warnings',
    'c.reviewed': 'I reviewed the raw EEG, the analysed segments and the full results', 'c.issueInfo': 'An issued version cannot be edited. A correction creates a new version.',
    'c.firstIssue': 'First issue', 'c.log.issued': 'Issued report R-MOCK-042 v{v} (template {tid} v{tv}) after confirming review of the raw EEG, segments and results',
    'c.toast.issued': 'Report v{v} issued',
    'c.outline': 'Outline', 'c.docAria': 'Document', 'c.fit': 'Fit', 'c.marks': 'Editing marks', 'c.log.addc': 'Added a {l}', 'c.log.rmc': 'Removed the {l}',
    'c.locked': 'Locked: company-verified block', 'c.clinicLocked': 'Clinic block: change it in the report template', 'c.saved': 'Draft saved {t}',
    'c.log.tpl': 'Changed the template of report draft v{v} from {a} to {b} v{tv} ({name})', 'c.toast.tpl': 'Template {name} applied. Device blocks and figures are unchanged.',
    'c.log.lang': 'Set the report language to {lang}', 'c.log.edit': 'Edited the {l} in report draft v{v} ({n} characters)', 'c.pagesA4': '{p} · A4',
    'c.issuedV': 'Issued v{v}', 'c.issuedBan': '{at} by Clinician 1. Read only.', 'c.openIssued': 'Open issued', 'c.correct': 'Correct', 'c.corrV': 'Correction v{v}',
    'c.staysIssued': 'Version {a} stays issued until version {b} is issued.', 'c.reasonX': 'Reason: {r}', 'c.viewV': 'View v{v}',
    'c.langBan': 'Report in {r}; the interface stays in {ui}.', 'c.reportLangB': 'Report language',
    'c.kind.device': 'device', 'c.kind.clinic': 'clinic', 'c.kind.clinician': 'clinician', 'c.comment': 'Comment', 'c.commentOn': 'Comment: {b}', 'c.empty': 'empty', 'c.emptyT': 'Empty',
    'c.hdrItem': 'Clinic header', 'c.draft': 'Draft', 'c.issued': 'Issued', 'c.edit': 'Edit', 'c.pages': 'Pages', 'c.author': 'Author',
    'c.tplFor': 'Template for this report', 'c.reportLang': 'Report language', 'c.choices': 'Choices shown in the report', 'c.open': 'open', 'c.before': 'Before issuing',
    'c.atIssue': 'Checks at issue', 'c.ready': 'ready', 'c.locks': '{n} device blocks locked', 'c.issueBtn': 'Issue v{v}…', 'c.confFirst': 'Confirm segments and cleaning first',
    'c.confFirstL': 'Confirm the segments and the cleaning before issuing.', 'c.correctThis': 'Correct this report', 'c.rmComment': 'Remove this comment', 'c.remove': 'Remove',
    'c.addComment': '+ Comment', 'c.addCommentT': 'Add a clinician comment after this section',
    'c.noIssued': 'No issued report yet', 'c.isDraft': 'The report for this measurement is a draft (v{v}).', 'c.openDraft': 'Open the report draft',
    'c.corrProg': 'Correction v{v} in progress', 'c.openDraftV': 'Open draft v{v}', 'c.ivAria': 'Issued report', 'c.tplUsed': 'Template used for this version',
    'c.replacedBy': 'Replaced by v{v}', 'c.version': 'Version', 'c.zoomOut': 'Zoom out', 'c.zoomIn': 'Zoom in', 'c.fitWidth': 'Fit width', 'c.download': '⤓ Download PDF',
    'c.pageN': 'Page {n}', 'c.issuedAtBy': 'Issued {at} by Clinician 1', 'c.tplLine': 'Template {tid} v{tv} · {name}', 'c.checksum': 'Checksum {h}',
    'c.history': 'Version history', 'c.keptAll': 'Every issued version is kept', 'c.th.version': 'Version', 'c.th.status': 'Status', 'c.th.issued': 'Issued',
    'c.th.by': 'By', 'c.th.reason': 'Reason', 'c.th.template': 'Template', 'c.th.pages': 'Pages', 'c.notIssued': 'not issued', 'c.current': 'Issued, current',
    'c.log.viewed': 'Viewed issued report R-MOCK-042 v{v}', 'c.log.dl': 'Downloaded R-MOCK-042 v{v} as PDF', 'c.toast.dl': 'R-MOCK-042 v{v}.pdf downloaded (mockup: no file is created)',
    'c.d.added': 'added {l}', 'c.d.removed': 'removed {l}', 'c.d.order': 'block order', 'c.d.intro': 'introduction text ({lang})', 'c.d.header': 'header lines ({lang})',
    'c.d.font': 'font {f}', 'c.d.hfont': 'heading font {f}', 'c.d.accent': 'accent colour', 'c.d.logo': 'logo position', 'c.d.addrOn': 'header lines shown',
    'c.d.addrOff': 'header lines hidden', 'c.d.pageOf': 'page numbering', 'c.d.comOn': 'clinician comments allowed', 'c.d.comOff': 'clinician comments off',
    'c.crumbTpl': 'Report templates', 'c.tplAria': 'Templates', 'c.companyTpl': 'company template', 'c.clinicTpl': 'clinic template', 'c.usedBy': ' · used by MOCK-042',
    'c.chipCompany': 'company', 'c.chipClinic': 'clinic', 'c.inUse': 'v{v} in use by the MOCK-042 report draft', 'c.avail': 'v{v} available to draft reports',
    'c.keepVer': ' · issued reports keep the version they were issued with', 'c.discard': 'Discard', 'c.saveAs': 'Save as {id} v{v}', 'c.blocksIn': 'Blocks in this template',
    'c.dragHint': 'drag to reorder', 'c.addBlocks': 'Add blocks', 'c.clinicTexts': 'Clinic texts', 'c.textLang': 'Text language', 'c.insert': 'Insert',
    'c.hdr1': 'Header line 1', 'c.hdr2': 'Header line 2', 'c.preview': 'Preview, pages 1 and 2', 'c.pvSub': 'MOCK-042 · synthetic data · {lang}', 'c.theme': 'Theme',
    'c.font': 'Font', 'c.fontStandin': '{f} (company standard)', 'c.hfont': 'Heading font', 'c.accent': 'Accent colour', 'c.accentA': 'Accent {a}', 'c.logo': 'Logo', 'c.replace': 'Replace…', 'c.logoL': 'Logo left',
    'c.logoR': 'Logo right', 'c.header': 'Header', 'c.showHdr': 'Show header lines', 'c.footer': 'Footer', 'c.pageOf': 'Page n of N',
    'c.always': 'Always printed: mockup notice, versions, report id and status.', 'c.stdStyle': ' Company style: cover band, Roman section numbers, italic running header from page 2, lime footer band.',
    'c.figFixed': 'Figure colours are fixed.', 'c.figSame': 'The z scale is the same in every clinic style.', 'c.tplVersions': 'Template versions',
    'c.toast.saveFirst': 'Save or discard the changes to {id} first', 'c.log.openTpl': 'Opened report template {id} ({name})',
    'c.toast.logo': 'Logo files are not used in the mockup; the placeholder box stays', 'c.log.review': 'Sent clinic texts of {id} to company review: {w}',
    'c.toast.review': 'Sent to company review. You can save once the words are removed or approved.', 'c.toast.noChg': 'No unsaved changes', 'c.toast.disc': 'Changes discarded',
    'c.fixedStd': 'Cover band, logo and patient identity', 'c.fixedC': 'Clinic header and patient identity', 'c.fixedT': 'Fixed at the top of page 1', 'c.fixed': 'fixed',
    'c.reqT': 'Required in every template: cannot be removed', 'c.up': 'Move up', 'c.down': 'Move down', 'c.reqBlock': 'Required block', 'c.addBtn': '+ Add',
    'c.allIn': 'All in the template', 'c.add.device': 'Device blocks', 'c.add.clinic': 'Clinic blocks', 'c.add.clinician': 'Clinician blocks',
    'c.comments': 'Clinician comments after result sections', 'c.needsRev': 'Needs company review.', 'c.claimWords': (p) => `Claim word${p.n > 1 ? 's' : ''} in clinic texts:`,
    'c.sendRev': 'Send to company review', 'c.noClaims': '✓ No claim words in clinic texts', 'c.needsRevT': 'Needs company review', 'c.noChanges': 'No changes',
    'c.unsaved': 'Unsaved changes', 'c.savedChip': 'Saved', 'c.saveBlocked': 'Save blocked', 'c.saveBlockedT': 'Needs company review: remove {w} from the clinic texts.',
    'c.inUseChip': 'in use', 'c.log.saveTpl': 'Saved report template {id} as version {v}: {change}',
    'c.toast.saved': 'Template {id} v{v} saved. Draft reports use it now; issued reports keep their version.',
  },
  de: {
    'c.tpl.CT-C': 'Klinik C', 'c.tpl.CT-STD': 'Firmenstandard', 'c.logoC': 'KLINIK C',
    'c.blk.intro': 'Einleitungstext', 'c.blk.versions': 'Versionen', 'c.blk.summary': 'Zusammenfassung der Abweichungen', 'c.blk.quality': 'Signalqualität',
    'c.blk.spectra_EO': 'Bandleistung, Augen offen', 'c.blk.spectra_EC': 'Bandleistung, Augen geschlossen', 'c.blk.ratios': 'Quotienten und Alpha-Peak', 'c.blk.coherence': 'Kohärenz',
    'c.blk.erp': 'Ereigniskorrelierte Potenziale', 'c.blk.behaviour': 'VCPT-Aufgabenleistung', 'c.blk.comparison': 'Vergleich mit der Messung vom {d}', 'c.blk.limits': 'Hinweise zu den Ergebnissen',
    'c.blk.anamnesis': 'Anamnese', 'c.blk.interpretation': 'Interpretation', 'c.blk.conclusion': 'Beurteilung',
    'c.lab.comment': (p) => 'Kommentar nach ' + p.b,
    'rep.title': 'EEG- und ERP-Bericht', 'rep.patient': 'Patient', 'rep.code': 'Fallnummer', 'rep.born': 'Geburtsdatum', 'rep.recorded': 'Messdatum', 'rep.age': 'Alter', 'rep.sex': 'Geschlecht',
    'rep.page': 'Seite', 'rep.of': 'von', 'rep.comment': 'Kommentar', 'rep.none': 'Kein Eintrag.',
    'rep.ph.anamnesis': 'Anlass der Messung, Vorgeschichte und aktuelle Situation.', 'rep.ph.interpretation': 'Ihre Interpretation der Ergebnisse.',
    'rep.ph.conclusion': 'Ihre Beurteilung.', 'rep.ph.comment': 'Kommentar zu diesem Abschnitt.',
    'rep.report': 'Bericht', 'rep.template': 'Vorlage', 'rep.software': 'Software', 'rep.norms': 'Normen', 'rep.system': 'Aufnahmesystem', 'rep.measurement': 'Messung',
    'rep.measV': '{d} · Augen offen 180 s · Augen geschlossen 180 s · VCPT {m} min', 'rep.st.draft': 'Entwurf', 'rep.st.issued': 'freigegeben', 'rep.st.replaced': 'freigegeben, ersetzt',
    'rep.recording': 'Aufnahme', 'rep.recordedS': 'Aufgezeichnet', 'rep.analysed': 'Ausgewertet', 'rep.measure': 'Messgröße', 'rep.condition': 'Bedingung', 'rep.value': 'Wert',
    'rep.normMean': 'Normmittelwert', 'rep.tbrCz': 'Theta/Beta-Quotient an Cz', 'rep.faa': 'Frontale Alpha-Asymmetrie', 'rep.apfHz': 'Alpha-Peak-Frequenz, Hz',
    'rep.cohCap': 'Elektrodenpaare mit |z| ab 2', 'rep.pair': 'Paar', 'rep.band': 'Band', 'rep.coherence': 'Kohärenz', 'rep.component': 'Komponente',
    'rep.trials': 'Durchgänge', 'rep.site': 'Elektrode', 'rep.ampUv': 'Amplitude, µV', 'rep.latMs': 'Latenz, ms', 'rep.mean': 'Mittelwert', 'rep.vcptMeasure': 'VCPT-Messgröße',
    'rep.percentile': 'Perzentil', 'rep.om': 'Auslassungsfehler', 'rep.cm': 'Fehlreaktionen (Kommissionsfehler)', 'rep.rtMean': 'Reaktionszeit, Mittelwert, ms',
    'rep.rtSd': 'Variabilität der Reaktionszeit (SD), ms', 'rep.mapAlt': '{b}, absolute Leistung, {cond}, z-Karte',
    'rep.mapsCap': 'Karten: absolute Leistung gegen die Altersnorm. Tabelle: absolute (abs) und relative (rel) Leistung, z je Elektrode.',
    'rep.sigIssued': 'Freigegeben von Kliniker 1, zugelassener Psychologe, am {at}', 'rep.sigDraft': 'Kliniker 1, zugelassener Psychologe · Signatur wird bei der Freigabe ergänzt',
    'rep.stampDraft': 'ENTWURF', 'rep.stampRep': 'ERSETZT DURCH v{v}', 'rep.companyLine': '[Platzhalter Firmenzeile]',
    'rep.ch.segments': 'Segmente', 'rep.ch.cleaning': 'Artefaktbereinigung', 'rep.ch.marker': 'Frequenzmarker',
    'rep.ch.segConfN': (p) => `Von der Klinikerin oder dem Kliniker bestätigt, ${p.n} Änderung${p.n > 1 ? 'en' : ''} am Vorschlag`, 'rep.ch.segConf': 'Von der Klinikerin oder dem Kliniker wie vorgeschlagen bestätigt',
    'rep.ch.auto': 'Automatischer Vorschlag, nicht bestätigt', 'rep.ch.clnConf': '{how}, {k} von 19 Komponenten entfernt', 'rep.ch.changed': 'Von der Klinikerin oder dem Kliniker geändert',
    'rep.ch.asProp': 'Wie vorgeschlagen übernommen', 'rep.ch.clnAuto': 'Automatischer Vorschlag, {k} von 19 Komponenten entfernt, nicht bestätigt',
    'rep.ch.mkSet': '{hz} Hz, von der Klinikerin oder dem Kliniker gesetzt', 'rep.ch.mkNot': '{hz} Hz, nicht bestätigt', 'rep.ch.apfConf': 'Alpha-Peak {hz} Hz (automatisch), von der Klinikerin oder dem Kliniker bestätigt',
    'rep.ch.apfNot': 'Alpha-Peak {hz} Hz (automatisch), nicht bestätigt',
    'c.intro': 'Dieser Bericht stellt die EEG-, ERP- und VCPT-Messungen von {name}, Alter {age}, vom {recording_date} in der Klinik C dar. Jeder Wert wird mit der Altersnorm verglichen.',
    'c.introStd': 'Dieser Bericht stellt die EEG-, ERP- und VCPT-Messungen von {name}, Alter {age}, vom {recording_date} dar. Jeder Wert wird mit der Altersnorm verglichen.',
    'c.addr1': '[Platzhalter Klinikadresse]', 'c.addr2': '[Platzhalter Telefon und E-Mail]',
    'c.by.company': 'Hersteller (auf Anfrage)', 'c.by.admin': 'Administration des Herstellers', 'c.h.created': 'Aus der Standardvorlage des Herstellers erstellt',
    'c.h.logo': 'Logo-Platzhalter, Akzentfarbe', 'c.h.cmp': 'Vergleich mit der früheren Messung hinzugefügt', 'c.h.std': 'Layout Firmenstandard: Titelband, nummerierte Abschnitte, laufende Kopfzeile',
    'c.ck.segments': 'Segmente', 'c.ck.cleaning': 'Bereinigung', 'c.ck.marker': 'Frequenzmarker', 'c.ck.notConf': '{l} nicht bestätigt', 'c.ck.pend': (p) => `${p.l}: ${p.n} Änderung${p.n === 1 ? '' : 'en'}, Bestätigung ausstehend`, 'c.ck.conf': '{l} bestätigt',
    'c.ck.empty': '{l} ist leer', 'c.ck.written': '{l} geschrieben', 'c.ck.emptyC': (p) => p.l + ' ist leer',
    'c.nPages': (p) => `${p.n} Seite${p.n === 1 ? '' : 'n'}`, 'c.nWarn': (p) => `${p.n} Warnung${p.n > 1 ? 'en' : ''}`, 'c.nBlocks': '{n} Blöcke',
    'c.corrTitle': 'Bericht v{n} korrigieren', 'c.corrOk': 'Version {m} beginnen', 'c.corrReason': 'Grund der Korrektur (bleibt in der Versionsgeschichte erhalten)',
    'c.corrPh': 'Zum Beispiel: Tippfehler in der Anamnese', 'c.corrInfo': 'Version {n} bleibt freigegeben, bis Version {m} freigegeben ist. Beide Versionen bleiben erhalten.',
    'c.corrErr': 'Bitte einen Grund angeben.', 'c.log.corr': 'Korrektur v{m} von Bericht R-MOCK-042 begonnen: {why}', 'c.toast.corr': 'Entwurf v{m} begonnen. v{n} bleibt freigegeben.',
    'c.issueTitle': 'Bericht v{v} freigeben', 'c.issueOk': 'v{v} freigeben', 'c.report': 'Bericht', 'c.template': 'Vorlage', 'c.signedBy': 'Signiert von', 'c.noWarn': 'Keine Warnungen',
    'c.reviewed': 'Ich habe das Roh-EEG, die ausgewerteten Segmente und die vollständigen Ergebnisse geprüft', 'c.issueInfo': 'Eine freigegebene Version kann nicht bearbeitet werden. Eine Korrektur erzeugt eine neue Version.',
    'c.firstIssue': 'Erstfreigabe', 'c.log.issued': 'Bericht R-MOCK-042 v{v} (Vorlage {tid} v{tv}) nach bestätigter Prüfung von Roh-EEG, Segmenten und Ergebnissen freigegeben',
    'c.toast.issued': 'Bericht v{v} freigegeben',
    'c.outline': 'Gliederung', 'c.docAria': 'Dokument', 'c.fit': 'Einpassen', 'c.marks': 'Bearbeitungsmarken', 'c.log.addc': '{l} hinzugefügt', 'c.log.rmc': '{l} entfernt',
    'c.locked': 'Gesperrt: vom Hersteller geprüfter Block', 'c.clinicLocked': 'Klinikblock: in der Berichtsvorlage ändern', 'c.saved': 'Entwurf gespeichert {t}',
    'c.log.tpl': 'Vorlage des Berichtsentwurfs v{v} von {a} auf {b} v{tv} geändert ({name})', 'c.toast.tpl': 'Vorlage {name} angewendet. Geräteblöcke und Abbildungen bleiben unverändert.',
    'c.log.lang': 'Berichtssprache auf {lang} gesetzt', 'c.log.edit': '{l} im Berichtsentwurf v{v} bearbeitet ({n} Zeichen)', 'c.pagesA4': '{p} · A4',
    'c.issuedV': 'Freigegeben v{v}', 'c.issuedBan': 'Am {at} von Kliniker 1 freigegeben. Nur lesbar.', 'c.openIssued': 'Freigegebene Version öffnen', 'c.correct': 'Korrigieren', 'c.corrV': 'Korrektur v{v}',
    'c.staysIssued': 'Version {a} bleibt freigegeben, bis Version {b} freigegeben ist.', 'c.reasonX': 'Grund: {r}', 'c.viewV': 'v{v} ansehen',
    'c.langBan': 'Bericht auf {r}; die Oberfläche bleibt auf {ui}.', 'c.reportLangB': 'Berichtssprache',
    'c.kind.device': 'Gerät', 'c.kind.clinic': 'Klinik', 'c.kind.clinician': 'Kliniker', 'c.comment': 'Kommentar', 'c.commentOn': 'Kommentar: {b}', 'c.empty': 'leer', 'c.emptyT': 'Leer',
    'c.hdrItem': 'Klinikkopf', 'c.draft': 'Entwurf', 'c.issued': 'Freigegeben', 'c.edit': 'Bearbeiten', 'c.pages': 'Seiten', 'c.author': 'Verfasst von',
    'c.tplFor': 'Vorlage für diesen Bericht', 'c.reportLang': 'Berichtssprache', 'c.choices': 'Im Bericht genannte Entscheidungen', 'c.open': 'offen', 'c.before': 'Vor der Freigabe',
    'c.atIssue': 'Prüfungen bei der Freigabe', 'c.ready': 'bereit', 'c.locks': '{n} Geräteblöcke gesperrt', 'c.issueBtn': 'v{v} freigeben…', 'c.confFirst': 'Zuerst Segmente und Bereinigung bestätigen',
    'c.confFirstL': 'Bestätigen Sie vor der Freigabe die Segmente und die Bereinigung.', 'c.correctThis': 'Diesen Bericht korrigieren', 'c.rmComment': 'Diesen Kommentar entfernen', 'c.remove': 'Entfernen',
    'c.addComment': '+ Kommentar', 'c.addCommentT': 'Kommentar der Klinikerin oder des Klinikers nach diesem Abschnitt hinzufügen',
    'c.noIssued': 'Noch kein freigegebener Bericht', 'c.isDraft': 'Der Bericht zu dieser Messung ist ein Entwurf (v{v}).', 'c.openDraft': 'Berichtsentwurf öffnen',
    'c.corrProg': 'Korrektur v{v} in Arbeit', 'c.openDraftV': 'Entwurf v{v} öffnen', 'c.ivAria': 'Freigegebener Bericht', 'c.tplUsed': 'Für diese Version verwendete Vorlage',
    'c.replacedBy': 'Ersetzt durch v{v}', 'c.version': 'Version', 'c.zoomOut': 'Verkleinern', 'c.zoomIn': 'Vergrößern', 'c.fitWidth': 'Breite einpassen', 'c.download': '⤓ PDF herunterladen',
    'c.pageN': 'Seite {n}', 'c.issuedAtBy': 'Freigegeben am {at} von Kliniker 1', 'c.tplLine': 'Vorlage {tid} v{tv} · {name}', 'c.checksum': 'Prüfsumme {h}',
    'c.history': 'Versionsgeschichte', 'c.keptAll': 'Jede freigegebene Version bleibt erhalten', 'c.th.version': 'Version', 'c.th.status': 'Status', 'c.th.issued': 'Freigegeben',
    'c.th.by': 'Von', 'c.th.reason': 'Grund', 'c.th.template': 'Vorlage', 'c.th.pages': 'Seiten', 'c.notIssued': 'nicht freigegeben', 'c.current': 'Freigegeben, aktuell',
    'c.log.viewed': 'Freigegebenen Bericht R-MOCK-042 v{v} angesehen', 'c.log.dl': 'R-MOCK-042 v{v} als PDF heruntergeladen', 'c.toast.dl': 'R-MOCK-042 v{v}.pdf heruntergeladen (Mockup: es wird keine Datei erzeugt)',
    'c.d.added': '{l} hinzugefügt', 'c.d.removed': '{l} entfernt', 'c.d.order': 'Reihenfolge der Blöcke', 'c.d.intro': 'Einleitungstext ({lang})', 'c.d.header': 'Kopfzeilen ({lang})',
    'c.d.font': 'Schrift {f}', 'c.d.hfont': 'Schrift der Überschriften {f}', 'c.d.accent': 'Akzentfarbe', 'c.d.logo': 'Position des Logos', 'c.d.addrOn': 'Kopfzeilen angezeigt',
    'c.d.addrOff': 'Kopfzeilen ausgeblendet', 'c.d.pageOf': 'Seitennummerierung', 'c.d.comOn': 'Kommentare erlaubt', 'c.d.comOff': 'Kommentare ausgeschaltet',
    'c.crumbTpl': 'Berichtsvorlagen', 'c.tplAria': 'Vorlagen', 'c.companyTpl': 'Vorlage des Herstellers', 'c.clinicTpl': 'Vorlage der Klinik', 'c.usedBy': ' · verwendet für MOCK-042',
    'c.chipCompany': 'Hersteller', 'c.chipClinic': 'Klinik', 'c.inUse': 'v{v} in Verwendung für den Berichtsentwurf MOCK-042', 'c.avail': 'v{v} für Berichtsentwürfe verfügbar',
    'c.keepVer': ' · freigegebene Berichte behalten die Version, mit der sie freigegeben wurden', 'c.discard': 'Verwerfen', 'c.saveAs': 'Als {id} v{v} speichern', 'c.blocksIn': 'Blöcke in dieser Vorlage',
    'c.dragHint': 'zum Umordnen ziehen', 'c.addBlocks': 'Blöcke hinzufügen', 'c.clinicTexts': 'Kliniktexte', 'c.textLang': 'Sprache des Textes', 'c.insert': 'Einfügen',
    'c.hdr1': 'Kopfzeile 1', 'c.hdr2': 'Kopfzeile 2', 'c.preview': 'Vorschau, Seiten 1 und 2', 'c.pvSub': 'MOCK-042 · synthetische Daten · {lang}', 'c.theme': 'Gestaltung',
    'c.font': 'Schrift', 'c.fontStandin': '{f} (Firmenstandard)', 'c.hfont': 'Schrift der Überschriften', 'c.accent': 'Akzentfarbe', 'c.accentA': 'Akzent {a}', 'c.logo': 'Logo', 'c.replace': 'Ersetzen…', 'c.logoL': 'Logo links',
    'c.logoR': 'Logo rechts', 'c.header': 'Kopfbereich', 'c.showHdr': 'Kopfzeilen anzeigen', 'c.footer': 'Fußzeile', 'c.pageOf': 'Seite n von N',
    'c.always': 'Immer gedruckt: Mockup-Hinweis, Versionen, Berichtsnummer und Status.', 'c.stdStyle': ' Firmenstil: Titelband, römische Abschnittsnummern, kursive Kopfzeile ab Seite 2, limettengrünes Fußband.',
    'c.figFixed': 'Die Farben der Abbildungen sind fest.', 'c.figSame': 'Die z-Skala ist in jedem Klinikstil gleich.', 'c.tplVersions': 'Versionen der Vorlage',
    'c.toast.saveFirst': 'Zuerst die Änderungen an {id} speichern oder verwerfen', 'c.log.openTpl': 'Berichtsvorlage {id} geöffnet ({name})',
    'c.toast.logo': 'Logodateien werden im Mockup nicht verwendet; der Platzhalter bleibt', 'c.log.review': 'Kliniktexte von {id} zur Prüfung an den Hersteller gesendet: {w}',
    'c.toast.review': 'Zur Prüfung an den Hersteller gesendet. Speichern ist möglich, sobald die Wörter entfernt oder freigegeben sind.', 'c.toast.noChg': 'Keine ungespeicherten Änderungen', 'c.toast.disc': 'Änderungen verworfen',
    'c.fixedStd': 'Titelband, Logo und Identität der Patientin oder des Patienten', 'c.fixedC': 'Klinikkopf und Identität der Patientin oder des Patienten', 'c.fixedT': 'Fest oben auf Seite 1', 'c.fixed': 'fest',
    'c.reqT': 'In jeder Vorlage erforderlich: kann nicht entfernt werden', 'c.up': 'Nach oben', 'c.down': 'Nach unten', 'c.reqBlock': 'Pflichtblock', 'c.addBtn': '+ Hinzufügen',
    'c.allIn': 'Alle in der Vorlage', 'c.add.device': 'Geräteblöcke', 'c.add.clinic': 'Klinikblöcke', 'c.add.clinician': 'Klinikerblöcke',
    'c.comments': 'Kommentare der Klinikerin oder des Klinikers nach Ergebnisabschnitten', 'c.needsRev': 'Prüfung durch den Hersteller nötig.', 'c.claimWords': (p) => `Unzulässige${p.n > 1 ? '' : 'r'} Begriff${p.n > 1 ? 'e' : ''} in Kliniktexten:`,
    'c.sendRev': 'Zur Prüfung an den Hersteller senden', 'c.noClaims': '✓ Keine unzulässigen Begriffe in Kliniktexten', 'c.needsRevT': 'Prüfung durch den Hersteller nötig', 'c.noChanges': 'Keine Änderungen',
    'c.unsaved': 'Ungespeicherte Änderungen', 'c.savedChip': 'Gespeichert', 'c.saveBlocked': 'Speichern gesperrt', 'c.saveBlockedT': 'Prüfung durch den Hersteller nötig: {w} aus den Kliniktexten entfernen.',
    'c.inUseChip': 'in Verwendung', 'c.log.saveTpl': 'Berichtsvorlage {id} als Version {v} gespeichert: {change}',
    'c.toast.saved': 'Vorlage {id} v{v} gespeichert. Berichtsentwürfe verwenden sie ab jetzt; freigegebene Berichte behalten ihre Version.',
  },
});
/* second dictionary: block catalogue of table 3.3, issued-by block, template roles (3.5) */
A.addI18n({
  en: {
    'c.blk.coherence': 'Coherence per electrode pair', 'c.blk.erp': 'ERP peak values', 'c.blk.asymmetry': 'Asymmetry maps', 'c.blk.spectra_ch': 'Spectra per electrode',
    'c.blk.maps_1hz': 'Maps per 1 Hz band', 'c.blk.erp_waves': 'Channel ERP waveforms, Go and NoGo', 'c.blk.errors': 'Errors per block of 40 trials',
    'c.blk.raw': 'Raw EEG excerpts', 'c.blk.coh_global': 'Global coherence', 'c.blk.issuedby': 'Issued by',
    'c.cat.raw': 'display only', 'c.cat.coh_global': 'to confirm',
    'rep.cohCap': 'Marked electrode pairs: they differ from the age norm after correction for multiple comparisons.', 'rep.noneMarked': 'No marked electrode pairs.',
    'rep.mapsCap': 'Maps: absolute power against the age norm; circles mark marked electrodes. Table: absolute (abs) and relative (rel) power, z per electrode; coloured cells are marked values.',
    'rep.zKey': 'Coloured z cells are marked values.', 'rep.movedKey': '* moved by the clinician',
    'rep.asyCap': 'Asymmetry index (right minus left) / (right plus left) per homologous pair, z against the age norm. Each map draws a pair at both of its electrodes; circles mark marked pairs.',
    'rep.spCap': 'Log power from 1 to 30 Hz at each electrode. Grey band: age norm, mean plus or minus 2 SD. Dots: marked frequency bins.',
    'rep.m1Cap': 'z maps of absolute power per 1 Hz band (labels in Hz); circles mark marked electrodes.',
    'rep.erpCap': 'From -200 to 800 ms around the picture, positive up. Grey band: age norm, mean plus or minus 2 SD. Triangles: peaks in the peak table (open: moved by the clinician).',
    'rep.errCap': 'Errors per block of 40 trials, shown without norms.', 'rep.block': 'Block', 'rep.errors': 'Errors',
    'rep.rawCap': 'Excerpts of 10 seconds, average reference, {u} µV between baselines. Display only: no value in this report is read from them.',
    'rep.cohgCap': 'Mean coherence over all 171 electrode pairs. To confirm for the first release.',
    'rep.ib.by': 'Name', 'rep.ib.qual': 'Qualification', 'rep.ib.at': 'Date and time', 'rep.ib.version': 'Version', 'rep.ib.replaces': 'Replaces', 'rep.ib.reason': 'Reason for the correction',
    'rep.ib.name': 'Clinician 1', 'rep.ib.q': 'Licensed psychologist', 'rep.ib.onIssue': 'added on issue', 'rep.ib.first': 'No earlier version (first issue)',
    'rep.ch.peaks': 'ERP peaks',
    'c.ck.peaks': 'ERP peaks, {t} trials',
    'c.edit': 'Open',
    'c.viewAs': 'View as', 'c.asClinic': 'Clinic user', 'c.asCompany': 'Company staff (first release)',
    'c.relNote': 'First release: the company edits templates; later: clinics edit their own.',
    'c.roBan': 'Read only for clinic users. In the first release the company sets up templates on request.', 'c.roChip': 'read only',
    'c.reqBtn': 'Request a change…', 'c.reqTitle': 'Request a change to {id}', 'c.reqOk': 'Send request', 'c.reqWhat': 'What should change?',
    'c.reqPh': 'For example: show the asymmetry maps after the coherence block', 'c.reqInfo': 'The company makes the change and publishes a new template version. Issued reports keep their version.',
    'c.reqErr': 'Describe the change.', 'c.log.req': 'Requested a change to report template {id}: {txt}', 'c.toast.req': 'Request sent to the company',
    'c.reqs': 'Change requests', 'c.reqSent': 'sent to the company', 'c.who.staff': 'Company staff',
    'c.comments': 'Clinician comments after result sections: always allowed',
  },
  de: {
    'c.blk.coherence': 'Kohärenz je Elektrodenpaar', 'c.blk.erp': 'ERP-Peakwerte', 'c.blk.asymmetry': 'Asymmetriekarten', 'c.blk.spectra_ch': 'Spektren je Elektrode',
    'c.blk.maps_1hz': 'Karten je 1-Hz-Band', 'c.blk.erp_waves': 'Kanal-ERP-Kurven, Go und NoGo', 'c.blk.errors': 'Fehler je Block von 40 Durchgängen',
    'c.blk.raw': 'Roh-EEG-Ausschnitte', 'c.blk.coh_global': 'Globale Kohärenz', 'c.blk.issuedby': 'Freigegeben von',
    'c.cat.raw': 'nur Anzeige', 'c.cat.coh_global': 'zu bestätigen',
    'rep.cohCap': 'Markierte Elektrodenpaare: Sie weichen nach Korrektur für multiples Testen von der Altersnorm ab.', 'rep.noneMarked': 'Keine markierten Elektrodenpaare.',
    'rep.mapsCap': 'Karten: absolute Leistung gegen die Altersnorm; Kreise zeigen markierte Elektroden. Tabelle: absolute (abs) und relative (rel) Leistung, z je Elektrode; farbige Zellen sind markierte Werte.',
    'rep.zKey': 'Farbige z-Zellen sind markierte Werte.', 'rep.movedKey': '* von der Klinikerin oder dem Kliniker verschoben',
    'rep.asyCap': 'Asymmetrieindex (rechts minus links) / (rechts plus links) je homologem Paar, z gegen die Altersnorm. Jede Karte zeigt ein Paar an beiden Elektroden; Kreise zeigen markierte Paare.',
    'rep.spCap': 'Log-Leistung von 1 bis 30 Hz an jeder Elektrode. Graues Band: Altersnorm, Mittelwert plus oder minus 2 SD. Punkte: markierte Frequenzschritte.',
    'rep.m1Cap': 'z-Karten der absoluten Leistung je 1-Hz-Band (Beschriftung in Hz); Kreise zeigen markierte Elektroden.',
    'rep.erpCap': 'Von -200 bis 800 ms um das Bild, positiv nach oben. Graues Band: Altersnorm, Mittelwert plus oder minus 2 SD. Dreiecke: Peaks der Peaktabelle (offen: von der Klinikerin oder dem Kliniker verschoben).',
    'rep.errCap': 'Fehler je Block von 40 Durchgängen, ohne Normen dargestellt.', 'rep.block': 'Block', 'rep.errors': 'Fehler',
    'rep.rawCap': 'Ausschnitte von 10 Sekunden, Durchschnittsreferenz, {u} µV zwischen den Grundlinien. Nur zur Anzeige: kein Wert dieses Berichts wird daraus abgelesen.',
    'rep.cohgCap': 'Mittlere Kohärenz über alle 171 Elektrodenpaare. Für die erste Ausbaustufe noch zu bestätigen.',
    'rep.ib.by': 'Name', 'rep.ib.qual': 'Qualifikation', 'rep.ib.at': 'Datum und Uhrzeit', 'rep.ib.version': 'Version', 'rep.ib.replaces': 'Ersetzt', 'rep.ib.reason': 'Grund der Korrektur',
    'rep.ib.name': 'Kliniker 1', 'rep.ib.q': 'Zugelassener Psychologe', 'rep.ib.onIssue': 'wird bei der Freigabe ergänzt', 'rep.ib.first': 'Keine frühere Version (Erstfreigabe)',
    'rep.ch.peaks': 'ERP-Peaks',
    'c.ck.peaks': 'ERP-Peaks, {t}-Durchgänge',
    'c.edit': 'Öffnen',
    'c.viewAs': 'Ansicht als', 'c.asClinic': 'Klinikbenutzer', 'c.asCompany': 'Mitarbeitende des Herstellers (erste Ausbaustufe)',
    'c.relNote': 'Erste Ausbaustufe: Der Hersteller bearbeitet die Vorlagen; später bearbeiten Kliniken ihre eigenen.',
    'c.roBan': 'Für Klinikbenutzer nur lesbar. In der ersten Ausbaustufe richtet der Hersteller die Vorlagen auf Anfrage ein.', 'c.roChip': 'nur lesbar',
    'c.reqBtn': 'Änderung anfragen…', 'c.reqTitle': 'Änderung an {id} anfragen', 'c.reqOk': 'Anfrage senden', 'c.reqWhat': 'Was soll geändert werden?',
    'c.reqPh': 'Zum Beispiel: Asymmetriekarten nach dem Kohärenzblock zeigen', 'c.reqInfo': 'Der Hersteller nimmt die Änderung vor und veröffentlicht eine neue Version der Vorlage. Freigegebene Berichte behalten ihre Version.',
    'c.reqErr': 'Bitte die Änderung beschreiben.', 'c.log.req': 'Änderung an Berichtsvorlage {id} angefragt: {txt}', 'c.toast.req': 'Anfrage an den Hersteller gesendet',
    'c.reqs': 'Änderungsanfragen', 'c.reqSent': 'an den Hersteller gesendet', 'c.who.staff': 'Mitarbeitende des Herstellers',
    'c.comments': 'Kommentare der Klinikerin oder des Klinikers nach Ergebnisabschnitten: immer erlaubt',
  },
});

/* ---------------- fixed sentences for the clinician's choices (3.4), in the report language ----------------
   Each restates a choice and a measured value against the norm; ids are traceable like APP.sentences. */
const CS = {
  en: {
    'Q-SEG-MAN-1': (p) => `${p.cond}: ${p.a} of ${p.r} seconds were analysed after artefact removal; the clinician changed the proposed segments (proposal: ${p.p} seconds).`,
    'Q-SEG-CONF-1': () => 'The analysed segments were confirmed by the clinician as proposed.',
    'Q-SEG-CONF-2': (p) => `The analysed segments were confirmed by the clinician with ${p.n} change${p.n === 1 ? '' : 's'} to the proposal.`,
    'Q-SEG-AUTO-1': () => 'The analysed segments are the automatic proposal; the clinician has not confirmed them.',
    'Q-SEG-PEND-1': (p) => `The analysed segments include ${p.n} change${p.n === 1 ? '' : 's'} by the clinician to the proposal, pending confirmation.`,
    'MK-MOVED-1': (p) => `Alpha peak frequency, eyes closed (posterior mean): suggested ${p.a} Hz, confirmed at ${p.b} Hz by the clinician; ${p.st}.`,
    'MK-CONF-1': (p) => `Alpha peak frequency, eyes closed (posterior mean): suggested ${p.a} Hz, confirmed unchanged by the clinician; ${p.st}.`,
    'MK-AUTO-1': (p) => `Alpha peak frequency, eyes closed (posterior mean): suggested ${p.a} Hz, not confirmed by the clinician; ${p.st}.`,
    'ERP-PEAK-MAN-1': (p) => `${p.c} at ${p.s}, ${p.t} trials: the suggested peak at ${p.a} ms was moved by the clinician to ${p.b} ms. Latency: ${p.stl}; amplitude ${p.u} µV: ${p.sta}.`,
    'ERP-PEAK-CONF-1': (p) => `ERP peaks, ${p.t} trials: the suggested peaks were confirmed unchanged by the clinician.`,
    'ERP-PEAK-CONF-2': (p) => `ERP peaks, ${p.t} trials: confirmed by the clinician; ${p.n} peak${p.n === 1 ? '' : 's'} moved, the others unchanged.`,
    'ERP-PEAK-AUTO-1': (p) => `ERP peaks, ${p.t} trials: automatic suggestions, not confirmed by the clinician.`,
    'ERP-PEAK-PEND-1': (p) => `ERP peaks, ${p.t} trials: automatic suggestions; ${p.n} move${p.n === 1 ? '' : 's'} by the clinician pending confirmation.`,
    'SUM-CHG-1': (p) => `Marked after the clinician's confirmed changes: ${p.l}.`,
    'SUM-CHG-2': (p) => `No longer marked after the clinician's confirmed changes: ${p.l}.`,
    'SUM-CHG-3': () => 'The ranked list and the counts above use the suggested values.',
    item: (k, c, t, s, z) => `${c} ${k === 'lat' ? 'latency' : 'amplitude'}, ${t}: ${s} (z = ${z})`,
    apf: (z) => `alpha peak frequency, eyes closed: posterior mean (z = ${z})`,
    st: { not: 'not marked', above: 'above the age norm', below: 'below the age norm', later: 'later than the age norm', earlier: 'earlier than the age norm', moreNeg: 'more negative than the age norm', lessNeg: 'less negative than the age norm' },
  },
  de: {
    'Q-SEG-MAN-1': (p) => `${p.cond}: ${p.a} von ${p.r} Sekunden wurden nach der Artefaktentfernung ausgewertet; die Klinikerin oder der Kliniker hat die vorgeschlagenen Segmente geändert (Vorschlag: ${p.p} Sekunden).`,
    'Q-SEG-CONF-1': () => 'Die ausgewerteten Segmente wurden von der Klinikerin oder dem Kliniker wie vorgeschlagen bestätigt.',
    'Q-SEG-CONF-2': (p) => `Die ausgewerteten Segmente wurden von der Klinikerin oder dem Kliniker mit ${p.n} Änderung${p.n === 1 ? '' : 'en'} am Vorschlag bestätigt.`,
    'Q-SEG-AUTO-1': () => 'Die ausgewerteten Segmente sind der automatische Vorschlag; die Klinikerin oder der Kliniker hat sie nicht bestätigt.',
    'Q-SEG-PEND-1': (p) => `Die ausgewerteten Segmente enthalten ${p.n} Änderung${p.n === 1 ? '' : 'en'} der Klinikerin oder des Klinikers am Vorschlag; die Bestätigung steht aus.`,
    'MK-MOVED-1': (p) => `Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen ${p.a} Hz, von der Klinikerin oder dem Kliniker bei ${p.b} Hz bestätigt; ${p.st}.`,
    'MK-CONF-1': (p) => `Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen ${p.a} Hz, von der Klinikerin oder dem Kliniker unverändert bestätigt; ${p.st}.`,
    'MK-AUTO-1': (p) => `Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen ${p.a} Hz, von der Klinikerin oder dem Kliniker nicht bestätigt; ${p.st}.`,
    'ERP-PEAK-MAN-1': (p) => `${p.c} an ${p.s}, ${p.t}-Durchgänge: Der vorgeschlagene Peak bei ${p.a} ms wurde von der Klinikerin oder dem Kliniker auf ${p.b} ms verschoben. Latenz: ${p.stl}; Amplitude ${p.u} µV: ${p.sta}.`,
    'ERP-PEAK-CONF-1': (p) => `ERP-Peaks, ${p.t}-Durchgänge: Die vorgeschlagenen Peaks wurden von der Klinikerin oder dem Kliniker unverändert bestätigt.`,
    'ERP-PEAK-CONF-2': (p) => `ERP-Peaks, ${p.t}-Durchgänge: von der Klinikerin oder dem Kliniker bestätigt; ${p.n} Peak${p.n === 1 ? '' : 's'} verschoben, die übrigen unverändert.`,
    'ERP-PEAK-AUTO-1': (p) => `ERP-Peaks, ${p.t}-Durchgänge: automatische Vorschläge, von der Klinikerin oder dem Kliniker nicht bestätigt.`,
    'ERP-PEAK-PEND-1': (p) => `ERP-Peaks, ${p.t}-Durchgänge: automatische Vorschläge; ${p.n} Verschiebung${p.n === 1 ? '' : 'en'} der Klinikerin oder des Klinikers, Bestätigung ausstehend.`,
    'SUM-CHG-1': (p) => `Nach den bestätigten Änderungen der Klinikerin oder des Klinikers markiert: ${p.l}.`,
    'SUM-CHG-2': (p) => `Nach den bestätigten Änderungen der Klinikerin oder des Klinikers nicht mehr markiert: ${p.l}.`,
    'SUM-CHG-3': () => 'Die geordnete Liste und die Zählung oben beruhen auf den vorgeschlagenen Werten.',
    item: (k, c, t, s, z) => `${c}-${k === 'lat' ? 'Latenz' : 'Amplitude'}, ${t}: ${s} (z = ${z})`,
    apf: (z) => `Alpha-Peak-Frequenz, Augen geschlossen: posteriorer Mittelwert (z = ${z})`,
    st: { not: 'nicht markiert', above: 'über der Altersnorm', below: 'unter der Altersnorm', later: 'später als die Altersnorm', earlier: 'früher als die Altersnorm', moreNeg: 'negativer als die Altersnorm', lessNeg: 'weniger negativ als die Altersnorm' },
  },
};
const cs = (L, id, p) => ({ id, text: (CS[L] || CS.en)[id](p || {}) });
/* "not marked (z = 0.4)" or "later than the age norm (z = 3.7)": kind 'v' value, 'lat' latency, 'neg' negative component */
function zState(L, z, marked, kind) {
  const S = (CS[L] || CS.en).st, w = !marked ? S.not : kind === 'lat' ? (z > 0 ? S.later : S.earlier) : kind === 'neg' ? (z < 0 ? S.moreNeg : S.lessNeg) : (z > 0 ? S.above : S.below);
  return `${w} (z = ${fx(z, 1, L)})`;
}
/* Benjamini-Hochberg within one block (stand-in rule M33): is value i of the block marked? */
const Phi = (x) => { const u = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.3275911 * u);
  const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-u * u); return x >= 0 ? (1 + e) / 2 : (1 - e) / 2; };
function bhMarked(zs, i) {
  const q = (M2.marking && M2.marking.q) || 0.05, ps = zs.map(z => 2 * (1 - Phi(Math.abs(z)))), s = ps.slice().sort((a, b) => a - b); let thr = -1;
  s.forEach((p, k) => { if (p <= (k + 1) / s.length * q) thr = p; }); return ps[i] <= thr;
}
const r1 = (z) => Math.sign(z) * Math.round(Math.abs(z) * 10) / 10;
const NEG = new Set(['N1', 'N2', 'CNV']);
/* trial types with scored peaks (a latency the clinician can move); Ignore has none and needs no confirmation */
const PK_TRIALS = ['go', 'nogo', 'ignore', 'novelty'].filter(t => M2.erp.peaks.some(p => p.condition === t && p.latency_ms != null));

/* the clinician's choices as they stand now; an issued version keeps its own copy */
function snapNow() {
  const s = A.state, sg = s.segments || {}, mk = s.markers || {};
  return { seg: { confirmed: !!sg.confirmed, changes: typeof sg.changes === 'number' ? sg.changes : (sg.changes || []).length || 0, analysed: clone(sg.analysed || null), proposed: clone(sg.proposed || null) },
    mk: { confirmed: !!mk.confirmed, hz: mk.hz ?? null }, peaks: clone(s.peaks || {}) };
}
const segA = (sn, k) => { const a = ((sn || {}).seg || {}).analysed; return a && a[k] != null ? a[k] : (M2.quality.recordings[k] || {}).analysed_s; };
const segP = (sn, k) => { const a = ((sn || {}).seg || {}).proposed; return a && a[k] != null ? a[k] : (M2.quality.recordings[k] || {}).analysed_s; };
/* alpha peak, eyes closed: the suggestion, or the value the clinician moved it to and confirmed */
function apfOf(sn) {
  const ap = SP.EC.alpha_peak, sug = ap.hz, m = sn.mk;
  const st = m.confirmed ? (m.hz != null && Math.abs(m.hz - sug) > 1e-6 ? 'moved' : 'conf') : 'auto';
  if (st !== 'moved') return { st, sug, hz: sug, z: ap.z, marked: ap.marked };
  const z = r1((m.hz - ap.norm_mean) / ap.norm_sd);
  return { st, sug, hz: m.hz, z, marked: bhMarked([z, SP.EC.tbr.z, SP.EC.faa.z], 0) };
}
const mkSentence = (L, sn) => { const a = apfOf(sn), p = { a: fx(a.sug, 1, L), b: fx(a.hz, 1, L), st: zState(L, a.z, a.marked, 'v') };
  return cs(L, a.st === 'moved' ? 'MK-MOVED-1' : a.st === 'conf' ? 'MK-CONF-1' : 'MK-AUTO-1', p); };
/* ERP peaks: confirmed moves from the results module (APP.state.peaks) replace the suggested peak;
   z against the norm is recomputed (norm SD from the data, or the M5 model) and marked within its block */
function peaksOf(sn) {
  const P = sn.peaks || {};
  const list = M2.erp.peaks.map(p => {
    const st = P[p.condition], mv = st && st.confirmed && (st.moved || []).find(x => x.component === p.component && x.site === p.site);
    if (!mv || p.latency_ms == null || mv.to_ms == null || mv.to_ms === mv.from_ms) return { ...p };
    const lsd = p.norm_latency_sd ?? (2 + 0.05 * p.norm_latency_ms), asd = p.norm_amplitude_sd ?? Math.max(0.5, 0.2 * Math.abs(p.norm_amplitude_uv)), amp = mv.amplitude_uv ?? p.amplitude_uv;
    return { ...p, moved: { from: mv.from_ms ?? p.latency_ms, to: mv.to_ms }, latency_ms: mv.to_ms, amplitude_uv: amp, latency_z: r1((mv.to_ms - p.norm_latency_ms) / lsd), amplitude_z: r1((amp - p.norm_amplitude_uv) / asd) };
  });
  const lz = list.filter(p => p.latency_z != null);
  list.forEach((p, i) => { if (!p.moved) return; p.amplitude_marked = bhMarked(list.map(x => x.amplitude_z), i); p.latency_marked = bhMarked(lz.map(x => x.latency_z), lz.indexOf(p)); });
  return list;
}
function peakSentences(L, sn) {
  const P = sn.peaks || {}, pk = peaksOf(sn), out = [];
  PK_TRIALS.forEach(t => {
    const st = P[t] || {}, tl = trialL[t], mv = pk.filter(p => p.condition === t && p.moved);
    if (!st.confirmed) return out.push((st.moved || []).length ? cs(L, 'ERP-PEAK-PEND-1', { t: tl, n: st.moved.length }) : cs(L, 'ERP-PEAK-AUTO-1', { t: tl }));
    out.push(mv.length ? cs(L, 'ERP-PEAK-CONF-2', { t: tl, n: mv.length }) : cs(L, 'ERP-PEAK-CONF-1', { t: tl }));
    mv.forEach(p => out.push(cs(L, 'ERP-PEAK-MAN-1', { c: p.component, s: p.site, t: tl, a: p.moved.from, b: p.moved.to, u: fx(p.amplitude_uv, 1, L),
      stl: zState(L, p.latency_z, p.latency_marked, 'lat'), sta: zState(L, p.amplitude_z, p.amplitude_marked, NEG.has(p.component) ? 'neg' : 'v') })));
  });
  return out;
}
/* summary: values whose marked state changed through a confirmed move; the ranked list (SUM-2) and the
   counts (SUM-COUNT-1) come from the suggested values, so these sentences follow them */
function sumChanges(L, sn) {
  const on = [], off = [], E = CS[L] || CS.en;
  peaksOf(sn).forEach((p, i) => { if (!p.moved) return; const o = M2.erp.peaks[i];
    [['lat', 'latency'], ['amp', 'amplitude']].forEach(([k, f]) => { if (p[f + '_z'] == null || !!o[f + '_marked'] === !!p[f + '_marked']) return;
      (p[f + '_marked'] ? on : off).push(E.item(k, p.component, trialL[p.condition], p.site, fx(p[f + '_z'], 1, L))); }); });
  const a = apfOf(sn);
  if (a.st === 'moved' && !!a.marked !== !!SP.EC.alpha_peak.marked) (a.marked ? on : off).push(E.apf(fx(a.z, 1, L)));
  const out = [];
  if (on.length) out.push(cs(L, 'SUM-CHG-1', { l: on.join('; ') }));
  if (off.length) out.push(cs(L, 'SUM-CHG-2', { l: off.join('; ') }));
  return out.length ? out.concat([cs(L, 'SUM-CHG-3')]) : out;
}
const summaryList = (L, sn) => A.sentences[L].m2.summary.concat(sumChanges(L, sn));
const segChoice = (L, sn) => !sn.seg.confirmed ? (sn.seg.changes ? cs(L, 'Q-SEG-PEND-1', { n: sn.seg.changes }) : cs(L, 'Q-SEG-AUTO-1')) : sn.seg.changes ? cs(L, 'Q-SEG-CONF-2', { n: sn.seg.changes }) : cs(L, 'Q-SEG-CONF-1');
/* quality sentences: Q-DUR-1 restated from the segments the clinician chose, then the segment choice */
function qualityList(L, sn) {
  const keys = ['EO', 'EC', 'VCPT'], rec = M2.quality.recordings; let i = 0;
  const out = A.qualitySentences(L).map(s => { if (s.id !== 'Q-DUR-1') return s; const k = keys[i++]; if (!rec[k]) return s; const a = segA(sn, k);
    return a === segP(sn, k) ? s : cs(L, 'Q-SEG-MAN-1', { cond: T('cond.' + k, null, L), a, r: rec[k].recorded_s, p: segP(sn, k) }); });
  return out.concat([segChoice(L, sn)]);
}
/* shared with the Results tab, so both show the analysed seconds the clinician chose (fallback: the data) */
A.qualityNow = (L) => qualityList(L || A.lang, snapNow());
A.summaryNow = (L) => summaryList(L || A.lang, snapNow());
/* ERP sentences: library sentences of moved peaks give way to the clinician's confirmed choice */
function erpList(L, sn) {
  const drop = peaksOf(sn).filter(p => p.moved).map(p => new RegExp(`\\b${p.component}\\b[^.]*\\b${p.site}\\b[^.]*\\b${trialL[p.condition]}\\b`));
  return A.sentences[L].m2.erp.filter(s => !drop.some(re => re.test(s.text))).concat(peakSentences(L, sn));
}
A.erpNow = (L) => erpList(L || A.lang, snapNow());

/* ---------------- block catalogue ---------------- */
/* device blocks cover every Core row of table 3.3 (29 October); req: cannot be removed from a template (C4) */
const CAT = {
  intro: { kind: 'clinic' }, versions: { kind: 'device', req: true }, summary: { kind: 'device', result: true, req: true }, quality: { kind: 'device', req: true },
  raw: { kind: 'device', result: true }, spectra_EO: { kind: 'device', result: true }, spectra_EC: { kind: 'device', result: true }, spectra_ch: { kind: 'device', result: true },
  maps_1hz: { kind: 'device', result: true }, ratios: { kind: 'device', result: true }, asymmetry: { kind: 'device', result: true },
  coherence: { kind: 'device', result: true }, coh_global: { kind: 'device', result: true }, erp_waves: { kind: 'device', result: true }, erp: { kind: 'device', result: true },
  behaviour: { kind: 'device', result: true }, errors: { kind: 'device', result: true },
  comparison: { kind: 'device', result: true }, limits: { kind: 'device', req: true }, issuedby: { kind: 'device', req: true },
  anamnesis: { kind: 'clinician' }, interpretation: { kind: 'clinician' }, conclusion: { kind: 'clinician' },
};
/* the default template leaves out the raw EEG excerpts and global coherence, so "Add blocks" has real choices */
const DEF_BLOCKS = ['intro', 'versions', 'summary', 'quality', 'anamnesis', 'spectra_EO', 'spectra_EC', 'spectra_ch', 'maps_1hz', 'ratios', 'asymmetry', 'coherence',
  'erp_waves', 'erp', 'behaviour', 'errors', 'comparison', 'interpretation', 'conclusion', 'limits', 'issuedby'];
/* block heading in a language (the report's, or the interface's by default) */
const blkLabel = (id, L) => CAT[id] ? T('c.blk.' + id, { d: A.fmtDate(A.m1.date, L) }, L) : id;
/* a block named inside a sentence: "comment after signal quality" / "Kommentar nach Signalqualität" */
function labelOf(k, L) { return k.startsWith('comment.') ? T('c.lab.comment', { b: blkLabel(k.slice(8), L) }, L) : A.lc(blkLabel(k, L), L); }
const label = (k) => labelOf(k);
const blkRef = (k) => A.tk('c.blkRef', { k });
const R = (c, k, p) => T('rep.' + k, p, c.lang);
const tname = (id, L) => T('c.tpl.' + (TPLS[id] ? id : 'CT-C'), null, L);
const pick = (o, L) => (o && !Array.isArray(o) && (o[L] || o.en)) || o || [];
const textsFor = (cfg) => Object.fromEntries(TL.map(l => [l, { intro: T(cfg === 'std' ? 'c.introStd' : 'c.intro', null, l), addr1: T('c.addr1', null, l), addr2: T('c.addr2', null, l) }]));
const ctexts = (c) => c.cfg.texts[c.lang] || c.cfg.texts.en;

function ensure() {
  const t = A.state.template;
  if (!t.cfg) {
    t.cfg = { blocks: DEF_BLOCKS.slice(),
      theme: { font: 'Liberation Sans', accent: '#1c5cab', logo: 'left', addr: true, pageOf: false },
      texts: textsFor('c'), comments: true };
    t.history = [{ v: 1, at: '2026-01-12', by: 'c.by.company', change: [A.tk('c.h.created')] },
      { v: 2, at: '2026-03-03', by: 'c.by.company', change: [A.tk('c.h.logo')] },
      { v: 3, at: '2026-09-02', by: 'c.by.company', change: [A.tk('c.h.cmp')] }];
  }
  if (!t.std) t.std = { version: 2, cfg: { style: 'std', blocks: DEF_BLOCKS.slice(),
      theme: { font: 'Carlito', hfont: 'Fira Sans', accent: NAVY, logo: 'left', addr: true, pageOf: true },
      texts: textsFor('std'), comments: true },
    history: [{ v: 1, at: '2026-01-05', by: 'c.by.admin', change: [A.tk('c.h.std')] },
      { v: 2, at: '2026-09-01', by: 'c.by.admin', change: [A.tk('c.h.cmp')] }] };
  if (!t.requests) t.requests = []; if (!t.std.requests) t.std.requests = [];
  const r = A.state.report; if (!r.lang) r.lang = 'en'; if (!r.texts) r.texts = {}; if (!r.tpl) r.tpl = 'CT-C';
  return t;
}
const tpl = (id) => { const t = ensure(); return id === 'CT-STD' ? t.std : t; };
const nameIn = (L) => A.state.staffView ? T('nameHidden', null, L) : A.case.identity_store.display_name;
const fill = (s, L) => String(s || '').replace(/\{name\}/g, nameIn(L)).replace(/\{age\}/g, T('years', { n: 10 }, L)).replace(/\{recording_date\}/g, A.fmtDate(M2.date, L));
const claimHits = (s) => { const o = []; String(s || '').replace(CLAIM, m => { o.push(m); return m; }); return o; };
const histAt = (h, L) => typeof h.at === 'string' ? A.fmtDate(h.at, L) : A.at(h.at, L);
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const changeText = (ch) => Array.isArray(ch) ? cap(ch.map(x => A.pv(x)).join(', ')) : String(ch || '');

/* choices the clinician made upstream, stated in the report (in language L) */
function choices(L, sn = snapNow()) {
  const s = A.state, k = s.cleaning.removedCount ?? 3, t = (key, p) => T(key, p, L), P = sn.peaks || {};
  return [
    { k: t('rep.ch.segments'), ok: sn.seg.confirmed, v: segChoice(L, sn).text },
    { k: t('rep.ch.cleaning'), ok: s.cleaning.confirmed, v: s.cleaning.confirmed ? t('rep.ch.clnConf', { how: t((s.cleaning.changed || []).length ? 'rep.ch.changed' : 'rep.ch.asProp'), k }) : t('rep.ch.clnAuto', { k }) },
    { k: t('rep.ch.marker'), ok: sn.mk.confirmed, v: mkSentence(L, sn).text },
    { k: t('rep.ch.peaks'), ok: PK_TRIALS.every(x => (P[x] || {}).confirmed), v: peakSentences(L, sn).filter(x => x.id !== 'ERP-PEAK-MAN-1').map(x => x.text).join(' ') },
  ];
}

/* ---------------- figures ---------------- */
const MAPS = {};
const CHI = Object.fromEntries(A.channels.map((c, i) => [c, i]));
const markedCh = (flags) => A.channels.filter((_, i) => flags && flags[i]);
function mapURL(cond, band) {
  const key = cond + band; if (MAPS[key]) return MAPS[key];
  const B = SP[cond].bands[band], cv = document.createElement('canvas'); A.topo(cv, B.abs_z, { size: 96, marks: markedCh(B.abs_marked) });
  return (MAPS[key] = cv.toDataURL('image/png'));
}
function m1URL(cond, j) {
  const key = 'm1' + cond + j; if (MAPS[key]) return MAPS[key];
  const C = SP[cond], cv = document.createElement('canvas'); A.topo(cv, C.maps_1hz_z[j], { size: 42, marks: markedCh(C.maps_1hz_marked && C.maps_1hz_marked[j]) });
  return (MAPS[key] = cv.toDataURL('image/png'));
}
/* asymmetry: each homologous pair drawn at both of its electrodes, midline sites at the mean */
function asyURL(cond, band) {
  const key = 'as' + cond + band; if (MAPS[key]) return MAPS[key];
  const v = A.channels.map(() => 0), mk = [];
  SP[cond].asymmetry[band].forEach(x => x.pair.split('-').forEach(ch => { v[CHI[ch]] = x.z; if (x.marked) mk.push(ch); }));
  const cv = document.createElement('canvas'); A.topo(cv, v, { size: 60, marks: mk });
  return (MAPS[key] = cv.toDataURL('image/png'));
}
/* small multiples on the 10-20 layout: 5 x 5 cells, empty corners */
const G5 = [[null, 'Fp1', null, 'Fp2', null], ['F7', 'F3', 'Fz', 'F4', 'F8'], ['T3', 'C3', 'Cz', 'C4', 'T4'], ['T5', 'P3', 'Pz', 'P4', 'T6'], [null, 'O1', null, 'O2', null]];
const GW = 682, GCW = 132, GCH = 50, GGAP = 5, GH = 5 * GCH + 4 * GGAP;
function gridURL(key, panel) {
  if (MAPS[key]) return MAPS[key];
  const d = 2, cv = document.createElement('canvas'); cv.width = GW * d; cv.height = GH * d; const g = cv.getContext('2d'); g.scale(d, d);
  g.fillStyle = '#fff'; g.fillRect(0, 0, GW, GH); g.lineJoin = 'round';
  G5.forEach((row, r) => row.forEach((ch, k) => { if (!ch) return; g.save(); g.translate(k * (GCW + GGAP), r * (GCH + GGAP));
    g.strokeStyle = '#d6d5cf'; g.lineWidth = 0.6; g.strokeRect(0.5, 0.5, GCW - 1, GCH - 1); panel(g, ch, GCW, GCH);
    g.fillStyle = '#1f1f1e'; g.font = '600 9px "IBM Plex Sans", Arial, sans-serif'; g.fillText(ch, 4, 10); g.restore(); }));
  return (MAPS[key] = cv.toDataURL('image/png'));
}
function band(g, X, Y, lo, hi) { g.beginPath(); lo.forEach((v, i) => g[i ? 'lineTo' : 'moveTo'](X(i), Y(v))); for (let i = hi.length - 1; i >= 0; i--) g.lineTo(X(i), Y(hi[i])); g.closePath(); g.fill(); }
function line(g, X, Y, v) { g.beginPath(); v.forEach((y, i) => g[i ? 'lineTo' : 'moveTo'](X(i), Y(y))); g.stroke(); }
let SPR = null;
function specGrid(cond) {
  const f = M2.spectra.freqs, C = SP[cond];
  if (!SPR) { let lo = 1e9, hi = -1e9; ['EO', 'EC'].forEach(k => SP[k].log_power.forEach((r, i) => r.forEach((v, j) => { const m = SP[k].norm_log_mean[i][j], s = SP[k].norm_log_sd[i][j]; lo = Math.min(lo, v, m - 2 * s); hi = Math.max(hi, v, m + 2 * s); }))); SPR = [lo, hi]; }
  return gridURL('sp' + cond, (g, ch, w, h) => {
    const i = CHI[ch], X = (j) => 3 + j / (f.length - 1) * (w - 6), Y = (v) => h - 3 - (v - SPR[0]) / (SPR[1] - SPR[0]) * (h - 15);
    const mu = C.norm_log_mean[i], sd = C.norm_log_sd[i];
    g.fillStyle = '#e6e5e0'; band(g, X, Y, mu.map((m, j) => m - 2 * sd[j]), mu.map((m, j) => m + 2 * sd[j]));
    g.strokeStyle = '#a5a49f'; g.lineWidth = 0.8; line(g, X, Y, mu);
    g.strokeStyle = '#1f1f1e'; g.lineWidth = 1.1; line(g, X, Y, C.log_power[i]);
    (C.z_marked && C.z_marked[i] || []).forEach((m, j) => { if (!m) return; g.fillStyle = A.zColor(C.z[i][j]); g.beginPath(); g.arc(X(j), Y(C.log_power[i][j]), 2.4, 0, 7); g.fill(); g.strokeStyle = '#1f1f1e'; g.lineWidth = 0.5; g.stroke(); });
  });
}
let ERR = null;
function erpGrid(cond, pk) {
  const E = M2.erp, tm = E.times_ms, C = E.conditions[cond].channels;
  if (!ERR) { let m = 1; ['go', 'nogo'].forEach(k => Object.values(E.conditions[k].channels).forEach(o => o.patient_uv.forEach((v, j) => { m = Math.max(m, Math.abs(v), Math.abs(o.norm_mean_uv[j]) + 2 * o.norm_sd_uv[j]); }))); ERR = Math.ceil(m); }
  const mine = pk.filter(p => p.condition === cond && p.latency_ms != null);
  return gridURL('erp' + cond + mine.map(p => p.latency_ms).join(), (g, ch, w, h) => {
    const o = C[ch], X = (j) => 3 + j / (tm.length - 1) * (w - 6), Y = (v) => (h + 6) / 2 - v / ERR * (h - 14) / 2, Xt = (t) => X((t - tm[0]) / (tm[1] - tm[0]));
    g.strokeStyle = '#cfcec8'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(3, Y(0)); g.lineTo(w - 3, Y(0)); g.moveTo(Xt(0), 12); g.lineTo(Xt(0), h - 3); g.stroke();
    g.fillStyle = '#e6e5e0'; band(g, X, Y, o.norm_mean_uv.map((m, j) => m - 2 * o.norm_sd_uv[j]), o.norm_mean_uv.map((m, j) => m + 2 * o.norm_sd_uv[j]));
    g.strokeStyle = '#a5a49f'; g.lineWidth = 0.8; line(g, X, Y, o.norm_mean_uv);
    g.strokeStyle = '#1f1f1e'; g.lineWidth = 1.1; line(g, X, Y, o.patient_uv);
    mine.filter(p => p.site === ch).forEach(p => { const x = Xt(p.latency_ms), y = Y(p.amplitude_uv), up = p.amplitude_uv >= 0 ? -1 : 1;
      g.beginPath(); g.moveTo(x, y + up * 2); g.lineTo(x - 3.5, y + up * 8); g.lineTo(x + 3.5, y + up * 8); g.closePath();
      if (p.moved) { g.strokeStyle = '#1f1f1e'; g.lineWidth = 1; g.fillStyle = '#fff'; g.fill(); g.stroke(); } else { g.fillStyle = '#1f1f1e'; g.fill(); } });
  });
}
const RAW_UV = 50;
function rawURL(cond) {
  const key = 'raw' + cond; if (MAPS[key]) return MAPS[key];
  const R0 = M2.raw[cond], w = 334, sp = 12, h = A.channels.length * sp + 22, d = 2, cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
  const g = cv.getContext('2d'); g.scale(d, d); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const x0 = 26, n = R0.fs * R0.seconds;
  g.strokeStyle = '#ecebe6'; g.lineWidth = 0.5; g.fillStyle = '#77766f'; g.font = '8px "IBM Plex Mono", monospace';
  for (let s = 0; s <= R0.seconds; s++) { const x = x0 + s / R0.seconds * (w - x0 - 4); g.beginPath(); g.moveTo(x, 4); g.lineTo(x, h - 14); g.stroke(); if (s % 2 === 0) g.fillText(s + ' s', x - 6, h - 4); }
  A.channels.forEach((ch, i) => { const y0 = 10 + i * sp, v = R0.channels[ch]; g.fillStyle = '#1f1f1e'; g.fillText(ch, 1, y0 + 3);
    g.strokeStyle = '#1f1f1e'; g.lineWidth = 0.6; g.beginPath(); v.forEach((u, j) => g[j ? 'lineTo' : 'moveTo'](x0 + j / (n - 1) * (w - x0 - 4), y0 - u / RAW_UV * sp)); g.stroke(); });
  return (MAPS[key] = cv.toDataURL('image/png'));
}
function errorsSVG(L) {
  const e = M2.vcpt.errors_per_block, mx = Math.max(3, ...e), W = 330, H = 104, x0 = 26, y0 = 8, bw = (W - x0 - 6) / e.length, Y = (v) => H - 20 - v / mx * (H - 20 - y0);
  let o = `<svg class="c-err" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(T('c.blk.errors', null, L))}">`;
  for (let v = 0; v <= mx; v++) o += `<line x1="${x0}" x2="${W - 4}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e6e5e0" stroke-width="0.6"/><text x="${x0 - 5}" y="${Y(v) + 3}" text-anchor="end" font-size="8" fill="#77766f">${v}</text>`;
  e.forEach((v, i) => { const x = x0 + i * bw + 3; o += `<rect x="${x}" y="${Y(v)}" width="${bw - 6}" height="${Y(0) - Y(v)}" fill="#6b6f7d"/><text x="${x + (bw - 6) / 2}" y="${H - 9}" text-anchor="middle" font-size="8" fill="#55554f">${i + 1}</text>`; });
  return o + `<text x="${x0}" y="${H - 1}" font-size="8" fill="#77766f">${esc(T('rep.block', null, L))}</text></svg>`;
}
/* z cell: coloured only when the value is marked (correction for multiple comparisons, M33) */
const zc = (z, mk, L) => z == null ? '<td></td>' : mk ? `<td class="z mk" style="background:${A.zColor(z)};color:${A.zInk(z)}">${fx(z, 1, L)}</td>` : `<td class="z">${fx(z, 1, L)}</td>`;

const tbl = (head, rows) => `<table class="c-t"><tr>${head.map(h => `<th${h.endsWith(' ') ? ' class="n"' : ''}>${h.trim()}</th>`).join('')}</tr>${rows.join('')}</table>`;
const S_ = (c) => A.sentences[c.lang].m2;
const condL = (k, L) => T('condl.' + k, null, L);
const trialL = { go: 'Go', nogo: 'NoGo', ignore: 'Ignore', novelty: 'Novelty' };

/* ---------------- device blocks: fixed sentences, tables and maps (report language) ---------------- */
const DEV = {
  versions: (c) => `<table class="c-kv">${[[R(c, 'report'), `R-MOCK-042 v${c.v}, ${stLabel(c)}`], [R(c, 'template'), `${c.tid} v${c.tv}, ${tname(c.tid, c.lang)}, ${T('lang.' + c.lang, null, c.lang)}`],
    [R(c, 'software'), M2.processed_with.software], [R(c, 'norms'), A.dv(M2.processed_with.norms, c.lang)], [R(c, 'system'), A.dv(M2.recording_system, c.lang)],
    [R(c, 'measurement'), R(c, 'measV', { d: A.fmtDate(M2.date, c.lang), m: Math.round(M2.quality.recordings.VCPT.recorded_s / 60) })]]
    .map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>`,
  summary: (c) => A.sys(summaryList(c.lang, c.snap)),
  quality: (c) => { const q = M2.quality;
    return `<div class="c-qt">${tbl([R(c, 'recording'), R(c, 'recordedS') + ' ', R(c, 'analysed') + ' '], Object.entries(q.recordings).map(([k, v]) => `<tr><td>${T('cond.' + k, null, c.lang)}</td><td class="n">${v.recorded_s} s</td><td class="n">${segA(c.snap, k)} s</td></tr>`))}</div>${A.sys(c.quality)}`; },
  raw: (c) => `<div class="c-raw">${['EO', 'EC'].map(cd => `<figure class="c-map"><figcaption><b>${esc(T('cond.' + cd, null, c.lang))}</b></figcaption><img src="${rawURL(cd)}" width="334" height="${A.channels.length * 12 + 22}" alt=""></figure>`).join('')}</div><div class="c-cap">${R(c, 'rawCap', { u: RAW_UV })}</div>`,
  spectra_EO: (c) => spectra('EO', c), spectra_EC: (c) => spectra('EC', c),
  spectra_ch: (c) => ['EO', 'EC'].map(cd => `<div class="c-cap"><b>${esc(T('cond.' + cd, null, c.lang))}</b></div><img class="c-grid" src="${specGrid(cd)}" width="${GW}" height="${GH}" alt="">`).join('') + `<div class="c-cap">${R(c, 'spCap')}</div>`,
  maps_1hz: (c) => ['EO', 'EC'].map(cd => `<div class="c-cap"><b>${esc(T('cond.' + cd, null, c.lang))}</b></div><div class="c-m1">${SP[cd].maps_1hz_z.map((_, j) => `<figure class="c-map"><img src="${m1URL(cd, j)}" width="42" height="46" alt=""><figcaption>${j + 1}-${j + 2}</figcaption></figure>`).join('')}</div>`).join('') +
    `<div class="c-scl"><span class="c-cap">${R(c, 'm1Cap')}</span>${A.zScale(null, c.lang)}</div>`,
  ratios: (c) => { const L = c.lang, E = SP.EO, C = SP.EC, ap = apfOf(c.snap), r = [['tbrCz', 'EO', E.tbr, 2], ['tbrCz', 'EC', C.tbr, 2], ['faa', 'EO', E.faa, 2], ['faa', 'EC', C.faa, 2],
      ['apfHz', 'EO', { value: E.alpha_peak.hz, norm_mean: E.alpha_peak.norm_mean, z: E.alpha_peak.z, marked: E.alpha_peak.marked }, 1],
      ['apfHz', 'EC', { value: ap.hz, norm_mean: C.alpha_peak.norm_mean, z: ap.z, marked: ap.marked, star: ap.st === 'moved' }, 1]];
    return tbl([R(c, 'measure'), R(c, 'condition'), R(c, 'value') + ' ', R(c, 'normMean') + ' ', 'z'], r.map(([k, cd, o, d]) => `<tr><td>${R(c, k)}</td><td>${condL(cd, L)}</td><td class="n">${fx(o.value, d, L)}${o.star ? '*' : ''}</td><td class="n">${fx(o.norm_mean, d, L)}</td>${zc(o.z, o.marked, L)}</tr>`)) +
      `<div class="c-cap">${R(c, 'zKey')}${ap.st === 'moved' ? ' ' + R(c, 'movedKey') : ''}</div>` + A.sys(S_(c).ratios) + A.sys([mkSentence(L, c.snap)]); },
  asymmetry: (c) => { const L = c.lang, pairs = SP.EO.asymmetry[A.bands[0].name].map(x => x.pair);
    return ['EO', 'EC'].map(cd => `<div class="c-asr"><span class="c-cap"><b>${esc(T('cond.' + cd, null, L))}</b></span><div class="c-maps">${A.bands.map(b => `<figure class="c-map"><img src="${asyURL(cd, b.name)}" width="60" height="64" alt=""><figcaption><b>${BANDL[b.name]}</b></figcaption></figure>`).join('')}</div></div>`).join('') +
      `<table class="c-t c-zt"><tr><th></th>${pairs.map(p => `<th>${p}</th>`).join('')}</tr>${['EO', 'EC'].map(cd => A.bands.map(b => `<tr><th>${BANDL[b.name]}, ${condL(cd, L)}</th>${SP[cd].asymmetry[b.name].map(x => zc(x.z, x.marked, L)).join('')}</tr>`).join('')).join('')}</table>` +
      `<div class="c-cap">${R(c, 'asyCap')} ${R(c, 'zKey')}</div>` + A.sys(S_(c).asymmetry_EO) + A.sys(S_(c).asymmetry_EC); },
  coherence: (c) => { const all = [], L = c.lang;
    ['EO', 'EC'].forEach(cd => Object.entries(M2.coherence[cd]).forEach(([b, o]) => o.pairs.forEach(p => { if (p.marked) all.push({ ...p, b, cd }); })));
    all.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    return A.sys(S_(c).coherence_EO) + A.sys(S_(c).coherence_EC) + `<div class="c-cap">${R(c, 'cohCap')}</div>` +
      (all.length ? tbl([R(c, 'pair'), R(c, 'band'), R(c, 'condition'), R(c, 'coherence') + ' ', 'z'], all.map(p => `<tr><td>${p.pair}</td><td>${BANDL[p.b]}</td><td>${condL(p.cd, L)}</td><td class="n">${fx(p.value, 3, L)}</td>${zc(p.z, p.marked, L)}</tr>`)) : `<div class="c-cap">${R(c, 'noneMarked')}</div>`); },
  coh_global: (c) => { const L = c.lang;
    return tbl([R(c, 'band'), `${condL('EO', L)} `, 'z', `${condL('EC', L)} `, 'z'], A.bands.map(b => { const o = M2.coherence.EO[b.name].global, p = M2.coherence.EC[b.name].global;
      return `<tr><td>${BANDL[b.name]}</td><td class="n">${fx(o.value, 3, L)}</td>${zc(o.z, o.marked, L)}<td class="n">${fx(p.value, 3, L)}</td>${zc(p.z, p.marked, L)}</tr>`; })) + `<div class="c-cap">${R(c, 'cohgCap')} ${R(c, 'zKey')}</div>`; },
  erp_waves: (c) => { const pk = peaksOf(c.snap);
    return ['go', 'nogo'].map(t => `<div class="c-cap"><b>${trialL[t]}</b> · ${R(c, 'trials')} ${M2.quality.accepted_trials[t]}</div><img class="c-grid" src="${erpGrid(t, pk)}" width="${GW}" height="${GH}" alt="">`).join('') + `<div class="c-cap">${R(c, 'erpCap')}</div>` + (c.cfg.blocks.includes('erp') ? '' : A.sys(peakSentences(c.lang, c.snap))); },
  erp: (c) => { const L = c.lang, pk = peaksOf(c.snap), any = pk.some(p => p.moved);
    return tbl([R(c, 'component'), R(c, 'trials'), R(c, 'site'), R(c, 'ampUv') + ' ', 'z', R(c, 'latMs') + ' ', 'z'], pk.map(p => `<tr><td>${p.component}</td><td>${trialL[p.condition]}</td><td>${p.site}</td><td class="n">${fx(p.amplitude_uv, 1, L)}${p.moved ? '*' : ''}</td>${zc(p.amplitude_z, p.amplitude_marked, L)}<td class="n">${p.latency_ms == null ? (p.window_ms ? esc(String(p.window_ms).replace(' to ', ' ' + T('to', null, L) + ' ')) : R(c, 'mean')) : p.latency_ms + (p.moved ? '*' : '')}</td>${p.latency_z == null ? '<td></td>' : zc(p.latency_z, p.latency_marked, L)}</tr>`)) +
      `<div class="c-cap">${R(c, 'zKey')}${any ? ' ' + R(c, 'movedKey') : ''}</div>` + A.sys(erpList(L, c.snap)); },
  behaviour: (c) => { const v = M2.vcpt, L = c.lang;
    return tbl([R(c, 'vcptMeasure'), R(c, 'value') + ' ', 'z', R(c, 'percentile') + ' '], [['om', v.omissions], ['cm', v.commissions], ['rtMean', v.rt_mean_ms], ['rtSd', v.rt_sd_ms]]
      .map(([k, o]) => `<tr><td>${R(c, k)}</td><td class="n">${o.value}</td>${zc(o.z, o.marked, L)}<td class="n">${fx(o.percentile, 0, L)}</td></tr>`)) + A.sys(S_(c).behaviour); },
  errors: (c) => `<div class="c-errw">${errorsSVG(c.lang)}<span class="c-cap">${R(c, 'errCap')}</span></div>`,
  comparison: (c) => A.sys(S_(c).comparison),
  limits: (c) => A.sys(S_(c).limits),
  /* C4: required, cannot be removed; replaces the signature line that used to sit under the conclusion */
  issuedby: (c) => { const L = c.lang, r = A.state.report, e = c.issued, prev = r.issued.filter(x => x.v < c.v).map(x => x.v).pop(), why = e ? e.reason : r.pendingReason;
    const rows = [['ib.by', R(c, 'ib.name')], ['ib.qual', R(c, 'ib.q')], ['ib.at', e ? A.at(e.at, L) : R(c, 'ib.onIssue')],
      ['ib.version', `R-MOCK-042 v${c.v} · ${M2.processed_with.software} · ${A.dv(M2.processed_with.norms, L)}`], ['ib.replaces', prev ? `R-MOCK-042 v${prev}` : R(c, 'ib.first')]];
    if (prev) rows.push(['ib.reason', why || '']);
    return `<table class="c-kv c-ib">${rows.map(([k, v]) => `<tr><th>${R(c, k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`; },
};
function spectra(cond, c) {
  const C = SP[cond], L = c.lang;
  /* the eyes closed alpha peak follows the clinician's marker: its sentence moves to the ratios block when that block is in the template */
  const sents = A.sentences[L].m2['spectra_' + cond].flatMap(s => cond === 'EC' && s.id.startsWith('APF') ? (c.cfg.blocks.includes('ratios') ? [] : [mkSentence(L, c.snap)]) : [s]);
  return `<div class="c-maps">${A.bands.map(b => `<figure class="c-map"><img src="${mapURL(cond, b.name)}" width="96" height="100" alt="${esc(R(c, 'mapAlt', { b: BANDL[b.name], cond: condL(cond, L) }))}"><figcaption><b>${BANDL[b.name]}</b> ${A.nx(b.lo, L)}-${A.nx(b.hi, L)} Hz</figcaption></figure>`).join('')}</div>
    <div class="c-scl"><span class="c-cap">${R(c, 'mapsCap')}</span>${A.zScale(null, L)}</div>
    <table class="c-t c-zt"><tr><th></th>${A.channels.map(ch => `<th>${ch}</th>`).join('')}</tr>${A.bands.map(b => ['abs', 'rel'].map(k => `<tr><th>${BANDL[b.name]} ${k}</th>${C.bands[b.name][k + '_z'].map((z, i) => zc(z, (C.bands[b.name][k + '_marked'] || [])[i], L)).join('')}</tr>`).join('')).join('')}</table>
    ${A.sys(sents)}`;
}
const stLabel = (c) => R(c, 'st.' + c.status);

/* ---------------- document assembly and pagination ---------------- */
const born = (L) => A.state.staffView ? T('hidden', null, L) : A.fmtDate(A.case.identity_store.birth_date, L);
const BAND_H = 136;
function headerHTML(c) {
  const th = c.cfg.theme, L = c.lang, std = c.cfg.style === 'std', tx = ctexts(c);
  const id = [[R(c, 'patient'), nameIn(L)], [R(c, 'code'), 'MOCK-042'], [R(c, 'born'), born(L)], [R(c, 'recorded'), A.fmtDate(M2.date, L)], [R(c, 'age'), T('years', { n: 10 }, L)], [R(c, 'sex'), T('female', null, L)]];
  const hdr = `<div class="c-hdr${th.logo === 'right' ? ' rev' : ''}"><div class="c-logo">${std ? 'LOGO' : T('c.logoC', null, L)}</div>
    <div class="c-hdrtx"><div class="c-cn">${T('clinicC', null, L)}</div>${th.addr ? `<div>${esc(tx.addr1)}</div><div>${esc(tx.addr2)}</div>` : ''}</div></div>`;
  return `<section class="c-blk c-clc" data-blk="header" data-kind="clinic">${std ? `<div class="c-bandsp" style="height:${BAND_H - PAD[0] + 12}px"></div>${hdr}` : `${hdr}<h1 class="c-title">${R(c, 'title')}</h1>`}
    <div class="c-id">${id.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div></section>`;
}
/* company standard: page decorations outside the body (cover band, running header, lime footer band) */
function stdDeco(c, i) {
  const L = c.lang;
  if (!i) return `<div class="c-band"><div class="c-bt"><h1 class="c-title">${R(c, 'title')}</h1><div class="c-bsub">${R(c, 'recorded')} ${A.fmtDate(M2.date, L)} · MOCK-042</div></div>${A.trace(520, 64, 11)}</div><div class="c-fband"></div>`;
  return `<div class="c-rh"><i>${R(c, 'title')} · ${esc(nameIn(L))} · ${R(c, 'born')} ${born(L)}</i><i>${R(c, 'page')} ${i + 1}</i></div><div class="c-fband"></div>`;
}
const hnum = (n) => n ? `<b class="c-rn">${ROMAN(n)}.</b> ` : '';
function clinHTML(key, c, n) {
  const isC = key.startsWith('comment.'), L = c.lang, t = c.texts[key] || '', ed = c.editable, ttl = isC ? R(c, 'comment') : blkLabel(key, L);
  const sig = '';
  return `<section class="c-blk c-cln" data-blk="${key}" data-kind="clinician"><h2 class="c-h c-hc"><span>${hnum(n)}${esc(ttl)}</span>${isC && ed ? `<button class="c-rmc" data-rmc="${key}" title="${esc(T('c.rmComment'))}">${esc(T('c.remove'))}</button>` : ''}</h2>
    <div class="c-txt${!ed && !t.trim() ? ' c-none' : ''}" data-key="${key}" data-ph="${esc(R(c, 'ph.' + (isC ? 'comment' : key)))}"${ed ? ` contenteditable="plaintext-only" role="textbox" aria-multiline="true" aria-label="${esc(ttl)}" spellcheck="true" lang="${L}"` : ''}>${ed ? esc(t) : esc(t.trim() || R(c, 'none'))}</div>${sig}</section>`;
}
function items(c) {
  const out = [{ id: 'header', kind: 'clinic', label: T('c.hdrItem'), html: headerHTML(c) }], std = c.cfg.style === 'std'; let sec = 0;
  c.cfg.blocks.forEach(id => {
    const d = CAT[id]; if (!d) return;
    let html; const n = std && d.kind !== 'clinic' ? ++sec : 0;
    if (d.kind === 'device') html = `<section class="c-blk c-dev" data-blk="${id}" data-kind="device" title="${esc(T('c.locked'))}"><h2 class="c-h"><span>${hnum(n)}${esc(blkLabel(id, c.lang))}</span></h2>${DEV[id](c)}${c.editable && d.result && !(('comment.' + id) in c.texts) ? `<button class="c-addc" data-addc="${id}" title="${esc(T('c.addCommentT'))}">${esc(T('c.addComment'))}</button>` : ''}</section>`;
    else if (d.kind === 'clinic') html = `<section class="c-blk c-clc c-intro" data-blk="${id}" data-kind="clinic"><p>${esc(fill(ctexts(c).intro, c.lang))}</p></section>`;
    else html = clinHTML(id, c, n);
    out.push({ id, kind: d.kind, label: blkLabel(id), html });
    const ck = 'comment.' + id;
    if (d.result && ck in c.texts && (c.editable || (c.texts[ck] || '').trim())) out.push({ id: ck, kind: 'clinician', label: T('c.commentOn', { b: blkLabel(id) }), html: clinHTML(ck, c) });
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
  its.forEach((it, i) => { if (used + hs[i] > BODY_H - 6 && pages[pages.length - 1].length) { pages.push([]); used = 0; } pages[pages.length - 1].push(it); used += hs[i]; });
  return pages;
}
function buildPages(c, upto) {
  const its = items(c), pages = paginate(its, c.cfg), N = pages.length, std = c.cfg.style === 'std';
  const stamp = c.status === 'draft' ? `<div class="c-stamp">${R(c, 'stampDraft')}</div>` : c.status === 'replaced' ? `<div class="c-stamp rep">${R(c, 'stampRep', { v: c.replacedBy })}</div>` : '';
  const html = (upto ? pages.slice(0, upto) : pages).map((p, i) => `<div class="c-pg c-doc paper${styleCls(c.cfg)}" lang="${c.lang}" data-page="${i + 1}" style="${themeStyle(c.cfg)}">${std ? stdDeco(c, i) : ''}<div class="c-body">${p.map(x => x.html).join('')}</div>${stamp}
    <div class="c-foot">${T('mock', null, c.lang)}${std ? ' · ' + R(c, 'companyLine') : ''} · V4 mockup 0.1 · Mock norms 2026.1 · R-MOCK-042 v${c.v} ${stLabel(c)} · ${R(c, 'page')} ${i + 1}${c.cfg.theme.pageOf ? ` ${R(c, 'of')} ${N}` : ''}</div></div>`);
  return { pages: html, html: html.join(''), N, items: its, sig: pages.map(p => p.map(x => x.id).join()).join('|') };
}
/* context of the document shown: an issued entry, or the live draft */
function ctxEntry(e, list) {
  const next = list.find(x => x.v > e.v);
  return { cfg: e.cfg, texts: e.texts, v: e.v, status: next ? 'replaced' : 'issued', replacedBy: next && next.v, lang: e.lang, tv: e.tv, tid: e.tid || 'CT-C', editable: false, issued: e, quality: pick(e.quality, e.lang), choices: pick(e.choices, e.lang), snap: e.snap || snapNow() };
}
function docCtx() {
  const r = A.state.report; ensure(); const t = tpl(r.tpl), last = r.issued[r.issued.length - 1];
  if (r.status === 'issued' && last) return ctxEntry(last, r.issued);
  const sn = snapNow();
  return { cfg: t.cfg, texts: r.texts, v: r.version, status: 'draft', lang: r.lang, tv: t.version, tid: r.tpl, editable: true, quality: qualityList(r.lang, sn), choices: choices(r.lang, sn), snap: sn };
}
/* warnings and passed checks, in the interface language */
function checks(c) {
  const s = A.state, w = [], ok = [];
  [['segments', 'c.ck.segments', 'segments'], ['cleaning', 'c.ck.cleaning', 'cleaning'], ['markers', 'c.ck.marker', 'results']].forEach(([k, l, go]) => {
    const n = k === 'segments' ? +(s.segments.changes || 0) || 0 : 0;
    if (!(s[k] || {}).confirmed) w.push({ t: T(n ? 'c.ck.pend' : 'c.ck.notConf', { l: T(l), n }), go }); else ok.push(T('c.ck.conf', { l: T(l) })); });
  if (c.cfg.blocks.some(id => id === 'erp' || id === 'erp_waves')) PK_TRIALS.forEach(t => { const l = T('c.ck.peaks', { t: trialL[t] });
    const st = (s.peaks || {})[t] || {}, n = (st.moved || []).length;
    if (!st.confirmed) w.push({ t: T(n ? 'c.ck.pend' : 'c.ck.notConf', { l, n }), go: 'results' }); else ok.push(T('c.ck.conf', { l })); });
  c.cfg.blocks.filter(id => CAT[id] && CAT[id].kind === 'clinician').forEach(id => { if (!(c.texts[id] || '').trim()) w.push({ t: T('c.ck.empty', { l: blkLabel(id) }), blk: id }); else ok.push(T('c.ck.written', { l: blkLabel(id) })); });
  Object.keys(c.texts).filter(k => k.startsWith('comment.') && CAT[k.slice(8)] && c.cfg.blocks.includes(k.slice(8)) && !(c.texts[k] || '').trim()).forEach(k => w.push({ t: T('c.ck.emptyC', { l: label(k) }), blk: k }));
  return { w, ok };
}
const hash = (s) => { let h1 = 0x811c9dc5, h2 = 0x1234567; for (let i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822519); }
  return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).replace(/(.{4})/g, '$1 ').trim(); };

/* ---------------- CSS ---------------- */
A.css('c-report', `
.c-ed .ann, .c-tb .ann, .c-as .ann, .c-iv .ann { white-space: normal; max-width: 100%; text-align: left; }
.c-annw { display: block; white-space: normal; } .c-annw .ann { margin: 2px 4px 0 0; white-space: normal; max-width: 100%; text-align: left; font-size: 10px; line-height: 1.35; }
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
.c-2c { display: grid; grid-template-columns: 260px 1fr; gap: 18px; align-items: start; margin-bottom: 4px; } .c-qt { max-width: 340px; }
.c-t td.z.mk { font-weight: 700; } .c-grid { display: block; margin: 1px 0 5px; }
.c-m1 { display: grid; grid-template-columns: repeat(15, 1fr); gap: 1px 0; margin-bottom: 3px; } .c-m1 .c-map { font-size: 8px; } .c-m1 .c-map img { margin: 0 auto; }
.c-asr { display: grid; grid-template-columns: 92px 1fr; align-items: center; } .c-asr .c-map img { margin: 0 auto; }
.c-raw { display: flex; justify-content: space-between; gap: 10px; } .c-raw .c-map { text-align: left; }
.c-errw { display: flex; gap: 16px; align-items: flex-end; } .c-ib { width: 100%; } .c-ib th { width: 170px; }
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
.c-row .c-grip { cursor: grab; color: var(--muted); user-select: none; width: 12px; } .c-row .chip { font-size: 10px; padding: 0 6px; width: 62px; justify-content: center; flex: none; } .c-row.ro .c-grip { visibility: hidden; cursor: default; }
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
/* company standard (CT-STD): navy cover band with a lime trace, Roman-numbered sections, italic running header, lime footer band */
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
  const back = A.dialog({ title: T('c.corrTitle', { n }), ok: T('c.corrOk', { m: n + 1 }), body: `
    <div class="field"><span>${esc(T('c.corrReason'))}</span><textarea id="cReason" rows="3" placeholder="${esc(T('c.corrPh'))}"></textarea></div>
    <div class="xs muted">${esc(T('c.corrInfo', { n, m: n + 1 }))} ${A.ann('Corrections as new versions')}</div><div id="cRErr" class="xs" style="color:var(--warn)"></div>`,
    onOk: (b) => { const v = $('#cReason', b).value.trim(); if (!v) { $('#cRErr', b).textContent = T('c.corrErr'); $('#cReason', b).focus(); return false; }
      r.status = 'draft'; r.version = n + 1; r.pendingReason = v; r.texts = clone(r.issued[r.issued.length - 1].texts);
      A.addLog('who.c1', 'c.log.corr', { m: n + 1, why: v }); A.toast(T('c.toast.corr', { m: n + 1, n })); A.go('report'); } });
  setTimeout(() => { const t = $('#cReason', back); if (t) t.focus(); }, 30);
}
function issueDialog() {
  const r = A.state.report, c = docCtx(), { w } = checks(c), N = RV.N || 1;
  const back = A.dialog({ title: T('c.issueTitle', { v: r.version }), ok: T('c.issueOk', { v: r.version }), body: `
    <dl class="kv"><dt>${T('c.report')}</dt><dd class="mono">R-MOCK-042 v${r.version}</dd><dt>${T('c.template')}</dt><dd>${c.tid} v${c.tv} · ${esc(tname(c.tid))} · ${esc(T('lang.' + r.lang))} · ${esc(T('c.nPages', { n: N }))}</dd><dt>${T('c.signedBy')}</dt><dd>${esc(T('sig.c1'))}</dd></dl>
    ${w.length ? `<div class="banner amber"><div><b>${esc(T('c.nWarn', { n: w.length }))}</b><ul style="margin:4px 0 0;padding-left:18px">${w.map(x => `<li>${esc(x.t)}</li>`).join('')}</ul></div></div>` : `<div class="banner ok"><b>${esc(T('c.noWarn'))}</b></div>`}
    <label class="row small" style="align-items:flex-start;flex-wrap:nowrap"><input type="checkbox" id="cConf" style="margin-top:3px"> <span>${esc(T('c.reviewed'))}</span></label>
    <div class="xs muted">${esc(T('c.issueInfo'))} ${A.ann('M24 one confirmation')}</div>`,
    onOk: (b) => { if (!$('#cConf', b).checked) return false; doIssue(N); } });
  const ok = $('[data-ok]', back); ok.disabled = true; $('#cConf', back).onchange = e => { ok.disabled = !e.target.checked; };
}
function doIssue(N) {
  const r = A.state.report; ensure(); const t = tpl(r.tpl), v = r.version;
  /* the issued entry keeps the quality sentences and stated choices in every language, so the side
     panels can follow the interface while the document stays in the language it was issued in */
  const byLang = (f) => Object.fromEntries(TL.map(l => [l, f(l)]));
  const sn = snapNow();
  r.issued.push({ v, at: A.now(), reason: r.pendingReason || null, texts: clone(r.texts), cfg: clone(t.cfg), tv: t.version, tid: r.tpl, lang: r.lang, pages: N, quality: byLang(l => qualityList(l, sn)), choices: byLang(l => choices(l, sn)), snap: sn });
  r.status = 'issued'; r.pendingReason = null; IV.sel = null;
  A.addLog('who.c1', 'c.log.issued', { v, tid: r.tpl, tv: t.version });
  A.toast(T('c.toast.issued', { v })); A.go('issued');
}

/* ================================ Report editor ================================ */
const RV = { zoom: 'fit', marks: true, root: null, ro: null, N: 0, sig: '', changed: new Set(), savedAt: null };
function edRender(root) {
  ensure(); RV.root = root;
  root.innerHTML = `<div class="c-ed">
    <aside class="card c-out" aria-label="${esc(T('c.outline'))}"><div class="hd"><h3>${esc(T('c.outline'))}</h3><span class="xs muted" id="cOutN"></span></div><div class="c-olist" id="cOut"></div></aside>
    <div class="c-mid"><div id="cBan" class="grid" style="gap:8px"></div>
      <div class="card"><div class="toolbar" role="toolbar" aria-label="${esc(T('c.docAria'))}">
        <div class="seg" id="cZm">${[['fit', T('c.fit')], [0.75, A.pct(75)], [1, A.pct(100)]].map(([v, l]) => `<button data-zoom="${v}" class="${String(RV.zoom) === String(v) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>
        <span class="xs muted" id="cPages"></span><span class="sep"></span>
        <label><input type="checkbox" id="cMarks" ${RV.marks ? 'checked' : ''}> ${esc(T('c.marks'))}</label>
        <span style="flex:1"></span><span class="xs muted" id="cSaved">${RV.savedAt ? esc(T('c.saved', { t: RV.savedAt })) : ''}</span></div>
        <div class="c-canvas" id="cCanvas"><div class="c-zoom" id="cZoom"></div></div></div></div>
    <aside class="c-side" id="cSide"></aside></div>`;
  const cv = $('#cCanvas', root);
  root.onclick = (e) => {
    const t = e.target;
    const o = t.closest('[data-out]'); if (o) return scrollBlk(o.dataset.out);
    const z = t.closest('[data-zoom]'); if (z) { RV.zoom = z.dataset.zoom === 'fit' ? 'fit' : +z.dataset.zoom; $$('#cZm button', root).forEach(b => b.classList.toggle('on', b === z)); return applyZoom(); }
    const ad = t.closest('[data-addc]'); if (ad) { const k = 'comment.' + ad.dataset.addc; A.state.report.texts[k] = ''; A.addLog('who.c1', 'c.log.addc', { l: blkRef(k) }); drawDoc(); return focusKey(k, true); }
    const rm = t.closest('[data-rmc]'); if (rm) { const k = rm.dataset.rmc; delete A.state.report.texts[k]; A.addLog('who.c1', 'c.log.rmc', { l: blkRef(k) }); return drawDoc(); }
    if (t.closest('[data-correct]')) return correctDialog();
    const g = t.closest('[data-go2]'); if (g) return A.go(g.dataset.go2);
    const te = t.closest('[data-tedit]'); if (te) { TB.id = te.dataset.tedit; TB.draft = null; }
    const ck = t.closest('[data-ck]'); if (ck) { const [k, v] = ck.dataset.ck.split(':'); return k === 'go' ? A.go(v) : (scrollBlk(v), focusKey(v)); }
    if (t.closest('#cIssue')) return issueDialog();
    const lk = t.closest('.c-dev, .c-clc'); if (lk && docCtx().editable) { lk.classList.remove('c-deny'); void lk.offsetWidth; lk.classList.add('c-deny');
      tip(e, T(lk.dataset.kind === 'device' ? 'c.locked' : 'c.clinicLocked')); }
  };
  root.oninput = (e) => {
    const el = e.target.closest && e.target.closest('.c-txt[contenteditable]'); if (!el) return;
    let v = el.innerText.replace(/\n$/, ''); if (!v.trim()) { v = ''; if (el.innerHTML && !el.textContent) el.innerHTML = ''; }
    A.state.report.texts[el.dataset.key] = v; RV.changed.add(el.dataset.key); RV.savedAt = A.time(); $('#cSaved', root).textContent = T('c.saved', { t: RV.savedAt });
    const body = el.closest('.c-body');
    if (body && body.scrollHeight > body.clientHeight + 1) { drawDoc(); focusKey(el.dataset.key); } else { drawOutline(); drawSide(); }
  };
  root.onchange = (e) => {
    if (e.target.id === 'cMarks') { RV.marks = e.target.checked; $('#cZoom', root).classList.toggle('c-marks', RV.marks); }
    if (e.target.id === 'cTpl') { const r = A.state.report, from = r.tpl; r.tpl = e.target.value; const t = tpl(r.tpl);
      A.addLog('who.c1', 'c.log.tpl', { v: r.version, a: from, b: r.tpl, tv: t.version, name: A.tk('c.tpl.' + r.tpl) }); A.toast(T('c.toast.tpl', { name: tname(r.tpl) })); drawDoc(); }
    if (e.target.id === 'cLang') { const r = A.state.report; r.lang = e.target.value; A.addLog('who.c1', 'c.log.lang', { lang: A.tk('lang.' + r.lang) }); drawDoc(); }
  };
  root.addEventListener('focusout', (e) => {
    const el = e.target.closest && e.target.closest('.c-txt[contenteditable]'); if (!el || !RV.changed.has(el.dataset.key)) return;
    const k = el.dataset.key, n = (A.state.report.texts[k] || '').length; RV.changed.delete(k);
    A.addLog('who.c1', 'c.log.edit', { l: blkRef(k), v: A.state.report.version, n });
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
  $('#cPages', root).textContent = T('c.pagesA4', { p: T('c.nPages', { n: b.N }) });
  applyZoom(); cv.scrollTop = st; drawBanner(c); drawOutline(); drawSide();
}
function applyZoom() {
  const root = RV.root; if (!root || !root.isConnected) return;
  const cv = $('#cCanvas', root), z = RV.zoom === 'fit' ? Math.min(1, (cv.clientWidth - 30) / PW) : RV.zoom;
  $('#cZoom', root).style.zoom = Math.max(0.2, z).toFixed(3);
}
function drawBanner(c) {
  const r = A.state.report, last = r.issued[r.issued.length - 1], el = $('#cBan', RV.root); let h = '';
  if (r.status === 'issued' && last) h += `<div class="banner ok"><b>${esc(T('c.issuedV', { v: last.v }))}</b><span style="flex:1">${esc(T('c.issuedBan', { at: A.at(last.at) }))}</span><button class="btn sm" data-go2="issued">${esc(T('c.openIssued'))}</button><button class="btn sm primary" data-correct>${esc(T('c.correct'))}</button></div>`;
  else if (last) h += `<div class="banner amber"><b>${esc(T('c.corrV', { v: r.version }))}</b><span style="flex:1">${esc(T('c.staysIssued', { a: last.v, b: r.version }))} ${esc(T('c.reasonX', { r: r.pendingReason || '' }))}</span><button class="btn sm" data-go2="issued">${esc(T('c.viewV', { v: last.v }))}</button></div>`;
  if (c.lang !== A.lang) h += `<div class="banner"><b>${esc(T('c.reportLangB'))}</b><span style="flex:1">${esc(T('c.langBan', { r: T('lang.' + c.lang), ui: T('lang.' + A.lang) }))}</span>${A.ann('M32 report language independent of the interface')}</div>`;
  el.innerHTML = h; el.hidden = !h;
}
function drawOutline() {
  const c = docCtx(), its = RV.items || [];
  $('#cOutN', RV.root).textContent = T('c.nBlocks', { n: its.length });
  $('#cOut', RV.root).innerHTML = its.map(i => `<button class="c-oi${i.id.startsWith('comment.') ? ' sub' : ''}" data-out="${i.id}" title="${esc(i.label)}"><span class="chip ${i.kind}">${esc(T('c.kind.' + i.kind))}</span><span class="c-ol">${esc(i.id.startsWith('comment.') ? T('c.comment') : i.label)}</span>${i.kind === 'clinician' && !(c.texts[i.id] || '').trim() ? `<span class="c-em" title="${esc(T('c.emptyT'))}">${esc(T('c.empty'))}</span>` : ''}</button>`).join('');
}
function drawSide() {
  const r = A.state.report, c = docCtx(), { w, ok } = checks(c), ed = c.editable;
  const shown = ed ? choices(A.lang) : pick(c.issued.choices, A.lang);
  $('#cSide', RV.root).innerHTML = `
    <div class="card"><div class="hd"><h3>${esc(T('c.report'))}</h3>${ed ? `<span class="chip info"><span class="d"></span>${esc(T('c.draft'))}</span>` : `<span class="chip ok"><span class="d"></span>${esc(T('c.issued'))}</span>`}</div><div class="bd"><dl class="kv">
      <dt>${T('c.report')}</dt><dd class="mono">R-MOCK-042 v${c.v}</dd><dt>${T('c.template')}</dt><dd><span class="mono">${c.tid}</span> v${c.tv} <a class="xs" href="#templates" data-tedit="${c.tid}">${esc(T('c.edit'))}</a></dd>
      <dt>${T('c.pages')}</dt><dd>${RV.N}</dd><dt>${T('c.author')}</dt><dd>${esc(T('who.c1'))}</dd></dl>
      <div class="field"><span>${esc(T('c.tplFor'))} ${A.ann('Clinic templates: style and clinic texts change; device blocks and figures stay fixed')}</span><select id="cTpl" ${ed ? '' : 'disabled'}>${Object.keys(TPLS).map(id => `<option value="${id}" ${c.tid === id ? 'selected' : ''}>${esc(tname(id))} · ${id} v${tpl(id).version}</option>`).join('')}</select></div>
      <div class="field"><span>${esc(T('c.reportLang'))} ${A.ann('M32: the report language is set per report, independent of the interface language; a template carries its clinic texts in English and German and has a language-neutral id')}</span><select id="cLang" ${ed ? '' : 'disabled'}>${TL.map(l => `<option value="${l}" ${c.lang === l ? 'selected' : ''}>${esc(T('lang.' + l))}</option>`).join('')}<option value="ja" disabled>${esc(T('lang.ja'))}</option></select></div></div></div>
    <div class="card"><div class="hd"><h3>${esc(T('c.choices'))}</h3></div><div class="bd c-ch">${shown.map(x => `<div><span class="lbl">${esc(x.k)}</span>${esc(x.v)} ${x.ok ? '<span class="chip ok">✓</span>' : `<span class="chip amber">${esc(T('c.open'))}</span>`}</div>`).join('')}</div></div>
    <div class="card"><div class="hd"><h3>${esc(T(ed ? 'c.before' : 'c.atIssue'))}</h3>${w.length ? `<span class="chip amber">${esc(T('c.nWarn', { n: w.length }))}</span>` : `<span class="chip ok">${esc(T('c.ready'))}</span>`}</div><div class="bd">
      <ul class="c-ck">${w.map(x => `<li class="w" data-ck="${x.go ? 'go:' + x.go : 'blk:' + x.blk}" tabindex="0"><b>⚠</b><span>${esc(x.t)}</span></li>`).join('')}${ok.map(x => `<li class="k"><b>✓</b><span>${esc(x)}</span></li>`).join('')}
      <li class="k"><b>🔒</b><span>${esc(T('c.locks', { n: c.cfg.blocks.filter(id => CAT[id] && CAT[id].kind === 'device').length }))}</span></li></ul>
      ${ed ? ((A.state.segments.confirmed && A.state.cleaning.confirmed) ? `<button class="btn primary" id="cIssue" style="justify-content:center">${esc(T('c.issueBtn', { v: c.v }))}</button>` : `<button class="btn primary" disabled style="justify-content:center" title="${esc(T('c.confFirst'))}">${esc(T('c.issueBtn', { v: c.v }))}</button><span class="xs muted">${esc(T('c.confFirstL'))}</span>`) : `<button class="btn" data-correct style="justify-content:center">${esc(T('c.correctThis'))}</button>`}</div></div>`;
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
    root.innerHTML = `<div class="card"><div class="empty"><div style="font-size:30px">▤</div><b>${esc(T('c.noIssued'))}</b><br><span class="small">${esc(T('c.isDraft', { v: r.version }))}</span><br><button class="btn primary" data-go2="report" style="margin-top:12px">${esc(T('c.openDraft'))}</button></div></div>`;
    root.onclick = e => { if (e.target.closest('[data-go2]')) A.go('report'); }; return;
  }
  const last = list[list.length - 1], e = list.find(x => x.v === IV.sel) || last, c = ctxEntry(e, list), b = buildPages(c);
  const drafting = r.status === 'draft';
  root.innerHTML = `<div class="c-iv">
    ${drafting ? `<div class="banner amber"><b>${esc(T('c.corrProg', { v: r.version }))}</b><span style="flex:1">${esc(T('c.staysIssued', { a: last.v, b: r.version }))}</span><button class="btn sm primary" data-go2="report">${esc(T('c.openDraftV', { v: r.version }))}</button></div>` : ''}
    <div class="card"><div class="toolbar" role="toolbar" aria-label="${esc(T('c.ivAria'))}">
      <b class="mono small">R-MOCK-042 v${e.v}</b><span class="chip clinic" title="${esc(T('c.tplUsed'))}">${esc(tname(c.tid))} · ${c.tid} v${e.tv}</span>${c.status === 'replaced' ? `<span class="chip">${esc(T('c.replacedBy', { v: c.replacedBy }))}</span>` : `<span class="chip ok"><span class="d"></span>${esc(T('c.issued'))}</span>`}
      <label>${esc(T('c.version'))} <select id="cVer">${list.slice().reverse().map(x => `<option value="${x.v}" ${x.v === e.v ? 'selected' : ''}>v${x.v} · ${esc(A.at(x.at))}</option>`).join('')}</select></label><span class="sep"></span>
      <button class="btn sm" data-z="-1" aria-label="${esc(T('c.zoomOut'))}">−</button><span class="c-zl mono" id="cZl"></span><button class="btn sm" data-z="1" aria-label="${esc(T('c.zoomIn'))}">+</button><button class="btn sm ghost" data-z="fit">${esc(T('c.fitWidth'))}</button>
      <span class="sep"></span><button class="btn sm" id="cDl">${esc(T('c.download'))}</button><span style="flex:1"></span>
      ${!drafting && e.v === last.v ? `<button class="btn sm primary" data-correct>${esc(T('c.correctThis'))}</button>` : ''}</div>
      <div class="c-ivbody"><div class="c-thumbs" id="cThumbs">${b.pages.map((p, i) => `<button class="c-th${i ? '' : ' on'}" data-pg="${i + 1}" aria-label="${esc(T('c.pageN', { n: i + 1 }))}"><div class="c-thz"><div>${p}</div></div><span>${i + 1}</span></button>`).join('')}</div>
        <div class="c-canvas" id="cIvC"><div class="c-zoom" id="cIvZ">${b.html}</div></div></div>
      <div class="c-ivfoot xs muted"><span>${esc(T('c.issuedAtBy', { at: A.at(e.at) }))}</span><span>${esc(M2.processed_with.software)}</span><span>${esc(A.dv(M2.processed_with.norms))}</span><span>${esc(T('c.tplLine', { tid: c.tid, tv: e.tv, name: tname(c.tid) }))}</span><span>${esc(T('lang.' + e.lang))} · ${esc(T('c.nPages', { n: b.N }))}</span><span class="mono">${esc(T('c.checksum', { h: hash(JSON.stringify([e.v, e.texts, e.tv, e.at])) }))}</span></div></div>
    <div class="card"><div class="hd"><h2>${esc(T('c.history'))}</h2><span class="xs muted">${esc(T('c.keptAll'))} ${A.ann('Corrections as new versions')}</span></div><div class="scroll-x"><table class="tbl">
      <tr><th>${T('c.th.version')}</th><th>${T('c.th.status')}</th><th>${T('c.th.issued')}</th><th>${T('c.th.by')}</th><th>${T('c.th.reason')}</th><th>${T('c.th.template')}</th><th class="num">${T('c.th.pages')}</th></tr>
      ${drafting ? `<tr class="link" data-go2="report"><td class="mono">v${r.version}</td><td><span class="chip info">${esc(T('c.draft'))}</span></td><td class="muted">${esc(T('c.notIssued'))}</td><td>${esc(T('who.c1'))}</td><td>${esc(r.pendingReason || '')}</td><td>${r.tpl} v${tpl(r.tpl).version}</td><td></td></tr>` : ''}
      ${list.slice().reverse().map(x => { const nx = list.find(y => y.v > x.v); return `<tr class="link${x.v === e.v ? ' on' : ''}" data-ver="${x.v}"><td class="mono">${x.v === e.v ? '▸ ' : ''}v${x.v}</td><td>${nx ? `<span class="chip">${esc(T('c.replacedBy', { v: nx.v }))}</span>` : `<span class="chip ok">${esc(T('c.current'))}</span>`}</td><td>${esc(A.at(x.at))}</td><td>${esc(T('who.c1'))}</td><td>${esc(x.reason ?? T('c.firstIssue'))}</td><td>${x.tid || 'CT-C'} v${x.tv}</td><td class="num">${x.pages || ''}</td></tr>`; }).join('')}
    </table></div></div></div>`;
  const cv = $('#cIvC', root);
  const zoomNow = () => IV.zoom === 'fit' ? Math.min(1.25, (cv.clientWidth - 30) / PW) : IV.zoom;
  const applyZ = () => { const z = Math.max(0.2, zoomNow()); $('#cIvZ', root).style.zoom = z.toFixed(3); $('#cZl', root).textContent = A.pct(z * 100, 0); };
  root.onclick = (ev) => {
    const t = ev.target;
    const zb = t.closest('[data-z]'); if (zb) { const cur = zoomNow(); if (zb.dataset.z === 'fit') IV.zoom = 'fit'; else { const d = +zb.dataset.z; IV.zoom = d > 0 ? (ZSTEPS.find(s => s > cur + 0.01) || 1.25) : ([...ZSTEPS].reverse().find(s => s < cur - 0.01) || 0.5); } return applyZ(); }
    const pg = t.closest('[data-pg]'); if (pg) { const p = $(`#cIvZ [data-page="${pg.dataset.pg}"]`, root); cv.scrollTo({ top: cv.scrollTop + p.getBoundingClientRect().top - cv.getBoundingClientRect().top - 12, behavior: 'smooth' }); return; }
    const vr = t.closest('[data-ver]'); if (vr) { IV.sel = +vr.dataset.ver; A.addLog('who.c1', 'c.log.viewed', { v: IV.sel }); return ivRender(root); }
    if (t.closest('[data-correct]')) return correctDialog();
    if (t.closest('[data-go2]')) return A.go('report');
    if (t.closest('#cDl')) { A.addLog('who.c1', 'c.log.dl', { v: e.v }); A.toast(T('c.toast.dl', { v: e.v })); }
  };
  $('#cVer', root).onchange = (ev) => { IV.sel = +ev.target.value; ivRender(root); };
  cv.onscroll = () => { const top = cv.getBoundingClientRect().top + 60; let cur = 1;
    $$('#cIvZ .c-pg', root).forEach(p => { if (p.getBoundingClientRect().top <= top) cur = +p.dataset.page; });
    $$('#cThumbs .c-th', root).forEach(x => x.classList.toggle('on', +x.dataset.pg === cur)); };
  if (IV.ro) IV.ro.disconnect(); IV.ro = new ResizeObserver(applyZ); IV.ro.observe(cv); applyZ();
}
window.Modules.issued = { render: ivRender, destroy() { if (IV.ro) IV.ro.disconnect(); IV.ro = null; } };

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
    <div class="c-tls" role="tablist" aria-label="${esc(T('c.tplAria'))}">${Object.entries(TPLS).map(([id, x]) => `<button class="c-tl${id === TB.id ? ' on' : ''}" role="tab" aria-selected="${id === TB.id}" data-tpl="${id}"><span class="c-tlsw" style="${swatch(id)}"></span><span><b>${esc(tname(id))}</b><span class="xs muted"><span class="mono">${id}</span> · v${tpl(id).version} · ${esc(T(x.owner === 'company' ? 'c.companyTpl' : 'c.clinicTpl'))}${A.state.report.tpl === id ? esc(T('c.usedBy')) : ''}</span></span></button>`).join('')}</div>
    <div class="pagehead"><div><h1>${esc(tname(TB.id))} <span class="mono muted" style="font-size:14px;font-weight:500">${TB.id}</span> <span class="chip ${std ? 'device' : 'clinic'}">${esc(T(std ? 'c.chipCompany' : 'c.chipClinic'))}</span></h1>
      <div class="muted small">${esc(T(inUse ? 'c.inUse' : 'c.avail', { v: t.version }) + T('c.keepVer'))} ${std ? `<span class="c-annw">${A.ann('Mockup assumption: the company standard keeps the heritage look of the current company report')}</span>` : ''}</div></div>
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
      <div class="card"><div class="hd"><h3>${esc(T('c.preview'))}</h3><span class="xs muted">${esc(T('c.pvSub', { lang: T('lang.' + TB.tl) }))}</span></div><div class="c-pv" id="cPv"><div class="c-zoom" id="cPvZ"></div></div></div>
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
  $('#cMirror', root).innerHTML = esc(d.texts[TB.tl].intro).replace(CLAIM, m => `<mark>${m}</mark>`).replace(/\{(name|age|recording_date)\}/g, '<span class="c-phc">{$1}</span>') || `<span class="muted">${esc(T('c.emptyT'))}</span>`;
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
  const b = buildPages({ cfg: TB.draft, texts: r.texts, v: r.version, status: 'draft', lang: TB.tl, tv: t.version + (dirty() ? 1 : 0), tid: TB.id, editable: false, quality: qualityList(TB.tl, sn), choices: choices(TB.tl, sn), snap: sn }, 2);
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
