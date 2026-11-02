import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { expandingWave } from './expandingWave';

export type GooeyPull = { x: number; top: number; bottom: number };
const resting: GooeyPull = { x: 0.5, top: 0, bottom: 0 };

export function useGooeyPointer(enabled: boolean, reduced: boolean, stage: RefObject<HTMLDivElement | null>, wave: ReturnType<typeof expandingWave>) {
  const [pull, setPull] = useState(resting);
  const current = useRef(resting);
  const target = useRef(resting);
  const frame = useRef<number | null>(null);
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  function animate(next: GooeyPull) {
    target.current = next;
    if (frame.current !== null) return;
    let last = performance.now();
    const tick = (now: number) => {
      const blend = 1 - Math.exp(-Math.min(48, now - last) / 110);
      last = now;
      const value = current.current;
      const goal = target.current;
      const updated = {
        x: value.x + (goal.x - value.x) * blend,
        top: value.top + (goal.top - value.top) * blend,
        bottom: value.bottom + (goal.bottom - value.bottom) * blend,
      };
      const settled = Math.abs(updated.x - goal.x) + Math.abs(updated.top - goal.top) + Math.abs(updated.bottom - goal.bottom) < 0.0002;
      current.current = settled ? goal : updated;
      setPull(current.current);
      frame.current = settled ? null : requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!enabled || reduced || event.pointerType === 'touch' || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) { onPointerLeave(); return; }
    const height = wave.halfHeight(x);
    const topDistance = Math.abs(y - (0.5 - height)) * rect.height;
    const bottomDistance = Math.abs(y - (0.5 + height)) * rect.height;
    let boundary = 0;
    let seamDistance = Infinity;
    for (const width of wave.widths.slice(0, -1)) {
      boundary += width;
      seamDistance = Math.min(seamDistance, Math.abs(x - boundary) * rect.width);
    }
    const inside = Math.abs(y - 0.5) <= height + 0.04;
    const seam = inside ? Math.exp(-0.5 * (seamDistance / 28) ** 2) : 0;
    const top = Math.max(Math.exp(-0.5 * (topDistance / 48) ** 2), seam * (y <= 0.5 ? 0.65 : 0.15));
    const bottom = Math.max(Math.exp(-0.5 * (bottomDistance / 48) ** 2), seam * (y >= 0.5 ? 0.65 : 0.15));
    // Start each new touch at the cursor, so a blob doesn't travel across the strip.
    if (current.current.top + current.current.bottom < 0.001) current.current = { ...current.current, x };
    animate({ x, top: top * 0.085, bottom: bottom * 0.085 });
  }
  function onPointerLeave() {
    if (!enabled) return;
    animate({ x: current.current.x, top: 0, bottom: 0 });
  }
  return { pull: reduced ? resting : pull, onPointerMove, onPointerLeave };
}
