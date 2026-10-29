"""Fixed sentence library and selection rules (mockup of the deterministic text layer).

Follows `docs/40-research/briefs/deterministic-text-layer.md` in PershinIlya/v4: only kinds
(a) restating a measured value against the norm, (a) summary by a fixed rule with a
completeness rule, (a) quality and limits, and (b1) condition-neutral explanation of a measure or
statistic. No construct names, no condition names, no "normal" or "abnormal", no interpretation,
no advice, no patient names in any sentence.

Every sentence has an id, a version and a kind; the report prints the id in small grey type so
a reader can trace each sentence to its record. Each rule is a single explicit condition over
computed values that selects one sentence; ranking uses one statistic (|z|).

Selection follows the boolean "marked" stored next to every z (correction for multiple
comparisons; the mockup uses a stand-in, assumption M33), not |z| >= 2. A value has one of three
states: marked, beyond 2 z but not marked, within 2 z; only marked values get sentences.

German and Japanese wording: drafted for the mockup, not reviewed by a qualified bilingual
clinician (mockup assumption).
"""

import re
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from .checks import terms

THRESHOLD = 2.0           # |z| beyond which an unmarked value is "beyond 2 z" (counts only)
SUMMARY_TOP = 5           # the summary lists the largest marked deviations ...
SUMMARY_ALWAYS = 3.0      # ... and always every marked deviation at or above this |z| (completeness)
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
# Negative components (N1, N2, CNV): a larger negativity has a lower value, so the sentence names
# the size of the negativity instead of "above" or "below".
NEG_DIR = {
    "en": {"+": "less negative than", "-": "more negative than"},
    "de": {"+": "weniger negativ als", "-": "negativer als"},
    "ja": {"+": "負の振幅が小さい", "-": "負の振幅が大きい"},
}
NEGATIVE_COMPONENTS = ("N1", "N2", "CNV")
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
    "SP-NONE-2": ("a", {
        "en": "No absolute or relative band power value, {cond}, is marked.",
        "de": "Kein absoluter oder relativer Bandleistungswert, {cond}, ist markiert.",
        "ja": "{cond}の絶対パワーおよび相対パワーには、印の付いた値はありません。"}),
    "APF-OUT-1": ("a", {
        "en": "The alpha peak frequency, {cond}, is {hz} Hz, {dir} the age norm (z = {z}).",
        "de": "Die Alpha-Peak-Frequenz, {cond}, beträgt {hz} Hz und liegt {dir} der Altersnorm (z = {z}).",
        "ja": "{cond}のアルファピーク周波数は{hz} Hzで、年齢基準より{dir}値です（z = {z}）。"}),
    "APF-IN-2": ("a", {
        "en": "The alpha peak frequency, {cond}, is {hz} Hz and is not marked (z = {z}).",
        "de": "Die Alpha-Peak-Frequenz, {cond}, beträgt {hz} Hz und ist nicht markiert (z = {z}).",
        "ja": "{cond}のアルファピーク周波数は{hz} Hzで、印は付いていません（z = {z}）。"}),
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
        "en": "{Band} coherence, {cond}, is {dir} the age norm for {npairs}: {pairs}.",
        "de": "Die {band}-Kohärenz, {cond}, liegt für {npairs} {dir} der Altersnorm: {pairs}.",
        "ja": "{cond}の{band}帯域のコヒーレンスは、{n}組の電極ペアで年齢基準より{dir}値です：{pairs}。"}),
    "ERP-AMP-1": ("a", {
        "en": "{comp} amplitude at {site}, {trial} trials, is {dir} the age norm ({v} µV, z = {z}).",
        "de": "Die {comp}-Amplitude an {site}, {trial}-Durchgänge, liegt {dir} der Altersnorm ({v} µV, z = {z}).",
        "ja": "{trial}試行の{site}における{comp}振幅は、年齢基準より{dir}値です（{v} µV、z = {z}）。"}),
    "ERP-AMP-NEG-1": ("a", {
        "en": "{comp} amplitude at {site}, {trial} trials, is {dir} the age norm ({v} µV, z = {z}).",
        "de": "Die {comp}-Amplitude an {site}, {trial}-Durchgänge, ist {dir} die Altersnorm ({v} µV, z = {z}).",
        "ja": "{trial}試行の{site}における{comp}振幅は、年齢基準より{dir}値です（{v} µV、z = {z}）。"}),
    "ERP-LAT-1": ("a", {
        "en": "{comp} latency at {site}, {trial} trials, is {dir} the age norm ({v} ms, z = {z}).",
        "de": "Die {comp}-Latenz an {site}, {trial}-Durchgänge, ist {dir} die Altersnorm ({v} ms, z = {z}).",
        "ja": "{trial}試行の{site}における{comp}潜時は、年齢基準より{dir}値です（{v} ms、z = {z}）。"}),
    "ERP-NONE-2": ("a", {
        "en": "No ERP peak value is marked.",
        "de": "Kein ERP-Peakwert ist markiert.",
        "ja": "ERPのピーク値には、印の付いた値はありません。"}),
    "BEH-OUT-1": ("a", {
        "en": "{measure}: {v}, {dir} the age norm (percentile {p}).",
        "de": "{measure}: {v}, {dir} der Altersnorm (Perzentil {p}).",
        "ja": "{measure}：{v}、年齢基準より{dir}値です（パーセンタイル {p}）。"}),
    "BEH-IN-2": ("a", {
        "en": "{measure}: {v}, not marked (percentile {p}).",
        "de": "{measure}: {v}, nicht markiert (Perzentil {p}).",
        "ja": "{measure}：{v}、印は付いていません（パーセンタイル {p}）。"}),
    "SUM-2": ("a", {
        "en": "The largest marked deviations from the age norm in this measurement are: {items}.",
        "de": "Die größten markierten Abweichungen von der Altersnorm in dieser Messung sind: {items}.",
        "ja": "本測定で印の付いた年齢基準からの偏差のうち、最も大きい項目は次のとおりです：{items}。"}),
    "SUM-RULE-2": ("b1", {
        "en": "This list ranks the marked values of these analyses by |z|: absolute and relative band power, maps per 1 Hz band, alpha peak frequency, theta/beta ratio, frontal alpha asymmetry index, asymmetry map, coherence per electrode pair, ERP peak amplitude and latency, and VCPT task results. It shows the {top} largest and every marked value of {always} z or more. Not ranked: the spectra per 0.5 Hz bin, which are shown as curves against the norm, and global coherence, which is still to be confirmed.",
        "de": "Die Liste ordnet die markierten Werte dieser Analysen nach |z|: absolute und relative Bandleistung, Karten je 1-Hz-Band, Alpha-Peak-Frequenz, Theta/Beta-Quotient, frontaler Alpha-Asymmetrieindex, Asymmetriekarte, Kohärenz je Elektrodenpaar, ERP-Peakamplitude und -latenz sowie die Ergebnisse der VCPT-Aufgabe. Sie zeigt die {top} größten und jeden markierten Wert ab {always} z. Nicht eingeordnet: die Spektren je 0,5-Hz-Schritt, die als Kurven gegen die Norm gezeigt werden, und die globale Kohärenz, die noch zu bestätigen ist.",
        "ja": "この一覧は、次の解析で印の付いた値を|z|の大きい順に並べます：絶対パワーと相対パワー、1 Hz帯域ごとのマップ、アルファピーク周波数、シータ/ベータ比、前頭部アルファ非対称指数、非対称マップ、電極ペアごとのコヒーレンス、ERPピークの振幅と潜時、VCPT課題の結果。上位{top}項目と、{always} z以上の印の付いたすべての値を示します。0.5 Hzごとのスペクトル（基準と比較した曲線として表示）と、確認待ちのグローバルコヒーレンスは順位付けの対象外です。"}),
    "SUM-COUNT-1": ("a", {
        "en": "Marked values in this measurement: {items}.",
        "de": "Markierte Werte in dieser Messung: {items}.",
        "ja": "本測定で印の付いた値：{items}。"}),
    "SUM-NONE-2": ("a", {
        "en": "No value in this measurement is marked.",
        "de": "Kein Wert dieser Messung ist markiert.",
        "ja": "本測定には、印の付いた値はありません。"}),
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
    # Choice sentences (shared spec 3.4): the clinician's choices on segments, the alpha peak
    # frequency marker and ERP peaks, one id set for the PDF and the prototype (CHOICE_IDS). AUTO
    # means the proposal was confirmed unchanged, MAN or MOVED a confirmed change, PEND a change
    # not yet confirmed. Placeholders are filled by the pipeline that prints the sentence.
    "Q-SEG-AUTO-1": ("a", {
        "en": "The analysed segments were confirmed by the clinician as proposed.",
        "de": "Die ausgewerteten Segmente wurden von der Klinikerin oder dem Kliniker wie vorgeschlagen bestätigt.",
        "ja": "解析区間は、臨床医が提案どおりに確認しました。"}),
    "Q-SEG-MAN-1": ("a", {
        "en": "{cond}: {analysed} of {recorded} seconds were analysed after artefact removal; the clinician changed the proposed segments (proposal: {proposed} seconds) and confirmed them.",
        "de": "{cond}: {analysed} von {recorded} Sekunden wurden nach der Artefaktentfernung ausgewertet; die Klinikerin oder der Kliniker hat die vorgeschlagenen Segmente geändert (Vorschlag: {proposed} Sekunden) und bestätigt.",
        "ja": "{cond}：アーチファクト除去後、{recorded}秒中{analysed}秒を解析しました。臨床医が提案された区間を変更し（提案：{proposed}秒）、確認しました。"}),
    "Q-SEG-PEND-1": ("a", {
        "en": "Changes by the clinician to the proposed segments, pending confirmation: {n}.",
        "de": "Änderungen der Klinikerin oder des Klinikers an den vorgeschlagenen Segmenten, Bestätigung ausstehend: {n}.",
        "ja": "臨床医による提案区間の変更（確認待ち）：{n}件。"}),
    "Q-SEG-PEND-0": ("a", {
        "en": "Analysed segments: as proposed, not yet confirmed by the clinician.",
        "de": "Ausgewertete Segmente: wie vorgeschlagen, von der Klinikerin oder dem Kliniker noch nicht bestätigt.",
        "ja": "解析区間：提案どおりです。臨床医はまだ確認していません。"}),
    "MK-AUTO-1": ("a", {
        "en": "Alpha peak frequency, eyes closed (posterior mean): suggested {suggested} Hz, confirmed unchanged by the clinician; {state}.",
        "de": "Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen {suggested} Hz, von der Klinikerin oder dem Kliniker unverändert bestätigt; {state}.",
        "ja": "閉眼時のアルファピーク周波数（後部電極の平均）：提案値{suggested} Hzを臨床医が変更せずに確認しました。{state}。"}),
    "MK-MOVED-1": ("a", {
        "en": "Alpha peak frequency, eyes closed (posterior mean): suggested {suggested} Hz, confirmed at {confirmed} Hz by the clinician; {state}.",
        "de": "Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen {suggested} Hz, von der Klinikerin oder dem Kliniker bei {confirmed} Hz bestätigt; {state}.",
        "ja": "閉眼時のアルファピーク周波数（後部電極の平均）：提案値{suggested} Hzを臨床医が{confirmed} Hzに移動して確認しました。{state}。"}),
    "MK-PEND-1": ("a", {
        "en": "Alpha peak frequency marker: suggested at {hz} Hz, not yet confirmed by the clinician.",
        "de": "Marker der Alpha-Peak-Frequenz: vorgeschlagen bei {hz} Hz, von der Klinikerin oder dem Kliniker noch nicht bestätigt.",
        "ja": "アルファピーク周波数マーカー：{hz} Hzを提案しています。臨床医はまだ確認していません。"}),
    "ERP-PEAK-AUTO-1": ("a", {
        "en": "ERP peaks, {trial} trials: the suggested peaks were confirmed unchanged by the clinician.",
        "de": "ERP-Peaks, {trial}-Durchgänge: Die vorgeschlagenen Peaks wurden von der Klinikerin oder dem Kliniker unverändert bestätigt.",
        "ja": "{trial}試行のERPピーク：提案されたピークを臨床医が変更せずに確認しました。"}),
    "ERP-PEAK-MAN-1": ("a", {
        "en": "{comp} at {site}, {trial} trials: the suggested peak at {from_ms} ms was moved by the clinician to {to_ms} ms and confirmed. Latency: {lat_state}; amplitude {amp_uv} µV: {amp_state}.",
        "de": "{comp} an {site}, {trial}-Durchgänge: Der vorgeschlagene Peak bei {from_ms} ms wurde von der Klinikerin oder dem Kliniker auf {to_ms} ms verschoben und bestätigt. Latenz: {lat_state}; Amplitude {amp_uv} µV: {amp_state}.",
        "ja": "{trial}試行の{site}における{comp}：提案された{from_ms} msのピークを臨床医が{to_ms} msに移動して確認しました。潜時：{lat_state}。振幅{amp_uv} µV：{amp_state}。"}),
    "ERP-PEAK-PEND-1": ("a", {
        "en": "ERP peaks, {trial} trials: automatic suggestions; moves by the clinician pending confirmation: {n}.",
        "de": "ERP-Peaks, {trial}-Durchgänge: automatische Vorschläge; Verschiebungen der Klinikerin oder des Klinikers, Bestätigung ausstehend: {n}.",
        "ja": "{trial}試行のERPピーク：自動提案です。臨床医による移動（確認待ち）：{n}件。"}),
    "ERP-PEAK-PEND-0": ("a", {
        "en": "ERP peaks, {trial} trials: automatic suggestions, not yet confirmed by the clinician.",
        "de": "ERP-Peaks, {trial}-Durchgänge: automatische Vorschläge, von der Klinikerin oder dem Kliniker noch nicht bestätigt.",
        "ja": "{trial}試行のERPピーク：自動提案です。臨床医はまだ確認していません。"}),
    "SUM-CHG-1": ("a", {
        "en": "Marked after the clinician's confirmed changes: {items}.",
        "de": "Nach den bestätigten Änderungen der Klinikerin oder des Klinikers markiert: {items}.",
        "ja": "臨床医が確認した変更の後に印が付いた値：{items}。"}),
    "SUM-CHG-2": ("a", {
        "en": "No longer marked after the clinician's confirmed changes: {items}.",
        "de": "Nach den bestätigten Änderungen der Klinikerin oder des Klinikers nicht mehr markiert: {items}.",
        "ja": "臨床医が確認した変更の後に印が外れた値：{items}。"}),
    "SUM-CHG-3": ("a", {
        "en": "The ranked list and the counts above use the suggested values.",
        "de": "Die geordnete Liste und die Zählung oben beruhen auf den vorgeschlagenen Werten.",
        "ja": "上記の順位一覧と件数は提案値に基づきます。"}),
    "L-Z-1": ("b1", {
        "en": "z is the distance of a value from the normative mean, in standard deviations of the normative sample; about 95% of the normative sample lies between z = -2 and z = 2.",
        "de": "z ist der Abstand eines Werts vom normativen Mittelwert in Standardabweichungen der Normstichprobe; etwa 95 % der Normstichprobe liegen zwischen z = -2 und z = 2.",
        "ja": "zは、基準平均からの距離を基準集団の標準偏差で表した値です。基準集団の約95%はz = -2からz = 2の間にあります。"}),
    "L-MC-1": ("b1", {
        "en": "Marked values differ from the age norm after correction for multiple comparisons, which keeps chance results among the many comparisons rare; a value beyond 2 z that is not marked may deviate by chance alone. The method of correction is still to be chosen.",
        "de": "Markierte Werte weichen nach Korrektur für multiple Vergleiche von der Altersnorm ab; die Korrektur hält Zufallsergebnisse unter den vielen Vergleichen selten. Ein nicht markierter Wert jenseits von 2 z kann allein durch Zufall abweichen. Die Korrekturmethode ist noch festzulegen.",
        "ja": "印の付いた値は、多重比較の補正後も年齢基準と異なる値です。補正により、多数の比較の中で偶然による偏差はまれになります。印のない2 zを超える値は、偶然だけで偏差を示している可能性があります。補正方法はまだ決まっていません。"}),
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

# Choice sentences: one id set for both pipelines, exported by prototype2/build_data.py as
# "choice_sentences" ({lang: {id: template}}), together with the fragments below that fill
# {state}, {lat_state}, {amp_state} and {items} ("choice_parts").
# Pending (shared decision of 29 October): a report is issued only after the segments, the
# cleaning, the alpha peak frequency marker and the ERP peaks of every trial type with scored
# peaks (Go, NoGo, Novelty) are confirmed; until then the draft states what is pending. With
# changes waiting, Q-SEG-PEND-1 and ERP-PEAK-PEND-1 give their count {n}; with none (proposal not
# yet confirmed, nothing changed) the separate ids Q-SEG-PEND-0 and ERP-PEAK-PEND-0 say "not yet
# confirmed by the clinician" without a count. MK-PEND-1 {hz} is the unconfirmed marker.
CHOICE_IDS = ("Q-SEG-AUTO-1", "Q-SEG-MAN-1", "Q-SEG-PEND-1", "Q-SEG-PEND-0", "MK-AUTO-1",
              "MK-MOVED-1", "MK-PEND-1", "ERP-PEAK-AUTO-1", "ERP-PEAK-MAN-1", "ERP-PEAK-PEND-1",
              "ERP-PEAK-PEND-0", "SUM-CHG-1", "SUM-CHG-2", "SUM-CHG-3")
CHOICE_PARTS = {
    "en": {"state.not": "not marked", "state.above": "above the age norm",
           "state.below": "below the age norm", "state.later": "later than the age norm",
           "state.earlier": "earlier than the age norm",
           "state.more_negative": "more negative than the age norm",
           "state.less_negative": "less negative than the age norm",
           "state_z": "{state} (z = {z})",
           "item_lat": "{comp} latency, {trial}: {site} (z = {z})",
           "item_amp": "{comp} amplitude, {trial}: {site} (z = {z})",
           "item_apf": "alpha peak frequency, eyes closed: posterior mean (z = {z})",
           "item_sep": "; "},
    "de": {"state.not": "nicht markiert", "state.above": "über der Altersnorm",
           "state.below": "unter der Altersnorm", "state.later": "später als die Altersnorm",
           "state.earlier": "früher als die Altersnorm",
           "state.more_negative": "negativer als die Altersnorm",
           "state.less_negative": "weniger negativ als die Altersnorm",
           "state_z": "{state} (z = {z})",
           "item_lat": "{comp}-Latenz, {trial}: {site} (z = {z})",
           "item_amp": "{comp}-Amplitude, {trial}: {site} (z = {z})",
           "item_apf": "Alpha-Peak-Frequenz, Augen geschlossen: posteriorer Mittelwert (z = {z})",
           "item_sep": "; "},
    "ja": {"state.not": "印なし", "state.above": "年齢基準より高い",
           "state.below": "年齢基準より低い", "state.later": "年齢基準より遅い",
           "state.earlier": "年齢基準より早い",
           "state.more_negative": "年齢基準より負の振幅が大きい",
           "state.less_negative": "年齢基準より負の振幅が小さい",
           "state_z": "{state}（z = {z}）",
           "item_lat": "{trial}試行の{comp}潜時：{site}（z = {z}）",
           "item_amp": "{trial}試行の{comp}振幅：{site}（z = {z}）",
           "item_apf": "閉眼時のアルファピーク周波数：後部電極の平均（z = {z}）",
           "item_sep": "／"},
}


def choice_export(langs=("en", "de")):
    """({lang: {id: template}}, {lang: {part: template}}) for the prototype data."""
    return ({lang: {sid: LIB[sid][1][lang] for sid in CHOICE_IDS} for lang in langs},
            {lang: dict(CHOICE_PARTS[lang]) for lang in langs})


def z_state(lang, z, marked, kind="v"):
    """"not marked (z = 0.4)" or "later than the age norm (z = 3.7)": kind "v" a value, "lat" a
    latency, "neg" the amplitude of a negative component."""
    P = CHOICE_PARTS[lang]
    if not marked:
        w = P["state.not"]
    elif kind == "lat":
        w = P["state.later"] if z > 0 else P["state.earlier"]
    elif kind == "neg":
        w = P["state.more_negative"] if z < 0 else P["state.less_negative"]
    else:
        w = P["state.above"] if z > 0 else P["state.below"]
    return P["state_z"].format(state=w, z=fmt_z(z, lang))


# Words that must never appear in system sentences (intended-use.md §4); checked on every build.
# One shared list (`mockup/checks/terms.py`) for the sentences, the report labels, the clinic
# claim check of the PDF and the prototype text check; the sentences add SENTENCE_EXTRA.
FORBIDDEN = {lang: terms.COMPILED + terms.COMPILED_JA + terms.COMPILED_SENTENCE[lang]
             for lang in LANGS}
# The one sentence that may name "diagnose" and "recommend treatment" is the negation L-AID-1.
FORBIDDEN_EXEMPT = {"L-AID-1"}


def forbidden_hits(text, lang):
    """[(category, pattern, word)] of forbidden words in a system sentence or label of lang."""
    return terms.hits(text, sentence_lang=lang)


def check_library():
    from .i18n import L
    problems = []
    for lang, labels in L.items():
        for k, t in labels.items():
            for _, pat, word in forbidden_hits(t, lang):
                problems.append(f"label {k} {lang}: {word!r} matches {pat}")
    for sid, (_, texts) in LIB.items():
        if sid in FORBIDDEN_EXEMPT:
            continue
        for lang, t in texts.items():
            for _, pat, word in forbidden_hits(t, lang):
                problems.append(f"{sid} {lang}: {word!r} matches {pat}")
    for lang, parts in CHOICE_PARTS.items():
        for k, t in parts.items():
            for _, pat, word in forbidden_hits(t, lang):
                problems.append(f"choice part {k} {lang}: {word!r} matches {pat}")
    missing = [f"{sid} {lang}" for sid in CHOICE_IDS for lang in LANGS
               if lang not in LIB.get(sid, ("", {}))[1]]
    if missing:
        problems.append(f"choice sentences missing: {missing}")
    return problems


# ---------------------------------------------------------------------------------------------
# Rounding: one rule for both pipelines (review C1, mockup assumption M6). A value is rounded half
# up from its decimal form (repr), once, to the precision it is printed with, before any table,
# sentence, ranking or sort uses it; the PDF (render.py) and the prototype (build_data.py) both
# start from round_case(case).
# ---------------------------------------------------------------------------------------------

def half_up(x, nd):
    """x rounded half up to nd decimals from its decimal form (1.25 -> 1.3, -1.25 -> -1.3);
    never a negative zero."""
    q = float(Decimal(repr(x)).quantize(Decimal(1).scaleb(-nd), rounding=ROUND_HALF_UP))
    return 0.0 if q == 0 else q


def printed_decimals(key, parent):
    """Decimals a case value is printed with, by its key and the key of the object holding it;
    None for a value printed as it is stored (counts, ms, percent of trials) or not printed."""
    if key == "z" or key.endswith("_z"):          # every z, incl. maps_1hz_z and spectra z
        return 1
    if key == "percentile":
        return 0
    if key == "amplitude_uv":
        return 1
    if parent in ("tbr", "faa") and key in ("value", "norm_mean"):
        return 2
    if parent == "alpha_peak" and key in ("hz", "norm_mean"):
        return 1
    if parent in ("pairs", "global") and key == "value":    # coherence per pair and global
        return 2
    return None


def round_case(o, key=None, parent=None):
    """A copy of the case with every printed value rounded half up to its printed precision."""
    if isinstance(o, dict):
        return {k: round_case(v, k, key) for k, v in o.items()}
    if isinstance(o, list):
        return [round_case(v, key, parent) for v in o]
    if isinstance(o, float) and key is not None:
        nd = printed_decimals(key, parent)
        if nd is not None:
            return half_up(o, nd)
    return o


def zkey(z):
    """Sort key for ranking by |z|: the printed value, so ties in print keep the data order."""
    return -abs(half_up(z, 1))


def num(x, nd, lang):
    """A number with nd decimals, rounded half up (half_up); German uses the decimal comma."""
    s = f"{half_up(x, nd):.{nd}f}"
    return s.replace(".", ",") if lang == "de" else s


def fmt_z(z, lang):
    s = num(z, 1, lang)
    return s.replace("-", "−") if lang == "ja" else s


# Product names stay as they are; only a descriptive suffix is translated.
PRODUCT = {"de": {"Mock norms 2026.1 (synthetic)": "Mock norms 2026.1 (synthetisch)"}}


def product(name, lang):
    return PRODUCT.get(lang, {}).get(name, name)


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
    """Threshold test on the printed value (one decimal), so text and tables agree. Used only for
    the "beyond 2 z" state and the completeness rule; sentences follow "marked"."""
    return abs(half_up(z, 1)) >= limit


def sign(z):
    return "+" if z > 0 else "-"


# ---------------------------------------------------------------------------------------------
# Selection rules: one explicit condition over computed values selects one sentence.
# ---------------------------------------------------------------------------------------------

def spectral_sentences(case, meas, cond, lang, relative=True):
    out = []
    bands = meas["spectra"]["conditions"][cond]["bands"]
    ch = case["channels"]
    kinds = (("abs", "SP-ABS-1"), ("rel", "SP-REL-1")) if relative else (("abs", "SP-ABS-1"),)
    for key, sid in kinds:
        for b in BAND[lang]:
            zs, mk = bands[b][key + "_z"], bands[b][key + "_marked"]
            for sg in ("+", "-"):
                hits = [(ch[i], z) for i, z in enumerate(zs) if mk[i] and sign(z) == sg]
                if not hits:
                    continue
                sites = list_join([f"{c} (z = {fmt_z(z, lang)})" for c, z in hits], lang)
                out.append(say(sid, lang, band=BAND[lang][b], cond=COND[lang][cond],
                               dir=DIR[lang][sg], sites=sites))
    if not out:
        out.append(say("SP-NONE-2", lang, cond=COND[lang][cond]))
    apf = meas["spectra"]["conditions"][cond]["alpha_peak"]
    if apf["marked"]:
        out.append(say("APF-OUT-1", lang, cond=COND[lang][cond], hz=num(apf['hz'], 1, lang),
                       dir=DIR[lang][sign(apf["z"])], z=fmt_z(apf["z"], lang)))
    else:
        out.append(say("APF-IN-2", lang, cond=COND[lang][cond], hz=num(apf['hz'], 1, lang),
                       z=fmt_z(apf["z"], lang)))
    return out


def ratio_sentences(meas, cond, lang):
    c = meas["spectra"]["conditions"][cond]
    return [say("TBR-1", lang, cond=COND[lang][cond], v=num(c['tbr']['value'], 2, lang),
                z=fmt_z(c["tbr"]["z"], lang)),
            say("FAA-1", lang, cond=COND[lang][cond], v=num(c['faa']['value'], 2, lang),
                z=fmt_z(c["faa"]["z"], lang))]


def asymmetry_sentences(meas, cond, lang):
    out = []
    asym = meas["spectra"]["conditions"][cond]["asymmetry"]
    for b in BAND[lang]:
        for sg in ("+", "-"):
            hits = [r for r in asym[b] if r["marked"] and sign(r["z"]) == sg]
            if hits:
                pairs = list_join([f"{r['pair']} (z = {fmt_z(r['z'], lang)})" for r in hits], lang)
                out.append(say("ASY-1", lang, band=BAND[lang][b], cond=COND[lang][cond],
                               dir=DIR[lang][sg], pairs=pairs))
    return out


# Phrase a coherence sentence uses when it lists only some pairs; it points at the pair table of
# the coherence block (the report build fails when that table is absent).
TABLE_REF = {"en": "{n} more in the table", "de": "{n} weitere in der Tabelle",
             "ja": "ほか{n}組は表を参照"}


def coherence_sentences(meas, cond, lang, max_listed=6, with_refs=False):
    """with_refs: attach to a sentence that points at the pair table which table and pairs it
    means ("refers"), for the report build check."""
    out = []
    for b in BAND[lang]:
        for sg in ("+", "-"):
            hits = sorted([p for p in meas["coherence"][cond][b]["pairs"]
                           if p["marked"] and sign(p["z"]) == sg],
                          key=lambda p: zkey(p["z"]))
            if not hits:
                continue
            shown = [f"{p['pair']} (z = {fmt_z(p['z'], lang)})" for p in hits[:max_listed]]
            if len(hits) > max_listed:
                shown.append(TABLE_REF[lang].format(n=len(hits) - max_listed))
            name = BAND[lang][b]
            out.append(say("COH-1", lang, Band=name[0].upper() + name[1:] if lang == "en" else name,
                           band=name, cond=COND[lang][cond], dir=DIR[lang][sg], n=len(hits),
                           npairs={"en": f"{len(hits)} electrode pair" + ("s" if len(hits) > 1 else ""),
                                   "de": f"{len(hits)} Elektrodenpaar" + ("e" if len(hits) > 1 else ""),
                                   "ja": ""}[lang],
                           pairs=list_join(shown, lang)))
            if with_refs and len(hits) > max_listed:
                out[-1]["refers"] = {"table": "coh_pairs", "cond": cond, "band": b,
                                     "pairs": [p["pair"] for p in hits]}
    return out


def erp_sentences(meas, lang):
    out = []
    for p in meas["erp"]["peaks"]:
        trial = TRIAL[lang][p["condition"]]
        if p["amplitude_marked"]:
            neg = p["component"] in NEGATIVE_COMPONENTS
            out.append(say("ERP-AMP-NEG-1" if neg else "ERP-AMP-1", lang, comp=p["component"],
                           site=p["site"], trial=trial,
                           dir=(NEG_DIR if neg else DIR)[lang][sign(p["amplitude_z"])],
                           v=num(p['amplitude_uv'], 1, lang), z=fmt_z(p["amplitude_z"], lang)))
        if p["latency_marked"]:
            out.append(say("ERP-LAT-1", lang, comp=p["component"], site=p["site"], trial=trial,
                           dir=LAT_DIR[lang][sign(p["latency_z"])], v=p["latency_ms"],
                           z=fmt_z(p["latency_z"], lang)))
    if not out:
        out.append(say("ERP-NONE-2", lang))
    return out


def behaviour_sentences(meas, lang):
    out = []
    v = meas["vcpt"]
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = v[key]
        val = f"{m['value']}{UNIT[key]}"
        p = f"{int(m['percentile'] + 0.5)}" if m["percentile"] < 99.5 else ">99"
        if m["marked"]:
            out.append(say("BEH-OUT-1", lang, measure=VCPT_MEASURE[lang][key], v=val,
                           dir=DIR[lang][sign(m["z"])], p=p))
        else:
            out.append(say("BEH-IN-2", lang, measure=VCPT_MEASURE[lang][key], v=val, p=p))
    return out


# Analysis families the summary ranks (SUM-RULE-2), with their labels for SUM-COUNT-1.
FAMILY = {
    "band": {"en": "band power", "de": "Bandleistung", "ja": "帯域パワー"},
    "maps1hz": {"en": "maps per 1 Hz band", "de": "Karten je 1-Hz-Band", "ja": "1 Hz帯域マップ"},
    "indices": {"en": "alpha peak and ratios", "de": "Alpha-Peak und Quotienten",
                "ja": "アルファピークと比・指数"},
    "asym": {"en": "asymmetry map", "de": "Asymmetriekarte", "ja": "非対称マップ"},
    "coh": {"en": "coherence", "de": "Kohärenz", "ja": "コヒーレンス"},
    "erp": {"en": "ERP peaks", "de": "ERP-Peaks", "ja": "ERPピーク"},
    "vcpt": {"en": "VCPT task", "de": "VCPT-Aufgabe", "ja": "VCPT課題"},
}


def all_deviations(case, meas, lang):
    """Every value the summary ranks, as (abs z, z, label, marked, family, stem, where), largest
    first; label = stem plus where (site or pair), used to group the summary."""
    items = []
    ch = case["channels"]
    for cond in ("EO", "EC"):
        c = meas["spectra"]["conditions"][cond]
        cl = COND[lang][cond]
        for b in BAND[lang]:
            for key, lab in (("abs", {"en": "absolute", "de": "absolute", "ja": "絶対"}),
                             ("rel", {"en": "relative", "de": "relative", "ja": "相対"})):
                bd = c["bands"][b]
                stem = {"en": f"{lab[lang]} {BAND[lang][b]} power, {cl}",
                        "de": f"{lab[lang]} {BAND[lang][b]}-Leistung, {cl}",
                        "ja": f"{cl}の{BAND[lang][b]}{lab[lang]}パワー"}[lang]
                for i, z in enumerate(bd[key + "_z"]):
                    if lang == "ja":
                        label = f"{cl}の{ch[i]}における{BAND[lang][b]}{lab[lang]}パワー"
                    elif lang == "de":
                        label = f"{lab[lang]} {BAND[lang][b]}-Leistung an {ch[i]}, {cl}"
                    else:
                        label = f"{lab[lang]} {BAND[lang][b]} power at {ch[i]}, {cl}"
                    items.append((abs(z), z, label, bd[key + "_marked"][i], "band", stem, ch[i]))
        for k, row in enumerate(c["maps_1hz_z"]):
            hz = f"{k + 1}-{k + 2} Hz"
            stem = {"en": f"absolute power {hz}, {cl}", "de": f"absolute Leistung {hz}, {cl}",
                    "ja": f"{cl}の{hz}の絶対パワー"}[lang]
            for i, z in enumerate(row):
                label = {"en": f"absolute power {hz} at {ch[i]}, {cl}",
                         "de": f"absolute Leistung {hz} an {ch[i]}, {cl}",
                         "ja": f"{cl}の{ch[i]}における{hz}の絶対パワー"}[lang]
                items.append((abs(z), z, label, c["maps_1hz_marked"][k][i], "maps1hz", stem, ch[i]))
        apf = c["alpha_peak"]
        label = {"en": f"alpha peak frequency, {cl}", "de": f"Alpha-Peak-Frequenz, {cl}",
                 "ja": f"{cl}のアルファピーク周波数"}[lang]
        items.append((abs(apf["z"]), apf["z"], label, apf["marked"], "indices", label, None))
        label = {"en": f"theta/beta ratio at Cz, {cl}", "de": f"Theta/Beta-Quotient an Cz, {cl}",
                 "ja": f"{cl}のCzにおけるシータ/ベータ比"}[lang]
        items.append((abs(c["tbr"]["z"]), c["tbr"]["z"], label, c["tbr"]["marked"], "indices",
                      label, None))
        label = {"en": f"frontal alpha asymmetry index, {cl}",
                 "de": f"frontaler Alpha-Asymmetrieindex, {cl}",
                 "ja": f"{cl}の前頭部アルファ非対称指数"}[lang]
        items.append((abs(c["faa"]["z"]), c["faa"]["z"], label, c["faa"]["marked"], "indices",
                      label, None))
        for b in BAND[lang]:
            bn = BAND[lang][b]
            stem = {"en": f"{bn} asymmetry index, {cl}", "de": f"{bn}-Asymmetrieindex, {cl}",
                    "ja": f"{cl}の{bn}非対称指数"}[lang]
            for r in c["asymmetry"][b]:
                items.append((abs(r["z"]), r["z"],
                              {"en": f"{bn} asymmetry index {r['pair']}, {cl}",
                               "de": f"{bn}-Asymmetrieindex {r['pair']}, {cl}",
                               "ja": f"{cl}の{r['pair']}における{bn}非対称指数"}[lang],
                              r["marked"], "asym", stem, r["pair"]))
            stem = {"en": f"{bn} coherence, {cl}", "de": f"{bn}-Kohärenz, {cl}",
                    "ja": f"{cl}の{bn}コヒーレンス"}[lang]
            for r in meas["coherence"][cond][b]["pairs"]:
                items.append((abs(r["z"]), r["z"],
                              {"en": f"{bn} coherence {r['pair']}, {cl}",
                               "de": f"{bn}-Kohärenz {r['pair']}, {cl}",
                               "ja": f"{cl}の{r['pair']}における{bn}コヒーレンス"}[lang],
                              r["marked"], "coh", stem, r["pair"]))
    for p in meas["erp"]["peaks"]:
        trial = TRIAL[lang][p["condition"]]
        label = {"en": f"{p['component']} amplitude at {p['site']}, {trial}",
                 "de": f"{p['component']}-Amplitude an {p['site']}, {trial}",
                 "ja": f"{trial}試行の{p['site']}における{p['component']}振幅"}[lang]
        stem = {"en": f"{p['component']} amplitude, {trial}", "de": f"{p['component']}-Amplitude, {trial}",
                "ja": f"{trial}試行の{p['component']}振幅"}[lang]
        items.append((abs(p["amplitude_z"]), p["amplitude_z"], label, p["amplitude_marked"], "erp",
                      stem, p["site"]))
        if p["latency_z"] is not None:
            label = {"en": f"{p['component']} latency at {p['site']}, {trial}",
                     "de": f"{p['component']}-Latenz an {p['site']}, {trial}",
                     "ja": f"{trial}試行の{p['site']}における{p['component']}潜時"}[lang]
            stem = {"en": f"{p['component']} latency, {trial}", "de": f"{p['component']}-Latenz, {trial}",
                    "ja": f"{trial}試行の{p['component']}潜時"}[lang]
            items.append((abs(p["latency_z"]), p["latency_z"], label, p["latency_marked"], "erp",
                          stem, p["site"]))
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = meas["vcpt"][key]
        items.append((abs(m["z"]), m["z"], VCPT_MEASURE[lang][key], m["marked"], "vcpt",
                      VCPT_MEASURE[lang][key], None))
    return sorted(items, key=lambda x: zkey(x[1]))


def summary_sentences(case, meas, lang):
    every = all_deviations(case, meas, lang)
    items = [x for x in every if x[3]]
    if not items:
        return [say("SUM-NONE-2", lang)]
    chosen = [x for i, x in enumerate(items) if i < SUMMARY_TOP or over(x[1], SUMMARY_ALWAYS)]
    # one entry per analysis and condition, in the order of its largest value, listing its sites
    groups = {}
    for _, z, _, _, _, stem, where in chosen:
        groups.setdefault(stem, []).append((where, z))
    text_items = []
    for stem, vals in groups.items():
        if vals[0][0] is None:
            text_items.append(f"{stem} (z = {fmt_z(vals[0][1], lang)})")
        else:
            sep = "、" if lang == "ja" else ", "
            text_items.append(f"{stem}{'：' if lang == 'ja' else ': '}"
                              + sep.join(f"{w} (z = {fmt_z(z, lang)})" for w, z in vals))
    joiner = "／" if lang == "ja" else "; "
    of = {"en": "{k} of {n}", "de": "{k} von {n}", "ja": "{n}中{k}"}[lang]
    counts = []
    for fam, names in FAMILY.items():
        n = sum(1 for x in every if x[4] == fam)
        k = sum(1 for x in items if x[4] == fam)
        counts.append(f"{names[lang]} {of.format(k=k, n=n)}")
    return [say("SUM-2", lang, items=joiner.join(text_items)),
            say("SUM-RULE-2", lang, top=SUMMARY_TOP, always=f"{SUMMARY_ALWAYS:.0f}"),
            say("SUM-COUNT-1", lang, items=list_join(counts, lang))]


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


def confirmation_sentences(meas, lang):
    """The clinician's confirmed choices shown in the report (shared spec 3.4): the segments and
    the alpha peak frequency marker (eyes closed, posterior mean, mockup assumption M28). The
    synthetic case carries no confirmation record and counts as confirmed unchanged (mockup
    assumption M42), so the PDF prints the AUTO variants; the prototype picks MAN, MOVED or PEND
    from the clinician's actions."""
    apf = meas["spectra"]["conditions"]["EC"]["alpha_peak"]
    return [say("Q-SEG-AUTO-1", lang),
            say("MK-AUTO-1", lang, suggested=num(apf["hz"], 1, lang),
                state=z_state(lang, apf["z"], apf["marked"]))]


def erp_peak_confirmation(meas, lang):
    """ERP peaks confirmed unchanged (see confirmation_sentences), one sentence per trial type
    with a peak whose latency the clinician can move (Ignore has none, mockup assumption M39)."""
    trials = []
    for p in meas["erp"]["peaks"]:
        if p["latency_ms"] is not None and p["condition"] not in trials:
            trials.append(p["condition"])
    order = list(TRIAL[lang])
    return [say("ERP-PEAK-AUTO-1", lang, trial=TRIAL[lang][t])
            for t in sorted(trials, key=order.index)]


def report_id(case_code, date_iso, version=None):
    """Report id (mockup assumption): "R-" + case code + "-" + measurement date as MMDD, then
    " v" + version when a version is given: "R-MOCK-042-0915 v1"."""
    rid = f"R-{case_code}-{date_iso[5:7]}{date_iso[8:10]}"
    return rid if version is None else f"{rid} v{version}"


def limits_sentences(lang, earlier=None):
    out = [say("L-AID-1", lang), say("L-Z-1", lang), say("L-MC-1", lang)]
    if earlier:
        out.append(say("L-REPROC-1", lang, date=fmt_date(earlier["date"], lang),
                       sw=earlier["processed_with"]["software"],
                       norms=product(earlier["processed_with"]["norms"], lang)))
        out.append(say("L-SIDE-1", lang))
    return out


def comparison_sentences(case, current, earlier, lang, top=6):
    """Side by side z values for the measures marked in either measurement, largest |z| first
    (kind (a))."""
    cur = {x[2]: (x[1], x[3]) for x in all_deviations(case, current, lang)}
    ear = {x[2]: (x[1], x[3]) for x in all_deviations(case, earlier, lang)}
    keys = [k for k in cur if k in ear and (cur[k][1] or ear[k][1])]
    keys = sorted(keys, key=lambda k: min(zkey(cur[k][0]), zkey(ear[k][0])))[:top]
    return [say("CMP-1", lang, measure=k, z1=fmt_z(ear[k][0], lang), d1=fmt_date(earlier["date"], lang),
                z2=fmt_z(cur[k][0], lang), d2=fmt_date(current["date"], lang)) for k in keys]


if __name__ == "__main__":
    probs = check_library()
    print("forbidden-word check:", "clean" if not probs else probs)
