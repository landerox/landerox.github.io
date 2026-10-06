"""Per-page Open Graph cards, drawn at build time with the site's own fonts.

Each indexable page gets a 1200×630 PNG with its section, title and
description over the dark palette, the edge beam and a faint network motif.
The home pages keep the hand-made `social-card.png`. Rendering is
deterministic, so an unchanged page produces a byte-identical card.
"""
import colorsys
import functools
import html
import pathlib
import random
import re

from PIL import Image, ImageDraw, ImageFilter, ImageFont

WIDTH, HEIGHT = 1200, 630
PAD = 80
FONTS = pathlib.Path("content/en/assets/fonts")
STYLESHEET = pathlib.Path("content/en/assets/stylesheets/extra.css")
CARD_DIR = pathlib.Path("assets/images/social")
SITE_CARD = "https://landerox.com/assets/images/social-card.png"
SITE_ORIGIN = "https://landerox.com/"
HOME_PAGES = {"index.html", "es/index.html"}
# Pages outside the navigation (the glossary) report the Home tab as active.
HOME_TABS = {"Home", "Inicio"}


def hsl(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return round(r * 255), round(g * 255), round(b * 255)


# Dark-scheme tokens from extra.css (§4 Semantic tokens — dark scheme).
PAGE = hsl(222, 47, 6.5)
RAISED = hsl(222, 35, 10.5)
INK_1 = hsl(210, 40, 98)
INK_2 = hsl(215, 20, 86)
INK_3 = hsl(215, 16, 65)
BRAND = (96, 165, 250)

OG_TITLE = re.compile(r'<meta property="og:title" content="([^"]*)">')
OG_DESCRIPTION = re.compile(r'<meta property="og:description" content="([^"]*)">')
ACTIVE_TAB = re.compile(r'md-tabs__item--active">\s*<a[^>]*>\s*([^<]+?)\s*</a>')
NOINDEX = re.compile(r'<meta name="robots" content="[^"]*noindex')
TITLE_SUFFIX = " - landerox.com"


def latin_ranges():
    """The unicode-range of the Inter latin face: the glyphs the cards can draw."""
    css = STYLESHEET.read_text(encoding="utf-8")
    face = re.search(r'Inter-Variable-latin\.woff2.*?unicode-range:([^;]+);', css, re.S)
    ranges = []
    for item in face.group(1).replace("\n", " ").split(","):
        bounds = item.strip().removeprefix("U+").split("-")
        low = int(bounds[0], 16)
        ranges.append((low, int(bounds[-1], 16)))
    return ranges


def font(name, size, weight=None):
    face = ImageFont.truetype(str(FONTS / name), size)
    if weight is not None:
        face.set_variation_by_axes([weight])
    return face


def wrap(draw, text, face, width):
    """Greedy word wrap measured with the real glyph advances."""
    lines, line = [], ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if line and draw.textlength(candidate, font=face) > width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def balance(draw, text, face, width):
    """Same line count as a greedy wrap, at the narrowest width that keeps it
    (CSS `text-wrap: balance`), so no line ends as a lone word."""
    lines = wrap(draw, text, face, width)
    low, high = width // 2, width
    while high - low > 4:
        middle = (low + high) // 2
        if len(wrap(draw, text, face, middle)) <= len(lines):
            high = middle
        else:
            low = middle
    return wrap(draw, text, face, high)


def clamp(draw, lines, face, width, count):
    """Keep `count` lines, ending the last one with an ellipsis if cut."""
    if len(lines) <= count:
        return lines
    kept = lines[:count]
    last = kept[-1]
    while last and draw.textlength(last + "…", font=face) > width:
        last = last.rsplit(" ", 1)[0] if " " in last else last[:-1]
    kept[-1] = last.rstrip(" ,.;:—") + "…"
    return kept


@functools.cache
def base():
    """The part every card shares: page color, top-right lift and edge beam."""
    card = Image.new("RGB", (WIDTH, HEIGHT), PAGE)
    # Top-right lift, as on the site's raised surfaces.
    glow = Image.new("L", (WIDTH, HEIGHT), 0)
    ImageDraw.Draw(glow).ellipse((700, -360, 1500, 440), fill=150)
    card.paste(Image.new("RGB", card.size, RAISED), mask=glow.filter(ImageFilter.GaussianBlur(160)))
    # Edge beam: transparent → brand → transparent along the top edge.
    beam = Image.new("RGBA", (WIDTH, 3), (*BRAND, 0))
    for x in range(WIDTH):
        strength = max(0.0, 1 - abs(x - WIDTH / 2) / (WIDTH / 2))
        for y in range(3):
            beam.putpixel((x, y), (*BRAND, round(235 * strength)))
    card.paste(beam, (0, 0), beam)
    return card


def background(seed):
    card = base().copy()
    # Faint network: the ambient canvas, seeded by the page path.
    layer = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ink = ImageDraw.Draw(layer)
    rng = random.Random(seed)
    nodes = [(rng.uniform(640, 1160), rng.uniform(70, 560)) for _ in range(24)]
    for i, (ax, ay) in enumerate(nodes):
        for bx, by in nodes[i + 1:]:
            distance = ((ax - bx) ** 2 + (ay - by) ** 2) ** 0.5
            if distance < 170:
                alpha = round(46 * (1 - distance / 170))
                ink.line((ax, ay, bx, by), fill=(*BRAND, alpha), width=1)
    for x, y in nodes:
        ink.ellipse((x - 2.5, y - 2.5, x + 2.5, y + 2.5), fill=(*BRAND, 70))
    card.paste(layer, mask=layer)
    return card


def render(title, description, section, seed):
    card = background(seed)
    draw = ImageDraw.Draw(card)
    width = WIDTH - 2 * PAD

    mono = font("MesloLGMNerdFontPropo-Regular.woff2", 26)
    label = font("Inter-Variable-latin.woff2", 22, 600)
    draw.text((PAD, 86), "</>", font=mono, fill=BRAND)
    x = PAD + draw.textlength("</>", font=mono) + 22
    for char in section.upper():
        draw.text((x, 90), char, font=label, fill=INK_3)
        x += draw.textlength(char, font=label) + 2.2

    # Largest title size on two lines; long titles take a third line at a
    # smaller size, so the description always keeps two lines.
    for size, most in [*((s, 2) for s in range(72, 54, -2)), *((s, 3) for s in range(56, 44, -2))]:
        heading = font("Outfit-Variable-latin.woff2", size, 700)
        lines = wrap(draw, title, heading, width)
        if len(lines) <= most:
            break
    lines = clamp(draw, balance(draw, title, heading, width), heading, width, 3)
    y = 158
    for line in lines:
        draw.text((PAD, y), line, font=heading, fill=INK_1)
        y += round(size * 1.14)

    body = font("Inter-Variable-latin.woff2", 29, 400)
    room = max(1, min(3, (500 - (y + 22)) // 41))
    for line in clamp(draw, wrap(draw, description, body, width), body, width, room):
        draw.text((PAD, y + 22), line, font=body, fill=INK_2)
        y += 41

    draw.text((PAD, 548), "landerox.com", font=mono, fill=BRAND)
    name = font("Inter-Variable-latin.woff2", 24, 600)
    draw.text((WIDTH - PAD, 552), "Fernando Landero", font=name, fill=INK_3, anchor="ra")
    return card


def publish_social_cards(site_dir):
    """Render a card per indexable page and point its og/twitter image at it."""
    ranges = latin_ranges()
    count = 0
    for page in sorted(site_dir.rglob("index.html")):
        relative = page.relative_to(site_dir).as_posix()
        content = page.read_text(encoding="utf-8")
        title_match = OG_TITLE.search(content)
        if relative in HOME_PAGES or not title_match or NOINDEX.search(content):
            continue
        title = html.unescape(title_match.group(1)).removesuffix(TITLE_SUFFIX)
        description = html.unescape(OG_DESCRIPTION.search(content).group(1))
        tab = ACTIVE_TAB.search(content)
        section = html.unescape(tab.group(1)) if tab else ""
        if section in HOME_TABS:
            section = ""
        missing = sorted({c for c in title + description + section
                          if not any(low <= ord(c) <= high for low, high in ranges)})
        if missing:
            raise SystemExit(f"Social card for {relative}: no glyph for {missing}; extend the font subset.")
        slug = relative.removesuffix("index.html").rstrip("/") or "index"
        target = site_dir / CARD_DIR / f"{slug}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        render(title, description, section, slug).save(target, optimize=True)
        url = f"{SITE_ORIGIN}{CARD_DIR.as_posix()}/{slug}.png"
        page.write_text(content.replace(SITE_CARD, url), encoding="utf-8")
        count += 1
    return count
