# Virtual PCF quality checklist

Use this checklist to define acceptance criteria and select tests. Mark each applicable case passed, failed, or blocked with evidence. Use not-applicable only with a reason. Local harness results do not establish model-driven host compatibility.

## Shared runtime and manifest

- [ ] Every new control scaffolded with `pac pcf init --framework react`; correct `field` or `dataset` template; `ReactControl` lifecycle; `control-type="virtual"`.
- [ ] Authored implementation/components/tests use TypeScript only; no handwritten plain JavaScript or edits to auto-generated files.
- [ ] Exactly one React and one Fluent v9 platform-library declaration with currently documented supported versions; no Fluent v8.
- [ ] Build dependencies and APIs compatible with the manifest contract, even if the host loads a newer version.
- [ ] Production bundle module evidence excludes React/ReactDOM and Fluent v9 implementations; additional packages have a justified size/cost.
- [ ] Correct bound/input properties, generated types, feature declarations, and RESX keys.
- [ ] Actual model-driven host loads the control without missing exports, duplicate-runtime errors, or warnings.

## Null, default, and data contract

| Case | Expected result |
|------|-----------------|
| Null / undefined, non-text editor | Visible `---`; accessible localized "No value"; zero writes. |
| Initial load / host rerender / focus / resize | No default selection or output notification. |
| Deliberate pointer or keyboard activation | Agreed valid default selected, no extra increment/toggle. |
| Immediate-commit activation | Correct typed output; exactly one notification. |
| Popup activation | Default selected in draft; zero notifications until confirmation. |
| Popup Escape / cancel / dismiss without confirmation | Stored value unchanged; null returns to `---`; focus restored. |
| Clear then save and reload | Host field persists as null; display returns to `---`. |
| Clear then activate again | Agreed default selected again, not an obsolete draft. |
| Existing `0`, `false`, minimum/maximum, or choice value | Retained as real values, never treated as blank. |
| Default missing or invalid for metadata | Explicit configuration/validation error; no silent fallback or write. |
| Required and blank | Required-field behavior preserved, no load-time auto-fill. |
| Null editable text box | Empty input; no literal dashes inserted or persisted. |
| Temporary null / unavailable metadata | Non-destructive loading behavior; no inferred write permission. |

Verify the chosen column's generated output types and clear behavior in the host. An omitted output and an explicit clear must not be confused. Test date/time semantics, numeric precision, choice values, and string empty/null conversion for the applicable column types.

## Keyboard and focus

- [ ] Tab and Shift+Tab enter/exit in a logical order, including when null.
- [ ] Null trigger is keyboard-operable with a visible focus indicator.
- [ ] Component-standard Enter/Space and arrow/Home/End behavior works where applicable; Space does not unexpectedly scroll the page.
- [ ] One gesture causes one transition/commit, not a bubbled duplicate.
- [ ] Focus transfers when the null trigger becomes an editor; no lost focus on rerender.
- [ ] Popups/dialogs implement appropriate focus entry, containment when modal, Escape, dismissal, and restoration.
- [ ] Composite widgets follow Fluent's roving-focus/navigation behavior; no unnecessary tab stops or invented shortcuts.
- [ ] No keyboard traps or interference with form navigation.

## Accessibility

- [ ] Target WCAG 2.2 AA; use semantic Fluent components rather than custom clickable containers.
- [ ] Accessible name identifies the field, separate from its current value.
- [ ] Null announces "No value" and understandable activation guidance, not just punctuation.
- [ ] Values and selected/expanded/checked/disabled/required/invalid states reflect actual state.
- [ ] Help and validation errors are associated with the field and announced without repeated chatter.
- [ ] Icons have names when interactive and are hidden from accessibility APIs when decorative.
- [ ] Repeated control instances have unique, stable IDs compatible with the supported React runtime.
- [ ] Screen-reader test with the supported browser/reader combination; keyboard-only test; automated scan.
- [ ] No color-only meaning; text contrast at least 4.5:1 (3:1 for large text) and relevant non-text contrast at least 3:1.
- [ ] Focus remains visible and unobscured; reduced-motion preferences respected.
- [ ] Touch targets meet applicable WCAG 2.2 target-size/spacing requirements (24 by 24 CSS pixels minimum or a valid exception); prefer 44 by 44 for primary touch actions.

## Theme, localization, and layout

- [ ] Fluent tokens rather than hard-coded colors; supported host theme mapping, including portaled content.
- [ ] Light, dark, and forced-colors/high-contrast modes preserve value, error, disabled, and focus affordances.
- [ ] RESX keys for all user-facing strings; field/choice metadata labels used where available.
- [ ] Locale-aware dates/numbers and RTL layout/navigation; stored values are not localized labels.
- [ ] Narrow form columns and dynamic resize; no negative/unknown-size assumptions.
- [ ] 200% zoom and 400% reflow where applicable; no clipped values, controls, errors, or popup actions.
- [ ] Mouse, touch, and keyboard have equivalent outcomes; no hover-only or drag-only action.

## Model-driven lifecycle and security

- [ ] Disabled/read-only states prevent pointer, keyboard, clear, and default writes; remain understandable.
- [ ] Readable read-only fields/cells display only human-readable value labels, not disabled editor UX; null shows static `---`, including text fields.
- [ ] Choice/boolean labels, lookup names, and formatted dates/numbers/text are correct; `0`/`false` survive, with no raw codes/IDs substituted for labels.
- [ ] No edit/clear/popup affordances or activation instructions in read-only mode; static field text adds no tab stop, while necessary grid navigation remains.
- [ ] Editability changes close editors and cancel uncommitted drafts without writes; host updates refresh labels and restoring editing does not default automatically.
- [ ] Secured/unreadable field data is neither displayed nor exposed through accessible text/logging.
- [ ] Revoking readability removes stale labels/drafts from visible text, tooltips, and accessible descriptions; read-only text remains legible in all themes.
- [ ] Host echoes and external edits reconcile without output loops; record changes/reset discard stale state.
- [ ] Save, refresh, validation, clear/save/reload, and form reopen preserve the correct data.
- [ ] Multiple instances do not share mutable values, IDs, focus, or event handlers.
- [ ] Supported PCF context APIs only; no parent DOM/global `Xrm` access or credentials in source.
- [ ] Safe rendering of user content; no untrusted HTML injection.
- [ ] Declared external-service requirements, permission failures, offline/loading/error states tested when applicable.

## Dataset and Dataverse integration

- [ ] Field primary property binds to a single column; dataset binds to the intended view/subgrid with correct columns/property-set mappings.
- [ ] Dataset reads use the bound context dataset, preserving host order, filtering, and relationship scope.
- [ ] Loading/empty/error, paging, sorting/filtering interactions, view changes, selection/navigation, and applicable cell edits tested.
- [ ] Dataverse operations use `context.webAPI` with the manifest WebAPI feature declaration; no direct HTTP, `Xrm.WebApi`, or credentials.
- [ ] Field updates retain the form's bound-output/save lifecycle, not direct WebAPI writes to the bound field.
- [ ] Row writes refresh only after confirmed success; failures are accessible and do not report success.
- [ ] WebAPI and unsupported harness dataset APIs verified in the model-driven host, with typed mocks for local tests.

## Performance and delivery

- [ ] Output callbacks only for meaningful commits; no repeated notification on every render.
- [ ] Production build, relevant lint/type checks, and targeted unit/component tests pass.
- [ ] `npm start watch` harness starts, interaction cases pass, and source edits rebuild; manifest changes restart watch.
- [ ] Field Data Inputs or synthetic dataset CSV/property mappings exercised; harness limitations recorded rather than masked.
- [ ] Timers/listeners/subscriptions cleaned up; no late async writes after destroy or record change.
- [ ] Performance measured for the agreed form instance count and dataset size; no unbounded rendering/network work.
- [ ] Host verification distinguished from local checks, with blocked gates reported explicitly.
- [ ] Usage documentation describes binding, defaults, clearing, keyboard behavior, supported types, and limitations.
- [ ] Solution scaffolded using `pac solution init`; each control referenced via `pac solution add-reference`.
- [ ] `msbuild /t:build /restore` uses production configuration and explicit `SolutionPackageType=Both`, `Managed`, or `Unmanaged`.
- [ ] Requested managed/unmanaged ZIP artifacts verified for package type and solution/control versions; generated outputs untouched.
- [ ] Optional `pac pcf push` limited to approved, confirmed development environments; never counted as release packaging or production readiness.
- [ ] Each release `pac solution import` explicitly approved, target confirmed, ZIP path/type specified, and completion verified; no substitute PCF push.
- [ ] Same versioned managed artifact promoted across downstream environments; actual column/view/subgrid binding and publication verified separately.
