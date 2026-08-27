# Report JSON shape — Architecture Advisor viewer

The web viewer at `docs/` in the `power-cat-skills` repo renders a single JSON object.
The machine-readable contract is `docs/report.schema.json`; this file is the authoring summary.

Emit exactly these keys. Omit any section you have nothing for — the viewer hides empty sections.
Do not add keys that are not listed here; the schema rejects unknown properties.

```jsonc
{
  "schemaVersion": "1.0",                    // required, always this literal
  "scenario": {
    "title": "Volunteer rota and Gift Aid tracking",  // required, no customer or org names
    "generated": "2026-08-10",
    "summary": "3–5 sentences: the problem, the users, what is going wrong today."
  },

  // Required. THE PRIMARY OUTCOME — one composed solution, described capability by capability.
  // Lead with this. Never present the answer as a single-product choice when it is not one.
  "solution": {
    "headline": "One or two sentences naming how the parts fit together, in business terms.",
    "parts": [
      { "capability": "Capture shifts and donations wherever staff are",
        "need": "The problem it solves, in the user's own words.",
        "build": "What to build for it, in plain language, and why that choice.",
        "components": ["Canvas app", "Dataverse", "Outlook connector"],
        "users": "Charity staff, on phones",
        "phase": "Phase 1" }
    ]
  },

  // Required. Supporting evidence — every option considered, best match first.
  "fitMatrix": [
    { "option": "Canvas app",
      "match": "strong",                     // strong | good | fit | nofit
      "why": "One plain sentence tied to something the user actually said.",
      "tradeoff": "What you would give up by choosing this instead.",
      "whatItWouldTake": "A skill to hire, a licence to check, a phase to defer to, or 'nothing'.",
      "inSolution": true }
  ],
  "recommendation": "Optional closing note — sequencing, caveats, what to revisit later.",

  "diagram": "graph LR\n  A[...] --> B[(Dataverse)]",   // mermaid source, no ``` fences

  "components":  [ { "component": "", "whatItDoes": "", "primaryUser": "" } ],  // optional detail
  "security":    [ "bullet", "bullet" ],
  "risks":       [ { "risk": "", "likelihood": "high|medium|low", "preventive": "", "contingency": "" } ],

  "roadmap":     [ { "phase": "Phase 1 (Days 0–30) — Foundation",
                     "tasks": [ { "task": "", "who": "", "notes": "" } ] } ],   // max 3 phases
  "quickWins":   [ "" ],

  "backlog":     [ { "id": "BL-001", "title": "", "type": "", "priority": "critical|high|medium|low",
                     "phase": "", "effortDays": 2, "notes": "" } ],

  "decisions":   [ { "id": "DEC-001", "title": "", "decision": "", "options": [ "" ],
                     "rationale": "", "tradeoffs": "", "status": "Confirmed|Open|To Review" } ],

  "nextSteps":   [ { "action": "", "who": "", "blocker": "" } ],

  "glossary":    [ { "n": 1, "term": "Dataverse", "meaning": "One or two plain sentences." } ]
}
```

## Rules

- **Lead with the composition, not the technology.** `solution.parts` is the headline; `fitMatrix` is
  the working that supports it. A scenario needing capture, back-office work, a guided process, and
  question-answering has four parts — do not flatten it to one product.
- **Every part shares one data layer** unless you explain why not.
- **Never emit a numeric fit score.** Only the `match` band and the reason.
- **Set `tradeoff` on every option not in the solution** — what the user would give up by choosing it.
  This is often more useful than the band itself.
- **`DEC-001` is always the shape of the solution**, listing what was considered and rejected.
- **Glossary numbering must match the `[n]` markers** used in `solution` prose and elsewhere.
  Every marker needs an entry; every entry needs a marker.
- **No customer, organisation, or internal system names** anywhere in the payload — the same guardrail
  that applies to the chat output. A report may be shared as a link, so treat every field as public.
- Write to the user's chosen path outside the workspace. **Never write a populated report into the
  repo**, and never commit one.
