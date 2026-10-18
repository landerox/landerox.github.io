/** Identical search and domain controls for the quick view and public page. */
import { element, button } from "./workbench-dom.js";
import { GLOSSARY_CATEGORIES } from "./glossary-core.js";

export const glossaryStrings = {
  en: {
    search: "Find a technical term", placeholder: "Try RAG or SLO…",
    clear: "Clear filters", categories: "Filter by domain",
    labels: ["All", "Cloud", "Platform", "Data", "AI"],
    results: "Glossary terms", count: "terms", loading: "Loading the glossary…",
    empty: "No matching terms. Try a shorter name, an acronym or another domain.",
    error: "The glossary could not be loaded. Your search has been kept.",
    pageError: "Search is unavailable. All definitions remain below.",
    retry: "Try again", example: "In practice", caveat: "Watch for",
    source: "Read the source", related: "Related concepts", practice: "Try it",
    link: "Link to this definition", browse: "Full glossary", approximate: "Approximate match",
    approximateCount: "includes approximate matches",
  },
  es: {
    search: "Buscar un término técnico", placeholder: "Prueba RAG o SLO…",
    clear: "Limpiar filtros", categories: "Filtrar por dominio",
    labels: ["Todos", "Cloud", "Plataforma", "Datos", "IA"],
    results: "Términos del glosario", count: "términos", loading: "Cargando el glosario…",
    empty: "No hay coincidencias. Prueba un nombre más corto, una sigla u otro dominio.",
    error: "No se pudo cargar el glosario. Tu búsqueda se ha conservado.",
    pageError: "La búsqueda no está disponible. Todas las definiciones siguen abajo.",
    retry: "Reintentar", example: "En la práctica", caveat: "Ten en cuenta",
    source: "Leer la fuente", related: "Conceptos relacionados", practice: "Pruébalo",
    link: "Enlace a esta definición", browse: "Glosario completo", approximate: "Coincidencia aproximada",
    approximateCount: "incluye coincidencias aproximadas",
  },
};

export function createGlossaryControls(host, locale, prefix, onChange) {
  const t = glossaryStrings[locale] || glossaryStrings.en;
  let category = "all";
  const search = element("input", {
    id: `${prefix}-search`, class: "glossary-search", type: "search",
    "aria-label": t.search, placeholder: t.placeholder, maxlength: "160",
    autocomplete: "off", spellcheck: "false", "aria-controls": `${prefix}-results`,
  });
  const clear = button(t.clear, { class: "console-text-button" });
  const form = element("form", { class: "glossary-search-bar", role: "search", "aria-label": t.search });
  form.append(search, clear);
  form.addEventListener("submit", (event) => event.preventDefault());
  const filters = element("div", { class: "glossary-filters", role: "group", "aria-label": t.categories });
  function select(value) {
    category = value;
    for (const filter of filters.children)
      filter.setAttribute("aria-pressed", String(filter.dataset.category === value));
  }
  for (const [i, key] of GLOSSARY_CATEGORIES.entries()) {
    const filter = button(t.labels[i], {
      class: "glossary-filter", "aria-pressed": String(key === "all"), "data-category": key,
    });
    filter.addEventListener("click", () => { select(key); onChange(); });
    filters.append(filter);
  }
  const summary = element("div", { class: "glossary-meta" });
  const status = element("p", { class: "glossary-count", role: "status", "aria-live": "polite" });
  summary.append(status);
  host.append(form, filters, summary);
  function reset(focus = true) {
    search.value = "";
    select("all");
    onChange();
    if (focus) search.focus();
  }
  clear.addEventListener("click", () => reset());
  search.addEventListener("input", onChange);
  return { search, status, summary, reset, get category() { return category; },
    count(matches, total) {
      const approximate = matches.some((match) => match.approximate);
      status.textContent = `${matches.length} / ${total} ${t.count}${approximate ? ` · ${t.approximateCount}` : ""}`;
    },
  };
}
