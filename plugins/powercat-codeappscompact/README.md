# powercat-codeappscompact

Build React/TypeScript Power Apps Code Apps with typed workspaces, reusable authoring helpers, acceptance workflows, permission-bound host verification, and metered finalization.

## Skills

- **powercat-codeappscompact** - Author general-purpose Code Apps using the bundled CodeAppsCompact 2.3.0 runtime, starter, examples, and verification tools. Not for Canvas Apps, model-driven apps, or deployment.

## Usage

```text
Use powercat-codeappscompact to build a service-request Code App with synthetic
demo data, typed collections, validation rules, and independent acceptance cases.
```

```text
Create an inventory Code App with search, filters, editable records, and a
responsive workspace. Review the scaffold before creating files or installing
dependencies, and use only my authorized environment and browser tools.
```

```text
Resume my CodeAppsCompact verification run and report the actual outcomes and
remaining blockers. Include metered finalization only when usage evidence and
an explicit cost rate are available.
```

## Notes

- The marketplace plugin is version 0.1.0 and bundles the lean standalone skill and runtime at version 2.3.0.
- Node.js 22.18+ and approved npm access are required. Generated apps keep the bundled runtime project-local; it is not downloaded from a private package feed.
- Authenticated Local Play requires an authorized Power Apps environment and signed-in browser. Localhost preview alone is not authenticated host verification.
- Mesh routes require the corresponding approved Mesh UI Automation or browser tools. The CDP route requires an explicitly authorized existing loopback endpoint. No Mesh installation, MCP server, browser-debugging setup, or permission grant is included.
- Browser-local storage and saved-edit examples are for synthetic demo data only. Business rules and production authorization remain app-owned.
- Copy the complete skill folder, including its prebuilt assets, scripts, starter, definitions, and references. MIT copyright notices are retained in the bundled LICENSE files.
- The lean bundle omits duplicate runtime source, an unused standalone demo app, and maintainer-only instructions. The documented scaffold profiles and recipe examples remain included.
- The skill does not deploy apps, bypass denied access, or claim cost savings without measured evidence.

After the plugin is merged into the marketplace, install it with:

```text
copilot plugin marketplace add microsoft/power-cat-skills
copilot plugin install powercat-codeappscompact@power-cat-skills
```

Start a new conversation if the host requires it to discover the installed skill.
