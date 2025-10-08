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
  Divider,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
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
    <Card
      elevation={1}
      sx={{
        p: 2,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(109, 198, 98, 0.1)'
      }}
    >
      {/* Header */}
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
        <Box display='flex' alignItems='center' gap={1}>
          <FilterList color='primary' />
          <Typography variant='h6' sx={{ fontSize: '1.125rem' }}>
            Filtros
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              size='small'
              label={activeFiltersCount}
              color='primary'
              variant='filled'
            />
          )}
        </Box>

        {activeFiltersCount > 0 && (
          <Button
            variant='text'
            size='small'
            onClick={handleClearFilters}
            startIcon={<Clear />}
            color='error'
          >
            Limpiar
          </Button>
        )}
      </Box>

      {/* Quick Filters Row - Simplified for Mobile */}
      <Grid container spacing={2} mb={2}>
        {/* Search - Full width on mobile */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size='small'
            id='quick-search-field'
            label='Búsqueda rápida'
            placeholder='Buscar tickets...'
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <Search color='action' sx={{ mr: 1 }} />
            }}
          />
        </Grid>

        {/* Priority - Simplified rendering */}
        <Grid item xs={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Prioridad</InputLabel>
            <Select
              multiple
              value={localFilters.priority || []}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              label='Prioridad'
              renderValue={(selected) => {
                const items = selected as MaintenancePriority[]
                if (items.length === 0) return ''
                if (items.length === 1) return <MaintenancePriorityBadge priority={items[0]} size='small' variant='outlined' />
                return `${items.length} seleccionadas`
              }}
            >
              {Object.values(MaintenancePriority).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  <MaintenancePriorityBadge priority={priority} size='small' />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status - Simplified rendering */}
        <Grid item xs={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Estado</InputLabel>
            <Select
              multiple
              value={localFilters.status || []}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label='Estado'
              renderValue={(selected) => {
                const items = selected as MaintenanceStatus[]
                if (items.length === 0) return ''
                if (items.length === 1) return <MaintenanceStatusBadge status={items[0]} size='small' variant='outlined' />
                return `${items.length} seleccionadas`
              }}
            >
              {Object.values(MaintenanceStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  <MaintenanceStatusBadge status={status} size='small' />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <Box mb={2}>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {localFilters.search && (
              <Chip
                label={`Texto: "${localFilters.search}"`}
                onDelete={() => handleFilterChange('search', '')}
                size="small"
                variant="outlined"
              />
            )}
            {localFilters.priority?.length && (
              <Chip
                label={`Prioridad: ${localFilters.priority.length}`}
                onDelete={() => handleFilterChange('priority', [])}
                size="small"
                variant="outlined"
              />
            )}
            {localFilters.status?.length && (
              <Chip
                label={`Estado: ${localFilters.status.length}`}
                onDelete={() => handleFilterChange('status', [])}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Advanced Filters - Collapsible */}
      <Accordion elevation={0} sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            px: 0,
            minHeight: 'auto',
            '& .MuiAccordionSummary-content': { margin: '8px 0' }
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            Filtros avanzados
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <Grid container spacing={2}>
            {/* Technician Filter */}
            <Grid item xs={12} md={6}>
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
                  <TextField
                    {...params}
                    label='Técnico Asignado'
                  />
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
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                size='small'
                options={equipmentTypes}
                value={localFilters.equipmentType || []}
                onChange={(_, value) => handleFilterChange('equipmentType', value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Tipo de Equipo'
                  />
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size='small'
                id='filter-customer-email'
                label='Email del Cliente'
                value={localFilters.customerEmail || ''}
                onChange={(e) => handleFilterChange('customerEmail', e.target.value)}
                aria-label='Filtrar por email del cliente'
                type='email'
              />
            </Grid>

            {/* Date Range Filters */}
            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
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
        </AccordionDetails>
      </Accordion>

      {/* Results Count */}
      {resultsCount !== undefined && (
        <Box mt={2} textAlign='center'>
          <Typography
            variant='body2'
            color='text.secondary'
            role='status'
            aria-live='polite'
          >
            {resultsCount} resultado{resultsCount !== 1 ? 's' : ''} encontrado{resultsCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Card>
  )
}

export default MaintenanceFilters
