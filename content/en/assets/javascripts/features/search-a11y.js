/** Localize Modern's search labels; the theme owns its dialog, focus and ARIA. */
import { locale } from "./env.js";

const LABELS = {
  Search: "Buscar",
  "Close search": "Cerrar búsqueda",
  Filters: "Filtros",
  "Search results": "Resultados de búsqueda",
};
// Text nodes of the Filters panel, which the site has no tags to fill.
const TEXTS = {
  Filters: "Filtros",
  Tags: "Etiquetas",
  "Use Up and Down arrow keys to move between tags. Press Space or Enter to toggle a tag.":
    "Usa las flechas arriba y abajo para moverte entre etiquetas. Pulsa Espacio o Intro para activar una etiqueta.",
};
const MESSAGES = {
  "Loading search…": "Cargando búsqueda…",
  "No results": "Sin resultados",
  "Search is unavailable. Reload the page to try again.":
    "La búsqueda no está disponible. Recarga la página para volver a intentarlo.",
};

let bodyObserver = null;
const observedRoots = new WeakSet();

function localize(root) {
  for (const element of root.querySelectorAll("[aria-label]")) {
    const label = LABELS[element.getAttribute("aria-label")];
    if (label) element.setAttribute("aria-label", label);
  }
  const field = root.querySelector('input[role="combobox"]');
  if (field?.placeholder === "Search") field.placeholder = "Buscar";
  for (const status of root.querySelectorAll('[role="status"]')) {
    const source = status.textContent;
    const count = source.match(/^([\d,]+) results?$/);
    const translated = MESSAGES[source] || (count &&
      `${new Intl.NumberFormat("es").format(Number(count[1].replaceAll(",", "")))} ${count[1] === "1" ? "resultado" : "resultados"}`);
    // Keep Preact's text node alive so later status updates reach the DOM.
    if (translated && status.firstChild?.nodeType === window.Node.TEXT_NODE)
      status.firstChild.nodeValue = translated;
  }
  for (const node of root.querySelectorAll("h3, h4, [id$='-hint']")) {
    const text = TEXTS[node.textContent];
    if (text && node.firstChild?.nodeType === window.Node.TEXT_NODE)
      node.firstChild.nodeValue = text;
  }
}

function localizeShadowRoots() {
  for (const element of document.body.children) {
    const root = element.shadowRoot;
    if (!root) continue;
    if (!observedRoots.has(root)) {
      observedRoots.add(root);
      // Native re-renders can restore English labels and status text.
      new MutationObserver(() => localize(root)).observe(root, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label", "placeholder"],
      });
    }
    localize(root);
  }
}

export function setupSearchA11y() {
  if (locale() !== "es") return;
  localizeShadowRoots();
  if (bodyObserver) return;
  bodyObserver = new MutationObserver(localizeShadowRoots);
  bodyObserver.observe(document.body, { childList: true });
}
