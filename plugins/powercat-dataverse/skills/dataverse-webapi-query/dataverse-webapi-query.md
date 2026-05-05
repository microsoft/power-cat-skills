---
name: "dataverse-webapi-query"
description: "Generate, translate, optimize, explain, and help test Microsoft Dataverse Web API (OData v4) queries — including walking the user through acquiring a bearer token (az cli, device code, Postman, browser) and running the request themselves. Use this skill whenever the user asks to build a Dataverse query, convert FetchXML to Web API, get data out of Dataverse, query Dynamics 365/CRM/Power Platform tables, troubleshoot a 401/403/404/400 from the Web API, test a query against a live environment, or "
---

Dataverse Web API Query Builder
Produce correct, runnable Microsoft Dataverse Web API queries. The Web API uses OData v4 with Dataverse-specific conventions, and most query failures come from a small set of recurring mistakes (wrong name casing, wrong lookup annotation, wrong navigation property, unsupported operations). This skill exists to avoid them.
When this skill runs
Use it for any of:

Natural language → Web API: "get the top 10 active accounts in Sydney with their primary contact"
FetchXML → Web API: convert a FetchXML query (often pulled from Advanced Find or a Power Automate flow) into the equivalent Web API URL
Power Apps targets: translate a Web API query into the right shape for a **Generative Page** (single-file React 17 + TS using `props.dataApi`), a **Power Apps Code App** (full-stack React using auto-generated `*Service` classes from `@microsoft/power-apps`), or an `Xrm.WebApi` snippet for a model-driven form / ribbon. See references/power-apps-contexts.md.
Optimize / explain an existing query: improve a query the user already has, or explain why it's failing
Diagnose errors: 400/404 responses, "Could not find a property named...", "Resource not found for the segment..."
Test a query live: walk the user through getting a bearer token and running the request themselves. The skill never handles or stores the token — see Step 6.

Core workflow
Follow these steps in order. Don't skip schema resolution — guessing names is the single most common reason Web API queries fail.
Step 1: Understand what's being asked
Identify three things from the input:

Primary table (e.g., account, contact, custom new_project)
Operation: retrieve multiple, retrieve single by ID, count, aggregate, related records
Constraints: which columns, filters, sort, expand, paging

If the user gave FetchXML, parse it: <entity name="..."> is the primary table, <attribute name="..."> are columns for $select, <filter> becomes $filter, <link-entity> becomes $expand, <order> becomes $orderby.
Step 2: Resolve schema (do not skip)
The user's column/table names are often display names ("Account Name", "Primary Contact") — the Web API needs logical names in lowercase (name, primarycontactid). Resolve names in this order:

Dataverse MCP server (preferred). Check available tools first. If a Dataverse MCP server is connected (look for tools like dataverse-*, power-platform-*, or dynamics-* that expose entity metadata, EntityDefinitions, or table-listing capabilities), use it to:

Confirm the entity logical name and entity set name (plural — e.g., accounts, contacts, new_projects)
Get attribute logical names and their types (lookup, choice, datetime, etc.)
Get relationship/navigation property names for $expand


Ask for the org URL and use the EntityDefinitions endpoint. If no MCP is connected, ask: "What's your Dataverse environment URL? (e.g., https://contoso.crm.dynamics.com)" Then construct EntityDefinitions calls the user can run themselves to confirm names. See references/metadata-discovery.md for the exact URLs.
Ask the user directly. As a last resort, ask the user to confirm the logical name and entity set name. Tell them where to find it: in make.powerapps.com → Tables → the table → "Properties" panel shows both names.

Never invent a logical name. If you're not sure whether it's account.name or account.accountname, say so and resolve it before building the query.
Step 3: Build the query
Use the patterns in references/webapi-syntax.md for the canonical OData operators and Dataverse-specific behavior. Key reminders:

Entity set name is plural and lowercase: /api/data/v9.2/accounts, not /Account or /accounts(...)/Account
Web API version: default to v9.2 unless the user specifies otherwise
Lookup columns have two forms when reading:

_primarycontactid_value returns the GUID (with optional formatted-value annotation)
primarycontactid is the navigation property used inside $expand, not $select


Choice (OptionSet) columns: $select returns the integer; use the Prefer: odata.include-annotations="OData.Community.Display.V1.FormattedValue" header (or "*") to also get the label
GUIDs in filters: no quotes — $filter=_primarycontactid_value eq 00000000-0000-0000-0000-000000000000
Strings in filters: single quotes, escape internal quotes by doubling — name eq 'O''Brien'
Dates: ISO 8601, no quotes — createdon ge 2025-01-01T00:00:00Z
No GroupBy / no aggregation in pure OData: for SUM/AVG/COUNT-by-group, fall back to FetchXML passed via the ?fetchXml= parameter on the entity set. See references/aggregation.md.

Step 3.5: Identify the target hosting context

Before writing code, decide where the query is going to run — the answer changes everything except the OData filter string. If the user mentions Power Apps, a generative page, a `.tsx` file, a Code App, `Xrm.WebApi`, a canvas app, or Power Automate, **read references/power-apps-contexts.md** and follow the matching pattern instead of producing raw HTTP. Quick map:

- Model-driven generative page (single-file React 17 + TS, Fluent UI v9, uploaded with `pac model genpage`) → use `props.dataApi.queryTable("<logical>", { select, filter, orderBy, pageSize })`. Logical names are singular lowercase. Lookup display names come from the `@OData.Community.Display.V1.FormattedValue` annotation on the `_<lookup>_value` column — never select the `…name` annotation column directly.
- Power Apps Code App (full-stack React/Vue SPA using `@microsoft/power-apps`) → call the auto-generated `<Pluralized>Service.getAll({ select, filter, orderBy, top })`. Resolve lookups via individual `Service.get()` calls, not `$expand`. Writes use `@odata.bind`.
- Model-driven form / ribbon / web-resource JavaScript → `Xrm.WebApi.retrieveMultipleRecords("<logical>", "?$select=…&$filter=…", maxPageSize)`. No token needed.
- Canvas app or Power Automate → don't translate to OData URLs; use Power Fx `Filter()` or the Dataverse connector "List rows" action with the same `$filter`/`$select`/`$orderby` strings dropped into the connector fields.
- Anything else (curl, Postman, .NET, Node fetch) → default to the raw Web API URL + bearer token described in the rest of this skill.

In every code-bearing case, the **logical names, `_lookup_value` filter columns, formatted-value annotations, and `@odata.bind` write syntax are identical to the Web API**. Only the calling object changes — so build the OData query first, then drop it into the host pattern.

Step 4: Pick the output format based on context
Match the format to what the user actually needs:
Signal from the userOutputQuick lookup, "what's the URL for…", chattyOne-line URL only"Help me build a query", learning, exploringURL + brief explanation + the headers they'll need"I need to call this from Power Automate / JS / C#"URL + a working snippet in the right tool (HTTP action / fetch / HttpClient)Debugging an errorShow their query, the corrected query, and a one-line diagnosis of what was wrongFetchXML conversionSide-by-side: their FetchXML and the Web API URL, so they can verify the mapping
When in doubt, give the URL plus a 2-3 line explanation of the non-obvious parts (which annotation header to send, why a particular $expand looks the way it does). Don't dump every possible snippet language; pick one.
Step 5: Note the headers when they matter
The Web API request usually needs these headers — call them out when relevant:
Accept: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
Prefer: odata.include-annotations="*"            # if formatted values / lookup labels matter
Prefer: odata.maxpagesize=500                    # for paging on large results
If-None-Match: null                              # for retrieves to bypass etag caching when needed
Mention these when the user is calling the API directly (curl, Postman, fetch, HttpClient). Skip them for casual "what's the URL" answers.
Step 6: Help the user test it (without touching their token)
When the user wants to run the query against a live environment — or asks how to get a bearer token, or hits a 401 — read references/authentication.md and walk them through the appropriate path. The skill does not accept, store, transmit, or ask for the bearer token itself. The user runs the request on their own machine.
The right path depends on context:

Has Azure CLI, dev environment → az account get-access-token one-liner (fastest)
Wants a UI for repeated testing → Postman with the public PowerApps client ID for device code flow
Already signed into make.powerapps.com in a browser → DevTools console fetch (no token needed, uses session cookie)
Building this into a Power Automate flow → use the Dataverse connector's "List rows" action, no token needed at all
Production app integration → MSAL with their own app registration

If the user reports a 401, the answer is almost always "your token expired (~60 min lifetime), re-acquire it." If 403, it's a security role issue, not a query issue. See references/authentication.md for full flows including PATCH/POST/DELETE patterns when the user wants to write data.
What this skill will and won't do with credentials:

✅ Explain how to acquire a token via several flows
✅ Provide ready-to-run curl, Invoke-RestMethod, fetch, or Postman setup for the user to execute
✅ Help interpret the response or error the user gets back
❌ Ask the user to paste a token into chat
❌ Store a token in memory, a file, or a tool call
❌ Make API calls to the user's tenant on their behalf using their credentials

Reference files
Read these as needed — don't pre-load them.

references/webapi-syntax.md — Full OData operator reference ($select, $filter, $expand, $orderby, $top, $count, paging cookies, lambda operators any/all)
references/metadata-discovery.md — EntityDefinitions and RelationshipDefinitions endpoints for resolving names without an MCP server
references/fetchxml-mapping.md — Element-by-element FetchXML → Web API translation table, including the cases that don't translate cleanly (aggregation, multi-level joins) and how to handle them
references/common-errors.md — The recurring errors (400/404 messages) and what they actually mean
references/aggregation.md — FetchXML fallback pattern for SUM/AVG/COUNT/GroupBy operations
references/authentication.md — How to walk the user through acquiring a bearer token and testing the query themselves (az cli, Postman, browser, Power Automate, MSAL); plus the write-operation reference for POST/PATCH/DELETE
references/examples.md — Worked examples covering each input type
references/power-apps-contexts.md — How to translate a Web API query into the right shape for a Power Apps Generative Page (`props.dataApi`), a Power Apps Code App (generated `*Service`), `Xrm.WebApi`, or a canvas/Power Automate connector. Read this whenever the user mentions Power Apps, a `.tsx` file, generative pages, code apps, model-driven forms, ribbon JS, canvas apps, or Power Automate.

Behavioral guardrails

Never invent logical names. If the schema isn't resolved, say so and resolve it.
Never claim a query "should work" without acknowledging the assumptions. State the assumed logical names so the user can verify.
Don't dump documentation. The user wants a query, not a tutorial. Add explanation only where it prevents a foreseeable error.
When converting FetchXML, flag what doesn't translate. Aggregations, more than one level of nested link-entity, and certain late-bound link types need explicit workarounds — call them out, don't silently drop them.
Casing matters. Logical names are lowercase; entity set names are lowercase plural. Don't camelCase or PascalCase anything in the URL.
Never accept, request, or store bearer tokens. If the user pastes one, don't echo it back, don't save it, and gently redirect them: explain that they should run the request themselves using the auth flow in references/authentication.md. If a token has clearly already been pasted into chat, recommend they revoke/rotate it (in Entra ID → sign-ins, or just wait for the ~60 min expiry).
