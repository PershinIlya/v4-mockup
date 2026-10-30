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
const M2 = () => A.m2, SP = () => A.m2.spectra.conditions;
const PW = 794, PH = 1123, PAD = [50, 56, 64, 56], BODY_H = PH - PAD[0] - PAD[2];
const TODAY = '2026-10-29';
/* the case and measurement the shell has open (APP.openCase); sentences of that case, also for the extra cases */
const XC = () => (A.data.extra_cases || {})[A.case.case_code];
const SL = (L) => { const l = L || A.lang, x = XC(), S = x ? x.sentences : A.data.sentences; return S[l] || S.en; };
const SM = (L) => SL(L).m2;
const NN = () => !!A.m2.no_norm;
const MISS = (cond) => (A.m2.results_missing || {})[cond] || null;
const CK = () => A.case.case_code + '|' + A.m2.id;
const ageY = () => Math.floor(A.m2.age_years);
const sexL = (L) => T(A.case.sex === 'male' ? 'rep.sexM' : 'rep.sexF', null, L);
const clone = (o) => JSON.parse(JSON.stringify(o));
const fx = (v, d = 1, L) => (v == null || isNaN(v) ? '' : A.nf(v, d, L));
/* a value printed without a minus sign when it rounds to zero */
const fx0 = (v, d, L) => { const s = fx(v, d, L); return /^-0([.,]0+)?$/.test(s) ? s.slice(1) : s; };
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
/* claim words in clinic texts (M29): the shared list of mockup/checks/terms.py when the page data carries it (DATA.terms),
   else this inline subset; English and German at a word start, (?-i) case-sensitive; the intended-use disclaimers pass */
const CLAIM_INLINE = [/(?<![\p{L}\p{N}_])(diagnos|differential|befund|attention|aufmerksamkeit|impulsiv|hyperaktiv|hyperactiv|disorder|störung|stoerung|disease|krankheit|erkrank|abnormal|normal\b|normale[nmrs]?\b|normalbefund|patholog|auffällig|unauffällig|conspicuous|inconspicuous|treatment|therap|behandl|medicat|medikat|medikament|neurofeedback|recommend|empfehl|empfohl|predict|prognos|screening|clinically (proven|validated)|klinisch (bewiesen|validiert))/giu,
  /\b(ADHD|ADHS|ADD|ADS|OCD|PTSD|PTBS|FDA)\b/gu, /\bCE[- ]?(certified|marked|mark|zertifiziert|Kennzeichnung)/gu];
const CLAIM_ALLOW_INLINE = [/(does not|do not|doesn't|never) (diagnose|interpret|recommend)( any)?( treatment)?|not a diagnosis|no diagnosis|without (a )?diagnosis|an aid, not a diagnosis/gi,
  /(stellt|stellen) keine diagnose|keine diagnose|nicht diagnostisch|(gibt|geben) keine (behandlungs|therapie)?empfehlung/gi];
const rxOf = (p) => { p = String(p); const f = p.startsWith('(?-i)') ? 'g' : 'gi'; p = p.replace('(?-i)', ''); try { return new RegExp(p, f + 'u'); } catch (e) { try { return new RegExp(p, f); } catch (e2) { return null; } } };
const patOf = (x) => typeof x === 'string' ? x : Array.isArray(x) ? x[x.length - 1] : x && (x.pattern || x.pat || x.re || x.regex);
const CLAIM_RX = (() => { const t = A.data && A.data.terms, L = Array.isArray(t) ? t : t && [].concat(t.forbidden || t.FORBIDDEN || t.terms || [], t.ja || t.JA || []);
  const al = t && !Array.isArray(t) && (t.allow || t.ALLOW), mk = (a) => a.map(patOf).filter(Boolean).map(p => rxOf(p)).filter(Boolean);
  const F = L && L.length ? mk(L) : [], A2 = al && al.length ? mk(al) : []; return { F: F.length ? F : CLAIM_INLINE, A: A2.concat(CLAIM_ALLOW_INLINE) }; })();
/* [[start, end]] of claim words in s, widened to the whole word, sorted, not overlapping */
const claimRanges = (s) => { s = String(s || ''); const ok = [], out = [];
  CLAIM_RX.A.forEach(rx => { rx.lastIndex = 0; for (const m of s.matchAll(rx)) if (m[0]) ok.push([m.index, m.index + m[0].length]); });
  CLAIM_RX.F.forEach(rx => { rx.lastIndex = 0; for (const m of s.matchAll(rx)) { if (!m[0] || ok.some(([a, b]) => a <= m.index && m.index < b)) continue;
    let e = m.index + m[0].length; while (e < s.length && /[\p{L}\p{N}_]/u.test(s[e])) e++; out.push([m.index, e]); } });
  out.sort((a, b) => a[0] - b[0] || b[1] - a[1]); return out.filter((r, i) => !out.slice(0, i).some(q => q[0] <= r[0] && r[0] < q[1])); };
const claimMark = (s) => { s = String(s || ''); let o = '', at = 0; claimRanges(s).forEach(([a, b]) => { o += esc(s.slice(at, a)) + `<mark>${esc(s.slice(a, b))}</mark>`; at = b; }); return o + esc(s.slice(at)); };
const BANDL = { delta: 'Delta', theta: 'Theta', alpha: 'Alpha', smr: 'SMR', beta1: 'Beta 1', beta2: 'Beta 2' };
A.addI18n({
  en: {
    'c.tpl.CT-C': 'Clinic C', 'c.tpl.CT-STD': 'Company standard', 'c.logoC': 'CLINIC C',
    'c.blk.intro': 'Introduction text', 'c.blk.versions': 'Versions', 'c.blk.summary': 'Summary of deviations', 'c.blk.quality': 'Signal quality',
    'c.blk.spectra_EO': 'Band power, eyes open', 'c.blk.spectra_EC': 'Band power, eyes closed', 'c.blk.ratios': 'Ratios and alpha peak',
    'c.blk.behaviour': 'VCPT task performance', 'c.blk.comparison': 'Comparison with {d}', 'c.blk.limits': 'Notes on the results',
    'c.blk.anamnesis': 'Anamnesis and clinical interview', 'c.blk.interpretation': 'Interpretation', 'c.blk.conclusion': 'Conclusion',
    'c.lab.comment': (p, L) => 'comment after ' + A.lc(p.b, L), 'c.blkRef': (p, L) => labelOf(p.k, L),
    'rep.title': 'EEG and ERP report', 'rep.patient': 'Patient', 'rep.code': 'Case code', 'rep.born': 'Born', 'rep.recorded': 'Recorded', 'rep.age': 'Age', 'rep.sex': 'Sex',
    'rep.page': 'page', 'rep.of': 'of', 'rep.comment': 'Comment', 'rep.none': 'No entry.',
    'rep.ph.anamnesis': 'Reason for the measurement, history and current situation.', 'rep.ph.interpretation': 'Your interpretation of the results.',
    'rep.ph.conclusion': 'Your conclusion.', 'rep.ph.comment': 'Comment on this section.',
    'rep.report': 'Report', 'rep.template': 'Template', 'rep.software': 'Software', 'rep.norms': 'Norms', 'rep.system': 'Recording system', 'rep.measurement': 'Measurement',
    'rep.measV': '{d} · eyes open {eo} s · eyes closed {ec} s · VCPT {vm} min {vs} s', 'rep.st.draft': 'draft', 'rep.st.issued': 'issued', 'rep.st.replaced': 'issued, replaced',
    'rep.recording': 'Recording', 'rep.recordedS': 'Recorded', 'rep.analysed': 'Analysed', 'rep.measure': 'Measure', 'rep.condition': 'Condition', 'rep.value': 'Value',
    'rep.normMean': 'Norm mean', 'rep.tbrCz': 'Theta/beta ratio at Cz', 'rep.faa': 'Frontal alpha asymmetry', 'rep.apfHz': 'Alpha peak frequency, Hz',
    'rep.pair': 'Pair', 'rep.band': 'Band', 'rep.coherence': 'Coherence', 'rep.component': 'Component',
    'rep.trials': 'Trials', 'rep.site': 'Site', 'rep.ampUv': 'Amplitude, µV', 'rep.latMs': 'Latency, ms', 'rep.mean': 'mean', 'rep.vcptMeasure': 'VCPT measure',
    'rep.percentile': 'Percentile', 'rep.om': 'Omission errors', 'rep.cm': 'Commission errors', 'rep.rtMean': 'Reaction time, mean, ms',
    'rep.rtSd': 'Reaction time variability (SD), ms', 'rep.mapAlt': '{b} absolute power, {cond}, z map',
    'rep.sigIssued': 'Issued by Clinician 1, licensed psychologist, on {at}', 'rep.sigDraft': 'Clinician 1, licensed psychologist · signature added on issue',
    'rep.stampDraft': 'DRAFT', 'rep.stampRep': 'REPLACED BY v{v}', 'rep.companyLine': '[Company line placeholder]',
    'rep.ch.segments': 'Segments', 'rep.ch.cleaning': 'Artefact removal', 'rep.ch.marker': 'Alpha peak marker',
    'c.intro': 'This report presents the EEG, ERP and VCPT measurements of {name}, aged {age}, recorded on {recording_date} at Clinic C.',
    'c.introStd': 'This report presents the EEG, ERP and VCPT measurements of {name}, aged {age}, recorded on {recording_date}.',
    'c.addr1': '[Clinic address placeholder]', 'c.addr2': '[Phone and e-mail placeholder]',
    'c.by.company': 'Company (on request)', 'c.by.admin': 'Company admin', 'c.h.created': 'Created from the company default template',
    'c.h.logo': 'Logo placeholder, accent colour', 'c.h.cmp': 'Added comparison with the earlier measurement', 'c.h.std': 'Company standard layout: cover band, numbered sections, running header',
    'c.ck.segments': 'Segments', 'c.ck.cleaning': 'Cleaning', 'c.ck.marker': 'Alpha peak marker', 'c.ck.notConf': '{l} not confirmed', 'c.ck.pend': (p) => `${p.l}: ${p.n} change${p.n === 1 ? '' : 's'} pending confirmation`, 'c.ck.conf': '{l} confirmed',
    'c.ck.empty': '{l} is empty', 'c.ck.written': '{l} written', 'c.ck.emptyC': (p, L) => 'Empty ' + p.l,
    'c.nPages': (p) => `${p.n} page${p.n === 1 ? '' : 's'}`, 'c.nWarn': (p) => `${p.n} warning${p.n > 1 ? 's' : ''}`, 'c.nBlocks': '{n} blocks',
    'c.corrTitle': 'Correct report v{n}', 'c.corrOk': 'Start version {m}', 'c.corrReason': 'Reason for the correction (kept in the version history)',
    'c.corrPh': 'For example: typing error in the anamnesis', 'c.corrInfo': 'Version {n} stays issued until version {m} is issued. Both versions are kept.',
    'c.corrErr': 'Enter a reason.', 'c.log.corr': 'Started correction v{m} of report {id}: {why}', 'c.toast.corr': 'Draft v{m} started. v{n} stays issued.',
    'c.issueTitle': 'Issue report v{v}', 'c.issueOk': 'Issue v{v}', 'c.report': 'Report', 'c.template': 'Template', 'c.signedBy': 'Signed by', 'c.noWarn': 'No warnings',
    'c.reviewed': 'I reviewed the raw EEG, the analysed segments and the full results', 'c.issueInfo': 'An issued version cannot be edited. A correction creates a new version.',
    'c.firstIssue': 'First issue', 'c.log.issued': 'Issued report {id} (template {tid} v{tv}) after confirming review of the raw EEG, segments and results; signed by re-authentication; PDF SHA-256 (mockup placeholder) {h}',
    'c.toast.issued': 'Report v{v} issued',
    'c.outline': 'Outline', 'c.docAria': 'Document', 'c.fit': 'Fit', 'c.marks': 'Editing marks', 'c.log.addc': 'Added a {l}', 'c.log.rmc': 'Removed the {l}',
    'c.locked': 'Locked: company-verified block', 'c.clinicLocked': 'Clinic block: change it in the report template', 'c.saved': 'Draft saved {t}',
    'c.log.tpl': 'Changed the template of report draft v{v} from {a} to {b} v{tv} ({name})', 'c.toast.tpl': 'Template {name} applied. Device blocks and figures are unchanged.',
    'c.log.lang': 'Set the report language to {lang}', 'c.log.edit': 'Edited the {l} in report draft v{v} ({n} characters)', 'c.pagesA4': '{p} · A4',
    'c.issuedV': 'Issued v{v}', 'c.issuedBan': '{at} by {who}. Read only.', 'c.openIssued': 'Open issued', 'c.correct': 'Correct', 'c.corrV': 'Correction v{v}',
    'c.staysIssued': 'Version {a} stays issued until version {b} is issued.', 'c.reasonX': 'Reason: {r}', 'c.viewV': 'View v{v}',
    'c.langBan': 'Report in {r}; the interface stays in {ui}.', 'c.reportLangB': 'Report language',
    'c.kind.device': 'device', 'c.kind.clinic': 'clinic', 'c.kind.clinician': 'clinician', 'c.comment': 'Comment', 'c.commentOn': 'Comment: {b}', 'c.empty': 'empty', 'c.emptyT': 'Empty',
    'c.hdrItem': 'Clinic header', 'c.draft': 'Draft', 'c.issued': 'Issued', 'c.pages': 'Pages', 'c.author': 'Author',
    'c.tplFor': 'Template for this report', 'c.reportLang': 'Report language', 'c.choices': 'Choices shown in the report', 'c.open': 'open', 'c.before': 'Before issuing',
    'c.atIssue': 'Checks at issue', 'c.ready': 'ready', 'c.locks': '{n} device blocks locked', 'c.issueBtn': 'Issue v{v}…', 'c.confFirst': 'Confirm segments, cleaning, frequency marker and ERP peaks first', 'c.rejNo': 'Recording rejected: no report can be issued. Undo the rejection to continue.',
    'c.confFirstL': 'Issuing needs these confirmations:', 'c.correctThis': 'Correct this report', 'c.rmComment': 'Remove this comment', 'c.remove': 'Remove',
    'c.addComment': '+ Comment', 'c.addCommentT': 'Add a clinician comment after this section',
    'c.noIssued': 'No issued report yet', 'c.isDraft': 'The report for this measurement is a draft (v{v}).', 'c.openDraft': 'Open the report draft',
    'c.corrProg': 'Correction v{v} in progress', 'c.openDraftV': 'Open draft v{v}', 'c.ivAria': 'Issued report', 'c.tplUsed': 'Template used for this version',
    'c.replacedBy': 'Replaced by v{v}', 'c.version': 'Version', 'c.zoomOut': 'Zoom out', 'c.zoomIn': 'Zoom in', 'c.fitWidth': 'Fit width', 'c.download': '⤓ Download PDF',
    'c.pageN': 'Page {n}', 'c.issuedAtBy': 'Issued {at} by {who}', 'c.tplLine': 'Template {tid} v{tv} · {name}', 'c.checksum': 'PDF SHA-256 (mockup placeholder) {h}',
    'c.history': 'Version history', 'c.keptAll': 'Every issued version is kept', 'c.th.version': 'Version', 'c.th.status': 'Status', 'c.th.issued': 'Issued',
    'c.th.by': 'By', 'c.th.reason': 'Reason', 'c.th.template': 'Template', 'c.th.pages': 'Pages', 'c.notIssued': 'not issued', 'c.current': 'Issued, current',
    'c.log.viewed': 'Viewed issued report {id}', 'c.log.dl': 'Downloaded {id} as PDF', 'c.toast.dl': '{id}.pdf downloaded (mockup: no file is created)',
    'c.d.added': 'added {l}', 'c.d.removed': 'removed {l}', 'c.d.order': 'block order', 'c.d.intro': 'introduction text ({lang})', 'c.d.header': 'header lines ({lang})',
    'c.d.font': 'font {f}', 'c.d.hfont': 'heading font {f}', 'c.d.accent': 'accent colour', 'c.d.logo': 'logo position', 'c.d.addrOn': 'header lines shown',
    'c.d.addrOff': 'header lines hidden', 'c.d.pageOf': 'page numbering', 'c.d.comOn': 'clinician comments allowed', 'c.d.comOff': 'clinician comments off',
    'c.crumbTpl': 'Report templates', 'c.tplAria': 'Templates', 'c.companyTpl': 'company template', 'c.clinicTpl': 'clinic template', 'c.usedBy': ' · used by {code}',
    'c.chipCompany': 'company', 'c.chipClinic': 'clinic', 'c.inUse': 'v{v} in use by the {code} report draft', 'c.inUseN': 'v{v} in use by the report drafts {code}', 'c.avail': 'v{v} available to draft reports',
    'c.keepVer': ' · issued reports keep the version they were issued with', 'c.discard': 'Discard', 'c.saveAs': 'Save as {id} v{v}', 'c.blocksIn': 'Blocks in this template',
    'c.dragHint': 'drag to reorder', 'c.addBlocks': 'Add blocks', 'c.clinicTexts': 'Clinic texts', 'c.textLang': 'Text language', 'c.insert': 'Insert',
    'c.hdr1': 'Header line 1', 'c.hdr2': 'Header line 2', 'c.preview': 'Preview, pages 1 and 2', 'c.pvSub': '{code} · synthetic data · {lang}', 'c.theme': 'Theme',
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
    'c.needsRev': 'Needs company review.', 'c.claimWords': (p) => `Claim word${p.n > 1 ? 's' : ''} in clinic texts:`,
    'c.sendRev': 'Send to company review', 'c.noClaims': '✓ No claim words in clinic texts', 'c.needsRevT': 'Needs company review', 'c.noChanges': 'No changes',
    'c.unsaved': 'Unsaved changes', 'c.savedChip': 'Saved', 'c.saveBlocked': 'Save blocked', 'c.saveBlockedT': 'Needs company review: remove {w} from the clinic texts.',
    'c.inUseChip': 'in use', 'c.log.saveTpl': 'Saved report template {id} as version {v}: {change}',
    'c.toast.saved': 'Template {id} v{v} saved. Draft reports use it now; issued reports keep their version.',
  },
  de: {
    'c.tpl.CT-C': 'Klinik C', 'c.tpl.CT-STD': 'Firmenstandard', 'c.logoC': 'KLINIK C',
    'c.blk.intro': 'Einleitungstext', 'c.blk.versions': 'Versionen', 'c.blk.summary': 'Zusammenfassung der Abweichungen', 'c.blk.quality': 'Signalqualität',
    'c.blk.spectra_EO': 'Bandleistung, Augen offen', 'c.blk.spectra_EC': 'Bandleistung, Augen geschlossen', 'c.blk.ratios': 'Quotienten und Alpha-Peak',
    'c.blk.behaviour': 'VCPT-Aufgabenleistung', 'c.blk.comparison': 'Vergleich mit der Messung vom {d}', 'c.blk.limits': 'Hinweise zu den Ergebnissen',
    'c.blk.anamnesis': 'Anamnese und klinisches Gespräch', 'c.blk.interpretation': 'Interpretation', 'c.blk.conclusion': 'Beurteilung',
    'c.lab.comment': (p) => 'Kommentar nach ' + p.b,
    'rep.title': 'EEG- und ERP-Bericht', 'rep.patient': 'Patient', 'rep.code': 'Fallnummer', 'rep.born': 'Geburtsdatum', 'rep.recorded': 'Messdatum', 'rep.age': 'Alter', 'rep.sex': 'Geschlecht',
    'rep.page': 'Seite', 'rep.of': 'von', 'rep.comment': 'Kommentar', 'rep.none': 'Kein Eintrag.',
    'rep.ph.anamnesis': 'Anlass der Messung, Vorgeschichte und aktuelle Situation.', 'rep.ph.interpretation': 'Ihre Interpretation der Ergebnisse.',
    'rep.ph.conclusion': 'Ihre Beurteilung.', 'rep.ph.comment': 'Kommentar zu diesem Abschnitt.',
    'rep.report': 'Bericht', 'rep.template': 'Vorlage', 'rep.software': 'Software', 'rep.norms': 'Normdaten', 'rep.system': 'Aufnahmesystem', 'rep.measurement': 'Messung',
    'rep.measV': '{d} · Augen offen {eo} s · Augen geschlossen {ec} s · VCPT {vm} min {vs} s', 'rep.st.draft': 'Entwurf', 'rep.st.issued': 'freigegeben', 'rep.st.replaced': 'freigegeben, ersetzt',
    'rep.recording': 'Aufnahme', 'rep.recordedS': 'Aufgezeichnet', 'rep.analysed': 'Ausgewertet', 'rep.measure': 'Messgröße', 'rep.condition': 'Bedingung', 'rep.value': 'Wert',
    'rep.normMean': 'Normmittelwert', 'rep.tbrCz': 'Theta/Beta-Quotient an Cz', 'rep.faa': 'Frontale Alpha-Asymmetrie', 'rep.apfHz': 'Alpha-Peak-Frequenz, Hz',
    'rep.pair': 'Paar', 'rep.band': 'Band', 'rep.coherence': 'Kohärenz', 'rep.component': 'Komponente',
    'rep.trials': 'Durchgänge', 'rep.site': 'Elektrode', 'rep.ampUv': 'Amplitude, µV', 'rep.latMs': 'Latenz, ms', 'rep.mean': 'Mittelwert', 'rep.vcptMeasure': 'VCPT-Messgröße',
    'rep.percentile': 'Perzentil', 'rep.om': 'Auslassungsfehler', 'rep.cm': 'Fehlreaktionen (Kommissionsfehler)', 'rep.rtMean': 'Reaktionszeit, Mittelwert, ms',
    'rep.rtSd': 'Variabilität der Reaktionszeit (SD), ms', 'rep.mapAlt': '{b}, absolute Leistung, {cond}, z-Karte',
    'rep.sigIssued': 'Freigegeben von Untersucher 1, zugelassener Psychologe, am {at}', 'rep.sigDraft': 'Untersucher 1, zugelassener Psychologe · Signatur wird bei der Freigabe ergänzt',
    'rep.stampDraft': 'ENTWURF', 'rep.stampRep': 'ERSETZT DURCH v{v}', 'rep.companyLine': '[Platzhalter Firmenzeile]',
    'rep.ch.segments': 'Segmente', 'rep.ch.cleaning': 'Artefaktbereinigung', 'rep.ch.marker': 'Alpha-Peak-Marker',
    'c.intro': 'Dieser Bericht stellt die EEG-, ERP- und VCPT-Messungen von {name}, Alter {age}, vom {recording_date} in der Klinik C dar.',
    'c.introStd': 'Dieser Bericht stellt die EEG-, ERP- und VCPT-Messungen von {name}, Alter {age}, vom {recording_date} dar.',
    'c.addr1': '[Platzhalter Klinikadresse]', 'c.addr2': '[Platzhalter Telefon und E-Mail]',
    'c.by.company': 'Hersteller (auf Anfrage)', 'c.by.admin': 'Administration des Herstellers', 'c.h.created': 'Aus der Standardvorlage des Herstellers erstellt',
    'c.h.logo': 'Logo-Platzhalter, Akzentfarbe', 'c.h.cmp': 'Vergleich mit der früheren Messung hinzugefügt', 'c.h.std': 'Layout Firmenstandard: Titelband, nummerierte Abschnitte, laufende Kopfzeile',
    'c.ck.segments': 'Segmente', 'c.ck.cleaning': 'Bereinigung', 'c.ck.marker': 'Alpha-Peak-Marker', 'c.ck.notConf': '{l} nicht bestätigt', 'c.ck.pend': (p) => `${p.l}: ${p.n} Änderung${p.n === 1 ? '' : 'en'}, Bestätigung ausstehend`, 'c.ck.conf': '{l} bestätigt',
    'c.ck.empty': '{l} ist leer', 'c.ck.written': '{l} geschrieben', 'c.ck.emptyC': (p) => p.l + ' ist leer',
    'c.nPages': (p) => `${p.n} Seite${p.n === 1 ? '' : 'n'}`, 'c.nWarn': (p) => `${p.n} Warnung${p.n > 1 ? 'en' : ''}`, 'c.nBlocks': '{n} Blöcke',
    'c.corrTitle': 'Bericht v{n} korrigieren', 'c.corrOk': 'Version {m} beginnen', 'c.corrReason': 'Grund der Korrektur (bleibt in der Versionsgeschichte erhalten)',
    'c.corrPh': 'Zum Beispiel: Tippfehler in der Anamnese', 'c.corrInfo': 'Version {n} bleibt freigegeben, bis Version {m} freigegeben ist. Beide Versionen bleiben erhalten.',
    'c.corrErr': 'Bitte einen Grund angeben.', 'c.log.corr': 'Korrektur v{m} von Bericht {id} begonnen: {why}', 'c.toast.corr': 'Entwurf v{m} begonnen. v{n} bleibt freigegeben.',
    'c.issueTitle': 'Bericht v{v} freigeben', 'c.issueOk': 'v{v} freigeben', 'c.report': 'Bericht', 'c.template': 'Vorlage', 'c.signedBy': 'Signiert von', 'c.noWarn': 'Keine Warnungen',
    'c.reviewed': 'Ich habe das Roh-EEG, die ausgewerteten Segmente und die vollständigen Ergebnisse geprüft', 'c.issueInfo': 'Eine freigegebene Version kann nicht bearbeitet werden. Eine Korrektur erzeugt eine neue Version.',
    'c.firstIssue': 'Erstfreigabe', 'c.log.issued': 'Bericht {id} (Vorlage {tid} v{tv}) nach bestätigter Prüfung von Roh-EEG, Segmenten und Ergebnissen freigegeben; signiert durch erneute Anmeldung; PDF-SHA-256 (Mockup-Platzhalter) {h}',
    'c.toast.issued': 'Bericht v{v} freigegeben',
    'c.outline': 'Gliederung', 'c.docAria': 'Dokument', 'c.fit': 'Einpassen', 'c.marks': 'Bearbeitungsmarken', 'c.log.addc': '{l} hinzugefügt', 'c.log.rmc': '{l} entfernt',
    'c.locked': 'Gesperrt: vom Hersteller geprüfter Systemblock', 'c.clinicLocked': 'Klinikblock: in der Berichtsvorlage ändern', 'c.saved': 'Entwurf gespeichert {t}',
    'c.log.tpl': 'Vorlage des Berichtsentwurfs v{v} von {a} auf {b} v{tv} geändert ({name})', 'c.toast.tpl': 'Vorlage {name} angewendet. Systemblöcke und Abbildungen bleiben unverändert.',
    'c.log.lang': 'Berichtssprache auf {lang} gesetzt', 'c.log.edit': '{l} im Berichtsentwurf v{v} bearbeitet ({n} Zeichen)', 'c.pagesA4': '{p} · A4',
    'c.issuedV': 'Freigegeben v{v}', 'c.issuedBan': 'Am {at} von {who} freigegeben. Nur lesbar.', 'c.openIssued': 'Freigegebene Version öffnen', 'c.correct': 'Korrigieren', 'c.corrV': 'Korrektur v{v}',
    'c.staysIssued': 'Version {a} bleibt freigegeben, bis Version {b} freigegeben ist.', 'c.reasonX': 'Grund: {r}', 'c.viewV': 'v{v} ansehen',
    'c.langBan': 'Bericht auf {r}; die Oberfläche bleibt auf {ui}.', 'c.reportLangB': 'Berichtssprache',
    'c.kind.device': 'System', 'c.kind.clinic': 'Klinik', 'c.kind.clinician': 'Untersucher', 'c.comment': 'Kommentar', 'c.commentOn': 'Kommentar: {b}', 'c.empty': 'leer', 'c.emptyT': 'Leer',
    'c.hdrItem': 'Briefkopf der Klinik', 'c.draft': 'Entwurf', 'c.issued': 'Freigegeben', 'c.pages': 'Seiten', 'c.author': 'Verfasst von',
    'c.tplFor': 'Vorlage für diesen Bericht', 'c.reportLang': 'Berichtssprache', 'c.choices': 'Im Bericht genannte Entscheidungen', 'c.open': 'offen', 'c.before': 'Vor der Freigabe',
    'c.atIssue': 'Prüfungen bei der Freigabe', 'c.ready': 'bereit', 'c.locks': '{n} Systemblöcke gesperrt', 'c.issueBtn': 'v{v} freigeben…', 'c.confFirst': 'Zuerst Segmente, Bereinigung, Frequenzmarker und ERP-Peaks bestätigen', 'c.rejNo': 'Aufnahme abgelehnt: Es kann kein Bericht freigegeben werden. Heben Sie die Ablehnung auf, um fortzufahren.',
    'c.confFirstL': 'Für die Freigabe fehlen diese Bestätigungen:', 'c.correctThis': 'Diesen Bericht korrigieren', 'c.rmComment': 'Diesen Kommentar entfernen', 'c.remove': 'Entfernen',
    'c.addComment': '+ Kommentar', 'c.addCommentT': 'Kommentar der Untersucherin oder des Untersuchers nach diesem Abschnitt hinzufügen',
    'c.noIssued': 'Noch kein freigegebener Bericht', 'c.isDraft': 'Der Bericht zu dieser Messung ist ein Entwurf (v{v}).', 'c.openDraft': 'Berichtsentwurf öffnen',
    'c.corrProg': 'Korrektur v{v} in Arbeit', 'c.openDraftV': 'Entwurf v{v} öffnen', 'c.ivAria': 'Freigegebener Bericht', 'c.tplUsed': 'Für diese Version verwendete Vorlage',
    'c.replacedBy': 'Ersetzt durch v{v}', 'c.version': 'Version', 'c.zoomOut': 'Verkleinern', 'c.zoomIn': 'Vergrößern', 'c.fitWidth': 'Breite einpassen', 'c.download': '⤓ PDF herunterladen',
    'c.pageN': 'Seite {n}', 'c.issuedAtBy': 'Freigegeben am {at} von {who}', 'c.tplLine': 'Vorlage {tid} v{tv} · {name}', 'c.checksum': 'PDF-SHA-256 (Mockup-Platzhalter) {h}',
    'c.history': 'Versionsgeschichte', 'c.keptAll': 'Jede freigegebene Version bleibt erhalten', 'c.th.version': 'Version', 'c.th.status': 'Status', 'c.th.issued': 'Freigegeben',
    'c.th.by': 'Von', 'c.th.reason': 'Grund', 'c.th.template': 'Vorlage', 'c.th.pages': 'Seiten', 'c.notIssued': 'nicht freigegeben', 'c.current': 'Freigegeben, aktuell',
    'c.log.viewed': 'Freigegebenen Bericht {id} angesehen', 'c.log.dl': '{id} als PDF heruntergeladen', 'c.toast.dl': '{id}.pdf heruntergeladen (Mockup: es wird keine Datei erzeugt)',
    'c.d.added': '{l} hinzugefügt', 'c.d.removed': '{l} entfernt', 'c.d.order': 'Reihenfolge der Blöcke', 'c.d.intro': 'Einleitungstext ({lang})', 'c.d.header': 'Kopfzeilen ({lang})',
    'c.d.font': 'Schrift {f}', 'c.d.hfont': 'Schrift der Überschriften {f}', 'c.d.accent': 'Akzentfarbe', 'c.d.logo': 'Position des Logos', 'c.d.addrOn': 'Kopfzeilen angezeigt',
    'c.d.addrOff': 'Kopfzeilen ausgeblendet', 'c.d.pageOf': 'Seitennummerierung', 'c.d.comOn': 'Kommentare erlaubt', 'c.d.comOff': 'Kommentare ausgeschaltet',
    'c.crumbTpl': 'Berichtsvorlagen', 'c.tplAria': 'Vorlagen', 'c.companyTpl': 'Vorlage des Herstellers', 'c.clinicTpl': 'Vorlage der Klinik', 'c.usedBy': ' · verwendet für {code}',
    'c.chipCompany': 'Hersteller', 'c.chipClinic': 'Klinik', 'c.inUse': 'v{v} in Verwendung für den Berichtsentwurf {code}', 'c.inUseN': 'v{v} in Verwendung für die Berichtsentwürfe {code}', 'c.avail': 'v{v} für Berichtsentwürfe verfügbar',
    'c.keepVer': ' · freigegebene Berichte behalten die Version, mit der sie freigegeben wurden', 'c.discard': 'Verwerfen', 'c.saveAs': 'Als {id} v{v} speichern', 'c.blocksIn': 'Blöcke in dieser Vorlage',
    'c.dragHint': 'zum Umordnen ziehen', 'c.addBlocks': 'Blöcke hinzufügen', 'c.clinicTexts': 'Kliniktexte', 'c.textLang': 'Sprache des Textes', 'c.insert': 'Einfügen',
    'c.hdr1': 'Kopfzeile 1', 'c.hdr2': 'Kopfzeile 2', 'c.preview': 'Vorschau, Seiten 1 und 2', 'c.pvSub': '{code} · synthetische Daten · {lang}', 'c.theme': 'Gestaltung',
    'c.font': 'Schrift', 'c.fontStandin': '{f} (Firmenstandard)', 'c.hfont': 'Schrift der Überschriften', 'c.accent': 'Akzentfarbe', 'c.accentA': 'Akzent {a}', 'c.logo': 'Logo', 'c.replace': 'Ersetzen…', 'c.logoL': 'Logo links',
    'c.logoR': 'Logo rechts', 'c.header': 'Kopfbereich', 'c.showHdr': 'Kopfzeilen anzeigen', 'c.footer': 'Fußzeile', 'c.pageOf': 'Seite n von N',
    'c.always': 'Immer gedruckt: Mockup-Hinweis, Versionen, Berichtsnummer und Status.', 'c.stdStyle': ' Firmenstil: Titelband, römische Abschnittsnummern, kursive Kopfzeile ab Seite 2, limettengrünes Fußband.',
    'c.figFixed': 'Die Farben der Abbildungen sind fest.', 'c.figSame': 'Die z-Skala ist in jedem Klinikstil gleich.', 'c.tplVersions': 'Versionen der Vorlage',
    'c.toast.saveFirst': 'Zuerst die Änderungen an {id} speichern oder verwerfen', 'c.log.openTpl': 'Berichtsvorlage {id} geöffnet ({name})',
    'c.toast.logo': 'Logodateien werden im Mockup nicht verwendet; der Platzhalter bleibt', 'c.log.review': 'Kliniktexte von {id} zur Prüfung an den Hersteller gesendet: {w}',
    'c.toast.review': 'Zur Prüfung an den Hersteller gesendet. Speichern ist möglich, sobald die Wörter entfernt oder freigegeben sind.', 'c.toast.noChg': 'Keine ungespeicherten Änderungen', 'c.toast.disc': 'Änderungen verworfen',
    'c.fixedStd': 'Titelband, Logo und Identität der Patientin oder des Patienten', 'c.fixedC': 'Briefkopf der Klinik und Identität der Patientin oder des Patienten', 'c.fixedT': 'Fest oben auf Seite 1', 'c.fixed': 'fest',
    'c.reqT': 'In jeder Vorlage erforderlich: kann nicht entfernt werden', 'c.up': 'Nach oben', 'c.down': 'Nach unten', 'c.reqBlock': 'Pflichtblock', 'c.addBtn': '+ Hinzufügen',
    'c.allIn': 'Alle in der Vorlage', 'c.add.device': 'Systemblöcke', 'c.add.clinic': 'Klinikblöcke', 'c.add.clinician': 'Untersucherblöcke',
    'c.needsRev': 'Prüfung durch den Hersteller nötig.', 'c.claimWords': (p) => `Unzulässige${p.n > 1 ? '' : 'r'} Begriff${p.n > 1 ? 'e' : ''} in Kliniktexten:`,
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
    'c.blk.raw': 'Raw EEG excerpts', 'c.blk.coh_global': 'Global coherence, four types', 'c.blk.issuedby': 'Issued by',
    'c.cat.raw': 'display only',
    'rep.cohCap': 'Marked electrode pairs: they differ from the age norm after correction for multiple comparisons.', 'rep.noneMarked': 'No marked electrode pairs.',
    'rep.mapsCap': 'Maps: absolute power against the age norm; circles mark marked electrodes. Table: absolute (abs) and relative (rel) power, z per electrode; coloured cells are marked values.',
    'rep.zKey': 'Coloured z cells are marked values.', 'rep.movedKey': '* moved by the clinician',
    'rep.asyCap': 'Asymmetry index (right minus left) / (right plus left) per electrode pair: its z against the age norm at the right electrode of the pair and the same z with the opposite sign at the left electrode; midline 0. Circles mark the electrodes of marked pairs.',
    'rep.spCap': 'Log power from 1 to 30 Hz at each electrode. Grey band: age norm, mean plus or minus 2 SD. Dots: marked frequency bins.',
    'rep.m1Cap': 'z maps of absolute power per 1 Hz band (labels in Hz); circles mark marked electrodes.',
    'rep.erpCap': 'From -200 to 800 ms around the picture, positive up. Grey band: age norm, mean plus or minus 2 SD. Triangles: peaks in the peak table (open: moved by the clinician).',
    'rep.errCap': 'Errors per block of 40 trials, shown without norms.', 'rep.block': 'Block', 'rep.errors': 'Errors',
    'rep.rawCap': 'Excerpts of 10 seconds, average reference, {u} µV between baselines. Display only: no value in this report is read from them.',
    'rep.cohgCap': 'Mean coherence over all 171 electrode pairs per band and type, on a scale from 0 to 1.',
    'rep.ib.by': 'Name', 'rep.ib.qual': 'Qualification', 'rep.ib.at': 'Date and time', 'rep.ib.version': 'Version', 'rep.ib.replaces': 'Replaces', 'rep.ib.reason': 'Reason for the correction',
    'rep.ib.name': 'Clinician 1', 'rep.ib.q': 'Licensed psychologist', 'rep.ib.onIssue': 'added on issue', 'rep.ib.first': 'No earlier version (first issue)',
    'rep.ch.peaks': 'ERP peaks', 'c.ck.peaks': 'ERP peaks, {t} trials', 'c.edit': 'Open',
    'c.viewAs': 'View as', 'c.asClinic': 'Clinic user', 'c.asCompany': 'Company staff (first release)',
    'c.relNote': 'First release: the company edits templates; later: clinics edit their own.',
    'c.roBan': 'Read only for clinic users. In the first release the company sets up templates on request.', 'c.roChip': 'read only',
    'c.reqBtn': 'Request a change…', 'c.reqTitle': 'Request a change to {id}', 'c.reqOk': 'Send request', 'c.reqWhat': 'What should change?',
    'c.reqPh': 'For example: show the asymmetry maps after the coherence block', 'c.reqInfo': 'The company makes the change and publishes a new template version. Issued reports keep their version.',
    'c.reqErr': 'Describe the change.', 'c.log.req': 'Requested a change to report template {id}: {txt}', 'c.toast.req': 'Request sent to the company',
    'c.reqs': 'Change requests', 'c.reqSent': 'sent to the company', 'c.who.staff': 'Company staff',
    'c.comments': 'Clinician comments after result sections: always allowed',
    'c.blk.method': 'Method and norms', 'c.blk.freq_markers': 'Frequency markers', 'c.blk.erp_review': 'ERP peak review', 'c.blk.form': 'Clinician form',
    'c.blk.source_regions': 'Source power per brain region (sLORETA)', 'c.blk.comparisonN': 'Comparison of measurements', 'c.cat.erp_review': 'core, proposed', 'c.cat.source_regions': 'core, proposed',
    'c.vst': '{v}: core, proposed', 'rep.ftpa': 'Frontal theta / parietal alpha ratio', 'rep.ar': 'Alpha reactivity', 'rep.arCond': 'Eyes closed / eyes open',
    'rep.ratiosLeg': 'Frontal theta / parietal alpha ratio: mean absolute theta at F3, Fz and F4 over mean absolute alpha at P3, Pz and P4. Alpha reactivity: mean absolute alpha at P3, Pz, P4, O1 and O2, eyes closed over eyes open. Both are compared with the norm on a log scale and printed as the ratio.',
    'rep.glob4': 'Global coherence (mean over all electrode pairs), four types', 'rep.type': 'Type', 'rep.cohLagCap': 'Marked electrode pairs of lagged coherence: they differ from the age norm after correction for multiple comparisons.',
    'rep.srcT': 'z per brain region and band', 'rep.srcTV': 'Estimated source power (log10) per brain region and band', 'rep.region': 'Region',
    'rep.rvNN': 'No norm applies at this age: nothing is proposed and the review is not used.', 'rep.rvMoved': 'moved by the clinician', 'rep.ch.rv': 'ERP peak review', 'c.ck.rv': 'ERP peak review',
    'rep.udiText': 'UDI: placeholder, assigned at certification', 'rep.pipeline': 'Pipeline',
    'rep.inputSyn': 'synthetic input, not a recording file', 'rep.icaSeed': 'ICA seed', 'rep.processedAt': 'Processed', 'rep.processedFmt': '{d}, {tm}, in {s} s',
    'rep.fmConfirm': 'Frequency markers on the spectra (table 3.3, Core)', 'rep.fmNo': 'No.', 'rep.fmFreq': 'Frequency (Hz)', 'rep.fmQ': 'Question, answer', 'rep.fmChoice': 'Choice',
    'rep.fmSrc.suggested': 'suggested, confirmed', 'rep.fmSrc.moved': 'moved, confirmed', 'rep.fmSrc.added': 'placed by the clinician', 'rep.fmSrcPend': 'suggested, not yet confirmed',
    'rep.fmNone': 'No marker.', 'rep.fmMaps': 'Maps: z at the marker frequency', 'rep.fmLegend': 'Square: the electrode of the marker. Ring: marked value (after correction for multiple comparisons).',
    'rep.ph.anamF': 'As written by the clinician.', 'rep.earlier': 'Earlier', 'rep.current': 'Current', 'rep.uplLater': 'uploaded later',
    'rep.cmpMaps': 'Maps: absolute power, eyes closed, z against the age norm of each measurement; circles mark marked electrodes.',
    'rep.nnCap': 'No norm for this age: values without z, percentile or marks.', 'rep.seqKey': 'Colour: low to high value within each map, not a z scale',
    'rep.mapsCapV': 'Maps: absolute power, each map on its own scale from low to high value. Table: absolute power in µV² per electrode.', 'rep.mapAltV': '{b} absolute power, {cond}, map of values',
    'rep.m1CapV': 'Maps of absolute power per 1 Hz band (labels in Hz), each on its own scale.', 'rep.spCapV': 'Log power from 1 to 30 Hz at each electrode; no norm band for this age.',
    'rep.asyCapV': 'Asymmetry index (right minus left) / (right plus left) per homologous pair; no norm for this age.', 'rep.erpCapV': 'From -200 to 800 ms around the picture, positive up; no norm band for this age. Triangles: peaks in the peak table.',
    'rep.sexF': 'female', 'rep.sexM': 'male', 'rep.formEmpty': 'not answered', 'rep.ch.fm': 'Frequency markers per electrode',
    'c.ck.fm': 'Frequency markers, {cond}',
    'c.ck.form': (p) => `Clinician form: ${p.n} of ${p.m} rows empty`, 'c.ck.formOk': 'Clinician form filled in',
    'c.log.form': 'Set "{l}" in the clinician form of report draft v{v}', 'c.log.formClr': 'Cleared "{l}" in the clinician form of report draft v{v}',
    'c.repro': 'Reproducibility', 'c.reproSub': 'versions and inputs of the measurement {d}', 'c.store': 'identity store',
    'c.h.night': 'Added method and norms, frequency markers per electrode, the checklist over channel ERPs, the structured anamnesis and a clinician form',
    'c.h.nightStd': 'Added method and norms, frequency markers per electrode, the checklist over channel ERPs and the structured anamnesis',
    'c.h.oct30': 'Replaced the checklist over channel ERPs by the ERP peak review; coherence block in its new version (magnitude squared or lagged)',
    'c.h.oct30Std': 'Replaced the checklist over channel ERPs by the ERP peak review; added source power per brain region; coherence block in its new version (magnitude squared)',
  },
  de: {
    'c.blk.coherence': 'Kohärenz je Elektrodenpaar', 'c.blk.erp': 'ERP-Peakwerte', 'c.blk.asymmetry': 'Asymmetriekarten', 'c.blk.spectra_ch': 'Spektren je Elektrode',
    'c.blk.maps_1hz': 'Karten je 1-Hz-Band', 'c.blk.erp_waves': 'Kanal-ERP-Kurven, Go und NoGo', 'c.blk.errors': 'Fehler je Block von 40 Durchgängen',
    'c.blk.raw': 'Roh-EEG-Ausschnitte', 'c.blk.coh_global': 'Globale Kohärenz, vier Arten', 'c.blk.issuedby': 'Freigegeben von',
    'c.cat.raw': 'nur Anzeige',
    'rep.cohCap': 'Markierte Elektrodenpaare: Sie weichen nach Korrektur für multiple Vergleiche von der Altersnorm ab.', 'rep.noneMarked': 'Keine markierten Elektrodenpaare.',
    'rep.mapsCap': 'Karten: absolute Leistung gegen die Altersnorm; Kreise zeigen markierte Elektroden. Tabelle: absolute (abs) und relative (rel) Leistung, z je Elektrode; farbige Zellen sind markierte Werte.',
    'rep.zKey': 'Farbige z-Zellen sind markierte Werte.', 'rep.movedKey': '* von der Untersucherin oder dem Untersucher verschoben',
    'rep.asyCap': 'Asymmetrieindex (rechts minus links) / (rechts plus links) je Elektrodenpaar: sein z gegen die Altersnorm an der rechten Elektrode des Paars und dasselbe z mit umgekehrtem Vorzeichen an der linken Elektrode; Mittellinie 0. Kreise zeigen die Elektroden markierter Paare.',
    'rep.spCap': 'Log-Leistung von 1 bis 30 Hz an jeder Elektrode. Graues Band: Altersnorm, Mittelwert plus oder minus 2 SD. Punkte: markierte Frequenzschritte.',
    'rep.m1Cap': 'z-Karten der absoluten Leistung je 1-Hz-Band (Beschriftung in Hz); Kreise zeigen markierte Elektroden.',
    'rep.erpCap': 'Von -200 bis 800 ms um das Bild, positiv nach oben. Graues Band: Altersnorm, Mittelwert plus oder minus 2 SD. Dreiecke: Peaks der Peaktabelle (offen: von der Untersucherin oder dem Untersucher verschoben).',
    'rep.errCap': 'Fehler je Block von 40 Durchgängen, ohne Normdaten dargestellt.', 'rep.block': 'Block', 'rep.errors': 'Fehler',
    'rep.rawCap': 'Ausschnitte von 10 Sekunden, Durchschnittsreferenz, {u} µV zwischen den Grundlinien. Nur zur Anzeige: kein Wert dieses Berichts wird daraus abgelesen.',
    'rep.cohgCap': 'Mittlere Kohärenz über alle 171 Elektrodenpaare je Band und Art, auf einer Skala von 0 bis 1.',
    'rep.ib.by': 'Name', 'rep.ib.qual': 'Qualifikation', 'rep.ib.at': 'Datum und Uhrzeit', 'rep.ib.version': 'Version', 'rep.ib.replaces': 'Ersetzt', 'rep.ib.reason': 'Grund der Korrektur',
    'rep.ib.name': 'Untersucher 1', 'rep.ib.q': 'Zugelassener Psychologe', 'rep.ib.onIssue': 'wird bei der Freigabe ergänzt', 'rep.ib.first': 'Keine frühere Version (Erstfreigabe)',
    'rep.ch.peaks': 'ERP-Peaks', 'c.ck.peaks': 'ERP-Peaks, {t}-Durchgänge', 'c.edit': 'Öffnen',
    'c.viewAs': 'Ansicht als', 'c.asClinic': 'Klinikbenutzer', 'c.asCompany': 'Mitarbeitende des Herstellers (erste Ausbaustufe)',
    'c.relNote': 'Erste Ausbaustufe: Der Hersteller bearbeitet die Vorlagen; später bearbeiten Kliniken ihre eigenen.',
    'c.roBan': 'Für Klinikbenutzer nur lesbar. In der ersten Ausbaustufe richtet der Hersteller die Vorlagen auf Anfrage ein.', 'c.roChip': 'nur lesbar',
    'c.reqBtn': 'Änderung anfragen…', 'c.reqTitle': 'Änderung an {id} anfragen', 'c.reqOk': 'Anfrage senden', 'c.reqWhat': 'Was soll geändert werden?',
    'c.reqPh': 'Zum Beispiel: Asymmetriekarten nach dem Kohärenzblock zeigen', 'c.reqInfo': 'Der Hersteller nimmt die Änderung vor und veröffentlicht eine neue Version der Vorlage. Freigegebene Berichte behalten ihre Version.',
    'c.reqErr': 'Bitte die Änderung beschreiben.', 'c.log.req': 'Änderung an Berichtsvorlage {id} angefragt: {txt}', 'c.toast.req': 'Anfrage an den Hersteller gesendet',
    'c.reqs': 'Änderungsanfragen', 'c.reqSent': 'an den Hersteller gesendet', 'c.who.staff': 'Mitarbeitende des Herstellers',
    'c.comments': 'Kommentare der Untersucherin oder des Untersuchers nach Ergebnisabschnitten: immer erlaubt',
    'c.blk.method': 'Methode und Normdaten', 'c.blk.freq_markers': 'Frequenzmarker', 'c.blk.erp_review': 'ERP-Peak-Prüfung', 'c.blk.form': 'Formular der Untersucherin oder des Untersuchers',
    'c.blk.source_regions': 'Quellenleistung je Hirnregion (sLORETA)', 'c.blk.comparisonN': 'Vergleich der Messungen', 'c.cat.erp_review': 'Kern, vorgeschlagen', 'c.cat.source_regions': 'Kern, vorgeschlagen',
    'c.vst': '{v}: Kern, vorgeschlagen', 'rep.ftpa': 'Verhältnis frontales Theta / parietales Alpha', 'rep.ar': 'Alpha-Reaktivität', 'rep.arCond': 'Augen geschlossen / Augen offen',
    'rep.ratiosLeg': 'Verhältnis frontales Theta / parietales Alpha: mittleres absolutes Theta an F3, Fz und F4 geteilt durch mittleres absolutes Alpha an P3, Pz und P4. Alpha-Reaktivität: mittleres absolutes Alpha an P3, Pz, P4, O1 und O2, Augen geschlossen geteilt durch Augen offen. Beide werden auf logarithmischer Skala mit der Norm verglichen und als Quotient gezeigt.',
    'rep.glob4': 'Globale Kohärenz (Mittel über alle Elektrodenpaare), vier Arten', 'rep.type': 'Art', 'rep.cohLagCap': 'Markierte Elektrodenpaare der verzögerten Kohärenz: Sie weichen nach Korrektur für multiple Vergleiche von der Altersnorm ab.',
    'rep.srcT': 'z je Hirnregion und Band', 'rep.srcTV': 'Geschätzte Quellenleistung (log10) je Hirnregion und Band', 'rep.region': 'Region',
    'rep.rvNN': 'Für dieses Alter gelten keine Normdaten: Es wird nichts vorgeschlagen, und die Prüfung wird nicht verwendet.', 'rep.rvMoved': 'von der Untersucherin oder dem Untersucher verschoben', 'rep.ch.rv': 'ERP-Peak-Prüfung', 'c.ck.rv': 'ERP-Peak-Prüfung',
    'rep.udiText': 'UDI: Platzhalter, wird bei der Zertifizierung vergeben', 'rep.pipeline': 'Verarbeitungskette',
    'rep.inputSyn': 'synthetische Eingabe, keine Aufnahmedatei', 'rep.icaSeed': 'ICA-Startwert', 'rep.processedAt': 'Verarbeitet', 'rep.processedFmt': '{d}, {tm} Uhr, in {s} s',
    'rep.fmConfirm': 'Frequenzmarker auf den Spektren (Tabelle 3.3, Kern)', 'rep.fmNo': 'Nr.', 'rep.fmFreq': 'Frequenz (Hz)', 'rep.fmQ': 'Frage, Antwort', 'rep.fmChoice': 'Auswahl',
    'rep.fmSrc.suggested': 'vorgeschlagen, bestätigt', 'rep.fmSrc.moved': 'verschoben, bestätigt', 'rep.fmSrc.added': 'von der Untersucherin oder dem Untersucher gesetzt', 'rep.fmSrcPend': 'vorgeschlagen, noch nicht bestätigt',
    'rep.fmNone': 'Kein Marker.', 'rep.fmMaps': 'Karten: z bei der Frequenz des Markers', 'rep.fmLegend': 'Quadrat: Elektrode des Markers. Ring: markierter Wert (nach Korrektur für multiple Vergleiche).',
    'rep.ph.anamF': 'Wie von der Untersucherin oder dem Untersucher geschrieben.', 'rep.earlier': 'Früher', 'rep.current': 'Aktuell', 'rep.uplLater': 'später hochgeladen',
    'rep.cmpMaps': 'Karten: absolute Leistung, Augen geschlossen, z gegen die Altersnorm jeder Messung; Kreise zeigen markierte Elektroden.',
    'rep.nnCap': 'Keine Norm für dieses Alter: Werte ohne z, Perzentil oder Markierung.', 'rep.seqKey': 'Farbe: niedriger bis hoher Wert innerhalb jeder Karte, keine z-Skala',
    'rep.mapsCapV': 'Karten: absolute Leistung, jede Karte auf ihrer eigenen Skala von niedrigem bis hohem Wert. Tabelle: absolute Leistung in µV² je Elektrode.', 'rep.mapAltV': '{b}, absolute Leistung, {cond}, Wertekarte',
    'rep.m1CapV': 'Karten der absoluten Leistung je 1-Hz-Band (Beschriftung in Hz), jede auf ihrer eigenen Skala.', 'rep.spCapV': 'Log-Leistung von 1 bis 30 Hz an jeder Elektrode; kein Normband für dieses Alter.',
    'rep.asyCapV': 'Asymmetrieindex (rechts minus links) / (rechts plus links) je homologem Paar; keine Norm für dieses Alter.', 'rep.erpCapV': 'Von -200 bis 800 ms um das Bild, positiv nach oben; kein Normband für dieses Alter. Dreiecke: Peaks der Peaktabelle.',
    'rep.sexF': 'weiblich', 'rep.sexM': 'männlich', 'rep.formEmpty': 'nicht beantwortet', 'rep.ch.fm': 'Frequenzmarker je Elektrode',
    'c.ck.fm': 'Frequenzmarker, {cond}',
    'c.ck.form': (p) => `Formular: ${p.n} von ${p.m} Zeilen leer`, 'c.ck.formOk': 'Formular ausgefüllt',
    'c.log.form': '„{l}“ im Formular des Berichtsentwurfs v{v} gesetzt', 'c.log.formClr': '„{l}“ im Formular des Berichtsentwurfs v{v} geleert',
    'c.repro': 'Reproduzierbarkeit', 'c.reproSub': 'Versionen und Eingaben der Messung vom {d}', 'c.store': 'Identitätsspeicher',
    'c.h.night': 'Methode und Normdaten, Frequenzmarker je Elektrode, Checkliste über die Kanal-ERPs, strukturierte Anamnese und ein Formular hinzugefügt',
    'c.h.nightStd': 'Methode und Normdaten, Frequenzmarker je Elektrode, Checkliste über die Kanal-ERPs und strukturierte Anamnese hinzugefügt',
    'c.h.oct30': 'Checkliste über die Kanal-ERPs durch die ERP-Peak-Prüfung ersetzt; Kohärenzblock in neuer Version (Betragsquadrat oder verzögert)',
    'c.h.oct30Std': 'Checkliste über die Kanal-ERPs durch die ERP-Peak-Prüfung ersetzt; Quellenleistung je Hirnregion hinzugefügt; Kohärenzblock in neuer Version (Betragsquadrat)',
  },
});
/* third dictionary (night round 2): issue as a signature (D1), checklist before issue (C5), result sets (A9), versions rows
   (A8, B11, D3), summary table (C3), text sources (D7), the no-norm case (lead decision 2) */
A.addI18n({
  en: {
    'c.q.c1': 'licensed psychologist', 'c.q.c2': 'physician', 'c.sigAs': '{who}, {q}', 'c.awake': 'I checked the analysed segments for drowsiness: the patient was awake',
    'c.code': 'One-time code from your authenticator app', 'c.codePh': '6 digits', 'c.reauth': 'Sign by re-authentication',
    'c.sigNote': 'Electronic signature by re-authentication at issue. Mockup: any 6 digits; nothing is checked or stored.',
    'c.req': 'Required to issue', 'c.reqN': '{k} of {n} done', 'c.recm': 'Also to check', 'c.ck.rs': 'New result set {n} is being computed: step {s} of 9', 'c.ck.rsDone': 'Result set {n} computed',
    'c.noIssue': 'No report can be issued', 'c.tplNew': 'Template updated to v{v} by the company: review the preview', 'c.tplUse': 'Use v{v}', 'c.tplKeep': 'This draft keeps v{o} until you accept.',
    'c.log.tplUse': 'Accepted template {id} v{v} for report draft v{r} (was v{o})', 'c.th.rs': 'Result set', 'c.sets': 'Result sets of this measurement', 'c.usedByH': 'Used by',
    'c.rsAfter': 'after a confirmed change', 'c.rsComparison': 'comparison', 'c.rsFrozen': 'frozen',
    'rep.udi': 'Device identifier (UDI-DI)', 'rep.inputSha': 'Input checksum (sha256 of the de-identified signal)', 'rep.normsFmt': '{norms}; dataset version {v}',
    'rep.textlib': 'Text library', 'rep.textlibNote': '', 'rep.blocksCat': 'Device blocks', 'rep.rs': 'Result set', 'rep.marking': 'Marking',
    'rep.markingT': 'Benjamini-Hochberg, q = {q} within each analysis block (stand-in)', 'rep.seedFmt': '{seed} (derived from the recording and stored)', 'rep.tplFmt': '{id} v{v} · {clinic} · {lang}',
    'rep.ib.q.c1': 'Licensed psychologist', 'rep.ib.q.c2': 'Physician', 'rep.ib.sig': 'Signature', 'rep.ib.sigV': 'electronic, by re-authentication at issue',
    'rep.ib.draft': 'Name, qualification, date and time and the signature are added on issue.',
    'rep.sumT': 'Largest marked deviations, as in the summary', 'rep.sumA': 'Analysis and condition', 'rep.sumW': 'Electrode or pair, z',
    'rep.key': 'Reading key: z is the distance of a value from the normative mean in standard deviations of the normative sample. Cell and map colours show z on the fixed scale (blue below, red above the age norm). Bold with a ring: a value marked after correction for multiple comparisons.',
    'rep.asyPairs': 'Marked electrode pairs', 'rep.asyIdx': 'Index', 'rep.asySide': 'More power at',
    'rep.src': 'Text sources', 'rep.srcIntro': 'System sentences in this report come from the fixed sentence library {v}{note}. Sentence ids by section:',
    'rep.rawNone': 'No excerpt chosen.', 'rep.rawCapN': 'Synthetic signal, not a recording: excerpts of 8 s chosen by the clinician in the recording viewer, after artefact removal, average reference, 19 channels, negative up.',
    'rep.clinHid': 'comment given (hidden)', 'rep.blocksV': 'Device blocks {v}',
    'c.val.title': 'Validate {id} v{v}', 'c.val.ok': 'Submit for release', 'c.val.req': 'Required blocks present', 'c.val.dep': 'Every family the summary ranks has its block',
    'c.val.depMiss': 'The summary ranks {l}, but the template has no block for it', 'c.val.font': 'Fonts from the approved list (or the company standard stand-ins, M30)', 'c.val.size': 'Text sizes are fixed by the layout (body 12 px, tables 11 px)',
    'c.val.claim': 'No claim words in the clinic texts', 'c.val.lang': 'Both languages render ({n} pages English, {m} pages German)', 'c.val.var': 'Device block references from the catalogue {v}',
    'c.val.fail': 'Fix the failing checks before submitting.', 'c.val.info': 'A submitted version is released by a second company person; open drafts keep their version until the clinician accepts the new one.',
    'c.pend': 'v{v} submitted for release', 'c.pendBy': 'Submitted {at} by {who}. A second company person releases it.', 'c.release': 'Release as Company staff, S2', 'c.withdraw': 'Withdraw',
    'c.who.staff2': 'Company staff, S2', 'c.log.submit': 'Submitted report template {id} v{v} for release: {change}', 'c.log.release': 'Released report template {id} v{v}',
    'c.log.withdraw': 'Withdrew report template {id} v{v} from release', 'c.toast.submit': '{id} v{v} submitted for release', 'c.toast.release': '{id} v{v} released. Open drafts keep their version until accepted.',
    'c.submitFirst': 'v{v} is waiting for release', 'c.validate': 'Validate and submit v{v}…', 'c.variant': 'Variant', 'c.d.variant': 'variant of {l}',
    'c.spec': 'Template specification', 'c.specBlocks': 'Blocks, in order', 'c.specTheme': 'Theme', 'c.specTexts': 'Clinic texts, rendered', 'c.specFont': 'Font {f}', 'c.specHFont': 'heading font {f}',
    'c.specLogo': 'logo {p}', 'c.specLeft': 'left', 'c.specRight': 'right', 'c.specHdrOn': 'header lines shown', 'c.specHdrOff': 'header lines hidden', 'c.specPageOf': 'page n of N', 'c.specPage': 'page n',
  },
  de: {
    'c.q.c1': 'zugelassener Psychologe', 'c.q.c2': 'Arzt', 'c.sigAs': '{who}, {q}', 'c.awake': 'Ich habe die ausgewerteten Segmente auf Müdigkeit geprüft: Die Person war wach',
    'c.code': 'Einmalcode aus Ihrer Authentifizierungs-App', 'c.codePh': '6 Ziffern', 'c.reauth': 'Durch erneute Anmeldung signieren',
    'c.sigNote': 'Elektronische Signatur durch erneute Anmeldung bei der Freigabe. Mockup: beliebige 6 Ziffern; nichts wird geprüft oder gespeichert.',
    'c.req': 'Für die Freigabe erforderlich', 'c.reqN': '{k} von {n} erledigt', 'c.recm': 'Außerdem prüfen', 'c.ck.rs': 'Neuer Ergebnissatz {n} wird berechnet: Schritt {s} von 9', 'c.ck.rsDone': 'Ergebnissatz {n} berechnet',
    'c.noIssue': 'Es kann kein Bericht freigegeben werden', 'c.tplNew': 'Vorlage vom Hersteller auf v{v} aktualisiert: Vorschau prüfen', 'c.tplUse': 'v{v} übernehmen', 'c.tplKeep': 'Dieser Entwurf behält v{o}, bis Sie zustimmen.',
    'c.log.tplUse': 'Vorlage {id} v{v} für den Berichtsentwurf v{r} übernommen (bisher v{o})', 'c.th.rs': 'Ergebnissatz', 'c.sets': 'Ergebnissätze dieser Messung', 'c.usedByH': 'Verwendet von',
    'c.rsAfter': 'nach einer bestätigten Änderung', 'c.rsComparison': 'Vergleich', 'c.rsFrozen': 'eingefroren',
    'rep.udi': 'Produktkennung (UDI-DI)', 'rep.inputSha': 'Prüfsumme der Eingabe (sha256 des Signals ohne Identität)', 'rep.normsFmt': '{norms}; Datensatzversion {v}',
    'rep.textlib': 'Satzbibliothek', 'rep.textlibNote': ' (deutsche Formulierungen nicht geprüft)', 'rep.blocksCat': 'Systemblöcke', 'rep.rs': 'Ergebnissatz', 'rep.marking': 'Markierung',
    'rep.markingT': 'Benjamini-Hochberg, q = {q} innerhalb jedes Analyseblocks (vorläufig)', 'rep.seedFmt': '{seed} (aus der Aufnahme abgeleitet und gespeichert)', 'rep.tplFmt': '{id} v{v} · {clinic} · {lang}',
    'rep.ib.q.c1': 'Zugelassener Psychologe', 'rep.ib.q.c2': 'Arzt', 'rep.ib.sig': 'Unterschrift', 'rep.ib.sigV': 'elektronisch, durch erneute Anmeldung bei der Freigabe',
    'rep.ib.draft': 'Name, Qualifikation, Datum und Uhrzeit sowie die Unterschrift werden bei der Freigabe ergänzt.',
    'rep.sumT': 'Größte markierte Abweichungen, wie in der Zusammenfassung', 'rep.sumA': 'Analyse und Bedingung', 'rep.sumW': 'Elektrode oder Paar, z',
    'rep.key': 'Lesehilfe: z ist der Abstand eines Werts vom normativen Mittelwert in Standardabweichungen der Normstichprobe. Zellen- und Kartenfarben zeigen z auf der festen Skala (blau unter, rot über der Altersnorm). Fett mit Ring: ein nach Korrektur für multiple Vergleiche markierter Wert.',
    'rep.asyPairs': 'Markierte Elektrodenpaare', 'rep.asyIdx': 'Index', 'rep.asySide': 'Mehr Leistung an',
    'rep.src': 'Textquellen', 'rep.srcIntro': 'Die Systemsätze dieses Berichts stammen aus der festen Satzbibliothek {v}{note}. Satzkennungen je Abschnitt:',
    'rep.rawNone': 'Kein Ausschnitt gewählt.', 'rep.rawCapN': 'Synthetisches Signal, keine Aufnahme: Ausschnitte von 8 s, im Aufnahmebetrachter von der Untersucherin oder dem Untersucher gewählt, nach der Artefaktentfernung, Durchschnittsreferenz, 19 Kanäle, negativ oben.',
    'rep.clinHid': 'Kommentar vorhanden (verborgen)', 'rep.blocksV': 'Systemblöcke {v}',
    'c.val.title': '{id} v{v} prüfen', 'c.val.ok': 'Zur Freigabe einreichen', 'c.val.req': 'Pflichtblöcke vorhanden', 'c.val.dep': 'Jede Familie, die die Zusammenfassung nennt, hat ihren Block',
    'c.val.depMiss': 'Die Zusammenfassung nennt {l}, die Vorlage hat dafür keinen Block', 'c.val.font': 'Schriften aus der zugelassenen Liste (oder die Ersatzschriften des Herstellerstandards, M30)', 'c.val.size': 'Schriftgrößen sind durch das Layout festgelegt (Text 12 px, Tabellen 11 px)',
    'c.val.claim': 'Keine Anspruchswörter in den Kliniktexten', 'c.val.lang': 'Beide Sprachen werden erzeugt ({n} Seiten Englisch, {m} Seiten Deutsch)', 'c.val.var': 'Systemblock-Referenzen aus dem Katalog {v}',
    'c.val.fail': 'Beheben Sie die fehlgeschlagenen Prüfungen vor dem Einreichen.', 'c.val.info': 'Eine eingereichte Version gibt eine zweite Person des Herstellers frei; offene Entwürfe behalten ihre Version, bis die Untersucherin oder der Untersucher der neuen zustimmt.',
    'c.pend': 'v{v} zur Freigabe eingereicht', 'c.pendBy': 'Eingereicht am {at} von {who}. Eine zweite Person des Herstellers gibt sie frei.', 'c.release': 'Als Herstellerpersonal S2 freigeben', 'c.withdraw': 'Zurückziehen',
    'c.who.staff2': 'Herstellerpersonal, S2', 'c.log.submit': 'Berichtsvorlage {id} v{v} zur Freigabe eingereicht: {change}', 'c.log.release': 'Berichtsvorlage {id} v{v} freigegeben',
    'c.log.withdraw': 'Berichtsvorlage {id} v{v} von der Freigabe zurückgezogen', 'c.toast.submit': '{id} v{v} zur Freigabe eingereicht', 'c.toast.release': '{id} v{v} freigegeben. Offene Entwürfe behalten ihre Version bis zur Zustimmung.',
    'c.submitFirst': 'v{v} wartet auf Freigabe', 'c.validate': 'v{v} prüfen und einreichen…', 'c.variant': 'Variante', 'c.d.variant': 'Variante von {l}',
    'c.spec': 'Vorlagenbeschreibung', 'c.specBlocks': 'Blöcke in Reihenfolge', 'c.specTheme': 'Gestaltung', 'c.specTexts': 'Kliniktexte, wie gedruckt', 'c.specFont': 'Schrift {f}', 'c.specHFont': 'Überschriftenschrift {f}',
    'c.specLogo': 'Logo {p}', 'c.specLeft': 'links', 'c.specRight': 'rechts', 'c.specHdrOn': 'Kopfzeilen sichtbar', 'c.specHdrOff': 'Kopfzeilen ausgeblendet', 'c.specPageOf': 'Seite n von N', 'c.specPage': 'Seite n',
  },
});

/* ---------------- fixed sentences for the clinician's choices (3.4), in the report language ----------------
   Templates with {named} slots from the shared library (data.json choice_sentences and choice_parts, from
   mockup/textlib.py, one id set with the PDF, M51); no inline copy, so a sentence the library lacks shows its id. */
const CS0 = { en: {}, de: {} }, CP0 = { en: {}, de: {} };
const lib = (k, k0, L, id) => (((A.data[k] || {})[L] || {})[id]) ?? (((A.data[k] || {}).en || {})[id]) ?? id;
const fillT = (t, p) => String(t).replace(/\{(\w+)\}/g, (m, k) => p[k] != null ? p[k] : m);
const part = (L, id, p) => fillT(lib('choice_parts', CP0, L, id), p || {});
/* capitalise the first letter when the template starts with a slot, as textlib.say does */
const cs = (L, id, p) => { const t = lib('choice_sentences', CS0, L, id), x = fillT(t, p || {}); return { id, text: t[0] === '{' ? x.charAt(0).toUpperCase() + x.slice(1) : x }; };
/* "not marked (z = 0.4)" or "later than the age norm (z = 3.7)": kind 'v' value, 'lat' latency, 'neg' negative component */
function zState(L, z, marked, kind) {
  const w = !marked ? 'not' : kind === 'lat' ? (z > 0 ? 'later' : 'earlier') : kind === 'neg' ? (z < 0 ? 'more_negative' : 'less_negative') : (z > 0 ? 'above' : 'below');
  return part(L, 'state_z', { state: part(L, 'state.' + w), z: fx(z, 1, L) });
}
const bhMarked = A.bhMarked, r1 = A.r1;
const NEG = new Set(['N1', 'N2', 'CNV']);
/* trial types with scored peaks (a latency the clinician can move); Ignore has none and needs no confirmation */
const PKT = () => ['go', 'nogo', 'ignore', 'novelty'].filter(t => M2().erp.peaks.some(p => p.condition === t && p.latency_ms != null));
/* the alpha peak marker needs a confirmation unless there is no age norm (no z to state, M58) or no eyes closed result */
const mkNeeded = () => !NN() && !MISS('EC');

/* the clinician's choices as they stand now; an issued version keeps its own copy */
function snapNow() {
  const s = A.state, sg = s.segments || {}, mk = s.markers || {};
  return { seg: { confirmed: !!sg.confirmed, changes: typeof sg.changes === 'number' ? sg.changes : (sg.changes || []).length || 0, analysed: clone(sg.analysed || null), proposed: clone(sg.proposed || null) },
    mk: { confirmed: !!mk.confirmed, hz: mk.hz ?? null }, peaks: clone(s.peaks || {}), ex: A.ex ? A.ex.snap() : null, cmp: cmpSet().map(m => m.id),
    /* excerpts chosen in the recording viewer and the components removed per recording (review C12), frozen at issue; the result set (A9, B7) */
    exc: A.ax ? clone(A.ax.excerpts()) : null, rm: A.ax ? Object.fromEntries(['EO', 'EC', 'VCPT'].map(r => [r, A.ax.removed(r)])) : null, rs: rsId() };
}
/* the result set the report uses: the one on screen after a confirmed change (APP.rs, results module), else the current set of the data */
const rsId = () => { const r = A.rs && A.rs.now ? A.rs.now() : null; if (r && r.id) return r.id; const rs = A.m2.result_sets || []; return rs.length ? rs[rs.length - 1].id : ''; };
const rsBusy = () => { const r = A.rs && A.rs.now ? A.rs.now() : null; return r && r.after && !r.done ? r : null; };
const segA = (sn, k) => { const a = ((sn || {}).seg || {}).analysed; return a && a[k] != null ? a[k] : (M2().quality.recordings[k] || {}).analysed_s; };
const segP = (sn, k) => { const a = ((sn || {}).seg || {}).proposed; return a && a[k] != null ? a[k] : (M2().quality.recordings[k] || {}).analysed_s; };
/* alpha peak, eyes closed: the suggestion, or the value the clinician moved it to and confirmed */
function apfOf(sn) {
  const ap = SP().EC.alpha_peak, sug = ap.hz, m = sn.mk;
  const st = m.confirmed ? (m.hz != null && Math.abs(m.hz - sug) > 1e-6 ? 'moved' : 'conf') : 'auto';
  if (st !== 'moved') return { st, sug, hz: sug, z: ap.z, marked: ap.marked };
  const z = r1((m.hz - ap.norm_mean) / ap.norm_sd); return { st, sug, hz: m.hz, z, marked: bhMarked([z, SP().EC.tbr.z, SP().EC.faa.z], 0) };
}
/* the marker as the report states it: MK-AUTO-1 or MK-MOVED-1 once confirmed; before that the library
   sentences of the suggested alpha peak (APF-...) stand, followed by MK-PEND-1 */
const apfLib = (L) => (SM(L).spectra_EC || []).filter(s => s.id.startsWith('APF'));
const mkPend = (L) => cs(L, 'MK-PEND-1', { hz: fx(SP().EC.alpha_peak.hz, 1, L) });
const mkList = (L, sn) => { const a = apfOf(sn); if (!mkNeeded()) return apfLib(L); if (a.st === 'auto') return apfLib(L).concat([mkPend(L)]);
  return [cs(L, a.st === 'moved' ? 'MK-MOVED-1' : 'MK-AUTO-1', { suggested: fx(a.sug, 1, L), confirmed: fx(a.hz, 1, L), state: zState(L, a.z, a.marked, 'v') })]; };
/* ERP peaks: confirmed moves replace the suggested peak (APP.peaksNow, shared with the Results tab) */
const peaksOf = (sn) => A.peaksNow(sn.peaks || {});
function peakSentences(L, sn) {
  const P = sn.peaks || {}, pk = peaksOf(sn), out = [];
  /* without an age norm the peaks cannot be moved or confirmed (M58), so no "not yet confirmed" sentence */
  if (NN()) return out;
  PKT().forEach(t => {
    const st = P[t] || {}, tl = trialL[t], mv = pk.filter(p => p.condition === t && p.moved);
    const n = (st.moved || []).length; if (!st.confirmed) return out.push(cs(L, n ? 'ERP-PEAK-PEND-1' : 'ERP-PEAK-PEND-0', { trial: tl, n }));
    if (!mv.length) return out.push(cs(L, 'ERP-PEAK-AUTO-1', { trial: tl }));
    mv.forEach(p => out.push(cs(L, 'ERP-PEAK-MAN-1', { comp: p.component, site: p.site, trial: tl, from_ms: p.moved.from, to_ms: p.moved.to, amp_uv: fx(p.amplitude_uv, 1, L),
      lat_state: zState(L, p.latency_z, p.latency_marked, 'lat'), amp_state: zState(L, p.amplitude_z, p.amplitude_marked, NEG.has(p.component) ? 'neg' : 'v') })));
  });
  return out;
}
/* summary: values whose marked state changed through a confirmed move; the ranked list (SUM-2) and the
   counts (SUM-COUNT-1) come from the suggested values, so these sentences follow them */
function sumChanges(L, sn) {
  const on = [], off = [];
  peaksOf(sn).forEach((p, i) => { if (!p.moved) return; const o = M2().erp.peaks[i];
    [['lat', 'latency'], ['amp', 'amplitude']].forEach(([k, f]) => { if (p[f + '_z'] == null || !!o[f + '_marked'] === !!p[f + '_marked']) return;
      (p[f + '_marked'] ? on : off).push(part(L, 'item_' + k, { comp: p.component, trial: trialL[p.condition], site: p.site, z: fx(p[f + '_z'], 1, L) })); }); });
  const a = apfOf(sn);
  if (a.st === 'moved' && !!a.marked !== !!SP().EC.alpha_peak.marked) (a.marked ? on : off).push(part(L, 'item_apf', { z: fx(a.z, 1, L) }));
  const out = [], sep = part(L, 'item_sep'); if (on.length) out.push(cs(L, 'SUM-CHG-1', { items: on.join(sep) })); if (off.length) out.push(cs(L, 'SUM-CHG-2', { items: off.join(sep) }));
  return out.length ? out.concat([cs(L, 'SUM-CHG-3')]) : out;
}
/* round of 30 October: a report whose coherence variant is lagged ranks lagged pairs (summary_lagged, summary_groups_lagged) */
const lagRep = (cfg) => !!cfg && (cfg.blocks || []).includes('coherence') && /^lagged/.test(variantOf(cfg, 'coherence'));
const sumKey = (L, cfg) => (lagRep(cfg) && SM(L).summary_lagged ? 'summary_lagged' : 'summary');
const sumGroupsOf = (L, cfg) => SM(L)[lagRep(cfg) && SM(L).summary_groups_lagged ? 'summary_groups_lagged' : 'summary_groups'] || [];
const summaryList = (L, sn, cfg) => SM(L)[sumKey(L, cfg)].concat(sumChanges(L, sn));
/* segments: PEND while not confirmed; once confirmed Q-SEG-MAN-1 for each condition whose analysed seconds
   differ from the proposal (it replaces that condition's Q-DUR-1), else Q-SEG-AUTO-1 */
const SEGK = ['EO', 'EC', 'VCPT'];
const segManK = (sn) => { if (!sn.seg.confirmed) return []; const rec = M2().quality.recordings, all = SEGK.filter(k => rec[k]), d = all.filter(k => segA(sn, k) !== segP(sn, k));
  return d.length || !sn.seg.changes ? d : all; };
const segMan = (L, sn, k) => cs(L, 'Q-SEG-MAN-1', { cond: T('cond.' + k, null, L), analysed: segA(sn, k), recorded: M2().quality.recordings[k].recorded_s, proposed: segP(sn, k) });
const segChoice = (L, sn) => !sn.seg.confirmed ? [cs(L, sn.seg.changes ? 'Q-SEG-PEND-1' : 'Q-SEG-PEND-0', { n: sn.seg.changes })] : segManK(sn).length ? segManK(sn).map(k => segMan(L, sn, k)) : [cs(L, 'Q-SEG-AUTO-1')];
/* cleaning: Q-ICA-AUTO-1 or Q-ICA-MAN-1 once accepted (shell), else Q-ICA-PEND-1 with the components now set for removal (M65) */
const pendK = () => { const c = A.state.cleaning || {}; return c.pendingK ?? c.removedCount ?? (((A.m2.quality || {}).ica || {}).proposed_removed || []).length; };
const nComp = () => (((A.m2.quality || {}).ica || {}).n_components) || 18;
const icaSent = (L) => (A.state.cleaning || {}).confirmed ? A.cleaningSentence(L) : cs(L, 'Q-ICA-PEND-1', { k: pendK(), n: nComp() });
/* the cleaning sentences of every recording with results (workspace module, review B3), else the single sentence of the shell */
const icaList = (L) => A.ax && A.ax.cleaningSentences ? A.ax.cleaningSentences(L) : [icaSent(L)];
function qualityList(L, sn) {
  const man = segManK(sn); let i = 0;
  /* one duration sentence per condition in the order of SEGK: Q-DUR-1, or Q-MIN-1 below the minimum (M58) */
  const base = SM(L).quality.filter(s => !s.id.startsWith('Q-ICA')).map(s => { if (s.id !== 'Q-DUR-1' && s.id !== 'Q-MIN-1') return s; const k = SEGK[i++]; return man.includes(k) ? segMan(L, sn, k) : s; });
  const out = A.ax && A.ax.qualityWithCleaning ? A.ax.qualityWithCleaning(base, L) : base.concat([icaSent(L)]);
  return man.length ? out : out.concat(segChoice(L, sn));
}
/* shared with the Results tab, so both show the analysed seconds the clinician chose (fallback: the data) */
A.qualityNow = (L) => qualityList(L || A.lang, snapNow()); A.summaryNow = (L) => summaryList(L || A.lang, snapNow());
/* ERP sentences: library sentences of moved peaks give way to the clinician's confirmed choice */
function erpList(L, sn) {
  const drop = peaksOf(sn).filter(p => p.moved).map(p => new RegExp(`\\b${p.component}\\b[^.]*\\b${p.site}\\b[^.]*\\b${trialL[p.condition]}\\b`));
  return SM(L).erp.filter(s => !drop.some(re => re.test(s.text))).concat(peakSentences(L, sn));
}
A.erpNow = (L) => erpList(L || A.lang, snapNow());

/* ---------------- block catalogue ---------------- */
/* device blocks cover every Core and "Core, proposed" row of table 3.3 (30 October); req: cannot be removed from a template (C4) */
const CAT = {
  intro: { kind: 'clinic' }, versions: { kind: 'device', req: true }, summary: { kind: 'device', result: true, req: true }, quality: { kind: 'device', req: true },
  raw: { kind: 'device', result: true }, spectra_EO: { kind: 'device', result: true }, spectra_EC: { kind: 'device', result: true }, spectra_ch: { kind: 'device', result: true },
  maps_1hz: { kind: 'device', result: true }, ratios: { kind: 'device', result: true }, asymmetry: { kind: 'device', result: true },
  coherence: { kind: 'device', result: true }, source_regions: { kind: 'device', result: true }, erp_waves: { kind: 'device', result: true }, erp: { kind: 'device', result: true },
  behaviour: { kind: 'device', result: true }, errors: { kind: 'device', result: true },
  comparison: { kind: 'device', result: true }, limits: { kind: 'device', req: true }, issuedby: { kind: 'device', req: true },
  anamnesis: { kind: 'clinician' }, interpretation: { kind: 'clinician' }, conclusion: { kind: 'clinician' },
  /* night round (review B3, D5): Method and norms (TG10), markers per electrode, the clinician form (TG6); 30 October: the ERP peak review
     (Core, proposed) replaces the checklist over channel ERPs; global coherence is a variant of the coherence block (coherence@2) */
  method: { kind: 'device' }, freq_markers: { kind: 'device', result: true }, erp_review: { kind: 'device', result: true }, form: { kind: 'clinician' },
};
/* CT-STD v4 has the block list of the PDF sample (pdf_templates "CT-STD v4"); CT-C leaves out the raw EEG excerpts and source power per
   brain region, so "Add blocks" has real choices */
const STD_BLOCKS = ['intro', 'versions', 'summary', 'quality', 'anamnesis', 'spectra_EO', 'spectra_EC', 'spectra_ch', 'freq_markers', 'maps_1hz', 'ratios', 'asymmetry', 'coherence',
  'source_regions', 'erp_waves', 'erp', 'erp_review', 'behaviour', 'errors', 'comparison', 'interpretation', 'conclusion', 'limits', 'method', 'issuedby'];
const DEF_BLOCKS = STD_BLOCKS.filter(b => b !== 'source_regions').flatMap(b => b === 'conclusion' ? [b, 'form'] : [b]);
/* block heading in a language (the report's, or the interface's by default) */
const fieldsTitle = (k, L, key) => { const t = (A.data[k] || {}).title; return (t && (t[L || A.lang] || t.en)) || T(key, null, L); };
const blkLabel = (id, L) => !CAT[id] ? id : id === 'comparison' ? cmpLabel(cmpSet(), L) : id === 'anamnesis' ? fieldsTitle('anamnesis_fields', L, 'c.blk.anamnesis') : id === 'form' ? fieldsTitle('clinician_form', L, 'c.blk.form') : T('c.blk.' + id, null, L);
const anamLab = (k, L) => { const F = A.data.anamnesis_fields || {}; return ((F.labels || {})[L || A.lang] || (F.labels || {}).en || {})[k] || k; };
/* a block named inside a sentence: "comment after signal quality" / "Kommentar nach Signalqualität" */
function labelOf(k, L) { if (k.startsWith('anam.')) return A.lc(anamLab(k.slice(5), L), L); return k.startsWith('comment.') ? T('c.lab.comment', { b: blkLabel(k.slice(8), L) }, L) : A.lc(blkLabel(k, L), L); }
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
      { v: 3, at: '2026-09-02', by: 'c.by.company', change: [A.tk('c.h.cmp')] },
      { v: 4, at: '2026-10-28', by: 'c.by.company', change: [A.tk('c.h.night')] },
      { v: 5, at: '2026-10-30', by: 'c.by.company', change: [A.tk('c.h.oct30')] }];
    t.version = Math.max(t.version || 0, 5);
  }
  if (!t.std) t.std = { version: 4, cfg: { style: 'std', blocks: STD_BLOCKS.slice(),
      theme: { font: 'Carlito', hfont: 'Fira Sans', accent: NAVY, logo: 'left', addr: true, pageOf: true },
      texts: textsFor('std'), comments: true },
    history: [{ v: 1, at: '2026-01-05', by: 'c.by.admin', change: [A.tk('c.h.std')] },
      { v: 2, at: '2026-09-01', by: 'c.by.admin', change: [A.tk('c.h.cmp')] },
      { v: 3, at: '2026-10-28', by: 'c.by.admin', change: [A.tk('c.h.nightStd')] },
      { v: 4, at: '2026-10-30', by: 'c.by.admin', change: [A.tk('c.h.oct30Std')] }] };
  if (!t.requests) t.requests = []; if (!t.std.requests) t.std.requests = [];
  const r = A.state.report; if (!r.lang) r.lang = 'en'; if (!r.texts) r.texts = {}; if (!r.tpl) r.tpl = 'CT-C'; if (!r.form) r.form = {};
  /* review C16: the draft keeps the template version it was started with until the clinician accepts a newer one */
  const cur = r.tpl === 'CT-STD' ? t.std : t; if (!r.pin || r.pin.id !== r.tpl) r.pin = { id: r.tpl, v: cur.version, cfg: clone(cur.cfg) };
  return t;
}
const tpl = (id) => { const t = ensure(); return id === 'CT-STD' ? t.std : t; };
const HID = () => !!A.state.staffView || A.role === 'support';
const nameIn = (L) => HID() ? T('nameHidden', null, L) : A.case.identity_store.display_name;
/* review blocking 2: only a role with the issue permission edits a draft or issues; review A2: support sees no free text */
const canEd = () => !A.can || A.can('issue');
const whoKey = () => (A.state.staffView ? 'support' : (A.role || 'c1'));
/* the author of an open draft is the case clinician; a read-only viewer (assistant, company support) is never named as author */
const draftWho = () => (canEd() ? whoKey() : 'c1');
const fill = (s, L) => String(s || '').replace(/\{name\}/g, nameIn(L)).replace(/\{age\}/g, T('years', { n: ageY() }, L)).replace(/\{recording_date\}/g, A.fmtDate(M2().date, L));
const claimHits = (s) => { s = String(s || ''); return claimRanges(s).map(([a, b]) => s.slice(a, b)); };
const histAt = (h, L) => typeof h.at === 'string' ? A.fmtDate(h.at, L) : A.at(h.at, L);
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const changeText = (ch) => Array.isArray(ch) ? cap(ch.map(x => A.pv(x)).join(', ')) : String(ch || '');
/* choices the clinician made upstream, stated in the report (in language L) */
/* the ERP peak review of module E (MC1): rvApplicable, rvOpen, rvState, rvRows(rv, peaks), rvSentences(L, rv, peaks), rvNChanged, rvHeadOf, rvValueOf, rvLegend */
const rvOK = () => !!(A.ex && A.ex.rvRows && A.ex.rvSentences && A.ex.rvApplicable);
function choices(L, sn = snapNow(), cfg) {
  const s = A.state, t = (key, p) => T(key, p, L), P = sn.peaks || {}, has = (b) => !cfg || cfg.blocks.includes(b), txt = (l, drop) => l.filter(x => x.id !== drop).map(x => x.text).join(' ');
  const out = [
    { k: t('rep.ch.segments'), ok: sn.seg.confirmed, v: segChoice(L, sn).map(x => x.text).join(' ') },
    { k: t('rep.ch.cleaning'), ok: !!s.cleaning.confirmed, v: icaList(L).map(x => x.text).join(' ') },
    ...(mkNeeded() ? [{ k: t('rep.ch.marker'), ok: sn.mk.confirmed, v: (sn.mk.confirmed ? mkList(L, sn) : [mkPend(L)]).map(x => x.text).join(' ') }] : []),
    ...(NN() ? [] : [{ k: t('rep.ch.peaks'), ok: PKT().every(x => (P[x] || {}).confirmed), v: peakSentences(L, sn).map(x => x.text).join(' ') }]),
  ];
  const ex = sn.ex || (A.ex && A.ex.snap());
  if (A.ex && ex && has('freq_markers')) out.push({ k: t('rep.ch.fm'), ok: !A.ex.fmOpenOf(ex.fm).length, v: txt(A.ex.fmSentences(L, ex.fm), 'FM-RULE-1') });
  if (A.ex && ex && has('erp_review') && rvOK() && A.ex.rvApplicable()) { const rv = ex.rv || ex.cl || A.ex.rvState(); out.push({ k: t('rep.ch.rv'), ok: !!rv.confirmed, v: txt(A.ex.rvSentences(L, rv, peaksOf(sn)), 'ERPREV-RULE-1') }); }
  return out;
}
/* ---------------- figures (cached per case and measurement) ---------------- */
const MAPS = {};
const CHI = Object.fromEntries(A.channels.map((c, i) => [c, i]));
const markedCh = (flags) => A.channels.filter((_, i) => flags && flags[i]);
const cache = (key, make) => { const k = CK() + '|' + key; return MAPS[k] || (MAPS[k] = make()); };
/* a z map, or without an age norm a map of values on its own scale (APP.bx.topoSeq, never the z colours) */
const zMap = (vals, size, marks) => { const cv = document.createElement('canvas'); A.topo(cv, vals, { size, marks }); return cv.toDataURL('image/png'); };
const vMap = (vals, size) => { const cv = document.createElement('canvas'); if (A.bx && A.bx.topoSeq) A.bx.topoSeq(cv, vals, { size }); return cv.toDataURL('image/png'); };
function mapURL(cond, band) { return cache('mp' + cond + band, () => { const B = SP()[cond].bands[band]; return NN() ? vMap(B.abs_uv2, 96) : zMap(B.abs_z, 96, markedCh(B.abs_marked)); }); }
function m1URL(cond, j) { return cache('m1' + cond + j, () => { const C = SP()[cond]; return NN() ? vMap(C.maps_1hz_uv2[j], 42) : zMap(C.maps_1hz_z[j], 42, markedCh(C.maps_1hz_marked && C.maps_1hz_marked[j])); }); }
/* asymmetry (review C15, the V3 convention): z of the pair's index at its right electrode, minus z at the left one, 0 on the midline */
const isRight = (ch) => /[02468]$/.test(ch);
function asyURL(cond, band) {
  return cache('as' + cond + band, () => { const v = A.channels.map(() => 0), mk = [];
    SP()[cond].asymmetry[band].forEach(x => x.pair.split('-').forEach(ch => { v[CHI[ch]] = isRight(ch) ? x.z : -x.z; if (x.marked) mk.push(ch); })); return zMap(v, 60, mk); });
}
/* marked pairs with the index and the side with more power (index = (right minus left) / (right plus left)) */
function asyPairs(c) {
  const L = c.lang, rows = [];
  CONDS().forEach(cd => A.bands.forEach(b => SP()[cd].asymmetry[b.name].forEach(x => { if (!x.marked) return; const right = x.pair.split('-').find(isRight), left = x.pair.split('-').find(ch => !isRight(ch));
    rows.push(`<tr><td>${x.pair}</td><td>${BANDL[b.name]}</td><td>${condL(cd, L)}</td><td class="n">${fx0(Math.round(x.value * 100 + 1e-9) / 100, 2, L)}</td><td>${Math.abs(x.value) < 0.005 ? '-' : (x.value > 0 ? right : left)}</td>${zc(x.z, x.marked, L)}</tr>`); })));
  return rows.length ? `<div class="c-cap"><b>${R(c, 'asyPairs')}</b></div>` + tbl([R(c, 'pair'), R(c, 'band'), R(c, 'condition'), R(c, 'asyIdx') + ' ', R(c, 'asySide'), 'z'], rows) : '';
}
/* frequency marker: z at its bin on every electrode, a square on the marker's electrode */
function fmURL(m, cond, site, hz) {
  return cache(`fm${m.id}${cond}${site}${hz}`, () => { const C = m.spectra.conditions[cond], k = Math.round((hz - m.spectra.freqs[0]) / 0.5), cv = document.createElement('canvas'), S = 70;
    A.topo(cv, C.z.map(r => r[k]), { size: S, marks: markedCh(C.z_marked.map(r => r[k])) });
    const g = cv.getContext('2d'), cx = S / 2, cy = 4 + S / 2 - 2, R = S / 2 - 10, p = A.pos[site]; g.strokeStyle = '#111'; g.lineWidth = 1.6; g.strokeRect(cx + p[0] * R / 1.08 - 4.5, cy - p[1] * R / 1.08 - 4.5, 9, 9);
    return cv.toDataURL('image/png'); });
}
/* small multiples on the 10-20 layout: 5 x 5 cells, empty corners */
const G5 = [[null, 'Fp1', null, 'Fp2', null], ['F7', 'F3', 'Fz', 'F4', 'F8'], ['T3', 'C3', 'Cz', 'C4', 'T4'], ['T5', 'P3', 'Pz', 'P4', 'T6'], [null, 'O1', null, 'O2', null]];
const GW = 682, GCW = 132, GCH = 50, GGAP = 5, GH = 5 * GCH + 4 * GGAP;
function gridURL(key, panel) {
  return cache(key, () => { const d = 2, cv = document.createElement('canvas'); cv.width = GW * d; cv.height = GH * d; const g = cv.getContext('2d'); g.scale(d, d);
    g.fillStyle = '#fff'; g.fillRect(0, 0, GW, GH); g.lineJoin = 'round';
    G5.forEach((row, r) => row.forEach((ch, k) => { if (!ch) return; g.save(); g.translate(k * (GCW + GGAP), r * (GCH + GGAP));
      g.strokeStyle = '#d6d5cf'; g.lineWidth = 0.6; g.strokeRect(0.5, 0.5, GCW - 1, GCH - 1); panel(g, ch, GCW, GCH);
      g.fillStyle = '#1f1f1e'; g.font = '600 9px "IBM Plex Sans", Arial, sans-serif'; g.fillText(ch, 4, 10); g.restore(); }));
    return cv.toDataURL('image/png'); });
}
function band(g, X, Y, lo, hi) { g.beginPath(); lo.forEach((v, i) => g[i ? 'lineTo' : 'moveTo'](X(i), Y(v))); for (let i = hi.length - 1; i >= 0; i--) g.lineTo(X(i), Y(hi[i])); g.closePath(); g.fill(); }
function line(g, X, Y, v) { g.beginPath(); v.forEach((y, i) => g[i ? 'lineTo' : 'moveTo'](X(i), Y(y))); g.stroke(); }
const CONDS = () => ['EO', 'EC'].filter(k => SP()[k]);
function specGrid(cond) {
  const f = M2().spectra.freqs, C = SP()[cond];
  let lo = 1e9, hi = -1e9; CONDS().forEach(k => SP()[k].log_power.forEach((r, i) => r.forEach((v, j) => { const N = SP()[k].norm_log_mean, m = N ? N[i][j] : v, s = N ? SP()[k].norm_log_sd[i][j] : 0; lo = Math.min(lo, v, m - 2 * s); hi = Math.max(hi, v, m + 2 * s); })));
  return gridURL('sp' + cond, (g, ch, w, h) => {
    const i = CHI[ch], X = (j) => 3 + j / (f.length - 1) * (w - 6), Y = (v) => h - 3 - (v - lo) / (hi - lo) * (h - 15);
    if (C.norm_log_mean) { const mu = C.norm_log_mean[i], sd = C.norm_log_sd[i];
      g.fillStyle = '#e6e5e0'; band(g, X, Y, mu.map((m, j) => m - 2 * sd[j]), mu.map((m, j) => m + 2 * sd[j])); g.strokeStyle = '#a5a49f'; g.lineWidth = 0.8; line(g, X, Y, mu); }
    g.strokeStyle = '#1f1f1e'; g.lineWidth = 1.1; line(g, X, Y, C.log_power[i]);
    (C.z_marked && C.z_marked[i] || []).forEach((m, j) => { if (!m) return; g.fillStyle = A.zColor(C.z[i][j]); g.beginPath(); g.arc(X(j), Y(C.log_power[i][j]), 2.4, 0, 7); g.fill(); g.strokeStyle = '#1f1f1e'; g.lineWidth = 0.5; g.stroke(); });
  });
}
function erpGrid(cond, pk) {
  const E = M2().erp, tm = E.times_ms, C = E.conditions[cond].channels;
  let R0 = 1; ['go', 'nogo'].forEach(k => Object.values(E.conditions[k].channels).forEach(o => o.patient_uv.forEach((v, j) => { R0 = Math.max(R0, Math.abs(v), o.norm_mean_uv ? Math.abs(o.norm_mean_uv[j]) + 2 * o.norm_sd_uv[j] : 0); }))); R0 = Math.ceil(R0);
  const mine = pk.filter(p => p.condition === cond && p.latency_ms != null);
  return gridURL('erp' + cond + mine.map(p => p.latency_ms).join(), (g, ch, w, h) => {
    const o = C[ch], X = (j) => 3 + j / (tm.length - 1) * (w - 6), Y = (v) => (h + 6) / 2 - v / R0 * (h - 14) / 2, Xt = (t) => X((t - tm[0]) / (tm[1] - tm[0]));
    g.strokeStyle = '#cfcec8'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(3, Y(0)); g.lineTo(w - 3, Y(0)); g.moveTo(Xt(0), 12); g.lineTo(Xt(0), h - 3); g.stroke();
    if (o.norm_mean_uv) { g.fillStyle = '#e6e5e0'; band(g, X, Y, o.norm_mean_uv.map((m, j) => m - 2 * o.norm_sd_uv[j]), o.norm_mean_uv.map((m, j) => m + 2 * o.norm_sd_uv[j]));
      g.strokeStyle = '#a5a49f'; g.lineWidth = 0.8; line(g, X, Y, o.norm_mean_uv); }
    g.strokeStyle = '#1f1f1e'; g.lineWidth = 1.1; line(g, X, Y, o.patient_uv);
    mine.filter(p => p.site === ch).forEach(p => { const x = Xt(p.latency_ms), y = Y(p.amplitude_uv), up = p.amplitude_uv >= 0 ? -1 : 1;
      g.beginPath(); g.moveTo(x, y + up * 2); g.lineTo(x - 3.5, y + up * 8); g.lineTo(x + 3.5, y + up * 8); g.closePath();
      if (p.moved) { g.strokeStyle = '#1f1f1e'; g.lineWidth = 1; g.fillStyle = '#fff'; g.fill(); g.stroke(); } else { g.fillStyle = '#1f1f1e'; g.fill(); } });
  });
}
const RAW_UV = 50;
function rawURL(cond) {
  return cache('raw' + cond, () => {
    const R0 = M2().raw[cond], w = 334, sp = 12, h = A.channels.length * sp + 22, d = 2, cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
    const g = cv.getContext('2d'); g.scale(d, d); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const x0 = 26, n = R0.fs * R0.seconds;
    g.strokeStyle = '#ecebe6'; g.lineWidth = 0.5; g.fillStyle = '#77766f'; g.font = '8px "IBM Plex Mono", monospace';
    for (let s = 0; s <= R0.seconds; s++) { const x = x0 + s / R0.seconds * (w - x0 - 4); g.beginPath(); g.moveTo(x, 4); g.lineTo(x, h - 14); g.stroke(); if (s % 2 === 0) g.fillText(s + ' s', x - 6, h - 4); }
    A.channels.forEach((ch, i) => { const y0 = 10 + i * sp, v = R0.channels[ch]; g.fillStyle = '#1f1f1e'; g.fillText(ch, 1, y0 + 3);
      g.strokeStyle = '#1f1f1e'; g.lineWidth = 0.6; g.beginPath(); v.forEach((u, j) => g[j ? 'lineTo' : 'moveTo'](x0 + j / (n - 1) * (w - x0 - 4), y0 - u / RAW_UV * sp)); g.stroke(); });
    return cv.toDataURL('image/png'); });
}
/* review C8: omissions and commissions as two series per block, with counts and a legend */
function errorsSVG(L) {
  const V = M2().vcpt, two = V.omissions_per_block && V.commissions_per_block, S = two ? [[V.omissions_per_block, '#2f4254', T('rep.om', null, L)], [V.commissions_per_block, '#a7b1bb', T('rep.cm', null, L)]] : [[V.errors_per_block, '#6b6f7d', T('rep.errors', null, L)]];
  const nb = S[0][0].length, mx = Math.max(3, ...S.flatMap(x => x[0])), W = 400, H = 124, x0 = 26, y0 = 22, bw = (W - x0 - 6) / nb, sw = (bw - 6) / S.length, Y = (v) => H - 20 - v / mx * (H - 20 - y0);
  let o = `<svg class="c-err" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(T('c.blk.errors', null, L))}">`;
  S.forEach(([, col, lab], j) => { o += `<rect x="${x0 + j * 140}" y="4" width="10" height="8" fill="${col}"/><text x="${x0 + j * 140 + 14}" y="11" font-size="8.5" fill="#1f1f1e">${esc(lab)}</text>`; });
  for (let v = 0; v <= mx; v++) o += `<line x1="${x0}" x2="${W - 4}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e6e5e0" stroke-width="0.6"/><text x="${x0 - 5}" y="${Y(v) + 3}" text-anchor="end" font-size="8" fill="#77766f">${v}</text>`;
  for (let i = 0; i < nb; i++) { const xb = x0 + i * bw + 3;
    S.forEach(([e, col], j) => { const v = e[i], x = xb + j * sw; o += `<rect x="${x}" y="${Y(v)}" width="${sw - 1}" height="${Y(0) - Y(v)}" fill="${col}"/>${v ? `<text x="${x + (sw - 1) / 2}" y="${Y(v) - 2}" text-anchor="middle" font-size="7.5" fill="#1f1f1e">${v}</text>` : ''}`; });
    o += `<text x="${xb + (bw - 6) / 2}" y="${H - 9}" text-anchor="middle" font-size="8" fill="#55554f">${i + 1}</text>`; }
  return o + `<text x="${x0}" y="${H - 1}" font-size="8" fill="#77766f">${esc(T('rep.block', null, L))}</text></svg>`;
}
/* z cell: coloured only when the value is marked (correction for multiple comparisons, M33) */
const zc = (z, mk, L) => z == null ? '<td></td>' : mk ? `<td class="z mk" style="background:${A.zColor(z)};color:${A.zInk(z)}">${fx(z, 1, L)}</td>` : `<td class="z">${fx(z, 1, L)}</td>`;
const tbl = (head, rows) => `<table class="c-t"><tr>${head.map(h => `<th${h.endsWith(' ') ? ' class="n"' : ''}>${h.trim()}</th>`).join('')}</tr>${rows.join('')}</table>`;
const S_ = (c) => SM(c.lang);
const condL = (k, L) => T('condl.' + k, null, L);
const trialL = { go: 'Go', nogo: 'NoGo', ignore: 'Ignore', novelty: 'Novelty' };
const kv = (rows) => `<table class="c-kv">${rows.filter(r => r[1] != null && r[1] !== '').map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`;
/* reproducibility rows of a measurement (3.8, review D6), shared by the versions block and the Issued view */
/* review B11: the rows of the PDF Versions block (CONTRACT, night round 2): norms with the dataset version, text library, device block
   catalogue, result set, marking method, checksum of the de-identified signal, ICA seed derived and stored */
const TLV = () => (A.data.text_library || {}).version || '2026.1';
const DBV = () => (A.data.device_blocks || {}).version || '2026.1';
const reproRows = (m, L, c) => { const pw = m.processed_with || {}, at = String(pw.processed_at || ''), Rl = (k, p) => T('rep.' + k, p, L);
  const rs = (c && c.snap && c.snap.rs) || ((m.result_sets || []).slice(-1)[0] || {}).id || '';
  return [[Rl('udi'), L === 'en' && pw.udi ? pw.udi : Rl('udiText')], [Rl('pipeline'), pw.pipeline],
    [Rl('norms'), pw.norm_version ? Rl('normsFmt', { norms: A.dv(pw.norms, L), v: pw.norm_version }) : A.dv(pw.norms, L)],
    [Rl('textlib'), TLV() + Rl('textlibNote')], [Rl('blocksCat'), Rl('blocksV', { v: DBV() })], [Rl('rs'), rs], [Rl('marking'), Rl('markingT', { q: A.nf(0.05, 2, L) })],
    [Rl('inputSha'), pw.input_sha256 ? `${pw.input_sha256} (${Rl('inputSyn')})` : ''],
    [Rl('icaSeed'), pw.ica_seed != null ? Rl('seedFmt', { seed: pw.ica_seed }) : ''], [Rl('processedAt'), at ? Rl('processedFmt', { d: A.fmtDate(at.slice(0, 10), L), tm: at.slice(11, 16), s: pw.processing_s }) : '']]; };
/* a device block's variant (review D3): the template's choice, else the first variant of the catalogue */
const DBK = () => (A.data.device_blocks || {}).blocks || {};
const catOf = (pid) => Object.keys(DBK()).find(k => (DBK()[k].prototype_blocks || []).includes(pid)) || null;
/* default: the variant the sample PDF of the company standard uses (pdf_templates "CT-STD v4"), else the catalogue's first */
const PDFV = () => { const o = {}; ((((A.data.pdf_templates || {})['CT-STD v4'] || {}).blocks) || []).forEach(b => { const m = /^([^@]+)@\d+:(.+)$/.exec(b.ref || ''); if (m) o[m[1]] = m[2]; }); return o; };
const variantsOf = (pid) => { const k = catOf(pid); return k ? Object.keys(DBK()[k].variants || {}) : []; };
const variantOf = (cfg, pid) => { const v = ((cfg || {}).variants || {})[pid], k = catOf(pid), vs = variantsOf(pid), d = k && PDFV()[k]; return vs.includes(v) ? v : vs.includes(d) ? d : (vs[0] || ''); };
const refOf = (cfg, pid) => { const k = catOf(pid); return k ? `${k}@${DBK()[k].version}:${variantOf(cfg, pid)}` : ''; };
/* AD2: a variant's own status ("core, proposed" for the lagged coherence variants), else the block's status */
const vStatus = (cfg, pid) => { const k = catOf(pid); if (!k) return ''; const b = DBK()[k]; return ((b.variant_status || {})[variantOf(cfg, pid)]) || b.status || ''; };
/* the measurements the comparison block shows: every available one up to the current, oldest first (M56); an issued version keeps its own list */
const byDate = (x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
const cmpSet = (ids) => { const all = (A.case.measurements || []);
  if (ids) return all.filter(m => ids.includes(m.id)).sort(byDate);
  const av = A.bx ? A.bx.measList().filter(m => A.bx.procOf(m) === 'done') : all.filter(m => !m.uploaded_later);
  return av.filter(m => m.date <= A.m2.date).sort(byDate); };
const cmpLabel = (Ms, L) => Ms.length > 2 ? T('c.blk.comparisonN', null, L) : T('c.blk.comparison', { d: Ms.length > 1 ? A.fmtDate(Ms[Ms.length - 2].date, L) : '' }, L);
const nnCap = (c) => NN() ? `<div class="c-cap">${R(c, 'nnCap')}</div>` : '';
/* ---------------- device blocks: fixed sentences, tables and maps (report language) ---------------- */
const DEV = {
  versions: (c) => { const q = M2().quality.recordings, sec = (k) => (q[k] || {}).recorded_s, vc = sec('VCPT') || 0;
    return kv([[R(c, 'report'), `${A.rid(c.v)}, ${stLabel(c)}`], [R(c, 'template'), R(c, 'tplFmt', { id: c.tid, v: c.tv, clinic: T('clinicC', null, c.lang), lang: T('lang.' + c.lang, null, c.lang) })],
      [R(c, 'software'), M2().processed_with.software], ...reproRows(M2(), c.lang, c), [R(c, 'system'), A.dv(M2().recording_system, c.lang)],
      [R(c, 'measurement'), R(c, 'measV', { d: A.fmtDate(M2().date, c.lang), eo: sec('EO') ?? '-', ec: sec('EC') ?? '-', vm: Math.floor(vc / 60), vs: vc % 60 })]]).replace('<table class="c-kv">', '<table class="c-kv c-ver">'); },
  /* review C3: the sentences, then the same ranked entries as a table of z chips (variant std; "sentences" leaves it out) and the reading key */
  summary: (c) => { const L = c.lang, G = sumGroupsOf(L, c.cfg), tb = !NN() && G.length && variantOf(c.cfg, 'summary') !== 'sentences';
    return A.sys(summaryList(L, c.snap, c.cfg)) + (!tb ? '' : `<div class="c-cap"><b>${R(c, 'sumT')}</b></div>` + tbl([R(c, 'sumA'), R(c, 'sumW')], G.map(g => `<tr><td>${esc(cap(g.stem))}</td><td>${g.items.map(x => `<span class="c-zi">${x.where ? esc(x.where) + ' ' : ''}<b style="background:${A.zColor(x.z)};color:${A.zInk(x.z)}">${fx(x.z, 1, L)}</b></span>`).join(' ')}</td></tr>`))
      + `<div class="c-cap">${R(c, 'key')}</div>`); },
  quality: (c) => { const q = M2().quality;
    return `<div class="c-qt">${tbl([R(c, 'recording'), R(c, 'recordedS') + ' ', R(c, 'analysed') + ' '], Object.entries(q.recordings).map(([k, v]) => `<tr><td>${T('cond.' + k, null, c.lang)}</td><td class="n">${v.recorded_s} s</td><td class="n">${segA(c.snap, k)} s</td></tr>`))}</div>${A.sys(c.quality)}`; },
  raw: (c) => { const ex = rawList(c); if (ex) return ex.length ? ex.map(x => `<figure class="c-rawx"><figcaption>${esc(A.ax.excerptCaption(x, c.lang))}</figcaption>${cache(`rx${x.cond}${x.start_s}${x.seconds}${((c.snap.rm || {})[x.cond] || []).join('.')}`, () => A.ax.excerptSVG(x, { w: 682, rowH: 11, removed: (c.snap.rm || {})[x.cond] || [] }))}</figure>`).join('') + `<div class="c-cap">${R(c, 'rawCapN')}</div>` : `<div class="c-cap">${R(c, 'rawNone')}</div>`;
    return `<div class="c-raw">${['EO', 'EC'].filter(cd => M2().raw[cd]).map(cd => `<figure class="c-map"><figcaption><b>${esc(T('cond.' + cd, null, c.lang))}</b></figcaption><img src="${rawURL(cd)}" width="334" height="${A.channels.length * 12 + 22}" alt=""></figure>`).join('')}</div><div class="c-cap">${R(c, 'rawCap', { u: RAW_UV })}</div>`; },
  spectra_EO: (c) => spectra('EO', c), spectra_EC: (c) => spectra('EC', c),
  spectra_ch: (c) => CONDS().map(cd => `<div class="c-cap"><b>${esc(T('cond.' + cd, null, c.lang))}</b></div><img class="c-grid" src="${specGrid(cd)}" width="${GW}" height="${GH}" alt="">`).join('') + `<div class="c-cap">${R(c, NN() ? 'spCapV' : 'spCap')}</div>` + missSents(c, 'spectra'),
  maps_1hz: (c) => CONDS().map(cd => `<div class="c-cap"><b>${esc(T('cond.' + cd, null, c.lang))}</b></div><div class="c-m1">${(NN() ? SP()[cd].maps_1hz_uv2 : SP()[cd].maps_1hz_z).map((_, j) => `<figure class="c-map"><img src="${m1URL(cd, j)}" width="42" height="46" alt=""><figcaption>${j + 1}-${j + 2}</figcaption></figure>`).join('')}</div>`).join('') +
    `<div class="c-scl"><span class="c-cap">${R(c, NN() ? 'm1CapV' : 'm1Cap')}</span>${NN() ? seqKey(c) : A.zScale(null, c.lang)}</div>`,
  ratios: (c) => { const L = c.lang, nn = NN(), ap = apfOf(c.snap), r = [];
    ['EO', 'EC'].forEach(cd => { const C = SP()[cd]; r.push(['tbrCz', cd, C && C.tbr, 2]); });
    ['EO', 'EC'].forEach(cd => { const C = SP()[cd]; r.push(['faa', cd, C && C.faa, 2]); });
    /* ratios@2 (30 October): the frontal theta / parietal alpha ratio per condition and one alpha reactivity row (Core, proposed) */
    ['EO', 'EC'].forEach(cd => { const C = SP()[cd]; r.push(['ftpa', cd, C && C.ftpa, 2]); });
    ['EO', 'EC'].forEach(cd => { const C = SP()[cd]; r.push(['apfHz', cd, C && (cd === 'EC' ? { value: ap.hz, norm_mean: C.alpha_peak.norm_mean, z: ap.z, marked: ap.marked, star: ap.st === 'moved' } : { value: C.alpha_peak.hz, norm_mean: C.alpha_peak.norm_mean, z: C.alpha_peak.z, marked: C.alpha_peak.marked }), 1]); });
    r.push(['ar', null, M2().alpha_reactivity, 2]);
    return A.ann("Table 3.3, 30 October: frontal theta / parietal alpha ratio and alpha reactivity, Core, proposed (beyond the clinical lead's list of 5 October; needs his agreement)") +
      tbl([R(c, 'measure'), R(c, 'condition'), R(c, 'value') + ' ', ...(nn ? [] : [R(c, 'normMean') + ' ', 'z'])], r.map(([k, cd, o, d]) => `<tr><td>${R(c, k)}</td><td>${cd ? condL(cd, L) : R(c, 'arCond')}</td>${!o ? `<td class="n">-</td>${nn ? '' : '<td></td><td></td>'}` : `<td class="n">${fx(o.value, d, L)}${o.star ? '*' : ''}</td>${nn ? '' : `<td class="n">${fx(o.norm_mean, d, L)}</td>${zc(o.z, o.marked, L)}`}`}</tr>`)) +
      `<div class="c-cap">${R(c, 'ratiosLeg')} ${nn ? R(c, 'nnCap') : R(c, 'zKey')}${ap.st === 'moved' ? ' ' + R(c, 'movedKey') : ''}</div>` + A.sys(S_(c).ratios) + A.sys(S_(c).alpha_reactivity || []) + A.sys(mkList(L, c.snap)); },
  asymmetry: (c) => { const L = c.lang, nn = NN(), cds = CONDS(), pairs = A.case.asym_pairs;
    return (nn ? '' : cds.map(cd => `<div class="c-asr"><span class="c-cap"><b>${esc(T('cond.' + cd, null, L))}</b></span><div class="c-maps">${A.bands.map(b => `<figure class="c-map"><img src="${asyURL(cd, b.name)}" width="60" height="64" alt=""><figcaption><b>${BANDL[b.name]}</b></figcaption></figure>`).join('')}</div></div>`).join('')) +
      `<table class="c-t c-zt"><tr><th></th>${pairs.map(p => `<th>${p}</th>`).join('')}</tr>${cds.map(cd => A.bands.map(b => `<tr><th>${BANDL[b.name]}, ${condL(cd, L)}</th>${SP()[cd].asymmetry[b.name].map(x => nn ? `<td class="z">${fx0(x.value, 3, L)}</td>` : zc(x.z, x.marked, L)).join('')}</tr>`).join('')).join('')}</table>` +
      `<div class="c-cap">${R(c, nn ? 'asyCapV' : 'asyCap')}${nn ? '' : ' ' + R(c, 'zKey')}</div>` + (nn ? '' : asyPairs(c)) + A.sys(S_(c).asymmetry_EO) + A.sys(S_(c).asymmetry_EC); },
  /* coherence@2 (SA1): the variant chooses the pair type (msc or lagged, the lagged one Core, proposed) and whether the four global types follow */
  coherence: (c) => { const all = [], L = c.lang, v = variantOf(c.cfg, 'coherence'), lag = /^lagged/.test(v), src = lag ? (M2().coherence_lagged || {}) : M2().coherence, ty = (A.data.coherence_types || {}).pair_labels || {};
    CONDS().forEach(cd => Object.entries(src[cd] || {}).forEach(([b, o]) => o.pairs.forEach(p => { if (p.marked) all.push({ ...p, b, cd }); })));
    all.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    const tyL = cap(((ty[L] || ty.en || {})[lag ? 'lagged' : 'msc']) || '');
    return (lag ? A.ann("Table 3.3, 30 October: lagged coherence per electrode pair, Core, proposed (needs the clinical lead's agreement); the template variant chooses the type (mockup assumption)") : '') +
      `<div class="c-cap"><b>${esc(tyL)}</b></div>` + A.sys(S_(c)[(lag ? 'coherence_lag_' : 'coherence_') + 'EO'] || []) + A.sys(S_(c)[(lag ? 'coherence_lag_' : 'coherence_') + 'EC'] || []) + (NN() ? nnCap(c) : `<div class="c-cap">${R(c, lag ? 'cohLagCap' : 'cohCap')}</div>` +
      (all.length ? tbl([R(c, 'pair'), R(c, 'band'), R(c, 'condition'), R(c, 'coherence') + ' ', 'z'], all.map(p => `<tr><td>${p.pair}</td><td>${BANDL[p.b]}</td><td>${condL(p.cd, L)}</td><td class="n">${fx(p.value, 2, L)}</td>${zc(p.z, p.marked, L)}</tr>`)) : `<div class="c-cap">${R(c, 'noneMarked')}</div>`)) +
      (/\+global$/.test(v) ? glob4(c) : ''); },
  /* an older template with the retired separate block draws the four global types */
  coh_global: (c) => glob4(c),
  erp_waves: (c) => { const pk = peaksOf(c.snap);
    return ['go', 'nogo'].map(t => `<div class="c-cap"><b>${trialL[t]}</b> · ${R(c, 'trials')} ${M2().quality.accepted_trials[t]}</div><img class="c-grid" src="${erpGrid(t, pk)}" width="${GW}" height="${GH}" alt="">`).join('') + `<div class="c-cap">${R(c, NN() ? 'erpCapV' : 'erpCap')}</div>` + (c.cfg.blocks.includes('erp') ? '' : A.sys(peakSentences(c.lang, c.snap))); },
  erp: (c) => { const L = c.lang, nn = NN(), pk = peaksOf(c.snap), any = pk.some(p => p.moved);
    return tbl([R(c, 'component'), R(c, 'trials'), R(c, 'site'), R(c, 'ampUv') + ' ', ...(nn ? [] : ['z']), R(c, 'latMs') + ' ', ...(nn ? [] : ['z'])], pk.map(p => `<tr><td>${p.component}</td><td>${trialL[p.condition]}</td><td>${p.site}</td><td class="n">${fx(p.amplitude_uv, 1, L)}${p.moved ? '*' : ''}</td>${nn ? '' : zc(p.amplitude_z, p.amplitude_marked, L)}<td class="n">${p.latency_ms == null ? (p.window_ms ? esc(String(p.window_ms).replace(' to ', ' ' + T('to', null, L) + ' ')) : R(c, 'mean')) : p.latency_ms + (p.moved ? '*' : '')}</td>${nn ? '' : p.latency_z == null ? '<td></td>' : zc(p.latency_z, p.latency_marked, L)}</tr>`)) +
      `<div class="c-cap">${nn ? R(c, 'nnCap') : R(c, 'zKey')}${any ? ' ' + R(c, 'movedKey') : ''}</div>` + A.sys(erpList(L, c.snap)); },
  behaviour: (c) => { const v = M2().vcpt, L = c.lang, nn = NN();
    return tbl([R(c, 'vcptMeasure'), R(c, 'value') + ' ', ...(nn ? [] : ['z', R(c, 'percentile') + ' '])], [['om', v.omissions], ['cm', v.commissions], ['rtMean', v.rt_mean_ms], ['rtSd', v.rt_sd_ms]]
      .map(([k, o]) => `<tr><td>${R(c, k)}</td><td class="n">${o.value}</td>${nn ? '' : `${zc(o.z, o.marked, L)}<td class="n">${fx(o.percentile, 0, L)}</td>`}</tr>`)) + A.sys(S_(c).behaviour); },
  errors: (c) => `<div class="c-errw">${errorsSVG(c.lang)}<span class="c-cap">${R(c, 'errCap')}</span></div>`,
  comparison: (c) => cmpBlock(c),
  limits: (c) => { const cmp = c.cfg.blocks.includes('comparison') && cmpSet(c.snap.cmp).length > 1; return A.sys(S_(c).limits.filter(x => !(cmp && /^L-(REPROC|SIDE|IMPORT)-/.test(x.id)))); },
  /* Method and norms (template gap TG10, review D5): MET sentences, then the recording conditions documented at upload */
  method: (c) => { const L = c.lang, F = A.data.recording_condition_fields || { keys: [], labels: {}, value_labels: {} }, rc = M2().recording_conditions || {}, lab = F.labels[L] || F.labels.en || {}, vl = F.value_labels[L] || F.value_labels.en || {};
    const val = (k) => rc[k] == null ? vl.not_documented : k === 'time_of_day' ? rc[k] : (vl[rc[k]] || rc[k]);
    return A.ann("3.2 Normative model, Working; needs the clinical lead's agreement (section 1): one continuous GAMLSS model of age and sex; the mock norms stand in for it") + A.sys(S_(c).method || []) + (F.keys.length ? `<div class="c-cap"><b>${esc((F.title || {})[L] || (F.title || {}).en || '')}</b></div>${kv(F.keys.map(k => [lab[k] || k, val(k)]))}` : ''); },
  /* frequency markers per electrode (3.3 "Frequency markers on the spectra", Core, review B3): the table, one map per marker, the FM sentences; before
     confirmation the suggestions as they were made, and FM-PEND-1 or FM-PEND-0 */
  freq_markers: (c) => { const L = c.lang, ex = A.ex; if (!ex) return '';
    const st = (c.snap.ex || ex.snap()).fm, conds = ex.fmConds(), rows = conds.flatMap(cd => (ex.fmRows(st, cd) || []).map(r => ({ ...r, cd, conf: st[cd].confirmed })));
    const qa = (r) => r.question ? ex.qPart(L, r.question) + (r.answer ? ': ' + ex.aPart(L, r.answer) : '') : '-';
    let h = A.ann(R(c, 'fmConfirm'));
    if (rows.length) h += tbl([R(c, 'fmNo') + ' ', R(c, 'condition'), R(c, 'site'), R(c, 'fmFreq') + ' ', 'z', R(c, 'fmQ'), R(c, 'fmChoice')], rows.map(r => `<tr><td class="n">${r.k}</td><td>${condL(r.cd, L)}</td><td>${r.site}</td><td class="n">${fx(r.hz, 1, L)}</td>${zc(r.z, r.marked, L)}<td>${esc(qa(r))}</td><td>${R(c, r.conf ? 'fmSrc.' + r.source : 'fmSrcPend')}</td></tr>`))
      + `<div class="c-fmm">${rows.map(r => `<figure class="c-map"><img src="${fmURL(M2(), r.cd, r.site, r.hz)}" width="70" height="74" alt=""><figcaption>${r.k} · ${esc(condL(r.cd, L))} · ${r.site} ${fx(r.hz, 1, L)} Hz</figcaption></figure>`).join('')}</div><div class="c-cap">${R(c, 'fmMaps')}. ${R(c, 'fmLegend')}</div>`;
    else h += `<div class="c-cap">${R(c, 'fmNone')}</div>`;
    return h + A.sys(ex.fmSentences(L, st, conds)); },
  /* source power per brain region (SA2, table 3.3 Core, proposed; L7): one table region x band for both conditions, the SRC sentences, SRC-LIM-1 */
  source_regions: (c) => srcBlock(c),
  /* ERP peak review (MC1, table 3.3 Core, proposed; IU9): the rows as the review stands (module E), the ERPREV sentences */
  erp_review: (c) => revBlock(c),
  /* C4: required, cannot be removed; replaces the signature line that used to sit under the conclusion */
  issuedby: (c) => { const L = c.lang, r = A.state.report, e = c.issued, prev = r.issued.filter(x => x.v < c.v).map(x => x.v).pop(), why = e ? e.reason : r.pendingReason, by = e && (e.by || 'c1');
    const rows = [['ib.by', e ? T('who.' + by, null, L) : R(c, 'ib.onIssue')], ['ib.qual', e ? R(c, 'ib.q.' + by) : R(c, 'ib.onIssue')], ['ib.at', e ? A.at(e.at, L) : R(c, 'ib.onIssue')],
      ['ib.sig', e ? R(c, 'ib.sigV') : R(c, 'ib.onIssue')],
      ['ib.version', `${A.rid(c.v)} · ${M2().processed_with.software} · ${A.dv(M2().processed_with.norms, L)}`], ['ib.replaces', prev ? A.rid(prev) : R(c, 'ib.first')]];
    if (prev) rows.push(['ib.reason', why || '']);
    return `<table class="c-kv c-ibt">${rows.map(([k, v]) => `<tr><th>${R(c, k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`; },
};
/* four global coherence types per band and condition (coherence@2 "+global"), with the COH-GLOB-1 sentences of marked values */
function glob4(c) {
  const L = c.lang, nn = NN(), TY = (A.data.coherence_types || {}).global_types || ['msc', 'lagged', 'inst', 'total'], gl = (A.data.coherence_types || {}).global_labels || {};
  const lab = (t) => cap(((gl[L] || gl.en || {})[t]) || t), g = (cd, b, t) => { const o = (M2().coherence[cd] || {})[b]; return o ? ((o.global4 || {})[t] || (t === 'msc' ? o.global : null)) : null; };
  return A.ann('Table 3.3, 30 October: global coherence, magnitude squared, lagged, instantaneous and total, Core') + `<div class="c-cap"><b>${R(c, 'glob4')}</b></div>` +
    tbl([R(c, 'condition'), R(c, 'type'), ...A.bands.flatMap(b => [BANDL[b.name] + ' ', ...(nn ? [] : ['z'])])], CONDS().flatMap(cd => TY.map((t, i) => `<tr><td>${i ? '' : condL(cd, L)}</td><td>${esc(lab(t))}</td>${A.bands.map(b => { const o = g(cd, b.name, t); return !o ? `<td class="n">-</td>${nn ? '' : '<td></td>'}` : `<td class="n">${fx(o.value, 2, L)}</td>${nn ? '' : zc(o.z, o.marked, L)}`; }).join('')}</tr>`))).replace('<table class="c-t">', '<table class="c-t c-g4">') +
    `<div class="c-cap">${R(c, 'cohgCap')} ${nn ? R(c, 'nnCap') : R(c, 'zKey')}</div>` + (nn ? '' : A.sys(CONDS().flatMap(cd => S_(c)['coherence_global_' + cd] || [])));
}
function srcBlock(c) {
  const L = c.lang, nn = NN(), def = A.data.source_regions || {}, labs = (def.labels || {})[L] || (def.labels || {}).en || {}, S = M2().source_regions || {}, cds = CONDS().filter(cd => S[cd]);
  const bands = ((cds.length && S[cds[0]].bands) || A.bands.map(b => b.name));
  const head = [R(c, 'region'), ...cds.flatMap(cd => bands.map(b => `${BANDL[b]} `))];
  const rows = (def.regions || (cds.length ? S[cds[0]].regions : [])).map(r => `<tr><td>${esc(cap(labs[r] || r))}</td>${cds.map(cd => bands.map(b => { const o = S[cd].values[r][b]; return nn || o.z == null ? `<td class="z">${fx(o.value, 2, L)}</td>` : zc(o.z, o.marked, L); }).join('')).join('')}</tr>`);
  const condHead = `<tr><th></th>${cds.map(cd => `<th colspan="${bands.length}" class="c-srch">${esc(condL(cd, L))}</th>`).join('')}</tr>`;
  return A.ann("Table 3.3 Core, proposed (new; needs the clinical lead's agreement); L7") + `<div class="c-cap"><b>${R(c, nn ? 'srcTV' : 'srcT')}</b></div>` +
    tbl(head, rows).replace('<table class="c-t">', `<table class="c-t c-zt c-src">${condHead}`) +
    `<div class="c-scl"><span class="c-cap">${esc((def.legend || {})[L] || (def.legend || {}).en || '')}${nn ? ' ' + R(c, 'nnCap') : ' ' + R(c, 'zKey')}</span>${nn ? '' : A.zScale(null, L)}</div>` +
    A.sys(['EO', 'EC'].flatMap(cd => S_(c)['source_' + cd] || [])) + A.sys(S_(c).source_limits || []);
}
function revBlock(c) {
  const L = c.lang, ex = A.ex; if (!rvOK()) return '';
  const ann = A.ann("Table 3.3 Core, proposed (new; needs the clinical lead's agreement); IU9 working decision. Replaces the checklist over channel ERPs");
  if (!ex.rvApplicable()) return ann + `<div class="c-cap">${R(c, 'rvNN')}</div>` + A.sys(ex.rvSentences(L));
  const sx = c.snap.ex || ex.snap(), rv = sx.rv || sx.cl || ex.rvState(), pk = peaksOf(c.snap), rows = ex.rvRows(rv, pk), H = (k) => esc(ex.rvHeadOf(k, L)), V = (v) => esc(ex.rvValueOf(v, L));
  const tick = (r, k) => { const p = r.proposed[k], v = r.final[k]; if (k === 'lat' && !r.latency) return '<td class="tc dim">-</td>';
    return `<td class="tc">${p && v !== p ? `<s>${V(p)}</s>${v ? ' ' : ''}` : ''}${v ? `${V(v)}${!p || v !== p ? ` <span class="c-rva">(${V('added')})</span>` : ''}` : ''}</td>`; };
  const clr = (r) => r.component === 'CNV' ? V('mean') : `${V(r.clear ? 'clear_yes' : 'clear_no')}${r.prominence_snr != null ? ` (${fx(r.prominence_snr, 1, L)})` : ''}${r.moved ? `, ${R(c, 'rvMoved')}` : ''}`;
  return ann + tbl([R(c, 'component'), R(c, 'trials'), R(c, 'site'), H('clear'), H('amp'), 'z', H('lat'), 'z', H('shape')], rows.map(r => `<tr><td>${r.component}</td><td>${trialL[r.trial] || r.trial}</td><td>${r.site}</td><td>${clr(r)}</td>${tick(r, 'amp')}${zc(r.amplitude_z, r.amplitude_marked, L)}${tick(r, 'lat')}${r.latency ? zc(r.latency_z, r.latency_marked, L) : '<td></td>'}<td class="tc">${r.final.shape ? V('shape_set') : ''}</td></tr>`)).replace('<table class="c-t">', '<table class="c-t c-rvt">') +
    `<div class="c-cap">${esc(ex.rvLegend ? ex.rvLegend(L) : '')} ${R(c, 'zKey')}</div>` + A.sys(ex.rvSentences(L, rv, pk));
}
/* the excerpts the clinician chose (frozen in the snapshot); null without the workspace module (then the stored excerpt is drawn) */
const rawList = (c) => !A.ax || !A.ax.excerptSVG ? null : ((c.snap && c.snap.exc) || A.ax.excerpts() || []);
const seqKey = (c) => A.bx && A.bx.seqBar ? A.bx.seqBar(R(c, 'seqKey')) : '';
const missSents = (c, key) => CONDS().length === 2 ? '' : A.sys(['EO', 'EC'].filter(cd => MISS(cd)).flatMap(cd => (S_(c)[key + '_' + cd] || [])));
function spectra(cond, c) {
  const C = SP()[cond], L = c.lang, nn = NN();
  /* the eyes closed alpha peak follows the clinician's marker: its sentence moves to the ratios block when that block is in the template */
  const lib0 = S_(c)['spectra_' + cond] || [], k0 = lib0.findIndex(s => s.id.startsWith('APF'));
  const sents = cond !== 'EC' ? lib0 : lib0.flatMap((s, i) => !s.id.startsWith('APF') ? [s] : i === k0 && !c.cfg.blocks.includes('ratios') ? mkList(L, c.snap) : []);
  if (!C) return A.sys(sents);
  return `<div class="c-maps">${A.bands.map(b => `<figure class="c-map"><img src="${mapURL(cond, b.name)}" width="96" height="100" alt="${esc(R(c, nn ? 'mapAltV' : 'mapAlt', { b: BANDL[b.name], cond: condL(cond, L) }))}"><figcaption><b>${BANDL[b.name]}</b> ${A.nx(b.lo, L)}-${A.nx(b.hi, L)} Hz</figcaption></figure>`).join('')}</div>
    <div class="c-scl"><span class="c-cap">${R(c, nn ? 'mapsCapV' : 'mapsCap')}</span>${nn ? seqKey(c) : A.zScale(null, L)}</div>
    <table class="c-t c-zt"><tr><th></th>${A.channels.map(ch => `<th>${ch}</th>`).join('')}</tr>${A.bands.map(b => (nn || variantOf(c.cfg, 'spectra_' + cond) === 'abs' ? ['abs'] : ['abs', 'rel']).map(k => `<tr><th>${BANDL[b.name]} ${k}</th>${nn ? C.bands[b.name].abs_uv2.map(v => `<td class="z">${fx(v, v < 10 ? 1 : 0, L)}</td>`).join('') : C.bands[b.name][k + '_z'].map((z, i) => zc(z, (C.bands[b.name][k + '_marked'] || [])[i], L)).join('')}</tr>`).join('')).join('')}</table>
    ${A.sys(sents)}`;
}
/* comparison of measurements (3.4, M56): every measurement oldest first, each against its own age norm; CMP-1 for two,
   CMP-N-1 for more; L-REPROC-1, L-SIDE-1, L-IMPORT-1 */
function cmpBlock(c) {
  const L = c.lang, Ms = cmpSet(c.snap.cmp); if (Ms.length < 2) return '';
  const cur = Ms[Ms.length - 1], lab = (m) => `${R(c, m === cur ? 'current' : 'earlier')} ${A.fmtDate(m.date, L)}${m.uploaded_later ? ` (${R(c, 'uplLater')})` : ''}`;
  const rows = [['om', 'omissions', ''], ['cm', 'commissions', ''], ['rtMean', 'rt_mean_ms', ''], ['rtSd', 'rt_sd_ms', '']].map(([k, f]) => `<tr><td>${R(c, k)}</td>${Ms.map(m => `<td class="n">${m.vcpt[f].value}</td>${zc(m.vcpt[f].z, m.vcpt[f].marked, L)}`).join('')}</tr>`);
  ['EO', 'EC'].forEach(cd => [['tbrCz', 'tbr', 2], ['apfHz', 'alpha_peak', 1]].forEach(([k, f, d]) => rows.push(`<tr><td>${R(c, k)}, ${condL(cd, L)}</td>${Ms.map(m => { const C = m.spectra.conditions[cd]; return !C ? '<td class="n">-</td><td></td>' : `<td class="n">${fx(f === 'tbr' ? C.tbr.value : C.alpha_peak.hz, d, L)}</td>${zc(C[f].z, C[f].marked, L)}`; }).join('')}</tr>`)));
  const head = `<tr><th>${R(c, 'measure')}</th>${Ms.map(m => `<th class="n">${esc(lab(m))}</th><th>z</th>`).join('')}</tr>`;
  const maps = Ms.map(m => `<div class="c-cmpr"><span class="c-cap"><b>${esc(lab(m))}</b></span><div class="c-maps">${['delta', 'theta', 'alpha', 'beta1'].map(b => `<figure class="c-map"><img src="${cache('cm' + m.id + b, () => zMap(m.spectra.conditions.EC.bands[b].abs_z, 60, markedCh(m.spectra.conditions.EC.bands[b].abs_marked)))}" width="60" height="64" alt=""><figcaption><b>${BANDL[b]}</b></figcaption></figure>`).join('')}</div></div>`).join('');
  const sn = A.bx && A.bx.cmpSents ? A.bx.cmpSents(Ms, Ms.length > 2, L) : { cmp: S_(c).comparison, lim: [] };
  return `${A.ann('3.3 says two measurements side by side, 3.4 any number: open in the specification; the mockup shows every measurement (M56). A test of the change is Open in table 3.3 (C5) and not shown')}<table class="c-t c-cmpt">${head}${rows.join('')}</table><div class="c-cap">${R(c, 'zKey')}</div>${maps}<div class="c-cap">${R(c, 'cmpMaps')}</div>${A.sys(sn.cmp)}${A.sys(sn.lim)}`;
}
const stLabel = (c) => R(c, 'st.' + c.status);
/* ---------------- document assembly and pagination ---------------- */
const born = (L) => A.state.staffView ? T('hidden', null, L) : A.fmtDate(A.case.identity_store.birth_date, L);
const BAND_H = 136;
function headerHTML(c) {
  const th = c.cfg.theme, L = c.lang, std = c.cfg.style === 'std', tx = ctexts(c);
  const id = [[R(c, 'patient'), nameIn(L)], [R(c, 'code'), A.case.case_code], [R(c, 'born'), born(L)], [R(c, 'recorded'), A.fmtDate(M2().date, L)], [R(c, 'age'), T('years', { n: ageY() }, L)], [R(c, 'sex'), sexL(L)]];
  const hdr = `<div class="c-hdr${th.logo === 'right' ? ' rev' : ''}"><div class="c-logo">${std ? 'LOGO' : T('c.logoC', null, L)}</div>
    <div class="c-hdrtx"><div class="c-cn">${T('clinicC', null, L)}</div>${th.addr ? `<div>${esc(tx.addr1)}</div><div>${esc(tx.addr2)}</div>` : ''}</div></div>`;
  return `<section class="c-blk c-clc" data-blk="header" data-kind="clinic">${std ? `<div class="c-bandsp" style="height:${BAND_H - PAD[0] + 12}px"></div>${hdr}` : `${hdr}<h1 class="c-title">${R(c, 'title')}</h1>`}
    <div class="c-id">${id.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div></section>`;
}
/* company standard: page decorations outside the body (cover band, running header, lime footer band) */
function stdDeco(c, i) {
  const L = c.lang;
  if (!i) return `<div class="c-band"><div class="c-bt"><h1 class="c-title">${R(c, 'title')}</h1><div class="c-bsub">${R(c, 'recorded')} ${A.fmtDate(M2().date, L)} · ${esc(A.case.case_code)}</div></div>${A.trace(520, 64, 11)}</div><div class="c-fband"></div>`;
  return `<div class="c-rh"><i>${R(c, 'title')} · ${esc(nameIn(L))} · ${R(c, 'born')} ${born(L)}</i><i>${R(c, 'page')} ${i + 1}</i></div><div class="c-fband"></div>`;
}
const hnum = (n) => n ? `<b class="c-rn">${ROMAN(n)}.</b> ` : '';
function clinHTML(key, c, n) {
  const isC = key.startsWith('comment.'), L = c.lang, t = c.texts[key] || '', ed = c.editable, ttl = isC ? R(c, 'comment') : blkLabel(key, L);
  const sig = '';
  return `<section class="c-blk c-cln" data-blk="${key}" data-kind="clinician"><h2 class="c-h c-hc"><span>${hnum(n)}${esc(ttl)}</span>${isC && ed ? `<button class="c-rmc" data-rmc="${key}" title="${esc(T('c.rmComment'))}">${esc(T('c.remove'))}</button>` : ''}</h2>
    <div class="c-txt${!ed && !t.trim() ? ' c-none' : ''}" data-key="${key}" data-ph="${esc(R(c, 'ph.' + (isC ? 'comment' : key)))}"${ed ? ` contenteditable="plaintext-only" role="textbox" aria-multiline="true" aria-label="${esc(ttl)}" spellcheck="true" lang="${L}"` : ''}>${ed ? esc(t) : esc(t.trim() ? (HID() ? R(c, 'clinHid') : t) : R(c, 'none'))}</div>${sig}</section>`;
}
/* structured anamnesis (open question I5, M62): four fields, free text from the separate identity store (3.6); edits in the
   report editor stay with this report version, an issued version keeps them */
const anamKeys = () => (A.data.anamnesis_fields || {}).keys || ['anamnesis', 'history', 'medication', 'current_symptoms'];
const anamVal = (c, k, L) => { const v = c.texts['anam.' + k]; if (v != null) return v; const a = ((A.case.identity_store || {}).anamnesis || {})[k] || {}; return a[L] ?? a.en ?? ''; };
function anamHTML(c, n) {
  const L = c.lang, ed = c.editable, hid = A.state.staffView;
  return `<section class="c-blk c-cln" data-blk="anamnesis" data-kind="clinician"><h2 class="c-h c-hc"><span>${hnum(n)}${esc(blkLabel('anamnesis', L))}</span>${ed ? `<span class="c-store">${esc(T('c.store'))}</span>` : ''}</h2>
    <div class="c-flds">${anamKeys().map(k => { const key = 'anam.' + k, t = hid ? T('hidden', null, L) : anamVal(c, k, L), lab = anamLab(k, L);
      return `<div class="c-fld"><div class="c-flab">${esc(lab)}</div><div class="c-txt${!ed && !t.trim() ? ' c-none' : ''}" data-key="${key}" data-ph="${esc(R(c, 'ph.anamF'))}"${ed && !hid ? ` contenteditable="plaintext-only" role="textbox" aria-multiline="true" aria-label="${esc(lab)}" spellcheck="true" lang="${L}"` : ''}>${ed ? esc(t) : esc(t.trim() || R(c, 'none'))}</div></div>`; }).join('')}</div></section>`;
}
/* clinician form (template gap TG6, M63): clinic-defined rows, dates and yes or no only, no free text */
const formRows = () => (A.data.clinician_form || {}).rows || [];
function formHTML(c, n) {
  const L = c.lang, ed = c.editable, v = c.form || {}, F = A.data.clinician_form || {}, yl = (F.value_labels || {})[L] || (F.value_labels || {}).en || {};
  const cell = (r) => { const x = v[r.key], lab = (r.label || {})[L] || (r.label || {}).en || r.key;
    if (ed) return r.type === 'date' ? `<input type="date" data-form="${r.key}" value="${esc(x || '')}" aria-label="${esc(lab)}">` : `<select data-form="${r.key}" aria-label="${esc(lab)}"><option value="">${esc(R(c, 'formEmpty'))}</option>${['yes', 'no'].map(o => `<option value="${o}" ${x === o ? 'selected' : ''}>${esc(yl[o] || o)}</option>`).join('')}</select>`;
    return x == null || x === '' ? '<span class="c-blank">________________</span>' : esc(r.type === 'date' ? A.fmtDate(x, L) : (yl[x] || x)); };
  return `<section class="c-blk c-cln" data-blk="form" data-kind="clinician"><h2 class="c-h c-hc"><span>${hnum(n)}${esc(blkLabel('form', L))}</span></h2>
    <table class="c-kv c-form">${formRows().map(r => `<tr><th>${esc((r.label || {})[L] || (r.label || {}).en || r.key)}</th><td>${cell(r)}</td></tr>`).join('')}</table></section>`;
}
const clinEmpty = (c, id) => id === 'anamnesis' ? anamKeys().every(k => !String(anamVal(c, k, c.lang)).trim()) : id === 'form' ? formRows().some(r => !(c.form || {})[r.key]) : !(c.texts[id] || '').trim();
function items(c) {
  const out = [{ id: 'header', kind: 'clinic', label: T('c.hdrItem'), html: headerHTML(c) }], std = c.cfg.style === 'std'; let sec = 0;
  c.cfg.blocks.forEach(id => {
    const d = CAT[id]; if (!d) return;
    if (id === 'comparison' && cmpSet(c.snap.cmp).length < 2) return;
    if (id === 'raw' && rawList(c) && !rawList(c).length) return;
    let html; const n = std && d.kind !== 'clinic' ? ++sec : 0, head = id === 'comparison' ? cmpLabel(cmpSet(c.snap.cmp), c.lang) : blkLabel(id, c.lang);
    if (d.kind === 'device') html = `<section class="c-blk c-dev" data-blk="${id}" data-kind="device" title="${esc(T('c.locked'))}"><h2 class="c-h"><span>${hnum(n)}${esc(head)}</span></h2>${DEV[id](c)}${c.editable && d.result && !(('comment.' + id) in c.texts) ? `<button class="c-addc" data-addc="${id}" title="${esc(T('c.addCommentT'))}">${esc(T('c.addComment'))}</button>` : ''}</section>`;
    else if (d.kind === 'clinic') html = `<section class="c-blk c-clc c-intro" data-blk="${id}" data-kind="clinic"><p>${esc(fill(ctexts(c).intro, c.lang))}</p></section>`;
    else html = id === 'anamnesis' ? anamHTML(c, n) : id === 'form' ? formHTML(c, n) : clinHTML(id, c, n);
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
    <div class="c-foot">${T('mock', null, c.lang)}${std ? ' · ' + R(c, 'companyLine') : ''} · V4 mockup 0.1 · Mock norms 2026.1 · ${A.rid(c.v)} ${stLabel(c)} · ${R(c, 'page')} ${i + 1}${c.cfg.theme.pageOf ? ` ${R(c, 'of')} ${N}` : ''}</div></div>`);
  return { pages: html, html: html.join(''), N, items: its, sig: pages.map(p => p.map(x => x.id).join()).join('|') };
}
/* context of the document shown: an issued entry, or the live draft */
function ctxEntry(e, list) {
  const next = list.find(x => x.v > e.v);
  return { cfg: e.cfg, texts: e.texts, v: e.v, status: next ? 'replaced' : 'issued', replacedBy: next && next.v, lang: e.lang, tv: e.tv, tid: e.tid || 'CT-C', editable: false, issued: e, form: e.form || {}, quality: pick(e.quality, e.lang), choices: pick(e.choices, e.lang), snap: e.snap || snapNow() };
}
function docCtx() {
  const r = A.state.report; ensure(); const last = r.issued[r.issued.length - 1], pin = r.pin;
  if (r.status === 'issued' && last) return ctxEntry(last, r.issued);
  const sn = snapNow();
  return { cfg: pin.cfg, texts: r.texts, form: r.form, v: r.version, status: 'draft', lang: r.lang, tv: pin.v, tid: r.tpl, editable: canEd(), quality: qualityList(r.lang, sn), choices: choices(r.lang, sn, pin.cfg), snap: sn };
}
/* warnings and passed checks, in the interface language */
function checks(c) {
  const s = A.state, w = [], ok = [];
  [['segments', 'c.ck.segments', 'segments'], ['cleaning', 'c.ck.cleaning', 'cleaning'], ...(mkNeeded() ? [['markers', 'c.ck.marker', 'results']] : [])].forEach(([k, l, go]) => {
    const n = k === 'segments' ? +(s.segments.changes || 0) || 0 : 0;
    if (!(s[k] || {}).confirmed) w.push({ t: T(n ? 'c.ck.pend' : 'c.ck.notConf', { l: T(l), n }), go, need: 1 }); else ok.push(T('c.ck.conf', { l: T(l) })); });
  /* issuing needs the peaks of every trial type with scored peaks, whatever blocks the template prints */
  PKT().forEach(t => { const l = T('c.ck.peaks', { t: trialL[t] }), st = (s.peaks || {})[t] || {}, n = (st.moved || []).length;
    if (!st.confirmed) w.push({ t: T(n ? 'c.ck.pend' : 'c.ck.notConf', { l, n }), go: 'results', need: 1 }); else ok.push(T('c.ck.conf', { l })); });
  /* markers per electrode and the checklist block issue when the template shows their block (M57; mockup assumption for the checklist) */
  if (A.ex && c.cfg.blocks.includes('freq_markers')) { const open = A.ex.fmOpen(); open.forEach(cd => { const l = T('c.ck.fm', { cond: T('condl.' + cd) }), st = (A.ex.snap().fm || {})[cd] || {}, n = Object.keys(st.moves || {}).length + (st.removed || []).length + (st.added || []).length;
      w.push({ t: T(n ? 'c.ck.pend' : 'c.ck.notConf', { l, n }), go: 'results', need: 1 }); }); A.ex.fmConds().filter(cd => !open.includes(cd) && ((A.ex.snap().fm || {})[cd] || {}).confirmed).forEach(cd => ok.push(T('c.ck.conf', { l: T('c.ck.fm', { cond: T('condl.' + cd) }) }))); }
  /* the ERP peak review blocks issue when the template shows its block (MC1, as the markers do) */
  if (rvOK() && c.cfg.blocks.includes('erp_review') && A.ex.rvApplicable()) { const l = T('c.ck.rv'), n = A.ex.rvNChanged ? A.ex.rvNChanged() : 0;
    if (A.ex.rvOpen()) w.push({ t: T(n ? 'c.ck.pend' : 'c.ck.notConf', { l, n }), go: 'results', need: 1 }); else ok.push(T('c.ck.conf', { l })); }
  /* review A9: a result set being computed after a confirmed change blocks issue until it is done */
  const rb = rsBusy(), rn = A.rs && A.rs.now ? A.rs.now() : null; if (rb) w.push({ t: T('c.ck.rs', { n: rb.n, s: rb.step }), go: 'results', need: 1 }); else if (rn && rn.after) ok.push(T('c.ck.rsDone', { n: rn.n }));
  const nReq = ok.length;
  c.cfg.blocks.filter(id => CAT[id] && CAT[id].kind === 'clinician').forEach(id => { if (id === 'form') { const m = formRows().length, n = formRows().filter(r => !(c.form || {})[r.key]).length; if (n) w.push({ t: T('c.ck.form', { n, m }), blk: id }); else ok.push(T('c.ck.formOk')); return; }
    if (clinEmpty(c, id)) w.push({ t: T('c.ck.empty', { l: blkLabel(id) }), blk: id }); else ok.push(T('c.ck.written', { l: blkLabel(id) })); });
  Object.keys(c.texts).filter(k => k.startsWith('comment.') && CAT[k.slice(8)] && c.cfg.blocks.includes(k.slice(8)) && !(c.texts[k] || '').trim()).forEach(k => w.push({ t: T('c.ck.emptyC', { l: label(k) }), blk: k }));
  /* ok holds the passed required checks first (nReq), then the recommended ones */
  return { w, ok, need: w.filter(x => x.need), okReq: ok.slice(0, nReq), okRec: ok.slice(nReq) };
}
const hash = (s) => { let h1 = 0x811c9dc5, h2 = 0x1234567; for (let i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822519); }
  return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).replace(/(.{4})/g, '$1 ').trim(); };
/* review C22: a placeholder for the PDF's SHA-256, 64 hex characters (the mockup creates no PDF file) */
const sha64 = (s) => [0, 1, 2, 3].map(i => hash(i + '|' + s).replace(/ /g, '')).join('');

/* ---------------- CSS ---------------- */
A.css('c-report', `
.c-ed .ann, .c-tb .ann, .c-as .ann, .c-iv .ann { white-space: normal; max-width: 100%; text-align: left; }
/* banners and toolbars wrap at phone width (German labels are long) */
#cBan .banner, .c-iv .banner { flex-wrap: wrap; } #cBan .banner > span { min-width: 12em; } .c-mid { min-width: 0; } .c-mid .toolbar { flex-wrap: wrap; min-width: 0; }
.c-annw { display: block; white-space: normal; } .c-annw .ann { margin: 2px 4px 0 0; white-space: normal; max-width: 100%; text-align: left; font-size: 11px; line-height: 1.35; }
.c-ed { display: grid; grid-template-columns: 250px minmax(0, 1fr) 292px; grid-template-areas: "out mid side"; gap: 14px; align-items: start; }
.c-out { grid-area: out; position: sticky; top: 64px; } .c-mid { grid-area: mid; display: grid; gap: 10px; min-width: 0; } .c-side { grid-area: side; display: grid; gap: 12px; position: sticky; top: 64px; }
.c-olist { display: grid; padding: 6px; max-height: calc(100vh - 150px); overflow: auto; }
.c-oi { display: flex; min-width: 0; width: 100%; align-items: center; gap: 7px; text-align: left; border: 0; background: none; padding: 5px 6px; border-radius: 5px; font-size: 12.5px; color: var(--ink-2); }
.c-oi:hover { background: var(--accent-soft); color: var(--ink); } .c-oi .chip { font-size: 11px; padding: 0 5px; flex: none; width: 56px; justify-content: center; }
.c-oi .c-ol { flex: 1; min-width: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; } .c-oi .c-em { color: var(--amber); font-size: 11px; }
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
.c-errw { display: flex; gap: 16px; align-items: flex-end; } .c-ibt { width: 100%; } .c-ibt th { width: 170px; }
.c-maps { display: flex; justify-content: space-between; } .c-map { margin: 0; text-align: center; font-size: 10px; color: #55554f; } .c-map img { display: block; }
.c-scl { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin: 4px 0 4px; } .c-cap { font-size: 10px; color: #6b6b66; margin: 2px 0; }
.c-txt { white-space: pre-wrap; min-height: 34px; padding: 5px 8px; border-left: 3px solid var(--c-acc); background: #fafbfd; outline: none; }
.c-txt.c-none { color: #8a8984; font-style: italic; min-height: 0; }
.c-sig { margin-top: 8px; font-size: 10.5px; color: #55554f; border-top: 0.5px solid #cfcec8; padding-top: 4px; width: 60%; }
.c-marks .c-txt[contenteditable] { box-shadow: inset 0 0 0 1px #b9cce6; cursor: text; } .c-marks .c-txt[contenteditable]:hover { background: #f3f7fc; }
.c-txt[contenteditable]:focus { box-shadow: inset 0 0 0 2px var(--c-acc); background: #fff; }
.c-marks .c-txt[contenteditable]:empty::before { content: attr(data-ph); color: #9a9993; font-style: italic; }
.c-marks .c-dev:hover, .c-marks .c-clc:hover { outline: 1px dashed #9db4d6; outline-offset: 3px; cursor: not-allowed; }
.c-marks .c-dev:hover::after { content: '🔒 Locked'; position: absolute; top: 2px; right: 4px; font: 600 11px var(--f-ui); background: #fff; color: #1d4f8f; padding: 1px 6px; border-radius: 99px; z-index: 2; }
.c-addc, .c-rmc { font: 500 11px var(--f-ui); border: 1px solid #9db4d6; background: #fff; color: #1d4f8f; border-radius: 99px; padding: 1px 9px; cursor: pointer; }
.c-addc { position: absolute; right: 0; bottom: -3px; opacity: 0; z-index: 3; } .c-marks .c-dev:hover .c-addc, .c-addc:focus-visible { opacity: 1; }
.c-rmc { padding: 0 8px; } .c-zoom:not(.c-marks) .c-addc, .c-zoom:not(.c-marks) .c-rmc { display: none; }
.c-flash { animation: cflash 1.2s ease-out; } @keyframes cflash { 0% { box-shadow: 0 0 0 4px rgba(28,92,171,0.35); } 100% { box-shadow: 0 0 0 4px rgba(28,92,171,0); } }
.c-deny { animation: cdeny 0.3s; } @keyframes cdeny { 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.c-tip { position: fixed; z-index: 60; background: var(--ink); color: var(--surface); font-size: 12px; padding: 5px 9px; border-radius: 5px; pointer-events: none; box-shadow: var(--shadow); }
.c-side .card > .bd { display: grid; gap: 8px; } .c-side .kv { font-size: 12.5px; }
.c-ck { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; } .c-ck li { display: flex; gap: 7px; align-items: baseline; font-size: 12.5px; padding: 3px 4px; border-radius: 4px; }
.c-need { margin: 4px 0 0; padding-left: 16px; } .c-ck li.w { color: var(--amber); cursor: pointer; } .c-ck li.w:hover { background: var(--amber-soft); } .c-ck li.k { color: var(--muted); } .c-ck li b { width: 14px; flex: none; text-align: center; }
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
.c-row .c-grip { cursor: grab; color: var(--muted); user-select: none; width: 12px; } .c-row .chip { font-size: 11px; padding: 0 6px; width: 62px; justify-content: center; flex: none; } .c-row.ro .c-grip { visibility: hidden; cursor: default; }
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
.c-conf { font-size: 10.5px; color: #6b4a00; background: #fbf3df; border-left: 3px solid #d9a32b; padding: 2px 7px; margin: 0 0 4px; }
.c-fmm { display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 2px 0; } .c-fmm .c-map figcaption { font-size: 9px; }
.c-rvt th, .c-rvt td { font-size: 10px; white-space: normal; } .c-rvt td.tc { text-align: center; } .c-rvt td.dim { color: #a5a49f; } .c-rvt s { color: #8a8984; } .c-rva { color: #6b6a65; font-size: 9px; }
.c-src th, .c-src td { font-size: 9.5px; padding: 2px 3px; } .c-src th.c-srch { text-align: center; } .c-src td:first-child { text-align: left; white-space: nowrap; padding: 1px 5px; } .c-g4 th, .c-g4 td { font-size: 9.5px; padding: 2px 3px; }
.c-kv.c-ver { width: 100%; table-layout: fixed; } .c-ver th { width: 150px; white-space: normal; } .c-ver td { overflow-wrap: anywhere; } .c-cmpr { display: grid; grid-template-columns: 150px 1fr; align-items: center; } .c-cmpt th { white-space: normal; }
.c-flds { display: grid; gap: 5px; } .c-flab { font-size: 10.5px; color: #6b6b66; margin: 0 0 1px; } .c-fld .c-txt { min-height: 22px; }
.c-store { font: 500 11px var(--f-ui); color: var(--clinician-ink, #6b3f8f); border: 1px solid currentColor; border-radius: 99px; padding: 0 7px; opacity: 0.8; }
.c-form th { width: 55%; white-space: normal; } .c-form input, .c-form select { font: inherit; font-size: 11px; padding: 1px 4px; border: 1px solid #b9cce6; border-radius: 3px; background: #fafbfd; color: #1f1f1e; }
.c-ckh { display: flex; gap: 6px; align-items: baseline; font-weight: 600; font-size: 12.5px; margin-top: 2px; } .c-ckh .xs { font-weight: 400; margin-left: auto; }
.c-ck li[role=link] span { text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); } .c-noiss { display: grid; gap: 6px; } .c-noiss p.sys { margin: 4px 0 0; }
.c-zi { white-space: nowrap; margin-right: 4px; } .c-zi b { display: inline-block; min-width: 28px; text-align: center; padding: 0 3px; border-radius: 2px; font-weight: 700; }
.c-rawx { margin: 0 0 4px; } .c-rawx figcaption { font-size: 10px; color: #55554f; margin-bottom: 1px; } .c-rawx svg { display: block; max-width: 100%; height: auto; }
td.c-clc { font-size: 10px; white-space: normal; max-width: 150px; } .c-sha { overflow-wrap: anywhere; }
.c-specl { margin: 0; padding: 6px 10px 8px 34px; display: grid; gap: 3px; font-size: 12.5px; } .c-specl li { padding: 2px 0; } .c-specl li > * { vertical-align: middle; } .c-specl .chip { font-size: 11px; padding: 0 6px; margin-right: 6px; }
.c-ref { display: block; font-size: 11px; overflow-wrap: anywhere; } .c-row .chip.c-vst, .chip.c-vst { background: transparent; border: 1px dashed var(--line-2); color: var(--ink-2); margin-top: 2px; width: auto; white-space: normal; } .c-specl .c-rl { display: inline-block; max-width: calc(100% - 90px); }
.c-row .c-rl { white-space: normal; } .c-var { font-size: 11px; padding: 1px 2px; max-width: 108px; flex: none; } .c-val li { font-size: 12.5px; } .c-val li.w { cursor: default; }
.c-blank { color: #8a8984; } .c-repro .c-kv { font-size: 12.5px; } .c-repro .c-kv td { overflow-wrap: anywhere; } .c-repro .c-kv th { color: var(--muted); white-space: normal; min-width: 96px; }
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
  if (!canEd()) return A.toast(T('b.roRole'));
  const r = A.state.report, n = r.issued.length ? r.issued[r.issued.length - 1].v : r.version;
  const back = A.dialog({ title: T('c.corrTitle', { n }), ok: T('c.corrOk', { m: n + 1 }), body: `
    <div class="field"><span>${esc(T('c.corrReason'))}</span><textarea id="cReason" rows="3" placeholder="${esc(T('c.corrPh'))}"></textarea></div>
    <div class="xs muted">${esc(T('c.corrInfo', { n, m: n + 1 }))} ${A.ann('Corrections as new versions')}</div><div id="cRErr" class="xs" style="color:var(--warn)"></div>`,
    onOk: (b) => { const v = $('#cReason', b).value.trim(); if (!v) { $('#cRErr', b).textContent = T('c.corrErr'); $('#cReason', b).focus(); return false; }
      r.status = 'draft'; r.version = n + 1; r.pendingReason = v; r.texts = clone(r.issued[r.issued.length - 1].texts);
      A.addLog('who.c1', 'c.log.corr', { m: n + 1, why: v, id: A.rid() }); A.toast(T('c.toast.corr', { m: n + 1, n })); A.go('report'); } });
  setTimeout(() => { const t = $('#cReason', back); if (t) t.focus(); }, 30);
}
function issueDialog() {
  if (A.state.rejected) return A.toast(T('c.rejNo'));
  if (NN()) return A.toast(T('c.noIssue'));
  if (!canEd()) return A.toast(T('b.roRole'));
  const r = A.state.report, c = docCtx(), { w, need } = checks(c), N = RV.N || 1, by = whoKey();
  if (need.length) return A.toast(T('c.confFirst'));
  /* review D1: issuing is the signature, by re-authentication (a mockup assumption building on the two-factor login of N10);
     review C14: the awake state is confirmed at issue (M24) */
  const back = A.dialog({ title: T('c.issueTitle', { v: r.version }), ok: T('c.reauth'), body: `
    <dl class="kv"><dt>${T('c.report')}</dt><dd class="mono">${A.rid(r.version)}</dd><dt>${T('c.template')}</dt><dd>${c.tid} v${c.tv} · ${esc(tname(c.tid))} · ${esc(T('lang.' + r.lang))} · ${esc(T('c.nPages', { n: N }))}</dd><dt>${T('c.signedBy')}</dt><dd>${esc(T('c.sigAs', { who: T('who.' + by), q: T('c.q.' + by) }))}</dd></dl>
    ${w.length ? `<div class="banner amber"><div><b>${esc(T('c.nWarn', { n: w.length }))}</b><ul style="margin:4px 0 0;padding-left:18px">${w.map(x => `<li>${esc(x.t)}</li>`).join('')}</ul></div></div>` : `<div class="banner ok"><b>${esc(T('c.noWarn'))}</b></div>`}
    <label class="row small" style="align-items:flex-start;flex-wrap:nowrap"><input type="checkbox" id="cConf" style="margin-top:3px"> <span>${esc(T('c.reviewed'))}</span></label>
    <label class="row small" style="align-items:flex-start;flex-wrap:nowrap"><input type="checkbox" id="cAwake" style="margin-top:3px"> <span>${esc(T('c.awake'))}</span>${A.ann('M24; review C14: the awake state confirmed at issue')}</label>
    <div class="field"><span>${esc(T('c.code'))}</span><input id="cCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="${esc(T('c.codePh'))}" style="max-width:9em" class="mono"></div>
    <div class="xs muted">${esc(T('c.sigNote'))} ${esc(T('c.issueInfo'))} ${A.ann('Mockup assumption (review D1): electronic signature by re-authentication at issue, building on the two-factor login of N10')}</div>`,
    onOk: (b) => { if (!okNow(b)) return false; doIssue(N, by); } });
  const ok = $('[data-ok]', back), okNow = (b) => $('#cConf', b).checked && $('#cAwake', b).checked && /^\d{6}$/.test($('#cCode', b).value.trim());
  ok.disabled = true; ['#cConf', '#cAwake', '#cCode'].forEach(q => { const el = $(q, back); el.oninput = el.onchange = () => { ok.disabled = !okNow(back); }; });
}
function doIssue(N, by) {
  const r = A.state.report; ensure(); const t = tpl(r.tpl), v = r.version;
  /* the issued entry keeps the quality sentences and stated choices in every language, so the side
     panels can follow the interface while the document stays in the language it was issued in */
  const byLang = (f) => Object.fromEntries(TL.map(l => [l, f(l)]));
  const sn = snapNow(), texts = clone(r.texts);
  /* the anamnesis as issued: the fields from the identity store, frozen with this version */
  if (t.cfg.blocks.includes('anamnesis')) anamKeys().forEach(k => { if (texts['anam.' + k] == null) texts['anam.' + k] = anamVal({ texts: {} }, k, r.lang); });
  const pin = r.pin || { cfg: t.cfg, v: t.version }, at = A.now(), sha = sha64(JSON.stringify([v, texts, pin.v, at, sn])), cfg = clone(pin.cfg);
  r.issued.push({ v, at, by: by || whoKey(), awake: true, sha, reason: r.pendingReason || null, texts, form: clone(r.form || {}), cfg, tv: pin.v, tid: r.tpl, lang: r.lang, pages: N, quality: byLang(l => qualityList(l, sn)), choices: byLang(l => choices(l, sn, cfg)), snap: sn });
  r.status = 'issued'; r.pendingReason = null; IV.sel = null;
  A.addLog('who.c1', 'c.log.issued', { v, id: A.rid(v), tid: r.tpl, tv: pin.v, h: sha });
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
    const te = t.closest('[data-tedit]'); if (te && A.cx.tbSet) A.cx.tbSet(te.dataset.tedit);
    const ck = t.closest('[data-ck]'); if (ck) { const [k, v] = ck.dataset.ck.split(':'); return k === 'go' ? A.go(v) : (scrollBlk(v), focusKey(v)); }
    if (t.closest('#cIssue')) return issueDialog();
    if (t.closest('[data-tpluse]')) { const r = A.state.report, tt = tpl(r.tpl), o = r.pin.v; r.pin = { id: r.tpl, v: tt.version, cfg: clone(tt.cfg) };
      A.addLog('who.c1', 'c.log.tplUse', { id: r.tpl, v: tt.version, r: r.version, o }); return drawDoc(); }
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
    const fk = e.target.dataset && e.target.dataset.form;
    if (fk) { const r = A.state.report, row = formRows().find(x => x.key === fk), lab = ((row || {}).label || {})[A.lang] || ((row || {}).label || {}).en || fk;
      if (e.target.value) r.form[fk] = e.target.value; else delete r.form[fk];
      A.addLog('who.c1', e.target.value ? 'c.log.form' : 'c.log.formClr', { l: lab, v: r.version }); RV.savedAt = A.time(); $('#cSaved', root).textContent = T('c.saved', { t: RV.savedAt }); drawOutline(); drawSide(); return; }
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
  const cv = $('#cCanvas', root), zm = $('#cZoom', root); if (!cv || !zm) return;
  const z = RV.zoom === 'fit' ? Math.min(1, (cv.clientWidth - 30) / PW) : RV.zoom;
  zm.style.zoom = Math.max(0.2, z).toFixed(3);
}
function drawBanner(c) {
  const r = A.state.report, last = r.issued[r.issued.length - 1], el = $('#cBan', RV.root); let h = '';
  if (r.status === 'issued' && last) h += `<div class="banner ok"><b>${esc(T('c.issuedV', { v: last.v }))}</b><span style="flex:1">${esc(T('c.issuedBan', { at: A.at(last.at), who: T('who.' + (last.by || 'c1')) }))}</span><button class="btn sm" data-go2="issued">${esc(T('c.openIssued'))}</button>${canEd() ? `<button class="btn sm primary" data-correct>${esc(T('c.correct'))}</button>` : ''}</div>`;
  else if (last) h += `<div class="banner amber"><b>${esc(T('c.corrV', { v: r.version }))}</b><span style="flex:1">${esc(T('c.staysIssued', { a: last.v, b: r.version }))} ${esc(T('c.reasonX', { r: r.pendingReason || '' }))}</span><button class="btn sm" data-go2="issued">${esc(T('c.viewV', { v: last.v }))}</button></div>`;
  const t = tpl(r.tpl), pin = r.pin;
  if (c.editable && pin && t.version > pin.v) h += `<div class="banner info"><b>${esc(T('c.tplNew', { v: t.version }))}</b><span style="flex:1">${esc(T('c.tplKeep', { o: pin.v }))}</span>${A.ann('Review C16: an open draft keeps its template version until the clinician accepts the new one (mockup assumption)')}<button class="btn sm primary" data-tpluse>${esc(T('c.tplUse', { v: t.version }))}</button></div>`;
  if (c.lang !== A.lang) h += `<div class="banner"><b>${esc(T('c.reportLangB'))}</b><span style="flex:1">${esc(T('c.langBan', { r: T('lang.' + c.lang), ui: T('lang.' + A.lang) }))}</span>${A.ann('M32 report language independent of the interface')}</div>`;
  el.innerHTML = h; el.hidden = !h;
}
function drawOutline() {
  const c = docCtx(), its = RV.items || [];
  $('#cOutN', RV.root).textContent = T('c.nBlocks', { n: its.length });
  $('#cOut', RV.root).innerHTML = its.map(i => `<button class="c-oi${i.id.startsWith('comment.') ? ' sub' : ''}" data-out="${i.id}" title="${esc(i.label)}"><span class="chip ${i.kind}">${esc(T('c.kind.' + i.kind))}</span><span class="c-ol">${esc(i.id.startsWith('comment.') ? T('c.comment') : i.label)}</span>${i.kind === 'clinician' && clinEmpty(c, i.id) ? `<span class="c-em" title="${esc(T('c.emptyT'))}">${esc(T('c.empty'))}</span>` : ''}</button>`).join('');
}
function drawSide() {
  const r = A.state.report, c = docCtx(), { w, need, okReq, okRec } = checks(c), ed = c.editable, draft = c.status === 'draft';
  const shown = draft ? choices(A.lang, c.snap, c.cfg) : pick(c.issued.choices, A.lang);
  $('#cSide', RV.root).innerHTML = `
    <div class="card"><div class="hd"><h3>${esc(T('c.report'))}</h3>${draft ? `<span class="chip info"><span class="d"></span>${esc(T('c.draft'))}</span>` : `<span class="chip ok"><span class="d"></span>${esc(T('c.issued'))}</span>`}</div><div class="bd"><dl class="kv">
      <dt>${T('c.report')}</dt><dd class="mono">${A.rid(c.v)}</dd><dt>${T('c.template')}</dt><dd><span class="mono">${c.tid}</span> v${c.tv} <a class="xs" href="#templates" data-tedit="${c.tid}">${esc(T('c.edit'))}</a></dd>
      <dt>${T('c.pages')}</dt><dd>${RV.N}</dd><dt>${T('c.author')}</dt><dd>${esc(T('who.' + (draft ? draftWho() : ((c.issued || {}).by || 'c1'))))}</dd></dl>
      <div class="field"><span>${esc(T('c.tplFor'))} ${A.ann('Clinic templates: style and clinic texts change; device blocks and figures stay fixed')}</span><select id="cTpl" ${ed ? '' : 'disabled'}>${Object.keys(TPLS).map(id => `<option value="${id}" ${c.tid === id ? 'selected' : ''}>${esc(tname(id))} · ${id} v${c.tid === id ? c.tv : tpl(id).version}</option>`).join('')}</select></div>
      <div class="field"><span>${esc(T('c.reportLang'))} ${A.ann('M32: the report language is set per report, independent of the interface language; a template carries its clinic texts in English and German and has a language-neutral id')}</span><select id="cLang" ${ed ? '' : 'disabled'}>${TL.map(l => `<option value="${l}" ${c.lang === l ? 'selected' : ''}>${esc(T('lang.' + l))}</option>`).join('')}<option value="ja" disabled>${esc(T('lang.ja'))}</option></select></div></div></div>
    <div class="card"><div class="hd"><h3>${esc(T('c.choices'))}</h3></div><div class="bd c-ch">${shown.map(x => `<div><span class="lbl">${esc(x.k)}</span>${esc(x.v)} ${x.ok ? '<span class="chip ok">✓</span>' : `<span class="chip amber">${esc(T('c.open'))}</span>`}</div>`).join('')}</div></div>
    ${sideChecks(c, w, need, okReq, okRec, ed, draft)}`;
}
/* review C5: one checklist, "Required to issue" (lock, k of n done, each open item a link to where it is fixed) and "Recommended"
   (empty clinician texts); lead decision 2: without an age norm no report is issued, the fixed reason sentence instead of the action */
function sideChecks(c, w, need, okReq, okRec, ed, draft) {
  const rec = w.filter(x => !x.need), nReq = need.length + okReq.length, li = (x) => `<li class="w" data-ck="${x.go ? 'go:' + x.go : 'blk:' + x.blk}" tabindex="0" role="link"><b>○</b><span>${esc(x.t)} ›</span></li>`;
  const done = (x) => `<li class="k"><b>✓</b><span>${esc(x)}</span></li>`, nn = NN(), sent = (SM().issue || []);
  const action = !draft ? (canEd() ? `<button class="btn" data-correct style="justify-content:center">${esc(T('c.correctThis'))}</button>` : '')
    : nn ? `<div class="banner amber c-noiss"><div><b>${esc(T('c.noIssue'))}</b>${A.sys(sent)}</div>${A.ann('Lead decision 2: no report for an age outside the norm range; whether to block or to allow with a mark is open for the clinical lead')}</div>`
    : !ed ? `<span class="xs muted">${esc(T('b.roRole'))}</span>`
    : A.state.rejected ? `<button class="btn primary" disabled style="justify-content:center" title="${esc(T('c.rejNo'))}">${esc(T('c.issueBtn', { v: c.v }))}</button><span class="xs muted" id="cRejNo">${esc(T('c.rejNo'))}</span>`
    : `<button class="btn primary" ${need.length ? `disabled title="${esc(T('c.confFirst'))}"` : 'id="cIssue"'} style="justify-content:center">${esc(T('c.issueBtn', { v: c.v }))}</button>`;
  return `<div class="card"><div class="hd"><h3>${esc(T(draft ? 'c.before' : 'c.atIssue'))}</h3>${nn && draft ? `<span class="chip amber">${esc(T('c.noIssue'))}</span>` : need.length ? `<span class="chip amber">${esc(T('c.reqN', { k: okReq.length, n: nReq }))}</span>` : `<span class="chip ok">${esc(T('c.ready'))}</span>`}</div><div class="bd">
      ${nn ? '' : `<div class="c-ckh"><b aria-hidden="true">🔒</b>${esc(T('c.req'))}${A.ann('Mockup assumption M52: the confirmations that gate issue; frequency markers on the spectra are Core (table 3.3, 30 October), the ERP peak review is Core, proposed and gates issue when the template shows its block')}<span class="xs muted">${esc(T('c.reqN', { k: okReq.length, n: nReq }))}</span></div>
      <ul class="c-ck">${need.map(li).join('')}${okReq.map(done).join('')}</ul>`}
      ${rec.length + okRec.length ? `<div class="c-ckh">${esc(T('c.recm'))}</div><ul class="c-ck">${rec.map(li).join('')}${okRec.map(done).join('')}</ul>` : ''}
      <div class="xs muted">🔒 ${esc(T('c.locks', { n: c.cfg.blocks.filter(id => CAT[id] && CAT[id].kind === 'device').length }))}</div>
      ${action}</div></div>`;
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
/* a rejected recording gives no report (M45): the Report tab shows an empty state instead of the draft */
const edOrRej = (root, ctx) => {
  if (!A.state.rejected) return edRender(root, ctx);
  root.innerHTML = `<div class="card"><div class="empty"><b>${esc(T('c.rejNo'))}</b><div style="margin-top:10px"><button class="btn sm" id="cUnrej">${esc(T('rej.undo'))}</button></div></div></div>`;
  $('#cUnrej', root).onclick = () => A.undoReject();
};
window.Modules.report = { render: edOrRej, destroy() { if (RV.ro) RV.ro.disconnect(); RV.ro = null; RV.root = null; $$('.c-tip').forEach(x => x.remove()); } };

/* ================================ Issued viewer ================================ */
const IV = { sel: null, zoom: 'fit', root: null, ro: null, k: null };
const ZSTEPS = [0.5, 0.6, 0.75, 0.9, 1, 1.25];
function ivRender(root) {
  ensure(); IV.root = root;
  const r = A.state.report, list = r.issued;
  if (!list.length) {
    root.innerHTML = `<div class="card"><div class="empty"><div style="font-size:30px">▤</div><b>${esc(T('c.noIssued'))}</b><br><span class="small">${esc(T('c.isDraft', { v: r.version }))}</span><br><button class="btn primary" data-go2="report" style="margin-top:12px">${esc(T('c.openDraft'))}</button></div></div>`;
    root.onclick = e => { if (e.target.closest('[data-go2]')) A.go('report'); }; return;
  }
  if (IV.k !== CK()) { IV.k = CK(); IV.sel = null; }
  const last = list[list.length - 1], e = list.find(x => x.v === IV.sel) || last, c = ctxEntry(e, list), b = buildPages(c), pw = M2().processed_with;
  const drafting = r.status === 'draft';
  root.innerHTML = `<div class="c-iv">
    ${drafting ? `<div class="banner amber"><b>${esc(T('c.corrProg', { v: r.version }))}</b><span style="flex:1">${esc(T('c.staysIssued', { a: last.v, b: r.version }))}</span><button class="btn sm primary" data-go2="report">${esc(T('c.openDraftV', { v: r.version }))}</button></div>` : ''}
    <div class="card"><div class="toolbar" role="toolbar" aria-label="${esc(T('c.ivAria'))}">
      <b class="mono small">${A.rid(e.v)}</b><span class="chip clinic" title="${esc(T('c.tplUsed'))}">${esc(tname(c.tid))} · ${c.tid} v${e.tv}</span>${c.status === 'replaced' ? `<span class="chip">${esc(T('c.replacedBy', { v: c.replacedBy }))}</span>` : `<span class="chip ok"><span class="d"></span>${esc(T('c.issued'))}</span>`}
      <label>${esc(T('c.version'))} <select id="cVer">${list.slice().reverse().map(x => `<option value="${x.v}" ${x.v === e.v ? 'selected' : ''}>v${x.v} · ${esc(A.at(x.at))}</option>`).join('')}</select></label><span class="sep"></span>
      <button class="btn sm" data-z="-1" aria-label="${esc(T('c.zoomOut'))}">−</button><span class="c-zl mono" id="cZl"></span><button class="btn sm" data-z="1" aria-label="${esc(T('c.zoomIn'))}">+</button><button class="btn sm ghost" data-z="fit">${esc(T('c.fitWidth'))}</button>
      <span class="sep"></span><button class="btn sm" id="cDl">${esc(T('c.download'))}</button><span style="flex:1"></span>
      ${!drafting && e.v === last.v && canEd() ? `<button class="btn sm primary" data-correct>${esc(T('c.correctThis'))}</button>` : ''}</div>
      <div class="c-ivbody"><div class="c-thumbs" id="cThumbs">${b.pages.map((p, i) => `<button class="c-th${i ? '' : ' on'}" data-pg="${i + 1}" aria-label="${esc(T('c.pageN', { n: i + 1 }))}"><div class="c-thz"><div>${p}</div></div><span>${i + 1}</span></button>`).join('')}</div>
        <div class="c-canvas" id="cIvC"><div class="c-zoom" id="cIvZ">${b.html}</div></div></div>
      <div class="c-ivfoot xs muted"><span>${esc(T('c.issuedAtBy', { at: A.at(e.at), who: T('c.sigAs', { who: T('who.' + (e.by || 'c1')), q: T('c.q.' + (e.by || 'c1')) }) }))}</span><span>${esc(pw.software)}</span><span>${esc(pw.pipeline || '')}</span><span>${esc(A.dv(pw.norms))}</span><span>${esc(reproRows(M2(), A.lang)[0][1])}</span><span>${esc(T('c.tplLine', { tid: c.tid, tv: e.tv, name: tname(c.tid) }))}</span><span>${esc(T('lang.' + e.lang))} · ${esc(T('c.nPages', { n: b.N }))}</span><span class="mono c-sha">${esc(T('c.checksum', { h: e.sha || sha64(JSON.stringify([e.v, e.texts, e.tv, e.at])) }))}</span>${A.ann('Review C22: a placeholder for the SHA-256 of the issued PDF; the mockup creates no file')}</div></div>
    <div class="card"><div class="hd"><h2>${esc(T('c.repro'))}</h2><span class="xs muted">${esc(T('c.reproSub', { d: A.fmtDate(M2().date) }))} ${A.ann('3.8 Reproducibility, Working; review D6; M64')}</span></div><div class="bd c-repro">${kv([[T('rep.software'), pw.software], ...reproRows(M2(), A.lang, c)])}</div></div>
    <div class="card"><div class="hd"><h2>${esc(T('c.history'))}</h2><span class="xs muted">${esc(T('c.keptAll'))} ${A.ann('Corrections as new versions')}</span></div><div class="scroll-x"><table class="tbl">
      <tr><th>${T('c.th.version')}</th><th>${T('c.th.status')}</th><th>${T('c.th.issued')}</th><th>${T('c.th.by')}</th><th>${T('c.th.reason')}</th><th>${T('c.th.template')}</th><th>${T('c.th.rs')}</th><th class="num">${T('c.th.pages')}</th></tr>
      ${drafting ? `<tr class="link" data-go2="report"><td class="mono">v${r.version}</td><td><span class="chip info">${esc(T('c.draft'))}</span></td><td class="muted">${esc(T('c.notIssued'))}</td><td>${esc(T('who.' + draftWho()))}</td><td>${esc(HID() && r.pendingReason ? T('rep.clinHid') : (r.pendingReason || ''))}</td><td>${r.tpl} v${(r.pin || {}).v || tpl(r.tpl).version}</td><td class="mono xs">${esc(rsId())}</td><td></td></tr>` : ''}
      ${list.slice().reverse().map(x => { const nx = list.find(y => y.v > x.v); return `<tr class="link${x.v === e.v ? ' on' : ''}" data-ver="${x.v}"><td class="mono">${x.v === e.v ? '▸ ' : ''}v${x.v}</td><td>${nx ? `<span class="chip">${esc(T('c.replacedBy', { v: nx.v }))}</span>` : `<span class="chip ok">${esc(T('c.current'))}</span>`}</td><td>${esc(A.at(x.at))}</td><td>${esc(T('who.' + (x.by || 'c1')))}</td><td>${esc(x.reason ? (HID() ? T('rep.clinHid') : x.reason) : T('c.firstIssue'))}</td><td>${x.tid || 'CT-C'} v${x.tv}</td><td class="mono xs">${esc(((x.snap || {}).rs) || '')}</td><td class="num">${x.pages || ''}</td></tr>`; }).join('')}
    </table></div></div></div>`;
  const cv = $('#cIvC', root);
  const zoomNow = () => IV.zoom === 'fit' ? Math.min(1.25, (cv.clientWidth - 30) / PW) : IV.zoom;
  const applyZ = () => { const z = Math.max(0.2, zoomNow()); $('#cIvZ', root).style.zoom = z.toFixed(3); $('#cZl', root).textContent = A.pct(z * 100, 0); };
  root.onclick = (ev) => {
    const t = ev.target;
    const zb = t.closest('[data-z]'); if (zb) { const cur = zoomNow(); if (zb.dataset.z === 'fit') IV.zoom = 'fit'; else { const d = +zb.dataset.z; IV.zoom = d > 0 ? (ZSTEPS.find(s => s > cur + 0.01) || 1.25) : ([...ZSTEPS].reverse().find(s => s < cur - 0.01) || 0.5); } return applyZ(); }
    const pg = t.closest('[data-pg]'); if (pg) { const p = $(`#cIvZ [data-page="${pg.dataset.pg}"]`, root); cv.scrollTo({ top: cv.scrollTop + p.getBoundingClientRect().top - cv.getBoundingClientRect().top - 12, behavior: 'smooth' }); return; }
    const vr = t.closest('[data-ver]'); if (vr) { IV.sel = +vr.dataset.ver; A.addLog('who.c1', 'c.log.viewed', { v: IV.sel, id: A.rid(IV.sel) }); return ivRender(root); }
    if (t.closest('[data-correct]')) return correctDialog();
    if (t.closest('[data-go2]')) return A.go('report');
    if (t.closest('#cDl')) { A.addLog('who.c1', 'c.log.dl', { v: e.v, id: A.rid(e.v) }); if (!(A.printReport && A.printReport())) A.toast(T('c.toast.dl', { v: e.v, id: A.rid(e.v) })); }
  };
  $('#cVer', root).onchange = (ev) => { IV.sel = +ev.target.value; ivRender(root); };
  cv.onscroll = () => { const top = cv.getBoundingClientRect().top + 60; let cur = 1;
    $$('#cIvZ .c-pg', root).forEach(p => { if (p.getBoundingClientRect().top <= top) cur = +p.dataset.page; });
    $$('#cThumbs .c-th', root).forEach(x => x.classList.toggle('on', +x.dataset.pg === cur)); };
  if (IV.ro) IV.ro.disconnect(); IV.ro = new ResizeObserver(applyZ); IV.ro.observe(cv); applyZ();
}
window.Modules.issued = { render: ivRender, destroy() { if (IV.ro) IV.ro.disconnect(); IV.ro = null; } };


/* shared with c_templates.js (the template builder) */
A.cx = Object.assign(A.cx || {}, { M11F, DBV, catOf, variantsOf, variantOf, refOf, vStatus, SM, NN, ACCENTS, CAT, LIME, NAVY, PW, TL, TPLS, blkLabel, buildPages, changeText, choices, claimHits, claimMark, clone, ensure, fontOpts, histAt, qualityList, snapNow, tname, tpl });
