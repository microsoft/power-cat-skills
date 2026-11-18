# Power Platform Migration Factory

Power Platform Migration Factory is the public home for migration-focused Power CAT skills and guidance. It groups repeatable migration accelerators that help teams assess legacy assets, design the Power Platform target state, and move toward Dataverse-backed apps with governance built in.

## Migration tracks

| Track | Purpose |
| --- | --- |
| [Access to Dataverse Migration](Access to Dataverse Migration/README.md) | Modernize Microsoft Access applications into Dataverse-backed Power Platform solutions. |
| [Airtable to Power Platform Migration](Airtable to Power Platform Migration/README.md) | Move Airtable bases, interfaces, and workflows into Dataverse and Power Platform. |
| [infopath-to-canvas](infopath-to-canvas/SKILL.md) | Migrate Microsoft InfoPath forms into modern Power Apps Canvas Apps. |
| [migrate-to-dataverse](migrate-to-dataverse/SKILL.md) | Replace SharePoint list data sources with Dataverse table equivalents. |
| [powercat-nintex-form-to-canvas](powercat-nintex-form-to-canvas/SKILL.md) | Inventory and verify Nintex form exports, then hand off an approved migration prompt to Canvas App generation. |
| [powercat-nintex-workflow-to-power-automate](powercat-nintex-workflow-to-power-automate/SKILL.md) | Inventory and verify Nintex workflow exports, then build a validated Power Automate flow with FlowAgent and `/build-flow`. |

## Nintex form migration

The Nintex skill is a single `SKILL.md` file with its export-format reference included.
It supports classic `.nfp` packages, XML exports, SharePoint Online New Responsive Designer
JSON, and Nintex Automation Cloud form JSON. Nintex workflows, approvals, notifications,
task forms, Power Automate flows, and InfoPath forms are out of scope.

Example prompts:

- "Inventory this Nintex form export and report the migration gaps."
- "Migrate this Nintex form to a Power Apps Canvas app using my SharePoint list."
- "Prepare a mock-data Canvas prototype from this Nintex form export."

### Prerequisites and verification limits

- For app generation, install `canvas-apps@power-platform-skills` from
  [microsoft/power-platform-skills](https://github.com/microsoft/power-platform-skills).
  The skill also lists `powercat-canvas-apps@power-cat-skills` from this marketplace.
- For real SharePoint bindings, connect the target Power Apps Studio coauthoring session
  with `/configure-canvas-mcp` and add the primary and lookup lists in Studio.
- Without a primary list or with unresolved business-critical migration gaps, generated
  output must remain labeled **PROTOTYPE**. App generation requires approval of the
  inventory and the generated app prompt.
- Compilation does not verify runtime saves or cross-environment configuration. The skill
  requires successful save/read-back and rejected-save checks before save behavior is
  reported as verified. Generated apps must use form `OnFailure`/`Error` handling and actual
  environment variables, not literal named formulas, for environment-specific configuration.
