"""One template id and version gives one block list in both pipelines (review A8).

The sample PDFs are rendered from the template records in mockup/clinic_templates (device block
references of the catalogue "Device blocks 2026.1", review D3). The prototype keeps its own
records of the templates it offers (CT-C, CT-STD) in modules/c_report.js. For every id and
version present in both, the device blocks (by catalogue id, in order; a prototype block id maps
to its catalogue block through CATALOGUE[...]["proto"]) and the clinic and clinician blocks
(intro, anamnesis, form, interpretation, conclusion; comments after result sections are left
out, as both pipelines print them only when written) must be the same. A PDF record whose id
the prototype does not have (CT-A, CT-B) is listed as PDF only; the same id in another version
in the two pipelines counts as a difference.

It reads the prototype's records from the built page (headless Chromium through Playwright,
template_records.js). Read only. Exit code 1 when two records of one id and version differ.

Usage: python3 -m mockup.checks.template_parity
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

from ..render import CATALOGUE, resolve_template

REPO = Path(__file__).resolve().parents[2]
TEMPLATES = REPO / "mockup" / "clinic_templates"
BUILT = REPO / "outputs" / "prototype" / "v4-clinic-workspace.html"
JS = Path(__file__).resolve().parent / "template_records.js"
# prototype block id -> catalogue id (device) or the clinic or clinician block it is
PROTO = {pid: bid for bid, v in CATALOGUE.items() for pid in v["proto"]}
PROTO.update({"intro": "clinic:intro", "anamnesis": "clinician:anamnesis",
              "interpretation": "clinician:interpretation", "conclusion": "clinician:conclusion",
              "form": "clinician:form"})


def pdf_sequence(tpl):
    out = []
    for b in resolve_template(tpl)["blocks"]:
        if b["kind"] == "device":
            out.append(b["id"])
        elif b["kind"] == "clinic":
            out.append("clinic:" + b.get("ref", b.get("type")))
        elif b["kind"] == "clinician" and b.get("label") != "comment":
            out.append("clinician:" + ("form" if b.get("label") == "form" else b.get("label")))
    return [x for x in out if x != "sources"]     # the PDF's Text sources block (D7)


def proto_sequence(blocks):
    out = []
    for pid in blocks:
        x = PROTO.get(pid, "unknown:" + pid)
        if not out or out[-1] != x:               # spectra_EO + spectra_EC, erp_waves + erp ...
            out.append(x)
    return out


def main():
    node = shutil.which("node")
    if not (node and BUILT.exists()):
        print("not checked: node or the built page is missing")
        return 1
    r = subprocess.run([node, str(JS), str(BUILT)], capture_output=True, text=True, timeout=300,
                       cwd=REPO / "mockup" / "prototype2")
    proto = json.loads(r.stdout.strip().splitlines()[-1])
    bad = 0
    for f in sorted(TEMPLATES.glob("*.json")):
        tpl = json.loads(f.read_text())
        key = f'{tpl["template_id"]} v{tpl["template_version"]}'
        rec = proto.get(tpl["template_id"])
        if not rec:
            print(f"{f.name} ({key}): PDF only (prototype has none)")
            continue
        if rec["version"] != tpl["template_version"]:
            # the prototype offers the same template in another version: the two records have
            # diverged (round of 30 October: a changed block list gets a new version in both)
            bad += 1
            print(f'{f.name} ({key}): DIFFERS: the prototype has {tpl["template_id"]} '
                  f'v{rec["version"]}')
            print(f"   PDF:       {pdf_sequence(tpl)}")
            print(f"   prototype: {proto_sequence(rec['blocks'])}")
            continue
        a, b = pdf_sequence(tpl), proto_sequence(rec["blocks"])
        if a == b:
            print(f"{f.name} ({key}): same block list in both pipelines ({len(a)} blocks)")
            continue
        bad += 1
        print(f"{f.name} ({key}): DIFFERS")
        print(f"   PDF:       {a}")
        print(f"   prototype: {b}")
    if proto.get("errors"):
        print(f"page errors: {proto['errors'][:3]}")
    print("OK" if not bad else f"FAIL: {bad} template records differ")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
