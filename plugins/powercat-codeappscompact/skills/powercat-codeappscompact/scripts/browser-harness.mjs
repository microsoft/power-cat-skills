import assert from 'node:assert/strict';
import { createHash, randomInt } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createServer, preview } from 'vite';
import { exists, noLinkedAncestors } from './lib.mjs';

export function recordUi(page) {
  const form = page.locator('[data-cc-part="form"]');
  return {
    form, table: page.locator('[data-cc-part="table"]'), cards: page.locator('[data-cc-part="record-cards"]'),
    async edit(label) { await page.getByRole('button', { name: `Edit ${label}`, exact: true }).click(); },
    async save() { await form.getByRole('button', { name: 'Save', exact: true }).click(); await page.locator('[data-cc-part="saved"]').waitFor(); },
    async navigate(label) { await page.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: label, exact: true }).click(); await page.getByRole('heading', { name: label, exact: true }).waitFor(); },
    async stored(key) { return page.evaluate(storageKey => { const raw = localStorage.getItem(storageKey); if (raw === null) throw new Error('Expected persisted demo data.'); return JSON.parse(raw); }, key); },
    async reloadAndCheck(check) { await page.reload(); await check(page); },
    async expectError(text) { await page.getByRole('alert').filter({ hasText: text }).first().waitFor(); },
  };
}
export async function assertResponsive(page, { widths = [390, 768, 1440], navigation = [], visit } = {}) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    if (visit) await visit(page, width);
    for (const label of navigation) { const button = page.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: label, exact: true }); await button.waitFor({ state: 'visible' }); assert.equal(await button.count(), 1, `Missing accessible navigation label at ${width}px: ${label}`); }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}px`);
    const result = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), [], `Accessibility at ${width}px`);
  }
}
export async function seedLocalStorage(context, base, entries) {
  if (!entries || Object.entries(entries).some(([key, raw]) => !key || typeof raw !== 'string')) throw new Error('Storage fixtures require explicit nonempty keys and serialized values.');
  await context.addInitScript(({ origin, values }) => {
    if (location.origin !== origin) return;
    for (const [key, raw] of Object.entries(values)) if (localStorage.getItem(key) === null) localStorage.setItem(key, raw);
  }, { origin: new URL(base).origin, values: entries });
}
export function isExternalRequest(url, base) {
  const target = new URL(url); const origin = new URL(base);
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(target.protocol)) return false;
  if (target.protocol === 'ws:') target.protocol = 'http:';
  if (target.protocol === 'wss:') target.protocol = 'https:';
  return target.origin !== origin.origin;
}
async function restrictNetwork(context, base, violations) {
  await context.route('**/*', route => {
    if (isExternalRequest(route.request().url(), base)) { violations.add(route.request().url()); return route.abort('blockedbyclient'); }
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => {
    if (isExternalRequest(socket.url(), base)) { violations.add(socket.url()); socket.close(); }
    else socket.connectToServer();
  });
}
export async function withBrowserHarness(options, scenario) {
  return runHarness(options, [{ id: null, run: scenario }]);
}
export async function withBrowserScenarios(options, scenarios) {
  if (!Array.isArray(scenarios) || !scenarios.length || scenarios.some(item => !item?.id || typeof item.run !== 'function') || new Set(scenarios.map(item => item.id)).size !== scenarios.length) throw new Error('Browser scenarios need unique IDs and independent runnable assertions.');
  return runHarness(options, scenarios);
}
async function runHarness(options, scenarios) {
  const root = resolve(options.root ?? process.cwd());
  const output = resolve(process.env.CODECOMPACT_BROWSER_EVIDENCE ?? options.output ?? join(root, 'evidence', `browser-${Date.now()}`));
  noLinkedAncestors(output);
  if (exists(output)) throw new Error(`Evidence folder already exists: ${output}`);
  const criteriaBytes = options.criteriaFile ? await readFile(resolve(root, options.criteriaFile)) : null;
  const criteria = criteriaBytes ? JSON.parse(criteriaBytes.toString('utf8')) : null;
  const required = criteria?.checks?.map(item => item.id);
  if (criteria && (!required?.length || required.some(id => typeof id !== 'string' || !id) || new Set(required).size !== required.length)) throw new Error('Browser criteria need unique named checks.');
  const isolated = scenarios[0].id !== null;
  if (isolated && required) assert.deepEqual(scenarios.map(item => item.id).sort(), [...required].sort(), 'Every requirement needs exactly one runnable isolated scenario.');
  await mkdir(output, { recursive: true });
  const checks = []; const errors = []; let server; let browser;
  const record = (id, passed, error) => {
    if (typeof id !== 'string' || !id || checks.some(check => check.id === id) || (required && !required.includes(id))) throw new Error(`Unexpected or repeated browser check: ${id}`);
    checks.push({ id, passed, ...(error ? { error } : {}) });
  };
  const passed = id => record(id, true);
  // OS-selected ports can include Chromium-blocked SIP/X11 ports. Keep browser probes in the high dynamic range.
  const port = randomInt(49152, 65536);
  try {
    if (options.mode === 'development') {
      server = await createServer({ root, configFile: false, plugins: options.plugins ?? [], logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true } });
      await server.listen();
    } else {
      if (options.mode !== undefined && options.mode !== 'preview') throw new Error('Harness mode must be preview or development.');
      server = await preview({ root, configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port, strictPort: true } });
    }
    const base = server.resolvedUrls.local[0];
    browser = await chromium.launch({ channel: process.env.CODECOMPACT_BROWSER_CHANNEL ?? 'msedge', headless: true });
    for (const scenario of scenarios) {
      const pageErrors = []; const violations = new Set();
      const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, timezoneId: options.timezoneId ?? 'America/Los_Angeles', ...(options.localOnly ? { serviceWorkers: 'block' } : {}) });
      context.setDefaultTimeout(options.actionTimeoutMs ?? 10000);
      context.on('page', page => page.on('pageerror', error => pageErrors.push(error.message)));
      try {
        if (options.localOnly) await restrictNetwork(context, base, violations);
        if (scenario.prepare) await scenario.prepare(context, base);
        const page = await context.newPage();
        const response = await page.goto(base);
        assert.ok(response?.ok(), 'The isolated loopback server must respond successfully.');
        const caseOutput = isolated ? join(output, `case-${checks.length + 1}`) : output;
        if (isolated) await mkdir(caseOutput);
        await scenario.run({ page, context, browser, base, ...(isolated ? {} : { passed }), output: caseOutput, ui: recordUi(page) });
        assert.deepEqual(pageErrors, [], 'Unexpected browser exceptions.');
        assert.deepEqual([...violations], [], 'Local-only app attempted external network traffic.');
        if (isolated) record(scenario.id, true);
      } catch (error) {
        if (!isolated) throw error;
        record(scenario.id, false, error instanceof Error ? error.message : String(error));
      } finally { errors.push(...pageErrors); await context.close(); }
    }
    if (required) assert.deepEqual(checks.map(check => check.id).sort(), [...required].sort(), 'Every declared acceptance check must actually run.');
    const failed = checks.filter(check => !check.passed);
    if (failed.length) throw new Error(`${failed.length}/${checks.length} browser scenarios failed: ${failed.map(check => `${check.id}: ${check.error.slice(0, 250)}`).join('; ')}. All independent scenarios ran; inspect failure.json before one coherent repair.`);
    const evidence = { version: '2.7.0', checkedAtUtc: new Date().toISOString(), passed: true, ...(criteriaBytes ? { criteriaSha256: createHash('sha256').update(criteriaBytes).digest('hex') } : {}), checks, authenticatedLocalPlay: false, pageErrors: errors };
    await writeFile(join(output, 'acceptance.json'), JSON.stringify(evidence, null, 2), { flag: 'wx' });
    console.log(`${checks.length} browser checks passed (${isolated ? 'fresh context per scenario' : 'legacy shared scenario'}). Evidence: ${output}`);
    return evidence;
  } catch (error) {
    await writeFile(join(output, 'failure.json'), JSON.stringify({ checkedAtUtc: new Date().toISOString(), passed: false, checks, error: String(error), pageErrors: errors, authenticatedLocalPlay: false }, null, 2), { flag: 'wx' });
    throw error;
  } finally {
    try { await browser?.close(); }
    finally {
      if (server) {
        if (typeof server.close === 'function') await server.close();
        else await new Promise((accept, reject) => server.httpServer.close(error => error ? reject(error) : accept()));
      }
    }
  }
}
