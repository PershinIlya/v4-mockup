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
"""

import json
from pathlib import Path

from .. import textlib as tl
from ..checks import terms
from ..i18n import L
from ..render import CASE_PATH

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
            for k in ("log_power", "norm_log_mean", "norm_log_sd"):
                if c[k] is not None:
                    c[k] = [[round(x, 2) for x in row] for row in c[k]]
    return case


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
        "erp": tl.erp_sentences(m, lang), "behaviour": tl.behaviour_sentences(m, lang),
        "limits": tl.limits_sentences(lang, e, m),
        "comparison": tl.comparison_sentences(case, m, e, lang) if e else [],
        "method": tl.method_sentences(m, lang),
    }


def pair_limits(earlier, later, lang):
    """Notes of a comparison of two measurements: L-REPROC-1 for each one processed again (older
    first), L-SIDE-1, and L-IMPORT-1 when one was uploaded later."""
    pair = sorted([earlier, later], key=lambda m: m["date"])
    out = [s for m in pair if m["processed_with"].get("reprocessed")
           for s in tl.limits_sentences(lang, m) if s["id"] == "L-REPROC-1"]
    out.append(tl.say("L-SIDE-1", lang))
    return out + tl.import_sentences(pair, lang)


def main_case_bundle(case):
    ms = {mkey(m): m for m in case["measurements"]}
    by_date = sorted(case["measurements"], key=lambda m: m["date"])
    out = {}
    for lang in LANGS:
        s = {"m1": sents(case, ms["m1"], None, lang), "m2": sents(case, ms["m2"], ms["m1"], lang),
             "m0": sents(case, ms["m0"], None, lang), "comparisons": {}, "comparison_limits": {}}
        for i, a in enumerate(by_date):
            for b in by_date[i + 1:]:
                key = f"{mkey(b).upper()}|{mkey(a).upper()}"   # later | earlier
                s["comparisons"][key] = tl.comparison_sentences(case, b, a, lang)
                s["comparison_limits"][key] = pair_limits(a, b, lang)
        s["comparisons_all"] = tl.comparison_n_sentences(case, by_date, lang)
        out[lang] = s
    return out


def extra_bundle(case):
    """An extra case: its only measurement is the current one, under the key m2."""
    m = case["measurements"][0]
    return {"case": case,
            "sentences": {lang: {"m2": sents(case, m, None, lang)} for lang in LANGS},
            "report_ids": {"m2": tl.report_id(case["case_code"], m["date"])}}


# ---------------------------------------------------------------------------------------------
# Field definitions with their labels (EN, DE) for the screens
# ---------------------------------------------------------------------------------------------

ANAMNESIS_FIELDS = ("anamnesis", "history", "medication", "current_symptoms")
RC_FIELDS = {"time_of_day": None, "medication_on_day": ("none_reported", "see_anamnesis"),
             "sleep_before": ("as_usual", "shorter"), "drowsiness_observed": ("no", "yes")}
# Rows of the clinician form (TG6): clinic-defined in the template record; this default set is
# the one the sample report of Clinic B uses (mockup assumption M62).
FORM_ROWS = [("referral_received", "date"), ("raw_reviewed", "yes_no"), ("discussed_on", "date"),
             ("sent_to_referrer", "yes_no")]


def labels(prefix, keys, langs=LANGS):
    return {lang: {k: L[lang][f"{prefix}{k}"] for k in keys} for lang in langs}


def fields_export():
    rc_values = sorted({v for vs in RC_FIELDS.values() if vs for v in vs} | {"not_documented"})
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
        "erp_checklist": {
            "status": "core, to confirm", "rows": tl.checklist_rows(),
            "items": list(tl.CHECKLIST_ITEMS),
            "title": {lang: L[lang]["erp_checklist"] for lang in LANGS},
            "item_heads": labels("cl_head_", tl.CHECKLIST_ITEMS)},
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
    "Checklist over channel ERPs": "erp.checklist",
    "Signal quality: duration, trial counts, warnings": "quality",
    "Repeated measurements side by side": "comparison",
    "Frequency markers and automatic peak suggestions": "freq.markers",
}
BLOCK_LABEL = {"spectra.grid": "spectra_grid", "spectra.maps": "spectra", "spectra.maps1hz": "maps_1hz",
               "raw.excerpt": "raw", "ratios": "ratios", "asymmetry": "asymmetry",
               "coherence": "coherence", "erp.channel": "erp", "vcpt.behaviour": "vcpt",
               "erp.checklist": "erp_checklist", "quality": "quality", "comparison": "comparison",
               "freq.markers": "freq_markers", "method": "method", "issued": "issued_block"}
# a template gap (TG) that a mockup block answers
GAP_BLOCK = {"TG10": "method", "TG11": "issued", "TG4": "freq.markers"}
REASON = {
    "later_module": ("Later module (table 3.3): certified separately later; until then only in studies, and in V3 while V3 runs.",
                     "Späteres Modul (Tabelle 3.3): später gesondert zertifiziert; bis dahin nur in Studien und in V3, solange V3 läuft."),
    "research_only": ("Research only (table 3.3): no certification planned.",
                      "Nur Forschung (Tabelle 3.3): keine Zertifizierung geplant."),
    "dropped": ("Dropped (table 3.3): not in V4.", "Entfällt (Tabelle 3.3): nicht in V4."),
    "open": ("Open (table 3.3, open questions Q6 and Q8): not in the core until decided.",
             "Offen (Tabelle 3.3, offene Fragen Q6 und Q8): bis zur Entscheidung nicht im Kern."),
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
                                   "Entfällt: der Name im Satz; Namen nur in den Platzhaltern des Klinikkopfs."),
    "leave_out.scanned_signature": ("Left out: a signature image; the Issued by block records who issued the report.",
                                    "Entfällt: ein Unterschriftsbild; der Block Freigabe hält fest, wer freigegeben hat."),
    "not_expressible": ("Needs a change of the report schema (template gap {gap}).",
                        "Braucht eine Änderung des Berichtsschemas (Vorlagenlücke {gap})."),
    "gap.TG10": ("Template gap TG10, answered in the mockup by the device block Method and norms: the system states the recording and processing facts, so clinic text no longer does.",
                 "Vorlagenlücke TG10, im Mockup beantwortet durch den Geräteblock Methode und Normen: das System nennt die Aufnahme- und Verarbeitungsangaben, der Kliniktext nicht mehr."),
    "gap.TG11": ("Template gap TG11, answered by the device block Issued by: who issued the report, when, and which version it replaces; no fixed signatories.",
                 "Vorlagenlücke TG11, beantwortet durch den Geräteblock Freigabe: wer wann freigegeben hat und welche Version ersetzt wird; keine festen Unterzeichnenden."),
    "gap.TG5": ("Template gap TG5, answered by a generated table of contents as a template option (Clinic B); no typed page references.",
                "Vorlagenlücke TG5, beantwortet durch ein erzeugtes Inhaltsverzeichnis als Vorlagenoption (Clinic B); keine getippten Seitenverweise."),
    "gap.TG6": ("Template gap TG6, a clinician form block with rows defined by the clinic; rows that name conditions, mental functions or treatments are not carried over.",
                "Vorlagenlücke TG6, ein Formularblock mit von der Klinik festgelegten Zeilen; Zeilen, die Erkrankungen, psychische Funktionen oder Behandlungen nennen, werden nicht übernommen."),
    "clinic": ("Clinic block: the clinic's own neutral content.",
               "Klinikblock: eigener neutraler Inhalt der Klinik."),
    "clinician": ("Clinician block: written by the clinician in the V4 report editor.",
                  "Klinikerblock: von der Klinikerin oder dem Kliniker im V4-Berichtseditor geschrieben."),
    "device": ("Device block of the core.", "Geräteblock des Kerns."),
    "to_confirm": ("Device block, core, to confirm (table 3.3).",
                   "Geräteblock, Kern, zu bestätigen (Tabelle 3.3)."),
}
STATUS = {"device": "core", "to_confirm": "core, to confirm", "clinic": "clinic", "clinician":
          "clinician", "not_expressible": "schema gap", "leave_out": "left out",
          "later_module": "later module", "research_only": "research only", "dropped": "dropped",
          "open": "open"}


def legacy_map():
    model = json.loads(LEGACY_MODEL.read_text())
    gaps = {e: g for g in model.get("not_expressible", []) for e in g["elements"]}
    els = []
    for e in model["elements"]:
        cls = e["class"]
        v4 = {"kind": None, "block": None}
        rk = cls if cls != "leave_out" else f"leave_out.{e.get('leave_reason')}"
        if cls in ("device", "to_confirm"):
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


def main():
    case = slim(tl.round_case(json.loads(CASE_PATH.read_text())))
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
              "extra_cases": {code: extra_bundle(slim(tl.round_case(json.loads(p.read_text()))))
                              for code, p in EXTRA.items()},
              "report_inputs": case.pop("report_inputs"),
              "legacy_map": legacy_map(),
              **fields_export()}
    OUT.write_text(json.dumps(bundle, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
