import type { Brush, BrushSettings, Point } from './brushes'

function paint(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings) {
  const width = size * (0.75 + point.pressure * 0.25)
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.rotate(point.direction ?? 0)
  ctx.fillStyle = color
  // A solid middle and separate, uneven bristles create a dragged-paint edge.
  ctx.beginPath()
  ctx.ellipse(0, 0, width * 0.27, width * 0.39, 0, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 31; i++) {
    const across = (i / 30 - 0.5) * width
    const length = width * (0.32 + 0.2 * Math.sin(i * 9.7) ** 2)
    ctx.globalAlpha = Math.abs(across) > width * 0.4 ? 0.6 : 1
    ctx.fillRect(-length * 0.55, across, length, Math.max(0.5, width * 0.021))
  }
  ctx.restore()
}

function splash(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings) {
  const side = Math.random() < 0.5 ? -1 : 1
  const angle = (point.direction ?? 0) + side * Math.PI / 2
  const x = point.x + Math.cos(angle) * size * 0.37
  const y = point.y + Math.sin(angle) * size * 0.37
  ctx.save()
  ctx.fillStyle = ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2
    const radius = size * (i % 2 ? 0.08 : 0.14 + Math.random() * 0.16)
    const px = x + Math.cos(a) * radius
    const py = y + Math.sin(a) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  for (let i = 0; i < 9; i++) {
    const a = angle + (Math.random() - 0.5) * 2.6
    const distance = size * (0.2 + Math.random() * 0.65)
    ctx.beginPath()
    ctx.arc(x + Math.cos(a) * distance, y + Math.sin(a) * distance,
      Math.max(0.65, size * (0.008 + Math.random() ** 2 * 0.055)), 0, Math.PI * 2)
    ctx.fill()
  }
  // Occasional thin gravity run under a pooled splash.
  if (side > 0 && Math.random() < 0.55) {
    ctx.lineWidth = Math.max(1, size * 0.035)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + size * 0.04, y + size * 0.35, x - size * 0.03, y + size * 0.7)
    ctx.stroke()
  }
  ctx.restore()
}

export const inkSplashBrush: Brush = {
  id: 'ink-splash', name: 'Ink splash', spacing: 0.08,
  stamp: paint,
  createStroke() {
    let previous: Point | undefined
    let distance = 0
    let next = 0
    return {
      ...inkSplashBrush,
      stamp(ctx, point, settings) {
        paint(ctx, point, settings)
        if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y)
        if (!previous || distance >= next) {
          splash(ctx, point, settings)
          distance = 0
          next = settings.size * (2.5 + Math.random() * 3)
        }
        previous = point
      },
    }
  },
}
