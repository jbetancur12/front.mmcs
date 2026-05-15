import { Suspense, lazy, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ArrowBack } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material'

const VehicleDataSheetPreview = lazy(
  () => import('./VehicleDataSheetPreview')
)

const VehicleDataSheetPDF = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const vehicleData = state?.vehicleData
  const documents = state?.documents ?? []

  const handleGoBack = () => {
    if (vehicleData?.id) {
      navigate(`/fleet/${vehicleData.id}/documents`)
      return
    }

    navigate('/fleet')
  }

  if (!vehicleData) {
    return (
      <Box p={4}>
        <Stack direction='row' spacing={2} sx={{ mb: 3 }}>
          <Button
            variant='contained'
            onClick={handleGoBack}
            startIcon={<ArrowBack />}
          >
            Volver
          </Button>
        </Stack>

        <Typography variant='h6' gutterBottom>
          No se encontraron datos del vehiculo para generar la hoja de vida.
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Abre la hoja de vida desde el modulo de flota para cargar el contexto
          correcto.
        </Typography>
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Stack direction='row' spacing={2} sx={{ mb: 3 }}>
        <Button
          variant='contained'
          onClick={handleGoBack}
          startIcon={<ArrowBack />}
        >
          Volver
        </Button>
        {showPreview && (
          <Button variant='outlined' onClick={() => setShowPreview(false)}>
            Ocultar vista previa
          </Button>
        )}
      </Stack>

      {!showPreview ? (
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          py={10}
        >
          <Typography variant='h6' gutterBottom>
            La vista previa de la hoja de vida del vehiculo se carga bajo demanda.
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            El detalle principal ya esta disponible y el render PDF pesado solo
            se monta cuando realmente lo necesitas.
          </Typography>
          <Button variant='contained' onClick={() => setShowPreview(true)}>
            Ver PDF
          </Button>
        </Box>
      ) : (
        <Suspense
          fallback={
            <Box display='flex' justifyContent='center' py={6}>
              <CircularProgress />
            </Box>
          }
        >
          <VehicleDataSheetPreview
            vehicleData={vehicleData}
            documents={documents}
          />
        </Suspense>
      )}
    </Box>
  )
}

export default VehicleDataSheetPDF
