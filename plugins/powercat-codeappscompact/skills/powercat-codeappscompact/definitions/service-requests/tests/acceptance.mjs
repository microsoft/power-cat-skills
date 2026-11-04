import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { crudScenario, draftScenario, conflictScenario, previewScenario, rejectedSaveScenario, responsiveScenario, storageScenario } from '../tools/acceptance-scenarios.mjs';
import { verifySavedEdit } from '../tools/host-edit.mjs';

const config = JSON.parse(await readFile(resolve('src', 'app-config.json'), 'utf8'));
const storageKey = config.storageKey;
export const scenarios = [
  previewScenario(),
  crudScenario({ id: 'request-crud-reference', collection: 'Requests', storageKey,
    create: { label: 'New independent request', values: { 'Request name': 'New independent request', Project: { kind: 'select', label: 'Team onboarding', search: 'onboarding' }, Notes: 'First line\nSecond line' }, assertStored: state => { const row = state.collections.requests.find(item => item.name === 'New independent request'); assert.equal(row?.projectId, 'project-onboarding'); assert.equal(row?.notes, 'First line\nSecond line'); assert.equal(row?.revision, 1); } },
    edit: { label: 'Updated independent request', values: { 'Request name': 'Updated independent request', Notes: 'Edited and persisted' }, assertStored: state => { const row = state.collections.requests.find(item => item.name === 'Updated independent request'); assert.equal(row?.notes, 'Edited and persisted'); assert.equal(row?.projectId, 'project-onboarding'); assert.equal(row?.revision, 2); } },
  }),
  crudScenario({ id: 'project-crud', collection: 'Projects', storageKey,
    create: { label: 'Facilities', values: { 'Project name': 'Facilities', Notes: 'Synthetic project' }, assertStored: state => { assert.equal(state.collections.projects.find(item => item.name === 'Facilities')?.notes, 'Synthetic project'); } },
    edit: { label: 'Facilities updated', values: { 'Project name': 'Facilities updated' }, assertStored: state => { assert.equal(state.collections.projects.find(item => item.name === 'Facilities updated')?.revision, 2); } },
  }),
  draftScenario({ id: 'draft-navigation-and-view', collection: 'Requests', otherCollection: 'Projects', values: { 'Request name': 'Keep this draft' }, changeView: async page => {
    await page.getByLabel('Filter by status').selectOption('Open'); await page.getByLabel('Sort records', { exact: true }).selectOption('name');
  } }),
  conflictScenario({ id: 'revision-conflict', collection: 'Requests', label: 'Prepare checklist', storageKey, staleValues: { Notes: 'Stale edit' }, winningValues: { Notes: 'Winning edit' }, assertWinner: state => { assert.equal(state.collections.requests.find(item => item.id === 'request-checklist')?.notes, 'Winning edit'); } }),
  rejectedSaveScenario({ id: 'domain-rejection', collection: 'Requests', storageKey, values: { 'Request name': 'Invalid completion', Status: { kind: 'select', value: 'Complete' }, Progress: 35 }, errorText: '100%', assertUnchanged: state => assert.equal(state.collections.requests.some(item => item.name === 'Invalid completion'), false) }),
  { id: 'saved-edit-helper-restores', async run({ page, ui }) {
    const before = (await ui.stored(storageKey)).collections.requests.find(item => item.id === 'request-checklist');
    const result = await verifySavedEdit(page, async () => page, { collection: 'Requests', recordLabel: 'Prepare checklist', field: 'Notes', value: 'Isolated helper probe - not authentication' });
    assert.equal(result.restoredOriginalField, true);
    const after = (await ui.stored(storageKey)).collections.requests.find(item => item.id === 'request-checklist');
    assert.equal(after.notes, before.notes); assert.equal(after.revision, before.revision + 2);
    await page.reload();
  } },
  responsiveScenario({ collections: ['Requests', 'Projects'], visit: async (page, width) => { assert.equal(await page.locator('[data-cc-part="record-cards"]').isVisible(), width <= 600); } }),
  storageScenario({ storageKey, collection: 'Requests', values: { 'Request name': 'Unsaved quota request' } }),
];
