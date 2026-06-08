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

const WORD_FIXES: Record<string, string> = {
  "M??quina": "Máquina",
  "m??quina": "máquina",
  "Tr??ceps": "Tríceps",
  "tr??ceps": "tríceps",
  "B??ceps": "Bíceps",
  "b??ceps": "bíceps",
  "Jal??n": "Jalón",
  "Jal??n-Up": "Jalón-Up",
  "Jal??n-up": "Jalón-up",
  "Jal??n-Ups": "Jalón-Ups",
  "Jal??n-ups": "Jalón-ups",
  "Jal??n-apart": "Jalón-apart",
  "Jal??n-aparts": "Jalón-aparts",
  "Y-Jal??n": "Y-Jalón",
  "Extensi??n": "Extensión",
  "extensi??n": "extensión",
  "Elevaci??n": "Elevación",
  "elevaci??n": "elevación",
  "W-Elevaci??n": "W-Elevación",
  "Y-Elevaci??n": "Y-Elevación",
  "Rotaci??n": "Rotación",
  "rotaci??n": "rotación",
  "Isom??trico": "Isométrico",
  "Cu??driceps": "Cuádriceps",
  "cu??driceps": "cuádriceps",
  "Gl??teos": "Glúteos",
  "gl??teo": "glúteo",
  "el??stica": "elástica",
  "Flexi??n": "Flexión",
  "Abducci??n": "Abducción",
  "Aducci??n": "Aducción",
  "Concentraci??n": "Concentración",
  "Estabilizaci??n": "Estabilización",
  "Suspensi??n": "Suspensión",
  "Respiraci??n": "Respiración",
  "Retracci??n": "Retracción",
  "Dorsiflexi??n": "Dorsiflexión",
  "Sost??n": "Sostén",
  "Tal??n": "Talón",
  "tal??n": "talón",
  "Bal??n": "Balón",
  "Franc??s": "Francés",
  "Caj??n": "Cajón",
  "Envi??n": "Envión",
  "D??ficit": "Déficit",
  "C??rculos": "Círculos",
  "Esc??pula": "Escápula",
  "Hind??es": "Hindúes",
  "N??rdico": "Nórdico",
  "b??lgara": "búlgara",
  "Ara??": "Araña",
  "Le??adores": "Leñadores",
  "Ni??o": "Niño",
  "Monta??eros": "Montañeros",
  "Mu??eca": "Muñeca",
  "pelda??o": "peldaño",
  "Atr??s": "Atrás",
  "Kopf??ber": "Kopfüber",
  "45??": "45°",
  "Devil???s": "Devil's",
  "(Frontal???Espalda)": "(Frontal-Espalda)",
};

const OVERRIDES: Record<number, string> = {};

async function main() {
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name")
    .order("id");

  if (error || !exercises) {
    console.error("Error fetching exercises:", error?.message);
    process.exit(1);
  }

  let fixed = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const originalName = ex.name;
    let name = originalName;

    if (OVERRIDES[ex.id]) {
      name = OVERRIDES[ex.id];
    }

    // Fix word-by-word for encoding issues
    const words = name.split(/(\s+)/);
    const fixedWords = words.map((w: string) => WORD_FIXES[w] || w);
    name = fixedWords.join("");

      // Fix "w/" → "con"
    name = name.replace(/\bw\/\b/gi, "con");

    // Fix "Barbells" → "Barra" (in equipment context)
    name = name.replace(/\bBarbells?\b/gi, "Barra");

    // Fix "Raises" → "Elevación"
    name = name.replace(/\bRaises\b/gi, "Elevación");

    // Fix "Pulley" → "Polea" (redundant with Polea already in name)
    name = name.replace(/\bPulley\b/gi, "Polea");

    // Fix "Extention" → "Extensión"
    name = name.replace(/\bExtention\b/gi, "Extensión");

    // Fix trailing punctuation cleanup
    name = name.replace(/[,;:.\s]+$/, "");
    name = name.replace(/^[\s,;:.]+/, "");

    // Fix "|" separator → join as space
    name = name.replace(/\s*\|\s*/g, " ");

    // Fix double spaces
    name = name.replace(/\s{2,}/g, " ");

    // Remove trailing hyphen artifacts
    name = name.replace(/-$/, "");

    // Fix single-word capitalization
    name = name.charAt(0).toUpperCase() + name.slice(1);

    if (name !== originalName) {
      const { error: updateError } = await supabase
        .from("exercises")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", ex.id);

      if (updateError) {
        console.error(`  [ERR] ID=${ex.id}: ${updateError.message}`);
        skipped++;
      } else {
        console.log(`  ID=${ex.id}: "${originalName}" → "${name}"`);
        fixed++;
      }
    }
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}, Total: ${exercises.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
