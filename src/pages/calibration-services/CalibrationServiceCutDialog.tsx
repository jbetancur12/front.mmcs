import { ChangeEvent, useEffect, useState } from 'react'
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import {
  CalibrationService,
  CalibrationServiceCutType
} from '../../types/calibrationService'

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

const getEffectiveQuantity = (
  service: CalibrationService,
  item: CalibrationServiceCutDialogItem
) => {
  const approvedDelta = (service.adjustments || []).reduce(
    (accumulator, adjustment) => {
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
    },
    0
  )

  return Math.max((item.quantity || 0) + approvedDelta, 0)
}

// 3.2: con el servicio finalizado técnicamente el corte se propone ya armado: tipo final y todo lo pendiente por
// liberar marcado, para confirmarlo con un clic.
const buildDraftItems = (
  service: CalibrationService,
  preselectAll = false
): DraftCutItem[] =>
  (service.items || [])
    .filter((item) =>
      ['completed', 'in_progress'].includes(getOperationalStatus(item))
    )
    .map((item) => {
      const releasedQuantity = getReleasedQuantity(item)
      const effectiveQuantity = getEffectiveQuantity(service, item)
      const quantityAvailable = Math.max(
        effectiveQuantity - releasedQuantity,
        0
      )

      return {
        serviceItemId: item.id,
        itemName: item.itemName,
        instrumentName: item.instrumentName || 'Sin instrumento',
        quantityAvailable,
        selected: preselectAll && quantityAvailable > 0,
        quantity: preselectAll ? quantityAvailable : quantityAvailable > 0 ? 1 : 0
      }
    })
    .filter((item) => item.quantityAvailable > 0)

const getItemQuantityError = (item: DraftCutItem) => {
  if (!item.selected) {
    return ''
  }

  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    return 'La cantidad debe ser mayor o igual a 1.'
  }

  if (item.quantity > item.quantityAvailable) {
    return `La cantidad no puede superar lo disponible (${item.quantityAvailable}).`
  }

  return ''
}

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

  const isFinalProposal = service.status === 'technically_completed'

  useEffect(() => {
    if (open) {
      setCutType(isFinalProposal ? 'final' : 'partial')
      setNotes('')
      setDraftItems(buildDraftItems(service, isFinalProposal))
    }
  }, [open, service, isFinalProposal])

  const handleToggleItem =
    (serviceItemId: number) =>
    (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
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
      const nextQuantity = parseInt(event.target.value, 10)

      setDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.serviceItemId === serviceItemId
            ? {
                ...item,
                quantity: Number.isNaN(nextQuantity) ? 0 : nextQuantity
              }
            : item
        )
      )
    }

  const handleSubmit = async () => {
    const selectedItems = draftItems.filter((item) => item.selected)
    if (!selectedItems.length) {
      return
    }

    const hasInvalidQuantity = selectedItems.some((item) =>
      Boolean(getItemQuantityError(item))
    )

    if (hasInvalidQuantity) {
      return
    }

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

  const selectedItems = draftItems.filter((item) => item.selected)
  const hasInvalidQuantity = selectedItems.some((item) =>
    Boolean(getItemQuantityError(item))
  )
  const canSubmit =
    selectedItems.length > 0 && !hasInvalidQuantity && !isLoading

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={isFinalProposal ? 'Corte final propuesto' : 'Crear corte'}
      subtitle={
        isFinalProposal
          ? `${service.serviceCode} · todo lo pendiente por liberar ya está marcado`
          : service.serviceCode
      }
      submitLabel={isFinalProposal ? 'Confirmar corte final' : 'Crear corte'}
      onSubmit={() => void handleSubmit()}
      loading={isLoading}
      submitDisabled={!canSubmit}
      maxWidth='md'
    >
      <FormDialogSection title='Datos del corte'>
        <TextField
          select
          label='Tipo de corte'
          value={cutType}
          onChange={(event) =>
            setCutType(event.target.value as CalibrationServiceCutType)
          }
        >
          <MenuItem value='partial'>Parcial</MenuItem>
          <MenuItem value='final'>Final</MenuItem>
        </TextField>
        <TextField
          label='Notas del corte'
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </FormDialogSection>

      <FormDialogSection
        title='Ítems a liberar'
        description='Marca los ítems con avance que entran en este corte.'
      >
        {draftItems.length ? (
          <Stack spacing={1} sx={{ gridColumn: { sm: '1 / -1' } }}>
            {draftItems.map((item) => {
              const quantityError = getItemQuantityError(item)
              return (
                <Box
                  key={item.serviceItemId}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      sm: 'minmax(0, 1fr) 110px 160px'
                    },
                    alignItems: 'start',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: item.selected ? '#00BFA5' : '#e5e7eb',
                    bgcolor: item.selected ? '#E0F7F4' : '#fff',
                    borderRadius: '12px'
                  }}
                >
                  <FormControlLabel
                    sx={{ m: 0, alignItems: 'flex-start' }}
                    control={
                      <Checkbox
                        checked={item.selected}
                        onChange={handleToggleItem(item.serviceItemId)}
                        sx={{
                          p: 0.5,
                          mr: 0.5,
                          '&.Mui-checked': { color: '#00BFA5' }
                        }}
                      />
                    }
                    label={
                      <>
                        <Typography variant='body2' fontWeight={600}>
                          {item.itemName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {item.instrumentName}
                        </Typography>
                      </>
                    }
                  />
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ pt: 0.75 }}
                  >
                    Disponible: <strong>{item.quantityAvailable}</strong>
                  </Typography>
                  <TextField
                    size='small'
                    type='number'
                    label='Cantidad a liberar'
                    value={item.quantity}
                    onChange={handleQuantityChange(item.serviceItemId)}
                    disabled={!item.selected}
                    error={Boolean(quantityError)}
                    helperText={quantityError || ' '}
                    inputProps={{ min: 1, max: item.quantityAvailable }}
                  />
                </Box>
              )
            })}
          </Stack>
        ) : (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ gridColumn: { sm: '1 / -1' } }}
          >
            No hay ítems con avance y cantidad disponible para liberar a corte.
          </Typography>
        )}
      </FormDialogSection>
    </FormDialog>
  )
}

export default CalibrationServiceCutDialog
