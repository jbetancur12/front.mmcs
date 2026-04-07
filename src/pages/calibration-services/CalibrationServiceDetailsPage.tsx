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
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  useCalibrationService,
  useCalibrationServiceMutations
} from '../../hooks/useCalibrationServices'
import CalibrationServiceApprovalDialog, {
  CalibrationServiceDecisionMode,
  CalibrationServiceDecisionValues
} from './CalibrationServiceApprovalDialog'

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

const getOtherFieldText = (
  otherFields: Record<string, unknown> | undefined,
  fieldName: string
) => {
  const fieldValue = otherFields?.[fieldName]
  return typeof fieldValue === 'string' ? fieldValue : ''
}

const CalibrationServiceDetailsPage = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId: string }>()
  const { data: service, isLoading, isError, error } =
    useCalibrationService(serviceId)
  const {
    requestApproval,
    approveService,
    rejectService,
    uploadDocument
  } = useCalibrationServiceMutations()
  const [decisionMode, setDecisionMode] =
    useState<CalibrationServiceDecisionMode | null>(null)

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

  const canEdit = ['draft', 'pending_approval'].includes(service.status)
  const canRequestApproval = service.status === 'draft'
  const canDecideApproval = service.status === 'pending_approval'
  const approvalNotes = getOtherFieldText(service.otherFields, 'approvalNotes')
  const isDecisionLoading =
    requestApproval.isLoading ||
    approveService.isLoading ||
    rejectService.isLoading ||
    uploadDocument.isLoading
  const decisionDocuments = service.documents?.filter((document) =>
    ['approval_evidence', 'rejection_evidence'].includes(document.documentType)
  )

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync({ serviceId: String(service.id) })
      toast.success('El servicio quedó enviado a aprobación.')
    } catch (requestError) {
      console.error(requestError)
      toast.error('No pudimos enviar el servicio a aprobación.')
    }
  }

  const handleDecisionSubmit = async (
    values: CalibrationServiceDecisionValues
  ) => {
    try {
      if (decisionMode === 'approve') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio de aprobación.')
          return
        }

        if (!values.approvalReference.trim()) {
          toast.error('Indica el email o teléfono que aprobó la cotización.')
          return
        }
      }

      if (decisionMode === 'reject') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio de rechazo.')
          return
        }

        if (!values.notes.trim() || values.notes.trim().length < 5) {
          toast.error('Describe brevemente el motivo del rechazo.')
          return
        }
      }

      let evidenceDocumentId: number | null = null

      if (values.evidenceFile) {
        const uploadedDocument = await uploadDocument.mutateAsync({
          serviceId: String(service.id),
          file: values.evidenceFile,
          documentType:
            decisionMode === 'approve'
              ? 'approval_evidence'
              : 'rejection_evidence',
          title:
            decisionMode === 'approve'
              ? `Aprobación ${service.serviceCode}`
              : `Rechazo ${service.serviceCode}`,
          notes: values.notes?.trim() || undefined
        })

        evidenceDocumentId = uploadedDocument.id
      }

      const decisionIsoDate = values.decisionDate
        ? new Date(`${values.decisionDate}T12:00:00`).toISOString()
        : undefined

      if (decisionMode === 'approve') {
        await approveService.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim(),
          approvalNotes: values.notes.trim() || null,
          approvedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success('La cotización quedó aprobada formalmente.')
      }

      if (decisionMode === 'reject') {

        await rejectService.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          rejectionReason: values.notes.trim(),
          rejectedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success('La cotización quedó rechazada formalmente.')
      }

      setDecisionMode(null)
    } catch (decisionError) {
      console.error(decisionError)
      toast.error(
        decisionMode === 'approve'
          ? 'No pudimos registrar la aprobación.'
          : 'No pudimos registrar el rechazo.'
      )
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Toaster position='top-center' />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
        mb={3}
      >
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

        <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
          {canRequestApproval ? (
            <Button
              variant='contained'
              startIcon={<SendOutlinedIcon />}
              onClick={() => void handleRequestApproval()}
              disabled={isDecisionLoading}
            >
              Solicitar aprobación
            </Button>
          ) : null}
          {canDecideApproval ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant='outlined'
                color='warning'
                startIcon={<HighlightOffOutlinedIcon />}
                onClick={() => setDecisionMode('reject')}
                disabled={isDecisionLoading}
              >
                Rechazar cotización
              </Button>
              <Button
                variant='contained'
                color='success'
                startIcon={<CheckCircleOutlineOutlinedIcon />}
                onClick={() => setDecisionMode('approve')}
                disabled={isDecisionLoading}
              >
                Aprobar cotización
              </Button>
            </Stack>
          ) : null}
          {canEdit ? (
            <Button
              variant='outlined'
              startIcon={<EditOutlinedIcon />}
              onClick={() =>
                navigate(`/calibration-services/${service.id}/edit`)
              }
            >
              Editar servicio
            </Button>
          ) : null}
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

              {service.approvalStatus !== 'pending' ? (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                    Decisión comercial
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Medio
                      </Typography>
                      <Typography variant='body1'>
                        {service.approvalChannel || 'Sin registrar'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Referencia
                      </Typography>
                      <Typography variant='body1'>
                        {service.approvalReference || 'Sin registrar'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Fecha
                      </Typography>
                      <Typography variant='body1'>
                        {service.approvedAt || service.rejectedAt
                          ? new Date(
                              service.approvedAt || service.rejectedAt || ''
                            ).toLocaleDateString('es-CO')
                          : 'Sin registrar'}
                      </Typography>
                    </Grid>
                    {service.rejectionReason ? (
                      <Grid item xs={12}>
                        <Typography variant='caption' color='text.secondary'>
                          Motivo de rechazo
                        </Typography>
                        <Typography variant='body1'>
                          {service.rejectionReason}
                        </Typography>
                      </Grid>
                    ) : null}
                    {approvalNotes ? (
                      <Grid item xs={12}>
                        <Typography variant='caption' color='text.secondary'>
                          Observación de aprobación
                        </Typography>
                        <Typography variant='body1'>
                          {approvalNotes}
                        </Typography>
                      </Grid>
                    ) : null}
                  </Grid>
                </>
              ) : null}

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
              {decisionDocuments?.length ? (
                <Alert severity='success' sx={{ mb: 2 }}>
                  Este servicio ya tiene {decisionDocuments.length} evidencia(s)
                  de aprobación o rechazo.
                </Alert>
              ) : null}
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
      {decisionMode ? (
        <CalibrationServiceApprovalDialog
          open={Boolean(decisionMode)}
          mode={decisionMode}
          serviceCode={service.serviceCode}
          isLoading={isDecisionLoading}
          onClose={() => setDecisionMode(null)}
          onSubmit={handleDecisionSubmit}
        />
      ) : null}
    </Box>
  )
}

export default CalibrationServiceDetailsPage
