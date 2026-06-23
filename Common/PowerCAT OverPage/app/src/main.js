import { parseInput } from './parser.js';
import { renderPage, findPageByHref } from './renderer.js';
import { flattenFindings, validateFindings } from './findings.js';
import { parseHar, mapRequestToAsset } from './har.js';
import { LOGO } from './logo.js';

const $ = (id) => document.getElementById(id);
const RANK = { high: 3, medium: 2, low: 1 };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mdBold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

for (const img of document.querySelectorAll('.js-logo')) img.src = LOGO;
const fav = $('favicon'); if (fav) fav.href = LOGO;

const state = {
  doc: null,            // parse result { format, solutionName, version, sites:[] }
  site: null,           // active site model
  findingsDoc: null,
  rows: [],             // flattened findings
  har: null,            // parsed har
  view: 'overview',
  page: null,
  asset: null,
  drawerFilter: 'all',
  pendingHighlight: null
};

const els = {
  siteName: $('siteName'), siteSelect: $('siteSelect'), navHead: $('navHead'), navList: $('navList'),
  inventory: $('inventory'), dropzone: $('dropzone'), overview: $('overview'),
  previewWrap: $('previewWrap'), frame: $('previewFrame'), frameHost: $('frameHost'),
  previewPath: $('previewPath'), previewMeta: $('previewMeta'),
  codeWrap: $('codeWrap'), codePre: $('codePre'), codePath: $('codePath'), codeLang: $('codeLang'), codeMeta: $('codeMeta'),
  networkWrap: $('networkWrap'),
  stage: $('stage'), layout: $('layout'), drawer: $('drawer'), drawerList: $('drawerList'),
  drawerScope: $('drawerScope'), findingCount: $('findingCount')
};

/* ===================== loading ===================== */
async function loadZip(buf, label) {
  els.siteName.textContent = label || 'Parsing…';
  let res;
  try { res = await parseInput(buf); }
  catch (err) { alert('Could not read that .zip: ' + err.message); return; }

  if (res.format === 'dataverse') { showSolutionNotice(res); return; }
  if (!res.sites.length || !res.sites.some(s => s.pages.length)) { alert('No Power Pages sites/pages found in that file.'); return; }

  state.doc = res;
  state.site = res.sites[0];
  els.siteName.textContent = `${res.solutionName}${res.version ? ' · v' + res.version : ''}`;
  buildSiteSelect();
  reapplyFindingsToSite();
  els.dropzone.classList.add('hidden');
  setView('overview');
}

function buildSiteSelect() {
  const ss = els.siteSelect;
  if (state.doc.sites.length > 1) {
    ss.classList.remove('hidden');
    ss.innerHTML = state.doc.sites.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join('');
    ss.onchange = () => { state.site = state.doc.sites[ss.value]; reapplyFindingsToSite(); refreshView(); };
  } else ss.classList.add('hidden');
}

/* ===================== findings ===================== */
function loadFindings(doc) {
  const { ok, errors } = validateFindings(doc);
  if (!ok) { alert('Findings file does not match the schema:\n\n• ' + errors.slice(0, 8).join('\n• ') + (errors.length > 8 ? `\n…+${errors.length - 8} more` : '')); return false; }
  state.findingsDoc = doc;
  state.rows = flattenFindings(doc);
  if (state.site) reapplyFindingsToSite();
  els.layout.classList.add('has-findings');
  els.drawer.classList.remove('hidden');
  els.findingCount.textContent = state.rows.length;
  return true;
}

// rows relevant to the active site (+ solution-level), plus per-page index & impact dots
function reapplyFindingsToSite() {
  state.byPage = new Map(); state.dotByPage = new Map(); state.byComponent = new Map();
  const sid = state.site?.id;
  state.siteRows = state.rows.filter(r => r.scope === 'solution' || r.siteId === sid);
  for (const r of state.siteRows) {
    if (r.componentType === 'webpage') {
      const arr = state.byPage.get(r.componentName) || []; arr.push(r); state.byPage.set(r.componentName, arr);
      const cur = state.dotByPage.get(r.componentName);
      if (!cur || RANK[r.impact] > RANK[cur]) state.dotByPage.set(r.componentName, r.impact);
    }
    if (r.componentId) { const a = state.byComponent.get(r.componentId) || []; a.push(r); state.byComponent.set(r.componentId, a); }
  }
}

/* ===================== view switching ===================== */
function setView(view) {
  state.view = view;
  for (const b of $('viewTabs').children) b.classList.toggle('active', b.dataset.view === view);
  for (const el of [els.overview, els.previewWrap, els.codeWrap, els.networkWrap]) el.classList.add('hidden');
  els.dropzone.classList.add('hidden');
  refreshView();
}

function refreshView() {
  if (!state.site) { els.dropzone.classList.remove('hidden'); return; }
  buildNav();
  buildInventory();
  if (state.view === 'overview') { els.overview.classList.remove('hidden'); renderOverview(); }
  else if (state.view === 'preview') { els.previewWrap.classList.remove('hidden'); if (!state.page) state.page = state.site.pages[0]; selectPage(state.page); }
  else if (state.view === 'code') { els.codeWrap.classList.remove('hidden'); if (!state.asset) state.asset = state.site.assets[0]; selectAsset(state.asset); }
  else if (state.view === 'network') { els.networkWrap.classList.remove('hidden'); renderNetwork(); }
}

/* ===================== nav ===================== */
function buildNav() {
  const m = state.site;
  if (state.view === 'code') {
    els.navHead.textContent = `Assets (${m.assets.length})`;
    const groups = {};
    for (const a of m.assets) (groups[a.kind] = groups[a.kind] || []).push(a);
    const order = ['webtemplate', 'page-copy', 'page-js', 'page-css', 'webfile'];
    const label = { webtemplate: 'Web templates', 'page-copy': 'Page copy (Liquid)', 'page-js': 'Page JS', 'page-css': 'Page CSS', webfile: 'Web files' };
    els.navList.innerHTML = order.filter(k => groups[k]).map(k =>
      `<li class="nav-group"><div class="nav-group-head">${label[k] || k}</div><ul>` +
      groups[k].map(a => `<li><button class="nav-item asset-item${state.asset && state.asset.id === a.id ? ' active' : ''}" data-asset="${esc(a.id)}">${dot(a)}${esc(a.path.split('/').slice(-2).join('/'))}</button></li>`).join('') +
      `</ul></li>`).join('');
    for (const b of els.navList.querySelectorAll('.asset-item')) b.onclick = () => selectAsset(m.assets.find(a => a.id === b.dataset.asset));
  } else if (state.view === 'network') {
    els.navHead.textContent = 'Captured pages';
    if (!state.har) { els.navList.innerHTML = `<li class="empty">Load a .har capture (HAR button)</li>`; return; }
    els.navList.innerHTML = state.har.pages.map((p, i) =>
      `<li><button class="nav-item" data-harpage="${i}">${esc(shortUrl(p.url))}<span class="nav-meta">${p.onLoad ? Math.round(p.onLoad) + 'ms' : ''}</span></button></li>`).join('');
    for (const b of els.navList.querySelectorAll('[data-harpage]')) b.onclick = () => { document.getElementById('harpage-' + b.dataset.harpage)?.scrollIntoView({ behavior: 'smooth' }); };
  } else {
    // overview + preview: page tree
    els.navHead.textContent = `Pages (${m.pages.length})`;
    const byParent = new Map();
    for (const p of m.pages) { const k = p.isRoot ? '__root__' : (p.parent || '__root__'); (byParent.get(k) || byParent.set(k, []).get(k)).push(p); }
    const top = [...m.pages.filter(p => p.isRoot), ...m.pages.filter(p => !p.isRoot && !m.pages.some(q => q.name === p.parent))];
    const draw = (page) => {
      const dotImpact = state.dotByPage?.get(page.name);
      const kids = byParent.get(page.name) || [];
      return `<li><button class="nav-item page-item${state.page && state.page.name === page.name && state.view === 'preview' ? ' active' : ''}" data-page="${esc(page.name)}">` +
        `<span class="impact-dot ${dotImpact || 'none'}"></span><span class="nav-name">${esc(page.name)}</span></button>` +
        (kids.length ? `<ul class="nav-children">${kids.map(draw).join('')}</ul>` : '') + `</li>`;
    };
    els.navList.innerHTML = (state.findingsDoc ? `<li><button class="nav-item overview-item${state.view === 'overview' ? ' active' : ''}" data-overview="1">◍ Overview</button></li>` : '') + top.map(draw).join('');
    for (const b of els.navList.querySelectorAll('.page-item')) b.onclick = () => { state.page = m.pages.find(p => p.name === b.dataset.page); setView('preview'); };
    const ov = els.navList.querySelector('[data-overview]'); if (ov) ov.onclick = () => setView('overview');
  }
}
function dot(a) { const imp = state.byComponent ? maxImpactFor(`${assetComponentId(a)}`) : null; return `<span class="impact-dot ${imp || 'none'}"></span>`; }
function assetComponentId(a) {
  if (a.kind === 'webtemplate') return `webtemplate:${a.path.split('/').pop().replace('.liquid', '')}`;
  if (a.pageName) return `webpage:${a.pageName}`;
  if (a.kind === 'webfile') return `webfile:${a.path.split('/').pop()}`;
  return '';
}
function maxImpactFor(cid) {
  const rows = state.byComponent?.get(cid); if (!rows || !rows.length) return null;
  return rows.reduce((m, r) => RANK[r.impact] > RANK[m] ? r.impact : m, 'low');
}

function buildInventory() {
  const m = state.site;
  const rows = [
    ['Pages', m.pages.length], ['Web templates', m.webTemplates.size], ['Page templates', m.pageTemplates.size],
    ['Snippets', m.snippets.size], ['Site settings', m.settings.size],
    ['Nav links', [...m.weblinkSets.values()].reduce((n, s) => n + s.links.length, 0)],
    ['Web files', m.webFiles.size], ['Forms', m.forms.length], ['Lists', m.lists.length],
    ['Table permissions', m.tablePermissions.length], ['Web roles', m.webRoles?.length || 0], ['Code assets', m.assets.length]
  ].filter(([, n]) => n > 0);
  els.inventory.innerHTML = `<div class="sidebar-head">Site inventory</div><ul class="inv-list">` +
    rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('') + `</ul>`;
}

/* ===================== overview ===================== */
function renderOverview() {
  const m = state.site, doc = state.findingsDoc;
  const siteRollup = doc ? (doc.sites.find(s => s.id === m.id) || {}) : {};
  const cats = (siteRollup.categories && siteRollup.categories.length ? siteRollup.categories : doc?.solution?.categories) || [];
  const siteFindingCount = state.siteRows?.length || 0;
  const tiles = cats.map(c => `<div class="ovr-tile impact-${c.impact}"><div class="ovr-tile-cat">${esc(c.category)}</div><div class="ovr-tile-n">${c.componentsAffected ?? ''}</div><div class="ovr-tile-sub">${esc(c.impact)}</div></div>`).join('');
  const summary = siteRollup.summary || doc?.solution?.summary || 'No review loaded. Open a <b>.findings.json</b> from the powercat-overpage skill to overlay findings.';
  els.overview.innerHTML = `
    <div class="ovr-hero"><img src="${LOGO}" class="ovr-logo" alt="Power CAT" />
      <div><h2>${esc(m.name)}</h2>
        <div class="ovr-meta">${esc(state.doc.solutionName)}${state.doc.version ? ' · v' + esc(state.doc.version) : ''} · ${m.pages.length} pages${doc ? ' · ' + siteFindingCount + ' findings' : ''}${state.har ? ' · HAR loaded' : ''}</div></div></div>
    <p class="ovr-summary">${mdBold(summary)}</p>
    ${tiles ? `<div class="ovr-tiles">${tiles}</div>` : ''}
    ${doc ? `<div class="ovr-hint">Use <b>Preview</b> to see findings pinned on pages, <b>Code</b> to inspect Liquid/JS/CSS, and <b>Network</b> for HAR performance.</div>` : `<div class="ovr-hint">Tip: also load a <b>.har</b> capture to map performance findings to requests and code.</div>`}`;
  renderDrawer();
}

/* ===================== preview ===================== */
function selectPage(page) {
  state.page = page;
  els.frame.srcdoc = renderPage(state.site, page, state.byPage?.get(page.name) || []);
  els.previewPath.textContent = page.url;
  const pt = state.site.pageTemplates.get((page.pageTemplate || '').trim().toLowerCase());
  els.previewMeta.textContent = [page.name, pt ? `· ${pt.name}` : ''].join(' ');
  buildNav(); renderDrawer();
}

/* ===================== code viewer ===================== */
function selectAsset(asset, highlight) {
  if (!asset) { els.codePre.innerHTML = '<div class="code-empty">No code assets.</div>'; return; }
  state.asset = asset;
  els.codePath.textContent = asset.path;
  els.codeLang.textContent = asset.language;
  const lines = asset.code.replace(/\r\n/g, '\n').split('\n');
  let hlLine = highlight?.line || null;
  if (!hlLine && highlight?.match) { const i = lines.findIndex(l => l.includes(highlight.match)); if (i >= 0) hlLine = i + 1; }
  els.codePre.innerHTML = lines.map((l, i) => {
    const n = i + 1;
    return `<div class="code-line${n === hlLine ? ' hl' : ''}" id="cl-${n}"><span class="ln">${n}</span><span class="lc">${esc(l) || '&nbsp;'}</span></div>`;
  }).join('');
  els.codeMeta.textContent = `${lines.length} lines`;
  buildNav(); renderDrawer();
  if (hlLine) setTimeout(() => $(`cl-${hlLine}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

/* ===================== network / HAR ===================== */
function renderNetwork() {
  buildNav();
  if (!state.har) { els.networkWrap.innerHTML = `<div class="net-empty"><h2>No HAR loaded</h2><p>Click <b>HAR</b> in the toolbar to load a network capture (.har). Capture it from browser DevTools → Network → Export HAR while browsing the live site.</p></div>`; renderDrawer(); return; }
  const h = state.har;
  const sev = (s) => `<span class="impact-dot ${s}"></span>`;
  els.networkWrap.innerHTML = `
    <div class="net-summary">
      <div class="net-stat"><div class="n">${h.summary.requestCount}</div><div class="l">requests</div></div>
      <div class="net-stat"><div class="n">${(h.summary.totalBytes / 1048576).toFixed(1)}MB</div><div class="l">transferred</div></div>
      <div class="net-stat"><div class="n">${h.pages.length}</div><div class="l">pages</div></div>
      <div class="net-stat"><div class="n">${h.summary.hosts.length}</div><div class="l">hosts</div></div>
      <div class="net-stat"><div class="n">${h.issues.length}</div><div class="l">issues</div></div>
    </div>
    ${h.pages.map((p, i) => `
      <div class="net-page" id="harpage-${i}">
        <div class="net-page-head"><b>${esc(shortUrl(p.url))}</b>
          <span class="net-timings">onLoad <b class="${p.onLoad > 3000 ? 'bad' : ''}">${p.onLoad ? Math.round(p.onLoad) + 'ms' : '—'}</b> · DCL ${p.onContentLoad ? Math.round(p.onContentLoad) + 'ms' : '—'} · ${p.requests} req · ${(p.totalBytes / 1024).toFixed(0)}KB</span>
        </div>
      </div>`).join('')}
    <div class="net-issues-head">Detected issues (${h.issues.length}) — the skill turns the important ones into findings</div>
    <div class="net-issues">${h.issues.slice(0, 60).map(is => netIssueRow(is)).join('')}</div>`;
  for (const el of els.networkWrap.querySelectorAll('.net-issue')) {
    el.onclick = () => { const idx = el.dataset.idx; if (idx != null) jumpToRequestCode(h.entries[+idx]); };
  }
  renderDrawer();
}
function netIssueRow(is) {
  const e = is.idx != null ? state.har.entries[is.idx] : null;
  const mapped = e ? mapRequestToAsset(e, state.doc.sites) : null;
  return `<div class="net-issue" data-idx="${is.idx ?? ''}">
    <span class="impact-dot ${is.severity}"></span>
    <span class="ni-kind">${esc(is.kind)}</span>
    <span class="ni-detail">${esc(is.detail)}</span>
    <span class="ni-url">${esc(shortUrl(is.url || is.pageref || ''))}</span>
    ${mapped && mapped.assetId ? '<span class="ni-code">↦ code</span>' : ''}
  </div>`;
}
function jumpToRequestCode(entry) {
  if (!entry) return;
  const mapped = mapRequestToAsset(entry, state.doc.sites);
  if (mapped && mapped.assetId) {
    const asset = state.site.assets.find(a => a.id === mapped.assetId);
    if (asset) { state.asset = asset; setView('code'); selectAsset(asset); return; }
  }
  // no code mapping: keep on network, flash
}

/* ===================== findings drawer ===================== */
function renderDrawer() {
  if (!state.findingsDoc) { els.drawerScope.innerHTML = ''; els.drawerList.innerHTML = `<div class="drawer-empty">No findings loaded.<br/>Open a <b>.findings.json</b>.</div>`; return; }
  let rows = state.siteRows || [];
  // contextual narrowing
  let scopeLabel = `${state.site.name} · all`;
  if (state.view === 'preview' && state.page) { rows = rows.filter(r => r.componentName === state.page.name || r.scope === 'site' || r.scope === 'solution'); scopeLabel = `Page: ${state.page.name}`; }
  else if (state.view === 'code' && state.asset) { const cid = assetComponentId(state.asset); rows = rows.filter(r => r.componentId === cid || (r.code && r.code.assetPath === state.asset.path)); scopeLabel = `Asset: ${state.asset.path.split('/').pop()}`; }
  if (state.drawerFilter !== 'all') rows = rows.filter(r => r.impact === state.drawerFilter);
  rows = rows.slice().sort((a, b) => RANK[b.impact] - RANK[a.impact]);

  els.drawerScope.innerHTML = `<span class="scope-pill">${esc(scopeLabel)}</span> <span class="scope-count">${rows.length}</span>`;
  els.drawerList.innerHTML = rows.map(r => `
    <div class="finding" data-fid="${esc(r.fid)}">
      <div class="finding-top"><span class="impact-dot ${r.impact}"></span><span class="finding-cat">${esc(r.category)}</span>
        <span class="finding-comp">${esc(r.scope === 'component' ? (r.componentType + ': ' + r.componentName) : r.scope)}</span></div>
      <div class="finding-label">${esc(r.label)}</div>
      <div class="finding-desc">${esc(r.desc)}</div>
      ${r.fix ? `<div class="finding-fix"><b>Fix</b> · ${esc(r.fix)}</div>` : ''}
      <div class="finding-actions">
        ${r.code ? '<span class="fa code">View code</span>' : ''}
        ${r.har ? '<span class="fa har">View request</span>' : ''}
        ${r.anchor && (r.anchor.kind === 'selector' || r.anchor.kind === 'match') ? '<span class="fa prev">Show on page</span>' : ''}
        ${r.source ? `<a class="fa src" href="${esc(r.source)}" target="_blank" rel="noopener">Docs ↗</a>` : ''}
      </div>
    </div>`).join('') || `<div class="drawer-empty">No findings at this scope/filter.</div>`;

  for (const el of els.drawerList.querySelectorAll('.finding')) {
    const r = rows.find(x => x.fid === el.dataset.fid);
    el.querySelector('.fa.code')?.addEventListener('click', (e) => { e.stopPropagation(); openCodeFinding(r); });
    el.querySelector('.fa.har')?.addEventListener('click', (e) => { e.stopPropagation(); openHarFinding(r); });
    el.querySelector('.fa.prev')?.addEventListener('click', (e) => { e.stopPropagation(); openPreviewFinding(r); });
    el.onclick = () => { for (const f of els.drawerList.querySelectorAll('.finding')) f.classList.remove('sel'); el.classList.add('sel'); defaultOpen(r); };
  }
}

function defaultOpen(r) {
  if (r.code) return openCodeFinding(r);
  if (r.har) return openHarFinding(r);
  if (r.anchor && (r.anchor.kind === 'selector' || r.anchor.kind === 'match')) return openPreviewFinding(r);
  if (r.componentType === 'webpage') { const p = state.site.pages.find(p => p.name === r.componentName); if (p) { state.page = p; setView('preview'); } }
}
function openCodeFinding(r) {
  if (!r.code) return;
  const asset = state.site.assets.find(a => a.path === r.code.assetPath) || state.site.assets.find(a => a.path.endsWith(r.code.assetPath));
  if (!asset) { alert('Asset not found: ' + r.code.assetPath); return; }
  state.asset = asset; setView('code'); selectAsset(asset, { line: r.code.line, match: r.code.match });
}
function openHarFinding(r) {
  if (!state.har) { alert('Load the .har capture to view this request.'); return; }
  setView('network');
  // find matching entry and its code, jump to code if mapped, else scroll to issue
  const url = r.har.requestUrl;
  const entry = url ? state.har.entries.find(e => e.url === url || e.url.startsWith(url)) : null;
  if (entry) jumpToRequestCode(entry);
}
function openPreviewFinding(r) {
  const p = state.site.pages.find(p => p.name === r.componentName);
  if (p) { state.page = p; setView('preview'); state.pendingHighlight = r.fid; }
}

/* iframe nav + highlight */
window.addEventListener('message', (e) => {
  if (!state.site || !e.data) return;
  if (e.data.type === 'pp-navigate') { const p = findPageByHref(state.site, e.data.href); if (p) selectPage(p); }
  else if (e.data.type === 'pp-finding') {
    const row = els.drawerList.querySelector(`.finding[data-fid="${cssEsc(e.data.fid)}"]`);
    if (row) { for (const f of els.drawerList.querySelectorAll('.finding')) f.classList.remove('sel'); row.classList.add('sel'); row.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
});
const cssEsc = (s) => String(s).replace(/["\\]/g, '\\$&');
els.frame.addEventListener('load', () => { if (state.pendingHighlight) { try { els.frame.contentWindow.postMessage({ type: 'pp-highlight', fid: state.pendingHighlight }, '*'); } catch {} state.pendingHighlight = null; } });

/* ===================== solution notice ===================== */
function showSolutionNotice(res) {
  els.dropzone.classList.remove('hidden');
  els.siteName.textContent = res.solutionName || 'Dataverse solution';
  els.dropzone.querySelector('.dropzone-inner').innerHTML =
    `<img src="${LOGO}" alt="Power CAT" class="dz-logo" />
     <h2>That's a Dataverse solution without a Power Pages site</h2>
     <p><b>${esc(res.solutionName)}</b></p>
     <p class="muted">Provide a solution that contains a Power Pages site (powerpagecomponent) or a <code>pac powerpages download</code> export, zipped.</p>`;
}

/* ===================== inputs ===================== */
$('fileInput').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) loadZip(await f.arrayBuffer(), 'Loading ' + f.name); });
$('findingsInput').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  if (!state.site) { alert('Load a solution .zip first.'); return; }
  try { if (loadFindings(JSON.parse(await f.text()))) setView('overview'); } catch (err) { alert('Invalid findings JSON: ' + err.message); }
});
$('harInput').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { state.har = parseHar(JSON.parse(await f.text())); setView('network'); }
  catch (err) { alert('Invalid HAR: ' + err.message); }
});
$('themeBtn').addEventListener('click', () => { const r = document.documentElement; r.setAttribute('data-theme', r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
$('viewTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && state.site) setView(b.dataset.view); });
$('deviceToggle')?.addEventListener('click', () => {});
$('drawerFilters').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; for (const x of e.currentTarget.children) x.classList.toggle('active', x === b); state.drawerFilter = b.dataset.impact; renderDrawer(); });

/* drag & drop: zip / json / har */
['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
document.addEventListener('dragover', () => els.stage.classList.add('dragging'));
document.addEventListener('dragleave', e => { if (e.relatedTarget === null) els.stage.classList.remove('dragging'); });
document.addEventListener('drop', async (e) => {
  els.stage.classList.remove('dragging');
  const f = e.dataTransfer?.files?.[0]; if (!f) return;
  if (/\.har$/i.test(f.name)) { try { state.har = parseHar(JSON.parse(await f.text())); setView('network'); } catch (err) { alert('Invalid HAR: ' + err.message); } }
  else if (/\.json$/i.test(f.name)) { if (!state.site) { alert('Load a solution first.'); return; } try { if (loadFindings(JSON.parse(await f.text()))) setView('overview'); } catch (err) { alert('Invalid findings JSON: ' + err.message); } }
  else loadZip(await f.arrayBuffer(), 'Loading ' + f.name);
});

/* helpers */
function shortUrl(u) { try { const x = new URL(u); return x.pathname + (x.search || ''); } catch { return u; } }

/* autoload (skill / hosting) */
(async function autoload() {
  const q = new URLSearchParams(location.search);
  const site = q.get('site'); if (!site) return;
  try {
    await loadZip(await (await fetch(site)).arrayBuffer(), 'Loading…');
    const fnd = q.get('findings'); if (fnd) { try { loadFindings(await (await fetch(fnd)).json()); } catch {} }
    const har = q.get('har'); if (har) { try { state.har = parseHar(await (await fetch(har)).json()); } catch {} }
    setView('overview');
  } catch (err) { console.warn('autoload failed', err); }
})();
