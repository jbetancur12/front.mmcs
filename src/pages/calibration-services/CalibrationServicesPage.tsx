import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import { useCalibrationServices } from '../../hooks/useCalibrationServices'
import { CalibrationService } from '../../types/calibrationService'

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const getItemsTotal = (service: CalibrationService) => {
  return (service.items ?? []).reduce((accumulator, item) => {
    const value =
      typeof item.total === 'string' ? parseFloat(item.total) : item.total
    return accumulator + (Number.isFinite(value) ? value : 0)
  }, 0)
}

const CalibrationServicesPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch, isFetching } =
    useCalibrationServices()

  const services = data?.services ?? []
  const pendingApprovalCount = services.filter(
    (service) => service.status === 'pending_approval'
  ).length
  const approvedCount = services.filter(
    (service) => service.approvalStatus === 'approved'
  ).length
  const odsCount = services.filter((service) => service.odsCode).length

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='55vh'
      >
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          No pudimos cargar los servicios de calibración.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant='h4' fontWeight={700}>
            Servicios de calibración
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            Bandeja base del nuevo módulo para cotización, seguimiento inicial y
            ODS.
          </Typography>
        </Box>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Actualizar
          </Button>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => navigate('/calibration-services/new')}
          >
            Nuevo servicio
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Total servicios
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {data?.totalItems ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Pendientes aprobación
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {pendingApprovalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Aprobados
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {approvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Con ODS
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {odsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack spacing={2}>
        {services.length === 0 ? (
          <Alert severity='info'>
            Aún no hay servicios de calibración creados en esta bandeja.
          </Alert>
        ) : (
          services.map((service) => (
            <Card key={service.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  justifyContent='space-between'
                  spacing={2}
                >
                  <Box flex={1}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      mb={1.5}
                    >
                      <Typography variant='h6' fontWeight={700}>
                        {service.serviceCode}
                      </Typography>
                      <Chip
                        size='small'
                        color={
                          CALIBRATION_SERVICE_STATUS_COLORS[service.status]
                        }
                        label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]}
                      />
                      <Chip
                        size='small'
                        color={
                          CALIBRATION_SERVICE_APPROVAL_COLORS[
                            service.approvalStatus
                          ]
                        }
                        label={
                          CALIBRATION_SERVICE_APPROVAL_LABELS[
                            service.approvalStatus
                          ]
                        }
                      />
                    </Stack>

                    <Typography variant='body1' fontWeight={600}>
                      {service.customer?.nombre ||
                        service.executionCustomerName ||
                        'Cliente pendiente'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {service.scopeType === 'site'
                        ? `Sede: ${service.customerSite || service.executionSiteName || 'Sin sede definida'}`
                        : 'Alcance general del cliente'}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Ítems
                        </Typography>
                        <Typography variant='body1' fontWeight={600}>
                          {service.items?.length ?? 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Total estimado
                        </Typography>
                        <Typography variant='body1' fontWeight={600}>
                          {currencyFormatter.format(getItemsTotal(service))}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant='caption' color='text.secondary'>
                          Actualizado
                        </Typography>
                        <Typography variant='body1' fontWeight={600}>
                          {new Date(service.updatedAt).toLocaleDateString(
                            'es-CO'
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Stack
                    direction={{ xs: 'row', lg: 'column' }}
                    spacing={1}
                    justifyContent='flex-start'
                  >
                    <Button
                      variant='outlined'
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() =>
                        navigate(`/calibration-services/${service.id}`)
                      }
                    >
                      Ver detalle
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  )
}

export default CalibrationServicesPage
