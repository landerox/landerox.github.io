/** Availability pill under the portrait, refreshed on wall-clock minute boundaries. */
import { locale } from "./env.js";
import { statusAt } from "./status-core.js";

let timer = null;

export function setupStatusPill() {
  const wrapper = document.querySelector(".profile-hud-wrapper");
  if (!wrapper) {
    // Off the home page: stop refreshing a pill that no longer exists.
    window.clearTimeout(timer);
    timer = null;
    return;
  }

  let pill = wrapper.querySelector(".hud-status-pill");
  if (!pill) {
    pill = document.createElement("div");
    pill.className = "hud-status-pill";
    const dot = document.createElement("span");
    dot.className = "hud-status-dot";
    dot.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.className = "hud-status-label";
    // The guidance also lives in the title, which keyboard, touch and most
    // screen-reader users never reach.
    const hint = document.createElement("span");
    hint.className = "visually-hidden hud-status-hint";
    pill.append(dot, text, hint);
    wrapper.appendChild(pill);
  }
  const label = pill.querySelector(".hud-status-label");
  const hint = pill.querySelector(".hud-status-hint");
  const es = locale() === "es";

  const update = () => {
    const state = statusAt(Date.now());
    pill.dataset.state = state.id;
    pill.style.setProperty("--status-color", `var(${state.color})`);
    // Working hours, not live presence: the tooltip says so first.
    const guidance =
      (es ? "Hora de Caracas (UTC-4). " : "Caracas time (UTC-4). ") +
      (es ? state.titleEs : state.titleEn);
    pill.title = guidance;
    label.textContent = es ? state.es : state.en;
    if (hint) hint.textContent = ` ${guidance}`;
  };

  const scheduleNext = () => {
    const minuteMs = 60 * 1000;
    timer = window.setTimeout(
      () => {
        update();
        scheduleNext();
      },
      minuteMs - (Date.now() % minuteMs) + 50,
    );
  };

  update();
  window.clearTimeout(timer);
  scheduleNext();
}
