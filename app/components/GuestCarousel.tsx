"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, Zap, ArrowRight, ChevronDown, Play } from "lucide-react";

const carouselSlides = [
  {
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    title: "REGISTRA CADA SERIE",
    description: "Control total de repeticiones, peso y descanso. Tu progreso queda registrado.",
    highlight: "NUNCA MÁS PIERDAS DE VISTA TU EVOLUCIÓN"
  },
  {
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    title: "EVOLUCIONA CON DATOS",
    description: "Mira cuánto levantaste ayer, la semana pasada, el mes pasado. Supera cada récord.",
    highlight: "TUS NÚMEROS NO MIENTEN"
  },
  {
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
    title: "DESCANSO OPTIMIZADO",
    description: "Cronómetro automático entre series. Enfócate en entrenar, no en contar tiempo.",
    highlight: "CADA SEGUNDO CUENTA"
  },
  {
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    title: "TU GYMBRO DIGITAL",
    description: "Un compañero que te exige más. Disciplina y seguimiento sin excepciones.",
    highlight: "DISCIPLINA = RESULTADOS"
  }
];

interface GuestCarouselProps {
  onAuth: () => void;
}

export function GuestCarousel({ onAuth }: GuestCarouselProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = carouselSlides[currentSlide];

  return (
    <div className="relative mb-10">
      <div className="absolute -inset-0.5 bg-linear-to-r from-accent/20 via-accent/10 to-accent/20 rounded-3xl blur-xl opacity-50" />

        <div className="relative overflow-hidden rounded-2xl bg-black/70 border border">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative p-6 md:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 order-2 lg:order-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                {carouselSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? "w-8 bg-accent" : "w-3 bg-zinc-700 hover:bg-zinc-600"
                      }`}
                  />
                ))}
              </div>

              <div className="mb-4">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "var(--font-oswald)" }}>
                  {current.title}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                  {current.description}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-accent/10 border border-accent/30 rounded-lg mb-4 sm:mb-6">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald)" }}>
                  {current.highlight}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start w-full">
                <button
                  onClick={() => document.getElementById('daily-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center justify-center gap-2 sm:gap-3 bg-muted hover:bg-zinc-700 text-white text-base sm:text-lg font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Play className="w-5 h-5" />
                  PRUEBA AHORA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="group flex items-center justify-center gap-2 sm:gap-3 bg-accent hover:bg-accent-hover text-black text-base sm:text-lg font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Zap className="w-5 h-5" />
                  CREAR CUENTA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex-shrink-0">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-[0_0_40px_rgba(234,179,8,0.3)] mx-auto lg:mx-0">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-accent rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 py-4 border-t border-muted">
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
            className="p-2 rounded-lg bg-card border border hover:border-accent hover:bg-accent/10 transition-all"
          >
            <ChevronDown className="w-5 h-5 text-icon" />
          </button>
          <span className="text-zinc-600 text-sm font-mono">
            {currentSlide + 1} / {carouselSlides.length}
          </span>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)}
            className="p-2 rounded-lg bg-card border border hover:border-accent hover:bg-accent/10 transition-all"
          >
            <ChevronDown className="w-5 h-5 text-icon rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}