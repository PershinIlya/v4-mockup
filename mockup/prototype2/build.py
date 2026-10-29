"""Assemble prototype v2: shell.html + data.json + modules/*.js into one page.

Usage: python3 -m mockup.prototype2.build  (writes outputs/prototype/v4-clinic-workspace.html)
Each module file registers itself in window.Modules; files are concatenated in name order,
each wrapped in its own function scope.
"""

from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "outputs" / "prototype" / "v4-clinic-workspace.html"


def main():
    page = (HERE / "shell.html").read_text()
    data = (HERE / "data.json").read_text().replace("</", "<\\/")
    mods = []
    for f in sorted((HERE / "modules").glob("*.js")):
        mods.append(f"/* ---- module {f.name} ---- */\n(function () {{\n{f.read_text()}\n}})();")
    page = page.replace("/*__DATA__*/null", data).replace("/*__MODULES__*/", "\n".join(mods))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(page)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB, {len(mods)} modules)")


if __name__ == "__main__":
    main()
