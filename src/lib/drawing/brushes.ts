import { sprayBrush, originalSprayBrush } from "./spray";

export type Point = {
  x: number;
  y: number;
  pressure: number;
  direction?: number;
};
export type BrushSettings = { color: string; size: number };
export interface Brush {
  id: string;
  name: string;
  createStroke?: () => Brush;
  prepare?: () => Promise<void>;
  continuous?: boolean;
  spacing?: number;
  stamp(
    ctx: CanvasRenderingContext2D,
    point: Point,
    settings: BrushSettings,
  ): void;
  finish?(
    ctx: CanvasRenderingContext2D,
    point: Point,
    settings: BrushSettings,
    direction: number,
  ): void;
}

// Add your own brush here. A stamp can draw shapes or a transparent image.
export const brushes: Brush[] = [
  sprayBrush,
  originalSprayBrush,
  {
    id: "paint-marker",
    name: "Paint marker",
    stamp(ctx, point, { color, size }) {
      const phase = (point.x * 0.7 + point.y * 0.9) / Math.max(size, 1);
      const swell = 1 + 0.035 * Math.sin(phase * 2.1);
      const radius = (size * (0.8 + 0.2 * point.pressure) * swell) / 2;
      // The entire tip has a broken, blunt front. There is no round stamp
      // underneath to fill its notches when the pointer stops.
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate((point.direction ?? Math.PI / 2) - Math.PI / 2);
      ctx.scale(radius, radius);
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(-0.98, -0.4);
      ctx.quadraticCurveTo(-0.55, -0.65, 0, -0.58);
      ctx.quadraticCurveTo(0.65, -0.62, 0.98, -0.35);
      ctx.lineTo(1.01, 0.19);
      ctx.quadraticCurveTo(0.99, 0.35, 0.87, 0.32);
      ctx.lineTo(0.72, 0.26);
      ctx.lineTo(0.6, 0.66);
      ctx.quadraticCurveTo(0.56, 0.74, 0.46, 0.69);
      ctx.lineTo(0.27, 0.53);
      ctx.lineTo(0.09, 0.83);
      ctx.quadraticCurveTo(0.02, 0.9, -0.12, 0.8);
      ctx.lineTo(-0.3, 0.72);
      ctx.lineTo(-0.34, 0.44);
      ctx.lineTo(-0.47, 0.5);
      ctx.lineTo(-0.61, 0.39);
      ctx.lineTo(-0.76, 0.43);
      ctx.quadraticCurveTo(-0.92, 0.42, -0.9, 0.24);
      ctx.lineTo(-1.02, 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "pen",
    name: "Pen",
    stamp(ctx, point, { color, size }) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, (size * point.pressure) / 2, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "grain",
    name: "Grain",
    stamp(ctx, point, { color, size }) {
      ctx.fillStyle = color;
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = (Math.sqrt(Math.random()) * size * point.pressure) / 2;
        ctx.fillRect(
          point.x + Math.cos(angle) * radius,
          point.y + Math.sin(angle) * radius,
          0.8,
          0.8,
        );
      }
    },
  },
];
