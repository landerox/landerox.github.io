/**
 * Profile HUD: four data nodes around the portrait and a coin flip. The
 * coin rolls toward the first node reached, swaps glyphs in place between
 * nodes and rolls back when the pointer leaves them all.
 */
import { locale } from "./env.js";

// [value, label] per node. Each locale keeps its own word order: "Cloud
// architect" in English, "Arquitecto cloud" in Spanish.
const NODES = {
  en: {
    top: ["Cloud", "architect"],
    right: ["Data", "engineer"],
    bottom: ["GCP · AWS · Private", "multi-cloud"],
    left: ["AI", "agents"],
  },
  es: {
    top: ["Arquitecto", "cloud"],
    right: ["Ingeniero", "de datos"],
    bottom: ["GCP · AWS · Privada", "multinube"],
    left: ["Agentes", "de IA"],
  },
};
const POSITIONS = ["top", "right", "bottom", "left"];
// Roll axis per node; CSS keeps the back disc upright on it.
const AXIS = { top: "x", bottom: "x", left: "y", right: "y" };
// Long enough to cross to the next node, short enough to feel immediate.
const LEAVE_GRACE_MS = 180;

/** `650ms` or `0.65s` → 650. */
function readMs(value, fallback) {
  const raw = value.trim();
  const number = parseFloat(raw);
  if (Number.isNaN(number)) return fallback;
  return raw.endsWith("ms") ? number : number * 1000;
}

/**
 * Drives three wrapper attributes: `data-hud-flip` (the node that started the
 * roll), `data-hud-axis` (kept through the return) and `data-hud-face` (the
 * glyph). A roll requested during a return reuses its axis.
 */
function createFlip(wrapper) {
  const coin = wrapper.querySelector(".hud-coin");
  const flipMs = coin
    ? readMs(window.getComputedStyle(coin).getPropertyValue("--dur-flip"), 650)
    : 650;
  let leaveTimer = null;
  let lastFlip = null;
  let restAt = 0;

  const cancelLeave = () => {
    if (leaveTimer !== null) {
      window.clearTimeout(leaveTimer);
      leaveTimer = null;
    }
  };

  function show(position) {
    cancelLeave();
    if (!wrapper.dataset.hudFlip) {
      const flip = lastFlip && Date.now() < restAt ? lastFlip : position;
      wrapper.dataset.hudAxis = AXIS[flip];
      wrapper.dataset.hudFlip = flip;
      lastFlip = flip;
    }
    wrapper.dataset.hudFace = position;
  }

  function rest() {
    cancelLeave();
    if (!wrapper.dataset.hudFlip) return;
    delete wrapper.dataset.hudFlip;
    restAt = Date.now() + flipMs;
  }

  function leave() {
    cancelLeave();
    leaveTimer = window.setTimeout(rest, LEAVE_GRACE_MS);
  }

  const isShowing = (position) =>
    Boolean(wrapper.dataset.hudFlip) && wrapper.dataset.hudFace === position;

  return { show, leave, rest, isShowing };
}

function bindNode(flip, node, position) {
  node.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") flip.show(position);
  });
  node.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") flip.leave();
  });
  // No hover on touch and pen: a tap toggles the node's face.
  node.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    if (flip.isShowing(position)) flip.rest();
    else flip.show(position);
  });
}

/** Four decorative nodes around the portrait, worded per locale. */
export function setupHudDataNodes() {
  const wrapper = document.querySelector(".profile-hud-wrapper");
  if (!wrapper || wrapper.dataset.hudNodesAdded) return;
  wrapper.dataset.hudNodesAdded = "true";

  const nodes = NODES[locale()] || NODES.en;
  const flip = createFlip(wrapper);
  for (const position of POSITIONS) {
    const [text, label] = nodes[position];
    const value = document.createElement("strong");
    value.textContent = text;
    const node = document.createElement("div");
    node.className = `hud-data-node hud-data-node--${position}`;
    node.setAttribute("aria-hidden", "true");
    node.append(value, label);
    bindNode(flip, node, position);
    wrapper.appendChild(node);
  }

  // A tap on the coin itself restores the photo.
  wrapper.querySelector(".hud-coin")?.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") flip.rest();
  });
}
