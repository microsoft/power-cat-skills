import type { FlatDraft } from '../contracts.js';
import type { FieldErrors } from '../fields.js';
export type ConditionalRule<D> = {
    when: (draft: D) => boolean;
    check: (draft: D) => boolean;
    field: Extract<keyof D, string>;
    message: string;
};
export declare function conditionalErrors<D extends FlatDraft>(draft: D, rules: readonly ConditionalRule<D>[]): FieldErrors<D>;
export declare function assertConditions<D extends FlatDraft>(draft: D, rules: readonly ConditionalRule<D>[]): void;
