# Template coverage: legacy report templates in the V4 block schema

Status 29 October 2026, third version: classes follow table 3.3 of the shared document of 29
October (questionnaires are a later module). Mockup analysis, pseudonymised. The legacy (V3)
templates, their images and their texts are not in this repository (CLAUDE.md rule 2); clinics
appear as Clinic A to H, templates as T01 to T16. Per-template models: `coverage/models/Tnn.json`;
all tables below: `python3 -m mockup.coverage_summary`.

## Answer in brief

**Does the block schema of I6 cover about 90% of what the templates need?**

- **For the first release (English and German templates): 83% as I6 describes the schema today,
  about 93% with three small additions,** and 100% with eight. The three that matter most:
  a device block for recording and norm facts (TG10), a clinician form block (TG6), and a
  generated table of contents (TG5).
- **For the Japanese templates (a later market): 60% today.** They need two more additions:
  neutral legend variants inside device figures (TG1) and Japanese plus English titles (TG2).
  Together with TG10 they reach 100%. These three templates carry 7,410 of the 9,638 reports a
  year in the sample, so the weighted figure over all templates is only 65%.
- **What can be carried over unchanged is much less: 68% of the English and German elements in
  scope, 47% of the Japanese.** The rest either needs a schema addition or holds claim wording:
  70 of 153 clinic texts (46%) name conditions or mental functions, give treatment advice, or
  state a fixed verdict.
- **On top of that, 236 elements (22% of all) must be left out**, mostly fixed verdicts (79)
  and treatment advice (66). **359 elements (33%) belong to analyses outside the core**: 241
  return when their modules are certified, 122 of them questionnaires and cognitive tests
  (table 3.3: a later module; until it is certified, clinics use questionnaires in V3); 75 never
  return (dropped or research only); and 43 depend on open questions: ICA component ERPs and
  the ERPC2 checklist over them (22) and sLORETA (9), all under Q8; lagged, instantaneous and
  total coherence (9, Q6); a lateral F7/F8 variant of the asymmetry index that table 3.3 does
  not list, and two text markers of unclear meaning (3).

So the product owner's expectation of "about 90%" (I6) holds for the structure of the first
release after three additions. It does not hold for content: about a third of what clinics put
into their templates today cannot go into a core report.

**Limits of these figures.** They count template elements, a proxy for "needs", and every
element counts once whatever its size. Elements "to confirm" (table 3.3) count as covered. The 16
templates are 69% of the 13,946 template uses of the year to 27 October 2026, out of about 121
templates used (I11). The largest unmodelled share, 14.7%, is a file missing on the server, last
used in April 2026, with the same file name as T03 (probably an earlier version; its language
is taken from the file name). The CP templates in the sample ran the AI interpretation only 28
times in a year, against about 2,150 CP reports in all. The models are an agent reading of the
templates and the legacy audit; neither the CTO nor the clinical lead has checked them.

## Method

Each template is split into elements: one per figure, table, generated text, static text,
image, slot group, header, footer and clinician area. Each element has one class.

| Class | Meaning | In the coverage figure |
| --- | --- | --- |
| device | a result of a "Core" row of table 3.3 | covered |
| to_confirm | a result of a "Core, to confirm" row | covered |
| clinic | the clinic's own neutral content (text, image, slots, header and footer) | covered |
| clinician | filled per report by the clinician, including the signature at issue | covered |
| not_expressible | needed in a core report but needs a schema change (template gap TG1 to TG11) | not covered |
| leave_out | must not be carried over and needs no schema support | not counted |
| later_module, research_only, dropped, open | outside the core (table 3.3) | not counted |

Coverage = (in scope minus not expressible) / in scope; weighted by reports a year (rounded
to tens). "Carried over unchanged" also takes out elements with claim wording. Every element
needing a schema change counts as not expressible, even when most of it is a device figure.

The models were made in two rounds by agents working from the original files: a first round
by three agents, reviewed by seven independent reviewers (111 findings, 10 blocking: a missed
cover page in six templates, an inconsistent metric, classes differing between agents), and a
second round with one rule set for all 16 templates, a new extraction that reads content
controls and text boxes, and a written answer to every finding. The second round was checked
by script rather than by a second review panel, to save tokens: valid structure and counts,
same class for the same marker across templates, no clinic, person or place names, no 4-word
run of template prose and no 6-character Japanese run (the only matches are measure names and
table 3.3 rows), no exact colours, no web addresses.

## Per template

| Template | Clinic | Kind | Lang | Reports a year | Elements | Device | To confirm | Clinic | Clinician | Not expressible | Leave out | Outside the core | Coverage | Carried over unchanged | Clinic texts with claim wording |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T01 | Clinic A | RG | JA | 3,760 | 18 | 4 | 1 | 4 | 0 | 6 | 2 | 1 | 60% | 47% | 1 of 1 |
| T02 | Clinic A | RG | JA | 3,240 | 18 | 4 | 1 | 4 | 0 | 6 | 2 | 1 | 60% | 47% | 1 of 1 |
| T03 | Clinic A | RG | JA | 410 | 18 | 4 | 1 | 4 | 0 | 6 | 2 | 1 | 60% | 47% | 1 of 1 |
| T04 | Clinic B | CP | DE | 550 | 84 | 10 | 1 | 15 | 0 | 7 | 19 | 32 | 79% | 55% | 8 of 13 |
| T05 | Clinic B | CP | DE | 460 | 47 | 1 | 1 | 10 | 4 | 1 | 10 | 20 | 94% | 88% | 1 of 6 |
| T06 | Clinic C | RG | EN | 280 | 92 | 13 | 2 | 21 | 2 | 7 | 20 | 27 | 84% | 71% | 6 of 15 |
| T07 | Clinic D | RG | EN | 230 | 93 | 15 | 2 | 19 | 2 | 10 | 22 | 23 | 79% | 67% | 6 of 15 |
| T08 | Company standard | RG | DE | 210 | 56 | 4 | 1 | 21 | 0 | 12 | 8 | 10 | 68% | 55% | 5 of 14 |
| T09 | Clinic E | CP | EN | 120 | 102 | 10 | 1 | 18 | 1 | 6 | 24 | 42 | 83% | 67% | 6 of 13 |
| T10 | Clinic F | CP | DE | 120 | 116 | 12 | 1 | 21 | 2 | 8 | 26 | 46 | 82% | 66% | 7 of 16 |
| T11 | Clinic F | CP | DE | 90 | 108 | 10 | 1 | 20 | 2 | 7 | 25 | 43 | 82% | 65% | 7 of 15 |
| T12 | Clinic G | RG | DE | 90 | 101 | 12 | 2 | 21 | 6 | 4 | 24 | 32 | 91% | 73% | 8 of 16 |
| T13 | Clinic H | CP | EN | 70 | 110 | 15 | 2 | 18 | 2 | 13 | 25 | 35 | 74% | 62% | 6 of 14 |
| T14 | Company standard | CP | EN | 6 | 101 | 15 | 2 | 14 | 1 | 8 | 24 | 37 | 80% | 65% | 6 of 10 |
| T15 | Clinic F | CP | EN | 1 | 13 | 0 | 0 | 7 | 1 | 1 | 2 | 2 | 89% | 78% | 1 of 3 |
| T16 | Company standard | RG | EN | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 7 | none in scope | | |

Kind: RG is a classic report template, CP one with slots for the AI interpretation. T01 to T03
have the same content. T09 is an English copy of the T10 family, T11 is T10 without three
sections, and T15 (a stand-alone nutrition recommendation) is from the same clinic. T16 (heart
rate variability) lies wholly outside the core. T04 and T05 are used as a pair (appendix and
summary). Reports a year are rounded to tens.

## Schema additions, ordered by effect on the first release

| # | Gap | Templates (reports a year) | Proposed addition | Weighted coverage EN and DE after adding it and those above |
| --- | --- | --- | --- | ---: |
| TG10 | Recording parameters, amplifier, filters, montage, band legends and norm description typed as clinic text or drawn into clinic images; in T01 to T03 a cover figure shows band limits that differ from the device bands | T01 to T04, T06 to T14 (9,180) | Device metadata placeholders and a device method block; validation that clinic text does not state device parameters | 87% |
| TG6 | Forms the clinician fills: tick-box checklists, screening and findings tables, recommendation tables | T04, T06, T07, T09 to T11, T13, T14 (1,470) | A clinician form block with clinic-defined rows; rows must not name conditions, mental functions or treatments (15 of these forms do today); the clinical lead decides | 91% |
| TG5 | Table of contents and "see page N" | T04, T06 to T14 (1,770) | Generated table of contents and cross-references as a template option | 93% |
| TG8 | Layout fixed to two measurements; per-measurement dates and notes | T08 (210) | Comparison device blocks for any number of measurements (3.4, working decision) and per-measurement placeholders | 95% |
| TG7 | Two templates used as a pair (appendix and summary) | T04, T05 (1,010) | A template record that defines several output documents over one block set | 97% |
| TG11 | Named signatories and their titles fixed in the template | T06 to T08, T10, T11, T13, T15 (1,000) | A device "issued by" block filled at issue from the issuing user (name, qualification, date and time, version); no fixed signatories or signature images in clinic blocks | 99% |
| TG4 | Template scripts that build the frequency deviation table and drop it when empty | T04, T09 to T11, T13, T14 (960) | A device table for frequency markers (to confirm, Q6) with a rule for absent data | 100% |
| TG9 | Per-channel values laid out as a head diagram | T10 (120) | A device per-channel head map block | 100% |
| TG1 | Clinic legends and shapes drawn over device figures | T01 to T03 (7,410) | Company-verified legend variants inside figure blocks, restricted to restating the scale ("below the norm", "near the norm mean", "above the norm"); lay headings that rename measures and the word for clinically "normal" are left out | Japanese: 93% with TG10 |
| TG2 | Japanese plus English terms in section titles | T01 to T03 (7,410) | An optional second-language term in device block titles, from a verified term list | Japanese: 100% |

**Not proposed: age variants of clinic text (TG3).** Every age condition found sits in treatment
or lifestyle recommendations, so it is left out (rule 5). Revisit only if a neutral
age-dependent text appears.

**Also needed, not counted in the figures** (from the review):

- **Module blocks.** Each later module is a separate certified device added without changing
  the core (3.1). The template record needs an extension point now for module output, with the
  module's own version and claim boundary. The largest group is the questionnaire module: 122
  questionnaire and cognitive test elements in 12 of the 16 templates, half of the 241
  later-module elements; then the CP text (AI interpretation), the classifiers, the indices
  under licence, vigilance, microstates and spike detection.
- **Absent data.** Each device block needs a stated behaviour when its data are missing (hide,
  or show "not recorded"); V3 hides sections silently with block switches.
- **Anamnesis prefill.** In T04, T06, T07 and T09 to T14 the anamnesis and referral fields are
  filled from the patient's history form today. The history form is a questionnaire, so it is
  in the later questionnaire module (table 3.3). In a core report the clinician types these
  fields in the report editor (3.5), and the automatic prefill is lost until that module is
  certified: a workflow loss to discuss under I11.

## Theme and layout

The I6 theme layer names fonts, colours, sizes, header and footer layout. The templates also need:

| Need | Templates | Covered by the I6 theme as written | Smallest addition |
| --- | --- | --- | --- |
| Different first page (no running header on the cover) | 15 of 16 | no | First-page variant of header and footer |
| Cover: full-bleed banner bitmap (T01 to T03), full-page cover bitmap (T13), Word cover-page control with logo and text boxes, letterheads (T07, T15) | 13 | partly (logo) | A cover block type with a full-bleed image area and placeholders; no text inside bitmaps |
| Running header with patient slots and page number from page 2 | 15 | partly | Header slots for name, birth date and page number |
| Section numbering: typed into headings (T01 to T03, breaks when blocks are reordered) or automatic roman and arabic | 13 | no | Automatic heading numbering as a theme option |
| Start on new page, manual page breaks (25 to 76 per long template) | 14 | no | "Start on new page" and "keep together" as block options (mockup assumption) |
| Figure width options on image markers | 6 | no | A figure size option per device block within fixed limits |
| Fonts: several proprietary Japanese fonts | T01 to T03 | yes, if the approved list covers Japanese | Approved Japanese fonts that embed in the PDF |
| Legend text coloured to match the fixed device curve colours | 8 | no | Legends belong to the device block; clinic colours must stay clear of the fixed z colour scale |
| Footnotes with citations and method notes | 5 | no | Footnotes in clinic text blocks, or leave out |

## What V4 adds to every template

A clinic template must make room for these, and the theme must not be able to hide them:

- the software and norm versions, report version and issue status (3.5, 3.8);
- the issuing clinician, date and time of issue (TG11);
- signal quality, the analysed durations and accepted trials, and any manual change of the
  cleaning or the segments (3.4);
- the fixed sentences: one per value beyond the threshold, the summary by fixed rule, and the
  quality and limits sentences (3.2);
- which values are marked after the correction for multiple comparisons (3.2, working
  decision; the method is chosen at implementation);
- for comparisons, the statement that earlier measurements were reprocessed (3.4);
- in the mockup, "Mockup, synthetic data" on every page.

T01 to T03 have no text at all today; these blocks would probably add one to two pages to them
(estimate). A set of
**mandatory device blocks** per report type is a proposed schema addition.

## Leave out

| Reason | Elements | Examples |
| --- | ---: | --- |
| Fixed verdict | 79 | static sentences stating a result whatever the data: no epileptiform activity, synchronised hemispheres, no significant findings, a match with a condition group, a favourable task verdict |
| Treatment advice | 66 | recommendation, medication, neurofeedback, nutrition and lifestyle texts, and their age variants |
| Legacy text | 28 | generated legacy sentences with construct labels (behaviour and figure sentences), replaced by the V4 sentence library |
| Control marker | 27 | language selectors, hidden patient-information lines, block switches |
| Error | 20 | text in the wrong language for the template, swapped labels, copies from a sibling template |
| Name in sentence | 10 | the patient's name inside generated or fixed sentences |
| Scanned signature | 6 | signature images |

## Claim wording

Claim wording (conditions, mental-function labels, treatment, fixed verdicts, regulatory claims,
lay glosses) is flagged on every element, whatever its class: 70 of 153 clinic text elements
(46%), 28 elements that need a schema addition (15 forms, 9 overlays, 4 method texts), 168
elements to leave out and 225 outside the core. Many sit in long introductions and method texts
that are otherwise neutral; four introductions (T06, T07, T13, T14) state a regulatory
approval of the norm database.
If clinic blocks stay freely editable, the core's claim boundary (ADR 0003, `intended-use.md` §4)
depends on what each clinic types. I6 leaves open whether to warn on claim words in clinic
blocks. Options for the product owner and the clinical lead: (a) warn on a word list in all
languages; (b) block saving until the company has reviewed the text; (c) clinic texts only from
company-verified variants. The findings suggest at least (b) for the first release, in which the
company builds the templates anyway (3.5, working decision). A related question for the
clinical lead: are reports handed to patients? The Japanese overlays are written for lay readers.

## Mockup assumptions in this analysis

Also listed in `README.md` (M16 to M21). Gap ids are TG1 to TG11 ("template gap") so that
they do not clash with the open question ids (G1, G2, ...) of the specification repository.

- A generated table of contents is a template option, not part of the I6 schema (TG5).
- "Start on new page", "keep together" and a figure size are block options, not in I6.
- The report language is an attribute of the template record.
- The stress classifier is counted with bio signals (dropped) where the audit shows it switched
  off; cognitive tests are counted with questionnaires (later module, table 3.3 of 29 October).
- The manual ERP component tick tables are clinician forms (TG6). They could also be read as
  ERPC2 (open, Q8).
- Usage figures are rounded to tens so that the T codes are harder to map back to file names;
  anyone holding the export can still do so.
