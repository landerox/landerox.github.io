/**
 * The landerox.com intro: a 21-second video in a native modal dialog, opened
 * by the clapperboard among the footer's profile links or by the `intro`
 * command of the Toolbox CLI (workbench.js). The module is small and loads
 * with every page, so a click opens the dialog in the same task; the video
 * sources attach on first opening only. It plays with sound because the
 * visitor asked for it; reduced motion or paused animations leave it on its
 * poster until they press play. Closing returns focus to the control that
 * opened it.
 */
import { html, locale, reducedMotion } from "./env.js";

const COPY = {
  en: {
    title: "landerox.com · intro",
    close: "Close",
    transcript:
      "A terminal types, one soft keystroke per letter: Wake up. The Matrix " +
      "has you... Follow the blue rabbit. Knock, knock. Two hard knocks on a " +
      "door, then an old monitor powers on with the landerox.com wordmark, " +
      "pulsing to a heavy guitar riff. No speech.",
  },
  es: {
    title: "landerox.com · intro",
    close: "Cerrar",
    transcript:
      "Una terminal escribe, una tecla suave por letra: Despierta. La Matrix te " +
      "tiene... Sigue al conejo azul. Toc, toc. Dos golpes secos en una puerta " +
      "y luego un monitor antiguo se enciende con la marca landerox.com, que " +
      "late al ritmo de un riff de guitarra pesado. Sin voz.",
  },
};

let dialog = null;

// One cut per locale (the terminal lines are written); AV1 where the browser
// decodes it, H.264 otherwise.
const sources = (lang) => [
  [`/assets/media/intro-${lang}.webm`, 'video/webm; codecs="av01.0.08M.08, opus"'],
  [`/assets/media/intro-${lang}.mp4`, "video/mp4"],
];

function buildDialog(copy) {
  const box = document.createElement("dialog");
  box.className = "intro-window";
  box.setAttribute("aria-labelledby", "intro-title");

  const header = document.createElement("div");
  header.className = "intro-header";
  const title = document.createElement("h2");
  title.id = "intro-title";
  title.textContent = copy.title;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "intro-close";
  close.setAttribute("aria-label", copy.close);
  close.textContent = "×";
  close.addEventListener("click", () => box.close());
  header.append(title, close);

  const video = document.createElement("video");
  video.className = "intro-video";
  video.controls = true;
  video.playsInline = true;
  video.preload = "none";
  video.poster = "/assets/media/intro-poster.jpg";
  video.setAttribute("aria-describedby", "intro-transcript");

  // The words appear only on screen, so screen readers get them as text.
  const transcript = document.createElement("p");
  transcript.id = "intro-transcript";
  transcript.className = "visually-hidden";
  transcript.textContent = copy.transcript;

  box.append(header, video, transcript);
  // Closing stops the sound and rewinds, so the next opening starts clean.
  box.addEventListener("close", () => {
    video.pause();
    video.currentTime = 0;
  });
  // A click on the backdrop (the dialog box itself, outside its content) closes.
  box.addEventListener("click", (event) => {
    if (event.target === box) box.close();
  });
  document.body.append(box);
  return box;
}

export function openIntro() {
  const copy = COPY[locale()];
  if (!dialog?.isConnected) dialog = buildDialog(copy);
  const video = dialog.querySelector("video");
  // Sources attach on first opening only, so nothing loads before the command.
  if (!video.querySelector("source")) {
    for (const [src, type] of sources(locale())) {
      const source = document.createElement("source");
      source.src = src;
      source.type = type;
      video.append(source);
    }
    video.load();
  }
  dialog.showModal();
  const still = reducedMotion.matches || html.dataset.motion === "paused";
  if (!still) {
    // The Enter or click that opened it is the user activation that allows
    // sound; if a browser still refuses, the native controls start it.
    video.play().catch(() => {});
  }
}

/**
 * The footer's clapperboard (partials/social.html) ships hidden, since only
 * this module can open the video. The footer re-renders on every instant
 * navigation, so a hidden one is always new and still unbound.
 */
export function setupIntroLink() {
  const control = document.querySelector(".md-social [data-intro]");
  if (!control?.hidden) return;
  control.hidden = false;
  control.addEventListener("click", () => openIntro());
}
