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
  canReview: boolean
  canGenerateDocument?: boolean
  isTechnicalOnlyView?: boolean
  isBusy?: boolean
  onCreate: () => void
  onReview: (adjustment: CalibrationServiceAdjustment) => void
  onGenerateDocument?: (adjustment: CalibrationServiceAdjustment) => void
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

const CalibrationServiceAdjustmentsPanel = ({
  service,
  canReport,
  canReview,
  canGenerateDocument = false,
  isTechnicalOnlyView = false,
  isBusy = false,
  onCreate,
  onReview,
  onGenerateDocument
}: CalibrationServiceAdjustmentsPanelProps) => {
  const adjustments = service.adjustments || []
  const pendingCommercialAdjustments = adjustments.filter(
    (adjustment) =>
      adjustment.requiresCommercialAdjustment && adjustment.status === 'reported'
  )

  return (
    <Stack spacing={2.5}>
      {pendingCommercialAdjustments.length ? (
        <Alert severity='warning'>
          Hay {pendingCommercialAdjustments.length} novedad(es) con impacto económico pendiente.
          Mientras sigan reportadas, el corte no podrá quedar listo para facturar.
        </Alert>
      ) : null}

      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Box>
          <Typography variant='subtitle1' fontWeight={700}>
            Novedades de ejecución
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Registra diferencias entre lo cotizado y lo realmente recibido o ejecutado.
          </Typography>
        </Box>
        {canReport ? (
          <Button variant='contained' onClick={onCreate} disabled={isBusy}>
            Registrar novedad
          </Button>
        ) : null}
      </Stack>

      {adjustments.length ? (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Ítem</TableCell>
                <TableCell align='right'>Cotizado</TableCell>
                <TableCell align='right'>Real</TableCell>
                <TableCell align='right'>Diferencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Ajuste comercial</TableCell>
                {!isTechnicalOnlyView ? (
                  <TableCell align='right'>Impacto aprobado</TableCell>
                ) : null}
                <TableCell>Notas</TableCell>
                <TableCell align='right'>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell>
                    {CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS[adjustment.changeType]}
                  </TableCell>
                  <TableCell>{adjustment.itemName}</TableCell>
                  <TableCell align='right'>{adjustment.quotedQuantity}</TableCell>
                  <TableCell align='right'>{adjustment.actualQuantity}</TableCell>
                  <TableCell align='right'>{adjustment.differenceQuantity}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      color={
                        CALIBRATION_SERVICE_ADJUSTMENT_STATUS_COLORS[adjustment.status]
                      }
                      label={
                        CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS[adjustment.status]
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {adjustment.requiresCommercialAdjustment ? 'Sí' : 'No'}
                  </TableCell>
                  {!isTechnicalOnlyView ? (
                    <TableCell align='right'>
                      {adjustment.approvedTotal !== null &&
                      adjustment.approvedTotal !== undefined
                        ? currencyFormatter.format(toNumber(adjustment.approvedTotal))
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
                      {canReview && adjustment.status === 'reported' ? (
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => onReview(adjustment)}
                          disabled={isBusy}
                        >
                          Revisar
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
                        (canReview && adjustment.status === 'reported') ||
                        (canGenerateDocument &&
                          onGenerateDocument &&
                          adjustment.status === 'approved')
                      )
                        ? 'Sin acción'
                        : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Alert severity='info'>Aún no se han registrado novedades de ejecución.</Alert>
      )}
    </Stack>
  )
}

export default CalibrationServiceAdjustmentsPanel
