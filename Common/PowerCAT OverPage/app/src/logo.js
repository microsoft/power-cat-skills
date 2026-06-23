// Single source of truth for the Power CAT logo, imported as an asset so Vite inlines
// it as a data URI in the single-file build (works under file:// with no web server).
import logoUrl from './assets/power-cat-logo.png';
export const LOGO = logoUrl;
