# Atomic demo data

**Import:** `createTransactionStore`, `useTransactionState` from `codeappscompact/aggregate`; **API:** `transactions`.

```ts
const store = createTransactionStore(storageKey, { seed, decode, reduce }); // outside render
const data = useTransactionState(store, storageKey); // inside the component
await data.commit(openingRevision, command, actor);
```

`seed` creates synthetic fixtures. `decode` validates the ENTIRE JSON graph and nonempty string revision. `reduce` is synchronous/pure, returns `{state,...metadata}` and changes no input. Default Web Locks serialize validated, atomic writes; no unlocked fallback. Inject ports for failure tests, not a production permission bypass.

Display loading/error/retry from the hook. Keep a mounted editor across refresh; pass its captured revision into commit. Failed decode never silently reseeds. Confirm reset before `reset({revision})`; `{raw}` is only explicit corrupt-store recovery. Reset touches this app key only. Read [save](save.md); domain policies and expiry/eligibility belong in command validation, not historical reads.

Commands are unvalidated inputs; stored records are validated types. Keep string-valued draft input separate from narrowed status/priority unions so invalid-input tests exercise the real boundary without casts:

```ts
import { ValidationError } from 'codeappscompact/validation';
const statuses = ['Open', 'Done'] as const;
type Status = (typeof statuses)[number];
type Input = { title: string; status: string };
type RecordValue = { title: string; status: Status };
function isStatus(value: string): value is Status {
  return statuses.some(status => status === value);
}
function validate(input: Input): RecordValue {
  if (!input.title.trim()) throw new ValidationError({ title: 'Enter a title.' });
  if (!isStatus(input.status)) throw new ValidationError({ status: 'Choose a valid status.' });
  return { title: input.title.trim(), status: input.status };
}
```

Use the app's required choices, not these illustrative values. Call validation inside the pure reducer before mutation; never cast an unchecked input to a saved-record type.
