---
name: create-pcf
version: 1.0.0
description: "Create or extend Power Apps Component Framework (PCF) controls for model-driven apps (model apps). Use when building custom field editors, ratings, toggles, sliders, pickers, or dataset controls with virtual React controls and platform-provided Fluent UI v9. Includes null-to-default behavior, accessibility, keyboard navigation, form lifecycle, and host-runtime validation."
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, AskUserQuestion
---

# Create a virtual PCF control for model-driven apps

Produce a working TypeScript PCF project, not just a design or code excerpt. Always scaffold each new control with `pac pcf init --framework react`, use the host's React and Fluent UI v9 platform libraries, and author control logic/components/tests in `.ts`/`.tsx`, never plain JavaScript. Never modify auto-generated files. Use `context.webAPI` for Dataverse operations and solution packaging for releases and cross-environment promotion. Do not deploy without explicit approval.

Read the [quality checklist](./references/quality-checklist.md) when defining acceptance criteria and again when selecting validation cases.

Load these original, official-documentation-based references as needed:

- [Component patterns](./references/component-patterns.md) when selecting widgets and designing field/dataset interactions.
- [Manifest reference](./references/manifest-reference.md) before changing bindings, resources, types, or feature declarations.
- [Virtual control lifecycle](./references/control-lifecycle.md) before implementing data flow, host reconciliation, async work, or cleanup.

The references distinguish platform facts from this plugin's design policies. Follow their official source links to resolve current API/schema details; do not copy or reconstruct third-party skills or examples.

## 1. Discover the project and agree on the behavior

Inspect repository instructions, existing PCF projects, manifests, generated types, dependencies, shared helpers, localization resources, and tests before editing. Preserve unrelated changes. Extend an existing virtual control where possible; do not replace a standard control by changing only its manifest.

Ask only for missing decisions:

- Control name, namespace, workspace/output folder, and whether this is a new control or an extension.
- Field control bound to a single column, or dataset control bound to a table view/subgrid; target placements and device sizes.
- For fields: bound column name/type, allowed values/ranges, precision, requiredness, and metadata-driven options. Do not treat choice labels as stored values.
- For datasets: table/view/subgrid, dataset name, columns/property-set mappings, sorting/filtering/paging, selection/navigation, and any row editing or commands.
- Whether this is a text box or a non-text editor; the desired control-specific default, activation gesture, and commit/cancel behavior.
- Clear-to-null availability, validation rules, disabled/read-only and field-security expectations.
- Display label, accessible name/help text, languages, and any additional integration or offline requirements.
- For packaging: solution name, publisher name/prefix, version, and managed/unmanaged outputs. For deployment: target environment(s), package type per environment, and authorization.

For each non-text field editor, agree on a small state table: stored value, display, activation/default, commit, cancellation, clearing, and unavailable/disabled behavior. Default selection must be deterministic and valid for the configured metadata. Do not invent a default, choose the first option silently, or mistake `0` or `false` for null. Dataset controls retain appropriate loading/empty/error states; apply the null contract to nullable cell editors, not an empty grid.

Present a concise implementation summary and acceptance criteria before making materially different design choices. Do not create a planning document unless requested.

## 2. Verify tooling and the supported shared runtime

Check PAC CLI, Node/npm, MSBuild and its required .NET/build tools, and the project's build requirements. Consult the current official documentation:

- [React controls and platform libraries](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/react-controls-platform-libraries)
- [PAC PCF commands](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/pcf)
- [PCF best practices](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-best-practices)
- [Debugging and test harness](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls)
- [PCF solution packaging](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/import-custom-controls)
- [PAC solution commands](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/solution)
- [Code component ALM](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-alm)

Use the consumer's configured npm registry for every npm operation and honor their organization policies. Never pass `--registry`, modify registry configuration, or bypass a configured proxy. This skill does not require a Microsoft-internal feed. On a version 404, query that same configured registry with `npm view <package> versions --json`. Pin the newest available version compatible with both the documented platform contract and the project's tooling in the manifest and lockfile. If none exists, report the versions and compatibility blocker.

The documentation consulted when this skill was authored lists:

| Platform library | Manifest contract | Documented runtime |
|------------------|-------------------|--------------------|
| React | `16.14.0` | `17.0.2` in model-driven apps |
| Fluent v9 | `>=9.4.0 <=9.46.2` | `9.68.0` |

These are a reference snapshot, not a promise of current availability. Recheck before scaffolding. A higher runtime version does **not** authorize targeting its newer APIs. Align build dependencies, React type definitions, and Fluent imports with the supported contract; do not use React 18 APIs such as `createRoot` or `useId`.

## 3. Scaffold or extend the virtual project

Always use `pac pcf init` to scaffold every new control in its agreed empty project directory. Never hand-create a substitute scaffold, copy another control as the scaffold, or use a JavaScript/non-React template. Choose one of:

```powershell
pac pcf init --namespace <Namespace> --name <ControlName> --template field --framework react
```

```powershell
pac pcf init --namespace <Namespace> --name <ControlName> --template dataset --framework react
```

Replace placeholders with validated values. A `field` control binds its primary bound property to one column; a `dataset` control binds a manifest `data-set` to a view/subgrid, with `property-set` mappings where needed. Inspect `pac pcf init --help` for the installed CLI's options and installation defaults. Restore dependencies only after scaffolding/changing dependency manifests or a missing-dependency failure. Reuse the scaffold's `pcf-scripts`, generated types, and build pipeline; do not introduce a separate app bundler.

For an existing virtual project, preserve its PAC-generated scaffold and extend its editable source; do not rerun initialization over existing files. If a separate control is needed, initialize it with `pac pcf init` in a new directory.

For an existing standard control, scaffold a new React control and port its behavior into the virtual lifecycle, preserving identifiers/contracts only where supported. Plan solution/form migration explicitly rather than flipping `control-type`.

### TypeScript and generated-file boundaries

- Author implementation and test source in TypeScript (`.ts`/`.tsx`); never add handwritten `.js`/`.jsx` control logic or bypass types with `any` casts.
- Never modify auto-generated files: `generated/ManifestTypes.d.ts`, generated manifests, bundles, source maps, build intermediates, or packaged/extracted solution outputs. Do not patch tool-owned generated metadata.
- Edit authored inputs such as `ControlManifest.Input.xml`, `index.ts`, presentation `.tsx`, RESX, and supported project configuration; these editable scaffold inputs are distinct from regenerated output.
- Change the input manifest and run the scaffold's generation/build command to regenerate types. Resolve errors in authored source/inputs, not by editing generated declarations.
- Use PAC commands for solution initialization/references and MSBuild properties for package selection. Tool-generated JavaScript build output is expected, but is never hand-authored or edited.

### Manifest and library contract

- Set `control-type="virtual"`.
- Declare `platform-library` resources for React and Fluent v9 using currently supported versions.
- Import Fluent components from `@fluentui/react-components`; do not use `@fluentui/react` (v8).
- Define typed bound/input properties, required resources, localized display/description keys, and feature usage actually needed.
- Use generated `IInputs`/`IOutputs`. Do not hand-edit generated types.
- Let the PCF build externalize the declared platform libraries. Do not ship React, ReactDOM, or a second Fluent v9 implementation in the control bundle.
- Inspect imports and production bundle module evidence (build stats/source maps where available) to confirm externalization. A small bundle alone is not proof. Additional libraries, including icon packages, are not automatically host-provided; justify and measure them.

### Lifecycle and data flow

- Implement `ComponentFramework.ReactControl<IInputs, IOutputs>`.
- `init` captures the output callback and initializes supported subscriptions/resize tracking. There is no DOM container parameter for a virtual control.
- `updateView` returns a `React.ReactElement`; the platform renders it. Do not call `ReactDOM.render`, create a React root, or manipulate host DOM.
- Pass raw bound data, metadata, availability, and editability into typed presentation components. Keep draft interaction state distinct from host values and committed output.
- For a field editor, `getOutputs` returns the manifest-named bound output. Update pending output **before** calling `notifyOutputChanged`; notify only for meaningful user commits, not rendering or routine host updates. Dataset row persistence is not a field output notification.
- Verify how generated output types and the host represent clearing for the chosen column. Preserve explicit clearing separately from "no change"; do not assume that omitting a property clears it, force `null` through a cast, or return an invalid sentinel.
- Reconcile host echoes, external changes, record changes, form refresh/reset, and temporarily unavailable data without output loops or stale drafts. Define when an external change cancels a draft; test that policy.
- Track and release subscriptions, timers, observers, and pending work in `destroy` or component cleanup. Prevent late async results from modifying an unmounted control or a different record.

### Dataset binding and Dataverse operations

- Read view/subgrid data through `context.parameters.<datasetName>`: `columns`, `records`, `sortedRecordIds`, and the supported loading/error, paging, sorting, filtering, selection, and navigation APIs. Preserve host view order, filters, and subgrid relationship scope; do not replace the bound dataset with a hard-coded table query.
- Use raw record values for computation/persistence and formatted values/metadata for display. Handle refresh, page/view changes, empty datasets, unavailable columns, and selection without stale rows or requests on every render.
- Perform Dataverse CRUD through the supported `context.webAPI` methods (`createRecord`, `retrieveRecord`, `retrieveMultipleRecords`, `updateRecord`, `deleteRecord`). Declare `<uses-feature name="WebAPI" required="true" />` within the input manifest's `feature-usage` when the control requires this capability. Do not use `Xrm.WebApi`, direct Dataverse `fetch`/HTTP clients, parent-window APIs, or embedded credentials.
- For field values, use PCF bound outputs so the form owns its normal dirty/save lifecycle; do not bypass it with `context.webAPI.updateRecord`. Use WebAPI only for agreed additional operations or dataset row writes.
- Await confirmed write success before reporting success or refreshing the affected dataset. Show actionable, localized errors and enforce permissions/editability; do not auto-write on render, silently retry mutations, or fake a successful save.
- Test paging, filtering/sorting interactions, selection, row operations, and WebAPI behavior in the actual model-driven host; the test harness does not fully implement these APIs.

## 4. Implement the null-to-default contract

This is mandatory for **non-text nullable field editors**:

| State / event | Required behavior |
|---------------|-------------------|
| Raw value is `null` or `undefined` | Show literal `---` as the visible value; expose localized "No value" semantics to assistive technology. Do not display a selected default yet. |
| Initial render, `updateView`, rerender, focus, hover, resize | Leave the bound value untouched; never call `notifyOutputChanged` to populate a default. |
| Deliberate activation from null | Select the agreed, valid default. For immediate-commit controls, commit once. For popup/dialog editors, select it in the draft and persist only on confirmation. |
| Subsequent editing | Use the component's normal interaction and validation, without reapplying the default on each event. |
| Escape/cancel before confirmation | Discard the draft and return to `---` without a bound write. |
| Explicit clear | Commit null using the verified PCF output contract, return to `---`, and allow default selection on the next deliberate activation. |
| Existing valid value, including `0` or `false` | Display and edit that value; never replace it with the default. |
| Disabled/read-only but readable | Show only the formatted value label, or static `---` for null; no editor, activation, clear, or notification. |
| Secured/unreadable/unavailable | Use the appropriate restricted/loading presentation; do not expose data, activate, default, clear, or notify. |
| Editable text box | Render null as an empty editable string with normal input semantics; do not insert `---` into the textbox or saved data. |

Use an explicit nullish check, not truthiness. The visible placeholder is not a stored value, a choice option, or a validation workaround. Do not coerce it into a number, date, boolean, or string output. Optional placeholder text may supplement, but not replace, the literal `---` display for non-text null values.

Temporarily null data in `updateView` can mean loading rather than a persisted blank. Use supported availability/security signals when present. If the host does not distinguish these states, stay non-destructive: render the placeholder, never infer that null authorizes a write, and block edits when availability/editability cannot be established.

When editing is permitted, use an accessible, focusable Fluent trigger for the null presentation, not a clickable `div` or decorative dashes. Give it a localized field name and a description such as "No value. Activate to select the default." Keep `---` out of the accessible name when it would be announced as punctuation. For null sliders/toggles and other widgets unable to represent no value, use the trigger until activation rather than rendering a misleading thumb or "off" state.

For activation keys, follow the selected Fluent component's documented keyboard behavior: Enter/Space for buttons, and its standard opening/editing keys for composite widgets. Do not invent global shortcuts. An activation event must not also apply the first increment/toggle through event bubbling. For immediate controls, move focus predictably from the null trigger to the live editor; for popups, manage focus according to dialog/listbox patterns.

If required metadata forbids clearing, explain that constraint and follow form validation; do not auto-populate a default on load to hide a required-field error.

### Read-only presentation

When a field or cell is readable but editing is not permitted, render **only the current value's human-readable label** using static Fluent text, not the full editor UX with disabled styling. Derive editability from supported host mode, field security/metadata, and applicable dataset row/cell permissions; do not infer it from whether a value is present.

- Show choice/boolean metadata labels, lookup display names, formatted dates/numbers, or the text value itself. Preserve legitimate `0` and `false`; never replace them with the null placeholder or display raw choice codes/lookup IDs as labels.
- Show static `---` for a readable null value, including read-only text fields. Associate the field/column label with the value and expose localized "No value" semantics, without activation instructions.
- Omit inputs, dropdowns, switches, slider/rating widgets, picker triggers, clear buttons, and editing popups. Static field text creates no extra tab stop or misleading interactive ARIA role; retain necessary grid navigation for dataset cells.
- Keep text readable in all themes; do not apply low-contrast disabled-editor styling. Do not fabricate a label when readable data/formatting metadata is unavailable; expose the appropriate unavailable/loading state.
- Unreadable/secured fields use the restricted presentation instead of a value label. Remove stale values and drafts from visible text, accessible descriptions, and tooltips; do not bypass security to resolve a label.
- Reevaluate on host updates. If editability is revoked mid-edit, close editing UI and discard uncommitted drafts without output notifications or Dataverse mutations. Display the current host value, not an unconfirmed draft; preserve reconciliation for already-submitted commits and handle focus safely if an editor disappears.
- Returning to editable mode restores the editor or null trigger from current host data without automatically selecting or writing a default.

## 5. Build in the horizontals

Use native Fluent v9 behavior first, then supply the missing application semantics. Follow the [quality checklist](./references/quality-checklist.md), including:

- **Accessibility:** field label, value/state, instructions and errors; native semantics and correct ARIA relationships; screen-reader announcements for meaningful changes; no color-only meaning.
- **Keyboard/focus:** Tab/Shift+Tab entry and exit; component-standard arrow/Home/End/Enter/Space behavior where applicable; Escape cancellation; focus restoration; no traps or duplicate activation.
- **Theme/contrast:** Fluent tokens and supported host theming. Do not assume a provider already exists or force a light theme. If a provider is needed, map a documented host theme source and test portal content. Cover dark and forced-colors/high-contrast modes and visible focus.
- **Localization:** RESX for user-visible/control strings, `context.resources.getString`, locale-aware number/date formatting and pluralization, RTL layout and widget behavior. Preserve underlying typed values; do not save formatted labels or parse dates using a locale-ambiguous string.
- **Layout/input:** allocated size/resize handling, narrow form columns, zoom/reflow, touch targets, popups without clipping, and instances with unique IDs.
- **Forms/security:** disabled/read-only and field security; required/invalid states; dirty/save/refresh and clear/reload round trips; no reliance on internal `Xrm`, parent-window globals, or host DOM.
- **Reliability/performance:** minimal output notifications, bounded renders, instance isolation, cleanup, explicit loading/error/offline states, supported PCF APIs and appropriately declared external services. Never log raw field data or credentials.

Do not add unnecessary network calls, UI wrappers, configuration knobs, or dependencies. Follow existing project helpers and tests. Surface validation and service failures accessibly; do not swallow errors or fake success.

## 6. Validate the actual requirements

Run the generated project's relevant tests, lint, type-check and production PCF build using its existing scripts. Add targeted tests for newly introduced logic. If tools are missing, restore compatible dependencies through the configured feed; do not bypass a failed check.

Mandatory automated cases for a field control:

- Null and undefined display `---`; render, focus, and host updates make zero output notifications.
- Activation selects the agreed default; immediate controls notify exactly once, popup controls notify only on confirmation.
- Cancellation and disabled/unavailable activation notify zero times.
- Read-only fields/cells show only formatted labels or static `---`, with no editor/clear/popup affordances or writes. Cover choice/boolean/lookup/date/number/text values, `0`/`false`, secured data, host value updates, and editable/read-only transitions during a draft.
- Clearing emits the verified clear output, not the placeholder or an omitted no-change output.
- `0`, `false`, and other valid boundary values survive unchanged.
- Keyboard and pointer activation use the same transition, with no double commit or first-step skip.
- Host echo, external updates, refreshed/changed records, and late async results do not restore a stale draft or create output loops.

For editable text boxes, test the empty-string presentation/null conversion contract instead of the non-text placeholder rule; read-only text fields follow the static label/null presentation. For dataset controls, test bound-view/subgrid scope, loading/empty/error, columns, ordering, paging, filter/sort/view changes, selection/navigation, and per-cell editing as applicable. Test WebAPI success, permission/service failures, and stale responses with typed test doubles without editing generated files.

Always test interactively in the PCF test harness in watch mode, from the control project directory:

```powershell
npm start watch
```

Verify startup, open the reported harness URL, exercise the relevant pointer/keyboard/null-state cases, and confirm authored source changes rebuild and appear. Restart watch after input-manifest changes. For field controls, use the harness Data Inputs; for dataset controls, load synthetic CSV data, map property-set columns, and select Apply. Reapply CSV mappings after reload when needed. Do not edit generated harness files.

The harness does not fully support `context.webAPI`, dataset paging/sorting/filtering, security, or other host-specific APIs. Use explicit typed mocks in tests or a separate test fixture for local coverage, never silent production fallbacks. Record these host cases as blocked until exercised in a model-driven app. Stop the watch process after a self-contained check unless the user requests that it remain available.

Treat model-driven host verification as a separate gate. Verify platform-library reuse from the production build, then verify the control in an actual model-driven form/view/subgrid: shared runtime, binding, Dataverse operations, form save/refresh/clear, keyboard-only navigation, screen reader, dark/high contrast, RTL, responsive/touch input, and repeated instances. A static screenshot or an automated accessibility scan alone is insufficient.

Use the checklist to record passed, failed, not-applicable (with a reason), and blocked cases. Do not claim host/runtime accessibility validation without executing it. If no environment or browser is available, complete local checks and clearly identify host gates as blocked.

## 7. Package and hand off

Use solution packaging for releases and cross-environment promotion. Provide managed and unmanaged artifacts as agreed so the same version can move across environments.

For an explicitly approved inner-loop deployment to a confirmed development environment, `pac pcf push` is an optional convenience:

```powershell
pac pcf push --publisher-prefix <PublisherPrefix> --environment <ConfirmedDevelopmentEnvironmentUrlOrId>
```

Verify the import and host behavior, and use the publisher prefix matching the intended solution. Push bypasses normal control versioning/solution packaging requirements; it is not a release artifact, production deployment method, or substitute for the packaging gates below. Never push to downstream test/UAT/production environments. A successful dev push does not complete production readiness.

1. In an agreed empty solution directory, scaffold with `pac solution init` (not `pcf solution init`). For an existing solution project, reuse it without overwriting its metadata.

   ```powershell
   pac solution init --publisher-name <PublisherName> --publisher-prefix <PublisherPrefix>
   pac solution add-reference --path <AbsoluteControlProjectDirectory>
   ```

   Run `add-reference` from the solution directory for each PCF project to include. Use distinct solution/control project names, preserve publisher identity, and use the supported PAC solution/control version commands when updating a release.

2. From the solution directory, build and restore with MSBuild. Explicitly select production configuration and package type; managed/unmanaged is independent of whether the control bundle is production optimized.

   ```powershell
   msbuild .\<SolutionName>.cdsproj /t:build /restore /p:Configuration=Release /p:PcfBuildMode=production /p:SolutionPackageType=Both
   ```

   Use `SolutionPackageType=Managed` or `Unmanaged` when only that artifact is requested. Do not rely on Debug/Release defaults to choose package type. If MSBuild needs Visual Studio environment setup on Windows, initialize it and build in the same Developer Command Prompt process. Report missing build prerequisites instead of switching to a different packaging approach.

3. Verify the actual ZIP paths produced under the solution build output, inspect package metadata to confirm solution/control versions and managed flags, and retain both requested artifacts. Never hand-edit ZIP contents or generated solution XML. Package-only requests stop here.

4. Before each import, confirm environment identity with PAC authentication/environment information, the exact artifact/type, and user approval. Normally use unmanaged in the solution's development environment and managed for downstream test/UAT/production. Do not mix types or force overwrite/upgrade without agreement. Import an explicit ZIP path rather than relying on PAC's default package selection:

   ```powershell
   pac solution import --path <AbsoluteSolutionZipPath> --environment <ConfirmedEnvironmentUrlOrId>
   ```

   Verify completion and surface import/dependency failures. If importing asynchronously, wait for the terminal success/failure result; accepted submission alone is not success. Promote the same built managed artifact across downstream environments instead of rebuilding per target or hard-coding environment URLs in the control.

Provide the project changes, managed/unmanaged artifact paths, concise usage/binding instructions, default/clear/commit semantics, and verification results. Document supported column/dataset types and relevant limitations in the project's existing documentation. Describe how the maker adds the field control to its column/form or the dataset control to its view/subgrid and publishes it; successful import alone does not establish binding or host behavior.

Report any unexecuted host tests or missing tooling as blockers, not completed checks. Never commit, publish, change environments, or overwrite an existing control without authorization.
