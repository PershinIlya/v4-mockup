"""Rounding parity between the PDF pipeline and the prototype (review C1).

Every z and value that both pipelines print is formatted the way each pipeline formats it, and the
two strings are compared:

- PDF pipeline: the case as `render.load_case()` loads it (the synthetic case rounded once by
  `textlib.round_case`), formatted with the helpers of `mockup/render.py` (`fmtz`) and
  `mockup/textlib.py` (`num`, `fmt_z`, half up, the percentile rule).
- Prototype: `mockup/prototype2/data.json` (written by `build_data.py` from the same
  `textlib.round_case`), printed in the page with JavaScript `Number.prototype.toFixed` (`APP.nf`
  in `shell.html`, `fz` and `n1` in `b_results.js`, `fx` in `c_report.js`). `toFixed` is
  emulated exactly here.

It also rebuilds the fixed sentences from the case as the PDF loads it and compares them with
the sentences stored in `data.json`, compares the exported choice sentences with textlib, and
compares the report ids of both pipelines: the PDF (`render.Ctx`, every clinic template), the
prototype data (`report_ids`), every id written literally in the prototype source, and the ids
the built page shows (`report_ids.js`, headless Chromium through Playwright, when available).

Read only: it imports the helpers and changes nothing. Exit code 1 when any mismatch is found.

Usage: python3 -m mockup.checks.rounding_parity [--examples N]
"""

import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from .. import textlib as tl
from ..render import Ctx, fmtz, load_case, report_label

P2 = Path(__file__).resolve().parents[1] / "prototype2"
DATA = P2 / "data.json"
REPO = Path(__file__).resolve().parents[2]
TEMPLATES = Path(__file__).resolve().parents[1] / "clinic_templates"
BUILT = REPO / "outputs" / "prototype" / "v4-clinic-workspace.html"
IDS_JS = Path(__file__).resolve().parent / "report_ids.js"
SYN = REPO / "data" / "synthetic"
EXTRA = {"MOCK-057": SYN / "case_mock057.json", "MOCK-061": SYN / "case_mock061.json"}
EXPECTED_ID = "R-MOCK-042-0915 v1"   # shared decision for the September measurement, version 1


def js_tofixed(x, d):
    """Exact emulation of JavaScript Number.prototype.toFixed for |x| < 1e21: the exact binary
    value is rounded, ties go to the larger n; a negative number is handled as -x with a "-"
    prefix (so -0 prints "0.0", -0.04 prints "-0.0")."""
    neg = x < 0
    q = abs(Decimal(x)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    s = f"{q:.{d}f}"
    return "-" + s if neg else s


def proto_fz(z):
    """b_results.js fz: |z| < 0.05 prints as 0."""
    return js_tofixed(0 if abs(z) < 0.05 else z, 1)


def pdf_pct(p):
    """render.py d_vcpt and textlib.behaviour_sentences."""
    return f"{int(p + 0.5)}" if p < 99.5 else ">99"


def is_z(key):
    return key is not None and (key == "z" or key.endswith("_z"))


def walk(a, b, path=()):
    """Yield (path, raw, proto) for every leaf present in both trees."""
    if isinstance(a, dict) and isinstance(b, dict):
        for k in a:
            if k in b:
                yield from walk(a[k], b[k], path + (k,))
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)):
            yield from walk(x, y, path + (i,))
    else:
        yield path, a, b


def family(path):
    """A readable family name: the path without list indices and channel or band keys."""
    keep = ["<band>" if p in BANDS else str(p) for p in path if not isinstance(p, int)]
    return ".".join(keep)


BANDS = {"delta", "theta", "alpha", "smr", "beta1", "beta2"}


def mkey(m):
    """"m1", "m2", "m0" from the measurement id "M-M1" ... (data.json keys)."""
    return m["id"].split("-")[-1].lower()


def numbers(raw, proto, prefix=""):
    """(path, raw, proto) for numeric leaves of the measurements."""
    for a, b in zip(raw["measurements"], proto["measurements"]):
        for path, x, y in walk(a, b, (f"{prefix}{mkey(a)}",)):
            if isinstance(x, (int, float)) and isinstance(y, (int, float)) \
                    and not isinstance(x, bool) and not isinstance(y, bool):
                yield path, x, y


# Values printed in both pipelines: (pattern on the family, PDF decimals, prototype decimals,
# where the prototype prints it). None decimals means printed as stored (str of the value).
VALUES = [
    (r"\.tbr\.value$", 2, 2, "b_results ratios, c_report ratios"),
    (r"\.faa\.value$", 2, 2, "b_results ratios, c_report ratios"),
    (r"\.alpha_peak\.hz$", 1, 1, "b_results ratios, c_report ratios"),
    (r"\.tbr\.norm_mean$", 2, 2, "b_results ratios, c_report ratios"),
    (r"\.faa\.norm_mean$", 2, 2, "b_results ratios, c_report ratios"),
    (r"\.alpha_peak\.norm_mean$", 1, 1, "b_results ratios, c_report ratios"),
    (r"coherence\.E[OC]\.[^.]+\.pairs\.value$", 2, 2, "b_results and c_report coherence tables"),
    (r"coherence\.E[OC]\.[^.]+\.global\.value$", 2, 2, "b_results and c_report global coherence"),
    (r"erp\.peaks\.amplitude_uv$", 1, 1, "b_results and c_report peak tables"),
    (r"erp\.peaks\.latency_ms$", None, None, "peak tables"),
    (r"vcpt\.\w+\.value$", None, None, "VCPT tables"),
]


def report_id_probe(raw, bundle):
    """Mismatches of the report id between the PDF and the prototype (probe 5)."""
    probs, lines = [], []
    want = {mkey(m): tl.report_id(raw["case_code"], m["date"]) for m in raw["measurements"]}
    cur = raw["measurements"][raw.get("current_index", len(raw["measurements"]) - 1)]
    if tl.report_id(raw["case_code"], cur["date"], 1) != EXPECTED_ID:
        probs.append(f"textlib.report_id gives "
                     f"{tl.report_id(raw['case_code'], cur['date'], 1)!r}, "
                     f"shared decision {EXPECTED_ID!r}")
    # PDF: the label the versions block and the footer print, for every clinic template
    for f in sorted(TEMPLATES.glob("*.json")):
        tpl = json.loads(f.read_text())
        ctx = Ctx(raw, tpl, False)
        lab = report_label({**ctx.report, "version": 1})
        lines.append(f"PDF {f.stem}: {lab!r}")
        if lab != EXPECTED_ID:
            probs.append(f"PDF {f.stem} prints {lab!r}")
        if "id" in tpl.get("report", {}):
            probs.append(f"template {f.stem} still carries report.id {tpl['report']['id']!r}")
    # prototype data
    got = bundle.get("report_ids")
    lines.append(f"data.json report_ids: {got}")
    if got != want:
        probs.append(f"data.json report_ids {got} differ from {want}")
    # the extra cases (night round): their ids come from data.json too
    for code, path in EXTRA.items():
        xc = json.loads(path.read_text())
        xw = {"m2": tl.report_id(code, xc["measurements"][0]["date"])}
        got_x = bundle.get("extra_cases", {}).get(code, {}).get("report_ids")
        lines.append(f"data.json extra_cases.{code}.report_ids: {got_x}")
        if got_x != xw:
            probs.append(f"extra case {code}: report_ids {got_x} differ from {xw}")
    # prototype source: every id written literally must follow the rule
    ok_ids = set(want.values()) | {v for b in bundle.get("extra_cases", {}).values()
                                   for v in b["report_ids"].values()}
    src = {f.name: f.read_text() for f in [P2 / "shell.html", *sorted((P2 / "modules").glob("*.js"))]}
    lit = {}
    for name, text in src.items():
        for mm in re.finditer(r"R-MOCK[-\w]*", text):
            lit.setdefault(mm.group(0), set()).add(name)
    for x, where in sorted(lit.items()):
        if x not in ok_ids:
            probs.append(f"prototype source writes {x!r} ({', '.join(sorted(where))})")
    lines.append(f"prototype source literals: {sorted(lit) or 'none (ids come from data)'}")
    # built page: the ids it shows
    node = shutil.which("node")
    if node and BUILT.exists():
        try:
            r = subprocess.run([node, str(IDS_JS), str(BUILT)], capture_output=True, text=True,
                               timeout=180, cwd=P2)
            res = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception as e:  # noqa: BLE001
            res = None
            lines.append(f"built page: not checked ({type(e).__name__})")
        if res is not None:
            shown = res["ids"]
            lines.append(f"built page shows: {sorted(shown)}")
            for x, routes in sorted(shown.items()):
                if x.rsplit(" v", 1)[0] not in ok_ids:
                    probs.append(f"built page shows {x!r} ({', '.join(routes)})")
            if EXPECTED_ID not in shown:
                probs.append(f"built page never shows {EXPECTED_ID!r}")
            stale = [f.name for f in [*(P2 / "modules").glob("*.js"), P2 / "shell.html", DATA]
                     if f.stat().st_mtime > BUILT.stat().st_mtime]
            if stale:
                lines.append(f"note: built page is older than {sorted(stale)}; rebuild with "
                             f"python3 -m mockup.prototype2.build")
    else:
        lines.append("built page: not checked (node or the built page is missing)")
    print("\n5. report id")
    for x in lines:
        print(f"   {x}")
    for x in probs:
        print(f"   MISMATCH {x}")
    print(f"   -> {'differ' if probs else 'same format'}")
    return len(probs)


def all_numbers(raw, proto, extra, bundle):
    """Numeric leaves of the main case and of every extra case (night round)."""
    yield from numbers(raw, proto)
    for code, xc in extra.items():
        yield from numbers(xc, bundle["extra_cases"][code]["case"], prefix=f"{code}.")


def main():
    nex = int(sys.argv[sys.argv.index("--examples") + 1]) if "--examples" in sys.argv else 2
    raw = load_case()  # the case exactly as the PDF pipeline loads it
    bundle = json.loads(DATA.read_text())
    proto = bundle["case"]
    extra = {code: tl.round_case(json.loads(p.read_text())) for code, p in EXTRA.items()}
    bad = 0

    def numbers(raw_, proto_):   # noqa: F811 (every case, main and extra)
        return all_numbers(raw_, proto_, extra, bundle)

    # 1. z values: PDF fmtz (render.py) and fmt_z (textlib.py) against prototype toFixed(1)
    zt, zm = defaultdict(int), defaultdict(list)
    for path, x, y in numbers(raw, proto):
        if not is_z(next(p for p in reversed(path) if not isinstance(p, int))):
            continue
        f = family(path)
        zt[f] += 1
        pdf_t, pdf_s, pr = fmtz(x), tl.fmt_z(x, "en"), proto_fz(y)
        if pdf_t != pr or pdf_s.replace("-0.0", "0.0") != pr:
            zm[f].append((path, x, pdf_t, pdf_s, pr))
    print(f"1. z values: {sum(map(len, zm.values()))} of {sum(zt.values())} differ"
          " (PDF table fmtz / PDF sentence fmt_z / prototype)")
    for f in sorted(zt):
        n = len(zm[f])
        bad += n
        print(f"   {f}: {n} of {zt[f]} differ")
        for path, x, a, s, c in zm[f][:nex]:
            print(f"      {'/'.join(map(str, path))}: raw {x!r} -> PDF {a} (sentence {s}),"
                  f" prototype {c}")
    neg0 = sum(1 for p, x, _ in numbers(raw, proto)
               if is_z(next(k for k in reversed(p) if not isinstance(k, int)))
               and tl.fmt_z(x, "en") == "-0.0")
    bad += neg0
    print(f"   negative zero: textlib.fmt_z prints '-0.0' for {neg0} z values")

    # 2. percentiles
    pm, pt = [], 0
    for path, x, y in numbers(raw, proto):
        if path[-1] == "percentile":
            pt += 1
            a, b = pdf_pct(x), js_tofixed(round(y), 0)
            if a != b:
                pm.append((path, x, a, b))
    bad += len(pm)
    print(f"\n2. percentiles: {len(pm)} of {pt} differ (PDF int(p + 0.5) or >99; prototype"
          " Math.round of the half-up value)")
    for path, x, a, b in pm[:nex]:
        print(f"      {'/'.join(map(str, path))}: raw {x!r} -> PDF {a}, prototype {b}")

    # 3. values
    print("\n3. values (PDF decimals / prototype decimals)")
    for pat, nd_pdf, nd_pr, where in VALUES:
        rows = [(p, x, y) for p, x, y in numbers(raw, proto) if re.search(pat, family(p))]
        diff_round, diff_prec = [], 0
        for p, x, y in rows:
            if nd_pdf is None:
                a, b = str(x), str(y)
            else:
                a, b = tl.num(x, nd_pdf, "en"), js_tofixed(y, nd_pr)
            if nd_pdf != nd_pr:
                diff_prec += 1
                # same digits after cutting to the PDF precision?
                b = js_tofixed(y, nd_pdf)
            if a != b:
                diff_round.append((p, x, a, b))
        bad += len(diff_round)
        prec = (f"; printed with {nd_pdf} decimals in the PDF and {nd_pr} in the prototype"
                f" ({where})" if nd_pdf != nd_pr else "")
        print(f"   {pat}: {len(diff_round)} of {len(rows)} round differently{prec}")
        for p, x, a, b in diff_round[:nex]:
            print(f"      {'/'.join(map(str, p))}: raw {x!r} -> PDF {a}, prototype {b}")

    # 4. sentences: rebuilt from the raw case as the PDF does, against data.json
    ms = {mkey(m): m for m in raw["measurements"]}
    m1, m2 = ms["m1"], ms["m2"]
    keys = {"summary": lambda m, e, L: tl.summary_sentences(raw, m, L),
            "quality": lambda m, e, L: tl.quality_sentences(m, L),
            "spectra_EO": lambda m, e, L: tl.spectral_sentences(raw, m, "EO", L),
            "spectra_EC": lambda m, e, L: tl.spectral_sentences(raw, m, "EC", L),
            "ratios": lambda m, e, L: tl.ratio_sentences(m, "EO", L) + tl.ratio_sentences(m, "EC", L),
            "asymmetry_EO": lambda m, e, L: tl.asymmetry_sentences(m, "EO", L),
            "asymmetry_EC": lambda m, e, L: tl.asymmetry_sentences(m, "EC", L),
            "coherence_EO": lambda m, e, L: tl.coherence_sentences(m, "EO", L),
            "coherence_EC": lambda m, e, L: tl.coherence_sentences(m, "EC", L),
            "erp": lambda m, e, L: tl.erp_sentences(m, L),
            "behaviour": lambda m, e, L: tl.behaviour_sentences(m, L),
            "comparison": lambda m, e, L: tl.comparison_sentences(raw, m, e, L) if e else [],
            "method": lambda m, e, L: tl.method_sentences(m, L)}
    sm, st = [], 0

    def cmp(lang, where, k, a, b):
        nonlocal st
        a, b = [s["text"] for s in a], [s["text"] for s in b]
        st += max(len(a), len(b))
        for i in range(max(len(a), len(b))):
            sa = a[i] if i < len(a) else "(none)"
            sb = b[i] if i < len(b) else "(none)"
            if sa != sb:
                sm.append((lang, where, k, sa, sb))

    by_date = sorted(raw["measurements"], key=lambda m: m["date"])
    for lang in ("en", "de"):
        for mk, m, e in (("m1", m1, None), ("m2", m2, m1), ("m0", ms["m0"], None)):
            for k, fn in keys.items():
                cmp(lang, mk, k, fn(m, e, lang), bundle["sentences"][lang][mk][k])
        # every ordered pair of measurements (later | earlier) and all of them side by side
        for i, a in enumerate(by_date):
            for b in by_date[i + 1:]:
                key = f"{mkey(b).upper()}|{mkey(a).upper()}"
                cmp(lang, "comparisons", key, tl.comparison_sentences(raw, b, a, lang),
                    bundle["sentences"][lang]["comparisons"][key])
        cmp(lang, "comparisons_all", "", tl.comparison_n_sentences(raw, by_date, lang),
            bundle["sentences"][lang]["comparisons_all"])
        # the extra cases: the only measurement is the current one (key m2)
        for code, xc in extra.items():
            xm = xc["measurements"][0]
            xkeys = dict(keys)
            xkeys.update({"summary": lambda m, e, L: tl.summary_sentences(xc, m, L),
                          "spectra_EO": lambda m, e, L: tl.spectral_sentences(xc, m, "EO", L),
                          "spectra_EC": lambda m, e, L: tl.spectral_sentences(xc, m, "EC", L),
                          "limits": lambda m, e, L: tl.limits_sentences(L, None, m)})
            for k, fn in xkeys.items():
                cmp(lang, f"{code}.m2", k, fn(xm, None, lang),
                    bundle["extra_cases"][code]["sentences"][lang]["m2"][k])
    bad += len(sm)
    print(f"\n4. sentences: {len(sm)} of {st} differ between the PDF and the prototype")
    for lang, mk, k, sa, sb in sm[:nex * 3]:
        da = [w for w in re.findall(r"-?\d+[.,]\d+", sa)]
        db = [w for w in re.findall(r"-?\d+[.,]\d+", sb)]
        dd = [f"{x} vs {y}" for x, y in zip(da, db) if x != y]
        print(f"      {lang} {mk} {k}: {', '.join(dd) or 'text differs'}")
        print(f"         PDF:       {sa[:150]}")
        print(f"         prototype: {sb[:150]}")

    # 5. report id: "R-" + case code + "-" + measurement date as MMDD + " v" + version
    bad += report_id_probe(raw, bundle)

    # 6. choice sentences: data.json against textlib (one id set for both pipelines)
    choice, parts = tl.choice_export(("en", "de"))
    cbad = []
    if bundle.get("choice_sentences") != choice:
        cbad.append("choice_sentences differ from textlib (rerun build_data)")
    if bundle.get("choice_parts") != parts:
        cbad.append("choice_parts differ from textlib (rerun build_data)")
    bad += len(cbad)
    print(f"\n6. choice sentences: {len(tl.CHOICE_IDS)} ids, "
          f"{'; '.join(cbad) if cbad else 'data.json matches textlib'}")

    print(f"\n{'FAIL' if bad else 'OK'}: {bad} mismatches")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
