"""Meaningful regressions for shared settings and authored Markdown parsing."""
import copy
import io
import tempfile
import tomllib
import unittest
import xml.etree.ElementTree as ET
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

import blog_versions
from check_i18n import configuration_errors, parse_markdown_file
from post_build import (
    SITEMAP_NS,
    THEME_BUNDLE,
    THEME_BUNDLE_DEFERRED,
    XHTML_NS,
    clean_agent_markdown,
    localize_sitemaps,
)
from social_cards import publish_social_cards
from sort_ratings import sort_tables
from verify_build_output import verify_build_output


class BuildOutputContracts(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.root = self.directory / "site"

    def make_locale(self, locale, html):
        docs = self.directory / "content" / locale
        site = self.root / ("es" if locale == "es" else "")
        (docs / "projects").mkdir(parents=True)
        (docs / "index.md").write_text("# Home\n", encoding="utf-8")
        (docs / "projects/blueprints.md").write_text("# Blueprint\n", encoding="utf-8")
        (site / "projects/blueprints").mkdir(parents=True)
        (site / "index.html").write_text("<h1>Home</h1>", encoding="utf-8")
        page = site / "projects/blueprints/index.html"
        page.write_text(html, encoding="utf-8")
        return docs, site, page

    def verify(self, docs, site, *, root=None):
        stdout, stderr = io.StringIO(), io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            result = verify_build_output(docs, site, root)
        return result, stdout.getvalue(), stderr.getvalue()

    def test_missing_es_image_fails_even_when_english_copy_exists(self):
        source = "../../assets/images/architecture/blueprint.svg"
        docs, site, page = self.make_locale("es", f'<img src="{source}" alt="Blueprint">')
        relative = Path("assets/images/architecture/blueprint.svg")
        english = self.root / relative
        english.parent.mkdir(parents=True)
        english.write_text("<svg/>", encoding="utf-8")
        result, _, error = self.verify(docs, site, root=self.root)
        self.assertFalse(result)
        self.assertIn(str(page), error)
        self.assertIn(source, error)
        es_image = site / relative
        es_image.parent.mkdir(parents=True)
        es_image.touch()
        self.assertFalse(self.verify(docs, site, root=self.root)[0])
        es_image.write_text("<svg/>", encoding="utf-8")
        self.assertTrue(self.verify(docs, site, root=self.root)[0])

    def test_root_relative_and_encoded_relative_images_work_in_both_locales(self):
        for locale in ("en", "es"):
            with self.subTest(locale=locale):
                docs, site, _ = self.make_locale(
                    locale,
                    '<img src="/assets/images/logo.svg">'
                    '<img src="/es/assets/images/logo.svg">'
                    '<img src="../../assets/images/icon%20%26%20proof.svg?v=1&amp;rev=2#mark">',
                )
                for folder in (self.root, self.root / "es"):
                    images = folder / "assets/images"
                    images.mkdir(parents=True, exist_ok=True)
                    (images / "logo.svg").write_text("<svg/>", encoding="utf-8")
                (site / "assets/images/icon & proof.svg").write_text("<svg/>", encoding="utf-8")
                result, output, error = self.verify(docs, site, root=self.root)
                self.assertTrue(result, error)
                self.assertIn("Verified 2 rendered pages", output)

    def test_remote_inline_and_postbuild_metadata_images_are_not_local_checks(self):
        docs, site, _ = self.make_locale(
            "en",
            '<img src="https://example.com/image.png">'
            '<img src="//example.com/image.png">'
            '<img src="data:image/svg+xml;base64,PHN2Zy8+">'
            '<meta property="og:image" content="/assets/images/social/later.png">'
            '<meta name="twitter:image" content="/assets/images/social/later.png">',
        )
        self.assertTrue(self.verify(docs, site)[0])

    def test_missing_and_empty_pages_still_fail(self):
        docs, site, page = self.make_locale("en", "<h1>Blueprint</h1>")
        page.unlink()
        result, _, error = self.verify(docs, site)
        self.assertFalse(result)
        self.assertIn("1 of 2 expected pages are missing or empty", error)
        page.touch()
        self.assertFalse(self.verify(docs, site)[0])
        page.write_text("<h1>Blueprint</h1>", encoding="utf-8")
        self.assertTrue(self.verify(docs, site)[0])

    def test_image_outside_public_output_cannot_pass_using_a_local_file(self):
        docs, site, _ = self.make_locale("en", '<img src="../../../private.svg">')
        (self.directory / "private.svg").write_text("<svg/>", encoding="utf-8")
        result, _, error = self.verify(docs, site)
        self.assertFalse(result)
        self.assertIn("outside the public root", error)


class SiteContracts(unittest.TestCase):
    def setUp(self):
        self.en = tomllib.loads(Path("zensical.toml").read_text(encoding="utf-8"))
        self.es = tomllib.loads(Path("zensical.es.toml").read_text(encoding="utf-8"))

    def test_translation_and_distinct_roots_are_allowed(self):
        before = copy.deepcopy(self.es)
        self.assertEqual(configuration_errors(self.en, self.es), [])
        self.assertEqual(self.es, before)

    def test_shared_features_palette_scripts_and_navigation_cannot_drift(self):
        changes = [
            lambda p: p["theme"]["features"].append("search.share"),
            lambda p: p["theme"]["palette"][0].update(scheme="different"),
            lambda p: p["extra_javascript"].append("assets/extra.js"),
            lambda p: p["nav"].reverse(),
            lambda p: p["markdown_extensions"]["toc"].update(permalink=True),
            # The agent summary may be translated, but not list other pages.
            lambda p: p["plugins"]["llmstxt"]["sections"]["Proyectos"].reverse(),
            lambda p: p["plugins"]["llmstxt"]["sections"]["Blog"].pop(),
            lambda p: p["plugins"]["llmstxt"].update(full_output="llms-full.txt"),
        ]
        for change in changes:
            with self.subTest(change=change):
                altered = copy.deepcopy(self.es)
                change(altered["project"])
                self.assertTrue(configuration_errors(self.en, altered))

    def test_every_navigation_page_is_listed_for_agents(self):
        for config in (self.en, self.es):
            altered = copy.deepcopy(config)
            sections = altered["project"]["plugins"]["llmstxt"]["sections"]
            next(iter(sections.values())).pop(0)
            errors = configuration_errors(*((altered, self.es) if config is self.en else (self.en, altered)))
            self.assertTrue(any("index.md" in error and "llmstxt" in error for error in errors), errors)

    def test_agent_markdown_is_cleaned_and_required_per_locale(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            (site / "es/blog/x").mkdir(parents=True)
            (site / "llms.txt").write_text("> Cloud, Data &amp; AI\n", encoding="utf-8")
            (site / "es/blog/x/index.md").write_text("| Tool | ★★★★★4.5/5 | R&amp;D ★ |\n", encoding="utf-8")
            # One summary per locale: a missing Spanish file is a broken build.
            with self.assertRaises(ValueError):
                clean_agent_markdown(site)
            (site / "es/llms.txt").write_text("# landerox.com\n", encoding="utf-8")
            for _ in range(2):
                self.assertEqual(clean_agent_markdown(site), 1)
                self.assertEqual((site / "llms.txt").read_text(encoding="utf-8"), "> Cloud, Data & AI\n")
                self.assertEqual((site / "es/blog/x/index.md").read_text(encoding="utf-8"), "| Tool | 4.5/5 | R&D ★ |\n")

    def test_incorrect_locale_destination_is_rejected(self):
        self.es["project"]["site_url"] = self.en["project"]["site_url"]
        self.assertTrue(configuration_errors(self.en, self.es))

    def test_fenced_examples_do_not_create_headings_or_tabs(self):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / "example.md"
            page.write_text('# Title\n```python\n# comment\n=== "data"\n```\n## Next\n')
            _, headings, tabs = parse_markdown_file(page)
            self.assertEqual(headings, [1, 2])
            self.assertEqual(tabs, [])

    def test_sitemaps_have_reciprocal_language_alternates_without_duplicates(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            (site / "es").mkdir()
            roots = {"en": "https://example.com/", "es": "https://example.com/es/"}
            for locale, root in roots.items():
                path = site / ("" if locale == "en" else locale) / "sitemap.xml"
                path.write_text(f'<urlset xmlns="{SITEMAP_NS}"><url><loc>{root}glossary/</loc></url></urlset>')
            for _ in range(2):
                self.assertEqual(localize_sitemaps(site, roots), 1)
                for path in site.rglob("sitemap.xml"):
                    links = ET.parse(path).findall(f".//{{{XHTML_NS}}}link")
                    self.assertEqual(len(links), 3)
                    self.assertEqual({link.get("hreflang"): link.get("href") for link in links},
                                     {**{locale: root + "glossary/" for locale, root in roots.items()},
                                      "x-default": roots["en"] + "glossary/"})
            (site / "es/sitemap.xml").write_text(f'<urlset xmlns="{SITEMAP_NS}"><url><loc>{roots["es"]}missing/</loc></url></urlset>')
            with self.assertRaisesRegex(ValueError, "missing language counterparts"):
                localize_sitemaps(site, roots)

    def test_theme_bundle_is_deferred_and_keeps_its_place_before_extra_js(self):
        page = ('<script id="__config" type="application/json">{}</script>'
                '<script src="../../assets/javascripts/bundle.3c842f4c.min.js"></script>'
                '<script src="../../assets/javascripts/extra.js" type="module"></script>')
        deferred, count = THEME_BUNDLE.subn(THEME_BUNDLE_DEFERRED, page)
        self.assertEqual(count, 1)
        self.assertIn('bundle.3c842f4c.min.js" defer></script>'
                      '<script src="../../assets/javascripts/extra.js" type="module">', deferred)
        # Already deferred output is left alone, so a re-run is a no-op.
        self.assertEqual(THEME_BUNDLE.subn(THEME_BUNDLE_DEFERRED, deferred)[1], 0)

    def test_social_cards_skip_home_and_noindex_pages_and_guard_glyphs(self):
        head = ('<meta property="og:title" content="{title} - landerox.com">'
                '<meta property="og:description" content="{description}">'
                '<meta property="og:image" content="https://landerox.com/assets/images/social-card.png">')
        tab = '<li class="md-tabs__item md-tabs__item--active">\n<a href="../">\n Blog\n</a>'
        pages = {
            "index.html": head.format(title="Home", description="Home"),
            "blog/x/index.html": head.format(title="Rating", description="Six engines.") + tab,
            "404/index.html": head.format(title="404", description="Missing") + '<meta name="robots" content="noindex">',
        }
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            for name, text in pages.items():
                (site / name).parent.mkdir(parents=True, exist_ok=True)
                (site / name).write_text(text, encoding="utf-8")
            self.assertEqual(publish_social_cards(site), 1)
            self.assertTrue((site / "assets/images/social/blog/x.png").is_file())
            self.assertIn("/assets/images/social/blog/x.png", (site / "blog/x/index.html").read_text())
            for unchanged in ("index.html", "404/index.html"):
                self.assertIn("/social-card.png", (site / unchanged).read_text())
            # A glyph the font subset lacks fails the build instead of drawing tofu.
            (site / "blog/x/index.html").write_text(head.format(title="Ratings →", description="x"))
            with self.assertRaises(SystemExit):
                publish_social_cards(site)

    def test_rating_tables_sort_descending_and_keep_ties_in_order(self):
        table = "\n".join([
            "| Project | Rating | Note |",
            "| :--- | :--- | :--- |",
            '| A | <span class="tool-rating" data-rating="3.5"></span> | first 3.5 |',
            '| B | <span class="tool-rating" data-rating="4.5"></span> | top |',
            '| C | <span class="tool-rating" data-rating="3.5"></span> | second 3.5 |',
            "",
            "    | Proyecto | Madurez | Calificación |",
            "    | :--- | :---: | :---: |",
            "    | A | 0.5 | 1 (limitada desde 2,5) |",
            "    | B | 1 | 4,5 |",
        ])
        ordered = sort_tables(table).split("\n")
        self.assertEqual([row.split("|")[1].strip() for row in ordered[2:5]], ["B", "A", "C"])
        self.assertEqual([row.split("|")[1].strip() for row in ordered[8:10]], ["B", "A"])
        self.assertEqual(sort_tables("\n".join(ordered)), "\n".join(ordered))

    def test_public_page_outside_navigation_is_indexed_only_when_built(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            roots = {"en": "https://example.com/", "es": "https://example.com/es/"}
            for locale, root in roots.items():
                folder = site / ("" if locale == "en" else locale)
                folder.mkdir(exist_ok=True)
                (folder / "sitemap.xml").write_text(f'<urlset xmlns="{SITEMAP_NS}"><url><loc>{root}</loc></url></urlset>')
            with self.assertRaisesRegex(ValueError, "Missing public page"):
                localize_sitemaps(site, roots, ("glossary/",))
            for locale in roots:
                folder = site / ("" if locale == "en" else locale) / "glossary"
                folder.mkdir()
                (folder / "index.html").write_text("<h1>Glossary</h1>")
            for _ in range(2):
                self.assertEqual(localize_sitemaps(site, roots, ("glossary/",)), 2)
            for locale, root in roots.items():
                path = site / ("" if locale == "en" else locale) / "sitemap.xml"
                urls = ET.parse(path).findall(f".//{{{SITEMAP_NS}}}loc")
                self.assertEqual([url.text for url in urls], [root, root + "glossary/"])

    def test_noindex_pages_leave_the_sitemaps(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            roots = {"en": "https://example.com/", "es": "https://example.com/es/"}
            for locale, root in roots.items():
                folder = site / ("" if locale == "en" else locale)
                (folder / "404").mkdir(parents=True)
                (folder / "404" / "index.html").write_text('<meta name="robots" content="noindex">')
                (folder / "sitemap.xml").write_text(
                    f'<urlset xmlns="{SITEMAP_NS}"><url><loc>{root}</loc></url>'
                    f"<url><loc>{root}404/</loc></url></urlset>")
            self.assertEqual(localize_sitemaps(site, roots), 1)
            for locale, root in roots.items():
                path = site / ("" if locale == "en" else locale) / "sitemap.xml"
                urls = ET.parse(path).findall(f".//{{{SITEMAP_NS}}}loc")
                self.assertEqual([url.text for url in urls], [root])


class BlogVersionPins(unittest.TestCase):
    ARTICLE = "\n".join([
        "---",
        "reviewed: 2026-09-23",
        "---",
        "**{sources} {month}**",
        "| [Qdrant 1.19.1](https://github.com/qdrant/qdrant/tree/v1.19.1) | Apache-2.0 |",
        "The [license](https://github.com/qdrant/qdrant/blob/{license}/LICENSE) is permissive.",
        "**Reviewed: [v1.19.1](https://github.com/qdrant/qdrant/releases/tag/v1.19.1), released 2026-09-04.**",
        "Its [architecture](https://github.com/qdrant/qdrant/tree/v1.19.1#architecture) is documented.",
        "The [`1.latest` branch](https://github.com/dbt-labs/dbt/tree/1.latest) stays maintained.",
        "",
    ])

    def write(self, root, license_tag="v1.19.1", month_es="septiembre de 2026"):
        texts = {
            "en": self.ARTICLE.format(sources="Sources reviewed:", month="September 2026", license=license_tag),
            "es": self.ARTICLE.format(sources="Fuentes revisadas:", month=month_es, license=license_tag),
        }
        for locale, text in texts.items():
            folder = root / "content" / locale / "blog"
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "vector-databases.md").write_text(text, encoding="utf-8")
            (folder / "index.md").write_text("# Blog\n", encoding="utf-8")

    def test_newest_tag_keeps_the_pinned_channel_and_skips_prereleases(self):
        cases = [
            ("qdrant/qdrant", "v1.19.1", ["v1.19.2", "v1.20.0-rc1", "v0.9.9", "pkg/v9.9.9"], "v1.19.2"),
            ("ClickHouse/ClickHouse", "v26.8.11.7-lts", ["v26.8.25.14-lts", "v26.9.17.8-stable"], "v26.8.25.14-lts"),
            ("apache/iceberg", "apache-iceberg-1.11.0", ["apache-iceberg-1.12.0", "apache-iceberg-1.13.0-rc2"], "apache-iceberg-1.12.0"),
            ("apache/doris", "4.1.4", ["4.1.4.1", "4.1.5-rc03"], "4.1.4.1"),
            ("pgsty/silo", "RELEASE.2026-09-03T13-18-01Z", ["RELEASE.2026-09-16T00-00-00Z", "v9.9.9"], "RELEASE.2026-09-16T00-00-00Z"),
            ("trinodb/trino", "483", ["484", "477-test-1"], "484"),
            ("apache/age", "PG18/v1.8.0-rc0", ["PG19/v1.9.0-rc0", "PG18/v1.9.0-rc0"], "PG18/v1.9.0-rc0"),
            # Conventions the tag shape cannot express.
            ("ceph/ceph", "v20.2.4", ["v21.1.2", "v20.2.5"], "v20.2.5"),
            ("metabase/metabase", "v0.63.18", ["v1.64.1", "v0.64.1", "v0.64.1.7"], "v0.64.1"),
            ("prefecthq/prefect", "3.8.6", ["3.8.9.dev3", "latest"], "3.8.6"),
            # Old tags from another numbering scheme do not outrank the pin.
            ("apache/superset", "6.1.0", ["2020.51.1", "6.1.1"], "6.1.1"),
            ("dagster-io/dagster", "1.13.24", ["20190509", "1.13.26"], "1.13.26"),
            ("apache/druid", "druid-37.0.0", ["druid-38.0.0"], "druid-38.0.0"),
        ]
        for repo, pin, tags, expected in cases:
            with self.subTest(repo=repo):
                self.assertEqual(blog_versions.newest_tag(repo, pin, tags), expected)
        # Two reviewed lines of one project each follow their own major.
        self.assertEqual(blog_versions.newest_tag("dbt-labs/dbt", "v1.12.5", ["v2.0.5", "v1.12.6"], True), "v1.12.6")
        self.assertEqual(blog_versions.change_kind("druid-37.0.0", "druid-38.0.0"), "major")
        self.assertEqual(blog_versions.change_kind("v1.19.1", "v1.20.0"), "minor")
        self.assertEqual(blog_versions.change_kind("4.1.4", "4.1.4.1"), "patch")

    def test_check_rejects_drifted_license_links_labels_and_review_months(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write(root)
            self.assertEqual(blog_versions.check(root), [])

            self.write(root, license_tag="v1.18.3", month_es="octubre de 2026")
            errors = "\n".join(blog_versions.check(root))
            self.assertIn("file link is pinned to v1.18.3, but the article reviews v1.19.1", errors)
            self.assertIn("content/es/blog/vector-databases.md:4: shows octubre 2026", errors)

            english = root / "content/en/blog/vector-databases.md"
            english.write_text(english.read_text().replace("[Qdrant 1.19.1]", "[Qdrant 1.18.0]"))
            errors = "\n".join(blog_versions.check(root))
            self.assertIn('link text "Qdrant 1.18.0" does not name the pinned version 1.19.1', errors)

            self.write(root)
            english.write_text(english.read_text().replace("releases/tag/v1.19.1", "releases/tag/v1.19.0"))
            errors = "\n".join(blog_versions.check(root))
            self.assertIn("not pinned identically in EN and ES", errors)
            # A second pin of the same release line is a link a bump missed.
            self.assertIn("is pinned to v1.19.0, v1.19.1; one reviewed version per release line", errors)

    def test_report_and_apply_bump_urls_and_labels_but_leave_dates_for_review(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write(root)
            tags = {"qdrant/qdrant": ["v1.19.1", "v1.19.2", "v1.20.0-rc1"]}
            results = blog_versions.findings(root, tags.get)
            self.assertEqual([(f.repo, f.pinned, f.newest) for f in results], [("qdrant/qdrant", "v1.19.1", "v1.19.2")])
            row = f"| vector-databases | {results[0].repo} | `v1.19.1` | `v1.19.2` | patch |"
            self.assertIn(row, blog_versions.report(results))
            # A newer tag counts only once upstream publishes it as a release.
            tagged = blog_versions.findings(root, {"qdrant/qdrant": ["v1.19.1", "v1.19.2", "v1.19.3"]}.get)
            self.assertEqual(tagged[0].newest, "v1.19.3")
            published = {"qdrant/qdrant": {"released": {"v1.19.1", "v1.19.2"}}}
            confirmed = blog_versions.confirm(tagged, published)[0]
            self.assertEqual((confirmed.newest, confirmed.unreleased), ("v1.19.2", "v1.19.3"))
            # A project that releases by tag alone is taken at its tags.
            self.assertEqual(blog_versions.confirm(tagged, {"qdrant/qdrant": {"released": set()}})[0].newest, "v1.19.3")
            # An unreadable repository is reported, never treated as current.
            unreadable = blog_versions.findings(root, lambda repo: None)
            self.assertIn("1 unreadable", blog_versions.report(unreadable))

            review = blog_versions.apply(results, root)
            for locale in ("en", "es"):
                text = (root / "content" / locale / "blog/vector-databases.md").read_text()
                self.assertIn("[Qdrant 1.19.2](https://github.com/qdrant/qdrant/tree/v1.19.2)", text)
                self.assertIn("blob/v1.19.2/LICENSE", text)
                self.assertIn("[v1.19.2](https://github.com/qdrant/qdrant/releases/tag/v1.19.2), released 2026-09-04", text)
                self.assertIn("tree/1.latest", text)
                # A fragment after the ref does not hide the pin from the bump.
                self.assertIn("tree/v1.19.2#architecture", text)
            self.assertTrue(any("released 2026-09-04" in line for line in review))
            self.assertEqual(blog_versions.check(root), [])
