import type { DataService, Field, FlatDraft } from './contracts.js';
import type { WorkspaceChange } from './collections.js';
export type RevisionDraft = FlatDraft & {
    revision: number;
};
export type DemoState<D extends Record<string, RevisionDraft>> = {
    [K in keyof D]: Array<D[K] & {
        id: string;
    }>;
};
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export type Serialize = <T>(work: () => T) => Promise<T>;
export type DemoMutation<D extends Record<string, RevisionDraft>> = {
    collection: Extract<keyof D, string>;
    operation: 'create' | 'update';
    id: string;
    previous: DemoState<D>;
    next: DemoState<D>;
};
export type DemoOptions<D extends Record<string, RevisionDraft>> = {
    key: string;
    schemaVersion: number;
    defaults: D;
    seed: () => DemoState<D>;
    fields?: {
        [K in keyof D]?: readonly Field<D[K]>[];
    };
    validate?: (next: DemoState<D>, previous: DemoState<D> | null) => void;
    validateMutation?: (mutation: DemoMutation<D>) => void;
    storage?: () => StoragePort;
    serialize?: Serialize;
    newId?: () => string;
};
export declare function createDemoRepository<D extends Record<string, RevisionDraft>>(options: DemoOptions<D>): {
    read: () => Promise<DemoState<D>>;
    service: <K extends Extract<keyof D, string>>(kind: K) => DataService<D[K] & {
        id: string;
    }, D[K]>;
    subscribe(listener: (change: WorkspaceChange) => void): () => void;
    project<K extends Extract<keyof D, string>>(kind: K): (row: unknown) => D[K];
};
