import type { Brush, BrushSettings, Point } from './types'

let pigment: HTMLCanvasElement | undefined
let scratch: HTMLCanvasElement | undefined
let pattern: CanvasPattern | null = null

function pigmentMask() {
  if (pigment) return pigment
  pigment = document.createElement('canvas')
  pigment.width = pigment.height = 256
  const ctx = pigment.getContext('2d')!
  const pixels = ctx.createImageData(256, 256)
  const hash = (x: number, y: number, cells: number) => {
    const n = Math.sin((x % cells) * 127.1 + (y % cells) * 311.7 + cells * 9) * 43758.5453
    return n - Math.floor(n)
  }
  const noise = (x: number, y: number, cells: number) => {
    const gx = x / 256 * cells, gy = y / 256 * cells
    const ix = Math.floor(gx), iy = Math.floor(gy)
    const fx = gx - ix, fy = gy - iy
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
    return (hash(ix, iy, cells) * (1 - u) + hash(ix + 1, iy, cells) * u) * (1 - v)
      + (hash(ix, iy + 1, cells) * (1 - u) + hash(ix + 1, iy + 1, cells) * u) * v
  }
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      // Fine, restrained grain: the marker stays filled instead of looking watery.
      const grain = noise(x, y, 32) * 0.65 + noise(x, y, 64) * 0.35
      // Restrained pigment thinning beneath the fine grain, with no transparent holes.
      const wash = noise(x, y, 8) * 0.7 + noise(x, y, 16) * 0.3
      const fade = Math.max(0, (wash - 0.42) / 0.58)
      const coverage = (0.62 + grain * 0.36) * (1 - fade * 0.3)
      const i = (y * 256 + x) * 4
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255
      pixels.data[i + 3] = coverage * 255
    }
  }
  ctx.putImageData(pixels, 0, 0)
  return pigment
}

export function paintMarkerTip(ctx: CanvasRenderingContext2D, point: Point, { color, size }: BrushSettings, opacity = 0.24, broad = false) {
  const phase = (point.x * 0.6 + point.y * 0.8) / Math.max(size, 1)
  const radius = size * 0.5 * (0.72 + point.pressure * 0.28) * (1 + 0.012 * Math.sin(phase * 1.7))
  const extent = Math.ceil(size * 1.6 + 4)
  const resolution = Math.max(1, Math.ceil(Math.abs(ctx.getTransform().a)))
  const left = Math.floor(point.x - extent / 2), top = Math.floor(point.y - extent / 2)
  scratch ??= document.createElement('canvas')
  if (scratch.width !== extent * resolution) scratch.width = scratch.height = extent * resolution
  const dab = scratch.getContext('2d')!
  dab.setTransform(1, 0, 0, 1, 0, 0)
  dab.clearRect(0, 0, scratch.width, scratch.height)
  dab.setTransform(resolution, 0, 0, resolution, 0, 0)
  dab.globalCompositeOperation = 'source-over'
  dab.fillStyle = color
  // A short, soft-cornered chisel leaves a flat marker edge without a square tile.
  dab.save()
  dab.translate(point.x - left, point.y - top)
  dab.rotate(point.direction ?? 0)
  dab.beginPath()
  if (broad) {
    dab.moveTo(-radius * 0.55, -radius * 0.9)
    dab.lineTo(-radius * 0.43, -radius)
    dab.lineTo(radius * 0.42, -radius)
    dab.lineTo(radius * 0.55, -radius * 0.83)
    dab.lineTo(radius * 0.51, -radius * 0.35)
    dab.lineTo(radius * 0.57, radius * 0.12)
    dab.lineTo(radius * 0.49, radius * 0.68)
    dab.lineTo(radius * 0.38, radius)
    dab.lineTo(-radius * 0.47, radius * 0.97)
    dab.lineTo(-radius * 0.56, radius * 0.74)
    dab.closePath()
  } else {
    dab.roundRect(-radius * 0.65, -radius, radius * 1.3, radius * 2, radius * 0.38)
  }
  dab.fill()
  dab.restore()
  // Keep fine pigment grain anchored to the surface between overlapping dabs.
  pattern ??= dab.createPattern(pigmentMask(), 'repeat')!
  const textureScale = size / 100
  pattern.setTransform(new DOMMatrix().translate(-left, -top).scale(textureScale))
  dab.globalCompositeOperation = 'destination-in'
  dab.fillStyle = pattern
  dab.fillRect(0, 0, extent, extent)
  if (broad) {
    // Preserve full coverage through turns with just a trace of pigment grain.
    dab.save()
    dab.clip()
    dab.globalCompositeOperation = 'destination-over'
    dab.globalAlpha = 0.96
    dab.fillStyle = color
    dab.fillRect(0, 0, extent, extent)
    dab.restore()
  }
  ctx.save()
  ctx.globalAlpha = broad ? opacity : opacity * point.pressure
  ctx.drawImage(scratch, left, top, extent, extent)
  ctx.restore()
}

export const poscaBrush: Brush = {
  id: 'posca',
  name: 'Posca',
  spacing: 0.045,
  stamp(ctx, point, settings) { paintMarkerTip(ctx, point, settings, 0.85) },
  createStroke() {
    let started = false
    return {
      ...poscaBrush,
      stamp(ctx, point, settings) {
        paintMarkerTip(ctx, point, settings, started ? 0.24 : 0.85)
        started = true
      },
      finish(ctx, point, settings) {
        paintMarkerTip(ctx, point, settings, 0.65)
      },
    }
  },
}
