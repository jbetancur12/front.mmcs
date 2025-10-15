// Advanced Filters Component for Templates Table
import React, { useState } from 'react'
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Collapse,
  IconButton,
  Divider
} from '@mui/material'
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { TemplatesData } from './types'

export interface FilterOptions {
  searchFields: string[]
  sortBy: keyof TemplatesData | 'all'
  hasDescription: 'all' | 'yes' | 'no'
  hasPassword: 'all' | 'yes' | 'no'
}

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  templates?: TemplatesData[] // Opcional ya que no se usa actualmente
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange
  // templates, // No se usa actualmente
}) => {
  const [expanded, setExpanded] = useState(false)

  const handleFilterChange =
    (key: keyof FilterOptions) => (event: SelectChangeEvent<any>) => {
      onFiltersChange({
        ...filters,
        [key]: event.target.value
      })
    }

  const handleSearchFieldsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[]
    onFiltersChange({
      ...filters,
      searchFields: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      searchFields: [
        'name',
        'description',
        'city',
        'location',
        'sede',
        'instrumento'
      ],
      sortBy: 'all',
      hasDescription: 'all',
      hasPassword: 'all'
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.sortBy !== 'all') count++
    if (filters.hasDescription !== 'all') count++
    if (filters.hasPassword !== 'all') count++
    if (filters.searchFields.length < 6) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Box sx={{ marginBottom: 2 }}>
      {/* Filter Toggle Button */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}
      >
        <IconButton
          onClick={() => setExpanded(!expanded)}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <ExpandMoreIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color='action' />
          <Typography variant='body2' color='text.secondary'>
            Filtros Avanzados
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size='small'
              color='primary'
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          )}
        </Box>

        {activeFiltersCount > 0 && (
          <IconButton
            size='small'
            onClick={clearAllFilters}
            title='Limpiar filtros'
          >
            <ClearIcon fontSize='small' />
          </IconButton>
        )}
      </Box>

      {/* Filters Panel */}
      <Collapse in={expanded}>
        <Box
          sx={{
            padding: 3,
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 600 }}>
            Configurar Filtros de Búsqueda
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 3
            }}
          >
            {/* Search Fields Filter */}
            <FormControl size='small' fullWidth>
              <InputLabel>Campos de Búsqueda</InputLabel>
              <Select
                multiple
                value={filters.searchFields}
                onChange={handleSearchFieldsChange}
                label='Campos de Búsqueda'
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={getFieldLabel(value)}
                        size='small'
                      />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value='name'>Nombre</MenuItem>
                <MenuItem value='description'>Descripción</MenuItem>
                <MenuItem value='city'>Ciudad</MenuItem>
                <MenuItem value='location'>Ubicación</MenuItem>
                <MenuItem value='sede'>Sede</MenuItem>
                <MenuItem value='instrumento'>Instrumento</MenuItem>
                <MenuItem value='solicitante'>Solicitante</MenuItem>
                <MenuItem value='activoFijo'>Activo Fijo</MenuItem>
                <MenuItem value='serie'>Serie</MenuItem>
                <MenuItem value='calibrationDate'>Fecha Calibración</MenuItem>
              </Select>
            </FormControl>

            {/* Has Description Filter */}
            <FormControl size='small' fullWidth>
              <InputLabel>Con Descripción</InputLabel>
              <Select
                value={filters.hasDescription}
                onChange={handleFilterChange('hasDescription')}
                label='Con Descripción'
              >
                <MenuItem value='all'>Todas</MenuItem>
                <MenuItem value='yes'>Con descripción</MenuItem>
                <MenuItem value='no'>Sin descripción</MenuItem>
              </Select>
            </FormControl>

            {/* Has Password Filter */}
            <FormControl size='small' fullWidth>
              <InputLabel>Con Contraseña</InputLabel>
              <Select
                value={filters.hasPassword}
                onChange={handleFilterChange('hasPassword')}
                label='Con Contraseña'
              >
                <MenuItem value='all'>Todas</MenuItem>
                <MenuItem value='yes'>Protegidas</MenuItem>
                <MenuItem value='no'>Sin protección</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ marginY: 2 }} />

          {/* Filter Summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              Mostrando plantillas que coincidan con los filtros seleccionados
            </Typography>
            {activeFiltersCount > 0 && (
              <Typography
                variant='body2'
                color='primary.main'
                sx={{ fontWeight: 500 }}
              >
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}{' '}
                activo{activeFiltersCount > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}

// Helper function to get field labels
const getFieldLabel = (field: string): string => {
  const labels: { [key: string]: string } = {
    name: 'Nombre',
    description: 'Descripción',
    city: 'Ciudad',
    location: 'Ubicación',
    sede: 'Sede',
    instrumento: 'Instrumento',
    solicitante: 'Solicitante',
    activoFijo: 'Activo Fijo',
    serie: 'Serie',
    calibrationDate: 'Fecha Calibración'
  }
  return labels[field] || field
}

export default AdvancedFilters
