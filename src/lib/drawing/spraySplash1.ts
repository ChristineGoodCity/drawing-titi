import { withDrips } from './drippingSpray'
import type { Brush, BrushSettings, Point } from './types'

function paint(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings) {
  const phase = (point.x * 0.7 + point.y * 0.8) / Math.max(size, 1)
  const pressure = 0.55 + 0.45 * point.pressure
  const radius = size * pressure * (0.34 + 0.035 * Math.sin(phase * 3.1) + 0.02 * Math.sin(phase * 9.7))
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = 1
  // Solid ink with a broken silhouette, rather than a smooth translucent disk.
  ctx.beginPath()
  for (let i = 0; i < 64; i++) {
    const angle = i / 64 * Math.PI * 2
    const edge = radius * (1 + 0.065 * Math.sin(angle * 7 + phase)
      + 0.045 * Math.sin(angle * 19 - phase * 2) + (Math.random() - 0.5) * 0.13)
    const x = point.x + Math.cos(angle) * edge
    const y = point.y + Math.sin(angle) * edge
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()

  // Concentrate chunky, opaque pigment near the edge, leaving white gaps
  // between flecks. Only a small fraction escapes into the outer halo.
  const count = Math.min(260, Math.max(35, Math.round(size * 2.4)))
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const outer = Math.random() < 0.08
    const spread = radius * (outer
      ? 1.35 + Math.random() * 0.85
      : 0.93 + Math.random() ** 2 * 0.55)
    const dot = Math.max(0.35, size * pressure * (0.004 + Math.random() ** 2 * 0.018))
    const x = point.x + Math.cos(angle) * spread
    const y = point.y + Math.sin(angle) * spread
    ctx.globalAlpha = 0.72 + Math.random() * 0.28
    ctx.beginPath()
    // Short angular flakes give the fringe its torn, gritty character.
    ctx.moveTo(x - dot, y - dot * 0.6)
    ctx.lineTo(x + dot * 0.35, y - dot)
    ctx.lineTo(x + dot, y + dot * 0.25)
    ctx.lineTo(x + dot * 0.2, y + dot)
    ctx.lineTo(x - dot * 0.8, y + dot * 0.5)
    ctx.closePath()
    ctx.fill()
  }

  // Isolated wet droplets punctuate the fine grit without becoming a mist.
  if (Math.random() < 0.12) {
    const angle = Math.random() * Math.PI * 2
    const spread = radius * (1.65 + Math.random() * 0.7)
    const dot = Math.max(0.7, size * pressure * (0.018 + Math.random() ** 2 * 0.035))
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.ellipse(point.x + Math.cos(angle) * spread, point.y + Math.sin(angle) * spread,
      dot, dot * (0.8 + Math.random() * 0.4), angle, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export const spraySplash1Brush: Brush = {
  id: 'spray-splash-1',
  name: 'Spray splash 1',
  continuous: true,
  spacing: 0.12,
  stamp: paint,
}

// Share drip behavior while retaining the ink splatter brush's textured core.
export const spraySplash1DripBrush = withDrips({
  ...spraySplash1Brush,
  id: 'spray-splash-1-drip',
  name: 'Spray splash 1 drip',
}, { wetCore: false })
