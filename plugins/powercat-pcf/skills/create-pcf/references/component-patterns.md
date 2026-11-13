# Component patterns for virtual model-driven PCF controls

This is an original implementation guide synthesized from the official sources listed below. It is not a catalog of copied samples. Component choices and the null/default interaction are project design decisions, not promises made by the PCF platform.

Use the [skill workflow](../SKILL.md) for scaffolding, runtime compatibility, testing, and packaging. Check each Fluent component/export against the supported platform-library contract before using it; current Fluent design documentation can describe APIs newer than the host contract.

## Choose the binding before the widget

| Need | PCF binding | Presentation direction |
|------|-------------|------------------------|
| Edit one text column | Field, typed bound property | Labeled Fluent Input or Textarea. |
| Edit one choice column | Field, OptionSet | Dropdown or radio-style choice group using metadata labels and stored numeric values. |
| Edit a boolean | Field, TwoOptions | Switch or Checkbox where appropriate; nullable state needs a separate activation presentation. |
| Select a bounded approximate number | Field, supported numeric type | Slider with explicit range, step, label, and value description. |
| Enter a precise number | Field, supported numeric type | Text-entry editor with locale-aware validation; do not use a slider for precision-sensitive amounts. |
| Edit a simple lookup | Field, Lookup.Simple | Picker with typed references, accessible search/results, and supported context APIs. |
| Display or edit view/subgrid records | Dataset with optional property-set mappings | Fluent table/grid/list presentation backed by the host dataset, not a replacement query. |

A star rating is a bounded numeric/choice editor, not permission to use any package named Rating. Select a host-compatible Fluent primitive or justify an additional dependency. Likewise, date-picker and lookup packages must not be assumed to be included in the shared Fluent runtime.

## Pattern: text entry

- Keep the displayed string controlled by current host data plus any agreed editing draft.
- While editable, present null as an empty input. Keep the label/help separate from placeholder text.
- Define when text commits and how empty input maps to the chosen column's empty/null contract. Validate before emitting typed outputs.
- Preserve composition input and normal text keyboard behavior; do not consume arrow keys or Enter globally.
- For numeric text entry, keep an incomplete draft separate from the numeric output. Never persist an invalid parse or silently turn an empty string into zero.

## Pattern: read-only value label

Use a separate static text presentation whenever the value is readable but the field/cell is not editable. Do not mount a disabled version of the full editor.

- Display the current host value's human-readable label: metadata labels for choices/booleans, lookup names, formatted dates/numbers, or plain text. Preserve `0` and `false`.
- Readable null values display static `---`, including text fields; provide field/column association and localized no-value semantics without activation guidance.
- Remove editing widgets, triggers, clear actions, and popups. Static field text adds no tab stop; dataset cell/row navigation still follows the grid's keyboard model.
- Security takes precedence: unreadable data uses a restricted state, never a cached label, tooltip, or accessible description. Missing formatting metadata uses an explicit unavailable state rather than invented labels or raw IDs.
- On transition to read-only, discard uncommitted drafts and close editing UI without writes; show current host data. Return to editing from host data without auto-defaulting.

The [skill](../SKILL.md) defines the full read-only contract, including focus and already-submitted output reconciliation. This is this plugin's presentation policy, not a platform requirement.

## Pattern: nullable immediate editor

Applicable to an agreed toggle, rating, or slider interaction:

1. While null and editable, present an accessible Fluent trigger displaying `---`, with the field label and localized no-value guidance.
2. A deliberate activation selects and commits the agreed valid default once. Focus, hover, and render do not activate.
3. Transfer focus to the active widget without letting the same gesture also toggle/increment its value.
4. Subsequent events use the widget's normal controlled behavior and agreed commit boundary.
5. An explicit clear action uses the verified PCF clear output, then returns to the null trigger.

This adapts widgets that cannot honestly represent absence. An unchecked switch or a slider thumb at minimum is a real value, not a null placeholder. Disabled, secured, or unavailable controls do not transition or write.

## Pattern: popup selection with a draft

- Separate stored value, draft selection, open state, and highlighted option. Highlight/focus is not selection or persistence.
- On deliberate opening from null, select the agreed default in the draft only. Do not populate a default during mounting with an uncontrolled default prop.
- Agree on the confirmation gesture: selecting an option can confirm a single-select picker; multi-select may require an explicit Apply action.
- Persist once on confirmation. Escape or dismissal without confirmation discards the draft and restores the stored presentation.
- Use metadata option labels for display and actual values for outputs. Do not invent an option whose stored value is `---`.
- For complex dropdown options, provide a text equivalent so type-ahead and the closed display work. Consider inline popup rendering for screen-reader navigation, subject to form clipping/layout tests.
- Define whether an empty selection means null or a valid empty collection for the chosen type; verify generated types and host round trips.

## Pattern: asynchronous lookup or supplemental data

- Keep the bound field's pending selection separate from search text and request results.
- Use the supported `context.webAPI` methods for agreed Dataverse operations and declare the manifest capability. Search results are not permission to bypass field security or the normal form save lifecycle.
- Bound the result size and request rate; distinguish loading, no results, and errors. Expose accessible status without announcing every keystroke.
- Ignore obsolete results after the query, record, or instance changes. Do not select the first result or overwrite a value when a request completes.
- Validate the typed lookup/reference against the supported column contract. Do not represent a reference as only its display label.
- Test the real host: the harness cannot establish WebAPI, security, or lookup-metadata behavior.

## Pattern: view/subgrid presentation

- Take columns, records, and ordered record IDs from the bound dataset. Render loading, retrieval errors, and empty data as distinct states.
- Preserve relationship scope and host ordering. Apply supported sorting/filtering/paging/selection APIs without refresh loops; account for filter resets when sorting changes and paging resets on refresh.
- Use raw values for comparisons/writes and formatted values for display. Required mappings are configuration contracts, not guaranteed arbitrary columns.
- Choose table semantics for passive tabular content and grid interaction only when the control needs it. Use the chosen Fluent widget's keyboard model and field labels for cell actions.
- Read-only cells show only formatted labels or static `---`, not disabled cell editors; default activation applies only to an editable cell. An empty dataset is not a nullable field.
- Persist agreed row mutations through `context.webAPI`, await success, then refresh. Keep row identity and draft state stable across view/page changes.
- Test selection, commands/navigation, and paging in a model-driven view/subgrid, not only CSV harness data.

## Evidence and acceptance

Pair each selected pattern with relevant cases in the [quality checklist](./quality-checklist.md). No pattern is complete without pointer/keyboard equivalence, screen-reader semantics, null/falsy/clear tests, host reconciliation, and applicable model-driven host verification.

## Official sources

- [PCF DataSet API](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/dataset) - bound records, ordering, query controls, selection, and refresh behavior.
- [PCF WebAPI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/webapi) - supported Dataverse record operations.
- [PCF best practices](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-best-practices) - temporary nulls, accessibility, sizing, and notification discipline.
- [PCF test harness](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls) - mock data and host API limitations.
- [Fluent Input guidance](https://fluent2.microsoft.design/components/web/react/core/input/usage) - text entry, labels, and supplementary placeholders.
- [Fluent Dropdown guidance](https://fluent2.microsoft.design/components/web/react/core/dropdown/usage) - selection, option text, and popup accessibility.
- [Fluent Switch guidance](https://fluent2.microsoft.design/components/web/react/core/switch/usage) - binary interaction and accessible labeling.
- [Fluent Slider guidance](https://fluent2.microsoft.design/components/web/react/core/slider/usage) - range selection, precision suitability, and accessible value labels.
