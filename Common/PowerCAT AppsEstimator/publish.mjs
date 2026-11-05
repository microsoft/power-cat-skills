import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
  throw new Error('Usage: node publish.mjs [--check]');
}

const source = dirname(fileURLToPath(import.meta.url));
const output = resolve(source, '..', '..', 'docs', 'PowerCAT-AppsEstimator.html');
let html = readFileSync(join(source, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
for (const name of ['power-cat-logo.png', 'power-cat-mark.png']) {
  const reference = `assets/${name}`;
  if (!html.includes(reference)) {
    throw new Error(`Missing image reference: ${reference}`);
  }
  const data = readFileSync(join(source, 'assets', name)).toString('base64');
  html = html.replaceAll(reference, `data:image/png;base64,${data}`);
}

if (args[0] === '--check') {
  if (readFileSync(output, 'utf8').replace(/\r\n/g, '\n') !== html) {
    throw new Error('The Pages artifact is stale. Run publish.mjs and commit the updated HTML.');
  }
  console.log('PowerCAT-AppsEstimator.html is up to date.');
} else {
  writeFileSync(output, html, 'utf8');
  console.log(`Generated ${output}`);
}
