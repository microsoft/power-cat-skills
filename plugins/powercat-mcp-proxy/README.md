# powercat-mcp-proxy

MCP reverse-proxy manager for Power Platform MCP servers that require OAuth bearer tokens.

## Features

- **Add** MCP servers as local reverse proxies with automatic OAuth token injection
- **Sign-in** via MSAL device code flow
- **Sync** existing remote MCP server entries to local proxies
- **Status** check for all managed servers

## Key Fixes (v1.1.0)

- **Binary-only pip installs** (`--only-binary=:all:`) — no more build failures on
  win-arm64 when `cryptography` lacks pre-built wheels (#12)
- **Atomic operations** — if pip or venv setup fails, `m-mcp-servers.json` is rolled
  back to its pre-add state. No more dead-end inconsistent state (#13)
- **Port contract support** — reads expected port from consuming plugin's
  `mcp_proxies.json`. Pass `-Port` explicitly or let it resolve automatically (#15)

## Usage

```powershell
$proxy = "$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-mcp-proxy\scripts\mcp-proxy.ps1"

# Add a server (auto-resolves port from mcp_proxies.json)
& $proxy add power_bi_mcp

# Add with explicit port
& $proxy add sales_insights_-_dataverse -Port 8767

# Sign in
& $proxy signin power_bi_mcp

# Check status
& $proxy status

# Remove
& $proxy remove power_bi_mcp
```

## Important: Sales Insights MCP

Sales Insights MCP is a **standalone local server**, NOT a reverse proxy target.
Do not use `mcp-proxy.ps1 add` for it. Instead, use the `powercat-sales-insights-mcp`
plugin's `install-task.ps1` script. See the Portfolio Pulse INSTALL.md §4.2 for details.
