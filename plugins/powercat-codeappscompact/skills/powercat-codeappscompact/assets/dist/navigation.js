import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './fields.js';
export function useNavigationGuard() {
    const state = useRef({ dirty: false, saving: false });
    const [formState, setFormState] = useState(state.current);
    const [message, setMessage] = useState(null);
    const onFormStateChange = useCallback((next) => {
        state.current = next;
        setFormState(previous => previous.dirty === next.dirty && previous.saving === next.saving ? previous : next);
        setMessage(null);
    }, []);
    useEffect(() => {
        if (!formState.dirty && !formState.saving)
            return;
        const beforeUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', beforeUnload);
        return () => window.removeEventListener('beforeunload', beforeUnload);
    }, [formState.dirty, formState.saving]);
    const requestNavigation = useCallback((navigate) => {
        if (state.current.saving) {
            setMessage('Save in progress. Wait before leaving this collection.');
            return false;
        }
        try {
            if (state.current.dirty && !window.confirm('Discard unsaved changes?'))
                return false;
        }
        catch (error) {
            setMessage(`Navigation was blocked because confirmation is unavailable: ${errorMessage(error)}`);
            return false;
        }
        navigate();
        onFormStateChange({ dirty: false, saving: false });
        return true;
    }, [onFormStateChange]);
    return { formState, onFormStateChange, requestNavigation, message };
}
