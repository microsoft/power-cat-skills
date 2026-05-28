# Power CAT Architecture Advisor Plugin

Power CAT style architecture recommendation plugin for Power Platform scenarios.

## Skill

### /powercat-pp-architecture-advisor

Transforms categorized discovery answers into a comprehensive architecture recommendation similar to an in-person Power CAT Solution Architect review.

What it produces:

- Architecture recommendation with rationale and diagram
- Security and governance baseline
- Data and integration design
- ALM and operational model
- 30/60/90 day implementation roadmap
- Prioritized implementation backlog
- Decision log and risk register

## Discovery Input Model

The plugin includes a reusable questionnaire at:

- references/architecture-questionnaire.md

The skill enforces completion of all [Required] questions before finalizing recommendations.

## Local Test

```bash
claude --plugin-dir /path/to/powercat-architecture-advisor
```

Then prompt:

- "Design a Power Platform architecture for this scenario"
- "Run a Power CAT style architecture assessment"
- "Recommend the best pattern using my questionnaire answers"

## Public Repo Readiness

- No internal endpoints
- No customer data included
- No credentials or secrets
- MIT metadata aligned for marketplace contribution
