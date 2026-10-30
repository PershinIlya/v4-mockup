# What the mockup must show: one-page digest of the specification

Sources: the shared document "V4: key specification and open questions" (text re-read on 30 October
2026 at about 12:30Z): sections 1 and 3.1 to 3.8, table 3.3, questions Q1 to Q14; repository
`PershinIlya/v4`: `intended-use.md`, ADR 0003 and 0004, questions G1, G6, G9, I6, I8, IU5, IU9, L7, X5, C5,
C13, the brief `deterministic-text-layer.md`. Statuses (Decided, Working) and table 3.3 values are
the shared document's; the rest is a mockup assumption (`README.md`).

| # | The mockup shows | Source, status |
| --- | --- | --- |
| 1 | **Core analyses.** Signal quality; absolute and relative spectra and 1 Hz maps against norms; raw EEG excerpts of the cleaned recording; alpha peak frequency; frequency markers on the spectra; theta/beta ratio and frontal alpha asymmetry index as numbers only; asymmetry map; magnitude squared coherence per pair and band; global coherence in four types (magnitude squared, lagged, instantaneous, total); channel ERP waveforms; VCPT omissions, commissions, mean reaction time and its standard deviation; errors per 40-trial block without norms; repeated measurements side by side. | 3.2 Scope, Decided; table 3.3 Core |
| 2 | **Core, proposed** (beyond the clinical lead's list of 5 October; needs his agreement), status only in annotations: alpha reactivity; sLORETA region values (source power per brain region, not a localisation); lagged coherence per pair (the user chooses it or magnitude squared); ERP peak values with the clinician's review (deviation ticks proposed only where a peak is clear); frontal theta / parietal alpha ratio (number only, no workload wording); a continuous normative model (GAMLSS). | Section 1; table 3.3; 3.2 |
| 3 | **Not shown:** later modules (questionnaires, in V3 until certified; arousal and central sensory indices; vigilance model; spike detection; the classifier; AI interpretation; ICA component maps and their sLORETA localisation); research only (subtype and response classifiers, treatment recommendations); dropped (grouped summary table, bio signals, heart rate variability, external ERP program). **Open, not shown:** ICA component ERPs and ERPC2 (Q7); microstates (a question to the clinical lead); a test of the change between measurements (C5). | Table 3.3; Q7 |
| 4 | **No condition wording, no interpretation.** Ratios as numbers only; no labels naming a condition or a mental function; no "normal" or "abnormal". | 3.2 Decided |
| 5 | **Fixed sentences only**, from a library that describes the results and their quality, each checked by people; no language model. Mockup scheme: a sentence per marked value, single values always with z (M6), a summary by a fixed rule (M7), limits sentences. | 3.2 No interpretation, Decided |
| 6 | **Multiple comparison correction** with a false discovery rate method; how it accounts for correlated values is decided at implementation. Mockup stand-in, per analysis block: M33. | 3.2 Working |
| 7 | **Norms and intended use.** Existing normative recordings reprocessed with the V4 pipeline (mockup: invented "Mock norms", a stand-in for the continuous model; it ignores sex, M2). Users: physicians and licensed psychologists or neuropsychologists; general clinical use, no condition named; age range from the usable norms. | 3.2 Norms Decided, Intended use Working; IU5 |
| 8 | **Recording systems**: Mitsar with Psytask and the NeuroAmp x23 with ERPrec, each with its VCPT task software; others later through EDF+ (an open EEG file format). File type names are mockup labels (M37). | 3.2 Working; C13 |
| 9 | **Browser only; clinician in control.** The system proposes segments, frequency markers, peaks, ERP deviation ticks and the ICA components to remove; the clinician confirms or corrects. Every choice is logged and shown in the report. | 3.4 Working; I8, IU9 |
| 10 | **Earlier measurement** uploaded again and reprocessed; side by side, each against its own norm, descriptive only; no V3 numbers. Table 3.3 says two measurements, 3.4 any number: the mockup shows both. | 3.4; table 3.3 |
| 11 | **Report from blocks**: system results (locked), the clinic's layout and texts, the clinician's text in the V4 report editor. Final when issued; a correction is a new version; versions on every PDF; only the PDF leaves. | 3.5 Working; I6 |
| 12 | **Clinic templates** in V4's template editor, built by the company on request in the first release; result blocks and figure colours fixed. English and German first; Japanese later. | 3.5 Working; I6 |
| 13 | **Privacy**: a separate, encrypted identity store; the analysis sees a code number, age and sex; company staff only with time-limited access the clinic grants; every access logged; consent per measurement. | 3.6 Working |
| 14 | **Operations and quality targets** the clinician meets: the company's cloud first, data in Germany (own server built and tested, offer open, Q9); processing within 10 minutes in 95% of cases; issued reports never change. | 3.7, 3.8 Working |

**Open points the mockup shows but does not decide:** the six "Core, proposed" items (the clinical
lead's agreement); how the correction handles correlated values (3.2); severity scale and
sentence threshold (G6); microstates and the change test (table 3.3 Open); ICA component ERPs
and ERPC2 (Q7); VCPT values in Japan (table 3.3); Word export (Q13); report service (Q8, not
shown); claim words in clinic texts (I6); an open suggestion to name sLORETA in the Decided scope
row, while table 3.3 marks the region values "Core, proposed".

**Hard rules:** synthetic data, "Mockup, synthetic data" everywhere; no real templates, clinic
names, logos or texts; no condition names, interpretation or advice.
