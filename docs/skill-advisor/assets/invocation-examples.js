// Source-backed static metadata. This file never changes catalog action kinds.
// A mention is illustrative natural language, not a verified slash command.
function invocationExampleMetadata(repo, plugin, skillName, text, naturalRef, slashRef, options = {}) {
  const repository = repo === 'pp' ? 'power-platform-skills' : repo === 'cat' ? 'power-cat-skills' : 'Dataverse-skills';
  const commit = repo === 'pp' ? '3e1606be7393d82473c65b2fa22f046ef7bb9c13' : repo === 'cat' ? '609292a242628ea7304459d526ecda70625fc2a9' : 'a2bddb8c4c7f9395a771cf6c85ac701dc437a594';
  const root = `https://github.com/microsoft/${repository}`;
  const directory = options.directory || skillName;
  const skillPath = repo === 'dv' ? `.github/plugins/dataverse/skills/${directory}/SKILL.md` : plugin === 'migration' ? `Power%20Platform%20Migration%20Factory/${directory}/SKILL.md` : `plugins/${plugin}/skills/${directory}/SKILL.md`;
  const readmePath = repo === 'dv' ? 'README.md' : `plugins/${plugin}/README.md`;
  const evidence = ref => `${root}/blob/${options.commit || commit}/${ref.startsWith('R') ? readmePath : ref.startsWith('A') ? 'AGENTS.md' : skillPath}#L${ref.slice(1)}`;
  const source = repo === 'dv' ? `${root}/blob/main/${skillPath}` : `${root}/tree/main/${skillPath.slice(0, -9)}`;
  const note = options.note || (slashRef ? 'Exact slash token documented by the repository; availability depends on the installed compatible host and plugin.' : 'Illustrative skill-name mention, not verified slash syntax; availability depends on the installed compatible host and skill.');
  return {
    source, skillName,
    natural: { text, provenance: options.exact ? 'Repository example' : 'Illustrative intent', url: evidence(naturalRef) },
    direct: { text: slashRef ? `/${skillName}` : `Use ${skillName} to ${text.charAt(0).toLowerCase()}${text.slice(1)}`, kind: slashRef ? 'slash' : 'mention', provenance: slashRef ? 'Repository example' : 'Illustrative intent', url: evidence(slashRef || 'S2') },
    note, userInvocable: true
  };
}

const INVOCATION_EXAMPLES = {
  'skill-66': invocationExampleMetadata('pp', 'power-pages', 'add-cloud-flow', 'When a user submits an application, kick off my existing approval flow', 'R172', 'R170', { exact: true }),
  'skill-30': invocationExampleMetadata('pp', 'mobile-apps', 'add-connector', 'Add a Power Platform connector to my mobile app.', 'S3', 'R252'),
  'skill-110': invocationExampleMetadata('pp', 'code-apps', 'add-connector', 'Add a Power Platform connector to my code app.', 'R40', 'R40'),
  'skill-49': invocationExampleMetadata('pp', 'code-apps', 'add-datasource', 'Recommend the right data source for my code app.', 'R41', 'R41'),
  'skill-86': invocationExampleMetadata('pp', 'power-pages', 'add-sample-data', 'Add sample data to my tables', 'R102', 'R100', { exact: true }),
  'skill-26': invocationExampleMetadata('cat', 'powercat-canvas-apps', 'analyze-canvas-performance', 'Analyze this Canvas App for performance problems.', 'S4', 'A45'),
  'skill-119': invocationExampleMetadata('cat', 'powercat-canvas-apps', 'analyze-canvas-performance', 'Analyze this Canvas App for performance problems.', 'S4', 'A45'),
  'skill-51': invocationExampleMetadata('pp', 'model-apps', 'app-builder', 'Build an app for tracking service requests', 'R109', 'R107', { exact: true }),
  'skill-47': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'assemble-ppmplugin', 'Rerun assembly of my native extension plugin bundle.', 'R106', 'R108', { note: 'Normally orchestrated by /generate-ppmplugin. Direct invocation is documented only for rerunning or debugging this stage; see README lines 106–109.' }),
  'skill-74': invocationExampleMetadata('pp', 'power-pages', 'audit-permissions', 'Check my table permissions for security issues', 'R207', 'R205', { exact: true }),
  'skill-45': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'audit-ppmplugin', 'Rerun the audit of my native extension plugin bundle.', 'R106', 'R108', { note: 'Normally orchestrated by /generate-ppmplugin. Direct invocation is documented only for rerunning or debugging this stage; see README lines 106–109.' }),
  'skill-55': invocationExampleMetadata('pp', 'power-automate', 'browse-flows', 'Browse my Power Automate environments and flows.', 'R41', null),
  'skill-40': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'build-android-binary', 'Rerun the Android binary build for my native extension.', 'R106', 'R107', { note: 'Normally orchestrated by /generate-ppmplugin. Direct invocation is documented only for rerunning or debugging this stage; see README lines 106–109.' }),
  'skill-8': invocationExampleMetadata('pp', 'power-automate', 'build-flow', 'Build a complete Power Automate flow from my description.', 'R43', null),
  'skill-41': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'build-ios-binary', 'Rerun the iOS binary build for my native extension.', 'R106', 'R107', { note: 'Normally orchestrated by /generate-ppmplugin. Direct invocation is documented only for rerunning or debugging this stage; see README lines 106–109.' }),
  'skill-35': invocationExampleMetadata('pp', 'mobile-apps', 'check-updates', 'Check my mobile app for plugin and dependency updates.', 'R256', 'R256'),
  'skill-133': invocationExampleMetadata('dv', '', 'dv-connect', 'Connect to Dataverse', 'R81', null, { exact: true }),
  'skill-125': { source: 'https://github.com/microsoft/copilot-studio-plugin/blob/main/commands/chat.md', skillName: null, userInvocable: false, note: 'Command Markdown, not a named SKILL.md: no frontmatter skill name. This metadata does not enable invocation or imply that the repository command itself is internal-only. Experimental, unsupported plugin; not for production.' },
  'skill-22': { source: 'https://github.com/microsoft/copilot-studio-plugin/blob/main/commands/migrate.md', skillName: null, userInvocable: false, note: 'Command Markdown has no frontmatter skill name. /migrate is documented in commands/migrate.md line 25, but is not exposed as a verified named skill here. Experimental, unsupported plugin; not for production. Migration requires plan approval.' },
  'skill-7': invocationExampleMetadata('pp', 'code-apps', 'create-code-app', 'Create and deploy a new Power Apps code app.', 'R32', 'R32'),
  'skill-56': invocationExampleMetadata('pp', 'power-automate', 'create-flow', 'Guide me through creating a Power Automate flow.', 'R42', null),
  'skill-29': invocationExampleMetadata('pp', 'mobile-apps', 'create-mobile-app', 'Create a Power Apps mobile app.', 'R248', 'R248'),
  'skill-9': invocationExampleMetadata('pp', 'power-pages', 'create-site', 'Create a Power Pages site with React for a job board', 'R47', 'R45', { exact: true }),
  'skill-78': invocationExampleMetadata('pp', 'power-pages', 'create-webroles', 'Create web roles for my site', 'R185', 'R183', { exact: true }),
  'skill-32': invocationExampleMetadata('pp', 'mobile-apps', 'debug-app', 'todos not appearing on home screen', 'S3', 'S3', { exact: true }),
  'skill-46': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'debug-extension', 'I tapped the button and nothing happened — no error, no UI.', 'S31', 'R104', { exact: true }),
  'skill-61': invocationExampleMetadata('pp', 'power-automate', 'debug-flow', 'Help me debug a failed flow run interactively.', 'R44', null),
  'skill-15': invocationExampleMetadata('pp', 'code-apps', 'deploy', 'Build and deploy my code app updates to Power Platform.', 'S3', null),
  'skill-120': invocationExampleMetadata('pp', 'code-apps', 'deploy', 'Build and deploy my code app updates to Power Platform.', 'S3', null),
  'skill-33': invocationExampleMetadata('pp', 'mobile-apps', 'deploy', 'Build and push my mobile app to its configured environment.', 'R257', 'R257'),
  'skill-14': invocationExampleMetadata('pp', 'power-pages', 'deploy-site', 'Deploy my site to Power Pages', 'R58', 'R56', { exact: true }),
  'skill-3': invocationExampleMetadata('cat', 'powercat-code-apps', 'code-apps-design-guide', 'Create a design guide', 'R34', 'R28', { exact: true, directory: 'design-guide' }),
  'skill-37': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'design-native-extension-feature', 'Design a native extension feature for my Canvas app.', 'R98', 'R98'),
  'skill-28': invocationExampleMetadata('pp', 'mobile-apps', 'design-system', 'Create a branded design system for my mobile app.', 'R260', 'R260'),
  'skill-71': invocationExampleMetadata('pp', 'power-pages', 'diagnose-deployment', 'My last deploy failed — figure out why', 'R370', 'R368', { exact: true }),
  'skill-17': invocationExampleMetadata('pp', 'power-automate', 'diagnose-flow', 'Perform a deep diagnosis of my failed flow run.', 'R45', null),
  'skill-89': invocationExampleMetadata('dv', '', 'dv-admin', 'Review the administrative operations available for my Dataverse environment.', 'S3', null),
  'skill-18': invocationExampleMetadata('dv', '', 'dv-admin', 'Review the administrative operations available for my Dataverse environment.', 'S3', null, { note: 'Catalog label combines dv-admin + dv-security, but this source and verified frontmatter identify dv-admin only. This is an illustrative mention, not a combined skill or verified slash.' }),
  'skill-83': invocationExampleMetadata('dv', '', 'dv-connect', 'Connect to Dataverse', 'R81', null, { exact: true }),
  'skill-85': invocationExampleMetadata('dv', '', 'dv-data', 'Import this CSV into the contacts table', 'R90', null, { exact: true }),
  'skill-6': invocationExampleMetadata('dv', '', 'dv-metadata', 'Create a customer feedback table with name, rating, and comment columns', 'R91', null, { exact: true }),
  'skill-81': invocationExampleMetadata('dv', '', 'dv-overview', 'Explain which Dataverse tools fit my project.', 'S3', null),
  'skill-84': invocationExampleMetadata('dv', '', 'dv-query', 'Show me my open deals over $100K closing this quarter', 'R89', null, { exact: true }),
  'skill-88': invocationExampleMetadata('dv', '', 'dv-security', 'Give a teammate access to this Dataverse environment.', 'S3', null),
  'skill-16': invocationExampleMetadata('dv', '', 'dv-solution', 'Pull the schema and pack it into a solution', 'R92', null, { exact: true }),
  'skill-34': invocationExampleMetadata('pp', 'mobile-apps', 'edit-app', 'Improve the search screen to make it easier to use on mobile', 'S19', 'R255', { exact: true }),
  'skill-87': invocationExampleMetadata('dv', '', 'erp-xpp', 'Build and deploy my Finance and Operations X++ customization.', 'S3', null, { commit: '001b31e0c78e63a0675078ad599e44c16078cd7f', note: 'Verified from cached public source evidence; absent from the older local checkout. Illustrative skill-name mention, not verified slash. Windows only; confirm deployment and DB-sync targets; runtime mutations require approval; post-deployment validation is opt-in.' }),
  'skill-50': invocationExampleMetadata('cat', 'powercat-procode-eval', 'eval-generator-code-app', 'Generate code app evals', 'R44', 'R34', { exact: true }),
  'skill-52': invocationExampleMetadata('cat', 'powercat-procode-eval', 'eval-generator-gen-pages', 'Eval my generative page', 'R62', 'R52', { exact: true }),
  'skill-58': invocationExampleMetadata('cat', 'powercat-overflow', 'powercat-overflow', "Review the cloud flows in this solution ZIP against Microsoft's coding guidelines.", 'S3', null),
  'skill-92': invocationExampleMetadata('pp', 'mcp-apps', 'generate-mcp-app-ui', 'Show travel attractions on an interactive map', 'R32', 'R27', { exact: true, note: 'Natural example is the intent argument from the documented command example. Slash token is documented; no arguments or flags are invented.' }),
  'skill-38': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'generate-native-extension', 'Generate Android and iOS source for my native extension.', 'R99', 'R99'),
  'skill-43': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'generate-pcf-companion', 'Generate the dispatcher PCF control for my native extension.', 'R100', 'R100'),
  'skill-42': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'generate-ppmplugin', 'Build and verify my native extension plugin bundle.', 'R102', 'R102'),
  'skill-39': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'generate-ppmplugin-manifest', 'Rerun manifest generation for my native extension bundle.', 'R106', 'R107', { note: 'Normally orchestrated by /generate-ppmplugin. Direct invocation is documented only for rerunning or debugging this stage; see README lines 106–109.' }),
  'skill-5': invocationExampleMetadata('pp', 'model-apps', 'genpage', 'Build a data grid page for my model-driven app', 'R130', 'R128', { exact: true }),
  'skill-70': invocationExampleMetadata('cat', 'powercat-overpage', 'powercat-overpage', 'Review the Power Pages sites in this solution ZIP, using my HAR capture for performance analysis.', 'S8', null),
  'skill-20': invocationExampleMetadata('cat', 'migration', 'infopath-to-canvas', 'Migrate this InfoPath form to a Canvas App.', 'S4', 'A46'),
  'skill-65': invocationExampleMetadata('pp', 'power-pages', 'integrate-backend', 'I need to send a confirmation email when someone submits the contact form', 'R114', 'R112', { exact: true }),
  'skill-73': invocationExampleMetadata('pp', 'power-pages', 'integrate-webapi', 'Connect my site to the Dataverse tables', 'R124', 'R122', { exact: true }),
  'skill-109': invocationExampleMetadata('pp', 'code-apps', 'list-connections', 'List the connection IDs available for my code app.', 'S3', 'S43'),
  'skill-60': invocationExampleMetadata('pp', 'power-automate', 'manage-desktop-flows', 'List and run my desktop flows.', 'R47', null),
  'skill-59': invocationExampleMetadata('pp', 'power-automate', 'manage-flows', 'Help me publish and test my Power Automate flows.', 'R46', null),
  'skill-67': invocationExampleMetadata('pp', 'power-pages', 'manage-headers', 'Fix my CSP errors and harden cookie settings', 'R247', 'R245', { exact: true }),
  'skill-111': invocationExampleMetadata('pp', 'mcp-apps', 'generate-mcp-app-ui', 'Show travel attractions on an interactive map', 'R32', 'R27', { exact: true, note: 'Natural example is the intent argument from the documented command example. Slash token is documented; no arguments or flags are invented.' }),
  'skill-126': invocationExampleMetadata('pp', 'power-pages', 'migrate-bootstrap', 'Upgrade my Power Pages site from Bootstrap 3 to Bootstrap 5', 'R395', 'R393', { exact: true }),
  'skill-21': invocationExampleMetadata('cat', 'migration', 'migrate-to-dataverse', "Replace this Canvas App's data-source references with Dataverse table calls.", 'S4', 'A47'),
  'skill-117': invocationExampleMetadata('cat', 'powercat-overflow', 'powercat-overflow', "Review the cloud flows in this solution ZIP against Microsoft's coding guidelines.", 'S3', null),
  'skill-118': invocationExampleMetadata('cat', 'powercat-overpage', 'powercat-overpage', 'Review the Power Pages sites in this solution ZIP, using my HAR capture for performance analysis.', 'S8', null),
  'skill-53': invocationExampleMetadata('pp', 'model-apps', 'genpage', 'Build a data grid page for my model-driven app', 'R130', 'R128', { exact: true }),
  'skill-2': invocationExampleMetadata('pp', 'power-pages', 'plan-alm', 'Plan how to promote this site to staging and production', 'R269', 'R267', { exact: true }),
  'skill-11': invocationExampleMetadata('cat', 'powercat-overflow', 'powercat-overflow', "Review the cloud flows in this solution ZIP against Microsoft's coding guidelines.", 'S3', null),
  'skill-12': invocationExampleMetadata('cat', 'powercat-overpage', 'powercat-overpage', 'Review the Power Pages sites in this solution ZIP, using my HAR capture for performance analysis.', 'S8', null),
  'skill-31': invocationExampleMetadata('pp', 'mobile-apps', 'preview-screens', 'Generate a new static preview', 'R232', 'R261', { exact: true }),
  'skill-48': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'publish-pcf-companion', 'Publish my dispatcher PCF to a Power Platform environment.', 'R103', 'R103'),
  'skill-63': invocationExampleMetadata('pp', 'power-automate', 'route-environments', 'Resolve which Power Platform environment my flow should use.', 'R48', null),
  'skill-69': invocationExampleMetadata('pp', 'power-pages', 'scan-code', 'Check my source code and dependencies for security issues', 'R227', 'R225', { exact: true }),
  'skill-79': invocationExampleMetadata('pp', 'power-pages', 'security-review', 'Do a full security review before we ship', 'R257', 'R255', { exact: true }),
  'skill-54': invocationExampleMetadata('pp', 'power-automate', 'setup', 'Help me set up the Power Automate prerequisites.', 'S3', null),
  'skill-77': invocationExampleMetadata('pp', 'power-pages', 'setup-auth', 'Set up authentication for my site', 'R195', 'R193', { exact: true }),
  'skill-72': invocationExampleMetadata('pp', 'power-pages', 'setup-datamodel', 'Create Dataverse tables for my site', 'R91', 'R89', { exact: true }),
  'skill-80': invocationExampleMetadata('pp', 'power-pages', 'setup-pipeline', 'Set up a Power Platform Pipeline for automated deployments', 'R316', 'R314', { exact: true }),
  'skill-76': invocationExampleMetadata('pp', 'power-pages', 'setup-solution', 'Package my site into a solution for ALM', 'R283', 'R281', { exact: true }),
  'skill-44': invocationExampleMetadata('pp', 'power-apps-mobile-extension', 'test-native-extension', 'Check that my native extension, manifest, and dispatcher PCF agree.', 'R101', 'R101'),
  'skill-68': invocationExampleMetadata('pp', 'power-pages', 'test-site', 'Run a runtime smoke test on my live Power Pages site.', 'R470', 'R76')
};

// Approved pinned additions, independently classified by source.
Object.assign(INVOCATION_EXAMPLES, {
  "skill-143": {
    "source": "https://github.com/microsoft/power-platform-skills/blob/474e614e1f4c0ec193a9ca01caf86b701c79bc26/plugins/mcp-apps/skills/generate-codeful-mcp-tool/SKILL.md",
    "skillName": "generate-codeful-mcp-tool",
    "userInvocable": true,
    "natural": {
      "text": "Create a codeful MCP tool with JavaScript server logic and registration metadata.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/474e614e1f4c0ec193a9ca01caf86b701c79bc26/plugins/mcp-apps/skills/generate-codeful-mcp-tool/SKILL.md"
    },
    "direct": {
      "text": "/generate-codeful-mcp-tool",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/474e614e1f4c0ec193a9ca01caf86b701c79bc26/plugins/mcp-apps/skills/generate-codeful-mcp-tool/SKILL.md"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Documented alias: /codeful-tool. Generates runtime and metadata, not Agent Skills."
  },
  "skill-144": {
    "source": "https://github.com/microsoft/power-platform-skills/blob/474e614e1f4c0ec193a9ca01caf86b701c79bc26/plugins/mobile-apps/skills/setup-app-insights/SKILL.md",
    "skillName": "setup-app-insights",
    "userInvocable": true,
    "natural": {
      "text": "Enable Application Insights for this app",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/474e614e1f4c0ec193a9ca01caf86b701c79bc26/plugins/mobile-apps/skills/setup-app-insights/SKILL.md"
    },
    "direct": {
      "text": "/setup-app-insights",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/474e614e1f4c0ec193a9ca01caf86b701c79bc26/plugins/mobile-apps/skills/setup-app-insights/SKILL.md"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Explicit opt-in; existing customer-owned workspace-based resource only; telemetry defaults off."
  },
  "skill-145": {
    "source": "https://github.com/microsoft/power-cat-skills/blob/c6c836259e7459bba01305e1d8bf2b9cdbb221e4/Power%20Platform%20Migration%20Factory/Access%20to%20Dataverse%20Migration/SKILL.md",
    "skillName": "powercat-accessmigration",
    "userInvocable": true,
    "natural": {
      "text": "Migrate my Access database to Dataverse with an optional model-driven app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-cat-skills/blob/c6c836259e7459bba01305e1d8bf2b9cdbb221e4/Power%20Platform%20Migration%20Factory/Access%20to%20Dataverse%20Migration/SKILL.md"
    },
    "direct": {
      "text": "Use powercat-accessmigration to migrate my Access database to Dataverse.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-cat-skills/blob/c6c836259e7459bba01305e1d8bf2b9cdbb221e4/Power%20Platform%20Migration%20Factory/Access%20to%20Dataverse%20Migration/SKILL.md"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Source version discrepancy remains: SKILL.md 1.0.0; skill.yaml 0.1.0. No GA inference."
  },
  "skill-146": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/add-skill/SKILL.md",
    "skillName": "add-skill",
    "userInvocable": true,
    "natural": {
      "text": "Add an existing agent skill from my local files or the CAT gallery to my Copilot Studio workspace.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/add-skill/SKILL.md"
    },
    "direct": {
      "text": "Use add-skill to add an Agent Skill to my Copilot Studio agent.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/add-skill/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Agent Skill (SKILL.md). Moved upstream from commands/add-skill.md (a0833db3) to skills/add-skill/SKILL.md (4014ae68); same portal entry. Requires the installed Copilot Studio plugin and Node.js for its helper script; optional import requires a cloned agent workspace. It never pushes or publishes. Illustrative skill-name mention, not documented slash syntax."
  }
});

// Approved Copilot Studio Plugin skills (5 Oct 2026), pinned to 4014ae68;
// direct examples are illustrative skill-name mentions, not documented slash syntax.
Object.assign(INVOCATION_EXAMPLES, {
  "skill-147": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/add-knowledge/SKILL.md",
    "skillName": "add-knowledge",
    "userInvocable": true,
    "natural": {
      "text": "Add our public product documentation website as a knowledge source to my cloned Copilot Studio agent.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/add-knowledge/SKILL.md"
    },
    "direct": {
      "text": "Use add-knowledge to add our documentation website to my cloned Copilot Studio agent.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/add-knowledge/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and a locally cloned agent; it writes local files only, so push and publish separately. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-148": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/clone-agent/SKILL.md",
    "skillName": "clone-agent",
    "userInvocable": true,
    "natural": {
      "text": "Clone my Copilot Studio agent into a local folder so I can edit it.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/clone-agent/SKILL.md"
    },
    "direct": {
      "text": "Use clone-agent to clone my Copilot Studio agent into a local folder.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/clone-agent/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and PAC CLI 2.9.3 or later. It never pushes, publishes or deletes a cloud agent. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-149": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/create-agent/SKILL.md",
    "skillName": "create-agent",
    "userInvocable": true,
    "natural": {
      "text": "Create a new Copilot Studio agent that answers HR policy questions.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/create-agent/SKILL.md"
    },
    "direct": {
      "text": "Use create-agent to create a Copilot Studio agent that answers HR policy questions.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/create-agent/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and PAC CLI 2.9.3 or later. It never publishes; an explicit publish request is handed to publish-agent. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-150": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/delete-agent/SKILL.md",
    "skillName": "delete-agent",
    "userInvocable": true,
    "natural": {
      "text": "Permanently delete the Copilot Studio agent <agent name> from my environment.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/delete-agent/SKILL.md"
    },
    "direct": {
      "text": "Use delete-agent to permanently delete the Copilot Studio agent <agent name>.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/delete-agent/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and PAC CLI 2.9.3 or later. DESTRUCTIVE and irreversible: it permanently deletes the cloud agent only after the skill's exact typed confirmation and cannot be undone. Local files are not deleted and any local workspace becomes stale. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-151": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/publish-agent/SKILL.md",
    "skillName": "publish-agent",
    "userInvocable": true,
    "natural": {
      "text": "Publish my Copilot Studio agent so its current draft goes live.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/publish-agent/SKILL.md"
    },
    "direct": {
      "text": "Use publish-agent to publish my Copilot Studio agent.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/publish-agent/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and PAC CLI 2.9.3 or later. Publishing makes the current cloud draft live after confirmation. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-152": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/pull-agent/SKILL.md",
    "skillName": "pull-agent",
    "userInvocable": true,
    "natural": {
      "text": "Pull the latest remote changes into my local Copilot Studio agent workspace.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/pull-agent/SKILL.md"
    },
    "direct": {
      "text": "Use pull-agent to pull the latest remote changes into my local agent workspace.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/pull-agent/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and PAC CLI 2.9.3 or later. It can merge remote changes into local files. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-153": {
    "source": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/push-agent/SKILL.md",
    "skillName": "push-agent",
    "userInvocable": true,
    "natural": {
      "text": "Push my local Copilot Studio agent changes to the cloud draft without publishing.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/push-agent/SKILL.md"
    },
    "direct": {
      "text": "Use push-agent to push my local agent changes to the cloud draft.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/copilot-studio-plugin/blob/4014ae689d1228d86cb3aaab938b1e66f8e2e10d/skills/push-agent/SKILL.md"
    },
    "note": "Copilot Studio Plugin preview skill: work in progress, supported through GitHub Issues. Requires the installed plugin and PAC CLI 2.9.3 or later. It updates draft content only; publish separately. Illustrative skill-name mention, not documented slash syntax."
  }
});

// Approved pcf plugin skills (20 Oct 2026), pinned to power-platform-skills 336c9c5f.
Object.assign(INVOCATION_EXAMPLES, {
  "skill-154": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/pcf/skills/pcf",
    "skillName": "pcf",
    "userInvocable": true,
    "natural": {
      "text": "Create a PCF star rating control for a model-driven form",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/336c9c5f14f1cb0aef30b4f61cbedf3c06e1a213/plugins/pcf/README.md#L49"
    },
    "direct": {
      "text": "/pcf",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/336c9c5f14f1cb0aef30b4f61cbedf3c06e1a213/plugins/pcf/README.md#L37"
    },
    "note": "Power Platform Skills pcf plugin (Preview). Requires a compatible installed host and the pcf plugin. The repository documents /pcf (or the namespaced /pcf:pcf). Deploy uses pac pcf push with an explicit environment and recorded consent."
  },
  "skill-155": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/pcf/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug in the pcf plugin",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/336c9c5f14f1cb0aef30b4f61cbedf3c06e1a213/plugins/pcf/skills/report-issue/SKILL.md#L4"
    },
    "direct": {
      "text": "Use report-issue to report a bug in the pcf plugin.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/336c9c5f14f1cb0aef30b4f61cbedf3c06e1a213/plugins/pcf/skills/report-issue/SKILL.md#L2"
    },
    "note": "Power Platform Skills pcf plugin (Preview). Requires a compatible installed host and the pcf plugin. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-156": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/pcf/skills/telemetry",
    "skillName": "telemetry",
    "userInvocable": true,
    "natural": {
      "text": "Turn off telemetry",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/336c9c5f14f1cb0aef30b4f61cbedf3c06e1a213/plugins/pcf/skills/telemetry/SKILL.md#L6"
    },
    "direct": {
      "text": "/pcf:telemetry status",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/336c9c5f14f1cb0aef30b4f61cbedf3c06e1a213/plugins/pcf/README.md#L146"
    },
    "note": "Power Platform Skills pcf plugin (Preview). Requires a compatible installed host and the pcf plugin. The repository documents /pcf:telemetry on | off | status; telemetry is default-on and the opt-out stays local."
  }
});

// Approved 26 Oct 2026 additions, pinned to power-platform-skills ea1e2e75 / power-cat-skills 0ddf6a5a.
// skill-159 author-webpage-content is model-only (user-invocable: false) and intentionally has no examples.
Object.assign(INVOCATION_EXAMPLES, {
  "skill-157": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/edit-site",
    "skillName": "edit-site",
    "userInvocable": true,
    "natural": {
      "text": "Turn this downloaded Event Portal into our developer conference site",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/ea1e2e7518e241617475a567068a270c1a40db52/plugins/power-pages/README.md#L91"
    },
    "direct": {
      "text": "/edit-site",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/ea1e2e7518e241617475a567068a270c1a40db52/plugins/power-pages/README.md#L89"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. For PAC CLI-downloaded non-SPA sites only; not for React, Angular, Vue or Astro SPA sites."
  },
  "skill-158": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/analyze-performance",
    "skillName": "analyze-performance",
    "userInvocable": true,
    "natural": {
      "text": "Check my site for performance anti-patterns",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/ea1e2e7518e241617475a567068a270c1a40db52/plugins/power-pages/README.md#L530"
    },
    "direct": {
      "text": "/analyze-performance",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/ea1e2e7518e241617475a567068a270c1a40db52/plugins/power-pages/README.md#L528"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Supports non-SPA sites; SPA projects with powerpages.config.json are rejected. Auto-fixes need per-finding approval."
  },
  "skill-160": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-apps-mobile-extension/skills/telemetry",
    "skillName": "telemetry",
    "userInvocable": true,
    "natural": {
      "text": "Turn off telemetry",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/ea1e2e7518e241617475a567068a270c1a40db52/plugins/power-apps-mobile-extension/skills/telemetry/SKILL.md#L3"
    },
    "direct": {
      "text": "/power-apps-mobile-extension:telemetry status",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/ea1e2e7518e241617475a567068a270c1a40db52/plugins/power-apps-mobile-extension/README.md#L13"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents /power-apps-mobile-extension:telemetry on | off | status. Opt-out stops transmission only; local diagnostic logs continue."
  },
  "skill-161": {
    "source": "https://github.com/microsoft/power-cat-skills/tree/main/plugins/powercat-governance/skills/dev-environment-deprecation-report",
    "skillName": "dev-environment-deprecation-report",
    "userInvocable": true,
    "natural": {
      "text": "How many days until developer environments are suspended?",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/0ddf6a5a7859ba98b84a3adccf6e9d1a92c18aee/plugins/powercat-governance/skills/dev-environment-deprecation-report/SKILL.md#L28"
    },
    "direct": {
      "text": "Use dev-environment-deprecation-report to report which developer environments will be suspended.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-cat-skills/blob/0ddf6a5a7859ba98b84a3adccf6e9d1a92c18aee/plugins/powercat-governance/skills/dev-environment-deprecation-report/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Preview. Needs Power Platform admin rights and the Power Platform for Admins connectors. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-162": {
    "source": "https://github.com/microsoft/power-cat-skills/tree/main/plugins/loop-my-prompt/skills/loop-my-prompt",
    "skillName": "loop-my-prompt",
    "userInvocable": true,
    "natural": {
      "text": "Rewrite this prompt with a concrete feedback loop: [paste prompt].",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/0ddf6a5a7859ba98b84a3adccf6e9d1a92c18aee/plugins/loop-my-prompt/README.md#L13"
    },
    "direct": {
      "text": "/loop-my-prompt",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/0ddf6a5a7859ba98b84a3adccf6e9d1a92c18aee/plugins/loop-my-prompt/README.md#L11"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Instruction-only: it rewrites the prompt and does not run the task inside it."
  }
});

// Approved 16 Nov 2026 additions, pinned to power-platform-skills 198d91b9 / power-cat-skills 67ed2d24 / Dataverse-skills 3821c2c9.
// skill-167 code-app-architect is an agent persona (not a direct user command) and intentionally has no examples.
Object.assign(INVOCATION_EXAMPLES, {
  "skill-163": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/compare-site-configurations",
    "skillName": "compare-site-configurations",
    "userInvocable": true,
    "natural": {
      "text": "My site works in dev but not in the test environment",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L106"
    },
    "direct": {
      "text": "/compare-site-configurations",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L104"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Compares two sites (downloaded folder, URL or website record ID) and produces an HTML report plus a JSON file VS Code can import."
  },
  "skill-164": {
    "source": "https://github.com/microsoft/power-cat-skills/tree/main/plugins/powercat-pcf/skills/create-pcf",
    "skillName": "create-pcf",
    "userInvocable": true,
    "natural": {
      "text": "Create a virtual PCF dataset control for a model-driven subgrid.",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/67ed2d245f8d0cc8024fd2a572b67983567fb520/plugins/powercat-pcf/README.md#L18"
    },
    "direct": {
      "text": "/create-pcf",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/67ed2d245f8d0cc8024fd2a572b67983567fb520/plugins/powercat-pcf/README.md#L12"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Virtual React controls for model-driven apps with platform-provided Fluent UI v9."
  },
  "skill-165": {
    "source": "https://github.com/microsoft/power-cat-skills/tree/main/plugins/powercat-skills-router/skills/powercat-skills-router",
    "skillName": "powercat-skills-router",
    "userInvocable": true,
    "natural": {
      "text": "Find the best available skill for reviewing my Power Automate cloud flows.",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/67ed2d245f8d0cc8024fd2a572b67983567fb520/plugins/powercat-skills-router/README.md#L14"
    },
    "direct": {
      "text": "Use powercat-skills-router to find the best available skill for reviewing my Power Automate cloud flows.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-cat-skills/blob/67ed2d245f8d0cc8024fd2a572b67983567fb520/plugins/powercat-skills-router/skills/powercat-skills-router/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Installation, updates and other changes need your approval; recommendation-only requests make no changes."
  },
  "skill-166": {
    "source": "https://github.com/microsoft/power-cat-skills/tree/main/plugins/powercat-codeappscompact/skills/powercat-codeappscompact",
    "skillName": "powercat-codeappscompact",
    "userInvocable": true,
    "natural": {
      "text": "Create an inventory Code App with search, filters, editable records, and a responsive workspace.",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/67ed2d245f8d0cc8024fd2a572b67983567fb520/plugins/powercat-codeappscompact/README.md#L18"
    },
    "direct": {
      "text": "Use powercat-codeappscompact to build a local-only approvals Code App with nested records, synthetic demo data, accessible editors, and independent acceptance cases.",
      "kind": "mention",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-cat-skills/blob/67ed2d245f8d0cc8024fd2a572b67983567fb520/plugins/powercat-codeappscompact/README.md#L12"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this skill-name mention, not a slash token. Needs Node.js 22.18+; does not deploy apps."
  },
  "skill-168": {
    "source": "https://github.com/microsoft/Dataverse-skills/blob/main/.github/plugins/dataverse/skills/erp-sql/SKILL.md",
    "skillName": "erp-sql",
    "userInvocable": true,
    "natural": {
      "text": "Request temporary Reader-only SQL access to my Finance and Operations development environment.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/Dataverse-skills/blob/3821c2c930f0149777d387cc75e95f9691599161/.github/plugins/dataverse/skills/erp-sql/SKILL.md#L3"
    },
    "direct": {
      "text": "Use erp-sql to request temporary Reader-only SQL access to my Finance and Operations development environment.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/Dataverse-skills/blob/3821c2c930f0149777d387cc75e95f9691599161/.github/plugins/dataverse/skills/erp-sql/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Unified development environments (UDEs) only; you must already hold the environment System administrator (sysAdmin) role. Illustrative skill-name mention, not documented slash syntax."
  }
});

// Approved 16 Nov 2026 full-catalog additions (user: 'everything must be added'), pinned to power-platform-skills 198d91b9. Agent-only workers and user-invocable:false skills intentionally have no examples.
Object.assign(INVOCATION_EXAMPLES, {
  "skill-169": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/canvas-apps/skills/configure-canvas-mcp",
    "skillName": "configure-canvas-mcp",
    "userInvocable": true,
    "natural": {
      "text": "Configure MCP for Canvas Apps",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/canvas-apps/README.md#L112"
    },
    "direct": {
      "text": "/configure-canvas-mcp",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/canvas-apps/README.md#L110"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-170": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/canvas-apps/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the canvas-apps plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/canvas-apps/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "Use report-issue to report a bug with the canvas-apps plugin.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/canvas-apps/skills/report-issue/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-178": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-dataverse",
    "skillName": "add-dataverse",
    "userInvocable": true,
    "natural": {
      "text": "Add Dataverse tables to my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-dataverse/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-dataverse",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L74"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-179": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-sharepoint",
    "skillName": "add-sharepoint",
    "userInvocable": true,
    "natural": {
      "text": "Add SharePoint lists to my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-sharepoint/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-sharepoint",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L75"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-180": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-excel",
    "skillName": "add-excel",
    "userInvocable": true,
    "natural": {
      "text": "Read and write Excel workbook data from my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-excel/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-excel",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L76"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-181": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-onedrive",
    "skillName": "add-onedrive",
    "userInvocable": true,
    "natural": {
      "text": "Let my code app upload and list OneDrive files.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-onedrive/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-onedrive",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L77"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-182": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-teams",
    "skillName": "add-teams",
    "userInvocable": true,
    "natural": {
      "text": "Post Teams channel messages from my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-teams/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-teams",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L78"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-183": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-office365",
    "skillName": "add-office365",
    "userInvocable": true,
    "natural": {
      "text": "Send email and read calendars from my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-office365/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-office365",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L79"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-184": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-azuredevops",
    "skillName": "add-azuredevops",
    "userInvocable": true,
    "natural": {
      "text": "Query Azure DevOps work items from my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-azuredevops/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-azuredevops",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L80"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-185": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-mcscopilot",
    "skillName": "add-mcscopilot",
    "userInvocable": true,
    "natural": {
      "text": "Call my Copilot Studio agent from my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-mcscopilot/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-mcscopilot",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L83"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-186": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/add-workiq",
    "skillName": "add-workiq",
    "userInvocable": true,
    "natural": {
      "text": "Add Microsoft 365 search to my code app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/add-workiq/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-workiq",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L84"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-187": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the code-apps plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "/report-issue",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/code-apps/README.md#L87"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-188": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mcp-apps/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the mcp-apps plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mcp-apps/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "Use report-issue to report a bug with the mcp-apps plugin.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mcp-apps/skills/report-issue/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-189": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/setup-datamodel",
    "skillName": "setup-datamodel",
    "userInvocable": true,
    "natural": {
      "text": "Design the Dataverse data model for my mobile app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/setup-datamodel/SKILL.md#L3"
    },
    "direct": {
      "text": "/setup-datamodel",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L404"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-190": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/add-datasource",
    "skillName": "add-datasource",
    "userInvocable": true,
    "natural": {
      "text": "Add a data source to my mobile app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/add-datasource/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-datasource",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L418"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-191": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/add-dataverse",
    "skillName": "add-dataverse",
    "userInvocable": true,
    "natural": {
      "text": "I need an Asset table with name, serial number, and a lookup to an existing Account",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L230"
    },
    "direct": {
      "text": "/add-dataverse",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L230"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-192": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/add-sharepoint",
    "skillName": "add-sharepoint",
    "userInvocable": true,
    "natural": {
      "text": "Show SharePoint list items in my mobile app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/add-sharepoint/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-sharepoint",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L267"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-193": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/list-connections",
    "skillName": "list-connections",
    "userInvocable": true,
    "natural": {
      "text": "Find the connection ID my mobile app needs.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/list-connections/SKILL.md#L3"
    },
    "direct": {
      "text": "/list-connections",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L313"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-194": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/set-app-registration-native",
    "skillName": "set-app-registration-native",
    "userInvocable": true,
    "natural": {
      "text": "Set up the app registration for my Wrap mobile app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/set-app-registration-native/SKILL.md#L3"
    },
    "direct": {
      "text": "/set-app-registration-native",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L402"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-195": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/add-native",
    "skillName": "add-native",
    "userInvocable": true,
    "natural": {
      "text": "Add a barcode scanner to my mobile app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/add-native/SKILL.md#L3"
    },
    "direct": {
      "text": "/add-native",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L242"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-196": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/add-sample-data",
    "skillName": "add-sample-data",
    "userInvocable": true,
    "natural": {
      "text": "Seed my tables with realistic sample data.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/add-sample-data/SKILL.md#L3"
    },
    "direct": {
      "text": "Use add-sample-data to seed my tables with realistic sample data.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/add-sample-data/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Private Preview."
  },
  "skill-197": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/setup-offline-profile",
    "skillName": "setup-offline-profile",
    "userInvocable": true,
    "natural": {
      "text": "Enable offline mode for my mobile app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/setup-offline-profile/SKILL.md#L3"
    },
    "direct": {
      "text": "/setup-offline-profile",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L420"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-198": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/open-wrap-url",
    "skillName": "open-wrap-url",
    "userInvocable": true,
    "natural": {
      "text": "Open the Wrap page for my app.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/open-wrap-url/SKILL.md#L3"
    },
    "direct": {
      "text": "/open-wrap-url",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L413"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-199": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/mobile-apps/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the mobile-apps plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "/report-issue",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/mobile-apps/README.md#L315"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token. Private Preview."
  },
  "skill-220": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/model-apps/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the model-apps plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/model-apps/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "/report-issue",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/model-apps/README.md#L124"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-221": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/model-apps/skills/telemetry",
    "skillName": "telemetry",
    "userInvocable": true,
    "natural": {
      "text": "Turn off telemetry for the model-apps plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/model-apps/skills/telemetry/SKILL.md#L3"
    },
    "direct": {
      "text": "Use telemetry to turn off telemetry for the model-apps plugin.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/model-apps/skills/telemetry/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-222": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-automate/skills/telemetry",
    "skillName": "telemetry",
    "userInvocable": true,
    "natural": {
      "text": "Turn off telemetry for the power-automate plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-automate/skills/telemetry/SKILL.md#L3"
    },
    "direct": {
      "text": "Use telemetry to turn off telemetry for the power-automate plugin.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-automate/skills/telemetry/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-223": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-automate/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the power-automate plugin.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-automate/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "Use report-issue to report a bug with the power-automate plugin.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-automate/skills/report-issue/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax."
  },
  "skill-224": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/setup",
    "skillName": "setup",
    "userInvocable": true,
    "natural": {
      "text": "Set up Process Intelligence for my Process Mining environment.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/setup/SKILL.md#L3"
    },
    "direct": {
      "text": "Use setup to set up Process Intelligence for my Process Mining environment.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/setup/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-225": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/analytics",
    "skillName": "analytics",
    "userInvocable": true,
    "natural": {
      "text": "Give me an overview of my invoice approval process.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analytics/SKILL.md#L3"
    },
    "direct": {
      "text": "Use analytics to give me an overview of my invoice approval process.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analytics/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-226": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/derive-metric",
    "skillName": "derive-metric",
    "userInvocable": true,
    "natural": {
      "text": "Calculate the average rework rate per department.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/derive-metric/SKILL.md#L3"
    },
    "direct": {
      "text": "Use derive-metric to calculate the average rework rate per department.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/derive-metric/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-227": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/investigate-process",
    "skillName": "investigate-process",
    "userInvocable": true,
    "natural": {
      "text": "Why did order fulfilment slow down last quarter?",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/investigate-process/SKILL.md#L3"
    },
    "direct": {
      "text": "Use investigate-process to why did order fulfilment slow down last quarter?",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/investigate-process/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-228": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/analyze-performance",
    "skillName": "analyze-performance",
    "userInvocable": true,
    "natural": {
      "text": "Where are the bottlenecks in my purchase-to-pay process?",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-performance/SKILL.md#L3"
    },
    "direct": {
      "text": "Use analyze-performance to where are the bottlenecks in my purchase-to-pay process?",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-performance/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-229": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/analyze-variants",
    "skillName": "analyze-variants",
    "userInvocable": true,
    "natural": {
      "text": "Show the slowest variants and repeated work in my process.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-variants/SKILL.md#L3"
    },
    "direct": {
      "text": "Use analyze-variants to show the slowest variants and repeated work in my process.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-variants/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-230": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/analyze-drivers",
    "skillName": "analyze-drivers",
    "userInvocable": true,
    "natural": {
      "text": "Which case attributes are linked to longer durations?",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-drivers/SKILL.md#L3"
    },
    "direct": {
      "text": "Use analyze-drivers to which case attributes are linked to longer durations?",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-drivers/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-231": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/compare-cohorts",
    "skillName": "compare-cohorts",
    "userInvocable": true,
    "natural": {
      "text": "Compare this quarter's process performance with last quarter.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/compare-cohorts/SKILL.md#L3"
    },
    "direct": {
      "text": "Use compare-cohorts to compare this quarter's process performance with last quarter.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/compare-cohorts/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-232": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/analyze-objects",
    "skillName": "analyze-objects",
    "userInvocable": true,
    "natural": {
      "text": "Analyze how orders and deliveries interact in my process.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-objects/SKILL.md#L3"
    },
    "direct": {
      "text": "Use analyze-objects to analyze how orders and deliveries interact in my process.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/analyze-objects/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-233": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/process-intelligence/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Draft a support summary for this failed Process Intelligence request.",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/report-issue/SKILL.md#L3"
    },
    "direct": {
      "text": "Use report-issue to draft a support summary for this failed Process Intelligence request.",
      "kind": "mention",
      "provenance": "Illustrative intent",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/process-intelligence/skills/report-issue/SKILL.md#L2"
    },
    "note": "Requires a compatible installed host and plugin. Illustrative skill-name mention, not documented slash syntax. Needs Node.js 22+, Azure CLI 2.54+ and an authorized Power Automate Process Mining account."
  },
  "skill-234": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/activate-site",
    "skillName": "activate-site",
    "userInvocable": true,
    "natural": {
      "text": "Activate my site",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L135"
    },
    "direct": {
      "text": "/activate-site",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L133"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-235": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/add-localization",
    "skillName": "add-localization",
    "userInvocable": true,
    "natural": {
      "text": "Add French and German to my site",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L523"
    },
    "direct": {
      "text": "/add-localization",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L521"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-236": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/add-seo",
    "skillName": "add-seo",
    "userInvocable": true,
    "natural": {
      "text": "Add SEO to my site",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L554"
    },
    "direct": {
      "text": "/add-seo",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L552"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-237": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/exceptional-web-design",
    "skillName": "exceptional-web-design",
    "userInvocable": true,
    "natural": {
      "text": "Review the design of https://contoso.powerappsportals.com",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L509"
    },
    "direct": {
      "text": "/exceptional-web-design",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L507"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-238": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/add-server-logic",
    "skillName": "add-server-logic",
    "userInvocable": true,
    "natural": {
      "text": "Move my pricing calculation out of the browser and onto the server",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L273"
    },
    "direct": {
      "text": "/add-server-logic",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L271"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-239": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/add-ai-webapi",
    "skillName": "add-ai-webapi",
    "userInvocable": true,
    "natural": {
      "text": "Add AI summaries to my site",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L257"
    },
    "direct": {
      "text": "/add-ai-webapi",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L255"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-240": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/manage-firewall",
    "skillName": "manage-firewall",
    "userInvocable": true,
    "natural": {
      "text": "Block traffic from a specific country and add a rate limit to /login",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L349"
    },
    "direct": {
      "text": "/manage-firewall",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L347"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-241": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/scan-site",
    "skillName": "scan-site",
    "userInvocable": true,
    "natural": {
      "text": "Scan my production site for vulnerabilities",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L329"
    },
    "direct": {
      "text": "/scan-site",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L327"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-242": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/ensure-pipelines-host",
    "skillName": "ensure-pipelines-host",
    "userInvocable": true,
    "natural": {
      "text": "Make sure my tenant has a Power Platform Pipelines host",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L464"
    },
    "direct": {
      "text": "/ensure-pipelines-host",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L462"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-243": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/configure-env-variables",
    "skillName": "configure-env-variables",
    "userInvocable": true,
    "natural": {
      "text": "Make these site settings environment-specific so they differ between dev and prod",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L486"
    },
    "direct": {
      "text": "/configure-env-variables",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L484"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-244": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/export-solution",
    "skillName": "export-solution",
    "userInvocable": true,
    "natural": {
      "text": "Export the solution as a zip for deployment",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L420"
    },
    "direct": {
      "text": "/export-solution",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L418"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-245": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/import-solution",
    "skillName": "import-solution",
    "userInvocable": true,
    "natural": {
      "text": "Import this solution zip into the staging environment",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L431"
    },
    "direct": {
      "text": "/import-solution",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L429"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-246": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/deploy-pipeline",
    "skillName": "deploy-pipeline",
    "userInvocable": true,
    "natural": {
      "text": "Deploy the site to staging via my pipeline",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L453"
    },
    "direct": {
      "text": "/deploy-pipeline",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L451"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-247": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/force-link-environment",
    "skillName": "force-link-environment",
    "userInvocable": true,
    "natural": {
      "text": "This environment is already linked to another pipelines host — force-link it",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L475"
    },
    "direct": {
      "text": "/force-link-environment",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L473"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-248": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/report-issue",
    "skillName": "report-issue",
    "userInvocable": true,
    "natural": {
      "text": "Report a bug with the create-site skill",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L602"
    },
    "direct": {
      "text": "/report-issue",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L600"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  },
  "skill-249": {
    "source": "https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-pages/skills/telemetry",
    "skillName": "telemetry",
    "userInvocable": true,
    "natural": {
      "text": "Turn off telemetry",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L612"
    },
    "direct": {
      "text": "/telemetry",
      "kind": "slash",
      "provenance": "Repository example",
      "url": "https://github.com/microsoft/power-platform-skills/blob/198d91b94abc29fcd59962d6202b454274500411/plugins/power-pages/README.md#L610"
    },
    "note": "Requires a compatible installed host and plugin. The repository documents this slash token."
  }
});
