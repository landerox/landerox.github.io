/** Enhance authored HTML without removing its no-JavaScript reading path. */
import { element, button } from "./workbench-dom.js";
import { searchGlossary } from "./glossary-core.js";
import { loadGlossary } from "./glossary-data.js";
import { createGlossaryControls, glossaryStrings } from "./glossary-controls.js";
import { parseToolHash } from "./share-core.js";

let dispose;
export function mountGlossaryPage(root, locale) {
  dispose?.();
  const host = document.querySelector("[data-glossary-page]");
  if (!host) return;
  const t = glossaryStrings[locale] || glossaryStrings.en;
  const controlsHost = host.querySelector(".glossary-page-controls");
  const results = host.querySelector(".glossary-entries");
  const entries = [...results.querySelectorAll(".glossary-entry")];
  for (const entry of entries) entry.querySelector("h2").tabIndex = -1;
  const byId = new Map(entries.map((entry) => [entry.dataset.termId, entry]));
  let terms;
  let alive = true;
  controlsHost.replaceChildren();
  results.id = "glossary-page-results";
  const controls = createGlossaryControls(controlsHost, locale, "glossary-page", render);
  const empty = element("p", { class: "glossary-empty", hidden: "" }, t.empty);
  controlsHost.append(empty);

  function render() {
    if (!terms) return;
    const matches = searchGlossary(terms, controls.search.value, controls.category, locale);
    const visible = new Set(matches.map(({ term }) => term.id));
    for (const entry of entries) entry.hidden = !visible.has(entry.dataset.termId);
    for (const { term } of matches) results.append(byId.get(term.id));
    controls.count(matches, terms.length);
    empty.hidden = matches.length > 0;
  }
  function reveal(focus = false) {
    const { id } = parseToolHash(window.location.hash);
    if (!byId.has(id)) return;
    controls.reset(false);
    const target = document.getElementById(id);
    if (focus) target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: "instant" });
  }
  const onHash = () => reveal(true);
  const onClick = (event) => {
    if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link) return;
    const url = new window.URL(link.href);
    if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash === window.location.hash)
      reveal(true);
  };
  const beforePrint = () => {
    for (const entry of entries) { entry.hidden = false; results.append(entry); }
  };
  const afterPrint = () => { if (terms) render(); };
  window.addEventListener("hashchange", onHash);
  host.addEventListener("click", onClick);
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  dispose = () => {
    alive = false;
    window.removeEventListener("hashchange", onHash);
    host.removeEventListener("click", onClick);
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
  };
  async function load() {
    controls.status.textContent = t.loading;
    controlsHost.querySelector(".glossary-retry")?.remove();
    try {
      const data = await loadGlossary(root);
      if (!alive) return;
      terms = data;
      render();
      reveal();
    } catch {
      if (!alive) return;
      controls.status.textContent = t.pageError;
      const retry = button(t.retry, { class: "console-primary-button glossary-retry" });
      retry.addEventListener("click", load);
      controlsHost.append(retry);
    }
  }
  load();
}
