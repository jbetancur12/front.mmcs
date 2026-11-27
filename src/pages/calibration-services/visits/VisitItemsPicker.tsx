import { Autocomplete, Box, Button, IconButton, Stack } from '@mui/material'
import { TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { CalibrationService } from '../../../types/calibrationService'
import { CalibrationVisit } from '../../../types/calibrationVisit'
import { getEffectiveServiceItemQuantity } from '../detail/calibrationServiceDetailUtils'
import { neutral } from 'src/theme/designTokens'

export interface VisitPickerItem {
  id: number
  /** Número de línea en la orden: distingue ítems con el mismo nombre. */
  line: number
  name: string
  detail: string
  contracted: number
  /** Lo que ninguna otra visita ha calibrado ni tiene planeado. */
  pending: number
}

export const buildPickerItems = (
  service: CalibrationService,
  visits: CalibrationVisit[] = [],
  currentVisitId?: number
): VisitPickerItem[] =>
  (service.items || []).map((item, index) => {
    const contracted = getEffectiveServiceItemQuantity(service, item)
    const taken = visits
      .filter((v) => v.status !== 'cancelled' && v.id !== currentVisitId)
      .reduce((sum, visit) => {
        const entry = visit.items.find((i) => i.itemId === item.id)
        return (
          sum +
          ((visit.status === 'executed'
            ? entry?.executedQuantity
            : entry?.plannedQuantity) || 0)
        )
      }, 0)
    return {
      id: item.id,
      line: index + 1,
      name: item.itemName,
      detail: [item.instrumentName, item.intervalText]
        .filter((text) => text && text !== item.itemName)
        .join(' · '),
      contracted,
      pending: Math.max(contracted - taken, 0)
    }
  })

const describe = (item: VisitPickerItem) =>
  [
    `Línea ${item.line}`,
    item.detail,
    `pendientes ${item.pending} de ${item.contracted}`
  ]
    .filter(Boolean)
    .join(' · ')

interface Props {
  items: VisitPickerItem[]
  selectedIds: number[]
  onAdd: (items: VisitPickerItem[]) => void
  onRemove: (itemId: number) => void
  /** Campos de cantidad de una línea elegida. */
  renderFields: (item: VisitPickerItem) => React.ReactNode
}

/**
 * Elegir líneas de la orden para una visita: se buscan y solo se muestran las elegidas, así una orden de muchas líneas
 * no llena el formulario.
 */
const VisitItemsPicker = ({
  items,
  selectedIds,
  onAdd,
  onRemove,
  renderFields
}: Props) => {
  const selected = items.filter((item) => selectedIds.includes(item.id))
  const available = items.filter((item) => !selectedIds.includes(item.id))
  const withPending = available.filter((item) => item.pending > 0)

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
      >
        <Autocomplete<VisitPickerItem>
          options={available}
          value={null}
          blurOnSelect={false}
          disableCloseOnSelect
          clearOnBlur
          getOptionLabel={(item) => `${item.name} ${describe(item)}`}
          noOptionsText='No quedan líneas por agregar'
          onChange={(_, item) => item && onAdd([item])}
          renderOption={(props, item) => (
            <Box component='li' {...props} key={item.id}>
              <Box>
                <Typography variant='body2'>{item.name}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {describe(item)}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField {...params} label='Buscar equipo de la orden' />
          )}
          sx={{ flex: 1 }}
        />
        {withPending.length > 0 && (
          <Button onClick={() => onAdd(withPending)}>
            {`Agregar pendientes (${withPending.length})`}
          </Button>
        )}
      </Stack>

      {selected.length > 0 && (
        <Box
          sx={{
            maxHeight: 320,
            overflowY: 'auto',
            border: `1px solid ${neutral.border}`,
            borderRadius: 2
          }}
        >
          {selected.map((item) => (
            <Stack
              key={item.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
              sx={{
                px: 1.5,
                py: 1,
                borderBottom: `1px solid ${neutral.border}`,
                '&:last-of-type': { borderBottom: 0 }
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant='body2' fontWeight={600}>
                  {item.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {describe(item)}
                </Typography>
              </Box>
              <Stack direction='row' spacing={1} alignItems='flex-start'>
                {renderFields(item)}
                <IconButton
                  size='small'
                  aria-label={`Quitar línea ${item.line}`}
                  onClick={() => onRemove(item.id)}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Box>
      )}
    </Stack>
  )
}

export default VisitItemsPicker
