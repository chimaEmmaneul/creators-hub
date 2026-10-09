export type QualityIssue = "TOO_DARK" | "TOO_BRIGHT" | "GLARE" | "BLURRY";

export interface QualityReport {
  brightness: number;
  glareRatio: number;
  sharpness: number;
  issues: QualityIssue[];
}

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const QUALITY_THRESHOLDS = {
  minBrightness: 55,
  maxBrightness: 235,
  glarePixelLevel: 250,
  maxGlareRatio: 0.06,
  minSharpness: 40,
} as const;

export const QUALITY_ISSUE_COPY: Record<QualityIssue, string> = {
  TOO_DARK: "Too dark. Move somewhere brighter or turn on a light.",
  TOO_BRIGHT: "Washed out. Move away from direct light or a bright window.",
  GLARE: "Glare is hiding part of the photo. Tilt it slightly away from the light.",
  BLURRY: "Blurry. Hold still and let the camera focus before capturing.",
};

function toGrayscale({ data, width, height }: PixelData) {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return gray;
}

function laplacianVariance(gray: Float32Array, width: number, height: number) {
  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const value = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += value;
      sumSquares += value * value;
      count++;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return sumSquares / count - mean * mean;
}

export function analyzeImageQuality(pixels: PixelData, { checkGlare = true } = {}): QualityReport {
  const gray = toGrayscale(pixels);
  let total = 0;
  let glarePixels = 0;
  for (const value of gray) {
    total += value;
    if (value >= QUALITY_THRESHOLDS.glarePixelLevel) glarePixels++;
  }
  const brightness = gray.length ? total / gray.length : 0;
  const glareRatio = gray.length ? glarePixels / gray.length : 0;
  const sharpness = laplacianVariance(gray, pixels.width, pixels.height);

  const issues: QualityIssue[] = [];
  if (brightness < QUALITY_THRESHOLDS.minBrightness) issues.push("TOO_DARK");
  else if (brightness > QUALITY_THRESHOLDS.maxBrightness) issues.push("TOO_BRIGHT");
  if (checkGlare && glareRatio > QUALITY_THRESHOLDS.maxGlareRatio && !issues.includes("TOO_BRIGHT")) issues.push("GLARE");
  if (sharpness < QUALITY_THRESHOLDS.minSharpness && !issues.includes("TOO_DARK")) issues.push("BLURRY");

  return { brightness, glareRatio, sharpness, issues };
}
