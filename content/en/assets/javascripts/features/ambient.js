/**
 * Site-wide canvas of drifting nodes linked by proximity. Neighbor search
 * uses a uniform grid and links are stroked in alpha tiers, one path each.
 * Reduced motion and the pause control show the same network as one still
 * frame: no animation loop and no pointer tethers.
 */
import {
  html,
  reducedMotion,
  forcedColors,
  paletteHost,
  isDark,
} from "./env.js";

const CONNECT_DIST = 220;
const POINTER_RADIUS = 200;
const NODE_CAP = 115;
const AREA_PER_NODE = 15000;
const TIERS = 6;
const DPR_CAP = 2;
const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 30;

// Forward neighbor cells, so each pair of cells is visited once.
const FORWARD_CELLS = [
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

// Alpha weights per scheme; the color itself comes from `--ambient-rgb`.
const WEIGHTS = {
  slate: { node: 0.45, line: 0.75, pointer: 0.7 },
  default: { node: 0.35, line: 0.85, pointer: 0.9 },
};

// The light-scheme `--ambient-rgb`, used only if the token cannot be read.
const FALLBACK_CHANNELS = "0, 114, 245";

let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let frame = null;
let started = false;
let resizePending = false;
let lastTick = 0;
// Paint one still frame per request (resize, scheme change, a visible tab)
// when the visitor paused motion or the system asks for reduced motion.
let still = false;
let userPaused = false;
const syncStill = () => {
  still = userPaused || reducedMotion.matches;
};

const nodes = [];
let cols = 0;
let rows = 0;
let buckets = [];
const tiers = Array.from({ length: TIERS }, () => []);
const pointer = { x: null, y: null };
let channels = FALLBACK_CHANNELS;
let weights = WEIGHTS.default;

function readPalette() {
  const raw = window
    .getComputedStyle(paletteHost())
    .getPropertyValue("--ambient-rgb")
    .trim();
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  channels = parts.length === 3 ? parts.join(", ") : FALLBACK_CHANNELS;
  weights = isDark() ? WEIGHTS.slate : WEIGHTS.default;
}

function spawn() {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 3 + 2.5,
  };
}

/** Grows or trims the population without reshuffling what is on screen. */
function fitPopulation() {
  const want = Math.min(NODE_CAP, Math.floor((width * height) / AREA_PER_NODE));
  while (nodes.length > want) nodes.pop();
  while (nodes.length < want) nodes.push(spawn());
}

function buildGrid() {
  cols = Math.max(1, Math.ceil(width / CONNECT_DIST));
  rows = Math.max(1, Math.ceil(height / CONNECT_DIST));
  buckets = Array.from({ length: cols * rows }, () => []);
}

function resize() {
  const previousWidth = width;
  const previousHeight = height;
  // Laid-out size: `innerWidth` includes a classic scrollbar gutter.
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  // Resizing resets the context, so the transform is set absolutely.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Keep the composition when the viewport only changes shape.
  if (previousWidth > 0 && previousHeight > 0) {
    const sx = width / previousWidth;
    const sy = height / previousHeight;
    for (const node of nodes) {
      node.x *= sx;
      node.y *= sy;
    }
  }
  fitPopulation();
  buildGrid();
}

function onResize() {
  if (resizePending) return;
  resizePending = true;
  window.requestAnimationFrame(() => {
    resizePending = false;
    if (!canvas) return;
    resize();
    // A resize clears the backing store; a still canvas needs a repaint, and
    // a loop stopped while the canvas had no size resumes.
    play();
  });
}

function advance(node, elapsed) {
  node.x += node.vx * elapsed;
  node.y += node.vy * elapsed;
  // Absolute directions, so a resize cannot trap a node outside the view.
  if (node.x < 0) {
    node.x = 0;
    node.vx = Math.abs(node.vx);
  } else if (node.x > width) {
    node.x = width;
    node.vx = -Math.abs(node.vx);
  }
  if (node.y < 0) {
    node.y = 0;
    node.vy = Math.abs(node.vy);
  } else if (node.y > height) {
    node.y = height;
    node.vy = -Math.abs(node.vy);
  }
}

function bucketIndex(node) {
  const cx = Math.min(cols - 1, Math.max(0, Math.floor(node.x / CONNECT_DIST)));
  const cy = Math.min(rows - 1, Math.max(0, Math.floor(node.y / CONNECT_DIST)));
  return cy * cols + cx;
}

function link(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  if (distSq >= CONNECT_DIST * CONNECT_DIST) return;
  const strength = 1 - Math.sqrt(distSq) / CONNECT_DIST;
  tiers[Math.min(TIERS - 1, Math.floor(strength * TIERS))].push(
    a.x,
    a.y,
    b.x,
    b.y,
  );
}

function drawNodes(elapsed) {
  for (const bucket of buckets) bucket.length = 0;
  // One path and one fill; `moveTo` keeps the arcs from being joined.
  ctx.fillStyle = `rgba(${channels}, ${weights.node})`;
  ctx.beginPath();
  for (const node of nodes) {
    advance(node, elapsed);
    buckets[bucketIndex(node)].push(node);
    ctx.moveTo(node.x + node.r, node.y);
    ctx.arc(node.x, node.y, node.r, 0, TAU);
  }
  ctx.fill();
}

function drawLinks() {
  // Own cell, then the four forward neighbors.
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const bucket = buckets[cy * cols + cx];
      if (bucket.length === 0) continue;
      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) link(bucket[i], bucket[j]);
      }
      for (const [ox, oy] of FORWARD_CELLS) {
        const nx = cx + ox;
        const ny = cy + oy;
        if (nx < 0 || nx >= cols || ny >= rows) continue;
        const other = buckets[ny * cols + nx];
        for (const a of bucket) for (const b of other) link(a, b);
      }
    }
  }

  ctx.lineWidth = 0.9;
  for (let tier = 0; tier < TIERS; tier++) {
    const segments = tiers[tier];
    if (segments.length === 0) continue;
    const alpha = ((tier + 0.5) / TIERS) * 0.55 * weights.line;
    ctx.strokeStyle = `rgba(${channels}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    for (let i = 0; i < segments.length; i += 4) {
      ctx.moveTo(segments[i], segments[i + 1]);
      ctx.lineTo(segments[i + 2], segments[i + 3]);
    }
    ctx.stroke();
    segments.length = 0;
  }
}

function drawPointer() {
  // A dozen tethers at most, so they are not batched.
  for (const node of nodes) {
    const dist = Math.hypot(node.x - pointer.x, node.y - pointer.y);
    if (dist >= POINTER_RADIUS) continue;
    const alpha = (1 - dist / POINTER_RADIUS) * 0.45 * weights.pointer;
    ctx.strokeStyle = `rgba(${channels}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(pointer.x, pointer.y);
    ctx.stroke();
  }
}

function draw(timestamp) {
  // A hidden tab, or a canvas CSS hides (forced colors), stops the loop.
  if (document.visibilityState === "hidden" || !width || !height) {
    frame = null;
    return;
  }
  // At most 30 paints/s; movement is time-based, so speed stays constant.
  if (!still && lastTick && timestamp - lastTick < FRAME_MS) {
    frame = window.requestAnimationFrame(draw);
    return;
  }
  const elapsed = still
    ? 0
    : lastTick
      ? Math.min((timestamp - lastTick) / (1000 / 60), 3)
      : 1;
  lastTick = timestamp;

  ctx.clearRect(0, 0, width, height);
  drawNodes(elapsed);
  drawLinks();
  if (!still && pointer.x !== null) drawPointer();
  frame = still ? null : window.requestAnimationFrame(draw);
}

function play() {
  if (frame === null && canvas) {
    lastTick = 0;
    frame = window.requestAnimationFrame(draw);
  }
}

function pause() {
  if (frame !== null) {
    window.cancelAnimationFrame(frame);
    frame = null;
  }
}

function listen() {
  window.addEventListener("resize", onResize);
  // Forced colors hide the canvas; leaving that mode must size it again.
  forcedColors.addEventListener("change", onResize);
  window.addEventListener(
    "pointermove",
    (event) => {
      // Touch and pen never send a leave event to clear the tethers.
      if (event.pointerType !== "mouse") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    },
    { passive: true },
  );
  // `mouseleave` does not bubble to window; the root's `pointerleave` does fire.
  html.addEventListener("pointerleave", () => {
    pointer.x = null;
    pointer.y = null;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") play();
    else pause();
  });
  // Read the palette once per scheme change, not once per frame.
  new MutationObserver(() => {
    readPalette();
    if (still) play();
  }).observe(paletteHost(), { attributeFilter: ["data-md-color-scheme"] });
}

function teardownAmbient() {
  pause();
  if (canvas) {
    canvas.remove();
    canvas = null;
    ctx = null;
  }
  nodes.length = 0;
  width = 0;
  height = 0;
}

/** Start or refresh the canvas; also follows a change of the OS preference. */
export function setupAmbient() {
  syncStill();
  if (canvas) {
    play();
    return;
  }
  canvas = document.createElement("canvas");
  canvas.id = "neural-background";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  if (!ctx) {
    teardownAmbient();
    return;
  }
  readPalette();
  resize();
  if (!started) {
    started = true;
    listen();
  }
  play();
}

/** Freeze on a still frame (motion toggle) or resume the drift. */
export function setAmbientStill(value) {
  userPaused = value;
  syncStill();
  if (!canvas) return;
  pause();
  play();
}
