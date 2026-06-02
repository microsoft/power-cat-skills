# Portfolio Pulse — Installation Guide

## Prerequisites

| # | Component | Purpose |
|---|-----------|---------|
| 1 | PowerShell 7+ | Script runtime |
| 2 | Python 3.10+ | MCP proxy and SI server runtime |
| 3 | `powercat-mcp-proxy` plugin | Manages reverse-proxy MCP servers |
| 4 | `powercat-sales-insights-mcp` plugin | Standalone Sales Insights MCP local server |

## §1 — Install the MCP Proxy Plugin

```powershell
copilot plugin install powercat-mcp-proxy@powercat-internal-marketplace
```

## §2 — Install the Sales Insights MCP Plugin

```powershell
copilot plugin install powercat-sales-insights-mcp@powercat-internal-marketplace
```

## §3 — Install Portfolio Pulse

```powershell
copilot plugin install powercat-paranoid-curious-portfolio-pulse@powercat-internal-marketplace
```

## §4 — Configure MCP Servers

There are **two different types** of MCP servers used by this plugin.
Each requires a different setup method:

| Server | Port | Type | Setup Method |
|--------|------|------|-------------|
| Power BI MCP | 8765 | Reverse proxy | `mcp-proxy.ps1 add` |
| Sales Insights MCP | 8767 | Standalone local | `install-task.ps1` + `start.ps1` |

### §4.1 — Power BI MCP (Reverse Proxy)

Power BI MCP is a **reverse proxy** that forwards requests to the Power BI service
and injects OAuth bearer tokens. Set it up with `mcp-proxy.ps1`:

```powershell
$proxy = "$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-mcp-proxy\scripts\mcp-proxy.ps1"

# Add Power BI MCP as a reverse proxy on port 8765
& $proxy add power_bi_mcp

# Sign in to obtain bearer token
& $proxy signin power_bi_mcp
```

### §4.2 — Sales Insights MCP (Standalone Local Server)

> **⚠️ IMPORTANT:** Sales Insights MCP is a **standalone local FastMCP server** —
> it is NOT a reverse proxy target. Do NOT use `mcp-proxy.ps1 add` for this server.
> The upstream `/mcp` endpoint does not exist and will return 404.

The SI MCP server (`server.py`) exposes its own tools (`successhub_query`,
`open_pipeline`, etc.) and makes OData calls to Dataverse internally.

```powershell
$siRoot = "$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-sales-insights-mcp\scripts"

# Install as a scheduled task (runs on login, port 8767)
pwsh -NoProfile -File "$siRoot\install-task.ps1"

# Or start manually for this session
pwsh -NoProfile -File "$siRoot\start.ps1"
```

To verify it's running:

```powershell
# Should return a JSON response with server info
Invoke-RestMethod -Uri "http://127.0.0.1:8767/health"
```

## §5 — Verify Connectivity

```powershell
$scripts = "$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-paranoid-curious-portfolio-pulse\scripts"
pwsh -NoProfile -File "$scripts\ensure_mcp_alive.ps1"
```

## §6 — Run the Dashboard

```powershell
pwsh -NoProfile -File "$scripts\quickstart.ps1"
```

## Troubleshooting

### "SETUP FAILED — MCP proxies not reachable"

The quickstart distinguishes between the two server types:

- **Power BI MCP (:8765)**: Run `/powercat-automatic-bearer-token-refresh` skill,
  then retry. This refreshes the OAuth token used by the reverse proxy.

- **Sales Insights MCP (:8767)**: The SI MCP is a local server, not managed by the
  bearer-token-refresh skill. Run `install-task.ps1` from the
  `powercat-sales-insights-mcp` plugin to start it.

### pip install fails on Windows ARM64 (Issue #12)

The `mcp-proxy.ps1` script uses `--only-binary=:all:` to avoid building native
extensions from source. If you still encounter issues:

```powershell
$pip = "$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-mcp-proxy\.venv\Scripts\pip.exe"
& $pip install "cryptography>=46" --only-binary=:all:
& $pip install "msal>=1.31" --only-binary=:all:
```

### Port mismatch (Issue #15)

Sales Insights MCP must run on port **8767** (not 8766). If you previously used
`mcp-proxy.ps1 add sales_insights_-_dataverse` (which auto-assigns ports),
remove it and use the standalone server instead:

```powershell
& $proxy remove sales_insights_-_dataverse
# Then follow §4.2 above
```
