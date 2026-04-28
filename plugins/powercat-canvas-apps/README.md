# Power CAT Canvas Apps Plugin

This plugin provides open‑source skills based on years of Power CAT experience working with large and complex enterprise customers on Microsoft Power Platform. The skills capture practical patterns, architectural insights, and modernization guidance, and are designed to complement and integrate with the power-platform-skills plugin from the official Microsoft marketplace. For best experience you should pre install the canvas-apps plug in from marketplace "microsoft/power-platform-skills" 

> **Preview:** This plugin is currently in [preview](https://www.microsoft.com/en-us/business-applications/legal/supp-powerplatform-preview/). These features are available before official release for customers to provide feedback.

## Prerequisites

- [canvas-apps@power-platform-skills](https://github.com/microsoft/power-platform-skills)

## Installation

### From the marketplace

```bash
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-canvas-apps@power-cat-skills
```

### From a local clone

```bash
claude --plugin-dir /path/to/power-cat-skills/plugins/powercat-canvas-apps
```

## Skills

### `/analyze-canvas-performance`

Analyze and audit a Power Apps canvas app. USE WHEN the user wants to analyze, profile, audit, review, diagnose, or improve a Canvas App or pa.yaml files. USE FOR: slow apps, long load times, delegation warnings, N+1 database calls, excessive collections, ForAll optimization, OnStart overload, Named Formulas, Concurrent execution, Explicit Column Selection, DelayOutput on text inputs, cross-screen control references, Power Automate overuse, unused variables, nested galleries, error handling, App.OnError, form validation, naming conventions, variable scope misuse, modern controls, responsive layout, accessibility. DO NOT USE WHEN the app has not been synced locally yet — sync it first.

**Usage:** Invoke directly with `/analyze-canvas-performance`, or use any of the keywords below to trigger the skill automatically:

- `Do a code review`
- `Check for performance issues`
- `Generate a code review report`

### `/infopath-to-canvas`

Migrate a Microsoft InfoPath form (.xsn) to a Power Apps Canvas app. USE WHEN the user wants to convert, port, or migrate an InfoPath form/template to Canvas Apps, or asks for help moving off of InfoPath.

**Usage:** Invoke directly with `/infopath-to-canvas`, or use any of the keywords below to trigger the skill automatically:

- `Convert my .xsn file to Canvas`
- `Convert my InfoPath to Power Apps`

## Security

Your credentials are always handled securely through the official Azure Identity SDK - we never store or manage tokens directly.

MCP is a new and developing standard. As with all new technology standards, you should review the security of any systems that integrate with MCP servers, such as MCP hosts, clients, agents, AI applications, and models and confirm that they comply with system requirements, standards, and expectations. You should follow Microsoft security guidance for MCP servers, including enabling Entra ID authentication, secure token management, and network isolation. Refer to Microsoft Security Documentation for details.


## Support

If you face issues with:

- **Using the Power CAT Plugin:** Report your issue here: [https://github.com/microsoft/power-cat-skills/issues](https://github.com/microsoft/power-cat-skills/issues). (Microsoft Support won't help you with issues related to this Plugin, but they will help with related, underlying platform and feature issues.)
- **The core features in Microsoft Power Apps Canvas Apps:** Use your standard channel to contact Microsoft Support.

## License
See the [LICENSE](../../LICENSE) file for license information.