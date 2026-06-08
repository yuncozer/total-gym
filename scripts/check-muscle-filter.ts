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
  const { data } = await supabase
    .from("exercises")
    .select("id, name, muscle_ids, secondary_muscle_ids")
    .eq("category_id", 11)
    .eq("is_active", true);

  if (!data) return;

  const primaryIds = [4];      // pectoral mayor
  const secondaryIds = [1, 5]; // biceps, triceps

  const excluded = data.filter((e: any) => {
    const m = e.muscle_ids || [];
    const sm = e.secondary_muscle_ids || [];
    const hasPrimary = m.some((id: number) => primaryIds.includes(id));
    const hasSecondary = sm.some((id: number) => secondaryIds.includes(id));
    return !hasPrimary && !hasSecondary;
  });

  console.log(`Total en DB (cat 11): ${data.length}`);
  console.log(`Excluidos por filtro muscular: ${excluded.length}`);
  excluded.forEach((e: any) => {
    console.log(`  ${e.id}|${e.name}|muscles=${JSON.stringify(e.muscle_ids)}|sec=${JSON.stringify(e.secondary_muscle_ids)}`);
  });
}

main();
