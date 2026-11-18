/app Build me "Power Platform 360": one admin portal for my whole Power Platform tenant, running on live data. Use the App Builder skill and the Power Platform admin connectors. I've attached screenshots taken from the original app (sample "Contoso" data). Match their layout, density, colours and components as closely as you can. Build every page, panel and action described below in one go; don't stop after the first page.

# 1. Data connections (bind all of these)

| Connector | Used for |
|---|---|
| Power Platform for Admins V2 (shared_powerplatformadminv2) | Environments, tenant-wide inventory queries, Advisor recommendations and Ask Advisor chat, environment groups, rule-based policies, capacity, Copilot credits, agent quarantine/reassign/delete, flow run history |
| Power Apps for Admins (shared_powerappsforadmins) | App quarantine, reassign owner, delete, sharing list |
| Power Automate for Admins (shared_microsoftflowforadmins) | Flow turn on/off, add co-owner, delete, permissions |
| Office 365 Users (shared_office365users) | Resolve owner/maker IDs to name, department, email and account-enabled state; people picker; signed-in user's profile |
| Office 365 Outlook (shared_office365) | Send branded emails to makers (SendEmailV2) |

Ask me to approve each connection. Verify one live read per connector before saying data works. Don't use sample data unless a connection is genuinely unavailable.

# 2. Look and feel (see the screenshots)

- **Header:** a dark slate top bar (slate-900), with an emerald shield logo tile and the name "Power Platform 360". Horizontal nav links with icons; the active link has a white/15 pill. Nav order: Command center (/), Search, Ownerless, Governance, AI governance, Environments, Env groups, Insights.
- **Theme:** green primary (oklch 0.45 0.12 150) and radius 0.5rem. Page background is muted/30, cards are white with rounded-xl/2xl borders.
- **KPI tiles:** a coloured left accent bar, an uppercase label, a big number and a small note. They're clickable when they drill.
- **Charts:**
  - Donuts have the total in the centre and a legend that shows count and %.
  - Horizontal bar lists have a label, a sub-label, a bar and a value.
  - Stacked year/month column charts have an optional cumulative line and a collapsible "Data table".
- **Badges:** status and impact badges use tones success / warning / danger / info / neutral (emerald, amber, red, blue, muted).
- **Panels:** right-side slide-out sheets for details, max-w-2xl to 5xl.
- **Toasts:** use toasts for results. Every destructive action needs a confirmation dialog.
- **Accessibility:** every chart has a text equivalent (legend list or data table). All clickable elements are real buttons with aria-labels.

# 3. Pages

## 3.1 Command center ("/"): "What needs your attention today?" (screenshots 01, 22a)

- **Header:** the date and title, with Refresh and "Ask Advisor" buttons.
- **8 KPI tiles:**
  - Tenant health: count of high-impact recommendations
  - Active makers: distinct lastModifiedBy over the last 30 days
  - In use: apps, flows and agents used in 30 days
  - Failed automations: failing plus suspended flows
  - Security risks
  - Licences expiring in 90 days or suspended
  - Capacity status
  - Pending actions: open Advisor recommendations
- **"Today's priorities" list,** sorted High then Medium. Each row has an icon, title, detail, impact badge and an action (Fix / Review / View). It merges:
  - Advisor recommendations
  - suspended flows
  - agents shared with the entire organization
  - quarantined apps and agents
  - licences in warning or suspended
  - temporary licences expiring soon
  - capacity entries whose status isn't Available
- **Adoption cards:** Apps, Flows and Agents, each showing the total, new in 30 days and used in 30 days.
- **Capacity utilization bars:** Dataverse database, file and log.
- **Security risks list, Licences table and Pending admin actions list.**
- **Drill-downs:** every row opens a drill-down sheet. The sheet has an item list, a filter on all columns, per-item actions, "Email makers" and "Export CSV".

## 3.2 Search ("/search"): universal search and inventory (screenshots 02, 03)

- **What it searches:** apps, flows, agents, environments, connectors and people. Search by name, GUID, owner email, environment name, or `connector:<name>`.
- **Scope chips:** Everything, Apps, Flows, Agents, Environments, Connectors, People.
- **Results list:** icon, name, and a sub-line (kind · environment · N connectors · used <date>). Paged, with "Email makers" and "Export page (CSV)".
- **Item detail sheet:**
  - Actions:
    - Apps and agents: Quarantine / Release
    - Flows: Turn off / on
    - Reassign owner, or Add co-owner for flows
    - Delete, behind a typed confirmation
    - Email owner
    - Export JSON
  - Sections:
    - **Overview**
    - **Ownership:** names resolved, plus "Everything this owner has"
    - **Usage**
    - **Activity**
    - **Dependencies:** trigger, connector names with Standard/Premium tier, and agent topics, knowledge, tools, flows and channels
    - **Sharing:** the role-assignment list for apps and flows; viewer and editor counts for agents
    - **Licensing:** premium/standard classification
- **Usage section (reused everywhere):**
  - Usage health label: Active (≤30 days), Cooling off (31–90), Dormant (90+) or No usage recorded, with the last used date and "N days ago".
  - Metric tiles: Days idle, Age, Created → last use, and Reach (shared count).
  - A lifecycle timeline dot track: Created, Modified, Published, Last used, Today.
  - Agents: published date and channels.
  - **Flows: 28-day run history** from ListFlowRuns(environmentId, properties.workflowEntityId):
    - tiles for runs, success rate, failed and average duration
    - a daily stacked success/failure column strip
    - the last 8 runs table

## 3.3 Ownerless ("/ownerless"): apps, flows and agents whose owner left (screenshots 11, 22b)

- **How to find them:** take the owner of each item as ownerId, falling back to createdBy (model-driven apps have no ownerId). Group by owner, then look each one up in Office 365 Users:
  - 404 / not found → **deleted**
  - accountEnabled = false → **disabled**
  - IDs starting 00000000-0000-0000-0000- are system accounts → excluded
  - any other error → inconclusive, excluded and counted in a footnote
- **KPIs, all clickable filters:** Ownerless items, Apps, Flows, Agents, Still in use (used ≤30 days), Flows still on, and Departed owners (deleted vs disabled).
- **Risk:**
  - High: used ≤30 days, an activated flow, or shared with the whole org
  - Medium: used ≤90 days, or a published agent
  - Low: everything else
- **Charts, all clickable filters:** Risk donut, Kind donut, Usage recency donut, By former owner bars, By environment bars, By kind bars.
- **Table:** checkbox selection; name, kind, environment, former owner (label + GUID), risk + reason, last used, created, status. Expanding a row shows the Usage section and item actions.
- **Bulk actions:**
  - **Reassign:** apps → Set_AdminAppOwner; agents → reassign; cloud flows → add co-owner
  - **Quarantine:** apps and agents
  - **"Email about these"**
  - **CSV**
  - Each row shows its per-item result inline.

## 3.4 Governance ("/governance"): one policy centre (screenshots 04, 05)

- **Scope picker:** Tenant / Environment group / Environment / Security group, with the matching selector.
- **Tab "Policies in effect":** cards for Connector restrictions, Environment creation, App & agent creation, Sharing limits, External access, AI features and Data residency.
  - Each card lists the rules that apply to the chosen scope, with a "via" line (Tenant / Environment group X / Environment Y) and an "applied <time>" stamp.
  - Show real connector display names everywhere (from the inventory connector catalogue), never internal IDs. Connector rules read "Allows N of <catalogue size> connectors; M blocked", with a collapsible list of names.
  - Every rule has **View & edit**, which opens a right-hand editor:
    - ConnectorManagement → an allow-list editor with a search box and checkboxes
    - CopilotChannelPublishSettings → switches
    - Agent authentication → select
    - Privacy URL, CustomAdminMessages, MakerOnboardingContent → forms
    - CostControlsDrawFromTenantCreditPool → switch
    - EnvironmentRouting → ordered rules (security groups → environment group)
  - **Before saving, "Check impact"** runs the what-if for the change and lists the affected apps, flows, agents and owners.
  - Save with GetRuleBasedPolicyByID, then PatchRuleBasedPolicy (send ALL rule sets, with only the edited one changed).
  - Sharing limits use the environment-group rule set (GetRuleSet / UpdateRuleSet, or CreateRuleSet if none): agent viewers (no limit / people only / no sharing + max), agent editors, Managed apps max / no groups / no guests / no viral.
- **Tab "What-if simulator":** a "Run on" picker (tenant, environment group or environment) with these scenarios:
  - block a connector
  - connector allow-list (ACP)
  - require Entra sign-in for agents
  - turn off web search
  - block a publishing channel
  - turn off tenant sharing
  - restrict region
  - Results (ImpactResults): Resources affected / Users affected / Environments tiles, owner breakdown, a filterable item list with reasons, "Email makers" and "Export CSV". Then "Enforce", behind a confirmation.
- **Policy-model details to handle correctly:**
  - assignment resourceType can be "Tenant"
  - "Synced Environment Policy (from Environment Group)" copies exist on environments. Show a synced copy only when the environment's current group has no policy of its own.

## 3.5 AI governance ("/ai") (screenshots 06–10)

Inventory types: copilotstudio/agents, powerautomate/agentflows, powerautomate/m365agentflows, powerapps/apps, powerapps/codeapps, joined to usage.

- **Experiences:**
  - Copilot Studio; Agent Builder (createdIn "Copilot Studio Lite", or harness "Copilot Chat"); GitHub Copilot agents (isCLIAgent / isGithubCopilotAgent / harness "GitHub Copilot")
  - Agent flows; Workflow agent flows
  - App Builder apps (subType appBuilderApp); Managed apps (microsoftApp); Vibe apps (codeapps powerAppsApp); Code apps (byocApp)
- **Overview:**
  - 7 KPIs: AI items, Agents (published), New in 30 days, Used in 30 days, Builders, Models in use, Copilot credits allocated of purchased
  - Charts: who builds with what (donut), Models in use, Deployment status, Knowledge sources by type, Publishing channels, AI capabilities switched on (generative orchestration, web search, memory, tools, agent flows, connectors, shared with everyone)
- **Builders:** a maker table with counts per experience, published agents and latest creation. Clicking a maker filters the catalog. "Email builders".
- **Agents & AI apps:** experience chips with counts and an all-column filter. Columns: name, experience, environment, owner, model + orchestration, connected data & actions (knowledge types, tools, flows, connector names), channels, status (Published / Not published / Quarantined / "Everyone"), last used. Expanding a row shows details and actions. Email makers and CSV.
- **Copilot credits:**
  - ListCurrencyReports cards: purchased, allocated and consumed, with an "as of" date
  - a per-environment allocation table from ListAllocationsByEnvironment (agents per environment, tenant pool yes/no)
  - inline edit → PatchCurrencyAllocationByEnvironment, behind a confirmation
- **Access & rollout:** EnvironmentRouting rules (security group → environment group) and environments with security groups. Each shows chips for the AI rules that apply, each clickable to edit, plus "Agent sharing limits". Security groups are shown by ID: say so.

## 3.6 Environments ("/environments") (screenshots 12, 13)

- **Summary:** a % managed ring and an environment-mix stacked bar by type.
- **Filters:** search, type chips, and Any / Managed / Unmanaged.
- **Cards:** coloured left border by type; name, type, region, Dataverse; Managed and state badges; an apps/flows/agents mini bar with counts.
- **Detail sheet:**
  - "Managed environment" switch → Enable/DisableManagedEnvironment, applied directly (ValidateOnly isn't supported). A 409 OperationNotStartable means another change is still running: show a friendly message.
  - Open Dataverse environment link
  - resource tiles (apps, flows, agents, used in 30 days)
  - details (type, state, region, created, version, ID)
  - the apps list
- **Advisor recommendations panel:** cards with impact. Clicking one opens a panel with the guide (why + to-do steps) and the affected resources table (filter, select). Actions: quarantine/release agents, add environments to a group, turn on managed, Email owners, and "Ask Advisor" prefilled.
- **Ask Advisor chat sheet** (screenshot 23):
  - SendAdvisorChatMessage with conversationId
  - render the markdown answers properly: headings, bold, lists, links and GitHub tables with right-aligned numbers
  - "Answered in Ns" and Copy
  - a thinking indicator that warns it can take up to 30 seconds

## 3.7 Env groups ("/groups") (screenshots 14, 15)

- **Group list:** each shows its environment count and rule count, plus "New group" (create, rename, describe; delete only when the group is empty).
- **Environments card:**
  - Add environments: only managed environments not in a group are eligible, with an inline "Turn on managed" button for the others.
  - Remove an environment from the group, with a confirmation.
- **Rules card:**
  - Sharing limits, summarised as chips, with View & edit.
  - Each rule from the group's assigned rule-based policy, with a plain-language summary, View & edit, and remove (RemoveRuleFromRuleBasedPolicy).
  - **"Add rule"** offers templates with defaults: agent publishing channels, agent authentication, privacy disclosure, tenant credit pool, custom admin message, maker welcome content, and a connector allow-list seeded with core M365 connectors.
  - If the group has no policy, CreateRuleBasedPolicy, then CreateEnviornmentGroupRuleBasedAssignment (note the API's spelling). After adding, open the rule editor.
- **Impact:** show the impact of a sharing-limit change on existing apps and agents in the group (for example, an app shared with more people than the new limit).

## 3.8 Insights ("/insights?tab=overview|apps|flows|agents|usage") (screenshots 16–21)

Exec-dashboard style.

- **Overview:**
  - KPIs: total, apps, flows, agents, environments, environment groups, makers, quarantined
  - Charts: resource composition, adoption over time (stacked by year plus a cumulative line), flow status, top makers, top environments, environments by type, resources by region
- **Apps:** app kind (canvas / model-driven / code / vibe / managed / App Builder), top makers, by environment, quarantine, usage recency, created over time.
- **Flows:** status, flow type, trigger type, top trigger connectors, makers, environment, usage, created over time by status.
- **Agents:** publishing, harness, created in, orchestration, authentication, tenant-wide sharing, model, makers, environment, usage, created over time.
- **Usage:** 4 bucket KPIs, apps/flows/agents usage donuts, last-used-by-month (12 months), most active environments, most active makers.
- **Dashboard / Grid switch** on Apps, Flows and Agents.
  - The grid is server-paged (50 rows), with kind/trigger/harness/created/usage chips, a column picker, "Export page (CSV)" and Email makers.
  - **Search runs across ALL columns server-side:** tostring(properties), name, environment name and type, location, type, owners matched via people search, and connectors matched via catalogue display names.
- **EVERY chart is clickable and drills deeper:**
  - Every slice, bar, legend row, KPI and data-table cell opens a drill sheet.
  - The drill sheet has a breadcrumb of removable filters (each filter is a query predicate) and a back arrow.
  - Its contents:
    - tiles for Items and Active rate, plus 4 usage buckets (clickable)
    - usage donut, last-used-by-month chart, by environment, by maker, by kind (all clickable to drill further)
    - an items table with server search, sort (most / least recently used, newest, name), "Load more" paging, CSV, Email makers, and expandable rows with the Usage section and actions
  - Use useQuery with an explicit page-token list, not useInfiniteQuery: the infinite version crashed in this runtime.

# 4. Email makers, everywhere

Next to EVERY "Export CSV" button, put an **"Email makers"** button with a badge for the number of makers. It opens a dialog with:

- **Makers list:** one row per maker resolved through Office 365 Users, showing name, email, department and item count, with checkboxes and Select / Clear all.
- **Unreachable makers note:** a note on items whose maker is deleted, disabled or has no mailbox.
- **"Also send the full list to"** a people picker (for example a manager, a new owner or the CoE).
- **Fields:** subject (default "Action needed: <context>"), message (context-specific default), and "Copy me on every email".
- **Sending:** each maker gets ONE email with only their items. Extra recipients get one summary email with all items. Show progress ("Sending 3 of 13…").

Every item also has an "Email owner" action with an editable subject and message.

**Branded HTML email (screenshot 24):** table layout with inline styles only, so it renders in Outlook.

- a dark-to-green gradient header with a "360" tile, "Power Platform 360" and an "Open portal" link
- a coloured tag pill (High impact / Action needed), an H1 title, "Hi <first name>," and the message
- a shaded "Why this matters" box
- item cards with a coloured left border by kind (app purple, flow blue, agent teal):
  - the name links to the item
  - the environment links to the PPAC environment page
  - meta: last used / note
  - button links: Open app / Edit / Details, Open flow, Open in Copilot Studio
  - show at most 40 cards, then "+N more"
- a numbered "What to do next", "Questions? Just reply", a signature with the signed-in admin's name, and a footer

**Deep links:**

| Item | Link(s) |
|---|---|
| Canvas app | play `https://apps.powerapps.com/play/e/{env}/a/{id}`, edit `https://make.powerapps.com/e/{env}/canvas/?action=edit&app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F{id}`, details `https://make.powerapps.com/environments/{env}/apps/{id}/details` |
| Code / Vibe app | `https://apps.powerapps.com/play/e/{env}/app/{id}` |
| Managed / App Builder app | `https://play.managedapps.cloud.microsoft/apps/{id}` |
| Model-driven app | the environment app list in Power Apps |
| Flow | `https://make.powerautomate.com/environments/{env}/flows/{id}/details` |
| Agent | `https://copilotstudio.microsoft.com/environments/{env}/bots/{id}/overview` |
| Environment | `https://admin.powerplatform.microsoft.com/manage/environments/environment/{env}/hub` |

# 5. Data layer: important facts (don't rediscover these)

- **Inventory API:** QueryResources (api-version **2024-10-01**), TableName "PowerPlatformResources".
  - Clauses: where / extend / project / summarize (count, argmax) / join / orderby / take / distinct / count. Options Top / SkipToken; page aggregates at Top 1000.
  - Values are KQL literals in single quotes. Operators `in~`, `contains`, `!startswith`, `!=` work. For multi-condition filters, extend a boolean expression and then `where x == true`.
  - Never name a column `kind`.
- **Resource types:**
  - Apps: powerapps/canvasapps, /modeldrivenapps, /codeapps (subType byocApp = Code, powerAppsApp = Vibe), /apps (microsoftApp = Managed, appBuilderApp = App Builder)
  - Flows: powerautomate/cloudflows, /agentflows, /m365agentflows
  - Agents: copilotstudio/agents
  - Other: powerplatform/environments (environmentType, isManaged, environmentGroupId), environmentgroups, powerplatformconnector/connectors (connectorId, displayName, tier: the connector catalogue), powerplatformusage/usagerecords (resourceId, lastUsed)
- **Usage join:** left-outer join on tolower(name) = tolower(properties.resourceId), with the right side summarised by `argmax(lastUsed) by joinKey` so rows never duplicate.
- **Environment join:** adds envName, envType and envManaged.
- **Usage buckets:** case(isnull(lastUsed) → "No usage recorded", ≥ago(30d) → "Used in last 30 days", ≥ago(90d) → "Used 31-90 days ago", else → "Not used in 90+ days").
- **Row keys:** solution-imported flows share an ID across environments, so row keys must include the environment ID.
- **Agent properties:** harness, createdIn, model, orchestration, authentication, channels[], isWebSearchEnabledForKnowledge, isMemoryEnabled, componentsCounts{knowledge, knowledgeByType, topics, tools}, flows[], sharedWithViewers{userCount, groupCount, entireTenant}, sharedWithEditors, lastPublishedAt, isQuarantined, powerPlatformConnectors[{connectorId, operations}].
- **Flow properties:** status, flowTriggerType, trigger{connectorDisplayName}, workflowEntityId.
- **API versions:**
  - most PPAdminV2 operations: 2022-03-01-preview
  - environment-group rule sets: 2021-10-01-preview
  - rule-based policies and assignments: 2024-10-01
  - Power Apps admin: 2016-11-01 (app quarantine 2021-02-01)
  - flows: 2016-11-01
- **Delete:** delete flows with Power Automate for Admins Remove_AdminFlow (PPAdminV2 DeleteFlow is DSR-only).
- **Not available, so say so in the UI rather than faking it:**
  - Advisor ExecuteRecommendationAction action names aren't published
  - GetTenantUsers is deprecated, so use "active makers"
  - DLP policies: use the ConnectorManagement allow-list instead
  - security-group names can't be resolved, so show IDs
  - tenant-wide AI feature toggles aren't in the API
  - Copilot credit consumption can lag

# 6. Quality bar

- Every grid and table is searchable across all of its columns.
- Every chart drills down.
- Every list has CSV export and Email makers.
- Every write action:
  - has a confirmation
  - shows a toast with a plain-language result
  - updates the row in place
- Connector errors show a friendly retry state, never raw JSON.
- Loading states use skeletons.
- Run the typecheck and lint until clean. Then publish the app and give me the link.
