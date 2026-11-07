import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { powerApps } from '@microsoft/power-apps-vite/plugin';
import config from './src/app-config.json';

const app = new URL(config.appUrl);
export default defineConfig({
  plugins: [react(), ...(config.localOnly ? [] : [powerApps()])],
  server: { host: app.hostname, port: Number(app.port), strictPort: true },
});
