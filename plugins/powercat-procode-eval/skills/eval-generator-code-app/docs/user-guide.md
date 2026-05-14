# Eval Generator for Power Apps Code Apps — User Guide

> An AI coding skill that automatically reviews your Code App and tells you what's built, what works, and what could be a security risk — all without running a single line of your app.

---

## What Is This Skill?

When you build a Power Apps Code App, it can be hard to answer a simple question: *"Is everything I planned actually in the code?"* Reading through every file yourself takes time, is easy to miss things, and doesn't scale as the app grows.

This skill does that review for you — automatically. It reads your source code, understands what your app is supposed to do (either from a requirements document you give it, or by figuring it out from the code itself), and then produces a structured report — the **Eval Dashboard** — that shows you exactly what's present, what's missing, how each piece of logic behaves, and whether there are any security concerns.

Think of it as a code health check-up that runs in seconds instead of hours.

---

## What Does It Actually Check?

The skill runs three types of checks. Together they give you a full picture of your app's quality.

### 1. Feature Presence — "Is the code there?"

For every feature in your app, the skill checks whether the code that should implement that feature actually exists in the right place. It's not just looking for a file named the right thing — it checks that:

- The connector your feature depends on is wired up and imported
- The service is actually called from your code, not just declared
- Error handling is in place (so connector failures don't silently crash the app)
- Loading states and empty states are handled
- The Power Apps SDK is properly initialized

**Verdict:** Each feature gets ✅ Pass or ❌ Fail. A fail means the feature is structurally missing or incomplete — it won't work even if no one has noticed yet.

---

### 2. Unit Tests — "Does the logic work?"

Beyond checking that code exists, the skill generates and runs automated tests for the logic inside each feature. These tests ask questions like:

- Does the currency formatter round correctly?
- Does the "submit expense" button disable while a save is in progress?
- Does the profile screen call logout when the user clicks Sign Out?
- Does the expense list correctly group items by report?

Each test runs in an isolated sandbox using fake ("mock") data — meaning it never connects to your actual Dataverse environment or live connectors. The tests are completely self-contained and repeatable.

**Verdict:** Each test shows ✅ Pass, ❌ Fail (with the exact error message), or ⏭ Todo (placeholder — to be filled in as the feature matures).

---

### 3. Security Scan — "Are there risks?"

The skill reads every source file and flags patterns that are known to cause security problems. It checks **16 security categories** in total:

| Category | What It Looks For |
|---|---|
| **Hardcoded Secrets** | API keys, passwords, or tokens written directly in code |
| **Vulnerable Dependencies** | Libraries with known published CVEs (security flaws) |
| **XSS (Cross-Site Scripting)** | Places where raw HTML could be injected |
| **OData Injection** | Filter queries built from user input (like SQL injection for Dataverse) |
| **PII in Console Logs** | Emails, names, phone numbers printed to the browser console |
| **Error Disclosure** | Raw technical error messages shown in the UI |
| **Unsafe External Calls** | HTTP requests to non-Microsoft endpoints |
| **Sensitive Data in Storage** | Auth tokens or user data saved to browser local storage |
| **Unvalidated User Input** | User-typed values passed directly to service calls without sanitisation |
| **Sensitive Data in React State** | Passwords or secrets stored in component state |
| **Sensitive Env Variables Published** | Build-time secrets bundled into the public JavaScript file |
| **Config File Secrets** | Credentials found in `power.config.json` (which is source-controlled) |
| **Dynamic Code Execution** | Use of `eval()` or `new Function()` — code injection risks |
| **Broader External HTTP Clients** | axios, XMLHttpRequest, or jQuery calls to external services |
| **Sensitive URL Parameters** | Tokens or user IDs passed as query string parameters |
| **Client-Side Auth Bypass** | Role checks in the UI only, with no server-side guard |

Each finding includes the **exact file and line number**, the code snippet, and a plain-English explanation of why it matters and how to fix it.

Categories with no findings show a green ✅ pass so you can see what was checked and confirmed clean.

---

## How to Use the Skill

### Starting the skill

In GitHub Copilot (VS Code) or Claude Code, type any of these phrases:
- *"Generate code app evals"*
- *"Eval my code app"*
- *"Generate tests for my code app"*
- *"Check feature completeness of my code app"*

### What it will ask you

The skill asks two or three quick questions before it starts:

1. **Do you have a requirements document (BRD)?** — You can provide a local file, a OneDrive/SharePoint link, or just say "no" and the skill will figure out the features from your code.
2. **Where is your Code App project?** — The folder path. If you're already working in it, just confirm the current directory.
3. **Mode** — "Write eval files" (default) or "describe only" (shows what it would generate without writing anything).

Answer these and the skill does everything else.

### What gets created

The skill writes a set of files into an `evals/` folder inside your project:

| File / Folder | Purpose |
|---|---|
| `evals/manifest.json` | The list of features the skill identified |
| `evals/presence/` | One check file per feature |
| `evals/unit/` | Unit test files, one per feature group |
| `evals/runner/` | The scripts that run all the checks |
| `evals/dashboard/index.html` | The visual results dashboard |

### Running the evals

After the skill completes, run:
```
npm run eval
```

This runs all presence checks, all unit tests, and the security scan, then bakes the results into the dashboard. Open `evals/dashboard/index.html` in your browser to see the full report.

---

## Reading the Dashboard

The dashboard has five tabs:

| Tab | Shows |
|---|---|
| **Summary** | Overall pass/fail counts across all three layers, timestamp, and iteration number |
| **Current Run** | Feature-by-feature table — presence status and unit test status for each feature |
| **Unit Tests** | Every unit test, grouped by feature — what it verifies and whether it passed |
| **Security** | All 16 security categories — green for clean, red (expandable) for findings |
| **BRD Gaps** | Side-by-side comparison if you run with a requirements document — what was asked vs. what was found |

### Severity levels in the security tab

| Colour / Label | Meaning |
|---|---|
| 🔴 Critical | Fix before shipping — active security risk |
| 🟠 High | Fix soon — probable vulnerability or data exposure |
| 🟡 Medium | Review — potential risk depending on context |
| 🔵 Low | Minor concern — worth knowing about |
| ✅ Pass | Category was checked and no issues found |

---

## What Happens When You Run It Again

The skill is designed to be run repeatedly as your app evolves. Each run:
- Saves the previous results as a snapshot (so you can see progress over time)
- Adds tests for any new features
- Preserves tests for features that haven't changed
- Increments the iteration number in the dashboard

The **Current Run** tab shows colour-coded arrows indicating whether each feature improved (🟢) or regressed (🔴) since the last iteration.

---

## What This Skill Does NOT Cover

Understanding the limits is just as important as knowing what's included.

| Not covered | Why |
|---|---|
| **Runtime behaviour with real data** | The skill never connects to your Dataverse environment or live connectors. It uses fake data in sandboxed tests. |
| **UI visual correctness** | It does not open a browser, render your app, or take screenshots. Whether buttons are in the right place or styled correctly is not checked. |
| **End-to-end user flows** | Clicking through your app as a real user would — form submission, navigation, multi-screen workflows — is not tested. |
| **Performance** | Response times, load times, and query efficiency are not measured. |
| **Power Platform deployment issues** | Whether `npx power-apps push` succeeds or whether your app behaves correctly inside the Power Apps host is not checked. |
| **Accessibility** | Screen reader compatibility, keyboard navigation, and WCAG compliance are not evaluated. |
| **PCF components** | This skill is designed exclusively for Power Apps Code Apps. PCF components (which use a completely different SDK) are not supported. |

---

## How Confident Can I Be in the Results?

**Presence checks** are deterministic — they either find the code or they don't. A ✅ pass means the code structure is exactly as expected. A ❌ fail means something is definitively missing. There are no false positives here.

**Unit tests** are as reliable as the logic they test. They run in a real JavaScript engine with real TypeScript type checking. A pass means the function behaves correctly for the scenarios the test covers. More tests = more coverage = more confidence.

**Security checks** are conservative by design. The scan flags patterns that *could* be a problem — some findings may require human judgement (e.g., an external HTTP call to a Microsoft endpoint will not be flagged, but one to an unknown domain will be). A clean security report means none of the 16 known risk patterns were found. It does not guarantee zero vulnerabilities — novel or business-logic vulnerabilities require human review.

---

## Frequently Asked Questions

**Q: I don't have a requirements document. Can I still use the skill?**
Yes — this is fully supported. The skill reads your code and derives the feature list automatically. Results will be labelled *"generated from code review"* in the manifest.

**Q: The feature table shows "No tests" for some features. What does that mean?**
It means the unit test for that feature used a `todo` stub — a placeholder the skill created because the feature logic wasn't testable at the time. This is not a failure; it's a signal to fill in the test as the feature matures.

**Q: Some security findings look like false positives. What should I do?**
Read the finding detail — it includes the exact line and a plain-English explanation. If you've confirmed it's safe (e.g., the external URL is an approved Microsoft endpoint), document why in a code comment. The finding will still appear on the next run, but your team will know it was reviewed.

**Q: Can I run just the security scan without re-generating everything?**
Yes — each layer has its own script. Run any of these from your project root:

```bash
npm run eval:security   # security scan only
npm run eval:presence   # feature presence checks only
npm run eval:unit       # unit tests only
npm run eval            # all three layers + update dashboard
```

**Q: What if my app changes significantly? Do I re-run the skill?**
Yes. Re-invoking the skill will pick up new components and services, add tests for new features, and run the full security scan against the updated codebase. Old passing tests are preserved.


---

## Current Limitations

> **Preview:** This skill is currently in preview. Features, outputs, and patterns may change as the skill matures based on real-world testing and team feedback.

Understanding what this skill does **not** do today is important for setting the right expectations.

### Works on local folders only

The skill reads your Code App source code from a **local folder on your machine**. It cannot yet:
- Pull source directly from a **GitHub repository**
- Connect to a **Dataverse environment** to fetch a deployed solution
- Pull source from a **Power Platform solution** package

**What this means for you:** You need to have your Code App checked out locally before running the skill. If your code lives in GitHub, clone it first, then run the skill.

### Static analysis only — not dynamic

All checks are **static**: the skill reads your source files as text and looks for patterns. It does not:
- Start your app and test it against real data
- Make calls to your Dataverse environment
- Validate that your queries return the right results at runtime
- Test what a user actually sees in the browser

Think of it as a **code review tool**, not a test runner connected to your live system.

### Does not check the runtime or deployed experience

The skill does not know whether:
- Your app actually runs successfully inside the Power Apps host
- `pac solution push` or `npx power-apps push` succeeds
- Your connectors are authorized and returning data
- Your app looks or behaves correctly in a browser

### One-time, on-demand execution

Today the skill runs **when you invoke it manually**. It does not:
- Automatically run when you push code to GitHub
- Trigger on every build or deployment
- Send alerts when new security issues are introduced

### Code Apps only (not PCF)

This skill (`eval-generator-code-app`) is designed **exclusively for Power Apps Code Apps** — projects created with `npx power-apps init` using the `@microsoft/power-apps` SDK. It will refuse to run on PCF components (`@microsoft/powerapps-component-framework`).

---

## Roadmap

This skill is the first phase of a broader eval framework for AI-built Power Platform assets. Here is what is supported today versus what is planned.

### Phase 1 — Current (What You Have Now)

| Capability | Status |
|---|---|
| BRD or requirements doc → feature list | ✅ Supported |
| Code review fallback (no BRD required) | ✅ Supported |
| Feature presence checks (Code Apps) | ✅ Supported |
| Static security analysis (16 checks) | ✅ Supported |
| Self-contained HTML dashboard | ✅ Supported |
| Iterative runs with snapshot history | ✅ Supported |
| Runs from local folder | ✅ Supported |
| Preview release via power-cat-skills marketplace | ✅ Supported |

### Phase 2 — Enterprise Ready (Planned)

| Capability | Status |
|---|---|
| Pull source from a **GitHub repository** (not just local folder) | 🔮 Planned |
| Pull source from a **Dataverse solution** or environment | 🔮 Planned |
| Pull Gen Pages as **runtime artifacts** (not just static files) | 🔮 Planned |
| User chooses source interactively (local / GitHub / environment) | 🔮 Planned |
| Connect eval skill to a live Dataverse environment for metadata | 🔮 Planned |

### Phase 3 — Automated Evals (Future)

| Capability | Status |
|---|---|
| Browser-based scenario execution (open app, click, validate) | 🔮 Future |
| Functional correctness checks via API / runtime calls | 🔮 Future |
| Continuous validation — run on every code push or build | 🔮 Future |
| Automated feedback loop into the development cycle | �� Future |

### Phase 4 — Enterprise CI/CD Integration (Future)

| Capability | Status |
|---|---|
| Eval runs on every pull request | 🔮 Future |
| Eval runs on deployment / solution import | 🔮 Future |
| Unified scoring model across teams | 🔮 Future |
| Org-wide shared dashboards and governance reporting | 🔮 Future |
| Alignment with existing enterprise code scanner pipelines | 🔮 Future |

---

> **Want to contribute to the roadmap?** This skill is open source and published through the [power-cat-skills marketplace](https://github.com/microsoft/power-cat-skills). Feedback, issues, and pull requests are welcome.
