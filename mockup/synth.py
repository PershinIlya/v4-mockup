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
# Norms (mockup norm set; invented)
# ---------------------------------------------------------------------------------------------

def norm_spectrum(age, cond):
    """Mean log10 power (uV^2/Hz) and SD per channel x frequency for the given age."""
    f = FREQS
    mean = np.zeros((len(CHANNELS), len(f)))
    for i, ch in enumerate(CHANNELS):
        x, y = POS[ch]
        post = _region_weight(ch, (0, -0.8), 0.6)
        front = _region_weight(ch, (0, 0.5), 0.6)
        apf = 9.0 + 0.08 * (age - 8)  # children's alpha peak rises with age
        alpha_amp = (1.1 if cond == "EC" else 0.45) * (0.3 + post)
        theta_amp = 0.35 * (0.4 + front) * (1.0 - 0.03 * (age - 8))
        background = 1.35 - 1.15 * np.log10(f) + 0.12 * (1 - abs(x))
        spec = (background + alpha_amp * _gauss(f, apf, 1.1)
                + theta_amp * _gauss(f, 5.8, 1.3) + 0.08 * _gauss(f, 13.5, 1.5))
        mean[i] = spec
    sd = np.full_like(mean, 0.21) + 0.03 * np.log10(f)[None, :]
    return mean, sd


def apf_norm(age, cond):
    return 9.0 + 0.08 * (age - 8) + (0.0 if cond == "EC" else -0.1), 0.55


def coherence_norm(a, b, band):
    d = _dist(a, b)
    base = {"delta": 0.62, "theta": 0.58, "alpha": 0.66, "smr": 0.52, "beta1": 0.46,
            "beta2": 0.40}[band]
    return 0.08 + base * math.exp(-d / 0.7), 0.075


# ---------------------------------------------------------------------------------------------
# Patient profile (target z fields; invented)
# ---------------------------------------------------------------------------------------------

def spectral_z(profile, cond, rng):
    """Target z per channel x frequency for the absolute spectrum."""
    f = FREQS
    z = rng.normal(0, 0.35, (len(CHANNELS), len(f)))
    for i, ch in enumerate(CHANNELS):
        front = _region_weight(ch, (0, 0.4), 0.62)
        post = _region_weight(ch, (0, -0.8), 0.5)
        theta = profile["theta_z"][cond] * front
        z[i] += theta * _gauss(f, 5.5, 1.4)
        # slower alpha peak: more power below, less above the normative peak
        s = profile["alpha_shift_z"][cond] * post
        z[i] += s * (_gauss(f, 8.0, 0.7) - 0.8 * _gauss(f, 11.0, 0.9))
        z[i] += profile["beta_z"] * _region_weight(ch, (0.0, 0.1), 0.6) * _gauss(f, 22, 3)
    # light spatial and spectral smoothing so maps look physiological
    k = np.array([0.25, 0.5, 0.25])
    z = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, z)
    return z


PROFILES = {
    # Earlier measurement (March 2026) and current measurement (September 2026). Mixed on
    # purpose: some values move towards the norm, others away from it.
    "m1": {"theta_z": {"EO": 1.7, "EC": 2.3}, "alpha_shift_z": {"EO": 1.0, "EC": 1.4},
           "beta_z": 0.3, "apf": {"EO": 8.7, "EC": 8.8}, "coh_theta_frontal": 2.8,
           "asym_alpha_frontal": 0.4, "p3_nogo_z": -1.5, "n2_nogo_z": 1.2, "cnv_z": 0.6,
           "omissions": 3, "commissions": 6, "rt_mean": 431, "rt_sd": 98,
           "rejected_go": 36, "seed": 1},
    "m2": {"theta_z": {"EO": 2.2, "EC": 2.7}, "alpha_shift_z": {"EO": 0.6, "EC": 1.0},
           "beta_z": 0.5, "apf": {"EO": 8.9, "EC": 9.0}, "coh_theta_frontal": 2.2,
           "asym_alpha_frontal": 1.6, "p3_nogo_z": -2.2, "n2_nogo_z": 0.4, "cnv_z": 1.1,
           "omissions": 5, "commissions": 3, "rt_mean": 452, "rt_sd": 117,
           "rejected_go": 9, "seed": 2},
}


# ---------------------------------------------------------------------------------------------
# Measures
# ---------------------------------------------------------------------------------------------

def band_mask(lo, hi):
    return (FREQS >= lo) & (FREQS < hi)


def spectra_and_bands(profile, age, rng):
    out = {"freqs": FREQS.tolist(), "conditions": {}}
    for cond in CONDITIONS:
        mean, sd = norm_spectrum(age, cond)
        z = spectral_z(profile, cond, rng)
        logp = mean + z * sd
        power = 10 ** logp
        norm_power = 10 ** mean
        bands = {}
        for name, lo, hi in BANDS:
            m = band_mask(lo, hi)
            pat = power[:, m].sum(axis=1) * 0.5
            nrm = norm_power[:, m].sum(axis=1) * 0.5
            # band z in the log domain; SD of a band sum shrinks a little against single bins
            band_sd = sd[:, m].mean(axis=1) * 0.9
            bz = (np.log10(pat) - np.log10(nrm)) / band_sd
            total_p = power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
            total_n = norm_power[:, band_mask(1.5, 30)].sum(axis=1) * 0.5
            rel = pat / total_p
            rel_n = nrm / total_n
            rz = (np.log10(rel) - np.log10(rel_n)) / 0.11
            bands[name] = {
                "abs_uv2": [r2(v) for v in pat], "abs_z": [r2(v) for v in bz],
                "rel_pct": [r2(100 * v) for v in rel], "rel_z": [r2(v) for v in rz],
            }
        # maps per 1 Hz band, 1-2 Hz up to 29-30 Hz (z of absolute power)
        maps_1hz = []
        for lo in range(1, 30):
            m = band_mask(lo, lo + 1)
            maps_1hz.append([r2(v) for v in z[:, m].mean(axis=1) * 1.05])
        apf_mu, apf_sd = apf_norm(age, cond)
        apf = profile["apf"][cond]
        out["conditions"][cond] = {
            "log_power": np.round(logp, 3).tolist(),
            "norm_log_mean": np.round(mean, 3).tolist(),
            "norm_log_sd": np.round(sd, 3).tolist(),
            "z": np.round(z, 2).tolist(),
            "bands": bands,
            "maps_1hz_z": maps_1hz,
            "alpha_peak": {"site": "posterior mean (P3, Pz, P4, O1, O2)", "hz": apf,
                           "norm_mean": r2(apf_mu), "norm_sd": apf_sd,
                           "z": r2((apf - apf_mu) / apf_sd)},
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
        # frontal alpha asymmetry index: ln(F4 alpha) - ln(F3 alpha)
        a = bands["alpha"]["abs_uv2"]
        faa = math.log(a[CHANNELS.index("F4")]) - math.log(a[CHANNELS.index("F3")])
        faa += 0.06 * profile["asym_alpha_frontal"]
        out["conditions"][cond]["faa"] = {"value": r2(faa), "norm_mean": 0.02,
                                          "norm_sd": 0.11, "z": r2((faa - 0.02) / 0.11)}
        # asymmetry map: (R - L) / (R + L) per homologous pair and band
        asym = {}
        for name, _, _ in BANDS:
            vals = bands[name]["abs_uv2"]
            row = []
            for l, r in ASYM_PAIRS:
                L, R = vals[CHANNELS.index(l)], vals[CHANNELS.index(r)]
                v = (R - L) / (R + L)
                zz = v / 0.06
                if name == "alpha" and l in ("F3", "F7", "Fp1"):
                    zz += profile["asym_alpha_frontal"]
                    v = zz * 0.06
                row.append({"pair": f"{l}-{r}", "value": r3(v), "z": r2(zz)})
            asym[name] = row
        out["conditions"][cond]["asymmetry"] = asym
    return out


def r3(x):
    return float(np.round(x, 3))


def coherence(profile, rng):
    pairs = [(a, b) for i, a in enumerate(CHANNELS) for b in CHANNELS[i + 1:]]
    out = {}
    for cond in CONDITIONS:
        per_band = {}
        for name, _, _ in BANDS:
            rows = []
            for a, b in pairs:
                mu, sd = coherence_norm(a, b, name)
                z = rng.normal(0, 0.55)
                frontal = {"Fp1", "Fp2", "F3", "F4", "Fz", "F7", "F8"}
                if name == "theta" and a in frontal and b in frontal and _dist(a, b) < 0.95:
                    z += profile["coh_theta_frontal"] * (0.75 if cond == "EO" else 1.0)
                val = min(0.99, max(0.01, mu + z * sd))
                rows.append({"pair": f"{a}-{b}", "value": r3(val), "z": r2((val - mu) / sd)})
            g = float(np.mean([r["value"] for r in rows]))
            gn = float(np.mean([coherence_norm(*p.split("-"), name)[0]
                                for p in [r["pair"] for r in rows]]))
            per_band[name] = {"pairs": rows,
                              "global": {"value": r3(g), "z": r2((g - gn) / 0.03),
                                         "status": "core, to confirm (Q5)"}}
        out[cond] = per_band
    return out


ERP_COMPONENTS = [
    # name, condition, site, latency norm (ms), latency sd, amplitude norm (uV), amplitude sd
    ("P1", "go", "O1", 112, 12, 7.5, 3.0),
    ("P1", "go", "O2", 110, 12, 7.8, 3.0),
    ("N1", "go", "O1", 176, 15, -6.0, 3.2),
    ("N1", "go", "O2", 174, 15, -6.4, 3.2),
    ("N2", "nogo", "Fz", 268, 22, -5.5, 3.0),
    ("N2", "nogo", "Cz", 272, 22, -4.8, 3.0),
    ("P3", "go", "Pz", 388, 32, 11.0, 4.0),
    ("P3", "nogo", "Cz", 402, 34, 12.5, 4.2),
    ("P3", "nogo", "Fz", 410, 34, 9.5, 4.0),
    ("CNV", "go", "Cz", -100, 0, -4.2, 2.0),
]


def _erp_wave(t, comps, scale=1.0):
    w = np.zeros_like(t, dtype=float)
    for lat, amp, width in comps:
        w += amp * scale * np.exp(-((t - lat) ** 2) / (2 * width ** 2))
    return w


def _site_gain(ch, centre, width=0.6):
    return _region_weight(ch, centre, width)


def erp_norm_waves(cond):
    """Norm mean waveform per channel (uV) for one VCPT trial type."""
    t = ERP_TIMES.astype(float)
    waves = {}
    for ch in CHANNELS:
        occ = _site_gain(ch, (0, -0.9), 0.45)
        par = _site_gain(ch, (0, -0.4), 0.55)
        fc = _site_gain(ch, (0, 0.25), 0.55)
        w = _erp_wave(t, [(110, 7.5 * occ, 18), (175, -6.2 * occ, 22)])
        # CNV: slow negativity before the second stimulus after an animal cue
        if cond in ("go", "nogo"):
            w += -4.2 * fc * np.clip((t + 200) / 200, 0, 1) * (t < 60) \
                * np.exp(-np.clip(t, 0, None) / 40)
        if cond == "go":
            w += _erp_wave(t, [(390, 11.0 * par, 70)])
        elif cond == "nogo":
            w += _erp_wave(t, [(270, -5.5 * fc, 30), (405, 12.5 * fc, 75)])
        elif cond == "ignore":
            w += _erp_wave(t, [(380, 3.0 * par, 70)])
        elif cond == "novelty":
            w += _erp_wave(t, [(250, -4.0 * fc, 30), (330, 13.0 * fc, 60)])
        waves[ch] = w
    return waves


def erps(profile, rng):
    t = ERP_TIMES.astype(float)
    out = {"times_ms": ERP_TIMES.tolist(), "conditions": {}, "peaks": []}
    for cond, legacy in VCPT_TYPES:
        nw = erp_norm_waves(cond)
        rows = {}
        for ch in CHANNELS:
            fc = _site_gain(ch, (0, 0.25), 0.55)
            pat = nw[ch].copy()
            if cond == "nogo":
                # smaller NoGo P3, a little larger N2
                pat += _erp_wave(t, [(415, profile["p3_nogo_z"] * 4.1 * fc, 70),
                                     (272, -profile["n2_nogo_z"] * 3.0 * fc, 30)])
            if cond in ("go", "nogo"):
                pat += -profile["cnv_z"] * 2.0 * fc * np.clip((t + 200) / 200, 0, 1) \
                    * (t < 60) * np.exp(-np.clip(t, 0, None) / 40)
            pat += np.convolve(rng.normal(0, 0.45, len(t)), np.ones(7) / 7, mode="same")
            sd = 2.4 + 0.8 * fc + 0.002 * np.clip(t, 0, None)
            rows[ch] = {"patient_uv": np.round(pat, 2).tolist(),
                        "norm_mean_uv": np.round(nw[ch], 2).tolist(),
                        "norm_sd_uv": np.round(sd, 2).tolist()}
        out["conditions"][cond] = {"legacy_code": legacy, "channels": rows}
    for name, cond, site, lat_n, lat_sd, amp_n, amp_sd in ERP_COMPONENTS:
        z_amp = rng.normal(0, 0.5)
        z_lat = rng.normal(0, 0.6)
        if name == "P3" and cond == "nogo":
            z_amp = profile["p3_nogo_z"] * (1.0 if site == "Cz" else 0.8)
            z_lat = 1.2
        if name == "N2" and cond == "nogo":
            z_amp = -profile["n2_nogo_z"]  # larger negativity means a more negative value
        if name == "CNV":
            z_amp = -profile["cnv_z"]
        amp = amp_n + z_amp * amp_sd
        peak = {"component": name, "condition": cond, "site": site,
                "amplitude_uv": r2(amp), "amplitude_z": r2(z_amp)}
        if lat_sd:
            lat = lat_n + z_lat * lat_sd
            peak.update({"latency_ms": int(round(lat)), "latency_z": r2(z_lat)})
        else:
            peak.update({"latency_ms": None, "latency_z": None,
                         "window_ms": "-200 to 0"})
        out["peaks"].append(peak)
    return out


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


def raw_excerpt(cond, rng, seconds=10, fs=128):
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
        sig += alpha_amp * env * np.sin(2 * np.pi * 8.9 * t + rng.uniform(0, 6))
        sig += 12 * front * np.sin(2 * np.pi * 5.6 * t + rng.uniform(0, 6))
        for bt in blink_times:
            sig += 140 * _region_weight(ch, (0, 1.0), 0.35) * np.exp(-((t - bt) ** 2) / 0.012)
        data[ch] = np.round(sig, 1).tolist()
    return {"fs": fs, "seconds": seconds, "channels": data}


def measurement(key, date, age):
    profile = PROFILES[key]
    rng = np.random.default_rng(SEED + profile["seed"])
    return {
        "id": f"M-{key.upper()}",
        "date": date,
        "age_years": age,
        "conditions_recorded": ["EO", "EC", "VCPT"],
        "recording_system": "Mitsar amplifier, WinEEG file (mockup label)",
        "processed_with": {"software": SOFTWARE_VERSION, "norms": NORM_VERSION,
                           "reprocessed": key == "m1"},
        "spectra": spectra_and_bands(profile, age, rng),
        "coherence": coherence(profile, rng),
        "erp": erps(profile, rng),
        "vcpt": vcpt_behaviour(profile, age, rng),
        "quality": signal_quality(profile, rng),
        "raw": {c: raw_excerpt(c, rng) for c in CONDITIONS},
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
