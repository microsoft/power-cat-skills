import { render } from './liquid.js';

function buildContext(model, page) {
  return {
    webTemplates: model.webTemplates,
    snippets: model.snippets,
    settings: model.settings,
    weblinks: model.weblinkSets,
    page: { name: page.name, adx_copy: '' }
  };
}

function rewriteAssets(html, model) {
  return html.replace(/(src|href)=("|')([^"']*)\2/gi, (m, attr, q, val) => {
    const base = val.split('/').pop().toLowerCase();
    const wf = model.webFiles.get(base);
    if (wf && !wf.isCss) return `${attr}=${q}${wf.uri}${q}`;
    return m;
  });
}

function injectedCss(model) {
  const css = [];
  for (const wf of model.webFiles.values()) if (wf.isCss && wf.text) css.push(wf.text);
  return css.join('\n');
}

const esc = (s) => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');

const BASE_CSS = `
.pp-placeholder{border:2px dashed #efb6cc;background:repeating-linear-gradient(45deg,#fdf3f7,#fdf3f7 12px,#fbe8f0 12px,#fbe8f0 24px);border-radius:10px;padding:28px;margin:18px 0;text-align:center;color:#7a5566;font-family:'Segoe UI',Aptos,Calibri,sans-serif}
.pp-ph-badge{display:inline-block;background:#D85A86;color:#fff;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;border-radius:999px;margin-bottom:8px}
.pp-ph-title{font-size:18px;font-weight:700;color:#3a1f2b}
.pp-ph-sub{font-size:13px;margin-top:4px;opacity:.8}
.pp-pin{position:absolute;top:-11px;left:-11px;width:20px;height:20px;border-radius:50%;color:#fff;font:700 12px/20px 'Segoe UI',sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.35);z-index:9;pointer-events:none}
mark.pp-finding{padding:0 2px;border-radius:3px;cursor:pointer}
mark.pp-finding[data-impact="low"]{background:rgba(22,163,74,.22);border-bottom:2px solid #16a34a}
mark.pp-finding[data-impact="medium"]{background:rgba(245,158,11,.22);border-bottom:2px solid #f59e0b}
mark.pp-finding[data-impact="high"]{background:rgba(220,38,38,.22);border-bottom:2px solid #dc2626}
.pp-flash{animation:ppflash 1.5s ease}
@keyframes ppflash{0%,100%{box-shadow:none}30%{box-shadow:0 0 0 6px rgba(216,90,134,.45)}}
`;

const OVERLAY_SCRIPT = (selectorFindings) => `
(function(){
  var F = ${JSON.stringify(selectorFindings)};
  function color(i){return i==='high'?'#dc2626':i==='medium'?'#f59e0b':'#16a34a';}
  F.forEach(function(f){
    try{
      var el = document.querySelector(f.selector);
      if(!el || el.__pp) return; el.__pp = true;
      el.classList.add('pp-finding');
      el.setAttribute('data-fid', f.fid);
      el.style.outline = '2px solid ' + color(f.impact);
      el.style.outlineOffset = '2px';
      el.style.cursor = 'pointer';
      el.title = f.label;
      if(getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var canChild = !/^(IMG|INPUT|BR|HR)$/.test(el.tagName);
      if(canChild){ var pin=document.createElement('span'); pin.className='pp-pin'; pin.textContent='!'; pin.style.background=color(f.impact); el.appendChild(pin); }
    }catch(e){}
  });
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a');
    if(a){ var href=a.getAttribute('href')||''; if(href && !/^https?:|^data:|^mailto:/.test(href)){ e.preventDefault(); parent.postMessage({type:'pp-navigate', href:href}, '*'); return; } }
    var ff = e.target.closest && e.target.closest('.pp-finding');
    if(ff){ e.preventDefault(); parent.postMessage({type:'pp-finding', fid: ff.getAttribute('data-fid')}, '*'); }
  });
  window.addEventListener('message', function(e){
    if(!e.data || e.data.type!=='pp-highlight') return;
    var fid = String(e.data.fid).replace(/["\\\\]/g, '\\\\$&');
    var el = document.querySelector('[data-fid="' + fid + '"]');
    if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('pp-flash'); setTimeout(function(){el.classList.remove('pp-flash');}, 1600); }
  });
})();
`;

export function renderPage(model, page, findings = []) {
  const ctx = buildContext(model, page);
  ctx.page.adx_copy = render(page.copyHtml, ctx);
  let body = render(page.layoutSource, ctx);
  body = rewriteAssets(body, model);

  // match anchors -> wrap first occurrence of visible literal text
  for (const f of findings) {
    if (f.anchor && f.anchor.kind === 'match' && f.anchor.value) {
      const idx = body.indexOf(f.anchor.value);
      if (idx >= 0) {
        const v = f.anchor.value;
        body = body.slice(0, idx) +
          `<mark class="pp-finding" data-fid="${esc(f.fid)}" data-impact="${esc(f.impact)}" title="${esc(f.label)}">${v}</mark>` +
          body.slice(idx + v.length);
      }
    }
  }

  const selectorFindings = findings
    .filter((f) => f.anchor && f.anchor.kind === 'selector')
    .map((f) => ({ fid: f.fid, selector: f.anchor.value, impact: f.impact, label: f.label }));

  // The preview is a static mockup — neutralize the site's own scripts so they can't run
  // (we still flag them as findings). Our overlay script is appended separately below.
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<!-- inline script removed in preview -->');

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_self">
<style>${injectedCss(model)}</style>
<style>${BASE_CSS}</style>
</head><body>${body}<script>${OVERLAY_SCRIPT(selectorFindings)}<\/script></body></html>`;
}

export function findPageByHref(model, href) {
  const clean = (u) => '/' + (u || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/|\/$/g, '') + '/';
  const target = clean(href).toLowerCase();
  return model.pages.find((p) => clean(p.url).toLowerCase() === target)
      || model.pages.find((p) => p.partialurl && clean(p.partialurl).toLowerCase() === target)
      || null;
}
