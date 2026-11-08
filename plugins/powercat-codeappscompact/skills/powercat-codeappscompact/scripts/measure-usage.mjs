import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { args, cli, exists, isMain, readJson, writeJson } from './lib.mjs';
import { phaseNames } from './mark-phase.mjs';

const categories = ['input', 'cache_read', 'cache_write', 'output'];
const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
const number = (value, label, integer = false) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) throw new Error(`Invalid provider ${label}.`);
  return value;
};
const sum = rows => rows.reduce((total, row) => ({ tokens: total.tokens + row.tokens, credits: total.credits + row.credits }), { tokens: 0, credits: 0 });
const priced = (value, rate) => ({ ...value, usd: rate === null ? null : value.credits * rate });
export const sha256 = value => createHash('sha256').update(value).digest('hex');

export function benchmarkMetadata(path) {
  const metadata = readJson(path);
  if (typeof metadata.variant !== 'string' || !metadata.variant.trim() || !['cold', 'warm', 'mixed', 'unknown'].includes(metadata.cacheMode) || !/^[a-f0-9]{64}$/.test(metadata.startingContextSha256)) throw new Error('Benchmark metadata needs variant, declared cacheMode, and a startingContextSha256.');
  if (typeof metadata.acceptanceCriteriaFile !== 'string' || typeof metadata.acceptanceEvidenceFile !== 'string') throw new Error('Benchmark metadata needs criteria and acceptance-evidence paths.');
  const criteriaPath = resolve(dirname(path), metadata.acceptanceCriteriaFile);
  const criteria = readJson(criteriaPath);
  const digest = sha256(readFileSync(criteriaPath));
  const evidence = readJson(resolve(dirname(path), metadata.acceptanceEvidenceFile));
  const required = criteria.checks?.map(item => item.id);
  if (!required?.length || required.some(id => typeof id !== 'string' || !id) || new Set(required).size !== required.length) throw new Error('Acceptance criteria require unique named checks.');
  if (evidence.criteriaSha256 !== digest || !Array.isArray(evidence.checks) || required.some(id => !evidence.checks.some(check => check.id === id && check.passed === true)) || evidence.checks.some(check => check.passed !== true)) throw new Error('Feature-equivalent acceptance has not been verified. Do not count removed or failing features as savings.');
  return { variant: metadata.variant, cacheMode: metadata.cacheMode, startingContextSha256: metadata.startingContextSha256, acceptanceCriteriaSha256: digest, acceptanceVerified: true, requiredChecks: required };
}
export function measureUsage(events, { usdPerCredit = null, phases = null, fromUtc, toUtc, benchmark = null } = {}) {
  if (usdPerCredit !== null) number(usdPerCredit, 'USD-per-credit conversion');
  let markers = [];
  if (phases !== null) {
    if (phases.schemaVersion !== 1 || typeof phases.runId !== 'string' || !Array.isArray(phases.markers) || !phases.markers.length) throw new Error('Invalid phase markers.');
    markers = phases.markers;
    if (markers[0].phase !== 'setup' || markers.some((marker, index) => !phaseNames.includes(marker.phase) || !timestamp(marker.atUtc) || (index && Date.parse(marker.atUtc) <= Date.parse(markers[index - 1].atUtc)) || (marker.phase === 'end' && index !== markers.length - 1))) throw new Error('Phase markers must start at setup, increase, and end only at the final marker.');
  }
  const start = fromUtc ?? markers[0]?.atUtc;
  const end = toUtc ?? (markers.at(-1)?.phase === 'end' ? markers.at(-1).atUtc : undefined);
  if ((start !== undefined && !timestamp(start)) || (end !== undefined && !timestamp(end)) || (start && end && Date.parse(start) >= Date.parse(end))) throw new Error('Invalid accounting scope: use ISO timestamps with an explicit timezone (Z or an offset), never locale-formatted dates.');
  const breakdown = Object.fromEntries(categories.map(category => [category, { category, tokens: 0, credits: 0 }]));
  const perCall = []; const seen = new Map();
  for (const event of events) {
    if (event.type !== 'session.usage_record') continue;
    const time = Date.parse(event.timestamp);
    if (!timestamp(event.timestamp)) throw new Error('Usage record has no valid timezone-qualified completion timestamp.');
    if ((start && time < Date.parse(start)) || (end && time >= Date.parse(end))) continue;
    const usage = event.data?.usage;
    if (usage?.provider?.id !== 'copilot' || usage.aiCreditsStatus !== 'complete' || !Array.isArray(usage.copilotUsage?.tokenDetails) || !usage.copilotUsage.tokenDetails.length) throw new Error('Incomplete or unsupported usage metering; refusing a success-shaped partial total.');
    const sequence = number(usage.accounting?.sequence, 'accounting sequence', true);
    const signature = JSON.stringify(usage);
    if (seen.has(sequence)) {
      if (seen.get(sequence) !== signature) throw new Error(`Conflicting duplicate usage sequence ${sequence}. Use one session event stream.`);
      continue;
    }
    seen.set(sequence, signature);
    const detailRows = usage.copilotUsage.tokenDetails.map(detail => {
      if (!categories.includes(detail.tokenType)) throw new Error(`Unknown token category: ${detail.tokenType}`);
      const tokens = number(detail.tokenCount, 'token count', true);
      const batch = number(detail.batchSize, 'batch size');
      const cost = number(detail.costPerBatch, 'cost per batch');
      if (batch === 0) throw new Error('Provider batch size must be positive.');
      const credits = tokens / batch * cost / 1e9;
      if (!Number.isFinite(credits)) throw new Error('Provider credit calculation overflowed.');
      return { category: detail.tokenType, tokens, credits };
    });
    const input = sum(detailRows.filter(detail => detail.category !== 'output'));
    const output = sum(detailRows.filter(detail => detail.category === 'output'));
    if (input.tokens !== number(usage.inputTokens, 'input total', true) || output.tokens !== number(usage.outputTokens, 'output total', true)) throw new Error('Token details do not reconcile with provider totals.');
    const reported = number(usage.copilotUsage.totalNanoAiu, 'total NanoAIU') / 1e9;
    if (Math.abs(input.credits + output.credits - reported) > 0.000001) throw new Error('Credit costs do not reconcile with provider totals.');
    if (typeof usage.model !== 'string' || !usage.model) throw new Error('Usage record is missing the model ID.');
    const phase = markers.findLast(marker => Date.parse(marker.atUtc) <= time)?.phase ?? 'unattributed';
    if (phase === 'end') throw new Error('Call falls outside the marked run.');
    perCall.push({ sequence, measuredAtUtc: new Date(time).toISOString(), model: usage.model, phase, inputTokens: input.tokens, outputTokens: output.tokens, totalTokens: input.tokens + output.tokens, inputCredits: input.credits, outputCredits: output.credits, totalCredits: input.credits + output.credits, inputUsd: usdPerCredit === null ? null : input.credits * usdPerCredit, outputUsd: usdPerCredit === null ? null : output.credits * usdPerCredit, totalUsd: usdPerCredit === null ? null : (input.credits + output.credits) * usdPerCredit });
    for (const detail of detailRows) { breakdown[detail.category].tokens += detail.tokens; breakdown[detail.category].credits += detail.credits; }
  }
  if (!perCall.length) throw new Error('No provider-metered model calls are available in this scope. Usage and costs are unverified.');
  perCall.sort((a, b) => a.sequence - b.sequence);
  const input = sum(Object.values(breakdown).filter(detail => detail.category !== 'output'));
  const output = breakdown.output;
  const total = sum([input, output]);
  if (![input.tokens, output.tokens, total.tokens].every(Number.isSafeInteger)) throw new Error('Token totals exceed safe integer precision.');
  const byPhase = [...new Set(perCall.map(row => row.phase))].map(phase => {
    const calls = perCall.filter(row => row.phase === phase);
    const phaseInput = sum(calls.map(row => ({ tokens: row.inputTokens, credits: row.inputCredits })));
    const phaseOutput = sum(calls.map(row => ({ tokens: row.outputTokens, credits: row.outputCredits })));
    return { phase, calls: calls.length, input: priced(phaseInput, usdPerCredit), output: priced(phaseOutput, usdPerCredit), total: priced(sum([phaseInput, phaseOutput]), usdPerCredit) };
  });
  return {
    schemaVersion: 1, measuredAtUtc: new Date().toISOString(), runId: phases?.runId ?? null,
    scope: { fromInclusiveUtc: start ?? null, toExclusiveUtc: end ?? null, lastMeasuredCallUtc: [...perCall].sort((a, b) => a.measuredAtUtc.localeCompare(b.measuredAtUtc)).at(-1).measuredAtUtc, explicitlyBounded: Boolean(start && end), note: 'Completed provider-metered calls only. Excludes later generation, including the final reply, and unreported tool/runtime charges.' },
    provider: 'GitHub Copilot CLI', models: [...new Set(perCall.map(row => row.model))].sort(), callsMeasured: perCall.length,
    costUnit: 'Copilot AI credits', nanoAiuPerCredit: 1e9, usdPerCredit,
    usdBasis: usdPerCredit === null ? 'USD unavailable: no conversion rate supplied.' : 'Usage value at the caller-supplied USD-per-credit assumption, not an invoice or necessarily an additional charge.',
    input: { ...priced(input, usdPerCredit), includes: 'Uncached input plus cache reads and writes, counted once each.' }, output: priced({ tokens: output.tokens, credits: output.credits }, usdPerCredit), total: priced(total, usdPerCredit),
    breakdown: Object.values(breakdown).map(value => priced(value, usdPerCredit)),
    phaseAttribution: 'Completion-time buckets only. Mark before each phase; a call spanning a marker is not a causal per-tool cost measurement.',
    phases: byPhase, benchmark, perCall,
  };
}
export function usageTable(report) {
  const money = value => value === null ? 'N/A' : `$${value.toFixed(4)}`;
  return ['| Usage | Tokens | AI credits | USD |', '|---|---:|---:|---:|', ...[['Input, including cache', report.input], ['Output', report.output], ['Total', report.total]].map(([label, row]) => `| ${label} | ${row.tokens.toLocaleString('en-US')} | ${row.credits.toFixed(4)} | ${money(row.usd)} |`), '', report.usdBasis, report.scope.note, ''].join('\n');
}
if (isMain(import.meta.url)) await cli(() => {
  const { options, positional } = args(process.argv.slice(2), ['events', 'phases', 'out', 'usd-per-credit', 'from', 'to', 'benchmark']);
  if (positional.length || !options.events || !options.out) throw new Error('Usage: node measure-usage.mjs --events <session-events.jsonl> --out <new-folder> [--phases markers.json] [--usd-per-credit 0.01] [--from ISO --to ISO] [--benchmark metadata.json]');
  const events = readFileSync(resolve(options.events), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim()).map((line, index) => { try { return JSON.parse(line); } catch { throw new Error(`Invalid JSON in event stream at line ${index + 1}; no report was produced.`); } });
  const report = measureUsage(events, { phases: options.phases ? readJson(resolve(options.phases)) : null, usdPerCredit: options['usd-per-credit'] === undefined ? null : Number(options['usd-per-credit']), fromUtc: options.from, toUtc: options.to, benchmark: options.benchmark ? benchmarkMetadata(resolve(options.benchmark)) : null });
  const output = resolve(options.out);
  if (exists(output)) throw new Error('Output folder already exists. Choose a new folder; existing accounting will not be overwritten.');
  mkdirSync(output, { recursive: true });
  writeJson(join(output, 'usage.json'), report);
  const columns = Object.keys(report.perCall[0]);
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  writeFileSync(join(output, 'usage.csv'), [columns.map(cell).join(','), ...report.perCall.map(row => columns.map(key => cell(row[key])).join(','))].join('\r\n') + '\r\n', { flag: 'wx' });
  writeFileSync(join(output, 'usage.md'), usageTable(report), { flag: 'wx' });
  console.log(usageTable(report));
  console.log(`${report.callsMeasured} calls measured. Per-call, cache and phase breakdowns saved in ${output}`);
});
