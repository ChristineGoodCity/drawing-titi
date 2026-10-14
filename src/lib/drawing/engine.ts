import type { Brush, BrushSettings, Point } from './brushes'

export function drawSegment(ctx: CanvasRenderingContext2D, brush: Brush, settings: BrushSettings, from: Point, to: Point) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  if (distance === 0) return
  const direction = Math.atan2(to.y - from.y, to.x - from.x)
  const steps = Math.max(1, Math.ceil(distance / Math.max(0.5, settings.size * 0.08)))
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    brush.stamp(ctx, {
      direction,
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      pressure: from.pressure + (to.pressure - from.pressure) * t,
    }, settings)
  }
}
