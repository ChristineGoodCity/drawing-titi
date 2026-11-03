import { withDrips } from './drippingSpray'
import type { Brush, BrushSettings, Point } from './types'

function paint(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings) {
  // Slow spatial variation keeps neighboring dabs connected without a perfect tube.
  const phase = (point.x * 0.73 + point.y * 0.51) / Math.max(size, 1)
  const swell = 1 + 0.075 * Math.sin(phase * 1.7) + 0.035 * Math.sin(phase * 4.3 + 1)
  const radius = size * 0.4 * swell * (0.75 + point.pressure * 0.25)
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.fillStyle = color
  ctx.globalAlpha = (0.32 + 0.12 * Math.sin(phase * 0.9 + 2) ** 2) * point.pressure
  ctx.beginPath()
  for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2
    const edge = radius * (1 + 0.035 * Math.sin(angle * 5 + phase) + 0.025 * Math.sin(angle * 11 - phase * 2))
    const x = Math.cos(angle) * edge
    const y = Math.sin(angle) * edge
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()

  // Pigment breaks up the edge, with uneven density and sparse distant flecks.
  const count = Math.min(180, Math.max(45, Math.round(size * 2.2)))
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const spread = radius * (0.86 + Math.random() ** 2 * 0.55)
    const bias = 0.65 + 0.35 * Math.sin(angle * 2 + phase) ** 2
    ctx.globalAlpha = (0.12 + Math.random() * 0.4) * bias * point.pressure
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * spread, Math.sin(angle) * spread,
      Math.max(0.25, size * (0.003 + Math.random() ** 3 * 0.012)), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export const spray2Brush: Brush = {
  id: 'spray-2',
  name: 'Spray 2',
  continuous: true,
  spacing: 0.13,
  stamp: paint,

}

export const spray2DripBrush = withDrips({
  ...spray2Brush,
  id: 'spray-2-drip',
  name: 'Spray 2 drip',
}, { wetCore: false })
