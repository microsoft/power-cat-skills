import { randomUUID } from 'node:crypto';
import { statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { appOrigin, environmentGuid, exists, noLinkedAncestors, readJson, writeJson } from './lib.mjs';
import { digest, fileDigest } from './fingerprints.mjs';

export const hostRoutes = ['cdp', 'mesh-uia', 'mesh-browser'];
const lifetimeMs = 15 * 60 * 1000;
export function scopedEvidence(root, path) {
  const file = resolve(root, path); const rel = relative(root, file);
  if (!rel || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)) throw new Error('Host evidence must remain inside this verification run.');
  noLinkedAncestors(file); return file;
}
export function readHostEdit(app, required = false) {
  const file = join(app, 'tests', 'local-play.json');
  if (!exists(file)) {
    if (required) throw new Error('Saved-edit verification requires app-owned tests/local-play.json with an explicitly authorized synthetic fixture.');
    return null;
  }
  const edit = readJson(file);
  if (edit.schemaVersion !== 1 || edit.dataScope !== 'synthetic-demo' || edit.restore !== true || ['collection', 'recordLabel', 'field', 'valueTemplate'].some(key => typeof edit[key] !== 'string' || !edit[key].trim() || edit[key].length > 500) || !edit.valueTemplate.includes('{verificationId}') || edit.valueTemplate !== edit.valueTemplate.trim()) throw new Error('Local Play bindings need schemaVersion:1, dataScope:synthetic-demo, collection, recordLabel, a non-label text field, valueTemplate containing {verificationId}, and restore:true. No edits were attempted.');
  return edit;
}
export function createHostRequest(app, { runId, inputsSha256, route, requireEdit = false, output }, now = Date.now()) {
  if (!hostRoutes.includes(route) || !runId || !/^[a-f0-9]{64}$/.test(inputsSha256)) throw new Error('Invalid scoped host-verification request.');
  const power = readJson(join(app, 'power.config.json'));
  if (!environmentGuid(power.environmentId)) throw new Error('Host verification requires the configured environment.');
  const origin = appOrigin(power.localAppUrl).origin;
  const verificationId = randomUUID(); const frame = new URL(`${origin}/`); frame.searchParams.set('cc-verify', verificationId);
  const url = new URL(`https://apps.powerapps.com/play/e/${power.environmentId}/a/local`);
  url.searchParams.set('_localAppUrl', frame.href);
  url.searchParams.set('_localConnectionUrl', `${origin}/__vite_powerapps_plugin__/power.config.json`);
  const binding = readHostEdit(app, requireEdit);
  const request = {
    schemaVersion: 1, runId, verificationId, inputsSha256, route,
    issuedAtUtc: new Date(now).toISOString(), expiresAtUtc: new Date(now + lifetimeMs).toISOString(),
    appOrigin: origin, environmentId: power.environmentId, localPlayUrl: url.href, frameUrl: frame.href,
    proofText: `Verified Power Apps host | ${power.environmentId.toLowerCase()} | ${origin} | ${verificationId}`,
    edit: binding ? { collection: binding.collection, recordLabel: binding.recordLabel, field: binding.field, value: binding.valueTemplate.replaceAll('{verificationId}', verificationId), restore: true } : null,
    permission: 'This is a handoff, not permission. Use only the selected authorized route. Mesh tool decisions are authoritative; never enable debugging or switch routes after denial. No tool is invoked by this file.',
    steps: ['Open the exact Local Play URL in the authorized signed-in browser; do not capture identity/session values.', 'Observe the matching Power Apps parent URL and the exact SDK-backed proofText inside its app frame. A standalone preview or CLI sign-in is insufficient.', ...(binding ? ['Edit ONLY the named synthetic fixture text field to the unique value; save, reload the Power Apps parent, reopen the same record and observe the value.', 'Restore the original field value, save, reload and verify restoration. Never change record labels, bypass a dirty-draft prompt, or edit an unrelated record.'] : []), 'Save sanitized Mesh observations inside this run; supply a fresh receipt to finalize.mjs. Record blocked/denied truthfully. Hashes bind scope and integrity, not the truth of an observation.'],
  };
  if (output) {
    if (route.startsWith('mesh-')) {
      request.receiptTemplateFile = 'mesh-receipt.template.json';
      writeJson(join(dirname(output), request.receiptTemplateFile), {
        schemaVersion: 1, runId, verificationId, inputsSha256, route, checkedAtUtc: null,
        outcome: 'blocked', reason: 'Unfilled template, not an observation.', parentUrl: null, frameUrl: null, proofText: null,
        observations: (binding ? ['host', 'reload', 'restore'] : ['host']).map(phase => ({ phase, tool: route === 'mesh-uia' ? 'mesh-find_element' : 'mesh-browser', observedAtUtc: null, path: null })),
        ...(binding ? { edit: { beforeValue: null, afterReloadValue: null, restoredValue: null } } : {}),
      });
    }
    writeJson(output, request);
  }
  return request;
}
export function requestIsCurrent(request, { runId, inputsSha256, route, requireEdit }, now = Date.now()) {
  return request?.schemaVersion === 1 && request.runId === runId && request.inputsSha256 === inputsSha256 && request.route === route && (!requireEdit || request.edit !== null) && Number.isFinite(Date.parse(request.issuedAtUtc)) && Date.parse(request.issuedAtUtc) <= now && Date.parse(request.expiresAtUtc) > now;
}
export function verifyMeshReceipt(request, receiptPath, runFolder, output, now = Date.now()) {
  const receiptFile = scopedEvidence(runFolder, receiptPath); const receipt = readJson(receiptFile);
  if (!requestIsCurrent(request, request, now) || !['mesh-uia', 'mesh-browser'].includes(request.route)) throw new Error('The Mesh host challenge expired or belongs to another route. Obtain a new request; old host passes are never reused.');
  if (receipt.schemaVersion !== 1 || receipt.runId !== request.runId || receipt.verificationId !== request.verificationId || receipt.inputsSha256 !== request.inputsSha256 || receipt.route !== request.route) throw new Error('Mesh receipt does not match the app, inputs, run and one-use challenge.');
  const checkedAt = Date.parse(receipt.checkedAtUtc);
  if (!Number.isFinite(checkedAt) || checkedAt < Date.parse(request.issuedAtUtc) || checkedAt > now + 2000 || checkedAt >= Date.parse(request.expiresAtUtc)) throw new Error('Mesh receipt must contain a fresh observation timestamp.');
  if (['blocked', 'denied'].includes(receipt.outcome)) {
    if (typeof receipt.reason !== 'string' || !receipt.reason.trim() || receipt.reason.length > 1000) throw new Error('Blocked/denied receipts require a concise reason, not a pass flag.');
    return { status: 'blocked', authenticatedLocalPlay: false, permissionDenied: receipt.outcome === 'denied', reason: receipt.reason, checkedAtUtc: receipt.checkedAtUtc };
  }
  if (receipt.outcome !== 'passed' || receipt.parentUrl !== request.localPlayUrl || receipt.frameUrl !== request.frameUrl || receipt.proofText !== request.proofText) throw new Error('Mesh observations must include the exact parent, frame and SDK-backed scoped proof; booleans alone are not authentication evidence.');
  const phases = request.edit ? ['host', 'reload', 'restore'] : ['host'];
  if (!Array.isArray(receipt.observations) || receipt.observations.length !== phases.length) throw new Error('Missing host/edit/reload/restoration observations.');
  let previousAt = Date.parse(request.issuedAtUtc);
  const artifacts = phases.map((phase, index) => {
    const item = receipt.observations[index]; const observedAt = Date.parse(item?.observedAtUtc);
    const tools = request.route === 'mesh-uia' ? ['mesh-find_element', 'mesh-screenshot_window', 'mesh-crop_screenshot'] : ['mesh-browser'];
    if (item?.phase !== phase || !tools.includes(item.tool) || typeof item.path !== 'string' || !Number.isFinite(observedAt) || observedAt < previousAt || observedAt > checkedAt) throw new Error(`Missing or out-of-order authorized Mesh observation: ${phase}`);
    previousAt = observedAt;
    const file = scopedEvidence(runFolder, item.path);
    if (file === receiptFile || !statSync(file).isFile() || statSync(file).size === 0) throw new Error('Each Mesh observation needs a nonempty separate local evidence file.');
    return { path: relative(runFolder, file), sha256: fileDigest(file), phase, tool: item.tool, observedAtUtc: item.observedAtUtc };
  });
  if (new Set(artifacts.map(item => item.path)).size !== phases.length) throw new Error('Host, reload and restore need distinct observation artifacts.');
  if (request.edit) {
    let edit = receipt.edit;
    if (edit && ['beforeValue', 'afterReloadValue', 'restoredValue'].some(key => Object.hasOwn(edit, key))) {
      if (['beforeValue', 'afterReloadValue', 'restoredValue'].some(key => typeof edit[key] !== 'string') || ['beforeSha256', 'reloadedSha256', 'restoredSha256'].some(key => Object.hasOwn(edit, key))) throw new Error('Supply only exact observed synthetic strings OR only hashes, not mixed or incomplete values.');
      edit = { beforeSha256: digest(edit.beforeValue), reloadedSha256: digest(edit.afterReloadValue), restoredSha256: digest(edit.restoredValue) };
    }
    if (!edit || !/^[a-f0-9]{64}$/.test(edit.beforeSha256) || edit.beforeSha256 === digest(request.edit.value) || edit.reloadedSha256 !== digest(request.edit.value) || edit.restoredSha256 !== edit.beforeSha256) throw new Error('Saved-edit evidence must prove a changed value after reload AND restoration of the original field.');
  } else if (receipt.edit !== undefined) throw new Error('The request did not authorize a synthetic saved edit.');
  const result = {
    status: 'passed', checkedAtUtc: receipt.checkedAtUtc, authenticatedLocalPlay: true, savedEditReloadVerified: Boolean(request.edit), restoredOriginalField: Boolean(request.edit),
    method: request.route, provenance: 'Agent-observed authorized Mesh tool output; Node validates scope, freshness and integrity, not independent browser observation.',
    runId: request.runId, verificationId: request.verificationId, inputsSha256: request.inputsSha256,
    environmentId: request.environmentId, appOrigin: request.appOrigin, identityOrSessionDataSaved: false,
    observerArtifacts: [...artifacts, { path: relative(runFolder, receiptFile), sha256: fileDigest(receiptFile), phase: 'receipt' }],
  };
  writeJson(output, result); return result;
}
