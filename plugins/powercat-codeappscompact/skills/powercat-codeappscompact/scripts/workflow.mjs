import { closeSync, mkdirSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { exists, noLinkedAncestors, readJson, runNpm, runProcess, writeJson } from './lib.mjs';
import { writeAtomicJson } from './atomic-json.mjs';
import { fingerprints, fileDigest, digest, stageFingerprint, treeDigest } from './fingerprints.mjs';
import { preflight } from './preflight.mjs';
import { authenticationReadiness, serverReadiness } from './readiness.mjs';
import { verifyLocalPlay } from './verify-local-play.mjs';
import { verifyPortability } from './verify-portability.mjs';
import { measureUsage } from './measure-usage.mjs';
import { createHostRequest, hostRoutes, readHostEdit, requestIsCurrent, scopedEvidence, verifyMeshReceipt } from './host-request.mjs';

const scripts = dirname(fileURLToPath(import.meta.url));
function evidenceFile(root, path) {
  const file = resolve(root, path); const rel = relative(root, file);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('Evidence files must remain within their run folder.');
  noLinkedAncestors(file); return file;
}
function persist(output, state) {
  writeAtomicJson(join(output, 'verification.json'), state);
}
function reusable(check, fingerprint, app, output) {
  if (check?.status !== 'passed' || check.fingerprint !== fingerprint) return { valid: false, reason: 'No matching passed evidence for these inputs.' };
  try {
    if (!check.artifacts?.length || check.artifacts.some(item => fileDigest(evidenceFile(output, item.path)) !== item.sha256)) return { valid: false, reason: 'Saved evidence is missing or changed; rerunning the affected check.' };
    if (check.id === 'build' && check.distSha256 !== treeDigest(join(app, 'dist'))) return { valid: false, reason: 'Build artifacts changed; rebuilding before acceptance.' };
    return { valid: true };
  } catch (error) { return { valid: false, reason: `Saved evidence cannot be reused: ${error.message}` }; }
}
function browserEvidence(app, folder) {
  const file = join(folder, 'acceptance.json');
  const report = readJson(file); const criteria = readJson(join(app, 'tests', 'acceptance.json'));
  const ids = criteria.checks?.map(item => item.id);
  if (!ids?.length || new Set(ids).size !== ids.length || report.passed !== true || report.authenticatedLocalPlay !== false || report.criteriaSha256 !== fileDigest(join(app, 'tests', 'acceptance.json')) || !Array.isArray(report.checks) || report.checks.length !== ids.length || new Set(report.checks.map(item => item.id)).size !== ids.length || ids.some(id => !report.checks.some(item => item.id === id && item.passed === true))) throw new Error('Browser evidence does not prove the current acceptance contract. Use the bundled harness and run every independent domain assertion.');
  return { file, report };
}
function usageArguments(settings, output) {
  if (!settings?.events || (!settings.phases && !settings.from)) throw new Error('Accounting needs --events and explicit --phases or --from bounds. Missing usage is unavailable, not zero.');
  return ['--events', settings.events, '--out', output, ...['phases', 'from', 'to'].flatMap(key => settings[key] ? [`--${key}`, settings[key]] : []), ...(settings.usdPerCredit === undefined ? [] : ['--usd-per-credit', String(settings.usdPerCredit)])];
}
function budgetUsage(settings) {
  usageArguments(settings, 'unused');
  const events = readFileSync(settings.events, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid usage JSON at line ${index + 1}; budget cannot be verified.`); }
  });
  return measureUsage(events, { phases: settings.phases ? readJson(settings.phases) : null, fromUtc: settings.from, toUtc: settings.to }).total.credits;
}
export async function runWorkflow(appPath, options = {}, overrides = {}) {
  const app = resolve(appPath); noLinkedAncestors(app);
  const output = resolve(options.resume ?? options.output ?? join(app, 'evidence', `verify-${Date.now()}`)); noLinkedAncestors(output);
  if (output === app) throw new Error('Use a dedicated evidence subfolder, not the application root.');
  const inside = relative(app, output);
  if (!inside.startsWith('..') && !isAbsolute(inside) && inside.split(/[\\/]/)[0] !== 'evidence') throw new Error('In-app verification output must live under evidence, not in application inputs. An external dedicated folder is also supported.');
  if (options.resume && options.output) throw new Error('Choose --out for a new run or --resume for an existing run, not both.');
  if (!options.resume && exists(output)) throw new Error('Evidence folder already exists. Use --resume explicitly or choose a new folder.');
  const simulated = Object.keys(overrides).length > 0;
  const services = { preflight, npm: runNpm, authenticationReadiness, serverReadiness, localPlay: verifyLocalPlay, portability: verifyPortability, ...overrides };
  const state = options.resume ? readJson(join(output, 'verification.json')) : {
    schemaVersion: 3, runId: randomUUID(), app, kit: 'codeappscompact', version: '2.7.0', simulated,
    startedAtUtc: new Date().toISOString(), attempt: 0, checks: [], request: { browser: false, localPlay: false, hostEdit: false, portability: false, accounting: false },
  };
  if (state.schemaVersion !== 3 || state.version !== '2.7.0' || state.app !== app || state.simulated !== simulated || !Array.isArray(state.checks) || !state.request || !Number.isSafeInteger(state.attempt)) throw new Error('Resume state belongs to another app, format or execution mode. No evidence was reused.');
  if (options.hostRoute !== undefined && !hostRoutes.includes(options.hostRoute)) throw new Error('Host route must be cdp, mesh-uia or mesh-browser.');
  const selectedRoute = options.hostRoute ?? (options.cdpUrl ? 'cdp' : state.hostRoute);
  if (options.cdpUrl && selectedRoute !== 'cdp') throw new Error('Choose one explicitly authorized browser route; no automatic fallback is allowed.');
  if (state.hostPermissionDenied && (options.hostReceipt || options.cdpUrl || (selectedRoute && selectedRoute !== state.hostRoute))) throw new Error('Host permission was denied. Do not retry or switch tools/routes to bypass that decision.');
  state.hostRoute = selectedRoute;
  state.request.browser ||= Boolean(options.browser); state.request.localPlay ||= Boolean(options.localPlay || options.cdpUrl || options.hostRoute || options.hostReceipt || options.hostEdit);
  state.request.hostEdit ||= Boolean(options.hostEdit || (state.request.localPlay && readHostEdit(app)));
  state.request.portability ||= Boolean(options.portabilityDestination); state.request.accounting ||= Boolean(options.accounting);
  state.portabilityDestination = options.portabilityDestination ? resolve(options.portabilityDestination) : state.portabilityDestination;
  state.accounting = options.accounting ?? state.accounting;
  if (options.maxCredits !== undefined) state.maxCredits = options.maxCredits;
  if (state.maxCredits !== undefined && (!Number.isFinite(state.maxCredits) || state.maxCredits <= 0 || !state.request.accounting)) throw new Error('A positive --max-credits budget requires explicit metered accounting inputs.');
  const timeoutMs = options.timeoutMs ?? 10000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) throw new Error('Readiness timeout must be 100 through 120000 ms.');
  if (state.request.accounting) usageArguments(state.accounting, 'unused');
  mkdirSync(output, { recursive: true });
  const lock = join(output, '.run.lock'); noLinkedAncestors(lock);
  let handle;
  try { handle = openSync(lock, 'wx'); }
  catch (error) { throw new Error(`Run is locked or inaccessible: ${lock}. Do not start a parallel verifier. After a crash, inspect and remove only this exact stale lock through an authorized action. ${error.message}`); }
  try {
    state.attempt++; state.updatedAtUtc = new Date().toISOString(); state.passed = false; state.status = 'running'; state.authenticatedLocalPlay = false;
    delete state.error;
    const attempt = join(output, `attempt-${String(state.attempt).padStart(3, '0')}`); mkdirSync(attempt);
    persist(output, state);
    const accountingSnapshot = options.prepareAccounting?.();
    const current = fingerprints(app); state.fingerprints = current;
    let hostRequest;
    if (state.request.localPlay && selectedRoute && !state.hostPermissionDenied) {
      const scope = { runId: state.runId, inputsSha256: digest(JSON.stringify(current)), route: selectedRoute, requireEdit: state.request.hostEdit };
      if (state.hostHandoff && !state.hostHandoff.consumed) {
        const path = evidenceFile(output, state.hostHandoff.path);
        if (exists(path) && fileDigest(path) === state.hostHandoff.sha256) {
          const saved = readJson(path);
          if (requestIsCurrent(saved, scope)) hostRequest = saved;
        }
      }
      if (!hostRequest) {
        const path = join(attempt, 'host-request.json');
        hostRequest = createHostRequest(app, { ...scope, output: path });
        state.hostHandoff = { path: relative(output, path), sha256: fileDigest(path), consumed: false };
      }
      persist(output, state);
    }
    let blockedByBudget;
    async function check(id, work, cache = false) {
      const fingerprint = ['build', 'lint', 'test', 'browser', 'portability'].includes(id) ? stageFingerprint(id, current) : digest(`${state.runId}:${state.attempt}:${id}`);
      const previous = state.checks.find(item => item.id === id);
      const reuse = cache ? reusable(previous, fingerprint, app, output) : { valid: false, reason: 'Live prerequisite, host or accounting checks are never cached.' };
      if (reuse.valid) { previous.reused = true; persist(output, state); return previous; }
      const entry = { id, fingerprint, status: 'running', passed: false, reused: false, invalidatedReason: reuse.reason, checkedAtUtc: new Date().toISOString(), artifacts: [] };
      state.checks = [...state.checks.filter(item => item.id !== id), entry]; persist(output, state);
      const log = join(attempt, `${id}.log`);
      try {
        const detail = await work(log);
        if (JSON.stringify(fingerprints(app)) !== JSON.stringify(current)) throw new Error('Application inputs changed during verification. Let edits settle, then resume; this attempt cannot certify the changed app.');
        entry.status = detail?.status ?? 'passed';
        if (!['passed', 'failed', 'blocked'].includes(entry.status)) throw new Error(`Invalid ${id} outcome.`);
        entry.detail = detail ?? {}; entry.passed = entry.status === 'passed';
        if (id === 'build' && entry.passed) {
          if (!exists(join(app, 'dist'))) throw new Error('Build exited successfully without dist artifacts.');
          entry.distSha256 = treeDigest(join(app, 'dist'));
        }
      } catch (error) { entry.status = 'failed'; entry.passed = false; entry.error = error.message; }
      const report = join(attempt, `${id}.json`); writeJson(report, { status: entry.status, detail: entry.detail, error: entry.error });
      const files = [report, ...(exists(log) ? [log] : [])];
      if (id === 'browser' && entry.passed) files.push(join(attempt, 'browser-evidence', 'acceptance.json'));
      if (id === 'host' && entry.passed) {
        files.push(join(attempt, 'local-play.json'));
        for (const artifact of entry.detail.observerArtifacts ?? []) {
          const path = evidenceFile(output, artifact.path);
          if (fileDigest(path) !== artifact.sha256) throw new Error('Mesh observation changed during verification.');
          files.push(path);
        }
      }
      if (id === 'accounting' && entry.passed) files.push(...['usage.json', 'usage.csv', 'usage.md'].map(file => join(attempt, 'usage', file)));
      entry.artifacts = files.map(file => ({ path: relative(output, file), sha256: fileDigest(file) }));
      persist(output, state); return entry;
    }
    async function localCheck(id, work, cache = true) {
      if (JSON.stringify(fingerprints(app)) !== JSON.stringify(current)) return check(id, async () => ({ status: 'failed', reason: 'Inputs changed while verifying. Resume after the app stops changing.' }));
      if (state.maxCredits !== undefined && !blockedByBudget) {
        try {
          const used = budgetUsage(state.accounting);
          if (used >= state.maxCredits) blockedByBudget = `Measured ${used.toFixed(4)} credits reached the ${state.maxCredits} credit budget. Required checks remain outstanding. Review progress and explicitly raise the budget before resuming.`;
        } catch (error) { blockedByBudget = `Cost budget cannot be verified: ${error.message}`; }
      }
      if (blockedByBudget) return check(id, async () => ({ status: 'blocked', reason: blockedByBudget }));
      return check(id, work, cache && !options.fresh);
    }
    let route;
    if (state.request.localPlay) route = await check('auth-route', () => {
      if (state.hostPermissionDenied) return { status: 'blocked', reason: 'Mesh denied host access. No retry or route fallback is authorized.', permissionDenied: true };
      if (selectedRoute?.startsWith('mesh-')) {
        if (!options.hostReceipt) return { status: 'blocked', reason: 'Awaiting the selected Mesh tools: observe the scoped host request once, then supply the receipt to finalize. Tool permissions remain authoritative.', handoff: state.hostHandoff.path };
        const receipt = readJson(scopedEvidence(output, options.hostReceipt));
        if (['denied', 'blocked'].includes(receipt.outcome)) {
          const result = verifyMeshReceipt(hostRequest, options.hostReceipt, output);
          if (result.permissionDenied) state.hostPermissionDenied = true;
          return result;
        }
        return { status: 'passed', reason: 'Mesh receipt supplied for fresh validation; neither authentication nor tool permission is inferred from route selection.' };
      }
      if (options.hostReceipt) throw new Error('A Mesh receipt requires its explicitly selected Mesh route.');
      return services.authenticationReadiness(options.cdpUrl, Math.min(timeoutMs, 3000));
    });
    const ready = await localCheck('preflight', () => services.preflight(app, false, { localOnly: !state.request.localPlay }), false);
    let localPassed = ready.passed;
    const pkg = readJson(join(app, 'package.json'));
    for (const id of ['build', 'lint', 'test', ...(state.request.browser ? ['browser'] : [])]) {
      const result = await localCheck(id, async log => {
        if (!localPassed) return { status: 'blocked', reason: 'An earlier application check failed or is blocked. Repair it and resume; no acceptance checks were silently omitted.' };
        const script = id === 'browser' ? 'test:browser' : id;
        if (!pkg.scripts?.[script]) throw new Error(`Missing ${script} script. Provide the app's documented equivalent; do not silently skip it.`);
        await services.npm(app, ['run', script, '--silent'], log, { env: id === 'browser' ? { CODECOMPACT_BROWSER_EVIDENCE: join(attempt, 'browser-evidence') } : {} });
        if (id === 'browser') return { status: 'passed', acceptance: browserEvidence(app, join(attempt, 'browser-evidence')).report };
        return { status: 'passed', scope: 'Application checks only; no toolkit-maintainer suite was run.' };
      });
      localPassed &&= result.passed;
    }
    if (state.request.portability) await localCheck('portability', async () => {
      if (!localPassed) return { status: 'blocked', reason: 'Local checks must pass before the explicitly requested clean restore.' };
      if (!state.portabilityDestination) return { status: 'blocked', reason: 'Choose a new isolated --portability-destination.' };
      return services.portability(app, state.portabilityDestination);
    });
    if (state.request.localPlay) {
      const server = await localCheck('server', () => localPassed ? services.serverReadiness(app, timeoutMs) : { status: 'blocked', reason: 'Application checks must pass before host verification.' }, false);
      await localCheck('host', async () => {
        if (!localPassed || !route.passed || !server.passed) return { status: 'blocked', reason: 'Local app, server or authorized browser prerequisite is incomplete. Resume only after the reported prerequisite changes.' };
        try {
          const result = selectedRoute?.startsWith('mesh-')
            ? verifyMeshReceipt(hostRequest, options.hostReceipt, output, join(attempt, 'local-play.json'))
            : await services.localPlay(app, options.cdpUrl, join(attempt, 'local-play.json'), hostRequest);
          if (result.authenticatedLocalPlay !== true || (state.request.hostEdit && result.savedEditReloadVerified !== true)) throw new Error('Host verifier did not prove the required authentication and saved-edit scope.');
          if (state.hostHandoff) state.hostHandoff.consumed = true;
          return result;
        }
        catch (error) { if (selectedRoute?.startsWith('mesh-')) throw error; return { status: 'blocked', reason: `Authenticated Local Play remains unverified: ${error.message}` }; }
      }, false);
    }
    if (state.request.accounting) await check('accounting', log => {
      const usage = join(attempt, 'usage');
      runProcess(app, process.execPath, [join(scripts, 'measure-usage.mjs'), ...usageArguments(accountingSnapshot ?? state.accounting, usage)], log);
      const report = readJson(join(usage, 'usage.json'));
      return { status: 'passed', calls: report.callsMeasured, total: report.total, scope: report.scope, costUnit: report.costUnit, usdBasis: report.usdBasis };
    });
    if (JSON.stringify(fingerprints(app)) !== JSON.stringify(current)) throw new Error('Application inputs changed during this attempt. Resume after edits settle; no final success can be recorded.');
    state.status = state.checks.some(item => item.status === 'failed') ? 'failed' : state.checks.some(item => item.status !== 'passed') ? 'blocked' : 'passed';
    state.passed = state.status === 'passed';
    state.authenticatedLocalPlay = !simulated && state.checks.some(item => item.id === 'host' && item.passed && item.detail.authenticatedLocalPlay === true);
    state.updatedAtUtc = new Date().toISOString(); persist(output, state);
    const checkpoint = join(attempt, 'verification-result.json'); writeJson(checkpoint, state);
    return { ...state, evidence: output, checkpoint };
  } catch (error) {
    state.status = 'failed'; state.passed = false; state.authenticatedLocalPlay = false; state.error = error.message; persist(output, state); throw error;
  } finally { closeSync(handle); unlinkSync(lock); }
}
export function workflowSummary(result) {
  const lines = result.checks.map(check => `${check.id}: ${check.status}${check.reused ? ' (matching evidence reused)' : ''}${check.error || check.detail?.reason ? ` - ${(check.error ?? check.detail.reason).slice(0, 650)}` : ''}`);
  const handoff = result.hostHandoff && !result.hostHandoff.consumed && !result.hostPermissionDenied ? `\nHost handoff: ${join(result.evidence, result.hostHandoff.path)}` : '';
  return `${result.status.toUpperCase()} - ${result.checks.length} scoped stages; authenticated Local Play: ${result.authenticatedLocalPlay ? 'fresh scoped evidence recorded' : 'not verified'}${result.simulated ? '; SIMULATED tool test' : ''}\n${lines.join('\n')}\nEvidence: ${result.evidence}${handoff}\nResume with --resume using this evidence folder; required scopes are retained. No server/profile/process settings changed. Requested synthetic probe writes are reported.`;
}
