# Focused authoring and verification

Tools remain local and permission-bound. They never install a skill, grant access, upload code/telemetry, enable browser debugging or bypass a denial. Use only the selected authorized route.

## Scaffold once

`create-app.mjs <new-app> --name <name> --environment <guid> --definition <folder> [--port 5173] [--dry-run]` copies typed definitions, independent tests, prebuilt vendor files and complete wiring without executing a definition. Minimal/example profiles remain; existing apps retain their own infrastructure. `add-collection --dry-run` creates opt-in stubs, not automatic rewrites. `setup.mjs` reuses identical vendor contents and refuses conflicts.

Restore dependencies only after a manifest change or missing-dependency failure using the permitted npm workflow with `--install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. No TLS/registry/peer-policy workaround is allowed.

## One workflow, then one final report

Generated `npm run verify` and `npm run finalize` BOTH request browser acceptance and authenticated Local Play. `verify:local` explicitly requests only local checks; it is not an authenticated app outcome. Start the configured app server separately through an authorized action and confirm it is responsive. The verifier never starts/stops a server or browser.

```powershell
npm run verify -- --host-route mesh-uia --out ".\evidence\verification-01"
# After the actual Mesh host observations, finish all remaining scopes and accounting together:
npm run finalize -- --resume ".\evidence\verification-01" --host-receipt ".\evidence\verification-01\mesh-receipt.json" --events "<authorized-events>" --phases ".\evidence\phases.json" --usd-per-credit 0.01
```

Use `mesh-browser` if it is the authorized signed-in route, or `--cdp-url <explicitly-authorized-existing-loopback-origin>` for CDP. Route selection is not evidence or permission. Read the emitted host request/template; see [host evidence](host-verification.md) only if needed. Mesh denials are retained and cannot trigger fallback. Host and saved-edit scope are retained from the beginning, even if Windows is locked or the browser is unavailable.

Stages: early route prerequisite, preflight, app build/lint/domain tests, requested isolated browser acceptance, optional portability, live server/host checks, and requested provider accounting. Output is a compact passed/failed/blocked result; full logs remain in immutable attempt folders. Exit codes: 0 passed within requested scope, 1 failed, 2 blocked. Every missing/failed/blocked stage remains explicit. Finalization prints that outcome, saved-edit status, the input/output/total table, cutoff and artifact paths. Use it directly rather than running extra report-only model turns.

On code failures, repair only the reported cause and resume the same run. On an unchanged external blocker, report it once; no repeated polling through model turns. `--timeout-ms` bounds server/CDP readiness (100-120000; default 10000). The live host driver waits boundedly for frame/SDK readiness. No preview, CLI sign-in or synthetic test driver establishes authentication.

## Evidence and retained scopes

`--out` requires a new folder. `--resume` requires the same app, current 2.3 format and execution mode. Required scopes cannot be dropped. Use fresh evidence after upgrading older verification tools; don't relabel their results as 2.3.

Fingerprints cover app source, kit (vendor AND installed), dependency lockfiles, configuration, tests/acceptance, tool code and runtime. Reuse requires identical inputs, intact artifact hashes and unchanged build output. Source/tests changes rerun affected app checks; dependency/vendor/config changes also affect portability. Preflight/server/host/accounting remain live. Mesh receipts are fresh observations of a pending one-use challenge, not reuse of an old passed host check. The final report points to an immutable attempt checkpoint.

An exclusive `.run.lock` prevents parallel verifiers. Do not remove an unknown lock or kill a process. After a crash, inspect the exact lock before an authorized targeted removal. Checkpoint writes use bounded atomic replacement; a persistent sharing failure is explicit, never a permission workaround. Mid-run input changes invalidate the attempt. In-app output belongs under `evidence`; external dedicated folders are supported. Fingerprints are integrity checks, not security signatures.

`--fresh` reruns app checks after external state changes that fingerprints cannot prove (such as a browser/backend update). A repeated clean portability restore needs a NEW destination. `--portability-destination <new-isolated-folder>` explicitly requests the approved clean-restore workflow when vendor/dependencies change, not on every field edit.

## Reusable acceptance

The harness owns only its ephemeral preview server and isolated browser/context; it closes only those resources and emits `authenticatedLocalPlay:false`. It never targets the live Mesh host, existing app ports or private profiles. Use the explicitly selected installed browser channel; don't silently install one.

Reuse `crudScenario`, `draftScenario`, `conflictScenario`, `storageScenario`, `responsiveScenario`, `previewScenario`, and `rejectedSaveScenario`. The last takes collection/storage bindings, optional `recordLabel` for an edit, explicit invalid `values` and `errorText`, plus optional independent `assertUnchanged`. It checks visible error, unchanged full persisted state and preserved draft before discarding the test draft. No custom per-domain rejected-save plumbing is needed. The harness requires every acceptance ID to actually run; expected business answers must remain independent.

See [accounting](accounting.md) for phase scope, one-cutoff finalization, optional metered budgets and matched cost gates. A budget blocks outstanding work; it never omits tests to appear cheaper.
