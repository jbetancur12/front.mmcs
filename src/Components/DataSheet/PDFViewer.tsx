import { useEffect, useState } from 'react'
import { ArrowBack } from '@mui/icons-material'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

interface PDFData {
  url: string
  fileName: string
}

interface PDFViewerProps {
  path: string
}

const PDFViewer = ({ path }: PDFViewerProps) => {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [pdfData, setPdfData] = useState<PDFData | null>(null)
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const params = id ? id : ''
  const headquarter = searchParams.get('headquarter') || ''

  useEffect(() => {
    const fetchPDF = async () => {
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

        // Convertir el arraybuffer a base64
        // const base64PDF = Buffer.from(response.data, 'binary').toString(
        //   'base64'
        // )
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const blobUrl = URL.createObjectURL(blob)
        setPdfData({
          url: blobUrl,
          fileName
        })
      } catch (error) {
        console.error('Error al obtener el PDF:', error)
      }
    }

    fetchPDF()
  }, [headquarter, params, path, axiosPrivate])
  console.log(pdfData)

  if (!pdfData) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
        flexDirection='column'
      >
        <CircularProgress />
        <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
          Generando PDF...
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBack />
      </IconButton>

      <object
        data={pdfData.url}
        type='application/pdf'
        width='100%'
        height='1000px'
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
              color: '#1565c0',
              textDecoration: 'underline',
              marginTop: 8
            }}
          >
            Haz clic aquí para descargarlo.
          </a>
        </Box>
      </object>
    </>
  )
}

export default PDFViewer
