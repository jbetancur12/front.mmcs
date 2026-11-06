import SignalLoader from 'src/Components/Common/SignalLoader'
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Download, OpenInNew, PictureAsPdf } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { buildMinioObjectUrl } from '@utils/minio'

import { logger } from 'src/utils/logger'
import { brand, neutral, intent, withAlpha } from 'src/theme/designTokens'
const PDFViewer = ({
  path,
  bucket = 'first-bucket',
  view = 'preview',
  buttons = true,
  compactActions = false,
  downloadUrl,
  allowDownload = true,
  allowOpen = true,
  watermarkText,
  disableContextMenu = false
}: {
  path?: string
  bucket?: string
  view?: 'preview' | 'default'
  buttons?: boolean
  compactActions?: boolean
  downloadUrl?: string
  allowDownload?: boolean
  allowOpen?: boolean
  watermarkText?: string
  disableContextMenu?: boolean
}) => {
  const axiosPrivate = useAxiosPrivate()
  const pdfUrl = useMemo(
    () => (path ? buildMinioObjectUrl(bucket, path) : ''),
    [bucket, path]
  )
  const [viewerUrl, setViewerUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const embeddedViewerUrl = useMemo(() => {
    if (!viewerUrl) return ''
    return `${viewerUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`
  }, [viewerUrl])

  useEffect(() => {
    let isMounted = true
    let objectUrlToRevoke = ''

    const loadPdf = async () => {
      if (!downloadUrl && !pdfUrl) {
        if (isMounted) {
          setViewerUrl('')
          setError('No se pudo cargar el documento PDF.')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await axiosPrivate.get(
          downloadUrl || `/files/download/${path}`,
          {
            responseType: 'blob'
          }
        )
        const objectUrl = URL.createObjectURL(
          new Blob([response.data], { type: 'application/pdf' })
        )

        objectUrlToRevoke = objectUrl

        if (isMounted) {
          setViewerUrl(objectUrl)
          setLoading(false)
        }
      } catch (loadError) {
        logger.error('Error loading PDF preview:', loadError)

        if (isMounted) {
          setViewerUrl('')
          setError('No se pudo cargar la vista previa del PDF.')
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      isMounted = false
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke)
      }
    }
  }, [axiosPrivate, downloadUrl, path, pdfUrl])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 220,
          p: 3,
          borderRadius: 2,
          border: `1px solid ${neutral.borderStrong}`,
          bgcolor: neutral.surfaceAlt,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <SignalLoader message='Cargando vista previa del PDF...' />
      </Box>
    )
  }

  if (!viewerUrl || (!downloadUrl && !pdfUrl)) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: `1px solid ${neutral.borderStrong}`,
          bgcolor: neutral.surfaceAlt,
          textAlign: 'center'
        }}
      >
        <Typography color='text.secondary'>
          {error || 'No se pudo cargar el documento PDF.'}
        </Typography>
      </Box>
    )
  }

  const viewerHeight = view === 'preview' ? '900px' : '500px'
  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableContextMenu) {
      event.preventDefault()
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
      onContextMenu={handleContextMenu}
    >
      {buttons && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: 2,
            mb: 2,
            p: 2,
            bgcolor: neutral.surfaceAlt,
            borderRadius: 3,
            border: `1px solid ${neutral.borderStrong}`,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdf sx={{ color: intent.danger }} />
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, color: neutral.textBody }}
            >
              Vista previa del documento
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {allowOpen && (
              <Button
                component='a'
                href={viewerUrl}
                target='_blank'
                rel='noreferrer'
                variant='outlined'
                startIcon={<OpenInNew />}
                sx={{ textTransform: 'none' }}
              >
                Abrir
              </Button>
            )}
            {allowDownload && (
              <Button
                component='a'
                href={viewerUrl}
                download={path}
                variant='contained'
                startIcon={<Download />}
                sx={{
                  textTransform: 'none',
                  bgcolor: brand.main,
                  '&:hover': {
                    bgcolor: brand.hover
                  }
                }}
              >
                Descargar
              </Button>
            )}
          </Box>
        </Box>
      )}

      {!buttons && compactActions && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            width: '100%',
            gap: 1,
            mb: 1.5,
            flexWrap: 'wrap'
          }}
        >
          {allowOpen && (
            <Button
              component='a'
              href={viewerUrl}
              target='_blank'
              rel='noreferrer'
              variant='outlined'
              size='small'
              startIcon={<OpenInNew />}
              sx={{ textTransform: 'none' }}
            >
              Abrir
            </Button>
          )}
          {allowDownload && (
            <Button
              component='a'
              href={viewerUrl}
              download={path}
              variant='contained'
              size='small'
              startIcon={<Download />}
              sx={{
                textTransform: 'none',
                bgcolor: brand.main,
                '&:hover': {
                  bgcolor: brand.hover
                }
              }}
            >
              Descargar
            </Button>
          )}
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          border: `1px solid ${neutral.borderStrong}`,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: `0 4px 12px ${withAlpha(neutral.black, 0.08)}`,
          bgcolor: 'white'
        }}
      >
        {watermarkText && (
          <Box
            aria-hidden='true'
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.18,
              backgroundImage: `repeating-linear-gradient(-28deg, transparent 0 110px, ${withAlpha(neutral.black, 0.02)} 110px 220px), url("data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='260' viewBox='0 0 420 260'><g transform='rotate(-24 210 130)'><text x='36' y='130' fill='%23000' fill-opacity='1' font-family='Arial, sans-serif' font-size='26' font-weight='700'>${watermarkText}</text></g></svg>`
              )}")`,
              backgroundRepeat: 'repeat',
              userSelect: 'none'
            }}
          />
        )}
        <object
          data={embeddedViewerUrl}
          type='application/pdf'
          width='100%'
          height={viewerHeight}
          aria-label='Vista previa del PDF'
        >
          <Box
            sx={{
              minHeight: 220,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 2
            }}
          >
            <PictureAsPdf sx={{ fontSize: 48, color: intent.danger }} />
            <Typography variant='body1'>
              No es posible visualizar el PDF en este dispositivo.
            </Typography>
            {allowDownload && (
              <Button
                component='a'
                href={viewerUrl}
                download={path}
                variant='contained'
                startIcon={<Download />}
                sx={{
                  textTransform: 'none',
                  bgcolor: brand.main,
                  '&:hover': {
                    bgcolor: brand.hover
                  }
                }}
              >
                Descargar PDF
              </Button>
            )}
          </Box>
        </object>
      </Box>
    </Box>
  )
}

export default PDFViewer
