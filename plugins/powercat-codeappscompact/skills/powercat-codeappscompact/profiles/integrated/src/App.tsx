import { DemoWorkspace } from 'codeappscompact/workspace';
import HostStatus from './HostStatus.tsx';
import { createWorkspace } from './definition/__DEFINITION_ENTRY__';
import config from './app-config.json';

const definition = createWorkspace(config.storageKey);
export default function App() {
  return <DemoWorkspace definition={definition} title={config.title}
    hostStatus={<HostStatus />} />;
}
