# Power CAT Dataverse Plugin

This plugin provides open‑source skills based on years of Power CAT experience working with large and complex enterprise customers on Microsoft Power Platform. The skills capture practical patterns, architectural insights, and query-authoring guidance for Microsoft Dataverse, and are designed to complement and integrate with the power-platform-skills plugin from the official Microsoft marketplace.

> **Preview:** This plugin is currently in [preview](https://www.microsoft.com/en-us/business-applications/legal/supp-powerplatform-preview/). These features are available before official release for customers to provide feedback.

## Prerequisites

- [power-platform-skills](https://github.com/microsoft/power-platform-skills)

## Installation

### From the marketplace

```bash
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-dataverse@power-cat-skills
```

### From a local clone

```bash
claude --plugin-dir /path/to/power-cat-skills/plugins/powercat-dataverse
```

## Skills

### `/dataverse-webapi-query`

Helps you author and ship Microsoft Dataverse queries without falling into the usual traps — mis-cased logical names, wrong lookup annotations, missing `Prefer` headers, or accidentally hand-rolling HTTP when the host already gives you a typed client.

USE WHEN the user wants to: write a Dataverse Web API URL, convert FetchXML to OData, build a query for a specific Power Apps surface (Generative Pages, Code Apps, model-driven JS, Canvas, Power Automate), optimize or explain an existing query, diagnose a 400/401/404 error, or get a bearer token for live testing.

**Usage:** Invoke directly with `/dataverse-webapi-query`, or use any of the keywords below to trigger the skill automatically:

- `Dataverse query`
- `Web API URL for…`
- `Convert FetchXML`
- `Why is this 400 / 401 / 404`
- `Build a query for a generative page / code app`
- `Call Dataverse from my React app`
- `How do I get a token to test this`

## Security

This skill never accepts, stores, or transmits bearer tokens. You run every authenticated request yourself; the skill provides the command. Credentials are always handled securely through the official Azure Identity SDK.

MCP is a new and developing standard. As with all new technology standards, you should review the security of any systems that integrate with MCP servers, such as MCP hosts, clients, agents, AI applications, and models and confirm that they comply with system requirements, standards, and expectations. You should follow Microsoft security guidance for MCP servers, including enabling Entra ID authentication, secure token management, and network isolation. Refer to Microsoft Security Documentation for details.

## Support

If you face issues with:

- **Using the Power CAT Plugin:** Report your issue here: [https://github.com/microsoft/power-cat-skills/issues](https://github.com/microsoft/power-cat-skills/issues). (Microsoft Support won't help you with issues related to this Plugin, but they will help with related, underlying platform and feature issues.)
- **The core features in Microsoft Dataverse:** Use your standard channel to contact Microsoft Support.

## License
See the [LICENSE](../../LICENSE) file for license information.