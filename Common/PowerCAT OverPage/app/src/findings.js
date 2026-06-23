// Consumer-side helpers for a PowerCAT OverPage v2 findings document (multi-site).
// Findings are AI-authored by the powercat-overpage skill; this module only reads them:
// validates structure against findings.schema.json (lightweight) and flattens for the UI.

const IMPACTS = ['high', 'medium', 'low'];
const CATEGORIES = ['Security', 'Performance', 'Accessibility', 'Maintainability', 'Architecture', 'Reliability', 'SEO'];
const ANCHOR_KINDS = ['component', 'selector', 'match'];
const RANK = { high: 3, medium: 2, low: 1 };

export function validateFindings(doc) {
  const errors = [];
  const E = (m) => errors.push(m);
  if (!doc || typeof doc !== 'object') return { ok: false, errors: ['Root is not an object'] };

  const s = doc.solution;
  if (!s || typeof s !== 'object') E('Missing "solution" object');
  else {
    if (!s.name) E('solution.name required');
    if (!s.summary) E('solution.summary required');
    if (!Array.isArray(s.categories)) E('solution.categories must be an array');
    else s.categories.forEach((c, i) => validateRollup(c, `solution.categories[${i}]`, E));
    if (s.findings) validateGroups(s.findings, 'solution.findings', E);
  }

  if (!Array.isArray(doc.sites)) E('Missing "sites" array');
  else doc.sites.forEach((site, si) => {
    const at = `sites[${si}]`;
    if (!site.id) E(`${at}.id required`);
    if (!site.name) E(`${at}.name required`);
    if (site.categories) site.categories.forEach((c, i) => validateRollup(c, `${at}.categories[${i}]`, E));
    if (site.findings) validateGroups(site.findings, `${at}.findings`, E);
    if (site.components) {
      for (const [key, groups] of Object.entries(site.components)) {
        if (!/^[a-z]+:.+$/.test(key)) E(`${at}.components key must be "<type>:<name>": ${key}`);
        validateGroups(groups, `${at}.components["${key}"]`, E);
      }
    }
  });
  return { ok: errors.length === 0, errors };
}

function validateRollup(c, at, E) {
  if (!CATEGORIES.includes(c?.category)) E(`${at}.category invalid: ${c?.category}`);
  if (!IMPACTS.includes(c?.impact)) E(`${at}.impact invalid: ${c?.impact}`);
  if (!c?.summary) E(`${at}.summary required`);
}

function validateGroups(groups, at, E) {
  if (!Array.isArray(groups)) { E(`${at} must be an array`); return; }
  groups.forEach((g, gi) => {
    if (!CATEGORIES.includes(g?.category)) E(`${at}[${gi}].category invalid: ${g?.category}`);
    if (!IMPACTS.includes(g?.impact)) E(`${at}[${gi}].impact invalid: ${g?.impact}`);
    if (!Array.isArray(g?.items) || g.items.length === 0) { E(`${at}[${gi}].items must be non-empty`); return; }
    g.items.forEach((it, ii) => {
      const a = `${at}[${gi}].items[${ii}]`;
      if (!it?.label) E(`${a}.label required`);
      if (!it?.desc) E(`${a}.desc required`);
      if (!IMPACTS.includes(it?.impact)) E(`${a}.impact invalid: ${it?.impact}`);
      if (it?.anchor) {
        if (!ANCHOR_KINDS.includes(it.anchor.kind)) E(`${a}.anchor.kind invalid`);
        if ((it.anchor.kind === 'selector' || it.anchor.kind === 'match') && !it.anchor.value)
          E(`${a}.anchor.value required for "${it.anchor.kind}"`);
      }
      if (it?.code && !it.code.assetPath) E(`${a}.code.assetPath required`);
    });
  });
}

// Flatten all findings (solution + per-site + per-component) into sortable rows.
function rowsFromGroups(groups, ctx) {
  const out = [];
  (groups || []).forEach((g) => {
    g.items.forEach((it, i) => {
      out.push({
        fid: `${ctx.fidBase}#${g.category}#${i}`,
        scope: it.scope || ctx.scope,
        siteId: ctx.siteId || null,
        componentId: ctx.componentId || null,
        componentType: ctx.componentType || null,
        componentName: ctx.componentName || null,
        category: g.category, impact: it.impact,
        label: it.label, desc: it.desc, fix: it.fix, rule: it.rule, source: it.source,
        anchor: it.anchor || (ctx.componentId ? { kind: 'component' } : null),
        code: it.code || null, har: it.har || null
      });
    });
  });
  return out;
}

export function flattenFindings(doc) {
  const rows = [];
  rows.push(...rowsFromGroups(doc.solution?.findings, { fidBase: 'solution', scope: 'solution' }));
  for (const site of doc.sites || []) {
    rows.push(...rowsFromGroups(site.findings, { fidBase: `site:${site.id}`, scope: 'site', siteId: site.id }));
    for (const [componentId, groups] of Object.entries(site.components || {})) {
      const [componentType, ...rest] = componentId.split(':');
      const componentName = rest.join(':');
      rows.push(...rowsFromGroups(groups, {
        fidBase: `site:${site.id}:${componentId}`, scope: 'component',
        siteId: site.id, componentId, componentType, componentName
      }));
    }
  }
  return rows.sort((a, b) => RANK[b.impact] - RANK[a.impact]);
}

export const CATEGORY_LIST = CATEGORIES;
