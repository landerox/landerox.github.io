/** Shared state and helpers for the site enhancement modules. */

export const html = document.documentElement;
export const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
export const finePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)",
);
export const forcedColors = window.matchMedia("(forced-colors: active)");

// This file lives at <locale root>/assets/javascripts/features/env.js.
export const localeRoot = new window.URL("../../../", import.meta.url).href;

// Zensical sets the scheme and its tokens on <body>, not <html>.
export const paletteHost = () => document.body || html;
export const isDark = () =>
  paletteHost().getAttribute("data-md-color-scheme") === "slate";

export const locale = () => (html.lang === "es" ? "es" : "en");

/** One cached dynamic import per URL; a failed load is retried next time. */
export function lazyImport(url) {
  let pending = null;
  return () =>
    (pending ||= import(url).catch((error) => {
      pending = null;
      throw error;
    }));
}
