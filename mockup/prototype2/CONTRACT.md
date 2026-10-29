# Prototype v2: module contract

The clickable mockup must look and feel like the future V4 web product, not like a spec
checklist: terse product copy, dense working panels, real-looking tools (an EEG viewer like
clinical EEG software, interactive maps and curves, a document-like report editor). Explanatory
prose and spec references belong only in `APP.ann('...')` badges, hidden unless the viewer
switches "Annotations" on. No paragraphs explaining the spec on screens.

Read `/home/user/v4-mockup/CLAUDE.md` (hard rules 1, 2, 5). Synthetic data only; clinics are
"Clinic C"; people are "Clinician 1"; no condition names attached to results, no interpretation,
no treatment advice; system text comes only from `APP.sentences` (fixed library). English UI.
No em or en dashes in any visible text.

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
  - `spectra.freqs` (1 to 30 Hz, step 0.5); `spectra.conditions.EO|EC`: `log_power`,
    `norm_log_mean`, `norm_log_sd`, `z` (each 19 x 59, log10 uV^2/Hz); `bands[band]`:
    `abs_uv2`, `abs_z`, `rel_pct`, `rel_z` (19 values); `maps_1hz_z` (29 x 19, 1-2 Hz to 29-30 Hz);
    `alpha_peak` {hz, norm_mean, norm_sd, z}; `tbr` {site, value, norm_mean, z};
    `faa` {value, norm_mean, norm_sd, z}; `asymmetry[band]` = [{pair, value, z}] (8 pairs).
  - `coherence.EO|EC[band]`: `pairs` = [{pair: "Fp1-Fp2", value, z}] (171), `global` {value, z, status}.
  - `erp.times_ms` (-200 to 800, step 4); `erp.conditions.go|nogo|ignore|novelty.channels[ch]`:
    `patient_uv`, `norm_mean_uv`, `norm_sd_uv`; `erp.peaks` = [{component, condition, site,
    amplitude_uv, amplitude_z, latency_ms, latency_z, norm_amplitude_uv, norm_latency_ms}], read
    off the curves (CNV: mean over `window_ms`, latency null).
  - `vcpt`: `omissions|commissions|rt_mean_ms|rt_sd_ms` {value, z, percentile},
    `errors_per_block` (10 blocks of 40 trials), `trials`.
  - `quality`: `recordings.EO|EC|VCPT` {recorded_s, analysed_s}, `accepted_trials`,
    `ica` {n_components: 19, proposed_removed: [{ic, kind, confidence}]}.
  - `raw.EO|EC`: `fs` 64, `seconds` 10, `channels[ch]` (uV): a short real excerpt; longer
    signals for the viewer may be generated in the page (seeded, deterministic).
  - `processed_with` {software, norms, reprocessed}.
- Sentences (fixed library output, show with `APP.sys(list)`): `APP.sentences.m2.<key>` and
  `.m1.<key>` with keys `summary, quality, spectra_EO, spectra_EC, ratios, asymmetry_EO,
  asymmetry_EC, coherence_EO, coherence_EC, erp, behaviour, limits, comparison` (comparison
  only for m2). Each item {id, text}. `APP.qualitySentences()` returns the quality sentences with
  the cleaning sentence that matches what the clinician did.
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
