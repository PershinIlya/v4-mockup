/* Module D (agent J1): pages of the clinic around the measurement workspace.
   - Settings: users, the access matrix by role with "view as" (D3; the assistant role is an open
     question), support access, the first-day demo switch (D4), data, report service, export, hosting.
   - Upload: a new recording or an earlier one uploaded later (B5: recording date, the V3 report and its
     numbers are not imported, reprocessing queued, processing, done), three upload errors (B6), the
     recording conditions documented at upload (D5) and the consent for the measurement (3.6).
   - APP.newPatient(): the new-patient form that shows the separate identity store (D3).
   The earlier recording of MOCK-042 is M0 (case.measurements[2]); it becomes available to the
   comparison through APP.state.earlier of MOCK-042 (see APP.measurements in the shell). */
const A = window.APP, T = A.t, esc = A.esc;
const q1 = (s, el = document) => el.querySelector(s), qa = (s, el = document) => [...el.querySelectorAll(s)];
A.addI18n({
  en: {
    'd.set.title': 'Settings', 'd.th.perm': 'Permissions', 'd.th.2fa': 'Two-factor login', 'd.on': 'on', 'd.u.c1': 'Licensed psychologist', 'd.u.c2': 'Physician',
    'd.p.admin': 'clinic administrator', 'd.invite': 'Invite a clinician', 'd.adminOnly': 'Needs the clinic administrator permission',
    'd.inv.title': 'Invite a clinician', 'd.inv.mail': 'E-mail address', 'd.inv.ph': 'clinician3@clinic-c.example', 'd.inv.qual': 'Qualification', 'd.inv.psy': 'Licensed psychologist or neuropsychologist', 'd.inv.phys': 'Physician',
    'd.inv.adm': 'Also give the clinic administrator permission', 'd.inv.note': 'The invitation is valid for 72 hours. Two-factor login is set up at the first sign-in.', 'd.inv.ok': 'Send invitation',
    'd.inv.sent': 'invited', 'd.inv.first': 'set up at the first sign-in',
    'd.log.inv': 'Invited a clinician (demo, no e-mail sent)', 'd.toast.inv': 'Invitation prepared (demo: no e-mail is sent)', 'd.inv.err': 'Enter an e-mail address',
    'd.mx.title': 'Access by role', 'd.mx.viewAs': 'View as', 'd.mx.what': 'What', 'd.mx.legend': 'Legend',
    'd.mx.col.clin': 'Clinician', 'd.mx.col.clinS': 'physician, licensed psychologist', 'd.mx.col.admin': 'Clinic administrator', 'd.mx.col.adminS': 'a permission of a clinician',
    'd.mx.col.asst': 'Assistant', 'd.mx.col.asstS': 'open question', 'd.mx.col.staff': 'Company staff', 'd.mx.col.staffS': 'no patient data by default',
    'd.mx.r.cases': 'Open the cases of the clinic', 'd.mx.r.names': 'See names, birth dates and free text', 'd.mx.r.upload': 'Upload recordings, document recording conditions',
    'd.mx.r.review': 'Review segments, cleaning, markers and peaks', 'd.mx.r.issue': 'Write and issue reports', 'd.mx.r.anam': 'Write the anamnesis',
    'd.mx.r.log': 'See the activity log of the clinic', 'd.mx.r.users': 'Manage users and permissions', 'd.mx.r.grant': 'Grant time-limited support access',
    'd.mx.r.tpl': 'Report templates', 'd.mx.r.service': 'Prepare reports for the clinic (report service)',
    'd.mx.y': 'Yes', 'd.mx.n': 'No', 'd.mx.open': 'open', 'd.mx.grant': "with the clinic's grant, read only", 'd.mx.hidden': 'no, also not with a grant',
    'd.mx.off': 'built in, switched off', 'd.mx.req': 'sets up on request', 'd.mx.reqC': 'request a change', 'd.mx.py': 'proposal: yes', 'd.mx.pn': 'proposal: no',
    'd.mx.note': 'Roles are sets of permissions. One person may hold several and belong to several clinics. Two-factor login for everyone.',
    'd.mx.asstNote': 'Assistant: not in the core; it can be added later by configuration. The proposals in this column are for discussion only.',
    'd.grantOff': 'Only the clinic administrator grants support access',
    'd.demo.title': 'Demo', 'd.demo.empty': 'First day of a new clinic', 'd.demo.emptyS': 'Shows Clinic C on its first day: no patients, nothing moved over from V3.',
    'd.toast.empty1': 'Demo: first day of a new clinic', 'd.toast.empty0': 'Demo: back to Clinic C with its patients', 'd.mockCtl': 'demo control',
    /* upload */
    'd.up.new': 'New recording', 'd.up.earlier': 'Earlier recording', 'd.up.modeAria': 'Kind of upload',
    'd.up.earlyBan': 'Earlier recording', 'd.up.earlyText': 'V4 processes it again with the current software and norms. The V3 report and its numbers are not imported.',
    'd.up.only042': 'In this mockup only MOCK-042 has an earlier recording.',
    'd.up.newPatOpt': 'New patient…', 'd.up.noPat': 'No patients yet', 'd.up.choosePat': 'Choose a patient', 'd.up.ageAt': '{age} years at the recording date',
    'd.up.ageNow': '{age} years', 'd.up.file': 'File', 'd.up.demoFile': 'Demo file',
    'd.up.f.ok': 'mock_recording_043.eeg · {mb} MB', 'd.up.f.old': 'mock_recording_042_2025-09-23.eeg · {mb} MB', 'd.up.f.pdf': 'mock_v3_report.pdf · {mb} MB',
    'd.up.f.dup': 'mock_recording_042_0915.eeg · {mb} MB', 'd.up.f.ch': 'mock_recording_17ch.eeg · {mb} MB',
    'd.up.fk.ok': 'valid', 'd.up.fk.pdf': 'error: not a recording', 'd.up.fk.dup': 'error: already uploaded', 'd.up.fk.ch': 'error: channels missing',
    'd.up.read': 'Read from the file', 'd.up.recDate': 'Recording date', 'd.up.recDateEarly': 'Recording date of the earlier recording',
    'd.up.dateOrder': 'Before the latest measurement ({d}): shown as an earlier measurement', 'd.up.chosen': 'Chosen file', 'd.up.other': 'Choose another file',
    'd.up.rcTitle': '3 · Recording conditions', 'd.up.rcEarly': 'Earlier recording: fill in only what was documented at the time.', 'd.up.notDoc': 'Not documented',
    'd.up.go': 'Upload and process', 'd.up.goEarly': 'Upload and process again', 'd.up.needFile': 'Choose the recording file first', 'd.up.needPat': 'Choose a patient first',
    'd.up.prog': '4 · Upload and processing', 'd.up.idle': 'Waiting for the file.', 'd.up.uploading': 'Uploading {pct}', 'd.up.queued': 'Queued: waits for a free processing slot',
    'd.up.processing': 'Processing again, step {n} of 9: {s}', 'd.up.procNew': 'Processing, step {n} of 9: {s}',
    'd.up.doneEarly': 'Processed again in {dur} (shortened for the mockup). Available for comparison.', 'd.up.doneNew': 'Done in 6 min 40 s (shortened for the mockup).',
    'd.up.doneNoData': 'Done (demo: no results are modelled for new patients).', 'd.up.openCmp': 'Open comparison', 'd.up.openPat': 'Patient page', 'd.up.openMeas': 'Open measurement', 'd.up.again': 'Upload another',
    'd.st.q': 'Queued', 'd.st.p': 'Processing', 'd.st.d': 'Done',
    'd.err.title': 'Upload not accepted', 'd.err.pdf': 'Not a recording file: {file} is a PDF document. V4 reads the recording file of the amplifier (WinEEG file of the Mitsar amplifier). Reports from V3 are not imported.',
    'd.err.dup': 'Already in V4: this recording is the measurement of {d} of {code} (same input checksum {sha}…). Nothing was added.',
    'd.err.ch': 'Incomplete recording: 17 of 19 channels, T5 and T6 missing. V4 analyses complete recordings of the 19 channels of the 10-20 system only.',
    'd.err.dupEarly': 'Already in V4: the earlier recording of {d} of {code} was uploaded on {up} (same input checksum {sha}…). Nothing was added.',
    'd.err.step': 'Stopped at step 1 of 9 (read file)', 'd.err.at': 'Checked in the browser before the upload',
    'd.log.err': 'Upload not accepted: {file} ({why})', 'd.why.pdf': 'not a recording file', 'd.why.dup': 'already uploaded', 'd.why.ch': 'channels missing',
    'd.log.upEarly': 'Uploaded the earlier recording of {d} for {code}; the V3 report and its numbers are not imported', 'd.log.rc': 'Documented the recording conditions at upload ({n} of 4 fields)',
    'd.log.queued': 'Queued the earlier recording of {d} of {code} for processing again', 'd.log.reproc': 'Processed the earlier recording of {d} of {code} again with V4 mockup 0.1 and Mock norms 2026.1 in {dur}',
    'd.toast.reproc': 'Earlier recording of {d} processed again: available for comparison', 'd.log.upNew': 'Uploaded a new recording for {code} (demo)',
    'd.noUpload': 'Company support cannot upload recordings.',
    /* new patient */
    'd.np.title': 'New patient', 'd.np.id': 'Identity store (clinic key)', 'd.np.idS': "Encrypted with the clinic's key: names, birth dates, original files, free text and PDFs.",
    'd.np.an': 'Analysis (case code)', 'd.np.anS': 'No name: a case code, the age and the sex.', 'd.np.name': 'Name', 'd.np.born': 'Birth date', 'd.np.code': 'Case code', 'd.np.age': 'Age',
    'd.np.sex': 'Sex', 'd.np.F': 'female', 'd.np.M': 'male', 'd.np.mock': 'Mockup: enter synthetic data only.', 'd.np.ok': 'Create patient', 'd.np.errName': 'Enter a name',
    'd.np.errBorn': 'Enter a birth date that is not in the future', 'd.np.years': '{n} years today',
    'd.log.np': 'Created patient {code}: name and birth date in the identity store, age and sex for the analysis', 'd.toast.np': '{code} created',
  },
  de: {
    'd.set.title': 'Einstellungen', 'd.th.perm': 'Berechtigungen', 'd.th.2fa': 'Zwei-Faktor-Anmeldung', 'd.on': 'an', 'd.u.c1': 'Zugelassener Psychologe', 'd.u.c2': 'Arzt',
    'd.p.admin': 'Klinikadministration', 'd.invite': 'Untersucherin oder Untersucher einladen', 'd.adminOnly': 'Erfordert die Berechtigung der Klinikadministration',
    'd.inv.title': 'Untersucherin oder Untersucher einladen', 'd.inv.mail': 'E-Mail-Adresse', 'd.inv.ph': 'clinician3@clinic-c.example', 'd.inv.qual': 'Qualifikation', 'd.inv.psy': 'Zugelassener Psychologe oder Neuropsychologe', 'd.inv.phys': 'Arzt',
    'd.inv.adm': 'Auch die Berechtigung der Klinikadministration geben', 'd.inv.note': 'Die Einladung gilt 72 Stunden. Die Zwei-Faktor-Anmeldung wird bei der ersten Anmeldung eingerichtet.', 'd.inv.ok': 'Einladung senden',
    'd.inv.sent': 'eingeladen', 'd.inv.first': 'bei der ersten Anmeldung eingerichtet',
    'd.log.inv': 'Untersucherin oder Untersucher eingeladen (Demo, keine E-Mail gesendet)', 'd.toast.inv': 'Einladung vorbereitet (Demo: es wird keine E-Mail gesendet)', 'd.inv.err': 'E-Mail-Adresse eingeben',
    'd.mx.title': 'Zugriff nach Rolle', 'd.mx.viewAs': 'Ansehen als', 'd.mx.what': 'Was', 'd.mx.legend': 'Legende',
    'd.mx.col.clin': 'Untersucher', 'd.mx.col.clinS': 'Arzt, zugelassener Psychologe', 'd.mx.col.admin': 'Klinikadministration', 'd.mx.col.adminS': 'eine Berechtigung einer Untersucherin oder eines Untersuchers',
    'd.mx.col.asst': 'Assistenz', 'd.mx.col.asstS': 'offene Frage', 'd.mx.col.staff': 'Herstellerpersonal', 'd.mx.col.staffS': 'standardmäßig keine Patientendaten',
    'd.mx.r.cases': 'Fälle der Klinik öffnen', 'd.mx.r.names': 'Namen, Geburtsdaten und Freitext sehen', 'd.mx.r.upload': 'Aufnahmen hochladen, Aufnahmebedingungen dokumentieren',
    'd.mx.r.review': 'Segmente, Bereinigung, Marker und Peaks prüfen', 'd.mx.r.issue': 'Berichte schreiben und freigeben', 'd.mx.r.anam': 'Anamnese schreiben',
    'd.mx.r.log': 'Aktivitätsprotokoll der Klinik sehen', 'd.mx.r.users': 'Benutzer und Berechtigungen verwalten', 'd.mx.r.grant': 'Befristeten Supportzugriff gewähren',
    'd.mx.r.tpl': 'Berichtsvorlagen', 'd.mx.r.service': 'Berichte für die Klinik erstellen (Berichtsservice)',
    'd.mx.y': 'Ja', 'd.mx.n': 'Nein', 'd.mx.open': 'offen', 'd.mx.grant': 'mit Freigabe der Klinik, schreibgeschützt', 'd.mx.hidden': 'nein, auch nicht mit Freigabe',
    'd.mx.off': 'eingebaut, ausgeschaltet', 'd.mx.req': 'richtet auf Anfrage ein', 'd.mx.reqC': 'Änderung anfragen', 'd.mx.py': 'Vorschlag: ja', 'd.mx.pn': 'Vorschlag: nein',
    'd.mx.note': 'Rollen sind Sätze von Berechtigungen. Eine Person kann mehrere haben und zu mehreren Kliniken gehören. Zwei-Faktor-Anmeldung für alle.',
    'd.mx.asstNote': 'Assistenz: nicht im Kern; kann später per Konfiguration ergänzt werden. Die Vorschläge in dieser Spalte dienen nur der Diskussion.',
    'd.grantOff': 'Nur die Klinikadministration gewährt Supportzugriff',
    'd.demo.title': 'Demo', 'd.demo.empty': 'Erster Tag einer neuen Klinik', 'd.demo.emptyS': 'Zeigt Klinik C an ihrem ersten Tag: keine Patienten, nichts aus V3 übernommen.',
    'd.toast.empty1': 'Demo: erster Tag einer neuen Klinik', 'd.toast.empty0': 'Demo: zurück zu Klinik C mit ihren Patienten', 'd.mockCtl': 'Demo-Schalter',
    'd.up.new': 'Neue Aufnahme', 'd.up.earlier': 'Frühere Aufnahme', 'd.up.modeAria': 'Art des Uploads',
    'd.up.earlyBan': 'Frühere Aufnahme', 'd.up.earlyText': 'V4 verarbeitet sie mit der aktuellen Software und den aktuellen Normdaten neu. Der V3-Bericht und seine Zahlen werden nicht übernommen.',
    'd.up.only042': 'In diesem Mockup hat nur MOCK-042 eine frühere Aufnahme.',
    'd.up.newPatOpt': 'Neuer Patient…', 'd.up.noPat': 'Noch keine Patienten', 'd.up.choosePat': 'Patient auswählen', 'd.up.ageAt': '{age} Jahre am Aufnahmedatum',
    'd.up.ageNow': '{age} Jahre', 'd.up.file': 'Datei', 'd.up.demoFile': 'Demo-Datei',
    'd.up.f.ok': 'mock_recording_043.eeg · {mb} MB', 'd.up.f.old': 'mock_recording_042_2025-09-23.eeg · {mb} MB', 'd.up.f.pdf': 'mock_v3_report.pdf · {mb} MB',
    'd.up.f.dup': 'mock_recording_042_0915.eeg · {mb} MB', 'd.up.f.ch': 'mock_recording_17ch.eeg · {mb} MB',
    'd.up.fk.ok': 'gültig', 'd.up.fk.pdf': 'Fehler: keine Aufnahme', 'd.up.fk.dup': 'Fehler: bereits hochgeladen', 'd.up.fk.ch': 'Fehler: Kanäle fehlen',
    'd.up.read': 'Aus der Datei gelesen', 'd.up.recDate': 'Aufnahmedatum', 'd.up.recDateEarly': 'Aufnahmedatum der früheren Aufnahme',
    'd.up.dateOrder': 'Vor der letzten Messung ({d}): erscheint als frühere Messung', 'd.up.chosen': 'Gewählte Datei', 'd.up.other': 'Andere Datei wählen',
    'd.up.rcTitle': '3 · Aufnahmebedingungen', 'd.up.rcEarly': 'Frühere Aufnahme: nur ausfüllen, was damals dokumentiert wurde.', 'd.up.notDoc': 'Nicht dokumentiert',
    'd.up.go': 'Hochladen und verarbeiten', 'd.up.goEarly': 'Hochladen und neu verarbeiten', 'd.up.needFile': 'Zuerst die Aufnahmedatei wählen', 'd.up.needPat': 'Zuerst einen Patienten wählen',
    'd.up.prog': '4 · Upload und Verarbeitung', 'd.up.idle': 'Wartet auf die Datei.', 'd.up.uploading': 'Upload {pct}', 'd.up.queued': 'In der Warteschlange: wartet auf einen freien Verarbeitungsplatz',
    'd.up.processing': 'Neuverarbeitung, Schritt {n} von 9: {s}', 'd.up.procNew': 'Verarbeitung, Schritt {n} von 9: {s}',
    'd.up.doneEarly': 'In {dur} neu verarbeitet (für das Mockup verkürzt). Für den Vergleich verfügbar.', 'd.up.doneNew': 'Fertig in 6 min 40 s (für das Mockup verkürzt).',
    'd.up.doneNoData': 'Fertig (Demo: für neue Patienten sind keine Ergebnisse modelliert).', 'd.up.openCmp': 'Vergleich öffnen', 'd.up.openPat': 'Patientenseite', 'd.up.openMeas': 'Messung öffnen', 'd.up.again': 'Weitere hochladen',
    'd.st.q': 'Warteschlange', 'd.st.p': 'Verarbeitung', 'd.st.d': 'Fertig',
    'd.err.title': 'Upload nicht angenommen', 'd.err.pdf': 'Keine Aufnahmedatei: {file} ist ein PDF-Dokument. V4 liest die Aufnahmedatei des Verstärkers (WinEEG-Datei des Mitsar-Verstärkers). Berichte aus V3 werden nicht übernommen.',
    'd.err.dup': 'Bereits in V4: Diese Aufnahme ist die Messung vom {d} von {code} (gleiche Prüfsumme der Eingabe {sha}…). Nichts wurde hinzugefügt.',
    'd.err.ch': 'Unvollständige Aufnahme: 17 von 19 Kanälen, T5 und T6 fehlen. V4 wertet nur vollständige Aufnahmen der 19 Kanäle des 10-20-Systems aus.',
    'd.err.dupEarly': 'Bereits in V4: Die frühere Aufnahme vom {d} von {code} wurde am {up} hochgeladen (gleiche Prüfsumme der Eingabe {sha}…). Nichts wurde hinzugefügt.',
    'd.err.step': 'Angehalten bei Schritt 1 von 9 (Datei lesen)', 'd.err.at': 'Vor dem Upload im Browser geprüft',
    'd.log.err': 'Upload nicht angenommen: {file} ({why})', 'd.why.pdf': 'keine Aufnahmedatei', 'd.why.dup': 'bereits hochgeladen', 'd.why.ch': 'Kanäle fehlen',
    'd.log.upEarly': 'Frühere Aufnahme vom {d} für {code} hochgeladen; der V3-Bericht und seine Zahlen werden nicht übernommen', 'd.log.rc': 'Aufnahmebedingungen beim Hochladen dokumentiert ({n} von 4 Feldern)',
    'd.log.queued': 'Frühere Aufnahme vom {d} von {code} zur Neuverarbeitung eingereiht', 'd.log.reproc': 'Frühere Aufnahme vom {d} von {code} mit V4 mockup 0.1 und Mock norms 2026.1 in {dur} neu verarbeitet',
    'd.toast.reproc': 'Frühere Aufnahme vom {d} neu verarbeitet: für den Vergleich verfügbar', 'd.log.upNew': 'Neue Aufnahme für {code} hochgeladen (Demo)',
    'd.noUpload': 'Der Herstellersupport kann keine Aufnahmen hochladen.',
    'd.np.title': 'Neuer Patient', 'd.np.id': 'Identitätsspeicher (Schlüssel der Klinik)', 'd.np.idS': 'Mit dem Schlüssel der Klinik verschlüsselt: Namen, Geburtsdaten, Originaldateien, Freitext und PDFs.',
    'd.np.an': 'Auswertung (Fallnummer)', 'd.np.anS': 'Keinen Namen: eine Fallnummer, das Alter und das Geschlecht.', 'd.np.name': 'Name', 'd.np.born': 'Geburtsdatum', 'd.np.code': 'Fallnummer', 'd.np.age': 'Alter',
    'd.np.sex': 'Geschlecht', 'd.np.F': 'weiblich', 'd.np.M': 'männlich', 'd.np.mock': 'Mockup: nur synthetische Daten eingeben.', 'd.np.ok': 'Patient anlegen', 'd.np.errName': 'Einen Namen eingeben',
    'd.np.errBorn': 'Ein Geburtsdatum eingeben, das nicht in der Zukunft liegt', 'd.np.years': 'heute {n} Jahre',
    'd.log.np': 'Patient {code} angelegt: Name und Geburtsdatum im Identitätsspeicher, Alter und Geschlecht für die Auswertung', 'd.toast.np': '{code} angelegt',
  },
});
/* strings of the last round (agent H): users and permissions (A15), support grants (A2), intended use (B5),
   proposals (A14), demo controls (C4, D4), upload wording (A1, C20, C27, B9) */
A.addI18n({
  en: {
    'd.um.title': 'Users and permissions of Clinic C', 'd.um.clin': 'Clinician', 'd.um.admin': 'Clinic administrator', 'd.um.staff': 'Company staff', 'd.um.grant': 'Support grant', 'd.um.service': 'Report service',
    'd.um.qual': 'Qualification', 'd.um.asstRow': 'Not in the core; can be added later by configuration (N10)', 'd.um.supRow': 'Company support, S1', 'd.um.supQ': 'company staff, no patient data by default',
    'd.um.active': 'active until {until}', 'd.um.noGrant': 'no active grant', 'd.um.off': 'off', 'd.um.note': 'The role switcher in the avatar menu switches between these accounts (demo).',
    'd.gr.title': 'Grant support access', 'd.gr.scope': 'Scope', 'd.gr.clinic': 'The whole clinic', 'd.gr.cases': 'Chosen cases', 'd.gr.hours': 'Duration', 'd.gr.h': '{n} hours',
    'd.gr.reason': 'Reason', 'd.gr.reasonPh': 'Synthetic text only, for example: export of a report did not start', 'd.gr.to': 'Company support, S1', 'd.gr.who': 'Granted to', 'd.gr.ends': 'Ends',
    'd.gr.ok': 'Grant access', 'd.gr.errReason': 'Give a reason', 'd.gr.errCases': 'Choose at least one case', 'd.gr.list': 'Grants', 'd.gr.none': 'No grants yet.',
    'd.gr.revoke': 'Revoke', 'd.gr.st.on': 'active', 'd.gr.st.rev': 'revoked {at}', 'd.gr.st.end': 'ended', 'd.gr.by': 'by {who}',
    'd.prop': 'proposal', 'd.iu.title': 'Intended use (draft)', 'd.iu.chip': 'To confirm: the clinical lead',
    'd.iu.purpose': 'Purpose', 'd.iu.purposeV': 'Supports a clinician in assessing EEG, ERP, task and questionnaire measures: the measured values are compared with age norms and restated in fixed sentences. It does not diagnose and names no condition.',
    'd.iu.users': 'Users', 'd.iu.usersV': 'Physicians and licensed psychologists or neuropsychologists; whether other groups are added is open.',
    'd.iu.pop': 'Patients', 'd.iu.popV': 'General clinical use. The age range follows from the usable norm data; outside it there is no comparison.',
    'd.iu.warn': 'Warnings', 'd.iu.warnV': 'The clinician reviews the raw EEG, the segments and the cleaning before using the results. Below a data quality minimum a condition gives no comparison. The report is final only when the clinician issues it.',
    'd.demo.prelim': 'Results before the review', 'd.demo.prelimShow': 'Show, marked preliminary', 'd.demo.prelimHide': 'Hide until segments and cleaning are confirmed',
    'd.demo.prelimS': 'Two options for the meeting (review C4). With "show", the log names the result set on screen at each choice.',
    'd.demo.restore': 'Restore deleted patients', 'd.demo.restoreS': 'Brings back the patients deleted in this session.', 'd.toast.restore': 'Deleted patients restored (demo)',
    'd.data.delete': 'Delete patient data', 'd.data.deleteV': 'On the patient page, with the clinic administrator permission. Identity entries, files, results and PDFs are deleted; the activity log keeps its entries without identity.',
    'd.data.consent': 'Consent withdrawal', 'd.data.consentV': 'Per measurement and purpose, on the patient page; logged.',
    'd.up.sysV': 'Task software: {sw} · file: {file}', 'd.up.deid': 'Header identity removed from the working copy; the original file is kept in the identity store.',
    'd.up.normV2': 'Mock norms 2026.1 (synthetic)', 'd.up.normR': 'mock range {lo} to {hi} years; the real range follows from the usable norm data (3.2, to confirm)',
    'd.up.normOut2': 'outside the mock norm range ({lo} to {hi} years): values without z', 'd.np.out2': 'Outside the mock norm range ({lo} to {hi} years): results without z',
  },
  de: {
    'd.um.title': 'Benutzer und Berechtigungen von Klinik C', 'd.um.clin': 'Untersucher', 'd.um.admin': 'Klinikadministration', 'd.um.staff': 'Herstellerpersonal', 'd.um.grant': 'Supportfreigabe', 'd.um.service': 'Berichtsservice',
    'd.um.qual': 'Qualifikation', 'd.um.asstRow': 'Nicht im Kern; kann später per Konfiguration ergänzt werden (N10)', 'd.um.supRow': 'Herstellersupport, S1', 'd.um.supQ': 'Herstellerpersonal, standardmäßig keine Patientendaten',
    'd.um.active': 'aktiv bis {until}', 'd.um.noGrant': 'keine aktive Freigabe', 'd.um.off': 'aus', 'd.um.note': 'Der Rollenwechsel im Avatar-Menü wechselt zwischen diesen Konten (Demo).',
    'd.gr.title': 'Supportzugriff gewähren', 'd.gr.scope': 'Umfang', 'd.gr.clinic': 'Die ganze Klinik', 'd.gr.cases': 'Ausgewählte Fälle', 'd.gr.hours': 'Dauer', 'd.gr.h': '{n} Stunden',
    'd.gr.reason': 'Grund', 'd.gr.reasonPh': 'Nur synthetischer Text, zum Beispiel: Export eines Berichts startet nicht', 'd.gr.to': 'Herstellersupport, S1', 'd.gr.who': 'Gewährt für', 'd.gr.ends': 'Endet',
    'd.gr.ok': 'Zugriff gewähren', 'd.gr.errReason': 'Einen Grund angeben', 'd.gr.errCases': 'Mindestens einen Fall auswählen', 'd.gr.list': 'Freigaben', 'd.gr.none': 'Noch keine Freigaben.',
    'd.gr.revoke': 'Widerrufen', 'd.gr.st.on': 'aktiv', 'd.gr.st.rev': 'widerrufen am {at}', 'd.gr.st.end': 'abgelaufen', 'd.gr.by': 'von {who}',
    'd.prop': 'Vorschlag', 'd.iu.title': 'Zweckbestimmung (Entwurf)', 'd.iu.chip': 'Zu bestätigen: die klinische Leitung',
    'd.iu.purpose': 'Zweck', 'd.iu.purposeV': 'Unterstützt Untersucherinnen und Untersucher bei der Beurteilung von EEG-, ERP-, Aufgaben- und Fragebogenwerten: Die Messwerte werden mit Altersnormdaten verglichen und in festen Sätzen wiedergegeben. Das System stellt keine Diagnose.',
    'd.iu.users': 'Anwender', 'd.iu.usersV': 'Ärztinnen und Ärzte sowie zugelassene Psychologinnen und Psychologen oder Neuropsychologinnen und Neuropsychologen; ob weitere Gruppen hinzukommen, ist offen.',
    'd.iu.pop': 'Patienten', 'd.iu.popV': 'Allgemeiner klinischer Einsatz. Der Altersbereich ergibt sich aus den verwendbaren Normdaten; außerhalb gibt es keinen Vergleich.',
    'd.iu.warn': 'Warnhinweise', 'd.iu.warnV': 'Die Untersucherin oder der Untersucher prüft das Roh-EEG, die Segmente und die Bereinigung, bevor die Ergebnisse verwendet werden. Unter einem Mindestmaß an Datenqualität gibt eine Bedingung keinen Vergleich. Der Bericht ist erst mit der Freigabe endgültig.',
    'd.demo.prelim': 'Ergebnisse vor der Prüfung', 'd.demo.prelimShow': 'Zeigen, als vorläufig markiert', 'd.demo.prelimHide': 'Verbergen, bis Segmente und Bereinigung bestätigt sind',
    'd.demo.prelimS': 'Zwei Optionen für das Treffen (Review C4). Bei "Zeigen" nennt das Protokoll bei jeder Entscheidung den angezeigten Ergebnissatz.',
    'd.demo.restore': 'Gelöschte Patienten wiederherstellen', 'd.demo.restoreS': 'Holt die in dieser Sitzung gelöschten Patienten zurück.', 'd.toast.restore': 'Gelöschte Patienten wiederhergestellt (Demo)',
    'd.data.delete': 'Patientendaten löschen', 'd.data.deleteV': 'Auf der Patientenseite, mit der Berechtigung der Klinikadministration. Identitätseinträge, Dateien, Ergebnisse und PDFs werden gelöscht; das Aktivitätsprotokoll behält seine Einträge ohne Identität.',
    'd.data.consent': 'Widerruf der Einwilligung', 'd.data.consentV': 'Je Messung und Zweck, auf der Patientenseite; wird protokolliert.',
    'd.up.sysV': 'Aufgabensoftware: {sw} · Datei: {file}', 'd.up.deid': 'Identität aus dem Dateikopf der Arbeitskopie entfernt; die Originaldatei bleibt im Identitätsspeicher.',
    'd.up.normV2': 'Mock norms 2026.1 (synthetisch)', 'd.up.normR': 'Mock-Bereich {lo} bis {hi} Jahre; der echte Bereich ergibt sich aus den verwendbaren Normdaten (3.2, zu bestätigen)',
    'd.up.normOut2': 'außerhalb des Mock-Normbereichs ({lo} bis {hi} Jahre): Werte ohne z', 'd.np.out2': 'Außerhalb des Mock-Normbereichs ({lo} bis {hi} Jahre): Ergebnisse ohne z',
  },
});
A.css('d-admin', `
.d-mx th, .d-mx td { vertical-align: top; }
.d-mx th.d-col { min-width: 128px; white-space: normal; } .d-mx th.d-col b { display: block; color: var(--ink); font-size: 12.5px; font-weight: 700; }
.d-mx th.d-col.on, .d-mx td.on { background: var(--brand-soft); }
.d-mx td.d-what { min-width: 220px; }
.d-viewas { flex-wrap: wrap; max-width: 100%; } .d-viewas button { flex: 1 0 auto; }
.d-y { color: var(--ok); font-weight: 700; } .d-n { color: var(--muted); }
.d-py { border: 1px dashed var(--amber); color: var(--amber); background: none; }
.d-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; font-size: 12px; color: var(--muted); }
.d-switch { display: flex; gap: 10px; align-items: flex-start; } .d-switch input { margin-top: 3px; width: 16px; height: 16px; flex: none; }
.d-upgrid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); align-items: start; } .d-upcol { gap: 16px; align-content: start; }
@media (max-width: 980px) { .d-upgrid { grid-template-columns: minmax(0, 1fr); } }
.d-up-files { display: grid; gap: 4px; } .d-up-files label { display: flex; gap: 8px; align-items: center; font-size: 12.5px; padding: 4px 6px; border-radius: 5px; }
.d-up-files label:hover { background: var(--surface-2); } .d-up-files .mono { font-size: 12px; overflow-wrap: anywhere; }
.d-drop { border: 2px dashed var(--line-2); background: var(--surface-2); color: var(--muted); padding: 22px; text-align: center; border-radius: 8px; }
.d-drop.over { border-color: var(--accent); background: var(--accent-soft); }
.d-file { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-2); }
.d-file .mono { overflow-wrap: anywhere; min-width: 0; }
.d-bar { height: 6px; background: var(--line); border-radius: 99px; overflow: hidden; } .d-bar > div { height: 100%; width: 0; background: var(--accent); transition: width .2s; }
.d-steps { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 4px 14px; font-size: 12.5px; }
.d-steps li { display: flex; gap: 6px; align-items: baseline; color: var(--muted); } .d-steps li.done { color: var(--ink-2); } .d-steps li.now { color: var(--amber); font-weight: 600; }
.d-steps li .i { width: 14px; flex: none; text-align: center; } .d-steps li.err { color: var(--warn); font-weight: 600; }
.d-phase { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px; }
.d-phase span { padding: 2px 9px; border-radius: 99px; border: 1px solid var(--line); color: var(--muted); background: var(--surface-2); }
.d-phase span.on { color: var(--amber); background: var(--amber-soft); border-color: transparent; font-weight: 600; } .d-phase span.done { color: var(--brand-ink); background: var(--brand-soft); border-color: transparent; }
.d-phase i { color: var(--line-2); font-style: normal; }
.d-rc { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.d-rc .row input[type=time] { border: 1px solid var(--line-2); background: var(--surface); border-radius: 5px; padding: 4px 8px; font-size: 12.5px; }
.d-np { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.d-np section { border-radius: 8px; padding: 10px 12px; display: grid; gap: 8px; align-content: start; }
.d-np .d-id { background: var(--clinic); border: 1px solid transparent; } .d-np .d-id h3 { color: var(--clinic-ink); }
.d-np .d-an { background: var(--device); } .d-np .d-an h3 { color: var(--device-ink); }
.d-np p { margin: 0; } .d-np .field input, .d-np .field select { font-size: 13px; padding: 5px 8px; }
.d-err { color: var(--warn); font-size: 12px; min-height: 16px; }
.d-um td, .d-um th { white-space: normal; } .d-um tr.d-grey td { color: var(--muted); background: var(--surface-2); } .d-um td:nth-child(n+3) { text-align: center; } .d-um th:nth-child(n+3) { text-align: center; }
.d-fs { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; margin: 0; display: grid; gap: 4px; } .d-fs legend { font-size: 12px; color: var(--muted); padding: 0 4px; }
.d-grcases { display: flex; flex-wrap: wrap; gap: 4px 14px; padding-left: 22px; }
.d-sysv { font-size: 12px; color: var(--muted); }
`);
/* ---------------- settings ---------------- */
const isAdmin = () => A.can('admin');
/* access matrix (D3): one row per action, one column per role; cell codes: y yes, n no, py/pn a proposal
   for the open assistant role, grant only with the clinic's grant, hidden never, off built in but off,
   req the company sets up on request, reqC request a change. Sources: 3.6, N10 (agreed), Q9, 3.5. */
const COLS = ['clin', 'admin', 'asst', 'staff'];
const ROLE_COL = { c1: ['clin', 'admin'], c2: ['clin'], asst: ['asst'], support: ['staff'] };
const MX = [
  ['cases', 'y', 'y', 'py', 'grant', '3.6 Who sees what: company staff only with a time-limited grant, logged'],
  ['names', 'y', 'y', 'py', 'hidden', '3.6: names appear only for the treating clinic'],
  ['upload', 'y', 'y', 'py', 'n', '3.4 Browser only'],
  ['review', 'y', 'y', 'pn', 'n', '3.4 Clinician in control'],
  ['issue', 'y', 'y', 'pn', 'n', '3.5 A report is final when the clinician issues it'],
  ['anam', 'y', 'y', 'pn', 'n', '3.5 The clinician writes the anamnesis'],
  ['log', 'y', 'y', 'pn', 'n', 'Mockup assumption: clinicians see the activity log of their clinic'],
  ['tpl', 'reqC', 'reqC', 'n', 'req', '3.5 In the first release the company sets up the templates on request'],
  ['users', 'n', 'y', 'n', 'n', 'N10: clinic administrator permission given to the first clinician'],
  ['grant', 'n', 'y', 'n', 'n', '3.6 The clinic grants time-limited access'],
  ['service', 'n', 'n', 'n', 'off', 'Q9 proposal (a), N10: a separate permission, built in, switched off'],
];
const cell = (v) => ({ y: `<span class="d-y">✓ ${esc(T('d.mx.y'))}</span>`, n: `<span class="d-n">${esc(T('d.mx.n'))}</span>`, py: `<span class="chip d-py">${esc(T('d.mx.py'))}</span>`, pn: `<span class="chip d-py">${esc(T('d.mx.pn'))}</span>`,
  grant: `<span class="chip amber">${esc(T('d.mx.grant'))}</span>`, hidden: `<span class="d-n">${esc(T('d.mx.hidden'))}</span>`, off: `<span class="chip">${esc(T('d.mx.off'))}</span>`, req: `<span class="chip info">${esc(T('d.mx.req'))}</span>`, reqC: `<span class="d-y">✓ ${esc(T('d.mx.reqC'))}</span>` }[v] || esc(v));
function matrix() {
  const on = ROLE_COL[A.role] || [];
  return `<div class="card" style="grid-column:1/-1" id="dMatrix"><div class="hd"><h2>${esc(T('d.mx.title'))}</h2>
      <div class="row"><span class="xs muted">${esc(T('d.mx.viewAs'))}</span><div class="seg d-viewas" role="group" aria-label="${esc(T('d.mx.viewAs'))}">${A.roles.map(r => `<button data-dviewas="${r}" class="${A.role === r ? 'on' : ''}" aria-pressed="${A.role === r}">${esc(T('rn.' + r))}</button>`).join('')}</div>${A.ann('D3 role switcher; the same switch is in the avatar menu')}</div></div>
    <div class="scroll-x"><table class="tbl d-mx"><tr><th>${esc(T('d.mx.what'))}</th>${COLS.map(c => `<th class="d-col ${on.includes(c) ? 'on' : ''}"><b>${esc(T('d.mx.col.' + c))}</b>${esc(T('d.mx.col.' + c + 'S'))}${c === 'asst' ? ` <span class="chip amber">${esc(T('d.mx.open'))}</span>` : ''}</th>`).join('')}</tr>
      ${MX.map(([k, ...v]) => `<tr><td class="d-what">${esc(T('d.mx.r.' + k))}${A.ann(v[4])}</td>${COLS.map((c, i) => `<td class="${on.includes(c) ? 'on' : ''}">${cell(v[i])}</td>`).join('')}</tr>`).join('')}
    </table></div>
    <div class="bd grid" style="gap:6px"><p class="small" style="margin:0">${esc(T('d.mx.note'))}${A.ann('N10, agreed 23 October')}</p><p class="small" style="margin:0;color:var(--amber)">${esc(T('d.mx.asstNote'))}${A.ann('N10: an assistant role is not in the core; 3.2 Intended use: whether other user groups are added is open')}</p></div></div>`;
}
/* users as rows, permissions as columns (review A15, N10): Clinician 1 holds clinician and clinic
   administrator; the assistant row is greyed (not in the core); company support has no patient data
   unless a support grant is active; the report service is a separate permission, off for everyone */
function usersTable() {
  const g = A.activeGrant(), y = `<span class="d-y">✓</span>`, n = `<span class="d-n">·</span>`, off = `<span class="chip">${esc(T('d.um.off'))}</span>`;
  const row = (name, qual, cols, fa, cls = '') => `<tr class="${cls}"><td><b>${name}</b></td><td class="small">${qual}</td>${cols.map(c => `<td>${c}</td>`).join('')}<td>${fa}</td></tr>`;
  const fa = `<span class="chip ok">${esc(T('d.on'))}</span>`;
  return `<div class="scroll-x"><table class="tbl d-um"><tr><th>${T('th.user')}</th><th>${esc(T('d.um.qual'))}</th><th>${esc(T('d.um.clin'))}</th><th>${esc(T('d.um.admin'))}</th><th>${esc(T('d.um.staff'))}</th><th>${esc(T('d.um.grant'))}</th><th>${esc(T('d.um.service'))}</th><th>${esc(T('d.th.2fa'))}</th></tr>
    ${row(esc(T('who.c1')), esc(T('d.u.c1')), [y, y, n, n, off], fa)}
    ${row(esc(T('who.c2')), esc(T('d.u.c2')), [y, n, n, n, off], fa)}
    ${(A.state.ui.invited || []).map(x => row(`<span class="mono small">${esc(x.mail)}</span> <span class="chip amber">${esc(T('d.inv.sent'))}</span>`, esc(T(x.q)), [y, x.adm ? y : n, n, n, off], `<span class="muted small">${esc(T('d.inv.first'))}</span>`)).join('')}
    ${row(esc(T('who.asst')), esc(T('d.um.asstRow')), [n, n, n, n, off], `<span class="d-n">·</span>`, 'd-grey')}
    ${row(esc(T('d.um.supRow')), esc(T('d.um.supQ')), [n, n, y, g ? `<span class="chip amber">${esc(T('d.um.active', { until: A.atZ(g.ends) }))}</span>` : `<span class="muted small">${esc(T('d.um.noGrant'))}</span>`, off], fa)}
  </table></div>`;
}
function grantList() {
  const L = A.grants();
  if (!L.length) return `<p class="small muted">${esc(T('d.gr.none'))}</p>`;
  return `<div class="scroll-x"><table class="tbl"><tr><th>${esc(T('d.gr.scope'))}</th><th>${esc(T('d.gr.ends'))}</th><th>${esc(T('th.status'))}</th><th></th></tr>${L.map(g => {
    const st = g.revoked ? `<span class="chip">${esc(T('d.gr.st.rev', { at: A.at(g.revoked) }))}</span>` : A.grantOpen(g) ? `<span class="chip amber">${esc(T('d.gr.st.on'))}</span>` : `<span class="chip">${esc(T('d.gr.st.end'))}</span>`;
    return `<tr><td class="small">${esc(A.grantScope(g))}${g.scope === 'cases' ? `<div class="xs muted mono">${esc(g.cases.join(', '))}</div>` : ''}<div class="xs muted">${esc(T('d.gr.by', { who: A.who(g.by) }))}, ${esc(A.atZ(g.at))}</div></td><td class="small num">${esc(A.atZ(g.ends))}</td><td>${st}</td><td>${A.grantOpen(g) && A.can('grant') ? `<button class="btn sm danger" data-revoke="${g.id}">${esc(T('d.gr.revoke'))}</button>` : ''}</td></tr>`; }).join('')}</table></div>`;
}
function grantDialog(root) {
  const cases = A.patients().filter(p => p.full);
  A.dialog({ title: T('d.gr.title'), ok: T('d.gr.ok'),
    body: `<dl class="kv"><dt>${esc(T('d.gr.who'))}</dt><dd>${esc(T('d.gr.to'))}</dd></dl>
      <fieldset class="d-fs"><legend>${esc(T('d.gr.scope'))}</legend><label class="row small"><input type="radio" name="dGrS" value="clinic" checked> ${esc(T('d.gr.clinic'))}</label><label class="row small"><input type="radio" name="dGrS" value="cases"> ${esc(T('d.gr.cases'))}</label>
        <div class="d-grcases">${cases.map(p => `<label class="row small"><input type="checkbox" data-grc="${p.code}" disabled> <span class="mono">${p.code}</span></label>`).join('')}</div></fieldset>
      <div class="field"><span>${esc(T('d.gr.hours'))}</span><select id="dGrH">${[8, 24, 48, 72].map(h => `<option value="${h}" ${h === 24 ? 'selected' : ''}>${esc(T('d.gr.h', { n: h }))}</option>`).join('')}</select></div>
      <div class="field"><span>${esc(T('d.gr.reason'))}</span><textarea id="dGrWhy" rows="2" placeholder="${esc(T('d.gr.reasonPh'))}"></textarea></div><div class="d-err" id="dGrErr"></div>
      <p class="xs muted" style="margin:0">${esc(T('pat.supText', { who: T('who.c1'), scope: '…', until: '…' }))} ${A.ann('3.6 Who sees what: time-limited access granted by the clinic, every access logged; scope, durations and reason are mockup assumptions')}</p>`,
    onOk: (back) => { const sc = q1('input[name=dGrS]:checked', back).value, cs = qa('[data-grc]:checked', back).map(x => x.dataset.grc), why = q1('#dGrWhy', back).value.trim(), err = q1('#dGrErr', back);
      if (sc === 'cases' && !cs.length) { err.textContent = T('d.gr.errCases'); return false; }
      if (!why) { err.textContent = T('d.gr.errReason'); q1('#dGrWhy', back).focus(); return false; }
      const g = A.grantSupport({ scope: sc, cases: cs, hours: +q1('#dGrH', back).value, reason: why });
      if (g) A.toast(T('toast.grant', { until: A.atZ(g.ends) })); settings(root); } });
  const back = document.querySelector('.dlg-back:last-of-type');
  if (back) qa('input[name=dGrS]', back).forEach(r => r.onchange = () => qa('[data-grc]', back).forEach(c => { c.disabled = r.value !== 'cases' || !r.checked; }));
}
function settings(root) {
  const adm = isAdmin(), off = adm ? '' : `disabled title="${esc(T('d.adminOnly'))}"`, prop = `<span class="chip amber">${esc(T('d.prop'))}</span>`, ui = A.state.ui;
  const [lo, hi] = A.normRange();
  root.innerHTML = `<div class="pagehead"><h1>${esc(T('d.set.title'))}</h1></div><div class="grid g2">
    <div class="card" style="grid-column:1/-1"><div class="hd"><h2>${esc(T('d.um.title'))}</h2><div class="row">${A.ann('N10, agreed 23 October: roles are sets of permissions; one clinic role, clinician; the clinic administrator permission goes to the first clinician; company staff have no patient data by default; the report service is a separate permission, off; two-factor login for everyone')}${adm ? `<button class="btn sm" id="dInvite">${esc(T('d.invite'))}</button>` : ''}</div></div>
      ${usersTable()}<div class="bd xs muted">${esc(T('d.um.note'))}</div></div>
    ${matrix()}
    <div class="card" style="grid-column:1/-1"><div class="hd"><h2>${esc(T('set.support'))}</h2><div class="row">${A.ann('3.6 Who sees what: time-limited access granted by the clinic, every access logged')}${A.can('grant') ? `<button class="btn primary sm" id="dGrant">${esc(T('set.grant'))}</button>` : ''}</div></div><div class="bd small"><p style="margin-top:0">${esc(T('set.supText'))}</p>${grantList()}</div></div>
    <div class="card" style="grid-column:1/-1"><div class="hd"><h2>${esc(T('d.iu.title'))}</h2><span class="row"><span class="chip amber">${esc(T('d.iu.chip'))}</span>${A.ann('3.2 Intended use, to confirm: the clinical lead; intended use draft, sections 1 and 5')}</span></div><div class="bd small"><dl class="kv">
      <dt>${esc(T('d.iu.purpose'))}</dt><dd>${esc(T('d.iu.purposeV'))}</dd><dt>${esc(T('d.iu.users'))}</dt><dd>${esc(T('d.iu.usersV'))}</dd>
      <dt>${esc(T('d.iu.pop'))}</dt><dd>${esc(T('d.iu.popV'))} <span class="xs muted">(${esc(T('d.up.normR', { lo, hi }))})</span></dd><dt>${esc(T('d.iu.warn'))}</dt><dd>${esc(T('d.iu.warnV'))}</dd></dl></div></div>
    <div class="card"><div class="hd"><h2>${esc(T('set.lang'))}</h2><div class="seg langcard">${A.langs.map(l => `<button data-uilang="${l}" class="${A.lang === l ? 'on' : ''}" aria-pressed="${A.lang === l}">${l === 'en' ? 'English' : 'Deutsch'}</button>`).join('')}</div></div><div class="bd small">${esc(T('set.langText'))}</div></div>
    <div class="card"><div class="hd"><h2>${esc(T('d.demo.title'))}</h2><span class="row"><span class="chip amber">${esc(T('d.mockCtl'))}</span>${A.ann('D4: first-day state of an empty clinic; 3.4 V4 starts without any patient data')}</span></div><div class="bd small grid" style="gap:12px">
      <label class="d-switch" for="dEmpty"><input type="checkbox" id="dEmpty" ${A.state.empty ? 'checked' : ''}><span><b>${esc(T('d.demo.empty'))}</b><br><span class="muted">${esc(T('d.demo.emptyS'))}</span></span></label>
      <div class="field"><span><b>${esc(T('d.demo.prelim'))}</b></span><div class="seg" role="group" aria-label="${esc(T('d.demo.prelim'))}">${['show', 'hide'].map(m => `<button data-prelim="${m}" class="${(ui.prelimMode || 'show') === m ? 'on' : ''}" aria-pressed="${(ui.prelimMode || 'show') === m}">${esc(T(m === 'show' ? 'd.demo.prelimShow' : 'd.demo.prelimHide'))}</button>`).join('')}</div><span class="xs muted">${esc(T('d.demo.prelimS'))}</span></div>
      ${A.deleted && Object.keys(A.deleted()).length ? `<div><button class="btn sm" id="dRestore">${esc(T('d.demo.restore'))}</button> <span class="xs muted">${esc(T('d.demo.restoreS'))}</span></div>` : ''}</div></div>
    <div class="card"><div class="hd"><h2>${esc(T('set.data'))}</h2>${A.ann('3.6 Keeping and deleting, Consent, Working; 3.7 Hosting region, Working; N5; D4')}</div><div class="bd small"><dl class="kv">
      <dt>${esc(T('set.d.host'))}</dt><dd>${esc(T('set.d.hostV'))}</dd><dt>${esc(T('set.d.keep'))}</dt><dd>${esc(T('set.d.keepV'))}</dd><dt>${esc(T('set.d.end'))}</dt><dd>${esc(T('set.d.endV'))}</dd>
      <dt>${esc(T('set.d.del'))}</dt><dd>${esc(T('set.d.delV'))} <span class="chip amber">${esc(T('set.d.period'))}</span></dd><dt>${esc(T('d.data.delete'))}</dt><dd>${esc(T('d.data.deleteV'))}</dd><dt>${esc(T('d.data.consent'))}</dt><dd>${esc(T('d.data.consentV'))}</dd><dt>${esc(T('set.d.rel'))}</dt><dd>${esc(T('set.d.relV'))}</dd></dl></div></div>
    <div class="card"><div class="hd"><h2>${esc(T('set.service'))}</h2><span class="row">${prop}${A.ann('Q9 proposal (a): built in, switched off; N10: a separate permission')}</span></div><div class="bd small"><label class="row"><input type="checkbox" disabled> ${esc(T('set.serviceLabel'))}</label><p class="xs muted" style="margin-bottom:0">${esc(T('set.serviceText'))}</p></div></div>
    <div class="card"><div class="hd"><h2>${esc(T('set.export'))}</h2><span class="row">${prop}${A.ann('Q14 proposal (a): PDF only')}</span></div><div class="bd small"><div class="row"><button class="btn sm" disabled>${esc(T('set.word'))}</button><span class="chip">${esc(T('set.notR1'))}</span></div><p class="xs muted" style="margin-bottom:0">${esc(T('set.exportText'))}</p></div></div>
    <div class="card"><div class="hd"><h2>${esc(T('set.install'))}</h2><span class="row">${prop}${A.ann('3.7 Working; Q10 proposal (b); ADR 0004 proposed')}</span></div><div class="bd small">${esc(T('set.installText'))}</div></div>
    <div class="card"><div class="hd"><h2>${esc(T('set.about'))}</h2></div><div class="bd small">${esc(T('set.aboutText'))}</div></div></div>`;
  qa('[data-dviewas]', root).forEach(b => b.onclick = () => A.setRole(b.dataset.dviewas));
  const g = q1('#dGrant', root); if (g) g.onclick = () => grantDialog(root);
  qa('[data-revoke]', root).forEach(b => b.onclick = () => { if (A.revokeGrant(b.dataset.revoke)) { A.toast(T('toast.revoke')); settings(root); } });
  qa('[data-prelim]', root).forEach(b => b.onclick = () => { A.state.ui.prelimMode = b.dataset.prelim; settings(root); });
  const rs = q1('#dRestore', root); if (rs) rs.onclick = () => { if (A.restoreDeleted()) A.toast(T('d.toast.restore')); settings(root); };
  const e = q1('#dEmpty', root); if (e) e.onchange = () => { A.toast(T(e.checked ? 'd.toast.empty1' : 'd.toast.empty0')); A.setEmpty(e.checked); };
  const iv = q1('#dInvite', root); if (iv) iv.onclick = () => A.dialog({ title: T('d.inv.title'), ok: T('d.inv.ok'),
    body: `<div class="field"><span>${esc(T('d.inv.mail'))}</span><input id="dInvMail" type="email" placeholder="${esc(T('d.inv.ph'))}"></div>
      <div class="field"><span>${esc(T('d.inv.qual'))}</span><select id="dInvQ"><option value="d.inv.psy">${esc(T('d.inv.psy'))}</option><option value="d.inv.phys">${esc(T('d.inv.phys'))}</option></select></div>
      <label class="row small"><input type="checkbox" id="dInvAdm"> ${esc(T('d.inv.adm'))}</label><p class="xs muted" style="margin:0">${esc(T('d.inv.note'))} ${A.ann('N10: two-factor login for everyone; 3.2 users: physicians and licensed psychologists or neuropsychologists')}</p><div class="d-err" id="dInvErr"></div>`,
    onOk: (back) => { const mail = q1('#dInvMail', back).value.trim(); if (!mail) { q1('#dInvErr', back).textContent = T('d.inv.err'); return false; }
      const ui = A.state.ui; ui.invited = [...(ui.invited || []), { mail, q: q1('#dInvQ', back).value, adm: q1('#dInvAdm', back).checked }];
      A.addLog('who.c1', 'd.log.inv'); A.toast(T('d.toast.inv')); settings(root); } });
}
window.Modules.settings = { render: settings };

/* ---------------- new patient (D3): the separate identity store ---------------- */
const TODAY = '2026-10-29';
const yearsBetween = (a, b) => (new Date(b) - new Date(a)) / 3.15576e10;
A.newPatient = (opts = {}) => {
  const code = A.nextCode(), F = (k) => esc(T(k));
  const back = A.dialog({ title: T('d.np.title'), ok: T('d.np.ok'),
    body: `<div class="d-np">
      <section class="d-id"><h3>🔒 ${F('d.np.id')} ${A.ann('3.6 Separate identity store, encrypted with a key per clinic')}</h3><p class="xs muted">${F('d.np.idS')}</p>
        <div class="field"><span>${F('d.np.name')}</span><input id="dNpName" autocomplete="off" value="${esc('Mock Patient ' + code.slice(5))}"></div>
        <div class="field"><span>${F('d.np.born')}</span><input id="dNpBorn" type="date" value="2015-01-01" max="${TODAY}"></div></section>
      <section class="d-an"><h3>${F('d.np.an')} ${A.ann('3.6: the analysis sees only a code number, age and sex')}</h3><p class="xs muted">${F('d.np.anS')}</p>
        <dl class="kv"><dt>${F('d.np.code')}</dt><dd class="mono">${code}</dd><dt>${F('d.np.age')}</dt><dd id="dNpAge"></dd></dl>
        <div class="field"><span>${F('d.np.sex')}</span><select id="dNpSex"><option value="F">${F('d.np.F')}</option><option value="M">${F('d.np.M')}</option></select></div></section>
    </div><p class="xs muted" style="margin:0">${F('d.np.mock')}</p><div class="d-err" id="dNpErr"></div>`,
    onOk: (b) => {
      const name = q1('#dNpName', b).value.trim(), born = q1('#dNpBorn', b).value, err = q1('#dNpErr', b);
      if (!name) { err.textContent = T('d.np.errName'); q1('#dNpName', b).focus(); return false; }
      if (!born || born > TODAY) { err.textContent = T('d.np.errBorn'); q1('#dNpBorn', b).focus(); return false; }
      const p = A.addPatient({ code, name, born, sex: q1('#dNpSex', b).value });
      A.addLog('who.c1', 'd.log.np', { code }); A.toast(T('d.toast.np', { code }));
      A.state.ui.upPat = code;
      if (opts.onDone) opts.onDone(p); else A.refresh();
    } });
  const upd = () => { const v = q1('#dNpBorn', back).value, a = v ? Math.floor(yearsBetween(v, TODAY)) : null;
    q1('#dNpAge', back).innerHTML = a == null ? '' : esc(T('d.np.years', { n: a })) + (a < A.normRange()[0] || a > A.normRange()[1] ? `<div class="xs" style="color:var(--warn)">${esc(T('d.np.out2', { lo: A.normRange()[0], hi: A.normRange()[1] }))}</div>` : ''); };
  q1('#dNpBorn', back).oninput = upd; upd();
  setTimeout(() => { const n = q1('#dNpName', back); if (n) { n.focus(); n.select(); } }, 0);
  return back;
};

/* ---------------- upload (B5, B6, D5) ---------------- */
const MAIN = 'MOCK-042';
/* demo files: which synthetic file the drop zone receives; ok/old are valid, the others show the errors */
const FILES = { ok: { mb: 37.9, kind: 'ok' }, old: { mb: 36.2, kind: 'ok' }, pdf: { mb: 1.2, kind: 'pdf' }, dup: { mb: 37.9, kind: 'dup' }, ch: { mb: 33.4, kind: 'ch' } };
const U = { mode: 'new', file: null, phase: 'idle', pct: 0, step: 0, err: null, rc: null, rcMode: null, consent: {}, timer: null, target: null };
const m0Of = () => { const c = A.caseInfo(MAIN); return c && c.case.measurements.find(m => m.uploaded_later); };
const RCF = () => A.data.recording_condition_fields;
const rcDefaults = (mode) => mode === 'earlier' ? { time_of_day: null, medication_on_day: null, sleep_before: null, drowsiness_observed: null } : { time_of_day: '09:15', medication_on_day: 'none_reported', sleep_before: 'as_usual', drowsiness_observed: 'no' };
const curPat = () => { const ui = A.state.ui, list = A.patients(); let p = list.find(x => x.code === ui.upPat); if (!p && list.length && !A.state.empty) p = list[0]; return p || null; };
const fileDate = (pat) => U.mode === 'earlier' && pat && pat.code === MAIN && m0Of() ? m0Of().date : TODAY;
function upload(root) {
  const ui = A.state.ui;
  if (ui.upMode && ui.upMode !== U.mode && U.phase !== 'uploading') { U.mode = ui.upMode; resetFile(); U.pick = null; U.rc = null; U.consent = {}; }
  ui.upMode = U.mode;
  if (!U.rc || U.rcMode !== U.mode) { U.rc = rcDefaults(U.mode); U.rcMode = U.mode; }
  const pat = curPat(), list = A.patients(), early = U.mode === 'earlier', can = A.can('upload');
  const earlyOk = early && pat && pat.code === MAIN;
  const files = early ? (earlyOk ? ['old', 'pdf', 'dup', 'ch'] : ['pdf', 'dup', 'ch']) : ['ok', 'pdf', 'dup', 'ch'];
  if (U.file && !files.includes(U.file)) resetFile();
  if (!U.file && U.phase === 'idle') U.pick = U.pick && files.includes(U.pick) ? U.pick : files[0];
  const born = pat && pat.born, recD = fileDate(pat), ageAt = born ? yearsBetween(born, recD) : null;
  const [nLo, nHi] = A.normRange(), normOut = ageAt != null && (ageAt < nLo || ageAt > nHi);
  const F = RCF(), lb = F ? (F.labels[A.lang] || F.labels.en) : {}, vl = F ? (F.value_labels[A.lang] || F.value_labels.en) : {};
  const busy = ['uploading', 'processing'].includes(U.phase), locked = busy || U.phase === 'done';
  const latest = pat && pat.full ? A.caseInfo(pat.code).m2.date : null;
  const sel = (k) => `<select data-drc="${k}" ${locked || !can ? 'disabled' : ''}>${F.values[k].map(v => `<option value="${v}" ${U.rc[k] === v ? 'selected' : ''}>${esc(vl[v] || v)}</option>`).join('')}<option value="" ${U.rc[k] == null ? 'selected' : ''}>${esc(vl.not_documented)}</option></select>`;
  root.innerHTML = `<div class="crumbs"><a href="#worklist">${esc(T('nav.worklist'))}</a><span>/</span><span>${esc(T('up.title'))}</span></div>
  <div class="pagehead"><h1>${esc(T('up.title'))}</h1><div class="seg" role="group" aria-label="${esc(T('d.up.modeAria'))}"><button data-dmode="new" class="${early ? '' : 'on'}" aria-pressed="${!early}" ${busy ? 'disabled' : ''}>${esc(T('d.up.new'))}</button><button data-dmode="earlier" class="${early ? 'on' : ''}" aria-pressed="${early}" ${busy ? 'disabled' : ''}>${esc(T('d.up.earlier'))}</button></div></div>
  ${can ? '' : `<div class="banner warn"><b>${esc(T('who.' + A.role))}</b><span>${esc(T('d.noUpload'))}</span></div>`}
  ${early ? `<div class="banner"><b>${esc(T('d.up.earlyBan'))}</b><span style="flex:1">${esc(T('d.up.earlyText'))}</span>${A.ann('3.4 Earlier recordings, Working: uploaded and processed again; V3 numbers are never shown in V4')}</div>` : ''}
  <div class="grid d-upgrid"><div class="grid d-upcol">
    <div class="card"><div class="hd"><h2>${esc(T('up.patient'))}</h2>${A.ann('3.6 Separate identity store')}</div><div class="bd grid" style="gap:10px">
      ${list.length ? `<div class="field"><span>${T('up.pat')}</span><select id="dUpPat" ${locked || !can ? 'disabled' : ''}>${list.map(p => `<option value="${p.code}" ${pat && p.code === pat.code ? 'selected' : ''}>${esc(A.state.staffView ? p.code : p.name + ' · ' + p.code)}</option>`).join('')}<option value="__new">${esc(T('d.up.newPatOpt'))}</option></select></div>`
        : `<div class="empty" style="padding:12px">${esc(T('d.up.noPat'))}<div style="margin-top:8px"><button class="btn sm primary" id="dUpNp" ${can ? '' : 'disabled'}>${esc(T('pat.new'))}</button></div></div>`}
      ${pat ? `<dl class="kv"><dt>${T(early ? 'd.up.recDateEarly' : 'up.age')}</dt><dd>${early ? (U.file === 'old' ? esc(A.fmtDate(recD)) : `<span class="muted">${esc(T('d.up.read'))}</span>`) : esc(T('d.up.ageNow', { age: Math.floor(ageAt) }))}</dd>
        ${early && U.file === 'old' ? `<dt>${T('up.age')}</dt><dd>${esc(T('d.up.ageAt', { age: A.nf(ageAt, 1) }))}</dd>` : ''}
        <dt>${T('up.sex')}</dt><dd>${esc(T(pat.sex === 'F' ? 'female' : 'male'))}</dd><dt>${T('up.norm')}</dt><dd>${esc(T('d.up.normV2'))}<div class="xs muted">${esc(T('d.up.normR', { lo: nLo, hi: nHi }))}</div>${normOut ? `<div class="xs" style="color:var(--warn)">${esc(T('d.up.normOut2', { lo: nLo, hi: nHi }))}</div>` : ''}${A.ann('Review C20: a mock range, not the range of the classifier row in 3.3')}</dd></dl>
      <div class="field"><span>${esc(T('up.consent'))} ${A.ann('3.6 Consent: recorded for each measurement; nothing is pre-ticked')}</span>
        ${['norm', 'research', 'model'].map(k => `<label class="row small"><input type="checkbox" data-dcons="${k}" ${U.consent[k] ? 'checked' : ''} ${locked || !can ? 'disabled' : ''}> ${T('cons.' + k)}</label>`).join('')}</div>` : ''}
    </div></div>
    <div class="card"><div class="hd"><h2>${esc(T('d.up.rcTitle'))}</h2>${A.ann('D5, intended use section 5: recording conditions documented by the user; fields are mockup assumption M60')}</div><div class="bd grid" style="gap:10px">
      ${early ? `<span class="xs muted">${esc(T('d.up.rcEarly'))}</span>` : ''}
      ${F ? `<div class="d-rc">
        <div class="field"><span>${esc(lb.time_of_day)}</span><div class="row"><input type="time" id="dRcTime" value="${esc(U.rc.time_of_day || '')}" ${U.rc.time_of_day == null || locked || !can ? 'disabled' : ''} aria-label="${esc(lb.time_of_day)}"><label class="row xs"><input type="checkbox" id="dRcTimeNd" ${U.rc.time_of_day == null ? 'checked' : ''} ${locked || !can ? 'disabled' : ''}> ${esc(vl.not_documented)}</label></div></div>
        ${F.keys.filter(k => F.values[k] !== 'HH:MM').map(k => `<div class="field"><span>${esc(lb[k])}</span>${sel(k)}</div>`).join('')}</div>` : ''}
    </div></div>
    </div>
    <div class="card"><div class="hd"><h2>${esc(T('up.rec'))}</h2>${A.ann('3.4 Browser only')}</div><div class="bd grid" style="gap:10px">
      <div class="field"><span>${T('up.sys')} <span class="chip amber">${esc(T('up.naming'))}</span> ${A.ann('3.2 Recording systems, Working; 3.2: the CTO confirms which product names V4 may use')}</span><select id="upSys" ${locked || !can ? 'disabled' : ''}><option value="mitsar">${esc(T('up.mitsar'))}</option><option value="neuro">${esc(T('up.neuro'))}</option><option disabled>${esc(T('up.edf'))}</option></select></div>
      <div class="d-sysv" id="dSysV">${sysLine('mitsar')}</div>
      <span class="xs muted">${esc(T('up.taskNote'))}</span>
      ${early && !earlyOk ? `<div class="banner amber"><span>${esc(T('d.up.only042'))}</span></div>` : ''}
      ${U.file ? `<div class="d-file"><span class="xs muted">${esc(T('d.up.chosen'))}</span><span class="mono">${esc(T('d.up.f.' + U.file, { mb: A.nf(FILES[U.file].mb, 1) }))}</span>${U.file === 'old' || U.file === 'ok' ? `<span class="xs muted">${esc(T('d.up.recDate'))}: ${esc(A.fmtDate(recD))} · ${esc(T('d.up.read'))}</span>` : ''}${!busy ? `<button class="btn sm ghost" id="dUpOther">${esc(T('d.up.other'))}</button>` : ''}</div>
        ${early && U.file === 'old' && latest ? `<span class="xs muted">${esc(T('d.up.dateOrder', { d: A.fmtDate(latest) }))}</span>` : ''}`
      : `<div class="d-drop" id="dDrop">${esc(T('up.drop'))}<br><button class="btn sm" id="dPick" style="margin-top:8px" ${pat && can ? '' : 'disabled'}>${esc(T('up.choose'))}</button></div>
        <div class="field"><span>${esc(T('d.up.demoFile'))} ${A.ann('Mockup: choose which synthetic file the drop zone receives; three of them show the upload errors (B6)')}</span><div class="d-up-files" role="radiogroup">${files.map(f => `<label><input type="radio" name="dUpF" value="${f}" ${U.pick === f ? 'checked' : ''}><span class="mono">${esc(T('d.up.f.' + f, { mb: A.nf(FILES[f].mb, 1) }))}</span><span class="chip ${FILES[f].kind === 'ok' ? 'ok' : 'warn'}">${esc(T('d.up.fk.' + FILES[f].kind))}</span></label>`).join('')}</div></div>`}
    </div></div>
    <div class="card" style="grid-column:1/-1"><div class="hd"><h2>${esc(T('d.up.prog'))}</h2>${early ? phaseHtml() : ''}</div><div class="bd grid" style="gap:10px" id="dProg">${progHtml(pat)}</div></div>
  </div>`;
  wireUpload(root, pat, files);
  if (U.scroll) { U.scroll = false; const pr = q1('#dProg', root); if (pr && pr.scrollIntoView) pr.parentElement.scrollIntoView({ block: 'nearest' }); }
}
/* queued, processing, done of the earlier recording (B5) */
function phaseHtml() { const e = A.caseInfo(MAIN).state.earlier, o = ['queued', 'processing', 'done'], i = o.indexOf(e.status);
  return `<span class="d-phase" id="dPhase">${o.map((k, j) => `<span class="${j < i || (k === 'done' && i === 2) ? 'done' : j === i ? 'on' : ''}">${j < i || i === 2 ? '✓ ' : ''}${esc(T('d.st.' + k[0]))}</span>`).join('<i>›</i>')}</span>`; }
function stepsHtml(n, err) { return `<ol class="d-steps">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<li class="${err && k === 1 ? 'err' : k < n || (n === 10) ? 'done' : k === n ? 'now' : ''}"><span class="i">${err && k === 1 ? '✕' : k < n || n === 10 ? '✓' : k === n ? '›' : ''}</span>${esc(T('step.' + k))}</li>`).join('')}</ol>`; }
function progHtml(pat) {
  const early = U.mode === 'earlier', e = A.caseInfo(MAIN).state.earlier, m0 = m0Of();
  const goBtn = `<div class="row"><button class="btn primary" id="dGo" ${U.file && pat && A.can('upload') && !U.err ? '' : 'disabled'} title="${esc(T(!pat ? 'd.up.needPat' : 'd.up.needFile'))}">${esc(T(early ? 'd.up.goEarly' : 'd.up.go'))}</button></div>`;
  if (U.phase === 'error') return `<div class="banner warn"><b>${esc(T('d.err.title'))}</b><span style="flex:1">${esc(U.err.text)}<br><span class="xs muted">${esc(T(U.err.pre ? 'd.err.at' : 'd.err.step'))}</span></span></div>${U.err.pre ? '' : stepsHtml(1, true)}<div class="row"><button class="btn" id="dUpOther2">${esc(T('d.up.other'))}</button></div>`;
  if (U.phase === 'idle') return `<span class="small muted">${esc(T('d.up.idle'))}</span>${goBtn}`;
  const bar = (pct) => `<div class="small row between"><span class="mono">${esc(T('d.up.f.' + U.file, { mb: A.nf(FILES[U.file].mb, 1) }))}</span><span class="mono" id="dPct">${A.pct(pct)}</span></div><div class="d-bar"><div id="dBar" style="width:${pct}%"></div></div>`;
  if (U.phase === 'uploading') return `${bar(U.pct)}<span class="small">${esc(T('d.up.uploading', { pct: A.pct(U.pct) }))}</span>`;
  if (early && U.target === 'm0') {
    if (e.status === 'queued') return `${bar(100)}<span class="small" style="color:var(--amber)">${esc(T('d.up.queued'))}</span>${stepsHtml(0)}`;
    if (e.status === 'processing') return `${bar(100)}<span class="small" style="color:var(--amber)">${esc(T('d.up.processing', { n: e.step, s: T('step.' + e.step) }))}</span>${stepsHtml(e.step)}`;
    if (e.status === 'done') return `${bar(100)}<div class="banner ok"><span style="flex:1">${esc(T('d.up.doneEarly', { dur: A.fmtDur(m0.processed_with.processing_s || 371) }))}</span></div>${stepsHtml(10)}${A.sys(importNote())}
      <div class="row"><button class="btn primary" data-dopen="compare">${esc(T('d.up.openCmp'))}</button><button class="btn" data-dopen="patient">${esc(T('d.up.openPat'))}</button><button class="btn ghost" id="dAgain">${esc(T('d.up.again'))}</button></div>`;
  }
  const deid = `<span class="small">🔒 ${esc(T('d.up.deid'))} ${A.ann('3.6 Separate identity store; F3: processing sees a working copy with the header identity removed')}</span>`;
  if (U.phase === 'processing') return `${bar(100)}${deid}<span class="small" style="color:var(--amber)">${esc(T('d.up.procNew', { n: U.step, s: T('step.' + U.step) }))}</span>${stepsHtml(U.step)}`;
  const full = pat && pat.full;
  return `${bar(100)}${deid}<div class="banner ok"><span style="flex:1">${esc(T(full ? 'd.up.doneNew' : 'd.up.doneNoData'))}</span></div>${stepsHtml(10)}<div class="row">${full ? `<button class="btn primary" data-dopen="overview">${esc(T('d.up.openMeas'))}</button>` : ''}<button class="btn ghost" id="dAgain">${esc(T('d.up.again'))}</button></div>`;
}
/* the task software and file type of the chosen recording system, under the select (review C27) */
const sysLine = (k) => esc(T('d.up.sysV', { sw: T(k === 'neuro' ? 'up.neuroSw' : 'up.mitsarSw'), file: T(k === 'neuro' ? 'up.tbc' : 'up.wineeg') }));
/* L-IMPORT-1 from the fixed library: reports and numbers of earlier software are not imported */
const importNote = () => { const S = A.caseInfo(MAIN).sent[A.lang] || A.caseInfo(MAIN).sent.en, L = (S.comparison_limits || {})['M2|M0'] || []; return L.filter(x => x.id === 'L-IMPORT-1'); };
function resetFile() { U.file = null; U.phase = 'idle'; U.pct = 0; U.step = 0; U.err = null; U.target = null; }
function wireUpload(root, pat, files) {
  const re = () => { if (U.root && document.body.contains(U.root)) upload(U.root); };
  U.root = root;
  qa('[data-dmode]', root).forEach(b => b.onclick = () => { if (U.mode === b.dataset.dmode) return; A.state.ui.upMode = b.dataset.dmode; re(); });
  const ps = q1('#dUpPat', root); if (ps) ps.onchange = () => { if (ps.value === '__new') { ps.value = pat ? pat.code : ''; A.newPatient({ onDone: () => re() }); return; } A.state.ui.upPat = ps.value; re(); };
  const np = q1('#dUpNp', root); if (np) np.onclick = () => A.newPatient({ onDone: () => re() });
  qa('[data-dcons]', root).forEach(c => c.onchange = () => { U.consent[c.dataset.dcons] = c.checked; });
  qa('input[name=dUpF]', root).forEach(r => r.onchange = () => { U.pick = r.value; });
  const us = q1('#upSys', root); if (us) us.onchange = () => { const v = q1('#dSysV', root); if (v) v.innerHTML = sysLine(us.value); };
  const choose = () => { if (!pat || !A.can('upload')) return; U.file = U.pick || files[0]; U.err = null;
    if (FILES[U.file].kind === 'pdf') { U.phase = 'error'; U.scroll = true; U.err = { pre: true, text: T('d.err.pdf', { file: 'mock_v3_report.pdf' }) }; A.addLog('who.system', 'd.log.err', { file: 'mock_v3_report.pdf', why: A.tk('d.why.pdf'), code: pat.code }); }
    re(); };
  const pick = q1('#dPick', root); if (pick) pick.onclick = choose;
  const dz = q1('#dDrop', root); if (dz) { dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); choose(); }; }
  [q1('#dUpOther', root), q1('#dUpOther2', root)].forEach(b => { if (b) b.onclick = () => { resetFile(); re(); }; });
  const ag = q1('#dAgain', root); if (ag) ag.onclick = () => { resetFile(); U.rc = null; U.consent = {}; re(); };
  const tm = q1('#dRcTime', root), nd = q1('#dRcTimeNd', root);
  if (tm) tm.onchange = () => { U.rc.time_of_day = tm.value || null; };
  if (nd) nd.onchange = () => { U.rc.time_of_day = nd.checked ? null : '09:15'; re(); };
  qa('[data-drc]', root).forEach(s => s.onchange = () => { U.rc[s.dataset.drc] = s.value || null; });
  qa('[data-dopen]', root).forEach(b => b.onclick = () => { const code = pat && pat.full ? pat.code : MAIN; A.openCase(code, b.dataset.dopen); });
  const go = q1('#dGo', root); if (go) go.onclick = () => start(pat);
}
/* upload, then either the error of a server-side check, the reprocessing of the earlier recording, or
   the demo processing of a new recording */
function start(pat) {
  if (!U.file || !pat) return;
  const early = U.mode === 'earlier', kind = FILES[U.file].kind, code = pat.code;
  U.phase = 'uploading'; U.pct = 0; clearInterval(U.timer);
  const tick = () => { U.pct = Math.min(100, U.pct + 8); const b = q1('#dBar'), p = q1('#dPct'); if (b) b.style.width = U.pct + '%'; if (p) p.textContent = A.pct(U.pct);
    if (U.pct < 100) return; clearInterval(U.timer); afterUpload(pat, early, kind, code); };
  U.timer = setInterval(tick, 80); U.scroll = true; if (U.root) upload(U.root);
}
function afterUpload(pat, early, kind, code) {
  const c42 = A.caseInfo(MAIN), m2 = c42.m2, m0 = m0Of(), e = c42.state.earlier;
  const sha = (m) => m.processed_with.input_sha256.slice(0, 8);
  const fname = T('d.up.f.' + U.file, { mb: '' }).split(' · ')[0];
  if (kind === 'dup' || (early && U.file === 'old' && e.status !== 'none')) {
    U.phase = 'error';
    U.err = { text: early && U.file === 'old' ? T('d.err.dupEarly', { d: A.fmtDate(m0.date), code: MAIN, up: A.fmtDate(TODAY), sha: sha(m0) }) : T('d.err.dup', { d: A.fmtDate(m2.date), code: MAIN, sha: sha(m2) }) };
    A.addLog('who.system', 'd.log.err', { file: fname, why: A.tk('d.why.dup'), code });
  } else if (kind === 'ch') {
    U.phase = 'error'; U.err = { text: T('d.err.ch') }; A.addLog('who.system', 'd.log.err', { file: fname, why: A.tk('d.why.ch'), code });
  } else if (early && U.file === 'old') {
    U.target = 'm0'; U.phase = 'processing';
    m0.recording_conditions = Object.assign({ documented_at: 'upload' }, U.rc);
    A.addLog('who.c1', 'd.log.upEarly', { d: { $d: m0.date }, code: MAIN });
    const n = Object.values(U.rc).filter(v => v != null).length; if (n) A.addLog('who.c1', 'd.log.rc', { n, code: MAIN });
    reprocess();
  } else {
    U.target = 'new'; U.phase = 'processing'; U.step = 1;
    A.addLog('who.c1', 'd.log.upNew', { code });
    const n = Object.values(U.rc).filter(v => v != null).length; if (n) A.addLog('who.c1', 'd.log.rc', { n, code });
    U.timer = setInterval(() => { U.step++; if (U.step > 9) { clearInterval(U.timer); U.phase = 'done'; A.addLog('who.system', 'log.demo', { code }); A.markUploaded(code);
        if (A.state.empty) A.state.ui.emptyUploads = (A.state.ui.emptyUploads || 0) + 1; }
      if (U.root && document.body.contains(U.root)) upload(U.root); }, 420);
  }
  if (U.root && document.body.contains(U.root)) upload(U.root);
}
/* reprocessing of the earlier recording M0: queued, then 9 steps, then done; keeps running while the
   clinician works elsewhere; when done, M0 is in APP.measurements() and the comparison picker */
function reprocess() {
  const c = A.caseInfo(MAIN), e = c.state.earlier, m0 = m0Of();
  e.status = 'queued'; e.step = 0; e.at = A.now();
  A.addLog('who.system', 'd.log.queued', { d: { $d: m0.date }, code: MAIN });
  const paint = () => { const route = location.hash.slice(1);
    if (route === 'upload' && U.root && document.body.contains(U.root)) upload(U.root);
    else if (['worklist', 'patient', 'patients', 'compare', MAIN + '/patient'].includes(route) && !(A.state.ui.anEdit)) A.refresh(); };
  paint();
  clearTimeout(U.qT); U.qT = setTimeout(() => { e.status = 'processing'; e.step = 1; paint();
    const t = setInterval(() => { e.step++;
      if (e.step > 9) { clearInterval(t); e.status = 'done'; e.step = 9;
        const now = A.now(); m0.processed_with.processed_at = `${now.d}T${now.tm}:00`; if (U.target === 'm0') U.phase = 'done';
        A.addLog('who.system', 'd.log.reproc', { d: { $d: m0.date }, code: MAIN, dur: A.tk('dur', { m: Math.floor(m0.processed_with.processing_s / 60), s: m0.processed_with.processing_s % 60 }) });
        A.toast(T('d.toast.reproc', { d: A.fmtDate(m0.date) })); paint(); return; }
      paint(); }, 650);
  }, 1600);
}
window.Modules.upload = { render: upload, destroy() { /* timers keep running: processing continues while the clinician works elsewhere */ } };
