import { defineDemoWorkspace } from 'codeappscompact/workspace';
import { bindReferences, columnsFor, referenceBinding, selectFilter } from 'codeappscompact/authoring';
import { defaults, fields, seed, validate, validateMutation } from './domain.ts';
import type { Drafts } from './domain.ts';

const requestColumn = columnsFor<Drafts['requests']>();
const projectColumn = columnsFor<Drafts['projects']>();
export function createWorkspace(storageKey: string) {
  return defineDemoWorkspace<Drafts>({
    key: storageKey, schemaVersion: 1, defaults, fields, seed, validate, validateMutation,
    dependencies: { projects: ['requests'] },
    collections: {
      requests: state => {
        const projects = referenceBinding(state.projects, { getId: row => row.id, getLabel: row => row.name, emptyText: 'Create a project first.' });
        return {
          title: 'Requests', getId: row => row.id, getLabel: row => row.name,
          createDefaults: () => ({ ...defaults.requests, projectId: state.projects[0]?.id ?? '' }),
          fields: bindReferences(fields.requests, { projectId: projects }),
          searchText: row => `${row.name} ${row.notes} ${projects.label(row.projectId)}`,
          columns: [requestColumn('name', 'Request', row => row.name), requestColumn('project', 'Project', row => projects.label(row.projectId)), requestColumn('status', 'Status', row => row.status)],
          filters: [selectFilter(fields.requests, 'status')], mobileLayout: 'cards',
        };
      },
      projects: () => ({
        title: 'Projects', getId: row => row.id, getLabel: row => row.name, searchText: row => `${row.name} ${row.notes}`,
        columns: [projectColumn('name', 'Project', row => row.name)], mobileLayout: 'cards',
      }),
    },
    attention: state => state.requests.filter(row => row.status === 'Open').map(row => ({ id: row.id, message: `${row.name} is open.`, tone: 'info', action: { label: 'View requests', collectionId: 'requests' } })),
  });
}
