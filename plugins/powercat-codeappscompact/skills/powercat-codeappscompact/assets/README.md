# CodeAppsCompact 2.7.0

Prebuilt React/TypeScript controls for Power Apps Code Apps. This lean runtime package contains JavaScript, TypeScript declarations, styles and the MIT license. Keep it in the app's vendor folder; no source repository, runtime rebuild, nested archive or registry publication is needed.

Use the skill's `scripts\api-reference.mjs <capability>` to read signatures directly from the shipped declarations. The runtime version and exported APIs are unchanged from 2.7.0. Development sources, standalone examples and duplicate API documents are not included.

The `codeappscompact/aggregate` entry point supplies tables, CSV, atomic synthetic transactions, accessible nested editors and draft guards, cross-tab state, related-record tables, metrics and calendars. Import `codeappscompact/aggregate.css` for its styles. The workspace, collections, validation, authoring, display, reference, demo, host and recipe entry points remain available. Applications supply their own domain rules, fixtures and independent acceptance criteria.

Peers: React >=18.3.1 <20, TanStack React Query >=5.90.5 <6 and Power Apps SDK ^1.5.0. Skill tools require Node >=22.18. They are separate from this private runtime package and do not grant permissions or publish apps.

Browser-local persistence is unencrypted synthetic-demo storage, not shared production storage or a secret store. Local preview and mock SDK contexts are not authenticated Local Play. Smaller packages do not establish lower model costs.

Licensed under [MIT](LICENSE).
