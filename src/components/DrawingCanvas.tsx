import { useEffect, useState, useRef, type PointerEvent } from "react";
import type { Brush, BrushSettings, Point } from "../lib/drawing/brushes";
import { drawSegment } from "../lib/drawing/engine";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 400;

type Props = { brush: Brush; settings: BrushSettings };
export function DrawingCanvas({ brush, settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{
    pointerId: number;
    point: Point;
    brush: Brush;
    settings: BrushSettings;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loaded, setLoaded] = useState({ id: "", error: false });
  const ready = !brush.prepare || (loaded.id === brush.id && !loaded.error);
  function stop() {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
    stroke.current = null;
  }
  useEffect(() => {
    let cancelled = false;
    if (brush.prepare) {
      brush.prepare().then(
        () => { if (!cancelled) setLoaded({ id: brush.id, error: false }); },
        () => { if (!cancelled) setLoaded({ id: brush.id, error: true }); },
      );
    }
    return () => { cancelled = true; stop(); };
  }, [brush]);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) stop(); };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      // Keep brush coordinates at 1200 × 400 while rendering at screen resolution.
      // Never shrink the backing store: resizing the window must preserve detail.
      const scale = Math.max(2, Math.min(4, Math.ceil(canvas.clientWidth * window.devicePixelRatio / CANVAS_WIDTH)));
      const width = CANVAS_WIDTH * scale;
      if (canvas.width < width) {
        const saved = document.createElement("canvas");
        saved.width = canvas.width;
        saved.height = canvas.height;
        saved.getContext("2d")!.drawImage(canvas, 0, 0);
        canvas.width = width;
        canvas.height = CANVAS_HEIGHT * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(saved, 0, 0, width, canvas.height);
      }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(canvas.width / CANVAS_WIDTH, 0, 0, canvas.height / CANVAS_HEIGHT, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); };
  }, []);
  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * CANVAS_WIDTH) / rect.width,
      y: ((event.clientY - rect.top) * CANVAS_HEIGHT) / rect.height,
      pressure: event.pointerType === "pen" ? Math.max(0.1, event.pressure) : 1,
    };
  }
  function begin(event: PointerEvent<HTMLCanvasElement>) {
    if (!ready || event.button !== 0 || stroke.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event);
    const strokeBrush = brush.createStroke?.() ?? brush;
    stroke.current = {
      pointerId: event.pointerId,
      point: start,
      brush: strokeBrush,
      settings: { ...settings },
    };
    strokeBrush.stamp(ctx, start, settings);
    if (brush.continuous) {
      timer.current = setInterval(() => {
        const active = stroke.current;
        if (active) active.brush.stamp(ctx, active.point, active.settings);
      }, 40);
    }
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const active = stroke.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const next = point(event);
    // Pointer-up reports zero pen pressure; retain the last drawing pressure.
    if (event.type === "pointerup") next.pressure = active.point.pressure;
    const dx = next.x - active.point.x;
    const dy = next.y - active.point.y;
    if (Math.hypot(dx, dy) < 0.01) return;
    next.direction = Math.atan2(dy, dx);
    drawSegment(ctx, active.brush, active.settings, active.point, next);
    active.point = next;
  }
  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (stroke.current?.pointerId !== event.pointerId) return;
    if (event.type === "pointerup") move(event);
    stop();
  }
  return (
    <>
      {loaded.id === brush.id && loaded.error && <p role="status" className="text-xs">Could not load brush tip. Please reload to retry.</p>}
      <canvas
        className="block aspect-[3/1] h-auto w-full touch-none"
        style={{ cursor: `url("${import.meta.env.BASE_URL}spray-paint-outlined.png") 10 6, crosshair` }}
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
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
            stop();
            canvasRef.current?.getContext("2d")
              ?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          }}
        >
          Clear canvas
        </button>
      </footer>
    </>
  );
}
