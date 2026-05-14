# Eval Generator — Technical Deep Dive

> How the skill works under the hood: execution flow, file generation, runner architecture, dashboard data pipeline, and known constraints.

---

## Execution Overview

When invoked, the skill executes ten sequential steps. Each step either reads from disk, writes files, or runs shell commands. The entire execution happens inside a single AI coding session (GitHub Copilot, Claude Code, or compatible AI assistant) — no background processes, no server, no network calls (except optional BRD retrieval from OneDrive).

```
Step 0   → Snapshot previous results
Step 0b  → Collect inputs (BRD path, project root, mode)
Step 1   → Read BRD (or fall back to code-review at Step 1b)
Step 2   → Parse features → write evals/manifest.json
Step 3   → Audit source tree (glob + grep)
Step 4   → Write evals/presence/<id>.check.ts (one per feature)
Step 5   → Write evals/unit/<feature>.test.tsx + helpers
Step 6   → Write evals/runner/security-runner.ts
Step 7   → Write evals/runner/presence-runner.ts + run-evals.ts
Step 7b  → Read dashboard-template.html, substitute, write evals/dashboard/index.html
Step 9   → Patch package.json scripts (add "eval": "tsx evals/runner/run-evals.ts")
Step 10  → Run npm run eval (or instruct user to run it)
```

---

## Step 0 — Snapshot Previous Results

Before any file is modified, the runner checks for `evals/results/latest.json`. If present:

1. Count files matching `evals/results/snapshots/iter-*.json` → determines N (next iteration = count + 1)
2. Copy `latest.json` → `evals/results/snapshots/iter-<N>-<ISO>.json`
3. Append to `evals/results/snapshots/index.json`

This preserves a full audit trail. The dashboard reads all snapshots to render the "Current Run" comparison arrows.

---

## Step 1b — Code-Review Fallback (No BRD)

When no requirements document is provided, the skill derives features from the source tree using:

| Signal | Action |
|---|---|
| `src/pages/**/*.tsx` | One feature per page component |
| `src/components/**/*.tsx` | One feature per significant component |
| `src/services/**/*.ts` | One feature per service class (not generated) |
| `src/hooks/use*.ts` | One feature per hook that calls a connector |
| `from '.*generated/services/'` | Which connectors are wired up |
| `useQuery\|useMutation` | Async data-fetching features |
| `<ApiName>Service\.\w+(` | Specific Dataverse/connector operations |

Each discovered unit becomes a `Feature` object with auto-generated `id`, `title`, `description`, `acceptance_criteria`, `priority`, and `connectors` fields.

`manifest.json` is written with `"generatedFrom": "code-review"`.

**Re-run behaviour:** Step 1b runs again on every invocation without a BRD. Existing feature IDs are matched and their `presence_status` is preserved. New features discovered since the last run are added.

---

## Step 2 — Feature Manifest

`evals/manifest.json` is the single source of truth for feature IDs. Every downstream artifact (presence check files, unit test `it()` names, dashboard FEATURES array) must use the exact `id` values from this file verbatim.

The SQL session database tracks features during execution:
```sql
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY, title TEXT, description TEXT,
  acceptance_criteria TEXT, priority TEXT DEFAULT 'medium',
  connectors TEXT, presence_status TEXT DEFAULT 'pending',
  mapped_files TEXT
);
```

---

## Step 3 — Source Audit

### 3a. Code App fingerprint verification

The skill confirms this is a Code App (not a PCF component) by checking:

- `power.config.json` exists → created by `npx power-apps init`
- `package.json` has `@microsoft/power-apps` (not `@microsoft/powerapps-component-framework`)
- `vite.config.ts` references `@microsoft/power-apps-vite`
- `src/generated/` exists → connectors have been added

If `@microsoft/powerapps-component-framework` is detected, execution stops with a clear error.

### 3b. Connector detection patterns

All grep patterns are Code App-specific:

```
from '.*generated/services/<ApiName>Service'  → connector imported
<ApiName>Service\.\w+(                         → service method called
result\.value                                  → Dataverse result accessed
result\.data                                   → standard connector result accessed
result\.success                                → error handling present
result\.errorMessage                           → error handling present
useQuery|useMutation                           → TanStack Query usage
PowerProvider|initialize\(\)                   → SDK initialised
```

PCF patterns (`context.webAPI.*`, `context.parameters`, `ComponentFramework`) are never grepped — they do not exist in Code Apps.

---

## Step 4 — Presence Check Files

Each file follows this structure:

```typescript
// evals/presence/<feature-id>.check.ts
const PROJECT_ROOT = join(__dirname, '..', '..');  // anchored via fileURLToPath
const SRC = join(PROJECT_ROOT, 'src');
const GENERATED = join(PROJECT_ROOT, 'src', 'generated');

export function check(): PresenceResult {
  // Checks are individual assertions: existsSync, readFileSync + regex test
  // Each check: { name: string; passed: boolean; detail?: string }
  return { featureId: '<id>', checks };
}
```

**Path anchoring:** `__dirname` is derived via `fileURLToPath(import.meta.url)` (ESM-safe). All paths use `join()` from the anchored root — never relative `./` paths that depend on the working directory.

**Presence runner:** Imports all `.check.ts` files via dynamic ESM `import()`, calls `.check()` on each, flattens results into a `LayerResult` JSON:

```typescript
interface LayerResult {
  layer: 'presence';
  passed: number; failed: number; skipped: number;
  details: Array<{ featureId: string; name: string; status: 'pass'|'fail'|'skip'; detail?: string }>;
}
```

---

## Step 5 — Unit Tests (Vitest)

### File layout

```
evals/unit/
  helpers/
    setup.ts          → @testing-library/jest-dom matchers, global mocks
    mocks.ts          → vi.mock() calls for generated services + SDK
    factories.ts      → createMock<EntityName>() helpers grounded in actual src/generated/models/
  <Feature>.test.tsx  → one file per feature group
```

### Vitest configuration — the path-anchoring critical rule

`evals/vitest.config.ts` sets `root` explicitly:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

export default defineConfig({
  root: PROJECT_ROOT,           // ← critical: Vitest resolves all paths from here
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'unit/helpers/setup.ts')],  // ← absolute via resolve()
    include: ['evals/unit/**/*.test.{ts,tsx}'],
  },
});
```

**Why this matters:** Without `root: PROJECT_ROOT`, Vitest defaults `root` to the config file's directory (`evals/`). All relative paths in `setupFiles` and `include` then resolve from `evals/` — so `'./evals/unit/helpers/setup.ts'` becomes `evals/evals/unit/helpers/setup.ts`, which doesn't exist. Tests never run and the error is cryptic.

### it() naming convention — traceability

Every `it()` description MUST begin with the exact feature ID from `manifest.json`, followed by a colon:

```typescript
it('leave-request-submit: disables submit button while save is pending', ...)
it('leave-request-submit: shows validation error for missing date', ...)
```

The runner extracts the feature ID using `/([\w-]+):\s*(.+)$/` and uses it to map test results to dashboard rows. If the feature ID doesn't match exactly, tests run and pass but show "⏭ No tests" in the dashboard per feature.

**Post-generation verification:** After writing all test files, the skill greps each test file for each manifest feature ID to confirm traceability is intact before proceeding.

### createMockAppData warning

`useAppData()` tests require a mock for the `AppData` interface. The skill grounds this in `src/lib/AppData.ts` (read at generation time) — never inventing field names. Invented fields cause TypeScript errors at test runtime.

---

## Step 6 — Security Runner

`evals/runner/security-runner.ts` runs 16 checks in three passes:

### Pass 1 — Source file grep (14 checks)

Reads all `src/**/*.ts?(x)` files into memory. Each `scan()` call applies a regex to every line:

```typescript
function scan(id, category, severity, pattern, detail, exclude?) {
  for (const file of srcFiles) {
    const lines = readFileSync(file, 'utf-8').split('\n');
    lines.forEach((line, i) => {
      if (pattern.test(line) && !(exclude && exclude.test(line))) {
        findings.push({ id, category, severity, file, line: i+1, snippet, detail });
      }
    });
  }
}
```

`exclude` patterns filter out known-safe matches (e.g., `fetch()` calls to `*.microsoft.com` are excluded from SEC-006).

### Pass 2 — Config file check (SEC-012)

Reads `power.config.json` separately and applies a credential pattern regex. This is isolated because `power.config.json` is not TypeScript and shouldn't be in `srcFiles`.

### Pass 3 — npm audit (SEC-013)

Runs `npm audit --json` via `execSync`. **npm exits with code 1 when vulnerabilities are found** — `execSync` throws on non-zero exit. The catch block reads `auditErr.stdout` to get the JSON (always written before npm exits). Only `high` and `critical` severity CVEs are surfaced as findings.

### ALL_CATEGORIES array

```typescript
const ALL_CATEGORIES = [
  'SEC-001','SEC-002','SEC-003','SEC-004','SEC-005','SEC-006',
  'SEC-007','SEC-008','SEC-009','SEC-010','SEC-011','SEC-012',
  'SEC-013','SEC-014','SEC-015','SEC-016'
];
```

Categories not in `findings` → `passed` count. The dashboard renders a green row for each clean category.

---

## Step 7 — run-evals.ts Orchestrator

`run-evals.ts` runs all three runners in sequence and merges results:

```typescript
const presenceOut = execSync('tsx evals/runner/presence-runner.ts', { cwd: ROOT });
const unitOut     = execSync('npx vitest run --reporter=json', { cwd: ROOT });
const securityOut = execSync('tsx evals/runner/security-runner.ts', { cwd: ROOT });
```

**Windows path issue:** `execSync` requires `pathToFileURL` for ESM module resolution on Windows. The runner uses `fileURLToPath(import.meta.url)` to anchor all paths.

After collecting all three `LayerResult` objects, it builds the combined result:

```typescript
interface EvalResults {
  timestamp: string;
  project: string;
  iteration: number;
  layers: LayerResult[];
}
```

This is written to `evals/results/latest.json`. The runner then **bakes** it into the dashboard by replacing the `/* BAKED DATA ... END BAKED DATA */` block inside `evals/dashboard/index.html`.

---

## Dashboard Data Pipeline

The dashboard is a **zero-dependency static HTML file** that must work as a `file://` URL. Browsers block all network requests (`fetch`, `XMLHttpRequest`) on `file://` origins — the dashboard uses none.

### Write-once vs bake-on-run

Two separate data injection phases:

| Phase | When | What's written |
|---|---|---|
| **Skill writes dashboard** (Step 7b) | Once, when skill runs | `PROJECT_NAME`, `ITERATION_NUMBER`, `FEATURES` array |
| **Runner bakes results** (Step 10) | Every `npm run eval` | `var DATA = { timestamp, layers, ... }` block |

`FEATURES` is written once and never updated by the runner. If the skill's Step 7b substitution fails (placeholder still present), the feature table will be empty on every run — re-running `npm run eval` will not fix it. Only re-invoking the skill fixes it.

### Step 7d self-verification (3 mandatory checks)

After writing the dashboard, the skill greps for:
1. `fetch(` → if found, the template was used without replacing it → delete and retry
2. `/* GENERATED` → if found, the FEATURES substitution failed → delete and retry
3. `PROJECT_NAME` → if found, the project name substitution failed → delete and retry

### renderUnitTests()

The Unit Tests tab is populated by `renderUnitTests()` at page load:

```javascript
(function renderUnitTests() {
  var unit = DATA.layers.find(l => l.layer === 'unit') || {};
  var details = unit.details || [];  // Array<{featureId, name, status, detail?}>
  // groups by featureId, matches to FEATURES array for display title
  // renders one card per feature group, one table row per test
})();
```

`unit.details` comes from Vitest's JSON reporter, transformed by the runner. Each entry has `featureId` (extracted from the `it()` name prefix), `name` (the full test description), `status` (`pass`/`fail`/`skip`), and `detail` (failure message if any).

---

## Re-run Guard

When `evals/` already exists, the skill applies these rules:

| Artifact | Rule |
|---|---|
| `manifest.json` | Regenerated (feature list may have changed) |
| `presence/*.check.ts` | Regenerated for all features |
| `unit/helpers/` | Preserved — never overwritten |
| `unit/*.test.tsx` | **Merged** — new tests added for new features, existing tests preserved |
| `runner/*.ts` | Regenerated |
| `dashboard/index.html` | Regenerated (FEATURES array updated) |
| `results/latest.json` | Overwritten after snapshot |

Unit tests are **always merged, never skipped** — even on re-runs. The re-run guard is explicitly designed to prevent any interpretation of "merge" as "skip unit test generation entirely."

---

## Security Check Categories — Technical Details

| ID | Pattern | Notes |
|---|---|---|
| SEC-001 | `$filter.*['+\|$filter.*${` | OData $filter concatenation |
| SEC-002 | `dangerouslySetInnerHTML\|\.innerHTML\s*=` | React + DOM XSS |
| SEC-003 | `(?:apikey\|password\|secret\|token)[:=]['"][^'"\s]{6,}` | Case-insensitive; two-layer exclude: (1) comment lines, (2) values that are purely alphabetical/kebab-case (no digits/special chars) — prevents false positives on TypeScript object maps where keys like `token` hold UI label strings like `'skipToken'`. Real credentials always contain digits or special chars. |
| SEC-004 | `console\.(log\|warn\|error\|debug).*\b(email\|userId\|phone\|...)` | PII field names in log calls; excludes single-string-only calls like `console.log("Email field is required")` — UI messages are not variable dumps |
| SEC-005 | `set\w+\(\s*(e\.message\|String\(e\)\|e\.toString\(\))` | setState(e.message) pattern |
| SEC-006 | `fetch\s*\(\s*['"]https?://` | Excludes `.dynamics.com`, `.microsoft.com`, `.microsoftonline.com` |
| SEC-007 | `(isAdmin\|hasPermission\|...).*&&.*Service\.(delete\|update\|...)` | Client-side only role gate before write |
| SEC-008 | `(localStorage\|sessionStorage)\.setItem.*(?:email\|userId\|userEmail\|userName\|token\|auth\|authToken\|...)` | PII in browser storage; bare `user` removed (too generic — matched `user-preferences`, `user-theme`); requires specific PII/auth key names |
| SEC-009 | `Service\.\w+\([^)]*\b(input\|userInput\|searchTerm\|searchQuery\|filterValue\|rawInput\|...)` | User input directly in service call; `value` and `text` removed (too generic — matched every service call with common param names) |
| SEC-010 | `useState[^)]*\b(password\|token\|secret\|apiKey)` | Secrets in component state |
| SEC-011 | `import\.meta\.env\.VITE_\w*(KEY\|SECRET\|TOKEN\|PASSWORD\|...)` | Secrets in Vite env (bundled into public JS) |
| SEC-012 | Credential regex on `power.config.json` | File-level check, not line-level |
| SEC-013 | `npm audit --json` | Parses vulnerability JSON; catches exit code 1 |
| SEC-014 | `\beval\s*\(`, `new\s+Function\s*\(`, `setTimeout\s*\(\s*['"\`]` | Dynamic code execution |
| SEC-015 | `axios\.get/post/...` (excl. MS domains), `new XMLHttpRequest()` (excl. MS domains), `\$.ajax/get/post` | Broader external HTTP clients; XMLHttpRequest now has the same Microsoft domain exclude as axios and fetch |
| SEC-016 | `useSearchParams.*\b(token\|auth\|...)`, `[?&](token\|auth\|...)=` | Sensitive URL params |

---

## Known Constraints and Edge Cases

**Feature ID mismatch (silent failure):** If a unit test `it()` name doesn't start with an exact manifest feature ID, the test runs and passes but maps to no dashboard row — the feature shows "⏭ No tests" even though tests exist. The post-generation grep verification catches this before `npm run eval` is run.

**FEATURES array is write-once:** The runner's bake step only replaces the `BAKED DATA` block. The `FEATURES` array is substituted once when the skill writes the dashboard. Re-running evals after a failed substitution will never fix the empty feature table — the skill must be re-invoked.

**presence.gaps doesn't exist:** The runner's `LayerResult` has a `details[]` array. There is no `gaps` property. Dashboard code always reads `presence.details` filtered by `featureId`.

**npm audit exit code 1:** This is expected when vulnerabilities exist. The security runner catches the thrown error from `execSync` and reads `auditErr.stdout` for the JSON output.

**ESM + Windows paths:** All runner files use `fileURLToPath(import.meta.url)` for `__dirname`. `import()` paths on Windows require `pathToFileURL()` — the runner uses this for dynamic imports.

**Vitest root default:** Without `root: PROJECT_ROOT` in `vitest.config.ts`, Vitest uses the config file's directory (`evals/`) as root. All relative paths in `setupFiles` then resolve to `evals/evals/...` — a path that doesn't exist. Always set `root` explicitly.

**Loading state test — use `queryBy*`, not `getBy*`:** The generated loading state test uses `screen.queryByRole('progressbar') ?? screen.queryByText(/loading/i)` rather than `getByRole`. `getByRole` throws immediately if the element is not found, so the `||` fallback never executes. `queryBy*` returns `null` on miss, allowing the fallback chain to work correctly.

**PCF guard:** If `@microsoft/powerapps-component-framework` is found, execution stops. This skill's grep patterns, service patterns, and test mocks are all Code App-specific and will produce incorrect results for PCF components.
