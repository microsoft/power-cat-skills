export declare function assertTransition<S extends string>(previous: S, next: S, transitions: Readonly<Record<S, readonly S[]>>, field?: string): void;
