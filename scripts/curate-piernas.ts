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
    // duplicates (keeping 268, 718, 375, 265, 1913; 901 and 294 are different names)
    1392,  // Good Morning — dupe of 268
    1408,  // Pared-sit — dupe of 718
    1414,  // Sentadillas Hack — dupe of 375
    1906,  // Cadera Puente — dupe of 265
    1234,  // Hip Thrust Unilateral — dupe of 1913
    // stretching / mobility / foam rolling / not legs
    1239, 1240, 1241, 1242,  // foot/ankle stretches
    1274, 1275,              // calf stretches
    1390,                    // Toe Touch — estiramiento
    1393,                    // Unilateral Piernas Isquiotibiales Estiramiento
    1395,                    // Crossbody Piernas Swings
    1396,                    // De pie Pancake — estiramiento
    1397,                    // De pie Pancake Good Morning — estiramiento
    1398,                    // Isquiotibiales Chokes — estiramiento
    1400,                    // Crossbody Isquiotibiales Estiramiento
    1410,                    // Plancha con elevación de pierna — core
    1452,                    // Estiramiento de rodilla al pecho
    1589,                    // Estiramiento de piernas y cadera
    1680,                    // Sentado figure four — estiramiento
    1751,                    // Polea Jalón through — espalda
    1804,                    // Dorsiflexión de tobillo — movilidad
    1809,                    // Reverso Hyperextension — espalda
    1839,                    // Solo Cadera Flexor Estiramiento
    1840,                    // Inclinado-Piernas Isquiotibiales Estiramiento
    1843,                    // Butterfly Estiramiento
    1844,                    // Frog Estiramiento
    1845,                    // Sentado Pancake Good Morning — estiramiento
    1846,                    // Horse Stance — estiramiento
    1854, 1855, 1856, 1857, 1858, 1859, 1860,  // foam rolling
    1862,                    // Cadera Circles — movilidad
    1863,                    // Cadera Cruce — movilidad
    1864,                    // Ankle Roll — movilidad
    1865,                    // Banded Ankle Mobility
    1867, 1868, 1869, 1870, 1871, 1872, 1873, 1874, 1875,  // stretches
    1884,                    // Shinbox IR Estiramiento
    1911,                    // Cat Plancha — core/yoga
    1949,                    // Limber 11 — mobility
    1950, 1951, 1952,        // foam rolling
    1953,                    // Inclinado-knee Iron Cruce — mobility
    1954,                    // Roll-overs into V-sits — core
    1959,                    // Sentado Piriformis Estiramiento
    1960,                    // foot elevated hip flexor stretch
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
