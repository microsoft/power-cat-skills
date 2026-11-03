# CodeAppsCompact 2.3.0

Prebuilt portable React/TypeScript controls and optional helpers for data-driven Power Apps Code Apps. Keep this complete package (`dist`, theme, declarations, examples and licenses) in the app's vendor folder. No repository checkout, kit build, archive or registry publication is needed.

Read the skill catalog and only the selected declaration-derived signature. `API.txt` remains a compatibility reference, not a mandatory whole-document read. Core RecordScreen/fields/errors/navigation/shell APIs and optional workspace, collections, display, reference, demo, host and recipe entry points remain compatible.

New in 2.3: optional `codeappscompact/authoring` provides `referenceBinding`, `bindReferences`, `columnsFor` and `selectFilter`. These return existing typed contracts and reduce repeated ID/label/field mappings, render/sort accessors and filter option lists. No business status/resource/policy is inferred and no runtime dependency is added. `PowerAppsHostStatus` can display a non-identifying scoped challenge only after SDK-authenticated framed context; ordinary URLs remain compatible. Forms expose dirty/saving state for safe host probes.

The complete skill (outside this runtime package) also includes integrated scaffolding, reusable rejected-save acceptance, explicit Mesh/CDP host handoffs, reversible synthetic edit bindings, one-command finalization and a matched-run cost gate. Tools are not runtime npm dependencies. Domain assertions/permissions remain app-owned.

React >=18.3.1 <20, TanStack React Query >=5.90.5 <6 and Power Apps SDK ^1.5.0 are peers. Node >=22.18 supports the tools. Legacy flat drafts/selects/cursor services and explicit loaded-only search remain supported. Custom React and authorized real adapters remain escape hatches.

Browser-local storage is a small unencrypted synthetic demo, not shared production storage or a secret store. UI eligibility and receipts do not grant authorization. Preview, CLI sign-in and mock SDK contexts are not authenticated Local Play. Cost savings require repeated equivalent complete builds, not source size or green toolkit tests.

Licensed under [MIT](LICENSE).
