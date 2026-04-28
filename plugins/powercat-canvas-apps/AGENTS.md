# AGENTS.md — Canvas Apps Plugin

This file provides guidance to AI Agents when working with the **powercat-canvas-apps** plugin.

## What This Plugin Is

A plugin for authoring Power Apps Canvas Apps. The Canvas Authoring MCP server (`CanvasAuthoringMcpServer`) exposes tools that agents use to generate, validate, and compile Canvas App YAML files (`.pa.yaml`) in conjunction with a running coauthoring studio session. The Power Apps Studio browser tab must remain open for the duration of the session — closing it ends the coauthoring session, which breaks `compile_canvas` and `sync_canvas` operations.

Skills orchestrate specialist agents via the `Task` tool. Agents are not invoked directly by users.

## Local Development

Test this plugin locally:

```bash
claude --plugin-dir /path/to/plugins/powercat-canvas-apps
```

## Architecture

```
.claude-plugin/plugin.json     ← Plugin metadata (name, version, keywords)
AGENTS.md                      ← Plugin guidance for AI agents (this file)
CLAUDE.md                      ← Symlink → AGENTS.md
references/ 
agents/  
skills/
  analyze-canvas-performance/
    SKILL.md                   ← Do a code review of the p.yaml files based on best pratices for Canvas Apps
  infopath-to-canvas/
    SKILL.md                   ← Convert .xsn files from InfoPath to Canvas Apps
  migrate-to-dataverse/
    SKILL.md                   ← Verifyes the Sharepoint List present in the pa.yaml source files for an existing Canvas App and find the most adequate Dataverse tables and replace the formulas
  verifies
```

## Skills

| Skill | Description |
|-------|-------------|
| `/analyze-canvas-performance` | Do a code Review of a Canvas Apps |
| `/infopath-to-canvas` | Migrate InfoPath forms to Canvas Apps |
| `/edit-canvas-app` | Edit an existing Canvas App from a natural language description of changes |
| `/migrate-to-dataverse` | Guide the user to replace the Sharepoint list to Dataverse source if are available |


## Prerequisites

Before the MCP server will start, you need:

**.NET 10 SDK** — [Download from Microsoft](https://dotnet.microsoft.com/download/dotnet/10.0)
**power-platform-skills** — [Download from Microsoft GitHub](https://github.com/microsoft/power-platform-skills)
