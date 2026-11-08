import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { args, cli, exists, isMain, noLinkedAncestors, readJson } from './lib.mjs';

export function addCollection(argv) {
  const { options, positional } = args(argv, ['id', 'title', 'dry-run'], ['dry-run']);
  if (positional.length !== 1 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(options.id ?? '') || !options.title?.trim()) throw new Error('Usage: node add-collection.mjs <app-folder> --id items --title Items [--dry-run]');
  const id = options.id; const title = options.title.trim();
  if (id.length > 60 || title.length > 100 || /[\u0000-\u001f]/.test(title)) throw new Error('Collection IDs/titles are too long or contain control characters.');
  const app = resolve(positional[0]); noLinkedAncestors(app);
  const pkg = readJson(join(app, 'package.json'));
  const spec = pkg.dependencies?.codeappscompact;
  if (typeof spec !== 'string') throw new Error('The app must declare codeappscompact 2.1 or later before adding a collection.');
  const kitFolder = spec.startsWith('file:') ? resolve(app, spec.slice(5)) : join(app, 'node_modules', 'codeappscompact');
  const kitRelative = relative(app, kitFolder);
  if (kitRelative.startsWith('..') || isAbsolute(kitRelative)) throw new Error('The kit must be installed or vendored inside the app.');
  noLinkedAncestors(kitFolder);
  if (!exists(join(kitFolder, 'package.json'))) throw new Error('Restore the declared compatible kit through the approved workflow before scaffolding.');
  const kit = readJson(join(kitFolder, 'package.json'));
  const version = /^2\.(\d+)\.\d+$/.exec(kit.version ?? '');
  if (kit.name !== 'codeappscompact' || !version || Number(version[1]) < 1) throw new Error('Scaffolding requires a reviewed codeappscompact 2.1 or later 2.x kit. Existing data was preserved.');
  const target = join(app, 'src', 'collections', id);
  const testFile = join(app, 'tests', `${id}.test.ts`);
  noLinkedAncestors(target); noLinkedAncestors(testFile);
  if (exists(target) || exists(testFile)) throw new Error(`Collection files already exist; nothing was replaced: ${target}`);
  const source = `import { defineCollection } from 'codeappscompact/collections';
import { fieldPresets } from 'codeappscompact';
import type { DataService, Field } from 'codeappscompact';

export type Draft = { name: string; notes: string; revision: number };
export type Row = Draft & { id: string };
export const defaults: Draft = { name: '', notes: '', revision: 0 };
export const fields = [
  { name: 'name', label: 'Name', ...fieldPresets.name },
  { name: 'notes', label: 'Notes', ...fieldPresets.notes },
] satisfies readonly Field<Draft>[];
export function collection(namespace: string, service: DataService<Row, Draft>) {
  return defineCollection<Row, Draft>({
    namespace, id: ${JSON.stringify(id)}, title: ${JSON.stringify(title)}, service, defaults, fields,
    getId: row => row.id, getLabel: row => row.name, searchText: row => \`\${row.name} \${row.notes}\`,
    columns: [{ id: 'name', header: 'Name', render: row => row.name, sortValue: row => row.name }],
    mobileLayout: 'cards',
  });
}
`;
  const test = `import test from 'node:test';
import assert from 'node:assert/strict';
import { assertValidDraft } from 'codeappscompact/validation';
import { defaults, fields } from '../src/collections/${id}/definition.ts';

test(${JSON.stringify(`${title}: shared validation preserves flat payloads`)}, () => {
  assertValidDraft({ ...defaults, name: 'Synthetic record' }, defaults, fields);
  assert.throws(() => assertValidDraft(defaults, defaults, fields));
});
`;
  const integration = [
    `Import { collection, defaults, fields } from './collections/${id}/definition.ts'.`,
    'Add defaults/fields/seed to the app-owned demo repository, or adapt an authorized real service. Do not duplicate storage or QueryClient providers.',
    `Render <RecordScreen {...collection(appNamespace, service)} headingLevel={2} onFormStateChange={guard.onFormStateChange} />.`,
    'Add navigation through requestNavigation. Keep the screen key tied to collection identity, not filters/sorting. Connect useWorkspace once for scoped refresh.',
    'Add the new domain acceptance scenarios. Ensure the app test script includes tests/*.test.ts. No existing files are edited automatically.',
  ];
  const files = [join(target, 'definition.ts'), testFile];
  if (!options['dry-run']) {
    mkdirSync(target, { recursive: true }); mkdirSync(join(app, 'tests'), { recursive: true });
    writeFileSync(files[0], source, { flag: 'wx' }); writeFileSync(files[1], test, { flag: 'wx' });
  }
  return { dryRun: Boolean(options['dry-run']), files, integration, dependenciesInstalled: false, existingFilesChanged: false };
}
if (isMain(import.meta.url)) await cli(() => console.log(JSON.stringify(addCollection(process.argv.slice(2)), null, 2)));
