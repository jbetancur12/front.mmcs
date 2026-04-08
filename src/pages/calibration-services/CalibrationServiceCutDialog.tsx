import { ChangeEvent, useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CalibrationService, CalibrationServiceCutType } from '../../types/calibrationService'

type CalibrationServiceCutDialogItem = NonNullable<
  CalibrationService['items']
>[number]

interface DraftCutItem {
  serviceItemId: number
  itemName: string
  instrumentName: string
  quantityAvailable: number
  selected: boolean
  quantity: number
}

interface CalibrationServiceCutDialogProps {
  open: boolean
  service: CalibrationService
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    cutType: CalibrationServiceCutType
    notes: string
    items: Array<{ serviceItemId: number; quantity: number }>
  }) => void | Promise<void>
}

const getReleasedQuantity = (item: CalibrationServiceCutDialogItem) => {
  const value = item.otherFields?.releasedQuantity
  return typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? parseInt(value, 10) || 0
      : 0
}

const getOperationalStatus = (item: CalibrationServiceCutDialogItem) =>
  typeof item.otherFields?.operationalStatus === 'string'
    ? item.otherFields.operationalStatus
    : 'pending'

const buildDraftItems = (service: CalibrationService): DraftCutItem[] =>
  (service.items || [])
    .filter((item) => getOperationalStatus(item) === 'completed')
    .map((item) => {
      const releasedQuantity = getReleasedQuantity(item)
      const quantityAvailable = Math.max((item.quantity || 0) - releasedQuantity, 0)

      return {
        serviceItemId: item.id,
        itemName: item.itemName,
        instrumentName: item.instrumentName || 'Sin instrumento',
        quantityAvailable,
        selected: false,
        quantity: quantityAvailable > 0 ? 1 : 0
      }
    })
    .filter((item) => item.quantityAvailable > 0)

const CalibrationServiceCutDialog = ({
  open,
  service,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceCutDialogProps) => {
  const [cutType, setCutType] = useState<CalibrationServiceCutType>('partial')
  const [notes, setNotes] = useState('')
  const [draftItems, setDraftItems] = useState<DraftCutItem[]>([])

  useEffect(() => {
    if (open) {
      setCutType('partial')
      setNotes('')
      setDraftItems(buildDraftItems(service))
    }
  }, [open, service])

  const handleToggleItem =
    (serviceItemId: number) => (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.serviceItemId === serviceItemId
            ? { ...item, selected: checked }
            : item
        )
      )
    }

  const handleQuantityChange =
    (serviceItemId: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuantity = parseInt(event.target.value, 10) || 0

      setDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.serviceItemId === serviceItemId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(nextQuantity, item.quantityAvailable))
              }
            : item
        )
      )
    }

  const handleSubmit = async () => {
    const items = draftItems
      .filter((item) => item.selected)
      .map((item) => ({
        serviceItemId: item.serviceItemId,
        quantity: item.quantity
      }))

    await onSubmit({
      cutType,
      notes,
      items
    })
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Crear corte</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Selecciona los ítems completados que van a salir en este corte.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Tipo de corte'
                value={cutType}
                onChange={(event) =>
                  setCutType(event.target.value as CalibrationServiceCutType)
                }
              >
                <MenuItem value='partial'>Parcial</MenuItem>
                <MenuItem value='final'>Final</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label='Notas del corte'
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Grid>
          </Grid>

          <Stack spacing={1.5}>
            {draftItems.length ? (
              draftItems.map((item) => (
                <Grid container spacing={2} alignItems='center' key={item.serviceItemId}>
                  <Grid item xs={12} md={5}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.selected}
                          onChange={handleToggleItem(item.serviceItemId)}
                        />
                      }
                      label={`${item.itemName} · ${item.instrumentName}`}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant='body2' color='text.secondary'>
                      Disponible: {item.quantityAvailable}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Cantidad a liberar'
                      value={item.quantity}
                      onChange={handleQuantityChange(item.serviceItemId)}
                      disabled={!item.selected}
                      inputProps={{
                        min: 1,
                        max: item.quantityAvailable
                      }}
                    />
                  </Grid>
                </Grid>
              ))
            ) : (
              <Typography variant='body2' color='text.secondary'>
                No hay ítems completados con cantidad disponible para liberar a corte.
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={() => void handleSubmit()} disabled={isLoading}>
          Crear corte
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceCutDialog
