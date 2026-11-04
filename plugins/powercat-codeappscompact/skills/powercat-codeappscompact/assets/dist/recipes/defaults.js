import { assertFlat, checkDraft } from '../fields.js';
export function createDefaults(schema, factory) {
    assertFlat(schema, 'Default schema');
    const baseline = { ...schema };
    return context => {
        const value = factory(context);
        checkDraft(value, baseline, 'Default factory');
        return { ...value };
    };
}
export function utcMinute(now, offsetMinutes = 0) {
    const current = now();
    if (!Number.isFinite(current) || !Number.isSafeInteger(offsetMinutes))
        throw new Error('UTC defaults require a valid clock and an integer minute offset.');
    return new Date(Math.floor(current / 60000) * 60000 + offsetMinutes * 60000).toISOString();
}
