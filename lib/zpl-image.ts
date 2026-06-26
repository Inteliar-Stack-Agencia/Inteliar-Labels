// Convert an image (logo) into a ZPL ^GFA monochrome bitmap field.
// Runs in the browser: draws the image to a canvas at 4x the target size for
// better detail, applies Floyd-Steinberg dithering, then packs to 1-bit ^GFA.

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`))
    img.src = url
  })
}

// Floyd-Steinberg dithering on a Float32Array of luminance values [0..255].
// Modifies the array in place, setting each value to 0 (black) or 255 (white).
function ditherFloydSteinberg(lum: Float32Array, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const old = lum[i]
      const nw = old < 128 ? 0 : 255
      lum[i] = nw
      const err = old - nw
      if (x + 1 < w)            lum[i + 1]         += err * 7 / 16
      if (y + 1 < h) {
        if (x > 0)               lum[i + w - 1]     += err * 3 / 16
                                 lum[i + w]          += err * 5 / 16
        if (x + 1 < w)          lum[i + w + 1]      += err * 1 / 16
      }
    }
  }
}

// Returns the ZPL `^GFA,...` field body (without the `^FO` position prefix).
// wDots/hDots are the printed size in printer dots.
export async function imageToGFA(url: string, wDots: number, hDots: number): Promise<string> {
  const w = Math.max(1, Math.round(wDots))
  const h = Math.max(1, Math.round(hDots))

  // Render at 4x resolution for better detail before downsampling to 1-bit
  const OVERSAMPLE = 4
  const bw = w * OVERSAMPLE
  const bh = h * OVERSAMPLE

  const img = await loadImage(url)

  const canvas = document.createElement("canvas")
  canvas.width = bw
  canvas.height = bh
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo crear el canvas para el logo")

  // High-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // White background so transparent areas stay white (unprinted)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, bw, bh)

  // Draw with "contain" to preserve native aspect ratio (matches the editor
  // preview which uses objectFit:contain). Centered inside the box.
  const natW = img.naturalWidth || bw
  const natH = img.naturalHeight || bh
  const scale = Math.min(bw / natW, bh / natH)
  const drawW = natW * scale
  const drawH = natH * scale
  const offX = (bw - drawW) / 2
  const offY = (bh - drawH) / 2
  ctx.drawImage(img, offX, offY, drawW, drawH)

  const { data } = ctx.getImageData(0, 0, bw, bh)

  // Build luminance map at oversampled resolution
  const lumBig = new Float32Array(bw * bh)
  for (let i = 0; i < bw * bh; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
    lumBig[i] = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b
  }

  // Downsample to target resolution by averaging OVERSAMPLE×OVERSAMPLE blocks
  const lumFinal = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let dy = 0; dy < OVERSAMPLE; dy++) {
        for (let dx = 0; dx < OVERSAMPLE; dx++) {
          sum += lumBig[(y * OVERSAMPLE + dy) * bw + (x * OVERSAMPLE + dx)]
        }
      }
      lumFinal[y * w + x] = sum / (OVERSAMPLE * OVERSAMPLE)
    }
  }

  // Apply Floyd-Steinberg dithering for smooth B&W conversion
  ditherFloydSteinberg(lumFinal, w, h)

  // Pack into ZPL ^GFA hex format (1=black/printed, 0=white/blank)
  const bytesPerRow = Math.ceil(w / 8)
  const totalBytes = bytesPerRow * h
  let hex = ""

  for (let y = 0; y < h; y++) {
    for (let bx = 0; bx < bytesPerRow; bx++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit
        if (x < w && lumFinal[y * w + x] === 0) {
          byte |= 0x80 >> bit // dark pixel -> printed (1)
        }
      }
      hex += byte.toString(16).padStart(2, "0").toUpperCase()
    }
  }

  return `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}`
}
