import { resolve } from 'node:path';
import { args } from './lib.mjs';

export function workflowOptions(argv, extra = []) {
  const { options, positional } = args(argv, ['browser', 'local-play', 'host-edit', 'host-route', 'host-receipt', 'fresh', 'cdp-url', 'out', 'resume', 'portability-destination', 'events', 'phases', 'from', 'to', 'usd-per-credit', 'max-credits', 'timeout-ms', ...extra], ['browser', 'local-play', 'host-edit', 'fresh']);
  if (positional.length !== 1) throw new Error('Supply one app folder, --out <new-run> or --resume <run>, and the required --browser / --local-play scopes. Use --host-route mesh-uia|mesh-browser for a Mesh handoff, or an explicitly authorized --cdp-url.');
  if (!options.events && ['phases', 'from', 'to', 'usd-per-credit'].some(key => options[key] !== undefined)) throw new Error('Accounting options require --events; on resume omit all accounting options to retain the original scope.');
  return { app: resolve(positional[0]), raw: options, options: {
    browser: options.browser, localPlay: options['local-play'], hostEdit: options['host-edit'], hostRoute: options['host-route'], hostReceipt: options['host-receipt'] ? resolve(options['host-receipt']) : undefined,
    fresh: options.fresh, cdpUrl: options['cdp-url'], output: options.out ? resolve(options.out) : undefined, resume: options.resume ? resolve(options.resume) : undefined,
    portabilityDestination: options['portability-destination'], timeoutMs: options['timeout-ms'] === undefined ? undefined : Number(options['timeout-ms']),
    maxCredits: options['max-credits'] === undefined ? undefined : Number(options['max-credits']),
    accounting: options.events ? { events: resolve(options.events), phases: options.phases ? resolve(options.phases) : undefined, from: options.from, to: options.to, usdPerCredit: options['usd-per-credit'] === undefined ? undefined : Number(options['usd-per-credit']) } : undefined,
  } };
}
