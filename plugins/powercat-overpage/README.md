# PowerCAT OverPage

Review a **Power Pages site export** against best-practice guidance and explore every finding
overlaid on a live preview of the page it affects.

PowerCAT OverPage is to **Power Pages** what PowerCAT OverFlow is to **Power Automate**: drop in a
site `.zip`, the AI reviews it and writes a single `[SolutionName].findings.json`, and a viewer
renders your site with each issue pinned exactly where it lives.

## What it checks

| Category | Examples |
|----------|----------|
| **Security** | Table permissions granting Global read to Anonymous; data lists/forms on unauthenticated pages; secrets in site settings; inline `<script>` (CSP risk) |
| **Accessibility** | Images without `alt`; unlabeled form inputs; skipped heading levels (WCAG) |
| **Performance** | Large/uncompressed web files; heavy render-blocking content |
| **Maintainability** | Hardcoded emails/URLs/GUIDs that belong in snippets or site settings; orphaned/duplicate pages |
| **SEO** | Missing titles/meta descriptions; broken internal links |
| **Reliability** | Forms writing to tables with no matching permission; references to missing templates/snippets |

Findings are **AI-authored** — the agent reads the actual export and reasons about it (there is no
fixed rule engine). Every finding is validated against `skills/powercat-overpage/findings.schema.json`
and carries a `fix` plus an `anchor` so the viewer can show it on the right page.

## Use it

Ask in chat: **"overpage my site"**, **"review my Power Pages site"**, or **"powercat overpage"**, and
attach a Power Pages site `.zip` (a zipped `pac powerpages download` export).

The skill will:
1. Unpack and review the site → write `[SolutionName].findings.json` next to your `.zip`.
2. Open the PowerCAT OverPage viewer with the site and findings loaded.
3. Hand you a short score summary + the file path + the viewer URL.

## Input

A Power Pages **site export**, not a classic Dataverse solution:

```
pac powerpages download --path ./site --website-id <id>
# then zip ./site
```

A classic solution `.zip` (with `customizations.xml`, no web pages) is detected and rejected with
guidance.

## Findings format

Authoritative schema: `skills/powercat-overpage/findings.schema.json` (JSON Schema draft-07). The
same shape the PowerCAT OverPage viewer loads via its **Open findings** input.

## Privacy

Everything runs locally. Your site export and the findings file never leave your machine.
