"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Camera, Share2, Download, X, RotateCcw, Loader2, BarChart3, MessageSquareQuote, Trophy, Check, Image as ImageIcon } from "lucide-react";
import type { ExerciseInWorkout } from "@/lib/workout/types";
import { getDailyQuote } from "@/lib/data/quote";

interface WorkoutPhotoOverlayProps {
  exercises: ExerciseInWorkout[];
  workoutName?: string;
  completedAt?: string | null;
  workoutDate?: string | null;
  onClose: () => void;
}

export function WorkoutPhotoOverlay({ exercises, workoutName, completedAt, workoutDate, onClose }: WorkoutPhotoOverlayProps) {
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [layout, setLayout] = useState<"metrics" | "quote" | "record">("metrics");
  const [captureMode, setCaptureMode] = useState<"camera" | "gallery">("camera");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, startOffset: 0 });

  const [showCrop, setShowCrop] = useState(false);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [cropMeta, setCropMeta] = useState({ naturalWidth: 0, naturalHeight: 0 });

  const dateStr = useMemo(() => {
    const date = completedAt
      ? new Date(completedAt)
      : workoutDate
        ? new Date(workoutDate + "T12:00:00")
        : new Date();
    if (isNaN(date.getTime())) return new Date().toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [completedAt, workoutDate]);

  const handleTakePhoto = () => {
    if (isAndroid) {
      setCaptureMode("camera");
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handlePickFromGallery = () => {
    setCaptureMode("gallery");
    galleryInputRef.current?.click();
  };

  const generateOverlay = useCallback(async (imageUrl: string) => {
    setGenerating(true);

    try {
      const [img, logoSrc, brandImg] = await Promise.all([
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
        new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.crossOrigin = "anonymous";
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error("Failed to load brand image"));
          i.src = "/images/share-workout/url-domain.png";
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

      const TOP_BAR_HEIGHT = Math.round(height * 0.3);
      const headerGradient = ctx.createLinearGradient(0, 0, 0, TOP_BAR_HEIGHT);
      headerGradient.addColorStop(0, "rgba(0, 0, 0, 0.85)");
      headerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, width, TOP_BAR_HEIGHT);

      const brandX = Math.round(width * 0.05);
      const topY = Math.round(TOP_BAR_HEIGHT * 0.12);

      if (layout === "quote") {
        const headerLogoSize = Math.max(Math.round(width * 0.13), 24);
        // ctx.globalAlpha = 0.6;
        ctx.drawImage(logoSrc, brandX, topY, headerLogoSize, headerLogoSize);
        // ctx.globalAlpha = 1.0;

        if (workoutName) {
          const nameSize = Math.max(Math.round(width * 0.025), 11);
          ctx.font = `500 ${nameSize}px system-ui, sans-serif`;
          ctx.fillStyle = "#e4e4e7";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          const displayName = workoutName.length > 28 ? workoutName.slice(0, 26) + "..." : workoutName;
          ctx.fillText(displayName, brandX, topY + headerLogoSize + Math.round(Math.max(Math.round(width * 0.04), 18) * 0.08));
        }
      } else {
        const brandSize = Math.max(Math.round(width * 0.04), 18);
        const brandHeight = Math.round(brandSize * 1.1);
        const brandWidth = Math.round(brandHeight * 2030 / 528);
        ctx.drawImage(brandImg, brandX, topY, brandWidth, brandHeight);

        if (workoutName) {
          const nameSize = Math.max(Math.round(width * 0.025), 11);
          ctx.font = `500 ${nameSize}px system-ui, sans-serif`;
          ctx.fillStyle = "#e4e4e7";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          const displayName = workoutName.length > 28 ? workoutName.slice(0, 26) + "..." : workoutName;
          ctx.fillText(displayName, brandX, topY + Math.round(brandHeight * 1.0) + Math.round(brandSize * 0.08));
        }
      }

      const dateSize = Math.max(Math.round(width * 0.021), 10);
      const logoMargin = Math.round(width * 0.05);
      ctx.font = `400 ${dateSize}px system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#e4e4e7";
      ctx.fillText(dateStr, width - logoMargin, topY);

      if (layout !== "quote") {
        const logoSize = Math.max(Math.round(width * 0.1), 24);
        const logoX = width - logoMargin - logoSize;
        ctx.globalAlpha = 0.6;
        ctx.drawImage(logoSrc, logoX, topY + Math.round(dateSize * 1.5), logoSize, logoSize);
        ctx.globalAlpha = 1.0;
      }

      const BOTTOM_BAR_HEIGHT = Math.round(height * (layout === "record" ? 0.12 : 0.28));
      const bottomY = height - BOTTOM_BAR_HEIGHT;
      const gradient = ctx.createLinearGradient(0, bottomY, 0, height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.15, "rgba(0, 0, 0, 0.7)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, bottomY, width, BOTTOM_BAR_HEIGHT);

      const maxExercises = exercises.length;
      const startY = bottomY + Math.round(BOTTOM_BAR_HEIGHT * 0.08);

      const totalY = height - Math.round(BOTTOM_BAR_HEIGHT * (layout === "record" ? 0.28 : 0.12));

      let separatorY: number;

      if (layout === "quote") {
        const quote = getDailyQuote();
        const quoteSize = Math.max(Math.round(width * 0.035), 16);
        const quoteX = Math.round(width * 0.94);
        const availableForContent = totalY - Math.round(BOTTOM_BAR_HEIGHT * 0.06) - startY;
        const quoteY = startY + Math.round(availableForContent * 0.35);

        ctx.font = `800 italic ${quoteSize}px "Barlow Condensed", system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#d4d4d8";
        const displayQuote = quote.length > 60 ? `\u201C${quote.slice(0, 58)}...\u201D` : `\u201C${quote}\u201D`;
        ctx.fillText(displayQuote, quoteX, quoteY);

        const brandSize = Math.max(Math.round(width * 0.04), 18);
        const brandH = Math.round(brandSize * 1.1);
        const brandW = Math.round(brandH * 2030 / 528);
        ctx.drawImage(brandImg, quoteX - brandW, quoteY + Math.round(quoteSize * 0.9), brandW, brandH);

        separatorY = totalY - Math.round(BOTTOM_BAR_HEIGHT * 0.22);
      } else if (layout === "record") {
        separatorY = totalY - Math.round(BOTTOM_BAR_HEIGHT * 0.22);
      } else {
        const lineHeight = Math.min(
          Math.round(BOTTOM_BAR_HEIGHT * 0.135),
          Math.round((totalY - Math.round(BOTTOM_BAR_HEIGHT * 0.06) - startY) / Math.max(maxExercises, 1))
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

        separatorY = totalY - Math.round(BOTTOM_BAR_HEIGHT * 0.22);
      }

      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(width * 0.06), separatorY);
      ctx.lineTo(Math.round(width * 0.94), separatorY);
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
  }, [exercises, dateStr, layout]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });

    const TARGET_RATIO = 9 / 16;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    if (Math.abs(aspectRatio - TARGET_RATIO) <= 0.02) {
      await generateOverlay(url);
    } else if (aspectRatio > TARGET_RATIO) {
      const cropH = img.naturalHeight;
      const cropW = Math.round(cropH * TARGET_RATIO);
      const srcX = Math.round((img.naturalWidth - cropW) / 2);

      const c = document.createElement("canvas");
      const maxDim = Math.min(1080, cropH);
      c.width = Math.round(maxDim * TARGET_RATIO);
      c.height = maxDim;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, srcX, 0, cropW, cropH, 0, 0, c.width, c.height);

      const croppedUrl = c.toDataURL("image/jpeg", 0.92);
      URL.revokeObjectURL(url);
      setPhotoUrl(croppedUrl);
      await generateOverlay(croppedUrl);
    } else {
      setCropMeta({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      setCropOffsetY(0);
      setShowCrop(true);
    }
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
          text: "¡Mira mi entrenamiento de hoy! 💪 Prueba TOTAL GYM aquí 👉 https://totalgym.life",
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
    setShowCrop(false);
    setCropOffsetY(0);
    handleTakePhoto();
  };

  const cancelCrop = () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoUrl(null);
    setShowCrop(false);
    setCropOffsetY(0);
  };

  const handleCropPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { startY: e.clientY, startOffset: cropOffsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cropOffsetY]);

  const handleCropPointerMove = useCallback((e: React.PointerEvent) => {
    const container = cropContainerRef.current;
    if (!container || cropMeta.naturalWidth === 0) return;
    const containerWidth = container.clientWidth;
    const displayImgHeight = containerWidth * cropMeta.naturalHeight / cropMeta.naturalWidth;
    const displayCropHeight = containerWidth * 16 / 9;
    const maxOffset = Math.max(0, (displayImgHeight - displayCropHeight) / 2);

    const deltaY = e.clientY - dragRef.current.startY;
    const newOffset = dragRef.current.startOffset + deltaY;
    setCropOffsetY(Math.max(-maxOffset, Math.min(maxOffset, newOffset)));
  }, [cropMeta]);

  const handleCropPointerUp = useCallback(() => {
  }, []);

  const confirmCrop = useCallback(async () => {
    const container = cropContainerRef.current;
    if (!container || !photoUrl || cropMeta.naturalWidth === 0) return;

    const containerWidth = container.clientWidth;
    const scale = containerWidth / cropMeta.naturalWidth;
    const cropHeight = cropMeta.naturalWidth * 16 / 9;
    const centeredSrcY = (cropMeta.naturalHeight - cropHeight) / 2;
    const srcY = Math.max(0, Math.min(cropMeta.naturalHeight - cropHeight, centeredSrcY - cropOffsetY / scale));

    const cropCanvas = document.createElement("canvas");
    const maxDim = Math.min(1080, cropMeta.naturalWidth * 16 / 9, cropMeta.naturalHeight);
    cropCanvas.width = Math.round(maxDim * 9 / 16);
    cropCanvas.height = maxDim;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = photoUrl;
    });

    const cropCtx = cropCanvas.getContext("2d")!;
    cropCtx.drawImage(img, 0, srcY, cropMeta.naturalWidth, cropHeight, 0, 0, cropCanvas.width, cropCanvas.height);

    const croppedUrl = cropCanvas.toDataURL("image/jpeg", 0.92);
    URL.revokeObjectURL(photoUrl);
    setPhotoUrl(croppedUrl);
    setShowCrop(false);
    await generateOverlay(croppedUrl);
  }, [photoUrl, cropMeta, cropOffsetY, generateOverlay]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {!isAndroid ? (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      ) : (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

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
            <p className="text-[#a1a1aa] mb-6">
              Toma una foto y agrega las métricas de tu entrenamiento para compartir en redes sociales.
            </p>
            <div className="flex gap-2 mb-6 bg-[#18181b] rounded-xl p-1 border border-[#3f3f46]">
              <button
                onClick={() => setLayout("metrics")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${layout === "metrics"
                    ? "bg-[#eab308] text-black"
                    : "text-[#71717a] hover:text-white"
                  }`}
              >
                <BarChart3 className="w-4 h-4" /> MÉTRICAS
              </button>
              <button
                onClick={() => setLayout("quote")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${layout === "quote"
                    ? "bg-[#eab308] text-black"
                    : "text-[#71717a] hover:text-white"
                  }`}
              >
                <MessageSquareQuote className="w-4 h-4" /> CITA
              </button>
              <button
                onClick={() => setLayout("record")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${layout === "record"
                    ? "bg-[#eab308] text-black"
                    : "text-[#71717a] hover:text-white"
                  }`}
              >
                <Trophy className="w-4 h-4" /> RÉCORD
              </button>
            </div>
            <button
              onClick={handleTakePhoto}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl"
            >
              <Camera className="w-5 h-5" /> TOMAR FOTO
            </button>
            {isAndroid && (
              <button
                onClick={handlePickFromGallery}
                className="flex items-center justify-center gap-2 w-full py-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer text-[#a1a1aa] hover:text-white font-bold rounded-xl mt-3"
              >
                <ImageIcon className="w-5 h-5" /> ELEGIR DE GALERÍA
              </button>
            )}
          </div>
        ) : showCrop ? (
          <div className="w-full max-w-lg">
            <p className="text-[#a1a1aa] text-sm text-center mb-4">
              Ajusta la foto al marco 9:16
            </p>
            <div
              ref={cropContainerRef}
              className="relative w-full overflow-hidden rounded-xl border-2 border-[#eab308] cursor-grab active:cursor-grabbing select-none"
              style={{ aspectRatio: "9/16", touchAction: "none" }}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerLeave={handleCropPointerUp}
            >
              <div style={{ transform: `translateY(calc(-50% + ${cropOffsetY}px))` }}>
                <img
                  src={photoUrl}
                  alt="Ajustar foto"
                  className="w-full h-auto pointer-events-none select-none"
                  draggable={false}
                />
              </div>
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#eab308] pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#eab308] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#eab308] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#eab308] pointer-events-none" />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelCrop}
                className="flex-1 py-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer text-[#a1a1aa] hover:text-white font-bold rounded-xl"
              >
                <X className="w-5 h-5 inline mr-2" /> CANCELAR
              </button>
              <button
                onClick={confirmCrop}
                className="flex-1 py-4 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl"
              >
                <Check className="w-5 h-5 inline mr-2" /> CONFIRMAR
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-lg">
            {generating ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#eab308]" />
              </div>
            ) : generatedImageUrl ? (
              <>
                <div className="w-full rounded-xl overflow-hidden border border-[#3f3f46] mb-6 shadow-lg bg-[#0a0a0a] flex items-center justify-center">
                  <img
                    src={generatedImageUrl}
                    alt="Entrenamiento TOTAL GYM"
                    className="max-w-full max-h-[55vh] w-auto h-auto"
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
