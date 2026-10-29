"""Forbidden-word check over every visible text of the prototype (review C2).

Scans:
- `mockup/prototype2/shell.html`: the HTML text outside scripts and styles, and every string
  literal and template literal in its scripts (the interface texts, EN and DE);
- `mockup/prototype2/modules/*.js`: every string and template literal (the i18n tables of the
  modules hold both languages as literals);
- `mockup/prototype2/data.json`: every system sentence, EN and DE, of both measurements.

The forbidden list follows the intended use of the V4 core, section 4 "What the core does not do
and does not claim" (`PershinIlya/v4`, `docs/20-requirements/intended-use.md`): no diagnosis or
condition names, no interpretation or construct names, no "normal" or "abnormal", no treatment
or test advice, no prediction or screening, and no regulatory claims. Words match at the start of
a word, case-insensitively, in English and German. Em and en dashes are forbidden everywhere.

Allowed, explicitly (ALLOW in `terms.py`, ALLOW_KEYS below): text inside `APP.ann(...)` badges (spec references, hidden
unless Annotations is on; dashes are still forbidden there), and the intended-use disclaimers
that say the system does not diagnose.

Regular expression literals are not visible text and are skipped. Read only. Exit code 1 when a
hit is found.

Usage: python3 -m mockup.checks.text_check [--show-allowed]
"""

import json
import re
import sys
from pathlib import Path

from . import terms
from .terms import ALLOW

# The forbidden list and the allow-list live in mockup/checks/terms.py, shared with the sentence
# library (textlib) and the clinic claim check of the PDF pipeline (render.py).
COMPILED = terms.COMPILED + terms.COMPILED_JA

P2 = Path(__file__).resolve().parents[1] / "prototype2"
REPO = P2.parents[1]

DASHES = re.compile("[\\u2012-\\u2015]|&[nm]dash;|\\\\u201[345]")

# Allowed by i18n key: the values of these keys may name functions outside the core.
ALLOW_KEYS = [
    ("names of functions outside the core (table 3.3 scope list)", re.compile(r"^b\.o\.")),
]
KEY_LIKE = re.compile(r"^[A-Za-z][\w-]*(\.[\w-]+)+$")

# ---------------------------------------------------------------- JavaScript literal scanner

REGEX_PREV = set("(,=:[!&|?{};+-*%<>~^") | {""}


def js_literals(src, base_line=1):
    """Yield (line, text, in_ann) for every string and template literal in JavaScript source.
    Template literals give their text parts (expressions are scanned as code). Regular
    expression literals and comments are skipped. in_ann: the literal is an argument of an
    `ann(` call."""
    out = []
    i, n = 0, len(src)
    ann_depth = []  # paren depths at which an ann( call opened
    depth = 0

    def line_at(k):
        return base_line + src.count("\n", 0, k)

    def prev_sig(k):
        j = k - 1
        while j >= 0 and src[j] in " \t\r\n":
            j -= 1
        return src[j] if j >= 0 else ""

    def scan_code(k, stop_brace):
        """Scan code from k; return the index after the closing brace when stop_brace."""
        nonlocal depth
        brace = 0
        while k < n:
            c = src[k]
            if c == "/" and src.startswith("//", k):
                k = src.find("\n", k)
                k = n if k < 0 else k
                continue
            if c == "/" and src.startswith("/*", k):
                e = src.find("*/", k + 2)
                k = n if e < 0 else e + 2
                continue
            if c == "/" and prev_sig(k) in REGEX_PREV:
                k = skip_regex(k)
                continue
            if c in "'\"":
                k = scan_string(k, c)
                continue
            if c == "`":
                k = scan_template(k)
                continue
            if c == "(":
                if re.search(r"\bann\s*$", src[max(0, k - 8):k]):
                    ann_depth.append(depth)
                depth += 1
            elif c == ")":
                depth -= 1
                if ann_depth and ann_depth[-1] == depth:
                    ann_depth.pop()
            elif c == "{":
                brace += 1
            elif c == "}":
                if stop_brace and brace == 0:
                    return k + 1
                brace -= 1
            k += 1
        return k

    def skip_regex(k):
        k += 1
        in_cls = False
        while k < n and src[k] != "\n":
            c = src[k]
            if c == "\\":
                k += 2
                continue
            if c == "[":
                in_cls = True
            elif c == "]":
                in_cls = False
            elif c == "/" and not in_cls:
                k += 1
                while k < n and src[k].isalpha():
                    k += 1
                return k
            k += 1
        return k

    def scan_string(k, q):
        start = k
        k += 1
        buf = []
        while k < n and src[k] != q:
            if src[k] == "\\":
                buf.append(src[k:k + 2])
                k += 2
                continue
            if src[k] == "\n":
                break
            buf.append(src[k])
            k += 1
        out.append((line_at(start), "".join(buf), bool(ann_depth), start, k + 1))
        return k + 1

    def scan_template(k):
        k += 1
        buf, bstart = [], k
        while k < n and src[k] != "`":
            if src[k] == "\\":
                buf.append(src[k:k + 2])
                k += 2
                continue
            if src.startswith("${", k):
                out.append((line_at(bstart), "".join(buf), bool(ann_depth), bstart, k))
                k = scan_code(k + 2, True)
                buf, bstart = [], k
                continue
            buf.append(src[k])
            k += 1
        out.append((line_at(bstart), "".join(buf), bool(ann_depth), bstart, k + 1))
        return k + 1

    scan_code(0, False)
    res = []
    for j, (ln, t, ann, a, b) in enumerate(out):
        key = None
        if j and re.fullmatch(r"\s*:\s*", src[out[j - 1][4]:a - 1] if a else ""):
            key = out[j - 1][1]
        res.append((ln, t, ann, key))
    return res


CSS_BLOCK = re.compile(r"\{[^{}]*:[^{}]*;[^{}]*\}")


def visible(text):
    """Literal text as a viewer would see it: identifiers (i18n keys, ids) and CSS dropped, tags
    removed, entities decoded."""
    if KEY_LIKE.match(text.strip()):
        return ""
    t = CSS_BLOCK.sub(" ", text) if CSS_BLOCK.search(text) else text
    t = re.sub(r"<[^>]*>", " ", t)
    t = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), t)
    t = t.replace("&amp;", "&").replace("&nbsp;", " ")
    return t


def html_text(src):
    """(line, text) for HTML text outside script and style elements."""
    out = []
    masked = re.sub(r"<(script|style)\b.*?</\1>", lambda m: "\n" * m.group(0).count("\n"),
                    src, flags=re.S | re.I)
    for k, ln in enumerate(masked.split("\n"), 1):
        t = re.sub(r"<[^>]*>", " ", ln)
        t = re.sub(r'\b(title|alt|placeholder|aria-label)="([^"]*)"', r"\2", t)
        if t.strip():
            out.append((k, t))
        for m in re.finditer(r'\b(title|alt|placeholder|aria-label)="([^"]*)"', ln):
            out.append((k, m.group(2)))
    return out


def scripts(src):
    """(first line, code) of every script element."""
    for m in re.finditer(r"<script\b[^>]*>(.*?)</script>", src, flags=re.S | re.I):
        yield src.count("\n", 0, m.start(1)) + 1, m.group(1)


# ---------------------------------------------------------------- check

def check(where, line, text, in_ann, hits, allowed, key=None):
    t = visible(text)
    kal = next((name for name, rx in ALLOW_KEYS if key and rx.search(key)), None)
    for m in DASHES.finditer(text):
        hits.append((where, line, "dash", m.group(0).encode("unicode_escape").decode(), t))
    for cat, pat, rx in COMPILED:
        for m in rx.finditer(t):
            if in_ann:
                allowed.append((where, line, cat, m.group(0), t, "APP.ann badge"))
                continue
            if kal:
                allowed.append((where, line, cat, m.group(0), t, f"{kal}, key {key}"))
                continue
            al = next((name for name, a in ALLOW if a.search(t)
                       and any(a2.start() <= m.start() < a2.end() for a2 in a.finditer(t))), None)
            if al:
                allowed.append((where, line, cat, m.group(0), t, al))
            else:
                hits.append((where, line, cat, m.group(0), t))


# Every probe must be caught (review C2: the earlier German check missed all of them).
PROBES = ["Abnormal theta", "Befundbericht", "FDA cleared", "CE-certified", "pathologisch",
          "auffälliger Wert", "unauffällig", "Störung", "disorder", "Therapieempfehlung",
          "empfehlen", "recommended", "diagnostic", "Diagnose", "ADHD", "ADHS", "Aufmerksamkeit",
          "impulsivity", "normal range", "suggests", "deutet auf", "treatment", "Behandlung",
          "Prognose", "Depression", "epileptiform", "a \u2013 b", "a \u2014 b"]


def selftest():
    missed = []
    for pr in PROBES:
        h, a = [], []
        check("probe", 0, pr, False, h, a)
        if not h:
            missed.append(pr)
    for ok in ("Die Software stellt keine Diagnose.", "The software does not diagnose.",
               "Bipolar longitudinal"):
        h, a = [], []
        check("probe", 0, ok, False, h, a)
        if h:
            missed.append(f"allowed text flagged: {ok}")
    return missed


def main():
    missed = selftest()
    if missed:
        print(f"SELF-TEST FAILED, probes not caught: {missed}")
        return 2
    print(f"Self-test: all {len(PROBES)} probe words caught, 3 allowed texts pass")
    hits, allowed = [], []
    shell = P2 / "shell.html"
    src = shell.read_text()
    rel = shell.relative_to(REPO)
    for line, t in html_text(src):
        check(rel, line, t, False, hits, allowed)
    for base, code in scripts(src):
        for line, t, ann, key in js_literals(code, base):
            check(rel, line, t, ann, hits, allowed, key)
    for f in sorted((P2 / "modules").glob("*.js")):
        for line, t, ann, key in js_literals(f.read_text()):
            check(f.relative_to(REPO), line, t, ann, hits, allowed, key)
    data = json.loads((P2 / "data.json").read_text())
    for lang, ms in data["sentences"].items():
        for mk, keys in ms.items():
            for key, items in keys.items():
                for i, s in enumerate(items):
                    where = f"mockup/prototype2/data.json:sentences.{lang}.{mk}.{key}[{i}] {s['id']}"
                    check(where, None, s["text"], False, hits, allowed)

    seen = set()
    print(f"Forbidden words and dashes in visible prototype text ({len(COMPILED)} patterns)")
    for where, line, cat, word, t in hits:
        key = (str(where), line, cat, word.lower())
        if key in seen:
            continue
        seen.add(key)
        loc = f"{where}:{line}" if line else str(where)
        ctx = t.strip()
        j = ctx.lower().find(word.lower())
        ctx = ctx[max(0, j - 50): j + 60] if j >= 0 else ctx[:110]
        print(f"  {loc}  [{cat}] {word!r}  ...{ctx}...")
    print(f"{len(seen)} hits; {len(allowed)} allowed "
          f"({sum(1 for a in allowed if a[5] == 'APP.ann badge')} in APP.ann badges, "
          f"{sum(1 for a in allowed if a[5] != 'APP.ann badge')} by the explicit allow-list)")
    if "--show-allowed" in sys.argv:
        for where, line, cat, word, t, why in allowed:
            loc = f"{where}:{line}" if line else str(where)
            print(f"  allowed ({why}): {loc} [{cat}] {word!r}")
    return 1 if seen else 0


if __name__ == "__main__":
    sys.exit(main())
