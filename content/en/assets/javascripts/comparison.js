/** Topic-first reference reading; authored Markdown remains the full fallback. */
import { selectEntries, groupCounts } from "./comparison-core.js";
import { button, element } from "./workbench-dom.js";
import { parseToolHash } from "./share-core.js";

const controllers = new Map();
let sequence = 0;

function revealHash() {
  const { id } = parseToolHash(window.location.hash);
  const target = id && document.getElementById(id);
  if (target)
    for (const controller of controllers.values()) controller.reveal(target);
}
window.addEventListener("hashchange", revealHash);
// Modern emits accepted navigation even for unchanged fragments. Subscribe
// once per module so a closed reference can reopen without duplicating handlers.
window.location$?.subscribe(() => revealHash());
document.addEventListener("click", (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = event.target.closest?.("a[href]");
  if (
    !link ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  )
    return;
  let destination;
  try {
    destination = new window.URL(link.href, window.location.href);
  } catch {
    return;
  }
  if (destination.href === window.location.href) revealHash();
});

function preparePrint() {
  for (const controller of controllers.values()) controller.print(true);
}
function restorePrint() {
  for (const controller of controllers.values()) controller.print(false);
}
window.addEventListener("beforeprint", preparePrint);
window.addEventListener("afterprint", restorePrint);
const printMedia = window.matchMedia("print");
printMedia.addEventListener("change", (event) => {
  if (event.matches) preparePrint();
  else restorePrint();
});

function enhance(source, locale) {
  const es = locale === "es";
  const radar = source.dataset.comparison === "radar";
  const copy = es
    ? {
        group: "Explorar por tema",
        groups: {
          all: "Todo",
          data: "Datos",
          ai: "IA y agentes",
          platform: "Plataforma y operaciones",
        },
        details: "Detalles y fuentes",
        count: (n, total) =>
          n === total
            ? "Todas las perspectivas"
            : n + " de " + total + " perspectivas",
      }
    : {
        group: "Explore by topic",
        groups: {
          all: "All",
          data: "Data",
          ai: "AI & agents",
          platform: "Platforms & operations",
        },
        details: "Details and sources",
        count: (n, total) =>
          n === total
            ? "All perspectives"
            : n + " of " + total + " perspectives",
      };
  const entries = Array.from(source.children)
    .filter((node) => node.classList.contains("comparison-entry"))
    .map((node) => ({
      node,
      heading: node.querySelector("h3"),
      group: node.dataset.group || "",
    }));
  if (
    !entries.length ||
    entries.length > 50 ||
    entries.some((entry) => !entry.heading)
  )
    return;

  const list = element("div", {
    class: "reference-list",
    id: "reference-list-" + ++sequence,
  });
  const filters = element("div", {
    class: "reference-filters",
    role: "group",
    "aria-label": copy.group,
  });
  const status = element("p", {
    class: "reference-count",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
  const controls = new Map();
  let selected = "all";
  let printState = null;
  function choose(group) {
    selected = group;
    const visible = new Set(selectEntries(entries, group));
    for (const entry of entries) entry.node.hidden = !visible.has(entry);
    for (const [key, control] of controls)
      control.setAttribute("aria-pressed", String(key === group));
    status.textContent = copy.count(visible.size, entries.length);
  }
  if (radar) {
    const counts = groupCounts(entries);
    for (const [key, label] of Object.entries(copy.groups)) {
      if (key !== "all" && !counts[key]) continue;
      const control = button(label + " (" + counts[key] + ")", {
        "data-group": key,
        "aria-pressed": String(key === "all"),
        "aria-controls": list.id,
      });
      control.addEventListener("click", () => choose(key));
      controls.set(key, control);
      filters.append(control);
    }
  }
  for (const entry of entries) {
    const { node, heading } = entry;
    const children = Array.from(node.childNodes);
    const anchors = Array.from(node.children).filter(
      (child) =>
        (child.tagName === "SPAN" && child.id) ||
        (child.tagName === "P" &&
          child.children.length === 1 &&
          child.firstElementChild.matches("span[id]") &&
          !child.textContent.trim()),
    );
    for (const anchor of anchors) anchor.classList.add("reference-anchor");
    // Blueprint trade-offs remain visible: fit and limitations are not optional.
    const tradeoff =
      !radar &&
      Array.from(node.children).find(
        (child) =>
          child.matches("p") &&
          /^(Trade-off|Compromiso):/i.test(child.textContent.trim()),
      );
    const meta = element("p", { class: "reference-meta" });
    meta.append(element("span", {}, node.dataset.category || ""));
    if (node.dataset.label)
      meta.append(
        element(
          "span",
          {
            class: "reference-position",
            "data-position": node.dataset.position || "",
          },
          node.dataset.label,
        ),
      );
    const overview = element(
      "p",
      { class: "reference-overview" },
      node.dataset.summary || "",
    );
    const details = element("details", { class: "reference-details" });
    const summary = element("summary", {}, copy.details);
    const title = heading.textContent.trim();
    summary.setAttribute("aria-label", copy.details + ": " + title);
    const evidence = element("div", { class: "reference-evidence" });
    for (const child of children) {
      if (child !== heading && child !== tradeoff && !anchors.includes(child))
        evidence.append(child);
    }
    details.append(summary, evidence);
    node.replaceChildren(...anchors, meta, heading, overview);
    if (tradeoff) {
      tradeoff.classList.add("reference-tradeoff");
      node.append(tradeoff);
    }
    node.append(details);
    entry.details = details;
    list.append(node);
  }
  if (radar) source.replaceChildren(filters, status, list);
  else source.replaceChildren(list);
  source.classList.add("comparison-ready");
  choose("all");
  controllers.set(source, {
    reveal(target) {
      const entry = entries.find((item) => item.node.contains(target));
      if (!entry) return;
      if (entry.node.hidden) choose("all");
      entry.details.open = true;
      window.requestAnimationFrame(() => {
        if (target.isConnected) target.scrollIntoView({ block: "start" });
      });
    },
    print(active) {
      if (active) {
        if (printState) return;
        printState = entries.map((entry) => entry.details.open);
        for (const entry of entries) {
          entry.node.hidden = false;
          entry.details.open = true;
        }
      } else if (printState) {
        entries.forEach((entry, index) => {
          entry.details.open = printState[index];
        });
        printState = null;
        choose(selected);
      }
    },
  });
}

export function mountComparisons(locale) {
  for (const source of controllers.keys())
    if (!source.isConnected) controllers.delete(source);
  document.querySelectorAll("[data-comparison]").forEach((source) => {
    if (!controllers.has(source)) enhance(source, locale);
  });
  revealHash();
  if (printMedia.matches) preparePrint();
}
