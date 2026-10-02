/**
 * Convierte cualquier enlace de Google Drive a su URL embebible (/preview).
 * Soporta: /file/d/ID/view, open?id=ID, uc?id=ID y enlaces con usp=drive_fs.
 */
export const buildGDriveEmbedUrl = (url: string): string => {
  if (!url) return url
  const fileMatch = url.match(/\/file\/d\/([^/?#]+)/)
  const idMatch = url.match(/[?&]id=([^&#]+)/)
  const id = fileMatch?.[1] || idMatch?.[1]
  return id ? `https://drive.google.com/file/d/${id}/preview` : url
}
