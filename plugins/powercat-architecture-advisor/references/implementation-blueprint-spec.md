# Implementation blueprint specification

Generate this artifact when the user selects **Implementation blueprint** or asks for an implementation specification, technical design, build specification, or delivery handoff.

## Entry gate

Generate the blueprint only after the recommended architecture and assumptions have been accepted. If a missing answer could change the primary product, data layer, identity model, regional compliance posture, or platform fitness, label the blueprint **Draft — blocked decisions remain** and place those decisions first.

## Purpose

Create a build-ready handoff for makers, professional developers, partners, platform administrators, testers, and operational owners. It must turn the accepted architecture into implementable work while tracing each component and acceptance criterion back to a requirement.

## Formats

Offer PDF or self-contained HTML. If the user does not specify, generate PDF. Follow `references/product-icon-spec.md` and place official Microsoft product icons beside product labels in HTML and PDF.

Use `<scenario-slug>-implementation-blueprint.pdf` or `<scenario-slug>-implementation-blueprint.html`.

## Required sections

1. **Implementation decision at a glance**
   - Accepted architecture
   - Architecture confidence
   - Confirmed regions and material assumptions
   - Delivery phases
2. **Requirement traceability summary**
   - Map every available `BR`, `FR`, `DATA`, `INT`, `SEC`, and `NFR` requirement to one or more implementation items
   - If no requirements brief exists, derive IDs using `references/requirements-brief-spec.md` and mark their source
3. **Solution topology**
   - Environments and region
   - Solutions, publishers, connection references, environment variables, and ownership
   - Component-flow diagram with official product icons
4. **Product component specifications**
   - App, page, agent, flow, report, connector, and service responsibilities
   - User group and phase for each component
5. **Data design**
   - Tables, purpose, ownership, key columns, relationships, alternate keys, retention, audit, and migration approach
   - Do not fabricate a complete physical schema where discovery supports only a conceptual model
6. **Experience and process design**
   - Primary journeys, screens or stages, validations, status transitions, notifications, error states, accessibility, and offline behavior where applicable
7. **Integration design**
   - Source and target, direction, trigger, frequency, connector or API pattern, identity, data contract, retry, idempotency, monitoring, and failure handling
8. **Security and compliance design**
   - Identity, roles, least privilege, row-level access, sharing, DLP, secrets, encryption, audit, retention, regional controls, and specialist validations
9. **ALM and environment design**
   - Dev/Test/Prod topology, source control, pipelines, configuration, deployment order, rollback, and release approvals
10. **Observability and support**
    - Telemetry, flow and integration monitoring, alerting, ownership, support model, runbooks, continuity, and recovery
11. **Testing and acceptance**
    - Unit or component, integration, security, performance, accessibility, migration, UAT, and operational-readiness tests
12. **Phased implementation backlog**
13. **Risks, decisions, and dependencies**
14. **Definition of done and handover checklist**
15. **Recommended learning and build resources**
   - Follow `references/curated-resource-recommendations.md`
   - Tie every suggested lab, skill, or resource to an implementation item, delivery phase, or risk
16. **Sources consulted**

## Implementation item IDs

Assign stable IDs:

- `CMP-###` — product component
- `DAT-###` — table or data work item
- `FLOW-###` — automation
- `API-###` — integration
- `SECCTRL-###` — security control
- `ALM-###` — lifecycle item
- `TEST-###` — test or acceptance item
- `OPS-###` — operational item

Every item contains:

| Field | Content |
|---|---|
| ID | Stable implementation ID |
| Requirement IDs | One or more traced requirement IDs |
| Specification | What must be configured or built |
| Acceptance criteria | Observable completion evidence |
| Owner | Role, not an invented person |
| Phase | 0–30 / 31–60 / 61–90 / Later |
| Dependencies | IDs or external decisions |
| Status | Ready / Assumed / Blocked |

## Quality rules

- No implementation component exists without a traced requirement, control, or explicit architecture decision.
- No mandatory requirement is left without an implementation item or explicit deferral.
- Distinguish product facts grounded in Microsoft Learn from scenario-specific design decisions.
- Keep preview features and regional availability visibly conditional and source-backed.
- Include concrete failure handling, rollback, support ownership, and acceptance criteria; do not describe only the happy path.
- Target 15–30 pages for an ordinary implementation blueprint. Put exhaustive field mappings or test cases in appendices only when evidence supports them.
- This is an implementation starting point, not a substitute for detailed product configuration validation, threat modeling, legal review, or sprint refinement.