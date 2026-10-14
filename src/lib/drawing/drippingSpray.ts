import type { Brush, Point } from './brushes'

// Each pointer stroke owns its wet paint, so old drips never restart later.
export function withDrips(base: Brush): Brush {
  return {
    ...base,
    createStroke() {
      const drips: { x: number; y: number; length: number; max: number; width: number; bend: number; drawn: number }[] = []
      let previous: Point | undefined
      let distance = 0
      let nextDrip = 0
      let lastTime = performance.now()
      return {
        ...base,
        stamp(ctx, point, settings) {
          const now = performance.now()
          const dt = Math.min(0.08, (now - lastTime) / 1000)
          lastTime = now
          base.stamp(ctx, point, settings)
          const { size, color } = settings
          // A wet, opaque core distinguishes this from the light Spray brush.
          ctx.save()
          ctx.fillStyle = color
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(point.x, point.y, size * (0.34 + 0.06 * point.pressure), 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y)
          if (!previous || distance >= nextDrip) {
            drips.push({
              x: point.x + (Math.random() - 0.5) * size * 0.2,
              y: point.y + size * 0.2,
              length: size * (0.45 + Math.random() * 0.6),
              max: size * (1.5 + Math.random()),
              width: Math.max(1.5, size * (0.065 + Math.random() * 0.055)),
              bend: (Math.random() - 0.5) * size * 0.15,
              drawn: 0,
            })
            distance = 0
            nextDrip = size * (5 + Math.random() * 4)
            if (drips.length > 32) drips.shift()
          }
          previous = point
          ctx.save()
          ctx.strokeStyle = color
          ctx.globalAlpha = 1
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          for (const drip of drips) {
            drip.length = Math.min(drip.max, drip.length + dt * size * 0.6)
            // Extend only the new section instead of repainting translucent trails.
            const start = drip.drawn
            const end = drip.length
            if (end <= start) continue
            const segments = Math.max(1, Math.ceil((end - start) / 2))
            for (let i = 0; i < segments; i++) {
              const a = start + (end - start) * i / segments
              const b = start + (end - start) * (i + 1) / segments
              const x = (y: number) => drip.x + Math.sin(y / drip.max * 3) * drip.bend
              ctx.lineWidth = drip.width * (1 - 0.35 * b / drip.max)
              ctx.beginPath()
              ctx.moveTo(x(a), drip.y + a)
              ctx.lineTo(x(b), drip.y + b)
              ctx.stroke()
            }
            drip.drawn = end
          }
          ctx.restore()
        },
      }
    },
  }
}
