"""Report rendering pipeline of the mockup.

clinic template record (JSON)  ->  ordered blocks  ->  HTML (Jinja2)  ->  PDF (Chromium)
                                                    ->  running header and footer (overlay)

A clinic template record lists blocks by reference: device blocks (rendered here from the
computed results and the fixed sentence library, not editable), clinic blocks (the clinic's own
texts and images with placeholders) and clinician blocks (filled per report in the editor; here
placeholder text). The record also names a theme: fonts, colours, sizes, a cover page, a running
header and a clinic footer. Figure colours are not part of the theme.

The PDF is made in two passes: the body (cover page without margins, then the result pages with
the theme margins), then one overlay page per body page with the running header (from page 2),
the clinic footer and the device footer line ("Mockup, synthetic data", versions, page number).
A table of contents, if the cover has one, is filled from the page numbers of the first pass.

Build checks before a PDF is written: the template schema, the forbidden-word lists, and that
every printed system sentence belongs to a block present in the template (a summary entry needs
the block that shows its value, a comparison sentence needs the comparison block). After the
body PDF is made, every body page must carry body text (`mockup/checks/page_text.py`, pdftotext
per page), so a page with only the running header and the footers fails the build.

Night round of 29 October: device blocks "method" (Method and norms, TG10), "freq.markers"
(frequency markers, core to confirm) and "erp.checklist" (checklist over channel ERPs, core to
confirm), a structured anamnesis (clinician block with "fields") and a clinician form
(clinician block "form" with clinic-defined rows, TG6), reproducibility rows in the versions
block, and a comparison over every measurement of the case ("measurements": "all").

Usage:
  python3 -m mockup.render <clinic_template.json> <out.pdf> [--annotate]
"""

import argparse
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

# Blocks every template must contain (mockup assumptions M23 and C4 of the review).
REQUIRED_BLOCKS = ("versions", "summary", "quality", "limits", "issued")
# Device blocks that show results; a clinician comment may follow only one of these (M29).
RESULT_BLOCKS = ("spectra.maps", "spectra.grid", "spectra.maps1hz", "ratios", "asymmetry",
                 "coherence", "erp.channel", "vcpt.behaviour", "comparison", "raw.excerpt",
                 "freq.markers", "erp.checklist")

# The block a system sentence belongs to: it may be printed only when that block is present.
SENTENCE_BLOCK = [
    (r"^SUM-", "summary"), (r"^(Q|MK)-", "quality"), (r"^(SP|APF)-", "spectra.maps"),
    (r"^(TBR|FAA)-", "ratios"), (r"^ASY-", "asymmetry"), (r"^COH-", "coherence"),
    (r"^ERPCL-", "erp.checklist"), (r"^FM-", "freq.markers"), (r"^MET-", "method"),
    (r"^ERP-", "erp.channel"), (r"^BEH-", "vcpt.behaviour"), (r"^CMP-", "comparison"),
    (r"^L-(REPROC|SIDE|IMPORT)-", "comparison"), (r"^L-", "limits"),
]
# The block that shows the values of a summary family (textlib.FAMILY).
FAMILY_BLOCK = {"band": "spectra.maps", "maps1hz": "spectra.maps1hz", "indices": "ratios",
                "asym": "asymmetry", "coh": "coherence", "erp": "erp.channel",
                "vcpt": "vcpt.behaviour"}
DEFAULT_CONDITIONS = {"spectra.maps": ["EO", "EC"], "spectra.maps1hz": ["EO", "EC"],
                      "asymmetry": ["EO", "EC"], "coherence": ["EO", "EC"]}


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
    def __init__(self, case, tpl, annotate, toc_pages=None):
        self.case = case
        self.tpl = tpl
        self.theme = {**THEME_DEFAULTS, **tpl.get("theme", {})}
        self.lang = tpl["language"]
        self.t = L[self.lang]
        self.annotate = annotate
        # the current measurement is named by the case (M1 is measurements[0], the current M2
        # measurements[1], the earliest M0, uploaded later, measurements[2])
        ms = case["measurements"]
        self.current = ms[case.get("current_index", len(ms) - 1)]
        before = sorted([m for m in ms if m["date"] < self.current["date"]], key=lambda m: m["date"])
        refs = [b.get("ref") for b in tpl["blocks"] if b["kind"] == "device"]
        self.has_comparison = "comparison" in refs
        # earlier: the measurement just before the current one (overlays and pair sentences);
        # compared: every measurement the comparison block shows, oldest first
        self.earlier = before[-1] if self.has_comparison and before else None
        cmp_params = next((b.get("params", {}) for b in tpl["blocks"]
                           if b["kind"] == "device" and b["ref"] == "comparison"), {})
        if not self.earlier:
            self.compared = []
        elif cmp_params.get("measurements") == "all":
            self.compared = before + [self.current]
        else:
            self.compared = [self.earlier, self.current]
        self.inputs = case.get("report_inputs") or {}
        # The report id belongs to the case and the measurement, not to the clinic template:
        # "R-" + case code + "-" + measurement date as MMDD (textlib.report_id), as in the
        # prototype; the template gives version and status only.
        self.report = {"version": 1, "status": "draft", **tpl.get("report", {}),
                       "id": tl.report_id(case["case_code"], self.current["date"])}
        self.rendered = []          # (sentence, block that printed it)
        self.tables = set()         # (table, condition, band, row) printed, for table references
        self.block = None
        self.sec = 0
        self.fig = 0
        self.toc = []               # headings of numbered sections, in order
        self.toc_pages = toc_pages or {}

    def say(self, items):
        out = []
        for s in items:
            self.rendered.append((s, self.block))
            out.append(f'<p class="sys">{esc(s["text"])}<span class="sid">{esc(s["id"])}</span></p>')
        return "\n".join(out)

    def cond_label(self, cond):
        return self.t["cond_eo"] if cond == "EO" else self.t["cond_ec"]

    def heading(self, key, numbered=True):
        text = self.t[key]
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


def wrap(ctx, kind, ref, inner, title=None, cls=""):
    tag = ""
    if ctx.annotate:
        label = {"device": ctx.t["block_device"], "clinic": ctx.t["block_clinic"],
                 "clinician": ctx.t["block_clinician"]}[kind]
        tag = f'<div class="blocktag {kind}">{esc(label)} · {esc(ref)}</div>'
    head = f"<h2>{esc(title)}</h2>" if title else ""
    return f'<section class="block {kind} {cls}" data-ref="{esc(ref)}">{tag}{head}{inner}</section>'


def certnote(ctx):
    """Japanese pages: the summary and VCPT sentences may need a separate approval."""
    if ctx.tpl.get("later_market") and ctx.t.get("subject_cert"):
        return f'<div class="certnote">{esc(ctx.t["subject_cert"])}</div>'
    return ""


def label_band(lang):
    def f(b, lohi):
        return f'{tl.BAND[lang][b]} {lohi["lo"]:g}-{lohi["hi"]:g} Hz'
    return f


def fig(svg, cls="fig"):
    return f'<div class="{cls}">{svg}</div>'


# ---------------------------------------------------------------------------------------------
# Device blocks
# ---------------------------------------------------------------------------------------------

def status_text(ctx):
    return ctx.t["issued"] if ctx.report["status"] == "issued" else ctx.t["draft"]


def d_versions(ctx, p):
    t, m, r = ctx.t, ctx.current, ctx.report
    pw = m["processed_with"]
    rows = [(t["software"], pw["software"]),
            (t["norms"], tl.product(pw["norms"], ctx.lang)),
            (t["system"], system_label(m.get("recording_system", ""), ctx.lang)),
            (t["report_id"], f'{report_label(r)} · {status_text(ctx)}')]
    if pw.get("input_sha256"):
        # reproducibility rows (shared document 3.8, review D6) and the UDI placeholder
        rows += [(t["udi"], t["udi_text"]),
                 (t["pipeline"], pw["pipeline"]),
                 (t["input_sha"], f'{pw["input_sha256"]} ({t["input_synthetic"]})'),
                 (t["ica_seed"], str(pw["ica_seed"])),
                 (t["processed_at"], t["processed_fmt"].format(
                     d=tl.fmt_date(pw["processed_at"][:10], ctx.lang), tm=pw["processed_at"][11:16],
                     s=pw["processing_s"]))]
    body = "".join(f"<tr><th>{esc(a)}</th><td>{esc(b)}</td></tr>" for a, b in rows if b)
    return wrap(ctx, "device", "versions@1", f'<table class="kv">{body}</table>',
                cls="compact versions")


def d_summary(ctx, p):
    inner = certnote(ctx) + ctx.say(tl.summary_sentences(ctx.case, ctx.current, ctx.lang))
    return wrap(ctx, "device", "summary@1", inner, ctx.heading("summary"))


def d_quality(ctx, p):
    inner = ctx.say(tl.quality_sentences(ctx.current, ctx.lang)
                    + tl.confirmation_sentences(ctx.current, ctx.lang))
    return wrap(ctx, "device", "quality@1", inner, ctx.heading("quality"))


def d_spectra_maps(ctx, p):
    t, lang = ctx.t, ctx.lang
    parts = []
    relative = p.get("relative", True)
    for cond in p.get("conditions", ["EO", "EC"]):
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
    parts.append(fig(fg.colourbar_svg(t["zbar"]), "fig scale"))
    parts.append(f'<p class="legend">{esc(t["rings"])}</p>')
    return wrap(ctx, "device", "spectra.maps@1", "\n".join(parts), ctx.heading("spectra"))


def d_spectra_grid(ctx, p):
    parts = []
    overlay = p.get("overlay_earlier") and ctx.earlier
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(ctx.figlabel(f'{ctx.t["spectra_grid"]}, {ctx.cond_label(cond)}'))
        parts.append(fig(fg.spectra_grid_svg(ctx.case, ctx.current, cond,
                                             earlier=ctx.earlier if overlay else None,
                                             xlabel=ctx.t["hz"]), "fig grid") + "</div>")
    legend = ctx.t["spectra_legend"]
    if not overlay:
        legend = legend.rsplit(".", 2)[0] + "."
    parts.append(f'<p class="legend">{esc(legend)}</p>')
    return wrap(ctx, "device", "spectra.grid@1", "\n".join(parts), ctx.heading("spectra_grid"))


def d_maps_1hz(ctx, p):
    parts = []
    for cond in p.get("conditions", ["EC"]):
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(ctx.figlabel(f'{ctx.t["maps_1hz"]}, {ctx.cond_label(cond)}'))
        parts.append(fig(fg.maps_1hz_svg(ctx.case, ctx.current, cond)) + "</div>")
    parts.append(fig(fg.colourbar_svg(ctx.t["zbar"]), "fig scale"))
    parts.append(f'<p class="legend">{esc(ctx.t["rings"])}</p>')
    return wrap(ctx, "device", "spectra.maps1hz@1", "\n".join(parts), ctx.heading("maps_1hz"))


def d_ratios(ctx, p):
    t, m, lang = ctx.t, ctx.current, ctx.lang
    rows = []
    for cond in ("EO", "EC"):
        c = m["spectra"]["conditions"][cond]
        for lab, k, v, nd in ((t["tbr"], "tbr", c["tbr"]["value"], 2),
                              (t["faa"], "faa", c["faa"]["value"], 2),
                              (t["apf"], "alpha_peak", c["alpha_peak"]["hz"], 1)):
            rows.append(f'<tr><td>{esc(lab)}</td><td>{esc(ctx.cond_label(cond))}</td>'
                        f'<td class="num">{tl.num(v, nd, lang)}</td>'
                        f'<td class="num">{tl.num(c[k]["norm_mean"], nd, lang)}</td>'
                        f'{zcell(lang, c[k]["z"], c[k].get("marked"))}</tr>')
    head = (f'<tr><th>{esc(t["ratio"])}</th><th></th><th>{esc(t["value"])}</th>'
            f'<th>{esc(t["norm_mean"])}</th><th>z</th></tr>')
    inner = f'<table class="grid">{head}{"".join(rows)}</table>' + zlegend(ctx)
    inner += ctx.say([s for cond in ("EO", "EC") for s in tl.ratio_sentences(m, cond, lang)])
    return wrap(ctx, "device", "ratios@1", inner, ctx.heading("ratios"))


def d_asymmetry(ctx, p):
    parts = []
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(fig(fg.asymmetry_svg(ctx.case, ctx.current, cond,
                                          label_fn=label_band(ctx.lang))) + "</div>")
        parts.append(ctx.say(tl.asymmetry_sentences(ctx.current, cond, ctx.lang)))
    parts.append(fig(fg.colourbar_svg(ctx.t["zbar"]), "fig scale"))
    parts.append(f'<p class="legend">{esc(ctx.t["asym_legend"])} {esc(ctx.t["rings"])}</p>')
    return wrap(ctx, "device", "asymmetry@1", "\n".join(parts), ctx.heading("asymmetry"))


def coh_pair_table(ctx, cond, per_row=10):
    """Compact table of the marked coherence pairs of one condition, grouped by band (pair,
    value, z), largest |z| first within a band. The coherence sentences point at it."""
    t, lang = ctx.t, ctx.lang
    cols = []
    for b in tl.BAND[lang]:
        hits = sorted([x for x in ctx.current["coherence"][cond][b]["pairs"] if x["marked"]],
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
            ctx.tables.add(("coh_pairs", cond, b, x["pair"]))
    sep = "、" if lang == "ja" else ", "
    label = ctx.figlabel(f'{t["coh_pairs"]}{sep}{ctx.cond_label(cond)}', cls="figlabel tc")
    return f'<div class="keep">{label}{"".join(tables)}</div>'


def d_coherence(ctx, p):
    lang = ctx.lang
    parts = []
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<div class="keep"><h3>{esc(ctx.cond_label(cond))}</h3><div class="row">')
        for b in [x["name"] for x in ctx.case["bands"]]:
            lohi = next(x for x in ctx.case["bands"] if x["name"] == b)
            parts.append('<div class="cell">' + fg.coherence_svg(
                ctx.case, ctx.current, cond, b, title=label_band(lang)(b, lohi)) + "</div>")
        parts.append("</div></div>")
        parts.append(ctx.say(tl.coherence_sentences(ctx.current, cond, lang, with_refs=True)))
        parts.append(coh_pair_table(ctx, cond))
    conds = p.get("conditions", ["EO", "EC"])
    if p.get("global", True):
        # one table for both conditions (global coherence: core, to confirm)
        heads = "".join(f"<th>{esc(tl.BAND[lang][b])}</th>" for b in tl.BAND[lang])
        rows = []
        for cond in conds:
            g = ctx.current["coherence"][cond]
            cells = "".join(f'<td class="num">{tl.num(g[b]["global"]["value"], 2, lang)}</td>'
                            for b in tl.BAND[lang])
            zs = "".join(zcell(lang, g[b]["global"]["z"], g[b]["global"].get("marked"))
                         for b in tl.BAND[lang])
            sep = "、" if lang == "ja" else ", "
            rows.append(f'<tr><td>{esc(ctx.cond_label(cond))}{sep}{esc(ctx.t["value"])}</td>{cells}</tr>'
                        f'<tr><td>{esc(ctx.cond_label(cond))}{sep}z</td>{zs}</tr>')
        gtable = (f'<div class="confirm">{esc(ctx.t["global_coh"])}</div>'
                  f'<table class="grid small"><tr><th></th>{heads}</tr>{"".join(rows)}</table>')
    else:
        gtable = ""
    # the global table and the colour scale of the lines side by side, to keep the block compact
    parts.append(f'<div class="row keep cohfoot"><div class="cell">{gtable}</div>'
                 f'<div class="cell scalecell">'
                 f'{fig(fg.colourbar_svg(ctx.t["zbar"], width=2.6), "fig scale slim")}</div></div>')
    parts.append(f'<p class="legend">{esc(ctx.t["coh_legend"])} {esc(ctx.t["z_marked"])} '
                 f'{esc(ctx.t["global_coh_note"])}</p>')
    return wrap(ctx, "device", "coherence@1", "\n".join(parts), ctx.heading("coherence"))


def d_erp(ctx, p):
    t, lang = ctx.t, ctx.lang
    overlay = p.get("overlay_earlier") and ctx.earlier
    parts = []
    for cond in p.get("trials", ["go", "nogo"]):
        parts.append('<div class="keep">' + ctx.figlabel(f'{t["erp"]}: {tl.TRIAL[lang][cond]}'))
        parts.append(fig(fg.erp_grid_svg(ctx.case, ctx.current, cond,
                                         earlier=ctx.earlier if overlay else None,
                                         xlabel=t["erp_x"], ylabel=t["erp_y"])) + "</div>")
    legend = t["erp_legend"] + " " + t["rings"]
    if overlay:
        legend += " " + t["earlier_line"] + "."
    parts.append(f'<p class="legend">{esc(legend)}</p>')
    rows = []
    for pk in ctx.current["erp"]["peaks"]:
        lat = (f'{pk["latency_ms"]}' if pk["latency_ms"] is not None
               else fmt_window(pk.get("window_ms", ""), lang))
        rows.append(f'<tr><td>{esc(pk["component"])}</td><td>{esc(tl.TRIAL[lang][pk["condition"]])}</td>'
                    f'<td>{esc(pk["site"])}</td><td class="num">{tl.num(pk["amplitude_uv"], 1, lang)}</td>'
                    f'{zcell(lang, pk["amplitude_z"], pk.get("amplitude_marked"))}'
                    f'<td class="num">{esc(lat)}</td>'
                    f'{zcell(lang, pk["latency_z"], pk.get("latency_marked"))}</tr>')
    head = (f'<tr><th>{esc(t["component"])}</th><th>{esc(t["trial"])}</th><th>{esc(t["site"])}</th>'
            f'<th>{esc(t["amplitude"])}</th><th>z</th><th>{esc(t["latency"])}</th><th>z</th></tr>')
    parts.append('<div class="keep">' + ctx.figlabel(t["erp_peaks"])
                 + f'<table class="grid">{head}{"".join(rows)}</table>' + zlegend(ctx) + '</div>')
    parts.append(ctx.say(tl.erp_peak_confirmation(ctx.current, lang)
                         + tl.erp_sentences(ctx.current, lang)))
    return wrap(ctx, "device", "erp.channel@1", "\n".join(parts), ctx.heading("erp"))


def d_vcpt(ctx, p):
    t, v, lang = ctx.t, ctx.current["vcpt"], ctx.lang
    rows = []
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = v[key]
        pc = f'{int(m["percentile"] + 0.5)}' if m["percentile"] < 99.5 else ">99"
        rows.append(f'<tr><td>{esc(tl.VCPT_MEASURE[lang][key])}</td>'
                    f'<td class="num">{m["value"]}{tl.UNIT[key]}</td><td class="num">{pc}</td>'
                    f'{zcell(lang, m["z"], m.get("marked"))}</tr>')
    head = (f'<tr><th>{esc(t["measure"])}</th><th>{esc(t["value"])}</th>'
            f'<th>{esc(t["percentile"])}</th><th>z</th></tr>')
    inner = certnote(ctx)
    inner += (f'<div class="row"><div class="cell"><table class="grid">{head}{"".join(rows)}</table>'
              + zlegend(ctx) + '</div>')
    inner += ('<div class="cell">' + ctx.figlabel(t["errors_block"])
              + fg.errors_per_block_svg(ctx.current, xlabel=t["errors_x"], ylabel=t["errors_y"])
              + "</div></div>")
    inner += ctx.say(tl.behaviour_sentences(ctx.current, lang))
    return wrap(ctx, "device", "vcpt.behaviour@1", inner, ctx.heading("vcpt"))


def d_comparison(ctx, p):
    """Measurements side by side, each against its own age norm (3.4): the earlier and the
    current one, or with "measurements": "all" every measurement of the case, oldest first
    (review B5, TG8)."""
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
    for cond in ("EO", "EC"):
        for k, lab, nd in (("tbr", t["tbr"], 2), ("alpha_peak", t["apf"], 1)):
            cells = ""
            for m in ms:
                c = m["spectra"]["conditions"][cond]
                v = c[k]["value"] if k == "tbr" else c[k]["hz"]
                cells += (f'<td class="num">{tl.num(v, nd, lang)}</td>'
                          f'{zcell(lang, c[k]["z"], c[k].get("marked"))}')
            rows.append(f'<tr><td>{esc(lab)}, {esc(ctx.cond_label(cond))}</td>{cells}</tr>')
    inner = f'<table class="grid">{head}{"".join(rows)}</table>' + zlegend(ctx)
    maps = []
    for m in ms:
        lab = t["current"] if m is ctx.current else t["earlier"]
        maps.append('<div class="cell">' + ctx.figlabel(
            f'{lab} {tl.fmt_date(m["date"], lang)}: {t["maps_abs"]}, {t["cond_ec"]}')
            + fg.band_maps_svg(ctx.case, m, "EC", "abs_z",
                               bands=["delta", "theta", "alpha", "beta1"],
                               label_fn=label_band(lang)) + "</div>")
    if len(ms) == 2:
        inner += '<div class="row keep">' + "".join(maps) + "</div>"
    else:
        inner += '<div class="keep cmpmaps">' + "".join(
            f'<div class="row">{x}</div>' for x in maps) + "</div>"
    inner += f'<p class="legend">{esc(t["rings"])}</p>'
    if len(ms) == 2:
        inner += ctx.say(tl.comparison_sentences(ctx.case, ms[1], ms[0], lang))
    else:
        inner += ctx.say(tl.comparison_n_sentences(ctx.case, ms, lang))
    notes = [s_ for m in ms[:-1] if m["processed_with"].get("reprocessed")
             for s_ in tl.limits_sentences(lang, m) if s_["id"] == "L-REPROC-1"]
    notes += [tl.say("L-SIDE-1", lang)] + tl.import_sentences(ms, lang)
    inner += ctx.say(notes)
    return wrap(ctx, "device", "comparison@1", inner, ctx.heading("comparison"))


def d_limits(ctx, p):
    inner = ctx.say(tl.limits_sentences(ctx.lang, None))
    return wrap(ctx, "device", "limits@1", inner, ctx.heading("limits"))


def d_raw(ctx, p):
    """Short raw EEG excerpts of the analysed segments, eyes open and eyes closed (synthetic)."""
    conds = p.get("conditions", ["EO", "EC"])
    seconds = p.get("seconds", 4)
    syn = ctx.t["synthetic"]
    titles = [f"{ctx.cond_label(c)}（{syn}）" if ctx.lang == "ja" else f"{ctx.cond_label(c)} ({syn})"
              for c in conds]
    inner = ('<div class="keep">'
             + fig(fg.raw_excerpts_svg(ctx.case, ctx.current, conds, titles=titles,
                                       seconds=seconds, height=p.get("height_in", 3.4)), "fig raw")
             + f'<p class="legend">{esc(ctx.t["raw_legend"].format(s=seconds))}</p></div>')
    return wrap(ctx, "device", "raw.excerpt@1", inner, ctx.heading("raw"))


def d_method(ctx, p):
    """Method and norms (template gap TG10, review D5): fixed sentences over the method facts and
    the recording conditions documented at upload."""
    t, m, lang = ctx.t, ctx.current, ctx.lang
    inner = ctx.say(tl.method_sentences(m, lang))
    rc = m.get("recording_conditions") or {}
    keys = ("time_of_day", "medication_on_day", "sleep_before", "drowsiness_observed")
    if p.get("recording_conditions", True) and rc:
        def val(k):
            v = rc.get(k)
            if v is None:
                return t["rcv_not_documented"]
            return v if k == "time_of_day" else t[f"rcv_{v}"]
        body = "".join(f"<tr><th>{esc(t['rc_' + k])}</th><td>{esc(val(k))}</td></tr>" for k in keys)
        inner += (f'<div class="keep"><div class="figlabel">{esc(t["rc_title"])}</div>'
                  f'<table class="kv rc">{body}</table></div>')
    return wrap(ctx, "device", "method@1", inner, ctx.heading("method"))


def d_freq_markers(ctx, p):
    """Frequency markers (3.3 "Core, to confirm"; review B3): the suggested peaks with the
    clinician's confirmed choices, as a table (TG4) with one head map per marker."""
    t, m, lang = ctx.t, ctx.current, ctx.lang
    inputs = ctx.inputs.get("freq_markers") if ctx.inputs.get("measurement") == m["id"] else {}
    rows = tl.freq_marker_rows(m, inputs)
    conds = [c for c in p.get("conditions", ["EO", "EC"]) if c in rows]
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
    confirm = f'<div class="confirm">{esc(t["fm_confirm"])}</div>'
    if trs:
        head = (f'<tr><th>{esc(t["fm_no"])}</th><th></th><th>{esc(t["site"])}</th>'
                f'<th>{esc(t["fm_freq"])}</th><th>z</th><th>{esc(t["fm_question"])}</th>'
                f'<th>{esc(t["fm_choice"])}</th></tr>')
        # the "to confirm" note stays with the table, so the heading never ends a page alone
        inner = (f'<div class="keep">{confirm}{ctx.figlabel(t["freq_markers"])}'
                 f'<table class="grid">{head}{"".join(trs)}</table>{zlegend(ctx)}')
        heads = []
        for cond in conds:
            if rows[cond]:
                sep = "、" if lang == "ja" else ", "
                heads.append('<div class="cell">' + ctx.figlabel(
                    f'{t["fm_maps"]}{sep}{ctx.cond_label(cond)}')
                    + fg.marker_maps_svg(ctx.case, m, rows[cond]) + "</div>")
        # table, head maps and their legend stay together on one page
        inner += f'<div class="row">{"".join(heads)}</div>'
        inner += f'<p class="legend">{esc(t["fm_legend"])}</p></div>'
    else:
        inner = confirm + f'<p class="legend">{esc(t["fm_none"])}</p>'
    inner += ctx.say(tl.freq_marker_sentences(m, inputs, lang, conds))
    return wrap(ctx, "device", "freq.markers@1", inner, ctx.heading("freq_markers"))


def d_erp_checklist(ctx, p):
    """Checklist over channel ERPs (3.3 "Core, to confirm", a proposal for the clinical lead;
    review B3): the clinician's ticks per scored component, as a table, and the sentences."""
    t, lang = ctx.t, ctx.lang
    inputs = (ctx.inputs.get("erp_checklist") if ctx.inputs.get("measurement") == ctx.current["id"]
              else {}) or {}
    ticks = inputs.get("ticks", {}) if inputs.get("completed") else {}
    items = tl.CHECKLIST_ITEMS
    head = (f'<tr><th>{esc(t["component"])}</th><th>{esc(t["trial"])}</th><th>{esc(t["site"])}</th>'
            f'<th>{esc(t["cl_window"])}</th>'
            + "".join(f'<th class="tc">{esc(t["cl_head_" + i])}</th>' for i in items) + "</tr>")
    trs = []
    for r in tl.checklist_rows():
        cells = "".join(
            f'<td class="tc">{"✓" if i in ticks.get(r["id"], []) else ""}</td>' if i in r["items"]
            else '<td class="tc muted">-</td>' for i in items)
        w = t["range"].format(a=r["window_ms"][0], b=r["window_ms"][1])
        trs.append(f'<tr><td>{esc(r["component"])}</td><td>{esc(tl.TRIAL[lang][r["trial"]])}</td>'
                   f'<td>{esc(r["site"])}</td><td class="num">{esc(w)}</td>{cells}</tr>')
    inner = (f'<div class="keep"><div class="confirm">{esc(t["cl_confirm"])}</div>'
             f'<table class="grid small checklist">{head}{"".join(trs)}</table>'
             f'<p class="legend">{esc(t["cl_legend"])}</p></div>')
    inner += ctx.say(tl.checklist_sentences(inputs, lang))
    return wrap(ctx, "device", "erp.checklist@1", inner, ctx.heading("erp_checklist"))


def d_issued(ctx, p):
    """Required block: who issued the report, when, and which version it replaces."""
    t, r = ctx.t, ctx.report
    if r["status"] == "issued":
        who, when = r.get("issued_by", ""), tl.fmt_date(r["issued_on"], ctx.lang)
    else:
        who = when = f'________________  ({t["on_issue"]})'
    rep = r.get("replaces")
    replaces = (t["replaces_v"].format(v=rep["version"], reason=rep["reason"]) if rep
                else t["replaces_none"])
    rows = [(t["issuer"], who), (t["issue_date"], when),
            (t["version"], f'{r["version"]} · {status_text(ctx)}'), (t["replaces"], replaces)]
    body = "".join(f"<tr><th>{esc(a)}</th><td>{esc(b)}</td></tr>" for a, b in rows)
    return wrap(ctx, "device", "issued@1", f'<table class="kv issued">{body}</table>',
                ctx.heading("issued_block", numbered=False), cls="issued-block")


DEVICE = {
    "versions": d_versions, "summary": d_summary, "quality": d_quality,
    "spectra.maps": d_spectra_maps, "spectra.grid": d_spectra_grid, "spectra.maps1hz": d_maps_1hz,
    "ratios": d_ratios, "asymmetry": d_asymmetry, "coherence": d_coherence,
    "erp.channel": d_erp, "vcpt.behaviour": d_vcpt, "comparison": d_comparison,
    "limits": d_limits, "raw.excerpt": d_raw, "issued": d_issued,
    "method": d_method, "freq.markers": d_freq_markers, "erp.checklist": d_erp_checklist,
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
        "earlier_date": tl.list_join([tl.fmt_date(x["date"], ctx.lang)
                                      for x in (ctx.compared[:-1] or [ctx.case["measurements"][0]])],
                                     ctx.lang),
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
    filled per report by the clinician; dates and yes or no only, no free text."""
    t, lang = ctx.t, ctx.lang
    vals = (ctx.inputs.get("clinician_form") if ctx.inputs.get("measurement") == ctx.current["id"]
            else {}) or {}
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
    t = ctx.t
    label = p.get("label", "comment")
    if label == "form":
        return k_form(ctx, p)
    is_comment = label == "comment"
    if p.get("fields"):
        # structured anamnesis (open question I5): the fields as the clinician filled them in
        # the report editor; free text from the separate identity store (3.6)
        anam = ctx.case["identity_store"].get("anamnesis") or {}
        title = ctx.heading("anamnesis_block")
        rows = []
        for f in p["fields"]:
            v = (anam.get(f) or {}).get(ctx.lang) or ""
            cls = "fval" if v else "fval empty"
            rows.append(f'<div class="fld"><div class="flabel">{esc(t["anam_" + f])}</div>'
                        f'<div class="{cls}">{esc(v or t["clinician_placeholder"])}</div></div>')
        inner = f'<div class="clin fields">{"".join(rows)}</div>'
        return wrap(ctx, "clinician", p.get("ref", label), inner, title)
    title = ctx.heading(label, numbered=not is_comment)
    inner = f'<div class="clin">{esc(p.get("text") or t["clinician_placeholder"])}</div>'
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
            ctx.block = b["ref"]
            html_b = DEVICE[b["ref"]](ctx, b.get("params", {}))
            ctx.block = None
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


def validate_template(tpl):
    errors = []
    for k in ("clinic_name", "language", "theme", "blocks"):
        if k not in tpl:
            errors.append(f"missing {k}")
    if tpl.get("language") not in tl.LANGS:
        errors.append("language not supported")
    blocks = tpl.get("blocks", [])
    refs = [b.get("ref") for b in blocks if b["kind"] == "device"]
    for req in REQUIRED_BLOCKS:
        if req not in refs:
            errors.append(f"required device block {req} missing")
    prev = None
    for i, b in enumerate(blocks):
        if b["kind"] == "device" and b["ref"] not in DEVICE:
            errors.append(f"block {i}: unknown device block {b['ref']}")
        if b["kind"] == "clinic" and b.get("type") not in CLINIC:
            errors.append(f"block {i}: unknown clinic block type")
        if b["kind"] == "clinician" and b.get("label", "comment") == "comment":
            if not (prev and prev["kind"] == "device" and prev["ref"] in RESULT_BLOCKS):
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
    present = {b["ref"]: b.get("params", {}) for b in ctx.tpl["blocks"] if b["kind"] == "device"}
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

def build_html(tpl, annotate=False, case=None, toc_pages=None):
    case = case or load_case()
    ctx = Ctx(case, tpl, annotate, toc_pages)
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
    clinic footer, and the device footer line on every page."""
    th, t, r, m = ctx.theme, ctx.t, ctx.report, ctx.current
    ml, mr = th["margins_mm"][3], th["margins_mm"][1]
    rh = ctx.tpl.get("running_header") or {}
    cf = ctx.tpl.get("clinic_footer") or {}
    pv = placeholder_values(ctx)
    slot = {
        "title": esc(t["report_title"]), "clinic": esc(ctx.tpl["clinic_name"]),
        "patient": esc(f'{pv["name"]} · {pv["birth_date"]}'), "": "",
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
                return f"#{i}" if v == "page_hash" else slot.get(v, esc(v))
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
.cf {{ position: absolute; display: flex; align-items: center; gap: 4mm; font-size: 7pt;
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


def render(tpl_path, pdf_path, annotate=False, keep_html=True):
    tpl = json.loads(Path(tpl_path).read_text())
    checks = validate_template(tpl)
    for w in (e for e in checks if e.startswith("warning")):
        print(w, file=sys.stderr)
    errs = [e for e in checks if not e.startswith("warning")]
    if errs:
        sys.exit(f"template invalid: {errs}")
    page, ctx = build_html(tpl, annotate)
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
            page, ctx = build_html(tpl, annotate, toc_pages=pages)
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
    a = ap.parse_args()
    render(a.template, a.out, a.annotate)


if __name__ == "__main__":
    main()
