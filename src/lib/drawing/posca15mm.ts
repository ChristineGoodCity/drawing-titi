import { paintMarkerTip } from './posca'
import type { Brush, BrushSettings, Point } from './types'

function paint(ctx: CanvasRenderingContext2D, point: Point, settings: BrushSettings, opacity = 1) {
  paintMarkerTip(ctx, point, { ...settings, size: settings.size * 1.5 }, opacity, true)
}

export const posca15mmBrush: Brush = {
  id: 'posca-15mm',
  name: 'Posca 15mm',
  spacing: 0.09,
  stamp(ctx, point, settings) { paint(ctx, point, settings) },
  createStroke() {
    const softEnd = Math.random() < 0.25
    return {
      ...posca15mmBrush,
      stamp(ctx, point, settings) { paint(ctx, point, settings) },
      finish(ctx, point, settings) {
        if (softEnd && point.direction !== undefined) {
          // A small lighter terminal edge, never a fade through the stroke itself.
          const reach = settings.size * 0.06
          paint(ctx, {
            ...point,
            x: point.x + Math.cos(point.direction) * reach,
            y: point.y + Math.sin(point.direction) * reach,
          }, settings, 0.88)
        }
      },
    }
  },
}
