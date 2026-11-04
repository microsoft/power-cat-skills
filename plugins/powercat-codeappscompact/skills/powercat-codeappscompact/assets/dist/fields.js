export class DataError extends Error {
    kind;
    constructor(kind, message, options) {
        super(message, options);
        this.kind = kind;
        this.name = 'DataError';
    }
}
export class ValidationError extends DataError {
    fieldErrors;
    constructor(errors, message = 'Review the highlighted fields.') {
        if (!Object.keys(errors).length || Object.values(errors).some(value => typeof value !== 'string' || !value.trim()))
            throw new Error('ValidationError requires named, nonempty field messages.');
        super('validation', message);
        this.name = 'ValidationError';
        this.fieldErrors = { ...errors };
    }
}
export function errorMessage(error) {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
        return error.message;
    return 'Operation failed without an error message.';
}
export function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function fieldErrorsFrom(error) {
    if (!isObject(error) || !isObject(error.fieldErrors))
        return new Map();
    return new Map(Object.entries(error.fieldErrors).filter((entry) => typeof entry[1] === 'string' && Boolean(entry[1].trim())));
}
export function requireSuccess(result) {
    if (!isObject(result) || result.success !== true) {
        const error = isObject(result) ? result.error : result;
        if (error instanceof Error)
            throw error;
        const fields = fieldErrorsFrom(error);
        if (fields.size)
            throw new ValidationError(Object.fromEntries(fields), errorMessage(error));
        throw new DataError('unknown', errorMessage(error));
    }
}
export function assertFlat(value, label) {
    if (!isObject(value) || Reflect.ownKeys(value).length !== Object.keys(value).length)
        throw new Error(`${label} must have only enumerable string keys.`);
    for (const [key, item] of Object.entries(value)) {
        if (typeof item !== 'string' && (typeof item !== 'number' || !Number.isFinite(item)))
            throw new Error(`${label}.${key} must be a string or finite number.`);
    }
}
export function checkDraft(value, defaults, label = 'Draft') {
    assertFlat(value, label);
    if (Object.keys(value).length !== Object.keys(defaults).length || Object.keys(defaults).some(key => !Object.hasOwn(value, key) || typeof value[key] !== typeof defaults[key])) {
        throw new Error(`${label} must return exactly the default keys and primitive types.`);
    }
}
export function projectDraft(defaults) {
    assertFlat(defaults, 'defaults');
    return row => {
        if (!isObject(row))
            throw new Error('Record must be an object.');
        const draft = {};
        for (const key of Object.keys(defaults)) {
            if (!Object.hasOwn(row, key))
                throw new Error(`Record is missing draft field "${key}".`);
            const value = row[key];
            if (typeof value !== 'string' && typeof value !== 'number')
                throw new Error(`Record field "${key}" has an invalid primitive type.`);
            draft[key] = value;
        }
        checkDraft(draft, defaults, 'Projected draft');
        return draft;
    };
}
export const fieldPresets = {
    name: { kind: 'text', required: true, maxLength: 80 },
    notes: { kind: 'textarea', maxLength: 2000, rows: 4 },
    percentage: { kind: 'number', required: true, min: 0, max: 100 },
    integer: { kind: 'number', required: true, integer: true, step: 1 },
    utc: { kind: 'datetime-utc', required: true },
};
export function utcFromInput(value) {
    if (value === '')
        return '';
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
        throw new Error('must be a valid UTC date and time (minute precision).');
    const encoded = `${value}:00.000Z`;
    const time = Date.parse(encoded);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== encoded)
        throw new Error('must be a valid UTC date and time (minute precision).');
    return encoded;
}
export function utcToInput(value) {
    if (value === '')
        return '';
    const input = value.slice(0, 16);
    if (utcFromInput(input) !== value)
        throw new Error('UTC values must be canonical ISO strings at minute precision, for example 2030-07-20T14:30:00.000Z.');
    return input;
}
export function checkOptions(options, label = 'Reference') {
    const seen = new Set();
    for (const entry of options) {
        if (!isObject(entry) || typeof entry.value !== 'string' || typeof entry.label !== 'string' || !entry.label.trim() || entry.value !== entry.value.trim() || seen.has(entry.value) || (entry.disabledReason !== undefined && (typeof entry.disabledReason !== 'string' || !entry.disabledReason.trim()))) {
            throw new Error(`${label} requires unique trimmed string values and nonempty labels/reasons.`);
        }
        seen.add(entry.value);
    }
    return options;
}
export function selectOptions(field) {
    if (!Array.isArray(field.options) || field.options.length === 0)
        throw new Error(`Select field "${field.name}" requires nonempty options.`);
    return checkOptions(field.options.map(option => typeof option === 'string' ? { value: option, label: option || '(None)' } : option), `Select field "${field.name}"`);
}
export function checkConfiguration(defaults, fields) {
    assertFlat(defaults, 'defaults');
    const names = new Set();
    for (const field of fields) {
        if (names.has(field.name))
            throw new Error(`Duplicate field name "${field.name}".`);
        names.add(field.name);
        if (!field.label.trim())
            throw new Error(`Field "${field.name}" needs an accessible label.`);
        if (!Object.hasOwn(defaults, field.name))
            throw new Error(`Missing default for field "${field.name}".`);
        if (!['text', 'email', 'number', 'select', 'reference', 'textarea', 'datetime-utc'].includes(field.kind))
            throw new Error(`Unsupported kind for field "${field.name}".`);
        if (typeof defaults[field.name] !== (field.kind === 'number' ? 'number' : 'string'))
            throw new Error(`Default for "${field.name}" has the wrong primitive type.`);
        for (const key of ['minLength', 'maxLength'])
            if (field[key] !== undefined && (!Number.isInteger(field[key]) || field[key] < 0))
                throw new Error(`Invalid ${key} for "${field.name}".`);
        if (field.minLength !== undefined && field.maxLength !== undefined && field.minLength > field.maxLength)
            throw new Error(`Invalid length bounds for "${field.name}".`);
        if ((field.min !== undefined && !Number.isFinite(field.min)) || (field.max !== undefined && !Number.isFinite(field.max)) || (field.min !== undefined && field.max !== undefined && field.min > field.max))
            throw new Error(`Invalid numeric bounds for "${field.name}".`);
        if ((field.integer !== undefined && typeof field.integer !== 'boolean') || (field.step !== undefined && (!Number.isFinite(field.step) || field.step <= 0)) || ((field.integer !== undefined || field.step !== undefined) && field.kind !== 'number'))
            throw new Error(`Invalid integer/step rule for "${field.name}".`);
        if (field.pattern !== undefined && !(field.pattern instanceof RegExp))
            throw new Error(`Invalid pattern for "${field.name}".`);
        if (field.rows !== undefined && (!Number.isInteger(field.rows) || field.rows < 1))
            throw new Error(`Invalid textarea rows for "${field.name}".`);
        if (field.kind === 'select')
            selectOptions(field);
        if (field.kind === 'reference') {
            if (!field.reference || (!field.reference.options && (typeof field.reference.loadOptions !== 'function' || typeof field.reference.resolveOption !== 'function')))
                throw new Error(`Reference field "${field.name}" needs options or both loadOptions and resolveOption.`);
            if (field.reference.options)
                checkOptions(field.reference.options);
        }
        if (field.kind === 'datetime-utc')
            utcToInput(String(defaults[field.name]));
    }
}
function scalarIssue(value, field) {
    const text = String(value).trim();
    if (field.required && !text)
        return 'is required.';
    if (typeof value === 'number') {
        if (!Number.isFinite(value))
            return 'must be a finite number.';
        if (field.integer && !Number.isSafeInteger(value))
            return 'must be a safe integer.';
        if (field.min !== undefined && value < field.min)
            return `must be at least ${field.min}.`;
        if (field.max !== undefined && value > field.max)
            return `must be at most ${field.max}.`;
        if (field.step !== undefined) {
            const steps = (value - (field.min ?? 0)) / field.step;
            if (!Number.isFinite(steps) || Math.abs(steps - Math.round(steps)) > Number.EPSILON * 8 * Math.max(1, Math.abs(steps)))
                return `must use increments of ${field.step} from ${field.min ?? 0}.`;
        }
    }
    if (field.minLength !== undefined && text.length < field.minLength)
        return `must have at least ${field.minLength} characters.`;
    if (field.maxLength !== undefined && text.length > field.maxLength)
        return `must have at most ${field.maxLength} characters.`;
    if (field.pattern && text && !new RegExp(field.pattern.source, field.pattern.flags.replace(/[gy]/g, '')).test(text))
        return field.patternMessage ?? 'has an invalid format.';
    if (field.kind === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
        return 'must be a valid email address.';
    if (field.kind === 'select' || (field.kind === 'reference' && text && field.reference?.options)) {
        const options = field.kind === 'select' ? selectOptions(field) : field.reference?.options ?? [];
        const option = options.find(item => item.value === text);
        if (!option)
            return field.kind === 'reference' ? 'references a missing record.' : 'must be one of the declared options.';
        if (option.disabledReason)
            return `is unavailable: ${option.disabledReason}`;
    }
    if (field.kind === 'datetime-utc') {
        try {
            utcToInput(text);
        }
        catch (error) {
            return errorMessage(error);
        }
    }
    return undefined;
}
export function validateDraft(draft, defaults, fields) {
    checkConfiguration(defaults, fields);
    checkDraft(draft, defaults);
    const errors = new Map();
    for (const field of fields) {
        const issue = scalarIssue(draft[field.name], field);
        if (issue)
            errors.set(field.name, `${field.label} ${issue}`);
    }
    return errors;
}
export function assertValidDraft(draft, defaults, fields) {
    const errors = validateDraft(draft, defaults, fields);
    if (errors.size)
        throw new ValidationError(Object.fromEntries(errors));
}
export function formValues(draft, fields) {
    const utcFields = new Set(fields.filter(field => field.kind === 'datetime-utc').map(field => field.name));
    return Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, utcFields.has(key) ? utcToInput(String(value)) : String(value)]));
}
export function normalize(values, defaults, fields) {
    if (Object.keys(values).length !== Object.keys(defaults).length || Object.keys(defaults).some(key => !Object.hasOwn(values, key)))
        throw new Error('Form schema changed; use guarded navigation before remounting.');
    const result = {};
    const errors = new Map();
    const byName = new Map(fields.map(field => [field.name, field]));
    for (const key of Object.keys(defaults)) {
        const field = byName.get(key);
        const text = values[key].trim();
        let value = typeof defaults[key] === 'number' ? (text === '' ? Number.NaN : Number(text)) : text;
        let issue;
        if (field?.required && text === '')
            issue = 'is required.';
        else if (typeof value === 'number' && !Number.isFinite(value))
            issue = 'must be a finite number.';
        else if (field?.kind === 'datetime-utc') {
            try {
                value = utcFromInput(text);
            }
            catch (error) {
                issue = errorMessage(error);
            }
        }
        if (!issue && field)
            issue = scalarIssue(value, field);
        if (issue) {
            if (!field)
                throw new Error(`Draft field "${key}" ${issue}`);
            errors.set(key, `${field.label} ${issue}`);
            result[key] = defaults[key];
        }
        else
            result[key] = value;
    }
    checkDraft(result, defaults, 'Normalized draft');
    return { draft: result, errors };
}
