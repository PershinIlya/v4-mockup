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
| M1 | Synthetic patient: a girl of 10 years, case code MOCK-042, display name "Mock Patient 042", birth date 1 January 2016; current measurement 15 September 2026, earlier measurement 12 March 2026; eyes open, eyes closed and VCPT in both. The profile is mixed on purpose: some values move towards the norm between the two measurements, others away from it, so the pair does not read as a story. |
| M2 | Norms are invented ("Mock norms 2026.1"): log-normal band power, simple age trends; z, percentile and values are derived from the same mean and SD, so they agree. |
| M3 | Bands: delta 1.5-4, theta 4-8, alpha 8-12, SMR 12-15, beta1 15-20, beta2 20-30 Hz, the legacy spectral and coherence bands (audit `31`, `14f`); gamma left out. Theta/beta ratio at Cz with theta 4-8 and beta 13-21 Hz, as the legacy ratio (audit `14a`). |
| M4 | Frontal alpha asymmetry index = ln(F4 alpha) minus ln(F3 alpha); asymmetry map = (right minus left) / (right plus left) per homologous pair. |
| M5 | VCPT: 100 trials each of Go, NoGo, Ignore and Novelty (legacy trial types AA, AP, PP, PH); ERPs shown from -200 to 800 ms around the second stimulus; peaks P1 and N1 at O1 and O2 (Go), N2 at Fz and Cz (NoGo), P3 at Pz (Go) and at Cz and Fz (NoGo), CNV at Cz. |
| M6 | Sentence threshold \|z\| of 2 or more, tested on the printed value (one decimal), so tables and sentences agree. Severity words are not used at all (G6 open): sentences say only "above" or "below the age norm" and give z. |
| M7 | Summary rule: every measure compared with a norm (band power, alpha peak, ratios, asymmetry, coherence, ERP amplitude and latency, VCPT) is ranked by \|z\|; the summary shows the 5 largest plus every deviation of 3 z or more (completeness rule). |
| M8 | Low trial warning below 50 accepted trials (the legacy warns below 30 or 50, audit `14b`). |
| M9 | Every system sentence shows its library id in small grey type for traceability. |
| M10 | German and Japanese sentences and labels are drafted for the mockup and not reviewed by a qualified bilingual clinician. |
| M11 | Approved font list for themes: DejaVu Sans, DejaVu Serif, Liberation Sans, Liberation Serif, IPAGothic, IPAPGothic; minimum body size 8 pt. |
| M12 | Fixed figure colour scale: blue below the norm, neutral grey at the mean, red above, clipped at z = ±3; the same in every clinic style. |
| M13 | Multiple comparisons (Q10): colour-coded z values, none marked significant, plus one condition-neutral sentence that some values deviate by chance. |
| M14 | The cleaning in the current measurement was changed by the clinician (one muscle component kept); the report states it. |
| M15 | When a template shows only absolute maps, the sentences on relative power are left out too, so every sentence can be checked against a figure or table on the same page. |
| M16 | Template coverage: a generated table of contents is a template option, not part of the I6 schema (gap G5). |
| M17 | Template coverage: "start on new page", "keep together" and a figure size are block options; I6 does not name them. |
| M18 | Template coverage: the report language is an attribute of the template record. |
| M19 | Template coverage: the stress classifier is counted with bio signals (dropped) where the audit shows it switched off; cognitive tests are counted with questionnaires (open, Q4). |
| M20 | Template coverage: manual ERP component tick tables are clinician forms (G6); they could also be read as ERPC2 (open). |
| M21 | Template coverage: usage figures are rounded to tens; coverage counts elements, and "to confirm" elements count as covered. |
| M22 | Prototype: segments are 4-second blocks the clinician includes or excludes; the raw signal, the ICA components and their topographies are generated in the page and are not the report data. |
| M23 | Prototype: required device blocks in every template are versions, signal quality and notes on the results (proposal from the template coverage). |
| M24 | Prototype: issuing needs one confirmation that the clinician reviewed the raw EEG, the segments and the results (from the warnings of the draft intended use). |
| M25 | Prototype v2: minimum analysed time 120 s for eyes open and eyes closed, 900 s for VCPT; eyes closed drops its first second while the recording settles. |
| M26 | Prototype v2: the cleaning can be accepted only after the segments are confirmed. |
| M27 | Prototype v2 design: the company's navy and lime (from its public web site and its own report templates: navy, lime, pale lime, a humanist sans) carried into a modern product UI; navy for chrome and primary actions, lime for brand and selection; heritage motifs: the navy band with a lime EEG trace of the company report cover, the lime line under the bar, pill buttons and lime-barred notes of the web site. No company name or logo in the published mockup. |
| M28 | Prototype v2 results: one alpha peak marker (eyes closed, posterior mean); ERP waveforms plotted positive up; norm bands are mean plus or minus 2 SD; the comparison lists coherence pairs with \|z\| of 3 or more in either measurement. |
| M29 | Prototype v2 report: the clinic header sits at the top of page 1; switching to German changes headings only; clinician comments only after result sections; an issued version keeps its template, cleaning text and choices; an unconfirmed frequency marker is a warning before issue; claim words match by word start; template history v1 to v3 is invented. |
