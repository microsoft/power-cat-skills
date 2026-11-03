import type { ReactNode } from 'react';
import type { CollectionFilter, Column, Field, FlatDraft, ReferenceSource, SortValue } from './contracts.js';
import { referenceOptions } from './reference.js';
type StringKey<T> = {
    [K in keyof T]-?: T[K] extends string ? K : never;
}[keyof T] & string;
export type ReferenceBinding = {
    source: ReferenceSource;
    label: (id: string) => string;
};
export declare function referenceBinding<R>(rows: readonly R[], config: Parameters<typeof referenceOptions<R>>[1] & {
    emptyText?: string;
    emptyLabel?: string;
}): ReferenceBinding;
export declare function bindReferences<D>(fields: readonly Field<D>[], bindings: Readonly<Partial<Record<StringKey<D>, ReferenceBinding>>>): readonly Field<D>[];
export declare function columnsFor<R>(): <V extends SortValue>(id: string, header: string, value: (row: R) => V, render?: (value: V, row: R) => ReactNode) => Column<R>;
export declare function selectFilter<D extends FlatDraft>(fields: readonly Field<D>[], name: Extract<keyof D, string>, label?: string): CollectionFilter<D>;
export {};
