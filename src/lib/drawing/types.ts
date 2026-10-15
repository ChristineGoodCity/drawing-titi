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
}

