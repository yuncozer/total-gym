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
  const lower = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Triceps indicators
  if (/tr[ie]ceps|press fr[ae]nc[ée]s|extensi[oó]n.*tr[ie]c|rompecr[áa]neo|skull.*crusher|tr[ie]cep.*empuje|patada.*tr[ie]c|fondos|dips|jm press|tate press/.test(lower)) return "triceps";
  // Biceps indicators
  if (/b[íi]ceps|curl|martillo|b[íi]cep.*concentrado|bayesian|zottman|predicador/.test(lower)) return "biceps";
  // Push-up / chest variants miscategorized as arms
  if (/flexion|plancha/.test(lower)) return "pecho";
  // Default
  return "biceps";
}

function classifyLeg(name: string): string {
  const lower = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

  const toUpdate: Record<string, number[]> = {};

  for (const ex of exercises) {
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
      if (!toUpdate[groupId]) toUpdate[groupId] = [];
      toUpdate[groupId].push(ex.id);
    }
  }

  let totalUpdated = 0;
  for (const [groupId, ids] of Object.entries(toUpdate)) {
    if (ids.length === 0) continue;
    const { error: upErr } = await supabase
      .from("exercises")
      .update({ muscle_group_id: groupId })
      .in("id", ids);
    if (upErr) {
      console.error(`Error updating group "${groupId}":`, upErr);
    } else {
      totalUpdated += ids.length;
      console.log(`${groupId}: ${ids.length} exercises`);
    }
  }

  console.log(`\nTotal: ${totalUpdated} exercises tagged`);
}

main().catch(console.error);
