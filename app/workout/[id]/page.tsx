"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Play,
  Loader2,
  CheckCircle2,
  Dumbbell,
  Target,
  Trophy,
  Zap,
  Flame,
  Share2,
  History
} from "lucide-react";
import { UserHeader } from "@/app/components/UserHeader";

const motivationalQuotes = [
  "El dolor que sientes hoy es la fuerza que sentirás mañana.",
  "No pares cuando estés fatigued. Para cuando hayas terminado.",
  "La grandeza se construye en el gimnasio, pero se forja en la mente.",
  "Cada repetición te acerca más a tu mejor versión.",
  "No hay secretos. Solo entrena con consistencia.",
  "Tu único límite eres tú mismo.",
  "El cuerpo logra lo que la mente cree.",
  "Levanta pesado. Sueña grande.",
  "La disciplina es el puente entre tus sueños y tus logros.",
  "Hoy sudas, mañana brillas.",
  "El gimnasio no perdona ignorancia, pero premia dedicación.",
  "Transforma el dolor en poder.",
  "Cada día es una oportunidad de ser más fuerte.",
  "No busques atajos, busca resultados.",
  "La motivación te abre la puerta, la disciplina te hace entrar.",
  "El hierro no miente, las excusas sí.",
  "Entrena como si fuera tu último día.",
  "El campeón se hace cuando nadie mira.",
  "Tu único competidor eres tú.",
  "La fuerza no viene del cuerpo, viene del corazón.",
  "Sudor hoy, gloria mañana.",
  "No te rindas cuando parezca difícil.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Levántate, entrena, repítelo.",
  "Las metas se cumplen con acción.",
  "Haz que cada repetición compte.",
  "El gym es tu terapia.",
  "La única manera de fallar es no intentarlo.",
  "Perseverancia vence talento.",
  "Tu tiempo es ahora.",
  "El dolor es temporal, el orgullo es eterno.",
];

function getDailyQuote(): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}

interface WorkoutSet {
  id?: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  is_completed: boolean;
}

interface EjercicioEnWorkout {
  exerciseId: string;
  name: string;
  equipment: string;
  sets: WorkoutSet[];
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  const [ejercicios, setEjercicios] = useState<EjercicioEnWorkout[]>([]);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<EjercicioEnWorkout | null>(null);
  const [serieActual, setSerieActual] = useState(0);
  const [completado, setCompletado] = useState(false);
  const [esUltimaSerie, setEsUltimaSerie] = useState(false);
  const [agregarSerieExtra, setAgregarSerieExtra] = useState(false);
  const [ejercicioTerminado, setEjercicioTerminado] = useState(false);
  const [mostrarBotonSerieExtra, setMostrarBotonSerieExtra] = useState(false);
  const [timerActivo, setTimerActivo] = useState(false);
  const [timerSegundos, setTimerSegundos] = useState(0);
  const [descansando, setDescansando] = useState(false);
  const [imagenGenerada, setImagenGenerada] = useState<string | null>(null);

  useEffect(() => {
    async function initSupabase() {
      const { createBrowserClient } = await import("@supabase/ssr");
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );
      setSupabase(client);
      
      const { data: sets } = await client
        .from("workout_sets")
        .select("*")
        .eq("workout_id", resolvedParams.id)
        .order("exercise_id", { ascending: true })
        .order("set_number", { ascending: true });

      if (sets && sets.length > 0) {
        const grouped: Record<string, EjercicioEnWorkout> = {};
        
        sets.forEach(set => {
          if (!grouped[set.exercise_id]) {
            grouped[set.exercise_id] = {
              exerciseId: set.exercise_id,
              name: set.exercise_name,
              equipment: "",
              sets: []
            };
          }
          grouped[set.exercise_id].sets.push({
            id: set.id,
            exercise_id: set.exercise_id,
            exercise_name: set.exercise_name,
            set_number: set.set_number,
            reps: set.reps,
            weight_kg: set.weight_kg,
            is_completed: set.is_completed
          });
        });

        setEjercicios(Object.values(grouped));
        console.log("Loaded exercises:", Object.values(grouped));
        
        const totalSets = Object.values(grouped).reduce((acc, e) => acc + e.sets.length, 0);
        const completedSets = Object.values(grouped).reduce((acc, e) => acc + e.sets.filter(s => s.is_completed).length, 0);
        if (totalSets > 0 && completedSets === totalSets) {
setCompletado(true);
        }
      }
      
      setLoading(false);
    }
    initSupabase();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!loading && completado && supabase) {
      const updateStatus = async () => {
        try {
          await supabase
            .from("workouts")
            .update({ status: "completed" })
            .eq("id", resolvedParams.id);
        } catch (err) {
          console.error("Exception updating workout status:", err);
        }
      };
      updateStatus();
    }
  }, [loading, completado, supabase, resolvedParams.id]);

  useEffect(() => {
    if (!ejercicioSeleccionado) return;
    const isLastSet = serieActual === ejercicioSeleccionado.sets.length - 1;
    const currentSet = ejercicioSeleccionado.sets[serieActual];
    if (isLastSet && currentSet && currentSet.reps > 0 && currentSet.weight_kg > 0 && !currentSet.is_completed) {
      setMostrarBotonSerieExtra(true);
    } else {
      setMostrarBotonSerieExtra(false);
    }
  }, [serieActual, ejercicioSeleccionado]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActivo && !descansando) {
      interval = setInterval(() => {
        setTimerSegundos(prev => {
          const newTime = prev + 1;
          if (newTime > 0 && newTime % 30 === 0) {
            if (navigator.vibrate) navigator.vibrate(200);
            playNotificationSound();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActivo, descansando]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (descansando) {
      interval = setInterval(() => {
        setTimerSegundos(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [descansando]);

  useEffect(() => {
    if (!ejercicioSeleccionado || ejercicioTerminado) return;
    const currentSet = ejercicioSeleccionado.sets[serieActual];
    const isLastSet = serieActual === ejercicioSeleccionado.sets.length - 1;
    if (currentSet && currentSet.reps > 0 && currentSet.weight_kg > 0 && !currentSet.is_completed && isLastSet) {
      setMostrarBotonSerieExtra(true);
    } else {
      setMostrarBotonSerieExtra(false);
    }
  }, [serieActual, ejercicioSeleccionado, ejercicioTerminado]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const getSetsCompletados = (ejercicio: EjercicioEnWorkout) => ejercicio.sets.filter(s => s.is_completed).length;
  const getTotalSets = (ejercicio: EjercicioEnWorkout) => ejercicio.sets.length;
  const getProgress = () => ({
    completed: ejercicios.reduce((acc, e) => acc + e.sets.filter(s => s.is_completed).length, 0),
    total: ejercicios.reduce((acc, e) => acc + e.sets.length, 0)
  });

  const compartirImagen = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 1080;
      canvas.height = 1920;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0a0a0a");
      gradient.addColorStop(1, "#18181b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#eab308";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TOTAL GYM", canvas.width / 2, 180);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 80px sans-serif";
      ctx.fillText("ENTRENAMIENTO", canvas.width / 2, 300);
      ctx.fillText("COMPLETADO", canvas.width / 2, 380);
      const quote = getDailyQuote();
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 40px serif";
      ctx.fillText(`"${quote}"`, canvas.width / 2, 550);
      const progress = getProgress();
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.roundRect(140, 700, 800, 150, 20);
      ctx.fill();
      ctx.strokeStyle = "#3f3f46";
      ctx.stroke();
      ctx.fillStyle = "#71717a";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Series", 180, 780);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${progress.completed}/${progress.total}`, 900, 780);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `entrenamiento-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (e) {
      console.error("Error generating image:", e);
    }
  };

  const actualizarSet = (field: 'reps' | 'weight_kg', value: number, isCompleted: boolean) => {
    if (!ejercicioSeleccionado || isCompleted) return;
    
    setEjercicios(prev => prev.map(ej => {
      if (ej.exerciseId === ejercicioSeleccionado.exerciseId) {
        const newSets = ej.sets.map((s, i) => i === serieActual ? { ...s, [field]: value } : s);
        return { ...ej, sets: newSets };
      }
      return ej;
    }));

    setEjercicioSeleccionado(prev => prev ? { 
      ...prev, 
      sets: prev.sets.map((s, i) => i === serieActual ? { ...s, [field]: value } : s)
    } : null);
  };

  const guardarSets = async (ejerciciosToSave?: EjercicioEnWorkout[]) => {
    if (!supabase || saving) return;
    
    let ejsToUse = ejerciciosToSave;
    if (!ejsToUse) {
      ejsToUse = ejercicios;
    }
    
    setSaving(true);
    try {
      console.log("Saving sets, ejercicios:", JSON.stringify(ejsToUse));
      
      await supabase.from("workout_sets").delete().eq("workout_id", resolvedParams.id);
      
      const setsToInsert = ejsToUse.flatMap(ej => 
        ej.sets.map((s, index) => ({
          workout_id: resolvedParams.id,
          exercise_id: ej.exerciseId,
          exercise_name: ej.name,
          set_number: index + 1,
          reps: Number(s.reps) || 0,
          weight_kg: Number(s.weight_kg) || 0,
          is_completed: Boolean(s.is_completed)
        }))
      );
      
      console.log("Inserting sets:", setsToInsert);
      
      const { data, error } = await supabase.from("workout_sets").insert(setsToInsert);
      
      if (error) {
        console.error("Insert error:", error);
      } else {
        console.log("Save successful!");
      }
    } catch (err) {
      console.error("Error saving sets:", err);
    } finally {
      setSaving(false);
    }
  };

  const agregarSerieExtraHandler = async () => {
    if (!ejercicioSeleccionado) return;
    const currentSet = ejercicioSeleccionado.sets[serieActual];
    if (currentSet.reps === 0 || currentSet.weight_kg === 0) return;

    const totalSetsOriginal = ejercicioSeleccionado.sets.length;
    let updatedEjercicios = [...ejercicios];
    let ejercicioIndex = updatedEjercicios.findIndex(e => e.exerciseId === ejercicioSeleccionado.exerciseId);
    
    if (ejercicioIndex >= 0) {
      updatedEjercicios[ejercicioIndex] = {
        ...updatedEjercicios[ejercicioIndex],
        sets: [
          ...updatedEjercicios[ejercicioIndex].sets.map((s, i) => i === serieActual ? { ...s, is_completed: true } : s),
          { exercise_id: ejercicioSeleccionado.exerciseId, exercise_name: ejercicioSeleccionado.name, set_number: totalSetsOriginal + 1, reps: 0, weight_kg: 0, is_completed: false }
        ]
      };
      setAgregarSerieExtra(true);
      setEjercicios(updatedEjercicios);
      setEjercicioSeleccionado(updatedEjercicios[ejercicioIndex]);
      setSerieActual(serieActual + 1);
      setMostrarBotonSerieExtra(false);
      await guardarSets(updatedEjercicios);
    }
  };

  const marcarSerieCompletada = async () => {
    if (!ejercicioSeleccionado) return;
    const currentSet = ejercicioSeleccionado.sets[serieActual];
    const isLastSet = serieActual === ejercicioSeleccionado.sets.length - 1;
    
    let updatedEjercicios = [...ejercicios];
    let ejercicioIndex = updatedEjercicios.findIndex(e => e.exerciseId === ejercicioSeleccionado.exerciseId);
    
    if (ejercicioIndex >= 0) {
      if (esUltimaSerie || isLastSet) {
        const setsToKeep = updatedEjercicios[ejercicioIndex].sets.slice(0, serieActual + 1).map(s => ({ ...s, is_completed: true }));
        updatedEjercicios[ejercicioIndex] = { ...updatedEjercicios[ejercicioIndex], sets: setsToKeep };
        
        setEjercicios(updatedEjercicios);
        setEjercicioSeleccionado(updatedEjercicios[ejercicioIndex]);
        setEjercicioTerminado(true);
        setEsUltimaSerie(false);
        await guardarSets(updatedEjercicios);
        return;
      }

      updatedEjercicios[ejercicioIndex] = {
        ...updatedEjercicios[ejercicioIndex],
        sets: updatedEjercicios[ejercicioIndex].sets.map((s, i) => i === serieActual ? { ...s, is_completed: true } : s)
      };
    }
    
    setEjercicios(updatedEjercicios);
    setEjercicioSeleccionado(updatedEjercicios[ejercicioIndex]);
    setEsUltimaSerie(false);
    await guardarSets();
    
    const progress = getProgress();
    if (progress.completed === progress.total) {
      setCompletado(true);
      if (supabase) await supabase.from("workouts").update({ status: "completed" }).eq("id", resolvedParams.id);
    } else {
      setTimerSegundos(0);
      setDescansando(true);
      setTimerActivo(false);
    }
  };

  const seleccionarEjercicio = (ejercicio: EjercicioEnWorkout) => {
    setEjercicioTerminado(false);
    setDescansando(false);
    setTimerSegundos(0);
    setTimerActivo(false);
    
    const ejercicioIndex = ejercicios.findIndex(e => e.exerciseId === ejercicio.exerciseId);
    if (ejercicioIndex >= 0) {
      const firstIncomplete = ejercicio.sets.findIndex(s => !s.is_completed);
      const serieIdx = firstIncomplete >= 0 ? firstIncomplete : 0;
      setSerieActual(serieIdx);
      setEjercicioSeleccionado(ejercicio);
      
      const currentSet = ejercicio.sets[serieIdx];
      setMostrarBotonSerieExtra(currentSet && currentSet.reps > 0 && currentSet.weight_kg > 0 && !currentSet.is_completed);
    } else {
      setSerieActual(0);
      setEjercicioSeleccionado(ejercicio);
    }
  };

  const getEquipmentLabel = (equipment: string) => {
    const barraKeywords = ['barbell', 'máquina', 'prensa', 'smith'];
    return barraKeywords.some(k => equipment?.toLowerCase().includes(k)) ? "Peso (kg)" : "Peso por lado (kg)";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <UserHeader showBack backHref="/" />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#eab308]" />
        </main>
      </div>
    );
  }

  if (completado) {
    const quote = getDailyQuote();
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#18181b] opacity-90" />
        <UserHeader showBack backHref="/" />
        <main className="relative z-10 pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-[#22c55e]" />
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              ENTRENAMIENTO <span className="text-[#22c55e]">COMPLETADO</span>
            </h1>
            <p className="text-[#a1a1aa] mb-8">¡Felicitaciones! Has terminado tu rutina de hoy.</p>
            <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-2xl p-6 mb-8">
              <Flame className="w-8 h-8 text-[#eab308] mx-auto mb-4" />
              <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-rajdhani)" }}>&ldquo;{quote}&rdquo;</p>
            </div>
            <div className="bg-[#18181b] rounded-xl p-4 mb-8">
              <span className="text-sm text-[#71717a]">Series: </span>
              <span className="text-sm font-bold text-[#22c55e]">{getProgress().completed}/{getProgress().total}</span>
            </div>
            <button onClick={compartirImagen} className="flex items-center justify-center gap-2 w-full py-4 mb-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer font-bold rounded-xl">
              <Share2 className="w-5 h-5" /> COMPARTIR
            </button>
            <button onClick={() => router.push("/historial")} className="flex items-center justify-center gap-2 w-full py-4 mb-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer font-bold rounded-xl">
              <History className="w-5 h-5" /> VER HISTORIAL
            </button>
            <button onClick={() => router.push("/")} className="flex items-center justify-center gap-2 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl">
              <Play className="w-5 h-5" /> IR AL INICIO
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (ejercicioSeleccionado) {
    const ejercicio = ejercicioSeleccionado;
    const set = ejercicio.sets[serieActual];
    const isLastSet = serieActual === ejercicio.sets.length - 1;
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <UserHeader showBack backHref="/" />
        <main className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto">
            <button onClick={() => { 
              setEjercicioSeleccionado(null);
              setDescansando(false);
              setTimerSegundos(0);
              const prog = getProgress();
              if (prog.completed === prog.total && prog.total > 0) {
                setCompletado(true);
                if (supabase) {
                  supabase.from("workouts").update({ status: "completed" }).eq("id", resolvedParams.id);
                }
              }
            }} className="flex items-center gap-2 text-[#a1a1aa] hover:text-white cursor-pointer mb-6">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <div className="bg-[#18181b] rounded-xl p-6 border border-[#3f3f46]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-2xl">{ejercicio.name}</h2>
                <span className="text-sm text-[#71717a]">{ejercicio.sets.length} series</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-6">
                {ejercicio.sets.map((_, idx) => (
                  <button key={idx} type="button" onClick={() => setSerieActual(idx)} disabled={idx > serieActual && !ejercicio.sets[idx].is_completed}
                    className={`w-10 h-10 rounded-full text-sm font-bold cursor-pointer ${idx === serieActual ? "bg-[#eab308] text-black" : ejercicio.sets[idx].is_completed ? "bg-[#22c55e] text-black" : "bg-[#27272a] text-[#71717a]"}`}>
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="text-center mb-6">
                <span className="text-sm text-[#71717a]">SERIE </span>
                <span className="text-4xl font-bold text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>{serieActual + 1}</span>
              </div>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm text-[#71717a] mb-2">REPETICIONES</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => !set.is_completed && set.reps > 0 && actualizarSet('reps', set.reps - 1, set.is_completed)} disabled={set.is_completed || set.reps <= 0}
                      className="w-12 h-12 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0">-</button>
                    <input type="number" value={set.reps || ""} onChange={(e) => actualizarSet('reps', parseInt(e.target.value) || 0, set.is_completed)} disabled={set.is_completed} inputMode="numeric"
                      className="flex-1 w-full px-4 py-4 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white text-center text-2xl" />
                    <button type="button" onClick={() => !set.is_completed && actualizarSet('reps', set.reps + 1, set.is_completed)} disabled={set.is_completed}
                      className="w-12 h-12 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#71717a] mb-2">{getEquipmentLabel(ejercicio.equipment)}</label>
                  <input type="number" value={set.weight_kg || ""} onChange={(e) => actualizarSet('weight_kg', parseFloat(e.target.value) || 0, set.is_completed)} disabled={set.is_completed}
                    className="w-full px-4 py-4 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white text-center text-2xl" />
                </div>
              </div>
              {mostrarBotonSerieExtra && set.reps > 0 && set.weight_kg > 0 && !set.is_completed && isLastSet && (
                <button type="button" onClick={agregarSerieExtraHandler}
                  className="flex items-center justify-center gap-2 w-full py-3 mb-4 border border-[#eab308] text-[#eab308] hover:bg-[#eab308]/10 cursor-pointer rounded-xl">
                  <Plus className="w-4 h-4" />Agregar serie extra
                </button>
              )}
              {!isLastSet && !set.is_completed && (
                <button type="button" onClick={() => setEsUltimaSerie(!esUltimaSerie)}
                  className={`flex items-center gap-3 w-full p-4 mb-4 rounded-xl border-2 transition-all cursor-pointer ${esUltimaSerie ? "bg-[#eab308]/20 border-[#eab308]" : "bg-[#18181b] border-[#3f3f46] hover:border-[#eab308]"}`}>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${esUltimaSerie ? "bg-[#eab308] border-[#eab308]" : "border-[#71717a]"}`}>
                    {esUltimaSerie && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <span className={`font-medium ${esUltimaSerie ? "text-[#eab308]" : "text-[#a1a1aa]"}`}>Marcar como última serie</span>
                </button>
              )}
              {!set.is_completed && (
                <button onClick={marcarSerieCompletada} disabled={saving || set.reps === 0 || set.weight_kg === 0}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#3f3f46] disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl mt-4">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> SERIE COMPLETADA</>}
                </button>
              )}
              {descansando && (
                <div className="mt-4 p-4 bg-[#18181b] rounded-xl border border-[#3f3f46]">
                  <div className="text-center mb-3">
                    <span className="text-sm text-[#71717a]">Descanso entre series</span>
                    <div className="text-4xl font-bold text-[#eab308] mt-1" style={{ fontFamily: "var(--font-oswald)" }}>
                      {Math.floor(timerSegundos / 60).toString().padStart(2, '0')}:{(timerSegundos % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <button onClick={() => { 
                    setDescansando(false); 
                    setTimerSegundos(0); 
                    setTimerActivo(false); 
                    setSerieActual(prev => prev + 1);
                  }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl">
                    <Play className="w-4 h-4" /> COMENZAR SERIE
                  </button>
                </div>
              )}
              {set.is_completed && !ejercicioTerminado && (
                <div className="text-center py-4 text-[#22c55e] font-bold">Serie completada</div>
              )}
              {ejercicioTerminado && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-[#22c55e] mb-4"><Trophy className="w-6 h-6" /><span className="font-bold">¡Ejercicio completado!</span></div>
                  <button onClick={() => { 
                    setEjercicioTerminado(false); 
                    setEjercicioSeleccionado(null);
                    const prog = getProgress();
                    if (prog.completed === prog.total && prog.total > 0) {
                      setCompletado(true);
                      if (supabase) {
                        supabase.from("workouts").update({ status: "completed" }).eq("id", resolvedParams.id);
                      }
                    }
                  }} className="text-[#eab308] font-bold cursor-pointer">Elegir otro</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = getProgress();
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <UserHeader showBack backHref="/" />
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>TU <span className="text-[#eab308]">ENTRENAMIENTO</span></h1>
          <p className="text-[#a1a1aa] mb-8">Elige un ejercicio</p>
          <div className="bg-[#18181b] rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2"><span className="text-sm text-[#71717a]">Progreso</span><span className="text-sm font-bold text-[#eab308]">{progress.completed}/{progress.total}</span></div>
            <div className="h-2 bg-[#27272a] rounded-full"><div className="h-full bg-[#eab308] transition-all" style={{ width: progress.total > 0 ? `${(progress.completed / progress.total) * 100}%` : '0%' }} /></div>
          </div>
          <div className="space-y-3">
            {ejercicios.map((ejercicio, idx) => {
              const completados = getSetsCompletados(ejercicio);
              const total = getTotalSets(ejercicio);
              const isComplete = completados === total;
              return (
                <button key={idx} type="button" onClick={() => seleccionarEjercicio(ejercicio)}
                  className={`w-full p-5 rounded-xl border-2 text-left cursor-pointer ${isComplete ? "bg-[#22c55e]/10 border-[#22c55e]/30" : "bg-[#18181b] border-[#3f3f46] hover:border-[#eab308]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isComplete ? <div className="w-10 h-10 bg-[#22c55e] rounded-full flex justify-center items-center"><Check className="w-5 h-5 text-black" /></div> 
                        : <div className="w-10 h-10 bg-[#27272a] rounded-full flex justify-center items-center"><Target className="w-5 h-5 text-[#71717a]" /></div>}
                      <div><h3 className="font-bold text-lg">{ejercicio.name}</h3><p className="text-sm text-[#71717a]">{total} series</p></div>
                    </div>
                    <span className={`text-lg font-bold ${isComplete ? "text-[#22c55e]" : "text-[#eab308]"}`}>{completados}/{total}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-between text-sm text-[#71717a]">
            <span>{progress.completed} completadas</span><span>{progress.total - progress.completed} restantes</span>
          </div>
        </div>
      </main>
    </div>
  );
}