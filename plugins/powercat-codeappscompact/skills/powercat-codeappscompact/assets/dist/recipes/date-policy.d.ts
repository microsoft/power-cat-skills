export declare function instant(value: string): number;
export declare function assertFutureDate(value: string, options: {
    now: () => number;
    field: string;
    previousValue?: string;
    enforceUnchanged?: boolean;
}): void;
export declare function assertDateRange(start: string, end: string, options: {
    endField: string;
    minDurationMs?: number;
    maxDurationMs?: number;
}): void;
