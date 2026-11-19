import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withBrowserScenarios, assertResponsive, recordFlowDetails } from '../tools/browser-harness.mjs';

const config = JSON.parse(await readFile(new URL('../src/app-config.json', import.meta.url), 'utf8'));
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), config.storageKey);
const details = page => page.locator('[data-cc-part="record-details"]');
async function openDetails(page, label = 'Welcome') { await page.getByRole('button', { name: `Open ${label}`, exact: true }).click(); await recordFlowDetails(page, label).getByRole('heading', { name: label, exact: true }).waitFor(); }
async function open(page) { await openDetails(page); await details(page).getByRole('button', { name: 'Edit', exact: true }).click(); await page.getByRole('dialog').waitFor(); }
const form = page => page.getByRole('dialog');
const save = page => form(page).getByRole('button', { name: 'Save', exact: true }).click();
const scenarios = [
  { id: 'nested-save-reload', async run({ page }) {
    await open(page); await form(page).getByLabel('Title', { exact: true }).fill('Edited'); await form(page).getByLabel('Lines', { exact: true }).fill('First\nSecond');
    await save(page); await form(page).waitFor({ state: 'hidden' });
    await details(page).getByRole('heading', { name: 'Edited', exact: true }).waitFor();
    assert.deepEqual(await details(page).locator('tbody td').allTextContents(), ['First', 'Second']);
    await page.reload();
    await page.getByRole('button', { name: 'Open Edited', exact: true }).waitFor();
    assert.deepEqual((await stored(page)).entries.find(entry => entry.id === 'welcome').lines, ['First', 'Second']);
  } },
  { id: 'rejected-draft', async run({ page }) {
    await open(page); const before = await stored(page);
    await form(page).getByLabel('Title', { exact: true }).fill(''); await form(page).getByLabel('Lines', { exact: true }).fill('Keep this draft');
    await save(page); await form(page).getByRole('alert').waitFor();
    assert.equal(await form(page).getByLabel('Title', { exact: true }).getAttribute('aria-invalid'), 'true');
    assert.equal(await form(page).getByLabel('Lines', { exact: true }).inputValue(), 'Keep this draft');
    assert.deepEqual(await stored(page), before);
  } },
  { id: 'discard-guard', async run({ page }) {
    await open(page); await form(page).getByLabel('Title', { exact: true }).fill('Not saved');
    page.once('dialog', dialog => dialog.dismiss()); await form(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await form(page).getByLabel('Title', { exact: true }).inputValue(), 'Not saved');
    page.once('dialog', dialog => dialog.accept()); await page.keyboard.press('Escape');
    await form(page).waitFor({ state: 'hidden' }); assert.equal((await stored(page)).entries[0].title, 'Welcome');
  } },
  { id: 'cross-tab-conflict', async run({ page, context, base }) {
    await open(page); await form(page).getByLabel('Title', { exact: true }).fill('Stale draft');
    const other = await context.newPage(); await other.goto(base); await other.bringToFront(); await open(other);
    await form(other).getByLabel('Title', { exact: true }).fill('Winning update'); await save(other); await form(other).waitFor({ state: 'hidden' });
    await page.bringToFront(); await save(page); await form(page).getByRole('alert').filter({ hasText: 'Data changed' }).waitFor();
    assert.equal(await form(page).getByLabel('Title', { exact: true }).inputValue(), 'Stale draft');
    assert.equal((await stored(page)).entries[0].title, 'Winning update');
  } },
  { id: 'storage-failure', async run({ page }) {
    await open(page); const before = await stored(page);
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); }; });
    await form(page).getByLabel('Title', { exact: true }).fill('Preserve me'); await save(page);
    await form(page).getByRole('alert').filter({ hasText: 'Synthetic quota failure' }).waitFor();
    assert.equal(await form(page).getByLabel('Title', { exact: true }).inputValue(), 'Preserve me'); assert.deepEqual(await stored(page), before);
  } },
  { id: 'scoped-reset', async run({ page }) {
    await page.getByRole('button', { name: 'Open Welcome', exact: true }).waitFor();
    await page.evaluate(() => localStorage.setItem('another-app', 'untouched'));
    const before = await stored(page); page.once('dialog', dialog => dialog.dismiss()); await page.getByRole('button', { name: 'Reset demo data', exact: true }).click();
    assert.deepEqual(await stored(page), before);
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Reset demo data', exact: true }).click(); await page.getByText('Demo data reset.', { exact: true }).waitFor();
    assert.notEqual((await stored(page)).revision, before.revision); assert.equal(await page.evaluate(() => localStorage.getItem('another-app')), 'untouched');
  } },
  { id: 'responsive-accessibility', async run({ page }) { await assertResponsive(page); await openDetails(page); await assertResponsive(page); await details(page).getByRole('button', { name: 'Edit', exact: true }).click(); await assertResponsive(page); } },
  { id: 'standalone-truth', async run({ page }) {
    await page.locator('[data-host-state="preview"]').waitFor(); assert.equal(await page.locator('[data-host-state="authenticated"]').count(), 0);
    if (config.localOnly) assert.equal(await page.getByRole('link', { name: 'Open authenticated Local Play' }).count(), 0);
  } },
  { id: 'list-details-return', async run({ page }) {
    await page.getByLabel('Search Notes', { exact: true }).fill('welcome');
    await page.getByLabel('Sort direction for Notes', { exact: true }).selectOption('desc');
    const opener = page.getByRole('button', { name: 'Open Welcome', exact: true });
    await opener.focus(); await page.keyboard.press('Enter');
    await details(page).getByRole('heading', { name: 'Welcome', exact: true }).waitFor();
    assert.equal(await details(page).getByRole('heading').evaluate(node => node === document.activeElement), true);
    assert.deepEqual(await details(page).locator('tbody td').allTextContents(), ['Synthetic nested records.']);
    await details(page).getByRole('button', { name: 'Edit', exact: true }).focus(); await page.keyboard.press('Enter');
    await form(page).waitFor(); await page.keyboard.press('Escape'); await form(page).waitFor({ state: 'hidden' });
    assert.equal(await details(page).getByRole('button', { name: 'Edit', exact: true }).evaluate(node => node === document.activeElement), true);
    await details(page).getByRole('button', { name: 'Back to Notes', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Open Welcome');
    assert.equal(await page.getByLabel('Search Notes', { exact: true }).inputValue(), 'welcome');
    assert.equal(await page.getByLabel('Sort direction for Notes', { exact: true }).inputValue(), 'desc');
    assert.equal(await page.getByRole('button', { name: 'Open Another note', exact: true }).count(), 0);
  } },
  { id: 'create-details-reload', async run({ page }) {
    await page.getByRole('button', { name: 'Add note', exact: true }).click();
    await form(page).getByLabel('Title', { exact: true }).fill('New note');
    await form(page).getByLabel('Lines', { exact: true }).fill('A new nested line');
    await save(page); await form(page).waitFor({ state: 'hidden' });
    await page.getByRole('status').filter({ hasText: /^Saved\.$/ }).waitFor();
    await page.reload(); await openDetails(page, 'New note');
    assert.deepEqual(await details(page).locator('tbody td').allTextContents(), ['A new nested line']);
    assert.equal((await stored(page)).entries.length, 3);
  } },
  { id: 'pending-confirmed-save', async run({ page }) {
    await open(page); const before = await stored(page);
    await form(page).getByLabel('Title', { exact: true }).fill('Confirmed after delay');
    await page.evaluate(() => {
      const request = navigator.locks.request.bind(navigator.locks);
      window.recordFlowGate = { calls: 0, release: null };
      navigator.locks.request = (...args) => {
        window.recordFlowGate.calls++;
        return new Promise((resolve, reject) => { window.recordFlowGate.release = () => request(...args).then(resolve, reject); });
      };
    });
    await save(page);
    await form(page).locator('form').evaluate(node => { node.requestSubmit(); node.requestSubmit(); });
    assert.equal(await page.evaluate(() => window.recordFlowGate.calls), 1);
    assert.equal(await form(page).getByRole('button', { name: 'Saving...', exact: true }).isDisabled(), true);
    assert.equal(await form(page).getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
    assert.equal(await page.locator('[data-cc="record-flow"] [data-cc-part="saved"]').count(), 0);
    assert.deepEqual(await stored(page), before);
    await page.evaluate(() => window.recordFlowGate.release());
    await form(page).waitFor({ state: 'hidden' });
    await details(page).getByRole('heading', { name: 'Confirmed after delay', exact: true }).waitFor();
    assert.equal((await stored(page)).entries[0].title, 'Confirmed after delay');
  } },
  { id: 'missing-record-details', async run({ page, context, base }) {
    await openDetails(page);
    const other = await context.newPage(); await other.goto(base);
    await other.getByRole('button', { name: 'Open Welcome', exact: true }).waitFor();
    await other.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.entries = state.entries.filter(entry => entry.id !== 'welcome');
      state.revision = crypto.randomUUID(); localStorage.setItem(key, JSON.stringify(state));
    }, config.storageKey);
    await page.bringToFront(); await details(page).getByRole('alert').filter({ hasText: 'no longer available' }).waitFor();
    assert.equal(await details(page).getByRole('button', { name: 'Edit', exact: true }).count(), 0);
    await details(page).getByRole('button', { name: 'Back to Notes', exact: true }).click();
    await page.getByRole('button', { name: 'Open Another note', exact: true }).waitFor();
  } },
];
scenarios.push({ id: 'selection-alternate-persona', async run({ page }) {
  const user = page.getByLabel('Demo user (simulated role)', { exact: true });
  await user.selectOption('reviewer'); assert.equal(await user.inputValue(), 'reviewer');
  await page.getByLabel('Search Notes', { exact: true }).fill('welcome');
  await page.getByLabel('Select Welcome', { exact: true }).check();
  await page.getByRole('button', { name: 'Cards view', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Open Another note', exact: true }).count(), 0);
  await openDetails(page); await details(page).getByRole('button', { name: 'Edit', exact: true }).click();
  await form(page).getByLabel('Title', { exact: true }).fill('Welcome revised'); await save(page); await form(page).waitFor({ state: 'hidden' });
  await details(page).getByRole('button', { name: 'Back to Notes', exact: true }).click();
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  assert.equal(await page.getByLabel('Search Notes', { exact: true }).inputValue(), 'welcome');
  assert.equal(await page.getByLabel('Select Welcome revised', { exact: true }).isChecked(), true);
  assert.equal((await stored(page)).entries[0].title, 'Welcome revised');
} });
await withBrowserScenarios({ criteriaFile: 'tests/acceptance.json', localOnly: config.localOnly, preflight: async ({ page }) => { await page.getByLabel('Demo user (simulated role)', { exact: true }).waitFor(); await page.getByRole('button', { name: 'Open Welcome', exact: true }).waitFor(); } }, scenarios);
