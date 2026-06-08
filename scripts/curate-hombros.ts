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
    // Duplicates (keeping the other)
    1654,   // duplicate of 1744 (Elevación Lateral en Máquina)
    1645,   // duplicate of 572 (Encogimientos con Mancuernas)
    827,    // duplicate of 254 (Elevación Frontal con Disco)
    1731,   // duplicate of 917 (Elevación Frontal con Polea)
    82,     // duplicate of 829 (Elevación Deltoides Posterior)
    487,    // duplicate of 829
    1440,   // duplicate of 418 (Press Militar)
    1575,   // duplicate of 418
    1901,   // duplicate of 1638 (Cargada y Press)
    1943,   // duplicate of 1939 (Cuello CARs)
    // Non-shoulder exercises
    1007,   // Rotación de Cabeza → neck
    1008,   // Estiramiento Lateral Izquierdo de Cuello → neck
    1009,   // Estiramiento Lateral Derecho de Cuello → neck
    1833,   // Suelo Glider Isquiotibiales Curls → hamstrings
    1939,   // Cuello CARs → neck
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
  console.log("IDs:", toDeactivate.join(", "));
}

main();
