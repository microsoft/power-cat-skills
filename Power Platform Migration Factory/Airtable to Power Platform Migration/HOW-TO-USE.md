# How to use the Airtable Migration Skill

This guide explains how to use `SKILL.md` to migrate an Airtable app into Microsoft platform targets:

- Dataverse tables
- SharePoint Lists
- Code App scaffold
- Canvas App scaffold
- Power Automate draft flows

The skill is designed to start fresh for each migration run and keep all generated artifacts in one timestamped folder.

## What the skill does

The skill can:

1. Export Airtable schema and data.
2. Analyze tables, fields, relationships, choices, AI fields, records, and person-like fields.
3. Ask whether the target should be Dataverse, SharePoint Lists, both, or plan-only.
4. Create a migration plan and DOCX reports.
5. Create Dataverse schema and import data when Dataverse MCP is available.
6. Create SharePoint Lists and import data using SharePoint/Graph MCP or PnP PowerShell.
7. Optionally generate a Code App or Canvas App scaffold.
8. Optionally generate Power Automate draft flow plans from automation evidence.

## Folder layout

The skill file is:

```text
SKILL.md
```

Every run should create a fresh timestamped run folder:

```text
airtable-migration-work/
  runs/
    <yyyyMMdd-HHmmss>/
      README.md
      scripts/
      exports/
      analysis/
      runbooks/
      reports/
      flows/
      apps/
        code-app/
        canvas-app/
      logs/
      validation/
      temp/
```

All artifacts for a migration must stay inside that run folder unless you explicitly ask for another output path.

## Prerequisites

### Required for all runs

- Access to the Airtable base.
- Airtable Personal Access Token scoped only to the base being migrated.
- Airtable token scopes:
  - `schema.bases:read`
  - `data.records:read`
- PowerShell available locally.
- An AI coding agent that can read `SKILL.md`, create files, and run local commands.

Important security rules:

- Do not paste Airtable tokens into chat.
- The generated script should use `Read-Host -AsSecureString`.
- Revoke temporary Airtable tokens after migration testing.

## Airtable setup

Create a base-scoped Airtable Personal Access Token:

1. Open Airtable in the browser.
2. Go to the Airtable Developer Hub.
3. Create a Personal Access Token.
4. Give the token a clear temporary name, for example:

```text
airtable-migration-test
```

5. Add scopes:

```text
schema.bases:read
data.records:read
```

6. Under access, select only the specific Airtable base being migrated.
7. Create the token.
8. Copy it once.
9. Use it only when the PowerShell export script prompts for it.
10. Revoke the token after the migration test if it is no longer needed.

Do not paste the token into chat, source files, GitHub issues, pull requests, Teams messages, or documentation.

### Finding the Airtable base ID

The base ID usually starts with `app`.

You can find it from:

- Airtable API documentation for the base.
- Airtable URL or page source when available.
- Airtable Developer Hub token/base configuration.

Example:

```text
appXXXXXXXXXXXXXX
```

### Running the Airtable export

When the skill generates the scripts, open PowerShell in the active run folder's `scripts` directory:

```powershell
cd "<path-to-active-run-folder>\scripts"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start-airtable-export.ps1
```

The script prompts for:

```text
Enter Airtable token:
Enter Airtable base ID:
```

Expected behavior:

- token input is hidden
- token is not printed
- export folder is created under the active run folder
- token is cleared after export

Expected output folder:

```text
<active-run-folder>\exports\airtable-export-<baseId>-<timestamp>\
```

If export succeeds, verify these files exist:

```text
manifest.json
analysis\source-summary.json
schema\tables.json
schema\views.json
data\<table>.records.json
attachments\manifest.json
```

### Airtable export troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| 401 or unauthorized | Token is wrong, expired, revoked, or missing scope | Create a new token with required scopes |
| 403 forbidden | Token does not have access to the base | Re-scope token to the specific base |
| Metadata exports but records fail | Missing `data.records:read` | Add the missing scope |
| No data files | Export script issue or no records | Confirm `data\*.records.json` exists; empty tables should still produce `[]` |
| Token appears in terminal output | Unsafe script version | Stop, rotate token, use the `Read-Host -AsSecureString` version |

## End-to-end walkthrough

Use this flow for a clean test.

### Step 1: Open or install the skill

Use one of these options.

#### Option A: Installed plugin

If the Power CAT skills marketplace/plugin is installed and exposes this skill, invoke it directly:

```text
/powercat-airtablemigration
```

#### Option B: Use directly from a cloned repo

Clone the repo and open the skill folder:

```powershell
git clone https://github.com/microsoft/power-cat-skills.git
cd "power-cat-skills\Power Platform Migration Factory\Airtable to Power Platform Migration"
```

Then prompt the agent:

```text
Use SKILL.md. Start a fresh Airtable migration run.
```

#### Option C: Use from a copied local folder

Open the folder that contains `SKILL.md` in your agent environment:

```text
<local-skill-folder>
```

### Step 2: Start a fresh run

Prompt the agent:

```text
Use SKILL.md. Start a fresh Airtable migration run.
```

The agent should create:

```text
airtable-migration-work\runs\<timestamp>\
```

Everything for that run should stay inside this folder.

### Step 3: Export Airtable

The agent should create export scripts under:

```text
<active-run-folder>\scripts\
```

Run:

```powershell
cd "<active-run-folder>\scripts"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start-airtable-export.ps1
```

Enter the Airtable token and base ID when prompted.

### Step 4: Review the Airtable analysis

The agent should create:

```text
analysis\migration-assessment.json
analysis\target-platform-recommendation.json
analysis\ai-field-mapping.json
identity\identity-mapping-proposal.json
```

Review:

- source tables
- record counts
- field types
- relationships
- AI fields
- person-like fields
- attachment count
- risks and gaps

### Step 5: Choose target platform

Choose:

```text
Dataverse tables
SharePoint Lists
Both
Plan only
```

If you are testing for the first time, recommended order:

1. Plan only.
2. Dataverse.
3. SharePoint Lists with PnP PowerShell.
4. Both.

### Step 6: Provide target details

For Dataverse, provide:

```text
Environment URL
Solution name
Existing or new solution
Publisher/prefix details if creating a solution
Owner handling preference
systemuser lookup preference
```

For SharePoint, provide:

```text
Site URL
SharePoint execution path: MCP or PnP PowerShell
Create/reuse lists
List naming convention
Lookup strategy
Person/Group strategy
Attachment strategy
```

### Step 7: Approve schema/list creation

The agent should show what will be created before it creates anything.

Approve only after verifying:

- target environment/site is correct
- solution/list naming is correct
- tables/lists are correct
- relationships/lookups are correct
- identity strategy is acceptable
- AI fields are handled as multiline text

### Step 8: Approve data import

After schema/list validation, the agent should ask once per import phase.

Example:

```text
Approve importing 30 Airtable records into Dataverse?
```

The agent should not ask per individual record unless the runtime permission system forces it.

### Step 9: Review validation reports

Review:

```text
validation\dataverse-schema-validation.json
validation\sharepoint-list-validation.json
analysis\dataverse-data-import-report.json
analysis\sharepoint-data-import-report.json
reports\End-to-End-Migration-Summary.docx
```

### Step 10: Optional app and automation phases

After data migration, choose:

```text
Plan only
Generate Code App
Generate Canvas App
Generate both
Generate automation draft flows
```

Provide screenshots/workflow notes if you want UX or automation reconstruction.

## Detailed Dataverse setup

### Step 1: Confirm Dataverse execution path

Dataverse creation requires Dataverse MCP or another approved Dataverse-capable execution tool.

Recommended:

```text
Dataverse MCP
```

Before creation, the agent should validate:

```text
Signed-in user
Environment URL
WhoAmI/current user
Solution query works
Metadata read works
Create permission is available
```

### Step 2: Sign in to target tenant

Use the Dataverse MCP sign-in flow in the agent environment.

Important:

- Sign in with the target tenant account.
- Do not assume the current desktop account is the right account.
- Do not paste access tokens into chat.

### Step 3: Provide environment URL

Example:

```text
https://orgname.crm.dynamics.com
```

The agent should confirm that the authenticated environment matches this URL.

### Step 4: Provide solution name

Use an existing unmanaged solution when possible.

Provide:

```text
Solution display name
Solution unique name, if known
```

The agent should:

1. Query matching solutions.
2. If one match exists, use it.
3. If multiple matches exist, ask you to choose.
4. If none exists, ask whether to create one.
5. Derive publisher prefix from the selected solution's publisher.

### Step 5: Review Dataverse schema plan

The plan should include:

```text
Solution
Publisher prefix
Tables
Columns
Choices
Relationships
Alternate keys
Identity mapping
Owner handling
AI field handling
Load order
Validation plan
```

Important expectations:

- `systemuser` is not a table to create or import.
- `systemuser` appears only as an optional lookup target.
- `Owner` remains unchanged unless you explicitly approve ownership changes.
- Airtable AI fields become multiline text columns.

### Step 6: Create schema

After approval, the agent creates:

```text
Choices
Tables
Columns
Relationships
Alternate keys
```

All creation must happen inside the solution.

If using Web API, create calls should include:

```text
MSCRM.SolutionUniqueName: <solution unique name>
```

### Step 7: Validate Dataverse schema

The agent should verify:

```text
solution exists
prefix matches
tables exist
columns exist
choices exist
relationships exist
Airtable Record ID columns exist
AI fields are multiline text
Owner was not changed
systemuser lookup columns are empty unless approved
```

### Step 8: Import Dataverse data

Default load order:

```text
Independent/reference tables first
Person/team member tables next
Transaction/work item tables last
```

For the support-ticket example:

```text
Ticket Category
Team Member
Support Ticket
```

The agent should:

1. Import parent/reference rows.
2. Store Airtable record ID on each row.
3. Build Airtable record ID to Dataverse GUID maps.
4. Import child rows.
5. Resolve lookups using the maps.
6. Report unresolved lookups.

## Detailed SharePoint setup

### Step 1: Choose SharePoint execution path

Choose:

```text
SharePoint/Graph MCP
PnP PowerShell interactive
Plan only
```

Recommended for easiest local testing:

```text
PnP PowerShell interactive
```

### Step 2: Prepare SharePoint site URL

Example:

```text
https://contoso.sharepoint.com/sites/SupportMigration
```

Make sure your account can:

- open the site
- read lists
- create lists
- add columns
- add list items
- resolve users

### Step 3: Install PnP PowerShell if needed

Open PowerShell:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

If prompted to trust the repository, choose yes only if you trust the source.

### Step 4: Connect to SharePoint

```powershell
Connect-PnPOnline -Url "https://contoso.sharepoint.com/sites/SupportMigration" -Interactive
```

Validate:

```powershell
Get-PnPWeb
Get-PnPList
```

### Step 5: Validate user resolution

For Person/Group columns, test with a known user:

```powershell
Ensure-PnPUser -LoginName "user@contoso.com"
```

If this fails:

- the user may not exist in the tenant
- the user may not be available to the site
- guest/external access may be blocked
- the email may be stale

The migration should still continue by preserving source name/email text and leaving Person/Group blank.

### Step 6: Review SharePoint list plan

The plan should include:

```text
Target site
Lists to create
Columns to create
Choice and multi-choice fields
Lookup fields
Person/Group fields
Attachment strategy
Many-to-many strategy
Import load order
Validation plan
Limitations
```

### Step 7: Create SharePoint lists

After approval, the agent can use PnP commands such as:

```powershell
New-PnPList -Title "Support Tickets" -Template GenericList
Add-PnPField -List "Support Tickets" -DisplayName "Subject" -InternalName "Subject" -Type Text
Add-PnPField -List "Support Tickets" -DisplayName "Description" -InternalName "Description" -Type Note
Add-PnPField -List "Support Tickets" -DisplayName "Priority" -InternalName "Priority" -Type Choice
```

Complex fields may require field XML:

```text
Choice
MultiChoice
Lookup
LookupMulti
User
UserMulti
```

### Step 8: Import SharePoint data

Default sequence:

```text
Create lists
Create simple columns
Import independent lists
Build Airtable ID -> SharePoint item ID maps
Create/resolve lookup fields
Import dependent lists
Resolve Person/Group fields when approved
Validate counts and lookups
```

Sample item creation:

```powershell
Add-PnPListItem -List "Support Tickets" -Values @{
  "Title" = "Login Issue"
  "AirtableRecordId" = "recXXXXXXXXXXXXXX"
}
```

For lookup fields:

- import target list first
- get target SharePoint item ID
- set lookup field using the target item ID

For Person/Group fields:

- resolve user with `Ensure-PnPUser`
- write resolved user field value
- if unresolved, keep source text/email and leave Person/Group blank

### Step 9: Validate SharePoint import

Verify:

```text
list item counts match source
lookup fields resolved
Person/Group fields resolved or reported
choice values imported
AI fields imported as multiline text
attachments handled per selected strategy
```
3. Add scopes:
   - `schema.bases:read`
   - `data.records:read`
4. Limit access to the specific base.
5. Use the token only in the local PowerShell prompt.
6. Revoke the token after testing if it was temporary.

The skill-generated export script will prompt for:

```text
Airtable token
Airtable base ID
```

The token should not appear in terminal output.

## Target choice

After Airtable export and analysis, the skill asks:

```text
Where do you want to migrate the Airtable data?
1. Dataverse tables
2. SharePoint Lists
3. Both
4. Plan only
```

Use **Dataverse** when:

- relationships matter
- row-level security matters
- ownership, teams, or roles matter
- business logic is complex
- Code App or enterprise Canvas App is likely

Use **SharePoint Lists** when:

- the app is list-centric
- relationships are shallow
- users want lightweight collaboration
- list forms/views and simple Canvas Apps are sufficient

Use **Both** when:

- Dataverse should be the system of record
- SharePoint is useful for collaboration or operational views

Use **Plan only** when:

- the target is not decided
- auth/tooling is not ready
- you want only the DOCX/JSON plans

## Dataverse prerequisites

Dataverse creation/import requires a Dataverse-capable execution path.

Recommended path:

- Dataverse MCP server configured in the agent environment.
- Interactive sign-in to the target tenant.
- Target Dataverse environment URL.
- Existing or new solution name.
- Permission to create solution components.

The skill should:

1. Trigger or guide Dataverse MCP sign-in.
2. Confirm signed-in user.
3. Confirm environment URL.
4. Ask for target solution name.
5. Resolve the solution.
6. Derive publisher prefix from the solution publisher.
7. Ask for approval before creating anything.

Important:

- Prefix comes from the solution publisher, not the solution name.
- All Dataverse metadata creation must happen inside the selected solution.
- Use solution context for create calls, for example:

```text
MSCRM.SolutionUniqueName: <solution unique name>
```

### Dataverse details to prepare

Have these ready:

```text
Environment URL
Solution display name
Solution unique name, if known
Publisher/prefix, if creating a new solution
Whether Owner should remain unchanged
Whether optional systemuser lookup columns should be created
```

Default recommendation:

- Leave `Owner` unchanged.
- Preserve custom `Team Member` table.
- Use optional `systemuser` lookup only after identity mapping approval.

## SharePoint prerequisites

SharePoint Lists can be created/imported through either:

1. SharePoint/Graph MCP
2. PnP PowerShell interactive

### Option A: SharePoint/Graph MCP

Use this when your agent environment has SharePoint or Microsoft Graph MCP configured.

The skill should:

1. Trigger or guide SharePoint/Graph sign-in.
2. Confirm signed-in user.
3. Ask for target SharePoint site URL.
4. Validate site access.
5. Validate list read/create permissions.
6. Validate user resolution for Person/Group fields.
7. Ask for approval before list creation.

### Option B: PnP PowerShell interactive

Use this when SharePoint MCP setup is unavailable or when a local/customer-run approach is easier.

Prerequisite:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

Connect:

```powershell
Connect-PnPOnline -Url "<siteUrl>" -Interactive
```

Common operations:

```powershell
Get-PnPWeb
Get-PnPList
New-PnPList -Title "<ListTitle>" -Template GenericList
Add-PnPField -List "<ListTitle>" -DisplayName "<ColumnName>" -InternalName "<InternalName>" -Type Text
Add-PnPListItem -List "<ListTitle>" -Values @{ "Title" = "<value>" }
Ensure-PnPUser -LoginName "<userPrincipalNameOrEmail>"
```

### SharePoint details to prepare

Have these ready:

```text
SharePoint site URL
Create new lists or reuse existing lists
List naming convention
Whether each Airtable table becomes a list
Lookup strategy for linked records
Many-to-many strategy
Person/Group field strategy
Attachment strategy
```

Default recommendation:

- One Airtable table maps to one SharePoint list.
- Simple linked records become lookup columns.
- Complex many-to-many relationships should be reviewed.
- Person-like fields can become Person/Group columns when users resolve.
- Preserve source name/email text fields for unresolved users.

## Identity mapping

The skill should not create users.

For Dataverse:

```text
Team Member custom table
Mapped Dataverse User -> optional systemuser lookup
Assigned System User -> optional systemuser lookup
Owner -> unchanged unless explicitly approved
```

For SharePoint:

```text
Source Name -> text
Source Email -> text
Mapped User / Assigned To -> Person/Group column when resolved
```

Resolution priority:

1. Entra/AAD object ID
2. UPN/email
3. SharePoint site user lookup, for SharePoint
4. Display name only as manual review

Unresolved users should not block migration.

## AI fields

Airtable AI fields, such as `aiText` or fields marked `(AI)`, should migrate as multiline text.

The skill should:

- create multiline text columns
- migrate current AI-generated values when present
- document the prompt and source fields
- mark regeneration as a post-migration enhancement

AI fields should not block schema creation or data import.

## App generation choices

After data migration, the skill asks:

```text
What app experience do you want to generate?
1. Plan only
2. Generate Code App
3. Generate Canvas App
4. Generate both Code App and Canvas App
```

Code App is best when:

- custom React/TypeScript UX is needed
- advanced components are required
- developer-owned source code is preferred

Canvas App is best when:

- low-code maker ownership is preferred
- standard forms/galleries/screens are sufficient
- Power Fx and Power Platform-native maintenance are desired

Both can be used when:

- Code App is the advanced UX
- Canvas App is the admin or operations app

## UX evidence

If the user wants to replicate Airtable UX, provide:

```text
screenshots/
screen recordings, optional
page names and navigation
role descriptions
button/action descriptions
workflow notes
```

Page source HTML alone is not enough to fully recreate UX, but it can provide clues such as app ID, table IDs, page IDs, and Airtable runtime endpoints.

The generated UX should be treated as a first-pass scaffold. Button behavior, role-specific behavior, validations, conditional visibility, and automation-driven behavior require follow-up prompts and validation.

## Automation migration

If migrating Airtable automations, provide:

```text
automation screenshots
trigger descriptions
conditions
actions
email or Teams templates
scripts
webhook/integration notes
```

The skill can generate:

```text
analysis/automation-conversion-plan.json
flows/<flow-name>.draft.json
reports/Automation-Migration-Plan.docx
```

Flows should be draft-first and reviewed before enabling.

## Expected artifacts

Each run can produce:

```text
analysis/
  migration-assessment.json
  target-platform-recommendation.json
  target-details.json
  ai-field-mapping.json
  dataverse-schema-plan.json
  sharepoint-list-plan.json
  app-modernization-plan.json
  code-app-plan.json
  canvas-app-plan.json
  automation-conversion-plan.json

reports/
  Data-Migration-Plan.docx
  SharePoint-Migration-Plan.docx
  App-Modernization-Plan.docx
  UX-Reconstruction-Plan.docx
  Code-App-Plan.docx
  Canvas-App-Plan.docx
  Automation-Migration-Plan.docx
  End-to-End-Migration-Summary.docx

validation/
  dataverse-schema-validation.json
  sharepoint-list-validation.json

flows/
  <flow-name>.draft.json

apps/
  code-app/
  canvas-app/
```

## Approval gates

The skill should ask for approval at phase gates, not per record.

Approval gates:

- approve target platform
- approve target environment/site and solution/list plan
- approve Dataverse schema creation
- approve SharePoint list creation
- approve data import
- approve identity lookup population
- approve Owner changes
- approve app generation
- approve flow creation/enabling

For data import, the skill should ask once per import phase, for example:

```text
Approve importing 30 Airtable records into the selected target?
```

It should not ask for each individual record unless the runtime permission system forces it.

## How to start

Choose one of these startup paths.

### Option A: Installed plugin

```text
/powercat-airtablemigration
```

### Option B: Directly from the repo

```powershell
git clone https://github.com/microsoft/power-cat-skills.git
cd "power-cat-skills\Power Platform Migration Factory\Airtable to Power Platform Migration"
```

Then prompt the agent:

```text
Use SKILL.md. Start a fresh Airtable migration run.
```

### Option C: Copied folder

Open any local folder that contains `SKILL.md`, then prompt:

```text
Use SKILL.md. Start a fresh Airtable migration run.
```

Then follow the prompts.

Recommended first test:

1. Airtable export only.
2. Plan only.
3. Dataverse target dry run.
4. SharePoint target dry run.
5. Full Dataverse import.
6. Full SharePoint import.
7. Optional app generation.
8. Optional automation draft generation.
