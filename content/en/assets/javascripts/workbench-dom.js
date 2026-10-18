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

/** Fill `{key}` placeholders in one pass; an unknown key stays visible. */
export const fill = (template, values) =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );

/** Narrowest fill a non-zero bar keeps, in percent, so it never reads empty. */
const MIN_BAR = 2;

/**
 * A labelled proportion bar. The text carries the value and the bar is
 * decorative, so only the bar width is clamped to 0–100%.
 */
export function barRow(label, detail, percent, state = "ok") {
  const row = element("div", { class: "decision-bar-row", "data-state": state });
  const header = element("div", { class: "decision-bar-header" });
  header.append(
    element("span", { class: "decision-bar-label" }, label),
    element("span", { class: "decision-bar-value" }, detail),
  );
  const track = element("div", { class: "decision-bar-track", "aria-hidden": "true" });
  const bar = element("div", { class: "decision-bar-fill" });
  const width = Math.max(0, Math.min(100, percent));
  bar.style.width = `${width > 0 ? Math.max(MIN_BAR, Math.round(width)) : 0}%`;
  track.append(bar);
  row.append(header, track);
  return row;
}

/**
 * Scenario buttons in a group named by its visible label. `mark(pressed,
 * visible)` sets each preset's pressed state and hides the ones that do not
 * apply.
 */
export function presetGroup(id, label, presets, attribute) {
  const group = element("div", {
    class: "tool-presets",
    role: "group",
    "aria-labelledby": `${id}-label`,
  });
  group.append(element("span", { class: "tool-presets-label", id: `${id}-label` }, label));
  const buttons = new Map();
  for (const preset of presets) {
    const control = button(preset.label, {
      class: "tool-button tool-preset",
      [`data-${attribute}`]: preset.id,
      "aria-pressed": "false",
    });
    buttons.set(preset.id, control);
    group.append(control);
  }
  const mark = (pressed, visible = () => true) => {
    for (const preset of presets) {
      const control = buttons.get(preset.id);
      control.hidden = !visible(preset);
      control.setAttribute("aria-pressed", String(!control.hidden && pressed(preset)));
    }
  };
  return { group, buttons, mark };
}

/** A preset matches when every control holds its value; numbers compare as
 * numbers, so a shared `50.0` still matches `50`. */
export function matchesPreset(values, controls) {
  return Object.entries(values).every(([key, value]) => {
    const input = controls[key];
    if (!input) return false;
    if (input.type !== "number") return input.value === value;
    return input.value.trim() !== "" && Number(input.value) === Number(value);
  });
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
    class: "tool-table-wrapper",
    tabindex: "0",
    role: "region",
    "aria-label": caption,
  });
  const table = element("table", { class: `tool-table ${className}`.trim() });
  const head = element("thead");
  const row = element("tr");
  for (const text of headers)
    row.append(
      element("th", { scope: "col", class: numeric.has(text) ? "tool-number" : "" }, text),
    );
  head.append(row);
  const body = element("tbody");
  table.append(element("caption", {}, caption), head, body);
  wrapper.append(table);
  return { wrapper, body };
}

/**
 * Copy each column label onto the body cells of a filled table, so CSS can
 * stack its rows as `label · value` pairs on phones. Explicit roles keep the
 * table a table for assistive technology once `display` changes.
 */
export function stackRows(body) {
  const table = body.parentElement;
  const headers = Array.from(table.tHead.rows[0].cells);
  table.dataset.stackable = "";
  table.setAttribute("role", "table");
  table.tHead.setAttribute("role", "rowgroup");
  body.setAttribute("role", "rowgroup");
  for (const row of table.rows) row.setAttribute("role", "row");
  for (const cell of headers) cell.setAttribute("role", "columnheader");
  for (const row of body.rows)
    Array.from(row.cells).forEach((cell, index) => {
      cell.setAttribute("role", cell.tagName === "TH" ? "rowheader" : "cell");
      if (index) cell.dataset.label = headers[index].textContent;
    });
}

/** An empty field reads as NaN, never as zero. */
export const readNumber = (input) =>
  input.value.trim() ? Number(input.value) : NaN;

/** A labelled worksheet control; `help` becomes its accessible description. */
export function field(id, label, input, help = "") {
  const wrapper = element("div", { class: "decision-field" });
  const caption = element("label", { for: id }, label);
  input.id = id;
  wrapper.append(caption, input);
  if (help) {
    const hint = element(
      "p",
      { id: id + "-hint", class: "decision-hint" },
      help,
    );
    input.setAttribute("aria-describedby", hint.id);
    wrapper.append(hint);
  }
  return { wrapper, input, caption };
}

export function select(values, labels) {
  const input = element("select");
  for (const [index, value] of values.entries())
    input.append(element("option", { value }, labels[index]));
  return input;
}

/** A closed disclosure for assumptions, with an optional source link. */
export function help(title, paragraphs, href, linkLabel) {
  const details = element("details", { class: "decision-help" });
  details.append(element("summary", {}, title));
  for (const text of paragraphs) details.append(element("p", {}, text));
  if (href) {
    const paragraph = element("p");
    paragraph.append(element("a", { href }, linkLabel));
    details.append(paragraph);
  }
  return details;
}

/** Replace the Markdown fallback with a worksheet title, scope and intro. */
export function shell(host, title, intro, t) {
  host.classList.add("decision-tool");
  host.replaceChildren(
    element("h2", { class: "lab-widget-title" }, title),
    element("p", { class: "decision-local" }, t.local),
    element("p", {}, intro),
  );
}

export function statusNode(id) {
  return element("p", {
    id,
    class: "decision-status",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
}

/** `focus` is false when a shared scenario runs at mount: no focus jump. */
export function showError(error, status, controls, t, focus = true) {
  status.dataset.state = "error";
  status.textContent =
    t.inputError + ": " + (t.errors[error.code] || t.inputError);
  const input = controls[error.field];
  if (input) {
    input.setAttribute("aria-invalid", "true");
    if (focus) input.focus();
  }
}
