import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Grid,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  FilterList,
  Clear,
  ExpandMore,
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

  const statusSummary =
    localFilters.status && localFilters.status.length > 0
      ? localFilters.status.length === 1
        ? localFilters.status[0]
        : `${localFilters.status.length} estados`
      : null

  const prioritySummary =
    localFilters.priority && localFilters.priority.length > 0
      ? localFilters.priority.length === 1
        ? localFilters.priority[0]
        : `${localFilters.priority.length} prioridades`
      : null

  return (
    <Card
      sx={{
        p: { xs: 2, md: 2.5 },
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
      }}
    >
      {/* Header */}
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={1.75}
        gap={2}
        flexWrap='wrap'
      >
        <Box display='flex' alignItems='center' gap={1}>
          <FilterList sx={{ color: '#2f7d32' }} />
          <Typography
            variant='h6'
            sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}
          >
            Filtros
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              size='small'
              label={activeFiltersCount}
              sx={{
                height: 24,
                fontWeight: 700,
                backgroundColor: '#10b981',
                color: '#ffffff'
              }}
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
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Limpiar
          </Button>
        )}
      </Box>

      <Grid container spacing={2} alignItems='stretch'>
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#ffffff'
              }
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
                if (items.length === 1) {
                  return (
                    <MaintenancePriorityBadge
                      priority={items[0]}
                      size='small'
                      variant='outlined'
                    />
                  )
                }
                return `${items.length} seleccionadas`
              }}
              sx={{ borderRadius: '12px' }}
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
                if (items.length === 1) {
                  return (
                    <MaintenanceStatusBadge
                      status={items[0]}
                      size='small'
                      variant='outlined'
                    />
                  )
                }
                return `${items.length} seleccionadas`
              }}
              sx={{ borderRadius: '12px' }}
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

      {activeFiltersCount > 0 && (
        <Box
          mt={2}
          mb={1}
          p={1.5}
          sx={{
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb'
          }}
        >
          <Box
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            gap={1.5}
            mb={1}
            flexWrap='wrap'
          >
            <Typography variant='body2' sx={{ fontWeight: 600, color: '#334155' }}>
              Filtros activos
            </Typography>
            {resultsCount !== undefined && (
              <Typography
                variant='caption'
                sx={{ color: '#64748b', fontWeight: 500 }}
                role='status'
                aria-live='polite'
              >
                {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {localFilters.search && (
              <Chip
                label={`Búsqueda: ${localFilters.search}`}
                onDelete={() => handleFilterChange('search', '')}
                size="small"
                variant="outlined"
                sx={{ backgroundColor: '#ffffff' }}
              />
            )}
            {prioritySummary && (
              <Chip
                label={`Prioridad: ${prioritySummary}`}
                onDelete={() => handleFilterChange('priority', [])}
                size="small"
                variant="outlined"
                sx={{ backgroundColor: '#ffffff' }}
              />
            )}
            {statusSummary && (
              <Chip
                label={`Estado: ${statusSummary}`}
                onDelete={() => handleFilterChange('status', [])}
                size="small"
                variant="outlined"
                sx={{ backgroundColor: '#ffffff' }}
              />
            )}
            {localFilters.assignedTechnician?.length ? (
              <Chip
                label={`Técnicos: ${localFilters.assignedTechnician.length} seleccionados`}
                onDelete={() => handleFilterChange('assignedTechnician', [])}
                size='small'
                variant='outlined'
                sx={{ backgroundColor: '#ffffff' }}
              />
            ) : null}
            {localFilters.equipmentType?.length ? (
              <Chip
                label={`Tipo de equipo: ${localFilters.equipmentType.length} seleccionado${localFilters.equipmentType.length > 1 ? 's' : ''}`}
                onDelete={() => handleFilterChange('equipmentType', [])}
                size='small'
                variant='outlined'
                sx={{ backgroundColor: '#ffffff' }}
              />
            ) : null}
            {localFilters.customerEmail && (
              <Chip
                label={`Email: ${localFilters.customerEmail}`}
                onDelete={() => handleFilterChange('customerEmail', '')}
                size='small'
                variant='outlined'
                sx={{ backgroundColor: '#ffffff' }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Advanced Filters - Collapsible */}
      <Accordion
        elevation={0}
        sx={{
          mt: 1,
          borderRadius: '12px !important',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fcfcfd',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            px: 1.5,
            minHeight: 'auto',
            '& .MuiAccordionSummary-content': {
              margin: '10px 0',
              alignItems: 'center'
            }
          }}
        >
          <Box>
            <Typography variant='body2' sx={{ color: '#334155', fontWeight: 600 }}>
              Filtros avanzados
            </Typography>
            <Typography variant='caption' sx={{ color: '#64748b' }}>
              Técnico, equipo, cliente y rango de fechas
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
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
    </Card>
  )
}

export default MaintenanceFilters
