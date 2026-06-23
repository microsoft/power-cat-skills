import yaml from 'js-yaml';
import JSZip from 'jszip';
import { isSolutionFormat, parseSolutionZip } from './parserSolution.js';

const norm = (s) => (s || '').trim().toLowerCase();
const basename = (p) => p.split('/').pop();

// Unified entry point. Returns { format, solutionName?, version?, sites: [siteModel...] }.
// - "solution"  : modern powerpagecomponent solution zip (one or more sites)
// - "site"      : a single pac powerpages download export (adx_ YAML) -> one site
// - "dataverse" : a classic Dataverse solution with no Power Pages site -> rejected
export async function parseInput(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entries = Object.values(zip.files).filter((e) => !e.dir);

  if (isSolutionFormat(entries)) {
    return parseSolutionZip(zip, entries);
  }

  const site = await parseSiteFromZip(zip, entries);
  if (site.isDataverseSolution) {
    return { format: 'dataverse', solutionName: site.solutionName, solutionComponents: site.solutionComponents, sites: [] };
  }
  site.id = 'site';
  return { format: 'site', solutionName: site.website?.name || 'Power Pages site', version: null, sites: [site] };
}

function tryYaml(text) {
  try { return yaml.load(text) || {}; } catch { return {}; }
}

// Build a data: URI for an asset so it loads inside a sandboxed (scripts-only) iframe.
async function toDataUri(file, mime) {
  if (/^text\/|svg|json|javascript/.test(mime)) {
    const text = await file.async('string');
    if (mime.includes('svg')) {
      return `data:${mime};utf8,${encodeURIComponent(text)}`;
    }
    const b64 = btoa(unescape(encodeURIComponent(text)));
    return { uri: `data:${mime};base64,${b64}`, text };
  }
  const b64 = await file.async('base64');
  return `data:${mime};base64,${b64}`;
}

const MIME = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', css: 'text/css', js: 'text/javascript',
  ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2'
};

export async function parseZip(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entries = Object.values(zip.files).filter((e) => !e.dir);
  return parseSiteFromZip(zip, entries);
}

async function parseSiteFromZip(zip, entries) {
  // Detect a classic Dataverse solution (not a Power Pages site export).
  const isDataverseSolution = entries.some((e) => /(^|\/)solution\.xml$/i.test(e.name)) &&
    !entries.some((e) => /\.webpage\.yml$/i.test(e.name));

  const model = {
    isDataverseSolution,
    website: null,
    webTemplates: new Map(),   // nameLower -> { name, source }
    pageTemplates: new Map(),  // nameLower -> { name, webTemplate }
    pages: [],                 // { name, url, partialurl, pageTemplate, parent, isRoot, order, copyHtml }
    snippets: new Map(),       // nameLower -> { name, value }
    settings: new Map(),       // nameLower -> { name, value }
    weblinkSets: new Map(),    // nameLower -> { name, links:[{name,url,order}] }
    webFiles: new Map(),       // nameLower -> { name, mime, uri, text, isCss }
    forms: [], lists: [], tablePermissions: [], webRoles: [],
    assets: []                 // { id, kind, path, language, code, pageName? }
  };

  if (isDataverseSolution) {
    const sol = await zip.file(entries.find((e) => /(^|\/)solution\.xml$/i.test(e.name)).name).async('string');
    const m = sol.match(/<UniqueName>([^<]+)<\/UniqueName>/i);
    model.solutionName = m ? m[1] : 'Unknown solution';
    model.solutionComponents = (sol.match(/<RootComponent /gi) || []).length;
    return model;
  }

  // index helpers
  const get = (name) => entries.find((e) => e.name.endsWith(name));
  const text = (e) => e.async('string');

  // website
  const websiteEntry = entries.find((e) => /(^|\/)website\.yml$/i.test(e.name));
  if (websiteEntry) {
    const w = tryYaml(await text(websiteEntry));
    model.website = { name: w.adx_name || 'Power Pages site', domain: w.adx_primarydomainname || '' };
  }

  // web templates: pair *.webtemplate.yml with *.webtemplate.source.html in same dir
  for (const e of entries.filter((x) => /\.webtemplate\.yml$/i.test(x.name))) {
    const dir = e.name.slice(0, e.name.lastIndexOf('/'));
    const meta = tryYaml(await text(e));
    const srcEntry = entries.find((x) => x.name.startsWith(dir + '/') && /\.webtemplate\.source\.html$/i.test(x.name));
    const source = srcEntry ? await text(srcEntry) : '';
    const name = meta.adx_name || basename(dir);
    model.webTemplates.set(norm(name), { name, source });
    if (source.trim()) model.assets.push({ id: `webtemplate:${name}`, kind: 'webtemplate', path: `web-templates/${name}.liquid`, language: 'liquid', code: source });
  }

  // page templates
  for (const e of entries.filter((x) => /\.pagetemplate\.yml$/i.test(x.name))) {
    const meta = tryYaml(await text(e));
    const name = meta.adx_name || basename(e.name);
    model.pageTemplates.set(norm(name), { name, webTemplate: meta.adx_webtemplateid || '' });
  }

  // content snippets
  for (const e of entries.filter((x) => /\.contentsnippet\.yml$/i.test(x.name))) {
    const dir = e.name.slice(0, e.name.lastIndexOf('/'));
    const meta = tryYaml(await text(e));
    const valEntry = entries.find((x) => x.name.startsWith(dir + '/') && /\.value\.html$/i.test(x.name));
    const value = valEntry ? await text(valEntry) : (meta.adx_value || '');
    const name = meta.adx_name || basename(dir);
    model.snippets.set(norm(name), { name, value });
  }

  // site settings
  for (const e of entries.filter((x) => /\.sitesetting\.yml$/i.test(x.name))) {
    const meta = tryYaml(await text(e));
    if (meta.adx_name) model.settings.set(norm(meta.adx_name), { name: meta.adx_name, value: meta.adx_value ?? '' });
  }

  // weblink sets
  for (const e of entries.filter((x) => /\.weblinkset\.yml$/i.test(x.name))) {
    const meta = tryYaml(await text(e));
    const links = (meta.weblinks || [])
      .map((l) => ({ name: l.adx_name, url: l.adx_externalurl || l.adx_pageid || '#', order: l.adx_displayorder || 0 }))
      .sort((a, b) => a.order - b.order);
    model.weblinkSets.set(norm(meta.adx_name), { name: meta.adx_name, links });
  }

  // web files (asset + sidecar .webfile.yml)
  for (const e of entries.filter((x) => /\.webfile\.yml$/i.test(x.name))) {
    const meta = tryYaml(await text(e));
    const assetName = e.name.replace(/\.webfile\.yml$/i, '');
    const assetEntry = entries.find((x) => x.name === assetName) ||
      entries.find((x) => basename(x.name) === basename(assetName));
    if (!assetEntry) continue;
    const ext = basename(assetName).split('.').pop().toLowerCase();
    const mime = meta.mimetype || MIME[ext] || 'application/octet-stream';
    const res = await toDataUri(assetEntry, mime);
    const isCss = mime === 'text/css';
    model.webFiles.set(norm(basename(assetName)), {
      name: basename(assetName), mime, isCss,
      uri: typeof res === 'string' ? res : res.uri,
      text: typeof res === 'string' ? null : res.text
    });
    const txt = typeof res === 'string' ? null : res.text;
    if (txt && /css|javascript/.test(mime)) {
      model.assets.push({ id: `webfile:${basename(assetName)}`, kind: 'webfile', path: `web-files/${basename(assetName)}`, language: mime.includes('javascript') ? 'javascript' : 'css', code: txt });
    }
  }

  // dynamic components (metadata only -> placeholders)
  for (const e of entries.filter((x) => /\.basicform\.yml$/i.test(x.name))) {
    const m = tryYaml(await text(e)); model.forms.push({ name: m.adx_name, entity: m.adx_entityname, mode: m.adx_mode });
  }
  for (const e of entries.filter((x) => /\.list\.yml$/i.test(x.name))) {
    const m = tryYaml(await text(e)); model.lists.push({ name: m.adx_name, entity: m.adx_entityname, view: m.adx_view });
  }
  for (const e of entries.filter((x) => /\.tablepermission\.yml$/i.test(x.name))) {
    const m = tryYaml(await text(e));
    model.tablePermissions.push({
      name: m.adx_name, entity: m.adx_entityname, scope: m.adx_scope,
      read: m.adx_read === true || /true/i.test(String(m.adx_read || '')),
      webRole: m.adx_webroleid || ''
    });
  }

  // web pages
  for (const e of entries.filter((x) => /\.webpage\.yml$/i.test(x.name))) {
    const dir = e.name.slice(0, e.name.lastIndexOf('/'));
    const meta = tryYaml(await text(e));
    const copyEntry = entries.find((x) => x.name.startsWith(dir + '/') && /\.webpage\.copy\.html$/i.test(x.name));
    const copyHtml = copyEntry ? await text(copyEntry) : '';
    const jsEntry = entries.find((x) => x.name.startsWith(dir + '/') && /\.webpage\.custom_javascript\.js$/i.test(x.name));
    const customJs = jsEntry ? await text(jsEntry) : '';
    const cssEntry = entries.find((x) => x.name.startsWith(dir + '/') && /\.webpage\.custom_css\.css$/i.test(x.name));
    const customCss = cssEntry ? await text(cssEntry) : '';
    let url = meta.adx_partialurl || '';
    if (meta.adx_isroot === true || url === '/' || /^home$/i.test(meta.adx_name)) url = '/';
    else url = '/' + url.replace(/^\/|\/$/g, '') + '/';
    const pname = meta.adx_name || basename(dir);
    model.pages.push({
      name: pname,
      url,
      partialurl: meta.adx_partialurl,
      pageTemplate: meta.adx_pagetemplateid || '',
      parent: meta.adx_parentpageid || null,
      isRoot: meta.adx_isroot === true || url === '/',
      order: meta.adx_displayorder || 0,
      copyHtml, customJs, customCss, title: meta.adx_title || pname
    });
    if (copyHtml.trim()) model.assets.push({ id: `webpage-copy:${pname}`, kind: 'page-copy', path: `web-pages/${pname}/copy.html`, language: 'liquid', code: copyHtml, pageName: pname });
    if (customJs.trim()) model.assets.push({ id: `webpage-js:${pname}`, kind: 'page-js', path: `web-pages/${pname}/custom.js`, language: 'javascript', code: customJs, pageName: pname });
    if (customCss.trim()) model.assets.push({ id: `webpage-css:${pname}`, kind: 'page-css', path: `web-pages/${pname}/custom.css`, language: 'css', code: customCss, pageName: pname });
  }
  model.pages.sort((a, b) => (a.isRoot ? -1 : b.isRoot ? 1 : a.order - b.order));

  // resolve each page's layout web template via its page template
  for (const p of model.pages) {
    const pt = model.pageTemplates.get(norm(p.pageTemplate));
    const wt = pt && model.webTemplates.get(norm(pt.webTemplate));
    p.layoutSource = wt ? wt.source : '{{ page.adx_copy }}';
  }
  model.assets.sort((a, b) => a.path.localeCompare(b.path));

  return model;
}
