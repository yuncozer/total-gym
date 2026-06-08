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
  const categoryId = Number(process.argv[2] || "9");
  console.error(`Fetching category ${categoryId}...`);
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("category_id", categoryId)
    .neq("is_active", false)
    .order("id");

  if (error) {
    console.error("Error:", error.message);
    return;
  }
  console.error(`Got ${data?.length || 0} rows`);
  if (data) {
    data.forEach((e: { id: number; name: string }) => console.log(`${e.id}|${e.name}`));
  }
}

main();
