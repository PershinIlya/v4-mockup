"""Report rendering pipeline of the mockup.

clinic template record (JSON)  ->  ordered blocks  ->  HTML (Jinja2)  ->  PDF (Chromium)
                                                    ->  running header and footer (overlay)

A clinic template record lists blocks by reference: device blocks (rendered here from the
computed results and the fixed sentence library, not editable), clinic blocks (the clinic's own
texts and images with placeholders) and clinician blocks (filled per report in the editor; here
placeholder text). The record also names a theme: fonts, colours, sizes, a cover page, a running
header and a clinic footer. Figure colours are not part of the theme.

Device block references pin a version and a variant (review D3, a proposal for the CTO):
"spectra.maps@1:abs+rel". The device block catalogue below (CATALOGUE, "Device blocks 2026.1")
lists every block, its version and its variants; each variant stands for fixed parameters, so
every combination that can be printed is enumerated and can be verified. The schema check rejects
an unknown block, version or variant and any free parameter on a device block.

The PDF is made in two passes: the body (cover page without margins, then the result pages with
the theme margins), then one overlay page per body page with the running header (from page 2),
the clinic footer and the device footer line ("Mockup, synthetic data", versions, page number).
A table of contents, if the cover has one, is filled from the page numbers of the first pass.

Build checks before a PDF is written: the template schema (with the case-independent summary rule
of review C17), the forbidden-word lists, and that every printed system sentence belongs to a
block present in the template. After the body PDF is made, every body page must carry body text
(`mockup/checks/page_text.py`, pdftotext per page), so a page with only the running header and the
footers fails the build.

Sentence ids (review D7): the clinic PDFs print no id after a sentence; the required last block
"Text sources" lists the ids per section. The annotated build (--annotate) keeps the id after every
sentence and also prints the status notes of the specification ("core, proposed": table 3.3 of
30 October, beyond the clinical lead's list of 5 October; review A3).

Issued samples (review D1): --issued 1 renders the report as issued version 1, --issued 2 as the
correction version 2 that replaces it (sample issue records in SAMPLE_ISSUES).

Usage:
  python3 -m mockup.render <clinic_template.json> <out.pdf> [--annotate] [--issued N]
"""

import argparse
import copy
import html
import json
import re
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from . import figures as fg
from . import textlib as tl
from .checks import page_text, terms
from .i18n import L

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
CASE_PATH = REPO / "data" / "synthetic" / "case_mock042.json"

ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII",
         "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV"]

THEME_DEFAULTS = {
    "font_body": "DejaVu Sans", "font_head": "DejaVu Sans", "base_pt": 9,
    "ink": "#1f1f1e", "muted": "#6b6b66", "accent": "#1c5cab", "accent_2": "#184f95",
    "head_weight": "bold", "h2_ink": "#1f1f1e", "h2_bg": "none", "h2_pad": "0",
    "h2_rule": "none", "hdr_rule": "1px solid #999", "hdr_direction": "row",
    "hdr_text_align": "left", "panel": "#f2f2f2", "panel_border": "none",
    "table_head_bg": "#eeeeee", "table_head_ink": "#1f1f1e", "clin_border": "#999999",
    "clin_bg": "#fafafa", "margins_mm": [20, 20, 16, 20], "header_mm": 10, "footer_mm": 6,
    "running_ink": "#555555", "running_style": "normal",
}

# ---------------------------------------------------------------------------------------------
# Device block catalogue (review D3; mockup assumption, a proposal for the CTO)
# ---------------------------------------------------------------------------------------------

# 2026.2 (round of 30 October): erp.review replaces erp.checklist; source.regions is new; coherence
# v2 has the variants msc and lagged (with or without the four global types); ratios v2 adds the
# frontal theta / parietal alpha ratio and alpha reactivity; freq.markers is plain core.
CATALOGUE_VERSION = "2026.2"
ALL = ("EO", "EC")
# id: version, status (table 3.3), whether it shows results (a clinician comment may follow it),
# the prototype block ids it corresponds to (c_report.js), its variants {name: parameters}, and
# variant_status where a variant carries another status than its block (the lagged coherence
# variants: "core, proposed").
# Every device block that shows results per condition shows eyes open and eyes closed (review
# C17: what a summary ranks is shown for every condition it ranks).
CATALOGUE = {
    "versions": {"v": 1, "status": "core", "proto": ["versions"], "variants": {"std": {}}},
    "summary": {"v": 1, "status": "core", "proto": ["summary"],
                "variants": {"std": {"table": True}, "sentences": {"table": False}}},
    "quality": {"v": 1, "status": "core", "proto": ["quality"], "variants": {"std": {}}},
    "raw.excerpt": {"v": 1, "status": "core", "result": True, "proto": ["raw"],
                    "variants": {"chosen": {}}},
    "spectra.maps": {"v": 1, "status": "core", "result": True,
                     "proto": ["spectra_EO", "spectra_EC"],
                     "variants": {"abs": {"relative": False}, "abs+rel": {"relative": True}}},
    "spectra.maps1hz": {"v": 1, "status": "core", "result": True, "proto": ["maps_1hz"],
                        "variants": {"abs": {"relative": False}, "abs+rel": {"relative": True}}},
    "spectra.grid": {"v": 1, "status": "core", "result": True, "proto": ["spectra_ch"],
                     "variants": {"abs": {}, "abs+earlier": {"overlay_earlier": True},
                                  "abs+rel": {"relative": True},
                                  "abs+rel+earlier": {"relative": True, "overlay_earlier": True}}},
    "freq.markers": {"v": 1, "status": "core", "result": True,
                     "proto": ["freq_markers"], "variants": {"std": {}}},
    # v2: rows of the frontal theta / parietal alpha ratio and alpha reactivity (both "core,
    # proposed"; table 3.3, 30 October)
    "ratios": {"v": 2, "status": "core", "result": True, "proto": ["ratios"],
               "variants": {"std": {}}},
    "asymmetry": {"v": 1, "status": "core", "result": True, "proto": ["asymmetry"],
                  "variants": {"std": {}}},
    # v2: the coherence type per electrode pair the report shows (magnitude squared or lagged,
    # table 3.3: "the user chooses"), with or without the four global types
    "coherence": {"v": 2, "status": "core", "result": True, "proto": ["coherence"],
                  "variants": {"msc": {"type": "msc", "global": False},
                               "msc+global": {"type": "msc", "global": True},
                               "lagged": {"type": "lagged", "global": False},
                               "lagged+global": {"type": "lagged", "global": True}},
                  "variant_status": {"lagged": "core, proposed",
                                     "lagged+global": "core, proposed"}},
    # sLORETA region values against norms (table 3.3 Core, proposed; repo L7)
    "source.regions": {"v": 1, "status": "core, proposed", "result": True,
                       "proto": ["source_regions"], "variants": {"std": {}}},
    "erp.channel": {"v": 1, "status": "core", "result": True, "proto": ["erp_waves", "erp"],
                    "variants": {"grid": {"trials": ["go", "nogo", "novelty"]},
                                 "grid+earlier": {"trials": ["go", "nogo", "novelty"],
                                                  "overlay_earlier": True},
                                 "grid+ignore": {"trials": ["go", "nogo", "novelty", "ignore"]},
                                 "grid+ignore+earlier": {"trials": ["go", "nogo", "novelty", "ignore"],
                                                         "overlay_earlier": True}}},
    # ERP peak values with the clinician's review (table 3.3 Core, proposed; IU9); replaces the
    # checklist over channel ERPs (erp.checklist, retired with Device blocks 2026.2)
    "erp.review": {"v": 1, "status": "core, proposed", "result": True,
                   "proto": ["erp_review"], "variants": {"std": {}}},
    # variant std+rt (round of 30 October): the two reaction time figures after the legacy
    # Erp_Stat_perf and Erp_Stat_perf2 (audit 14b B.5), a display of the same core results
    "vcpt.behaviour": {"v": 1, "status": "core", "result": True, "proto": ["behaviour", "errors"],
                       "variants": {"std": {}, "std+rt": {"rt_figures": True}}},
    "comparison": {"v": 1, "status": "core", "result": True, "proto": ["comparison"],
                   "variants": {"pair": {"measurements": "pair"}, "all": {"measurements": "all"}}},
    "limits": {"v": 1, "status": "core", "proto": ["limits"], "variants": {"std": {}}},
    "method": {"v": 1, "status": "core", "proto": ["method"],
               "variants": {"std": {"recording_conditions": True},
                            "no-conditions": {"recording_conditions": False}}},
    "issued": {"v": 1, "status": "core", "proto": ["issuedby"], "variants": {"std": {}}},
    "sources": {"v": 1, "status": "core", "proto": [], "variants": {"std": {}}},
}
REF_RE = re.compile(r"^([a-z0-9]+(?:\.[a-z0-9]+)*)@(\d+):([a-z0-9]+(?:[+-][a-z0-9]+)*)$")


def parse_ref(ref):
    """(block id, version, variant) of a device block reference, or None."""
    mm = REF_RE.match(ref or "")
    return (mm.group(1), int(mm.group(2)), mm.group(3)) if mm else None


def ref_of(block_id, variant):
    return f"{block_id}@{CATALOGUE[block_id]['v']}:{variant}"


def catalogue_export():
    """The catalogue as data for the prototype (data.json "device_blocks", the variant picker of
    the template editor)."""
    return {"version": CATALOGUE_VERSION, "ref_pattern": "<id>@<version>:<variant>",
            "blocks": {k: {"version": v["v"], "status": v["status"],
                           "result": bool(v.get("result")), "prototype_blocks": v["proto"],
                           "variants": {n: dict(p) for n, p in v["variants"].items()},
                           "variant_status": dict(v.get("variant_status") or {})}
                       for k, v in CATALOGUE.items()}}


def resolve_template(tpl):
    """A copy of the template whose device blocks carry id, version, variant and the variant's
    parameters (from the catalogue); the reference string stays in "ref"."""
    out = copy.deepcopy(tpl)
    for b in out.get("blocks", []):
        if b.get("kind") != "device":
            continue
        pr = parse_ref(b.get("ref"))
        if pr and pr[0] in CATALOGUE and pr[2] in CATALOGUE[pr[0]]["variants"]:
            b["id"], b["version"], b["variant"] = pr
            b["params"] = dict(CATALOGUE[pr[0]]["variants"][pr[2]])
        else:
            b["id"], b["version"], b["variant"], b["params"] = b.get("ref"), None, None, {}
    return out


# Blocks every template must contain (mockup assumptions M23 and C4 of the review; D7 sources).
REQUIRED_BLOCKS = ("versions", "summary", "quality", "limits", "issued", "sources")
# Device blocks that show results; a clinician comment may follow only one of these (M29).
RESULT_BLOCKS = tuple(k for k, v in CATALOGUE.items() if v.get("result"))

# The block a system sentence belongs to: it may be printed only when that block is present.
SENTENCE_BLOCK = [
    (r"^SUM-", "summary"), (r"^(Q|MK)-", "quality"), (r"^(SP|APF)-", "spectra.maps"),
    (r"^(TBR|FAA|FTPA|AR)-", "ratios"), (r"^ASY-", "asymmetry"), (r"^COH-", "coherence"),
    (r"^ERPREV-", "erp.review"), (r"^SRC-", "source.regions"), (r"^FM-", "freq.markers"),
    (r"^MET-", "method"),
    (r"^ERP-", "erp.channel"), (r"^BEH-", "vcpt.behaviour"), (r"^CMP-", "comparison"),
    (r"^L-(REPROC|SIDE|IMPORT)-", "comparison"), (r"^L-", "limits"),
]
# The block that shows the values of a summary family (textlib.FAMILY), and of the families the
# count sentence names without ranking them (textlib.COUNT_ONLY).
FAMILY_BLOCK = {"band": "spectra.maps", "maps1hz": "spectra.maps1hz", "indices": "ratios",
                "asym": "asymmetry", "coh": "coherence", "cohlag": "coherence",
                "erp": "erp.channel", "vcpt": "vcpt.behaviour", "spectrum": "spectra.grid",
                "cohglobal": "coherence", "cohother": "coherence"}
DEFAULT_CONDITIONS = {"spectra.maps": ["EO", "EC"], "spectra.maps1hz": ["EO", "EC"],
                      "asymmetry": ["EO", "EC"], "coherence": ["EO", "EC"],
                      "source.regions": ["EO", "EC"]}
# heading key of each device block (Text sources)
BLOCK_HEADING = {"summary": "summary", "quality": "quality", "spectra.maps": "spectra",
                 "spectra.maps1hz": "maps_1hz", "spectra.grid": "spectra_grid",
                 "freq.markers": "freq_markers", "ratios": "ratios", "asymmetry": "asymmetry",
                 "coherence": "coherence", "erp.channel": "erp", "erp.review": "erp_review",
                 "source.regions": "source_regions",
                 "vcpt.behaviour": "vcpt", "comparison": "comparison", "limits": "limits",
                 "method": "method", "raw.excerpt": "raw"}

# Sample issue records (review D1, mockup assumptions): version 1 issued, then a correction as
# version 2 that replaces it. The signature is a re-authentication at issue (building on the
# two-factor login of N10). The reason is the clinician's free text, a placeholder here.
SAMPLE_ISSUES = {
    1: {"version": 1, "status": "issued", "issued_by": "Clinician 1, licensed psychologist",
        "issued_on": "2026-09-18", "issued_at": "14:20"},
    2: {"version": 2, "status": "issued", "issued_by": "Clinician 1, licensed psychologist",
        "issued_on": "2026-09-23", "issued_at": "09:05",
        "replaces": {"version": 1, "reason": "[Reason entered by the clinician, synthetic placeholder]"}},
}


# ---------------------------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------------------------

def esc(s):
    return html.escape(str(s))


def zcell(lang, z, marked=False):
    """Table cell for a z value; the cell tint follows the fixed device colour scale (continuous
    on z). A marked value (after correction for multiple comparisons, M33) is bold with a small
    ring, the ring of the figures; the legend line `z_marked` explains it."""
    if z is None:
        return '<td class="num"></td>'
    zc = max(-3, min(3, z))
    rgba = fg.Z_CMAP((zc + 3) / 6)
    bg = "#%02x%02x%02x" % tuple(int(255 * c) for c in rgba[:3])
    ink = "#ffffff" if abs(z) >= 2.5 else "#1f1f1e"
    cls, ring = ("num z mk", '<span class="zring"></span>') if marked else ("num z", "")
    return f'<td class="{cls}" style="background:{bg};color:{ink}">{ring}{esc(fmtz(z, lang))}</td>'


def zchip(lang, z, where=None):
    """A marked z value as a small tinted chip with its ring and, before it, the electrode or
    pair (summary table, review C3)."""
    zc = max(-3, min(3, z))
    rgba = fg.Z_CMAP((zc + 3) / 6)
    bg = "#%02x%02x%02x" % tuple(int(255 * c) for c in rgba[:3])
    ink = "#ffffff" if abs(z) >= 2.5 else "#1f1f1e"
    lab = f'<span class="w">{esc(where)}</span>' if where else ""
    return (f'<span class="zchip">{lab}<span class="zv" style="background:{bg};color:{ink}">'
            f'<span class="zring"></span>{esc(fmtz(z, lang))}</span></span>')


def zlegend(ctx):
    return f'<p class="legend">{esc(ctx.t["z_marked"])}</p>'


def fmt_window(w, lang):
    """A time window from the case data ("-200 to 0") in the report language."""
    mm = re.fullmatch(r"\s*(-?\d+)\s+to\s+(-?\d+)\s*", str(w))
    if not mm:
        return str(w)
    return L[lang]["range"].format(a=mm.group(1), b=mm.group(2))


def system_label(label, lang):
    """Recording system label from the case data, shown as a mockup label in the report
    language; the data stay unchanged (textlib.system_label, shared with the prototype data)."""
    return tl.system_label(label, lang)


def fmtz(z, lang="en"):
    """A z value as printed in tables: the sentence helper of textlib (half up, one decimal, no
    negative zero), so tables, sentences and the prototype show the same digits."""
    return tl.fmt_z(z, lang)


def load_case():
    """The synthetic case with every printed value rounded once (textlib.round_case), as the
    prototype data are built (prototype2/build_data.py)."""
    return tl.round_case(json.loads(CASE_PATH.read_text()))


def report_label(r):
    """Report id and version as both pipelines print them: "R-MOCK-042-0915 v1"
    (textlib.report_id)."""
    return f'{r["id"]} v{r["version"]}'


def age_on(birth_iso, on_iso):
    b, d = date.fromisoformat(birth_iso), date.fromisoformat(on_iso)
    return d.year - b.year - ((d.month, d.day) < (b.month, b.day))


class Ctx:
    def __init__(self, case, tpl, annotate, toc_pages=None, issue=None):
        self.case = case
        if any(b.get("kind") == "device" and "id" not in b for b in tpl.get("blocks", [])):
            tpl = resolve_template(tpl)
        self.tpl = tpl
        self.theme = {**THEME_DEFAULTS, **tpl.get("theme", {})}
        self.lang = tpl["language"]
        self.t = L[self.lang]
        self.annotate = annotate
        # the current measurement is named by the case (review B7: textlib.current_measurement,
        # never the list position); earlier ones are those recorded before it, oldest first
        self.current = tl.current_measurement(case)
        before = tl.earlier_measurements(case, self.current)
        blocks = [b for b in tpl["blocks"] if b["kind"] == "device"]
        self.has_comparison = any(b["id"] == "comparison" for b in blocks)
        # earlier: the measurement just before the current one (overlays and pair sentences);
        # compared: every measurement the comparison block shows, oldest first
        self.earlier = before[-1] if self.has_comparison and before else None
        cmp_params = next((b["params"] for b in blocks if b["id"] == "comparison"), {})
        if not self.earlier:
            self.compared = []
        elif cmp_params.get("measurements") == "all":
            self.compared = before + [self.current]
        else:
            self.compared = [self.earlier, self.current]
        self.inputs = tl.sample_report_inputs(case)
        # the coherence type per electrode pair the report shows (coherence variant; table 3.3,
        # 30 October): the summary ranks this type and counts the other (SUM-RULE-3)
        self.coh = next((b["params"].get("type", "msc") for b in blocks
                         if b["id"] == "coherence"), "msc")
        # The report id belongs to the case and the measurement, not to the clinic template:
        # "R-" + case code + "-" + measurement date as MMDD (textlib.report_id), as in the
        # prototype; the template gives version and status only, an issue record (D1) more.
        self.report = {"version": 1, "status": "draft", **tpl.get("report", {}),
                       **(issue or {}),
                       "id": tl.report_id(case["case_code"], self.current["date"])}
        self.rendered = []          # (sentence, block that printed it)
        self.tables = set()         # (table, condition, band, row) printed, for table references
        self.block = None
        self.block_ref = None
        self.titles = {}            # device block id -> its heading, for the Text sources block
        self.sec = 0
        self.fig = 0
        self.toc = []               # headings of numbered sections, in order
        self.toc_pages = toc_pages or {}
        self.empty_shown = False    # one empty clinician block shown in a draft (C29)

    def inputs_for(self, key):
        """report_inputs[key] when they belong to the current measurement, else {}."""
        if self.inputs.get("measurement") not in (None, self.current["id"]):
            return {}
        return self.inputs.get(key) or {}

    def say(self, items):
        """System sentences; the id follows each sentence only in the annotated build (D7)."""
        out = []
        for s in items:
            self.rendered.append((s, self.block))
            sid = f'<span class="sid">{esc(s["id"])}</span>' if self.annotate else ""
            out.append(f'<p class="sys">{esc(s["text"])}{sid}</p>')
        return "\n".join(out)

    def status_note(self, key):
        """A status note of the specification ("core, proposed", table 3.3 of 30 October): the
        annotated build only (A3); plain PDFs print no status text."""
        return f'<div class="confirm">{esc(self.t[key])}</div>' if self.annotate else ""

    def cond_label(self, cond):
        return self.t["cond_eo"] if cond == "EO" else self.t["cond_ec"]

    def heading(self, key, numbered=True):
        text = self.t[key]
        if self.block and self.block not in self.titles:
            self.titles[self.block] = text
        if self.theme.get("heading_bilingual") and self.lang != "en":
            text = f'{text}{"：" if self.lang == "ja" else ": "}{L["en"][key]}'
        style = self.theme.get("numbering")
        if numbered and style:
            self.sec += 1
            n = ROMAN[self.sec] if style == "roman" else str(self.sec)
            text = f"{n}. {text}"
        if numbered:
            self.toc.append(text)
        return text

    def figlabel(self, text, cls="figlabel"):
        if self.theme.get("figure_numbers"):
            self.fig += 1
            text = f'{self.t["figure"]} {self.fig}: {text}'
        return f'<div class="{cls}">{esc(text)}</div>'

    def sep(self):
        return "、" if self.lang == "ja" else ", "


def wrap(ctx, kind, ref, inner, title=None, cls=""):
    tag = ""
    if ctx.annotate:
        label = {"device": ctx.t["block_device"], "clinic": ctx.t["block_clinic"],
                 "clinician": ctx.t["block_clinician"]}[kind]
        tag = f'<div class="blocktag {kind}">{esc(label)} · {esc(ref)}</div>'
    head = f"<h2>{esc(title)}</h2>" if title else ""
    k = '<div class="keep">'
    if head and inner.startswith(k):
        # the heading goes into the first group that is kept together, so it never ends a page
        inner, head = k + head + inner[len(k):], ""
    return f'<section class="block {kind} {cls}" data-ref="{esc(ref)}">{tag}{head}{inner}</section>'


def certnote(ctx, key="vcpt_cert"):
    """Japanese pages: the VCPT values may need a separate approval (review A11, table 3.3); the
    note on the summary is gone with the 3.2 text of 30 October (MC8)."""
    if ctx.tpl.get("later_market") and ctx.t.get(key):
        return f'<div class="certnote">{esc(ctx.t[key])}</div>'
    return ""


def label_band(lang):
    def f(b, lohi):
        return f'{tl.BAND[lang][b]} {lohi["lo"]:g}-{lohi["hi"]:g} Hz'
    return f


def fig(svg, cls="fig"):
    return f'<div class="{cls}">{svg}</div>'


def lang_name(ctx):
    return ctx.t["lang_" + ctx.lang]


# ---------------------------------------------------------------------------------------------
# Device blocks
# ---------------------------------------------------------------------------------------------

def status_text(ctx):
    return ctx.t["issued"] if ctx.report["status"] == "issued" else ctx.t["draft"]


def d_versions(ctx, p):
    """Software, norms, template and reproducibility rows (3.5, 3.8; reviews A8, B11, D3, D6)."""
    t, m, r, lang = ctx.t, ctx.current, ctx.report, ctx.lang
    pw = m["processed_with"]
    tpl = ctx.tpl
    rs = tl.current_result_set(ctx.case, m)
    note = {"de": f' ({t["textlib_note_de"]})', "ja": f' ({t["textlib_note_ja"]})'}.get(lang, "")
    norms = tl.product(pw["norms"], lang)
    if pw.get("norm_version"):
        norms = t["norms_fmt"].format(norms=norms, v=pw["norm_version"])
    left = [(t["report_id"], f'{report_label(r)} · {status_text(ctx)}'),
            (t["template"], t["template_fmt"].format(id=tpl.get("template_id", ""),
                                                     v=tpl.get("template_version", ""),
                                                     clinic=tpl["clinic_name"], lang=lang_name(ctx))),
            (t["software"], pw["software"]),
            (t["udi"], pw.get("udi") and (t["udi_text"] if lang != "en" else pw["udi"])),
            (t["pipeline"], pw.get("pipeline")),
            (t["norms"], norms),
            (t["textlib"], f"{tl.TEXTLIB_VERSION}{note}"),
            (t["blocks_cat"], f'{t["blocks_cat"]} {CATALOGUE_VERSION}')]
    mk = (m.get("method") or {}).get("marking") or {}
    right = [(t["system"], system_label(m.get("recording_system", ""), lang)),
             (t["result_set"], rs["id"]),
             (t["marking"], t["marking_text"].format(q=tl.num(mk.get("q", 0.05), 2, lang))
              if not tl.no_norm(m) else ""),
             (t["input_sha"], pw.get("input_sha256") and
              (f'<span class="hash">{esc(pw["input_sha256"])}</span> ({esc(t["input_synthetic"])})',)),
             (t["ica_seed"], pw.get("ica_seed") is not None and
              t["ica_seed_fmt"].format(seed=pw["ica_seed"])),
             (t["processed_at"], pw.get("processed_at") and t["processed_fmt"].format(
                 d=tl.fmt_date(pw["processed_at"][:10], lang), tm=pw["processed_at"][11:16],
                 s=pw["processing_s"]))]

    def tab(rows):
        # a value given as a 1-tuple is HTML already (the checksum)
        return ('<table class="kv">' + "".join(
            f"<tr><th>{esc(a)}</th><td>{b[0] if isinstance(b, tuple) else esc(b)}</td></tr>"
            for a, b in rows if b) + "</table>")
    inner = f'<div class="vcols"><div>{tab(left)}</div><div>{tab(right)}</div></div>'
    return wrap(ctx, "device", ctx.block_ref, inner, cls="compact versions")


def d_summary(ctx, p):
    """Summary by the fixed rule (SUM-2, SUM-RULE-2, SUM-COUNT-1), then the same ranked items as
    a table built from fixed templates and a reading key (review C3)."""
    t, lang = ctx.t, ctx.lang
    # MC8 (30 October): no "summary subject to the certification body" note; 3.2 no longer
    # carries that proposal
    inner = ctx.say(tl.summary_sentences(ctx.case, ctx.current, lang, ctx.coh))
    groups = ([] if tl.no_norm(ctx.current)
              else tl.summary_groups(ctx.case, ctx.current, lang, ctx.coh))
    if p.get("table", True) and groups:
        rows = []
        for stem, _, vals in groups:
            chips = "".join(zchip(lang, z, where) for where, z in vals)
            rows.append(f'<tr><td>{esc(stem)}</td><td class="chips">{chips}</td></tr>')
        inner += ('<div class="keep sumtab">' + ctx.figlabel(t["sum_table"])
                  + f'<table class="grid sumtable"><tr><th>{esc(t["sum_analysis"])}</th>'
                  f'<th>{esc(t["sum_where"])}, z</th></tr>{"".join(rows)}</table>'
                  + '<div class="row keyrow"><div class="cell scalecell">'
                  + fig(fg.colourbar_svg(t["zbar"]), "fig scale")
                  + f'</div><div class="cell"><p class="legend key">{esc(t["reading_key"])}</p></div></div></div>')
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("summary"))


def d_quality(ctx, p):
    inner = ctx.say(tl.quality_sentences(ctx.current, ctx.lang)
                    + tl.confirmation_sentences(ctx.current, ctx.lang))
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("quality"))


def d_spectra_maps(ctx, p):
    t, lang = ctx.t, ctx.lang
    parts = []
    relative = p.get("relative", True)
    for cond in ALL:
        if tl.missing(ctx.current, cond):
            parts.append(ctx.say(tl.spectral_sentences(ctx.case, ctx.current, cond, lang)))
            continue
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(ctx.figlabel(f'{t["maps_abs"]}, {ctx.cond_label(cond)}'))
        parts.append(fig(fg.band_maps_svg(ctx.case, ctx.current, cond, "abs_z",
                                          label_fn=label_band(lang))))
        if relative:
            parts.append(ctx.figlabel(f'{t["maps_rel"]}, {ctx.cond_label(cond)}'))
            parts.append(fig(fg.band_maps_svg(ctx.case, ctx.current, cond, "rel_z",
                                              label_fn=label_band(lang))))
        parts.append("</div>")
        parts.append(ctx.say(tl.spectral_sentences(ctx.case, ctx.current, cond, lang,
                                                   relative=relative)))
    last = parts.pop() if parts else ""
    parts.append('<div class="keep">' + last + fig(fg.colourbar_svg(t["zbar"]), "fig scale")
                 + f'<p class="legend">{esc(t["rings"])}</p></div>')
    return wrap(ctx, "device", ctx.block_ref,
                "\n".join(parts), ctx.heading("spectra"))


def d_spectra_grid(ctx, p):
    """Absolute spectra per electrode, and with the variant "+rel" the relative spectra (share
    of total power per 0.5 Hz bin, review B1); "+earlier" overlays the earlier measurement."""
    t = ctx.t
    parts = []
    overlay = p.get("overlay_earlier") and ctx.earlier
    derived = False
    for cond in ALL:
        if tl.missing(ctx.current, cond):
            continue
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(ctx.figlabel(f'{t["spectra_grid"]}, {ctx.cond_label(cond)}'))
        parts.append(fig(fg.spectra_grid_svg(ctx.case, ctx.current, cond,
                                             earlier=ctx.earlier if overlay else None,
                                             xlabel=t["hz"]), "fig grid") + "</div>")
    if p.get("relative"):
        for cond in ALL:
            rel = tl.relative_spectrum(ctx.current, cond)
            if not rel or rel["rel_z"] is None:
                continue
            derived = derived or rel["derived"]
            if overlay:
                rel["earlier"] = tl.relative_spectrum(ctx.earlier, cond)
            parts.append('<div class="keep">' + ctx.figlabel(
                f'{t["spectra_grid_rel"]}, {ctx.cond_label(cond)}'))
            parts.append(fig(fg.spectra_grid_svg(ctx.case, ctx.current, cond, relative=rel,
                                                 xlabel=t["hz"], ylabel=t["rel_y"]), "fig grid")
                         + "</div>")
    legend = t["spectra_legend"]
    if not overlay:
        legend = legend.rsplit(".", 2)[0] + "."
    if derived:
        legend += " " + t["rel_derived"]
    parts.append(f'<p class="legend">{esc(legend)}</p>')
    variant = "abs" + ("+rel" if p.get("relative") else "") + ("+earlier" if p.get("overlay_earlier") else "")
    return wrap(ctx, "device", ctx.block_ref, "\n".join(parts),
                ctx.heading("spectra_grid"))


def d_maps_1hz(ctx, p):
    """Maps per 1 Hz band for both conditions (C17); the variant "abs+rel" adds the maps of
    relative power (review B1)."""
    t = ctx.t
    parts = []
    derived = False
    for cond in ALL:
        if tl.missing(ctx.current, cond) or tl.no_norm(ctx.current):
            continue
        parts.append(f'<div class="keep">' + ctx.figlabel(f'{t["maps_1hz"]}, {ctx.cond_label(cond)}'))
        parts.append(fig(fg.maps_1hz_svg(ctx.case, ctx.current, cond)) + "</div>")
        if p.get("relative"):
            rel = tl.relative_maps_1hz(ctx.current, cond)
            if rel:
                derived = derived or ctx.current["spectra"]["conditions"][cond].get("maps_1hz_rel_z") is None
                parts.append('<div class="keep">' + ctx.figlabel(
                    f'{t["maps_1hz_rel"]}, {ctx.cond_label(cond)}'))
                parts.append(fig(fg.maps_1hz_svg(ctx.case, ctx.current, cond, maps=rel[0],
                                                 marked=rel[1])) + "</div>")
    legend = t["rings"] + (" " + t["rel_derived"] if derived else "")
    tail = fig(fg.colourbar_svg(t["zbar"]), "fig scale") + f'<p class="legend">{esc(legend)}</p>'
    if parts and parts[-1].endswith("</div>"):
        parts[-1] = parts[-1][:-len("</div>")] + tail + "</div>"   # keep the scale with a map
    else:
        parts.append(tail)
    return wrap(ctx, "device", ctx.block_ref,
                "\n".join(parts), ctx.heading("maps_1hz"))


def d_ratios(ctx, p):
    """Band ratios and indices (v2, round of 30 October): theta/beta ratio, frontal alpha
    asymmetry index, frontal theta / parietal alpha ratio (number only, AD1) and alpha peak
    frequency per condition, then alpha reactivity (eyes closed over eyes open, SA3); the two new
    rows carry the status "core, proposed" in the annotated build only."""
    t, m, lang = ctx.t, ctx.current, ctx.lang
    rows = []

    def row(lab, cond_lab, rec, v, nd):
        nm = rec.get("norm_mean")
        return (f'<tr><td>{esc(lab)}</td><td>{esc(cond_lab)}</td>'
                f'<td class="num">{tl.num(v, nd, lang)}</td>'
                f'<td class="num">{tl.num(nm, nd, lang) if nm is not None else ""}</td>'
                f'{zcell(lang, rec.get("z"), rec.get("marked"))}</tr>')
    for cond in ALL:
        if tl.missing(m, cond):
            continue
        c = m["spectra"]["conditions"][cond]
        for lab, k, vk, nd in ((t["tbr"], "tbr", "value", 2), (t["faa"], "faa", "value", 2),
                               (t["ftpa"], "ftpa", "value", 2),
                               (t["apf"], "alpha_peak", "hz", 1)):
            if c.get(k) and c[k].get(vk) is not None:
                rows.append(row(lab, ctx.cond_label(cond), c[k], c[k][vk], nd))
    ar = m.get("alpha_reactivity")
    if ar and ar.get("value") is not None:
        rows.append(row(t["ar"], t["ar_cond"], ar, ar["value"], 2))
    head = (f'<tr><th>{esc(t["ratio"])}</th><th></th><th>{esc(t["value"])}</th>'
            f'<th>{esc(t["norm_mean"])}</th><th>z</th></tr>')
    notes = ctx.status_note("ftpa_status") + ctx.status_note("ar_status")
    inner = (f'<div class="keep">{notes}<table class="grid">{head}{"".join(rows)}</table>'
             + zlegend(ctx) + f'<p class="legend">{esc(t["ratios_legend"])}</p></div>')
    inner += ctx.say([s_ for cond in ALL for s_ in tl.ratio_sentences(m, cond, lang)]
                     + tl.alpha_reactivity_sentences(m, lang))
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("ratios"))


def asym_pair_table(ctx):
    """Marked asymmetry pairs (review C15): condition, band, pair, index, the electrode with more
    power and z."""
    t, lang = ctx.t, ctx.lang
    rows = []
    for cond in ALL:
        if tl.missing(ctx.current, cond) or tl.no_norm(ctx.current):
            continue
        asym = ctx.current["spectra"]["conditions"][cond]["asymmetry"]
        for b in tl.BAND[lang]:
            for r in sorted([r for r in asym[b] if r.get("marked")], key=lambda r: tl.zkey(r["z"])):
                rows.append(f'<tr><td>{esc(ctx.cond_label(cond))}</td><td>{esc(tl.BAND[lang][b])}</td>'
                            f'<td>{esc(r["pair"])}</td><td class="num">{tl.num(r["value"], 2, lang)}</td>'
                            f'<td>{esc(tl.asym_side(r) or "")}</td>{zcell(lang, r["z"], True)}</tr>')
    if not rows:
        return ""
    return ('<div class="keep">' + ctx.figlabel(t["asym_pairs"])
            + f'<table class="grid small"><tr><th>{esc(t["fm_cond"])}</th><th>{esc(t["band"])}</th>'
            f'<th>{esc(t["pair"])}</th><th>{esc(t["asym_index"])}</th><th>{esc(t["asym_side"])}</th>'
            f'<th>z</th></tr>{"".join(rows)}</table></div>')


def d_asymmetry(ctx, p):
    parts = []
    for cond in ALL:
        if tl.missing(ctx.current, cond):
            parts.append(ctx.say(tl.asymmetry_sentences(ctx.current, cond, ctx.lang)))
            continue
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(fig(fg.asymmetry_svg(ctx.case, ctx.current, cond,
                                          label_fn=label_band(ctx.lang))) + "</div>")
        parts.append(ctx.say(tl.asymmetry_sentences(ctx.current, cond, ctx.lang)))
    parts.append('<div class="keep">' + asym_pair_table(ctx)
                 + fig(fg.colourbar_svg(ctx.t["zbar"]), "fig scale")
                 + f'<p class="legend">{esc(ctx.t["asym_legend"])} {esc(ctx.t["rings"])}</p></div>')
    return wrap(ctx, "device", ctx.block_ref, "\n".join(parts),
                ctx.heading("asymmetry"))


def coh_pair_table(ctx, cond, per_row=10, kind="msc"):
    """Compact table of the marked coherence pairs of one condition and type, grouped by band
    (pair, value, z), largest |z| first within a band. The coherence sentences point at it."""
    t, lang = ctx.t, ctx.lang
    table = "coh_pairs" if kind == "msc" else "cohlag_pairs"
    cols = []
    for b in tl.BAND[lang]:
        hits = sorted([x for x in tl.coherence_pairs(ctx.current, cond, b, kind) if x.get("marked")],
                      key=lambda x: tl.zkey(x["z"]))
        cols += [(b, x) for x in hits]
    if not cols:
        return ""
    tables = []
    for i in range(0, len(cols), per_row):
        chunk = cols[i:i + per_row]
        groups = []
        for b, _ in chunk:
            if groups and groups[-1][0] == b:
                groups[-1][1] += 1
            else:
                groups.append([b, 1])
        bands = "".join(f'<th colspan="{n}" class="tc">{esc(tl.BAND[lang][b])}</th>'
                        for b, n in groups)
        pairs = "".join(f'<td class="tc pair">{esc(x["pair"])}</td>' for _, x in chunk)
        vals = "".join(f'<td class="num">{tl.num(x["value"], 2, lang)}</td>' for _, x in chunk)
        zs = "".join(zcell(lang, x["z"], x["marked"]) for _, x in chunk)
        tables.append(f'<table class="grid small cohpairs"><tr><th>{esc(t["band"])}</th>{bands}</tr>'
                      f'<tr><td>{esc(t["pair"])}</td>{pairs}</tr>'
                      f'<tr><td>{esc(t["coh_value"])}</td>{vals}</tr>'
                      f'<tr><td>z</td>{zs}</tr></table>')
        for b, x in chunk:
            ctx.tables.add((table, cond, b, x["pair"]))
    label = ctx.figlabel(f'{t["coh_pairs"]}{ctx.sep()}{t["coh_type_" + kind]}{ctx.sep()}'
                         f'{ctx.cond_label(cond)}', cls="figlabel tc")
    return f'<div class="keep">{label}{"".join(tables)}</div>'


def coh_global_table(ctx, conds):
    """Global coherence (mean over all electrode pairs, per band) in its four types, magnitude
    squared, lagged, instantaneous and total (table 3.3, Core; V3 prints them under each band
    head): one row per condition and type, value and z per band."""
    t, lang = ctx.t, ctx.lang
    bands = list(tl.BAND[lang])
    heads = "".join(f'<th colspan="2" class="tc">{esc(tl.BAND[lang][b])}</th>' for b in bands)
    sub = "".join(f'<th class="tc">{esc(t["value"])}</th><th class="tc">z</th>' for _ in bands)
    rows = []
    for cond in conds:
        gv = {b: tl.global_values(ctx.current, cond, b) for b in bands}
        for k in tl.GLOBAL_TYPES:
            if not any(k in gv[b] for b in bands):
                continue
            cells = ""
            for b in bands:
                g = gv[b].get(k)
                cells += (f'<td class="num">{tl.num(g["value"], 2, lang)}</td>'
                          + zcell(lang, g.get("z"), g.get("marked")) if g else
                          '<td class="num"></td><td class="num"></td>')
            rows.append(f'<tr><td>{esc(ctx.cond_label(cond))}{ctx.sep()}'
                        f'{esc(t["glob_" + k])}</td>{cells}</tr>')
    return (ctx.status_note("global_coh_status")
            + f'<div class="figlabel">{esc(t["global_coh"])}</div>'
            f'<table class="grid small cohglobal"><tr><th></th>{heads}</tr><tr><th></th>{sub}</tr>'
            f'{"".join(rows)}</table>')


def d_coherence(ctx, p):
    """Coherence (v2): the type per electrode pair the template chose (variant msc: magnitude
    squared, Core; lagged: lagged coherence, Core, proposed; table 3.3 "the user chooses"), its
    maps of the marked pairs, sentences and pair table; with "+global" the four global types."""
    lang = ctx.lang
    kind = p.get("type", "msc")
    parts = []
    if kind == "lagged":
        parts.append(ctx.status_note("lag_status"))
    conds = [c for c in ALL if not tl.missing(ctx.current, c)]
    for cond in conds:
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}{ctx.sep()}'
                     f'{esc(ctx.t["coh_type_" + kind])}</h3><div class="row">')
        for b in [x["name"] for x in ctx.case["bands"]]:
            lohi = next(x for x in ctx.case["bands"] if x["name"] == b)
            parts.append('<div class="cell">' + fg.coherence_svg(
                ctx.case, ctx.current, cond, b, title=label_band(lang)(b, lohi), kind=kind)
                + "</div>")
        parts.append("</div></div>")
        parts.append(ctx.say(tl.coherence_sentences(ctx.current, cond, lang, with_refs=True,
                                                    kind=kind)))
        parts.append(coh_pair_table(ctx, cond, kind=kind))
    for cond in ALL:
        if tl.missing(ctx.current, cond):
            parts.append(ctx.say(tl.coherence_sentences(ctx.current, cond, lang, kind=kind)))
    if p.get("global", True) and not tl.no_norm(ctx.current):
        gtable = coh_global_table(ctx, conds)
        gsent = ctx.say([s_ for c in conds for s_ in tl.global_coherence_sentences(ctx.current, c, lang)])
        note = " " + ctx.t["global_coh_note"]
    else:
        gtable, gsent, note = "", "", ""
    # the global table, then the colour scale of the lines with the legend, kept together so a
    # page break never leaves the legend alone on a page
    parts.append(f'<div class="keep">{gtable}{gsent}<div class="row cohfoot">'
                 f'<div class="cell scalecell">'
                 f'{fig(fg.colourbar_svg(ctx.t["zbar"], width=2.6), "fig scale slim")}</div>'
                 f'<div class="cell"><p class="legend">{esc(ctx.t["coh_legend_" + kind])} '
                 f'{esc(ctx.t["z_marked"])}{esc(note)}</p></div></div></div>')
    return wrap(ctx, "device", ctx.block_ref,
                "\n".join(parts), ctx.heading("coherence"))


def d_erp(ctx, p):
    """Channel ERPs (review B2): a 19-channel grid per trial type (Go, NoGo, Novelty; Ignore
    with the variant "+ignore"), a tick on every scored peak, the Go and NoGo overlay with the
    difference, the peak table, the CNV window and the sign of the negative components."""
    t, lang = ctx.t, ctx.lang
    overlay = p.get("overlay_earlier") and ctx.earlier
    trials = p.get("trials", ["go", "nogo", "novelty"])
    parts = []
    for trial in trials:
        parts.append('<div class="keep">' + ctx.figlabel(
            t["erp_grid"].format(trial=tl.TRIAL[lang][trial])))
        parts.append(fig(fg.erp_grid19_svg(ctx.case, ctx.current, trial,
                                           earlier=ctx.earlier if overlay else None,
                                           xlabel=t["erp_x"], ylabel=t["erp_y"]), "fig grid erpgrid")
                     + "</div>")
    if "go" in trials and "nogo" in trials:
        parts.append('<div class="keep">' + ctx.figlabel(t["go_nogo"])
                     + fig(fg.go_nogo_svg(ctx.case, ctx.current,
                                          labels=("Go", "NoGo", t["go_minus_nogo"]),
                                          xlabel=t["erp_x"], ylabel=t["erp_y"])) + "</div>")
    legend = t["erp_legend"]
    if overlay:
        legend += " " + t["earlier_line"] + "."
    cnv = next((pk for pk in ctx.current["erp"]["peaks"] if pk["latency_ms"] is None), None)
    rows = []
    for pk in ctx.current["erp"]["peaks"]:
        lat = f'{pk["latency_ms"]}' if pk["latency_ms"] is not None else ""
        rows.append(f'<tr><td>{esc(pk["component"])}</td><td>{esc(tl.TRIAL[lang][pk["condition"]])}</td>'
                    f'<td>{esc(pk["site"])}</td><td class="num">{tl.num(pk["amplitude_uv"], 1, lang)}</td>'
                    f'{zcell(lang, pk["amplitude_z"], pk.get("amplitude_marked"))}'
                    f'<td class="num">{esc(lat)}</td>'
                    f'{zcell(lang, pk["latency_z"], pk.get("latency_marked"))}</tr>')
    head = (f'<tr><th>{esc(t["component"])}</th><th>{esc(t["trial"])}</th><th>{esc(t["site"])}</th>'
            f'<th>{esc(t["amplitude"])}</th><th>z</th><th>{esc(t["latency"])}</th><th>z</th></tr>')
    notes = [t["erp_sign"]]
    if cnv is not None:
        w = cnv.get("window_ms")
        a, b = (re.fullmatch(r"\s*(-?\d+)\s+to\s+(-?\d+)\s*", w).groups() if isinstance(w, str)
                else (w[0], w[1]))
        notes.append(t["cnv_note"].format(a=a, b=b))
    p3a = ctx.status_note("p3a_note") if any(pk["component"] == "P3a"
                                             for pk in ctx.current["erp"]["peaks"]) else ""
    parts.append('<div class="keep">' + ctx.figlabel(t["erp_peaks"])
                 + f'<table class="grid">{head}{"".join(rows)}</table>' + zlegend(ctx)
                 + f'<p class="legend">{esc(" ".join(notes))}</p>{p3a}</div>')
    parts.append(f'<p class="legend">{esc(legend)}</p>')
    parts.append(ctx.say(tl.erp_peak_confirmation(ctx.current, lang)
                         + tl.erp_sentences(ctx.current, lang)))
    variant = "grid" + ("+ignore" if "ignore" in trials else "") + ("+earlier" if p.get("overlay_earlier") else "")
    return wrap(ctx, "device", ctx.block_ref, "\n".join(parts), ctx.heading("erp"))


def d_vcpt(ctx, p):
    t, v, lang = ctx.t, ctx.current["vcpt"], ctx.lang
    rows = []
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = v[key]
        if m.get("percentile") is None:
            pc = ""
        else:
            pc = f'{int(m["percentile"] + 0.5)}' if m["percentile"] < 99.5 else ">99"
        rows.append(f'<tr><td>{esc(tl.VCPT_MEASURE[lang][key])}</td>'
                    f'<td class="num">{m["value"]}{tl.UNIT[key]}</td><td class="num">{pc}</td>'
                    f'{zcell(lang, m.get("z"), m.get("marked"))}</tr>')
    head = (f'<tr><th>{esc(t["measure"])}</th><th>{esc(t["value"])}</th>'
            f'<th>{esc(t["percentile"])}</th><th>z</th></tr>')
    inner = certnote(ctx, "vcpt_cert")
    inner += (f'<div class="row"><div class="cell"><table class="grid">{head}{"".join(rows)}</table>'
              + zlegend(ctx) + '</div>')
    inner += ('<div class="cell">' + ctx.figlabel(t["errors_block"])
              + fg.errors_per_block_svg(tl.errors_by_block(ctx.current), xlabel=t["errors_x"],
                                        ylabel=t["errors_y"],
                                        labels=(t["errors_om"], t["errors_co"]))
              + "</div></div>")
    if p.get("rt_figures") and v.get("trial_list"):
        inner += rt_figures(ctx, v)
    inner += ctx.say(tl.behaviour_sentences(ctx.current, lang))
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("vcpt"))


def rt_figures(ctx, v):
    """The two reaction time figures of the VCPT block (variant std+rt): over trials and the
    histogram of correct Go trials (figures.rt_series defines what they draw)."""
    t = ctx.t
    labels = {"band": t["rt_band"], "correct": t["rt_correct"], "below": t["rt_below"],
              "above": t["rt_above"], "commission": t["rt_commission"], "other": t["rt_other"],
              "omission": t["rt_omission"], "x": t["rt_x"], "y": t["rt_y"], "hx": t["rt_hx"],
              "hy": t["rt_hy"], "bars": t["rt_bars"], "norm_curve": t["rt_norm_curve"],
              "norm_mean": t["rt_norm_mean"], "patient_mean": t["rt_patient_mean"]}
    legend = t["rt_legend"] if v.get("rt_norm") else t["rt_legend_nn"]
    return (f'<div class="keep">{ctx.status_note("rt_status")}<div class="row">'
            f'<div class="cell" style="flex:1.45">{ctx.figlabel(t["rt_over"])}'
            f'{fg.rt_over_trials_svg(v, labels)}</div>'
            f'<div class="cell">{ctx.figlabel(t["rt_hist"])}{fg.rt_histogram_svg(v, labels)}</div>'
            f'</div><p class="legend">{esc(legend)}</p></div>')


def comparison_maps_kind(ctx, ms):
    """(map kind, condition) of the comparison maps (review C2): the band power analysis the
    comparison sentences quote first (relative or absolute), else absolute power eyes closed."""
    for label, fam, _ in tl.comparison_items(ctx.case, ms, "en"):
        if fam == "band":
            kind = "rel_z" if label.startswith("relative") else "abs_z"
            cond = "EO" if label.endswith("eyes open") else "EC"
            return kind, cond
    return "abs_z", "EC"


def d_comparison(ctx, p):
    """Measurements side by side, each against its own age norm (3.4): the earlier and the
    current one, or with the variant "all" every measurement of the case, oldest first (review
    B5, TG8), with the maps of the analysis the sentences quote (C2) and the notes on processing
    again (B7)."""
    if not ctx.earlier:
        return ""
    t, lang = ctx.t, ctx.lang
    ms = ctx.compared

    def head_of(m):
        lab = t["current"] if m is ctx.current else t["earlier"]
        extra = f' ({t["uploaded_later"]})' if m.get("uploaded_later") else ""
        return f'<th>{esc(lab)} {esc(tl.fmt_date(m["date"], lang))}{esc(extra)}</th><th>z</th>'
    head = f'<tr><th>{esc(t["measure"])}</th>{"".join(head_of(m) for m in ms)}</tr>'
    rows = []
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        cells = "".join(f'<td class="num">{m["vcpt"][key]["value"]}{tl.UNIT[key]}</td>'
                        f'{zcell(lang, m["vcpt"][key]["z"], m["vcpt"][key].get("marked"))}'
                        for m in ms)
        rows.append(f'<tr><td>{esc(tl.VCPT_MEASURE[lang][key])}</td>{cells}</tr>')
    for cond in ALL:
        for k, lab, nd in (("tbr", t["tbr"], 2), ("alpha_peak", t["apf"], 1)):
            cells = ""
            for m in ms:
                c = m["spectra"]["conditions"][cond]
                v = c[k]["value"] if k == "tbr" else c[k]["hz"]
                cells += (f'<td class="num">{tl.num(v, nd, lang)}</td>'
                          f'{zcell(lang, c[k]["z"], c[k].get("marked"))}')
            rows.append(f'<tr><td>{esc(lab)}, {esc(ctx.cond_label(cond))}</td>{cells}</tr>')
    inner = f'<table class="grid">{head}{"".join(rows)}</table>' + zlegend(ctx)
    kind, mcond = comparison_maps_kind(ctx, ms)
    mlabel = t["maps_rel"] if kind == "rel_z" else t["maps_abs"]
    maps = []
    for m in ms:
        lab = t["current"] if m is ctx.current else t["earlier"]
        maps.append('<div class="cell">' + ctx.figlabel(
            f'{lab} {tl.fmt_date(m["date"], lang)}: {mlabel}, {ctx.cond_label(mcond)}')
            + fg.band_maps_svg(ctx.case, m, mcond, kind, label_fn=label_band(lang)) + "</div>")
    inner += '<div class="keep cmpmaps">' + "".join(f'<div class="row">{x}</div>' for x in maps) + "</div>"
    inner += f'<p class="legend">{esc(t["rings"])}</p>'
    inner += ctx.say(tl.comparison_n_sentences(ctx.case, ms, lang))
    notes = [s_ for s_ in (tl.reproc_sentence(ctx.case, m, lang) for m in ms[:-1]) if s_]
    notes += [tl.say("L-SIDE-1", lang)] + tl.import_sentences(ms, lang)
    inner += ctx.say(notes)
    return wrap(ctx, "device", ctx.block_ref, inner,
                ctx.heading("comparison"))


def d_limits(ctx, p):
    inner = ctx.say(tl.limits_sentences(ctx.lang, None, ctx.current))
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("limits"))


def d_raw(ctx, p):
    """Raw EEG excerpts the clinician added to the report from the recording viewer (review C12):
    8 s each, after cleaning, average reference, negative up (C13); left out when none is
    chosen."""
    chosen = ctx.inputs_for("raw_excerpts")
    chosen = [x for x in (chosen or []) if x["cond"] in ctx.current["raw"]]
    if not chosen:
        return ""
    t, lang = ctx.t, ctx.lang
    syn = t["synthetic"]
    titles = [t["raw_title"].format(cond=ctx.cond_label(x["cond"]), a=tl._hz(x["start_s"], lang),
                                    b=tl._hz(x["start_s"] + x["seconds"], lang), syn=syn)
              for x in chosen]
    secs = sorted({x["seconds"] for x in chosen})
    inner = ('<div class="keep">'
             + fig(fg.raw_excerpts_svg(ctx.case, ctx.current, chosen, titles=titles), "fig raw")
             + f'<p class="legend">{esc(t["raw_legend"].format(s=tl.list_join([str(s_) for s_ in secs], lang)))}</p></div>')
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("raw"))


RC_KEYS = ("time_of_day", "medication_on_day", "last_dose_time", "sleep_before",
           "corrected_vision", "response_hand", "drowsiness_observed")


def rc_value(t, rc, k):
    """A recording condition as printed: "not documented" when absent; the time of the last dose
    is "not applicable" when no medication is reported."""
    v = rc.get(k)
    if k == "last_dose_time" and v is None and rc.get("medication_on_day") == "none_reported":
        return t["rcv_not_applicable"]
    if v is None:
        return t["rcv_not_documented"]
    if k in ("time_of_day", "last_dose_time"):
        return v
    return t.get(f"rcv_{v}", v)


def d_method(ctx, p):
    """Method and norms (template gap TG10, reviews D5 and B10): fixed sentences over the method
    facts and the recording conditions documented at upload."""
    t, m, lang = ctx.t, ctx.current, ctx.lang
    inner = ctx.status_note("norm_model_status") + ctx.say(tl.method_sentences(m, lang))
    rc = m.get("recording_conditions")
    if p.get("recording_conditions", True) and rc is not None:
        body = "".join(f"<tr><th>{esc(t['rc_' + k])}</th><td>{esc(rc_value(t, rc, k))}</td></tr>"
                       for k in RC_KEYS)
        inner += (f'<div class="keep"><div class="figlabel">{esc(t["rc_title"])}</div>'
                  f'<table class="kv rc">{body}</table></div>')
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("method"))


def d_freq_markers(ctx, p):
    """Frequency markers on the spectra (table 3.3, Core since 30 October; review B3): the
    suggested peaks with the clinician's confirmed choices, as a table (TG4) with one head map
    per marker."""
    t, m, lang = ctx.t, ctx.current, ctx.lang
    inputs = ctx.inputs_for("freq_markers")
    rows = tl.freq_marker_rows(m, inputs)
    conds = [c for c in ALL if c in rows]
    P = tl.CHOICE_PARTS[lang]
    trs = []
    for cond in conds:
        for r in rows[cond]:
            qa = "-"
            if r["question"]:
                qa = P["q." + r["question"]] + (f': {P["answer." + r["answer"]]}' if r.get("answer") else "")
            trs.append(f'<tr><td class="num">{r["k"]}</td><td>{esc(ctx.cond_label(cond))}</td>'
                       f'<td>{esc(r["site"])}</td><td class="num">{tl.num(r["hz"], 1, lang)}</td>'
                       f'{zcell(lang, r["z"], r.get("marked"))}<td>{esc(qa)}</td>'
                       f'<td>{esc(t["fm_src_" + r["source"]])}</td></tr>')
    confirm = ctx.status_note("fm_confirm")
    if trs:
        head = (f'<tr><th>{esc(t["fm_no"])}</th><th>{esc(t["fm_cond"])}</th><th>{esc(t["site"])}</th>'
                f'<th>{esc(t["fm_freq"])}</th><th>z</th><th>{esc(t["fm_question"])}</th>'
                f'<th>{esc(t["fm_choice"])}</th></tr>')
        # the status note stays with the table, so the heading never ends a page alone
        inner = (f'<div class="keep">{confirm}{ctx.figlabel(t["freq_markers"])}'
                 f'<table class="grid">{head}{"".join(trs)}</table>{zlegend(ctx)}')
        heads = []
        for cond in conds:
            if rows[cond]:
                heads.append('<div class="cell">' + ctx.figlabel(
                    f'{t["fm_maps"]}{ctx.sep()}{ctx.cond_label(cond)}')
                    + fg.marker_maps_svg(ctx.case, m, rows[cond]) + "</div>")
        # table, head maps and their legend stay together on one page
        inner += f'<div class="row">{"".join(heads)}</div>'
        inner += f'<p class="legend">{esc(t["fm_legend"])}</p></div>'
    else:
        inner = confirm + f'<p class="legend">{esc(t["fm_none"])}</p>'
    inner += ctx.say(tl.freq_marker_sentences(m, inputs, lang, conds))
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("freq_markers"))


def d_erp_review(ctx, p):
    """ERP peak review (table 3.3, 30 October: ERP peak values against norms with the clinician's
    review, Core, proposed; IU9 working decision; replaces the checklist over channel ERPs): per
    scored peak whether the peak is clear, its amplitude and latency z, the deviation ticks the
    system proposed where the peak is clear and the value marked, as the clinician confirmed or
    changed them, and the unusual curve shape the clinician may mark; then the ERPREV sentences."""
    t, lang = ctx.t, ctx.lang
    m = ctx.current
    inputs = ctx.inputs_for("erp_review")
    rows = tl.review_rows(m)
    fin = tl.review_final(rows, inputs) if inputs.get("confirmed") else \
        {r["id"]: {"amp": r["proposed"]["amp"], "lat": r["proposed"]["lat"], "shape": False}
         for r in rows}
    nn = tl.no_norm(m)

    def tick(r, kind):
        prop, cur = r["proposed"][kind], fin[r["id"]][kind]
        out = []
        if prop and cur != prop:
            out.append(f'<s>{esc(t["rev_" + prop])}</s> ({esc(t["rev_removed"])})')
        if cur:
            out.append(esc(t["rev_" + cur]) + ("" if cur == prop else f' ({esc(t["rev_added"])})'))
        return "<br>".join(out) or ('<span class="muted">-</span>' if kind == "lat"
                                     and not r["latency"] else "")
    head = (f'<tr><th>{esc(t["component"])}</th><th>{esc(t["trial"])}</th><th>{esc(t["site"])}</th>'
            f'<th class="tc">{esc(t["rev_clear"])}</th><th>{esc(t["rev_amp"])}</th><th>z</th>'
            f'<th>{esc(t["rev_lat"])}</th><th>z</th><th class="tc">{esc(t["rev_shape"])}</th></tr>')
    trs = []
    for r in rows:
        if r["latency"]:
            snr = r.get("prominence_snr")
            clear = t["rev_clear_yes" if r["clear"] else "rev_clear_no"]
            if snr is not None:
                clear += f' ({tl.num(snr, 1, lang)})'
        else:
            clear = t["rev_mean"]
        shape = esc(t["rev_shape_set"]) if fin[r["id"]]["shape"] else ""
        trs.append(f'<tr><td>{esc(r["component"])}</td><td>{esc(tl.TRIAL[lang][r["trial"]])}</td>'
                   f'<td>{esc(r["site"])}</td><td class="tc">{esc(clear)}</td>'
                   f'<td>{tick(r, "amp")}</td>{zcell(lang, r["amplitude_z"], r["amplitude_marked"])}'
                   f'<td>{tick(r, "lat")}</td>'
                   f'{zcell(lang, r["latency_z"], r["latency_marked"]) if r["latency"] else "<td class=\"num muted\">-</td>"}'
                   f'<td class="tc">{shape}</td></tr>')
    legend = t["rev_legend_nn"] if nn else t["rev_legend"]
    inner = (f'<div class="keep">{ctx.status_note("rev_status")}'
             f'<table class="grid small review">{head}{"".join(trs)}</table>'
             f'<p class="legend">{esc(legend)}</p></div>')
    inner += ctx.say(tl.review_sentences(m, inputs, lang))
    return wrap(ctx, "device", ctx.block_ref, inner, ctx.heading("erp_review"))


def d_source_regions(ctx, p):
    """Source power per brain region (sLORETA region values against norms, table 3.3 Core,
    proposed; repo L7): one region x band table for both resting conditions, z on the fixed
    colour scale (values only without a norm), the SRC sentences and the fixed limits sentence."""
    t, lang = ctx.t, ctx.lang
    m = ctx.current
    nn = tl.no_norm(m)
    bands = list(tl.BAND[lang])
    conds = [c for c in ALL if not tl.missing(m, c) and tl.source_regions(m, c)]
    parts = [ctx.status_note("src_status")]
    if conds:
        regions = tl.source_regions(m, conds[0]).get("regions") or list(tl.REGIONS)
        chead = "".join(f'<th colspan="{len(bands)}" class="tc">{esc(ctx.cond_label(c))}</th>'
                        for c in conds)
        bhead = "".join(f'<th class="tc">{esc(tl.BAND[lang][b])}</th>' for _ in conds for b in bands)
        trs = []
        for r in regions:
            cells = ""
            for c in conds:
                vals = tl.source_regions(m, c)["values"]
                for b in bands:
                    v = (vals.get(r) or {}).get(b) or {}
                    if nn or v.get("z") is None:
                        x = tl.num(v["value"], 2, lang) if v.get("value") is not None else ""
                        cells += f'<td class="num">{x}</td>'
                    else:
                        cells += zcell(lang, v["z"], v.get("marked"))
            trs.append(f'<tr><td>{esc(tl.REGION[lang][r])}</td>{cells}</tr>')
        parts.append(f'<div class="keep">{ctx.figlabel(t["src_table_nn" if nn else "src_table"])}'
                     f'<table class="grid small srctable"><tr><th rowspan="2">{esc(t["src_region"])}</th>'
                     f'{chead}</tr><tr>{bhead}</tr>{"".join(trs)}</table></div>')
    parts.append(ctx.say([s_ for c in ALL for s_ in tl.source_sentences(m, c, lang)]))
    parts.append('<div class="keep">' + (fig(fg.colourbar_svg(t["zbar"]), "fig scale") if not nn else "")
                 + f'<p class="legend">{esc(t["src_legend"])} {esc(t["z_marked"]) if not nn else ""}</p>'
                 + ctx.say(tl.source_limits(lang)) + '</div>')
    return wrap(ctx, "device", ctx.block_ref, "\n".join(parts), ctx.heading("source_regions"))


def d_issued(ctx, p):
    """Required block: who issued the report, when, how it was signed, and which version it
    replaces (review D1)."""
    t, r = ctx.t, ctx.report
    if r["status"] == "issued":
        who = r.get("issued_by", "")
        when = tl.fmt_date(r["issued_on"], ctx.lang)
        if r.get("issued_at"):
            when = t["issued_at_fmt"].format(d=when, tm=r["issued_at"])
        sign = t["sign_text"]
    else:
        who = when = sign = f'________________  ({t["on_issue"]})'
    rep = r.get("replaces")
    replaces = (t["replaces_v"].format(v=rep["version"], reason=rep["reason"]) if rep
                else t["replaces_none"])
    rows = [(t["issuer"], who), (t["issue_date"], when), (t["sign_row"], sign),
            (t["version"], f'{r["version"]} · {status_text(ctx)}'), (t["replaces"], replaces)]
    body = "".join(f"<tr><th>{esc(a)}</th><td>{esc(b)}</td></tr>" for a, b in rows)
    return wrap(ctx, "device", ctx.block_ref, f'<table class="kv issued">{body}</table>',
                ctx.heading("issued_block", numbered=False), cls="issued-block")


def d_sources(ctx, p):
    """Text sources (review D7): the ids of the system sentences printed, by section, in place of
    an id after every sentence; the required last block."""
    t, lang = ctx.t, ctx.lang
    by = {}
    for s_, blk in ctx.rendered:
        by.setdefault(blk, [])
        if s_["id"] not in by[blk]:
            by[blk].append(s_["id"])
    note = {"de": f' ({t["textlib_note_de"]})', "ja": f' ({t["textlib_note_ja"]})'}.get(lang, "")
    items = "".join(f'<div class="src"><span class="k">{esc(ctx.titles.get(blk, blk))}</span>'
                    f'<span class="v">{", ".join(f"<span>{esc(i)}</span>" for i in ids)}</span></div>'
                    for blk, ids in by.items() if blk)
    inner = (f'<p class="legend">{esc(t["sources_intro"].format(v=tl.TEXTLIB_VERSION, note=note))}</p>'
             f'<div class="sources">{items}</div>')
    return wrap(ctx, "device", ctx.block_ref, inner,
                ctx.heading("sources", numbered=False), cls="sources-block")


DEVICE = {
    "versions": d_versions, "summary": d_summary, "quality": d_quality,
    "spectra.maps": d_spectra_maps, "spectra.grid": d_spectra_grid, "spectra.maps1hz": d_maps_1hz,
    "ratios": d_ratios, "asymmetry": d_asymmetry, "coherence": d_coherence,
    "erp.channel": d_erp, "vcpt.behaviour": d_vcpt, "comparison": d_comparison,
    "limits": d_limits, "raw.excerpt": d_raw, "issued": d_issued,
    "method": d_method, "freq.markers": d_freq_markers, "erp.review": d_erp_review,
    "source.regions": d_source_regions,
    "sources": d_sources,
}


# ---------------------------------------------------------------------------------------------
# Clinic blocks, cover pages and clinician blocks
# ---------------------------------------------------------------------------------------------

def placeholder_values(ctx):
    ident = ctx.case["identity_store"]
    m = ctx.current
    v = {
        "name": ident["display_name"], "birth_date": tl.fmt_date(ident["birth_date"], ctx.lang),
        "age": str(age_on(ident["birth_date"], m["date"])), "sex": ctx.t[ctx.case["sex"]],
        "recording_date": tl.fmt_date(m["date"], ctx.lang), "case_code": ctx.case["case_code"],
        "clinic_name": ctx.tpl["clinic_name"], "title": ctx.t["report_title"],
        "earlier_date": tl.list_join([tl.fmt_date(x["date"], ctx.lang) for x in
                                      (ctx.compared[:-1]
                                       or tl.earlier_measurements(ctx.case, m)[-1:])], ctx.lang)
        if (ctx.compared[:-1] or tl.earlier_measurements(ctx.case, m)) else "",
    }
    return v


def fill(ctx, text):
    values = placeholder_values(ctx)
    return re.sub(r"\{(\w+)\}", lambda mm: esc(values.get(mm.group(1), mm.group(0))), esc(text))


def ident_rows(ctx):
    t = ctx.t
    rows = [(t["patient"], "{name}"), (t["birth"], "{birth_date}"),
            (t["age"], "{age} " + t["years"]), (t["sex"], "{sex}"),
            (t["recorded"], "{recording_date}"), (t["code"], "{case_code}")]
    if ctx.earlier:
        rows.append((t["earlier_meas_n"] if len(ctx.compared) > 2 else t["earlier_meas"],
                     "{earlier_date}"))
    return [(a, fill(ctx, b)) for a, b in rows]


def c_header(ctx, p):
    """Simple header block on the first result page (templates without a cover page)."""
    logo = f'<div class="logo">{esc(p.get("logo_text", "LOGO"))}</div>'
    lines = "".join(f"<div>{fill(ctx, x)}</div>" for x in p.get("lines", []))
    rows = "".join(f'<div class="idc"><span class="k">{esc(a)}</span><span class="v">{b}</span></div>'
                   for a, b in ident_rows(ctx))
    inner = (f'<div class="hdr">{logo}<div class="hdrtext"><div class="clinic">'
             f'{esc(ctx.tpl["clinic_name"])}</div>{lines}</div></div>'
             f'<h1>{esc(p.get("title", ctx.t["report_title"]))}</h1><div class="ident">{rows}</div>')
    return wrap(ctx, "clinic", "header", inner, cls="header")


def c_text(ctx, p):
    inner = "".join(f"<p>{fill(ctx, x)}</p>" for x in p["paragraphs"])
    return wrap(ctx, "clinic", p.get("ref", "text"), inner, p.get("title"))


def c_image(ctx, p):
    inner = (f'<div class="imgph" style="height:{p.get("height_mm", 30)}mm">'
             f'{esc(p.get("label", "image"))}</div>')
    return wrap(ctx, "clinic", p.get("ref", "image"), inner, p.get("title"))


def later_market_banner(ctx):
    if not ctx.tpl.get("later_market"):
        return ""
    return (f'<div class="marketbanner"><div>{esc(ctx.t.get("later_market", ""))}</div>'
            f'<div>{esc(ctx.t.get("later_market_en", ""))}</div></div>')


def cover_banner(ctx, cv):
    """Clinic A: flat colour band in place of the photo banner, static images, patient table."""
    t = ctx.t
    title_en = L["en"]["report_title"]
    imgs = "".join(f'<div class="imgph" style="height:{im.get("height_mm", 50)}mm">'
                   f'{esc(im["label"])}</div>' for im in cv.get("images", []))
    r = dict(ident_rows(ctx))
    elab = t["earlier_meas_n"] if len(ctx.compared) > 2 else t["earlier_meas"]
    table = (f'<table class="ptable">'
             f'<tr><th>{esc(t["patient"])}</th><td colspan="3">{r[t["patient"]]}</td></tr>'
             f'<tr><th>{esc(t["code"])}</th><td>{r[t["code"]]}</td>'
             f'<th>{esc(t["birth"])}<br>{esc(t["sex"])}</th>'
             f'<td>{r[t["birth"]]}<br>{r[t["sex"]]}</td></tr>'
             f'<tr><th>{esc(t["recorded"])}</th><td>{r[t["recorded"]]}</td>'
             f'<th>{esc(t["age"])}<br>{esc(elab)}</th>'
             f'<td>{r[t["age"]]}<br>{r.get(elab, "")}</td></tr></table>')
    return (f'<div class="cover banner-cover">'
            f'<div class="band" style="background:{cv.get("band_colour", "#4b7a8a")}">'
            f'<div class="bandname">{esc(cv.get("band_text", ctx.tpl["clinic_name"].upper()))}</div>'
            f'<div class="bandtitle">{esc(t["report_title"])}</div>'
            f'<div class="bandsub">{esc(title_en)}</div></div>'
            f'<div class="coverbody">{later_market_banner(ctx)}{imgs}{table}</div></div>')


def cover_letterhead(ctx, cv):
    """Clinic B: letterhead title page with logo, identity, referral lines and contents."""
    t = ctx.t
    lines = "".join(f"<div>{fill(ctx, x)}</div>" for x in cv.get("letterhead", []))
    rows = "".join(f"<tr><th>{esc(a)}</th><td>{b}</td></tr>" for a, b in ident_rows(ctx))
    extra = "".join(f"<tr><th>{esc(t[k])}</th><td>[{esc(t['placeholder'])}]</td></tr>"
                    for k in cv.get("extra_rows", []))
    toc = ""
    if cv.get("toc"):
        items = []
        for h in ctx.toc_pages.get("_order", []):
            pg = ctx.toc_pages.get(h, "")
            items.append(f'<div class="tocrow"><span>{esc(h)}</span><span class="dots"></span>'
                         f'<span>{pg}</span></div>')
        toc = f'<div class="toc"><div class="toch">{esc(t["contents"])}</div>{"".join(items)}</div>'
    contact = "".join(f"<div>{fill(ctx, x)}</div>" for x in cv.get("contact", []))
    return (f'<div class="cover letter-cover"><div class="lhead"><div class="lhtext">'
            f'<div class="clinic">{esc(ctx.tpl["clinic_name"])}</div>{lines}</div>'
            f'<div class="logo biglogo">{esc(cv.get("logo_text", "LOGO"))}</div></div>'
            f'<h1>{esc(t["report_title"])}</h1>'
            f'<table class="ltable">{rows}{extra}</table>{toc}'
            f'<div class="contactbox">{contact}</div></div>')


def cover_band(ctx, cv):
    """Clinic C: dark top band with the title, centred logo, data list, grey foot band."""
    t = ctx.t
    rows = "".join(f'<div class="dl"><span class="k">{esc(a)}:</span><span class="v">{b}</span></div>'
                   for a, b in ident_rows(ctx))
    addr = "".join(f"<div>{fill(ctx, x)}</div>" for x in cv.get("address", []))
    web = f'<div class="web">{fill(ctx, cv["web"])}</div>' if cv.get("web") else ""
    return (f'<div class="cover band-cover"><div class="topband">'
            f'<div class="toptitle">{esc(t["report_title"])}</div></div>'
            f'<div class="logo coverlogo">{esc(cv.get("logo_text", "LOGO"))}</div>'
            f'<div class="datalist">{rows}</div>'
            f'<div class="footband"><div class="limerule"></div><div class="greyband">'
            f'<div class="logo smalllogo">{esc(cv.get("small_logo_text", "LOGO"))}</div>'
            f'<div class="addr">{addr}{web}</div></div></div></div>')


COVERS = {"banner": cover_banner, "letterhead": cover_letterhead, "band": cover_band}


def k_form(ctx, p):
    """Clinician form (template gap TG6, review D5): clinic-defined rows in the template record,
    filled per report by the clinician; dates and yes or no only, no free text. Left out of an
    issued report when nothing was entered (C29)."""
    t, lang = ctx.t, ctx.lang
    vals = ctx.inputs_for("clinician_form")
    if not vals and ctx.report["status"] == "issued" and not ctx.annotate:
        return ""
    rows = []
    for r in p["rows"]:
        v = vals.get(r["key"])
        if v is None:
            shown = "________________"
        elif r["type"] == "date":
            shown = tl.fmt_date(v, lang)
        elif r["type"] == "yes_no":
            shown = t["rcv_" + v]
        else:
            shown = str(v)
        lab = r["label"].get(lang) or r["label"]["en"]
        rows.append(f"<tr><th>{esc(lab)}</th><td>{esc(shown)}</td></tr>")
    inner = f'<div class="clin fields"><table class="kv form">{"".join(rows)}</table></div>'
    return wrap(ctx, "clinician", p.get("ref", "form"), inner, ctx.heading("form_title"))


def k_text(ctx, p):
    """Clinician blocks. The structured anamnesis prints its fields from the identity store; a
    free text block prints the clinician's text. An empty block (review C29): in a draft only
    the first one prints, with "Clinician block, empty in this sample", the others are left out;
    an issued report leaves every empty block out; the annotated build shows them all."""
    t = ctx.t
    label = p.get("label", "comment")
    if label == "form":
        return k_form(ctx, p)
    is_comment = label == "comment"
    if p.get("fields"):
        # structured anamnesis (open question I5): the fields as the clinician filled them in
        # the report editor; free text from the separate identity store (3.6)
        anam = ctx.case["identity_store"].get("anamnesis") or {}
        vals = [(f, (anam.get(f) or {}).get(ctx.lang) or "") for f in p["fields"]]
        if not any(v for _, v in vals) and ctx.report["status"] == "issued" and not ctx.annotate:
            return ""
        title = ctx.heading("anamnesis_block")
        rows = []
        for f, v in vals:
            cls = "fval" if v else "fval empty"
            rows.append(f'<div class="fld"><div class="flabel">{esc(t["anam_" + f])}</div>'
                        f'<div class="{cls}">{esc(v or "")}</div></div>')
        inner = f'<div class="clin fields">{"".join(rows)}</div>'
        return wrap(ctx, "clinician", p.get("ref", label), inner, title)
    text = p.get("text") or (ctx.inputs_for("clinician_texts") or {}).get(p.get("ref", label))
    if not text:
        if ctx.annotate:
            text = t["clinician_placeholder"]
        elif ctx.report["status"] == "issued" or ctx.empty_shown:
            return ""
        else:
            ctx.empty_shown = True
            text = t["clinician_empty"]
    title = ctx.heading(label, numbered=not is_comment)
    inner = f'<div class="clin">{esc(text)}</div>'
    if p.get("signature"):
        inner += (f'<div class="sig"><span>{esc(t["signature"])}: ____________________</span>'
                  f'<span>{esc(t["date"])}: __________</span></div>')
    return wrap(ctx, "clinician", p.get("ref", label), inner, title,
                cls="small-head" if is_comment else "")


CLINIC = {"header": c_header, "text": c_text, "image": c_image}


def render_blocks(ctx):
    out = []
    cv = ctx.tpl.get("cover")
    if cv:
        out.append(COVERS[cv["type"]](ctx, cv))
    pending_break = False
    for b in ctx.tpl["blocks"]:
        kind = b["kind"]
        html_b = ""
        if kind == "pagebreak":
            pending_break = True
            continue
        elif kind == "device":
            ctx.block, ctx.block_ref = b["id"], b["ref"]
            html_b = DEVICE[b["id"]](ctx, b.get("params", {}))
            ctx.block = ctx.block_ref = None
        elif kind == "clinic":
            html_b = CLINIC[b["type"]](ctx, b)
        elif kind == "clinician":
            html_b = k_text(ctx, b)
        else:
            raise ValueError(f"unknown block kind {kind}")
        if b.get("keep_with_previous") and html_b and out and out[-1]:
            # template option: this block stays on the page of the block before it (no orphan
            # page holding only this block); both move to the next page together if needed
            html_b = f'<div class="keepwith">{out.pop()}{html_b}</div>'
        if (b.get("new_page") or pending_break) and html_b:
            # "start on new page" is a break before the block itself, never an empty element
            # with a break after it: an empty element can land alone at the top of a page when
            # the block before fills its page exactly, which printed a page with no body text.
            # A forced break before the first content of a page (after the cover, or after a
            # page the block before already ended) makes no extra page.
            html_b = f'<div class="np">{html_b}</div>'
            pending_break = False
        out.append(html_b)
    return "\n".join(out)


# ---------------------------------------------------------------------------------------------
# Checks: template schema, forbidden words, sentences only with their blocks
# ---------------------------------------------------------------------------------------------

# Claim words in clinic texts: the shared forbidden list of `mockup/checks/terms.py` (English and
# German at the start of a word, Japanese anywhere), the same list as the sentence library and the
# prototype text check; the intended-use disclaimers of its allow-list pass.
# Self test of the check, run on every build: these must be caught ...
CLAIM_PROBES = ("Befund", "Befundbericht", "EEG-Befund", "Diagnose", "diagnostic", "abnormal",
                "pathologisch", "pathological", "auffällig", "unauffällig", "Störung",
                "Normalbefund", "Therapie", "treatment", "ADHD", "ADHS", "FDA", "診断", "治療")
# ... and these must pass.
CLAIM_CLEAN = ("Bericht", "Quantitativer EEG- und ERP-Bericht", "Clinic B", "Normen",
               "normative mean", "Quantitative EEG and ERP report",
               "The software does not diagnose.")


def claim_hits(text):
    return [word for _, _, word in terms.hits(text)]


def claim_selftest():
    errs = [f"claim check misses {w!r}" for w in CLAIM_PROBES if not claim_hits(w)]
    errs += [f"claim check flags {w!r}" for w in CLAIM_CLEAN if claim_hits(w)]
    return errs


def clinic_texts(tpl):
    """Every text a clinic supplies (blocks, cover, footer), for the claim-word check."""
    out = []
    for b in tpl.get("blocks", []):
        out += b.get("paragraphs", []) + b.get("lines", [])
        out += [b.get("title", ""), b.get("logo_text", "")]
        out += [v for r in b.get("rows", []) for v in r.get("label", {}).values()]
    for sect in ("cover", "clinic_footer", "running_header"):
        for v in (tpl.get(sect) or {}).values():
            if isinstance(v, str):
                out.append(v)
            elif isinstance(v, list):
                out += [x if isinstance(x, str) else x.get("label", "") for x in v]
    return [x for x in out if x]


def validate_refs(tpl):
    """The device block references (review D3): each pins a block of the catalogue, its version
    and one of its variants, and carries no free parameter."""
    errors = []
    for i, b in enumerate(tpl.get("blocks", [])):
        if b.get("kind") != "device":
            continue
        ref = b.get("ref")
        pr = parse_ref(ref)
        if pr is None:
            errors.append(f"block {i}: device reference {ref!r} does not pin a version and a "
                          f"variant (<id>@<version>:<variant>)")
            continue
        bid, ver, var = pr
        if bid not in CATALOGUE:
            errors.append(f"block {i}: unknown device block {bid!r} (Device blocks {CATALOGUE_VERSION})")
            continue
        if ver != CATALOGUE[bid]["v"]:
            errors.append(f"block {i}: {bid} has version {CATALOGUE[bid]['v']} in Device blocks "
                          f"{CATALOGUE_VERSION}, not {ver}")
        if var not in CATALOGUE[bid]["variants"]:
            errors.append(f"block {i}: {bid}@{ver} has no variant {var!r} "
                          f"(variants: {', '.join(CATALOGUE[bid]['variants'])})")
        extra = sorted(set(b) - {"kind", "ref", "new_page", "keep_with_previous"})
        if extra:
            errors.append(f"block {i}: device block {ref} carries free fields {extra}; a variant "
                          "of the catalogue names its parameters")
    return errors


def validate_summary_rule(rtpl):
    """Case-independent summary rule (review C17, mockup assumption until the clinical lead
    decides): with the summary in a template, every family the summary ranks or counts has its
    block, and the blocks show both conditions (the catalogue fixes eyes open and eyes closed)."""
    ids = [b["id"] for b in rtpl.get("blocks", []) if b.get("kind") == "device"]
    if "summary" not in ids:
        return []
    return [f"the summary ranks or counts {fam}, but the template has no block {ref}"
            for fam, ref in FAMILY_BLOCK.items() if ref not in ids]


def summary_rule_selftest():
    """Self test of the case-independent summary rule (C17), run on every build: a template with
    the summary but without the maps per 1 Hz band, and one with an unknown variant, must fail."""
    probe = {"blocks": [{"kind": "device", "ref": ref_of(k, next(iter(v["variants"])))}
                        for k, v in CATALOGUE.items() if k != "spectra.maps1hz"]}
    errs = []
    if not validate_summary_rule(resolve_template(probe)):
        errs.append("summary rule misses a template without spectra.maps1hz")
    if not validate_refs({"blocks": [{"kind": "device", "ref": "spectra.maps@1:rel-only"}]}):
        errs.append("schema check misses an unknown variant")
    return errs


def validate_template(tpl):
    errors = summary_rule_selftest()
    for k in ("clinic_name", "language", "theme", "blocks", "template_id", "template_version"):
        if k not in tpl:
            errors.append(f"missing {k}")
    if tpl.get("language") not in tl.LANGS:
        errors.append("language not supported")
    errors += validate_refs(tpl)
    rtpl = resolve_template(tpl)
    blocks = rtpl.get("blocks", [])
    ids = [b.get("id") for b in blocks if b["kind"] == "device"]
    for req in REQUIRED_BLOCKS:
        if req not in ids:
            errors.append(f"required device block {req} missing")
    if blocks and not (blocks[-1]["kind"] == "device" and blocks[-1].get("id") == "sources"):
        errors.append("the Text sources block (sources) must be the last block")
    errors += validate_summary_rule(rtpl)
    prev = None
    for i, b in enumerate(blocks):
        if b["kind"] == "clinic" and b.get("type") not in CLINIC:
            errors.append(f"block {i}: unknown clinic block type")
        if b["kind"] == "clinician" and b.get("label", "comment") == "comment":
            if not (prev and prev["kind"] == "device" and prev.get("id") in RESULT_BLOCKS):
                errors.append(f"block {i}: a clinician comment must follow a result section")
        if b["kind"] != "pagebreak":
            prev = b
        if b["kind"] == "clinician" and b.get("label") == "form":
            # TG6: the rows of a clinician form must not name conditions, mental functions or
            # treatments (an error here, not a warning)
            for r in b.get("rows", []):
                for lang_, lab in r.get("label", {}).items():
                    if claim_hits(lab):
                        errors.append(f"block {i}: clinician form row {r.get('key')} ({lang_}) "
                                      f"names {claim_hits(lab)}")
                if r.get("type") not in ("date", "yes_no"):
                    errors.append(f"block {i}: clinician form row {r.get('key')}: type must be "
                                  "date or yes_no")
        if b["kind"] == "clinician" and b.get("fields"):
            bad = [f for f in b["fields"] if f not in ("anamnesis", "history", "medication",
                                                       "current_symptoms")]
            if bad:
                errors.append(f"block {i}: unknown anamnesis fields {bad}")
    if tpl.get("cover") and tpl["cover"].get("type") not in COVERS:
        errors.append("unknown cover type")
    th = tpl.get("theme", {})
    if th.get("base_pt", 9) < 8:
        errors.append("theme: base font below the minimum size of 8 pt")
    approved = {"DejaVu Sans", "DejaVu Serif", "Liberation Sans", "Liberation Serif", "IPAGothic",
                "IPAPGothic"}
    for f in (th.get("font_body"), th.get("font_head")):
        if f and f not in approved:
            errors.append(f"theme: font {f} not on the approved list")
    errors += claim_selftest()
    for text in clinic_texts(tpl) + [L.get(tpl.get("language"), {}).get("report_title", "")]:
        hits = claim_hits(text)
        if hits:
            errors.append(f"warning: claim word {hits} in a clinic text: {text!r} "
                          "(open question in I6)")
    return errors


def check_rendered(ctx):
    probs = []
    for s, _ in ctx.rendered:
        if s["id"] in tl.FORBIDDEN_EXEMPT:
            continue
        for _, pat, word in tl.forbidden_hits(s["text"], ctx.lang):
            probs.append(f'{s["id"]}: {word!r} ({pat}) in "{s["text"]}"')
    return probs


def owner_block(sid):
    for pat, ref in SENTENCE_BLOCK:
        if re.search(pat, sid):
            return ref
    return None


def item_condition(stem, lang):
    for cond in ("EO", "EC"):
        if tl.COND[lang][cond] in stem:
            return cond
    return None


TABLE_REF_RE = re.compile("|".join(re.escape(x).replace(re.escape("{n}"), r"\d+")
                                   for x in tl.TABLE_REF.values()))


def check_table_refs(ctx):
    """A sentence that refers to a table needs that table, with every row it means, printed in
    the same report; a sentence whose text points at a table without saying which fails too."""
    probs = []
    for s, emitter in ctx.rendered:
        ref = s.get("refers")
        if ref is None:
            if TABLE_REF_RE.search(s["text"]):
                probs.append(f"{s['id']}: refers to a table, but names no table: {s['text']!r}")
            continue
        missing = [x for x in ref["pairs"]
                   if (ref["table"], ref["cond"], ref["band"], x) not in ctx.tables]
        if missing:
            probs.append(f"{s['id']}: refers to table {ref['table']} ({ref['cond']}, "
                         f"{ref['band']}), but rows {missing} are not printed")
    return probs


def check_sentence_blocks(ctx):
    """A sentence is printed only when its block is in the template; every summary entry and
    every family named in the count sentence has a block that shows its values."""
    probs = []
    present = {b["id"]: b.get("params", {}) for b in ctx.tpl["blocks"] if b["kind"] == "device"}
    for s, emitter in ctx.rendered:
        owner = owner_block(s["id"])
        if owner is None:
            probs.append(f"{s['id']}: no owning block known")
        elif owner not in present:
            probs.append(f"{s['id']}: printed, but its block {owner} is not in the template")
        elif owner != emitter:
            probs.append(f"{s['id']}: printed by {emitter}, belongs to {owner}")
    probs += check_table_refs(ctx)
    ids = {s["id"] for s, _ in ctx.rendered}
    if "SUM-2" in ids:
        every = tl.all_deviations(ctx.case, ctx.current, ctx.lang)
        marked = [x for x in every if x[3]]
        chosen = [x for i, x in enumerate(marked)
                  if i < tl.SUMMARY_TOP or tl.over(x[1], tl.SUMMARY_ALWAYS)]
        for x in chosen:
            ref = FAMILY_BLOCK[x[4]]
            if ref not in present:
                probs.append(f"summary names {x[2]!r}, but block {ref} is not in the template")
                continue
            cond = item_condition(x[5], ctx.lang)
            conds = present[ref].get("conditions", DEFAULT_CONDITIONS.get(ref))
            if cond and conds and cond not in conds:
                probs.append(f"summary names {x[2]!r}, but block {ref} does not show {cond}")
    if "SUM-COUNT-1" in ids:
        for fam, ref in FAMILY_BLOCK.items():
            if ref not in present:
                probs.append(f"count sentence names family {fam}, but block {ref} is missing")
    return probs


# ---------------------------------------------------------------------------------------------
# HTML, overlay and PDF
# ---------------------------------------------------------------------------------------------

def build_html(tpl, annotate=False, case=None, toc_pages=None, issue=None):
    case = case or load_case()
    ctx = Ctx(case, resolve_template(tpl), annotate, toc_pages, issue=issue)
    body = render_blocks(ctx)
    env = Environment(loader=FileSystemLoader(ROOT / "layouts"), autoescape=False)
    css_extra = ""
    if ctx.theme.get("css"):
        css_extra = (ROOT / "layouts" / ctx.theme["css"]).read_text()
    page = env.get_template("report.html.j2").render(
        tpl=tpl, theme=ctx.theme, body=body, t=ctx.t, lang=ctx.lang, annotate=annotate,
        has_cover=bool(tpl.get("cover")), base_css=(ROOT / "layouts" / "base.css").read_text(),
        css_extra=css_extra)
    return page, ctx


def mockup_stamp(ctx, bilingual=False):
    if ctx.lang == "en" or not (bilingual or ctx.lang == "ja"):
        return ctx.t["mockup"]
    return f'{ctx.t["mockup"]} / {L["en"]["mockup"]}'


def overlay_html(ctx, n_pages):
    """One transparent page per body page: running header (from the page the template names),
    a slim clinic footer line, and the device footer line on every page (review C29: no page
    hash in the header; the footer is one line without the logo box after page 1)."""
    th, t, r, m = ctx.theme, ctx.t, ctx.report, ctx.current
    ml, mr = th["margins_mm"][3], th["margins_mm"][1]
    rh = ctx.tpl.get("running_header") or {}
    cf = ctx.tpl.get("clinic_footer") or {}
    pv = placeholder_values(ctx)
    slot = {
        "title": esc(t["report_title"]), "clinic": esc(ctx.tpl["clinic_name"]),
        "patient": esc(f'{pv["name"]} · {pv["birth_date"]}'), "": "", "page_hash": "",
    }
    device = (f'{esc(m["processed_with"]["software"])} · '
              f'{esc(tl.product(m["processed_with"]["norms"], ctx.lang))} · '
              f'{esc(report_label(r))} · {esc(status_text(ctx))}')
    pages = []
    for i in range(1, n_pages + 1):
        parts = []
        if rh and i >= rh.get("from_page", 2):
            def s(k):
                v = rh.get(k, "")
                return slot.get(v, esc(v))
            parts.append(f'<div class="rh" style="top:{th["header_mm"]}mm;left:{ml}mm;right:{mr}mm">'
                         f'<span>{s("left")}</span><span class="c">{s("centre")}</span>'
                         f'<span class="r">{s("right")}</span></div>')
            parts.append(f'<div class="stamp" style="top:{th["header_mm"] - 4.5}mm;right:{mr}mm">'
                         f'{esc(mockup_stamp(ctx, bilingual=True))}</div>')
        if cf and i >= cf.get("from_page", 2):
            logo = (f'<div class="flogo">{esc(cf["logo_text"])}</div>' if cf.get("logo_text") else "")
            lines = "".join(f"<div>{fill(ctx, x)}</div>" for x in cf.get("lines", []))
            parts.append(f'<div class="cf" style="bottom:{cf.get("bottom_mm", 12)}mm;left:{ml}mm;'
                         f'right:{mr}mm">{logo}<div class="cfl">{lines}</div></div>')
        parts.append(f'<div class="df" style="bottom:{th["footer_mm"]}mm;left:{ml}mm;right:{mr}mm">'
                     f'<span class="mk">{esc(mockup_stamp(ctx))}</span><span>{device}</span>'
                     f'<span>{esc(t["page"])} {i} {esc(t["of"])} {n_pages}</span></div>')
        pages.append(f'<div class="pg">{"".join(parts)}</div>')
    font = th["font_body"]
    css = f"""
@page {{ size: A4; margin: 0; }}
html, body {{ margin: 0; background: transparent; }}
body {{ font-family: '{font}', 'IPAGothic', sans-serif; }}
.pg {{ width: 210mm; height: 297mm; position: relative; overflow: hidden; break-after: page; }}
.pg:last-child {{ break-after: auto; }}
.rh {{ position: absolute; display: flex; justify-content: space-between; font-size: 7.5pt;
       color: {th["running_ink"]}; font-style: {th["running_style"]}; }}
.rh span {{ flex: 1; }} .rh .c {{ text-align: center; }} .rh .r {{ text-align: right; }}
.stamp {{ position: absolute; font-size: 6pt; color: #b3261e; font-weight: bold; }}
.cf {{ position: absolute; display: flex; align-items: center; gap: 4mm; font-size: 6.5pt;
       color: {th["running_ink"]}; }}
.cf .flogo {{ width: 40mm; height: 12mm; border: 1px dashed {th["accent"]}; color: {th["accent"]};
       display: flex; align-items: center; justify-content: center; font-size: 6.5pt;
       font-weight: bold; flex: none; }}
.cf .cfl {{ flex: 1; text-align: {cf.get("align", "left")}; }}
.df {{ position: absolute; display: flex; justify-content: space-between; gap: 3mm;
       font-size: 5.8pt; color: #555; white-space: nowrap; }}
.df .mk {{ color: #b3261e; font-weight: bold; }}
"""
    return (f'<!doctype html><html lang="{ctx.lang}"><head><meta charset="utf-8">'
            f'<style>{css}</style></head><body>{"".join(pages)}</body></html>')


def chromium_pdf(html_path, pdf_path):
    payload = json.dumps({"html": str(html_path), "pdf": str(pdf_path), "header": "<span></span>",
                          "footer": "<span></span>", "margins": [0, 0, 0, 0]})
    subprocess.run(["node", str(ROOT / "pdf.js")], input=payload, text=True, check=True)


def heading_pages(pdf_path, headings):
    """Page number of each heading in the body PDF (for the table of contents)."""
    from pypdf import PdfReader
    texts = [re.sub(r"\s+", "", p.extract_text() or "") for p in PdfReader(str(pdf_path)).pages]
    out, start = {"_order": headings}, 0
    for h in headings:
        key = re.sub(r"\s+", "", h)
        for i in range(start, len(texts)):
            if key in texts[i]:
                out[h] = i + 1
                start = i
                break
    return out


def merge_overlay(body_pdf, overlay_pdf, out_pdf):
    from pypdf import PdfReader, PdfWriter
    body, over = PdfReader(str(body_pdf)), PdfReader(str(overlay_pdf))
    if len(body.pages) != len(over.pages):
        sys.exit(f"overlay has {len(over.pages)} pages, body {len(body.pages)}")
    w = PdfWriter()
    for p, q in zip(body.pages, over.pages):
        p.merge_page(q)
        w.add_page(p)
    w.add_metadata({"/Title": "Mockup, synthetic data", "/Producer": "V4 mockup"})
    with open(out_pdf, "wb") as f:
        w.write(f)


def page_count(pdf_path):
    from pypdf import PdfReader
    return len(PdfReader(str(pdf_path)).pages)


def render(tpl_path, pdf_path, annotate=False, keep_html=True, issued=None):
    tpl = json.loads(Path(tpl_path).read_text())
    checks = validate_template(tpl)
    for w in (e for e in checks if e.startswith("warning")):
        print(w, file=sys.stderr)
    errs = [e for e in checks if not e.startswith("warning")]
    if errs:
        sys.exit(f"template invalid: {errs}")
    issue = SAMPLE_ISSUES[issued] if issued else None
    page, ctx = build_html(tpl, annotate, issue=issue)
    probs = check_rendered(ctx) + tl.check_library()
    if probs:
        sys.exit(f"forbidden wording: {probs}")
    probs = check_sentence_blocks(ctx)
    if probs:
        sys.exit("sentence without its block:\n  " + "\n  ".join(probs))
    pdf_path = Path(pdf_path).resolve()
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    html_path = pdf_path.with_suffix(".html")
    with tempfile.TemporaryDirectory() as tmp:
        body_pdf = Path(tmp) / "body.pdf"
        html_path.write_text(page)
        chromium_pdf(html_path, body_pdf)
        if (tpl.get("cover") or {}).get("toc"):
            pages = heading_pages(body_pdf, ctx.toc)
            page, ctx = build_html(tpl, annotate, toc_pages=pages, issue=issue)
            html_path.write_text(page)
            chromium_pdf(html_path, body_pdf)
            missing = [h for h in ctx.toc if h not in pages]
            if missing:
                print(f"warning: no page found for {missing}")
        n = page_count(body_pdf)
        blank = page_text.empty_pages(body_pdf)
        if blank:
            sys.exit(f"{pdf_path.name}: body pages without body text (only the running header "
                     f"and the footers would print there): {blank}")
        ov_path = Path(tmp) / "overlay.html"
        ov_path.write_text(overlay_html(ctx, n))
        ov_pdf = Path(tmp) / "overlay.pdf"
        chromium_pdf(ov_path, ov_pdf)
        merge_overlay(body_pdf, ov_pdf, pdf_path)
    if not keep_html:
        html_path.unlink()
    print(f"wrote {pdf_path}: {n} pages, {len(ctx.rendered)} system sentences, "
          f"sentence, block, table and page text check passed")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("out")
    ap.add_argument("--annotate", action="store_true", help="tag each block with its kind")
    ap.add_argument("--issued", type=int, choices=sorted(SAMPLE_ISSUES),
                    help="render as the issued sample version N (review D1)")
    a = ap.parse_args()
    render(a.template, a.out, a.annotate, issued=a.issued)


if __name__ == "__main__":
    main()
