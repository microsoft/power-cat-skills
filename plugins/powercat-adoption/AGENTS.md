# AGENTS.md — Adoption Plugin

This file provides guidance to AI Agents when working with the **powercat-adoption** plugin.

## What This Plugin Is

A plugin for Power Platform adoption storytelling. It helps Microsoft field teams, partners, and customer success professionals turn raw customer stories into polished, on-brand presentation assets — without design tools or build steps.

Skills orchestrate specialist agents via the `Task` tool. Agents are not invoked directly by users.

## Local Development

Test this plugin locally:

```bash
claude --plugin-dir /path/to/plugins/powercat-adoption
```

## Architecture

```
.claude-plugin/plugin.json     ← Plugin metadata (name, version, keywords)
AGENTS.md                      ← Plugin guidance for AI agents (this file)
CLAUDE.md                      ← Symlink → AGENTS.md
references/ 
agents/  
skills/
  powercat-storytelling/
    powercat-storytelling.md   ← Generate a polished 5-slide HTML customer story deck — brand-matched, self-contained, and presentation-ready
```

## Skills

| Skill | Courtesy of | Description |
|-------|-------------|-------------|
| `/powercat-storytelling` | Sameer Bhangar | Generate a polished 5-slide HTML customer story deck — brand-matched, self-contained, and presentation-ready |

### `/powercat-storytelling` — Storytelling Slide Generator

Drop in a customer name (and optionally a story source — public case study, internal note, or your own draft) and this skill produces a single self-contained HTML deck following a proven storytelling arc:

> **Title → Challenge → Build → Shift & Outcome → What's Next**

**Triggers:** "create a customer story deck", "make slides for [customer]", "turn this case study into a presentation", "build an HTML pitch deck for [customer]"

**Inputs:**
1. Customer name
2. Branding source (their website / a logo URL)
3. Story content (a draft, a case study link, internal notes, or *"use what you know"*)

**Output:** A `Scratchpad\[Customer]\` folder containing:
- `[Customer]_Customer_Story.html` — the self-contained deck (opens in any browser, no build step)
- The customer's logo (svg/png)

**Key capabilities:**
- Real brand matching — pulls the customer's logo, extracts colors from SVG/site, and themes the entire deck
- Product-branded tech tags — Microsoft product chips use actual brand colors (Copilot gradient, Azure blue, Teams purple, D365 navy, Power BI yellow, etc.)
- Polished interactions — full-viewport scroll-snap slides, IntersectionObserver reveals, progress bar, nav dots, and keyboard nav (↑ ↓ Space PgUp PgDn)
- NDA-aware — if the source is internal, automatically adds an "Internal · NDA" badge and omits public links

