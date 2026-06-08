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

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const { data } = await supabase
    .from("exercises")
    .select("id, name, image_url")
    .eq("category_id", 11)
    .eq("is_active", true)
    .order("id");

  if (!data) return;

  const names = data.map((e: any) => ({ id: e.id, name: e.name, normalized: normalize(e.name), hasImg: !!(e.image_url) }));
  const seen = new Map<string, typeof names>();

  names.forEach((n) => {
    const key = n.normalized;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(n);
  });

  console.log("=== Duplicados exactos (mismo nombre normalizado) ===\n");
  let exactDupes = 0;
  seen.forEach((group) => {
    if (group.length > 1) {
      exactDupes++;
      console.log(`"${group[0].name}" (x${group.length}):`);
      group.forEach((n) => console.log(`  ID=${n.id}${n.hasImg ? " 🖼️" : ""}`));
      console.log();
    }
  });
  if (exactDupes === 0) console.log("(ninguno)\n");

  // Find similar by checking if one name contains another
  console.log("=== Posibles duplicados semánticos ===\n");
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i];
      const b = names[j];
      if (a.normalized === b.normalized) continue;

      // Check if names are very similar (one contains the other, or high word overlap)
      const aWords = new Set(a.normalized.split(" "));
      const bWords = new Set(b.normalized.split(" "));
      const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
      const union = new Set([...aWords, ...bWords]);
      const jaccard = intersection.size / union.size;

      if (jaccard > 0.7 && a.normalized.length > 5 && b.normalized.length > 5) {
        console.log(`  "${a.name}" (ID=${a.id}${a.hasImg ? " 🖼️" : ""})`);
        console.log(`  "${b.name}" (ID=${b.id}${b.hasImg ? " 🖼️" : ""})`);
        console.log(`  Similitud: ${(jaccard * 100).toFixed(0)}%\n`);
      }

      // Check if one name is substring of the other (after normalization)
      if (a.normalized.includes(b.normalized) && a.normalized.length !== b.normalized.length) {
        console.log(`  "${a.name}" (ID=${a.id}${a.hasImg ? " 🖼️" : ""})`);
        console.log(`  → contiene → "${b.name}" (ID=${b.id}${b.hasImg ? " 🖼️" : ""})\n`);
      } else if (b.normalized.includes(a.normalized) && a.normalized.length !== b.normalized.length) {
        console.log(`  "${b.name}" (ID=${b.id}${b.hasImg ? " 🖼️" : ""})`);
        console.log(`  → contiene → "${a.name}" (ID=${a.id}${a.hasImg ? " 🖼️" : ""})\n`);
      }
    }
  }
}

main();
