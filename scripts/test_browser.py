"""Browser regressions against an isolated bilingual build, using locked Playwright."""
import json
import mimetypes
import re
import shutil
import tempfile
import threading
import unittest
import xml.etree.ElementTree as ET
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from axe_playwright_python.sync_playwright import Axe
from playwright.sync_api import expect, sync_playwright

# WCAG 2.2 A/AA plus axe's best practices, on states Lighthouse never opens.
AXE_OPTIONS = {"runOnly": {"type": "tag", "values": [
    "wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]}}
# Two best-practice findings belong to the theme's own markup: the progress
# bar sits outside the landmarks and two navigation landmarks share a name.
AXE_THEME_RULES = {"region", "landmark-unique"}

# The catalog is the source of truth for every term count below.
CATALOG = Path(__file__).resolve().parents[1] / "content/en/assets/glossary.json"
TERMS = len(json.loads(CATALOG.read_text(encoding="utf-8"))["terms"])


def luminance(rgb):
    channels = [c / 255 for c in rgb]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return sum(c * weight for c, weight in zip(linear, (0.2126, 0.7152, 0.0722), strict=True))


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
        cls.addClassCleanup(cls.scratch.cleanup)
        cls.root = (Path(cls.scratch.name) / "site").resolve()
        shutil.copytree("site", cls.root)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=cls.root))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.addClassCleanup(cls.thread.join)
        cls.addClassCleanup(cls.server.server_close)
        cls.addClassCleanup(cls.server.shutdown)
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        cls.browser = cls.playwright.chromium.launch()
        cls.addClassCleanup(cls.browser.close)

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

    def open_tool(self, host):
        """Select the tab that holds a worksheet."""
        labels = self.page.evaluate("""id => {
          const labels = [];
          for (let node = document.getElementById(id); node; node = node.parentElement) {
            if (!node.matches('.tabbed-block')) continue;
            const content = node.parentElement;
            const index = [...content.children].indexOf(node);
            labels.unshift(content.parentElement
              .querySelectorAll(':scope > .tabbed-labels > label')[index].getAttribute('for'));
          }
          return labels;
        }""", host)
        self.assertEqual(len(labels), 1, labels)
        for label in labels:
            self.page.locator(f'label[for="{label}"]').click()
        expect(self.page.locator(f"#{host}")).to_be_visible()
        # Tools mount as they near the viewport; on a small phone the first
        # one can start more than a screen below the introduction.
        self.page.locator(f"#{host}").scroll_into_view_if_needed()

    def assert_no_axe_violations(self, state):
        violations = Axe().run(self.page, options=AXE_OPTIONS).response["violations"]
        found = [(rule["id"], node["target"], rule["help"]) for rule in violations for node in rule["nodes"]
                 if not (rule["id"] in AXE_THEME_RULES and str(node["target"][0]).startswith(".md-"))]
        self.assertEqual(found, [], state)

    def assert_tools_in_header(self):
        expect(self.page.locator(".landerox-dock-host")).to_have_count(0)
        expect(self.page.locator(".md-header .site-tools")).to_have_count(1)
        expect(self.page.locator(".md-header button.site-tool")).to_have_count(1)

    def test_technical_desk_control_sits_in_the_header_at_every_width(self):
        for locale, label in (("", "Glossary and CLI"), ("/es", "Glosario y CLI")):
            for width in (320, 360, 390, 768, 1440):
                with self.subTest(locale=locale, width=width):
                    self.page.set_viewport_size({"width": width, "height": 844})
                    self.goto(locale + "/blog/olap-databases/")
                    self.assert_tools_in_header()
                    desk = self.page.locator("#site-tool-desk")
                    expect(desk).to_be_visible()
                    # One icon at every width (owner decision): the name is
                    # the accessible name and the tooltip, never visible text.
                    expect(desk).to_have_accessible_name(label)
                    self.assertTrue(desk.get_attribute("title"))
                    name = desk.locator(".site-tool__label").bounding_box()
                    self.assertLessEqual(max(name["width"], name["height"]), 1, name)
                    self.assertLessEqual(desk.bounding_box()["width"], 48)
                    header = self.page.evaluate("""() => {
                      const name = document.querySelector('.md-header__topic .md-ellipsis');
                      const logo = document.querySelector('.md-header__button.md-logo');
                      return {clipped: name.scrollWidth > name.clientWidth + 1,
                        hidden: getComputedStyle(name).visibility === 'hidden',
                        logo: getComputedStyle(logo).display !== 'none'};
                    }""")
                    # The wordmark is whole from 360px; under that the mark replaces it.
                    if width < 360:
                        self.assertTrue(header["hidden"] and header["logo"], header)
                    else:
                        self.assertFalse(header["clipped"] or header["hidden"], header)
                    self.no_overflow()
                    # The header is sticky, so the desk stays reachable while reading.
                    self.page.evaluate("window.scrollTo(0, innerHeight)")
                    expect(desk).to_be_in_viewport()
                    # The dialog is where the visitor picks Glossary or CLI.
                    desk.click()
                    expect(self.page.locator("#tab-btn-glossary")).to_have_attribute("aria-selected", "true")
                    self.page.locator("#tab-btn-term").click()
                    # A click on the tab lands on the command line, ready to type.
                    expect(self.page.locator("#term-input")).to_be_focused()
                    self.no_overflow()
                    self.page.keyboard.press("Escape")
                    expect(desk).to_be_focused()
                    # It reopens on the tab used last.
                    desk.click()
                    expect(self.page.locator("#tab-btn-term")).to_have_attribute("aria-selected", "true")
                    expect(self.page.locator("#term-input")).to_be_focused()
                    self.page.keyboard.press("Escape")

    def test_desk_keeps_single_key_shortcuts_inside(self):
        # The theme maps n, p and / to page actions. From a tab or a link in
        # the dialog they must not navigate the page behind it.
        self.page.set_viewport_size({"width": 1440, "height": 900})
        for locale in ("", "/es"):
            with self.subTest(locale=locale):
                self.goto(locale + "/")
                self.page.locator("#site-tool-desk").click()
                term = self.page.locator("#tab-btn-term")
                term.click()
                field = self.page.locator("#term-input")
                expect(field).to_be_focused()
                self.page.keyboard.type("n")
                expect(field).to_have_value("n")
                term.focus()
                for key in ("n", "p", "/"):
                    self.page.keyboard.press(key)
                expect(self.page).to_have_url(self.base + locale + "/")
                expect(self.page.locator("dialog[open]")).to_have_count(1)
                self.page.keyboard.press("Escape")
                expect(self.page.locator("dialog[open]")).to_have_count(0)

    def test_instant_navigation_keeps_header_tools_and_cli_keyboard_focus(self):
        self.page.set_viewport_size({"width": 1440, "height": 900})
        for locale in ("", "/es"):
            with self.subTest(locale=locale):
                self.goto(locale + "/")
                self.page.evaluate("window.__toolsRegressionDocument = document")
                for path, selector in (
                    ("/about/", '.md-tabs__link[href$="about/"]'),
                    ("/projects/", '.md-tabs__link[href$="projects/"]'),
                    ("/projects/tools/", '.md-content a[href$="tools/"]'),
                ):
                    self.page.locator(selector).first.click()
                    expect(self.page).to_have_url(self.base + locale + path)
                    self.assertTrue(self.page.evaluate("window.__toolsRegressionDocument === document"))
                    self.assert_tools_in_header()
                    # The footer re-renders on each navigation; the intro's
                    # clapperboard comes back once, revealed.
                    expect(self.page.locator(".md-social [data-intro]:not([hidden])")).to_have_count(1)
                opener = self.page.locator("#site-tool-desk")
                expect(opener).to_be_in_viewport()
                opener.focus()
                opener.press("Enter")
                expect(self.page.locator("#glossary-search")).to_be_focused()
                expect(self.page.locator("dialog[open]")).to_have_count(1)
                self.page.keyboard.press("Escape")
                expect(self.page.locator("dialog[open]")).to_have_count(0)
                expect(opener).to_be_focused()
                # The shortcut works from the article too, and closing returns
                # focus to the control that had it.
                article_control = self.page.locator('.md-content a[href$="labs/"]').last
                article_control.scroll_into_view_if_needed()
                article_control.focus()
                self.page.keyboard.press("Control+`")
                expect(self.page.locator("#term-input")).to_be_focused()
                self.page.keyboard.press("Escape")
                expect(article_control).to_be_focused()

    def test_reading_text_takes_the_full_column(self):
        # No measure (owner decision, 2026-10-18; docs/design.md, Scale): a
        # top-level paragraph and the page lead run as wide as the tables
        # and figures below them, or capped text reads as cut short.
        self.page.set_viewport_size({"width": 1440, "height": 900})
        for locale in ("", "/es"):
            for path in ("/about/", "/projects/blueprints/"):
                with self.subTest(locale=locale, path=path):
                    self.goto(locale + path)
                    widths = self.page.evaluate("""() => {
                      const inner = document.querySelector('.md-content__inner');
                      const style = getComputedStyle(inner);
                      const column = inner.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
                      const text = inner.querySelectorAll(':scope > p, :scope > h1 + blockquote > p');
                      return {column, text: [...text].map((el) => el.getBoundingClientRect().width)};
                    }""")
                    self.assertTrue(widths["text"], widths)
                    for width in widths["text"]:
                        self.assertGreaterEqual(width, widths["column"] - 1, widths)

    def assert_readable_architecture(self, page, expected_columns=1):
        figure = page.locator("figure.architecture-diagram")
        expect(figure).to_be_visible()
        expect(figure.locator(".architecture-flow > li")).to_have_count(4)
        expect(figure.locator("figcaption")).not_to_be_empty()
        metrics = figure.evaluate("""figure => {
          const rgb = value => (value.match(/[\\d.]+/g) || []).map(Number);
          // Stages sit on the figure's surface: read the first opaque ancestor.
          const surface = node => {
            for (; node; node = node.parentElement) {
              const color = getComputedStyle(node).backgroundColor;
              if (rgb(color).length === 3 || rgb(color)[3] > 0) return color;
            }
            return 'rgb(255, 255, 255)';
          };
          const box = figure.getBoundingClientRect();
          const flow = getComputedStyle(figure.querySelector('.architecture-flow'));
          return {viewport: document.documentElement.clientWidth,
            content: document.documentElement.scrollWidth, left: box.left, right: box.right,
            display: flow.display, columns: flow.gridTemplateColumns.split(/\\s+/).length,
            stages: [...figure.querySelectorAll('.architecture-flow > li')].map(stage => {
              const p = stage.querySelector('p');
              const style = getComputedStyle(p);
              const parent = stage.getBoundingClientRect();
              const text = p.getBoundingClientRect();
              return {font: parseFloat(style.fontSize), words: p.textContent.trim().split(/\\s+/).length,
                width: p.clientWidth, contentWidth: p.scrollWidth,
                height: p.clientHeight, contentHeight: p.scrollHeight,
                contained: text.left >= parent.left && text.right <= parent.right + 1 &&
                  text.top >= parent.top && text.bottom <= parent.bottom + 1,
                ink: rgb(style.color), background: rgb(surface(stage))};
            })};
        }""")
        self.assertGreaterEqual(metrics["left"], 0, metrics)
        self.assertLessEqual(metrics["right"], metrics["viewport"] + 1, metrics)
        self.assertLessEqual(metrics["content"], metrics["viewport"] + 1, metrics)
        self.assertEqual(metrics["display"], "grid", metrics)
        self.assertEqual(metrics["columns"], expected_columns, metrics)
        for stage in metrics["stages"]:
            self.assertGreaterEqual(stage["font"], 16, stage)
            self.assertGreater(stage["words"], 8, stage)
            self.assertTrue(stage["contained"], stage)
            self.assertLessEqual(stage["contentWidth"], stage["width"] + 1, stage)
            self.assertLessEqual(stage["contentHeight"], stage["height"] + 1, stage)
            self.assertGreaterEqual(contrast(stage["ink"][:3], stage["background"][:3]), 4.5, stage)

    def test_architecture_text_reflows_in_both_languages_and_palettes(self):
        # The figures are CSS-only, so one load per page and scheme serves
        # every width.
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                for path, en_text, es_text in (
                    ("/projects/blueprints/", "Cloud foundation", "Base cloud"),
                    ("/projects/labs/", "Simple baseline", "Referencia simple"),
                    ("/blog/", "Storage and open tables", "Almacenamiento y tablas abiertas"),
                    ("/blog/object-storage/", "S3 API and access", "API S3 y acceso"),
                    ("/blog/lakehouse-table-formats/", "File storage", "Archivos de datos"),
                    ("/blog/workflow-orchestrators/", "Definitions and triggers", "Definiciones y disparos"),
                    ("/blog/data-transformation/", "Sources and staging", "Fuentes y staging"),
                    ("/blog/olap-databases/", "Ingestion and batching", "Ingesta y lotes"),
                    ("/blog/vector-databases/", "Chunking and embeddings", "Fragmentación y embeddings"),
                    ("/blog/graph-databases/", "Nodes and typed edges", "Nodos y aristas tipadas"),
                    ("/blog/business-intelligence/", "Datasets and metrics", "Datasets y métricas"),
                    ("/blog/observability/", "Instrumentation and collectors", "Instrumentación y colectores"),
                ):
                    self.page.set_viewport_size({"width": 1440, "height": 844})
                    self.goto(locale + path, scheme)
                    expect(self.page.locator(".architecture-stage__title").first).to_have_text(
                        es_text if locale else en_text)
                    for width in (1440, 390, 320):
                        with self.subTest(locale=locale, scheme=scheme, width=width, path=path):
                            self.page.set_viewport_size({"width": width, "height": 844})
                            # Four stations on one rail from 60em, one column below.
                            self.assert_readable_architecture(self.page, expected_columns=4 if width == 1440 else 1)

    def test_architecture_is_readable_without_javascript(self):
        with self.browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 720}) as context:
            context.route("**/*", self.route)
            page = context.new_page()
            page.goto(self.base + "/es/projects/blueprints/", wait_until="networkidle")
            self.assert_readable_architecture(page)
            expect(page.locator(".architecture-stage__title").first).to_have_text("Base cloud")
            # Without JavaScript the header control is a plain link to the glossary.
            tools = page.locator(".md-header .site-tools a[data-site-tool]")
            expect(tools).to_have_count(1)
            expect(tools).to_have_attribute("href", re.compile(r"glossary/$"))
            expect(tools).to_have_accessible_name("Glosario y CLI")

    def test_intro_command_plays_above_the_cli_and_returns_focus(self):
        # The CLI's `intro` command, named in its hint line: the dialog and
        # its video sources exist only once it runs. Escape stops and rewinds
        # it, leaves the console open and returns focus to its input. Under
        # reduced motion, which this context sets, it waits on its poster.
        # The footer's clapperboard opens it too and gets focus back; it
        # ships hidden and the script reveals it.
        for locale in ("", "/es"):
            with self.subTest(locale=locale):
                self.page.set_viewport_size({"width": 1440, "height": 900})
                self.goto(locale + "/")
                video = self.page.locator(".intro-window video")
                expect(video).to_have_count(0)
                self.page.keyboard.press("Control+`")
                field = self.page.locator("#term-input")
                expect(field).to_be_focused()
                expect(self.page.locator("#term-hint")).to_contain_text("help | intro |")
                field.fill("intro")
                field.press("Enter")
                expect(self.page.locator(".intro-window[open]")).to_have_count(1)
                # One cut per locale: AV1 first, H.264 as the fallback.
                lang = "es" if locale else "en"
                expect(video.locator("source")).to_have_count(2)
                expect(video.locator('source[type="video/mp4"]')).to_have_attribute("src", f"/assets/media/intro-{lang}.mp4")
                self.assertTrue(video.evaluate("v => v.paused"))
                self.assert_no_axe_violations(f"intro {locale or '/en'}")
                self.page.keyboard.press("Escape")
                expect(self.page.locator(".intro-window[open]")).to_have_count(0)
                expect(self.page.locator(".console-window[open]")).to_have_count(1)
                expect(field).to_be_focused()
                self.assertTrue(video.evaluate("v => v.paused && v.currentTime === 0"))
                self.page.keyboard.press("Escape")
                expect(self.page.locator(".console-window[open]")).to_have_count(0)
                button = self.page.locator(".md-footer-meta .md-social [data-intro]")
                name = "Ver la intro (21 s, con sonido)" if locale else "Watch the intro (21 s, with sound)"
                expect(button).to_have_accessible_name(name)
                button.scroll_into_view_if_needed()
                button.click()
                expect(self.page.locator(".intro-window[open]")).to_have_count(1)
                self.page.keyboard.press("Escape")
                expect(self.page.locator(".intro-window[open]")).to_have_count(0)
                expect(button).to_be_focused()

    def test_cli_keyboard_help_focus_and_module_loading(self):
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                with self.subTest(locale=locale, scheme=scheme):
                    self.page.set_viewport_size({"width": 390, "height": 844})
                    self.goto(locale + "/", scheme)
                    self.page.locator("h1").click()
                    self.page.keyboard.press("~")
                    expect(self.page.locator("dialog[open]")).to_have_count(0)
                    # The shortcut opens the CLI directly, and focus returns
                    # to the control that had it.
                    opener = self.page.locator("#site-tool-desk")
                    opener.focus()
                    self.page.keyboard.press("Control+`")
                    field = self.page.locator("#term-input")
                    expect(field).to_be_focused()
                    field.fill("hel")
                    field.press("Tab")
                    expect(field).to_have_value("help")
                    field.press("Enter")
                    expect(self.page.locator(".term-help-summary > div")).to_have_count(20)
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
                    # Shell habits get an explanation instead of a bare error.
                    field.fill("ls")
                    field.press("Enter")
                    expect(self.page.locator(".term-line--error").last).to_contain_text(
                        "no es una shell" if locale else "not a shell")
                    self.no_overflow()
                    self.page.set_viewport_size({"width": 844, "height": 390})
                    self.no_overflow()
                    self.page.keyboard.press("Escape")
                    expect(opener).to_be_focused()
                    resources = self.page.evaluate("performance.getEntriesByType('resource').map(x => x.name)")
                    self.assertFalse(any(name in resource for resource in resources for name in ("/failure.js", "/failure-core.js", "/decision-tools.js", "/ai-tools.js")))

    def test_glossary_modal_and_public_page(self):
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                with self.subTest(locale=locale, scheme=scheme):
                    self.page.set_viewport_size({"width": 320, "height": 720})
                    self.goto(locale + "/", scheme)
                    self.page.locator("#site-tool-desk").click()
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
                    # A link to another hidden term changes the fragment without
                    # `hashchange` under instant navigation; it still clears the filter.
                    search.fill("dlq")
                    expect(self.page.locator(".glossary-entry:visible")).to_have_count(1)
                    self.page.locator('.glossary-entry:visible .glossary-related a[href$="#idempotency"]').click()
                    expect(search).to_have_value("")
                    expect(self.page.locator("#idempotency")).to_be_focused()
                    expect(self.page.locator("#idempotency")).to_be_in_viewport()
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
            drawer = self.page.locator('[for="__drawer"] > .header-label-button')
            drawer.focus()
            drawer.press("Enter")
            expect(self.page.locator("#__drawer")).to_be_checked()
            expect(drawer).to_have_attribute("aria-expanded", "true")
            self.page.keyboard.press("Escape")
            expect(self.page.locator("#__drawer")).not_to_be_checked()
            expect(drawer).to_be_focused()
            search = self.page.locator('[for="__search"] > .header-label-button')
            field = self.page.locator('input[role="combobox"]')

            def assert_search_closed(search=search, field=field):
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
            expect(field).to_have_attribute("aria-label", "Buscar" if locale else "Search")
            expect(field).to_have_attribute("placeholder", "Buscar" if locale else "Search")
            dialog_name = field.evaluate('el => el.closest("[role=dialog], dialog").getAttribute("aria-label")')
            self.assertEqual(dialog_name, "Buscar" if locale else "Search")
            field.fill("lakehouse")
            expect(field).to_have_attribute("aria-controls", re.compile(r".+"))
            self.page.wait_for_function("""field => {
              const target = field.getRootNode().getElementById(field.getAttribute('aria-controls'));
              return target?.getAttribute('role') === 'listbox';
            }""", arg=field.element_handle())
            expect(self.page.get_by_role("listbox")).to_have_attribute(
                "aria-label", "Resultados de búsqueda" if locale else "Search results")
            if locale:
                expect(self.page.get_by_role("status").filter(has_text=re.compile(r"^\d+ resultados?$"))).to_be_visible()
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
        self.page.locator("#site-tool-desk").click()
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
                    # Each locale links its own agent summary and the page's Markdown twin.
                    discovery = self.page.locator('head link[rel="describedby"]')
                    expect(discovery).to_have_count(1)
                    self.assertEqual(discovery.evaluate("el => el.href"), self.base + locale + "/llms.txt")
                    twin = self.page.locator('head link[rel="alternate"][type="text/markdown"]')
                    expect(twin).to_have_count(1)
                    self.assertEqual(twin.evaluate("el => el.href"), self.base + locale + path + "index.md")
                    markdown = self.context.request.get(twin.evaluate("el => el.href"))
                    self.assertTrue(markdown.ok, path)
                    self.assertRegex(markdown.text(), r"(?m)^# \S")
                    self.assertNotIn("&amp;", markdown.text())
                    self.assertNotRegex(markdown.text(), r"★{5}\d")
                    expect(self.page.locator('[data-md-component="progress"]')).to_have_attribute("role", "progressbar")
                    expect(self.page.locator('[data-md-component="progress"]')).to_have_attribute(
                        "aria-label", "Progreso de carga de la página" if locale else "Page loading progress")
        for locale, section, page in (("", "## Projects", "https://landerox.com/projects/tools/index.md"),
                                      ("/es", "## Proyectos", "https://landerox.com/es/projects/tools/index.md")):
            summary = self.context.request.get(self.base + locale + "/llms.txt")
            self.assertTrue(summary.ok)
            text = summary.text()
            self.assertIn("https://landerox.com/es/", text)
            self.assertIn(section, text)
            self.assertIn(page, text)
            self.assertNotIn("&amp;", text)
            # Every listed twin exists in the build.
            for url in re.findall(r"\(<?(https://landerox\.com/[^)>]+\.md)>?\)", text):
                self.assertTrue((self.root / url.removeprefix("https://landerox.com/")).is_file(), url)
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
                # The article names its own social card, the one og:image carries.
                self.assertRegex(meta["image"], r"^https://landerox\.com/assets/images/social/.+\.png$")
                self.assertIn(f'<meta property="og:image" content="{meta["image"]}">', article)
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
        self.page.set_viewport_size({"width": 1440, "height": 900})
        self.page.locator("#site-tool-desk").click()
        self.page.locator("#tab-btn-term").click()
        expect(self.page.locator("#term-input")).to_be_visible()
        self.page.locator("#term-input").fill("help")
        self.page.locator("#term-input").press("Enter")
        expect(self.page.locator(".term-help-summary")).to_contain_text("Ver comandos")
        self.assertEqual(failed_responses, [])

    def test_home_tool_cards_hold_a_title_text_and_link_without_drawings(self):
        measure = """() => [...document.querySelectorAll('.labs-grid > ul > li')].map(card => {
          const link = card.querySelector(':scope > p:last-child > a');
          const top = element => Math.round(element.getBoundingClientRect().top);
          const frame = card.getBoundingClientRect();
          const hit = document.elementFromPoint(frame.left + frame.width / 2, frame.top + frame.height / 2);
          return {parts: card.querySelectorAll(':scope > p').length, hash: link.hash.slice(1),
            title: top(card.querySelector(':scope > p:first-child')), link: top(link),
            drawn: [...card.querySelectorAll('svg, img, [role=img]')].filter(node => !node.closest('.twemoji')).length,
            linked: Boolean(hit) && hit.closest('a') === link};
        })"""
        beside = """() => [...document.querySelectorAll('.grid.cards > ul > li > p:first-child')]
          .map(title => getComputedStyle(title, '::after').content)"""
        hosts = ["failure-lab", "interactive-table-planner", "interactive-agent-run", "interactive-eval-stats"]
        for locale in ("", "/es"):
            with self.subTest(locale=locale):
                self.page.set_viewport_size({"width": 1440, "height": 1600})
                self.goto(locale + "/")
                self.page.locator(".labs-grid").scroll_into_view_if_needed()
                cards = self.page.evaluate(measure)
                # Like the expertise cards: icon and title, text and one link to
                # the tool that covers the card. No drawings (owner decision,
                # 2026-10-15).
                self.assertEqual([card["hash"] for card in cards], hosts, cards)
                for card in cards:
                    self.assertEqual((card["parts"], card["drawn"]), (3, 0), card)
                    self.assertTrue(card["linked"], card)
                # The two cards of a row share their title and link lines.
                for left, right in (cards[:2], cards[2:]):
                    self.assertEqual((left["title"], left["link"]), (right["title"], right["link"]))
                # Nothing is drawn beside a card title either.
                self.assertEqual(set(self.page.evaluate(beside)), {"none"})
                self.no_overflow()
                for scheme in ("default", "slate"):
                    self.goto(locale + "/", scheme)
                    self.assert_no_axe_violations(f"home {locale or '/en'} {scheme}")
                for width in (390, 320):
                    self.page.set_viewport_size({"width": width, "height": 844})
                    self.goto(locale + "/")
                    for index in range(4):
                        self.page.locator(".labs-grid > ul > li").nth(index).scroll_into_view_if_needed()
                        self.assertTrue(self.page.evaluate(measure)[index]["linked"], (width, index))
                    self.no_overflow()

    def test_link_cards_hold_one_link_and_reading_cards_only_light_up(self):
        # Link cards carry one link that covers the card. Reading cards answer
        # the pointer with color only: brighter edges and top beam, no lift.
        # An architecture stage has no frame: its station on the rail lights.
        style = """el => { const s = getComputedStyle(el);
          return [s.borderTopColor, s.borderLeftColor, s.transform, s.cursor]; }"""
        station = """el => { const s = getComputedStyle(el.querySelector('.architecture-stage__number'));
          const own = getComputedStyle(el);
          return [s.backgroundColor, s.color, own.transform, own.cursor]; }"""
        reading = (("/blog/", ".architecture-flow > .architecture-stage", station),
                   ("/glossary/", ".glossary-entry", style),
                   ("/collaboration/", ".service-list > ul > li", style))
        self.page.set_viewport_size({"width": 1280, "height": 900})
        for locale in ("", "/es"):
            for path in ("/", "/projects/", "/blog/"):
                with self.subTest(locale=locale, path=path):
                    self.goto(locale + path)
                    links = self.page.evaluate("""() => [...document.querySelectorAll('.grid.cards > ul > li')]
                      .map(card => card.querySelectorAll('a[href]').length)""")
                    self.assertTrue(links, path)
                    self.assertEqual(set(links), {1}, links)
                    if path != "/":
                        self.assert_no_axe_violations(f"cards {locale or '/en'}{path}")
            for path, selector, probe in reading:
                with self.subTest(locale=locale, path=path):
                    self.goto(locale + path)
                    card = self.page.locator(selector).first
                    card.scroll_into_view_if_needed()
                    self.page.mouse.move(0, 0)
                    rest = card.evaluate(probe)
                    card.hover()
                    lit = card.evaluate(probe)
                    self.assertNotEqual(lit[:2], rest[:2])
                    self.assertEqual(lit[2:], ["none", "auto"])

    def test_tools_answer_without_drawings(self):
        hosts = ("failure-lab", "interactive-table-planner", "interactive-agent-run", "interactive-eval-stats")
        for locale in ("", "/es"):
            with self.subTest(locale=locale):
                # The tools answer in words, numbers and tables: no drawings
                # (owner decision, 2026-10-15).
                self.page.set_viewport_size({"width": 1440, "height": 900})
                self.goto(locale + "/projects/tools/")
                for host in hosts:
                    self.open_tool(host)
                    self.page.wait_for_function(
                        "id => document.getElementById(id).querySelector('.lab-widget-title')", arg=host)
                    expect(self.page.locator(f"#{host} figure, #{host} [role=img]")).to_have_count(0)
                    self.no_overflow()

    def test_copy_as_markdown_on_reading_pages_and_profile_metadata(self):
        self.context.grant_permissions(["clipboard-read", "clipboard-write"], origin=self.base)
        for locale, heading in (("", "# Open-source vector databases"),
                                ("/es", "# Bases de datos vectoriales open source")):
            with self.subTest(locale=locale):
                self.page.set_viewport_size({"width": 390, "height": 844})
                self.goto(locale + "/blog/vector-databases/")
                copy = self.page.locator(".md-content__button[data-md-copy-url]")
                expect(copy).to_have_count(1)
                expect(copy).to_have_accessible_name("Copiar como Markdown" if locale else "Copy as Markdown")
                box = copy.bounding_box()
                self.assertGreaterEqual(min(box["width"], box["height"]), 44, box)
                copy.click()
                self.page.wait_for_function("navigator.clipboard.readText().then(text => text.includes('# '))")
                copied = self.page.evaluate("navigator.clipboard.readText()")
                self.assertIn(heading, copied)
                self.assertNotIn("&amp;", copied)
                self.no_overflow()
                # Profile pages show no copy button; their Markdown twin stays
                # for agents. The profile page names the person it describes.
                self.goto(locale + "/about/")
                expect(self.page.locator(".md-content__button[data-md-copy-url]")).to_have_count(0)
                blocks = self.page.locator('script[type="application/ld+json"]').evaluate_all("els => els.map(el => JSON.parse(el.textContent))")
                profile = next(block for block in blocks if block.get("@type") == "ProfilePage")
                self.assertEqual(profile["mainEntity"]["name"], "Fernando Landero")
                self.assertEqual(profile["url"], "https://landerox.com" + locale + "/about/")
                self.goto(locale + "/")
                expect(self.page.locator(".md-content__button[data-md-copy-url]")).to_have_count(0)
        # Until the theme's script boots (`.no-js`) the button is invisible but
        # already holds its box: showing it must not re-wrap a two-line title.
        phone = {"width": 412, "height": 823}
        self.page.set_viewport_size(phone)
        self.goto("/blog/olap-databases/")
        booted = self.page.locator("h1").bounding_box()["height"]
        with self.browser.new_context(java_script_enabled=False, viewport=phone) as context:
            context.route("**/*", self.route)
            page = context.new_page()
            page.goto(self.base + "/blog/olap-databases/", wait_until="networkidle")
            button = page.locator(".md-content__button[data-md-copy-url]").evaluate(
                "el => ({visibility: getComputedStyle(el).visibility, width: el.getBoundingClientRect().width})")
            self.assertEqual((button["visibility"], button["width"]), ("hidden", 44), button)
            self.assertEqual(page.locator("h1").bounding_box()["height"], booted)

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
                        if viewport["width"] <= 600:
                            # Phones stack each row and label every value, so
                            # the columns that decide are not behind a scroll.
                            stacked = table.locator("table").evaluate("""t => ({
                              display: getComputedStyle(t).display, role: t.getAttribute('role'),
                              labels: [...t.querySelectorAll('tbody tr:first-child td:not(:first-child)')]
                                .map(cell => getComputedStyle(cell, '::before').content)})""")
                            self.assertEqual((stacked["display"], stacked["role"]), ("block", "table"), stacked)
                            self.assertGreaterEqual(len(stacked["labels"]), 3, stacked)
                            self.assertTrue(all(len(label) > 2 for label in stacked["labels"]), stacked)
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

    def test_tools_on_a_phone_follow_every_edit(self):
        for locale in ("", "/es"):
            for scheme in ("default", "slate"):
                with self.subTest(locale=locale, scheme=scheme):
                    self.page.set_viewport_size({"width": 320, "height": 720})
                    self.goto(locale + "/projects/tools/", scheme)
                    # One row of four tabs under a question index; every label fits.
                    tabs = self.page.locator(".md-content__inner > .tabbed-set > .tabbed-labels > label")
                    expect(tabs).to_have_count(4)
                    index = self.page.locator(".md-content__inner > .md-typeset__scrollwrap table, .md-content__inner > table").first
                    expect(index.locator("tbody tr")).to_have_count(4)
                    for box in tabs.evaluate_all("els => els.map(el => el.getBoundingClientRect().toJSON())"):
                        self.assertGreaterEqual(box["left"], 0, box)
                    self.open_tool("failure-lab")
                    expect(self.page.locator("#failure-step")).to_be_visible()
                    self.page.locator("#failure-step").click()
                    # Arrivals are counted apart from where they ended up.
                    expect(self.page.locator("#failure-conservation")).to_have_text(re.compile(
                        r"\b3 (?:arrived|llegaron) = 3 \D+ \+ 0 \D+ \+ 0 \D+ \+ 0 \D+$"))
                    drill = self.page.locator('[data-drill="outage-drain"]')
                    drill.click()
                    expect(drill).to_have_attribute("aria-pressed", "true")
                    # Six seconds of outage, then the queue drains to empty.
                    expect(self.page.locator("#failure-tick-value")).to_have_text("12s")
                    expect(self.page.locator("#failure-queue-value")).to_have_text("0")
                    # A scenario link opened on the same page clears the drill.
                    self.page.evaluate("location.hash = '#failure-lab?condition=workers'")
                    expect(drill).to_have_attribute("aria-pressed", "false")
                    expect(self.page.locator("#failure-condition")).to_have_value("workers")
                    # The policy comparison follows its inputs; there is no button.
                    expect(self.page.locator("#failure-compare")).to_have_count(0)
                    summary = self.page.locator("#failure-comparison-results tbody tr").first
                    expect(summary).to_be_visible()
                    self.page.locator("#failure-comparison-scenario").select_option("traffic-burst")
                    expect(self.page.locator("#failure-comparison-status")).to_contain_text(
                        "Semilla: 42" if locale else "Seed: 42")
                    self.no_overflow()
                    self.open_tool("interactive-table-planner")
                    files = self.page.locator('[data-table-metric="filesPerDay"]')
                    expect(files).to_have_text("4,608" if not locale else "4608")
                    expect(self.page.locator('[data-table-preset="small-trap"]')).to_have_attribute("aria-pressed", "true")
                    expect(self.page.locator("[data-table-takeaway]")).not_to_be_empty()
                    self.page.locator('[data-table-preset="right-sized"]').click()
                    expect(self.page.locator('[data-table-preset="right-sized"]')).to_have_attribute("aria-pressed", "true")
                    expect(files).to_have_text("1,152" if not locale else "1152")
                    expect(self.page.locator("#table-plan")).to_have_count(0)
                    commits = self.page.locator("#table-commits")
                    commits.fill("1.5")
                    expect(commits).to_have_attribute("aria-invalid", "true")
                    commits.fill("24")
                    expect(files).to_have_text("192")
                    expect(commits).not_to_have_attribute("aria-invalid", "true")
                    # An edit that leaves every preset clears the pressed one.
                    expect(self.page.locator('[data-table-preset="right-sized"]')).to_have_attribute("aria-pressed", "false")
                    self.no_overflow()

    def test_ai_tools_start_with_an_example_and_validate_inputs(self):
        for locale, width in (("", 320), ("/es", 390), ("", 1440)):
            with self.subTest(locale=locale, width=width):
                es = bool(locale)
                number = (lambda text: text.replace(".", ",")) if es else (lambda text: text)
                self.page.set_viewport_size({"width": width, "height": 844})
                self.goto(locale + "/projects/tools/", "slate" if es else "default")

                # Agent replay: the example incident already shows a verdict.
                self.open_tool("interactive-agent-run")
                expect(self.page.locator("#agent-status")).to_contain_text("2 de 4" if es else "2 of 4")
                rows = self.page.locator("#agent-results tr[data-strategy]")
                expect(rows).to_have_count(4)
                expect(rows.locator('[data-agent-metric="duplicates"]')).to_have_text(["2", "0", "1", "0"])
                expect(self.page.locator('.agent-trace[data-strategy="checkpoint"] li[data-outcome="duplicate"]')).to_have_count(1)
                # A stacked table keeps its caption on one line.
                self.assertGreater(self.page.locator("#agent-results caption").bounding_box()["width"], 150)
                self.no_overflow()
                # The result follows each edit; there is no run button.
                expect(self.page.locator("#agent-run")).to_have_count(0)
                self.page.locator("#agent-point").select_option("before")
                expect(rows.locator('[data-agent-metric="duplicates"]')).to_have_text(["1", "0", "0", "0"])
                expect(self.page.locator("#agent-status")).to_contain_text(
                    "1 de 4 estrategias aplica " if es else "1 of 4 strategies applies ")
                self.page.locator("#agent-crash").fill("9")
                expect(self.page.locator("#agent-crash")).to_have_attribute("aria-invalid", "true")
                expect(self.page.locator("#agent-status")).to_have_attribute("data-state", "error")
                if width <= 600:
                    # Phones stack each result row; no value hides behind a scroll.
                    self.page.locator("#agent-crash").fill("4")
                    stacked = self.page.locator("#agent-results table").evaluate("""t => ({
                      display: getComputedStyle(t).display, role: t.getAttribute('role'),
                      label: getComputedStyle(t.querySelector('tbody td'), '::before').content,
                      fits: t.scrollWidth <= t.parentElement.clientWidth + 1})""")
                    self.assertEqual((stacked["display"], stacked["role"], stacked["fits"]), ("block", "table", True), stacked)
                    self.assertGreater(len(stacked["label"]), 4, stacked)

                # Evaluation statistics: one question at a time.
                self.open_tool("interactive-eval-stats")
                expect(self.page.locator('[data-eval-metric="interval"]')).to_have_text(number("71.5% – 91.7%"))
                # The same rate at three sample sizes, as a table: the width halves each time.
                expect(self.page.locator("#eval-results .eval-ladder tbody tr")).to_have_count(3)
                expect(self.page.locator("#eval-results figure")).to_have_count(0)
                self.page.locator("#eval-mode").select_option("sample")
                expect(self.page.locator('[data-eval-metric="per-variant"]')).to_have_text("906")
                expect(self.page.locator("#eval-successes")).to_be_hidden()
                expect(self.page.locator("#eval-power")).to_be_visible()
                self.page.locator("#eval-mode").select_option("agreement")
                expect(self.page.locator('[data-eval-metric="kappa"]')).to_have_text(number("0.70"))
                self.page.locator("#eval-both-pass").fill("")
                expect(self.page.locator("#eval-both-pass")).to_have_attribute("aria-invalid", "true")
                self.no_overflow()
        # A scenario link restores one worksheet and shares only what it shows.
        self.goto("/projects/tools/#interactive-eval-stats?mode=sample&baseline=70&candidate=80&confidence=99&power=90&evil=1")
        expect(self.page.locator("#eval-mode")).to_have_value("sample")
        expect(self.page.locator("#eval-baseline")).to_have_value("70")
        expect(self.page.locator('[data-eval-metric="per-variant"]')).to_have_text("556")
        self.context.grant_permissions(["clipboard-read", "clipboard-write"], origin=self.base)
        self.page.locator("#interactive-eval-stats .tool-share button").click()
        expect(self.page.locator("#interactive-eval-stats .tool-share-status")).not_to_be_empty()
        copied = self.page.evaluate("navigator.clipboard.readText()")
        self.assertTrue(copied.endswith("#interactive-eval-stats?mode=sample&baseline=70&candidate=80&confidence=99&power=90"), copied)

    def test_interactive_states_pass_axe(self):
        hosts = ("failure-lab", "interactive-table-planner", "interactive-agent-run", "interactive-eval-stats")
        for locale, scheme, width in (("", "default", 390), ("/es", "slate", 1440)):
            with self.subTest(locale=locale, scheme=scheme, width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.goto(locale + "/", scheme)
                self.page.locator("#site-tool-desk").click()
                expect(self.page.locator(".glossary-card")).to_have_count(TERMS)
                self.assert_no_axe_violations("desk: glossary")
                self.page.locator("#tab-btn-term").click()
                self.page.locator("#term-input").fill("help")
                self.page.locator("#term-input").press("Enter")
                expect(self.page.locator(".term-help-summary")).to_be_visible()
                self.assert_no_axe_violations("desk: CLI")
                self.page.keyboard.press("Escape")
                self.goto(locale + "/projects/tools/", scheme)
                for host in hosts:
                    self.open_tool(host)
                    self.page.wait_for_function(
                        "id => document.getElementById(id).querySelector('.lab-widget-title')", arg=host)
                    self.assert_no_axe_violations(host)

    def test_scenario_links_restore_inputs(self):
        # The fragment carries the scenario; nothing but the page request is sent.
        self.goto("/es/projects/tools/#interactive-table-planner?daily=2048&commits=1&partitioning=day&buckets=1&target=512&retention=30")
        expect(self.page.locator('[data-table-metric="filesPerCommit"]')).to_have_text("4096")
        # The shared inputs are exactly a preset, which shows as pressed.
        expect(self.page.locator('[data-table-preset="daily-batch"]')).to_have_attribute("aria-pressed", "true")
        self.context.grant_permissions(["clipboard-read", "clipboard-write"], origin=self.base)
        self.page.locator("#interactive-table-planner .tool-share button").click()
        expect(self.page.locator("#interactive-table-planner .tool-share-status")).to_have_text("Enlace copiado. Abre esta herramienta con los mismos datos.")
        copied = self.page.evaluate("navigator.clipboard.readText()")
        self.assertTrue(copied.endswith("/es/projects/tools/#interactive-table-planner?daily=2048&commits=1&partitioning=day&buckets=1&target=512&retention=30"), copied)
        # Unknown keys are ignored and invalid values surface as form errors.
        self.goto("/projects/tools/#interactive-agent-run?steps=abc&evil=1")
        expect(self.page.locator("#agent-steps")).to_have_attribute("aria-invalid", "true")

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
                        background = [c * alpha + b * (1 - alpha) for c, b in zip(stop[:3], colors["fill"], strict=False)]
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
                edge = [c * alpha + f * (1 - alpha) for c, f in zip(colors["border"][:3], colors["fill"], strict=False)]
                for neighbor in ("fill", "page"):
                    ratio = contrast(edge, colors[neighbor][:3])
                    self.assertGreaterEqual(ratio, 3, (scheme, neighbor, ratio, colors))

    def test_focus_ring_keeps_shape_and_brand_color(self):
        self.page.set_viewport_size({"width": 1440, "height": 900})
        self.goto("/projects/tools/")
        self.open_tool("failure-lab")
        expect(self.page.locator("#failure-step")).to_be_visible()
        brand = self.page.evaluate("getComputedStyle(document.body).getPropertyValue('--brand').trim()")
        # Keyboard modality first, so programmatic focus matches :focus-visible.
        self.page.keyboard.press("Tab")
        for selector in (".site-tool", "details.lab-widget-details > summary:visible", ".md-tabs__link"):
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
                if selector == ".site-tool":
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
        self.open_tool("failure-lab")
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
