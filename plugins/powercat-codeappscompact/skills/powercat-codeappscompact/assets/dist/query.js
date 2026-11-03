import { selectOptions } from './fields.js';
export function queryCapabilities(service, declared, searchScope = 'loaded') {
    const result = declared ?? service.capabilities ?? { search: 'local', filtering: 'local', sorting: 'local', pagination: searchScope === 'all' ? 'none' : 'cursor' };
    if (![result.search, result.filtering, result.sorting].every(mode => mode === 'local' || mode === 'remote') || !['none', 'cursor'].includes(result.pagination))
        throw new Error('Invalid collection query capabilities.');
    if (searchScope === 'all' && result.pagination !== 'none')
        throw new Error('searchScope="all" requires an unpaged service. Use "loaded" for cursor paging.');
    return result;
}
export function checkView(columns, filters, capabilities) {
    const ids = new Set();
    for (const column of columns) {
        if (!column.header.trim() || (column.id !== undefined && (!column.id.trim() || ids.has(column.id))) || (column.sortValue && !column.id))
            throw new Error('Columns require labels and unique IDs for sorting.');
        if (column.id)
            ids.add(column.id);
    }
    ids.clear();
    for (const filter of filters) {
        if (!filter.id.trim() || !filter.label.trim() || ids.has(filter.id))
            throw new Error('Filters require unique IDs and labels.');
        if (capabilities.filtering === 'local' && !filter.matches)
            throw new Error(`Local filter "${filter.id}" requires matches(row, value).`);
        selectOptions({ name: filter.id, options: filter.options });
        ids.add(filter.id);
    }
}
function compare(a, b, direction) {
    for (const value of [a, b])
        if (value !== null && typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value)))
            throw new Error('Sort accessors must return a string, finite number or null.');
    if (a === null || b === null)
        return a === b ? 0 : a === null ? 1 : -1;
    if (typeof a !== typeof b)
        throw new Error('One column must use consistent non-null sort types.');
    const order = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true });
    return direction === 'asc' ? order : -order;
}
export function applyLocalView(rows, options) {
    let result = rows.filter(row => (options.capabilities.search !== 'local' || options.searchText(row).toLocaleLowerCase().includes(options.search.toLocaleLowerCase())) &&
        (options.capabilities.filtering !== 'local' || options.filters.every(filter => !Object.hasOwn(options.selected, filter.id) || !options.selected[filter.id] || filter.matches?.(row, options.selected[filter.id]))));
    if (options.sort && options.capabilities.sorting === 'local') {
        const { column, direction } = options.sort;
        const accessor = options.columns.find(item => item.id === column)?.sortValue;
        if (!accessor)
            throw new Error(`Unknown sortable column: ${column}`);
        result = result.map((row, index) => ({ row, index, value: accessor(row) })).sort((a, b) => compare(a.value, b.value, direction) || a.index - b.index).map(item => item.row);
    }
    return result;
}
