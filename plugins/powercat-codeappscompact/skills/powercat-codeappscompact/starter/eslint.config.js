import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'vendor', 'node_modules', 'tools'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}'], languageOptions: { globals: globals.browser }, plugins: { 'react-hooks': hooks, 'react-refresh': refresh }, rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components': 'error' } },
  { files: ['tests/**/*.{ts,mjs}'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
);
