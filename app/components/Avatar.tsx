"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  fallback: string;
  className: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  /** Si es true y hay foto, tocarla la abre ampliada a pantalla completa. */
  expandable?: boolean;
}

const OSWALD: React.CSSProperties = { fontFamily: "var(--font-oswald)" };

export function Avatar({ src, fallback, className, textClassName, textStyle = OSWALD, expandable = false }: AvatarProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = expandable && !!src;

  return (
    <>
      <div
        className={`${className} overflow-hidden${canExpand ? " cursor-pointer" : ""}`}
        onClick={canExpand ? (e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true); } : undefined}
        role={canExpand ? "button" : undefined}
        aria-label={canExpand ? "Ampliar foto" : undefined}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className={textClassName} style={textStyle}>{fallback.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {canExpand && expanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(false); }}
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(false); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 border border flex items-center justify-center text-white hover:text-accent transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src as string}
            alt=""
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
