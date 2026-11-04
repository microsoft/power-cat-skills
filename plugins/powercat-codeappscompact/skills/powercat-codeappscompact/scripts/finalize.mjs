import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { cli, exists, isMain, noLinkedAncestors, readJson, writeJson } from './lib.mjs';
import { fingerprints, fileDigest } from './fingerprints.mjs';
import { usageTable } from './measure-usage.mjs';
import { runWorkflow, workflowSummary } from './workflow.mjs';
import { workflowOptions } from './workflow-options.mjs';

export async function finalize(appPath, options = {}, overrides = {}) {
  const app = resolve(appPath);
  const previous = options.resume ? readJson(join(resolve(options.resume), 'verification.json')) : null;
  if (previous && previous.app !== app) throw new Error('Finalization must use the same app as the verification run.');
  if (options.output && options.resume) throw new Error('Choose a new --out run or --resume, not both.');
  const run = resolve(options.resume ?? options.output ?? join(app, 'evidence', `verify-${randomUUID()}`));
  const reportFolder = join(run, `finalization-${randomUUID()}`);
  const settings = options.accounting ?? previous?.accounting;
  const cutoff = new Date().toISOString();
  let snapshot;
  if (settings) {
    if (!settings.events || (!settings.phases && !settings.from)) throw new Error('Final accounting needs an authorized event stream and the original start scope, including repairs/retries.');
    const phases = settings.phases ? readJson(settings.phases) : null;
    const to = settings.to ?? (phases?.markers?.at(-1)?.phase === 'end' ? phases.markers.at(-1).atUtc : cutoff);
    if (!Number.isFinite(Date.parse(to)) || Date.parse(to) > Date.parse(cutoff)) throw new Error('The accounting cutoff cannot be invalid or in the future.');
    if (phases && (!Array.isArray(phases.markers) || !phases.markers.length)) throw new Error('Invalid original phase markers.');
    if (phases && phases.markers.at(-1).phase !== 'end') {
      if (Date.parse(to) <= Date.parse(phases.markers.at(-1).atUtc)) throw new Error('The final cutoff must follow all phase markers.');
      phases.markers.push({ phase: 'end', atUtc: new Date(to).toISOString() });
    }
    snapshot = { settings: { ...settings, to: new Date(to).toISOString() }, phases };
  } else if (previous?.request.accounting) throw new Error('Requested accounting is unavailable; do not report a zero total.');
  noLinkedAncestors(run);
  if (!options.resume && exists(run)) throw new Error('Run folder already exists. Resume explicitly; existing evidence will not be overwritten.');
  // The runner creates/locks the run before writing this immutable reporting snapshot.
  const prepareAccounting = () => {
    noLinkedAncestors(reportFolder); mkdirSync(reportFolder);
    writeJson(join(reportFolder, 'boundary.json'), { schemaVersion: 1, capturedAtUtc: cutoff, toExclusiveUtc: snapshot?.settings.to ?? null, note: 'Completed metered calls available at this cutoff, including repairs/retries from the original start. Later generation and the final reply are excluded.' });
    if (!snapshot) return undefined;
    if (snapshot.phases) {
      const file = join(reportFolder, 'phases.json'); writeJson(file, snapshot.phases); snapshot.settings.phases = file;
    }
    return snapshot.settings;
  };
  const result = await runWorkflow(app, { ...options, ...(options.resume ? { resume: run } : { output: run }), accounting: settings, prepareAccounting }, overrides);
  if (JSON.stringify(fingerprints(app)) !== JSON.stringify(result.fingerprints)) throw new Error('App inputs changed before final reporting. Resume verification; no completed report was produced.');
  const accounting = result.checks.find(check => check.id === 'accounting');
  const usageArtifact = accounting?.passed ? accounting.artifacts.find(item => /[\\/]usage\.json$/.test(item.path)) : null;
  const usagePath = usageArtifact ? join(run, usageArtifact.path) : null;
  if (usageArtifact && fileDigest(usagePath) !== usageArtifact.sha256) throw new Error('Accounting evidence changed before reporting.');
  const usage = usagePath ? readJson(usagePath) : null;
  const host = result.checks.find(check => check.id === 'host');
  let localPlayUrl = null;
  if (result.hostHandoff) {
    const requestFile = join(run, result.hostHandoff.path);
    if (fileDigest(requestFile) !== result.hostHandoff.sha256) throw new Error('Host handoff changed before reporting.');
    const request = readJson(requestFile); const url = new URL(request.localPlayUrl);
    url.searchParams.set('_localAppUrl', request.appOrigin + '/'); localPlayUrl = url.href;
  }
  const report = {
    schemaVersion: 1, version: '2.3.0', app, localPlayUrl, runId: result.runId, status: result.status, completeWithinRequestedScope: result.passed && !result.simulated, simulated: result.simulated,
    requested: result.request, authenticatedLocalPlay: result.authenticatedLocalPlay, savedEditReloadVerified: result.authenticatedLocalPlay && host?.detail.savedEditReloadVerified === true,
    hostMethod: host?.passed ? host.detail.method : null, hostObservedAtUtc: host?.passed ? host.detail.checkedAtUtc ?? null : null,
    outstanding: result.checks.filter(check => !check.passed).map(check => ({ id: check.id, status: check.status, reason: check.error ?? check.detail?.reason })),
    verification: { path: relative(reportFolder, result.checkpoint), sha256: fileDigest(result.checkpoint) },
    usage: usage ? { path: relative(reportFolder, usagePath), sha256: usageArtifact.sha256, callsMeasured: usage.callsMeasured, scope: usage.scope, input: usage.input, output: usage.output, total: usage.total, usdPerCredit: usage.usdPerCredit } : null,
    accountingStatus: usage ? 'measured' : result.request.accounting ? 'unavailable; see failed accounting stage' : 'not requested',
    note: 'One cutoff and the existing reconciler; no inferred prices, raw session content, excluded repair attempts, or claim of savings versus 2.0.',
  };
  const summary = `${workflowSummary(result)}\nApp: ${app}${localPlayUrl ? `\nLocal Play: ${localPlayUrl}` : ''}\nSaved edit/reload: ${report.savedEditReloadVerified ? 'observed; original field restored' : 'not verified'}\n\n${usage ? usageTable(usage) + `\n${usage.callsMeasured} completed calls; cutoff (exclusive): ${usage.scope.toExclusiveUtc}\n` : `Usage: ${report.accountingStatus}.\n`}\nFinal report: ${join(reportFolder, 'finalization.json')}\n${usagePath ? `Per-call accounting: ${join(run, accounting.artifacts.find(item => item.path.endsWith('usage.csv')).path)}\n` : ''}`;
  writeJson(join(reportFolder, 'finalization.json'), report);
  writeFileSync(join(reportFolder, 'summary.txt'), summary, { flag: 'wx' });
  return { ...report, summary, reportFolder };
}
if (isMain(import.meta.url)) await cli(async () => {
  const parsed = workflowOptions(process.argv.slice(2));
  const result = await finalize(parsed.app, parsed.options);
  console.log(result.summary);
  if (result.status !== 'passed') process.exitCode = result.status === 'blocked' ? 2 : 1;
});
