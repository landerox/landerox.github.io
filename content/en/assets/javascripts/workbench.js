/** On-demand native dialog, utility CLI and local engineering worksheets. */
import {
  COMMANDS,
  COMMAND_EXAMPLES,
  parseCommand,
  completions,
  suggestCommand,
  estimateMemory,
  MEMORY_PRESETS,
  compareMemory,
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
import { element, button, widgetHeader } from "./workbench-dom.js";
import { toolHash } from "./share-core.js";
import { useScenario, shareControl } from "./share.js";
import { createGlossary } from "./glossary.js";

const strings = {
  en: {
    title: "Technical desk",
    subtitle: "Look up a concept. Try a command. Learn by exploring.",
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
    welcome: "Browse the work. Search the sources. Explore the local tools.",
    terminalHint:
      "help | Tab completes | ↑ ↓ history | Ctrl+L clears | Escape closes",
    unknown: "Unknown command. Type help. Suggestions:",
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
    openSlo: "Open this target in the SLO & error budget tool →",
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
    calculator: "Plan inference memory",
    local: "Runs locally",
    estimate: "Planning estimate",
    calculatorNote:
      "Resident weights + KV cache for the full-attention layers + fixed linear-attention state + an explicit reserve. Presets load the published Qwen3.8 architectures.",
    parameters: "Total parameters (billions)",
    activeParameters: "Active parameters per token (billions)",
    highPrecision: "Parameters kept at 16 bit when quantized (billions)",
    bits: "Weight precision",
    layers: "Full-attention layers (keep a KV cache)",
    linearLayers: "Linear-attention layers (fixed state)",
    heads: "KV heads",
    dimension: "Head dimension",
    linearHeads: "Linear-attention value heads",
    linearKeyDim: "Linear key head dimension",
    linearValueDim: "Linear value head dimension",
    statePrecision: "Linear state precision",
    tokens: "Tokens per request",
    batch: "Concurrent requests",
    cachePrecision: "KV cache precision",
    overhead: "Planning reserve (%)",
    weights: "Resident weights",
    cache: "KV cache",
    state: "Linear-attention state",
    reserve: "Planning reserve",
    total: "Estimated memory",
    explain: "What these numbers mean",
    kvLine:
      "Each token adds {kv} KiB of KV cache: {layers} full-attention layers × {heads} KV heads × {dim} × 2 (key and value) × {bytes} bytes.",
    stateLine:
      "The {linear} linear-attention layers keep {mib} MiB of state per request, whatever the context length.",
    hybridLine:
      "Hybrid attention: if all {all} layers kept a KV cache, it would need {full} GiB instead of {cache} GiB.",
    moeLine:
      "Mixture of experts: {active}B of {params}B parameters work on each token, yet every expert stays resident. Each generated token reads about {read} GiB of weights, which is what memory bandwidth has to move.",
    precisionLine:
      "The quantized checkpoint keeps {kept}B parameters in BF16 (embeddings, norms, gates and the vision encoder).",
    contextLine:
      "{tokens} tokens exceed the native {context}-token context; extending it changes quality and runtime behavior.",
    archSummary:
      "{all} layers: {layers} full attention + {linear} Gated DeltaNet · {heads} KV heads × {dim} · {context} tokens native · {license}",
    archMoe: " · {active}B active of {params}B",
    kindDense: "dense",
    kindMoe: "MoE",
    assumptions:
      "GiB = 2³⁰ bytes. MoE weights count every resident expert, not only the active ones. Published totals include vision encoders and the multi-token-prediction layer. Not modeled: Flash-Next's sparse-attention indexer, offloading its n-gram embeddings, activations, runtime buffers and per-GPU sharding. Profile before choosing hardware.",
    formula:
      "Weights = (parameters − kept) × bits / 8 + kept × 2 bytes. KV = 2 × full-attention layers × KV heads × head dimension × tokens × requests × KV bytes. State = linear layers × value heads × key dimension × value dimension × state bytes × requests. Reserve applies to their sum.",
    invalidMemory:
      "Check the field's allowed range and step; counts must be whole numbers and reserve must be 0–100%.",
    preset: "Reference architecture",
    custom: "Custom architecture",
    presetNote:
      "Presets load published architectures only; precision, context and requests stay yours. Reviewed in September 2026 from each config.json and the checkpoint metadata. References, not a model ranking.",
    source: "Model card",
    config: "Architecture configuration",
    advanced: "Architecture and planning assumptions",
    scenarioGuide:
      "What does a longer context, more requests or FP8 cost? Save baseline A, change one setting and compare B.",
    saveBaseline: "Use current settings as baseline A",
    baselineSaved:
      "Baseline A updated. Change a setting to compare scenario B.",
    comparison: "Memory comparison · A versus B",
    baseline: "Baseline A",
    current: "Current B",
    difference: "Change",
    component: "Memory component",
    noChange:
      "Both estimates match. Double the tokens to watch the KV cache grow, or switch to FP8 to halve most weights.",
    driver: "Largest component change",
    workloadNote:
      "Tokens include input and generated output resident at once. Lower memory does not imply equal quality or faster inference.",
    baselineSettings: "Baseline A settings",
  },
  es: {
    title: "Espacio técnico",
    subtitle: "Consulta un concepto. Prueba un comando. Aprende explorando.",
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
      "Explora el trabajo. Consulta las fuentes. Prueba las herramientas locales.",
    terminalHint:
      "help | Tab completa | ↑ ↓ historial | Ctrl+L limpia | Escape cierra",
    unknown: "Comando desconocido. Escribe help. Sugerencias:",
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
    openSlo: "Abrir este objetivo en la herramienta SLO y presupuesto de error →",
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
    calculator: "Planifica la memoria de inferencia",
    local: "Ejecución local",
    estimate: "Estimación de planificación",
    calculatorNote:
      "Pesos residentes + caché KV de las capas de atención completa + estado fijo de atención lineal + una reserva explícita. Los ejemplos cargan las arquitecturas publicadas de Qwen3.8.",
    parameters: "Parámetros totales (miles de millones)",
    activeParameters: "Parámetros activos por token (miles de millones)",
    highPrecision: "Parámetros que quedan en 16 bit al cuantizar (miles de millones)",
    bits: "Precisión de pesos",
    layers: "Capas de atención completa (guardan caché KV)",
    linearLayers: "Capas de atención lineal (estado fijo)",
    heads: "Cabezas KV",
    dimension: "Dimensión por cabeza",
    linearHeads: "Cabezas de valor de atención lineal",
    linearKeyDim: "Dimensión de clave lineal por cabeza",
    linearValueDim: "Dimensión de valor lineal por cabeza",
    statePrecision: "Precisión del estado lineal",
    tokens: "Tokens por solicitud",
    batch: "Solicitudes simultáneas",
    cachePrecision: "Precisión de caché KV",
    overhead: "Reserva de planificación (%)",
    weights: "Pesos residentes",
    cache: "Caché KV",
    state: "Estado de atención lineal",
    reserve: "Reserva de planificación",
    total: "Memoria estimada",
    explain: "Qué significan estas cifras",
    kvLine:
      "Cada token añade {kv} KiB de caché KV: {layers} capas de atención completa × {heads} cabezas KV × {dim} × 2 (clave y valor) × {bytes} bytes.",
    stateLine:
      "Las {linear} capas de atención lineal guardan {mib} MiB de estado por petición, sea cual sea la longitud del contexto.",
    hybridLine:
      "Atención híbrida: si las {all} capas guardaran caché KV, necesitaría {full} GiB en vez de {cache} GiB.",
    moeLine:
      "Mezcla de expertos: {active}B de {params}B parámetros trabajan en cada token, pero todos los expertos siguen residentes. Cada token generado lee unos {read} GiB de pesos, que es lo que debe mover el ancho de banda de memoria.",
    precisionLine:
      "El checkpoint cuantizado mantiene {kept}B parámetros en BF16 (embeddings, normalizaciones, compuertas y el codificador de visión).",
    contextLine:
      "{tokens} tokens superan el contexto nativo de {context} tokens; extenderlo cambia la calidad y el comportamiento en ejecución.",
    archSummary:
      "{all} capas: {layers} de atención completa + {linear} Gated DeltaNet · {heads} cabezas KV × {dim} · {context} tokens nativos · {license}",
    archMoe: " · {active}B activos de {params}B",
    kindDense: "denso",
    kindMoe: "MoE",
    assumptions:
      "GiB = 2³⁰ bytes. En MoE se cuentan todos los expertos residentes, no solo los activos. Los totales publicados incluyen codificadores de visión y la capa de predicción multitoken. No se modelan el indexador de atención dispersa de Flash-Next, el offloading de sus embeddings n-grama, activaciones, buffers del motor ni la distribución entre GPU. Mide antes de elegir hardware.",
    formula:
      "Pesos = (parámetros − conservados) × bits / 8 + conservados × 2 bytes. KV = 2 × capas de atención completa × cabezas KV × dimensión × tokens × peticiones × bytes KV. Estado = capas lineales × cabezas de valor × dimensión de clave × dimensión de valor × bytes de estado × peticiones. La reserva se aplica a su suma.",
    invalidMemory:
      "Revisa el rango y paso del campo; los conteos deben ser enteros y la reserva de 0–100%.",
    preset: "Arquitectura de referencia",
    custom: "Arquitectura personalizada",
    presetNote:
      "Los ejemplos cargan solo arquitecturas publicadas; precisión, contexto y peticiones siguen siendo tuyos. Revisión: septiembre de 2026, con cada config.json y los metadatos del checkpoint. Son referencias, no una clasificación de modelos.",
    source: "Ficha del modelo",
    config: "Configuración de arquitectura",
    advanced: "Arquitectura y supuestos de planificación",
    scenarioGuide:
      "¿Cuánto cuesta un contexto más largo, más peticiones o FP8? Guarda la referencia A, cambia un ajuste y compara B.",
    saveBaseline: "Usar ajustes actuales como referencia A",
    baselineSaved:
      "Referencia A actualizada. Cambia un ajuste para comparar el escenario B.",
    comparison: "Comparación de memoria · A frente a B",
    baseline: "Referencia A",
    current: "Actual B",
    difference: "Cambio",
    component: "Componente de memoria",
    noChange:
      "Las estimaciones coinciden. Duplica los tokens para ver crecer la caché KV o cambia a FP8 para reducir a la mitad la mayoría de los pesos.",
    driver: "Mayor cambio por componente",
    workloadNote:
      "Los tokens incluyen la entrada y la salida generada residentes a la vez. Menos memoria no implica igual calidad ni inferencia más rápida.",
    baselineSettings: "Ajustes de la referencia A",
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
  if (document.getElementById("interactive-llm-calculator")?.getClientRects().length) setupCalculator(t);
  loadTool("interactive-sql-sandbox", () => import("./sql.js"), (module) => module.setupSql(locale), locale);
  loadTool("failure-lab", () => import("./failure.js"), (module) => {
    failureModule = module;
    module.setupFailureLab(locale);
  }, locale);
  for (const id of ["interactive-slo-budget", "interactive-schema-diff", "interactive-table-planner"])
    loadTool(id, () => import("./decision-tools.js"), (module) => module.setupDecisionTools(locale), locale);
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
    tabs[name].addEventListener("click", () => selectTab(name));
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

  function selectTab(name) {
    for (const key of ["glossary", "term"]) {
      tabs[key].setAttribute("aria-selected", String(key === name));
      tabs[key].tabIndex = key === name ? 0 : -1;
      panels[key].hidden = key !== name;
    }
    copy.hidden = name !== "term";
    if (name === "glossary") glossary.load();
    if (name !== "term") pingController?.abort();
  }

  function open(name = "glossary") {
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
      print(`${t.unknown} help`, "term-line--error");
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
        print(
          `${t.unknown} ${completions(command.slice(0, 2)).join(", ") || "help"}`,
          "term-line--error",
        );
      } else if (
        argument.trim() &&
        ["ping", "history", "clear", "exit"].includes(command)
      ) {
        print(`${t.usage} ${COMMANDS[command][0]}`, "term-line--error");
      } else if (command === "help") {
        const target = parseCommand(argument);
        if (target.argument.trim())
          print(`${t.usage} ${COMMANDS.help[0]}`, "term-line--error");
        else help(target.command);
      } else if (command === "clear") termScreen.replaceChildren();
      else if (command === "exit") dialog.close();
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
        // Same target, a 30-day window fully measured and no bad minutes yet.
        const link = element("a", {
          href: new window.URL(
            "projects/tools/" +
              toolHash("interactive-slo-budget", [
                ["mode", "time"],
                ["target", String(budget.target)],
                ["window", "30"],
                ["observed", "43200"],
                ["bad", "0"],
              ]),
            root,
          ).href,
        }, t.openSlo);
        print("").append(link);
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

function calculatorHeader(host, title, note, t) {
  host.append(
    widgetHeader(title, t.local),
    element("p", { class: "lab-widget-note" }, note),
  );
}

function setupCalculator(t) {
  const host = document.getElementById("interactive-llm-calculator");
  if (!host || host.dataset.initialized) return;
  host.dataset.initialized = "true";
  host.replaceChildren();
  calculatorHeader(host, t.calculator, t.calculatorNote, t);
  host.append(element("p", { class: "tool-question" }, t.scenarioGuide));
  const lang = document.documentElement.lang;
  const grid = element("div", { class: "calc-grid" });
  const form = element("form", {
    class: "calc-inputs",
    "aria-label": t.calculator,
  });
  const controls = {};
  const presetRow = element("div", { class: "calc-row calc-wide" });
  const preset = element("select", { id: "calc-preset", class: "calc-select" });
  for (const item of MEMORY_PRESETS)
    preset.append(
      element(
        "option",
        { value: item.id },
        `${item.label} · ${item.kind === "moe" ? t.kindMoe : t.kindDense}`,
      ),
    );
  preset.append(element("option", { value: "custom" }, t.custom));
  presetRow.append(
    element("label", { class: "calc-label", for: "calc-preset" }, t.preset),
    preset,
  );
  const presetSummary = element("p", {
    class: "lab-widget-note calc-wide",
    id: "calc-preset-summary",
  });
  form.append(presetRow, presetSummary);
  const architecture = element("details", {
    class: "lab-widget-details calc-wide",
  });
  architecture.append(element("summary", {}, t.advanced));
  const advancedGrid = element("div", { class: "calc-inputs" });
  architecture.append(advancedGrid);
  // Keys a preset writes; editing any of them makes the scenario custom.
  const architectureKeys = [
    "parameters",
    "activeParameters",
    "highPrecisionParameters",
    "layers",
    "linearLayers",
    "kvHeads",
    "headDim",
    "linearHeads",
    "linearKeyDim",
    "linearValueDim",
  ];
  const advancedKeys = [...architectureKeys, "stateBytes", "overhead"];
  const definitions = [
    [
      "bits",
      t.bits,
      [
        [16, "BF16 · 16 bit"],
        [8, "FP8 · 8 bit"],
        [4, "INT4 · 4 bit"],
      ],
    ],
    ["tokens", t.tokens, 32768, 1, 1048576, 1],
    ["concurrency", t.batch, 4, 1, 1024, 1],
    [
      "kvBytes",
      t.cachePrecision,
      [
        [2, "BF16 · 2 bytes"],
        [1, "FP8 · 1 byte"],
      ],
    ],
    ["parameters", t.parameters, 27.78, 0.1, 3000, 0.01],
    ["activeParameters", t.activeParameters, 27.78, 0.1, 3000, 0.01],
    ["highPrecisionParameters", t.highPrecision, 3.08, 0, 3000, 0.01],
    ["layers", t.layers, 16, 0, 256, 1],
    ["linearLayers", t.linearLayers, 48, 0, 256, 1],
    ["kvHeads", t.heads, 4, 1, 256, 1],
    ["headDim", t.dimension, 256, 1, 1024, 1],
    ["linearHeads", t.linearHeads, 48, 0, 512, 1],
    ["linearKeyDim", t.linearKeyDim, 128, 0, 1024, 1],
    ["linearValueDim", t.linearValueDim, 128, 0, 1024, 1],
    [
      "stateBytes",
      t.statePrecision,
      [
        [4, "FP32 · 4 bytes"],
        [2, "BF16 · 2 bytes"],
      ],
    ],
    ["overhead", t.overhead, 20, 0, 100, 1],
  ];
  for (const [name, label, initial, min, max, step] of definitions) {
    const row = element("div", { class: "calc-row" });
    const id = `calc-${name.toLowerCase()}`;
    row.append(element("label", { class: "calc-label", for: id }, label));
    const control = Array.isArray(initial)
      ? element("select", { id, class: "calc-select" })
      : element("input", {
          id,
          class: "calc-select",
          type: "number",
          inputmode: step < 1 ? "decimal" : "numeric",
          min: String(min),
          max: String(max),
          step: String(step),
          value: String(initial),
          required: "",
        });
    if (Array.isArray(initial))
      for (const [value, text] of initial)
        control.append(element("option", { value: String(value) }, text));
    controls[name] = control;
    row.append(control);
    (advancedKeys.includes(name) ? advancedGrid : form).append(row);
  }
  form.append(architecture);
  const presetInfo = element(
    "p",
    { class: "lab-widget-note calc-wide" },
    t.presetNote,
  );
  const presetSource = element("p", { class: "lab-widget-note calc-wide" });
  form.append(presetInfo, presetSource);
  const results = element("div", {
    class: "calc-results",
    role: "region",
    "aria-label": t.estimate,
  });
  const values = {};
  const components = [
    ["weights", t.weights],
    ["cache", t.cache],
    ["state", t.state],
    ["reserve", t.reserve],
  ];
  results.append(element("span", { class: "console-eyebrow" }, t.estimate));
  for (const [key, label] of [["total", t.total], ...components]) {
    const stat = element("div", {
      class: `calc-stat-metric${key === "total" ? " calc-stat-metric--total" : ""}`,
    });
    values[key] = element("output", {
      class: "calc-stat-value",
      id: `calc-${key}-value`,
    });
    stat.append(
      element("span", { class: "calc-stat-label" }, label),
      values[key],
    );
    results.append(stat);
  }
  const status = element("p", { class: "lab-widget-note", role: "status" });
  results.append(status);
  const saveBaseline = button(t.saveBaseline, {
    class: "tool-button",
    id: "calc-save-baseline",
  });
  results.append(saveBaseline);
  // Presets travel as their id; a custom scenario carries every input.
  const scenario = () => {
    const custom = preset.value === "custom";
    return [
      ["preset", preset.value],
      ...definitions
        .map(([key]) => key)
        .filter((key) => custom || !architectureKeys.includes(key))
        .map((key) => [key.toLowerCase(), controls[key].value]),
    ];
  };
  results.append(
    shareControl(
      "interactive-llm-calculator",
      scenario,
      lang.startsWith("es") ? "es" : "en",
    ),
  );
  grid.append(form, results);
  // Worked explanation: each line restates one term of the formula with the
  // current numbers, so the estimate can be followed without the formula.
  const explanation = element("section", {
    class: "memory-explanation",
    "aria-labelledby": "memory-explanation-title",
  });
  const explanationList = element("ul", {
    class: "memory-explanation-list",
    id: "calc-explanation",
  });
  explanation.append(
    element(
      "h3",
      { id: "memory-explanation-title", class: "tool-section-title" },
      t.explain,
    ),
    explanationList,
  );
  const comparison = element("section", {
    class: "memory-comparison",
    "aria-labelledby": "memory-comparison-title",
  });
  comparison.append(
    element(
      "h3",
      { id: "memory-comparison-title", class: "tool-section-title" },
      t.comparison,
    ),
  );
  const comparisonScroll = element("div", {
    class: "memory-table-scroll",
    tabindex: "0",
    role: "region",
    "aria-label": t.comparison,
  });
  const table = element("table");
  const tableHead = element("thead");
  const headings = element("tr");
  for (const label of [t.component, t.baseline, t.current, t.difference])
    headings.append(element("th", { scope: "col" }, label));
  tableHead.append(headings);
  const tableBody = element("tbody");
  table.append(tableHead, tableBody);
  comparisonScroll.append(table);
  const conclusion = element("p", {
    class: "tool-boundary",
    id: "calc-comparison-summary",
  });
  const baselineDetails = element("details", { class: "lab-widget-details" });
  baselineDetails.append(element("summary", {}, t.baselineSettings));
  const baselineDescription = element("dl", {
    class: "memory-baseline-settings",
  });
  baselineDetails.append(baselineDescription);
  comparison.append(
    comparisonScroll,
    conclusion,
    baselineDetails,
    element("p", { class: "lab-widget-note" }, t.workloadNote),
  );
  const details = element("details", { class: "lab-widget-details" });
  details.append(
    element(
      "summary",
      {},
      t.estimate + " · " + (lang === "es" ? "Fórmula y límites" : "Formula and limits"),
    ),
    element("p", {}, t.formula),
    element("p", {}, t.assumptions),
  );
  host.append(grid, explanation, comparison, details);
  const number = (digits) =>
    new Intl.NumberFormat(lang, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  const whole = new Intl.NumberFormat(lang);
  const fill = (template, fields) =>
    template.replace(/\{(\w+)\}/g, (_, key) => fields[key] ?? "");
  const selectedPreset = () =>
    MEMORY_PRESETS.find((item) => item.id === preset.value) || null;
  const readInputs = () =>
    Object.fromEntries(
      Object.entries(controls).map(([key, control]) => [
        key,
        Number(control.value),
      ]),
    );
  const describePreset = (item) => {
    presetSummary.textContent = item
      ? fill(t.archSummary, {
          all: item.layers + item.linearLayers,
          layers: item.layers,
          linear: item.linearLayers,
          heads: item.kvHeads,
          dim: item.headDim,
          context: whole.format(item.context),
          license: item.license,
        }) +
        (item.activeParameters < item.parameters
          ? fill(t.archMoe, {
              active: whole.format(item.activeParameters),
              params: whole.format(item.parameters),
            })
          : "")
      : "";
    presetSource.replaceChildren();
    if (!item) return;
    for (const [label, href] of [
      [t.source, item.source],
      [t.config, item.config],
    ]) {
      if (presetSource.childNodes.length)
        presetSource.append(document.createTextNode(" · "));
      presetSource.append(
        element("a", { href, target: "_blank", rel: "noopener noreferrer" }, label),
      );
    }
  };
  const applyPreset = (item) => {
    for (const key of architectureKeys) controls[key].value = String(item[key]);
    describePreset(item);
  };
  let baseline = readInputs();
  let baselinePreset = selectedPreset();
  const renderBaseline = () => {
    baselineDescription.replaceChildren();
    const model = element("dd", {}, baselinePreset?.label || t.custom);
    if (baselinePreset) {
      model.append(
        document.createTextNode(" · "),
        element(
          "a",
          {
            href: baselinePreset.source,
            target: "_blank",
            rel: "noopener noreferrer",
          },
          t.source,
        ),
      );
    }
    baselineDescription.append(element("dt", {}, t.preset), model);
    // Selects show their option label; numbers use the page locale.
    const shown = (key) => {
      const value = baseline[key];
      const option = [...(controls[key].options || [])].find(
        (item) => item.value === String(value),
      );
      return option ? option.text : whole.format(value);
    };
    for (const [key, label] of definitions)
      baselineDescription.append(
        element("dt", {}, label),
        element("dd", {}, shown(key)),
      );
  };
  const explain = (input, metrics) => {
    const one = number(1);
    const lines = [];
    if (input.layers > 0)
      lines.push(
        fill(t.kvLine, {
          kv: one.format(metrics.kvPerTokenKiB),
          layers: input.layers,
          heads: input.kvHeads,
          dim: input.headDim,
          bytes: input.kvBytes,
        }),
      );
    if (input.linearLayers > 0)
      lines.push(
        fill(t.stateLine, {
          linear: input.linearLayers,
          mib: whole.format(Math.round(metrics.statePerRequestMiB)),
        }),
      );
    if (input.linearLayers > 0 && metrics.allLayersCache !== null)
      lines.push(
        fill(t.hybridLine, {
          all: input.layers + input.linearLayers,
          full: one.format(metrics.allLayersCache),
          cache: one.format(metrics.cache),
        }),
      );
    if (input.activeParameters < input.parameters)
      lines.push(
        fill(t.moeLine, {
          active: whole.format(input.activeParameters),
          params: whole.format(input.parameters),
          read: one.format(metrics.activeWeightsRead),
        }),
      );
    if (input.bits < 16 && input.highPrecisionParameters > 0)
      lines.push(
        fill(t.precisionLine, { kept: one.format(input.highPrecisionParameters) }),
      );
    const item = selectedPreset();
    if (item && input.tokens > item.context)
      lines.push(
        fill(t.contextLine, {
          tokens: whole.format(input.tokens),
          context: whole.format(item.context),
        }),
      );
    explanationList.replaceChildren(
      ...lines.map((line) => element("li", {}, line)),
    );
  };
  renderBaseline();
  const update = () => {
    for (const control of Object.values(controls))
      control.setAttribute("aria-invalid", String(!control.checkValidity()));
    try {
      if (!form.checkValidity()) throw new Error("invalid");
      const input = readInputs();
      const metrics = estimateMemory(input);
      const compared = compareMemory(baseline, input);
      const formatter = number(1);
      for (const key of ["total", ...components.map(([name]) => name)])
        values[key].textContent = `${formatter.format(metrics[key])} GiB`;
      // The total is already on screen; announce it without repeating it.
      status.classList.add("visually-hidden");
      status.textContent = `${t.total}: ${formatter.format(metrics.total)} GiB`;
      explain(input, metrics);
      tableBody.replaceChildren();
      for (const [key, label] of [...components, ["total", t.total]]) {
        const row = element("tr");
        row.append(element("th", { scope: "row" }, label));
        for (const value of [
          compared.baseline[key],
          compared.current[key],
          compared.delta[key],
        ])
          row.append(element("td", {}, `${formatter.format(value)} GiB`));
        tableBody.append(row);
      }
      conclusion.textContent = compared.driver
        ? `${t.difference}: ${formatter.format(compared.percent)}%. ${t.driver}: ${t[compared.driver]}.`
        : t.noChange;
      saveBaseline.disabled = false;
    } catch (error) {
      for (const output of Object.values(values)) output.textContent = "—";
      explanationList.replaceChildren();
      // A field outside its own limits first; otherwise the field a
      // cross-field rule names (active above total parameters, for example).
      const invalidKey =
        Object.keys(controls).find((key) => !controls[key].checkValidity()) ||
        (Object.hasOwn(controls, error.field) ? error.field : undefined);
      if (invalidKey) controls[invalidKey].setAttribute("aria-invalid", "true");
      const invalidLabel = definitions.find(([key]) => key === invalidKey)?.[1];
      status.classList.remove("visually-hidden");
      status.textContent = invalidLabel
        ? `${invalidLabel}: ${t.invalidMemory}`
        : t.invalidMemory;
      if (advancedKeys.includes(invalidKey)) architecture.open = true;
      tableBody.replaceChildren();
      conclusion.textContent = t.invalidMemory;
      saveBaseline.disabled = true;
    }
  };
  form.addEventListener("input", (event) => {
    if (architectureKeys.some((key) => controls[key] === event.target)) {
      preset.value = "custom";
      describePreset(null);
    }
    update();
  });
  preset.addEventListener("change", () => {
    const item = selectedPreset();
    if (item) applyPreset(item);
    else describePreset(null);
    update();
  });
  saveBaseline.addEventListener("click", () => {
    if (!form.checkValidity()) return;
    baseline = readInputs();
    baselinePreset = selectedPreset();
    renderBaseline();
    update();
    status.classList.remove("visually-hidden");
    status.textContent = t.baselineSaved;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
  applyPreset(selectedPreset());
  baseline = readInputs();
  renderBaseline();
  update();
  useScenario("interactive-llm-calculator", host, (shared) => {
    const id = shared.get("preset");
    if (id === "custom" || MEMORY_PRESETS.some((item) => item.id === id)) {
      preset.value = id;
      if (selectedPreset()) applyPreset(selectedPreset());
      else describePreset(null);
    }
    // Values go through the same validity checks as typed input.
    for (const [key] of definitions) {
      const value = shared.get(key.toLowerCase());
      if (value === undefined) continue;
      if (preset.value !== "custom" && architectureKeys.includes(key)) continue;
      const control = controls[key];
      if (
        control.tagName === "SELECT" &&
        ![...control.options].some((option) => option.value === value)
      )
        continue;
      control.value = value.slice(0, 32);
    }
    // Only a scenario the model accepts becomes baseline A; an invalid one
    // stays editable as B against the unchanged baseline.
    try {
      if (!form.checkValidity()) throw new Error("invalid");
      estimateMemory(readInputs());
      baseline = readInputs();
      baselinePreset = selectedPreset();
    } catch {
      // Keep the previous baseline.
    }
    renderBaseline();
    update();
  });
}
