import { useEffect, useState } from 'react'
import * as minioExports from 'minio'
import { Avatar } from '@mui/material'

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

const IMGViewer = ({
  path,
  bucket = 'first-bucket'
}: {
  path: string
  bucket: string
}) => {
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    // Nombre de tu archivo de imagen en el bucket

    const getImageFromBucket = async () => {
      try {
        const objectStream = await minioClient.getObject(bucket, path)
        const chunks: Uint8Array[] = []

        objectStream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
        objectStream.on('end', () => {
          const imageBlob = new Blob(chunks, { type: 'image/jpeg' }) // Cambia el tipo de imagen según corresponda (jpeg, png, etc.)
          const imageUrl = URL.createObjectURL(imageBlob)
          setImageUrl(imageUrl)
        })
      } catch (error) {
        console.error('Error al obtener la imagen del bucket:', error)
      }
    }

    getImageFromBucket()
  }, [path])
  return (
    <Avatar
      src={imageUrl}
      alt='Imagen desde MinIO'
      sx={{ width: 200, height: 200, mb: 2 }}
    />
  )
}

export default IMGViewer
