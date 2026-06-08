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
  const toDeactivate = [
    // duplicates
    1193, // Abdominales rusas — dupe of 1089
    // not abdomen
    9,     // Swing con Pesa Rusa → glutes/cardio
    958,   // Curl de Bíceps con TRX → brazos
    959,   // Remo en TRX → espalda
    960,   // Swing → glutes/cardio
    977,   // Sentadilla al Cajón → piernas
    980,   // Dominadas Comando → espalda
    1103,  // Puente Caminando → glúteos
    1248,  // Dominada a Palanca → espalda
    1252,  // Frontal Lever Jalón-up → espalda
    1292,  // Dominadas con Agarre Inverso → espalda
    1293,  // Press Ups a un Brazo → pecho
    1474,  // Elevación en W → hombros/espalda
    1590,  // Estiramiento de Brazos y Cuello → stretching
    1687,  // Bear crawl → core... leave it
    1776,  // Suitcase Carry → core... leave it
    1823,  // Clamshell → glúteos
    1966,  // Rotación Torácica → mobility
  ];

  const { error } = await supabase
    .from("exercises")
    .update({ is_active: false })
    .in("id", toDeactivate);
  if (error) { console.error(error); return; }
  console.log(`Deactivated ${toDeactivate.length} exercises`);
}

main();
