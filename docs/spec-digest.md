# What the mockup must show: one-page digest of the specification

Sources: the shared document "V4: key specification and open questions" (as of 29 October 2026),
sections 3.2 to 3.8 and table 3.3; repository `PershinIlya/v4`: `intended-use.md`, ADR 0003 and
0004, open questions I6, I8, `briefs/deterministic-text-layer.md`. "Decided", "Working" and
"To confirm" are the statuses of the shared document; "Core", "Open", "Later module" are the
columns of its table 3.3. Everything else in the mockup is a mockup assumption (see `README.md`).

| # | The mockup shows | Source and status |
| --- | --- | --- |
| 1 | **Core analyses only.** Signal quality; absolute and relative spectra and maps per band and per 1 Hz against norms; raw EEG excerpt; alpha peak frequency; theta/beta ratio and frontal alpha asymmetry index as numbers; asymmetry map; coherence per pair and band; channel ERPs (P1/N1, N2, P3, CNV) as waveforms and peak values; VCPT omissions, commissions, mean reaction time and its standard deviation; errors per block of 40 trials without norms; comparison with an earlier measurement. | 3.2 Scope, Decided; table 3.3 "Core" |
| 2 | **Marked "to confirm"**: global coherence; frequency markers with automatic peak suggestions; checklist over channel ERPs. **Not shown, later module, research only or dropped**: questionnaires (clinics use them in V3 until their module is certified), workload, arousal and CSI indices, vigilance, microstates, spike detection, classifiers, AI interpretation, treatment advice. **Not shown by mockup choice, still open**: lagged, instantaneous and total coherence (Q6); ICA component ERPs, ERPC2, resting ICA component maps, sLORETA (Q8). | Table 3.3; Q6, Q8 |
| 3 | **No condition wording, no interpretation.** Ratios are numbers only; no labels naming a condition or a mental function ("attention", "impulsivity"); no "normal" or "abnormal". | 3.2 No ADHD wording, Decided, plus a working rule on labels; `intended-use.md` §4 |
| 4 | **Fixed sentences only**, of kinds (a) restating a value against the norm and (b1) condition-neutral explanation: one per value beyond a threshold; a summary of the largest deviations with a completeness rule; data quality and limits. No language model at runtime. | 3.2 No interpretation, Decided; scheme for the clinical lead to confirm; (b1) needs regulatory advice |
| 5 | **Multiple comparison correction.** Values marked against norms are corrected for multiple comparisons (false discovery rate or permutation tests, not Bonferroni); the method is chosen at implementation. Mockup display: `README.md` M13, M33. | 3.2 Working |
| 6 | **Clinician in control.** The system proposes the segments to analyse and the ICA components to remove; the clinician confirms or changes them. Every choice is logged and the report says what was changed manually. | 3.4 Working; I8 |
| 7 | **Earlier measurement** uploaded again and reprocessed with the current software and norms; side by side, each against its own norm, descriptive only; no significance test ("Not planned"); the report says it was reprocessed. V3 numbers never appear. | 3.4 Working; table 3.3 |
| 8 | **Report from blocks.** Device blocks (results, tables, figures, system sentences; locked); clinic blocks (header, logo, own texts, placeholders); clinician blocks (anamnesis, a comment after any result section, interpretation, conclusion; in the V4 report editor). | 3.5 Working; I6 |
| 9 | **Issue and versions.** Final when the clinician issues it; a correction is a new version. Every PDF shows software and norm versions. Only the PDF leaves the system. | 3.5 Working |
| 10 | **Clinic templates.** A preset in V4's template editor, not a Word file: which result blocks in which order, the layout (approved fonts, colours, logo, header, footer) and the clinic's own texts. Result blocks belong to the company and cannot be changed; figure colours stay fixed. In the first release the company sets up templates on request; clinics edit their own later. | 3.5 Working; I6 |
| 11 | **Languages**: English and German first; Japanese when V4 enters Japan. | 3.5 Working |
| 12 | **Browser only**, nothing installed on the recording computer. **Recording systems**: the two amplifier families V3 reads today, each with the task software it uses for the VCPT; others later through EDF+ (an open EEG file format). | 3.4, 3.2 Working |
| 13 | **Privacy**: a separate identity store; the analysis sees a code number, age and sex; names only for the treating clinic; consent per measurement for norms, research and model training. | 3.6 Working |
| 14 | **Operations and quality targets**, shown only where the clinician meets them: cloud first, data in Germany; processing within 10 minutes in 95% of cases; results reproducible, issued reports never change. | 3.7, 3.8 Working |

**Open points the mockup makes visible but does not decide:** severity scale and sentence
threshold (repository question G6); the correction method (3.2); ranked summary and behaviour
sentences in Japan (text-layer brief §3, IU3); Word export (Q14, PDF only in the mockup);
warning on claim words in clinic blocks (I6).

**Hard rules for every output:** synthetic data only and "Mockup, synthetic data" on every page
and screen; real templates, clinic names, logos and texts never enter the repository; no
condition names, no interpretation, no treatment advice.
