import { ValidationError } from '../fields.js';
export function conditionalErrors(draft, rules) {
    const errors = {};
    for (const rule of rules) {
        if (!rule.message.trim())
            throw new Error('Conditional rules need a useful error message.');
        if (rule.when(draft) && !rule.check(draft) && !Object.hasOwn(errors, rule.field))
            Object.defineProperty(errors, rule.field, { value: rule.message, enumerable: true });
    }
    return errors;
}
export function assertConditions(draft, rules) {
    const errors = conditionalErrors(draft, rules);
    if (Object.keys(errors).length)
        throw new ValidationError(errors);
}
