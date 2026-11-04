# Capability catalog

Read only the needed row. `scripts\api-reference.mjs <capability>` returns emitted signatures; `--list` reports sizes. The full API is not mandatory app-authoring context.

| Need | Entry/tool | Read next |
|---|---|---|
| Complete generic workspace | `codeappscompact/workspace` | [Authoring](authoring.md), `workspace` signature |
| Less reference/column/filter repetition | `codeappscompact/authoring` | `authoring` signature; neutral definition example only if needed |
| Custom CRUD/query contracts | `codeappscompact`, `codeappscompact/collections` | `records` or `collections` signature |
| Shared rules, field errors, editor behavior | `codeappscompact/validation` | `validation` signature; [validation/editor](validation-editor.md) |
| Friendly/async relationships | `codeappscompact/reference` | `reference` signature |
| Metrics, attention and display cells | `codeappscompact/display` | `display` signature; [controls](controls.md) |
| Synthetic storage and mutation policies | `codeappscompact/demo` | `demo` signature; [collections](collections.md) |
| Optional business recipes | `codeappscompact/recipes/<name>` | [Recipes](recipes.md), only the chosen signature |
| New integrated app | `create-app.mjs --definition` | [Authoring](authoring.md) |
| Existing app/minimal shell | `setup`, `add-collection`, profiles | [Tooling](tooling.md); no automatic rewrites |
| Acceptance, negative saves, resume | `acceptance-scenarios`, `verify` | [Tooling](tooling.md) |
| Real authenticated host and saved edit | `--host-route mesh-uia|mesh-browser` or authorized `--cdp-url` | Emitted host request/template; [host evidence](host-verification.md) if needed |
| One final outcome and usage table | `finalize` | [Accounting](accounting.md); one cutoff, all repair calls |
| Prove cheaper builds than 2.0 | `compare-runs --baseline ... --candidate ...` | [Accounting](accounting.md); matched repeated evidence required |

No domain status/resource/completion policy is inferred. UI restrictions and evidence receipts are not permission. Other stacks and production connectors keep their own setup.
