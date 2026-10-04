/** Header behaviors: repository link target, logo turn and button semantics. */
import { reducedMotion } from "./env.js";

export function setupRepoLinkTarget() {
  for (const anchor of document.querySelectorAll(
    "a.md-source, .md-header__source a",
  )) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  }
}

/** One slow logo turn per hover or keyboard focus; a started turn finishes. */
export function setupLogoTurn() {
  for (const logo of document.querySelectorAll(".md-header__button.md-logo")) {
    if (logo.dataset.turnBound) continue;
    logo.dataset.turnBound = "true";
    const turn = () => {
      if (reducedMotion.matches || logo.classList.contains("is-turning"))
        return;
      logo.classList.add("is-turning");
    };
    // A tap navigates home, so only a hovering pointer turns the logo.
    logo.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") turn();
    });
    logo.addEventListener("focus", () => {
      if (logo.matches(":focus-visible")) turn();
    });
    // A cancelled turn (the logo hidden mid-turn) must not replay later.
    for (const type of ["animationend", "animationcancel"])
      logo.addEventListener(type, () => logo.classList.remove("is-turning"));
  }
}

let buttonsController;

/**
 * Modern uses checkbox labels as the drawer and search icons. Keep the labels
 * for its handlers and wrap their content in a real button.
 */
export function setupHeaderButtons() {
  buttonsController?.abort();
  buttonsController = new window.AbortController();
  const options = { signal: buttonsController.signal };
  for (const id of ["__drawer", "__search"]) {
    const input = document.getElementById(id);
    const label = document.querySelector(`.md-header__button[for="${id}"]`);
    if (!input || !label) continue;
    let control = label.querySelector(".theme-toggle-button");
    if (!control) {
      control = document.createElement("button");
      control.type = "button";
      control.className = "theme-toggle-button";
      control.setAttribute("aria-label", label.getAttribute("aria-label"));
      control.append(...label.childNodes);
      label.replaceChildren(control);
      label.removeAttribute("aria-label");
    }
    control.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        label.click();
      },
      options,
    );
    if (id === "__drawer") {
      const sync = () =>
        control.setAttribute("aria-expanded", String(input.checked));
      input.addEventListener("change", sync, options);
      sync();
      document.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key !== "Escape" ||
            !input.checked ||
            document.querySelector("dialog[open]")
          )
            return;
          input.click();
          control.focus();
        },
        options,
      );
    }
  }
  const overlay = document.querySelector(".md-overlay");
  overlay?.removeAttribute("aria-label");
  overlay?.setAttribute("aria-hidden", "true");
}
