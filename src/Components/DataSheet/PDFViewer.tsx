import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useEffect, useState } from 'react'
import { ArrowBack, Download } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Container,
  Typography
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

interface PDFData {
  url: string
  fileName: string
}

interface PDFViewerProps {
  path: string
}

const TEAL_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

const PDFViewer: React.FC<PDFViewerProps> = ({ path }) => {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [pdfData, setPdfData] = useState<PDFData | null>(null)
  const [failed, setFailed] = useState(false)
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const params = id ? id : ''
  const headquarter = searchParams.get('headquarter') || ''

  useEffect(() => {
    let blobUrl: string | null = null
    let cancelled = false

    const fetchPDF = async () => {
      setFailed(false)
      try {
        const response = await axiosPrivate.get(`/reports/${path}/${params}`, {
          params: { headquarter },
          responseType: 'arraybuffer'
        })

        // Extraer el nombre del archivo desde el header 'Content-Disposition'
        let fileName = 'data.pdf'
        const disposition = response.headers['content-disposition']
        if (disposition) {
          const match = disposition.match(/filename="?(.+)"?/)
          if (match && match[1]) {
            fileName = match[1]
          }
        }

        const blob = new Blob([response.data], { type: 'application/pdf' })
        blobUrl = URL.createObjectURL(blob)
        if (!cancelled) setPdfData({ url: blobUrl, fileName })
      } catch (error) {
        console.error('Error al obtener el PDF:', error)
        if (!cancelled) setFailed(true)
      }
    }

    fetchPDF()
    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [headquarter, params, path, axiosPrivate])

  const backButton = (
    <Button
      variant='outlined'
      startIcon={<ArrowBack />}
      onClick={() => navigate(-1)}
      sx={TEAL_BUTTON_SX}
    >
      Volver
    </Button>
  )

  if (failed) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Box sx={{ mb: 2 }}>{backButton}</Box>
        <Alert
          severity='error'
          variant='outlined'
          sx={{ borderRadius: '12px' }}
        >
          No se pudo generar el PDF. Vuelve a intentarlo en unos minutos.
        </Alert>
      </Container>
    )
  }

  if (!pdfData) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
        flexDirection='column'
      >
        <SignalLoader message='Generando PDF...' />
      </Box>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2
        }}
      >
        {backButton}
        <Button
          component='a'
          href={pdfData.url}
          download={pdfData.fileName}
          variant='contained'
          startIcon={<Download />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: '#00BFA5',
            '&:hover': { bgcolor: '#00897B' }
          }}
        >
          Descargar PDF
        </Button>
      </Box>

      <object
        data={pdfData.url}
        type='application/pdf'
        width='100%'
        style={{ height: 'calc(100vh - 170px)', minHeight: 500 }}
        title='PDF'
        name='PDF'
      >
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
        >
          <Typography variant='body1' sx={{ mt: 4 }}>
            No es posible visualizar el PDF en dispositivos móviles.
          </Typography>
          <a
            href={pdfData.url}
            download={pdfData.fileName}
            style={{
              color: '#00695C',
              textDecoration: 'underline',
              marginTop: 8
            }}
          >
            Haz clic aquí para descargarlo.
          </a>
        </Box>
      </object>
    </Container>
  )
}

export default PDFViewer
