---
name: powercat-codeappscompact
description: Build Power Apps Code Apps by configuring bundled controls and compositions. Load only required cards; author domain rules, not replacement infrastructure.
license: MIT
compatibility: Node.js 22.18+, npm and approved tools. Keep this portable folder complete. A skill grants no permission.
metadata:
  version: "3.1.0-r.1"
  release: "v3.1R"
  distribution: "essentials"
---

# CodeAppsCompact v3.1R

1. Choose the largest suitable composition below. Batch-read only its cards and applicable data/save/navigation contracts. Internal dependencies do not require reading extra cards.
2. Configure -> compose -> extend. Import the prebuilt controls; write domain types, rules, adapters, fields and thin wiring. Extend app-locally only for a named API gap. Do not regenerate shipped infrastructure.
3. Cards supply exact imports, guarantees and limits. Use `scripts\api-reference.mjs <capability>` for a needed signature, not a full source/API dump. Never invent props or no-op actions.

| Requirement | Load |
|---|---|
| List/details/editor, nested or custom drafts | [RecordFlow](references/cards/flow.md) |
| Integrated flat CRUD | [Workspace](references/cards/workspace.md) |
| Custom shell/navigation | [Shell](references/cards/shell.md) |
| Standalone flat CRUD | [Records](references/cards/records.md) |
| Aggregate list / alternate view | [Table](references/cards/table.md) |
| Custom draft dialog | [Editor](references/cards/editor.md) |
| Inputs / selects | [Fields](references/cards/fields.md) |
| Related record choices | [Relationships](references/cards/relationships.md) |
| Related-record tables | [Details](references/cards/details.md) |
| Metrics / attention | [Dashboard](references/cards/dashboard.md) |
| Status / money / date / progress | [Display](references/cards/display.md) |
| UTC week / agenda | [Schedule](references/cards/schedule.md) |
| CSV parsing / export | [CSV](references/cards/csv.md) |

For a build, read the [workflow](references/workflow.md). Editable flows require the [save contract](references/contracts/save.md) and one [data contract](references/contracts/data.md). Load [business recipes](references/recipes.md) only when applicable.

Reuse `DemoShell` for persona demos, `RecordFlow.selected/onSelect/alternate` for bulk/board/calendar wiring, `FormChoice` for closed sets and `FormSelect` for optional/related choices. Keep default shell icons. Shared `Modal` owns focus containment; do not generate app-local focus traps.

Preserve existing work and respect tool permissions. Confirm saves, preserve rejected/stale drafts and verify the actual requirements. Synthetic storage is not live data or authorization. Ask before connecting services, changing schema, installing dependencies or publishing. Local verification does not prove authenticated Power Apps behavior.
