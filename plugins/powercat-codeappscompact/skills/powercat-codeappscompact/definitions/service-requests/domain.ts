import { fieldPresets, ValidationError } from 'codeappscompact';
import type { Field } from 'codeappscompact';
import type { DemoMutation, DemoState } from 'codeappscompact/demo';

export type Project = { name: string; notes: string; revision: number };
export type Request = { name: string; projectId: string; status: string; progress: number; notes: string; revision: number };
export type Drafts = { requests: Request; projects: Project };
export type State = DemoState<Drafts>;
export const defaults: Drafts = {
  requests: { name: '', projectId: '', status: 'Open', progress: 0, notes: '', revision: 0 },
  projects: { name: '', notes: '', revision: 0 },
};
export const fields = {
  requests: [
    { name: 'name', label: 'Request name', ...fieldPresets.name },
    { name: 'projectId', label: 'Project', kind: 'text', required: true },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: ['Open', 'Complete'] },
    { name: 'progress', label: 'Progress', kind: 'number', required: true, min: 0, max: 100, integer: true, unit: '%' },
    { name: 'notes', label: 'Notes', ...fieldPresets.notes },
  ] satisfies readonly Field<Request>[],
  projects: [
    { name: 'name', label: 'Project name', ...fieldPresets.name },
    { name: 'notes', label: 'Notes', ...fieldPresets.notes },
  ] satisfies readonly Field<Project>[],
};
export function seed(): State {
  return {
    projects: [{ ...defaults.projects, id: 'project-service', name: 'Service improvement', revision: 1 }, { ...defaults.projects, id: 'project-onboarding', name: 'Team onboarding', revision: 1 }],
    requests: [{ ...defaults.requests, id: 'request-checklist', name: 'Prepare checklist', projectId: 'project-service', notes: 'Synthetic process record.', revision: 1 }],
  };
}
export function validate(state: State) {
  for (const row of state.requests) {
    if (!state.projects.some(project => project.id === row.projectId)) throw new ValidationError<Request>({ projectId: 'The selected project no longer exists.' });
    if (row.status === 'Complete' && row.progress !== 100) throw new ValidationError<Request>({ progress: 'Complete requests require 100% progress.' });
  }
}
export function validateMutation(change: DemoMutation<Drafts>) {
  if (change.collection !== 'requests' || change.operation !== 'update') return;
  const before = change.previous.requests.find(row => row.id === change.id);
  const next = change.next.requests.find(row => row.id === change.id);
  if (before?.status === 'Complete' && next?.status !== 'Complete') throw new ValidationError<Request>({ status: 'Reopening requires a separate app-owned workflow.' });
}
