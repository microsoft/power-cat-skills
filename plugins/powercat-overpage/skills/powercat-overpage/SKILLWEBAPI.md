---
name: "powercat-overpage-webapi-field-remediation"
description: "Analyzes traditional and React SPA Power Pages sites to replace deprecated wildcard Webapi/<table>/fields settings. Use when asked to remediate Web API wildcard fields, inventory OData columns used by site code, compare Web API requests with site-setting allowlists, or find missing and unused Power Pages Web API fields. Classifies the site first, uses a site-type-specific scan plan, and groups observed columns by table using conservative matching between logical names and EntitySetName values without requiring Dataverse schema."
---

# PowerCAT OverPage Web API Field Remediation

Use this focused add-on with PowerCAT OverPage when a Power Pages site has `Webapi/<table-logical-name>/fields = *`, or when the user wants an evidence-based Web API field inventory.

The goal is to inspect local site artifacts, find Power Pages OData Web API requests, infer the columns each request uses, associate each OData `EntitySetName` with the most likely logical table name from site settings, and produce a conservative replacement allowlist.

This skill supports both:

- **Power Pages SPA site** — a code-first site where React is the primary runtime experience. SPA sites are expected to be heavy Web API users.
- **Power Pages site** — a traditional site built primarily from pages, web templates, Liquid, forms, lists, snippets, and component-level custom JavaScript.

Classify each site before scanning code. Use exactly one type per site. Do not perform both full scan plans: that wastes compute and creates duplicate evidence.

Do not perform a general security or performance review. Do not require Dataverse metadata. Do not invent table or column mappings.

## Authoritative behavior

Power Pages uses different table identifiers in the two relevant locations:

- Site settings use the Dataverse table **logical name**, for example `Webapi/account/fields`.
- OData request paths use the Dataverse **EntitySetName**, for example `/_api/accounts`.
- `Webapi/<table>/fields` must contain comma-separated **column logical names**. The wildcard `*` is deprecated and should be replaced with explicit columns, a `Power Pages Web API Columns` system view through `UseFieldsFromView`, or both.

Source: `https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview`

## Inputs

Accept either supported OverPage input shape:

1. An unpacked or zipped Power Platform solution containing Power Pages components.
2. A `pac powerpages download` site export.

Analyze only local artifacts. A HAR can provide supporting runtime evidence, but is not required and must not replace source-code inspection.

## Step 1 — Inventory Web API site settings

Always perform this step before site classification or code scanning.

Enumerate these settings per site:

- `Webapi/<table>/enabled`
- `Webapi/<table>/fields`
- `Webapi/<table>/UseFieldsFromView`

Preserve the exact table token, setting value, component path, and line or component anchor. Treat the table token in the setting as the logical-name candidate.

Classify each field configuration as:

- `Wildcard`: value is `*`; remediation is required.
- `Explicit`: a comma-separated allowlist is present.
- `View`: `UseFieldsFromView = true` and no explicit list is present.
- `Explicit + View`: both mechanisms are configured.
- `Missing`: Web API is enabled but neither an explicit list nor a view is configured.

Build a target-table index from all enabled, wildcard, explicit, and view-based settings. Use this index to prioritize request matching, but still report OData entity sets that have no matching setting.

Do not claim which fields a system view contains when the view definition or Dataverse metadata is unavailable.

## Step 2 — Classify each site before scanning

Classify each site as exactly one type.

### Power Pages SPA site

Classify as a SPA only when React is the primary site runtime. Strong signals include:

- `package.json` with `react` and a build system such as Vite, webpack, Create React App, Next.js static output, or another SPA bundler.
- Source trees such as `src/`, `app/`, `components/`, `pages/`, `routes/`, `services/`, `api/`, or `hooks/` containing `.js`, `.jsx`, `.ts`, or `.tsx` files.
- A root mount such as `createRoot(...)`, `ReactDOM.render(...)`, or a page/template containing `<div id="root">` or another React mount container.
- Client-side routing and a built application bundle loaded by the root Power Pages page or template.
- Central API clients, hooks, stores, or service modules making many `/_api/` calls.

A traditional site containing one React widget is not a SPA site unless that React application is the primary runtime experience.

### Power Pages site

Classify as a traditional Power Pages site when the primary experience is assembled from:

- Web pages and page copy
- Web templates and Liquid
- Basic forms and multistep forms
- Lists
- Content snippets
- Web files and page/component custom JavaScript

Custom JavaScript and occasional framework code do not by themselves make the site a SPA.

### Classification output

Record one of these statements in the report scope:

`Site type: Power Pages SPA site. Scanned React source, API/service modules, and the production bundle only where source was unavailable or needed for coverage.`

or:

`Site type: Power Pages site. Scanned runtime page, template, snippet, form/list custom JavaScript, and referenced web-file code; SPA source-tree scanning was not applied.`

If classification remains uncertain, choose the type best supported by the root runtime and record the uncertainty. Do not run two exhaustive scans.

## Step 3 — Choose the site-type scan plan

### Plan A — React SPA Power Pages site

Prioritize high-signal source code in this order:

1. Shared API clients and request wrappers in `src/**/api*`, `src/**/service*`, `src/**/client*`, `src/**/dataverse*`, and equivalent application folders.
2. React hooks and state/data layers, including files matching `use*.ts`, `use*.tsx`, stores, contexts, query definitions, loaders, and actions.
3. Route and feature modules that build OData URLs or write payloads.
4. Shared constants, query builders, types, and generated clients referenced by request code.
5. React component files only when they call the API directly or consume unprojected response fields needed to understand a no-`$select` request.
6. Built web files or bundles only when original source is absent, source maps reveal additional request code, or the deployed bundle may differ materially from the available source.

SPA scanning rules:

- Start with endpoint markers and request-wrapper definitions; follow imports and call sites rather than reading every component.
- Resolve wrapper functions, URL constants, template literals, query-builder helpers, payload types, object spreads, and hook/service return values when statically possible.
- Search `.js`, `.jsx`, `.ts`, and `.tsx`; inspect source maps when available and useful.
- Detect common libraries and patterns: `fetch`, Axios, React Query/TanStack Query, SWR, Redux thunks, route loaders/actions, generated service clients, and custom Dataverse clients.
- Include requests initiated in workers or shared utility packages that ship with the SPA.
- Use TypeScript interfaces only as supporting evidence. Do not count every property in an interface unless construction, projection, filtering, ordering, or response consumption proves runtime use.
- When the same request exists in source and compiled output, deduplicate it and anchor to source. Do not count it twice.
- If only a minified bundle exists, scan string tables and endpoint fragments, mark completeness as limited, and do not infer fields from arbitrary minified property names.

Skip by default:

- `node_modules/`, package caches, test coverage, build caches, framework internals, and third-party vendor chunks.
- Tests, mocks, Storybook stories, fixtures, sample data, generated declarations, and dead/example code unless runtime imports prove they ship.
- `dist/`, `build/`, and deployed bundles when matching source has already provided coverage.
- Traditional Liquid/page-copy deep scans after the root mount and bundle references have been identified, unless those artifacts also contain OData calls or construct runtime API configuration.

### Plan B — Traditional Power Pages site

Prioritize runtime components in this order:

1. Web templates and Liquid source containing `/_api/`, request wrappers, or referenced JavaScript.
2. Web page custom JavaScript and page copy containing scripts.
3. Basic-form, multistep-form, and list custom JavaScript.
4. Content snippets containing executable JavaScript.
5. Referenced JavaScript web files and shared request wrappers.
6. Other readable web assets only when imported or referenced by an active page/template/component.

Traditional-site scanning rules:

- Search component source and active referenced web files for endpoint markers first.
- Follow page-template and web-template references so copied, inactive, draft, or orphaned components do not receive equal scan priority.
- Inspect inline scripts and statically resolvable URL/payload variables near each request.
- Scan Liquid output only where it constructs an OData URL, query fragment, or payload consumed by client-side code.
- Do not treat Liquid `fetchxml`, native form submission, native list retrieval, or Dataverse form metadata as OData Web API requests.

Skip by default:

- React/Node project heuristics, dependency manifests, and package trees when no primary SPA runtime exists.
- CSS, images, fonts, localization-only snippets, static HTML without scripts, and binary web files.
- Inactive copied templates/pages unless referenced by an active runtime component or they contain a uniquely configured OData request that warrants a `Possibly inactive` note.
- Minified third-party libraries with no site-owned `/_api/` endpoint strings.

### Escalation rule

Expand beyond the selected plan only when evidence requires it—for example, a wrapper imported from an unexpected folder, an endpoint assembled in page copy but completed in a web file, or a bundle containing requests absent from source. Record why the scan expanded.

## Step 4 — Find Power Pages OData requests

Search selected code and readable web assets for requests whose path begins with `/_api/<entity-set>` or the equivalent absolute site URL. Include requests made through:

- `fetch`
- `XMLHttpRequest`
- `$.ajax`, `$.get`, `$.post`, and related jQuery calls
- `webapi.safeAjax`, `shell.ajaxSafePost`, or project-specific wrappers
- Axios or generated service clients
- React Query/TanStack Query query and mutation functions
- SWR fetchers, route loaders/actions, hooks, stores, and thunks
- URL variables, template literals, and statically resolvable string concatenation

Inspect all CRUD operations:

- `GET`: query options and consumed response properties
- `POST`: request-body properties
- `PATCH` and `PUT`: request-body properties
- `DELETE`: table usage only; no field should be inferred from a record GUID in the route

Exclude non-table endpoints such as `/_api/search/v1.0/summary` and `/_api/summarization/data/v1.0/` from this report. Do not classify ordinary Liquid `fetchxml` as an OData Web API request.

For each request, record the HTTP method, raw endpoint, extracted entity set, source asset, line, site type, runtime/import path when useful, and whether the URL or payload is static, partially dynamic, or unresolved.

Deduplicate equivalent requests by normalized method, entity set, query shape, and payload shape. Preserve all materially distinct evidence locations without inflating request counts.

## Step 5 — Extract observed fields

Extract field tokens from every statically inspectable part of each request.

### Read/query fields

Collect direct-table fields from:

- `$select`
- `$filter`
- `$orderby`
- `$apply`, `$groupby`, and aggregate expressions
- `$expand` navigation clauses, including nested `$select`, `$filter`, and `$orderby`
- Aliases or query builders when their final field values can be resolved

Keep expanded related-table fields separate from the root table. If the related entity set or logical table cannot be established, group them under `Related via <navigation-property>` rather than assigning them to the root table.

### Write fields

Collect keys from statically known `POST`, `PATCH`, and `PUT` payloads, including object literals, typed request objects, form-to-payload mappings, and resolvable object spreads.

For `<lookup>@odata.bind`, preserve the raw property and derive `<lookup>` as a candidate column logical name. Mark the derivation explicitly. Also record the bound EntitySetName as supporting table-matching evidence.

### Lookup read fields

For OData lookup properties in the form `_<column-logical-name>_value`, preserve the raw request token and derive `<column-logical-name>` as the candidate site-setting field. Mark it as a lookup normalization, not an exact textual match.

### Response-consumed fields

When a `GET` has no `$select`, trace the response through the nearby callback, service return type, React hook, store selector, route loader, or consuming component. Look for property access such as `record.name`, `item["statuscode"]`, destructuring, mapping, sorting, and rendering. Record these as `response-consumed` evidence.

For a SPA, trace only the relevant return value and its direct consumers; do not scan the entire component tree unless necessary.

A request without `$select` still retrieves a broader payload. Do not claim that consumed properties are a complete allowlist. Recommend adding an explicit `$select` and rerunning the analysis.

### Do not count

Do not treat these as Dataverse columns:

- OData control tokens such as `$select`, `$filter`, `$expand`, `$top`, and `$skiptoken`
- Annotation suffixes such as `@OData.Community.Display.V1.FormattedValue`
- JavaScript-only presentation properties created after retrieval
- Type/interface properties with no demonstrated runtime use
- GUID values or route keys
- HTTP headers
- Unresolved computed object keys

For dynamic fields, record the expression and mark the result `Needs review`; never guess its value.

## Step 6 — Match EntitySetName to site-setting logical name without schema

Build the association from evidence in the downloaded site. A loose match is a candidate, not proof.

For both endpoint entity sets and site-setting table tokens:

1. Lowercase and trim.
2. Remove only separators for comparison (`_`, `-`, spaces); preserve the original value for output.
3. Compare publisher-prefixed names without dropping the prefix first.
4. Generate conservative EntitySetName variants: exact token, trailing `s` removed, trailing `es` removed, and trailing `ies` changed to `y`.
5. Prefer exact normalized matches and simple plural variants such as `account` ↔ `accounts` and `contoso_order` ↔ `contoso_orders`.
6. Use supporting evidence from request wrapper names, nearby variables, payload `@odata.bind` targets, comments, types, and matching field-setting references.

Assign confidence:

- `High`: exact normalized match, or a single unambiguous simple plural match.
- `Medium`: one loose match supported by nearby code evidence.
- `Low`: multiple candidates or a weak linguistic match.
- `Unmatched`: no defensible candidate.

Never use edit distance alone to merge two table groups. Never merge different publisher prefixes merely because their suffixes match. Keep ambiguous entity sets in separate rows and list candidate settings. Irregular EntitySetName values can remain unmatched; absence of schema is not permission to guess.

## Step 7 — Compare observed use with configured fields

For each high- or medium-confidence table group, calculate:

- **Observed read fields**: fields used by read projections, predicates, ordering, grouping, expansions, or response consumption.
- **Observed write fields**: fields sent by create or update requests.
- **Suggested explicit fields**: the deduplicated union of defensible direct-table read and write candidate logical names, sorted alphabetically.
- **Missing fields**: observed fields absent from an explicit `Webapi/<table>/fields` value.
- **Unused configured fields**: explicitly configured fields not found in any inspected OData request.
- **Needs review**: dynamic fields, lookup normalizations, unresolved expansions, no-`$select` reads, low-confidence table matches, and fields that may come from `UseFieldsFromView`.

Comparison is case-insensitive, but output must preserve the spelling used by the site setting or code.

Apply these qualifications:

1. For `fields = *`, do not call any wildcard-provided field `unused`, because the wildcard is not enumerable. Instead, provide the observed union as the proposed replacement and label its completeness.
2. If `UseFieldsFromView = true`, do not call an observed field missing unless the exported view definition proves it is absent. Report it as `Verify in system view`.
3. An unused configured field is a remediation candidate, not an automatic deletion. It may be used by native forms, lists, another site asset that could not be parsed, dynamically generated code, or external callers.
4. Fields observed only in `$filter` or `$orderby` still count as used. If a system view supplies fields, remember that filter-only or sort-only columns are not supplied by that view unless displayed in it.
5. Keep read and write usage visible so the user can validate Column Permissions and CRUD needs separately.
6. If bundles are minified or source is incomplete, downgrade completeness and do not describe the allowlist as exhaustive.
7. For SPA sites, account for centralized request clients and all statically reachable production routes before marking configured fields unused.
8. For traditional sites, account for all active components and referenced site-owned web files before marking configured fields unused.

Assign scan completeness per site:

- `High`: primary source is readable, request wrappers and active runtime paths were traced, and no material dynamic query/payload construction remains.
- `Medium`: most source is readable but some dynamic construction, inactive-route uncertainty, or unavailable consumers remain.
- `Low`: only bundles are available, source is minified, major URLs/payloads are dynamic, or active component/route coverage is uncertain.

Only produce possibly-unused field candidates at `High` completeness.

## Step 8 — Produce the remediation report

Write `<SolutionOrSiteName>.webapi-field-usage.md` beside the input archive or in the site-export root.

Start with a scope statement:

- Site classification and selected scan plan for each site
- Assets and production paths inspected, plus folders deliberately skipped
- Any reason the scan expanded beyond its selected plan
- Whether source was complete, bundled/minified, or partially dynamic
- Scan completeness rating
- Number of unique OData request shapes found after deduplication
- Number of wildcard settings found
- Explicit statement that this is static evidence, not proof of all runtime usage

Then provide one row per matched table and one row per unmatched entity set:

| Site | Site type | Site-setting table (logical name) | OData entity set | Match confidence | Operations | Observed read fields | Observed write fields | Current field setting | Suggested explicit fields | Missing / verify | Unused configured fields | Needs review | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Table requirements:

- Group all requests for the same matched table into one row.
- Separate field names with `<br>` for readability.
- Show `None observed`, `Not enumerable (*)`, `Unknown (view not exported)`, or `Unmatched` instead of leaving ambiguous cells blank.
- Evidence must cite request method, source asset, line, short endpoint excerpt, and site-setting component anchor.
- For SPA evidence, prefer original source and optionally include the production route, hook, or service name.
- Do not paste request data, record values, secrets, tokens, or PII.

After the table, include:

### Recommended setting changes

For every wildcard table with a sufficiently complete high- or medium-confidence inventory, show the proposed value:

`Webapi/<logical-name>/fields = field1,field2,field3`

Label it `Candidate — validate before deployment`. If the evidence is incomplete, state exactly why and do not present the list as final.

### Missing fields

List fields used in code but absent from explicit configuration. Distinguish definite missing fields from fields that must be verified in a system view.

### Possibly unused fields

List configured explicit fields not observed in inspected OData requests only when scan completeness is `High`. Warn the user to validate native forms, lists, dynamic code, external callers, and runtime telemetry before removal.

### Unmatched and dynamic requests

List unresolved EntitySetName mappings, dynamic URLs, dynamic projections, dynamic payload keys, and no-`$select` requests. Give the exact local evidence needed for manual resolution.

## Step 9 — OverPage finding integration

When this add-on runs during an OverPage review:

- Raise a high-impact Security finding for each confirmed `Webapi/<table>/fields = *` setting.
- Use rule `webapi-fields/deprecated-wildcard`.
- Anchor the finding to the site setting and relevant OData request code.
- In the fix, reference the report's table-specific candidate allowlist rather than claiming it is automatically safe.
- Use `webapi-fields/missing-explicit-field` for definite code/configuration mismatches.
- Use `webapi-fields/possibly-unused-field` only as a low-impact Maintainability item when scan completeness is `High`.

Do not raise a missing-field finding when `UseFieldsFromView` hides the effective allowlist. Do not raise an unused-field finding from incomplete or minified source.

## Hard rules

- Classify each site before scanning and run only its selected scan plan unless evidence requires a targeted expansion.
- Focus only on OData Web API request field usage and matching it to Web API field configuration.
- Do not require or query Dataverse schema metadata unless the user separately asks for metadata validation.
- Do not fabricate logical names, EntitySetName mappings, expanded-table identities, or dynamic fields.
- Do not silently merge low-confidence table matches.
- Do not treat a static scan as proof that a field is safe to remove.
- Do not include AI summary/search API payload properties in this field inventory.
- Treat wildcard remediation as required, but treat the generated replacement list as a candidate until tested across all user journeys and CRUD operations.
- Recommend least privilege and explicit Column Permissions where sensitive or writeable columns are involved.
- Prefer React source over compiled output; never double-count source and bundle copies of the same SPA request.
- Do not spend compute recursively scanning dependencies, vendor bundles, CSS, images, or irrelevant site artifacts.
- Keep all artifacts local.
