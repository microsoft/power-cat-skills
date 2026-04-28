# Power CAT Skills

> Power Platform development extensions curated by Microsoft Power CAT (Customer Advisory Team)

A plugin for **Claude Code** and **GitHub Copilot** that provides specialized skills for Power Apps canvas app development.

## Skills Included

| Skill | Description |
|-------|-------------|
| **analyze-canvas-performance** | Audit Power Apps for performance, delegation, and best-practice issues |
| **infopath-to-canvas** | Migrate InfoPath forms (.xsn) to modern Canvas Apps |
| **migrate-to-dataverse** | Replace data source calls with Dataverse table equivalents |

## Prerequisites

- [Power-Platform-skills](https://github.com/microsoft/power-cat-skills) installed (Recomended)
- A valid Power Apps environment with appropriate licenses
- Claude Code or GitHub Copilot with plugin support

## Getting Started

### Install the Plugin

Run these commands inside a Claude Code or GitHub Copilot CLI session:

1. Add the Power-Platform-Skills marketplace (Requirement)

```bash
/plugin marketplace add microsoft/power-platform-skills
```

2. Install the desired plugin

    ```bash
    /plugin install canvas-apps@power-platform-skills    
    ```
3. Add the marketplace (Requirement)

```bash
/plugin marketplace add microsoft/power-cat-skills
```

4. Install the desired plugin

    ```bash
    /plugin install powercat-canvas-apps@power-cat-skills    
    ```

### Configure the MCP Server

Run the **configure-canvas-mcp** skill to set up the Canvas Authoring MCP server:

```
Configure the Canvas MCP server for my environment
```

### Start Using

Once configured, invoke any skill by describing what you want:

```
Convert my InfoPath to Canvas Apps
```

```
Analyze my Canvas Apps for performance issues
```

```
Migrate my SharePoint data sources to Dataverse
```

## Running Without Interruption

Plugins in this repo may invoke multiple tools (file edits, shell commands, MCP servers) during a session, which can result in frequent approval prompts. Use the options below to reduce or eliminate these interruptions.

> **Warning**: Auto-approval options give the agent the same access you have on your machine. Only use these in trusted or sandboxed environments.

### Claude Code

#### Option 1 — Permission mode (recommended)

Set the `acceptEdits` mode to auto-approve file edits while still prompting for shell commands:

```jsonc
// .claude/settings.json (project-level) or ~/.claude/settings.json (user-level)
{
  "defaultMode": "acceptEdits",
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git *)",
      "Bash(pac *)"
      // add other commands your workflow needs
    ]
  }
}
```

#### Option 2 — Allow all tools

Press <kbd>Shift</kbd>+<kbd>Tab</kbd> during a session to cycle to **auto-accept** mode, or launch with:

```bash
claude --dangerously-skip-permissions
```

See the [Claude Code permissions docs](https://code.claude.com/docs/en/permissions) for the full reference.

### GitHub Copilot CLI

#### Option 1 — Allow specific tools (recommended)

Pre-approve only the tools your workflow needs:

```bash
copilot --allow-tool 'write' --allow-tool 'shell(npm run build)' --allow-tool 'shell(pac *)'
```

#### Option 2 — Allow all tools in Copilot

```bash
copilot --allow-all-tools
```

To allow everything except dangerous commands:

```bash
copilot --allow-all-tools --deny-tool 'shell(rm)' --deny-tool 'shell(git push)'
```

See the [Copilot CLI docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli) for the full reference.


## Project Structure

```
power-cat-skills/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── skills/
│   ├── analyze-canvas-performance/
│   │   └── SKILL.md
│   ├── infopath-to-canvas/
│   │   └── SKILL.md
│   └── migrate-to-dataverse/
│       └── SKILL.md
├── marketplace.json          # Marketplace registry
└── README.md
```
## References

- [Power CAT](https://microsoft.github.io/powercat/)

## License

The code in this repo is licensed under the [MIT](LICENSE) license.

## Contributing

This plugin is maintained by the Microsoft Power CAT (Customer Advisory Team). Contributions are welcome via pull requests.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
