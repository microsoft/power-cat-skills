<#
.SYNOPSIS
    Verifies that all MCP servers required by Portfolio Pulse are alive and responsive.

.DESCRIPTION
    Checks each configured MCP server port. Uses the documented port contract:
      - Power BI MCP:         port 8765 (reverse proxy)
      - Sales Insights MCP:   port 8767 (standalone local server)

    Fix #15: Uses the correct port 8767 for Sales Insights MCP as documented
    in mcp_proxies.json, not the auto-assigned port from mcp-proxy.ps1.
#>

[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Servers = @(
    @{ Name = 'Power BI MCP';         Port = 8765 }
    @{ Name = 'Sales Insights MCP';   Port = 8767 }
)

$allAlive = $true

foreach ($server in $Servers) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcp.BeginConnect('127.0.0.1', $server.Port, $null, $null)
        $waitResult = $asyncResult.AsyncWaitHandle.WaitOne([TimeSpan]::FromSeconds($TimeoutSeconds))

        if ($waitResult -and $tcp.Connected) {
            $tcp.EndConnect($asyncResult)
            $tcp.Close()
            Write-Host "✓ $($server.Name) (:$($server.Port)) — alive" -ForegroundColor Green
        }
        else {
            $tcp.Close()
            throw "timeout"
        }
    }
    catch {
        Write-Host "✗ $($server.Name) (:$($server.Port)) — not reachable" -ForegroundColor Red
        $allAlive = $false
    }
}

if (-not $allAlive) {
    Write-Error "One or more MCP servers are not reachable. Run quickstart.ps1 for detailed remediation steps."
    exit 1
}

Write-Host "`nAll MCP servers are alive." -ForegroundColor Green
