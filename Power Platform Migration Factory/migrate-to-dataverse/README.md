# Workload: Migrate Canvas App Data Sources to Dataverse (`migrate-to-dataverse`)

Migrates an existing Canvas App from non-Dataverse data sources to Dataverse by reading the app's
`.pa.yaml` files and replacing Power Fx data source calls with equivalent Dataverse table references.

Use this skill when a Canvas App already exists and you want formulas such as `Filter`, `Patch`,
`LookUp`, `Collect`, `ClearCollect`, or connector-specific calls to point to Dataverse tables instead
of SharePoint lists or other legacy data sources.

## One-time setup

Make sure the Canvas App is open in an authoring/coauthoring session where the Canvas MCP tools are
available. The skill depends on the app being synced locally before edits are made.

The target Dataverse tables must already be connected as data sources in the app so the skill can
discover their schemas and map columns safely.

## How to call it

**Natural language (recommended):**

> "Use migrate-to-dataverse to update this Canvas App so its SharePoint list references point to the
> matching Dataverse tables."

**Slash command:** `/migrate-to-dataverse`, then describe the source data sources and intended
Dataverse targets.

**Direct workflow:**

```text
1. sync_canvas
   Pulls the latest Canvas App state into local .pa.yaml files.

2. list_data_sources
   Discovers all available app data sources.

3. get_data_source_schema
   Reads Dataverse table columns and Power Fx types for accurate mapping.

4. Review and approve mapping plan
   Confirms how source columns map to Dataverse columns before any edits are made.

5. Update .pa.yaml files
   Replaces approved source data-call expressions with Dataverse equivalents.

6. compile_canvas
   Validates the updated Canvas App and fixes compile errors before finishing.
```

## Prerequisites

- A Canvas App available in the current authoring session.
- Canvas MCP tools available:
  - `sync_canvas`
  - `list_data_sources`
  - `get_data_source_schema`
  - `compile_canvas`
- Dataverse tables already added as app data sources.
- Access to the plugin technical guide:
  `references/TechnicalGuide.md`.

## Migration workflow

The skill follows a gated, review-first workflow.

### 1. Sync the Canvas App

Before reading or editing YAML files, the skill calls `sync_canvas` to pull the current app state from
the authoring session into local `.pa.yaml` files.

The skill only proceeds after the sync completes successfully.

### 2. Discover available data sources

The skill calls `list_data_sources` to enumerate all data sources connected to the current app
authoring session.

It then calls `get_data_source_schema` for each Dataverse table so it can read the available columns
and Power Fx types.

The discovery summary includes the available data sources, their types, and key columns.

### 3. Read Canvas App YAML files

The skill reads every `.pa.yaml` file produced by `sync_canvas` and identifies formulas that reference
non-Dataverse data sources, including patterns such as:

- `SharePoint.GetItems`
- `Filter('MyList', ...)`
- `Patch('MyList', ...)`
- `LookUp('MyList', ...)`
- `Collect(...)`
- `ClearCollect(...)`

For each expression, it records the source table or list name, referenced columns, and operation type.

### 4. Build a column mapping plan

Using the discovered Dataverse schemas, the skill creates a proposed mapping table for every data
source call it finds.

Column mapping follows these rules:

- Prefer exact column name matches, case-insensitive.
- Fall back to semantic matches, such as `Title` to `name`.
- Respect Power Fx type compatibility.
- Flag unclear mappings as needing manual review.
- Avoid mapping incompatible types without an explicit conversion formula.

The skill presents the mapping plan for approval before making any changes.

### 5. Apply approved replacements

After approval, the skill updates the affected `.pa.yaml` files.

It replaces source data-call expressions with equivalent Dataverse Power Fx expressions while keeping
the rest of the app unchanged.

The skill preserves:

- UI properties
- Layout
- Control structure
- Non-data formulas
- Existing collection and variable initialization patterns

### 6. Validate the app

After all updates are applied, the skill calls `compile_canvas`.

If compilation errors are found, it fixes them and validates again until the app compiles successfully.

## What you get

An updated Canvas App whose selected data source formulas now reference Dataverse tables instead of
legacy or non-Dataverse sources.

The final output includes:

- A summary of updated `.pa.yaml` files.
- The number of expressions replaced per file.
- The original source data sources replaced.
- The Dataverse tables used as targets.
- Any columns that still require manual review.
- A successful `compile_canvas` validation result before completion.

## Example request

```text
Use migrate-to-dataverse to update this Canvas App so all SharePoint list references use the matching
Dataverse tables. Map Orders List to cr123_orders, Customers List to cr123_customers, and Products
List to cr123_products.
```

## Example output

```text
Migration complete.

| File | Expressions Replaced | Status |
|------|----------------------|--------|
| Screens/OrdersScreen.pa.yaml | 6 | Compiled |
| Screens/CustomerScreen.pa.yaml | 4 | Compiled |
| App.pa.yaml | 2 | Compiled |

Source replaced: Orders List, Customers List, Products List
Target: cr123_orders, cr123_customers, cr123_products
Columns requiring manual review: none
```
