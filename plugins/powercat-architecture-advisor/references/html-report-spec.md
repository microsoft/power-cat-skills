# HTML Report Specification — Power CAT Architecture Advisor

This file is the authoritative source for the HTML report generated in Step 5b.
Read this file in full before writing the HTML output. Do not rely on the inline copy in SKILL.md.

---

## Overall structure

The Architecture Delivery Pack has:

- A **header bar** (Fluent blue `#0078d4`) showing the scenario name and generation date
- **6 tabs:** Decision · Requirements · Architecture · Implementation · Roadmap · Appendices
- A **sticky footer** with an "Email this report" button and a "Print / Save as PDF" button
- A **Mermaid diagram** rendered inline on the Architecture tab (use the CDN script tag: `<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>` — the only permitted external resource)

---

## Styling

Use this CSS baseline (same palette as the Power CAT eval dashboard):

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Segoe UI", sans-serif; background: #f3f2f1; color: #323130; }
header { background: #0078d4; color: white; padding: 16px 24px; }
header h1 { font-size: 1.3rem; font-weight: 600; }
header .sub { font-size: .85rem; opacity: .85; }
.tabs { display: flex; background: white; border-bottom: 2px solid #edebe9; padding: 0 24px; }
.tab { padding: 12px 20px; cursor: pointer; font-weight: 500; color: #605e5c;
       border-bottom: 3px solid transparent; margin-bottom: -2px; }
.tab.active { color: #0078d4; border-bottom-color: #0078d4; }
.pane { display: none; padding: 24px; max-width: 960px; margin: 0 auto; }
.pane.active { display: block; }
.card { background: white; border-radius: 6px; padding: 20px 24px;
        box-shadow: 0 1px 4px rgba(0,0,0,.1); margin-bottom: 20px; }
.card h2 { font-size: 1rem; font-weight: 600; margin-bottom: 12px; color: #0078d4; }
.card h3 { font-size: .9rem; font-weight: 600; margin: 14px 0 6px; }
table { width: 100%; border-collapse: collapse; font-size: .85rem; }
th { background: #0078d4; color: white; padding: 8px 12px; text-align: left; }
td { padding: 8px 12px; border-top: 1px solid #edebe9; vertical-align: top; }
tr:hover td { background: #f3f9ff; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 3px;
         font-size: .75rem; font-weight: 600; }
.badge-critical { background: #fde7e9; color: #a4262c; }
.badge-high     { background: #fff4ce; color: #7a5f00; }
.badge-medium   { background: #dff6dd; color: #107c10; }
.badge-low      { background: #edebe9; color: #605e5c; }
.risk-h { color: #a4262c; font-weight: 700; }
.risk-m { color: #7a5f00; font-weight: 700; }
.risk-l { color: #107c10; font-weight: 700; }
.phase { border-left: 4px solid #0078d4; padding-left: 16px; margin-bottom: 20px; }
.phase.p2 { border-color: #8764b8; }
.phase.p3 { border-color: #107c10; }
.phase h3 { color: #0078d4; }
.phase.p2 h3 { color: #8764b8; }
.phase.p3 h3 { color: #107c10; }
footer { position: sticky; bottom: 0; background: white;
         border-top: 1px solid #edebe9; padding: 12px 24px;
         display: flex; gap: 12px; align-items: center; }
.btn { padding: 8px 18px; border-radius: 4px; border: none; cursor: pointer;
       font-size: .85rem; font-weight: 600; }
.btn-primary { background: #0078d4; color: white; }
.btn-primary:hover { background: #106ebe; }
.btn-secondary { background: white; color: #0078d4;
                 border: 1px solid #0078d4; }
.btn-secondary:hover { background: #f3f9ff; }
.mermaid { background: white; border-radius: 6px; padding: 20px;
           box-shadow: 0 1px 4px rgba(0,0,0,.1); margin-bottom: 20px;
           overflow-x: auto; }
.term-ref { font-size: 60%; line-height: 0; vertical-align: super; }
.product-list { display: grid; gap: 10px; }
.product-item { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 12px;
                align-items: center; padding: 10px 0; border-top: 1px solid #edebe9; }
.product-item:first-child { border-top: 0; }
.product-icon { width: 32px; height: 32px; object-fit: contain; }
.product-name { font-weight: 600; }
.product-purpose { color: #605e5c; margin-top: 2px; }
```

Read `references/product-icon-spec.md`. Embed each bundled official SVG unchanged as a Base64 data URI in an `<img class="product-icon">`. Always provide the product name beside it and useful `alt` text. Never use emoji, recolored SVG, remote hotlinks, or icon-only labels.

---

## Tab 1 — Decision

Contains in order:

1. **Scenario summary card** — 3–5 sentences: the problem, users, key decisions made
2. **Architecture diagram card** — render the Mermaid diagram here using `<pre class="mermaid">…</pre>`
3. **Component summary card** — an icon-led vertical `.product-list`, one item per recommended Microsoft product, with the official icon, product name, plain-language purpose, and phase
4. **Security baseline card** — bullet list of access controls, DLP, data sensitivity notes
5. **Confirm before build card** — no more than five material assumptions, decisions, risks, licensing checks, or regional validations

## Tab 2 — Requirements

Follow `references/requirements-brief-spec.md`. Use anchored requirement IDs and compact, filterable requirement tables. Keep scope, users, journeys, assumptions, and decisions outside the requirement table so they remain readable.

---

## Tab 3 — Architecture

Contains the architecture diagram, recommended component specifications, conceptual shared data model, security and compliance baseline, option fit evidence/watch-outs, and architecture decisions. Use the official product icons in component lists and diagrams.

---

## Tab 4 — Implementation

Follow `references/implementation-blueprint-spec.md`. Group implementation items by product or delivery concern and show requirement traceability. Put **Draft — blocked decisions remain** at the top when architecture-changing decisions remain unresolved.

---

## Tab 5 — Roadmap

Three phase cards (use `.phase`, `.phase.p2`, `.phase.p3` classes):

- **Phase 1 (Days 0–30) — Foundation**: table of tasks with Who and Notes columns
- **Phase 2 (Days 31–60) — Build + Automate**: table of tasks
- **Phase 3 (Days 61–90) — Harden + Scale**: table of tasks

Below the phases, add a **Quick Wins** card with the three items that deliver the most immediate value, followed by the prioritized backlog, handover checklist, and **Recommended learning and build resources**. Follow `references/curated-resource-recommendations.md`; show each selected resource's type, scenario-specific rationale, and roadmap timing.

---

## Tab 6 — Appendices

Contains the risk register, decision log, complete assumption register, requirement-to-implementation traceability matrix, compact glossary, and sources actually consulted.

Use a filterable traceability table. Include a small `<input>` search box above the table that filters rows by text. Columns:
`Requirement | Implementation items | Acceptance evidence | Status`

Filter JavaScript (inline):

```js
document.getElementById('trace-search').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#trace-table tbody tr').forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});
```

---

## Email button behaviour

The footer "Email this report" button uses a `mailto:` link that:

- Pre-fills **Subject**: `Power Platform Architecture Report — [Scenario Name]`
- Pre-fills **Body**: a 5–8 line plain-text summary of the recommendation (scenario, pattern chosen, top 3 components, top 2 risks, link to open the HTML file if saved locally)
- The button text: `📧 Email this report`

Generate the mailto body dynamically in JavaScript on page load so it reflects the actual scenario content.

---

## Print button behaviour

The footer "Print / Save as PDF" button calls `window.print()`. Add a `@media print` CSS block that:

- Shows all tabs/panes (not just the active one)
- Removes the sticky footer
- Removes the tab bar
- Adds page-break hints between sections

---

## JavaScript tab switching

```js
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.pane).classList.add('active');
  });
});
```

---

## After writing the HTML file

Return the HTML as a downloadable temporary attachment. Do not claim it was written to the user's Desktop, repository, SharePoint, or other durable storage. Tell the user to download it if they need to retain it.
