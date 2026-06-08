import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const envRaw = fs.readFileSync(".env.local", "utf-8");
for (const line of envRaw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // --- Deactivate non-back exercises ---
  const toDeactivate = [
    516,    // Frontal Wood Chop → core
    957,    // Quadriped Brazos y Piernas Elevación → core
    1087,   // Mancuernas Hang Power Cleans → olímpico
    1207,   // Scorpion Kick → glúteos
    1263,   // Puente con propio peso → glúteos
    1294,   // Arco femorale una gamba → femoral
    1433,   // Reverso Wood Chops → abdomen
    1447,   // Arrancada OL → olímpico
    1707,   // Elevación Lateral en Polea → hombros
    1730,   // Side Lateral Elevación (Polea) → hombros
    1910,   // En cuadrupedia Superman → glúteos
    // Yoga / stretching / mobility
    1002, 1004, 1005, 1006,
    1010, 1011, 1013, 1014, 1015, 1016, 1017, 1018,
    1027, 1028, 1029,
    1244, 1363, 1394, 1399,
    1450, 1577, 1822, 1861, 1938,
    // Duplicate of 1542
    1702,
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
