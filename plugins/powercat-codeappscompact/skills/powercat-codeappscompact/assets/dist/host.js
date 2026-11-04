import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getContext } from '@microsoft/power-apps/app';
import { errorMessage, isObject } from './fields.js';
export function hostProofText(environmentId, appUrl, verificationId) {
    if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(verificationId))
        throw new Error('Invalid Local Play verification challenge.');
    return `Verified Power Apps host | ${environmentId.toLowerCase()} | ${new URL(appUrl).origin} | ${verificationId}`;
}
export function localPlayUrl(environmentId, appUrl, verificationId) {
    if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(environmentId))
        throw new Error('A real Power Apps environment GUID is required.');
    const app = new URL(appUrl);
    if (app.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(app.hostname) || app.username || app.password || app.pathname !== '/' || app.search || app.hash)
        throw new Error('Local Play requires a loopback HTTP app origin, without credentials or a path.');
    if (verificationId) {
        hostProofText(environmentId, appUrl, verificationId);
        app.searchParams.set('cc-verify', verificationId);
    }
    const host = new URL(`https://apps.powerapps.com/play/e/${environmentId}/a/local`);
    host.searchParams.set('_localAppUrl', app.href);
    host.searchParams.set('_localConnectionUrl', new URL('__vite_powerapps_plugin__/power.config.json', app).href);
    return host.href;
}
export function verifyHostContext(context, environmentId) {
    if (!isObject(context) || !isObject(context.app) || !isObject(context.host) || !isObject(context.user))
        throw new Error('Power Apps did not return a complete host context.');
    if (typeof context.app.environmentId !== 'string' || context.app.environmentId.toLowerCase() !== environmentId.toLowerCase())
        throw new Error('Power Apps returned a different environment.');
    if (typeof context.host.sessionId !== 'string' || !context.host.sessionId.trim() || typeof context.user.objectId !== 'string' || !context.user.objectId.trim() || typeof context.user.tenantId !== 'string' || !context.user.tenantId.trim())
        throw new Error('Power Apps did not verify both a host session and a signed-in user.');
    return { environmentId: context.app.environmentId };
}
export async function checkHost(load, environmentId, timeoutMs = 20000, signal) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
        throw new Error('Host timeout must be positive.');
    let timer;
    let abort = () => { };
    try {
        const deadline = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Host verification timed out. Check sign-in and local-network access, then reload.')), timeoutMs);
            abort = () => reject(new Error('Host verification was cancelled.'));
            if (signal?.aborted)
                abort();
            else
                signal?.addEventListener('abort', abort, { once: true });
        });
        const context = await Promise.race([Promise.resolve().then(load), deadline]);
        return verifyHostContext(context, environmentId);
    }
    finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
    }
}
export function PowerAppsHostStatus({ environmentId, appUrl }) {
    const verificationId = new URL(window.location.href).searchParams.get('cc-verify');
    const url = localPlayUrl(environmentId, appUrl, verificationId ?? undefined);
    const [host, setHost] = useState(() => window.self === window.top ? { state: 'preview', message: 'Standalone preview - not authenticated Local Play' } : { state: 'checking', message: 'Checking Power Apps host...' });
    useEffect(() => {
        if (window.self === window.top)
            return;
        const controller = new AbortController();
        void checkHost(() => {
            if (window.location.origin !== new URL(appUrl).origin)
                throw new Error('This frame does not match the configured app origin.');
            return getContext();
        }, environmentId, 20000, controller.signal).then(() => {
            if (!controller.signal.aborted)
                setHost({ state: 'authenticated', message: 'Signed-in Power Apps host verified' });
        }).catch(error => {
            if (controller.signal.aborted)
                return;
            console.error('[CodeAppsCompact] Host verification failed', error);
            setHost({ state: 'failed', message: errorMessage(error) });
        });
        return () => controller.abort();
    }, [environmentId, appUrl]);
    return _jsxs("div", { "data-cc-part": "host-status", "data-host-state": host.state, "data-host-environment": host.state === 'authenticated' ? environmentId : undefined, role: host.state === 'failed' ? 'alert' : 'status', children: [_jsx("span", { children: host.message }), host.state === 'preview' && _jsx("a", { href: url, target: "_blank", rel: "noreferrer", children: "Open authenticated Local Play" }), host.state === 'authenticated' && verificationId && _jsx("small", { "data-cc-part": "host-proof", "aria-label": "Local Play verification proof", children: hostProofText(environmentId, appUrl, verificationId) })] });
}
