/** Cursor-tracked tilt on grid cards (writes --rx, --ry and --ty). */
import { reducedMotion, finePointer } from "./env.js";

const CARD_SELECTOR = ".md-typeset .grid.cards > ul > li";
const MAX_TILT = 3;

export function setupCardTilt() {
  // Needs a hovering fine pointer; on touch it would fire on scroll-drags.
  if (reducedMotion.matches || !finePointer.matches) return;

  for (const card of document.querySelectorAll(CARD_SELECTOR)) {
    if (card.dataset.tiltBound) continue;
    card.dataset.tiltBound = "true";

    let frameId = null;
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      frameId = null;
      // A preference change after binding leaves the listeners in place.
      if (reducedMotion.matches || !finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (lastX - rect.left) / rect.width - 0.5;
      const y = (lastY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--rx", `${-y * MAX_TILT}deg`);
      card.style.setProperty("--ry", `${x * MAX_TILT}deg`);
      card.style.setProperty("--ty", "-3px");
    };

    card.addEventListener(
      "pointermove",
      (event) => {
        lastX = event.clientX;
        lastY = event.clientY;
        frameId ??= window.requestAnimationFrame(apply);
      },
      { passive: true },
    );

    card.addEventListener("pointerleave", () => {
      // A queued frame would re-apply the tilt after this reset.
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--ty", "0px");
    });
  }
}
