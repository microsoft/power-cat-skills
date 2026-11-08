import type { ReactNode } from 'react';
export type TableRow = {
    id: string;
    label: string;
    values: Record<string, string | number>;
    search?: string;
};
export type TableColumn = {
    key: string;
    label: string;
    format?: (value: string | number) => string;
};
export type TableFilter = {
    key: string;
    label: string;
    options: {
        value: string;
        label: string;
    }[];
    matches: (row: TableRow, value: string) => boolean;
};
export type TableProps = {
    title: string;
    rows: TableRow[];
    columns: TableColumn[];
    filters?: TableFilter[];
    initialFilters?: Record<string, string>;
    onOpen?: (id: string) => void;
    onAdd?: () => void;
    addLabel?: string;
    selected?: string[];
    onSelect?: (ids: string[]) => void;
    alternate?: (rows: TableRow[]) => ReactNode;
};
export default function DataTable(props: TableProps): import("react").JSX.Element;
