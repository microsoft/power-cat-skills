# Virtual React control lifecycle

This is an original engineering guide grounded in the official ReactControl API. The pending-output, draft, cancellation, and null/default policies below are implementation decisions for this plugin, not extra lifecycle guarantees from the platform.

Always scaffold with PAC and implement `ComponentFramework.ReactControl<IInputs, IOutputs>` in TypeScript. The platform owns DOM mounting and React rendering. Do not transplant StandardControl container/rendering code into a virtual control.

## Lifecycle responsibilities

| Method | Owns | Must not do |
|--------|------|-------------|
| `init(context, notifyOutputChanged, state)` | Capture the callback; initialize instance-local helpers and supported subscriptions; opt into resize tracking when needed. | Assume datasets are ready, accept a DOM container, mount a React root, or default/write a blank field. |
| `updateView(context)` | Read current inputs/dataset/metadata, reconcile state, and return a React element with typed props. | Notify just because it ran, start unbounded repeat queries, or assume every null is a persisted empty field. |
| `getOutputs()` | Return current typed, manifest-named bound outputs for the agreed contract. | Perform a write, mutate a draft, convert the placeholder into data, or substitute for dataset row persistence. |
| `destroy()` | Release instance-owned timers, subscriptions, observers, and outstanding work. | Unmount the host's React root or let delayed callbacks write to a removed instance. |

Do not depend on a fixed count or strict one-to-one sequence of `updateView` and `getOutputs` calls. Context changes include layout, visibility, metadata, data, and other host state, not just edits.

Sources: [ReactControl](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control), [init](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/init), [updateView](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/updateview), [getOutputs](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/getoutputs), and [destroy](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/destroy).

## Keep four meanings separate

| State | Purpose |
|-------|---------|
| Host value | Latest accepted bound data for the current record; includes legitimate null/falsy values. |
| Draft | Unconfirmed interaction, such as search text or popup selection. |
| Pending output | Validated user commit made available to `getOutputs` before notifying the host. |
| Availability/editability | Whether metadata/data/security/disabled state permits the interaction. |

Use instance-local state and typed equality appropriate to the column. Formatted text is not a reliable equality key for numeric, date, choice, or lookup values. Identify transitions between records/views so an old draft or async result cannot migrate to a new binding.

### Field commit

1. Receive a deliberate user event and verify current editability/availability.
2. Validate and normalize against the column contract without losing meaningful `0`, `false`, or empty/null distinctions.
3. Update pending output before invoking the captured `notifyOutputChanged` callback.
4. Return the pending bound value from `getOutputs`; leave actual field persistence to the form.
5. Reconcile subsequent host updates without notifying again merely because the host echoed the value.

Do not equate "no output property" with "clear." Resolve the chosen column's generated output type and explicit clear behavior, then test clearing through save/reload in the host. Neither the display placeholder nor a cast bypass is a valid solution.

### Host reconciliation

- Distinguish acknowledgments, temporarily repeated/stale host values, external updates, and record changes using the supported host signals available for that binding.
- Define how a genuine external change affects a dirty draft; test cancellation or conflict behavior rather than silently overwriting either side.
- Do not label every difference from pending output an external edit. The host may call `updateView` for unrelated changes while output reconciliation is still in progress.
- Reset obsolete drafts/pending work on binding changes. Host rejection or failure must not leave a permanent success-shaped UI.
- Dataset paging/view refresh is not acknowledgment of a field output. Dataset reads and row writes have their own loading/error lifecycle.
- Reevaluate read-only/security state with host updates. When editing becomes disallowed, close editors/popups and discard uncommitted drafts without notifications or mutations; show only the current readable host value's label or static `---`. Remove stale visible/accessible data when readability is revoked. Reconcile already-submitted commits separately, and do not auto-default when editing is restored.

## Null and deliberate activation

The [skill](../SKILL.md) owns the complete state contract. In lifecycle terms:

- Null rendering creates presentation only: `---` for editable non-text editors, empty input for editable text boxes, and static `---` for readable read-only fields.
- Focusing or rerendering never selects or commits a default.
- An immediate editor's deliberate activation commits the agreed default once.
- A popup editor's activation initializes a draft; confirmation commits, cancellation writes nothing.
- After clear, restore the null presentation and allow the next activation to select the default again.
- A disabled/secured/unavailable state blocks activation and writes.

Use React controlled state for host-backed values. An uncontrolled `defaultValue`/default selection applied only at mount cannot handle host refresh, clear, or record changes reliably.

## Side effects, sizing, and cleanup

- Call `context.mode.trackContainerResize(true)` in initialization when responsive layout needs allocated dimensions; request tracking before relying on those dimensions.
- Use current context rather than stale captured metadata for user operations. Keep subscriptions/timers stable and avoid creating them on every `updateView`.
- Put UI-owned side effects in compatible React effects with cleanup. Make work idempotent; rendering is not permission to execute a mutation.
- Use `context.webAPI` for agreed Dataverse operations. Track request identity/binding so late responses can be ignored; cancel only where the supported API actually provides cancellation.
- Await mutations, surface failures, and refresh affected datasets after success. Avoid automatic retry of a write whose outcome is uncertain.
- In `destroy` and React cleanup, detach only resources owned by this control. Do not touch the host DOM or shared platform-library instance.
- Do not store authoritative field values or sensitive data in shared module variables or session control state. `setControlState` is session state, not a replacement for Dataverse persistence, and can be shared across multisession tabs.

Sources: [Mode](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/mode), [WebAPI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/webapi), and [PCF best practices](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-best-practices).

## Verification probes

- Invoke `updateView` repeatedly for the same/null data and layout changes: zero output notifications.
- Activate with pointer and keyboard: equivalent transitions, no duplicate writes.
- Invoke `getOutputs` more than once: consistent output without new side effects.
- Simulate host echo, stale input, external update, clear, and record/view switch: no output loop or resurrected draft.
- Switch editability during a popup/text draft and update a read-only host value: label-only rendering, draft cancellation, safe focus handling, no writes, and no secured-data exposure.
- Resolve an old request after a newer query/binding and after destroy: no stale UI or mutation.
- Test with multiple instances: independent values, IDs, subscriptions, and focus.
- Cover host-only WebAPI/dataset/security behavior separately from `npm start watch`; typed mocks do not prove host compatibility.

Apply these probes alongside the [quality checklist](./quality-checklist.md).
