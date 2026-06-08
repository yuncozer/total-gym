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

// Reverse lookup: wgerCategoryId -> group name
const CATEGORY_MAP: Record<number, string> = {
  11: "pecho",
  12: "espalda",
  13: "hombros",
  8: "brazos",    // biceps + triceps shared
  9: "piernas",   // piernas + gluteos shared
  10: "abdomen",
  14: "pantorrillas",
};

async function main() {
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, category_id")
    .eq("is_active", true)
    .order("category_id")
    .order("name");

  if (error || !exercises) {
    console.error("Error:", error?.message);
    return;
  }

  const groups: Record<string, { id: number; name: string }[]> = {};
  for (const ex of exercises) {
    const g = CATEGORY_MAP[ex.category_id] || `cat-${ex.category_id}`;
    if (!groups[g]) groups[g] = [];
    groups[g].push({ id: ex.id, name: ex.name });
  }

  for (const [group, items] of Object.entries(groups)) {
    console.log(`\n=== ${group.toUpperCase()} (${items.length}) ===`);
    for (const item of items) {
      console.log(`  ${item.id}: ${item.name}`);
    }
  }
}

main().catch(console.error);
