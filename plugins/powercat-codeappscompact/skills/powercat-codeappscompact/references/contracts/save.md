# Confirmed-save contract

Mandatory for editable compositions. Reuse the shipped save lifecycle, not a look-alike.

1. Validate the command, including domain rules and applicable lookup state. Throw `ValidationError({field: 'Message'})` from `codeappscompact/validation` for field errors. Use `DataError`/ordinary errors for visible storage, service and concurrency failures. `required` attributes alone are insufficient.
2. Await the actual atomic commit/service response. Retain the opening record ID and revision. Reject conflicts instead of retrying with a newer revision; a background refresh must not reset the draft or its React key.
3. Resolve only after confirmed success. Dialogs keep rejected input and field errors, lock pending submissions, block dismissal while saving and guard unsaved Close/Cancel/Escape. Do not catch errors and return success, swallow them, or update notices optimistically.
4. Route parent navigation through the supplied form-state/navigation guard. Local storage is synthetic data, not permissions. Real adapters must enforce authorization/concurrency at the data boundary.

Read `api-reference.mjs validation` only for additional validation APIs; [validation/editor](../validation-editor.md) has the extended flat-screen contract. No generic component determines domain status transitions, amounts, dates or authorization.
