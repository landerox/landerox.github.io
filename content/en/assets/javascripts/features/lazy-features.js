/** Load the console, worksheets, comparisons and glossary only when needed. */
import { localeRoot, locale, lazyImport } from "./env.js";

const moduleURL = (name) => new window.URL(`../${name}`, import.meta.url).href;
const loadWorkbench = lazyImport(moduleURL("workbench.js"));
const loadComparisons = lazyImport(moduleURL("comparison.js"));
const loadGlossaryPage = lazyImport(moduleURL("glossary-page.js"));

let comparisonsUsed = false;
let glossaryPageUsed = false;
let workbench = null;
let widgetObserver = null;
let dockHost = null;

export function setupComparisons() {
  // Revisit after navigation too, so detached page controllers are released.
  if (!comparisonsUsed && !document.querySelector("[data-comparison]")) return;
  comparisonsUsed = true;
  loadComparisons()
    .then((module) => module.mountComparisons(locale()))
    .catch((error) => {
      // The original Markdown is the intended fallback; keep a trace.
      console.error(error);
    });
}

export function setupGlossaryPage() {
  if (!glossaryPageUsed && !document.querySelector("[data-glossary-page]"))
    return;
  glossaryPageUsed = true;
  loadGlossaryPage()
    .then((module) => module.mountGlossaryPage(localeRoot, locale()))
    .catch((error) => {
      // The full glossary stays readable without the enhancement.
      console.error(error);
    });
}

// Ctrl+` opens the CLI, except while typing or with a dialog open.
function onShortcut(open) {
  return (event) => {
    const editing = event
      .composedPath()
      .some(
        (node) =>
          node instanceof window.HTMLElement &&
          (node.matches("input, textarea, select") || node.isContentEditable),
      );
    if (editing || event.isComposing || event.repeat || event.defaultPrevented)
      return;
    if (event.altKey || event.metaKey || document.querySelector("dialog[open]"))
      return;
    if (event.ctrlKey && !event.shiftKey && event.key === "`") {
      event.preventDefault();
      open("term");
    }
  };
}

function createDock(es) {
  const dock = document.createElement("div");
  dock.id = "landerox-dock-launcher";
  dock.className = "landerox-dock-launcher";
  dock.setAttribute("role", "group");
  dock.setAttribute("aria-label", es ? "Explorar el sitio" : "Explore the site");
  const notice = document.createElement("span");
  notice.className = "dock-notice";
  notice.setAttribute("role", "status");

  const open = async (tab) => {
    dock.setAttribute("aria-busy", "true");
    notice.textContent = es ? "Cargando…" : "Loading…";
    try {
      const module = await loadWorkbench();
      workbench = module.mount({ root: localeRoot, locale: locale() });
      workbench.open(tab);
      notice.textContent = "";
    } catch (error) {
      console.error(error);
      notice.textContent = es
        ? "No se pudo abrir. Vuelve a intentarlo."
        : "Could not open. Please try again.";
    } finally {
      dock.removeAttribute("aria-busy");
    }
  };

  const buttons = [
    ["glossary", es ? "Glosario" : "Glossary", "≡", es ? "Abrir glosario técnico" : "Open technical glossary"],
    ["term", "CLI", ">_", es ? "Abrir CLI (Ctrl+`)" : "Open CLI (Ctrl+`)"],
  ];
  for (const [name, label, icon, title] of buttons) {
    const control = document.createElement("button");
    control.type = "button";
    control.id = `dock-btn-${name}`;
    control.className = `dock-pill-btn dock-pill-btn--${name}`;
    control.title = title;
    control.setAttribute("aria-label", title);
    control.setAttribute("aria-haspopup", "dialog");
    const glyph = document.createElement("span");
    glyph.className = "dock-pill-icon";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = icon;
    const text = document.createElement("span");
    text.textContent = label;
    control.append(glyph, text);
    control.addEventListener("click", () => open(name));
    dock.append(control);
  }
  dock.append(notice);
  document.addEventListener("keydown", onShortcut(open));

  const host = document.createElement("div");
  host.className = "landerox-dock-host";
  host.append(dock);
  return host;
}

export function setupWorkbench() {
  workbench?.close();
  workbench?.disposeTools();
  widgetObserver?.disconnect();

  // One dock for the whole visit; Modern may replace the footer on navigation.
  dockHost ||= createDock(locale() === "es");
  const footer = document.querySelector(".md-footer");
  if (footer && dockHost.nextElementSibling !== footer) footer.before(dockHost);
  else if (!footer && !dockHost.isConnected) document.body.append(dockHost);

  const widgets = document.querySelectorAll(".interactive-lab-embed");
  if (!widgets.length) return;
  const mountWidgets = async () => {
    try {
      const module = await loadWorkbench();
      workbench = module.mount({ root: localeRoot, locale: locale() });
    } catch (error) {
      // The authored notes stay readable; the next call retries the load.
      console.error(error);
    }
  };
  if (!("IntersectionObserver" in window)) {
    mountWidgets();
    return;
  }
  widgetObserver = new window.IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) mountWidgets();
    },
    { rootMargin: "240px" },
  );
  for (const widget of widgets) widgetObserver.observe(widget);
}
