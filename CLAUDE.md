# Working agreement for agents

Read this before doing anything in this repository.

## What this repository is

A disposable mockup of V4, the rebuild of a clinical EEG and ERP decision support platform.
It exists to show the clinical lead and the CTO what the specification means in practice: a
sample report in several clinic styles and a clickable prototype of the clinician's workflow.

- The specification lives in the repository `PershinIlya/v4` (read only from here) and in the
  shared Google Doc "V4: key specification and open questions"
  (id `10kjody6kNlUM6S5Ik_KOca2U3gf88XdDiCA4rzbRsiM`, read only, never edit it).
- Nothing here is product code. V4 is built under a quality management system from its first
  line of code, so code from this repository is never reused in the product.
- Where the specification is silent, choose, and list the choice as a "mockup assumption" in
  `README.md`. Never present a mockup choice as a decision.

## Hard rules

1. **Synthetic data only.** No real recordings, reports, patient names, birth dates or
   identifiers. Synthetic values are plausible but clearly artificial, and every report page
   and screen says "Mockup, synthetic data".
2. **Real templates never enter the repository.** The legacy (V3) Word templates the product
   owner uploads contain real clinic names, logos and texts. Never commit the files, their
   images or their text. Clinics appear as Clinic A, B, C; logos are neutral placeholders.
   Only a pseudonymised structural analysis may be committed.
3. **Never commit credentials**, connection strings, server names or IP addresses.
4. **Do not invent facts about the legacy system (V3).** If a detail is not in `PershinIlya/v4`
   or stated by the product owner, mark it as a mockup assumption.
5. **Clinical framing.** The system assists a clinician; it does not diagnose. No condition
   names (ADHD or others) attached to results, no interpretation, no treatment advice. Report
   text comes only from fixed sentences that restate measured values against norms.

## Conventions

- Talk to the product owner in Russian; files are in English. No em or en dashes anywhere.
- Explain every abbreviation and specialist term in plain words the first time it comes up in
  a conversation with the product owner.
- The product owner reviews results, not code: deliver PDFs, screenshots and links he can
  judge without reading code.
- People appear by role in files (the product owner, the clinical lead, the CTO).

## Agents

- Before showing anything to the product owner, an independent reviewer agent checks the
  outputs against the specification and against hard rules 1, 2 and 5.
- Without explicit permission from the product owner, at most 4 agents run at the same time
  and the Workflow tool is not used. The product owner may allow more for a session (for
  example by switching on ultracode); that permission lasts for that session only.

## Git

- Work on the branch the session assigns. Do not open pull requests unless asked.
- Commit messages: imperative mood, subject under 72 characters.
