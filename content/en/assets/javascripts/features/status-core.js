/**
 * Availability states for the HUD pill, by wall clock in America/Caracas
 * (fixed UTC-4, no DST). Each state has a dot color token, a label and a
 * tooltip per locale; the label repeats what the color says (WCAG 1.4.1).
 */
export const STATUS_STATES = Object.freeze({
  triage: {
    color: "--status-triage",
    en: "Morning triage · Pipelines",
    es: "Arranque del día · Pipelines",
    titleEn:
      "Going through what ran, failed, or is still queued overnight. Write now if it is urgent — this is the hour I pick it up.",
    titleEs:
      "Reviso qué se ejecutó, qué falló y qué quedó en cola durante la noche. Escríbeme ahora si es urgente — es la hora en que lo veo primero.",
  },
  sessions: {
    color: "--status-sessions",
    en: "Team session · In a call",
    es: "Sesión con el equipo · En llamada",
    titleEn:
      "This hour usually goes to check-ins and working sessions with the client's engineering team. Write anyway — I reply when the call ends.",
    titleEs:
      "Esta hora suele irse en llamadas de seguimiento y sesiones de trabajo con el equipo de ingeniería del cliente. Escríbeme igual — respondo al terminar.",
  },
  available: {
    color: "--status-available",
    en: "Available for meetings · UTC-4",
    es: "Disponible para reuniones · UTC-4",
    titleEn: "At my desk and answering — the best window for a call.",
    titleEs:
      "En el escritorio y respondiendo — la mejor ventana para una llamada.",
  },
  coffee: {
    color: "--status-coffee",
    en: "Coffee break · 15 min",
    es: "Pausa para café · 15 min",
    titleEn:
      "A short break. Write now — fifteen minutes will not change the answer.",
    titleEs:
      "Una pausa corta. Escríbeme ahora — quince minutos no cambian la respuesta.",
  },
  lunch: {
    color: "--status-lunch",
    en: "Lunch break",
    es: "Pausa para almorzar",
    titleEn:
      "Away for lunch. Write anyway — I reply as soon as I am back at the desk.",
    titleEs:
      "En pausa para almorzar. Escríbeme igual — respondo al volver al escritorio.",
  },
  focus: {
    color: "--status-focus",
    en: "Deep work · Architecture",
    es: "Trabajo profundo · Arquitectura",
    titleEn:
      "Heads-down on architecture. Write anyway — I reply when the focus block ends.",
    titleEs:
      "Concentrado en arquitectura. Escríbeme igual — respondo al cerrar el bloque.",
  },
  reviews: {
    color: "--status-reviews",
    en: "Reviews & pull requests",
    es: "Revisiones y pull requests",
    titleEn:
      "In the pull-request queue and the open threads. Write now — I reply the same day, asynchronously.",
    titleEs:
      "En la cola de pull requests y los hilos abiertos. Escríbeme — respondo el mismo día, de forma asíncrona.",
  },
  lab: {
    color: "--status-lab",
    en: "Lab · Last replies today",
    es: "Lab · Últimas respuestas del día",
    titleEn:
      "Applied research and open source, away from client work. If you need an answer today, write now.",
    titleEs:
      "Investigación aplicada y open source, fuera del trabajo con clientes. Si necesitas respuesta hoy, escríbeme ahora.",
  },
  offline: {
    color: "--status-offline",
    en: "Offline · Outside hours",
    es: "Desconectado · Fuera de horario",
    titleEn:
      "Outside the scheduled day. Messages are welcome; I read them when the next one opens.",
    titleEs:
      "Fuera de la jornada. Puedes escribirme; leo los mensajes al empezar la siguiente.",
  },
  weekend: {
    color: "--status-weekend",
    en: "Weekend · Off the clock",
    es: "Fin de semana · Fuera de horario",
    titleEn: "Off the clock. Messages will be answered on Monday.",
    titleEs: "Fuera de horario. Los mensajes los respondo el lunes.",
  },
});

/**
 * Weekday schedule (docs/design.md, Availability pill):
 *   08:00 triage   09:00 sessions   10:00 available   11:00 coffee (15 min)
 *   12:00 lunch    13:00 available  14:00 focus       15:00 coffee (15 min)
 *   16:00 reviews  18:00 lab        20:00 offline; weekends are weekend.
 */
export function statusFor(hour, minute, isWeekend) {
  if (isWeekend) return STATUS_STATES.weekend;
  if (hour >= 20 || hour < 8) return STATUS_STATES.offline;
  if ((hour === 11 || hour === 15) && minute < 15) return STATUS_STATES.coffee;
  if (hour < 9) return STATUS_STATES.triage;
  if (hour < 10) return STATUS_STATES.sessions;
  if (hour < 12) return STATUS_STATES.available;
  if (hour < 13) return STATUS_STATES.lunch;
  if (hour < 14) return STATUS_STATES.available;
  if (hour < 16) return STATUS_STATES.focus;
  if (hour < 18) return STATUS_STATES.reviews;
  return STATUS_STATES.lab;
}

/** The state for an instant, read on the fixed UTC-4 Caracas clock. */
export function statusAt(epochMs) {
  const caracas = new Date(epochMs - 4 * 60 * 60 * 1000);
  const day = caracas.getUTCDay();
  return statusFor(
    caracas.getUTCHours(),
    caracas.getUTCMinutes(),
    day === 0 || day === 6,
  );
}
