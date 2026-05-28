---
name: powercat-pp-architecture-advisor
description: >
  Use this skill to generate a comprehensive Power Platform architecture recommendation
  from categorized discovery answers. It mirrors a Power CAT Solution Architect process:
  discovery completion, pattern fit analysis, architecture blueprint, security/governance
  controls, implementation roadmap, and risk register. Triggers: "design architecture for
  my Power Platform scenario", "recommend Power Platform pattern", "Power CAT style
  architecture review", "solution blueprint for this use case".
user-invocable: true
argument-hint: "Scenario summary, constraints, and questionnaire answers (if available)."
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
model: sonnet
---

# Power CAT Power Platform Architecture Advisor

## Purpose

Produce an SA-grade architecture recommendation for a Power Platform scenario using
structured discovery, explicit tradeoffs, and deployable implementation guidance.

## Inputs

- Scenario narrative from user.
- Any existing architecture notes or constraints.
- Discovery responses from `references/architecture-questionnaire.md`.

If discovery responses are incomplete, ask only the unanswered [Required] questions first.
Then ask optional questions only if they materially change architecture decisions.

## Output Files

Create these files under `outputs/<scenario-slug>/`.

1. `architecture-recommendation.md`
2. `implementation-roadmap.md`
3. `solution-backlog.csv`
4. `decision-log.md`

## Workflow

### Step 1 - Discovery completeness check

1. Load the questionnaire and map each response by category.
2. Mark each [Required] item as answered, missing, or assumed.
3. If any [Required] item is missing:
   - Ask concise follow-up questions.
   - Stop architecture finalization until all [Required] items are resolved.

### Step 2 - Scenario classification

Classify the scenario into one primary and up to two secondary patterns.

- Internal productivity app
- Frontline or field operations app
- External self-service portal
- Process automation and integration hub
- Reporting and decision intelligence hub
- Regulated workload with strict compliance controls

### Step 3 - Recommendation generation

Generate a recommendation that includes all sections below.

1. Executive summary (business outcomes and scope)
2. Recommended architecture pattern and why
3. Architecture diagram in Mermaid
4. Component mapping:
   - Power Apps type (Canvas, Model-driven, or both)
   - Dataverse data model approach
   - Power Automate usage (cloud flows, approvals, orchestration)
   - Integration connectors and API strategy
   - Reporting strategy (Power BI and self-service boundaries)
5. Security and compliance baseline:
   - Identity and access model
   - Environment strategy and DLP boundaries
   - Secret management and encryption posture
   - Audit and monitoring controls
6. ALM and operations:
   - Environment topology (Dev, Test, Prod)
   - Solution lifecycle, deployment toolchain, rollback strategy
   - Ownership and RACI fit
7. Performance and scale considerations:
   - Data volume, growth, throttling, and offline behavior
8. Risks and mitigations
9. 30/60/90 day implementation roadmap
10. Prioritized backlog with effort, value, owner, dependencies

### Step 4 - SA quality bar validation

Validate before finalizing:

- Every recommendation traces to at least one discovery answer.
- No major category is omitted (UX, Data, Security, ALM, Ownership).
- Tradeoffs are explicit when multiple options exist.
- Risks include preventive and contingency actions.
- Backlog includes quick wins and foundation items.

### Step 5 - Write outputs

Write all four output files. Use practical language suitable for business and technical audiences.

## Required format details

### architecture-recommendation.md

Use this structure:

1. Scenario overview
2. Discovery completeness matrix
3. Recommended architecture pattern
4. Mermaid architecture diagram
5. Component-by-component design
6. Security and compliance controls
7. Data and integration strategy
8. ALM and operational model
9. Risk register
10. Assumptions and open decisions

### implementation-roadmap.md

Use three phases:

- Phase 1 (0-30 days): foundation
- Phase 2 (31-60 days): build and integrate
- Phase 3 (61-90 days): harden and scale

### solution-backlog.csv

Use these columns:

`Priority,Workstream,BacklogItem,BusinessValue,Effort,Owner,Dependency,DefinitionOfDone`

### decision-log.md

Each decision entry:

- Decision ID
- Decision statement
- Alternatives considered
- Rationale
- Impacts
- Review date

## Guardrails

- Do not fabricate compliance certifications.
- Flag unknowns clearly as assumptions.
- Do not prescribe premium licensing decisions without noting licensing impact.
- If sensitive data is involved, enforce least privilege and explicit DLP segmentation.
