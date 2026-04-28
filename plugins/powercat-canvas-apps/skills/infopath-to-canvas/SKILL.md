---
name: infopath-to-canvas
version: 1.0.0
description: Migrate a Microsoft InfoPath form (.xsn) to a Power Apps Canvas app. USE WHEN the user wants to convert, port, or migrate an InfoPath form/template to Canvas Apps, or asks for help moving off of InfoPath.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, PowerShell, Agent, TaskCreate, TaskUpdate, TaskList, Skill, EnterPlanMode, ExitPlanMode
---

# Migrate an InfoPath Form to a Canvas App

Migrate the InfoPath form described below:

$ARGUMENTS

A `.xsn` is a CAB archive containing `manifest.xsf` (rules, views, data connections),
`schema*.xsd` (data schema), `template.xml` (defaults), and XSL views. This skill runs three
phases: **extract → inventory → hand off to `generate-canvas-app`**. Pause for user approval
after the inventory.

---

## Phase 0 — Extract

From `$ARGUMENTS`, resolve a `.xsn` path. If the user gave a folder, `Glob` for `*.xsn`
inside; ask if there are multiple or none.

If a sibling `xsn_extracted/` already contains `manifest.xsf`, reuse it. Otherwise extract to
`<source_dir>/xsn_extracted/`:

- **Windows**: `& "$env:SystemRoot\System32\expand.exe" "<form>.xsn" -F:* "<xsn_extracted>"` via PowerShell
- **macOS / Linux**: `cabextract -d <xsn_extracted> <form>.xsn`

Verify `manifest.xsf` and `schema1.xsd` exist; abort if not.

---

## Phase 1 — Inventory

Spawn a general-purpose `Agent` to write `infopath-inventory.md` covering:

- **Fields** — from `schema1.xsd` + `template.xml` `dfs:dataFields`: decoded name, type
  (Text, Date, Number, Choice, multi-Choice, Person, NoteEnhanced/rich-text, Lookup, …),
  constraints (`maxLength`, `pattern`, `enumeration`, `minOccurs`/`nillable`), default.
  Decode URL-encoded names: `_x0020_`=space, `_x0028_`=`(`, `_x0029_`=`)`, `_x002d_`=`-`,
  `_x0023_`=`#`, `_x0026_`=`&`.
- **Rules** — from `manifest.xsf`: schema-required fields, `xsf:errorCondition` (field +
  XPath translated to plain English + message), `xsf:ruleSet`/`xsf:domEventHandler` (trigger,
  condition, action), `xsf:submit` destination.
- **Lookup connections** — every non-`schema*.xsd` schema: source name + columns used.
- **Views** — section headings and field ordering from the XSL views; note multiple views.
- **Section recommendation** — propose logical sections of 10–30 fields each for Canvas.

After the agent returns, surface counts (fields / rules / connections / sections) and ask:

1. Mock with collections in `App.OnStart` (default), or wire to real SharePoint?
2. Keep all sections, or drop any?
3. Aesthetic preferences? (default: clean professional)

Wait for answers.

**If the user wants to wire to real SharePoint**, strongly suggest they add the SharePoint
list(s) as a data source in the app *before* generation — Canvas can't bind to a connection
that doesn't exist in the app. Tell them the steps (Power Apps Studio → Data → Add data →
SharePoint → pick site/list) and that this skill can verify the schema once it's done.

When they confirm, call `mcp__canvas-authoring__list_data_sources` to see what's connected,
then `mcp__canvas-authoring__get_data_source_schema` for each list. Diff against the
inventory: every InfoPath field should map to a SharePoint column of compatible type. Report
any **missing columns**, **type mismatches** (e.g. InfoPath Date vs. SP Text), or
**extra-required columns** the form doesn't populate. Pause and let the user reconcile
(rename columns, add missing ones, or trim the inventory) before Phase 2.

---

## Phase 2 — Hand off to `generate-canvas-app`

Write `canvas-app-prompt.md` containing:

- The kept sections + field lists with type hints (call out dates, multi-choice, rich text).
- Each InfoPath rule restated as the desired Canvas behavior in plain English (the inner
  skill maps to Power Fx).
- Mock-data plan if mocking: 3–5 sample records per section, plus choice-list collections
  seeded from enumerations / lookup tables.
- The user's aesthetic answer.
- Validation should **block** submit (`DisplayMode.Disabled` on Save buttons) — an intentional
  upgrade from InfoPath's flag-but-don't-block behavior; flag this as a deliberate change.

Then invoke `generate-canvas-app` via the `Skill` tool, passing the prompt as `args`. If
that skill isn't available, instruct the user to run `/generate-canvas-app` against
`canvas-app-prompt.md`.
