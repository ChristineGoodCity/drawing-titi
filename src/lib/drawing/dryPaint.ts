import { createImageTip } from './imageTip'
import imageUrl from '../../assets/brushes/dry-paint.png'
import type { Brush } from './types'

const tip = createImageTip(imageUrl, { crop: true, dryPaint: true })
let grain: HTMLCanvasElement | undefined
let scratch: HTMLCanvasElement | undefined
let grainPattern: CanvasPattern | null = null

function grainMask() {
  if (grain) return grain
  grain = document.createElement('canvas')
  grain.width = grain.height = 768
  const ctx = grain.getContext('2d')!
  ctx.scale(3, 3)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 256, 256)
  ctx.globalCompositeOperation = 'destination-out'
  // A fixed surface texture keeps holes in the same place across overlapping dabs.
  let seed = 7341
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < 560; i++) {
    const x = random() * 256, y = random() * 256
    const radius = 0.5 + random() * 1.4
    ctx.beginPath()
    ctx.ellipse(x, y, radius, radius * (0.4 + random() * 0.6), random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  return grain
}

export const dryPaintBrush: Brush = {
  id: 'dry-paint',
  name: 'Dry paint',
  spacing: 0.12,
  prepare: tip.prepare,
  stamp(ctx, point, { color, size }) {
    const colored = tip.tint(color)
    if (!colored) return
    const phase = (point.x * 0.8 + point.y * 0.65) / Math.max(size, 1)
    const uneven = 1 + 0.09 * Math.sin(phase * 3.7) + 0.045 * Math.sin(phase * 11.3)
    const height = size * (0.75 + point.pressure * 0.25) * uneven
    const width = height * 0.85
    const extent = Math.ceil(size * 1.7 + 8)
    const left = Math.floor(point.x - extent / 2)
    const top = Math.floor(point.y - extent / 2)
    if (!scratch) scratch = document.createElement('canvas')
    const resolution = Math.max(1, Math.ceil(Math.abs(ctx.getTransform().a)))
    const pixels = extent * resolution
    if (scratch.width !== pixels || scratch.height !== pixels) {
      scratch.width = scratch.height = pixels
    }
    const dab = scratch.getContext('2d')!
    dab.setTransform(1, 0, 0, 1, 0, 0)
    dab.clearRect(0, 0, pixels, pixels)
    dab.globalCompositeOperation = 'source-over'
    dab.setTransform(resolution, 0, 0, resolution, 0, 0)
    dab.imageSmoothingEnabled = true
    dab.imageSmoothingQuality = 'high'
    dab.save()
    dab.translate(point.x - left, point.y - top)
    dab.rotate((point.direction ?? 0) + Math.sin(phase * 5) * 0.06)
    dab.drawImage(colored, -width / 2, -height / 2, width, height)
    dab.restore()
    grainPattern ??= dab.createPattern(grainMask(), 'repeat')!
    const pattern = grainPattern
    pattern.setTransform(new DOMMatrix().translate(-left, -top).scale(1 / 3))
    dab.globalCompositeOperation = 'destination-in'
    dab.fillStyle = pattern
    dab.fillRect(0, 0, extent, extent)
    ctx.drawImage(scratch, left, top, extent, extent)
  },
}
