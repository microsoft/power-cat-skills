# AGENTS.md — PowerCAT OverPage Plugin

This file provides guidance to AI Agents when working with the **powercat-overpage** plugin.

## What This Plugin Is

A plugin for Power Pages makers, ALM owners, and CoE reviewers that audits a **Power Pages site
export** (`.zip` produced by `pac powerpages download`, zipped) against Power Pages best practices
across **Security, Accessibility, Performance, Maintainability, SEO and Reliability**. The agent
unpacks the export, **reads and reasons about** the pages, templates, settings, web files and table
permissions, writes a single `[SolutionName].findings.json` (validated against
`findings.schema.json`) next to the uploaded ZIP, and opens the **PowerCAT OverPage** viewer with the
site and findings pre-loaded — each finding is overlaid directly on a live preview of the page or
component it affects (pins, inline highlights, impact dots on the page tree).

It is the Power Pages counterpart to **powercat-overflow** (which reviews Power Automate flows).

## AI-authored, not deterministic

There is **no bundled analyzer**. The agent produces the findings by inspecting the actual exported
files and applying the guidance in `SKILL.md`. Findings must be grounded in something inspectable in
the export — never fabricated — and the output JSON must validate against `findings.schema.json`.

## Local Development

Load the plugin locally with:

```bash
claude --plugin-dir /path/to/powercat-overpage
```

Validate a produced findings file against the schema with any JSON Schema validator, e.g.:

```bash
npx ajv-cli validate -s skills/powercat-overpage/findings.schema.json -d MySite.findings.json
```

## Architecture

```
.claude-plugin/plugin.json                       ← Plugin metadata (name, version, keywords)
AGENTS.md                                        ← Plugin guidance for AI agents (this file)
CLAUDE.md                                        ← Pointer → AGENTS.md
README.md                                        ← User-facing plugin docs
skills/
  powercat-overpage/
    SKILL.md                                     ← AI-driven Power Pages site review skill
    findings.schema.json                         ← Authoritative findings JSON Schema (draft-07)
```

External assets consumed at run time:

- `findings.schema.json` — output schema (validation, bundled).
- The **PowerCAT OverPage viewer** — the overlay UI that consumes the findings; lives in the sibling
  `PowerPagesPreview` app and is hosted on GitHub Pages once published.

## Skills

| Skill | Description |
|-------|-------------|
| `powercat-overpage` | Reads a Power Pages site export, reasons about best-practice issues, writes a schema-valid `[SolutionName].findings.json`, opens the viewer with both files loaded. |

## Hard rules for agents

- The agent authors findings by reading the export — no engine, no fabrication.
- The output JSON must validate against `findings.schema.json`.
- Component keys are `<componentType>:<componentName>` exactly.
- Keep all artefacts local; never upload the site export or findings anywhere.
- Reject classic Dataverse solutions (no `*.webpage.yml`) with `pac powerpages download` guidance.
