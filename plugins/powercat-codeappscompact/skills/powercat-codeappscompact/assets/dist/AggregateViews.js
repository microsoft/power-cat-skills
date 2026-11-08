import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { FormField } from './DraftDialog.js';
export function DetailTable({ title, columns, rows }) {
    return _jsx("div", { className: "cc-detail-scroll", tabIndex: 0, role: "region", "aria-label": `${title} records`, children: _jsxs("table", { children: [_jsx("caption", { children: title }), _jsx("thead", { children: _jsx("tr", { children: columns.map(c => _jsx("th", { scope: "col", children: c }, c)) }) }), _jsx("tbody", { children: rows.length ? rows.map((row, i) => _jsx("tr", { children: row.map((cell, j) => _jsx("td", { children: cell }, j)) }, i)) : _jsx("tr", { children: _jsx("td", { colSpan: columns.length, children: "No records." }) }) })] }) });
}
export function MetricGrid({ metrics }) {
    return _jsx("div", { className: "cc-metrics", children: metrics.map(m => _jsxs("button", { type: "button", onClick: m.onOpen, children: [_jsx("span", { children: m.label }), _jsx("strong", { children: m.value }), _jsx("span", { className: "cc-metric-link", children: "View records" })] }, m.label)) });
}
export function utcWeek(date) {
    const day = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date)
        throw new Error('Choose a valid calendar date.');
    day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, index) => new Date(day.getTime() + index * 86400000).toISOString().slice(0, 10));
}
export function Calendar({ entries, onOpen, initialDate = new Date().toISOString().slice(0, 10), actionLabel = 'Open booking', title = 'Bookings' }) {
    const [mode, setMode] = useState('agenda');
    const [date, setDate] = useState(initialDate);
    const [dateError, setDateError] = useState('');
    const days = utcWeek(date);
    const ordered = [...entries].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
    function move(delta) { setDate(new Date(Date.parse(`${date}T00:00:00Z`) + delta * 86400000).toISOString().slice(0, 10)); setDateError(''); }
    function card(entry, inWeek) {
        const Heading = inWeek ? 'h4' : 'h3';
        return _jsxs("article", { className: "booking-card", children: [_jsx(Heading, { children: entry.title }), _jsxs("p", { children: [_jsx("time", { dateTime: entry.start, children: entry.start.slice(0, 16).replace('T', ' ') }), " to ", _jsx("time", { dateTime: entry.end, children: entry.end.slice(0, 16).replace('T', ' ') }), " UTC"] }), entry.detail, entry.status && _jsx("p", { children: entry.status }), _jsx("button", { type: "button", "aria-label": `${actionLabel} ${entry.id}`, onClick: () => onOpen(entry.id), children: "Open" })] }, entry.id);
    }
    return _jsxs("section", { className: "cc-calendar", "aria-label": title, children: [_jsx("h2", { children: title }), _jsx("p", { children: "Displayed time zone: UTC. Intervals may cross midnight; an end at midnight does not occupy the next day." }), _jsxs("div", { className: "cc-toolbar", children: [_jsx("button", { type: "button", "aria-pressed": mode === 'week', onClick: () => setMode('week'), children: "Week view" }), _jsx("button", { type: "button", "aria-pressed": mode === 'agenda', onClick: () => setMode('agenda'), children: "Agenda view" }), mode === 'week' && _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => move(-7), children: "Previous week" }), _jsx(FormField, { name: "week", label: "Week containing", type: "date", value: date, onChange: value => { try {
                                    utcWeek(value);
                                    setDate(value);
                                    setDateError('');
                                }
                                catch (error) {
                                    setDateError(error instanceof Error ? error.message : String(error));
                                } } }), _jsx("button", { type: "button", onClick: () => move(7), children: "Next week" })] })] }), dateError && _jsx("p", { role: "alert", children: dateError }), mode === 'agenda' ? _jsx("div", { className: "agenda", children: ordered.length ? ordered.map(e => card(e, false)) : _jsx("p", { children: "No bookings match." }) }) : _jsx("div", { className: "week-grid", children: days.map(day => { const start = `${day}T00:00:00.000Z`; const end = new Date(Date.parse(start) + 86400000).toISOString(); const items = ordered.filter(e => e.start < end && e.end > start); return _jsxs("section", { "aria-label": `Schedule ${day}`, children: [_jsx("h3", { children: day }), items.length ? items.map(e => card(e, true)) : _jsx("p", { children: "No bookings." })] }, day); }) })] });
}
