import { isObject } from '../fields.js';
import { instant } from './date-policy.js';
function version(value) { if (!Number.isSafeInteger(value) || value < 1)
    throw new Error('Schema versions must be positive integers.'); }
function jsonData(value, seen = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)))
        return;
    if (typeof value !== 'object' || value === null || seen.has(value))
        throw new Error('Backup data must be finite, acyclic JSON data without undefined values.');
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
        throw new Error('Backup data must use plain JSON objects, not class instances.');
    seen.add(value);
    if (Array.isArray(value))
        for (const item of value)
            jsonData(item, seen);
    else {
        if (Reflect.ownKeys(value).length !== Object.keys(value).length)
            throw new Error('Backup objects must contain only enumerable string keys.');
        for (const item of Object.values(value))
            jsonData(item, seen);
    }
    seen.delete(value);
}
function envelope(text) {
    const value = JSON.parse(text);
    if (!isObject(value) || value.format !== 'codeappscompact-backup' || typeof value.schemaVersion !== 'number' || typeof value.exportedAtUtc !== 'string' || !Object.hasOwn(value, 'data'))
        throw new Error('Unrecognized backup format. No data was replaced.');
    version(value.schemaVersion);
    instant(value.exportedAtUtc);
    jsonData(value.data);
    return { format: 'codeappscompact-backup', schemaVersion: value.schemaVersion, exportedAtUtc: value.exportedAtUtc, data: value.data };
}
export function writeBackup(data, schemaVersion, now) {
    version(schemaVersion);
    jsonData(data);
    return JSON.stringify({ format: 'codeappscompact-backup', schemaVersion, exportedAtUtc: new Date(now()).toISOString(), data });
}
export function readBackup(text, expectedVersion, decode) {
    version(expectedVersion);
    const saved = envelope(text);
    if (saved.schemaVersion !== expectedVersion)
        throw new Error('Backup version differs. Use an explicit migration; existing data must not be reset.');
    return { ...saved, data: decode(structuredClone(saved.data)) };
}
export function migrateBackup(text, targetVersion, migrations, decode) {
    version(targetVersion);
    const saved = envelope(text);
    if (saved.schemaVersion > targetVersion)
        throw new Error('Backup downgrades are not supported.');
    const steps = new Map();
    for (const migration of migrations) {
        version(migration.from);
        version(migration.to);
        if (migration.to !== migration.from + 1 || steps.has(migration.from))
            throw new Error('Migrations require unique, consecutive version steps.');
        steps.set(migration.from, migration);
    }
    while (saved.schemaVersion < targetVersion) {
        const step = steps.get(saved.schemaVersion);
        if (!step)
            throw new Error(`Missing migration from schema ${saved.schemaVersion}.`);
        saved.data = step.migrate(structuredClone(saved.data));
        jsonData(saved.data);
        saved.schemaVersion = step.to;
    }
    return { ...saved, data: decode(structuredClone(saved.data)) };
}
