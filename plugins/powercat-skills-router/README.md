# powercat-skills-router

Route Microsoft Power Platform requests to the best-fit specialist skill across the Power CAT and Power Platform marketplaces, with approval-gated installation and execution.

## Skills

- **powercat-skills-router** - Discover and compare specialist skills across both marketplaces, reconcile the selected package with the host's installed state, request approval for necessary changes, and resume the original task with the selected skill.

## Usage

Describe the Power Platform task and whether you want a recommendation or execution:

```text
Find the best available skill for reviewing my Power Automate cloud flows.
Recommend a skill only; do not install or change anything.
```

```text
Choose a skill for building a Power Apps Code App. Compare both marketplaces
and ask before installing any required packages.
```

```text
Find and use the appropriate skill to author a Dataverse Web API query.
Use an already-installed skill if it fits, and ask before making changes.
```

## Notes

This instruction-only plugin searches both public marketplaces:

- [Power CAT Skills](https://github.com/microsoft/power-cat-skills)
- [Power Platform Skills](https://github.com/microsoft/power-platform-skills)

Neither marketplace has automatic priority. Candidates are ranked by task fit,
supported scope, host compatibility, and the smallest necessary installation
scope. The router respects explicitly requested skills and does not route
unrelated requests or select itself.

The executing host must be able to read repository catalogs, discover and load
skills, and carry out the selected specialist's workflow. Installation and
updates require a supported plugin-management interface. The router reports a
blocker when a required capability is unavailable rather than inventing commands
or editing hidden registries.

Marketplace registration, installation, updates, enablement, permission changes,
and data transmission require the applicable approvals. Discovery-only requests
do not make persistent changes. Locally modified packages and unknown provenance
are surfaced rather than silently overwritten.

The plugin bundles no scripts, hooks, MCP servers, or telemetry configuration.
It has no fixed companion-plugin or Power Platform environment dependency;
the selected specialist may have additional prerequisites. Incomplete discovery,
reload requirements, and unfinished execution are reported explicitly.

After publication, install with GitHub Copilot CLI:

```text
copilot plugin marketplace add microsoft/power-cat-skills
copilot plugin install powercat-skills-router@power-cat-skills
```

Start a new conversation if the host requires it to discover the installed skill.
