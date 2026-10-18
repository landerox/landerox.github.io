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
    // A cached page and a newer catalog can disagree; only built entries count.
    const matches = searchGlossary(terms, controls.search.value, controls.category, locale)
      .filter(({ term }) => byId.has(term.id));
    const visible = new Set(matches.map(({ term }) => term.id));
    for (const entry of entries) entry.hidden = !visible.has(entry.dataset.termId);
    for (const { term } of matches) results.append(byId.get(term.id));
    controls.count(matches, entries.length);
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
  // Instant navigation pushes in-page fragments without `hashchange`; Modern
  // reports every accepted navigation, unchanged fragments included, on
  // location$. A related link to a filtered-out term clears the filter.
  const page = window.location.pathname;
  const onNavigate = () => {
    if (window.location.pathname === page) reveal(true);
  };
  const navigation = window.location$?.subscribe(onNavigate);
  const beforePrint = () => {
    for (const entry of entries) { entry.hidden = false; results.append(entry); }
  };
  const afterPrint = () => { if (terms) render(); };
  window.addEventListener("hashchange", onNavigate);
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  dispose = () => {
    alive = false;
    navigation?.unsubscribe();
    window.removeEventListener("hashchange", onNavigate);
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
