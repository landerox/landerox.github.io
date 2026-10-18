#!/usr/bin/env python3
import gzip
import html
import json
import pathlib
import re
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
# Pages that ask not to be indexed (the 404 pages) stay out of the sitemaps.
NOINDEX = re.compile(r'<meta name="robots" content="[^"]*\bnoindex\b')
XHTML_NS = "http://www.w3.org/1999/xhtml"
ATOM_NS = "http://www.w3.org/2005/Atom"

# Articles show only the review month; the exact day lives in the `reviewed`
# front matter, which the template emits as article:modified_time.
REVIEWED = re.compile(r'<meta property="article:modified_time" content="(\d{4}-\d{2}-\d{2})">')
# Each article's own social card, published before the article metadata.
OG_IMAGE = re.compile(r'<meta property="og:image" content="(https://[^"]+)">')
# The llmstxt exporter leaves `&amp;` in Markdown text and copies the five
# decorative rating glyphs that CSS fills on the page; the number follows.
RATING_GLYPHS = re.compile(r"★{5}(?=\d)")
PERSON_ID = "https://landerox.com/#person"
BLOG_LOCALES = (
    # (built locale dir, base URL, language, WebSite @id)
    ("", "https://landerox.com/", "en", "https://landerox.com/#website"),
    ("es", "https://landerox.com/es/", "es", "https://landerox.com/es/#website"),
)


def localize_sitemaps(site_dir, locale_roots, additional_pages=(), default_locale="en"):
    """Publish reciprocal per-page hreflang without Modern's root-link handler.

    `x-default` names the page a visitor gets when no language matches.
    `noindex` pages are dropped; `additional_pages` must be listed.
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
            page = path.parent / relative / "index.html"
            if page.is_file() and NOINDEX.search(page.read_text(encoding="utf-8")):
                tree.getroot().remove(entry)
                continue
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
        image = OG_IMAGE.search(content)
        if not image:
            raise ValueError(f"{page}: no og:image for the article metadata")
        articles.append((date, title, description, url))
        data = {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": title,
            "description": description,
            "inLanguage": lang,
            "url": url,
            "mainEntityOfPage": url,
            "image": image.group(1),
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

    def atom(tag):
        return f"{{{ATOM_NS}}}{tag}"

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
        # The root 404.html is the locale router, not a page.
        if page == site_dir / "404.html":
            continue
        content = page.read_text(encoding="utf-8")
        if "</head>" in content and 'type="application/atom+xml"' not in content:
            page.write_text(content.replace("</head>", link + "</head>", 1), encoding="utf-8")
    return len(articles)


def clean_agent_markdown(site_dir):
    """Decode ampersands and drop decorative glyphs for agents."""
    summaries = sorted(site_dir.rglob("llms.txt"))
    pages = sorted(site_dir.rglob("index.md"))
    if len(summaries) != len(BLOG_LOCALES) or not pages:
        raise ValueError("llmstxt output is missing: expected one llms.txt per locale and a Markdown twin per page")
    for path in (*summaries, *pages):
        content = path.read_text(encoding="utf-8")
        cleaned = RATING_GLYPHS.sub("", content.replace("&amp;", "&"))
        if cleaned != content:
            path.write_text(cleaned, encoding="utf-8")
    return len(pages)


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
        # a second run finds every page already deferred.
        if not any(DEFERRED_BUNDLE.search(page.read_text(encoding="utf-8"))
                   for page in SITE_DIR.rglob("*.html")):
            raise SystemExit("Theme bundle <script> not found: re-check THEME_BUNDLE after a Zensical bump.")
        with pathlib.Path("zensical.toml").open("rb") as config_file:
            config = tomllib.load(config_file)
        locale_roots = {alt["lang"]: alt["link"] for alt in config["project"]["extra"]["alternate"]}
        # The glossary sits outside the navigation (the header opens it), so
        # the sitemap must list it whatever the generator emits.
        pages = localize_sitemaps(SITE_DIR, locale_roots, ("glossary/",))
        print(f"Sitemap language alternates: {pages} pages per locale.")
        print(f"Agent Markdown: {clean_agent_markdown(SITE_DIR)} pages.")
        # Cards first: the article metadata names each article's own card.
        print(f"Social cards: {publish_social_cards(SITE_DIR)} pages.")
        for locale_dir, base_url, lang, website_id in BLOG_LOCALES:
            count = publish_blog_metadata(SITE_DIR, locale_dir, base_url, lang, website_id)
            print(f"Blog feed and article metadata ({lang}): {count} articles.")
    else:
        raise SystemExit("site/ does not exist: run just build first.")
