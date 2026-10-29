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


def maps_1hz_svg(case, meas, cond, title_fn=None):
    maps = meas["spectra"]["conditions"][cond]["maps_1hz_z"]
    marked = meas["spectra"]["conditions"][cond].get("maps_1hz_marked") or [None] * len(maps)
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


def spectra_grid_svg(case, meas, cond, earlier=None, xlabel="Hz"):
    """Absolute spectra per channel in head layout: patient line on the norm band (mean +- 2 SD)."""
    f = np.array(meas["spectra"]["freqs"])
    c = meas["spectra"]["conditions"][cond]
    lp, mu, sd = (np.array(c[k]) for k in ("log_power", "norm_log_mean", "norm_log_sd"))
    fig = plt.figure(figsize=(7.0, 5.0))
    w, h = 0.15, 0.13
    for i, ch in enumerate(case["channels"]):
        x, y = case["positions"][ch]
        ax = fig.add_axes([0.5 + x * 0.4 - w / 2, 0.47 + y * 0.42 - h / 2, w, h])
        ax.fill_between(f, 10 ** (mu[i] - 2 * sd[i]), 10 ** (mu[i] + 2 * sd[i]), color=NORM_FILL,
                        lw=0)
        ax.plot(f, 10 ** mu[i], color=MUTED, lw=0.6)
        if earlier is not None:
            e = np.array(earlier["spectra"]["conditions"][cond]["log_power"])
            ax.plot(f, 10 ** e[i], color=EARLIER, lw=0.7, ls=(0, (2, 1)))
        ax.plot(f, 10 ** lp[i], color=PATIENT, lw=0.9)
        ax.set_yscale("log")
        ax.set_xlim(1, 30)
        ax.set_ylim(0.15, 400)
        ax.set_xticks([4, 8, 12, 20, 30])
        ax.tick_params(labelsize=4.5, length=1.5, pad=1)
        if ch not in ("T5", "O1"):
            ax.set_xticklabels([])
        if ch not in ("F7", "T3", "T5"):
            ax.set_yticklabels([])
        if ch == "T5":
            ax.set_xlabel(xlabel, fontsize=5, labelpad=1)
        if ch == "T3":
            ax.set_ylabel("µV²/Hz, log scale", fontsize=5, labelpad=1)
        ax.text(0.97, 0.92, ch, transform=ax.transAxes, ha="right", va="top", fontsize=6,
                color=INK, weight="bold")
        for b in (4, 8, 12):
            ax.axvline(b, color=GRID, lw=0.4, zorder=0)
    return svg(fig)


def erp_grid_svg(case, meas, cond, sites=("Fz", "Cz", "Pz", "O1", "O2"), earlier=None,
                 xlabel="ms from the second picture", ylabel="µV, positive up"):
    e = meas["erp"]
    t = np.array(e["times_ms"])
    ch = e["conditions"][cond]["channels"]
    # marked peaks of this trial type: a ring at the peak (CNV: at the middle of its window)
    rings = {}
    for pk in e["peaks"]:
        if pk["condition"] == cond and (pk.get("amplitude_marked") or pk.get("latency_marked")):
            lat = pk["latency_ms"] if pk["latency_ms"] is not None else -100
            rings.setdefault(pk["site"], []).append((lat, pk["amplitude_uv"]))
    fig, axes = plt.subplots(1, len(sites), figsize=(7.0, 1.35), sharey=True)
    for ax, s in zip(axes, sites):
        d = ch[s]
        mu, sd, p = (np.array(d[k]) for k in ("norm_mean_uv", "norm_sd_uv", "patient_uv"))
        ax.fill_between(t, mu - 2 * sd, mu + 2 * sd, color=NORM_FILL, lw=0)
        ax.plot(t, mu, color=MUTED, lw=0.6)
        if earlier is not None:
            ax.plot(t, earlier["erp"]["conditions"][cond]["channels"][s]["patient_uv"],
                    color=EARLIER, lw=0.7, ls=(0, (2, 1)))
        ax.plot(t, p, color=PATIENT, lw=0.9)
        for lat, amp in rings.get(s, []):
            ax.plot([lat], [amp], marker="o", ms=5.5, mfc="none", mec=INK, mew=MARK_LW, zorder=5)
        ax.axvline(0, color=MUTED, lw=0.4)
        ax.axhline(0, color=GRID, lw=0.4)
        ax.set_xlim(-200, 800)
        ax.set_xticks([0, 200, 400, 600])
        ax.set_title(s, fontsize=7, color=INK, pad=1)
        ax.tick_params(labelsize=5, length=1.5, pad=1)
    axes[len(axes) // 2].set_xlabel(xlabel, fontsize=5, labelpad=1)
    axes[0].set_ylabel(ylabel, fontsize=5, labelpad=1)
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
    bands = bands or [b["name"] for b in case["bands"]]
    asym = meas["spectra"]["conditions"][cond]["asymmetry"]
    fig, axes = plt.subplots(1, len(bands), figsize=(1.08 * len(bands), 1.2))
    for ax, b in zip(np.atleast_1d(axes), bands):
        # draw each pair as two mirrored dots coloured by the z of the pair (right minus left)
        _head(ax)
        for row in asym[b]:
            l, r = row["pair"].split("-")
            col = Z_CMAP((np.clip(row["z"], -Z_LIM, Z_LIM) + Z_LIM) / (2 * Z_LIM))
            for c in (l, r):
                x, y = case["positions"][c]
                ax.add_patch(Circle((x, y), 0.15, color=col, ec=INK, lw=0.3))
                if row.get("marked"):
                    ax.add_patch(Circle((x, y), 0.15 + 0.06, fill=False, ec=INK, lw=MARK_LW))
        lo_hi = next(x for x in case["bands"] if x["name"] == b)
        ax.set_title(label_fn(b, lo_hi) if label_fn else b, fontsize=7, color=INK, pad=1)
    return svg(fig)


def errors_per_block_svg(meas, earlier=None, xlabel="Block of 40 trials", ylabel="Errors"):
    v = meas["vcpt"]["errors_per_block"]
    fig, ax = plt.subplots(figsize=(3.0, 1.2))
    x = np.arange(1, len(v) + 1)
    wdt = 0.38 if earlier else 0.6
    if earlier:
        ax.bar(x - wdt / 2 - 0.02, earlier["vcpt"]["errors_per_block"], width=wdt, color=EARLIER)
        ax.bar(x + wdt / 2 + 0.02, v, width=wdt, color=PATIENT)
    else:
        ax.bar(x, v, width=wdt, color=PATIENT)
    ax.set_xticks(x)
    ax.set_xlabel(xlabel, fontsize=6)
    ax.set_ylabel(ylabel, fontsize=6)
    ax.yaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    ax.grid(axis="y", color=GRID, lw=0.4)
    ax.set_axisbelow(True)
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


def raw_excerpts_svg(case, meas, conds=("EO", "EC"), titles=None, seconds=4, spacing=50.0,
                     width=7.0, height=3.5):
    """Raw EEG excerpts side by side (one panel per condition), 19 labelled channels, with a
    100 µV and 1 s scale bar in a narrow panel on the right. Traces in µV, one channel every
    `spacing` µV."""
    chans = case["channels"]
    gap = 1.25  # seconds of x range in the scale bar panel (the 1 s bar is drawn to scale)
    fig, axes = plt.subplots(1, len(conds) + 1, figsize=(width, height), sharey=True,
                             gridspec_kw={"width_ratios": [seconds] * len(conds) + [gap],
                                          "wspace": 0.08})
    for k, (ax, cond) in enumerate(zip(axes, conds)):
        raw = meas["raw"][cond]
        fs = raw["fs"]
        n = int(seconds * fs)
        t = np.arange(n) / fs
        for i, ch in enumerate(chans):
            y = np.array(raw["channels"][ch][:n], dtype=float)
            ax.plot(t, y - i * spacing, color=PATIENT, lw=0.35)
        ax.set_xlim(0, seconds)
        ax.set_xticks(range(0, int(seconds) + 1))
        ax.set_xlabel("s", fontsize=5, labelpad=1)
        ax.tick_params(labelsize=5, length=1.5, pad=1)
        ax.spines["left"].set_visible(False)
        for x in range(1, int(seconds)):
            ax.axvline(x, color=GRID, lw=0.4, zorder=0)
        if titles:
            ax.set_title(titles[k], fontsize=7, color=INK, pad=2)
        if k == 0:
            ax.set_yticks(-np.arange(len(chans)) * spacing)
            ax.set_yticklabels(chans, fontsize=5)
            ax.tick_params(axis="y", length=0)
        else:
            ax.tick_params(axis="y", length=0, labelleft=False)
    sb = axes[-1]
    sb.axis("off")
    sb.set_xlim(0, gap)
    y0 = -(len(chans) - 1) * spacing - 0.4 * spacing
    sb.plot([0.15, 0.15], [y0, y0 + 100], color=INK, lw=1.0, solid_capstyle="butt")
    sb.plot([0.15, 1.15], [y0, y0], color=INK, lw=1.0, solid_capstyle="butt")
    sb.text(0.25, y0 + 50, "100 µV", fontsize=5, color=INK, va="center", ha="left")
    sb.text(0.65, y0 - 0.25 * spacing, "1 s", fontsize=5, color=INK, va="top", ha="center")
    axes[0].set_ylim(y0 - 0.9 * spacing, 2.4 * spacing)
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
