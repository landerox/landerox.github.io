/** Text-only DOM construction shared by the local tools. */
export function element(tag, attributes = {}, text = "") {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, value);
  if (text) node.textContent = text;
  return node;
}

export function button(text, attributes = {}) {
  return element("button", { type: "button", ...attributes }, text);
}

/** Title row shared by the tools: heading plus a short scope badge. */
export function widgetHeader(title, badge) {
  const header = element("div", { class: "lab-widget-header" });
  header.append(
    element("h2", { class: "lab-widget-title" }, title),
    element("span", { class: "lab-widget-badge" }, badge),
  );
  return header;
}

/** A captioned, keyboard-scrollable table; `numeric` names right-aligned
 * columns. Returns the wrapper to insert and the body to fill.
 */
export function tableShell(headers, caption, className = "", numeric = new Set()) {
  const wrapper = element("div", {
    class: "sql-results-wrapper",
    tabindex: "0",
    role: "region",
    "aria-label": caption,
  });
  const table = element("table", { class: `sql-results-table ${className}`.trim() });
  const head = element("thead");
  const row = element("tr");
  for (const text of headers)
    row.append(
      element("th", { scope: "col", class: numeric.has(text) ? "sql-number" : "" }, text),
    );
  head.append(row);
  const body = element("tbody");
  table.append(element("caption", {}, caption), head, body);
  wrapper.append(table);
  return { wrapper, body };
}

/** Save text as a file through a temporary object URL. */
export function downloadText(filename, text, type) {
  const url = window.URL.createObjectURL(new window.Blob([text], { type }));
  const link = element("a", { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
