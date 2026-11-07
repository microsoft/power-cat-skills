import type { ReactNode } from 'react';
export declare function DetailTable({ title, columns, rows }: {
    title: string;
    columns: readonly string[];
    rows: readonly (readonly ReactNode[])[];
}): import("react").JSX.Element;
export declare function MetricGrid({ metrics }: {
    metrics: readonly {
        label: string;
        value: number | string;
        onOpen: () => void;
    }[];
}): import("react").JSX.Element;
export type CalendarEntry = {
    id: string;
    title: string;
    start: string;
    end: string;
    detail?: ReactNode;
    status?: string;
};
export declare function utcWeek(date: string): string[];
export declare function Calendar({ entries, onOpen, initialDate, actionLabel, title }: {
    entries: readonly CalendarEntry[];
    onOpen: (id: string) => void;
    initialDate?: string;
    actionLabel?: string;
    title?: string;
}): import("react").JSX.Element;
