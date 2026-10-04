/**
 * WCAG 2.2.2 pause for motion that starts on its own (canvas, HUD rings,
 * status ping). Persists through the theme's storage under the shared scope.
 */
import { html, locale } from "./env.js";
import { setAmbientStill } from "./ambient.js";

const MOTION_KEY = "__motion";
const LABELS = { en: "Pause animations", es: "Pausar animaciones" };

function readPaused() {
  try {
    return window.__md_get?.(MOTION_KEY) === "paused";
  } catch {
    return false;
  }
}

function applyMotion(paused) {
  if (paused) html.dataset.motion = "paused";
  else delete html.dataset.motion;
  setAmbientStill(paused);
  for (const button of document.querySelectorAll(".motion-toggle"))
    button.setAttribute("aria-pressed", String(paused));
}

function createOption(placement) {
  const label = LABELS[locale()];
  const button = document.createElement("button");
  button.type = "button";
  button.className = "md-header__button md-icon motion-toggle";
  button.setAttribute("aria-label", label);
  button.title = label;
  const icon = document.createElement("span");
  icon.className = "motion-toggle__icon";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);
  button.addEventListener("click", () => {
    const paused = html.dataset.motion !== "paused";
    try {
      window.__md_set?.(MOTION_KEY, paused ? "paused" : "running");
    } catch {
      // Storage unavailable: the choice lasts for this document only.
    }
    applyMotion(paused);
  });
  const option = document.createElement("div");
  option.className = `md-header__option motion-option motion-option--${placement}`;
  option.append(button);
  return option;
}

/** Header copy beside the palette toggle; CSS shows the footer copy below 22.5em. */
export function setupMotionToggle() {
  const palette = document.querySelector(
    '.md-header__option[data-md-component="palette"]',
  );
  if (palette && !document.querySelector(".motion-option--header"))
    palette.before(createOption("header"));
  // The footer re-renders on every instant navigation.
  const footer = document.querySelector(".md-footer-meta__inner");
  if (footer && !footer.querySelector(".motion-option--footer"))
    footer.append(createOption("footer"));
  applyMotion(readPaused());
}
