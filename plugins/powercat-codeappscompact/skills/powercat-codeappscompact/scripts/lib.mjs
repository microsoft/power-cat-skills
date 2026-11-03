import { constants, copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const exists = path => lstatSync(path, { throwIfNoEntry: false }) !== undefined;
export function readJson(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Expected a regular JSON file: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}
export function noLinkedAncestors(path) {
  const ancestors = [];
  for (let cursor = resolve(path); ; cursor = dirname(cursor)) {
    ancestors.push(cursor);
    if (cursor === dirname(cursor)) break;
  }
  for (const cursor of ancestors.reverse()) {
    const stat = lstatSync(cursor, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Refusing a linked path: ${cursor}`);
  }
}
export function filesIn(root, skip = new Set(), prefix = '') {
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Expected a regular directory: ${root}`);
  return readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    if (!prefix && skip.has(entry.name)) return [];
    if (entry.isSymbolicLink()) throw new Error(`Refusing a linked file: ${join(root, entry.name)}`);
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) return filesIn(join(root, entry.name), new Set(), relative);
    if (!entry.isFile()) throw new Error(`Expected a regular file: ${join(root, entry.name)}`);
    return [relative];
  });
}
export function copyTree(source, target, skip = new Set()) {
  noLinkedAncestors(target);
  if (exists(target)) throw new Error(`Destination already exists; nothing was replaced: ${target}`);
  const files = filesIn(source, skip);
  mkdirSync(target, { recursive: true });
  for (const file of files) {
    const destination = join(target, file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(source, file), destination, constants.COPYFILE_EXCL);
  }
}
export function args(argv, allowed, booleanOptions = []) {
  const options = {}; const positional = [];
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (!value.startsWith('--')) { positional.push(value); continue; }
    const key = value.slice(2);
    if (!allowed.includes(key) || Object.hasOwn(options, key)) throw new Error(`Unknown or repeated argument: ${value}`);
    if (booleanOptions.includes(key)) options[key] = true;
    else {
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`Missing value for ${value}`);
      options[key] = argv[++index];
    }
  }
  return { options, positional };
}
export function writeJson(path, value, replace = false) {
  noLinkedAncestors(path); mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: replace ? 'w' : 'wx' });
  if (JSON.stringify(readJson(path)) !== JSON.stringify(value)) throw new Error(`Saved JSON failed read-back verification: ${path}`);
}
export function runProcess(app, executable, command, logPath, options = {}) {
  const result = spawnSync(executable, command, { cwd: app, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024, timeout: options.timeoutMs ?? 300000, env: { ...process.env, ...options.env } });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (logPath) { noLinkedAncestors(logPath); mkdirSync(dirname(logPath), { recursive: true }); writeFileSync(logPath, output, { flag: 'wx' }); }
  if (result.error || result.status !== 0) throw new Error(`Command failed: ${result.error?.message ?? result.signal ?? result.status}\n${output.split(/\r?\n/).slice(-25).join('\n')}${logPath ? `\nFull log: ${logPath}` : ''}`);
  return result.stdout.trim();
}
export function runNpm(app, command, logPath, options = {}) {
  if (command.some(item => !/^[\w@./:=+\\-]+$/.test(item))) throw new Error('Unsafe npm command argument.');
  const windows = process.platform === 'win32';
  return runProcess(app, windows ? process.env.ComSpec || 'cmd.exe' : 'npm', windows ? ['/d', '/s', '/c', ['npm', ...command].join(' ')] : command, logPath, options);
}
export function isMain(url) { return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(url); }
export function cli(work) { return Promise.resolve().then(work).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }); }
export function environmentGuid(value) { return typeof value === 'string' && /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value) && value !== '00000000-0000-0000-0000-000000000000'; }
export function appOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !url.port) throw new Error('Expected a loopback HTTP app origin with an explicit port.');
  return url;
}
