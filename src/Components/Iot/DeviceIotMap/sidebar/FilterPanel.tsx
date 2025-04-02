// components/DeviceIotMap/sidebar/FilterPanel.tsx
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Collapse,
  Divider
} from '@mui/material'
import { FilterState } from '../types'
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  Tune
} from '@mui/icons-material'
import { useState } from 'react'

// Componente Chip personalizado con icono y tooltip
const FilterChip = ({
  value,
  icon,
  label,
  tooltip,
  selected,
  onToggle
}: {
  value: string
  icon: string
  label: string
  tooltip: string
  selected: boolean
  onToggle: (value: string) => void
}) => (
  <Tooltip title={tooltip}>
    <Chip
      size='small'
      icon={
        <Box component='span' sx={{ fontSize: '1rem' }}>
          {icon}
        </Box>
      }
      label={label}
      onClick={() => onToggle(value)}
      variant={selected ? 'filled' : 'outlined'}
      sx={{
        '& .MuiChip-label': { fontSize: '0.75rem' },
        minWidth: '70px',
        height: '28px'
      }}
    />
  </Tooltip>
)

const FilterSection = ({
  label,
  options,
  selected,
  onChange
}: {
  label: string
  options: Array<{
    value: string
    icon: string
    label: string
    tooltip: string
  }>
  selected: Set<string>
  onChange: (values: Set<string>) => void
}) => {
  const handleToggle = (value: string) => {
    const newSet = new Set(selected)
    newSet.has(value) ? newSet.delete(value) : newSet.add(value)
    onChange(newSet)
  }

  return (
    <Box mb={2}>
      <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
        {label}
      </Box>
      <Stack direction='row' flexWrap='wrap' gap={1}>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            value={option.value}
            icon={option.icon}
            label={option.label}
            tooltip={option.tooltip}
            selected={selected.has(option.value)}
            onToggle={handleToggle}
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
}) => {
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  return (
    <Box className='mt-4'>
      {/* Header con botón de colapsar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Buscar...'
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search fontSize='small' />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Tooltip
          title={filtersCollapsed ? 'Mostrar filtros' : 'Ocultar filtros'}
        >
          <IconButton
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            sx={{ ml: 1 }}
            aria-label='toggle-filters'
          >
            {filtersCollapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
            <Tune sx={{ fontSize: '1rem', ml: 0.5 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filtros colapsables */}
      <Collapse in={!filtersCollapsed}>
        <Box
          p={2}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          {/* Estado */}
          <FilterSection
            label='Estado'
            options={[
              {
                value: 'online',
                icon: '🌐',
                label: 'Online',
                tooltip: 'Dispositivos conectados'
              },
              {
                value: 'offline',
                icon: '⚫',
                label: 'Offline',
                tooltip: 'Dispositivos sin conexión'
              }
            ]}
            selected={filterState.statuses}
            onChange={(value) => onFilterChange('statuses', value)}
          />

          {/* Fuente de energía */}
          <FilterSection
            label='Energía'
            options={[
              {
                value: 'main',
                icon: '⚡',
                label: 'Red',
                tooltip: 'Alimentación por red eléctrica'
              },
              {
                value: 'bat',
                icon: '🔋',
                label: 'Batería',
                tooltip: 'Alimentación por batería'
              }
            ]}
            selected={filterState.powerSources}
            onChange={(value) => onFilterChange('powerSources', value)}
          />

          <Divider
            orientation='horizontal'
            sx={{
              mb: 1
            }}
          />
          {/* Alarmas */}
          <Box mb={2}>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
              Alarmas
            </Box>
            <Stack direction='row' flexWrap='wrap' gap={1}>
              {/* Cualquier Alarma */}
              <FilterChip
                value='any'
                icon='🔔'
                label='Todas'
                tooltip='Mostrar dispositivos con cualquier alarma'
                selected={filterState.withAnyAlarm}
                onToggle={() => {
                  onFilterChange('withAnyAlarm', !filterState.withAnyAlarm)
                  onFilterChange('alarmSeverities', new Set())
                }}
              />

              {/* Severidades */}
              <FilterSection
                label=''
                options={[
                  {
                    value: 'information',
                    icon: 'ℹ️',
                    label: 'Info',
                    tooltip: 'Alarmas informativas'
                  },
                  {
                    value: 'warning',
                    icon: '⚠️',
                    label: 'Alerta',
                    tooltip: 'Alarmas de advertencia'
                  },
                  {
                    value: 'critical',
                    icon: '🛑',
                    label: 'Crítica',
                    tooltip: 'Alarmas críticas'
                  }
                ]}
                selected={filterState.alarmSeverities}
                onChange={(value) => {
                  onFilterChange('alarmSeverities', value)
                  if (value.size > 0) onFilterChange('withAnyAlarm', false)
                }}
              />
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}
