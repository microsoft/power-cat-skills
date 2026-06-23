// After `vite build`, copy the single self-contained dist/index.html to a friendly,
// double-clickable file at the project root: PowerCAT-OverPage.html
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'dist', 'index.html');
const to = resolve(root, 'PowerCAT-OverPage.html');
copyFileSync(from, to);
console.log('Packaged single-file app ->', to);
console.log('Just double-click it (no server needed). Use "Open .zip" and "Open findings".');
