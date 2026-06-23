// A deliberately tiny, forgiving Liquid stubber for static Power Pages preview.
// It does NOT execute real Liquid. It resolves the static bits (snippets, settings,
// includes, nav loops) and replaces server-rendered dynamic tags with labelled placeholders.

const norm = (s) => (s || '').trim().toLowerCase();

// Dynamic, server-rendered tags we cannot run — shown as placeholders instead.
const PLACEHOLDER_TAGS = {
  entitylist: 'List',
  entityview: 'List view',
  entityform: 'Form',
  webform: 'Multi-step form',
  fetchxml: 'FetchXML query',
  chart: 'Chart',
  powerbi: 'Power BI',
  codecomponent: 'Code component',
  searchindexquery: 'Search results'
};

function attrValue(attrs, key) {
  const m = attrs.match(new RegExp(key + '\\s*:\\s*["\']?([^"\'%}]+)["\']?', 'i'));
  return m ? m[1].trim() : '';
}

function placeholderBox(kind, label) {
  return `<div class="pp-placeholder" data-kind="${kind}">
    <div class="pp-ph-badge">${kind}</div>
    <div class="pp-ph-title">${label || kind}</div>
    <div class="pp-ph-sub">Dynamic content — rendered live by Power Pages at runtime</div>
  </div>`;
}

function lookup(map, name) {
  const hit = map.get(norm(name));
  return hit ? hit.value : '';
}

export function render(src, ctx, depth = 0) {
  if (!src || depth > 8) return src || '';
  let out = src;

  // 1. comments
  out = out.replace(/{%-?\s*comment\s*-?%}[\s\S]*?{%-?\s*endcomment\s*-?%}/gi, '');

  // 2. includes -> recursively render the referenced web template
  out = out.replace(/{%-?\s*include\s+['"]([^'"]+)['"][^%]*-?%}/gi, (m, name) => {
    const tpl = ctx.webTemplates.get(norm(name));
    return tpl ? render(tpl.source, ctx, depth + 1) : '';
  });

  // 3. nav loops: {% for x in weblinks["Name"].weblinks %} ... {% endfor %}
  out = out.replace(
    /{%-?\s*for\s+(\w+)\s+in\s+weblinks\[["']([^"']+)["']\]\.weblinks\s*-?%}([\s\S]*?){%-?\s*endfor\s*-?%}/gi,
    (m, varName, setName, inner) => {
      const set = ctx.weblinks.get(norm(setName));
      if (!set) return '';
      return set.links.map((link) =>
        inner
          .replace(new RegExp(`{{\\s*${varName}\\.(name|adx_name)\\s*}}`, 'gi'), link.name || '')
          .replace(new RegExp(`{{\\s*${varName}\\.(url|adx_externalurl)\\s*}}`, 'gi'), link.url || '#')
      ).join('');
    }
  );

  // 4. placeholder block tags (paired) e.g. {% entitylist ... %}...{% endentitylist %}
  for (const [tag, label] of Object.entries(PLACEHOLDER_TAGS)) {
    const paired = new RegExp(`{%-?\\s*${tag}([^%]*)-?%}[\\s\\S]*?{%-?\\s*end${tag}\\s*-?%}`, 'gi');
    out = out.replace(paired, (m, attrs) => placeholderBox(tag, attrValue(attrs, 'name') || label));
    const self = new RegExp(`{%-?\\s*${tag}([^%]*)-?%}`, 'gi');
    out = out.replace(self, (m, attrs) => placeholderBox(tag, attrValue(attrs, 'name') || label));
  }

  // 5. variable interpolation
  out = out.replace(/{{-?\s*([^}]+?)\s*-?}}/g, (m, expr) => {
    expr = expr.trim();
    let mm;
    if (/^page\.(adx_copy|copy)$/i.test(expr)) return ctx.page?.adx_copy ?? '';
    if (/^page\.(adx_name|title|name)$/i.test(expr)) return ctx.page?.name ?? '';
    if ((mm = expr.match(/^snippets\s*[\.\[]\s*["']?([^"'\]]+)["']?\s*\]?$/i))) return lookup(ctx.snippets, mm[1]);
    if ((mm = expr.match(/^settings\s*[\.\[]\s*["']?([^"'\]]+)["']?\s*\]?$/i))) return lookup(ctx.settings, mm[1]);
    return ''; // unknown variable -> empty (matches "no data" preview)
  });

  // 6. strip any remaining unsupported tags
  out = out.replace(/{%-?[\s\S]*?-?%}/g, '');

  return out;
}
