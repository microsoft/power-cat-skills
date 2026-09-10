---
name: "powercat-overpage-ai-modernization"
description: "Extension guidance for PowerCAT OverPage to inspect a downloaded Power Pages site configuration for end-user AI modernization signals, identify missing AI opportunities, and produce grounded findings that point to exact site settings, lists, forms, web templates, page copy, snippets, and front-end code."
---

# PowerCAT OverPage AI Modernization Instructions

Use this add-on when reviewing Power Pages sites with **PowerCAT OverPage** and the user asks for AI modernization, AI readiness, Copilot/agent readiness, or opportunities to add end-user AI experiences.

The goal is to inspect the same local artifacts OverPage already reads from a Power Platform solution `.zip` or `pac powerpages download` output:

- Site settings
- Site components / enhanced data model JSON
- Basic forms, multistep forms, lists, table permissions, page permissions, and web roles
- Web pages, page copy, web templates, Liquid, content snippets
- Web files, custom JavaScript, CSS, React/SPA bundles, and other front-end code
- Optional HAR capture when available

Do **not** invent AI findings. Every finding must be grounded in a concrete marker, missing prerequisite, or code/configuration pattern visible in the downloaded site.

## Classify the site type before recommending AI features

Before raising AI modernization opportunities, classify each reviewed site as exactly one of these:

| Site type | Definition | Typical scanned artifacts |
|---|---|---|
| Power Pages SPA site | A code-first site where the primary user experience is a React, Angular, Vue, Astro, or other single-page app hosted on Power Pages. | Web files containing bundled app code; root page or template that mounts an SPA, such as `#root`, `#app`, or a framework bundle; front-end routes; custom JavaScript making `/_api` calls. |
| Power Pages site | A conventional Power Pages site built primarily from pages, templates, forms, lists, snippets, and standard Power Pages components. | Web pages, web templates, basic forms, multistep forms, lists, content snippets, page templates, table permissions, web roles. |

Treat the classification as **either/or, not both**. A site can contain custom JavaScript and still be a conventional Power Pages site; classify it as a SPA site only when the SPA is the primary runtime experience.

Add the classification to the site summary:

```text
Site type: Power Pages SPA site. AI modernization guidance is limited to SPA-callable APIs, site agent integration, search, and custom front-end patterns. Standard Power Pages list/form component recommendations are not applied unless those components are actually present.
```

or:

```text
Site type: Power Pages site. AI modernization guidance includes standard Power Pages components such as forms, lists, site search, site agents, and page-level summarization where matching components are present.
```

### Recommendation gating by site type

Use the site type to prevent confusing or irrelevant recommendations.

| Recommendation area | Power Pages SPA site | Power Pages site |
|---|---|---|
| Data Summarization API | Recommend when SPA pages display Dataverse records, timelines, case details, applications, claims, profiles, or other long-form data. | Recommend when pages/templates/forms display long Dataverse content or related records. |
| Search Summary API | Recommend when the SPA implements custom search or has enough indexed content to justify AI search summaries. | Recommend when site search exists or content-heavy pages would benefit from generative search. |
| Site agent / site copilot | Recommend when the SPA has support, help, onboarding, FAQ, or authenticated guidance journeys. | Recommend for content-heavy, support, FAQ, service, or authenticated self-service sites. |
| AI form fill assistance | Do not recommend unless the downloaded site contains actual Power Pages basic form components. For custom SPA forms, recommend the Data Summarization API or a custom AI-assisted UX only if a documented Power Pages AI API supports the scenario. | Recommend for basic create forms where users transcribe data from documents/images. Do not recommend for unsupported multistep form scenarios. |
| Modern List AI Insights | Do not recommend unless the SPA site actually includes a Power Pages modern list component. | Recommend only when modern list components are present and summarization/charting would reduce user effort. |
| Modern List natural-language search | Do not recommend unless the SPA site actually includes a Power Pages modern list component. | Recommend only when modern list components with search are present or clearly useful. |
| Omnichannel handoff | Recommend only when a site agent is present or support escalation is a clear SPA journey. | Recommend only when a site agent is present or support escalation is a clear site journey. |

Hard rule: **Never tell a maker to enable standard Power Pages list AI features on a SPA site unless a list component is actually present in the downloaded configuration.** For SPA sites, prioritize the documented SPA-facing APIs and code-level integration markers.

## Add this review pass to OverPage Step 3

After the standard Security, Performance, Accessibility, Maintainability, Architecture, Reliability, and optional SEO checks, run an additional **AI modernization pass** for each site.

AI modernization findings should still use the existing OverPage schema categories:

| AI modernization concern | Use OverPage category |
|---|---|
| Missing or poorly wired AI feature opportunity | Architecture |
| AI feature enabled but fragile, incomplete, or hard to maintain | Reliability or Maintainability |
| AI feature exposes too much data or relies on broad permissions | Security |
| AI feature adds heavy scripts, duplicate calls, or slow APIs | Performance |
| AI UI is hard to use with keyboard/screen reader | Accessibility |

Use rule names prefixed with `ai-modernization/`, for example:

- `ai-modernization/site-agent-missing`
- `ai-modernization/data-summarization-api`
- `ai-modernization/form-fill-assistance`
- `ai-modernization/modern-list-ai-insights`
- `ai-modernization/generative-search`

## AI modernization source URLs

When the base OverPage skill requires citations only from the canonical `sources.md`, add these URLs to that source list before citing them in findings.

| Source | URL |
|---|---|
| Enable a site agent | `https://learn.microsoft.com/en-us/power-pages/getting-started/enable-agent` |
| Power Pages agent how-to | `https://learn.microsoft.com/en-us/power-pages/getting-started/agent-how-to` |
| Customize your agent | `https://learn.microsoft.com/en-us/power-pages/getting-started/customize-your-agent` |
| Build an agent from a form | `https://learn.microsoft.com/en-us/power-pages/getting-started/build-agent-from-form` |
| Add a form / AI form fill assistance | `https://learn.microsoft.com/en-us/power-pages/getting-started/add-form#enable-ai-form-fill-assistance-on-a-form-preview` |
| Add AI summary to list | `https://learn.microsoft.com/en-us/power-pages/getting-started/add-ai-summary-list` |
| Add a list | `https://learn.microsoft.com/en-us/power-pages/getting-started/add-list` |
| Generative AI site search | `https://learn.microsoft.com/en-us/power-pages/configure/search/generative-ai` |
| Add search | `https://learn.microsoft.com/en-us/power-pages/getting-started/add-search` |
| Data summarization API | `https://learn.microsoft.com/en-us/power-pages/configure/data-summarization-api` |
| Add Copilot summarization to case page | `https://learn.microsoft.com/en-us/power-pages/configure/add-copilot-summarization-to-case-page` |
| Power Pages Web API settings | `https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview#site-settings-for-the-web-api` |
| Omnichannel handoff | `https://learn.microsoft.com/en-us/power-pages/configure/omnichannel` |

## Scanner inventory: end-user AI features and markers

Inspect each site for these end-user AI features. Record both **positive signals** and **missing opportunity signals**.

| Feature | End-user experience | Primary scanner marker | Secondary scanner signals | Confidence |
|---|---|---|---|---|
| Site agent / site copilot | Users chat with an AI agent grounded in site content. | Enhanced data model: `Site Component` record where component type is `Bot Consumer`; JSON `content` contains `botschemaname`. Standard model: `Bot consumer` record with schema name. | Header, footer, or web template code containing `.pva-embedded-web-chat-widget`, `.pages-chatbot-header`, `.pva-embedded-web-chat-window-container`, Copilot Studio bot embed code, or agent widget customization CSS. | High |
| Native Power Pages agent control / form-created agents | Users interact with newer/native agent experiences, including form-created agents. | Site setting `SiteCopilot/EnableNativeControlPVABots = true`. | Web API table settings that support form-agent actions, such as `Webapi/<table>/enabled` and `Webapi/<table>/fields`. These are supporting signals only because Web API settings are not unique to AI. | Medium |
| AI form fill assistance | Users upload a PDF/image and form fields are filled automatically; multiline fields can offer draft assistance. | Site setting `Forms/{FormId}/EnableGenAIFormsAssistant = true`. | Basic form records for create forms; page copy or scripts referencing upload-to-fill or draft-assistance UX. Verify the form type, because documented support applies to basic create forms and not multistep forms. | High |
| Modern List AI Insights / AI summary | Users see AI-generated summaries and chart visualizations over list data. | List/entity list configuration with AI settings surfaced in maker UI, such as `AI Insights`, `Keep insights expanded`, AI card `Title`, `Additional Instructions`, and `Chart Type`. | Modern list component metadata; Liquid/list objects that expose AI insight flags; list pages with summary card markup. | Medium-low until exact downloaded schema field names are confirmed from sample exports. |
| Modern List natural-language search | Users search list records with natural-language queries. | List/entity list configuration with `Enable search in this list` and `Search with natural language` enabled. | Search input copy or JavaScript that describes natural-language search; modern list search configuration. | Medium-low until exact downloaded schema field names are confirmed from sample exports. |
| Site search with generative AI / search summarization | Users get AI-generated search summaries or answers from site content. | JavaScript or web template calls to `/_api/search/v1.0/summary`; request payload contains `userQuery`. | Content snippets `Search/Summary/Title` and `Search/Results/Title`; site setting `Search/IndexQueryName`; page copy with generated summary containers; setup label `Enable Site search with generative AI`. | High for endpoint/code markers; medium for setup toggle storage. |
| Data summarization API / record summaries | Users get AI summaries of Dataverse/page content, such as case or timeline summaries. | Site settings `Summarization/Data/Enable = true`, `Summarization/prompt/{identifier}`, and optionally `Summarization/Data/ContentSizeLimit`. | JavaScript calls to `/_api/summarization/data/v1.0/`; request payload contains `InstructionIdentifier`; Web API settings for summarized tables, such as `Webapi/incident/enabled`, `Webapi/incident/fields`, `Webapi/adx_portalcomment/enabled`, `Webapi/adx_portalcomment/fields`; sample markers like `.Summarizationcontainer`, `summary_final`, `shimmer`. | High |
| Omnichannel handoff from site agent | The AI agent can transfer the user to a live support agent. | Site setting `SiteCopilot/EnableOmniChannelWidget = true`. | Header web template contains Omnichannel live widget script, often inserted with a Liquid `substitution` tag. Treat this as an AI-agent adjunct rather than a standalone generative AI feature. | High |

## SPA-facing AI APIs

Microsoft Learn currently documents two Power Pages end-user AI APIs that are directly callable from custom pages, React components, SPA web files, Liquid-rendered pages, or other front-end code running inside the Power Pages site session.

Treat these as first-class scanner targets for SPA Power Pages sites.

| API | Method and route | Required/important request markers | Required configuration markers | Response markers | Scanner notes |
|---|---|---|---|---|---|
| Search Summary API | `POST /_api/search/v1.0/summary` | Form-urlencoded request containing `userQuery`; usually called with `shell.ajaxSafePost` or a CSRF-safe wrapper. | Site search must be configured; generative search enabled by maker/admin policy; `Search/IndexQueryName` controls the Dataverse view used for table search scope; snippets `Search/Summary/Title` and `Search/Results/Title` customize labels. | `Summary`, `Citations` | Use this marker for custom SPA search experiences that do not use the built-in search control. Flag missing error/loading/refusal states and duplicate calls. |
| Data Summarization API | `POST /_api/summarization/data/v1.0/{tablesetname}` with OData read query, for example record id, `$select`, and `$expand`. | JSON body with optional `InstructionIdentifier`; optional `RecommendationConfig`; `Content-Type: application/json`; CSRF token through `shell.ajaxSafePost`, `shell.getTokenDeferred`, or equivalent wrapper. | `Summarization/Data/Enable = true`; one or more `Summarization/prompt/{identifier}` settings; optional `Summarization/Data/ContentSizeLimit`; table Web API settings such as `Webapi/<table>/enabled`, `Webapi/<table>/fields`, or `Webapi/<table>/UseFieldsFromView`. | `Summary`, `Recommendations[].Text`, `Recommendations[].Config` | Use this marker for record-detail, timeline, case, application, claim, permit, profile, or dashboard summaries. Flag broad Web API fields, unsupported tables, missing prompts, missing table permissions, and unsafe rendering of summary output. |

Scanner regex hints:

```text
/_api/search/v1\.0/summary
userQuery
/_api/summarization/data/v1\.0/
InstructionIdentifier
RecommendationConfig
Summarization/Data/Enable
Summarization/prompt/
Summarization/Data/ContentSizeLimit
shell\.ajaxSafePost
shell\.getTokenDeferred
__RequestVerificationToken
```

Do not classify ordinary Power Pages Web API calls under `/_api/<table>` as AI unless they are tied to one of the documented AI endpoints or AI feature settings above.

## Positive-signal review logic

When a marker shows an AI feature is already present, do not automatically raise a finding. First evaluate whether the implementation is complete and safe.

Raise a finding only when one of these is true:

1. The feature is enabled but key prerequisites appear missing.
2. The feature appears only partially wired.
3. The feature relies on overly broad table permissions, broad Web API fields, or anonymous access to sensitive data.
4. The feature uses fragile custom JavaScript where a documented platform API or setting exists.
5. The feature creates measurable performance cost in HAR or obvious duplicated/heavy code.
6. The feature UI is likely inaccessible.

Examples:

```jsonc
{
  "label": "Data summarization API is enabled with broad Web API field access",
  "desc": "The site enables Summarization/Data/Enable and calls /_api/summarization/data/v1.0/, but the summarized incident table exposes Webapi/incident/fields as '*'. This can unintentionally include future sensitive columns in AI-generated summaries.",
  "fix": "Limit Webapi/incident/fields to the exact columns needed for the summary prompt and verify table permissions for each web role before enabling the summary experience.",
  "category": "Security",
  "impact": "high",
  "rule": "ai-modernization/data-summarization-api"
}
```

```jsonc
{
  "label": "Site agent is embedded but not using the native Power Pages control",
  "desc": "The header contains Power Virtual Agents embed customization, but the site setting SiteCopilot/EnableNativeControlPVABots is not enabled. The site may miss the current native Power Pages agent experience.",
  "fix": "Review the agent configuration and enable the native Power Pages agent control when compatible with the site's agent design.",
  "category": "Architecture",
  "impact": "medium",
  "rule": "ai-modernization/site-agent-native-control"
}
```

## Missing-opportunity review logic

Raise an AI modernization opportunity only when the site contains strong evidence that an end-user AI feature would fit the existing experience.

Do not recommend every AI feature for every site. Ground the recommendation in the site's actual pages, forms, lists, data model, or code.

| Site signal | Consider recommending | Evidence to cite in finding |
|---|---|---|
| Content-heavy public or authenticated pages, FAQ pages, documentation pages, knowledge-base pages, support pages | Site agent or generative search | Page copy, web page names, content snippets, search page, `Search/IndexQueryName`, repeated informational content |
| Search page exists but no generative summary endpoint or snippets | Generative AI site search | Search page/template and absence of `/_api/search/v1.0/summary` or `Search/Summary/Title` |
| Record detail page has long timelines, notes, comments, case history, or related records | Data summarization API | Web templates/page copy rendering long text, FetchXML over timeline/comment tables, Web API calls, repeated detail sections |
| Basic create form asks users to transcribe document data | AI form fill assistance | Basic form create mode, file/document-related fields, page copy asking for uploaded documents, form field names matching invoices, applications, claims, requests, onboarding, permits, or cases |
| Modern list displays many records or has dashboard/reporting language | Modern List AI Insights | List component, list page copy, chart/report words, large data table UX |
| Modern list has search enabled or users need to find records by business intent | Modern List natural-language search | List search configuration, search placeholder/copy, filtered list views |
| Site has a site agent and support/escalation pages | Omnichannel handoff | Bot consumer marker plus support/contact/escalation page copy |

Use conservative language for opportunity findings:

- Prefer: "This site appears to be a good candidate for..."
- Avoid: "This site must enable..."
- Avoid claiming a feature is available unless the required platform feature and prerequisites match the scanned implementation.

## Feature-specific checks

### Site agent / site copilot

1. Look for Bot Consumer records in both enhanced and standard data model exports.
2. If present, identify where the agent is surfaced: header, footer, page template, web template, or custom page copy.
3. Check whether styling customizations are maintainable and accessible.
4. Check whether the site contains authenticated content. If yes, warn when the agent may answer from content that needs clear role-aware grounding and access control.
5. If the site is content-heavy and has no agent, consider an Architecture opportunity finding.

Finding anchors:

- Component anchor: Bot Consumer / Site Component record
- Code anchor: header/footer web template line containing the widget or customization class
- Visual anchor: chat launcher selector when known

### AI form fill assistance

1. Locate basic forms.
2. Determine whether each form creates records.
3. Look for `Forms/{FormId}/EnableGenAIFormsAssistant`.
4. If the setting is present, verify the form is the supported form type and has appropriate user-facing instructions.
5. If the setting is absent, recommend it only for forms where users likely copy data from documents or images.
6. Do not recommend for multistep forms unless Microsoft documentation explicitly supports that scenario.

Finding anchors:

- Component anchor: basic form name
- Code anchor: page copy introducing the form
- Setting anchor: `Forms/{FormId}/EnableGenAIFormsAssistant`

### Modern List AI Insights

1. Locate modern list components.
2. Inspect list metadata, Liquid objects, and generated page/list JSON for AI insight flags.
3. Look for labels or properties corresponding to `AI Insights`, `Keep insights expanded`, `Title`, `Additional Instructions`, and `Chart Type`.
4. If present, verify the list's table permissions and column exposure are appropriate for AI summaries and charts.
5. If absent, recommend only for lists where summarization or charting would reduce user effort.

Because public docs do not currently expose stable downloaded schema field names for these toggles, mark findings as medium confidence unless the exact exported field is visible in the user's package.

### Modern List natural-language search

1. Locate modern list components with search enabled.
2. Inspect list metadata for natural-language search flags.
3. If enabled, verify page copy explains what users can search for and whether the list data is safe to query.
4. If missing, recommend only where the list has many records or the page copy suggests users search by business intent.

Because public docs do not currently expose stable downloaded schema field names for this toggle, mark findings as medium confidence unless the exact exported field is visible in the user's package.

### Generative AI site search

1. Locate search pages, search templates, and search content snippets.
2. Look for `/_api/search/v1.0/summary` in JavaScript, Liquid, page copy, or web files.
3. Look for request payload fields such as `userQuery`.
4. Look for content snippets `Search/Summary/Title` and `Search/Results/Title`.
5. Look for site setting `Search/IndexQueryName`.
6. If search exists but generative search is absent, consider an Architecture opportunity finding.
7. If generative search exists, verify it is not making duplicate summary calls, exposing sensitive query content in logs, or rendering unsanitized AI output.

Finding anchors:

- Code anchor: endpoint call line
- Component anchor: search page/template/snippet
- Setting anchor: `Search/IndexQueryName`

### Data summarization API

1. Look for `Summarization/Data/Enable`.
2. Enumerate all `Summarization/prompt/{identifier}` site settings.
3. Look for `Summarization/Data/ContentSizeLimit`.
4. Search front-end code for `/_api/summarization/data/v1.0/`.
5. Search request bodies for `InstructionIdentifier`; map each identifier back to a prompt setting.
6. Identify tables used by the summary request and inspect corresponding Web API settings.
7. Flag `Webapi/<table>/fields = *`.
8. Flag broad table permissions on summarized data.
9. Check whether the page handles loading, empty, error, and refusal states.
10. Use HAR, when present, to identify slow summarization calls or duplicate calls.

Finding anchors:

- Code anchor: summary endpoint call
- Setting anchor: `Summarization/prompt/{identifier}`
- Component anchor: page or web template rendering the summary
- HAR anchor: summarization request when present

### Omnichannel handoff

1. Look for `SiteCopilot/EnableOmniChannelWidget`.
2. Inspect the header web template for Omnichannel widget scripts.
3. Verify the handoff is only recommended when a site agent exists or a support journey clearly benefits from live escalation.
4. Treat Omnichannel as an AI-agent support feature, not a standalone AI feature.

Finding anchors:

- Setting anchor: `SiteCopilot/EnableOmniChannelWidget`
- Code anchor: Omnichannel widget script in header
- Component anchor: site agent / Bot Consumer record

## AI modernization finding severity

Use these severity defaults, then adjust based on actual business impact.

| Condition | Impact |
|---|---|
| AI feature may expose sensitive data because of broad table permissions, anonymous access, or wildcard Web API fields | high |
| AI feature is enabled but cannot reliably work because prerequisites are missing | high or medium |
| Strong AI opportunity on a high-value journey, such as support case summary or document-heavy form fill | medium |
| Feature is present but maintainability/accessibility/performance needs improvement | medium or low |
| Feature would be nice to have but the page does not show strong evidence of user value | Do not raise |

## Output expectations

When AI modernization findings are found, include them in the normal OverPage `[SolutionName].findings.json`.

Each AI modernization finding must include:

- `rule` using the `ai-modernization/` prefix
- Existing OverPage `category`
- Existing OverPage `impact`
- `desc` explaining the marker or missing opportunity
- `fix` with a concrete modernization action
- `source` when the source URL is present in the canonical OverPage source list
- `code`, `anchor`, or component context whenever possible

Also add a short AI modernization paragraph to the site or solution summary when the site has meaningful AI signals or opportunities:

```text
AI modernization: The site already uses the Data Summarization API on the case detail page, but the Web API field projection is broad. The strongest next opportunity is enabling AI form fill assistance on the document-heavy application form.
```

## Hard rules

- Do not treat maker-only Copilot authoring features as deployed end-user AI features unless they leave a scannable runtime marker in the downloaded site.
- Do not recommend AI only because the site is a Power Pages site. Require a concrete user journey signal.
- Do not cite URLs that are not allowed by the base OverPage source rules.
- Do not claim exact Modern List AI export field names unless they are visible in the scanned package or documented by Microsoft.
- Do not paste sensitive site data, prompts, user records, or personal information into chat.
- Keep all artifacts local.
