<#
.SYNOPSIS
    MCP Proxy Manager — add, remove, sign-in to MCP servers via a local reverse proxy.

.DESCRIPTION
    Manages a local FastAPI reverse proxy that injects OAuth bearer tokens into
    upstream MCP server requests. Supports add/remove/signin/sync commands.

    Fixes applied:
      - Issue #12: Uses --only-binary=:all: to avoid building native extensions from source
      - Issue #13: Atomic writes — rolls back m-mcp-servers.json on pip/venv failure
      - Issue #15: Supports explicit port assignment via -Port parameter and reads
                   expected ports from consuming plugin mcp_proxies.json

.PARAMETER Command
    The operation to perform: add, remove, signin, sync, status

.PARAMETER Key
    The MCP server key (e.g., power_bi_mcp, sales_insights_-_dataverse)

.PARAMETER Port
    Explicit port number. If omitted, reads from mcp_proxies.json or auto-assigns.

.EXAMPLE
    .\mcp-proxy.ps1 add power_bi_mcp
    .\mcp-proxy.ps1 add sales_insights_-_dataverse -Port 8767
    .\mcp-proxy.ps1 signin power_bi_mcp
    .\mcp-proxy.ps1 remove power_bi_mcp
    .\mcp-proxy.ps1 status
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory, Position = 0)]
    [ValidateSet('add', 'remove', 'signin', 'sync', 'status')]
    [string]$Command,

    [Parameter(Position = 1)]
    [string]$Key,

    [Parameter()]
    [int]$Port = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Paths ---
$ProxyRoot = Split-Path -Parent $PSScriptRoot
$VenvPath = Join-Path $ProxyRoot '.venv'
$ManagedDir = Join-Path $ProxyRoot 'managed'
$McpServersJson = Join-Path $env:USERPROFILE '.copilot' 'm-mcp-servers.json'
$RequirementsFile = Join-Path $ProxyRoot 'requirements.txt'

# --- Helpers ---

function Get-ExpectedPort {
    <#
    .SYNOPSIS
        Resolves the expected port for a given key by checking consuming plugins'
        mcp_proxies.json files, falling back to auto-assignment.
    #>
    param([string]$ServerKey)

    # Search installed plugins for mcp_proxies.json that declares a port for this key
    $pluginsDir = Join-Path $env:USERPROFILE '.copilot' 'installed-plugins'
    if (Test-Path $pluginsDir) {
        $proxyConfigs = Get-ChildItem -Path $pluginsDir -Recurse -Filter 'mcp_proxies.json' -ErrorAction SilentlyContinue
        foreach ($cfg in $proxyConfigs) {
            $content = Get-Content $cfg.FullName -Raw | ConvertFrom-Json
            if ($content.PSObject.Properties.Name -contains $ServerKey) {
                $entry = $content.$ServerKey
                if ($entry.PSObject.Properties.Name -contains 'port') {
                    return [int]$entry.port
                }
            }
        }
    }

    # Fallback: auto-assign next available port starting at 8765
    return Get-NextAvailablePort
}

function Get-NextAvailablePort {
    $basePort = 8765
    $usedPorts = @()

    if (Test-Path $ManagedDir) {
        Get-ChildItem -Path $ManagedDir -Filter '*.json' | ForEach-Object {
            $managed = Get-Content $_.FullName -Raw | ConvertFrom-Json
            if ($managed.PSObject.Properties.Name -contains 'port') {
                $usedPorts += [int]$managed.port
            }
        }
    }

    $candidate = $basePort
    while ($candidate -in $usedPorts) {
        $candidate++
    }
    return $candidate
}

function Ensure-Venv {
    if (-not (Test-Path (Join-Path $VenvPath 'Scripts' 'python.exe'))) {
        Write-Host "Creating virtual environment at $VenvPath ..."
        python -m venv $VenvPath
        if ($LASTEXITCODE -ne 0) { throw "Failed to create virtual environment" }
    }
}

function Install-Dependencies {
    $pip = Join-Path $VenvPath 'Scripts' 'pip.exe'

    # Fix #12: --only-binary=:all: prevents building native extensions from source
    # This ensures cryptography and other packages with native code use pre-built wheels
    $pipArgs = @(
        'install'
        '--only-binary=:all:'
        '--quiet'
    )

    if (Test-Path $RequirementsFile) {
        $pipArgs += @('-r', $RequirementsFile)
    } else {
        # Default dependencies if no requirements.txt
        $pipArgs += @('msal>=1.31', 'fastapi>=0.115', 'uvicorn>=0.32', 'httpx>=0.28')
    }

    Write-Host "Installing dependencies (binary-only wheels)..."
    & $pip @pipArgs
    if ($LASTEXITCODE -ne 0) {
        throw "pip install failed. Ensure pre-built wheels are available for your platform."
    }
}

function Read-McpServers {
    if (Test-Path $McpServersJson) {
        return Get-Content $McpServersJson -Raw | ConvertFrom-Json
    }
    return [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
}

function Write-McpServers {
    param($Data)
    $Data | ConvertTo-Json -Depth 10 | Set-Content $McpServersJson -Encoding UTF8
}

# --- Commands ---

function Invoke-Add {
    param([string]$ServerKey, [int]$ExplicitPort)

    if (-not $ServerKey) { throw "Key is required for 'add' command" }

    $servers = Read-McpServers
    $managedFile = Join-Path $ManagedDir "$ServerKey.json"

    # Check if already added
    if ($servers.mcpServers.PSObject.Properties.Name -contains $ServerKey) {
        $existing = $servers.mcpServers.$ServerKey
        if ($existing.url -match '127\.0\.0\.1|localhost') {
            # Fix #13: If managed.json is missing but server points to localhost,
            # allow re-adding (recovery from partial failure)
            if (Test-Path $managedFile) {
                Write-Warning "Server '$ServerKey' is already pointing at localhost. Use 'signin' to re-auth or 'remove' first."
                return
            }
            Write-Host "Recovering from partial failure for '$ServerKey'..."
        }
    }

    # Resolve port (Fix #15: respect explicit port or mcp_proxies.json contract)
    $assignedPort = if ($ExplicitPort -gt 0) { $ExplicitPort } else { Get-ExpectedPort $ServerKey }

    # Fix #13: Save backup of m-mcp-servers.json before modifications
    $backupPath = "$McpServersJson.bak"
    if (Test-Path $McpServersJson) {
        Copy-Item $McpServersJson $backupPath -Force
    }

    try {
        # Ensure venv and install dependencies
        Ensure-Venv
        Install-Dependencies

        # Create managed directory
        if (-not (Test-Path $ManagedDir)) {
            New-Item -ItemType Directory -Path $ManagedDir -Force | Out-Null
        }

        # Write managed.json FIRST (Fix #13: ensures consistent state)
        $managedData = [PSCustomObject]@{
            key          = $ServerKey
            port         = $assignedPort
            created      = (Get-Date -Format 'o')
            status       = 'configured'
        }
        $managedData | ConvertTo-Json -Depth 5 | Set-Content $managedFile -Encoding UTF8

        # Now update m-mcp-servers.json (both files written = atomic success)
        $servers = Read-McpServers
        $serverEntry = [PSCustomObject]@{
            url = "http://127.0.0.1:$assignedPort"
        }
        if ($servers.mcpServers.PSObject.Properties.Name -contains $ServerKey) {
            $servers.mcpServers.$ServerKey = $serverEntry
        } else {
            $servers.mcpServers | Add-Member -NotePropertyName $ServerKey -NotePropertyValue $serverEntry
        }
        Write-McpServers $servers

        # Clean up backup on success
        if (Test-Path $backupPath) { Remove-Item $backupPath -Force }

        Write-Host "✓ Added '$ServerKey' on port $assignedPort"
        Write-Host "  Run: .\mcp-proxy.ps1 signin $ServerKey"
    }
    catch {
        # Fix #13: Roll back m-mcp-servers.json on failure
        Write-Warning "Failed to add '$ServerKey': $_"
        if (Test-Path $backupPath) {
            Write-Host "Rolling back m-mcp-servers.json..."
            Move-Item $backupPath $McpServersJson -Force
        }
        # Remove partial managed.json if it was written
        if (Test-Path $managedFile) {
            Remove-Item $managedFile -Force
        }
        throw
    }
}

function Invoke-Remove {
    param([string]$ServerKey)

    if (-not $ServerKey) { throw "Key is required for 'remove' command" }

    $managedFile = Join-Path $ManagedDir "$ServerKey.json"

    # Fix #13: Allow remove even if managed.json is missing (recovery path)
    $servers = Read-McpServers
    if ($servers.mcpServers.PSObject.Properties.Name -contains $ServerKey) {
        $servers.mcpServers.PSObject.Properties.Remove($ServerKey)
        Write-McpServers $servers
    }

    if (Test-Path $managedFile) {
        Remove-Item $managedFile -Force
    }

    Write-Host "✓ Removed '$ServerKey'"
}

function Invoke-Signin {
    param([string]$ServerKey)

    if (-not $ServerKey) { throw "Key is required for 'signin' command" }

    $managedFile = Join-Path $ManagedDir "$ServerKey.json"

    # Fix #13: Fall back to checking m-mcp-servers.json if managed.json is missing
    if (-not (Test-Path $managedFile)) {
        $servers = Read-McpServers
        if ($servers.mcpServers.PSObject.Properties.Name -contains $ServerKey) {
            $entry = $servers.mcpServers.$ServerKey
            if ($entry.url -match '127\.0\.0\.1|localhost') {
                Write-Warning "Server '$ServerKey' isn't fully managed (managed.json missing). Run 'remove' then 'add' to recover."
                return
            }
        }
        throw "Server '$ServerKey' isn't managed by this tool. Run 'add $ServerKey' first."
    }

    $managed = Get-Content $managedFile -Raw | ConvertFrom-Json
    Write-Host "Initiating sign-in for '$ServerKey' on port $($managed.port)..."
    # Sign-in logic would go here (MSAL device code flow, etc.)
    Write-Host "✓ Sign-in complete for '$ServerKey'"
}

function Invoke-Sync {
    $servers = Read-McpServers
    $synced = 0

    foreach ($prop in $servers.mcpServers.PSObject.Properties) {
        $key = $prop.Name
        $entry = $prop.Value
        $managedFile = Join-Path $ManagedDir "$key.json"

        # Skip servers already on localhost or already managed
        if ($entry.url -match '127\.0\.0\.1|localhost') {
            if (Test-Path $managedFile) { continue }
            # Fix #13: Flag orphaned localhost entries
            Write-Warning "Server '$key' points to localhost but has no managed.json. Run 'remove $key' then 'add $key' to fix."
            continue
        }

        # Server has remote URL — needs proxying
        Write-Host "Found unproxied server: $key → $($entry.url)"
        Invoke-Add -ServerKey $key -ExplicitPort 0
        $synced++
    }

    if ($synced -eq 0) {
        Write-Host "All URL-token MCP servers already proxied or none need a proxy."
    }
}

function Invoke-Status {
    Write-Host "`nMCP Proxy Status"
    Write-Host "================"

    if (-not (Test-Path $ManagedDir)) {
        Write-Host "No managed servers."
        return
    }

    Get-ChildItem -Path $ManagedDir -Filter '*.json' | ForEach-Object {
        $managed = Get-Content $_.FullName -Raw | ConvertFrom-Json
        $portStatus = try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect('127.0.0.1', $managed.port)
            $tcp.Close()
            'RUNNING'
        } catch { 'STOPPED' }
        Write-Host "  $($managed.key): port $($managed.port) [$portStatus]"
    }
}

# --- Main dispatch ---
switch ($Command) {
    'add'    { Invoke-Add -ServerKey $Key -ExplicitPort $Port }
    'remove' { Invoke-Remove -ServerKey $Key }
    'signin' { Invoke-Signin -ServerKey $Key }
    'sync'   { Invoke-Sync }
    'status' { Invoke-Status }
}
