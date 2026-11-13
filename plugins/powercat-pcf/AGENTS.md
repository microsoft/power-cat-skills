# Power CAT PCF Plugin

This plugin authors virtual Power Apps Component Framework controls for model-driven apps.

## Structure

- `.claude-plugin/plugin.json` - Plugin metadata.
- `skills/create-pcf/SKILL.md` - Requirements, implementation, validation, and delivery workflow.
- `skills/create-pcf/references/quality-checklist.md` - Cross-cutting acceptance tests.
- `skills/create-pcf/references/component-patterns.md` - Field/dataset interaction design.
- `skills/create-pcf/references/manifest-reference.md` - Model-driven manifest authoring contracts.
- `skills/create-pcf/references/control-lifecycle.md` - Virtual lifecycle, state reconciliation, and cleanup.

## Invariants

- Always scaffold new controls using `pac pcf init --framework react`: `field` for a single column, `dataset` for views/subgrids. Preserve an existing virtual scaffold when extending it.
- Author TypeScript only (`.ts`/`.tsx`), never plain JavaScript. Never edit auto-generated types, manifests, bundles, or solution/build outputs; edit their authored inputs and regenerate with tooling.
- Use `ComponentFramework.ReactControl` and `control-type="virtual"`.
- Declare React and Fluent v9 platform libraries. Do not bundle their implementations or introduce Fluent v8.
- Verify current documented platform-library versions before choosing dependencies. Runtime versions are not manifest compatibility targets.
- For non-text field controls, show `---` for null and select an agreed default only on deliberate activation. Focus, rendering, and loading must never write a default.
- Preserve valid falsy values, clear-to-null behavior, host updates, disabled/read-only states, and field security.
- Readable read-only fields/cells show only a human-readable value label or static `---`, never disabled editor UX. Hide editing affordances, cancel uncommitted drafts on mode changes without writes, and never expose unreadable/secured data.
- Accessibility and keyboard behavior are acceptance criteria, not optional polish.
- Use bound outputs for form field saves, the bound dataset for view/subgrid reads, and `context.webAPI` for Dataverse operations with the required manifest feature declaration.
- Always exercise the local harness with `npm start watch`; unsupported WebAPI/dataset/security behavior requires separate host verification.
- Package releases with `pac solution init`, `pac solution add-reference`, and `msbuild /t:build /restore`, explicitly selecting production and managed/unmanaged output. Deploy approved, verified release artifacts with `pac solution import`.
- `pac pcf push` is optional only for approved inner-loop development deployments; never use it for downstream test/UAT/production or as proof of release readiness.

## Development

There is no plugin build step: the deliverables are skill instructions and reference documentation. Validate JSON metadata, skill frontmatter, resource links, and marketplace registration when editing this plugin.

Write references independently from official documentation, cite the relevant sources, and distinguish platform guarantees from project policies. Do not borrow third-party skill text, examples, or organization.

Generated PCF projects must use their own build, lint, and tests plus verification in a model-driven app. Do not equate the local harness with host verification.

Use the consumer's configured npm registry for all npm operations and honor their organization policies. Never override the registry or bypass a configured proxy. If a requested version is unavailable, query that same registry and pin the newest compatible available version, or report the blocker. This plugin does not require a Microsoft-internal feed.
