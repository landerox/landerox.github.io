"""Meaningful regressions for shared settings and authored Markdown parsing."""
import copy
import tempfile
import tomllib
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

from check_i18n import configuration_errors, parse_markdown_file
from sort_ratings import sort_tables
from post_build import localize_sitemaps, SITEMAP_NS, THEME_BUNDLE, THEME_BUNDLE_DEFERRED, XHTML_NS
from social_cards import publish_social_cards


class SiteContracts(unittest.TestCase):
    def setUp(self):
        self.en = tomllib.loads(Path("zensical.toml").read_text())
        self.es = tomllib.loads(Path("zensical.es.toml").read_text())

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
        ]
        for change in changes:
            with self.subTest(change=change):
                altered = copy.deepcopy(self.es)
                change(altered["project"])
                self.assertTrue(configuration_errors(self.en, altered))

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
