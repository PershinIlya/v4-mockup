"""Report rendering pipeline of the mockup.

clinic template record (JSON)  ->  ordered blocks  ->  HTML (Jinja2)  ->  PDF (Chromium)

A clinic template record lists blocks by reference: device blocks (rendered here from the
computed results and the fixed sentence library, not editable), clinic blocks (the clinic's own
texts and images with placeholders) and clinician blocks (filled per report in the editor; here
placeholder text). The record also names a theme: fonts, colours, sizes, header and footer.
Figure colours are not part of the theme.

Usage:
  python3 -m mockup.render <clinic_template.json> <out.pdf> [--annotate] [--pages N]
"""

import argparse
import html
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from . import figures as fg
from . import textlib as tl
from .i18n import L

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
CASE_PATH = REPO / "data" / "synthetic" / "case_mock042.json"


# ---------------------------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------------------------

def esc(s):
    return html.escape(str(s))


def sentences_html(items):
    out = []
    for s in items:
        out.append(f'<p class="sys">{esc(s["text"])}<span class="sid">{esc(s["id"])}</span></p>')
    return "\n".join(out)


def zcell(z):
    """Table cell for a z value; the cell tint follows the fixed device colour scale."""
    if z is None:
        return '<td class="num"></td>'
    zc = max(-3, min(3, z))
    rgba = fg.Z_CMAP((zc + 3) / 6)
    bg = "#%02x%02x%02x" % tuple(int(255 * c) for c in rgba[:3])
    ink = "#ffffff" if abs(z) >= 2.5 else "#1f1f1e"
    return f'<td class="num z" style="background:{bg};color:{ink}">{z:.1f}</td>'


def age_on(birth_iso, on_iso):
    b, d = date.fromisoformat(birth_iso), date.fromisoformat(on_iso)
    return d.year - b.year - ((d.month, d.day) < (b.month, b.day))


class Ctx:
    def __init__(self, case, tpl, annotate):
        self.case = case
        self.tpl = tpl
        self.lang = tpl["language"]
        self.t = L[self.lang]
        self.annotate = annotate
        self.current = case["measurements"][-1]
        self.earlier = case["measurements"][0] if tpl.get("comparison", True) else None
        self.report = tpl.get("report", {"id": "R-MOCK-042-01", "version": 1, "status": "draft"})
        self.rendered_sentences = []

    def say(self, items):
        self.rendered_sentences.extend(items)
        return sentences_html(items)

    def cond_label(self, cond):
        return self.t["cond_eo"] if cond == "EO" else self.t["cond_ec"]


def wrap(ctx, kind, ref, inner, title=None, cls=""):
    tag = ""
    if ctx.annotate:
        label = {"device": ctx.t["block_device"], "clinic": ctx.t["block_clinic"],
                 "clinician": ctx.t["block_clinician"]}[kind]
        tag = f'<div class="blocktag {kind}">{esc(label)} · {esc(ref)}</div>'
    head = f"<h2>{esc(title)}</h2>" if title else ""
    return f'<section class="block {kind} {cls}" data-ref="{esc(ref)}">{tag}{head}{inner}</section>'


# ---------------------------------------------------------------------------------------------
# Device blocks
# ---------------------------------------------------------------------------------------------

def d_versions(ctx, p):
    t, m, r = ctx.t, ctx.current, ctx.report
    status = t["issued"] if r["status"] == "issued" else t["draft"]
    rows = [(t["software"], m["processed_with"]["software"]),
            (t["norms"], m["processed_with"]["norms"]),
            (t["report_id"], f'{r["id"]} · {t["version"]} {r["version"]} · {status}')]
    body = "".join(f"<tr><th>{esc(a)}</th><td>{esc(b)}</td></tr>" for a, b in rows)
    return wrap(ctx, "device", "versions@1", f'<table class="kv">{body}</table>',
                cls="compact")


def d_summary(ctx, p):
    inner = ctx.say(tl.summary_sentences(ctx.case, ctx.current, ctx.lang))
    return wrap(ctx, "device", "summary@1", inner, ctx.t["summary"])


def d_quality(ctx, p):
    inner = ctx.say(tl.quality_sentences(ctx.current, ctx.lang))
    return wrap(ctx, "device", "quality@1", inner, ctx.t["quality"])


def label_band(lang):
    def f(b, lohi):
        return f'{tl.BAND[lang][b]} {lohi["lo"]:g}-{lohi["hi"]:g} Hz'
    return f


def d_spectra_maps(ctx, p):
    t, lang = ctx.t, ctx.lang
    parts = []
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append(f'<div class="figlabel">{esc(t["maps_abs"])}</div>')
        parts.append('<div class="fig">' + fg.band_maps_svg(ctx.case, ctx.current, cond, "abs_z",
                                                            label_fn=label_band(lang)) + "</div>")
        if p.get("relative", True):
            parts.append(f'<div class="figlabel">{esc(t["maps_rel"])}</div>')
            parts.append('<div class="fig">' + fg.band_maps_svg(
                ctx.case, ctx.current, cond, "rel_z", label_fn=label_band(lang)) + "</div>")
        parts.append(ctx.say(tl.spectral_sentences(ctx.case, ctx.current, cond, lang)))
    parts.append('<div class="fig scale">' + fg.colourbar_svg(
        {"en": "z (deviation from the age norm, in standard deviations)",
         "de": "z (Abweichung von der Altersnorm in Standardabweichungen)",
         "ja": "z (deviation from the age norm, SD)"}[lang]) + "</div>")
    return wrap(ctx, "device", "spectra.maps@1", "\n".join(parts), t["spectra"])


def d_spectra_grid(ctx, p):
    parts = []
    for cond in p.get("conditions", ["EC"]):
        parts.append(f'<h3>{esc(ctx.t["spectra_grid"])}: {esc(ctx.cond_label(cond))}</h3>')
        parts.append('<div class="fig">' + fg.spectra_grid_svg(
            ctx.case, ctx.current, cond, earlier=ctx.earlier if p.get("overlay_earlier") else None)
            + "</div>")
    parts.append(f'<p class="legend">{esc(ctx.t["spectra_legend"])}</p>')
    return wrap(ctx, "device", "spectra.grid@1", "\n".join(parts))


def d_maps_1hz(ctx, p):
    parts = []
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<h3>{esc(ctx.t["maps_1hz"])}: {esc(ctx.cond_label(cond))}</h3>')
        parts.append('<div class="fig">' + fg.maps_1hz_svg(ctx.case, ctx.current, cond) + "</div>")
    return wrap(ctx, "device", "spectra.maps1hz@1", "\n".join(parts))


def d_ratios(ctx, p):
    t, m = ctx.t, ctx.current
    rows = []
    for cond in ("EO", "EC"):
        c = m["spectra"]["conditions"][cond]
        rows.append(f'<tr><td>{esc(t["tbr"])}</td><td>{esc(ctx.cond_label(cond))}</td>'
                    f'<td class="num">{c["tbr"]["value"]:.2f}</td>'
                    f'<td class="num">{c["tbr"]["norm_mean"]:.2f}</td>{zcell(c["tbr"]["z"])}</tr>')
        rows.append(f'<tr><td>{esc(t["faa"])}</td><td>{esc(ctx.cond_label(cond))}</td>'
                    f'<td class="num">{c["faa"]["value"]:.2f}</td>'
                    f'<td class="num">{c["faa"]["norm_mean"]:.2f}</td>{zcell(c["faa"]["z"])}</tr>')
        a = c["alpha_peak"]
        rows.append(f'<tr><td>{esc(t["apf"])}</td><td>{esc(ctx.cond_label(cond))}</td>'
                    f'<td class="num">{a["hz"]:.1f}</td><td class="num">{a["norm_mean"]:.1f}</td>'
                    f'{zcell(a["z"])}</tr>')
    head = (f'<tr><th>{esc(t["ratio"])}</th><th></th><th>{esc(t["value"])}</th>'
            f'<th>{esc(t["norm_mean"])}</th><th>z</th></tr>')
    inner = f'<table class="grid">{head}{"".join(rows)}</table>'
    inner += ctx.say([s for cond in ("EO", "EC") for s in tl.ratio_sentences(m, cond, ctx.lang)])
    return wrap(ctx, "device", "ratios@1", inner, t["ratios"])


def d_asymmetry(ctx, p):
    parts = []
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<h3>{esc(ctx.cond_label(cond))}</h3>')
        parts.append('<div class="fig">' + fg.asymmetry_svg(ctx.case, ctx.current, cond,
                                                             label_fn=label_band(ctx.lang)) + "</div>")
        parts.append(ctx.say(tl.asymmetry_sentences(ctx.current, cond, ctx.lang)))
    parts.append(f'<p class="legend">{esc(ctx.t["asym_legend"])}</p>')
    return wrap(ctx, "device", "asymmetry@1", "\n".join(parts), ctx.t["asymmetry"])


def d_coherence(ctx, p):
    parts = []
    for cond in p.get("conditions", ["EO", "EC"]):
        parts.append(f'<h3>{esc(ctx.cond_label(cond))}</h3><div class="row">')
        for b in [x["name"] for x in ctx.case["bands"]]:
            lohi = next(x for x in ctx.case["bands"] if x["name"] == b)
            parts.append('<div class="cell">' + fg.coherence_svg(
                ctx.case, ctx.current, cond, b, title=label_band(ctx.lang)(b, lohi)) + "</div>")
        parts.append("</div>")
        parts.append(ctx.say(tl.coherence_sentences(ctx.current, cond, ctx.lang)))
        if p.get("global", True):
            g = ctx.current["coherence"][cond]
            cells = "".join(f'<td class="num">{g[b]["global"]["value"]:.2f}</td>'
                            for b in tl.BAND[ctx.lang])
            heads = "".join(f"<th>{esc(tl.BAND[ctx.lang][b])}</th>" for b in tl.BAND[ctx.lang])
            parts.append(f'<div class="figlabel tc">{esc(ctx.t["global_coh"])}</div>'
                         f'<table class="grid small"><tr>{heads}</tr><tr>{cells}</tr></table>')
    parts.append('<div class="fig scale">' + fg.colourbar_svg(width=2.6) + "</div>")
    parts.append(f'<p class="legend">{esc(ctx.t["coh_legend"])}</p>')
    return wrap(ctx, "device", "coherence@1", "\n".join(parts), ctx.t["coherence"])


def d_erp(ctx, p):
    t = ctx.t
    parts = []
    for cond in p.get("trials", ["go", "nogo"]):
        parts.append(f'<h3>{esc(tl.TRIAL[ctx.lang][cond])}</h3>')
        parts.append('<div class="fig">' + fg.erp_grid_svg(ctx.case, ctx.current, cond) + "</div>")
    parts.append(f'<p class="legend">{esc(t["erp_legend"])}</p>')
    rows = []
    for pk in ctx.current["erp"]["peaks"]:
        lat = f'{pk["latency_ms"]}' if pk["latency_ms"] is not None else pk.get("window_ms", "")
        rows.append(f'<tr><td>{pk["component"]}</td><td>{esc(tl.TRIAL[ctx.lang][pk["condition"]])}</td>'
                    f'<td>{pk["site"]}</td><td class="num">{pk["amplitude_uv"]:.1f}</td>'
                    f'{zcell(pk["amplitude_z"])}<td class="num">{esc(lat)}</td>'
                    f'{zcell(pk["latency_z"])}</tr>')
    head = (f'<tr><th>{esc(t["component"])}</th><th>{esc(t["trial"])}</th><th>{esc(t["site"])}</th>'
            f'<th>{esc(t["amplitude"])}</th><th>z</th><th>{esc(t["latency"])}</th><th>z</th></tr>')
    parts.append(f'<div class="figlabel">{esc(t["erp_peaks"])}</div>'
                 f'<table class="grid">{head}{"".join(rows)}</table>')
    parts.append(ctx.say(tl.erp_sentences(ctx.current, ctx.lang)))
    return wrap(ctx, "device", "erp.channel@1", "\n".join(parts), t["erp"])


def d_vcpt(ctx, p):
    t, v = ctx.t, ctx.current["vcpt"]
    rows = []
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = v[key]
        pc = f'{m["percentile"]:.0f}' if m["percentile"] < 99.5 else ">99"
        rows.append(f'<tr><td>{esc(tl.VCPT_MEASURE[ctx.lang][key])}</td>'
                    f'<td class="num">{m["value"]}{tl.UNIT[key]}</td><td class="num">{pc}</td>'
                    f'{zcell(m["z"])}</tr>')
    head = (f'<tr><th>{esc(t["measure"])}</th><th>{esc(t["value"])}</th>'
            f'<th>{esc(t["percentile"])}</th><th>z</th></tr>')
    inner = f'<div class="row"><div class="cell"><table class="grid">{head}{"".join(rows)}</table></div>'
    inner += (f'<div class="cell"><div class="figlabel">{esc(t["errors_block"])}</div>'
              + fg.errors_per_block_svg(ctx.current) + "</div></div>")
    inner += ctx.say(tl.behaviour_sentences(ctx.current, ctx.lang))
    return wrap(ctx, "device", "vcpt.behaviour@1", inner, t["vcpt"])


def d_comparison(ctx, p):
    if not ctx.earlier:
        return ""
    t, lang = ctx.t, ctx.lang
    e, c = ctx.earlier, ctx.current
    head = (f'<tr><th>{esc(t["measure"])}</th><th>{esc(t["earlier"])} {esc(tl.fmt_date(e["date"], lang))}</th>'
            f'<th>z</th><th>{esc(t["current"])} {esc(tl.fmt_date(c["date"], lang))}</th><th>z</th></tr>')
    rows = []
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        a, b = e["vcpt"][key], c["vcpt"][key]
        rows.append(f'<tr><td>{esc(tl.VCPT_MEASURE[lang][key])}</td><td class="num">{a["value"]}</td>'
                    f'{zcell(a["z"])}<td class="num">{b["value"]}</td>{zcell(b["z"])}</tr>')
    for cond in ("EO", "EC"):
        a, b = e["spectra"]["conditions"][cond], c["spectra"]["conditions"][cond]
        for k, lab, fmt in (("tbr", t["tbr"], "{:.2f}"), ("alpha_peak", t["apf"], "{:.1f}")):
            va = a[k]["value"] if k == "tbr" else a[k]["hz"]
            vb = b[k]["value"] if k == "tbr" else b[k]["hz"]
            rows.append(f'<tr><td>{esc(lab)}, {esc(ctx.cond_label(cond))}</td>'
                        f'<td class="num">{fmt.format(va)}</td>{zcell(a[k]["z"])}'
                        f'<td class="num">{fmt.format(vb)}</td>{zcell(b[k]["z"])}</tr>')
    inner = f'<table class="grid">{head}{"".join(rows)}</table>'
    inner += '<div class="row">'
    for m, lab in ((e, t["earlier"]), (c, t["current"])):
        inner += (f'<div class="cell"><div class="figlabel">{esc(lab)} {esc(tl.fmt_date(m["date"], lang))}: '
                  f'{esc(t["maps_abs"])}, {esc(t["cond_ec"])}</div>'
                  + fg.band_maps_svg(ctx.case, m, "EC", "abs_z",
                                     bands=["delta", "theta", "alpha", "beta1"],
                                     label_fn=label_band(lang)) + "</div>")
    inner += "</div>"
    inner += ctx.say(tl.comparison_sentences(ctx.case, c, e, lang))
    return wrap(ctx, "device", "comparison@1", inner, t["comparison"])


def d_limits(ctx, p):
    inner = ctx.say(tl.limits_sentences(ctx.lang, ctx.earlier))
    return wrap(ctx, "device", "limits@1", inner, ctx.t["limits"])


def d_raw(ctx, p):
    cond = p.get("condition", "EC")
    inner = ('<div class="fig">' + fg.raw_excerpt_svg(ctx.case, ctx.current, cond, height=3.0)
             + f'</div><p class="legend">{esc(ctx.t["raw_legend"])}</p>')
    return wrap(ctx, "device", "raw.excerpt@1", inner,
                f'{ctx.t["raw"]}: {ctx.cond_label(cond)}')


DEVICE = {
    "versions": d_versions, "summary": d_summary, "quality": d_quality,
    "spectra.maps": d_spectra_maps, "spectra.grid": d_spectra_grid, "spectra.maps1hz": d_maps_1hz,
    "ratios": d_ratios, "asymmetry": d_asymmetry, "coherence": d_coherence,
    "erp.channel": d_erp, "vcpt.behaviour": d_vcpt, "comparison": d_comparison,
    "limits": d_limits, "raw.excerpt": d_raw,
}


# ---------------------------------------------------------------------------------------------
# Clinic and clinician blocks
# ---------------------------------------------------------------------------------------------

def fill_placeholders(ctx, text):
    ident = ctx.case["identity_store"]
    m = ctx.current
    values = {
        "name": ident["display_name"], "birth_date": tl.fmt_date(ident["birth_date"], ctx.lang),
        "age": str(age_on(ident["birth_date"], m["date"])), "sex": ctx.t[ctx.case["sex"]],
        "recording_date": tl.fmt_date(m["date"], ctx.lang), "case_code": ctx.case["case_code"],
        "clinic_name": ctx.tpl["clinic_name"],
    }
    return re.sub(r"\{(\w+)\}", lambda mm: esc(values.get(mm.group(1), mm.group(0))), text)


def c_header(ctx, p):
    t = ctx.t
    logo = (f'<div class="logo">{esc(p.get("logo_text", "LOGO"))}</div>')
    lines = "".join(f"<div>{fill_placeholders(ctx, esc(x))}</div>" for x in p.get("lines", []))
    title = esc(p.get("title", t["report_title"]))
    ident = [(t["patient"], "{name}"), (t["birth"], "{birth_date}"),
             (t["age"], "{age} " + t["years"]), (t["sex"], "{sex}"),
             (t["recorded"], "{recording_date}"), (t["code"], "{case_code}")]
    rows = "".join(f'<div class="idc"><span class="k">{esc(a)}</span>'
                   f'<span class="v">{fill_placeholders(ctx, esc(b))}</span></div>' for a, b in ident)
    inner = (f'<div class="hdr">{logo}<div class="hdrtext"><div class="clinic">'
             f'{esc(ctx.tpl["clinic_name"])}</div>{lines}</div></div>'
             f'<h1>{title}</h1><div class="ident">{rows}</div>')
    return wrap(ctx, "clinic", "header", inner, cls="header")


def c_text(ctx, p):
    inner = "".join(f"<p>{fill_placeholders(ctx, esc(x))}</p>" for x in p["paragraphs"])
    return wrap(ctx, "clinic", p.get("ref", "text"), inner, p.get("title"))


def c_image(ctx, p):
    inner = f'<div class="imgph" style="height:{p.get("height_mm", 30)}mm">{esc(p.get("label", "image"))}</div>'
    return wrap(ctx, "clinic", p.get("ref", "image"), inner, p.get("title"))


def k_text(ctx, p):
    t = ctx.t
    title = t.get(p.get("label", "comment"), p.get("label"))
    inner = f'<div class="clin">{esc(p.get("text") or t["clinician_placeholder"])}</div>'
    if p.get("signature"):
        inner += (f'<div class="sig"><span>{esc(t["signature"])}: ____________________</span>'
                  f'<span>{esc(t["date"])}: __________</span></div>')
    return wrap(ctx, "clinician", p.get("ref", p.get("label", "comment")), inner, title,
                cls="small-head" if p.get("label") == "comment" else "")


def pagebreak(ctx, p):
    return '<div class="pb"></div>'


CLINIC = {"header": c_header, "text": c_text, "image": c_image}
CLINICIAN = {"text": k_text}


def render_blocks(ctx):
    out = []
    for b in ctx.tpl["blocks"]:
        kind = b["kind"]
        if kind == "pagebreak":
            out.append(pagebreak(ctx, b))
        elif kind == "device":
            out.append(DEVICE[b["ref"]](ctx, b.get("params", {})))
        elif kind == "clinic":
            out.append(CLINIC[b["type"]](ctx, b))
        elif kind == "clinician":
            out.append(CLINICIAN["text"](ctx, b))
        else:
            raise ValueError(f"unknown block kind {kind}")
    return "\n".join(out)


# ---------------------------------------------------------------------------------------------
# Validation of a clinic template record (the schema check before a template can be saved)
# ---------------------------------------------------------------------------------------------

def validate_template(tpl):
    errors = []
    for k in ("clinic_name", "language", "theme", "blocks"):
        if k not in tpl:
            errors.append(f"missing {k}")
    if tpl.get("language") not in tl.LANGS:
        errors.append("language not supported")
    for i, b in enumerate(tpl.get("blocks", [])):
        if b["kind"] == "device" and b["ref"] not in DEVICE:
            errors.append(f"block {i}: unknown device block {b['ref']}")
        if b["kind"] == "clinic" and b.get("type") not in CLINIC:
            errors.append(f"block {i}: unknown clinic block type")
    th = tpl.get("theme", {})
    if th.get("base_pt", 9) < 8:
        errors.append("theme: base font below the minimum size of 8 pt")
    approved = {"DejaVu Sans", "DejaVu Serif", "Liberation Sans", "Liberation Serif", "IPAGothic",
                "IPAPGothic"}
    for f in (th.get("font_body"), th.get("font_head")):
        if f and f not in approved:
            errors.append(f"theme: font {f} not on the approved list")
    claim = re.compile(r"ADHD|ADHS|diagnos|Diagnose|診断", re.IGNORECASE)
    for b in tpl.get("blocks", []):
        for para in b.get("paragraphs", []):
            if claim.search(para):
                errors.append("warning: claim word in a clinic block (open question in I6)")
    return errors


def check_rendered(ctx):
    probs = []
    for s in ctx.rendered_sentences:
        if s["id"] in tl.FORBIDDEN_EXEMPT:
            continue
        for pat in tl.FORBIDDEN[ctx.lang]:
            if re.search(pat, s["text"], flags=re.IGNORECASE):
                probs.append(f'{s["id"]}: {pat} in "{s["text"]}"')
    return probs


# ---------------------------------------------------------------------------------------------
# HTML and PDF
# ---------------------------------------------------------------------------------------------

def build_html(tpl, annotate=False, case=None):
    case = case or json.loads(CASE_PATH.read_text())
    ctx = Ctx(case, tpl, annotate)
    body = render_blocks(ctx)
    env = Environment(loader=FileSystemLoader(ROOT / "layouts"), autoescape=False)
    page = env.get_template("report.html.j2").render(
        tpl=tpl, theme=tpl["theme"], body=body, t=ctx.t, lang=ctx.lang, annotate=annotate,
        base_css=(ROOT / "layouts" / "base.css").read_text())
    return page, ctx


def footer_html(ctx):
    th, t, r, m = ctx.tpl["theme"], ctx.t, ctx.report, ctx.current
    font = th.get("font_body", "DejaVu Sans")
    status = t["issued"] if r["status"] == "issued" else t["draft"]
    return (f'<div style="font-family:\'{font}\';font-size:6.5pt;color:#555;width:100%;'
            f'padding:0 14mm;display:flex;justify-content:space-between;">'
            f'<span style="color:#b3261e;font-weight:bold">{esc(t["mockup"])}</span>'
            f'<span>{esc(m["processed_with"]["software"])} · {esc(m["processed_with"]["norms"])} · '
            f'{esc(r["id"])} {esc(t["version"])} {r["version"]} · {esc(status)}</span>'
            f'<span>{esc(t["page"])} <span class="pageNumber"></span> {esc(t["of"])} '
            f'<span class="totalPages"></span></span></div>')


def header_html(ctx):
    th = ctx.tpl["theme"]
    font = th.get("font_body", "DejaVu Sans")
    txt = ctx.tpl.get("running_header", "")
    return (f'<div style="font-family:\'{font}\';font-size:6.5pt;color:#777;width:100%;'
            f'padding:0 14mm;display:flex;justify-content:space-between;">'
            f'<span>{esc(ctx.tpl["clinic_name"])}{(" · " + esc(txt)) if txt else ""}</span>'
            f'<span style="color:#b3261e">{esc(ctx.t["mockup"])}</span></div>')


def to_pdf(html_path, pdf_path, header, footer, margins):
    payload = json.dumps({"html": str(html_path), "pdf": str(pdf_path), "header": header,
                          "footer": footer, "margins": margins})
    subprocess.run(["node", str(ROOT / "pdf.js")], input=payload, text=True, check=True)


def render(tpl_path, pdf_path, annotate=False, keep_html=True):
    tpl = json.loads(Path(tpl_path).read_text())
    errs = [e for e in validate_template(tpl) if not e.startswith("warning")]
    if errs:
        sys.exit(f"template invalid: {errs}")
    page, ctx = build_html(tpl, annotate)
    probs = check_rendered(ctx) + tl.check_library()
    if probs:
        sys.exit(f"forbidden wording: {probs}")
    pdf_path = Path(pdf_path).resolve()
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    html_path = pdf_path.with_suffix(".html")
    html_path.write_text(page)
    margins = tpl["theme"].get("margins_mm", [18, 14, 16, 14])
    to_pdf(html_path, pdf_path, header_html(ctx), footer_html(ctx), margins)
    if not keep_html:
        html_path.unlink()
    print(f"wrote {pdf_path} ({len(ctx.rendered_sentences)} system sentences)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("template")
    ap.add_argument("out")
    ap.add_argument("--annotate", action="store_true", help="tag each block with its kind")
    a = ap.parse_args()
    render(a.template, a.out, a.annotate)


if __name__ == "__main__":
    main()
