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
  // Check images of all 5 "Press de Pecho en Máquina" duplicates
  const { data } = await supabase
    .from("exercises")
    .select("id, name, image_url")
    .in("id", [129, 379, 1655, 1883, 1918])
    .order("id");

  if (data) {
    console.log("=== Press de Pecho en Máquina - imágenes ===\n");
    data.forEach((x: any) => {
      console.log(`ID=${x.id}: ${x.name}`);
      console.log(`  image_url: ${x.image_url || "(ninguna)"}`);
      console.log();
    });
  }
}

main();
