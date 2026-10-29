# What the mockup must show: one-page digest of the specification

Sources: the shared document "V4: key specification and open questions" (text read on 29 October
2026): sections 3.2 to 3.8, table 3.3, questions Q1 to Q15; repository `PershinIlya/v4`:
`intended-use.md`, ADR 0003 and 0004, questions G6, I6, I8, `briefs/deterministic-text-layer.md`.
Statuses and table 3.3 values are those of the shared document. Everything else is a mockup
assumption (`README.md`).

| # | The mockup shows | Source, status |
| --- | --- | --- |
| 1 | **Core analyses only.** Signal quality; absolute and relative spectra and maps per 1 Hz band against norms; raw EEG excerpts (display only); alpha peak frequency; theta/beta ratio and frontal alpha asymmetry index as numbers only; asymmetry map; coherence per pair and band; channel ERPs as waveforms and peak values (P1/N1, N2, P3, CNV; new in V4); VCPT omissions, commissions, mean reaction time and its standard deviation; errors per 40-trial block without norms; repeated measurements side by side. | 3.2 Scope, Decided; table 3.3 Core |
| 2 | **"To confirm" in the core** (Q6): global coherence (shown, marked "to confirm"); frequency markers with automatic peak suggestions (shown only as the alpha peak frequency marker); checklist over channel ERPs (not shown yet). **Not shown:** later modules (questionnaires, used in V3 until their module is certified; workload, arousal and central sensitivity indices; vigilance; microstates; spike detection; the classifier; AI interpretation); research only (subtype and response classifiers, treatment recommendations); dropped (grouped summary table, bio signals, heart rate variability, external ERP program); not planned (change significance test). **Open, not shown by mockup choice:** lagged, instantaneous and total coherence (Q6); ICA component ERPs, ERPC2, resting ICA component maps, sLORETA (Q8). | Table 3.3; Q6, Q8 |
| 3 | **No condition wording, no interpretation.** Ratios as numbers only; no labels naming a condition or a mental function ("attention", "impulsivity"); no "normal" or "abnormal". | 3.2, Decided; `intended-use.md` §4 |
| 4 | **Fixed sentences only**: (a) a value against the norm, (b1) condition-neutral explanation; one per value beyond a set threshold (mockup: per marked value, M6); a summary of the largest deviations with a completeness rule (Japan only if the certification body agrees); data quality and limits. No language model. | 3.2, Decided; scheme to confirm by the clinical lead |
| 5 | **Multiple comparison correction**: a false discovery rate method or permutation tests, possibly per block, not Bonferroni; chosen at implementation. Mockup stand-in: M33. | 3.2 Working |
| 6 | **Norms and intended use.** Existing normative recordings reprocessed with the V4 pipeline (mockup: invented "Mock norms", M2). Users: physicians, licensed psychologists or neuropsychologists; general clinical use, no condition named; age range from the usable norms. | 3.2 Norms, Decided; Intended use, To confirm |
| 7 | **Recording systems**: the two amplifier families V3 reads today, each paired with its VCPT task software; others later through EDF+ (an open EEG file format), each a validated change. Task software named generically until the CTO confirms naming (M37, M38). | 3.2 Working |
| 8 | **Browser only; clinician in control.** No install on the recording computer. The system proposes segments, frequency markers, peaks and the ICA components to remove (ICA in the core or the first module); the clinician confirms or corrects. Every choice is logged and shown in the report, markers and peaks included. | 3.4 Working; I8 |
| 9 | **Earlier measurement** uploaded again and reprocessed with the current software and norms; side by side, each against its own norm, descriptive only; the report says so. No V3 numbers. | 3.4 Working |
| 10 | **Report from blocks**: system results (locked), the clinic's layout and texts, the clinician's anamnesis, comments after result sections, interpretation and conclusion (V4 report editor). Final when issued; a correction is a new version; software and norm versions on every PDF; only the PDF leaves. | 3.5 Working; I6 |
| 11 | **Clinic templates**: a preset in V4's template editor (result blocks and order, layout, the clinic's texts), not a Word file. Result blocks belong to the company; figure colours fixed. In the first release the company builds the templates on request; clinics edit their own later. | 3.5 Working; I6 |
| 12 | **Languages**: English and German first; Japanese when V4 enters Japan; others on request. | 3.5 Working |
| 13 | **Privacy**: a separate, encrypted identity store; the analysis sees a code number, age and sex; names only for the treating clinic; company staff only with time-limited access the clinic grants; every access logged; consent per measurement for norms, research and model training; kept while the contract runs, deleted on the clinic's instruction. | 3.6 Working |
| 14 | **Operations and quality targets**, only where the clinician meets them: the company's cloud first, data in Germany (own-server installation built and tested, offer open, Q10); processing within 10 minutes in 95% of cases; results reproducible, issued reports never change. Not shown: availability, growth, V3 comparison. | 3.7, 3.8 Working |

**Open points the mockup shows but does not decide:** severity scale and sentence threshold (G6);
the correction method (3.2); summary and VCPT values in Japan (3.2, table 3.3); Word export (Q14,
PDF only in the first release); report service by company staff (Q9, not shown); claim words in
clinic texts (I6).

**Hard rules:** synthetic data, "Mockup, synthetic data" on every page and screen; no real
templates, clinic names, logos or texts; no condition names, interpretation or treatment advice.
