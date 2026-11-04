# Shared validation, references and editor lifecycle

## One scalar contract

`Field<D>` keeps flat string/number keys. All fields have a name, accessible label and kind: text, email, number, select, reference, textarea or datetime-utc. Add only relevant constraints:

```ts
const fields = [
  { name: 'quantity', label: 'Quantity', kind: 'number', required: true,
    integer: true, min: 0, max: 1000, step: 1, unit: 'items', helpText: 'Whole items only.' },
  { name: 'code', label: 'Code', kind: 'text', required: true, minLength: 2,
    maxLength: 20, pattern: /^[A-Z0-9-]+$/, patternMessage: 'must use uppercase letters, digits or hyphens.' },
] satisfies readonly Field<Draft>[];
```

`validateDraft(draft,defaults,fields)` returns a Map of field messages. `assertValidDraft` throws `ValidationError` with those messages. Use the same fields in the screen and service; the demo adapter accepts `fields:{collection:fields}`. `checkDraft` protects exact keys/types; `projectDraft(defaults)` strips IDs/backend extras deliberately. Numeric blanks cannot be represented in a flat number draft and are invalid, even for an optional field. Integer means safe integer; step is relative to min (or zero) with floating-point tolerance. min/max and minLength/maxLength are inclusive; string validation uses trimmed text. Pattern validation does not mutate RegExp state. Dates must round-trip canonical ISO UTC at minute precision.

Forms trim outer whitespace, preserve internal newlines, convert the UTC widget without applying the device time zone and do not write when validation fails. Hidden metadata, including revisions, retains its exact draft keys/types. Scalar configuration is not a schema migration and cannot replace reference or authorization checks.

For app-owned failures:

```ts
throw new ValidationError<Draft>({ quantity: 'Only three items remain.' });
throw new DataError('conflict', 'This record changed. Reload it before saving.');
```

`DataError` categories: validation, storage, network, conflict, authorization, unknown. No arbitrary exception is automatically labeled a network failure. Failed operation results may carry `{message,fieldErrors}`; they remain failures. Forms preserve drafts/target IDs, display an accessible summary and inline field messages, and focus the first affected control. Unknown/unbound errors stay in the summary, not silently discarded. Save has duplicate-submit protection, no automatic retries and separate post-commit refresh failures.

## Relationships

Legacy string selects and `{value,label,disabledReason?}` options still work. Selects need explicit nonempty options; an optional blank value must be declared. Unknown selected values are not silently replaced.

`referenceOptions(rows,{getId,getLabel,disabledReason?})` creates a checked ID/label list. `referenceLabel(options,id)` displays a missing-reference marker instead of concealing a broken ID. The reference field supports empty collections and searchable labels:

```ts
{ name: 'ownerId', label: 'Owner', kind: 'reference', required: true,
  reference: { options, emptyText: 'Create an eligible owner first.' } }
```

For a real async source, supply BOTH `loadOptions(search,signal)` and `resolveOption(id,signal)`. The resolver returns the matching option or null. Both return `{value,label,disabledReason?}` values. Search may be incomplete, so absence from a search result is never treated as proof the selected ID is missing. Keep these functions stable while mounted. Aborted/stale results cannot replace newer choices; lookup failures show Retry, unresolved or unavailable references block Save, and missing IDs remain visible. Adapters must independently enforce existence/eligibility; UI checks are not authorization. Async loaders are expected to honor cancellation and implement their service's timeout/retry policy.

Standalone `ReferenceField` also exposes `onStateChange({pending,issue})`; standalone callers must use it to block invalid writes. The integrated RecordScreen does this automatically.

## Stable editor state

Filtering, searching, sorting and background reads do not replace the current values/baseline or reset the selected record ID. Do not key the parent by view state. Dirty Edit, Cancel and collection navigation require an explicit discard; in-flight writes block navigation. `createDefaults()` is an optional context-aware factory, called for a fresh editor and before a save; schema/factory errors are caught before committing a write.

Edit moves focus into the editor; failed validation focuses a field (or the summary); Cancel/Save returns focus to the originating visible row action or search. Provide `getLabel(row)` for actions such as 'Edit Service checklist'; the fallback is the stable record ID.

Always connect `onFormStateChange` to `useNavigationGuard` and route router links, metrics and other collection actions through `requestNavigation`. The kit cannot intercept arbitrary parent unmounts. beforeunload is best-effort, not durable autosave or recovery after a crash. Changes to field schemas or resource identity require a guarded remount, unlike normal view changes.
