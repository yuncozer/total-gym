export const WGER_API_BASE = "https://wger.de/api/v2";
export const WGER_LANGUAGE_SPANISH = 4;

export interface WgerEquipment {
  id: number;
  name: string;
}

export interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string | null;
  image_url_secondary: string | null;
}

export interface WgerCategory {
  id: number;
  name: string;
}

export interface WgerExerciseInfo {
  id: number;
  uuid: string;
  category: {
    id: number;
    name: string;
  };
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  images: {
    id: number;
    image: string;
    is_main: boolean;
  }[];
  translations: {
    id: number;
    name: string;
    description: string;
    language: number;
  }[];
  variation_group: string | null;
}

export interface WgerExercise {
  id: number;
  uuid: string;
  category: number;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  variation_group: string | null;
  license_author: string;
}

export const CATEGORY_MAP: Record<string, number> = {
  pecho: 11,
  espalda: 12,
  hombros: 13,
  biceps: 8,
  triceps: 8,
  brazos: 8,
  piernas: 9,
  gluteos: 9,
  abdomen: 10,
  pantorrillas: 14,
  cardio: 15,
  abs: 10,
  arms: 8,
  back: 12,
  calves: 14,
  chest: 11,
  legs: 9,
  shoulders: 13,
};

export const EQUIPMENT_MAP: Record<number, string> = {
  1: "Barra",
  2: "Barra EZ",
  3: "Mancuernas",
  4: "Mat de gym",
  5: "Balón suizo",
  6: "Barra fija",
  7: "Peso corporal",
  8: "Banco",
  9: "Banco inclinado",
  10: "Kettlebell",
  11: "Banda elástica",
};

export const EQUIPMENT_CATEGORY_MAP: Record<number, string> = {
  1: "barbell",
  2: "barbell",
  3: "dumbbell",
  4: "other",
  5: "other",
  6: "body weight",
  7: "body weight",
  8: "other",
  9: "other",
  10: "other",
  11: "other",
};

export const EQUIPMENT_CATEGORIES = {
  all: "Todos",
  barbell: "Barra",
  dumbbell: "Mancuernas",
  body_weight: "Peso corporal",
  other: "Otros",
};

export const MUSCLE_MAP: Record<number, string> = {
  1: "Bíceps braquial",
  2: "Deltoide anterior",
  3: "Serrato anterior",
  4: "Pectoral mayor",
  5: "Tríceps",
  6: "Recto abdominal",
  7: "Gemelo (Gastrocnemio)",
  8: "Glúteo mayor",
  9: "Trapecio",
  10: "Cuádriceps",
  11: "Bíceps femoral (Isquiotibiales)",
  12: "Dorsal ancho",
  13: "Braquial",
  14: "Oblicuo externo",
  15: "Sóleo",
};

export const CATEGORY_NAME_MAP: Record<number, string> = {
  8: "Brazos",
  10: "Abdomen",
  11: "Pecho",
  12: "Espalda",
  13: "Hombros",
  14: "Pantorrillas",
  15: "Cardio",
  9: "Piernas",
};

export interface Exercise {
  id: string;
  uuid: string;
  name: string;
  description: string;
  category: string;
  categoryId: number;
  muscles: string[];
  muscleIds: number[];
  secondaryMuscles: string[];
  secondaryMuscleIds: number[];
  equipment: string;
  equipmentIds: number[];
  equipmentCategory: string;
  imageUrl: string | null;
  images: string[];
  variationGroup: string | null;
}

export function classifyEquipmentCategory(equipmentIds: number[]): string {
  if (equipmentIds.length === 0) return "body weight";
  
  const categories = equipmentIds.map(id => EQUIPMENT_CATEGORY_MAP[id] || "other");
  
  if (categories.includes("barbell")) return "barbell";
  if (categories.includes("dumbbell")) return "dumbbell";
  if (categories.every(c => c === "body weight")) return "body weight";
  
  return "other";
}

export function getSpanishTranslation(exerciseInfo: WgerExerciseInfo): {
  name: string;
  description: string;
} | null {
  const spanish = exerciseInfo.translations.find(t => t.language === WGER_LANGUAGE_SPANISH);
  const english = exerciseInfo.translations.find(t => t.language === 2);
  
  const name = cleanExerciseName(spanish?.name || english?.name || `Ejercicio ${exerciseInfo.id}`);
  const rawDescription = spanish?.description || english?.description || "";
  const description = cleanDescription(rawDescription);
  
  return { name, description };
}

export function cleanExerciseName(name: string): string {
  if (!name) return name;
  
  const replacements: [RegExp, string][] = [
    [/\bDumbbell\b/gi, "Mancuernas"],
    [/\bBarbell\b/gi, "Barra"],
    [/\bKettlebell\b/gi, "Pesa rusa"],
    [/\bCable\b/gi, "Polea"],
    [/\bMachine\b/gi, "Máquina"],
    [/\bSmith\b/gi, "Smith"],
    [/\bBench\b/gi, "Banco"],
    [/\bSquat\b/gi, "Sentadilla"],
    [/\bDeadlift\b/gi, "Peso muerto"],
    [/\bRaise\b/gi, "Elevación"],
    [/\bFly\b/gi, "Aperturas"],
    [/\bExtension\b/gi, "Extensión"],
    [/\bLunge\b/gi, "Zancada"],
    [/\bRow\b/gi, "Remo"],
    [/\bPull\b/gi, "Jalón"],
    [/\bPush\b/gi, "Press"],
    [/\bDip\b/gi, "Fondos"],
    [/\bPlank\b/gi, "Plancha"],
    [/\bShrugs?\b/gi, "Encogimientos"],
    [/\bHold\b/gi, "Resistencia"],
    [/\bIncline\b/gi, "Inclinado"],
    [/\bDecline\b/gi, "Declinado"],
    [/\bFlat\b/gi, "Plano"],
    [/\bStep\b/gi, "Paso"],
    [/\bClimb(ing|er)?\b/gi, "Escalador"],
    [/\bJump\b/gi, "Salto"],
    [/\bHop\b/gi, "Salto"],
    [/\bBurpee\b/gi, "Burpee"],
    [/\bSqueeze\b/gi, "Compresión"],
    [/\bIso(?:metric)?\s/gi, "Isométrico "],
    [/\bLow\b/gi, "Bajo"],
    [/\bHigh\b/gi, "Alto"],
    [/\bUpper\b/gi, "Superior"],
    [/\bLower\b/gi, "Inferior"],
    [/\bMiddle\b/gi, "Medio"],
    [/\bLateral\b/gi, "Lateral"],
    [/\bReverse\b/gi, "Reverso"],
    [/\bSingle\b/gi, "Unilateral"],
    [/\bDouble\b/gi, "Bilateral"],
    [/\bAlternat(?:e|ing)\b/gi, "Alternado"],
    [/\bOne\b/gi, "Uno"],
    [/\bTwo\b/gi, "Dos"],
    [/\bRight\b/gi, "Derecho"],
    [/\bLeft\b/gi, "Izquierdo"],
    [/\bStanding\b/gi, "De pie"],
    [/\bSeated\b/gi, "Sentado"],
    [/\bLying\b/gi, "Acostado"],
    [/\bKneeling\b/gi, "En cuadrupedia"],
    [/\bFloor\b/gi, "Suelo"],
    [/\bWall\b/gi, "Pared"],
    [/\bDoor\b/gi, "Puerta"],
    [/\bSwiss\s/gi, "Suizo "],
    [/\bBall\b/gi, "Pelota"],
    [/\bBand\b/gi, "Banda"],
    [/\bStretch\b/gi, "Estiramiento"],
    [/\bRotation(?:al)?\b/gi, "Rotación"],
    [/\bCross(?:over)?\b/gi, "Cruce"],
    [/\bAround\b/gi, "Circular"],
    [/\bTo\b/gi, "a"],
    [/\bAnd\b/gi, "y"],
    [/\bWith\b/gi, "con"],
    [/\bIn\b/gi, "en"],
    [/\bOn\b/gi, "en"],
    [/\bOf\b/gi, "de"],
    [/\bThe\b/gi, ""],
    [/\bA\b/gi, ""],
    [/\bVs\.?\b/gi, "vs"],
    [/\bNb\b/gi, "NB"],
    [/\bCv\b/gi, "CV"],
    [/\bUc\b/gi, "UC"],
    [/\bMP\b/gi, "MP"],
  ];
  
  let result = name;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  
  result = result.replace(/\s+/g, " ").trim();
  
  result = result.replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "");
  
  result = result.replace(/\b(dumbbell|barbell|kettlebell|cable|machine)\s+(dumbbell|barbell|kettlebell|cable|machine)\b/gi, "$2");
  
  return result;
}

export function cleanDescription(text: string): string {
  if (!text) return text;
  
  let result = text
    .replace(/<[^>]*>/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const translations: [RegExp, string][] = [
    [/\bDumbbell\b/gi, "Mancuernas"],
    [/\bBarbell\b/gi, "Barra"],
    [/\bKettlebell\b/gi, "Pesa rusa"],
    [/\bCable\b/gi, "Polea"],
    [/\bMachine\b/gi, "Máquina"],
    [/\bBench\b/gi, "Banco"],
    [/\bSmith\b/gi, "Smith"],
    [/\bSquat\b/gi, "Sentadilla"],
    [/\bDeadlift\b/gi, "Peso muerto"],
    [/\bLunge\b/gi, "Zancada"],
    [/\bRow\b/gi, "Remo"],
    [/\bPull[- ]?up\b/gi, "Dominadas"],
    [/\bPush[- ]?up\b/gi, "Flexiones"],
    [/\bPull\b/gi, "Jalón"],
    [/\bPush\b/gi, "Press"],
    [/\bDip\b/gi, "Fondos"],
    [/\bCurl\b/gi, "Curl"],
    [/\bPress\b/gi, "Press"],
    [/\bFly\b/gi, "Aperturas"],
    [/\bRaise\b/gi, "Elevación"],
    [/\bExtension\b/gi, "Extensión"],
    [/\bShrugs?\b/gi, "Encogimientos"],
    [/\bHold\b/gi, "Resistencia"],
    [/\bPlank\b/gi, "Plancha"],
    [/\bBurpee\b/gi, "Burpee"],
    [/\bClimb(ing|er)?\b/gi, "Escalador"],
    [/\bJump\b/gi, "Salto"],
    [/\bStep\b/gi, "Paso"],
    [/\bSqueeze\b/gi, "Compresión"],
    [/\bRotat(e|ion)\b/gi, "Rotación"],
    [/\bIncline\b/gi, "Inclinado"],
    [/\bDecline\b/gi, "Declinado"],
    [/\bFlat\b/gi, "Plano"],
    [/\bUpper\b/gi, "Superior"],
    [/\bLower\b/gi, "Inferior"],
    [/\bMiddle\b/gi, "Medio"],
    [/\bLateral\b/gi, "Lateral"],
    [/\bReverse\b/gi, "Reverso"],
    [/\bStanding\b/gi, "De pie"],
    [/\bSeated\b/gi, "Sentado"],
    [/\bLying\b/gi, "Acostado"],
    [/\bKneeling\b/gi, "En cuadrupedia"],
    [/\bFloor\b/gi, "Suelo"],
    [/\bWall\b/gi, "Pared"],
    [/\bDoor\b/gi, "Puerta"],
    [/\bSwiss Ball\b/gi, "Balón suizo"],
    [/\bBall\b/gi, "Pelota"],
    [/\bBand\b/gi, "Banda"],
    [/\bStretch\b/gi, "Estiramiento"],
    [/\bCross[- ]?over\b/gi, "Cruce"],
    [/\bAround\b/gi, "Circular"],
    [/\bSingle\b/gi, "Unilateral"],
    [/\bDouble\b/gi, "Bilateral"],
    [/\bAlternat(?:e|ing)\b/gi, "Alternado"],
    [/\bOne\b/gi, "Uno"],
    [/\bTwo\b/gi, "Dos"],
    [/\bRight\b/gi, "Derecho"],
    [/\bLeft\b/gi, "Izquierdo"],
    [/\bHigh\b/gi, "Alto"],
    [/\bLow\b/gi, "Bajo"],
    [/\bSlow\b/gi, "Lento"],
    [/\bFast\b/gi, "Rápido"],
    [/\bSlowly\b/gi, "Lentamente"],
    [/\bControlled\b/gi, "Controlado"],
    [/\bExplosive\b/gi, "Explosivo"],
    [/\bKeep\b/gi, "Mantén"],
    [/\bHold\b/gi, "Mantén"],
    [/\bGrip\b/gi, "Agarre"],
    [/\bWide\b/gi, "Ancho"],
    [/\bNarrow\b/gi, "Estrecho"],
    [/\bClose\b/gi, "Cerrado"],
    [/\bFeet\b/gi, "Pies"],
    [/\bHands\b/gi, "Manos"],
    [/\bArms\b/gi, "Brazos"],
    [/\bLegs\b/gi, "Piernas"],
    [/\bBack\b/gi, "Espalda"],
    [/\bChest\b/gi, "Pecho"],
    [/\bShoulders\b/gi, "Hombros"],
    [/\bCore\b/gi, "Core"],
    [/\bGlutes\b/gi, "Glúteos"],
    [/\bQuads\b/gi, "Cuádriceps"],
    [/\bHamstrings\b/gi, "Isquiotibiales"],
    [/\bCalves\b/gi, "Gemelos"],
    [/\bBiceps\b/gi, "Bíceps"],
    [/\bTriceps\b/gi, "Tríceps"],
    [/\bForearms\b/gi, "Antebrazos"],
    [/\bAbs\b/gi, "Abdominales"],
    [/\bSqueeze\b/gi, "Aprieta"],
    [/\bEngage\b/gi, "Activa"],
    [/\bRelax\b/gi, "Relaja"],
    [/\bExhale\b/gi, "Exhala"],
    [/\bInhale\b/gi, "Inhala"],
    [/\bBreath\b/gi, "Respiración"],
    [/\bWeight\b/gi, "Peso"],
    [/\bReps?\b/gi, "Repeticiones"],
    [/\bSets?\b/gi, "Series"],
    [/\bRest\b/gi, "Descanso"],
    [/\bTime\b/gi, "Tiempo"],
    [/\bSeconds?\b/gi, "Segundos"],
    [/\bMinutes?\b/gi, "Minutos"],
    [/\bBegin\b/gi, "Comienza"],
    [/\bStart\b/gi, "Comienza"],
    [/\bFinish\b/gi, "Termina"],
    [/\bEnd\b/gi, "Fin"],
    [/\bWhile\b/gi, "Mientras"],
    [/\bWhen\b/gi, "Cuando"],
    [/\bThen\b/gi, "Luego"],
    [/\bNext\b/gi, "Siguiente"],
    [/\bNow\b/gi, "Ahora"],
    [/\bAfter\b/gi, "Después"],
    [/\bBefore\b/gi, "Antes"],
    [/\bDuring\b/gi, "Durante"],
    [/\bUntil\b/gi, "Hasta"],
    [/\bThrough\b/gi, "A través de"],
    [/\bFrom\b/gi, "Desde"],
    [/\bTo\b/gi, "a"],
    [/\bInto\b/gi, "hacia"],
    [/\bOnto\b/gi, "sobre"],
    [/\bOff\b/gi, "de"],
    [/\bWith\b/gi, "con"],
    [/\bWithout\b/gi, "sin"],
    [/\bAnd\b/gi, "y"],
    [/\bOr\b/gi, "o"],
    [/\bThe\b/gi, ""],
    [/\bA\b/gi, ""],
    [/\bAn\b/gi, ""],
    [/\bYour\b/gi, "Tu"],
    [/\bYou\b/gi, "Tú"],
    [/\bStraight\b/gi, "Recto"],
    [/\bBent\b/gi, "Doblado"],
    [/\bNeutral\b/gi, "Neutral"],
    [/\bFlat\b/gi, "Plano"],
    [/\bArch\b/gi, "Arco"],
    [/\bTight\b/gi, "Tenso"],
    [/\bFirm\b/gi, "Firme"],
    [/\bStrong\b/gi, "Fuerte"],
    [/\bStable\b/gi, "Estable"],
    [/\bComfortable\b/gi, "Cómodo"],
    [/\bProper\b/gi, "Correcto"],
    [/\bCorrect\b/gi, "Correcto"],
    [/\bGood\b/gi, "Bueno"],
    [/\bPerfect\b/gi, "Perfecto"],
    [/\bFull\b/gi, "Completo"],
    [/\bRange\b/gi, "Rango"],
    [/\bMotion\b/gi, "Movimiento"],
    [/\bMovement\b/gi, "Movimiento"],
    [/\bPosition\b/gi, "Posición"],
    [/\bForm\b/gi, "Forma"],
    [/\bTechnique\b/gi, "Técnica"],
    [/\bTempo\b/gi, "Tempo"],
    [/\bSpeed\b/gi, "Velocidad"],
    [/\bDirection\b/gi, "Dirección"],
    [/\bLevel\b/gi, "Nivel"],
    [/\bSide\b/gi, "Lado"],
    [/\bBody\b/gi, "Cuerpo"],
    [/\bGround\b/gi, "Suelo"],
    [/\bFloor\b/gi, "Suelo"],
    [/\bBench\b/gi, "Banco"],
    [/\bChair\b/gi, "Silla"],
    [/\bTable\b/gi, "Mesa"],
    [/\bBar\b/gi, "Barra"],
    [/\bDumbbell\b/gi, "Mancuerna"],
    [/\bWeight\b/gi, "Peso"],
    [/\bLoad\b/gi, "Carga"],
    [/\bEffort\b/gi, "Esfuerzo"],
    [/\bTarget\b/gi, "Objetivo"],
    [/\bFocus\b/gi, "Enfoque"],
    [/\bMind\b/gi, "Mente"],
    [/\bMuscle\b/gi, "Músculo"],
    [/\bMuscles?\b/gi, "Músculos"],
    [/\bFeel\b/gi, "Siente"],
    [/\bTouch\b/gi, "Toca"],
    [/\bEngage\b/gi, "Activa"],
    [/\bFlex\b/gi, "Flexiona"],
    [/\bContract\b/gi, "Contrae"],
    [/\bRelease\b/gi, "Suelta"],
    [/\bReturn\b/gi, "Regresa"],
    [/\bRepeat\b/gi, "Repite"],
    [/\bContinue\b/gi, "Continúa"],
    [/\bPause\b/gi, "Pausa"],
    [/\bStop\b/gi, "Para"],
    [/\bStart\b/gi, "Comienza"],
    [/\bBegin\b/gi, "Comienza"],
    [/\bSetup\b/gi, "Preparación"],
    [/\bExecution\b/gi, "Ejecución"],
    [/\bTip\b/gi, "Consejo"],
    [/\bWarning\b/gi, "Advertencia"],
    [/\bCaution\b/gi, "Precaución"],
    [/\bNote\b/gi, "Nota"],
    [/\bRemember\b/gi, "Recuerda"],
    [/\bAvoid\b/gi, "Evita"],
    [/\bDon't\b/gi, "No"],
    [/\bNever\b/gi, "Nunca"],
    [/\bAlways\b/gi, "Siempre"],
    [/\bSometimes\b/gi, "A veces"],
    [/\bUsually\b/gi, "Usualmente"],
    [/\bOften\b/gi, "A menudo"],
    [/\bRarely\b/gi, "Rara vez"],
    [/\bSometimes\b/gi, "A veces"],
    [/\bMaybe\b/gi, "Tal vez"],
    [/\bPerhaps\b/gi, "Quizás"],
    [/\bPossible\b/gi, "Posible"],
    [/\bImpossible\b/gi, "Imposible"],
    [/\bEasy\b/gi, "Fácil"],
    [/\bHard\b/gi, "Difícil"],
    [/\bMedium\b/gi, "Medio"],
    [/\bModerate\b/gi, "Moderado"],
    [/\bLight\b/gi, "Ligero"],
    [/\bHeavy\b/gi, "Pesado"],
    [/\bVery\b/gi, "Muy"],
    [/\bExtremely\b/gi, "Extremadamente"],
    [/\bSlightly\b/gi, "Ligeramente"],
    [/\bBarely\b/gi, "Apenas"],
    [/\bAlmost\b/gi, "Casi"],
    [/\bJust\b/gi, "Solo"],
    [/\bOnly\b/gi, "Solo"],
    [/\bMore\b/gi, "Más"],
    [/\bLess\b/gi, "Menos"],
    [/\bMuch\b/gi, "Mucho"],
    [/\bLittle\b/gi, "Poco"],
    [/\bEnough\b/gi, "Suficiente"],
    [/\bToo\b/gi, "Demasiado"],
    [/\bSo\b/gi, "Así"],
    [/\bThat\b/gi, "Eso"],
    [/\bThis\b/gi, "Esto"],
    [/\bThese\b/gi, "Estos"],
    [/\bThose\b/gi, "Esos"],
    [/\bHere\b/gi, "Aquí"],
    [/\bThere\b/gi, "Allí"],
    [/\bWhere\b/gi, "Dónde"],
    [/\bWhat\b/gi, "Qué"],
    [/\bWho\b/gi, "Quién"],
    [/\bWhy\b/gi, "Por qué"],
    [/\bHow\b/gi, "Cómo"],
    [/\bIf\b/gi, "Si"],
    [/\bWhether\b/gi, "Si"],
    [/\bMaybe\b/gi, "Tal vez"],
    [/\bCan\b/gi, "Puedes"],
    [/\bShould\b/gi, "Deberías"],
    [/\bMust\b/gi, "Debes"],
    [/\bMay\b/gi, "Puedes"],
    [/\bMight\b/gi, "Podría"],
    [/\bWill\b/gi, "Will"],
    [/\bWould\b/gi, "Would"],
    [/\bCould\b/gi, "Podrías"],
    [/\bShould\b/gi, "Deberías"],
    [/\bMust\b/gi, "Debes"],
    [/\bNeed\b/gi, "Necesitas"],
    [/\bWant\b/gi, "Quieres"],
    [/\bLike\b/gi, "Gustaría"],
    [/\bPrefer\b/gi, "Prefieres"],
    [/\bInstead\b/gi, "En cambio"],
    [/\bHowever\b/gi, "Sin embargo"],
    [/\bTherefore\b/gi, "Por lo tanto"],
    [/\bBecause\b/gi, "Porque"],
    [/\bSince\b/gi, "Desde"],
    [/\bAlthough\b/gi, "Aunque"],
    [/\bEven\b/gi, "Incluso"],
    [/\bThough\b/gi, "Aunque"],
    [/\bYet\b/gi, "Aún"],
    [/\bBut\b/gi, "Pero"],
    [/\bAnd\b/gi, "Y"],
    [/\bSo\b/gi, "Así que"],
    [/\bAs\b/gi, "Como"],
    [/\bLike\b/gi, "Como"],
    [/\bThan\b/gi, "Que"],
    [/\bLike\b/gi, "Como"],
    [/\bSuch\b/gi, "Tal"],
    [/\bMuch\b/gi, "Mucho"],
    [/\bMore\b/gi, "Más"],
    [/\bMost\b/gi, "La mayoría"],
    [/\bSome\b/gi, "Algunos"],
    [/\bAny\b/gi, "Cualquier"],
    [/\bAll\b/gi, "Todos"],
    [/\bEach\b/gi, "Cada"],
    [/\bEvery\b/gi, "Cada"],
    [/\bBoth\b/gi, "Ambos"],
    [/\bEither\b/gi, "Cualquiera"],
    [/\bNeither\b/gi, "Ninguno"],
    [/\bNo\b/gi, "No"],
    [/\bNot\b/gi, "No"],
    [/\bNone\b/gi, "Ninguno"],
    [/\bNothing\b/gi, "Nada"],
    [/\bNobody\b/gi, "Nadie"],
    [/\bNowhere\b/gi, "En ninguna parte"],
    [/\bNowhere\b/gi, "En ninguna parte"],
    [/\bOnly\b/gi, "Solo"],
    [/\bJust\b/gi, "Solo"],
    [/\bMerely\b/gi, "Solo"],
    [/\bSimply\b/gi, "Simplemente"],
    [/\bBarely\b/gi, "Apenas"],
    [/\bHardly\b/gi, "Apenas"],
    [/\bScarcely\b/gi, "Apenas"],
    [/\bRarely\b/gi, "Rara vez"],
    [/\bSeldom\b/gi, "Rara vez"],
    [/\bNever\b/gi, "Nunca"],
    [/\bAlways\b/gi, "Siempre"],
    [/\bEver\b/gi, "Siempre"],
    [/\bAlready\b/gi, "Ya"],
    [/\bStill\b/gi, "Todavía"],
    [/\bYet\b/gi, "Aún"],
    [/\bAgain\b/gi, "Otra vez"],
    [/\bOnce\b/gi, "Una vez"],
    [/\bTwice\b/gi, "Dos veces"],
    [/\bThrice\b/gi, "Tres veces"],
    [/\bHalf\b/gi, "Mitad"],
    [/\bHalf\b/gi, "Mitad"],
    [/\bPart\b/gi, "Parte"],
    [/\bFull\b/gi, "Lleno"],
    [/\bWhole\b/gi, "Entero"],
    [/\bEach\b/gi, "Cada"],
    [/\bEvery\b/gi, "Cada"],
    [/\bAny\b/gi, "Cualquier"],
    [/\bAll\b/gi, "Todos"],
    [/\bMost\b/gi, "La mayoría"],
    [/\bSome\b/gi, "Algunos"],
    [/\bFew\b/gi, "Pocos"],
    [/\bMany\b/gi, "Muchos"],
    [/\bSeveral\b/gi, "Varios"],
    [/\bVarious\b/gi, "Varios"],
    [/\bDifferent\b/gi, "Diferentes"],
    [/\bSame\b/gi, "Mismo"],
    [/\bOther\b/gi, "Otro"],
    [/\bAnother\b/gi, "Otro"],
    [/\bEach\b/gi, "Cada"],
    [/\bOne\b/gi, "Uno"],
    [/\bTwo\b/gi, "Dos"],
    [/\bThree\b/gi, "Tres"],
    [/\bFour\b/gi, "Cuatro"],
    [/\bFive\b/gi, "Cinco"],
    [/\bSix\b/gi, "Seis"],
    [/\bSeven\b/gi, "Siete"],
    [/\bEight\b/gi, "Ocho"],
    [/\bNine\b/gi, "Nueve"],
    [/\bTen\b/gi, "Diez"],
    [/\bFirst\b/gi, "Primero"],
    [/\bSecond\b/gi, "Segundo"],
    [/\bThird\b/gi, "Tercero"],
    [/\bLast\b/gi, "Último"],
    [/\bNext\b/gi, "Siguiente"],
    [/\bPrevious\b/gi, "Anterior"],
    [/\bBefore\b/gi, "Antes"],
    [/\bAfter\b/gi, "Después"],
    [/\bDuring\b/gi, "Durante"],
    [/\bBetween\b/gi, "Entre"],
    [/\bAmong\b/gi, "Entre"],
    [/\bThrough\b/gi, "A través de"],
    [/\bAcross\b/gi, "A través de"],
    [/\bOver\b/gi, "Sobre"],
    [/\bUnder\b/gi, "Bajo"],
    [/\bBelow\b/gi, "Debajo"],
    [/\bAbove\b/gi, "Encima"],
    [/\bBehind\b/gi, "Detrás"],
    [/\bIn front\b/gi, "Frente"],
    [/\bBeside\b/gi, "Junto a"],
    [/\bNear\b/gi, "Cerca"],
    [/\bFar\b/gi, "Lejos"],
    [/\bClose\b/gi, "Cerca"],
    [/\bTogether\b/gi, "Juntos"],
    [/\bApart\b/gi, "Separados"],
    [/\bUp\b/gi, "Arriba"],
    [/\bDown\b/gi, "Abajo"],
    [/\bInside\b/gi, "Adentro"],
    [/\bOutside\b/gi, "Afuera"],
    [/\bWithin\b/gi, "Dentro de"],
    [/\bWithout\b/gi, "Sin"],
    [/\bWithin\b/gi, "Dentro de"],
  ];
  
  for (const [pattern, replacement] of translations) {
    result = result.replace(pattern, replacement);
  }
  
  result = result.replace(/\s+/g, " ").trim();
  
  result = result.replace(/^[\s\-–—:.,;!?]+|[\s\-–—:.,;!?]+$/g, "");
  
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  return result;
}

export function getMainImage(exerciseInfo: WgerExerciseInfo): string | null {
  const mainImage = exerciseInfo.images.find(img => img.is_main);
  if (mainImage) {
    return `https://wger.de${mainImage.image}`;
  }
  if (exerciseInfo.images.length > 0) {
    return `https://wger.de${exerciseInfo.images[0].image}`;
  }
  return null;
}

export function transformWgerExerciseInfo(exerciseInfo: WgerExerciseInfo): Exercise {
  const spanish = getSpanishTranslation(exerciseInfo);
  const muscleNames = exerciseInfo.muscles.map(m => m.name);
  const secondaryNames = exerciseInfo.muscles_secondary.map(m => m.name);
  const equipmentNames = exerciseInfo.equipment.map(e => e.name);
  const mainImage = getMainImage(exerciseInfo);
  
  return {
    id: exerciseInfo.id.toString(),
    uuid: exerciseInfo.uuid,
    name: cleanExerciseName(spanish?.name || `Ejercicio ${exerciseInfo.id}`),
    description: spanish?.description || "",
    category: exerciseInfo.category.name,
    categoryId: exerciseInfo.category.id,
    muscles: muscleNames,
    muscleIds: exerciseInfo.muscles.map(m => m.id),
    secondaryMuscles: secondaryNames,
    secondaryMuscleIds: exerciseInfo.muscles_secondary.map(m => m.id),
    equipment: equipmentNames.join(", ") || "Peso corporal",
    equipmentIds: exerciseInfo.equipment.map(e => e.id),
    equipmentCategory: classifyEquipmentCategory(exerciseInfo.equipment.map(e => e.id)),
    imageUrl: mainImage,
    images: exerciseInfo.images.map(img => `https://wger.de${img.image}`),
    variationGroup: exerciseInfo.variation_group,
  };
}

export async function fetchExercisesByCategory(
  categoryId: number,
  equipmentIds?: number[],
  limit = 100
): Promise<Exercise[]> {
  const allExercises: WgerExerciseInfo[] = [];
  
  let offset = 0;
  let hasMore = true;
  
  while (hasMore && allExercises.length < limit * 2) {
    const params = new URLSearchParams();
    params.append("language", WGER_LANGUAGE_SPANISH.toString());
    params.append("category", categoryId.toString());
    params.append("limit", "100");
    params.append("offset", offset.toString());
    
    const url = `${WGER_API_BASE}/exerciseinfo/?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });
    
    if (!response.ok) {
      throw new Error(`WGER API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    allExercises.push(...results);
    
    if (results.length < 100 || !data.next) {
      hasMore = false;
    } else {
      offset += 100;
    }
  }
  
  let exercises = allExercises.map(transformWgerExerciseInfo);
  
  if (equipmentIds && equipmentIds.length > 0) {
    exercises = exercises.filter(ex =>
      ex.equipmentIds.some(id => equipmentIds.includes(id))
    );
  }
  
  return exercises;
}

export async function fetchAllExercises(limit = 100): Promise<Exercise[]> {
  const params = new URLSearchParams();
  params.append("language", WGER_LANGUAGE_SPANISH.toString());
  params.append("limit", limit.toString());
  
  const url = `${WGER_API_BASE}/exerciseinfo/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });
  
  if (!response.ok) {
    throw new Error(`WGER API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return (data.results || []).map(transformWgerExerciseInfo);
}

export async function fetchEquipment(): Promise<WgerEquipment[]> {
  const params = new URLSearchParams();
  params.append("language", WGER_LANGUAGE_SPANISH.toString());
  params.append("limit", "50");
  
  const url = `${WGER_API_BASE}/equipment/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });
  
  if (!response.ok) {
    throw new Error(`WGER API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

export async function fetchMuscles(): Promise<WgerMuscle[]> {
  const params = new URLSearchParams();
  params.append("language", WGER_LANGUAGE_SPANISH.toString());
  params.append("limit", "50");
  
  const url = `${WGER_API_BASE}/muscle/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });
  
  if (!response.ok) {
    throw new Error(`WGER API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

export async function fetchCategories(): Promise<WgerCategory[]> {
  const params = new URLSearchParams();
  params.append("language", WGER_LANGUAGE_SPANISH.toString());
  params.append("limit", "50");
  
  const url = `${WGER_API_BASE}/exercisecategory/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });
  
  if (!response.ok) {
    throw new Error(`WGER API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

export async function searchExercises(query: string, limit = 20): Promise<Exercise[]> {
  const params = new URLSearchParams();
  params.append("language", WGER_LANGUAGE_SPANISH.toString());
  params.append("limit", limit.toString());
  
  const url = `${WGER_API_BASE}/exerciseinfo/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });
  
  if (!response.ok) {
    throw new Error(`WGER API Error: ${response.status}`);
  }
  
  const data = await response.json();
  const exercises = (data.results || []).map(transformWgerExerciseInfo);
  
  const lowerQuery = query.toLowerCase();
  return exercises.filter((ex: Exercise) =>
    ex.name.toLowerCase().includes(lowerQuery) ||
    ex.description.toLowerCase().includes(lowerQuery)
  );
}