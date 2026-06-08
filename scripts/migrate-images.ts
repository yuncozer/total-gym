import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// ---- Load env ----
const envRaw = fs.readFileSync(".env.local", "utf-8");
for (const line of envRaw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL!;
const BUCKET = "exercise-images";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

// ---- Helpers ----
function getFilenameFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    return parts[parts.length - 1];
  } catch {
    return "unknown";
  }
}

function storagePath(exerciseId: number, filename: string): string {
  return `${exerciseId}/${filename}`;
}

function publicUrl(path: string): string {
  return `${STORAGE_BASE}/${BUCKET}/${path}`;
}

async function download(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error("    [SKIP] HTTP " + res.status + " " + url);
      return null;
    }
    return await res.arrayBuffer();
  } catch (err) {
    console.error("    [SKIP] fetch error: " + url + " — " + (err instanceof Error ? err.message : String(err)));
    return null;
  }
}

async function uploadToStorage(
  buffer: ArrayBuffer,
  path: string
): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("    [UPLOAD FAIL] " + path + " — " + error.message);
    return false;
  }
  return true;
}

// ---- Main ----
async function main() {
  console.log("=== Migrate exercise images to Supabase Storage ===\n");

  // 1. Get all rows with images
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("exercises")
    .select("id, image_url, images")
    .not("image_url", "is", null);

  if (fetchError) {
    console.error("Error fetching exercises:", fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No exercises with images found.");
    process.exit(0);
  }

  console.log("Exercises with images: " + rows.length);

  // 2. Collect unique image URLs per exercise
  type ImageEntry = {
    exerciseId: number;
    url: string;
    type: "main" | "secondary";
  };
  const allImages: ImageEntry[] = [];

  for (const row of rows) {
    if (row.image_url) {
      allImages.push({ exerciseId: row.id, url: row.image_url, type: "main" });
    }
    if (row.images && Array.isArray(row.images)) {
      for (const img of row.images) {
        if (img && typeof img === "string") {
          allImages.push({ exerciseId: row.id, url: img, type: "secondary" });
        }
      }
    }
  }

  console.log("Total images to process: " + allImages.length + "\n");

  // 3. Process each image: download -> upload -> record new URL
  const urlMap = new Map<string, string>(); // old URL -> new Storage URL
  let downloaded = 0;
  let uploaded = 0;
  let skipped = 0;

  for (const entry of allImages) {
    if (urlMap.has(entry.url)) continue; // already processed same URL

    const filename = getFilenameFromUrl(entry.url);
    const path = storagePath(entry.exerciseId, filename);
    const newUrl = publicUrl(path);

    process.stdout.write("  [" + (downloaded + skipped + 1) + "/" + allImages.length + "] " + entry.exerciseId + "/" + filename + " ... ");

    // Check if already uploaded
    const { data: existing } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(String(entry.exerciseId), { search: filename });

    if (existing && existing.length > 0) {
      console.log("exists");
      urlMap.set(entry.url, newUrl);
      uploaded++;
      continue;
    }

    const buffer = await download(entry.url);
    if (!buffer) {
      skipped++;
      console.log("  [SKIP] cannot download");
      continue;
    }

    const ok = await uploadToStorage(buffer, path);
    if (ok) {
      urlMap.set(entry.url, newUrl);
      uploaded++;
      downloaded++;
      console.log("ok");
    } else {
      skipped++;
    }
  }

  // 4. Update DB rows with new URLs
  console.log("\n=== Updating database ===");
  let updated = 0;

  for (const row of rows) {
    const updates: Record<string, string | string[] | null> = {};

    if (row.image_url && urlMap.has(row.image_url)) {
      updates.image_url = urlMap.get(row.image_url)!;
    }

    if (row.images && Array.isArray(row.images)) {
      const newImages: string[] = [];
      for (const img of row.images) {
        if (img && typeof img === "string" && urlMap.has(img)) {
          newImages.push(urlMap.get(img)!);
        } else if (img && typeof img === "string") {
          newImages.push(img); // keep original if not migrated
        }
      }
      if (newImages.length > 0) {
        updates.images = newImages;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from("exercises")
        .update(updates)
        .eq("id", row.id);

      if (error) {
        console.error("  [ERR] id=" + row.id + " " + error.message);
      } else {
        updated++;
      }
    }
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log("  Total image URLs processed: " + allImages.length);
  console.log("  Unique URLs downloaded:     " + downloaded);
  console.log("  Already existed:            " + (uploaded - downloaded));
  console.log("  Skipped (failed):           " + skipped);
  console.log("  Rows updated in DB:         " + updated + " / " + rows.length);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
