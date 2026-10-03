import { ChangeEvent, useEffect, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import {
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  CalibrationService,
  CalibrationServiceItemProgressEntryPayload,
  CalibrationServiceOperationalItemStatus,
  CalibrationServiceOperationsSummary
} from '../../types/calibrationService'

type CalibrationServiceOperationalItem = NonNullable<
  CalibrationService['items']
>[number]

const OPERATIONAL_STATUS_OPTIONS: CalibrationServiceOperationalItemStatus[] = [
  'pending',
  'scheduled',
  'in_progress',
  'completed'
]

const getOperationsSummary = (
  otherFields: Record<string, unknown> | undefined
): CalibrationServiceOperationsSummary => {
  const operations = otherFields?.operations
  return operations && typeof operations === 'object' && !Array.isArray(operations)
    ? (operations as CalibrationServiceOperationsSummary)
    : {}
}

const getItemStatus = (
  item: CalibrationServiceOperationalItem
): CalibrationServiceOperationalItemStatus => {
  const operationalStatus = item.otherFields?.operationalStatus
  return typeof operationalStatus === 'string' &&
    OPERATIONAL_STATUS_OPTIONS.includes(
      operationalStatus as CalibrationServiceOperationalItemStatus
    )
    ? (operationalStatus as CalibrationServiceOperationalItemStatus)
    : 'pending'
}

const getItemText = (
  item: CalibrationServiceOperationalItem,
  field: 'technicalNotes'
) => {
  const value = item.otherFields?.[field]
  return typeof value === 'string' ? value : ''
}

const getReleasedQuantity = (item: CalibrationServiceOperationalItem) => {
  const value = item.otherFields?.releasedQuantity

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return parseInt(value, 10) || 0
  }

  return 0
}

const getExecutedQuantity = (
  item: CalibrationServiceOperationalItem,
  effectiveQuantity: number
) => {
  const stored = Number(item.otherFields?.executedQuantity)
  const recorded = Number.isFinite(stored)
    ? stored
    : getItemStatus(item) === 'completed'
      ? effectiveQuantity
      : 0

  return Math.min(Math.max(recorded, getReleasedQuantity(item)), effectiveQuantity)
}

const getEffectiveQuantity = (
  service: CalibrationService,
  item: CalibrationServiceOperationalItem
) => {
  const approvedDelta = (service.adjustments || []).reduce((accumulator, adjustment) => {
    if (adjustment.serviceItemId !== item.id) {
      return accumulator
    }

    if (!['approved', 'applied_to_cut', 'customer_approved', 'tacitly_accepted'].includes(adjustment.status)) {
      return accumulator
    }

    if (adjustment.changeType === 'extra_item') {
      return accumulator
    }

    return accumulator + (adjustment.differenceQuantity || 0)
  }, 0)

  return Math.max((item.quantity || 0) + approvedDelta, 0)
}

interface CalibrationServiceOperationsPanelProps {
  service: CalibrationService
  canEditProgress: boolean
  isBusy?: boolean
  onSaveProgress: (
    items: CalibrationServiceItemProgressEntryPayload[]
  ) => boolean | void | Promise<boolean | void>
  deliveryName?: string | null
  deliveryRole?: string | null
  deliverySignatureData?: string | null
  onUpdateDeliverySignature?: (data: {
    deliveryName: string | null
    deliveryRole: string | null
    deliverySignatureData: string | null
  }) => void | Promise<void>
  isUpdatingDeliverySignature?: boolean
  onGenerateProgressPdf?: () => void | Promise<void>
  isGeneratingProgressPdf?: boolean
}

const CalibrationServiceOperationsPanel = ({
  service,
  canEditProgress,
  isBusy = false,
  onSaveProgress,
  deliveryName: initialDeliveryName,
  deliveryRole: initialDeliveryRole,
  deliverySignatureData: initialDeliverySignatureData,
  onUpdateDeliverySignature,
  isUpdatingDeliverySignature = false,
  onGenerateProgressPdf,
  isGeneratingProgressPdf = false
}: CalibrationServiceOperationsPanelProps) => {
  const operations = getOperationsSummary(service.otherFields)
  const [deliveryName, setDeliveryName] = useState(initialDeliveryName ?? '')
  const [deliveryRole, setDeliveryRole] = useState(initialDeliveryRole ?? '')
  const [deliverySignature, setDeliverySignature] = useState<string | null>(
    initialDeliverySignatureData ?? null
  )
  const hasDeliveryChanged =
    deliveryName !== (initialDeliveryName ?? '') ||
    deliveryRole !== (initialDeliveryRole ?? '') ||
    deliverySignature !== (initialDeliverySignatureData ?? null)
  const pendingFormalAdjustments = (service.adjustments || []).filter(
    (adjustment) =>
      adjustment.requiresCommercialAdjustment &&
      ['reported', 'pending_customer_approval', 'customer_changes_requested'].includes(
        adjustment.status
      )
  )
  const [draftItems, setDraftItems] = useState<
    CalibrationServiceItemProgressEntryPayload[]
  >([])

  const buildSavedItems = (): CalibrationServiceItemProgressEntryPayload[] =>
    (service.items || []).map((item) => ({
        itemId: item.id,
        operationalStatus: getItemStatus(item),
        technicalNotes: getItemText(item, 'technicalNotes'),
        executedQuantity: getExecutedQuantity(
          item,
          getEffectiveQuantity(service, item)
        ),
        scheduledFor:
          typeof item.otherFields?.scheduledFor === 'string'
            ? item.otherFields.scheduledFor.slice(0, 10)
            : null,
        startedAt:
          typeof item.otherFields?.startedAt === 'string'
            ? item.otherFields.startedAt
            : null,
        completedAt:
          typeof item.otherFields?.completedAt === 'string'
            ? item.otherFields.completedAt
            : null
    }))

  useEffect(() => {
    setDraftItems(buildSavedItems())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.items, service.adjustments])

  const hasUnsavedChanges =
    JSON.stringify(draftItems) !== JSON.stringify(buildSavedItems())

  const handleItemChange =
    (
      itemId: number,
      field: keyof CalibrationServiceItemProgressEntryPayload
    ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                [field]: event.target.value
              }
            : item
        )
      )
    }

  const handleExecutedChange =
    (itemId: number, maxQuantity: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10)
      const executedQuantity = Number.isNaN(parsed)
        ? 0
        : Math.min(Math.max(parsed, 0), maxQuantity)

      setDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.itemId === itemId ? { ...item, executedQuantity } : item
        )
      )
    }

  const handleStatusChange =
    (itemId: number, effectiveQuantity: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const operationalStatus = event.target
        .value as CalibrationServiceOperationalItemStatus

      setDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                operationalStatus,
                executedQuantity:
                  operationalStatus === 'completed'
                    ? effectiveQuantity
                    : item.executedQuantity
              }
            : item
        )
      )
    }

  const handleSave = async () => {
    await onSaveProgress(draftItems)
  }

  const handleGeneratePdf = async () => {
    if (canEditProgress && hasUnsavedChanges) {
      const saved = await onSaveProgress(draftItems)
      if (saved === false) {
        return
      }
    }
    await onGenerateProgressPdf?.()
  }

  return (
    <Stack spacing={3}>
      {pendingFormalAdjustments.length ? (
        <Alert severity='info'>
          Hay {pendingFormalAdjustments.length} novedad(es) pendientes de validación
          comercial o cliente. En operación puedes registrar lo ocurrido técnicamente,
          pero el servicio formal solo cambia cuando esas novedades queden aprobadas.
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Metrólogos asignados
          </Typography>
          <Typography variant='body1'>
            {(() => {
              const metrologists: any = operations.assignedMetrologists
              if (Array.isArray(metrologists) && metrologists.length > 0) {
                return metrologists.map((m: any) => m.name).join(', ')
              }
              return operations.assignedMetrologistName || 'Sin asignar'
            })()}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Fecha compromiso
          </Typography>
          <Typography variant='body1'>
            {operations.commitmentDate
              ? new Date(operations.commitmentDate).toLocaleDateString('es-CO')
              : 'Sin registrar'}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Fecha programada
          </Typography>
          <Typography variant='body1'>
            {operations.scheduledDate
              ? new Date(operations.scheduledDate).toLocaleDateString('es-CO')
              : 'Sin registrar'}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Responsable operativo
          </Typography>
          <Typography variant='body1'>
            {operations.operationalResponsibleName || 'Sin registrar'}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Rol del responsable
          </Typography>
          <Typography variant='body1'>
            {operations.operationalResponsibleRole || 'Sin registrar'}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Inicio de ejecución
          </Typography>
          <Typography variant='body1'>
            {operations.startedAt
              ? new Date(operations.startedAt).toLocaleString('es-CO')
              : 'Pendiente'}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant='caption' color='text.secondary'>
            Estado actual
          </Typography>
          <Box mt={0.5}>
            <Chip
              size='small'
              color='primary'
              label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]}
            />
          </Box>
        </Grid>
        {operations.programmingNotes ? (
          <Grid item xs={12}>
            <Typography variant='caption' color='text.secondary'>
              Notas de programación
            </Typography>
            <Typography variant='body1'>{operations.programmingNotes}</Typography>
          </Grid>
        ) : null}
        {operations.executionNotes ? (
          <Grid item xs={12}>
            <Typography variant='caption' color='text.secondary'>
              Notas de ejecución
            </Typography>
            <Typography variant='body1'>{operations.executionNotes}</Typography>
          </Grid>
        ) : null}
      </Grid>

      <Stack direction='row' spacing={0.5} alignItems='center'>
        <Typography variant='subtitle2' fontWeight={600}>
          Avance técnico por ítem
        </Typography>
        <Tooltip
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={8000}
          title={
            <Box sx={{ p: 0.5 }}>
              <Typography variant='caption' component='div' fontWeight={700}>
                ¿Cómo usar el avance técnico?
              </Typography>
              <Typography variant='caption' component='div'>
                1. Cambia el <strong>Estado técnico</strong> de cada ítem
                (programado, en proceso o completado).
              </Typography>
              <Typography variant='caption' component='div'>
                2. En <strong>Ejecutado</strong> escribe cuántas unidades ya
                se hicieron. Al marcar Completado se llena con el total.
              </Typography>
              <Typography variant='caption' component='div'>
                3. Agrega las <strong>Notas técnicas</strong> si hace falta.
                Puedes guardar con <strong>Guardar avance técnico</strong>.
              </Typography>
              <Typography variant='caption' component='div'>
                4. Pulsa <strong>Generar anexo de avance técnico</strong> para
                descargar el PDF con lo ofertado, lo ejecutado y lo pendiente.
                Si hay cambios sin guardar, se guardan automáticamente antes
                de generarlo. Queda en los documentos del servicio como
                soporte para el cliente.
              </Typography>
              <Typography variant='caption' component='div' sx={{ mt: 0.5 }}>
                «Liberado a corte» es lo ya incluido en cortes.
              </Typography>
            </Box>
          }
        >
          <IconButton size='small' aria-label='Cómo usar el avance técnico'>
            <InfoOutlinedIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Stack>

      {service.items?.length ? (
        <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Ítem</TableCell>
                <TableCell>Puntos de calibración</TableCell>
                <TableCell align='right'>Cant.</TableCell>
                <TableCell align='right'>Ejecutado</TableCell>
                <TableCell align='right'>Pendiente</TableCell>
                <TableCell align='right'>Liberado a corte</TableCell>
                <TableCell>Estado técnico</TableCell>
                <TableCell>Notas técnicas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {service.items.map((item) => {
                const draftItem = draftItems.find(
                  (draftItem) => draftItem.itemId === item.id
                )
                const releasedQuantity = getReleasedQuantity(item)
                const effectiveQuantity = getEffectiveQuantity(service, item)
                const executedQuantity = Math.max(
                  Math.min(
                    draftItem?.executedQuantity ?? 0,
                    effectiveQuantity
                  ),
                  releasedQuantity
                )
                const pendingQuantity = Math.max(
                  effectiveQuantity - executedQuantity,
                  0
                )

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>
                      {item.otherFields?.hasCalibrationPoints !== false
                        ? [
                            item.otherFields?.calibrationPointCount ? `Cantidad puntos: ${item.otherFields.calibrationPointCount}` : '',
                            item.otherFields?.measurementRange ? `Rango medición: ${item.otherFields.measurementRange}` : ''
                          ].filter(Boolean).join(' · ') || 'Sin registrar'
                        : 'No aplica'}
                    </TableCell>
                    <TableCell align='right'>{effectiveQuantity}</TableCell>
                    <TableCell align='right' sx={{ minWidth: 100 }}>
                      {canEditProgress ? (
                        <TextField
                          size='small'
                          type='number'
                          value={executedQuantity}
                          onChange={handleExecutedChange(
                            item.id,
                            effectiveQuantity
                          )}
                          inputProps={{
                            min: releasedQuantity,
                            max: effectiveQuantity,
                            style: { textAlign: 'right' }
                          }}
                        />
                      ) : (
                        executedQuantity
                      )}
                    </TableCell>
                    <TableCell align='right'>{pendingQuantity}</TableCell>
                    <TableCell align='right'>{releasedQuantity}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {canEditProgress ? (
                        <TextField
                          select
                          fullWidth
                          size='small'
                          value={draftItem?.operationalStatus || 'pending'}
                          onChange={handleStatusChange(item.id, effectiveQuantity)}
                        >
                          {OPERATIONAL_STATUS_OPTIONS.map((statusOption) => (
                            <MenuItem key={statusOption} value={statusOption}>
                              {CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS[
                                statusOption
                              ]}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS[
                          draftItem?.operationalStatus || 'pending'
                        ]
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      {canEditProgress ? (
                        <TextField
                          fullWidth
                          size='small'
                          multiline
                          minRows={2}
                          value={draftItem?.technicalNotes || ''}
                          onChange={handleItemChange(item.id, 'technicalNotes')}
                          placeholder='Observaciones técnicas del ítem'
                        />
                      ) : (
                        draftItem?.technicalNotes || 'Sin notas'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Alert severity='info'>Aún no hay ítems para gestionar operativamente.</Alert>
      )}

      {canEditProgress || onGenerateProgressPdf ? (
        <Stack direction='row' spacing={1} justifyContent='flex-end'>
          {onGenerateProgressPdf && service.items?.length ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfIcon />}
              onClick={() => void handleGeneratePdf()}
              disabled={isGeneratingProgressPdf || isBusy}
            >
              Generar anexo de avance técnico
            </Button>
          ) : null}
          {canEditProgress ? (
            <Button variant='contained' onClick={() => void handleSave()} disabled={isBusy}>
              Guardar avance técnico
            </Button>
          ) : null}
        </Stack>
      ) : null}

      <Accordion
        variant='outlined'
        slotProps={{ transition: { unmountOnExit: true } }}
        sx={{
          '&:before': { display: 'none' },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant='body2' fontWeight={600}>
            Recepción conforme del servicio
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography variant='caption' color='text.secondary'>
              Datos de la persona que recibe el servicio a satisfacción. Aparecen
              en la Orden de Servicio (ODS) como constancia de recibido.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Nombre de quien recibe'
                  value={deliveryName}
                  onChange={(e) => setDeliveryName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Cargo'
                  value={deliveryRole}
                  onChange={(e) => setDeliveryRole(e.target.value)}
                />
              </Grid>
            </Grid>
            <SignaturePad
              value={deliverySignature}
              onChange={setDeliverySignature}
              height={160}
              helperText='Firma de recepción conforme del servicio.'
            />
            <Stack direction='row' spacing={1} justifyContent='flex-end'>
              <Button
                size='small'
                variant='outlined'
                onClick={() => {
                  setDeliveryName(initialDeliveryName ?? '')
                  setDeliveryRole(initialDeliveryRole ?? '')
                  setDeliverySignature(initialDeliverySignatureData ?? null)
                }}
                disabled={isUpdatingDeliverySignature}
              >
                Cancelar
              </Button>
              <Button
                size='small'
                variant='contained'
                onClick={() =>
                  onUpdateDeliverySignature?.({
                    deliveryName: deliveryName.trim() || null,
                    deliveryRole: deliveryRole.trim() || null,
                    deliverySignatureData: deliverySignature
                  })
                }
                disabled={!hasDeliveryChanged || isUpdatingDeliverySignature}
              >
                Guardar recepción conforme
              </Button>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}

export default CalibrationServiceOperationsPanel
