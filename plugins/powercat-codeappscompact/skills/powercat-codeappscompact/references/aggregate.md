# Nested records and atomic local commands

Use `--profile aggregate`, not a blank minimal shell. Replace its neutral domain/views/fixtures and independent tests. Business statuses, accounting rules, approvals and authorization remain app-owned. Keep flat CRUD on `workspace` instead.

## Supplied UI lifecycle

Read `api-reference.mjs aggregate-ui`. Import helpers from `codeappscompact/aggregate` and styles from `codeappscompact/aggregate.css`.

- `DraftDialog<T>` owns a JSON-compatible nested draft, native modal/focus, field-error summary, pending-write lock, rejected-save preservation and guarded Close/Cancel/Escape. Required markers are outside the actual label; hints/errors use `aria-describedby`, never alter the field's accessible name. `onSave` must reject failures and resolve only after the actual commit. Use existing `ValidationError({fieldKey: message})` for inline errors; other errors remain visible in the summary.
- `FormField` and `FormSelect` bind string inputs to explicit field keys; nested arrays are ordinary React children. Numeric blanks remain draft strings for domain validation. No statuses, roles or eligibility rules are inferred.
- `useTransactionState(store, storageKey)` supplies load/retry state, cross-tab/focus refresh and commit/reset state updates. Keep the store stable, outside render. Display `error` and `loading`; errors never silently reseed. `commit` deliberately requires the revision captured when the editor opened. Background reads must not replace that captured revision or remount the draft.
- `Modal` is also available for read-only/custom content. `DraftDialog.onFormStateChange` can connect to the existing `useNavigationGuard` for parent-controlled navigation; arbitrary parent unmounts cannot be intercepted. Re-key only on opening a different draft, not on filtering, refresh or rejected save. Native modal behavior blocks background controls; `beforeunload` remains best-effort, not autosave.

The starter demonstrates these bindings; adapt its fields instead of reimplementing form/storage lifecycles. Import general-purpose helpers, never a prebuilt benchmark answer.

## Table, CSV and transactions

Read `api-reference.mjs aggregate` only when these contracts are needed.

- `DataTable` supplies search/filter/sort, ten-row pagination, selection, filtered CSV export and an optional filtered alternate view. Give rows stable IDs, accessible labels and primitive values. Remount the table (not its parent editor) only to change its definition/initial drill-down. Parent owns loading/read-error state.
- `parseCsv`, `toCsv`, `downloadCsv` preserve quotes, commas and multiline cells. Header, row, uniqueness, import-size and atomic whole-batch rules remain app-owned. Raw CSV cells must be treated as text by spreadsheet consumers; the helper does not promise formula neutralization.
- `createTransactionStore(key, {seed, decode, reduce}, ports?)` validates a full JSON snapshot with a nonempty string revision before one atomic write. `reduce` is synchronous/pure and returns `{state, ...metadata}`. Default Web Locks have no unsafe unlocked fallback. Decode must validate the entire domain graph; custom policies stay independent from UI controls.
- Confirm reset before `reset({revision})`, or exact `{raw}` for explicit corrupt-store recovery. Only this storage key is touched; changed expectations reject. Inject ports for quota, corruption and concurrent-write assertions.

## Independent acceptance

Use `withBrowserScenarios({criteriaFile, localOnly: true}, [{id, async run({page, context, base, ui}) {...}}])`. Every declared ID needs exactly one runnable case. Every scenario gets clean storage and a new context, preventing fixture-count drift. All independent scenarios run before failure is reported; failed checks stay failed. Within a concurrency case open the second tab in that same context, bring each tab to the foreground before interaction and assert the stored winner plus preservation of the losing draft.

Use a label's visible text exactly; scope a generic Save/Open button to its dialog/record. Reuse shared responsive assertions early, including dialogs and phone layouts. Avoid overriding visible button text with an unrelated aria-label. Local-only networking checks intercept external HTTP/HTTPS/WebSocket traffic but do not misclassify browser-internal `edge:` download pages.

Keep the original repair-inclusive usage phases. Resume verification after a coherent repair; neither starter acceptance nor a successful compilation proves the requested domain is complete.

## 2.7 view reuse

Use `DetailTable` for captioned related-record tables, `MetricGrid` for accessible drill-down metrics, and `Calendar` for UTC weekly/agenda reservations. The app owns queries, labels, eligibility and overlap validation; these components contain no benchmark fixtures, roles or business rules. Calendar clips midnight-crossing intervals into every occupied day, uses h2/h3/h4 correctly, and defaults to a phone-friendly agenda. Pass only the currently filtered entries.

Use `FormSelect` for the demo-user switcher too: its label stays literal and is not inferred from option text. Import aggregate.css after theme.css. It supplies contrast-safe hover/active pairs for navigation, buttons and the reusable views. Do not add redundant theme overrides.

DataTable now resets its internal search, sort, filters and page when its title/column/filter keys or initial drill-down change. Ordinary row refreshes and list/alternate toggles keep that state; parent drafts are never remounted. Reuse the unchanged acceptance contract and scenario assertions across fresh benchmark builds, updating only version/path provenance. This removes repeated test authoring without reducing verification.
