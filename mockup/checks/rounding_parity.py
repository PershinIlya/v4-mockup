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
the sentences stored in `data.json`, and compares the report id format of both pipelines.

Read only: it imports the helpers and changes nothing. Exit code 1 when any mismatch is found.

Usage: python3 -m mockup.checks.rounding_parity [--examples N]
"""

import json
import re
import sys
from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from .. import textlib as tl
from ..render import fmtz, load_case, report_label

P2 = Path(__file__).resolve().parents[1] / "prototype2"
DATA = P2 / "data.json"


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


def numbers(raw, proto):
    """(path, raw, proto) for numeric leaves of the measurements."""
    for i, (a, b) in enumerate(zip(raw["measurements"], proto["measurements"])):
        for path, x, y in walk(a, b, (f"m{i + 1}",)):
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
    (r"\.alpha_peak\.norm_mean$", 1, 2, "b_results ratios (c_report uses 1)"),
    (r"coherence\.E[OC]\.[^.]+\.pairs\.value$", 2, 2, "b_results and c_report coherence tables"),
    (r"coherence\.E[OC]\.[^.]+\.global\.value$", 2, 2, "b_results and c_report global coherence"),
    (r"erp\.peaks\.amplitude_uv$", 1, 1, "b_results and c_report peak tables"),
    (r"erp\.peaks\.latency_ms$", None, None, "peak tables"),
    (r"vcpt\.\w+\.value$", None, None, "VCPT tables"),
]


def main():
    nex = int(sys.argv[sys.argv.index("--examples") + 1]) if "--examples" in sys.argv else 2
    raw = load_case()  # the case exactly as the PDF pipeline loads it
    bundle = json.loads(DATA.read_text())
    proto = bundle["case"]
    bad = 0

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
    m1, m2 = raw["measurements"]
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
            "comparison": lambda m, e, L: tl.comparison_sentences(raw, m, e, L) if e else []}
    sm, st = [], 0
    for lang in ("en", "de"):
        for mk, m, e in (("m1", m1, None), ("m2", m2, m1)):
            for k, fn in keys.items():
                a = [s["text"] for s in fn(m, e, lang)]
                b = [s["text"] for s in bundle["sentences"][lang][mk][k]]
                st += max(len(a), len(b))
                for i in range(max(len(a), len(b))):
                    sa = a[i] if i < len(a) else "(none)"
                    sb = b[i] if i < len(b) else "(none)"
                    if sa != sb:
                        sm.append((lang, mk, k, sa, sb))
    bad += len(sm)
    print(f"\n4. sentences: {len(sm)} of {st} differ between the PDF and the prototype")
    for lang, mk, k, sa, sb in sm[:nex * 3]:
        da = [w for w in re.findall(r"-?\d+[.,]\d+", sa)]
        db = [w for w in re.findall(r"-?\d+[.,]\d+", sb)]
        dd = [f"{x} vs {y}" for x, y in zip(da, db) if x != y]
        print(f"      {lang} {mk} {k}: {', '.join(dd) or 'text differs'}")
        print(f"         PDF:       {sa[:150]}")
        print(f"         prototype: {sb[:150]}")

    # 5. report id: the PDF footer and versions block against the prototype's "R-MOCK-042 v{n}"
    pdf_id = report_label({"id": f'R-{raw["case_code"]}', "version": 1})
    src = "\n".join(f.read_text() for f in [P2 / "shell.html", *sorted((P2 / "modules").glob("*.js"))])
    proto_ids = set(re.findall(r"R-MOCK-\d+(?:-[A-Z0-9]+)? v\$\{", src))
    want = pdf_id.replace(" v1", " v${")
    idbad = 0 if proto_ids == {want} else 1
    bad += idbad
    print(f"\n5. report id: PDF prints {pdf_id!r}; prototype prints {sorted(proto_ids)}"
          f" -> {'differ' if idbad else 'same format'}")

    print(f"\n{'FAIL' if bad else 'OK'}: {bad} mismatches")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
