"""Build mockup/prototype2/data.json: the synthetic case plus fixed sentences per measurement.

Values are rounded once, half up, to the precision shown on screen (z and ratios to 1 or 2
decimals, percentiles to whole numbers), before the sentences are made, so tables in the page
and sentences always show the same digits (mockup assumption M6). The boolean "marked" next to
every z (mockup assumption M33) and the per-block counts in `marking` come from the case as they
are; sentences follow "marked".
"""

import json
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from .. import textlib as tl
from ..render import CASE_PATH

OUT = Path(__file__).resolve().parent / "data.json"


def hu(x, nd):
    return float(Decimal(str(x)).quantize(Decimal(1).scaleb(-nd), rounding=ROUND_HALF_UP))


def round_tree(o, key=None):
    if isinstance(o, dict):
        return {k: round_tree(v, k) for k, v in o.items()}
    if isinstance(o, list):
        return [round_tree(v, key) for v in o]
    if isinstance(o, float):
        if key and (key == "z" or key.endswith("_z") or key == "maps_1hz_z"):
            return hu(o, 1)
        if key == "percentile":
            return hu(o, 0)
    return o


def main():
    case = round_tree(json.loads(CASE_PATH.read_text()))
    for m in case["measurements"]:
        for r in m["raw"].values():
            r["channels"] = {k: v[::2] for k, v in r["channels"].items()}
            r["fs"] = 64
        for c in m["spectra"]["conditions"].values():
            for k in ("log_power", "norm_log_mean", "norm_log_sd"):
                c[k] = [[round(x, 2) for x in row] for row in c[k]]
    m1, m2 = case["measurements"]

    def sents(m, e=None, lang="en"):
        return {
            "summary": tl.summary_sentences(case, m, lang), "quality": tl.quality_sentences(m, lang),
            "spectra_EO": tl.spectral_sentences(case, m, "EO", lang),
            "spectra_EC": tl.spectral_sentences(case, m, "EC", lang),
            "ratios": tl.ratio_sentences(m, "EO", lang) + tl.ratio_sentences(m, "EC", lang),
            "asymmetry_EO": tl.asymmetry_sentences(m, "EO", lang),
            "asymmetry_EC": tl.asymmetry_sentences(m, "EC", lang),
            "coherence_EO": tl.coherence_sentences(m, "EO", lang),
            "coherence_EC": tl.coherence_sentences(m, "EC", lang),
            "erp": tl.erp_sentences(m, lang), "behaviour": tl.behaviour_sentences(m, lang),
            "limits": tl.limits_sentences(lang, e),
            "comparison": tl.comparison_sentences(case, m, e, lang) if e else [],
        }

    # one set of sentences per interface and report language, same structure in each:
    # sentences.<lang>.m1|m2.<key> (Japanese is a later market and not loaded in the prototype)
    probs = tl.check_library()
    if probs:
        raise SystemExit(f"forbidden-word check failed: {probs}")
    bundle = {"case": case, "sentences": {lang: {"m1": sents(m1, None, lang), "m2": sents(m2, m1, lang)}
                                          for lang in ("en", "de")}}
    OUT.write_text(json.dumps(bundle, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
