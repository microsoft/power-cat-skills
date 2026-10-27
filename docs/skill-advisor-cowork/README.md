# Skills Advisor for Copilot Cowork

Machine-readable catalog and the Copilot Cowork plugin for the
[Power Platform Skills Advisor](https://microsoft.github.io/power-cat-skills/skill-advisor/#cowork).

| File | Purpose |
|---|---|
| `power-platform-skills-advisor-live-1.0.0.zip` | **PP Skills Advisor (Live)** Copilot Cowork plugin (Microsoft 365 app package). Upload in the M365 admin center or Cowork → Customize. |
| `catalog.json` | Public catalog read hourly by the plugin's read-only MCP server |
| `version.json` | Plugin version + file hash, catalog date, item count and content hash |

The plugin is read-only: it recommends catalog items and never runs skills or changes an environment.
Generated from the portal data; do not edit by hand.
