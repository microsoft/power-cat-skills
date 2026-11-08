import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { appOrigin, readJson } from './lib.mjs';

export function cdpEndpoint(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Use an explicitly authorized loopback HTTP CDP origin with a port. No profile/debugging settings are changed.');
  return url;
}
export async function authenticationReadiness(value, timeoutMs = 2000) {
  if (!value) return { status: 'blocked', reason: 'No authorized browser route supplied. Local checks can continue; supply --cdp-url only for an already authorized loopback endpoint. Do not enable debugging or bypass a tool denial.', authenticatedLocalPlay: false };
  const endpoint = cdpEndpoint(value);
  try {
    const response = await fetch(new URL('json/version', endpoint), { redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`CDP readiness returned HTTP ${response.status}.`);
    const version = await response.json();
    if (typeof version.Browser !== 'string' || typeof version.webSocketDebuggerUrl !== 'string') throw new Error('Endpoint did not return CDP version metadata.');
    const socket = new URL(version.webSocketDebuggerUrl);
    if (socket.protocol !== 'ws:' || !['localhost', '127.0.0.1', '[::1]'].includes(socket.hostname) || socket.username || socket.password) throw new Error('CDP advertised a non-loopback or credentialed socket.');
    return { status: 'passed', reason: 'Authorized CDP transport is reachable; sign-in and the matching Local Play frame are NOT yet verified.', authenticatedLocalPlay: false };
  } catch (error) {
    return { status: 'blocked', reason: `Authorized browser route unavailable: ${error.message}. Continue local work and resume host verification after the prerequisite changes.`, authenticatedLocalPlay: false };
  }
}
export async function serverReadiness(app, timeoutMs = 10000) {
  const power = readJson(join(app, 'power.config.json'));
  const origin = appOrigin(power.localAppUrl);
  const until = Date.now() + timeoutMs;
  let reason = 'Server has not responded.';
  do {
    try {
      const remaining = Math.max(1, until - Date.now());
      const response = await fetch(new URL('__vite_powerapps_plugin__/power.config.json', origin), { redirect: 'error', signal: AbortSignal.timeout(Math.min(2000, remaining)) });
      if (!response.ok) throw new Error(`Power Apps configuration returned HTTP ${response.status}.`);
      const actual = await response.json();
      if (actual.environmentId !== power.environmentId || actual.appDisplayName !== power.appDisplayName || appOrigin(actual.localAppUrl).origin !== origin.origin) throw new Error('The responding server is not the configured app/environment. No process was changed.');
      const page = await fetch(origin, { redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.min(2000, until - Date.now()))) });
      if (!page.ok) throw new Error(`App page returned HTTP ${page.status}.`);
      return { status: 'passed', appOrigin: origin.origin, authenticatedLocalPlay: false };
    } catch (error) { reason = error.message; }
    if (Date.now() < until) await delay(Math.min(250, until - Date.now()));
  } while (Date.now() < until);
  return { status: 'blocked', reason: `${reason} Start this app through the authorized development workflow, then resume. This tool neither starts nor stops servers.`, authenticatedLocalPlay: false };
}
