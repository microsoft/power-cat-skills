import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build: inline JS + CSS + assets into one self-contained index.html
// that runs by double-clicking (file://) with no web server.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  server: { port: 5174, open: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 100000000, // inline all assets (incl. the logo PNG) as data URIs
    cssCodeSplit: false
  }
});
