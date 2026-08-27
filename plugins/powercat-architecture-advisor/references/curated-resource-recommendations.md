# Curated resource recommendation specification

Use this specification when the advisor recommends learning material, build accelerators, or broader Power Platform guidance.

## Curated repositories

Consult these maintained Microsoft repositories when their content is relevant to the accepted architecture:

| Repository | Use it for | Canonical URL |
|---|---|---|
| Intelligent Apps & Agents Workshop | Hands-on labs, sample solutions, and workshop material that help the team learn or validate a recommended feature | https://github.com/microsoft/apps-agents-workshop |
| Power CAT Skills | Power CAT-developed plugins and skills that can accelerate building, migration, governance, review, or validation work | https://github.com/microsoft/power-cat-skills |
| Microsoft Power Platform Resources | Curated learning, adoption, architecture, administration, governance, development, AI, ALM, and community guidance | https://github.com/microsoft/power-platform-resources |

## Selection rules

1. Start from the accepted architecture, implementation backlog, team experience, and delivery risks. Recommend a resource only when it supports a specific capability, implementation item, or risk.
2. Prefer the current repository catalog over model memory. When repository retrieval is available, inspect the current README, catalog, or relevant folder before naming a lab, skill, or resource.
3. Link to the deepest verified page available, such as a specific lab or plugin. If only the repository landing page was verified, link to that page and describe what the user should look for rather than inventing a deeper URL.
4. Keep the list short and prioritized. Usually recommend three to six items across all repositories, not three to six from each one. It is valid to omit a repository when it has no material match.
5. For every item include:
   - **Resource** — exact verified title and link
   - **Why it fits** — the discovery fact, recommended component, implementation item, or risk it supports
   - **Use it when** — the roadmap phase or decision point
   - **Type** — Learn, Build, Review, or Reference
6. Treat repository content as optional enablement, not product documentation or proof that a capability is supported. Microsoft Learn remains authoritative for current product capability, availability, licensing, connector, preview, and regional claims.
7. Do not imply that a sample, lab, or skill is production-ready without the testing, security review, licensing validation, and operational ownership required by the recommendation.

## Placement

- In the initial chat recommendation, always add **Power CAT Recommended Resources** with one or two highly relevant resources. Include only the verified linked title and a short scenario-specific reason. This is a recommendation, not a catalog: do not list every repository or include full timing and implementation detail.
- If the user asks for more labs, skills, or build resources, expand to three to six items across the repositories and include Type, Why it fits, and Use it when. Do not repeat initial items unless additional timing or usage guidance adds value.
- In the Architecture Delivery Pack, add **Recommended learning and build resources** to the roadmap. Group selected items by Learn, Build, Review, or Reference and preserve their rationale and timing.
- In **Sources consulted**, include only repository pages actually inspected. A recommended link that was not retrieved must not be represented as a consulted source.