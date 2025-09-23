import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Grid,
  Collapse,
  IconButton,
  Autocomplete,
  Divider
} from '@mui/material'
import {
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Search
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import {
  MaintenanceFilters as IMaintenanceFilters,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceTechnician
} from '../../types/maintenance'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'

interface MaintenanceFiltersProps {
  filters: IMaintenanceFilters
  onFiltersChange: (filters: IMaintenanceFilters) => void
  technicians: MaintenanceTechnician[]
  equipmentTypes: string[]
  loading?: boolean
  resultsCount?: number
}

/**
 * MaintenanceFilters component provides filtering capabilities for maintenance tickets
 *
 * @param filters - Current filter values
 * @param onFiltersChange - Callback when filters change
 * @param technicians - Array of available technicians
 * @param equipmentTypes - Array of available equipment types
 * @param loading - Whether data is loading
 * @param resultsCount - Number of results matching current filters
 */
const MaintenanceFilters: React.FC<MaintenanceFiltersProps> = ({
  filters,
  onFiltersChange,
  technicians,
  equipmentTypes,
  resultsCount
}) => {
  const [expanded, setExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<IMaintenanceFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: keyof IMaintenanceFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: IMaintenanceFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.status?.length) count++
    if (localFilters.priority?.length) count++
    if (localFilters.assignedTechnician?.length) count++
    if (localFilters.equipmentType?.length) count++
    if (localFilters.search) count++
    if (localFilters.customerEmail) count++
    if (localFilters.dateRange) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Box display='flex' alignItems='center' gap={1}>
            <FilterList color='primary' />
            <Typography variant='h6'>Filtros</Typography>
            {activeFiltersCount > 0 && (
              <Chip
                size='small'
                label={activeFiltersCount}
                color='primary'
                variant='outlined'
              />
            )}
          </Box>

          <Box display='flex' alignItems='center' gap={1}>
            {resultsCount !== undefined && (
              <Typography variant='body2' color='text.secondary'>
                {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
              </Typography>
            )}

            <IconButton
              onClick={() => setExpanded(!expanded)}
              size='small'
              color='primary'
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick Search */}
        <Box mb={2}>
          <TextField
            fullWidth
            size='small'
            placeholder='Buscar por número de ticket, cliente, equipo...'
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <Search color='action' sx={{ mr: 1 }} />
            }}
          />
        </Box>

        {/* Expandable Filters */}
        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Estado</InputLabel>
                <Select
                  multiple
                  value={localFilters.status || []}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label='Estado'
                  renderValue={(selected) => (
                    <Box display='flex' flexWrap='wrap' gap={0.5}>
                      {(selected as MaintenanceStatus[]).map((status) => (
                        <MaintenanceStatusBadge
                          key={status}
                          status={status}
                          size='small'
                          variant='outlined'
                        />
                      ))}
                    </Box>
                  )}
                >
                  {Object.values(MaintenanceStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      <MaintenanceStatusBadge status={status} size='small' />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  multiple
                  value={localFilters.priority || []}
                  onChange={(e) =>
                    handleFilterChange('priority', e.target.value)
                  }
                  label='Prioridad'
                  renderValue={(selected) => (
                    <Box display='flex' flexWrap='wrap' gap={0.5}>
                      {(selected as MaintenancePriority[]).map((priority) => (
                        <MaintenancePriorityBadge
                          key={priority}
                          priority={priority}
                          size='small'
                          variant='outlined'
                        />
                      ))}
                    </Box>
                  )}
                >
                  {Object.values(MaintenancePriority).map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      <MaintenancePriorityBadge
                        priority={priority}
                        size='small'
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Technician Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                size='small'
                options={technicians}
                getOptionLabel={(option) => option.name}
                value={
                  technicians.filter((t) =>
                    localFilters.assignedTechnician?.includes(t.id)
                  ) || []
                }
                onChange={(_, value) =>
                  handleFilterChange(
                    'assignedTechnician',
                    value.map((v) => v.id)
                  )
                }
                renderInput={(params) => (
                  <TextField {...params} label='Técnico Asignado' />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size='small'
                      variant='outlined'
                    />
                  ))
                }
              />
            </Grid>

            {/* Equipment Type Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                size='small'
                options={equipmentTypes}
                value={localFilters.equipmentType || []}
                onChange={(_, value) =>
                  handleFilterChange('equipmentType', value)
                }
                renderInput={(params) => (
                  <TextField {...params} label='Tipo de Equipo' />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size='small'
                      variant='outlined'
                    />
                  ))
                }
              />
            </Grid>

            {/* Customer Email Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size='small'
                label='Email del Cliente'
                value={localFilters.customerEmail || ''}
                onChange={(e) =>
                  handleFilterChange('customerEmail', e.target.value)
                }
              />
            </Grid>

            {/* Date Range Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label='Fecha Desde'
                value={
                  localFilters.dateRange?.from
                    ? new Date(localFilters.dateRange.from)
                    : null
                }
                onChange={(date) => {
                  const dateRange = localFilters.dateRange || {}
                  handleFilterChange('dateRange', {
                    ...dateRange,
                    from: date ? date.toISOString() : undefined
                  })
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label='Fecha Hasta'
                value={
                  localFilters.dateRange?.to
                    ? new Date(localFilters.dateRange.to)
                    : null
                }
                onChange={(date) => {
                  const dateRange = localFilters.dateRange || {}
                  handleFilterChange('dateRange', {
                    ...dateRange,
                    to: date ? date.toISOString() : undefined
                  })
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Actions */}
          {activeFiltersCount > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='center'>
                <Button
                  variant='outlined'
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  size='small'
                >
                  Limpiar Filtros
                </Button>
              </Box>
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default MaintenanceFilters
