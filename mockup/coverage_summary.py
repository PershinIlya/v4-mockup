"""Summarise the pseudonymised template models in coverage/models/ into Markdown tables.

Classes follow the v2 modelling rules, with the statuses of table 3.3 of 30 October: in the scope
of the core are device, core_proposed (table 3.3 "Core, proposed": beyond the clinical lead's list
of 5 October, covered only if he agrees), clinic, clinician and not_expressible; outside are
later_module, research_only, dropped, open; and leave_out marks legacy content V4 must not carry
over and that needs no schema support. The status "to confirm" is gone (its rows are Core): an
element still in the retired class to_confirm counts as device.

- Coverage of a template = (in scope minus not_expressible) / in scope.
- Carried over as is = in-scope elements that are expressible and carry no claim wording,
  divided by in scope.
- Weighted figures use reports a year (rounded to the nearest 10).
- Gap ids are TG1 to TG12 (template gap), so they do not clash with the open question ids of the
  specification repository.

Usage: python3 -m mockup.coverage_summary [--json]
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

DIR = Path(__file__).resolve().parent.parent / "coverage" / "models"
IN_SCOPE = ["device", "core_proposed", "clinic", "clinician", "not_expressible"]
OUTSIDE = ["later_module", "research_only", "dropped", "open"]
ALL = IN_SCOPE + OUTSIDE + ["leave_out"]
RETIRED = {"to_confirm": "device"}   # table 3.3 of 30 October: no status "to confirm"
GAP_NAMES = {
    "TG1": "Clinic overlays on device figures", "TG2": "Bilingual device titles",
    "TG3": "Neutral age variants of clinic text", "TG4": "Device table that hides when empty",
    "TG5": "Table of contents and cross-references", "TG6": "Clinician structured form",
    "TG7": "Several output documents from one record", "TG8": "Any number of measurements",
    "TG9": "Per-channel head map", "TG10": "Device metadata placeholders",
    "TG11": "Issue-time signature block", "TG12": "Other",
}


def load():
    rows = []
    for f in sorted(DIR.glob("T*.json")):
        d = json.loads(f.read_text())
        for e in d["elements"]:
            e["class"] = RETIRED.get(e["class"], e["class"])
        c = {k: 0 for k in ALL}
        for e in d["elements"]:
            c[e["class"]] += 1
        scope = [e for e in d["elements"] if e["class"] in IN_SCOPE]
        ne = sum(1 for e in scope if e["class"] == "not_expressible")
        as_is = sum(1 for e in scope if e["class"] != "not_expressible" and not e.get("claim_wording"))
        texts = [e for e in d["elements"] if e["class"] == "clinic" and e.get("clinic_kind") == "text"]
        rows.append({
            "t": d["template"], "clinic": d["clinic"], "kind": d["kind"], "lang": d["language"],
            "reports": d["reports_per_year"], "n": len(d["elements"]), "c": c,
            "scope": len(scope), "cov": (len(scope) - ne) / len(scope) if scope else 0.0,
            "as_is": as_is / len(scope) if scope else 0.0,
            "clinic_texts": len(texts), "claim_texts": sum(1 for e in texts if e.get("claim_wording")),
            "claim_elsewhere": sum(1 for e in d["elements"] if e.get("claim_wording")
                                   and not (e["class"] == "clinic" and e.get("clinic_kind") == "text")),
            "gaps": sorted({e["gap"] for e in d["elements"] if e.get("gap")}),
            "leave": defaultdict(int, {}),
            "theme_gaps": d.get("theme_gaps", []),
        })
        for e in d["elements"]:
            if e["class"] == "leave_out":
                rows[-1]["leave"][e.get("leave_reason") or "unspecified"] += 1
    return rows


def weighted(rows, key):
    w = sum(r["reports"] for r in rows)
    return sum(r["reports"] * r[key] for r in rows) / w if w else 0.0


def pct(x):
    return f"{100 * x:.0f}%"


def summary(rows):
    tot = {k: sum(r["c"][k] for r in rows) for k in ALL}
    scope = sum(tot[k] for k in IN_SCOPE)
    first = [r for r in rows if r["lang"] in ("EN", "DE")]
    ja = [r for r in rows if r["lang"] == "JA"]
    gaps = defaultdict(lambda: {"templates": [], "reports": 0})
    for r in rows:
        for g in r["gaps"]:
            gaps[g]["templates"].append(r["t"])
            gaps[g]["reports"] += r["reports"]
    leave = defaultdict(int)
    for r in rows:
        for k, v in r["leave"].items():
            leave[k] += v
    return {
        "elements": sum(tot.values()), "totals": tot, "scope": scope,
        "cov_pooled": (scope - tot["not_expressible"]) / scope,
        "cov_weighted": weighted(rows, "cov"), "cov_first_release": weighted(first, "cov"),
        "cov_ja": weighted(ja, "cov"),
        "as_is_weighted": weighted(rows, "as_is"), "as_is_first_release": weighted(first, "as_is"),
        "as_is_ja": weighted(ja, "as_is"),
        "clinic_texts": sum(r["clinic_texts"] for r in rows),
        "claim_texts": sum(r["claim_texts"] for r in rows),
        "claim_elsewhere": sum(r["claim_elsewhere"] for r in rows),
        "reports": sum(r["reports"] for r in rows),
        "reports_first": sum(r["reports"] for r in first), "reports_ja": sum(r["reports"] for r in ja),
        "gaps": dict(sorted(gaps.items(), key=lambda kv: -kv[1]["reports"])),
        "leave": dict(leave),
    }


def main():
    rows = load()
    s = summary(rows)
    if "--json" in sys.argv:
        print(json.dumps({"rows": [{k: v for k, v in r.items() if k != "leave"} for r in rows],
                          "summary": s}, indent=1, default=dict))
        return
    print("| Template | Clinic | Kind | Lang | Reports a year | Elements | Device | Core, proposed | Clinic | Clinician | Not expressible | Leave out | Outside the core | Coverage | Carried over as is | Clinic texts with claim wording |")
    print("| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
    for r in rows:
        c = r["c"]
        print(f'| {r["t"]} | {r["clinic"]} | {r["kind"]} | {r["lang"]} | {r["reports"]:,} | {r["n"]} | '
              f'{c["device"]} | {c["core_proposed"]} | {c["clinic"]} | {c["clinician"]} | '
              f'{c["not_expressible"]} | {c["leave_out"]} | {sum(c[k] for k in OUTSIDE)} | '
              + (f'{pct(r["cov"])} | {pct(r["as_is"])} | {r["claim_texts"]} of {r["clinic_texts"]} |'
                 if r["scope"] else 'none in scope | | |'))
    t = s["totals"]
    print()
    print(f'- Core, proposed (covered only if the clinical lead agrees, table 3.3): '
          f'{t["core_proposed"]} element{"" if t["core_proposed"] == 1 else "s"}.')
    print(f'- Elements: {s["elements"]}; in the scope of the core {s["scope"]}; outside the core '
          f'{sum(t[k] for k in OUTSIDE)} (open {t["open"]}, later module {t["later_module"]}, dropped '
          f'{t["dropped"]}, research only {t["research_only"]}); leave out {t["leave_out"]}.')
    print(f'- Coverage: pooled {pct(s["cov_pooled"])}; weighted {pct(s["cov_weighted"])}; '
          f'EN and DE templates (first release) {pct(s["cov_first_release"])}; JA {pct(s["cov_ja"])}.')
    print(f'- Carried over as is (expressible and no claim wording): weighted {pct(s["as_is_weighted"])}; '
          f'EN and DE {pct(s["as_is_first_release"])}; JA {pct(s["as_is_ja"])}.')
    print(f'- Clinic text elements with claim wording: {s["claim_texts"]} of {s["clinic_texts"]}; '
          f'claim wording in other elements: {s["claim_elsewhere"]}.')
    print(f'- Reports a year: {s["reports"]:,} (EN and DE {s["reports_first"]:,}, JA {s["reports_ja"]:,}).')
    print("\n| Gap | Templates | Reports a year |\n| --- | --- | ---: |")
    for g, v in s["gaps"].items():
        print(f'| {g} {GAP_NAMES.get(g, "")} | {", ".join(v["templates"])} | {v["reports"]:,} |')
    print("\n| Leave out, reason | Elements |\n| --- | ---: |")
    for k, v in sorted(s["leave"].items(), key=lambda kv: -kv[1]):
        print(f"| {k} | {v} |")


if __name__ == "__main__":
    main()
