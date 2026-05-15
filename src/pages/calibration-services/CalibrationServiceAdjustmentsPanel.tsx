import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {
  CALIBRATION_SERVICE_ADJUSTMENT_STATUS_COLORS,
  CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS,
  CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS
} from '../../constants/calibrationServices'
import {
  CalibrationService,
  CalibrationServiceAdjustment
} from '../../types/calibrationService'

interface CalibrationServiceAdjustmentsPanelProps {
  service: CalibrationService
  canReport: boolean
  canTechnicalReview: boolean
  canCommercialReview: boolean
  canGenerateDocument?: boolean
  canGenerateSummaryDocument?: boolean
  isTechnicalOnlyView?: boolean
  isBusy?: boolean
  onCreate: () => void
  onReview: (
    adjustment: CalibrationServiceAdjustment,
    reviewStage: 'technical' | 'commercial'
  ) => void
  onSendToCustomer?: (adjustment: CalibrationServiceAdjustment) => void
  onRegisterCustomerResponse?: (
    adjustment: CalibrationServiceAdjustment
  ) => void
  onGenerateDocument?: (adjustment: CalibrationServiceAdjustment) => void
  onGenerateSummaryDocument?: () => void
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const SUPPORT_CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamada',
  email: 'Correo',
  in_person: 'Presencial',
  other: 'Otro'
}

const getAdjustmentOtherFields = (adjustment: CalibrationServiceAdjustment) =>
  (adjustment.otherFields || {}) as Record<string, unknown>

const getTextField = (fields: Record<string, unknown>, key: string) =>
  typeof fields[key] === 'string' ? String(fields[key]) : ''

const getTechnicalDecisionLabel = (fields: Record<string, unknown>) => {
  if (fields.technicalDecision === 'approved') {
    return 'Aceptada'
  }

  if (fields.technicalDecision === 'rejected') {
    return 'Rechazada'
  }

  return 'Pendiente'
}

const getCustomerAcceptanceLabel = (
  adjustment: CalibrationServiceAdjustment
) => {
  if (adjustment.status === 'approved') {
    return 'Aceptada'
  }

  if (adjustment.status === 'customer_rejected') {
    return 'Rechazada'
  }

  if (adjustment.status === 'customer_changes_requested') {
    return 'Solicitó ajuste'
  }

  if (adjustment.status === 'pending_customer_approval') {
    return 'Pendiente'
  }

  return 'No aplica'
}

const isBlockingAdjustment = (adjustment: CalibrationServiceAdjustment) => {
  const otherFields = getAdjustmentOtherFields(adjustment)
  const needsContractAcceptance =
    otherFields.contractModificationRequired !== false

  return (
    [
      'reported',
      'pending_customer_approval',
      'customer_changes_requested'
    ].includes(adjustment.status) ||
    (needsContractAcceptance && adjustment.status === 'customer_rejected')
  )
}

const CalibrationServiceAdjustmentsPanel = ({
  service,
  canReport,
  canTechnicalReview,
  canCommercialReview,
  canGenerateDocument = false,
  canGenerateSummaryDocument = false,
  isTechnicalOnlyView = false,
  isBusy = false,
  onCreate,
  onReview,
  onSendToCustomer,
  onRegisterCustomerResponse,
  onGenerateDocument,
  onGenerateSummaryDocument
}: CalibrationServiceAdjustmentsPanelProps) => {
  const adjustments = service.adjustments || []
  const hasApprovedAdjustments = adjustments.some(
    (adjustment) => adjustment.status === 'approved'
  )
  const pendingCommercialAdjustments = adjustments.filter(isBlockingAdjustment)

  return (
    <Stack spacing={2.5}>
      {pendingCommercialAdjustments.length ? (
        <Alert severity='warning'>
          Hay {pendingCommercialAdjustments.length} desviación(es) pendiente(s)
          de revisión técnica, comercial o aceptación del cliente/calidad.
          Mientras sigan abiertas, el corte no podrá quedar listo para facturar.
        </Alert>
      ) : null}

      <Alert severity='info'>
        Las novedades registradas dejan trazabilidad de lo ocurrido en
        operación, pero no modifican el servicio formal ni los valores
        administrativos hasta completar la validación técnica, comercial y, si
        aplica, la aceptación del cliente/calidad.
      </Alert>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant='subtitle1' fontWeight={800}>
            Novedades de ejecución
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Registra diferencias entre lo cotizado y lo realmente recibido o
            ejecutado.
          </Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          {canGenerateSummaryDocument &&
          hasApprovedAdjustments &&
          onGenerateSummaryDocument ? (
            <Button
              variant='outlined'
              onClick={onGenerateSummaryDocument}
              disabled={isBusy}
            >
              Generar consolidado PDF
            </Button>
          ) : null}
          {canReport ? (
            <Button variant='contained' onClick={onCreate} disabled={isBusy}>
              Registrar novedad
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {adjustments.length ? (
        <Box
          sx={{
            overflowX: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Ítem</TableCell>
                <TableCell align='right'>Cotizado</TableCell>
                <TableCell align='right'>Real</TableCell>
                <TableCell align='right'>Diferencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Desviación</TableCell>
                <TableCell>Ajuste comercial</TableCell>
                {!isTechnicalOnlyView ? (
                  <TableCell align='right'>Impacto aprobado</TableCell>
                ) : null}
                <TableCell>Notas</TableCell>
                <TableCell align='right'>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adjustments.map((adjustment) => {
                const otherFields = getAdjustmentOtherFields(adjustment)
                const supportChannel = getTextField(
                  otherFields,
                  'supportChannel'
                )
                const supportReference = getTextField(
                  otherFields,
                  'supportReference'
                )
                const hasContractModification =
                  otherFields.contractModificationRequired !== false
                const hasTechnicalApproval =
                  otherFields.technicalDecision === 'approved'
                const hasTechnicalDecision = Boolean(
                  otherFields.technicalDecision
                )
                const canRunTechnicalReview =
                  canTechnicalReview &&
                  [
                    'reported',
                    'customer_changes_requested',
                    'customer_rejected'
                  ].includes(adjustment.status) &&
                  !hasTechnicalApproval
                const canRunCommercialReview =
                  canCommercialReview &&
                  adjustment.status === 'reported' &&
                  hasTechnicalApproval

                return (
                  <TableRow key={adjustment.id}>
                    <TableCell>
                      {
                        CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS[
                          adjustment.changeType
                        ]
                      }
                    </TableCell>
                    <TableCell>{adjustment.itemName}</TableCell>
                    <TableCell align='right'>
                      {adjustment.quotedQuantity}
                    </TableCell>
                    <TableCell align='right'>
                      {adjustment.actualQuantity}
                    </TableCell>
                    <TableCell align='right'>
                      {adjustment.differenceQuantity}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box>
                          <Chip
                            size='small'
                            color={
                              CALIBRATION_SERVICE_ADJUSTMENT_STATUS_COLORS[
                                adjustment.status
                              ]
                            }
                            label={
                              CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS[
                                adjustment.status
                              ]
                            }
                          />
                        </Box>
                        {[
                          'reported',
                          'pending_customer_approval',
                          'customer_changes_requested'
                        ].includes(adjustment.status) ? (
                          <Typography variant='caption' color='text.secondary'>
                            Aún no modifica el servicio formal.
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Stack spacing={0.5} alignItems='flex-start'>
                        <Chip
                          size='small'
                          variant='outlined'
                          label={`Mod. contrato: ${
                            hasContractModification ? 'Sí' : 'No'
                          }`}
                        />
                        <Typography variant='caption' color='text.secondary'>
                          Técnica: {getTechnicalDecisionLabel(otherFields)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Cliente/calidad:{' '}
                          {getCustomerAcceptanceLabel(adjustment)}
                        </Typography>
                        {supportChannel ? (
                          <Typography variant='caption' color='text.secondary'>
                            Aviso:{' '}
                            {SUPPORT_CHANNEL_LABELS[supportChannel] ||
                              supportChannel}
                            {supportReference ? ` · ${supportReference}` : ''}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {adjustment.requiresCommercialAdjustment ? 'Sí' : 'No'}
                    </TableCell>
                    {!isTechnicalOnlyView ? (
                      <TableCell align='right'>
                        {adjustment.approvedTotal !== null &&
                        adjustment.approvedTotal !== undefined
                          ? currencyFormatter.format(
                              toNumber(adjustment.approvedTotal)
                            )
                          : 'Pendiente'}
                      </TableCell>
                    ) : null}
                    <TableCell sx={{ minWidth: 240 }}>
                      {adjustment.technicalNotes ||
                        adjustment.commercialNotes ||
                        adjustment.description}
                    </TableCell>
                    <TableCell align='right'>
                      <Stack
                        direction='row'
                        spacing={1}
                        justifyContent='flex-end'
                        flexWrap='wrap'
                      >
                        {canRunTechnicalReview ? (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => onReview(adjustment, 'technical')}
                            disabled={isBusy}
                          >
                            Revisión técnica
                          </Button>
                        ) : null}
                        {canRunCommercialReview ? (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => onReview(adjustment, 'commercial')}
                            disabled={isBusy}
                          >
                            Revisión comercial
                          </Button>
                        ) : null}
                        {canTechnicalReview &&
                        hasTechnicalDecision &&
                        [
                          'customer_changes_requested',
                          'customer_rejected'
                        ].includes(adjustment.status) ? (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => onReview(adjustment, 'technical')}
                            disabled={isBusy}
                          >
                            Replantear
                          </Button>
                        ) : null}
                        {canCommercialReview &&
                        onSendToCustomer &&
                        adjustment.status === 'pending_customer_approval' ? (
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => onSendToCustomer(adjustment)}
                            disabled={isBusy}
                          >
                            Enviar al cliente
                          </Button>
                        ) : null}
                        {canCommercialReview &&
                        onRegisterCustomerResponse &&
                        adjustment.status === 'pending_customer_approval' ? (
                          <Button
                            size='small'
                            variant='text'
                            onClick={() =>
                              onRegisterCustomerResponse(adjustment)
                            }
                            disabled={isBusy}
                          >
                            Registrar respuesta
                          </Button>
                        ) : null}
                        {canGenerateDocument &&
                        onGenerateDocument &&
                        adjustment.status === 'approved' ? (
                          <Button
                            size='small'
                            variant='text'
                            onClick={() => onGenerateDocument(adjustment)}
                            disabled={isBusy}
                          >
                            Generar anexo PDF
                          </Button>
                        ) : null}
                        {!(
                          canRunTechnicalReview ||
                          canRunCommercialReview ||
                          (canTechnicalReview &&
                            [
                              'customer_changes_requested',
                              'customer_rejected'
                            ].includes(adjustment.status)) ||
                          (canCommercialReview &&
                            onSendToCustomer &&
                            adjustment.status ===
                              'pending_customer_approval') ||
                          (canCommercialReview &&
                            onRegisterCustomerResponse &&
                            adjustment.status ===
                              'pending_customer_approval') ||
                          (canGenerateDocument &&
                            onGenerateDocument &&
                            adjustment.status === 'approved')
                        )
                          ? 'Sin acción'
                          : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Alert severity='info'>
          Aún no se han registrado novedades de ejecución.
        </Alert>
      )}
    </Stack>
  )
}

export default CalibrationServiceAdjustmentsPanel
