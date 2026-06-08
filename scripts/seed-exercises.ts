import { createClient } from "@supabase/supabase-js";
import { fetchExercisesByCategory } from "../app/lib/wgerApi";
import { muscleGroupsData } from "../lib/data/ejercicios";
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

const groups = muscleGroupsData.filter((g) => g.id !== "cardio");

async function main() {
  const results: { group: string; total: number; ok: number; err: number }[] = [];

  for (const group of groups) {
    process.stdout.write(`  ${group.name.toLowerCase().padEnd(14)} `);
    try {
      const exercises = await fetchExercisesByCategory(group.wgerCategoryId);
      let ok = 0;
      let err = 0;

      for (const ex of exercises) {
        const { error } = await supabase.from("exercises").upsert(
          {
            id: parseInt(ex.id),
            uuid: ex.uuid,
            name: ex.name,
            description: ex.description,
            category: ex.category,
            category_id: ex.categoryId,
            muscles: ex.muscles,
            muscle_ids: ex.muscleIds,
            secondary_muscles: ex.secondaryMuscles,
            secondary_muscle_ids: ex.secondaryMuscleIds,
            equipment: ex.equipment,
            equipment_ids: ex.equipmentIds,
            equipment_category: ex.equipmentCategory,
            image_url: ex.imageUrl,
            images: ex.images,
            variation_group: ex.variationGroup,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        if (error) {
          console.error(`\n    [ERR] id=${ex.id} ${error.message}`);
          err++;
        } else {
          ok++;
        }
      }

      console.log(`${exercises.length} ejercicios  (${ok} ok, ${err} err)`);
      results.push({ group: group.name, total: exercises.length, ok, err });
    } catch (e) {
      console.log(`ERROR — ${e instanceof Error ? e.message : String(e)}`);
      results.push({ group: group.name, total: 0, ok: 0, err: 0 });
    }
  }

  console.log("\n┌───────────────────────────────────────┐");
  console.log("│          RESUMEN DE LA CARGA           │");
  console.log("├───────────────────────────────────────┤");
  let total = 0;
  let totalOk = 0;
  for (const r of results) {
    const line = ` ${r.group.padEnd(14)} ${String(r.total).padStart(4)} ejercicios`;
    console.log(`│${line.padEnd(39)}│`);
    total += r.total;
    totalOk += r.ok;
  }
  console.log("├───────────────────────────────────────┤");
  const line = ` Total                         ${String(total).padStart(4)} ejercicios`;
  console.log(`│${line.padEnd(39)}│`);
  console.log("└───────────────────────────────────────┘");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
