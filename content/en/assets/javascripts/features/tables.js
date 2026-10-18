/**
 * Overflowing tables become labelled, keyboard-scrollable regions, and
 * comparison tables get the data they need to stack their rows on phones.
 */
import { locale } from "./env.js";

let resizeObserver = null;
let frame = null;

// From this many columns a phone shows only the first two or three.
const STACK_FROM = 4;

/**
 * Copy each column label onto its cells, so CSS can show `Label: value`
 * pairs when it turns rows into blocks. Explicit roles keep the table a
 * table for assistive technology once `display` changes.
 */
function prepareStacking(table) {
  if (!table || table.dataset.stacked !== undefined) return;
  const labels = Array.from(table.querySelectorAll("thead th"), (cell) =>
    cell.textContent.trim(),
  );
  if (labels.length < STACK_FROM || labels.some((label) => !label)) return;
  table.dataset.stacked = "";
  table.setAttribute("role", "table");
  for (const group of table.querySelectorAll("thead, tbody"))
    group.setAttribute("role", "rowgroup");
  for (const row of table.rows) row.setAttribute("role", "row");
  for (const cell of table.querySelectorAll("th"))
    cell.setAttribute("role", "columnheader");
  for (const body of table.tBodies) {
    for (const row of body.rows) {
      Array.from(row.cells).forEach((cell, index) => {
        cell.setAttribute("role", "cell");
        cell.dataset.label = labels[index] ?? "";
      });
    }
  }
}

function labelFor(wrapper, table) {
  let heading = wrapper.previousElementSibling;
  while (heading && !heading.matches("h2, h3, h4"))
    heading = heading.previousElementSibling;
  const title = table?.caption?.textContent || heading?.textContent || "";
  const label = locale() === "es" ? "Tabla desplazable" : "Scrollable table";
  return title ? `${label}: ${title.trim()}` : label;
}

function update(regions) {
  for (const { wrapper, label } of regions) {
    const overflow =
      wrapper.clientWidth > 0 && wrapper.scrollWidth > wrapper.clientWidth + 1;
    if (overflow) {
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", label);
      wrapper.dataset.keyboardScroll = "true";
    } else if (wrapper.dataset.keyboardScroll) {
      wrapper.removeAttribute("tabindex");
      wrapper.removeAttribute("role");
      wrapper.removeAttribute("aria-label");
      delete wrapper.dataset.keyboardScroll;
    }
  }
}

export function setupTableA11y() {
  resizeObserver?.disconnect();
  if (frame) window.cancelAnimationFrame(frame);
  // Modern adds its table wrappers during navigation; wait for that pass.
  frame = window.requestAnimationFrame(() => {
    frame = null;
    const regions = Array.from(
      document.querySelectorAll(".md-typeset__scrollwrap"),
      (wrapper) => {
        const table = wrapper.querySelector("table");
        prepareStacking(table);
        return { wrapper, table, label: labelFor(wrapper, table) };
      },
    );
    if (!regions.length) return;
    update(regions);
    if (!window.ResizeObserver) return;
    // Viewport and table sizes both matter, including tables in hidden tabs.
    resizeObserver = new window.ResizeObserver(() => update(regions));
    for (const { wrapper, table } of regions) {
      resizeObserver.observe(wrapper);
      if (table) resizeObserver.observe(table);
    }
  });
}
