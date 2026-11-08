import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component, useId } from 'react';
import { errorMessage } from './fields.js';
export function AppShell({ title, subtitle, items, activeId, onNavigate, hostStatus, children }) {
    const uid = useId();
    if (items.some(item => !item.id || !item.label.trim() || (item.count !== undefined && (!Number.isSafeInteger(item.count) || item.count < 0))) || new Set(items.map(item => item.id)).size !== items.length)
        throw new Error('Navigation requires unique IDs, nonempty accessible labels and nonnegative integer counts.');
    return _jsxs("div", { "data-cc": "shell", children: [_jsx("a", { "data-cc-part": "skip-link", href: `#${uid}-main`, children: "Skip to workspace" }), _jsxs("aside", { "data-cc-part": "sidebar", children: [_jsx("strong", { "data-cc-part": "brand", children: title }), _jsx("nav", { "aria-label": "Collections", children: items.map((item, index) => _jsxs("div", { "data-cc-part": "nav-item", children: [_jsxs("button", { type: "button", "aria-label": item.label, "aria-describedby": item.count === undefined ? undefined : `${uid}-count-${index}`, "aria-current": activeId === item.id ? 'page' : undefined, onClick: () => onNavigate(item.id), children: [_jsx("span", { "data-cc-part": "nav-icon", "aria-hidden": "true", children: item.icon ?? _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", focusable: "false", children: [_jsx("rect", { x: "3", y: "3", width: "14", height: "14", rx: "3", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M6 7h8M6 10h8M6 13h5", stroke: "currentColor", strokeWidth: "1.5" })] }) }), _jsx("span", { "data-cc-part": "nav-label", children: item.label })] }), item.count !== undefined && _jsxs("span", { id: `${uid}-count-${index}`, "data-cc-part": "nav-count", children: [item.count, _jsx("span", { "data-cc-part": "visually-hidden", children: " records" })] })] }, item.id)) })] }), _jsxs("div", { "data-cc-part": "workspace", children: [_jsxs("header", { "data-cc-part": "app-header", children: [_jsxs("div", { children: [_jsx("h1", { children: title }), subtitle && _jsx("p", { children: subtitle })] }), hostStatus] }), _jsx("main", { id: `${uid}-main`, tabIndex: -1, children: children })] })] });
}
export class AppErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) { return { error: errorMessage(error) }; }
    componentDidCatch(error, info) { console.error('[PowerCat-CodeAppsCompact] Rendering failed', error, info.componentStack); }
    render() {
        if (this.state.error)
            return _jsxs("main", { "data-cc": "fatal", children: [_jsx("h1", { children: "Workspace unavailable" }), _jsx("p", { role: "alert", children: this.state.error }), _jsx("p", { children: "Saved data has not been reset or deleted." }), _jsx("button", { onClick: () => window.location.reload(), children: "Reload workspace" })] });
        return this.props.children;
    }
}
