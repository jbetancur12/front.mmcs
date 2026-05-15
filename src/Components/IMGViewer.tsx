import { useMemo } from 'react'
import { Avatar } from '@mui/material'
import { buildMinioObjectUrl } from '@utils/minio'

const IMGViewer = ({
  path,
  bucket = 'first-bucket'
}: {
  path: string
  bucket: string
}) => {
  const imageUrl = useMemo(() => buildMinioObjectUrl(bucket, path), [bucket, path])

  return (
    <Avatar
      src={imageUrl}
      alt='Imagen desde MinIO'
      sx={{ width: 200, height: 200, mb: 2 }}
    />
  )
}

export default IMGViewer
