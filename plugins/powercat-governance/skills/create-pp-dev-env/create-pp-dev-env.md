---
name: "create-pp-dev-env"
description: "Provision a Microsoft Power Platform Developer environment with Managed Environment = Yes, Get new features early = Yes, and Create on behalf of a specified Owner. Triggers include: 'create developer environment', 'new dev env', 'provision power platform developer environment', 'spin up a dev env for <user>', 'create a Power Platform dev environment'. Runs the New-PowerPlatformDevEnvironment.ps1 script in C:\\Users\\yasinm\\OneDrive - Microsoft\\Documents\\Clawpilot using direct OAuth2 ROPC against t"
---

# Create Power Platform Developer Environment

This skill provisions a Power Platform **Developer** environment with the same settings validated in the customer guide `Creating-PowerPlatform-Developer-Environment.docx`:

- Type = **Developer**
- Region = **United States** (default; user may override)
- **Managed Environment = Yes** (`governanceConfiguration.protectionLevel = Standard`)
- **Get new features early = Yes** (`updateCadence.id = Frequent`)
- **Create on behalf = Yes** (`usedBy = { id, type: User }`)
- Dataverse: English (1033) / USD

## Required inputs

Before running, gather these from the user (use `m_ask_user` if anything is missing):

| Input | Notes |
|---|---|
| **Environment Name** | Display name, e.g. `AutomatedTestDev`. Must be unique in the tenant. |
| **Owner UPN** | Email of the maker who will own the env, e.g. `adelev@contoso.onmicrosoft.com`. Must be a member (not guest) of the home tenant and within their dev-env quota. |
| **Tenant** | Tenant domain (e.g. `M365x92912875.onmicrosoft.com`) or tenant ID. |
| **Admin credentials** | Username + password OR existing Az session. |
| **Region** (optional) | BAP region code, default `unitedstates`. |

NEVER hardcode credentials. Ask the user each run, or accept them as parameters.

## Pre-flight checks

1. Confirm `New-PowerPlatformDevEnvironment.ps1` exists at `C:\Users\yasinm\OneDrive - Microsoft\Documents\Clawpilot\New-PowerPlatformDevEnvironment.ps1`. If not, the script content is in Appendix C of `Creating-PowerPlatform-Developer-Environment.docx` (also in this Clawpilot folder).
2. Verify the Owner UPN resolves in Microsoft Graph before submitting.
3. Verify the env name does not already exist (list `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments?api-version=2021-04-01`).

## Execution

Use **direct OAuth2 ROPC** (not `Connect-AzAccount`) because Az's username/password flow doesn't reliably yield a Graph token.

Public client to use for ROPC: `04b07795-8ddb-461a-bbee-02f9e1bf7b46` (Azure CLI).

Token endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`

Acquire two tokens:
- Graph: scope `https://graph.microsoft.com/.default offline_access`
- BAP:   scope `https://service.powerapps.com/.default offline_access`

Resolve the Owner UPN → Object ID via:
`GET https://graph.microsoft.com/v1.0/users/{upn}?$select=id,userPrincipalName,displayName`

Submit the create request:
`POST https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments?api-version=2021-04-01&retainOnProvisionFailure=false&overrideEnvironmentGroupAssigned=true`

Body (verified working):
```json
{
  "location": "unitedstates",
  "properties": {
    "displayName": "<env name>",
    "environmentSku": "Developer",
    "databaseType": "CommonDataService",
    "updateCadence": { "id": "Frequent" },
    "usedBy": { "id": "<owner objectId>", "type": "User" },
    "linkedEnvironmentMetadata": {
      "baseLanguage": 1033,
      "domainName": "<env name lowercased, alphanum only>",
      "currency": { "code": "USD" },
      "templates": [],
      "securityGroupId": null
    },
    "governanceConfiguration": { "protectionLevel": "Standard" }
  }
}
```

Headers: `Authorization: Bearer <BAP token>`, `Content-Type: application/json`.

Expected response: HTTP **202 Accepted** with a `Location` header pointing to an async operation.

## Polling

Poll the `Location` URL every 15 s until `properties.provisioningState` is `Succeeded` (or `Failed`/`Canceled`). Refresh the BAP token if a poll returns 401.

## Verification

After Succeeded, list environments and confirm the new row shows:
- `environmentSku = Developer`
- `governanceConfiguration.protectionLevel = Standard` (Managed)
- `updateCadence.id = Frequent` (Early Release)
- `usedBy.id` = owner Object ID

Report back with the env name, maker URL (`https://make.powerapps.com/environments/<id>/home`), and admin URL (`clientUris.admin`).

## Common errors and fixes

| Error | Fix |
|---|---|
| `401 Unauthorized` on Graph after `Connect-AzAccount -Credential` | Use ROPC instead — Az password flow doesn't grant cross-resource tokens. |
| `InvalidRequestContent: Could not find member 'createdOnBehalfOf'` | Use `usedBy` (not `createdOnBehalfOf`). |
| `InvalidRequestContent: Could not find member 'maker'` | Remove `governanceConfiguration.settings.extendedSettings`. Just send `protectionLevel: Standard`. |
| `UsedByInvalidInRequest` | Send only `{ id, type: "User" }` — no `userPrincipalName`. Also confirm api-version is `2021-04-01` and the two query params (`retainOnProvisionFailure=false&overrideEnvironmentGroupAssigned=true`) are present. |
| `MFA required` | Caller account must have MFA disabled or use cert/SP auth. The demo tenant `admin@M365x92912875` works because MFA is exempt. |
| Owner already at quota | Default cap is 3 dev envs per user. Tenant admin can raise it, or pick a different owner. |

## Confirmation before running

Before submitting, ALWAYS show the user a summary of what will be created (env name, owner, region, settings) and ask for explicit confirmation. Do not auto-execute. Treat credentials as sensitive — do not log or echo passwords.

## Files referenced

- `C:\Users\yasinm\OneDrive - Microsoft\Documents\Clawpilot\New-PowerPlatformDevEnvironment.ps1` — full PowerShell wrapper using Az.Accounts (legacy auth path).
- `C:\Users\yasinm\OneDrive - Microsoft\Documents\Clawpilot\Creating-PowerPlatform-Developer-Environment.docx` — full customer guide with manual UI steps and Appendix C (script source).
- `C:\Users\yasinm\OneDrive - Microsoft\Documents\Clawpilot\Scratchpad\run_create_env.ps1` — standalone ROPC-based runner (the variant that worked end-to-end during testing).

Prefer the ROPC runner when running non-interactively from this skill.
