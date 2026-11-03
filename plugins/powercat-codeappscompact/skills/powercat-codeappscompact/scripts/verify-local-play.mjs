import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { args, appOrigin, cli, environmentGuid, isMain, readJson, writeJson } from './lib.mjs';
import { cdpEndpoint } from './readiness.mjs';
import { verifySavedEdit } from './host-edit.mjs';

export async function verifyLocalPlay(app, cdpUrl, output, request) {
  const endpoint = cdpEndpoint(cdpUrl);
  const power = readJson(join(app, 'power.config.json'));
  if (!environmentGuid(power.environmentId)) throw new Error('A configured environment is required.');
  const origin = appOrigin(power.localAppUrl);
  const require = createRequire(join(app, 'package.json'));
  const { chromium } = await import(pathToFileURL(require.resolve('playwright')).href);
  const browser = await chromium.connectOverCDP(endpoint.href, { timeout: 10000 });
  try {
    const matchingParent = value => {
      const url = new URL(value);
      const frame = url.searchParams.get('_localAppUrl');
      return url.origin === 'https://apps.powerapps.com' && url.pathname.toLowerCase() === `/play/e/${power.environmentId}/a/local`.toLowerCase() && (frame === `${origin.origin}/` || (request && frame === request.frameUrl)) && url.searchParams.get('_localConnectionUrl') === `${origin.origin}/__vite_powerapps_plugin__/power.config.json`;
    };
    const candidates = browser.contexts().flatMap(context => context.pages()).filter(page => matchingParent(page.url()));
    if (candidates.length !== 1) throw new Error(`Expected exactly one matching authenticated Local Play tab, found ${candidates.length}. Open the supplied app URL in the authorized signed-in browser; localhost alone is not evidence.`);
    const page = candidates[0];
    async function frameFor() {
      const until = Date.now() + 25000;
      do {
        if (!matchingParent(page.url())) throw new Error('The parent page changed during host verification.');
        const frames = page.frames().filter(frame => {
          try { return new URL(frame.url()).origin === origin.origin; } catch { return false; }
        });
        if (frames.length > 1) throw new Error('The matching parent has multiple app frames; refusing ambiguous evidence.');
        if (frames.length === 1) {
          await frames[0].locator(`[data-host-state="authenticated"][data-host-environment="${power.environmentId}"]`).waitFor({ state: 'visible', timeout: Math.max(1, until - Date.now()) });
          return frames[0];
        }
        await delay(Math.min(100, Math.max(1, until - Date.now())));
      } while (Date.now() < until);
      throw new Error('The matching Power Apps page did not load the expected app frame within 25 seconds. Check sign-in and local-network access.');
    }
    await frameFor();
    const edit = request?.edit ? await verifySavedEdit(page, frameFor, request.edit) : { savedEditReloadVerified: false, restoredOriginalField: false };
    const result = { status: 'passed', checkedAtUtc: new Date().toISOString(), authenticatedLocalPlay: true, ...edit, method: 'cdp', provenance: 'Live matching Power Apps parent, loopback frame and SDK-verified signed-in user/session/environment', environmentId: power.environmentId, appOrigin: origin.origin, identityOrSessionDataSaved: false, ...(request ? { runId: request.runId, verificationId: request.verificationId, inputsSha256: request.inputsSha256 } : {}) };
    writeJson(output, result);
    return result;
  } finally { await browser.close(); }
}
if (isMain(import.meta.url)) await cli(async () => {
  const { options, positional } = args(process.argv.slice(2), ['cdp-url', 'out']);
  if (positional.length !== 1 || !options['cdp-url']) throw new Error('Usage: node verify-local-play.mjs <app-folder> --cdp-url <authorized-loopback-endpoint> [--out new-report.json]. For scoped saved-edit checks use verify/finalize with app-owned bindings.');
  const app = resolve(positional[0]);
  const output = resolve(options.out ?? join(app, 'evidence', `local-play-${Date.now()}.json`));
  await verifyLocalPlay(app, options['cdp-url'], output);
  console.log(`Authenticated Local Play verified. No identity/session details saved. Evidence: ${output}`);
});
