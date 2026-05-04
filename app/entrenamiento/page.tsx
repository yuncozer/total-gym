"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Dumbbell, 
  ArrowLeft, 
  Check,
  ArrowRight
} from "lucide-react";

const muscleGroups = [
  { 
    id: "pecho", 
    name: "PECHO", 
    icon: "💪",
    exercises: ["Press de banca", "Fondos", "Aperturas", "Press inclinado"]
  },
  { 
    id: "espalda", 
    name: "ESPALDA", 
    icon: "🔙",
    exercises: ["Dominadas", "Remo", "Pullover", "Jalón al pecho"]
  },
  { 
    id: "hombros", 
    name: "HOMBROS", 
    icon: "🎯",
    exercises: ["Press militar", "Elevaciones", "Crucifix", "Face pull"]
  },
  { 
    id: "brazos", 
    name: "BRAZOS", 
    icon: "💪",
    exercises: ["Curl biceps", "Press cierre", "Curl martillo", "Extensiones"]
  },
  { 
    id: "piernas", 
    name: "PIERNAS", 
    icon: "🦵",
    exercises: ["Sentadilla", "Peso muerto", "Prensa", "Femoral"]
  },
  { 
    id: "gluteos", 
    name: "GLUTEOS", 
    icon: "🍑",
    exercises: ["Hip thrust", "Patada gluteo", "Puente", "Zancadas"]
  },
  { 
    id: "abdomen", 
    name: "ABDOMEN", 
    icon: "🎽",
    exercises: ["Crunch", "Plank", "Elevación piernas", "Rueda"]
  },
  { 
    id: "cardio", 
    name: "CARDIO", 
    icon: "❤️",
    exercises: ["Cinta", "Bicicleta", "Elíptica", "Escaladora"]
  },
];

export default function EntrenamientoPage() {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#3f3f46]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/"
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
              ¿QUE VAS A <span className="text-[#eab308]">ENTRENAR</span> HOY?
            </h1>
            <p className="text-[#a1a1aa]">
              Selecciona los grupos musculares que vas a trabajar
            </p>
          </div>

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
                <p className={`text-sm mt-2 ${selectedMuscles.includes(muscle.id) ? "text-black/70" : "text-[#a1a1aa]"}`}>
                  {muscle.exercises.length} ejercicios
                </p>
              </button>
            ))}
          </div>

          {selectedMuscles.length > 0 && (
            <div className="bg-[#18181b] rounded-2xl p-6 border border-[#3f3f46] mb-8">
              <h3 
                className="font-bold text-lg mb-4 text-[#eab308]"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                EJERCICIOS SELECCIONADOS
              </h3>
              <div className="space-y-3">
                {muscleGroups
                  .filter(m => selectedMuscles.includes(m.id))
                  .map(muscle => (
                    <div key={muscle.id} className="bg-[#0a0a0a] rounded-xl p-4">
                      <h4 className="font-bold mb-2">{muscle.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {muscle.exercises.map((ex, i) => (
                          <span 
                            key={i}
                            className="bg-[#27272a] text-[#a1a1aa] px-3 py-1 rounded-full text-sm"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
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
              CONFIRMAR ENTRENAMIENTO
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {selectedMuscles.length === 0 && (
              <p className="text-[#71717a] mt-4 text-sm">
                Selecciona al menos un grupo muscular para continuar
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}