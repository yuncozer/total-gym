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
    .select("id, name, description")
    .in("id", [129, 1655])
    .order("id");

  if (data) {
    data.forEach((x: any) => {
      console.log(`=== ID=${x.id}: ${x.name} ===`);
      console.log(x.description || "(sin descripción)");
      console.log();
    });
  }
}

main();
