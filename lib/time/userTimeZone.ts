import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TIMEZONE, isValidTimeZone } from "./timezone";

/**
 * La zona horaria del usuario para esta petición.
 *
 * El cliente la manda en cada creación de entrenamiento porque es la única
 * fuente fiable; se persiste en `profiles.timezone` para que el trabajo que
 * corre sin navegador delante (crons, rachas) también sepa qué día es para él.
 *
 * Nunca falla: si la zona enviada no es válida y el perfil no tiene ninguna
 * guardada, cae en UTC, que es el comportamiento que había antes.
 */
export async function resolveUserTimeZone(
  db: SupabaseClient,
  userId: string,
  sent?: string | null
): Promise<string> {
  if (isValidTimeZone(sent)) {
    // Guardar es best-effort: que falle no debe tumbar la creación del
    // entrenamiento, que es lo que el usuario está esperando.
    try {
      await db.from("profiles").update({ timezone: sent }).eq("id", userId);
    } catch {
      /* sin persistir; la zona de esta petición sigue siendo válida */
    }
    return sent;
  }

  const { data } = await db
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  return isValidTimeZone(data?.timezone) ? data.timezone : DEFAULT_TIMEZONE;
}
