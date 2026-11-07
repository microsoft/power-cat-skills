# Minimal Code App

Generated with CodeAppsCompact **2.7.0**. Contains the responsive shell, error boundary, query provider and verification tools; no domain or finished application. Prefer the integrated profile for flat CRUD or `--profile aggregate` for nested forms and atomic commands. Minimal is the custom-shell escape hatch.

`node .\tools\add-collection.mjs . --id inventory --title Inventory --dry-run` previews a typed stub/test and integration points. It never rewrites routes, repositories, manifests or acceptance. Supply domain rules and independent tests. Use existing navigation/editor guards; filtering and background refresh must not remount drafts.

Restore approved dependencies with `npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. `npm run dev` starts the configured loopback server without replacing processes. Confirm responsiveness.

A `--local-only` scaffold is explicitly unbound. `preflight`, `verify` and `finalize` remain local; use `verify:local` / `finalize:local` explicitly when documenting local results. No authentication is requested or claimed, no synthetic tenant GUID is needed and nothing deploys.

For an environment-bound scaffold only, `npm run verify -- --host-route mesh-uia --out <new-run>` requests local and authenticated scopes. Follow the emitted handoff with permitted tools, then finalize the same run with a fresh receipt. `mesh-browser` or an authorized existing CDP endpoint are alternatives, never bypasses after denial. Optional saved-edit host checks require independent synthetic bindings in `tests\local-play.json`.

Keep `vendor\codeappscompact-2.7.0`, tools and the lockfile. The source skill folder is not needed to restore/build. Preserve existing storage; browser-local synthetic data is not production authorization, shared storage or secret storage. When metering is requested, retain the original start/repair markers and finalize once.
