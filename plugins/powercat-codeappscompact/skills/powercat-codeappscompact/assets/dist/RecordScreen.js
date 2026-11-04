import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkConfiguration, checkDraft, DataError, errorMessage, fieldErrorsFrom, formValues, normalize, requireSuccess, selectOptions } from './fields.js';
import { ReferenceField } from './reference.js';
import { applyLocalView, checkView, queryCapabilities } from './query.js';
async function readPage(service, request, unpaged) {
    const result = await service.getAll(Object.keys(request).length ? request : undefined);
    requireSuccess(result);
    if (!Array.isArray(result.data))
        throw new Error('getAll succeeded but data is not an array.');
    const token = 'skipToken' in result ? result.skipToken : undefined;
    if (token != null && typeof token !== 'string')
        throw new Error('getAll returned an invalid skipToken.');
    if (unpaged && token)
        throw new Error('An unpaged collection returned a continuation token. Use cursor capabilities and loaded search scope.');
    return { rows: result.data, skipToken: typeof token === 'string' && token ? token : undefined };
}
export function RecordScreen(props) {
    const { title, queryKey, service, fields, columns, defaults, getId, toDraft, searchText, searchScope = 'loaded', onFormStateChange, filters = [] } = props;
    checkConfiguration(defaults, fields);
    const capabilities = queryCapabilities(service, props.capabilities, searchScope);
    checkView(columns, filters, capabilities);
    function freshValues() {
        const draft = props.createDefaults?.() ?? defaults;
        checkDraft(draft, defaults, 'Create defaults');
        return formValues(draft, fields);
    }
    const uid = React.useId();
    const client = useQueryClient();
    const [values, setValues] = React.useState(freshValues);
    const [baseline, setBaseline] = React.useState(values);
    const [editId, setEditId] = React.useState(null);
    const [fieldErrors, setFieldErrors] = React.useState(new Map());
    const [references, setReferences] = React.useState({});
    const [formError, setFormError] = React.useState(null);
    const [readError, setReadError] = React.useState(null);
    const [saved, setSaved] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [selected, setSelected] = React.useState({});
    const [sort, setSort] = React.useState(null);
    const writeLock = React.useRef(false);
    const form = React.useRef(null);
    const searchControl = React.useRef(null);
    const summary = React.useRef(null);
    const returnFocus = React.useRef(null);
    const pendingFocus = React.useRef(null);
    const dirty = Object.keys(baseline).some(key => values[key] !== baseline[key]);
    const remote = {};
    if (capabilities.search === 'remote')
        remote.search = search;
    if (capabilities.filtering === 'remote')
        remote.filters = selected;
    if (capabilities.sorting === 'remote' && sort)
        remote.sort = sort;
    const remoteEnabled = [capabilities.search, capabilities.filtering, capabilities.sorting].includes('remote');
    const query = useInfiniteQuery({
        queryKey: remoteEnabled ? [...queryKey, 'view', remote] : queryKey,
        initialPageParam: undefined,
        queryFn: ({ pageParam, signal }) => readPage(service, { ...remote, ...(pageParam ? { skipToken: pageParam } : {}), ...(remoteEnabled ? { signal } : {}) }, capabilities.pagination === 'none'),
        getNextPageParam: page => page.skipToken,
        retry: false, refetchOnWindowFocus: false, throwOnError: false,
    });
    React.useEffect(() => { setReadError(null); }, [query.dataUpdatedAt]);
    async function runRead(action) {
        setReadError(null);
        try {
            await action();
        }
        catch (error) {
            setReadError(errorMessage(error));
        }
    }
    function replaceForm(next, id) {
        setValues(next);
        setBaseline(next);
        setEditId(id);
        setFieldErrors(new Map());
        setFormError(null);
    }
    const mutation = useMutation({
        mutationFn: async ({ id, draft }) => {
            const result = id === null ? await service.create(draft) : await service.update(id, draft);
            requireSuccess(result);
        },
        retry: false, throwOnError: false,
        onSuccess: (_data, variables) => {
            pendingFocus.current = 'return';
            setSaved(true);
            replaceForm(variables.resetValues, null);
            // A refresh failure cannot undo or replay the committed write.
            void runRead(() => client.invalidateQueries({ queryKey }, { throwOnError: true }));
        },
        onError: error => { pendingFocus.current = 'errors'; setFieldErrors(fieldErrorsFrom(error)); },
        onSettled: () => { writeLock.current = false; },
    });
    const referenceState = React.useCallback((name, next) => {
        setReferences(previous => previous[name]?.pending === next.pending && previous[name]?.issue === next.issue ? previous : { ...previous, [name]: next });
    }, []);
    React.useLayoutEffect(() => { onFormStateChange?.({ dirty, saving: mutation.isPending }); }, [dirty, mutation.isPending, onFormStateChange]);
    React.useLayoutEffect(() => {
        const target = pendingFocus.current;
        if (!target || mutation.isPending)
            return;
        pendingFocus.current = null;
        if (target === 'errors') {
            const name = [...fieldErrors.keys()].find(key => fields.some(field => field.name === key));
            const control = name ? form.current?.elements.namedItem(name) : null;
            if (control instanceof HTMLElement)
                control.focus();
            else
                summary.current?.focus();
        }
        else if (target === 'return' && returnFocus.current?.isConnected && returnFocus.current.getClientRects().length > 0) {
            returnFocus.current.focus();
            returnFocus.current = null;
        }
        else if (target === 'return')
            searchControl.current?.focus();
        else
            form.current?.querySelector('[data-cc-part="control"]:not(:disabled)')?.focus();
    }, [values, editId, fieldErrors, formError, mutation.isError, mutation.isPending, fields]);
    function mayReplace() {
        if (writeLock.current)
            return false;
        try {
            return !dirty || window.confirm('Discard unsaved changes?');
        }
        catch (error) {
            setFormError(`Cannot confirm discarding changes: ${errorMessage(error)}`);
            return false;
        }
    }
    function edit(row, id, button) {
        if (!mayReplace())
            return;
        try {
            const draft = toDraft(row);
            checkDraft(draft, defaults, 'toDraft');
            const next = formValues(draft, fields);
            returnFocus.current = button;
            pendingFocus.current = 'editor';
            replaceForm(next, id);
            mutation.reset();
            setSaved(false);
        }
        catch (error) {
            setFormError(errorMessage(error));
        }
    }
    function cancel() {
        if (!mayReplace())
            return;
        try {
            const next = freshValues();
            pendingFocus.current = 'return';
            replaceForm(next, null);
            mutation.reset();
            setSaved(false);
        }
        catch (error) {
            setFormError(errorMessage(error));
        }
    }
    function submit(event) {
        event.preventDefault();
        if (writeLock.current)
            return;
        setSaved(false);
        setFormError(null);
        mutation.reset();
        try {
            const result = normalize(values, defaults, fields);
            for (const field of fields)
                if (field.kind === 'reference') {
                    const state = references[field.name];
                    if (!state || state.pending)
                        result.errors.set(field.name, `${field.label} is still being checked. Wait before saving.`);
                    else if (state.issue)
                        result.errors.set(field.name, state.issue);
                }
            setFieldErrors(result.errors);
            if (result.errors.size) {
                pendingFocus.current = 'errors';
                return;
            }
            const resetValues = freshValues();
            writeLock.current = true;
            mutation.mutate({ id: editId, draft: result.draft, resetValues });
        }
        catch (error) {
            writeLock.current = false;
            pendingFocus.current = 'errors';
            setFormError(errorMessage(error));
        }
    }
    const rows = [];
    const seen = new Set();
    for (const page of query.data?.pages ?? [])
        for (const row of page.rows) {
            const id = getId(row);
            if (typeof id !== 'string' || !id.trim())
                throw new Error('getId must return a nonempty stable string.');
            if (!seen.has(id)) {
                seen.add(id);
                rows.push(row);
            }
        }
    const visible = applyLocalView(rows, { search, searchText, filters, selected, columns, sort, capabilities });
    const readMessage = query.isError ? errorMessage(query.error) : readError;
    const writeMessage = formError ?? (mutation.isError ? errorMessage(mutation.error) : null);
    const Heading = props.headingLevel === 2 ? 'h2' : props.headingLevel === 3 ? 'h3' : 'h1';
    const FormHeading = props.headingLevel === 2 ? 'h3' : props.headingLevel === 3 ? 'h4' : 'h2';
    const complete = capabilities.pagination === 'none';
    const searchLabel = capabilities.search === 'remote' ? 'Search service records' : complete ? 'Search all records' : 'Search loaded records';
    function editButton(row) {
        const id = getId(row);
        const label = props.getLabel?.(row) ?? id;
        if (!label.trim())
            throw new Error('getLabel must return a nonempty record label.');
        return _jsx("button", { "data-cc-part": "edit", type: "button", "aria-label": `Edit ${label}`, disabled: mutation.isPending, onClick: event => edit(row, id, event.currentTarget), children: "Edit" });
    }
    function toggleSort(id) { setSort(previous => previous?.column === id ? previous.direction === 'asc' ? { column: id, direction: 'desc' } : null : { column: id, direction: 'asc' }); }
    function changeField(name, value) { setValues(previous => ({ ...previous, [name]: value })); setSaved(false); }
    return _jsxs("section", { "data-cc": "record-screen", "data-cc-mobile": props.mobileLayout ?? 'table', className: props.className, "aria-labelledby": `${uid}-title`, children: [_jsx(Heading, { "data-cc-part": "title", id: `${uid}-title`, children: title }), _jsxs("div", { "data-cc-part": "search", children: [_jsx("label", { htmlFor: `${uid}-search`, children: searchLabel }), _jsx("input", { ref: searchControl, id: `${uid}-search`, type: "search", value: search, "aria-describedby": `${uid}-search-help`, onChange: event => setSearch(event.currentTarget.value) }), _jsx("p", { "data-cc-part": "search-help", id: `${uid}-search-help`, children: capabilities.search === 'remote' ? 'Search is sent to the service. Additional matches may require Load more.' : complete ? 'Search covers the complete collection.' : 'Search is local to loaded records and makes no requests.' })] }), !!filters.length && _jsxs("div", { "data-cc-part": "filters", children: [filters.map((filter, index) => {
                        const options = selectOptions({ name: filter.id, options: filter.options });
                        const selectedValue = Object.hasOwn(selected, filter.id) ? selected[filter.id] : '';
                        return _jsxs("div", { children: [_jsx("label", { htmlFor: `${uid}-filter-${index}`, children: filter.label }), _jsxs("select", { id: `${uid}-filter-${index}`, value: selectedValue, onChange: event => { const value = event.currentTarget.value; setSelected(previous => ({ ...previous, [filter.id]: value })); }, children: [!options.some(option => option.value === '') && _jsx("option", { value: "", children: "All" }), options.map(option => _jsx("option", { value: option.value, disabled: Boolean(option.disabledReason), children: option.label }, option.value))] })] }, filter.id);
                    }), _jsx("small", { children: capabilities.filtering === 'remote' ? 'Filters are sent to the service.' : complete ? 'Filters cover all records.' : 'Filters cover loaded records only.' })] }), columns.some(column => column.sortValue) && _jsxs("div", { "data-cc-part": "sort-controls", children: [_jsx("label", { htmlFor: `${uid}-sort`, children: "Sort records" }), _jsxs("select", { id: `${uid}-sort`, value: sort?.column ?? '', onChange: event => setSort(event.currentTarget.value ? { column: event.currentTarget.value, direction: 'asc' } : null), children: [_jsx("option", { value: "", children: "Default order" }), columns.filter(column => column.sortValue).map(column => _jsx("option", { value: column.id, children: column.header }, column.id))] }), sort && _jsxs("button", { type: "button", onClick: () => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' }), children: ["Sort ", sort.direction === 'asc' ? 'descending' : 'ascending'] }), _jsx("small", { children: capabilities.sorting === 'remote' ? 'Sorting is performed by the service.' : complete ? 'Sorting covers all records.' : 'Sorting covers loaded records only.' })] }), query.isPending && _jsx("p", { "data-cc-part": "loading", role: "status", children: "Loading" }), query.isFetchingNextPage && _jsx("p", { "data-cc-part": "loading", role: "status", children: "Loading more" }), readMessage !== null && _jsxs("div", { "data-cc-part": "read-error", children: [_jsx("p", { role: "alert", children: readMessage }), !query.isFetchNextPageError && _jsx("button", { type: "button", disabled: query.isFetching, onClick: () => { void runRead(() => query.refetch({ throwOnError: true, cancelRefetch: false })); }, children: "Retry" })] }), _jsx("div", { "data-cc-part": "table-wrap", role: "region", "aria-label": `${title} records`, tabIndex: 0, children: _jsxs("table", { "data-cc-part": "table", "aria-labelledby": `${uid}-title`, children: [_jsx("thead", { children: _jsxs("tr", { children: [columns.map((column, index) => _jsx("th", { scope: "col", "aria-sort": column.sortValue ? sort?.column === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined, children: column.sortValue ? _jsx("button", { type: "button", "aria-label": `Sort by ${column.header}`, onClick: () => toggleSort(column.id), children: column.header }) : column.header }, column.id ?? index)), _jsx("th", { scope: "col", children: "Actions" })] }) }), _jsxs("tbody", { children: [visible.map(row => _jsxs("tr", { "data-cc-part": "row", children: [columns.map((column, index) => _jsx("td", { children: column.render(row) }, column.id ?? index)), _jsx("td", { children: editButton(row) })] }, getId(row))), query.data !== undefined && !visible.length && _jsx("tr", { children: _jsx("td", { colSpan: columns.length + 1, children: "No records" }) })] })] }) }), props.mobileLayout === 'cards' && _jsxs("ul", { "data-cc-part": "record-cards", "aria-label": `${title} cards`, children: [visible.map(row => _jsxs("li", { children: [_jsx("dl", { children: columns.map((column, index) => _jsxs("div", { children: [_jsx("dt", { children: column.header }), _jsx("dd", { children: column.render(row) })] }, column.id ?? index)) }), editButton(row)] }, getId(row))), query.data !== undefined && !visible.length && _jsx("li", { children: "No records" })] }), query.hasNextPage && _jsx("button", { "data-cc-part": "load-more", type: "button", disabled: query.isFetching, onClick: () => { void runRead(() => query.fetchNextPage({ throwOnError: true, cancelRefetch: false })); }, children: "Load more" }), _jsxs("form", { ref: form, "data-cc-part": "form", "data-cc-dirty": dirty, "data-cc-saving": mutation.isPending, noValidate: true, onSubmit: submit, "aria-label": editId === null ? 'Create record' : 'Edit record', children: [_jsx(FormHeading, { "data-cc-part": "form-title", children: editId === null ? 'Create record' : 'Edit record' }), (fieldErrors.size > 0 || writeMessage !== null) && _jsxs("div", { ref: summary, "data-cc-part": "error-summary", "data-cc-error-kind": fieldErrors.size ? 'validation' : mutation.error instanceof DataError ? mutation.error.kind : 'unknown', tabIndex: -1, role: "region", "aria-label": "Form errors", children: [writeMessage !== null && _jsx("p", { "data-cc-part": "form-error", role: "alert", children: writeMessage }), !!fieldErrors.size && _jsxs(_Fragment, { children: [_jsxs("p", { children: ["Review ", fieldErrors.size, " field", fieldErrors.size === 1 ? '' : 's', " before saving."] }), _jsx("ul", { children: [...fieldErrors].map(([name, message]) => _jsx("li", { children: _jsx("button", { type: "button", onClick: () => { const control = form.current?.elements.namedItem(name); if (control instanceof HTMLElement)
                                                    control.focus(); }, children: message }) }, name)) })] })] }), _jsx("div", { "data-cc-part": "fields", children: fields.map((field, index) => {
                            const id = `${uid}-field-${index}`;
                            const error = fieldErrors.get(field.name);
                            const helpText = [field.helpText, field.unit ? `Unit: ${field.unit}.` : undefined, field.kind === 'datetime-utc' ? 'UTC, not your device time zone. Saved as an ISO UTC timestamp.' : undefined].filter(Boolean).join(' ');
                            const helpId = helpText ? `${id}-help` : undefined;
                            const describedBy = [helpId, error === undefined ? undefined : `${id}-error`].filter(Boolean).join(' ') || undefined;
                            const controlProps = {
                                id, name: field.name, value: values[field.name], disabled: mutation.isPending,
                                'data-cc-part': 'control', 'aria-required': field.required === true, 'aria-invalid': error !== undefined,
                                'aria-describedby': describedBy,
                                onChange: (event) => changeField(field.name, event.currentTarget.value),
                            };
                            let control;
                            if (field.kind === 'reference' && field.reference)
                                control = _jsx(ReferenceField, { id: id, name: field.name, label: field.label, value: values[field.name], source: field.reference, disabled: mutation.isPending, required: field.required, invalid: error !== undefined, describedBy: describedBy, onChange: value => changeField(field.name, value), onStateChange: state => referenceState(field.name, state) });
                            else if (field.kind === 'select') {
                                const options = selectOptions(field);
                                control = _jsxs("select", { ...controlProps, children: [!options.some(option => option.value === controlProps.value) && _jsx("option", { value: controlProps.value, disabled: true, children: controlProps.value || 'Select an option' }), options.map(option => _jsxs("option", { value: option.value, disabled: Boolean(option.disabledReason), children: [option.label, option.disabledReason ? ` - ${option.disabledReason}` : ''] }, option.value))] });
                            }
                            else if (field.kind === 'textarea')
                                control = _jsx("textarea", { ...controlProps, rows: field.rows ?? 4, maxLength: field.maxLength });
                            else
                                control = _jsx("input", { ...controlProps, type: field.kind === 'datetime-utc' ? 'datetime-local' : field.kind, min: field.min, max: field.max, maxLength: field.maxLength, step: field.kind === 'number' ? field.step ?? (field.integer ? 1 : 'any') : field.kind === 'datetime-utc' ? 60 : undefined });
                            return _jsxs("div", { "data-cc-part": "field", "data-cc-kind": field.kind, children: [field.kind !== 'reference' && _jsx("label", { htmlFor: id, children: field.label }), control, helpId && _jsx("small", { id: helpId, children: helpText }), error !== undefined && _jsx("span", { "data-cc-part": "field-error", id: `${id}-error`, role: "alert", children: error })] }, field.name);
                        }) }), saved && _jsx("p", { "data-cc-part": "saved", role: "status", children: "Saved" }), _jsxs("div", { "data-cc-part": "actions", children: [_jsx("button", { "data-cc-part": "save", type: "submit", disabled: mutation.isPending, children: mutation.isPending ? 'Saving...' : 'Save' }), _jsx("button", { "data-cc-part": "cancel", type: "button", disabled: mutation.isPending, onClick: cancel, children: "Cancel" })] })] })] });
}
