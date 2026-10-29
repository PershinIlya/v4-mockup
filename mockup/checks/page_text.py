"""Page check of a rendered report: every body page carries body text.

The PDF pipeline (`mockup/render.py`) runs it on the body PDF, before the running header and the
footers are merged in, so a page that would print only the running header and the footers fails
the build. It reads each page with `pdftotext -f i -l i` (poppler).

Usage (on any PDF, for example a body PDF kept for debugging):
  python3 -m mockup.checks.page_text <file.pdf> [...]
"""

import re
import subprocess
import sys


def page_texts(pdf_path):
    """[text of page 1, text of page 2, ...] read with pdftotext, one call per page."""
    info = subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True,
                          check=True).stdout
    n = int(re.search(r"^Pages:\s+(\d+)", info, re.M).group(1))
    return [subprocess.run(["pdftotext", "-f", str(i), "-l", str(i), "-layout", str(pdf_path), "-"],
                           capture_output=True, text=True, check=True).stdout
            for i in range(1, n + 1)]


def empty_pages(pdf_path, min_chars=1):
    """Page numbers (from 1) whose text has fewer than min_chars visible characters."""
    return [i for i, t in enumerate(page_texts(pdf_path), 1)
            if len(re.sub(r"\s+", "", t)) < min_chars]


def main(argv):
    bad = 0
    for path in argv:
        e = empty_pages(path)
        print(f"{path}: " + ("every page has text" if not e else f"pages without text: {e}"))
        bad += bool(e)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
