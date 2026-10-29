# What the mockup must show: one-page digest of the specification

Sources: the shared document "V4: key specification and open questions" (status 28 October 2026),
sections 3.2 to 3.5 and table 3.3; repository `PershinIlya/v4`: `intended-use.md`, ADR 0003 and
0004, open questions I6, I7, I8, `briefs/deterministic-text-layer.md`. "Decided", "Working" and
"Open" are the statuses of the shared document. Everything else in the mockup is a mockup
assumption (see `README.md`).

| # | The mockup shows | Source and status |
| --- | --- | --- |
| 1 | **Core analyses only.** Signal quality; absolute and relative spectra and maps per band and per 1 Hz against norms; raw EEG excerpt; alpha peak frequency; theta/beta ratio and frontal alpha asymmetry index as numbers; asymmetry map; coherence per pair and band; channel ERPs (P1/N1, N2, P3, CNV) as waveforms and peak values; VCPT omissions, commissions, mean reaction time and its standard deviation; errors per block of 40 trials without norms; comparison with an earlier measurement. | 3.2 Scope, Decided; table 3.3 rows "Core" |
| 2 | **Marked "to confirm"**: global coherence; frequency markers with automatic peak suggestions; checklist over channel ERPs. **Not shown**: lagged coherence, ICA component ERPs, ERPC2, sLORETA, microstates, vigilance, indices of the foundation, classifiers, questionnaires, AI interpretation, treatment advice. | Table 3.3, Q5, Q11 |
| 3 | **No condition wording, no interpretation.** Ratios are numbers only; no labels naming a condition or a mental function ("attention", "impulsivity"); no "normal" or "abnormal". | 3.2 No ADHD wording, Decided; `intended-use.md` §4 |
| 4 | **Fixed sentences only**, of kinds (a) restating a value against the norm and (b1) condition-neutral explanation: one sentence per value beyond a threshold; a summary of the largest deviations with a completeness rule; sentences on data quality and limits. No language model at runtime. | 3.2 No interpretation, Decided; text-layer brief §3, §8 |
| 5 | **Clinician in control.** The system proposes the segments to analyse; the clinician confirms. The automatic cleaning proposes ICA components to remove; the clinician can change the choice. Every choice is logged and the report says what was changed manually. | 3.4 Working; I8 |
| 6 | **Earlier measurement** is uploaded again and reprocessed with the current software and norms; measurements side by side, each against its own norm, descriptive only, no significance of change; the report says so. V3 numbers never appear. | 3.4 Working |
| 7 | **Report from blocks.** Device blocks (results, tables, figures, system sentences; locked); clinic blocks (header, logo, own texts, placeholders such as name and date); clinician blocks (anamnesis, a comment after any result section, interpretation, conclusion; editable in the V4 report editor). | 3.5 Working; I6 (agreed direction) |
| 8 | **Issue and versions.** A report is final when the clinician issues it; a correction creates a new version. Every PDF shows software and norm versions. Only the PDF leaves the system. | 3.5 Working |
| 9 | **Clinic templates and themes.** A clinic template is a validated, versioned record that references device blocks. The theme sets fonts from an approved list, colours, sizes, header and footer; figure colours stay fixed; a minimum font size applies. The company builds templates on request at first. | 3.5 Working; I6 |
| 10 | **Languages**: English and German first; Japanese when V4 enters Japan. | 3.5 Working |
| 11 | **Browser only**: upload in the browser, nothing installed on the recording computer. | 3.4 Working; ADR 0004 |
| 12 | **Privacy**: the analysis sees a code number, age and sex; names appear only in the clinic's view and on the clinic's PDF. | 3.6 Working |

**Open points the mockup makes visible but does not decide:** severity scale and sentence
threshold (G6); how many chance deviations to expect among many values (Q10); ranked summary
and behaviour sentences in Japan (text-layer brief §3, IU3); Word export (Q14, PDF only in the
mockup); warning on claim words in clinic blocks (I6).

**Hard rules for every output:** synthetic data only and "Mockup, synthetic data" on every page
and screen; real templates, clinic names, logos and texts never enter the repository; no
condition names, no interpretation, no treatment advice.
