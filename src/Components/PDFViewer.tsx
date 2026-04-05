import { useEffect, useMemo, useState } from 'react'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { Download, OpenInNew, PictureAsPdf } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { buildMinioObjectUrl } from '@utils/minio'

const PDFViewer = ({
  path,
  bucket = 'first-bucket',
  view = 'preview',
  buttons = true,
  compactActions = false
}: {
  path: string
  bucket?: string
  view?: 'preview' | 'default'
  buttons?: boolean
  compactActions?: boolean
}) => {
  const axiosPrivate = useAxiosPrivate()
  const pdfUrl = useMemo(() => buildMinioObjectUrl(bucket, path), [bucket, path])
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
      if (!pdfUrl) {
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
        const response = await axiosPrivate.get(`/files/download/${path}`, {
          responseType: 'blob'
        })
        const objectUrl = URL.createObjectURL(
          new Blob([response.data], { type: 'application/pdf' })
        )

        objectUrlToRevoke = objectUrl

        if (isMounted) {
          setViewerUrl(objectUrl)
          setLoading(false)
        }
      } catch (loadError) {
        console.error('Error loading PDF preview:', loadError)

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
  }, [axiosPrivate, path, pdfUrl])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 220,
          p: 3,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          bgcolor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={32} />
        <Typography color='text.secondary'>
          Cargando vista previa del PDF...
        </Typography>
      </Box>
    )
  }

  if (!pdfUrl || !viewerUrl) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          bgcolor: '#fafafa',
          textAlign: 'center'
        }}
      >
        <Typography color='text.secondary'>{error || 'No se pudo cargar el documento PDF.'}</Typography>
      </Box>
    )
  }

  const viewerHeight = view === 'preview' ? '900px' : '500px'

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
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
            bgcolor: '#f8f9fa',
            borderRadius: 3,
            border: '1px solid #e0e0e0',
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdf sx={{ color: '#d32f2f' }} />
            <Typography variant='body2' sx={{ fontWeight: 600, color: '#424242' }}>
              Vista previa del documento
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
            <Button
              component='a'
              href={viewerUrl}
              download={path}
              variant='contained'
              startIcon={<Download />}
              sx={{
                textTransform: 'none',
                bgcolor: '#00BFA5',
                '&:hover': {
                  bgcolor: '#00ACC1'
                }
              }}
            >
              Descargar
            </Button>
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
          <Button
            component='a'
            href={viewerUrl}
            download={path}
            variant='contained'
            size='small'
            startIcon={<Download />}
            sx={{
              textTransform: 'none',
              bgcolor: '#00BFA5',
              '&:hover': {
                bgcolor: '#00ACC1'
              }
            }}
          >
            Descargar
          </Button>
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          bgcolor: 'white'
        }}
      >
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
            <PictureAsPdf sx={{ fontSize: 48, color: '#d32f2f' }} />
            <Typography variant='body1'>
              No es posible visualizar el PDF en este dispositivo.
            </Typography>
            <Button
              component='a'
              href={viewerUrl}
              download={path}
              variant='contained'
              startIcon={<Download />}
              sx={{
                textTransform: 'none',
                bgcolor: '#00BFA5',
                '&:hover': {
                  bgcolor: '#00ACC1'
                }
              }}
            >
              Descargar PDF
            </Button>
          </Box>
        </object>
      </Box>
    </Box>
  )
}

export default PDFViewer
