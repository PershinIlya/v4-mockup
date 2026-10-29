"""Render a Markdown document of the mockup to a PDF (for the product owner).

Usage: python3 -m mockup.mdpdf <in.md> <out.pdf> [--landscape]
"""

import json
import subprocess
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent

CSS = """
@page { size: A4; }
body { font-family: 'Liberation Sans', 'IPAGothic', sans-serif; font-size: 8.6pt; line-height: 1.33;
       color: #1f1f1e; margin: 0; }
h1 { font-size: 13.5pt; color: #184f95; margin: 0 0 2mm; }
h2 { font-size: 11pt; color: #184f95; margin: 4mm 0 1.5mm; }
h3 { font-size: 9.5pt; margin: 3mm 0 1mm; }
p { margin: 1.2mm 0; }
table { border-collapse: collapse; width: 100%; margin: 1.5mm 0; }
th { background: #e4ebf5; text-align: left; padding: 0.8mm 1.4mm; }
td { padding: 0.8mm 1.4mm; border-bottom: 0.5px solid #d6d5d0; vertical-align: top; }
td { overflow-wrap: break-word; }
td:first-child { min-width: 9mm; }
code { font-size: 8pt; }
ul { margin: 1mm 0; padding-left: 5mm; }
"""


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2]).resolve()
    html = markdown.markdown(src.read_text(), extensions=["tables"])
    page = f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{html}</body></html>"
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".html")
    tmp.write_text(page)
    foot = ("<div style=\"font-family:'Liberation Sans';font-size:6.5pt;color:#b3261e;width:100%;"
            "padding:0 12mm;\">Mockup, synthetic data · V4 mockup, not product documentation</div>")
    job = {"html": str(tmp), "pdf": str(out), "header": "<span></span>", "footer": foot,
           "margins": [10, 12, 12, 12]}
    subprocess.run(["node", str(ROOT / "pdf.js")], input=json.dumps(job), text=True, check=True)
    tmp.unlink()
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
