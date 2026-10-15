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
  // Called only on a normal pointer release, never cancellation or blur.
  finish?(ctx: CanvasRenderingContext2D, point: Point, settings: BrushSettings): void;
  stamp(
    ctx: CanvasRenderingContext2D,
    point: Point,
    settings: BrushSettings,
  ): void;
}

