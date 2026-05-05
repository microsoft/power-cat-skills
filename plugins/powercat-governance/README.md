# Power CAT Governance Plugin

This plugin provides open‑source skills based on years of Power CAT experience working with large and complex enterprise customers on Microsoft Power Platform. The skills capture practical governance patterns, admin automation, and environment management guidance, and are designed to complement and integrate with the power-platform-skills plugin from the official Microsoft marketplace.

> **Preview:** This plugin is currently in [preview](https://www.microsoft.com/en-us/business-applications/legal/supp-powerplatform-preview/). These features are available before official release for customers to provide feedback.

## Prerequisites

- [power-platform-skills](https://github.com/microsoft/power-platform-skills)
- Power Platform admin rights on the target tenant
- `New-PowerPlatformDevEnvironment.ps1` script in your Clawpilot working folder

## Installation

### From the marketplace

```bash
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-governance@power-cat-skills
```

### From a local clone

```bash
claude --plugin-dir /path/to/power-cat-skills/plugins/powercat-governance
```

## Skills

### `/create-pp-dev-env` — Power Platform Developer Environment Provisioner

Spin up a fully-configured Power Platform Developer environment for any teammate in under 2 minutes — without clicking through the admin center.

USE WHEN the user wants to create a developer environment, provision a Power Platform environment on behalf of a user, or automate environment setup with standard governance defaults.

**Usage:** Invoke directly with `/create-pp-dev-env`, or use any of the phrases below to trigger the skill automatically:

- `Create developer environment`
- `New dev env for <user>`
- `Provision power platform developer environment`
- `Spin up a dev env`

**What it does:**
1. Looks up the target owner in Microsoft Graph (no need to copy AAD ObjectIds)
2. Shows a confirmation card with env name, region, owner, and toggles before anything is created
3. Calls the Power Platform BAP API directly to provision a Developer SKU environment with:
   - Managed Environment = Yes
   - Get new features early = Yes
   - Group sharing cadence = Frequent
   - Owner / "Created on behalf of" = the specified user
4. Polls until the environment reaches `Succeeded`, then verifies Sku, State, Managed, and Owner via PAC CLI

**Why use it:** Replaces a ~15-step manual flow in the Power Platform admin center with a single prompt. Enforces standard governance defaults so every dev env comes out consistent. Includes pre-flight checks, polling, and post-provision verification.

## Security

Credentials are never logged or hardcoded — authentication is direct OAuth2 against `login.microsoftonline.com` at runtime. The skill always pauses for a human confirmation before submitting any create call.

MCP is a new and developing standard. As with all new technology standards, you should review the security of any systems that integrate with MCP servers, such as MCP hosts, clients, agents, AI applications, and models and confirm that they comply with system requirements, standards, and expectations. You should follow Microsoft security guidance for MCP servers, including enabling Entra ID authentication, secure token management, and network isolation. Refer to Microsoft Security Documentation for details.

## Support

If you face issues with:

- **Using the Power CAT Plugin:** Report your issue here: [https://github.com/microsoft/power-cat-skills/issues](https://github.com/microsoft/power-cat-skills/issues). (Microsoft Support won't help you with issues related to this Plugin, but they will help with related, underlying platform and feature issues.)
- **The core features in Microsoft Power Platform:** Use your standard channel to contact Microsoft Support.

## License
See the [LICENSE](../../LICENSE) file for license information.