import type { Brush, BrushSettings, Point } from './brushes'

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

function createDirtyBrush(dripping: boolean): Brush {
  const brush: Brush = {
    id: dripping ? 'dirty-drip' : 'dirty-spray',
    name: dripping ? 'Dirty drip' : 'Dirty spray',
    continuous: true,
    spacing: 0.12,
    stamp: paint,
    createStroke() {
      let previous: Point | undefined
      let distance = 0
      let threshold = 0
      return {
        ...brush,
        stamp(ctx, point, settings) {
          paint(ctx, point, settings)
          if (!dripping) return
          const { size, color } = settings
          if (!previous) threshold = size * (1 + Math.random())
          else distance += Math.hypot(point.x - previous.x, point.y - previous.y)
          previous = point
          if (distance < threshold) return
          distance = 0
          threshold = size * (4 + Math.random() * 4)
          const length = size * (0.25 + Math.random() * 0.35)
          const width = size * (0.08 + Math.random() * 0.05)
          const top = point.y + size * 0.2
          const bottom = top + length
          ctx.save()
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.moveTo(point.x - width, top)
          ctx.quadraticCurveTo(point.x - width * 0.4, top + length * 0.35, point.x - width * 0.35, bottom)
          ctx.quadraticCurveTo(point.x, bottom + width * 0.8, point.x + width * 0.35, bottom)
          ctx.quadraticCurveTo(point.x + width * 0.4, top + length * 0.3, point.x + width, top)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        },
      }
    },
  }
  return brush
}

export const dirtySprayBrush = createDirtyBrush(false)
export const dirtyDripBrush = createDirtyBrush(true)
