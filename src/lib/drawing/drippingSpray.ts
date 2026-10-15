import type { Brush, Point } from './types'

type Drip = {
  x: number
  y: number
  length: number
  max: number
  width: number
  bend: number
  taper: number
  drawn: number
}

// Each pointer stroke owns its wet paint, so old drips never restart later.
export function withDrips(base: Brush, wetCore = true): Brush {
  return {
    ...base,
    createStroke() {
      const drips: Drip[] = []
      let previous: Point | undefined
      let distance = 0
      let nextDrip: number | undefined
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
          if (wetCore) {
            ctx.save()
            ctx.fillStyle = color
            ctx.globalAlpha = 1
            ctx.beginPath()
            ctx.arc(point.x, point.y, size * (0.34 + 0.06 * point.pressure), 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
          if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y)
          // Randomize the first gap too; avoid a guaranteed drip on every click.
          nextDrip ??= size * (1.5 + Math.random() * 4)
          if (distance >= nextDrip) {
            // Most runs stay moderate; a few reach farther without becoming unbounded.
            const mainLength = size * (Math.random() < 0.25
              ? 1.5 + Math.random() * 0.6
              : 0.7 + Math.random() * 0.65)
            const mainWidth = Math.max(2.5, size * (0.15 + Math.random() * 0.08))
            const origin = point.x + (Math.random() - 0.5) * size * 0.15
            const paired = Math.random() < 0.3
            const side = Math.random() < 0.5 ? -1 : 1
            for (let i = 0; i < (paired ? 2 : 1); i++) {
              // A nearby companion is shorter and narrower, like pooled paint splitting.
              const max = i === 0 ? mainLength : mainLength * (0.5 + Math.random() * 0.25)
              drips.push({
                x: origin + i * side * (mainWidth * 1.8 + size * 0.06),
                y: point.y + size * 0.2,
                length: max * 0.85,
                max,
                width: i === 0 ? mainWidth : mainWidth * (0.65 + Math.random() * 0.2),
                // Mix nearly even drips with ones that narrow noticeably downward.
                taper: Math.random() < 0.5
                  ? 0.4 + Math.random() * 0.2
                  : 0.1 + Math.random() * 0.1,
                bend: (Math.random() - 0.5) * size * 0.025,
                drawn: 0,
              })
            }
            distance = 0
            // Broader spacing range, with the same average gap as before.
            nextDrip = size * (2 + Math.random() * 7)
            while (drips.length > 32) drips.shift()
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
            const x = (y: number) => drip.x + Math.sin(y / drip.max * 3) * drip.bend
            const segments = Math.max(1, Math.ceil((end - start) / 2))
            for (let i = 0; i < segments; i++) {
              const a = start + (end - start) * i / segments
              const b = start + (end - start) * (i + 1) / segments
              const progress = b / drip.max
              // Broad attachment, narrow straight run, and a subtle rounded bead at the tip.
              const root = 0.65 * Math.max(0, 1 - progress / 0.7)
              const bead = 0.08 * Math.max(0, (progress - 0.88) / 0.12)
              ctx.lineWidth = drip.width * (1 - drip.taper * progress + root + bead)
              ctx.beginPath()
              ctx.moveTo(x(a), drip.y + a)
              ctx.lineTo(x(b), drip.y + b)
              ctx.stroke()
            }
            drip.drawn = end
          }
          // Finished ink is already on the canvas; stop revisiting it on every stamp.
          for (let i = drips.length - 1; i >= 0; i--) {
            if (drips[i].drawn >= drips[i].max) drips.splice(i, 1)
          }
          ctx.restore()
        },
      }
    },
  }
}
