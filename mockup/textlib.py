"""Fixed sentence library and selection rules (mockup of the deterministic text layer).

Follows `docs/40-research/briefs/deterministic-text-layer.md` in PershinIlya/v4: only kinds
(a) restating a measured value against the norm, (a) summary by a fixed rule with a
completeness rule, (a) quality and limits, and (b1) condition-neutral explanation of a measure or
statistic. No construct names, no condition names, no "normal" or "abnormal", no interpretation,
no advice, no patient names in any sentence.

Every sentence has an id, a version and a kind; the report prints the id in small grey type so
a reader can trace each sentence to its record. Each rule is a single explicit condition over
computed values that selects one sentence; ranking uses one statistic (|z|).

German and Japanese wording: drafted for the mockup, not reviewed by a qualified bilingual
clinician (mockup assumption).
"""

import re
from datetime import date

THRESHOLD = 2.0           # |z| at or above which a value gets its own sentence (mockup assumption)
SUMMARY_TOP = 5           # the summary lists the largest deviations ...
SUMMARY_ALWAYS = 3.0      # ... and always every deviation at or above this |z| (completeness rule)
TRIALS_WARN = 50          # legacy warns below 30 or 50 accepted trials (audit 14b B.3)

LANGS = ("en", "de", "ja")

BAND = {
    "en": {"delta": "delta", "theta": "theta", "alpha": "alpha", "smr": "SMR", "beta1": "beta1",
           "beta2": "beta2"},
    "de": {"delta": "Delta", "theta": "Theta", "alpha": "Alpha", "smr": "SMR", "beta1": "Beta1",
           "beta2": "Beta2"},
    "ja": {"delta": "デルタ", "theta": "シータ", "alpha": "アルファ", "smr": "SMR",
           "beta1": "ベータ1", "beta2": "ベータ2"},
}
COND = {
    "en": {"EO": "eyes open", "EC": "eyes closed", "VCPT": "VCPT"},
    "de": {"EO": "Augen offen", "EC": "Augen geschlossen", "VCPT": "VCPT"},
    "ja": {"EO": "開眼時", "EC": "閉眼時", "VCPT": "VCPT"},
}
TRIAL = {
    "en": {"go": "Go", "nogo": "NoGo", "ignore": "Ignore", "novelty": "Novelty"},
    "de": {"go": "Go", "nogo": "NoGo", "ignore": "Ignore", "novelty": "Novelty"},
    "ja": {"go": "Go", "nogo": "NoGo", "ignore": "Ignore", "novelty": "Novelty"},
}
DIR = {
    "en": {"+": "above", "-": "below"},
    "de": {"+": "über", "-": "unter"},
    "ja": {"+": "高い", "-": "低い"},
}
LAT_DIR = {
    "en": {"+": "later than", "-": "earlier than"},
    "de": {"+": "später als", "-": "früher als"},
    "ja": {"+": "遅い", "-": "早い"},
}
VCPT_MEASURE = {
    "en": {"omissions": "Omission errors", "commissions": "Commission errors",
           "rt_mean_ms": "Mean reaction time", "rt_sd_ms": "Reaction time variability (SD)"},
    "de": {"omissions": "Auslassungsfehler", "commissions": "Fehlreaktionen (Kommissionsfehler)",
           "rt_mean_ms": "Mittlere Reaktionszeit", "rt_sd_ms": "Variabilität der Reaktionszeit (SD)"},
    "ja": {"omissions": "見逃しエラー（オミッションエラー）", "commissions": "誤反応（コミッションエラー）",
           "rt_mean_ms": "平均反応時間", "rt_sd_ms": "反応時間のばらつき（SD）"},
}
UNIT = {"omissions": "", "commissions": "", "rt_mean_ms": " ms", "rt_sd_ms": " ms"}

# id: (kind, {lang: template})
LIB = {
    "SP-ABS-1": ("a", {
        "en": "Absolute {band} power, {cond}, is {dir} the age norm at {sites}.",
        "de": "Die absolute {band}-Leistung, {cond}, liegt an {sites} {dir} der Altersnorm.",
        "ja": "{cond}の{band}帯域の絶対パワーは、{sites}で年齢基準より{dir}値です。"}),
    "SP-REL-1": ("a", {
        "en": "Relative {band} power, {cond}, is {dir} the age norm at {sites}.",
        "de": "Die relative {band}-Leistung, {cond}, liegt an {sites} {dir} der Altersnorm.",
        "ja": "{cond}の{band}帯域の相対パワーは、{sites}で年齢基準より{dir}値です。"}),
    "SP-NONE-1": ("a", {
        "en": "All absolute and relative band power values, {cond}, are within 2 z of the normative mean.",
        "de": "Alle absoluten und relativen Bandleistungen, {cond}, liegen innerhalb von 2 z um den normativen Mittelwert.",
        "ja": "{cond}の絶対パワーおよび相対パワーは、すべて基準平均から2 z以内です。"}),
    "APF-OUT-1": ("a", {
        "en": "The alpha peak frequency, {cond}, is {hz} Hz, {dir} the age norm (z = {z}).",
        "de": "Die Alpha-Peak-Frequenz, {cond}, beträgt {hz} Hz und liegt {dir} der Altersnorm (z = {z}).",
        "ja": "{cond}のアルファピーク周波数は{hz} Hzで、年齢基準より{dir}値です（z = {z}）。"}),
    "APF-IN-1": ("a", {
        "en": "The alpha peak frequency, {cond}, is {hz} Hz, within 2 z of the normative mean (z = {z}).",
        "de": "Die Alpha-Peak-Frequenz, {cond}, beträgt {hz} Hz und liegt innerhalb von 2 z um den normativen Mittelwert (z = {z}).",
        "ja": "{cond}のアルファピーク周波数は{hz} Hzで、基準平均から2 z以内です（z = {z}）。"}),
    "TBR-1": ("a", {
        "en": "The theta/beta ratio at Cz, {cond}, is {v} (z = {z}).",
        "de": "Der Theta/Beta-Quotient an Cz, {cond}, beträgt {v} (z = {z}).",
        "ja": "{cond}のCzにおけるシータ/ベータ比は{v}です（z = {z}）。"}),
    "FAA-1": ("a", {
        "en": "The frontal alpha asymmetry index (ln F4 minus ln F3), {cond}, is {v} (z = {z}).",
        "de": "Der frontale Alpha-Asymmetrieindex (ln F4 minus ln F3), {cond}, beträgt {v} (z = {z}).",
        "ja": "{cond}の前頭部アルファ非対称指数（ln F4 − ln F3）は{v}です（z = {z}）。"}),
    "ASY-1": ("a", {
        "en": "The {band} asymmetry index, {cond}, is {dir} the age norm for {pairs}.",
        "de": "Der {band}-Asymmetrieindex, {cond}, liegt für {pairs} {dir} der Altersnorm.",
        "ja": "{cond}の{band}帯域の非対称指数は、{pairs}で年齢基準より{dir}値です。"}),
    "COH-1": ("a", {
        "en": "{Band} coherence, {cond}, is {dir} the age norm for {n} electrode pairs: {pairs}.",
        "de": "Die {band}-Kohärenz, {cond}, liegt für {n} Elektrodenpaare {dir} der Altersnorm: {pairs}.",
        "ja": "{cond}の{band}帯域のコヒーレンスは、{n}組の電極ペアで年齢基準より{dir}値です：{pairs}。"}),
    "ERP-AMP-1": ("a", {
        "en": "{comp} amplitude at {site}, {trial} trials, is {dir} the age norm ({v} µV, z = {z}).",
        "de": "Die {comp}-Amplitude an {site}, {trial}-Durchgänge, liegt {dir} der Altersnorm ({v} µV, z = {z}).",
        "ja": "{trial}試行の{site}における{comp}振幅は、年齢基準より{dir}値です（{v} µV、z = {z}）。"}),
    "ERP-LAT-1": ("a", {
        "en": "{comp} latency at {site}, {trial} trials, is {dir} the age norm ({v} ms, z = {z}).",
        "de": "Die {comp}-Latenz an {site}, {trial}-Durchgänge, ist {dir} die Altersnorm ({v} ms, z = {z}).",
        "ja": "{trial}試行の{site}における{comp}潜時は、年齢基準より{dir}値です（{v} ms、z = {z}）。"}),
    "ERP-NONE-1": ("a", {
        "en": "All ERP peak values are within 2 z of the normative mean.",
        "de": "Alle ERP-Peakwerte liegen innerhalb von 2 z um den normativen Mittelwert.",
        "ja": "ERPのピーク値はすべて基準平均から2 z以内です。"}),
    "BEH-OUT-1": ("a", {
        "en": "{measure}: {v}, {dir} the age norm (percentile {p}).",
        "de": "{measure}: {v}, {dir} der Altersnorm (Perzentil {p}).",
        "ja": "{measure}：{v}、年齢基準より{dir}値です（パーセンタイル {p}）。"}),
    "BEH-IN-1": ("a", {
        "en": "{measure}: {v}, within 2 z of the normative mean (percentile {p}).",
        "de": "{measure}: {v}, innerhalb von 2 z um den normativen Mittelwert (Perzentil {p}).",
        "ja": "{measure}：{v}、基準平均から2 z以内です（パーセンタイル {p}）。"}),
    "SUM-1": ("a", {
        "en": "The largest deviations from the age norm in this measurement are: {items}.",
        "de": "Die größten Abweichungen von der Altersnorm in dieser Messung sind: {items}.",
        "ja": "本測定で年齢基準からの偏差が最も大きい項目は次のとおりです：{items}。"}),
    "SUM-RULE-1": ("b1", {
        "en": "This list ranks every measure compared with a norm by |z| and shows the {top} largest deviations and every deviation of {always} z or more.",
        "de": "Die Liste ordnet alle Messgrößen mit Norm nach |z| und zeigt die {top} größten Abweichungen sowie jede Abweichung ab {always} z.",
        "ja": "この一覧は、基準と比較したすべての項目を|z|の大きい順に並べ、上位{top}項目と{always} z以上のすべての偏差を示します。"}),
    "SUM-NONE-1": ("a", {
        "en": "No measure in this measurement deviates from the age norm by 2 z or more.",
        "de": "Kein Messwert dieser Messung weicht um 2 z oder mehr von der Altersnorm ab.",
        "ja": "本測定には、年齢基準から2 z以上偏差のある項目はありません。"}),
    "Q-DUR-1": ("a", {
        "en": "{cond}: {a} of {r} seconds were analysed after artefact removal.",
        "de": "{cond}: {a} von {r} Sekunden wurden nach der Artefaktentfernung ausgewertet.",
        "ja": "{cond}：アーチファクト除去後、{r}秒中{a}秒を解析しました。"}),
    "Q-TRIALS-1": ("a", {
        "en": "Accepted VCPT trials: Go {go}, NoGo {nogo}, Ignore {ignore}, Novelty {novelty} (of 100 each).",
        "de": "Akzeptierte VCPT-Durchgänge: Go {go}, NoGo {nogo}, Ignore {ignore}, Novelty {novelty} (von je 100).",
        "ja": "採用したVCPT試行数：Go {go}、NoGo {nogo}、Ignore {ignore}、Novelty {novelty}（各100試行中）。"}),
    "Q-TRIALS-LOW-1": ("a", {
        "en": "Fewer than {warn} accepted {trial} trials ({n}): ERP values for this trial type are less reliable.",
        "de": "Weniger als {warn} akzeptierte {trial}-Durchgänge ({n}): ERP-Werte dieses Durchgangstyps sind weniger zuverlässig.",
        "ja": "採用した{trial}試行が{warn}未満です（{n}）。この試行種別のERP値は信頼性が低くなります。"}),
    "Q-ICA-AUTO-1": ("a", {
        "en": "Artefact removal: {k} of {n} independent components were removed, as proposed by the automatic cleaning.",
        "de": "Artefaktentfernung: {k} von {n} unabhängigen Komponenten wurden wie von der automatischen Bereinigung vorgeschlagen entfernt.",
        "ja": "アーチファクト除去：自動クリーニングの提案どおり、{n}個の独立成分のうち{k}個を除去しました。"}),
    "Q-ICA-MAN-1": ("a", {
        "en": "Artefact removal changed by the clinician: component {ic} ({kind}) was kept although the automatic cleaning proposed removing it; {k} of {n} components were removed.",
        "de": "Artefaktentfernung durch die Klinikerin oder den Kliniker geändert: Komponente {ic} ({kind}) wurde beibehalten, obwohl die automatische Bereinigung ihre Entfernung vorschlug; {k} von {n} Komponenten wurden entfernt.",
        "ja": "アーチファクト除去は臨床医が変更しました：自動クリーニングは成分{ic}（{kind}）の除去を提案しましたが、保持しました。{n}個中{k}個の成分を除去しました。"}),
    "L-Z-1": ("b1", {
        "en": "z is the distance of a value from the normative mean, in standard deviations of the normative sample; about 95% of the normative sample lies between z = -2 and z = 2.",
        "de": "z ist der Abstand eines Werts vom normativen Mittelwert in Standardabweichungen der Normstichprobe; etwa 95 % der Normstichprobe liegen zwischen z = -2 und z = 2.",
        "ja": "zは、基準平均からの距離を基準集団の標準偏差で表した値です。基準集団の約95%はz = -2からz = 2の間にあります。"}),
    "L-CHANCE-1": ("b1", {
        "en": "A deviation from the norm is statistical: among many measures, some deviate by chance alone.",
        "de": "Eine Abweichung von der Norm ist statistisch: Unter vielen Messwerten weichen einige allein durch Zufall ab.",
        "ja": "基準からの偏差は統計的なものです。多数の項目の中には、偶然だけで偏差を示すものがあります。"}),
    "L-AID-1": ("a", {
        "en": "The results are one input to the clinician's assessment. The software does not diagnose and does not recommend treatment.",
        "de": "Die Ergebnisse sind ein Baustein der klinischen Beurteilung. Die Software stellt keine Diagnose und gibt keine Therapieempfehlung.",
        "ja": "本結果は臨床医による評価の材料の一つです。本ソフトウェアは診断を行わず、治療を推奨しません。"}),
    "L-REPROC-1": ("a", {
        "en": "The earlier measurement of {date} was processed again with the current software and norms ({sw}; {norms}).",
        "de": "Die frühere Messung vom {date} wurde mit der aktuellen Software und den aktuellen Normen erneut ausgewertet ({sw}; {norms}).",
        "ja": "{date}の過去の測定は、現行のソフトウェアと基準で再解析しました（{sw}、{norms}）。"}),
    "L-SIDE-1": ("a", {
        "en": "Measurements are shown side by side, each against its own age norm; differences between them are not tested for statistical significance.",
        "de": "Die Messungen stehen nebeneinander, jede gegen ihre eigene Altersnorm; Unterschiede zwischen ihnen werden nicht auf statistische Signifikanz geprüft.",
        "ja": "各測定はそれぞれの年齢基準と比較して並べて表示しています。測定間の差について統計的有意性は検定していません。"}),
    "CMP-1": ("a", {
        "en": "{measure}: z = {z1} on {d1}, z = {z2} on {d2}.",
        "de": "{measure}: z = {z1} am {d1}, z = {z2} am {d2}.",
        "ja": "{measure}：{d1} z = {z1}、{d2} z = {z2}。"}),
}

# Words that must never appear in system sentences (intended-use.md §4); checked on every build.
FORBIDDEN = {
    "en": [r"\bADHD\b", r"attention", r"improvement", r"\bworse\b", r"\bbetter\b",
           r"deteriorat", r"disorder", r"deficit", r"\brisk\b", r"treatment", r"therapy",
           r"neurofeedback", r"medication", r"\bconsider", r"\bshould\b", r"\bimpulsiv", r"\barousal\b", r"\bvigilance\b",
           r"\bworkload\b", r"\bnormal\b", r"\babnormal\b", r"\bpatholog", r"\bdiagnos(?!e and)",
           r"consistent with", r"\bsuggests?\b", r"\breflects?\b", r"\bimproved?\b",
           r"\bconspicuous\b", r"\brecommend(?! treatment\.)"],
    "de": [r"ADHS", r"Aufmerksamkeit", r"Diagnose", r"Therapie", r"\bnormale", r"Impulsiv", r"Vigilanz", r"\bnormal\b", r"auffällig",
           r"patholog", r"spricht für", r"deutet", r"verbessert"],
    "ja": [r"ADHD", r"注意", r"衝動", r"覚醒", r"異常", r"正常", r"改善", r"示唆", r"診断", r"治療",
           r"障害", r"悪化"],
}
# The one sentence that may name "diagnose" and "recommend treatment" is the negation L-AID-1.
FORBIDDEN_EXEMPT = {"L-AID-1"}


def check_library():
    from .i18n import L
    problems = []
    for lang, labels in L.items():
        for k, t in labels.items():
            for pat in FORBIDDEN[lang]:
                if re.search(pat, t, flags=re.IGNORECASE):
                    problems.append(f"label {k} {lang}: matches {pat}")
    for sid, (_, texts) in LIB.items():
        if sid in FORBIDDEN_EXEMPT:
            continue
        for lang, t in texts.items():
            for pat in FORBIDDEN[lang]:
                if re.search(pat, t, flags=re.IGNORECASE):
                    problems.append(f"{sid} {lang}: matches {pat}")
    return problems


def fmt_z(z, lang):
    s = f"{z:.1f}"
    return s.replace("-", "−") if lang == "ja" else s


def fmt_date(iso, lang):
    d = date.fromisoformat(iso)
    if lang == "de":
        return d.strftime("%d.%m.%Y")
    if lang == "ja":
        return f"{d.year}年{d.month}月{d.day}日"
    return d.strftime("%-d %b %Y")


def list_join(items, lang):
    if lang == "ja":
        return "、".join(items)
    if len(items) == 1:
        return items[0]
    conj = {"en": " and ", "de": " und "}[lang]
    return ", ".join(items[:-1]) + conj + items[-1]


def say(sid, lang, **slots):
    kind, texts = LIB[sid]
    tmpl = texts[lang]
    text = tmpl.format(**slots)
    if lang != "ja" and tmpl.startswith("{"):
        text = text[0].upper() + text[1:]
    return {"id": sid, "kind": kind, "text": text}


def over(z, limit=THRESHOLD):
    """Threshold test on the printed value (one decimal), so text and tables agree."""
    return abs(round(z, 1)) >= limit


def sign(z):
    return "+" if z > 0 else "-"


# ---------------------------------------------------------------------------------------------
# Selection rules: one explicit condition over computed values selects one sentence.
# ---------------------------------------------------------------------------------------------

def spectral_sentences(case, meas, cond, lang, relative=True):
    out = []
    bands = meas["spectra"]["conditions"][cond]["bands"]
    ch = case["channels"]
    kinds = (("abs_z", "SP-ABS-1"), ("rel_z", "SP-REL-1")) if relative else (("abs_z", "SP-ABS-1"),)
    for key, sid in kinds:
        for b in BAND[lang]:
            for sg in ("+", "-"):
                hits = [(ch[i], z) for i, z in enumerate(bands[b][key])
                        if over(z) and sign(z) == sg]
                if not hits:
                    continue
                sites = list_join([f"{c} (z = {fmt_z(z, lang)})" for c, z in hits], lang)
                out.append(say(sid, lang, band=BAND[lang][b], cond=COND[lang][cond],
                               dir=DIR[lang][sg], sites=sites))
    if not out:
        out.append(say("SP-NONE-1", lang, cond=COND[lang][cond]))
    apf = meas["spectra"]["conditions"][cond]["alpha_peak"]
    if over(apf["z"]):
        out.append(say("APF-OUT-1", lang, cond=COND[lang][cond], hz=f"{apf['hz']:.1f}",
                       dir=DIR[lang][sign(apf["z"])], z=fmt_z(apf["z"], lang)))
    else:
        out.append(say("APF-IN-1", lang, cond=COND[lang][cond], hz=f"{apf['hz']:.1f}",
                       z=fmt_z(apf["z"], lang)))
    return out


def ratio_sentences(meas, cond, lang):
    c = meas["spectra"]["conditions"][cond]
    return [say("TBR-1", lang, cond=COND[lang][cond], v=f"{c['tbr']['value']:.2f}",
                z=fmt_z(c["tbr"]["z"], lang)),
            say("FAA-1", lang, cond=COND[lang][cond], v=f"{c['faa']['value']:.2f}",
                z=fmt_z(c["faa"]["z"], lang))]


def asymmetry_sentences(meas, cond, lang):
    out = []
    asym = meas["spectra"]["conditions"][cond]["asymmetry"]
    for b in BAND[lang]:
        for sg in ("+", "-"):
            hits = [r for r in asym[b] if over(r["z"]) and sign(r["z"]) == sg]
            if hits:
                pairs = list_join([f"{r['pair']} (z = {fmt_z(r['z'], lang)})" for r in hits], lang)
                out.append(say("ASY-1", lang, band=BAND[lang][b], cond=COND[lang][cond],
                               dir=DIR[lang][sg], pairs=pairs))
    return out


def coherence_sentences(meas, cond, lang, max_listed=6):
    out = []
    for b in BAND[lang]:
        for sg in ("+", "-"):
            hits = sorted([p for p in meas["coherence"][cond][b]["pairs"]
                           if over(p["z"]) and sign(p["z"]) == sg],
                          key=lambda p: -abs(p["z"]))
            if not hits:
                continue
            shown = [f"{p['pair']} (z = {fmt_z(p['z'], lang)})" for p in hits[:max_listed]]
            if len(hits) > max_listed:
                more = {"en": f"{len(hits) - max_listed} more in the table",
                        "de": f"{len(hits) - max_listed} weitere in der Tabelle",
                        "ja": f"ほか{len(hits) - max_listed}組は表を参照"}[lang]
                shown.append(more)
            name = BAND[lang][b]
            out.append(say("COH-1", lang, Band=name[0].upper() + name[1:] if lang == "en" else name,
                           band=name, cond=COND[lang][cond], dir=DIR[lang][sg], n=len(hits),
                           pairs=list_join(shown, lang)))
    return out


def erp_sentences(meas, lang):
    out = []
    for p in meas["erp"]["peaks"]:
        trial = TRIAL[lang][p["condition"]]
        if over(p["amplitude_z"]):
            out.append(say("ERP-AMP-1", lang, comp=p["component"], site=p["site"], trial=trial,
                           dir=DIR[lang][sign(p["amplitude_z"])], v=f"{p['amplitude_uv']:.1f}",
                           z=fmt_z(p["amplitude_z"], lang)))
        if p["latency_z"] is not None and over(p["latency_z"]):
            out.append(say("ERP-LAT-1", lang, comp=p["component"], site=p["site"], trial=trial,
                           dir=LAT_DIR[lang][sign(p["latency_z"])], v=p["latency_ms"],
                           z=fmt_z(p["latency_z"], lang)))
    if not out:
        out.append(say("ERP-NONE-1", lang))
    return out


def behaviour_sentences(meas, lang):
    out = []
    v = meas["vcpt"]
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = v[key]
        val = f"{m['value']}{UNIT[key]}"
        p = f"{m['percentile']:.0f}" if m["percentile"] < 99.5 else ">99"
        if over(m["z"]):
            out.append(say("BEH-OUT-1", lang, measure=VCPT_MEASURE[lang][key], v=val,
                           dir=DIR[lang][sign(m["z"])], p=p))
        else:
            out.append(say("BEH-IN-1", lang, measure=VCPT_MEASURE[lang][key], v=val, p=p))
    return out


def all_deviations(case, meas, lang):
    """Every measure with its |z|, as (abs z, label) for the summary rule."""
    items = []
    ch = case["channels"]
    for cond in ("EO", "EC"):
        c = meas["spectra"]["conditions"][cond]
        for b in BAND[lang]:
            for key, lab in (("abs_z", {"en": "absolute", "de": "absolute", "ja": "絶対"}),
                             ("rel_z", {"en": "relative", "de": "relative", "ja": "相対"})):
                for i, z in enumerate(c["bands"][b][key]):
                    if lang == "ja":
                        label = f"{COND[lang][cond]}の{ch[i]}における{BAND[lang][b]}{lab[lang]}パワー"
                    elif lang == "de":
                        label = f"{lab[lang]} {BAND[lang][b]}-Leistung an {ch[i]}, {COND[lang][cond]}"
                    else:
                        label = f"{lab[lang]} {BAND[lang][b]} power at {ch[i]}, {COND[lang][cond]}"
                    items.append((abs(z), z, label))
        apf = c["alpha_peak"]
        label = {"en": f"alpha peak frequency, {COND[lang][cond]}",
                 "de": f"Alpha-Peak-Frequenz, {COND[lang][cond]}",
                 "ja": f"{COND[lang][cond]}のアルファピーク周波数"}[lang]
        items.append((abs(apf["z"]), apf["z"], label))
        cl = COND[lang][cond]
        items.append((abs(c["tbr"]["z"]), c["tbr"]["z"],
                      {"en": f"theta/beta ratio at Cz, {cl}", "de": f"Theta/Beta-Quotient an Cz, {cl}",
                       "ja": f"{cl}のCzにおけるシータ/ベータ比"}[lang]))
        items.append((abs(c["faa"]["z"]), c["faa"]["z"],
                      {"en": f"frontal alpha asymmetry index, {cl}",
                       "de": f"frontaler Alpha-Asymmetrieindex, {cl}",
                       "ja": f"{cl}の前頭部アルファ非対称指数"}[lang]))
        for b in BAND[lang]:
            bn = BAND[lang][b]
            for r in c["asymmetry"][b]:
                items.append((abs(r["z"]), r["z"],
                              {"en": f"{bn} asymmetry index {r['pair']}, {cl}",
                               "de": f"{bn}-Asymmetrieindex {r['pair']}, {cl}",
                               "ja": f"{cl}の{r['pair']}における{bn}非対称指数"}[lang]))
            for r in meas["coherence"][cond][b]["pairs"]:
                items.append((abs(r["z"]), r["z"],
                              {"en": f"{bn} coherence {r['pair']}, {cl}",
                               "de": f"{bn}-Kohärenz {r['pair']}, {cl}",
                               "ja": f"{cl}の{r['pair']}における{bn}コヒーレンス"}[lang]))
    for p in meas["erp"]["peaks"]:
        trial = TRIAL[lang][p["condition"]]
        label = {"en": f"{p['component']} amplitude at {p['site']}, {trial}",
                 "de": f"{p['component']}-Amplitude an {p['site']}, {trial}",
                 "ja": f"{trial}試行の{p['site']}における{p['component']}振幅"}[lang]
        items.append((abs(p["amplitude_z"]), p["amplitude_z"], label))
        if p["latency_z"] is not None:
            label = {"en": f"{p['component']} latency at {p['site']}, {trial}",
                     "de": f"{p['component']}-Latenz an {p['site']}, {trial}",
                     "ja": f"{trial}試行の{p['site']}における{p['component']}潜時"}[lang]
            items.append((abs(p["latency_z"]), p["latency_z"], label))
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = meas["vcpt"][key]
        items.append((abs(m["z"]), m["z"], VCPT_MEASURE[lang][key]))
    return sorted(items, key=lambda x: -x[0])


def summary_sentences(case, meas, lang):
    items = [x for x in all_deviations(case, meas, lang) if over(x[1])]
    if not items:
        return [say("SUM-NONE-1", lang)]
    chosen = [x for i, x in enumerate(items) if i < SUMMARY_TOP or over(x[1], SUMMARY_ALWAYS)]
    text_items = [f"{lab} (z = {fmt_z(z, lang)})" for _, z, lab in chosen]
    joiner = "、" if lang == "ja" else "; "
    return [say("SUM-1", lang, items=joiner.join(text_items)),
            say("SUM-RULE-1", lang, top=SUMMARY_TOP, always=f"{SUMMARY_ALWAYS:.0f}")]


def quality_sentences(meas, lang):
    q = meas["quality"]
    out = []
    for cond, r in q["recordings"].items():
        out.append(say("Q-DUR-1", lang, cond=COND[lang][cond], a=r["analysed_s"],
                       r=r["recorded_s"]))
    out.append(say("Q-TRIALS-1", lang, **q["accepted_trials"]))
    for t, n in q["accepted_trials"].items():
        if n < TRIALS_WARN:
            out.append(say("Q-TRIALS-LOW-1", lang, warn=TRIALS_WARN, trial=TRIAL[lang][t], n=n))
    ica = q["ica"]
    removed = len(ica["proposed_removed"])
    if ica["clinician_change"]:
        cc = ica["clinician_change"]
        kind = next(x["kind"] for x in ica["proposed_removed"] if x["ic"] == cc["ic"])
        kind = {"en": kind, "de": {"muscle, left temporal": "Muskel, links temporal"}.get(kind, kind),
                "ja": {"muscle, left temporal": "筋電、左側頭部"}.get(kind, kind)}[lang]
        out.append(say("Q-ICA-MAN-1", lang, ic=cc["ic"], kind=kind, k=removed - 1,
                       n=ica["n_components"]))
    else:
        out.append(say("Q-ICA-AUTO-1", lang, k=removed, n=ica["n_components"]))
    return out


def limits_sentences(lang, earlier=None):
    out = [say("L-AID-1", lang), say("L-Z-1", lang), say("L-CHANCE-1", lang)]
    if earlier:
        out.append(say("L-REPROC-1", lang, date=fmt_date(earlier["date"], lang),
                       sw=earlier["processed_with"]["software"],
                       norms=earlier["processed_with"]["norms"]))
        out.append(say("L-SIDE-1", lang))
    return out


def comparison_sentences(case, current, earlier, lang, top=6):
    """Side by side z values for the measures deviating most in either measurement (kind (a))."""
    cur = {lab: z for _, z, lab in all_deviations(case, current, lang)}
    ear = {lab: z for _, z, lab in all_deviations(case, earlier, lang)}
    keys = sorted(cur, key=lambda k: -max(abs(cur[k]), abs(ear.get(k, 0))))[:top]
    return [say("CMP-1", lang, measure=k, z1=fmt_z(ear[k], lang), d1=fmt_date(earlier["date"], lang),
                z2=fmt_z(cur[k], lang), d2=fmt_date(current["date"], lang)) for k in keys]


if __name__ == "__main__":
    probs = check_library()
    print("forbidden-word check:", "clean" if not probs else probs)
