import { DataError, ValidationError, isObject } from 'codeappscompact/validation';

export type Entry = { id: string; title: string; lines: string[] };
export type State = { revision: string; entries: Entry[] };
export type Command = { id?: string; title: string; lines: string[] };
export function seed(): State { return { revision: 'seed', entries: [{ id: 'welcome', title: 'Welcome', lines: ['Synthetic nested records.'] }, { id: 'example', title: 'Another note', lines: [] }] }; }
export function decode(raw: string): State {
  const value: unknown = JSON.parse(raw);
  if (!isObject(value) || typeof value.revision !== 'string' || !value.revision || !Array.isArray(value.entries)) throw new DataError('storage', 'Invalid note snapshot. Existing data was preserved.');
  const entries = value.entries.map((entry: unknown): Entry => {
    if (!isObject(entry) || typeof entry.id !== 'string' || !entry.id || typeof entry.title !== 'string' || !entry.title.trim() || !Array.isArray(entry.lines) || !entry.lines.every((line: unknown): line is string => typeof line === 'string')) throw new DataError('storage', 'Invalid note record. Existing data was preserved.');
    return { id: entry.id, title: entry.title, lines: entry.lines };
  });
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new DataError('storage', 'Duplicate note IDs. Existing data was preserved.');
  return { revision: value.revision, entries };
}
export function reduce(state: State, command: Command, _actor: string, _now: string, id: string): { state: State } {
  if (!command.title.trim()) throw new ValidationError({ title: 'Enter a title.' });
  if (command.id && !state.entries.some(entry => entry.id === command.id)) throw new DataError('conflict', 'This note no longer exists. Reopen the current records.');
  const entry = { id: command.id ?? id, title: command.title.trim(), lines: [...command.lines] };
  return { state: { ...state, entries: command.id ? state.entries.map(existing => existing.id === command.id ? entry : existing) : [...state.entries, entry] } };
}
