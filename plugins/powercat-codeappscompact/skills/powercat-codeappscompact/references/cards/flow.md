# List / details / editor

Use `RecordFlow` for custom or nested records, including selected-row actions and alternate board/calendar views. Prefer the flat workspace for compatible scalar CRUD. Scaffold `--profile aggregate`; its neutral example is already wired. Do not copy its business domain.

**Import:** `RecordFlow` from `codeappscompact/record-flow`. Load `codeappscompact/theme.css` then `codeappscompact/aggregate.css`. **API:** `api-reference.mjs flow`.

Read [fields](fields.md), [save](../contracts/save.md) and one [data contract](../contracts/data.md). Read [details](details.md) only to author related tables. Internal table/dialog implementation cards are unnecessary.

```tsx
<RecordFlow title="Records" records={records} revision={revision}
  toRow={toRow} columns={columns} createDraft={createDraft} editDraft={editDraft}
  details={renderDetails} onSave={saveRecord} onFormStateChange={navigation.onFormStateChange}>
  {renderFields}
</RecordFlow>
```

`toRow` supplies unique IDs, labels and primitive values. `details` receives the current saved record, not a draft. `children(draft,setDraft)` renders fields. `onSave(draft,{id,revision})` awaits the actual commit; the revision is captured on editor open and never refreshed under a stale draft.

Optional: `filters`, `initialFilters`, `addLabel`, `editLabel`, `canEdit(record)`, `confirmSave(draft)`. `canEdit` only controls the UI; the domain must enforce eligibility. `confirmSave` delegates confirmation to the guarded dialog; do not resolve a save callback when a confirmation was rejected.

For bulk/board/calendar use the same flow, not a second hand-wired details/editor:
- `selected`, `onSelect`: controlled selected row IDs for app-owned commands.
- `toolbar`: app-owned actions displayed with the list.
- `alternate(rows,open)`: receives the complete filtered/sorted rows and the same details opener. Use a board or the shipped Calendar. Selection and filters survive switching views.

Built in: list state across details/back, current details refresh, missing-record state, focus return, rejected-draft preservation, pending-write lock, dismissal guard and success only after commit. Create returns to the list; edit returns to updated details. Keep the mounted flow stable across data refresh, and bind parent navigation.

Limits: ten-row table pages, primitive cells, CSV export always present; no deletion, domain engine, async lookup gating or arbitrary routing. Extend only for a named unsupported requirement. No measured cost saving is implied.

Browser assertions should use `recordFlowDetails(page, savedLabel)` from the app's `tools\browser-harness.mjs`, then locate text/fields within that named visible region. The list deliberately remains mounted but hidden; global text queries can match both list and details. Nested flows need their own exact record labels. Keep persisted-value assertions as well.
