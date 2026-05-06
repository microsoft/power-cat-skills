---
name: "storytelling-generate-slides"
description: "Generates a compelling 5-slide interactive HTML presentation for a customer story. Use this skill when asked to create a customer story deck or slides, generate an HTML presentation from a customer story draft, produce a browser-based slide deck with branded theming for a specific customer, or turn a raw story, document, or notes into a polished visual presentation. Handles intake (customer name, branding website, content source, and logo reminder), extracts real brand colors from the customer w"
---

# Storytelling: Generate Slides Skill

> **One skill, one output.** Given a customer name, a branding website, a
> content source, and a logo file, this skill produces a single polished
> 5-slide HTML presentation — ready to open in a browser, share as a file,
> or embed in a portal. No external dependencies. No server required.

---

## 1. Scope

This skill is focused exclusively on **generating the HTML slide deck**. It
does not score stories, draft long-form narratives, or manage publishing
workflows. For the full story making lifecycle (capture, interview, authoring,
review, amplification), use the `customer-storymaking` skill.

**Input:** Customer name + branding website + content source + optional logo  
**Output:** A single self-contained `.html` file — 5 scroll-snap slides

---

## 2. Intake — What to Ask Before Generating

Before writing a single line of HTML, collect the following four inputs. Ask
for each one explicitly if it has not been provided.

### 2.1 Customer Name

Ask: *"What is the customer's name (as it should appear in the presentation)?"*

- Used in the page title, wordmark, and attribution throughout the deck.
- Confirm preferred casing and whether "× Microsoft" should appear on the
  title slide.

### 2.2 Branding Website

Ask: *"What is the customer's website URL? I'll use it to extract brand colors,
fonts, and visual style."*

- Fetch the site's CSS or homepage to identify:
  - **Primary color** — usually the dominant brand color in the nav or hero
  - **Accent / CTA color** — button and link highlight color
  - **Background preference** — dark or light theme
  - **Typeface** — if a named web font is loaded (e.g., Google Fonts)
- **Important:** CSS framework defaults (e.g., Bootstrap's `#0d6efd`, an
  indigo `#5c60f5`) are NOT brand colors. Look for colors in `.navbar`,
  `.hero`, `.btn-primary`, or the logo's `fill` attribute in inline SVG.
- If the site is ambiguous or unavailable, ask the user to confirm the primary
  hex color directly.

### 2.3 Raw Content Source

Ask: *"Where is the story content? You can point me to a local folder (with a
.docx, .md, or .txt file), paste the text directly, or give me a URL to a
brief, article, or case study page."*

Supported sources:
| Source Type | How to Handle |
|---|---|
| Local `.docx` | Use python-docx to extract all paragraphs |
| Local `.md` / `.txt` | Read directly |
| Pasted text | Accept inline |
| URL | Fetch page content, strip nav/footer boilerplate |

Extract the following from the source content:
- **Headline metric** — the single most impressive quantified outcome
- **Supporting metrics** — 3–4 additional before/after or improvement figures
- **Core challenge** — what problem made change unavoidable
- **Solution summary** — what was built, which products/agents were used
- **Behavioral shift** — how daily work changed (before vs. after)
- **Stakeholder quote** — one named, attributed quote (name + title)
- **What's next** — upcoming expansion or next-phase plans
- **Customer profile facts** — size, industry, geography, scale

If any of these are missing from the source, flag them and ask the user to
provide them before generating.

### 2.4 Logo File

Remind the user: *"Please make sure the customer's logo file (PNG, SVG, or
WebP) is in the working folder. I'll reference it from the HTML. If no logo
is available, I'll render a styled text wordmark instead."*

- Preferred: SVG for crispness at all sizes
- Fallback: PNG with transparent background
- If no file is provided, generate a CSS wordmark using the customer name,
  primary color, and a subtle animated accent dot (see Section 5.2)

### 2.5 Theme Preference

Ask: *"Would you like the presentation in dark theme, light theme, or both?"*

| Choice | What to Generate | File Naming |
|---|---|---|
| **Dark** | One file, dark background (`#0D1117`–`#04101C` range), white text, vivid brand color accents | `[CustomerName]_Customer_Story.html` |
| **Light** | One file, white/off-white background (`#F8FAFB`–`#FFFFFF`), dark charcoal text, brand color accents | `[CustomerName]_Customer_Story.html` |
| **Both** | Two separate files, one per theme | `[CustomerName]_Customer_Story_Dark.html` and `[CustomerName]_Customer_Story_Light.html` |

**Default if not specified:** Choose the theme that best matches the customer's
own website. If their site is dark, default to dark. If light, default to light.
When genuinely ambiguous, ask.

**Theme decision guidance:**

- **Dark theme** suits: tech companies, ISPs/telecoms, cybersecurity, AI-native
  firms, luxury brands (dark + gold/silver), brands whose logo renders better
  on a dark field. Reference: `Ziply/Ziply_Customer_Story.html`.
- **Light theme** suits: professional services, architecture/design, healthcare,
  consumer goods, brands whose logo only has a dark variant, or any customer
  whose site is clearly white/off-white. Reference:
  `Dunaway/Dunaway_Customer_Story_v2.html`.

**Logo handling by theme:**

- **Dark theme:** If the logo is dark-on-transparent, apply
  `filter: brightness(0) invert(1)` to render it white.
- **Light theme:** Use the logo as-is. If it is white-on-transparent, apply
  `filter: brightness(0)` to render it dark.
- **Both themes:** Apply the correct filter in each file.

---

## 3. Branding Extraction Process

Follow this process to faithfully represent the customer's visual identity.

### Step 1 — Fetch the site

```
web_fetch(url=<branding_website>)
```

Look for:
- `<style>` blocks or linked CSS files
- CSS custom properties: `--primary`, `--brand`, `--color-*`, `--accent`
- Hex values in `.navbar`, `.hero`, `.header`, `button`, `.btn-primary`
- SVG `fill` or `stroke` attributes on the logo element
- `<meta name="theme-color">` tag

### Step 2 — Identify the color palette

Build a 3–5 color palette:

| Role | Variable Name | What to Look For |
|---|---|---|
| Primary brand | `--primary` | Dominant color in nav, logo, or hero |
| Accent / CTA | `--accent` | Button backgrounds, hover states, links |
| Background | `--bg` | Page/section background (light or dark) |
| Surface / card | `--surface` | Card, panel, or container backgrounds |
| Muted text | `--muted` | Secondary text color |

### Step 3 — Determine theme mode

Use the user's answer from Section 2.5 as the primary input. If they said
"match the website," apply these rules:

- **Dark theme:** Background is near-black or very dark gray. Text is white or
  light. Use dark slide backgrounds (`#0D1117`–`#1A222E` range) with white
  text. See Ziply deck as the reference.
- **Light theme:** Background is white or off-white. Text is dark charcoal
  (`#0F172A`–`#1F2937`). Use white/off-white slide surfaces. See Dunaway deck
  as the reference.
- **Both themes:** Generate two complete, independent HTML files. Each must
  pass the full validation checklist independently. Name them with `_Dark` and
  `_Light` suffixes respectively.

**CSS `:root` variable mapping by theme:**

| Variable | Dark Theme | Light Theme |
|---|---|---|
| `--bg` | `#0D1117` or brand-matched near-black | `#F8FAFB` or `#FFFFFF` |
| `--surface` | `rgba(255,255,255,.06)` dark card | `#FFFFFF` white card |
| `--text` | `#FFFFFF` | `#1F2937` or `#0F172A` |
| `--sub` | `rgba(255,255,255,.65)` | `#64748B` |
| `--muted` | `#7D8FA8` | `#94A3B8` |
| `--primary` | Brand color (vivid on dark bg) | Brand color (may need darker variant for contrast) |
| `--accent` | Secondary brand color | Secondary brand color |

### Step 4 — Select typography

- If the site loads a Google Font, use the same font in the deck:
  `<link href="https://fonts.googleapis.com/css2?family=FontName:wght@..." />`
- Fallback: `'Inter', system-ui, sans-serif`

---

## 4. Five-Slide Arc

Each slide maps to a condensed arc stage. The 7-stage story arc is compressed
into 5 slides appropriate for a presentation format:

| Slide | Name | Arc Stages Covered | Core Question |
|---|---|---|---|
| 0 | **Title** | — | Who is this story about, and what is the headline result? |
| 1 | **The Challenge** | Stage 1 + Stage 2 | Who is this customer and what problem forced change? |
| 2 | **The Build** | Stage 3 + Stage 4 | What did they choose to build, and how? |
| 3 | **The Shift & Outcome** | Stage 5 + Stage 6 | What changed, and what were the results? |
| 4 | **What's Next** | Stage 7 | Where is this story going from here? |

---

## 5. HTML Architecture

### 5.1 Core Structure

Every deck must implement:

```html
<div class="deck" id="deck">         <!-- scroll-snap container -->
  <section class="slide" id="s0">   <!-- each slide = 100vh -->
  <section class="slide" id="s1">
  ...
</div>
```

CSS scroll engine:
```css
html { overflow: hidden; }
.deck { height: 100vh; overflow-y: scroll; scroll-snap-type: y mandatory; }
.slide { height: 100vh; width: 100vw; scroll-snap-align: start; }
```

Required chrome:
- **Progress bar** — 3px fixed bar at top, width driven by scroll %
- **Nav dots** — fixed right side, 5 dots linking to `#s0`–`#s4`, active dot
  styled with primary color
- **Keyboard nav** — ArrowDown / ArrowUp / Space / PageDown / PageUp

### 5.2 Wordmark (when no logo file is provided)

```html
<div class="logo-wordmark">
  <span class="wm-name">[CustomerName]</span>
  <div class="wm-dot"></div>
  <span class="wm-partner">× Microsoft</span>
</div>
```

```css
.wm-name { color: #fff; font-weight: 900; font-size: 1.6rem; }
.wm-dot  { width: 8px; height: 8px; border-radius: 50%;
           background: var(--primary); animation: glow 2.5s infinite; }
.wm-partner { font-size: .75rem; color: var(--muted); font-weight: 600; }
```

When a logo file IS provided:
```html
<img src="[logo-filename]" alt="[CustomerName] logo" class="logo-img">
```
```css
.logo-img { height: 48px; object-fit: contain; }
```

### 5.3 Animation System

```css
/* Reveal animation — all animated elements start hidden */
.reveal { opacity: 0; }
.reveal.visible { animation: fadeUp .8s ease forwards; }
.reveal.d1 { animation-delay: .1s; }
/* ... .d2 through .d8 */

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Triggered by IntersectionObserver:
```js
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.querySelectorAll('.reveal')
      .forEach(el => el.classList.add('visible'));
  });
}, { threshold: 0.3 });
document.querySelectorAll('.slide').forEach(s => io.observe(s));
```

### 5.4 Metric Cards

Used on Slide 3 (Outcomes). Display 3–4 key metrics:

```html
<div class="metrics">
  <div class="metric reveal d3">
    <div class="num">[value]</div>
    <div class="label">[description]</div>
  </div>
</div>
```

```css
.metrics { display: flex; gap: 2vw; flex-wrap: wrap; margin-top: 3vh; }
.metric  { background: var(--surface); border: 1px solid rgba(255,255,255,.08);
           border-radius: 16px; padding: 2.5vh 2vw; flex: 1; min-width: 160px;
           text-align: center; transition: transform .3s, border-color .3s; }
.metric:hover { transform: translateY(-6px); border-color: var(--primary); }
.metric .num   { font-size: clamp(2rem,4vw,3.2rem); font-weight: 900; color: var(--primary); }
.metric .label { font-size: .82rem; color: var(--muted); margin-top: .5vh; line-height: 1.3; }
```

For dark themes, `.num` uses `var(--primary)`.  
For light themes, `.num` uses the same primary color or a slightly darker variant.

### 5.5 Quote Block

Used on Slide 1 or Slide 3. One named stakeholder quote per deck:

```html
<div class="quote-box reveal d4">
  <div class="quote-mark">"</div>
  <p class="quote">[quote text]</p>
  <p class="quote-attr">— [Name], [Title], [Company]</p>
</div>
```

```css
/* Dark theme */
.quote-box { border-left: 3px solid var(--primary);
             background: rgba(255,255,255,.04); border-radius: 12px;
             padding: 2.5vh 2.5vw; }
/* Light theme */
.quote-box { border-left: 4px solid var(--primary);
             background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.06);
             border-radius: 16px; padding: 2.5vh 2.5vw; }
```

### 5.6 Before/After Shift Items

Used on Slide 3. Pairs of before (struck-through, muted) → after (bold, bright):

```html
<div class="shifts">
  <div class="shift-item reveal d2">
    <span class="shift-arrow">→</span>
    <div class="shift-text">
      <span class="shift-from">[before state]</span><br>
      <span class="shift-to">[after state]</span>
    </div>
  </div>
</div>
```

### 5.7 Roadmap Cards

Used on Slide 4 (What's Next). 3 cards with status badges and bullet points:

```html
<div class="roadmap">
  <div class="road-card reveal d2">
    <span class="road-status">NOW</span>
    <div class="road-title">[Phase title]</div>
    <div class="road-item">• [item]</div>
  </div>
  <div class="road-card reveal d3">...</div>  <!-- NEXT -->
  <div class="road-card reveal d4">...</div>  <!-- FUTURE -->
</div>
```

Color the top border of card 1 with `var(--primary)`, card 2 with
`var(--accent)`, card 3 with a warm amber or secondary accent.

### 5.8 Tech Tags

Used on Slide 2 (The Build). Tag pills listing products/capabilities used:

```html
<div class="tech-tags reveal d5">
  <span class="tech-tag tt-primary">[Product A]</span>
  <span class="tech-tag tt-accent">[Product B]</span>
  <span class="tech-tag tt-secondary">[Product C]</span>
</div>
```

```css
.tech-tag    { font-size: .68rem; padding: 4px 14px; border-radius: 20px;
               font-weight: 700; color: #fff; }
.tt-primary  { background: var(--primary); }
.tt-accent   { background: var(--accent); }
.tt-secondary{ background: rgba(255,255,255,.1); color: var(--muted); }
```

---

## 6. Slide-by-Slide Content Guide

### Slide 0 — Title

**Layout:** Full-width centered content, left-aligned. Decorative radial
gradient blobs in primary/accent colors behind the content (absolute
positioned, `pointer-events:none`).

**Elements:**
1. Logo / wordmark (see 5.2)
2. Tag line: `[Category] · [Products used]`
3. Colored bar (4px, primary color, 60px wide)
4. H1 headline — two-line format:
   ```
   [Tension or before-state]
   [Result or after-state in primary color]
   ```
5. Subtitle paragraph — 1–2 sentences summarizing the story in plain language
6. "Scroll or press ↓ to continue" hint at bottom

**Copy principle:** The headline should be a before/after contrast or a
surprising metric. Make the reader want to know how it happened.

---

### Slide 1 — The Challenge

**Layout:** Two-column split. Left: narrative text, right: quote box or stat.

**Left column elements:**
1. Tag: `The Challenge`
2. Colored bar
3. H2 headline — vivid description of the pressure point
4. Body text — 2–3 sentences: who the customer is, what they were dealing with,
   why it was getting worse

**Right column elements:**
- Quote box with the stakeholder quote (preferred), OR
- A large isolated metric stat showing scale of the problem

**Copy principle:** Make the challenge feel real and urgent. Use specific
numbers (volume, time, cost) and name the root cause, not just the symptom.
The customer should feel recognizable to any peer in their industry.

---

### Slide 2 — The Build

**Layout:** Left: headline + solution description + tech tags. Right: a
visual representation of what was built (use a styled text-box "architecture"
card if no real diagram is available).

**Elements:**
1. Tag: `The Solution`
2. Colored bar
3. H2 headline — what was built, named
4. Body text — what the solution does and how it was deployed (2–3 sentences)
5. Tech tags — list all relevant Microsoft products and partner solutions
6. (Optional) An "agent profile" card if a named AI agent was built — show
   agent name, capabilities, and reach

**Copy principle:** Name the agents, products, and approach specifically. Avoid
generic phrases like "AI was implemented." Show what was designed.

---

### Slide 3 — The Shift & Outcome

**Layout:** Top: headline. Middle: 3–4 metric cards. Bottom: 3–4 before/after
shift rows.

**Elements:**
1. Tag: `The Shift & Outcome`
2. Colored bar
3. H2 headline — outcome-first framing
4. Metric cards — 3–4 key quantified results (headline number + short label)
5. Shift items — 3–4 before→after behavioral changes (not product features)

**Copy principle:** Metrics should lead with the result the customer cares most
about. Shift items should describe how *people's work changed*, not how the
software behaved. One row per changed behavior.

---

### Slide 4 — What's Next

**Layout:** Left: headline + subtext. Right: 3 roadmap cards (Now / Next /
Future).

**Elements:**
1. Tag: `What's Next`
2. Colored bar
3. H2 headline — momentum framing ("The journey continues")
4. Subtext — 1–2 sentences about the trajectory
5. Three roadmap cards:
   - **NOW** — current production capabilities
   - **NEXT** — upcoming phase or expansion
   - **FUTURE** — longer-horizon ambitions or aspirations

**Copy principle:** Close with forward energy. The customer should read as
expanding and growing, not finished. Frame each card as a stage on a maturity
arc, not a feature list.

---

## 7. Output Conventions

### File Naming

```
[CustomerName]_Customer_Story.html          ← single theme (dark or light)
[CustomerName]_Customer_Story_Dark.html     ← when generating both themes
[CustomerName]_Customer_Story_Light.html    ← when generating both themes
```

Examples: `Ziply_Customer_Story.html`, `Dunaway_Customer_Story_Dark.html`

Place the file in the customer's working folder (same directory as the logo
and source content, if present).

### Self-Contained File

The HTML file must be **fully self-contained** — no external JS dependencies,
no separate CSS files. All styles and scripts are inline in the `<head>` and
at the end of `<body>`.

Exception: Google Fonts `<link>` tag is allowed (requires internet access to
render correctly, but degrades gracefully to system fonts without it).

### Validation Checklist

Before delivering each file, confirm:

- [ ] Correct customer name in `<title>`, wordmark, and slide attribution
- [ ] No placeholder color variables — all `:root` vars use real brand hex values
- [ ] No CSS framework defaults used as brand colors (e.g., no `#5c60f5`)
- [ ] Theme matches what the user requested (dark / light / both)
- [ ] Logo rendered correctly for the theme (inverted if needed — see Section 2.5)
- [ ] Logo file referenced (if provided) or wordmark rendered (if not)
- [ ] All 5 slides present with correct IDs (`s0`–`s4`)
- [ ] Nav dots link to correct slide IDs
- [ ] Progress bar wired to scroll event
- [ ] IntersectionObserver wired to all `.reveal` elements
- [ ] Keyboard navigation works (ArrowUp/Down, Space)
- [ ] At least one named, attributed stakeholder quote
- [ ] At least 3 quantified metrics on Slide 3
- [ ] Tech tags reflect actual products used (not generic "AI")
- [ ] Roadmap cards present on Slide 4
- [ ] If "both" themes: both files exist and both pass this checklist independently

---

## 8. Common Mistakes to Avoid

| Mistake | Correction |
|---|---|
| Using CSS framework default colors as brand colors | Always fetch the actual site; cross-check against logo colors |
| Generic headlines ("AI Transformation Journey") | Use specific contrast or metric in the headline |
| Feature lists instead of outcomes | Shift items should describe changed behavior, not product capabilities |
| Missing attribution on quotes | Every quote must have name + title + company |
| Metric cards with vague labels | Labels should explain what the number measures ("Abandoned call rate → <1%") |
| All slides same visual density | Vary layouts: 2-column on Slides 1 & 4, cards/grid on Slides 2 & 3 |
| Placeholder text left in final output | Scan for `[bracket]` patterns before delivering |
| Logo file not found error | Always check if the file exists before referencing it in `src=""` |

---

## 9. Reference Examples

Two complete reference decks exist in this project:

| Example | Path | Theme | Notes |
|---|---|---|---|
| **Ziply Fiber** | `Ziply/Ziply_Customer_Story.html` | Dark (`#0D1117`) | Green + blue palette; named AI agent (Zoey); D365 contact center story |
| **Dunaway** | `Dunaway/Dunaway_Customer_Story_v2.html` | Light (`#F8FAFB`) | Forest green + amber palette; architecture firm; M365 Copilot + Power Platform |

When uncertain about layout, CSS pattern, or animation approach, reference
these files directly rather than inventing new approaches.

---

## 10. Quick Start Checklist

When this skill is invoked, follow these steps in order:

1. **Collect intake** — Ask for all five inputs (name, website, content,
   logo, theme preference) before proceeding. Do not guess.
2. **Extract branding** — Fetch the website and identify the real brand
   colors. Confirm with the user if ambiguous.
3. **Read content** — Extract the 8 story elements listed in Section 2.3.
   Flag any gaps before generating.
4. **Check for logo** — Confirm the logo file exists in the working folder.
   Remind the user if it is missing.
5. **Resolve theme** — Apply the user's answer from Section 2.5. If "both,"
   plan to generate two files with `_Dark` and `_Light` suffixes.
6. **Build `:root` variables** — Set all CSS color vars for each theme before
   writing any slide content. Use the mapping table in Section 3, Step 3.
7. **Generate slides in order** — Slide 0 → 1 → 2 → 3 → 4. If generating
   both themes, complete the dark file fully first, then the light file.
8. **Add JavaScript** — Progress bar, nav dots, IntersectionObserver,
   keyboard nav (same for both themes).
9. **Validate** — Run through the checklist in Section 7 for each file.
10. **Deliver** — Write each file to `[CustomerFolder]/[CustomerName]_Customer_Story[_Theme].html`.
