# powercat-codeappscompact

Build React/TypeScript Power Apps Code Apps with typed workspaces, reusable authoring helpers, acceptance workflows, permission-bound host verification, and metered finalization.

## Skills

- **powercat-codeappscompact** - Author general-purpose Code Apps using the bundled CodeAppsCompact 2.7.0 lean runtime, typed workspaces, accessible nested-record editors, atomic synthetic storage, and independent acceptance workflows. Supports explicitly unbound local-only apps. Not for Canvas Apps, model-driven apps, or deployment.

## Usage

```text
Use powercat-codeappscompact to build a local-only approvals Code App with
nested records, synthetic demo data, accessible editors, and independent
acceptance cases. Reuse the aggregate profile.
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

- The marketplace plugin is version 0.1.2 and bundles the lean standalone skill and runtime at version 2.7.0.
- Node.js 22.18+ and approved npm access are required. Generated apps keep the bundled runtime project-local; it is not downloaded from a private package feed.
- Use the aggregate profile for nested records, approvals, ledgers, or atomic multi-record commands. Reuse its draft lifecycle, accessible dialogs, related-record tables, metrics, and UTC calendars; applications own domain rules and independent acceptance criteria.
- Explicit local-only scaffolds have no tenant binding, host authentication, or deployment. Authenticated Local Play requires an authorized Power Apps environment and signed-in browser; localhost preview alone is not authenticated host verification.
- Mesh routes require the corresponding approved Mesh UI Automation or browser tools. The CDP route requires an explicitly authorized existing loopback endpoint. No Mesh installation, MCP server, browser-debugging setup, or permission grant is included.
- Browser-local storage is unencrypted synthetic-demo storage, not shared production storage, authorization, or a secret store.
- Copy the complete skill folder, including its prebuilt assets, scripts, scaffold profiles, starter, and references. MIT copyright notices are retained in the bundled LICENSE files.
- The lean bundle omits development sources, standalone examples, maintainer tests, generated API snapshots, and benchmark-only tooling. API lookup reads shipped declarations directly; no runtime rebuild or source checkout is required.
- Existing apps are not migrated automatically. The setup helper refuses a different or customized installed kit; review app dependency and acceptance changes before upgrading.
- The skill does not deploy apps, bypass denied access, or claim cost savings without measured evidence.

After the plugin is merged into the marketplace, install it with:

```text
copilot plugin marketplace add microsoft/power-cat-skills
copilot plugin install powercat-codeappscompact@power-cat-skills
```

Start a new conversation if the host requires it to discover the installed skill.
