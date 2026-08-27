# Official product icon specification

Use these bundled Microsoft-published SVG files in generated architecture HTML and PDF reports.

## Asset map

| Product label | Bundled file |
|---|---|
| Power Apps | `references/product-icons/PowerApps_scalable.svg` |
| Power Automate | `references/product-icons/PowerAutomate_scalable.svg` |
| Power Pages | `references/product-icons/PowerPages_scalable.svg` |
| Microsoft Dataverse | `references/product-icons/Dataverse_scalable.svg` |
| Microsoft Copilot Studio | `references/product-icons/CopilotStudio_scalable.svg` |
| Power BI | `references/product-icons/power_bi_48_color.svg` |

## Usage

- Use an icon only to identify its actual Microsoft product in an architecture diagram or report.
- Always place the full product name next to the icon. Never use an icon as an unexplained control or as branding for the advisor.
- Do not crop, flip, rotate, recolor, trace, redraw, animate, or distort an icon.
- Preserve the SVG aspect ratio. Use a 28–36 px visual size in component lists and an appropriate consistent size in diagrams.
- Include meaningful alternative text such as `Power Apps`. Do not use the filename as alternative text.
- Keep icon presentation secondary to the recommendation. Do not decorate headings, risks, roadmap tasks, or ordinary bullets with product icons.

## Format behavior

- **HTML:** Read the bundled SVG and embed it unchanged as a Base64 `data:image/svg+xml` URI so the report remains self-contained. Use an `<img>` element with `width`, `height`, `alt`, and `class="product-icon"`.
- **PDF:** Use the SVG directly when the PDF library supports it. Otherwise rasterize it at sufficient resolution without changing aspect ratio or colors.
- **Markdown:** Use bold product names without an icon unless the runtime can return the Markdown and an accompanying asset folder as one archive. Do not use remote hotlinks or emoji substitutes.
- **Copilot Studio chat:** Use bold product names without an icon when packaged images cannot be exposed as stable inline URLs. Do not imitate Microsoft icons with emoji or Unicode glyphs.

## Sources and terms

The Power Platform product SVGs come from Microsoft Learn's official Power Platform icon pack:

- Guidance and terms: https://learn.microsoft.com/power-platform/guidance/icons
- Download: https://download.microsoft.com/download/498606aa-6d27-4f13-aa5c-1401078c153b/Power-Platform-icons-scalable.zip

The Power BI SVG comes from Microsoft's official Fabric icon pack:

- Guidance and terms: https://learn.microsoft.com/fabric/fundamentals/icons
- Repository download: https://github.com/microsoft/fabric-samples/blob/main/docs-samples/Icons.zip

Microsoft permits these icons for architectural diagrams, training materials, and documentation. Follow the current terms on the linked Microsoft Learn pages.