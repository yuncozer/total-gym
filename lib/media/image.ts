export interface ReencodeImageOptions {
  maxDimension: number;
  square?: boolean;
  quality?: number;
}

export async function reencodeImageAsJpeg(file: File, opts: ReencodeImageOptions): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;

  const { maxDimension, square = false, quality = 0.85 } = opts;

  try {
    const bitmap = await createImageBitmap(file);

    let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
    if (square) {
      const side = Math.min(bitmap.width, bitmap.height);
      sx = Math.round((bitmap.width - side) / 2);
      sy = Math.round((bitmap.height - side) / 2);
      sw = side;
      sh = side;
    }

    const scale = Math.min(1, maxDimension / Math.max(sw, sh));
    const targetW = Math.round(sw * scale);
    const targetH = Math.round(sh * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    return blob || file;
  } catch (err) {
    console.error("No se pudo recodificar la imagen, se sube el original:", err);
    return file;
  }
}
