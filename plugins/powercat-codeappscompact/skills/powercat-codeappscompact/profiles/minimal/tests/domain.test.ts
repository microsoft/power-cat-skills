import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('minimal profile has a distinct demo namespace and matching host configuration', () => {
  const app = JSON.parse(readFileSync(new URL('../src/app-config.json', import.meta.url), 'utf8'));
  const power = JSON.parse(readFileSync(new URL('../power.config.json', import.meta.url), 'utf8'));
  assert.equal(app.profile, 'minimal');
  assert.equal(app.environmentId, power.environmentId);
  assert.equal(app.appUrl, power.localAppUrl);
  assert.ok(app.storageKey.length > 36);
});
