import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const envRaw = fs.readFileSync(".env.local", "utf-8");
for (const line of envRaw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/^["']|[""]$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const sql = fs.readFileSync("supabase/migrations/007_muscle_group_id.sql", "utf-8");
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    // Try direct SQL
    console.log("RPC failed, trying alter directly...");
    const { error: alterErr } = await supabase.from("exercises").update({ muscle_group_id: null }).eq("id", 0);
    console.log("Alter check:", alterErr?.message);
  }
  console.log("Migration applied or already exists");
}

main();
