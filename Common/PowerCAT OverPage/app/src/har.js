// HAR parser + performance heuristics for PowerCAT OverPage.
// Parses a HAR 1.2 log into per-page timings and per-request rows, computes
// derived metrics, and surfaces candidate performance issues. The AI skill authors
// the actual findings; this module gives the viewer deterministic data to render and
// to map findings back to requests (and, where possible, to solution code/assets).

const KB = 1024;

export function parseHar(json) {
  const log = json && json.log ? json.log : json;
  if (!log || !Array.isArray(log.entries)) throw new Error('Not a valid HAR (missing log.entries)');

  const pages = (log.pages || []).map((p) => ({
    id: p.id,
    title: p.title,
    url: p.title,
    startedDateTime: p.startedDateTime,
    onContentLoad: p.pageTimings?.onContentLoad ?? null,
    onLoad: p.pageTimings?.onLoad ?? null
  }));

  const entries = log.entries.map((e, i) => {
    const req = e.request || {};
    const res = e.response || {};
    const t = e.timings || {};
    const url = req.url || '';
    let host = '';
    try { host = new URL(url).host; } catch {}
    const mime = (res.content && res.content.mimeType) || '';
    const bodySize = (res.content && (res.content.size ?? res.bodySize)) ?? res.bodySize ?? 0;
    const transfer = res._transferSize ?? res.bodySize ?? bodySize ?? 0;
    const blocked = num(t.blocked); const dns = num(t.dns); const connect = num(t.connect);
    const ssl = num(t.ssl); const send = num(t.send); const wait = num(t.wait); const receive = num(t.receive);
    const init = e._initiator || {};
    const initiatorUrl = init.url || (init.stack && init.stack.callFrames && init.stack.callFrames[0] && init.stack.callFrames[0].url) || '';
    const initiatorFrames = (init.stack && init.stack.callFrames ? init.stack.callFrames : [])
      .slice(0, 6).map((f) => ({ fn: f.functionName || '(anon)', url: f.url, line: f.lineNumber, col: f.columnNumber }));
    return {
      idx: i,
      pageref: e.pageref || null,
      url, host,
      method: req.method || 'GET',
      status: res.status ?? 0,
      mime, type: classify(mime, url),
      time: num(e.time),
      ttfb: wait,
      blocked, dns, connect, ssl, send, wait, receive,
      bodySize: bodySize > 0 ? bodySize : 0,
      transferSize: transfer > 0 ? transfer : 0,
      fromCache: !!(res._fromCache) || (transfer === 0 && res.status === 200 && bodySize > 0),
      initiatorType: init.type || '',
      initiatorUrl,
      initiatorFrames,
      startedDateTime: e.startedDateTime,
      _startMs: e.startedDateTime ? Date.parse(e.startedDateTime) : 0
    };
  });

  // attach entries to pages by pageref; compute per-page rollups
  for (const p of pages) {
    const pe = entries.filter((x) => x.pageref === p.id);
    p.requests = pe.length;
    p.totalBytes = pe.reduce((n, x) => n + (x.transferSize || x.bodySize || 0), 0);
    p.byType = rollupByType(pe);
    p.thirdParty = pe.filter((x) => isThirdParty(x.host)).length;
  }

  const summary = {
    pageCount: pages.length,
    requestCount: entries.length,
    totalBytes: entries.reduce((n, x) => n + (x.transferSize || x.bodySize || 0), 0),
    hosts: [...new Set(entries.map((x) => x.host).filter(Boolean))],
    slowestOnLoad: pages.reduce((m, p) => (p.onLoad > (m?.onLoad || 0) ? p : m), null)
  };

  return { pages, entries, summary, issues: detectIssues(pages, entries) };
}

function num(v) { return typeof v === 'number' && v > 0 ? v : 0; }

function classify(mime, url) {
  if (/javascript/.test(mime) || /\.js(\?|$)/.test(url)) return 'script';
  if (/css/.test(mime) || /\.css(\?|$)/.test(url)) return 'stylesheet';
  if (/^image\//.test(mime) || /\.(png|jpe?g|gif|webp|svg|ico)(\?|$)/.test(url)) return 'image';
  if (/font/.test(mime) || /\.(woff2?|ttf|eot)(\?|$)/.test(url)) return 'font';
  if (/html/.test(mime)) return 'document';
  if (/json/.test(mime) || /_api|\/api\/|odata/.test(url)) return 'xhr';
  return 'other';
}

const FIRST_PARTY_HINTS = ['powerappsportals.com', 'powerpages.microsoft.com', 'microsoftcrmportals.com'];
function isThirdParty(host) {
  if (!host) return false;
  return !FIRST_PARTY_HINTS.some((h) => host.endsWith(h));
}

function rollupByType(entries) {
  const r = {};
  for (const e of entries) {
    const t = (r[e.type] = r[e.type] || { count: 0, bytes: 0 });
    t.count++; t.bytes += e.transferSize || e.bodySize || 0;
  }
  return r;
}

// Deterministic candidate issues. The skill turns the relevant ones into findings.
function detectIssues(pages, entries) {
  const issues = [];
  const add = (o) => issues.push(o);

  for (const p of pages) {
    if (p.onLoad && p.onLoad > 3000)
      add({ kind: 'slow-page-load', severity: p.onLoad > 5000 ? 'high' : 'medium', pageref: p.id, url: p.url, detail: `onLoad ${Math.round(p.onLoad)} ms`, value: p.onLoad });
  }

  for (const e of entries) {
    const bytes = e.transferSize || e.bodySize || 0;
    if (e.type === 'script' && bytes > 300 * KB)
      add({ kind: 'large-script', severity: bytes > 800 * KB ? 'high' : 'medium', idx: e.idx, url: e.url, host: e.host, detail: `${(bytes / KB).toFixed(0)} KB script`, value: bytes });
    if (e.type === 'image' && bytes > 500 * KB)
      add({ kind: 'large-image', severity: bytes > 1024 * KB ? 'high' : 'medium', idx: e.idx, url: e.url, host: e.host, detail: `${(bytes / KB).toFixed(0)} KB image`, value: bytes });
    if (e.type === 'stylesheet' && bytes > 150 * KB)
      add({ kind: 'large-stylesheet', severity: 'medium', idx: e.idx, url: e.url, host: e.host, detail: `${(bytes / KB).toFixed(0)} KB CSS`, value: bytes });
    if (e.time > 1500)
      add({ kind: 'slow-request', severity: e.time > 3000 ? 'high' : 'medium', idx: e.idx, url: e.url, host: e.host, detail: `${Math.round(e.time)} ms total (TTFB ${Math.round(e.ttfb)} ms)`, value: e.time });
    if (e.status >= 400)
      add({ kind: 'failed-request', severity: e.status >= 500 ? 'high' : 'medium', idx: e.idx, url: e.url, host: e.host, detail: `HTTP ${e.status}`, value: e.status });
    if (e.type === 'script' && isThirdParty(e.host) && e.initiatorType === 'parser')
      add({ kind: 'render-blocking-3p-script', severity: 'medium', idx: e.idx, url: e.url, host: e.host, detail: `parser-inserted third-party script (${e.host})`, value: bytes });
  }

  // duplicate requests (same URL fetched many times)
  const byUrl = {};
  for (const e of entries) { (byUrl[e.url] = byUrl[e.url] || []).push(e); }
  for (const [url, list] of Object.entries(byUrl)) {
    if (list.length >= 3 && !list[0].fromCache)
      add({ kind: 'duplicate-requests', severity: 'low', idx: list[0].idx, url, detail: `requested ${list.length}×`, value: list.length });
  }

  const order = { high: 3, medium: 2, low: 1 };
  return issues.sort((a, b) => order[b.severity] - order[a.severity] || (b.value || 0) - (a.value || 0));
}

// Map a HAR request URL/initiator to a solution asset (best-effort) for click-to-code.
// Matches on web-file basenames and page custom-js. Returns { assetId, reason } or null.
export function mapRequestToAsset(entry, sites) {
  const base = (() => { try { return new URL(entry.url).pathname.split('/').pop().toLowerCase(); } catch { return ''; } })();
  if (!base) return null;
  for (const site of sites) {
    for (const a of site.assets) {
      const ab = a.path.split('/').pop().toLowerCase();
      if (ab === base) return { siteId: site.id, assetId: a.id, reason: 'web file name match' };
    }
  }
  // initiator points at a first-party inline/page script?
  for (const f of entry.initiatorFrames || []) {
    if (/powerappsportals\.com|powerpages/.test(f.url || '')) {
      return { siteId: sites[0]?.id, assetId: null, reason: 'first-party initiator (inline/page script)' };
    }
  }
  return null;
}
