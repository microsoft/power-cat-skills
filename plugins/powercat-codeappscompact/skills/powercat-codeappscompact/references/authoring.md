# Integrated authoring

Author ordinary TypeScript collections, rules, synthetic records and independent acceptance cases. Reuse the stock workspace/theme and thin helpers; no schema language or inferred business policy is introduced.

## Definition contract

- Exactly one `index.ts` or `index.tsx` exports `createWorkspace(storageKey: string)` returning `defineDemoWorkspace<Drafts>(...)` from `codeappscompact/workspace`.
- Other `.ts`, `.tsx`, `.json` files are copied verbatim to `src\definition`. Keep deterministic fixtures with an explicit date anchor and valid relationships. No secrets/dependencies/tool scripts.
- `tests\domain.test.ts` contains independent domain assertions, importing plain TypeScript from `../src/definition/...`. Node type stripping does not execute JSX.
- `tests\acceptance.mjs` exports `scenarios` using app-local `../tools/acceptance-scenarios.mjs`. It can read the generated storage key from `src\app-config.json`.
- `tests\acceptance.json` declares unique `checks[].id` entries for every scenario, including domain negatives. The harness requires the exact set to run.
- When saved-edit host verification is requested, include `tests\local-play.json` binding one named synthetic fixture/text field with a unique marker and restoration. See [host evidence](host-verification.md); never guess a record or use production data.

Supply an app-owned definition following the contract above. Use `--profile example` for a runnable flat-record scaffold or `--profile aggregate` for nested records. Optional [recipes](recipes.md) cover reservations and migration. No definition executes during copying; later execution remains permission-bound.

```powershell
node "<skill>\scripts\create-app.mjs" "<new-app>" --name "My Workspace" --environment "<authorized-guid>" --port 5173 --definition "<app-definition>" --dry-run
```

Review, then repeat without `--dry-run`. The destination must be new, outside the input folder and unlinked. Full prebuilt vendor assets/tools, a unique storage key and the browser entry point are copied. The helper does not install, sign in, publish or touch running processes. Review the manifest before restoring approved dependencies.

## Configure, don't repeat wiring

`defineDemoWorkspace` extends repository options (`key`, `schemaVersion`, `defaults`, `fields`, `seed`, structural `validate`, mutation-only `validateMutation`) with a typed `collections` map. Each key returns ordinary view configuration without repeating service construction, query keys, IDs or defaults. Supply title, ID/label accessors, search text, columns and optional filters/create defaults/mobile layout.

View fields default to the SAME array used by repository scalar validation. Structural rules must permit historical reads; time/transition rules belong only in mutation hooks. Relationship eligibility in a control is never authorization.

Use `codeappscompact/authoring` to avoid repeated small adapters:

```typescript
const projects = referenceBinding(state.projects, {
  getId: row => row.id, getLabel: row => row.name, emptyText: 'Create a project first.'
});
const fieldsForView = bindReferences(fields.requests, { projectId: projects });
const column = columnsFor<RequestDraft>();
const columns = [
  column('name', 'Request', row => row.name),
  column('project', 'Project', row => projects.label(row.projectId)),
  column('hours', 'Hours', row => row.hours, value => value.toLocaleString())
];
const filters = [selectFilter(fields.requests, 'status')];
```

Reference bindings reuse existing option validation, missing-reference messages and eligibility reasons; they preserve scalar constraints. Async `ReferenceSource` remains usable through an explicit binding. Columns use the same typed accessor for sorting and default rendering, with optional custom renderers. Filters reuse select values/labels; no statuses are hard-coded. All helpers return existing contracts, and lower-level APIs/custom React remain available.

`dependencies` maps collection changes to dependent IDs. Navigation/count metrics are built in. Optional `metrics(state)` and `attention(state)` supply app calculations, semantic tones and collection destinations through the existing draft guard. Filters/sorting/refresh do not remount editors. Real adapters can use `collectionView(defineCollection(...))` with `CollectionWorkspace`; local demo storage is not mandatory for the presentation layer.

## Acceptance bindings

`crudScenario` requires explicit create/edit labels, values and independent `assertStored` callbacks, checking each after reload. Reference values support `{kind:'select', label:'Friendly name', search:'optional'}`. `rejectedSaveScenario` covers expected errors, unchanged persisted state and retained drafts for create or a named edit. Use it for invalid quantities, transitions, dates or relationship rules rather than re-authoring rejection plumbing.

Draft/conflict/storage/responsive/preview scenarios own the generic interaction. Add custom `{id, async run(context) {...}}` only for genuinely domain-specific behavior. Assertions must specify independent expected answers, not infer them from generated defaults. Do not remove features or checks to appear cheaper. The runner owns isolated server/browser setup and cleanup; read [tooling](tooling.md) for resumption/finalization.
