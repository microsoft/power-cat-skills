---
name: powercat-nintex-workflow-to-power-automate
version: 1.0.0
description: Migrate one Nintex workflow (Nintex Automation Cloud export; best-effort for Nintex Workflow for SharePoint on-prem .nwf and Office 365 .nwp) to a Power Automate cloud flow. Use when the user asks to migrate, convert, rebuild, or replace a Nintex workflow in Power Automate. Not for Nintex forms (use nintex-form-to-canvas) and not for InfoPath forms (use infopath-to-canvas).
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, PowerShell, Agent, TaskCreate, TaskUpdate, TaskList, Skill, EnterPlanMode, ExitPlanMode
---

# Nintex Workflow to Power Automate

Input: $ARGUMENTS (path to a Nintex workflow export — NAC `manifest.json` + `design.json`, a folder or ZIP of them, `.nwf`, `.nwp` — or a folder of exports for batch mode).

Migrates a single Nintex workflow to a working Power Automate cloud flow in seven phases: **Prerequisites → Extract → Inventory → Verify → Generate (via FlowAgent /build-flow) → Environment Variables (optional) → Migration Log**. The output is a validated flow created **OFF** in the user's environment, not just a design document.

> **Out of scope:** Nintex forms (start and task forms) are not migrated — use `nintex-form-to-canvas`; InfoPath → `infopath-to-canvas`. The Nintex workflow itself is never disabled, deleted or edited — cut-over is the user's manual step.

Track each phase with TaskCreate/TaskUpdate. Pause where marked **PAUSE**.

> **v1.0.0:** single-file skill. Evidence parsing for **Nintex Automation Cloud** deployment packages (tested on a real export); `.nwf` / `.nwp` are parsed best-effort and labelled *inferred — verify*. All parsing is done by the agent reading the export — no bundled scripts. Use Python (stdlib) or PowerShell ad hoc when a step needs it.

---

## Phase 0: Prerequisites {#phase-0}

1. Power Automate plugin — if `/build-flow` or `mcp__flowagent__*` tools are missing, tell the user to run:
   ```
   /plugin marketplace add microsoft/power-platform-skills
   /plugin install power-automate@power-platform-skills
   ```
   then run `/setup`, restart the session and `az login` (Node 18+).
2. FlowAgent MCP — confirm `whoami`, `list_environments`, `get_operation_details`, `list_connections`, `validate_flow`, `preflight_flow`, `create_flow` are available ([FlowAgent tools](#flowagent-tools)).
3. Target — environment and solution chosen (`list_environments` / `set_current_env`); the user can create flows there.

Do not continue to Phase 4 without all three. Phases 1–3 may run while the user sets up.

## Phase 1: Extract {#phase-1}

1. Accept JSON, XML, ZIP, `.nwf`, `.nwp` or a folder. **Sniff content; never trust the extension** ([Export formats](#export-formats)):
   - **NAC** `manifest.json` (`files[].type = workflow`) + `design.json` (`workflowDefinition` is a JSON **string**) → evidence **High**.
   - `.nwf` (on-prem 2010–2019) / `.nwp` (Office 365) → *inferred — verify*. **Never claim a product or version without evidence.**
   - Nintex **form** exports → stop and point to `nintex-form-to-canvas`.
   - Corrupt, empty or still-syncing files → tell the user to wait for sync / re-export and retry; never show a traceback.
2. **Batch mode** (folder or several files): dedupe by SHA-256 (a `design.json` already covered by its manifest is not processed twice), run Phases 1–2 per workflow into `<out>/<workflow>/`, and write `batch-summary.md` (product, trigger, action count, Low/Blocked, premium, gate, PROTOTYPE reasons, top findings). Then pick ONE workflow.
3. Leave the original untouched; copy it to `nintex_extracted/`. Verify each workflow file's SHA-256 against the manifest entry; decode JSON-string fields (`workflowDefinition`, `datasources`, start-condition `value`) into `design.decoded.json` for review. Write `nintex_extracted/source-manifest.json`: product, export format, workflow id/name, hashes (+ verified flag), package source tenant/region/environment.

## Phase 2: Inventory {#phase-2}

Launch a **general-purpose Agent** that reads `design.decoded.json` and writes `workflow-inventory.json` + `nintex-workflow-inventory.md` ([Inventory contents](#inventory-contents)).

Capture:
- **Trigger:** start event, site, list (+ GUID), connection, **start condition → trigger condition** (e.g. `@equals(triggerBody()?['Submitted'], 1)`).
- **Actions:** ordered tree with path (`2.1.3`), branch labels, disabled/deprecated flags, Nintex class → PA action + operationId + confidence ([Action mapping](#action-mapping)); real parameters with Nintex expressions translated ([Expression translation](#expression-translation)).
- **Variables:** workflow / context / start-event / action-output, NAC type → PA type, used / unused, PA handling (Initialize at top level vs built-in vs `body('Action')`).
- **Connections → connection references**, premium flag ([Connections and licensing](#connections-and-licensing)).
- **Lists and columns** referenced (internal name, display, type incl. Choice / Person from the start-variable schema), **emails** (to, cc, reply-to, from, subject, body tokens), **hard-coded literals** as environment-variable candidates, **permissions**, Nintex **migration warnings**.
- **Findings** ([Findings checks](#findings-checks)).
- **Confidence:** High / Medium / Low / Blocked per trigger, action, variable, connection ([Confidence and gate](#confidence-and-completeness-gate)).

Surface counts (actions, variables, connections, lists/columns, emails, env-var candidates, findings, Low/Blocked) and continue.

## Phase 3: Verify {#phase-3}

1. Ask for evidence ([Run-history verification](#run-history-verification)): Nintex **instance history / run screenshots** (one success, one failure), **SharePoint list URL(s)** and **column internal names** on the target site, **connection accounts**, and **who receives each email** today. Reconcile into the inventory. No evidence → lower-confidence pass; list items under **Needs manual verification** in `discovery-gaps.md`.
2. Run the **completeness gate** (C1–C11) and write `discovery-gaps.md`. Fix or record every failure.
3. **Discovery summary + proposed flow (show before asking for decisions).** Write `migration-summary.html` (Nintex step → PA action diagram with confidence colours) and open it (serve over `http://127.0.0.1` if `file://` is blocked). Present in chat:
   1. **What the workflow is about** — business purpose in plain language.
   2. **What was extracted** — product/version, trigger + condition, counts.
   3. **Lists and columns**, **connections**, **emails**.
   4. **Findings to resolve** — each with proposed handling.
   5. **Proposed flow** — step-by-step mapping with confidence; deliberate changes.
   Label **PROTOTYPE** while the gate fails.
4. **PAUSE** — get approval of the verified inventory.
5. Ask, then record in `migration-decisions.md`:
   - **Fidelity:** like-for-like / **modernize** (default: trackedProperties instead of instance name + log, approvals instead of task forms, Try/Catch scopes, Top Count 1).
   - **Target environment + solution.**
   - **Connections:** existing vs new; named user vs service account; sender / shared mailbox.
   - **ALM:** environment variables (Phase 5) or single environment.
   - **After create:** leave **OFF** (default) or turn on.
   - **Cut-over:** parallel run, then the **user** disables the Nintex workflow manually.
6. Connection + schema diff: `list_connections` / `test_connection`; `list_datasets` / `list_tables` / `resolve_entity` for each list; diff by internal name (missing columns, type mismatches, Choice vs Text, required columns for Update item). **PAUSE** to reconcile.

## Phase 4: Generate via FlowAgent {#phase-4}

1. Draft `flow-definition.json` (Logic Apps workflow-definition schema): `$authentication` (SecureObject) + `$connections` (Object) parameters, embedded connection references, top-level Initialize variable, nested If / Switch / Foreach / Until / Scope. Unknowns stay `<<UNRESOLVED: …>>` — never invented.
2. Write `flow-build-prompt.md`: trigger + condition, connection references, variables, ordered actions with operationIds and expressions, error handling, chosen fidelity, **PROTOTYPE** banner + open items. **PAUSE** for approval.
3. **Build plan preview — mandatory before any create.** Read-only calls may run first (`list_flows`, `get_operation_details`, `list_connections`, `test_connection`, `list_tables`). Then write `build-plan.md` and show it in chat:
   - Target environment / solution; existing flows with the same name (never overwritten).
   - Connections + status; environment-variable values.
   - Flow outline and action table (Nintex step → PA action name, type/operationId, key inputs and expressions).
   - Validation plan, test plan (test item, tester as recipient), deliberate changes vs Nintex.
   - Assumptions and open decisions with the default chosen; the exact FlowAgent calls to be made.
   **PAUSE** — no `create_flow` / `update_flow` / `edit_flow` / `publish_flow` until approved; re-show changes if the plan changes.
4. Invoke **/build-flow** via the Skill tool with `flow-build-prompt.md` + approved `build-plan.md` (+ `flow-definition.json`); use **/create-flow** if the user wants step-by-step. Reject any plan that differs from `build-plan.md` unless approved.
5. Drive to clean: `validate_flow` + `preflight_flow` with zero errors, `create_flow` in **Stopped** state, `get_flow` to verify. Fix with `edit_flow`. Record IDs and results.
6. Test only on a test item with recipients replaced by the tester (approval required); `get_run_details` / `diagnose_run` on failures. `publish_flow` only on explicit approval.
7. Fallback — `/build-flow` unavailable but FlowAgent connected: `set_current_env` → `get_operation_details` per action → `list_connections`/`test_connection` → `list_datasets`/`list_tables`/`resolve_entity` → replace every `<<UNRESOLVED>>` with an approved value → `validate_flow` → `preflight_flow` → `create_flow` (Stopped) → `get_flow`. Neither available: stop, give the Phase 0 install commands, and leave `flow-build-prompt.md`, `build-plan.md` and `flow-definition.json` ready.

## Phase 5: Environment Variables / Connection References (optional) {#phase-5}

Only if ALM was chosen. Create `envvar_<Workflow>_SiteUrl`, one per list (`envvar_<Workflow>_List_<List>`) and per literal email/URL candidate in the solution; reference them as `@parameters('<schema name>')` and apply via `edit_flow`; bind connection references (`cr_sharepoint`, `cr_office365outlook`, `cr_approvals`, …). Re-run `validate_flow`.

## Phase 6: Migration Log {#phase-6}

Write `<workflow-name>-migration-log-YYYY-MM-DD.md` in plain language: source + SHA-256, inventory counts and confidence, verification evidence, decisions, finding resolutions, what was generated (flow id, env, solution, state), validation and test results, **PROTOTYPE** status with open items, deliberate changes, cut-over steps owned by the user, and the out-of-scope note.

---

# Reference

## Export formats {#export-formats}

| Signature (by content) | Container | Product | Evidence |
|---|---|---|---|
| JSON with `files[]` where `type: "workflow"` + `filePath` (+ `formatVersion`) | NAC deployment package `manifest.json` | Nintex Automation Cloud | **High — tested** |
| JSON with `workflowDefinition` (JSON **string**) + `workflowName`/`workflowId` | NAC `design.json` | Nintex Automation Cloud | **High — tested** |
| ZIP containing a NAC `manifest.json` / `design.json` | Zipped NAC package | Nintex Automation Cloud | High |
| XML with `ExportedWorkflow…` / `RootWorkflowActivityWithData` / `Nintex.Workflow` assembly | `.nwf` | Nintex Workflow for SharePoint 2010–2019 | *inferred — verify* |
| ZIP with XAML/XML Nintex activities, no NAC manifest | `.nwp` | Nintex Workflow for Office 365 | *inferred — verify* |
| `rows/widget/ruleGroups`, `FormXml`, `FormControls`, `.nfp` | — | Nintex **Forms** | out of scope → `nintex-form-to-canvas` |
| none of the above | — | unknown — ask the user | — |

`.nwf` SharePoint version only from `Microsoft.SharePoint, Version=14/15/16` strings (14 = 2010, 15 = 2013, 16 = 2016/2019).

### NAC package
```
manifest.json   name "Workflow Deployment Package", source{tenantId, region, environment, author},
                files[{id, filePath "workflows/<id>/design.json", sha256, type "workflow"}], formatVersion "1.0"
workflows/<id>/design.json
```
Users often download `manifest.json` and `design.json` side by side (flat): resolve `filePath`, else a sibling JSON whose SHA-256 matches, else a sibling `design.json` flagged *hash not matched*.

**design.json — top level**

| Key | Use |
|---|---|
| `workflowId`, `workflowName`, `isPublished`, `isActive`, `workflowType`, `workflowDesignVersion`, `_schemaVersion` | Identity + publish state |
| `tags[].name` | e.g. `SharePoint On-Premises`, `App:PPB` — compare with the real connector |
| `permissions[]` | Workflow managers → PA co-owner recommendation |
| `creator`, `author`, `publishAuthor` | Verification contacts (never recipients) |
| `startEvents[]` | Trigger |
| `workflowDefinition` | **JSON string** → `actions` (tree), `variables`, `inUseXtensions` (connector swagger), `forms`, `settings` |
| `internalDependencyConfig` | `connections[{connectionId, connectionName, connector, actions[{actionId, fieldPath}]}]`, `componentWorkflows`, `agentflows`, `documentPackages` |
| `unconfiguredActionIds` | Non-empty → high finding |

**startEvents[0]**
- `eventGroup` ("SharePoint Online"), `eventType` (`xtension:<guid>:item_added`), `eventTypeDisplayName` ("SharePoint - New list item").
- Site/list: `nativeEventConfiguration.fragment.value["ItemAdded.query.siteUrl" / "ItemAdded.query.listName"].literal` (also `xtensionEventConfiguration.inputValue`); list GUIDs in `inputSchema.properties[…listName]["x-ntx-enum-data"]`.
- **Start condition:** `conditional.valueType.data.value` is a JSON string, e.g. `{"where":{"left":{"value":"Submitted"},"operator":"EqualDouble","right":{"value":1}}}` → `@equals(triggerBody()?['Submitted'], 1)`.

**Action tree** — node: `id`, `className`, `configuration{name, properties[].parameters[], isDisabled, isDeprecated}`, `children[]`, `next` (next node **object**), `previous`/`parent` (ids), `metaData.migration{status, summary[]}`.
- `#RootActivity.children[0]` starts the main chain; follow `next` until null.
- Containers (branch by condition/value, parallel, loops, run-if, state machine) hold `children`: each is a branch node (label in `configuration.name`) or the first node of the body. Walk recursively and record `path` (`2.1.3` = action 3 of branch 1 of action 2).
- Engine classes: `engine:updateinstancename`, `engine:assignv3`, `engine:logtoinstancedetails`, `action:sendemail`. Connector actions: `xtension:<guid>:<operation>` (e.g. `list_items_query`, `list_item_update_v_3`); connector name from `inUseXtensions[<guid>].xtension.info.title` or `internalDependencyConfig.connections`.

**Parameter shapes**

| Shape | Meaning |
|---|---|
| `value.primitiveValue.valueType.data.value` = `"APP: {0} - {1}"` + `formatValues[]` | Template with inserts → `@{…}` interpolation |
| `value.variable.valueType.data{value, valuePath}` | Variable reference, e.g. `se_xtension_start_data` + `$['Editor_Email']` |
| `['X_NTX_XTENSION_INPUT']…data.value.value{"Op.query.siteUrl", "Op.body.fields", "Op.query.filter"}` | Connector inputs; filter fragments join into OData |
| `['X_NTX_XTENSION_OUTPUT']…data.value` | Output variable the action writes |
| `Variables` (assignv3) | JSON string list of `{variable, value}` assignments |

**variables[]** — `name`, `displayName`, `dataType.name` (Text, Decimal, Integer, Boolean, DateTime, Collection, Object), `source` (`workflow`, `context`, `startEvent`, connector = action output), `schema` (start variable = list column schema; `enum` ⇒ Choice).

### `.nwf` / `.nwp` — inferred, verify
`.nwf`: XML wrapper (often `ExportedWorkflowWithListMetdata`) with HTML-encoded XAML; read activity names (`SetVariableActivity`, `NWSendNotificationActivity`, `UpdateItemActivity`, `FlexiTaskActivity`) and start options (`StartOnCreate`/`StartOnChange`). `.nwp`: ZIP with the same activities. Parameters, lists and recipients are not reliably extractable → every item **Low**, inventory **PROTOTYPE**; ask for the list URL, screenshots of each action's configuration and workflow history. A NAC export with `settings.workflowMetaData.isMigrated = true` was already migrated from O365 — use the NAC file and record its migration warnings.

## Inventory contents {#inventory-contents}

`workflow-inventory.json` holds: `source` (product, format, sha256, hash_verified, evidence), `workflow` (id, name, published, tags, permissions, owners), `trigger` (nintex event, PA trigger + operationId, site, list, list GUID, condition, confidence), `variables[]`, `actions[]` (id, path, name, nintex_class, branch, disabled, parameters, pa_action, pa_type/operationId, pa_inputs, confidence, decision), `connections[]`, `data_sources.lists[].columns[]`, `emails[]`, `env_var_candidates[]`, `findings[]`, `run_history_verification`, `out_of_scope`, `gate`, `prototype`. `nintex-workflow-inventory.md` is the human summary of the same.

## Action mapping {#action-mapping}

Always confirm operationIds and parameter keys with `get_operation_details`. Confidence is the starting level; lower it when parameters cannot be resolved.

**Triggers**

| Nintex start event | Power Automate trigger | operationId | Notes |
|---|---|---|---|
| SharePoint – New list item | When an item is created | `GetOnNewItems` | `splitOn` body/value |
| SharePoint – Item updated | When an item is created or modified | `GetOnUpdatedItems` | Trigger condition to prevent self-update loops |
| SharePoint – Item deleted | When an item is deleted | `GetOnDeletedItems` | |
| SharePoint – Document added/updated | When a file is created / modified (properties only) | `GetOnNewFileItems` / `GetOnUpdatedFileItems` | |
| Start condition | Trigger condition | `@equals(triggerBody()?['Col'], 1)` | Choice ⇒ `?['Value']` |
| Nintex start form | Power Apps (V2) trigger | `Request` `kind: PowerAppV2` | Form → `nintex-form-to-canvas` |
| Scheduled start | Recurrence | `Recurrence` | |
| Component workflow | Manually trigger a flow (child) | `Request` `kind: Button` + Respond | Same solution |
| Email received | When a new email arrives (V3) | `OnNewEmailV3` | |
| External start / webhook | When an HTTP request is received | `Request` `kind: Http` | **Premium** |

**Actions**

| Nintex action | Power Automate | Type / operationId | Conf. | Notes |
|---|---|---|---|---|
| Query a list (`list_items_query`) | Get items | `GetItems` (`$filter`, `$top`, `$orderby`) | High | Only first item used ⇒ Top Count 1 |
| Update an item (`list_item_update*`) | Update item | `PatchItem` (`id`, `item/<col>`) | High | `ID eq x` ⇒ one item; other filters ⇒ Get items + Apply to each; pass required columns |
| Create / Get / Delete item | Create item / Get item / Delete item | `PostItem` / `GetItem` / `DeleteItem` | High | Delete is destructive — confirm |
| Document actions (upload, copy, move, check in/out, folder) | Create/Copy/Move file, Check in/out, Create new folder | `CreateFile`, `CopyFileAsync`, `MoveFileAsync`, … | High–Med | |
| Set item permissions | Send an HTTP request to SharePoint | `HttpRequest` | Low | REST body must be designed |
| Set a variable value (`assignv3`) | Initialize variable (top level) + Set variable | `InitializeVariable` / `SetVariable` | High | No Initialize inside scopes/loops |
| Collection operations | Append to array / `first()`, `length()` / Select, Filter array | built-in | Med | |
| Set instance name | Compose or trackedProperties | `Compose` | Med | **No direct equivalent** |
| Log to instance details | Compose / trackedProperties | `Compose` | Med | Visible in run history |
| Send an email (`sendemail`) | Send an email (V2) | `SendEmailV2` (`emailMessage/To`, `/Subject`, `/Body`, `/Cc`, `/ReplyTo`) | High | Nintex sender has no equivalent → connection account or `SharedMailboxSendEmailV2` |
| Branch by condition / Run if | Condition | `If` | High | |
| Branch by value | Switch | `Switch` | High | Default = Nintex "Other" |
| Loop for each | Apply to each | `Foreach` | High | Concurrency 1 when setting variables |
| Loop n times / with condition | Do until | `Until` | Med | Checks after each iteration; set limits |
| Parallel path | Parallel branches | shared `runAfter` | High | |
| Pause for / until | Delay / Delay until | `Wait` | High | Max run 30 days |
| Wait for field change | Second flow on modified trigger or Do until + Delay | — | Med | |
| Assign a task / Express approval / Flexi task | Start and wait for an approval | `StartAndWaitForAnApproval` (`OpenApiConnectionWebhook`) | Med | Task forms out of scope; reminders = parallel Delay branch |
| State machine | Do until + Switch on a `State` variable | `Until` + `Switch` | Med | |
| Call a workflow / component workflow | Run a Child Flow | `Workflow` | Med | Same solution |
| Call web service / HTTP | HTTP | `Http` | Med | **Premium** |
| Query JSON / XML | Parse JSON / `xpath()` | `ParseJson` / Compose | High | |
| Regular expression | String functions / Office Script | Compose | Low | Decision |
| Math, dates, text | Compose with expressions | `Compose` | High | |
| Nintex Document Generation | Word Online *Populate a Microsoft Word template* (premium) | — | **Blocked** | Redesign decision |
| DocuSign / Adobe Sign / Salesforce / SQL / Box … | Matching connector | `OpenApiConnection` | Low | Mostly premium; Blocked if none |
| Terminate / Throw error | Terminate (Cancelled / Failed) | `Terminate` | High | |
| Action set / error handling | Scope + Configure run after (Try/Catch) | `Scope` | High | Catch on `Failed`, `TimedOut` |
| Unknown class | — | — | **Blocked** | Never invent; ask the owner |

## Expression translation {#expression-translation}

Rules: `@{expr}` inside strings, `@expr` for a whole value; null-safe `?['x']`; `coalesce()` for optional values; look up anything unusual with `get_expression_help`; match functions by meaning, not name; unresolved → `<<UNRESOLVED: …>>` + Low.

| Nintex | Power Automate |
|---|---|
| Start variable `$['Column']` | `triggerBody()?['Column']` (Choice ⇒ `?['Value']`) |
| `$['Editor_Email' / '_DisplayName']` | `triggerBody()?['Editor']?['Email' / 'DisplayName']` |
| `$['ID']`, `$['ItemUrl']` | `triggerBody()?['ID']`, `triggerBody()?['{Link}']` |
| Workflow variable / `{WorkflowVariable:x}` | `variables('x')` |
| `{ItemProperty:Title}` | `triggerBody()?['Title']` |
| Current date / time | `utcNow()` / `startOfDay(utcNow())`; local via `convertTimeZone()` |
| Initiator | `triggerBody()?['Author']?['Email']` (SharePoint) |
| Workflow name / instance ID | `workflow()?['tags']?['flowDisplayName']` / `workflow()?['run']?['name']` |
| Action output first item / items / count | `first(body('A')?['value'])?['X']` / `body('A')?['value']` / `length(body('A')?['value'])` |
| Template `"{0} Request Submitted"` | `@{triggerBody()?['Type']?['Value']} Request Submitted` |
| length, substring, replace, upper/lower, trim, contains, split | `length()`, `substring()`, `replace()`, `toUpper()/toLower()`, `trim()`, `contains()`, `split()` |
| Format date / add time / date difference | `formatDateTime()`, `addDays()/addHours()`, `div(sub(ticks(b), ticks(a)), 864000000000)` |
| Format number / currency, new GUID, if, is empty | `formatNumber(x,'C2','en-US')`, `guid()`, `if()`, `empty()` |
| Operators: Equal(Double), NotEqual, Greater/Less(OrEqual), Contains, IsEmpty, And/Or | `equals()`, `not(equals())`, `greater()/less()/greaterOrEquals()/lessOrEquals()`, `contains()`, `empty()`, `and()/or()` |

OData (Get items): NAC filter fragments are already OData — `Title eq 'Mailbox'`, `ID eq @{triggerBody()?['ID']}`; keep internal names (`_x0020_`); Person `Author/EMail eq '…'`; Choice `Status eq 'Open'`. Numbers unquoted, strings single-quoted with `''` escaping.

## Connections and licensing {#connections-and-licensing}

| Nintex | Power Automate | Rule |
|---|---|---|
| NAC connection (e.g. SharePoint Online) | Connection reference `cr_sharepoint` → `shared_sharepointonline` | One per connector per solution; embedded, never Invoker |
| Nintex built-in email | `cr_office365outlook` → `shared_office365` | Sent **as the connection account** — service account vs shared mailbox decision |
| Assign a task / approval | `cr_approvals` → `shared_approvals` | |
| Third-party xtension | Matching connector | Usually premium |
| On-prem SharePoint | SharePoint via on-premises data gateway | Gateway + licensing decision |

**Variable types:** Text → String; Decimal → Float; Integer → Integer; Boolean → Boolean; DateTime → String (ISO 8601); Collection → Array; Object (connector output) → use `body('Action')`; context / start variables → built-in expressions. Initialize at top level; drop unused variables.

**Licensing:** SharePoint, Outlook, Approvals, Teams, Office 365 Users = standard. HTTP, HTTP request trigger, custom connectors, gateway, SQL, Salesforce, DocuSign, Adobe Sign, Word *Populate a template* = **premium** (Power Automate Premium / Process / pay-as-you-go). Record the decision in `migration-decisions.md`.

## Confidence and completeness gate {#confidence-and-completeness-gate}

| Level | Criteria |
|---|---|
| **High** | In the export, all parameters resolved, direct PA equivalent, confirmed or unambiguous |
| **Medium** | One element inferred or no direct equivalent (e.g. Set instance name → Compose) |
| **Low** | Partially parsed, unresolved reference, legacy `.nwf/.nwp`, or contradicted by run history |
| **Blocked** | Needs a user decision (unknown action, doc generation, no connector) |

**Business-critical:** trigger, any SharePoint write, email sends, approvals, HTTP / third-party, child flows, state machines.

**Gate — PASS requires:** C1 inventory complete and well-formed (**hard**); C2 SHA-256 recorded and verified against the manifest (**hard**); C3 trigger identified and mapped (**hard**); C4 every action has class, PA mapping, confidence; C5 every SharePoint action has site + list; C6 every connection maps to a connector or has a decision; C7 no Blocked business-critical action without a decision; C8 every email has a recipient and subject; C9 run history reconciled or explicitly waived; C10 out-of-scope recorded (**hard**); C11 no unresolved **high** finding. Hard fail → stop before the Phase 3 PAUSE.

**PROTOTYPE** when any business-critical item is Low/Blocked without a decision, a high finding is unresolved, or the source is `.nwf/.nwp`. The flow may still be built after approval, but outputs are titled **PROTOTYPE**, the flow stays **off**, and reasons are listed.

## Findings checks {#findings-checks}

Each finding: id, check, severity, message, action, recommendation, resolution. Findings are evidence, not decisions — present each with its proposed handling and record the user's answer.

| Check | Severity | When | Proposed handling |
|---|---|---|---|
| Dev site in published workflow | high | Published / production workflow uses a URL with `-Dev`, `dev`, `test`, `uat`, `qa`, `sandbox` | Confirm target site; environment variable |
| Tag ≠ environment | medium | Tag *SharePoint On-Premises* on a SharePoint Online workflow (or vice versa) | Confirm hosting |
| Nintex migration warnings | medium | `metaData.migration.summary` present | Reconcile with run history |
| Unconfigured action | high | `unconfiguredActionIds` not empty | Ask owner |
| Disabled / deprecated action | medium | `isDisabled` / `isDeprecated` | Not migrated / current equivalent |
| Unused variable | low | Never read or set | Drop |
| Query without filter | high | Get items with no filter | Filter Query + Top Count |
| Oversized row limit | low | Row limit > 1, only first item used | Top Count 1 |
| No direct equivalent | info→high | Instance name, log, regex, doc-gen, unknown | Compose vs trackedProperties / decision |
| Premium connector | medium | HTTP, third-party, doc-gen | Confirm licensing |
| Hard-coded email | medium | Literal to/cc/from (e.g. `nintex@workflowcloud.com`) | Env var / shared mailbox |
| Dynamic / missing recipient | medium / high | Recipient resolved at run time / none | Ask who receives it |
| Update many items | medium | Update filtered by non-ID | Get items + Apply to each |
| Update required columns | low | Any Update item | Pass required columns |
| Self-update loop | info / high | Flow updates its trigger list (high on a *modified* trigger) | Trigger condition |
| Error handling = fail | low | Stop on first error | Try/Catch scope (modernize) |

## Run-history verification {#run-history-verification}

| Ask for | Why |
|---|---|
| Nintex instance history / screenshots of one successful and one failed run | Confirms path taken, branch outcomes, logged values |
| SharePoint list URL(s) and column internal names on the **target** site | Export may point at dev; internal names drive OData and `item/<col>` keys |
| Connection accounts (current owner; account PA should use) | Flow runs and sends mail as that account |
| Who receives each email today | Recipients are often resolved at run time |
| Workflow owner / business contact | Sign-off and cut-over |

Mark run history waived only when the user explicitly waives it.

## FlowAgent tools {#flowagent-tools}

Plugin `microsoft/power-platform-skills` → `power-automate` (FlowAgent MCP server `flowagent`; tools appear as `mcp__flowagent__<tool>`). Plugin skills: `setup`, `browse-flows`, `create-flow`, `build-flow`, `debug-flow`, `diagnose-flow`, `manage-flows`, `route-environments`.

| Purpose | Tools |
|---|---|
| Environment | `list_environments`, `get_current_env`, `set_current_env`, `resolve_environment` |
| Discovery (read-only) | `list_flows`, `get_flow`, `list_connectors`, `get_connector`, `search_operations`, `get_operation_details`, `list_templates` |
| Connections | `list_connections`, `test_connection`, `pick_or_create_connection`, `fix_connection` |
| SharePoint / dynamic values | `list_datasets`, `list_tables`, `resolve_entity`, `invoke_operation` |
| Authoring | `get_expression_help`, `validate_flow`, `preflight_flow`, `scaffold_flow` |
| Write (**after build-plan approval only**) | `create_flow` (Stopped), `edit_flow`, `preview_update` → `update_flow` |
| Turn on (**explicit approval only**) | `publish_flow` |
| Test / debug | `get_run_history`, `get_run_details`, `get_run_actions`, `diagnose_run`, `smoke_test` |
| Safety | `get_backup`, `list_backups`, `restore_backup` |

Plugin rules: call `get_operation_details` before every connector action; declare `$authentication` + `$connections`; embedded connection references, never legacy `ApiConnection`; flat slash keys for nested parameters (`emailMessage/To`, `item/Submitted`); avoid deprecated operations (`SendEmail` → `SendEmailV2`, `approvalSubscribeV2` → `StartAndWaitForAnApproval`); `validate_flow` + `preflight_flow` clean before `create_flow`. If the flow cannot be placed in the chosen solution, create it and tell the user to *Add existing → Automation → Cloud flow* (record in the log).

---

## Files produced

Batch: `batch-summary.md`. Per workflow: `nintex_extracted/source-manifest.json` (+ `design.decoded.json`), `workflow-inventory.json`, `nintex-workflow-inventory.md`, `discovery-gaps.md`, `migration-summary.html`, `migration-decisions.md`, `flow-definition.json`, `flow-build-prompt.md`, `build-plan.md`, `<workflow-name>-migration-log-YYYY-MM-DD.md`, plus the validated flow (OFF).

## Guardrails

- Never modify the original export; work only in `nintex_extracted/`.
- Never invent lists, columns, recipients, connections or expressions — mark them Low/Blocked, keep `<<UNRESOLVED>>`, and ask.
- Never create, update, edit or publish a flow before the user approves `build-plan.md`; create flows **OFF** (Stopped) by default.
- Never delete, disable or overwrite an existing flow, connection or solution component without approval; rely on the plugin's backups and validation.
- Never send test emails to real recipients or run against production data without approval.
- Never claim production-ready while PROTOTYPE items are open or `validate_flow` / `preflight_flow` report errors.
- Never disable, delete or edit the Nintex workflow; never modify SharePoint schema (▲ recommendations only).
- Never show tracebacks; report file problems in plain language with a retry hint.

## When NOT to Use

| Request | Use instead |
|---|---|
| Nintex form (classic, responsive, NAC start/task form) → Canvas app | `nintex-form-to-canvas` |
| InfoPath form → Canvas app | `infopath-to-canvas` |
| Build a new flow from scratch, or debug an existing flow run | `/build-flow`, `/create-flow`, `/debug-flow`, `/diagnose-flow` |
