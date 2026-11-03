import { withDrips } from "./drippingSpray";
import type { Brush, Point } from "./types";

const TIP_RESOLUTION = 192;

// Cache a fine-grained soft mask so each dab costs only one image draw.
function createSoftSprayTip() {
  let mask: HTMLCanvasElement | undefined;
  let tinted: HTMLCanvasElement | undefined;
  let lastColor = "";
  return (color: string) => {
    if (!mask) {
      mask = document.createElement("canvas");
      mask.width = mask.height = TIP_RESOLUTION;
      const ctx = mask.getContext("2d")!;
      const pixels = ctx.createImageData(TIP_RESOLUTION, TIP_RESOLUTION);
      for (let y = 0; y < TIP_RESOLUTION; y++) {
        for (let x = 0; x < TIP_RESOLUTION; x++) {
          const r = Math.hypot((x - (TIP_RESOLUTION - 1) / 2) / (TIP_RESOLUTION / 2),
            (y - (TIP_RESOLUTION - 1) / 2) / (TIP_RESOLUTION / 2));
          // Dense center, long smoky falloff, and no hard outer ring.
          const edge = Math.max(0, 1 - r * r);
          const density = edge ** 2.8;
          const grain = 0.72 + Math.random() * 0.28;
          pixels.data[(y * TIP_RESOLUTION + x) * 4 + 3] = 255 * density * grain;
        }
      }
      ctx.putImageData(pixels, 0, 0);
    }
    if (!tinted || color !== lastColor) {
      tinted ??= document.createElement("canvas");
      tinted.width = tinted.height = TIP_RESOLUTION;
      const ctx = tinted.getContext("2d")!;
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, TIP_RESOLUTION, TIP_RESOLUTION);
      lastColor = color;
    }
    return tinted;
  };
}

const softTip = createSoftSprayTip();
export const spray1Brush: Brush = {
  id: "spray-1",
  name: "Spray 1",
  continuous: true,
  spacing: 0.035,
  createStroke() {
    let previous: Point | undefined;
    let travel = 0;
    let heading: number | undefined;
    let tipSize = 0;
    return {
      ...spray1Brush,
      stamp(ctx, point, settings) {
        if (previous) {
          const dx = point.x - previous.x;
          const dy = point.y - previous.y;
          const distance = Math.hypot(dx, dy);
          travel += distance;
          if (distance > 0.01) heading = Math.atan2(dy, dx);
        }
        previous = { ...point };
        // Begin with the full rounded tip instead of tapering in.
        tipSize = settings.size;
        spray1Brush.stamp(ctx, point, settings);
      },
      finish(ctx, point, settings) {
        if (heading === undefined || travel < settings.size * 0.3) return;
        // Finish with a short taper and a rounded cap. Existing
        // paint stays intact, including any strokes beneath the endpoint.
        const length = Math.min(tipSize * 0.45, travel * 0.2);
        const steps = Math.max(8, Math.ceil(length / 0.45));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const taper = 0.18 + 0.82 * (1 - t) ** 1.1;
          spray1Brush.stamp(ctx, {
            ...point,
            x: point.x + Math.cos(heading) * length * t,
            y: point.y + Math.sin(heading) * length * t,
          }, { ...settings, size: tipSize * taper });
        }
      },
    };
  },
  stamp(ctx, point, { color, size }) {
    const pressure = Math.max(0.1, Math.min(1, point.pressure));
    const diameter = size * 2.25 * (0.22 + 0.78 * pressure);
    const tip = softTip(color);
    ctx.save();
    ctx.translate(point.x, point.y);
    // Nearly circular, centered layers keep the soft spray edge while
    // making the tip and its endpoints rounder.
    ctx.globalAlpha = 0.13 * pressure;
    ctx.drawImage(tip, -diameter * 0.54, -diameter * 0.5,
      diameter * 1.08, diameter);
    ctx.globalAlpha = 0.48 * (0.35 + 0.65 * pressure);
    ctx.drawImage(tip, -diameter * 0.42, -diameter * 0.36,
      diameter * 0.84, diameter * 0.72);
    ctx.restore();
  },
};
export const spray1DripBrush = withDrips(
  { ...spray1Brush, id: "spray-1-drip", name: "Spray 1 drip" },
  { wetCore: false },
);
