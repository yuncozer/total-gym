"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Dumbbell, Trophy, Zap, Target, Flame, Star } from "lucide-react";

interface MotivationalModalProps {
  show: boolean;
  phrase: string;
  subPhrase: string;
  onComplete: () => void;
  duration?: number;
}

const ICONS = [Dumbbell, Trophy, Zap, Target, Flame, Star];

const PARTICLE_POSITIONS = [
  { angle: 0, scale: 0.7, opacity: 0.8 },
  { angle: 30, scale: 0.9, opacity: 0.6 },
  { angle: 60, scale: 0.5, opacity: 0.9 },
  { angle: 90, scale: 0.8, opacity: 0.7 },
  { angle: 120, scale: 0.6, opacity: 0.5 },
  { angle: 150, scale: 1.0, opacity: 0.8 },
  { angle: 180, scale: 0.7, opacity: 0.6 },
  { angle: 210, scale: 0.9, opacity: 0.7 },
  { angle: 240, scale: 0.5, opacity: 0.9 },
  { angle: 270, scale: 0.8, opacity: 0.5 },
  { angle: 300, scale: 0.6, opacity: 0.8 },
  { angle: 330, scale: 1.0, opacity: 0.6 },
];

function generateIconIndex(): number {
  return Math.floor(Math.random() * ICONS.length);
}

export function MotivationalModal({ 
  show, 
  phrase, 
  subPhrase, 
  onComplete, 
  duration = 2500 
}: MotivationalModalProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const isShowingRef = useRef(false);

  const handleAnimationComplete = useCallback(() => {
    setAnimating(false);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 400);
  }, [onComplete]);

  useEffect(() => {
    if (show && !isShowingRef.current) {
      isShowingRef.current = true;
      setIconIndex(generateIconIndex());
      setVisible(true);
      
      const animTimer = setTimeout(() => {
        setAnimating(true);
      }, 20);

      const hideTimer = setTimeout(() => {
        handleAnimationComplete();
        isShowingRef.current = false;
      }, duration);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(hideTimer);
      };
    } else if (!show) {
      isShowingRef.current = false;
    }
  }, [show, duration, handleAnimationComplete]);

  if (!visible) return null;

  const IconComponent = ICONS[iconIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative transform transition-all duration-500 ease-out ${
          animating 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-50"
        }`}
      >
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent via-amber-400 to-accent rounded-2xl blur-lg opacity-50 animate-pulse" />
          
          <div className="relative bg-card rounded-2xl p-8 md:p-12 border border-accent/50 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
            
            <div className="absolute inset-0 overflow-hidden">
              {PARTICLE_POSITIONS.map((particle, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-accent rounded-full animate-particle"
                  style={{
                    left: `${50 + (Math.sin(particle.angle * Math.PI / 180) * 40)}%`,
                    top: `${50 + (Math.cos(particle.angle * Math.PI / 180) * 40)}%`,
                    animationDelay: `${i * 0.1}s`,
                    transform: `scale(${particle.scale})`,
                    opacity: particle.opacity,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            <div className="relative z-10 text-center">
              <div className={`mb-6 transition-transform duration-500 ${
                animating ? "animate-bounce-in" : ""
              }`}>
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-accent to-accent-hover rounded-full shadow-lg animate-icon-pulse">
                  <IconComponent className="w-12 h-12 text-black" strokeWidth={2.5} />
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-accent mb-3 animate-text-glow"
                style={{ fontFamily: "var(--font-oswald, sans-serif)" }}>
                {phrase}
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in-delayed">
                {subPhrase}
              </p>

              <div className="mt-8 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-accent rounded-full animate-ping"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes particle-burst {
          0% {
            transform: scale(0) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(2) translate(var(--tx), var(--ty));
            opacity: 0;
          }
        }
        
        .animate-particle {
          animation: particle-burst 1.5s ease-out infinite;
          --tx: 80px;
          --ty: 60px;
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }

        @keyframes icon-pulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(-5deg);
          }
          75% {
            transform: scale(1.1) rotate(5deg);
          }
        }

        .animate-icon-pulse {
          animation: icon-pulse 1.5s ease-in-out infinite;
        }

        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(234, 179, 8, 0.4);
          }
          50% {
            text-shadow: 0 0 40px rgba(234, 179, 8, 0.8), 0 0 60px rgba(234, 179, 8, 0.4);
          }
        }

        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }

        .animate-fade-in-delayed {
          animation: fadeInUp 0.5s ease-out 0.3s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}