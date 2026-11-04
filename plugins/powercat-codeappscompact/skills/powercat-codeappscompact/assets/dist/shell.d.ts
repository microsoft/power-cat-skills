import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
export type NavigationItem = {
    id: string;
    label: string;
    icon?: ReactNode;
    count?: number;
};
export declare function AppShell({ title, subtitle, items, activeId, onNavigate, hostStatus, children }: {
    title: string;
    subtitle?: string;
    items: readonly NavigationItem[];
    activeId: string;
    onNavigate: (id: string) => void;
    hostStatus?: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
export declare class AppErrorBoundary extends Component<{
    children: ReactNode;
}, {
    error: string | null;
}> {
    state: {
        error: string | null;
    };
    static getDerivedStateFromError(error: unknown): {
        error: string;
    };
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
}
