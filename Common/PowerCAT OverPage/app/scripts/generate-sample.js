// Generates a sample Power Pages site export (.zip) that mirrors the
// `pac powerpages download` enhanced-data-model layout closely enough to demo the previewer.
import JSZip from 'jszip';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = 'contoso-community-portal';
const zip = new JSZip();
const f = (p, c) => zip.file(`${ROOT}/${p}`, c);

/* ---------------- website ---------------- */
f('website.yml', `adx_name: Contoso Community Portal
adx_primarydomainname: contoso-community.powerappsportals.com
adx_website_language: 1033
adx_defaultlanguage: English (United States)
`);

/* ---------------- web templates (layout + chrome) ---------------- */
const webtemplates = {
  'Layout 1 Column': `{% include 'Site Header' %}
<main class="page-main">
  {{ page.adx_copy }}
</main>
{% include 'Site Footer' %}`,
  'Site Header': `<header class="site-header">
  <a class="site-logo" href="/">
    <img src="contoso-logo.svg" alt="Contoso" />
    <span>{{ snippets["Brand/Name"] }}</span>
  </a>
  <nav class="site-nav">
    {% for link in weblinks["Primary Navigation"].weblinks %}
    <a href="{{ link.url }}">{{ link.name }}</a>
    {% endfor %}
  </nav>
  <a class="site-cta" href="/contact/">{{ snippets["Header/CTA Label"] }}</a>
  <script>/* page analytics */ window.__contosoAnalytics = true;</script>
</header>`,
  'Site Footer': `<footer class="site-footer">
  <div class="footer-brand">{{ snippets["Footer/Copyright"] }}</div>
  <div class="footer-addr">{{ settings["Contoso/Address"] }}</div>
</footer>`
};
for (const [name, src] of Object.entries(webtemplates)) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  f(`web-templates/${slug}/${slug}.webtemplate.yml`, `adx_name: ${name}\nadx_websiteid: Contoso Community Portal\n`);
  f(`web-templates/${slug}/${slug}.webtemplate.source.html`, src);
}

/* ---------------- page templates ---------------- */
f('page-templates/standard.pagetemplate.yml',
  `adx_name: Standard\nadx_webtemplateid: Layout 1 Column\nadx_type: 756150001\nadx_isdefault: true\n`);

/* ---------------- web pages ---------------- */
const pages = [
  {
    name: 'Home', slug: 'home', url: '/', root: true, order: 1,
    copy: `<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">{{ snippets["Home/Eyebrow"] }}</p>
    <h1>Build a stronger community, together.</h1>
    <p class="lead">Contoso connects neighbours, local services, and city resources in one friendly place.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="/services/">Explore services</a>
      <a class="btn btn-ghost" href="/about/">Our story</a>
    </div>
  </div>
  <img class="hero-img" src="hero.svg" alt="Community" />
</section>

<section class="features">
  <div class="card"><div class="card-ic">🏙️</div><h3>City services</h3><p>Find permits, waste pickup and parking in seconds.</p></div>
  <div class="card"><div class="card-ic">🤝</div><h3>Local groups</h3><p>Join 240+ neighbourhood and volunteer groups.</p></div>
  <div class="card"><div class="card-ic">📅</div><h3>Events</h3><p>Markets, cleanups and town halls near you.</p></div>
</section>

<section class="news">
  <h2>Latest news</h2>
  {% entitylist name:"News Articles" %}
    {% comment %} server renders a CMS-driven list of news here {% endcomment %}
  {% endentitylist %}
</section>

<section class="cta-band">
  <h2>{{ snippets["Home/CTA Heading"] }}</h2>
  <a class="btn btn-light" href="/contact/">Get in touch</a>
</section>`
  },
  {
    name: 'About', slug: 'about', url: '/about/', order: 2,
    copy: `<section class="text-hero"><h1>About Contoso Community</h1>
<p class="lead">We are a non-profit making local life easier and more connected since 2014.</p></section>
<section class="split">
  <div><h2>Our mission</h2><p>Give every resident one trusted place to access services, find local groups, and stay informed. We partner with the city and 80+ community organisations.</p>
  <p>Today the portal serves over <strong>120,000</strong> residents across 14 districts.</p>
  <img src="hero.svg" width="120" /></div>
  <img src="hero.svg" alt="Team" />
</section>`
  },
  {
    name: 'Services', slug: 'services', url: '/services/', order: 3,
    copy: `<section class="text-hero"><h1>Services</h1><p class="lead">Everything the city offers, in one directory.</p></section>
<section class="features">
  <div class="card"><h3>Permits &amp; licences</h3><p>Apply and track applications online.</p></div>
  <div class="card"><h3>Waste &amp; recycling</h3><p>Schedules, pickups and special collection.</p></div>
  <div class="card"><h3>Parks &amp; recreation</h3><p>Book facilities and register for programs.</p></div>
  <div class="card"><h3>Transit</h3><p>Routes, passes and service alerts.</p></div>
</section>
<section class="news"><h2>Service requests</h2>
  {% entitylist name:"Service Requests" %}{% endentitylist %}
</section>`
  },
  {
    name: 'Contact', slug: 'contact', url: '/contact/', order: 4,
    copy: `<section class="text-hero"><h1>Contact us</h1><p class="lead">Send a message and the right team will reach out.</p></section>
<section class="split">
  <div class="form-host">
    {% entityform name:"Contact Us Form" %}
  </div>
  <div class="contact-info">
    <h3>Visit</h3><p>{{ settings["Contoso/Address"] }}</p>
    <h3>Call</h3><p>{{ snippets["Contact/Phone"] }}</p>
    <h3>Email</h3><p>support@contoso.com</p>
    <h3>Hours</h3><p>Mon–Fri, 9am–5pm</p>
  </div>
</section>`
  }
];
for (const p of pages) {
  f(`web-pages/${p.slug}/${p.slug}.webpage.yml`,
`adx_name: ${p.name}
adx_partialurl: ${p.url === '/' ? '/' : p.slug}
adx_pagetemplateid: Standard
adx_isroot: ${!!p.root}
adx_displayorder: ${p.order}
${p.root ? '' : 'adx_parentpageid: Home\n'}`);
  f(`web-pages/${p.slug}/content-pages/${p.slug}.en-US.webpage.copy.html`, p.copy);
}

/* ---------------- content snippets ---------------- */
const snippets = {
  'Brand/Name': 'Contoso Community',
  'Header/CTA Label': 'Contact',
  'Footer/Copyright': '© 2026 Contoso Community Portal. All rights reserved.',
  'Home/Eyebrow': 'YOUR CITY, CONNECTED',
  'Home/CTA Heading': 'Ready to get involved?',
  'Contact/Phone': '+1 (555) 0142-900'
};
for (const [name, value] of Object.entries(snippets)) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  f(`content-snippets/${slug}/${slug}.contentsnippet.yml`,
    `adx_name: ${name}\nadx_contentsnippetlanguageid: English (United States)\n`);
  f(`content-snippets/${slug}/${slug}.contentsnippet.value.html`, value);
}

/* ---------------- site settings ---------------- */
const settings = {
  'Contoso/Address': '700 Civic Plaza, Suite 200, Redmond, WA 98052',
  'Header/TreeView/Enabled': 'true',
  'Authentication/Registration/Enabled': 'true'
};
for (const [name, value] of Object.entries(settings)) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  f(`site-settings/${slug}.sitesetting.yml`, `adx_name: ${name}\nadx_value: "${value}"\n`);
}

/* ---------------- weblink set (navigation) ---------------- */
f('weblink-sets/primary-navigation/primary-navigation.weblinkset.yml',
`adx_name: Primary Navigation
adx_websiteid: Contoso Community Portal
weblinks:
  - adx_name: Home
    adx_externalurl: /
    adx_displayorder: 1
  - adx_name: About
    adx_externalurl: /about/
    adx_displayorder: 2
  - adx_name: Services
    adx_externalurl: /services/
    adx_displayorder: 3
  - adx_name: Contact
    adx_externalurl: /contact/
    adx_displayorder: 4
`);

/* ---------------- web files (assets) ---------------- */
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#0b5cab"/><path d="M10 23c0-5 3-9 8-9 3 0 5 1 6 3l-3 2c-1-1-2-2-3-2-2 0-4 2-4 6s2 6 4 6c1 0 2-1 3-2l3 2c-1 2-3 3-6 3-5 0-8-4-8-9z" fill="#fff"/></svg>`;
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f0fb"/><stop offset="1" stop-color="#cfe0f7"/></linearGradient></defs><rect width="520" height="360" rx="16" fill="url(#g)"/><circle cx="150" cy="150" r="48" fill="#0b5cab" opacity="0.85"/><circle cx="250" cy="180" r="60" fill="#3b82d6" opacity="0.8"/><circle cx="360" cy="140" r="52" fill="#67a0e6" opacity="0.85"/><rect x="120" y="240" width="280" height="14" rx="7" fill="#0b5cab" opacity="0.5"/><rect x="150" y="266" width="220" height="12" rx="6" fill="#0b5cab" opacity="0.3"/></svg>`;
const themeCss = `:root{--brand:#0b5cab;--brand-2:#3b82d6;--ink:#1b1f24;--muted:#5b6470;--bg:#ffffff;--soft:#f4f7fb;}
*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}
img{max-width:100%}
.site-header{display:flex;align-items:center;gap:24px;padding:14px 40px;border-bottom:1px solid #e6eaf0;position:sticky;top:0;background:#fff;z-index:5}
.site-logo{display:flex;align-items:center;gap:10px;font-weight:700;color:var(--brand);text-decoration:none;font-size:18px}
.site-nav{display:flex;gap:22px;margin-left:12px}
.site-nav a{color:var(--ink);text-decoration:none;font-weight:600;font-size:15px}
.site-nav a:hover{color:var(--brand)}
.site-cta{margin-left:auto;background:var(--brand);color:#fff;padding:9px 18px;border-radius:8px;text-decoration:none;font-weight:600}
.page-main{min-height:60vh}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;padding:64px 40px;background:linear-gradient(180deg,#f4f7fb,#fff)}
.eyebrow{letter-spacing:.12em;color:var(--brand);font-weight:700;font-size:13px;margin:0 0 8px}
.hero h1{font-size:44px;line-height:1.1;margin:0 0 16px}
.lead{font-size:19px;color:var(--muted);margin:0 0 24px}
.hero-actions{display:flex;gap:12px}
.btn{display:inline-block;padding:11px 22px;border-radius:8px;font-weight:600;text-decoration:none;cursor:pointer;border:0;font-size:15px}
.btn-primary{background:var(--brand);color:#fff}.btn-ghost{background:#fff;color:var(--brand);border:1px solid #cdd9ea}
.btn-light{background:#fff;color:var(--brand)}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;padding:48px 40px}
.card{background:var(--soft);border:1px solid #e9eef5;border-radius:14px;padding:24px}
.card-ic{font-size:30px;margin-bottom:8px}.card h3{margin:0 0 6px}.card p{margin:0;color:var(--muted)}
.news{padding:24px 40px 56px}.news h2{font-size:28px}
.cta-band{background:var(--brand);color:#fff;text-align:center;padding:56px 40px}.cta-band h2{font-size:30px;margin:0 0 20px}
.text-hero{padding:56px 40px 8px}.text-hero h1{font-size:40px;margin:0 0 10px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:32px 40px 64px}
.split img{border-radius:14px}.split h2{font-size:26px}
.contact-info h3{margin:18px 0 4px;color:var(--brand)}.contact-info p{margin:0;color:var(--muted)}
.site-footer{display:flex;justify-content:space-between;gap:24px;padding:28px 40px;background:#0e1726;color:#c6d2e2;font-size:14px;flex-wrap:wrap}
@media(max-width:760px){.hero,.split{grid-template-columns:1fr}.site-nav{display:none}}
`;
const webfiles = [
  { name: 'contoso-logo.svg', mime: 'image/svg+xml', content: logoSvg },
  { name: 'hero.svg', mime: 'image/svg+xml', content: heroSvg },
  { name: 'theme.css', mime: 'text/css', content: themeCss }
];
for (const wf of webfiles) {
  f(`web-files/${wf.name}`, wf.content);
  f(`web-files/${wf.name}.webfile.yml`,
    `adx_name: ${wf.name}\nadx_partialurl: ${wf.name}\nmimetype: ${wf.mime}\n`);
}

/* ---------------- basic form + list (dynamic components -> placeholders) ---------------- */
f('basic-forms/contact-us-form/contact-us-form.basicform.yml',
`adx_name: Contact Us Form
adx_entityname: feedback
adx_formname: Contact Web Form
adx_mode: Insert
adx_tabordering: true
`);
f('lists/news-articles/news-articles.list.yml',
`adx_name: News Articles
adx_entityname: cr_newsarticle
adx_view: Active News Articles
adx_pagesize: 6
`);
f('lists/service-requests/service-requests.list.yml',
`adx_name: Service Requests
adx_entityname: cr_servicerequest
adx_view: My Service Requests
adx_pagesize: 10
`);

/* ---------------- table permissions (metadata only) ---------------- */
f('table-permissions/news-read.tablepermission.yml',
`adx_name: News - Read
adx_entityname: cr_newsarticle
adx_scope: Global
adx_read: true
adx_webroleid: Anonymous Users
`);

/* ---------------- write outputs ---------------- */
// The sample is a test/demo fixture, not app functionality — it is NOT placed in public/.
// `fixtures/sample-site.zip` feeds the smoke test; the workspace-root copy is a demo input
// for the powercat-overpage skill.
import { mkdirSync } from 'node:fs';
mkdirSync(resolve(__dirname, '..', 'fixtures'), { recursive: true });
const outputs = [
  resolve(__dirname, '..', 'fixtures', 'sample-site.zip'),
  resolve(__dirname, '..', '..', 'ContosoCommunityPortal.zip')
];
const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
for (const out of outputs) { writeFileSync(out, buf); console.log('wrote', out, buf.length, 'bytes'); }
