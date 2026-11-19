import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { errorMessage, fieldErrorsFrom } from '../dist/fields.js';
import { useNavigationGuard } from '../dist/navigation.js';
const Errors = createContext(new Map());
function FieldFrame({ name, label, required, hint, children }) {
    const id = useId();
    const error = useContext(Errors).get(name);
    const description = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
    return _jsxs("div", { className: "cc-aggregate-field", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: id, children: label }), required && _jsx("span", { "aria-hidden": "true", children: " *" })] }), children({ id, name, 'aria-invalid': error ? true : undefined, 'aria-describedby': description }), hint && _jsx("small", { id: `${id}-hint`, children: hint }), error && _jsx("small", { id: `${id}-error`, className: "cc-aggregate-error", children: error })] });
}
export function FormField({ name, label, value, onChange, required, disabled, hint, type = 'text', multiline = false, step, min, max, maxLength }) {
    return _jsx(FieldFrame, { name: name, label: label, required: required, hint: hint, children: attributes => multiline
            ? _jsx("textarea", { ...attributes, value: value, required: required, disabled: disabled, maxLength: maxLength, rows: 3, onChange: event => onChange(event.target.value) })
            : _jsx("input", { ...attributes, type: type, value: value, required: required, disabled: disabled, step: step, min: min, max: max, maxLength: maxLength, onChange: event => onChange(event.target.value) }) });
}
export function FormSelect({ name, label, value, onChange, required, disabled, hint, options, empty = 'Choose...' }) {
    const missing = value !== '' && !options.some(option => option.value === value);
    return _jsx(FieldFrame, { name: name, label: label, required: required, hint: hint, children: attributes => _jsxs("select", { ...attributes, value: value, required: required, disabled: disabled, onChange: event => onChange(event.target.value), children: [empty !== false && _jsx("option", { value: "", children: empty }), missing && _jsxs("option", { value: value, children: ["Unavailable selection: ", value] }), options.map(option => _jsxs("option", { value: option.value, disabled: Boolean(option.disabledReason), children: [option.label, option.disabledReason ? ` (${option.disabledReason})` : ''] }, option.value))] }) });
}
export function FormChoice({ options, value, onChange, ...field }) {
    if (!options.length || options.some(option => option.value === '') || new Set(options.map(option => option.value)).size !== options.length) {
        throw new Error(`${field.label}: closed choices require nonempty, unique option values.`);
    }
    if (!options.some(option => option.value === value))
        throw new Error(`${field.label}: value must match a configured choice.`);
    return _jsx(FormSelect, { ...field, options: options, value: value, empty: false, onChange: next => {
            const option = options.find(item => item.value === next && !item.disabledReason);
            if (!option)
                throw new Error(`${field.label}: choose an enabled configured option.`);
            onChange(option.value);
        } });
}
function dialogTabStops(dialog) {
    const candidates = Array.from(dialog.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]')).filter(node => {
        const tabbable = node.tabIndex >= 0 || (node.isContentEditable && !node.hasAttribute('tabindex'));
        const visibility = getComputedStyle(node).visibility;
        return tabbable && node.closest('dialog') === dialog && !node.matches(':disabled') && !node.closest('[hidden], [inert]') && node.getClientRects().length > 0 && visibility !== 'hidden' && visibility !== 'collapse';
    });
    return candidates.filter(node => {
        if (!(node instanceof HTMLInputElement) || node.type !== 'radio' || !node.name)
            return true;
        const group = candidates.filter((item) => item instanceof HTMLInputElement && item.type === 'radio' && item.name === node.name && item.form === node.form);
        return node === (group.find(item => item === dialog.ownerDocument.activeElement) ?? group.find(item => item.checked) ?? group[0]);
    }).sort((left, right) => (left.tabIndex > 0 ? left.tabIndex : Number.MAX_SAFE_INTEGER) - (right.tabIndex > 0 ? right.tabIndex : Number.MAX_SAFE_INTEGER));
}
function containDialogFocus(event) {
    if (event.key !== 'Tab' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
        return;
    const dialog = event.currentTarget;
    if (!(event.target instanceof Element) || event.target.closest('dialog') !== dialog)
        return;
    const stops = dialogTabStops(dialog);
    const index = stops.findIndex(node => node === dialog.ownerDocument.activeElement);
    if (index < 0 || (event.shiftKey ? index === 0 : index === stops.length - 1)) {
        event.preventDefault();
        (event.shiftKey ? stops.at(-1) ?? dialog : stops[0] ?? dialog).focus();
    }
}
export function Modal({ title, children, onClose, busy = false }) {
    const dialog = useRef(null);
    const heading = useId();
    useEffect(() => {
        const node = dialog.current;
        const previous = document.activeElement;
        if (!node)
            return;
        node.showModal();
        return () => { node.close(); if (previous instanceof HTMLElement && previous.isConnected)
            previous.focus(); };
    }, []);
    useEffect(() => {
        const node = dialog.current;
        if (!node?.open)
            return;
        const active = node.ownerDocument.activeElement;
        if (!node.contains(active) || (active instanceof HTMLElement && (active.matches(':disabled') || active.closest('[hidden], [inert]') || active.getClientRects().length === 0 || ['hidden', 'collapse'].includes(getComputedStyle(active).visibility))))
            node.focus();
    });
    return _jsxs("dialog", { ref: dialog, tabIndex: -1, className: "cc-aggregate-dialog", "aria-labelledby": heading, onKeyDown: containDialogFocus, onCancel: event => { event.preventDefault(); if (!busy)
            onClose(); }, children: [_jsxs("header", { children: [_jsx("h2", { id: heading, children: title }), _jsx("button", { type: "button", disabled: busy, onClick: onClose, children: "Close" })] }), children] });
}
export function DraftDialog({ title, initial, children, onSave, onClose, submitLabel = 'Save', confirmSave, onFormStateChange }) {
    const [draft, setDraft] = useState(() => structuredClone(initial));
    const [baseline] = useState(() => JSON.stringify(initial));
    const [problem, setProblem] = useState('');
    const [errors, setErrors] = useState(new Map());
    const [saving, setSaving] = useState(false);
    const pending = useRef(false);
    const alert = useRef(null);
    const guard = useNavigationGuard();
    const dirty = JSON.stringify(draft) !== baseline;
    const notify = useRef(onFormStateChange);
    useEffect(() => { notify.current = onFormStateChange; guard.onFormStateChange({ dirty, saving }); onFormStateChange?.({ dirty, saving }); }, [dirty, saving, guard.onFormStateChange, onFormStateChange]);
    useEffect(() => () => { notify.current?.({ dirty: false, saving: false }); }, []);
    useEffect(() => { if (problem)
        alert.current?.focus(); }, [problem]);
    function close() {
        if (pending.current)
            return;
        guard.onFormStateChange({ dirty, saving });
        guard.requestNavigation(onClose);
    }
    async function submit(event) {
        event.preventDefault();
        if (pending.current)
            return;
        pending.current = true;
        setSaving(true);
        setProblem('');
        setErrors(new Map());
        let saved = false;
        try {
            const confirmation = confirmSave?.(draft);
            if (confirmation && !window.confirm(confirmation))
                return;
            await onSave(draft);
            saved = true;
        }
        catch (error) {
            setProblem(errorMessage(error));
            setErrors(fieldErrorsFrom(error));
        }
        finally {
            pending.current = false;
            setSaving(false);
        }
        if (saved) {
            guard.onFormStateChange({ dirty: false, saving: false });
            onFormStateChange?.({ dirty: false, saving: false });
            onClose();
        }
    }
    return _jsx(Modal, { title: title, onClose: close, busy: saving, children: _jsxs("form", { noValidate: true, onSubmit: submit, "aria-busy": saving, "data-cc-part": "form", children: [problem && _jsx("div", { role: "alert", tabIndex: -1, ref: alert, className: "cc-aggregate-error", children: problem }), guard.message && _jsx("p", { role: "alert", children: guard.message }), _jsxs("fieldset", { disabled: saving, children: [_jsx("legend", { className: "cc-aggregate-sr", children: "Record fields" }), _jsx(Errors.Provider, { value: errors, children: children(draft, setDraft) })] }), _jsxs("footer", { children: [_jsx("button", { type: "submit", disabled: saving, children: saving ? 'Saving...' : submitLabel }), _jsx("button", { type: "button", disabled: saving, onClick: close, children: "Cancel" })] })] }) });
}
