import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { args, appOrigin, cli, environmentGuid, exists, isMain, noLinkedAncestors, readJson, runNpm } from './lib.mjs';
import { checkDependencies } from './dependency-contract.mjs';

export async function preflight(app, requireFreePort = false, { localOnly = false } = {}) {
  noLinkedAncestors(app);
  const pkg = readJson(join(app, 'package.json'));
  const power = readJson(join(app, 'power.config.json'));
  const config = exists(join(app, 'src', 'app-config.json')) ? readJson(join(app, 'src', 'app-config.json')) : undefined;
  const environmentConfigured = environmentGuid(power.environmentId);
  if (config?.localOnly === true && power.environmentId !== '') throw new Error('Local-only apps must keep the environment ID empty. Binding an authorized environment requires explicitly leaving local-only mode.');
  const explicitlyUnbound = config?.localOnly === true && power.environmentId === '';
  if (!environmentConfigured && !(localOnly && explicitlyUnbound)) throw new Error('Authenticated Local Play requires an authorized environment. An unbound local check requires both --local-only and an explicitly local-only app; do not fabricate an environment ID.');
  const origin = appOrigin(power.localAppUrl);
  if (pkg.workspaces || (pkg.packageManager && !pkg.packageManager.startsWith('npm@')) || ['yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb'].some(file => exists(join(app, file)))) throw new Error('Use the existing package-manager/workspace workflow; this helper does not switch tooling.');
  const installed = checkDependencies(app, { requireLock: true, installed: true });
  if (config && (config.environmentId !== power.environmentId || new URL(config.appUrl).origin !== origin.origin)) throw new Error('Starter configuration disagrees with power.config.json.');
  runNpm(app, ['ls', '--install-links', '--omit=dev', '--depth=0', '--json']);
  if (requireFreePort) await new Promise((accept, reject) => {
    const server = createServer();
    server.once('error', error => reject(new Error(`Local Play port is unavailable; no process was stopped: ${error.message}`)));
    server.listen(Number(origin.port), origin.hostname, () => server.close(error => error ? reject(error) : accept()));
  });
  return { version: installed.version, dependencies: 'resolved', localAppUrl: origin.origin, environmentConfigured, localOnly, authenticatedLocalPlay: 'not checked', port: requireFreePort ? 'available at check time' : 'not checked' };
}
if (isMain(import.meta.url)) await cli(async () => {
  const { options, positional } = args(process.argv.slice(2), ['require-free-port', 'local-only'], ['require-free-port', 'local-only']);
  if (positional.length !== 1) throw new Error('Usage: node preflight.mjs <app-folder> [--require-free-port] [--local-only]');
  console.log(JSON.stringify(await preflight(resolve(positional[0]), options['require-free-port'], { localOnly: Boolean(options['local-only']) }), null, 2));
});
