import { selectOptions } from './fields.js';
import { referenceLabel, referenceOptions } from './reference.js';
export function referenceBinding(rows, config) {
    const options = referenceOptions(rows, config);
    return { source: { options, emptyText: config.emptyText }, label: id => referenceLabel(options, id, config.emptyLabel) };
}
export function bindReferences(fields, bindings) {
    const mapped = new Map();
    for (const name of Object.keys(bindings)) {
        const binding = bindings[name];
        if (!binding || !fields.some(field => field.name === name))
            throw new Error(`Reference binding has no declared field: ${name}`);
        mapped.set(name, binding);
    }
    return fields.map(field => {
        const binding = mapped.get(field.name);
        return binding ? { ...field, kind: 'reference', options: undefined, reference: binding.source } : field;
    });
}
export function columnsFor() {
    return function column(id, header, value, render) {
        if (!id.trim() || !header.trim())
            throw new Error('Sortable columns require a nonempty ID and header.');
        return { id, header, sortValue: value, render: row => render ? render(value(row), row) : value(row) };
    };
}
export function selectFilter(fields, name, label) {
    const field = fields.find(item => item.name === name);
    if (!field || field.kind !== 'select' || !field.options)
        throw new Error(`Filter requires a declared select field with options: ${name}`);
    const options = selectOptions(field);
    return { id: name, label: label ?? `Filter by ${field.label.toLocaleLowerCase()}`, options, matches: (row, value) => String(row[name]) === value };
}
