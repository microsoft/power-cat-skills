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
    return _jsxs("dialog", { ref: dialog, className: "cc-aggregate-dialog", "aria-labelledby": heading, onCancel: event => { event.preventDefault(); if (!busy)
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
