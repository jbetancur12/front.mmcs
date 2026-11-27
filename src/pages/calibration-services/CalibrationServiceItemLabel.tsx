import { Box, Typography } from '@mui/material'
import { CalibrationService } from '../../types/calibrationService'

type ServiceItem = NonNullable<CalibrationService['items']>[number]

/**
 * Número de cada ítem tal como aparece en la cotización (1, 2, 3...), según el
 * orden guardado (`sortOrder`). Se calcula sobre todos los ítems del servicio
 * para que no cambie al filtrar la lista de un diálogo.
 */
export const buildServiceItemNumbers = (
  items: CalibrationService['items'] | undefined
): Map<number, number> => {
  const sorted = [...(items || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
  )
  return new Map(sorted.map((item, index) => [item.id, index + 1]))
}

/** Texto corto que distingue ítems con el mismo nombre: instrumento, rango e intervalo. */
export const getServiceItemDetail = (item: ServiceItem): string => {
  const range =
    typeof item.otherFields?.measurementRange === 'string'
      ? item.otherFields.measurementRange.trim()
      : ''
  const instrument = item.instrumentName?.trim() || ''
  const repeatsName =
    instrument.toLowerCase() === (item.itemName || '').trim().toLowerCase()
  const note = item.notes?.trim()
  return [
    // La nota de la cotización va primero: suele ser lo único que cambia entre líneas iguales (sede, equipo).
    note ? `Nota: ${note}` : '',
    repeatsName ? '' : instrument,
    range ? `Rango: ${range}` : '',
    item.intervalText?.trim()
  ]
    .filter(Boolean)
    .join(' · ')
}

interface CalibrationServiceItemLabelProps {
  number?: number
  name: string
  detail?: string
  selected?: boolean
}

/** Nombre completo del ítem (sin cortar) con su número de cotización y el detalle debajo. */
const CalibrationServiceItemLabel = ({
  number,
  name,
  detail,
  selected = false
}: CalibrationServiceItemLabelProps) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant='body2'
      sx={{ fontWeight: selected ? 600 : 500, overflowWrap: 'anywhere' }}
    >
      {number ? (
        <Box
          component='span'
          sx={{ color: 'brand.ink', fontWeight: 700, mr: 0.75 }}
        >
          N.º {number}
        </Box>
      ) : null}
      {name}
    </Typography>
    {detail ? (
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ display: 'block', overflowWrap: 'anywhere' }}
      >
        {detail}
      </Typography>
    ) : null}
  </Box>
)

export default CalibrationServiceItemLabel
