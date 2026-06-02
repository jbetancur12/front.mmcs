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
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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

const getEffectiveQuantity = (
  service: CalibrationService,
  item: CalibrationServiceOperationalItem
) => {
  const approvedDelta = (service.adjustments || []).reduce((accumulator, adjustment) => {
    if (adjustment.serviceItemId !== item.id) {
      return accumulator
    }

    if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
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
  ) => void | Promise<void>
  deliveryName?: string | null
  deliveryRole?: string | null
  deliverySignatureData?: string | null
  onUpdateDeliverySignature?: (data: {
    deliveryName: string | null
    deliveryRole: string | null
    deliverySignatureData: string | null
  }) => void | Promise<void>
  isUpdatingDeliverySignature?: boolean
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
  isUpdatingDeliverySignature = false
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

  useEffect(() => {
    setDraftItems(
      (service.items || []).map((item) => ({
        itemId: item.id,
        operationalStatus: getItemStatus(item),
        technicalNotes: getItemText(item, 'technicalNotes'),
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
    )
  }, [service.items])

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

  const handleSave = async () => {
    await onSaveProgress(draftItems)
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

      {service.items?.length ? (
        <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Ítem</TableCell>
                <TableCell>Puntos de calibración</TableCell>
                <TableCell align='right'>Cant.</TableCell>
                <TableCell align='right'>Liberado</TableCell>
                <TableCell align='right'>Disponible</TableCell>
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
                const availableQuantity = Math.max(
                  effectiveQuantity - releasedQuantity,
                  0
                )

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>
                      {item.otherFields?.hasCalibrationPoints
                        ? [
                            item.otherFields?.calibrationPointCount ? `Cantidad puntos: ${item.otherFields.calibrationPointCount}` : '',
                            item.otherFields?.measurementRange ? `Rango medición: ${item.otherFields.measurementRange}` : ''
                          ].filter(Boolean).join(' · ') || 'Sin registrar'
                        : 'No aplica'}
                    </TableCell>
                    <TableCell align='right'>{effectiveQuantity}</TableCell>
                    <TableCell align='right'>{releasedQuantity}</TableCell>
                    <TableCell align='right'>{availableQuantity}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {canEditProgress ? (
                        <TextField
                          select
                          fullWidth
                          size='small'
                          value={draftItem?.operationalStatus || 'pending'}
                          onChange={handleItemChange(item.id, 'operationalStatus')}
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

      {canEditProgress ? (
        <Stack direction='row' justifyContent='flex-end'>
          <Button variant='contained' onClick={() => void handleSave()} disabled={isBusy}>
            Guardar avance técnico
          </Button>
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
