import type { ReactElement } from 'react'
import { Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import LmsStatCard, {
  type LmsStatTone
} from 'src/Components/lms/admin/LmsStatCard'

export interface MonthIndicatorCard {
  label: string
  value: string | number
  icon: ReactElement
  tone: LmsStatTone
  caption?: string
}

export interface MonthIndicatorOption {
  value: string
  name: string
}

interface MonthIndicatorsStripProps {
  periodLabel: string
  cards: MonthIndicatorCard[]
  filterLabel: string
  allLabel: string
  options: MonthIndicatorOption[]
  /** Valor elegido en el filtro; null = todos. */
  filterValue: string | null
  onFilterChange: (value: string | null) => void
}

/**
 * Franja de tarjetas del mes en curso sobre un listado, con un filtro por
 * persona. Es la pieza común de las franjas de cotizaciones, compras y
 * mantenimiento: cada módulo arma sus tarjetas y sus opciones.
 */
const MonthIndicatorsStrip = ({
  periodLabel,
  cards,
  filterLabel,
  allLabel,
  options,
  filterValue,
  onFilterChange
}: MonthIndicatorsStripProps) => (
  <Stack spacing={1.5} sx={{ mb: 3 }}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent='space-between'
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1}
    >
      <Typography variant='subtitle1' fontWeight={700}>
        {`Este mes · ${periodLabel}`}
      </Typography>
      <TextField
        select
        size='small'
        label={filterLabel}
        value={filterValue ?? ''}
        onChange={(event) => onFilterChange(event.target.value || null)}
        SelectProps={{ displayEmpty: true }}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 220 }}
      >
        <MenuItem value=''>{allLabel}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.name}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={6} md={3} key={card.label}>
          <LmsStatCard
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            caption={card.caption}
            compact
          />
        </Grid>
      ))}
    </Grid>
  </Stack>
)

export default MonthIndicatorsStrip
