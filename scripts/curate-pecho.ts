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
  // IDs to deactivate (non-chest, duplicates)
  const deactivateIds = [57, 132, 683, 687, 688, 996, 997, 998, 1198, 1451, 1591, 1716, 1832, 1778, 1793];

  // IDs to fix muscle data
  const muscleFixIds = [801, 1001, 1353, 1583, 1897, 1919];

  // Update 1918 name
  const { error: e1 } = await supabase
    .from("exercises")
    .update({ name: "Press de pecho en máquina", updated_at: new Date().toISOString() })
    .eq("id", 1918);
  if (e1) console.error("1918 name error:", e1.message);
  else console.log("1918: Press de pecho en máquina ✓");

  // Deactivate non-chest exercises
  const { error: e2 } = await supabase
    .from("exercises")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("id", deactivateIds);
  if (e2) console.error("Deactivate error:", e2.message);
  else console.log(`Deactivated ${deactivateIds.length} exercises ✓`);

  // Fix muscle_ids for chest exercises that had empty muscle data
  // Assign pectoral major (4) as primary, and appropriate secondary
  const { data: chestRefs } = await supabase
    .from("exercises")
    .select("id, name, muscle_ids, secondary_muscle_ids")
    .eq("category_id", 11)
    .in("id", [73, 75, 185, 186, 188]); // reference: known chest exercises

  if (chestRefs) {
    console.log("\nReference muscle_ids for chest exercises:");
    chestRefs.forEach((e: any) => console.log(`  ${e.id}|${e.name}|muscles=${JSON.stringify(e.muscle_ids)}|sec=${JSON.stringify(e.secondary_muscle_ids)}`));
  }

  // Assign muscle_ids: pectoral (4) primary, triceps (5) + biceps (1) secondary
  const { error: e3 } = await supabase
    .from("exercises")
    .update({ 
      muscle_ids: [4], 
      secondary_muscle_ids: [1, 5], 
      updated_at: new Date().toISOString() 
    })
    .in("id", muscleFixIds);
  if (e3) console.error("Muscle fix error:", e3.message);
  else console.log(`Fixed muscle_ids for ${muscleFixIds.length} exercises ✓`);

  // Final count
  const { data: active } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .eq("category_id", 11)
    .eq("is_active", true);
  console.log(`\nPecho activos después: ${active}`);
}

main();
