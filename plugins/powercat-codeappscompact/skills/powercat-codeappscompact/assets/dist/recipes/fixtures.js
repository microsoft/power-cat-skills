import { instant } from './date-policy.js';
export function createFixtureTools({ seed, anchorUtc }) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
        throw new Error('Fixture seed must be an unsigned 32-bit integer.');
    const anchor = instant(anchorUtc);
    let state = seed;
    function random() {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    }
    function pick(values) {
        if (!values.length)
            throw new Error('Cannot choose a fixture from an empty collection.');
        return values[Math.floor(random() * values.length)];
    }
    return {
        random, pick,
        id(prefix, index) {
            if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(prefix) || !Number.isSafeInteger(index) || index < 0)
                throw new Error('Fixture IDs require an ASCII prefix and nonnegative integer index.');
            return `${prefix}-${seed}-${index}`;
        },
        utc(offsetMinutes) {
            if (!Number.isSafeInteger(offsetMinutes))
                throw new Error('Fixture offsets must be integer minutes.');
            return new Date(anchor + offsetMinutes * 60000).toISOString();
        },
        reference(rows, getId) {
            const value = getId(pick(rows));
            if (!value.trim())
                throw new Error('Fixture relationship IDs must be nonempty.');
            return value;
        },
    };
}
