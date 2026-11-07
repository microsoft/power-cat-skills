import type { Dispatch, HTMLInputTypeAttribute, ReactNode, SetStateAction } from 'react';
import type { FormState, ReferenceOption } from '../dist/contracts.js';
type CommonField = {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    hint?: string;
};
export type FormFieldProps = CommonField & {
    type?: HTMLInputTypeAttribute;
    multiline?: boolean;
    step?: string | number;
    min?: string | number;
    max?: string | number;
    maxLength?: number;
};
export type FormSelectProps = CommonField & {
    options: readonly ReferenceOption[];
    empty?: string | false;
};
export declare function FormField({ name, label, value, onChange, required, disabled, hint, type, multiline, step, min, max, maxLength }: FormFieldProps): import("react").JSX.Element;
export declare function FormSelect({ name, label, value, onChange, required, disabled, hint, options, empty }: FormSelectProps): import("react").JSX.Element;
export declare function Modal({ title, children, onClose, busy }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    busy?: boolean;
}): import("react").JSX.Element;
export type DraftDialogProps<T> = {
    title: string;
    initial: T;
    children: (draft: T, setDraft: Dispatch<SetStateAction<T>>) => ReactNode;
    onSave: (draft: T) => Promise<void>;
    onClose: () => void;
    submitLabel?: string;
    confirmSave?: (draft: T) => string | undefined;
    onFormStateChange?: (state: FormState) => void;
};
export declare function DraftDialog<T>({ title, initial, children, onSave, onClose, submitLabel, confirmSave, onFormStateChange }: DraftDialogProps<T>): import("react").JSX.Element;
export {};
