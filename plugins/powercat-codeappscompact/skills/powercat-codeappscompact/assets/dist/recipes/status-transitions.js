import { ValidationError } from '../fields.js';
export function assertTransition(previous, next, transitions, field = 'status') {
    if (!Object.hasOwn(transitions, previous) || !Object.hasOwn(transitions, next))
        throw new ValidationError({ [field]: 'Choose a declared status.' });
    if (previous !== next && !transitions[previous].includes(next))
        throw new ValidationError({ [field]: `The transition from ${previous} to ${next} is not allowed.` });
}
