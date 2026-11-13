# powercat-pcf

Create accessible virtual PCF controls for model-driven Power Apps using host-provided React and Fluent UI v9.

## Skills

- **create-pcf** - Gather requirements, scaffold and implement a virtual control, and verify its data contract, accessibility, keyboard behavior, and model-driven form integration.

## Usage

```text
/create-pcf Create a nullable rating control for a model-driven app.
Use Fluent v9, display --- when empty, and select 3 stars on activation.
Support clearing, keyboard operation, and screen readers.
```

```text
Create a virtual PCF dataset control for a model-driven subgrid.
Preserve the bound view's scope and ordering, and support keyboard navigation.
```

```text
Extend my existing virtual PCF control with a static read-only value label.
Preserve field security, clear-to-null behavior, and the form save lifecycle.
```

## Notes

Editable non-text field controls display `---` when null. Deliberate activation selects a control-specific default agreed during requirements; focus and rendering do not modify data. Popup editors keep that default as a draft until confirmation. Editable text boxes retain normal empty-input behavior; readable read-only values use static labels or `---`.

### Install

```text
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-pcf@power-cat-skills
```

For local development:

```powershell
copilot --plugin-dir .\plugins\powercat-pcf
```

Run the local-development command from this repository's root. The skill requires PAC CLI, Node/npm, and the MSBuild/.NET tooling needed by the generated PCF project. It needs no companion plugin or MCP server. Use your configured npm registry and organization policies; no Microsoft-internal feed is required.

The workflow supports field controls bound to a single column and dataset controls bound to views/subgrids. It asks for binding details, default and commit semantics where applicable, placement, packaging, and any deployment target. Creating a project does not authorize deployment.

### Authoring and delivery contract

- Every new control is scaffolded with `pac pcf init --framework react`, using the `field` or `dataset` template.
- All authored control logic/components/tests use TypeScript, never plain JavaScript. Auto-generated files are never edited; authored inputs are changed and tooling regenerates outputs.
- Read-only fields/cells show just the formatted value label, not a disabled editor. Readable null values show static `---`; secured data remains hidden and mode changes never auto-save drafts or apply defaults.
- View/subgrid data comes from the bound dataset. Dataverse operations use `context.webAPI`; field saves retain the normal PCF bound-output/form lifecycle.
- Local interactive testing uses `npm start watch`, with separate model-driven host tests for APIs and behavior the harness does not support.
- Solution packaging uses `pac solution init`, `pac solution add-reference`, and `msbuild /t:build /restore` with explicit production and managed/unmanaged settings.
- Approved releases use `pac solution import` with a verified ZIP and explicit environment. Promote the same managed artifact across downstream environments.
- `pac pcf push` remains an optional, approved development shortcut, never a substitute for production packaging or downstream deployment.

### Quality gates

See the [skill](./skills/create-pcf/SKILL.md) and its [quality checklist](./skills/create-pcf/references/quality-checklist.md). Gates cover host-library reuse, null round trips, form lifecycle, accessibility, keyboard/focus, theme and contrast, localization/RTL, responsive/touch interaction, security, offline behavior, and performance.

Microsoft's [React controls and platform libraries](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/react-controls-platform-libraries) documentation is the authority for supported library versions. The skill checks it at execution time rather than treating a runtime version as a supported build target.

### Authoring references

These original guides synthesize official Microsoft Learn and Fluent documentation, with source links and an explicit distinction between platform facts and this plugin's interaction policies:

- [Component patterns](./skills/create-pcf/references/component-patterns.md) - Text, choice, nullable immediate/popup editors, asynchronous lookups, and view/subgrid presentations.
- [Manifest reference](./skills/create-pcf/references/manifest-reference.md) - Identity, typed properties, dataset mappings, resources, shared libraries, and feature declarations.
- [Control lifecycle](./skills/create-pcf/references/control-lifecycle.md) - Virtual initialization/rendering, bound outputs, drafts, host reconciliation, and cleanup.
