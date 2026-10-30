"""Checks of the sample PDFs in outputs/sample (reviews B7, A8, D1, D7).

For every sample PDF (report_clinic_*.pdf) it reads the text with pdftotext and checks:

- the report id of the current measurement (textlib.current_measurement: "R-MOCK-042-0915") and
  "Mockup, synthetic data" on every page;
- the measurements of the comparison in date order, oldest first (the dates as the PDF prints
  them, from the comparison heading on), so an earlier measurement is never printed as current;
- the template row of the Versions block ("CT-STD v3 · Clinic C · English") and the catalogue
  version ("Device blocks 2026.1");
- no sentence id in the body before the "Text sources" block (review D7), and that block present;
- the issued samples (..._issued_v1.pdf, ..._issued_v2.pdf): status "Issued", and v2 names the
  version it replaces.

Read only. Exit code 1 when a check fails.

Usage: python3 -m mockup.checks.sample_pdfs [pdf ...]
"""

import json
import re
import sys
from pathlib import Path

from .. import render as rd
from .. import textlib as tl
from ..i18n import L
from .page_text import page_texts

REPO = Path(__file__).resolve().parents[2]
SAMPLE = REPO / "outputs" / "sample"
TEMPLATES = REPO / "mockup" / "clinic_templates"
# a sentence id as the library writes them ("SUM-2", "Q-ICA-MAN-1", "CMP-G-1")
SID = re.compile(r"\b(?:" + "|".join(sorted({k.split("-")[0] for k in tl.LIB}, key=len, reverse=True))
                 + r")-(?:[A-Z0-9]+-)*\d+\b")


def norm(s):
    return re.sub(r"\s+", "", s)


def template_for(pdf):
    stem = re.sub(r"_issued_v\d+$", "", pdf.stem).replace("report_", "")
    f = TEMPLATES / f"{stem}.json"
    return json.loads(f.read_text()) if f.exists() else None


def check(pdf):
    probs = []
    tpl = template_for(pdf)
    if tpl is None:
        return [f"{pdf.name}: no template {pdf.stem}"]
    case = rd.load_case()
    ctx = rd.Ctx(case, rd.resolve_template(tpl), False)
    t, lang = ctx.t, ctx.lang
    pages = page_texts(pdf)
    text = "\n".join(pages)
    flat = norm(text)
    want = tl.report_id(case["case_code"], tl.current_measurement(case)["date"])
    if want not in text:
        probs.append(f"report id {want} not printed")
    stamp = norm(t["mockup"])
    missing = [i for i, p in enumerate(pages, 1) if stamp not in norm(p)]
    if missing:
        probs.append(f"pages without {t['mockup']!r}: {missing}")
    # comparison in date order
    if ctx.compared:
        # the comparison heading followed by its table (not an entry of a table of contents)
        head, start = norm(t["comparison"]), -1
        for mm_ in re.finditer(re.escape(head), flat):
            if norm(t["measure"]) in flat[mm_.end():mm_.end() + 120]:
                start = mm_.end()
                break
        dates = [norm(tl.fmt_date(m["date"], lang)) for m in ctx.compared]
        pos = [flat.find(d, start) for d in dates]
        if start < 0 or min(pos) < 0:
            probs.append(f"comparison dates not found: {dates}")
        elif pos != sorted(pos):
            probs.append(f"comparison does not list the measurements oldest first: {dates}")
        if [m["date"] for m in ctx.compared] != sorted(m["date"] for m in ctx.compared) \
                or ctx.compared[-1] is not ctx.current:
            probs.append("comparison measurements are not oldest first ending with the current one")
    # versions rows
    row = t["template_fmt"].format(id=tpl["template_id"], v=tpl["template_version"],
                                   clinic=tpl["clinic_name"], lang=t["lang_" + lang])
    if norm(row) not in flat:
        probs.append(f"template row {row!r} not printed")
    cat = f'{t["blocks_cat"]} {rd.CATALOGUE_VERSION}'
    if norm(cat) not in flat:
        probs.append(f"{cat!r} not printed")
    # sentence ids only in the Text sources block
    sp = re.sub(r"\s+", " ", text)
    src = sp.rfind(t["sources"])
    if src < 0:
        probs.append(f"no {t['sources']!r} block")
    else:
        body_ids = sorted(set(SID.findall(sp[:src])))
        if body_ids:
            probs.append(f"sentence ids printed in the body (D7): {body_ids[:8]}")
    # issued samples
    mm = re.search(r"_issued_v(\d+)$", pdf.stem)
    if mm:
        v = int(mm.group(1))
        if norm(t["issued"]) not in flat:
            probs.append("issued sample without the status Issued")
        if norm(f"{want} v{v}") not in flat:
            probs.append(f"issued sample does not carry {want} v{v}")
        rep = rd.SAMPLE_ISSUES[v].get("replaces")
        if rep and norm(t["replaces_v"].format(v=rep["version"], reason="")[:-1]) not in flat:
            probs.append(f"v{v} does not say which version it replaces")
    elif norm(f"{want} v1") not in flat:
        probs.append(f"draft does not carry {want} v1")
    return [f"{pdf.name}: {p}" for p in probs]


def main(argv):
    pdfs = [Path(a) for a in argv] or sorted(SAMPLE.glob("report_clinic_*.pdf"))
    bad = []
    for pdf in pdfs:
        probs = check(pdf)
        n = len(page_texts(pdf))
        print(f"{pdf.name}: {n} pages, " + ("ok" if not probs else f"{len(probs)} problems"))
        bad += probs
    for p in bad:
        print(f"  FAIL {p}")
    print("OK" if not bad else f"FAIL: {len(bad)}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
