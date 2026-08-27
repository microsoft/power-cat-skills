[CmdletBinding()]
param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\..\..\build\copilot-studio')
)

$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path $PSScriptRoot -Parent
$sourceSkill = Join-Path $pluginRoot 'skills\powercat-pp-architecture-advisor\SKILL.md'
$sourceReferences = Join-Path $pluginRoot 'references'
$packageName = 'powercat-pp-architecture-advisor'
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
$stagingRoot = Join-Path $resolvedOutput $packageName
$zipPath = Join-Path $resolvedOutput "$packageName.zip"

if (-not (Test-Path $sourceSkill)) {
    throw "Source skill not found: $sourceSkill"
}

if (Test-Path $stagingRoot) {
    Remove-Item $stagingRoot -Recurse -Force
}

New-Item $stagingRoot -ItemType Directory -Force | Out-Null
New-Item (Join-Path $stagingRoot 'references') -ItemType Directory -Force | Out-Null

$skill = Get-Content $sourceSkill -Raw
$skill = [regex]::Replace(
    $skill,
    '(?m)^(user-invocable|argument-hint|allowed-tools):.*\r?\n',
    ''
)

$copilotStudioDescription = 'Use for interactive Power Platform architecture discovery and solution recommendations. Activate when a user describes a business scenario, asks what to build, requests a Power CAT architecture review or solution blueprint, compares Canvas, Model-driven, Power Pages, code apps, managed apps, or Copilot Studio, or needs security, governance, ALM, roadmap, risk, and implementation guidance. Leads with a composed solution mapped to business capabilities, then rates options as Strong fit, Good fit, Fit, or Doesn''t fit based on users, maker skills, AI appetite, data, integrations, compliance, scale, and product maturity. Do not use for building an app, writing code, general product support, or unrelated questions.'
$skill = [regex]::Replace(
    $skill,
    '(?m)^description: >\r?\n(?:^[ ]{2}[^\r\n]*\r?\n)+',
    "description: >`r`n  $copilotStudioDescription`r`n"
)

if ($copilotStudioDescription.Length -gt 1024) {
    throw "Copilot Studio description is $($copilotStudioDescription.Length) characters; maximum is 1024."
}

$runtimeInstructions = @'

## Copilot Studio runtime rules

These rules override any conflicting instruction later in this skill:

- Treat this skill package and every file under `references/` as read-only.
- Use four adaptive user-facing discovery sections: Goals & People, Experience & Process, Data & Connections, and Security & Delivery. Ask exactly three unresolved, scenario-specific questions per applicable section in one message and accept each set in one natural-language paragraph. Skip sections already answered by the scenario or attachments.
- Read accessible requirements attachments before asking questions and never ask the user to retype facts already in them. After all applicable sections, show no more than six labelled assumptions and let the user continue or overwrite any item.
- Ask beyond applicable section batches only for a safety, legal, platform-fitness, or technically divergent decision that cannot safely be an assumption.
- Treat detailed discovery sections as an internal question bank, not a script. Do not show section counts, question counts, progress bars, or a questionnaire.
- Use the LLM to adapt question priority, wording, and answer cues to the scenario. Use Markdown headings, bold questions, numbering, and whitespace for hierarchy. Do not attempt custom fonts, sizes, colors, CSS, or invented controls because the host controls chat rendering.
- At any point, when the user needs colleague input or asks to email discovery, collect To and optional Cc addresses and generate a reviewable `.eml` draft plus a self-contained `.html` discovery handoff. Never claim to send mail or retain addresses.
- Let the user go back, revise an earlier answer, inspect assumptions, or finish using safe defaults.
- Use ordinary conversational questions. Do not assume coding-agent file, search, or prompt tools are available.
- Return a table-free 220–340 word decision summary in chat, including one or two verified scenario-matched items under **Power CAT Recommended Resources**. Do not show a full resource catalog initially. Then ask whether the user needs additional outputs and let them choose one or more focused expansions: Security, compliance & assurance; Implementation plan; Learning & certifications; More labs, skills & build resources; the complete Architecture Delivery Pack; or Nothing else. Accept numbers, labels, or natural language. Focused expansions return only the requested detail. The complete pack is available as PDF or Interactive HTML and contains the decision summary, requirements, architecture, implementation blueprint, roadmap, recommended resources, and appendices.
- Keep weighted fit calculations private. Present each option only as Strong fit, Good fit, Conditional fit, or Doesn't fit, with one discovery-based **Evidence** statement and one material **Watch-out**.
- Present overall architecture confidence as High, Medium, or Low based on confirmed input completeness. Name material assumptions when confidence is not High; never present confidence as an LLM probability.
- Use configured Microsoft Learn knowledge sources to ground material product capability, availability, licensing, connector, and regional claims. Include only sources actually consulted.
- Recommend scenario-relevant learning and build resources from `microsoft/apps-agents-workshop`, `microsoft/power-cat-skills`, and `microsoft/power-platform-resources`. Follow the packaged curated-resource specification, explain why and when to use each recommendation, and never invent a title or deep link.
- Treat sandbox files as temporary. Never claim that a report was saved to the user's local Desktop, workspace, repository, SharePoint, or another durable location.
- When a new domain pattern is derived, include it in a final **Pattern feedback** section for a maintainer to review. Never claim that the package or learning log was updated.
- Do not expose hidden reasoning, numeric fit calculations, or internal orchestration details.
'@

$skill = [regex]::Replace(
    $skill,
    '(?s)\A(---\r?\n.*?\r?\n---\r?\n)',
    "`$1$runtimeInstructions`r`n"
)

$learningPattern = '(?s)\*\*If no entry matches — take a learning break before continuing:\*\*.*?This keeps the skill improving with every novel scenario it encounters\. Entries in `references/learned-patterns\.md` are reviewed by skill maintainers and promoted to the main schema hints table when validated\.'
$learningReplacement = @'
**If no entry matches — derive a candidate pattern before continuing:**

1. Briefly tell the user that there is no pre-built pattern for this domain yet.
2. Derive 6–10 domain keywords, 5–8 core Dataverse tables, relevant compliance flags, and likely integration patterns from discovery.
3. Continue immediately to Step 2b. Do not restart discovery.
4. Include the candidate as a **Pattern feedback** table at the end of the final response so a maintainer can review it for a future skill release.

Never modify `references/learned-patterns.md` or claim that the skill learned permanently from the conversation.
'@
$skill = [regex]::Replace($skill, $learningPattern, $learningReplacement)

$forbiddenPatterns = [ordered]@{
    'unsupported frontmatter' = '(?m)^(user-invocable|argument-hint|allowed-tools):'
    'coding-agent tool names' = '`(AskUserQuestion|Read|Write|Edit|Glob|Grep)`'
    'local Desktop output' = '~/Desktop|\$env:USERPROFILE'
    'runtime learning write' = 'Append the new entry to `references/learned-patterns\.md`'
    'missing web schema dependency' = 'docs/report\.schema\.json'
}

foreach ($check in $forbiddenPatterns.GetEnumerator()) {
    if ($skill -match $check.Value) {
        throw "Generated skill still contains $($check.Key)."
    }
}

$requiredSections = @(
    'Step 0 - Welcome and scenario entry',
    'Step 1 - Discovery completeness check',
    'Step 2b - Solution composition (primary outcome)',
    'Step 3 - Recommendation generation',
    'Step 4 - SA quality bar validation',
    'Step 5 - Render inline output'
)

foreach ($section in $requiredSections) {
    if (-not $skill.Contains($section)) {
        throw "Generated skill is missing required section: $section"
    }
}

$skillPath = Join-Path $stagingRoot 'SKILL.md'
[System.IO.File]::WriteAllText($skillPath, $skill, [System.Text.UTF8Encoding]::new($false))

$referenceNames = @(
    'architecture-questionnaire.md',
    'discovery-handoff-spec.md',
    'html-report-spec.md',
    'implementation-blueprint-spec.md',
    'curated-resource-recommendations.md',
    'learned-patterns.md',
    'product-icon-spec.md',
    'requirements-brief-spec.md',
    'report-json-shape.md',
    'report-output-spec.md'
)

foreach ($referenceName in $referenceNames) {
    $source = Join-Path $sourceReferences $referenceName
    if (-not (Test-Path $source)) {
        throw "Required reference not found: $source"
    }

    Copy-Item $source (Join-Path $stagingRoot "references\$referenceName")
}

$productIconSource = Join-Path $sourceReferences 'product-icons'
$productIconTarget = Join-Path $stagingRoot 'references\product-icons'
if (-not (Test-Path $productIconSource)) {
    throw "Required product icon directory not found: $productIconSource"
}
Copy-Item $productIconSource $productIconTarget -Recurse

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $stagingRoot '*') -DestinationPath $zipPath

Write-Output "Package folder: $stagingRoot"
Write-Output "Upload ZIP: $zipPath"