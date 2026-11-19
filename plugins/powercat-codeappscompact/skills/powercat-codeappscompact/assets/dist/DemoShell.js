import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppShell } from '../dist/shell.js';
import { FormChoice } from './DraftDialog.js';
export function DemoShell({ users, user, onUserChange, navigation, onNavigate, children, subtitle = 'Browser-local demo. Simulated roles are not authentication.', ...shell }) {
    return _jsxs(AppShell, { ...shell, subtitle: subtitle, onNavigate: id => navigation.requestNavigation(() => onNavigate(id)), children: [_jsx("div", { className: "table-tools", "data-cc": "demo-persona", children: _jsx(FormChoice, { name: "demo-user", label: "Demo user (simulated role)", value: user, options: users, disabled: navigation.formState.saving, onChange: next => navigation.requestNavigation(() => onUserChange(next)) }) }), navigation.message && _jsx("p", { role: "alert", children: navigation.message }), children] });
}
