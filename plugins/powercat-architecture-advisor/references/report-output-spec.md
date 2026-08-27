# Architecture Delivery Pack specification

Use this specification whenever the user selects an Architecture Delivery Pack.

## One artifact, layered for different readers

Generate one cohesive artifact rather than separate requirements, architecture, implementation, roadmap, and assurance downloads. The opening sections must stand alone for decision-makers; detailed delivery and assurance content follows for specialists.

Read `references/requirements-brief-spec.md`, `references/implementation-blueprint-spec.md`, and `references/curated-resource-recommendations.md` before generating the pack. Apply their ID, traceability, acceptance, resource-selection, and quality rules inside the corresponding sections.

## Required structure

### Part 1 — Decision brief

Target 3–5 pages in PDF and the default landing tab in HTML.

1. Decision at a glance — scenario, confirmed regional context, recommended architecture, and High / Medium / Low architecture confidence with material confirmations named
2. Recommended components — no more than six products, each with its official icon, product label, business purpose, and phase
3. Architecture flow — one readable diagram or compact component-flow representation
4. Why this fits — the three strongest discovery-based reasons
5. Confirm before build — no more than five material decisions, assumptions, risks, licensing checks, or regional validations
6. Next actions — the five actions required to start safely

### Part 2 — Requirements

Follow `references/requirements-brief-spec.md`. Include business outcomes, scope, users and journeys, stable requirement IDs, functional/data/integration/security/non-functional requirements, constraints, assumptions, decisions needed, acceptance evidence, and traceability.

### Part 3 — Architecture

1. Recommended solution mapped to business capabilities
2. Options considered with Strong fit / Good fit / Conditional fit / Doesn't fit, one discovery-based evidence statement, and one material watch-out per option; never show numeric scores
3. Architecture diagram
4. Component and shared conceptual data model
5. Security, compliance, governance, and ALM baseline

### Part 4 — Implementation blueprint

Follow `references/implementation-blueprint-spec.md`. Trace implementation item IDs and acceptance criteria to requirement IDs. If architecture-changing decisions remain, visibly label this part **Draft — blocked decisions remain** rather than inventing detail.

### Part 5 — Delivery roadmap

1. 30/60/90-day outcomes and quick wins
2. Prioritized phased backlog with dependencies and owners
3. Definition of done and handover checklist
4. Recommended learning and build resources selected from the three curated Microsoft repositories, with a scenario-specific reason and roadmap timing for each item

### Part 6 — Assurance appendices

1. Risk register with preventive and contingency actions
2. Decision log
3. Complete assumption register
4. Requirement-to-implementation traceability matrix
5. Compact glossary
6. Sources actually consulted

Keep detail proportionate to evidence. One artifact does not mean every section should be exhaustive. Avoid duplicated prose: use IDs and cross-references instead.

## Official product icons

Read `references/product-icon-spec.md` before generating HTML or PDF.

- Use the bundled official Microsoft SVG beside each recommended product in component lists and architecture diagrams.
- Keep the product name adjacent to its icon and include alternative text in HTML.
- Do not crop, recolor, rotate, distort, redraw, or substitute emoji for a product icon.
- Keep icons restrained: use them for recommended products, not for every heading, risk, task, or bullet.
- In Markdown and Copilot Studio chat, use bold product labels without an icon when the asset cannot be packaged reliably with the content.

## Microsoft Learn grounding

Use the configured Microsoft Learn website knowledge sources for current claims about Power Platform, Power Apps, Power Automate, Power Pages, and Microsoft Copilot Studio.

- Ground product capability, availability, preview status, connector support, licensing impact, and regional availability when those facts materially affect the recommendation.
- Prefer the Microsoft Learn knowledge sources over model memory for these claims.
- Do not invent a citation or URL. If retrieval does not provide a source, mark the claim **Confirm before implementation**.
- Add a **Sources consulted** section containing only sources actually used. Include page title and URL when the runtime provides them.
- Keep business reasoning and scenario-specific recommendations distinct from sourced product facts.
- State the deployment region, user regions, and data-residency regions separately. Do not infer any of them from language or time zone.
- Include region-specific legal or regulatory considerations only when the region and scope are confirmed; label them for specialist validation rather than as legal advice.

## Numbered terms and visual weight

Mark a technical term only on first use and keep markers sequential from `[1]`.

- **Chat and Markdown:** render the marker as inline HTML superscript, for example `Dataverse<sup>[1]</sup>`. This gives the marker lower visual weight in renderers that support inline HTML while remaining readable as source text.
- **HTML:** wrap markers in `<sup class="term-ref">[1]</sup>` and include `.term-ref { font-size: 60%; line-height: 0; vertical-align: super; }`.
- **PDF:** draw markers as superscript at exactly 60% of the surrounding text size. For 10-point body text, use a 6-point marker.
- The glossary number uses normal glossary text size so it remains accessible.

Do not reduce the technical term itself to 60%; reduce only its numbered marker. Making all referenced terms 60% would harm readability and incorrectly make product names look unimportant.

## Markdown

- Do not offer Markdown as a standard Delivery Pack format. Use PDF or Interactive HTML so official icons, navigation, and layered presentation remain intact.
- If the user explicitly requires Markdown for source control, create `<scenario-slug>-architecture-delivery-pack.md` as UTF-8 Markdown.
- Use headings, compact tables, bullets, and a fenced Mermaid block.
- Use `<sup>[n]</sup>` markers.
- Use bold product names without imitation icons.

## HTML

- Create `<scenario-slug>-architecture-delivery-pack.html` as a self-contained UTF-8 document.
- Follow `references/html-report-spec.md` for layout and print behavior.
- Embed bundled official product SVGs as Base64 data URIs so the report remains self-contained.
- Include the `.term-ref` style exactly as specified above.
- Ensure Print / Save as PDF presents every report section, not only the active tab.

## PDF

- Create `<scenario-slug>-architecture-delivery-pack.pdf` as a valid PDF document.
- Use a PDF library available in the Copilot Studio sandbox and inspect the resulting file before returning it.
- Use a readable page size, margins, repeated table headings, page numbers, and sensible page breaks.
- Render the architecture as a simple component-flow diagram when possible; otherwise include a readable component-flow table.
- Render bundled official product icons beside recommended product labels, preserving their aspect ratio and colors.
- Use 60% superscript markers and include the complete glossary.
- Never produce a screenshot-only PDF. Text must remain selectable when the library supports it.

## Delivery

Return exactly one selected Delivery Pack format as a downloadable attachment. Do not create both formats unless the user asks. The mid-discovery `.eml` and discovery-handoff HTML are separate because they support consultation before the final pack exists. Generated files are temporary; advise the user to download the attachment if they need to retain it.