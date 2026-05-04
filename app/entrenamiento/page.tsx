"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Dumbbell, 
  ArrowLeft, 
  Check,
  ArrowRight,
  UserCheck
} from "lucide-react";

const muscleGroups = [
  { 
    id: "pecho", 
    name: "PECHO", 
    description: "Músculos pectorales mayores y menores",
    icon: "🫃"
  },
  { 
    id: "espalda", 
    name: "ESPALDA", 
    description: "Dorsales, trapecios y lumbares",
    icon: "🔙"
  },
  { 
    id: "hombros", 
    name: "HOMBROS", 
    description: "Deltoides anterior, lateral y posterior",
    icon: "🎯"
  },
  { 
    id: "brazos", 
    name: "BRAZOS", 
    description: "Bíceps, tríceps y antebrazos",
    icon: "💪"
  },
  { 
    id: "piernas", 
    name: "PIERNAS", 
    description: "Cuádriceps y gemelos",
    icon: "🦵"
  },
  { 
    id: "gluteos", 
    name: "GLUTEOS", 
    description: "Glúteos mayores y médios",
    icon: "🍑"
  },
  { 
    id: "abdomen", 
    name: "ABDOMEN", 
    description: "Rectos, oblicuos y transverso",
    icon: "🎽"
  },
  { 
    id: "cardio", 
    name: "CARDIO", 
    description: "Sistema cardiovascular",
    icon: "❤️"
  },
];

const exercisesDatabase: Record<string, Array<{
  id: string;
  name: string;
  description: string;
  difficulty: "principiante" | "intermedio" | "avanzado";
  equipment: string;
}>> = {
  pecho: [
    { id: "press-banca", name: "Press de banca", description: "Ejercicio básico para pecho. Te recuestas en un banco y empujas una barra hacia arriba. Trabaja pectorales, tríceps y hombro anterior.", difficulty: "principiante", equipment: "Barra y banco" },
    { id: "fondos", name: "Fondos", description: "Bajas el cuerpo entre dos barras paraleles. Excelente para pectorales inferiores y tríceps.", difficulty: "intermedio", equipment: "Barras paralelas" },
    { id: "aperturas", name: "Aperturas", description: "Con mancuernas, abres los brazos hacia los lados como abrazando. Aísla pectorales.", difficulty: "principiante", equipment: "Mancuernas" },
    { id: "press-inclinado", name: "Press inclinado", description: "Similar al press de banca pero el banco está inclinado. Enfatiza pectorales superiores.", difficulty: "intermedio", equipment: "Barra y banco inclinado" },
    { id: "pullover", name: "Pullover", description: "Con mancuerna, lanzas el peso hacia atrás sobre la cabeza. Estira y contrae pectorales.", difficulty: "principiante", equipment: "Mancuerna" },
  ],
  espalda: [
    { id: "dominadas", name: "Dominadas", description: "Te cuelgas de una barra y subes tu cuerpo con los brazos. El ejercicio rey para espalda.", difficulty: "avanzado", equipment: "Barra de dominadas" },
    { id: "remo", name: "Remo con barra", description: "Inclinado hacia adelante, jalas una barra hacia el abdomen. Construye espalda media.", difficulty: "intermedio", equipment: "Barra" },
    { id: "jalon-pecho", name: "Jalón al pecho", description: "Te sentás en una máquina y jalas una barra hacia tu pecho. Versión guiada de dominadas.", difficulty: "principiante", equipment: "Máquina" },
    { id: "remov-islo", name: "Remo con mancuerna", description: "Una mano apoiada, jalas mancuerna hacia el costado. Para cada lado.", difficulty: "principiante", equipment: "Mancuerna" },
    { id: "pulldown", name: "Pulldown", description: "En máquina, bajas la barra hacia los omóplatos. Excelente para dorsales.", difficulty: "principiante", equipment: "Máquina" },
  ],
  hombros: [
    { id: "press-militar", name: "Press militar", description: "Con barra o mancuernas, levantas el peso sobre tu cabeza. Ejercicio fundamental.", difficulty: "intermedio", equipment: "Barra/Mancuernas" },
    { id: "elev-lateral", name: "Elevaciones laterales", description: "Con mancuernas, levantas los brazos hacia los lados. Para deltoides lateral.", difficulty: "principiante", equipment: "Mancuernas" },
    { id: "crucifix", name: "Crucifix", description: "Con mancuernas, extiendes los brazos a los lados a la altura de los hombros. Para deltoides posterior.", difficulty: "principiante", equipment: "Mancuernas" },
    { id: "face-pull", name: "Face pull", description: "Con banda o polea alta, jalas hacia tu cara. Fortalece manguito rotador y posterior.", difficulty: "principiante", equipment: "Polea" },
    { id: "arnold", name: "Press Arnold", description: "Press con rotación de muneca. Introducido por Arnold Schwarzenegger.", difficulty: "intermedio", equipment: "Mancuernas" },
  ],
  brazos: [
    { id: "curl-bicep", name: "Curl biceps", description: "Con mancuernas o barra, subes el peso enrollando los brazos. Ejercicio clásico de bíceps.", difficulty: "principiante", equipment: "Mancuernas/Barra" },
    { id: "curl-martillo", name: "Curl martillo", description: "Con mancuernas, palmas enfrentadas. Trabaja braquial y bíceps lateral.", difficulty: "principiante", equipment: "Mancuernas" },
    { id: "press-cierre", name: "Press closes", description: "Con mancuernas arriba, las acercas. Trabaja tríceps y pecho inner.", difficulty: "intermedio", equipment: "Mancuernas" },
    { id: "ext-tricep", name: "Extensiones", description: "Con mancuerna arriba, bajas el peso flexionando los codos. Para tríceps.", difficulty: "principiante", equipment: "Mancuerna" },
    { id: "curl-concentr", name: "Curl concentrado", description: "Sentado, apoyas el codo y subes la mancuerna. Para bíiceps isolated.", difficulty: "principiante", equipment: "Mancuerna" },
  ],
  piernas: [
    { id: "sentadilla", name: "Sentadilla", description: "Bajas las rodillas como sentándote en una silla invisible. Ejercicio rey de piernas.", difficulty: "principiante", equipment: "Barra/Sin peso" },
    { id: "peso-muerto", name: "Peso muerto", description: "Desde el suelo, levantas la barra manteniendo espalda recta. Trabaja isquiotibiales y glúteos.", difficulty: "intermedio", equipment: "Barra" },
    { id: "prensa", name: "Prensa de piernas", description: "En máquina, empujas el peso con las piernas. Versión guiada de sentadilla.", difficulty: "principiante", equipment: "Máquina" },
    { id: "ext-cuadri", name: "Extensión de cuádriceps", description: "En máquina, extiendes las piernas. Aísla cuádriceps.", difficulty: "principiante", equipment: "Máquina" },
    { id: "curl-femoral", name: "Curl femoral", description: "En máquina, doblas las rodillas. Trabaja isquiotibiales.", difficulty: "principiante", equipment: "Máquina" },
  ],
  gluteos: [
    { id: "hip-thrust", name: "Hip thrust", description: "Con espalda en banco, empujas tus glúteos hacia arriba con peso. El mejor para glúteos.", difficulty: "intermedio", equipment: "Barra/Banco" },
    { id: "patada-gluteo", name: "Patada de glúteo", description: "En cuatro puntos, patadas hacia atrás con pierna. Aísla glúteos.", difficulty: "principiante", equipment: "Sin equipo/Máquina" },
    { id: "puente", name: "Puente de cadera", description: "Acostado, levantas las caderas. Versión sin peso del hip thrust.", difficulty: "principiante", equipment: "Sin equipo" },
    { id: "zancadas", name: "Zancadas", description: "Pasos largos alternando piernas. Funciona glúteos y cuádriceps.", difficulty: "principiante", equipment: "Mancuernas" },
    { id: "squat-glute", name: "Sentadilla sumo", description: "Sentadilla con pies separados y puntas hacia afuera. Enfatiza glúteos internos.", difficulty: "principiante", equipment: "Barra" },
  ],
  abdomen: [
    { id: "crunch", name: "Crunch", description: "Acostado, elevas el torso hacia las rodillas.versian clásica de abdominales.", difficulty: "principiante", equipment: "Sin equipo" },
    { id: "plank", name: "Plank", description: "En posición de plancha, mantienes el cuerpo recto. Resiste y fortalece.", difficulty: "principiante", equipment: "Sin equipo" },
    { id: "elev-piernas", name: "Elevación de piernas", description: "Acostado, elevas las piernas rectas. Trabaja abdominales inferiores.", difficulty: "intermedio", equipment: "Sin equipo" },
    { id: "rueda", name: "Rueda abdominal", description: "Con una rueda, avanzas y regresas. Entrenamiento avanzado.", difficulty: "avanzado", equipment: "Rueda abdominal" },
    { id: "russian-twist", name: "Torsión rusa", description: "Sentado, rotas el torso a cada lado. Trabaja oblicuos.", difficulty: "principiante", equipment: "Mancuerna/Opcional" },
  ],
  cardio: [
    { id: "cinta", name: "Cinta/Pasillo", description: "Caminar o trotar en cinta rodante. Cardiovascular básico.", difficulty: "principiante", equipment: "Cinta" },
    { id: "bicicleta", name: "Bicicleta", description: "Ejercicio cardiovascular de bajo impacto. Mejor para rodillas.", difficulty: "principiante", equipment: "Bicicleta estática" },
    { id: "eliptica", name: "Elíptica", description: "Movimiento combinado de pedalear y caminar. Bajo impacto.", difficulty: "principiante", equipment: "Elíptica" },
    { id: "escaladora", name: "Escaladora", description: "Subes escalones repetidamente. Intensivo y efectivo.", difficulty: "intermedio", equipment: "Escaladora" },
    { id: "remadora", name: "Remadora", description: "Simula remar. Trabaja espalda y cardio simultáneamente.", difficulty: "intermedio", equipment: "Remadora" },
  ],
};

export default function EntrenamientoPage() {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState<"muscles" | "exercises">("muscles");

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const toggleExercise = (muscleId: string, exerciseId: string) => {
    setSelectedExercises(prev => {
      const current = prev[muscleId] || [];
      const updated = current.includes(exerciseId)
        ? current.filter(e => e !== exerciseId)
        : [...current, exerciseId];
      return { ...prev, [muscleId]: updated };
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "principiante": return "text-green-400 bg-green-400/10 border-green-400/30";
      case "intermedio": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "avanzado": return "text-red-400 bg-red-400/10 border-red-400/30";
      default: return "text-gray-400";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "principiante": return "Principiante";
      case "intermedio": return "Intermedio";
      case "avanzado": return "Avanzado";
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#3f3f46]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href={step === "exercises" ? "/" : "/"}
            onClick={(e) => {
              if (step === "exercises") {
                e.preventDefault();
                setStep("muscles");
                setSelectedExercises({});
              }
            }}
            className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">VOLVER</span>
          </Link>
          <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-[#eab308]">GYM</span>
          </span>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {step === "muscles" ? (
                <>¿QUE VAS A <span className="text-[#eab308]">ENTRENAR</span> HOY?</>
              ) : (
                <>ELIGE TUS <span className="text-[#eab308]">EJERCICIOS</span></>
              )}
            </h1>
            <p className="text-[#a1a1aa]">
              {step === "muscles" 
                ? "Selecciona los grupos musculares que vas a trabajar" 
                : "Selecciona los ejercicios para cada grupo"}
            </p>
          </div>

          {step === "muscles" ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                {muscleGroups.map((muscle) => (
                  <button
                    key={muscle.id}
                    onClick={() => toggleMuscle(muscle.id)}
                    className={`
                      relative p-6 rounded-2xl border-2 transition-all duration-300
                      ${selectedMuscles.includes(muscle.id) 
                        ? "bg-[#eab308] border-[#eab308] text-black scale-105" 
                        : "bg-[#18181b] border-[#3f3f46] hover:border-[#eab308]/50 hover:bg-[#27272a]"
                      }
                    `}
                  >
                    {selectedMuscles.includes(muscle.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#eab308]" />
                      </div>
                    )}
                    <div className="text-4xl mb-3">{muscle.icon}</div>
                    <h3 
                      className="font-bold text-lg"
                      style={{ fontFamily: "var(--font-oswald)" }}
                    >
                      {muscle.name}
                    </h3>
                    <p className={`text-xs mt-2 ${selectedMuscles.includes(muscle.id) ? "text-black/70" : "text-[#a1a1aa]"}`}>
                      {muscle.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep("exercises")}
                  disabled={selectedMuscles.length === 0}
                  className={`
                    group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all
                    ${selectedMuscles.length > 0 
                      ? "bg-[#eab308] hover:bg-[#ca9a04] text-black hover:scale-105 cursor-pointer" 
                      : "bg-[#3f3f46] text-[#71717a] cursor-not-allowed"
                    }
                  `}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Dumbbell className="w-5 h-5" />
                  ELEGIR EJERCICIOS
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {selectedMuscles.length === 0 && (
                  <p className="text-[#71717a] mt-4 text-sm">
                    Selecciona al menos un grupo muscular para continuar
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-8 mb-10">
                {selectedMuscles.map(muscleId => {
                  const muscle = muscleGroups.find(m => m.id === muscleId);
                  const exercises = exercisesDatabase[muscleId] || [];
                  const selected = selectedExercises[muscleId] || [];
                  
                  return (
                    <div key={muscleId} className="bg-[#18181b] rounded-2xl p-6 border border-[#3f3f46]">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{muscle?.icon}</span>
                        <h3 className="font-bold text-xl text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                          {muscle?.name}
                        </h3>
                        <span className="text-sm text-[#71717a] ml-auto">
                          {selected.length}/{exercises.length} seleccionados
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {exercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            onClick={() => toggleExercise(muscleId, exercise.id)}
                            className={`
                              w-full p-4 rounded-xl border-2 transition-all text-left
                              ${selected.includes(exercise.id)
                                ? "border-[#eab308] bg-[#eab308]/10"
                                : "border-[#3f3f46] hover:border-[#eab308]/50 bg-[#0a0a0a]"
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                                  ${selected.includes(exercise.id) 
                                    ? "border-[#eab308] bg-[#eab308]" 
                                    : "border-[#3f3f46]"
                                  }
                                `}>
                                  {selected.includes(exercise.id) && (
                                    <Check className="w-3 h-3 text-black" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold">{exercise.name}</h4>
                                  <p className="text-sm text-[#a1a1aa] mt-1">{exercise.description}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`
                                      text-xs px-2 py-1 rounded-full border
                                      ${getDifficultyColor(exercise.difficulty)}
                                    `}>
                                      {getDifficultyLabel(exercise.difficulty)}
                                    </span>
                                    <span className="text-xs text-[#71717a]">
                                      {exercise.equipment}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <div className="mb-4 text-[#a1a1aa]">
                  {Object.values(selectedExercises).flat().length} ejercicios seleccionados
                </div>
                <button
                  disabled={Object.values(selectedExercises).flat().length === 0}
                  className={`
                    group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all
                    ${Object.values(selectedExercises).flat().length > 0 
                      ? "bg-[#eab308] hover:bg-[#ca9a04] text-black hover:scale-105 cursor-pointer" 
                      : "bg-[#3f3f46] text-[#71717a] cursor-not-allowed"
                    }
                  `}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <UserCheck className="w-5 h-5" />
                  CONFIRMAR ENTRENAMIENTO
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}