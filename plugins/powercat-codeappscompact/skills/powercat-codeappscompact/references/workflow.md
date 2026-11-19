# Scaffold and verify

Keep this folder complete. v3.1R uses npm-compatible runtime version `3.1.0-r.1`. Runtime code and declarations are prebuilt; no source repository or runtime build is required.

## New app

```powershell
node "<skill>\scripts\create-app.mjs" "<new-app>" --name "Workspace" --local-only --profile aggregate --port 5173 --dry-run
```

Review, then omit `--dry-run`. Use `aggregate` for list/details/custom drafts, `--definition <typed-folder>` for integrated flat CRUD, `example` for the neutral flat scaffold, or `minimal` for a custom shell. For authorized hosting replace `--local-only` with `--environment <authorized-guid>`; never fabricate a tenant ID. Scaffolding does not install, sign in or publish and refuses existing destinations.

Generated apps contain their vendor runtime, styles, types, app checks and unique demo storage key. They do not depend on the source skill's location. Author only the domain and necessary composition; use the selected cards and contracts.

## Existing app

Inspect its tooling and existing kit first. With permission to install the local dependency, use `node "<skill>\scripts\setup.mjs" "<app>"`. It supports standalone npm apps with restored compatible peers, refuses conflicting or modified installations, and never replaces an existing kit. Otherwise follow the app's approved package-manager workflow.

## App checks

From the generated app, run `npm run check:dependencies` before restore. An absent lock is reported; a stale lock fails explicitly. Do not copy another release's lockfile. After a manifest change or missing-dependency failure, restore approved dependencies with:

```powershell
npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund
npm run verify
npm run dev
```

`verify` runs preflight, build/type checks, lint, domain tests and browser checks. Each stage stops on failure; individual npm scripts can rerun affected checks. `verify:local` is an alias for the same local-only checks. Confirm the development server responds; do not stop another process to obtain its port.

Replace scaffold assertions with the user's requirements. Reuse the app's browser harness, exact-label controls and `recordFlowDetails` adapter. Independent scenarios share one test-owned server but receive fresh browser/storage contexts; only multi-tab cases share context. Shared startup preflight reports blocked cases instead of repeated prerequisite failures. Verify rejected saves, persisted values after reload, applicable concurrency, keyboard access and mobile layouts. Starter checks are not proof of a completed business app.

Browser checks use an installed Edge browser by default; `CODECOMPACT_BROWSER_CHANNEL` selects another approved installed channel. A missing browser is an error, not permission to install one. Only test-owned resources are closed. Results remain local under `evidence`; they do not prove authenticated Local Play. Verify authorized hosted workflows separately with approved tools. No included command publishes.
