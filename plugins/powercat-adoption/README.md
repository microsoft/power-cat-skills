# Power CAT Adoption Plugin

This plugin provides open‑source skills based on years of Power CAT experience working with large and complex enterprise customers on Microsoft Power Platform. The skills help Microsoft field teams, partners, and customer success professionals turn raw customer stories into polished, on-brand presentation assets — without design tools or build steps.

> **Preview:** This plugin is currently in [preview](https://www.microsoft.com/en-us/business-applications/legal/supp-powerplatform-preview/). These features are available before official release for customers to provide feedback.

## Prerequisites

- [power-platform-skills](https://github.com/microsoft/power-platform-skills)

## Installation

### From the marketplace

```bash
/plugin marketplace add microsoft/power-cat-skills
/plugin install powercat-adoption@power-cat-skills
```

### From a local clone

```bash
claude --plugin-dir /path/to/power-cat-skills/plugins/powercat-adoption
```

## Skills

### `/powercat-storytelling` — Storytelling Slide Generator

> Courtesy of [Sameer Bhangar](https://github.com/sameerbhangar)

**Generate a polished 5-slide HTML customer story deck — brand-matched, self-contained, and presentation-ready.**

Drop in a customer name (and optionally a story source — public case study, internal note, or your own draft) and this skill produces a single self-contained HTML deck following a proven storytelling arc:

> **Title → Challenge → Build → Shift & Outcome → What's Next**

**What it does for you:**
- 🎨 **Real brand matching** — pulls the customer's logo from their site, extracts colors directly from the SVG/site, and themes the entire deck (typography, accents, gradients) to match.
- 🏷️ **Product-branded tech tags** — Microsoft product chips use actual product brand colors (Copilot gradient, Azure blue, Teams purple, D365 navy, Power BI yellow, Epic red, etc.) so the architecture slide reads like a real Microsoft pitch deck.
- 📐 **Polished interactions** — full-viewport scroll-snap slides, IntersectionObserver reveals, progress bar, nav dots, and keyboard nav (↑ ↓ Space PgUp PgDn).
- 🔒 **NDA-aware** — if the source is internal, automatically adds an "Internal · NDA" badge and omits public links.
- 📦 **Self-contained `.html`** — one file, no build step, opens in any browser, easy to share or screenshot.

**Usage:** Invoke directly with `/powercat-storytelling`, or use any of the phrases below to trigger the skill automatically:

- `Create a customer story deck`
- `Make slides for [customer]`
- `Turn this case study into a presentation`
- `Build an HTML pitch deck for [customer]`

**Inputs it'll ask for:**
1. Customer name
2. Branding source (their website / a logo URL)
3. Story content (a draft, a case study link, internal notes, or just *"use what you know"*)

**Output:** A `Scratchpad\[Customer]\` folder containing:
- `[Customer]_Customer_Story.html` — the deck
- The customer's logo (svg/png)

**Best for:** Storytellers who need a sharable, on-brand customer narrative in minutes — not days.

## Security

MCP is a new and developing standard. As with all new technology standards, you should review the security of any systems that integrate with MCP servers, such as MCP hosts, clients, agents, AI applications, and models and confirm that they comply with system requirements, standards, and expectations. You should follow Microsoft security guidance for MCP servers, including enabling Entra ID authentication, secure token management, and network isolation. Refer to Microsoft Security Documentation for details.

## Support

If you face issues with:

- **Using the Power CAT Plugin:** Report your issue here: [https://github.com/microsoft/power-cat-skills/issues](https://github.com/microsoft/power-cat-skills/issues). (Microsoft Support won't help you with issues related to this Plugin, but they will help with related, underlying platform and feature issues.)
- **The core features in Microsoft Power Platform:** Use your standard channel to contact Microsoft Support.

## License
See the [LICENSE](../../LICENSE) file for license information.