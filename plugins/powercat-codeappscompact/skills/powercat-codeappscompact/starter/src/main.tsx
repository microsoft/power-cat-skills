import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppErrorBoundary } from 'codeappscompact';
import App from './App.tsx';
import 'codeappscompact/theme.css';
import './styles.css';

const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
const root = document.getElementById('root');
if (!root) throw new Error('The app root is missing.');
createRoot(root).render(<StrictMode><AppErrorBoundary><QueryClientProvider client={client}><App /></QueryClientProvider></AppErrorBoundary></StrictMode>);
