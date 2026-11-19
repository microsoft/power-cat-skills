import type { ComponentProps } from 'react';
import { AppShell } from '../dist/shell.js';
import type { FormChoiceProps } from './DraftDialog.js';
import type { useNavigationGuard } from '../dist/navigation.js';
export type DemoShellProps = ComponentProps<typeof AppShell> & {
    users: FormChoiceProps<string>['options'];
    user: string;
    onUserChange: (user: string) => void;
    navigation: Pick<ReturnType<typeof useNavigationGuard>, 'requestNavigation' | 'formState' | 'message'>;
};
export declare function DemoShell({ users, user, onUserChange, navigation, onNavigate, children, subtitle, ...shell }: DemoShellProps): import("react").JSX.Element;
