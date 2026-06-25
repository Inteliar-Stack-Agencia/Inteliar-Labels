// Convert an image (logo) into a ZPL ^GFA monochrome bitmap field.
// Runs in the browser: draws the image to a canvas at the target dot size,
// thresholds each pixel to black/white, and encodes it as ASCII-hex ^GFA data.

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`))
    img.src = url
  })
}

// Returns the ZPL `^GFA,...` field body (without the `^FO` position prefix).
// wDots/hDots are the printed size in printer dots.
export async function imageToGFA(url: string, wDots: number, hDots: number): Promise<string> {
  const w = Math.max(1, Math.round(wDots))
  const h = Math.max(1, Math.round(hDots))

  const img = await loadImage(url)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo crear el canvas para el logo")

  // White background so transparent areas stay white (unprinted)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, w, h)

  const bytesPerRow = Math.ceil(w / 8)
  const totalBytes = bytesPerRow * h
  let hex = ""

  for (let y = 0; y < h; y++) {
    for (let bx = 0; bx < bytesPerRow; bx++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit
        if (x < w) {
          const idx = (y * w + x) * 4
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3]
          // luminance; treat transparent as white
          const lum = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b
          if (lum < 128) byte |= 0x80 >> bit // dark pixel -> printed (1)
        }
      }
      hex += byte.toString(16).padStart(2, "0").toUpperCase()
    }
  }

  return `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}`
}
