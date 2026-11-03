import type { Brush, Point } from './types'

const MAX_HELD_SIZE = 100
const MAX_GROWTH_FACTOR = 2
const GROWTH_PER_SECOND = 20
const SHRINK_PER_PIXEL = 0.2
const HOLD_DELAY_MS = 150

// One continuous size per pointer stroke: movement never resets it to normal.
export function createHoldSize() {
  let previous: Point | undefined
  let currentSize = 0
  let lastTime = 0
  let lastMovement = 0
  return (point: Point, normalSize: number, now = performance.now()) => {
    if (!previous) {
      previous = { ...point }
      currentSize = normalSize
      lastTime = lastMovement = now
      return normalSize
    }
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y)
    if (distance > 0.01) {
      currentSize = Math.max(normalSize, currentSize - distance * SHRINK_PER_PIXEL)
      lastMovement = now
    } else {
      const elapsed = Math.max(0, now - Math.max(lastTime, lastMovement + HOLD_DELAY_MS))
      const maxSize = Math.max(normalSize, Math.min(MAX_HELD_SIZE, normalSize * MAX_GROWTH_FACTOR))
      const growth = elapsed / 1000 * GROWTH_PER_SECOND
      currentSize = Math.min(maxSize, currentSize + growth)
    }
    previous = { ...point }
    lastTime = now
    return currentSize
  }
}

// Apply once at registration so every brush shares the same size behavior.
export function withHoldGrowth(base: Brush): Brush {
  return {
    ...base,
    continuous: true,
    createStroke() {
      const stroke = base.createStroke?.() ?? base
      const heldSize = createHoldSize()
      let size: number | undefined
      let previous: Point | undefined
      return {
        ...stroke,
        continuous: true,
        stamp(ctx, point, settings) {
          const nextSize = heldSize(point, settings.size)
          const unchanged = previous && point.x === previous.x && point.y === previous.y
            && point.pressure === previous.pressure && nextSize === size
          size = nextSize
          previous = { ...point }
          // Dry tools need new dabs only while moving or actually growing.
          if (!stroke.continuous && unchanged) return
          stroke.stamp(ctx, point, { ...settings, size })
        },
        finish(ctx, point, settings) {
          stroke.finish?.(ctx, point, { ...settings, size: size ?? settings.size })
        },
      }
    },
  }
}
