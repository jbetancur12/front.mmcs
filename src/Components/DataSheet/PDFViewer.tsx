import { ArrowBack } from '@mui/icons-material'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface PDFViewerProps {
  path: string
}

const PDFViewer = ({ path }: PDFViewerProps) => {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const [pdfData, setPdfData] = useState<string | null>(null)
  const navigate = useNavigate()

  const params = id ? id : ''

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        // Realiza la solicitud al endpoint para obtener el PDF
        const response = await axiosPrivate.get(`/reports/${path}/${params}`, {
          responseType: 'arraybuffer' // Especifica que esperamos un archivo binario
        })

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
        <div className='flex flex-col items-center justify-center'>
          <p className='text-gray-600 text-lg mt-4'>
            No es posible visualizar el PDF en dispositios moviles.
            <a
              href={pdfData}
              id='enlaceDescargarPdf'
              download={`data.pdf`}
              className='text-blue-600 underline hover:text-blue-800 ml-2'
            >
              Haz clic aquí para descargarlo.
            </a>
          </p>
        </div>
      </object>
    </>
  )
}

export default PDFViewer
