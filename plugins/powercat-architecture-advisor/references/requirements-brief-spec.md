# Requirements brief specification

Generate this artifact when the user selects **Requirements brief** or asks for requirements, a requirements document, a discovery brief, or something to circulate for review and sign-off.

## Purpose

Create a concise, portable source of truth from confirmed discovery. Within the Architecture Delivery Pack, this part must be understandable to business owners, architects, makers, delivery partners, security reviewers, and approvers without requiring them to read the implementation and assurance sections.

Do not invent missing requirements. Record unresolved architecture-changing details under **Decisions needed** and accepted defaults under **Assumptions to validate**.

## Formats

Offer PDF or self-contained HTML. If the user does not specify, generate PDF. Use official Microsoft product icons only when products are named in an indicative architecture section; follow `references/product-icon-spec.md`.

Use `<scenario-slug>-requirements-brief.pdf` or `<scenario-slug>-requirements-brief.html`.

## Required sections

1. **Document control**
   - Scenario title
   - Status: Draft / Ready for review / Confirmed
   - Generated date
   - Confirmed deployment, user, and data-residency regions
   - Named business owner when supplied
2. **Problem and intended outcomes**
   - Current problem
   - Target outcome
   - Three to five measurable success indicators where confirmed
3. **Scope**
   - In scope
   - Out of scope
   - Later-phase opportunities
4. **Users and journeys**
   - User groups and access model
   - Three to seven key journeys or jobs to be done
5. **Functional requirements**
6. **Data requirements**
7. **Integration requirements**
8. **Security, privacy, compliance, and regional requirements**
9. **Non-functional requirements**
   - Scale and performance
   - Availability and continuity
   - Accessibility
   - Support and maintainability
   - Audit and retention
10. **Constraints and dependencies**
11. **Assumptions to validate**
12. **Decisions needed**
13. **Acceptance and sign-off checklist**
14. **Traceability index**

## Requirement IDs

Assign stable IDs:

- `BR-###` — business requirement or outcome
- `FR-###` — functional requirement
- `DATA-###` — data requirement
- `INT-###` — integration requirement
- `SEC-###` — security, privacy, or compliance requirement
- `NFR-###` — non-functional requirement

Each requirement contains:

| Field | Content |
|---|---|
| ID | Stable requirement ID |
| Requirement | One testable statement using `must` for mandatory requirements |
| Rationale | Why it matters in the user's language |
| Priority | Must / Should / Could |
| Source | Confirmed answer, uploaded document, or assumption label |
| Acceptance evidence | Observable proof that the requirement is met |
| Status | Confirmed / Assumed / Decision needed |

Do not use `must` for an inferred preference. Keep mandatory legal or regulatory statements conditional until jurisdiction and applicability are confirmed.

## Quality rules

- Every requirement traces to confirmed discovery, an uploaded source, or a visibly labelled assumption.
- Requirements describe needs and outcomes, not premature product implementation, except where the user explicitly mandates a product or platform constraint.
- Avoid duplicate requirements and vague words such as `fast`, `easy`, `secure`, or `user-friendly` without measurable acceptance evidence.
- Keep the main brief concise. Target 8–15 pages for an ordinary scenario.
- Use tables selectively and ensure they remain readable on mobile and printed pages.
- State that this is an architecture discovery artifact for stakeholder validation, not legal advice or a substitute for detailed regulatory review.

## Resume behavior

The HTML version must be self-contained and suitable for upload in a later advisor session. Add this instruction near the beginning:

`Review or amend this brief, then upload it to the Power CAT Architecture Advisor to refine the architecture or generate an implementation blueprint.`