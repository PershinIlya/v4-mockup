"""Fixed sentence library and selection rules (mockup of the deterministic text layer).

Follows `docs/40-research/briefs/deterministic-text-layer.md` in PershinIlya/v4: only kinds
(a) restating a measured value against the norm, (a) summary by a fixed rule with a
completeness rule, (a) quality and limits, and (b1) condition-neutral explanation of a measure or
statistic. No construct names, no condition names, no "normal" or "abnormal", no interpretation,
no advice, no patient names in any sentence.

Every sentence has an id, a version and a kind. The clinic PDFs list the ids used in a short
"Text sources" block at the end (review D7); the annotated build and the prototype's annotations
show the id after each sentence. Each rule is a single explicit condition over computed values
that selects one sentence; ranking uses one statistic (|z|).

Selection follows the boolean "marked" stored next to every z (correction for multiple
comparisons with a false discovery rate method, shared document 3.2; the mockup applies a
stand-in, assumption M33), not |z| >= 2. A value has one of three states: marked, beyond 2 z but
not marked, within 2 z. Values of analyses with many values (band power, maps, asymmetry,
coherence of both types, source power per brain region, ERP peaks) get sentences only when
marked. Single-value measures (theta/beta ratio, frontal alpha asymmetry index, frontal theta /
parietal alpha ratio, alpha reactivity, alpha peak frequency, the four VCPT task results) are
always restated with their z, marked or not: a separate sentence kind "restatement of a
single-value measure" for the clinical lead to confirm (review C19).

German and Japanese wording: drafted for the mockup, not reviewed by a qualified bilingual
clinician (mockup assumption). German sentences name the user "Untersucherin oder Untersucher",
since users include psychologists (review C6).
"""

import re
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from .checks import terms

# Version of the sentence library (Versions block, review B11); the German and Japanese wording is
# not reviewed (M10).
TEXTLIB_VERSION = "2026.2"   # 2026.2: round of 30 October
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
# A latency is longer or shorter than the age norm (review C6: "later" read as a time of day).
LAT_DIR = {
    "en": {"+": "longer than", "-": "shorter than"},
    "de": {"+": "länger als", "-": "kürzer als"},
    "ja": {"+": "長い", "-": "短い"},
}
# Coherence types (table 3.3, 30 October): per electrode pair magnitude squared (Core) or lagged
# (Core, proposed), the user chooses; global coherence in four types (Core), mean over all pairs.
COH_KINDS = ("msc", "lagged")
GLOBAL_TYPES = ("msc", "lagged", "inst", "total")
COH_NAME = {   # the type per electrode pair, as SUM-RULE-3 and COH-NONE-1 name it
    "en": {"msc": "magnitude squared coherence", "lagged": "lagged coherence"},
    "de": {"msc": "Kohärenz (Betragsquadrat)", "lagged": "verzögerte Kohärenz"},
    "ja": {"msc": "二乗コヒーレンス", "lagged": "ラグ付きコヒーレンス"},
}
GLOBAL_NAME = {   # the four global types, as COH-GLOB-1 and the global table name them
    "en": {"msc": "magnitude squared", "lagged": "lagged", "inst": "instantaneous", "total": "total"},
    "de": {"msc": "Betragsquadrat", "lagged": "verzögert", "inst": "instantan", "total": "gesamt"},
    "ja": {"msc": "二乗", "lagged": "ラグ付き", "inst": "瞬時", "total": "総"},
}
# Brain regions of the source power values (SA2; anatomical names only, no function names).
REGIONS = ("frontal_l", "frontal_r", "central_l", "central_r", "temporal_l", "temporal_r",
           "parietal_l", "parietal_r", "occipital_l", "occipital_r")
REGION = {
    "en": {"frontal_l": "left frontal", "frontal_r": "right frontal", "central_l": "left central",
           "central_r": "right central", "temporal_l": "left temporal",
           "temporal_r": "right temporal", "parietal_l": "left parietal",
           "parietal_r": "right parietal", "occipital_l": "left occipital",
           "occipital_r": "right occipital"},
    "de": {"frontal_l": "linksfrontal", "frontal_r": "rechtsfrontal", "central_l": "linkszentral",
           "central_r": "rechtszentral", "temporal_l": "linkstemporal",
           "temporal_r": "rechtstemporal", "parietal_l": "linksparietal",
           "parietal_r": "rechtsparietal", "occipital_l": "linksokzipital",
           "occipital_r": "rechtsokzipital"},
    "ja": {"frontal_l": "左前頭部", "frontal_r": "右前頭部", "central_l": "左中心部",
           "central_r": "右中心部", "temporal_l": "左側頭部", "temporal_r": "右側頭部",
           "parietal_l": "左頭頂部", "parietal_r": "右頭頂部", "occipital_l": "左後頭部",
           "occipital_r": "右後頭部"},
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
    # One sentence per marked pair, with the index value and the side with more power (review
    # C15); the index is (right minus left) / (right plus left), so a positive value means more
    # power at the right electrode of the pair.
    "ASY-1": ("a", {
        "en": "The {band} asymmetry index {pair}, {cond}, is {v} (more power at {side}), {dir} the age norm (z = {z}).",
        "de": "Der {band}-Asymmetrieindex {pair}, {cond}, beträgt {v} (mehr Leistung an {side}) und liegt {dir} der Altersnorm (z = {z}).",
        "ja": "{cond}の{pair}における{band}帯域の非対称指数は{v}（{side}のパワーが大きい）で、年齢基準より{dir}値です（z = {z}）。"}),
    "ASY-2": ("a", {
        "en": "The {band} asymmetry index {pair}, {cond}, is {v} (equal power at both electrodes), {dir} the age norm (z = {z}).",
        "de": "Der {band}-Asymmetrieindex {pair}, {cond}, beträgt {v} (gleiche Leistung an beiden Elektroden) und liegt {dir} der Altersnorm (z = {z}).",
        "ja": "{cond}の{pair}における{band}帯域の非対称指数は{v}（両電極のパワーが等しい）で、年齢基準より{dir}値です（z = {z}）。"}),
    # Coherence per electrode pair names its type (shared document 3.3, 30 October: magnitude
    # squared coherence, Core; lagged coherence, Core, proposed; the user chooses one of them).
    "COH-MSC-1": ("a", {
        "en": "{Band} magnitude squared coherence, {cond}, is {dir} the age norm for {npairs}: {pairs}.",
        "de": "Die {band}-Kohärenz (Betragsquadrat), {cond}, liegt für {npairs} {dir} der Altersnorm: {pairs}.",
        "ja": "{cond}の{band}帯域の二乗コヒーレンスは、{n}組の電極ペアで年齢基準より{dir}値です：{pairs}。"}),
    "COH-LAG-1": ("a", {
        "en": "{Band} lagged coherence, {cond}, is {dir} the age norm for {npairs}: {pairs}.",
        "de": "Die verzögerte {band}-Kohärenz (lagged), {cond}, liegt für {npairs} {dir} der Altersnorm: {pairs}.",
        "ja": "{cond}の{band}帯域のラグ付きコヒーレンスは、{n}組の電極ペアで年齢基準より{dir}値です：{pairs}。"}),
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
    # The summary rule (round of 30 October): {coh} is the coherence type the report shows per
    # electrode pair (magnitude squared unless the template's coherence variant is lagged),
    # {other} the type it leaves unranked; source power per brain region is not part of the list.
    "SUM-RULE-3": ("b1", {
        "en": "This list ranks the marked values of these analyses by |z|: absolute and relative band power, maps per 1 Hz band, alpha peak frequency, theta/beta ratio, frontal alpha asymmetry index, frontal theta / parietal alpha ratio, alpha reactivity, asymmetry map, {coh} per electrode pair, ERP peak amplitude and latency, and VCPT task results. It shows the {top} largest and every marked value of {always} z or more. Not ranked: the spectra per 0.5 Hz bin, shown as curves against the norm, global coherence in its four types, and {other} per electrode pair. Source power per brain region is not part of this list.",
        "de": "Die Liste ordnet die markierten Werte dieser Analysen nach |z|: absolute und relative Bandleistung, Karten je 1-Hz-Band, Alpha-Peak-Frequenz, Theta/Beta-Quotient, frontaler Alpha-Asymmetrieindex, Verhältnis frontales Theta / parietales Alpha, Alpha-Reaktivität, Asymmetriekarte, {coh} je Elektrodenpaar, ERP-Peakamplitude und -latenz sowie die Ergebnisse der VCPT-Aufgabe. Sie zeigt die {top} größten und jeden markierten Wert ab {always} z. Nicht eingeordnet: die Spektren je 0,5-Hz-Schritt, als Kurven gegen die Norm gezeigt, die globale Kohärenz in ihren vier Arten und {other} je Elektrodenpaar. Die Quellenleistung je Hirnregion gehört nicht zu dieser Liste.",
        "ja": "この一覧は、次の解析で印の付いた値を|z|の大きい順に並べます：絶対パワーと相対パワー、1 Hz帯域ごとのマップ、アルファピーク周波数、シータ/ベータ比、前頭部アルファ非対称指数、前頭部シータ/頭頂部アルファ比、アルファ反応性、非対称マップ、電極ペアごとの{coh}、ERPピークの振幅と潜時、VCPT課題の結果。上位{top}項目と、{always} z以上の印の付いたすべての値を示します。0.5 Hzごとのスペクトル（基準と比較した曲線として表示）、4種類のグローバルコヒーレンス、電極ペアごとの{other}は順位付けの対象外です。脳領域ごとのソースパワーはこの一覧に含みません。"}),
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
    # The clinician's changes to the automatic cleaning (review A5): one component kept against
    # the proposal (MAN-1), one removed against it (MAN-2), or two or more changes as a list
    # (MAN-3, its items from the parts "ica.kept" and "ica.removed").
    "Q-ICA-MAN-1": ("a", {
        "en": "Artefact removal changed by the clinician: component {ic} ({kind}) was kept although the automatic cleaning proposed removing it; {k} of {n} components were removed.",
        "de": "Artefaktentfernung durch die Untersucherin oder den Untersucher geändert: Komponente {ic} ({kind}) wurde beibehalten, obwohl die automatische Bereinigung ihre Entfernung vorschlug; {k} von {n} Komponenten wurden entfernt.",
        "ja": "アーチファクト除去は臨床医が変更しました：自動クリーニングは成分{ic}（{kind}）の除去を提案しましたが、保持しました。{n}個中{k}個の成分を除去しました。"}),
    "Q-ICA-MAN-2": ("a", {
        "en": "Artefact removal changed by the clinician: component {ic} ({kind}) was removed although the automatic cleaning proposed keeping it; {k} of {n} components were removed.",
        "de": "Artefaktentfernung durch die Untersucherin oder den Untersucher geändert: Komponente {ic} ({kind}) wurde entfernt, obwohl die automatische Bereinigung ihre Beibehaltung vorschlug; {k} von {n} Komponenten wurden entfernt.",
        "ja": "アーチファクト除去は臨床医が変更しました：自動クリーニングは成分{ic}（{kind}）の保持を提案しましたが、除去しました。{n}個中{k}個の成分を除去しました。"}),
    "Q-ICA-MAN-3": ("a", {
        "en": "Artefact removal changed by the clinician: {list}; {k} of {n} components were removed.",
        "de": "Artefaktentfernung durch die Untersucherin oder den Untersucher geändert: {list}; {k} von {n} Komponenten wurden entfernt.",
        "ja": "アーチファクト除去は臨床医が変更しました：{list}。{n}個中{k}個の成分を除去しました。"}),
    # Choice sentences (shared spec 3.4): the clinician's choices on segments, the alpha peak
    # frequency marker and ERP peaks, one id set for the PDF and the prototype (CHOICE_IDS). AUTO
    # means the proposal was confirmed unchanged, MAN or MOVED a confirmed change, PEND a change
    # not yet confirmed. Placeholders are filled by the pipeline that prints the sentence.
    "Q-SEG-AUTO-1": ("a", {
        "en": "The analysed segments were confirmed by the clinician as proposed.",
        "de": "Die ausgewerteten Segmente wurden von der Untersucherin oder dem Untersucher wie vorgeschlagen bestätigt.",
        "ja": "解析区間は、臨床医が提案どおりに確認しました。"}),
    "Q-SEG-MAN-1": ("a", {
        "en": "{cond}: {analysed} of {recorded} seconds were analysed after artefact removal; the clinician changed the proposed segments (proposal: {proposed} seconds) and confirmed them.",
        "de": "{cond}: {analysed} von {recorded} Sekunden wurden nach der Artefaktentfernung ausgewertet; die Untersucherin oder der Untersucher hat die vorgeschlagenen Segmente geändert (Vorschlag: {proposed} Sekunden) und bestätigt.",
        "ja": "{cond}：アーチファクト除去後、{recorded}秒中{analysed}秒を解析しました。臨床医が提案された区間を変更し（提案：{proposed}秒）、確認しました。"}),
    "Q-SEG-PEND-1": ("a", {
        "en": "Changes by the clinician to the proposed segments, pending confirmation: {n}.",
        "de": "Änderungen der Untersucherin oder des Untersuchers an den vorgeschlagenen Segmenten, Bestätigung ausstehend: {n}.",
        "ja": "臨床医による提案区間の変更（確認待ち）：{n}件。"}),
    "Q-SEG-PEND-0": ("a", {
        "en": "Analysed segments: as proposed, not yet confirmed by the clinician.",
        "de": "Ausgewertete Segmente: wie vorgeschlagen, von der Untersucherin oder dem Untersucher noch nicht bestätigt.",
        "ja": "解析区間：提案どおりです。臨床医はまだ確認していません。"}),
    "MK-AUTO-1": ("a", {
        "en": "Alpha peak frequency, eyes closed (posterior mean): suggested {suggested} Hz, confirmed unchanged by the clinician; {state}.",
        "de": "Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen {suggested} Hz, von der Untersucherin oder dem Untersucher unverändert bestätigt; {state}.",
        "ja": "閉眼時のアルファピーク周波数（後部電極の平均）：提案値{suggested} Hzを臨床医が変更せずに確認しました。{state}。"}),
    "MK-MOVED-1": ("a", {
        "en": "Alpha peak frequency, eyes closed (posterior mean): suggested {suggested} Hz, confirmed at {confirmed} Hz by the clinician; {state}.",
        "de": "Alpha-Peak-Frequenz, Augen geschlossen (posteriorer Mittelwert): vorgeschlagen {suggested} Hz, von der Untersucherin oder dem Untersucher bei {confirmed} Hz bestätigt; {state}.",
        "ja": "閉眼時のアルファピーク周波数（後部電極の平均）：提案値{suggested} Hzを臨床医が{confirmed} Hzに移動して確認しました。{state}。"}),
    "MK-PEND-1": ("a", {
        "en": "Alpha peak frequency marker: suggested at {hz} Hz, not yet confirmed by the clinician.",
        "de": "Marker der Alpha-Peak-Frequenz: vorgeschlagen bei {hz} Hz, von der Untersucherin oder dem Untersucher noch nicht bestätigt.",
        "ja": "アルファピーク周波数マーカー：{hz} Hzを提案しています。臨床医はまだ確認していません。"}),
    "ERP-PEAK-AUTO-1": ("a", {
        "en": "ERP peaks, {trial} trials: the suggested peaks were confirmed unchanged by the clinician.",
        "de": "ERP-Peaks, {trial}-Durchgänge: Die vorgeschlagenen Peaks wurden von der Untersucherin oder dem Untersucher unverändert bestätigt.",
        "ja": "{trial}試行のERPピーク：提案されたピークを臨床医が変更せずに確認しました。"}),
    "ERP-PEAK-MAN-1": ("a", {
        "en": "{comp} at {site}, {trial} trials: the suggested peak at {from_ms} ms was moved by the clinician to {to_ms} ms and confirmed. Latency: {lat_state}; amplitude {amp_uv} µV: {amp_state}.",
        "de": "{comp} an {site}, {trial}-Durchgänge: Der vorgeschlagene Peak bei {from_ms} ms wurde von der Untersucherin oder dem Untersucher auf {to_ms} ms verschoben und bestätigt. Latenz: {lat_state}; Amplitude {amp_uv} µV: {amp_state}.",
        "ja": "{trial}試行の{site}における{comp}：提案された{from_ms} msのピークを臨床医が{to_ms} msに移動して確認しました。潜時：{lat_state}。振幅{amp_uv} µV：{amp_state}。"}),
    "ERP-PEAK-PEND-1": ("a", {
        "en": "ERP peaks, {trial} trials: automatic suggestions; moves by the clinician pending confirmation: {n}.",
        "de": "ERP-Peaks, {trial}-Durchgänge: automatische Vorschläge; Verschiebungen der Untersucherin oder des Untersuchers, Bestätigung ausstehend: {n}.",
        "ja": "{trial}試行のERPピーク：自動提案です。臨床医による移動（確認待ち）：{n}件。"}),
    "ERP-PEAK-PEND-0": ("a", {
        "en": "ERP peaks, {trial} trials: automatic suggestions, not yet confirmed by the clinician.",
        "de": "ERP-Peaks, {trial}-Durchgänge: automatische Vorschläge, von der Untersucherin oder dem Untersucher noch nicht bestätigt.",
        "ja": "{trial}試行のERPピーク：自動提案です。臨床医はまだ確認していません。"}),
    "SUM-CHG-1": ("a", {
        "en": "Marked after the clinician's confirmed changes: {items}.",
        "de": "Nach den bestätigten Änderungen der Untersucherin oder des Untersuchers markiert: {items}.",
        "ja": "臨床医が確認した変更の後に印が付いた値：{items}。"}),
    "SUM-CHG-2": ("a", {
        "en": "No longer marked after the clinician's confirmed changes: {items}.",
        "de": "Nach den bestätigten Änderungen der Untersucherin oder des Untersuchers nicht mehr markiert: {items}.",
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
        "en": "Marked values differ from the age norm after correction for multiple comparisons, which keeps chance results among the many comparisons rare; a value beyond 2 z that is not marked may deviate by chance alone. The correction uses a false discovery rate method; how it accounts for correlated values is decided at implementation.",
        "de": "Markierte Werte weichen nach Korrektur für multiple Vergleiche von der Altersnorm ab; die Korrektur hält Zufallsergebnisse unter den vielen Vergleichen selten. Ein nicht markierter Wert jenseits von 2 z kann allein durch Zufall abweichen. Die Korrektur verwendet ein Verfahren der Falscherkennungsrate; wie es korrelierte Werte berücksichtigt, wird bei der Umsetzung festgelegt.",
        "ja": "印の付いた値は、多重比較の補正後も年齢基準と異なる値です。補正により、多数の比較の中で偶然による偏差はまれになります。印のない2 zを超える値は、偶然だけで偏差を示している可能性があります。補正には偽発見率の方法を用います。相関する値をどう扱うかは実装時に決めます。"}),
    "L-AID-1": ("a", {
        "en": "The results are one input to the clinician's assessment. The software does not diagnose and does not recommend treatment.",
        "de": "Die Ergebnisse sind ein Baustein der klinischen Beurteilung. Die Software stellt keine Diagnose und gibt keine Therapieempfehlung.",
        "ja": "本結果は臨床医による評価の材料の一つです。本ソフトウェアは診断を行わず、治療を推奨しません。"}),
    # Processed again (3.4, 3.8; review B7, lead decision 5): the earlier result set stays with the
    # report issued from it, the new one is used by the comparison; both are named.
    "L-REPROC-1": ("a", {
        "en": "The earlier measurement of {date} was processed again with the current software and norms ({sw}; {norms}) as result set {rs2}; result set {rs1}, from which report {report} was issued, stays unchanged.",
        "de": "Die frühere Messung vom {date} wurde mit der aktuellen Software und den aktuellen Normdaten erneut ausgewertet ({sw}; {norms}), als Ergebnissatz {rs2}; Ergebnissatz {rs1}, aus dem der Bericht {report} freigegeben wurde, bleibt unverändert.",
        "ja": "{date}の過去の測定は、現行のソフトウェアと基準で再解析しました（{sw}、{norms}、結果セット{rs2}）。レポート{report}の発行に用いた結果セット{rs1}は変更しません。"}),
    "L-SIDE-1": ("a", {
        "en": "Measurements are shown side by side, each against its own age norm; differences between them are not tested for statistical significance.",
        "de": "Die Messungen stehen nebeneinander, jede gegen ihre eigene Altersnorm; Unterschiede zwischen ihnen werden nicht auf statistische Signifikanz geprüft.",
        "ja": "各測定はそれぞれの年齢基準と比較して並べて表示しています。測定間の差について統計的有意性は検定していません。"}),
}

# ---------------------------------------------------------------------------------------------
# Night round of 29 October (review B3, B5, B6, D5, D6, Q-ICA-PEND-1). Drafted for the mockup;
# German and Japanese not reviewed by a qualified bilingual clinician (M10).
# ---------------------------------------------------------------------------------------------
LIB.update({
    # Cleaning proposal not yet accepted (shared decision of 29 October, M52): {k} components
    # currently set for removal of {n}.
    "Q-ICA-PEND-1": ("a", {
        "en": "Artefact removal: {k} of {n} independent components are currently set for removal; not yet accepted by the clinician.",
        "de": "Artefaktentfernung: {k} von {n} unabhängigen Komponenten sind derzeit zur Entfernung vorgesehen; von der Untersucherin oder dem Untersucher noch nicht angenommen.",
        "ja": "アーチファクト除去：{n}個の独立成分のうち{k}個が現在除去の対象です。臨床医はまだ承認していません。"}),
    # The same cleaning sentences naming their recording (round 2 should-fix): the prototype cleans
    # each recording on its own (review B3) and prints one sentence per recording, so each names
    # its condition {cond}; the PDF keeps the measurement sentence without {cond} (one ICA record
    # per measurement in the synthetic data).
    "Q-ICA-AUTO-2": ("a", {
        "en": "Artefact removal, {cond}: {k} of {n} independent components were removed, as proposed by the automatic cleaning.",
        "de": "Artefaktentfernung, {cond}: {k} von {n} unabhängigen Komponenten wurden wie von der automatischen Bereinigung vorgeschlagen entfernt.",
        "ja": "{cond}のアーチファクト除去：自動クリーニングの提案どおり、{n}個の独立成分のうち{k}個を除去しました。"}),
    "Q-ICA-MAN-4": ("a", {
        "en": "Artefact removal, {cond}, changed by the clinician: component {ic} ({kind}) was kept although the automatic cleaning proposed removing it; {k} of {n} components were removed.",
        "de": "Artefaktentfernung, {cond}, durch die Untersucherin oder den Untersucher geändert: Komponente {ic} ({kind}) wurde beibehalten, obwohl die automatische Bereinigung ihre Entfernung vorschlug; {k} von {n} Komponenten wurden entfernt.",
        "ja": "{cond}のアーチファクト除去は臨床医が変更しました：自動クリーニングは成分{ic}（{kind}）の除去を提案しましたが、保持しました。{n}個中{k}個の成分を除去しました。"}),
    "Q-ICA-MAN-5": ("a", {
        "en": "Artefact removal, {cond}, changed by the clinician: component {ic} ({kind}) was removed although the automatic cleaning proposed keeping it; {k} of {n} components were removed.",
        "de": "Artefaktentfernung, {cond}, durch die Untersucherin oder den Untersucher geändert: Komponente {ic} ({kind}) wurde entfernt, obwohl die automatische Bereinigung ihre Beibehaltung vorschlug; {k} von {n} Komponenten wurden entfernt.",
        "ja": "{cond}のアーチファクト除去は臨床医が変更しました：自動クリーニングは成分{ic}（{kind}）の保持を提案しましたが、除去しました。{n}個中{k}個の成分を除去しました。"}),
    "Q-ICA-MAN-6": ("a", {
        "en": "Artefact removal, {cond}, changed by the clinician: {list}; {k} of {n} components were removed.",
        "de": "Artefaktentfernung, {cond}, durch die Untersucherin oder den Untersucher geändert: {list}; {k} von {n} Komponenten wurden entfernt.",
        "ja": "{cond}のアーチファクト除去は臨床医が変更しました：{list}。{n}個中{k}個の成分を除去しました。"}),
    "Q-ICA-PEND-2": ("a", {
        "en": "Artefact removal, {cond}: {k} of {n} independent components are currently set for removal; not yet accepted by the clinician.",
        "de": "Artefaktentfernung, {cond}: {k} von {n} unabhängigen Komponenten sind derzeit zur Entfernung vorgesehen; von der Untersucherin oder dem Untersucher noch nicht angenommen.",
        "ja": "{cond}のアーチファクト除去：{n}個の独立成分のうち{k}個が現在除去の対象です。臨床医はまだ承認していません。"}),
    # Frequency markers on the spectra (3.3, Core since 30 October; 3.4 clinician in control; M57).
    "FM-RULE-1": ("b1", {
        "en": "The system proposes up to 3 peaks of the spectrum per condition, those with the largest positive z (absolute power per 0.5 Hz bin); the clinician confirms, moves, removes or adds markers. Each marker shows its z and whether that value is marked.",
        "de": "Das System schlägt je Bedingung bis zu 3 Peaks des Spektrums vor, und zwar die mit dem größten positiven z (absolute Leistung je 0,5-Hz-Schritt); die Untersucherin oder der Untersucher bestätigt, verschiebt, entfernt oder ergänzt Marker. Jeder Marker zeigt sein z und ob dieser Wert markiert ist.",
        "ja": "システムは条件ごとに、スペクトルのピークのうち正のz値が最も大きいものを最大3つ提案します（0.5 Hzごとの絶対パワー）。臨床医がマーカーを確認、移動、削除、追加します。各マーカーにはz値と、その値に印が付いているかを示します。"}),
    "FM-AUTO-1": ("a", {
        "en": "Frequency markers, {cond}: suggested by the system and confirmed unchanged by the clinician; markers: {n}.",
        "de": "Frequenzmarker, {cond}: vom System vorgeschlagen und von der Untersucherin oder dem Untersucher unverändert bestätigt; Marker: {n}.",
        "ja": "{cond}の周波数マーカー：システムの提案を臨床医が変更せずに確認しました。マーカー数：{n}。"}),
    "FM-MOVED-1": ("a", {
        "en": "Frequency marker {k}, {cond}: suggested at {from_site} {from_hz} Hz, moved by the clinician to {site} {hz} Hz and confirmed; {state}.",
        "de": "Frequenzmarker {k}, {cond}: vorgeschlagen bei {from_site} {from_hz} Hz, von der Untersucherin oder dem Untersucher auf {site} {hz} Hz verschoben und bestätigt; {state}.",
        "ja": "{cond}の周波数マーカー{k}：{from_site} {from_hz} Hzの提案を臨床医が{site} {hz} Hzに移動して確認しました。{state}。"}),
    "FM-ADDED-1": ("a", {
        "en": "Frequency marker {k}, {cond}: placed by the clinician at {site} {hz} Hz and confirmed; {state}.",
        "de": "Frequenzmarker {k}, {cond}: von der Untersucherin oder dem Untersucher bei {site} {hz} Hz gesetzt und bestätigt; {state}.",
        "ja": "{cond}の周波数マーカー{k}：臨床医が{site} {hz} Hzに設定して確認しました。{state}。"}),
    "FM-REMOVED-1": ("a", {
        "en": "Frequency marker suggested at {site} {hz} Hz, {cond}: removed by the clinician.",
        "de": "Frequenzmarker, vorgeschlagen bei {site} {hz} Hz, {cond}: von der Untersucherin oder dem Untersucher entfernt.",
        "ja": "{cond}の{site} {hz} Hzに提案された周波数マーカー：臨床医が削除しました。"}),
    "FM-PEND-1": ("a", {
        "en": "Frequency markers, {cond}: suggested by the system; changes by the clinician pending confirmation: {n}.",
        "de": "Frequenzmarker, {cond}: vom System vorgeschlagen; Änderungen der Untersucherin oder des Untersuchers, Bestätigung ausstehend: {n}.",
        "ja": "{cond}の周波数マーカー：システムの提案です。臨床医による変更（確認待ち）：{n}件。"}),
    "FM-PEND-0": ("a", {
        "en": "Frequency markers, {cond}: suggested by the system, not yet confirmed by the clinician.",
        "de": "Frequenzmarker, {cond}: vom System vorgeschlagen, von der Untersucherin oder dem Untersucher noch nicht bestätigt.",
        "ja": "{cond}の周波数マーカー：システムの提案です。臨床医はまだ確認していません。"}),
    "FM-NONE-1": ("a", {
        "en": "Frequency markers, {cond}: no peak suggested by the system and no marker placed by the clinician.",
        "de": "Frequenzmarker, {cond}: kein Peak vom System vorgeschlagen und kein Marker von der Untersucherin oder dem Untersucher gesetzt.",
        "ja": "{cond}の周波数マーカー：システムが提案したピークはなく、臨床医が設定したマーカーもありません。"}),
    "FM-Q-1": ("a", {
        "en": "Frequency marker {k}, {cond}, {site} at {hz} Hz: {question}, answer of the clinician: {answer}.",
        "de": "Frequenzmarker {k}, {cond}, {site} bei {hz} Hz: {question}, Antwort der Untersucherin oder des Untersuchers: {answer}.",
        "ja": "{cond}の周波数マーカー{k}（{site}、{hz} Hz）：{question}、臨床医の回答：{answer}。"}),
    # Method and norms (device block for TG10; review D5, B10).
    "MET-REC-1": ("a", {
        "en": "Recording: {system}; {n} scalp electrodes of the 10-20 system (Fp1 to O2); conditions: {conds}.",
        "de": "Aufnahme: {system}; {n} Kopfhautelektroden des 10-20-Systems (Fp1 bis O2); Bedingungen: {conds}.",
        "ja": "記録：{system}。10-20法による頭皮上{n}電極（Fp1～O2）。条件：{conds}。"}),
    "MET-PROC-1": ("a", {
        "en": "Processing: average reference of the {n} scalp channels; band-pass filter {hp} to {lp} Hz and mains notch filter at {notch} Hz; analysis rate {fs} Hz; artefacts removed by independent component analysis (ICA) with reference maps, then remaining artefact segments excluded.",
        "de": "Verarbeitung: Durchschnittsreferenz der {n} Kopfhautkanäle; Bandpassfilter {hp} bis {lp} Hz und Notch-Filter bei {notch} Hz; Analyserate {fs} Hz; Artefakte durch Analyse unabhängiger Komponenten (ICA) mit Referenzkarten entfernt, danach verbliebene Artefaktsegmente ausgeschlossen.",
        "ja": "処理：頭皮上{n}チャンネルの平均基準、バンドパスフィルタ{hp}～{lp} Hz、電源ノッチフィルタ{notch} Hz、解析レート{fs} Hz。参照マップを用いた独立成分分析（ICA）でアーチファクトを除去し、残ったアーチファクト区間を除外。"}),
    "MET-SPEC-1": ("a", {
        "en": "Spectra: {lo} to {hi} Hz in steps of {step} Hz from windows of {win} s with {ov} % overlap, compared with the norm as log10 power; relative power is the share of the total power from {rlo} to {rhi} Hz. Bands: {bands}. Theta/beta ratio at Cz with theta {t_lo} to {t_hi} Hz and beta {b_lo} to {b_hi} Hz.",
        "de": "Spektren: {lo} bis {hi} Hz in Schritten von {step} Hz aus Fenstern von {win} s mit {ov} % Überlappung, mit der Norm als log10-Leistung verglichen; die relative Leistung ist der Anteil an der Gesamtleistung von {rlo} bis {rhi} Hz. Bänder: {bands}. Theta/Beta-Quotient an Cz mit Theta {t_lo} bis {t_hi} Hz und Beta {b_lo} bis {b_hi} Hz.",
        "ja": "スペクトル：{lo}～{hi} Hz、{step} Hzごと（{win}秒の窓、{ov}%の重なり）。log10パワーとして基準と比較。相対パワーは{rlo}～{rhi} Hzの総パワーに対する割合。帯域：{bands}。Czのシータ/ベータ比はシータ{t_lo}～{t_hi} Hz、ベータ{b_lo}～{b_hi} Hz。"}),
    "MET-ERP-1": ("a", {
        "en": "ERPs: VCPT with {n} trials each of Go, NoGo, Ignore and Novelty; averages of correct trials only; epochs from {a} to {b} ms around the second picture, baseline before the cue; peaks read off the curves in fixed windows ({windows}); CNV as the mean from {c_lo} to {c_hi} ms.",
        "de": "ERPs: VCPT mit je {n} Durchgängen Go, NoGo, Ignore und Novelty; Mittelung nur richtig beantworteter Durchgänge; Epochen von {a} bis {b} ms um das zweite Bild, Baseline vor dem Hinweisreiz; Peaks in festen Fenstern von den Kurven abgelesen ({windows}); CNV als Mittelwert von {c_lo} bis {c_hi} ms.",
        "ja": "ERP：VCPT（Go、NoGo、Ignore、Noveltyを各{n}試行）。正答試行のみを加算平均。第2刺激の前後{a}～{b} ms、ベースラインは手がかり刺激の前。ピークは固定の時間窓で曲線から読み取ります（{windows}）。CNVは{c_lo}～{c_hi} msの平均。"}),
    # The norm model (shared document 3.2 "Normative model", Working, 30 October): one continuous
    # model of age and sex per measure; the mock norms stand in for it (M2, M62, M81).
    "MET-NORM-1": ("a", {
        "en": "Norms: {name}, version {version} (synthetic): one continuous model of age and sex per measure (stand-in for the continuous GAMLSS model proposed for the core), fitted to {n} synthetic subjects per condition; age range {lo} to {hi} years.",
        "de": "Normdaten: {name}, Version {version} (synthetisch): ein stetiges Modell von Alter und Geschlecht je Messgröße (Platzhalter für das stetige GAMLSS-Modell, das für den Kern vorgeschlagen ist), angepasst an {n} synthetische Personen je Bedingung; Altersbereich {lo} bis {hi} Jahre.",
        "ja": "基準データ：{name}、バージョン{version}（合成）。測定項目ごとに年齢と性別の連続モデルを1つ用います（コアに提案されている連続GAMLSSモデルの代用）。条件ごとに合成データ{n}名に当てはめたもので、年齢範囲は{lo}～{hi}歳です。"}),
    "MET-NORM-NONE-1": ("a", {
        "en": "Norms: {name}, version {version} (synthetic); age range of the norms {lo} to {hi} years; not applied, as the age at recording, {age} years, is outside this range.",
        "de": "Normdaten: {name}, Version {version} (synthetisch); Altersbereich der Normdaten {lo} bis {hi} Jahre; nicht angewendet, da das Alter zur Aufnahme, {age} Jahre, außerhalb dieses Bereichs liegt.",
        "ja": "基準データ：{name}、バージョン{version}（合成）。基準データの年齢範囲は{lo}～{hi}歳。検査時の年齢（{age}歳）が範囲外のため適用していません。"}),
    "MET-MC-1": ("a", {
        "en": "Marking: a value is marked when it differs from the age norm after correction for multiple comparisons with a false discovery rate method; this mockup applies Benjamini-Hochberg (q = {q}) within each analysis block as a stand-in until the handling of correlated values is decided.",
        "de": "Markierung: Ein Wert wird markiert, wenn er nach Korrektur für multiple Vergleiche mit einem Verfahren der Falscherkennungsrate von der Altersnorm abweicht; dieses Mockup wendet Benjamini-Hochberg (q = {q}) innerhalb jedes Analyseblocks als Platzhalter an, bis festgelegt ist, wie korrelierte Werte berücksichtigt werden.",
        "ja": "印：偽発見率の方法による多重比較の補正後も年齢基準と異なる値に印を付けます。相関する値の扱いが決まるまで、このモックアップでは代用として解析ブロックごとにBenjamini-Hochberg（q = {q}）を用います。"}),
    # Conditions without results and ages outside the norms (review B6, M58).
    "Q-MIN-1": ("a", {
        "en": "{cond}: {a} of {r} seconds were analysed after artefact removal, below the minimum of {min} seconds; no results are computed for this condition.",
        "de": "{cond}: {a} von {r} Sekunden wurden nach der Artefaktentfernung ausgewertet, weniger als das Minimum von {min} Sekunden; für diese Bedingung werden keine Ergebnisse berechnet.",
        "ja": "{cond}：アーチファクト除去後、{r}秒中{a}秒を解析しました。最小解析時間の{min}秒に達しないため、この条件の結果は算出しません。"}),
    "RES-MIN-1": ("a", {
        "en": "No results for {cond}: the analysed time is below the minimum (see signal quality).",
        "de": "Keine Ergebnisse für {cond}: Die ausgewertete Zeit liegt unter dem Minimum (siehe Signalqualität).",
        "ja": "{cond}の結果はありません：解析時間が最小値に達していません（信号品質を参照）。"}),
    "SUM-MIN-1": ("a", {
        "en": "Not in this summary: {cond}, which has no results (analysed time below the minimum).",
        "de": "Nicht in dieser Zusammenfassung: {cond}, ohne Ergebnisse (ausgewertete Zeit unter dem Minimum).",
        "ja": "この要約には{cond}を含みません（解析時間が最小値に達せず、結果がありません）。"}),
    "NORM-AGE-1": ("a", {
        "en": "No comparison with norms: the age at recording, {age} years, is outside the age range of the norms ({lo} to {hi} years). Values are shown without z, percentile or marks.",
        "de": "Kein Vergleich mit Normdaten: Das Alter zur Aufnahme, {age} Jahre, liegt außerhalb des Altersbereichs der Normdaten ({lo} bis {hi} Jahre). Die Werte werden ohne z, Perzentil und Markierung gezeigt.",
        "ja": "基準との比較なし：検査時の年齢（{age}歳）が基準データの年齢範囲（{lo}～{hi}歳）外です。値はz値、パーセンタイル、印なしで示します。"}),
    "APF-VAL-1": ("a", {
        "en": "The alpha peak frequency, {cond}, is {hz} Hz.",
        "de": "Die Alpha-Peak-Frequenz, {cond}, beträgt {hz} Hz.",
        "ja": "{cond}のアルファピーク周波数は{hz} Hzです。"}),
    "TBR-VAL-1": ("a", {
        "en": "The theta/beta ratio at Cz, {cond}, is {v}.",
        "de": "Der Theta/Beta-Quotient an Cz, {cond}, beträgt {v}.",
        "ja": "{cond}のCzにおけるシータ/ベータ比は{v}です。"}),
    "FAA-VAL-1": ("a", {
        "en": "The frontal alpha asymmetry index (ln F4 minus ln F3), {cond}, is {v}.",
        "de": "Der frontale Alpha-Asymmetrieindex (ln F4 minus ln F3), {cond}, beträgt {v}.",
        "ja": "{cond}の前頭部アルファ非対称指数（ln F4 − ln F3）は{v}です。"}),
    "BEH-VAL-1": ("a", {
        "en": "{measure}: {v}.",
        "de": "{measure}: {v}.",
        "ja": "{measure}：{v}。"}),
    "L-NONORM-1": ("b1", {
        "en": "Without a norm for this age the values cannot be compared with an age norm; no value is marked and no summary of deviations is made.",
        "de": "Ohne Normdaten für dieses Alter können die Werte nicht mit einer Altersnorm verglichen werden; kein Wert wird markiert und keine Zusammenfassung von Abweichungen erstellt.",
        "ja": "この年齢の基準がないため、値を年齢基準と比較できません。印の付いた値はなく、偏差の要約も作成しません。"}),
    "L-IMPORT-1": ("a", {
        "en": "Measurements uploaded later are processed from their recordings; reports and numbers made by earlier software are not imported.",
        "de": "Später hochgeladene Messungen werden aus ihren Aufnahmen ausgewertet; Berichte und Zahlen früherer Software werden nicht übernommen.",
        "ja": "後からアップロードした測定は、その記録から解析します。以前のソフトウェアによるレポートや数値は取り込みません。"}),
})

# ---------------------------------------------------------------------------------------------
# Night round 2 (evening review of 29 October): result sets, the comparison rule, the issue block
# for an age outside the norms (lead decision 2). The checklist over channel ERPs of this round is
# retired by the ERP peak review of 30 October (ERPREV-*). Drafted for the mockup; German and
# Japanese not reviewed (M10).
# ---------------------------------------------------------------------------------------------
LIB.update({
    # An earlier measurement uploaded later has one result set, made by the current software.
    "L-REPROC-2": ("a", {
        "en": "The earlier measurement of {date}, uploaded later, was processed with the current software and norms ({sw}; {norms}) as result set {rs}.",
        "de": "Die frühere Messung vom {date}, später hochgeladen, wurde mit der aktuellen Software und den aktuellen Normdaten ausgewertet ({sw}; {norms}), als Ergebnissatz {rs}.",
        "ja": "後からアップロードした{date}の過去の測定は、現行のソフトウェアと基準で解析しました（{sw}、{norms}、結果セット{rs}）。"}),
    # Measurements side by side (3.4; review B5, C2): one sentence per analysis and condition,
    # the dates once, then per electrode or pair its z values oldest first, as the summary groups
    # its entries.
    "CMP-G-1": ("a", {
        "en": "{measure}, z on {dates}: {items}.",
        "de": "{measure}, z am {dates}: {items}.",
        "ja": "{measure}（{dates}のz値）：{items}。"}),
    # The selection rule of the comparison (review C2), as SUM-RULE-3 for the summary.
    "CMP-RULE-1": ("b1", {
        "en": "This comparison lists {k} of the {n} values marked in at least one of the measurements, ranked by |z|: the {top} largest and every value marked at {always} z or more.",
        "de": "Dieser Vergleich nennt {k} der {n} Werte, die in mindestens einer der Messungen markiert sind, nach |z| geordnet: die {top} größten und jeden markierten Wert ab {always} z.",
        "ja": "この比較では、いずれかの測定で印の付いた{n}項目のうち{k}項目を|z|の大きい順に示します：上位{top}項目と、{always} z以上の印の付いたすべての値です。"}),
    # No report for an age outside the norms (lead decision 2): the fixed reason of the issue block.
    "ISSUE-NONORM-1": ("a", {
        "en": "No report can be issued for this measurement: the age at recording, {age} years, is outside the age range of the norms ({lo} to {hi} years).",
        "de": "Für diese Messung kann kein Bericht freigegeben werden: Das Alter zur Aufnahme, {age} Jahre, liegt außerhalb des Altersbereichs der Normdaten ({lo} bis {hi} Jahre).",
        "ja": "この測定ではレポートを発行できません：検査時の年齢（{age}歳）が基準データの年齢範囲（{lo}～{hi}歳）外です。"}),
})

# ---------------------------------------------------------------------------------------------
# Round of 30 October (shared document of 30 October; spec/impact-1030.md and its addendum):
# ERP peak review (MC1), the coherence types (SA1), source power per brain region (SA2), alpha
# reactivity (SA3) and the frontal theta / parietal alpha ratio (AD1). Drafted for the mockup;
# German and Japanese not reviewed (M10).
# ---------------------------------------------------------------------------------------------
LIB.update({
    # Single-value measures, always restated with their z (M6, review C19). The ratio is printed
    # as the number only: no named index, no wording about mental functions (table 3.3, AD1).
    "FTPA-1": ("a", {
        "en": "The frontal theta / parietal alpha ratio (mean of F3, Fz and F4 over mean of P3, Pz and P4), {cond}, is {v} (z = {z}).",
        "de": "Das Verhältnis frontales Theta / parietales Alpha (Mittel von F3, Fz und F4 geteilt durch Mittel von P3, Pz und P4), {cond}, beträgt {v} (z = {z}).",
        "ja": "{cond}の前頭部シータ/頭頂部アルファ比（F3、Fz、F4の平均をP3、Pz、P4の平均で割った値）は{v}です（z = {z}）。"}),
    "FTPA-VAL-1": ("a", {
        "en": "The frontal theta / parietal alpha ratio (mean of F3, Fz and F4 over mean of P3, Pz and P4), {cond}, is {v}.",
        "de": "Das Verhältnis frontales Theta / parietales Alpha (Mittel von F3, Fz und F4 geteilt durch Mittel von P3, Pz und P4), {cond}, beträgt {v}.",
        "ja": "{cond}の前頭部シータ/頭頂部アルファ比（F3、Fz、F4の平均をP3、Pz、P4の平均で割った値）は{v}です。"}),
    "AR-1": ("a", {
        "en": "Alpha reactivity (absolute alpha power, mean of P3, Pz, P4, O1 and O2, eyes closed over eyes open) is {v} (z = {z}).",
        "de": "Die Alpha-Reaktivität (absolute Alpha-Leistung, Mittel von P3, Pz, P4, O1 und O2, Augen geschlossen geteilt durch Augen offen) beträgt {v} (z = {z}).",
        "ja": "アルファ反応性（P3、Pz、P4、O1、O2の平均絶対アルファパワー、閉眼時を開眼時で割った値）は{v}です（z = {z}）。"}),
    "AR-VAL-1": ("a", {
        "en": "Alpha reactivity (absolute alpha power, mean of P3, Pz, P4, O1 and O2, eyes closed over eyes open) is {v}.",
        "de": "Die Alpha-Reaktivität (absolute Alpha-Leistung, Mittel von P3, Pz, P4, O1 und O2, Augen geschlossen geteilt durch Augen offen) beträgt {v}.",
        "ja": "アルファ反応性（P3、Pz、P4、O1、O2の平均絶対アルファパワー、閉眼時を開眼時で割った値）は{v}です。"}),
    "AR-MIN-1": ("a", {
        "en": "No alpha reactivity: it needs results for both eyes open and eyes closed.",
        "de": "Keine Alpha-Reaktivität: Sie braucht Ergebnisse für Augen offen und Augen geschlossen.",
        "ja": "アルファ反応性はありません：開眼時と閉眼時の両方の結果が必要です。"}),
    # Coherence: no marked pair of the type shown, and the four global types (mean over all
    # electrode pairs, per band; Core), one sentence per marked global value.
    "COH-NONE-1": ("a", {
        "en": "{type} per electrode pair, {cond}: no value is marked.",
        "de": "{type} je Elektrodenpaar, {cond}: kein Wert ist markiert.",
        "ja": "{cond}の電極ペアごとの{type}：印の付いた値はありません。"}),
    "COH-GLOB-1": ("a", {
        "en": "Global coherence ({type}; mean over all electrode pairs) in the {band} band, {cond}, is {dir} the age norm (z = {z}).",
        "de": "Die globale Kohärenz ({type}; Mittel über alle Elektrodenpaare) im {band}-Band, {cond}, liegt {dir} der Altersnorm (z = {z}).",
        "ja": "{cond}の{band}帯域のグローバルコヒーレンス（{type}、全電極ペアの平均）は、年齢基準より{dir}値です（z = {z}）。"}),
    # Source power per brain region (sLORETA region values, table 3.3 Core, proposed; L7): the
    # marked regions per band and direction, and the fixed limits sentence.
    "SRC-1": ("a", {
        "en": "Estimated {band} source power, {cond}, is {dir} the age norm in these regions: {regions}.",
        "de": "Die geschätzte {band}-Quellenleistung, {cond}, liegt in diesen Regionen {dir} der Altersnorm: {regions}.",
        "ja": "{cond}の{band}帯域の推定ソースパワーは、次の領域で年齢基準より{dir}値です：{regions}。"}),
    "SRC-NONE-1": ("a", {
        "en": "No value of the estimated source power per brain region, {cond}, is marked.",
        "de": "Kein Wert der geschätzten Quellenleistung je Hirnregion, {cond}, ist markiert.",
        "ja": "{cond}の脳領域ごとの推定ソースパワーには、印の付いた値はありません。"}),
    "SRC-LIM-1": ("a", {
        "en": "Source power per brain region is estimated with sLORETA from 19 scalp electrodes on a template head; it does not show where in the brain a signal arises.",
        "de": "Die Quellenleistung je Hirnregion wird mit sLORETA aus 19 Kopfhautelektroden auf einem Standardkopfmodell geschätzt; sie zeigt nicht, wo im Gehirn ein Signal entsteht.",
        "ja": "脳領域ごとのソースパワーは、標準頭部モデル上の頭皮上19電極からsLORETAで推定した値です。信号が脳のどこで生じるかを示すものではありません。"}),
    # ERP peak review (table 3.3 "ERP peak values (P1/N1, N2, P3, CNV) against norms, with the
    # clinician's review", Core, proposed; repo IU9 and I8, working decision of 30 October). Per
    # scored peak the system proposes a deviation tick only where the peak is clear and the value
    # is marked; the clinician confirms or changes the ticks and may mark an unusual curve shape.
    # {dev} = choice_parts["rev.amp.<code>"] or ["rev.lat.<code>"].
    "ERPREV-SUG-1": ("a", {
        "en": "ERP peak review, {comp} at {site}, {trial} trials: {dev} (z = {z}), proposed by the system and confirmed by the clinician.",
        "de": "ERP-Peak-Prüfung, {comp} an {site}, {trial}-Durchgänge: {dev} (z = {z}), vom System vorgeschlagen und von der Untersucherin oder dem Untersucher bestätigt.",
        "ja": "ERPピークの確認（{trial}試行の{site}における{comp}）：{dev}（z = {z}）。システムが提案し、臨床医が確認しました。"}),
    "ERPREV-ADD-1": ("a", {
        "en": "ERP peak review, {comp} at {site}, {trial} trials: {dev} (z = {z}), ticked by the clinician; not proposed by the system.",
        "de": "ERP-Peak-Prüfung, {comp} an {site}, {trial}-Durchgänge: {dev} (z = {z}), von der Untersucherin oder dem Untersucher angekreuzt; nicht vom System vorgeschlagen.",
        "ja": "ERPピークの確認（{trial}試行の{site}における{comp}）：{dev}（z = {z}）。臨床医がチェックしました（システムの提案ではありません）。"}),
    "ERPREV-RM-1": ("a", {
        "en": "ERP peak review, {comp} at {site}, {trial} trials: the proposed tick {dev} (z = {z}) was removed by the clinician.",
        "de": "ERP-Peak-Prüfung, {comp} an {site}, {trial}-Durchgänge: Das vorgeschlagene Kreuz {dev} (z = {z}) wurde von der Untersucherin oder dem Untersucher entfernt.",
        "ja": "ERPピークの確認（{trial}試行の{site}における{comp}）：提案されたチェック「{dev}」（z = {z}）を臨床医が外しました。"}),
    "ERPREV-SHAPE-1": ("a", {
        "en": "ERP peak review, {comp} at {site}, {trial} trials: unusual curve shape, marked by the clinician.",
        "de": "ERP-Peak-Prüfung, {comp} an {site}, {trial}-Durchgänge: ungewöhnliche Kurvenform, von der Untersucherin oder dem Untersucher markiert.",
        "ja": "ERPピークの確認（{trial}試行の{site}における{comp}）：通常と異なる波形として臨床医が印を付けました。"}),
    "ERPREV-UNCLEAR-1": ("a", {
        "en": "ERP peak review, {comp} at {site}, {trial} trials: peak not clear; no deviation proposed (amplitude z = {z}).",
        "de": "ERP-Peak-Prüfung, {comp} an {site}, {trial}-Durchgänge: Peak nicht eindeutig; keine Abweichung vorgeschlagen (Amplitude z = {z}).",
        "ja": "ERPピークの確認（{trial}試行の{site}における{comp}）：ピークが明瞭ではないため、偏差は提案していません（振幅 z = {z}）。"}),
    "ERPREV-REST-1": ("a", {
        "en": "ERP peak review: {n} of {total} scored peaks reviewed by the clinician without a deviation tick.",
        "de": "ERP-Peak-Prüfung: {n} von {total} bewerteten Peaks von der Untersucherin oder dem Untersucher ohne Abweichungskreuz geprüft.",
        "ja": "ERPピークの確認：評価対象の{total}ピーク中{n}ピークは、臨床医が偏差のチェックなしで確認しました。"}),
    "ERPREV-PEND-1": ("a", {
        "en": "ERP peak review: proposed by the system; changes by the clinician pending confirmation: {n}.",
        "de": "ERP-Peak-Prüfung: vom System vorgeschlagen; Änderungen der Untersucherin oder des Untersuchers, Bestätigung ausstehend: {n}.",
        "ja": "ERPピークの確認：システムの提案です。臨床医による変更（確認待ち）：{n}件。"}),
    "ERPREV-PEND-0": ("a", {
        "en": "ERP peak review: proposed by the system, not yet confirmed by the clinician.",
        "de": "ERP-Peak-Prüfung: vom System vorgeschlagen, von der Untersucherin oder dem Untersucher noch nicht bestätigt.",
        "ja": "ERPピークの確認：システムの提案です。臨床医はまだ確認していません。"}),
    "ERPREV-NONORM-1": ("a", {
        "en": "ERP peak review: not used, as no norm applies at this age.",
        "de": "ERP-Peak-Prüfung: nicht verwendet, da für dieses Alter keine Normdaten gelten.",
        "ja": "ERPピークの確認：この年齢に適用できる基準がないため使用しません。"}),
    "ERPREV-RULE-1": ("b1", {
        "en": "For each scored peak the system proposes a deviation tick only where the peak is clear (a local extremum of the expected polarity inside its window, not at the window edge, with a prominence of at least twice the residual noise) and its amplitude or latency is marked; the clinician confirms or changes the ticks and may mark an unusual curve shape. Where a peak is not clear, nothing is proposed.",
        "de": "Für jeden bewerteten Peak schlägt das System ein Abweichungskreuz nur vor, wenn der Peak eindeutig ist (ein lokales Extremum der erwarteten Polarität im Fenster, nicht am Fensterrand, mit einer Prominenz von mindestens dem Doppelten des Restrauschens) und seine Amplitude oder Latenz markiert ist; die Untersucherin oder der Untersucher bestätigt oder ändert die Kreuze und kann eine ungewöhnliche Kurvenform markieren. Bei einem nicht eindeutigen Peak wird nichts vorgeschlagen.",
        "ja": "評価対象の各ピークについて、ピークが明瞭（時間窓内で期待される極性の局所極値で、窓の端ではなく、突出度が残差ノイズの2倍以上）で、その振幅または潜時に印が付いている場合にのみ、システムが偏差のチェックを提案します。臨床医がチェックを確認または変更し、通常と異なる波形に印を付けることができます。ピークが明瞭でない場合は何も提案しません。"}),
})

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
           "state.below": "below the age norm", "state.later": "longer than the age norm",
           "state.earlier": "shorter than the age norm",
           "state.more_negative": "more negative than the age norm",
           "state.less_negative": "less negative than the age norm",
           "state_z": "{state} (z = {z})",
           "item_lat": "{comp} latency, {trial}: {site} (z = {z})",
           "item_amp": "{comp} amplitude, {trial}: {site} (z = {z})",
           "item_apf": "alpha peak frequency, eyes closed: posterior mean (z = {z})",
           "item_sep": "; "},
    "de": {"state.not": "nicht markiert", "state.above": "über der Altersnorm",
           "state.below": "unter der Altersnorm", "state.later": "länger als die Altersnorm",
           "state.earlier": "kürzer als die Altersnorm",
           "state.more_negative": "negativer als die Altersnorm",
           "state.less_negative": "weniger negativ als die Altersnorm",
           "state_z": "{state} (z = {z})",
           "item_lat": "{comp}-Latenz, {trial}: {site} (z = {z})",
           "item_amp": "{comp}-Amplitude, {trial}: {site} (z = {z})",
           "item_apf": "Alpha-Peak-Frequenz, Augen geschlossen: posteriorer Mittelwert (z = {z})",
           "item_sep": "; "},
    "ja": {"state.not": "印なし", "state.above": "年齢基準より高い",
           "state.below": "年齢基準より低い", "state.later": "年齢基準より長い",
           "state.earlier": "年齢基準より短い",
           "state.more_negative": "年齢基準より負の振幅が大きい",
           "state.less_negative": "年齢基準より負の振幅が小さい",
           "state_z": "{state}（z = {z}）",
           "item_lat": "{trial}試行の{comp}潜時：{site}（z = {z}）",
           "item_amp": "{trial}試行の{comp}振幅：{site}（z = {z}）",
           "item_apf": "閉眼時のアルファピーク周波数：後部電極の平均（z = {z}）",
           "item_sep": "／"},
}


# Night round: more choice sentences for the prototype (cleaning, frequency markers, the issue
# block without norms), with the fragments that fill them. The cleaning sentences (review A5)
# replace the interface strings the prototype used before. Round of 30 October: the ERP peak
# review (ERPREV-*) replaces the checklist over channel ERPs (ERPCL-* retired).
CHOICE_IDS = CHOICE_IDS + (
    "Q-ICA-AUTO-1", "Q-ICA-MAN-1", "Q-ICA-MAN-2", "Q-ICA-MAN-3", "Q-ICA-PEND-1",
    "Q-ICA-AUTO-2", "Q-ICA-MAN-4", "Q-ICA-MAN-5", "Q-ICA-MAN-6", "Q-ICA-PEND-2",
    "FM-RULE-1", "FM-AUTO-1", "FM-MOVED-1", "FM-ADDED-1", "FM-REMOVED-1",
    "FM-PEND-1", "FM-PEND-0", "FM-NONE-1", "FM-Q-1",
    "ERPREV-SUG-1", "ERPREV-ADD-1", "ERPREV-RM-1", "ERPREV-SHAPE-1", "ERPREV-UNCLEAR-1",
    "ERPREV-REST-1", "ERPREV-PEND-1", "ERPREV-PEND-0", "ERPREV-NONORM-1", "ERPREV-RULE-1",
    "ISSUE-NONORM-1")
# Component kinds of the cleaning sentences, by the reference map a component matches (the six
# reference maps of the legacy artefact correction, ADR 0003 proposed; synth.quality); "none":
# a component that matches no reference map at the threshold.
ICA_KINDS = ("blink", "eye_h", "muscle_l", "muscle_r", "muscle_f", "amplifier", "none")
_NIGHT_PARTS = {
    "en": {"answer.yes": "yes", "answer.no": "no", "q.mu": "mu rhythm",
           "q.beta_spindle": "beta spindles",
           "rev.amp.larger": "amplitude larger than the age norm",
           "rev.amp.smaller": "amplitude smaller than the age norm",
           "rev.amp.more_negative": "amplitude more negative than the age norm",
           "rev.amp.less_negative": "amplitude less negative than the age norm",
           "rev.lat.longer": "latency longer than the age norm",
           "rev.lat.shorter": "latency shorter than the age norm",
           "ica.kept": "component {ic} ({kind}) kept although the automatic cleaning proposed removing it",
           "ica.removed": "component {ic} ({kind}) removed although the automatic cleaning proposed keeping it",
           "ica_sep": "; ",
           "ica.kind.blink": "eye blinks", "ica.kind.eye_h": "horizontal eye movements",
           "ica.kind.muscle_l": "muscle, left temporal", "ica.kind.muscle_r": "muscle, right temporal",
           "ica.kind.muscle_f": "muscle, frontal", "ica.kind.amplifier": "amplifier artefact",
           "ica.kind.none": "no matching reference map"},
    "de": {"answer.yes": "ja", "answer.no": "nein", "q.mu": "My-Rhythmus",
           "q.beta_spindle": "Beta-Spindeln",
           "rev.amp.larger": "Amplitude größer als die Altersnorm",
           "rev.amp.smaller": "Amplitude kleiner als die Altersnorm",
           "rev.amp.more_negative": "Amplitude negativer als die Altersnorm",
           "rev.amp.less_negative": "Amplitude weniger negativ als die Altersnorm",
           "rev.lat.longer": "Latenz länger als die Altersnorm",
           "rev.lat.shorter": "Latenz kürzer als die Altersnorm",
           "ica.kept": "Komponente {ic} ({kind}) beibehalten, obwohl die automatische Bereinigung ihre Entfernung vorschlug",
           "ica.removed": "Komponente {ic} ({kind}) entfernt, obwohl die automatische Bereinigung ihre Beibehaltung vorschlug",
           "ica_sep": "; ",
           "ica.kind.blink": "Lidschläge", "ica.kind.eye_h": "horizontale Augenbewegungen",
           "ica.kind.muscle_l": "Muskel, links temporal", "ica.kind.muscle_r": "Muskel, rechts temporal",
           "ica.kind.muscle_f": "Muskel, frontal", "ica.kind.amplifier": "Verstärkerartefakt",
           "ica.kind.none": "keine passende Referenzkarte"},
    "ja": {"answer.yes": "はい", "answer.no": "いいえ", "q.mu": "ミュー律動",
           "q.beta_spindle": "ベータ紡錘波",
           "rev.amp.larger": "振幅が年齢基準より大きい",
           "rev.amp.smaller": "振幅が年齢基準より小さい",
           "rev.amp.more_negative": "負の振幅が年齢基準より大きい",
           "rev.amp.less_negative": "負の振幅が年齢基準より小さい",
           "rev.lat.longer": "潜時が年齢基準より長い",
           "rev.lat.shorter": "潜時が年齢基準より短い",
           "ica.kept": "成分{ic}（{kind}）は自動クリーニングが除去を提案しましたが保持",
           "ica.removed": "成分{ic}（{kind}）は自動クリーニングが保持を提案しましたが除去",
           "ica_sep": "／",
           "ica.kind.blink": "瞬目", "ica.kind.eye_h": "水平眼球運動",
           "ica.kind.muscle_l": "筋電、左側頭部", "ica.kind.muscle_r": "筋電、右側頭部",
           "ica.kind.muscle_f": "筋電、前頭部", "ica.kind.amplifier": "アンプのアーチファクト",
           "ica.kind.none": "一致する参照マップなし"},
}
for _lang, _parts in _NIGHT_PARTS.items():
    CHOICE_PARTS[_lang].update(_parts)

# Scored peaks of the core (M5: component, trial type, electrode, window), as synth.ERP_PEAKS.
SCORED_PEAKS = [
    ("P1", "go", "O1", (70, 170)), ("P1", "go", "O2", (70, 170)),
    ("N1", "go", "O1", (140, 250)), ("N1", "go", "O2", (140, 250)),
    ("N2", "nogo", "Fz", (210, 330)), ("N2", "nogo", "Cz", (210, 330)),
    ("P3", "go", "Pz", (280, 560)), ("P3", "nogo", "Cz", (300, 600)),
    ("P3", "nogo", "Fz", (300, 600)), ("P3a", "novelty", "Cz", (250, 420)),
    ("CNV", "go", "Cz", (-200, 0)),
]
# the peak windows of the scored peaks (synth.ERP_PEAKS), also printed by the method block
PEAK_WINDOWS = {(c, t, s): w for c, t, s, w in SCORED_PEAKS}

# ERP peak review (table 3.3, 30 October: "ERP peak values (P1/N1, N2, P3, CNV) against norms,
# with the clinician's review", Core, proposed; repo IU9 and I8, working decision of the product
# owner of 30 October; it replaces the checklist over channel ERPs). One row per scored peak. The
# system's "peak clear" (synthetic data: erp.peaks[].clear and prominence_snr; mockup rule: a
# local extremum of the expected polarity inside the window, not at its edge, with a prominence of
# at least REVIEW_SNR times the residual noise SD) gates the proposal: where the peak is clear and
# the value is marked (M33), the system proposes a deviation tick, amplitude "larger" or
# "smaller" (N1, N2, CNV: "more_negative" or "less_negative") and latency "longer" or "shorter";
# the "unusual curve shape" tick only the clinician sets. A peak the clinician moved and confirmed
# (M53) counts as clear, and its proposal follows its new z and mark (mockup assumption).
REVIEW_SNR = 2.0
REVIEW_TICKS = {"amp": ("larger", "smaller", "more_negative", "less_negative"),
                "lat": ("longer", "shorter"), "shape": (True,)}


def review_code(kind, z, negative):
    """The deviation code of a marked value: amplitude by the sign of z (for a negative component
    a negative z is a larger negativity), latency longer for a positive z."""
    if kind == "lat":
        return "longer" if z > 0 else "shorter"
    if negative:
        return "more_negative" if z < 0 else "less_negative"
    return "larger" if z > 0 else "smaller"


def review_rows(meas):
    """[{id, component, trial, site, window_ms, negative, latency, clear, prominence_snr,
    amplitude_z, amplitude_marked, latency_z, latency_marked, proposed {amp, lat}}] of the ERP
    peak review, in the order of erp.peaks. Without a norm nothing is proposed. clear defaults to
    True while the data do not carry it."""
    nn = no_norm(meas)
    rows = []
    for p in meas["erp"]["peaks"]:
        c, t, s_ = p["component"], p["condition"], p["site"]
        neg = c in NEGATIVE_COMPONENTS
        clear = p.get("clear", True) is not False
        prop = {"amp": None, "lat": None}
        if clear and not nn:
            if p.get("amplitude_marked") and p.get("amplitude_z") is not None:
                prop["amp"] = review_code("amp", p["amplitude_z"], neg)
            if p.get("latency_marked") and p.get("latency_z") is not None:
                prop["lat"] = review_code("lat", p["latency_z"], neg)
        rows.append({"id": f"{c}|{t}|{s_}", "component": c, "trial": t, "site": s_,
                     "window_ms": list(PEAK_WINDOWS.get((c, t, s_), ())), "negative": neg,
                     "latency": p.get("latency_ms") is not None, "clear": clear,
                     "prominence_snr": p.get("prominence_snr"),
                     "amplitude_z": p.get("amplitude_z"),
                     "amplitude_marked": bool(p.get("amplitude_marked")),
                     "latency_z": p.get("latency_z"),
                     "latency_marked": bool(p.get("latency_marked")), "proposed": prop})
    return rows


def review_final(rows, inputs=None):
    """{row id: {amp, lat, shape}}: the proposal with the clinician's changes applied (inputs:
    report_inputs.erp_review = {confirmed, changes: {row id: {amp?, lat?, shape?}}}; a key
    present in a change replaces the proposal, null removes a proposed tick)."""
    ch = (inputs or {}).get("changes") or {}
    out = {}
    for r in rows:
        c = ch.get(r["id"]) or {}
        out[r["id"]] = {"amp": c["amp"] if "amp" in c else r["proposed"]["amp"],
                        "lat": c["lat"] if "lat" in c else r["proposed"]["lat"],
                        "shape": bool(c.get("shape"))}
    return out


def review_sentences(meas, inputs, lang):
    """Sentences of the ERP peak review. Confirmed: per row in order, ERPREV-SUG-1 for each tick
    proposed and kept, ERPREV-RM-1 for each proposed tick removed, ERPREV-ADD-1 for each tick the
    clinician added (a changed tick is one removal and one addition), ERPREV-SHAPE-1 for an
    unusual curve shape, ERPREV-UNCLEAR-1 for a peak that is not clear; then ERPREV-REST-1 with
    the rows without a tick, ERPREV-RULE-1 last. Not confirmed: ERPREV-PEND-1 {n} with changes
    waiting, else ERPREV-PEND-0, then ERPREV-RULE-1. Without a norm: ERPREV-NONORM-1."""
    if no_norm(meas):
        return [say("ERPREV-NONORM-1", lang)]
    inputs = inputs or {}
    rows = review_rows(meas)
    if not inputs.get("confirmed"):
        n = len([k for k, v in (inputs.get("changes") or {}).items() if v])
        return [say("ERPREV-PEND-1", lang, n=n) if n else say("ERPREV-PEND-0", lang),
                say("ERPREV-RULE-1", lang)]
    fin = review_final(rows, inputs)
    P = CHOICE_PARTS[lang]
    out, rest = [], 0
    for r in rows:
        f = fin[r["id"]]
        slots = {"comp": r["component"], "site": r["site"], "trial": TRIAL[lang][r["trial"]]}
        for kind, zk in (("amp", "amplitude_z"), ("lat", "latency_z")):
            p_, f_ = r["proposed"][kind], f[kind]
            z = fmt_z(r[zk], lang) if r[zk] is not None else "-"
            if p_ and f_ == p_:
                out.append(say("ERPREV-SUG-1", lang, dev=P[f"rev.{kind}.{p_}"], z=z, **slots))
                continue
            if p_:
                out.append(say("ERPREV-RM-1", lang, dev=P[f"rev.{kind}.{p_}"], z=z, **slots))
            if f_:
                out.append(say("ERPREV-ADD-1", lang, dev=P[f"rev.{kind}.{f_}"], z=z, **slots))
        if f["shape"]:
            out.append(say("ERPREV-SHAPE-1", lang, **slots))
        if not r["clear"]:
            out.append(say("ERPREV-UNCLEAR-1", lang, z=fmt_z(r["amplitude_z"], lang), **slots))
        if not (f["amp"] or f["lat"] or f["shape"]):
            rest += 1
    out.append(say("ERPREV-REST-1", lang, n=rest, total=len(rows)))
    out.append(say("ERPREV-RULE-1", lang))
    return out


SAMPLE_ERP_REVIEW = {"confirmed": True, "changes": {}}


# Raw EEG excerpts the clinician added to the sample report from the recording viewer (review
# C12, M59): 8 s of each resting condition, from the start of the analysed segments in seconds.
SAMPLE_RAW_EXCERPTS = [{"cond": "EO", "start_s": 1.0, "seconds": 8},
                       {"cond": "EC", "start_s": 1.0, "seconds": 8}]


def sample_report_inputs(case):
    """The synthetic clinician entries of the sample report (report_inputs of the case, M59)
    with the parts the data do not carry yet filled in: the ERP peak review confirmed as proposed
    (round of 30 October; the retired checklist over channel ERPs is dropped) and the raw
    excerpts chosen in the viewer (review C12)."""
    ri = dict(case.get("report_inputs") or {})
    cur = current_measurement(case)
    ri.setdefault("measurement", cur["id"])
    ri.pop("erp_checklist", None)
    if not isinstance(ri.get("erp_review"), dict):
        ri["erp_review"] = {"confirmed": SAMPLE_ERP_REVIEW["confirmed"],
                            "changes": dict(SAMPLE_ERP_REVIEW["changes"])}
    ri.setdefault("raw_excerpts", [dict(x) for x in SAMPLE_RAW_EXCERPTS])
    return ri


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
    if parent in ("tbr", "faa", "ftpa", "alpha_reactivity") and key in ("value", "norm_mean"):
        return 2
    if parent == "alpha_peak" and key in ("hz", "norm_mean"):
        return 1
    # coherence per pair (both types), global coherence (four types)
    if parent in ("pairs", "global") + GLOBAL_TYPES and key == "value":
        return 2
    # a value per band: source power per brain region (log10) and the asymmetry index
    if parent in BAND["en"] and key == "value":
        return 2
    if key == "prominence_snr":
        return 1
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


def count(n, lang):
    """A whole number as printed in sentences: thousands separated, "2,242" in English, "2.242" in
    German, "2242" in Japanese (review C6: one style with the interface)."""
    if lang == "ja":
        return str(n)
    s_ = f"{n:,}"
    return s_.replace(",", ".") if lang == "de" else s_


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

def missing(meas, cond):
    """True when a condition has no results (analysed time below the minimum, M58)."""
    return cond in (meas.get("results_missing") or {})


def no_norm(meas):
    """True when no value of the measurement is compared with a norm (age outside the norms)."""
    return bool(meas.get("no_norm"))


def _res_min(cond, lang):
    return [say("RES-MIN-1", lang, cond=COND[lang][cond])]


def spectral_sentences(case, meas, cond, lang, relative=True):
    if missing(meas, cond):
        return _res_min(cond, lang)
    if no_norm(meas):
        apf = meas["spectra"]["conditions"][cond]["alpha_peak"]
        return [say("APF-VAL-1", lang, cond=COND[lang][cond], hz=num(apf["hz"], 1, lang))]
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
    """TBR-1, FAA-1 and FTPA-1 of one condition (the VAL variants without a norm); FTPA only
    when the data carry the ratio (round of 30 October, AD1)."""
    if missing(meas, cond):
        return _res_min(cond, lang)
    c = meas["spectra"]["conditions"][cond]
    cl = COND[lang][cond]
    ft = c.get("ftpa")
    if no_norm(meas) or c["tbr"].get("z") is None:
        out = [say("TBR-VAL-1", lang, cond=cl, v=num(c["tbr"]["value"], 2, lang)),
               say("FAA-VAL-1", lang, cond=cl, v=num(c["faa"]["value"], 2, lang))]
    else:
        out = [say("TBR-1", lang, cond=cl, v=num(c['tbr']['value'], 2, lang),
                   z=fmt_z(c["tbr"]["z"], lang)),
               say("FAA-1", lang, cond=cl, v=num(c['faa']['value'], 2, lang),
                   z=fmt_z(c["faa"]["z"], lang))]
    if ft and ft.get("value") is not None:
        if ft.get("z") is None:
            out.append(say("FTPA-VAL-1", lang, cond=cl, v=num(ft["value"], 2, lang)))
        else:
            out.append(say("FTPA-1", lang, cond=cl, v=num(ft["value"], 2, lang),
                           z=fmt_z(ft["z"], lang)))
    return out


def alpha_reactivity_sentences(meas, lang):
    """AR-1 (value and z), AR-VAL-1 (value only, no norm) or AR-MIN-1 (a resting condition has
    no results); [] while the data do not carry the value (round of 30 October, SA3)."""
    if missing(meas, "EO") or missing(meas, "EC"):
        return [say("AR-MIN-1", lang)]
    ar = meas.get("alpha_reactivity")
    if not ar or ar.get("value") is None:
        return []
    if ar.get("z") is None:
        return [say("AR-VAL-1", lang, v=num(ar["value"], 2, lang))]
    return [say("AR-1", lang, v=num(ar["value"], 2, lang), z=fmt_z(ar["z"], lang))]


def asym_side(row):
    """The electrode of a pair with more power, from the printed index (2 decimals): the right
    electrode of the pair for a positive index (right minus left), the left for a negative one,
    None when the printed index is 0.00."""
    v = half_up(row["value"], 2)
    left, right = row["pair"].split("-")
    return right if v > 0 else left if v < 0 else None


def asymmetry_sentences(meas, cond, lang):
    """One sentence per marked pair (review C15): the index value, the side with more power and
    the z against the age norm."""
    if missing(meas, cond):
        return _res_min(cond, lang)
    if no_norm(meas):
        return []
    out = []
    asym = meas["spectra"]["conditions"][cond]["asymmetry"]
    for b in BAND[lang]:
        for r in sorted([r for r in asym[b] if r["marked"]], key=lambda r: zkey(r["z"])):
            side = asym_side(r)
            out.append(say("ASY-1" if side else "ASY-2", lang, band=BAND[lang][b], pair=r["pair"],
                           cond=COND[lang][cond], v=num(r["value"], 2, lang), side=side or "",
                           dir=DIR[lang][sign(r["z"])], z=fmt_z(r["z"], lang)))
    return out


# Phrase a coherence sentence uses when it lists only some pairs; it points at the pair table of
# the coherence block (the report build fails when that table is absent).
TABLE_REF = {"en": "{n} more in the table", "de": "{n} weitere in der Tabelle",
             "ja": "ほか{n}組は表を参照"}


def coherence_pairs(meas, cond, band, kind="msc"):
    """The pair rows of one type: magnitude squared (coherence) or lagged (coherence_lagged);
    [] when the data do not carry that type."""
    src = meas.get("coherence" if kind == "msc" else "coherence_lagged") or {}
    return ((src.get(cond) or {}).get(band) or {}).get("pairs") or []


def global_values(meas, cond, band):
    """{type: {value, z, marked}} of global coherence: the four types of global4, or the
    magnitude squared global value alone while the data carry only that."""
    g = ((meas.get("coherence") or {}).get(cond) or {}).get(band) or {}
    if g.get("global4"):
        return {k: g["global4"][k] for k in GLOBAL_TYPES if g["global4"].get(k)}
    return {"msc": g["global"]} if g.get("global") else {}


def coherence_sentences(meas, cond, lang, max_listed=6, with_refs=False, kind="msc"):
    """COH-MSC-1 or COH-LAG-1 per band and direction for the marked pairs of the type, or
    COH-NONE-1 when none is marked. with_refs: attach to a sentence that points at the pair table
    which table and pairs it means ("refers"), for the report build check."""
    if missing(meas, cond):
        return _res_min(cond, lang)
    if no_norm(meas):
        return []
    if kind == "lagged" and not meas.get("coherence_lagged"):
        return []
    sid = "COH-MSC-1" if kind == "msc" else "COH-LAG-1"
    table = "coh_pairs" if kind == "msc" else "cohlag_pairs"
    out = []
    for b in BAND[lang]:
        for sg in ("+", "-"):
            hits = sorted([p for p in coherence_pairs(meas, cond, b, kind)
                           if p.get("marked") and sign(p["z"]) == sg],
                          key=lambda p: zkey(p["z"]))
            if not hits:
                continue
            shown = [f"{p['pair']} (z = {fmt_z(p['z'], lang)})" for p in hits[:max_listed]]
            if len(hits) > max_listed:
                shown.append(TABLE_REF[lang].format(n=len(hits) - max_listed))
            name = BAND[lang][b]
            out.append(say(sid, lang, Band=name[0].upper() + name[1:] if lang == "en" else name,
                           band=name, cond=COND[lang][cond], dir=DIR[lang][sg], n=len(hits),
                           npairs={"en": f"{len(hits)} electrode pair" + ("s" if len(hits) > 1 else ""),
                                   "de": f"{len(hits)} Elektrodenpaar" + ("e" if len(hits) > 1 else ""),
                                   "ja": ""}[lang],
                           pairs=list_join(shown, lang)))
            if with_refs and len(hits) > max_listed:
                out[-1]["refers"] = {"table": table, "cond": cond, "band": b,
                                     "pairs": [p["pair"] for p in hits]}
    if not out:
        out.append(say("COH-NONE-1", lang, type=COH_NAME[lang][kind], cond=COND[lang][cond]))
    return out


def global_coherence_sentences(meas, cond, lang):
    """COH-GLOB-1 for each marked global value (four types per band); [] when none is marked."""
    if missing(meas, cond) or no_norm(meas):
        return []
    out = []
    for b in BAND[lang]:
        for k, g in global_values(meas, cond, b).items():
            if g.get("marked") and g.get("z") is not None:
                out.append(say("COH-GLOB-1", lang, type=GLOBAL_NAME[lang][k], band=BAND[lang][b],
                               cond=COND[lang][cond], dir=DIR[lang][sign(g["z"])],
                               z=fmt_z(g["z"], lang)))
    return out


def source_regions(meas, cond):
    """The source power record of one condition ({unit, regions, values}) or None."""
    return (meas.get("source_regions") or {}).get(cond)


def source_sentences(meas, cond, lang):
    """SRC-1 per band and direction listing the marked regions with z, or SRC-NONE-1; RES-MIN-1
    for a condition without results; [] without a norm or while the data lack the values. The
    limits sentence SRC-LIM-1 is source_limits()."""
    if missing(meas, cond):
        return _res_min(cond, lang)
    sr = source_regions(meas, cond)
    if not sr or no_norm(meas):
        return []
    regions = sr.get("regions") or list(REGIONS)
    out = []
    for b in BAND[lang]:
        for sg in ("+", "-"):
            hits = sorted([(r, sr["values"][r][b]) for r in regions
                           if (sr["values"].get(r) or {}).get(b, {}).get("marked")
                           and sign(sr["values"][r][b]["z"]) == sg],
                          key=lambda x: zkey(x[1]["z"]))
            if hits:
                out.append(say("SRC-1", lang, band=BAND[lang][b], cond=COND[lang][cond],
                               dir=DIR[lang][sg],
                               regions=list_join([f"{REGION[lang][r]} (z = {fmt_z(v['z'], lang)})"
                                                  for r, v in hits], lang)))
    return out or [say("SRC-NONE-1", lang, cond=COND[lang][cond])]


def source_limits(lang):
    return [say("SRC-LIM-1", lang)]


def erp_sentences(meas, lang):
    if no_norm(meas):
        return []
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
    if no_norm(meas):
        return [say("BEH-VAL-1", lang, measure=VCPT_MEASURE[lang][k], v=f"{v[k]['value']}{UNIT[k]}")
                for k in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms")]
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


# Analysis families the summary ranks (SUM-RULE-3), with their labels for SUM-COUNT-1; "coh" is
# the coherence per electrode pair of the type the report shows (magnitude squared by default).
FAMILY = {
    "band": {"en": "band power", "de": "Bandleistung", "ja": "帯域パワー"},
    "maps1hz": {"en": "maps per 1 Hz band", "de": "Karten je 1-Hz-Band", "ja": "1 Hz帯域マップ"},
    "indices": {"en": "alpha peak and ratios", "de": "Alpha-Peak und Quotienten",
                "ja": "アルファピークと比・指数"},
    "asym": {"en": "asymmetry map", "de": "Asymmetriekarte", "ja": "非対称マップ"},
    "coh": {"en": "magnitude squared coherence", "de": "Kohärenz (Betragsquadrat)",
            "ja": "二乗コヒーレンス"},
    "cohlag": {"en": "lagged coherence", "de": "verzögerte Kohärenz", "ja": "ラグ付きコヒーレンス"},
    "erp": {"en": "ERP peaks", "de": "ERP-Peaks", "ja": "ERPピーク"},
    "vcpt": {"en": "VCPT task", "de": "VCPT-Aufgabe", "ja": "VCPT課題"},
}
# Families that are counted in SUM-COUNT-1 but not ranked (SUM-RULE-3; review C18): the spectrum
# per 0.5 Hz bin, global coherence in its four types and the coherence type per electrode pair
# the report does not show ("cohother": lagged, or magnitude squared when the report shows
# lagged). Source power per brain region is neither ranked nor counted (mockup assumption).
COUNT_ONLY = {
    "spectrum": {"en": "spectrum per 0.5 Hz bin", "de": "Spektrum je 0,5-Hz-Schritt",
                 "ja": "0.5 Hzごとのスペクトル"},
    "cohglobal": {"en": "global coherence", "de": "globale Kohärenz", "ja": "グローバルコヒーレンス"},
    "cohother": {"en": "{type} per electrode pair", "de": "{type} je Elektrodenpaar",
                 "ja": "電極ペアごとの{type}"},
}


def other_kind(coh):
    return "lagged" if coh == "msc" else "msc"


def count_only(meas, coh="msc"):
    """{family: (marked, n)} of the families counted but not ranked; "cohother" only when the
    data carry that coherence type."""
    out = {"spectrum": [0, 0], "cohglobal": [0, 0], "cohother": [0, 0]}
    other = other_kind(coh)
    for cond in ("EO", "EC"):
        if missing(meas, cond):
            continue
        for row in meas["spectra"]["conditions"][cond]["z_marked"]:
            out["spectrum"][0] += sum(1 for x in row if x)
            out["spectrum"][1] += len(row)
        for b in BAND["en"]:
            for g in global_values(meas, cond, b).values():
                out["cohglobal"][0] += 1 if g.get("marked") else 0
                out["cohglobal"][1] += 1
            for r in coherence_pairs(meas, cond, b, other):
                out["cohother"][0] += 1 if r.get("marked") else 0
                out["cohother"][1] += 1
    if not out["cohother"][1]:
        del out["cohother"]
    return {k: tuple(v) for k, v in out.items()}


def all_deviations(case, meas, lang, coh="msc"):
    """Every value the summary ranks, as (abs z, z, label, marked, family, stem, where), largest
    first; label = stem plus where (site or pair), used to group the summary. coh: the coherence
    type per electrode pair that is ranked (the type the report shows; family "coh" for
    magnitude squared, "cohlag" for lagged)."""
    items = []
    ch = case["channels"]
    for cond in ("EO", "EC"):
        if missing(meas, cond):
            continue
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
        ft = c.get("ftpa")
        if ft and ft.get("z") is not None:
            label = {"en": f"frontal theta / parietal alpha ratio, {cl}",
                     "de": f"Verhältnis frontales Theta / parietales Alpha, {cl}",
                     "ja": f"{cl}の前頭部シータ/頭頂部アルファ比"}[lang]
            items.append((abs(ft["z"]), ft["z"], label, bool(ft.get("marked")), "indices",
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
            if coh == "lagged":
                stem = {"en": f"lagged {bn} coherence, {cl}", "de": f"verzögerte {bn}-Kohärenz, {cl}",
                        "ja": f"{cl}の{bn}ラグ付きコヒーレンス"}[lang]
                fam = "cohlag"
            else:
                stem = {"en": f"{bn} coherence, {cl}", "de": f"{bn}-Kohärenz, {cl}",
                        "ja": f"{cl}の{bn}コヒーレンス"}[lang]
                fam = "coh"
            for r in coherence_pairs(meas, cond, b, coh):
                where = f"{stem.rsplit(', ', 1)[0]} {r['pair']}, {cl}" if lang != "ja" else \
                    f"{cl}の{r['pair']}における{bn}" + ("ラグ付き" if coh == "lagged" else "") + "コヒーレンス"
                items.append((abs(r["z"]), r["z"], where, r["marked"], fam, stem, r["pair"]))
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
    ar = meas.get("alpha_reactivity")
    if ar and ar.get("z") is not None and not (missing(meas, "EO") or missing(meas, "EC")):
        label = {"en": "alpha reactivity, eyes closed over eyes open",
                 "de": "Alpha-Reaktivität, Augen geschlossen geteilt durch Augen offen",
                 "ja": "アルファ反応性（閉眼時／開眼時）"}[lang]
        items.append((abs(ar["z"]), ar["z"], label, bool(ar.get("marked")), "indices", label, None))
    for key in ("omissions", "commissions", "rt_mean_ms", "rt_sd_ms"):
        m = meas["vcpt"][key]
        items.append((abs(m["z"]), m["z"], VCPT_MEASURE[lang][key], m["marked"], "vcpt",
                      VCPT_MEASURE[lang][key], None))
    return sorted(items, key=lambda x: zkey(x[1]))


def summary_groups(case, meas, lang, coh="msc"):
    """The entries of SUM-2 (one per analysis and condition, in the order of its largest value,
    listing its sites), as [(stem, family, [(where, z)])]; also the rows of the summary table of
    the PDF (review C3). [] when nothing is marked."""
    items = [x for x in all_deviations(case, meas, lang, coh) if x[3]]
    chosen = [x for i, x in enumerate(items) if i < SUMMARY_TOP or over(x[1], SUMMARY_ALWAYS)]
    groups = {}
    for _, z, _, _, fam, stem, where in chosen:
        groups.setdefault(stem, (fam, []))[1].append((where, z))
    return [(stem, fam, vals) for stem, (fam, vals) in groups.items()]


def summary_sentences(case, meas, lang, coh="msc"):
    if no_norm(meas):
        nn = meas["no_norm"]
        lo, hi = nn["norm_age_range_years"]
        return [say("NORM-AGE-1", lang, age=int(nn["age_years"]), lo=lo, hi=hi)]
    left_out = [say("SUM-MIN-1", lang, cond=COND[lang][c]) for c in ("EO", "EC")
                if missing(meas, c)]
    every = all_deviations(case, meas, lang, coh)
    items = [x for x in every if x[3]]
    if not items:
        return [say("SUM-NONE-2", lang)] + left_out
    text_items = []
    for stem, _, vals in summary_groups(case, meas, lang, coh):
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
        if fam == ("coh" if coh == "lagged" else "cohlag"):
            continue
        n = sum(1 for x in every if x[4] == fam)
        k = sum(1 for x in items if x[4] == fam)
        counts.append(f"{names[lang]} {of.format(k=count(k, lang), n=count(n, lang))}")
    for fam, (k, n) in count_only(meas, coh).items():
        lab = COUNT_ONLY[fam][lang].format(type=COH_NAME[lang][other_kind(coh)])
        counts.append(f"{lab} {of.format(k=count(k, lang), n=count(n, lang))}")
    return [say("SUM-2", lang, items=joiner.join(text_items)),
            say("SUM-RULE-3", lang, top=SUMMARY_TOP, always=f"{SUMMARY_ALWAYS:.0f}",
                coh=COH_NAME[lang][coh], other=COH_NAME[lang][other_kind(coh)]),
            say("SUM-COUNT-1", lang, items=list_join(counts, lang))] + left_out


def quality_sentences(meas, lang):
    q = meas["quality"]
    out = []
    for cond, r in q["recordings"].items():
        if missing(meas, cond):
            out.append(say("Q-MIN-1", lang, cond=COND[lang][cond], a=r["analysed_s"],
                           r=r["recorded_s"], min=meas["results_missing"][cond]["minimum_s"]))
            continue
        out.append(say("Q-DUR-1", lang, cond=COND[lang][cond], a=r["analysed_s"],
                       r=r["recorded_s"]))
    out.append(say("Q-TRIALS-1", lang, **q["accepted_trials"]))
    for t, n in q["accepted_trials"].items():
        if n < TRIALS_WARN:
            out.append(say("Q-TRIALS-LOW-1", lang, warn=TRIALS_WARN, trial=TRIAL[lang][t], n=n))
    out.append(ica_sentence(q["ica"], lang))
    return out


def ica_changes(ica):
    """The clinician's changes to the cleaning proposal as [{ic, removed, ref_map}]: from the
    list "clinician_changes" or the single "clinician_change" of the data (kept: removed False)."""
    if ica.get("clinician_changes") is not None:
        raw = ica["clinician_changes"]
    else:
        raw = [ica["clinician_change"]] if ica.get("clinician_change") else []
    prop = {x["ic"]: x for x in ica["proposed_removed"]}
    out = []
    for c in raw:
        removed = c.get("removed", c.get("action") == "removed")
        ref = c.get("ref_map") or (prop[c["ic"]]["ref_map"] if c["ic"] in prop else "none")
        out.append({"ic": c["ic"], "removed": removed, "ref_map": ref})
    return out


def ica_sentence(ica, lang, changes=None):
    """The cleaning sentence (review A5): Q-ICA-AUTO-1 when the proposal was accepted unchanged,
    Q-ICA-MAN-1 (one component kept against the proposal), Q-ICA-MAN-2 (one removed against it)
    or Q-ICA-MAN-3 (two or more changes, listed); {kind} names the reference map the component
    matches (parts "ica.kind.<ref_map>")."""
    P = CHOICE_PARTS[lang]
    changes = ica_changes(ica) if changes is None else changes
    n = ica["n_components"]
    k = len(ica["proposed_removed"]) - sum(1 for c in changes if not c["removed"]) \
        + sum(1 for c in changes if c["removed"])
    if not changes:
        return say("Q-ICA-AUTO-1", lang, k=k, n=n)

    def kind(c):
        return P.get("ica.kind." + c["ref_map"], P["ica.kind.none"])
    if len(changes) == 1:
        c = changes[0]
        return say("Q-ICA-MAN-2" if c["removed"] else "Q-ICA-MAN-1", lang, ic=c["ic"],
                   kind=kind(c), k=k, n=n)
    items = [P["ica.removed" if c["removed"] else "ica.kept"].format(ic=c["ic"], kind=kind(c))
             for c in sorted(changes, key=lambda c: c["ic"])]
    return say("Q-ICA-MAN-3", lang, list=P["ica_sep"].join(items), k=k, n=n)


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


# ---------------------------------------------------------------------------------------------
# Measurements of a case and their result sets (review B7, lead decision 5). One helper for the
# PDF (render.py), the prototype data (build_data.py) and the checks: the current measurement is
# named by the case (current_id, else current_index), else it is the latest by date; the earlier
# ones are the measurements recorded before it, oldest first. Never by list position alone.
# ---------------------------------------------------------------------------------------------

def current_measurement(case):
    ms = case["measurements"]
    if case.get("current_id"):
        return next(m for m in ms if m["id"] == case["current_id"])
    if case.get("current_index") is not None:
        return ms[case["current_index"]]
    return max(ms, key=lambda m: m["date"])


def earlier_measurements(case, current=None):
    cur = current or current_measurement(case)
    return sorted([m for m in case["measurements"] if m["date"] < cur["date"]],
                  key=lambda m: m["date"])


def measurements_by_date(case):
    return sorted(case["measurements"], key=lambda m: m["date"])


# Result sets (3.8: issued reports and stored results never change; lead decision 5, mockup
# assumption): a measurement processed again keeps its first result set, frozen with the report
# issued from it, and gets a second one from the current software and norms, used by the
# comparison. The values of both are identical in the mockup, because the pipeline change from
# EARLIER_PIPELINE did not touch them; an earlier recording uploaded later has one result set.
EARLIER_PIPELINE = "mockup pipeline 0.0.9"


def result_set_id(case_code, date_iso, n):
    """"RS-" + case code + "-" + measurement date as MMDD + "-" + number: "RS-MOCK-042-0312-2"."""
    return f"RS-{case_code}-{date_iso[5:7]}{date_iso[8:10]}-{n}"


def result_sets(case, meas):
    """[{id, n, software, pipeline, norms, created_at, frozen, used_by}] of a measurement, oldest
    first; the data's own "result_sets" when present. used_by: report ids ("R-... v1" when
    issued, "R-..." for the draft) or "comparison"."""
    if meas.get("result_sets"):
        return meas["result_sets"]
    pw, code = meas["processed_with"], case["case_code"]
    rid = report_id(code, meas["date"])
    cur = current_measurement(case)
    base = {"software": pw["software"], "pipeline": pw.get("pipeline"), "norms": pw["norms"]}
    if pw.get("reprocessed") and not meas.get("uploaded_later"):
        first = {**base, "id": result_set_id(code, meas["date"], 1), "n": 1,
                 "pipeline": EARLIER_PIPELINE,
                 "created_at": meas["date"] + (pw.get("processed_at") or "T12:00:00")[10:],
                 "frozen": True, "used_by": [report_id(code, meas["date"], 1)]}
        second = {**base, "id": result_set_id(code, meas["date"], 2), "n": 2,
                  "created_at": pw.get("processed_at"), "frozen": False,
                  "used_by": ["comparison"]}
        return [first, second]
    used = [rid] if meas is cur or meas["id"] == cur["id"] else ["comparison"]
    return [{**base, "id": result_set_id(code, meas["date"], 1), "n": 1,
             "created_at": pw.get("processed_at"), "frozen": False, "used_by": used}]


def current_result_set(case, meas):
    """The result set the current software uses: the latest one."""
    return result_sets(case, meas)[-1]


def reproc_sentence(case, m, lang):
    """L-REPROC-1 (processed again: both result sets named) or L-REPROC-2 (uploaded later, one
    result set) for an earlier measurement, or None when it was not processed again."""
    pw = m["processed_with"]
    if not pw.get("reprocessed"):
        return None
    sets = result_sets(case, m)
    sw = ", ".join(x for x in (pw["software"], pw.get("pipeline")) if x)
    norms = product(pw["norms"], lang)
    if len(sets) >= 2:
        return say("L-REPROC-1", lang, date=fmt_date(m["date"], lang), sw=sw, norms=norms,
                   rs2=sets[-1]["id"], rs1=sets[0]["id"], report=sets[0]["used_by"][0])
    return say("L-REPROC-2", lang, date=fmt_date(m["date"], lang), sw=sw, norms=norms,
               rs=sets[-1]["id"])


def limits_sentences(lang, earlier=None, meas=None, case=None):
    if meas is not None and no_norm(meas):
        return [say("L-AID-1", lang), say("L-NONORM-1", lang)]
    out = [say("L-AID-1", lang), say("L-Z-1", lang), say("L-MC-1", lang)]
    if earlier:
        rp = reproc_sentence(case, earlier, lang) if case else None
        if rp:
            out.append(rp)
        out.append(say("L-SIDE-1", lang))
    return out


# The comparison rule (review C2): the CMP_TOP largest values marked in at least one measurement,
# ranked by |z|, plus every value marked at SUMMARY_ALWAYS z or more in any of them; CMP-RULE-1
# states the count, so no marked value is left out silently.
CMP_TOP = 6


def _cmp_select(tabs):
    """(chosen keys, number of candidates) over tables {label: (z, marked)}, oldest first."""
    keys = [k for k in tabs[-1] if all(k in t for t in tabs) and any(t[k][1] for t in tabs)]
    keys = sorted(keys, key=lambda k: min(zkey(t[k][0]) for t in tabs))
    chosen = [k for i, k in enumerate(keys)
              if i < CMP_TOP or any(t[k][1] and over(t[k][0], SUMMARY_ALWAYS) for t in tabs)]
    return chosen, len(keys)


def _cmp_rule(k, n, lang):
    return say("CMP-RULE-1", lang, k=count(k, lang), n=count(n, lang), top=CMP_TOP,
               always=f"{SUMMARY_ALWAYS:.0f}")


def _cmp_tabs(case, measurements, lang):
    return [{x[2]: (x[1], x[3], x[4], x[5], x[6]) for x in all_deviations(case, m, lang)}
            for m in measurements]


def comparison_items(case, measurements, lang):
    """[(label, family, [(z, marked)] oldest first)] the comparison names, in its order."""
    tabs = _cmp_tabs(case, measurements, lang)
    chosen, _ = _cmp_select(tabs)
    return [(k, tabs[-1][k][2], [(t[k][0], t[k][1]) for t in tabs]) for k in chosen]


def comparison_sentences(case, current, earlier, lang, top=None):
    """Two measurements side by side (CMP-G-1, kind (a)) for the values chosen by the comparison
    rule, then CMP-RULE-1."""
    return comparison_n_sentences(case, [earlier, current], lang)


# ---------------------------------------------------------------------------------------------
# Night round: method and norms, frequency markers, checklist over channel ERPs, any number of
# measurements side by side
# ---------------------------------------------------------------------------------------------

def system_label(label, lang):
    """Recording system label from the case data, shown as a mockup label in the language; the
    data stay unchanged."""
    base = re.sub(r"\s*\(mockup label\)\s*$", "", label or "").strip()
    if not base:
        return ""
    if lang == "de":
        base = re.sub(r"(\S+) amplifier", r"\1-Verstärker", base)
        base = re.sub(r"(\S+) file", r"\1-Datei", base)
    elif lang == "ja":
        base = re.sub(r"(\S+) amplifier", r"\1アンプ", base)
        base = re.sub(r"(\S+) file", r"\1ファイル", base)
        base = base.replace(", ", "、")
    mk = {"en": "mockup label", "de": "Mockup-Bezeichnung", "ja": "モックアップ用の表記"}[lang]
    return f"{base}（{mk}）" if lang == "ja" else f"{base} ({mk})"


RANGE = {"en": "{a} to {b}", "de": "{a} bis {b}", "ja": "{a}～{b}"}


def _hz(x, lang):
    """A band limit as printed: 1.5 or 4 (German decimal comma)."""
    s_ = f"{x:g}"
    return s_.replace(".", ",") if lang == "de" else s_


# Method facts the data may not carry yet (review B10, mockup assumption): filters, the spectral
# windows, the denominator of relative power, ERP averages of correct trials only (the legacy
# rule, audit 14b B.2), the peak windows and the CNV window. The data's own method record wins.
METHOD_DEFAULTS = {"band_pass_hz": [0.5, 45], "window_s": 2, "overlap_pct": 50,
                   "relative_denominator_hz": [1.5, 30], "erp_trials": "correct",
                   "cnv_window_ms": [-200, 0]}


def method_facts(meas):
    """The method record of the measurement with the defaults filled in."""
    mt = meas["method"]
    pr = {**METHOD_DEFAULTS, **{k: v for k, v in mt["processing"].items() if v is not None}}
    return mt, pr


def peak_window_text(lang):
    """"P1 70 to 170 ms, N1 140 to 250 ms, ..." of the scored peaks (no CNV), one per component
    and trial type, P3 by trial type when the windows differ."""
    seen, parts = set(), []
    windows = {}
    for (c, t, _), w in PEAK_WINDOWS.items():
        if c != "CNV":
            windows.setdefault(c, {}).setdefault(tuple(w), []).append(t)
    for c, ws in windows.items():
        for w, trials in ws.items():
            if (c, w) in seen:
                continue
            seen.add((c, w))
            name = c if len(ws) == 1 else f"{c} ({list_join([TRIAL[lang][x] for x in dict.fromkeys(trials)], lang)})"
            parts.append(f"{name} {RANGE[lang].format(a=w[0], b=w[1])} ms")
    sep = "、" if lang == "ja" else ", "
    return sep.join(parts)


def method_sentences(meas, lang):
    """The "Method and norms" device block (TG10, review B10): fixed sentences over the method
    facts of the measurement (synth.method, with METHOD_DEFAULTS)."""
    mt, pr = method_facts(meas)
    rec, nm = mt["recording"], mt["norms"]
    conds = list_join([COND[lang][c] for c in rec["conditions"]], lang)
    bands = list_join([f"{BAND[lang][b['name']]} {RANGE[lang].format(a=_hz(b['lo'], lang), b=_hz(b['hi'], lang))} Hz"
                       for b in mt["bands"]], lang)
    lo, hi = nm["age_range_years"]
    age = int(meas["age_years"])
    norm = (say("MET-NORM-1", lang, name=nm["name"], version=nm["version"], lo=lo, hi=hi, age=age,
                n=count(nm.get("sample_n", 0), lang))
            if nm["applied"] else
            say("MET-NORM-NONE-1", lang, name=nm["name"], version=nm["version"], lo=lo, hi=hi,
                age=age))
    erp = mt["erp"]
    cnv = erp.get("cnv_window_ms") or pr["cnv_window_ms"]
    out = [say("MET-REC-1", lang, system=system_label(rec["system"], lang), n=rec["electrodes"],
               conds=conds),
           say("MET-PROC-1", lang, n=rec["electrodes"], hp=_hz(pr["band_pass_hz"][0], lang),
               lp=_hz(pr["band_pass_hz"][1], lang), notch=pr["mains_notch_hz"],
               fs=pr["analysis_rate_hz"]),
           say("MET-SPEC-1", lang, lo=_hz(pr["spectral_range_hz"][0], lang),
               hi=_hz(pr["spectral_range_hz"][1], lang), step=_hz(pr["spectral_step_hz"], lang),
               win=_hz(pr["window_s"], lang), ov=pr["overlap_pct"],
               rlo=_hz(pr["relative_denominator_hz"][0], lang),
               rhi=_hz(pr["relative_denominator_hz"][1], lang),
               bands=bands, t_lo=mt["tbr"]["theta"][0], t_hi=mt["tbr"]["theta"][1],
               b_lo=mt["tbr"]["beta"][0], b_hi=mt["tbr"]["beta"][1]),
           say("MET-ERP-1", lang, n=erp["trials_per_type"], a=erp["window_ms"][0],
               b=erp["window_ms"][1], windows=peak_window_text(lang), c_lo=cnv[0], c_hi=cnv[1]),
           norm]
    if nm["applied"]:
        out.append(say("MET-MC-1", lang, q=num(mt["marking"]["q"], 2, lang)))
    return out


def freq_marker_rows(meas, inputs=None):
    """Markers as the report prints them, per condition: the suggestions with the clinician's
    confirmed choices applied (inputs: report_inputs.freq_markers; moves, removals and additions
    as documented in CONTRACT.md). Each row: {k, cond, site, hz, z, marked, question, answer,
    source: suggested|moved|added, from_site, from_hz}."""
    inputs = inputs or {}
    fm = meas.get("freq_markers") or {}
    rows = {}
    for cond in ("EO", "EC"):
        sugg = (fm.get("suggested") or {}).get(cond)
        if sugg is None:
            continue
        removed = {(r["cond"], r["n"]) for r in inputs.get("removed", [])}
        moves = {(r["cond"], r["n"]): r for r in inputs.get("moves", [])}
        out = []
        for mk in sugg:
            if (cond, mk["n"]) in removed:
                continue
            mv = moves.get((cond, mk["n"]))
            row = {"cond": cond, "site": mk["site"], "hz": mk["hz"], "z": mk["z"],
                   "marked": mk["marked"], "question": mk["question"], "source": "suggested"}
            if mv:
                row.update({"from_site": mk["site"], "from_hz": mk["hz"], "site": mv["site"],
                            "hz": mv["hz"], "source": "moved"})
                row.update(_bin_value(meas, cond, mv["site"], mv["hz"]))
            out.append(row)
        for ad in inputs.get("added", []):
            if ad["cond"] == cond:
                out.append({"cond": cond, "site": ad["site"], "hz": ad["hz"], "source": "added",
                            **_bin_value(meas, cond, ad["site"], ad["hz"])})
        answers = inputs.get("answers", {})
        for k, row in enumerate(out, 1):
            row["k"] = k
            row["question"] = _question(fm, row["site"], row["hz"])
            row["answer"] = answers.get(f"{cond}|{row['site']}|{row['hz']:g}")
        rows[cond] = out
    return rows


# the fixed channel order of the case data (synth.CHANNELS)
CHANNELS = ("Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", "T3", "C3", "Cz", "C4", "T4", "T5", "P3",
            "Pz", "P4", "T6", "O1", "O2")


def _bin_value(meas, cond, site, hz):
    """z and marked state of the 0.5 Hz bin at site and hz (a moved or added marker)."""
    c = meas["spectra"]["conditions"][cond]
    i = CHANNELS.index(site)
    k = int(round((hz - meas["spectra"]["freqs"][0]) / 0.5))
    return {"z": c["z"][i][k], "marked": c["z_marked"][i][k]}


def _question(fm, site, hz):
    for q, d in (fm.get("questions") or {}).items():
        if site in d["sites"] and d["lo"] <= hz < d["hi"]:
            return q
    return None


def freq_marker_sentences(meas, inputs, lang, conds=("EO", "EC")):
    """Frequency marker sentences of the report (the PDF prints the confirmed state, M42 and
    M59): per condition FM-AUTO-1 (or FM-NONE-1), FM-MOVED-1, FM-ADDED-1, FM-REMOVED-1, then
    FM-Q-1 for each answered question, and FM-RULE-1."""
    inputs = inputs or {}
    rows = freq_marker_rows(meas, inputs)
    out = []
    P = CHOICE_PARTS[lang]
    for cond, rs in rows.items():
        if cond not in conds:
            continue
        cl = COND[lang][cond]
        changed = [r for r in rs if r["source"] != "suggested"]
        removed = [r for r in inputs.get("removed", []) if r["cond"] == cond]
        if not rs and not removed:
            out.append(say("FM-NONE-1", lang, cond=cl))
            continue
        if not changed and not removed:
            out.append(say("FM-AUTO-1", lang, cond=cl, n=len(rs)))
        for r in changed:
            st = z_state(lang, r["z"], r["marked"])
            if r["source"] == "moved":
                out.append(say("FM-MOVED-1", lang, k=r["k"], cond=cl, from_site=r["from_site"],
                               from_hz=num(r["from_hz"], 1, lang), site=r["site"],
                               hz=num(r["hz"], 1, lang), state=st))
            else:
                out.append(say("FM-ADDED-1", lang, k=r["k"], cond=cl, site=r["site"],
                               hz=num(r["hz"], 1, lang), state=st))
        sugg = {m["n"]: m for m in meas["freq_markers"]["suggested"][cond]}
        for r in removed:
            m = sugg[r["n"]]
            out.append(say("FM-REMOVED-1", lang, site=m["site"], hz=num(m["hz"], 1, lang), cond=cl))
        for r in rs:
            if r["question"] and r["answer"] in ("yes", "no"):
                out.append(say("FM-Q-1", lang, k=r["k"], cond=cl, site=r["site"],
                               hz=num(r["hz"], 1, lang), question=P["q." + r["question"]],
                               answer=P["answer." + r["answer"]]))
    out.append(say("FM-RULE-1", lang))
    return out


def issue_sentences(meas, lang):
    """The fixed reason why no report can be issued (lead decision 2): ISSUE-NONORM-1 for an age
    outside the norms; [] otherwise."""
    if not no_norm(meas):
        return []
    nn = meas["no_norm"]
    lo, hi = nn["norm_age_range_years"]
    return [say("ISSUE-NONORM-1", lang, age=int(nn["age_years"]), lo=lo, hi=hi)]


def errors_by_block(meas):
    """(omissions per block, commissions per block) of the VCPT (review C8): the data's own
    series when present, else the stored errors per block split into the two kinds in proportion
    to the totals (largest remainder, so each series sums to its total; mockup stand-in until the
    synthetic data store both series)."""
    v = meas["vcpt"]
    if v.get("omissions_per_block") is not None and v.get("commissions_per_block") is not None:
        return list(v["omissions_per_block"]), list(v["commissions_per_block"])
    tot = list(v["errors_per_block"])
    om_total = int(v["omissions"]["value"])
    n = sum(tot)
    if not n:
        return [0] * len(tot), [0] * len(tot)
    om_total = min(om_total, n)
    raw = [t * om_total / n for t in tot]
    om = [int(x) for x in raw]
    rest = om_total - sum(om)
    order = sorted(range(len(tot)), key=lambda i: (-(raw[i] - om[i]), i))
    for i in order[:rest]:
        om[i] += 1
    return om, [t - o for t, o in zip(tot, om)]


def comparison_n_sentences(case, measurements, lang, top=None):
    """Any number of measurements side by side (oldest first) for the values chosen by the
    comparison rule: one CMP-G-1 per analysis and condition, in the order of its largest value,
    listing its electrodes or pairs with their z values; then CMP-RULE-1 with the count."""
    tabs = _cmp_tabs(case, measurements, lang)
    keys, n = _cmp_select(tabs)
    if not n:
        return []
    groups = {}
    for k in keys:
        stem, where = tabs[-1][k][3], tabs[-1][k][4]
        groups.setdefault(stem, []).append((where, [t[k][0] for t in tabs]))
    dates = list_join([fmt_date(m["date"], lang) for m in measurements], lang)
    sep = {"en": "; ", "de": "; ", "ja": "／"}[lang]
    out = []
    for stem, vals in groups.items():
        items = []
        for where, zs in vals:
            # German z values carry a decimal comma, so they are joined with " / "
            zt = [fmt_z(z, lang) for z in zs]
            series = " / ".join(zt) if lang == "de" else list_join(zt, lang)
            items.append(series if where is None else f"{where} {series}")
        out.append(say("CMP-G-1", lang, measure=stem, dates=dates, items=sep.join(items)))
    return out + [_cmp_rule(len(keys), n, lang)]


# ---------------------------------------------------------------------------------------------
# Relative spectra and relative maps per 1 Hz band (review B1; table 3.3 "Absolute and relative
# spectra against norms", "Maps per 1 Hz band against norms"). The data's own fields win:
# rel_log_power, norm_rel_log_mean, norm_rel_log_sd, rel_z (19 x 59) and maps_1hz_rel_z,
# maps_1hz_rel_marked (29 x 19). Until the synthetic data carry them, they are derived here from
# the absolute spectra (mockup stand-in, "derived": True): the patient's relative power per
# 0.5 Hz bin is exact (power of the bin over the total power from 1.5 to 30 Hz); the norm mean is
# the relative spectrum of the norm mean, and the norm SD is that of the absolute spectrum, so the
# relative z of the stand-in is slightly smaller than a z from a relative norm sample would be.
# Marks on the relative 1 Hz maps follow the stand-in correction of M33 within the block.
# ---------------------------------------------------------------------------------------------

REL_DENOMINATOR_HZ = (1.5, 30.0)


def _log10(x):
    import math
    return math.log10(x)


def _rel_rows(lp, freqs):
    """log10 of the share of total power (1.5 to 30 Hz) in each 0.5 Hz bin, per channel."""
    lo, hi = REL_DENOMINATOR_HZ
    out = []
    for row in lp:
        total = sum(10 ** v * 0.5 for f, v in zip(freqs, row) if lo <= f < hi)
        out.append([v + _log10(0.5) - _log10(total) for v in row])
    return out


def bh_marked(zs, q=0.05):
    """Benjamini-Hochberg step-up on two-sided p values within one block (the stand-in of M33,
    as synth.bh_marks); one boolean per value."""
    import math
    p = [math.erfc(abs(z) / math.sqrt(2)) for z in zs]
    order = sorted(range(len(p)), key=lambda i: p[i])
    k = 0
    for rank, i in enumerate(order, 1):
        if p[i] <= q * rank / len(p):
            k = rank
    marked = [False] * len(p)
    for i in order[:k]:
        marked[i] = True
    return marked


def relative_spectrum(meas, cond):
    """{rel_log_power, norm_rel_log_mean, norm_rel_log_sd, rel_z, derived} of one condition, or
    None when the condition has no results; the norm fields and rel_z are None without a norm."""
    c = (meas["spectra"]["conditions"] or {}).get(cond)
    if not c:
        return None
    if c.get("rel_log_power") is not None:
        return {k: c.get(k) for k in ("rel_log_power", "norm_rel_log_mean", "norm_rel_log_sd",
                                      "rel_z")} | {"derived": False}
    freqs = meas["spectra"]["freqs"]
    rel = _rel_rows(c["log_power"], freqs)
    if c.get("norm_log_mean") is None:
        return {"rel_log_power": rel, "norm_rel_log_mean": None, "norm_rel_log_sd": None,
                "rel_z": None, "derived": True}
    mu = _rel_rows(c["norm_log_mean"], freqs)
    sd = c["norm_log_sd"]
    z = [[(x - m) / s_ for x, m, s_ in zip(rx, rm, rs)] for rx, rm, rs in zip(rel, mu, sd)]
    return {"rel_log_power": rel, "norm_rel_log_mean": mu, "norm_rel_log_sd": sd, "rel_z": z,
            "derived": True}


def relative_maps_1hz(meas, cond, q=0.05):
    """(z, marked), each 29 x 19 (1-2 Hz first), of relative power per 1 Hz band, or None
    without results or without a norm; derived from the relative spectrum when the data lack it
    (the two 0.5 Hz bins of the band summed; the norm SD the mean of the two bins' SD)."""
    c = (meas["spectra"]["conditions"] or {}).get(cond)
    if not c:
        return None
    if c.get("maps_1hz_rel_z") is not None:
        return c["maps_1hz_rel_z"], c.get("maps_1hz_rel_marked")
    rs = relative_spectrum(meas, cond)
    if rs["rel_z"] is None:
        return None
    freqs = meas["spectra"]["freqs"]
    zs = []
    for lo in range(1, 30):
        ks = [i for i, f in enumerate(freqs) if lo <= f < lo + 1]
        row = []
        for ch in range(len(rs["rel_log_power"])):
            x = _log10(sum(10 ** rs["rel_log_power"][ch][k] for k in ks))
            m = _log10(sum(10 ** rs["norm_rel_log_mean"][ch][k] for k in ks))
            sd = sum(rs["norm_rel_log_sd"][ch][k] for k in ks) / len(ks)
            row.append(round((x - m) / sd, 2))
        zs.append(row)
    flat = bh_marked([z for row in zs for z in row], q)
    n = len(zs[0])
    marked = [flat[i * n:(i + 1) * n] for i in range(len(zs))]
    return zs, marked


def import_sentences(measurements, lang):
    """L-IMPORT-1 when a measurement shown was uploaded later."""
    return [say("L-IMPORT-1", lang)] if any(m.get("uploaded_later") for m in measurements) else []


if __name__ == "__main__":
    probs = check_library()
    print("forbidden-word check:", "clean" if not probs else probs)
