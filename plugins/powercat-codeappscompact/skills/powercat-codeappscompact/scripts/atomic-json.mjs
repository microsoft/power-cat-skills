import { renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { noLinkedAncestors, writeJson } from './lib.mjs';

export function writeAtomicJson(path, value, { rename = renameSync, wait = milliseconds => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds) } = {}) {
  noLinkedAncestors(path);
  const temporary = join(dirname(path), `state-${randomUUID()}.tmp`);
  writeJson(temporary, value);
  let retries = 0;
  try {
    for (;;) {
      try { rename(temporary, path); return retries; }
      catch (error) {
        if (process.platform !== 'win32' || !['EPERM', 'EBUSY'].includes(error.code) || retries >= 6) throw error;
        // Windows indexers/sync clients can briefly hold a non-share-delete handle.
        wait(25 * 2 ** retries++);
      }
    }
  } catch (error) {
    try { unlinkSync(temporary); }
    catch (cleanup) { throw new AggregateError([error, cleanup], `Checkpoint replacement and cleanup failed; the prior checkpoint was not deleted: ${path}`); }
    throw new Error(`Atomic checkpoint replacement failed after ${retries} bounded retries; prior evidence was preserved: ${path}. ${error.message}`, { cause: error });
  }
}
