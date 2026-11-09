/** Profile photo helpers (FR-03.5). Phones take 3-10 MB photos, so the browser shrinks them before upload. */
export const AVATAR_MAX_SIDE = 512;
export const AVATAR_JPEG_QUALITY = 0.85;

export function fitWithin(width: number, height: number, max = AVATAR_MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", AVATAR_JPEG_QUALITY));
  if (!blob) throw new Error("could not encode image");
  return blob;
}