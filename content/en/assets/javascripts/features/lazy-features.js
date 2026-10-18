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
let openTool = null;

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

/**
 * The header ships the Toolbox control as a link to the glossary
 * (partials/alternate.html), so it works without JavaScript. Here it becomes
 * the button for the dialog, where the visitor picks Glossary or CLI.
 */
function upgradeSiteTools(es) {
  const host = document.querySelector(".site-tools");
  if (!host) return;
  let notice = host.querySelector(".site-tools__notice");
  if (!notice) {
    notice = document.createElement("span");
    notice.className = "site-tools__notice";
    notice.setAttribute("role", "status");
    host.append(notice);
  }

  if (!openTool) {
    // Without a tab the dialog reopens on the one used last.
    openTool = async (tab) => {
      const tools = document.querySelector(".site-tools");
      const status = tools?.querySelector(".site-tools__notice");
      tools?.setAttribute("aria-busy", "true");
      if (status) status.textContent = es ? "Cargando…" : "Loading…";
      try {
        const module = await loadWorkbench();
        workbench = module.mount({ root: localeRoot, locale: locale() });
        workbench.open(tab);
        if (status) status.textContent = "";
      } catch (error) {
        console.error(error);
        if (status)
          status.textContent = es
            ? "No se pudo abrir. Vuelve a intentarlo."
            : "Could not open. Please try again.";
      } finally {
        tools?.removeAttribute("aria-busy");
      }
    };
    document.addEventListener("keydown", onShortcut(openTool));
  }

  const link = host.querySelector("a[data-site-tool]");
  if (!link) return;
  const control = document.createElement("button");
  control.type = "button";
  control.id = "site-tool-desk";
  control.className = link.className;
  control.title = es
    ? "Abrir el glosario y la CLI (Ctrl+` abre la CLI)"
    : "Open the glossary and the CLI (Ctrl+` opens the CLI)";
  // No aria-haspopup: the theme's tooltip controller (content.tooltips)
  // removes it, with aria-controls and aria-describedby, from every titled
  // element it upgrades, which includes this one after instant navigation.
  control.append(...link.childNodes);
  control.addEventListener("click", () => openTool());
  link.replaceWith(control);
}

export function setupWorkbench() {
  workbench?.close();
  workbench?.disposeTools();
  widgetObserver?.disconnect();

  // The header survives instant navigation, so this upgrades once; a
  // re-rendered header would bring its links back and be upgraded again.
  upgradeSiteTools(locale() === "es");

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
