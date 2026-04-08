import { useEffect, useMemo, useState } from 'react'
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
import { CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS } from '../../constants/calibrationServices'
import {
  CalibrationService,
  CalibrationServiceAdjustmentType
} from '../../types/calibrationService'

interface CalibrationServiceAdjustmentDialogProps {
  open: boolean
  service: CalibrationService
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    serviceItemId?: number | null
    changeType: CalibrationServiceAdjustmentType
    itemName?: string | null
    quotedQuantity?: number
    actualQuantity: number
    description: string
    technicalNotes?: string | null
    requiresCommercialAdjustment: boolean
  }) => void | Promise<void>
}

const DEFAULT_TYPE: CalibrationServiceAdjustmentType = 'quantity_more'

const CalibrationServiceAdjustmentDialog = ({
  open,
  service,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentDialogProps) => {
  const completedItems = useMemo(
    () =>
      (service.items || []).filter(
        (item) => item.otherFields?.operationalStatus === 'completed'
      ),
    [service.items]
  )

  const [serviceItemId, setServiceItemId] = useState<string>('')
  const [changeType, setChangeType] =
    useState<CalibrationServiceAdjustmentType>(DEFAULT_TYPE)
  const [itemName, setItemName] = useState('')
  const [quotedQuantity, setQuotedQuantity] = useState('0')
  const [actualQuantity, setActualQuantity] = useState('1')
  const [description, setDescription] = useState('')
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [requiresCommercialAdjustment, setRequiresCommercialAdjustment] =
    useState(true)

  useEffect(() => {
    if (!open) {
      return
    }

    setServiceItemId('')
    setChangeType(DEFAULT_TYPE)
    setItemName('')
    setQuotedQuantity('0')
    setActualQuantity('1')
    setDescription('')
    setTechnicalNotes('')
    setRequiresCommercialAdjustment(true)
  }, [open])

  useEffect(() => {
    const selectedItem = completedItems.find(
      (item) => String(item.id) === serviceItemId
    )

    if (selectedItem) {
      setItemName(selectedItem.itemName)
      setQuotedQuantity(String(selectedItem.quantity || 0))
      setActualQuantity(String(selectedItem.quantity || 0))
    } else if (changeType === 'extra_item') {
      setQuotedQuantity('0')
      setActualQuantity('1')
    }
  }, [completedItems, serviceItemId, changeType])

  const isExtraItem = changeType === 'extra_item'
  const canSubmit =
    actualQuantity.trim() &&
    description.trim().length >= 5 &&
    (isExtraItem || serviceItemId || itemName.trim())

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    await onSubmit({
      serviceItemId: serviceItemId ? Number(serviceItemId) : null,
      changeType,
      itemName: itemName.trim() || null,
      quotedQuantity: Number(quotedQuantity || '0'),
      actualQuantity: Number(actualQuantity || '0'),
      description: description.trim(),
      technicalNotes: technicalNotes.trim() || null,
      requiresCommercialAdjustment
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Registrar novedad de ejecución</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            Registra aquí diferencias entre lo cotizado y lo realmente recibido o ejecutado.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label='Tipo de novedad'
                value={changeType}
                onChange={(event) =>
                  setChangeType(event.target.value as CalibrationServiceAdjustmentType)
                }
              >
                {Object.entries(CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label='Ítem cotizado relacionado'
                value={serviceItemId}
                onChange={(event) => setServiceItemId(event.target.value)}
                helperText='Usa este campo cuando la novedad afecta un ítem ya cotizado.'
              >
                <MenuItem value=''>Sin item relacionado</MenuItem>
                {completedItems.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.itemName} · Cant. {item.quantity}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label='Nombre del ítem real'
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                disabled={Boolean(serviceItemId)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='number'
                label='Cotizado'
                value={quotedQuantity}
                onChange={(event) => setQuotedQuantity(event.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='number'
                label='Real'
                value={actualQuantity}
                onChange={(event) => setActualQuantity(event.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Descripción'
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Observación técnica'
                value={technicalNotes}
                onChange={(event) => setTechnicalNotes(event.target.value)}
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requiresCommercialAdjustment}
                    onChange={(event) =>
                      setRequiresCommercialAdjustment(event.target.checked)
                    }
                  />
                }
                label='Esta novedad requiere ajuste comercial o valoración para facturar'
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || isLoading}
        >
          Guardar novedad
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentDialog
