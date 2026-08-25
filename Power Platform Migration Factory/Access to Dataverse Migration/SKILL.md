---
name: powercat-accessmigration
version: 1.0.0
description: Migrate a Microsoft Access database (.mdb/.accdb) into Microsoft Dataverse with an optional model-driven app. USE WHEN the user wants to modernize an Access database, reverse-engineer Access tables into Dataverse, or run the PowerCAT Access Migration workflow.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, PowerShell, Agent, TaskCreate, TaskUpdate, TaskList, Skill, EnterPlanMode, ExitPlanMode
---

# PowerCAT Access Migration

Migrate the Microsoft Access database described below into Dataverse:

$ARGUMENTS

Use this skill when the user wants to migrate a `.mdb` or `.accdb` Access database to Microsoft Dataverse, with an optional model-driven app.

## Workflow

1. Resolve the source Access database path from `$ARGUMENTS`. If the user provided a folder, search for `.mdb` and `.accdb` files and ask which one to use if there are multiple.
2. Read `${CLAUDE_PLUGIN_ROOT}/Access to Dataverse Migration/README.md` and `${CLAUDE_PLUGIN_ROOT}/Access to Dataverse Migration/mapping.yaml` before planning the migration.
3. Create a migration plan covering source inventory, proposed Dataverse tables, columns, relationships, publisher prefix, solution name, app name, risks, and prerequisites.
4. Ask the user to approve or adjust the plan before running any command that writes to Dataverse.
5. If the user approves execution, use the included mapping as a starting point and update it for the actual Access database schema.
6. Prefer a dry run or preview first. Only run live Dataverse writes after explicit user confirmation.

## Important safeguards

- Never commit local environment files, credentials, Access databases, exported CSV data, or generated run artifacts.
- Confirm the target Dataverse environment before provisioning.
- If the Access ODBC driver is unavailable, ask the user to export each table to CSV and set `source.type: csv` in the mapping.
- Treat PII, payment, and sensitive source columns as review items before migration.

