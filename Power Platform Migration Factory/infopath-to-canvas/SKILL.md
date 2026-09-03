---
name: infopath-to-canvas
version: 2.2.0
description: Migrate a Microsoft InfoPath form (.xsn) to a Power Apps Canvas app. USE WHEN the user wants to convert, port, or migrate an InfoPath form/template to Canvas Apps, or asks for help moving off of InfoPath.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, PowerShell, Agent, TaskCreate, TaskUpdate, TaskList, Skill, EnterPlanMode, ExitPlanMode
---

# Migrate an InfoPath Form to a Canvas App

Migrate the InfoPath form described below:

$ARGUMENTS

A `.xsn` is a CAB archive containing `manifest.xsf` (rules, views, data connections),
`schema*.xsd` (data schema), `template.xml` (defaults), and XSL views. This skill runs six
phases: **extract → inventory → verify → hand off to `/canvas-app` → configure environment
variables (optional) → export migration log**. Pause for user approval after the inventory and
again after verification.

> **v2.0 changes:** the downstream `generate-canvas-app` skill this migration used to hand
> off to has been folded into the unified `/canvas-app` skill (which now auto-detects create
> vs. edit) in the `canvas-apps@power-platform-skills` plugin. This skill's Phase 0 prerequisite
> check and Phase 4 handoff have been updated to match. A new **Phase 3 — Verify** step has also
> been added: XSLT-view extraction alone is not reliable enough to generate from directly.
>
> **v2.1 changes:** added **Phase 5 — Environment Variables**, so a migrated app's data-source
> connections move with it across dev/test/prod instead of being hardcoded to whatever
> environment it was built against, and **Phase 6 — Export Migration Log**, which writes a
> dated record of everything this skill did for a given `.xsn` so the run is auditable and
> repeatable later.
>
> **v2.2 changes:** two refinements based on running this at factory scale. **Phase 5 —
> Environment Variables is now optional**, gated on whether the migration is actually going to
> move across environments (ALM dev/test/prod) — a POC or single-environment migration can skip
> it and bind data sources directly. **Phase 3 — Verify no longer requires screenshots** to
> proceed; they're the preferred, highest-confidence check when available, but the skill now
> falls back to a documented lower-confidence pass over the XSLT-derived inventory and flags
> exactly which fields/sections/rules weren't screenshot-confirmed, so a batch of migrations
> isn't blocked waiting on screenshots for every form.

---

## Phase 0 — Prerequisites

[#phase-0--prerequisites](#phase-0--prerequisites)

Before extracting anything, confirm the environment is ready:

1. **Plugins installed.** This skill depends on `canvas-apps@power-platform-skills` for the
   actual app generation. If `mcp__canvas-authoring__*` tools aren't available, tell the user to run:
   ```
   /plugin marketplace add microsoft/power-platform-skills
   /plugin install canvas-apps@power-platform-skills
   /plugin marketplace add microsoft/power-cat-skills
   /plugin install powercat-canvas-apps@power-cat-skills
   ```
2. **Coauthoring session connected.** The Canvas Authoring MCP server needs an active session
   before Phase 3 can hand off successfully. If the user already knows they want to wire this
   to a real Canvas app (not just mock with collections), have them run `/configure-canvas-mcp`
   (or describe the flow: open the target app in Power Apps Studio, enable Settings → Updates →
   Coauthoring, copy the Studio URL, keep the tab open) **before** Phase 1 finishes, so the
   SharePoint-list diff in Phase 1 has something to diff against. If they only want to mock data
   for now, this can wait until they're ready to build for real.

---

## Phase 1 — Extract

[#phase-1--extract](#phase-1--extract)

From `$ARGUMENTS`, resolve a `.xsn` path. If the user gave a folder, `Glob` for `*.xsn` inside; ask if there are multiple or none.

If a sibling `xsn_extracted/` already contains `manifest.xsf`, reuse it. Otherwise extract to `<source_dir>/xsn_extracted/`:

- **Windows**: `& "$env:SystemRoot\System32\expand.exe" "<form>.xsn" -F:* "<xsn_extracted>"` via PowerShell
- **macOS / Linux**: `cabextract -d <xsn_extracted> <form>.xsn`

Verify `manifest.xsf` and `schema1.xsd` exist; abort if not.

---

## Phase 2 — Inventory

[#phase-2--inventory](#phase-2--inventory)

Spawn a general-purpose `Agent` to write `infopath-inventory.md` covering:

- **Fields** — from `schema1.xsd` + `template.xml` `dfs:dataFields`: decoded name, type
(Text, Date, Number, Choice, multi-Choice, Person, NoteEnhanced/rich-text, Lookup, …),
constraints (`maxLength`, `pattern`, `enumeration`, `minOccurs`/`nillable`), default.
Decode URL-encoded names: `_x0020_`=space, `_x0028_`=`(`, `_x0029_`=`)`, `_x002d_`=`-`,
`_x0023_`=`#`, `_x0026_`=`&`.
- **Rules** — from `manifest.xsf`: schema-required fields, `xsf:errorCondition` (field +
XPath translated to plain English + message), `xsf:ruleSet`/`xsf:domEventHandler` (trigger,
condition, action), `xsf:submit` destination.
- **Routing / state fields** — flag any field that drives multi-stage approval or workflow
routing (a "status," "stage," or "current approver" field referenced across several views'
visibility rules). Multi-stage approval forms are common in this migration set — call out the
full stage sequence (who approves after whom) as its own subsection, since it becomes the
Canvas app's state machine.
- **Lookup connections** — every non-`schema*.xsd` schema: source name + columns used.
- **Views** — section headings and field ordering from the XSL views; note multiple views and,
for routed forms, which view/section is visible at which stage.
- **Section recommendation** — propose logical sections of 10–30 fields each for Canvas.

After the agent returns, surface counts (fields / rules / connections / sections / stages) and continue to Phase 3 — don't ask the mock-vs-real or aesthetic questions yet; those come after verification, once the inventory is known to be accurate.

---

## Phase 3 — Verify

[#phase-3--verify](#phase-3--verify)

**XSLT-derived views are frequently wrong in specific, non-obvious ways** — a section heading
gets misread as a field, a field is missed entirely because it's conditionally rendered, or a
label doesn't match the underlying field name (e.g. a "Trade Volume" label over an
`ExpectedVolume` field). Do not treat the Phase 2 inventory as final.

1. Ask the user for InfoPath Designer screenshots of each view (or ask them to open the form
   in InfoPath/InfoPath Filler and screenshot each screen/stage). This is the single most
   effective accuracy check available and is **preferred** — prioritize getting real
   screenshots over re-parsing the XSLT more carefully.
2. **If screenshots are provided**, cross-check every field, section header, and approval-role
   label in the inventory against them. Correct mismatches directly in
   `infopath-inventory.md` and note what changed (e.g. "Team" was a section header, not a
   field; found an undocumented field the XSLT extraction missed; two similarly-named approval
   roles are actually distinct fields). Mark the inventory **screenshot-verified**.
3. **If screenshots aren't available or practical** (e.g. running this across a large batch of
   forms), don't block on them. Instead:
   - Re-check the Phase 2 inventory against the raw XSLT views a second time, specifically
     hunting for the failure modes above (misread section headings, conditionally-rendered
     fields, label/field-name mismatches).
   - Mark the inventory **XSLT-only, not screenshot-verified**, and add a "Needs manual
     verification" subsection to `infopath-inventory.md` listing every field, section, and
     rule where confidence is low (ambiguous labels, deeply nested conditional visibility,
     anything the XSLT structure made a judgment call on).
   - Carry this confidence flag forward into `canvas-app-prompt.md` (Phase 4) and the
     migration log (Phase 6), so it's visible to whoever reviews or accepts the generated app,
     and so the form can be prioritized for a screenshot pass later if one becomes available.
4. Only after this pass, ask the user:
   1. Mock with collections in `App.OnStart` (default), or wire to real SharePoint?
   2. Keep all sections, or drop any?
   3. Aesthetic preferences? (default: clean professional)
   4. Is this migration expected to move across environments (dev/test/prod ALM), or is it a
      one-off / single-environment build (e.g. a POC)? This decides whether Phase 5
      (Environment Variables) runs.

Wait for answers.

**If the user wants to wire to real SharePoint**, and they haven't already connected a
coauthoring session (Phase 0), do it now — Canvas can't bind to a connection that doesn't
exist in the app. Tell them the steps (Power Apps Studio → Data → Add data → SharePoint → pick
site/list) and that this skill can verify the schema once it's done.

When they confirm, call `mcp__canvas-authoring__connect` if no session is active yet, then
`mcp__canvas-authoring__list_data_sources` to see what's connected, then
`mcp__canvas-authoring__get_data_source_schema` for each list. Diff against the verified
inventory: every InfoPath field should map to a SharePoint column of compatible type. Report
any **missing columns**, **type mismatches** (e.g. InfoPath Date vs. SP Text), or
**extra-required columns** the form doesn't populate. Pause and let the user reconcile
(rename columns, add missing ones, or trim the inventory) before Phase 4.

---

## Phase 4 — Hand off to `/canvas-app`

[#phase-4--hand-off-to-canvas-app](#phase-4--hand-off-to-canvas-app)

Write `canvas-app-prompt.md` containing:

- The kept sections + field lists with type hints (call out dates, multi-choice, rich text).
- Each InfoPath rule restated as the desired Canvas behavior in plain English (the `/canvas-app`
  skill's discovery/design agents map this to Power Fx).
- The routing/state-machine sequence from Phase 2, restated as a screen-visibility or
  status-gated navigation plan (e.g. "Screen X is only reachable when Status = 'Pending Local
  Ops Review'"), since Canvas has no native equivalent of InfoPath's per-view `xsf` rules.
- Mock-data plan if mocking: 3–5 sample records per section, plus choice-list collections
seeded from enumerations / lookup tables.
- The user's aesthetic answer.
- Validation should **block** submit (`DisplayMode.Disabled` on Save buttons) — an intentional
upgrade from InfoPath's flag-but-don't-block behavior; flag this as a deliberate change.

Then invoke `/canvas-app` via the `Skill` tool, passing `canvas-app-prompt.md` as the
generation requirements (`/canvas-app` auto-detects create-vs-edit from the current app state,
runs its own discovery phase against `list_controls` / `list_apis` / `list_data_sources`,
produces an app plan for approval, then fans out `canvas-screen-editor` builder agents per
screen in parallel and validates the result with `compile_canvas`). If `/canvas-app` isn't
available, instruct the user to install `canvas-apps@power-platform-skills` (see Phase 0) and
then run `/canvas-app` against `canvas-app-prompt.md` directly.

---

## Phase 5 — Environment Variables (Optional)

[#phase-5--environment-variables-optional](#phase-5--environment-variables-optional)

This phase is **optional** and only runs if the user indicated in Phase 3 that this migration
will move across environments (dev/test/prod ALM) rather than staying a one-off or
single-environment build.

- **If the migration is a POC / single-environment build**: skip this phase. Bind the app's
  data sources directly (real connection or mocked collections, per the Phase 3 answer) and
  say plainly in the migration log (Phase 6) that environment variables were skipped and why,
  so it's an explicit, visible decision rather than a silent gap — not a blocker to revisit
  unless the app later needs to be promoted across environments.
- **If the migration is expected to move across environments**, proceed as follows. Once the
  app is wired to real data sources (or is about to be — this is easiest to set up right after
  `/canvas-app` creates the data-source connections), do **not** leave the SharePoint site URL,
  list name/GUID, environment ID, or any other connection detail hardcoded into the `.pa.yaml`.
  Hardcoded values tie the generated app to whichever environment it happened to be built
  against and break the moment it's promoted from dev to test to prod.

  1. For each data source identified in Phase 3's diff, define a Dataverse **environment
     variable** per connection detail that changes across environments (typically: site URL,
     list name, and — if the app calls a Flow/connector — the connection reference). Use clear,
     consistent naming, e.g. `envvar_ClientBespokeProcess_SiteUrl`,
     `envvar_ClientBespokeProcess_ListName`.
  2. Reference the environment variable's current value in the app's `App.OnStart` (or
     wherever the data source is bound) instead of a literal string — e.g.
     `SharePointSiteUrl: Environment.EnvironmentVariable("envvar_ClientBespokeProcess_SiteUrl")`
     — rather than the raw URL.
  3. Record each environment variable's schema name, purpose, and per-environment values
     (dev/test/prod) in `canvas-app-prompt.md` (or a companion `environment-variables.md`) so
     they can be set as part of solution deployment rather than rediscovered later.
  4. If the target environment doesn't yet have Dataverse environment variables
     enabled/available, flag this to the user before proceeding — don't silently fall back to
     hardcoded values.

---

## Phase 6 — Export Migration Log

[#phase-6--export-migration-log](#phase-6--export-migration-log)

Every time this skill is run against a particular `.xsn`, write (or update, on a re-run)
`<form-name>-migration-log.md` alongside the extracted form, dated at the top. Capture:

- Source `.xsn` path/name and extraction date.
- Inventory summary (field / rule / connection / section / stage counts from Phase 2).
- Phase 3 verification method and confidence: whether the inventory is
  **screenshot-verified** or **XSLT-only**, every correction made if screenshots were used
  (what the screenshots caught that the XSLT extraction got wrong), and — if screenshots
  weren't available — the full "Needs manual verification" list carried over from
  `infopath-inventory.md`, so future re-runs, audits, or a later screenshot pass don't have to
  rediscover which areas are still unconfirmed.
- The decisions captured before handoff: mock vs. real SharePoint, sections kept/dropped,
  aesthetic direction, and whether this migration is ALM (dev/test/prod) or single-environment.
- Phase 5 outcome: either the environment variables defined and what they point to, or an
  explicit note that Phase 5 was skipped (single-environment/POC) and why.
- The outcome of the `/canvas-app` handoff: app name/location, whether `compile_canvas`
  passed cleanly or needed fixes, and any deliberate behavior changes from InfoPath (e.g. the
  block-on-submit validation change).

This log is the artifact to hand to a customer or reviewer as evidence of what changed and
why — write it in plain language, not as a raw dump of the phase outputs.
