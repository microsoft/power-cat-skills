import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { args, cli, exists, filesIn, isMain, readJson, writeJson } from './lib.mjs';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(skill, 'assets', 'dist');
const output = join(skill, 'references', 'signatures');
const hash = value => createHash('sha256').update(value).digest('hex');
function groups() {
  return {
    authoring: ['authoring.d.ts'], workspace: ['workspace.d.ts'], records: ['contracts.d.ts', 'RecordScreen.d.ts'], validation: ['fields.d.ts'],
    collections: ['collections.d.ts', 'query.d.ts'], reference: ['reference.d.ts'], display: ['display.d.ts'], demo: ['demo.d.ts'], host: ['host.d.ts'],
    ...Object.fromEntries(filesIn(join(dist, 'recipes')).filter(file => file.endsWith('.d.ts')).map(file => [`recipe-${file.slice(0, -5)}`, [join('recipes', file)]])),
  };
}
function signature(name, files) {
  return `CodeAppsCompact ${readJson(join(skill, 'assets', 'package.json')).version}: ${name}\nGenerated from emitted TypeScript declarations. Read only the capability you need.\n\n` + files.map(file => `--- ${file.replaceAll('\\', '/')} ---\n${readFileSync(join(dist, file), 'utf8')}`).join('\n');
}
export function generateReferences(checkOnly = false) {
  const manifest = { version: readJson(join(skill, 'assets', 'package.json')).version, capabilities: {} };
  for (const [name, files] of Object.entries(groups())) {
    const text = signature(name, files); const file = join(output, `${name}.txt`);
    manifest.capabilities[name] = { files, sha256: hash(text), characters: text.length };
    if (checkOnly) {
      if (!exists(file) || readFileSync(file, 'utf8') !== text) throw new Error(`Stale or missing generated signature: ${name}. Rebuild the portable kit.`);
    } else { mkdirSync(output, { recursive: true }); writeFileSync(file, text); }
  }
  const path = join(output, 'manifest.json');
  if (checkOnly) {
    if (JSON.stringify(readJson(path)) !== JSON.stringify(manifest)) throw new Error('Generated signature manifest is stale.');
  } else writeJson(path, manifest, true);
  return manifest;
}
if (isMain(import.meta.url)) await cli(() => {
  const { options, positional } = args(process.argv.slice(2), ['build', 'check', 'list'], ['build', 'check', 'list']);
  if (Object.keys(options).length > 1 || positional.length > 1 || (positional.length && Object.keys(options).length)) throw new Error('Usage: node api-reference.mjs <capability> | --list | --build | --check');
  if (options.build || options.check) { const result = generateReferences(Boolean(options.check)); console.log(`${Object.keys(result.capabilities).length} declaration-derived capability references ${options.check ? 'verified' : 'generated'}.`); return; }
  const manifest = readJson(join(output, 'manifest.json'));
  if (options.list || !positional.length) { console.log(Object.entries(manifest.capabilities).map(([name, value]) => `${name}: ${value.characters} characters`).join('\n')); return; }
  const name = positional[0]; const item = manifest.capabilities[name];
  if (!Object.hasOwn(manifest.capabilities, name)) throw new Error('Unknown capability. Use --list; do not read the entire API by default.');
  const text = readFileSync(join(output, `${name}.txt`), 'utf8');
  if (hash(text) !== item.sha256) throw new Error('Signature file differs from its manifest. Rebuild before relying on it.');
  console.log(text);
});
