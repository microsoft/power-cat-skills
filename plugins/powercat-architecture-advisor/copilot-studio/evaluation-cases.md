# Copilot Studio acceptance cases

Run these in the agent **Preview** experience. Use the reasoning view to verify whether the skill loaded; don't ask the agent whether it loaded a skill.

Score representative end-to-end runs with [evaluation-criteria.md](evaluation-criteria.md) and record results in [evaluation-scorecard.csv](evaluation-scorecard.csv). Acceptance cases verify specific behaviors; the weighted rubric evaluates the quality of the complete process and Delivery Pack.

For a directly importable MCS conversation test set, use [mcs-conversation-evals.csv](mcs-conversation-evals.csv). It follows the tenant-provided `conversationNumber`, `question`, and `response` template and covers both stateful multi-turn journeys and focused one-turn boundaries. Use the cases below for additional Preview checks that require attachments or detailed artifact inspection.

| ID | Starting prompt | Expected behavior |
|---|---|---|
| ROUTE-01 | `We need an internal app to track equipment inspections. What should we build?` | Skill loads, fitness check passes, identifies applicable user-facing sections, and asks exactly three scenario-specific questions for Goals & People in one message. |
| FORMAT-01 | Inspect any discovery section. | It has a section heading, quiet `Section X of N` line, three numbered bold questions with whitespace, short answer cues, and a paragraph-answer invitation. It has no progress bar, custom font styling, or long questionnaire. |
| ROUTE-02 | `Write a poem about a factory.` | Skill stays unloaded and the agent briefly explains its Power Platform architecture scope. |
| FIT-01 | `Design an emergency dispatch platform that must route calls in under one second.` | Skill loads and rejects Power Platform for the life-safety core before normal discovery, without assuming a country-specific emergency number or vendor. |
| REGION-01 | Start with no country or region in the profile or scenario. | Before normal discovery, the agent asks where the solution is deployed and where users or regulated data are located. |
| REGION-02 | Runtime provides only language and time zone. | Agent uses them for wording and date/time presentation but still asks for country or region before regional compliance guidance. |
| REGION-03 | Scenario is deployed in India with users in India and the EU. | Agent keeps deployment, user, and data regions distinct; it does not default to UK or US rules and checks EU scope only for affected users/data. |
| REGION-04 | US healthcare scenario. | Agent raises HIPAA and Microsoft agreement validation after US scope is confirmed. The same branch does not fire solely from healthcare keywords in a non-US scenario. |
| UX-01 | Start the patient-referral sample and answer the first three questions in one paragraph. | Agent maps the paragraph to the current section, acknowledges it briefly, and presents the next applicable section with three questions. |
| UX-02 | Complete all applicable sections, then overwrite one assumption naturally. | Assumptions appear once at the end. Agent acknowledges the correction and proceeds without another confirmation or restarting discovery. |
| UX-03 | Include several section answers in the initial scenario. | Agent does not repeat answered facts; it skips fully answered sections and uses the LLM to select three unresolved questions per remaining applicable section. |
| UPLOAD-01 | Attach a readable requirements document with users, process, data, integrations, and region. | Agent extracts those facts, summarizes at most five architecture-shaping points, and asks only about material gaps without requesting re-entry. |
| UPLOAD-02 | Attach a file the agent cannot read. | Agent identifies the unreadable attachment and invites a supported document or pasted text without pretending it extracted content. |
| UX-04 | `Parents need to sign in and view their child's attendance.` | Discovery recognizes external users and routes the front end toward Power Pages rather than an internal Canvas app. |
| FIT-02 | `Our team has no professional developers, but everyone has an LLM coding agent in VS Code and one person will own reviews, testing, deployment, and support. We want generally available technology only.` | The absence of a professional-developer job title does not cap code apps. The advisor treats the LLM coding agent and Code Apps SDK as viable build capacity, evaluates the named production ownership, and still rules out managed apps because they are in preview. |
| FIT-04 | `Our team has no professional developers, but we use LLM coding agents in VS Code, will adopt Git, have a named production owner, and accept preview technology.` | The absence of a professional-developer job title does not cap managed apps. The advisor treats the coding agent and Managed Apps SDK as viable build capacity, then evaluates Git adoption, preview tolerance, and accountable review, testing, security, deployment, maintenance, and support. |
| AI-01 | `We do not want AI involved in the delivered solution.` | Vibe-built apps and custom agents aren't primary recommendations. |
| STATE-01 | Start ROUTE-01, answer one section, then say `Go back and change my user count to 2,000.` | The earlier answer is revised and later scale guidance uses 2,000 users. |
| STATE-02 | During discovery say `Show me your assumptions, then continue.` | The agent lists user-facing assumptions without exposing hidden reasoning, then resumes the correct section. |
| DEFAULT-01 | During discovery say `Use safe defaults for everything else.` | The agent identifies defaults as assumptions, confirms them, and completes the recommendation. |
| FIT-03 | Inspect option fit and final stack confidence. | Numeric scores remain hidden. Each option shows fit, discovery-based evidence, and a watch-out. Stack confidence is High/Medium/Low based on confirmed-input completeness and names material gaps. |
| OUTPUT-01 | Complete a normal internal-app discovery. | Chat contains a 220–340 word table-free recommendation with one or two verified, scenario-matched links under **Power CAT Recommended Resources**, followed by a question offering additional outputs for Security/compliance/assurance, Implementation plan, Learning/certifications, More labs/skills/build resources, the complete Delivery Pack, or Nothing else. It does not front-load detailed outputs or a resource catalog. |
| OUTPUT-02 | Select `5`, then `PDF`, after OUTPUT-01; also test a direct `PDF` request. | Agent returns one valid, selectable-text Architecture Delivery Pack PDF containing decision brief, requirements, architecture, implementation blueprint, roadmap, and appendices. A direct format request bypasses the menu. Official icons remain undistorted beside product labels. |
| OUTPUT-03 | Select `5`, then `Interactive HTML`, after OUTPUT-01. | Agent returns one self-contained HTML Delivery Pack with Decision, Requirements, Architecture, Implementation, Roadmap, and Appendices tabs. Official SVGs are embedded as data URIs and Print / Save as PDF includes all parts. |
| OUTPUT-04 | Select `Nothing else` or say `No download` after OUTPUT-01. | Agent ends without generating an artifact. |
| OUTPUT-05 | After OUTPUT-01 select `1 and 4`. | Agent returns only focused security/compliance/assurance and additional scenario-matched labs/skills/build resources, verifies certification and resource claims, avoids repeating the decision summary or initial resources, and briefly offers the remaining choices. |
| OUTPUT-06 | After OUTPUT-01 select `3`. | Agent provides role-relevant learning and current certifications to consider, clearly separates formal certifications from optional learning, and does not claim completion or applicability without verification. |
| EMAIL-01 | Mid-discovery say `I need colleagues to answer these. Email this discovery.` then provide To/Cc. | Agent returns a draft `.eml` and resubmittable `.html`, uses the exact scenario subject pattern, distinguishes questions/answers/assumptions accessibly, and does not claim to send or retain addresses. |
| EMAIL-02 | Supply an email value containing a line break or header text. | Agent rejects the unsafe value and does not generate an injectable EML header. |
| KNOW-01 | Ask for a recommendation where preview status or licensing changes the fit. | Agent consults configured Microsoft Learn knowledge, distinguishes sourced facts from recommendation reasoning, and lists only sources actually used. |
| RESOURCE-01 | Complete a recommendation for an inexperienced team building an app with an agent and ask what can help them learn and build it. | The advisor recommends only relevant items from the Apps & Agents Workshop, Power CAT Skills, and Power Platform Resources; explains why each fits and when to use it; uses verified titles and links; and keeps Microsoft Learn authoritative for product facts. |
| PRIV-01 | Include a real organization and internal system name in the scenario. | Final reusable architecture artifacts use generic descriptors and don't claim to persist the names. |
| LEARN-01 | Use a domain not represented in the skill. | The agent derives a candidate pattern and returns it under **Pattern feedback** without claiming the package was updated. |
| FILE-01 | `Save the report as PDF.` | The agent creates a temporary sandbox PDF attachment and doesn't claim it wrote directly to the user's Desktop or durable storage. |

## Multi-turn completion check

For one representative scenario, complete every discovery section rather than using defaults. Verify:

- exactly one section is asked at a time;
- corrections survive later turns;
- compliance flags raised from the initial scenario appear at the correct gate;
- every recommended component traces to a stated business capability;
- every required capability is addressed or explicitly deferred; and
- the response doesn't mention skill routing, package files, source control, or hidden calculations;
- the chat summary remains concise; and
- the selected report format is honored without generating unrequested formats.