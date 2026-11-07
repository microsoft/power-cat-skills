import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withBrowserScenarios, assertResponsive } from '../tools/browser-harness.mjs';

const config = JSON.parse(await readFile(new URL('../src/app-config.json', import.meta.url), 'utf8'));
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), config.storageKey);
async function open(page) { await page.getByRole('button', { name: 'Open Welcome', exact: true }).click(); await page.getByRole('dialog').waitFor(); }
const form = page => page.getByRole('dialog');
const save = page => form(page).getByRole('button', { name: 'Save', exact: true }).click();
const scenarios = [
  { id: 'nested-save-reload', async run({ page }) {
    await open(page); await form(page).getByLabel('Title', { exact: true }).fill('Edited'); await form(page).getByLabel('Lines', { exact: true }).fill('First\nSecond');
    await save(page); await form(page).waitFor({ state: 'hidden' }); await page.reload();
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
  { id: 'responsive-accessibility', async run({ page }) { await assertResponsive(page); await open(page); await assertResponsive(page); } },
  { id: 'standalone-truth', async run({ page }) {
    await page.locator('[data-host-state="preview"]').waitFor(); assert.equal(await page.locator('[data-host-state="authenticated"]').count(), 0);
    if (config.localOnly) assert.equal(await page.getByRole('link', { name: 'Open authenticated Local Play' }).count(), 0);
  } },
];
await withBrowserScenarios({ criteriaFile: 'tests/acceptance.json', localOnly: config.localOnly }, scenarios);
