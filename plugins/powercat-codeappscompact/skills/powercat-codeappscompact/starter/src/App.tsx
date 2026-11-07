import { useState } from 'react';
import { AppShell, RecordScreen, useNavigationGuard } from 'codeappscompact';
import { QueryState, useWorkspace } from 'codeappscompact/collections';
import { MetricGrid } from 'codeappscompact/display';
import HostStatus from './HostStatus.tsx';
import { defineScreens } from './collections.tsx';
import { repository } from './repository.ts';
import config from './app-config.json';

type Page = 'requests' | 'projects';
export default function App() {
  const [page, setPage] = useState<Page>('requests');
  const guard = useNavigationGuard();
  const query = useWorkspace({ namespace: config.storageKey, repository });
  const state = query.data;
  const screens = state ? defineScreens(state) : null;
  function navigate(id: string) {
    if (id !== 'requests' && id !== 'projects') throw new Error('Unknown collection.');
    if (id !== page) guard.requestNavigation(() => setPage(id));
  }
  return <AppShell title={config.title} subtitle="Synthetic demo - saved in this browser only" activeId={page} onNavigate={navigate}
    items={[{ id: 'requests', label: 'Requests', count: state?.requests.length }, { id: 'projects', label: 'Projects', count: state?.projects.length }]}
    hostStatus={<HostStatus />}>
    {guard.message && <p role="alert">{guard.message}</p>}
    <QueryState pending={query.isPending} error={query.error ?? query.refreshError} retrying={query.isFetching} onRetry={() => { void query.retry(); }} />
    {state && <MetricGrid items={[
      { id: 'requests', title: 'Requests', value: state.requests.length, onActivate: () => navigate('requests') },
      { id: 'projects', title: 'Projects', value: state.projects.length, onActivate: () => navigate('projects') },
    ]} />}
    {screens && (page === 'requests' ? <RecordScreen key="requests" {...screens.requests} headingLevel={2} onFormStateChange={guard.onFormStateChange} /> : <RecordScreen key="projects" {...screens.projects} headingLevel={2} onFormStateChange={guard.onFormStateChange} />)}
    <p>All records are synthetic. No production connectors or publishing are configured.</p>
  </AppShell>;
}
