import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import DataTable from './DataTable.js';
import { DraftDialog } from './DraftDialog.js';
export function RecordFlow({ title, records, revision, toRow, columns, filters, initialFilters, selected: selectedRows, onSelect, alternate, toolbar, createDraft, editDraft, details, children, onSave, addLabel = 'Add record', editLabel = 'Edit', canEdit, confirmSave, onFormStateChange }) {
    const [selectedId, setSelectedId] = useState(null);
    const [editor, setEditor] = useState(null);
    const [notice, setNotice] = useState('');
    const sequence = useRef(0);
    const list = useRef(null);
    const heading = useRef(null);
    const returnFocus = useRef(null);
    const headingId = useId();
    const indexed = records.map(record => ({ record, row: toRow(record) }));
    const selected = indexed.find(item => item.row.id === selectedId);
    useEffect(() => {
        if (selectedId !== null)
            heading.current?.focus();
        else if (returnFocus.current) {
            if (returnFocus.current.isConnected)
                returnFocus.current.focus();
            else
                list.current?.focus();
            returnFocus.current = null;
        }
    }, [selectedId]);
    function openDetails(id) {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setNotice('');
        setSelectedId(id);
    }
    function openEditor(record) {
        setNotice('');
        setEditor({
            id: record?.row.id, revision, key: ++sequence.current,
            initial: record ? editDraft(record.record) : createDraft(),
            title: record ? `Edit ${record.row.label}` : addLabel,
        });
    }
    return _jsxs("div", { "data-cc": "record-flow", children: [notice && _jsx("p", { role: "status", "data-cc-part": "saved", children: notice }), _jsxs("div", { ref: list, tabIndex: -1, role: "region", "aria-label": `${title} list`, hidden: selectedId !== null, children: [toolbar, _jsx(DataTable, { title: title, rows: indexed.map(item => item.row), columns: columns, filters: filters, initialFilters: initialFilters, onAdd: () => openEditor(), addLabel: addLabel, onOpen: openDetails, selected: selectedRows, onSelect: onSelect, alternate: alternate ? rows => alternate(rows, openDetails) : undefined })] }), selectedId !== null && _jsxs("section", { className: "cc-record-details", "data-cc-part": "record-details", "aria-labelledby": headingId, children: [_jsx("h2", { id: headingId, ref: heading, tabIndex: -1, children: selected?.row.label ?? 'Record unavailable' }), _jsxs("div", { className: "cc-toolbar", children: [_jsxs("button", { type: "button", onClick: () => setSelectedId(null), children: ["Back to ", title] }), selected && (!canEdit || canEdit(selected.record)) && _jsx("button", { type: "button", className: "primary", onClick: () => openEditor(selected), children: editLabel })] }), selected ? details(selected.record) : _jsx("p", { role: "alert", children: "This record is no longer available. Return to the list to choose another record." })] }), editor && _jsx(DraftDialog, { title: editor.title, initial: editor.initial, confirmSave: confirmSave, onFormStateChange: onFormStateChange, onClose: () => setEditor(null), onSave: async (draft) => {
                    await onSave(draft, { id: editor.id, revision: editor.revision });
                    setNotice('Saved.');
                }, children: children }, editor.key)] });
}
