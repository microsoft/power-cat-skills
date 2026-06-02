<#
.SYNOPSIS
    Installs the Sales Insights MCP server as a Windows scheduled task.

.DESCRIPTION
    Registers a scheduled task that starts the SI MCP local server on login.
    The server listens on port 8767 (the documented port contract).

    This is the correct setup method for SI MCP — do NOT use mcp-proxy.ps1 add,
    as SI MCP is a standalone local server, not a reverse-proxy target.
#>

[CmdletBinding()]
param(
    [int]$Port = 8767,
    [string]$TaskName = 'SalesInsightsMCP'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = $PSScriptRoot
$StartScript = Join-Path $ScriptDir 'start.ps1'
$VenvPath = Join-Path $ScriptDir '.venv'

# Ensure venv exists
if (-not (Test-Path (Join-Path $VenvPath 'Scripts' 'python.exe'))) {
    Write-Host "Creating virtual environment..."
    python -m venv $VenvPath
    $pip = Join-Path $VenvPath 'Scripts' 'pip.exe'
    & $pip install --only-binary=:all: --quiet -r (Join-Path $ScriptDir 'requirements.txt')
}

# Register scheduled task
$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument "-NoProfile -WindowStyle Hidden -File `"$StartScript`" -Port $Port"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Updating existing scheduled task '$TaskName'..."
    Set-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings | Out-Null
} else {
    Write-Host "Registering scheduled task '$TaskName'..."
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Limited | Out-Null
}

Write-Host "✓ Scheduled task '$TaskName' registered (runs at login, port $Port)"
Write-Host "  To start now: pwsh -NoProfile -File `"$StartScript`" -Port $Port"
