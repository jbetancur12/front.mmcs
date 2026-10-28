import { ChangeEvent, useEffect, useState } from 'react'
import {
  Alert,
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
  CalibrationServiceCut,
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
  /** Si viene, el diálogo edita ese corte en borrador en vez de crear uno nuevo. */
  editingCut?: CalibrationServiceCut | null
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    cutType: CalibrationServiceCutType
    notes: string
    items: Array<{ serviceItemId: number; quantity: number }>
    reason?: string
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
  preselectAll = false,
  editingCut: CalibrationServiceCut | null = null
): DraftCutItem[] =>
  (service.items || [])
    .filter((item) =>
      ['completed', 'in_progress'].includes(getOperationalStatus(item))
    )
    .map((item) => {
      const releasedQuantity = getReleasedQuantity(item)
      const effectiveQuantity = getEffectiveQuantity(service, item)
      // Al editar, lo que este corte ya tenía liberado vuelve a contar como disponible
      const inCut = editingCut?.items?.find(
        (cutItem) => cutItem.serviceItemId === item.id
      )
      const quantityAvailable = Math.max(
        effectiveQuantity - releasedQuantity + (Number(inCut?.quantity) || 0),
        0
      )

      return {
        serviceItemId: item.id,
        itemName: item.itemName,
        instrumentName: item.instrumentName || 'Sin instrumento',
        quantityAvailable,
        selected: inCut ? true : preselectAll && quantityAvailable > 0,
        quantity: inCut
          ? Number(inCut.quantity) || 1
          : preselectAll
            ? quantityAvailable
            : quantityAvailable > 0
              ? 1
              : 0
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
  editingCut = null,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceCutDialogProps) => {
  const [cutType, setCutType] = useState<CalibrationServiceCutType>('partial')
  const [notes, setNotes] = useState('')
  const [draftItems, setDraftItems] = useState<DraftCutItem[]>([])
  const [reason, setReason] = useState('')

  const isFinalProposal = service.status === 'technically_completed'

  useEffect(() => {
    if (open) {
      setCutType(
        editingCut ? editingCut.cutType : isFinalProposal ? 'final' : 'partial'
      )
      setNotes(editingCut?.notes || '')
      setReason('')
      setDraftItems(
        buildDraftItems(service, !editingCut && isFinalProposal, editingCut)
      )
    }
  }, [open, service, isFinalProposal, editingCut])

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
      cutType: cutType === 'final' && !releasesEverything ? 'partial' : cutType,
      notes,
      items,
      ...(editingCut ? { reason: reason.trim() } : {})
    })
  }

  const selectedItems = draftItems.filter((item) => item.selected)
  const hasInvalidQuantity = selectedItems.some((item) =>
    Boolean(getItemQuantityError(item))
  )
  // Un corte "final" que deja algo por liberar no es final: se guarda como parcial y se avisa antes
  const releasesEverything = draftItems.every(
    (item) =>
      item.quantityAvailable === 0 ||
      (item.selected && item.quantity === item.quantityAvailable)
  )
  const willBePartial = cutType === 'final' && !releasesEverything
  const canSubmit =
    selectedItems.length > 0 &&
    !hasInvalidQuantity &&
    !isLoading &&
    (!editingCut || reason.trim().length >= 5)

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={
        editingCut
          ? 'Editar corte'
          : isFinalProposal
            ? 'Corte final propuesto'
            : 'Crear corte'
      }
      subtitle={
        editingCut
          ? `${editingCut.cutCode} · cambia ítems o cantidades sin anular el corte`
          : isFinalProposal
            ? `${service.serviceCode} · todo lo pendiente por liberar ya está marcado`
            : service.serviceCode
      }
      submitLabel={
        editingCut
          ? 'Guardar cambios'
          : isFinalProposal
            ? 'Confirmar corte final'
            : 'Crear corte'
      }
      onSubmit={() => void handleSubmit()}
      loading={isLoading}
      submitDisabled={!canSubmit}
      maxWidth='md'
    >
      {willBePartial ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Este corte no libera todo lo pendiente, así que se guardará como{' '}
          <strong>parcial</strong>. Marca todos los ítems con su cantidad
          completa si quieres que sea final.
        </Alert>
      ) : null}
      <FormDialogSection title='Datos del corte'>
        <TextField
          select
          label='Tipo de corte'
          value={cutType}
          onChange={(event) => {
            const nextType = event.target.value as CalibrationServiceCutType
            setCutType(nextType)
            // Un corte final libera todo lo pendiente: se marca y se rellena solo, sin escribirlo a mano
            if (nextType === 'final') {
              setDraftItems((currentItems) =>
                currentItems.map((item) => ({
                  ...item,
                  selected: item.quantityAvailable > 0,
                  quantity: item.quantityAvailable
                }))
              )
            }
          }}
        >
          <MenuItem value='partial'>Parcial</MenuItem>
          <MenuItem value='final'>Final</MenuItem>
        </TextField>
        <TextField
          label='Notas del corte'
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {editingCut ? (
          <TextField
            required
            label='Motivo del cambio'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            helperText='Queda en el historial del servicio.'
            sx={{ gridColumn: { sm: '1 / -1' } }}
          />
        ) : null}
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
