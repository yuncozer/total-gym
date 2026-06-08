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

interface Fix {
  name: string;
}

const FIXES: Record<number, Fix> = {
  // ---- PIERNAS (wgerCategoryId=9) ----
  43:    { name: "Sentadilla Hack con Barra" },
  46:    { name: "Zancadas con Barra" },
  205:   { name: "Zancadas con Mancuernas" },
  206:   { name: "Zancadas Caminando con Mancuernas" },
  291:   { name: "Sentadillas Hindúes" },
  294:   { name: "Empuje de Cadera con Barra" },
  320:   { name: "Policheles" },
  331:   { name: "Peso Ruso Swings" },
  364:   { name: "Curl Femoral" },
  365:   { name: "Curl Femoral Acostado" },
  366:   { name: "Curl Femoral Sentado" },
  367:   { name: "Curl Femoral de Pie" },
  369:   { name: "Curl de Cuádriceps" },
  373:   { name: "Prensa de Piernas Cerrada" },
  374:   { name: "Prensa de Piernas Abierta" },
  375:   { name: "Prensa Hackenschmidt" },
  376:   { name: "Levantamiento de Piernas" },
  397:   { name: "Sentadilla Ancha" },
  507:   { name: "Peso Muerto Rumano con Barra" },
  604:   { name: "Peso Muerto de Velocidad" },
};

async function main() {
  const ids = Object.keys(FIXES).map(Number);
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, category_id")
    .in("id", ids);

  if (error || !exercises) {
    console.error("Error fetching:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${exercises.length} of ${ids.length} exercises\n`);

  for (const ex of exercises) {
    const fix = FIXES[ex.id];
    if (!fix) continue;
    console.log(`  ID=${ex.id}: "${ex.name}" → "${fix.name}"`);
  }

  console.log("\n--- Proposed corrections above ---");
  console.log("\nApply? (Remove 'SKIP_' from FIXES to apply)");
}

main().catch(console.error);
