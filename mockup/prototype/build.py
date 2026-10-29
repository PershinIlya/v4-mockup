"""Assemble the clickable prototype into one HTML page: app.html plus the synthetic asset bundle.

Usage: python3 -m mockup.prototype.build  (writes outputs/prototype/v4-workflow-mockup.html)
"""

from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "outputs" / "prototype" / "v4-workflow-mockup.html"


def main():
    page = (HERE / "app.html").read_text()
    assets = (HERE / "assets.json").read_text()
    assert "/*__ASSETS__*/null" in page
    page = page.replace("/*__ASSETS__*/null", assets.replace("</", "<\\/"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(page)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
