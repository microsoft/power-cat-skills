import assert from 'node:assert/strict';
import { withBrowserHarness, assertResponsive } from '../tools/browser-harness.mjs';

await withBrowserHarness({ criteriaFile: 'tests/acceptance.json' }, async ({ page, passed }) => {
  await page.getByRole('heading', { name: 'Add your first collection' }).waitFor();
  assert.equal(await page.locator('[data-cc="record-screen"]').count(), 0);
  passed('minimal-shell');
  assert.equal(await page.locator('[data-host-state]').getAttribute('data-host-state'), 'preview');
  passed('standalone-truth');
  await assertResponsive(page);
  passed('responsive-accessibility');
});
