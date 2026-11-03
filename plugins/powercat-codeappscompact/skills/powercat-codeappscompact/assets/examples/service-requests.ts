import { fieldPresets } from 'codeappscompact';
import type { Field } from 'codeappscompact';
import { assertConditions } from 'codeappscompact/recipes/conditional-validation';
import { assertTransition } from 'codeappscompact/recipes/status-transitions';

export type RequestDraft = { name: string; status: string; resolution: string; revision: number };
export const requestDefaults: RequestDraft = { name: '', status: 'New', resolution: '', revision: 0 };
export const requestFields = [
  { name: 'name', label: 'Request', ...fieldPresets.name },
  { name: 'status', label: 'Status', kind: 'select', required: true, options: ['New', 'Active', 'Resolved'] },
  { name: 'resolution', label: 'Resolution', ...fieldPresets.notes },
] satisfies readonly Field<RequestDraft>[];
const transitions: Readonly<Record<string, readonly string[]>> = { New: ['Active'], Active: ['Resolved'], Resolved: ['Active'] };
export function validateRequestStructure(draft: RequestDraft) {
  assertConditions(draft, [{ field: 'resolution', when: value => value.status === 'Resolved', check: value => Boolean(value.resolution.trim()), message: 'A resolved request needs a resolution.' }]);
}
export function validateRequestMutation(next: RequestDraft, previous: RequestDraft | null) {
  if (previous) assertTransition(previous.status, next.status, transitions);
  validateRequestStructure(next);
}
