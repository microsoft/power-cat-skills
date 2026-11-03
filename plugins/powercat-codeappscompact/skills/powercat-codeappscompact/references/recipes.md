# Optional business-pattern recipes

These small pure helpers are app-neutral. Import only `codeappscompact/recipes/<name>`. Apps choose resource types, status names, business policies, messages, fixtures and authorization. None runs merely because it was imported.

## Resource reservations

`reservationConflicts(candidate,existing,bufferMs=0)` takes `{id,resources:string[],startUtc,endUtc}` and returns conflict IDs, shared resource IDs and overlapping UTC intervals. Intervals are half-open: adjacent bookings do not overlap unless an app-specified buffer requires separation. The candidate's own ID is excluded for updates. Invalid intervals/duplicate IDs fail explicitly. Apps select active/eligible bookings before calling, map their own resources and turn conflict details into useful field errors. The same recipe works for rooms, vehicles or equipment; it performs no transaction or authorization.

## State and conditional rules

`assertTransition(previous,next,transitions,field='status')` consumes an app-defined map of declared statuses and allowed outgoing states. Unchanged statuses are allowed. Unknown states/forbidden transitions become field errors. Use on mutation, not unconditional historical reads.

`conditionalErrors(draft,rules)` and `assertConditions` accept `{when,check,field,message}` rules using ordinary typed callbacks. For example, a resolved service request may require a resolution. The app decides whether a rule is structural (always valid) or a mutation-only policy. No expression language, reflection or dynamic code execution is involved.

## Dates: structure versus policy

`instant(value)` validates canonical ISO UTC including seconds/milliseconds. `assertDateRange(start,end,{endField,minDurationMs?,maxDurationMs?})` enforces a positive range and optional inclusive bounds. Inputs use UTC instants; local/time-zone conversion is an explicit app responsibility, not inferred from device locale.

```ts
const policy = ({ previous, next, id }: DemoMutation<Drafts>) => {
  const row = next.bookings.find(item => item.id === id);
  if (!row) throw new Error('Booking not found.');
  const old = previous.bookings.find(item => item.id === id);
  assertFutureDate(row.startUtc, {
    now: Date.now, field: 'startUtc', previousValue: old?.startUtc,
  });
};
// Pass policy as validateMutation, never validate.
```

`assertFutureDate` skips an unchanged previous value by default, so editing notes on an old reservation does not become impossible. Set `enforceUnchanged:true` only when the app explicitly requires it, such as activating an existing booking. It still validates timestamp structure. Inject clocks in tests. Historical data must stay readable when time advances or a policy changes. See `assets\examples\reservations.ts` for full integration.

## Defaults and fixtures

`createDefaults(schema,context=>draft)` validates exact keys/types and returns isolated drafts. Pass `createDefaults:()=>factory(context)` to a collection. `utcMinute(clock,offsetMinutes)` explicitly floors to minute precision and applies the supplied offset; no hard-coded seed relationship IDs are required.

`createFixtureTools({seed,anchorUtc})` supplies reproducible `random`, `pick`, `id(prefix,index)`, `utc(offsetMinutes)` and `reference(rows,getId)`. Seed is an unsigned 32-bit integer; anchor is explicit UTC. Empty reference collections fail rather than manufacturing invalid IDs. Apps still author meaningful domain records/scenarios. Date-relative examples can supply an explicit run anchor; do not silently change a persisted workspace's dates on every reload.

## Schema evolution and backup/restore

`writeBackup(data,schemaVersion,clock)` validates finite, acyclic JSON and creates a versioned string. `readBackup(text,expectedVersion,decode)` validates the envelope then calls the app's validating decoder. `migrateBackup(text,targetVersion,steps,decode)` applies explicit consecutive `{from,to,migrate}` steps and validates the final result. Missing steps, downgrades, invalid JSON/version/data and non-JSON values fail visibly. The original input string/object is not modified; these helpers perform NO storage writes.

Store an authorized backup before an upgrade, preview migration results, validate them, then use an app-owned, explicitly approved commit/restore procedure. `assets\examples\backup-restore.ts` demonstrates restoration into a new unused authorized demo key, leaving the original untouched. Existing keys are rejected; the demo repository still performs shape/revision checks. Production backups, migrations, retention and authorization belong to the production data layer, not this recipe. Never auto-reset storage on decode/migration failure.
