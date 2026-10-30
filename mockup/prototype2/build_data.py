"""Build mockup/prototype2/data.json: the synthetic cases plus fixed sentences per measurement.

Values are rounded once, half up, to the precision they are printed with (`textlib.round_case`:
z to 1 decimal, ratios and coherence to 2, alpha peak and ERP amplitudes to 1, percentiles to
whole numbers), before the sentences are made. The PDF pipeline (`render.py`) starts from the same
rounded case, so tables and sentences in the page and in the PDF show the same digits (mockup
assumption M6, review C1). The boolean "marked" next to every z (mockup assumption M33) and the
per-block counts in `marking` come from the case as they are; sentences follow "marked".

It also exports the choice sentences of textlib (segments, alpha peak marker, ERP peaks, summary
changes, cleaning pending, frequency markers, checklist over channel ERPs; confirmed, changed and
pending variants, `textlib.CHOICE_IDS`) as templates with {named} placeholders
("choice_sentences", "choice_parts") and the report id of each measurement ("report_ids",
`textlib.report_id`), so the page prints the same ids and wording as the PDF (see CONTRACT.md),
and the shared forbidden-word list of `mockup/checks/terms.py` ("terms") for the claim-word check
of the template editor.

Night round of 29 October (CONTRACT.md "Night round"): the earlier measurement M0 (the case's
measurements[2]) with its sentences and the comparison sentences of every ordered pair; the two
extra cases MOCK-057 and MOCK-061 ("extra_cases"); the checklist over channel ERPs, the clinician
form, the anamnesis and recording condition fields with their labels; the method sentences; the
synthetic clinician entries of the sample report ("report_inputs"); and one pseudonymised legacy
template model (coverage/models/T06.json) as "legacy_map" (review D2).

Night round 2 (CONTRACT.md "Night round 2"): the result sets of every measurement (review B7,
lead decision 5), the relative spectra and relative maps per 1 Hz band (B1), omissions and
commissions per block (C8), the summary entries as structured groups (C3), the issue block
sentences (lead decision 2), the cleaning sentences as choice templates (A5), the checklist
with neutral columns (lead decision 1), the device block catalogue (D3) and the PDF template
records (A8). The current and earlier measurements come from textlib.current_measurement and
textlib.earlier_measurements (B7), never from the list position.

Round of 30 October (CONTRACT.md "Round of 30 October"): the ERP peak review replaces the
checklist over channel ERPs ("erp_review" definition, the proposal per measurement, the ERPREV
choice sentences); the coherence types (lagged pairs, four global types; sentences per type and
the summary for a report that shows lagged coherence); source power per brain region; alpha
reactivity and the frontal theta / parietal alpha ratio; the text library version; the classes
"core" (was "to confirm") and "core, proposed" of the legacy map.
"""

import json
from pathlib import Path

from .. import textlib as tl
from ..checks import terms
from ..i18n import L
from ..render import CASE_PATH, catalogue_export, resolve_template

TEMPLATES = Path(__file__).resolve().parents[1] / "clinic_templates"

OUT = Path(__file__).resolve().parent / "data.json"
REPO = Path(__file__).resolve().parents[2]
EXTRA = {"MOCK-057": CASE_PATH.parent / "case_mock057.json",
         "MOCK-061": CASE_PATH.parent / "case_mock061.json"}
LEGACY_MODEL = REPO / "coverage" / "models" / "T06.json"
LANGS = ("en", "de")


def mkey(m):
    """Measurement key used in data.json: "m1", "m2", "m0" from the id "M-M1" ..."""
    return m["id"].split("-")[-1].lower()


def slim(case):
    """Smaller raw excerpts and spectra for the page (as before the night round)."""
    for m in case["measurements"]:
        for r in m["raw"].values():
            r["channels"] = {k: v[::2] for k, v in r["channels"].items()}
            r["fs"] = 64
        for c in m["spectra"]["conditions"].values():
            if c is None:
                continue
            for k in ("log_power", "norm_log_mean", "norm_log_sd", "rel_log_power",
                      "norm_rel_log_mean", "norm_rel_log_sd"):
                if c.get(k) is not None:
                    c[k] = [[round(x, 2) for x in row] for row in c[k]]
            if c.get("rel_z") is not None:
                c["rel_z"] = [[tl.half_up(x, 1) for x in row] for row in c["rel_z"]]
    return case


def review_export(m):
    """The ERP peak review of a measurement as the system proposes it (round of 30 October):
    {status, snr_min, rows: [{id, clear, prominence_snr, proposed: {amp, lat}}]}, the rule of
    textlib.review_rows applied to the stored peaks; the page applies it again after a confirmed
    peak move (CONTRACT.md)."""
    return {"status": "core, proposed", "snr_min": tl.REVIEW_SNR,
            "rows": [{k: r[k] for k in ("id", "clear", "prominence_snr", "proposed")}
                     for r in tl.review_rows(m)]}


def enrich(case):
    """Fields derived for the page (night round 2), added to every measurement of the case:
    result_sets (B7), relative spectra and maps per 1 Hz band (B1, the data's own fields win,
    else the stand-in of textlib), omissions and commissions per block (C8); round of 30
    October: the ERP peak review proposal (erp_review)."""
    for m in case["measurements"]:
        m["result_sets"] = tl.result_sets(case, m)
        m["erp_review"] = review_export(m)
        om, co = tl.errors_by_block(m)
        m["vcpt"]["omissions_per_block"], m["vcpt"]["commissions_per_block"] = om, co
        for cond, c in (m["spectra"]["conditions"] or {}).items():
            if not c:
                continue
            rs = tl.relative_spectrum(m, cond)
            for k in ("rel_log_power", "norm_rel_log_mean", "norm_rel_log_sd", "rel_z"):
                c[k] = rs[k]
            c["relative_derived"] = rs["derived"]
            r1 = tl.relative_maps_1hz(m, cond)
            c["maps_1hz_rel_z"], c["maps_1hz_rel_marked"] = r1 if r1 else (None, None)
    return case


def groups_export(case, m, lang, coh="msc"):
    return [{"stem": st, "family": fam, "items": [{"where": w, "z": z} for w, z in vals]}
            for st, fam, vals in (tl.summary_groups(case, m, lang, coh) if not tl.no_norm(m)
                                  else [])]


def sents(case, m, e=None, lang="en"):
    return {
        "summary": tl.summary_sentences(case, m, lang), "quality": tl.quality_sentences(m, lang),
        "spectra_EO": tl.spectral_sentences(case, m, "EO", lang),
        "spectra_EC": tl.spectral_sentences(case, m, "EC", lang),
        "ratios": tl.ratio_sentences(m, "EO", lang) + tl.ratio_sentences(m, "EC", lang),
        "asymmetry_EO": tl.asymmetry_sentences(m, "EO", lang),
        "asymmetry_EC": tl.asymmetry_sentences(m, "EC", lang),
        "coherence_EO": tl.coherence_sentences(m, "EO", lang),
        "coherence_EC": tl.coherence_sentences(m, "EC", lang),
        # round of 30 October: lagged coherence per pair, the four global types, source power
        # per brain region with its limits sentence, alpha reactivity, and the summary of a
        # report that shows lagged coherence (it ranks lagged pairs, SUM-RULE-3)
        "coherence_lag_EO": tl.coherence_sentences(m, "EO", lang, kind="lagged"),
        "coherence_lag_EC": tl.coherence_sentences(m, "EC", lang, kind="lagged"),
        "coherence_global_EO": tl.global_coherence_sentences(m, "EO", lang),
        "coherence_global_EC": tl.global_coherence_sentences(m, "EC", lang),
        "source_EO": tl.source_sentences(m, "EO", lang),
        "source_EC": tl.source_sentences(m, "EC", lang),
        "source_limits": tl.source_limits(lang),
        "alpha_reactivity": tl.alpha_reactivity_sentences(m, lang),
        "summary_lagged": tl.summary_sentences(case, m, lang, "lagged"),
        "summary_groups_lagged": groups_export(case, m, lang, "lagged"),
        "erp": tl.erp_sentences(m, lang), "behaviour": tl.behaviour_sentences(m, lang),
        "limits": tl.limits_sentences(lang, e, m, case),
        "comparison": tl.comparison_sentences(case, m, e, lang) if e else [],
        "method": tl.method_sentences(m, lang),
        # night round 2: the fixed reason when no report can be issued (lead decision 2), and
        # the summary entries as groups for the summary table (review C3)
        "issue": tl.issue_sentences(m, lang),
        "summary_groups": groups_export(case, m, lang),
    }


def pair_limits(case, earlier, later, lang):
    """Notes of a comparison of two measurements: L-REPROC-1 (or L-REPROC-2 for one uploaded
    later) for each one processed again (older first), L-SIDE-1, and L-IMPORT-1 when one was
    uploaded later."""
    pair = sorted([earlier, later], key=lambda m: m["date"])
    out = [s for s in (tl.reproc_sentence(case, m, lang) for m in pair) if s]
    out.append(tl.say("L-SIDE-1", lang))
    return out + tl.import_sentences(pair, lang)


def main_case_bundle(case):
    """Sentences of every measurement (keys by mkey), the current one with the measurement just
    before it (textlib.current_measurement, earlier_measurements), and the comparisons of every
    ordered pair."""
    cur = tl.current_measurement(case)
    before = tl.earlier_measurements(case, cur)
    by_date = tl.measurements_by_date(case)
    out = {}
    for lang in LANGS:
        s = {mkey(m): sents(case, m, before[-1] if m is cur and before else None, lang)
             for m in case["measurements"]}
        s.update({"comparisons": {}, "comparison_limits": {}})
        for i, a in enumerate(by_date):
            for b in by_date[i + 1:]:
                key = f"{mkey(b).upper()}|{mkey(a).upper()}"   # later | earlier
                s["comparisons"][key] = tl.comparison_sentences(case, b, a, lang)
                s["comparison_limits"][key] = pair_limits(case, a, b, lang)
        s["comparisons_all"] = tl.comparison_n_sentences(case, by_date, lang)
        out[lang] = s
    return out


def extra_bundle(case):
    """An extra case: its only measurement is the current one, under the key m2."""
    m = tl.current_measurement(case)
    return {"case": case,
            "sentences": {lang: {"m2": sents(case, m, None, lang)} for lang in LANGS},
            "report_ids": {"m2": tl.report_id(case["case_code"], m["date"])}}


# ---------------------------------------------------------------------------------------------
# Field definitions with their labels (EN, DE) for the screens
# ---------------------------------------------------------------------------------------------

ANAMNESIS_FIELDS = ("anamnesis", "history", "medication", "current_symptoms")
# Recording conditions documented at upload (review B10, mockup assumption): null in the data
# means not documented; the time of the last dose is "not applicable" without medication.
RC_FIELDS = {"time_of_day": None, "medication_on_day": ("none_reported", "see_anamnesis"),
             "last_dose_time": None, "sleep_before": ("as_usual", "shorter"),
             "corrected_vision": ("not_needed", "worn"), "response_hand": ("right", "left"),
             "drowsiness_observed": ("no", "yes")}
# Rows of the clinician form (TG6): clinic-defined in the template record; this default set is
# the one the sample report of Clinic B uses (mockup assumption M62).
FORM_ROWS = [("referral_received", "date"), ("raw_reviewed", "yes_no"), ("discussed_on", "date"),
             ("sent_to_referrer", "yes_no")]


def labels(prefix, keys, langs=LANGS):
    return {lang: {k: L[lang][f"{prefix}{k}"] for k in keys} for lang in langs}


def fields_export():
    rc_values = sorted({v for vs in RC_FIELDS.values() if vs for v in vs}
                       | {"not_documented", "not_applicable"})
    return {
        "anamnesis_fields": {"keys": list(ANAMNESIS_FIELDS),
                             "title": {lang: L[lang]["anamnesis_block"] for lang in LANGS},
                             "labels": labels("anam_", ANAMNESIS_FIELDS),
                             "store": "identity_store (free text, spec 3.6)"},
        "recording_condition_fields": {
            "keys": list(RC_FIELDS), "values": {k: list(v) if v else "HH:MM"
                                                for k, v in RC_FIELDS.items()},
            "title": {lang: L[lang]["rc_title"] for lang in LANGS},
            "labels": labels("rc_", RC_FIELDS), "value_labels": labels("rcv_", rc_values)},
        "clinician_form": {
            "rows": [{"key": k, "type": t, "label": {lang: L[lang][f"form_{k}"] for lang in LANGS}}
                     for k, t in FORM_ROWS],
            "title": {lang: L[lang]["form_title"] for lang in LANGS},
            "value_labels": {lang: {"yes": L[lang]["rcv_yes"], "no": L[lang]["rcv_no"]}
                             for lang in LANGS}},
        # ERP peak review (round of 30 October; replaces the checklist over channel ERPs): the
        # rows (scored peaks), the tick codes, the labels; the proposal per measurement is
        # case.measurements[].erp_review (review_export)
        "erp_review": {
            "status": "core, proposed", "snr_min": tl.REVIEW_SNR,
            "rows": [{"id": f"{c}|{t}|{s_}", "component": c, "trial": t, "site": s_,
                      "window_ms": list(w), "negative": c in tl.NEGATIVE_COMPONENTS,
                      "latency": c != "CNV"} for c, t, s_, w in tl.SCORED_PEAKS],
            "ticks": {"amp": {"positive": ["larger", "smaller"],
                              "negative": ["more_negative", "less_negative"]},
                      "lat": ["longer", "shorter"], "shape": [True]},
            "title": {lang: L[lang]["erp_review"] for lang in LANGS},
            "heads": {lang: {k: L[lang]["rev_" + k] for k in ("clear", "amp", "lat", "shape")}
                      for lang in LANGS},
            "value_labels": {lang: {k: L[lang]["rev_" + k] for k in
                                    ("larger", "smaller", "more_negative", "less_negative",
                                     "longer", "shorter", "clear_yes", "clear_no", "mean",
                                     "removed", "added", "shape_set")} for lang in LANGS},
            "legend": {lang: L[lang]["rev_legend"] for lang in LANGS}},
        # brain regions of the source power values (anatomical names only), with labels
        "source_regions": {
            "status": "core, proposed", "regions": list(tl.REGIONS),
            "title": {lang: L[lang]["source_regions"] for lang in LANGS},
            "labels": {lang: {r: tl.REGION[lang][r] for r in tl.REGIONS} for lang in LANGS},
            "legend": {lang: L[lang]["src_legend"] for lang in LANGS}},
        # coherence types per electrode pair and the four global types, with labels
        "coherence_types": {
            "pair_kinds": list(tl.COH_KINDS), "global_types": list(tl.GLOBAL_TYPES),
            "status": {"msc": "core", "lagged": "core, proposed", "global4": "core"},
            "pair_labels": {lang: dict(tl.COH_NAME[lang]) for lang in LANGS},
            "global_labels": {lang: dict(tl.GLOBAL_NAME[lang]) for lang in LANGS}},
    }


# ---------------------------------------------------------------------------------------------
# D2: one pseudonymised legacy template model mapped to the V4 blocks
# ---------------------------------------------------------------------------------------------

# Table 3.3 row (as the coverage models name it) -> V4 device block of the mockup report
ROW_BLOCK = {
    "Absolute and relative spectra against norms": "spectra.grid",
    "Maps per 1 Hz band against norms": "spectra.maps1hz", "Raw EEG excerpts": "raw.excerpt",
    "Alpha peak frequency": "ratios", "Theta/beta ratio": "ratios",
    "Frontal alpha asymmetry index": "ratios", "Asymmetry map": "asymmetry",
    "Coherence per electrode pair and band": "coherence", "Global coherence": "coherence",
    "Channel ERP waveforms against norms": "erp.channel", "ERP peak values (P1/N1, N2, P3, CNV)":
    "erp.channel", "Omissions, commissions, mean reaction time": "vcpt.behaviour",
    "Reaction time variability": "vcpt.behaviour", "Errors per block of 40 trials": "vcpt.behaviour",
    "Signal quality: duration, trial counts, warnings": "quality",
    "Repeated measurements side by side": "comparison",
    # table 3.3 of 30 October (names as the shared document gives them; the old names of 29
    # October map to the same blocks until the coverage models are renamed)
    "Frequency markers on the spectra": "freq.markers",
    "Frequency markers and automatic peak suggestions": "freq.markers",
    "Frequency markers (the clinician marks frequency components on the spectra) and automatic peak suggestions": "freq.markers",
    "Magnitude squared coherence per electrode pair and band": "coherence",
    "Lagged coherence per electrode pair and band": "coherence",
    "Global coherence: magnitude squared, lagged, instantaneous and total": "coherence",
    "Lagged, instantaneous and total coherence": "coherence",
    "ERP peak values (P1/N1, N2, P3, CNV) against norms, with the clinician's review": "erp.review",
    "Checklist over channel ERPs": "erp.review",
    "sLORETA region values against norms (per brain region and band)": "source.regions",
    "Alpha reactivity (eyes closed against eyes open)": "ratios",
    "Frontal theta / parietal alpha ratio (current workload index)": "ratios",
    "Workload index: frontal theta / parietal alpha": "ratios",
}
BLOCK_LABEL = {"spectra.grid": "spectra_grid", "spectra.maps": "spectra", "spectra.maps1hz": "maps_1hz",
               "raw.excerpt": "raw", "ratios": "ratios", "asymmetry": "asymmetry",
               "coherence": "coherence", "erp.channel": "erp", "vcpt.behaviour": "vcpt",
               "erp.review": "erp_review", "source.regions": "source_regions",
               "quality": "quality", "comparison": "comparison",
               "freq.markers": "freq_markers", "method": "method", "issued": "issued_block"}
# a template gap (TG) that a mockup block answers
GAP_BLOCK = {"TG10": "method", "TG11": "issued", "TG4": "freq.markers"}
REASON = {
    "later_module": ("Later module (table 3.3): certified separately later; until then only in studies, and in V3 while V3 runs.",
                     "Späteres Modul (Tabelle 3.3): später gesondert zertifiziert; bis dahin nur in Studien und in V3, solange V3 läuft."),
    "research_only": ("Research only (table 3.3): no certification planned.",
                      "Nur Forschung (Tabelle 3.3): keine Zertifizierung geplant."),
    "dropped": ("Dropped (table 3.3): not in V4.", "Entfällt (Tabelle 3.3): nicht in V4."),
    "open": ("Open (table 3.3; Q7 for the ICA component ERPs): not in the core until decided.",
             "Offen (Tabelle 3.3; Q7 für die ICA-Komponenten-ERPs): bis zur Entscheidung nicht im Kern."),
    "leave_out.fixed_verdict": ("Left out: a fixed sentence that states a result whatever the data.",
                                "Entfällt: ein fester Satz, der unabhängig von den Daten ein Ergebnis behauptet."),
    "leave_out.treatment_advice": ("Left out: advice text; the core gives no advice (intended use, section 4).",
                                   "Entfällt: Ratschlagstext; der Kern gibt keine Ratschläge (Zweckbestimmung, Abschnitt 4)."),
    "leave_out.legacy_text": ("Left out: generated legacy sentence, replaced by the V4 sentence library.",
                              "Entfällt: erzeugter Satz des Altsystems, ersetzt durch die Satzbibliothek von V4."),
    "leave_out.control_marker": ("Left out: a control marker of the legacy template, not content.",
                                 "Entfällt: eine Steuermarke der alten Vorlage, kein Inhalt."),
    "leave_out.error": ("Left out: an error in the legacy template.",
                        "Entfällt: ein Fehler in der alten Vorlage."),
    "leave_out.name_in_sentence": ("Left out: the patient's name inside sentences; names only in the clinic's header slots.",
                                   "Entfällt: der Name im Satz; Namen nur in den Platzhaltern im Briefkopf der Klinik."),
    "leave_out.scanned_signature": ("Left out: a signature image; the Issued by block records who issued the report.",
                                    "Entfällt: ein Unterschriftsbild; der Block Freigabe hält fest, wer freigegeben hat."),
    "not_expressible": ("Needs a change of the report schema (template gap {gap}).",
                        "Braucht eine Änderung des Berichtsschemas (Vorlagenlücke {gap})."),
    "gap.TG10": ("Template gap TG10, answered in the mockup by the device block Method and norms: the system states the recording and processing facts, so clinic text no longer does.",
                 "Vorlagenlücke TG10, im Mockup beantwortet durch den Systemblock Methode und Normdaten: das System nennt die Aufnahme- und Verarbeitungsangaben, der Kliniktext nicht mehr."),
    "gap.TG11": ("Template gap TG11, answered by the device block Issued by: who issued the report, when, and which version it replaces; no fixed signatories.",
                 "Vorlagenlücke TG11, beantwortet durch den Systemblock Freigabe: wer wann freigegeben hat und welche Version ersetzt wird; keine festen Unterzeichnenden."),
    "gap.TG5": ("Template gap TG5, answered by a generated table of contents as a template option (Clinic B); no typed page references.",
                "Vorlagenlücke TG5, beantwortet durch ein erzeugtes Inhaltsverzeichnis als Vorlagenoption (Clinic B); keine getippten Seitenverweise."),
    "gap.TG6": ("Template gap TG6, a clinician form block with rows defined by the clinic; rows that name conditions, mental functions or treatments are not carried over.",
                "Vorlagenlücke TG6, ein Formularblock mit von der Klinik festgelegten Zeilen; Zeilen, die Erkrankungen, psychische Funktionen oder Behandlungen nennen, werden nicht übernommen."),
    "clinic": ("Clinic block: the clinic's own neutral content.",
               "Klinikblock: eigener neutraler Inhalt der Klinik."),
    "clinician": ("Clinician block: written by the clinician in the V4 report editor.",
                  "Untersucherblock: von der Untersucherin oder dem Untersucher im V4-Berichtseditor geschrieben."),
    "device": ("Device block of the core.", "Systemblock des Kerns."),
    # round of 30 October: the status "to confirm" is gone (its rows are Core); the new class
    # "core, proposed" (table 3.3: beyond the clinical lead's list of 5 October)
    "core_proposed": ("Device block, core, proposed: needs the clinical lead's agreement (table 3.3).",
                      "Systemblock, Kern, vorgeschlagen: braucht die Zustimmung der klinischen Leitung (Tabelle 3.3)."),
}
STATUS = {"device": "core", "core_proposed": "core, proposed", "clinic": "clinic", "clinician":
          "clinician", "not_expressible": "schema gap", "leave_out": "left out",
          "later_module": "later module", "research_only": "research only", "dropped": "dropped",
          "open": "open"}
# a model element still in the retired class "to_confirm" counts as core (MC2 of 30 October)
RETIRED_CLASS = {"to_confirm": "device"}


def legacy_map():
    model = json.loads(LEGACY_MODEL.read_text())
    gaps = {e: g for g in model.get("not_expressible", []) for e in g["elements"]}
    els = []
    for e in model["elements"]:
        cls = RETIRED_CLASS.get(e["class"], e["class"])
        v4 = {"kind": None, "block": None}
        rk = cls if cls != "leave_out" else f"leave_out.{e.get('leave_reason')}"
        if cls in ("device", "core_proposed"):
            v4 = {"kind": "device", "block": ROW_BLOCK.get(e["analysis_row"])}
        elif cls == "clinic":
            v4 = {"kind": "clinic", "block": {"image": "clinic image (placeholder)",
                                              "header_footer": "theme: running header and footer",
                                              "slots": "clinic header with placeholders"}
                  .get(e.get("clinic_kind"), "clinic text")}
        elif cls == "clinician":
            v4 = {"kind": "clinician", "block": "clinician text"}
        elif cls == "not_expressible":
            g = e.get("gap")
            if g in GAP_BLOCK:
                v4 = {"kind": "device", "block": GAP_BLOCK[g], "answers_gap": g}
            elif g == "TG6":
                v4 = {"kind": "clinician", "block": "clinician form", "answers_gap": g}
            elif g == "TG5":
                v4 = {"kind": "template option", "block": "table of contents", "answers_gap": g}
        gap = e.get("gap") or ""
        if cls == "not_expressible" and f"gap.{gap}" in REASON:
            rk = f"gap.{gap}"
        en, de = REASON.get(rk, REASON.get(cls, ("", "")))
        reason = {"en": en.format(gap=gap), "de": de.format(gap=gap)}
        if cls == "not_expressible" and e["id"] in gaps:
            reason["model_suggestion"] = gaps[e["id"]]["suggestion"]
        label = BLOCK_LABEL.get(v4.get("block"))
        els.append({"id": e["id"], "section": e["section"], "what": e["what"], "class": cls,
                    "status": STATUS[cls], "analysis_row": e.get("analysis_row"),
                    "leave_reason": e.get("leave_reason"), "gap": e.get("gap"),
                    "claim_wording": bool(e.get("claim_wording")), "v4": v4,
                    "v4_label": {lang: L[lang][label] for lang in LANGS} if label else None,
                    "reason": reason})
    counts = {}
    for x in els:
        counts[x["status"]] = counts.get(x["status"], 0) + 1
    return {"_notice": "Pseudonymised structural model of one legacy template (coverage/models/"
                       "T06.json); descriptions are neutral paraphrases, never template text.",
            "template": model["template"], "clinic": model["clinic"], "kind": model["kind"],
            "language": model["language"], "reports_per_year": model["reports_per_year"],
            "summary": model["summary"], "counts": counts, "elements": els}


def pdf_templates():
    """The clinic template records of the sample PDFs (review A8, D3): id, version, clinic,
    language and the device block references in order, with the prototype block ids each one
    corresponds to; the check mockup/checks/template_parity.py compares them with the
    prototype's records of the same id and version."""
    out = {}
    for f in sorted(TEMPLATES.glob("*.json")):
        t = resolve_template(json.loads(f.read_text()))
        out[f"{t['template_id']} v{t['template_version']}"] = {
            "file": f.name, "template_id": t["template_id"], "version": t["template_version"],
            "name": t.get("template_name"), "clinic": t["clinic_name"], "language": t["language"],
            "history": t.get("history", []),
            "blocks": [{"kind": b["kind"], "ref": b.get("ref") if b["kind"] == "device" else
                        b.get("ref", b.get("label")), "label": b.get("label")}
                       for b in t["blocks"]]}
    return out


def main():
    case = slim(enrich(tl.round_case(json.loads(CASE_PATH.read_text()))))
    probs = tl.check_library()
    if probs:
        raise SystemExit(f"forbidden-word check failed: {probs}")
    choice, parts = tl.choice_export(LANGS)
    ms = {mkey(m): m for m in case["measurements"]}
    bundle = {"case": case,
              # one set of sentences per interface and report language, same structure in each:
              # sentences.<lang>.m1|m2|m0.<key> (Japanese is a later market and not loaded in the
              # prototype), plus the comparisons of every ordered pair of measurements
              "sentences": main_case_bundle(case),
              "choice_sentences": choice, "choice_parts": parts,
              "report_ids": {k: tl.report_id(case["case_code"], m["date"]) for k, m in ms.items()},
              "terms": {"forbidden": [list(x) for x in terms.FORBIDDEN],
                        "ja": [list(x) for x in terms.JA],
                        "allow": [rx.pattern for _, rx in terms.ALLOW]},
              "extra_cases": {code: extra_bundle(slim(enrich(tl.round_case(json.loads(p.read_text())))))
                              for code, p in EXTRA.items()},
              # the sample report's clinician entries (M59): the ERP peak review confirmed as
              # proposed (round of 30 October) and the raw excerpts chosen in the viewer
              "report_inputs": tl.sample_report_inputs(case),
              "device_blocks": catalogue_export(),
              # round of 30 October: the version of the fixed sentence library (Versions rows)
              "text_library": {"version": tl.TEXTLIB_VERSION},
              "pdf_templates": pdf_templates(),
              "legacy_map": legacy_map(),
              **fields_export()}
    case.pop("report_inputs", None)
    OUT.write_text(json.dumps(bundle, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
