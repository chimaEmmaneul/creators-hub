import { formatFileSize } from "@/lib/format";
import { THUMBNAIL_LIMITS, VIDEO_LIMITS } from "@/lib/schemas";

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm)$/i;

export const VIDEO_ACCEPT = [...VIDEO_LIMITS.mimeTypes, ".mp4", ".mov", ".webm"].join(",");
export const IMAGE_ACCEPT = THUMBNAIL_LIMITS.mimeTypes.join(",");

export function validateVideoFile(file: File): string | null {
  const typeOk = (VIDEO_LIMITS.mimeTypes as readonly string[]).includes(file.type) || VIDEO_EXTENSIONS.test(file.name);
  if (!typeOk) return "Upload an MP4, MOV or WebM video.";
  if (file.size === 0) return "This file is empty. Choose another video.";
  if (file.size > VIDEO_LIMITS.maxBytes) return `Videos can be up to ${formatFileSize(VIDEO_LIMITS.maxBytes)}.`;
  return null;
}

export function validateImageFile(file: File): string | null {
  if (!(THUMBNAIL_LIMITS.mimeTypes as readonly string[]).includes(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > THUMBNAIL_LIMITS.maxSourceBytes) return `Images can be up to ${formatFileSize(THUMBNAIL_LIMITS.maxSourceBytes)}.`;
  return null;
}

const THUMBNAIL_SIZE = { width: 640, height: 360 };

export async function createThumbnailDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_SIZE.width;
  canvas.height = THUMBNAIL_SIZE.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this image.");

  const targetRatio = THUMBNAIL_SIZE.width / THUMBNAIL_SIZE.height;
  const sourceRatio = bitmap.width / bitmap.height;
  const cropWidth = sourceRatio > targetRatio ? bitmap.height * targetRatio : bitmap.width;
  const cropHeight = sourceRatio > targetRatio ? bitmap.height : bitmap.width / targetRatio;
  context.drawImage(
    bitmap,
    (bitmap.width - cropWidth) / 2,
    (bitmap.height - cropHeight) / 2,
    cropWidth,
    cropHeight,
    0,
    0,
    THUMBNAIL_SIZE.width,
    THUMBNAIL_SIZE.height,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
