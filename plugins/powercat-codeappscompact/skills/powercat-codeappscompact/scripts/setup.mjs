import { cpSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { noLinkedAncestors } from './lib.mjs';

const assets = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
// lstat also finds dangling links and junctions that fs.existsSync can miss.
const existsSync = path => lstatSync(path, { throwIfNoEntry: false }) !== undefined;
const readJson = path => {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`Expected a regular JSON file: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
};
const dependencyGroups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function fail(message) {
  throw new Error(message);
}

function regularDirectory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`Expected a regular directory: ${path}`);
}

function filesIn(directory, prefix = '') {
  regularDirectory(directory);
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(directory, entry.name);
    const key = join(prefix, entry.name);
    if (entry.isSymbolicLink()) fail(`Refusing a linked asset: ${path}`);
    if (entry.isDirectory()) return filesIn(path, key);
    if (!entry.isFile()) fail(`Expected a regular file: ${path}`);
    return [key];
  });
}

function samePackage(directory) {
  const expected = filesIn(assets);
  const actual = filesIn(directory);
  return JSON.stringify(actual) === JSON.stringify(expected) && expected.every(path =>
    readFileSync(join(assets, path)).equals(readFileSync(join(directory, path))));
}

function npm(app, args) {
  // Only fixed arguments and a validated package version enter the Windows shell.
  const windows = process.platform === 'win32';
  const capture = args.length === 1 && args[0] === '--version';
  const result = spawnSync(windows ? process.env.ComSpec || 'cmd.exe' : 'npm',
    windows ? ['/d', '/s', '/c', ['npm', ...args].join(' ')] : args,
    { cwd: app, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error) fail(`Could not run npm: ${result.error.message}`);
  if (result.status !== 0) fail(`npm failed (${result.signal || result.status}); ${result.stderr || ''}inspect its error and the app's dependency state before retrying.`);
  return result.stdout?.trim();
}

function npmProject(app, manifest) {
  const otherMarkers = ['yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb', '.yarnrc', '.yarnrc.yml', '.pnp.cjs', '.pnp.loader.mjs'];
  if (otherMarkers.some(path => existsSync(join(app, path))) ||
      (manifest.packageManager && !/^npm@\d+\./.test(manifest.packageManager))) {
    fail('This helper supports standalone npm apps only. Use the existing package-manager workflow; no files were changed.');
  }
  for (let directory = app; ; directory = dirname(directory)) {
    const path = join(directory, 'package.json');
    if ((existsSync(path) && readJson(path).workspaces !== undefined) || existsSync(join(directory, 'pnpm-workspace.yaml'))) {
      fail('Workspace detected. Use its existing local-package workflow; no files were changed.');
    }
    if (dirname(directory) === directory) break;
  }
  const locks = ['package-lock.json', 'npm-shrinkwrap.json'].filter(path => existsSync(join(app, path)));
  if (locks.length > 1) fail('Multiple npm lockfiles found; resolve the conflict first.');
  if (locks.length === 0 && !manifest.packageManager) fail('No npm lockfile or packageManager declaration. Confirm the app tooling before setup.');
  const lockPath = join(app, locks[0] || 'package-lock.json');
  if (existsSync(lockPath)) {
    const version = readJson(lockPath).lockfileVersion;
    if (!Number.isInteger(version) || version < 2) fail('Use the app workflow to repair or update its npm lockfile first.');
  }
  return lockPath;
}

function verify(app, destination, lockPath, version) {
  const specPointsHere = value => typeof value === 'string' && value.startsWith('file:') &&
    !isAbsolute(value.slice(5)) && resolve(app, value.slice(5)) === destination;
  const manifest = readJson(join(app, 'package.json'));
  const lock = readJson(lockPath);
  const locked = lock.packages?.['node_modules/codeappscompact'];
  if (!specPointsHere(manifest.dependencies?.codeappscompact) ||
      !specPointsHere(lock.packages?.['']?.dependencies?.codeappscompact) ||
      !specPointsHere(locked?.resolved) || locked?.version !== version || locked?.link) {
    fail('Expected matching project-relative package and lockfile entries; inspect the dependency state.');
  }
  const installed = join(app, 'node_modules', 'codeappscompact');
  if (!samePackage(installed)) fail('Installed package differs from the bundled assets; nothing will be overwritten.');
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval',
    'import { RecordScreen } from "codeappscompact"; if (typeof RecordScreen !== "function") throw new Error("RecordScreen export is missing");'],
    { cwd: app, stdio: 'inherit' });
  if (result.error) fail(`Import check failed: ${result.error.message}`);
  if (result.status !== 0) fail('RecordScreen import failed; restore compatible app dependencies before continuing.');
}

function setup() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 18)) fail('Node.js 22.18 or newer is required.');
  if (process.argv.length !== 3) fail('Usage: node "<skill-folder>\\scripts\\setup.mjs" "<app-folder>"');
  noLinkedAncestors(resolve(process.argv[2]));
  const app = realpathSync(resolve(process.argv[2]));
  const manifest = readJson(join(app, 'package.json'));
  const lockPath = npmProject(app, manifest);
  const pkg = readJson(join(assets, 'package.json'));
  if (pkg.name !== 'codeappscompact' || pkg.private !== true || pkg.scripts ||
      !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(pkg.version)) fail('Invalid bundled package; reinstall the complete skill.');
  if (manifest.name === pkg.name) fail('Choose the consuming app, not the kit itself.');
  for (const path of ['theme.css', 'aggregate.css', 'dist/index.js', 'dist/index.d.ts', 'dist/aggregate.js', 'dist/aggregate.d.ts', 'dist/demo.js', 'dist/demo.d.ts', 'dist/host.js', 'dist/host.d.ts']) {
    if (!filesIn(assets).includes(join(...path.split('/')))) fail(`Missing bundled file: ${path}`);
  }
  const vendor = join(app, 'vendor');
  const destination = join(vendor, `codeappscompact-${pkg.version}`);
  const spec = `file:vendor/codeappscompact-${pkg.version}`;
  const declarations = dependencyGroups.filter(group => manifest[group]?.codeappscompact !== undefined);
  if (declarations.length && (declarations.length !== 1 || declarations[0] !== 'dependencies' ||
      manifest.dependencies.codeappscompact !== spec)) {
    fail('codeappscompact already has a different dependency declaration. Reuse or restore it; setup does not replace packages.');
  }
  if (existsSync(vendor)) regularDirectory(vendor);
  if (existsSync(destination) && !samePackage(destination)) fail('The vendor copy is modified or incomplete; inspect it before proceeding. Nothing was overwritten.');
  if (existsSync(join(app, 'node_modules'))) regularDirectory(join(app, 'node_modules'));
  const installed = join(app, 'node_modules', 'codeappscompact');
  if (existsSync(installed)) {
    if (!declarations.length) fail('Found an undeclared codeappscompact installation; inspect it before proceeding.');
    if (!existsSync(destination)) fail('The declared vendor package is missing; restore it with the app before continuing.');
    verify(app, destination, lockPath, pkg.version);
    console.log(`Reused codeappscompact ${pkg.version}; no files changed.`);
    return;
  }
  if (declarations.length) fail('codeappscompact is declared but missing. Restore the existing lockfile instead of reinstalling or upgrading.');
  const existingLock = existsSync(lockPath) ? readJson(lockPath) : undefined;
  if (existingLock?.packages?.['node_modules/codeappscompact']) fail('The lockfile already contains codeappscompact. Reconcile it with the manifest first.');
  for (const peer of Object.keys(pkg.peerDependencies)) {
    if (!['dependencies', 'devDependencies'].some(group => manifest[group]?.[peer]) ||
        !existsSync(join(app, 'node_modules', peer, 'package.json'))) {
      fail(`Restore or obtain approval to install the app peer ${peer} (${pkg.peerDependencies[peer]}) before setup.`);
    }
  }
  const npmVersion = npm(app, ['--version']);
  const pinnedVersion = manifest.packageManager?.slice(4).split('+')[0];
  if (pinnedVersion && pinnedVersion !== npmVersion) fail(`Use the app's pinned npm ${pinnedVersion}; found ${npmVersion}. No files were changed.`);
  if (!npmVersion || Number(npmVersion.split('.')[0]) < 9) fail('The setup helper needs an existing npm 9 or newer; no files were changed.');
  if (!existsSync(destination)) {
    if (!existsSync(vendor)) mkdirSync(vendor);
    cpSync(assets, destination, { recursive: true, errorOnExist: true, force: false });
  }
  npm(app, ['install', '--save-exact', '--install-links', '--ignore-scripts', '--strict-peer-deps', '--legacy-peer-deps=false', '--force=false', '--no-audit', '--no-fund', spec]);
  verify(app, destination, lockPath, pkg.version);
  console.log(`Installed codeappscompact ${pkg.version} from bundled assets. Keep vendor\\codeappscompact-${pkg.version}, including dist, with the app manifest and lockfile.`);
}

try {
  setup();
} catch (error) {
  console.error(`PowerCat-CodeAppsCompact setup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
