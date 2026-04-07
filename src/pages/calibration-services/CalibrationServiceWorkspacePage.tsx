import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import { useNavigate } from 'react-router-dom'

const CalibrationServiceWorkspacePage = () => {
  const navigate = useNavigate()

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Button
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate('/calibration-services')}
        sx={{ mb: 2 }}
      >
        Volver a la bandeja
      </Button>

      <Card sx={{ borderRadius: 3, maxWidth: 820 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <ConstructionOutlinedIcon color='warning' />
              <Typography variant='h4' fontWeight={700}>
                Nuevo servicio de calibración
              </Typography>
            </Stack>

            <Typography variant='body1' color='text.secondary'>
              La arquitectura del módulo ya está lista y la API base ya responde.
              En el siguiente ticket vamos a conectar aquí el formulario completo
              de cotización con cliente, sede, condiciones comerciales e ítems.
            </Typography>

            <Alert severity='info'>
              Esta pantalla quedó intencionalmente como workspace base para no
              rehacer rutas ni hooks cuando entremos al formulario real.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CalibrationServiceWorkspacePage
