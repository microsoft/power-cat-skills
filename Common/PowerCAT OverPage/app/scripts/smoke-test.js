// Smoke test for PowerCAT OverPage v2: parse both formats, HAR, render overlay, validate findings.
import { readFileSync } from 'node:fs';
import { parseInput } from '../src/parser.js';
import { renderPage } from '../src/renderer.js';
import { parseHar, mapRequestToAsset } from '../src/har.js';
import { flattenFindings, validateFindings } from '../src/findings.js';

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' - ' + m); if (!c) fails++; };
const ab = (p) => { const b = readFileSync(new URL(p, import.meta.url)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };

/* ---- solution format (real coffee supplier portal) ---- */
const sol = await parseInput(ab('../fixtures/coffee-supplier-portal.zip'));
ok(sol.format === 'solution', 'coffee portal recognised as solution format');
ok(sol.solutionName === 'CoffeeSupplier' && sol.version === '1.0.0.2', 'solution name + version parsed');
ok(sol.sites.length === 1, 'one site');
const site = sol.sites[0];
ok(site.name === 'Supplier Portal', 'site name from snippet (got ' + site.name + ')');
ok(site.pages.length >= 18 && site.pages.length <= 24, 'pages deduped to ~21 (got ' + site.pages.length + ')');
ok(site.pages.filter(p => p.isRoot).length === 1, 'exactly one root/home page');
ok(site.webTemplates.size === 14, '14 web templates');
ok(site.tablePermissions.length === 10, '10 table permissions');
ok(site.assets.length > 30, 'code assets extracted (' + site.assets.length + ')');
ok(site.assets.some(a => a.kind === 'webtemplate' && a.language === 'liquid'), 'has liquid web-template assets');
ok(site.assets.some(a => a.kind === 'page-copy'), 'has page-copy assets');
const home = site.pages.find(p => p.isRoot);
const html = renderPage(site, home, []);
ok(html.includes('<html') && html.includes('</body>'), 'home renders to a document');

/* ---- single-site adx_ export still works ---- */
const single = await parseInput(ab('../fixtures/sample-site.zip'));
ok(single.format === 'site', 'sample-site recognised as single site');
ok(single.sites[0].pages.length === 4, 'sample site 4 pages');
ok(single.sites[0].assets.length > 0, 'sample site assets extracted');

/* ---- HAR ---- */
const har = parseHar(JSON.parse(readFileSync(new URL('../fixtures/ccs-dev.har', import.meta.url), 'utf8')));
ok(har.pages.length === 8, 'HAR: 8 pages');
ok(har.entries.length > 600, 'HAR: 700ish requests (' + har.entries.length + ')');
ok(har.issues.length > 50, 'HAR: issues detected (' + har.issues.length + ')');
ok(har.issues.some(i => i.kind === 'large-script'), 'HAR: large-script issue present');
ok(har.summary.slowestOnLoad && har.summary.slowestOnLoad.onLoad > 3000, 'HAR: slow page detected');
// map a web-file-ish request to a solution asset
const mapped = har.entries.map(e => mapRequestToAsset(e, sol.sites)).filter(Boolean);
ok(mapped.length >= 0, 'HAR->asset mapping runs without error (' + mapped.length + ' mapped)');

/* ---- v2 findings doc validate + flatten + overlay ---- */
const doc = {
  solution: { name: 'CoffeeSupplier', version: '1.0.0.2', summary: 'Overall **OK** with some **high** items.',
    categories: [{ category: 'Security', impact: 'high', componentsAffected: 2, summary: 'x' }],
    findings: [{ category: 'Architecture', impact: 'medium', items: [{ label: 'Many pages', desc: 'd', impact: 'medium', scope: 'solution' }] }] },
  sites: [{ id: site.id, name: site.name, summary: 's',
    categories: [{ category: 'Performance', impact: 'high', componentsAffected: 1, summary: 'p' }],
    findings: [{ category: 'Performance', impact: 'high', items: [{ label: 'Slow home', desc: 'd', impact: 'high', scope: 'site', har: { requestUrl: 'https://x', kind: 'slow-page-load' } }] }],
    components: {
      [`webpage:${home.name}`]: [{ category: 'Accessibility', impact: 'medium', items: [{ label: 'No alt', desc: 'd', impact: 'medium', anchor: { kind: 'selector', value: 'img:not([alt])' } }] }],
      'webtemplate:Breadcrumbs': [{ category: 'Maintainability', impact: 'low', items: [{ label: 'x', desc: 'd', impact: 'low', code: { assetPath: 'web-templates/Breadcrumbs.liquid', match: 'breadcrumb' } }] }]
    } }]
};
const v = validateFindings(doc);
ok(v.ok, 'v2 findings doc validates' + (v.ok ? '' : ' -> ' + v.errors.join('; ')));
const rows = flattenFindings(doc);
ok(rows.length === 4, 'flattened to 4 rows (solution+site+2 component)');
ok(rows.some(r => r.scope === 'solution') && rows.some(r => r.scope === 'site') && rows.some(r => r.scope === 'component'), 'all scopes present');
ok(rows.some(r => r.har) && rows.some(r => r.code) && rows.some(r => r.anchor && r.anchor.kind === 'selector'), 'har/code/anchor refs preserved');

/* ---- validation rejects bad docs ---- */
ok(!validateFindings({}).ok, 'empty rejected');
ok(!validateFindings({ solution: { name: 'a', summary: 'b', categories: [] }, sites: [{ id: 's', name: 'n', components: { 'webpage:H': [{ category: 'Nope', impact: 'high', items: [{ label: 'a', desc: 'b', impact: 'high' }] }] } }] }).ok, 'bad category rejected');

console.log('\n' + (fails ? fails + ' FAILURES' : 'ALL CHECKS PASSED'));
process.exit(fails ? 1 : 0);
