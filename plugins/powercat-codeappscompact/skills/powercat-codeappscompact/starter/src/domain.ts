import { assertValidDraft, fieldPresets, projectDraft, ValidationError } from 'codeappscompact';
import type { Field } from 'codeappscompact';
import type { DemoState } from 'codeappscompact/demo';
import { createFixtureTools } from 'codeappscompact/recipes/fixtures';

export type ProjectDraft = { name: string; status: string; notes: string; revision: number };
export type RequestDraft = { name: string; projectId: string; dueUtc: string; hours: number; notes: string; revision: number };
export type Drafts = { requests: RequestDraft; projects: ProjectDraft };
export type Workspace = DemoState<Drafts>;
export const defaults: Drafts = {
  requests: { name: '', projectId: '', dueUtc: '', hours: 1, notes: '', revision: 0 },
  projects: { name: '', status: 'Planned', notes: '', revision: 0 },
};
export const projectStatuses = ['Planned', 'Active', 'Complete'];
export const projectFields = [
  { name: 'name', label: 'Project name', ...fieldPresets.name },
  { name: 'status', label: 'Status', kind: 'select', options: projectStatuses, required: true },
  { name: 'notes', label: 'Notes', ...fieldPresets.notes },
] satisfies readonly Field<ProjectDraft>[];
export const requestFields = [
  { name: 'name', label: 'Request name', ...fieldPresets.name },
  { name: 'projectId', label: 'Project', kind: 'text', required: true },
  { name: 'dueUtc', label: 'Due date (UTC)', ...fieldPresets.utc },
  { name: 'hours', label: 'Estimated hours', kind: 'number', required: true, min: 0, max: 1000, step: 0.5, unit: 'hours' },
  { name: 'notes', label: 'Notes', ...fieldPresets.notes },
] satisfies readonly Field<RequestDraft>[];
export function seed(): Workspace {
  const fixtures = createFixtureTools({ seed: 42, anchorUtc: '2030-07-20T14:30:00.000Z' });
  return {
    projects: [
      { id: 'project-service', name: 'Service improvement', status: 'Active', notes: 'Synthetic process improvement.', revision: 1 },
      { id: 'project-onboarding', name: 'Team onboarding', status: 'Planned', notes: 'Synthetic onboarding project.', revision: 1 },
    ],
    requests: ['Prepare checklist', 'Review guidance', 'Update handbook', 'Review feedback', 'Confirm owners', 'Plan workshop', 'Finalize readiness'].map((name, index) => ({
      id: `request-${index + 1}`, name, projectId: index % 2 ? 'project-onboarding' : 'project-service',
      dueUtc: fixtures.utc(index * 1440), hours: index + 1, notes: 'Synthetic demonstration record.', revision: 1,
    })),
  };
}
export function validateWorkspace(state: Workspace): void {
  for (const project of state.projects) assertValidDraft(projectDraft(defaults.projects)(project), defaults.projects, projectFields);
  for (const request of state.requests) {
    assertValidDraft(projectDraft(defaults.requests)(request), defaults.requests, requestFields);
    if (!state.projects.some(project => project.id === request.projectId)) throw new ValidationError<RequestDraft>({ projectId: 'The selected project no longer exists.' }, 'The selected project no longer exists.');
  }
}
