"""Run with python -B -m unittest discover -s scripts -p test_build_skill_advisor_pages.py."""

import importlib.util
import io
import json
from pathlib import Path
import shutil
import unittest
from unittest.mock import patch
import uuid
import zipfile

spec = importlib.util.spec_from_file_location(
    "advisor_builder", Path(__file__).with_name("build-skill-advisor-pages.py")
)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class BuilderTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent / (".t-" + uuid.uuid4().hex[:8])
        self.source = self.root / "source"
        self.output = self.root / "output"
        self.source.mkdir(parents=True)
        for name in builder.SOURCE_PATHS:
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b"public")
        host = "https://example.azurestaticapps.net/"
        self.index = (
            '<link rel="canonical" href="' + host + '">'
            '<meta property="og:url" content="' + host + '">'
            '<script type="application/ld+json">{"url":"' + host + '"}</script>'
            '<script>/* ===========================================================\n'
            ' HOST-AGNOSTIC IDENTITY RESOLVER legacy */ ignored();</script>'
            '<script>const DATA = {"skills":[{"localEvidence":"private",'
            '"action":{"prompt":"keep","sourcePath":"plugins/public/SKILL.md",'
            '"localEvidence":"private"}}]};</script>'
        ).encode()
        (self.source / "index.html").write_bytes(self.index)
        (self.source / "manifest.json").write_bytes(b'{"scope":"./","id":"./"}')
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w") as archive:
            for ext in ("pdf", "png"):
                for name in builder.DOWNLOAD_NAMES:
                    archive.writestr(f"{ext}/{name}.{ext}", b"public")
        (self.source / "assets" / "Microsoft-Skills-Experience-All-Downloads.zip").write_bytes(stream.getvalue())
        self.patches = [
            patch.object(builder, "OUTPUT", self.output),
            patch.object(builder, "INDEX_SHA256", builder.sha(self.index)),
        ]
        for item in self.patches:
            item.start()
        self.addCleanup(self.cleanup)

    def cleanup(self):
        for item in reversed(self.patches):
            item.stop()
        builder.remove_tree(self.root)

    def build(self, url=builder.DEFAULT_URL):
        return builder.build(self.source, url)

    def snapshot(self, root):
        return {p.relative_to(root).as_posix(): p.read_bytes()
                for p in root.rglob("*") if p.is_file()}

    def test_determinism_stale_cleanup_and_source_protection(self):
        source = self.snapshot(self.source)
        first = self.build()
        files = self.snapshot(self.output)
        (self.output / "stale.txt").write_text("stale")
        unrelated = self.root / "unrelated.txt"
        unrelated.write_text("keep")
        self.assertEqual(first, self.build())
        self.assertEqual(files, self.snapshot(self.output))
        self.assertEqual(source, self.snapshot(self.source))
        self.assertEqual("keep", unrelated.read_text())
        self.assertEqual(88, first["files"])
        self.assertFalse((self.output / "staticwebapp.config.json").exists())
        for name in builder.PUBLIC_PATHS - {"index.html", "404.html", "robots.txt", "sitemap.xml"}:
            self.assertEqual(source[name], files[name])

    def test_metadata_evidence_and_url_escaping(self):
        base = "https://example.org/a&b/advisor/"
        self.build(base)
        text = (self.output / "index.html").read_text()
        self.assertIn('href="https://example.org/a&amp;b/advisor/"', text)
        self.assertNotIn("azurestaticapps.net", text)
        self.assertNotIn("localEvidence", text)
        self.assertIn('"sourcePath":"plugins/public/SKILL.md"', text)
        self.assertIn('"prompt":"keep"', text)
        self.assertIn('dataset.hostFocus = "github"', text)
        self.assertIn("location.origin === configured.origin", text)
        self.assertIn("location.pathname === configured.pathname", text)
        manifest = json.loads((self.output / "hosting.json").read_bytes())
        self.assertEqual(base, manifest["baseURL"])
        self.assertEqual(2, manifest["transforms"]["removedLocalEvidenceFields"])
        self.assertEqual(4, len(manifest["limitations"]))
        self.assertNotIn(str(self.source), json.dumps(manifest))
        for name, digest in manifest["files"].items():
            self.assertEqual(digest, builder.sha((self.output / name).read_bytes()))

    def test_invalid_urls(self):
        for url in ("", "/relative", "ftp://example.org/", "https://u:p@example.org/",
                    "https://example.org/?q=x", "https://example.org/#x",
                    "https://example.org/<script>/", "https://example.org/%3C/",
                    "https://example.org/../x/", "https://example.org/%2e%2e/",
                    "https://example.org:bad/", "https://example.org/\\bad/",
                    "https://example.org/\n", "https://example.org/%252e/"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                self.build(url)
        self.assertFalse(self.output.exists())

    def test_unknown_and_changed_source_rejected(self):
        self.build()
        previous = self.snapshot(self.output)
        unknown = self.source / "private.txt"
        unknown.write_text("private")
        with self.assertRaises(ValueError):
            self.build()
        unknown.unlink()
        (self.source / "index.html").write_bytes(self.index + b"changed")
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual(previous, self.snapshot(self.output))

    def test_overlaps_rejected(self):
        for source in (self.output, self.output / "child", self.root):
            with self.subTest(source=source), self.assertRaises(ValueError):
                builder.build(source, builder.DEFAULT_URL)

    def test_rename_failure_rolls_back(self):
        self.build()
        previous = self.snapshot(self.output)
        rename = Path.rename

        def fail_stage(path, target):
            if path.name.startswith(".skill-advisor-stage-"):
                raise OSError("simulated publication failure")
            return rename(path, target)

        with patch.object(Path, "rename", fail_stage), self.assertRaises(OSError):
            self.build()
        self.assertEqual(previous, self.snapshot(self.output))
        self.assertFalse(list(self.root.glob(".skill-advisor-*")))

    def test_private_literal_scanning(self):
        for data in (b"C:\\Users\\person\\private", b"file:///private",
                     "C:\\Users\\person\\private".encode("utf-16-le"),
                     b"<433a5c55736572735c706572736f6e5c70726976617465>"):
            with self.subTest(data=data), self.assertRaises(ValueError):
                builder.scan(data, "test.pdf")

    def test_symlink_rejected(self):
        link = self.source / "unexpected"
        try:
            link.symlink_to(self.source / "index.html")
        except OSError:
            self.skipTest("Windows symlink privilege unavailable")
        with self.assertRaises(ValueError):
            self.build()
        link.unlink()


if __name__ == "__main__":
    unittest.main()
