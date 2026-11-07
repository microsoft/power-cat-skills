# Aggregate starter

Generated with CodeAppsCompact **2.7.0**. This neutral notes example demonstrates nested drafts, stale-revision rejection, field validation, scoped reset and isolated acceptance. It is not the requested business application.

Replace `src\domain.ts`, the neutral fields/views and `tests\acceptance.json` with the actual domain and independent assertions. Reuse `DraftDialog`, `FormField`, `FormSelect`, `useTransactionState`, `DataTable` and the transaction store instead of rebuilding their lifecycle. A draft captures the revision at opening; never substitute a newer background revision. Use a new React key only for a newly opened draft, never for a background refresh or query change. Keep domain policies app-owned.

`npm run dev` binds to the generated loopback port and does not replace existing processes. `npm run verify:local` checks local behavior. For `--local-only`, `verify`, `finalize` and `preflight` also remain local and unbound: no synthetic tenant GUID, SDK context request or host handoff. The official SDK and Vite plugin remain dependencies; only an authorized environment-bound scaffold enables the plugin/host route. Nothing deploys.

Browser scenarios run in fresh contexts with a shared test-owned ephemeral server, collect all independent failures and close only their own browser/server. A multi-tab conflict scenario deliberately shares one context. A failing scenario never passes or changes the acceptance contract; other independent cases still run. Local-only checks block external HTTP/WebSocket requests and ignore browser-internal `edge:` resources.

Keep the vendor assets and lockfile. On a fresh machine restore approved dependencies with `npm ci --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund`. Do not rerun maintainer suites per generated app. Cost accounting is available through `finalize:local` with the original usage/phase inputs; file size is not a token or USD measurement.
