import assert from 'node:assert/strict';
import { withBrowserHarness, recordUi, assertResponsive } from './browser-harness.mjs';

export async function fillFields(page, values) {
  if (!values || !Object.keys(values).length) throw new Error('A scenario needs explicit field labels and values.');
  for (const [label, value] of Object.entries(values)) {
    const field = page.getByLabel(label, { exact: true });
    if (typeof value === 'string' || typeof value === 'number') await field.fill(String(value));
    else if (value && value.kind === 'select' && (typeof value.value === 'string' || typeof value.label === 'string')) {
      if (value.search !== undefined) await page.getByLabel(`Find ${label}`, { exact: true }).fill(value.search);
      await field.selectOption(value.value === undefined ? { label: value.label } : value.value);
    } else throw new Error(`Unsupported scenario value for ${label}. Use a scalar or an explicit select binding.`);
  }
}
async function snapshot(page, labels) {
  return Object.fromEntries(await Promise.all(labels.map(async label => [label, await page.getByLabel(label, { exact: true }).inputValue()])));
}
async function discard(page) {
  const ui = recordUi(page);
  const accept = dialog => dialog.accept(); page.on('dialog', accept);
  try { await ui.form.getByRole('button', { name: 'Cancel', exact: true }).click(); }
  finally { page.off('dialog', accept); }
}
async function rowWithLabel(ui, label) { await ui.table.getByRole('button', { name: `Edit ${label}`, exact: true }).waitFor(); }
export function crudScenario({ id, collection, storageKey, create, edit }) {
  for (const item of [create, edit]) if (!item?.label || typeof item.assertStored !== 'function') throw new Error('CRUD cases require explicit labels and independent assertStored callbacks for create AND edit.');
  return { id, async run({ page, ui }) {
    await ui.navigate(collection);
    await fillFields(page, create.values); await ui.save();
    await create.assertStored(await ui.stored(storageKey));
    await ui.reloadAndCheck(async () => { await ui.navigate(collection); await rowWithLabel(ui, create.label); await create.assertStored(await ui.stored(storageKey)); });
    await ui.edit(create.label); await fillFields(page, edit.values); await ui.save();
    await edit.assertStored(await ui.stored(storageKey));
    await ui.reloadAndCheck(async () => { await ui.navigate(collection); await rowWithLabel(ui, edit.label); await edit.assertStored(await ui.stored(storageKey)); });
  } };
}
export function rejectedSaveScenario({ id, collection, storageKey, recordLabel, values, errorText, assertUnchanged }) {
  if (!id || !collection || !storageKey || !errorText || !values || !Object.keys(values).length) throw new Error('Rejected-save scenarios need explicit collection, storage, field values and expected error text.');
  return { id, async run({ page, ui }) {
    await ui.navigate(collection);
    if (recordLabel) await ui.edit(recordLabel);
    const before = await ui.stored(storageKey);
    await fillFields(page, values); const draft = await snapshot(page, Object.keys(values));
    await ui.form.getByRole('button', { name: 'Save', exact: true }).click(); await ui.expectError(errorText);
    const after = await ui.stored(storageKey);
    assert.deepEqual(after, before, 'A rejected save must not change any persisted data.');
    assert.deepEqual(await snapshot(page, Object.keys(values)), draft, 'A rejected save must preserve entered values.');
    if (assertUnchanged) await assertUnchanged(after, before);
    await discard(page);
  } };
}
export function draftScenario({ id, collection, otherCollection, values, changeView }) {
  if (!otherCollection || otherCollection === collection) throw new Error('Dirty-navigation coverage needs a different collection.');
  return { id, async run({ page, ui }) {
    await ui.navigate(collection); await fillFields(page, values);
    const before = await snapshot(page, Object.keys(values));
    if (changeView) { await changeView(page); assert.deepEqual(await snapshot(page, Object.keys(values)), before); }
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: otherCollection, exact: true }).click();
    assert.equal(await page.getByRole('navigation', { name: 'Collections' }).getByRole('button', { name: collection, exact: true }).getAttribute('aria-current'), 'page');
    assert.deepEqual(await snapshot(page, Object.keys(values)), before);
    await discard(page);
    await ui.navigate(otherCollection); await ui.navigate(collection);
  } };
}
export function conflictScenario({ id, collection, label, storageKey, staleValues, winningValues, assertWinner, errorText = 'changed in another view' }) {
  if (typeof assertWinner !== 'function') throw new Error('Conflict scenarios require an independent persisted-winner assertion.');
  return { id, async run({ page, context, base, ui }) {
    await ui.navigate(collection); await ui.edit(label); await fillFields(page, staleValues);
    const draft = await snapshot(page, Object.keys(staleValues));
    const other = await context.newPage();
    try {
      await other.goto(base); const second = recordUi(other); await second.navigate(collection); await second.edit(label);
      await fillFields(other, winningValues); await second.save();
      await page.bringToFront();
      await ui.form.getByRole('button', { name: 'Save', exact: true }).click(); await ui.expectError(errorText);
      assert.deepEqual(await snapshot(page, Object.keys(staleValues)), draft);
      await assertWinner(await ui.stored(storageKey));
    } finally { await other.close(); }
    await discard(page);
  } };
}
export function responsiveScenario({ id = 'responsive-accessibility', collections, widths, visit }) {
  return { id, async run({ page, ui }) {
    try {
      for (const collection of collections) {
        await ui.navigate(collection);
        await assertResponsive(page, { widths, navigation: collections, visit });
      }
    } finally { await page.setViewportSize({ width: 1440, height: 1100 }); }
  } };
}
export function storageScenario({ id = 'storage-failures', storageKey, collection, values }) {
  return { id, async run({ browser, base }) {
    const corrupt = await browser.newContext();
    try {
      await corrupt.addInitScript(key => localStorage.setItem(key, '{corrupt'), storageKey);
      const page = await corrupt.newPage(); await page.goto(base);
      await recordUi(page).expectError('not valid JSON');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), '{corrupt');
    } finally { await corrupt.close(); }
    const quota = await browser.newContext();
    try {
      const page = await quota.newPage(); await page.goto(base); const ui = recordUi(page); await ui.navigate(collection);
      const before = await ui.stored(storageKey);
      await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Synthetic quota exceeded', 'QuotaExceededError'); }; });
      await fillFields(page, values); const draft = await snapshot(page, Object.keys(values));
      await ui.form.getByRole('button', { name: 'Save', exact: true }).click(); await ui.expectError('Synthetic quota exceeded');
      assert.deepEqual(await ui.stored(storageKey), before); assert.deepEqual(await snapshot(page, Object.keys(values)), draft);
    } finally { await quota.close(); }
  } };
}
export function previewScenario(id = 'standalone-truth') {
  return { id, async run({ page }) {
    await page.locator('[data-host-state="preview"]').waitFor();
    assert.equal(await page.locator('[data-host-state="authenticated"]').count(), 0);
  } };
}
export async function runAcceptance(options, scenarios) {
  if (!Array.isArray(scenarios) || !scenarios.length || scenarios.some(item => !item?.id || typeof item.run !== 'function') || new Set(scenarios.map(item => item.id)).size !== scenarios.length) throw new Error('Acceptance needs unique, runnable scenarios.');
  return withBrowserHarness(options, async context => {
    for (const scenario of scenarios) {
      try { await scenario.run(context); }
      catch (error) { throw new Error(`Acceptance ${scenario.id} failed: ${error.message}`, { cause: error }); }
      context.passed(scenario.id);
    }
  });
}
