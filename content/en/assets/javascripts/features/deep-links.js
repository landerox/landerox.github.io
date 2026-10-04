/** Hash links open the tab or disclosure that holds their target, forward
 * old Labs worksheet anchors to Tools, and hand scenario links to their tool.
 */
import { localeRoot } from "./env.js";
import { parseToolHash } from "../share-core.js";

// Worksheets moved from Labs to Tools; old shared links still resolve.
const MOVED_TO_TOOLS = [
  "interactive-llm-calculator",
  "interactive-sql-sandbox",
  "interactive-workbench",
  "herramientas-interactivas",
];

function redirectMovedWorksheet(id) {
  if (!/\/projects\/labs\/?$/.test(window.location.pathname)) return false;
  if (!MOVED_TO_TOOLS.includes(id)) return false;
  // Keep the whole fragment, so a scenario query survives the move.
  const anchor =
    id.startsWith("interactive-") && id !== "interactive-workbench"
      ? window.location.hash
      : "";
  window.location.replace(
    new window.URL(`projects/tools/${anchor}`, localeRoot).href,
  );
  return true;
}

// Checked against the compiled Modern tab markup: select the tab's radio.
function openTab(block) {
  const content = block.parentElement;
  const set = content?.parentElement;
  if (!content?.matches(".tabbed-content") || !set?.matches(".tabbed-set"))
    return false;
  const index = Array.from(content.children).indexOf(block);
  const control = set.querySelectorAll(':scope > input[type="radio"]')[index];
  if (!control || control.checked) return false;
  control.click();
  return true;
}

// The theme's anchor tracking rewrites the hash with replaceState once the
// page scrolls, possibly before a lazily loaded tool mounts, so the scenario
// is captured here, when the page or its fragment changes.
let scenario = { path: "", id: "", params: new Map() };
const scenarioListeners = new Map();

/** Parameters for tool `id` if this page was opened on its scenario link. */
export function scenarioFor(id) {
  return scenario.path === window.location.pathname &&
    scenario.id === id &&
    scenario.params.size
    ? scenario.params
    : null;
}

/** A mounted tool re-applies a scenario opened later on the same page. */
export function onScenario(id, host, apply) {
  scenarioListeners.set(id, { host, apply });
}

export function revealHashTarget() {
  const { id, params, query } = parseToolHash(window.location.hash);
  scenario = { path: window.location.pathname, id, params };
  if (redirectMovedWorksheet(id)) return;
  const target = id && document.getElementById(id);
  if (!target) return;
  let changed = false;
  for (let node = target.parentElement; node; node = node.parentElement) {
    if (node.matches(".tabbed-block") && openTab(node)) changed = true;
    if (node.matches("details") && !node.open) {
      node.open = true;
      changed = true;
    }
  }
  // A scenario link names no element, so the browser never scrolls to it.
  if (changed || query)
    window.requestAnimationFrame(() =>
      target.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  const listener = scenarioListeners.get(id);
  if (!listener || !params.size) return;
  if (listener.host.isConnected) listener.apply(params);
  else scenarioListeners.delete(id);
}

export function initDeepLinks() {
  window.addEventListener("hashchange", revealHashTarget);
}
