import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createServer, preview } from 'vite';
import { exists, noLinkedAncestors } from './lib.mjs';

export function recordUi(page) {
  const form = page.locator('[data-cc-part="form"]');
  return {
    form,
    table: page.locator('[data-cc-part="table"]'),
    cards: page.locator('[data-cc-part="record-cards"]'),
    async edit(label) { await page.getByRole('button', { name: `Edit ${label}`, exact: true }).click(); },
    async save() { await form.getByRole('button', { name: 'Save', exact: true }).click(); await page.locator('[data-cc-part="saved"]').waitFor(); },
    async navigate(label) { await page.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: label, exact: true }).click(); await page.getByRole('heading', { name: label, exact: true }).waitFor(); },
    async stored(key) {
      return page.evaluate(storageKey => { const raw = localStorage.getItem(storageKey); if (raw === null) throw new Error('Expected persisted demo data.'); return JSON.parse(raw); }, key);
    },
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
export async function withBrowserHarness(options, scenario) {
  const root = resolve(options.root ?? process.cwd());
  const output = resolve(process.env.CODECOMPACT_BROWSER_EVIDENCE ?? options.output ?? join(root, 'evidence', `browser-${Date.now()}`));
  noLinkedAncestors(output);
  if (exists(output)) throw new Error(`Evidence folder already exists: ${output}`);
  const criteriaBytes = options.criteriaFile ? await readFile(resolve(root, options.criteriaFile)) : null;
  const criteria = criteriaBytes ? JSON.parse(criteriaBytes.toString('utf8')) : null;
  const required = criteria?.checks?.map(item => item.id);
  if (criteria && (!required?.length || required.some(id => typeof id !== 'string' || !id) || new Set(required).size !== required.length)) throw new Error('Browser criteria need unique named checks.');
  await mkdir(output, { recursive: true });
  const checks = []; const errors = []; let server; let browser;
  const passed = id => {
    if (typeof id !== 'string' || !id || checks.some(check => check.id === id) || (required && !required.includes(id))) throw new Error(`Unexpected or repeated browser check: ${id}`);
    checks.push({ id, passed: true });
  };
  try {
    if (options.mode === 'development') {
      server = await createServer({ root, configFile: false, plugins: options.plugins ?? [], logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: true } });
      await server.listen();
    } else {
      if (options.mode !== undefined && options.mode !== 'preview') throw new Error('Harness mode must be preview or development.');
      server = await preview({ root, configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0, strictPort: true } });
    }
    const base = server.resolvedUrls.local[0];
    browser = await chromium.launch({ channel: process.env.CODECOMPACT_BROWSER_CHANNEL ?? 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, timezoneId: options.timezoneId ?? 'America/Los_Angeles' });
    context.setDefaultTimeout(options.actionTimeoutMs ?? 10000);
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    const page = await context.newPage();
    const response = await page.goto(base);
    assert.ok(response?.ok(), 'The isolated loopback server must respond successfully.');
    await scenario({ page, context, browser, base, passed, output, ui: recordUi(page) });
    assert.deepEqual(errors, [], 'Unexpected browser exceptions.');
    if (required) assert.deepEqual([...checks.map(check => check.id)].sort(), [...required].sort(), 'Every declared acceptance check must actually run.');
    const evidence = { version: '2.3.0', checkedAtUtc: new Date().toISOString(), passed: true, ...(criteriaBytes ? { criteriaSha256: createHash('sha256').update(criteriaBytes).digest('hex') } : {}), checks, authenticatedLocalPlay: false, pageErrors: errors };
    await writeFile(join(output, 'acceptance.json'), JSON.stringify(evidence, null, 2), { flag: 'wx' });
    console.log(`${checks.length} isolated browser checks passed. Evidence: ${output}`);
    return evidence;
  } catch (error) {
    await writeFile(join(output, 'failure.json'), JSON.stringify({ checkedAtUtc: new Date().toISOString(), checks, error: String(error), pageErrors: errors, authenticatedLocalPlay: false }, null, 2), { flag: 'wx' });
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
