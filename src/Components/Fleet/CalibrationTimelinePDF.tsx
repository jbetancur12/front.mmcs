import { ArrowBack } from '@mui/icons-material'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import { useCalibrationTimelinePdf } from '@hooks/fleet/useFleetQueries'

import { useNavigate, useParams } from 'react-router-dom'

export const CalibrationTimelinePDF = () => {
  const { id } = useParams<{ id: string }>()
  const { data: pdfData } = useCalibrationTimelinePdf(id)
  const navigate = useNavigate()


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
