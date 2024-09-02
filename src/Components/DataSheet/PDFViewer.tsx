import { ArrowBack } from '@mui/icons-material'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config'

interface PDFViewerProps {
  path: string
}

const apiUrl = api()

const PDFViewer = ({ path }: PDFViewerProps) => {
  const { id } = useParams<{ id: string }>()
  const [pdfData, setPdfData] = useState<string | null>(null)
  const navigate = useNavigate()

  const params = id ? id : ''

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        // Realiza la solicitud al endpoint para obtener el PDF
        const response = await axios.get(
          `${apiUrl}/reports/${path}/${params}`,
          {
            responseType: 'arraybuffer', // Especifica que esperamos un archivo binario
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )

        // Convierte el archivo binario a una cadena base64
        const base64PDF = Buffer.from(response.data, 'binary').toString(
          'base64'
        )
        setPdfData(`data:application/pdf;base64,${base64PDF}`)
      } catch (error) {
        console.error('Error al obtener el PDF:', error)
      }
    }

    fetchPDF()
  }, [])

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

      {/* <AdobeViewer pdfUrl={pdfData} /> */}
      <object
        data={pdfData}
        type='application/pdf'
        width='100%'
        height='1000px'
        title='PDF'
        name='PDF'
      >
        <br />
        <p>
          Tu dispositivo no puede visualizar los PDF,
          <a href={pdfData} id='enlaceDescargarPdf' download={`data.pdf`}>
            da click aquí para descargarlo.
          </a>
        </p>
      </object>
    </>
  )
}

export default PDFViewer
