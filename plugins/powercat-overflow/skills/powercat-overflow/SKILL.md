---
name: "powercat-overflow"
description: "Reviews every Power Automate cloud flow inside a Power Platform solution (.zip) against Microsoft's coding guidelines and produces a [SolutionName].findings.json next to the uploaded solution, then opens the hosted PowerCAT-Overflow viewer at https://microsoft.github.io/power-cat-skills/PowerCAT-Overflow.html and uploads both files so the user can explore the results. Triggers: 'powercat overflow', 'overflow my solution', 'review my solution', 'evaluate flows in this solution', 'audit Power Auto"
---

# PowerCAT-Overflow

Review every Power Automate cloud flow in a Power Platform solution ZIP against Microsoft's coding guidelines, write a single solution-level findings JSON next to the uploaded solution, then open the hosted PowerCAT-Overflow viewer with both files loaded.

Hosted viewer: <https://microsoft.github.io/power-cat-skills/PowerCAT-Overflow.html>

## Step 0 — Load the authoritative source list

Before doing any analysis, fetch the canonical source list with `web_fetch` (`raw: true`):

```
https://raw.githubusercontent.com/microsoft/power-cat-skills/refs/heads/main/Common/PowerCAT%20OverFlow/sources.md
```

Parse the Markdown link list and treat that set as the **only** anchor citations allowed in findings. If the fetch fails (network error, 404, empty body), stop and tell the user the source list is unreachable — do **not** proceed with a review. Cache the parsed list in memory for the rest of this run.

## Step 1 — Locate the input solution

1. Prefer a `.zip` path in `<tagged_files>`. Use the most recent match.
2. If none, ask via `m_ask_user`: "Please attach the Power Platform solution `.zip` you'd like me to review."
3. Reject anything that isn't a ZIP. The skill does **not** accept loose JSON files in this mode.

Remember the absolute path of the ZIP and its parent directory — both are needed later.

## Step 2 — Unpack & enumerate flows

Unpack the solution to a temp working directory (`Expand-Archive` on Windows, `unzip` elsewhere).

A valid Power Platform solution ZIP contains:
- `solution.xml` at the root
- a `Workflows/` folder with one or more `<FriendlyName>-<GUID>.json` files (and matching `.xml` sidecars you can ignore for analysis)

Read `solution.xml` and extract:
- **Display name** → `solution.name`
- **Unique name** (publisher-prefixed, the `UniqueName` element) → `solution.uniqueName`
- **Version** (the `Version` element) → `solution.version`

For each `*.json` in `Workflows/`:
- Compute the **friendly name** by stripping the trailing `-<GUID>.json` suffix (e.g. `cf_AcknowledgeCaseId-1234abcd-...-....json` → `cf_AcknowledgeCaseId`). This friendly name is the key under which the flow's findings will be stored.
- Load the JSON, then unwrap `properties.definition` → `definition` if present, exactly as before.

If `Workflows/` is missing or empty, stop and tell the user the ZIP isn't a flow-bearing solution.

## Step 3 — Analyse each flow

For every flow, walk all actions recursively (`actions`, `else.actions`, `cases.*.actions`, `default.actions`) and assign each finding an impact of **low**, **medium**, or **high**. Where a finding clearly points at a specific action, capture its name in the `action` field (must match the action key exactly, case-sensitive; triggers count). Cite only URLs from the Step 0 source list — never invent or paraphrase URLs.

### Complexity
- Total action count over 50, or nesting depth over 4 → high.
- Many top-level Initialize_Variable actions, or many sibling Scopes that could be split into child flows → medium/high.

### Maintainability
- Hardcoded URLs / tenants / phone numbers / email addresses → high.
- Magic numbers driving business policy (license cost, approval thresholds, quotas, poll intervals) → high.
- Inconsistent action naming or missing `description` / peek-code notes → medium.
- Flow not authored inside a solution (no env-var references) → medium.
- Duplicate flows (`Copyof-…`, `Test`, `Test2`, `MayankTest`, etc.) shipped alongside originals → high (also surface at solution level).

### Security
- Generated credentials/secrets in HTTP bodies without `runtimeConfiguration.secureData.properties` covering `inputs` and/or `outputs` → high.
- A single `$authentication` parameter reused across distinct external vendors → high.
- OData `$filter` or SQL fragments built by interpolating `triggerBody()` / user input → high.
- `Request` trigger without auth posture (no Entra/SAS/IP allow-list) → high.
- Sensitive PII (salary, SSN, DOB, phone) in HTTP body without `secureInputs` → high.
- HTML/email bodies built via raw `concat()` of user input → medium.
- Instrumentation keys / connection strings in request bodies → medium.

### Performance
- Reference to `outputs('X')` / `body('X')` where X belongs to a sibling Switch case or sibling parallel branch → high.
- Compensation/rollback logic that doesn't cover every resource the flow created → high.
- Reference to fields not declared in the trigger schema → high.
- HTTP action with no explicit `retryPolicy` → medium (group similar ones per flow).
- `Wait` actions with long fixed delays, or `Until` loops with > 30 iterations / > 1 h total → medium.
- `Foreach` without explicit `runtimeConfiguration.concurrency` → medium.
- Catch / final scopes that only inspect a subset of upstream scopes → medium.
- Explicit, sensible `concurrency` on Foreach loops → low (positive callout).

For each flow, produce 1–4 category objects (Complexity, Maintainability, Security, Performance in that order). Each category's `impact` = the highest impact among its items. 3–10 items per category is ideal; don't pad.

For every finding **item**, always include a `fix` field — a single actionable sentence (≤ 30 words, start with a verb) telling the developer exactly what to change. Examples:
- `"Enable secure inputs on HTTP action 'Send_Request' via Settings → Secure Inputs."`
- `"Replace the hardcoded URL in 'Initialize_Variable_Endpoint' with an environment variable."`
- `"Add concurrency (recommend: 10) to the Apply-to-each in its Settings panel."`

## Step 4 — Build the solution-level roll-up

Collect across all flows:
- **Per-category roll-up** (1–4 entries): for each category that has at least one finding anywhere in the solution, compute the highest impact seen, write a 1–2 sentence `summary`, and set `flowsAffected` = how many flows had at least one item in that category.
- **topRisks**: 3–8 cross-flow high-priority items (mostly `impact: high`, a few `medium` if they affect the executive verdict). Each risk has `label`, `desc`, `impact`, optional `category`, optional `fix` (same single-sentence remediation convention as per-flow items), and — when applicable — `flow` (friendly name) and `action` (so the viewer can deep-link).
- **stats**: `flowCount`, `totalActions` (sum of action counts across flows), `highImpactFlows` (flows where any category rolled up to `high`), `flowsReviewed` (= `flowCount` unless one failed to parse).
- **summary**: a narrative paragraph (markdown OK) giving the overall verdict, the top 1–3 priorities, and any patterns (duplicate flows, naming drift, security posture).

## Step 5 — Write the Solution Findings file

Schema (authoritative): <https://raw.githubusercontent.com/microsoft/power-cat-skills/refs/heads/main/Common/PowerCAT%20OverFlow/solution.findings.schema.json>
Example: <https://raw.githubusercontent.com/microsoft/power-cat-skills/refs/heads/main/Common/PowerCAT%20OverFlow/solution.findings.sample.json>

Shape:

```json
{
  "solution": {
    "name": "...",
    "uniqueName": "...",
    "version": "...",
    "summary": "...",
    "categories": [ { "category": "...", "impact": "...", "summary": "...", "flowsAffected": 0 } ],
    "topRisks":   [ { "label": "...", "desc": "...", "fix": "...", "impact": "...", "category": "...", "flow": "...", "action": "..." } ],
    "stats":      { "flowCount": 0, "totalActions": 0, "highImpactFlows": 0, "flowsReviewed": 0 }
  },
  "flows": {
    "<FriendlyFlowName>": [
      { "category": "Complexity",      "impact": "low|medium|high", "items": [ { "label": "...", "desc": "...", "fix": "...", "impact": "...", "action": "..." } ] },
      { "category": "Maintainability", "impact": "...", "items": [ ... ] },
      { "category": "Security",        "impact": "...", "items": [ ... ] },
      { "category": "Performance",     "impact": "...", "items": [ ... ] }
    ]
  }
}
```

**Output filename:** `<OriginalSolutionZipBaseName>.findings.json`
**Output location:** the same folder as the uploaded `.zip`.

Validate the output against the JSON Schema before saving (at minimum: required keys present, category enum values, impact enum values, additionalProperties=false respected). If validation fails, fix and re-validate before continuing.

## Step 6 — Launch the hosted viewer and load both files

Open the hosted PowerCAT-Overflow viewer and upload the two files using the Playwright browser tools:

1. `playwright-browser_navigate` → `https://microsoft.github.io/power-cat-skills/PowerCAT-Overflow.html`
2. `playwright-browser_snapshot` to discover the two file inputs (one for the solution `.zip`, one for the findings `.json`). The labels in the UI clearly distinguish them.
3. `playwright-browser_file_upload` once per input, passing the absolute paths in the right order. If the page exposes a single chooser that opens twice, call the upload tool twice with the appropriate path each time.
4. `playwright-browser_snapshot` again to confirm both files are accepted (look for the rendered solution overview / flow list).

If Playwright is unavailable, fall back to `Start-Process "https://microsoft.github.io/power-cat-skills/PowerCAT-Overflow.html"` and tell the user the two exact file paths to upload manually.

## Step 7 — Hand over

Write a short chat message (≤150 words) containing:

1. A 4-row score table (Complexity / Maintainability / Security / Performance — solution roll-up impact).
2. The top 3 risks from `solution.topRisks` (one line each, with the flow name when present).
3. The absolute path of the `.findings.json` file you wrote.
4. The viewer URL.
5. One-line note that source citations were loaded fresh from upstream `sources.md`.

End with: **"Handing over — explore the solution in the open viewer tab."**

## Hard rules

- Never invent action names. Only use names that appear in the flow's `actions` / `triggers` keys.
- Never paste secrets, tokens, or full PII payloads back into chat.
- Never write the user's flow JSON or solution ZIP to any external destination; all artefacts stay local.
- Never cite a guideline URL that isn't in the Step 0 source list.
- The output JSON must validate against the published `solution.findings.schema.json`.
- Friendly flow names in `flows` keys must match the rule: ZIP filename minus the trailing `-<GUID>.json`.
