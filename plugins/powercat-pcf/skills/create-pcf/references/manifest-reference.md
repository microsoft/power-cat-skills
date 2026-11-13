# Manifest authoring reference for virtual PCF

This original reference summarizes the official schema for this plugin's model-driven scope. It is intentionally selective, not a replacement schema or a copied third-party guide. Verify current element availability, attributes, and library versions in the linked documentation.

Start from `pac pcf init --framework react`. Edit `ControlManifest.Input.xml`, not generated `ControlManifest.xml`, generated types, bundled resources, or solution outputs. Use the scaffold's build/generation tooling to validate changes.

## Identity and structure

| Element / attribute | Authoring decision |
|---------------------|--------------------|
| `manifest` | Root metadata container produced by PAC. Preserve its structure. |
| `control` | Owns identity, configurable properties/datasets, resources, and applicable feature declarations. |
| `namespace`, `constructor` | Keep aligned with the PAC project and exported implementation. Validate names using the installed CLI rather than hand-inventing identity metadata. |
| `version` | Version the control using supported tooling; coordinate with solution release versioning. |
| `display-name-key`, `description-key` | Use meaningful maker-facing labels and descriptions with matching localization resources. |
| `control-type` | Must be `virtual` for this skill; this attribute alone does not convert a standard control. |

Sources: [manifest schema index](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/) and [control](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/control).

## Field properties

| Attribute | How to use it here |
|-----------|-------------------|
| `name` | Stable identifier used by generated inputs/outputs and `context.parameters`. Match casing exactly. |
| `usage="bound"` | Primary editable field contract for a single column; return the corresponding output when committing. |
| `usage="input"` | Read-only input/configuration contract, not a field to mutate through outputs. |
| `of-type` | Select the precise supported PCF type for the target column. |
| `of-type-group` | Reference a declared group only when the implementation genuinely handles all its member types; regenerate types and use appropriate guards. |
| `required` | Maker configuration requirement for this property. Do not confuse it with Dataverse business-required metadata or non-null data on every render. |
| `default-value` | In model-driven apps this is input configuration only, not an initializer for a bound column. |
| `display-name-key`, `description-key` | Explain the binding/configuration in the maker UI and supply matching resource keys. |

The skill's activation default is an explicit interaction policy. It is not implemented by setting `default-value` on the bound field.

### Common type choices

| Column family | Schema names to verify |
|---------------|------------------------|
| Text | `SingleLine.Text`, other supported `SingleLine.*` formats, `Multiple`. |
| Number | `Whole.None`, `Decimal`, `FP`, `Currency`. |
| Choice | `OptionSet`, `MultiSelectOptionSet`. |
| Boolean | `TwoOptions`. |
| Date | `DateAndTime.DateOnly`, `DateAndTime.DateAndTime`. |
| Simple lookup | `Lookup.Simple`. |

These are schema names, not permission to coerce all values to strings. Use generated types and column metadata for precision, date semantics, options, and references. Not every Dataverse column/format is supported: check the property's unsupported-type list before promising owner/customer/party-list/status or other specialized bindings. `Object` is output-only, not a catch-all field type.

Sources: [property](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property) and [type-group](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type-group).

## Dataset contracts

- A `data-set` inside `control` defines the configurable view/subgrid binding. Its name becomes the dataset input identifier; it is not a table logical name or fixed FetchXML query.
- Supply the dataset's maker-facing display information. Configure `cds-data-set-options` deliberately for supported command-bar, view-selector, and quick-find presentation; the flag alone does not implement custom command behavior.
- A `property-set` belongs inside its dataset and lets the maker map a typed column needed by the presentation. Define its name, usage, supported type/type-group, requiredness, and display information as applicable.
- Property-set metadata does not turn dataset row edits into field `getOutputs` writes. Use the bound dataset for reads and the agreed supported persistence path.
- Verify rules for specialized properties: current property documentation calls for `Lookup.Simple` properties to be wrapped inside `data-set` when a manifest includes a dataset.
- Prefer one dataset unless the requirements justify multiple. Confirm primary/secondary dataset configuration in the intended model-driven placement rather than extrapolating canvas authoring rules.

Sources: [data-set](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/data-set) and [property-set](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property-set).

## Resources and shared runtime

- Keep the scaffold's TypeScript `code` entry point and resource order; compiled JavaScript is tool-generated output, not authored source.
- Under `resources`, declare one `platform-library` for React and one for Fluent v9. Each uses the documented library name and supported manifest version.
- Resolve current versions through the shared-runtime rules in the [skill](../SKILL.md). A runtime-loaded version is not necessarily a supported manifest/build target.
- Reference actual CSS/RESX/image resources when needed. Do not include an unused resource or a second React/Fluent implementation.
- Keep runtime strings and manifest display/description keys aligned with localization resources. Validate paths and the generated package rather than patching missing files into build output.

Sources: [resources](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resources), [platform-library](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/platform-library), and [React/platform compatibility](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/react-controls-platform-libraries).

## Capability declarations

Declare required supported APIs using `uses-feature` within `feature-usage`. A control requiring Dataverse record operations declares the `WebAPI` feature and calls `context.webAPI`. Optional capabilities need explicit availability checks and a designed unavailable state, not a success-shaped fallback.

Do not copy canvas-only elements into a model-driven manifest. For example, the schema's `external-service-usage`/`domain` declarations are canvas-scoped; verify applicability before introducing external integrations. A manifest declaration does not grant Dataverse permissions or make an API work in the local harness.

Source: [uses-feature and its runtime availability table](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/uses-feature); see the schema index for host-specific element availability.

## Change and validation sequence

1. Change the authored input manifest and source/resource inputs.
2. Run the scaffold's type-generation/build process; fix errors in authored inputs, never generated declarations.
3. Confirm inputs/outputs/datasets and exported constructor still agree.
4. Restart `npm start watch` for manifest changes and exercise field inputs or dataset mappings.
5. Verify production library externalization and solution artifacts using the [skill workflow](../SKILL.md).
6. Confirm maker binding and runtime behavior in the actual model-driven form/view/subgrid.
