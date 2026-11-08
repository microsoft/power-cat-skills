---
name: powercat-codeappscompact
description: Build React/TypeScript Power Apps Code Apps using bundled workspaces or nested-record editors, atomic synthetic storage and independent acceptance. Supports explicitly unbound local-only apps. Not for deployment.
license: MIT
compatibility: Node.js 22.18+, an authorized app destination, and approved execution/browser tools. A tenant environment is needed only for authenticated Local Play. Copy the complete portable folder. A skill grants no permission.
metadata:
  version: "2.7.0"
  distribution: "lean"
---

# PowerCat-CodeAppsCompact 2.7 (lean)

Reuse working infrastructure; author domain rules, fixtures, views and independent assertions. Do not copy a previous benchmark app or hide repairs. Browser-local persistence is synthetic-demo storage, not production authorization.

Portable distribution with unchanged 2.7.0 runtime APIs. Keep this folder complete; scaffolding resolves bundled assets relative to the skill, with no repository checkout or runtime rebuild. Development sources, standalone examples, maintainer tests, generated API snapshots and benchmark-only tooling are omitted. API lookup reads the shipped declarations directly. The runtime package remains private; sharing this skill does not publish an app.

## Choose once, then scaffold

For nested records, approvals, ledgers or atomic multi-record commands use **`--profile aggregate`**. Its neutral example already wires typed nested drafts, accessible fields/dialogs, errors, discard confirmation, duplicate-submit protection, stale revisions, cross-tab refresh, tables and CSV. Replace the neutral domain and tests, not that infrastructure. Read only [aggregate authoring](references/aggregate.md) and `api-reference.mjs aggregate-ui`; consult the `aggregate` signature only for tables/storage/CSV. Do not rebuild form or persistence lifecycle in every app.

For flat CRUD use `--definition <typed-folder>` / the integrated workspace; read [authoring](references/authoring.md). `--profile minimal` is a custom-shell escape hatch, not the default for a multi-module aggregate app. Use the [catalog](references/catalog.md) for other capabilities; do not dump all sources, signatures or maintainer tests into model context.

```text
node "<skill>\scripts\create-app.mjs" "<new-app>" --name "Workspace" --local-only --profile aggregate --port 5173 --dry-run
```

Review, then omit `--dry-run`. For authorized authenticated hosting, replace `--local-only` with `--environment <authorized-guid>`. Never supply both or fabricate a tenant ID. Local-only scaffolds have an empty environment, no host/SDK-context request, and local `verify`/`finalize` defaults. The official SDK/plugin remain available for an explicitly authorized hosted scaffold. No command deploys.

Scaffolding never overwrites, installs, executes definitions or changes existing processes. Keep vendor assets and lockfiles project-local. Restore only after a manifest change or missing-dependency failure with approved npm and `--install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. No denial or registry-policy bypass.

## Verify without serial repair churn

Freeze the user's acceptance criteria before implementation. Use `withBrowserScenarios` with independent cases: fresh synthetic storage per scenario, one test-owned server, all independent failures returned together. Share one context only inside a multi-tab scenario. Assert meaningful persisted/domain outcomes; starter checks are not a business-app acceptance contract. Use visible labels, exact field names and a narrow dialog/table scope. Do not change criteria or discard legitimate failures to make a run pass.

After authorized startup confirm responsiveness. Run `npm run verify:local -- --out <new-run>`; repair the collected failures together, then `--resume <run>`. Under the bundled build contract, a browser-entry-only edit reuses a matching build; lint, unit and browser coverage remain conservative. Source/configuration/dependency changes invalidate relevant evidence. Never rerun toolkit-maintainer tests per app. Do not repeatedly restore dependencies or read entire logs when a scoped failure report is sufficient.

Authenticated scope requires the actually authorized Mesh/CDP route and fresh scoped host evidence; see [host verification](references/host-verification.md) only then. Localhost is never authenticated Local Play. Permission denials are final, not fallback triggers.

## Meter and finish once

When costs are requested, retain the original start and repair-inclusive phase markers as explicit-zone ISO timestamps. Use observed per-call usage, not source size or estimated tokens. Finalize once with `npm run finalize:local -- --resume <run> --events <authorized-stream> --phases <original-markers> --usd-per-credit <explicit-rate>`; hosted scope uses `finalize` and its fresh receipt. Missing usage/pricing is unavailable, not zero. Use the finalizer's outcome, cutoff and table directly; no reporting-only accounting loops. Later calls/replies are outside the stated completed-call cutoff.

Report passed, failed and unverified scope honestly. Savings require matched repeated builds; a smaller source tree, repaired infrastructure or different cache mix does not prove a USD reduction. This 2.7 lean distribution is not an upstream release. Skill installation, dependency installation and publishing require their own authorization.

## 2.7 aggregate view defaults

Reuse `DetailTable`, `MetricGrid` and `Calendar` before authoring equivalent related-record tables, metric cards or UTC schedules. They ship with phone layout, labelled tables and correct heading levels. Use `FormSelect` for identity/persona controls, not a bespoke label wrapped around options. Keep shipped aggregate hover/active colors together. DataTable resets on schema/drill-down changes without remounting parent drafts. Read aggregate.md for these contracts; business rules and independent acceptance remain app-owned. These general-purpose views contain no application-specific fixtures or workflows.
