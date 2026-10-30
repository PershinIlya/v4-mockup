"""Forbidden terms: the one shared list for every text check of the mockup.

Used by:
- `mockup/checks/text_check.py`: every visible text of the prototype (review C2);
- `mockup/textlib.py`: the fixed sentence library and the report labels (`check_library`), and
  through it every system sentence the PDF prints (`render.check_rendered`);
- `mockup/render.py`: the claim-word check over clinic texts of a template (warning, M29, M32).

The list follows the intended use of the V4 core, section 4 "What the core does not do and does
not claim" (`PershinIlya/v4`, `docs/20-requirements/intended-use.md`): no diagnosis or condition
names, no interpretation or construct names, no "normal" or "abnormal", no treatment or test
advice, no prediction or screening, and no regulatory claims. English and German words match at
the start of a word, case-insensitively; Japanese terms match anywhere (no word boundaries).

SENTENCE_EXTRA adds wording that only the fixed system sentences must avoid (comparatives and
advice such as "better" or "should"); interface texts and clinic texts may use those words.
"""

import re

W = r"(?<![A-Za-zÄÖÜäöüß0-9_])"  # start of a word
# (category, pattern). Case-insensitive unless the pattern starts with (?-i).
FORBIDDEN = [
    # 4.1 diagnosis, differential diagnosis, likelihood of a condition
    ("diagnosis", W + r"diagnos"), ("diagnosis", W + r"differential"),
    ("diagnosis", W + r"befund"), ("diagnosis", W + r"likelihood"),
    ("diagnosis", W + r"wahrscheinlichkeit"),
    # 4.2 condition names (ADHD first) and condition groupings
    ("condition", r"(?-i)\b(ADHD|ADHS|ADD|ADS|OCD|PTSD|PTBS|TBI)\b"),
    ("condition", W + r"attention[- ]deficit"), ("condition", W + r"aufmerksamkeitsdefizit"),
    ("condition", W + r"hyperaktiv"), ("condition", W + r"hyperactiv"),
    ("condition", W + r"disorder"), ("condition", W + r"störung"), ("condition", W + r"stoerung"),
    ("condition", W + r"depress"), ("condition", W + r"autis"), ("condition", W + r"dyslex"),
    ("condition", W + r"legasthen"), ("condition", W + r"anxiety"), ("condition", W + r"angststör"),
    ("condition", W + r"schizophren"), ("condition", W + r"bipolar"), ("condition", W + r"dementia"),
    ("condition", W + r"demenz"), ("condition", W + r"alzheimer"), ("condition", W + r"parkinson"),
    ("condition", W + r"epilep"), ("condition", W + r"seizure"), ("condition", W + r"krampfanf"),
    ("condition", W + r"concussion"), ("condition", W + r"insomni"), ("condition", W + r"tourette"),
    ("condition", W + r"migrän"), ("condition", W + r"migraine"), ("condition", W + r"disease"),
    ("condition", W + r"krankheit"), ("condition", W + r"erkrank"),
    # 4.3 interpretation: phrases and construct names
    ("interpretation", W + r"consistent with"), ("interpretation", W + r"vereinbar mit"),
    ("interpretation", W + r"suggests\b"), ("interpretation", W + r"reflects?\b"),
    ("interpretation", W + r"indicat(es|ing|ive)\b"), ("interpretation", W + r"deutet auf"),
    ("interpretation", W + r"spricht für"), ("interpretation", W + r"weist auf"),
    ("interpretation", W + r"spiegel"), ("interpretation", W + r"typical of"),
    ("interpretation", W + r"typisch für"),
    ("construct", W + r"attention"), ("construct", W + r"aufmerksamkeit"),
    ("construct", W + r"impulsiv"), ("construct", W + r"arousal"), ("construct", W + r"vigilan"),
    ("construct", W + r"workload"), ("construct", W + r"arbeitsbelastung"),
    ("construct", W + r"konzentration"), ("construct", W + r"concentration"),
    # 4.4 normal, abnormal, pathological in a clinical sense
    ("normality", W + r"abnormal"), ("normality", W + r"normal\b"),
    ("normality", W + r"normale[nmrs]?\b"), ("normality", W + r"normalbefund"),
    ("normality", W + r"patholog"),
    ("normality", W + r"auffällig"), ("normality", W + r"unauffällig"),
    ("normality", W + r"conspicuous"), ("normality", W + r"inconspicuous"),
    # 4.5 treatment, medication, neurofeedback, further tests
    ("treatment", W + r"treatment"), ("treatment", W + r"therap"), ("treatment", W + r"behandl"),
    ("treatment", W + r"medicat"), ("treatment", W + r"medikat"), ("treatment", W + r"medikament"),
    ("treatment", W + r"methylphenidat"), ("treatment", W + r"neurofeedback"),
    ("treatment", W + r"recommend"), ("treatment", W + r"empfehl"), ("treatment", W + r"empfohl"),
    ("treatment", W + r"further tests?\b"), ("treatment", W + r"weitere untersuchung"),
    # 4.6 and 4.7 prediction, monitoring of treatment effect, screening, triage
    ("prediction", W + r"predict"), ("prediction", W + r"vorhersag"), ("prediction", W + r"prognos"),
    ("prediction", W + r"screening"), ("prediction", W + r"triage"),
    ("prediction", W + r"improve"), ("prediction", W + r"verbesser"),
    ("prediction", W + r"deteriorat"), ("prediction", W + r"verschlecht"),
    # regulatory claims
    ("claim", r"(?-i)\bFDA\b"), ("claim", r"(?-i)\bCE[- ]?(certified|marked|mark|zertifiziert|Kennzeichnung)"),
    ("claim", r"(?-i)\b510\(k\)"), ("claim", W + r"fda[- ]cleared"), ("claim", W + r"clinically (proven|validated)"),
    ("claim", W + r"klinisch (bewiesen|validiert|erprobt)"),
]

# Japanese terms, matched anywhere (Japanese has no word boundaries).
JA = [
    ("condition", r"ADHD"), ("construct", r"注意"), ("construct", r"衝動"), ("construct", r"覚醒"),
    ("normality", r"異常"), ("normality", r"正常"), ("diagnosis", r"所見"), ("prediction", r"改善"),
    ("interpretation", r"示唆"), ("diagnosis", r"診断"), ("treatment", r"治療"),
    ("condition", r"障害"), ("prediction", r"悪化"),
]

# Only for the fixed system sentences: comparison and advice wording (kind (a) and (b1) of the
# deterministic text layer restate values; they never compare as better or worse or advise).
SENTENCE_EXTRA = {
    "en": [("comparison", r"\bworse\b"), ("comparison", r"\bbetter\b"), ("prediction", r"\brisk\b"),
           ("treatment", r"\bconsider"), ("treatment", r"\bshould\b"), ("condition", W + r"deficit")],
    "de": [("comparison", W + r"besser"), ("comparison", W + r"schlechter"),
           ("prediction", W + r"risiko"), ("treatment", W + r"sollte"),
           ("interpretation", W + r"deutet"), ("condition", W + r"defizit")],
    "ja": [],
}

# Explicit allow-list: (name, regex on the whole text). A hit inside a match of one of these is
# allowed (the intended-use disclaimers say that the system does not diagnose).
ALLOW = [
    ("intended-use disclaimer EN", re.compile(
        r"(does not|do not|doesn't|never) (diagnose|interpret|recommend)( any)?( treatment)?|"
        r"not a diagnosis|"
        r"no diagnosis|without (a )?diagnosis|an aid, not a diagnosis", re.I)),
    ("intended-use disclaimer DE", re.compile(
        r"(stellt|stellen) keine diagnose|keine diagnose|nicht diagnostisch|"
        r"(gibt|geben) keine (behandlungs|therapie)?empfehlung", re.I)),
    ("EEG montage term", re.compile(r"\bbipolare? (longitudinal|transverse|längs|quer|Längsreihe|Querreihe)\b", re.I)),
    # Field labels where the clinician documents medicines taken (the anamnesis fields of open
    # question I5 and the patient state of intended use section 5, "recording conditions
    # documented by the user"). Only these exact labels pass; the word stays forbidden in every
    # sentence and in any other text (mockup assumption M60).
    ("anamnesis and recording condition field label", re.compile(
        r"^(Medication|Medication on the recording day|Medikation|Medikation am Aufnahmetag)$",
        re.I)),
]


def compile_list(pairs):
    """[(category, pattern, compiled)]; a leading (?-i) makes a pattern case-sensitive."""
    out = []
    for cat, pat in pairs:
        flags = 0 if pat.startswith("(?-i)") else re.I
        out.append((cat, pat, re.compile(pat.replace("(?-i)", ""), flags)))
    return out


COMPILED = compile_list(FORBIDDEN)
COMPILED_JA = compile_list(JA)
COMPILED_SENTENCE = {lang: compile_list(x) for lang, x in SENTENCE_EXTRA.items()}


def allowed_by(text, start):
    """Name of the allow-list entry whose match covers position start of text, or None."""
    for name, rx in ALLOW:
        if any(m.start() <= start < m.end() for m in rx.finditer(text)):
            return name
    return None


def hits(text, sentence_lang=None):
    """Forbidden words in text, as [(category, pattern, word)], hits covered by the allow-list
    left out. The shared list and the Japanese terms always apply (a text may mix languages);
    sentence_lang adds the sentence-only wording of that language."""
    text = text or ""
    rules = COMPILED + COMPILED_JA + (COMPILED_SENTENCE.get(sentence_lang, []) if sentence_lang
                                      else [])
    out = []
    for cat, pat, rx in rules:
        for m in rx.finditer(text):
            if not allowed_by(text, m.start()):
                out.append((cat, pat, m.group(0)))
    return out
