"use client";

import { useState, useEffect, useRef } from "react";
import { Images, Plus, Loader2, X, Play } from "lucide-react";
import toast from "react-hot-toast";
import { MediaLightbox } from "./MediaLightbox";

interface GalleryItem {
  id: string;
  mediaType: "image" | "video";
  url: string;
}

const MAX_ITEMS = 12;
const MAX_VIDEO_SECONDS = 30;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("No se pudo leer el video"));
    };
    video.src = URL.createObjectURL(file);
  });
}

export function TrainerGalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/trainer/gallery")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (items.length >= MAX_ITEMS) {
      toast.error(`Máximo ${MAX_ITEMS} elementos en la galería`);
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Formato no soportado");
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      toast.error(`Archivo muy grande (máx ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }

    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_SECONDS) {
          toast.error(`El video debe durar máximo ${MAX_VIDEO_SECONDS} segundos`);
          return;
        }
      } catch {
        toast.error("No se pudo leer el video");
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/trainer/gallery", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el archivo");
      setItems((prev) => [...prev, { id: data.id, mediaType: data.mediaType, url: data.url }]);
      toast.success("Agregado a la galería");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      const res = await fetch("/api/trainer/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-card border border rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-white">Galería</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || items.length >= MAX_ITEMS}
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Agregar
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Fotos y videos cortos (máx {MAX_VIDEO_SECONDS}s) para mostrar en tu página pública. {items.length}/{MAX_ITEMS}
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-icon" />
        </div>
      ) : items.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border border-dashed rounded-xl text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
        >
          <Images className="w-6 h-6" />
          <span className="text-xs">Sube tu primera foto o video</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-background group">
              <button
                onClick={() => setLightboxItem(item)}
                className="w-full h-full cursor-pointer"
              >
                {item.mediaType === "video" ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </>
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Eliminar"
              >
                {deletingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFile}
        className="hidden"
      />

      <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
