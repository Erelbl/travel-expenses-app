/**
 * Normalize receipt image to JPEG format for reliable OCR/Vision extraction.
 * Converts HEIC, HEIF, and other formats to JPEG, and resizes large images.
 */

const MAX_DIMENSION = 2000 // Max width or height in pixels
const JPEG_QUALITY = 0.9
const MAX_SIZE_BYTES = 8 * 1024 * 1024 // 8MB

export async function normalizeReceiptImageToJpeg(file: File): Promise<File> {
  // If already JPEG and under size limit, return as-is
  if (file.type === "image/jpeg" && file.size <= MAX_SIZE_BYTES) {
    return file
  }

  try {
    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file)

    try {
      // Load image to get dimensions
      const img = await loadImage(objectUrl)
      
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      // Create canvas and draw image
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          "image/jpeg",
          JPEG_QUALITY
        )
      })

      // Create new File with .jpg extension
      const fileName = file.name.replace(/\.[^.]+$/, ".jpg")
      return new File([blob], fileName, { type: "image/jpeg" })
    } finally {
      // Clean up object URL
      URL.revokeObjectURL(objectUrl)
    }
  } catch (error) {
    console.error("[Receipt] Image normalization failed:", error)
    // Fallback: return original file
    return file
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = url
  })
}

