import type { Field, FlatDraft, ReferenceOption, SelectOption } from './contracts.js';
export type DataErrorKind = 'validation' | 'storage' | 'network' | 'conflict' | 'authorization' | 'unknown';
export type FieldErrors<D> = Partial<Record<Extract<keyof D, string>, string>>;
export declare class DataError extends Error {
    readonly kind: DataErrorKind;
    constructor(kind: DataErrorKind, message: string, options?: ErrorOptions);
}
export declare class ValidationError<D extends FlatDraft = FlatDraft> extends DataError {
    readonly fieldErrors: Readonly<FieldErrors<D>>;
    constructor(errors: FieldErrors<D>, message?: string);
}
export declare function errorMessage(error: unknown): string;
export declare function isObject(value: unknown): value is Record<string, unknown>;
export declare function fieldErrorsFrom(error: unknown): Map<string, string>;
export declare function requireSuccess(result: unknown): asserts result is {
    success: true;
    data?: unknown;
};
export declare function assertFlat(value: unknown, label: string): asserts value is FlatDraft;
export declare function checkDraft<D extends FlatDraft>(value: unknown, defaults: D, label?: string): asserts value is D;
export declare function projectDraft<D extends FlatDraft>(defaults: D): (row: unknown) => D;
export declare const fieldPresets: {
    readonly name: {
        readonly kind: "text";
        readonly required: true;
        readonly maxLength: 80;
    };
    readonly notes: {
        readonly kind: "textarea";
        readonly maxLength: 2000;
        readonly rows: 4;
    };
    readonly percentage: {
        readonly kind: "number";
        readonly required: true;
        readonly min: 0;
        readonly max: 100;
    };
    readonly integer: {
        readonly kind: "number";
        readonly required: true;
        readonly integer: true;
        readonly step: 1;
    };
    readonly utc: {
        readonly kind: "datetime-utc";
        readonly required: true;
    };
};
export declare function utcFromInput(value: string): string;
export declare function utcToInput(value: string): string;
export declare function checkOptions(options: readonly ReferenceOption[], label?: string): readonly ReferenceOption[];
export declare function selectOptions(field: {
    name: string;
    options?: readonly SelectOption[];
}): readonly ReferenceOption[];
export declare function checkConfiguration<D extends FlatDraft>(defaults: D, fields: readonly Field<D>[]): void;
export declare function validateDraft<D extends FlatDraft>(draft: D, defaults: D, fields: readonly Field<D>[]): Map<string, string>;
export declare function assertValidDraft<D extends FlatDraft>(draft: D, defaults: D, fields: readonly Field<D>[]): void;
export declare function formValues<D extends FlatDraft>(draft: D, fields: readonly Field<D>[]): Record<string, string>;
export declare function normalize<D extends FlatDraft>(values: Record<string, string>, defaults: D, fields: readonly Field<D>[]): {
    draft: D;
    errors: Map<string, string>;
};
