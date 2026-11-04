import {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  type Ref,
  type PointerEvent,
} from "react";
import type { Brush, BrushSettings, Point } from "../lib/drawing/brushes";
import { createStrokePath } from "../lib/drawing/engine";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 400;

export type DrawingCanvasControls = {
  undo: () => void;
  clear: () => void;
  snapshot: () => HTMLCanvasElement | null;
};
type Props = {
  brush: Brush;
  settings: BrushSettings;
  ref: Ref<DrawingCanvasControls>;
  onHistoryChange: (canUndo: boolean) => void;
};
export function DrawingCanvas({
  brush,
  settings,
  ref,
  onHistoryChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<{ canvas: HTMLCanvasElement; scale: number }[]>([]);
  function remember() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const saved = document.createElement("canvas");
    saved.width = canvas.width;
    saved.height = canvas.height;
    saved.getContext("2d")!.drawImage(canvas, 0, 0);
    history.current.push({
      canvas: saved,
      scale: canvas.getContext("2d")!.getTransform().a,
    });
    // Bound bitmap memory while always keeping the most recent action.
    let bytes = history.current.reduce(
      (total, item) => total + item.canvas.width * item.canvas.height * 4,
      0,
    );
    while (
      history.current.length > 1 &&
      (bytes > 64 * 1024 * 1024 || history.current.length > 20)
    ) {
      const removed = history.current.shift()!;
      bytes -= removed.canvas.width * removed.canvas.height * 4;
    }
    onHistoryChange(true);
  }
  const stroke = useRef<{
    pointerId: number;
    path: ReturnType<typeof createStrokePath>;
    lastMovement: number;
    point: Point;
    brush: Brush;
    settings: BrushSettings;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const animation = useRef<number | null>(null);
  const flowing = useRef<{ brush: Brush; settings: BrushSettings }[]>([]);
  const [loaded, setLoaded] = useState({ id: "", error: false });
  const ready = !brush.prepare || (loaded.id === brush.id && !loaded.error);
  function stop() {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    flowing.current = [];
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
    stroke.current = null;
  }
  useEffect(() => {
    let cancelled = false;
    if (brush.prepare) {
      brush.prepare().then(
        () => {
          if (!cancelled) setLoaded({ id: brush.id, error: false });
        },
        () => {
          if (!cancelled) setLoaded({ id: brush.id, error: true });
        },
      );
    }
    return () => {
      cancelled = true;
      stop();
    };
  }, [brush]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
    };
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
      const scale = Math.min(4, Math.max(1, window.devicePixelRatio));
      const width = Math.round(canvas.clientWidth * scale);
      const height = Math.round(canvas.clientHeight * scale);
      if (canvas.width !== width || canvas.height !== height) {
        stop();
        const saved = document.createElement("canvas");
        saved.width = canvas.width;
        saved.height = canvas.height;
        saved.getContext("2d")!.drawImage(canvas, 0, 0);
        const previousScale = canvas.getContext("2d")!.getTransform().a;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
          saved,
          0,
          0,
          (saved.width * scale) / previousScale,
          (saved.height * scale) / previousScale,
        );
      }
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);
  useImperativeHandle(ref, () => ({
    snapshot() {
      stop();
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const data = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data;
      if (!data.some((value, index) => index % 4 === 3 && value > 0))
        return null;
      // Preserve the entire drawing in a square so the model's center crop
      // cannot discard marks near the sides of the wide drawing surface.
      const snapshot = document.createElement("canvas");
      snapshot.width = snapshot.height = 224;
      const ctx = snapshot.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 224, 224);
      const scale = 224 / Math.max(canvas.width, canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      ctx.drawImage(
        canvas,
        (224 - width) / 2,
        (224 - height) / 2,
        width,
        height,
      );
      return snapshot;
    },
    undo() {
      const saved = history.current.pop();
      const canvas = canvasRef.current;
      if (!saved || !canvas) return;
      stop();
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        saved.canvas,
        0,
        0,
        saved.canvas.width / saved.scale,
        saved.canvas.height / saved.scale,
      );
      onHistoryChange(history.current.length > 0);
    },
    clear() {
      stop();
      remember();
      const canvas = canvasRef.current;
      if (canvas)
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    },
  }));
  function point(
    event: Pick<
      globalThis.PointerEvent,
      "clientX" | "clientY" | "pointerType" | "pressure"
    >,
    canvas: HTMLCanvasElement,
  ): Point {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pointerType === "pen" ? Math.max(0.1, event.pressure) : 1,
    };
  }
  function begin(event: PointerEvent<HTMLCanvasElement>) {
    if (!ready || event.button !== 0 || stroke.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    remember();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event, event.currentTarget);
    const strokeBrush = brush.createStroke?.() ?? brush;
    stroke.current = {
      pointerId: event.pointerId,
      path: createStrokePath(ctx, strokeBrush, { ...settings }, start),
      lastMovement: performance.now(),
      point: start,
      brush: strokeBrush,
      settings: { ...settings },
    };
    strokeBrush.stamp(ctx, start, settings);
    if (strokeBrush.animate) {
      flowing.current.push({ brush: strokeBrush, settings: { ...settings } });
      if (animation.current === null) {
        let lastFrame = performance.now();
        const frame = (now: number) => {
          const dt = Math.min(0.05, (now - lastFrame) / 1000);
          lastFrame = now;
          flowing.current = flowing.current.filter((flow) => {
            const wet = flow.brush.animate?.(ctx, flow.settings, dt);
            return wet || stroke.current?.brush === flow.brush;
          });
          animation.current = flowing.current.length
            ? requestAnimationFrame(frame)
            : null;
        };
        animation.current = requestAnimationFrame(frame);
      }
    }
    if (brush.continuous) {
      timer.current = setInterval(() => {
        const active = stroke.current;
        if (active && performance.now() - active.lastMovement >= 80) {
          active.path.finish();
          active.brush.stamp(ctx, active.point, active.settings);
        }
      }, 40);
    }
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const active = stroke.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const samples =
      event.type === "pointermove"
        ? (event.nativeEvent.getCoalescedEvents?.() ?? [])
        : [];
    for (const sample of samples.length ? samples : [event.nativeEvent]) {
      const next = point(sample, event.currentTarget);
      // Pointer-up reports zero pen pressure; retain the last drawing pressure.
      if (event.type === "pointerup") next.pressure = active.point.pressure;
      const dx = next.x - active.point.x;
      const dy = next.y - active.point.y;
      if (Math.hypot(dx, dy) < 0.01) continue;
      next.direction = Math.atan2(dy, dx);
      active.path.add(next);
      active.point = next;
      active.lastMovement = performance.now();
    }
  }
  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (stroke.current?.pointerId !== event.pointerId) return;
    if (event.type === "pointerup") {
      move(event);
      const active = stroke.current;
      const ctx = event.currentTarget.getContext("2d");
      if (active && ctx) {
        active.path.finish();
        active.brush.finish?.(ctx, active.point, active.settings);
      }
    }
    // Release stops spraying, while deposited paint can finish running downward.
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
    stroke.current = null;
    if (event.type !== "pointerup") stop();
  }
  return (
    <>
      {loaded.id === brush.id && loaded.error && (
        <p role="status" className="absolute bottom-16 left-4 z-10 text-xs">
          Could not load brush tip. Please reload to retry.
        </p>
      )}
      <canvas
        className="absolute inset-0 block h-full w-full touch-none"
        style={{
          cursor: `url("${import.meta.env.BASE_URL}spray-paint-outlined.png") 10 6, crosshair`,
        }}
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
    </>
  );
}
