import type { createTransactionStore, ResetExpectation, RevisionedState } from './transactions.js';
export type TransactionStore<S extends RevisionedState, C, A, R extends {
    state: S;
}> = ReturnType<typeof createTransactionStore<S, C, A, R>>;
export declare function useTransactionState<S extends RevisionedState, C, A, R extends {
    state: S;
}>(store: TransactionStore<S, C, A, R>, storageKey: string): {
    state: S | null;
    error: string;
    loading: boolean;
    saving: boolean;
    externalChange: number;
    reload: () => Promise<void>;
    commit: (expectedRevision: string, command: C, actor: A) => Promise<R>;
    reset: (expected: ResetExpectation) => Promise<S>;
};
