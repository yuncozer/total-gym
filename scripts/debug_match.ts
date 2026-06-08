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
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("id", 925)
    .single();

  if (error || !data) {
    console.error("Error:", error?.message);
    return;
  }

  const name = data.name;
  console.log("Name:", JSON.stringify(name));
  console.log("Bytes:", [...name].map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" "));

  // Check what split gives us
  const words = name.split(/(\s+)/);
  console.log("Split words:", JSON.stringify(words));

  for (let i = 0; i < words.length; i++) {
    console.log(`  Word[${i}]:`, JSON.stringify(words[i]), "bytes:", [...words[i]].map((c) => c.charCodeAt(0).toString(16)).join(" "));
  }

  // Try dictionary lookup
  const dictKey = "M??quina";
  console.log("\nDict key:", JSON.stringify(dictKey));
  console.log("Dict key bytes:", [...dictKey].map((c) => c.charCodeAt(0).toString(16)).join(" "));
  console.log("Match result:", words[8] === dictKey);
  console.log("Match code:", words[8].charCodeAt(0), words[8].charCodeAt(1), words[8].charCodeAt(2), words[8].charCodeAt(3));
  console.log("Dict code:", dictKey.charCodeAt(0), dictKey.charCodeAt(1), dictKey.charCodeAt(2), dictKey.charCodeAt(3));

  // Word comparison
  for (const w of words) {
    if (w.length > 1 && w.indexOf("?") >= 0) {
      console.log("\nWord with ?:", JSON.stringify(w));
      console.log("  Is M??quina?", w === "M??quina");
      console.log("  Chars:", w.split("").map((c: string) => `${c}(${c.charCodeAt(0)})`).join(" "));
    }
  }
}

main().catch(console.error);
