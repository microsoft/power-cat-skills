# Airtable to Microsoft App Modernization Skill

This skill migrates an Airtable app into a Microsoft data platform target and then lets the user choose the target app experience: Code App, Canvas App, both, or plan-only. It supports Dataverse tables and SharePoint Lists as data targets. It is designed for Claude/GitHub Copilot-style agents with shell, filesystem, Dataverse MCP, Microsoft Graph/SharePoint MCP or PnP PowerShell, and optional app-generation tooling access.

The skill owns the full flow:

1. Connect to Airtable through a local prompt.
2. Export schema and data.
3. Analyze Airtable tables, fields, relationships, choices, AI fields, identity fields, and records.
4. Ask whether the user wants Dataverse tables, SharePoint Lists, both, or plan-only.
5. Produce and review the selected target migration plan.
6. For Dataverse: connect through Dataverse MCP, resolve solution/prefix, create schema, validate, and import data.
7. For SharePoint: connect through Graph/SharePoint MCP or PnP PowerShell interactive auth, resolve site, create lists/columns, validate, and import data.
8. Ask whether the user wants a Code App, Canvas App, both, or plan-only.
9. Generate the selected app experience from the migrated Microsoft data platform target.

## Critical rules

- Never ask the user to paste Airtable tokens, Dataverse tokens, passwords, or secrets into chat.
- Airtable token input must happen through a local terminal prompt using `Read-Host -AsSecureString`.
- Never print token length, prefix, suffix, masked token metadata, or token-derived values.
- Dataverse sign-in must happen through Dataverse MCP interactive auth, not by pasting tokens.
- SharePoint sign-in must happen through Graph/SharePoint MCP interactive auth, PnP PowerShell `Connect-PnPOnline -Interactive`, or another approved local auth tool, not by pasting tokens.
- Do not create Dataverse or SharePoint objects until the user approves the reviewed target plan.
- Do not import data until target schema/list creation is verified.
- Do not populate `systemuser` lookups or change record `Owner` until identity mapping is separately approved.
- Never create Dataverse `systemuser` rows.
- All Dataverse metadata creation must happen inside the selected solution.
- If the target solution already exists, derive the prefix from the solution publisher. Do not infer prefix from the solution name.
- If the target solution does not exist, ask whether to create it and which publisher/prefix to use.
- For SharePoint targets, ask for/resolve the target site URL and create/reuse lists only after explicit approval.
- SharePoint Person/Group columns can be used for user fields, but preserve source name/email text so unresolved users do not block migration.
- UX and automation conversion are optional post-migration phases. Treat them as reviewable scaffolds/drafts, not guaranteed pixel-perfect or behavior-complete clones.
- Reuse the established Dataverse or SharePoint target context for app data sources and Flow/Power Automate environment selection when available.
- In addition to machine-readable JSON artifacts, generate user-friendly DOCX plans/reports when document-generation tooling is available.

## Expected agent capabilities

The agent should have:

- shell access
- filesystem access
- internet access for Airtable API calls
- Dataverse MCP tools or a Dataverse MCP server configured in the agent environment
- Microsoft Graph/SharePoint MCP tools, an equivalent SharePoint-capable MCP server, or PnP PowerShell when SharePoint Lists are selected

If Dataverse MCP is unavailable, stop at the Dataverse MCP preflight and tell the user what is missing. Do not improvise another auth path unless the user explicitly asks.
If SharePoint/Graph MCP is unavailable and SharePoint Lists are selected, offer PnP PowerShell interactive as the supported fallback. If neither SharePoint MCP nor PnP PowerShell is available, stop and tell the user what is missing.

## Phase 0: Start

When invoked, say:

> We will start in assessment mode. I will export Airtable locally, analyze the schema/data, ask whether you want Dataverse tables, SharePoint Lists, both, or plan-only, then connect to the selected Microsoft target through MCP. I will not create target objects or import data until you approve the target environment/site, schema/list plan, and object list.

Then create a fresh run by default.

### Fresh-run rule

Every invocation starts a new timestamped run folder unless the user explicitly says they want to resume a prior run.

Default behavior:

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

Rules:

- The timestamped run folder is the single container for the migration. All artifacts for that migration must land under that folder.
- Do not silently reuse prior exports, plans, approvals, Dataverse creation results, or import reports.
- Do not say a prior migration is already done unless the user explicitly selected resume.
- Treat prior runs as historical reference only.
- A fresh run must create a new export, new assessment, new schema plan, and new approval gates.
- Do not write generated apps, flow drafts, runbooks, reports, logs, screenshots, or temporary files outside the active run folder unless the user explicitly asks for a different output path.
- If existing Dataverse objects are detected during creation, handle them with idempotency/schema-drift checks, not by assuming the prior skill run completed correctly.

Ask only if a prior run is detected:

```text
Prior migration runs were found. Start fresh or resume one?
```

Recommended/default answer: Start fresh.

## Phase 1: Generate Airtable export scripts

Create or use the current fresh run folder:

```text
airtable-migration-work/
  runs/
    <timestamp>/
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

Set an internal `ACTIVE_RUN_FOLDER` variable/path and use it for every output in the run.

Generate:

```text
<ACTIVE_RUN_FOLDER>/scripts/start-airtable-export.ps1
<ACTIVE_RUN_FOLDER>/scripts/export-airtable.ps1
```

### `scripts/start-airtable-export.ps1`

```powershell
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$exporterPath = Join-Path $scriptDir "export-airtable.ps1"

if (-not (Test-Path $exporterPath)) {
    throw "Could not find exporter script at $exporterPath"
}

$secureToken = Read-Host "Enter Airtable token" -AsSecureString
$env:AIRTABLE_BASE_ID = Read-Host "Enter Airtable base ID"

$tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
    $env:AIRTABLE_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
}

if ([string]::IsNullOrWhiteSpace($env:AIRTABLE_TOKEN)) { throw "Airtable token is required." }
if ([string]::IsNullOrWhiteSpace($env:AIRTABLE_BASE_ID)) { throw "Airtable base ID is required." }

Write-Host ""
Write-Host "Airtable token captured securely."
Write-Host "Base ID: $env:AIRTABLE_BASE_ID"
Write-Host ""

& $exporterPath
```

### `scripts/export-airtable.ps1`

```powershell
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:AIRTABLE_TOKEN)) { throw "AIRTABLE_TOKEN is not set. Run start-airtable-export.ps1 first in this same PowerShell window." }
if ([string]::IsNullOrWhiteSpace($env:AIRTABLE_BASE_ID)) { throw "AIRTABLE_BASE_ID is not set. Run start-airtable-export.ps1 first in this same PowerShell window." }

$baseId = $env:AIRTABLE_BASE_ID
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$exportRoot = Join-Path (Get-Location) "..\exports\airtable-export-$baseId-$timestamp"
$exportRoot = [System.IO.Path]::GetFullPath($exportRoot)

$schemaDir = Join-Path $exportRoot "schema"
$dataDir = Join-Path $exportRoot "data"
$attachmentsDir = Join-Path $exportRoot "attachments"
$interfacesDir = Join-Path $exportRoot "interfaces"
$automationsDir = Join-Path $exportRoot "automations"
$permissionsDir = Join-Path $exportRoot "permissions"
$identityDir = Join-Path $exportRoot "identity"
$analysisDir = Join-Path $exportRoot "analysis"

New-Item -ItemType Directory -Force -Path $schemaDir, $dataDir, $attachmentsDir, $interfacesDir, $automationsDir, $permissionsDir, $identityDir, $analysisDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $interfacesDir "screenshots") | Out-Null

$headers = @{ Authorization = "Bearer $env:AIRTABLE_TOKEN" }

function ConvertTo-SafeFileName {
    param([string]$Name)
    $invalid = [System.IO.Path]::GetInvalidFileNameChars()
    $safe = $Name
    foreach ($char in $invalid) { $safe = $safe.Replace($char, "_") }
    return $safe
}

function Invoke-AirtableGet {
    param([string]$Uri)
    return Invoke-RestMethod -Method Get -Uri $Uri -Headers $headers
}

function Write-JsonArray {
    param([System.Collections.IEnumerable]$Items, [string]$Path)
    $array = @($Items)
    if ($array.Count -eq 0) {
        "[]" | Set-Content -Encoding UTF8 $Path
        return
    }
    $array | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 $Path
}

try {
    Write-Host "Exporting Airtable base metadata..."
    $metadataUri = "https://api.airtable.com/v0/meta/bases/$baseId/tables"
    $metadata = Invoke-AirtableGet -Uri $metadataUri
    $metadata | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 (Join-Path $schemaDir "base.json")
    Write-JsonArray -Items @($metadata.tables) -Path (Join-Path $schemaDir "tables.json")

    $views = foreach ($table in @($metadata.tables)) {
        foreach ($view in @($table.views)) {
            [pscustomobject]@{
                tableId = $table.id
                tableName = $table.name
                viewId = $view.id
                viewName = $view.name
                type = $view.type
            }
        }
    }
    Write-JsonArray -Items @($views) -Path (Join-Path $schemaDir "views.json")

    $attachmentManifest = New-Object System.Collections.Generic.List[object]
    $tableSummaries = New-Object System.Collections.Generic.List[object]

    foreach ($table in @($metadata.tables)) {
        $safeTableName = ConvertTo-SafeFileName -Name $table.name
        $records = New-Object System.Collections.Generic.List[object]
        $offset = $null
        Write-Host "Exporting records from table: $($table.name)"

        do {
            $recordsUri = "https://api.airtable.com/v0/$baseId/$($table.id)?pageSize=100"
            if (-not [string]::IsNullOrWhiteSpace($offset)) {
                $recordsUri = "$recordsUri&offset=$([System.Uri]::EscapeDataString($offset))"
            }

            $page = Invoke-AirtableGet -Uri $recordsUri
            foreach ($record in @($page.records)) {
                $records.Add($record)

                foreach ($field in @($table.fields)) {
                    if ($field.type -eq "multipleAttachments" -and $record.fields.PSObject.Properties.Name -contains $field.name) {
                        foreach ($attachment in @($record.fields.($field.name))) {
                            $attachmentManifest.Add([pscustomobject]@{
                                tableId = $table.id
                                tableName = $table.name
                                fieldId = $field.id
                                fieldName = $field.name
                                recordId = $record.id
                                attachmentId = $attachment.id
                                fileName = $attachment.filename
                                type = $attachment.type
                                size = $attachment.size
                                url = $attachment.url
                            })
                        }
                    }
                }
            }
            $offset = $page.offset
        } while (-not [string]::IsNullOrWhiteSpace($offset))

        $recordFile = Join-Path $dataDir "$($table.id)-$safeTableName.records.json"
        Write-JsonArray -Items $records.ToArray() -Path $recordFile

        $tableSummaries.Add([pscustomobject]@{
            id = $table.id
            name = $table.name
            fieldCount = @($table.fields).Count
            viewCount = @($table.views).Count
            recordCount = $records.Count
            recordFile = Split-Path -Leaf $recordFile
        })
    }

    Write-JsonArray -Items $attachmentManifest.ToArray() -Path (Join-Path $attachmentsDir "manifest.json")

    $summaryTables = $tableSummaries.ToArray()
    $summary = [pscustomobject]@{
        exportedAt = (Get-Date).ToString("o")
        baseId = $baseId
        tableCount = @($metadata.tables).Count
        tables = $summaryTables
        attachmentCount = $attachmentManifest.Count
        notes = @(
            "Airtable Interface Designer pages are not included in the Airtable API export.",
            "Add screenshots or recordings under interfaces\\screenshots before Code App UX reconstruction.",
            "Add automation screenshots, scripts, and notes under automations when available.",
            "Add identity mapping input under identity\\identity-mapping-input.csv if AAD object IDs or UPN mappings are available.",
            "Airtable AI fields are migratable as multiline text; prompt regeneration is a post-migration enhancement."
        )
    }
    $summary | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 (Join-Path $analysisDir "source-summary.json")

    $identityReadme = @"
Optional identity mapping input:

Create identity-mapping-input.csv here if you have Entra/AAD identifiers.
Recommended columns:
source_table,source_record_id,source_name,source_email,source_upn,azureactivedirectoryobjectid

Match priority:
1. azureactivedirectoryobjectid
2. customer-provided object ID mapping
3. UPN/domainname
4. internalemailaddress
5. display name only for manual review
"@
    $identityReadme | Set-Content -Encoding UTF8 (Join-Path $identityDir "README.txt")

    $manifest = [pscustomobject]@{
        packageType = "airtable-codeapp-migration-export"
        version = "1.0"
        exportedAt = (Get-Date).ToString("o")
        baseId = $baseId
        folders = @{
            schema = "schema"
            data = "data"
            attachments = "attachments"
            interfaces = "interfaces"
            automations = "automations"
            permissions = "permissions"
            identity = "identity"
            analysis = "analysis"
        }
    }
    $manifest | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 (Join-Path $exportRoot "manifest.json")

    Write-Host ""
    Write-Host "Airtable export complete."
    Write-Host "Export folder: $exportRoot"
}
finally {
    Remove-Item Env:\AIRTABLE_TOKEN -ErrorAction SilentlyContinue
    Write-Host "AIRTABLE_TOKEN has been cleared from this PowerShell session."
}
```

Tell the user to run:

```powershell
cd "<working-folder>\scripts"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start-airtable-export.ps1
```

## Phase 2: Analyze export

Find the newest `exports/airtable-export-*` folder.

Read:

```text
manifest.json
analysis/source-summary.json
schema/tables.json
schema/views.json
data/*.records.json
attachments/manifest.json
identity/identity-mapping-input.csv, if present
```

Create:

```text
analysis/migration-assessment.json
analysis/ai-field-mapping.json
identity/identity-mapping-proposal.json
analysis/target-platform-recommendation.json
analysis/target-details.json
analysis/dataverse-schema-plan.json
analysis/dataverse-creation-runbook.json
analysis/dataverse-target-context.json, if Dataverse is selected
analysis/sharepoint-list-plan.json, if SharePoint is selected or recommended
analysis/sharepoint-import-plan.json, if SharePoint is selected or recommended
analysis/sharepoint-target-context.json, if SharePoint is selected
reports/Data-Migration-Plan.docx, if DOCX tooling is available
```

## Phase 3: Target platform choice

After Airtable export analysis, ask:

> Where do you want to migrate the Airtable data?

Offer choices:

1. Dataverse tables.
2. SharePoint Lists.
3. Both.
4. Plan only.

Before the user chooses, generate and show `analysis/target-platform-recommendation.json`.

Recommendation guidance:

```text
Recommend Dataverse when:
  - relationships are important
  - row-level security, ownership, teams, or roles matter
  - data volume or lifecycle complexity is high
  - app logic needs robust APIs/plugins/solutions
  - Code App or enterprise Canvas App is likely

Recommend SharePoint Lists when:
  - data is simple/list-like
  - relationships are shallow
  - the customer wants lightweight lists/forms quickly
  - SharePoint site/list ownership is preferred
  - Canvas App or simple Power Automate over lists is enough

Recommend Both when:
  - Dataverse is the system of record
  - SharePoint Lists are needed for lightweight team collaboration or read-only operational views

Recommend Plan only when:
  - target auth/tooling is unavailable
  - relationship/security complexity needs review
  - the user is still deciding between targets
```

Do not create either target until the user approves the selected target plan.

## Phase 4: Target details intake

Run this immediately after the user selects Dataverse, SharePoint Lists, Both, or Plan only. This is a logical first step before target-specific planning because the environment/site/solution/list container affects naming, prefix, permissions, available connectors, and whether artifacts can be created.

### If Dataverse is selected

Ask for:

- Target Dataverse environment URL.
- Whether to use an existing solution or create a new solution.
- Existing/new solution display name.
- Existing/new solution unique name, if known.
- Publisher name/prefix only if a new solution must be created or multiple publishers are available.
- Whether optional `systemuser` lookup columns should be created now but left unpopulated.
- Whether record `Owner` should remain unchanged/default. Default: yes.

Then, through Dataverse MCP preflight, validate:

- signed-in user
- target environment URL
- metadata read permission
- solution exists or can be created
- publisher and customization prefix
- create permission, if creation is requested

Do not derive the prefix from the solution name. If the solution exists, derive prefix from the solution publisher. If creating a new solution, derive prefix from the selected publisher.

Write/update:

```text
analysis/target-details.json
analysis/dataverse-target-context.json
```

### If SharePoint Lists are selected

Ask for:

- Target SharePoint site URL.
- SharePoint execution path:
  - SharePoint/Graph MCP
  - PnP PowerShell interactive
  - Plan only
- Whether to create new lists or reuse existing lists.
- Preferred list naming convention or list name prefix/suffix.
- Whether each Airtable table should become a separate list. Default: yes.
- Whether simple linked-record fields should become SharePoint lookup columns. Default: yes.
- How to handle many-to-many relationships:
  - junction list
  - multi-lookup
  - text fallback
  - recommend Dataverse instead
- Whether person-like fields should create SharePoint Person/Group columns. Default: yes, with source text/email preserved.
- Whether unresolved users should leave Person/Group blank and keep source text/email. Default: yes.
- Attachment strategy:
  - list attachments
  - document library
  - metadata only

Then, through the selected SharePoint execution path, validate:

- signed-in user
- target site exists
- list read permission
- list creation/update permission
- user resolution capability for Person/Group fields
- lookup column feasibility

Write/update:

```text
analysis/target-details.json
analysis/sharepoint-target-context.json
```

### If Both is selected

Collect and validate both Dataverse and SharePoint details. Ask which target is the system of record:

```text
1. Dataverse is system of record; SharePoint is collaboration/read-only/operational view.
2. SharePoint is system of record; Dataverse is optional advanced app target.
3. Both are independent outputs from Airtable.
```

Default recommendation: Dataverse as system of record, SharePoint as collaboration/read-only/operational view.

### If Plan only is selected

Ask for intended target details if known, but do not require auth. Mark unknown details as assumptions in the plan.

## Phase 5: AI field mapping

For Airtable `aiText` fields or fields marked `(AI)`:

- Create Dataverse column as multiline text.
- Migrate current generated value when present.
- Mark as `aiDerived: true`.
- Classify as `migratable_with_gap`.
- Extract prompt text and referenced field names.
- Do not block migration if values are null, empty, or stale.
- Recommend manual recreation as Copilot prompt, Power Automate AI step, plugin/action, or app-side AI command only if ongoing generation is needed.

## Phase 6: Identity mapping

Use a custom person table plus optional `systemuser` lookup:

```text
Team Member / Employee custom table
  Mapped Dataverse User -> systemuser, optional

Work item / ticket table
  Assigned Team Member -> custom person table
  Assigned System User -> systemuser, optional
  Owner -> unchanged unless row-level security is approved
```

Match priority:

1. `azureactivedirectoryobjectid`
2. customer-provided object ID mapping file
3. UPN / `domainname`
4. `internalemailaddress`
5. display name only for manual review

Classify each source person:

- `active_match`
- `disabled_match`
- `multiple_match`
- `no_match`
- `missing_identifier`
- `manual_review`

Do not populate optional Dataverse `systemuser` lookups or SharePoint Person/Group fields until the user approves identity mapping.

## Phase 7: SharePoint Lists planning branch

Run this if the user selected SharePoint Lists or Both.

Generate:

```text
analysis/sharepoint-list-plan.json
analysis/sharepoint-import-plan.json
reports/SharePoint-Migration-Plan.docx, if DOCX tooling is available
```

Default Airtable to SharePoint mapping:

```text
Airtable table -> SharePoint list
singleLineText -> Single line of text
multilineText -> Multiple lines of text
number -> Number
date/dateTime -> Date and time
checkbox -> Yes/No
singleSelect -> Choice
multipleSelects -> Choice with multiple selections
multipleRecordLinks, single preferred -> Lookup column
multipleRecordLinks, many-to-many -> multi-lookup, junction list, or text fallback after review
multipleAttachments -> list attachments or document library strategy
email -> Single line of text or Person column candidate
collaborator/person-like field -> Person/Group column when resolvable, text fallback otherwise
aiText or (AI) -> Multiple lines of text, AI-derived with regeneration gap
formula/count/rollup -> stored value or calculated column if simple
```

Relationship rules:

- Use SharePoint lookup columns for simple one-to-many lookups.
- Do not create both sides of a reverse relationship unless explicitly needed.
- For many-to-many relationships, ask whether to:
  - create a junction list,
  - use a multi-lookup column,
  - store source linked record names/IDs as text,
  - or recommend Dataverse instead.
- If SharePoint lookup limits or delegation concerns are likely, flag them in the plan.

SharePoint user/people picker handling:

- Use SharePoint Person/Group columns for person-like fields when users can be resolved.
- Preserve source person data in text columns such as `Source Name`, `Source Email`, and `Airtable Record ID`.
- Resolve users in this priority:
  1. Entra/AAD object ID, if available.
  2. UPN/email.
  3. SharePoint site user lookup.
  4. Display name only as manual review, never automatic.
- Classify each source person:
  - `active_match`
  - `external_or_guest`
  - `multiple_match`
  - `no_match`
  - `missing_identifier`
  - `manual_review`
- If a user cannot be resolved, leave the Person/Group field blank, keep the text/email fields, and report the gap.

SharePoint suitability warnings:

- SharePoint Lists are not a full Dataverse replacement for complex relational apps.
- If the Airtable app has many linked tables, row-level security needs, complex business rules, or high-scale app requirements, recommend Dataverse.

## Phase 8: SharePoint auth preflight

Run this if the user selected SharePoint Lists or Both.

Before auth, ask which execution path to use if it was not already captured:

```text
1. SharePoint/Graph MCP
2. PnP PowerShell interactive
3. Plan only
```

Use SharePoint/Graph MCP when the agent environment has it configured. Use PnP PowerShell interactive when MCP setup is not available or the user prefers local/customer-run scripting.

### SharePoint/Graph MCP path

Steps:

1. Detect SharePoint/Graph MCP availability.
2. If unavailable, offer PnP PowerShell interactive as fallback.
3. Trigger or guide Microsoft Graph/SharePoint interactive sign-in.
4. Instruct the user to sign in to the target tenant account.
5. Use the SharePoint site URL collected in Target details intake; if missing, ask before proceeding.
6. Run read-only validation:
   - current user
   - target site exists
   - list read permission
   - list creation permission if creating new lists
   - user resolution capability for Person/Group fields
7. Display:
   - signed-in user
   - site URL
   - site title/id when available
   - permission summary

Do not create lists during preflight.

### PnP PowerShell interactive path

Use this when SharePoint/Graph MCP is unavailable or the user selects PnP PowerShell.

Preflight behavior:

1. Check whether `PnP.PowerShell` is installed.
2. If missing, ask for approval to install it for the current user:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

3. Connect interactively:

```powershell
Connect-PnPOnline -Url "<siteUrl>" -Interactive
```

4. Validate the connection with read-only calls:

```powershell
Get-PnPWeb
Get-PnPList
```

5. Validate list creation permission with a non-destructive permission check where possible. Do not create test lists unless the user approves.
6. Validate user resolution capability for Person/Group fields with:

```powershell
Ensure-PnPUser -LoginName "<userPrincipalNameOrEmail>"
```

Use this only for sample/approved users during preflight.

Do not create lists during preflight.

## Phase 9: SharePoint list creation and validation

Run only after explicit user approval.

Use the selected SharePoint execution path:

- SharePoint/Graph MCP, if selected and available.
- PnP PowerShell, if selected.

Creation order:

1. Create/reuse SharePoint lists for independent tables.
2. Create/reuse text, number, date, choice, multi-choice, multiline text, and source ID columns.
3. Create lookup columns after target lists exist.
4. Create Person/Group columns where approved.
5. Validate list schemas.

Creation must be idempotent:

- If list/column exists and matches, reuse it.
- If list/column exists and conflicts, stop and report schema drift.
- Do not silently overwrite incompatible list schema.

PnP PowerShell implementation guidance:

```powershell
Connect-PnPOnline -Url "<siteUrl>" -Interactive
New-PnPList -Title "<ListTitle>" -Template GenericList
Add-PnPField -List "<ListTitle>" -DisplayName "<ColumnName>" -InternalName "<InternalName>" -Type Text
Add-PnPField -List "<ListTitle>" -DisplayName "<ColumnName>" -InternalName "<InternalName>" -Type Note
Add-PnPField -List "<ListTitle>" -DisplayName "<ColumnName>" -InternalName "<InternalName>" -Type Number
Add-PnPField -List "<ListTitle>" -DisplayName "<ColumnName>" -InternalName "<InternalName>" -Type DateTime
```

Use field XML for more complex column types when required:

- Choice
- MultiChoice
- Lookup
- LookupMulti
- User
- UserMulti

For Person/Group fields, use SharePoint user fields and resolve people with `Ensure-PnPUser`.

For lookup fields, create target lists first, then create lookup columns after the lookup target exists.

Write:

```text
analysis/sharepoint-list-validation.json
```

## Phase 10: SharePoint data import

Run only after list schema validation and explicit user approval.

Use the selected SharePoint execution path:

- SharePoint/Graph MCP, if selected and available.
- PnP PowerShell, if selected.

Import rules:

- Import lists in dependency order.
- Store Airtable record ID on every item.
- Build Airtable record ID to SharePoint item ID maps.
- Resolve lookup columns from those maps.
- Resolve Person/Group fields only when approved and resolvable.
- Leave unresolved Person/Group fields blank and preserve source text/email.
- Migrate AI fields as multiline text.
- Do not enable flows or automations during data import.

PnP PowerShell implementation guidance:

```powershell
Add-PnPListItem -List "<ListTitle>" -Values @{
  "Title" = "<value>"
  "AirtableRecordId" = "<rec...>"
}
```

For lookup fields:

- Import target lists first.
- Query created items and build Airtable record ID to SharePoint item ID maps.
- Write lookup columns with SharePoint item IDs.

For Person/Group fields:

- Resolve each approved user with `Ensure-PnPUser`.
- Write the Person/Group field using the resolved SharePoint user identity/id format supported by the installed PnP version.
- If resolution fails, leave Person/Group blank and preserve source name/email text fields.

For large imports:

- Batch logically by list.
- Add retry/backoff for throttling.
- Write progress logs under `logs/`.
- Do not ask for approval per item; ask once per import phase unless the runtime forces per-write prompts.

Write:

```text
analysis/sharepoint-data-import-report.json
```

Validate:

- source vs SharePoint item counts
- lookup resolution counts
- Person/Group resolution counts
- skipped/unresolved users
- choice value mapping
- AI value preservation

## Phase 11: Review Dataverse plan with user

Run this if the user selected Dataverse or Both.

Before Dataverse MCP sign-in, show the plan:

- target solution display name, if known
- tables to create
- choices to create
- relationships to create
- AI fields and migration gaps
- identity mapping approach
- Owner handling
- import load order
- known gaps

Ask for approval to proceed to Dataverse MCP auth preflight.

## Phase 12: Dataverse MCP auth preflight

Run this if the user selected Dataverse or Both.

The skill must handle Dataverse MCP connection before creation.

Steps:

1. Detect Dataverse MCP availability.
2. If unavailable, stop and tell the user Dataverse MCP must be configured in this agent environment.
3. Trigger Dataverse MCP interactive sign-in.
4. Instruct user to sign in to the target tenant account.
5. Use the Dataverse environment URL collected in Target details intake; if missing, ask before proceeding.
6. Run read-only validation:
   - WhoAmI/current user
   - org/environment URL
   - metadata read check
   - solutions query
7. Display:
   - signed-in user
   - org URL
   - tenant/environment context if available
8. Use the solution name collected in Target details intake; if missing, ask before proceeding.

Do not create anything during preflight.

## Phase 13: Solution resolution and prefix derivation

Run this if the user selected Dataverse or Both.

All Dataverse objects must be created inside a solution.

Given a solution name from the user:

1. Query solutions by unique name and display/friendly name.
2. If exactly one solution matches:
   - use it
   - expand publisher
   - read `publisherid.customizationprefix`
   - update schema plan with resolved unique name and prefix
3. If multiple solutions match:
   - ask the user to choose one
4. If no solution matches:
   - ask whether to create a new solution
   - ask/select publisher
   - derive prefix from publisher, not solution name

For Web API metadata creation, include:

```text
MSCRM.SolutionUniqueName: <solution unique name>
```

Read-only lookup shape:

```http
GET /api/data/v9.2/solutions?$select=uniquename,friendlyname,version&$expand=publisherid($select=customizationprefix,friendlyname)
```

Filter locally or use supported OData filters for exact unique/display name matching.

## Phase 14: Final approval before Dataverse creation

Run this if the user selected Dataverse or Both.

Show:

- environment URL
- signed-in user
- solution unique name and display name
- publisher and prefix
- tables/columns/choices/relationships to create
- whether existing objects will be reused
- schema drift warnings
- data import will not run yet

Ask:

> Approve Dataverse schema creation in this environment and solution?

Proceed only on explicit approval.

## Phase 15: Create Dataverse schema

Run this if the user selected Dataverse or Both.

Creation order:

1. Create or reuse solution, if approved.
2. Create/reuse global choices.
3. Create/reuse tables.
4. Create/reuse columns.
5. Create/reuse relationships.
6. Create/reuse alternate keys on Airtable Record ID.
7. Publish customizations.
8. Read back metadata and verify.

Default table pattern:

```text
Ticket Category
Team Member
Support Ticket
```

Default choice pattern:

```text
Status -> Choice
Priority -> Choice
Subcategory -> Choice
Role -> Choice
Department -> Choice
Skills -> Multi-select Choice
```

Default AI field pattern:

```text
<AI field> -> Multiline Text, aiDerived metadata in plan/report
```

Default identity pattern:

```text
Team Member.Email -> email column
Team Member.Mapped Dataverse User -> optional systemuser lookup
Support Ticket.Assigned Team Member -> Team Member lookup
Support Ticket.Assigned System User -> optional systemuser lookup
Owner -> unchanged
```

Creation must be idempotent:

- If an object exists and matches, reuse it.
- If it exists and conflicts, stop and report schema drift.
- Do not silently overwrite incompatible metadata.

## Phase 16: Validate Dataverse schema

Run this if the user selected Dataverse or Both.

After creation, verify:

- solution exists
- publisher prefix matches plan
- all choices exist with expected values
- all tables exist
- all columns exist
- all relationships exist
- Airtable Record ID columns exist
- alternate keys exist or are queued/created
- AI fields are multiline text
- Skills is multi-select choice
- Owner was not changed
- optional `systemuser` lookups exist but are empty

Write:

```text
analysis/dataverse-schema-validation.json
```

## Phase 17: Approval before Dataverse import

Run this if the user selected Dataverse or Both.

Show schema validation summary.

Ask:

> Approve data import from Airtable export into Dataverse?

Proceed only on explicit approval.

## Phase 18: Import Dataverse data

Run this if the user selected Dataverse or Both.

Load order:

1. Ticket Category
2. Team Member
3. Support Ticket

Rules:

- Store Airtable record ID on every row.
- Build Airtable record ID to Dataverse GUID maps after each table load.
- Resolve linked-record fields using those maps.
- Migrate AI values from:
  - raw text value, when present
  - `value` property, when Airtable returns `{ state, value, isStale }`
- Null/stale AI values do not block import.
- Keep Owner unchanged.
- Leave optional `systemuser` lookups empty unless identity mapping is approved.

Write:

```text
analysis/dataverse-data-import-report.json
```

Validate:

- record counts
- lookup resolution
- skipped/null fields
- AI value preservation
- choice value mapping
- Owner unchanged

## Phase 19: Post-migration app target and automation branches

After the selected data target schema/list creation and data import validation, ask:

> What app experience do you want to generate from the migrated Dataverse model?

Offer choices:

1. Plan only.
2. Generate Code App.
3. Generate Canvas App.
4. Generate both Code App and Canvas App.

Then ask separately:

> Do you want to migrate Airtable automations into draft Power Automate flows?

Do not start app or automation generation automatically. App generation and automation migration are optional, approval-gated phases.

## Phase 20: App modernization planning branch

Run this for Code App, Canvas App, both, or plan-only. This is shared UX/app planning before target-specific generation.

### UX evidence intake

Ask the user for:

- screenshots of each Airtable Interface page
- optional screen recording or walkthrough
- page names and navigation order
- user roles/personas
- important forms, grids, dashboards, filters, tabs, and buttons
- expected behavior for each important button/action
- role-specific visibility or permissions, if any

Optional evidence:

- Airtable page source HTML
- authenticated `readForPages` response JSON, if the user can capture it safely
- automation screenshots that explain button/action behavior

Never treat page source alone as a complete UI export. Page source can provide app/page/table IDs and clues, but it is not enough for full UX reconstruction.

### UX planning

Generate:

```text
analysis/app-modernization-plan.json
analysis/code-app-plan.json
analysis/canvas-app-plan.json
analysis/interface-reconstruction-plan.json
reports/UX-Reconstruction-Plan.docx, if DOCX tooling is available
```

If no Airtable Interface screenshots are available, generate schema-derived app plans:

- Dashboard
- Ticket list
- Ticket detail/edit
- Team Members
- Categories
- AI insight panels

If screenshots or workflow notes exist, reconstruct UX from them.

Map Airtable UX patterns as:

```text
Grid view -> table/list page
Form view -> create/edit form
Gallery -> card gallery
Kanban -> board
Calendar -> calendar component
Dashboard/interface summary -> KPI cards and charts
Filtered view -> saved filter/tab
Button -> command/action placeholder until behavior is confirmed
```

### App target selection rules

Use the selected Microsoft data platform foundation for all app targets. Dataverse is preferred for richer app generation; SharePoint Lists are supported for list-centric Canvas Apps and lightweight app experiences.

Recommend **Code App** when:

- the customer needs custom React/TypeScript UX
- advanced components are needed
- complex layouts or custom interactions are expected
- developer-owned source code is preferred
- the app should feel like a bespoke web app

Recommend **Canvas App** when:

- the customer wants low-code maker ownership
- standard forms/galleries/screens are sufficient
- fast iteration inside Power Platform is preferred
- Dataverse-native forms and Power Fx are a good fit
- business users will maintain the app

Recommend **Both** when:

- Code App is useful for advanced/end-user UX
- Canvas App is useful for admin/back-office/operations
- the customer wants both pro-code and low-code entry points over the same Dataverse model

Recommend **Plan only** when:

- app tooling is unavailable
- the user wants to review UX first
- screenshots/workflows are insufficient for generation

## Phase 21: Code App generation branch

Run this only if the user selected Code App or Both.

If Code App generation tools are available in the current agent environment:

1. Reuse the selected target context established during migration.
2. Add the migrated Dataverse tables or SharePoint Lists as data sources, depending on the selected target.
3. Generate first-pass React/TypeScript Code App structure from `analysis/code-app-plan.json`.
4. Wire list/detail/create/edit screens to the selected data target.
5. Add dashboard/KPI components where clear from schema or screenshots.
6. Add AI-derived fields as read-only/display panels unless the user asks for regeneration actions.
7. Leave button/action behavior as TODOs unless explicitly described by automation evidence or workflow notes.

If Code App tooling is unavailable, produce a complete app generation plan and stop.

Generate or update:

```text
analysis/code-app-plan.json
reports/Code-App-Plan.docx, if DOCX tooling is available
apps/code-app/, if Code App generation tooling is available
```

## Phase 22: Canvas App generation branch

Run this only if the user selected Canvas App or Both.

If Canvas App/Power Apps generation tooling is available in the current agent environment:

1. Reuse the selected target context established during migration.
2. Add the migrated Dataverse tables or SharePoint Lists as data sources.
3. Generate a first-pass Canvas App plan from `analysis/canvas-app-plan.json`.
4. Create screens for list/detail/create/edit flows.
5. Use galleries, forms, cards, filters, and command buttons where appropriate.
6. Generate Power Fx formulas for navigation, filtering, submit, patch/update, and validation where behavior is known.
7. Add dashboard/KPI screens where clear from schema or screenshots.
8. Add AI-derived fields as read-only/display controls unless the user asks for regeneration actions.
9. Leave unknown button/action behavior as TODOs unless explicitly described by automation evidence or workflow notes.

If Canvas App tooling is unavailable, produce a complete Canvas App generation plan and stop.

Generate or update:

```text
analysis/canvas-app-plan.json
reports/Canvas-App-Plan.docx, if DOCX tooling is available
apps/canvas-app/, if Canvas App generation tooling is available
```

Canvas App plan should include:

- app name
- Dataverse data sources
- screen list
- controls per screen
- galleries/forms/cards
- navigation formulas
- filter/search formulas
- submit/update formulas
- Power Automate integration hooks
- known behavior gaps
- maker follow-up checklist

## Phase 23: UX caveat to show the user

Always state:

> The generated app is a first-pass scaffold based on Dataverse schema and provided screenshots. End-to-end screen behavior, role-specific behavior, button logic, validations, conditional visibility, and automation-driven behavior require additional workflow prompts and validation.

## Phase 24: Automation draft migration branch

Run this only if the user asks to migrate Airtable automations.

### Automation evidence intake

Ask for:

- screenshots of each Airtable automation
- trigger type
- target table/view
- trigger conditions
- action list and order
- email/Teams/message templates
- update-record field mappings
- scripts used in custom script actions
- webhook URLs or integration names, without secrets
- whether each automation should be enabled immediately or left disabled for review

Preferred evidence:

```text
automations/
  screenshots/
  automation-notes.md
  scripts/
```

### Automation analysis

Generate:

```text
analysis/automation-conversion-plan.json
flows/<flow-name>.draft.json
reports/Automation-Migration-Plan.docx, if DOCX tooling is available
```

Classify each automation:

```text
high_confidence
needs_user_confirmation
requires_manual_rebuild
blocked_missing_details
```

Map Airtable automation patterns as:

```text
Record created trigger -> Power Automate Dataverse row added trigger
Record updated trigger -> Power Automate Dataverse row modified trigger
Record matches conditions -> Dataverse trigger plus condition block
Scheduled trigger -> recurrence trigger
Send email -> Outlook connector or Dataverse/email pattern, depending customer preference
Send Teams message -> Teams connector
Update record -> Dataverse update row
Create record -> Dataverse add row
Find records -> Dataverse list rows with filter
Custom script -> Power Automate expression, Azure Function, plugin/action, or manual rebuild
Webhook/integration -> HTTP action/custom connector, with secrets supplied outside chat
```

### Flow MCP / Power Automate creation

If Flow MCP or Power Automate MCP is available:

1. Reuse the selected target context established during migration.
2. Validate Flow MCP sign-in and target environment.
3. Create flows as draft/disabled when possible.
4. Use the migrated Dataverse tables or SharePoint Lists and resolved schema/list names.
5. Do not enable flows until the user reviews connections, triggers, conditions, and actions.
6. Do not store secrets in generated files.

If Flow MCP is unavailable:

1. Generate `analysis/automation-conversion-plan.json`.
2. Generate draft flow definitions or implementation instructions.
3. Stop and tell the user Flow MCP/Power Automate tooling is needed for actual flow creation.

### Automation caveat to show the user

Always state:

> Automation drafts are generated from screenshots/notes and available metadata. Screenshots may omit hidden conditions, dynamic expressions, connection references, retries, permissions, and secrets. Flows must be reviewed before enabling.

## Phase 25: DOCX reporting branch

Run this after each major planning phase if DOCX generation tooling is available. If no DOCX tooling is available, keep JSON/Markdown outputs and state that DOCX generation was skipped.

Create a `reports/` folder and generate readable Word documents for business and technical review:

```text
reports/
  Data-Migration-Plan.docx
  SharePoint-Migration-Plan.docx
  UX-Reconstruction-Plan.docx
  App-Modernization-Plan.docx
  Code-App-Plan.docx
  Canvas-App-Plan.docx
  Automation-Migration-Plan.docx
  End-to-End-Migration-Summary.docx
```

### Data-Migration-Plan.docx

Include:

- executive summary
- source Airtable inventory
- target platform selection: Dataverse, SharePoint Lists, Both, or Plan only
- collected target details and validation status
- target Dataverse solution/environment, if Dataverse is selected
- target SharePoint site/lists, if SharePoint is selected
- table mapping
- column mapping
- choice mapping
- relationship mapping
- Airtable AI field handling
- identity strategy: Dataverse `systemuser` and/or SharePoint Person/Group fields
- Owner handling for Dataverse and permission/list ownership handling for SharePoint
- migration load order
- validation plan
- approval gates
- risks and open questions

### SharePoint-Migration-Plan.docx

Include when SharePoint Lists are selected:

- target SharePoint site
- list mapping
- column mapping
- choice/multi-choice mapping
- lookup column strategy
- many-to-many handling recommendation
- Person/Group field mapping
- source person text/email preservation
- unresolved user handling
- attachment strategy
- import load order
- validation plan
- SharePoint limitations and suitability warnings

### UX-Reconstruction-Plan.docx

Include:

- UX evidence received
- screenshots inventory
- inferred page/navigation model
- Code App pages/routes
- data sources
- component plan
- dashboard/KPI plan
- buttons/actions inventory
- known behavior gaps
- assumptions
- user validation checklist

State clearly:

> This is a first-pass UX scaffold plan. End-to-end behavior, conditional visibility, validation logic, role-specific flows, and button behavior require further prompting and user validation.

### App-Modernization-Plan.docx

Include:

- target app options: Code App, Canvas App, Both, Plan only
- recommendation matrix
- selected target
- shared Dataverse foundation
- UX evidence received
- target-specific plan summaries
- tooling prerequisites
- implementation sequence
- approval gates
- behavior gaps

### Code-App-Plan.docx

Include when Code App is selected:

- React/TypeScript app structure
- routes/pages
- Dataverse data sources/client layer
- components
- forms/list/detail screens
- dashboard/KPI components
- AI insight display panels
- command/action TODOs
- deployment assumptions

### Canvas-App-Plan.docx

Include when Canvas App is selected:

- Canvas App screens
- Dataverse data sources
- galleries/forms/cards
- Power Fx formulas
- navigation model
- filter/search behavior
- submit/update behavior
- Power Automate hooks
- maker follow-up checklist

### Automation-Migration-Plan.docx

Include:

- automation evidence received
- automation inventory
- trigger/action mapping
- target Power Automate/Flow design
- Dataverse tables referenced
- connector requirements
- draft flow status
- secrets/connection references that must be supplied by the user
- confidence classification
- enablement/review checklist

State clearly:

> Automation drafts are not production-ready until triggers, connections, dynamic expressions, permissions, retries, and error handling are reviewed.

### End-to-End-Migration-Summary.docx

Generate at the end of the run. Include:

- what was exported
- target platform selected
- what was created/reused in Dataverse, if selected
- what was created/reused in SharePoint, if selected
- what data was imported
- validation results
- UX scaffold status
- selected app target
- Code App status, if requested
- Canvas App status, if requested
- automation draft status
- unresolved gaps
- recommended next steps

The DOCX files are reader-friendly companions to the JSON artifacts. JSON remains the authoritative machine-readable input for subsequent phases.

## Completion

At completion, report:

- export folder
- assessment files
- report files
- Dataverse environment
- SharePoint site, if selected
- solution
- prefix
- Dataverse tables created/reused, if selected
- SharePoint lists created/reused, if selected
- data imported/skipped
- identity mapping status
- AI fields migrated with regeneration gap
- UX scaffold status, if requested
- app target selected
- Code App generated/planned, if requested
- Canvas App generated/planned, if requested
- automation draft/flow status, if requested
- remaining behavior gaps and required user validation
