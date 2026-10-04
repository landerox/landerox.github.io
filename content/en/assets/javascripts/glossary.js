/** Quick glossary view; every definition also has a native public link. */
import { element, button } from "./workbench-dom.js";
import { GLOSSARY_CATEGORIES, searchGlossary } from "./glossary-core.js";
import { loadGlossary } from "./glossary-data.js";
import { createGlossaryControls, glossaryStrings } from "./glossary-controls.js";

export function createGlossary(panel, root, locale) {
  const t = glossaryStrings[locale] || glossaryStrings.en;
  let terms;
  let pending;
  const controls = createGlossaryControls(panel, locale, "glossary", render);
  const { search, status } = controls;
  const destination = new window.URL("glossary/", root);
  controls.summary.append(element("a", { href: destination.href, class: "glossary-browse" }, t.browse));
  const results = element("div", {
    id: "glossary-results", class: "glossary-results", role: "region",
    "aria-label": t.results, tabindex: "0",
  });
  panel.append(results);

  function render() {
    if (!terms) return;
    const matches = searchGlossary(terms, search.value, controls.category, locale);
    const byId = new Map(terms.map((term) => [term.id, term]));
    results.replaceChildren();
    results.scrollTop = 0;
    controls.count(matches, terms.length);
    if (!matches.length) results.append(element("p", { class: "glossary-empty" }, t.empty));
    for (const { term, approximate } of matches) {
      const text = term[locale];
      const card = element("details", { class: "glossary-card", "data-term-id": term.id });
      const summary = element("summary");
      summary.append(
        element("span", { class: "glossary-term" }, text.term),
        element("span", { class: "glossary-domain" }, t.labels[GLOSSARY_CATEGORIES.indexOf(term.category)]),
        element("span", { class: "glossary-definition" }, text.definition),
      );
      if (approximate) summary.append(element("span", { class: "glossary-match-note" }, t.approximate));
      const body = element("div", { class: "glossary-body" });
      for (const [label, value] of [[t.example, text.example], [t.caveat, text.caveat]]) {
        const paragraph = element("p");
        paragraph.append(element("strong", {}, `${label}. `), document.createTextNode(value));
        body.append(paragraph);
      }
      const related = element("p", { class: "glossary-related" });
      related.append(element("strong", {}, `${t.related}: `));
      for (const [i, id] of term.related.entries()) {
        if (i) related.append(document.createTextNode(" · "));
        related.append(element("a", { href: `${destination.href}#${id}` }, byId.get(id)[locale].term));
      }
      body.append(related);
      if (term.practice) {
        const practice = element("p");
        practice.append(element("a", {
          href: new window.URL(term.practice.path, root).href,
        }, `${t.practice}: ${term.practice[locale]}`));
        body.append(practice);
      }
      const links = element("p", { class: "glossary-entry-links" });
      links.append(
        element("a", {
          class: "console-source", href: term.source.url,
          target: "_blank", rel: "noopener noreferrer",
        }, `${t.source} · ${term.source.label} ↗`),
        element("a", { href: `${destination.href}#${term.id}` }, t.link),
      );
      body.append(links);
      card.append(summary, body);
      card.open = Boolean(search.value.trim()) && term === matches[0].term;
      results.append(card);
    }
  }

  async function load() {
    if (terms || pending) return pending;
    status.textContent = t.loading;
    results.setAttribute("aria-busy", "true");
    pending = loadGlossary(root).then((data) => {
      terms = data;
      render();
    }).catch(() => {
      status.textContent = t.error;
      const retry = button(t.retry, { class: "console-primary-button" });
      retry.addEventListener("click", () => { load(); search.focus(); });
      results.replaceChildren(retry);
    }).finally(() => {
      pending = null;
      results.removeAttribute("aria-busy");
    });
    return pending;
  }
  return { load, focus: () => search.focus({ preventScroll: true }) };
}
