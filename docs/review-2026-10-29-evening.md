---
status: draft
last-reviewed: 2026-10-29
---

# Mockup review, evening of 29 October: merged findings from 5 reviewers

Review of the frozen snapshot of the evening of 29 October (commit `a073aac`) by five reviewers: a
comparison with the live shared document, and four lenses (the clinical lead, the CTO, product
design, the specification). Items marked (n) were raised by n reviewers. Sizes: S is under 1 hour
of agent work, M is a few hours, L is more. "Morning B3" and similar refer to the items of
`docs/review-2026-10-29.md`. Findings on the items being built in the night round (morning B3, B5,
B6, D2 to D7) are kept only where they add a concrete requirement (B6 to B11 below). Doubtful
findings were checked in the snapshot's code and data, and in the legacy audit where cited.

## A. Contradicts the current specification or a hard rule (must fix)

The live shared document has not changed since the morning copy (last edit 12:13 UTC on 29
October, before that copy was saved), so no item below comes from a spec change. Its four open
suggested insertions are not accepted text; the one that touches the mockup today is A1.

**A1. A task software name the CTO has not cleared is on screen (2)**
- **What and where:** the Upload annotation "3.2: the CTO confirms whether ... may be named"
  (`shell.html` line 738) names the task software of the NeuroAmp system, which M38 keeps out of
  the mockup. The open suggestion in 3.2 asks the CTO exactly this and is unanswered. The
  amplifier name NeuroAmp x23 is in the 3.2 text and carries a "naming to confirm" chip, which is
  fine for now.
- **Spec source:** 3.2 Recording systems (Working) and its open suggestion; M38.
- **Proposal:** reword to "3.2: the CTO confirms which product names V4 may use". If the CTO says
  no, also remove the amplifier name from the upload list, the case data and the report label; if
  yes, update M38. **S**

**A2. Support view can still change clinical state, works without a grant, shows free text (3)**
- **What and where:**
  - The read-only guard only blocks clicks inside `#modRoot`. In support view "Undo rejection"
    (`#wsUnrej`, `APP.undoReject`, `shell.html` line 624) un-rejects the recording, logged as
    "Company support". An upload runs to "Done". "Grant support access" can be pressed from
    inside support view and is logged as "Clinic admin".
  - Support view opens without any grant, while its banner says "Granted by Clinic C until 31
    Oct 2026, 18:00", a fixed date (line 701). The grant button only writes a log line: no
    scope, no revoke, no named staff account.
  - In support view the activity log shows the clinician's correction reason in full, although
    the banner says free text is hidden.
  - "Opened report ... with support access" is logged twice per visit; the app bar keeps the
    avatar "C1", so nothing in the chrome shows the mode.
- **Spec source:** 3.6 Who sees what (time-limited access granted by the clinic, every access
  logged); N10; morning A10, which this partly undoes.
- **Proposal:**
  - Make read-only a property of the actor, checked in `APP.undoReject`, upload, grant and every
    module action; hide action buttons rather than disable them.
  - Support view only while a grant is active. The grant dialog takes a scope (whole clinic or
    chosen cases), a duration and a reason; the end time follows from the grant time. A list of
    active grants with Revoke; a named staff account ("Company support, S1"). Build the dialog
    within the D3 build (B9).
  - Support sees "reason given (hidden)" in place of free text.
  - Avatar "CS" and a thin amber band under the app bar: "Company support · read only · ends
    ...". Log "opened" once per route change.
  - **M** (S for the guard alone)

**A3. Project status is printed inside the patient report (2)**
- **What and where:** SUM-RULE-2 ends "and global coherence, which is still to be confirmed"
  (Overview, Results > Summary, the report, page 2 of all three PDFs). Clinic C PDF page 8 has the
  heading "Global coherence (mean over all pairs), to confirm" and the legend "a core function
  still to be confirmed"; Clinic B prints "zu bestätigen". Templates > Add blocks shows "Global
  coherence · to confirm".
- **Spec source:** 3.2 No interpretation (a fixed library of reviewed sentences, which must stay
  true in the released product); table 3.3 status vocabulary; `CONTRACT.md` (spec references only
  in `APP.ann`).
- **Proposal:** SUM-RULE-2 ends "Not ranked: the spectra per 0.5 Hz bin, shown as curves against
  the norm, and global coherence." in `textlib` (EN, DE, JA). Move the "to confirm" heading,
  legend and block label to `--annotate` and to the prototype annotations. **S**

**A4. "to confirm" means both a pending clinician task and an undecided spec status (3)**
- **What and where:** the Results rail chips "Channel ERPs 2 to confirm" and "Frequency markers to
  confirm" (`b_results.js` `b.toConfirm`, lines 20, 95 and 313) use the same amber chip and the
  same words as the spec status "Core, to confirm" (`b.coreConf`, line 52); in German both read
  "zu bestätigen". The meeting will read channel ERPs, which are Core (decided), as undecided.
- **Spec source:** table 3.3 status vocabulary.
- **Proposal:** call the clinician task "not confirmed" / "nicht bestätigt", in an outline chip
  with a clock icon; use "Core, to confirm" only for the spec status, in annotation badges. **S**

**A5. One sentence id prints two wordings, one of them outside the library (1)**
- **What and where:** the prototype builds the cleaning sentence in Cleaning, Report and Issued
  from interface strings `sys.icaAuto`, `sys.icaMan`, `sys.icaManKeep` and `sys.icaManRm`
  (`shell.html` lines 416 to 419, 494 to 497 and 548 to 555), not from `textlib`. Under
  Q-ICA-MAN-1 it prints "Artefact removal changed by the clinician: {list}; ...", while the PDF
  prints the `textlib.py` template (line 174), which covers one kept component only. The variant
  "removed although the automatic cleaning proposed keeping it" is in no library record.
- **Spec source:** 3.2 No interpretation (fixed library of reviewed sentences); M51.
- **Proposal:** in `textlib`, Q-ICA-MAN-1 (kept against the proposal), a new Q-ICA-MAN-2 (removed
  against the proposal) and a list form, in EN, DE and JA. Export them through `data.json`
  `choice_sentences` as for Q-SEG (next to the planned Q-ICA-PEND-1) and delete the `sys.ica*`
  strings. Extend the parity check so that every printed sentence matches `textlib` for its id
  and language. **S**

**A6. The eyes closed EEG viewer has no posterior dominant rhythm (1)**
- **What and where:** Recording tab, eyes closed, 10 s and 30 s pages: O1, O2 and Pz have about
  the amplitude of Fp1, F3 and F7, dense fast activity covers every channel, and eyes open looks
  much like eyes closed. A neurophysiologist checks the posterior rhythm first, and an eyes closed
  background without one reads as abnormal. Cause: the generator (`a_workspace.js`, about lines
  229 to 300, M44) scales each channel by its total power, which is the same front and back
  (eyes closed Fz 103 µV², O1 101 µV²), and beta1 plus beta2 are 16 to 18 % of it everywhere.
  The PDF excerpt (`synth.py` raw_excerpt) does show posterior alpha, so viewer and report
  disagree.
- **Spec source:** hard rule 1 (plausible synthetic data); 3.4 Clinician in control (the
  clinician reviews the raw EEG); M1, M44.
- **Proposal:** eyes closed posterior alpha at 2 to 3 times the frontal amplitude, attenuated with
  the eyes open; delta as irregular slow waves; fast activity at a few µV. Check by eye against
  the PDF excerpt and update M44. **M**

**A7. The synthetic child has a stable spectral profile that M1 does not declare (1)**
- **What and where:** `synth.py`, `data/synthetic/case_mock042.json`; visible in Results > Spectra
  and maps and on PDF pages 4 to 6.
  - In all four recordings the child's spectrum rises from 22 to 30 Hz at all 19 sites, while the
    norm falls at every site. Scalp mean z at 30 Hz is +1.3 to +1.7, largest at T3, T4 and T5
    (up to 2.5). The 28 to 30 Hz maps are red everywhere.
  - Scalp mean relative beta z is +0.7 to +1.4 and relative delta z goes down to -1.3. In the
    current measurement eyes open relative alpha is +1.1 to +1.8 at every site.
  - The eyes closed to eyes open alpha ratio at O1 is 1.5 now, against 2.5 in the earlier
    measurement and in the norm.
  - A rising temporal spectrum reads as residual muscle; a scalp-wide shift from slow to fast
    activity reads as a profile (beta excess is a described subgroup in the literature on the
    target condition); the alpha reactivity change reads as drowsiness between the measurements.
    This is what morning A3 and M1 meant to avoid.
- **Spec source:** hard rule 5 (its intent); morning A3; M1, M2.
- **Proposal:** seed acceptance checks in `synth.py`, listed in M1: in every recording the scalp
  mean z of each band within ±0.5; spectra falling above 20 Hz; the eyes closed to eyes open
  posterior alpha ratio within 20 % of the norm in both measurements. Reseed once together with
  C9, C10, C11 and D5. **M**

**A8. "Clinic C" is two different documents under one template id (2)**
- **What and where:**
  - `outputs/sample/report_clinic_c_en.pdf` is built from CT-C `template_version` 2
    (`clinic_c_en.json`): navy cover band, Roman section numbers, italic running header, lime
    footer band, title "Quantitative EEG and ERP report", 12 pages with raw EEG excerpt, global
    coherence and comparison. That is the look the prototype calls Company standard CT-STD (M30).
  - The prototype's CT-C v3 is a blue-bar layout titled "EEG and ERP report", 8 pages, without
    the excerpt and global coherence. Its history says v3 "Added comparison with the earlier
    measurement", which the PDF's v2 already has. Both drafts are R-MOCK-042-0915 v1.
  - None of the three PDFs prints a template row in Versions (pdftotext finds no "CT-"), while
    the prototype prints "Template CT-C v3, Clinic C, English" and M41 says the report language is
    printed.
- **Spec source:** 3.5 Clinic templates (Working); I5 and I6 (template versioned with a change
  log); M30, M41.
- **Proposal:** render the Clinic C PDF from the CT-C record the prototype uses, or give the sample
  its own id and version. Optionally add a fourth sample PDF "Company standard" in the heritage
  look. Print "Template CT-x vN · clinic · language" in the Versions block of every PDF. Add a
  check that one template id and version gives one block list in both pipelines. **M**

**A9. Changes the clinician makes never change the results (1)**
- **What and where:** after "Correct this report", one eyes open segment excluded (164 s became
  168 s), confirmed and issued as v2: Q-SEG-MAN-1 states 168 s, but every z value, every mark,
  SUM-2 and SUM-COUNT-1 are identical to v1. The same happens when a component is kept or
  removed. No README assumption declares this (M39 covers moved peaks only). In V4 a segment
  change refits ICA and recomputes every feature, so each change gives a new result set, takes
  processing time and can move marks; the mockup shows the most expensive state machine of the
  product as text only.
- **Spec source:** 3.4 Clinician in control; 3.8 Reproducibility and Speed; N11, N13.
- **Proposal:** after a confirmed change, show a "Recomputing" state, then label the results
  "result set 2 (after your change)" and keep set 1 linked to issued v1 in the version history.
  Precompute one alternative synthetic set for one scripted change (IC 6 kept, as in M14) so the
  numbers visibly move, and declare as a mockup assumption that all other changes reuse set 1.
  **M**

**A10. The cleaning shows legacy defect D2 as the V4 design and cites a stale question (2)**
- **What and where:** 19 components are taken from 19 average-referenced channels, whose rank is
  18: Cleaning tab IC 1 to IC 19, "3 of 19 components removed", the Q-ICA sentences ("2 of 19"
  on page 3 of the Clinic C PDF), `shell.html` (`n = 19`), `synth.py` and `CONTRACT.md`
  (`n_components: 19`). The template-match annotation (`a_workspace.js` line 808, comment at
  line 616) reads "absolute r, the legacy test is signed (D4, open B4)".
- **Spec source:** v4 repository open questions B4 (answered: V4 reproduces no defect on purpose)
  and L9 (the product owner, 27 to 29 October: the legacy defects are fixed in V3 first and
  compared fixed with fixed; V3 defects stay out of the shared specification).
- **Proposal:** 18 components (reduce to the true rank before ICA) and sentences "3 of 18". The
  annotation becomes "absolute r, as in the fixed legacy reference build (L9)", with no defect id
  on screen. Update M43, M50 and `CONTRACT.md`. **S** (M if the component maps are regenerated)

**A11. The Japanese VCPT tag names the wrong approval route (1)**
- **What and where:** Clinic A PDF pages 1 and 10 (`i18n.py` lines 181 to 183, `later_market`,
  `subject_cert`): "VCPT sentences subject to the certification body". Table 3.3 says "In Japan
  these values may need a separate approval", which is approval by the authorities (appendix A of
  the shared document), a different route from certification, and it concerns the values, not
  only the sentences. The summary tag on page 2 is right. The morning B1 proposal was wrong on
  this point.
- **Spec source:** table 3.3 row Omissions, commissions, mean reaction time; 3.2 No
  interpretation; intended use IU3.
- **Proposal:** VCPT tag "In Japan these values may need a separate approval (table 3.3)" with a
  Japanese equivalent; cover banner "summary subject to the certification body; VCPT values may
  need a separate approval". **S**

**A12. Alpha peak frequency carries the "Core, to confirm" chip and gates issue (1)**
- **What and where:** Results > Frequency markers, card "Alpha peak · eyes closed · posterior
  mean" (`b_results.js` line 663), chip "Core, to confirm". M52 blocks issue until this marker is
  confirmed, so a decided Core value depends on an undecided function.
- **Spec source:** table 3.3 (alpha peak frequency: Core; frequency markers: Core, to confirm);
  Q6.
- **Proposal:** show the alpha peak frequency as Core (an automatic value with z) under Ratios and
  indices; keep "Core, to confirm (Q6)" only on the marker tool of the B3 build (B6); state in M52
  that the marker gate applies only if Q6 puts markers in the core. **S**

**A13. Cleaning shows ICA component maps that table 3.3 lists as Open (1)**
- **What and where:** the Cleaning tab shows maps, spectra and activations of all components of
  the resting recording. The Open panel (`b_results.js` line 275, `b.o.icamaps`) and digest row 2
  say they are not shown. No screen states the 3.4 status of the cleaning review itself.
- **Spec source:** table 3.3 "Maps and spectra of the ICA components of the resting recording"
  (Open); 3.4 Clinician in control ("in the core, at the latest in the first module after it");
  Q8.
- **Proposal:** a chip on the Cleaning header "Core, or at the latest the first module after it
  (3.4)"; in the component detail the annotation "maps shown only to choose artefact components
  (3.4); the ICA component view as a result (table 3.3 Open, Q8) is not in the core"; rename the
  Open item "ICA component maps and spectra as a result view"; fix digest row 2. **S**

**A14. Settings state open proposals as settled (2)**
- **What and where:** Settings, "Where V4 runs": "... built and tested from the start but
  certified later" (`set.installText`, EN and DE); "Report service: Built in but switched off";
  "Export to Word". Only the hidden annotations say these are proposals.
- **Spec source:** 3.7 Where V4 runs ("whether we offer it is still open"); Q10 proposal (b);
  Q9 (a); Q14 (a); ADR 0004 (proposed).
- **Proposal:** "... is built and tested from the start; whether it is offered is open (Q10)", EN
  and DE; a visible "proposal" chip on all three rows. **S**

**A15. The clinic users table contradicts the agreed roles (2)**
- **What and where:** Settings, "Users of Clinic C" lists "Clinic admin · Templates and users" as
  a separate user (`shell.html` lines 351 and 428); the support grant is logged as "Clinic admin"
  (line 854). The night plan for D3 calls the assistant role an open question.
- **Spec source:** 3.5 Clinic templates (in the first release the company sets up templates); N10
  (decided 23 October: roles are sets of permissions; on the clinic side one role, clinician, with
  a clinic administrator permission given to the first clinician; an assistant role is not in the
  core and can be added later by configuration; company staff have no patient data by default;
  the report service is a separate permission, off; two-factor login for everyone).
- **Proposal (for the D3 build):** a permission matrix with users as rows and the columns
  clinician, clinic administrator, company staff, support grant and report service (off).
  Clinician 1 holds clinician and clinic administrator (users and support grants; templates by
  change request only). An assistant row greyed out: "not in the core; later by configuration
  (N10)". Two-factor login shown on each user row; the role switcher switches accounts. **S**
  within D3

## B. Missing for the meeting

**B1. Relative spectra and relative 1 Hz maps are missing (1)**
- **What and where:** PDF page 6 ("Absolute spectra per electrode") and page 5 (1 Hz maps). In
  Results > Spectra and maps, Relative keeps the spectrum in µV²/Hz and the maps labelled "1 Hz
  maps · absolute power, z" (`b_results.js` line 43); the data hold `maps_1hz_z` of absolute
  power only. The PDF spectra print y tick labels only on F7, too small to read.
- **Spec source:** table 3.3 "Absolute and relative spectra against norms" and "Maps per 1 Hz band
  against norms" (Core); V3 shows the relative difference spectrum per channel and relative 1 Hz
  z maps (audit 14a A3, A4).
- **Proposal:** relative spectra (percent) and relative 1 Hz maps in the data; the Relative switch
  changes both; a relative spectra block in the PDF; readable y ticks on the first panel of each
  row. **M**

**B2. The ERP figures in the PDFs are incomplete (1)**
- **What and where:** page 9 of all three PDFs (`render.py` ERP block, `figures.py`):
  - only Fz, Cz, Pz, O1 and O2, and only Go and NoGo, so the Novelty P3a in the table has no curve;
  - no Go versus NoGo overlay or difference wave;
  - scored peaks are not marked on the curves (only marked ones get a ring);
  - the CNV row prints "-200 to 0" in the latency column;
  - nothing says that for N1, N2 and CNV a negative z means a larger negativity.
  The prototype Report tab of CT-C already draws 19-channel grids with peak triangles. V3 draws the
  second-picture averages of all four trial types on the 10-20 grid against the norm, plus a
  Go/NoGo figure with the Go minus NoGo difference (audit 14b B.3).
- **Spec source:** table 3.3 Channel ERP waveforms against norms, ERP peak values (Core).
- **Proposal:** a 19-channel grid per trial type as the default block (Go, NoGo, Novelty; Ignore
  optional); the Go/NoGo overlay with the difference; a tick on every scored peak; the CNV window
  in a note; a footnote on the sign of N1, N2 and CNV. One figure for the PDF and the prototype.
  **M**

**B3. The VCPT recording, which all ERPs come from, has no cleaning view (1)**
- **What and where:** Cleaning tab: component activations exist for EO and EC only
  (`a_workspace.js` line 810), the before and after view covers eyes open 0:00 to 0:20 only (line
  869), and there is one component set and one Q-ICA sentence per measurement. The clinician
  cannot page through the cleaned signal of any recording. V3 runs ICA separately per task file
  and computes the ERPs on the cleaned VCPT signal (audit 41 step C; 40_loaders).
- **Spec source:** 3.4 Clinician in control; open question I8 in the v4 repository (every step
  interactive today stays interactive).
- **Proposal:** cleaning per recording (EO, EC, VCPT selector), each with its own components,
  proposal, choice, log line and Q-ICA sentence; the VCPT activation with stimulus markers; a Raw
  / Cleaned switch in the Recording viewer for the whole recording. Build after A5 and A10.
  **M**

**B4. The activity log is not yet an audit trail (3)**
- **What and where:** Activity log, EN and DE:
  - times show as "Today HH:MM" from the viewer's own clock, with no date or zone (at 19:15 the
    log says "Today 19:15" under "Good morning, Clinician 1", next to the worklist's "Today
    09:40");
  - actors are role labels, not accounts; no object column and no filter per case;
  - the log starts at page load (3 entries), so the issue of R-MOCK-042-0312 v1 in March is
    missing;
  - clinicians' reads (opening a patient, results or a report) are not logged, although the page
    says "every access";
  - Export does nothing (`shell.html` line 745); German entries show raw route names ("results von
    MOCK-042 ...").
- **Spec source:** 3.6 Who sees what ("every access and every issued report is logged"); N9.
- **Proposal:** a fictional clock (29 Oct 2026 from 10:05, advancing with real minutes; the
  greeting follows it). Columns: time (date, time, zone), account and role, action, object (case,
  measurement, report id and version, template version), source. Log views and downloads,
  collapsed per session. Seed about 20 dated entries across patients (upload, March issue,
  reprocessing) with filters for patient, actor and type; a History panel per case; Export writes
  a CSV; translate route names. **M**

**B5. The intended use is shown nowhere (1)**
- **What and where:** Settings > About. The meeting has to confirm the intended use, but no screen
  shows it.
- **Spec source:** 3.2 Intended use (to confirm: the clinical lead); intended-use section 1.
- **Proposal:** a short panel with the draft intended purpose and the chip "To confirm: the
  clinical lead": users (physicians and licensed psychologists or neuropsychologists), general
  clinical use naming no condition, the age range following from the usable norms, and the
  warnings, including review of the raw EEG. **S**

B6 to B11 are requirements for the items being built now. Hand them to the agents finishing those
items, or apply them right after.

**B6. Morning B3 build: frequency markers and the checklist over channel ERPs (2)**
- **What and where:** Results > Frequency markers, Channel ERPs, the report.
- **Spec source:** table 3.3 (frequency markers with automatic peak suggestions, Core, to confirm;
  checklist over channel ERPs, Core, to confirm, a proposal for the clinical lead); 3.4; Q6; open
  question I8 (the product owner, 23 October: marker placement with the significance check, the
  mu rhythm and beta spindle questions, the automatic peak search as a suggestion and the marker
  maps are in the core; 27 October: the checklist goes to the meeting); V3 behaviour in audit 14d
  D4.2; hard rule 4.
- **Proposal:**
  - Markers per electrode on the absolute or relative spectrum, for EO, EC and VCPT. The
    automatic search suggests at most 3 peaks, inside V3's per-electrode frequency windows.
  - The significance check offers the electrode with the larger marked deviation (M33), not
    V3's 2 z strip, and does not fail when the chosen electrode is already the most extreme one.
  - The mu rhythm question (C3, C4, 8 to 13.5 Hz) and the beta spindle question (F3, Fz, F4, 18
    to 22 Hz) are answered by the clinician and shown as clinician entries.
  - Report table: number, condition, electrode, frequency, z (naming absolute or relative),
    clinician note; a fixed sentence when no marker is set (TG4). One map per marker, with a
    caption z that matches the map.
  - Checklist: rows per scored channel ERP component and trial type, neutral columns only
    (reviewed; peak identifiable yes / no / uncertain; latency inside the norm band yes / no;
    comment), never normal or abnormal and never a condition (intended use section 4, TG6). It
    is a clinician block; the system writes no prose. V3 has no checklist over channel ERPs, so
    its content is a mockup assumption.
  - Chip "Core, to confirm (Q6)" on both tools (see A12).
  - **L** (in progress)

**B7. Morning B5 build: any number of measurements, frozen result sets, explicit current (3)**
- **What and where:**
  - The night plan offers a picker for "any two measurements" and pairwise sentence keys.
  - The Patient page shows the 12 Mar measurement as "V4 mockup 0.1, reprocessed 29 Oct" with one
    result set; R-MOCK-042-0312 v1 has no link to its results; L-REPROC-1 names the same versions
    as the original run, so reprocessing has no visible purpose.
  - Live tree: M0 is appended as `measurements[2]`. Since the snapshot, `render.py`,
    `rounding_parity.py` and `build_data.py` read an explicit `current_index`, which removes the
    main risk the CTO found (the 2025 measurement printed as current).
- **Spec source:** 3.4 Comparison of measurements ("any number of a patient's measurements side by
  side, each compared with its own norm, descriptive only"; earlier measurements are processed
  again and the report says so); 3.8 Reproducibility (issued reports and stored results never
  change); F12, N13, N14.
- **Proposal:**
  - A multi-select (two or all three measurements) on Compare and in the report block, one value
    and z column pair per measurement, each with its own age and norm; no "change" or
    "improvement" wording (the change test is Not planned).
  - Two result sets for 12 Mar: set 1 (software 0.1, Mock norms 2026.1), frozen and used by
    R-MOCK-042-0312 v1; set 2 (current software and norms) used by the comparison. The same for
    M0. L-REPROC-1 names both, once per reprocessed measurement.
  - One helper for "current" (explicit id, else the latest date) and "earlier" (the rest by
    date), used by `render.py`, `build_data.py` and the checks; a check that the sample PDFs carry
    R-MOCK-042-0915 and list measurements in date order.
  - **M**

**B8. Morning B6 and D4 builds: error, rejected and empty states (3)**
- **What and where:** the worklist's MOCK-022 "Rejected: quality. Eyes closed: 61 of 180 s usable"
  rejects the whole measurement for one short condition, while MOCK-057 is planned so that only
  that condition gives no results; MOCK-061 "Age 75 outside the norm range". The rejected empty
  state offers only "Undo rejection", twice (banner and card), with no icon and no way forward;
  "No issued report yet" looks different. The Patient page has no row for the current draft, and
  the 12 Mar row does not open.
- **Spec source:** intended use section 5 (draft: below a data quality minimum "no comparison or a
  visible mark"; patients within the age range of the norms, "no comparison outside it"); 3.2
  Intended use; 3.4 Earlier recordings; M45, M53.
- **Proposal:**
  - A per-condition automatic quality gate, kept distinct from the clinician's rejection of the
    whole recording (different chips and sentences). MOCK-057: the short condition gives no
    results and a fixed sentence; the other conditions show normally.
  - MOCK-061: signal quality and absolute values only; no z, percentile, norm band, marks, summary
    or comparison sentences; no report can be issued (fixed reason). Whether to block or to allow
    with a mark is shown as open for the clinical lead.
  - Every error state has a fixed message id and a log entry.
  - One state component (icon, title, a one-line cause, a primary next action such as "New
    measurement for MOCK-042", a secondary action such as "Undo rejection"), used for rejected,
    not issued, error states and the first-day clinic. The first-day text says that V4 starts
    without patient data, nothing comes over from V3, and a comparison needs the earlier recording
    uploaded again.
  - A draft row on the Patient page; earlier measurements open (with B7).
  - **M**

**B9. Morning D3 build: the identity store on the new-patient form (1)**
- **What and where:** Upload > "New patient…"; `data.json` nests `case.identity_store` inside the
  analysis case.
- **Spec source:** 3.6 Separate identity store; F3 (the identity store holds name, birth date,
  the clinic's patient number, original files with identifying headers, free text and PDFs;
  processing sees only the case code, the age at recording and sex, on a working copy with the
  header identity removed).
- **Proposal:** two columns on the form, "Identity store (clinic key)" and "Analysis (case code)",
  with each field placed; at upload the line "header identity removed from the working copy";
  identity data exported separately from the case in `data.json`. The permission matrix (A15) and
  the grant dialog (A2) belong to the same build. **M**

**B10. Morning D5 build: method block, anamnesis and recording conditions (2)**
- **Spec source:** intended use section 4 (no anamnesis or questionnaire text in any sentence) and
  section 5 (recording conditions documented by the user); I5 (anamnesis, history, medication,
  current symptoms); TG10; hard rule 5.
- **Proposal:**
  - Method and norms block: reference (average of 19 channels), filters, sampling rate, window
    length and overlap, band edges, the denominator of relative power, the norm group (age band,
    number of subjects per condition), ERP averages of correct trials only (V3 rule, audit 14b
    B.2), the peak windows and the CNV window. It says "Mock norms 2026.1, synthetic" and
    "stand-in correction (M33)", never "legacy norms".
  - Recording conditions at upload, with neutral synthetic values, declared as a mockup
    assumption: medication and time of the last dose ("none"), sleep the night before, time of
    day, corrected vision (matters for P1 and N1), response hand, the technician's notes on
    alertness.
  - Anamnesis fields with values that point to no condition: medication "none", no stimulant, no
    symptom words; symptom fields as placeholder text. Anamnesis never feeds a system sentence.
  - **M**

**B11. Morning D6 build: what the reproducibility rows need (1)**
- **What and where:** the Versions block (prototype and PDF) and the Overview "Processing" card.
  Sentence ids are printed (M9), but there is no text library version, no device block catalogue
  version and no id for the marking method.
- **Spec source:** 3.8 Reproducibility; I5 (software version shown as the unique device
  identifier, UDI-DI); N12, N33; F17.
- **Proposal:** result set id; input checksum of the de-identified working copy (signal only, so a
  re-upload matches; the original file's checksum lives in the identity store only); ICA seed
  derived from the recording and stored, not random (N12, spike S10); software and norms with the
  norm dataset version (N33); text library "2026.1 (DE not reviewed)"; device block catalogue
  version; marking "Benjamini-Hochberg q 0.05 per block (M33, stand-in)"; a UDI-DI placeholder (a
  later language means a new UDI-DI, F17). The same rows in the PDF and on the Issued view. **S**

## C. Should fix (quality, consistency)

**C1. Differences from V3 and additions beyond table 3.3 are not declared, or read as decided (3)**
- **What and where:**
  - Narrower than V3, declared nowhere: (a) theta/beta ratio only at Cz, where V3 prints Fz, Cz
    and Pz with percentile rank and Stanine plus three maps (audit 14a A7), yet M3 calls it "the
    legacy ratio"; (b) alpha peak only as a posterior mean, where V3 gives it per channel plus a
    7-channel average including F3 and F4 (A8); (c) reaction time variability as the standard
    deviation (86 ms), where V3 prints the standard error labelled Var(RT), about 9 ms here
    (audit 14b B.2), so a V3 reader sees a tenfold rise; (d) z only, no percentile rank or
    Stanine; (e) V3's reaction time over trials figure and reaction time histogram (14b B.5) are
    neither in the core nor under "Not in this release"; (f) relative power as a percentage of 1.5
    to 30 Hz, V3 3 to 30 Hz; (g) global coherence on a 0 to 1 scale, where V3 prints the
    exponential of a band sum (values like 7.8); (h) at least 120 s analysed, V3 stops below 90 s.
  - Read as decided: "New in V4: asymmetry per pair and band against an age norm" (`b_results.js`
    line 160), with no README assumption; P3a at Cz (Novelty) printed in the PDF peak table and
    gating issue (M52), although table 3.3 lists only P1/N1, N2, P3 and CNV, with the caveat
    (M40) visible only with annotations.
- **Spec source:** 3.1 Roles (the clinical lead decides every deliberate difference from V3; to
  confirm); 3.8 Comparison with V3 (every deliberate difference listed and explained); the v4
  repository's working agreement (never drop a legacy function silently); morning C8.
- **Proposal:** reword to "Deliberate difference from V3, for the clinical lead to decide (3.1
  Roles)"; one README line and one annotation per item; (e) under "Not in this release" with
  "status to decide"; P3a either dropped with its gate, or labelled "beyond table 3.3, for the
  clinical lead" in the `--annotate` PDF and the prototype. Optionally one "Differences from V3"
  page listing each item with source and "decided / to decide". Take (a), (c), (d) and (f) to the
  clinical lead as questions. **M** (S without the page)

**C2. The comparison leaves out marked values without saying so (2)**
- **What and where:** `textlib.comparison_sentences(top=6)` (line 789); route Compare, the report
  block, PDF page 11. CMP-1 lists the 6 largest of 25 marked values and does not say it is a
  selection. Left out: SMR asymmetry C3-C4 (z 3.6, then 4.2) and P1 latency at O1 and O2, both
  marked in both measurements, which also hides the "mixed on purpose" design of M1. The Compare
  page lists ERP amplitudes but no latencies and no asymmetry, so P1 latency cannot be compared
  at all. The PDF comparison maps show absolute power while the sentences quote relative theta.
- **Spec source:** 3.4 Comparison of measurements; 3.2 No interpretation (a fixed rule that never
  leaves out a deviation above a set size).
- **Proposal:** a rule sentence CMP-RULE-1 with a count ("6 of 25 shown, ranked by |z|"), and list
  the 6 largest plus every value marked at 3 z or more in either measurement, as SUM-RULE-2 does;
  latency and asymmetry rows on Compare; maps of the analysis the sentences quote. Apply with the
  B5 sentence keys (B7). **S**

**C3. The summary is a wall of text without a reading key (2)**
- **What and where:** Overview, Results > Summary, the report preview and PDF page 2. SUM-2 is one
  sentence with about 25 values over 7 lines and the first thing on every results screen; PDF
  page 2 is otherwise 60 % blank. What z, the ring and "marked" mean (L-Z-1, L-MC-1) is explained
  only on the last page. The maps carry a dotted 2 z line (`figures.py` line 85) that no legend
  explains, also in maps without a marked value.
- **Spec source:** 3.2 No interpretation (summary by a fixed rule); M7.
- **Proposal:** the same ranked items as a compact table built from fixed templates (analysis,
  condition, sites or pairs, z on the fixed scale with the ring; each row links to its figure),
  in the PDF as a device block after the sentence; SUM-2 below it, collapsed, "As printed in the
  report"; a reading key on the summary page for z, the colour scale, the ring and the dotted
  line. **M**

**C4. Results are visible before segments and cleaning are confirmed (2)**
- **What and where:** the Overview "Summary of results" shows all z values while segments and
  cleaning are "Proposed, waiting for review", without the "Preliminary" banner of the Results
  tab. Reviewing the cleaning with the results in view invites choices driven by the results, a
  use-related risk for the risk file.
- **Spec source:** 3.4 Clinician in control (silent on the order); M26.
- **Proposal:** label the Overview summary preliminary now. For the meeting, offer two options as a
  mockup assumption: hide z values and marks until both are confirmed, or keep them visible and
  log which result set was on screen at each choice. **S**

**C5. Workspace stepper, tabs and the issue checklist disagree (1)**
- **What and where:** the workspace header (`shell.html` `workspace()`) shows "Processed ›
  Segments › Cleaning › Report › Issued" while the tabs say "Recording … Results …". After the
  cleaning is accepted, the pipeline shows Report as current and Results has no chip, while issue
  is still blocked by the alpha marker and three trial types (M52). A rejected recording still
  shows "review" on Recording. The Report side panel "Before issuing" lists 9 warnings with one
  amber icon (6 block issue, 3 are advisory), and repeats the 6 under the disabled button.
- **Spec source:** 3.4 Clinician in control; M52.
- **Proposal:** make the tabs the stepper (Recording ✓, Cleaning ✓, Results "4 not confirmed",
  Report "draft", Issued); drop the separate pipeline chips; no review chips when rejected. One
  checklist with "Required to issue" (lock icon, "4 of 6 done", each item a link to where it is
  fixed) and "Recommended" (empty clinician texts); remove the duplicate list. **S**

**C6. Wording the clinical lead will stop at, German and English (2)**
- **What and where:** `textlib.py` lines 278 and 288 (`state.later`), `a_workspace.js` lines 75 and
  76, `shell.html` line 484, German interface and sentences, English worklist and segment texts.
  - "P1 latency ... is later than the age norm" becomes "is longer than the age norm"; German "ist
    später als" becomes "ist länger als".
  - "Kerbfilter 50 Hz" becomes "Notch-Filter 50 Hz"; "Bipolar längs" becomes "Bipolare
    Längsreihe"; "Gerät" for device blocks (35 times, reads as the amplifier) becomes "System" or
    "Systemblock"; "Normen" (technical standards) becomes "Normdaten"; "Klinikkopf" becomes
    "Briefkopf der Klinik".
  - "Klinikerin oder Kliniker" and "Kliniker 1": one convention throughout; the proposal is
    "Untersucherin oder Untersucher" in sentences, since users include psychologists.
  - Consistent: "multiples Testen" and "multiple Vergleiche"; "0,5-Hz-Intervall" and
    "0,5-Hz-Schritt"; "1102" and "1.102". Ask the clinical lead whether "Kanal-EKP" is preferred
    to "Kanal-ERPs".
  - English: "Eyes closed: 61 of 180 s usable. Record again?" becomes "Record eyes closed again
    (61 of 180 s usable)"; "Upload 62% (38 MB)" in Next step becomes "Waiting for upload";
    "Blink / Proposed: blink" becomes "4 s · blink detector"; "Duration 6 min 40 s (automatic)"
    becomes "Processing time"; "VCPT 20 min" next to 1220 s becomes one style ("20 min 20 s").
- **Spec source:** M10, M32 (drafts, not reviewed).
- **Proposal:** as listed. **S**

**C7. The "Not in this release" panel misstates the module model and offers a way into studies
(2)**
- **What and where:** the Results rail heading (`b_results.js` line 34, `b.notRelease`; German
  "Nicht in dieser Ausbaustufe") groups later modules (separate certified devices), Open,
  Research only and Dropped items (never in V4). A disabled "Request study access" button (line
  347) next to one patient's results suggests a path from care into an investigational module.
- **Spec source:** 3.1 Modules and Functions outside the core (Decided); table 3.3 legend; ADR
  0005 (proposed: a separate research workspace with no path into reports).
- **Proposal:** heading "Outside the core (table 3.3)" / "Außerhalb des Kerns"; remove the button;
  if anything, one Settings line "Studies run in a separate research workspace (ADR 0005,
  proposed)". **S**

**C8. Ratio gauges look like sliders, and the errors chart merges two error types (2)**
- **What and where:** Results > Ratios and indices and VCPT behaviour: the gauges use a round knob
  on a track, so they invite dragging; VCPT shows 3 cards and leaves the 4th alone on a second
  row. "Errors per block" (PDF page 10, `figures.py`, `b_results.js` vcpt(), `synth.py`
  errors_per_block) draws one series although the subtitle names omissions and commissions. V3
  shows omissions and NoGo commissions as separate bars with counts, plus a trials per block chart
  (audit 14b B.5).
- **Spec source:** table 3.3 Errors per block of 40 trials (Core, a figure without norms).
- **Proposal:** a shaded norm band with a thin tick and a value label; a 4-column grid; two series
  (omissions, commissions) with counts and a legend, both stored per block. **S**

**C9. The posterior theta deviation is drawn as a tenfold notch (1)**
- **What and where:** PDF page 6 (O1, O2, Pz, P3, P4, eyes closed), Results > Frequency markers,
  the stable deviation in `synth.py`. At 6 Hz, eyes closed, O1 has 0.45 µV²/Hz against a norm of
  4.7; at 3 Hz it is 0.6 of the norm and at 9 Hz normal, so the posterior mean dips below the -2
  SD band in a V shape. Real spectra have no tenfold notch between normal delta and normal alpha.
- **Spec source:** hard rule 1 (plausible); M1.
- **Proposal:** a broad, shallow reduction over 3 to 8 Hz, at most about 0.3 log10 in any bin,
  reaching the M1 target (relative theta z about -4) through the band sum; lower the target in M1
  if it cannot be reached this way. Reseed with A7. **S**

**C10. The P1 latency deviation suggests a clinical story (1)**
- **What and where:** PDF page 9, Results > Channel ERPs (Go, O1 and O2), the summary; `synth.py`,
  M1. P1 is 144 ms (148 ms earlier) against a norm of 115 ms on both sides. A bilateral
  occipital delay of the first visual component reads like a delayed visual evoked potential and
  prompts questions about vision or the visual pathway, which M1 wants to avoid.
- **Spec source:** hard rule 5 (its intent); M1.
- **Proposal:** replace it with an amplitude deviation without a conventional reading, for example
  a larger N1 at O1 and O2 in Go trials; keep NoGo P3, N2 and CNV near the norm; update M1 and
  M54. Reseed with A7. **S**

**C11. The ERP norm bands are too narrow (1)**
- **What and where:** the grey band in all ERP figures and the peak z values; `synth.py`, M5,
  M34. The pointwise norm SD is 1.6 to 2.5 µV over the whole epoch, so mean ± 2 SD is about ± 4
  µV around a P3 of 15 to 18 µV. Peak SDs are 20 % of the amplitude and 2 ms plus 5 % of the
  latency (P1 7.8 ms, Go P3 27 ms). At age 10 children differ much more, especially in P3
  amplitude and latency, so peak z values are inflated and the band will not match the V3 band
  the clinical lead reads daily (audit 14b B.3).
- **Spec source:** hard rule 1 (plausible); M5, M34.
- **Proposal:** ask the clinical lead for typical spreads, or use about 30 to 40 % for the
  amplitude SD and about 5 ms plus 10 % for the latency SD; re-tune the stable deviations;
  update M5 and M34. **M**

**C12. The report's raw EEG excerpt shows a blink in cleaned data, and the system picks it (1)**
- **What and where:** page 3 of the three PDFs; `synth.py` raw_excerpt (blinks at 1.4, 4.9 and
  8.2 s, eyes open), `figures.py` raw_excerpts_svg. The caption says "the first 4 s of the
  analysed segments" and Q-DUR-1 says "after artefact removal", yet the eyes open panel shows a
  140 µV blink at Fp1 and Fp2 while the report says the blink component was removed. The caption
  says "average reference", but the blink has no mirrored negativity at posterior sites. In V3 the
  clinician places markers and the report shows 8 s around each from the cleaned signal; without
  a marker the block is dropped (audit 14a A2; 40_loaders).
- **Spec source:** table 3.3 Raw EEG excerpts (Core, display only); 3.4 Clinician in control;
  M42.
- **Proposal:** "Add excerpt to report" in the Recording viewer (8 s, logged, time printed); draw
  excerpts after cleaning; leave the block out when nothing is chosen; apply the average
  reference to the synthetic excerpt; update M42. **M**

**C13. Raw EEG is drawn positive up, against clinical convention (1)**
- **What and where:** the Recording viewer (`a_workspace.js` line 399, `yy = y0 - s[i] * k`) and
  the PDF excerpt (`figures.py` raw_excerpts_svg): blinks deflect upward at Fp1 and Fp2, with no
  polarity label. The clinical convention in Germany, the rest of Europe and Japan is negative up.
  The ERP plots are labelled "positive up", which is fine (M28).
- **Spec source:** hard rule 1 (plausible); 3.4 (the clinician reviews the raw EEG).
- **Proposal:** negative up by default, stated in the viewer toolbar and the excerpt caption; an
  optional switch. **S**

**C14. No drowsiness reason and no bipolar montage (1)**
- **What and where:** the exclusion types (`a_workspace.js` line 115: blink, muscle, electrode,
  movement, manual) and the rejection reasons have no drowsiness, the most common reason to
  distrust a 3-minute eyes closed recording of a child. The montage select offers only average
  reference; "Bipolar longitudinal" is disabled (line 548), although the montage is display only.
- **Spec source:** 3.4 Clinician in control; M24.
- **Proposal:** "Drowsiness" (German "Müdigkeit, Vigilanzminderung") as an exclusion type and a
  rejection reason, and the awake state in the issue confirmation (M24); enable longitudinal and
  transverse bipolar montages for display while the analysis reference stays stated. **S**

**C15. The asymmetry map draws one value at both electrodes; the sentence gives no side or size
(1)**
- **What and where:** PDF page 7, prototype Report "Asymmetry maps", `figures.py`, ASY-1, M35.
  Each pair's z is drawn at both of its electrodes, so for SMR both C3 and C4 are dark red, which
  reads as "high at both". V3 shows (R-L)/(R+L) at the right electrode and its negative at the
  left, with the midline at 0 (audit 14a A6). ASY-1 gives only z; the index value (0.24, more SMR
  at C4) is printed nowhere. The Results tab's one line per pair works better.
- **Spec source:** table 3.3 Asymmetry map (Core); M4, M35.
- **Proposal:** the V3 convention or the pair line in the PDF; ASY-1 as "SMR asymmetry index C3-C4
  is 0.24 (more power at C4), above the age norm (z = 4.2)"; a small table of marked pairs, as for
  coherence; update M35. **S**

**C16. A template save is live at once, without validation, and open drafts change silently (1)**
- **What and where:** Templates as company staff, `c_report.js` `save()` (lines 1151 to 1157).
  Band power, Coherence and Comparison removed and saved: CT-C v4 is in use at once, and the open
  MOCK-042 draft switches to v4 without notice (the log says only "Saved report template CT-C as
  version 4"). The draft still prints SUM-2 with relative theta and beta1 coherence, SUM-COUNT-1
  with "coherence 15 of 2052" and L-REPROC-1, although no block shows them; the PDF check
  `check_sentence_blocks` rejects exactly this. The claim-word gate tells company staff to "Send
  to company review". The block list names "Comparison with 12 Mar 2026", a patient's date inside
  a template. The default introduction states the device method, against TG10.
- **Spec source:** I6 (validated against the schema before save, versioned with a change log);
  3.5 Clinic templates; M36.
- **Proposal:** save opens a validation panel (required blocks, sentence and block dependencies,
  approved fonts and minimum size, claim words, both languages render), then "Submit for
  release", and a second company role releases it. Open drafts show "Template updated to v4 by
  the company: review the preview" and keep v3 until the clinician accepts. Generic block labels
  in templates. **M**

**C17. Whether a template is valid depends on the patient's data (1)**
- **What and where:** `render.py` lines 884 to 897 fail a template only when this case's summary
  names a marked value whose block or condition is missing. All three sample templates show the
  1 Hz maps for eyes closed only (`spectra.maps1hz`), so they pass for MOCK-042 and would fail for
  a patient with a marked eyes open 1 Hz value.
- **Spec source:** 3.2 No interpretation (the summary never leaves out a deviation above a set
  size); I6.
- **Proposal:** a rule independent of the case: with the summary present, every family it ranks
  needs its block for every condition it ranks. Or the summary states "not shown in this report:
  ..." and still names the values. The clinical lead decides; a mockup assumption until then.
  Show one failing template in the editor. **S** (M with the editor panel)

**C18. The summary count leaves out two families (1)**
- **What and where:** SUM-COUNT-1 and SUM-RULE-2 (`textlib.py` lines 150, 594 and 721) omit the
  spectrum per 0.5 Hz bin (2,242 values) and global coherence (12). SUM-2 does not rank them
  either, so a marked bin of any size would appear in neither the summary nor the count.
- **Spec source:** 3.2 No interpretation (a summary that never leaves out a deviation above a set
  size); M7; morning A6.
- **Proposal:** add "spectrum per 0.5 Hz bin 0 of 2242" and "global coherence 0 of 12" to
  SUM-COUNT-1. Either rank marked bins of 3 z or more as frequency ranges per site, or list the
  exclusion in the digest as an open point for the clinical lead. **S**

**C19. Sentences are printed for unmarked values (1)**
- **What and where:** TBR-1 and FAA-1 (always), APF-IN-2 and BEH-IN-2 (when not marked) restate
  values at z 0.0 to 0.9, about ten sentences per measurement (Results ratios and VCPT, the
  report, Clinic C PDF pages 4, 7 and 10). M6 and the `textlib.py` header say that only marked
  values get sentences.
- **Spec source:** 3.2 No interpretation (proposal: one sentence for each value beyond a set
  threshold); M6.
- **Proposal:** drop them (the tables already show the values), or declare a separate sentence
  kind "always printed restatement of single-value measures" in M6 and digest row 4 for the
  clinical lead to confirm. **S**

**C20. The mock norm age range copies the classifier's range (1)**
- **What and where:** Upload "Mock norms 2026.1 (ages 6 to 67, synthetic)" (`shell.html` line
  381), M31, MOCK-061. 6 to 67 is the range table 3.3 gives for the classifier row, not a norm
  range.
- **Spec source:** 3.2 Intended use (the age range follows from the usable normative data; to
  confirm); intended use IU1, IU2.
- **Proposal:** a range not taken from the classifier, for example 6 to 58 (IU2 (b)), with
  MOCK-061 at 75 still outside; label it "mock range; the real range follows from the usable norm
  data (3.2, to confirm)"; update M31. **S**

**C21. Thresholds chosen for the mockup carry no assumption mark (1)**
- **What and where:** Recording tab "Min 120 s" (eyes open and closed) and 900 s (VCPT)
  (`a_workspace.js` line 126, M25); the issue gates (M52); the low trial warning below 50 (M8).
  Even with Annotations on, the Min column has no badge, so they will be read as requirements.
- **Spec source:** working agreement (never present a mockup choice as a decision).
- **Proposal:** badges "Mockup assumption M25", "M52" and "M8". **S**

**C22. The "Checksum" on the Issued view is not a document checksum (1)**
- **What and where:** Issued footer "Checksum ec00 32fd a206 ba9f" (`c_report.js` line 959): a hash
  of the version, the clinician texts, the template version and the issue time. It covers neither
  the PDF nor the results, yet reads as the PDF's integrity value.
- **Spec source:** 3.8 Reproducibility (issued reports never change); N13.
- **Proposal:** label it "PDF SHA-256 (mockup placeholder)" with 64 hex characters and repeat it in
  the issue log entry, or remove it. **S**

**C23. The clinic's read-only template view looks like a broken editor; the outline truncates (1)**
- **What and where:** Templates as a clinic user: 63 disabled ↑ ↓ × buttons, disabled accent
  swatches, the font select, "Replace…", logo left and right, read-only inputs and a "No claim
  words" check. The Report outline cuts names that differ only at the end ("Band power, eyes o…"
  and "Band power, eyes cl…"; German "Bandleistung, Auge…" twice, identical).
- **Spec source:** 3.5 Clinic templates; M35.
- **Proposal:** the clinic view as a clean spec sheet (block list without controls, theme as text
  and swatch, clinic texts rendered, one primary "Request a change…"); the editor only for company
  staff. Outline: two lines, about 260 px wide, or short labels with the full name in `title`.
  **S**

**C24. Default band selections open on empty views (1)**
- **What and where:** Results > Coherence opens on Theta ("0 of 171 pairs marked", an empty head),
  while the marked pairs and the sentence card below are beta1. Asymmetry opens on Alpha (none
  marked), while SMR C3-C4 is the marked value.
- **Spec source:** none (usability).
- **Proposal:** open on the band with the most marked values; coherence as six small heads, as
  Asymmetry does; filter the sentence card to the selected band. **S**

**C25. Keyboard access and contrast (1)**
- **What and where:** Worklist, "Recently issued" and Patients rows are `tr` elements with onclick
  and not in the tab order; "Open" is a `span`. No skip link (14 tab stops before the content).
  The focus outline `#354b6a` on the navy nav and hero is 1.5:1; control borders `#cbd3dd` on
  white 1.51:1; muted 11.5 px table headers 4.36:1; the lime wordmark 2.85:1; the template header
  inputs have no label.
- **Spec source:** none (accessibility of the published page).
- **Proposal:** the patient cell as a link and "Open" as a button; a "Skip to work area" link; a
  lime focus ring on navy surfaces, or a white inner and navy outer ring everywhere; `--line-2`
  about `#8e99a8` and muted about `#5d6a7c`; labels on the inputs. **S**

**C26. Brand colours drift and components are inconsistent (1)**
- **What and where:** `shell.html` `:root` tokens and modules. The chrome navy is `#2a2e47`, but
  primary buttons, selection and focus use the slate `#354b6a`. Lime serves brand, selection, the
  nav count, the tab underline, done steps, the clinician chip and ok banners, while "Issued"
  uses green `#1f7a55`: two "done" colours. In dark mode the hero is `#0d111a` on `#11151f`
  (1.03:1), so the navy and the M27 cover motif vanish. There is no `a` style (browser blue,
  lavender in dark mode); `th.num` headers and some buttons are in the mono font; title-only
  "Summary" cards add a row of chrome.
- **Spec source:** M27, M30.
- **Proposal (with the D7 build):** one navy token for chrome and primary actions; dark mode keeps
  a navy near `#1f2440` with the lime trace; one success colour; a non-lime clinician chip; status
  reds (Rejected, No norm) visibly different from the z scale red, for example with an icon; a
  link token; tabular sans numerals, mono only for ids and codes; section titles folded into the
  toolbar. **S**

**C27. Narrow and inner overflow (1)**
- **What and where:** at 1360 px the Upload recording-system table scrolls inside its card (the
  File column is cut) and repeats the select above it; the Compare map rows scroll, so Beta1 is
  cut and Beta2 hidden. At 400 px the nav wraps to 3 rows; worklist cells and the Cleaning banner
  wrap one word per line; the workspace tabs scroll with "Results" cut and no cue.
- **Spec source:** the published page must work at phone width without horizontal page scroll.
- **Proposal:** below 720 px a menu or bottom tab bar and rows as cards; `.banner` with flex-wrap
  and the message at `flex: 1 1 220px`; an edge fade on the tab scroller; remove the duplicate
  upload table and show the file type under the select; Compare with measurements as rows and
  bands as columns, smaller heads. **M**

**C28. Worklist counts and ordering do not match (1)**
- **What and where:** the hero says "3 measurements wait for you" and the nav badge 3, but "Mine"
  lists 6 rows; after a rejection the hero says 2 while 6 rows remain. "Recently issued" is not
  sorted (21, 12, 20, 17, 15 Oct).
- **Spec source:** none (consistency).
- **Proposal:** group the worklist as "To review (3) · Needs action (2) · In progress (1)" so the
  counts match the rows; sort "Recently issued" by date. **S**

**C29. PDF pages are sparse and carry developer wording (1)**
- **What and where:** sample PDFs, Clinic C pages 2, 8, 9 and 10. "Start on new page" leaves page
  2 at 40 % and page 10 at 35 %. The running header prints "#2" while the footer prints "Page 2
  of 12". The footer carries the logo box and the address on every page. Five empty "Clinician's
  comment" boxes say "Written in the V4 report editor; the system does not write here". Page 2 of
  the template coverage PDF starts with an orphan one-row table (T16).
- **Spec source:** M17, M36.
- **Proposal:** new-page breaks only for major sections (Spectra and maps, ERPs), keep together
  elsewhere; drop the "#n" header; a slim footer after page 1; in the sample one clinician block
  labelled "Clinician block, empty in this sample", empty ones left out of issued reports; keep
  the coverage table rows together. **S**

## D. Ideas for the meeting with the clinical lead and the CTO

**D1. Issuing as a signature, and an issued sample PDF (1).** Only the issued PDF leaves the system
(3.5), but the meeting sees only drafts ("Issued by ____"), and the issue dialog is one checkbox.
Ask for re-authentication at issue (a mockup assumption building on the two-factor login of N10).
Render an issued Clinic C v1 and a v2 correction carrying "Replaces v1" and the reason, so the
version chain is visible on paper. **M**

**D2. Make "Download PDF" real (1).** On the Issued view it only shows a toast ("mockup: no file
is created") and there is no print stylesheet. A `@media print` stylesheet that prints only the
report pages lets "Download PDF" open the browser's print to PDF. Spec source: 3.5 Blocks. **S**

**D3. Versioned device block references with enumerated variants (1).** The clinic templates use
refs such as `spectra.maps` with free params (`relative`, `conditions`, `seconds: 4`, `height_in:
3.0`, `global`, `overlay_earlier`, `trials`); `render.py` tags blocks internally as `summary@1`,
but neither the template nor the PDF shows it. Every combination is a separate output to verify.
Proposal for the CTO: refs pin a version and a variant (`spectra.maps@1:abs+rel`); a device block
catalogue lists each block, version and variants, and the schema rejects anything else; "Device
blocks 2026.1" in Versions; a variant picker in the editor. Spec source: I6. **M**

**D4. Deletion and consent withdrawal (1).** Patient page and Settings, "Data". A "Delete patient
data" dialog: what is deleted (identity entries, original files, results, PDFs), what stays (audit
entries without identity, released dataset versions), backup expiry "period to agree"; "Withdraw
consent" per purpose and per measurement; both logged. Spec source: 3.6 Consent and Keeping and
deleting; N5. **M**

**D5. The one chance mark sits at the coherence estimation floor (1).** Fp2-T4 beta1 coherence,
eyes open, 0.008 (z -3.9), PDF page 8 and the summary: a value at the floor of what a 3-minute
recording can estimate reads as an artefact of the estimate, not as a chance deviation. Choose the
seed so that the chance mark falls on a mid-range value (M1). Reseed with A7. **S**

**D6. ERP peaks snap to extrema (1).** Results > Channel ERPs (`b_results.js` clampMs and commit):
a moved peak can be dropped on any sample of its window, including a slope, and its amplitude is
read there. Snap to the nearest local extremum of the right polarity, with free placement on a
modifier key, and show the norm peak latency as a tick. Spec source: 3.4; M34. **S**

**D7. Sentence ids out of the clinic PDFs (1).** The grey ids after every sentence (M9) get in the
way of a referring clinician. Keep them in the annotated build and in the prototype's annotations;
leave them out of the clinic PDFs, or move them to a footnote list. **S**

**D8. The destructive action sits next to the primary one (1).** Cleaning action row: "Reject
recording" (danger) comes first, right beside "Accept cleaning". Put the primary on the right and
move "Reject recording…" to a separate "Recording" menu or the far left, keeping its confirm
dialog. **S**

## Dropped or reconciled

- **Live document:** unchanged in substance since the morning copy; the README references to the
  shared document of 29 October still match. Two suggested insertions were rejected at 12:11 and
  12:13 UTC and are not in the text.
- **Open suggestions without effect today:** who owns the VCPT pictures (the mockup shows none and
  should keep it so until the clinical lead answers); the rights and consent of the norm
  recordings (the norms are invented, M2; revisit the "norms" purpose on the Consent card and the
  norm labels once answered); the certification cost question in 3.1 (no bearing). The extracts
  of the live document keep its own text and stay outside the repository.
- **Current measurement chosen by list position (CTO):** fixed in the live tree since the snapshot
  (`current_index` in the case, read by `render.py`, `rounding_parity.py` and `build_data.py`).
  Only the shared helper and the check remain, in B7.
- **Workflow chip wording:** "review pending" (specification reviewer) and "not confirmed"
  (clinical reviewer); A4 takes "not confirmed", which matches the PEND sentences ("not yet
  confirmed by the clinician").
- **SUM-RULE-2 wording "shown as a mean per band in the coherence section":** not taken. Global
  coherence is an optional block (M35), so the sentence would be false in templates without it;
  A3 uses the product reviewer's wording.
- **Results not recomputed (A9) against M39:** M39 already declares that moved peaks are not
  re-ranked; A9 covers segment and component changes, which no assumption covers.
- **Asymmetry drawn at both electrodes:** declared in M35; kept as C15 because of the reading
  problem, not because it is undeclared.
- **"Global coherence ... (defect D2, 14a)" in the clinical review:** the defect id is left out of
  C1 (g), because D2 names the ICA rank defect in A10.
- **Assistant role as an open question (night plan for D3):** superseded by N10; see A15.
- **Spec status chip on the frequency marker tool:** kept on the tool built in B6, moved off the
  alpha peak (A12).
- **Findings on items being built now without a concrete new requirement:** none were left after
  merging; "fits D3", "reuse for B6 and D4" and "with D7" remarks were folded into A2, A15, B8,
  B9 and C26.
- **Checked and confirmed in the snapshot or the audit:** equal total power front and back (A6),
  the rising spectra in all four recordings and the alpha ratio (A7), the tenfold notch (C9), the
  19 components and B4 and L9 (A10), the two cleaning wordings (A5), the missing guard in
  `APP.undoReject` (A2), the chip on the alpha peak (A12), the Japanese tag (A11), the standard
  error Var(RT) in V3 (C1 (c)), the 0.008 coherence (D5). No finding was found wrong.

## Next

Start after the night round (agents P, J1 and J2) has finished, because it owns the same files.
Batches 2 and 3 touch disjoint files and can run in parallel after batch 1; batch 4 comes last.
Within a batch, the order is the order of the list. Hand B6 to B11 to the night-round agents now,
since they own those builds; whatever stays open of them afterwards joins the batch of its files.

**Batch 1, Python data and report** (`mockup/synth.py`, `textlib.py`, `render.py`, `figures.py`,
`i18n.py`, `mockup/checks/`, `mockup/clinic_templates/`, `mockup/prototype2/build_data.py`,
`mockup/prototype2/CONTRACT.md`, `data/synthetic/`, `outputs/sample/`):
1. A5 cleaning sentences into `textlib` and `choice_sentences`; A3 SUM-RULE-2 and the PDF headings;
   A11 Japanese tags (S).
2. One reseed of the synthetic child: A7 acceptance checks, C9, C10, C11, D5; A10 18 components
   (M).
3. B1 relative spectra and 1 Hz maps; C8 omissions and commissions per block (M).
4. A8 one CT-C record and the template row in Versions; B7 current and earlier helper and its check
   (M).
5. C2, C18, C19 sentence rules; C6 sentence wording; C15 ASY-1 and the asymmetry figure (S).
6. B2 ERP grid and Go/NoGo figure; C12 and C13 raw excerpt; C29 page layout; C17 case-independent
   template check (M).

**Batch 2, shell and admin modules** (`mockup/prototype2/shell.html`, `d_admin.js`, `f_mapping.js`):
1. A2 read-only actor and support chrome; A1 annotation; A14 Settings texts; A15 permission matrix,
   with B9 in the D3 build (M).
2. B4 audit trail and fictional clock; C28 worklist counts (M).
3. C4 preliminary Overview summary; C5 tabs as the stepper; B5 intended use panel; C20 norm age
   range (S).
4. C6 interface wording; C25 keyboard and contrast; C26 colours with D7; C27 narrow layout (M).

**Batch 3, workspace, results and report modules** (`mockup/prototype2/modules/a_workspace.js`,
`b_results.js`, `c_report.js`, `c_templates.js`, `e_markers.js`):
1. A4 chips; A12 alpha peak as Core; A13 cleaning status and annotation; A10 component count and
   annotation (S).
2. A6 viewer signal; C13 negative up; C14 drowsiness and bipolar montages (M).
3. A9 recomputing state and result set 2; B3 cleaning per recording (M).
4. C1 difference annotations; C7 panel heading and button; C21 assumption badges; C22 checksum
   label; C6 wording in the modules (S).
5. C3 summary table; C8 gauges and errors chart; C24 default bands; C15 pair line in the report;
   C5 "Before issuing" checklist (M).
6. C16 template validation and draft banner; C23 clinic template view and outline; D6 peak snapping
   (M).

**Batch 4, docs** (`README.md`, `docs/spec-digest.md`, `outputs/spec-digest.pdf`): README M1 (A7,
C9, C10, D5), M5 and M34 (C11), M24 (C14), M31 (C20), M35 (C15), M38 (A1), M42 (C12), M43 and M50
(A10), M44 (A6), M52 (A12), new assumptions for A9, C4 and the C1 list; digest rows 2 and 4 (A13,
C19) and the C18 open point; rebuild the digest PDF. Then an independent reviewer checks the
outputs against the specification and hard rules 1, 2 and 5 before anything goes to the product
owner.

D1 to D4, D7 and D8 wait for a decision on whether they are worth showing at the meeting.
