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
    `ica` {n_components: 19, proposed_removed: [{ic, kind, ref_map, corr}], clinician_change}:
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
    per condition whose analysed seconds differ from the proposal; `Q-SEG-PEND-1` {n}.
  - `MK-AUTO-1` {suggested, state}; `MK-MOVED-1` {suggested, confirmed, state} (Hz with 1
    decimal).
  - `ERP-PEAK-AUTO-1` {trial}, one per trial type with a movable latency; `ERP-PEAK-MAN-1`
    {comp, site, trial, from_ms, to_ms, lat_state, amp_uv, amp_state}, one per moved peak;
    `ERP-PEAK-PEND-1` {trial, n}.
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
