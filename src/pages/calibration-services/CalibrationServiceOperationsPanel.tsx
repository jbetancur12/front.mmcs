import { ChangeEvent, useEffect, useState } from 'react'
import {
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
}

const CalibrationServiceOperationsPanel = ({
  service,
  canEditProgress,
  isBusy = false,
  onSaveProgress
}: CalibrationServiceOperationsPanelProps) => {
  const operations = getOperationsSummary(service.otherFields)
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
        <Box sx={{ overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Ítem</TableCell>
                <TableCell>Instrumento</TableCell>
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
                    <TableCell>{item.instrumentName || 'Sin registrar'}</TableCell>
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
    </Stack>
  )
}

export default CalibrationServiceOperationsPanel
