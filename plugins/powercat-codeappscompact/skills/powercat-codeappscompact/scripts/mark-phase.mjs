import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { args, cli, exists, isMain, readJson, writeJson } from './lib.mjs';

export const phaseNames = ['setup', 'implementation', 'verification', 'reporting', 'end'];
export function markPhase(file, phase, at = new Date().toISOString()) {
  if (!phaseNames.includes(phase) || !Number.isFinite(Date.parse(at))) throw new Error('Use setup, implementation, verification, reporting or end, with an ISO timestamp.');
  const existing = exists(file);
  const report = existing ? readJson(file) : { schemaVersion: 1, runId: randomUUID(), attribution: 'Model-call completion timestamp buckets, not causal tool runtime', markers: [] };
  if (report.schemaVersion !== 1 || !Array.isArray(report.markers)) throw new Error('Invalid phase file.');
  if (!report.markers.length && phase !== 'setup') throw new Error('Start a new run with setup.');
  if (report.markers.at(-1)?.phase === 'end') throw new Error('This run has ended. Start a new phase file.');
  if (report.markers.length && Date.parse(at) <= Date.parse(report.markers.at(-1).atUtc)) throw new Error('Phase timestamps must increase.');
  report.markers.push({ phase, atUtc: new Date(at).toISOString() });
  writeJson(file, report, existing);
  return report;
}
if (isMain(import.meta.url)) await cli(() => {
  const { options, positional } = args(process.argv.slice(2), ['file', 'phase', 'at']);
  if (positional.length || !options.file || !options.phase) throw new Error('Usage: node mark-phase.mjs --file <phase-file.json> --phase <setup|implementation|verification|reporting|end> [--at ISO]');
  const report = markPhase(resolve(options.file), options.phase, options.at);
  console.log(`Run ${report.runId}: ${report.markers.at(-1).phase} at ${report.markers.at(-1).atUtc}`);
});
