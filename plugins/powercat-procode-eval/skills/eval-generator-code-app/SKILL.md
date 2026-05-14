---
name: "eval-generator-code-app"
argument-hint: "[path to your Code App project] [optional: BRD file or OneDrive URL]"
description: "Generate a two-layer eval suite (presence checks + static security analysis) for a Power Apps Code App. Code Apps use @microsoft/power-apps SDK with generated service classes in src/generated/services/ — NOT @microsoft/powerapps-component-framework or context.webAPI.*. BRD is optional — if absent, features are derived from a code review of the project. Always produces: evals/manifest.json, evals/presence/<id>.check.ts files, evals/runner/run-evals.ts, evals/runner/presence-runner.ts, evals/runner/security-runner.ts, and evals/dashboard/index.html. Triggers: 'generate code app evals', 'eval my code app', 'generate tests for code app', 'code app eval generator', 'check feature completeness code app'."
---

# Eval Generator — Power Apps Code App

## Purpose
Answer: **"Is all requested functionality present and correctly structured in this Code App?"**

Two eval layers are always generated:
1. **Presence** — static checks (grep/AST) that assert code artifacts exist in the right places
2. **Security** — static security analysis grounded in the actual source code, covering 12 security categories

Both are mandatory. Neither alone is sufficient.

---

## Code App Stack Assumptions

Power Apps Code Apps are **full Single-Page Applications (SPAs)** — not PCF components. They use the `@microsoft/power-apps` client library, not `@microsoft/powerapps-component-framework`. There is no `context.webAPI.*`, no `context.parameters`, and no `ComponentFramework` type anywhere in a Code App.

| Concern | Technology |
|---|---|
| UI framework | React (TSX), Vue, or plain HTML/JS |
| Bundler | Vite (`vite.config.ts`) with `@microsoft/power-apps-vite` plugin (`powerApps()`) |
| Platform SDK | `@microsoft/power-apps` |
| SDK init | `initialize()` from `@microsoft/power-apps/app` — called in a `PowerProvider` wrapper component |
| Connector access | **Generated service classes** in `src/generated/services/<ApiName>Service.ts` |
| Dataverse operations | Generated `<ApiName>Service.ts` — static methods, return `IOperationResult<T>` with `.value` |
| Standard connectors | Generated `<ConnectorName>Service.ts` — static methods, return `IOperationResult<T>` with `.data` |
| Generated models | `src/generated/models/<EntityName>Model.ts` — TypeScript types for Dataverse entities |
| Config | `power.config.json` — project identity, created by `npx power-apps init` |
| State management | TanStack Query (`@tanstack/react-query`), Zustand, or React state |
| Routing | React Router (`react-router-dom`) |
| Package manager | npm |
| Deployment | `npx power-apps push` |
| Eval runner | `tsx` (TypeScript execution, no transpile step needed) |
| Static analysis | `glob` (file discovery in presence checks) |

> ⚠️ **Never reference `context.webAPI.*`, `context.parameters`, or `ComponentFramework` anywhere in generated eval files. These are PCF concepts — they do not exist in Code Apps.**

---

## Step 0 — Snapshot Previous Results

> **Run this first, before collecting inputs or writing any files.**

1. Check if `evals/results/latest.json` exists in the project root.
2. If it **does** exist:
   - Read it.
   - Count files matching `evals/results/snapshots/iter-*.json` to determine N (next iteration = count + 1).
   - Write a copy to `evals/results/snapshots/iter-<N>-<ISO-timestamp>.json`.
   - Update `evals/results/snapshots/index.json` (create if absent, append if present).
3. If it does **not** exist — skip silently. This is the first invocation.

---

## Step 0b — Collect Inputs

Ask the user (via `m_ask_user` for structured choices) for:

1. **Requirements document** — OPTIONAL. One of:
   - Local file path (`.md`, `.txt`, `.docx`)
   - OneDrive / SharePoint URL
   - Session `plan.md` (from context)
   - Paste/describe in chat
   - **None / Skip** — features will be derived from code review (see Step 1b)

2. **Code App project root** — absolute path to the project directory.
   - Default: current working directory from context.

3. **Eval output mode** (optional):
   - `scaffold+write` — write all eval files into the project (default ✅)
   - `describe-only` — print what would be generated, no file writes

> ⚠️ Ask ALL questions upfront in a SINGLE `m_ask_user` call (where applicable) before doing any file work.

---

## Step 1 — Read Requirements Document (if provided)

> **If no BRD / requirements document was provided, skip to Step 1b.**

### Local `.md` or `.txt`
Use the `view` tool.

### Local `.docx`
Use the `docx` skill. Call `m_get_skill('docx')` first.

### OneDrive / SharePoint URL
Use `m365_download_file` (resolve file ID with `m365_search_files` first).

### Session plan.md
Read from the session plan path provided in context.

---

## Step 1b — Code-Review Fallback (No BRD)

> **Run this step ONLY when no requirements document was provided.** Applies on first run AND every subsequent iteration.

1. Use `glob` on `src/` to enumerate all files.
2. Use `grep` to identify:
   - All React components (`src/components/**/*.tsx`, `src/pages/**/*.tsx`) → one feature per component/page
   - Developer-written services (`src/services/**/*.ts` or `src/Services/**/*.ts`) → one feature per service method cluster
   - Hooks (`src/hooks/**/*.ts`) → features if they encapsulate connector calls
   - Generated service imports: `from '.*generated/services/'` → identifies which connectors are wired up
   - Dataverse patterns: `<ApiName>Service\.<MethodName>\(` in `src/` (not `src/generated/`)
   - TanStack Query: `useQuery|useMutation` → async data-fetching features
3. For each discovered logical unit, synthesize a feature entry with `id`, `title`, `description`, `acceptance_criteria`, `priority`, and `connectors`.
4. Set `manifest.generatedFrom = "code-review"`.
5. Continue to Step 2 using these code-derived features.

> **Re-runs:** When invoked again without a BRD, repeat Step 1b to pick up new components or services. Match features by `id` — preserve `presence_status` for any existing `id`.

---

## Step 2 — Parse Requirements → Feature Manifest

Extract a structured feature list from the requirements document (Step 1) **or** use the code-derived list from Step 1b.

For each feature, capture:
- **id** — slugified identifier (e.g. `user-search`, `dataverse-create-record`)
- **title** — short label
- **description** — what the feature does
- **acceptance_criteria** — array of verifiable statements (empty if not specified)
- **priority** — `high` / `medium` / `low` (default `medium`)
- **connectors** — array: `dataverse`, `office365users`, `none`
- **layer_presence** — `true` (always)

Track in SQL:
```sql
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  acceptance_criteria TEXT,
  priority TEXT DEFAULT 'medium',
  connectors TEXT,
  layer_presence INTEGER DEFAULT 1,
  presence_status TEXT DEFAULT 'pending',
  mapped_files TEXT
);
```

Write `evals/manifest.json`:

```json
{
  "generated": "<ISO timestamp>",
  "project": "<project root basename>",
  "generatedFrom": "brd | code-review",
  "features": [
    {
      "id": "user-search",
      "title": "User Search",
      "description": "Allow users to search for people using the Office365Users connector",
      "acceptance_criteria": [
        "Search input triggers Office365UsersService call",
        "Results display name, email, and job title",
        "Empty query shows placeholder, not error"
      ],
      "priority": "high",
      "connectors": ["office365users"],
      "layers": { "presence": true, "unit": true }
    }
  ]
}
```

---

## Step 3 — Audit the Code App

### 3a. Verify Code App structure

Use `glob` to confirm:
- `power.config.json` exists (created by `npx power-apps init` — **the primary Code App fingerprint**)
- `package.json` exists with `@microsoft/power-apps` dependency (NOT `@microsoft/powerapps-component-framework`)
- `vite.config.ts` or `vite.config.js` exists and references `@microsoft/power-apps-vite`
- `src/` directory contains TSX/TS source files
- `src/generated/` directory exists (indicates connectors added via `npx power-apps add-dataverse-api`)

If `@microsoft/powerapps-component-framework` is found instead of `@microsoft/power-apps`, stop and warn: "This appears to be a PCF component, not a Code App. This skill is designed for Power Apps Code Apps only."

If `power.config.json` is absent but `@microsoft/power-apps` is present, warn: "Code App not yet initialized. Run `npx power-apps init` first." — but continue evaluation.

### 3b. Map src/ structure

Use `glob` on `src/` to identify:

| Pattern | Role |
|---|---|
| `src/App.tsx` or `src/main.tsx` | Root component / entry point |
| `src/pages/<Name>.tsx` | Page-level components (with routing) |
| `src/components/<Name>.tsx` | Reusable UI components |
| `src/services/<Name>Service.ts` or `src/Services/<Name>Service.ts` | Developer-written service wrappers over generated services |
| `src/hooks/use<Name>.ts` | React hooks |
| `src/utils/<name>.ts` | Utility functions |
| `src/generated/services/<ApiName>Service.ts` | **Auto-generated** connector service classes — do not test these directly |
| `src/generated/models/<EntityName>Model.ts` | **Auto-generated** TypeScript types |
| `src/generated/appschemas/dataSourcesInfo.ts` | **Auto-generated** — lists all registered data sources |
| `power.config.json` | Connector metadata config |

Also check for SDK initialization:

```
grep: "PowerProvider|initialize\(\)" in src/App.tsx or src/main.tsx
```

If neither is found, flag it: generate a critical presence check for `sdk-init-missing`.

### 3c. Detect connector usage

Use `grep` — **all patterns are Code App-specific, never PCF patterns**:

```
# Generated service imports in developer code (src/ excluding src/generated/)
pattern: "from '.*generated/services/" → connector is wired up and used

# Dataverse operations via generated service static methods
pattern: "<ApiName>Service\.\w+\(" → connector operation call
pattern: "result\.value" → Dataverse result access (IOperationResult.value)

# Standard connector result access
pattern: "result\.data" → connector result (IOperationResult.data)
pattern: "result\.success" → success check — should be in every connector call
pattern: "result\.errorMessage" → error handling

# TanStack Query
pattern: "useQuery|useMutation" → async data fetching

# Office365Users (match actual generated service file methods)
pattern: "Office365UsersService\." → any Office365Users service call
```

> ⚠️ Do NOT search for `context.webAPI.*`, `retrieveMultipleRecords`, `createRecord`, `updateRecord`, or `deleteRecord` — these are PCF patterns and will never appear in a Code App.

Record matched files in the SQL `features` table (`mapped_files` column).

### 3d. Flag unimplemented features

A feature is **Not Implemented** if its core connector calls are not found in `src/`.

Mark `presence_status = 'not_found'` in SQL. Presence checks will explicitly report `passed: false` with a clear `detail` message.

---

## Step 4 — Generate Presence Checks

Create `evals/presence/<feature-id>.check.ts` for each feature.

### Presence check template

```typescript
// evals/presence/<feature-id>.check.ts
// AUTO-GENERATED by eval-generator-code-app
// Feature: <feature title>
// Description: <feature description>

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

// Anchored to this file's own location — works correctly whether invoked via runner or directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');  // evals/presence → evals → project root
const SRC = join(PROJECT_ROOT, 'src');
const GENERATED = join(PROJECT_ROOT, 'src', 'generated');

interface PresenceResult {
  featureId: string;
  checks: Array<{ name: string; passed: boolean; detail?: string }>;
}

export function check(): PresenceResult {
  const checks: PresenceResult['checks'] = [];

  // ── Check: Generated service file exists ──
  const serviceFile = join(GENERATED, 'services', '<ApiName>Service.ts');
  const serviceExists = existsSync(serviceFile);
  checks.push({
    name: 'generated service file exists',
    passed: serviceExists,
    detail: serviceExists ? undefined : 'Expected: src/generated/services/<ApiName>Service.ts — run npx power-apps add-dataverse-api',
  });

  // ── Check: Service is imported in developer code (outside src/generated/) ──
  const srcFiles = globSync(`${SRC}/**/*.ts?(x)`, { ignore: `${GENERATED}/**` });
  const allSource = srcFiles.map(f => readFileSync(f, 'utf-8')).join('\n');

  const importFound = /from ['"].*generated\/services\/<ApiName>Service['"]/.test(allSource);
  checks.push({
    name: 'generated service imported in src/',
    passed: importFound,
    detail: importFound ? undefined : 'No import of <ApiName>Service found outside src/generated/',
  });

  // ── Check: result.success is checked (error handling) ──
  const successCheck = /result\.success/.test(allSource);
  checks.push({
    name: 'result.success checked after service call',
    passed: successCheck,
    detail: successCheck ? undefined : 'result.success is never checked — connector errors may be silently swallowed',
  });

  return { featureId: '<feature-id>', checks };
}
```

### Code App-specific presence patterns

| Feature type | Checks to generate |
|---|---|
| **Dataverse operation** | `src/generated/services/<ApiName>Service.ts` exists AND is imported outside `src/generated/` |
| **Dataverse result** | `result.value` access AND `result.success` check in files calling the service |
| **Office365Users** | `src/generated/services/Office365UsersService.ts` exists + imported in `src/` |
| **SDK initialization** | `PowerProvider` or `initialize()` found in `src/App.tsx` or `src/main.tsx` |
| **Developer service wrapper** | `*Service.ts` in `src/services/` or `src/Services/` with expected method names |
| **Component mounted** | TSX file in `src/components/` or `src/pages/` matching feature name |
| **Generated model usage** | Import from `./generated/models/` in feature files |
| **Error handling** | `result.success === false` or `result.errorMessage` in files calling generated services |
| **Loading state** | `isLoading`, `isPending` (TanStack Query), or `useState` loading boolean |
| **Empty state** | Conditional render for empty results (`length === 0` or similar) |
| **power.config.json** | File exists and contains expected connector `dataSourceName` or `connectionId` |

> ⚠️ Never generate presence checks that grep for `webAPI.*`, `context.parameters`, or `ComponentFramework` — these will never match in a Code App.

---

## Step 5 — Generate Vitest Unit Tests

> ⛔ **This step is MANDATORY on every invocation.** Write real unit tests grounded in actual source code. Use `it.todo()` stubs only when a feature has no testable logic. Never skip this step — even on re-runs.

### Re-run behaviour
If `evals/unit/` already exists, **merge** — add tests for any new features, preserve passing tests for existing ones. Never delete existing passing test files.

### Grounding mandate — read source before writing any test

> ⛔ Tests that reference invented method names or field names compile and run but verify nothing. Every fabricated assertion destroys user trust.

**Before writing any `.test.ts` file, you MUST:**
1. `filesystem-directory_tree` on `src/generated/services/` and `src/lib/` (or `src/types/`)
2. Read each service file — extract static method names and `IOperationResult<T>` return shapes
3. Read `src/lib/types.ts` (or equivalent) — extract all entity interface field names
4. For component tests, read the relevant `src/screens/*.tsx` — identify which context values and service calls are used

> ⛔ If a source file cannot be found, write `it.todo()` stubs and flag in the delivery summary. Do NOT invent signatures.

### Always generate: `evals/unit/helpers/setup.ts`

```typescript
// evals/unit/helpers/setup.ts
// Vitest global setup — must exist even if empty
```

### Always generate: `evals/unit/helpers/mocks.ts`

> Code Apps use `@microsoft/power-apps` generated static service classes — **NOT** `context.webAPI.*`.

> ⚠️ **CRITICAL — Vitest 2.x:** Never use `vi.hoisted()`. All mock functions must be plain `vi.fn()` in the module body.

```typescript
// evals/unit/helpers/mocks.ts
// Power Apps Code App service mocks for Vitest
import { vi } from 'vitest';
import type { AppData } from '../../../src/lib/AppData';

/** Mock IOperationResult<T[]> for service.getAll() */
export function mockGetAll<T>(data: T[] = []) {
  return vi.fn().mockResolvedValue({ success: true, data, error: null });
}

/** Mock IOperationResult<T> for service.get() / .create() / .update() */
export function mockOperation<T>(value: T | null = null, success = true) {
  return vi.fn().mockResolvedValue({
    success,
    value,
    error: success ? null : { message: 'Mock error' },
  });
}

/** Mock AppData context value for renderWithAppData()
 *
 * ⛔ GROUNDING REQUIRED: Before writing this function, read src/lib/AppData.ts
 * and copy the REAL field names from the AppData interface.
 * The field list below is a TEMPLATE PLACEHOLDER — using invented field names
 * compiles but causes TypeScript errors in actual test files that import AppData.
 * Replace every field with the real ones from the project.
 */
export function createMockAppData(overrides?: Partial<AppData>): AppData {
  // Replace this object with REAL fields from the AppData interface in src/lib/AppData.ts
  return {
    loading: false,
    error: undefined,
    // <real_field_1>: [],
    // <real_field_2>: [],
    // <real_reload_method>: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AppData;
}
```

### Always generate: `evals/unit/helpers/factories.ts`

> ⛔ **Grounding required.** Read `src/generated/models/` and `src/lib/types.ts` BEFORE writing this file. Replace ALL placeholder comments with real field names from those files.

```typescript
// evals/unit/helpers/factories.ts
// GROUNDED: field names derived from src/generated/models/ and src/lib/types.ts
// One factory per Dataverse entity used in the project

// Replace <EntityName>, <EntityInterface>, <entity_primary_key>, and field names
// with REAL values read from src/generated/models/<EntityName>Model.ts
export function make<EntityName>(overrides?: Partial<<EntityInterface>>): <EntityInterface> {
  return {
    // Primary key — from model file (e.g. demo1_employeeid)
    '<entity_primary_key>': `mock-${Math.random().toString(36).slice(2)}`,
    // Fields — from interface in src/lib/types.ts or src/generated/models/
    // '<demo1_fieldname>': 'Test Value',
    ...overrides,
  } as <EntityInterface>;
}
```

### Always generate: `evals/vitest.config.ts`

Create in the `evals/` folder (NOT the project root):

> ⚠️ **Path anchoring is critical.** Vitest sets `root` to the config file's directory by default — which would be `evals/`. That makes all relative paths wrong. You MUST explicitly set `root` to the project root and use `resolve()` for `setupFiles` so paths are unambiguous regardless of how vitest is invoked.

```typescript
// evals/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');  // evals/ → project root

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    root: PROJECT_ROOT,
    setupFiles: [resolve(__dirname, 'unit/helpers/setup.ts')],
    include: ['evals/unit/**/*.test.ts?(x)'],
    reporters: [['verbose'], ['json', { outputFile: 'evals/results/vitest-results.json' }]],
    pool: 'threads',
    passWithNoTests: true,
  },
});
```

### Unit test file template (one per feature/module)

> ⛔ **Traceability rule — ID must be copied verbatim from manifest.json.**
> Every `it()` block name must start with the **exact `id` value from `evals/manifest.json`** for that feature — not a paraphrase, not a logical name, not the feature title slug. The runner uses this prefix to map test results to dashboard rows. If the ID doesn't match exactly, the dashboard shows "⏭ No tests" for that feature even though tests ran.
>
> **Before writing any test file:** open `evals/manifest.json`, find the feature's `"id"` field, and copy it character-for-character into every `it()` name for that feature.
>
> Add a traceability comment above each block:
> - With BRD: `// AC: <exact acceptance criterion text>`
> - Without BRD: `// Derived from: <ClassName>.<methodName>() — <what this code path does>`
>
> **After writing all test files:** grep each test file for each manifest feature ID to confirm at least one `it()` references it. If any manifest feature ID has zero matching `it()` names, fix it before delivering.

```typescript
// evals/unit/<FeatureName>.test.tsx
// AUTO-GENERATED by eval-generator-code-app
// Feature: <feature title>

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the service class BEFORE importing anything that uses it
// Replace path and class name with REAL values from src/generated/services/
vi.mock('../../src/generated/services/<ServiceClass>', () => ({
  <ServiceClass>: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    create: vi.fn().mockResolvedValue({ success: true, value: {} }),
    update: vi.fn().mockResolvedValue({ success: true, value: {} }),
  }
}));

import { <ServiceClass> } from '../../src/generated/services/<ServiceClass>';
import { make<EntityName> } from './helpers/factories';

describe('<feature-title> — <ServiceClass>', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // AC: <criterion> OR Derived from: <ServiceClass>.getAll() returns data array
  it('<feature-id>: getAll() returns data on success', async () => {
    const entity = make<EntityName>({ /* real field from types */ });
    (<any><ServiceClass>).getAll.mockResolvedValueOnce({ success: true, data: [entity] });

    const result = await <ServiceClass>.getAll();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].<real_primary_key_field>).toBe(entity.<real_primary_key_field>);
  });

  // AC: <criterion> OR Derived from: <ServiceClass>.create() creates record
  it('<feature-id>: create() is called with correct payload shape', async () => {
    const payload = make<EntityName>();
    await <ServiceClass>.create(payload as any);
    expect(<ServiceClass>.create).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  // Add it.todo for unimplemented criteria:
  // it.todo('<feature-id>: <unimplemented criterion description>');
});
```

### AppData context test (always generate for app-data-bootstrap feature)

```typescript
// evals/unit/AppData.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AppDataProvider, useAppData } from '../../src/lib/AppData';

// Mock all generated services — use REAL service class names from src/generated/services/
// Replace the 6 service imports with REAL names found in the project
vi.mock('../../src/generated/services/Demo1_employeesService', () => ({
  Demo1_employeesService: { getAll: vi.fn().mockResolvedValue({ success: true, data: [] }) }
}));
// ... repeat vi.mock() for each of the other 5 services

describe('AppData context', () => {
  it('app-data-bootstrap: loads all entities on mount', async () => {
    const wrapper = ({ children }: any) => <AppDataProvider>{children}</AppDataProvider>;
    const { result } = renderHook(() => useAppData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Assert each service was called — use REAL service class names
    const { Demo1_employeesService } = await import('../../src/generated/services/Demo1_employeesService');
    expect(Demo1_employeesService.getAll).toHaveBeenCalledTimes(1);
  });

  // AC: useAppData hook throws if used outside provider
  it('app-data-bootstrap: useAppData throws when used outside AppDataProvider', () => {
    expect(() => renderHook(() => useAppData())).toThrow();
  });
});
```

---

## Step 6 — Security Analysis

Perform static security analysis on `src/` on every eval run. No BRD required — 100% grounded in actual source code. Findings are file- and line-referenced.

### Security categories

> All checks are Code App-specific — `@microsoft/power-apps` SDK, generated services, Vite SPA patterns. No PCF patterns.

| ID | Category | Severity | What to detect |
|---|---|---|---|
| SEC-001 | OData Injection | Critical | OData filter strings built by string concatenation or template literal with user input |
| SEC-002 | XSS | Critical | `dangerouslySetInnerHTML` or direct `.innerHTML =` with potentially dynamic content |
| SEC-003 | Hardcoded Secret | Critical | `api_key`, `password`, `secret`, `token`, `client_secret` assigned a string literal ≥6 chars |
| SEC-004 | PII in Logs | High | `console.log/warn/error` referencing `email`, `userId`, `phone`, `token`, `Mail`, `DisplayName` etc. |
| SEC-005 | Error Disclosure | High | Raw `e.message`, `result.errorMessage`, or `String(e)` set directly into UI state |
| SEC-006 | Unsafe External Call | High | `fetch(` to a URL not on `*.dynamics.com`, `*.microsoft.com`, or `*.microsoftonline.com` |
| SEC-007 | Client-Side Auth Bypass | High | UI renders conditional on role/permission check but generated service write has no server-side guard |
| SEC-008 | PII in Browser Storage | Medium | `localStorage`/`sessionStorage.setItem` with PII-like key names |
| SEC-009 | Unvalidated Input to Generated Service | Medium | User input variable names passed directly into generated service method calls |
| SEC-010 | Sensitive Data in State | Low | `useState` holding `password`, `token`, `secret`, or `apiKey` |
| SEC-011 | Sensitive Data in Published Bundle | High | `import.meta.env.VITE_*` values with KEY/SECRET/TOKEN used in connector calls or rendered |
| SEC-012 | power.config.json Secret Scan | Critical | `power.config.json` contains string patterns matching credentials or secrets |
| SEC-013 | Vulnerable Dependencies | High | `npm audit` — known CVEs (high/critical) in installed packages |
| SEC-014 | Dynamic Code Execution | Critical | `eval(`, `new Function(`, `setTimeout`/`setInterval` with string argument |
| SEC-015 | Broader External HTTP | High | `axios`, `XMLHttpRequest`, or `$.ajax` calls to non-Microsoft external URLs |
| SEC-016 | Sensitive URL Parameters | High | `useSearchParams`, route params, or URL strings exposing token/auth/userId/secret |

### Always generate: `evals/runner/security-runner.ts`

> ⚠️ CRITICAL: Copy the code below EXACTLY. Do NOT simplify or restructure the scan patterns.

```typescript
#!/usr/bin/env tsx
// evals/runner/security-runner.ts
// Static security analysis — outputs SecurityResult JSON to stdout

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');  // evals/runner → evals → project
const SRC = join(ROOT, 'src');

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface SecurityFinding {
  id: string; category: string; severity: Severity;
  file: string; line: number; snippet: string; detail: string;
}

interface SecurityResult {
  layer: 'security';
  passed: number; failed: number; skipped: number;
  findings: SecurityFinding[];
}

const findings: SecurityFinding[] = [];
const srcFiles = globSync(`${SRC}/**/*.ts?(x)`);

function scan(id: string, category: string, severity: Severity, pattern: RegExp, detail: string, exclude?: RegExp) {
  for (const file of srcFiles) {
    let content: string;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (pattern.test(line) && !(exclude && exclude.test(line))) {
        findings.push({ id, category, severity,
          file: file.replace(ROOT + '\\', '').replace(ROOT + '/', ''),
          line: i + 1, snippet: line.trim().slice(0, 120), detail });
      }
    });
  }
}

// SEC-001: OData Injection
scan('SEC-001', 'OData Injection', 'critical',
  /(\$filter.*['"`]\s*\+|\$filter.*\$\{)/,
  'OData $filter built by string concatenation or template literal. Sanitize inputs or use fixed filter strings.');

// SEC-002: XSS
scan('SEC-002', 'XSS', 'critical',
  /dangerouslySetInnerHTML|\.innerHTML\s*=/,
  'Direct HTML injection. Sanitize with DOMPurify or avoid raw HTML insertion entirely.');

// SEC-003: Hardcoded secrets
// Exclude: (1) comment lines, (2) values that are purely alphabetical/kebab-case — real credentials
// always contain digits or special chars. This prevents false positives on TypeScript object maps
// where property keys like `token` hold UI label strings like 'skipToken' or 'badge-token'.
scan('SEC-003', 'Hardcoded Secret', 'critical',
  /(?:apikey|api_key|password|secret|token|client_secret)\s*[:=]\s*['"`][^'"`\s]{6,}/i,
  'Possible hardcoded credential. Move to environment variables or Azure Key Vault.',
  /^\s*\/\/|(?:apikey|api_key|password|secret|token|client_secret)\s*[:=]\s*['"`][a-zA-Z$_][a-zA-Z$_\-]*['"`]/i);

// SEC-004: PII in console logs
// Exclude: console.log("...") calls where the PII keyword appears ONLY inside a single string literal
// (e.g. "Email field is required") — those are UI messages, not variable dumps.
scan('SEC-004', 'PII in Logs', 'high',
  /console\.(log|warn|error|debug)\b.*\b(email|mail|userId|phone|address|password|token|DisplayName)\b/i,
  'Sensitive data written to console. Remove or mask PII before logging.',
  /console\.(log|warn|error|debug)\s*\(\s*(?:'[^']*'|"[^"]*"|`[^`]*`)\s*\)/i);

// SEC-005: Raw error surfaced to UI state
scan('SEC-005', 'Error Disclosure', 'high',
  /set\w+\(\s*(e\.message|String\(e\)|e\.toString\(\))/,
  'Raw error surfaced to UI state. Show a generic user-facing message instead.');

// SEC-006: fetch() to non-Microsoft external URLs
scan('SEC-006', 'Unsafe External Call', 'high',
  /fetch\s*\(\s*['"`]https?:\/\//,
  'fetch() to an external URL. Confirm it is an approved Microsoft/Power Platform endpoint.',
  /\.dynamics\.com|\.microsoft\.com|\.microsoftonline\.com/);

// SEC-007: Client-side auth bypass
scan('SEC-007', 'Client-Side Auth Bypass', 'high',
  /\b(isAdmin|userRole|hasPermission|canEdit|canDelete|isOwner)\b.*&&.*Service\.(delete|update|create|write)/i,
  'Role check in UI but no server-side guard before service write. Authenticated users may bypass the UI.');

// SEC-008: PII in browser storage
// Removed bare 'user' — too generic (matches user-preferences, user-theme etc.)
// Kept specific PII/auth key names only.
scan('SEC-008', 'PII in Browser Storage', 'medium',
  /(localStorage|sessionStorage)\.setItem\s*\([^,]*(?:email|userId|userEmail|userName|token|auth|authToken|mail|profile|password|DisplayName)/i,
  'PII or auth data in localStorage/sessionStorage. Vulnerable to XSS exfiltration.');

// SEC-009: Unvalidated user input to generated service calls
// Removed 'value' and 'text' — too generic (match every service call with common param names).
// Kept unambiguously user-input-specific terms only.
scan('SEC-009', 'Unvalidated Input to Generated Service', 'medium',
  /Service\.\w+\s*\([^)]*\b(input|userInput|searchTerm|searchQuery|filterValue|rawInput)\b/i,
  'User input variable in generated service call. Validate and sanitize before passing to connector.');

// SEC-010: Sensitive variable names in useState
scan('SEC-010', 'Sensitive Data in State', 'low',
  /useState[^)]*\b(password|token|secret|apiKey|api_key)\b/i,
  'Sensitive data may be stored in React component state. Consider secure alternatives.');

// SEC-011: import.meta.env values bundled in public JS
scan('SEC-011', 'Sensitive Data in Published Bundle', 'high',
  /import\.meta\.env\.VITE_\w*(KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|API)/i,
  'import.meta.env.VITE_* values are bundled into public JS at build time. Never store secrets in VITE_ env vars.');

// SEC-014: Dynamic code execution
scan('SEC-014', 'Dynamic Code Execution', 'critical',
  /\beval\s*\(/,
  'eval() executes a string as code. If the string can contain user-controlled content, this is a code injection vulnerability. Replace with a safer alternative.');

scan('SEC-014', 'Dynamic Code Execution', 'critical',
  /new\s+Function\s*\(/,
  'new Function() constructs executable code from a string — equivalent to eval(). Avoid or ensure the source string is never user-controlled.');

scan('SEC-014', 'Dynamic Code Execution', 'high',
  /(setTimeout|setInterval)\s*\(\s*['"`]/,
  'setTimeout/setInterval with a string argument evaluates it like eval(). Pass a function reference instead: setTimeout(() => doSomething(), delay).');

// SEC-015: Broader external HTTP clients
scan('SEC-015', 'Unsafe External HTTP Client', 'high',
  /axios\s*\.\s*(get|post|put|patch|delete|request)\s*\(\s*['"`]https?:\/\//i,
  'axios call to an external URL. Confirm it is an approved Microsoft/Power Platform endpoint.',
  /\.dynamics\.com|\.microsoft\.com|\.microsoftonline\.com/);

scan('SEC-015', 'Unsafe External HTTP Client', 'high',
  /new\s+XMLHttpRequest\s*\(\s*\)/,
  'XMLHttpRequest instantiation detected. Verify the request target is an approved Microsoft/Power Platform endpoint — use the generated service classes instead.',
  /\.dynamics\.com|\.microsoft\.com|\.microsoftonline\.com/);

scan('SEC-015', 'Unsafe External HTTP Client', 'high',
  /\$\s*\.\s*(ajax|get|post)\s*\(/,
  'jQuery HTTP call detected. jQuery is unexpected in a Code App — verify the target URL and consider replacing with generated service classes.');

// SEC-016: Sensitive data in URL parameters
scan('SEC-016', 'Sensitive URL Parameters', 'high',
  /useSearchParams[^;]*\b(token|auth|apikey|secret|password|credential)\b/i,
  'Sensitive parameter name read from URL query string. Tokens and credentials must never appear in URLs — they are logged by browsers, proxies, and servers.');

scan('SEC-016', 'Sensitive URL Parameters', 'high',
  /[?&](token|auth|apikey|api_key|secret|password|userId|user_id|credential)=/i,
  'Sensitive parameter embedded in a URL string. Credentials and user identifiers must not be passed as URL query parameters.');

const ALL_CATEGORIES = ['SEC-001','SEC-002','SEC-003','SEC-004','SEC-005','SEC-006','SEC-007','SEC-008','SEC-009','SEC-010','SEC-011','SEC-014','SEC-015','SEC-016'];

// SEC-012: power.config.json secret scan
try {
  const configContent = readFileSync(join(ROOT, 'power.config.json'), 'utf-8');
  const secretPattern = /(?:password|secret|token|apikey|api_key|client_secret|connectionstring)\s*[:=]\s*['"`][^'"`\s]{6,}/i;
  const labelPattern  = /(?:password|secret|token|apikey|api_key|client_secret|connectionstring)\s*[:=]\s*['"`][a-zA-Z$_][a-zA-Z$_\-]*['"`]/i;
  if (secretPattern.test(configContent) && !labelPattern.test(configContent)) {
    findings.push({
      id: 'SEC-012', category: 'power.config.json Secret', severity: 'critical',
      file: 'power.config.json', line: 0,
      snippet: 'Credential pattern detected in power.config.json',
      detail: 'power.config.json is committed to source control. Never store secrets here.',
    });
  }
} catch { /* power.config.json not found — skip */ }

// SEC-013: npm audit — known CVEs in installed dependencies
// npm audit exits with code 1 when vulnerabilities are found — catch is expected
try {
  const { execSync } = await import('child_process');
  const auditOut = execSync('npm audit --json', {
    cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 60_000,
  });
  const audit = JSON.parse(auditOut);
  const vulns = audit.vulnerabilities ?? {};
  for (const [pkg, v] of Object.entries(vulns as Record<string, any>)) {
    const sev: Severity = (v.severity === 'critical' || v.severity === 'high') ? v.severity : v.severity === 'moderate' ? 'medium' : 'low';
    if (sev === 'critical' || sev === 'high') {
      const via = (v.via ?? []).filter((x: any) => typeof x === 'object');
      const cve = via.map((x: any) => x.title ?? x.url ?? '').filter(Boolean).join(', ') || 'see npm audit for details';
      findings.push({
        id: 'SEC-013', category: 'Vulnerable Dependency', severity: sev,
        file: 'package.json', line: 0,
        snippet: `${pkg}@${v.range ?? 'unknown'} — ${sev}`,
        detail: `Known vulnerability in dependency "${pkg}". ${cve}. Run npm audit fix or update to a patched version.`,
      });
    }
  }
} catch (auditErr: any) {
  // npm audit exits 1 when vulns found — re-parse from stderr/stdout if available
  try {
    const out = auditErr.stdout ?? auditErr.output?.[1] ?? '';
    if (out) {
      const audit = JSON.parse(out);
      const vulns = audit.vulnerabilities ?? {};
      for (const [pkg, v] of Object.entries(vulns as Record<string, any>)) {
        const sev: Severity = v.severity === 'critical' ? 'critical' : v.severity === 'high' ? 'high' : v.severity === 'moderate' ? 'medium' : 'low';
        if (sev === 'critical' || sev === 'high') {
          const via = (v.via ?? []).filter((x: any) => typeof x === 'object');
          const cve = via.map((x: any) => x.title ?? x.url ?? '').filter(Boolean).join(', ') || 'see npm audit for details';
          findings.push({
            id: 'SEC-013', category: 'Vulnerable Dependency', severity: sev,
            file: 'package.json', line: 0,
            snippet: `${pkg}@${v.range ?? 'unknown'} — ${sev}`,
            detail: `Known vulnerability in dependency "${pkg}". ${cve}. Run npm audit fix or update to a patched version.`,
          });
        }
      }
    }
  } catch { /* npm audit not available or no package.json — skip */ }
}

const hitIds = new Set(findings.map(f => f.id));
const result: SecurityResult = {
  layer: 'security',
  passed: ALL_CATEGORIES.filter(c => !hitIds.has(c)).length,
  failed: hitIds.size,
  skipped: 0,
  findings,
};
process.stdout.write(JSON.stringify(result));
```

---

## Step 7 — Generate the Eval Runner

> ⚠️ CRITICAL: Copy the code below EXACTLY.

Create `evals/runner/run-evals.ts`:

```typescript
#!/usr/bin/env tsx
// evals/runner/run-evals.ts
// Orchestrates all eval layers and writes evals/results/latest.json

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');         // evals/runner → evals
const PROJECT_ROOT = join(ROOT, '..');      // evals → project root
const RESULTS_DIR = join(ROOT, 'results');

interface LayerResult {
  layer: 'presence' | 'unit' | 'security';
  passed: number; failed: number; skipped: number;
  details?: Array<{ featureId: string; name: string; status: 'pass' | 'fail' | 'skip'; detail?: string }>;
  findings?: any[];
}

interface EvalResults {
  timestamp: string;
  layers: LayerResult[];
  summary: {
    totalFeatures: number;
    allPresent: number;
    allBehavioral: number;
    openBRDGaps: string[];
    blockers: string[];
    securityFindings: Array<{ id: string; severity: string; category: string; file: string; line: number; detail: string }>;
  };
}

mkdirSync(RESULTS_DIR, { recursive: true });

const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf-8'));

const results: EvalResults = {
  timestamp: new Date().toISOString(),
  layers: [],
  summary: {
    totalFeatures: manifest.features.length,
    allPresent: 0,
    allBehavioral: 0,
    openBRDGaps: manifest.openBRDGaps ?? [],
    blockers: [],
    securityFindings: [],
  },
};

// ── Layer 1: Presence Checks ──────────────────────────────────────────────────
console.log('\n🔍 Running presence checks...');
try {
  const presenceOut = execSync('npx tsx runner/presence-runner.ts', { cwd: ROOT, encoding: 'utf-8', timeout: 60_000 });
  const presenceResult: LayerResult = JSON.parse(presenceOut);
  results.layers.push(presenceResult);
  console.log(`  ✅ ${presenceResult.passed} passed  ❌ ${presenceResult.failed} failed`);
} catch (e) {
  console.error('  Presence checks failed to run:', e);
  results.layers.push({ layer: 'presence', passed: 0, failed: 1, skipped: 0, details: [] });
}

// ── Layer 2: Vitest Unit Tests ─────────────────────────────────────────────────
// IMPORTANT: execSync and JSON reading MUST be in separate try-catches.
// Vitest exits with code 1 when any tests fail or are todo — that must NOT prevent
// reading the JSON output file which is always written before vitest exits.
console.log('\n🧪 Running Vitest unit tests...');
try {
  execSync('npx vitest run --config evals/vitest.config.ts --passWithNoTests', {
    cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 120_000,
  });
} catch { /* vitest exits 1 on failures/todos — expected, JSON is still written */ }

const vitestPath = join(RESULTS_DIR, 'vitest-results.json');
if (existsSync(vitestPath)) {
  try {
    const vitestData = JSON.parse(readFileSync(vitestPath, 'utf-8'));
    const unitDetails: LayerResult['details'] = [];
    for (const suite of vitestData.testResults ?? []) {
      for (const t of suite.assertionResults ?? []) {
        const match = t.fullName.match(/([\w-]+):\s*(.+)$/);
        const featureId = match?.[1] ?? 'unknown';
        const name = match?.[2] ?? t.fullName;
        unitDetails!.push({
          featureId,
          name,
          status: t.status === 'passed' ? 'pass' : (t.status === 'pending' || t.status === 'todo') ? 'skip' : 'fail',
          detail: t.failureMessages?.join('\n') || undefined,
        });
      }
    }
    results.layers.push({
      layer: 'unit',
      passed: vitestData.numPassedTests ?? 0,
      failed: vitestData.numFailedTests ?? 0,
      skipped: vitestData.numTodoTests ?? 0,
      details: unitDetails,
    });
    console.log(`  🧪 ${vitestData.numPassedTests ?? 0} passed  ❌ ${vitestData.numFailedTests ?? 0} failed  ⏭ ${vitestData.numTodoTests ?? 0} todo`);
  } catch {
    results.layers.push({ layer: 'unit', passed: 0, failed: 1, skipped: 0, details: [] });
  }
} else {
  console.log('  ⚠️  No vitest-results.json found — evals/unit/ may be empty or missing');
  results.layers.push({ layer: 'unit', passed: 0, failed: 0, skipped: 0, details: [] });
}

// ── Layer 3: Security Analysis ────────────────────────────────────────────────
console.log('\n🔒 Running security analysis...');
try {
  const secOut = execSync('npx tsx runner/security-runner.ts', { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 60_000 });
  const secResult = JSON.parse(secOut);
  results.layers.push(secResult);
  const critHigh = (secResult.findings ?? []).filter((f: any) => f.severity === 'critical' || f.severity === 'high').length;
  console.log(`  🔒 ${(secResult.findings ?? []).length} finding(s) — ${critHigh} critical/high`);
} catch (e) {
  console.error('  Security analysis failed to run:', e);
  results.layers.push({ layer: 'security', passed: 0, failed: 1, skipped: 0, findings: [] } as any);
}

// ── Compute summary ───────────────────────────────────────────────────────────
const allFailed = (results.layers as any[])
  .filter(l => l.layer === 'presence')
  .flatMap(l => (l.details ?? []).filter((d: any) => d.status === 'fail'));
results.summary.blockers = allFailed.map((d: any) => `${d.featureId}: ${d.name}`);
results.summary.securityFindings = ((results.layers as any[]).find(l => l.layer === 'security')?.findings ?? []);
results.summary.allPresent = (results.layers as any[]).find(l => l.layer === 'presence')?.passed ?? 0;
results.summary.allBehavioral = (results.layers as any[]).find(l => l.layer === 'unit')?.passed ?? 0;

const latestPath = join(RESULTS_DIR, 'latest.json');
writeFileSync(latestPath, JSON.stringify(results, null, 2));
console.log('\n📊 Results written to evals/results/latest.json');

// ── Bake results into dashboard HTML ─────────────────────────────────────────
const dashboardPath = join(ROOT, 'dashboard', 'index.html');
if (existsSync(dashboardPath)) {
  let html = readFileSync(dashboardPath, 'utf-8');
  const baked = JSON.stringify(results, null, 2);
  html = html.replace(/\/\* BAKED DATA[\s\S]*?END BAKED DATA \*\//, `/* BAKED DATA — replaced by npm run eval — do not edit manually */\nvar DATA = ${baked};\n/* END BAKED DATA */`);
  writeFileSync(dashboardPath, html);
  console.log('📊 Dashboard updated with baked results.');
}

// ── Exit code ─────────────────────────────────────────────────────────────────
const totalFailed = results.layers.reduce((sum, l) => sum + l.failed, 0);
if (totalFailed > 0) {
  console.error(`\n❌ ${totalFailed} eval(s) failed.`);
  process.exit(1);
}
console.log('\n✅ All evals passed.');
```

Also create `evals/runner/presence-runner.ts` using the exact template below:

```typescript
#!/usr/bin/env tsx
// evals/runner/presence-runner.ts
// Runs all presence checks and outputs a LayerResult JSON to stdout.

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRESENCE_DIR = join(__dirname, '..', 'presence');

interface CheckResult {
  featureId: string;
  checks: Array<{ name: string; passed: boolean; detail?: string }>;
}

interface LayerResult {
  layer: 'presence';
  passed: number; failed: number; skipped: number;
  details: Array<{ featureId: string; name: string; status: 'pass' | 'fail' | 'skip'; detail?: string }>;
}

const checkFiles = globSync(`${PRESENCE_DIR}/*.check.ts`).sort();
const details: LayerResult['details'] = [];
let passed = 0, failed = 0;

for (const file of checkFiles) {
  try {
    const mod = await import(file);
    const result: CheckResult = mod.check();
    for (const c of result.checks) {
      if (c.passed) {
        passed++;
        details.push({ featureId: result.featureId, name: c.name, status: 'pass' });
      } else {
        failed++;
        details.push({ featureId: result.featureId, name: c.name, status: 'fail', detail: c.detail });
      }
    }
  } catch (e: any) {
    failed++;
    details.push({ featureId: file, name: 'runner error', status: 'fail', detail: String(e?.message ?? e) });
  }
}

const result: LayerResult = { layer: 'presence', passed, failed, skipped: 0, details };
process.stdout.write(JSON.stringify(result));
```

---

## Step 8 — Generate Results Dashboard

> ⛔ **DO NOT write your own dashboard HTML.** The dashboard template is a pre-built, tested file. Your job is to READ it, make exactly three substitutions, and WRITE it. Nothing else.

### Step 7a — Read the template file

Read the template using the view tool:
```
path: ~/.copilot/m-skills/eval-generator-code-app/dashboard-template.html
```

Expand `~` to the user's actual home directory (e.g. `C:\Users\<username>`). Use PowerShell if needed: `(Resolve-Path ~).Path`.

### Step 7b — Make exactly three substitutions

1. Replace every occurrence of `PROJECT_NAME` with the project's directory basename (e.g. `WorkshopsApp`)
2. Replace `ITERATION_NUMBER` with the current iteration number (1 for first run, increment from snapshot count for re-runs)
3. Replace the FEATURES placeholder line:
   ```
     /* GENERATED — replace with actual features: { id, title, priority, note? } */
   ```
   with the actual feature array built from the manifest, one object per line:
   ```javascript
   { id: 'user-search', title: 'User Search', priority: 'high' },
   { id: 'dataverse-read', title: 'Dataverse Read', priority: 'high', note: 'Not yet implemented' },
   ```

### Step 7c — Write the result to `evals/dashboard/index.html`

Write the substituted content to `evals/dashboard/index.html` in the project.

### Step 7d — Self-verify (THREE checks, all mandatory)

After writing, verify all three:

1. Grep the output file for `fetch(`. If ANY match is found: **delete the file immediately and repeat from 7a**.
2. Grep the output file for `FEATURES = [` — confirm the next non-whitespace line is NOT `/* GENERATED`. If the placeholder is still present, the substitution failed — delete the file and repeat from 7a.
3. Grep the output file for `PROJECT_NAME` — if still present, the project name substitution failed — delete and repeat.

### Why this approach

The dashboard opens as a `file://` URL. Browsers block ALL network requests (`fetch`, `XMLHttpRequest`) on `file://`. The template uses `var DATA` baked by the runner at eval time — no runtime loading needed, no server required.

---

## Step 9 — Update `package.json` Scripts

Append to the project's `package.json` scripts section:

```json
{
  "scripts": {
    "eval": "tsx evals/runner/run-evals.ts",
    "eval:presence": "tsx evals/runner/presence-runner.ts",
    "eval:unit": "vitest run --config evals/vitest.config.ts",
    "eval:security": "tsx evals/runner/security-runner.ts",
    "eval:dashboard": "npx open-cli evals/dashboard/index.html"
  }
}
```

Also add dev dependencies if not already present:
```json
{
  "devDependencies": {
    "tsx": "^4.11.0",
    "glob": "^11.0.0",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0"
  }
}
```

After editing `package.json`, run `npm install` to apply.

### Run the eval suite immediately after scaffolding

> ⚠️ CRITICAL: After `npm install` completes, **always run the eval suite** so the dashboard is populated with real results on first open.

Run in the project root:
```bash
npx tsx evals/runner/run-evals.ts
```

---

## Step 10 — Deliver Summary in Chat

After all files are written, present:

### Files Written
| Path | Purpose |
|---|---|
| `evals/manifest.json` | Feature registry |
| `evals/presence/<id>.check.ts` | Presence checks (one per feature) |
| `evals/runner/run-evals.ts` | Eval orchestrator |
| `evals/runner/presence-runner.ts` | Presence runner |
| `evals/runner/security-runner.ts` | Security analysis runner |
| `evals/unit/helpers/mocks.ts` | Service mock helpers |
| `evals/unit/helpers/factories.ts` | Test data factories (grounded in model files) |
| `evals/unit/helpers/setup.ts` | Vitest global setup |
| `evals/unit/<FeatureName>.test.tsx` | Unit tests (one per feature/module) |
| `evals/vitest.config.ts` | Vitest configuration |
| `evals/dashboard/index.html` | Results dashboard |

### Feature Coverage Table
| Feature ID | Title | Priority | Presence | Unit | Security |
|---|---|---|---|---|---|
| `user-search` | User Search | High | ✅ Generated | ✅ Generated | ✅ Scanned |
| `dataverse-read` | Dataverse Read | High | ✅ Generated | ⚠️ Stub | ✅ Scanned |

> ⚠️ = feature not yet implemented in `src/` — tests written as `it.todo`

### Running Evals
```bash
npm run eval           # run all layers (presence + unit + security)
npm run eval:presence  # presence checks only
npm run eval:unit      # Vitest unit tests only
npm run eval:security  # security analysis only
```

---

## Mandatory Artifact Checklist — NEVER SKIP

> ⛔ STOP before delivering the summary in Step 9. Verify **every** file below was written in this invocation.

| # | File | Must exist? |
|---|---|---|
| 1 | `evals/manifest.json` | **ALWAYS** |
| 2 | `evals/presence/<id>.check.ts` (one per feature) | **ALWAYS** |
| 3 | `evals/unit/helpers/mocks.ts` | **ALWAYS** |
| 4 | `evals/unit/helpers/factories.ts` | **ALWAYS** |
| 5 | `evals/unit/helpers/setup.ts` | **ALWAYS** |
| 6 | `evals/unit/<FeatureName>.test.tsx` (one or more) | **ALWAYS** |
| 7 | `evals/vitest.config.ts` | **ALWAYS** |
| 8 | `evals/runner/run-evals.ts` | **ALWAYS** |
| 9 | `evals/runner/presence-runner.ts` | **ALWAYS** |
| 10 | `evals/runner/security-runner.ts` | **ALWAYS** |
| 11 | `evals/dashboard/index.html` | **ALWAYS** — read from dashboard-template.html, NEVER write from scratch |

Do not substitute, skip, or defer any item. If `src/` is empty, write presence checks that return `passed: false` with a clear detail message.

---

## Non-Negotiable Quality Rules

- ✅ BRD is **optional**. When absent, features are derived from code review (Step 1b). Eval generation always proceeds.
- ✅ `evals/manifest.json` is always written — it is the source of truth.
- ✅ `evals/dashboard/index.html` is ALWAYS written — use the exact template from Step 7. Never skip it.
- ✅ Every feature in the manifest gets a presence check file.
- ✅ Presence checks use ESM `fileURLToPath(import.meta.url)` anchoring — **never `process.cwd()`**.
- ✅ After all files are written and `npm install` completes, ALWAYS run `npx tsx evals/runner/run-evals.ts`.
- ✅ Presence checks must grep actual patterns from the project — no fabricated method names.
- ❌ Never reference `context.webAPI.*`, `context.parameters`, or `ComponentFramework` in any generated eval file — these are PCF patterns, not Code Apps.
- ❌ Never fabricate file paths or method names. Always glob/grep `src/` first.
- ❌ Never read entire large source files — use `view_range` + targeted `grep`.
- ✅ `evals/unit/` folder with at least one `.test.tsx` file is ALWAYS created — even if all tests are `it.todo()` stubs.
- ❌ **Never skip unit test generation because `evals/` or `evals/unit/` already exists.** On re-runs, add missing unit test files; on first runs, always create them. "Merge" means ADD, never SKIP.
- ✅ `evals/vitest.config.ts` is ALWAYS created inside the `evals/` folder (never at project root) — with `root: PROJECT_ROOT` and `resolve()` for setupFiles.
- ✅ Every `it()` block name starts with the **exact `id` from `evals/manifest.json`** — copied verbatim, not paraphrased. Verify after writing: grep each test file for each manifest feature ID. Any manifest ID with zero hits = broken dashboard mapping.
- ✅ Every `it()` block name starts with `<feature-id>: ` — required for dashboard mapping.
- ✅ All test files must have valid TypeScript syntax — no pseudo-code.
- ❌ Never use `vi.hoisted()` — causes silent failures in Vitest 2.x.
- ❌ Never invent service method names, entity names, or field names in tests — read `src/` first.
- ❌ Never generate `.github/workflows/` — CI/CD is out of scope.
- ❌ **Never use `fetch()`, `XMLHttpRequest`, or any async data loading in the dashboard.** Browsers block all network requests on `file://`.
- ❌ Never invent your own dashboard HTML. Read the template from Step 7 verbatim — every time.

---

## Error Handling

| Situation | Action |
|---|---|
| Not a Code App (missing `power.config.json` and SDK dep) | Warn user, ask to confirm path or continue |
| **No BRD / requirements doc provided** | **Run Step 1b (code review) — never block or ask again** |
| Requirements doc can't be parsed | Ask user to describe features directly in chat |
| `src/` empty or missing | Generate skeleton manifest + placeholder presence checks — **still write all mandatory artifacts** |
| Connector never used in `src/` | Mark connector features as `not_found` — presence checks report `passed: false` |
| `package.json` missing `tsx`/`glob` | Add dev deps and run `npm install` |
| Existing `evals/` directory | **Unit tests:** Always follow Step 5 merge rule — add test files for new features, preserve passing ones. NEVER skip unit test generation because `evals/` already exists, even if `evals/unit/` is missing entirely. **Presence/manifest:** Ask user: overwrite / merge / abort |

---

## Invocation Examples

```
/eval-generator-code-app
Generate evals for my Code App at C:\projects\my-code-app using requirements at C:\docs\BRD.md
Eval my code app against the current plan.md
Check feature completeness for the code app in my current working directory
```
