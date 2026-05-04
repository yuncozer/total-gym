"use client";

import { Dumbbell, Flame, Zap, Trophy, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

const motivationalQuotes = [
  "El dolor que sientes hoy es la fuerza que sentirás mañana.",
  "No pares cuando estés fatiguado. Para cuando hayas terminado.",
  "La grandeza se construye en el gimnasio, pero se forja en la mente.",
  "Cada repetición te acerca más a tu mejor versión.",
  "No hay secretos. Solo entrenamiento consistencia.",
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
  "El champion se hace cuando nadie mira.",
  "Tu único competidor eres tú.",
  "La fuerza no viene del cuerpo, viene del corazón.",
  "Sudor hoy, gloria mañana.",
  "No te rindas cuando parezca difícil.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Levantate, entrena, repítelo.",
  "La metas se cumplen con acción.",
  "Haz que cada repetición compte.",
  "El gym es tu therapy.",
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

function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Home() {
  const quote = getDailyQuote();
  const dateStr = getFormattedDate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#3f3f46]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#eab308] rounded flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
              TOTAL<span className="text-[#eab308]">GYM</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-[#eab308] hover:text-white transition-colors">INICIO</a>
            <a href="#" className="text-[#a1a1aa] hover:text-white transition-colors">ENTRENAMIENTOS</a>
            <a href="#" className="text-[#a1a1aa] hover:text-white transition-colors">PROGRAMAS</a>
            <a href="#" className="text-[#a1a1aa] hover:text-white transition-colors">CONTACTO</a>
          </nav>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#18181b] opacity-90" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-[#eab308]/10 border border-[#eab308]/30 rounded-full px-4 py-2 mb-8">
              <Calendar className="w-4 h-4 text-[#eab308]" />
              <span className="text-sm text-[#eab308] uppercase tracking-wider" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {dateStr}
              </span>
            </div>

            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 animate-fade-in-up"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <span className="text-[#eab308]">CADA DÍA</span> <br />
              UNA NUEVA <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#eab308]">OPORTUNIDAD</span>
            </h1>

            <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-2xl p-8 md:p-12 mb-10 backdrop-blur-sm animate-pulse-glow">
              <Flame className="w-8 h-8 text-[#eab308] mx-auto mb-4" />
              <p 
                className="text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                &ldquo;{quote}&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/entrenamiento"
                className="group flex items-center justify-center gap-3 bg-[#eab308] hover:bg-[#ca9a04] text-black font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <Zap className="w-5 h-5" />
                COMENZAR RUTINA
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                className="flex items-center justify-center gap-3 border-2 border-[#3f3f46] hover:border-[#eab308] text-white font-bold px-8 py-4 rounded-xl transition-all hover:bg-[#eab308]/10"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <Trophy className="w-5 h-5" />
                VER PROGRAMAS
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#18181b]">
          <div className="max-w-6xl mx-auto px-4">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-16"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              ¿POR QUÉ <span className="text-[#eab308]">ELEGIRNOS?</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#0a0a0a] border border-[#3f3f46] rounded-2xl p-8 text-center hover:border-[#eab308] transition-colors group">
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <Dumbbell className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                  EQUIPAMIENTO PREMIUM
                </h3>
                <p className="text-[#a1a1aa]">
                  Las mejores marcas y equipos de última generación para tu entrenamiento.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#3f3f46] rounded-2xl p-8 text-center hover:border-[#eab308] transition-colors group">
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <Flame className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                  ENTRENADORES EXPERTOS
                </h3>
                <p className="text-[#a1a1aa]">
                  Profesionales certificados que te guia hacia tus metas.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#3f3f46] rounded-2xl p-8 text-center hover:border-[#eab308] transition-colors group">
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <Trophy className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                  RESULTADOS REALES
                </h3>
                <p className="text-[#a1a1aa]">
                  Metodología probada para transformations visibles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-[#3f3f46] py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#eab308] rounded flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
              TOTAL<span className="text-[#eab308]">GYM</span>
            </span>
          </div>
          <p className="text-[#a1a1aa] text-sm">
            © 2026 TOTAL GYM. Entrena como un campeón.
          </p>
        </div>
      </footer>
    </div>
  );
}