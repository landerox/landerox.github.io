/** Reuse successful catalog loads; a failed request can always be retried. */
import { validateGlossary } from "./glossary-core.js";

const catalogs = new Map();
export function loadGlossary(root) {
  const url = new window.URL("assets/glossary.json", root).href;
  if (!catalogs.has(url)) {
    const pending = fetch(url, {
      credentials: "omit",
      mode: "same-origin",
      signal: window.AbortSignal.timeout(8000),
    }).then(async (response) => {
      if (!response.ok) throw new Error("glossary_http");
      return validateGlossary(await response.json());
    }).catch((error) => {
      catalogs.delete(url);
      throw error;
    });
    catalogs.set(url, pending);
  }
  return catalogs.get(url);
}
