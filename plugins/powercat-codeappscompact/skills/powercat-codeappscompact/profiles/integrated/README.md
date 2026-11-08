# Integrated PowerCat-CodeAppsCompact 2.7 application

This app uses the stock accessible workspace and browser-local synthetic data. Definitions are in `src\definition`; independent assertions and host/acceptance bindings are in `tests`. Collections, navigation, counts, query refresh and flat editor guards are wired. Nested drafts should use the aggregate profile instead of forcing them into flat contracts.

Restore approved dependencies with `npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. Start the configured server and confirm responsiveness. A `--local-only` scaffold remains unbound: `preflight`, `verify` and `finalize` request only local scope. No tenant GUID, host request or deployment is needed. Use `verify:local` and `finalize:local` to make that scope explicit.

For an environment-bound scaffold only, `npm run verify -- --host-route mesh-uia --out <new-run>` also requests authenticated Local Play. Observe the emitted request with the authorized tools; other explicitly authorized routes are alternatives, never bypasses after denial. `npm run finalize -- --resume <run> --host-receipt <fresh-receipt>` completes the same scopes. Add original usage/phase inputs and an explicit USD rate when costs were requested; omit the receipt for explicitly authorized CDP. Keep repair calls within the original boundaries and finalize once.

A `tests\local-play.json` binding requests a reversible synthetic saved-edit check. Without it, do not claim edit/reload evidence. Local preview cannot prove authentication. No command publishes.

Reuse authoring/reference helpers rather than repeating mappings. Keep structural checks in `validate` and transition/time-sensitive policies in `validateMutation`. Business expectations must be independent of implementation. Keep vendor files, lockfile and tools; no source skill path is required. Production authentication and authorization remain app-owned.
