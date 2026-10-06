#!/usr/bin/env python3
import html
import json
import pathlib
import re
import gzip
import tomllib
import xml.etree.ElementTree as ET

from social_cards import publish_social_cards

SITE_DIR = pathlib.Path("site")

# <meta name="generator" content="zensical-..."> in every page head.
GENERATOR_TAG = re.compile(r'<meta\s+name="generator"\s+content="zensical-[^"]*"\s*/?>')

# The `markdown` attribute that md_in_html reads from authored <div> blocks
# (`<div class="lab-entry" markdown>`) survives into the output as a
# non-standard HTML attribute. It carries no runtime meaning.
MARKDOWN_ATTRIBUTE = re.compile(r'(<[a-zA-Z][^>]*?)\s+markdown(?:="[^"]*")?(?=[\s>/])')

# The theme's bundle is a classic script at the end of <body>. Parser-blocking,
# it could hold the first paint until it had downloaded and run, so
# Lighthouse's simulated LCP swung between about 2.6 s and 4 s on long pages.
# `defer` keeps document order: the bundle still runs before extra.js (a
# module, deferred too), which reads `document$`.
THEME_BUNDLE = re.compile(
    r'<script src="([^"]*assets/javascripts/bundle\.[0-9a-f]+\.min\.js)"></script>'
)
THEME_BUNDLE_DEFERRED = r'<script src="\1" defer></script>'
DEFERRED_BUNDLE = re.compile(r'assets/javascripts/bundle\.[0-9a-f]+\.min\.js" defer></script>')

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"
ATOM_NS = "http://www.w3.org/2005/Atom"

# Articles show only the review month; the exact day lives in the `reviewed`
# front matter, which the template emits as article:modified_time.
REVIEWED = re.compile(r'<meta property="article:modified_time" content="(\d{4}-\d{2}-\d{2})">')
PERSON_ID = "https://landerox.com/#person"
BLOG_LOCALES = (
    # (built locale dir, base URL, language, WebSite @id)
    ("", "https://landerox.com/", "en", "https://landerox.com/#website"),
    ("es", "https://landerox.com/es/", "es", "https://landerox.com/es/#website"),
)


def localize_sitemaps(site_dir, locale_roots, additional_pages=(), default_locale="en"):
    """Publish reciprocal per-page hreflang without Modern's root-link handler.

    `x-default` names the page a visitor gets when no language matches.
    """
    ET.register_namespace("", SITEMAP_NS)
    ET.register_namespace("xhtml", XHTML_NS)
    maps = {}
    for locale, root in locale_roots.items():
        path = site_dir / ("" if locale == "en" else locale) / "sitemap.xml"
        tree = ET.parse(path)
        entries = {}
        for entry in tree.findall(f"{{{SITEMAP_NS}}}url"):
            url = entry.findtext(f"{{{SITEMAP_NS}}}loc", "")
            if not url.startswith(root):
                raise ValueError(f"Unexpected URL in {locale} sitemap: {url}")
            relative = url[len(root):]
            if relative in entries:
                raise ValueError(f"Duplicate URL in {locale} sitemap: {url}")
            entries[relative] = entry
        for relative in additional_pages:
            if not (path.parent / relative / "index.html").is_file():
                raise ValueError(f"Missing public page in {locale}: {relative}")
            if relative not in entries:
                entry = ET.SubElement(tree.getroot(), f"{{{SITEMAP_NS}}}url")
                ET.SubElement(entry, f"{{{SITEMAP_NS}}}loc").text = root + relative
                entries[relative] = entry
        if not entries:
            raise ValueError(f"Empty {locale} sitemap")
        maps[locale] = (path, tree, entries)
    expected = set(maps["en"][2])
    if any(set(entries) != expected for _, _, entries in maps.values()):
        raise ValueError("Sitemap pages have missing language counterparts")
    for path, tree, entries in maps.values():
        for relative, entry in entries.items():
            for link in list(entry.findall(f"{{{XHTML_NS}}}link")):
                entry.remove(link)
            alternates = [*locale_roots.items(), ("x-default", locale_roots[default_locale])]
            for hreflang, root in alternates:
                ET.SubElement(entry, f"{{{XHTML_NS}}}link", {
                    "rel": "alternate", "hreflang": hreflang, "href": root + relative,
                })
        ET.indent(tree, space="  ")
        tree.write(path, encoding="utf-8", xml_declaration=True)
        compressed = path.with_suffix(".xml.gz")
        if compressed.exists():
            compressed.write_bytes(gzip.compress(path.read_bytes(), mtime=0))
    return len(expected)


def page_meta(page_html):
    """Title (H1 text), description and canonical URL of a built page."""
    heading = re.search(r"<h1[^>]*>(.*?)</h1>", page_html, re.S)
    description = re.search(r'<meta name="description" content="([^"]*)"', page_html)
    canonical = re.search(r'<link rel="canonical" href="([^"]*)"', page_html)
    if not (heading and description and canonical):
        raise ValueError("Blog page lacks an H1, description or canonical URL")
    title = html.unescape(re.sub(r"<[^>]+>", "", heading.group(1))).strip()
    return title, html.unescape(description.group(1)), canonical.group(1)


def publish_blog_metadata(site_dir, locale_dir, base_url, lang, website_id):
    """Article JSON-LD, an Atom feed and its autodiscovery link per locale."""
    root = site_dir / locale_dir if locale_dir else site_dir
    blog = root / "blog"
    articles = []
    for page in sorted(blog.glob("*/index.html")):
        content = page.read_text(encoding="utf-8")
        reviewed = REVIEWED.search(content)
        if not reviewed:
            raise ValueError(f"{page}: no `reviewed` date in the front matter")
        title, description, url = page_meta(content)
        date = reviewed.group(1)
        articles.append((date, title, description, url))
        data = {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": title,
            "description": description,
            "inLanguage": lang,
            "url": url,
            "mainEntityOfPage": url,
            "dateModified": date,
            "author": {"@type": "Person", "@id": PERSON_ID, "name": "Fernando Landero"},
            "publisher": {"@id": PERSON_ID},
            "isPartOf": {"@id": website_id},
        }
        script = ('<script type="application/ld+json">'
                  + json.dumps(data, ensure_ascii=False).replace("<", "\\u003c") + "</script>")
        if '"@type": "TechArticle"' not in content:
            page.write_text(content.replace("</head>", script + "</head>", 1), encoding="utf-8")
    if not articles:
        raise ValueError(f"No Blog articles under {blog}")

    # Newest review first; ties keep a stable title order.
    articles.sort(key=lambda item: (item[0], item[1]), reverse=True)
    _, blog_description, blog_url = page_meta((blog / "index.html").read_text(encoding="utf-8"))
    feed_url = blog_url + "feed.xml"
    ET.register_namespace("", ATOM_NS)
    atom = lambda tag: f"{{{ATOM_NS}}}{tag}"
    feed = ET.Element(atom("feed"), {"{http://www.w3.org/XML/1998/namespace}lang": lang})
    ET.SubElement(feed, atom("title")).text = "landerox.com · Blog"
    ET.SubElement(feed, atom("subtitle")).text = blog_description
    ET.SubElement(feed, atom("id")).text = blog_url
    ET.SubElement(feed, atom("link"), {"rel": "self", "href": feed_url})
    ET.SubElement(feed, atom("link"), {"rel": "alternate", "type": "text/html", "href": blog_url})
    ET.SubElement(feed, atom("updated")).text = articles[0][0] + "T00:00:00Z"
    author = ET.SubElement(feed, atom("author"))
    ET.SubElement(author, atom("name")).text = "Fernando Landero"
    ET.SubElement(author, atom("uri")).text = base_url
    for date, title, description, url in articles:
        entry = ET.SubElement(feed, atom("entry"))
        ET.SubElement(entry, atom("title")).text = title
        ET.SubElement(entry, atom("id")).text = url
        ET.SubElement(entry, atom("link"), {"rel": "alternate", "type": "text/html", "href": url})
        ET.SubElement(entry, atom("updated")).text = date + "T00:00:00Z"
        ET.SubElement(entry, atom("summary")).text = description
    ET.indent(feed)
    (blog / "feed.xml").write_bytes(ET.tostring(feed, encoding="utf-8", xml_declaration=True) + b"\n")

    # Autodiscovery from every page of the locale (Spanish pages live under es/).
    link = f'<link rel="alternate" type="application/atom+xml" title="landerox.com · Blog" href="{feed_url}">'
    pages = root.rglob("*.html") if locale_dir else (
        path for path in root.rglob("*.html") if path.relative_to(root).parts[0] != "es")
    for page in pages:
        content = page.read_text(encoding="utf-8")
        if "</head>" in content and 'type="application/atom+xml"' not in content:
            page.write_text(content.replace("</head>", link + "</head>", 1), encoding="utf-8")
    return len(articles)


def rewrite_html(label, pattern, replacement, action="removed"):
    """Apply one substitution to every built page and return the count."""
    count = 0
    for file_path in SITE_DIR.rglob("*.html"):
        content = file_path.read_text(encoding="utf-8")
        rewritten, replacements = pattern.subn(replacement, content)
        if replacements > 0:
            file_path.write_text(rewritten, encoding="utf-8")
            count += replacements
    print(f"{label}: {count} {action}.")
    return count


if __name__ == "__main__":
    if SITE_DIR.exists():
        print("Sanitizing build output...")
        rewrite_html("Generator tags", GENERATOR_TAG, "")
        rewrite_html("Leftover markdown attributes", MARKDOWN_ATTRIBUTE, r"\1")
        rewrite_html("Theme bundle", THEME_BUNDLE, THEME_BUNDLE_DEFERRED, "deferred")
        # A theme release that renames or reshapes the tag must fail loudly;
        # pages an incremental build left untouched are already deferred.
        if not any(DEFERRED_BUNDLE.search(page.read_text(encoding="utf-8"))
                   for page in SITE_DIR.rglob("*.html")):
            raise SystemExit("Theme bundle <script> not found: re-check THEME_BUNDLE after a Zensical bump.")
        with pathlib.Path("zensical.toml").open("rb") as config_file:
            config = tomllib.load(config_file)
        locale_roots = {alt["lang"]: alt["link"] for alt in config["project"]["extra"]["alternate"]}
        # The dock owns glossary discovery. Zensical omits pages outside nav
        # from its sitemap, so include this indexable reference explicitly.
        pages = localize_sitemaps(SITE_DIR, locale_roots, ("glossary/",))
        print(f"Sitemap language alternates: {pages} pages per locale.")
        # The glossary replaces article retrieval. Incremental builds must
        # not publish an index left behind by the retired source guide.
        for locale_dir in (SITE_DIR, SITE_DIR / "es"):
            (locale_dir / "assistant-index.json").unlink(missing_ok=True)
        for locale_dir, base_url, lang, website_id in BLOG_LOCALES:
            count = publish_blog_metadata(SITE_DIR, locale_dir, base_url, lang, website_id)
            print(f"Blog feed and article metadata ({lang}): {count} articles.")
        print(f"Social cards: {publish_social_cards(SITE_DIR)} pages.")
    else:
        print("Site directory does not exist. Run build first.")
