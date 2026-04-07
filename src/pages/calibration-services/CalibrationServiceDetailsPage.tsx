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
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import { useCalibrationService } from '../../hooks/useCalibrationServices'

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return 0
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const CalibrationServiceDetailsPage = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId: string }>()
  const { data: service, isLoading, isError, error } =
    useCalibrationService(serviceId)

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

  if (isError || !service) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          No pudimos cargar el detalle del servicio.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Stack direction='row' justifyContent='space-between' mb={3}>
        <Box>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate('/calibration-services')}
            sx={{ mb: 1 }}
          >
            Volver a la bandeja
          </Button>
          <Typography variant='h4' fontWeight={700}>
            {service.serviceCode}
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            {service.customer?.nombre ||
              service.executionCustomerName ||
              'Cliente pendiente'}
          </Typography>
        </Box>

        <Stack spacing={1} alignItems='flex-end'>
          <Chip
            color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]}
            label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]}
          />
          <Chip
            color={
              CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]
            }
            label={
              CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]
            }
          />
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Resumen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Contacto
                  </Typography>
                  <Typography variant='body1'>
                    {service.contactName || 'Sin contacto'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Canal de solicitud
                  </Typography>
                  <Typography variant='body1'>
                    {service.requestChannel || 'Sin definir'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Sede
                  </Typography>
                  <Typography variant='body1'>
                    {service.customerSite ||
                      service.executionSiteName ||
                      'Sin sede definida'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Forma de pago
                  </Typography>
                  <Typography variant='body1'>
                    {service.paymentMethod || 'Sin definir'}
                  </Typography>
                </Grid>
              </Grid>

              {service.commercialComments ? (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='caption' color='text.secondary'>
                    Comentarios comerciales
                  </Typography>
                  <Typography variant='body1' sx={{ mt: 0.5 }}>
                    {service.commercialComments}
                  </Typography>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Ítems cotizados
              </Typography>

              {service.items?.length ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ítem</TableCell>
                        <TableCell>Instrumento</TableCell>
                        <TableCell>Tipo servicio</TableCell>
                        <TableCell align='right'>Cantidad</TableCell>
                        <TableCell align='right'>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {service.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.instrumentName || 'N/A'}</TableCell>
                          <TableCell>{item.serviceType || 'N/A'}</TableCell>
                          <TableCell align='right'>{item.quantity}</TableCell>
                          <TableCell align='right'>
                            {currencyFormatter.format(toNumber(item.total))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Alert severity='info'>Este servicio aún no tiene ítems.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Documentos
              </Typography>
              {service.documents?.length ? (
                <List dense disablePadding>
                  {service.documents.map((document) => (
                    <ListItem key={document.id} disableGutters>
                      <ListItemText
                        primary={document.title || document.originalFileName}
                        secondary={`${document.documentType} · v${document.version}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity='info'>
                  Aún no hay documentos asociados al servicio.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Historial
              </Typography>
              {service.events?.length ? (
                <List dense disablePadding>
                  {service.events.map((event) => (
                    <ListItem key={event.id} disableGutters>
                      <ListItemText
                        primary={event.description}
                        secondary={`${event.performedByName} · ${new Date(
                          event.occurredAt
                        ).toLocaleString('es-CO')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity='info'>
                  El servicio todavía no tiene eventos visibles.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CalibrationServiceDetailsPage
