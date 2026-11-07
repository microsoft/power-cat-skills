# Metering and finalization

Use accounting only when requested. Tools run locally, consume provider usage records and never upload or copy raw session logs into apps. Obtain the exact event stream through the authorized host; if access/metering is unavailable, say so. No prompts, private reasoning or user/session identifiers belong in reports.

## Start once, finalize once

Begin the phase file BEFORE setup and keep the original file open across repairs/retries. Mark implementation/verification/reporting immediately before those phases, batching the marker with the next authorized operation rather than adding a model turn just to mark time. Markers may return to implementation for a fix.

```powershell
node "<skill>\scripts\mark-phase.mjs" --file ".\evidence\phases.json" --phase setup
# At the appropriate transitions, in the same tool batch as useful work:
node "<skill>\scripts\mark-phase.mjs" --file ".\evidence\phases.json" --phase implementation
```

Finish using the app's one-command finalizer. It resumes outstanding/affected verification, closes an immutable phase snapshot at one explicit cutoff, invokes the reconciler and prints the final table plus paths. Do not separately end/reconcile/reread/recalculate a successful final report.

For a local-only app:

```powershell
npm run finalize:local -- --resume ".\evidence\verification-01" --events "<authorized-session-events.jsonl>" --phases ".\evidence\phases.json" --usd-per-credit 0.01
```

For an authorized hosted app, use `finalize` with a fresh authorized `--host-receipt` or explicitly approved `--cdp-url`; see [host verification](host-verification.md). Local completion never establishes authenticated Local Play.

The original phase file is NOT closed or replaced: a blocked/failed finalization must not cause later repair calls to be excluded. Resume retains the original event stream/start/phase path; each reporting attempt takes a new immutable cutoff/snapshot. Explicit original `--from` and optional `--to` bounds are also supported. A caller-specified closed scope remains closed; do not use it to hide later repairs. Attempt snapshots overlap: use the final cumulative report for delivery cost, not the sum of repeated snapshots.

Outputs: immutable attempt checkpoint, finalization JSON/summary, `usage.json`, per-call `usage.csv` and an input/output/total Markdown table. The report states requested scopes, actual authentication/saved-edit outcome, outstanding work, model-call count, cutoff and USD assumption. A blocked or failed app still reports available costs, not completion. Partial/unavailable metering is an error/unavailable, never zero. No raw session content is included.

The compatibility `measure-usage.mjs --events ... --phases ... --out <new-folder> [--usd-per-credit ...]` remains for standalone reports. `mark-phase end` deliberately closes a run; it is not needed before finalization. No tool estimates current in-flight/future generation or tool/runtime charges. Scope is completed provider-metered calls available through the exclusive cutoff; final replies/later generation remain excluded.

## Reconciliation and pricing

Supported records: GitHub Copilot CLI `session.usage_record`, complete `copilotUsage.tokenDetails`, `totalNanoAiu`, accounting sequence, model and provider input/output totals. Categories are uncached input, cache reads, cache writes and output, counted once each. Cost is `tokenCount / batchSize * costPerBatch / 1e9` AI credits, reconciled against the provider total. Rates come from each record, not from an invented model-price table. Do not count reasoning twice if already in output.

Identical duplicate sequences are deduplicated. Conflicting duplicates, incomplete/unsupported metering, unknown categories, invalid rates, unsafe totals and failed reconciliation are explicit errors. Unsupported providers need an implemented adapter, not guesses. Inputs/cache/output and phase totals remain in JSON; token counts stay exact and money is rounded only for display.

`--usd-per-credit` is a CALLER-SUPPLIED assumption, not live pricing. Use `0.01` only when that is the declared comparison assumption. Omission reports USD unavailable. Dollar figures represent usage value, not necessarily invoices/additional charges under included plan credits. Phase buckets use call COMPLETION times, not causal per-tool attribution; a call spanning a marker cannot be split retrospectively.

Optional `--max-credits` checks scoped observed credits before local stages. A reached/unknown budget blocks outstanding work and still reports available usage. It cannot forecast future model calls or tool charges. Review progress before explicitly raising it; never drop checks to look cheaper.

Keep skill-development costs separate from repair-inclusive app delivery costs. Claims of savings require repeated equal-scope builds with the same acceptance criteria, model/provider/rates and declared context/cache conditions. Include failed attempts and material environment differences. Smaller source, fewer output tokens or passing toolkit tests alone do not prove cheaper app delivery. The lean distribution omits the maintainer benchmark-comparison command.
