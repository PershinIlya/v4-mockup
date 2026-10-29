"""Synthetic data generator for the V4 mockup.

Everything here is invented. Values are plausible for a child but deliberately artificial
(round birth date, code-number identity, fixed random seed). Nothing is derived from a real
recording or a real normative database.

Model: a synthetic norm sample (400 children drawn from the same model) gives the mean and
standard deviation of every measure at the patient's age, so a value without a stable deviation
has a z with unit variance and about 4.6 % of values lie beyond 2 z by chance. The child adds
random deviations, smooth across the scalp and partly the child's own (shared by both
measurements), and four stable deviations of 3.5 to 4.5 z. Every printed value, z and percentile
is internally consistent. Each z gets a boolean "marked" from a stand-in correction for multiple
comparisons (mockup assumption M33).

Night round of 29 October: a third, earliest measurement M0 of the same child (uploaded later,
mockup assumption M55), two further people with one measurement each (MOCK-057 with eyes open
below the minimum analysed time, MOCK-061 outside the norm age range; M58), frequency marker
suggestions (M57), method facts, recording conditions and reproducibility rows (M60, M62, M64).
M1 and M2 keep every value they had.

Usage: python3 -m mockup.synth  (writes data/synthetic/case_mock042.json, case_mock057.json and
case_mock061.json)
"""

import json
import math
from pathlib import Path

import numpy as np

SEED = 20261029
PERSON_SEED = SEED + 11909  # the child's own stable random deviations (picked, see M1)
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
    """Unit-SD random field over channels x columns, smooth across the scalp and the columns,
    rescaled per draw (coherence; its pair z are standardised with the covariance COV).

    Homologous left and right sites share most of their deviation (antisym sets how much of the
    left-right difference is kept), as in real recordings."""
    n = _smooth_rows(rng.normal(0, 1, (len(CHANNELS), ncols)), col_sigma)
    n = _spatial_kernel(width) @ n
    sym, anti = (n + n[MIRROR]) / 2, (n - n[MIRROR]) / 2
    n = sym + antisym * anti
    return n / n.std()


_FIELD_SD = {}


def _field_sd(ncols, width, col_sigma):
    """Per-channel SD of the smoothed, mirrored white noise behind scalp_field (estimated once)."""
    key = (ncols, width, col_sigma)
    if key not in _FIELD_SD:
        rng = np.random.default_rng(NORM_SEED + 40)
        x = np.array([_raw_field(rng, ncols, width, col_sigma) for _ in range(500)])
        _FIELD_SD[key] = x.std(axis=(0, 2))[:, None]
        g = np.array([_smooth_rows(rng.normal(0, 1, (1, ncols)), col_sigma) for _ in range(500)])
        _FIELD_SD[key, "common"] = float(g.std())
    return _FIELD_SD[key], _FIELD_SD[key, "common"]


def _raw_field(rng, ncols, width, col_sigma, antisym=0.2):
    n = _smooth_rows(rng.normal(0, 1, (len(CHANNELS), ncols)), col_sigma)
    n = _spatial_kernel(width) @ n
    sym, anti = (n + n[MIRROR]) / 2, (n - n[MIRROR]) / 2
    return sym + antisym * anti


SPEC_COMMON = 0.6     # share of a spectral random part common to all sites


def scalp_field(rng, ncols, width=0.5, col_sigma=2.0, common=SPEC_COMMON):
    """Random field for the spectra with unit variance at every channel and column (over
    subjects, not rescaled per draw): a part common to all sites, as one child's power is
    higher or lower at every electrode alike, plus a part smooth across the scalp. The common
    part keeps the scalp distribution of the norm (for example posterior alpha several times
    frontal alpha with the eyes closed) recognisable in every child."""
    sd, gsd = _field_sd(ncols, width, col_sigma)
    local = _raw_field(rng, ncols, width, col_sigma) / sd
    glob = _smooth_rows(rng.normal(0, 1, (1, ncols)), col_sigma) / gsd
    return math.sqrt(common) * glob + math.sqrt(1 - common) * local


# ---------------------------------------------------------------------------------------------
# Norms (mockup norm set; invented). The norm of every measure is the mean and SD of that measure
# over a synthetic norm sample drawn from the same model as the patient, so that a patient
# without stable deviations gets z values with unit variance (about 4.6 % beyond 2 z by chance).
# ---------------------------------------------------------------------------------------------

N_NORM = 400          # synthetic subjects in the mock norm sample
NORM_SEED = 72026
APF_SPREAD = 0.65     # between-subject SD of the alpha peak in the model, Hz
GAIN_SPREAD = 0.12    # between-subject SD of the alpha amplitude factor
PERSON_SHARE = 0.55   # share of the random variance that is the child's own (same in both
                      # measurements); the rest differs from recording to recording
BB_PERSON_SHARE = 0.85  # the same for the broadband part of the spectra: a child's overall power
                        # (skull, scalp, head size) changes little between measurements, so a
                        # pair of measurements does not show a drop of every band alike


def _apf_centre(age, cond):
    # children's alpha peak rises with age (about 9.2 Hz at 10 years); a little lower eyes open.
    # From 18 years it falls slowly again (about 9.2 Hz at 75 years; only the synthetic adult
    # MOCK-061, whose age lies outside the norm range, uses that part).
    if age > 18:
        return 9.8 - 0.01 * (age - 18) + (0.0 if cond == "EC" else -0.1)
    return 9.0 + 0.08 * (age - 8) + (0.0 if cond == "EC" else -0.1)


def model_spectrum(age, cond, apf=None, alpha_gain=1.0):
    """Model log10 power (uV^2/Hz, average reference) per channel x frequency.

    Aperiodic 1/f background (exponent about 1.25, temporal sites lower), a fronto-central theta
    shoulder near 6 Hz, an alpha peak that is largest at posterior sites and grows strongly with
    the eyes closed but is present at every site, a small central 13 Hz bump and posterior slow
    activity of youth with the eyes closed."""
    f = FREQS
    apf = _apf_centre(age, cond) if apf is None else apf
    lf = np.log10(f)
    mean = np.zeros((len(CHANNELS), len(f)))
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
        # with the eyes closed the posterior alpha peak reaches about 20 times the background,
        # the frontal one about 1.6 times, so posterior alpha band power is several times the
        # frontal; with the eyes open the posterior peak is blocked to about a third
        if cond == "EC":
            alpha_amp = alpha_gain * (1.36 * post + 0.20)
        else:
            alpha_amp = alpha_gain * (0.82 * post + 0.10)
        theta_amp = (0.24 * front + 0.06) * max(0.4, 1.0 - 0.03 * (age - 8))
        spec = (background + alpha_amp * _gauss(f, apf, 1.0) + theta_amp * _gauss(f, 6.0, 1.2)
                + 0.06 * cent * _gauss(f, 13.0, 1.2) + 0.10 * fp * _gauss(f, 1.5, 1.0))
        if cond == "EC":
            spec += 0.10 * post * _gauss(f, 3.5, 1.0)  # posterior slow waves of youth
        mean[i] = spec
    return mean


SPEC_SMOOTH = 3.0     # smoothing of the random part across frequency, in 0.5 Hz bins
BROADBAND_SD = 0.28   # between-subject SD of a channel's power at all frequencies alike, log10


def resid_sd(cond):
    """Between-subject SD in log10 units, besides the alpha peak, the alpha amplitude and the
    broadband part, that differs between frequencies: about 0.13; with the broadband part the
    SD of absolute power is about 0.3 (a factor of 2), that of relative power about 0.07 to
    0.17, as the broadband part cancels in relative power."""
    f = FREQS
    lf = np.log10(f)
    sd = np.zeros((len(CHANNELS), len(f)))
    for i, ch in enumerate(CHANNELS):
        post = _region_weight(ch, (0, -0.85), 0.5)
        sd[i] = 0.12 + 0.015 * lf + (0.03 if cond == "EC" else 0.02) * post * _gauss(f, 9.5, 1.8)
    return sd


def random_spectrum(rng, cond, bb=None):
    """Random part of one recording in log10 units: broadband (smooth across the scalp; bb, when
    given, is shared by the conditions of one measurement) plus a part smooth across the scalp
    and the frequencies."""
    bb = scalp_field(rng, 1, width=0.5, col_sigma=0) if bb is None else bb
    return (BROADBAND_SD * bb
            + resid_sd(cond) * scalp_field(rng, len(FREQS), width=0.5, col_sigma=SPEC_SMOOTH))


def posterior_peak(logp):
    """Alpha peak frequency of the posterior mean log spectrum: the 1/f trend (straight line in
    log-log from 2 to 30 Hz) is taken off, then the maximum between 7 and 13 Hz is refined by a
    parabolic fit."""
    ix = [CHANNELS.index(c) for c in ("P3", "Pz", "P4", "O1", "O2")]
    m = np.asarray(logp)[ix].mean(axis=0)
    fit = (FREQS >= 2) & (FREQS <= 30)
    m = m - np.polyval(np.polyfit(np.log10(FREQS[fit]), m[fit], 1), np.log10(FREQS))
    win = np.where((FREQS >= 7) & (FREQS <= 13))[0]
    k = win[np.argmax(m[win])]
    a, b, c = m[k - 1], m[k], m[k + 1]
    den = a - 2 * b + c
    shift = float(np.clip(0.5 * (a - c) / den, -0.5, 0.5)) if den else 0.0
    return float(FREQS[k] + shift * (FREQS[1] - FREQS[0]))


def band_mask(lo, hi):
    return (FREQS >= lo) & (FREQS < hi)


PAIR_IX = [(CHANNELS.index(l), CHANNELS.index(r)) for l, r in ASYM_PAIRS]


def spectral_stats(logp):
    """Every spectral measure compared with a norm, on the scale its z is computed on: log10
    power per bin, log10 absolute and relative band power, log10 power per 1 Hz band, asymmetry
    (R - L) / (R + L) per pair and band, ln theta/beta at Cz, ln F4 minus ln F3 alpha, alpha peak."""
    power = 10 ** logp
    total = power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
    out = {"bins": logp}
    for name, lo, hi in BANDS:
        bp = power[:, band_mask(lo, hi)].sum(axis=1) * 0.5
        out["abs_" + name] = np.log10(bp)
        out["rel_" + name] = np.log10(bp / total)
        out["asy_" + name] = np.array([(bp[r] - bp[l]) / (bp[r] + bp[l]) for l, r in PAIR_IX])
    out["maps"] = np.array([np.log10(power[:, band_mask(lo, lo + 1)].sum(axis=1) * 0.5)
                            for lo in range(1, 30)])
    ci = CHANNELS.index("Cz")
    out["tbr"] = np.array(math.log(power[ci, band_mask(*TBR_BANDS[0])].sum()
                                   / power[ci, band_mask(*TBR_BANDS[1])].sum()))
    a = power[:, band_mask(8, 12)].sum(axis=1)
    out["faa"] = np.array(math.log(a[CHANNELS.index("F4")]) - math.log(a[CHANNELS.index("F3")]))
    out["apf"] = np.array(posterior_peak(logp))
    return out


_NORM_CACHE = {}


def spectral_norm(age, cond):
    """Mean and SD of every spectral measure over the synthetic norm sample at this age."""
    key = (round(age, 2), cond)
    if key not in _NORM_CACHE:
        rng = np.random.default_rng(NORM_SEED + CONDITIONS.index(cond))
        samples = []
        for _ in range(N_NORM):
            apf = _apf_centre(age, cond) + APF_SPREAD * rng.normal()
            gain = float(np.clip(1 + GAIN_SPREAD * rng.normal(), 0.6, 1.4))
            logp = model_spectrum(age, cond, apf, gain) + random_spectrum(rng, cond)
            samples.append(spectral_stats(logp))
        _NORM_CACHE[key] = {k: (np.mean([s[k] for s in samples], axis=0),
                                np.std([s[k] for s in samples], axis=0, ddof=1))
                            for k in samples[0]}
    return _NORM_CACHE[key]


def zs(stats, norm, k):
    mu, sd = norm[k]
    return (stats[k] - mu) / sd


# ---------------------------------------------------------------------------------------------
# Patient profile (invented). Besides random deviations the child has four stable deviations of
# 3.5 to 4.5 z in four analysis blocks, chosen not to form the published pattern of any
# condition: lower relative theta power at posterior sites, a higher SMR asymmetry index at
# C3-C4, higher beta1 coherence between left temporal, central and parietal sites, and a later
# P1 (with a later N1) over the occipital sites. Mixed on purpose between the two measurements:
# two of them move towards the norm, two away from it.
# ---------------------------------------------------------------------------------------------

REL_THETA_SITES = ("O1", "O2", "Pz")
SMR_ASYM_PAIR = "C3-C4"
COH_GROUP = {("T3", "C3"), ("T3", "T5"), ("C3", "P3"), ("T5", "P3"), ("C3", "T5"), ("P3", "O1"),
             ("T5", "O1")}
COH_GROUP_BAND = "beta1"

PROFILES = {
    # Earlier measurement (March 2026) and current measurement (September 2026).
    "m1": {"apf": {"EO": 8.8, "EC": 8.9}, "alpha_gain": 0.94,
           "rel_theta_post_z": -3.7, "smr_asym_z": 3.6, "coh_group_z": 4.2, "p1_latency_z": 4.4,
           "omissions": 3, "commissions": 5, "rt_mean": 421, "rt_sd": 95,
           "rejected_go": 36, "seed": 1, "rng": 3940},
    "m2": {"apf": {"EO": 9.0, "EC": 9.1}, "alpha_gain": 1.0,
           "rel_theta_post_z": -4.2, "smr_asym_z": 4.2, "coh_group_z": 3.9, "p1_latency_z": 3.8,
           "omissions": 2, "commissions": 4, "rt_mean": 409, "rt_sd": 86,
           "rejected_go": 9, "seed": 2, "rng": 5229},
    # Third, earliest measurement (23 September 2025, 9 years), uploaded later as an earlier
    # recording and processed again (shared document 3.4). Its own seed is picked like those of
    # M1 and M2 (mockup assumption M55); M1 and M2 do not change.
    "m0": {"apf": {"EO": 8.7, "EC": 8.8}, "alpha_gain": 0.97,
           "rel_theta_post_z": -3.9, "smr_asym_z": 3.8, "coh_group_z": 4.4, "p1_latency_z": 4.5,
           "omissions": 3, "commissions": 6, "rt_mean": 431, "rt_sd": 97,
           "rejected_go": 21, "seed": 0, "rng": 2995,
           "recordings": {"EO": (180, 158), "EC": (180, 162), "VCPT": (1220, 1131)}},
}

# Two further synthetic people with one measurement each (review B6, mockup assumption M58):
# MOCK-057 has an eyes open recording below the minimum analysed time (84 of the 120 s of M25),
# so that condition gives no results; MOCK-061 is 75 years old, outside the age range of the
# mock norms (6 to 67 years, M31), so no value is compared with a norm. Neither has a stable
# deviation; birth dates are 1 January (review D7).
EXTRA_PROFILES = {
    "MOCK-057": {"apf": {"EO": 9.5, "EC": 9.6}, "alpha_gain": 1.0,
                 "rel_theta_post_z": None, "smr_asym_z": None, "coh_group_z": None,
                 "p1_latency_z": None, "omissions": 2, "commissions": 3, "rt_mean": 392,
                 "rt_sd": 78, "rejected_go": 12, "seed": 57, "rng": 11, "person_seed": 0,
                 "recordings": {"EO": (180, 84), "EC": (180, 166), "VCPT": (1220, 1152)},
                 "below_minimum": ["EO"]},
    "MOCK-061": {"apf": {"EO": 9.2, "EC": 9.3}, "alpha_gain": 0.6,
                 "rel_theta_post_z": None, "smr_asym_z": None, "coh_group_z": None,
                 "p1_latency_z": None, "omissions": 4, "commissions": 3, "rt_mean": 468,
                 "rt_sd": 94, "rejected_go": 15, "seed": 61, "rng": 3, "person_seed": 0,
                 "recordings": {"EO": (180, 168), "EC": (180, 170), "VCPT": (1220, 1140)},
                 "no_norm": True, "power_offset": -0.3, "erp_scale": 0.55, "erp_p3_shift": 55},
}
MIN_ANALYSED_S = {"EO": 120, "EC": 120, "VCPT": 900}   # mockup assumption M25
NORM_AGE_RANGE = (6, 67)                                # mock norms, mockup assumption M31


def _smooth_box(f, lo, hi, edge=0.4):
    return 1 / (1 + np.exp(-(f - lo) / edge)) / (1 + np.exp((f - hi) / edge))


def stable_spectral_dev(h_theta, k_smr):
    """Stable deviations in log10 units: posterior theta lower by h_theta at its maximum (midline,
    so it leaves the asymmetry alone), SMR higher at C4 and lower at C3 by k_smr."""
    f = FREQS
    dev = np.zeros((len(CHANNELS), len(f)))
    for i, ch in enumerate(CHANNELS):
        dev[i] -= h_theta * _region_weight(ch, (0, -0.85), 0.36) * _smooth_box(f, 4, 8)
        lat = _region_weight(ch, (0.5, 0.0), 0.22) - _region_weight(ch, (-0.5, 0.0), 0.22)
        dev[i] += k_smr * lat * _gauss(f, 13.5, 1.0)
    return dev


def _bisect(fn, target, lo, hi, n=40):
    """Scalar root of fn(v) = target on [lo, hi], fn increasing."""
    for _ in range(n):
        mid = 0.5 * (lo + hi)
        if fn(mid) < target:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def spectra_and_bands(profile, age, rng, person):
    out = {"freqs": FREQS.tolist(), "conditions": {}}
    a, b = math.sqrt(PERSON_SHARE), math.sqrt(1 - PERSON_SHARE)
    pa, pb = math.sqrt(BB_PERSON_SHARE), math.sqrt(1 - BB_PERSON_SHARE)
    bb = scalp_field(rng, 1, width=0.5, col_sigma=0)  # electrodes and session: both conditions
    none = np.zeros((len(CHANNELS), 1))
    for cond in CONDITIONS:
        no_norm = profile.get("no_norm", False)
        norm = None if no_norm else spectral_norm(age, cond)
        # broadband part: mostly the child's own; the part that differs between frequencies:
        # PERSON_SHARE the child's own. Both keep unit variance, as in the norm sample.
        base = model_spectrum(age, cond, profile["apf"][cond], profile["alpha_gain"]) \
            + BROADBAND_SD * (pa * person["spec_bb"] + pb * bb) \
            + a * person["spec"][cond] + b * random_spectrum(rng, cond, none)
        if "power_offset" in profile:   # an adult's lower overall power (MOCK-061 only)
            base = base + profile["power_offset"]
        # size the stable deviations so the printed z hit the profile targets
        th_ix = [CHANNELS.index(c) for c in REL_THETA_SITES]
        k_pair = [f"{l}-{r}" for l, r in ASYM_PAIRS].index(SMR_ASYM_PAIR)

        def rel_theta(h):
            return -zs(spectral_stats(base + stable_spectral_dev(h, 0)), norm, "rel_theta")[th_ix].mean()

        def smr_asym(k):
            return zs(spectral_stats(base + stable_spectral_dev(0, k)), norm, "asy_smr")[k_pair]

        if profile["rel_theta_post_z"] is None:   # a person without stable deviations
            h = k = 0.0
        else:
            h = _bisect(rel_theta, -profile["rel_theta_post_z"], 0.0, 2.0)
            k = _bisect(smr_asym, profile["smr_asym_z"], 0.0, 1.0)
        logp = base + stable_spectral_dev(h, k)
        st = spectral_stats(logp)
        power = 10 ** logp
        if no_norm:
            out["conditions"][cond] = values_only_spectra(logp, st, power)
            continue
        bands = {}
        for name, lo, hi in BANDS:
            bp = power[:, band_mask(lo, hi)].sum(axis=1) * 0.5
            total = power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
            bands[name] = {
                "abs_uv2": [r2(v) for v in bp], "abs_z": [r2(v) for v in zs(st, norm, "abs_" + name)],
                "rel_pct": [r2(100 * v) for v in bp / total],
                "rel_z": [r2(v) for v in zs(st, norm, "rel_" + name)],
            }
        # maps per 1 Hz band, 1-2 Hz up to 29-30 Hz: z of absolute power
        maps_1hz = [[r2(v) for v in row] for row in zs(st, norm, "maps")]
        apf_mu, apf_sd = (float(v) for v in norm["apf"])
        apf = round(float(st["apf"]), 1)
        mu, sd = norm["bins"]
        out["conditions"][cond] = {
            "log_power": np.round(logp, 3).tolist(),
            "norm_log_mean": np.round(mu, 3).tolist(),
            "norm_log_sd": np.round(sd, 3).tolist(),
            "z": np.round((logp - mu) / sd, 2).tolist(),
            "bands": bands,
            "maps_1hz_z": maps_1hz,
            "alpha_peak": {"site": "posterior mean (P3, Pz, P4, O1, O2)", "hz": apf,
                           "norm_mean": r2(apf_mu), "norm_sd": r2(apf_sd),
                           "z": r2((apf - apf_mu) / apf_sd)},
        }
        # theta/beta ratio at Cz (number only, no condition wording); z on the log scale
        tmu, tsd = (float(v) for v in norm["tbr"])
        out["conditions"][cond]["tbr"] = {"site": "Cz", "value": r2(math.exp(st["tbr"])),
                                          "norm_mean": r2(math.exp(tmu)),
                                          "z": r2((float(st["tbr"]) - tmu) / tsd)}
        # frontal alpha asymmetry index: ln(F4 alpha) - ln(F3 alpha)
        fmu, fsd = (float(v) for v in norm["faa"])
        out["conditions"][cond]["faa"] = {"value": r2(st["faa"]), "norm_mean": r2(fmu),
                                          "norm_sd": r2(fsd),
                                          "z": r2((float(st["faa"]) - fmu) / fsd)}
        # asymmetry map: (R - L) / (R + L) per homologous pair and band
        asym = {}
        for name, _, _ in BANDS:
            z = zs(st, norm, "asy_" + name)
            asym[name] = [{"pair": f"{l}-{r}", "value": r3(st["asy_" + name][j]), "z": r2(z[j])}
                          for j, (l, r) in enumerate(ASYM_PAIRS)]
        out["conditions"][cond]["asymmetry"] = asym
    return out


def r3(x):
    return float(np.round(x, 3))


def values_only_spectra(logp, st, power):
    """Spectral results of one condition without a norm (age outside the norm range, MOCK-061):
    the same structure as a normed condition, every norm, z and mark null. Maps per 1 Hz band are
    given as absolute power (uV^2), `maps_1hz_uv2`, in place of z (review B6)."""
    total = power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
    bands = {}
    for name, lo, hi in BANDS:
        bp = power[:, band_mask(lo, hi)].sum(axis=1) * 0.5
        bands[name] = {"abs_uv2": [r2(v) for v in bp], "abs_z": None,
                       "rel_pct": [r2(100 * v) for v in bp / total], "rel_z": None}
    return {
        "log_power": np.round(logp, 3).tolist(), "norm_log_mean": None, "norm_log_sd": None,
        "z": None, "bands": bands, "maps_1hz_z": None,
        "maps_1hz_uv2": [[r2(v) for v in 10 ** row] for row in st["maps"]],
        "alpha_peak": {"site": "posterior mean (P3, Pz, P4, O1, O2)",
                       "hz": round(float(st["apf"]), 1), "norm_mean": None, "norm_sd": None,
                       "z": None},
        "tbr": {"site": "Cz", "value": r2(math.exp(st["tbr"])), "norm_mean": None, "z": None},
        "faa": {"value": r2(st["faa"]), "norm_mean": None, "norm_sd": None, "z": None},
        "asymmetry": {name: [{"pair": f"{l}-{r}", "value": r3(st["asy_" + name][j]), "z": None}
                             for j, (l, r) in enumerate(ASYM_PAIRS)] for name, _, _ in BANDS},
    }


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


PAIRS = [(a, b) for i, a in enumerate(CHANNELS) for b in CHANNELS[i + 1:]]
_IA = np.array([CHANNELS.index(a) for a, _ in PAIRS])
_IB = np.array([CHANNELS.index(b) for _, b in PAIRS])
COH_SHARED = 0.3  # share of a pair's random variance that comes from its two channels


def _coh_cov():
    """Covariance between the channel effects of the smooth field (estimated once)."""
    rng = np.random.default_rng(NORM_SEED + 10)
    x = np.concatenate([smooth_field(rng, len(BANDS), width=0.55, col_sigma=1.0).T
                        for _ in range(600)])
    return np.cov(x.T)


COV = _coh_cov()


def _pair_z(u, e):
    """Unit-variance pair z (171 x bands) from channel effects u (19 x bands) and pair noise e."""
    v = (COV[_IA, _IA] + COV[_IB, _IB] + 2 * COV[_IA, _IB])[:, None]
    return (math.sqrt(COH_SHARED) * (u[_IA] + u[_IB]) / np.sqrt(v)
            + math.sqrt(1 - COH_SHARED) * e)


def fisher(c):
    return np.arctanh(np.sqrt(c))


def _coh_fisher_norm(cond):
    """Norm of every pair and band on Fisher's scale atanh(sqrt(coherence)), where coherence is
    roughly normal: mean from the norm coherence, SD from its SD (delta method), at most a fifth
    of the mean so that low coherence between distant sites stays above zero."""
    mu = np.array([[coherence_norm(a, b, n, cond)[0] for n, _, _ in BANDS] for a, b in PAIRS])
    sd = np.array([[coherence_norm(a, b, n, cond)[1] for n, _, _ in BANDS] for a, b in PAIRS])
    fm = fisher(mu)
    return fm, np.minimum(sd / (2 * np.sqrt(mu) * (1 - mu)), fm / 5)


def _coh_values(z, cond):
    """Coherence values from pair z on Fisher's scale (always between 0 and 1)."""
    fm, fs = _coh_fisher_norm(cond)
    return np.tanh(np.maximum(fm + z * fs, 0.0)) ** 2


_GLOBAL_NORM = {}


def global_coherence_norm(cond):
    if cond not in _GLOBAL_NORM:
        rng = np.random.default_rng(NORM_SEED + 20 + CONDITIONS.index(cond))
        g = []
        for _ in range(N_NORM):
            z = _pair_z(smooth_field(rng, len(BANDS), width=0.55, col_sigma=1.0),
                        rng.normal(0, 1, (len(PAIRS), len(BANDS))))
            g.append(_coh_values(z, cond).mean(axis=0))
        _GLOBAL_NORM[cond] = (np.mean(g, axis=0), np.std(g, axis=0, ddof=1))
    return _GLOBAL_NORM[cond]


def coherence(profile, rng, person):
    out = {}
    a, b = math.sqrt(PERSON_SHARE), math.sqrt(1 - PERSON_SHARE)
    kb = [n for n, _, _ in BANDS].index(COH_GROUP_BAND)
    group = np.array([(x, y) in COH_GROUP or (y, x) in COH_GROUP for x, y in PAIRS])
    for cond in CONDITIONS:
        u = a * person["coh"] + b * smooth_field(rng, len(BANDS), width=0.55, col_sigma=1.0)
        z = _pair_z(u, rng.normal(0, 1, (len(PAIRS), len(BANDS))))
        # stable deviation: the group's z sits at the target with a little spread
        if profile["coh_group_z"] is not None:
            target = profile["coh_group_z"] - (0.2 if cond == "EO" else 0.0)
            z[group, kb] = target + 0.15 * z[group, kb]
        val = _coh_values(z, cond)
        no_norm = profile.get("no_norm", False)
        gmu, gsd = (None, None) if no_norm else global_coherence_norm(cond)
        per_band = {}
        for k, (name, _, _) in enumerate(BANDS):
            rows = [{"pair": f"{x}-{y}", "value": r3(val[j, k]),
                     "z": None if no_norm else r2(z[j, k])}
                    for j, (x, y) in enumerate(PAIRS)]
            g = float(val[:, k].mean())
            per_band[name] = {"pairs": rows,
                              "global": {"value": r3(g),
                                         "z": None if no_norm else r2((g - gmu[k]) / gsd[k]),
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
    mods: {key: (amplitude factor, latency shift ms)} for one child."""
    mods = mods or {}
    w = np.zeros((len(CHANNELS), len(ERP_T)))
    for key, topo, lat, amp, width in erp_generators(cond):
        fa, dl = mods.get(key, (1.0, 0.0))
        gain = _gain(topo)
        shape = _cnv_shape(ERP_T) if key == "CNV" else \
            np.exp(-((ERP_T - lat - dl) ** 2) / (2 * width ** 2))
        w += gain * amp * fa * shape[None, :]
    return w - w.mean(axis=0, keepdims=True)  # average reference of 19 scalp channels


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


def erp_background(rng, rms=1.4):
    """A child's own slow waveform differences (not tied to a component), smooth in time and
    across the scalp, average referenced."""
    x = _smooth_rows(rng.normal(0, 1, (len(CHANNELS), len(ERP_T))), 12.0)
    x = _spatial_kernel(0.6) @ x
    x -= x.mean(axis=0, keepdims=True)
    return x / x.std() * rms


ERP_PEAKS = [
    # component, trial type, site, polarity (+1 maximum, -1 minimum, 0 window mean), window (ms)
    ("P1", "go", "O1", 1, (70, 170)), ("P1", "go", "O2", 1, (70, 170)),
    ("N1", "go", "O1", -1, (140, 250)), ("N1", "go", "O2", -1, (140, 250)),
    ("N2", "nogo", "Fz", -1, (210, 330)), ("N2", "nogo", "Cz", -1, (210, 330)),
    ("P3", "go", "Pz", 1, (280, 560)),
    ("P3", "nogo", "Cz", 1, (300, 600)), ("P3", "nogo", "Fz", 1, (300, 600)),
    ("P3a", "novelty", "Cz", 1, (250, 420)),
    ("CNV", "go", "Cz", 0, (-200, 0)),
]
NORM_TRIALS = 90  # accepted trials per type in the norm sample


def read_peak(wave, site, pol, win):
    """Amplitude and latency read off a waveform: largest peak of the polarity in the window, or
    the mean over the window for the CNV."""
    y = np.asarray(wave)[CHANNELS.index(site)]
    m = (ERP_T >= win[0]) & (ERP_T <= win[1])
    if pol == 0:
        return float(y[m].mean()), None
    k = np.where(m)[0][np.argmax(pol * y[m])]
    return float(y[k]), int(ERP_TIMES[k])


def _lat_sd(lat):
    return 2.0 + 0.05 * lat  # between-subject latency SD grows with latency


def person_erp_mods(prng):
    """A child's own, stable variation of every generator: amplitude factor and latency shift."""
    return {c: {key: (float(np.clip(1 + 0.2 * prng.normal(), 0.5, 1.5)),
                      float(_lat_sd(lat) * prng.normal()))
                for key, _, lat, *_ in erp_generators(c)} for c, _ in VCPT_TYPES}


_ERP_NORM = None


def erp_norm():
    """Pointwise mean and SD of the waveforms and mean and SD of every peak over the norm sample."""
    global _ERP_NORM
    if _ERP_NORM is None:
        rng = np.random.default_rng(NORM_SEED + 30)
        waves = {c: [] for c, _ in VCPT_TYPES}
        peaks = []
        for _ in range(N_NORM):
            mods = person_erp_mods(rng)
            w = {c: erp_waves(c, mods[c]) + erp_background(rng) + erp_noise(rng, NORM_TRIALS)
                 for c, _ in VCPT_TYPES}
            for c in w:
                waves[c].append(w[c])
            peaks.append([read_peak(w[c], s, pol, win) for _, c, s, pol, win in ERP_PEAKS])
        out = {"mean": {c: np.mean(v, axis=0) for c, v in waves.items()},
               "sd": {c: np.std(v, axis=0, ddof=1) for c, v in waves.items()}, "peaks": []}
        for j, (_, _, _, pol, _) in enumerate(ERP_PEAKS):
            amps = [p[j][0] for p in peaks]
            lats = [p[j][1] for p in peaks] if pol else None
            out["peaks"].append({"amp": (float(np.mean(amps)), float(np.std(amps, ddof=1))),
                                 "lat": (float(np.mean(lats)), float(np.std(lats, ddof=1)))
                                 if lats else None})
        _ERP_NORM = out
    return _ERP_NORM


def _fit_latency(cond, mods, extra, keys, site, pol, win, target):
    """Extra latency shift of the given generators that puts the peak of the waveform plus the
    given background at the target latency (latency moves in 4 ms samples, so scan the shift)."""
    def meas(v):
        mm = dict(mods)
        for key in keys:
            mm[key] = (mods[key][0], mods[key][1] + v)
        return read_peak(erp_waves(cond, mm) + extra, site, pol, win)[1]
    return float(min(np.arange(-40.0, 80.0, 0.5), key=lambda v: (abs(meas(v) - target), abs(v))))


def erps(profile, rng, accepted, person):
    out = {"times_ms": ERP_TIMES.tolist(), "conditions": {}, "peaks": []}
    norm = erp_norm()
    a, b = math.sqrt(PERSON_SHARE), math.sqrt(1 - PERSON_SHARE)
    # the child's own variation of every generator with a little drift between recordings, the
    # child's own slow waveform differences, and residual background EEG from the accepted trials
    mods = {c: {k: (fa * (1 + 0.05 * rng.normal()), dl + 2 * rng.normal())
                for k, (fa, dl) in person["erp"][c].items()} for c in person["erp"]}
    extra = {c: a * person["erp_bg"][c] + b * erp_background(rng) + erp_noise(rng, accepted[c])
             for c, _ in VCPT_TYPES}
    if "erp_scale" in profile:   # an adult's smaller and later components (MOCK-061 only)
        for c in mods:
            mods[c] = {k: (fa * profile["erp_scale"],
                           dl + (profile["erp_p3_shift"] if k.startswith("P3") else 0.0))
                       for k, (fa, dl) in mods[c].items()}
        extra = {c: profile["erp_scale"] * x for c, x in extra.items()}
    # stable deviation: the occipital P1 later in every trial type, sized on P1 at O1, Go
    if profile["p1_latency_z"] is not None:
        j = next(i for i, p in enumerate(ERP_PEAKS) if p[:3] == ("P1", "go", "O1"))
        mu, sd = norm["peaks"][j]["lat"]
        shift = _fit_latency("go", mods["go"], extra["go"], ("P1",), "O1", 1, ERP_PEAKS[j][4],
                             round(mu + profile["p1_latency_z"] * sd))
        for c in mods:
            mods[c]["P1"] = (mods[c]["P1"][0], mods[c]["P1"][1] + shift)
    no_norm = profile.get("no_norm", False)

    for cond, legacy in VCPT_TYPES:
        pat = erp_waves(cond, mods[cond]) + extra[cond]
        rows = {}
        for i, ch in enumerate(CHANNELS):
            rows[ch] = {"patient_uv": np.round(pat[i], 2).tolist(),
                        "norm_mean_uv": None if no_norm else np.round(norm["mean"][cond][i], 2).tolist(),
                        "norm_sd_uv": None if no_norm else np.round(norm["sd"][cond][i], 2).tolist()}
        out["conditions"][cond] = {"legacy_code": legacy, "channels": rows}

    # peaks are read off the rounded curves the figures draw; their norms are the mean and SD of
    # the peaks of the norm sample
    for (name, cond, site, pol, win), pn in zip(ERP_PEAKS, norm["peaks"]):
        ch = out["conditions"][cond]["channels"][site]
        amp, lat = read_peak(_one(ch["patient_uv"], site), site, pol, win)
        if no_norm:
            peak = {"component": name, "condition": cond, "site": site, "amplitude_uv": r2(amp),
                    "amplitude_z": None, "latency_ms": lat, "latency_z": None,
                    "norm_amplitude_uv": None}
            if lat is None:
                peak["window_ms"] = f"{win[0]} to {win[1]}"
            else:
                peak["norm_latency_ms"] = None
            out["peaks"].append(peak)
            continue
        (am, asd) = pn["amp"]
        peak = {"component": name, "condition": cond, "site": site,
                "amplitude_uv": r2(amp), "amplitude_z": r2((amp - am) / asd)}
        if lat is not None:
            lm, lsd = pn["lat"]
            peak.update({"latency_ms": lat, "latency_z": r2((lat - lm) / lsd),
                         "norm_amplitude_uv": r2(am), "norm_latency_ms": int(round(lm))})
        else:
            peak.update({"latency_ms": None, "latency_z": None,
                         "window_ms": f"{win[0]} to {win[1]}", "norm_amplitude_uv": r2(am)})
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
    if profile.get("no_norm"):   # values only, no norm at this age (MOCK-061)
        return {
            "trials": {"go": 100, "nogo": 100, "ignore": 100, "novelty": 100},
            **{k: {"value": v, "z": None, "percentile": None}
               for k, v in (("omissions", om), ("commissions", co),
                            ("rt_mean_ms", profile["rt_mean"]), ("rt_sd_ms", profile["rt_sd"]))},
            "errors_per_block": per_block.tolist(),
        }
    return {
        "trials": {"go": 100, "nogo": 100, "ignore": 100, "novelty": 100},
        "omissions": {"value": om, "z": r2(z_om), "percentile": pct(z_om)},
        "commissions": {"value": co, "z": r2(z_co), "percentile": pct(z_co)},
        "rt_mean_ms": {"value": profile["rt_mean"], "z": r2(z_rt), "percentile": pct(z_rt)},
        "rt_sd_ms": {"value": profile["rt_sd"], "z": r2(z_rv), "percentile": pct(z_rv)},
        "errors_per_block": per_block.tolist(),
    }


# ---------------------------------------------------------------------------------------------
# Marking (mockup assumption M33): a stand-in for the correction for multiple comparisons that the
# core will use (shared document 3.2, working decision; the method is chosen at implementation).
# Benjamini-Hochberg false discovery rate at q = 0.05 within each analysis block, two-sided p
# from z. A block is one analysis family in one condition.
# ---------------------------------------------------------------------------------------------

FDR_Q = 0.05
P_BEYOND_2 = math.erfc(2 / math.sqrt(2))  # 0.0455: share beyond 2 z by chance


def _hu1(z):
    """z rounded half up to one decimal, as printed."""
    from decimal import ROUND_HALF_UP, Decimal
    return float(Decimal(str(z)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def bh_marks(zvals, q=FDR_Q):
    """Benjamini-Hochberg step-up on two-sided p values; returns one boolean per value."""
    p = np.array([math.erfc(abs(z) / math.sqrt(2)) for z in zvals])
    n = len(p)
    order = np.argsort(p)
    ok = p[order] <= q * np.arange(1, n + 1) / n
    k = np.max(np.where(ok)[0]) + 1 if ok.any() else 0
    marked = np.zeros(n, dtype=bool)
    marked[order[:k]] = True
    return marked.tolist()


def mark_measurement(m):
    """Adds a boolean "marked" next to every z and returns the per-block counts."""
    blocks = []

    def block(bid, family, cond, items):
        """items: list of (z, setter); setter(bool) stores the mark."""
        marks = bh_marks([z for z, _ in items])
        for (_, put), mk in zip(items, marks):
            put(mk)
        blocks.append({"id": bid, "family": family, "condition": cond, "n": len(items),
                       "beyond2_uncorrected": sum(abs(_hu1(z)) >= 2 for z, _ in items),
                       "expected_by_chance": round(len(items) * P_BEYOND_2, 1),
                       "marked": int(sum(marks))})

    def setter(obj, key, idx=None):
        if idx is None:
            return lambda v: obj.__setitem__(key, v)
        return lambda v: obj[key].__setitem__(idx, v)

    for cond in CONDITIONS:
        c = m["spectra"]["conditions"][cond]
        if c is None:   # no results for this condition (below the minimum analysed time)
            continue
        c["z_marked"] = [[False] * len(r) for r in c["z"]]
        block(f"spectrum_{cond}", "spectrum per 0.5 Hz bin", cond,
              [(z, (lambda r, k: lambda v: c["z_marked"][r].__setitem__(k, v))(i, k))
               for i, row in enumerate(c["z"]) for k, z in enumerate(row)])
        for kind, fam in (("abs", "absolute band power"), ("rel", "relative band power")):
            items = []
            for name, _, _ in BANDS:
                bd = c["bands"][name]
                bd[kind + "_marked"] = [False] * len(bd[kind + "_z"])
                items += [(z, setter(bd, kind + "_marked", i)) for i, z in enumerate(bd[kind + "_z"])]
            block(f"{kind}_{cond}", fam, cond, items)
        c["maps_1hz_marked"] = [[False] * len(r) for r in c["maps_1hz_z"]]
        block(f"maps1hz_{cond}", "maps per 1 Hz band", cond,
              [(z, (lambda r, k: lambda v: c["maps_1hz_marked"][r].__setitem__(k, v))(i, k))
               for i, row in enumerate(c["maps_1hz_z"]) for k, z in enumerate(row)])
        block(f"indices_{cond}", "alpha peak, theta/beta ratio, frontal alpha asymmetry", cond,
              [(c[k]["z"], setter(c[k], "marked")) for k in ("alpha_peak", "tbr", "faa")])
        block(f"asym_{cond}", "asymmetry map", cond,
              [(r["z"], setter(r, "marked")) for name, _, _ in BANDS for r in c["asymmetry"][name]])
        coh = m["coherence"][cond]
        block(f"coh_{cond}", "coherence per electrode pair", cond,
              [(r["z"], setter(r, "marked")) for name, _, _ in BANDS for r in coh[name]["pairs"]])
        block(f"cohglobal_{cond}", "global coherence (core, to confirm)", cond,
              [(coh[name]["global"]["z"], setter(coh[name]["global"], "marked"))
               for name, _, _ in BANDS])
    peaks = m["erp"]["peaks"]
    for p in peaks:
        p["amplitude_marked"] = False
        p["latency_marked"] = None if p["latency_z"] is None else False
    block("erp_amp", "ERP peak amplitude", "VCPT",
          [(p["amplitude_z"], setter(p, "amplitude_marked")) for p in peaks])
    block("erp_lat", "ERP peak latency", "VCPT",
          [(p["latency_z"], setter(p, "latency_marked")) for p in peaks
           if p["latency_z"] is not None])
    v = m["vcpt"]
    block("vcpt", "VCPT task results", "VCPT",
          [(v[k]["z"], setter(v[k], "marked"))
           for k in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms")])
    return {"method": "Benjamini-Hochberg false discovery rate, q = 0.05, within each block; "
                      "two-sided p from z (mockup stand-in M33; the method is open)",
            "q": FDR_Q, "blocks": blocks}


def signal_quality(profile, rng):
    rej = profile["rejected_go"]
    accepted = {"go": 100 - profile["omissions"] - rej // 3,
                "nogo": 100 - profile["commissions"] - rej // 2,
                "ignore": 100 - rej // 2 - 3, "novelty": 100 - rej // 3 - 2}
    if profile["seed"] == 1:
        accepted["nogo"] = 48  # earlier measurement: below 50, triggers a warning
    if "recordings" in profile:   # measurements added later: durations given in the profile
        recordings = {c: {"recorded_s": r, "analysed_s": a}
                      for c, (r, a) in profile["recordings"].items()}
    else:
        recordings = {
            "EO": {"recorded_s": 180, "analysed_s": 151 if profile["seed"] == 1 else 164},
            "EC": {"recorded_s": 180, "analysed_s": 158 if profile["seed"] == 1 else 171},
            "VCPT": {"recorded_s": 1220, "analysed_s": 1104 if profile["seed"] == 1 else 1168},
        }
    return {
        "recordings": recordings,
        "accepted_trials": accepted,
        "ica": {
            "n_components": 19,
            # Legacy artefact correction kept by proposed ADR 0003 (audit 41): the map of every
            # component is correlated with six reference maps (blink, eye_h horizontal eye
            # movement, muscle_l, muscle_r and muscle_f left, right and frontal muscle,
            # amplifier) and a component is proposed for removal at |r| >= 0.9. corr is the
            # absolute correlation with the best matching reference map (absolute because ICA
            # polarity is arbitrary; mockup assumption, the legacy test is signed). The values
            # agree with the component maps of the prototype viewer (a_workspace.js).
            "proposed_removed": [
                {"ic": 1, "kind": "eye blinks", "ref_map": "blink", "corr": 0.97},
                {"ic": 2, "kind": "horizontal eye movements", "ref_map": "eye_h", "corr": 0.97},
                {"ic": 6, "kind": "muscle, left temporal", "ref_map": "muscle_l", "corr": 0.91},
            ],
            "clinician_change": {"action": "kept", "ic": 6,
                                 "reason_placeholder": "[Clinician's reason]"}
            if profile["seed"] == 2 else None,
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
        sig += 6 * front * np.sin(2 * np.pi * 5.8 * t + rng.uniform(0, 6))
        for bt in blink_times:
            sig += 140 * _region_weight(ch, (0, 1.0), 0.35) * np.exp(-((t - bt) ** 2) / 0.012)
        data[ch] = np.round(sig, 1).tolist()
    return {"fs": fs, "seconds": seconds, "channels": data}


# ---------------------------------------------------------------------------------------------
# Frequency markers (shared document 3.3 "Core, to confirm", 3.4; review B3). The system suggests
# peaks, the clinician confirms, moves, removes or adds markers. The suggestion follows the legacy
# AutoPeak rules where the audit gives them (audit 14d D4.2: per-electrode windows, Fp1 and Fp2
# never, peaks within 4 bins merged across electrodes, the top 3, never a power deficit); the
# legacy keeps only peaks whose uncorrected z reaches 2 (computeSig), which the mockup leaves out
# under the correction of M33: it ranks the peaks of the patient's spectrum by their positive z
# and shows the marked state of their bin (mockup assumption M57).
# ---------------------------------------------------------------------------------------------

FM_WINDOWS = {ch: w for chs, w in ((("C3", "C4", "Cz", "P3", "P4", "Pz"), (2, 50)),
                                   (("F3", "F4", "Fz"), (2, 21)),
                                   (("O1", "O2", "T5", "T6"), (3, 18)),
                                   (("F7", "F8", "T3", "T4"), (4, 11))) for ch in chs}
# The questions the marker tool asks the clinician (legacy special features, audit 14d D4.2;
# in the core by the product owner's decision of 23 October, open question I8).
FM_QUESTIONS = {"mu": (("C3", "C4"), 8.0, 13.5), "beta_spindle": (("F3", "Fz", "F4"), 18.0, 22.0)}
FM_TOP, FM_MERGE_BINS, FM_PROMINENCE, FM_SIDE_BINS = 3, 4, 0.05, 6


def fm_question(site, hz):
    """The question the tool asks for a marker at this electrode and frequency, or None."""
    return next((q for q, (sites, lo, hi) in FM_QUESTIONS.items()
                 if site in sites and lo <= hz < hi), None)


def suggest_markers(cond_result):
    """Suggested frequency markers of one condition: local maxima of the patient's log power per
    0.5 Hz bin inside the electrode's window with a prominence of at least 0.05 log10 units over
    the lowest point within 3 Hz on either side, and a positive z; ranked by z, peaks within
    2 Hz of a better one dropped, the top 3 kept."""
    lp, z = np.array(cond_result["log_power"]), np.array(cond_result["z"])
    cands = []
    for i, ch in enumerate(CHANNELS):
        if ch not in FM_WINDOWS:
            continue
        lo, hi = FM_WINDOWS[ch]
        for k in range(1, len(FREQS) - 1):
            if not (lo <= FREQS[k] < hi and lp[i, k] > lp[i, k - 1] and lp[i, k] >= lp[i, k + 1]):
                continue
            side = max(lp[i, max(0, k - FM_SIDE_BINS):k].min(), lp[i, k + 1:k + 1 + FM_SIDE_BINS].min())
            if lp[i, k] - side >= FM_PROMINENCE and z[i, k] > 0:
                cands.append((float(z[i, k]), i, k))
    cands.sort(key=lambda x: (-x[0], x[1], x[2]))
    kept = []
    for c in cands:
        if all(abs(c[2] - k2) > FM_MERGE_BINS for _, _, k2 in kept):
            kept.append(c)
        if len(kept) == FM_TOP:
            break
    return [{"n": n, "site": CHANNELS[i], "hz": float(FREQS[k]), "bin": k,
             "z": cond_result["z"][i][k], "marked": cond_result["z_marked"][i][k],
             "question": fm_question(CHANNELS[i], float(FREQS[k]))}
            for n, (_, i, k) in enumerate(kept, 1)]


def freq_markers(m):
    conds = m["spectra"]["conditions"]
    sugg = {c: (None if conds[c] is None else [] if conds[c]["z"] is None
                else suggest_markers(conds[c])) for c in CONDITIONS}
    return {"display": "abs", "suggested": sugg,
            "windows": {ch: list(w) for ch, w in FM_WINDOWS.items()},
            "questions": {q: {"sites": list(s), "lo": lo, "hi": hi}
                          for q, (s, lo, hi) in FM_QUESTIONS.items()},
            "rule": "spectral peaks with the largest positive z per condition (absolute power per "
                    "0.5 Hz bin), legacy electrode windows, within 2 Hz merged, top 3 "
                    "(mockup assumption M57)"}


# ---------------------------------------------------------------------------------------------
# Reproducibility (shared document 3.8; review D6), recording conditions and method (review D5)
# ---------------------------------------------------------------------------------------------

PIPELINE_VERSION = "mockup pipeline 0.1.0"
UDI_PLACEHOLDER = "UDI: placeholder, assigned at certification"
# when each synthetic measurement was processed and how long the automatic processing took
PROCESSED = {("MOCK-042", "m2"): ("2026-09-15T10:46:40", 400),
             ("MOCK-042", "m1"): ("2026-09-15T10:52:10", 389),
             ("MOCK-042", "m0"): ("2026-10-28T15:12:30", 371),
             ("MOCK-057", "m1"): ("2026-10-27T11:20:05", 412),
             ("MOCK-061", "m1"): ("2026-10-23T09:58:45", 395)}
# recording conditions documented at upload (mockup assumption M60); None: not documented
RECORDING_CONDITIONS = {
    ("MOCK-042", "m2"): {"time_of_day": "09:40", "medication_on_day": "none_reported",
                         "sleep_before": "as_usual", "drowsiness_observed": "no"},
    ("MOCK-042", "m1"): {"time_of_day": "10:15", "medication_on_day": "none_reported",
                         "sleep_before": "as_usual", "drowsiness_observed": "no"},
    ("MOCK-042", "m0"): {"time_of_day": None, "medication_on_day": None, "sleep_before": None,
                         "drowsiness_observed": None},
    ("MOCK-057", "m1"): {"time_of_day": "14:05", "medication_on_day": "none_reported",
                         "sleep_before": "shorter", "drowsiness_observed": "no"},
    ("MOCK-061", "m1"): {"time_of_day": "11:30", "medication_on_day": "see_anamnesis",
                         "sleep_before": "as_usual", "drowsiness_observed": "yes"},
}


def input_checksum(code, m):
    """sha256 of the synthetic input of a measurement (its raw excerpts and recording durations as
    canonical JSON); a stand-in for the checksum of the uploaded recording file."""
    import hashlib
    blob = json.dumps({"synthetic": True, "case": code, "measurement": m["id"], "date": m["date"],
                       "recordings": m["quality"]["recordings"], "raw": m["raw"]},
                      sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode()).hexdigest()


def ica_seed(code, key):
    import hashlib
    return int(hashlib.sha256(f"ica {code} {key}".encode()).hexdigest()[:8], 16) % 100000


def method(m, profile):
    """Facts of the method and the norms, for the "Method and norms" device block (TG10)."""
    no_norm = profile.get("no_norm", False)
    return {
        "recording": {"system": m["recording_system"], "electrodes": 19,
                      "montage": "10-20 system, Fp1 to O2", "conditions": m["conditions_recorded"]},
        "processing": {"reference": m["quality"]["reference"],
                       "mains_notch_hz": m["quality"]["mains_notch_hz"], "analysis_rate_hz": 250,
                       "spectral_step_hz": 0.5, "spectral_range_hz": [1, 30],
                       "cleaning": "ICA with reference maps, then exclusion of remaining "
                                   "artefact segments (mockup assumption M43)"},
        "norms": {"name": "Mock norms", "version": "2026.1", "label": NORM_VERSION,
                  "synthetic": True, "sample_n": N_NORM, "age_range_years": list(NORM_AGE_RANGE),
                  "compared_by": ["age"], "applied": not no_norm},
        "bands": [{"name": n, "lo": lo, "hi": hi} for n, lo, hi in BANDS],
        "tbr": {"site": "Cz", "theta": list(TBR_BANDS[0]), "beta": list(TBR_BANDS[1])},
        "erp": {"window_ms": [int(ERP_TIMES[0]), int(ERP_TIMES[-1])], "time_zero": "second picture",
                "baseline": "before the cue", "trials_per_type": 100},
        "marking": {"method": "Benjamini-Hochberg false discovery rate", "q": FDR_Q,
                    "within": "each analysis block", "stand_in": True},
    }


def measurement(key, date, age, profile=None, code="MOCK-042", person_seed=PERSON_SEED):
    profile = profile or PROFILES[key]
    rng = np.random.default_rng(SEED + profile["rng"])  # seeds picked for a typical spread
    # the same child in every measurement: stable individual deviations come from one seed
    prng = np.random.default_rng(person_seed)
    bb, nb = (scalp_field(prng, 1, width=0.5, col_sigma=0),
              scalp_field(prng, len(FREQS), width=0.5, col_sigma=SPEC_SMOOTH))
    person = {"spec_bb": bb, "spec": {c: resid_sd(c) * nb for c in CONDITIONS},
              "coh": smooth_field(prng, len(BANDS), width=0.55, col_sigma=1.0),
              "erp": person_erp_mods(prng),
              "erp_bg": {c: erp_background(prng) for c, _ in VCPT_TYPES}}
    quality = signal_quality(profile, rng)
    m = {
        "id": f"M-{key.upper()}",
        "date": date,
        "age_years": age,
        "conditions_recorded": ["EO", "EC", "VCPT"],
        "recording_system": "Mitsar amplifier, WinEEG file (mockup label)",
        "processed_with": {"software": SOFTWARE_VERSION, "norms": NORM_VERSION,
                           "reprocessed": key in ("m1", "m0") and code == "MOCK-042"},
        "spectra": spectra_and_bands(profile, age, rng, person),
        "coherence": coherence(profile, rng, person),
        "erp": erps(profile, rng, quality["accepted_trials"], person),
        "vcpt": vcpt_behaviour(profile, age, rng),
        "quality": quality,
        "raw": {c: raw_excerpt(c, rng, profile["apf"][c]) for c in CONDITIONS},
    }
    # a condition below the minimum analysed time gives no results (mockup assumption M25, M58)
    missing = {}
    for cond in profile.get("below_minimum", []):
        rec = quality["recordings"][cond]
        missing[cond] = {"reason": "below_minimum", "analysed_s": rec["analysed_s"],
                         "minimum_s": MIN_ANALYSED_S[cond]}
        m["spectra"]["conditions"][cond] = None
        m["coherence"][cond] = None
    if profile.get("no_norm"):
        m["marking"] = None
    else:
        m["marking"] = mark_measurement(m)
    # added in the night round of 29 October; the values above stay as they were
    at, secs = PROCESSED[(code, key)]
    m["processed_with"].update({
        "pipeline": PIPELINE_VERSION, "norm_version": "2026.1",
        "input_sha256": input_checksum(code, m),
        "input_label": "synthetic input, not a recording file",
        "ica_seed": ica_seed(code, key), "processed_at": at, "processing_s": secs,
        "udi": UDI_PLACEHOLDER})
    m["uploaded_later"] = key == "m0"
    m["results_missing"] = missing
    m["no_norm"] = ({"reason": "age_outside_norm_range", "age_years": age,
                     "norm_age_range_years": list(NORM_AGE_RANGE)} if profile.get("no_norm")
                    else None)
    m["recording_conditions"] = {"documented_at": "upload", **RECORDING_CONDITIONS[(code, key)]}
    m["method"] = method(m, profile)
    m["freq_markers"] = freq_markers(m)
    return m


# Anamnesis (open question I5: a loose structure of a few general fields, anamnesis, history,
# medication, current symptoms). Free text, so it is kept in the separate identity store (3.6).
# Neutral synthetic placeholder text; the clinician writes it once, in the report language; the
# mockup carries it in English, German and Japanese so that each sample report shows it.
ANAMNESIS = {
    "MOCK-042": {
        "anamnesis": {"en": "Synthetic example text. Seen for a quantitative EEG and ERP assessment at the family's request; third measurement at this clinic.",
                      "de": "Synthetischer Beispieltext. Vorstellung zur quantitativen EEG- und ERP-Untersuchung auf Wunsch der Familie; dritte Messung in dieser Klinik.",
                      "ja": "合成の例文です。ご家族の希望により定量脳波・事象関連電位の検査を実施。当院での3回目の測定。"},
        "history": {"en": "Synthetic example text. No relevant events reported by the parents.",
                    "de": "Synthetischer Beispieltext. Die Eltern berichten keine relevanten Ereignisse.",
                    "ja": "合成の例文です。保護者から特記すべき事項の報告はありません。"},
        "medication": {"en": "Synthetic example text. None reported.",
                       "de": "Synthetischer Beispieltext. Keine angegeben.",
                       "ja": "合成の例文です。報告なし。"},
        "current_symptoms": {"en": "Synthetic example text. Sleep and appetite as usual, as reported by the parents.",
                             "de": "Synthetischer Beispieltext. Schlaf und Appetit wie gewohnt, laut den Eltern.",
                             "ja": "合成の例文です。保護者によると、睡眠と食欲はいつもどおりです。"},
    },
    "MOCK-057": {
        "anamnesis": {"en": "Synthetic example text. First measurement at this clinic.",
                      "de": "Synthetischer Beispieltext. Erste Messung in dieser Klinik.",
                      "ja": "合成の例文です。当院での初回測定。"},
        "history": {"en": "", "de": "", "ja": ""},
        "medication": {"en": "Synthetic example text. None reported.",
                       "de": "Synthetischer Beispieltext. Keine angegeben.",
                       "ja": "合成の例文です。報告なし。"},
        "current_symptoms": {"en": "", "de": "", "ja": ""},
    },
    "MOCK-061": {
        "anamnesis": {"en": "Synthetic example text. First measurement at this clinic.",
                      "de": "Synthetischer Beispieltext. Erste Messung in dieser Klinik.",
                      "ja": "合成の例文です。当院での初回測定。"},
        "history": {"en": "Synthetic example text. [History as written by the clinician]",
                    "de": "Synthetischer Beispieltext. [Vorgeschichte, wie von der Klinikerin oder dem Kliniker geschrieben]",
                    "ja": "合成の例文です。［臨床医が記入する既往歴］"},
        "medication": {"en": "Synthetic example text. [As written by the clinician]",
                       "de": "Synthetischer Beispieltext. [Wie von der Klinikerin oder dem Kliniker geschrieben]",
                       "ja": "合成の例文です。［臨床医が記入］"},
        "current_symptoms": {"en": "", "de": "", "ja": ""},
    },
}

# What the clinician entered for the sample report of the current measurement (the synthetic
# case has no record of the prototype's clicks; mockup assumption M42 extended, M59): frequency
# markers confirmed unchanged with the answers to the tool's questions, the ticks of the
# checklist over channel ERPs (the later P1 latency at O1 and O2 seen in the Go figures), and the
# values of a clinician form. Structured entries only; free text lives in the identity store.
REPORT_INPUTS = {
    "measurement": "M-M2",
    "freq_markers": {"confirmed": True, "moves": [], "removed": [], "added": [],
                     "answers": {}},
    "erp_checklist": {"completed": True,
                      "ticks": {"P1|go|O1": ["later"], "P1|go|O2": ["later"]}},
    "clinician_form": {"referral_received": "2026-09-01", "raw_reviewed": "yes",
                       "discussed_on": "2026-09-22", "sent_to_referrer": "yes"},
}


def _common(code, name, birth, sex):
    return {
        "_notice": "Mockup, synthetic data. Invented values; not a real patient.",
        "case_code": code,
        # Identity is kept apart from the analysis (spec 3.6); the analysis sees code, age, sex.
        "identity_store": {"display_name": name, "birth_date": birth},
        "sex": sex,
        "channels": CHANNELS,
        "positions": POS,
        "bands": [{"name": n, "lo": lo, "hi": hi} for n, lo, hi in BANDS],
        "asym_pairs": [f"{l}-{r}" for l, r in ASYM_PAIRS],
    }


def build_case():
    case = _common("MOCK-042", "Mock Patient 042", "2016-01-01", "female")
    # measurements[0] is M1 and measurements[1] the current M2, as before; the earliest
    # measurement M0, uploaded later (review B5), is appended as measurements[2]
    case["measurements"] = [measurement("m1", "2026-03-12", 10.2),
                            measurement("m2", "2026-09-15", 10.7),
                            measurement("m0", "2025-09-23", 9.7)]
    case["current_index"] = 1
    case["identity_store"]["anamnesis"] = ANAMNESIS["MOCK-042"]
    case["report_inputs"] = REPORT_INPUTS
    return case


EXTRA_META = {  # code: (display name, birth date, sex, recording date, age at recording)
    "MOCK-057": ("Mock Patient 057", "2014-01-01", "male", "2026-10-27", 12.8),
    "MOCK-061": ("Mock Patient 061", "1951-01-01", "male", "2026-10-23", 75.8),
}


def build_extra_case(code):
    name, birth, sex, date, age = EXTRA_META[code]
    p = EXTRA_PROFILES[code]
    case = _common(code, name, birth, sex)
    case["measurements"] = [measurement("m1", date, age, profile=p, code=code,
                                        person_seed=PERSON_SEED + 1000 * p["person_seed"] + p["seed"])]
    case["current_index"] = 0
    case["identity_store"]["anamnesis"] = ANAMNESIS[code]
    return case


OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "synthetic"


def main(out=OUT_DIR / "case_mock042.json"):
    out.parent.mkdir(parents=True, exist_ok=True)
    files = [(out, build_case())] + [(out.parent / f"case_{c.lower().replace('-', '')}.json",
                                      build_extra_case(c)) for c in EXTRA_PROFILES]
    for path, case in files:
        path.write_text(json.dumps(case, separators=(",", ":")))
        print(f"wrote {path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
