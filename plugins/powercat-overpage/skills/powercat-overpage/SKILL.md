---
name: "powercat-overpage"
description: "Reviews the Power Pages site(s) inside a Power Platform solution .zip against best practices across Security, Performance, Accessibility, Maintainability, Architecture and Reliability — by reading the pages, web templates, custom JS/CSS, settings and table permissions and reasoning about them. Optionally also ingests a browser HAR capture (recommended) to investigate real performance bottlenecks and map them to code. Produces a [SolutionName].findings.json (validated against findings.schema.json) with solution-level, per-site and per-component findings, each with a description, a suggested fix, and (where relevant) a code or HAR anchor. Then opens the PowerCAT OverPage viewer with the solution, findings and HAR loaded so the user can explore findings overlaid on a live page preview, on the actual code, and on the network waterfall. Triggers: 'powercat overpage', 'overpage my site', 'review my power pages site', 'review this portal solution', 'evaluate this power pages solution', 'audit power pages site', 'overpage', 'power pages solution review', 'analyze power pages performance', 'review power pages with har'."
---

# PowerCAT OverPage

Review the Power Pages site(s) packaged in a **Power Platform solution `.zip`**, optionally using a
**HAR** capture for real performance analysis, and write a single `[SolutionName].findings.json`.
Then open the **PowerCAT OverPage** viewer with everything loaded — each finding is overlaid on a
live page preview, on the **actual code** (Liquid / page copy / custom JS+CSS / web files), and on the
**HAR network waterfall**.

This is the Power Pages counterpart to **PowerCAT OverFlow** (which reviews Power Automate flows).

**You — the AI agent — produce the findings by reading and reasoning about the solution.** There is no
bundled analyzer. Ground every finding in something inspectable (a component, a line of code, a HAR
request). The output must validate against `findings.schema.json` (next to this file).

## Step 0 — Load the authoritative source list

Fetch the canonical Power Pages best-practice sources with `web_fetch` (`raw: true`):

```
https://raw.githubusercontent.com/microsoft/power-cat-skills/refs/heads/main/Common/PowerCAT%20OverPage/sources.md
```

Use only these URLs for the optional `source` citation on findings. If the fetch fails, continue but
omit `source` citations (don't invent URLs).

## Step 1 — Locate inputs

1. **Solution `.zip`** (required): prefer a `.zip` in `<tagged_files>` / attachments (most recent).
   If none, ask via `m_ask_user`: "Please attach the Power Pages solution `.zip` you'd like me to review."
2. **HAR `.har`** (optional, **recommended**): if a `.har` is attached, use it. If not, **ask once**
   via `m_ask_user`: "Optionally attach a browser HAR capture (DevTools → Network → Export HAR while
   browsing the live site) — it lets me find real performance bottlenecks and map them to code.
   Proceed without it?" Don't block on the answer; review the solution either way.

Remember absolute paths of both files.

## Step 2 — Unpack & enumerate the solution

Unpack the ZIP. Two Power Pages layouts are supported:

- **Solution format** (modern): `powerpagecomponents/<guid>/powerpagecomponent.xml` (+ optional
  `filecontent/`). Each component XML has `<powerpagecomponenttype>`, `<name>`, a `<powerpagesiteid>`,
  and a JSON `<content>`. Group components by `powerpagesiteid` — **a solution may contain several
  sites; review each.** Key component types: `2`=web page (content JSON has `copy` Liquid +
  `customjavascript` + `customcss` + `partialurl` + `parentpageid` + `isroot`; note the enhanced data
  model pairs a root page with content/language pages — merge by `rootwebpageid`), `8`=web template
  (`content.source` = Liquid), `6`=page template, `7`=content snippet, `9`=site setting, `4/5`=weblink
  set/link, `3`=web file (binary in `filecontent/`), `15`=basic form, `17`=list, `18`=table
  permission, `11`=web role, `10`=page access control rule.
- **Site export** (`pac powerpages download`): `web-pages/`, `web-templates/`, etc. (adx_ YAML).

For `solution.name`/`version`, read `solution.xml` (`UniqueName`, `Version`). A site's name often
comes from the `Browser Title Suffix` snippet.

**Reject** a classic Dataverse solution with no Power Pages site (no `powerpagecomponent` and no
`*.webpage.yml`): tell the user and stop.

## Step 3 — Review each site (you reason; nothing is automated)

For every site, raise findings across these **categories**: **Security, Performance, Accessibility,
Maintainability, Architecture, Reliability** (SEO optional). Each finding has a `category`, an
`impact` (`high`/`medium`/`low`), a **description** (`desc`), and a **suggested fix** (`fix`).
Assign a `scope`: `solution` (spans sites), `site`, `page`, or `component`. Guidance:

- **Security** — table permissions with Global scope + Anonymous read; pages exposing list/form data
  without access control; secrets in site settings; inline `<script>` (CSP); open registration;
  user input interpolated into Liquid `fetchxml`.
- **Performance** — heavy/duplicated client scripts in page copy/custom JS; large web files; many
  render-blocking resources; large lists. (Use HAR in Step 4 for measured issues.)
- **Accessibility** — `<img>` without `alt`, unlabeled inputs, heading-order jumps, low contrast.
- **Maintainability** — hardcoded URLs/emails/GUIDs/magic numbers in Liquid; inline JS/CSS instead of
  web files; duplicate/test/blank pages shipped (e.g. `BlankPage`, `Testing`, `Copy of …`).
- **Architecture** — page hierarchy/sitemap issues; misuse of page vs web templates; too many sites or
  components; tables surfaced without a clear permission model; ALM smells (test artifacts in a
  managed solution).
- **Reliability** — forms writing to tables with no matching permission for the intended role;
  references to web templates/snippets/web files that don't exist; broken internal links.

Per site, produce: a `categories` rollup, an optional site `summary`, optional site-level `findings`,
and `components` (findings keyed by `<type>:<name>`). 1–8 items per group; don't pad.


## Step 3 - Review each site with combined guidance

Raise findings across categories:

- Security
- Performance
- Accessibility
- Maintainability
- Architecture
- Reliability
- SEO (optional)

Each finding needs category, impact (high/medium/low), description, and suggested fix.

### 3A - Security deep checks (Power CAT)

1. Web role defaults:
- Verify only one default anonymous role and one default authenticated role.
- Raise high risk if multiple default roles exist for anonymous or authenticated users.
- Explain runtime implication: authenticated default role applies to every signed-in user.

2. Table permission scope:
- Flag Global scope permissions unless explicitly justified (for example super-admin-only design).
- Highlight sensitive tables exposed globally.
- Prefer parent-child permission chains to derive natural row-level access.

3. Data trimming anti-patterns in code:
- Flag filters by user id, email, account id, account number as design-risk indicators.
- Escalate if security trimming happens in client-side JavaScript.
- Escalate if trimming is done in Liquid while table permissions are broad.
- Note: allow user to confirm benign lookup tables (for example states/cities) before final severity.

4. Identity posture:
- Detect local login usage in site settings.
- Recommend Entra ID for workforce or known guests, Entra External ID for external audience.
- Call out password reset, email verification, mailbox workflow dependency, and MFA operational burden for local login.

5. Web API field scope:
- Flag wildcard field scope all (*) as security and performance risk.
- Recommend explicit field projection and Column Permissions per web role and CRUD.
- Explain forward-risk: future sensitive columns may be exposed unintentionally.

6. Public forms:
- For anonymous forms, verify CAPTCHA is enabled.
- Recommend WAF (Power Pages WAF or customer-managed WAF) for abuse mitigation.

7. Open registration:
- Mention implication clearly: users can sign up and access app without invite if not controlled by other gates.

8. Deprecated false-positive handling:
- Do not treat Enable Table Permissions toggle behavior as reliable signal on new sites.
- Use deprecation guidance from Microsoft Learn.

### 3B - Performance deep checks (Power CAT)

1. Header and footer templates:
- Identify effective header and footer templates actually used by active page templates.
- Verify header and footer caching site settings are enabled.
- Inspect substitution tag usage and call out overuse that defeats caching goals.
- Flag expensive data queries in shared header/footer paths.

2. Custom API pages and web templates:
- Review custom JSON endpoints built via page/template combinations.
- Flag dynamic FetchXML assembly from user parameters without robust controls.
- Flag loops and transforms that create avoidable server bottlenecks.
- Compare rationale against native Power Pages Web API capability.

3. FetchXML and Web API design:
- Flag missing paging in queries and APIs returning large datasets.
- Flag excessive joins/subqueries that can degrade runtime with permission folding.
- Recommend UX-compatible paging patterns (paged list, load-more, infinite scroll with bounded page size).

4. JavaScript execution patterns:
- Flag blocking API chains and late-lifecycle data calls.
- Flag large custom JS blocks in page copy or snippets when web files/modules are more suitable.

### 3C - Configuration and maintainability checks (Power CAT)

1. Site settings vs content snippets:
- Flag oversized snippets containing logic-heavy JS or Liquid.
- Recommend web templates for reusable logic and snippets for localized string content.

2. Code organization:
- Detect duplicated templates/snippets across languages where localization model appears misunderstood.
- Detect unnecessary one-template-per-page patterns unless justified by multi-language architecture.

3. Large JavaScript payloads:
- Flag very large scripts and duplicated script loads.
- Suggest splitting by route/feature and deferring non-critical bundles.


## Step 4 — When a HAR is present, investigate performance

Parse the HAR (`log.pages` for per-page `onLoad`/`onContentLoad`; `log.entries` for requests with
sizes, timings, status, and `_initiator` stacks). Look for and raise **Performance** findings for:

- pages with slow `onLoad` (> 3 s) — describe which page and the measured time;
- large scripts/images/stylesheets (e.g. multi-MB bundles) — name the URL and size;
- slow requests (high total time / TTFB), failed requests (HTTP ≥ 400);
- render-blocking third-party/parser-inserted scripts;
- duplicated requests.

Attach a `har` object to each such finding: `{ requestUrl, pageUrl?, kind, thirdParty }`. Per the
agreed behavior, **also surface third-party/CDN bottlenecks** (set `"thirdParty": true`) anchored to
the page that loaded them — even though the fix may be "defer/remove", they're often the real cost.
When a request maps to solution code (a web file, or a page's custom JS), also add a `code` anchor.

## Step 5 — Anchor findings

Give findings the most useful anchors so the viewer can locate them:

- `anchor` (visual, on the page preview): `{ "kind": "selector", "value": "<css>" }`,
  `{ "kind": "match", "value": "<visible text>" }`, or `{ "kind": "component" }` for non-visual.
- `code` (jump to source in the code viewer): `{ "assetPath": "...", "line": N, "match": "..." }`.
  Asset paths the viewer exposes: `web-templates/<Name>.liquid`, `web-pages/<Page>/copy.html`,
  `web-pages/<Page>/custom.js`, `web-pages/<Page>/custom.css`, `web-files/<file>`.
- `har` (jump to the network request): see Step 4.

A finding can carry several anchors (e.g. a perf finding with both `har` and `code`).

## Step 6 — Build the solution roll-up

`solution.categories` (highest impact per category across all sites, with a 1–2 sentence summary),
`solution.summary` (narrative verdict + top 1–3 priorities + cross-site patterns), and optional
`solution.findings` for solution-wide issues.

## Step 7 — Write & validate the findings file

Shape (authoritative: `findings.schema.json`):

```jsonc
{
  "solution": { "name", "version"?, "summary", "categories":[...], "findings"?:[...] },
  "sites": [
    { "id", "name", "summary"?, "categories"?:[...], "findings"?:[...],
      "components": { "<type>:<name>": [ { "category","impact","items":[ {
        "label","desc","fix"?,"impact","scope"?,"rule"?,"source"?,
        "anchor"?:{...}, "code"?:{...}, "har"?:{...} } ] } ] } }
  ]
}
```

- `site.id` must match the `powerpagesiteid` (or `"site"` for a single `pac` export).
- `category` ∈ {Security, Performance, Accessibility, Maintainability, Architecture, Reliability, SEO};
  `impact` ∈ {high, medium, low}.
- **Validate against `findings.schema.json`** (required keys, enums, `additionalProperties:false`,
  anchor `value` required for selector/match) and fix until it passes.

**Output filename:** `<OriginalSolutionZipBaseName>.findings.json`, in the same folder as the `.zip`.

## Step 8 — Open the viewer with all artifacts

1. `playwright-browser_navigate` → the viewer URL (hosted when published, else `http://localhost:4317/`).
2. `playwright-browser_snapshot` to find the inputs: **Open .zip** (solution), **Findings** (the JSON),
   **HAR** (the capture, if any).
3. `playwright-browser_file_upload` once per input with absolute paths.
4. `playwright-browser_snapshot` to confirm the Overview + findings drawer rendered. The viewer has
   four views: **Overview, Preview, Code, Network**. Findings carry "View code" / "View request" /
   "Show on page" actions that deep-link across them.

If the viewer supports it, you may instead deep-link `?site=<zip>&findings=<json>&har=<har>`.
If Playwright is unavailable, `Start-Process` the viewer URL and give the user the file paths to load.

## Step 9 — Hand over

Write a short chat message (≤170 words):

1. A score table of `solution.categories` (Category · impact).
2. The top 2–3 findings (one line each, with site/component and — for perf — the measured number).
3. Whether a HAR was used (and the slowest page if so).
4. The absolute path of the `.findings.json`.
5. The viewer URL.

End with: **"Handing over — explore the findings overlaid on each page, the code, and the network in the open viewer."**

## Hard rules

- **You** author the findings by reading the solution (and HAR) — there is no engine. Never fabricate;
  ground each finding in a component, code line, or HAR request.
- The output JSON **must validate** against `findings.schema.json`.
- Component keys are `<componentType>:<componentName>` exactly; `site.id` matches `powerpagesiteid`.
- Cite only URLs from the Step 0 `sources.md` in `source`.
- Keep all artifacts local; never upload the solution, HAR, or findings anywhere.
- Never paste secrets or full PII back into chat.
