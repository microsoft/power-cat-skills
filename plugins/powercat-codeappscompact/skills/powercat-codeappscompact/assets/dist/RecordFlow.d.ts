import type { ReactNode } from 'react';
import type { TableProps, TableRow } from './DataTable.js';
import type { DraftDialogProps } from './DraftDialog.js';
export type RecordFlowContext = {
    id: string | undefined;
    revision: string;
};
export type RecordFlowProps<R, D> = Pick<TableProps, 'columns' | 'filters' | 'initialFilters' | 'selected' | 'onSelect'> & {
    title: string;
    records: readonly R[];
    revision: string;
    toRow: (record: R) => TableRow;
    createDraft: () => D;
    editDraft: (record: R) => D;
    details: (record: R) => ReactNode;
    children: DraftDialogProps<D>['children'];
    onSave: (draft: D, context: RecordFlowContext) => Promise<void>;
    addLabel?: string;
    editLabel?: string;
    canEdit?: (record: R) => boolean;
    toolbar?: ReactNode;
    alternate?: (rows: TableRow[], open: (id: string) => void) => ReactNode;
    confirmSave?: DraftDialogProps<D>['confirmSave'];
    onFormStateChange?: DraftDialogProps<D>['onFormStateChange'];
};
export declare function RecordFlow<R, D>({ title, records, revision, toRow, columns, filters, initialFilters, selected: selectedRows, onSelect, alternate, toolbar, createDraft, editDraft, details, children, onSave, addLabel, editLabel, canEdit, confirmSave, onFormStateChange }: RecordFlowProps<R, D>): import("react").JSX.Element;
