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

function classifyArm(name: string): string {
  const lower = name.toLowerCase();
  // Triceps indicators
  if (/tr[ie]ceps|press fr[ae]nc[ée]s|extensi[oó]n.*tr[ie]c|rompecr[áa]neo|skull.*crusher|tr[ie]cep.*empuje|patada.*tr[ie]c|fondos|dips|jm press|tate press/.test(lower)) return "triceps";
  // Biceps indicators
  if (/b[íi]ceps|curl|martillo|b[íi]cep.*concentrado|bayesian|zottman|predicador/.test(lower)) return "biceps";
  // Default
  return "biceps";
}

function classifyLeg(name: string): string {
  const lower = name.toLowerCase();
  // Gluteos indicators
  if (/gl[úu]te[oó]|hip thrust|empuje de cadera|cadera empuje|abducci[oó]n|patada.*gl[úu]te|clamshell|clam|fire hydrant|puente de gl[úu]teo|glute bridge|cadera puente|gl[úu]teos drive|patada trasera|p[ée]ndulo|arabesque|piernas swings/.test(lower)) return "gluteos";
  // Default to piernas
  return "piernas";
}

async function main() {
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, category_id, muscle_group_id")
    .eq("is_active", true);

  if (error) { console.error(error); return; }
  if (!exercises) return;

  let updated = 0;
  for (const ex of exercises) {
    if (ex.muscle_group_id) continue;

    let groupId: string | null = null;

    switch (ex.category_id) {
      case 11: groupId = "pecho"; break;
      case 12: groupId = "espalda"; break;
      case 13: groupId = "hombros"; break;
      case 10: groupId = "abdomen"; break;
      case 14: groupId = "pantorrillas"; break;
      case 99: groupId = "antebrazos"; break;
      case 15: groupId = "cardio"; break;
      case 8:  groupId = classifyArm(ex.name); break;
      case 9:  groupId = classifyLeg(ex.name); break;
    }

    if (groupId) {
      const { error: upErr } = await supabase
        .from("exercises")
        .update({ muscle_group_id: groupId })
        .eq("id", ex.id);
      if (upErr) console.error(`Error updating ${ex.id}:`, upErr);
      else updated++;
    }
  }

  console.log(`Tagged ${updated} exercises with muscle_group_id`);

  // Summary
  const { data: summary } = await supabase
    .from("exercises")
    .select("muscle_group_id, count")
    .eq("is_active", true)
    .not("muscle_group_id", "is", null);
  const counts: Record<string, number> = {};
  for (const s of summary || []) {
    const g = (s as any).muscle_group_id;
    counts[g] = (counts[g] || 0) + 1;
  }
  console.log("Tag distribution:", counts);
}

main();
