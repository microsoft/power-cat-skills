<#
.SYNOPSIS
    Starts the Sales Insights MCP local server on the configured port.

.DESCRIPTION
    Launches the FastMCP server (server.py) which exposes Sales Insights tools:
      - successhub_query: Query Success Hub cohort data
      - open_pipeline: Retrieve open pipeline opportunities
      - refresh_cohort: Refresh a cohort's data from Dataverse

    The server listens on port 8767 by default (the documented port contract).
    This is a standalone server — NOT a reverse proxy.
#>

[CmdletBinding()]
param(
    [int]$Port = 8767
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = $PSScriptRoot
$VenvPython = Join-Path $ScriptDir '.venv' 'Scripts' 'python.exe'
$ServerScript = Join-Path $ScriptDir 'server.py'

if (-not (Test-Path $VenvPython)) {
    Write-Error "Virtual environment not found. Run install-task.ps1 first."
    exit 1
}

if (-not (Test-Path $ServerScript)) {
    Write-Error "server.py not found at $ServerScript"
    exit 1
}

Write-Host "Starting Sales Insights MCP server on port $Port..." -ForegroundColor Cyan
& $VenvPython $ServerScript --port $Port
