# PowerCat-CodeAppsCompact v3.1R

Build React/TypeScript Power Apps Code Apps by configuring bundled, accessible controls and compositions (record flows, workspaces, tables, editors, dashboards, schedules, CSV), loading only the control cards each app needs.

## Skills

- **PowerCat-CodeAppsCompact** (`powercat-codeappscompact`) - Route each build through a compact control map: choose the largest suitable composition, load only its cards and save/data contracts, then import the prebuilt controls and author domain types, rules, and thin wiring. Supports explicitly unbound local-only apps. Not for Canvas Apps, model-driven apps, or deployment.

## Usage

```text
Use powercat-codeappscompact to build a local-only approvals Code App with
nested records, synthetic demo data, and accessible editors. Reuse RecordFlow
and the shipped controls instead of regenerating infrastructure.
```

```text
Create an inventory Code App with search, filters, editable records, and a
responsive workspace. Review the scaffold before creating files or installing
dependencies, and use only my authorized environment and browser tools.
```

## Notes

- PowerCat-CodeAppsCompact v3.1R uses version 3.1.0-r.1 consistently for the marketplace plugin, skill metadata, runtime, and starter package.
- The install/skill identifier remains `powercat-codeappscompact`; the runtime package and import identifier remain `codeappscompact`.
- Essentials-only distribution: accounting, benchmark, host-verification, and release-maintenance tooling are omitted. Scaffolding, prebuilt controls, control cards, contracts, and local validation scripts are included.
- Node.js 22.18+ and approved npm access are required. Generated apps vendor the bundled runtime project-locally; it is not downloaded from a private package feed.
- Explicit local-only scaffolds have no tenant binding, host authentication, or deployment. Local verification does not prove authenticated Power Apps behavior.
- Browser-local storage is unencrypted synthetic-demo storage, not shared production storage, authorization, or a secret store.
- Copy the complete skill folder, including its prebuilt assets, scripts, scaffold profiles, starter, and references. MIT copyright notices are retained in the bundled LICENSE files.
- Existing apps keep their vendored runtime; review dependency changes before upgrading them.
- The skill does not deploy apps, bypass denied access, or grant permissions.

After the update is merged into the marketplace, install it with:

```text
copilot plugin marketplace add microsoft/power-cat-skills
copilot plugin install powercat-codeappscompact@power-cat-skills
```

Start a new conversation if the host requires it to discover the installed skill.
