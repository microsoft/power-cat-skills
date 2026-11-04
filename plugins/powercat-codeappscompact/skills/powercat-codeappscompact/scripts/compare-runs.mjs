import { resolve } from 'node:path';
import { args, cli, isMain, readJson, writeJson } from './lib.mjs';

const median = values => { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };
const stats = values => ({ mean: values.reduce((a, b) => a + b, 0) / values.length, median: median(values), min: Math.min(...values), max: Math.max(...values) });
function validateTotals(report) {
  const valid = row => row && Number.isSafeInteger(row.tokens) && row.tokens >= 0 && Number.isFinite(row.credits) && row.credits >= 0;
  if (![report.input, report.output, report.total].every(valid) || report.total.tokens !== report.input.tokens + report.output.tokens || Math.abs(report.total.credits - report.input.credits - report.output.credits) > 0.000001) throw new Error('Invalid or unreconciled usage totals.');
  if (report.usdPerCredit !== null && (!Number.isFinite(report.usdPerCredit) || report.usdPerCredit < 0)) throw new Error('Invalid USD assumption.');
  for (const row of [report.input, report.output, report.total]) {
    if (report.usdPerCredit === null ? row.usd !== null : !Number.isFinite(row.usd) || Math.abs(row.usd - row.credits * report.usdPerCredit) > 0.000001) throw new Error('Invalid USD totals.');
  }
  const expected = ['input', 'cache_read', 'cache_write', 'output'];
  if (!Array.isArray(report.breakdown) || report.breakdown.length !== expected.length || expected.some(category => !report.breakdown.some(row => row.category === category && valid(row)))) throw new Error('Every run must retain complete cache and token category evidence.');
  if (report.breakdown.reduce((total, row) => total + row.tokens, 0) !== report.total.tokens || Math.abs(report.breakdown.reduce((total, row) => total + row.credits, 0) - report.total.credits) > 0.000001) throw new Error('Category evidence does not reconcile with totals.');
  if (!Array.isArray(report.phases) || !report.phases.length || report.phases.some(row => !['setup', 'implementation', 'verification', 'reporting'].includes(row.phase) || !valid(row.total)) || report.phases.reduce((total, row) => total + row.total.tokens, 0) !== report.total.tokens || Math.abs(report.phases.reduce((total, row) => total + row.total.credits, 0) - report.total.credits) > 0.000001) throw new Error('Benchmark calls must have complete, reconciled named phase evidence.');
}
export function compareRuns(reports) {
  if (reports.length < 4) throw new Error('Use at least two verified runs of each variant; one historical pair is not a controlled benchmark.');
  const first = reports[0]; const ids = new Set();
  for (const report of reports) {
    const meta = report.benchmark;
    if (report.schemaVersion !== 1 || !report.scope?.explicitlyBounded || typeof report.runId !== 'string' || !report.runId || ids.has(report.runId) || !meta?.acceptanceVerified || typeof meta.variant !== 'string' || !meta.variant || !['cold', 'warm'].includes(meta.cacheMode) || !/^[a-f0-9]{64}$/.test(meta.acceptanceCriteriaSha256) || !/^[a-f0-9]{64}$/.test(meta.startingContextSha256)) throw new Error('Each benchmark run needs a unique run ID, explicit accounting bounds, verified feature parity and a declared cold or warm cache stratum.');
    ids.add(report.runId);
    if (!Array.isArray(report.models) || !report.models.length || report.models.some(model => typeof model !== 'string' || !model)) throw new Error('Each benchmark run needs its measured model IDs.');
    if (meta.acceptanceCriteriaSha256 !== first.benchmark?.acceptanceCriteriaSha256 || meta.startingContextSha256 !== first.benchmark?.startingContextSha256 || JSON.stringify(report.models) !== JSON.stringify(first.models) || report.usdPerCredit !== first.usdPerCredit) throw new Error('Acceptance criteria, initial context, model and USD assumption must match across benchmark runs.');
    validateTotals(report);
  }
  const variants = [...new Set(reports.map(report => report.benchmark.variant))].sort();
  if (variants.length < 2) throw new Error('At least two variants are required.');
  const cacheModes = [...new Set(reports.map(report => report.benchmark.cacheMode))].sort();
  const groups = [];
  for (const cacheMode of cacheModes) for (const variant of variants) {
    const runs = reports.filter(report => report.benchmark.cacheMode === cacheMode && report.benchmark.variant === variant);
    if (runs.length < 2) throw new Error(`Need at least two ${cacheMode}-cache runs for ${variant}; do not mix cold and warm runs to fill the gap.`);
    groups.push({ variant, declaredCacheMode: cacheMode, runs: runs.length,
      inputTokens: stats(runs.map(run => run.input.tokens)), outputTokens: stats(runs.map(run => run.output.tokens)), totalTokens: stats(runs.map(run => run.total.tokens)),
      credits: stats(runs.map(run => run.total.credits)), usd: first.usdPerCredit === null ? null : stats(runs.map(run => run.total.usd)),
      cacheReadTokens: stats(runs.map(run => run.breakdown.find(row => row.category === 'cache_read').tokens)),
      phases: [...new Set(runs.flatMap(run => run.phases.map(phase => phase.phase)))].map(phase => ({ phase, credits: stats(runs.map(run => run.phases.find(item => item.phase === phase)?.total.credits ?? 0)) })),
    });
  }
  return { comparedAtUtc: new Date().toISOString(), acceptanceCriteriaSha256: first.benchmark.acceptanceCriteriaSha256, models: first.models, usdPerCredit: first.usdPerCredit, groups, interpretation: 'Compare total cost to a feature-equivalent verified app within each cache stratum. Cache mode and starting-context equivalence are caller-declared, not enforced by this tool. No savings claim is inferred from source size, missing features or a single pair.' };
}
export function savingsTarget(comparison, { baseline, candidate, minPercent = 0 }) {
  if (!baseline || !candidate || baseline === candidate || !Number.isFinite(minPercent) || minPercent < 0 || minPercent >= 100) throw new Error('Choose distinct baseline/candidate variants and a savings threshold from 0 to less than 100 percent.');
  const strata = [...new Set(comparison.groups.map(group => group.declaredCacheMode))].map(cacheMode => {
    const base = comparison.groups.find(group => group.variant === baseline && group.declaredCacheMode === cacheMode);
    const next = comparison.groups.find(group => group.variant === candidate && group.declaredCacheMode === cacheMode);
    if (!base || !next || base.runs < 2 || next.runs < 2 || base.credits.median <= 0) throw new Error('Every compared cache stratum needs repeated baseline/candidate runs and a positive baseline median.');
    const improvement = base.credits.median - next.credits.median;
    const noise = Number.EPSILON * Math.max(1, base.credits.median, next.credits.median) * 8;
    const percent = 100 * improvement / base.credits.median;
    return { cacheMode, baselineMedianCredits: base.credits.median, candidateMedianCredits: next.credits.median, savingsPercent: percent, passed: improvement > noise && percent + 1e-10 >= minPercent };
  });
  return { baseline, candidate, requiredSavingsPercent: minPercent, passed: strata.length > 0 && strata.every(item => item.passed), strata, note: 'Measured cost gate only. Review complete attempt/failure ledgers, equivalent authentication evidence and declared benchmark conditions before a release claim.' };
}
if (isMain(import.meta.url)) await cli(() => {
  const { options, positional } = args(process.argv.slice(2), ['out', 'baseline', 'candidate', 'min-savings-percent']);
  if (!options.out) throw new Error('Usage: node compare-runs.mjs <usage1.json> <usage2.json> ... --out <new-comparison.json> [--baseline compact-2.0.0 --candidate compact-2.3.0 --min-savings-percent 20]');
  const result = compareRuns(positional.map(path => readJson(resolve(path))));
  if (options.baseline || options.candidate || options['min-savings-percent'] !== undefined) result.target = savingsTarget(result, { baseline: options.baseline, candidate: options.candidate, minPercent: options['min-savings-percent'] === undefined ? 0 : Number(options['min-savings-percent']) });
  writeJson(resolve(options.out), result);
  if (result.target) { console.log(result.target.passed ? 'COST TARGET MET in every declared cache stratum.' : 'COST TARGET NOT MET; do not claim a cheaper app.'); if (!result.target.passed) process.exitCode = 2; }
  console.log(`Compared ${positional.length} verified runs in ${result.groups.length} variant/cache groups. Evidence: ${resolve(options.out)}`);
});
