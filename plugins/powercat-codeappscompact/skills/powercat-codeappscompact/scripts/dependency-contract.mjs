import { isAbsolute, join, relative, resolve } from 'node:path';
import { args, cli, exists, isMain, noLinkedAncestors, readJson } from './lib.mjs';

const ordered = value => JSON.stringify(Object.entries(value ?? {}).sort(([a], [b]) => a.localeCompare(b)));

export function checkDependencyLock(pkg, vendor, lock) {
  const root = lock.packages?.[''];
  if (![2, 3].includes(lock.lockfileVersion) || !root) throw new Error('Expected an npm v2/v3 lockfile with root package metadata.');
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    if (ordered(root[key]) !== ordered(pkg[key])) throw new Error(`Stale lockfile ${key}: regenerate the lock from this app manifest before restoring dependencies; do not copy another release lock unchanged.`);
  }
  if (vendor) {
    const entry = lock.packages['node_modules/codeappscompact'];
    if (!entry || entry.resolved !== pkg.dependencies.codeappscompact || entry.version !== vendor.version || entry.link || (entry.name !== undefined && entry.name !== vendor.name)) throw new Error('Stale runtime lock: expected the current local vendor version and a non-link resolved entry. Regenerate the lock with npm --install-links before restoring dependencies.');
    for (const key of ['dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta']) {
      if (ordered(entry[key]) !== ordered(vendor[key])) throw new Error(`Stale runtime lock ${key}: regenerate the lock from the current vendor package before restore.`);
    }
  }
}

export function checkDependencies(appPath, { requireLock = false, installed = false, lockPath } = {}) {
  const app = resolve(appPath); noLinkedAncestors(app);
  const pkg = readJson(join(app, 'package.json'));
  const spec = pkg.dependencies?.codeappscompact;
  if (typeof spec !== 'string' || !spec.trim()) throw new Error('codeappscompact must be an explicit app dependency.');
  let vendor;
  if (spec.startsWith('file:')) {
    const target = resolve(app, spec.slice(5)); const inside = relative(app, target);
    if (!inside || isAbsolute(spec.slice(5)) || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Vendor dependencies must stay project-relative and inside the app.');
    noLinkedAncestors(target); vendor = readJson(join(target, 'package.json'));
    if (vendor.name !== 'codeappscompact' || typeof vendor.version !== 'string' || !vendor.version) throw new Error('Expected a versioned codeappscompact vendor package.');
  }
  const file = resolve(lockPath ?? join(app, 'package-lock.json')); noLinkedAncestors(file);
  const hasLock = exists(file);
  if (!hasLock && (requireLock || lockPath)) throw new Error('A matching package-lock.json is required before a locked restore or verification.');
  if (hasLock) checkDependencyLock(pkg, vendor, readJson(file));
  let actual;
  if (installed) {
    actual = readJson(join(app, 'node_modules', 'codeappscompact', 'package.json'));
    if (actual.name !== 'codeappscompact' || (vendor && actual.version !== vendor.version)) throw new Error('The installed kit differs from the vendor package. Restore the validated lockfile.');
  }
  return { version: vendor?.version ?? actual?.version ?? null, dependency: spec, lockfile: hasLock ? 'matched' : 'absent; npm install must create it before verification', installed: installed ? 'matched' : 'not checked' };
}

if (isMain(import.meta.url)) await cli(() => {
  const { options, positional } = args(process.argv.slice(2), ['require-lock', 'installed'], ['require-lock', 'installed']);
  if (positional.length !== 1) throw new Error('Usage: node dependency-contract.mjs <app-folder> [--require-lock] [--installed]. Read-only; no restore or installation.');
  console.log(JSON.stringify(checkDependencies(positional[0], { requireLock: Boolean(options['require-lock']), installed: Boolean(options.installed) }), null, 2));
});
