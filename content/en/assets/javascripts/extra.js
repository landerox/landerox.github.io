/**
 * landerox.com — progressive enhancements, one module per feature in features/.
 * The site reads fully without them. `boot()` re-runs on every instant
 * navigation, so every setup is idempotent.
 */
import { reducedMotion, finePointer } from "./features/env.js";
import { initThemeTransition, initThemeColor } from "./features/theme.js";
import { setupAmbient } from "./features/ambient.js";
import { setupMotionToggle } from "./features/motion.js";
import { setupCardTilt } from "./features/cards.js";
import {
  setupRepoLinkTarget,
  setupLogoTurn,
  setupHeaderButtons,
} from "./features/header.js";
import { setupHudDataNodes } from "./features/hud.js";
import { setupStatusPill } from "./features/status.js";
import { setupSearchA11y } from "./features/search-a11y.js";
import { setupTableA11y } from "./features/tables.js";
import { initDeepLinks, revealHashTarget } from "./features/deep-links.js";
import {
  setupWorkbench,
  setupComparisons,
  setupGlossaryPage,
} from "./features/lazy-features.js";

initThemeTransition();
initThemeColor();
initDeepLinks();

function boot() {
  // Before the canvas mounts, so a paused visit never paints a moving frame.
  setupMotionToggle();
  setupAmbient();
  setupCardTilt();
  setupRepoLinkTarget();
  setupLogoTurn();
  setupHudDataNodes();
  setupStatusPill();
  setupSearchA11y();
  setupHeaderButtons();
  setupTableA11y();
  setupWorkbench();
  setupComparisons();
  setupGlossaryPage();
  revealHashTarget();
}

// Honor a mid-session change to the OS motion preference: the canvas
// switches between drifting and a still frame.
reducedMotion.addEventListener("change", () => {
  setupAmbient();
  // Cards skipped while reduced motion was on still need binding.
  if (!reducedMotion.matches) setupCardTilt();
});

// A mouse attached after load gets the card tilt it skipped.
finePointer.addEventListener("change", setupCardTilt);

if (typeof document$ !== "undefined") {
  // Zensical's instant navigation: fires once per page, the first included.
  document$.subscribe(boot);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
