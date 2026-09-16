/**
 * Vocabulario de clasificación biomecánica.
 *
 * Hasta ahora `exercise-classifier.ts` adivinaba el rol y el patrón de cada
 * ejercicio a partir de palabras clave del nombre en español. Eso falla con
 * nombres mal escritos, traducidos a medias o en otro idioma — que es
 * exactamente lo que tiene nuestro catálogo (ver docs/exercise-catalog-audit.md).
 *
 * El esquema de abajo sustituye la adivinanza por un dato etiquetado. Las
 * heurísticas siguen ahí como respaldo para lo que aún no tiene etiqueta.
 */

/** Multiarticular vs monoarticular. Decide si abre la sesión o la cierra. */
export type Mechanics = "compound" | "isolation";

/** Empuje, tracción, o ninguno de los dos (isométricos, abducciones). */
export type ForceType = "push" | "pull" | "static";

/** Si el ejercicio se ejecuta a dos lados a la vez o uno cada vez. */
export type Laterality = "bilateral" | "unilateral";

/**
 * Patrón de movimiento. Un patrón describe QUÉ hace la articulación, no qué
 * músculo se siente: por eso un jalón y una dominada comparten patrón aunque
 * cambien de equipamiento, y por eso repetir patrón dentro de una sesión es
 * redundante aunque los ejercicios se llamen distinto.
 */
export type MovementPattern =
  // Tren superior
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "fly"
  | "shoulder_extension"
  | "shoulder_abduction"
  | "shoulder_flexion"
  | "shoulder_horizontal_abduction"
  | "scapular_elevation"
  | "elbow_flexion"
  | "elbow_extension"
  | "wrist_flexion"
  | "wrist_extension"
  // Tren inferior
  | "knee_dominant"
  | "knee_extension"
  | "knee_flexion"
  | "hip_hinge"
  | "hip_extension"
  | "hip_abduction"
  | "hip_adduction"
  | "hip_flexion"
  | "ankle_plantar_flexion"
  // Core
  | "spinal_flexion"
  | "anti_extension"
  | "anti_rotation"
  | "rotational"
  // Otros
  | "loaded_carry"
  | "locomotion";

export const MOVEMENT_PATTERNS: MovementPattern[] = [
  "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull", "fly",
  "shoulder_extension", "shoulder_abduction", "shoulder_flexion",
  "shoulder_horizontal_abduction", "scapular_elevation",
  "elbow_flexion", "elbow_extension", "wrist_flexion", "wrist_extension",
  "knee_dominant", "knee_extension", "knee_flexion", "hip_hinge", "hip_extension",
  "hip_abduction", "hip_adduction", "hip_flexion", "ankle_plantar_flexion",
  "spinal_flexion", "anti_extension", "anti_rotation", "rotational",
  "loaded_carry", "locomotion",
];

export interface ExerciseClassification {
  mechanics: Mechanics;
  pattern: MovementPattern;
  force: ForceType;
  laterality: Laterality;
}

/**
 * Dos ejercicios con el mismo patrón compiten por el mismo hueco de la sesión.
 * El planner lo usa para no montar una rutina de pecho que sean tres press
 * horizontales con distinto nombre.
 */
export function samePattern(a: MovementPattern, b: MovementPattern): boolean {
  return a === b;
}

/** Etiqueta válida llegada de la BD, o null si la fila aún no está etiquetada. */
export function parseClassification(row: {
  mechanics?: string | null;
  movement_pattern?: string | null;
  force_type?: string | null;
  laterality?: string | null;
}): ExerciseClassification | null {
  const { mechanics, movement_pattern, force_type, laterality } = row;
  if (!mechanics || !movement_pattern) return null;
  if (mechanics !== "compound" && mechanics !== "isolation") return null;
  if (!MOVEMENT_PATTERNS.includes(movement_pattern as MovementPattern)) return null;
  return {
    mechanics,
    pattern: movement_pattern as MovementPattern,
    force: (force_type === "push" || force_type === "pull" ? force_type : "static"),
    laterality: laterality === "unilateral" ? "unilateral" : "bilateral",
  };
}
