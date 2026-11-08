export declare function hostProofText(environmentId: string, appUrl: string, verificationId: string): string;
export declare function localPlayUrl(environmentId: string, appUrl: string, verificationId?: string): string;
export declare function verifyHostContext(context: unknown, environmentId: string): {
    environmentId: string;
};
export declare function checkHost(load: () => Promise<unknown>, environmentId: string, timeoutMs?: number, signal?: AbortSignal): Promise<{
    environmentId: string;
}>;
export declare function PowerAppsHostStatus({ environmentId, appUrl }: {
    environmentId: string;
    appUrl: string;
}): import("react").JSX.Element;
