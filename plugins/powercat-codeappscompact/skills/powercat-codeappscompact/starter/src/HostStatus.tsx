import { PowerAppsHostStatus } from 'codeappscompact/host';
import config from './app-config.json';

export default function HostStatus() {
  return config.localOnly
    ? <p data-host-state="preview" role="status">Local-only preview. Synthetic data; no tenant binding or deployment.</p>
    : <PowerAppsHostStatus environmentId={config.environmentId} appUrl={config.appUrl} />;
}
