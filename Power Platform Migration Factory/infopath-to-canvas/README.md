# Workload: Migrate InfoPath Forms to Canvas Apps (`infopath-to-canvas`)

Migrates a Microsoft InfoPath form template (`.xsn`) into a modern Power Apps Canvas App by
extracting the form package, inventorying fields, rules, views, and data connections, then handing a
reviewed app-generation prompt to the Canvas App generation workflow.

Use this skill when you need to move off InfoPath and preserve the intent of the existing form in a
Canvas App experience.

## One-time setup

Have the source `.xsn` file available locally, or provide a folder that contains one or more `.xsn`
files. If the form should connect to real SharePoint lists, add those lists as app data sources in
Power Apps Studio before generation so schemas can be verified.

## How to call it

**Natural language (recommended):**

> "Use infopath-to-canvas to migrate this InfoPath form into a Canvas App."

**Slash command:** `/infopath-to-canvas`, then provide the `.xsn` path and any design or data-source
preferences.

## Migration workflow

The skill follows a review-first migration flow.

### 1. Extract the InfoPath package

The `.xsn` file is treated as a CAB archive and extracted into `xsn_extracted/`.

The skill verifies that the package contains the expected InfoPath artifacts, including
`manifest.xsf`, `schema*.xsd`, `template.xml`, and XSL views.

### 2. Inventory the form

The skill creates an inventory covering:

- Fields, data types, constraints, defaults, and decoded field names.
- Validation rules, submit behavior, and event handlers.
- Lookup connections and external schemas.
- Views, section headings, and field ordering.
- Recommended Canvas App sections.

### 3. Review migration decisions

Before generating the app prompt, the skill asks for approval on key choices:

- Whether to mock data with collections or connect to real SharePoint lists.
- Which sections to keep or drop.
- Any aesthetic preferences for the generated Canvas App.

If real SharePoint lists are used, the skill compares InfoPath fields with connected list schemas and
flags missing columns, type mismatches, or required columns that the original form does not populate.

### 4. Hand off to Canvas App generation

After review, the skill writes `canvas-app-prompt.md` with the selected sections, field lists, rule
translations, mock-data plan or SharePoint mapping, and validation behavior.

The generated prompt is then passed to the Canvas App generation workflow.

## What you get

The final handoff includes:

- An InfoPath form inventory.
- A reviewed Canvas App generation prompt.
- A clear list of data-source assumptions and schema gaps.
- A Canvas App design path that preserves the form's intent while modernizing validation and layout.

## Example request

```text
Use infopath-to-canvas to migrate C:\Forms\ExpenseApproval.xsn into a Canvas App. Start with mocked
data, keep all sections, and use a clean professional style.
```
