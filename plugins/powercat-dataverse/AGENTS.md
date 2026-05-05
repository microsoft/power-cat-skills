# AGENTS.md — Dataverse Plugin

This file provides guidance to AI Agents when working with the **powercat-dataverse** plugin.

## What This Plugin Is

A plugin for authoring and troubleshooting Microsoft Dataverse queries. It helps developers, makers, and architects write correct Web API URLs, convert FetchXML, target the right Power Apps surface, and diagnose common errors — without falling into the recurring traps that cause 90% of Dataverse Web API support threads.

Skills orchestrate specialist agents via the `Task` tool. Agents are not invoked directly by users.

## Local Development

Test this plugin locally:

```bash
claude --plugin-dir /path/to/plugins/powercat-dataverse
```

## Architecture

```
.claude-plugin/plugin.json     ← Plugin metadata (name, version, keywords)
AGENTS.md                      ← Plugin guidance for AI agents (this file)
CLAUDE.md                      ← Symlink → AGENTS.md
references/
agents/
skills/
  dataverse-webapi-query/    
```

## Skills

| Skill | Description |
|-------|-------------|
| `/dataverse-webapi-query` | Author and ship Dataverse Web API queries — natural language → URL, FetchXML → OData, multi-surface targeting, error diagnosis |

### `/dataverse-webapi-query` — Dataverse Web API Query

Helps you author and ship Microsoft Dataverse queries without falling into the usual traps — mis-cased logical names, wrong lookup annotations, missing `Prefer` headers, or accidentally hand-rolling HTTP when the host already gives you a typed client.

**Triggers:** _"Dataverse query"_, _"Web API URL for…"_, _"convert FetchXML"_, _"why is this 400 / 401 / 404"_, _"build a query for a generative page / code app"_, _"call Dataverse from my React app"_, _"how do I get a token to test this"_

**Use it for:**
- **Natural language → Web API URL** — _"top 10 active accounts in Sydney with their primary contact"_
- **FetchXML → Web API** — paste FetchXML, get the equivalent OData URL, with a callout for anything that doesn't translate cleanly (aggregation, multi-level joins)
- **Power Apps targets** — translate one query into the right shape for:
  - **Generative Pages** — single-file React 17 + TypeScript using `props.dataApi.queryTable(...)`, Fluent UI v9, `pac model genpage` deploy
  - **Power Apps Code Apps** — full-stack React/Vue SPA using `@microsoft/power-apps` and auto-generated `*Service` classes
  - **Model-driven form / ribbon JS** — `Xrm.WebApi.retrieveMultipleRecords(...)`
  - **Canvas / Power Automate** — Power Fx `Filter()` or the Dataverse connector's "List rows" action
- **Optimize / explain an existing query** — improve performance, fix delegation, or explain a 400/404
- **Diagnose errors** — _"Could not find a property named…"_, _"Resource not found for the segment…"_, 401 vs 403, etc.
- **Test it live** — walks you through acquiring a bearer token via `az cli`, device code, Postman, the browser session cookie, or MSAL — without ever asking you to paste a token into chat

**Guardrails:**
- Never invents logical names — if the schema isn't resolved, the skill stops and resolves it first
- Never accepts, stores, or transmits bearer tokens — you run every authenticated request yourself
- Never silently drops FetchXML features it can't translate — flags aggregation, deep joins, and late-bound links explicitly

## Prerequisites

**power-platform-skills** — [Download from Microsoft GitHub](https://github.com/microsoft/power-platform-skills)
