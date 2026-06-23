// Parser for the modern Power Pages "powerpagecomponent" solution format:
//   powerpagecomponents/<guid>/powerpagecomponent.xml   (+ optional filecontent/<file>)
// A single solution .zip can contain one or more sites (grouped by powerpagesiteid).
// Produces site models compatible with renderer.js (pages, webTemplates, snippets,
// settings, weblinkSets, webFiles, forms, lists, tablePermissions) plus an `assets`
// list (every Liquid/JS/CSS source) for the code viewer.
import JSZip from 'jszip';

// powerpagecomponenttype enum (observed in real exports)
const T = {
  PUBLISHING_STATE: 1, WEBPAGE: 2, WEBFILE: 3, WEBLINKSET: 4, WEBLINK: 5,
  PAGETEMPLATE: 6, CONTENTSNIPPET: 7, WEBTEMPLATE: 8, SITESETTING: 9,
  PAGE_ACCESS_RULE: 10, WEBROLE: 11, BASICFORM: 15, LIST: 17, TABLEPERMISSION: 18
};

const MIME = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', css: 'text/css', scss: 'text/css',
  js: 'text/javascript', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2',
  json: 'application/json'
};

const norm = (s) => (s || '').trim().toLowerCase();
const basename = (p) => p.split('/').pop();

function decodeEntities(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// minimal field extractor for the flat powerpagecomponent.xml
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : null;
}

export function isSolutionFormat(entries) {
  return entries.some((e) => /(^|\/)powerpagecomponents\/[^/]+\/powerpagecomponent\.xml$/i.test(e.name));
}

export async function parseSolutionZip(zip, entries) {
  const compEntries = entries.filter((e) => /\/powerpagecomponent\.xml$/i.test(e.name));
  const solXml = entries.find((e) => /(^|\/)solution\.xml$/i.test(e.name));
  let solutionName = 'Power Pages solution', version = null;
  if (solXml) {
    const t = await zip.file(solXml.name).async('string');
    solutionName = decodeEntities(tag(t, 'UniqueName') || tag(t, 'LocalizedName') || solutionName);
    version = tag(t, 'Version');
  }

  // pass 1: read every component (metadata + parsed content + optional file entry)
  const comps = [];
  const byId = new Map();
  for (const e of compEntries) {
    const xml = await zip.file(e.name).async('string');
    const id = (xml.match(/powerpagecomponentid="([^"]+)"/i) || [])[1] || e.name;
    const type = parseInt(tag(xml, 'powerpagecomponenttype') || '0', 10);
    const name = decodeEntities(tag(xml, 'name') || '');
    const siteId = (tag(xml, 'powerpagesiteid') || '').replace(/<[^>]+>/g, '').trim();
    let content = {};
    const rawContent = tag(xml, 'content');
    if (rawContent) { try { content = JSON.parse(rawContent.trim()); } catch { content = {}; } }
    const dir = e.name.slice(0, e.name.lastIndexOf('/'));
    const fileEntry = entries.find((x) => x.name.startsWith(dir + '/filecontent/'));
    const comp = { id, type, name, siteId, content, fileEntry };
    comps.push(comp);
    byId.set(id, comp);
  }

  // group by site
  const siteIds = [...new Set(comps.map((c) => c.siteId).filter(Boolean))];
  const sites = [];
  for (const siteId of siteIds) {
    const sc = comps.filter((c) => c.siteId === siteId);
    sites.push(await buildSiteModel(zip, siteId, sc, byId, solutionName));
  }

  return { format: 'solution', solutionName, version, sites };
}

async function buildSiteModel(zip, siteId, comps, byId, solutionName) {
  const model = {
    id: siteId, name: '', isDataverseSolution: false,
    website: null,
    webTemplates: new Map(), pageTemplates: new Map(), pages: [],
    snippets: new Map(), settings: new Map(), weblinkSets: new Map(),
    webFiles: new Map(), forms: [], lists: [], tablePermissions: [], webRoles: [],
    assets: [] // { id, kind, path, language, code, pageName? }
  };
  const get = (t) => comps.filter((c) => c.type === t);
  const nameOf = (id) => (byId.get(id) ? byId.get(id).name : '');

  // web templates (type 8): content.source = Liquid
  for (const c of get(T.WEBTEMPLATE)) {
    const source = decodeEntities(c.content.source || '');
    model.webTemplates.set(norm(c.name), { name: c.name, source });
    model.assets.push({ id: `webtemplate:${c.name}`, kind: 'webtemplate', path: `web-templates/${c.name}.liquid`, language: 'liquid', code: source });
  }

  // page templates (type 6): map to web template
  for (const c of get(T.PAGETEMPLATE)) {
    model.pageTemplates.set(norm(c.name), { name: c.name, webTemplate: nameOf(c.content.webtemplateid) });
  }

  // content snippets (type 7)
  for (const c of get(T.CONTENTSNIPPET)) {
    model.snippets.set(norm(c.name), { name: c.name, value: decodeEntities(c.content.value || '') });
  }

  // site settings (type 9)
  for (const c of get(T.SITESETTING)) {
    model.settings.set(norm(c.name), { name: c.name, value: c.content.value ?? '' });
  }

  // web files (type 3): binary in filecontent/
  for (const c of get(T.WEBFILE)) {
    if (!c.fileEntry) continue;
    const fname = basename(c.fileEntry.name);
    const ext = fname.split('.').pop().toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const isText = /css|scss|js|svg|json/.test(ext);
    let uri, text = null;
    if (isText) {
      text = await zip.file(c.fileEntry.name).async('string');
      uri = mime.includes('svg')
        ? `data:${mime};utf8,${encodeURIComponent(text)}`
        : `data:${mime};base64,${btoa(unescape(encodeURIComponent(text)))}`;
      if (/css|scss|js/.test(ext)) {
        model.assets.push({ id: `webfile:${c.name}`, kind: 'webfile', path: `web-files/${fname}`, language: ext === 'js' ? 'javascript' : 'css', code: text });
      }
    } else {
      uri = `data:${mime};base64,${await zip.file(c.fileEntry.name).async('base64')}`;
    }
    model.webFiles.set(norm(fname), { name: fname, mime, isCss: mime === 'text/css', uri, text });
  }

  // weblink sets (type 4) + links (type 5)
  const links = get(T.WEBLINK);
  for (const c of get(T.WEBLINKSET)) {
    const setLinks = links
      .filter((l) => l.content.weblinksetid === c.id)
      .map((l) => ({ name: l.name, url: pageUrl(byId.get(l.content.pageid)) || l.content.externalurl || '#', order: l.content.displayorder || 0 }))
      .sort((a, b) => a.order - b.order);
    model.weblinkSets.set(norm(c.content.display_name || c.name), { name: c.content.display_name || c.name, links: setLinks });
  }

  // forms (type 15), lists (type 17), table permissions (type 18), web roles (type 11)
  for (const c of get(T.BASICFORM))
    model.forms.push({ name: c.name, entity: c.content.entityname, formName: c.content.formname, mode: c.content.mode });
  for (const c of get(T.LIST))
    model.lists.push({ name: c.name, entity: c.content.entityname, view: c.content.view });
  for (const c of get(T.TABLEPERMISSION))
    model.tablePermissions.push({
      name: c.name, entity: c.content.entityname || c.content.entitylogicalname,
      scope: scopeName(c.content.scope), read: !!c.content.read,
      webRole: (c.content.webroleids || []).map((r) => nameOf(r)).join(', ')
    });
  for (const c of get(T.WEBROLE))
    model.webRoles.push({ name: c.name, anonymous: !!c.content.authenticationtype || /anonymous/i.test(c.name), authenticated: /authenticated/i.test(c.name) });

  // web pages (type 2). Enhanced data model: each logical page = a root webpage
  // (partialurl, parent, template, isroot) + one or more content pages (copy/js/css).
  // Merge them by rootwebpageid so we get one entry per page.
  const webpageComps = get(T.WEBPAGE);
  const logical = new Map(); // key -> { root, content }
  for (const c of webpageComps) {
    const ct = c.content || {};
    const isRoot = ct.isroot === true;
    const key = isRoot ? c.id : (ct.rootwebpageid || c.id);
    const slot = logical.get(key) || {};
    if (isRoot) slot.root = c; else slot.content = slot.content || c;
    logical.set(key, slot);
  }
  for (const [, slot] of logical) {
    const rootC = slot.root || slot.content;
    const contentC = slot.content || slot.root;
    const rc = rootC.content || {};
    const cc = contentC.content || {};
    const name = rootC.name || contentC.name;
    const copyHtml = decodeEntities(cc.copy || rc.copy || '');
    const customCss = decodeEntities(cc.customcss || rc.customcss || '');
    const customJs = decodeEntities(cc.customjavascript || rc.customjavascript || '');
    const partial = rc.partialurl ?? cc.partialurl ?? '';
    const isRoot = (rc.isroot === true) && (partial === '' || partial === '/' || /^home$/i.test(name));
    const url = isRoot ? '/' : '/' + String(partial).replace(/^\/|\/$/g, '') + '/';
    const page = {
      id: rootC.id, name, url, partialurl: partial,
      pageTemplate: nameOf(rc.pagetemplateid || cc.pagetemplateid),
      parentId: rc.parentpageid, parent: nameOf(rc.parentpageid),
      isRoot, order: rc.displayorder ?? cc.displayorder ?? 0,
      copyHtml, customCss, customJs, title: cc.title || rc.title || name,
      hidden: rc.hiddenfromsitemap === true
    };
    model.pages.push(page);
    if (copyHtml.trim()) model.assets.push({ id: `webpage-copy:${name}`, kind: 'page-copy', path: `web-pages/${name}/copy.html`, language: 'liquid', code: copyHtml, pageName: name });
    if (customJs.trim()) model.assets.push({ id: `webpage-js:${name}`, kind: 'page-js', path: `web-pages/${name}/custom.js`, language: 'javascript', code: customJs, pageName: name });
    if (customCss.trim()) model.assets.push({ id: `webpage-css:${name}`, kind: 'page-css', path: `web-pages/${name}/custom.css`, language: 'css', code: customCss, pageName: name });
  }
  model.pages.sort((a, b) => (a.isRoot ? -1 : b.isRoot ? 1 : a.order - b.order));

  // resolve each page's layout web template via its page template
  for (const p of model.pages) {
    const pt = model.pageTemplates.get(norm(p.pageTemplate));
    const wt = pt && model.webTemplates.get(norm(pt.webTemplate));
    p.layoutSource = wt ? wt.source : '{{ page.adx_copy }}';
  }

  // site name: a "Browser Title Suffix" snippet (strip leading separators), else solution name
  const suffix = (model.snippets.get('browser title suffix')?.value || '').replace(/^[\s:|\-–—]+/, '').trim();
  model.name = suffix || solutionName;
  model.website = { name: model.name, domain: '' };
  model.assets.sort((a, b) => a.path.localeCompare(b.path));
  return model;
}

function pageUrl(comp) {
  if (!comp || !comp.content) return null;
  const u = comp.content.partialurl;
  if (comp.content.isroot || /^home$/i.test(comp.name)) return '/';
  return u ? '/' + String(u).replace(/^\/|\/$/g, '') + '/' : null;
}

function scopeName(v) {
  // adx_scope option set
  const map = { 756150000: 'Global', 756150001: 'Contact', 756150002: 'Account', 756150003: 'Self', 756150004: 'Parent' };
  return map[v] || (typeof v === 'string' ? v : 'Global');
}
