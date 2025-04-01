// components/DeviceIotMap/sidebar/FilterPanel.tsx
import { Box, TextField, InputAdornment, Chip, Stack } from '@mui/material'
import { FilterState } from '../types'
import { Search } from '@mui/icons-material'

const FilterSection = ({
  label,
  options,
  selected,
  onChange,
  allLabel = 'Todos'
}: {
  label: string
  options: string[]
  selected: Set<string>
  onChange: (values: Set<string>) => void
  allLabel?: string
}) => {
  const allSelected = options.every((opt) => selected.has(opt))

  const handleToggle = (value: string) => {
    const newSet = new Set(selected)
    newSet.has(value) ? newSet.delete(value) : newSet.add(value)
    onChange(newSet)
  }

  const handleToggleAll = () => {
    onChange(allSelected ? new Set() : new Set(options))
  }

  return (
    <Box mb={2}>
      <Box
        sx={{
          fontSize: '0.875rem',
          color: 'text.secondary',
          mb: 1
        }}
      >
        {label}
      </Box>
      <Stack direction='row' flexWrap='wrap' gap={1}>
        <Chip
          label={allLabel}
          size='small'
          variant={allSelected ? 'filled' : 'outlined'}
          color={allSelected ? 'primary' : 'default'}
          onClick={handleToggleAll}
        />
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            onClick={() => handleToggle(option)}
            color={selected.has(option) ? 'primary' : 'default'}
            variant={selected.has(option) ? 'filled' : 'outlined'}
            size='small'
            sx={{
              '& .MuiChip-label': { fontSize: '0.75rem' },
              height: '24px'
            }}
          />
        ))}
      </Stack>
    </Box>
  )
}

export const FilterPanel = ({
  filterState,
  onFilterChange
}: {
  filterState: FilterState
  onFilterChange: (type: keyof FilterState, value: any) => void
}) => (
  <Box className='mt-4'>
    <Box className='relative'>
      <TextField
        fullWidth
        size='small'
        placeholder='Buscar dispositivos'
        value={filterState.searchQuery}
        onChange={(e) => onFilterChange('searchQuery', e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search fontSize='small' />
            </InputAdornment>
          )
        }}
      />
    </Box>

    <Box p={2}>
      <FilterSection
        label='Estado'
        options={['online', 'offline']}
        selected={filterState.statuses}
        onChange={(value) => onFilterChange('statuses', value)}
        allLabel='Todos'
      />

      <FilterSection
        label='Fuente de energía'
        options={['main', 'bat']}
        selected={filterState.powerSources}
        onChange={(value) => onFilterChange('powerSources', value)}
        allLabel='Todas'
      />

      <FilterSection
        label='Severidad de alarmas'
        options={['information', 'warning', 'critical']}
        selected={filterState.alarmSeverities}
        onChange={(value) => onFilterChange('alarmSeverities', value)}
        allLabel='Cualquier Alarma'
      />
    </Box>
  </Box>
)
