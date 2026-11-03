import type { ReferenceOption, ReferenceSource } from './contracts.js';
export type ReferenceState = {
    pending: boolean;
    issue: string | null;
};
export declare function referenceOptions<R>(rows: readonly R[], config: {
    getId: (row: R) => string;
    getLabel: (row: R) => string;
    disabledReason?: (row: R) => string | undefined;
}): readonly ReferenceOption[];
export declare function referenceLabel(options: readonly ReferenceOption[], value: string, emptyLabel?: string): string;
export type ReferenceFieldProps = {
    id: string;
    name?: string;
    label: string;
    value: string;
    source: ReferenceSource;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
    onStateChange?: (state: ReferenceState) => void;
};
export declare function ReferenceField({ id, name, label, value, source, onChange, disabled, required, invalid, describedBy, onStateChange }: ReferenceFieldProps): import("react").JSX.Element;
