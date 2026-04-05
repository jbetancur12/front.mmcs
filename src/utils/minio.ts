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
