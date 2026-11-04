import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, filesIn, noLinkedAncestors, readJson } from './lib.mjs';

export const digest = value => createHash('sha256').update(value).digest('hex');
export function fileDigest(path) { noLinkedAncestors(path); return digest(readFileSync(path)); }
export function treeDigest(root) {
  noLinkedAncestors(root);
  if (!exists(root)) return digest('absent');
  // filesIn already rejects links throughout the tree; do not restat every ancestor per file.
  return digest(JSON.stringify(filesIn(root).map(file => [file.replaceAll('\\', '/'), digest(readFileSync(join(root, file)))])));
}
function namedFiles(app, names) {
  return digest(JSON.stringify(names.map(name => [name, exists(join(app, name)) ? fileDigest(join(app, name)) : 'absent'])));
}
export function fingerprints(app) {
  noLinkedAncestors(app);
  const pkg = readJson(join(app, 'package.json'));
  const spec = pkg.dependencies?.codeappscompact;
  let vendor = 'registry';
  if (typeof spec === 'string' && spec.startsWith('file:')) {
    const root = resolve(app, spec.slice(5)); const rel = relative(app, root);
    if (rel.startsWith('..') || isAbsolute(rel) || isAbsolute(spec.slice(5))) throw new Error('Kit fingerprinting requires an app-local vendor path.');
    vendor = treeDigest(root);
  }
  const otherInputs = filesIn(app, new Set(['node_modules', 'vendor', 'dist', 'evidence', '.git', '.validation', 'src', 'tests', 'tools']))
    .filter(file => !['README.md', 'LICENSE', '.gitignore', 'package.json', 'package-lock.json'].includes(file));
  const buildEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_') || key === 'NODE_ENV').sort(([a], [b]) => a.localeCompare(b)));
  const toolFolder = join(app, 'tools'); const executingFolder = dirname(fileURLToPath(import.meta.url));
  const appTools = treeDigest(toolFolder);
  return {
    kit: digest(`${vendor}:${treeDigest(join(app, 'node_modules', 'codeappscompact'))}`),
    dependencies: namedFiles(app, ['package.json', 'package-lock.json', join('node_modules', '.package-lock.json')]),
    configuration: namedFiles(app, otherInputs),
    source: treeDigest(join(app, 'src')), tests: treeDigest(join(app, 'tests')),
    acceptance: namedFiles(app, [join('tests', 'acceptance.json')]),
    tools: digest(`${appTools}:${resolve(toolFolder) === resolve(executingFolder) ? appTools : treeDigest(executingFolder)}`),
    runtime: digest(JSON.stringify({ node: process.version, platform: process.platform, architecture: process.arch, browser: process.env.CODECOMPACT_BROWSER_CHANNEL ?? 'msedge', buildEnvironment })),
  };
}
const scopes = {
  preflight: ['kit', 'dependencies', 'configuration', 'runtime'],
  build: ['kit', 'dependencies', 'configuration', 'source', 'tests', 'tools', 'runtime'],
  lint: ['kit', 'dependencies', 'configuration', 'source', 'tests', 'tools', 'runtime'],
  test: ['kit', 'dependencies', 'configuration', 'source', 'tests', 'tools', 'runtime'],
  browser: ['kit', 'dependencies', 'configuration', 'source', 'tests', 'acceptance', 'tools', 'runtime'],
  portability: ['kit', 'dependencies', 'configuration', 'tools', 'runtime'],
};
export function stageFingerprint(id, current) {
  const keys = scopes[id];
  if (!keys) throw new Error(`Stage has no reusable evidence policy: ${id}`);
  return digest(JSON.stringify(keys.map(key => [key, current[key]])));
}
