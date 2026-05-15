import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { buildMinioObjectUrl } from '@utils/minio'

const DocumentViewPDF = () => {
  const { id } = useParams<{ id: string }>()
  const [pdfData, setPdfData] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setPdfData(buildMinioObjectUrl('fleet-documents', id))
  }, [id])

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
  } else {
    return (
      <>
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <object
          data={pdfData}
          type='application/pdf'
          width='100%'
          height='1000px'
        >
          <br />
          <a href={pdfData} id='enlaceDescargarPdf' download={`${id}`}>
            Tu dispositivo no puede visualizar los PDF, da click aquí para
            descargarlo
          </a>
        </object>
      </>
    )
  }
}

export default DocumentViewPDF
