# PowerCAT OverPage (viewer)

A 100% client-side JS app that loads a **Power Pages site export** (`.zip`) and renders a
**static mockup/preview** — page navigation, layout, branding and content. Styled to match the
Power CAT design system (light/dark, pink accent). Dynamic, server-rendered
parts (forms, lists, FetchXML, charts) are shown as labelled placeholders. Nothing is uploaded;
the zip is parsed entirely in the browser.

It also **overlays a review**: open a `*.findings.json` (produced by the **powercat-overpage** skill,
which authors findings with AI) and the viewer pins each issue on the page it affects. The app does
**not** generate findings itself — it only renders and overlays them.

## Run

```bash
npm install
npm run dev          # dev server
# or
npm run build && npm run preview
```

### Run locally with NO web server (single file)

```bash
npm run package      # builds a self-contained PowerCAT-OverPage.html (JS+CSS+logo inlined)
```

Then just **double-click `PowerCAT-OverPage.html`** — it opens over `file://` with no server,
no install, nothing to host. Use **Open .zip** to load a `pac powerpages download` export (zipped)
and **Open findings** to overlay a `.findings.json`. (The `?site=&findings=` deep-link autoload needs
`fetch`, so it only works when served; the double-click flow uses file pickers and works offline.)

Use **Open .zip** to load a `pac powerpages download` export (zipped), then **Open findings** to
overlay a `.findings.json`. You can also drag-drop either file anywhere, or deep-link with
`?site=<zip-url>&findings=<json-url>` (how the skill opens the viewer when served).

`npm run gen-sample` builds a demo site fixture (`fixtures/sample-site.zip` + a workspace-root
`ContosoCommunityPortal.zip`) used by the smoke test and as a demo input for the skill.

## Review & overlay

Findings are **AI-authored** by the `powercat-overpage` plugin (see `../powercat-overpage/`), which
reviews the export and writes a `*.findings.json` validated against
`powercat-overpage/skills/powercat-overpage/findings.schema.json`. This viewer consumes that file:
a **Solution overview** with KPI tiles, **impact dots** on the page tree, **pins** (selector anchors)
and **inline highlights** (match anchors) inside the live preview, and a filterable **Findings
drawer** — clicking a pin/highlight selects its finding and vice-versa. `src/findings.js` validates
the document against the schema on load (a copy of the schema is in `public/findings.schema.json`).

## What it understands

A `pac powerpages download` export laid out as YAML + content files:

| Folder | Component | Used for |
|--------|-----------|----------|
| `website.yml` | Website | Site name / domain |
| `web-pages/` | Web pages (+ `content-pages/*.copy.html`) | Page tree + content |
| `web-templates/` | Web templates (`*.source.html`) | Liquid layout / chrome |
| `page-templates/` | Page templates | Page → layout mapping |
| `content-snippets/` | Snippets | `{{ snippets[...] }}` |
| `site-settings/` | Site settings | `{{ settings[...] }}` |
| `weblink-sets/` | Navigation | header nav loop |
| `web-files/` | Web files | logo, hero, CSS (embedded as data URIs) |
| `basic-forms/`, `lists/`, `table-permissions/` | Dynamic | rendered as placeholders |

## The Liquid "stubber" (`src/liquid.js`)

It does **not** execute real Liquid. It resolves the static bits and stubs the rest:

- `{% include 'X' %}` → renders web template X (recursive)
- `{% for l in weblinks["Nav"].weblinks %}…{% endfor %}` → expands navigation
- `{{ snippets[...] }}`, `{{ settings[...] }}`, `{{ page.adx_copy }}` → resolved
- `{% entitylist %}`, `{% entityform %}`, `{% fetchxml %}`, `{% chart %}`, `{% powerbi %}` → placeholder box
- unknown tags/vars → stripped / empty

## Honest limitations

- Static mockup only — no live data, auth, table permissions or working forms.
- Heavy Liquid logic (conditionals, filters, custom objects) is stripped, not evaluated.
- A classic **Dataverse solution** zip (customizations.xml) is detected and politely rejected
  with guidance — export the site with the Power Pages CLI first.

## Layout

```
src/parser.js    zip -> in-memory site model (JSZip + js-yaml)
src/liquid.js    tiny forgiving Liquid stubber
src/findings.js  consumer-only: validate a findings doc against the schema + flatten for UI
src/renderer.js  model + page (+ findings) -> sandboxed iframe HTML with overlay pins/highlights
src/main.js      UI: Open .zip / Open findings, drag-drop, page tree + dots, device toggle, drawer, overview
public/findings.schema.json  copy of the findings JSON Schema (authored in the plugin)
scripts/generate-sample.js   builds the Contoso Community Portal demo fixture (with seeded issues)
scripts/smoke-test.js        node parse + render/overlay + findings-validation assertions

../powercat-overpage/         the AI-driven review plugin that PRODUCES the findings this app overlays
```

Findings are **AI-authored** by the `powercat-overpage` plugin — this app never generates them.
