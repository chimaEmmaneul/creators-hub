import { analyzeImageQuality, type QualityReport } from "./image-quality";

export interface CapturedImage {
  previewUrl: string;
  fileName: string;
  quality: QualityReport;
}

const PREVIEW_MAX_WIDTH = 960;
const ANALYSIS_WIDTH = 320;

type Drawable = HTMLVideoElement | ImageBitmap;

function sourceSize(source: Drawable) {
  return source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.width, height: source.height };
}

function drawScaled(source: Drawable, maxWidth: number, mirror = false) {
  const { width, height } = sourceSize(source);
  const scale = Math.min(1, maxWidth / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser couldn't process this image.");
  if (mirror) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

function process(source: Drawable, fileName: string, options: { mirror?: boolean; checkGlare?: boolean }): CapturedImage {
  const preview = drawScaled(source, PREVIEW_MAX_WIDTH, options.mirror);
  const sample = drawScaled(source, ANALYSIS_WIDTH);
  const pixels = sample.context.getImageData(0, 0, sample.canvas.width, sample.canvas.height);
  return {
    previewUrl: preview.canvas.toDataURL("image/jpeg", 0.85),
    fileName,
    quality: analyzeImageQuality(pixels, { checkGlare: options.checkGlare }),
  };
}

export function captureFromVideo(video: HTMLVideoElement, fileName: string, options: { mirror?: boolean; checkGlare?: boolean } = {}) {
  return process(video, fileName, options);
}

export async function captureFromFile(file: File, options: { checkGlare?: boolean } = {}): Promise<CapturedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Use a photo (JPG, PNG, HEIC or WebP).");
  const bitmap = await createImageBitmap(file);
  try {
    return process(bitmap, file.name, options);
  } finally {
    bitmap.close();
  }
}
