"""Build the frozen, verified advisor export using Python's standard library.

Usage: python scripts/build-skill-advisor-pages.py --source <verified-site>
       [--site-url https://microsoft.github.io/power-cat-skills/skill-advisor/]

Only docs/skill-advisor is replaced; staging and rollback directories are siblings.
The source is never written or checked into the repository. Unknown files, links,
private filesystem literals and changed index bytes fail closed before publishing.
Downloads (including the one ZIP containing 20 PDF/PNG files) stay byte-identical.
Only the output's manually maintained README.md is preserved, scanned and hashed.
hosting.json records deterministic input/output hashes, not local provenance.

GitHub Pages does not apply Azure custom headers. The retained meta CSP only
enforces directives supported in meta; it provides no frame-ancestors coverage.
Nested robots.txt is not origin crawl policy; nested 404.html is not GitHub's
root error handler. Use index.html hash routes, not server-side SPA rewrites.
"""

import argparse
import hashlib
import html
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import time
from urllib.parse import unquote, urlsplit, urlunsplit
import uuid
import zipfile
import zlib

DEFAULT_URL = "https://microsoft.github.io/power-cat-skills/skill-advisor/"
OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "skill-advisor"
INDEX_SHA256 = "c0c78d3fdf6284b2eec5057c384694d09dd3f20e5aa35552cc878a7f6b4b20c3"
DOWNLOAD_NAMES = (
    "agent-skills cross-cutting dataverse governance mcp-tooling modernization "
    "power-apps power-automate power-cat power-pages"
).split()
ASSETS = (
    "basics.svg before-after.svg cat-logo.png cat-paw.png coe-team.svg "
    "command-center.svg copilotstudio.png customer-journeys.svg dataverse.png "
    "decision-tree-matrix.json downloads.svg governance.svg guide.svg home.svg "
    "icon-192.png icon-512.png invocation-examples.js mcp.svg "
    "Microsoft-Skills-Experience-All-Downloads.zip microsoft.svg modernization.svg "
    "og-cover.png power-series-mark.svg powerapps.png powerautomate.png "
    "powercat-fulllogo.png powercat-paw.png powercat-paw.svg powercat-textmark.png "
    "powercat-wordmark.png powercat.png powerpages.png powerplatform.png "
    "request-skill.svg role-biz.svg role-dev.svg role-maker.svg submit-skill.svg"
).split()
AVATARS = (
    "admin agent_dev arch canvas_dev coach code_dev flow_dev migration_dev "
    "mobile_dev model_dev pages_dev qa sec"
).split()
PUBLIC_PATHS = frozenset(
    ".nojekyll 404.html apple-touch-icon.png favicon-32x32.png favicon.ico "
    "favicon.svg index.html manifest.json prototype-category-preview.png "
    "prototype-dark-preview.png prototype-downloads-preview.png "
    "prototype-mobile-preview.png prototype-preview.png robots.txt sitemap.xml"
    .split()
) | frozenset("assets/" + n for n in ASSETS) | frozenset(
    "assets/coe-avatars/" + n + ".svg" for n in AVATARS
) | frozenset(
    f"downloads/{ext}/{n}.{ext}" for ext in ("pdf", "png") for n in DOWNLOAD_NAMES
)
SOURCE_PATHS = PUBLIC_PATHS | {"staticwebapp.config.json"}
TEXT_EXTENSIONS = {".html", ".json", ".js", ".svg", ".txt", ".xml"}
PRIVATE = re.compile(
    rb"(?i)(?:[a-z]:[\\/]+(?:users|documents and settings)[\\/]"
    rb"|file:(?:/|\\)|/(?:Users|home)/[A-Za-z0-9_.-]+/|\\\\[A-Za-z0-9_.-]+\\[A-Za-z0-9_$.-]+"
    rb"|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
    rb"|(?:AccountKey|SharedAccessSignature)\s*=)"
)
AZURE_HOST = re.compile(
    r"(?i)[a-z0-9.-]+\.(?:azurestaticapps\.net|web\.core\.windows\.net)"
)
LIMITATIONS = [
    "Nested robots.txt is informational, not origin-level crawl policy.",
    "Nested 404.html is not GitHub Pages' root error handler; use hash routes.",
    "GitHub Pages does not apply Azure custom response headers.",
    "Meta CSP enforces only meta-supported directives; no frame-ancestors coverage.",
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode()


def site_url(value):
    if re.search(r'[\s<>"\'\\\x00-\x1f\x7f]', value):
        raise ValueError("site URL contains unsafe characters")
    parsed = urlsplit(value)
    if (parsed.scheme not in ("https", "http") or not parsed.hostname
            or parsed.username or parsed.password or parsed.query or parsed.fragment):
        raise ValueError("site URL must be an absolute HTTP(S) directory URL")
    # Validate ports and reject decoded traversal, separators and markup.
    parsed.port
    decoded = unquote(parsed.path)
    if ("%" in decoded or re.search(r'[\s<>"\'\\?#\x00-\x1f\x7f]', decoded)
            or any(p in (".", "..") for p in decoded.split("/"))
            or "//" in parsed.path or unquote(parsed.netloc) != parsed.netloc
            or AZURE_HOST.search(parsed.netloc)):
        raise ValueError("invalid site URL path or origin")
    if not re.fullmatch(r"[A-Za-z0-9.\-:\[\]]+", parsed.netloc):
        raise ValueError("invalid site URL authority")
    return urlunsplit((parsed.scheme, parsed.netloc.lower(), parsed.path.rstrip("/") + "/", "", ""))


def assert_unlinked(path):
    for part in (path, *path.parents):
        if part.is_symlink() or (hasattr(part, "is_junction") and part.is_junction()):
            raise ValueError("symlinks and junctions are not allowed")


def remove_tree(path):
    """Allow brief Windows/OneDrive locks to clear on our own staging trees."""
    def writable_retry(function, name, error):
        os.chmod(name, stat.S_IWRITE | stat.S_IREAD)
        function(name)

    for attempt in range(4):
        try:
            shutil.rmtree(path, onerror=writable_retry)
            return
        except OSError:
            if not path.exists():
                return
            if attempt == 3:
                raise
            time.sleep(0.25 * (attempt + 1))


def rename_tree(source, target):
    for attempt in range(8):
        try:
            source.rename(target)
            return
        except PermissionError:
            if attempt == 7:
                raise
            time.sleep(0.25 * (attempt + 1))


def scan(data, name):
    # Also inspect UTF-16 strings, PDF hex strings, and Flate-compressed streams.
    chunks = [data, data.replace(b"\0", b"")]
    if name.endswith(".pdf"):
        for match in re.finditer(rb"<([0-9a-fA-F\s]{8,})>", data):
            try:
                chunks.append(bytes.fromhex(match[1].decode()).replace(b"\0", b""))
            except ValueError:
                pass
        for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S):
            try:
                chunks.append(zlib.decompress(match[1]))
            except zlib.error:
                pass
    for chunk in chunks:
        # PDF literal strings escape backslashes; JSON does too.
        normalized = chunk.replace(b"\0", b"").replace(b"\\\\", b"\\")
        if PRIVATE.search(normalized):
            raise ValueError("private filesystem or credential literal in " + name)
        if AZURE_HOST.search(normalized.decode("latin-1")):
            raise ValueError("deployment hostname remains in " + name)


def strip_evidence(value):
    count = 0
    if isinstance(value, dict):
        if "localEvidence" in value:
            del value["localEvidence"]
            count += 1
        for child in value.values():
            count += strip_evidence(child)
    elif isinstance(value, list):
        for child in value:
            count += strip_evidence(child)
    return count


def transform_index(text, base):
    match = re.search(r"const DATA\s*=\s*", text)
    if not match:
        raise ValueError("missing frozen DATA")
    data, end = json.JSONDecoder().raw_decode(text[match.end():])
    removed = strip_evidence(data)
    safe_data = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    text = text[:match.end()] + safe_data + text[match.end() + end:]
    # Replace the whole legacy resolver, not just its hostname lookup.
    resolver = re.compile(r"<script>\s*/\* =+\s+HOST-AGNOSTIC IDENTITY RESOLVER.*?</script>", re.S)
    base_js = json.dumps(base).replace("<", "\\u003c").replace("&", "\\u0026")
    script = """<script>
  // Match both origin and directory: other github.io projects are not this site.
  (() => {
    const SITE_URL = BASE;
    const configured = new URL(SITE_URL);
    const dirBase = location.origin + location.pathname.replace(/[^/]*$/, "");
    const exact = location.origin === configured.origin &&
      (location.pathname === configured.pathname.slice(0, -1) ||
       location.pathname === configured.pathname ||
       location.pathname === configured.pathname + "index.html");
    const base = exact ? SITE_URL :
      (/^https?:$/.test(location.protocol) ? dirBase : SITE_URL);
    document.documentElement.dataset.hostFocus = "github";
    const swap = (selector, attr) => {
      const el = document.querySelector(selector);
      if (el && el.getAttribute(attr))
        el.setAttribute(attr, el.getAttribute(attr).split(SITE_URL).join(base));
    };
    swap('link[rel="canonical"]', 'href');
    swap('meta[property="og:url"]', 'content');
    swap('meta[property="og:image"]', 'content');
    swap('meta[name="twitter:url"]', 'content');
    swap('meta[name="twitter:image"]', 'content');
    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      const rewrite = value => {
        if (typeof value === "string") return value.split(SITE_URL).join(base);
        if (Array.isArray(value)) return value.map(rewrite);
        if (value && typeof value === "object")
          return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,rewrite(v)]));
        return value;
      };
      ld.textContent = JSON.stringify(rewrite(JSON.parse(ld.textContent)));
    }
  })();
</script>""".replace("BASE", base_js)
    text, count = resolver.subn(lambda _: script, text)
    if count != 1:
        raise ValueError("legacy resolver did not match exactly once")
    # Metadata is the only remaining deployment-host usage in this verified index.
    def replace_url(match):
        return base
    text = re.sub(r"https?://" + AZURE_HOST.pattern.removeprefix("(?i)") + "/", replace_url, text, flags=re.I)
    text = re.sub(r"[ \t]+(?=\r?$)", "", text, flags=re.M)
    return text, removed


def build(source, base):
    base = site_url(base)
    source = Path(os.path.abspath(source))
    output = OUTPUT
    assert_unlinked(source)
    assert_unlinked(output)
    source = source.resolve()
    if source == output or source in output.parents or output in source.parents:
        raise ValueError("source and output overlap")
    files = {}
    allowed_dirs = {str(Path(n).parent).replace("\\", "/") for n in SOURCE_PATHS}
    allowed_dirs |= {"assets", "downloads"}
    for root, dirs, names in os.walk(source, followlinks=False):
        for name in dirs + names:
            path = Path(root) / name
            assert_unlinked(path)
            rel = path.relative_to(source).as_posix()
            if path.is_dir():
                if rel not in allowed_dirs:
                    raise ValueError("unknown source directory: " + rel)
            elif path.is_file() and rel in SOURCE_PATHS:
                files[rel] = path.read_bytes()
            else:
                raise ValueError("unknown source artifact: " + rel)
    if files.keys() != SOURCE_PATHS:
        raise ValueError("source inventory does not match frozen 87-file export")
    if sha(files["index.html"]) != INDEX_SHA256:
        raise ValueError("source index SHA256 differs from verified export")
    result = {n: files[n] for n in PUBLIC_PATHS}
    result[".gitattributes"] = (
        b"# Preserve generated bytes and hosting.json checksums on every platform.\n"
        b"* -text whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol\n"
    )
    index, removed = transform_index(files["index.html"].decode("utf-8"), base)
    # The validated URL excludes HTML/JS/XML delimiters; ampersands still need HTML escaping.
    index = index.replace('content="' + base, 'content="' + html.escape(base, quote=True))
    index = index.replace('href="' + base, 'href="' + html.escape(base, quote=True))
    result["index.html"] = index.encode()
    result["sitemap.xml"] = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>{html.escape(base)}</loc></url>\n</urlset>\n'
    ).encode()
    result["robots.txt"] = (
        "# Informational only: nested robots.txt is not origin crawl policy.\n"
        "# Only the origin /robots.txt controls crawler access.\n"
        f"# Sitemap: {base}sitemap.xml\n"
    ).encode()
    result["404.html"] = (
        '<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8">\n'
        '<meta name="robots" content="noindex"><title>AI Skills Advisor</title></head>\n'
        '<body><!-- Nested file: not GitHub Pages root error handler. No path discovery. -->\n'
        '<p>Use the <a href="./index.html">AI Skills Advisor</a> and its hash routes.</p>\n'
        '</body></html>\n'
    ).encode()
    readme = output / "README.md"
    assert_unlinked(readme)
    try:
        readme_stat = readme.lstat()
    except FileNotFoundError:
        pass
    else:
        if not stat.S_ISREG(readme_stat.st_mode):
            raise ValueError("output README.md must be a regular file")
        result["README.md"] = readme.read_bytes()
    for name, content in result.items():
        scan(content, name)
        if name.endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                expected = {f"{ext}/{n}.{ext}" for ext in ("pdf", "png") for n in DOWNLOAD_NAMES}
                if set(archive.namelist()) != expected or len(archive.infolist()) != 20:
                    raise ValueError("ZIP inventory is not exactly 20 public downloads")
                scan(archive.comment, name)
                for entry in archive.infolist():
                    if stat.S_ISLNK(entry.external_attr >> 16):
                        raise ValueError("ZIP symlink")
                    data = archive.read(entry)
                    scan(entry.filename.encode() + entry.comment + entry.extra, name)
                    scan(data, entry.filename)
                    if data != files["downloads/" + entry.filename]:
                        raise ValueError("ZIP member differs from public download")
    source_hashes = {n: sha(files[n]) for n in sorted(files)}
    result["hosting.json"] = json_bytes({
        "mode": "github-pages", "baseURL": base,
        "sourceDigestSHA256": sha(json_bytes(source_hashes)),
        "sourceIndexSHA256": INDEX_SHA256,
        "files": {n: sha(result[n]) for n in sorted(result)},
        "limitations": LIMITATIONS,
        "transforms": {"removedLocalEvidenceFields": removed,
                       "excluded": ["staticwebapp.config.json"],
                       "rewritten": ["index.html", "404.html", "robots.txt", "sitemap.xml"]},
        "downloads": {"zipFiles": 1, "zipMembers": 20, "pdfFiles": 10, "pngFiles": 10,
                      "bytesPreserved": True},
    })
    # Do not traverse target links during stale-output cleanup.
    if output.exists():
        for root, dirs, names in os.walk(output, followlinks=False):
            for name in dirs + names:
                assert_unlinked(Path(root) / name)
    output.parent.mkdir(parents=True, exist_ok=True)
    token = uuid.uuid4().hex
    stage = output.with_name(".skill-advisor-stage-" + token)
    old = output.with_name(".skill-advisor-old-" + token)
    stage.mkdir()
    moved = False
    try:
        for name, content in sorted(result.items()):
            path = stage / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        if output.exists():
            rename_tree(output, old)
            moved = True
        try:
            rename_tree(stage, output)
        except BaseException:
            if moved:
                rename_tree(old, output)
            raise
        if moved:
            remove_tree(old)
    finally:
        if stage.exists():
            remove_tree(stage)
    return {"files": len(result), "bytes": sum(map(len, result.values())),
            "removedLocalEvidenceFields": removed}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--site-url", default=DEFAULT_URL)
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.source, args.site_url), sort_keys=True))
    except (ValueError, OSError, zipfile.BadZipFile) as error:
        parser.exit(1, "Build rejected: " + str(error) + "\n")


if __name__ == "__main__":
    main()
