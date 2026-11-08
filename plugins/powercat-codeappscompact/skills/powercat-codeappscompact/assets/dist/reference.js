import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { checkOptions, errorMessage } from './fields.js';
export function referenceOptions(rows, config) {
    return checkOptions(rows.map(row => ({ value: config.getId(row), label: config.getLabel(row), disabledReason: config.disabledReason?.(row) })));
}
export function referenceLabel(options, value, emptyLabel = 'None') {
    return value === '' ? emptyLabel : options.find(option => option.value === value)?.label ?? `Missing reference (${value})`;
}
export function ReferenceField({ id, name, label, value, source, onChange, disabled, required, invalid, describedBy, onStateChange }) {
    const [search, setSearch] = useState('');
    const [result, setResult] = useState({ query: '', options: [], pending: true, error: null });
    const [selection, setSelection] = useState({ value: '', option: null, pending: true, error: null });
    const [attempt, setAttempt] = useState(0);
    const callback = useRef(onStateChange);
    useLayoutEffect(() => { callback.current = onStateChange; });
    const load = source.loadOptions;
    const resolve = source.resolveOption;
    useEffect(() => {
        if (!load)
            return;
        const controller = new AbortController();
        setResult({ query: search, options: [], pending: true, error: null });
        void Promise.resolve().then(() => load(search, controller.signal)).then(options => {
            checkOptions(options);
            if (!controller.signal.aborted)
                setResult({ query: search, options, pending: false, error: null });
        }).catch(error => {
            if (!controller.signal.aborted)
                setResult({ query: search, options: [], pending: false, error: errorMessage(error) });
        });
        return () => controller.abort();
    }, [load, search, attempt]);
    useEffect(() => {
        if (!resolve || !value)
            return;
        const controller = new AbortController();
        setSelection({ value, option: null, pending: true, error: null });
        void Promise.resolve().then(() => resolve(value, controller.signal)).then(option => {
            if (option) {
                checkOptions([option]);
                if (option.value !== value)
                    throw new Error('Reference resolver returned a different record.');
            }
            if (!controller.signal.aborted)
                setSelection({ value, option, pending: false, error: null });
        }).catch(error => {
            if (!controller.signal.aborted)
                setSelection({ value, option: null, pending: false, error: errorMessage(error) });
        });
        return () => controller.abort();
    }, [resolve, value, attempt]);
    const local = source.options;
    if (local)
        checkOptions(local);
    const options = local ? local.filter(option => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase())) : result.options;
    const selected = local ? local.find(option => option.value === value) : selection.value === value ? selection.option : null;
    const pending = !local && (result.pending || result.query !== search || Boolean(value && (selection.pending || selection.value !== value)));
    const failure = local ? null : result.error ?? (value ? selection.error : null);
    const issue = failure ? `${label} lookup failed: ${failure}` : pending ? null : value && !selected ? `${label} references a missing record (${value}).` : selected?.disabledReason ? `${label} is unavailable: ${selected.disabledReason}` : null;
    useLayoutEffect(() => { callback.current?.({ pending, issue }); }, [pending, issue]);
    const displayed = selected && !options.some(option => option.value === selected.value) ? [selected, ...options] : options;
    const help = `${id}-lookup-help`;
    const status = `${id}-lookup-status`;
    return _jsxs("div", { "data-cc": "reference", children: [_jsxs("label", { htmlFor: `${id}-search`, children: ["Find ", label] }), _jsx("input", { id: `${id}-search`, type: "search", value: search, disabled: disabled, onChange: event => setSearch(event.currentTarget.value), "aria-describedby": help }), _jsx("small", { id: help, children: local ? 'Search reference labels; the stored value remains an ID.' : 'Search requests matching options from the service; the selected ID is resolved separately.' }), _jsx("label", { htmlFor: id, children: label }), _jsxs("select", { id: id, name: name, "data-cc-part": "control", value: value, disabled: disabled || pending, "aria-required": required === true, "aria-invalid": Boolean(invalid || issue), "aria-describedby": [describedBy, status].filter(Boolean).join(' '), onChange: event => onChange(event.currentTarget.value), children: [_jsx("option", { value: "", children: required ? 'Select a record' : 'None' }), value && !selected && _jsx("option", { value: value, disabled: true, children: pending ? 'Resolving selected record...' : `Missing reference (${value})` }), displayed.filter(option => option.value !== '').map(option => _jsxs("option", { value: option.value, disabled: Boolean(option.disabledReason), children: [option.label, option.disabledReason ? ` - unavailable: ${option.disabledReason}` : ''] }, option.value))] }), _jsx("small", { id: status, role: issue ? 'alert' : 'status', children: issue ?? (pending ? 'Loading references...' : options.length ? `${options.length} matching options.` : source.emptyText ?? 'No matching records. Create an eligible record or change the search.') }), failure && _jsxs("button", { type: "button", disabled: disabled, onClick: () => setAttempt(value => value + 1), children: ["Retry ", label, " lookup"] })] });
}
