# AGENTS.md - Power CAT Architecture Advisor Plugin

## What This Plugin Is

A plugin that emulates a Power CAT Solution Architect discovery and recommendation process.
It collects scenario requirements through a structured questionnaire and outputs a comprehensive
Power Platform architecture recommendation with explicit design decisions and risks.

## Local Development

Test this plugin locally:

```bash
claude --plugin-dir /path/to/powercat-architecture-advisor
```

## Architecture

```
.claude-plugin/plugin.json
AGENTS.md
CLAUDE.md
references/
  architecture-questionnaire.md
skills/
  powercat-pp-architecture-advisor/
    SKILL.md
```

## Skills

| Skill | Description |
|-------|-------------|
| /powercat-pp-architecture-advisor | Convert categorized discovery answers into a Power CAT style architecture recommendation and implementation blueprint. |
