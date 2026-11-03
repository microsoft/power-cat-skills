import { createDemoRepository } from 'codeappscompact/demo';
import type { DemoState } from 'codeappscompact/demo';
import { assertFlat, checkDraft, isObject } from 'codeappscompact/validation';
import { readBackup, writeBackup } from 'codeappscompact/recipes/schema-evolution';

type Drafts = { items: { name: string; revision: number } };
const defaults: Drafts = { items: { name: '', revision: 0 } };
function decode(value: unknown): DemoState<Drafts> {
  if (!isObject(value) || !Array.isArray(value.items) || Object.keys(value).length !== 1) throw new Error('Invalid item backup.');
  const rows: unknown[] = value.items;
  return { items: rows.map(row => {
    assertFlat(row, 'Backup record');
    const { id, ...draft } = row;
    checkDraft(draft, defaults.items);
    if (typeof id !== 'string' || !id.trim() || !draft.name.trim() || !Number.isSafeInteger(draft.revision) || draft.revision < 1) throw new Error('Invalid item record.');
    return { ...draft, id };
  }) };
}
export function exportItems(state: DemoState<Drafts>, now: () => number) { return writeBackup(decode(state), 1, now); }
export function restoreIntoNewDemo(text: string, newAuthorizedStorageKey: string) {
  const backup = readBackup(text, 1, decode);
  if (!newAuthorizedStorageKey.trim()) throw new Error('Choose a new, authorized storage key.');
  if (window.localStorage.getItem(newAuthorizedStorageKey) !== null) throw new Error('Restore requires an unused key. Existing data was preserved.');
  return createDemoRepository<Drafts>({ key: newAuthorizedStorageKey, schemaVersion: 1, defaults, seed: () => backup.data });
}
