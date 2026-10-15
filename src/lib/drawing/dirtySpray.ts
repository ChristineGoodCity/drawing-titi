import { withDrips } from './drippingSpray'
import type { Brush, BrushSettings, Point } from './types'

function paint(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings) {
  const phase = (point.x * 0.7 + point.y * 0.8) / Math.max(size, 1)
  const radius = size * (0.32 + 0.05 * Math.sin(phase * 3.1) + 0.025 * Math.sin(phase * 9.7))
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.85 * point.pressure
  ctx.beginPath()
  for (let i = 0; i < 40; i++) {
    const angle = i / 40 * Math.PI * 2
    const edge = radius * (1 + 0.08 * Math.sin(angle * 7 + phase))
    const x = point.x + Math.cos(angle) * edge
    const y = point.y + Math.sin(angle) * edge
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  // Coarse pigment clusters with sparse dust farther out from the wet center.
  const count = Math.max(40, Math.round(size * 3))
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const spread = radius + Math.random() ** 2 * size * 0.45
    const dot = Math.max(0.3, size * (0.003 + Math.random() ** 3 * 0.018))
    ctx.globalAlpha = (0.12 + Math.random() * 0.55) * point.pressure
    ctx.beginPath()
    ctx.arc(point.x + Math.cos(angle) * spread, point.y + Math.sin(angle) * spread, dot, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export const dirtySprayBrush: Brush = {
  id: 'dirty-spray',
  name: 'Dirty spray',
  continuous: true,
  spacing: 0.12,
  stamp: paint,
}

// Share drip behavior while retaining the dirty brush's textured core.
export const dirtyDripBrush = withDrips({
  ...dirtySprayBrush,
  id: 'dirty-drip',
  name: 'Dirty drip',
}, false)
