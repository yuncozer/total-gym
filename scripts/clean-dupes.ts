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
  // 1. Copy image from 1655 to 129
  const { data: imgData } = await supabase
    .from("exercises")
    .select("image_url")
    .eq("id", 1655)
    .single();

  if (imgData?.image_url) {
    const { error: e1 } = await supabase
      .from("exercises")
      .update({ image_url: imgData.image_url, updated_at: new Date().toISOString() })
      .eq("id", 129);

    if (e1) console.error("Error updating 129 image:", e1.message);
    else console.log(`✓ Imagen de 1655 copiada a ID 129: ${imgData.image_url}`);
  }

  // 2. Deactivate duplicates (379, 1655, 1883, 1918)
  const dupes = [379, 1655, 1883, 1918];
  const { error: e2 } = await supabase
    .from("exercises")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("id", dupes);

  if (e2) console.error("Error deactivating:", e2.message);
  else console.log(`✓ Desactivados duplicados: ${dupes.join(", ")}`);

  // 3. Deactivate "Flexiones Inclinadas" duplicate (keep 313, deactivate 1111)
  // Actually wait, let me check which one has image... 313 no, 1111 no. Neither has image.
  // Let the user decide later. For now, deactivate 1111.
  const { error: e3 } = await supabase
    .from("exercises")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", 1111);
  if (e3) console.error("Error:", e3.message);
  else console.log("✓ Desactivado 1111 (Flexiones Inclinadas duplicado)");

  // Flexiones Declinadas duplicate: keep 1112 (has image), deactivate 188
  const { error: e4 } = await supabase
    .from("exercises")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", 188);
  if (e4) console.error("Error:", e4.message);
  else console.log("✓ Desactivado 188 (Flexiones Declinadas duplicado)");

  // Press Inclinado en Smith duplicate: neither has image, keep 1508, deactivate 1692
  const { error: e5 } = await supabase
    .from("exercises")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", 1692);
  if (e5) console.error("Error:", e5.message);
  else console.log("✓ Desactivado 1692 (Press Inclinado en Smith duplicado)");

  console.log("\n✅ Limpieza de duplicados completa");
}

main();
