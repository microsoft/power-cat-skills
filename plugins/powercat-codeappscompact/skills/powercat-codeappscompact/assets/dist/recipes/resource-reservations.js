import { instant } from './date-policy.js';
function interval(value) {
    if (!value.id.trim() || !value.resources.length || value.resources.some(id => !id.trim()) || new Set(value.resources).size !== value.resources.length)
        throw new Error('Reservations need a stable ID and unique, nonempty resource IDs.');
    const start = instant(value.startUtc);
    const end = instant(value.endUtc);
    if (end <= start)
        throw new Error('A reservation must end after it starts.');
    return { start, end };
}
export function reservationConflicts(candidate, existing, bufferMs = 0) {
    if (!Number.isFinite(bufferMs) || bufferMs < 0)
        throw new Error('Reservation buffer must be finite and nonnegative.');
    const target = interval(candidate);
    const ids = new Set();
    const conflicts = [];
    for (const row of existing) {
        if (ids.has(row.id))
            throw new Error('Existing reservations contain duplicate IDs.');
        ids.add(row.id);
        const other = interval(row);
        if (row.id === candidate.id)
            continue;
        const resources = row.resources.filter(resource => candidate.resources.includes(resource));
        const start = Math.max(target.start, other.start - bufferMs);
        const end = Math.min(target.end, other.end + bufferMs);
        if (resources.length && start < end)
            conflicts.push({ id: row.id, resources, overlapStartUtc: new Date(start).toISOString(), overlapEndUtc: new Date(end).toISOString() });
    }
    return conflicts;
}
