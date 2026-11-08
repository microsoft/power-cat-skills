import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
function finite(value, label) { if (!Number.isFinite(value))
    throw new Error(`${label} must be finite.`); }
export function StatusBadge({ children, tone = 'neutral' }) {
    return _jsx("span", { "data-cc": "status-badge", "data-cc-tone": tone, children: children });
}
export function PrimarySecondaryCell({ primary, secondary }) {
    return _jsxs("span", { "data-cc": "primary-secondary", children: [_jsx("strong", { children: primary }), secondary !== undefined && _jsx("small", { children: secondary })] });
}
export function NumberCell({ value, locale, options }) {
    finite(value, 'Number');
    return _jsx("span", { "data-cc": "number-cell", children: new Intl.NumberFormat(locale, options).format(value) });
}
export function CurrencyCell({ value, currency, locale }) {
    return _jsx(NumberCell, { value: value, locale: locale, options: { style: 'currency', currency } });
}
export function DateTimeCell({ value, timeZone, locale, options }) {
    if (!timeZone.trim() || !/(Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value)))
        throw new Error('DateTimeCell needs an offset-qualified timestamp and an explicit timeZone.');
    const text = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', ...options, timeZone }).format(new Date(value));
    return _jsxs("time", { "data-cc": "date-cell", dateTime: value, title: `${value} (${timeZone})`, children: [text, " ", _jsx("small", { children: timeZone })] });
}
export function UtcCell(props) { return _jsx(DateTimeCell, { ...props, timeZone: "UTC" }); }
export function ProgressCell({ value, max = 100, label, locale }) {
    finite(value, 'Progress');
    finite(max, 'Progress maximum');
    if (max <= 0 || value < 0 || value > max || !label.trim())
        throw new Error('Progress needs a label and a value between zero and a positive maximum.');
    return _jsxs("span", { "data-cc": "progress-cell", children: [_jsx("progress", { "aria-label": label, value: value, max: max }), " ", _jsx(NumberCell, { value: value / max, locale: locale, options: { style: 'percent', maximumFractionDigits: 1 } })] });
}
export function SummaryCard({ title, value, detail, tone = 'neutral', onActivate }) {
    const content = _jsxs(_Fragment, { children: [_jsx("span", { "data-cc-part": "metric-label", children: title }), _jsx("strong", { "data-cc-part": "metric-value", children: value }), detail !== undefined && _jsx("small", { children: detail })] });
    return onActivate ? _jsx("button", { type: "button", "data-cc": "summary-card", "data-cc-tone": tone, onClick: onActivate, children: content }) : _jsx("div", { "data-cc": "summary-card", "data-cc-tone": tone, children: content });
}
export function MetricGrid({ items, label = 'Summary' }) {
    if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id || !item.title.trim()))
        throw new Error('Metrics require unique IDs and labels.');
    return _jsx("section", { "data-cc": "metric-grid", "aria-label": label, children: items.map(({ id, ...item }) => _jsx(SummaryCard, { ...item }, id)) });
}
export function AttentionList({ items, label = 'Attention', emptyMessage = 'Nothing needs attention.' }) {
    if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id || (item.action && !item.action.label.trim())))
        throw new Error('Attention items need unique IDs and named actions.');
    return _jsx("section", { "data-cc": "attention-list", "aria-label": label, children: items.length ? _jsx("ul", { children: items.map(item => _jsxs("li", { "data-cc-tone": item.tone ?? 'neutral', children: [_jsx("span", { children: item.message }), item.action && _jsx("button", { type: "button", onClick: item.action.onActivate, children: item.action.label })] }, item.id)) }) : _jsx("p", { children: emptyMessage }) });
}
