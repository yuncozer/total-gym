/**
 * Fechas en la zona del usuario, no en la del servidor.
 *
 * Vercel corre en UTC. `new Date().toISOString().split("T")[0]` devuelve la
 * fecha UTC, así que un entrenamiento empezado un viernes a las 19:00 en
 * Colombia (sábado 00:00 UTC) se guardaba con fecha de sábado. El 22,5 % del
 * historial estaba desplazado un día por esto.
 *
 * Una fecha de calendario ("¿qué día entrené?") solo tiene sentido respecto a
 * una zona horaria. Aquí siempre es la del usuario.
 */

/** Zona por defecto cuando no sabemos la del usuario todavía. */
export const DEFAULT_TIMEZONE = "UTC";

/**
 * Valida una zona IANA. El valor llega del navegador del usuario, así que
 * puede ser cualquier cosa; una zona inválida haría reventar a Intl.
 */
export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz || typeof tz !== "string" || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * La fecha de calendario (YYYY-MM-DD) de un instante, en la zona dada.
 * `en-CA` formatea como ISO, que es justo lo que guarda la columna `date`.
 */
export function localDate(tz: string, when: Date = new Date()): string {
  const zone = isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

/** Hoy, en la zona del usuario. Lo que cuenta para rachas y "¿entrené hoy?". */
export const todayIn = (tz: string): string => localDate(tz);

/** Desplaza una fecha YYYY-MM-DD n días, sin tocar husos ni horario de verano. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split("T")[0];
}

/** La zona del navegador, para mandarla al servidor. Cliente únicamente. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}
