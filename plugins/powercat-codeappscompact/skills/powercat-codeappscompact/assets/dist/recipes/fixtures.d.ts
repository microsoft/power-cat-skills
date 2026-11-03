export declare function createFixtureTools({ seed, anchorUtc }: {
    seed: number;
    anchorUtc: string;
}): {
    random: () => number;
    pick: <T>(values: readonly T[]) => T;
    id(prefix: string, index: number): string;
    utc(offsetMinutes: number): string;
    reference<R>(rows: readonly R[], getId: (row: R) => string): string;
};
