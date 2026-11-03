import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoRepository } from 'codeappscompact/demo';
import { defaults, fields, seed, validate, validateMutation } from '../src/definition/domain.ts';
import type { Drafts } from '../src/definition/domain.ts';

function repository() {
  const data = new Map<string, string>();
  return createDemoRepository<Drafts>({ key: 'independent-domain-test', schemaVersion: 1, defaults, fields, seed, validate, validateMutation,
    storage: () => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } }), serialize: async work => work(), newId: () => 'created' });
}
test('valid requests persist with friendly references and exact multiline notes', async () => {
  const repo = repository();
  await repo.service('requests').create({ ...defaults.requests, name: 'Independent test', projectId: 'project-onboarding', notes: 'First\nSecond' });
  const row = (await repo.read()).requests.find(item => item.name === 'Independent test');
  assert.equal(row?.projectId, 'project-onboarding'); assert.equal(row?.notes, 'First\nSecond'); assert.equal(row?.revision, 1);
});
test('completion, reference and integer rules reject invalid mutations without losing stored records', async () => {
  const repo = repository(); const before = await repo.read(); const service = repo.service('requests');
  const valid = { ...defaults.requests, name: 'Negative case', projectId: 'project-service' };
  await assert.rejects(service.create({ ...valid, status: 'Complete', progress: 35 }), /100%|fields/i);
  await assert.rejects(service.create({ ...valid, projectId: 'missing' }), /fields/i);
  await assert.rejects(service.create({ ...valid, progress: 98.5 }), /fields/i);
  assert.deepEqual(await repo.read(), before);
});
test('completed records remain readable; a prohibited reopening is mutation-only', async () => {
  const repo = repository(); const service = repo.service('requests');
  const result = await service.create({ ...defaults.requests, name: 'Completed', projectId: 'project-service', status: 'Complete', progress: 100 });
  assert.ok(result.data); const { id, ...draft } = result.data;
  await assert.rejects(service.update(id, { ...draft, status: 'Open' }), /fields/i);
  assert.equal((await repo.read()).requests.find(row => row.id === id)?.status, 'Complete');
});
