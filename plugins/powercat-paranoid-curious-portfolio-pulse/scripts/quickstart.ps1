<#
.SYNOPSIS
    Quickstart for Portfolio Pulse dashboard — validates MCP server connectivity
    and bootstraps the dashboard data refresh.

.DESCRIPTION
    Checks that all required MCP servers are reachable before launching the
    dashboard data pipeline. Provides actionable, server-specific error messages
    when connectivity checks fail.

    Fix #16: Distinguishes between reverse-proxy MCP servers (Power BI) and
    standalone local MCP servers (Sales Insights) in error output so users
    know exactly which remediation to apply.
#>

[CmdletBinding()]
param(
    [switch]$SkipConnectivityCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Configuration ---
$McpServers = @(
    @{
        Name     = 'Power BI MCP'
        Port     = 8765
        Type     = 'reverse-proxy'
        FixHint  = 'Run the /powercat-automatic-bearer-token-refresh skill, then retry.'
    }
    @{
        Name     = 'Sales Insights MCP'
        Port     = 8767
        Type     = 'standalone-local'
        FixHint  = "Start the SI MCP local server:`n    `$siRoot = `"`$env:USERPROFILE\.copilot\installed-plugins\powercat-internal-marketplace\powercat-sales-insights-mcp\scripts`"`n    pwsh -NoProfile -File `"`$siRoot\install-task.ps1`"`n    pwsh -NoProfile -File `"`$siRoot\start.ps1`""
    }
)

# --- Connectivity check ---

function Test-McpServer {
    param([hashtable]$Server)

    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', $Server.Port)
        $tcp.Close()
        return $true
    }
    catch {
        return $false
    }
}

if (-not $SkipConnectivityCheck) {
    Write-Host "Checking MCP server connectivity..." -ForegroundColor Cyan
    $failures = @()

    foreach ($server in $McpServers) {
        $status = Test-McpServer $server
        if ($status) {
            Write-Host "  ✓ $($server.Name) (:$($server.Port))" -ForegroundColor Green
        }
        else {
            Write-Host "  ✗ $($server.Name) (:$($server.Port))" -ForegroundColor Red
            $failures += $server
        }
    }

    if ($failures.Count -gt 0) {
        Write-Host ""
        Write-Host "SETUP FAILED — MCP proxies not reachable." -ForegroundColor Red
        Write-Host ""

        # Fix #16: Provide server-specific remediation instructions
        foreach ($f in $failures) {
            Write-Host "  $($f.Name) (:$($f.Port)):" -ForegroundColor Yellow
            Write-Host "    $($f.FixHint)" -ForegroundColor White
            Write-Host ""
        }

        Write-Host "Required plugins:" -ForegroundColor Cyan
        Write-Host "  • powercat-mcp-proxy               (manages reverse-proxy servers)"
        Write-Host "  • powercat-sales-insights-mcp      (standalone SI MCP local server)"
        Write-Host "  • powercat-paranoid-curious-portfolio-pulse (this plugin)"
        Write-Host ""

        exit 2
    }

    Write-Host ""
    Write-Host "All MCP servers reachable. Starting dashboard refresh..." -ForegroundColor Green
}

# --- Dashboard bootstrap ---
Write-Host "Portfolio Pulse quickstart complete." -ForegroundColor Cyan
