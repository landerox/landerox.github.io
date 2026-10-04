/**
 * Accessible names for the search UI, which Zensical renders into an open
 * shadow root without them. Every patch is guarded, so it becomes a no-op
 * once the theme names its own controls.
 */
import { locale } from "./env.js";

const STRINGS = {
  en: { close: "Close search", filters: "Toggle search filters", field: "Search" },
  es: { close: "Cerrar búsqueda", filters: "Alternar filtros de búsqueda", field: "Buscar" },
};
const RESULTS_ID = "ldx-search-results";

let bodyObserver = null;
const observedRoots = new WeakSet();
const boundInputs = new WeakSet();
const panels = new WeakMap();

// Modern fades its closed panel but leaves its controls in the tab order.
function syncPanel(panel, root) {
  const open = window.getComputedStyle(panel).pointerEvents !== "none";
  const state = panels.get(panel) || { open: false, opener: null };
  if (open && !state.open && document.activeElement !== root.host)
    state.opener = document.activeElement;
  panel.inert = !open;
  if (
    !open &&
    state.open &&
    state.opener?.isConnected &&
    [document.body, root.host].includes(document.activeElement)
  )
    state.opener.focus({ preventScroll: true });
  state.open = open;
  panels.set(panel, state);
}

function patchRoot(root) {
  const strings = STRINGS[locale()];
  const field = root.querySelector('input[role="combobox"]');
  if (!field) return;

  // The results container is the sibling after the row holding the field.
  const results = field.parentElement?.parentElement?.nextElementSibling;
  const panel = results?.parentElement?.parentElement;
  if (panel) syncPanel(panel, root);
  if (results) {
    if (!results.id) results.id = RESULTS_ID;
    if (field.getAttribute("aria-controls") !== results.id)
      field.setAttribute("aria-controls", results.id);
  }

  // Its only name was a hardcoded English placeholder in both locales.
  if (!field.getAttribute("aria-label"))
    field.setAttribute("aria-label", strings.field);
  if (!field.name) field.name = "q";
  if (field.placeholder !== strings.field) field.placeholder = strings.field;

  const syncExpanded = () => {
    const expanded = field.value.trim() ? "true" : "false";
    if (field.getAttribute("aria-expanded") !== expanded)
      field.setAttribute("aria-expanded", expanded);
  };
  syncExpanded();
  if (!boundInputs.has(field)) {
    boundInputs.add(field);
    field.addEventListener("input", syncExpanded);
  }

  // Icon-only buttons: the one before the field closes, the one after filters.
  // Once named they drop out of the query, so re-renders stay cheap.
  for (const button of root.querySelectorAll("button:not([aria-label])")) {
    if (button.textContent.trim()) continue;
    const beforeField =
      button.compareDocumentPosition(field) &
      window.Node.DOCUMENT_POSITION_FOLLOWING;
    button.setAttribute("aria-label", beforeField ? strings.close : strings.filters);
  }
}

// Every open shadow root under <body>: the host appears before its content.
function patchShadowRoots() {
  for (const element of document.body.children) {
    const root = element.shadowRoot;
    if (!root) continue;
    if (!observedRoots.has(root)) {
      observedRoots.add(root);
      // Class changes only, so our own ARIA and inert writes do not loop.
      new MutationObserver(() => patchRoot(root)).observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    patchRoot(root);
  }
}

export function setupSearchA11y() {
  patchShadowRoots();
  // The theme bundle may attach the host after first paint.
  if (bodyObserver) return;
  bodyObserver = new MutationObserver(patchShadowRoots);
  bodyObserver.observe(document.body, { childList: true });
}
