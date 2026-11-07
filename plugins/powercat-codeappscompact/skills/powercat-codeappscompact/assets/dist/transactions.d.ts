export type RevisionedState = {
    revision: string;
};
export type TransactionPorts = {
    storage: Pick<Storage, 'getItem' | 'setItem'>;
    lock: <T>(name: string, work: () => T) => Promise<T>;
    id: () => string;
    now: () => string;
};
export type ResetExpectation = {
    revision: string;
} | {
    raw: string | null;
};
export type TransactionRules<S extends RevisionedState, C, A, R extends {
    state: S;
}> = {
    seed: () => S;
    decode: (serialized: string) => S;
    reduce: (state: S, command: C, actor: A, now: string, id: string) => R;
};
export declare function browserTransactionPorts(): TransactionPorts;
export declare function createTransactionStore<S extends RevisionedState, C, A, R extends {
    state: S;
}>(key: string, rules: TransactionRules<S, C, A, R>, ports?: TransactionPorts): {
    load: () => Promise<S>;
    raw: () => string | null;
    commit: (expectedRevision: string, command: C, actor: A) => Promise<R>;
    reset: (expected: ResetExpectation) => Promise<S>;
};
