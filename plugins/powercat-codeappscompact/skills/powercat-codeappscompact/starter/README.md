# Neutral Code App example

Generated with CodeAppsCompact **2.7.0** and `--profile example`. Demonstrates synthetic Requests/Projects, labeled relationships, notes, UTC fields, shared validation, scoped refresh, filters/sorting, mobile cards and metrics. It is not production or a finished requested domain. Prefer an integrated app-owned definition for new multi-collection apps; use the minimal profile when no example model is wanted.

Domain types/data/rules live in `src\domain.ts`, collection configuration in `src\collections.tsx`, repository in `src\repository.ts` and shell in `src\App.tsx`. Keep shared constraints and query/navigation/storage infrastructure; replace the domain and its independent tests rather than copying another framework. Optional `codeappscompact/authoring` reference/column/filter helpers avoid repeated configuration.

## Restore, run, verify and finalize

The generator fills the title, explicit local-only mode or authorized environment, port and unique storage key and copies the prebuilt vendor kit/tools. A `--local-only` scaffold uses an empty environment and local default preflight/verify/finalize scripts; it requests no authentication or deployment. The hosted commands below apply only to an authorized environment-bound scaffold. Use `verify:local` and `finalize:local` for local work.

Review the manifest and use approved npm:

```powershell
npm install --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund
npm run preflight -- --require-free-port
npm run dev
```

Confirm the server is responsive. `npm run verify -- --host-route mesh-uia --out <new-run>` requests build/lint/domain/browser checks AND authenticated Local Play. Fulfil the emitted scoped host request with authorized Mesh tools. `mesh-browser` or an explicitly authorized existing CDP endpoint are alternatives, not fallbacks after denial. No debugging/profile/security settings are changed. A locked/unavailable/denied route remains blocked, not green.

Finish with `npm run finalize -- --resume <run> --host-receipt <fresh-receipt>`; add `--events`, original `--phases` and explicit `--usd-per-credit` when usage is requested. For CDP use the explicit approved endpoint instead of a receipt. The finalizer retains requested scopes and repairs, prints outcomes/costs/paths together, and closes only an immutable accounting snapshot. `verify:local` is explicitly local-only. Tests use an isolated ephemeral preview and report authentication false.

Add a synthetic reversible `tests\local-play.json` fixture binding if a saved edit must be verified inside the real host. Without it, a host pass does not imply saved-edit verification. Never edit production-side-effecting records or discard existing drafts to satisfy a probe. Authentication, publishing and production authorization are distinct outcomes.

## Extend without a new framework

`add-collection --dry-run` previews opt-in stubs and manual integration points for this existing-app profile; it does not rewrite infrastructure. Share scalar constraints between form/repository. Throw `ValidationError` for field errors. Keep timeless structure/references in `validate` and time-sensitive creation/rescheduling/transition rules in `validateMutation`; historical records must remain readable.

Retain stable collection identities and draft guards across sidebar/metric/router actions. Real services declare remote query operations; small browser-local collections need no artificial pagination. Preserve corrupt/incompatible data for explicit recovery/migration, never reset it silently. This is demo persistence, not a secret store or multi-user backend.

Keep the generated lockfile, app-local tools and `vendor\codeappscompact-2.7.0` for clean restores without the source skill. Replace this example's acceptance criteria with the actual domain contract; keep matched benchmark criteria identical. Reuse shared negative-save/CRUD scenarios and the reconciler. Unavailable usage stays unavailable; lower measured delivery cost must be demonstrated, not inferred from source size.
