# Flow Request Usage – deployment

`FlowRequestUsage_1_0_0_1_managed.zip` is the managed solution **Flow Request Usage** 1.0.0.1 (publisher **Power CAT**, prefix `pcat`). It contains one canvas app, *Flow Request Usage* (`pcat_flowrequestusage_097cb`).

## Before importing

- The target environment has Dataverse.
- Data policies allow these three connectors together (same data group, not blocked): **Power Platform for Admins V2**, **Office 365 Users**, **Power Automate Management**. If the environment is in an environment group, its connector policy must allow them too.
- App users have Power Platform administrator rights, because the app reads tenant-wide usage and lists flows as an admin.
- All three connectors are Standard, so users don't need a premium Power Apps license.

## Import

**Portal:** Power Apps → target environment → **Solutions** → **Import solution** → select the zip → **Next** → **Import**.

**CLI:**

```
pac auth create --environment <target environment ID or URL>
pac solution import --path FlowRequestUsage_1_0_0_1_managed.zip
```

You don't need a deployment settings file, because the solution has no connection references or environment variables.

## After importing

1. Share the app with the admins who will use it.
2. On first launch, each user signs in to the three connectors with their own account.

