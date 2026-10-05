/** Palette wipe via View Transitions, and a valid theme-color meta. */
import { html, reducedMotion, paletteHost } from "./env.js";

let transition;

export function initThemeTransition() {
  // Delegated: the palette inputs re-render on every instant navigation.
  document.addEventListener("click", (event) => {
    const label = event.target.closest('label[for^="__palette_"]');
    if (!label || !document.startViewTransition || reducedMotion.matches)
      return;
    const input = document.getElementById(label.getAttribute("for"));
    if (!input) return;
    event.preventDefault();

    // Start the wipe at the click and size it to the furthest corner. A
    // synthetic click (assistive technology, script) has detail 0 and no
    // pointer position, so it starts from the label's center.
    const bounds = label.getBoundingClientRect();
    const synthetic = event.detail === 0;
    const x = synthetic ? bounds.left + bounds.width / 2 : event.clientX;
    const y = synthetic ? bounds.top + bounds.height / 2 : event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    html.style.setProperty("--click-x", `${x}px`);
    html.style.setProperty("--click-y", `${y}px`);
    html.style.setProperty("--clip-radius", `${radius}px`);

    // Finish an interrupted wipe first; the native input keeps persistence.
    transition?.skipTransition();
    const current = document.startViewTransition(() => input.click());
    transition = current;
    current.ready.catch(() => {});
    current.finished.finally(() => {
      if (transition === current) transition = undefined;
    });
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) transition?.skipTransition();
  });
}

// Zensical writes the translucent header color as an invalid 10-digit hex;
// mirror the page surface instead. The equality check stops a feedback loop.
function syncThemeColor() {
  const color = window.getComputedStyle(paletteHost()).backgroundColor;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta || !color || color === "rgba(0, 0, 0, 0)") return;
  if (meta.content !== color) meta.content = color;
}

export function initThemeColor() {
  new MutationObserver(syncThemeColor).observe(paletteHost(), {
    attributeFilter: ["data-md-color-scheme"],
  });
  new MutationObserver(syncThemeColor).observe(document.head, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["content"],
  });
  syncThemeColor();
}
