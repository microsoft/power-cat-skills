import { copyFileSync, mkdirSync, readFileSync, writeFileSync, constants } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { args, cli, copyTree, environmentGuid, exists, filesIn, isMain, noLinkedAncestors, readJson, writeJson } from './lib.mjs';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function createApp(argv) {
  const { options, positional } = args(argv, ['name', 'environment', 'local-only', 'port', 'slug', 'profile', 'definition', 'dry-run'], ['dry-run', 'local-only']);
  const localOnly = Boolean(options['local-only']);
  if (positional.length !== 1 || !options.name?.trim() || (localOnly ? options.environment !== undefined : !environmentGuid(options.environment))) throw new Error('Usage: node create-app.mjs <new-app-folder> --name <display-name> (--local-only | --environment <authorized-guid>) [--port 5173] [--profile minimal|example|integrated|aggregate] [--definition <typed-definition-folder>] [--dry-run]');
  const environmentId = localOnly ? '' : options.environment;
  const profile = options.profile ?? (options.definition ? 'integrated' : 'minimal');
  if (!['minimal', 'example', 'integrated', 'aggregate'].includes(profile)) throw new Error('Profile must be minimal, example, integrated or aggregate.');
  if ((profile === 'integrated') !== Boolean(options.definition)) throw new Error('The integrated profile requires --definition; other profiles must not receive it.');
  const port = Number(options.port ?? 5173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Port must be an integer from 1024 through 65535.');
  const name = options.name.trim();
  if (name.length > 120 || /[\u0000-\u001f]/.test(name)) throw new Error('Display name must be at most 120 characters without control characters.');
  const slug = options.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(slug)) throw new Error('Supply --slug with a lowercase ASCII npm package name.');
  const app = resolve(positional[0]); noLinkedAncestors(app);
  if (exists(app)) throw new Error(`Destination already exists; nothing was replaced: ${app}`);
  const assets = join(skill, 'assets');
  const pkg = readJson(join(assets, 'package.json'));
  if (pkg.name !== 'codeappscompact' || pkg.version !== '2.7.0') throw new Error('The complete 2.7.0 skill bundle is required.');
  const tools = ['lib.mjs', 'atomic-json.mjs', 'add-collection.mjs', 'browser-harness.mjs', 'acceptance-scenarios.mjs', 'preflight.mjs', 'verify.mjs', 'workflow.mjs', 'workflow-options.mjs', 'finalize.mjs', 'host-request.mjs', 'host-edit.mjs', 'fingerprints.mjs', 'readiness.mjs', 'verify-local-play.mjs', 'verify-portability.mjs', 'mark-phase.mjs', 'measure-usage.mjs'];
  filesIn(assets);
  const starter = join(skill, 'starter');
  const templates = new Map(filesIn(starter).map(file => [file, join(starter, file)]));
  if (profile !== 'example') {
    for (const file of [join('src', 'domain.ts'), join('src', 'repository.ts'), join('src', 'collections.tsx')]) templates.delete(file);
    const overlay = join(skill, 'profiles', profile);
    for (const file of filesIn(overlay)) templates.set(file, join(overlay, file));
  }
  let definitionEntry;
  if (profile === 'integrated') {
    const source = resolve(options.definition); noLinkedAncestors(source);
    const relation = relative(source, app);
    if (relation === '' || (!relation.startsWith(`..${sep}`) && relation !== '..' && !relation.includes(':'))) throw new Error('The app destination must be outside the definition folder.');
    const files = filesIn(source);
    const entries = ['index.ts', 'index.tsx'].filter(file => files.includes(file));
    if (entries.length !== 1) throw new Error('Definition needs exactly one index.ts or index.tsx exporting createWorkspace(storageKey). No definition code is executed during scaffolding.');
    definitionEntry = entries[0];
    for (const required of [join('tests', 'domain.test.ts'), join('tests', 'acceptance.mjs'), join('tests', 'acceptance.json')]) {
      if (!files.includes(required)) throw new Error(`Definition needs independent app-owned assertions: ${required}`);
    }
    const criteria = readJson(join(source, 'tests', 'acceptance.json'));
    const ids = criteria.checks?.map(check => check.id);
    if (!ids?.length || ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) throw new Error('Acceptance criteria require unique nonempty IDs.');
    for (const file of files) {
      if (file === 'README.md') continue;
      const isTest = file.startsWith(`tests${sep}`);
      if (!(isTest ? ['.ts', '.mjs', '.json'] : ['.ts', '.tsx', '.json']).includes(extname(file))) throw new Error(`Unsupported definition file: ${file}. Keep tooling, credentials and dependencies out of the definition.`);
      const target = isTest ? file : join('src', 'definition', file);
      if (templates.has(target) && target !== join('tests', 'domain.test.ts') && target !== join('tests', 'acceptance.json')) throw new Error(`Definition conflicts with owned infrastructure: ${file}`);
      templates.set(target, join(source, file));
    }
  }
  const scripts = filesIn(join(skill, 'scripts'));
  for (const file of tools) if (!scripts.includes(file)) throw new Error(`Missing bundled tool: ${file}`);
  const manifest = readJson(templates.get('package.json'));
  const power = readJson(templates.get('power.config.json'));
  const html = readFileSync(templates.get('index.html'), 'utf8');
  const plan = { app, skill: 'powercat-codeappscompact', version: pkg.version, profile, localOnly, dryRun: Boolean(options['dry-run']), files: [...templates.keys()], installedDependencies: false, definitionExecuted: false };
  if (options['dry-run']) return plan;
  mkdirSync(app, { recursive: true });
  for (const [file, source] of templates) {
    const target = join(app, file); mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target, constants.COPYFILE_EXCL);
  }
  if (definitionEntry) {
    const appFile = join(app, 'src', 'App.tsx');
    writeFileSync(appFile, readFileSync(appFile, 'utf8').replace('__DEFINITION_ENTRY__', definitionEntry));
  }
  copyTree(assets, join(app, 'vendor', `codeappscompact-${pkg.version}`));
  mkdirSync(join(app, 'tools'));
  for (const file of tools) copyFileSync(join(skill, 'scripts', file), join(app, 'tools', file), constants.COPYFILE_EXCL);
  const appUrl = `http://127.0.0.1:${port}`;
  if (localOnly) {
    manifest.scripts.preflight += ' --local-only';
    manifest.scripts.verify = manifest.scripts['verify:local'];
    manifest.scripts.finalize = manifest.scripts['finalize:local'];
  }
  manifest.name = slug; writeJson(join(app, 'package.json'), manifest, true);
  Object.assign(power, { appDisplayName: name, environmentId, localAppUrl: appUrl });
  writeJson(join(app, 'power.config.json'), power, true);
  writeJson(join(app, 'src', 'app-config.json'), { title: name, environmentId, localOnly, appUrl, profile, storageKey: `${slug}-demo-${randomUUID()}` }, true);
  const title = name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  writeFileSync(join(app, 'index.html'), html.replace('<title>CodeAppsCompact</title>', `<title>${title}</title>`));
  return { ...plan, next: localOnly
    ? 'Replace the neutral domain and acceptance checks; reuse the supplied infrastructure. Restore approved npm dependencies with --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund. Run verify:local, repair collected independent failures and resume. Finish once with finalize:local and original usage markers when requested. This app is unbound: no host authentication or deployment.'
    : 'Review the domain contract and restore approved npm dependencies with --install-links --ignore-scripts --strict-peer-deps --legacy-peer-deps=false --force=false --no-audit --no-fund. Run verify with the explicitly authorized host route, then finalize --resume with fresh host evidence and original metering inputs. No existing app/profile/process was changed.' };
}
if (isMain(import.meta.url)) await cli(() => console.log(JSON.stringify(createApp(process.argv.slice(2)), null, 2)));
