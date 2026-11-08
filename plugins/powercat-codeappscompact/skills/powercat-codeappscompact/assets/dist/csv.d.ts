export declare function parseCsv(input: string): string[][];
export declare function toCsv(headers: readonly string[], rows: readonly (readonly (string | number)[])[]): string;
export declare function downloadCsv(name: string, text: string): void;
