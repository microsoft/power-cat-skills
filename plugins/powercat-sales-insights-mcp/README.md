# powercat-sales-insights-mcp

Standalone local FastMCP server for Sales Insights. Exposes tools for querying
Success Hub cohorts, pipeline data, and Dataverse-backed sales analytics.

## Architecture

This is a **standalone local server** — it is NOT a reverse-proxy target.
The server (`server.py`) makes OData calls to Dataverse internally and exposes
its own MCP tools.

**Do NOT use `mcp-proxy.ps1 add`** for this server. The upstream `/mcp` endpoint
does not exist and requests will return 404.

## Setup

```powershell
$siRoot = "$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-sales-insights-mcp\scripts"

# Install as scheduled task (starts on login, port 8767)
pwsh -NoProfile -File "$siRoot\install-task.ps1"

# Or start manually
pwsh -NoProfile -File "$siRoot\start.ps1"
```

## Port Contract

This server listens on **port 8767** by default. This is the documented port used by:
- `mcp_proxies.json` in `powercat-paranoid-curious-portfolio-pulse`
- `ensure_mcp_alive.ps1` connectivity checks
- `quickstart.ps1` pre-flight validation

## Tools Exposed

| Tool | Description |
|------|-------------|
| `successhub_query` | Query Success Hub cohort data |
| `open_pipeline` | Retrieve open pipeline opportunities |
| `refresh_cohort` | Refresh cohort data from Dataverse |
