"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Share2, Download, X, RotateCcw, Loader2 } from "lucide-react";
import type { ExerciseInWorkout } from "@/lib/workout/types";

interface WorkoutPhotoOverlayProps {
  exercises: ExerciseInWorkout[];
  onClose: () => void;
}

export function WorkoutPhotoOverlay({ exercises, onClose }: WorkoutPhotoOverlayProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dateStr = new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  const generateOverlay = useCallback(async (imageUrl: string) => {
    setGenerating(true);

    try {
      const [img, logoSrc] = await Promise.all([
        new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.crossOrigin = "anonymous";
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error("Failed to load image"));
          i.src = imageUrl;
        }),
        new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.crossOrigin = "anonymous";
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error("Failed to load logo"));
          i.src = "/icon-512.png";
        }),
      ]);

      await document.fonts.ready;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = img.naturalWidth;
      let height = img.naturalHeight;
      const MAX_DIM = 1080;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      let maxWeight = 0;
      let maxWeightExercise = "";
      let totalCompletedSets = 0;

      exercises.forEach(e => {
        e.sets.forEach(s => {
          if (!s.is_completed) return;
          totalCompletedSets++;
          if (s.weight_kg > maxWeight) {
            maxWeight = s.weight_kg;
            maxWeightExercise = e.name;
          }
        });
      });

      const TOP_BAR_HEIGHT = Math.round(height * 0.1);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, width, TOP_BAR_HEIGHT);

      const brandSize = Math.max(Math.round(width * 0.04), 18);
      const brandX = Math.round(width * 0.05);
      const brandY = Math.round(TOP_BAR_HEIGHT / 2);
      ctx.font = `700 ${brandSize}px Oswald, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("TOTAL ", brandX, brandY);
      ctx.fillStyle = "#eab308";
      ctx.fillText("GYM", brandX + ctx.measureText("TOTAL ").width, brandY);

      const logoSize = Math.max(Math.round(width * 0.065), 28);
      const logoMargin = Math.round(width * 0.05);
      const logoX = width - logoMargin - logoSize;
      const logoY = Math.round((TOP_BAR_HEIGHT - logoSize) / 2);
      ctx.drawImage(logoSrc, logoX, logoY, logoSize, logoSize);

      const dateSize = Math.max(Math.round(width * 0.026), 12);
      ctx.font = `400 ${dateSize}px system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e4e4e7";
      ctx.fillText(dateStr, logoX - Math.round(width * 0.025), Math.round(TOP_BAR_HEIGHT / 2));

      const BOTTOM_BAR_HEIGHT = Math.round(height * 0.28);
      const bottomY = height - BOTTOM_BAR_HEIGHT;
      const gradient = ctx.createLinearGradient(0, bottomY, 0, height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.15, "rgba(0, 0, 0, 0.7)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, bottomY, width, BOTTOM_BAR_HEIGHT);

      const maxExercises = exercises.length;
      const startY = bottomY + Math.round(BOTTOM_BAR_HEIGHT * 0.08);
      const lineHeight = Math.min(
        Math.round(BOTTOM_BAR_HEIGHT * 0.135),
        Math.round((BOTTOM_BAR_HEIGHT * 0.65) / Math.max(maxExercises, 1))
      );
      const nameFontSize = Math.max(Math.round(width * 0.024), 11);
      const setsFontSize = Math.max(Math.round(width * 0.021), 10);

      exercises.forEach((e, i) => {
        const completedSets = e.sets.filter(s => s.is_completed).length;
        const y = startY + i * lineHeight;

        ctx.fillStyle = "#e4e4e7";
        ctx.font = `400 ${nameFontSize}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const displayName = e.name.length > 24 ? e.name.slice(0, 22) + "..." : e.name;
        ctx.fillText(displayName, Math.round(width * 0.05), y);

        ctx.fillStyle = "#eab308";
        ctx.font = `500 ${setsFontSize}px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(`${completedSets} series`, Math.round(width * 0.95), y);
      });

      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const numEntries = Math.max(maxExercises, 1);
      const lineTopY = startY + numEntries * lineHeight + Math.round(BOTTOM_BAR_HEIGHT * 0.025);
      const totalY = lineTopY + Math.round(BOTTOM_BAR_HEIGHT * 0.2);
      ctx.moveTo(Math.round(width * 0.06), lineTopY);
      ctx.lineTo(Math.round(width * 0.94), lineTopY);
      ctx.stroke();

      const totalFontSize = Math.max(Math.round(width * 0.026), 11);
      ctx.font = `500 ${totalFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#eab308";
      ctx.fillText(
        `${totalCompletedSets} ${totalCompletedSets === 1 ? "serie" : "series"} completadas`,
        Math.round(width * 0.06),
        totalY
      );

      ctx.textAlign = "right";
      ctx.fillStyle = "#e4e4e7";
      const recordLabel = maxWeightExercise
        ? `Récord: ${maxWeight} kg (${maxWeightExercise.length > 18 ? maxWeightExercise.slice(0, 16) + "..." : maxWeightExercise})`
        : "";
      ctx.fillText(recordLabel, Math.round(width * 0.94), totalY);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setGeneratedImageUrl(dataUrl);
    } catch (err) {
      console.error("Error generating overlay:", err);
    } finally {
      setGenerating(false);
    }
  }, [exercises, dateStr]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    await generateOverlay(url);
  }, [generateOverlay]);

  const handleShare = async () => {
    if (!generatedImageUrl) return;

    try {
      const res = await fetch(generatedImageUrl);
      const blob = await res.blob();
      const file = new File([blob], "total-gym-workout.jpg", { type: "image/jpeg" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Mi entrenamiento - TOTAL GYM",
          text: "¡Mira mi entrenamiento de hoy!",
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        handleDownload();
      }
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement("a");
    link.download = `total-gym-${dateStr.replace(/\//g, "-")}.jpg`;
    link.href = generatedImageUrl;
    link.click();
  };

  const handleRetake = () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoUrl(null);
    setGeneratedImageUrl(null);
    handleTakePhoto();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between p-4 border-b border-[#3f3f46]">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
          FOTO DEL <span className="text-[#eab308]">ENTRENAMIENTO</span>
        </h2>
        <button onClick={onClose} className="p-2 text-[#71717a] hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {!photoUrl ? (
          <div className="text-center max-w-sm">
            <div className="w-32 h-32 bg-[#18181b] rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-[#3f3f46]">
              <Camera className="w-12 h-12 text-[#71717a]" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              CAPTURA TU <span className="text-[#eab308]">LOGRO</span>
            </h3>
            <p className="text-[#a1a1aa] mb-8">
              Toma una foto y agrega las métricas de tu entrenamiento para compartir en redes sociales.
            </p>
            <button
              onClick={handleTakePhoto}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl"
            >
              <Camera className="w-5 h-5" /> TOMAR FOTO
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-lg">
            {generating ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#eab308]" />
              </div>
            ) : generatedImageUrl ? (
              <>
                <div className="w-full rounded-xl overflow-hidden border border-[#3f3f46] mb-6 shadow-lg">
                  <img
                    src={generatedImageUrl}
                    alt="Entrenamiento TOTAL GYM"
                    className="w-full h-auto"
                  />
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl"
                  >
                    <Share2 className="w-5 h-5" /> COMPARTIR
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 w-full py-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer font-bold rounded-xl"
                  >
                    <Download className="w-5 h-5" /> GUARDAR IMAGEN
                  </button>
                  <button
                    onClick={handleRetake}
                    className="flex items-center justify-center gap-2 w-full py-3 text-[#71717a] hover:text-white cursor-pointer font-bold rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4" /> TOMAR OTRA FOTO
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
