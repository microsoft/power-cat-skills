import { defineCollection } from 'codeappscompact/collections';
import { NumberCell, PrimarySecondaryCell, StatusBadge, UtcCell } from 'codeappscompact/display';
import { referenceLabel, referenceOptions } from 'codeappscompact/reference';
import { utcMinute } from 'codeappscompact/recipes/defaults';
import { defaults, projectFields, projectStatuses, requestFields } from './domain.ts';
import type { RequestDraft, Workspace } from './domain.ts';
import type { Field } from 'codeappscompact';
import { services } from './repository.ts';
import config from './app-config.json';

export function defineScreens(state: Workspace) {
  const options = referenceOptions(state.projects, { getId: row => row.id, getLabel: row => row.name });
  const fields: readonly Field<RequestDraft>[] = requestFields.map(field => field.name === 'projectId' ? { name: 'projectId', label: 'Project', kind: 'reference', required: true, reference: { options, emptyText: 'Create a project first.' } } : field);
  return {
    requests: defineCollection({
      namespace: config.storageKey, id: 'requests', title: 'Requests', service: services.requests, defaults: defaults.requests,
      createDefaults: () => ({ ...defaults.requests, projectId: state.projects[0]?.id ?? '', dueUtc: utcMinute(Date.now, 24 * 60) }),
      getId: row => row.id, getLabel: row => row.name, fields,
      searchText: row => `${row.name} ${row.notes} ${referenceLabel(options, row.projectId)}`,
      columns: [
        { id: 'name', header: 'Request', render: row => <PrimarySecondaryCell primary={row.name} secondary={row.notes} />, sortValue: row => row.name },
        { id: 'project', header: 'Project', render: row => referenceLabel(options, row.projectId), sortValue: row => referenceLabel(options, row.projectId) },
        { id: 'dueUtc', header: 'Due (UTC)', render: row => <UtcCell value={row.dueUtc} />, sortValue: row => row.dueUtc },
        { id: 'hours', header: 'Hours', render: row => <NumberCell value={row.hours} />, sortValue: row => row.hours },
      ],
      filters: [{ id: 'project', label: 'Filter by project', options: [{ value: '', label: 'All projects' }, ...options], matches: (row, value) => row.projectId === value }],
      mobileLayout: 'cards',
    }),
    projects: defineCollection({
      namespace: config.storageKey, id: 'projects', title: 'Projects', service: services.projects, defaults: defaults.projects,
      getId: row => row.id, getLabel: row => row.name, searchText: row => `${row.name} ${row.status} ${row.notes}`, fields: projectFields,
      columns: [
        { id: 'name', header: 'Project', render: row => <PrimarySecondaryCell primary={row.name} secondary={row.notes} />, sortValue: row => row.name },
        { id: 'status', header: 'Status', render: row => <StatusBadge tone={row.status === 'Complete' ? 'success' : row.status === 'Active' ? 'info' : 'neutral'}>{row.status}</StatusBadge>, sortValue: row => row.status },
      ],
      filters: [{ id: 'status', label: 'Filter by status', options: projectStatuses, matches: (row, value) => row.status === value }],
      mobileLayout: 'cards',
    }),
  };
}
