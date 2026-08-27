# Copilot Studio deployment

This folder builds the Power CAT Architecture Advisor as a skill package for an agent powered by the GitHub Copilot harness in the new Microsoft Copilot Studio experience.

## Build the package

From the repository root, run:

```powershell
& 'plugins\powercat-architecture-advisor\copilot-studio\build-package.ps1'
```

The ignored `build/` directory receives:

```text
build/copilot-studio/
├── powercat-pp-architecture-advisor/
│   ├── SKILL.md
│   └── references/
└── powercat-pp-architecture-advisor.zip
```

The builder keeps the original skill authoritative. It creates a deployment copy that:

- retains only portable skill frontmatter;
- adds Copilot Studio conversation and state rules;
- treats bundled references as read-only;
- replaces runtime self-modification with maintainer-reviewed pattern feedback;
- returns a concise recommendation with one or two Power CAT resources, offers optional focused outputs, and generates a complete Architecture Delivery Pack as PDF or Interactive HTML only when requested;
- bundles official Microsoft product icons and the requirements, implementation, and discovery-handoff specifications; and
- validates that all major workflow sections remain present.

## Configure the existing agent

1. Confirm the agent uses the **GitHub Copilot harness**. Skills in this format aren't supported by the standard harness.
2. Open the agent's **Build** tab.
3. Paste [agent-instructions.md](agent-instructions.md) into the agent **Instructions** editor.
4. In the components panel, open **Skills** and select **Upload a skill**.
5. Upload `build/copilot-studio/powercat-pp-architecture-advisor.zip`.
6. Keep the Microsoft Learn website knowledge sources for Power Platform, Power Apps, Power Automate, Power Pages, and Microsoft Copilot Studio. Add these website knowledge sources so the advisor can verify current labs, skills, and resource links:
	- `https://github.com/microsoft/apps-agents-workshop`
	- `https://github.com/microsoft/power-cat-skills`
	- `https://github.com/microsoft/power-platform-resources`
7. Enable file or attachment input for the agent and intended channel so users can submit requirements documents. The exact control can vary by Copilot Studio release and channel; verify it in the current agent settings rather than assuming every published channel supports uploads.
8. Open **Preview** and run the cases in [evaluation-cases.md](evaluation-cases.md), including `UPLOAD-01` and `UPLOAD-02` with representative supported and unsupported files.
9. When **Evaluation** is available for the agent's harness, select **New evaluation → Conversation**, import [mcs-conversation-evals.csv](mcs-conversation-evals.csv), and create the test set. The file preserves the tenant-provided preamble and exact `conversationNumber`, `question`, and `response` columns. It contains 18 conversations and no conversation exceeds six question-and-answer pairs.
10. Keep the default **General quality** method and add the four custom conversation evaluators from [evaluation-criteria.md](evaluation-criteria.md). Add **Keyword match** only for stable labels or menus and **Tool use** only where the configured knowledge or artifact capability is expected. The imported `response` values are reference replies; MCS does not compare the agent's answer to them.
11. Apply [evaluation-criteria.md](evaluation-criteria.md) to representative end-to-end conversations and Delivery Packs. Record scores and release gates in [evaluation-scorecard.csv](evaluation-scorecard.csv).
12. Configure the four custom evaluators defined in the rubric for conversation test sets when supported. Keep the CSV template preamble because it records the import constraints supplied by the active MCS tenant.
13. Microsoft Learn currently documents these evaluation methods as powered by the standard harness. If **Evaluation** is unavailable for this GitHub Copilot harness agent, use Preview and apply the same expected responses and rubric manually rather than assuming the CSV can be imported into an unsupported surface.
14. Inspect the reasoning view during tests. Confirm the skill loads for architecture requests and stays unloaded for unrelated prompts.
15. Add the agent to a Power Platform solution for Dev, Test, and Production movement.
16. Publish only after acceptance cases pass, the rubric reaches its release thresholds, all critical gates pass, and attachment behavior is verified in the target channel.

The evaluation rubric and scorecard intentionally remain outside the uploaded skill ZIP. They are evaluator instructions, not runtime knowledge; bundling them could bias the agent toward the test wording.

## Initial deployment boundaries

- For the GitHub Copilot harness, publish the agent to **Teams + Microsoft 365**, turn on **Make agent available in Microsoft 365 Copilot**, and configure **Authenticate with Microsoft** before sharing. Grant recipients viewer access individually or through a security group, or set organization access to **End user access**. Recipients also need a Copilot Studio per-user license.
- A generated URL ending in `/channels/pva-studio/user-connections` is an authenticated connection-setup route, not a chat page or website iframe URL. After access and any per-user connections are configured, users launch the shared agent from their Copilot Studio agent list or Microsoft 365 Copilot.
- The Microsoft Learn website, demo website, Teams, and Agents SDK embedding instructions currently document standard-harness channels. Do not substitute a GitHub-harness `user-connections` URL into `vibehub.html`; a static page cannot grant tenant, environment, agent, license, or connector permissions.
- Output starts with a concise architecture recommendation and one or two scenario-matched Power CAT resources. The advisor then asks whether the user needs focused compliance/assurance, implementation, learning/certification, additional lab/skill/resource detail, or a complete Architecture Delivery Pack as PDF or Interactive HTML.
- When users pause for colleague input, the agent can generate a draft EML and resubmittable discovery HTML. It does not send email directly or retain recipient addresses.
- Requirements-document ingestion depends on file attachments being enabled and supported by the active channel. When unavailable, users can paste relevant text instead.
- Discovery state lasts for the active conversation.
- No conversation data or new pattern is persisted.
- Microsoft Learn website knowledge grounds current product facts. The three curated GitHub knowledge sources support scenario-matched learning and build recommendations; no action tool is required for temporary downloads.
- Building, testing, evaluating, and using the agent consumes Copilot Credits.

Add persistence later through an explicitly approved Dataverse or Power Automate tool. Do not enable broad memory as a substitute for a governed discovery record.

## Update an uploaded skill

1. Change the authoritative skill or its references in the plugin.
2. Run `build-package.ps1` again.
3. In **Build → Skills**, open the uploaded skill, select **... → Replace**, and choose the new ZIP.
4. Rerun the acceptance cases before publishing.
5. Rerun the weighted rubric and compare results with the previous release scorecard.