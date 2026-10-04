/** DOM-free CLI commands, completions and inference-memory arithmetic. */

import { normalize } from "./text-core.js";

const ALIASES = Object.freeze({
  ayuda: "help",
  subnet: "ip",
  sha256: "hash",
  fecha: "time",
  crontab: "cron",
  availability: "nines",
  disponibilidad: "nines",
  historial: "history",
  tasa: "rate",
  limpiar: "clear",
  salir: "exit",
});

export function parseCommand(raw) {
  const [, name = "", argument = ""] =
    raw.trimStart().match(/^(\S+)(?:[ \t]+([\s\S]*))?$/) || [];
  const command = normalize(name);
  return {
    command: Object.hasOwn(ALIASES, command) ? ALIASES[command] : command,
    argument,
  };
}

export const COMMANDS = Object.freeze({
  help: [
    "help [command]",
    "List commands or explain one",
    "Ver comandos o explicar uno",
  ],
  ping: [
    "ping",
    "Time 3 HTTP requests to this origin (not ICMP)",
    "Medir 3 peticiones HTTP a este origen (no ICMP)",
  ],
  ip: [
    "ip <IPv4/CIDR>",
    "Calculate a subnet locally, not your public IP",
    "Calcular una subred localmente, no tu IP pública",
  ],
  uuid: [
    "uuid [1–10]",
    "Generate cryptographically random UUID v4 values",
    "Generar UUID v4 con aleatoriedad criptográfica",
  ],
  hash: [
    "hash <text>",
    "Calculate a UTF-8 SHA-256 digest",
    "Calcular un resumen SHA-256 de texto UTF-8",
  ],
  base64: [
    "base64 encode|decode <text>",
    "Encode or decode UTF-8 text",
    "Codificar o decodificar texto UTF-8",
  ],
  url: [
    "url encode|decode <text>",
    "Encode or decode a URL component",
    "Codificar o decodificar un componente de URL",
  ],
  json: [
    "json <JSON>",
    "Validate and indent JSON",
    "Validar JSON y aplicar sangría",
  ],
  jwt: [
    "jwt <token>",
    "Decode a JWT locally, without verifying its signature",
    "Decodificar un JWT localmente, sin verificar su firma",
  ],
  time: [
    "time [zone|unix-seconds]",
    "Show ISO, Unix seconds and a zoned clock",
    "Ver ISO, segundos Unix y hora por zona",
  ],
  cron: [
    "cron <expression>",
    "Explain a five-field cron schedule and list its next UTC runs",
    "Explicar un cron de cinco campos y listar sus próximas ejecuciones UTC",
  ],
  nines: [
    "nines <target%>",
    "Turn an availability target into allowed downtime and failures",
    "Convertir un objetivo de disponibilidad en caída y fallos permitidos",
  ],
  bytes: [
    "bytes <value> <unit> [to-unit]",
    "Compare decimal and binary storage units",
    "Comparar unidades decimales y binarias de almacenamiento",
  ],
  rate: [
    "rate <value>[unit]/<period>",
    "Spread a volume or event count across seconds, hours and days",
    "Repartir un volumen o recuento de eventos por segundo, hora y día",
  ],
  base: [
    "base <integer> <from-base> <to-base>",
    "Convert an integer between bases 2–36, without precision loss",
    "Convertir un entero entre bases 2–36 sin perder precisión",
  ],
  contrast: [
    "contrast <text-hex> <background-hex>",
    "Check a color pair against WCAG text contrast thresholds",
    "Comparar dos colores con los umbrales de contraste de texto WCAG",
  ],
  history: [
    "history",
    "Show this session's command history",
    "Ver el historial de esta sesión",
  ],
  clear: [
    "clear",
    "Clear the terminal output (Ctrl+L)",
    "Limpiar la salida (Ctrl+L)",
  ],
  exit: ["exit", "Close the console (Escape)", "Cerrar la consola (Escape)"],
});

export const COMMAND_EXAMPLES = Object.freeze({
  help: "help ip",
  ping: "ping",
  ip: "ip 192.168.10.42/24",
  uuid: "uuid 3",
  hash: "hash hello",
  base64: "base64 encode Hola 🌎",
  url: "url encode café & data",
  json: 'json {"region":"eu","replicas":3}',
  // cspell:disable-next-line -- a Base64URL sample token, not words
  jwt: "jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2aXNpdG9yIiwiaWF0IjoxNzkwMDAwMDAwLCJleHAiOjE3OTAwMDM2MDB9.c2ln",
  time: "time Europe/Madrid",
  cron: "cron */15 9-17 * * mon-fri",
  nines: "nines 99.95",
  bytes: "bytes 1 GiB GB",
  rate: "rate 5 TB/day",
  base: "base ff 16 10",
  contrast: "contrast #1a1a2e #ffffff",
  history: "history",
  clear: "clear",
  exit: "exit",
});

/** Suggest text only. Accepting a suggestion never executes a command. */
export function suggestCommand(raw, history = []) {
  if (!raw) return "help";
  if (raw.length > 2200 || /[\r\n]/.test(raw)) return "";
  const previous = history.findLast(
    (entry) => entry.startsWith(raw) && entry !== raw,
  );
  if (previous) return previous;
  const example = Object.values(COMMAND_EXAMPLES).find(
    (value) => value.startsWith(raw) && value !== raw,
  );
  if (example) return example;
  return (
    completions(raw).find((value) => value !== raw && value.startsWith(raw)) ||
    ""
  );
}

export function completions(raw) {
  const value = raw.toLowerCase();
  const units =
    raw.match(/^(bytes\s+\d+(?:\.\d+)?\s+)(\S*)$/i) ||
    raw.match(/^(bytes\s+\d+(?:\.\d+)?\s+\S+\s+)(\S*)$/i);
  if (units)
    return Object.keys(BYTE_UNITS)
      .filter((unit) => unit.toLowerCase().startsWith(units[2].toLowerCase()))
      .map((unit) => `${units[1]}${unit}`);
  const radix = value.match(/^(base\s+[+-]?[0-9a-z]+\s+(?:\d+\s+)?)(\d*)$/);
  if (radix)
    return ["2", "8", "10", "16", "36"]
      .filter((base) => base.startsWith(radix[2]))
      .map((base) => `${radix[1]}${base}`);
  const subcommand = value.match(/^(help|base64|url)\s+([^\s]*)$/);
  if (subcommand) {
    const [, name, prefix] = subcommand;
    const options =
      name === "help" ? Object.keys(COMMANDS) : ["encode", "decode"];
    return options
      .filter((option) => option.startsWith(prefix))
      .map((option) => `${name} ${option}`);
  }
  if (/\s/.test(value)) return [];
  return Object.keys(COMMANDS).filter((command) => command.startsWith(value));
}

/** Mathematical IPv4 ranges, not a provider's allocatable-address policy.
 * /31 has two point-to-point endpoints (RFC 3021); /32 is a host route.
 */
export function inspectSubnet(input) {
  const match = input
    .trim()
    .match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(0|[1-9]\d?))?$/);
  if (!match) throw new Error("ip");
  const octets = match.slice(1, 5);
  if (
    octets.some(
      (part) => Number(part) > 255 || (part.length > 1 && part[0] === "0"),
    )
  )
    throw new Error("ip");
  const prefix = Number(match[5] ?? 32);
  if (prefix > 32) throw new Error("ip");
  const address = octets.reduce((value, part) => value * 256 + Number(part), 0);
  const count = 2 ** (32 - prefix);
  const network = Math.floor(address / count) * count;
  const last = network + count - 1;
  const dotted = (value) =>
    [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
  return {
    address: dotted(address),
    prefix,
    network: dotted(network),
    mask: dotted(2 ** 32 - count),
    broadcast: prefix < 31 ? dotted(last) : null,
    count,
    hosts: prefix < 31 ? count - 2 : count,
    firstHost: dotted(prefix < 31 ? network + 1 : network),
    lastHost: dotted(prefix < 31 ? last - 1 : last),
  };
}

/** JSON.parse that refuses numbers it would silently round or overflow. */
function parseStrictJson(text) {
  return JSON.parse(text, (_key, item) => {
    if (
      typeof item === "number" &&
      (!Number.isFinite(item) ||
        (Number.isInteger(item) && !Number.isSafeInteger(item)))
    )
      throw new Error("json_number");
    return item;
  });
}

/** Plain text only: no shell quoting, variable expansion or interpretation. */
export function transformText(command, argument) {
  if (!argument || argument.length > 2200) throw new Error("text_length");
  try {
    if (command === "json") {
      // Stringify would silently round unsafe integers or replace overflow
      // with null. Refuse those inputs instead of displaying changed data.
      const value = parseStrictJson(argument);
      const formatted = JSON.stringify(value, null, 2);
      if (formatted.length > 16000) throw new Error("json_size");
      return formatted;
    }
    const [, mode, text] =
      argument.match(/^(encode|decode)[ \t]([\s\S]+)$/) || [];
    if (!mode || !["base64", "url"].includes(command)) throw new Error(command);
    if (command === "url")
      return mode === "encode"
        ? encodeURIComponent(text)
        : decodeURIComponent(text);
    if (mode === "encode") {
      return globalThis.btoa(
        Array.from(new globalThis.TextEncoder().encode(text), (byte) =>
          String.fromCharCode(byte),
        ).join(""),
      );
    }
    const compact = text.replace(/\s/g, "");
    const binary = globalThis.atob(compact);
    if (
      globalThis.btoa(binary).replace(/=+$/, "") !== compact.replace(/=+$/, "")
    )
      throw new Error("base64");
    return new globalThis.TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch (error) {
    throw new Error(
      ["json_number", "json_size"].includes(error.message)
        ? error.message
        : command,
    );
  }
}

export async function hashText(text) {
  if (!text || text.length > 2200) throw new Error("text_length");
  if (!globalThis.crypto?.subtle) throw new Error("crypto");
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new globalThis.TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function createUUIDs(argument = "") {
  const count = argument.trim() || "1";
  if (!/^(?:[1-9]|10)$/.test(count)) throw new Error("uuid");
  if (!globalThis.crypto?.randomUUID) throw new Error("crypto");
  return Array.from({ length: Number(count) }, () =>
    globalThis.crypto.randomUUID(),
  );
}

export function inspectTime(argument = "", now = Date.now()) {
  const value = argument.trim();
  let date = new Date(now);
  let zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (/^-?\d+$/.test(value)) {
    const seconds = Number(value);
    // Deliberately seconds, not a guess between seconds and milliseconds.
    if (
      !Number.isSafeInteger(seconds) ||
      seconds < -62167219200 ||
      seconds > 253402300799
    )
      throw new Error("time");
    date = new Date(seconds * 1000);
  } else if (value) zone = value;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format(date);
    return {
      date,
      zone,
      iso: date.toISOString(),
      seconds: Math.floor(date.getTime() / 1000),
    };
  } catch {
    throw new Error("time");
  }
}

const CRON_RANGES = Object.freeze([
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
]);
const CRON_NAMES = Object.freeze({
  3: "jan feb mar apr may jun jul aug sep oct nov dec".split(" "),
  4: "sun mon tue wed thu fri sat".split(" "),
});
const CRON_MACROS = Object.freeze({
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
});
const CRON_HORIZON = 5 * 366 * 86400000;

function cronField(text, index) {
  const [min, max] = CRON_RANGES[index];
  const names = CRON_NAMES[index] || [];
  const value = (token) => {
    // Month names start at 1 and weekday names at 0, like their fields.
    if (names.includes(token)) return names.indexOf(token) + min;
    if (!/^\d{1,2}$/.test(token)) throw new Error("cron");
    const number = Number(token);
    if (number < min || number > max) throw new Error("cron_range");
    return number;
  };
  const values = new Set();
  for (const part of text.split(",")) {
    const match = part.match(/^(\*|[a-z0-9]+(?:-[a-z0-9]+)?)(?:\/(\d{1,2}))?$/);
    if (!match) throw new Error("cron");
    const [, range, stepText] = match;
    const bounds = range === "*" ? [min, max] : range.split("-").map(value);
    // A step on a single value means different things across cron dialects.
    if (bounds.length === 1 && stepText) throw new Error("cron");
    const [start, end = start] = bounds;
    const step = stepText ? Number(stepText) : 1;
    if (start > end || step < 1) throw new Error("cron_range");
    for (let item = start; item <= end; item += step)
      values.add(index === 4 && item === 7 ? 0 : item);
  }
  return [...values].sort((a, b) => a - b);
}

/** Vixie cron fields evaluated in UTC; no seconds or Quartz extensions. */
export function inspectCron(argument = "", now = Date.now(), count = 5) {
  const text = argument.trim().toLowerCase().split(/\s+/).join(" ");
  if (!text || text.length > 120) throw new Error("cron");
  if (text.startsWith("@") && !Object.hasOwn(CRON_MACROS, text))
    throw new Error("cron_macro");
  const expression = Object.hasOwn(CRON_MACROS, text) ? CRON_MACROS[text] : text;
  const parts = expression.split(" ");
  if (parts.length === 6) throw new Error("cron_seconds");
  if (parts.length !== 5) throw new Error("cron");
  const fields = parts.map(cronField);
  const [minutes, hours, days, months, weekdays] = fields.map(
    (values) => new Set(values),
  );
  // A day field starting with * does not restrict; two restricted fields OR.
  const either = !parts[2].startsWith("*") && !parts[4].startsWith("*");
  const dayMatches = (date) => {
    const monthDay = days.has(date.getUTCDate());
    const weekday = weekdays.has(date.getUTCDay());
    return either ? monthDay || weekday : monthDay && weekday;
  };
  if (!Number.isFinite(now)) throw new Error("cron");
  const cursor = new Date(Math.floor(now / 60000) * 60000 + 60000);
  const limit = cursor.getTime() + CRON_HORIZON;
  const runs = [];
  while (runs.length < count && cursor.getTime() <= limit) {
    if (!months.has(cursor.getUTCMonth() + 1)) {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
      cursor.setUTCHours(0, 0, 0, 0);
    } else if (!dayMatches(cursor)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
    } else if (!hours.has(cursor.getUTCHours()))
      cursor.setUTCHours(cursor.getUTCHours() + 1, 0, 0, 0);
    else if (!minutes.has(cursor.getUTCMinutes()))
      cursor.setUTCMinutes(cursor.getUTCMinutes() + 1, 0, 0);
    else {
      runs.push(new Date(cursor));
      cursor.setUTCMinutes(cursor.getUTCMinutes() + 1, 0, 0);
    }
  }
  return {
    macro: expression === text ? null : text,
    expression,
    fields,
    either,
    runs,
  };
}

const NINES_PERIODS = Object.freeze([
  ["day", 86400],
  ["week", 604800],
  ["month", 2592000],
  ["quarter", 7776000],
  ["year", 31536000],
]);

/** Exact target digits: millionths of a percent, never a binary fraction. */
export function inspectAvailability(argument = "") {
  const match = argument.trim().match(/^(\d{1,3})(?:\.(\d{1,6}))?[ \t]*%?$/);
  if (!match) throw new Error("nines");
  const target =
    Number(match[1]) * 1e6 + Number((match[2] || "").padEnd(6, "0"));
  if (target <= 0 || target > 100e6) throw new Error("nines");
  const failing = 100e6 - target;
  return {
    target: target / 1e6,
    periods: NINES_PERIODS.map(([name, seconds]) => ({
      name,
      seconds: (seconds * failing) / 100e6,
    })),
    perMillion: failing / 100,
  };
}

const BYTE_UNITS = Object.freeze({
  B: 1n,
  kB: 1000n,
  MB: 1000n ** 2n,
  GB: 1000n ** 3n,
  TB: 1000n ** 4n,
  KiB: 1024n,
  MiB: 1024n ** 2n,
  GiB: 1024n ** 3n,
  TiB: 1024n ** 4n,
});

/** Exact rational arithmetic until display; round half-up to `places` decimals. */
function decimalRatio(numerator, denominator, places = 12) {
  const scale = 10n ** BigInt(places);
  const scaled = numerator * scale;
  const remainder = scaled % denominator;
  const rounded =
    scaled / denominator + (remainder * 2n >= denominator ? 1n : 0n);
  const integer = rounded / scale;
  const fraction = (rounded % scale)
    .toString()
    .padStart(places, "0")
    .replace(/0+$/, "");
  return {
    value: `${integer}${fraction ? `.${fraction}` : ""}`,
    approximate: remainder !== 0n,
  };
}

/** Units are case-sensitive: B is bytes, never bits; no guessed prefixes. */
export function convertBytes(argument) {
  if (argument.length > 80) throw new Error("bytes");
  const match = argument
    .trim()
    .match(/^(\d{1,18})(?:\.(\d{1,6}))?\s+(\S+)(?:\s+(\S+))?$/);
  if (!match) throw new Error("bytes");
  const [, integer, fraction = "", unit, target] = match;
  if (
    !Object.hasOwn(BYTE_UNITS, unit) ||
    (target && !Object.hasOwn(BYTE_UNITS, target))
  )
    throw new Error("bytes");
  const numerator = BigInt(integer + fraction) * BYTE_UNITS[unit];
  const denominator = 10n ** BigInt(fraction.length);
  return (target ? [target] : Object.keys(BYTE_UNITS)).map((outputUnit) => ({
    unit: outputUnit,
    ...decimalRatio(numerator, denominator * BYTE_UNITS[outputUnit]),
  }));
}

/** Months are 30 days and years 365, as in `nines`. Accents are ignored. */
const RATE_PERIODS = Object.freeze({
  s: 1n, sec: 1n, second: 1n, seg: 1n, segundo: 1n,
  min: 60n, minute: 60n, minuto: 60n,
  h: 3600n, hr: 3600n, hour: 3600n, hora: 3600n,
  d: 86400n, day: 86400n, dia: 86400n,
  week: 604800n, semana: 604800n,
  month: 2592000n, mes: 2592000n,
  year: 31536000n, ano: 31536000n,
});
const RATE_OUTPUT = Object.freeze([
  ["second", 1n],
  ["minute", 60n],
  ["hour", 3600n],
  ["day", 86400n],
  ["month", 2592000n],
]);
const DECIMAL_BYTES = ["TB", "GB", "MB", "kB", "B"];
const BINARY_BYTES = ["TiB", "GiB", "MiB", "KiB", "B"];

function ratePeriod(word) {
  const key = normalize(word);
  if (Object.hasOwn(RATE_PERIODS, key)) return RATE_PERIODS[key];
  // Plurals: days, hours, meses (not "s" itself, which means seconds).
  for (const suffix of ["es", "s"]) {
    const stem = key.slice(0, -suffix.length);
    if (stem.length > 1 && key.endsWith(suffix) && Object.hasOwn(RATE_PERIODS, stem))
      return RATE_PERIODS[stem];
  }
  throw new Error("rate");
}

/** Largest unit whose value is at least 1, so 5 TB/day reads as MB/s.
 * `units` runs from largest to smallest and ends with B.
 */
function scaledBytes(numerator, denominator, units, places) {
  let index = units.findIndex(
    (name) => numerator >= denominator * BYTE_UNITS[name],
  );
  if (index < 0) index = units.length - 1;
  const ratio = (at) =>
    decimalRatio(numerator, denominator * BYTE_UNITS[units[at]], places);
  let result = ratio(index);
  // Rounding can reach the next unit: 999.9999 GB/s reads as 1 TB/s.
  if (
    index > 0 &&
    BigInt(result.value.split(".")[0]) >=
      BYTE_UNITS[units[index - 1]] / BYTE_UNITS[units[index]]
  )
    result = ratio(--index);
  return { unit: units[index], ...result };
}

/** Averages only: exact rational arithmetic, rounded for display. */
export function inspectRate(argument = "") {
  if (argument.length > 80) throw new Error("rate");
  const match = argument
    .trim()
    .match(
      /^(\d{1,18})(?:\.(\d{1,6}))?[ \t]*(\p{L}[\p{L}-]{0,15})?[ \t]*(?:\/|[ \t]+(?:per|por)[ \t]+)[ \t]*(\p{L}+)$/u,
    );
  if (!match) throw new Error("rate");
  const [, integer, fraction = "", unit = "", periodWord] = match;
  const bytes = Object.hasOwn(BYTE_UNITS, unit);
  // A lowercase word (páginas, events) labels a count; anything that looks
  // like a byte or bit unit in the wrong case is rejected, not guessed.
  if (
    unit &&
    !bytes &&
    (!/^\p{Ll}[\p{Ll}-]+$/u.test(unit) ||
      // cspell:disable-next-line -- unit prefixes k, M, G, T
      /^(?:[kmgt]i?)?b(?:it)?(?:ps|s)?$|^bytes?$/i.test(unit))
  )
    throw new Error("rate");
  const period = ratePeriod(periodWord);
  const numerator = BigInt(integer + fraction) * (bytes ? BYTE_UNITS[unit] : 1n);
  const denominator = 10n ** BigInt(fraction.length) * period;
  return {
    bytes,
    label: bytes ? "" : unit,
    rows: RATE_OUTPUT.map(([name, seconds]) =>
      bytes
        ? {
            period: name,
            decimal: scaledBytes(numerator * seconds, denominator, DECIMAL_BYTES, 3),
            binary: scaledBytes(numerator * seconds, denominator, BINARY_BYTES, 3),
          }
        : {
            period: name,
            count: decimalRatio(numerator * seconds, denominator, 6),
          },
    ),
  };
}

const JWT_CLAIMS = Object.freeze(["iss", "sub", "aud", "exp", "nbf", "iat", "jti"]);
const JWT_TIMES = Object.freeze(["exp", "nbf", "iat"]);

function base64UrlText(segment) {
  if (!/^[A-Za-z0-9_-]+$/.test(segment) || segment.length % 4 === 1)
    throw new Error("jwt");
  const base64 = segment
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(segment.length / 4) * 4, "=");
  const bytes = Uint8Array.from(globalThis.atob(base64), (char) => char.charCodeAt(0));
  return new globalThis.TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function jsonObject(text) {
  const value = parseStrictJson(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("jwt");
  return value;
}

/** Decodes a compact JWS or reads a JWE header. Never verifies a signature. */
export function inspectJwt(argument = "", now = Date.now()) {
  const token = argument.trim();
  if (!token || token.length > 8192 || /\s/.test(token)) throw new Error("jwt");
  const parts = token.split(".");
  if (
    (parts.length !== 3 && parts.length !== 5) ||
    // JWE's encrypted key may be empty; every other segment is Base64URL.
    !parts
      .slice(parts.length === 5 ? 1 : 2)
      .every((part) => /^[A-Za-z0-9_-]*$/.test(part))
  )
    throw new Error("jwt");
  let header;
  try {
    header = jsonObject(base64UrlText(parts[0]));
  } catch {
    throw new Error("jwt");
  }
  const alg = typeof header.alg === "string" ? header.alg : "";
  if (parts.length === 5)
    return { kind: "jwe", header, alg, payload: null, claims: [], unsigned: false };
  let text;
  try {
    text = base64UrlText(parts[1]);
  } catch {
    throw new Error("jwt");
  }
  let payload = text;
  try {
    payload = jsonObject(text);
  } catch (error) {
    // A JWS payload need not be JSON and is then shown as text, but a JSON
    // number that would be silently rounded is refused.
    if (error.message === "json_number") throw error;
  }
  const claims = [];
  if (typeof payload === "object")
    for (const name of JWT_CLAIMS) {
      if (!Object.hasOwn(payload, name)) continue;
      const value = payload[name];
      const claim = { name, value };
      if (JWT_TIMES.includes(name) && Number.isFinite(value) && Math.abs(value) <= 8.64e12) {
        claim.iso = new Date(value * 1000).toISOString();
        const past = value * 1000 <= now;
        claim.state =
          name === "exp" ? (past ? "expired" : "valid") : past ? "past" : "future";
      }
      claims.push(claim);
    }
  return {
    kind: "jws",
    header,
    alg,
    payload,
    claims,
    unsigned: alg.toLowerCase() === "none" || parts[2] === "",
  };
}

/** Bounded digit-by-digit BigInt parsing: no Number conversion of the value. */
export function convertBase(argument) {
  if (argument.length > 280) throw new Error("base");
  const match = argument
    .trim()
    .match(/^([+-]?[0-9a-z]{1,256})\s+([1-9]\d?)\s+([1-9]\d?)$/i);
  if (!match) throw new Error("base");
  const [, input, source, target] = match;
  const from = Number(source);
  const to = Number(target);
  if (from < 2 || from > 36 || to < 2 || to > 36) throw new Error("base");
  const digits = input.replace(/^[+-]/, "").toLowerCase();
  let value = 0n;
  for (const digit of digits) {
    const position = "0123456789abcdefghijklmnopqrstuvwxyz".indexOf(digit);
    if (position >= from) throw new Error("base");
    value = value * BigInt(from) + BigInt(position);
  }
  if (input.startsWith("-")) value = -value;
  return { input: value.toString(from), from, to, value: value.toString(to) };
}

/** WCAG 2.2 sRGB luminance, opaque colors only; never round before comparison.
 * https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 * https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html
 */
export function inspectContrast(argument) {
  if (argument.length > 32) throw new Error("contrast");
  const colors = argument.trim().split(/\s+/);
  if (
    colors.length !== 2 ||
    colors.some((color) => !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color))
  )
    throw new Error("contrast");
  const [foreground, background] = colors.map((color) =>
    (color.length === 4
      ? "#" + Array.from(color.slice(1), (digit) => digit.repeat(2)).join("")
      : color
    ).toLowerCase(),
  );
  const luminance = (color) => {
    const channels = [1, 3, 5].map(
      (index) => parseInt(color.slice(index, index + 2), 16) / 255,
    );
    return channels
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, channel, index) =>
          sum + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  };
  const first = luminance(foreground);
  const second = luminance(background);
  const ratio =
    (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  return {
    foreground,
    background,
    ratio,
    aaText: ratio >= 4.5,
    aaLargeText: ratio >= 3,
    aaaText: ratio >= 7,
    aaaLargeText: ratio >= 4.5,
  };
}


/** Qwen3.8 reference architectures, not model recommendations. Totals come
 * from each checkpoint's safetensors metadata, dimensions from config.json and
 * active parameters from the model card. Reviewed 2026-09-23.
 * `layers` counts full-attention layers (they keep a KV cache that grows with
 * context); `linearLayers` counts Gated DeltaNet layers, whose recurrent state
 * is fixed per request. `highPrecisionParameters` stay in BF16 inside the
 * official FP8 checkpoint (embeddings, norms, gates and vision encoder).
 */
export const MEMORY_PRESETS = Object.freeze([
  Object.freeze({
    id: "qwen3.8-27b",
    label: "Qwen3.8-27B",
    kind: "dense",
    parameters: 27.78,
    activeParameters: 27.78,
    highPrecisionParameters: 3.08,
    layers: 16,
    linearLayers: 48,
    kvHeads: 4,
    headDim: 256,
    linearHeads: 48,
    linearKeyDim: 128,
    linearValueDim: 128,
    context: 262144,
    license: "Apache-2.0",
    source: "https://huggingface.co/Qwen/Qwen3.8-27B",
    config: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/config.json",
  }),
  Object.freeze({
    id: "qwen3.8-flash-next",
    label: "Qwen3.8-Flash-Next",
    kind: "moe",
    parameters: 180,
    activeParameters: 6,
    highPrecisionParameters: 5.49,
    layers: 12,
    linearLayers: 36,
    kvHeads: 2,
    headDim: 256,
    linearHeads: 48,
    linearKeyDim: 128,
    linearValueDim: 128,
    context: 262144,
    license: "Qwen Community 1.0",
    source: "https://huggingface.co/Qwen/Qwen3.8-Flash-Next",
    config:
      "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/config.json",
  }),
  Object.freeze({
    id: "qwen3.8-2.4t-a95b",
    label: "Qwen3.8-2.4T-A95B",
    kind: "moe",
    parameters: 2446.18,
    activeParameters: 95,
    highPrecisionParameters: 49.59,
    layers: 23,
    linearLayers: 69,
    kvHeads: 4,
    headDim: 256,
    linearHeads: 128,
    linearKeyDim: 128,
    linearValueDim: 128,
    context: 262144,
    license: "Qwen3.8-Max",
    source: "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B",
    config:
      "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/blob/main/config.json",
  }),
]);

const MEMORY_COMPONENTS = ["weights", "cache", "state", "reserve"];

/** Compare unrounded estimates without mutating either input snapshot. */
export function compareMemory(baselineInput, currentInput) {
  const baseline = estimateMemory(baselineInput);
  const current = estimateMemory(currentInput);
  const delta = Object.fromEntries(
    [...MEMORY_COMPONENTS, "total"].map((key) => [
      key,
      current[key] - baseline[key],
    ]),
  );
  const driver = MEMORY_COMPONENTS.reduce((largest, key) =>
    Math.abs(delta[key]) > Math.abs(delta[largest]) ? key : largest,
  );
  return {
    baseline,
    current,
    delta,
    percent: (delta.total / baseline.total) * 100,
    driver: delta[driver] === 0 ? null : driver,
  };
}

const GIB = 2 ** 30;

/** Resident weights, uncompressed KV cache for full-attention layers, fixed
 * linear-attention state and a reserve, in binary GiB. Classic transformers
 * are the case `linearLayers = 0`. Excludes MLA, sparse-attention indexers,
 * offloading, sharding and runtime profiling.
 */
export function estimateMemory({
  parameters,
  bits,
  layers,
  kvHeads,
  headDim,
  tokens,
  concurrency,
  kvBytes,
  overhead,
  activeParameters = parameters,
  highPrecisionParameters = 0,
  linearLayers = 0,
  linearHeads = 0,
  linearKeyDim = 0,
  linearValueDim = 0,
  stateBytes = 4,
}) {
  const finite = [
    parameters,
    bits,
    layers,
    kvHeads,
    headDim,
    tokens,
    concurrency,
    kvBytes,
    overhead,
    activeParameters,
    highPrecisionParameters,
    linearLayers,
    linearHeads,
    linearKeyDim,
    linearValueDim,
    stateBytes,
  ];
  const integers = [
    layers,
    kvHeads,
    headDim,
    tokens,
    concurrency,
    linearLayers,
    linearHeads,
    linearKeyDim,
    linearValueDim,
  ];
  // Cross-field rules name the input to fix; the form's own limits already
  // cover single-field ranges.
  const fail = (field = "") =>
    Object.assign(new Error("memory_inputs"), { field });
  if (
    finite.some((value) => !Number.isFinite(value) || value < 0) ||
    integers.some((value) => !Number.isInteger(value)) ||
    [parameters, bits, kvHeads, headDim, tokens, concurrency, kvBytes].some(
      (value) => value <= 0,
    ) ||
    stateBytes <= 0
  )
    throw fail();
  if (layers + linearLayers === 0) throw fail("layers");
  if (linearLayers > 0) {
    const zero = Object.entries({ linearHeads, linearKeyDim, linearValueDim })
      .find(([, value]) => value <= 0);
    if (zero) throw fail(zero[0]);
  }
  if (activeParameters <= 0 || activeParameters > parameters)
    throw fail("activeParameters");
  if (highPrecisionParameters > parameters) throw fail("highPrecisionParameters");
  if (overhead > 100) throw fail("overhead");
  // A quantized checkpoint keeps part of the model at 16 bits.
  const kept = bits < 16 ? highPrecisionParameters : 0;
  const weightBytes = ((parameters - kept) * bits) / 8 + kept * 2;
  const weights = (weightBytes * 1e9) / GIB;
  const kvPerToken = 2 * layers * kvHeads * headDim * kvBytes;
  const cache = (kvPerToken * tokens * concurrency) / GIB;
  const statePerRequest =
    linearLayers * linearHeads * linearKeyDim * linearValueDim * stateBytes;
  const state = (statePerRequest * concurrency) / GIB;
  const reserve = ((weights + cache + state) * overhead) / 100;
  const total = weights + cache + state + reserve;
  if (!Number.isFinite(total)) throw new Error("memory_inputs");
  return {
    weights,
    cache,
    state,
    reserve,
    total,
    // Teaching values: what one token costs, what caching every layer would
    // cost, and how much weight data a decoded token reads.
    kvPerTokenKiB: kvPerToken / 1024,
    statePerRequestMiB: statePerRequest / 2 ** 20,
    allLayersCache:
      layers > 0 ? (cache * (layers + linearLayers)) / layers : null,
    activeWeightsRead: (weightBytes * 1e9 * (activeParameters / parameters)) / GIB,
  };
}
