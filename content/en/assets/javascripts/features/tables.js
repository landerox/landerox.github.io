/** Overflowing tables become labelled, keyboard-scrollable regions. */
import { locale } from "./env.js";

let resizeObserver = null;
let frame = null;

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
