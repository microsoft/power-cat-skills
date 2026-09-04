# Airtable to Microsoft App Modernization

Migrate an Airtable app into Microsoft platform targets:

- Dataverse tables
- SharePoint Lists
- Code App scaffold
- Canvas App scaffold
- Power Automate draft flows

This is an agent-driven migration skill. Start with [`SKILL.md`](./SKILL.md), then use
[`HOW-TO-USE.md`](./HOW-TO-USE.md) for prerequisites and step-by-step operator guidance.

## Scope

The skill owns the end-to-end migration flow:

1. Export Airtable schema and data through a secure local PowerShell prompt.
2. Analyze fields, relationships, choices, AI fields, person fields, records, and attachments.
3. Ask whether the target data platform is Dataverse, SharePoint Lists, both, or plan-only.
4. Collect target environment/site and solution/list details before creating artifacts.
5. Create Dataverse tables/data through Dataverse MCP when selected.
6. Create SharePoint Lists/data through SharePoint/Graph MCP or PnP PowerShell when selected.
7. Optionally generate Code App, Canvas App, and Power Automate draft-flow plans.
8. Produce JSON artifacts and user-friendly DOCX reports when document tooling is available.

## Important safety notes

- Do not paste Airtable tokens, Dataverse tokens, SharePoint tokens, passwords, or secrets into chat.
- Airtable token entry must use `Read-Host -AsSecureString`.
- Dataverse auth must use Dataverse MCP or an approved local auth path.
- SharePoint auth must use SharePoint/Graph MCP, PnP PowerShell interactive auth, or an approved local auth path.
- All writes are approval-gated at phase boundaries.

## How to run

Use one of these paths:

1. Invoke the installed skill, if available:

```text
/powercat-airtablemigration
```

2. Or clone/open this folder from the repo:

```powershell
git clone https://github.com/microsoft/power-cat-skills.git
cd "power-cat-skills\Power Platform Migration Factory\Airtable to Power Platform Migration"
```

Then prompt:

```text
Use SKILL.md. Start a fresh Airtable migration run.
```

For detailed instructions, see [`HOW-TO-USE.md`](./HOW-TO-USE.md).
