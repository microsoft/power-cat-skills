import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { applyLocalView, checkView } from '../dist/query.js';
import { errorMessage } from '../dist/fields.js';
import { downloadCsv, toCsv } from './csv.js';
export default function DataTable(props) {
    // Only a definition/drill-down change resets the view; live rows and open drafts do not.
    const definition = JSON.stringify([props.title, props.columns.map(c => c.key), props.filters?.map(f => f.key), props.initialFilters ?? {}]);
    return _jsx(TableState, { ...props }, definition);
}
function TableState({ title, rows, columns, filters = [], initialFilters = {}, onOpen, onAdd, addLabel, selected, onSelect, alternate }) {
    const heading = useId();
    const [exportError, setExportError] = useState('');
    const [query, setQuery] = useState('');
    const [values, setValues] = useState(initialFilters);
    const [sort, setSort] = useState(columns[0]?.key ?? '');
    const [direction, setDirection] = useState('asc');
    const [page, setPage] = useState(0);
    if (!columns.length)
        throw new Error('DataTable needs at least one labelled column.');
    const capabilities = { search: 'local', filtering: 'local', sorting: 'local', pagination: 'none' };
    const queryColumns = columns.map(column => ({ id: column.key, header: column.label, render: (row) => row.values[column.key], sortValue: (row) => row.values[column.key] }));
    const queryFilters = filters.map(filter => ({ ...filter, id: filter.key }));
    checkView(queryColumns, queryFilters, capabilities);
    const filtered = applyLocalView(rows, {
        search: query.trim().replace(/\s+/g, ' '), searchText: row => `${row.label} ${row.search ?? ''} ${Object.values(row.values).join(' ')}`.replace(/\s+/g, ' '),
        filters: queryFilters, selected: values, columns: queryColumns, sort: { column: sort, direction }, capabilities,
    });
    function exportRows() {
        setExportError('');
        try {
            downloadCsv(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, toCsv(columns.map(c => c.key), filtered.map(row => columns.map(c => row.values[c.key]))));
        }
        catch (error) {
            setExportError(`CSV export failed: ${errorMessage(error)}`);
        }
    }
    const pages = Math.max(1, Math.ceil(filtered.length / 10));
    const current = Math.min(page, pages - 1);
    const visible = filtered.slice(current * 10, current * 10 + 10);
    return _jsxs("section", { "data-cc": "data-table", className: "data-section", "aria-labelledby": heading, children: [_jsxs("div", { className: "section-heading", children: [_jsx("h2", { id: heading, children: title }), _jsxs("div", { className: "actions", children: [onAdd && _jsx("button", { type: "button", className: "primary", onClick: onAdd, children: addLabel ?? `Add ${title}` }), _jsxs("button", { type: "button", onClick: exportRows, children: ["Export ", title, " CSV"] })] })] }), exportError && _jsx("p", { role: "alert", children: exportError }), _jsxs("div", { className: "table-tools", children: [_jsxs("label", { children: ["Search ", title, _jsx("input", { type: "search", value: query, onChange: event => { setQuery(event.target.value); setPage(0); } })] }), filters.map(filter => _jsxs("label", { children: [filter.label, _jsxs("select", { "aria-label": filter.label, value: values[filter.key] ?? '', onChange: event => { setValues({ ...values, [filter.key]: event.target.value }); setPage(0); }, children: [_jsx("option", { value: "", children: "All" }), filter.options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value))] })] }, filter.key)), _jsxs("label", { children: ["Sort ", title, _jsx("select", { "aria-label": `Sort ${title}`, value: sort, onChange: event => { setSort(event.target.value); setPage(0); }, children: columns.map(column => _jsx("option", { value: column.key, children: column.label }, column.key)) })] }), _jsxs("label", { children: ["Sort direction for ", title, _jsxs("select", { "aria-label": `Sort direction for ${title}`, value: direction, onChange: event => { setDirection(event.target.value === 'desc' ? 'desc' : 'asc'); setPage(0); }, children: [_jsx("option", { value: "asc", children: "Ascending" }), _jsx("option", { value: "desc", children: "Descending" })] })] })] }), _jsxs("p", { className: "muted", role: "status", children: [filtered.length, " matching records", alternate ? '' : `; page ${current + 1} of ${pages}`] }), !filtered.length ? _jsxs("p", { className: "empty", children: ["No matching records. Adjust the filters", onAdd ? ' or add a record' : '', "."] }) : alternate ? alternate(filtered) : _jsx("div", { className: "table-scroll", tabIndex: 0, role: "region", "aria-label": `${title} records`, children: _jsxs("table", { children: [_jsx("caption", { className: "sr-only", children: title }), _jsx("thead", { children: _jsxs("tr", { children: [onSelect && _jsx("th", { scope: "col", children: "Select" }), columns.map(column => _jsx("th", { scope: "col", "aria-sort": sort === column.key ? direction === 'asc' ? 'ascending' : 'descending' : 'none', children: column.label }, column.key)), onOpen && _jsx("th", { scope: "col", children: "Details" })] }) }), _jsx("tbody", { children: visible.map(row => _jsxs("tr", { children: [onSelect && _jsx("td", { children: _jsx("input", { type: "checkbox", "aria-label": `Select ${row.label}`, checked: selected?.includes(row.id) ?? false, onChange: event => onSelect(event.target.checked ? [...(selected ?? []), row.id] : (selected ?? []).filter(id => id !== row.id)) }) }), columns.map(column => _jsx("td", { children: column.format ? column.format(row.values[column.key]) : row.values[column.key] }, column.key)), onOpen && _jsx("td", { children: _jsx("button", { type: "button", "aria-label": `Open ${row.label}`, onClick: () => onOpen(row.id), children: "Open" }) })] }, row.id)) })] }) }), !alternate && _jsxs("div", { className: "pagination", children: [_jsxs("button", { type: "button", disabled: current === 0, onClick: () => setPage(current - 1), children: ["Previous ", title, " page"] }), _jsxs("span", { children: ["Page ", current + 1, " of ", pages] }), _jsxs("button", { type: "button", disabled: current >= pages - 1, onClick: () => setPage(current + 1), children: ["Next ", title, " page"] })] })] });
}
