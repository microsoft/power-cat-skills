import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withBrowserHarness, recordUi, assertResponsive } from '../tools/browser-harness.mjs';

const config = JSON.parse(await readFile(resolve('src', 'app-config.json'), 'utf8'));
await withBrowserHarness({ criteriaFile: 'tests/acceptance.json' }, async ({ page, context, browser, base, passed, ui }) => {
  const open = async target => { await target.goto(base); await target.getByRole('button', { name: 'Edit Prepare checklist', exact: true }).waitFor(); };
  await ui.table.getByText('Prepare checklist', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-host-state]').getAttribute('data-host-state'), 'preview'); passed('standalone-truth');
  assert.equal(await ui.table.locator('tbody tr').count(), 7);
  assert.equal(await page.getByRole('button', { name: 'Load more', exact: true }).count(), 0);
  await page.getByLabel('Search all records').fill('Plan workshop');
  await ui.table.getByText('Plan workshop', { exact: true }).waitFor();
  await page.getByLabel('Search all records').fill(''); passed('full-search');

  await page.getByLabel('Request name', { exact: true }).fill('Persisted integration request');
  await page.getByLabel('Find Project', { exact: true }).fill('onboarding');
  await page.getByLabel('Project', { exact: true }).selectOption({ label: 'Team onboarding' });
  await page.getByLabel('Due date (UTC)', { exact: true }).fill('2030-03-10T02:30');
  await page.getByLabel('Notes', { exact: true }).fill('Line one\nLine two');
  await ui.save();
  let row = (await ui.stored(config.storageKey)).collections.requests.find(item => item.name === 'Persisted integration request');
  assert.equal(row.projectId, 'project-onboarding'); assert.equal(row.dueUtc, '2030-03-10T02:30:00.000Z'); assert.equal(row.notes, 'Line one\nLine two');
  await ui.reloadAndCheck(async () => { await ui.table.getByText(row.name, { exact: true }).waitFor(); }); passed('payload-persistence');

  await page.getByLabel('Request name', { exact: true }).fill('Keep my draft');
  await page.getByLabel('Filter by project').selectOption('project-onboarding');
  await page.getByLabel('Sort records', { exact: true }).selectOption('hours');
  assert.equal(await page.getByLabel('Request name', { exact: true }).inputValue(), 'Keep my draft');
  await page.getByLabel('Filter by project').selectOption('');
  passed('stable-filter-editor');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: 'Projects', exact: true }).click();
  assert.equal(await page.getByLabel('Request name', { exact: true }).inputValue(), 'Keep my draft');
  assert.equal(await page.getByRole('navigation').getByRole('button', { name: 'Requests', exact: true }).getAttribute('aria-current'), 'page');
  page.once('dialog', dialog => dialog.accept()); await ui.form.getByRole('button', { name: 'Cancel', exact: true }).click(); passed('dirty-navigation');

  await ui.edit('Prepare checklist'); await page.getByLabel('Notes', { exact: true }).fill('Stale edit');
  const other = await context.newPage(); await open(other); const second = recordUi(other); await second.edit('Prepare checklist');
  await other.getByLabel('Notes', { exact: true }).fill('Winning edit'); await second.save();
  await ui.form.getByRole('button', { name: 'Save', exact: true }).click();
  await ui.expectError('changed in another view');
  assert.equal(await page.getByLabel('Notes', { exact: true }).inputValue(), 'Stale edit');
  row = (await ui.stored(config.storageKey)).collections.requests.find(item => item.id === 'request-1'); assert.equal(row.notes, 'Winning edit');
  page.once('dialog', dialog => dialog.accept()); await ui.form.getByRole('button', { name: 'Cancel', exact: true }).click();
  await other.close(); passed('revision-conflict');

  for (const name of ['Requests', 'Projects']) {
    await ui.navigate(name);
    await assertResponsive(page, { navigation: ['Requests', 'Projects'], visit: async (target, width) => {
      assert.equal(await target.locator('[data-cc-part="record-cards"]').isVisible(), width <= 600);
    } });
  }
  passed('responsive-accessibility');
  const original = JSON.stringify(await ui.stored(config.storageKey));
  const invalidDomain = JSON.parse(original); invalidDomain.collections.requests[0].projectId = 'missing';
  const invalidContext = await browser.newContext();
  await invalidContext.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: config.storageKey, value: JSON.stringify(invalidDomain) });
  const invalidPage = await invalidContext.newPage(); await invalidPage.goto(base);
  await recordUi(invalidPage).expectError('selected project no longer exists');
  assert.equal((await recordUi(invalidPage).stored(config.storageKey)).collections.requests[0].projectId, 'missing'); await invalidContext.close(); passed('domain-validation');

  const corrupt = await browser.newContext();
  await corrupt.addInitScript(key => localStorage.setItem(key, '{corrupt'), config.storageKey);
  const corruptPage = await corrupt.newPage(); await corruptPage.goto(base);
  await recordUi(corruptPage).expectError('not valid JSON');
  assert.equal(await corruptPage.evaluate(key => localStorage.getItem(key), config.storageKey), '{corrupt'); await corrupt.close();
  const quota = await browser.newContext(); const quotaPage = await quota.newPage(); await open(quotaPage); const quotaUi = recordUi(quotaPage);
  const before = await quotaUi.stored(config.storageKey);
  await quotaPage.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Synthetic quota exceeded', 'QuotaExceededError'); }; });
  await quotaPage.getByLabel('Request name', { exact: true }).fill('Unsaved quota request');
  await quotaUi.form.getByRole('button', { name: 'Save', exact: true }).click();
  await quotaUi.expectError('Synthetic quota exceeded');
  assert.deepEqual(await quotaUi.stored(config.storageKey), before);
  assert.equal(await quotaPage.getByLabel('Request name', { exact: true }).inputValue(), 'Unsaved quota request');
  await quota.close(); passed('storage-failures');
});
