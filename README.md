# V4 mockup

A disposable mockup of V4 for discussion with the clinical lead and the CTO.

- **Synthetic data only.** Not a medical device, not validated, not product code.
- **Specification:** repository `PershinIlya/v4` and the shared document "V4: key specification
  and open questions". Where they are silent, the choice is listed below.

## Contents

| Path | What it is |
| --- | --- |
| `docs/spec-digest.md`, `outputs/spec-digest.pdf` | One-page digest: what the mockup must show, with sources |
| `mockup/synth.py` | Synthetic data generator: spectra, maps, coherence, asymmetry, channel ERPs, VCPT behaviour, signal quality, raw EEG excerpts, ICA proposal; one child, two measurements |
| `data/synthetic/case_mock042.json` | Its output (regenerate with `python3 -m mockup.synth`) |
| `mockup/textlib.py` | Fixed sentence library (EN, DE, JA) with selection rules and an automatic forbidden-word check |
| `mockup/render.py`, `mockup/layouts/`, `mockup/pdf.js` | Report pipeline: clinic template record, blocks, HTML, PDF (Chromium) |
| `mockup/clinic_templates/` | Clinic template records (pseudonymised clinics, placeholder logos) |
| `docs/template-coverage.md`, `outputs/template-coverage.pdf` | Deliverable 1: legacy templates modelled in the V4 block schema, pseudonymised |
| `coverage/models/` | One pseudonymised model per legacy template (T01 to T16); summary: `python3 -m mockup.coverage_summary` |
| `mockup/prototype/` | Clickable workflow mockup: `app.html` plus `assets.json` (synthetic figures and sentences); build with `python3 -m mockup.prototype.build_assets` then `python3 -m mockup.prototype.build`; published as a private Artifact |
| `outputs/` | Rendered PDFs |

To come:

1. Sample report: one synthetic patient, core analyses, in three clinic styles (PDF).

Render a report: `python3 -m mockup.render mockup/clinic_templates/<file>.json outputs/<name>.pdf [--annotate]`.
`--annotate` tags every block as device, clinic or clinician block.

## Mockup assumptions

Choices made for the mockup where the specification is silent. None of them is a decision.

| # | Assumption |
| --- | --- |
| M1 | Synthetic patient: a girl of 10 years, case code MOCK-042, display name "Mock Patient 042", birth date 1 January 2016; current measurement 15 September 2026, earlier measurement 12 March 2026; eyes open, eyes closed and VCPT in both. Besides random deviations the child has four stable deviations of 3.5 to 4.5 z in four analysis blocks, chosen so that together they form no published pattern of any condition: lower relative theta power at posterior sites (Pz, O1, O2, partly P3 and P4), a higher SMR asymmetry index at C3-C4 (more SMR at C4), higher beta1 coherence among T3, C3, T5, P3 and O1 (7 pairs), and a later P1 at O1 and O2. Frontal theta, the theta/beta ratio, the NoGo P3 and the VCPT results (reaction time and its variability included) stay near the norm. Mixed on purpose: between the two measurements coherence and P1 latency move towards the norm, theta and SMR asymmetry away from it, so the pair does not read as a story. The random seeds are picked so that the number of values beyond 2 z is typical (273 and 296 of 5,991; about 273 are expected by chance alone), with one chance value marked in each measurement. |
| M2 | Norms are invented ("Mock norms 2026.1"): a synthetic norm sample of 400 children drawn from the same model gives the mean and SD of every measure at the patient's age (pointwise for spectra and ERP waveforms), so z, percentile and values agree and a value without a stable deviation has a z with unit variance. Spectra (average reference, uV^2/Hz): 1/f background, temporal sites lower, fronto-central theta shoulder, an alpha peak near 9.2 Hz at 10 years at every site, largest at posterior sites and several times larger with the eyes closed. Between-subject spread: alpha peak (SD 0.65 Hz), alpha amplitude, a broadband part per channel (SD 0.16 log10 units) and a part that differs between frequencies (about 0.13), so absolute band power has an SD of about 0.2 log10 units and relative power about 0.07 to 0.19. The alpha peak is read off the posterior mean spectrum after taking off the 1/f trend. Coherence norms fall with distance; coherence z is computed on Fisher's scale, atanh of the square root of coherence. Random deviations are smooth across the scalp (and across frequency); 55 % of their variance is the child's own and shared by both measurements, the rest differs per recording, with a broadband part shared by eyes open and eyes closed of one measurement. |
| M3 | Bands: delta 1.5-4, theta 4-8, alpha 8-12, SMR 12-15, beta1 15-20, beta2 20-30 Hz, the legacy spectral and coherence bands (audit `31`, `14f`); gamma left out. Theta/beta ratio at Cz with theta 4-8 and beta 13-21 Hz, as the legacy ratio (audit `14a`). |
| M4 | Frontal alpha asymmetry index = ln(F4 alpha) minus ln(F3 alpha); asymmetry map = (right minus left) / (right plus left) per homologous pair. |
| M5 | VCPT: 100 trials each of Go, NoGo, Ignore and Novelty (legacy trial types AA, AP, PP, PH); ERPs shown from -200 to 800 ms around the second picture, which follows the cue by 1100 ms (legacy picture times 300 and 1400 ms after the trial start, audit `14b`); baseline before the cue, so the CNV after an animal cue shows as a negativity before 0; peaks P1 (70 to 170 ms) and N1 (140 to 250 ms) at O1 and O2 (Go), N2 at Fz and Cz (NoGo), P3 at Pz (Go) and at Cz and Fz (NoGo), P3a at Cz (Novelty), CNV at Cz (Go, mean of -200 to 0 ms). Peaks are read off the curves (largest peak in a fixed window). Norms of waveforms and peaks come from the norm sample: pointwise mean and SD of the waveforms, mean and SD of the peaks (so the norm peak can differ a little from the peak of the mean curve). Waveforms are average-referenced and child-sized; each child has its own amplitude (SD 20 %) and latency (SD 2 ms plus 5 % of the latency) per component, slow waveform differences of its own, and residual noise that grows as fewer trials are accepted. |
| M6 | Sentences follow the boolean "marked" (M33), not a threshold on \|z\|: only marked values get their own sentence. A value has three states: marked, beyond 2 z (on the printed value, one decimal) but not marked, within 2 z. Severity words are not used at all (G6 open): sentences say only "above" or "below the age norm" and give z; for the negative ERP components N1, N2 and CNV they say "more negative" or "less negative than the age norm", so a larger negativity never reads as "below". |
| M7 | Summary rule (SUM-RULE-2 lists the families): the marked values of absolute and relative band power, maps per 1 Hz band, alpha peak frequency, theta/beta ratio, frontal alpha asymmetry index, asymmetry map, coherence per electrode pair, ERP peak amplitude and latency and VCPT task results are ranked by \|z\|; the summary shows the 5 largest plus every marked value of 3 z or more (completeness rule), grouped by analysis and condition, and then the number of marked values per family (SUM-COUNT-1). Not ranked, and SUM-RULE-2 says so: the spectra per 0.5 Hz bin (shown as curves against the norm band) and global coherence (core, to confirm). |
| M8 | Low trial warning below 50 accepted trials (the legacy warns below 30 or 50, audit `14b`). |
| M9 | Every system sentence shows its library id in small grey type for traceability. |
| M10 | German and Japanese sentences and labels are drafted for the mockup and not reviewed by a qualified bilingual clinician. |
| M11 | Approved font list for themes: DejaVu Sans, DejaVu Serif, Liberation Sans, Liberation Serif, IPAGothic, IPAPGothic; minimum body size 8 pt. |
| M12 | Fixed figure colour scale: blue below the norm, neutral grey at the mean, red above, clipped at z = ±3; the same in every clinic style. |
| M13 | Multiple comparisons: superseded by M33 (working decision in 3.2 of 29 October). L-CHANCE-1 is replaced by L-MC-1, which says that marked values differ from the norm after correction and that the method is still to be chosen. |
| M14 | The cleaning in the current measurement was changed by the clinician (one muscle component kept); the report states it. |
| M15 | When a template shows only absolute maps, the sentences on relative power are left out too, so every sentence can be checked against a figure or table on the same page. |
| M16 | Template coverage: a generated table of contents is a template option, not part of the I6 schema (gap G5). |
| M17 | Template coverage: "start on new page", "keep together" and a figure size are block options; I6 does not name them. |
| M18 | Template coverage: the report language is an attribute of the template record. |
| M19 | Template coverage: the stress classifier is counted with bio signals (dropped) where the audit shows it switched off; cognitive tests are counted with questionnaires (later module, table 3.3 as of 29 October). |
| M20 | Template coverage: manual ERP component tick tables are clinician forms (G6); they could also be read as ERPC2 (open). |
| M21 | Template coverage: usage figures are rounded to tens; coverage counts elements, and "to confirm" elements count as covered. |
| M22 | Prototype: segments are 4-second blocks the clinician includes or excludes; the raw signal, the ICA components and their topographies are generated in the page and are not the report data. |
| M23 | Prototype: required device blocks in every template are versions, signal quality and notes on the results (proposal from the template coverage). |
| M24 | Prototype: issuing needs one confirmation that the clinician reviewed the raw EEG, the segments and the results (from the warnings of the draft intended use). |
| M25 | Prototype v2: minimum analysed time 120 s for eyes open and eyes closed, 900 s for VCPT; eyes closed drops its first second while the recording settles. |
| M26 | Prototype v2: the cleaning can be accepted only after the segments are confirmed. |
| M27 | Prototype v2 design: the company's navy and lime (from its public web site and its own report templates: navy, lime, pale lime, a humanist sans) carried into a modern product UI; navy for chrome and primary actions, lime for brand and selection; heritage motifs: the navy band with a lime EEG trace of the company report cover, the lime line under the bar, pill buttons and lime-barred notes of the web site. No company name or logo in the published mockup. |
| M28 | Prototype v2 results: one alpha peak marker (eyes closed, posterior mean); ERP waveforms plotted positive up; norm bands are mean plus or minus 2 SD; the comparison lists coherence pairs with \|z\| of 3 or more in either measurement. |
| M29 | Prototype v2 report: the clinic header sits at the top of page 1; clinician comments only after result sections; an issued version keeps its template, cleaning text and choices; an unconfirmed frequency marker is a warning before issue; claim words match by word start; template history v1 to v3 is invented. |
| M30 | Prototype v2 report: a second template "Company standard" (CT-STD-EN) in a modernised heritage look (navy cover band with a lime EEG trace, Roman-numbered sections, italic running header, lime footer band, pale lime table headers); Carlito and Fira Sans stand in for the legacy fonts; footer company line is a placeholder. |
| M31 | Prototype v2: issuing a report needs confirmed segments and cleaning; templates in the first release are built by the company on request (3.5), so the template history names the company; the mock norm covers ages 6 to 67 (age range to confirm); values are rounded half up once, at data build, so tables and sentences agree. |
| M32 | Prototype v2 German version: an EN / DE switch for the interface (English by default) and a report language set per report, independent of the interface (Japanese shown as a later market); German interface texts, report labels, system sentences (decimal comma, dates as 15.09.2026) and clinic texts (each template carries them in English and German) are drafted for the mockup and not reviewed by a qualified bilingual clinician; the template claim-word check also catches German words; people appear as "Kliniker 1" and "Kliniker 2"; spec references in the annotations, product names (V4 mockup, Mock norms), sentence ids, the trial names Ignore and Novelty and the template placeholders {name}, {age}, {recording_date} stay in English. |
| M33 | Correction for multiple comparisons, a stand-in until the method is chosen at implementation (shared document 3.2, Working: a false discovery rate method or permutation tests, possibly per block, not Bonferroni): Benjamini-Hochberg false discovery rate at q = 0.05 within each analysis block, two-sided p from z. A block is one analysis family in one condition: spectrum per 0.5 Hz bin, absolute band power, relative band power, maps per 1 Hz band, alpha peak with the theta/beta ratio and the frontal alpha asymmetry index, asymmetry map, coherence per pair, global coherence (each for eyes open and eyes closed), ERP peak amplitudes, ERP peak latencies, VCPT task. Every z carries a boolean "marked"; each measurement lists per block the number of values, those beyond 2 z uncorrected, the number expected by chance and the number marked (for the Annotations view). This rule is not a decision. |
