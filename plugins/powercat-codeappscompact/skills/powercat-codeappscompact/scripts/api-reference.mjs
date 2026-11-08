import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, cli, filesIn, isMain, readJson } from './lib.mjs';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(skill, 'assets', 'dist');
function groups() {
  return {
    aggregate: ['DataTable.d.ts', 'csv.d.ts', 'transactions.d.ts'], authoring: ['authoring.d.ts'], workspace: ['workspace.d.ts'], records: ['contracts.d.ts', 'RecordScreen.d.ts'], validation: ['fields.d.ts'],
    'aggregate-ui': ['DraftDialog.d.ts', 'useTransactionState.d.ts', 'AggregateViews.d.ts'],
    collections: ['collections.d.ts', 'query.d.ts'], reference: ['reference.d.ts'], display: ['display.d.ts'], demo: ['demo.d.ts'], host: ['host.d.ts'],
    ...Object.fromEntries(filesIn(join(dist, 'recipes')).filter(file => file.endsWith('.d.ts')).map(file => [`recipe-${file.slice(0, -5)}`, [join('recipes', file)]])),
  };
}
function signature(name, files) {
  return `PowerCat-CodeAppsCompact ${readJson(join(skill, 'assets', 'package.json')).version}: ${name}\nGenerated from emitted TypeScript declarations. Read only the capability you need.\n\n` + files.map(file => `--- ${file.replaceAll('\\', '/')} ---\n${readFileSync(join(dist, file), 'utf8')}`).join('\n');
}
if (isMain(import.meta.url)) await cli(() => {
  const { options, positional } = args(process.argv.slice(2), ['list'], ['list']);
  if (positional.length > 1 || (positional.length && options.list)) throw new Error('Usage: node api-reference.mjs <capability> | --list');
  const capabilities = groups();
  if (!positional.length) {
    console.log(Object.entries(capabilities).map(([name, files]) => `${name}: ${signature(name, files).length} characters`).join('\n'));
    return;
  }
  const name = positional[0];
  if (!Object.hasOwn(capabilities, name)) throw new Error('Unknown capability. Use --list; do not read the entire API by default.');
  console.log(signature(name, capabilities[name]));
});
