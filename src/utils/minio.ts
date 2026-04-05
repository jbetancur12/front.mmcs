const MINIO_BASE_URL = (import.meta.env.VITE_MINIO_URL || '').replace(/\/$/, '')

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

export const buildMinioObjectUrl = (bucket: string, objectPath?: string | null) => {
  if (!objectPath) return ''
  if (isAbsoluteUrl(objectPath)) return objectPath
  if (!MINIO_BASE_URL) return ''

  const normalizedBucket = bucket.replace(/^\/+|\/+$/g, '')
  const normalizedPath = objectPath.replace(/^\/+/, '')

  return `${MINIO_BASE_URL}/${normalizedBucket}/${normalizedPath}`
}

export const fetchMinioObjectBlob = async (bucket: string, objectPath?: string | null) => {
  const objectUrl = buildMinioObjectUrl(bucket, objectPath)
  if (!objectUrl) {
    throw new Error('No se pudo construir la URL del objeto')
  }

  const response = await fetch(objectUrl)
  if (!response.ok) {
    throw new Error(`No se pudo descargar el objeto: ${response.status}`)
  }

  return response.blob()
}

export const createObjectUrlFromMinio = async (
  bucket: string,
  objectPath?: string | null
) => {
  const blob = await fetchMinioObjectBlob(bucket, objectPath)
  return URL.createObjectURL(blob)
}
