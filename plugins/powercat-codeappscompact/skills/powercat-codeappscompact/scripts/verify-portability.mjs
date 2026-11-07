import { join, relative, resolve } from 'node:path';
import { args, cli, copyTree, isMain, readJson, runNpm } from './lib.mjs';
import { preflight } from './preflight.mjs';

export async function verifyPortability(app, destination) {
  const rel = relative(app, destination);
  if (rel === '' || (!rel.startsWith('..') && !rel.includes(':'))) throw new Error('The clean-restore destination must be outside the source app.');
  readJson(join(app, 'package-lock.json'));
  copyTree(app, destination, new Set(['node_modules', 'dist', '.git', 'evidence']));
  runNpm(destination, ['ci', '--install-links', '--ignore-scripts', '--strict-peer-deps', '--legacy-peer-deps=false', '--force=false', '--no-audit', '--no-fund'], join(destination, 'evidence', 'restore.log'));
  await preflight(destination, false, { localOnly: true });
  runNpm(destination, ['run', 'build', '--silent'], join(destination, 'evidence', 'build.log'));
  return { cleanRestore: true, destination, skillFolderDependency: false, note: 'The explicitly created restore copy is retained; inspect and remove only that copy when no longer needed.' };
}
if (isMain(import.meta.url)) await cli(async () => {
  const { options, positional } = args(process.argv.slice(2), ['destination']);
  if (positional.length !== 1 || !options.destination) throw new Error('Usage: node verify-portability.mjs <app-folder> --destination <new-isolated-folder>');
  console.log(JSON.stringify(await verifyPortability(resolve(positional[0]), resolve(options.destination)), null, 2));
});
