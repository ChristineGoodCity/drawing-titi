type Options = { crop?: boolean; dryPaint?: boolean }

// Decode and convert each source once; keep just the most recent color variant.
export function createImageTip(url: string, options: Options = {}) {
  let mask: HTMLCanvasElement | undefined
  let loading: Promise<void> | undefined
  let colored: HTMLCanvasElement | undefined
  let lastColor = ''

  function prepare(): Promise<void> {
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
          let left = canvas.width, top = canvas.height, right = -1, bottom = -1
          for (let i = 0; i < pixels.data.length; i += 4) {
            const light = options.dryPaint
              ? (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3
              : pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722
            const coverage = options.dryPaint ? Math.max(0, Math.min(1, (250 - light) / 215)) : (255 - light) / 255
            pixels.data[i + 3] *= coverage
            pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0
            if (options.crop && pixels.data[i + 3] > 40) {
              const x = (i / 4) % canvas.width, y = Math.floor(i / 4 / canvas.width)
              left = Math.min(left, x); right = Math.max(right, x)
              top = Math.min(top, y); bottom = Math.max(bottom, y)
            }
          }
          ctx.putImageData(pixels, 0, 0)
          if (options.crop) {
            if (right < left || bottom < top) throw new Error('Empty brush tip')
            mask = document.createElement('canvas')
            mask.width = right - left + 1
            mask.height = bottom - top + 1
            mask.getContext('2d')!.drawImage(canvas, left, top, mask.width, mask.height, 0, 0, mask.width, mask.height)
          } else mask = canvas
          resolve()
        } catch (error) { reject(error) }
      }
      image.onerror = () => reject(new Error('Could not load brush tip'))
      image.src = url
    }).catch(error => {
      loading = undefined // A later selection can retry a failed download.
      throw error
    })
    return loading
  }

  function tint(color: string) {
    if (!mask) return undefined
    if (colored && color === lastColor) return colored
    if (!colored) {
      colored = document.createElement('canvas')
      colored.width = mask.width
      colored.height = mask.height
    }
    const ctx = colored.getContext('2d')!
    ctx.globalCompositeOperation = 'copy'
    ctx.drawImage(mask, 0, 0)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, colored.width, colored.height)
    lastColor = color
    return colored
  }
  return { prepare, tint }
}
