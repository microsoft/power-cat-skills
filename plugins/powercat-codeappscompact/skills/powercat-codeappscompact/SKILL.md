---
name: powercat-codeappscompact
description: Build general-purpose React/TypeScript Power Apps Code Apps with typed workspaces, thin authoring helpers, reusable acceptance, permission-bound Mesh/CDP host verification and one-command metered finalization. Not for Canvas Apps, model-driven apps or deployment.
license: MIT
compatibility: Node.js 22.18+, an authorized app destination/environment, and approved local execution/browser tools. Copy the complete portable folder. A skill grants no permission.
metadata:
  version: "2.3.0"
---

# CodeAppsCompact

Author collections, rules, fixtures and independent acceptance cases; reuse the rest. The objective is lower total model cost than 2.0 with equivalent features and verification, not fewer tests. Keep business policy and production authorization app-owned. Browser-local persistence is synthetic-demo storage only.

## Read and author narrowly

Use the [catalog](references/catalog.md) to select ONE needed guide/signature; do not read the full API/source/test tree by default. `scripts\api-reference.mjs <capability>` returns only that declaration-derived API. For a new demo prefer `workspace` plus the small `authoring` helpers: reference bindings, sortable columns and filters from existing field options. Stock theme/navigation/query integration are already wired; custom React and authorized real adapters remain escape hatches.

Create an ordinary TypeScript definition folder exporting `createWorkspace(storageKey)`, with domain/data modules and independent `tests\domain.test.ts`, `tests\acceptance.mjs`, `tests\acceptance.json`. Include `tests\local-play.json` when a saved-edit host check is required. See [authoring](references/authoring.md); the neutral example is optional.

```text
node "<skill>\scripts\create-app.mjs" "<new-app>" --name "Workspace" --environment "<authorized-guid>" --port 5173 --definition "<app-definition>" --dry-run
```

Review, then omit `--dry-run`. No overwrite, installation, definition execution or process changes occur. Keep the vendor kit/lockfile project-local. Restore only after a manifest change or missing-dependency failure, using authorized npm with `--install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. Never bypass a denial or registry/peer policy.

## Verify, then finalize once

Choose the actually authorized browser route early; never enable debugging to fit tooling. After authorized server startup, `npm run verify -- --host-route mesh-uia --out <new-run>` requests local AND authenticated scopes together. `mesh-browser` or an explicitly authorized existing `--cdp-url` are alternatives, not fallbacks after denial. Mesh decisions remain authoritative. Follow the emitted scoped host handoff with Mesh tools; the scripts do not invoke Mesh or grant access. See [host evidence](references/host-verification.md) only for that route.

Reuse CRUD, draft, conflict, storage, responsive and `rejectedSaveScenario` helpers. Supply real independent domain assertions. Fix the specific failure, then resume; intact fingerprinted local checks are reused, host evidence is always fresh and single-use. Report unchanged blockers once. Do not rerun maintainer suites per app or restore portability after every field edit. Never count localhost, CLI sign-in or mock SDK results as authenticated Local Play.

When costs are requested, mark the original run start before setup and keep the phase file open across repairs. Batch phase markers with the next authorized operation. Finish with ONE `npm run finalize -- --resume <run> --host-receipt <fresh-mesh-receipt> --events <authorized-stream> --phases <original-markers> --usd-per-credit <explicit-rate>` (omit receipt for CDP). This resumes outstanding checks, closes an immutable accounting snapshot and prints the final table/paths together. Use that result directly; do not regenerate accounting or perform extra reporting-only inspection. Missing usage is unavailable, not zero; blocked/failed results are not completion. See [tooling](references/tooling.md) or [accounting](references/accounting.md) only as needed.

Report actual outcomes and gaps. Later generation/final replies are outside the explicit completed-call cutoff. A budget blocks outstanding work, never silently skips it. Cost savings require repeated matched builds; `compare-runs` can enforce a strictly lower median or a stronger percentage target against 2.0. This local 2.3 derivative is not an upstream release or Mesh installation.
