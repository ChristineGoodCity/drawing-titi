import imageUrl from '../../assets/brushes/dry-paint.png'
import type { Brush } from './brushes'

let mask: HTMLCanvasElement | undefined
let loading: Promise<void> | undefined
let colored: HTMLCanvasElement | undefined
let lastColor = ''
let grain: HTMLCanvasElement | undefined
let scratch: HTMLCanvasElement | undefined

function grainMask() {
  if (grain) return grain
  grain = document.createElement('canvas')
  grain.width = grain.height = 256
  const ctx = grain.getContext('2d')!
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

function prepare() {
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(image, 0, 0)
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let left = canvas.width, top = canvas.height, right = 0, bottom = 0
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4
            const light = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3
            const coverage = Math.max(0, Math.min(1, (250 - light) / 215))
            pixels.data[i + 3] *= coverage
            pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0
            if (pixels.data[i + 3] > 40) {
              left = Math.min(left, x); right = Math.max(right, x)
              top = Math.min(top, y); bottom = Math.max(bottom, y)
            }
          }
        }
        if (right < left || bottom < top) throw new Error('Empty brush tip')
        ctx.putImageData(pixels, 0, 0)
        mask = document.createElement('canvas')
        mask.width = right - left + 1
        mask.height = bottom - top + 1
        mask.getContext('2d')!.drawImage(canvas, left, top, mask.width, mask.height, 0, 0, mask.width, mask.height)
        resolve()
      } catch (error) { reject(error) }
    }
    image.onerror = () => reject(new Error('Could not load dry paint texture'))
    image.src = imageUrl
  })
  return loading
}

export const dryPaintBrush: Brush = {
  id: 'dry-paint',
  name: 'Dry paint',
  spacing: 0.12,
  prepare,
  stamp(ctx, point, { color, size }) {
    if (!mask) return
    if (!colored || lastColor !== color) {
      colored = document.createElement('canvas')
      colored.width = mask.width
      colored.height = mask.height
      const tint = colored.getContext('2d')!
      tint.drawImage(mask, 0, 0)
      tint.globalCompositeOperation = 'source-in'
      tint.fillStyle = color
      tint.fillRect(0, 0, colored.width, colored.height)
      lastColor = color
    }
    const phase = (point.x * 0.8 + point.y * 0.65) / Math.max(size, 1)
    const uneven = 1 + 0.09 * Math.sin(phase * 3.7) + 0.045 * Math.sin(phase * 11.3)
    const height = size * (0.75 + point.pressure * 0.25) * uneven
    const width = height * 0.85
    const extent = Math.ceil(size * 1.7 + 8)
    const left = Math.floor(point.x - extent / 2)
    const top = Math.floor(point.y - extent / 2)
    if (!scratch) scratch = document.createElement('canvas')
    scratch.width = scratch.height = extent
    const dab = scratch.getContext('2d')!
    dab.save()
    dab.translate(point.x - left, point.y - top)
    dab.rotate((point.direction ?? 0) + Math.sin(phase * 5) * 0.06)
    dab.drawImage(colored, -width / 2, -height / 2, width, height)
    dab.restore()
    const pattern = dab.createPattern(grainMask(), 'repeat')!
    pattern.setTransform(new DOMMatrix().translate(-left, -top))
    dab.globalCompositeOperation = 'destination-in'
    dab.fillStyle = pattern
    dab.fillRect(0, 0, extent, extent)
    ctx.drawImage(scratch, left, top)
  },
}
