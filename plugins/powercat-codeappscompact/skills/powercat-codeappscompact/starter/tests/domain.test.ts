import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, requestFields, seed, validateWorkspace } from '../src/domain.ts';
import { projectDraft, validateDraft } from 'codeappscompact';

test('synthetic seed and complete edit payloads preserve notes and flat relationships', () => {
  const state = seed(); validateWorkspace(state);
  assert.equal(state.requests.length, 7);
  const draft = projectDraft(defaults.requests)(state.requests[0]);
  assert.equal(Object.hasOwn(draft, 'id'), false);
  assert.equal(draft.projectId, 'project-service');
  assert.equal(draft.notes, state.requests[0].notes);
  assert.equal(draft.revision, 1);
  assert.deepEqual(seed(), state);
});
test('shared rules and app-owned references are enforced consistently', () => {
  for (const change of [
    (state: ReturnType<typeof seed>) => { state.requests[0].projectId = 'missing'; },
    (state: ReturnType<typeof seed>) => { state.requests[0].dueUtc = '2030-02-30T12:00:00.000Z'; },
    (state: ReturnType<typeof seed>) => { state.requests[0].hours = -1; },
    (state: ReturnType<typeof seed>) => { state.requests[0].hours = 0.25; },
    (state: ReturnType<typeof seed>) => { state.projects[0].status = 'Unknown'; },
  ]) { const state = seed(); change(state); assert.throws(() => validateWorkspace(state)); }
  const draft = { ...projectDraft(defaults.requests)(seed().requests[0]), hours: 0.25 };
  assert.match(validateDraft(draft, defaults.requests, requestFields).get('hours') ?? '', /increments/);
});
