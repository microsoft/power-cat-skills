# Integrated CodeAppsCompact v3.1R app

Uses the stock accessible workspace and browser-local synthetic data. Definitions are in `src\definition`; independent domain/browser assertions are in `tests`. Collections, navigation, global counts, queries and flat-editor guards are already wired. Use the aggregate profile for nested drafts.

Run `npm run check:dependencies` before an approved restore. After manifest changes or missing dependencies, use `npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`.

`npm run verify` runs preflight, build/type checks, lint, domain tests and isolated browser checks; `verify:local` is the same local scope. `npm run dev` starts the configured loopback server; confirm it responds. Browser checks use installed Edge by default and close only their own resources. No command authenticates or publishes; verify hosted behavior separately with approved tools.

Reuse authoring/reference helpers rather than repeating mappings. Structural rules belong in `validate`; transition/time-sensitive rules belong in `validateMutation`. Keep assertions independent of implementation and replace scaffold coverage with the user's actual requirements.

Keep `vendor\codeappscompact-3.1.0-r.1`, the lockfile and tools; no source skill path is required. Synthetic storage is not production authentication or authorization.
