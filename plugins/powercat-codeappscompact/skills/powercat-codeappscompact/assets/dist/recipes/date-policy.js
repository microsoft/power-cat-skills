import { ValidationError } from '../fields.js';
export function instant(value) {
    const time = Date.parse(value);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== value)
        throw new Error('Expected a canonical ISO UTC timestamp, including seconds and milliseconds.');
    return time;
}
export function assertFutureDate(value, options) {
    const time = instant(value);
    if (options.previousValue === value && !options.enforceUnchanged)
        return;
    const now = options.now();
    if (!Number.isFinite(now))
        throw new Error('The injected clock returned an invalid instant.');
    if (time <= now)
        throw new ValidationError({ [options.field]: 'Choose a date and time in the future.' });
}
export function assertDateRange(start, end, options) {
    const min = options.minDurationMs ?? 0;
    const max = options.maxDurationMs;
    if (!Number.isFinite(min) || min < 0 || (max !== undefined && (!Number.isFinite(max) || max < min)))
        throw new Error('Invalid date-range policy bounds.');
    const duration = instant(end) - instant(start);
    if (duration <= 0 || duration < min || (max !== undefined && duration > max))
        throw new ValidationError({ [options.endField]: 'End must follow start and satisfy the configured duration limits.' });
}
