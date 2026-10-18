/** On-demand native dialog, utility CLI and the loader of the Tools worksheets. */
import {
  COMMANDS,
  COMMAND_EXAMPLES,
  parseCommand,
  completions,
  suggestCommand,
  inspectSubnet,
  transformText,
  hashText,
  createUUIDs,
  inspectTime,
  inspectCron,
  inspectAvailability,
  convertBytes,
  convertBase,
  inspectContrast,
  inspectJwt,
  inspectRate,
} from "./workbench-core.js";
import { element, button } from "./workbench-dom.js";
import { createGlossary } from "./glossary.js";
import { openIntro } from "./features/intro.js";

const strings = {
  en: {
    title: "Toolbox",
    subtitle:
      "Look up a term or run a local utility. Everything runs in your browser.",
    tabs: "Workspace views",
    glossary: "Glossary",
    terminal: "CLI",
    close: "Close console",
    copy: "Copy output",
    copied: "Copied to clipboard.",
    copyError: "Copy is unavailable. Select the text to copy it manually.",
    command: "CLI command",
    runCommand: "Run command",
    output: "Terminal output",
    welcome:
      "Local utilities for engineers: SLO downtime, cron schedules, JWTs, subnets, hashes and more. Type help.",
    terminalHint:
      "help | intro | Tab completes | ↑ ↓ history | Ctrl+L clears | Escape closes",
    unknown: "Unknown command. Did you mean:",
    notShell:
      "This is not a shell: it runs a few local utilities. Type help to list them.",
    usage: "Usage:",
    example: "Try:",
    useExample: "Insert example",
    exampleReady: "Example inserted. Press Enter to run it.",
    acceptSuggestion:
      "Right Arrow accepts the faint suggestion; Enter runs the command.",
    empty: "No commands in this session.",
    utilityNote:
      "Tools run locally, except ping (3 same-origin HTTP requests). Nothing is sent to an IP lookup or AI service. Input history stays in this tab; do not paste secrets. No shell quoting or expansion; trailing text spaces are preserved.",
    commandNotes: {
      ping: "Measures time to HTTP response headers, including browser/connection overhead; not ICMP, bandwidth or uptime. Only this origin, never arbitrary hosts. Escape cancels.",
      ip: "IPv4 arithmetic only, not a public-IP lookup. /31 assumes a point-to-point link; /32 is a host route. Provider reservations and special-use ranges can reduce usable addresses.",
      hash: "SHA-256 digest, not encryption or password storage.",
      base64:
        "UTF-8 text, not binary files. Base64 is encoding, not encryption.",
      url: "One URI component; not a URL validator. Decoding leaves + literal (not form encoding).",
      json: "Uses JavaScript number precision. Unsafe integers and non-finite numbers are rejected; duplicate object keys keep their last value.",
      time: "No argument: your local clock. Accepts an IANA zone or integer Unix seconds (not milliseconds); dates are limited to years 0000–9999.",
      bytes:
        "B means bytes, not bits. kB/MB/GB/TB use powers of 1,000; KiB/MiB/GiB/TiB use powers of 1,024. Units are case-sensitive. Omit the target to compare all units. Use a decimal point, up to 18 integer and 6 fractional digits. ≈ marks rounding to 12 decimal places.",
      base: "Bases 2–36 use digits 0–9 and letters a–z. Up to 256 digits, with an optional + or - sign. Prefixes and exponents are not inferred; every character is a digit in the chosen base. No separators or fractions. Integer arithmetic stays exact with BigInt.",
      contrast:
        "Opaque sRGB #RGB or #RRGGBB only; no alpha, gradients or images. Large text means at least 18 pt, or 14 pt bold. Threshold checks use the unrounded ratio; the display shows 3 decimals. This checks one color pair, not complete WCAG conformance.",
      cron: "Vixie cron fields: minute, hour, day of month, month, day of week (0 or 7 is Sunday). Supports *, lists, ranges, steps on * or a range, names and @daily-style macros. When both day fields are restricted, either one matching is enough. Runs are listed in UTC, the GitHub Actions default; a scheduler set to a zone with daylight saving can skip or repeat local times.",
      nines:
        "Time budgets assume every second of the period is measured and counts. A request-based SLO counts failed requests instead, and planned maintenance counts unless the SLO excludes it. Months are 30 days, quarters 90 and years 365.",
      jwt: "Decoded locally; nothing is sent. The signature is NOT verified, so anyone could have written these claims. Times are UTC. Avoid pasting live production tokens anyway.",
      rate: "An even average over the period: peaks, batching, retries and compression change what you must provision. Byte units are case-sensitive (B is bytes); a lowercase word labels events. Months are 30 days.",
    },
    subnet: [
      "Address",
      "Network",
      "Mask",
      "Broadcast",
      "Addresses",
      "Host capacity",
      "Host range",
    ],
    notApplicable: "Not applicable",
    pingStart: "HTTP HEAD · 3 requests · 3 s timeout each",
    pingFailed: "Request failed or timed out.",
    pingCancelled: "Ping cancelled.",
    introOpened: "Playing the intro above the console. Escape closes it.",
    pingSummary: "successful",
    pingStats: "min / avg / max",
    localClock: "Clock",
    unixSeconds: "Unix seconds",
    cronFields: ["Minute", "Hour", "Day of month", "Month", "Day of week"],
    cronEvery: "every",
    cronMacro: "expands to",
    cronEither: "Runs on days matching the day of month or the day of week.",
    cronNext: "Next runs · UTC → your clock",
    cronNever:
      "No run in the next five years. Check impossible dates such as 30 February.",
    ninesTarget: "Target",
    ninesPeriods: {
      day: "Per day",
      week: "Per week",
      month: "Per 30 days",
      quarter: "Per 90 days",
      year: "Per year",
    },
    ninesRequests: "Failures per million requests",
    jwtLabels: {
      kind: "Type",
      jws: "Signed (JWS), signature not verified",
      jwe: "Encrypted (JWE): only the header is readable",
      alg: "Algorithm",
      header: "Header",
      payload: "Payload",
      claims: "Registered claims",
      unsigned: "Unsigned token (alg none or empty signature): treat its claims as untrusted input.",
      expired: "expired",
      valid: "not yet expired",
      past: "in the past",
      future: "in the future",
    },
    ratePeriods: {
      second: "Per second",
      minute: "Per minute",
      hour: "Per hour",
      day: "Per day",
      month: "Per 30 days",
    },
    baseLabel: "Base",
    contrastLabels: [
      "Text color",
      "Background",
      "Contrast ratio",
      "AA · normal text (4.5:1)",
      "AA · large text (3:1)",
      "AAA · normal text (7:1)",
      "AAA · large text (4.5:1)",
    ],
    contrastMeets: "Meets the threshold",
    contrastBelow: "Below the threshold",
    utilityErrors: {
      ip: "Use a valid IPv4 address or CIDR, e.g. ip 192.168.10.42/24. This command does not discover your public IP.",
      uuid: "Choose between 1 and 10 UUIDs, e.g. uuid 3.",
      crypto:
        "Web Crypto is unavailable. Open this page over HTTPS or localhost.",
      text_length: "Provide text after the command, within 2,200 characters.",
      base64: "Use base64 encode <text> or base64 decode <valid UTF-8 Base64>.",
      url: "Use url encode <text> or url decode <valid percent-encoded UTF-8>.",
      json: "Invalid JSON. Use double-quoted keys and strings; no trailing commas.",
      json_size:
        "Formatted JSON would exceed 16,000 characters. Use a smaller or less deeply nested value.",
      json_number:
        "This JSON contains a number JavaScript cannot safely represent. Quote large identifiers as strings.",
      time: "Use an IANA zone (Europe/Madrid) or integer Unix seconds, within years 0000–9999.",
      bytes:
        "Use bytes 1 GiB GB. Units: B, kB, MB, GB, TB, KiB, MiB, GiB, TiB (case-sensitive). Non-negative decimal value, up to 18 integer and 6 fractional digits; no commas or exponents.",
      base: "Use base ff 16 10. Choose bases 2–36 and up to 256 valid digits, with optional + or -; no 0x/0b prefixes or fractions.",
      contrast:
        "Use contrast #1a1a2e #ffffff. Provide exactly two opaque hex colors with # and 3 or 6 digits.",
      cron: "Use five fields: minute hour day-of-month month day-of-week, e.g. cron */15 9-17 * * mon-fri. Steps apply to * or a range; ?, L, W and # are not supported.",
      cron_range:
        "A value is outside its field (minute 0–59, hour 0–23, day 1–31, month 1–12, weekday 0–7), a range runs backwards or a step is 0.",
      cron_seconds:
        "Six fields look like a Quartz or Spring schedule with seconds. Drop the seconds field to use five cron fields.",
      cron_macro:
        "Use @yearly, @annually, @monthly, @weekly, @daily, @midnight or @hourly. @reboot is not a time schedule.",
      nines:
        "Use a target above 0 and up to 100, with up to 6 decimals, e.g. nines 99.95.",
      jwt: "Use jwt <header.payload.signature>: Base64URL segments, a JSON header and no spaces, up to 8,192 characters.",
      rate: "Use rate 5 TB/day or rate 1200000 events/hour. Periods: s, min, h, day, week, month, year. Byte units: B, kB, MB, GB, TB, KiB, MiB, GiB, TiB; no bits.",
      failed: "The command could not complete. Try help <command>.",
    },
  },
  es: {
    title: "Caja de herramientas",
    subtitle:
      "Busca un término o ejecuta una utilidad local. Todo corre en tu navegador.",
    tabs: "Vistas de la consola",
    glossary: "Glosario",
    terminal: "CLI",
    close: "Cerrar consola",
    copy: "Copiar salida",
    copied: "Copiado al portapapeles.",
    copyError:
      "No se pudo copiar. Selecciona el texto para copiarlo manualmente.",
    command: "Comando de la CLI",
    runCommand: "Ejecutar comando",
    output: "Salida de la terminal",
    welcome:
      "Utilidades locales para ingeniería: caída permitida por un SLO, cron, JWT, subredes, hashes y más. Escribe help.",
    terminalHint:
      "help | intro | Tab completa | ↑ ↓ historial | Ctrl+L limpia | Escape cierra",
    unknown: "Comando desconocido. ¿Quisiste decir:",
    notShell:
      "Esto no es una shell: ejecuta algunas utilidades locales. Escribe help para verlas.",
    usage: "Uso:",
    example: "Prueba:",
    useExample: "Insertar ejemplo",
    exampleReady: "Ejemplo insertado. Pulsa Enter para ejecutarlo.",
    acceptSuggestion:
      "Flecha derecha acepta la sugerencia tenue; Enter ejecuta el comando.",
    empty: "No hay comandos en esta sesión.",
    utilityNote:
      "Ejecución local, salvo ping (3 peticiones HTTP al mismo origen). No se envían datos a servicios de IP ni de IA. El historial permanece en esta pestaña; no pegues secretos. Sin comillas ni expansión de shell; se conservan los espacios finales del texto.",
    commandNotes: {
      ping: "Mide hasta recibir las cabeceras HTTP, incluida la sobrecarga del navegador y la conexión; no es ICMP, ancho de banda ni disponibilidad. Solo este origen, nunca hosts arbitrarios. Escape cancela.",
      ip: "Solo aritmética IPv4, no consulta tu IP pública. /31 supone un enlace punto a punto; /32 es una ruta de host. Las reservas del proveedor y los rangos especiales pueden reducir las direcciones utilizables.",
      hash: "Resumen SHA-256, no cifrado ni almacenamiento de contraseñas.",
      base64:
        "Texto UTF-8, no archivos binarios. Base64 es codificación, no cifrado.",
      url: "Un componente de URI; no valida URL. Al decodificar, + se conserva (no es codificación de formulario).",
      json: "Usa la precisión numérica de JavaScript. Rechaza enteros inseguros y números no finitos; las claves duplicadas conservan su último valor.",
      time: "Sin argumento: tu reloj local. Acepta una zona IANA o segundos Unix enteros (no milisegundos); fechas entre los años 0000 y 9999.",
      bytes:
        "B significa bytes, no bits. kB/MB/GB/TB usan potencias de 1.000; KiB/MiB/GiB/TiB, de 1.024. Las unidades distinguen mayúsculas. Omite el destino para compararlas todas. Usa punto decimal, hasta 18 dígitos enteros y 6 decimales. ≈ indica redondeo a 12 decimales.",
      base: "Las bases 2–36 usan dígitos 0–9 y letras a–z. Hasta 256 dígitos, con signo + o - opcional. No se interpretan prefijos ni exponentes: cada carácter es un dígito de la base elegida. Sin separadores ni fracciones. La aritmética entera conserva la precisión con BigInt.",
      contrast:
        "Solo colores sRGB opacos #RGB o #RRGGBB; sin alfa, degradados ni imágenes. Texto grande: al menos 18 pt, o 14 pt en negrita. Los umbrales se comparan sin redondear; la salida muestra 3 decimales. Evalúa dos colores, no la conformidad WCAG completa.",
      cron: "Campos de Vixie cron: minuto, hora, día del mes, mes y día de la semana (0 o 7 es domingo). Admite *, listas, rangos, pasos sobre * o un rango, nombres y macros como @daily. Si ambos campos de día están restringidos, basta con que coincida uno. Las ejecuciones se muestran en UTC, la zona por defecto de GitHub Actions; un planificador con horario de verano puede saltar o repetir horas locales.",
      nines:
        "Los presupuestos de tiempo suponen que cada segundo del periodo se mide y cuenta. Un SLO por solicitudes cuenta solicitudes fallidas, y el mantenimiento planificado cuenta salvo que el SLO lo excluya. Meses de 30 días, trimestres de 90 y años de 365.",
      jwt: "Se decodifica localmente; no se envía nada. La firma NO se verifica, así que cualquiera podría haber escrito estos claims. Las horas están en UTC. Aun así, evita pegar tokens reales de producción.",
      rate: "Un promedio uniforme en el periodo: los picos, los lotes, los reintentos y la compresión cambian lo que hay que aprovisionar. Las unidades de bytes distinguen mayúsculas (B es byte); una palabra en minúsculas etiqueta eventos. Meses de 30 días.",
    },
    subnet: [
      "Dirección",
      "Red",
      "Máscara",
      "Broadcast",
      "Direcciones",
      "Capacidad de hosts",
      "Rango de hosts",
    ],
    notApplicable: "No aplica",
    pingStart: "HTTP HEAD · 3 peticiones · 3 s de espera máxima por petición",
    pingFailed: "La petición falló o agotó el tiempo de espera.",
    pingCancelled: "Ping cancelado.",
    introOpened: "La intro se reproduce sobre la consola. Escape la cierra.",
    pingSummary: "correctas",
    pingStats: "mín. / media / máx.",
    localClock: "Hora",
    unixSeconds: "Segundos Unix",
    cronFields: ["Minuto", "Hora", "Día del mes", "Mes", "Día de la semana"],
    cronEvery: "todos",
    cronMacro: "equivale a",
    cronEither:
      "Se ejecuta los días que coinciden con el día del mes o con el día de la semana.",
    cronNext: "Próximas ejecuciones · UTC → tu reloj",
    cronNever:
      "Ninguna ejecución en los próximos cinco años. Revisa fechas imposibles como el 30 de febrero.",
    ninesTarget: "Objetivo",
    ninesPeriods: {
      day: "Por día",
      week: "Por semana",
      month: "Por 30 días",
      quarter: "Por 90 días",
      year: "Por año",
    },
    ninesRequests: "Fallos por millón de solicitudes",
    jwtLabels: {
      kind: "Tipo",
      jws: "Firmado (JWS), firma sin verificar",
      jwe: "Cifrado (JWE): solo la cabecera es legible",
      alg: "Algoritmo",
      header: "Cabecera",
      payload: "Payload",
      claims: "Claims registrados",
      unsigned: "Token sin firma (alg none o firma vacía): trata sus claims como entrada no confiable.",
      expired: "caducado",
      valid: "aún no caducado",
      past: "en el pasado",
      future: "en el futuro",
    },
    ratePeriods: {
      second: "Por segundo",
      minute: "Por minuto",
      hour: "Por hora",
      day: "Por día",
      month: "Por 30 días",
    },
    baseLabel: "Base",
    contrastLabels: [
      "Color del texto",
      "Fondo",
      "Relación de contraste",
      "AA · texto normal (4,5:1)",
      "AA · texto grande (3:1)",
      "AAA · texto normal (7:1)",
      "AAA · texto grande (4,5:1)",
    ],
    contrastMeets: "Alcanza el umbral",
    contrastBelow: "Por debajo del umbral",
    utilityErrors: {
      ip: "Usa una dirección IPv4 o CIDR válida, p. ej. ip 192.168.10.42/24. Este comando no descubre tu IP pública.",
      uuid: "Elige entre 1 y 10 UUID, p. ej. uuid 3.",
      crypto:
        "Web Crypto no está disponible. Abre la página con HTTPS o en localhost.",
      text_length: "Escribe texto después del comando, hasta 2.200 caracteres.",
      base64:
        "Usa base64 encode <texto> o base64 decode <Base64 UTF-8 válido>.",
      url: "Usa url encode <texto> o url decode <UTF-8 válido codificado con porcentajes>.",
      json: "JSON no válido. Usa comillas dobles en claves y cadenas, sin comas finales.",
      json_size:
        "El JSON formateado superaría 16.000 caracteres. Usa un valor menor o con menos niveles.",
      json_number:
        "Este JSON contiene un número que JavaScript no puede representar con seguridad. Usa cadenas para identificadores grandes.",
      time: "Usa una zona IANA (Europe/Madrid) o segundos Unix enteros, entre los años 0000 y 9999.",
      bytes:
        "Usa bytes 1 GiB GB. Unidades: B, kB, MB, GB, TB, KiB, MiB, GiB, TiB (distinguen mayúsculas). Valor decimal no negativo, hasta 18 dígitos enteros y 6 decimales; sin comas ni exponentes.",
      base: "Usa base ff 16 10. Elige bases 2–36 y hasta 256 dígitos válidos, con + o - opcional; sin prefijos 0x/0b ni fracciones.",
      contrast:
        "Usa contrast #1a1a2e #ffffff. Escribe exactamente dos colores hexadecimales opacos con # y 3 o 6 dígitos.",
      cron: "Usa cinco campos: minuto hora día-del-mes mes día-de-la-semana, p. ej. cron */15 9-17 * * mon-fri. Los pasos se aplican a * o a un rango; no se admiten ?, L, W ni #.",
      cron_range:
        "Un valor está fuera de su campo (minuto 0–59, hora 0–23, día 1–31, mes 1–12, día de la semana 0–7), un rango va al revés o un paso es 0.",
      cron_seconds:
        "Seis campos parecen una programación de Quartz o Spring con segundos. Quita el campo de segundos para usar los cinco campos de cron.",
      cron_macro:
        "Usa @yearly, @annually, @monthly, @weekly, @daily, @midnight o @hourly. @reboot no es una programación horaria.",
      nines:
        "Usa un objetivo mayor que 0 y hasta 100, con hasta 6 decimales, p. ej. nines 99.95.",
      jwt: "Usa jwt <cabecera.payload.firma>: segmentos Base64URL, una cabecera JSON y sin espacios, hasta 8.192 caracteres.",
      rate: "Usa rate 5 TB/day o rate 1200000 eventos/hora. Periodos: s, min, h, día, semana, mes, año. Unidades de bytes: B, kB, MB, GB, TB, KiB, MiB, GiB, TiB; sin bits.",
      failed: "El comando no pudo completarse. Prueba help <comando>.",
    },
  },
};

let instance;
let failureModule;
// Distinct values per cron field; weekday 7 is folded into 0.
const CRON_SIZES = [60, 24, 31, 12, 7];
const toolLoads = new WeakMap();

function loadTool(id, loader, initialize, locale) {
  const host = document.getElementById(id);
  if (!host || !host.getClientRects().length || host.dataset.initialized || toolLoads.has(host)) return;
  const notice = element("p", { class: "tool-load-status", role: "status" });
  host.append(notice);
  const load = () => {
    notice.textContent = locale === "es" ? "Cargando herramienta…" : "Loading tool…";
    const pending = loader().then((module) => {
      if (host.isConnected) { notice.remove(); initialize(module); }
    }).catch((error) => {
      console.error(error);
      if (!host.isConnected) return;
      notice.textContent = locale === "es" ? "No se pudo cargar la herramienta. " : "The tool could not be loaded. ";
      const retry = button(locale === "es" ? "Reintentar" : "Try again", { class: "tool-button" });
      retry.addEventListener("click", load);
      notice.append(retry);
    });
    toolLoads.set(host, pending);
  };
  load();
}

export function mount({ root, locale }) {
  const t = strings[locale] || strings.en;
  if (!instance) instance = createConsole(root, locale, t);
  loadTool("failure-lab", () => import("./failure.js"), (module) => {
    failureModule = module;
    module.setupFailureLab(locale);
  }, locale);
  loadTool("interactive-table-planner", () => import("./decision-tools.js"), (module) => module.setupDecisionTools(locale), locale);
  for (const id of ["interactive-agent-run", "interactive-eval-stats"])
    loadTool(id, () => import("./ai-tools.js"), (module) => module.setupAiTools(locale), locale);
  return instance;
}

function createConsole(root, locale, t) {
  let returnFocus;
  let termBusy = false;
  let pingController;
  let historyIndex = 0;
  let draft = "";
  const history = [];

  const dialog = element("dialog", {
    class: "console-window",
    id: "landerox-console-modal",
    "aria-labelledby": "console-title",
    "aria-describedby": "console-subtitle",
  });
  const header = element("div", { class: "console-header" });
  const identity = element("div", { class: "console-identity" });
  const title = element("div");
  title.append(
    element("strong", { id: "console-title" }, t.title),
    element("p", { id: "console-subtitle" }, t.subtitle),
  );
  identity.append(title);
  const close = button("×", {
    class: "console-icon-button",
    "aria-label": t.close,
    title: t.close,
  });
  close.addEventListener("click", () => dialog.close());
  header.append(identity, close);

  const bar = element("div", { class: "console-toolbar" });
  const tablist = element("div", {
    class: "console-nav-tabs",
    role: "tablist",
    "aria-label": t.tabs,
  });
  const tabs = {};
  const panels = {};
  for (const [name, label] of [
    ["glossary", t.glossary],
    ["term", t.terminal],
  ]) {
    tabs[name] = button(label, {
      class: "console-tab-btn",
      role: "tab",
      id: `tab-btn-${name}`,
      "aria-controls": `tab-content-${name}`,
      "aria-selected": String(name === "glossary"),
      tabindex: name === "glossary" ? "0" : "-1",
    });
    panels[name] = element("section", {
      class: "console-tab-content",
      role: "tabpanel",
      id: `tab-content-${name}`,
      "aria-labelledby": `tab-btn-${name}`,
    });
    panels[name].hidden = name !== "glossary";
    tabs[name].addEventListener("click", () => {
      selectTab(name);
      // Typing right after a click must reach the panel, not the page shortcuts.
      if (name === "term") termInput.focus({ preventScroll: true });
      else glossary.focus();
    });
    tabs[name].addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? "glossary"
          : event.key === "End"
            ? "term"
            : name === "glossary"
              ? "term"
              : "glossary";
      selectTab(next);
      tabs[next].focus();
    });
    tablist.append(tabs[name]);
  }
  const copy = button(t.copy, { class: "console-text-button" });
  copy.hidden = true;
  bar.append(tablist, copy);

  const glossary = createGlossary(panels.glossary, root, locale);

  const termScreen = element("div", {
    class: "term-screen",
    id: "term-screen",
    role: "log",
    "aria-label": t.output,
    "aria-relevant": "additions",
    tabindex: "0",
  });
  const termForm = element("form", { class: "term-input-line" });
  const termInput = element("input", {
    class: "term-input",
    id: "term-input",
    type: "text",
    "aria-label": t.command,
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
    // Long enough for a large JWT; text commands keep their own 2,200 limit.
    maxlength: "8200",
    enterkeyhint: "go",
    "aria-describedby": "term-hint term-completion-hint",
  });
  const inputWrap = element("div", { class: "term-input-wrap" });
  let composing = false;
  const ghost = element("div", { class: "term-ghost", "aria-hidden": "true" });
  inputWrap.append(ghost, termInput);
  const completionHint = element(
    "span",
    { class: "visually-hidden", id: "term-completion-hint" },
    t.acceptSuggestion,
  );
  termForm.append(
    element(
      "span",
      { class: "term-prompt", "aria-hidden": "true" },
      "visitor ~ $",
    ),
    inputWrap,
    element(
      "button",
      {
        type: "submit",
        class: "console-icon-button",
        "aria-label": t.runCommand,
      },
      "↵",
    ),
  );
  panels.term.append(
    termScreen,
    element("p", { class: "term-hint", id: "term-hint" }, t.terminalHint),
    termForm,
    completionHint,
  );
  dialog.append(header, bar, panels.glossary, panels.term);
  document.body.append(dialog);

  let currentTab = "glossary";
  function selectTab(name) {
    currentTab = name;
    for (const key of ["glossary", "term"]) {
      tabs[key].setAttribute("aria-selected", String(key === name));
      tabs[key].tabIndex = key === name ? 0 : -1;
      panels[key].hidden = key !== name;
    }
    copy.hidden = name !== "term";
    if (name === "glossary") glossary.load();
    if (name !== "term") pingController?.abort();
  }

  // The header control passes no tab: reopen on the one used last.
  function open(name = currentTab) {
    failureModule?.pauseFailureLab();
    selectTab(name);
    if (!dialog.open) {
      returnFocus = document.activeElement;
      dialog.showModal();
      document.body.classList.add("console-open");
    }
    if (name === "glossary") glossary.focus();
    else termInput.focus({ preventScroll: true });
  }

  // The theme's single-key shortcuts (n, p, / …) listen on window: from a
  // focused tab or link in this dialog they would navigate the page behind it.
  dialog.addEventListener("keydown", (event) => {
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1)
      event.stopPropagation();
  });
  dialog.addEventListener("close", () => {
    pingController?.abort();
    document.body.classList.remove("console-open");
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  let backdropDown = false;
  dialog.addEventListener("pointerdown", (event) => {
    backdropDown = event.target === dialog;
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && backdropDown) dialog.close();
    const anchor = event.target.closest("a[href]");
    if (anchor && new window.URL(anchor.href).origin === window.location.origin)
      dialog.close();
  });

  function trimLog(log, limit) {
    while (log.children.length > limit) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  function print(text, className = "") {
    const line = element("div", { class: `term-line ${className}` }, text);
    termScreen.append(line);
    trimLog(termScreen, 120);
    return line;
  }
  print(t.welcome, "term-line--accent");

  function fillCommand(value) {
    if (termBusy || composing) return;
    termInput.value = value;
    termInput.focus();
    termInput.setSelectionRange(value.length, value.length);
    refreshGhost();
    copyStatus.textContent = t.exampleReady;
  }

  function refreshGhost() {
    const raw = termInput.value;
    const suggestion = suggestCommand(raw, history);
    ghost.replaceChildren();
    if (
      termBusy ||
      composing ||
      document.activeElement !== termInput ||
      termInput.selectionStart !== raw.length ||
      termInput.selectionEnd !== raw.length ||
      !suggestion
    )
      return;
    const text = element("span", { class: "term-ghost-text" });
    text.append(
      element("span", { class: "term-ghost-prefix" }, raw),
      document.createTextNode(suggestion.slice(raw.length)),
    );
    ghost.append(text);
    ghost.scrollLeft = termInput.scrollLeft;
  }

  function printPairs(entries) {
    const line = print("", "term-line--structured");
    const list = element("dl", { class: "term-values" });
    for (const [name, value] of entries) {
      const row = element("div");
      row.append(element("dt", {}, name), element("dd", {}, String(value)));
      list.append(row);
    }
    line.append(list);
  }

  function help(name) {
    if (name && !Object.hasOwn(COMMANDS, name)) {
      // Suggest the commands that share its first letters, as for a bare typo.
      const near = completions(name.slice(0, 2)).map((command) => `help ${command}`);
      print(`${t.unknown} ${near.length ? near.join(", ") : "help"}?`, "term-line--error");
      return;
    }
    const output = print("", "term-line--structured");
    if (!name) {
      const list = element("dl", { class: "term-help-summary" });
      for (const [command, [, en, es]] of Object.entries(COMMANDS)) {
        const row = element("div");
        const label = element("dt");
        const detail = button(command, { class: "term-help-link" });
        detail.addEventListener("click", () => fillCommand(`help ${command}`));
        label.append(detail);
        row.append(label, element("dd", {}, locale === "es" ? es : en));
        list.append(row);
      }
      output.append(list);
      print(locale === "es" ? "help <comando> muestra el uso, un ejemplo y sus límites." : "help <command> shows usage, an example and its limits.", "term-line--dim");
      return;
    }
    // Detailed help for one command; the summary above covers all of them.
    const [usage, en, es] = COMMANDS[name];
    const commands = element("div", { class: "term-command-list" });
    const card = element("div", { class: "term-command" });
    const example = button("", {
      class: "term-example",
      "aria-label": `${t.useExample}: ${COMMAND_EXAMPLES[name]}`,
    });
    example.append(
      element("span", {}, t.example),
      element("code", {}, COMMAND_EXAMPLES[name]),
    );
    example.addEventListener("click", () => fillCommand(COMMAND_EXAMPLES[name]));
    card.append(
      element("code", { class: "term-syntax" }, usage),
      element("p", {}, locale === "es" ? es : en),
      example,
    );
    if (Object.hasOwn(t.commandNotes, name))
      card.append(
        element("p", { class: "term-line--dim" }, t.commandNotes[name]),
      );
    commands.append(card);
    output.append(commands);
    print(t.utilityNote, "term-line--dim");
  }

  async function ping() {
    const controller = new window.AbortController();
    pingController = controller;
    const durations = [];
    const target = new window.URL("assets/images/favicon.svg", root);
    print(
      `${t.pingStart}\n${target.origin}\n${t.commandNotes.ping}`,
      "term-line--dim",
    );
    try {
      for (let i = 1; i <= 3; i++) {
        if (controller.signal.aborted) break;
        const request = new window.AbortController();
        const abort = () => request.abort();
        controller.signal.addEventListener("abort", abort, { once: true });
        const timeout = window.setTimeout(abort, 3000);
        const start = window.performance.now();
        try {
          const response = await fetch(target.href, {
            method: "HEAD",
            mode: "same-origin",
            credentials: "omit",
            cache: "no-store",
            redirect: "error",
            referrerPolicy: "no-referrer",
            signal: request.signal,
          });
          if (!response.ok) throw new Error("ping_http");
          const elapsed = window.performance.now() - start;
          durations.push(elapsed);
          print(`${i}/3  HTTP ${response.status}  ${elapsed.toFixed(1)} ms`);
        } catch {
          if (!controller.signal.aborted)
            print(`${i}/3  ${t.pingFailed}`, "term-line--error");
        } finally {
          window.clearTimeout(timeout);
          controller.signal.removeEventListener("abort", abort);
        }
      }
      if (controller.signal.aborted) print(t.pingCancelled, "term-line--dim");
      else {
        print(`${durations.length}/3 ${t.pingSummary}`);
        if (durations.length)
          print(
            `${t.pingStats}: ${[Math.min(...durations), durations.reduce((a, b) => a + b, 0) / durations.length, Math.max(...durations)].map((value) => value.toFixed(1)).join(" / ")} ms`,
          );
      }
    } finally {
      pingController = null;
    }
  }

  const monthName = new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  });
  const weekdayName = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  function describeCronField(values, index) {
    if (values.length === CRON_SIZES[index]) return t.cronEvery;
    // 2026-01-04 is a Sunday, so day N of that week is weekday N.
    const label = (value) =>
      index === 3
        ? monthName.format(Date.UTC(2026, value - 1, 1))
        : index === 4
          ? weekdayName.format(Date.UTC(2026, 0, 4 + value))
          : String(value);
    const groups = [];
    for (const value of values) {
      const last = groups.at(-1);
      if (last && value === last[1] + 1) last[1] = value;
      else groups.push([value, value]);
    }
    return groups
      .flatMap(([start, end]) =>
        end - start >= 2
          ? [`${label(start)}–${label(end)}`]
          : start === end
            ? [label(start)]
            : [label(start), label(end)],
      )
      .join(", ");
  }

  const seconds = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  // Exact decimal strings (bytes, rate) with the locale's decimal separator;
  // Number formatting would round digits the arithmetic kept.
  const decimalText = (value) =>
    locale === "es" ? value.replace(".", ",") : value;
  function formatDuration(total) {
    if (total === 0) return "0 s";
    if (total < 1) return `${seconds.format(total * 1000)} ms`;
    const parts = [];
    let rest = Math.round(total * 10) / 10;
    for (const [unit, size] of [["d", 86400], ["h", 3600], ["min", 60]]) {
      const amount = Math.floor(rest / size);
      if (amount) parts.push(`${amount} ${unit}`);
      rest = Math.round((rest - amount * size) * 10) / 10;
    }
    if (rest) parts.push(`${seconds.format(rest)} s`);
    return parts.join(" ");
  }

  async function execute(raw) {
    const echo = raw.trimStart().slice(0, 8200);
    const { command, argument } = parseCommand(echo);
    if (!command || termBusy) return;
    if (history.at(-1) !== echo) history.push(echo);
    if (history.length > 100) history.shift();
    historyIndex = history.length;
    draft = "";
    termInput.value = "";
    const commandLine = print(`visitor ~ $ ${echo}`, "term-line--cmd");
    termBusy = true;
    termInput.readOnly = true;
    refreshGhost();
    try {
      if (!Object.hasOwn(COMMANDS, command)) {
        // ls, cd or whoami get an explanation; a near miss gets suggestions.
        const near = completions(command.slice(0, 2));
        print(
          near.length ? `${t.unknown} ${near.join(", ")}?` : t.notShell,
          "term-line--error",
        );
      } else if (
        argument.trim() &&
        ["ping", "intro", "history", "clear", "exit"].includes(command)
      ) {
        print(`${t.usage} ${COMMANDS[command][0]}`, "term-line--error");
      } else if (command === "help") {
        const target = parseCommand(argument);
        if (target.argument.trim())
          print(`${t.usage} ${COMMANDS.help[0]}`, "term-line--error");
        else help(target.command);
      } else if (command === "clear") termScreen.replaceChildren();
      else if (command === "exit") dialog.close();
      else if (command === "intro") {
        // A second modal above this one; closing it returns focus here.
        print(t.introOpened, "term-line--dim");
        openIntro();
      }
      else if (command === "history")
        print(
          history
            .map((item, i) => `${String(i + 1).padStart(3)}  ${item}`)
            .join("\n") || t.empty,
        );
      else if (command === "ping") await ping();
      else if (command === "uuid") print(createUUIDs(argument).join("\n"));
      else if (command === "hash") print(await hashText(argument));
      else if (["base64", "url", "json"].includes(command))
        print(transformText(command, argument));
      else if (command === "bytes") {
        printPairs(
          convertBytes(argument).map(({ unit, value, approximate }) => [
            unit,
            `${approximate ? "≈ " : ""}${decimalText(value)}`,
          ]),
        );
        print(t.commandNotes.bytes, "term-line--dim");
      } else if (command === "base") {
        const result = convertBase(argument);
        printPairs([
          [`${t.baseLabel} ${result.from}`, result.input],
          [`${t.baseLabel} ${result.to}`, result.value],
        ]);
      } else if (command === "contrast") {
        const result = inspectContrast(argument);
        const ratio = new Intl.NumberFormat(locale, {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(result.ratio);
        const values = [
          result.foreground,
          result.background,
          `${ratio}:1`,
          ...[
            result.aaText,
            result.aaLargeText,
            result.aaaText,
            result.aaaLargeText,
          ].map((meets) => (meets ? t.contrastMeets : t.contrastBelow)),
        ];
        printPairs(
          values.map((value, index) => [t.contrastLabels[index], value]),
        );
        print(t.commandNotes.contrast, "term-line--dim");
      } else if (command === "ip") {
        const net = inspectSubnet(argument);
        const values = [
          net.address,
          `${net.network}/${net.prefix}`,
          net.mask,
          net.broadcast || t.notApplicable,
          net.count,
          net.hosts,
          `${net.firstHost} – ${net.lastHost}`,
        ];
        printPairs(values.map((value, i) => [t.subnet[i], value]));
        print(t.commandNotes.ip, "term-line--dim");
      } else if (command === "cron") {
        const schedule = inspectCron(argument);
        if (schedule.macro)
          print(`${schedule.macro} ${t.cronMacro} ${schedule.expression}`, "term-line--dim");
        printPairs(
          schedule.fields.map((values, index) => [
            t.cronFields[index],
            describeCronField(values, index),
          ]),
        );
        if (schedule.either) print(t.cronEither, "term-line--dim");
        if (schedule.runs.length) {
          print(t.cronNext);
          const clock = new Intl.DateTimeFormat(locale, {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          });
          printPairs(
            schedule.runs.map((run) => [
              `${run.toISOString().slice(0, 16).replace("T", " ")} UTC`,
              clock.format(run),
            ]),
          );
        } else print(t.cronNever, "term-line--error");
        print(t.commandNotes.cron, "term-line--dim");
      } else if (command === "nines") {
        const budget = inspectAvailability(argument);
        const count = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
        printPairs([
          [
            t.ninesTarget,
            `${new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(budget.target)}%`,
          ],
          ...budget.periods.map(({ name, seconds }) => [
            t.ninesPeriods[name],
            formatDuration(seconds),
          ]),
          [t.ninesRequests, count.format(budget.perMillion)],
        ]);
        print(t.commandNotes.nines, "term-line--dim");
      } else if (command === "rate") {
        const result = inspectRate(argument);
        const shown = ({ value, approximate, unit }) =>
          `${approximate ? "≈ " : ""}${decimalText(value)} ${unit}`;
        printPairs(
          result.rows.map((row) => [
            t.ratePeriods[row.period],
            result.bytes
              ? `${shown(row.decimal)}  (${shown(row.binary)})`
              : `${row.count.approximate ? "≈ " : ""}${decimalText(row.count.value)}${result.label ? ` ${result.label}` : ""}`,
          ]),
        );
        print(t.commandNotes.rate, "term-line--dim");
      } else if (command === "jwt") {
        const token = inspectJwt(argument);
        const labels = t.jwtLabels;
        printPairs([
          [labels.kind, token.kind === "jwe" ? labels.jwe : labels.jws],
          [labels.alg, token.alg || "—"],
        ]);
        if (token.unsigned) print(labels.unsigned, "term-line--error");
        print(labels.header);
        print(JSON.stringify(token.header, null, 2));
        if (token.kind === "jws") {
          print(labels.payload);
          print(
            typeof token.payload === "string"
              ? token.payload
              : JSON.stringify(token.payload, null, 2),
          );
          if (token.claims.length) {
            print(labels.claims);
            printPairs(
              token.claims.map((claim) => [
                claim.name,
                claim.iso
                  ? `${claim.value} · ${claim.iso} · ${labels[claim.state]}`
                  : typeof claim.value === "string"
                    ? claim.value
                    : JSON.stringify(claim.value),
              ]),
            );
          }
        }
        print(t.commandNotes.jwt, "term-line--dim");
      } else if (command === "time") {
        const clock = inspectTime(argument);
        const formatted = new Intl.DateTimeFormat(locale, {
          timeZone: clock.zone,
          dateStyle: "full",
          timeStyle: "long",
        }).format(clock.date);
        printPairs([
          ["ISO 8601", clock.iso],
          [t.unixSeconds, clock.seconds],
          [`${t.localClock} (${clock.zone})`, formatted],
        ]);
      }
    } catch (error) {
      print(
        t.utilityErrors[error.message] || t.utilityErrors.failed,
        "term-line--error",
      );
    } finally {
      termBusy = false;
      termInput.readOnly = false;
      refreshGhost();
      termScreen.scrollTop =
        command === "help" && commandLine.isConnected
          ? termScreen.scrollTop +
            commandLine.getBoundingClientRect().top -
            termScreen.getBoundingClientRect().top -
            12
          : termScreen.scrollHeight;
    }
  }

  termForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (composing) return;
    execute(termInput.value);
  });
  termInput.addEventListener("keydown", (event) => {
    if (event.isComposing || composing || termBusy) return;
    if (
      event.key === "ArrowRight" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.shiftKey &&
      termInput.selectionStart === termInput.value.length &&
      termInput.selectionEnd === termInput.value.length
    ) {
      const suggestion = suggestCommand(termInput.value, history);
      if (suggestion) {
        event.preventDefault();
        fillCommand(suggestion);
      }
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === history.length) draft = termInput.value;
      historyIndex = Math.max(
        0,
        Math.min(
          history.length,
          historyIndex + (event.key === "ArrowUp" ? -1 : 1),
        ),
      );
      termInput.value =
        historyIndex === history.length ? draft : history[historyIndex] || "";
      termInput.setSelectionRange(
        termInput.value.length,
        termInput.value.length,
      );
    } else if (
      event.key === "Tab" &&
      !event.shiftKey &&
      termInput.value &&
      termInput.selectionStart === termInput.value.length &&
      termInput.selectionEnd === termInput.value.length
    ) {
      const options = completions(termInput.value);
      if (options.length === 1 && options[0] !== termInput.value) {
        event.preventDefault();
        termInput.value = options[0];
      }
    } else if (event.key.toLowerCase() === "l" && event.ctrlKey) {
      event.preventDefault();
      termScreen.replaceChildren();
    }
    refreshGhost();
  });
  termInput.addEventListener("input", (event) => {
    if (!event.isComposing) refreshGhost();
    else ghost.replaceChildren();
  });
  termInput.addEventListener("compositionstart", () => {
    composing = true;
    refreshGhost();
  });
  termInput.addEventListener("compositionend", () => {
    composing = false;
    refreshGhost();
  });
  for (const event of ["focus", "blur", "click", "keyup", "scroll"])
    termInput.addEventListener(event, refreshGhost);
  refreshGhost();
  const copyStatus = element("span", {
    class: "visually-hidden",
    role: "status",
  });
  bar.append(copyStatus);
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(termScreen.innerText);
      copyStatus.textContent = t.copied;
    } catch {
      copyStatus.textContent = t.copyError;
    }
  });

  return {
    open,
    close: () => {
      if (dialog.open) dialog.close();
    },
    disposeTools: () => failureModule?.disposeFailureLab(),
  };
}
