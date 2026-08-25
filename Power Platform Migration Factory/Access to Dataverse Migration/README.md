# Workload: PowerCAT Access Migration (`powercat-accessmigration`)

The **named Access-to-Dataverse entry point** of the migration factory. It migrates a Microsoft
Access database (`.mdb`/`.accdb`) into a Dataverse solution and, when `app.name` is set, builds a
model-driven app with every table in its navigation. It reuses the same platform pipeline and hooks as
the `access-to-dataverse` reference skill — one source of truth, a friendlier name.

## One-time setup

Install the Power Platform CLI (`pac`) and confirm Python 3.10+ is available. For live `.mdb`/`.accdb`
reads, install `pyodbc` and the Microsoft Access Database Engine ODBC driver. If the driver is not
available, export each Access table to `<Table>.csv` and set `source.type: csv` in `mapping.yaml`.

## How to call it

**Natural language (recommended):**
> "Use PowerCAT Access Migration to migrate my Access database at `C:\path\to\Data.mdb` to Dataverse,
> then evaluate and document it."

**Slash command:** `/powercat-accessmigration`, then describe your database.

**Direct CLI (what the skill runs under the hood):**
```bash
# 1) Sign in to the target Dataverse environment:
pac auth create --environment https://YOUR-ORG.crm.dynamics.com

# 2) Point the included mapping at your database:
#    edit "Access to Dataverse Migration/mapping.yaml"
#    set source.path to your .mdb/.accdb or CSV export folder
#    adjust tables, columns, and relationships for your source schema
```

## Prerequisites

- Python 3.10+, the Power Platform CLI (`pac`), and (for the live Access read) `pip install pyodbc`
  plus the Microsoft Access Database Engine ODBC driver. No driver? Export each table to
  `<Table>.csv` and set `source.type: csv` in the mapping.
- Optional: Node 18+ for generative pages; `python-docx`/`openpyxl`/`Pillow` for the DOCX/XLSX reports
  (all optional, imported lazily).

## What you get

A Dataverse solution (tables, columns, relationships, data), an optional model-driven app, and — via
`evaluate` + `document` — an executive HTML evaluation report, a DOCX design document, and XLSX
parity/code-quality matrices. Sensitive source columns (PII/payment data) are flagged for review.
