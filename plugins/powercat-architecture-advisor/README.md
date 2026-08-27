# Power CAT Architecture Advisor Plugin

This plugin brings a **Power CAT Solution Architect review** into your chat window. It runs a guided, plain-English discovery conversation about the solution you want to build on Microsoft Power Platform, then produces a comprehensive, deployable architecture recommendation — the same kind of blueprint you'd get from an in-person engagement.

It is designed for makers, IT pros, and architects who want an opinionated, best-practice design *before* they start building — including the honest answer of "Power Platform is the wrong tool for this" when that is the case.

> **Preview:** This plugin is currently in [preview](https://www.microsoft.com/en-us/business-applications/legal/supp-powerplatform-preview/). These features are available before official release for customers to provide feedback.

## What it does

The advisor emulates a real architecture review in five stages:

1. **Platform fitness check** — Before designing anything, it validates whether Power Platform is even the right tool. For mission-critical scenarios it is not suited for (e.g. 999/911 dispatch, core banking, SCADA control), it says so directly and points you to the right technology instead of designing something that will fail.
2. **Guided discovery** — Walks through up to four adaptive sections (Goals & People, Experience & Process, Data & Connections, Security & Delivery), one section at a time with three scenario-specific questions that can be answered in one paragraph. It skips answered facts and sections that don't apply.
3. **Scenario classification** — Matches your scenario to known industry patterns (healthcare, manufacturing, education, non-profit, field service, and more) and proactively surfaces standard Dataverse tables, compliance flags, and integration patterns. Novel scenarios are learned and logged for future runs.
4. **Recommendation generation** — Produces a full architecture blueprint (see below).
5. **SA quality-bar validation** — Checks that every recommendation traces back to a discovery answer, no major category is missing, tradeoffs are explicit, and risks have both preventive and contingency actions.

## What it produces

- Executive summary and recommended architecture pattern with rationale
- **Mermaid architecture diagram** rendered directly in chat
- Component mapping (Power Apps type, Dataverse model, Power Automate, connectors, Power BI)
- Security and governance baseline (identity, DLP, environment strategy, audit)
- Data and integration design, including native-connector recognition (e.g. "Xero has a native connector")
- ALM and operational model (Dev/Test/Prod topology, deployment toolchain, rollback)
- 30/60/90-day implementation roadmap with quick wins
- Prioritized implementation backlog (effort, value, owner, dependencies)
- Scenario-matched labs, Power CAT build and review skills, and curated Power Platform resources
- Decision log and risk register
- **Architecture Delivery Pack** as a PDF or self-contained interactive HTML report

## Skill

### `/powercat-pp-architecture-advisor`

Transforms categorized discovery answers into a comprehensive architecture recommendation, similar to an in-person Power CAT Solution Architect review.

**Usage:** Invoke directly with `/powercat-pp-architecture-advisor`, or trigger it automatically with phrases like:

- `Design a Power Platform architecture for this scenario`
- `Run a Power CAT style architecture assessment`
- `Recommend the best Power Platform pattern for my use case`
- `Give me a solution blueprint for this use case`

If you invoke it without a scenario, it presents five ready-made example scenarios (healthcare referrals, offline field inspections, a parent portal, a charity volunteer rota, and a deliberately-unsuitable 999 dispatch system) so you can try it in seconds.

The skill infers requirements from the scenario, conversation, and uploaded requirements documents. It uses up to four adaptive sections with three scenario-specific questions per applicable section. Each set can be answered in one paragraph. After discovery, the advisor presents labelled assumptions that the user can accept or overwrite.

**Output model:**

- **Chat** — a concise, table-free architecture recommendation with one or two **Power CAT Recommended Resources**, followed by optional focused outputs for compliance and assurance, implementation, learning and certifications, more labs and build resources, or the complete Delivery Pack.
- **Architecture Delivery Pack** — one PDF or interactive HTML artifact containing the decision brief, requirements, architecture, implementation blueprint, roadmap, traceability, and assurance appendices.
- **Discovery handoff** — when users need colleague input, a draft EML and resubmittable HTML document containing questions, answers, and assumptions. The advisor does not send email directly.

## Installation

### From the marketplace

```bash
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-architecture-advisor@power-cat-skills
```

### From a local clone

```bash
claude --plugin-dir /path/to/power-cat-skills/plugins/powercat-architecture-advisor
```

Then prompt with any of the trigger phrases above.

## Discovery input model

The plugin includes an internal question bank and supporting output specifications:

- `references/architecture-questionnaire.md` — companion reference with optional questions
- `references/report-output-spec.md` — authoritative Architecture Delivery Pack structure
- `references/requirements-brief-spec.md` — requirements and acceptance traceability contract
- `references/implementation-blueprint-spec.md` — build-ready implementation contract
- `references/curated-resource-recommendations.md` — relevance and verification rules for recommended labs, skills, and Power Platform resources
- `references/discovery-handoff-spec.md` — safe EML and resubmittable HTML handoff contract
- `references/product-icon-spec.md` — official Microsoft product icon usage

The active discovery flow is inline in the skill (Steps 1b–1e). Users do not complete the full question bank; the LLM selects three unresolved architecture-changing questions per applicable section and skips facts already supplied.

## Estimated credit / token consumption

This skill is **conversational and multi-turn** — you'll answer several rounds of questions before it generates output — so its cost is higher than a single-shot prompt. Actual usage depends on scenario complexity, how many discovery sections apply, how detailed your answers are, whether a diagram is generated, and whether you export the HTML report. The ranges below are **estimates** to help you plan, not guarantees.

| Run type | What's involved | Approx. tokens (total conversation) | Approx. premium requests / credits |
|----------|-----------------|-------------------------------------|------------------------------------|
| **Quick run** | Simple scenario, 2–3 applicable sections, concise answers, chat summary only | ~40K – 90K | ~4 – 8 |
| **Typical run** | 3–4 sections, assumption review, concise summary | ~90K – 180K | ~8 – 14 |
| **Delivery pack run** | Up to 4 sections plus generated PDF or interactive HTML Delivery Pack | ~180K – 320K | ~12 – 20 |

**Notes on the estimates:**

- **Premium requests / credits** are counted per user-initiated turn by the host (e.g. GitHub Copilot), and may be multiplied by the model you select. Because discovery is interactive, each section you answer is typically one request. Faster, less detailed answers reduce the count.
- **Tokens** cover the whole conversation: the skill instructions loaded into context, your answers, and the generated output. Exporting the HTML report adds one more read of `references/html-report-spec.md` (~a few thousand tokens) plus the generated HTML.
- **To spend less:** decline the Delivery Pack and let the skill skip sections already answered by the scenario or an uploaded requirements document.
- Costs scale with the model's context window and pricing — a higher-capability model produces richer output but consumes more.

## Local test

```bash
claude --plugin-dir /path/to/powercat-architecture-advisor
```

Then prompt:

- "Design a Power Platform architecture for this scenario"
- "Run a Power CAT style architecture assessment"
- "Recommend the best pattern using my questionnaire answers"

## Copilot Studio

To deploy this skill with an agent powered by the GitHub Copilot harness, use the package builder and configuration guide in [copilot-studio/](copilot-studio/README.md). The generated upload ZIP is written to the ignored `build/copilot-studio/` directory.

## Agent compatibility

- **Scout and Claude-compatible plugin hosts:** use the authoritative plugin folder and `SKILL.md`. The architecture process works unchanged; generated files are written only to a user-confirmed location outside the repository.
- **Copilot Studio GitHub Copilot harness:** use the generated ZIP and agent instructions under `copilot-studio/`. The builder removes unsupported frontmatter and injects sandbox-specific attachment rules.
- **Other agents that understand Markdown skills:** the conversational process and fit model work when the host can load the skill and bundled references. File upload, PDF, interactive HTML, EML, and official-icon rendering depend on host tools.
- **Chat-only hosts:** receive the concise summary and can request a structured Markdown fallback. They cannot provide true downloadable or interactive artifacts without file tools.

The skill must detect host capabilities rather than claim that an upload, button, attachment, PDF renderer, or email draft is available everywhere.

## Public repo readiness

- No internal endpoints
- No customer data included
- No credentials or secrets
- MIT metadata aligned for marketplace contribution

## Support

If you face issues with:

- **Using the Power CAT Plugin:** Report your issue here: [https://github.com/microsoft/power-cat-skills/issues](https://github.com/microsoft/power-cat-skills/issues). (Microsoft Support won't help you with issues related to this Plugin, but they will help with related, underlying platform and feature issues.)
- **The core features in Microsoft Power Platform:** Use your standard channel to contact Microsoft Support.

## License

See the [LICENSE](../../LICENSE) file for license information.
