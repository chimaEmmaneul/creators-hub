import { describe, expect, it } from "vitest";
import { analyzeImageQuality, type PixelData } from "@/features/verification/lib/image-quality";

const SIZE = 64;

function image(level: (x: number, y: number) => number): PixelData {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const o = (y * SIZE + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = level(x, y);
      data[o + 3] = 255;
    }
  }
  return { data, width: SIZE, height: SIZE };
}

const sharpDocument = (x: number, y: number) => ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? 190 : 70);

describe("analyzeImageQuality", () => {
  it("passes a well-lit, detailed photo", () => {
    expect(analyzeImageQuality(image(sharpDocument)).issues).toEqual([]);
  });

  it("flags a dark photo", () => {
    expect(analyzeImageQuality(image((x, y) => sharpDocument(x, y) / 5)).issues).toContain("TOO_DARK");
  });

  it("flags a flat, featureless (blurry) photo", () => {
    expect(analyzeImageQuality(image(() => 128)).issues).toContain("BLURRY");
  });

  it("flags glare when a patch is blown out", () => {
    const withGlare = (x: number, y: number) => (x < 24 && y < 24 ? 255 : sharpDocument(x, y));
    expect(analyzeImageQuality(image(withGlare)).issues).toContain("GLARE");
  });

  it("can skip the glare check (selfies)", () => {
    const withGlare = (x: number, y: number) => (x < 24 && y < 24 ? 255 : sharpDocument(x, y));
    expect(analyzeImageQuality(image(withGlare), { checkGlare: false }).issues).not.toContain("GLARE");
  });
});
