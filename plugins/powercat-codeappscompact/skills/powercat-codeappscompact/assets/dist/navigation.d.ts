import type { FormState } from './contracts.js';
export declare function useNavigationGuard(): {
    formState: FormState;
    onFormStateChange: (next: FormState) => void;
    requestNavigation: (navigate: () => void) => boolean;
    message: string | null;
};
