export type Backup<T> = {
    format: 'codeappscompact-backup';
    schemaVersion: number;
    exportedAtUtc: string;
    data: T;
};
export type Migration = {
    from: number;
    to: number;
    migrate: (data: unknown) => unknown;
};
export declare function writeBackup<T>(data: T, schemaVersion: number, now: () => number): string;
export declare function readBackup<T>(text: string, expectedVersion: number, decode: (data: unknown) => T): Backup<T>;
export declare function migrateBackup<T>(text: string, targetVersion: number, migrations: readonly Migration[], decode: (data: unknown) => T): Backup<T>;
