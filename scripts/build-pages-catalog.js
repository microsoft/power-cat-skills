const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const marketplacePath = path.join(root, ".claude-plugin", "marketplace.json");
const migrationRoot = path.join(root, "Power Platform Migration Factory");
const outputPath = path.join(root, "docs", "power-platform-migration-factory", "data", "catalog.json");

const pluginLabels = {
  "powercat-adoption": "Adoption",
  "powercat-canvas-apps": "Canvas Apps",
  "powercat-code-apps": "Code Apps",
  "powercat-dataverse": "Dataverse",
  "powercat-governance": "Governance",
  "powercat-procode-eval": "Pro-Code Eval",
  "powercat-admin-digest": "Admin Digest",
  "powercat-overflow": "OverFlow",
  "powercat-overpage": "OverPage",
};

const skillOverrides = {
  "infopath-to-canvas": {
    description:
      "Assess InfoPath forms, identify fields, rules, views, submit behavior, and workflow dependencies, then shape a Canvas App modernization plan with migration risks called out early.",
    what:
      "Guides modernization from InfoPath forms to Canvas Apps by assessing the legacy form, identifying data and logic patterns, and shaping a Power Apps target experience.",
    when: [
      "You need to retire or replace InfoPath forms.",
      "You want to understand migration complexity before rebuilding.",
      "You need a structured plan for modern forms, data, and workflow.",
    ],
    how: [
      "Breaks down fields, rules, views, and submit behavior.",
      "Maps legacy form intent to Canvas App patterns.",
      "Surfaces migration risks and implementation decisions early.",
    ],
    cardCta: "Forms migration skill",
  },
  "migrate-to-dataverse": {
    description:
      "Analyze SharePoint list-backed app data sources, recommend Dataverse table mappings, and document the app, security, relationship, and ALM changes needed for a safer migration.",
    what:
      "Helps replace SharePoint list-backed app data sources with Dataverse tables, relationships, and implementation guidance that better support scale, security, and app lifecycle needs.",
    when: [
      "A Canvas App has outgrown SharePoint lists.",
      "You need Dataverse security, relationships, ALM, or stronger data modeling.",
      "You are planning a low-risk move from list data to managed tables.",
    ],
    how: [
      "Analyzes list structures and app usage patterns.",
      "Suggests Dataverse table and column mappings.",
      "Documents migration steps and app update considerations.",
    ],
    cardCta: "Dataverse migration skill",
  },
};

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function repoUrl(relativePath) {
  return `https://github.com/microsoft/power-cat-skills/tree/main/${encodeURI(toPosix(relativePath)).replace(/%2F/g, "/")}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function parseFrontMatter(markdown) {
  if (!markdown.startsWith("---")) return {};
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return {};
  const yaml = markdown.slice(3, end).trim();
  const result = {};
  for (const line of yaml.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value;
  }
  return result;
}

function firstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function firstParagraph(markdown) {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?\n---\s*/, "");
  return (
    withoutFrontMatter
      .split(/\r?\n\r?\n/)
      .map((block) => block.replace(/\r?\n/g, " ").trim())
      .find((block) => block && !block.startsWith("#") && !block.startsWith(">") && !block.startsWith("```") && !block.startsWith("$ARGUMENTS")) || ""
  );
}

function stripNoise(value) {
  return String(value || "")
    .replace(/\s*Triggers?:.*$/i, "")
    .replace(/\s*Triggers? includ.*$/i, "")
    .replace(/\s*Use this skill.*$/i, "")
    .replace(/\s*USE WHEN.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(value, maxLength = 180) {
  const cleaned = stripNoise(value);
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

function findSkillMarkdown(skillDir) {
  const preferred = path.join(skillDir, "SKILL.md");
  if (fs.existsSync(preferred)) return preferred;
  const markdown = fs.readdirSync(skillDir).find((entry) => entry.toLowerCase().endsWith(".md"));
  return markdown ? path.join(skillDir, markdown) : null;
}

function skillFromPath(skillPath, plugin) {
  const skillDir = path.join(root, skillPath);
  const markdownPath = findSkillMarkdown(skillDir);
  const markdown = markdownPath ? readTextIfExists(markdownPath) : "";
  const frontMatter = parseFrontMatter(markdown);
  const id = path.basename(skillDir);
  const title = id;
  const heading = firstHeading(markdown);
  const description = summarize(frontMatter.description || firstParagraph(markdown) || plugin.description);
  const pluginLabel = pluginLabels[plugin.name] || plugin.name.replace(/^powercat-/, "").replace(/-/g, " ");
  const tags = [pluginLabel, ...(plugin.tags || [])]
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index)
    .slice(0, 3);

  return {
    id,
    detailId: `${plugin.name}__${id}`,
    title,
    category: pluginLabel,
    plugin: plugin.name,
    pluginLabel,
    description,
    tags,
    what: description,
    when: [
      `Use this when you need ${description.charAt(0).toLowerCase()}${description.slice(1)}`,
      `Use it when the work belongs in the ${pluginLabel} area of the Power CAT marketplace.`,
      "Use it when you want a guided workflow instead of starting from a blank prompt.",
    ],
    how: [
      "Guides the agent through a repeatable Power CAT delivery pattern.",
      "Structures inputs, decisions, and outputs so the work is easier to review.",
      "Links back to the source skill so teams can inspect or extend the workflow.",
    ],
    install: `copilot plugin install ${plugin.name}@power-cat-skills`,
    source: repoUrl(path.relative(root, skillDir)),
    heading,
  };
}

function migrationTrackFromFolder(folder) {
  const fullPath = path.join(migrationRoot, folder);
  const readmePath = path.join(fullPath, "README.md");
  const skillPath = path.join(fullPath, "SKILL.md");
  const readme = readTextIfExists(readmePath);
  const skill = readTextIfExists(skillPath);
  const isSkill = Boolean(skill);
  const frontMatter = parseFrontMatter(skill);
  const id = frontMatter.name || folder;
  const override = skillOverrides[id] || {};
  const description = summarize(
    override.description ||
      frontMatter.description ||
      firstParagraph(readme) ||
      firstParagraph(skill) ||
      `${folder} migration guidance.`
  );

  return {
    id,
    title: isSkill ? id : folder,
    description,
    status: isSkill ? "Available skill" : "Coming soon",
    cta: override.cardCta || (isSkill ? "Available skill" : "Coming soon"),
    kind: isSkill ? "skill" : "track",
    skillId: isSkill ? id : null,
    source: repoUrl(path.relative(root, fullPath)),
  };
}

function buildCatalog() {
  const marketplace = readJson(marketplacePath);
  const plugins = marketplace.plugins
    .filter((plugin) => plugin.name !== "powercat-migration-factory")
    .map((plugin) => ({
      id: plugin.name,
      label: pluginLabels[plugin.name] || plugin.name,
      description: plugin.description,
    }));

  const skills = marketplace.plugins
    .filter((plugin) => plugin.name !== "powercat-migration-factory")
    .flatMap((plugin) => (plugin.skills || []).map((skillPath) => skillFromPath(skillPath, plugin)));

  const migrationPlugin = marketplace.plugins.find((plugin) => plugin.name === "powercat-migration-factory");
  const migrationSkills = migrationPlugin
    ? migrationPlugin.skills.map((skillPath) => {
        const skill = skillFromPath(skillPath, migrationPlugin);
        return { ...skill, ...(skillOverrides[skill.id] || {}) };
      })
    : [];

  const migrationSkillIds = new Set(migrationSkills.map((skill) => skill.id));
  const migrationDetailIds = new Map(migrationSkills.map((skill) => [skill.id, skill.detailId]));
  const migrationTracks = fs
    .readdirSync(migrationRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => {
      const track = migrationTrackFromFolder(entry.name);
      return track.skillId ? { ...track, detailId: migrationDetailIds.get(track.skillId) || null } : track;
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "track" ? -1 : 1;
      return a.title.localeCompare(b.title);
    });

  const details = {};
  for (const skill of [...skills, ...migrationSkills]) {
    details[skill.detailId] = skill;
  }

  for (const track of migrationTracks) {
    if (track.skillId && !migrationSkillIds.has(track.skillId)) {
      console.warn(`Migration track ${track.title} has a SKILL.md but is not listed in marketplace.json`);
    }
  }

  return {
    pageTitle: "Power Platform Accelerators Marketplace",
    plugins,
    skills,
    migrationTracks,
    details,
  };
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(buildCatalog(), null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}`);
