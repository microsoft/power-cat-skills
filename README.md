# Power CAT Skills

> Power Platform development extensions curated by Microsoft Power CAT (Customer Advisory Team)

A plugin marketplace for **Claude Code** and **GitHub Copilot** that provides specialized skills for Power Platform development — from Canvas App authoring to Dataverse query crafting, environment governance, and customer storytelling.

## Plugins & Skills

### `powercat-adoption` — Adoption

| Skill | Description |
|-------|-------------|
| **powercat-storytelling** | Generate a polished 5-slide HTML customer story deck — brand-matched, self-contained, and presentation-ready |

### `powercat-canvas-apps` — Canvas Apps

| Skill | Description |
|-------|-------------|
| **analyze-canvas-performance** | Audit Power Apps for performance, delegation, and best-practice issues |
| **infopath-to-canvas** | Migrate InfoPath forms (.xsn) to modern Canvas Apps |
| **migrate-to-dataverse** | Replace SharePoint list data sources with Dataverse table equivalents |

### `powercat-code-apps` — Code Apps

| Skill | Description |
|-------|-------------|
| **design-guide** | Generate a brand-aligned design guide that establishes brand tokens before building a code app, then delegates app creation to `/create-code-app` |

### `powercat-dataverse` — Dataverse

| Skill | Description |
|-------|-------------|
| **dataverse-webapi-query** | Author and ship Dataverse Web API queries — natural language → OData URL, FetchXML conversion, multi-surface targeting (Generative Pages, Code Apps, Xrm.WebApi, Canvas, Power Automate), and error diagnosis |
| **powercat-storytelling** | Generate a polished 5-slide HTML customer story deck — brand-matched, self-contained, and presentation-ready |

### `powercat-governance` — Governance

| Skill | Description |
|-------|-------------|
| **create-pp-dev-env** | Provision a Power Platform Developer environment with standard governance defaults on behalf of any user — no admin center required |

### `powercat-procode-eval` — Pro-Code Eval

| Skill | Description |
|-------|-------------|
| **eval-generator-code-app** | Generate a two-layer eval suite (feature-presence checks + static security analysis) plus an HTML dashboard for a Power Apps Code App |
| **eval-generator-gen-pages** | Generate a three-layer eval suite (presence checks + unit tests + security analysis) plus an HTML dashboard for Power Apps Generative Pages |

### `powercat-admin-digest` — Admin Digest

| Skill | Description |
|-------|-------------|
| **powercat-admin-digest** | Produce a Power Platform admin digest — Message Center notices, Service Health incidents, Known Issues, and deprecations — with shareability tiering so customer-facing summaries never leak NDA content |

### `powercat-overflow` — Overflow

| Skill | Description |
|-------|-------------|
| **powercat-overflow** | Review every Power Automate cloud flow in a solution (.zip) against Microsoft's coding guidelines, write a `[SolutionName].findings.json`, and explore the results in the hosted PowerCAT-Overflow viewer |

### `powercat-overpage` — OverPage

| Skill | Description |
|-------|-------------|
| **powercat-overpage** | Review Power Pages site(s) in a solution (.zip) across Security, Performance, Accessibility, Maintainability, Architecture and Reliability — optionally with a browser HAR capture — and explore findings in the hosted PowerCAT OverPage viewer |

## Prerequisites

- [Power-Platform-skills](https://github.com/microsoft/power-platform-skills) installed (Recomended)
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
3. Add the Power CAT Skills marketplace

```bash
/plugin marketplace add microsoft/power-cat-skills
```

4. Install the desired plugin — choose one or more:

    ```bash
    /plugin install powercat-adoption@power-cat-skills
    /plugin install powercat-canvas-apps@power-cat-skills
    /plugin install powercat-code-apps@power-cat-skills
    /plugin install powercat-dataverse@power-cat-skills
    /plugin install powercat-governance@power-cat-skills
    /plugin install powercat-procode-eval@power-cat-skills
    /plugin install powercat-admin-digest@power-cat-skills
    /plugin install powercat-overflow@power-cat-skills
    /plugin install powercat-overpage@power-cat-skills
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

```
Write a Dataverse Web API query that returns the top 10 active accounts in Sydney
```

```
Create a dev environment for adelev@contoso.com
```

```
Create a customer story deck for Contoso
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
│   └── marketplace.json      # Marketplace manifest
├── plugins/
│   ├── powercat-adoption/
│   │   └── skills/
│   │       └── powercat-storytelling/
│   ├── powercat-canvas-apps/
│   │   └── skills/
│   │       ├── analyze-canvas-performance/
│   │       ├── infopath-to-canvas/
│   │       └── migrate-to-dataverse/
│   ├── powercat-dataverse/
│   │   └── skills/
│   │       └── dataverse-webapi-query/
│   └── powercat-governance/
│       └── skills/
│           └── create-pp-dev-env/
├── shared/
│   └── skills/               # Cross-plugin shared skill definitions
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
