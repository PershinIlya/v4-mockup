"""Figures for the mockup report and prototype (device blocks).

The colour scale of every figure is fixed and the same in all clinic styles (spec 3.5): blue for
values below the norm, a neutral grey at the normative mean, red above it, clipped at z = +-3.
Colours stay continuous; the marked state (after correction for multiple comparisons, mockup
assumption M33) is drawn the same way in every figure: a black ring on a marked electrode, pair
or ERP peak, and coherence lines only for marked pairs. A dotted contour still shows where maps
pass 2 z. Figures are written as SVG so the PDF stays sharp.
"""

import io

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402
from matplotlib.patches import Circle, Polygon  # noqa: E402
from scipy.interpolate import RBFInterpolator  # noqa: E402

# Fixed device colours (not themeable). Diverging pair from a validated blue and red ramp with a
# neutral grey midpoint.
Z_COLOURS = ["#104281", "#2a78d6", "#9ec5f4", "#f0efec", "#f4b2a8", "#e34948", "#9a1f1e"]
Z_CMAP = LinearSegmentedColormap.from_list("v4z", Z_COLOURS, N=256)
Z_LIM = 3.0
INK = "#2b2b2b"
MUTED = "#7a7a76"
GRID = "#e3e2de"
PATIENT = "#1f1f1e"
MARK_R, MARK_LW = 0.12, 0.9  # ring on a marked electrode (head radius 1.08)
NORM_FILL = "#d9d8d3"
EARLIER = "#2a78d6"

plt.rcParams.update({
    "font.family": ["DejaVu Sans", "IPAGothic"], "font.size": 7, "axes.edgecolor": MUTED,
    "axes.labelcolor": INK, "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.spines.top": False, "axes.spines.right": False, "svg.fonttype": "path",
})


def svg(fig):
    buf = io.StringIO()
    fig.savefig(buf, format="svg", bbox_inches="tight", pad_inches=0.02, transparent=True)
    plt.close(fig)
    text = buf.getvalue()
    return text[text.index("<svg"):]


def _head(ax, scale=1.0):
    r = 1.08 * scale
    ax.add_patch(Circle((0, 0), r, fill=False, lw=0.9, ec=INK))
    ax.add_patch(Polygon([[-0.13, r - 0.01], [0, r + 0.14], [0.13, r - 0.01]], closed=False,
                         fill=False, lw=0.9, ec=INK))
    for s in (-1, 1):
        ax.add_patch(Polygon([[s * r, 0.14], [s * (r + 0.07), 0.1], [s * (r + 0.07), -0.1],
                              [s * r, -0.14]], closed=False, fill=False, lw=0.9, ec=INK))
    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-1.25, 1.35)
    ax.set_aspect("equal")
    ax.axis("off")


def _grid_values(positions, values, res=90):
    pts = np.array(positions)
    vals = np.array(values, dtype=float)
    # add a ring of virtual points that take the mean, so the edge does not extrapolate wildly
    ang = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    ring = np.c_[1.25 * np.cos(ang), 1.25 * np.sin(ang)]
    near = [vals[np.argsort(((pts - p) ** 2).sum(1))[:3]].mean() for p in ring]
    rbf = RBFInterpolator(np.r_[pts, ring], np.r_[vals, near], kernel="thin_plate_spline",
                          smoothing=0.02)
    g = np.linspace(-1.1, 1.1, res)
    xx, yy = np.meshgrid(g, g)
    zz = rbf(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    zz[xx ** 2 + yy ** 2 > 1.08 ** 2] = np.nan
    return g, zz


def topomap(ax, channels, positions, z, title=None, show_names=False, marks=None):
    pos = [positions[c] for c in channels]
    g, zz = _grid_values(pos, z)
    ax.imshow(np.clip(zz, -Z_LIM, Z_LIM), extent=(g[0], g[-1], g[0], g[-1]), origin="lower",
              cmap=Z_CMAP, vmin=-Z_LIM, vmax=Z_LIM, interpolation="bilinear")
    ax.contour(g, g, zz, levels=[-2, 2], colors=[INK], linewidths=0.4, linestyles="dotted")
    _head(ax)
    xs, ys = zip(*pos)
    ax.scatter(xs, ys, s=2.5, c=INK, lw=0)
    if show_names:
        for c, (x, y) in zip(channels, pos):
            ax.text(x, y - 0.11, c, ha="center", va="top", fontsize=4.5, color=INK)
    if marks:
        for c in marks:
            x, y = positions[c]
            ax.add_patch(Circle((x, y), MARK_R, fill=False, lw=MARK_LW, ec=INK, zorder=4))
    if title:
        ax.set_title(title, fontsize=7, color=INK, pad=1)


def colourbar_svg(label="z (deviation from the age norm, in standard deviations)", width=3.2):
    fig, ax = plt.subplots(figsize=(width, 0.42))
    grad = np.linspace(-Z_LIM, Z_LIM, 256)[None, :]
    ax.imshow(grad, aspect="auto", cmap=Z_CMAP, extent=(-Z_LIM, Z_LIM, 0, 1))
    ax.set_yticks([])
    ax.set_xticks([-3, -2, -1, 0, 1, 2, 3])
    ax.set_xticklabels(["-3", "-2", "-1", "0", "1", "2", "3"])
    ax.tick_params(length=2, pad=1)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xlabel(label, fontsize=6, labelpad=2)
    return svg(fig)


def _marked_channels(channels, flags):
    return [c for c, f in zip(channels, flags or []) if f]


def band_maps_svg(case, meas, cond, kind="abs_z", bands=None, label_fn=None):
    bands = bands or [b["name"] for b in case["bands"]]
    data = meas["spectra"]["conditions"][cond]["bands"]
    mkey = kind.replace("_z", "_marked")
    fig, axes = plt.subplots(1, len(bands), figsize=(1.08 * len(bands), 1.2))
    for ax, b in zip(np.atleast_1d(axes), bands):
        lo_hi = next(x for x in case["bands"] if x["name"] == b)
        title = label_fn(b, lo_hi) if label_fn else f"{b} {lo_hi['lo']}-{lo_hi['hi']} Hz"
        topomap(ax, case["channels"], case["positions"], data[b][kind], title=title,
                marks=_marked_channels(case["channels"], data[b].get(mkey)))
    return svg(fig)


def maps_1hz_svg(case, meas, cond, title_fn=None, maps=None, marked=None):
    """Maps per 1 Hz band (z), 1-2 Hz to 29-30 Hz; maps and marked default to absolute power
    (maps_1hz_z, maps_1hz_marked); pass the relative ones (textlib.relative_maps_1hz) for the
    relative maps (review B1)."""
    if maps is None:
        maps = meas["spectra"]["conditions"][cond]["maps_1hz_z"]
        marked = meas["spectra"]["conditions"][cond].get("maps_1hz_marked")
    marked = marked or [None] * len(maps)
    fig, axes = plt.subplots(3, 10, figsize=(7.2, 2.4))
    for i, ax in enumerate(axes.ravel()):
        if i >= len(maps):
            ax.axis("off")
            continue
        topomap(ax, case["channels"], case["positions"], maps[i],
                title=title_fn(i + 1) if title_fn else f"{i + 1}-{i + 2} Hz",
                marks=_marked_channels(case["channels"], marked[i]))
        ax.title.set_fontsize(5.5)
    fig.subplots_adjust(wspace=0.05, hspace=0.25)
    return svg(fig)


ROW_FIRST = ("Fp1", "F7", "T3", "T5", "O1")   # first electrode of each row of the head layout


def spectra_grid_svg(case, meas, cond, earlier=None, xlabel="Hz", relative=None,
                     ylabel="µV²/Hz, log scale"):
    """Spectra per channel in head layout: patient line on the norm band (mean +- 2 SD).
    Absolute power (µV²/Hz) by default; relative: a dict from textlib.relative_spectrum (and the
    earlier measurement's in relative["earlier"]) for the share of total power per 0.5 Hz bin in
    percent (review B1). The first panel of each row carries readable y ticks."""
    f = np.array(meas["spectra"]["freqs"])
    c = meas["spectra"]["conditions"][cond]
    if relative is None:
        lp, mu, sd = (np.array(c[k]) for k in ("log_power", "norm_log_mean", "norm_log_sd"))
        e = (np.array(earlier["spectra"]["conditions"][cond]["log_power"])
             if earlier is not None else None)
        scale, ylim = 1.0, (0.15, 400)
    else:
        lp = np.array(relative["rel_log_power"])
        mu = np.array(relative["norm_rel_log_mean"])
        sd = np.array(relative["norm_rel_log_sd"])
        e = np.array(relative["earlier"]["rel_log_power"]) if relative.get("earlier") else None
        scale, ylim = 100.0, (0.01, 40)
    fig = plt.figure(figsize=(7.0, 5.0))
    w, h = 0.15, 0.13
    for i, ch in enumerate(case["channels"]):
        x, y = case["positions"][ch]
        ax = fig.add_axes([0.5 + x * 0.4 - w / 2, 0.47 + y * 0.42 - h / 2, w, h])
        ax.fill_between(f, scale * 10 ** (mu[i] - 2 * sd[i]), scale * 10 ** (mu[i] + 2 * sd[i]),
                        color=NORM_FILL, lw=0)
        ax.plot(f, scale * 10 ** mu[i], color=MUTED, lw=0.6)
        if e is not None:
            ax.plot(f, scale * 10 ** e[i], color=EARLIER, lw=0.7, ls=(0, (2, 1)))
        ax.plot(f, scale * 10 ** lp[i], color=PATIENT, lw=0.9)
        ax.set_yscale("log")
        ax.set_xlim(1, 30)
        ax.set_ylim(*ylim)
        ax.set_xticks([4, 8, 12, 20, 30])
        ax.tick_params(labelsize=4.5, length=1.5, pad=1)
        if ch not in ("T5", "O1", "O2", "T6"):
            ax.set_xticklabels([])
        if ch in ROW_FIRST:
            ax.tick_params(axis="y", labelsize=5.5, length=2, pad=1)
            ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(
                lambda v, _: f"{v:g}"))
        else:
            ax.set_yticklabels([])
        ax.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
        if ch == "T5":
            ax.set_xlabel(xlabel, fontsize=5, labelpad=1)
        if ch == "T3":
            ax.set_ylabel(ylabel, fontsize=5, labelpad=1)
        ax.text(0.97, 0.92, ch, transform=ax.transAxes, ha="right", va="top", fontsize=6,
                color=INK, weight="bold")
        for b in (4, 8, 12):
            ax.axvline(b, color=GRID, lw=0.4, zorder=0)
    return svg(fig)


GO_NOGO = "#8a4f00"   # Go minus NoGo difference wave (fixed figure colour, not a z colour)


def _peaks_of(meas, trial):
    """Scored peaks of a trial type per site: [(latency or None, amplitude, marked, window)]."""
    out = {}
    for pk in meas["erp"]["peaks"]:
        if pk["condition"] != trial:
            continue
        mk = bool(pk.get("amplitude_marked") or pk.get("latency_marked"))
        w = pk.get("window_ms")
        if isinstance(w, str):
            lo, hi = (int(x) for x in w.split(" to "))
            w = (lo, hi)
        out.setdefault(pk["site"], []).append((pk["latency_ms"], pk["amplitude_uv"], mk, w))
    return out


def erp_grid19_svg(case, meas, trial, earlier=None, xlabel="ms from the second picture",
                   ylabel="µV, positive up"):
    """Channel ERP of one trial type at the 19 electrodes in head layout (review B2): patient
    line on the norm band (mean +- 2 SD, when the measurement has a norm), a tick on every scored
    peak (a ring when marked), the CNV window as a bar at its mean, the earlier measurement
    dashed."""
    e = meas["erp"]
    t = np.array(e["times_ms"])
    ch = e["conditions"][trial]["channels"]
    peaks = _peaks_of(meas, trial)
    allv = [v for s_ in case["channels"] for v in ch[s_]["patient_uv"]]
    lim = max(8.0, float(np.ceil(max(abs(min(allv)), abs(max(allv))) / 4.0) * 4.0))
    fig = plt.figure(figsize=(7.0, 4.6))
    w, h = 0.15, 0.13
    for s_ in case["channels"]:
        x, y = case["positions"][s_]
        ax = fig.add_axes([0.5 + x * 0.4 - w / 2, 0.47 + y * 0.42 - h / 2, w, h])
        d = ch[s_]
        p = np.array(d["patient_uv"])
        if d.get("norm_mean_uv") is not None:
            mu, sd = np.array(d["norm_mean_uv"]), np.array(d["norm_sd_uv"])
            ax.fill_between(t, mu - 2 * sd, mu + 2 * sd, color=NORM_FILL, lw=0)
            ax.plot(t, mu, color=MUTED, lw=0.5)
        if earlier is not None:
            ax.plot(t, earlier["erp"]["conditions"][trial]["channels"][s_]["patient_uv"],
                    color=EARLIER, lw=0.6, ls=(0, (2, 1)))
        ax.plot(t, p, color=PATIENT, lw=0.8)
        for lat, amp, mk, win in peaks.get(s_, []):
            if lat is None and win:     # CNV: the window as a bar at the mean amplitude
                ax.plot(list(win), [amp, amp], color=INK, lw=1.4, solid_capstyle="butt", zorder=5)
                continue
            ax.plot([lat, lat], [amp - 0.16 * lim, amp + 0.16 * lim], color=INK, lw=0.9, zorder=5)
            if mk:
                ax.plot([lat], [amp], marker="o", ms=5, mfc="none", mec=INK, mew=MARK_LW, zorder=6)
        ax.axvline(0, color=MUTED, lw=0.4)
        ax.axhline(0, color=GRID, lw=0.4)
        ax.set_xlim(-200, 800)
        ax.set_ylim(-lim, lim)
        ax.set_xticks([0, 400])
        ax.set_yticks([-lim / 2, 0, lim / 2])
        ax.tick_params(labelsize=4.5, length=1.5, pad=1)
        if s_ not in ("T5", "O1", "O2", "T6"):
            ax.set_xticklabels([])
        if s_ in ROW_FIRST:
            ax.tick_params(axis="y", labelsize=5, length=2, pad=1)
            ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v:g}"))
        else:
            ax.set_yticklabels([])
        if s_ == "T5":
            ax.set_xlabel(xlabel, fontsize=5, labelpad=1)
        if s_ == "T3":
            ax.set_ylabel(ylabel, fontsize=5, labelpad=1)
        ax.text(0.97, 0.92, s_, transform=ax.transAxes, ha="right", va="top", fontsize=6,
                color=INK, weight="bold")
    return svg(fig)


def go_nogo_svg(case, meas, sites=("Fz", "Cz", "Pz"), labels=("Go", "NoGo", "Go minus NoGo"),
                xlabel="ms from the second picture", ylabel="µV, positive up"):
    """Go and NoGo trials overlaid at a few midline electrodes with the Go minus NoGo difference
    wave (review B2; no norm for the difference)."""
    e = meas["erp"]
    t = np.array(e["times_ms"])
    fig, axes = plt.subplots(1, len(sites), figsize=(7.0, 1.55), sharey=True)
    for ax, s_ in zip(np.atleast_1d(axes), sites):
        go = np.array(e["conditions"]["go"]["channels"][s_]["patient_uv"])
        ng = np.array(e["conditions"]["nogo"]["channels"][s_]["patient_uv"])
        ax.plot(t, go, color=PATIENT, lw=0.9, label=labels[0])
        ax.plot(t, ng, color=PATIENT, lw=0.8, ls=(0, (3, 1.5)), label=labels[1])
        ax.plot(t, go - ng, color=GO_NOGO, lw=0.9, label=labels[2])
        ax.axvline(0, color=MUTED, lw=0.4)
        ax.axhline(0, color=GRID, lw=0.4)
        ax.set_xlim(-200, 800)
        ax.set_xticks([0, 200, 400, 600])
        ax.set_title(s_, fontsize=7, color=INK, pad=1)
        ax.tick_params(labelsize=5, length=1.5, pad=1)
    axes = np.atleast_1d(axes)
    axes[len(axes) // 2].set_xlabel(xlabel, fontsize=5, labelpad=1)
    axes[0].set_ylabel(ylabel, fontsize=5, labelpad=1)
    fig.legend(*axes[-1].get_legend_handles_labels(), fontsize=5.5, frameon=False,
               loc="lower center", ncol=3, bbox_to_anchor=(0.5, -0.12), handlelength=2.4)
    return svg(fig)


def coherence_svg(case, meas, cond, band, title=None, threshold=2.0):
    """Lines for the marked pairs only (pairs without a mark field: |z| of threshold or more)."""
    pairs = meas["coherence"][cond][band]["pairs"]
    fig, ax = plt.subplots(figsize=(1.6, 1.7))
    _head(ax)
    for p in pairs:
        if not p.get("marked", abs(p["z"]) >= threshold):
            continue
        a, b = p["pair"].split("-")
        (x1, y1), (x2, y2) = case["positions"][a], case["positions"][b]
        col = Z_CMAP((np.clip(p["z"], -Z_LIM, Z_LIM) + Z_LIM) / (2 * Z_LIM))
        ax.plot([x1, x2], [y1, y2], color=col, lw=0.6 + 0.5 * min(abs(p["z"]), 3.5))
    xs, ys = zip(*[case["positions"][c] for c in case["channels"]])
    ax.scatter(xs, ys, s=3, c=INK, lw=0, zorder=3)
    if title:
        ax.set_title(title, fontsize=7, color=INK, pad=1)
    return svg(fig)


def asymmetry_svg(case, meas, cond, bands=None, label_fn=None):
    """Asymmetry maps in the legacy convention (review C15, audit 14a A6): per band, the z of the
    index (right minus left) / (right plus left) at the right electrode of each pair and the same
    z with the opposite sign at the left electrode, the midline at 0; a ring on both electrodes of
    a marked pair."""
    bands = bands or [b["name"] for b in case["bands"]]
    asym = meas["spectra"]["conditions"][cond]["asymmetry"]
    chans = case["channels"]
    fig, axes = plt.subplots(1, len(bands), figsize=(1.08 * len(bands), 1.2))
    for ax, b in zip(np.atleast_1d(axes), bands):
        vals = {c: 0.0 for c in chans}
        marks = []
        for row in asym[b]:
            l, r = row["pair"].split("-")
            z = row["z"] if row.get("z") is not None else 0.0
            vals[r], vals[l] = z, -z
            if row.get("marked"):
                marks += [l, r]
        lo_hi = next(x for x in case["bands"] if x["name"] == b)
        topomap(ax, chans, case["positions"], [vals[c] for c in chans],
                title=label_fn(b, lo_hi) if label_fn else b, marks=marks)
    return svg(fig)


OMISSION, COMMISSION = "#1f1f1e", "#8c8c86"   # fixed figure colours of the two error kinds


def errors_per_block_svg(series, xlabel="Block of 40 trials", ylabel="Errors",
                         labels=("Omissions", "Commissions")):
    """Errors per block of 40 trials (review C8): omissions and commissions as two bars per
    block, the legend with each total; series = (omissions per block, commissions per block)
    (textlib.errors_by_block). No norm."""
    om, co = (np.array(x) for x in series)
    fig, ax = plt.subplots(figsize=(3.2, 1.35))
    x = np.arange(1, len(om) + 1)
    wdt = 0.38
    ax.bar(x - wdt / 2 - 0.02, om, width=wdt, color=OMISSION, label=f"{labels[0]} ({int(om.sum())})")
    ax.bar(x + wdt / 2 + 0.02, co, width=wdt, color=COMMISSION,
           label=f"{labels[1]} ({int(co.sum())})")
    ax.set_xticks(x)
    ax.set_xlabel(xlabel, fontsize=6)
    ax.set_ylabel(ylabel, fontsize=6)
    top = max(2, int(max(om.max(initial=0), co.max(initial=0))) + 1)
    ax.set_ylim(0, top)
    ax.yaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    ax.grid(axis="y", color=GRID, lw=0.4)
    ax.set_axisbelow(True)
    ax.legend(fontsize=5.5, frameon=False, loc="upper left", ncol=2, handlelength=1.2)
    return svg(fig)


def raw_excerpt_svg(case, meas, cond, seconds=10, width=7.0, height=3.6):
    raw = meas["raw"][cond]
    fs = raw["fs"]
    n = seconds * fs
    t = np.arange(n) / fs
    fig, ax = plt.subplots(figsize=(width, height))
    for i, ch in enumerate(case["channels"]):
        y = np.array(raw["channels"][ch][:n])
        ax.plot(t, y / 60.0 - i, color=PATIENT, lw=0.35)
    ax.set_yticks(-np.arange(len(case["channels"])))
    ax.set_yticklabels(case["channels"], fontsize=5)
    ax.set_xlim(0, seconds)
    ax.set_ylim(-len(case["channels"]), 1)
    ax.set_xlabel("s", fontsize=5)
    ax.tick_params(labelsize=5, length=1.5)
    ax.spines["left"].set_visible(False)
    return svg(fig)


def clean_excerpt(raw, chans, frontal=("Fp1", "Fp2")):
    """A raw excerpt as the report shows it (review C12): average reference over the 19 channels,
    then the eye components removed. Mockup stand-in for the cleaned signal of V4 (the ICA of
    the whole recording): principal components of the excerpt whose map is frontal (more than
    half of its weight on Fp1 and Fp2) and whose time course has blink-sized excursions are
    projected out. Returns {ch: array}."""
    x = np.array([raw["channels"][c] for c in chans], dtype=float)
    x = x - x.mean(axis=0, keepdims=True)
    xc = x - x.mean(axis=1, keepdims=True)
    u, sv, vt = np.linalg.svd(xc, full_matrices=False)
    fi = [chans.index(c) for c in frontal]
    keep = np.ones(len(sv), dtype=bool)
    for k in range(min(3, len(sv))):
        wmap = u[:, k] ** 2
        course = sv[k] * vt[k]
        if wmap[fi].sum() > 0.5 and np.max(np.abs(course)) > 4 * np.std(course):
            keep[k] = False
    y = (u[:, keep] * sv[keep]) @ vt[keep] + x.mean(axis=1, keepdims=True)
    return {c: y[i] for i, c in enumerate(chans)}


def raw_excerpts_svg(case, meas, excerpts, titles=None, spacing=50.0, width=7.0, panel_h=3.1):
    """Raw EEG excerpts chosen by the clinician (review C12): one panel per excerpt, stacked,
    19 labelled channels, drawn negative up (clinical convention, review C13), after cleaning
    and in average reference (clean_excerpt); x in seconds from the start of the excerpt's
    analysed segment; a 100 µV and 1 s scale bar on the right. excerpts: [{cond, start_s,
    seconds}]."""
    chans = case["channels"]
    n = len(excerpts)
    gap = 1.25
    fig, axes = plt.subplots(n, 2, figsize=(width, panel_h * n), squeeze=False,
                             gridspec_kw={"width_ratios": [8, gap], "wspace": 0.04,
                                          "hspace": 0.32})
    for k, ex in enumerate(excerpts):
        ax, sb = axes[k]
        raw = meas["raw"][ex["cond"]]
        fs = raw["fs"]
        a0 = int(round(ex["start_s"] * fs))
        nn = int(round(ex["seconds"] * fs))
        sig = clean_excerpt(raw, chans)
        t = ex["start_s"] + np.arange(nn) / fs
        for i, c in enumerate(chans):
            y = sig[c][a0:a0 + nn]
            ax.plot(t[:len(y)], -y - i * spacing, color=PATIENT, lw=0.33)
        ax.set_xlim(ex["start_s"], ex["start_s"] + ex["seconds"])
        ax.set_xticks(np.arange(np.ceil(ex["start_s"]), ex["start_s"] + ex["seconds"] + 0.01, 1))
        ax.set_xlabel("s", fontsize=5, labelpad=1)
        ax.tick_params(labelsize=5, length=1.5, pad=1)
        ax.spines["left"].set_visible(False)
        for xv in np.arange(np.ceil(ex["start_s"]), ex["start_s"] + ex["seconds"], 1):
            ax.axvline(xv, color=GRID, lw=0.4, zorder=0)
        if titles:
            ax.set_title(titles[k], fontsize=7, color=INK, pad=2, loc="left")
        ax.set_yticks(-np.arange(len(chans)) * spacing)
        ax.set_yticklabels(chans, fontsize=5)
        ax.tick_params(axis="y", length=0)
        y0 = -(len(chans) - 1) * spacing - 0.4 * spacing
        ax.set_ylim(y0 - 0.9 * spacing, 1.6 * spacing)
        sb.axis("off")
        sb.set_xlim(0, gap)
        sb.set_ylim(ax.get_ylim())
        sb.plot([0.15, 0.15], [y0, y0 + 100], color=INK, lw=1.0, solid_capstyle="butt")
        sb.plot([0.15, 1.15], [y0, y0], color=INK, lw=1.0, solid_capstyle="butt")
        sb.text(0.25, y0 + 50, "100 µV", fontsize=5, color=INK, va="center", ha="left")
        sb.text(0.65, y0 - 0.25 * spacing, "1 s", fontsize=5, color=INK, va="top", ha="center")
    return svg(fig)


def marker_maps_svg(case, meas, rows, title_fn=None):
    """Frequency markers (night round, review B3): one head per marker with the z of absolute
    power at the marker's 0.5 Hz bin over the 19 electrodes, rings on the marked electrodes of
    that bin (as in every figure) and a small square on the marker's electrode."""
    rows = list(rows)
    if not rows:
        return ""
    fig, axes = plt.subplots(1, len(rows), figsize=(1.15 * len(rows), 1.3))
    f0 = meas["spectra"]["freqs"][0]
    for ax, r in zip(np.atleast_1d(axes), rows):
        c = meas["spectra"]["conditions"][r["cond"]]
        k = int(round((r["hz"] - f0) / 0.5))
        z = [row[k] for row in c["z"]]
        marks = [ch for ch, row in zip(case["channels"], c["z_marked"]) if row[k]]
        topomap(ax, case["channels"], case["positions"], z,
                title=title_fn(r) if title_fn else f'{r["k"]}: {r["site"]} {r["hz"]:g} Hz',
                marks=marks)
        x, y = case["positions"][r["site"]]
        ax.add_patch(matplotlib.patches.Rectangle((x - 0.09, y - 0.09), 0.18, 0.18, fill=False,
                                                  lw=MARK_LW, ec=INK, zorder=5))
        ax.title.set_fontsize(6)
    return svg(fig)
