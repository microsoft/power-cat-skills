import { AppShell } from 'codeappscompact';
import HostStatus from './HostStatus.tsx';
import config from './app-config.json';

export default function App() {
  return <AppShell title={config.title} subtitle="Minimal Code App shell - configure your own collections" items={[]} activeId="" onNavigate={() => { throw new Error('No collections are configured yet.'); }}
    hostStatus={<HostStatus />}>
    <section aria-labelledby="getting-started"><h2 id="getting-started">Add your first collection</h2>
      <p>The shell is ready. No example business data or production connections have been created.</p>
      <p>Use the bundled add-collection tool, then connect a demo repository or an authorized service and add domain acceptance tests.</p>
    </section>
  </AppShell>;
}
