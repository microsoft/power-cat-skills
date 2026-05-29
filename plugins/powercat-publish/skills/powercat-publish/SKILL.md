---
name: "powercat-publish"
description: "Packages a folder of one or more skills into a Copilot CLI plugin (with marketplace metadata and a generated README), optionally installs it locally, and optionally publishes it as a pull request to either microsoft/Power-CAT-Skills-Internal (Internal) or microsoft/power-cat-skills (Public). Use whenever the user wants to turn a skill folder into a shippable plugin or contribute a skill to a Power CAT marketplace."
---

# Powercat-Publish Skill

Turn a folder of skills into a Copilot CLI plugin and (optionally) ship it.

## Inputs

The skill takes two inputs. Always confirm them at the start of the run; if either is missing or invalid, ask the user with `ask_user`.

| Name          | Required | Validation                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `Folder`      | Yes      | An absolute path that exists and contains at least one subfolder with a `SKILL.md` file inside.  |
| `Plugin Type` | Yes      | Must be **exactly** `Internal` or `Public` (case-insensitive). Anything else → ask again.         |

If `Plugin Type` is anything other than `Internal` or `Public`, stop and ask the user to choose one of the two via `ask_user` with `choices: ["Internal", "Public"]`.

---

## Step 1 — Build a plugin from the source folder

Goal: produce an in-memory model of what the plugin will look like, before writing anything to disk.

1. Verify `Folder` exists. If not, error and stop.
2. Recursively find every `SKILL.md` under `Folder`. The parent directory of each `SKILL.md` is one **skill**. The skill name is the parent directory name (lowercased, kebab-case is preferred — if the folder name uses a different style, suggest a kebab-case rename to the user but do not force it).
3. For each skill, read the YAML frontmatter at the top of `SKILL.md` to extract:
   - `name` (must match the folder name; warn if different)
   - `description`
4. For each skill, list every other file under that skill folder (templates, scripts, prompts, sample data, etc.) — these are the **assets** that must travel with the skill.
5. Also collect any **shared assets** that live directly under `Folder` but outside any skill subfolder (e.g. a `shared/` directory, a top-level `LICENSE`, or images). Plan to copy these into the plugin root or into a `shared/` directory at the plugin root.
6. If no `SKILL.md` files are found, stop with a clear error message — there is nothing to publish.
7. Show the user a short summary of what was found:
   - Number of skills, their names, and their one-line descriptions.
   - Total file count and any large files (>1 MB) that may not belong.

> Do **not** create any files yet — Step 1 is discovery and validation only.

---

## Step 2 — Create the new plugin

1. Use `ask_user` to ask: **"Where should I create the new plugin? Provide an absolute folder path."**
   - Recommend a sensible default in the question text, e.g. `C:\Users\<user>\source\plugins\<plugin-name>` on Windows or `~/code/plugins/<plugin-name>` elsewhere.
   - Refuse to write inside `Folder` itself (avoid mutating the source).
   - If the target directory exists and is non-empty, ask whether to overwrite, merge, or pick a new location.
2. Decide the **plugin name**:
   - If there is exactly one skill, the default plugin name is that skill name.
   - If there are multiple skills, the default is the source folder's name in kebab-case.
   - Either way, confirm with the user via `ask_user` and allow them to override.
3. Create the folder structure at the chosen path:

   ```
   <plugin-root>/
     plugin.json
     README.md
     skills/
       <skill-1>/
         SKILL.md
         ...assets...
       <skill-2>/
         ...
     shared/        (only if there were shared assets)
   ```

4. Generate `plugin.json` with marketplace-ready metadata:

   ```json
   {
     "name": "<plugin-name>",
     "version": "0.1.0",
     "description": "<one-paragraph description summarising every included skill>",
     "author": {
       "name": "Power CAT",
       "email": "<ask the user for an email, default to their git config user.email if available>"
     },
     "keywords": ["power-platform", "powercat", "<one keyword per skill topic>"]
   }
   ```

   - Ask the user to confirm/edit the `description`, `author`, and `keywords` before writing the file.
   - Keep `version` at `0.1.0` for new plugins. If the plugin already exists at the destination and has a `plugin.json`, bump the patch version instead.

5. Generate `README.md`. It must include, in this order:
   - `# <plugin-name>` heading
   - One-paragraph plugin description (same as `plugin.json`)
   - `## Skills` section listing every skill with name (bold) and one-line description, formatted as a bullet list (mirror the style used by `powercat-roadmap` and `powercat-check-design`).
   - `## Usage` section with 2–3 example natural-language prompts that would invoke the skills.
   - `## Notes` section with anything important the user mentioned (prerequisites, MCP servers needed, env vars, etc.).

6. Copy each skill folder verbatim into `skills/<skill-name>/`. Copy shared assets into `shared/` (or the plugin root if there are only one or two top-level files like `LICENSE`).

7. After writing, list every file created and show the user the resulting folder tree so they can verify.

---

## Step 3 — Optional local install

1. Use `ask_user`: **"Do you want to install this plugin on your local machine now?"** with `choices: ["Yes", "No"]`.
2. If **No**, skip to Step 4.
3. If **Yes**, install by running:

   ```powershell
   copilot plugin install "<absolute-path-to-plugin-root>"
   ```

   (`copilot plugin install` accepts a local path as the source.)

4. Verify the install:
   - Run `copilot plugin list` and confirm the new plugin appears.
   - If the install fails, surface the full error to the user and offer to fall back to a manual install:
     - Copy the plugin folder to `~/.copilot/installed-plugins/<marketplace-or-local>/<plugin-name>/`.
     - Append an entry to `~/.copilot/config.json` under `installedPlugins` with `name`, `marketplace` (use `"local"` if installing from a local path), `version`, `installed_at` (current ISO 8601 timestamp), `enabled: true`, and `cache_path` set to the destination folder. Read the file first, edit JSON safely, and write it back.
5. Tell the user the plugin is installed and how to invoke each skill.

---

## Step 4 — Optional publish

1. Use `ask_user`: **"Do you want to publish this plugin?"** with `choices: ["Yes", "No"]`.
2. If **No**, finish and summarise what was created.
3. If **Yes**, branch on `Plugin Type`.

### 4a. Internal (`Plugin Type` = `Internal`)

Target repo: **`microsoft/Power-CAT-Skills-Internal`**.

**Prerequisite — GitHub CLI + SSO authentication.** The Internal flow requires `gh` to be installed and the active token to be SAML-SSO authorized for the `microsoft` org. Before any other action in this section:

1. Detect `gh` (`Get-Command gh -ErrorAction SilentlyContinue` on Windows, `command -v gh` elsewhere).
2. If `gh` is missing, install it automatically — do **not** ask the user to install manually:
   - **Windows:** `winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements --silent`. After install, prepend `C:\Program Files\GitHub CLI` to `$env:Path` for the current shell so the new binary is reachable.
   - **macOS:** `brew install gh`.
   - **Linux:** follow https://github.com/cli/cli#installation for the user's distro (`apt`, `dnf`, etc.).
   - If install fails, surface the full error and stop. Do not fall back to manual PR creation for the Internal flow.
3. Run `gh auth status --hostname github.com`. If the user is not logged in **or** the active token is missing the scopes `read:org`, `repo`, `workflow`, run:
   ```powershell
   gh auth login --hostname github.com --git-protocol https --web --scopes "read:org,repo,workflow"
   ```
   Walk the user through the device-code flow:
   - Copy the one-time code printed by `gh`.
   - Open `https://github.com/login/device` in their browser.
   - Sign in with the GitHub account that has access to `microsoft/Power-CAT-Skills-Internal`.
   - Paste the code and approve the requested scopes.
   - On the post-auth screen, click **"Configure SSO"** and **"Authorize"** for the **`microsoft`** organization (required for SAML SSO orgs).
4. Verify SSO is granted: `gh repo view microsoft/Power-CAT-Skills-Internal --json name,visibility`.
   - If it succeeds, proceed to the duplicate check below.
   - If it returns "repository not found" or an SSO error, the token isn't SAML-authorized for `microsoft`. Direct the user to https://github.com/settings/tokens, find their gh CLI token, click **"Configure SSO"** → **"Authorize"** for the `microsoft` org, then re-run the verification.

Only after the prerequisite passes, continue with the steps below.

1. Search the repo for any similar skill:
   - Use `gh` if available (`gh search code --repo microsoft/Power-CAT-Skills-Internal "<skill-name>"`) or fall back to the GitHub search API via `curl`.
   - Also list the contents of the repo root and any `plugins/` or `skills/` directories to spot near-duplicates by name.
2. If a similar skill exists, **warn the user** with the matches and use `ask_user` to ask **"A similar skill already exists in Power-CAT-Skills-Internal. Do you still want to proceed with the PR?"** (`choices: ["Yes", "No"]`).
3. If the user proceeds (or no match was found):
   - Fork (if needed) and clone `microsoft/Power-CAT-Skills-Internal` into a temp working directory.
   - Create a new branch named `add-<plugin-name>`.
   - Copy the plugin folder into the location the repo expects (mirror existing layout — typically `plugins/<plugin-name>/`). If the repo uses a different convention, follow what is already there.
   - If the repo has a `marketplace.json` or similar index file, add the new plugin entry to it.
   - Commit with message `Add <plugin-name> plugin` and the standard co-author trailer.
   - Push the branch and open a PR using `gh pr create` with a body that lists the included skills and a short rationale.
4. Show the user the PR URL when done.

### 4b. Public (`Plugin Type` = `Public`)

Target repo: **`microsoft/power-cat-skills`**.

Run **all** of the following safety checks. Collect every finding into a single list and only show the user a **single** consolidated warning at the end (so they can decide once).

1. **Duplicate check** — Same approach as Internal but against `microsoft/power-cat-skills`. Look at `plugins/` and the `marketplace.json` for an existing plugin/skill with the same or very similar name.
2. **Public-source check** — For every reference to a package, repo, NuGet feed, npm registry, MCP server URL, REST endpoint, or container image in the plugin files, verify it is publicly reachable. Heuristics:
   - Flag any URL containing `microsoft.visualstudio.com`, `dev.azure.com/<internal-org>`, `pkgs.dev.azure.com`, `*.corp.microsoft.com`, `*.redmond.corp`, internal-only DNS suffixes, or NuGet/npm feeds requiring auth.
   - Flag GitHub URLs pointing to private repos (an HTTP HEAD via `curl -I` returning 404 with `User-Agent: Mozilla/5.0` is a strong signal — confirm with `gh repo view <owner>/<repo>` if `gh` is installed).
3. **PII check** — Scan every text file (`SKILL.md`, `README.md`, scripts, samples) for:
   - Email addresses (regex: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`) — except generic ones like `noreply@github.com` or the plugin author's declared address.
   - Phone numbers, postal addresses, GUIDs that look like tenant or user IDs.
   - Bearer tokens, API keys, connection strings, anything that matches common secret patterns (use a simple regex set: `AKIA[0-9A-Z]{16}`, `xox[baprs]-[A-Za-z0-9-]+`, `ghp_[A-Za-z0-9]{36}`, `eyJ[A-Za-z0-9_=-]+\.[A-Za-z0-9_=-]+\.?[A-Za-z0-9_.+/=-]*`, etc.).
4. **Local-path check** — Flag any string that looks like a local filesystem path:
   - Windows: matches `^[A-Za-z]:\\` or contains `\Users\`, `\OneDrive`, `\Documents\`.
   - Unix: matches `^/Users/`, `^/home/`, `^/mnt/c/`.
   - File URIs (`file://`).
5. **People / company name check** — Scan for proper-noun sequences likely to be people or companies:
   - Compare against a small built-in list of common Microsoft customer / partner names if you have one; otherwise rely on capitalised multi-word tokens that aren't common English words and aren't standard product names (Power Apps, Power Automate, Dataverse, Microsoft, Azure, GitHub, etc.).
   - Always flag the strings `Contoso`, `Fabrikam`, and the user's own name (from `git config user.name`) only if they appear in user-visible text rather than examples.
6. Build a **single warning message** summarising every finding, grouped by check, with the file path and the offending line for each. If no findings, say "All public-readiness checks passed.".
7. Use `ask_user`: **"Do you still want to proceed with publishing this plugin publicly?"** with `choices: ["Yes", "No"]`. Default to **No** in your recommendation if any finding was raised.
8. If the user proceeds:
   - Fork (if needed) and clone `microsoft/power-cat-skills`.
   - Create a branch named `add-<plugin-name>`.
   - Copy the plugin folder into `plugins/<plugin-name>/` (the convention used by this repo — confirm by listing the existing `plugins/` directory).
   - Update the marketplace manifest (`marketplace.json` or whatever index file the repo uses) to register the new plugin.
   - Commit with `Add <plugin-name> plugin` and the standard co-author trailer.
   - Push and open a PR with `gh pr create`. The PR body should list the skills, summarise what each does, and confirm that the public-readiness checks were run (and acknowledged) by the contributor.
9. Show the user the PR URL when done.

---

## General rules

- **Always confirm before destructive actions.** Writing to disk, installing, pushing, and opening PRs each need their own user confirmation.
- **Never commit secrets.** If the PII / secret check finds anything that looks like a credential, refuse to publish until the user explicitly removes it — even if they say "proceed". Do not just warn for credentials; block.
- **Use `ask_user` for every question.** Do not embed questions in plain text output.
- **Preserve the source.** Never modify the original `Folder`. Always work on copies.
- **Co-author trailer.** Every commit must end with:

  ```
  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```

- **Authentication.** The Internal publish flow (section 4a) has its own mandatory prerequisite that auto-installs `gh` (via `winget`/`brew`) and walks the user through SSO authorization for the `microsoft` org — follow that section, do not skip it. For the Public flow and any other GitHub operation: if `gh auth status` shows the user isn't logged in, walk them through `gh auth login` before attempting the publish step; if `gh` is not installed, fall back to `git` + manual PR creation via the GitHub web UI and give the user the exact URL.
- **Cleanup.** Remove any temporary clone directories at the end of the session unless the user asks to keep them.

## Final summary

When the run finishes, print a short summary listing:
- Where the plugin was created.
- Whether it was installed locally.
- Whether a PR was opened, and the PR URL if so.
- Any warnings the user acknowledged.
