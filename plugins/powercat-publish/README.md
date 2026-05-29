# powercat-publish

Packages a folder of one or more skills into a Copilot CLI plugin with marketplace metadata and a generated README, optionally installs it locally, and optionally publishes it as a pull request to either microsoft/Power-CAT-Skills-Internal (Internal) or microsoft/power-cat-skills (Public). Includes automated public-readiness checks for PII, secrets, internal URLs, and local paths.

## Skills

- **powercat-publish** — Packages a folder of one or more skills into a Copilot CLI plugin (with marketplace metadata and a generated README), optionally installs it locally, and optionally publishes it as a pull request to either microsoft/Power-CAT-Skills-Internal (Internal) or microsoft/power-cat-skills (Public).

## Usage

- "Publish my-skill-folder to Internal"
- "Package the powercat-roadmap skill as a public plugin"
- "Turn my skills folder into a plugin and open a PR"

## Notes

- Requires **GitHub CLI (`gh`)** for publishing. The skill auto-installs `gh` via winget/brew if missing.
- For the Internal flow, the `gh` token must be SAML-SSO authorized for the `microsoft` GitHub org.
- The Public flow runs automated safety checks (PII, secrets, internal URLs, local paths) before opening a PR.
- Never modifies the source skill folder — always works on copies.
