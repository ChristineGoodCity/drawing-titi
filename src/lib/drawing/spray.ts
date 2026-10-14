import { withDrips } from "./drippingSpray";
import originalUrl from "../../assets/brushes/spray-original.png";
import sourceUrl from "../../assets/brushes/spray-source.png";
import type { Brush } from "./brushes";

function createSprayBrush(id: string, name: string, imageUrl: string): Brush {
  let mask: HTMLCanvasElement | undefined;
  let preparation: Promise<void> | undefined;
  let tinted: HTMLCanvasElement | undefined;
  let tintColor = "";

  function prepare() {
    if (preparation) return preparation;
    preparation = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < pixels.data.length; i += 4) {
            const light =
              pixels.data[i] * 0.2126 +
              pixels.data[i + 1] * 0.7152 +
              pixels.data[i + 2] * 0.0722;
            // White becomes transparent; gray retains partial coverage.
            pixels.data[i + 3] *= (255 - light) / 255;
            pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0;
          }
          ctx.putImageData(pixels, 0, 0);
          mask = canvas;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error("Could not load spray image"));
      image.src = imageUrl;
    });
    return preparation;
  }

  return {
    id,
    name,
    continuous: true,
    spacing: 0.18,
    prepare,
    stamp(ctx, point, { color, size }) {
      if (!mask) return;
      if (!tinted || tintColor !== color) {
        tinted = document.createElement("canvas");
        tinted.width = mask.width;
        tinted.height = mask.height;
        const tint = tinted.getContext("2d")!;
        tint.drawImage(mask, 0, 0);
        tint.globalCompositeOperation = "source-in";
        tint.fillStyle = color;
        tint.fillRect(0, 0, tinted.width, tinted.height);
        tintColor = color;
      }
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

export const sprayBrush = createSprayBrush("spray", "Spray", sourceUrl);
export const originalSprayBrush = withDrips(
  createSprayBrush("spray-original", "Spray Drip", originalUrl),
);
