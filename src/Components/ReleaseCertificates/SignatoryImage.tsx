import React from 'react'
import { Box, SxProps, Theme } from '@mui/material'
import {
  useSealImage,
  useSignatoryImage
} from 'src/hooks/releaseCertificates/useReleaseCertificates'

interface SignatoryImageProps {
  id: number
  alt: string
  sx?: SxProps<Theme>
  draggable?: boolean
}

/** Imagen de la firma de una persona del registro; la descarga con la sesión, el front no conoce su ruta. */
const SignatoryImage: React.FC<SignatoryImageProps> = ({
  id,
  alt,
  sx,
  draggable
}) => {
  const { data: url } = useSignatoryImage(id)
  if (!url) return <Box sx={{ minHeight: 16, ...(sx as object) }} />
  return (
    <Box component='img' src={url} alt={alt} draggable={draggable} sx={sx} />
  )
}

/** Sello «Firmado digitalmente» del laboratorio. */
export const SealImage: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => {
  const { data: url } = useSealImage()
  if (!url) return <Box sx={{ minHeight: 16, ...(sx as object) }} />
  return (
    <Box
      component='img'
      src={url}
      alt='Sello Firmado digitalmente'
      draggable={false}
      sx={sx}
    />
  )
}

export default SignatoryImage
