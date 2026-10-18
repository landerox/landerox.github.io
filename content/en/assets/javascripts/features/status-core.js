// @ts-check
/**
 * Availability pill: two states by wall clock in America/Caracas (fixed
 * UTC-4, no DST). Working hours are Monday to Friday, 08:00–20:00. Each state
 * has a dot color token, a label and a tooltip per locale; the label repeats
 * what the color says (WCAG 1.4.1).
 */
export const WORKING_HOURS = Object.freeze({ start: 8, end: 20 });

export const STATUS_STATES = Object.freeze({
  available: {
    id: "available",
    color: "--status-available",
    en: "Available · UTC-4",
    es: "Disponible · UTC-4",
    titleEn:
      "Inside my working hours, Monday to Friday from 08:00 to 20:00. Write or book a call.",
    titleEs:
      "Dentro de mi horario laboral, de lunes a viernes de 08:00 a 20:00. Escríbeme o agenda una llamada.",
  },
  offline: {
    id: "offline",
    color: "--status-offline",
    en: "Offline · UTC-4",
    es: "Desconectado · UTC-4",
    titleEn:
      "Outside my working hours, Monday to Friday from 08:00 to 20:00. Messages are welcome; I reply on the next working day.",
    titleEs:
      "Fuera de mi horario laboral, de lunes a viernes de 08:00 a 20:00. Puedes escribirme; respondo el siguiente día laborable.",
  },
});

/** Available on weekdays inside working hours, offline otherwise. */
export function statusFor(hour, isWeekend) {
  return !isWeekend && hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end
    ? STATUS_STATES.available
    : STATUS_STATES.offline;
}

/** The state for an instant, read on the fixed UTC-4 Caracas clock. */
export function statusAt(epochMs) {
  const caracas = new Date(epochMs - 4 * 60 * 60 * 1000);
  const day = caracas.getUTCDay();
  return statusFor(caracas.getUTCHours(), day === 0 || day === 6);
}
