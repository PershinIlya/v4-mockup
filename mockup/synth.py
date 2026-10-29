"""Synthetic data generator for the V4 mockup.

Everything here is invented. Values are plausible for a child but deliberately artificial
(round birth date, code-number identity, fixed random seed). Nothing is derived from a real
recording or a real normative database.

Model: for every measure the generator first defines a normative mean and standard deviation
for the patient's age (mockup norm set), then a target z value, and derives the patient's value
from both. So every printed value, z and percentile is internally consistent.

Usage: python3 -m mockup.synth  (writes data/synthetic/case_mock042.json)
"""

import json
import math
from pathlib import Path

import numpy as np

SEED = 20261029
SOFTWARE_VERSION = "V4 mockup 0.1"
NORM_VERSION = "Mock norms 2026.1 (synthetic)"

CHANNELS = ["Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", "T3", "C3", "Cz", "C4", "T4",
            "T5", "P3", "Pz", "P4", "T6", "O1", "O2"]

# Azimuthal projection of the 10-20 positions: x to the right ear, y to the nose, the T3/T4
# circle at radius 1.
POS = {
    "Fp1": (-0.31, 0.95), "Fp2": (0.31, 0.95),
    "F7": (-0.81, 0.59), "F3": (-0.41, 0.54), "Fz": (0.0, 0.50), "F4": (0.41, 0.54),
    "F8": (0.81, 0.59),
    "T3": (-1.0, 0.0), "C3": (-0.50, 0.0), "Cz": (0.0, 0.0), "C4": (0.50, 0.0), "T4": (1.0, 0.0),
    "T5": (-0.81, -0.59), "P3": (-0.41, -0.54), "Pz": (0.0, -0.50), "P4": (0.41, -0.54),
    "T6": (0.81, -0.59),
    "O1": (-0.31, -0.95), "O2": (0.31, -0.95),
}

# Band limits of the legacy coherence and spectral bands (legacy audit 31 and 14f): delta 1.5-4,
# theta 4-8, alpha 8-12, SMR 12-15, beta1 15-20, beta2 20-30. Gamma is left out of the mockup.
BANDS = [("delta", 1.5, 4), ("theta", 4, 8), ("alpha", 8, 12), ("smr", 12, 15),
         ("beta1", 15, 20), ("beta2", 20, 30)]
# Theta/beta ratio bands as in the legacy TBR (audit 14a): theta 4-8, beta 13-21.
TBR_BANDS = ((4, 8), (13, 21))

ASYM_PAIRS = [("Fp1", "Fp2"), ("F7", "F8"), ("F3", "F4"), ("T3", "T4"), ("C3", "C4"),
              ("T5", "T6"), ("P3", "P4"), ("O1", "O2")]

CONDITIONS = ["EO", "EC"]
FREQS = np.round(np.arange(1.0, 30.01, 0.5), 2)

# VCPT trial types (legacy names AA, AP, PP, PH): Go, NoGo, Ignore, Novelty; 100 of each.
VCPT_TYPES = [("go", "AA"), ("nogo", "AP"), ("ignore", "PP"), ("novelty", "PH")]
ERP_TIMES = np.arange(-200, 801, 4)  # ms relative to the second stimulus


def _phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def pct(z):
    return round(100 * _phi(z), 1)


def r2(x):
    return float(np.round(x, 2))


def _dist(a, b):
    (x1, y1), (x2, y2) = POS[a], POS[b]
    return math.hypot(x1 - x2, y1 - y2)


def _region_weight(ch, centre, width=0.55):
    x, y = POS[ch]
    cx, cy = centre
    return math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * width ** 2))


def _gauss(f, mu, sd):
    return np.exp(-((f - mu) ** 2) / (2 * sd ** 2))


# ---------------------------------------------------------------------------------------------
# Spatially smooth random fields (shared by spectra, coherence and ERP noise)
# ---------------------------------------------------------------------------------------------

def _mirror_index():
    """Index of the homologous channel on the other side (midline channels map to themselves)."""
    out = []
    for ch in CHANNELS:
        x, y = POS[ch]
        out.append(min(range(len(CHANNELS)),
                       key=lambda j: (POS[CHANNELS[j]][0] + x) ** 2
                       + (POS[CHANNELS[j]][1] - y) ** 2))
    return np.array(out)


MIRROR = _mirror_index()


def _spatial_kernel(width):
    p = np.array([POS[c] for c in CHANNELS])
    d2 = ((p[:, None, :] - p[None, :, :]) ** 2).sum(-1)
    k = np.exp(-d2 / (2 * width ** 2))
    return k / k.sum(axis=1, keepdims=True)


def _smooth_rows(a, sigma):
    """Gaussian smoothing along the last axis (sigma in samples), edges reflected."""
    if sigma <= 0:
        return a
    r = int(math.ceil(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    padded = np.pad(a, [(0, 0)] * (a.ndim - 1) + [(r, r)], mode="reflect")
    return np.apply_along_axis(lambda row: np.convolve(row, k, mode="valid"), -1, padded)


def smooth_field(rng, ncols, width=0.5, col_sigma=2.0, antisym=0.2):
    """Unit-SD random field over channels x columns, smooth across the scalp and the columns.

    Homologous left and right sites share most of their deviation (antisym sets how much of the
    left-right difference is kept), as in real recordings."""
    n = _smooth_rows(rng.normal(0, 1, (len(CHANNELS), ncols)), col_sigma)
    n = _spatial_kernel(width) @ n
    sym, anti = (n + n[MIRROR]) / 2, (n - n[MIRROR]) / 2
    n = sym + antisym * anti
    return n / n.std()


# ---------------------------------------------------------------------------------------------
# Norms (mockup norm set; invented)
# ---------------------------------------------------------------------------------------------

def _apf_centre(age, cond):
    # children's alpha peak rises with age (about 9.2 Hz at 10 years); a little lower eyes open
    return 9.0 + 0.08 * (age - 8) + (0.0 if cond == "EC" else -0.1)


def norm_spectrum(age, cond, apf=None, alpha_gain=1.0):
    """Mean log10 power (uV^2/Hz, average reference) and SD per channel x frequency.

    Aperiodic 1/f background (exponent about 1.25, temporal sites lower), a fronto-central theta
    shoulder near 6 Hz, a posterior alpha peak that grows strongly with the eyes closed, a small
    central 13 Hz bump and posterior slow activity of youth with the eyes closed. apf and
    alpha_gain let the patient's spectrum be built from the same model."""
    f = FREQS
    apf = _apf_centre(age, cond) if apf is None else apf
    lf = np.log10(f)
    mean = np.zeros((len(CHANNELS), len(f)))
    sd = np.zeros_like(mean)
    for i, ch in enumerate(CHANNELS):
        x, y = POS[ch]
        post = _region_weight(ch, (0, -0.85), 0.5)
        front = _region_weight(ch, (0, 0.35), 0.5)
        cent = _region_weight(ch, (0, 0.0), 0.45)
        temporal = max(_region_weight(ch, (-1.0, -0.1), 0.35),
                       _region_weight(ch, (1.0, -0.1), 0.35))
        fp = _region_weight(ch, (0, 0.95), 0.35)
        offset = 0.08 * (1 - abs(x)) - 0.10 * temporal
        background = 1.50 + offset - 1.25 * lf
        if cond == "EC":
            alpha_amp = alpha_gain * (1.10 * post + 0.20)
        else:
            alpha_amp = alpha_gain * (0.58 * post + 0.10)
        theta_amp = (0.24 * front + 0.06) * (1.0 - 0.03 * (age - 8))
        spec = (background + alpha_amp * _gauss(f, apf, 1.0) + theta_amp * _gauss(f, 6.0, 1.2)
                + 0.06 * cent * _gauss(f, 13.0, 1.2) + 0.10 * fp * _gauss(f, 1.5, 1.0))
        if cond == "EC":
            spec += 0.10 * post * _gauss(f, 3.5, 1.0)  # posterior slow waves of youth
        mean[i] = spec
        # between-subject SD in log10 units: about 0.22 (a factor of 1.7), larger for alpha
        sd[i] = 0.21 + 0.02 * lf + (0.07 if cond == "EC" else 0.04) * post * _gauss(f, apf, 1.6)
    return mean, sd


def posterior_peak(logp):
    """Alpha peak frequency of the posterior mean log spectrum (7.5 to 12.5 Hz, parabolic fit)."""
    ix = [CHANNELS.index(c) for c in ("P3", "Pz", "P4", "O1", "O2")]
    m = np.asarray(logp)[ix].mean(axis=0)
    win = np.where((FREQS >= 7.5) & (FREQS <= 12.5))[0]
    k = win[np.argmax(m[win])]
    a, b, c = m[k - 1], m[k], m[k + 1]
    den = a - 2 * b + c
    shift = 0.5 * (a - c) / den if den else 0.0
    return float(FREQS[k] + shift * (FREQS[1] - FREQS[0]))


APF_SD = 0.75  # between-subject SD of the alpha peak frequency in children, Hz
REL_SD = 0.14  # between-subject SD of relative band power, log10 units


def coherence_norm(a, b, band, cond):
    """Magnitude-squared coherence norm: falls with distance (volume conduction near, little far);
    alpha higher with the eyes closed, homologous posterior pairs share alpha generators."""
    d = _dist(a, b)
    base = {"delta": 0.80, "theta": 0.78, "alpha": 0.80, "smr": 0.70, "beta1": 0.64,
            "beta2": 0.58}[band]
    if band == "alpha" and cond == "EC":
        base += 0.08
    mu = 0.05 + base * math.exp(-d / 0.68)
    if band == "alpha" and {a, b} in ({"O1", "O2"}, {"P3", "P4"}, {"T5", "T6"}):
        mu += 0.14 if cond == "EC" else 0.07
    sd = 0.035 + 0.25 * mu * (1 - mu)
    return mu, sd


# ---------------------------------------------------------------------------------------------
# Patient profile (target deviations; invented)
# ---------------------------------------------------------------------------------------------

def spectral_dev(profile, cond, rng, person):
    """Patient deviation in z units per channel x frequency, added to the model spectrum built at
    the patient's own alpha peak: smooth random deviations plus a frontal-midline theta excess, a
    little central beta and a right-frontal alpha excess (asymmetry)."""
    f = FREQS
    # the child's own stable deviations (shared by both measurements and conditions) plus a
    # part that differs between recordings; SD 0.4 z in all
    z = 0.4 * (0.8 * person["spec"] + 0.6 * smooth_field(rng, len(f), width=0.5, col_sigma=2.0))
    for i, ch in enumerate(CHANNELS):
        x, y = POS[ch]
        front = _region_weight(ch, (0, 0.4), 0.55)
        z[i] += profile["theta_z"][cond] * front * _gauss(f, 5.75, 1.3)
        z[i] += profile["beta_z"] * _region_weight(ch, (0.0, 0.1), 0.6) * _gauss(f, 22, 3)
        # right minus left frontal alpha: +h on the right, -h on the left, so the asymmetry
        # index of the frontal pairs moves by about asym_alpha_frontal z
        lat = _region_weight(ch, (0, 0.6), 0.45) * min(1.0, abs(x) / 0.4) * np.sign(x)
        z[i] += lat * profile["asym_alpha_frontal"] * 0.18 * _gauss(f, 10.0, 1.6)
    return z


PROFILES = {
    # Earlier measurement (March 2026) and current measurement (September 2026). Mixed on
    # purpose: some values move towards the norm, others away from it.
    "m1": {"theta_z": {"EO": 1.7, "EC": 2.3}, "apf": {"EO": 8.7, "EC": 8.8}, "alpha_gain": 0.92,
           "beta_z": 0.3, "coh_theta_frontal": 2.8,
           "asym_alpha_frontal": 0.4, "p3_nogo_z": -1.5, "n2_nogo_z": 1.2, "cnv_z": 0.6,
           "omissions": 3, "commissions": 6, "rt_mean": 431, "rt_sd": 98,
           "rejected_go": 36, "seed": 1},
    "m2": {"theta_z": {"EO": 2.2, "EC": 2.7}, "apf": {"EO": 8.9, "EC": 9.0}, "alpha_gain": 1.0,
           "beta_z": 0.5, "coh_theta_frontal": 2.2,
           "asym_alpha_frontal": 1.6, "p3_nogo_z": -2.2, "n2_nogo_z": 0.4, "cnv_z": 1.1,
           "omissions": 5, "commissions": 3, "rt_mean": 452, "rt_sd": 117,
           "rejected_go": 9, "seed": 2},
}


# ---------------------------------------------------------------------------------------------
# Measures
# ---------------------------------------------------------------------------------------------

def band_mask(lo, hi):
    return (FREQS >= lo) & (FREQS < hi)


def _band_z(power, norm_power, sd, m):
    """z of a band sum in the log domain; SD of a band sum shrinks a little against single bins."""
    pat = power[:, m].sum(axis=1) * 0.5
    nrm = norm_power[:, m].sum(axis=1) * 0.5
    band_sd = sd[:, m].mean(axis=1) * 0.9
    return pat, nrm, (np.log10(pat) - np.log10(nrm)) / band_sd


def spectra_and_bands(profile, age, rng, person):
    out = {"freqs": FREQS.tolist(), "conditions": {}}
    for cond in CONDITIONS:
        mean, sd = norm_spectrum(age, cond)
        model, _ = norm_spectrum(age, cond, apf=profile["apf"][cond],
                                 alpha_gain=profile["alpha_gain"])
        logp = model + spectral_dev(profile, cond, rng, person) * sd
        z = (logp - mean) / sd
        power = 10 ** logp
        norm_power = 10 ** mean
        total_p = power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
        total_n = norm_power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
        bands = {}
        for name, lo, hi in BANDS:
            pat, nrm, bz = _band_z(power, norm_power, sd, band_mask(lo, hi))
            rel = pat / total_p
            rel_n = nrm / total_n
            rz = (np.log10(rel) - np.log10(rel_n)) / REL_SD
            bands[name] = {
                "abs_uv2": [r2(v) for v in pat], "abs_z": [r2(v) for v in bz],
                "rel_pct": [r2(100 * v) for v in rel], "rel_z": [r2(v) for v in rz],
            }
        # maps per 1 Hz band, 1-2 Hz up to 29-30 Hz: z of absolute power, same rule as the bands
        maps_1hz = []
        for lo in range(1, 30):
            bz = _band_z(power, norm_power, sd, band_mask(lo, lo + 1))[2]
            maps_1hz.append([r2(v) for v in bz])
        apf_mu = round(posterior_peak(mean), 2)
        apf = round(posterior_peak(logp), 1)
        out["conditions"][cond] = {
            "log_power": np.round(logp, 3).tolist(),
            "norm_log_mean": np.round(mean, 3).tolist(),
            "norm_log_sd": np.round(sd, 3).tolist(),
            "z": np.round(z, 2).tolist(),
            "bands": bands,
            "maps_1hz_z": maps_1hz,
            "alpha_peak": {"site": "posterior mean (P3, Pz, P4, O1, O2)", "hz": apf,
                           "norm_mean": r2(apf_mu), "norm_sd": APF_SD,
                           "z": r2((apf - apf_mu) / APF_SD)},
        }
        # theta/beta ratio at Cz (number only, no condition wording)
        ci = CHANNELS.index("Cz")
        th = power[ci, band_mask(*TBR_BANDS[0])].sum()
        be = power[ci, band_mask(*TBR_BANDS[1])].sum()
        thn = norm_power[ci, band_mask(*TBR_BANDS[0])].sum()
        ben = norm_power[ci, band_mask(*TBR_BANDS[1])].sum()
        tbr, tbr_n = th / be, thn / ben
        out["conditions"][cond]["tbr"] = {"site": "Cz", "value": r2(tbr),
                                          "norm_mean": r2(tbr_n),
                                          "z": r2(math.log(tbr / tbr_n) / 0.32)}
        # frontal alpha asymmetry index: ln(F4 alpha) - ln(F3 alpha), from the band powers
        a = bands["alpha"]["abs_uv2"]
        faa = math.log(a[CHANNELS.index("F4")]) - math.log(a[CHANNELS.index("F3")])
        out["conditions"][cond]["faa"] = {"value": r2(faa), "norm_mean": 0.02,
                                          "norm_sd": 0.11, "z": r2((faa - 0.02) / 0.11)}
        # asymmetry map: (R - L) / (R + L) per homologous pair and band, from the band powers
        asym = {}
        for name, _, _ in BANDS:
            vals = bands[name]["abs_uv2"]
            row = []
            for l, r in ASYM_PAIRS:
                L, R = vals[CHANNELS.index(l)], vals[CHANNELS.index(r)]
                v = (R - L) / (R + L)
                row.append({"pair": f"{l}-{r}", "value": r3(v), "z": r2(v / 0.06)})
            asym[name] = row
        out["conditions"][cond]["asymmetry"] = asym
    return out


def r3(x):
    return float(np.round(x, 3))


def coherence(profile, rng, person):
    pairs = [(a, b) for i, a in enumerate(CHANNELS) for b in CHANNELS[i + 1:]]
    idx = {c: i for i, c in enumerate(CHANNELS)}
    out = {}
    for cond in CONDITIONS:
        per_band = {}
        # per-channel random effects, smooth across the scalp and correlated across bands
        u = 0.15 * (0.8 * person["coh"] + 0.6 * smooth_field(rng, len(BANDS), width=0.55,
                                                             col_sigma=1.0))
        for k, (name, _, _) in enumerate(BANDS):
            rows = []
            for a, b in pairs:
                mu, sd = coherence_norm(a, b, name, cond)
                z = u[idx[a], k] + u[idx[b], k] + rng.normal(0, 0.5)
                # raised theta coherence between neighbouring frontal-midline sites
                fm = _region_weight(a, (0, 0.6), 0.4) * _region_weight(b, (0, 0.6), 0.4)
                if name == "theta" and _dist(a, b) < 0.75:
                    z += profile["coh_theta_frontal"] * (0.75 if cond == "EO" else 1.0) \
                        * min(1.0, 1.6 * fm)
                val = min(0.99, max(0.01, mu + z * sd))
                rows.append({"pair": f"{a}-{b}", "value": r3(val), "z": r2((val - mu) / sd)})
            g = float(np.mean([r["value"] for r in rows]))
            gn = float(np.mean([coherence_norm(a, b, name, cond)[0] for a, b in pairs]))
            per_band[name] = {"pairs": rows,
                              "global": {"value": r3(g), "z": r2((g - gn) / 0.03),
                                         "status": "core, to confirm"}}
        out[cond] = per_band
    return out


# ---------------------------------------------------------------------------------------------
# Channel ERPs (VCPT, time 0 = second picture; cue 1100 ms earlier, as the legacy timing of
# pictures at 300 and 1400 ms after the trial start, audit 14b B.1 and B.3)
# ---------------------------------------------------------------------------------------------

ERP_T = ERP_TIMES.astype(float)

# Scalp distributions of the generators: centre and width on the azimuthal projection
TOPO = {"occ": ((0.4, -0.9), 0.36), "par": ((0, -0.45), 0.55), "fc": ((0, 0.2), 0.5),
        "fcn": ((0, 0.35), 0.5), "fcp": ((0, 0.15), 0.55), "cz": ((0, 0.05), 0.5)}


def _gain(topo):
    """Scalp weights of a generator; the visual P1 and N1 are bilateral, lateral occipital."""
    (cx, cy), w = TOPO[topo]
    g = [_region_weight(ch, (cx, cy), w) for ch in CHANNELS]
    if topo == "occ":
        g = [max(a, _region_weight(ch, (-cx, cy), w)) for a, ch in zip(g, CHANNELS)]
    return np.array(g)[:, None]


def erp_generators(cond):
    """Components per trial type: (key, topography, latency ms, amplitude uV, width ms).

    Amplitudes are before the average reference (which takes away roughly a third at the
    maximum) and sized so that the referenced peaks suit a 10-year-old: children's ERPs are
    larger than adults'."""
    g = [("P1", "occ", 116, 17.0, 17), ("N1", "occ", 182, -13.0, 22),
         ("P2o", "occ", 255, 4.0, 30), ("P2c", "fc", 205, 3.0, 30)]
    if cond == "go":
        g += [("N2", "fc", 262, -3.0, 30), ("P3", "par", 382, 23.0, 70)]
    elif cond == "nogo":
        g += [("N2", "fcn", 272, -14.0, 28), ("P3", "fcp", 425, 30.0, 75)]
    elif cond == "ignore":
        g += [("N2", "fc", 262, -2.5, 30), ("P3", "par", 365, 6.0, 65)]
    elif cond == "novelty":
        # picture of a human with a sound: auditory N1 and P2 at the vertex, N2, a large
        # fronto-central P3a and a smaller late parietal P3
        g += [("N1a", "cz", 108, -6.0, 20), ("P2a", "cz", 186, 6.0, 25),
              ("N2", "fcn", 242, -6.0, 26), ("P3a", "fcp", 328, 24.0, 55),
              ("P3", "par", 430, 6.0, 80)]
    if cond in ("go", "nogo"):
        g += [("CNV", "fc", 0, -9.0, 0)]  # slow negativity after an animal cue
    return g


def _cnv_shape(t):
    """Late CNV: already developed 200 ms before the second picture, rising a little towards it,
    resolving within about 200 ms after it (baseline before the cue, so it shows as an offset)."""
    pre = (0.8 + 0.2 * np.clip((t + 200) / 200, 0, 1)) * (t <= 0)
    post = np.exp(-(np.clip(t, 0, None) / 120) ** 2) * (t > 0)
    return pre + post


def erp_waves(cond, mods=None):
    """Mean waveforms (channels x time, uV, average reference) for one trial type.
    mods: {key: (amplitude factor, latency shift ms)} for the patient."""
    mods = mods or {}
    w = np.zeros((len(CHANNELS), len(ERP_T)))
    for key, topo, lat, amp, width in erp_generators(cond):
        fa, dl = mods.get(key, (1.0, 0.0))
        gain = _gain(topo)
        shape = _cnv_shape(ERP_T) if key == "CNV" else \
            np.exp(-((ERP_T - lat - dl) ** 2) / (2 * width ** 2))
        w += gain * amp * fa * shape[None, :]
    return w - w.mean(axis=0, keepdims=True)  # average reference of 19 scalp channels


def erp_norm_sd(mu):
    """Between-subject SD of the mean waveform: background spread plus about 22 % of the
    amplitude, so the band is widest at the large components."""
    fc, occ = _gain("fc"), _gain("occ")
    bg = 1.6 + 0.8 * fc + 0.8 * occ
    return np.sqrt(bg ** 2 + (0.22 * mu) ** 2)


def erp_noise(rng, n_trials, rms100=1.1):
    """Residual background EEG in a trial average: 1/f with some alpha, smooth across the scalp,
    RMS about 1.1 uV for 100 trials and growing as 1/sqrt(trials)."""
    n, fs = len(ERP_T), 250.0
    nf = n // 2 + 1
    f = np.fft.rfftfreq(n, 1 / fs)
    shape = 1 / (f + 1.5) ** 0.9 + 0.35 * _gauss(f, 9.5, 1.2)
    shape[f > 35] = 0
    size = (len(CHANNELS), nf)
    spec = shape * (rng.normal(0, 1, size) + 1j * rng.normal(0, 1, size))
    x = np.fft.irfft(spec, n=n, axis=1)
    x = _spatial_kernel(0.45) @ x
    x -= x.mean(axis=0, keepdims=True)
    x /= x.std(axis=1, keepdims=True)
    return x * rms100 * math.sqrt(100.0 / max(n_trials, 1))


ERP_PEAKS = [
    # component, trial type, site, polarity (+1 maximum, -1 minimum, 0 window mean), window (ms),
    # latency SD (ms)
    ("P1", "go", "O1", 1, (80, 150), 10), ("P1", "go", "O2", 1, (80, 150), 10),
    ("N1", "go", "O1", -1, (140, 230), 14), ("N1", "go", "O2", -1, (140, 230), 14),
    ("N2", "nogo", "Fz", -1, (210, 330), 22), ("N2", "nogo", "Cz", -1, (210, 330), 22),
    ("P3", "go", "Pz", 1, (280, 560), 35),
    ("P3", "nogo", "Cz", 1, (300, 600), 38), ("P3", "nogo", "Fz", 1, (300, 600), 38),
    ("P3a", "novelty", "Cz", 1, (250, 420), 30),
    ("CNV", "go", "Cz", 0, (-200, 0), None),
]


def read_peak(wave, site, pol, win):
    """Amplitude and latency read off a waveform: largest peak of the polarity in the window, or
    the mean over the window for the CNV."""
    y = np.asarray(wave)[CHANNELS.index(site)]
    m = (ERP_T >= win[0]) & (ERP_T <= win[1])
    if pol == 0:
        return float(y[m].mean()), None
    k = np.where(m)[0][np.argmax(pol * y[m])]
    return float(y[k]), int(ERP_TIMES[k])


def _fit(cond, mods, extra, key, site, pol, win, target, what="amp"):
    """Amplitude factor (what="amp") or latency shift (what="lat") of one generator that puts the
    peak of the waveform plus the given noise at the target value (secant steps)."""
    def meas(v):
        mm = dict(mods)
        fa, dl = mods.get(key, (1.0, 0.0))
        mm[key] = (v, dl) if what == "amp" else (fa, v)
        amp, lat = read_peak(erp_waves(cond, mm) + extra, site, pol, win)
        return amp if what == "amp" else lat
    if what == "lat":  # latency moves in 4 ms samples: scan the shift instead of secant steps
        return float(min(np.arange(-60.0, 120.0, 1.0), key=lambda v: abs(meas(v) - target)))
    v0 = mods.get(key, (1.0, 0.0))[0]
    v1 = v0 + 0.2
    m0, m1 = meas(v0), meas(v1)
    for _ in range(8):
        if abs(m1 - m0) < 1e-9 or abs(m1 - target) < (0.01 if what == "amp" else 2):
            break
        v0, v1, m0 = v1, v1 + (target - m1) * (v1 - v0) / (m1 - m0), m1
        m1 = meas(v1)
    return float(v1)


def person_erp_mods(prng):
    """The child's own, stable variation of every generator: amplitude factor and latency shift."""
    return {c: {key: (float(np.clip(1 + 0.15 * prng.normal(), 0.6, 1.4)), float(6 * prng.normal()))
                for key, *_ in erp_generators(c)} for c, _ in VCPT_TYPES}


def erps(profile, rng, accepted, person):
    out = {"times_ms": ERP_TIMES.tolist(), "conditions": {}, "peaks": []}
    norm = {c: erp_waves(c) for c, _ in VCPT_TYPES}
    sds = {c: erp_norm_sd(norm[c]) for c in norm}
    spec = {(n, c, s): (pol, win, lsd) for n, c, s, pol, win, lsd in ERP_PEAKS}

    def target(name, cond, site, z, what="amp"):
        pol, win, lsd = spec[(name, cond, site)]
        amp, lat = read_peak(norm[cond], site, pol, win)
        if what == "lat":
            return lat + z * lsd
        i = CHANNELS.index(site)
        sd = sds[cond][i, (ERP_T >= win[0]) & (ERP_T <= win[1])].mean() if lat is None \
            else sds[cond][i, list(ERP_TIMES).index(lat)]
        return amp + z * sd

    # residual background EEG of this recording, from its number of accepted trials
    noise = {c: erp_noise(rng, accepted[c]) for c, _ in VCPT_TYPES}
    # the child's own variation of every generator, a little drift between recordings, then the
    # profile targets, fitted on the noisy waveform so the table shows the intended z
    mods = {c: {k: (fa * (1 + 0.05 * rng.normal()), dl + 3 * rng.normal())
                for k, (fa, dl) in person["erp"][c].items()} for c in person["erp"]}
    nogo = mods["nogo"]
    for _ in range(2):
        nogo["P3"] = (nogo["P3"][0], _fit("nogo", nogo, noise["nogo"], "P3", "Cz", 1, (300, 600),
                                          target("P3", "nogo", "Cz", 1.2, "lat"), "lat"))
        nogo["P3"] = (_fit("nogo", nogo, noise["nogo"], "P3", "Cz", 1, (300, 600),
                           target("P3", "nogo", "Cz", profile["p3_nogo_z"])), nogo["P3"][1])
    nogo["N2"] = (_fit("nogo", nogo, noise["nogo"], "N2", "Fz", -1, (210, 330),
                       target("N2", "nogo", "Fz", -profile["n2_nogo_z"])), nogo["N2"][1])
    cnv = _fit("go", mods["go"], noise["go"], "CNV", "Cz", 0, (-200, 0),
               target("CNV", "go", "Cz", -profile["cnv_z"]))
    mods["go"]["CNV"] = mods["nogo"]["CNV"] = (cnv, 0.0)

    for cond, legacy in VCPT_TYPES:
        pat = erp_waves(cond, mods[cond]) + noise[cond]
        rows = {}
        for i, ch in enumerate(CHANNELS):
            rows[ch] = {"patient_uv": np.round(pat[i], 2).tolist(),
                        "norm_mean_uv": np.round(norm[cond][i], 2).tolist(),
                        "norm_sd_uv": np.round(sds[cond][i], 2).tolist()}
        out["conditions"][cond] = {"legacy_code": legacy, "channels": rows}

    # peaks are read off the rounded curves the figures draw, so table and curves agree
    for name, cond, site, pol, win, lat_sd in ERP_PEAKS:
        ch = out["conditions"][cond]["channels"][site]
        amp_n, lat_n = read_peak(_one(ch["norm_mean_uv"], site), site, pol, win)
        amp, lat = read_peak(_one(ch["patient_uv"], site), site, pol, win)
        sd_t = np.array(ch["norm_sd_uv"])
        amp_sd = sd_t[(ERP_T >= win[0]) & (ERP_T <= win[1])].mean() if lat is None \
            else sd_t[list(ERP_TIMES).index(lat_n)]
        peak = {"component": name, "condition": cond, "site": site,
                "amplitude_uv": r2(amp), "amplitude_z": r2((amp - amp_n) / amp_sd)}
        if lat is not None:
            peak.update({"latency_ms": lat, "latency_z": r2((lat - lat_n) / lat_sd),
                         "norm_amplitude_uv": r2(amp_n), "norm_latency_ms": lat_n})
        else:
            peak.update({"latency_ms": None, "latency_z": None,
                         "window_ms": f"{win[0]} to {win[1]}", "norm_amplitude_uv": r2(amp_n)})
        out["peaks"].append(peak)
    return out


def _one(row, site):
    """A channels x time array holding one channel's row at its index (for read_peak)."""
    a = np.zeros((len(CHANNELS), len(ERP_T)))
    a[CHANNELS.index(site)] = row
    return a


def vcpt_behaviour(profile, age, rng):
    # Norm per age (invented): omissions and commissions as counts with a skewed norm, so
    # z is computed on a square-root scale.
    def count_z(n, mu, sd):
        return (math.sqrt(n) - mu) / sd
    om, co = profile["omissions"], profile["commissions"]
    z_om = count_z(om, 1.6 - 0.04 * (age - 8), 0.75)
    z_co = count_z(co, 1.5 - 0.04 * (age - 8), 0.7)
    rt_mu, rt_sd = 430 - 6 * (age - 8), 55
    rv_mu, rv_sd = 96 - 2 * (age - 8), 22
    z_rt = (profile["rt_mean"] - rt_mu) / rt_sd
    z_rv = (profile["rt_sd"] - rv_mu) / rv_sd
    # errors per block of 40 trials (10 blocks), shown as a figure without norms
    total = om + co
    w = np.linspace(0.7, 1.3, 10)
    per_block = rng.multinomial(total, w / w.sum())
    return {
        "trials": {"go": 100, "nogo": 100, "ignore": 100, "novelty": 100},
        "omissions": {"value": om, "z": r2(z_om), "percentile": pct(z_om)},
        "commissions": {"value": co, "z": r2(z_co), "percentile": pct(z_co)},
        "rt_mean_ms": {"value": profile["rt_mean"], "z": r2(z_rt), "percentile": pct(z_rt)},
        "rt_sd_ms": {"value": profile["rt_sd"], "z": r2(z_rv), "percentile": pct(z_rv)},
        "errors_per_block": per_block.tolist(),
    }


def signal_quality(profile, rng):
    rej = profile["rejected_go"]
    accepted = {"go": 100 - profile["omissions"] - rej // 3,
                "nogo": 100 - profile["commissions"] - rej // 2,
                "ignore": 100 - rej // 2 - 3, "novelty": 100 - rej // 3 - 2}
    if profile["seed"] == 1:
        accepted["nogo"] = 48  # earlier measurement: below 50, triggers a warning
    return {
        "recordings": {
            "EO": {"recorded_s": 180, "analysed_s": 151 if profile["seed"] == 1 else 164},
            "EC": {"recorded_s": 180, "analysed_s": 158 if profile["seed"] == 1 else 171},
            "VCPT": {"recorded_s": 1220, "analysed_s": 1104 if profile["seed"] == 1 else 1168},
        },
        "accepted_trials": accepted,
        "ica": {
            "n_components": 19,
            "proposed_removed": [
                {"ic": 1, "kind": "eye blinks", "confidence": 0.97},
                {"ic": 2, "kind": "horizontal eye movements", "confidence": 0.91},
                {"ic": 6, "kind": "muscle, left temporal", "confidence": 0.64},
            ],
            "clinician_change": None if profile["seed"] == 1 else
            {"action": "kept", "ic": 6, "reason_placeholder": "[Clinician's reason]"},
        },
        "mains_notch_hz": 50,
        "reference": "average of 19 scalp channels",
    }


def raw_excerpt(cond, rng, apf=8.9, seconds=10, fs=128):
    """Synthetic raw EEG excerpt (uV) for the raw view, 19 channels."""
    n = seconds * fs
    t = np.arange(n) / fs
    data = {}
    blink_times = [1.4, 4.9, 8.2] if cond == "EO" else []
    for ch in CHANNELS:
        post = _region_weight(ch, (0, -0.8), 0.5)
        front = _region_weight(ch, (0, 0.6), 0.45)
        sig = np.convolve(rng.normal(0, 9, n), np.ones(5) / 5, mode="same")
        alpha_amp = (28 if cond == "EC" else 9) * (0.25 + post)
        env = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t + rng.uniform(0, 6))
        sig += alpha_amp * env * np.sin(2 * np.pi * apf * t + rng.uniform(0, 6))
        sig += 12 * front * np.sin(2 * np.pi * 5.6 * t + rng.uniform(0, 6))
        for bt in blink_times:
            sig += 140 * _region_weight(ch, (0, 1.0), 0.35) * np.exp(-((t - bt) ** 2) / 0.012)
        data[ch] = np.round(sig, 1).tolist()
    return {"fs": fs, "seconds": seconds, "channels": data}


def measurement(key, date, age):
    profile = PROFILES[key]
    rng = np.random.default_rng(SEED + profile["seed"])
    # the same child in both measurements: stable individual deviations come from one seed
    prng = np.random.default_rng(SEED)
    person = {"spec": smooth_field(prng, len(FREQS), width=0.5, col_sigma=2.0),
              "coh": smooth_field(prng, len(BANDS), width=0.55, col_sigma=1.0),
              "erp": person_erp_mods(prng)}
    quality = signal_quality(profile, rng)
    return {
        "id": f"M-{key.upper()}",
        "date": date,
        "age_years": age,
        "conditions_recorded": ["EO", "EC", "VCPT"],
        "recording_system": "Mitsar amplifier, WinEEG file (mockup label)",
        "processed_with": {"software": SOFTWARE_VERSION, "norms": NORM_VERSION,
                           "reprocessed": key == "m1"},
        "spectra": spectra_and_bands(profile, age, rng, person),
        "coherence": coherence(profile, rng, person),
        "erp": erps(profile, rng, quality["accepted_trials"], person),
        "vcpt": vcpt_behaviour(profile, age, rng),
        "quality": quality,
        "raw": {c: raw_excerpt(c, rng, profile["apf"][c]) for c in CONDITIONS},
    }


def build_case():
    return {
        "_notice": "Mockup, synthetic data. Invented values; not a real patient.",
        "case_code": "MOCK-042",
        # Identity is kept apart from the analysis (spec 3.6); the analysis sees code, age, sex.
        "identity_store": {"display_name": "Mock Patient 042", "birth_date": "2016-01-01"},
        "sex": "female",
        "channels": CHANNELS,
        "positions": POS,
        "bands": [{"name": n, "lo": lo, "hi": hi} for n, lo, hi in BANDS],
        "asym_pairs": [f"{l}-{r}" for l, r in ASYM_PAIRS],
        "measurements": [measurement("m1", "2026-03-12", 10.2),
                         measurement("m2", "2026-09-15", 10.7)],
    }


def main(out=Path(__file__).resolve().parent.parent / "data" / "synthetic" / "case_mock042.json"):
    out.parent.mkdir(parents=True, exist_ok=True)
    case = build_case()
    out.write_text(json.dumps(case, separators=(",", ":")))
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
