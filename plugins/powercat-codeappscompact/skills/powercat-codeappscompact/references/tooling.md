# Focused authoring and verification

Tools remain local and permission-bound. They never install a skill, grant access, upload code/telemetry, enable browser debugging or bypass a denial.

## Scaffold once

`create-app.mjs <new-app> --name <name> (--local-only | --environment <authorized-guid>) --profile aggregate [--port 5173] [--dry-run]` copies prebuilt assets, generic nested editor/state wiring and neutral example assertions. Use `--definition <folder>` for integrated flat workspaces; minimal/example profiles remain. Scaffolding never overwrites, executes a definition, installs dependencies or changes processes. `setup.mjs` supports existing standalone npm apps and refuses conflicting vendor contents.

Local-only is a real scaffold mode: environment ID is empty, the host status is explicitly standalone, SDK context/plugin host work is disabled, and default preflight/verify/finalize scripts remain local. The official SDK/plugin packages remain included for a separately authorized hosted workflow. A host request always requires an actual environment; a local-only flag cannot satisfy it. Do not patch tools or invent a GUID to use localhost.

Restore only after manifest changes or missing-dependency failures with approved npm and `--install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. No TLS/registry/peer-policy bypass.

## One workflow, one final report

`npm run verify:local -- --out <new-run>` requests build, lint, unit and local browser acceptance. Fix all independently reported failures coherently and resume via `--resume <run>`. `finalize:local` resumes those checks and, when requested, closes one immutable accounting snapshot with the original phase markers. Use its result directly instead of extra reporting-only turns.

Only environment-bound scaffolds default `verify`/`finalize` to authenticated Local Play. Choose the authorized `--host-route mesh-uia|mesh-browser` or existing `--cdp-url`; host access denials never trigger a route fallback. Observe the emitted request once and provide a fresh receipt. Start the owner-authorized live app separately and confirm responsiveness; the host workflow does not manage existing processes. The browser test harness, separately, owns and closes its isolated ephemeral preview and browser.

Stages remain explicit passed/failed/blocked; exit codes are 0/1/2. Missing checks never count as completion. Localhost, sign-in or mock contexts never prove authenticated Local Play. Report an unchanged external blocker once rather than polling through model turns.

## Evidence and retained scopes

`--out` requires a new folder; `--resume` requires the same app, 2.6 format and execution mode. Required scopes cannot be dropped. Never relabel 2.5 evidence as 2.6.

Fingerprints cover source, vendor/installed kit, dependencies, configuration, tests, tools and runtime. Reuse additionally requires intact evidence and unchanged build output. For the exact bundled compiler/Vite configuration, build fingerprints omit only the standalone `tests\browser.mjs` entry when no source/test dependency references it. Custom configuration, build commands, dynamic imports or an import of that browser entry retain the conservative full test fingerprint. Lint and unit checks continue to include all tests. This is not a cache hit claim about model billing.

Preflight/server/host/accounting remain live. Mesh receipts are fresh, scoped and single-use. `--fresh` reruns checks after external state changes that file hashes cannot establish. Mid-run edits invalidate evidence. An exclusive `.run.lock` prevents parallel verifiers; do not remove an unknown lock or kill an existing process. In-app artifacts belong under `evidence`. Fingerprints are integrity checks, not security signatures.

## Independent browser scenarios

`withBrowserScenarios(options, scenarios)` gives each unique check ID its own clean context, runs every independent case before reporting failure and uses one test-owned server/browser. The acceptance IDs must exactly match the runnable cases. A scenario failure remains failed; unrelated cases still run. Create both tabs inside one scenario for conflict tests. `prepare(context, base)` permits corruption/quota setup before navigation; `seedLocalStorage(context, base, {key: serializedValue})` seeds only empty keys on the exact app origin, never about:blank or browser-internal frames. Never share mutated fixtures across independent checks.

Use `localOnly: true` for synthetic local apps: external HTTP(S)/WebSocket traffic is blocked and fails the case; browser-internal `edge:` download pages are not app network requests. Checks include exceptions from each scenario's pages. Use a selected installed browser channel, never silently install one.

Legacy `withBrowserHarness` and `runAcceptance` preserve their shared-scenario behavior for existing apps. Existing CRUD/rejected-save/conflict helpers remain compatible; their collection-oriented selectors are for the integrated RecordScreen profile. Aggregate editors use actual dialog/field bindings and independent persisted/domain assertions. Do not force a collection helper onto a different UI or count neutral starter checks as domain coverage.

See [accounting](accounting.md) for phase scope, budget gates and cost-reporting limitations. Runtime JavaScript and declarations are prebuilt. The lean distribution needs no toolkit build and omits maintainer sources, tests, standalone definitions and benchmark-comparison tooling.
