# Draft editor

Use for a custom flow not covered by [RecordFlow](flow.md). **Import:** `DraftDialog`, `Modal` from `codeappscompact/aggregate`. **API:** `editor`. Read [fields](fields.md) and [save](../contracts/save.md); add [shell](shell.md) when parent routes can change.

```tsx
<DraftDialog title="Edit record" initial={initial} onSave={save} onClose={close}
  onFormStateChange={guard.onFormStateChange}>{renderFields}</DraftDialog>
```

The dialog owns a cloned JSON-compatible nested draft, field-error summary, disabled pending controls, duplicate-submit lock and guarded Close/Cancel/Escape. `onSave` resolves only after persistence; rejection retains values. `initial` is opening data, not a live reset signal. Key only a new edit session, never a new background revision.

Shared `Modal` contains Tab/Shift+Tab focus, skips hidden/inert/disabled controls, and focuses the dialog itself when no control is available (including pending saves). It restores focus to the connected opener on dismissal. `DraftDialog` and `RecordFlow` inherit this behavior: do not add app-local focus traps. Escape still uses the dirty-draft guard and cannot dismiss a pending save.

Configure children, `submitLabel` and optional `confirmSave(draft)` text. Use `Modal` for read-only/custom content, not a second homemade editor lifecycle. Required HTML markers alone do not validate: this form uses `noValidate`. External async reference errors must be checked before committing; there is no automatic standalone lookup gate.
