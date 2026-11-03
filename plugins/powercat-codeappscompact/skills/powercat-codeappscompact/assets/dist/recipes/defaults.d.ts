import type { FlatDraft } from '../contracts.js';
export declare function createDefaults<C, D extends FlatDraft>(schema: D, factory: (context: C) => D): (context: C) => D;
export declare function utcMinute(now: () => number, offsetMinutes?: number): string;
