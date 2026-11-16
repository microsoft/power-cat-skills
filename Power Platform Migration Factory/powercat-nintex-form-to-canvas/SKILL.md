---
name: powercat-nintex-form-to-canvas
version: 1.0.0
description: Migrate a Nintex form (Nintex Forms for SharePoint 2010-2019, Office 365 classic .nfp packages, the SharePoint Online New Responsive Designer, or Nintex Automation Cloud) to a Power Apps Canvas app. USE WHEN the user wants to convert, port, rebuild, or migrate a Nintex form to Canvas Apps, inventory a Nintex form export, or asks for help moving off of Nintex Forms. Not for Nintex workflows or approvals, and not for InfoPath forms (use infopath-to-canvas).
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, PowerShell, Agent, TaskCreate, TaskUpdate, TaskList, Skill, EnterPlanMode, ExitPlanMode
---

# Migrate a Nintex Form to a Canvas App

Migrate the Nintex form described below:

$ARGUMENTS

A Nintex export is a classic **`.nfp` package** (a ZIP of `Manifest.xml` + `Form\Form*.xml`), a single
**XML** file (SharePoint 2010–2019), a SharePoint Online **New Responsive Designer JSON**
(`rows[].controls[].widget`, `ruleGroups`, `variableContext`) or a **Nintex Automation Cloud** form
JSON — and none of them names the SharePoint list the form saves to. This skill runs six phases:
**extract → inventory → verify → hand off to `/canvas-app` → configure environment variables
(optional) → export migration log**. It stops for the user three times: setup questions (Phase 0),
approval of the verified inventory and open decisions (Phase 3), and approval of
`canvas-app-prompt.md` before anything is built (Phase 4). Track the phases with TaskCreate/TaskUpdate.

> **Out of scope:** Nintex workflows, approvals, notifications, task forms and Power Automate flows
> are not discovered, analyzed or migrated. Status fields are kept only as drivers of visibility.

---

## Phase 0 — Prerequisites

[#phase-0--prerequisites](#phase-0--prerequisites)

1. **Plugins installed.** This skill depends on `canvas-apps@power-platform-skills` for the actual
   app generation. If `mcp__canvas-authoring__*` tools aren't available, tell the user to run:
   ```
   /plugin marketplace add microsoft/power-platform-skills
   /plugin install canvas-apps@power-platform-skills
   /plugin marketplace add microsoft/power-cat-skills
   /plugin install powercat-canvas-apps@power-cat-skills
   ```
2. **Coauthoring session connected.** For a real-SharePoint build, have the user run
   `/configure-canvas-mcp` (or: open the target app in Power Apps Studio, enable Settings → Updates →
   Coauthoring, copy the Studio URL, keep the tab open) **before** Phase 3, so the schema check has
   something to read. Phases 1–2 can run meanwhile; a mock-only build can wait.
3. **Setup questions — ask once, in one message.** Unanswered items take the default:
   1. **Primary SharePoint list or library URL.** Exports don't contain it; never guess it from the
      file name. None → the binding is **Blocked**, data is mocked and the build is a **PROTOTYPE**.
   2. **Screenshots** of the live form: New before anything is chosen, New after each value of the
      main choice field, Edit, Display, and role- or status-specific states. Default: none
      (export-only verification in Phase 3).
   3. **Data:** real SharePoint (default when a URL is given) or mock collections.
   4. **Fidelity:** functional with modernization (default — responsive containers, modern
      controls, Fluent styling, inline validation, WCAG 2.1 AA), visual fidelity, or redesign.
   5. **ALM:** will the app move across dev/test/prod, or is it a POC / single environment
      (default)? This decides Phase 5.
   6. A folder with several exports: which one to migrate.

   An inventory-only request ("analyze this Nintex export") skips the questions: run Phases 1–2,
   report the counts and findings, and offer to continue.

---

## Phase 1 — Extract

[#phase-1--extract](#phase-1--extract)

From `$ARGUMENTS`, resolve the export; for a folder, `Glob` for `*.nfp`, `*.xml`, `*.json` and
`*.zip` and ask if there are several or none. Drop exact duplicates by SHA-256 (`sha256sum` /
`Get-FileHash`). If two exports bind mostly the same columns (one form per site), recommend **one
Canvas app parameterised by site** and ask which export is the baseline.

**Never modify, move or rename the original.** Record its SHA-256 and work in
`<source_dir>/nintex_extracted/<form-slug>/` (**W**), with the export extracted to `W/source/`
(reuse it if the hash matches).

Identify the format **by content, never by extension**: first bytes `PK` = ZIP, `<` = XML, `{` = JSON.

- **ZIP** (`.nfp`, `.zip`) — list the members first and refuse absolute paths or `..`.
  - **Windows**: `tar -xf "<export>" -C "<W>\source"` via PowerShell (`tar.exe` reads a ZIP whatever
    its extension; `Expand-Archive` needs a `.zip` copy).
  - **macOS / Linux**: `unzip -o "<export>" -d "<W>/source"`, then turn the classic backslash member
    names (`Form\FormControls.xml`) into folders:
    `cd "<W>/source" && for f in *\\*; do [ -e "$f" ] || continue; mkdir -p "$(dirname "${f//\\//}")" && mv "$f" "${f//\\//}"; done`
- **XML / JSON** — copy into `W/source/`; if a JSON wrapper's `FormXml` / `formDefinition` holds
  base64 or escaped XML, also decode it to `W/source/form.xml`.
- **Unreadable** (0 bytes, truncated ZIP, invalid JSON) — stop and ask the user to let
  OneDrive/SharePoint finish syncing or to download the export again.

Verify the signature (**Detection** below) and abort if nothing matches; a classic package needs
`Manifest.xml`, `Form/FormSettings.xml` and `Form/FormControls.xml`. Write `W/source-manifest.md`:
file, SHA-256, extraction date, product, designer, version, form type, hosting and format.
FormSettings `Version` **101.x** = Nintex Forms for Office 365; `1.x` / `2.x` / `4.x` / `5.x` =
SharePoint 2010 / 2013 / 2016 / 2019 on-premises (*inferred — verify*); anything else = unknown.
**Never claim on-premises without evidence.** **Task forms** are workflow-owned: record them and stop.
**Start forms** migrate as forms; the workflow they start is out of scope. `FormType` `Global` = the
default form for every content type of the list.

---

## Phase 2 — Inventory

[#phase-2--inventory](#phase-2--inventory)

Spawn a general-purpose `Agent` — give it W, the format, the list URL and the **Nintex export
reference** section — to write `W/nintex-form-inventory.md` covering:

- **Data** — the primary list (or **Blocked — unknown**); bound columns by SharePoint **internal
  name** as exported (decode `_x0020_`=space, `_x0028_`=`(`, `_x0029_`=`)`, `_x002d_`=`-`,
  `_x0023_`=`#`, `_x0026_`=`&`, `_x003f_`=`?` for reading only — never rename); the attachments
  control counted apart from bound fields.
- **Controls** — id, name, type, label, bound column, required, default, validation,
  visible / read-only, section / tab, confidence. Classic labels are separate controls: pair each by
  its `AssociatedControl` first, by position (same row, to the left) only when unlinked; a label
  beside one control but linked to another is a `label_association_conflict`, and other text on the
  row is help text. A data-entry control with no binding saves nothing (`unsaved_data_control` — an
  owner decision, never dropped silently). `Task:` DataFields are workflow bindings, out of scope.
- **Lookups, per control** (never merged per list) — source site and list, show column, bound
  column, static filter or cascading parent, and **storage**: *text* (evidence:
  `connectedToManagedFields` contains `maxLength`), *lookup*, or *unknown* until the schema read —
  never inferred from a column name.
- **Calculations and form variables** — each expression with `{Control:<id>}` / `[Form].[X]`
  resolved to control names, its Power Fx intent, lists named only inside `lookup()` (Low — display
  name only) and dead variables.
- **Rules** — name, kind (hide / disable / set value / validation), enabled, condition in plain
  English, targets, original expression, confidence. **Resolve references and targets by control id,
  never by title** — titles repeat (a label "Area" next to a lookup "Area").
- **State matrix** — the controlling field is the choice or yes/no field most conditions test.
  States: **"(blank)"** first (the New form before it is chosen), then each value. Per control and
  state apply static properties → property formulas → enabled rules, and record visible / required /
  auto-filled. Two enabled rules setting opposite values in one state → **`conflict`**
  (`rule_conflict`); never pick a winner by rule order.
- **Sections, tabs, repeating sections** — repeater storage (*XML in a multiline column*, *JSON*,
  *child list* or *unknown*) and min/max rows; classic forms without panels get sections inferred
  from Line controls and heading labels (`sections_inferred`).
- **Custom JavaScript / CSS** — describe the intent; never run it.
- **Design language** — colors, fonts, sizes, spacing, label position, buttons, validation style. A
  responsive export without `theme` uses the Nintex defaults (Open Sans; highlight `#006BD6`, border
  `#898F94`, error `#C23934`, page `#EFF0F0`) — flag them as a fallback (`theme_missing`).
- **Consistency findings** — every check in the reference that fires, with severity, evidence and
  proposed handling. They are facts about the Nintex form, not extraction errors.
- **Confidence** per control, rule, lookup and section: **High** (found with type and binding;
  unambiguous or screenshot-confirmed) · **Medium** (one element inferred, e.g. a list known by name
  only) · **Low** (mostly inferred, or contradicted by a screenshot) · **Blocked** (needs a decision or
  a missing source — unknown list, JS-only behavior, SQL / Web Request controls, unknown repeater
  storage).
- **Section recommendation** — logical Canvas sections of 10–30 fields — and the **out-of-scope**
  elements detected (workflow, task, approval).

After the agent returns, surface counts (controls / bound fields + attachments / lookups / rules /
variables / findings by severity / Low + Blocked) and continue to Phase 3 — decisions come after
verification, once the inventory is known to be accurate.

---

## Phase 3 — Verify

[#phase-3--verify](#phase-3--verify)

**Export-derived inventories are wrong in specific, non-obvious ways** — a label paired with the wrong
control, a Line or heading misread as a section, a control hidden by a rule missed, two controls
sharing a title, a "lookup" that really writes text. Do not treat the Phase 2 inventory as final.

1. **With screenshots** (preferred): match each state's visible labels, controls, sections and
   buttons to the inventory (classic: `AssociatedControl` first). Correct `nintex-form-inventory.md`
   and note each change; log anything on screen but not in the export as a gap (never invent it);
   take the screenshot's value for any `conflict` cell; adjust confidence. Mark it
   **screenshot-verified**.
2. **Without screenshots**, don't block: re-check the inventory against the raw export for the
   failure modes above, mark it **export-only, not screenshot-verified**, cap UI-only items at Medium,
   and add a **Needs manual verification** list. Carry the flag into `canvas-app-prompt.md` and the
   migration log. A waiver never settles a `rule_conflict` — the owner states the intended value.
3. **SharePoint schema** (real data only). Canvas can't bind to a list the app doesn't have: connect
   the session if needed (Phase 0) and have the user add the primary and every lookup list (Studio →
   Data → Add data → SharePoint). Call `mcp__canvas-authoring__connect` if no session is active,
   `mcp__canvas-authoring__list_data_sources`, then `mcp__canvas-authoring__get_data_source_schema`
   per list. Diff by internal name: **missing columns**, **type mismatches** (e.g. date-time vs
   date-only), **columns required in SharePoint but not on the form**, **lookup storage** (text vs
   lookup column) and repeater storage. Record each column's **display name** — Power Fx uses it.
   Never change SharePoint; schema changes are ▲ recommendations. If the schema can't be read,
   storage-dependent items stay Low.
4. **Completeness gate.** PASS needs: the hash recorded; the primary list known; every control typed,
   with a confidence and a binding or an explicit "unbound" decision; every lookup resolved to a
   list; every repeater's storage known; no Blocked business-critical item (required binding,
   validation rule, lookup, repeater storage, data-changing JavaScript); the New form verified or
   screenshots waived; no unresolved high-severity finding. Otherwise the build is a **PROTOTYPE**: it
   can still be built, but every output is titled PROTOTYPE with its reasons and the app is never
   called production-ready.
5. **Discovery summary.** Write `W/migration-summary.md` and present it: the form's purpose and user
   journey (*inferred* if the user didn't say), what was extracted, the lists (display name,
   internal name, type, required; the cascade chain), findings with proposed handling, the proposed
   screen → container → control tree, and deliberate changes.
6. **Pause and ask, in one message:** approve the inventory; choose the handling of each open
   decision — `rule_conflict` (screenshot or intended value), `unsaved_data_control` /
   `unbound_duplicate_control` (bind a column, keep unsaved, or drop the row),
   `label_association_conflict`, lookup storage, repeater storage (child list — recommended — JSON in
   the column, or Dataverse), `column_bound_twice`; the sections to keep or drop; how to reconcile
   each schema difference. Wait for answers, record them (with the Phase 0 answers) in
   `W/migration-decisions.md`, and re-check the gate.

---

## Phase 4 — Hand off to `/canvas-app`

[#phase-4--hand-off-to-canvas-app](#phase-4--hand-off-to-canvas-app)

Write `W/canvas-app-prompt.md` (titled **PROTOTYPE** while the gate fails) containing:

- **Header** — form, target app, data (site and lists, or mock), fidelity, ALM, the verification flag
  with the Needs-manual-verification list, and the PROTOTYPE reasons.
- **Screens** — the kept sections as responsive containers (a vertical scrolling container per
  screen, a vertical container per label + input, horizontal rows that wrap on narrow screens).
- **Controls** — `# | Nintex control (id) | Canvas name | Canvas control | Column (display name) |
  Items / Default / Visible / Required / DisplayMode / OnChange`, per the mapping below; one Combo box
  per Nintex lookup control.
- **Rules** — Nintex expression → Power Fx → target. `Visible` / `Required` come from the state
  matrix ("(blank)" first, confirmed conflict values), not rule by rule; disabled rules are dropped.
- **Data** — sources by display name, lookup storage and cascade formulas, people pickers over
  Office 365 Users, the repeating-section plan. When mocking: 3–5 sample rows per list and choice
  collections in `App.OnStart`, plus a mock column → SharePoint display-name map for rebinding later.
- **Save** — use display names in `Patch` records and handle `Patch` errors with
  `IfError(…, Notify(…))`. For `SubmitForm`, surface the form's `Error` in `OnFailure`; put success
  notifications, resets and navigation in `OnSuccess` only. An `IfError` wrapper is not a substitute
  for the form's completion events. On failure, retain the user's edits and show the error.
  Cancel → reset + `Back()`. Validation **blocks** submit (Save disabled until valid, messages
  inline) — an intentional upgrade from Nintex's submit-time validation; flag it as a deliberate
  change. Before reporting save behavior as verified, test a successful save and read-back and a
  rejected save with a visible error; compilation alone does not verify either outcome.
- **Design tokens**, **deliberate changes**, and **assumptions** with the default taken for each.

**Pause** for explicit approval of `canvas-app-prompt.md`. Nothing is written to the app before it;
any change is shown and approved again.

Then invoke `/canvas-app` via the `Skill` tool, passing `canvas-app-prompt.md` as the generation
requirements (`/canvas-app` auto-detects create vs. edit, runs its own discovery against
`list_controls` / `list_apis` / `list_data_sources`, produces an app plan for approval, then fans out
`canvas-screen-editor` builder agents per screen and validates with `compile_canvas`). **Reject any
app plan that departs from the approved prompt** unless the user agrees. Drive it to a clean
`compile_canvas`; a fix that changes behavior (visibility, required, saved values, layout) goes back
to the user first.

- **No `/canvas-app`, but the Canvas Authoring MCP is connected:** build directly — `sync_canvas`
  (read-only pull), `describe_control` for every control type used, write `.pa.yaml` per the
  approved prompt, then `compile_canvas` until clean.
- **Neither:** have the user install the plugins (Phase 0) and run `/canvas-app` against
  `canvas-app-prompt.md`. If they can't, offer paste-ready YAML: one `<Screen>.pa.yaml` per screen for
  Studio code view, plus `App.Formulas.fx` for the App object's **Formulas** property (code view can't
  paste the App object). They add the data sources first, paste, and send back every **App checker**
  error; never call the app clean until they confirm.

---

## Phase 5 — Environment Variables (Optional)

[#phase-5--environment-variables-optional](#phase-5--environment-variables-optional)

Runs only if the user said in Phase 0 that the app will move across environments (dev/test/prod).

- **POC / single environment:** skip it. Bind the data sources directly and say plainly in the
  migration log that environment variables were skipped and why.
- **ALM:** build inside a **solution** and hardcode no site URL, list name or GUID, or other
  environment-specific value.
  1. **Site and lists → data source environment variables.** Create them in the solution (type *Data
     source*, connector SharePoint, parameter *Site* or *List*) and add the SharePoint data source
     from the solution-aware app through the **Advanced** tab — or first turn on *Settings → General
     → Automatically create environment variables when adding data sources*. A list variable holds
     the list **GUID**. Data sources added before that must be removed and re-added.
  2. **Environment-specific values in formulas** (site codes in lookup filters —
     `hard_coded_filter_literal` — and URLs): create a solution environment variable per value and
     use a supported retrieval path that reads its current value when present, otherwise the
     definition's default value. Confirm the required permissions and licensing before choosing
     that path. If neither value is configured, surface the missing setting and block the
     operations that depend on it. `App.Formulas` may expose retrieved settings or constants that
     are explicitly identical across environments; a literal named formula is not a substitute
     for environment configuration and cannot be overridden at solution import.
  3. Record each variable's schema name (e.g. `<prefix>_SteamTrapEvents_SiteUrl`), purpose and
     dev/test/prod values in `W/environment-variables.md`, so they're set at solution import.
  4. **Never** use `Environment.EnvironmentVariable(...)` (it isn't a Power Fx function) or a flow to
     fetch configuration. If the environment can't use environment variables, say so before going
     on — don't silently fall back to hardcoded values.

  Re-run `compile_canvas` afterwards.

---

## Phase 6 — Export Migration Log

[#phase-6--export-migration-log](#phase-6--export-migration-log)

Every run writes (or, on a re-run, updates) `W/<form-slug>-migration-log.md`, dated at the top:

- Source export, product / designer / version, form type, SHA-256 and extraction date — and that the
  original was not changed.
- Inventory counts and confidence (High / Medium / Low / Blocked).
- Verification: **screenshot-verified**, with every correction the screenshots caught, or
  **export-only**, with the full Needs-manual-verification list, so a later pass needn't rediscover it.
- Decisions: the Phase 0 answers; finding handling, sections kept or dropped and schema
  reconciliation (Phase 3); who approved `canvas-app-prompt.md` and when.
- The schema-diff outcome, or "not checked (mock data)"; the Phase 5 outcome, or that it was skipped
  and why.
- The `/canvas-app` outcome: app name/location, the `compile_canvas` result (or the App checker
  result the user reported) and deliberate changes from Nintex (e.g. block-on-submit validation).
- **PROTOTYPE** status with every open item, and the out-of-scope note.

This log is the artifact to hand to a customer or reviewer as evidence of what changed and why —
write it in plain language, not as a raw dump of the phase outputs.

---

## Nintex export reference

[#nintex-export-reference](#nintex-export-reference)

### Detection

| Content signature | Format → product |
|---|---|
| ZIP with `Manifest.xml` + `Form\FormSettings.xml` | Classic `.nfp` package; product from FormSettings `Version` |
| Any other ZIP | Packaged export — look inside for `*.xml`, `*.json`, `FormXml` |
| XML with `<FormVariations`, `<FormControls` or `FormControlProperties` | SharePoint 2010–2019 classic designer (assembly `Nintex.Forms…, Version=14/15/16` = 2010/2013/2016; `SharePoint2019` = 2019) |
| XML with `<ResponsiveForm`, `IsResponsive="true"` or `RFControl` | Responsive designer (on-premises 2016/2019 or Office 365) |
| JSON with `FormXml` / `formDefinition` (base64 or XML string) | Nintex Forms for Office 365 export wrapper |
| JSON with `rows[].controls[].widget` + `ruleGroups` + `variableContext` | SharePoint Online New Responsive Designer |
| JSON with `schemaVersion` + `pages` / `elements` (or `nwc` keys) | Nintex Automation Cloud form |

Absolute `Top/Left/Width/Height` per control = classic designer; a row/column grid = responsive.
Layout variations (Desktop / Tablet / Phone) are inventoried separately; Desktop is primary.

### Classic `.nfp` package (also on-premises classic XML)

| File | What to read |
|---|---|
| `Manifest.xml` | Member list (Nintex-internal hashes; integrity = SHA-256 of the whole package) |
| `Form/FormSettings.xml` | `Version`, `IsResponsive`, `FormType` (`ListForm`, `Global`, …), `CssUrls` / `ScriptUrls` |
| `Form/FormControls.xml` | One `FormControlProperties` per control; type from `i:type` with any `a:` prefix stripped (`TextBox`, `MultiLineTextBox`, `Choice`, `Boolean`, `DateTime`, `SharePointLookup`, `PeoplePicker`, `Attachment`, `Calculation`, `Repeater`, `Panel`, `Label`, `Html`, `Image`, `Line`, `Button`) |
| `Form/FormLayouts.xml` | `FormLayout` per device → nested `FormControlLayout` (`Left/Top/Width/Height`, relative to the parent) → panel and repeater membership |
| `Form/FormRules.xml` | `Rule`: `ControlIds/a:string` (targets), `ExpressionValue` (condition with `{Control:<id>}` tokens), `RuleType` (Formatting / Validation), `Hide`, `Disable`, `SetValue` + `SetValueExpressionValue`, `ValidationMessage`, `IsDisabled`, `Title` |
| `FormStyles.xml` · `FormScripts.xml` · `FormUserVariables.xml` | CSS tokens · custom JavaScript · form variables |

Control elements: `UniqueId` (the id rules use), `Name`, `DisplayName`, `DataField` = `List:<internal
name>` (`Task:<name>` = workflow, out of scope), `DataFieldDisplayName`, `IsRequired`, `IsVisible`,
`IsEnabled`, `ControlMode`, `DefaultValue` + `DefaultValueSource` (`Expression`, e.g.
`{Common:CurrentUserDisplayName}`), `Choices/a:string` + `DisplayFormat`, `DateOnly`, `MaxLength`,
`Formula` + `RecalculateOnNew/Edit/View`, `LookupList` / `LookupField` / `LookupWeb` (blank = same
site), `FilterFieldInternalFieldName` + `CascadeFilterValue` (static filter), `CascadeFilterControlId`
(cascade parent; all-zero GUID = none), `MinimumRows` / `MaximumRows` / `AddLinkText` (repeater),
`MaximumAttachments`, `AssociatedControl` (label → control link), `InRepeater`. Text is often
HTML-encoded twice; decode before reading.

### SharePoint Online New Responsive Designer JSON

| Element | Where / notes |
|---|---|
| Controls | `rows[].controls[]`: `id`, `widget` (`textbox`, `multilinetext`, `choice`, `list-lookup`, `datetime`, `number`, `boolean`, `file-upload`, `richtext-label`, `image`, `actionpanel`), `sourceVariable.displayName`, `properties`; layout from `rows[].sizes[]` (12-column spans) and `rows[].pageName` |
| Binding | `properties.connectedVariableId` = internal name; empty = unbound; `file-upload` = attachments (`maxLength` = max files) |
| Required / visible / readOnly | `true` / `false`, `{"$ref":"formula","raw":"ifElse(…)"}` or `{"$ref":"variable","variableId":"<controlId>"}` |
| Choices | `properties.items` = `"value\|label"` lines |
| Column-type evidence | `properties.connectedToManagedFields`: `maxLength` → text, `items` → choice, `showDateOnly` → date, `decimalPlaces` → number |
| List lookup | `sourceSite`, `sourceList` (`GUID;#ListName`), `sourceListColumn` (show column), `filterByColumn` + `filterByValue` (a variable ref = cascading), `valueToStore` |
| Labels | `properties.text` HTML with pills `{{__ff.{"id":…}}}` (control) and `{{__udv.{"id":…}}}` (variable) |
| Form variables | `variableContext.variables[]`: `displayName`, `formula.raw`, `formModes`; `lookup("List","MatchCol",expr,"ReturnCol")` names a list by display name only |
| Rules | `ruleGroups[].rules[]`: `name`, `isEnabled`, `where` (`ruleOperator` 1 = AND, 2 = OR; nested `conditions[]` with `code` such as `text-is-equals`, `identifier`, `value`), `thens[]` / `elseThens[]` (`identifier`, `property` visible / required / value, `value`) |
| Theme, buttons, settings | `theme.styles` (`fontFamily`, `color{…}`, `textSize`); `actionpanel` button texts; `settings.TimeZone` |

One definition serves New, Edit and Display; mode differences come from `formModes`.

### Nintex Automation Cloud JSON

Walk `pages[].elements[]` (nested `elements` = sections): `type`, `label`, `internalName`,
`required`, `default`, `validation`, lookup settings; plus `dataSource`, `theme`, `customCss` /
`customJs` and `rules[]`. Shapes vary by version — inventory what is present and lower the
confidence of anything inferred. A `task` form type is out of scope.

### Control mapping (modern controls in responsive containers)

| Nintex (classic type / responsive widget) | Canvas control | Notes |
|---|---|---|
| Single line textbox / `textbox` | Text input | `MaxLength` from the column; read-only → `DisplayMode.View` |
| Multi line textbox / `multilinetext` | Text input, `Type = TextInputType.Multiline`; rich text → Rich text editor | |
| Choice drop-down / `choice` | Dropdown (≤ 50 values) or searchable Combo box (> 50; suggest a reference list) | `Items = Choices([@'<List>'].'<Column>')` |
| Choice radio / checkboxes | Radio (2–7 options) / multi-select Combo box | |
| Yes/No / `boolean` | Toggle or Checkbox | |
| Date/Time / `datetime` | Date picker (+ time only if it matters) | `DateOnly` / `showDateOnly` → date only |
| Number, Currency / `number` | Number input | decimals → `Text(x, "0.00")` |
| People picker | Combo box over Office 365 Users | `Office365Users.SearchUserV2({searchTerm: Self.SearchText}).value` |
| List lookup / `list-lookup` | Combo box over the lookup list, one per Nintex control | formulas depend on storage (below) |
| Attachments / `file-upload` | Attachments control in an Edit form card | |
| Label, Html / `richtext-label` | Text / HTML text | replace pills with control or variable values |
| Panel, tabs, Line | Container; Tab list + containers; a container boundary | a panel rule → container `Visible` |
| Repeating section | Gallery + collection or child list | see Repeating sections |
| Calculated value | Text (display) or a value in the `Patch` record | translate the expression |
| Save / Submit / Cancel | Button → `Patch` / `SubmitForm`; reset + `Back()` | a button that starts a workflow keeps only the save |
| Managed metadata | Combo box over `Choices()` | Medium |
| SQL Request, Web Request, List Item, JS-only controls | — | **Blocked** until a connector or approach is decided |

Modern control types and properties — confirm with `describe_control`; never guess:

| Control | YAML `Control:` | Read the value | Initial value |
|---|---|---|---|
| Container | `GroupContainer` (Variant `AutoLayout`) | — | — |
| Text / Text input | `ModernText` / `ModernTextInput` | `.Text` | `Text` / `Default` |
| Number input | `ModernNumberInput` | `.Value` | `Default` |
| Dropdown / Radio | `ModernDropdown` / `ModernRadio` | `.Selected` | `Default` (an item from `Items`) |
| Combo box | `ModernCombobox` | `.Selected` / `.SelectedItems` | `DefaultSelectedItems`; set `SelectMultiple` explicitly |
| Date picker | `ModernDatePicker` | `.SelectedDate` | `DefaultDate` (no `Required`; use `ValidationState`) |
| Toggle / Checkbox | `ModernToggle` / `ModernCheckbox` (verify the identifier) | `.Checked` | `Checked` |
| Button | `ModernButton` | — | — |

Gallery, Edit form, Attachments and Image keep their classic identifiers. In `.pa.yaml` every property
value starts with `=`; use a multi-line `|-` block when a formula contains `#` or `:`.

### Rules and expressions → Power Fx

Reference SharePoint columns by **display name** in Power Fx (`Patch` records, `ThisItem`, `Filter` /
`LookUp`, `Choices`). Internal names (`Needs_x0020_Work_x0020_Order_x00`) only match the export to
the schema.

| Nintex | Power Fx |
|---|---|
| Formatting rule — Hide / Disable | `Visible = Not(<condition>)` / `DisplayMode = If(<condition>, DisplayMode.Disabled, DisplayMode.Edit)` |
| Validation rule + message | inline message + `ValidationState`; the same guard disables Save. `isNullOrEmpty({Control:Self})` = required |
| Set value, calculated value, default | the control's initial value or the `Patch` record; defaults only in New mode: `If(frmMain.Mode = FormMode.New, <default>, ThisItem.<Column>)` |
| `{Common:IsNewMode}` / `IsEditMode` / `IsDisplayMode` | `frmMain.Mode = FormMode.New` / `FormMode.Edit` / `FormMode.View` (or a screen-mode variable) |
| `{Common:CurrentUserDisplayName}` / `CurrentUserEmail` | `User().FullName` / `User().Email` |
| `{Control:<id>}`, `[Form].[X]` | `.Selected.Value` (choice), `.Text` (text), `.Value` (number), `.Checked` (yes/no), `.SelectedDate` (date) |
| `isNullOrEmpty`, `not`, `==`, `!=`, `contains(t, s)`, `length` | `IsBlank`, `Not`, `=`, `<>`, `s in t`, `Len` / `CountRows` |
| `formatDate(d, f)`, `dateDiffDays(a, b)` | `Text(d, f)`, `DateDiff(a, b, TimeUnit.Days)` |
| `lookup("List","MatchCol",value,"ReturnCol")` | `LookUp('List', 'Match col' = value).'Return col'`; several on one list → one `With({r: LookUp(…)}, …)` or a `Set()` in the key field's `OnChange` |
| `userProfileLookup({X}, "Prop")` | `Office365Users.UserProfileV2(<UPN or mail>).displayName` (`jobTitle`, `mail`, `department`, …) |
| SPO `ifElse(A \|\| B, true, false)` · `{Control:Self}!=0` on a lookup | `A \|\| B` · `!IsBlank(Self.Selected)` |
| `inGroup(user, group)`, role rules | needs a decided group-membership source: Medium, else Blocked |
| Disabled rule; rule without targets or action | not migrated |
| Custom JavaScript | never run; Power Fx equivalent (Medium), a component, or dropped with approval |

`LookUp` on a SharePoint text column is delegable; index the match column on lists over 5,000 items.

### Lookups, people and saving

| Bound column | Cascading child `Items` | Value written by `Patch` |
|---|---|---|
| **Text** (holds the chosen value) | `Filter('<Child list>', '<Parent col>' = cmbParent.Selected.Title)` | `Area: cmbArea.Selected.Title` |
| **Lookup** column | `Filter('<Child list>', '<Parent col>'.Id = cmbParent.Selected.ID)` | `Area: {Id: cmbArea.Selected.ID, Value: cmbArea.Selected.Title}` |
| Unknown | — | Low binding and a PROTOTYPE reason until the schema read decides |

`Title` stands for the lookup's show column. On a cascading child Combo box set
`AllowExternalSelectedItems` to false and reset it in the parent's `OnChange`. A choice column takes
the selected choice record (`{Value: "<choice>"}`); a person column takes
`{Claims: "i:0#.f|membership|" & Lower(<mail>), DisplayName: <name>, Email: <mail>, Department: "", JobTitle: "", Picture: ""}`.

```
Patch('Steam Trap Events', Defaults('Steam Trap Events'), {
    'Change type': drpChangeType.Selected,          // choice record
    'Needs Work Order?': tglNeedsWorkOrder.Checked,  // modern Toggle
    Area: cmbArea.Selected.Title                     // text storage, confirmed by the schema read
})
```

### Repeating sections

Nintex keeps repeater rows as **XML in a multiline column** (classic / Office 365), as JSON (NAC), or
in a child list written by a workflow. Canvas has no equivalent, so the section stays **Blocked** until
the user chooses: a **child SharePoint list** (recommended — gallery + collection; save the parent
first, then one `Patch` per row setting the parent lookup by display name), **JSON in the same
column** (`JSON()` on save, `ParseJSON()` on load), or a **Dataverse child table**. Existing XML rows
need a one-off data migration (out of scope; note it in the log). Numbered column sets
(`Add_Dist_1..7` + `_Email`) are a flat repeating group: keep them and map every column explicitly
(suffixes drift, e.g. `_Email0` vs `_Email`).

### Consistency checks

- **High** — `required_while_hidden` (make `Required` follow `Visible`) · `rule_conflict` ·
  `column_bound_twice` (e.g. a textbox and a repeater on one column) · `rule_value_not_in_choices`
  (`"Portable"` vs `Portable Unit` never matches) · `lookup_list_mismatch` (a lookup control and a
  `lookup()` calc read different lists of one family, e.g. `Approvers` vs `Approvers OLD`) ·
  `lookup_bound_to_non_lookup_column` (Low until the schema read).
- **Medium** — `unsaved_data_control` · `unbound_duplicate_control` (`field8` beside a bound
  `Field8`) · `label_association_conflict` · `label_implied_rule_missing` ("If yes…" with no rule) ·
  `hard_coded_year` (use `Year(Today())`) · `hard_coded_filter_literal` (→ Phase 5) ·
  `choice_duplicate_concepts` (`ARM` and `Armstrong`) · `choice_too_many` (> 50) ·
  `rule_expression_defect` (a token twice in a row) · `hidden_data_controls` (compute them in the
  `Patch` record) · `workflow_task_reference` (`Task:` field).
- **Low / info** — `date_time_vs_date_only` · `dead_variable` · `disabled_rule` ·
  `rule_without_effect` · `theme_missing` · `form_type_global` · `sections_inferred` ·
  `repeated_field_group` · `field_suffix_inconsistent` · `opaque_internal_name` (never rename
  internal names) · `status_field_visibility_only` (drives visibility only; the workflow is out of
  scope).

---

## Guardrails

[#guardrails](#guardrails)

- Never modify, move or rename the original export; work only in W.
- Never invent bindings, columns, lists or rules — mark them Low or Blocked and ask; never guess the
  primary list from the file name.
- Never write to the app before `canvas-app-prompt.md` is approved, or accept a `/canvas-app` plan that
  departs from it.
- Never call the app production-ready while a PROTOTYPE item or a compile / App checker error is open.
- Never create or change flows, workflows or SharePoint schema; never migrate `Task:` DataFields.
- Never settle a rule conflict or drop an unbound data control silently, and never run custom
  JavaScript from the export.
