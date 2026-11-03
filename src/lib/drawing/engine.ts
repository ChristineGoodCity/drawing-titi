import type { Brush, BrushSettings, Point } from './types'

export function drawSegment(ctx: CanvasRenderingContext2D, brush: Brush, settings: BrushSettings, from: Point, to: Point) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  if (distance === 0) return
  const direction = Math.atan2(to.y - from.y, to.x - from.x)
  const steps = Math.max(1, Math.ceil(distance / Math.max(0.5, settings.size * (brush.spacing ?? 0.08))))
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

// Midpoint quadratic joins smooth sparse pointer samples without overshooting.
export function createStrokePath(ctx: CanvasRenderingContext2D, brush: Brush, settings: BrushSettings, start: Point) {
  let input = start
  let rendered = start
  function curve(control: Point, end: Point) {
    const from = rendered
    const length = Math.hypot(control.x - from.x, control.y - from.y)
      + Math.hypot(end.x - control.x, end.y - control.y)
    const steps = Math.max(1, Math.ceil(length / Math.max(0.5, settings.size * (brush.spacing ?? 0.08))))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      const next = {
        x: u * u * from.x + 2 * u * t * control.x + t * t * end.x,
        y: u * u * from.y + 2 * u * t * control.y + t * t * end.y,
        pressure: u * u * from.pressure + 2 * u * t * control.pressure + t * t * end.pressure,
      }
      drawSegment(ctx, brush, settings, rendered, next)
      rendered = next
    }
  }
  return {
    add(next: Point) {
      if (Math.hypot(next.x - input.x, next.y - input.y) < 0.01) return
      curve(input, {
        x: (input.x + next.x) / 2,
        y: (input.y + next.y) / 2,
        pressure: (input.pressure + next.pressure) / 2,
      })
      input = next
    },
    finish() {
      curve(input, input)
    },
  }
}
