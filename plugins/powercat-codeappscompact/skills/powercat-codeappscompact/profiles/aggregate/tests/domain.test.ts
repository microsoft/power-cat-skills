import test from 'node:test';
import assert from 'node:assert/strict';
import { seed, decode, reduce } from '../src/domain.ts';

test('neutral nested fixture and command round-trip without mutating their input', () => {
  const before = seed(); const state = structuredClone(before);
  const result = reduce(state, { id: 'welcome', title: 'Revised', lines: ['One', 'Two'] }, 'demo', '2026-01-01T00:00:00Z', 'new');
  assert.deepEqual(state, before);
  assert.deepEqual(decode(JSON.stringify(result.state)).entries[0], { id: 'welcome', title: 'Revised', lines: ['One', 'Two'] });
  assert.throws(() => reduce(state, { title: ' ', lines: [] }, 'demo', '', 'new'), /validation|correct|title/i);
  assert.deepEqual(state, before);
  assert.throws(() => decode('{corrupt'), SyntaxError);
  assert.throws(() => decode(JSON.stringify({ revision: 'one', entries: [before.entries[0], before.entries[0]] })), /Duplicate/);
});
