"""Build mockup/prototype2/data.json: the synthetic case plus fixed sentences per measurement.

Values are rounded once, half up, to the precision they are printed with (`textlib.round_case`:
z to 1 decimal, ratios and coherence to 2, alpha peak and ERP amplitudes to 1, percentiles to
whole numbers), before the sentences are made. The PDF pipeline (`render.py`) starts from the same
rounded case, so tables and sentences in the page and in the PDF show the same digits (mockup
assumption M6, review C1). The boolean "marked" next to every z (mockup assumption M33) and the
per-block counts in `marking` come from the case as they are; sentences follow "marked".
"""

import json
from pathlib import Path

from .. import textlib as tl
from ..render import CASE_PATH

OUT = Path(__file__).resolve().parent / "data.json"


def main():
    case = tl.round_case(json.loads(CASE_PATH.read_text()))
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
