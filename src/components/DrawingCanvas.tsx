import { useRef, type PointerEvent } from "react";
import type { Brush, BrushSettings, Point } from "../lib/drawing/brushes";
import { drawSegment } from "../lib/drawing/engine";

type Props = { brush: Brush; settings: BrushSettings };
export function DrawingCanvas({ brush, settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{
    pointerId: number;
    point: Point;
    brush: Brush;
    settings: BrushSettings;
    direction?: number;
  } | null>(null);
  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * event.currentTarget.width) / rect.width,
      y:
        ((event.clientY - rect.top) * event.currentTarget.height) / rect.height,
      pressure: event.pointerType === "pen" ? Math.max(0.1, event.pressure) : 1,
    };
  }
  function begin(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 || stroke.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event);
    stroke.current = {
      pointerId: event.pointerId,
      point: start,
      brush,
      settings: { ...settings },
    };
    brush.stamp(ctx, start, settings);
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const active = stroke.current;
    const ctx = event.currentTarget.getContext("2d");
    if (!active || active.pointerId !== event.pointerId || !ctx) return;
    const next = point(event);
    // Pointer-up reports zero pen pressure; retain the last drawing pressure.
    if (event.type === "pointerup") next.pressure = active.point.pressure;
    const dx = next.x - active.point.x;
    const dy = next.y - active.point.y;
    if (Math.hypot(dx, dy) < 0.01) return;
    active.direction = Math.atan2(dy, dx);
    drawSegment(ctx, active.brush, active.settings, active.point, next);
    active.point = next;
  }
  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (stroke.current?.pointerId !== event.pointerId) return;
    if (event.type === "pointerup") {
      move(event);
      const active = stroke.current;
      const ctx = event.currentTarget.getContext("2d");
      if (ctx && active.direction !== undefined) {
        active.brush.finish?.(ctx, active.point, active.settings, active.direction);
      }
    }
    stroke.current = null;
  }
  return (
    <>
      <canvas
        className="block h-auto w-full touch-none"
        style={{ cursor: `url("${import.meta.env.BASE_URL}spray-paint-outlined.png") 10 6, crosshair` }}
        ref={canvasRef}
        width={1200}
        height={400}
        aria-label="Drawing canvas. Draw with a mouse, touch, or stylus."
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      />
      <footer className="flex items-center justify-between border-t border-black px-4 py-2.5 text-xs text-subtle">
        <span className="max-[540px]:max-w-1/2">
          A little space for your ideas.
        </span>
        <button
          className="rounded-[7px] px-3.5 py-2 text-[13px] hover:bg-hover"
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas)
              canvas
                .getContext("2d")
                ?.clearRect(0, 0, canvas.width, canvas.height);
          }}
        >
          Clear canvas
        </button>
      </footer>
    </>
  );
}
