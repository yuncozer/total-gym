export type ExerciseRole = "compound" | "isolation" | "stabilization";

export interface ExerciseProfile {
  role: ExerciseRole;
  pattern: string;
}

function kw(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function classifyPecho(name: string): ExerciseProfile {
  if (kw(name, ["dips", "fondo", "chest dip"]))
    return { role: "compound", pattern: "dip" };
  if (kw(name, ["apertura", "fly", "cruce", "crossover", "cruz", "pec deck", "vuelo"]))
    return { role: "isolation", pattern: "fly" };
  if (kw(name, ["pullover"]))
    return { role: "compound", pattern: "pullover" };
  if (kw(name, ["flexión", "push up", "pushup", "lagartija"]))
    return { role: "compound", pattern: "press" };
  return { role: "compound", pattern: "press" };
}

function classifyEspalda(name: string): ExerciseProfile {
  if (kw(name, ["dominada", "pull-up", "pull up", "pulldown", "lat", "jalón", "chin-up", "chin up"]))
    return { role: "compound", pattern: "vertical_pull" };
  if (kw(name, ["remo", "row", "t-bar", "pendlay"]))
    return { role: "compound", pattern: "horizontal_pull" };
  if (kw(name, ["peso muerto", "deadlift", "rdl", "rumano", "stiff", "piernas rígidas", "buenos días", "good morning"]))
    return { role: "compound", pattern: "deadlift" };
  if (kw(name, ["hyperextension", "espalda extensión", "superman", "pullover"]))
    return { role: "compound", pattern: "extension" };
  if (kw(name, ["apertura inversa", "face pull", "jalón la cara", "rear delt", "posterior delt", "posterior"]))
    return { role: "isolation", pattern: "rear_delt" };
  if (kw(name, ["encogimiento", "shrug", "trap"]))
    return { role: "isolation", pattern: "shrug" };
  return { role: "compound", pattern: "horizontal_pull" };
}

function classifyHombros(name: string): ExerciseProfile {
  if (kw(name, ["press", "militar", "ohp", "arnold", "overhead", "push press"]))
    return { role: "compound", pattern: "overhead_press" };
  if (kw(name, ["lateral", "side lateral", "side raise"]))
    return { role: "isolation", pattern: "lateral_raise" };
  if (kw(name, ["frontal", "front raise", "elevación frontal"]))
    return { role: "isolation", pattern: "front_raise" };
  if (kw(name, ["posterior", "rear delt", "apertura inversa", "face pull", "jalón la cara", "pec deck inverso", "inverso"]))
    return { role: "isolation", pattern: "rear_delt" };
  if (kw(name, ["encogimiento", "shrug", "trap"]))
    return { role: "isolation", pattern: "shrug" };
  if (kw(name, ["remo al mentón", "vertical remo", "upright row"]))
    return { role: "compound", pattern: "upright_row" };
  if (kw(name, ["handstand", "pino", "paralela", "planche", ""]))
    return { role: "compound", pattern: "overhead_press" };
  return { role: "compound", pattern: "overhead_press" };
}

function classifyBiceps(name: string): ExerciseProfile {
  if (kw(name, ["martillo", "hammer"]))
    return { role: "isolation", pattern: "hammer_curl" };
  if (kw(name, ["concentrado", "concentration"]))
    return { role: "isolation", pattern: "curl" };
  if (kw(name, ["zottman", "bayesian", "araña", "drag", "cheat", "predicador", "inclinado", "curl"]))
    return { role: "isolation", pattern: "curl" };
  return { role: "isolation", pattern: "curl" };
}

function classifyTriceps(name: string): ExerciseProfile {
  if (kw(name, ["extensión", "extension", "pushdown", "polea", "overhead", "patada", "kickback"]))
    return { role: "isolation", pattern: "extension" };
  if (kw(name, ["press francés", "skull crusher", "skull", "acostado", "tate"]))
    return { role: "isolation", pattern: "extension" };
  if (kw(name, ["dips", "fondo"]))
    return { role: "compound", pattern: "dip" };
  if (kw(name, ["press cerrado", "close grip", "jm press"]))
    return { role: "compound", pattern: "close_grip_press" };
  return { role: "isolation", pattern: "extension" };
}

function classifyPiernas(name: string): ExerciseProfile {
  if (kw(name, ["sentadilla", "squat", "hack"]))
    return { role: "compound", pattern: "squat" };
  if (kw(name, ["prensa", "leg press"]))
    return { role: "compound", pattern: "squat" };
  if (kw(name, ["peso muerto", "deadlift", "rdl", "rumano", "stiff", "piernas rígidas", "buenos días", "good morning"]))
    return { role: "compound", pattern: "hinge" };
  if (kw(name, ["zancada", "lunge", "estocada", "split"]))
    return { role: "compound", pattern: "lunge" };
  if (kw(name, ["extensión", "extension", "cuádriceps", "quad"]))
    return { role: "isolation", pattern: "extension" };
  if (kw(name, ["curl", "femoral", "isquiotibial", "nórdico", "nordic"]))
    return { role: "isolation", pattern: "curl" };
  if (kw(name, ["elevación de piernas"]))
    return { role: "isolation", pattern: "extension" };
  if (kw(name, ["subida", "step up", "cajón"]))
    return { role: "compound", pattern: "lunge" };
  if (kw(name, ["abducción", "aducción", "hip thrust"]))
    return { role: "isolation", pattern: "abduction" };
  return { role: "compound", pattern: "squat" };
}

function classifyGluteos(name: string): ExerciseProfile {
  if (kw(name, ["hip thrust", "empuje de cadera", "puente", "glute bridge"]))
    return { role: "compound", pattern: "hip_thrust" };
  if (kw(name, ["abducción", "clamshell", "concha"]))
    return { role: "isolation", pattern: "abduction" };
  if (kw(name, ["patada", "kickback", "arabesque", "péndulo"]))
    return { role: "isolation", pattern: "kickback" };
  if (kw(name, ["extensión de glúteo", "glute extension", "prensa"]))
    return { role: "compound", pattern: "hip_thrust" };
  return { role: "compound", pattern: "hip_thrust" };
}

function classifyAbdomen(name: string): ExerciseProfile {
  if (kw(name, ["plancha", "plank", "hollow", "barquito", "bird dog", "sphinx"]))
    return { role: "stabilization", pattern: "plank" };
  if (kw(name, ["elevación de piernas", "leg raise", "rodilla", "knee", "toes to bar", "dragon flag", "windshield"]))
    return { role: "compound", pattern: "leg_raise" };
  if (kw(name, ["crunch", "abdominal", "sit up", "sit-up", "curl", "encogimiento"]))
    return { role: "isolation", pattern: "crunch" };
  if (kw(name, ["ruso", "russian", "rotación", "twist", "woodchopper", "pallof", "landmine", "corkscrew"]))
    return { role: "isolation", pattern: "rotation" };
  if (kw(name, ["rollout", "ab wheel", "v-up", "pike"]))
    return { role: "compound", pattern: "rollout" };
  if (kw(name, ["bicicleta", "bicycle", "flutter", "tijera", "scissor"]))
    return { role: "isolation", pattern: "crunch" };
  if (kw(name, ["l sit", "l-sit", "frontal lever", "lever"]))
    return { role: "stabilization", pattern: "plank" };
  return { role: "isolation", pattern: "crunch" };
}

export function classifyExercise(
  name: string,
  muscleGroup: string
): ExerciseProfile {
  switch (muscleGroup) {
    case "pecho":
      return classifyPecho(name);
    case "espalda":
      return classifyEspalda(name);
    case "hombros":
      return classifyHombros(name);
    case "biceps":
      return classifyBiceps(name);
    case "triceps":
      return classifyTriceps(name);
    case "piernas":
      return classifyPiernas(name);
    case "gluteos":
      return classifyGluteos(name);
    case "cuadriceps":
      return { role: "isolation", pattern: "extension" };
    case "femoral":
      return { role: "isolation", pattern: "curl" };
    case "pantorrillas":
      return { role: "isolation", pattern: "calf_raise" };
    case "abdomen":
      return classifyAbdomen(name);
    default:
      return { role: "isolation", pattern: "general" };
  }
}
