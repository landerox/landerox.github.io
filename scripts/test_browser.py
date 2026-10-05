"""Browser regressions against an isolated bilingual build, using locked Playwright."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import re
import shutil
import tempfile
import threading
import unittest
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urlparse

from playwright.sync_api import expect, sync_playwright

# The catalog is the source of truth for every term count below.
CATALOG = Path(__file__).resolve().parents[1] / "content/en/assets/glossary.json"
TERMS = len(json.loads(CATALOG.read_text(encoding="utf-8"))["terms"])


def luminance(rgb):
    channels = [c / 255 for c in rgb]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return sum(c * weight for c, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(a, b):
    light, dark = sorted((luminance(a), luminance(b)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class BrowserContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not Path("site/es/glossary/index.html").is_file():
            raise RuntimeError("Run just build before the browser tests.")
        cls.scratch = tempfile.TemporaryDirectory(prefix="landerox-browser-")
        cls.root = Path(cls.scratch.name) / "site"
        shutil.copytree("site", cls.root)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=cls.root))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.scratch.cleanup()

    def setUp(self):
        self.errors = []
        self.context = self.browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        self.context.route("**/*", self.route)
        self.page = self.context.new_page()
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.set_default_timeout(6000)

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], "Browser exceptions")

    def route(self, route):
        url = urlparse(route.request.url)
        if route.request.url.startswith(self.base):
            route.continue_()
        elif url.hostname == "landerox.com":
            # Fulfill production-origin navigation from the same local snapshot.
            relative = unquote(url.path).lstrip("/")
            file = (self.root / relative).resolve()
            if file.is_relative_to(self.root) and file.is_dir() and not url.path.endswith("/"):
                route.fulfill(status=301, headers={"location": url.path + "/"}, body="")
                return
            if file.is_dir():
                file /= "index.html"
            if file.is_relative_to(self.root) and file.is_file():
                route.fulfill(body=file.read_bytes(), content_type=mimetypes.guess_type(file)[0] or "application/octet-stream")
            else:
                route.fulfill(status=404, body="Not found")
        else:
            route.abort()

    def goto(self, path, scheme="default"):
        self.page.goto(self.base + path, wait_until="networkidle")
        self.page.locator(f'input[data-md-color-scheme="{scheme}"]').evaluate("el => el.click()")
        expect(self.page.locator("body")).to_have_attribute("data-md-color-scheme", scheme)

    def no_overflow(self):
        bounds = self.page.evaluate("""() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
          dialogs: [...document.querySelectorAll('dialog[open]')].map(el => ({width: el.clientWidth, content: el.scrollWidth}))
        })""")
        self.assertLessEqual(bounds["content"], bounds["viewport"] + 1, bounds)
        for dialog in bounds["dialogs"]:
            self.assertLessEqual(dialog["content"], dialog["width"] + 1, dialog)

    def test_cli_keyboard_help_focus_and_module_loading(self):
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                with self.subTest(locale=locale, scheme=scheme):
                    self.page.set_viewport_size({"width": 390, "height": 844})
                    self.goto(locale + "/", scheme)
                    self.page.locator("h1").click()
                    self.page.keyboard.press("~")
                    expect(self.page.locator("dialog[open]")).to_have_count(0)
                    opener = self.page.locator("#dock-btn-term")
                    opener.focus()
                    self.page.keyboard.press("Control+`")
                    field = self.page.locator("#term-input")
                    expect(field).to_be_focused()
                    field.fill("hel")
                    field.press("Tab")
                    expect(field).to_have_value("help")
                    field.press("Enter")
                    expect(self.page.locator(".term-help-summary > div")).to_have_count(19)
                    field.fill("help ip")
                    field.press("Enter")
                    expect(self.page.locator(".term-example")).to_have_count(1)
                    field.fill("cron 0 6 * * tue")
                    field.press("Enter")
                    expect(self.page.locator(".term-values").last.locator("dt")).to_have_count(5)
                    expect(self.page.locator(".term-values").last).to_contain_text("06:00 UTC")
                    field.fill("nines 99.9")
                    field.press("Enter")
                    expect(self.page.locator(".term-values").last).to_contain_text("43 min 12 s")
                    field.fill("uuid 1")
                    field.press("Enter")
                    expect(field).to_have_value("")
                    field.fill("draft")
                    field.press("ArrowUp")
                    expect(field).to_have_value("uuid 1")
                    field.press("ArrowDown")
                    expect(field).to_have_value("draft")
                    field.fill("<img src=x onerror=alert(1)>")
                    field.press("Enter")
                    expect(self.page.locator("dialog img")).to_have_count(0)
                    self.no_overflow()
                    self.page.set_viewport_size({"width": 844, "height": 390})
                    self.no_overflow()
                    self.page.keyboard.press("Escape")
                    expect(opener).to_be_focused()
                    resources = self.page.evaluate("performance.getEntriesByType('resource').map(x => x.name)")
                    self.assertFalse(any(name in resource for resource in resources for name in ("/sql.js", "/sql-core.js", "/failure.js", "/failure-core.js", "/decision-tools.js")))

    def test_glossary_modal_and_public_page(self):
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                with self.subTest(locale=locale, scheme=scheme):
                    self.page.set_viewport_size({"width": 320, "height": 720})
                    self.goto(locale + "/", scheme)
                    self.page.locator("#dock-btn-glossary").click()
                    expect(self.page.locator(".glossary-card")).to_have_count(TERMS)
                    search = self.page.locator("#glossary-search")
                    # cspell:disable-next-line
                    search.fill("idempotnecia")
                    expect(self.page.locator(".glossary-card")).to_have_count(1)
                    expect(self.page.locator(".glossary-match-note")).to_be_visible()
                    self.no_overflow()
                    self.page.locator('.glossary-related a[href$="#backoff"]').click()
                    expect(self.page.locator("[data-glossary-page]")).to_be_visible()
                    expect(self.page.locator("#backoff")).to_be_in_viewport()
                    expect(self.page.locator(".glossary-entry")).to_have_count(TERMS)
                    search = self.page.locator("#glossary-page-search")
                    search.fill("dlq")
                    expect(self.page.locator(".glossary-entry:visible")).to_have_count(1)
                    self.page.locator('.glossary-entry:visible .glossary-related a[href$="#backoff"]').click()
                    expect(search).to_have_value("")
                    expect(self.page.locator("#backoff")).to_be_focused()
                    search.fill("RAG")
                    self.page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
                    expect(self.page.locator(".glossary-entry:visible")).to_have_count(TERMS)
                    self.page.evaluate("window.dispatchEvent(new Event('afterprint'))")
                    expect(search).to_have_value("RAG")
                    self.assertLess(self.page.locator(".glossary-entry:visible").count(), TERMS)
                    self.no_overflow()

    def test_mobile_theme_controls_use_keyboard_buttons(self):
        for locale in ("", "/es"):
            self.goto(locale + "/")
            drawer = self.page.locator('[for="__drawer"] > .theme-toggle-button')
            drawer.focus()
            drawer.press("Enter")
            expect(self.page.locator("#__drawer")).to_be_checked()
            expect(drawer).to_have_attribute("aria-expanded", "true")
            self.page.keyboard.press("Escape")
            expect(self.page.locator("#__drawer")).not_to_be_checked()
            expect(drawer).to_be_focused()
            search = self.page.locator('[for="__search"] > .theme-toggle-button')
            field = self.page.locator('input[role="combobox"]')

            def assert_search_closed():
                expect(search).to_be_focused()
                field.focus()
                expect(search).to_be_focused()
                # Role locators do not account for inert in this Playwright
                # release. Check Chromium's actual accessibility tree.
                client = self.context.new_cdp_session(self.page)
                try:
                    nodes = client.send("Accessibility.getFullAXTree")["nodes"]
                    self.assertFalse(any(not node["ignored"] and node.get("role", {}).get("value") == "combobox" for node in nodes))
                finally:
                    client.detach()

            search.focus()
            search.press("Space")
            expect(self.page.get_by_role("combobox")).to_be_visible()
            expect(self.page.get_by_role("combobox")).to_be_focused()
            self.page.keyboard.press("Escape")
            assert_search_closed()
            search.press("Space")
            expect(self.page.get_by_role("combobox")).to_be_focused()
            self.page.get_by_role("button", name="Close search" if not locale else "Cerrar búsqueda", exact=True).click()
            assert_search_closed()
            expect(self.page.locator("label[aria-label]")).to_have_count(0)
            self.no_overflow()

    def test_motion_toggle_and_shared_storage_scope(self):
        # The toggle only exists while motion is allowed; setUp reduces it.
        with self.browser.new_context(viewport={"width": 1440, "height": 900}) as context:
            context.route("**/*", self.route)
            page = context.new_page()
            page.on("pageerror", lambda error: self.errors.append(str(error)))
            page.goto(self.base + "/", wait_until="networkidle")
            toggle = page.locator(".motion-option--header .motion-toggle")
            expect(toggle).to_have_attribute("aria-pressed", "false")
            toggle.click()
            expect(page.locator("html")).to_have_attribute("data-motion", "paused")
            expect(toggle).to_have_attribute("aria-pressed", "true")
            ring = page.locator(".hud-ring-outer").evaluate("el => getComputedStyle(el).animationPlayState")
            self.assertEqual(ring, "paused")
            # Palette and motion choices carry across locales under one scope.
            page.locator('input[data-md-color-scheme="slate"]').evaluate("el => el.click()")
            page.goto(self.base + "/es/", wait_until="networkidle")
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "slate")
            expect(page.locator("html")).to_have_attribute("data-motion", "paused")
            expect(page.locator(".motion-option--header .motion-toggle")).to_have_attribute("aria-label", "Pausar animaciones")
            page.set_viewport_size({"width": 320, "height": 640})
            expect(page.locator(".motion-option--header")).to_be_hidden()
            expect(page.locator(".motion-option--footer .motion-toggle")).to_be_visible()
        self.goto("/")
        expect(self.page.locator(".motion-option--header")).to_be_hidden()

    def test_reduced_motion_keeps_the_network_as_a_still_frame(self):
        frame = "el => el.toDataURL()"
        # Nodes are painted: some pixel of the frame is not transparent.
        painted = """el => { const data = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
          for (let i = 3; i < data.length; i += 4 * 97) if (data[i]) return true; return false; }"""
        # setUp reduces motion: one frame, identical a moment later.
        self.page.set_viewport_size({"width": 1440, "height": 900})
        self.goto("/", "slate")
        canvas = self.page.locator("#neural-background")
        expect(canvas).to_be_visible()
        self.assertTrue(canvas.evaluate(painted))
        first = canvas.evaluate(frame)
        self.page.wait_for_timeout(700)
        self.assertEqual(canvas.evaluate(frame), first)
        # Instant navigation keeps the same still network.
        self.page.locator(".md-tabs__link", has_text="About").click()
        expect(self.page).to_have_url(re.compile(r"/about/$"))
        expect(canvas).to_be_visible()
        # Without the preference the same canvas drifts.
        with self.browser.new_context(viewport={"width": 1440, "height": 900}) as context:
            context.route("**/*", self.route)
            page = context.new_page()
            page.on("pageerror", lambda error: self.errors.append(str(error)))
            page.goto(self.base + "/", wait_until="networkidle")
            moving = page.locator("#neural-background")
            before = moving.evaluate(frame)
            page.wait_for_timeout(700)
            self.assertNotEqual(moving.evaluate(frame), before)

    def test_glossary_retry_retains_query(self):
        self.goto("/")
        attempts = []
        def catalog(route):
            attempts.append(True)
            if len(attempts) == 1:
                route.fulfill(status=503, body="Try later")
            else:
                route.continue_()
        self.page.route("**/assets/glossary.json", catalog)
        self.page.locator("#dock-btn-glossary").click()
        search = self.page.locator("#glossary-search")
        search.fill("idempotencia")
        self.page.locator("#glossary-results button").click()
        expect(self.page.locator(".glossary-card")).to_have_count(1)
        expect(search).to_have_value("idempotencia")
        self.assertEqual(len(attempts), 2)

    def test_static_glossary_and_language_metadata(self):
        for locale in ("", "/es"):
            for path in ("/", "/glossary/", "/projects/tools/", "/projects/open-source/", "/blog/object-storage/",
                         "/blog/workflow-orchestrators/", "/blog/olap-databases/",
                         "/blog/vector-databases/", "/blog/data-transformation/",
                         "/blog/business-intelligence/", "/blog/lakehouse-table-formats/",
                         "/blog/graph-databases/", "/blog/observability/"):
                with self.subTest(locale=locale, path=path):
                    self.goto(locale + path)
                    expected = {"en": "https://landerox.com" + path, "es": "https://landerox.com/es" + path}
                    expect(self.page.locator('head link[hreflang]')).to_have_count(0)
                    selector = self.page.locator(".md-select__link[hreflang]").evaluate_all("es => Object.fromEntries(es.map(e => [e.hreflang, e.href]))")
                    self.assertEqual(selector, expected)
        with self.browser.new_context(java_script_enabled=False) as context:
            context.route("**/*", self.route)
            page = context.new_page()
            for locale in ("", "/es"):
                page.goto(self.base + locale + "/glossary/")
                expect(page.locator(".glossary-entry:visible")).to_have_count(TERMS)
                data = json.loads(page.locator('script[type="application/ld+json"]').text_content())
                self.assertEqual(len(data["hasDefinedTerm"]), TERMS)
                for term in data["hasDefinedTerm"]:
                    expect(page.locator("#" + term["@id"].split("#")[1])).to_have_text(term["name"])
        for locale in ("", "es/"):
            tree = ET.parse(self.root / locale / "sitemap.xml")
            urls = [entry.text for entry in tree.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
            self.assertIn("https://landerox.com/" + locale + "glossary/", urls)
            for entry in tree.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url"):
                url = entry.findtext("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
                relative = url.removeprefix("https://landerox.com/" + locale)
                alternates = {link.get("hreflang"): link.get("href") for link in entry.findall("{http://www.w3.org/1999/xhtml}link")}
                self.assertEqual(alternates, {"en": "https://landerox.com/" + relative, "es": "https://landerox.com/es/" + relative,
                                              "x-default": "https://landerox.com/" + relative})
        # One Atom feed per locale lists every article; each article's TechArticle
        # carries its front-matter review date, while the body shows only the month.
        atom = "{http://www.w3.org/2005/Atom}"
        for locale in ("", "es/"):
            blog = self.root / locale / "blog"
            entries = ET.parse(blog / "feed.xml").getroot().findall(atom + "entry")
            slugs = sorted(page.parent.name for page in blog.glob("*/index.html"))
            self.assertEqual(sorted(entry.findtext(atom + "id").rstrip("/").rsplit("/", 1)[1] for entry in entries), slugs)
            for entry in entries:
                slug = entry.findtext(atom + "id").rstrip("/").rsplit("/", 1)[1]
                article = (blog / slug / "index.html").read_text(encoding="utf-8")
                data = [json.loads(block) for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', article, re.S)]
                meta = next(block for block in data if block.get("@type") == "TechArticle")
                self.assertEqual(meta["dateModified"], entry.findtext(atom + "updated")[:10])
                self.assertIn(f'<meta property="article:modified_time" content="{meta["dateModified"]}">', article)
                self.assertNotIn(meta["dateModified"], article.split("</head>", 1)[1])
        failed_responses = []
        self.page.on("response", lambda response: failed_responses.append(response.url) if response.status >= 400 else None)
        # Exercise the same origin as production while fulfilling every request
        # from the local build. Cross-origin localhost navigation masks defects.
        self.page.goto("https://landerox.com/projects/tools/", wait_until="networkidle")
        self.page.locator('.md-select__link[hreflang="es"]').evaluate("el => el.click()")
        expect(self.page.locator("html")).to_have_attribute("lang", "es")
        self.assertTrue(self.page.url.endswith("/es/projects/tools/"))
        self.page.locator("#dock-btn-term").click()
        expect(self.page.locator("#term-input")).to_be_focused()
        self.page.locator("#term-input").fill("help")
        self.page.locator("#term-input").press("Enter")
        expect(self.page.locator(".term-help-summary")).to_contain_text("Ver comandos")
        self.assertEqual(failed_responses, [])

    def test_blog_tables_and_disclosures_on_mobile(self):
        for locale in ("", "/es"):
            for article in ("object-storage", "workflow-orchestrators", "olap-databases", "vector-databases",
                            "data-transformation", "business-intelligence", "lakehouse-table-formats",
                            "graph-databases", "observability"):
                for scheme, viewport in (("default", {"width": 320, "height": 720}),
                                         ("slate", {"width": 844, "height": 390})):
                    with self.subTest(locale=locale, article=article, scheme=scheme):
                        self.page.set_viewport_size(viewport)
                        self.goto(f"{locale}/blog/{article}/", scheme)
                        table = self.page.locator(".md-typeset__scrollwrap").first
                        if table.evaluate("el => el.scrollWidth > el.clientWidth + 1"):
                            expect(table).to_have_attribute("tabindex", "0")
                            expect(table).to_have_attribute("role", "region")
                            table.focus()
                            table.press("ArrowRight")
                            self.page.wait_for_function(
                                "el => el.scrollLeft > 0", arg=table.element_handle())
                        summary = self.page.locator("details.faq-item > summary").first
                        summary.focus()
                        summary.press("Enter")
                        expect(summary.locator("..")).to_have_attribute("open", "")
                        self.no_overflow()

    def test_tools_mobile_lazy_loading_and_stale_results(self):
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                with self.subTest(locale=locale, scheme=scheme):
                    self.page.set_viewport_size({"width": 320, "height": 720})
                    self.goto(locale + "/projects/tools/", scheme)
                    tabs = self.page.locator(".md-content .tabbed-labels").first.locator("label")
                    tabs.nth(0).click()
                    expect(self.page.locator("#failure-step")).to_be_visible()
                    self.page.locator("#failure-step").click()
                    self.no_overflow()
                    tabs.nth(1).click()
                    expect(self.page.locator("#calc-preset")).to_be_visible()
                    self.no_overflow()
                    tabs.nth(2).click()
                    sql = self.page.locator("#sql-textarea")
                    sql.fill("SELECT * FROM benchmarks LIMIT 1")
                    sql.press("Control+Enter")
                    expect(self.page.locator("#sql-results tbody tr")).to_have_count(1)
                    expect(self.page.locator("#sql-export")).to_be_enabled()
                    with self.page.expect_download() as download:
                        self.page.locator("#sql-export").click()
                    self.assertIn("scenario", Path(download.value.path()).read_text())
                    sql.fill("SELECT * FROM benchmarks; DROP TABLE benchmarks")
                    expect(self.page.locator("#sql-export")).to_be_disabled()
                    sql.press("Control+Enter")
                    expect(sql).to_have_attribute("aria-invalid", "true")
                    self.no_overflow()
                    tabs.nth(3).click()
                    expect(self.page.locator("#slo-calculate")).to_be_visible()
                    self.no_overflow()
                    tabs.nth(4).click()
                    expect(self.page.locator("#schema-compare")).to_be_visible()
                    self.page.locator("#schema-compare").click()
                    expect(self.page.locator("#schema-download")).to_be_enabled()
                    editor = self.page.locator("#interactive-schema-diff textarea").first
                    editor.fill("{")
                    expect(self.page.locator("#schema-download")).to_be_disabled()
                    self.no_overflow()
                    tabs.nth(5).click()
                    expect(self.page.locator('[data-table-metric="filesPerDay"]')).to_have_text("4,608" if not locale else "4608")
                    self.page.locator("#table-commits").fill("1.5")
                    self.page.locator("#table-plan").click()
                    expect(self.page.locator("#table-commits")).to_have_attribute("aria-invalid", "true")
                    self.no_overflow()

    def test_scenario_links_restore_inputs_and_cli_hands_off(self):
        # The fragment carries the scenario; nothing but the page request is sent.
        self.goto("/projects/tools/#interactive-sql-sandbox?table=benchmarks&q=SELECT%20engine%2C%20COUNT(*)%20AS%20runs%20FROM%20benchmarks%20GROUP%20BY%20engine%3B")
        expect(self.page.locator("#sql-textarea")).to_have_value("SELECT engine, COUNT(*) AS runs FROM benchmarks GROUP BY engine;")
        expect(self.page.locator("#sql-results tbody tr")).to_have_count(2)
        self.goto("/es/projects/tools/#interactive-table-planner?daily=2048&commits=1&partitioning=day&buckets=1&target=512&retention=30")
        expect(self.page.locator('[data-table-metric="filesPerCommit"]')).to_have_text("4096")
        self.context.grant_permissions(["clipboard-read", "clipboard-write"], origin=self.base)
        self.page.locator("#interactive-table-planner .tool-share button").click()
        expect(self.page.locator("#interactive-table-planner .tool-share-status")).to_have_text("Enlace copiado. Abre esta herramienta con los mismos datos.")
        copied = self.page.evaluate("navigator.clipboard.readText()")
        self.assertTrue(copied.endswith("/es/projects/tools/#interactive-table-planner?daily=2048&commits=1&partitioning=day&buckets=1&target=512&retention=30"), copied)
        # Unknown keys are ignored and invalid values surface as form errors.
        self.goto("/projects/tools/#interactive-slo-budget?mode=time&target=abc&evil=1")
        expect(self.page.locator("#slo-target")).to_have_attribute("aria-invalid", "true")
        self.goto("/")
        self.page.locator("#dock-btn-term").click()
        field = self.page.locator("dialog[open] input:visible").first
        field.fill("nines 99.95")
        field.press("Enter")
        link = self.page.locator(".term-line a").last
        expect(link).to_have_attribute("href", re.compile(r"/projects/tools/#interactive-slo-budget\?mode=time&target=99\.95&window=30&observed=43200&bad=0$"))
        link.click()
        expect(self.page.locator("#slo-target")).to_have_value("99.95")
        expect(self.page.locator('[data-slo-metric="total"]')).to_contain_text("21.6")

    def test_primary_text_contrast_including_sheen(self):
        self.page.set_viewport_size({"width": 1440, "height": 1000})
        for scheme in ("default", "slate"):
            self.goto("/", scheme)
            button = self.page.locator(".md-button--primary").first
            for state in ("rest", "hover", "focus"):
                with self.subTest(scheme=scheme, state=state):
                    if state == "hover":
                        button.hover()
                    elif state == "focus":
                        self.page.mouse.move(0, 0)
                        button.focus()
                    colors = button.evaluate("""el => {
                      const s = getComputedStyle(el);
                      const rgb = value => (value.match(/[\\d.]+/g) || []).map(Number);
                      const stops = [...s.backgroundImage.matchAll(/rgba?\\(([^)]+)\\)/g)].map(m => rgb(m[1]));
                      return {text: rgb(s.color), fill: rgb(s.backgroundColor), stops};
                    }""")
                    for stop in colors["stops"] or [[0, 0, 0, 0]]:
                        alpha = stop[3] if len(stop) > 3 else 1
                        background = [c * alpha + b * (1 - alpha) for c, b in zip(stop[:3], colors["fill"])]
                        ratio = contrast(background, colors["text"])
                        self.assertGreaterEqual(ratio, 4.8, (scheme, state, ratio, colors))

    def test_secondary_border_non_text_contrast(self):
        # The translucent border paints over the pill's own fill (border-box
        # clip); WCAG 1.4.11 asks 3:1 against the fill and against the page.
        self.page.set_viewport_size({"width": 1440, "height": 1000})
        for scheme in ("default", "slate"):
            with self.subTest(scheme=scheme):
                self.goto("/", scheme)
                self.page.mouse.move(0, 0)
                colors = self.page.locator(".md-typeset .md-button:not(.md-button--primary)").first.evaluate("""el => {
                  const s = getComputedStyle(el);
                  const rgb = value => (value.match(/[\\d.]+/g) || []).map(Number);
                  return {border: rgb(s.borderTopColor), fill: rgb(s.backgroundColor),
                          page: rgb(getComputedStyle(document.body).backgroundColor), clip: s.backgroundClip};
                }""")
                self.assertEqual(colors["clip"], "border-box", colors)
                alpha = colors["border"][3] if len(colors["border"]) > 3 else 1
                edge = [c * alpha + f * (1 - alpha) for c, f in zip(colors["border"][:3], colors["fill"])]
                for neighbor in ("fill", "page"):
                    ratio = contrast(edge, colors[neighbor][:3])
                    self.assertGreaterEqual(ratio, 3, (scheme, neighbor, ratio, colors))

    def test_focus_ring_keeps_shape_and_brand_color(self):
        self.page.set_viewport_size({"width": 1440, "height": 900})
        self.goto("/projects/tools/")
        self.page.locator(".md-content .tabbed-labels").first.locator("label").nth(0).click()
        expect(self.page.locator("#failure-step")).to_be_visible()
        brand = self.page.evaluate("getComputedStyle(document.body).getPropertyValue('--brand').trim()")
        # Keyboard modality first, so programmatic focus matches :focus-visible.
        self.page.keyboard.press("Tab")
        for selector in (".dock-pill-btn", "details.lab-widget-details > summary:visible", ".md-tabs__link"):
            with self.subTest(selector=selector):
                control = self.page.locator(selector).first
                rest = control.evaluate("el => getComputedStyle(el).borderRadius")
                control.focus()
                ring = control.evaluate("""el => {
                  const s = getComputedStyle(el);
                  return {radius: s.borderRadius, color: s.outlineColor, offset: s.outlineOffset};
                }""")
                self.assertEqual(ring["offset"], "3px", ring)
                self.assertEqual(ring["color"].replace(",", ""), brand.replace(",", ""), ring)
                if selector == ".dock-pill-btn":
                    self.assertEqual(ring["radius"], rest, ring)

    def test_motion_pause_survives_navigation_without_storage(self):
        with self.browser.new_context(viewport={"width": 1440, "height": 900}) as context:
            context.route("**/*", self.route)
            # A blocked or full storage: every access throws.
            context.add_init_script("""for (const name of ["getItem", "setItem"])
              Storage.prototype[name] = () => { throw new DOMException("blocked", "SecurityError"); };""")
            page = context.new_page()
            page.on("pageerror", lambda error: self.errors.append(str(error)))
            page.goto(self.base + "/", wait_until="networkidle")
            page.locator(".motion-option--header .motion-toggle").click()
            expect(page.locator("html")).to_have_attribute("data-motion", "paused")
            page.locator(".md-tabs__link[href$='projects/']").first.click()
            expect(page).to_have_url(self.base + "/projects/")
            expect(page.locator("html")).to_have_attribute("data-motion", "paused")
            expect(page.locator(".motion-option--header .motion-toggle")).to_have_attribute("aria-pressed", "true")

    def test_failure_lab_keeps_keyboard_focus_when_a_button_disables(self):
        self.page.set_viewport_size({"width": 1440, "height": 900})
        self.goto("/projects/tools/")
        self.page.locator(".md-content .tabbed-labels").first.locator("label").nth(0).click()
        self.page.locator("#failure-condition").select_option("workers")
        restore = self.page.locator("#failure-restore")
        expect(restore).to_be_enabled()
        restore.focus()
        self.page.keyboard.press("Enter")
        expect(restore).to_be_disabled()
        expect(self.page.locator("#failure-condition")).to_be_focused()

    def test_skip_link_reaches_content_without_errors(self):
        # Zensical 0.0.68's href-less skip target threw in the theme's instant
        # prefetch (features/header.js); tearDown asserts no page errors.
        for locale in ("", "/es"):
            with self.subTest(locale=locale):
                self.goto(f"{locale}/")
                self.page.keyboard.press("Tab")
                expect(self.page.locator(".md-skip")).to_be_focused()
                self.page.keyboard.press("Enter")
                expect(self.page.locator("#__skip")).to_be_focused()
                self.page.keyboard.press("Tab")
                self.assertTrue(self.page.evaluate("document.activeElement.closest('.md-content') !== null"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
