"""Build the data and figure bundle for the clickable prototype (synthetic data only).

Writes mockup/prototype/assets.json: SVG figures from mockup.figures for the current and the
earlier measurement, the sentence library output, and small tables. The prototype page
(app.html) embeds this bundle; build with python3 -m mockup.prototype.build
"""

import json
from pathlib import Path

from .. import figures as fg
from .. import textlib as tl
from ..render import CASE_PATH, label_band

OUT = Path(__file__).resolve().parent / "assets.json"


def main():
    case = json.loads(CASE_PATH.read_text())
    m1, m2 = case["measurements"]
    lb = label_band("en")
    figs = {
        "maps_abs_EO": fg.band_maps_svg(case, m2, "EO", "abs_z", label_fn=lb),
        "maps_abs_EC": fg.band_maps_svg(case, m2, "EC", "abs_z", label_fn=lb),
        "maps_rel_EC": fg.band_maps_svg(case, m2, "EC", "rel_z", label_fn=lb),
        "maps_abs_EC_m1": fg.band_maps_svg(case, m1, "EC", "abs_z", label_fn=lb),
        "scale": fg.colourbar_svg(),
        "spectra_EC": fg.spectra_grid_svg(case, m2, "EC", earlier=m1),
        "erp_go": fg.erp_grid_svg(case, m2, "go"),
        "erp_nogo": fg.erp_grid_svg(case, m2, "nogo", earlier=m1),
        "coh_theta_EC": fg.coherence_svg(case, m2, "EC", "theta", title="theta 4-8 Hz"),
        "coh_alpha_EC": fg.coherence_svg(case, m2, "EC", "alpha", title="alpha 8-12 Hz"),
        "asym_EC": fg.asymmetry_svg(case, m2, "EC", label_fn=lb),
        "errors_block": fg.errors_per_block_svg(m2, earlier=m1),
    }
    s = {
        "summary": tl.summary_sentences(case, m2, "en"),
        "quality": tl.quality_sentences(m2, "en"),
        "spectra_EO": tl.spectral_sentences(case, m2, "EO", "en"),
        "spectra_EC": tl.spectral_sentences(case, m2, "EC", "en"),
        "ratios": tl.ratio_sentences(m2, "EO", "en") + tl.ratio_sentences(m2, "EC", "en"),
        "coherence": tl.coherence_sentences(m2, "EC", "en"),
        "asymmetry": tl.asymmetry_sentences(m2, "EC", "en"),
        "erp": tl.erp_sentences(m2, "en"),
        "behaviour": tl.behaviour_sentences(m2, "en"),
        "limits": tl.limits_sentences("en", m1),
        "comparison": tl.comparison_sentences(case, m2, m1, "en"),
    }
    tables = {
        "vcpt": {k: {"m1": m1["vcpt"][k], "m2": m2["vcpt"][k]}
                 for k in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms")},
        "peaks": m2["erp"]["peaks"],
        "ratios": {c: {k: m2["spectra"]["conditions"][c][k] for k in ("tbr", "faa", "alpha_peak")}
                   for c in ("EO", "EC")},
        "global_coh": {b: m2["coherence"]["EC"][b]["global"] for b in tl.BAND["en"]},
        "quality": m2["quality"],
        "dates": {"m1": m1["date"], "m2": m2["date"]},
    }
    bundle = {"figs": figs, "sentences": s, "tables": tables,
              "case": {"code": case["case_code"], "name": case["identity_store"]["display_name"],
                       "birth": case["identity_store"]["birth_date"], "sex": case["sex"]},
              "versions": m2["processed_with"]}
    OUT.write_text(json.dumps(bundle))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)",
          {k: len(v) // 1024 for k, v in figs.items()})


if __name__ == "__main__":
    main()
