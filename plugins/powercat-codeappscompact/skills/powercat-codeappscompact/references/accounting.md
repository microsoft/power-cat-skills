# Metering, finalization and matched cost comparisons

Use accounting only when requested. Tools run locally, consume provider usage records and never upload or copy raw session logs into apps. Obtain the exact event stream through the authorized host; if access/metering is unavailable, say so. No prompts, private reasoning or user/session identifiers belong in reports.

## Start once, finalize once

Begin the phase file BEFORE setup and keep the original file open across repairs/retries. Mark implementation/verification/reporting immediately before those phases, batching the marker with the next authorized operation rather than adding a model turn just to mark time. Markers may return to implementation for a fix.

```powershell
node "<skill>\scripts\mark-phase.mjs" --file ".\evidence\phases.json" --phase setup
# At the appropriate transitions, in the same tool batch as useful work:
node "<skill>\scripts\mark-phase.mjs" --file ".\evidence\phases.json" --phase implementation
```

Finish using the app's one-command finalizer. It resumes outstanding/affected verification, consumes the fresh authorized host receipt (or runs live CDP), closes an immutable phase snapshot at one explicit cutoff, invokes the EXISTING reconciler and prints the final table plus paths. Do not separately end/reconcile/reread/recalculate a successful final report.

```powershell
npm run finalize -- --resume ".\evidence\verification-01" --host-receipt ".\evidence\verification-01\mesh-receipt.json" --events "<authorized-session-events.jsonl>" --phases ".\evidence\phases.json" --usd-per-credit 0.01
```

For CDP omit the receipt and explicitly supply the already-authorized endpoint. The original phase file is NOT closed or replaced: a blocked/failed finalization must not cause later repair calls to be excluded. Resume retains the original event stream/start/phase path; each reporting attempt takes a new immutable cutoff/snapshot. Explicit original `--from` and optional `--to` bounds are also supported. A caller-specified closed scope remains closed; do not use it to hide later repairs. Attempt snapshots overlap: use the final cumulative report for delivery cost, not the sum of repeated snapshots.

Outputs: immutable attempt checkpoint, finalization JSON/summary, `usage.json`, per-call `usage.csv` and an input/output/total Markdown table. The report states requested scopes, actual authentication/saved-edit outcome, outstanding work, model-call count, cutoff and USD assumption. A blocked or failed app still reports available costs, not completion. Partial/unavailable metering is an error/unavailable, never zero. No raw session content is included.

The compatibility `measure-usage.mjs --events ... --phases ... --out <new-folder> [--usd-per-credit ...]` remains for standalone reports. `mark-phase end` deliberately closes a run; it is not needed before finalization. No tool estimates current in-flight/future generation or tool/runtime charges. Scope is completed provider-metered calls available through the exclusive cutoff; final replies/later generation remain excluded.

## Reconciliation and pricing

Supported records: GitHub Copilot CLI `session.usage_record`, complete `copilotUsage.tokenDetails`, `totalNanoAiu`, accounting sequence, model and provider input/output totals. Categories are uncached input, cache reads, cache writes and output, counted once each. Cost is `tokenCount / batchSize * costPerBatch / 1e9` AI credits, reconciled against the provider total. Rates come from each record, not from an invented model-price table. Do not count reasoning twice if already in output.

Identical duplicate sequences are deduplicated. Conflicting duplicates, incomplete/unsupported metering, unknown categories, invalid rates, unsafe totals and failed reconciliation are explicit errors. Unsupported providers need an implemented adapter, not guesses. Inputs/cache/output and phase totals remain in JSON; token counts stay exact and money is rounded only for display.

`--usd-per-credit` is a CALLER-SUPPLIED assumption, not live pricing. Use `0.01` only when that is the declared comparison assumption. Omission reports USD unavailable. Dollar figures represent usage value, not necessarily invoices/additional charges under included plan credits. Phase buckets use call COMPLETION times, not causal per-tool attribution; a call spanning a marker cannot be split retrospectively.

Optional `--max-credits` checks scoped observed credits before local stages. A reached/unknown budget blocks outstanding work and still reports available usage. It cannot forecast future model calls or tool charges. Review progress before explicitly raising it; never drop checks to look cheaper.

## Prove that 2.3 beats 2.0

Use repeated equal-scope builds across inventory, service requests and reservations. Compare variants WITHIN a domain/cache stratum, not unrelated apps. Preserve all requested features, rules, relationships, notes, errors, persistence, responsive accessibility and actual authenticated Local Play. Retain incomplete/failed-attempt ledgers and include repairs/retries in delivery cost; report skill-development costs separately.

1. Define a byte-identical independent acceptance JSON with unique `checks[].id` entries for each variant of a domain. Save actual evidence with the same `criteriaSha256` and every required check passed. A preview-only acceptance file cannot prove a requested authenticated outcome.
2. Use at least two builds per variant per cache stratum (three or more preferred), same model/provider/rates, task, initial instructions/context, machine/dependencies and boundary. Alternate variant order. Declare provider cache conditions honestly; deleting local files does not establish a cold model cache. Separate warm/cold strata and retain actual cache categories.
3. Hash the equivalent initial-context specification without saving private content. Record unavoidable deviations rather than treating observational runs as controlled. Attach benchmark metadata to each reconciled run with `measure-usage --benchmark <metadata.json>`.

```json
{
  "variant": "compact-2.3.0",
  "cacheMode": "warm",
  "startingContextSha256": "<64-lowercase-hex-hash>",
  "acceptanceCriteriaFile": "acceptance.json",
  "acceptanceEvidenceFile": "acceptance-results.json"
}
```

Paths resolve beside metadata. Metadata validation rejects missing/failing parity. The comparator rejects single pairs, duplicate run IDs, unbounded/unphased records, different context/model/USD assumptions and insufficient repetitions per declared cache stratum. It reports mean/median/min/max tokens, credits/USD, cache reads and phase costs. Declared conditions are not independently enforced; audit provider rates and full failure ledgers.

```powershell
node "<skill>\scripts\compare-runs.mjs" ".\baseline-1\usage.json" ".\baseline-2\usage.json" ".\candidate-1\usage.json" ".\candidate-2\usage.json" --out ".\comparison.json" --baseline compact-2.0.0 --candidate compact-2.3.0 --min-savings-percent 20
```

Without a percentage, the target requires a STRICTLY lower median in every declared cache stratum; a tie fails. The optional 20% threshold is a release target, not an established saving. A valid comparison that misses the target exits 2 and preserves its results; invalid evidence fails explicitly. This is a cost gate, not a substitute for checking equivalent functionality, fresh authentication and failure rates. Smaller source, fewer output tokens or passing toolkit tests alone do not prove cheaper app delivery.
