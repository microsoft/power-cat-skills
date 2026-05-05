# AGENTS.md — Governance Plugin

This file provides guidance to AI Agents when working with the **powercat-governance** plugin.

## What This Plugin Is

A plugin for Power Platform governance and administration. It helps Power Platform admins provision and manage environments consistently — replacing multi-step manual admin center workflows with a single prompt while enforcing organizational governance defaults.

Skills orchestrate specialist agents via the `Task` tool. Agents are not invoked directly by users.

## Local Development

Test this plugin locally:

```bash
claude --plugin-dir /path/to/plugins/powercat-governance
```

## Architecture

```
.claude-plugin/plugin.json     ← Plugin metadata (name, version, keywords)
AGENTS.md                      ← Plugin guidance for AI agents (this file)
CLAUDE.md                      ← Symlink → AGENTS.md
references/
agents/
skills/
  create-pp-dev-env/
    create-pp-dev-env.md       ← Spin up a fully-configured Power Platform Developer environment for any teammate
```

## Skills

| Skill | Description |
|-------|-------------|
| `/create-pp-dev-env` | Provision a Power Platform Developer environment with standard governance defaults on behalf of any user |

### `/create-pp-dev-env` — Power Platform Developer Environment Provisioner

Spin up a fully-configured Power Platform Developer environment for any teammate in under 2 minutes — without clicking through the admin center.

**Triggers:** `create developer environment`, `new dev env for <user>`, `provision power platform developer environment`, `spin up a dev env`

**What it does:**
1. Looks up the target owner in Microsoft Graph (no need to copy AAD ObjectIds)
2. Shows a confirmation card with env name, region, owner, and toggles before anything is created
3. Calls the Power Platform BAP API directly to provision a Developer SKU environment with:
   - Managed Environment = Yes
   - Get new features early = Yes
   - Group sharing cadence = Frequent
   - Owner / "Created on behalf of" = the specified user
4. Polls until the environment reaches `Succeeded`, then verifies Sku, State, Managed, and Owner via PAC CLI

**Safety guardrails:**
- Never logs or hardcodes credentials — auth is direct OAuth2 against `login.microsoftonline.com` at runtime
- Always pauses for a human confirmation before submitting the create call

**Requires:**
- The `New-PowerPlatformDevEnvironment.ps1` script in the Clawpilot working folder
- Power Platform admin rights on the target tenant

## Prerequisites

**power-platform-skills** — [Download from Microsoft GitHub](https://github.com/microsoft/power-platform-skills)
