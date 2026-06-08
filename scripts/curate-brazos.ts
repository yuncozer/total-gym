import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const envRaw = fs.readFileSync(".env.local", "utf-8");
for (const line of envRaw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/^["']|[""]$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const toDeactivate = [
    // duplicates (keeping 1448, 245)
    204, 211,
    // not brazos
    51,    // Curl de Muñeca → antebrazo
    76,    // Press banca agarre cerrado → pecho
    112,   // Plancha Flexión → core
    182,   // Suspensiones en Regleta → grip
    279,   // Fortalecedor de Agarre → grip
    284,   // Hercules Pillars → grip
    454,   // Flexiones de pica → hombros
    501,   // Ring Dips → pecho
    713,   // Pared Pushup → hombros
    804,   // Suspensión en Romos → grip
    820,   // Suspensión en regleta → grip
    821,   // Dominadas en Tabla de Multipresas → espalda
    985,   // Flexiones rotación → pecho
    994,   // Círculos de brazo → hombros
    995,   // Círculos Brazos Atrás → hombros
    1114,  // Rest (for timed workouts) → no es ejercicio
    1216,  // Recruitment Pulls → espalda
    1219,  // Remo Australiano → espalda
    1223,  // Claps over head → cardio
    1228,  // Mancuernas Cerrado grip Banco press → pecho
    1360,  // Bilateral Pesa rusa Cargada y Press → olímpico
    1430,  // Sostén con pellizco → grip
    1467,  // Inclinado Cerrado Grip Barra Banco Press → pecho
    1606,  // Brazos Elevación (T/Y/I) → hombros
    1686,  // Glúteos Puente Unilateral-Brazos Press → glúteos
    1703,  // Patadas traseras → glúteos
    1738,  // Jalón Ups Agarre Neutro o Remo en TRX → espalda
    1741,  // L-Sit Jalón-ups → espalda
    1800,  // Supino Inclinado → ?
    1881,  // Extensión de Muñeca → antebrazo
  ];

  const { error: delErr } = await supabase
    .from("exercises")
    .update({ is_active: false })
    .in("id", toDeactivate);

  if (delErr) {
    console.error("Error deactivating:", delErr);
    return;
  }
  console.log(`Deactivated ${toDeactivate.length} exercises`);
}

main();
