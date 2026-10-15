import { createImageTip } from "./imageTip";
import { withDrips } from "./drippingSpray";
import originalUrl from "../../assets/brushes/spray-original.png";
import sourceUrl from "../../assets/brushes/spray-source.png";
import type { Brush, Point } from "./types";

function createSprayBrush(id: string, name: string, imageUrl: string): Brush {
  const tip = createImageTip(imageUrl);

  return {
    id,
    name,
    continuous: true,
    spacing: 0.18,
    prepare: tip.prepare,
    stamp(ctx, point, { color, size }) {
      const tinted = tip.tint(color);
      if (!tinted) return;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.globalAlpha = 0.16 * point.pressure;
      // Size describes the paint core; the fine overspray extends beyond it.
      const diameter = size * 1.8;
      ctx.drawImage(tinted, -diameter / 2, -diameter / 2, diameter, diameter);
      ctx.restore();
    },
  };
}

const sprayBase = createSprayBrush("spray", "Spray", sourceUrl);

export const sprayBrush: Brush = {
  ...sprayBase,
  createStroke() {
    let anchor: Point | undefined;
    let heldSince = 0;
    return {
      ...sprayBase,
      stamp(ctx, point, settings) {
        const now = performance.now();
        // Ignore tiny hand tremors, but reset spread as soon as the stroke moves on.
        const tolerance = Math.max(2, settings.size * 0.08);
        if (!anchor || Math.hypot(point.x - anchor.x, point.y - anchor.y) > tolerance) {
          anchor = { ...point };
          heldSince = now;
        }
        const heldSeconds = Math.max(0, (now - heldSince) / 1000 - 0.15);
        // Gradually add a modest spread, capped at 35% above the selected size.
        const growth = 1 + 0.35 * Math.min(1, heldSeconds / 2);
        sprayBase.stamp(ctx, point, { ...settings, size: settings.size * growth });
      },
    };
  },
};
export const originalSprayBrush = withDrips(
  createSprayBrush("spray-original", "Spray Drip", originalUrl),
);
