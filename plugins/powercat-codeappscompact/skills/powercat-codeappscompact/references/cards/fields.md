# Fields

For aggregate flows **import** `FormField`, `FormChoice`, `FormSelect` from `codeappscompact/aggregate`; **API:** `editor` only if more props are needed. These small primitives stay grouped.

```tsx
const statuses = ['Not started', 'In progress', 'Done'] as const;
const statusOptions = statuses.map(value => ({ value, label: value }));
// Type draft.status as typeof statuses[number] and initialize it to a valid choice.
<FormChoice name="status" label="Status" value={draft.status} options={statusOptions}
  onChange={status => setDraft(current => ({ ...current, status }))} />
<FormField name="title" label="Title" required value={draft.title}
  onChange={title => setDraft(current => ({ ...current, title }))} />
<FormSelect name="owner" label="Owner" value={draft.owner} empty="Unassigned" options={owners}
  onChange={owner => setDraft(current => ({ ...current, owner }))} />
```

Use `FormChoice` for closed sets such as status, priority and demo personas. It renders exactly the configured choices, without a placeholder or an injected unavailable value. Options determine the value/callback type; preserve literal unions with `as const`. Empty/duplicate option values, an empty option list or a value outside the choices throw an explicit configuration error rather than silently selecting a default. Initialize drafts with a valid choice; handle invalid persisted data in the data decoder. The aggregate scaffold's `DemoShell` uses this preset.

Keep `FormSelect` for lookups and optional values: its default blank option is `Choose...`; `empty="Unassigned"` labels it, and `empty={false}` suppresses it. Missing references stay visible as unavailable. Do not convert optional or dependent relationships into closed choices.

Controls supply literal labels, hints and field-error presentation through the enclosing draft dialog. `FormField` accepts string values, `type`, `multiline`, `step`, `min`, `max`, `maxLength`. Preserve blank numeric draft strings for validation. Put nested arrays in ordinary children; do not invent a field engine.

For flat screens use typed `Field` definitions / `fieldPresets` from `codeappscompact`; consult `records` only for that family. Flat fields support UTC date-times, not an invented date-only kind. Aggregate `type="date"` presents local calendar dates; business date policy stays app-owned.

Read [save](../contracts/save.md) for validation. Required attributes/hints are not business rules. Eligibility and async reference state require the [relationship](relationships.md) contract when used.
