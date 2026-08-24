# Power CAT Skills

> Power Platform development extensions curated by Microsoft Power CAT (Customer Advisory Team)

A plugin marketplace for **Microsoft Scout** and **GitHub Copilot CLI** that provides specialized skills for Power Platform development — from Canvas App authoring to Dataverse query crafting, environment governance, and customer storytelling.

## Plugins & Skills

### `powercat-adoption` — Adoption

| Skill | Description |
|-------|-------------|
| **powercat-storytelling** | Generate a polished 5-slide HTML customer story deck — brand-matched, self-contained, and presentation-ready |

### `powercat-canvas-apps` — Canvas Apps

| Skill | Description |
|-------|-------------|
| **analyze-canvas-performance** | Audit Power Apps for performance, delegation, and best-practice issues |

### `powercat-migration-factory` — Power Platform Migration Factory

| Skill | Description |
|-------|-------------|
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
| **powercat-admin-digest** | Produce a Power Platform admin digest — Message Center notices, Service Health incidents, Known Issues, and deprecations. |

### `powercat-overflow` — Overflow

| Skill | Description |
|-------|-------------|
| **powercat-overflow** | Review every Power Automate cloud flow in a solution (.zip) against Microsoft's coding guidelines, write a `[SolutionName].findings.json`, and explore the results in the hosted PowerCAT-Overflow viewer |

### `powercat-overpage` — OverPage

| Skill | Description |
|-------|-------------|
| **powercat-overpage** | Review Power Pages site(s) in a solution (.zip) across Security, Performance, Accessibility, Maintainability, Architecture and Reliability — optionally with a browser HAR capture — and explore findings in the hosted PowerCAT OverPage viewer |

## Prerequisites

- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli) installed and authenticated
- [Microsoft Scout](https://learn.microsoft.com/en-us/microsoft-scout/get-started) installed and configured if you plan to use these skills in Scout
- Access to the [Power Platform Skills](https://github.com/microsoft/power-platform-skills) marketplace (recommended because some workflows use its foundational skills)
- A valid Power Apps environment with appropriate licenses
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) if you plan to use Canvas App skills

## Getting Started

Both Microsoft Scout and GitHub Copilot CLI use GitHub Copilot CLI to register marketplaces and install plugins.

### Microsoft Scout

Ask Scout to install the marketplaces and the plugins you want. For example:

```text
Add the microsoft/power-platform-skills and
microsoft/power-cat-skills plugin marketplaces.

Install canvas-apps@power-platform-skills and
powercat-canvas-apps@power-cat-skills.
```

Scout runs the required terminal commands through its shell. After installation, start a new Scout conversation so it discovers the newly installed skills.

To install a different Power CAT plugin, replace `powercat-canvas-apps` with one of the plugin names listed in [Available Power CAT plugins](#available-power-cat-plugins).

> [!NOTE]
> Microsoft Scout is currently a preview feature. It requires access to the [Frontier preview program](https://adoption.microsoft.com/en-us/copilot/frontier-program/), Microsoft 365 Copilot, and GitHub Copilot Business or Enterprise. See [Get started with Microsoft Scout](https://learn.microsoft.com/en-us/microsoft-scout/get-started).

### GitHub Copilot CLI

Run these commands in a terminal:

```bash
# Register the marketplaces
copilot plugin marketplace add microsoft/power-platform-skills
copilot plugin marketplace add microsoft/power-cat-skills

# Canvas Apps example: install the companion foundation plugin first
copilot plugin install canvas-apps@power-platform-skills
copilot plugin install powercat-canvas-apps@power-cat-skills
```

If you are already inside an interactive Copilot CLI session, use the equivalent slash commands:

```text
/plugin marketplace add microsoft/power-platform-skills
/plugin install canvas-apps@power-platform-skills
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-canvas-apps@power-cat-skills
```

See [Finding and installing plugins for GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing) for marketplace and plugin management commands.

### Available Power CAT plugins

Install any combination of these plugins. Install the companion foundation plugin first where one is listed.

| Power CAT plugin | Companion foundation plugin |
|------------------|-----------------------------|
| `powercat-adoption` | — |
| `powercat-canvas-apps` | `canvas-apps@power-platform-skills` |
| `powercat-migration-factory` | `canvas-apps@power-platform-skills` |
| `powercat-code-apps` | `code-apps-preview@power-platform-skills` |
| `powercat-dataverse` | — |
| `powercat-governance` | — |
| `powercat-procode-eval` | — |
| `powercat-admin-digest` | — |
| `powercat-overflow` | — |
| `powercat-overpage` | — |

```bash
copilot plugin install powercat-adoption@power-cat-skills
copilot plugin install powercat-canvas-apps@power-cat-skills
copilot plugin install powercat-migration-factory@power-cat-skills
copilot plugin install powercat-code-apps@power-cat-skills
copilot plugin install powercat-dataverse@power-cat-skills
copilot plugin install powercat-governance@power-cat-skills
copilot plugin install powercat-procode-eval@power-cat-skills
copilot plugin install powercat-admin-digest@power-cat-skills
copilot plugin install powercat-overflow@power-cat-skills
copilot plugin install powercat-overpage@power-cat-skills
```

### Configure the MCP Server

If you use Canvas App skills, ask Scout or Copilot CLI to run the **configure-canvas-mcp** skill and set up the Canvas Authoring MCP server:

```text
Configure the Canvas MCP server for my environment
```

### Start Using

Start a new Scout or Copilot CLI conversation, then invoke a skill by describing what you want:

```text
Convert my InfoPath to Canvas Apps
```

```text
Analyze my Canvas Apps for performance issues
```

```text
Migrate my SharePoint data sources to Dataverse
```

```text
Write a Dataverse Web API query that returns the top 10 active accounts in Sydney
```

```text
Create a dev environment for adelev@contoso.com
```

```text
Create a customer story deck for Contoso
```

## Permissions and Approvals

Plugins in this repo may invoke multiple tools (file edits, shell commands, MCP servers) during a session, which can result in frequent approval prompts. Use the options below to reduce or eliminate these interruptions.

> **Warning**: Auto-approval options give the agent the same access you have on your machine. Only use these in trusted or sandboxed environments.

### Microsoft Scout

Scout prompts before running sensitive actions by default. To reduce repeated prompts while preserving control:

1. Open **Settings** > **Permissions**.
2. Keep auto-approval limited to the capabilities and commands required by your workflow.
3. Add narrowly scoped shell patterns such as `pac *` or `npm run *` to the allow list when appropriate.
4. Review each request before choosing **Always allow**.

See [Customize shell permissions in Microsoft Scout](https://learn.microsoft.com/en-us/microsoft-scout/use-microsoft-scout#customize-shell-permissions).

### GitHub Copilot CLI

#### Allow specific tools (recommended)

Pre-approve only the tools your workflow needs:

```bash
copilot --allow-tool 'write' --allow-tool 'shell(npm run build)' --allow-tool 'shell(pac *)'
```

#### Allow all tools

```bash
copilot --allow-all-tools
```

To allow everything except dangerous commands:

```bash
copilot --allow-all-tools --deny-tool 'shell(rm)' --deny-tool 'shell(git push)'
```

See [Allowing and denying tools in GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools) for the full reference.

## Project Structure

```
power-cat-skills/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest recognized by Copilot CLI
├── plugins/                  # Individual Power CAT plugins
│   └── <plugin-name>/
│       └── skills/           # Skills included in the plugin
├── shared/
│   └── skills/               # Cross-plugin shared skill definitions
└── README.md
```

## References

- [Power CAT](https://microsoft.github.io/powercat/)
- [Microsoft Scout](https://learn.microsoft.com/en-us/microsoft-scout/overview)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview)
- [GitHub Copilot CLI plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)

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
