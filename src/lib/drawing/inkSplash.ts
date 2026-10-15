import type { Brush, BrushSettings, Point } from './types'

// Rounded, irregular pigment islands instead of bristles or a soft spray haze.
function blot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath()
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2
    const r = radius * (0.65 + Math.random() * 0.55)
    const px = x + Math.cos(angle) * r
    const py = y + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

function paint(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings, pool = false) {
  const width = size * (0.75 + point.pressure * 0.25) * (pool ? 1.3 : 1)
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.rotate(point.direction ?? 0)
  ctx.fillStyle = color
  ctx.globalAlpha = 1
  // Opaque core, with a gently uneven silhouette along the stroke.
  const phase = (point.x * 0.8 + point.y * 0.6) / Math.max(size, 1)
  const radius = width * (0.37 + Math.sin(phase * 3) * 0.035)
  ctx.beginPath()
  ctx.ellipse(0, 0, width * 0.3, radius, 0, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2
    const spread = 0.85 + Math.random() * 0.55
    blot(ctx, Math.cos(angle) * width * 0.3 * spread,
      Math.sin(angle) * radius * spread, width * (0.012 + Math.random() ** 2 * 0.065))
  }
  // Sparse, crisp droplets leave transparent gaps around the ragged edge.
  for (let i = 0; i < (pool ? 45 : 12); i++) {
    const angle = Math.random() * Math.PI * 2
    const spread = width * (0.48 + Math.random() ** 2 * 0.65)
    const r = Math.max(0.35, width * (0.004 + Math.random() ** 3 * 0.035))
    blot(ctx, Math.cos(angle) * spread, Math.sin(angle) * spread, r)
  }
  ctx.restore()
}

function splash(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings) {
  ctx.save()
  ctx.fillStyle = color
  ctx.translate(point.x, point.y)
  ctx.rotate(point.direction ?? 0)
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = size * (0.6 + Math.random() * 0.55)
    const radius = size * (0.025 + Math.random() * 0.045)
    ctx.beginPath()
    ctx.ellipse(Math.cos(angle) * distance, Math.sin(angle) * distance,
      radius * (1.2 + Math.random()), radius * 0.65, angle, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export const inkSplashBrush: Brush = {
  id: 'ink-splash', name: 'Ink splash', spacing: 0.14,
  stamp: paint,
  createStroke() {
    let previous: Point | undefined
    let distance = 0
    let next = 0
    return {
      ...inkSplashBrush,
      stamp(ctx, point, settings) {
        paint(ctx, point, settings, !previous)
        if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y)
        if (!previous || distance >= next) {
          splash(ctx, point, settings)
          distance = 0
          next = settings.size * (1.5 + Math.random() * 2)
        }
        previous = point
      },
    }
  },
}
