// components/DeviceIotMap/sidebar/FilterPanel.tsx
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material'
import { FilterState } from '../types'

export const FilterPanel = ({
  filterState,
  onFilterChange
}: {
  filterState: FilterState
  onFilterChange: (type: keyof FilterState, value: any) => void
}) => (
  <>
    <TextField
      fullWidth
      label='Buscar dispositivos'
      value={filterState.searchQuery}
      onChange={(e) => onFilterChange('searchQuery', e.target.value)}
      sx={{ mb: 3 }}
    />

    <Box sx={{ mb: 3 }}>
      <Typography variant='subtitle1'>Estado:</Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={filterState.statuses.has('online')}
            onChange={() =>
              onFilterChange(
                'statuses',
                new Set(
                  filterState.statuses.has('online')
                    ? [...filterState.statuses].filter((s) => s !== 'online')
                    : [...filterState.statuses, 'online']
                )
              )
            }
          />
        }
        label='Online'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={filterState.statuses.has('offline')}
            onChange={() =>
              onFilterChange(
                'statuses',
                new Set(
                  filterState.statuses.has('offline')
                    ? [...filterState.statuses].filter((s) => s !== 'offline')
                    : [...filterState.statuses, 'offline']
                )
              )
            }
          />
        }
        label='Offline'
      />
    </Box>

    <Box sx={{ mb: 3 }}>
      <Typography variant='subtitle1'>Fuente de poder:</Typography>
      {/* Checkboxes para main y bat */}
    </Box>
  </>
)
