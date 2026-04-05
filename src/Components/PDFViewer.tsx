import { useMemo } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Download, OpenInNew, PictureAsPdf } from '@mui/icons-material'
import { buildMinioObjectUrl } from '@utils/minio'

const PDFViewer = ({
  path,
  bucket = 'first-bucket',
  view = 'preview',
  buttons = true
}: {
  path: string
  bucket?: string
  view?: 'preview' | 'default'
  buttons?: boolean
}) => {
  const pdfUrl = useMemo(() => buildMinioObjectUrl(bucket, path), [bucket, path])

  if (!pdfUrl) {
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
        <Typography color='text.secondary'>
          No se pudo cargar el documento PDF.
        </Typography>
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
              href={pdfUrl}
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
              href={pdfUrl}
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
          data={pdfUrl}
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
              href={pdfUrl}
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
