# Neutral Code App example

Generated with CodeAppsCompact **v3.1R** and `--profile example`. Synthetic Requests/Projects demonstrate relationships, notes, UTC fields, validation, guarded edits, search/filter/sort, mobile cards and metrics. Replace this example's domain and tests with the actual requirements.

Domain types and rules: `src\domain.ts`. Collections: `src\collections.tsx`. Repository: `src\repository.ts`. Shell: `src\App.tsx`. Reuse the shipped controls and safeguards; keep structural validation separate from transition/time-sensitive mutation rules.

## Run and check

From the app folder, check dependencies before an approved restore:

```powershell
npm run check:dependencies
npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund
npm run verify
npm run dev
```

Restore only after manifest changes or missing-dependency failures. `verify` runs preflight, build/type checks, lint, domain tests and isolated browser checks; `verify:local` is the same local scope. Use individual scripts for affected checks during development. Confirm the configured loopback server responds. No command signs in or publishes; authenticated Power Apps behavior requires separate authorized verification.

Keep the generated lockfile, app-local tools and `vendor\codeappscompact-3.1.0-r.1`. No source skill path is needed. Browser checks use installed Edge by default and close only their own resources.

Use `add-collection.mjs --dry-run` to preview typed stubs without rewriting the app. Preserve failed/stale drafts and route navigation through the shared guard. Never silently reset corrupt data. Browser-local demo storage is not live business data, authentication or a secret store.
