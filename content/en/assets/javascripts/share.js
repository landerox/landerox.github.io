/** "Copy link to this scenario" for the local tools. The state rides in the
 * fragment, so opening a shared link sends nothing but the page request.
 */
import { element, button } from "./workbench-dom.js";
import { toolHash } from "./share-core.js";
import { scenarioFor, onScenario } from "./features/deep-links.js";

const copy = {
  en: {
    label: "Copy link to this scenario",
    copied: "Link copied. It opens this tool with the same inputs.",
    manual: "Copy this link:",
    size: "This scenario is too large for a link. Copy or download its inputs instead.",
  },
  es: {
    label: "Copiar enlace a este escenario",
    copied: "Enlace copiado. Abre esta herramienta con los mismos datos.",
    manual: "Copia este enlace:",
    size: "Este escenario es demasiado grande para un enlace. Copia o descarga sus datos.",
  },
};

/** Apply the scenario the page opened with, and any opened later on it. */
export function useScenario(id, host, apply) {
  onScenario(id, host, apply);
  const params = scenarioFor(id);
  if (params) apply(params);
}

/** `entries` returns the tool's current [key, value] pairs. */
export function shareControl(id, entries, locale) {
  const t = copy[locale] || copy.en;
  const wrapper = element("div", { class: "tool-share" });
  const trigger = button(t.label, { class: "tool-button" });
  const field = element("input", {
    class: "tool-share-field",
    readonly: "",
    hidden: "",
    "aria-label": t.manual,
  });
  const status = element("p", { class: "tool-share-status", role: "status" });
  // Clearing first lets a repeated message be announced again.
  const announce = (text) => {
    status.textContent = "";
    window.requestAnimationFrame(() => {
      status.textContent = text;
    });
  };
  trigger.addEventListener("click", async () => {
    let url;
    try {
      const target = new window.URL(window.location.href);
      target.hash = toolHash(id, entries());
      url = target.href;
    } catch (error) {
      if (error.message !== "share_size") throw error;
      field.hidden = true;
      announce(t.size);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      field.hidden = true;
      announce(t.copied);
    } catch {
      field.value = url;
      field.hidden = false;
      field.focus();
      field.select();
      announce(t.manual);
    }
  });
  wrapper.append(trigger, status, field);
  return wrapper;
}
