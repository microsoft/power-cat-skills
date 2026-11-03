import type { CollectionFilter, Column, DataService, QueryCapabilities, SortState } from './contracts.js';
export declare function queryCapabilities<R, D>(service: DataService<R, D>, declared?: QueryCapabilities, searchScope?: 'loaded' | 'all'): QueryCapabilities;
export declare function checkView<R>(columns: readonly Column<R>[], filters: readonly CollectionFilter<R>[], capabilities: QueryCapabilities): void;
export declare function applyLocalView<R>(rows: readonly R[], options: {
    search: string;
    searchText: (row: R) => string;
    filters: readonly CollectionFilter<R>[];
    selected: Readonly<Record<string, string>>;
    columns: readonly Column<R>[];
    sort: SortState | null;
    capabilities: QueryCapabilities;
}): R[];
