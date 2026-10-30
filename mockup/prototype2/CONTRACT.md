# Prototype v2: module contract

The clickable mockup must look and feel like the future V4 web product, not like a spec
checklist: terse product copy, dense working panels, real-looking tools (an EEG viewer like
clinical EEG software, interactive maps and curves, a document-like report editor). Explanatory
prose and spec references belong only in `APP.ann('...')` badges, hidden unless the viewer
switches "Annotations" on. No paragraphs explaining the spec on screens.

Read `/home/user/v4-mockup/CLAUDE.md` (hard rules 1, 2, 5). Synthetic data only; clinics are
"Clinic C"; people are "Clinician 1"; no condition names attached to results, no interpretation,
no treatment advice; system text comes only from `APP.sentences` (fixed library). The interface is in
English and German (see Interface language below). No em or en dashes in any visible text.

## Files

- `shell.html` (owned by the lead, do not edit): app bar, navigation, list pages, workspace
  header with tabs, router, shared CSS components and the `APP` API below.
- `modules/<name>.js` (one per agent): plain JavaScript, no libraries, no network. The build
  wraps each file in its own function scope and inlines it.
- Build: `cd /home/user/v4-mockup && python3 -m mockup.prototype2.build`
- Smoke test with screenshots: `SHOTS=<your folder> node mockup/prototype2/smoke.js <route> ...`
  prints the heading, horizontal overflow and page errors; screenshots are 1360 x 900. Look at
  them and fix what looks wrong. Keep the page free of errors.

## Registering a module

```js
window.Modules.segments = {
  render(root, ctx) { root.innerHTML = '...'; /* wire events */ },
  destroy() { /* optional: stop timers, remove listeners on window */ },
};
```

`root` is the work area below the workspace tabs (or a page body). Call `APP.refresh()` to
re-render the whole page after a state change that affects the header (status pipeline, tab
chips); otherwise update your own DOM.

Routes and owners: `segments` (tab "Recording"), `cleaning` (agent A); `results`, `compare`
(agent B); `report`, `issued`, `template` (agent C).

## APP API (from shell.html)

- Data: `APP.case` (full synthetic case), `APP.m1` (12 Mar 2026), `APP.m2` (15 Sep 2026, the
  current measurement), `APP.channels` (19 names, fixed order), `APP.pos[ch]` = [x, y] on the
  unit head (nose up), `APP.bands` = [{name, lo, hi}] (delta, theta, alpha, smr, beta1, beta2).
- Measurement structure (`APP.m2`):
  - Every z has a boolean "marked" next to it (correction for multiple comparisons, stand-in rule
    of mockup assumption M33). A value has three states: marked; beyond 2 z (|z| of 2 or more on
    the printed value) but not marked; within 2 z. Selections, sentences, badges, lines and
    counts that stand for "differs from the norm" follow `marked`, never |z| >= 2; colours stay
    continuous on the z scale.
  - `spectra.freqs` (1 to 30 Hz, step 0.5); `spectra.conditions.EO|EC`: `log_power`,
    `norm_log_mean`, `norm_log_sd`, `z` (each 19 x 59, log10 uV^2/Hz), `z_marked` (19 x 59);
    `bands[band]`: `abs_uv2`, `abs_z`, `abs_marked`, `rel_pct`, `rel_z`, `rel_marked` (19 values);
    `maps_1hz_z`, `maps_1hz_marked` (29 x 19, 1-2 Hz to 29-30 Hz);
    `alpha_peak` {hz, norm_mean, norm_sd, z, marked}; `tbr` {site, value, norm_mean, z, marked};
    `faa` {value, norm_mean, norm_sd, z, marked}; `asymmetry[band]` = [{pair, value, z, marked}]
    (8 pairs).
  - `coherence.EO|EC[band]`: `pairs` = [{pair: "Fp1-Fp2", value, z, marked}] (171), `global`
    {value, z, marked, status}.
  - `erp.times_ms` (-200 to 800, step 4); `erp.conditions.go|nogo|ignore|novelty.channels[ch]`:
    `patient_uv`, `norm_mean_uv`, `norm_sd_uv`; `erp.peaks` = [{component, condition, site,
    amplitude_uv, amplitude_z, amplitude_marked, latency_ms, latency_z, latency_marked,
    norm_amplitude_uv, norm_latency_ms}], read off the curves (CNV: mean over `window_ms`,
    latency and latency_marked null). N1, N2 and CNV are negative: a larger negativity has a
    negative z and reads "more negative than the age norm", never "below".
  - `vcpt`: `omissions|commissions|rt_mean_ms|rt_sd_ms` {value, z, percentile, marked},
    `errors_per_block` (10 blocks of 40 trials), `trials`.
  - `marking` {method, q, blocks: [{id, family, condition, n, beyond2_uncorrected,
    expected_by_chance, marked}]}: one block per analysis family and condition (ids
    `spectrum_EO`, `abs_EO`, `rel_EO`, `maps1hz_EO`, `indices_EO` (alpha peak, theta/beta ratio,
    frontal alpha asymmetry), `asym_EO`, `coh_EO`, `cohglobal_EO`, the same for EC, then
    `erp_amp`, `erp_lat`, `vcpt`). For the Annotations view only ("uncorrected n / expected by
    chance m / marked k", review D1); the product itself shows only the marked state.
  - `quality`: `recordings.EO|EC|VCPT` {recorded_s, analysed_s}, `accepted_trials`,
    `ica` {n_components (18 after the night round 2 reseed, review A10), proposed_removed: [{ic, kind, ref_map, corr}], clinician_change}:
    `ref_map` is the best matching reference map (blink, eye_h, muscle_l, ...), `corr` the
    absolute correlation of the component map with it (0.9 or more proposes removal; the
    legacy test is signed, mockup assumption M43).
  - `raw.EO|EC`: `fs` 64, `seconds` 10, `channels[ch]` (uV): a short real excerpt; longer
    signals for the viewer may be generated in the page (seeded, deterministic).
  - `processed_with` {software, norms, reprocessed}.
- Sentences (fixed library output, show with `APP.sys(list)`): `APP.sentences.m2.<key>` and
  `.m1.<key>` with keys `summary, quality, spectra_EO, spectra_EC, ratios, asymmetry_EO,
  asymmetry_EC, coherence_EO, coherence_EC, erp, behaviour, limits, comparison` (comparison
  only for m2). Each item {id, text}. Sentences follow `marked` (ids as of 29 October: SUM-2,
  SUM-RULE-2, SUM-COUNT-1, SUM-NONE-2, SP-NONE-2, APF-IN-2, ERP-AMP-NEG-1, ERP-NONE-2, BEH-IN-2;
  L-MC-1 replaces L-CHANCE-1). `APP.qualitySentences()` returns the quality sentences with
  the cleaning sentence that matches what the clinician did.
- Report id (`data.json` `report_ids`, from `textlib.report_id`): `{m1: "R-MOCK-042-0312", m2:
  "R-MOCK-042-0915"}`; printed as id + " v" + version, for example "R-MOCK-042-0915 v1", the
  same as the PDF. Never write an id literally (`mockup/checks/rounding_parity.py` probe 5 fails
  on any `R-MOCK...` literal that is not one of these ids). Template ids are CT-C and CT-STD.
- Choice sentences (`data.json` `choice_sentences.en|de[id]`, from `textlib.LIB`): templates with
  `{named}` placeholders, filled in the page; capitalise the first letter when the template
  starts with a placeholder (as `textlib.say` does). One id set for the PDF and the prototype;
  AUTO = proposal confirmed unchanged, MAN or MOVED = changed and confirmed, PEND = changes not
  yet confirmed:
  - `Q-SEG-AUTO-1` (no placeholder); `Q-SEG-MAN-1` {cond, analysed, recorded, proposed}, one
    per condition whose analysed seconds differ from the proposal; `Q-SEG-PEND-1` {n} with n
    changes waiting; `Q-SEG-PEND-0` (no placeholder) when the segments are not confirmed and
    no change is waiting (count 0: "not yet confirmed by the clinician", no count).
  - `MK-AUTO-1` {suggested, state}; `MK-MOVED-1` {suggested, confirmed, state}; `MK-PEND-1`
    {hz}, the marker not yet confirmed (Hz with 1 decimal, the suggested or the moved value).
  - `ERP-PEAK-AUTO-1` {trial}, one per trial type with a movable latency; `ERP-PEAK-MAN-1`
    {comp, site, trial, from_ms, to_ms, lat_state, amp_uv, amp_state}, one per moved peak;
    `ERP-PEAK-PEND-1` {trial, n} with n moves waiting; `ERP-PEAK-PEND-0` {trial} when the
    trial type is not confirmed and no move is waiting (count 0, no count).
  - Issue needs confirmed segments, cleaning, the alpha peak frequency marker and the ERP peaks
    of every trial type with scored peaks (Go, NoGo, Novelty); until then the draft prints the
    PEND sentences of what is pending. A moved and confirmed ERP peak shows its recomputed z
    and marked state in the Results table and in the report (never a "pending" z).
  - `SUM-CHG-1` {items}, `SUM-CHG-2` {items}, `SUM-CHG-3` (no placeholder).
  Fragments in `choice_parts.en|de`: `state.not|above|below|later|earlier|more_negative|
  less_negative`, `state_z` {state, z} (fills {state}, {lat_state}, {amp_state}, like
  `textlib.z_state`), `item_lat` and `item_amp` {comp, trial, site, z}, `item_apf` {z}, and
  `item_sep` (joins the items of SUM-CHG-1 and SUM-CHG-2). The PDF prints Q-SEG-AUTO-1,
  MK-AUTO-1 and ERP-PEAK-AUTO-1 (the synthetic case counts as confirmed unchanged, M42).
- Forbidden words (`data.json` `terms`, from `mockup/checks/terms.py`): `forbidden` and `ja` =
  [[category, pattern]], `allow` = [pattern]; a pattern that starts with `(?-i)` is
  case-sensitive, every other one is not. The template editor's claim-word check uses this
  list; its inline list in `c_report.js` is only a fallback when `terms` is missing.
- State `APP.state` (shared, mutate it): `segments {confirmed, changes}`, `cleaning {confirmed,
  changed: [{ic, kind, removed}], removedCount}`, `markers {confirmed, hz}`, `report {status:
  'draft'|'issued', version, issued: [{v, at, reason, texts}], texts: {key: string}}`,
  `template {version}`, `staffView`.
- Helpers: `APP.esc(s)`, `APP.ann(text)` (spec badge, hidden by default), `APP.sys(list)`,
  `APP.fmtDate(iso)`, `APP.addLog(actor, text)` (activity log; log every human decision),
  `APP.toast(text)`, `APP.dialog({title, body, ok, cancel, onOk(back)})` (in-page modal; never
  use alert/confirm), `APP.css(id, cssText)` (inject module CSS once), `APP.go(route)`,
  `APP.refresh()`, `APP.name()` (patient display name or "Name hidden").
- Figures: `APP.zColor(z)`, `APP.zRGB(z)`, `APP.zInk(z)` (text colour on a z cell),
  `APP.zScale(label)` (HTML colour bar), `APP.topo(canvas, values19, {size, title, names,
  marks, highlight, lim})` draws a head map and returns `hit(x, y) -> channel|null` in CSS pixels.
  Figure colours never follow the theme: draw maps and curves on a `.paper` surface.

## Interface language

- `APP.lang` is `'en'` (default) or `'de'`; `APP.setLang(l)` switches and re-renders. Every visible string
  goes through `APP.t(key, params, lang)`; modules add their keys with `APP.addI18n({en: {...}, de: {...}})`
  (a value may be a function `(params, lang)` for plurals). Lazy params `APP.tk(key, params)`, `{$d: iso}`
  and `{$n: number, d}` translate when shown: use them in `APP.addLog(actorKey, key, params)` so the
  activity log follows the language. Numbers: `APP.nf(v, d)`, `APP.pct`, `APP.int` (German decimal comma);
  dates: `APP.fmtDate`, `APP.fmtShort`, `APP.fmtLong`, `APP.at({d, tm})`; data labels: `APP.dv(s)`.
- Sentences: `APP.sentences.m2.<key>` follow the interface; `APP.sentences.de.m2.<key>` (or `.en`) name a
  language. The report draws everything inside its pages in the report language (`state.report.lang`).

## Shared CSS (use these, add module CSS through APP.css with a module prefix)

`.card > .hd / .bd`, `.btn`, `.btn.primary|ghost|danger|sm`, `.seg > button(.on)`,
`.chip(.ok|.warn|.amber|.info|.device|.clinic|.clinician)`, `.tbl` (`tr.link`, `td.num`),
`.toolbar` (`.sep`, `label`), `.field > span + input/select/textarea`, `.paper`,
`.banner(.amber|.warn|.ok)`, `.kv` (dl), `.grid .g2 .g3`, `.row .between`, `.muted .small .xs
.mono .num`, `.empty`. Colour tokens: `--surface, --surface-2, --ink, --ink-2, --muted, --line,
--line-2, --accent, --accent-soft, --ok, --warn, --amber, --info, --device(-ink),
--clinic(-ink), --clinician(-ink), --paper, --paper-ink`. Both light and dark themes must
work; never hard-code a colour outside `.paper` figures.

## Quality bar

Feels like a real product: plausible density, keyboard focus states, hover states, sensible
empty and loading states, realistic numbers from the data, units, legends. Works at 1360 px and
does not overflow horizontally at 400 px (wide canvases sit in an `overflow-x: auto` box).
Every interactive control does something visible. Log every clinician decision with
`APP.addLog`. Keep the file under about 1,200 lines.

## Night round (29 October): data for B3, B5, B6, D2, D5, D6, Q-ICA-PEND-1, D7

Everything above stays valid: M1 and M2 keep every value and sentence they had (checked value by
value against the data before this round); new fields are added beside them. Data are built by
agent P (`mockup/synth.py`, `mockup/textlib.py`, `mockup/prototype2/build_data.py`); mockup
assumptions M55 to M65 in `README.md`. `data.json` is about 2.8 MB.

### Measurements of MOCK-042 (B5)

- `case.measurements` = `[M1, M2, M0]`: index 0 is M1 (12 Mar 2026), index 1 the current M2
  (15 Sep 2026), index 2 the earliest measurement M0 (23 Sep 2025, age 9.7), recorded before M1
  but uploaded later as an earlier recording and processed again. `APP.m1` and `APP.m2` stay
  index 0 and 1; take M0 as `case.measurements[2]`. `case.current_index` = 1.
- Measurement key `mk`: the last part of the id in lower case (`M-M0` -> `m0`). Pair keys are
  `later|earlier` in upper case: `"M2|M1"`, `"M2|M0"`, `"M1|M0"`. Sort by `date` for "oldest
  first"; never by array index.
- `report_ids` adds `m0: "R-MOCK-042-0923"` (printed with " v" + version, as before).

### New fields of every measurement (also the extra cases)

- `uploaded_later`: true for M0 only (show "uploaded later" and the note that the V3 report and
  its numbers are not imported; sentence `L-IMPORT-1` below).
- `processed_with` (D6) keeps `software`, `norms`, `reprocessed` (now true for M1 and M0) and
  adds `pipeline` ("mockup pipeline 0.1.0"), `norm_version` ("2026.1"), `input_sha256` (64 hex
  characters), `input_label` ("synthetic input, not a recording file"; always show it next to
  the checksum), `ica_seed` (integer), `processed_at` (local time, ISO without zone, for example
  "2026-09-15T10:46:40"), `processing_s` (seconds; M2 400, M1 389, M0 371), and `udi` (the
  text "UDI: placeholder, assigned at certification"; print it as it is).
- `results_missing`: `{}` or `{cond: {reason: "below_minimum", analysed_s, minimum_s}}` (B6).
  For such a condition `spectra.conditions[cond]` and `coherence[cond]` are `null`, `raw[cond]`
  and `quality.recordings[cond]` stay, and `marking.blocks` has no block of that condition.
- `no_norm`: `null`, or `{reason: "age_outside_norm_range", age_years, norm_age_range_years:
  [6, 67]}` (B6). Then every `z`, `*_z`, `percentile`, `norm_*` (`norm_log_mean`,
  `norm_log_sd`, `norm_mean`, `norm_sd`, `norm_mean_uv`, `norm_sd_uv`, `norm_amplitude_uv`,
  `norm_latency_ms`) is `null`, no `marked`/`*_marked` key exists (treat as not marked, draw
  no ring), `marking` is `null`, `spectra.conditions[cond].maps_1hz_z` is `null` and
  `maps_1hz_uv2` (29 x 19, absolute power in uV^2 per 1 Hz band, 1-2 Hz first) takes its place.
  Values stay: `abs_uv2`, `rel_pct`, `log_power`, asymmetry and coherence `value`, alpha peak
  `hz`, `tbr.value`, `faa.value`, ERP `patient_uv`, peak amplitude and latency, VCPT `value`.
  Show no z colours, no marks, no comparison sentences; maps of absolute values.
- `recording_conditions` (D5): `{documented_at: "upload", time_of_day: "HH:MM", medication_on_day:
  "none_reported" | "see_anamnesis", sleep_before: "as_usual" | "shorter", drowsiness_observed:
  "no" | "yes"}`; `null` in a field means not documented (every field of M0 is `null`). Labels in
  `recording_condition_fields` below.
- `method` (D5, TG10): `recording {system, electrodes: 19, montage, conditions}`, `processing
  {reference, mains_notch_hz, analysis_rate_hz: 250, spectral_step_hz: 0.5, spectral_range_hz:
  [1, 30], cleaning}`, `norms {name: "Mock norms", version: "2026.1", label, synthetic: true,
  sample_n: 400, age_range_years: [6, 67], compared_by: ["age"], applied}` (`applied` false
  when `no_norm`), `bands` (as `case.bands`), `tbr {site, theta: [4, 8], beta: [13, 21]}`, `erp
  {window_ms: [-200, 800], time_zero, baseline, trials_per_type: 100}`, `marking {method, q,
  within, stand_in: true}`. Its sentences: `sentences.<lang>.<mk>.method` below.
- `freq_markers` (B3): `{display: "abs", suggested: {EO: [...] | null, EC: [...] | null},
  windows: {ch: [lo, hi]}, questions: {mu: {sites: ["C3", "C4"], lo: 8, hi: 13.5},
  beta_spindle: {sites: ["F3", "Fz", "F4"], lo: 18, hi: 22}}, rule}`. A suggested marker is
  `{n, site, hz, bin, z, marked, question}`: `n` 1 to 3 per condition (largest z first), `bin`
  the index into `spectra.freqs` (`hz = freqs[bin]`), `z` and `marked` copied from
  `spectra.conditions[cond].z[ch][bin]` and `z_marked[ch][bin]`, `question` `"mu"`,
  `"beta_spindle"` or `null` (the question the tool asks: site in `sites` and `lo <= hz < hi`).
  `null` list: the condition has no results; `[]`: nothing suggested (MOCK-061, no z). Markers
  sit on absolute power per 0.5 Hz bin; a marker may be placed only inside `windows[site]`
  (Fp1 and Fp2 have no window). A moved or added marker takes the z and marked state of its new
  bin from the same arrays. MOCK-042 M2 suggests EO: T5 9.0 Hz (z 1.6), T5 17.5 Hz (1.5), Fz
  5.5 Hz (0.8); EC: T4 9.0 Hz (1.5), T5 17.0 Hz (1.2), Fz 5.5 Hz (0.3); none of them marked and
  none with a question, so moving one to C4 at 10 Hz shows the mu rhythm question.
- `case.identity_store.anamnesis` (D5, I5): `{anamnesis, history, medication, current_symptoms}`,
  each `{en, de, ja}` free text (`""` when empty); neutral synthetic placeholder text, kept in
  the identity store because it is free text (3.6). Field labels in `anamnesis_fields`.
- Birth dates (D7): every synthetic person is born on 1 January (MOCK-042 2016-01-01,
  MOCK-057 2014-01-01, MOCK-061 1951-01-01).

### Extra cases (B6)

`data.extra_cases[code]` for `"MOCK-057"` and `"MOCK-061"`: `{case, sentences: {en, de: {m2:
{...}}}, report_ids: {m2}}`. `case` has the same top fields as the main case (`case_code`,
`identity_store` with `display_name`, `birth_date`, `anamnesis`, `sex`, `channels`, `positions`,
`bands`, `asym_pairs`), `measurements` with one element (id `M-M1`) and `current_index: 0`; no
`report_inputs`. The only measurement is the current one: `APP.openCase(code)` sets `APP.case =
case`, `APP.m2 = case.measurements[case.current_index]`, `APP.m1 = null`, and `APP.sentences` to
`sentences[lang]` exactly as for MOCK-042 (so `APP.sentences.m2.<key>` works unchanged);
`report_ids.m2` is the report id. Keep `APP.state` per case.

- MOCK-057: "Mock Patient 057", male, born 2014-01-01, recorded 2026-10-27, age 12.8. Eyes open
  84 of 180 s analysed, minimum 120 s: `results_missing.EO`; eyes closed (166 s) and VCPT
  (1152 s) complete; no value marked (summary SUM-NONE-2 plus SUM-MIN-1).
- MOCK-061: "Mock Patient 061", male, born 1951-01-01, recorded 2026-10-23, age 75.8, outside the
  norm range 6 to 67: `no_norm` set; all conditions have values.
- Report ids: `R-MOCK-057-1027`, `R-MOCK-061-1023` (from `report_ids.m2`; never literal).

### Sentences

- `sentences.<lang>.m0`: the same keys as `m1` (`comparison` is `[]`).
- Every measurement (also `extra_cases[code].sentences.<lang>.m2`) has the new key `method`:
  `MET-REC-1`, `MET-PROC-1`, `MET-SPEC-1`, `MET-ERP-1`, then `MET-NORM-1` (or
  `MET-NORM-NONE-1` when no norm applies), then `MET-MC-1` (left out when no norm applies).
- `sentences.<lang>.comparisons["M2|M1" | "M2|M0" | "M1|M0"]`: CMP-1 lists, later against
  earlier (`"M2|M1"` equals `m2.comparison`). `sentences.<lang>.comparison_limits[same key]`:
  `L-REPROC-1` for each measurement of the pair that was processed again (older first),
  `L-SIDE-1`, and `L-IMPORT-1` when either was uploaded later. `sentences.<lang>.comparisons_all`:
  `CMP-N-1` over M0, M1 and M2 oldest first ("Beta1 coherence T3-C3, eyes closed: z = 4.7 on
  23 Sep 2025, z = 4.1 on 12 Mar 2026 and z = 4.1 on 15 Sep 2026."), the same rule as CMP-1
  (measures marked in any of them, largest |z| first, at most 6).
- B6 ids in the usual keys: `quality` uses `Q-MIN-1` {cond, a, r, min} in place of `Q-DUR-1`
  for a condition below the minimum; `spectra_<cond>`, `asymmetry_<cond>`, `coherence_<cond>`
  and `ratios` hold `RES-MIN-1` {cond} for it; `summary` ends with `SUM-MIN-1` {cond}. With
  `no_norm`: `summary` = [`NORM-AGE-1` {age, lo, hi}], `spectra_<cond>` = [`APF-VAL-1`],
  `ratios` = [`TBR-VAL-1`, `FAA-VAL-1`] per condition, `asymmetry_*`, `coherence_*`, `erp` =
  [], `behaviour` = 4 x `BEH-VAL-1`, `limits` = [`L-AID-1`, `L-NONORM-1`].

### Choice sentences added (`choice_sentences.en|de`, `choice_parts.en|de`)

Fill as before (`{named}` placeholders, capitalise a template that starts with a placeholder).
`{cond}` is the condition as in the other sentences (`textlib.COND`: "eyes open", "eyes
closed"; "Augen offen", "Augen geschlossen"); Hz with 1 decimal and the German decimal comma;
`{state}` is `choice_parts.state_z` as for the other choices (z of the marker's bin and its
marked state).

- Cleaning: `Q-ICA-PEND-1` {k, n}: the cleaning is not yet accepted by the clinician; `k` the
  components currently set for removal (proposal or changed), `n` = `quality.ica.n_components`. Print it in the draft in
  place of `Q-ICA-AUTO-1` / `Q-ICA-MAN-1` while the cleaning is not accepted (M52, M65).
- Frequency markers, per condition: `FM-AUTO-1` {cond, n} confirmed unchanged (n = markers);
  `FM-MOVED-1` {k, cond, from_site, from_hz, site, hz, state}; `FM-ADDED-1` {k, cond, site, hz,
  state}; `FM-REMOVED-1` {site, hz, cond}; `FM-PEND-1` {cond, n} with n changes waiting;
  `FM-PEND-0` {cond} suggested, nothing changed, not confirmed; `FM-NONE-1` {cond} nothing
  suggested and nothing placed; `FM-Q-1` {k, cond, site, hz, question, answer} with `question`
  = `choice_parts["q.mu"]` or `["q.beta_spindle"]` and `answer` = `["answer.yes"]` or
  `["answer.no"]`; `FM-RULE-1` (no placeholder) once at the end of the block. Order (as the PDF
  prints it): per condition FM-NONE-1, or FM-AUTO-1 when nothing changed, else one FM-MOVED-1 /
  FM-ADDED-1 per changed marker and one FM-REMOVED-1 per removed suggestion; then FM-Q-1 for
  each answered question; FM-RULE-1 last. Before confirmation print FM-PEND-1 or FM-PEND-0 per
  condition instead. `k` numbers the markers per condition after removals: the remaining
  suggestions in their order, then the added ones. Unconfirmed markers block issue when the
  template shows the block (M57).
- Checklist over channel ERPs: `ERPCL-TICK-1` {comp, site, trial, lo, hi, items} one per row
  with ticks (row order of `erp_checklist.rows`), `items` = the ticked items in the order of
  `erp_checklist.items`, each `choice_parts["cl.<item>"]`, but `cl.more_negative` /
  `cl.less_negative` for `larger` / `smaller` when the row is `negative` (N1, N2, CNV), joined
  with `choice_parts.cl_sep`; `ERPCL-REST-1` {n} rows without a tick; `ERPCL-EMPTY-1` completed
  with nothing ticked; `ERPCL-PEND-1` not yet completed; `ERPCL-RULE-1` last, always.
- Parts added: `answer.yes`, `answer.no`, `q.mu`, `q.beta_spindle`, `cl.earlier`, `cl.later`,
  `cl.larger`, `cl.smaller`, `cl.more_negative`, `cl.less_negative`, `cl.shape`, `cl_sep`.

### Definitions with labels (`data.json` top level, labels EN and DE)

- `anamnesis_fields`: `{keys: [anamnesis, history, medication, current_symptoms], title {en,
  de}, labels {en, de: {key: label}}, store}`; values in `case.identity_store.anamnesis`.
- `recording_condition_fields`: `{keys, values {key: [codes] | "HH:MM"}, title, labels {en, de:
  {key: label}}, value_labels {en, de: {code: label}}}`; `value_labels.<lang>.not_documented`
  for `null`.
- `clinician_form` (TG6): `{rows: [{key, type: "date" | "yes_no", label {en, de}}], title,
  value_labels {en, de: {yes, no}}}`; rows are clinic-defined in a template; dates and yes or no
  only, no free text; a row label must pass the claim-word check (`terms`).
- `erp_checklist`: `{status: "core, to confirm", rows: [{id: "P1|go|O1", component, trial, site,
  window_ms: [lo, hi], negative, items}], items: [earlier, later, larger, smaller, shape],
  title, item_heads {en, de: {item: short head}}}`; CNV rows offer no latency items. The
  clinician ticks; the system computes nothing from the ticks and pre-ticks nothing.
- `report_inputs`: the synthetic clinician entries the sample PDFs print (M59), not the
  prototype's starting state: `{measurement: "M-M2", freq_markers {confirmed, moves: [{cond, n,
  site, hz}], removed: [{cond, n}], added: [{cond, site, hz}], answers: {"<cond>|<site>|<hz>":
  "yes" | "no"}}, erp_checklist {completed, ticks: {row id: [item]}}, clinician_form {key:
  value}}`. In the sample: markers confirmed unchanged, P1 at O1 and O2 (Go) ticked `later`,
  form dates and yes answers. The `hz` in an answer key is written without a trailing ".0"
  ("EC|C4|10").
- `legacy_map` (D2): `{template: "T06", clinic: "Clinic C", kind, language: "EN",
  reports_per_year: 280, summary, counts {status: n}, elements: [{id, section, what, class,
  status, analysis_row, leave_reason, gap, claim_wording, v4 {kind, block, answers_gap?},
  v4_label {en, de} | null, reason {en, de, model_suggestion?}}]}`. `status` is one of core;
  core, to confirm; clinic; clinician; schema gap; left out; later module; research only;
  dropped; open. `v4.block` is a report block ref of the PDF (`spectra.grid`, `freq.markers`,
  `method`, `issued`, ...) or a plain name ("clinic text", "clinician form", "table of
  contents"); `null` when nothing in V4 takes the element. `what` and `summary` are the model's
  neutral paraphrases (English only, never legacy template text); they name legacy functions
  outside the core (for example the classifier rows of table 3.3) as scope labels, so show them
  only on the mapping page as analysis text, never in a report. `text_check` does not scan
  `legacy_map`.

### Report blocks of the sample PDFs (`mockup/render.py`), for the prototype report to mirror

- Device `method` ("Method and norms"): the `method` sentences, then a table of the recording
  conditions. Device `freq.markers` (params `conditions`): a "core, to confirm" note, a table
  (No., condition, electrode, frequency, z cell with ring when marked, question and answer,
  choice: suggested and confirmed, moved and confirmed, placed by the clinician), one head map
  per marker (z at the marker's bin, square on the marker's electrode), the FM sentences.
  Device `erp.checklist`: a "core, to confirm (proposal for the clinical lead)" note, a table
  of rows x items with ticks, a dash for an item not offered, the ERPCL sentences. Both may be
  followed by a clinician comment.
- Clinician `anamnesis` with `fields` (heading "Anamnesis and clinical interview"): the four
  fields with their labels. Clinician `form` with `rows` (heading "Clinician form").
- `comparison` with `params.measurements: "all"`: every measurement oldest first (columns
  Earlier ... (uploaded later), Earlier ..., Current ...), maps of each, `CMP-N-1`, one
  `L-REPROC-1` per measurement processed again, `L-SIDE-1`, `L-IMPORT-1`.
- `versions`: adds device identifier (the UDI placeholder), pipeline, input checksum with
  "(synthetic input, not a recording file)", ICA seed, processed date, time and seconds.
- In the sample templates: `freq.markers` after `spectra.grid`, `erp.checklist` after
  `erp.channel`, `method` after `limits`, the structured anamnesis in all three, the clinician
  form in Clinic B only.

## Night round 2 (29 October, evening review): data and sentences (agent R)

Built by `mockup/textlib.py`, `mockup/render.py` and `mockup/prototype2/build_data.py`; values of
M1, M2 and M0 come from the synthetic data as before. Everything below is in `data.json`.

### Current and earlier measurements (review B7)

- One helper for every pipeline: `textlib.current_measurement(case)` (the case's `current_id`,
  else `current_index`, else the latest date) and `textlib.earlier_measurements(case)` (recorded
  before the current one, oldest first). Never pick a measurement by its list position.

### Result sets (review B7, lead decision 5; mockup assumption)

- Every measurement has `result_sets` = `[{id, n, software, pipeline, norms, created_at, frozen,
  used_by}]`, oldest first. Ids: `"RS-" + case code + "-" + MMDD + "-" + n`
  (`RS-MOCK-042-0312-2`); never write one literally, take it from the data.
- M1 (processed again): set 1 (`mockup pipeline 0.0.9`, created on 12 Mar 2026, `frozen: true`,
  `used_by: ["R-MOCK-042-0312 v1"]`) and set 2 (current pipeline, `used_by: ["comparison"]`).
  The values of both sets are the stored values (identical in the mockup).
- M2: one set, used by its report (`used_by: ["R-MOCK-042-0915"]`). M0 (uploaded later): one
  set, `used_by: ["comparison"]`. The extra cases: one set each.
- The current result set of a measurement is the last one. Print its id in the Versions rows.
- `L-REPROC-1` {date, sw, norms, rs2, rs1, report} names both sets; the new `L-REPROC-2` {date,
  sw, norms, rs} is the note for a measurement uploaded later (M0). Both arrive ready in
  `sentences.<lang>.comparison_limits[...]` and in `m2.limits`.

### Sentences changed or added

- Cleaning (review A5): the interface strings `sys.icaAuto`, `sys.icaMan`, `sys.icaManKeep`,
  `sys.icaManRm` are replaced by choice templates: `Q-ICA-AUTO-1` {k, n}; `Q-ICA-MAN-1` {ic,
  kind, k, n} one component kept against the proposal; `Q-ICA-MAN-2` {ic, kind, k, n} one
  removed against the proposal; `Q-ICA-MAN-3` {list, k, n} two or more changes, `list` = the
  items `choice_parts["ica.kept"]` / `["ica.removed"]` {ic, kind} in component order joined
  with `choice_parts.ica_sep`. `{kind}` = `choice_parts["ica.kind.<ref_map>"]` for the
  reference map the component matches (`blink`, `eye_h`, `muscle_l`, `muscle_r`, `muscle_f`,
  `amplifier`), or `["ica.kind.none"]` when it matches none. `k` = components removed after
  the changes, `n` = `quality.ica.n_components` (18 once the reseed of A10 lands).
- `Q-ICA-PEND-1` {k, n} (verify blocking 3): "{k} of {n} independent components are
  currently set for removal; not yet accepted by the clinician."
- Comparison (review C2): `CMP-1` and `CMP-N-1` are replaced by `CMP-G-1` {measure, dates,
  items}, one sentence per analysis and condition, then `CMP-RULE-1` {k, n, top, always} with
  the count. Selection: the 6 largest values marked in at least one measurement, plus every
  value marked at 3 z or more in any of them. The lists in `sentences.<lang>.comparisons[...]`
  and `comparisons_all` are ready to print.
- Asymmetry (review C15): `ASY-1` {band, pair, cond, v, side, dir, z}, one per marked pair
  with the index (2 decimals) and the electrode with more power; `ASY-2` when the printed index
  is 0.00.
- Summary (A3, C18): `SUM-RULE-2` no longer says "still to be confirmed"; `SUM-COUNT-1` also
  counts "spectrum per 0.5 Hz bin" and "global coherence". New key
  `sentences.<lang>.<mk>.summary_groups` = `[{stem, family, items: [{where, z}]}]`: the entries
  of SUM-2 in order (where is null for a single value), for the summary table of review C3
  (every item is marked).
- Latency wording (C6): "longer than" / "shorter than" the age norm (`state.later`,
  `state.earlier`, ERP-LAT-1); German sentences say "Untersucherin oder Untersucher" and
  "Normdaten".
- Method (B10): `MET-PROC-1` names the band-pass filter; `MET-SPEC-1` the windows, their
  overlap and the denominator of relative power; `MET-ERP-1` correct trials only, the peak
  windows and the CNV window; `MET-NORM-1` the norm group; `MET-MC-1` "a stand-in correction".
- No report for an age outside the norms (lead decision 2): `ISSUE-NONORM-1` {age, lo, hi}, also
  ready in `sentences.<lang>.m2.issue` (MOCK-061; `[]` for every other measurement). Show it in
  place of the Issue action; whether to block or to allow with a mark stays open for the
  clinical lead (APP.ann).

### Checklist over channel ERPs with neutral columns (lead decision 1)

- `erp_checklist`: `{status, rows: [{id, component, trial, site, window_ms, negative, latency}],
  columns: [{key: "reviewed", values: ["yes", "no"]}, {key: "peak", values: ["yes", "no",
  "uncertain"]}, {key: "latency_in_band", values: ["yes", "no"]}, {key: "comment", values:
  "text"}], title, heads {en, de: {column: head}}, value_labels {en, de: {yes, no,
  uncertain}}}`. `latency: false` (CNV): no latency column (show a dash). Nothing pre-filled;
  never normal or abnormal. The comment is the clinician's free text (identity store rules as for
  other free text).
- Entries (`report_inputs.erp_checklist` of the sample, and the shape the page should keep):
  `{completed, rows: {row id: {reviewed, peak, latency_in_band, comment}}}`.
- Sentences: `ERPCL-ROWS-1` {n, total} (rows reviewed), `ERPCL-PEAK-1` {answer, rows} once for
  "no" and once for "uncertain" when such rows exist, `ERPCL-LAT-1` {answer, rows} for the rows
  with latency outside the band ("no"), `ERPCL-RULE-1` last; before completion `ERPCL-PEND-1`
  and `ERPCL-RULE-1`. `{rows}` = `choice_parts["cl.row"]` {comp, site, trial} joined with
  `choice_parts.cl_sep`; `{answer}` = `choice_parts["cl.no"]` / `["cl.uncertain"]`.
- Retired: `ERPCL-TICK-1`, `ERPCL-REST-1`, `ERPCL-EMPTY-1`, the parts `cl.earlier` ...
  `cl.shape`. `erp_checklist.items`, `item_heads` and `rows[].items` stay as empty fields only
  so that a module not yet moved does not fail; do not use them.

### Other new fields

- Relative spectra and maps (review B1), per `spectra.conditions[cond]`: `rel_log_power`,
  `norm_rel_log_mean`, `norm_rel_log_sd` (19 x 59, log10 of the share of total power 1.5 to 30 Hz
  in the 0.5 Hz bin; percent = 100 x 10^x), `rel_z` (19 x 59), `maps_1hz_rel_z`,
  `maps_1hz_rel_marked` (29 x 19), and `relative_derived` (true while the synthetic data do not
  carry them: the norm band is a stand-in derived from the absolute norm; say so in an
  annotation). `null` without a norm.
- VCPT (review C8): `vcpt.omissions_per_block`, `vcpt.commissions_per_block` (10 blocks), two
  series for the errors chart (derived from the totals while the data store one series).
- `device_blocks` (review D3): the catalogue "Device blocks 2026.1": `{version, ref_pattern,
  blocks: {id: {version, status, result, prototype_blocks, variants: {name: params}}}}`.
  References are `id@version:variant` (`spectra.maps@1:abs+rel`); for the variant picker of the
  editor and for Versions ("Device blocks 2026.1").
- `pdf_templates` (review A8): the records of the sample PDFs, `{"CT-STD v3": {file,
  template_id, version, name, clinic, language, history, blocks: [{kind, ref, label}]}, "CT-A
  v3": ..., "CT-B v3": ...}`. The Clinic C sample PDF is the company standard CT-STD v3 (the
  heritage look); its device block list is the prototype's CT-STD v3. If the prototype changes
  CT-STD, change the record (or build the prototype's record from this one);
  `python3 -m mockup.checks.template_parity` fails while the two differ.
- `report_inputs` (sample clinician entries of the PDFs, M59) adds `erp_checklist` in the
  column format and `raw_excerpts` = `[{cond, start_s, seconds}]`: the 8 s excerpts the clinician
  added to the report from the recording viewer (review C12; the PDF prints them cleaned, in
  average reference, negative up).
- `recording_condition_fields` adds `last_dose_time` ("HH:MM"; "not applicable" without
  medication), `corrected_vision` (`not_needed`, `worn`) and `response_hand` (`right`, `left`);
  until the synthetic data carry them they read "not documented".

### Versions rows of the PDF (reviews A8, B11, D3, D6), for the Issued view to mirror

Report id and status; template ("CT-STD v3 · Clinic C · English"); software; device identifier
(UDI-DI placeholder); pipeline; norms with the dataset version; text library ("2026.1", German:
"(German wording not reviewed)"); device blocks ("Device blocks 2026.1"); recording system;
result set id; marking ("Benjamini-Hochberg, q = 0.05 within each analysis block (stand-in)");
input checksum of the de-identified signal with "(synthetic input, not a recording file)"; ICA
seed "(derived from the recording and stored)"; processed date, time and seconds.

### PDF layout changes the prototype report may mirror

No sentence id after a sentence in the clinic PDFs; a last block "Text sources" lists the ids per
section (review D7; the annotated build keeps the ids). Status notes ("core, to confirm") print
only in the annotated build (A3). One empty clinician block prints in a draft ("Clinician block,
empty in this sample"), the other empty ones are left out, an issued report leaves every empty
one out (C29). Raw excerpts only when the clinician chose some (C12). Issued samples:
`outputs/sample/report_clinic_c_en_issued_v1.pdf` and `..._v2.pdf` (review D1; "Signature:
electronic, by re-authentication at issue").
