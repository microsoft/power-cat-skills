# Power CAT Apps Estimator

[Open the estimator](https://microsoft.github.io/power-cat-skills/PowerCAT-AppsEstimator.html)

A browser-based planning calculator for Copilot Managed Runtime app credits and monthly consumption cost. Supports modeled users and launches, known billable API calls, per-user Power Apps Premium allowances, and optional authoring and AI-service credit budgets.

The Power CAT skin follows [PowerCAT Template.pptx](../PowerCAT%20Template.pptx): charcoal `#323232`, pink `#DA4D84`, off-white `#FAFBFB`, Segoe UI typography, dark table headers, and the original logo. The logo and favicon are extracted from `ppt/media/image1.png` and `ppt/media/image3.png` in that template. The reskin does not change the calculation logic.

## Open and publish

Open `index.html` in a browser with the `assets` folder beside it. There are no package dependencies, backend services, analytics, or persistent browser storage. Inputs reset on reload.

From the repository root, generate the self-contained Pages artifact:

```powershell
node "Common\PowerCAT AppsEstimator\publish.mjs"
```

This embeds the two brand images and writes `docs\PowerCAT-AppsEstimator.html`. Edit the source here, not the generated copy. To check that they are synchronized:

```powershell
node "Common\PowerCAT AppsEstimator\publish.mjs" --check
```

Commit the source, assets, and generated HTML together. GitHub Pages already publishes `main` / `docs`; no Pages settings or existing homepage changes are required. The published HTML can also be downloaded and opened on its own.

## Billing assumptions

The existing preview model uses 0.1 Copilot Credit per billable runtime API call, $0.01 USD per credit by default, and 40,000 available requests per Premium user per 24-hour period by default. Available Premium allowance and effective credit price are editable. A modeled launch adds one API call; additional calls exclude that launch.

Premium coverage is calculated per modeled user and active day, not as a pooled monthly tenant allowance. The model assumes uniform daily usage. Uneven workloads and rolling 24-hour peaks can change actual charges. Blank authoring and service budgets are excluded, not treated as a claim that those categories are free. License subscriptions, taxes, and unentered charges are not included.

Source basis retained from the estimator, checked November 5, 2026:

- [Copilot Managed Runtime licensing FAQ](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/apps/licensing-faq)
- [Copilot Credits licensing guide](https://aka.ms/CopilotCredits/LicensingGuide)
- [Power Platform request limits and allocations](https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations)

Preview rules can change. This is a planning aid, not a Microsoft quote or an invoice. Recheck the source guidance before using it for purchasing decisions.
