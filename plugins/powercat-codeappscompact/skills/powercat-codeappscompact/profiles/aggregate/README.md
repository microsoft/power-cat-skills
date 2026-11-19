# Aggregate starter

Generated with CodeAppsCompact **v3.1R**. This synthetic notes scaffold uses `RecordFlow` for list -> details -> guarded editor -> confirmed save, `DemoShell` for the demo-user selector, `FormChoice` for closed choices and shared modal focus containment.

Replace `src\domain.ts`, the typed mappings in `src\App.tsx` and the domain/browser assertions. Import the prebuilt controls; do not rebuild table routing, dialog state, revision capture or focus traps. Use `onFormStateChange` and the parent navigation guard. Keep editors mounted across background updates. Decoders validate the full stored graph; commands enforce business rules before one atomic write.

From the app folder, run `npm run check:dependencies` before an approved restore. After manifest changes or missing dependencies, use `npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`.

`npm run verify` runs preflight, build/type checks, lint, domain tests and isolated browser checks; `verify:local` is the same local scope. `npm run dev` starts the configured loopback server without replacing other processes. Confirm responsiveness. Local-only scaffolds stay unbound; no command authenticates or publishes.

Browser scenarios cover the scaffold's create/edit/reload, draft protection, cross-tab conflicts and responsive accessibility, not the finished app's business requirements. They use installed Edge by default and close only test-owned resources. Keep `vendor\codeappscompact-3.1.0-r.1`, tools and the lockfile; the source skill folder is not needed to restore or build.
