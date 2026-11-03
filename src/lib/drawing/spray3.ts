import { createImageTip } from './imageTip'
import { withDrips } from './drippingSpray'
import imageUrl from '../../assets/brushes/dry-paint.png'
import type { Brush } from './types'

const GRAIN_RESOLUTION = 768
const GRAIN_SCALE = 3
const GRAIN_CELL_SIZE = 2

const tip = createImageTip(imageUrl, { crop: true, dryPaint: true })
let grain: HTMLCanvasElement | undefined
let scratch: HTMLCanvasElement | undefined
let grainPattern: CanvasPattern | null = null

function grainMask() {
  if (grain) return grain
  grain = document.createElement('canvas')
  grain.width = grain.height = GRAIN_RESOLUTION
  const ctx = grain.getContext('2d')!
  // Keep missing pigment anchored to the paper, so overlapping stamps
  // cannot fill the dry patches back in.
  const pixels = ctx.createImageData(GRAIN_RESOLUTION, GRAIN_RESOLUTION)
  let seed = 7341
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let y = 0; y < GRAIN_RESOLUTION; y += GRAIN_CELL_SIZE) {
    for (let x = 0; x < GRAIN_RESOLUTION; x += GRAIN_CELL_SIZE) {
      const wave = (Math.sin(y / GRAIN_RESOLUTION * Math.PI * 2 - 1.2
        + 0.65 * Math.sin(x / GRAIN_RESOLUTION * Math.PI * 2)) + 1) / 2
      const coverage = 0.23 + 0.75 * wave ** 0.7
      const alpha = random() < coverage ? 255 : 0
      for (let dy = 0; dy < GRAIN_CELL_SIZE; dy++) {
        for (let dx = 0; dx < GRAIN_CELL_SIZE; dx++) {
          pixels.data[((y + dy) * GRAIN_RESOLUTION + x + dx) * 4 + 3] = alpha
        }
      }
    }
  }
  ctx.putImageData(pixels, 0, 0)
  return grain
}

const spray3Base: Brush = {
  id: 'spray-3',
  name: 'Spray 3',
  spacing: 0.065,
  prepare: tip.prepare,
  stamp(ctx, point, { color, size }) {
    const colored = tip.tint(color)
    if (!colored) return
    const phase = (point.x * 0.8 + point.y * 0.65) / Math.max(size, 1)
    const uneven = 1 + 0.09 * Math.sin(phase * 3.7) + 0.045 * Math.sin(phase * 11.3)
    const diameter = size * (0.75 + point.pressure * 0.25) * uneven
    const radius = diameter * 0.85 / 2
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
    // A circular footprint gives both ends a rounded cap; the image and
    // paper mask still provide the broken pigment inside that silhouette.
    dab.beginPath()
    dab.arc(0, 0, radius, 0, Math.PI * 2)
    dab.clip()
    dab.rotate((point.direction ?? 0) + Math.sin(phase * 5) * 0.06)
    dab.drawImage(colored, -diameter / 2, -diameter / 2, diameter, diameter)
    dab.restore()
    grainPattern ??= dab.createPattern(grainMask(), 'repeat')!
    const pattern = grainPattern
    pattern.setTransform(new DOMMatrix().translate(-left, -top).scale(1 / GRAIN_SCALE))
    dab.globalCompositeOperation = 'destination-in'
    dab.fillStyle = pattern
    dab.fillRect(0, 0, extent, extent)
    ctx.drawImage(scratch, left, top, extent, extent)
  },
}

// Thin runs sit inside the grainy stroke without filling its dry texture.
export const spray3Brush = withDrips(spray3Base, {
  wetCore: false,
  widthScale: 0.3,
  lengthScale: 0.65,
})
